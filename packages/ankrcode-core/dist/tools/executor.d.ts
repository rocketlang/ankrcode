/**
 * Tool Executor
 * Execute tools with validation, permissions, and error handling
 */
import { ToolInvocation, ToolResult } from '../types.js';
interface ExecutorOptions {
    /** Require user approval for certain tools */
    requireApproval?: boolean;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Enable sandbox mode (restrict dangerous operations) */
    sandbox?: boolean;
    /** Callback for approval requests */
    onApprovalRequest?: (invocation: ToolInvocation) => Promise<boolean>;
    /** Callback for tool execution start */
    onToolStart?: (invocation: ToolInvocation) => void;
    /** Callback for tool execution end */
    onToolEnd?: (invocation: ToolInvocation, result: ToolResult) => void;
}
/**
 * Tool Executor class
 */
declare class ToolExecutor {
    private options;
    private approvedCommands;
    constructor(options?: ExecutorOptions);
    /**
     * Execute a single tool invocation
     */
    execute(invocation: ToolInvocation, options?: ExecutorOptions): Promise<ToolResult>;
    /**
     * Execute multiple tools in parallel
     */
    executeParallel(invocations: ToolInvocation[], options?: ExecutorOptions): Promise<ToolResult[]>;
    /**
     * Execute multiple tools sequentially
     */
    executeSequential(invocations: ToolInvocation[], options?: ExecutorOptions): Promise<ToolResult[]>;
    /**
     * Pre-approve a command pattern
     */
    approveCommand(command: string): void;
    /**
     * Clear approved commands
     */
    clearApprovals(): void;
    private validateParams;
    private needsApproval;
    private isSafeCommand;
    private requestApproval;
    private executeWithTimeout;
}
export declare const executor: ToolExecutor;
export { ToolExecutor };
export declare function executeTool(name: string, params: Record<string, unknown>, options?: ExecutorOptions): Promise<ToolResult>;
export declare function executeToolsParallel(invocations: ToolInvocation[], options?: ExecutorOptions): Promise<ToolResult[]>;
//# sourceMappingURL=executor.d.ts.map