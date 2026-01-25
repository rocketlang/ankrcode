/**
 * Tool Registry
 * Central registration and lookup for all tools
 */
import { Tool, ToolDefinition } from '../types.js';
/**
 * Tool Registry - Singleton pattern
 */
declare class ToolRegistry {
    private tools;
    private initialized;
    /**
     * Register a tool
     */
    register(tool: Tool): void;
    /**
     * Register multiple tools
     */
    registerMany(tools: Tool[]): void;
    /**
     * Get a tool by name
     */
    get(name: string): Tool | undefined;
    /**
     * Check if tool exists
     */
    has(name: string): boolean;
    /**
     * Get all registered tools
     */
    getAll(): Tool[];
    /**
     * Get tool definitions (for LLM)
     */
    getDefinitions(): ToolDefinition[];
    /**
     * Get tools in Anthropic format (tool_use)
     */
    getAnthropicFormat(): Array<{
        name: string;
        description: string;
        input_schema: Tool['parameters'];
    }>;
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
    }>;
    /**
     * Get tools by category
     */
    getByCategory(category: string): Tool[];
    /**
     * Initialize with core tools
     */
    initialize(): void;
    /**
     * Get tool count
     */
    get count(): number;
    /**
     * Clear all tools
     */
    clear(): void;
}
export declare const registry: ToolRegistry;
export declare function registerTool(tool: Tool): void;
export declare function getTool(name: string): Tool | undefined;
export declare function getAllTools(): Tool[];
export declare function getToolDefinitions(): ToolDefinition[];
export {};
//# sourceMappingURL=registry.d.ts.map