/**
 * Docker Plugin for AnkrCode
 *
 * Provides Docker container and image management tools.
 */
import { execSync } from 'child_process';
/**
 * Execute docker command safely
 */
function execDocker(args) {
    try {
        const stdout = execSync(`docker ${args.join(' ')}`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 30000,
        });
        return { stdout: stdout.trim(), stderr: '', code: 0 };
    }
    catch (error) {
        return {
            stdout: error.stdout?.toString() || '',
            stderr: error.stderr?.toString() || error.message,
            code: error.status || 1,
        };
    }
}
/**
 * Check if docker is available
 */
function isDockerAvailable() {
    const result = execDocker(['--version']);
    return result.code === 0;
}
// Docker PS Tool
const dockerPsTool = {
    name: 'ps',
    description: `List Docker containers.
- Running containers (default)
- All containers (--all)
- Filter by name/status`,
    parameters: {
        type: 'object',
        properties: {
            all: {
                type: 'boolean',
                description: 'Show all containers (including stopped)',
            },
            filter: {
                type: 'string',
                description: 'Filter by name or status (e.g., "name=nginx")',
            },
            format: {
                type: 'string',
                description: 'Output format (table, json, custom)',
            },
        },
    },
    async handler(params) {
        if (!isDockerAvailable()) {
            return { success: false, error: 'Docker is not available' };
        }
        const args = ['ps'];
        if (params.all)
            args.push('-a');
        if (params.filter)
            args.push('--filter', params.filter);
        if (params.format === 'json') {
            args.push('--format', '{{json .}}');
        }
        else if (params.format) {
            args.push('--format', params.format);
        }
        const result = execDocker(args);
        if (result.code !== 0) {
            return { success: false, error: result.stderr };
        }
        return { success: true, output: result.stdout || 'No containers found' };
    },
};
// Docker Images Tool
const dockerImagesTool = {
    name: 'images',
    description: `List Docker images.
- All images
- Filter by repository/tag
- Show image sizes`,
    parameters: {
        type: 'object',
        properties: {
            all: {
                type: 'boolean',
                description: 'Show all images (including intermediate)',
            },
            filter: {
                type: 'string',
                description: 'Filter images (e.g., "reference=nginx*")',
            },
            dangling: {
                type: 'boolean',
                description: 'Show only dangling images',
            },
        },
    },
    async handler(params) {
        if (!isDockerAvailable()) {
            return { success: false, error: 'Docker is not available' };
        }
        const args = ['images'];
        if (params.all)
            args.push('-a');
        if (params.filter)
            args.push('--filter', params.filter);
        if (params.dangling)
            args.push('--filter', 'dangling=true');
        const result = execDocker(args);
        if (result.code !== 0) {
            return { success: false, error: result.stderr };
        }
        return { success: true, output: result.stdout || 'No images found' };
    },
};
// Docker Logs Tool
const dockerLogsTool = {
    name: 'logs',
    description: `View container logs.
- Follow logs in real-time
- Tail last N lines
- Show timestamps`,
    parameters: {
        type: 'object',
        properties: {
            container: {
                type: 'string',
                description: 'Container name or ID',
            },
            tail: {
                type: 'number',
                description: 'Number of lines from the end (default: 100)',
            },
            timestamps: {
                type: 'boolean',
                description: 'Show timestamps',
            },
            since: {
                type: 'string',
                description: 'Show logs since timestamp or duration (e.g., "10m")',
            },
        },
        required: ['container'],
    },
    async handler(params) {
        if (!isDockerAvailable()) {
            return { success: false, error: 'Docker is not available' };
        }
        const container = params.container;
        const args = ['logs'];
        const tail = params.tail || 100;
        args.push('--tail', tail.toString());
        if (params.timestamps)
            args.push('--timestamps');
        if (params.since)
            args.push('--since', params.since);
        args.push(container);
        const result = execDocker(args);
        if (result.code !== 0) {
            return { success: false, error: result.stderr };
        }
        return { success: true, output: result.stdout || '(no logs)' };
    },
};
// Docker Exec Tool
const dockerExecTool = {
    name: 'exec',
    description: `Execute command in running container.
- Interactive shell
- Run specific command`,
    parameters: {
        type: 'object',
        properties: {
            container: {
                type: 'string',
                description: 'Container name or ID',
            },
            command: {
                type: 'string',
                description: 'Command to execute',
            },
            workdir: {
                type: 'string',
                description: 'Working directory inside container',
            },
            user: {
                type: 'string',
                description: 'User to run as',
            },
        },
        required: ['container', 'command'],
    },
    async handler(params) {
        if (!isDockerAvailable()) {
            return { success: false, error: 'Docker is not available' };
        }
        const container = params.container;
        const command = params.command;
        const args = ['exec'];
        if (params.workdir)
            args.push('-w', params.workdir);
        if (params.user)
            args.push('-u', params.user);
        args.push(container, 'sh', '-c', command);
        const result = execDocker(args);
        if (result.code !== 0) {
            return { success: false, error: result.stderr };
        }
        return { success: true, output: result.stdout };
    },
};
// Docker Stats Tool
const dockerStatsTool = {
    name: 'stats',
    description: `Show container resource usage.
- CPU and memory
- Network I/O
- Block I/O`,
    parameters: {
        type: 'object',
        properties: {
            container: {
                type: 'string',
                description: 'Container name or ID (optional, shows all if omitted)',
            },
        },
    },
    async handler(params) {
        if (!isDockerAvailable()) {
            return { success: false, error: 'Docker is not available' };
        }
        const args = ['stats', '--no-stream'];
        if (params.container)
            args.push(params.container);
        const result = execDocker(args);
        if (result.code !== 0) {
            return { success: false, error: result.stderr };
        }
        return { success: true, output: result.stdout };
    },
};
// Docker Compose Tool
const dockerComposeTool = {
    name: 'compose',
    description: `Docker Compose operations.
- up: Start services
- down: Stop services
- ps: List services
- logs: View service logs`,
    parameters: {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['up', 'down', 'ps', 'logs', 'restart', 'build'],
                description: 'Compose action',
            },
            service: {
                type: 'string',
                description: 'Service name (optional)',
            },
            file: {
                type: 'string',
                description: 'Compose file path',
            },
            detach: {
                type: 'boolean',
                description: 'Run in background (for up)',
            },
        },
        required: ['action'],
    },
    async handler(params) {
        if (!isDockerAvailable()) {
            return { success: false, error: 'Docker is not available' };
        }
        const action = params.action;
        const args = ['compose'];
        if (params.file)
            args.push('-f', params.file);
        args.push(action);
        if (action === 'up' && params.detach)
            args.push('-d');
        if (action === 'logs')
            args.push('--tail', '100');
        if (params.service)
            args.push(params.service);
        const result = execDocker(args);
        if (result.code !== 0) {
            return { success: false, error: result.stderr };
        }
        return { success: true, output: result.stdout || `Compose ${action} completed` };
    },
};
/**
 * Docker Plugin Definition
 */
