/**
 * Conversation Manager
 * Handles multi-turn conversations with tool execution
 * Now with persistence via EON Memory
 */
import type { Message, SupportedLanguage, Todo } from '../types.js';
interface ConversationConfig {
    model?: string;
    provider?: string;
    language: SupportedLanguage;
    personality: 'default' | 'swayam';
    offline?: boolean;
    verbose?: boolean;
    strategy?: 'primary' | 'cheapest' | 'fastest' | 'quality';
    sessionId?: string;
    autoSave?: boolean;
    persistenceEnabled?: boolean;
}
interface SavedConversation {
    sessionId: string;
    config: Omit<ConversationConfig, 'sessionId'>;
    messages: Message[];
    todos: Todo[];
    mode: 'execute' | 'plan';
    filesRead: string[];
    createdAt: string;
    updatedAt: string;
    messageCount: number;
    summary?: string;
}
/**
 * ConversationManager - Orchestrates AI conversations with tool use
 * Now with persistence support via EON Memory
 */
export declare class ConversationManager {
    private config;
    private state;
    private aiAdapter;
    private sessionId;
    private createdAt;
    private eonAdapter;
    constructor(config: ConversationConfig);
    /**
     * Generate a unique session ID
     */
    private generateSessionId;
    /**
     * Get current session ID
     */
    getSessionId(): string;
    /**
     * Process a user message and return the assistant's response
     */
    chat(userMessage: string): Promise<string>;
    /**
     * Call the LLM with current conversation state
     */
    private callLLM;
    /**
     * Map model shorthand to provider
     */
    private mapModelToProvider;
    /**
     * Call local model (Ollama)
     */
    private callLocalModel;
    /**
     * Execute tool calls
     */
    private executeToolCalls;
    /**
     * Build system prompt based on configuration
     */
    private buildSystemPrompt;
    private getDefaultPrompt;
    private getSwayamPrompt;
    /**
     * Get tool definitions from registry
     */
    private getToolDefinitions;
    getTodos(): Todo[];
    setTodos(todos: Todo[]): void;
    getMode(): 'execute' | 'plan';
    setMode(mode: 'execute' | 'plan'): void;
    hasReadFile(path: string): boolean;
    /**
     * Get available LLM providers
     */
    getAvailableProviders(): string[];
    /**
     * Check if ai-router is available
     */
    isRouterAvailable(): boolean;
    /**
     * Save conversation to EON Memory
     */
    saveConversation(): Promise<boolean>;
    /**
     * Load conversation from EON Memory
     */
    loadConversation(sessionId: string): Promise<boolean>;
    /**
     * List saved conversations
     */
    listConversations(): Promise<Array<{
        sessionId: string;
        summary: string;
        messageCount: number;
        createdAt: string;
        updatedAt: string;
        language: SupportedLanguage;
    }>>;
    /**
     * Delete a saved conversation
     * Note: EON doesn't have delete, so we mark it as deleted
     */
    deleteConversation(sessionId: string): Promise<boolean>;
    /**
     * Generate a summary of the conversation
     */
    private generateSummary;
    /**
     * Export conversation to JSON
     */
    exportToJSON(): string;
    /**
     * Import conversation from JSON
     */
    importFromJSON(json: string): boolean;
    /**
     * Get conversation statistics
     */
    getStats(): {
        sessionId: string;
        messageCount: number;
        userMessages: number;
        assistantMessages: number;
        toolCalls: number;
        duration: number;
        language: SupportedLanguage;
    };
    /**
     * Clear conversation history (start fresh but keep session)
     */
    clear(): void;
}
export type { SavedConversation, ConversationConfig };
//# sourceMappingURL=manager.d.ts.map