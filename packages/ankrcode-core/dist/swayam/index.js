/**
 * Swayam Integration Module
 *
 * Integrates AnkrCode with Swayam voice assistant:
 * - Voice command parsing via RocketLang
 * - Bidirectional CLI ↔ Voice handoff
 * - Context sharing between interfaces
 * - Voice-first workflows
 */
import { getVoiceAdapter } from '../voice/adapter.js';
// Default Swayam service URL
const DEFAULT_SWAYAM_URL = 'http://localhost:4006';
const DEFAULT_WS_URL = 'ws://localhost:4006/ws';
/**
 * Swayam Integration Adapter
 */
export class SwayamAdapter {
    config;
    voiceAdapter = null;
    context = null;
    connectionState = 'disconnected';
    ws = null;
    executor = null;
    eventHandlers = new Map();
    constructor(config = {}) {
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
    async initialize(executor) {
        this.executor = executor || null;
        // Initialize voice adapter if enabled
        if (this.config.voiceEnabled) {
            this.voiceAdapter = getVoiceAdapter({
                language: (this.config.language || 'hi'),
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
    async connect() {
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
                this.ws = new WebSocket(this.config.wsUrl);
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
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                    }
                    catch (e) {
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
            }
            catch (error) {
                this.connectionState = 'error';
                reject(error);
            }
        });
    }
    /**
     * Disconnect from Swayam service
     */
    disconnect() {
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
    async processVoiceCommand(audioData) {
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
            }
            else {
                // No commands parsed, treat as conversation
                response = await this.handleConversation(transcription);
            }
            // Add response to history
            this.addToHistory('assistant', 'voice', response);
            // Generate audio response if TTS enabled
            let audioResponse;
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Process text command
     */
    async processTextCommand(text) {
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
            }
            else {
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Parse command using RocketLang
     */
    async parseCommand(text) {
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
                commands: result.commands.map((cmd) => ({
                    tool: cmd.tool,
                    parameters: cmd.parameters,
                    raw: cmd.raw,
                })),
            };
        }
        catch {
            return { commands: undefined };
        }
    }
    /**
     * Execute a command
     */
    async executeCommand(cmd) {
        if (!this.executor) {
            return `[Would execute: ${cmd.tool}]`;
        }
        try {
            const result = await this.executor(cmd.tool, cmd.parameters);
            if (typeof result === 'object' && result !== null) {
                const resultObj = result;
                if ('output' in resultObj) {
                    return resultObj.output;
                }
            }
            return JSON.stringify(result);
        }
        catch (error) {
            return `Error: ${error.message}`;
        }
    }
    /**
     * Handle conversational input (not a command)
     */
    async handleConversation(text) {
        // Send to Swayam service for conversational response
        if (this.connectionState === 'connected' && this.ws) {
            return new Promise((resolve) => {
                const messageId = this.generateSessionId();
                const handler = (response) => {
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
    async synthesizeSpeech(text) {
        // Would call TTS service here
        // For now, return undefined
        return undefined;
    }
    /**
     * Add to conversation history
     */
    addToHistory(type, mode, content) {
        if (!this.context)
            return;
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
    getConversationContext() {
        if (!this.context)
            return '';
        return this.context.conversationHistory
            .slice(-10)
            .map((turn) => `${turn.type}: ${turn.content}`)
            .join('\n');
    }
    /**
     * Send message via WebSocket
     */
    sendMessage(message) {
        if (this.ws && this.connectionState === 'connected') {
            this.ws.send(JSON.stringify(message));
        }
    }
    /**
     * Handle incoming message
     */
    handleMessage(message) {
        switch (message.type) {
            case 'conversation_response':
                this.emit('conversation_response', message);
                break;
            case 'command':
                // Remote command from Swayam
                if (message.command) {
                    this.processTextCommand(message.command);
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
    async handoffToVoice(context) {
        if (!this.context)
            return;
        const handoffData = {
            type: 'handoff_to_voice',
            sessionId: this.context.sessionId,
            conversationHistory: this.context.conversationHistory.slice(-10),
            variables: Object.fromEntries(this.context.variables),
            additionalContext: context,
        };
        if (this.ws && this.connectionState === 'connected') {
            this.sendMessage(handoffData);
        }
        else {
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
            }
            catch (error) {
                this.emit('error', { error });
            }
        }
    }
    /**
     * Generate session ID
     */
    generateSessionId() {
        return `swayam-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Event handling
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }
    off(event, handler) {
        this.eventHandlers.get(event)?.delete(handler);
    }
    emit(event, data) {
        this.eventHandlers.get(event)?.forEach((handler) => handler(data));
    }
    /**
     * Get current session context
     */
    getContext() {
        return this.context;
    }
    /**
     * Get connection state
     */
    getConnectionState() {
        return this.connectionState;
    }
    /**
     * Set a session variable
     */
    setVariable(name, value) {
        this.context?.variables.set(name, value);
    }
    /**
     * Get a session variable
     */
    getVariable(name) {
        return this.context?.variables.get(name);
    }
    /**
     * Health check
     */
    async healthCheck() {
        const services = {
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
        }
        catch {
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
export async function createSwayamAdapter(config, executor) {
    const adapter = new SwayamAdapter(config);
    await adapter.initialize(executor);
    return adapter;
}
export default {
    SwayamAdapter,
    createSwayamAdapter,
};
//# sourceMappingURL=index.js.map