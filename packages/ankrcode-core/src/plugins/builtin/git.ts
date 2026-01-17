/**
 * Git Plugin for AnkrCode
 *
 * Provides git-specific tools and commands.
 */

import type { Plugin, PluginCommand } from '../types.js';
import type { Tool, ToolResult } from '../../types.js';
import { execSync, spawn } from 'child_process';

/**
 * Execute git command safely
 */
function execGit(args: string[], cwd?: string): { stdout: string; stderr: string; code: number } {
  try {
    const stdout = execSync(`git ${args.join(' ')}`, {
      cwd: cwd || process.cwd(),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout: stdout.trim(), stderr: '', code: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || error.message,
      code: error.status || 1,
    };
  }
}

/**
 * Check if directory is a git repo
 */
function isGitRepo(cwd?: string): boolean {
  const result = execGit(['rev-parse', '--is-inside-work-tree'], cwd);
  return result.code === 0 && result.stdout === 'true';
}

// Git Status Tool
const gitStatusTool: Tool = {
  name: 'status',
  description: `Show git repository status.
- Working directory changes
- Staged changes
- Branch information`,
  parameters: {
    type: 'object',
    properties: {
      short: {
        type: 'boolean',
        description: 'Show short format',
      },
      branch: {
        type: 'boolean',
        description: 'Show branch info even in short format',
      },
    },
  },
  async handler(params: Record<string, unknown>): Promise<ToolResult> {
    if (!isGitRepo()) {
      return { success: false, error: 'Not a git repository' };
    }

    const args = ['status'];
    if (params.short) args.push('--short');
    if (params.branch) args.push('--branch');

    const result = execGit(args);

    if (result.code !== 0) {
      return { success: false, error: result.stderr };
    }

    return { success: true, output: result.stdout };
  },
};

// Git Diff Tool
const gitDiffTool: Tool = {
  name: 'diff',
  description: `Show git diff.
- Unstaged changes (default)
- Staged changes (--staged)
- Between commits`,
  parameters: {
    type: 'object',
    properties: {
      staged: {
        type: 'boolean',
        description: 'Show staged changes',
      },
      path: {
        type: 'string',
        description: 'Specific file or directory to diff',
      },
      commit: {
        type: 'string',
        description: 'Compare against specific commit',
      },
    },
  },
  async handler(params: Record<string, unknown>): Promise<ToolResult> {
    if (!isGitRepo()) {
      return { success: false, error: 'Not a git repository' };
    }

    const args = ['diff'];
    if (params.staged) args.push('--staged');
    if (params.commit) args.push(params.commit as string);
    if (params.path) args.push('--', params.path as string);

    const result = execGit(args);

    if (result.code !== 0) {
      return { success: false, error: result.stderr };
    }

    return {
      success: true,
      output: result.stdout || '(no changes)',
    };
  },
};

// Git Log Tool
const gitLogTool: Tool = {
  name: 'log',
  description: `Show git commit history.
- Recent commits (default: 10)
- Custom format
- Filter by author`,
  parameters: {
    type: 'object',
    properties: {
      count: {
        type: 'number',
        description: 'Number of commits to show (default: 10)',
      },
      oneline: {
        type: 'boolean',
        description: 'Show one line per commit',
      },
      author: {
        type: 'string',
        description: 'Filter by author',
      },
      since: {
        type: 'string',
        description: 'Show commits since date (e.g., "1 week ago")',
      },
    },
  },
  async handler(params: Record<string, unknown>): Promise<ToolResult> {
    if (!isGitRepo()) {
      return { success: false, error: 'Not a git repository' };
    }

    const count = (params.count as number) || 10;
    const args = ['log', `-${count}`];

    if (params.oneline) args.push('--oneline');
    if (params.author) args.push(`--author=${params.author}`);
    if (params.since) args.push(`--since="${params.since}"`);

    const result = execGit(args);

    if (result.code !== 0) {
      return { success: false, error: result.stderr };
    }

    return { success: true, output: result.stdout };
  },
};

// Git Branch Tool
const gitBranchTool: Tool = {
  name: 'branch',
  description: `Manage git branches.
- List branches
- Create new branch
- Delete branch`,
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Branch name (for create/delete)',
      },
      create: {
        type: 'boolean',
        description: 'Create new branch',
      },
      delete: {
        type: 'boolean',
        description: 'Delete branch',
      },
      all: {
        type: 'boolean',
        description: 'Show all branches (including remote)',
      },
    },
  },
  async handler(params: Record<string, unknown>): Promise<ToolResult> {
    if (!isGitRepo()) {
      return { success: false, error: 'Not a git repository' };
    }

    const args = ['branch'];

    if (params.create && params.name) {
      const result = execGit(['checkout', '-b', params.name as string]);
      return result.code === 0
        ? { success: true, output: `Created and switched to branch: ${params.name}` }
        : { success: false, error: result.stderr };
    }

    if (params.delete && params.name) {
      const result = execGit(['branch', '-d', params.name as string]);
      return result.code === 0
        ? { success: true, output: `Deleted branch: ${params.name}` }
        : { success: false, error: result.stderr };
    }

    if (params.all) args.push('-a');

    const result = execGit(args);
    return result.code === 0
      ? { success: true, output: result.stdout }
      : { success: false, error: result.stderr };
  },
};

