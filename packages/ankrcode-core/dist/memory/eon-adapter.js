/**
 * EON Memory Adapter
 * Priority order for memory backends:
 * 1. @ankr/eon service (port 4005) - Full context engine
 * 2. @ankr/postmemory - PostgreSQL with pgvector
 * 3. In-memory fallback - Simple local storage
 */
// Service URLs
const EON_SERVICE_URL = process.env.EON_SERVICE_URL || 'http://localhost:4005';
const DB_URL = process.env.DATABASE_URL || 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon';
/**
 * EON Memory Adapter
 * Provides memory/recall capabilities for AnkrCode
 */
export class EONAdapter {
    eon = null;
    postMemory = null;
    backend = 'local';
    sessionId;
    localMemories = []; // Fallback local storage
    constructor() {
        this.sessionId = `session_${Date.now()}`;
        this.initialize();
    }
    async initialize() {
        // Try backends in priority order
        // 1. EON Service
        if (await this.checkEONService())
            return;
        // 2. EON Embedded
        if (await this.tryLoadEON())
            return;
        // 3. PostMemory
        if (await this.tryLoadPostMemory())
            return;
        // 4. Local fallback
        console.log('[EONAdapter] Using local in-memory storage');
        this.backend = 'local';
    }
    async checkEONService() {
        try {
            const response = await fetch(`${EON_SERVICE_URL}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000),
            });
            if (response.ok) {
                this.backend = 'eon-service';
                console.log('[EONAdapter] Using EON service at', EON_SERVICE_URL);
                return true;
            }
        }
        catch {
            // Service not available
        }
        return false;
    }
    async tryLoadEON() {
        try {
            const module = await import('@ankr/eon');
            const EON = module.EON || module.default;
            this.eon = new EON({
                mode: 'embedded',
            });
            this.backend = 'eon-embedded';
            console.log('[EONAdapter] Using embedded EON');
            return true;
        }
        catch {
            // EON not available
        }
        return false;
    }
    async tryLoadPostMemory() {
        try {
            // Dynamic import with type assertion for optional dependency
            // @ts-expect-error - @ankr/postmemory is an optional dependency
            const module = await import('@ankr/postmemory');
            // Parse DB URL
            const url = new URL(DB_URL);
            this.postMemory = new module.PostMemory({
                host: url.hostname,
                port: parseInt(url.port || '5432'),
                database: url.pathname.slice(1),
                user: url.username,
                password: url.password,
                tableName: 'ankrcode_memories',
                userId: 'ankrcode',
                appName: 'ankrcode',
                autoEmbed: true,
            });
            this.backend = 'postmemory';
            console.log('[EONAdapter] Using PostMemory');
            return true;
        }
        catch {
            // PostMemory not available
        }
        return false;
    }
    /**
     * Check if a memory backend is available
     */
    isAvailable() {
        return this.backend !== 'local';
    }
    /**
     * Get current backend
     */
    getBackend() {
        return this.backend;
    }
    /**
     * Remember something (store in memory)
     */
    async remember(content, options = {}) {
        const memory = {
            id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content,
            metadata: {
                ...options.metadata,
                sessionId: this.sessionId,
            },
            createdAt: new Date(),
            type: options.type || 'knowledge',
        };
        try {
            switch (this.backend) {
                case 'eon-service':
                    await this.rememberViaService(memory);
                    break;
                case 'eon-embedded':
                    await this.rememberViaEmbedded(memory);
                    break;
                case 'postmemory':
                    await this.rememberViaPostMemory(memory);
                    break;
                default:
                    this.localMemories.push(memory);
            }
        }
        catch (error) {
            console.warn(`[EONAdapter] ${this.backend} failed, storing locally:`, error.message);
            this.localMemories.push(memory);
        }
        return memory;
    }
    async rememberViaPostMemory(memory) {
        const pm = this.postMemory;
        await pm.store({
            type: memory.type,
            content: memory.content,
            metadata: memory.metadata,
        });
    }
    async rememberViaService(memory) {
        const response = await fetch(`${EON_SERVICE_URL}/api/memory/store`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: memory.content,
                type: memory.type,
                metadata: memory.metadata,
                userId: 'ankrcode',
            }),
        });
        if (!response.ok) {
            throw new Error(`EON service error: ${await response.text()}`);
        }
    }
    async rememberViaEmbedded(memory) {
        const eon = this.eon;
        if (memory.type === 'fact') {
            await eon.context.addFact(memory.content, 1.0);
        }
        else {
            await eon.context.addKnowledge(memory.content, memory.metadata);
        }
    }
    /**
     * Recall memories (semantic search)
     */
    async recall(query) {
        try {
            switch (this.backend) {
                case 'eon-service':
                    return await this.recallViaService(query);
                case 'eon-embedded':
                    return await this.recallViaEmbedded(query);
                case 'postmemory':
                    return await this.recallViaPostMemory(query);
                default:
                    return this.recallLocally(query);
            }
        }
        catch (error) {
            console.warn(`[EONAdapter] ${this.backend} search failed, searching locally:`, error.message);
            return this.recallLocally(query);
        }
    }
    async recallViaPostMemory(query) {
        const pm = this.postMemory;
        const results = await pm.recall(query.query, query.limit || 10);
        return results
            .filter(r => r.similarity >= (query.minScore || 0.5))
            .map(r => ({
            memory: {
                id: r.id,
                content: r.content,
                type: 'knowledge',
                metadata: r.metadata,
                createdAt: r.timestamp,
            },
            score: r.similarity,
        }));
    }
    async recallViaService(query) {
        const params = new URLSearchParams({
            q: query.query,
            userId: 'ankrcode',
        });
        const response = await fetch(`${EON_SERVICE_URL}/api/memory/search?${params}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            throw new Error(`EON service error: ${await response.text()}`);
        }
        const data = await response.json();
        return (data.results || [])
            .filter(r => (r.score || r.similarity || 0) >= (query.minScore || 0.5))
            .slice(0, query.limit || 10)
            .map(r => ({
            memory: {
                id: r.id || `mem_${Date.now()}`,
                content: r.content,
                type: r.type || 'knowledge',
                metadata: r.metadata,
                createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
            },
            score: r.score || r.similarity || 0,
        }));
    }
    async recallViaEmbedded(query) {
        const eon = this.eon;
        const results = await eon.context.search(query.query, 'hybrid');
        return results
            .filter(r => r.score >= (query.minScore || 0.5))
            .slice(0, query.limit || 10)
            .map(r => ({
            memory: {
                id: r.id,
                content: r.content,
                type: 'knowledge',
                metadata: r.metadata,
                createdAt: new Date(),
            },
            score: r.score,
        }));
    }
    recallLocally(query) {
        // Simple local search (keyword matching)
        const queryLower = query.query.toLowerCase();
        const words = queryLower.split(/\s+/);
        const scored = this.localMemories
            .filter(m => !query.type || m.type === query.type)
            .map(m => {
            const contentLower = m.content.toLowerCase();
            const matchedWords = words.filter(w => contentLower.includes(w));
            const score = matchedWords.length / words.length;
            return { memory: m, score };
        })
            .filter(r => r.score >= (query.minScore || 0.3))
            .sort((a, b) => b.score - a.score)
            .slice(0, query.limit || 10);
        return scored;
    }
    /**
     * Get session context for LLM
     */
    async getSessionContext(query) {
        const sessionMemories = this.localMemories.filter(m => m.metadata?.sessionId === this.sessionId);
        let relevantKnowledge = [];
        if (query) {
            const recalled = await this.recall({ query, limit: 5 });
            relevantKnowledge = recalled.map(r => r.memory.content);
        }
        const facts = sessionMemories
            .filter(m => m.type === 'fact')
            .map(m => m.content);
        return {
            memories: sessionMemories,
            facts,
            relevantKnowledge,
        };
    }
    /**
     * Store a conversation turn
     */
    async storeConversation(userMessage, assistantResponse, metadata) {
        await this.remember(`User: ${userMessage}\nAssistant: ${assistantResponse}`, {
            type: 'episode',
            metadata: {
                ...metadata,
                turn: 'conversation',
                timestamp: new Date().toISOString(),
            },
        });
    }
    /**
     * Store a learned fact
     */
    async learnFact(fact, confidence = 1.0) {
        return this.remember(fact, {
            type: 'fact',
            metadata: { confidence },
        });
    }
    /**
     * Store a procedure (how to do something)
     */
    async storeProcedure(name, steps, metadata) {
        return this.remember(`Procedure: ${name}\nSteps:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`, {
            type: 'procedure',
            metadata: { ...metadata, procedureName: name },
        });
    }
    /**
     * Clear session memories
     */
    clearSession() {
        this.localMemories = this.localMemories.filter(m => m.metadata?.sessionId !== this.sessionId);
    }
    /**
     * Get memory stats
     */
    getStats() {
        const types = {
            fact: 0,
            episode: 0,
            procedure: 0,
            knowledge: 0,
        };
        for (const m of this.localMemories) {
            types[m.type]++;
        }
        return {
            totalMemories: this.localMemories.length,
            sessionMemories: this.localMemories.filter(m => m.metadata?.sessionId === this.sessionId).length,
            types,
            available: this.isAvailable(),
            backend: this.backend,
        };
    }
}
// Singleton instance
let adapterInstance = null;
export function getEONAdapter() {
    if (!adapterInstance) {
        adapterInstance = new EONAdapter();
    }
    return adapterInstance;
}
// Convenience functions
export async function remember(content, options) {
    return getEONAdapter().remember(content, options);
}
export async function recall(query, limit = 5) {
    return getEONAdapter().recall({ query, limit });
}
//# sourceMappingURL=eon-adapter.js.map