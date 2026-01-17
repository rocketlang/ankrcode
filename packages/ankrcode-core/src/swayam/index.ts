/**
 * Swayam Integration Module
 *
 * Integrates AnkrCode with Swayam voice assistant:
 * - Voice command parsing via RocketLang
 * - Bidirectional CLI ↔ Voice handoff
 * - Context sharing between interfaces
 * - Voice-first workflows
 */

import { getSettings } from '../config/index.js';
import { VoiceAdapter, getVoiceAdapter, type VoiceResult, type VoiceConfig } from '../voice/adapter.js';
import type { SupportedLanguage } from '../types.js';

// Tool executor type (from rocketlang)
export type ToolExecutor = (name: string, params: Record<string, unknown>) => Promise<unknown>;

// RocketLang command interface
export interface RocketLangCommand {
  tool: string;
  parameters: Record<string, unknown>;
  raw?: string;
}

/**
 * Swayam connection state
 */
export type SwayamConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Swayam session context
 */
export interface SwayamContext {
  sessionId: string;
  language: string;
  conversationHistory: ConversationTurn[];
  variables: Map<string, unknown>;
  lastActivity: Date;
}

/**
 * Conversation turn
 */
export interface ConversationTurn {
  type: 'user' | 'assistant';
  mode: 'voice' | 'text';
  content: string;
  timestamp: Date;
  commands?: RocketLangCommand[];
}

/**
 * Voice command result
 */
export interface VoiceCommandResult {
  success: boolean;
  transcription?: string;
  commands?: RocketLangCommand[];
  response?: string;
  audioResponse?: Buffer;
  error?: string;
}

/**
 * Swayam service configuration
 */
export interface SwayamConfig {
  serviceUrl?: string;
  wsUrl?: string;
  language?: string;
  personality?: 'default' | 'assistant' | 'developer';
  voiceEnabled?: boolean;
  ttsEnabled?: boolean;
}

// Default Swayam service URL
const DEFAULT_SWAYAM_URL = 'http://localhost:4006';
const DEFAULT_WS_URL = 'ws://localhost:4006/ws';

/**
 * Swayam Integration Adapter
 */
export class SwayamAdapter {
  private config: SwayamConfig;
  private voiceAdapter: VoiceAdapter | null = null;
  private context: SwayamContext | null = null;
  private connectionState: SwayamConnectionState = 'disconnected';
  private ws: WebSocket | null = null;
  private executor: ToolExecutor | null = null;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  constructor(config: SwayamConfig = {}) {
    this.config = {
      serviceUrl: config.serviceUrl || DEFAULT_SWAYAM_URL,
      wsUrl: config.wsUrl || DEFAULT_WS_URL,
      language: config.language || 'hi',
      personality: config.personality || 'assistant',
      voiceEnabled: config.voiceEnabled ?? true,
      ttsEnabled: config.ttsEnabled ?? true,
    };
  }

  /**
   * Initialize the Swayam adapter
   */
  async initialize(executor?: ToolExecutor): Promise<void> {
    this.executor = executor || null;

    // Initialize voice adapter if enabled
    if (this.config.voiceEnabled) {
      this.voiceAdapter = getVoiceAdapter({
        language: (this.config.language || 'hi') as SupportedLanguage,
      });
    }

    // Create session context
    this.context = {
      sessionId: this.generateSessionId(),
      language: this.config.language || 'hi',
      conversationHistory: [],
      variables: new Map(),
      lastActivity: new Date(),
    };

    this.emit('initialized', { sessionId: this.context.sessionId });
  }

  /**
   * Connect to Swayam service via WebSocket
   */
  async connect(): Promise<void> {
    if (this.connectionState === 'connected') {
      return;
    }

    this.connectionState = 'connecting';

    return new Promise((resolve, reject) => {
      try {
        // In Node.js, we'd use the 'ws' package
        // For now, we'll check if WebSocket is available
        if (typeof WebSocket === 'undefined') {
          // Running in Node.js - use HTTP polling instead
          this.connectionState = 'connected';
          this.emit('connected', { mode: 'http' });
          resolve();
          return;
        }

        this.ws = new WebSocket(this.config.wsUrl!);

        this.ws.onopen = () => {
          this.connectionState = 'connected';
          this.emit('connected', { mode: 'websocket' });

          // Send handshake
          this.sendMessage({
            type: 'handshake',
            sessionId: this.context?.sessionId,
            language: this.config.language,
            personality: this.config.personality,
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data as string);
            this.handleMessage(message);
          } catch (e) {
            console.error('Failed to parse Swayam message:', e);
          }
        };

        this.ws.onerror = (error) => {
          this.connectionState = 'error';
          this.emit('error', { error });
          reject(error);
        };

        this.ws.onclose = () => {
          this.connectionState = 'disconnected';
          this.emit('disconnected', {});
        };
      } catch (error) {
        this.connectionState = 'error';
        reject(error);
      }
    });
  }