// Git Stash Tool
const gitStashTool: Tool = {
  name: 'stash',
  description: `Manage git stash.
- Save changes to stash
- List stashes
- Apply/pop stash`,
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['save', 'list', 'pop', 'apply', 'drop'],
        description: 'Stash action',
      },
      message: {
        type: 'string',
        description: 'Stash message (for save)',
      },
      index: {
        type: 'number',
        description: 'Stash index (for pop/apply/drop)',
      },
    },
  },
  async handler(params: Record<string, unknown>): Promise<ToolResult> {
    if (!isGitRepo()) {
      return { success: false, error: 'Not a git repository' };
    }

    const action = (params.action as string) || 'list';
    const args = ['stash'];

    switch (action) {
      case 'save':
        args.push('push');
        if (params.message) args.push('-m', params.message as string);
        break;
      case 'list':
        args.push('list');
        break;
      case 'pop':
        args.push('pop');
        if (params.index !== undefined) args.push(`stash@{${params.index}}`);
        break;
      case 'apply':
        args.push('apply');
        if (params.index !== undefined) args.push(`stash@{${params.index}}`);
        break;
      case 'drop':
        args.push('drop');
        if (params.index !== undefined) args.push(`stash@{${params.index}}`);
        break;
    }

    const result = execGit(args);
    return result.code === 0
      ? { success: true, output: result.stdout || `Stash ${action} completed` }
      : { success: false, error: result.stderr };
  },
};

/**
 * Git Plugin Definition
 */
export const gitPlugin: Plugin = {
  metadata: {
    id: 'git',
    name: 'Git Integration',
    version: '1.0.0',
    description: 'Git version control tools for AnkrCode',
    author: 'ANKR Labs',
    tags: ['vcs', 'git', 'version-control'],
  },

  tools: [
    gitStatusTool,
    gitDiffTool,
    gitLogTool,
    gitBranchTool,
    gitStashTool,
  ],

  commands: [
    {
      name: 'git-status',
      description: 'Show git status',
      aliases: ['gs'],
      handler: async () => {
        const result = await gitStatusTool.handler({});
        console.log(result.success ? result.output : `Error: ${result.error}`);
      },
    },
    {
      name: 'git-log',
      description: 'Show recent commits',
      aliases: ['gl'],
      options: [
        { flags: '-n, --count <n>', description: 'Number of commits', default: '10' },
      ],
      handler: async (args) => {
        const result = await gitLogTool.handler({
          count: parseInt(args.count as string, 10),
          oneline: true,
        });
        console.log(result.success ? result.output : `Error: ${result.error}`);
      },
    },
  ],

  hooks: {
    async onLoad() {
      if (isGitRepo()) {
        const branch = execGit(['rev-parse', '--abbrev-ref', 'HEAD']);
        console.log(`[Git Plugin] Loaded in git repo (branch: ${branch.stdout})`);
      }
    },
  },
};

export default gitPlugin;
