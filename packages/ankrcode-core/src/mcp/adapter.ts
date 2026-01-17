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

// Bani Tool interface (from @powerpbox/mcp)
interface BaniParameter {
  name: string;
  type?: string;
  description?: string;
  required?: boolean;
}

interface BaniTool {
  name: string;
  description: string;
  category?: string;
  parameters?: BaniParameter[];
  execute?: (input: Record<string, unknown>) => Promise<{
    success: boolean;
    data?: unknown;
    error?: string;
  }>;
}

// MCP Tool interface
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

// MCP Tool categories
export type MCPCategory =
  | 'compliance'
  | 'erp'
  | 'crm'
  | 'banking'
  | 'government'
  | 'logistics'
  | 'messaging'
  | 'global'
  | 'eon';

// Service URLs
const MCP_SERVICE_URL = process.env.MCP_SERVICE_URL || 'http://localhost:3355';

/**
 * MCP Adapter
 * Provides access to 260+ MCP tools
 */
export class MCPAdapter {
  private tools: Map<string, MCPTool> = new Map();
  private toolsByCategory: Map<string, MCPTool[]> = new Map();
  private mcpAvailable = false;
  private mcpRegistry: unknown = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Try to check if MCP service is available
    if (await this.checkMCPService()) return;

    // Try to import MCP packages directly
    await this.tryLoadMCPPackages();
  }

  private async checkMCPService(): Promise<boolean> {
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
    } catch {
      // Service not available
    }
    return false;
  }

  private async loadToolsFromService(): Promise<void> {
    try {
      const response = await fetch(`${MCP_SERVICE_URL}/tools`);
      if (response.ok) {
        const data = await response.json() as {
          tools: Array<{
            name: string;
            description: string;
            category: string;
            inputSchema: MCPTool['inputSchema'];
          }>;
        };

        for (const toolData of data.tools) {
          const tool: MCPTool = {
            ...toolData,
            handler: (input) => this.executeViaService(toolData.name, input),
          };
          this.registerTool(tool);
        }
      }
    } catch (error) {
      console.warn('[MCPAdapter] Failed to load tools from service:', (error as Error).message);
    }
  }

  private async tryLoadMCPPackages(): Promise<void> {
    // Try @powerpbox/mcp (use string variable to prevent TS module resolution)
    try {
      const pkgName = '@powerpbox/mcp';
      const mcpModule = await import(/* webpackIgnore: true */ pkgName) as {
        getBaniTools?: () => BaniTool[];
        getTotalToolCount?: () => number;
      };
      if (mcpModule.getBaniTools) {
        const baniTools = mcpModule.getBaniTools();
        for (const tool of baniTools) {
          this.registerBaniTool(tool);
        }
        console.log(`[MCPAdapter] Loaded ${baniTools.length} tools from @powerpbox/mcp`);
        this.mcpAvailable = true;
        return;
      }
    } catch {
      // Not available
    }

    // Try @ankr/mcp-tools (use string variable to prevent TS module resolution)
    try {
      const pkgName = '@ankr/mcp-tools';
      const mcpToolsModule = await import(/* webpackIgnore: true */ pkgName) as {
        getAllTools?: () => MCPTool[];
      };
      if (mcpToolsModule.getAllTools) {
        const tools = mcpToolsModule.getAllTools();
        for (const tool of tools) {
          this.registerTool(tool);
        }
        console.log('[MCPAdapter] Using @ankr/mcp-tools');
        this.mcpAvailable = true;
        return;
      }
    } catch {
      // Not available
    }

    console.log('[MCPAdapter] MCP tools not available - register tools manually');
  }

  /**
   * Register a Bani-format tool (from @powerpbox/mcp)
   */
  private registerBaniTool(baniTool: BaniTool): void {
    // Convert Bani tool format to MCPTool format
    const mcpTool: MCPTool = {
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
  private inferCategory(name: string): string {
    const prefixMap: Record<string, string> = {
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
  private convertParameters(
    params?: BaniParameter[]
  ): Record<string, unknown> {
    if (!params) return {};
    const properties: Record<string, unknown> = {};
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
  registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);

    const category = tool.category || 'other';
    if (!this.toolsByCategory.has(category)) {
      this.toolsByCategory.set(category, []);
    }
    this.toolsByCategory.get(category)!.push(tool);
  }

  /**
   * Execute a tool via MCP service
   */
  private async executeViaService(
    toolName: string,
    input: Record<string, unknown>
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const response = await fetch(`${MCP_SERVICE_URL}/tools/${toolName}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return { success: false, error: `MCP service error: ${await response.text()}` };
    }

    return await response.json() as { success: boolean; data?: unknown; error?: string };
  }

  /**
   * Check if MCP is available
   */
  isAvailable(): boolean {
    return this.mcpAvailable || this.tools.size > 0;
  }

  /**
   * Get all tools
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: MCPCategory): MCPTool[] {
    return this.toolsByCategory.get(category) || [];
  }

  /**
   * Get tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute a tool
   */
  async execute(
    toolName: string,
    input: Record<string, unknown>
  ): Promise<ToolResult> {
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
    } catch (error) {
      return {
        success: false,
        error: `MCP tool error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Convert MCP tool to AnkrCode Tool format
   */
  toAnkrCodeTool(mcpTool: MCPTool): Tool {
    return {
      name: `MCP_${mcpTool.name}`,
      description: `[MCP/${mcpTool.category}] ${mcpTool.description}`,
      parameters: {
        type: 'object',
        properties: mcpTool.inputSchema.properties as Record<string, {
          type: string;
          description?: string;
        }>,
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
  getAllAsAnkrCodeTools(): Tool[] {
    return this.getAllTools().map(t => this.toAnkrCodeTool(t));
  }

  /**
   * Get stats
   */
  getStats(): {
    totalTools: number;
    categories: string[];
    toolsByCategory: Record<string, number>;
    available: boolean;
  } {
    const toolsByCategory: Record<string, number> = {};
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
  searchTools(query: string): MCPTool[] {
    const queryLower = query.toLowerCase();
    return this.getAllTools().filter(
      t =>
        t.name.toLowerCase().includes(queryLower) ||
        t.description.toLowerCase().includes(queryLower) ||
        t.category.toLowerCase().includes(queryLower)
    );
  }
}

// Singleton instance
let adapterInstance: MCPAdapter | null = null;

export function getMCPAdapter(): MCPAdapter {
  if (!adapterInstance) {
    adapterInstance = new MCPAdapter();
  }
  return adapterInstance;
}

// Register common MCP tools as AnkrCode tools
export async function registerMCPToolsToRegistry(): Promise<void> {
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
export const MCP_CATEGORIES: Record<MCPCategory, { name: string; description: string }> = {
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
