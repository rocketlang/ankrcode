/**
 * Tool Registry
 * Central registration and lookup for all tools
 */

import { Tool, ToolDefinition } from '../types.js';

// Import core tools
import { readTool, writeTool, editTool } from './core/file.js';
import { globTool, grepTool } from './core/search.js';
import { bashTool, taskOutputTool, killShellTool } from './core/bash.js';
import { taskTool } from './core/task.js';
import { todoWriteTool, askUserQuestionTool } from './core/interactive.js';
import { webFetchTool, webSearchTool } from './core/web.js';
import { enterPlanModeTool, exitPlanModeTool } from './core/plan.js';
import { skillTool } from './core/skill.js';
import { notebookEditTool, notebookReadTool } from './core/notebook.js';
import { aleOptimizeTool, aleQuickTool, aleStatusTool } from './core/ale.js';

/**
 * Tool Registry - Singleton pattern
 */
class ToolRegistry {
  private tools = new Map<string, Tool>();
  private initialized = false;

  /**
   * Register a tool
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" already registered, overwriting.`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Register multiple tools
   */
  registerMany(tools: Tool[]): void {
    tools.forEach((tool) => this.register(tool));
  }

  /**
   * Get a tool by name
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all registered tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool definitions (for LLM)
   */
  getDefinitions(): ToolDefinition[] {
    return this.getAll().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  /**
   * Get tools in Anthropic format (tool_use)
   */
  getAnthropicFormat(): Array<{
    name: string;
    description: string;
    input_schema: Tool['parameters'];
  }> {
    return this.getAll().map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));
  }

  /**
   * Get tools in OpenAI format (functions)
   */
  getOpenAIFormat(): Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Tool['parameters'];
    };
  }> {
    return this.getAll().map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): Tool[] {
    const categories: Record<string, string[]> = {
      file: ['Read', 'Write', 'Edit'],
      search: ['Glob', 'Grep'],
      execution: ['Bash', 'TaskOutput', 'KillShell'],
      agent: ['Task'],
      interactive: ['TodoWrite', 'AskUserQuestion'],
      web: ['WebFetch', 'WebSearch'],
      planning: ['EnterPlanMode', 'ExitPlanMode'],
      skill: ['Skill'],
      notebook: ['NotebookEdit', 'NotebookRead'],
      optimization: ['ALEOptimize', 'ALEQuick', 'ALEStatus'],
    };

    const toolNames = categories[category] || [];
    return toolNames.map((name) => this.get(name)).filter(Boolean) as Tool[];
  }

  /**
   * Initialize with core tools
   */
  initialize(): void {
    if (this.initialized) return;

    // Register all core tools
    this.registerMany([
      // File operations
      readTool,
      writeTool,
      editTool,

      // Search
      globTool,
      grepTool,

      // Execution
      bashTool,
      taskOutputTool,
      killShellTool,

      // Agent spawning
      taskTool,

      // Interactive
      todoWriteTool,
      askUserQuestionTool,

      // Web
      webFetchTool,
      webSearchTool,

      // Planning
      enterPlanModeTool,
      exitPlanModeTool,

      // Skills/MCP
      skillTool,

      // Notebook
      notebookEditTool,
      notebookReadTool,

      // ALE - Agentic Learning Engine (v2.43)
      aleOptimizeTool,
      aleQuickTool,
      aleStatusTool,
    ]);

    this.initialized = true;
  }

  /**
   * Get tool count
   */
  get count(): number {
    return this.tools.size;
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
    this.initialized = false;
  }
}

// Singleton instance
export const registry = new ToolRegistry();

// Initialize on import
registry.initialize();

// Export for external registration
export function registerTool(tool: Tool): void {
  registry.register(tool);
}

export function getTool(name: string): Tool | undefined {
  return registry.get(name);
}

export function getAllTools(): Tool[] {
  return registry.getAll();
}

export function getToolDefinitions(): ToolDefinition[] {
  return registry.getDefinitions();
}
