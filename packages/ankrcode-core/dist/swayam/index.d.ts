/**
 * Swayam Integration Module
 *
 * Integrates AnkrCode with Swayam voice assistant:
 * - Voice command parsing via RocketLang
 * - Bidirectional CLI ↔ Voice handoff
 * - Context sharing between interfaces
 * - Voice-first workflows
 */
export type ToolExecutor = (name: string, params: Record<string, unknown>) => Promise<unknown>;
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
/**
 * Swayam Integration Adapter
 */
export declare class SwayamAdapter {
    private config;
    private voiceAdapter;
    private context;
    private connectionState;
    private ws;
    private executor;
    private eventHandlers;
    constructor(config?: SwayamConfig);
    /**
     * Initialize the Swayam adapter
     */
    initialize(executor?: ToolExecutor): Promise<void>;
    /**
     * Connect to Swayam service via WebSocket
     */
    connect(): Promise<void>;
    /**
     * Disconnect from Swayam service
     */
    disconnect(): void;
    /**
     * Process voice input and execute commands
     */
    processVoiceCommand(audioData: Buffer): Promise<VoiceCommandResult>;
    /**
     * Process text command
     */
    processTextCommand(text: string): Promise<VoiceCommandResult>;
    /**
     * Parse command using RocketLang
     */
    private parseCommand;
    /**
     * Execute a command
     */
    private executeCommand;
    /**
     * Handle conversational input (not a command)
     */
    private handleConversation;
    /**
     * Synthesize speech from text
     */
    private synthesizeSpeech;
    /**
     * Add to conversation history
     */
    private addToHistory;
    /**
     * Get conversation context for AI
     */
    private getConversationContext;
    /**
     * Send message via WebSocket
     */
    private sendMessage;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Initiate handoff from CLI to Swayam voice
     */
    handoffToVoice(context?: string): Promise<void>;
    /**
     * Generate session ID
     */
    private generateSessionId;
    /**
     * Event handling
     */
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
    private emit;
    /**
     * Get current session context
     */
    getContext(): SwayamContext | null;
    /**
     * Get connection state
     */
    getConnectionState(): SwayamConnectionState;
    /**
     * Set a session variable
     */
    setVariable(name: string, value: unknown): void;
    /**
     * Get a session variable
     */
    getVariable(name: string): unknown;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: Record<string, boolean>;
    }>;
}
/**
 * Create a Swayam adapter instance
 */
export declare function createSwayamAdapter(config?: SwayamConfig, executor?: ToolExecutor): Promise<SwayamAdapter>;
declare const _default: {
    SwayamAdapter: typeof SwayamAdapter;
    createSwayamAdapter: typeof createSwayamAdapter;
};
export default _default;
//# sourceMappingURL=index.d.ts.map