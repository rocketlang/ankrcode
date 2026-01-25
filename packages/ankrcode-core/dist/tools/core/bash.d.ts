/**
 * Bash Tool
 * Execute shell commands with security checks
 */
import { ChildProcess } from 'child_process';
import { Tool } from '../../types.js';
/**
 * Bash Tool - Execute shell commands
 */
export declare const bashTool: Tool;
/**
 * TaskOutput Tool - Get output from background tasks
 */
export declare const taskOutputTool: Tool;
/**
 * KillShell Tool - Kill a background process
 */
export declare const killShellTool: Tool;
export declare function getBackgroundTasks(): Map<string, {
    process: ChildProcess;
    output: string;
    status: 'running' | 'completed' | 'failed';
}>;
//# sourceMappingURL=bash.d.ts.map