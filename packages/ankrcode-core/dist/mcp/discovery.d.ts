/**
 * MCP Tool Discovery
 *
 * Dynamically discovers and registers all available MCP tools
 * from @ankr/mcp-tools package or MCP server
 */
import { EventEmitter } from 'events';
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
    category: string;
    source: 'package' | 'server' | 'core';
}
export interface ToolCategory {
    name: string;
    displayName: string;
    count: number;
    tools: MCPTool[];
}
export interface DiscoveryResult {
    tools: MCPTool[];
    categories: ToolCategory[];
    source: 'package' | 'server' | 'core';
    duration: number;
}
declare function categorizeTools(tools: MCPTool[]): ToolCategory[];
export declare const CORE_TOOLS: MCPTool[];
export declare class MCPDiscovery extends EventEmitter {
    private mcpUrl;
    private toolCache;
    private categoryCache;
    private lastDiscovery;
    private cacheTimeout;
    constructor(mcpUrl?: string);
    discover(force?: boolean): Promise<DiscoveryResult>;
    getTools(): MCPTool[];
    getCategories(): ToolCategory[];
    getTool(name: string): MCPTool | undefined;
    getToolsByCategory(category: string): MCPTool[];
    searchTools(query: string): MCPTool[];
    getStats(): {
        total: number;
        bySource: Record<string, number>;
        byCategory: Record<string, number>;
    };
}
export declare function getDiscovery(mcpUrl?: string): MCPDiscovery;
export declare function discoverMCPTools(force?: boolean): Promise<DiscoveryResult>;
export declare function formatToolList(tools: MCPTool[], verbose?: boolean): string;
declare const _default: {
    MCPDiscovery: typeof MCPDiscovery;
    CORE_TOOLS: MCPTool[];
    getDiscovery: typeof getDiscovery;
    discoverMCPTools: typeof discoverMCPTools;
    formatToolList: typeof formatToolList;
    categorizeTools: typeof categorizeTools;
};
export default _default;
//# sourceMappingURL=discovery.d.ts.map