/**
 * EON Memory Adapter
 * Priority order for memory backends:
 * 1. @ankr/eon service (port 4005) - Full context engine
 * 2. @ankr/postmemory - PostgreSQL with pgvector
 * 3. In-memory fallback - Simple local storage
 */

// Types for memory operations
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

// Service URLs
const EON_SERVICE_URL = process.env.EON_SERVICE_URL || 'http://localhost:4005';
const DB_URL = process.env.DATABASE_URL || 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon';

/**
 * EON Memory Adapter
 * Provides memory/recall capabilities for AnkrCode
 */
export class EONAdapter {
  private eon: unknown = null;
  private postMemory: unknown = null;
  private backend: 'eon-service' | 'eon-embedded' | 'postmemory' | 'local' = 'local';
  private sessionId: string;
  private localMemories: Memory[] = []; // Fallback local storage

  constructor() {
    this.sessionId = `session_${Date.now()}`;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Try backends in priority order
    // 1. EON Service
    if (await this.checkEONService()) return;

    // 2. EON Embedded
    if (await this.tryLoadEON()) return;

    // 3. PostMemory
    if (await this.tryLoadPostMemory()) return;

    // 4. Local fallback
    console.log('[EONAdapter] Using local in-memory storage');
    this.backend = 'local';
  }

