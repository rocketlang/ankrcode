/**
 * Search Tools
 * Glob and Grep - Fast file and content searching
 */
import { spawn } from 'child_process';
import fg from 'fast-glob';
/**
 * Glob Tool - Fast file pattern matching
 */
export const globTool = {
    name: 'Glob',
    description: `Fast file pattern matching tool.
- Supports patterns like "**/*.ts", "src/**/*.tsx"
- Returns matching file paths sorted by modification time
- Use this instead of bash find command`,
    parameters: {
        type: 'object',
        properties: {
            pattern: {
                type: 'string',
                description: 'The glob pattern to match files against',
            },
            path: {
                type: 'string',
                description: 'Directory to search in (default: current working directory)',
            },
        },
        required: ['pattern'],
    },
    async handler(params) {
        const { pattern, path: searchPath } = params;
        const cwd = searchPath || process.cwd();
        try {
            const files = await fg(pattern, {
                cwd,
                absolute: true,
                stats: true,
                dot: false,
                ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
            });
            // Sort by modification time (newest first)
            files.sort((a, b) => {
                const aTime = a.stats?.mtimeMs || 0;
                const bTime = b.stats?.mtimeMs || 0;
                return bTime - aTime;
            });
            const paths = files.map((f) => (typeof f === 'string' ? f : f.path));
            if (paths.length === 0) {
                return {
                    success: true,
                    output: `No files matched pattern: ${pattern}`,
                };
            }
            return {
                success: true,
                output: paths.join('\n'),
                metadata: { count: paths.length },
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Glob error: ${error.message}`,
            };
        }
    },
};
/**
 * Grep Tool - Content search using ripgrep
 */
export const grepTool = {
    name: 'Grep',
    description: `Search file contents using ripgrep.
- Supports regex patterns
- output_mode: "content" | "files_with_matches" | "count"
- Can filter by file type or glob pattern
- Use -A/-B/-C for context lines`,
    parameters: {
        type: 'object',
        properties: {
            pattern: {
                type: 'string',
                description: 'The regex pattern to search for',
            },
            path: {
                type: 'string',
                description: 'File or directory to search in',
            },
            output_mode: {
                type: 'string',
                enum: ['content', 'files_with_matches', 'count'],
                description: 'Output format (default: files_with_matches)',
            },
            glob: {
                type: 'string',
                description: 'Glob pattern to filter files (e.g., "*.ts")',
            },
            type: {
                type: 'string',
                description: 'File type to search (e.g., js, py, ts)',
            },
            '-A': {
                type: 'number',
                description: 'Lines to show after each match',
            },
            '-B': {
                type: 'number',
                description: 'Lines to show before each match',
            },
            '-C': {
                type: 'number',
                description: 'Lines to show around each match',
            },
            '-i': {
                type: 'boolean',
                description: 'Case insensitive search',
            },
            '-n': {
                type: 'boolean',
                description: 'Show line numbers (default: true)',
            },
            multiline: {
                type: 'boolean',
                description: 'Enable multiline matching',
            },
            head_limit: {
                type: 'number',
                description: 'Limit output to first N lines',
            },
        },
        required: ['pattern'],
    },
    async handler(params) {
        const { pattern, path: searchPath, output_mode = 'files_with_matches', glob, type, '-A': after, '-B': before, '-C': context, '-i': ignoreCase, '-n': lineNumbers = true, multiline, head_limit, } = params;
        const args = [];
        // Output mode
        if (output_mode === 'files_with_matches') {
            args.push('-l');
        }
        else if (output_mode === 'count') {
            args.push('-c');
        }
        // Options
        if (ignoreCase)
            args.push('-i');
        if (lineNumbers && output_mode === 'content')
            args.push('-n');
        if (multiline)
            args.push('-U', '--multiline-dotall');
        // Context lines
        if (after)
            args.push('-A', String(after));
        if (before)
            args.push('-B', String(before));
        if (context)
            args.push('-C', String(context));
        // File filtering
        if (glob)
            args.push('--glob', glob);
        if (type)
            args.push('--type', type);
        // Ignore common directories
        args.push('--glob', '!node_modules/**');
        args.push('--glob', '!dist/**');
        args.push('--glob', '!.git/**');
        // Pattern and path
        args.push(pattern);
        args.push(searchPath || '.');
        return new Promise((resolve) => {
            // Try to use ripgrep, fall back to grep
            const rg = spawn('rg', args, { cwd: process.cwd() });
            let stdout = '';
            let stderr = '';
            rg.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            rg.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            rg.on('error', () => {
                // Fallback to grep if rg not available
                const grepArgs = ['-r'];
                if (ignoreCase)
                    grepArgs.push('-i');
                if (lineNumbers)
                    grepArgs.push('-n');
                if (output_mode === 'files_with_matches')
                    grepArgs.push('-l');
                if (output_mode === 'count')
                    grepArgs.push('-c');
                grepArgs.push(pattern, searchPath || '.');
                const grep = spawn('grep', grepArgs, { cwd: process.cwd() });
                grep.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                grep.on('close', (code) => {
                    let output = stdout.trim();
                    if (head_limit && output) {
                        const lines = output.split('\n');
                        output = lines.slice(0, head_limit).join('\n');
                    }
                    resolve({
                        success: code === 0 || code === 1, // grep returns 1 if no matches
                        output: output || 'No matches found',
                    });
                });
            });
            rg.on('close', (code) => {
                if (stderr && code !== 0) {
                    resolve({ success: false, error: stderr });
                    return;
                }
                let output = stdout.trim();
                if (head_limit && output) {
                    const lines = output.split('\n');
                    output = lines.slice(0, head_limit).join('\n');
                }
                resolve({
                    success: true,
                    output: output || 'No matches found',
                });
            });
        });
    },
};
//# sourceMappingURL=search.js.map