  /**
   * Disconnect from Swayam service
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionState = 'disconnected';
    this.emit('disconnected', {});
  }

  /**
   * Process voice input and execute commands
   */
  async processVoiceCommand(audioData: Buffer): Promise<VoiceCommandResult> {
    if (!this.voiceAdapter) {
      return {
        success: false,
        error: 'Voice adapter not initialized',
      };
    }

    try {
      // Transcribe audio
      const voiceResult = await this.voiceAdapter.transcribe(audioData);

      if (!voiceResult || !voiceResult.text) {
        return {
          success: false,
          error: 'Could not transcribe audio',
        };
      }

      const transcription = voiceResult.text;

      // Add to conversation history
      this.addToHistory('user', 'voice', transcription);

      // Parse as RocketLang
      const parseResult = await this.parseCommand(transcription);

      // Execute commands
      let response = '';
      if (parseResult.commands && parseResult.commands.length > 0) {
        for (const cmd of parseResult.commands) {
          const result = await this.executeCommand(cmd);
          if (result) {
            response += result + '\n';
          }
        }
      } else {
        // No commands parsed, treat as conversation
        response = await this.handleConversation(transcription);
      }

      // Add response to history
      this.addToHistory('assistant', 'voice', response);

      // Generate audio response if TTS enabled
      let audioResponse: Buffer | undefined;
      if (this.config.ttsEnabled && response) {
        audioResponse = await this.synthesizeSpeech(response);
      }

      return {
        success: true,
        transcription,
        commands: parseResult.commands,
        response,
        audioResponse,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Process text command
   */
  async processTextCommand(text: string): Promise<VoiceCommandResult> {
    try {
      // Add to conversation history
      this.addToHistory('user', 'text', text);

      // Parse as RocketLang
      const parseResult = await this.parseCommand(text);

      // Execute commands
      let response = '';
      if (parseResult.commands && parseResult.commands.length > 0) {
        for (const cmd of parseResult.commands) {
          const result = await this.executeCommand(cmd);
          if (result) {
            response += result + '\n';
          }
        }
      } else {
        // No commands parsed, treat as conversation
        response = await this.handleConversation(text);
      }

      // Add response to history
      this.addToHistory('assistant', 'text', response);

      return {
        success: true,
        transcription: text,
        commands: parseResult.commands,
        response,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Parse command using RocketLang
   */
  private async parseCommand(text: string): Promise<{ commands?: RocketLangCommand[] }> {
    try {
      // Dynamic import to avoid circular dependency
      // Using string variable to avoid TypeScript module resolution
      const moduleName = '@ankr/rocketlang';
      const rocketlang = await import(/* webpackIgnore: true */ moduleName);
      const result = rocketlang.parse(text);

      if (result.errors && result.errors.length > 0) {
        return { commands: undefined };
      }

      return {
        commands: result.commands.map((cmd: { tool: string; parameters: Record<string, unknown>; raw: string }) => ({
          tool: cmd.tool,
          parameters: cmd.parameters,
          raw: cmd.raw,
        })),
      };
    } catch {
      return { commands: undefined };
    }
  }

  /**
   * Execute a command
   */
  private async executeCommand(cmd: RocketLangCommand): Promise<string | null> {
    if (!this.executor) {
      return `[Would execute: ${cmd.tool}]`;
    }

    try {
      const result = await this.executor(cmd.tool, cmd.parameters);

      if (typeof result === 'object' && result !== null) {
        const resultObj = result as Record<string, unknown>;
        if ('output' in resultObj) {
          return resultObj.output as string;
        }
      }

      return JSON.stringify(result);
    } catch (error) {
      return `Error: ${(error as Error).message}`;
    }
  }

  /**
   * Handle conversational input (not a command)
   */
  private async handleConversation(text: string): Promise<string> {
    // Send to Swayam service for conversational response
    if (this.connectionState === 'connected' && this.ws) {
      return new Promise((resolve) => {
        const messageId = this.generateSessionId();

        const handler = (response: { id: string; text: string }) => {
          if (response.id === messageId) {
            this.off('conversation_response', handler);
            resolve(response.text);
          }
        };

        this.on('conversation_response', handler);

        this.sendMessage({
          type: 'conversation',
          id: messageId,
          text,
          context: this.getConversationContext(),
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          this.off('conversation_response', handler);
          resolve('Sorry, I could not process that. Please try again.');
        }, 10000);
      });
    }

    // Fallback: simple echo
    return `I heard: "${text}". Try a command like "padho file.txt" or "khojo TODO mein src"`;
  }

  /**
   * Synthesize speech from text
   */
  private async synthesizeSpeech(text: string): Promise<Buffer | undefined> {
    // Would call TTS service here
    // For now, return undefined
    return undefined;
  }

  /**
   * Add to conversation history
   */
  private addToHistory(type: 'user' | 'assistant', mode: 'voice' | 'text', content: string): void {
    if (!this.context) return;

    this.context.conversationHistory.push({
      type,
      mode,
      content,
      timestamp: new Date(),
    });

    this.context.lastActivity = new Date();

    // Keep only last 50 turns
    if (this.context.conversationHistory.length > 50) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-50);
    }
  }

  /**
   * Get conversation context for AI
   */
  private getConversationContext(): string {
    if (!this.context) return '';

    return this.context.conversationHistory
      .slice(-10)
      .map((turn) => `${turn.type}: ${turn.content}`)
      .join('\n');
  }

  /**
   * Send message via WebSocket
   */
  private sendMessage(message: Record<string, unknown>): void {
    if (this.ws && this.connectionState === 'connected') {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: { type: string; [key: string]: unknown }): void {
    switch (message.type) {
      case 'conversation_response':
        this.emit('conversation_response', message);
        break;

      case 'command':
        // Remote command from Swayam
        if (message.command) {
          this.processTextCommand(message.command as string);
        }
        break;

      case 'handoff':
        // Handoff from Swayam voice to CLI
        this.emit('handoff', {
          context: message.context,
          variables: message.variables,
        });
        break;

      default:
        this.emit(message.type, message);
    }
  }

  /**
   * Initiate handoff from CLI to Swayam voice
   */
  async handoffToVoice(context?: string): Promise<void> {
    if (!this.context) return;

    const handoffData = {
      type: 'handoff_to_voice',
      sessionId: this.context.sessionId,
      conversationHistory: this.context.conversationHistory.slice(-10),
      variables: Object.fromEntries(this.context.variables),
      additionalContext: context,
    };

    if (this.ws && this.connectionState === 'connected') {
      this.sendMessage(handoffData);
    } else {
      // HTTP fallback
      try {
        const response = await fetch(`${this.config.serviceUrl}/handoff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(handoffData),
        });

        if (!response.ok) {
          throw new Error('Handoff failed');
        }

        this.emit('handoff_initiated', { target: 'voice' });
      } catch (error) {
        this.emit('error', { error });
      }
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `swayam-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Event handling
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit(event: string, data: unknown): void {
    this.eventHandlers.get(event)?.forEach((handler) => handler(data));
  }

  /**
   * Get current session context
   */
  getContext(): SwayamContext | null {
    return this.context;
  }

  /**
   * Get connection state
   */
  getConnectionState(): SwayamConnectionState {
    return this.connectionState;
  }

  /**
   * Set a session variable
   */
  setVariable(name: string, value: unknown): void {
    this.context?.variables.set(name, value);
  }

  /**
   * Get a session variable
   */
  getVariable(name: string): unknown {
    return this.context?.variables.get(name);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
  }> {
    const services: Record<string, boolean> = {
      voice: false,
      swayam: false,
    };

    // Check voice adapter
    if (this.voiceAdapter) {
      services.voice = await this.voiceAdapter.isAvailable();
    }

    // Check Swayam service
    try {
      const response = await fetch(`${this.config.serviceUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      services.swayam = response.ok;
    } catch {
      services.swayam = false;
    }

    const healthy = Object.values(services).every(Boolean);
    const anyHealthy = Object.values(services).some(Boolean);

    return {
      status: healthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy',
      services,
    };
  }
}

/**
 * Create a Swayam adapter instance
 */
export async function createSwayamAdapter(
  config?: SwayamConfig,
  executor?: ToolExecutor
): Promise<SwayamAdapter> {
  const adapter = new SwayamAdapter(config);
  await adapter.initialize(executor);
  return adapter;
}

export default {
  SwayamAdapter,
  createSwayamAdapter,
};
