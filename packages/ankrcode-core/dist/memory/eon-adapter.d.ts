/**
 * EON Memory Adapter
 * Priority order for memory backends:
 * 1. @ankr/eon service (port 4005) - Full context engine
 * 2. @ankr/postmemory - PostgreSQL with pgvector
 * 3. In-memory fallback - Simple local storage
 */
export interface Memory {
    id: string;
    content: string;
    metadata?: Record<string, unknown>;
    embedding?: number[];
    createdAt: Date;
    type: 'fact' | 'episode' | 'procedure' | 'knowledge';
}
export interface MemoryQuery {
    query: string;
    limit?: number;
    type?: Memory['type'];
    minScore?: number;
}
export interface MemoryResult {
    memory: Memory;
    score: number;
}
export interface SessionContext {
    memories: Memory[];
    facts: string[];
    relevantKnowledge: string[];
}
/**
 * EON Memory Adapter
 * Provides memory/recall capabilities for AnkrCode
 */
export declare class EONAdapter {
    private eon;
    private postMemory;
    private backend;
    private sessionId;
    private localMemories;
    constructor();
    private initialize;
    private checkEONService;
    private tryLoadEON;
    private tryLoadPostMemory;
    /**
     * Check if a memory backend is available
     */
    isAvailable(): boolean;
    /**
     * Get current backend
     */
    getBackend(): string;
    /**
     * Remember something (store in memory)
     */
    remember(content: string, options?: {
        type?: Memory['type'];
        metadata?: Record<string, unknown>;
    }): Promise<Memory>;
    private rememberViaPostMemory;
    private rememberViaService;
    private rememberViaEmbedded;
    /**
     * Recall memories (semantic search)
     */
    recall(query: MemoryQuery): Promise<MemoryResult[]>;
    private recallViaPostMemory;
    private recallViaService;
    private recallViaEmbedded;
    private recallLocally;
    /**
     * Get session context for LLM
     */
    getSessionContext(query?: string): Promise<SessionContext>;
    /**
     * Store a conversation turn
     */
    storeConversation(userMessage: string, assistantResponse: string, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Store a learned fact
     */
    learnFact(fact: string, confidence?: number): Promise<Memory>;
    /**
     * Store a procedure (how to do something)
     */
    storeProcedure(name: string, steps: string[], metadata?: Record<string, unknown>): Promise<Memory>;
    /**
     * Clear session memories
     */
    clearSession(): void;
    /**
     * Get memory stats
     */
    getStats(): {
        totalMemories: number;
        sessionMemories: number;
        types: Record<Memory['type'], number>;
        available: boolean;
        backend: string;
    };
}
export declare function getEONAdapter(): EONAdapter;
export declare function remember(content: string, options?: {
    type?: Memory['type'];
    metadata?: Record<string, unknown>;
}): Promise<Memory>;
export declare function recall(query: string, limit?: number): Promise<MemoryResult[]>;
//# sourceMappingURL=eon-adapter.d.ts.map