export const dockerPlugin = {
    metadata: {
        id: 'docker',
        name: 'Docker Integration',
        version: '1.0.0',
        description: 'Docker container and image management for AnkrCode',
        author: 'ANKR Labs',
        tags: ['docker', 'containers', 'devops'],
    },
    tools: [
        dockerPsTool,
        dockerImagesTool,
        dockerLogsTool,
        dockerExecTool,
        dockerStatsTool,
        dockerComposeTool,
    ],
    commands: [
        {
            name: 'docker-ps',
            description: 'List Docker containers',
            aliases: ['dps'],
            options: [
                { flags: '-a, --all', description: 'Show all containers' },
            ],
            handler: async (args) => {
                const result = await dockerPsTool.handler({ all: args.all });
                console.log(result.success ? result.output : `Error: ${result.error}`);
            },
        },
        {
            name: 'docker-logs',
            description: 'View container logs',
            aliases: ['dlogs'],
            arguments: [
                { name: 'container', description: 'Container name or ID', required: true },
            ],
            options: [
                { flags: '-n, --tail <n>', description: 'Number of lines', default: '100' },
            ],
            handler: async (args) => {
                const result = await dockerLogsTool.handler({
                    container: args.container,
                    tail: parseInt(args.tail, 10),
                });
                console.log(result.success ? result.output : `Error: ${result.error}`);
            },
        },
    ],
    hooks: {
        async onLoad() {
            if (isDockerAvailable()) {
                const version = execDocker(['--version']);
                console.log(`[Docker Plugin] ${version.stdout}`);
            }
            else {
                console.log('[Docker Plugin] Docker not available');
            }
        },
    },
};
export default dockerPlugin;
//# sourceMappingURL=docker.js.map