/**
 * Tool Executor
 * Execute tools with validation, permissions, and error handling
 */

import { registry } from './registry.js';
import { ToolInvocation, ToolResult } from '../types.js';
import { hasRecentlyRead } from './core/file.js';
import { isInPlanMode, isCommandAllowed } from './core/plan.js';

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

const DEFAULT_OPTIONS: ExecutorOptions = {
  requireApproval: true,
  timeout: 120000,
  sandbox: false,
};

/**
 * Tool Executor class
 */
class ToolExecutor {
  private options: ExecutorOptions;
  private approvedCommands = new Set<string>();

  constructor(options: ExecutorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Execute a single tool invocation
   */
  async execute(
    invocation: ToolInvocation,
    options: ExecutorOptions = {}
  ): Promise<ToolResult> {
    const opts = { ...this.options, ...options };

    // Get tool from registry
    const tool = registry.get(invocation.name);
    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${invocation.name}`,
      };
    }

    // Validate parameters
    const validation = this.validateParams(invocation, tool);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid parameters: ${validation.error}`,
      };
    }

    // Check plan mode restrictions
    if (isInPlanMode()) {
      const writeTools = ['Write', 'Edit', 'Bash'];
      if (writeTools.includes(invocation.name)) {
        return {
          success: false,
          error: `Tool "${invocation.name}" not allowed in plan mode. Exit plan mode first.`,
        };
      }
    }

    // Check file read requirements for Edit
    if (invocation.name === 'Edit') {
      const filePath = invocation.parameters.file_path as string;
      if (!hasRecentlyRead(filePath)) {
        return {
          success: false,
          error: 'Must Read file before Edit. Use Read tool first.',
        };
      }
    }

    // Check approval requirements
    if (opts.requireApproval && this.needsApproval(invocation)) {
      const approved = await this.requestApproval(invocation, opts);
      if (!approved) {
        return {
          success: false,
          error: 'User denied permission',
        };
      }
    }

    // Notify start
    opts.onToolStart?.(invocation);

    // Execute with timeout
    try {
      const result = await this.executeWithTimeout(
        () => tool.handler(invocation.parameters),
        opts.timeout || 120000
      );

      // Notify end
      opts.onToolEnd?.(invocation, result);

      return result;
    } catch (error) {
      const result: ToolResult = {
        success: false,
        error: `Tool error: ${(error as Error).message}`,
      };
      opts.onToolEnd?.(invocation, result);
      return result;
    }
  }

  /**
   * Execute multiple tools in parallel
   */
  async executeParallel(
    invocations: ToolInvocation[],
    options: ExecutorOptions = {}
  ): Promise<ToolResult[]> {
    return Promise.all(
      invocations.map((inv) => this.execute(inv, options))
    );
  }

  /**
   * Execute multiple tools sequentially
   */
  async executeSequential(
    invocations: ToolInvocation[],
    options: ExecutorOptions = {}
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];
    for (const inv of invocations) {
      const result = await this.execute(inv, options);
      results.push(result);
      // Stop on failure if needed
      if (!result.success && options.sandbox) {
        break;
      }
    }
    return results;
  }

  /**
   * Pre-approve a command pattern
   */
  approveCommand(command: string): void {
    this.approvedCommands.add(command);
  }

  /**
   * Clear approved commands
   */
  clearApprovals(): void {
    this.approvedCommands.clear();
  }

  // Private methods

  private validateParams(
    invocation: ToolInvocation,
    tool: { parameters: { required?: string[] } }
  ): { valid: boolean; error?: string } {
    const required = tool.parameters.required || [];

    for (const param of required) {
      if (!(param in invocation.parameters)) {
        return {
          valid: false,
          error: `Missing required parameter: ${param}`,
        };
      }
    }

    return { valid: true };
  }

  private needsApproval(invocation: ToolInvocation): boolean {
    // These tools need approval
    const approvalRequired = ['Bash', 'Write', 'Edit'];

    if (!approvalRequired.includes(invocation.name)) {
      return false;
    }

    // Check if Bash command is pre-approved
    if (invocation.name === 'Bash') {
      const command = invocation.parameters.command as string;

      // Check explicit approvals
      if (this.approvedCommands.has(command)) {
        return false;
      }

      // Check plan mode allowed prompts
      if (isCommandAllowed(command)) {
        return false;
      }

      // Safe commands don't need approval
      if (this.isSafeCommand(command)) {
        return false;
      }
    }

    return true;
  }

  private isSafeCommand(command: string): boolean {
    const safePatterns = [
      /^(git\s+)?(status|log|diff|branch|remote|show)/,
      /^ls(\s|$)/,
      /^pwd$/,
      /^cat\s/,
      /^head\s/,
      /^tail\s/,
      /^echo\s/,
      /^which\s/,
      /^node\s+--version/,
      /^npm\s+(ls|list|outdated|audit)/,
      /^pnpm\s+(ls|list|outdated)/,
    ];

    return safePatterns.some((pattern) => pattern.test(command));
  }

  private async requestApproval(
    invocation: ToolInvocation,
    options: ExecutorOptions
  ): Promise<boolean> {
    if (options.onApprovalRequest) {
      return options.onApprovalRequest(invocation);
    }

    // Default: log and approve (in real CLI, would use inquirer)
    console.log(`[Approval needed] ${invocation.name}:`, invocation.parameters);
    return true;
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
      ),
    ]);
  }
}

// Singleton instance
export const executor = new ToolExecutor();

// Export class for custom instances
export { ToolExecutor };

// Convenience functions
export async function executeTool(
  name: string,
  params: Record<string, unknown>,
  options?: ExecutorOptions
): Promise<ToolResult> {
  return executor.execute({ name, parameters: params }, options);
}

export async function executeToolsParallel(
  invocations: ToolInvocation[],
  options?: ExecutorOptions
): Promise<ToolResult[]> {
  return executor.executeParallel(invocations, options);
}
