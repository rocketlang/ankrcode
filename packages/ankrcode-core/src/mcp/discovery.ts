/**
 * MCP Tool Discovery
 *
 * Dynamically discovers and registers all available MCP tools
 * from @ankr/mcp-tools package or MCP server
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Tool Categories
// ============================================================================

const CATEGORIES: Record<string, string> = {
  compliance: 'Compliance (GST, TDS, ITR)',
  banking: 'Banking (UPI, NEFT, EMI)',
  logistics: 'Logistics (Shipment, Route)',
  government: 'Government (Aadhaar, DigiLocker)',
  memory: 'Memory (EON)',
  erp: 'ERP (Invoice, Inventory)',
  crm: 'CRM (Lead, Contact)',
  core: 'Core (File, Search, Bash)',
  other: 'Other',
};

function categorizeTools(tools: MCPTool[]): ToolCategory[] {
  const categoryMap = new Map<string, MCPTool[]>();

  for (const tool of tools) {
    const category = tool.category || inferCategory(tool.name);
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push({ ...tool, category });
  }

  return Array.from(categoryMap.entries()).map(([name, categoryTools]) => ({
    name,
    displayName: CATEGORIES[name] || name,
    count: categoryTools.length,
    tools: categoryTools,
  }));
}

function inferCategory(toolName: string): string {
  const name = toolName.toLowerCase();

  if (name.includes('gst') || name.includes('tds') || name.includes('itr') || name.includes('tax')) {
    return 'compliance';
  }
  if (name.includes('upi') || name.includes('bank') || name.includes('emi') || name.includes('payment')) {
    return 'banking';
  }
  if (name.includes('ship') || name.includes('route') || name.includes('track') || name.includes('freight')) {
    return 'logistics';
  }
  if (name.includes('aadhaar') || name.includes('digi') || name.includes('govt') || name.includes('pan')) {
    return 'government';
  }
  if (name.includes('eon') || name.includes('memory') || name.includes('recall') || name.includes('remember')) {
    return 'memory';
  }
  if (name.includes('invoice') || name.includes('inventory') || name.includes('order')) {
    return 'erp';
  }
  if (name.includes('lead') || name.includes('contact') || name.includes('customer')) {
    return 'crm';
  }
  if (name.includes('read') || name.includes('write') || name.includes('edit') || name.includes('glob') || name.includes('grep') || name.includes('bash')) {
    return 'core';
  }

  return 'other';
}

// ============================================================================
// Core Tools (Always Available)
// ============================================================================

export const CORE_TOOLS: MCPTool[] = [
  {
    name: 'Read',
    description: 'Read contents of a file',
    category: 'core',
    source: 'core',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Absolute path to the file' },
        offset: { type: 'number', description: 'Line number to start from' },
        limit: { type: 'number', description: 'Number of lines to read' },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'Write',
    description: 'Write content to a file',
    category: 'core',
    source: 'core',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Absolute path to the file' },
        content: { type: 'string', description: 'Content to write' },
      },
      required: ['file_path', 'content'],
    },
  },
  {
    name: 'Edit',
    description: 'Edit a file by replacing text',
    category: 'core',
    source: 'core',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Absolute path to the file' },
        old_string: { type: 'string', description: 'Text to replace' },
        new_string: { type: 'string', description: 'Replacement text' },
        replace_all: { type: 'boolean', description: 'Replace all occurrences' },
      },
      required: ['file_path', 'old_string', 'new_string'],
    },
  },
  {
    name: 'Glob',
    description: 'Find files matching a glob pattern',
    category: 'core',
    source: 'core',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern (e.g., **/*.ts)' },
        path: { type: 'string', description: 'Directory to search in' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'Grep',
    description: 'Search for pattern in files',
    category: 'core',
    source: 'core',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Regex pattern to search' },
        path: { type: 'string', description: 'File or directory to search' },
        glob: { type: 'string', description: 'Glob pattern to filter files' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'Bash',
    description: 'Execute a shell command',
    category: 'core',
    source: 'core',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute' },
        timeout: { type: 'number', description: 'Timeout in milliseconds' },
      },
      required: ['command'],
    },
  },
  {
    name: 'Task',
    description: 'Launch a sub-agent for complex tasks',
    category: 'core',
    source: 'core',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Short description of the task' },
        prompt: { type: 'string', description: 'Task prompt for the agent' },
        subagent_type: { type: 'string', description: 'Type of agent to use' },
      },
      required: ['description', 'prompt', 'subagent_type'],
    },
  },
  {
    name: 'TodoWrite',
    description: 'Manage task list',
    category: 'core',
    source: 'core',
    inputSchema: {
      type: 'object',
      properties: {
        todos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
              activeForm: { type: 'string' },
            },
          },
        },
      },
      required: ['todos'],
    },
  },
  {
    name: 'AskUserQuestion',
    description: 'Ask user a question with options',
    category: 'core',
    source: 'core',
    inputSchema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              header: { type: 'string' },
              options: { type: 'array' },
              multiSelect: { type: 'boolean' },
            },
          },
        },
      },
      required: ['questions'],
    },
  },
  {
    name: 'WebFetch',
    description: 'Fetch and analyze web content',
    category: 'core',
    source: 'core',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to fetch' },
        prompt: { type: 'string', description: 'What to extract from the page' },
      },
      required: ['url', 'prompt'],
    },
  },
  {
    name: 'WebSearch',
    description: 'Search the web',
    category: 'core',
    source: 'core',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
];

