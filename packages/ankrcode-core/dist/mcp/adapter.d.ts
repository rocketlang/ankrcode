/**
 * MCP (Model Context Protocol) Adapter
 * Integrates 260+ MCP tools from @powerpbox/mcp and @ankr/mcp-tools
 *
 * Categories:
 * - Compliance: GST, TDS, ITR, etc.
 * - ERP: Invoice, Inventory, Procurement
 * - CRM: Leads, Contacts, Deals
 * - Banking: UPI, EMI, NEFT
 * - Government: Aadhaar, DigiLocker, ULIP
 * - Logistics: Tracking, Routing, POD
 * - EON: Memory, Context, Knowledge
 */
import type { Tool, ToolResult } from '../types.js';
export interface MCPTool {
    name: string;
    description: string;
    category: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
    handler: (input: Record<string, unknown>) => Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
}
export type MCPCategory = 'compliance' | 'erp' | 'crm' | 'banking' | 'government' | 'logistics' | 'messaging' | 'global' | 'eon';
/**
 * MCP Adapter
 * Provides access to 260+ MCP tools
 */
export declare class MCPAdapter {
    private tools;
    private toolsByCategory;
    private mcpAvailable;
    private mcpRegistry;
    constructor();
    private initialize;
    private checkMCPService;
    private loadToolsFromService;
    private tryLoadMCPPackages;
    /**
     * Register a Bani-format tool (from @powerpbox/mcp)
     */
    private registerBaniTool;
    /**
     * Infer category from tool name prefix
     */
    private inferCategory;
    /**
     * Convert Bani parameter format to JSON Schema properties
     */
    private convertParameters;
    /**
     * Register a tool
     */
    registerTool(tool: MCPTool): void;
    /**
     * Execute a tool via MCP service
     */
    private executeViaService;
    /**
     * Check if MCP is available
     */
    isAvailable(): boolean;
    /**
     * Get all tools
     */
    getAllTools(): MCPTool[];
    /**
     * Get tools by category
     */
    getToolsByCategory(category: MCPCategory): MCPTool[];
    /**
     * Get tool by name
     */
    getTool(name: string): MCPTool | undefined;
    /**
     * Execute a tool
     */
    execute(toolName: string, input: Record<string, unknown>): Promise<ToolResult>;
    /**
     * Convert MCP tool to AnkrCode Tool format
     */
    toAnkrCodeTool(mcpTool: MCPTool): Tool;
    /**
     * Get all tools as AnkrCode format
     */
    getAllAsAnkrCodeTools(): Tool[];
    /**
     * Get stats
     */
    getStats(): {
        totalTools: number;
        categories: string[];
        toolsByCategory: Record<string, number>;
        available: boolean;
    };
    /**
     * Search tools
     */
    searchTools(query: string): MCPTool[];
}
export declare function getMCPAdapter(): MCPAdapter;
export declare function registerMCPToolsToRegistry(): Promise<void>;
export declare const MCP_CATEGORIES: Record<MCPCategory, {
    name: string;
    description: string;
}>;
//# sourceMappingURL=adapter.d.ts.map