  private async checkEONService(): Promise<boolean> {
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
    } catch {
      // Service not available
    }
    return false;
  }

  private async tryLoadEON(): Promise<boolean> {
    try {
      const module: any = await import('@ankr/eon');
      const EON = module.EON || module.default;
      this.eon = new EON({
        mode: 'embedded',
      });
      this.backend = 'eon-embedded';
      console.log('[EONAdapter] Using embedded EON');
      return true;
    } catch {
      // EON not available
    }
    return false;
  }

  private async tryLoadPostMemory(): Promise<boolean> {
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
    } catch {
      // PostMemory not available
    }
    return false;
  }

  /**
   * Check if a memory backend is available
   */
  isAvailable(): boolean {
    return this.backend !== 'local';
  }

  /**
   * Get current backend
   */
  getBackend(): string {
    return this.backend;
  }

  /**
   * Remember something (store in memory)
   */
  async remember(
    content: string,
    options: {
      type?: Memory['type'];
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<Memory> {
    const memory: Memory = {
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
    } catch (error) {
      console.warn(`[EONAdapter] ${this.backend} failed, storing locally:`, (error as Error).message);
      this.localMemories.push(memory);
    }

    return memory;
  }

  private async rememberViaPostMemory(memory: Memory): Promise<void> {
    const pm = this.postMemory as {
      store: (entry: { type: string; content: string; metadata?: Record<string, unknown> }) => Promise<string>;
    };

    await pm.store({
      type: memory.type,
      content: memory.content,
      metadata: memory.metadata,
    });
  }

  private async rememberViaService(memory: Memory): Promise<void> {
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

  private async rememberViaEmbedded(memory: Memory): Promise<void> {
    const eon = this.eon as {
      context: {
        addKnowledge: (content: string, metadata?: Record<string, unknown>) => Promise<void>;
        addFact: (statement: string, confidence?: number) => Promise<void>;
      };
    };

    if (memory.type === 'fact') {
      await eon.context.addFact(memory.content, 1.0);
    } else {
      await eon.context.addKnowledge(memory.content, memory.metadata);
    }
  }

  /**
   * Recall memories (semantic search)
   */
  async recall(query: MemoryQuery): Promise<MemoryResult[]> {
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
    } catch (error) {
      console.warn(`[EONAdapter] ${this.backend} search failed, searching locally:`, (error as Error).message);
      return this.recallLocally(query);
    }
  }

  private async recallViaPostMemory(query: MemoryQuery): Promise<MemoryResult[]> {
    const pm = this.postMemory as {
      recall: (query: string, limit: number) => Promise<Array<{
        id: string;
        content: string;
        similarity: number;
        metadata?: Record<string, unknown>;
        timestamp: Date;
      }>>;
    };

    const results = await pm.recall(query.query, query.limit || 10);

    return results
      .filter(r => r.similarity >= (query.minScore || 0.5))
      .map(r => ({
        memory: {
          id: r.id,
          content: r.content,
          type: 'knowledge' as const,
          metadata: r.metadata,
          createdAt: r.timestamp,
        },
        score: r.similarity,
      }));
  }

  private async recallViaService(query: MemoryQuery): Promise<MemoryResult[]> {
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

    const data = await response.json() as {
      results: Array<{
        content: string;
        id?: string;
        type?: Memory['type'];
        metadata?: Record<string, unknown>;
        createdAt?: string;
        score?: number;
        similarity?: number;
      }>;
    };

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

  private async recallViaEmbedded(query: MemoryQuery): Promise<MemoryResult[]> {
    const eon = this.eon as {
      context: {
        search: (query: string, strategy?: string) => Promise<Array<{
          content: string;
          id: string;
          score: number;
          metadata?: Record<string, unknown>;
        }>>;
      };
    };

    const results = await eon.context.search(query.query, 'hybrid');

    return results
      .filter(r => r.score >= (query.minScore || 0.5))
      .slice(0, query.limit || 10)
      .map(r => ({
        memory: {
          id: r.id,
          content: r.content,
          type: 'knowledge' as const,
          metadata: r.metadata,
          createdAt: new Date(),
        },
        score: r.score,
      }));
  }

  private recallLocally(query: MemoryQuery): MemoryResult[] {
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
  async getSessionContext(query?: string): Promise<SessionContext> {
    const sessionMemories = this.localMemories.filter(
      m => m.metadata?.sessionId === this.sessionId
    );

    let relevantKnowledge: string[] = [];
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
  async storeConversation(
    userMessage: string,
    assistantResponse: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.remember(
      `User: ${userMessage}\nAssistant: ${assistantResponse}`,
      {
        type: 'episode',
        metadata: {
          ...metadata,
          turn: 'conversation',
          timestamp: new Date().toISOString(),
        },
      }
    );
  }

  /**
   * Store a learned fact
   */
  async learnFact(fact: string, confidence = 1.0): Promise<Memory> {
    return this.remember(fact, {
      type: 'fact',
      metadata: { confidence },
    });
  }

  /**
   * Store a procedure (how to do something)
   */
  async storeProcedure(
    name: string,
    steps: string[],
    metadata?: Record<string, unknown>
  ): Promise<Memory> {
    return this.remember(
      `Procedure: ${name}\nSteps:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      {
        type: 'procedure',
        metadata: { ...metadata, procedureName: name },
      }
    );
  }

  /**
   * Clear session memories
   */
  clearSession(): void {
    this.localMemories = this.localMemories.filter(
      m => m.metadata?.sessionId !== this.sessionId
    );
  }

  /**
   * Get memory stats
   */
  getStats(): {
    totalMemories: number;
    sessionMemories: number;
    types: Record<Memory['type'], number>;
    available: boolean;
    backend: string;
  } {
    const types: Record<Memory['type'], number> = {
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
      sessionMemories: this.localMemories.filter(
        m => m.metadata?.sessionId === this.sessionId
      ).length,
      types,
      available: this.isAvailable(),
      backend: this.backend,
    };
  }
}

// Singleton instance
let adapterInstance: EONAdapter | null = null;

export function getEONAdapter(): EONAdapter {
  if (!adapterInstance) {
    adapterInstance = new EONAdapter();
  }
  return adapterInstance;
}

// Convenience functions
export async function remember(
  content: string,
  options?: { type?: Memory['type']; metadata?: Record<string, unknown> }
): Promise<Memory> {
  return getEONAdapter().remember(content, options);
}

export async function recall(query: string, limit = 5): Promise<MemoryResult[]> {
  return getEONAdapter().recall({ query, limit });
}
