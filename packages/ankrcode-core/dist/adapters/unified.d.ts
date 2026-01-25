/**
 * Unified Adapter - ANKR-First Architecture
 *
 * Priority Chain:
 * 1. @ankr/* packages (in-process, fastest)
 * 2. ANKR services (localhost)
 * 3. AI Proxy (gateway with caching/routing)
 * 4. Direct LLM APIs (fallback only)
 */
import { EventEmitter } from 'events';
export interface ServiceHealth {
    name: string;
    available: boolean;
    latency?: number;
    version?: string;
    error?: string;
}
export interface AdapterConfig {
    aiProxyUrl: string;
    eonUrl: string;
    mcpUrl: string;
    swayamUrl: string;
    anthropicKey?: string;
    openaiKey?: string;
    preferOffline: boolean;
    timeout: number;
}
export interface LLMRequest {
    messages: Array<{
        role: string;
        content: string;
    }>;
    tools?: any[];
    model?: string;
    stream?: boolean;
}
export interface LLMResponse {
    content: string;
    toolCalls?: any[];
    model: string;
    source: 'package' | 'service' | 'proxy' | 'direct';
}
export interface MemoryEntry {
    key: string;
    value: any;
    metadata?: Record<string, any>;
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
    category?: string;
}
interface PackageStatus {
    name: string;
    available: boolean;
    version?: string;
}
export declare function detectANKRPackages(): Promise<Record<string, PackageStatus>>;
export declare function checkAllServices(config: AdapterConfig): Promise<ServiceHealth[]>;
export declare class UnifiedLLMAdapter extends EventEmitter {
    private config;
    private packages;
    private services;
    constructor(config?: Partial<AdapterConfig>);
    initialize(): Promise<void>;
    getStatus(): {
        packages: Record<string, PackageStatus>;
        services: ServiceHealth[];
    };
    complete(request: LLMRequest): Promise<LLMResponse>;
    private completeViaPackage;
    private completeViaProxy;
    private completeViaDirect;
}
export declare class UnifiedMemoryAdapter extends EventEmitter {
    private config;
    private packages;
    private inMemoryStore;
    constructor(config?: Partial<AdapterConfig>);
    initialize(): Promise<void>;
    remember(key: string, value: any, metadata?: Record<string, any>): Promise<void>;
    recall(query: string): Promise<MemoryEntry[]>;
}
export declare class UnifiedMCPAdapter extends EventEmitter {
    private config;
    private packages;
    private toolCache;
    private coreTools;
    constructor(config?: Partial<AdapterConfig>);
    initialize(): Promise<void>;
    discoverTools(): Promise<MCPTool[]>;
    getTools(): MCPTool[];
    getToolsByCategory(category: string): MCPTool[];
    executeTool(name: string, params: any): Promise<any>;
}
export interface UnifiedAdapters {
    llm: UnifiedLLMAdapter;
    memory: UnifiedMemoryAdapter;
    mcp: UnifiedMCPAdapter;
    status: () => {
        packages: Record<string, PackageStatus>;
        services: ServiceHealth[];
        mode: string;
    };
}
export declare function createUnifiedAdapter(config?: Partial<AdapterConfig>): Promise<UnifiedAdapters>;
export default createUnifiedAdapter;
//# sourceMappingURL=unified.d.ts.map