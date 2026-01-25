/**
 * Code Generator
 *
 * Convert RocketLang commands to tool invocations
 */
import type { RocketCommand } from '../index.js';
interface ToolCall {
    name: string;
    parameters: Record<string, unknown>;
}
/**
 * Convert parsed commands to tool calls
 */
export declare function toToolCalls(commands: RocketCommand[]): ToolCall[];
/**
 * Generate TypeScript code from commands
 */
export declare function toTypeScript(commands: RocketCommand[]): string;
/**
 * Generate shell script from commands
 */
export declare function toShellScript(commands: RocketCommand[]): string;
export {};
//# sourceMappingURL=index.d.ts.map