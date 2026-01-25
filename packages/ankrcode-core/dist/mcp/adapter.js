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
// Service URLs
const MCP_SERVICE_URL = process.env.MCP_SERVICE_URL || 'http://localhost:3355';
/**
 * MCP Adapter
 * Provides access to 260+ MCP tools
 */
export class MCPAdapter {
    tools = new Map();
    toolsByCategory = new Map();
    mcpAvailable = false;
    mcpRegistry = null;
    constructor() {
        this.initialize();
    }
    async initialize() {
        // Try to check if MCP service is available
        if (await this.checkMCPService())
            return;
        // Try to import MCP packages directly
        await this.tryLoadMCPPackages();
    }
    async checkMCPService() {
        try {
            const response = await fetch(`${MCP_SERVICE_URL}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000),
            });
            if (response.ok) {
                this.mcpAvailable = true;
                console.log('[MCPAdapter] Using MCP service at', MCP_SERVICE_URL);
                await this.loadToolsFromService();
                return true;
            }
        }
        catch {
            // Service not available
        }
        return false;
    }
    async loadToolsFromService() {
        try {
            const response = await fetch(`${MCP_SERVICE_URL}/tools`);
            if (response.ok) {
                const data = await response.json();
                for (const toolData of data.tools) {
                    const tool = {
                        ...toolData,
                        handler: (input) => this.executeViaService(toolData.name, input),
                    };
                    this.registerTool(tool);
                }
            }
        }
        catch (error) {
            console.warn('[MCPAdapter] Failed to load tools from service:', error.message);
        }
    }
    async tryLoadMCPPackages() {
        // Try @powerpbox/mcp (use string variable to prevent TS module resolution)
        try {
            const pkgName = '@powerpbox/mcp';
            const mcpModule = await import(/* webpackIgnore: true */ pkgName);
            if (mcpModule.getBaniTools) {
                const baniTools = mcpModule.getBaniTools();
                for (const tool of baniTools) {
                    this.registerBaniTool(tool);
                }
                console.log(`[MCPAdapter] Loaded ${baniTools.length} tools from @powerpbox/mcp`);
                this.mcpAvailable = true;
                return;
            }
        }
        catch {
            // Not available
        }
        // Try @ankr/mcp-tools (use string variable to prevent TS module resolution)
        try {
            const pkgName = '@ankr/mcp-tools';
            const mcpToolsModule = await import(/* webpackIgnore: true */ pkgName);
            if (mcpToolsModule.getAllTools) {
                const tools = mcpToolsModule.getAllTools();
                for (const tool of tools) {
                    this.registerTool(tool);
                }
                console.log('[MCPAdapter] Using @ankr/mcp-tools');
                this.mcpAvailable = true;
                return;
            }
        }
        catch {
            // Not available
        }
        console.log('[MCPAdapter] MCP tools not available - register tools manually');
    }
    /**
     * Register a Bani-format tool (from @powerpbox/mcp)
     */
    registerBaniTool(baniTool) {
        // Convert Bani tool format to MCPTool format
        const mcpTool = {
            name: baniTool.name,
            description: baniTool.description,
            category: baniTool.category || this.inferCategory(baniTool.name),
            inputSchema: {
                type: 'object',
                properties: this.convertParameters(baniTool.parameters),
                required: baniTool.parameters
                    ?.filter(p => p.required)
                    .map(p => p.name) || [],
            },
            handler: baniTool.execute || (async () => ({ success: false, error: 'No handler' })),
        };
        this.registerTool(mcpTool);
    }
    /**
     * Infer category from tool name prefix
     */
    inferCategory(name) {
        const prefixMap = {
            gst_: 'compliance',
            tds_: 'compliance',
            itr_: 'compliance',
            pan_: 'compliance',
            tan_: 'compliance',
            invoice_: 'erp',
            inventory_: 'erp',
            po_: 'erp',
            ledger_: 'erp',
            lead_: 'crm',
            contact_: 'crm',
            deal_: 'crm',
            upi_: 'banking',
            neft_: 'banking',
            emi_: 'banking',
            bank_: 'banking',
            aadhaar_: 'government',
            digilocker_: 'government',
            ulip_: 'government',
            vahan_: 'government',
            shipment_: 'logistics',
            track_: 'logistics',
            pod_: 'logistics',
            route_: 'logistics',
            whatsapp_: 'messaging',
            telegram_: 'messaging',
            sms_: 'messaging',
            eon_: 'eon',
            memory_: 'eon',
            knowledge_: 'eon',
        };
        const nameLower = name.toLowerCase();
        for (const [prefix, category] of Object.entries(prefixMap)) {
            if (nameLower.startsWith(prefix)) {
                return category;
            }
        }
        return 'general';
    }
    /**
     * Convert Bani parameter format to JSON Schema properties
     */
    convertParameters(params) {
        if (!params)
            return {};
        const properties = {};
        for (const param of params) {
            properties[param.name] = {
                type: param.type || 'string',
                description: param.description,
            };
        }
        return properties;
    }
    /**
     * Register a tool
     */
    registerTool(tool) {
        this.tools.set(tool.name, tool);
        const category = tool.category || 'other';
        if (!this.toolsByCategory.has(category)) {
            this.toolsByCategory.set(category, []);
        }
        this.toolsByCategory.get(category).push(tool);
    }
    /**
     * Execute a tool via MCP service
     */
    async executeViaService(toolName, input) {
        const response = await fetch(`${MCP_SERVICE_URL}/tools/${toolName}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });
        if (!response.ok) {
            return { success: false, error: `MCP service error: ${await response.text()}` };
        }
        return await response.json();
    }
    /**
     * Check if MCP is available
     */
    isAvailable() {
        return this.mcpAvailable || this.tools.size > 0;
    }
    /**
     * Get all tools
     */
    getAllTools() {
        return Array.from(this.tools.values());
    }
    /**
     * Get tools by category
     */
    getToolsByCategory(category) {
        return this.toolsByCategory.get(category) || [];
    }
    /**
     * Get tool by name
     */
    getTool(name) {
        return this.tools.get(name);
    }
    /**
     * Execute a tool
     */
    async execute(toolName, input) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            return {
                success: false,
                error: `MCP tool not found: ${toolName}`,
            };
        }
        try {
            const result = await tool.handler(input);
            return {
                success: result.success,
                output: result.data ? JSON.stringify(result.data, null, 2) : undefined,
                error: result.error,
                data: result.data,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `MCP tool error: ${error.message}`,
            };
        }
    }
    /**
     * Convert MCP tool to AnkrCode Tool format
     */
    toAnkrCodeTool(mcpTool) {
        return {
            name: `MCP_${mcpTool.name}`,
            description: `[MCP/${mcpTool.category}] ${mcpTool.description}`,
            parameters: {
                type: 'object',
                properties: mcpTool.inputSchema.properties,
                required: mcpTool.inputSchema.required,
            },
            handler: async (params) => {
                return this.execute(mcpTool.name, params);
            },
        };
    }
    /**
     * Get all tools as AnkrCode format
     */
    getAllAsAnkrCodeTools() {
        return this.getAllTools().map(t => this.toAnkrCodeTool(t));
    }
    /**
     * Get stats
     */
    getStats() {
        const toolsByCategory = {};
        for (const [cat, tools] of this.toolsByCategory) {
            toolsByCategory[cat] = tools.length;
        }
        return {
            totalTools: this.tools.size,
            categories: Array.from(this.toolsByCategory.keys()),
            toolsByCategory,
            available: this.isAvailable(),
        };
    }
    /**
     * Search tools
     */
    searchTools(query) {
        const queryLower = query.toLowerCase();
        return this.getAllTools().filter(t => t.name.toLowerCase().includes(queryLower) ||
            t.description.toLowerCase().includes(queryLower) ||
            t.category.toLowerCase().includes(queryLower));
    }
}
// Singleton instance
let adapterInstance = null;
export function getMCPAdapter() {
    if (!adapterInstance) {
        adapterInstance = new MCPAdapter();
    }
    return adapterInstance;
}
// Register common MCP tools as AnkrCode tools
export async function registerMCPToolsToRegistry() {
    const mcp = getMCPAdapter();
    const { registry } = await import('../tools/registry.js');
    if (!mcp.isAvailable()) {
        console.log('[MCPAdapter] No MCP tools available to register');
        return;
    }
    const mcpTools = mcp.getAllAsAnkrCodeTools();
    for (const tool of mcpTools) {
        registry.register(tool);
    }
    console.log(`[MCPAdapter] Registered ${mcpTools.length} MCP tools`);
}
// Popular MCP tool categories with descriptions
export const MCP_CATEGORIES = {
    compliance: {
        name: 'Compliance',
        description: 'GST, TDS, ITR, PAN, TAN validation and filing',
    },
    erp: {
        name: 'ERP',
        description: 'Invoice, Inventory, Purchase Orders, Ledgers',
    },
    crm: {
        name: 'CRM',
        description: 'Leads, Contacts, Deals, Activities',
    },
    banking: {
        name: 'Banking',
        description: 'UPI, NEFT, EMI, Account verification',
    },
    government: {
        name: 'Government',
        description: 'Aadhaar, DigiLocker, ULIP, Vahan, Sarathi',
    },
    logistics: {
        name: 'Logistics',
        description: 'Shipment tracking, Route optimization, POD',
    },
    messaging: {
        name: 'Messaging',
        description: 'WhatsApp, Telegram, SMS',
    },
    global: {
        name: 'Global',
        description: 'HTTP, Email, Calendar, Storage',
    },
    eon: {
        name: 'EON',
        description: 'Memory, Context, Knowledge Graph',
    },
};
//# sourceMappingURL=adapter.js.map