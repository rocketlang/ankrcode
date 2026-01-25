/**
 * Bash Tool
 * Execute shell commands with security checks
 */
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
// Track background processes
const backgroundTasks = new Map();
/**
 * Bash Tool - Execute shell commands
 */
export const bashTool = {
    name: 'Bash',
    description: `Executes bash commands in a shell.
- Use for git, npm, docker, and other terminal operations
- DO NOT use for file operations (use Read/Write/Edit instead)
- Commands timeout after 2 minutes by default (max 10 minutes)
- Can run commands in background with run_in_background`,
    parameters: {
        type: 'object',
        properties: {
            command: {
                type: 'string',
                description: 'The command to execute',
            },
            description: {
                type: 'string',
                description: 'Clear description of what this command does',
            },
            timeout: {
                type: 'number',
                description: 'Timeout in milliseconds (max 600000)',
            },
            run_in_background: {
                type: 'boolean',
                description: 'Run command in background',
            },
        },
        required: ['command'],
    },
    async handler(params) {
        const { command, description, timeout = 120000, run_in_background = false, } = params;
        // Security check
        const securityCheck = checkCommandSecurity(command);
        if (!securityCheck.safe) {
            return {
                success: false,
                error: `Command blocked: ${securityCheck.reason}`,
            };
        }
        // Validate timeout
        const effectiveTimeout = Math.min(timeout, 600000);
        if (run_in_background) {
            return runInBackground(command);
        }
        return runCommand(command, effectiveTimeout);
    },
};
/**
 * TaskOutput Tool - Get output from background tasks
 */
export const taskOutputTool = {
    name: 'TaskOutput',
    description: `Get output from a running or completed background task.
- Takes task_id from a previous background command
- block=true waits for completion, block=false returns current status`,
    parameters: {
        type: 'object',
        properties: {
            task_id: {
                type: 'string',
                description: 'The task ID to get output from',
            },
            block: {
                type: 'boolean',
                description: 'Wait for completion (default: true)',
            },
            timeout: {
                type: 'number',
                description: 'Max wait time in ms (default: 30000)',
            },
        },
        required: ['task_id'],
    },
    async handler(params) {
        const { task_id, block = true, timeout = 30000 } = params;
        const task = backgroundTasks.get(task_id);
        if (!task) {
            return { success: false, error: `Task not found: ${task_id}` };
        }
        if (!block || task.status !== 'running') {
            return {
                success: true,
                output: task.output,
                metadata: { status: task.status },
            };
        }
        // Wait for completion
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const t = backgroundTasks.get(task_id);
                if (t && t.status !== 'running') {
                    clearInterval(checkInterval);
                    resolve({
                        success: t.status === 'completed',
                        output: t.output,
                        metadata: { status: t.status },
                    });
                }
            }, 100);
            // Timeout
            setTimeout(() => {
                clearInterval(checkInterval);
                const t = backgroundTasks.get(task_id);
                resolve({
                    success: false,
                    output: t?.output || '',
                    error: 'Timeout waiting for task',
                    metadata: { status: 'timeout' },
                });
            }, timeout);
        });
    },
};
/**
 * KillShell Tool - Kill a background process
 */
export const killShellTool = {
    name: 'KillShell',
    description: 'Kills a running background shell by its ID',
    parameters: {
        type: 'object',
        properties: {
            shell_id: {
                type: 'string',
                description: 'The ID of the background shell to kill',
            },
        },
        required: ['shell_id'],
    },
    async handler(params) {
        const { shell_id } = params;
        const task = backgroundTasks.get(shell_id);
        if (!task) {
            return { success: false, error: `Task not found: ${shell_id}` };
        }
        if (task.status !== 'running') {
            return { success: false, error: `Task already ${task.status}` };
        }
        task.process.kill('SIGTERM');
        task.status = 'failed';
        return { success: true, output: `Task ${shell_id} killed` };
    },
};
// Helper functions
function runCommand(command, timeout) {
    return new Promise((resolve) => {
        const proc = spawn('bash', ['-c', command], {
            cwd: process.cwd(),
            env: process.env,
        });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (data) => {
            stdout += data.toString();
            // Truncate if too long
            if (stdout.length > 30000) {
                stdout = stdout.slice(0, 30000) + '\n...[truncated]';
            }
        });
        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        const timer = setTimeout(() => {
            proc.kill('SIGTERM');
            resolve({
                success: false,
                error: `Command timed out after ${timeout}ms`,
                output: stdout,
            });
        }, timeout);
        proc.on('close', (code) => {
            clearTimeout(timer);
            const output = stdout + (stderr ? `\nSTDERR:\n${stderr}` : '');
            resolve({
                success: code === 0,
                output: output.trim() || '(no output)',
                metadata: { exitCode: code },
            });
        });
        proc.on('error', (err) => {
            clearTimeout(timer);
            resolve({ success: false, error: err.message });
        });
    });
}
function runInBackground(command) {
    const taskId = randomUUID();
    const proc = spawn('bash', ['-c', command], {
        cwd: process.cwd(),
        env: process.env,
        detached: true,
    });
    const task = {
        process: proc,
        output: '',
        status: 'running',
    };
    backgroundTasks.set(taskId, task);
    proc.stdout.on('data', (data) => {
        task.output += data.toString();
    });
    proc.stderr.on('data', (data) => {
        task.output += data.toString();
    });
    proc.on('close', (code) => {
        task.status = code === 0 ? 'completed' : 'failed';
    });
    return {
        success: true,
        output: `Background task started: ${taskId}`,
        metadata: { task_id: taskId },
    };
}
function checkCommandSecurity(command) {
    const dangerous = [
        { pattern: /rm\s+-rf\s+[\/~]/, reason: 'Dangerous rm -rf command' },
        { pattern: />\s*\/dev\/sd/, reason: 'Writing to block device' },
        { pattern: /mkfs\./, reason: 'Filesystem format command' },
        { pattern: /dd\s+if=.*of=\/dev/, reason: 'dd to block device' },
        { pattern: /:(){.*};:/, reason: 'Fork bomb detected' },
        { pattern: /chmod\s+-R\s+777\s+\//, reason: 'Dangerous chmod on root' },
        { pattern: /curl.*\|\s*(ba)?sh/, reason: 'Piping curl to shell' },
        { pattern: /wget.*\|\s*(ba)?sh/, reason: 'Piping wget to shell' },
    ];
    for (const { pattern, reason } of dangerous) {
        if (pattern.test(command)) {
            return { safe: false, reason };
        }
    }
    return { safe: true };
}
export function getBackgroundTasks() {
    return backgroundTasks;
}
//# sourceMappingURL=bash.js.map