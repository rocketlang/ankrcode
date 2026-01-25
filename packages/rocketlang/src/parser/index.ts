/**
 * RocketLang Parser
 *
 * Parses RocketLang scripts into executable commands.
 * Uses pattern matching for common patterns, with LLM fallback for complex cases.
 */

import { normalize, detectScript } from '../normalizer/index.js';
import type { RocketCommand, ParseResult, ParseError } from '../index.js';

// Command patterns (normalized English)
interface Pattern {
  regex: RegExp;
  tool: string;
  extract: (match: RegExpMatchArray) => Record<string, unknown>;
}

const PATTERNS: Pattern[] = [
  // File operations
  {
    regex: /^read\s+["']?([^"']+)["']?$/i,
    tool: 'Read',
    extract: (m) => ({ file_path: resolvePath(m[1]) }),
  },
  {
    regex: /^write\s+["']?(.+?)["']?\s+(?:in|to)\s+["']?([^"']+)["']?$/i,
    tool: 'Write',
    extract: (m) => ({ content: m[1], file_path: resolvePath(m[2]) }),
  },
  {
    regex: /^edit\s+["']?(.+?)["']?\s+to\s+["']?(.+?)["']?\s+in\s+["']?([^"']+)["']?$/i,
    tool: 'Edit',
    extract: (m) => ({
      old_string: m[1],
      new_string: m[2],
      file_path: resolvePath(m[3]),
    }),
  },

  // Search operations
  {
    regex: /^search\s+["']?(.+?)["']?\s+in\s+["']?([^"']+)["']?$/i,
    tool: 'Grep',
    extract: (m) => ({ pattern: m[1], path: m[2] }),
  },
  {
    regex: /^search\s+["']?(.+?)["']?$/i,
    tool: 'Grep',
    extract: (m) => ({ pattern: m[1] }),
  },
  {
    regex: /^(?:find|search)\s+(?:all\s+)?(\*\*?\/?[\w.*]+)$/i,
    tool: 'Glob',
    extract: (m) => ({ pattern: m[1] }),
  },

  // Git operations
  {
    regex: /^commit\s+["']?(.+?)["']?$/i,
    tool: 'Bash',
    extract: (m) => ({ command: `git add -A && git commit -m "${m[1]}"` }),
  },
  {
    regex: /^push(?:\s+(\w+))?(?:\s+(\w+))?$/i,
    tool: 'Bash',
    extract: (m) => ({
      command: `git push ${m[1] || 'origin'} ${m[2] || 'main'}`,
    }),
  },
  {
    regex: /^pull(?:\s+(\w+))?(?:\s+(\w+))?$/i,
    tool: 'Bash',
    extract: (m) => ({
      command: `git pull ${m[1] || 'origin'} ${m[2] || 'main'}`,
    }),
  },

  // NPM/Package operations
  {
    regex: /^install\s+(.+)$/i,
    tool: 'Bash',
    extract: (m) => ({ command: `npm install ${m[1]}` }),
  },
  {
    regex: /^run\s+tests?$/i,
    tool: 'Bash',
    extract: () => ({ command: 'npm test' }),
  },
  {
    regex: /^build$/i,
    tool: 'Bash',
    extract: () => ({ command: 'npm run build' }),
  },

  // Direct bash
  {
    regex: /^run\s+["']?(.+?)["']?$/i,
    tool: 'Bash',
    extract: (m) => ({ command: m[1] }),
  },
  {
    regex: /^\$\s*(.+)$/,
    tool: 'Bash',
    extract: (m) => ({ command: m[1] }),
  },

  // API/Code generation (sends to LLM)
  {
    regex: /^create\s+(?:an?\s+)?api\s+(?:for\s+)?(.+)$/i,
    tool: 'Task',
    extract: (m) => ({
      subagent_type: 'code',
      prompt: `Create a REST API for ${m[1]}`,
      description: 'Create API',
    }),
  },
  {
    regex: /^create\s+(?:an?\s+)?function\s+(?:that\s+)?(.+)$/i,
    tool: 'Task',
    extract: (m) => ({
      subagent_type: 'code',
      prompt: `Create a function that ${m[1]}`,
      description: 'Create function',
    }),
  },
  {
    regex: /^create\s+(?:an?\s+)?component\s+(?:for\s+)?(.+)$/i,
    tool: 'Task',
    extract: (m) => ({
      subagent_type: 'code',
      prompt: `Create a React component for ${m[1]}`,
      description: 'Create component',
    }),
  },
];

/**
 * Parse RocketLang script
 */
export function parse(script: string): ParseResult {
  const commands: RocketCommand[] = [];
  const errors: ParseError[] = [];

  const lines = script.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNumber = i + 1;

    // Skip empty lines and comments
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    try {
      const command = parseLine(line, lineNumber);
      if (command) {
        commands.push(command);
      }
    } catch (error) {
      errors.push({
        message: (error as Error).message,
        line: lineNumber,
        column: 1,
      });
    }
  }

  return { commands, errors };
}

/**
 * Parse a single line
 */
function parseLine(line: string, lineNumber: number): RocketCommand | null {
  // Detect and normalize
  const script = detectScript(line);
  const normalized = normalize(line);

  // Try each pattern
  for (const pattern of PATTERNS) {
    const match = normalized.match(pattern.regex);
    if (match) {
      return {
        tool: pattern.tool,
        parameters: pattern.extract(match),
        raw: line,
        line: lineNumber,
      };
    }
  }

  // No pattern matched - treat as natural language prompt
  return {
    tool: 'Task',
    parameters: {
      subagent_type: 'general',
      prompt: line,
      description: 'Natural language command',
    },
    raw: line,
    line: lineNumber,
  };
}

/**
 * Parse RocketLang file
 */
export async function parseFile(filePath: string): Promise<ParseResult> {
  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  return parse(content);
}

/**
 * Resolve path (handle relative paths)
 */
function resolvePath(inputPath: string): string {
  const path = inputPath.trim();

  // If already absolute, return as-is
  if (path.startsWith('/')) {
    return path;
  }

  // Make absolute from cwd
  const cwd = process.cwd();
  return `${cwd}/${path}`;
}