// ============================================================================
// Discovery Engine
// ============================================================================

export class MCPDiscovery extends EventEmitter {
  private mcpUrl: string;
  private toolCache: MCPTool[] = [];
  private categoryCache: ToolCategory[] = [];
  private lastDiscovery: number = 0;
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor(mcpUrl?: string) {
    super();
    this.mcpUrl = mcpUrl || process.env.MCP_URL || 'http://localhost:4006';
  }

  async discover(force: boolean = false): Promise<DiscoveryResult> {
    const now = Date.now();

    // Return cached if recent
    if (!force && this.toolCache.length > 0 && now - this.lastDiscovery < this.cacheTimeout) {
      return {
        tools: this.toolCache,
        categories: this.categoryCache,
        source: this.toolCache[0]?.source || 'core',
        duration: 0,
      };
    }

    const start = Date.now();
    let tools: MCPTool[] = [];
    let source: 'package' | 'server' | 'core' = 'core';

    // Priority 1: @ankr/mcp-tools package
    try {
      const mod: any = await import('@ankr/mcp-tools');
      const getAllTools = mod.getAllTools || mod.default?.getAllTools;
      if (typeof getAllTools === 'function') {
        const packageTools = await getAllTools();
        tools = packageTools.map((t: any) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema || t.parameters,
          category: t.category || inferCategory(t.name),
          source: 'package' as const,
        }));
        source = 'package';
        this.emit('discovered', { source: 'package', count: tools.length });
      } else {
        throw new Error('getAllTools not found');
      }
    } catch {
      // Priority 2: MCP Server
      try {
        const response = await fetch(`${this.mcpUrl}/tools`, {
          signal: AbortSignal.timeout(3000),
        });

        if (response.ok) {
          const serverTools = (await response.json()) as any[];
          tools = serverTools.map((t: any) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema || t.parameters,
            category: t.category || inferCategory(t.name),
            source: 'server' as const,
          }));
          source = 'server';
          this.emit('discovered', { source: 'server', count: tools.length });
        }
      } catch {
        // Priority 3: Core tools only
        tools = CORE_TOOLS;
        source = 'core';
        this.emit('discovered', { source: 'core', count: tools.length });
      }
    }

    // Always include core tools
    if (source !== 'core') {
      const coreNames = new Set(CORE_TOOLS.map(t => t.name));
      const nonCoreTools = tools.filter(t => !coreNames.has(t.name));
      tools = [...CORE_TOOLS, ...nonCoreTools];
    }

    // Cache results
    this.toolCache = tools;
    this.categoryCache = categorizeTools(tools);
    this.lastDiscovery = now;

    return {
      tools: this.toolCache,
      categories: this.categoryCache,
      source,
      duration: Date.now() - start,
    };
  }

  getTools(): MCPTool[] {
    return this.toolCache.length > 0 ? this.toolCache : CORE_TOOLS;
  }

  getCategories(): ToolCategory[] {
    return this.categoryCache.length > 0 ? this.categoryCache : categorizeTools(CORE_TOOLS);
  }

  getTool(name: string): MCPTool | undefined {
    return this.getTools().find(t => t.name.toLowerCase() === name.toLowerCase());
  }

  getToolsByCategory(category: string): MCPTool[] {
    return this.getTools().filter(t => t.category === category);
  }

  searchTools(query: string): MCPTool[] {
    const q = query.toLowerCase();
    return this.getTools().filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }

  getStats(): { total: number; bySource: Record<string, number>; byCategory: Record<string, number> } {
    const tools = this.getTools();
    const bySource: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const tool of tools) {
      bySource[tool.source] = (bySource[tool.source] || 0) + 1;
      byCategory[tool.category] = (byCategory[tool.category] || 0) + 1;
    }

    return {
      total: tools.length,
      bySource,
      byCategory,
    };
  }
}

// ============================================================================
// Factory
// ============================================================================

let discoveryInstance: MCPDiscovery | null = null;

export function getDiscovery(mcpUrl?: string): MCPDiscovery {
  if (!discoveryInstance) {
    discoveryInstance = new MCPDiscovery(mcpUrl);
  }
  return discoveryInstance;
}

export async function discoverMCPTools(force: boolean = false): Promise<DiscoveryResult> {
  const discovery = getDiscovery();
  return discovery.discover(force);
}

// ============================================================================
// CLI Display
// ============================================================================

export function formatToolList(tools: MCPTool[], verbose: boolean = false): string {
  const categories = categorizeTools(tools);
  const lines: string[] = [];

  for (const cat of categories) {
    lines.push(`\n\x1b[33m${cat.displayName}\x1b[0m (${cat.count} tools)`);

    for (const tool of cat.tools) {
      if (verbose) {
        lines.push(`  \x1b[36m${tool.name}\x1b[0m`);
        lines.push(`    ${tool.description}`);
      } else {
        lines.push(`  • ${tool.name}: ${tool.description.slice(0, 60)}${tool.description.length > 60 ? '...' : ''}`);
      }
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Export
// ============================================================================

export default {
  MCPDiscovery,
  CORE_TOOLS,
  getDiscovery,
  discoverMCPTools,
  formatToolList,
  categorizeTools,
};
