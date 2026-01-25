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
export function toToolCalls(commands: RocketCommand[]): ToolCall[] {
  return commands.map((cmd) => ({
    name: cmd.tool,
    parameters: cmd.parameters,
  }));
}

/**
 * Generate TypeScript code from commands
 */
export function toTypeScript(commands: RocketCommand[]): string {
  const imports = new Set<string>();
  const statements: string[] = [];

  for (const cmd of commands) {
    const { code, importsNeeded } = commandToTypeScript(cmd);
    importsNeeded.forEach((i) => imports.add(i));
    statements.push(code);
  }

  const importStatements = Array.from(imports)
    .map((i) => `import ${i};`)
    .join('\n');

  return `${importStatements}\n\nasync function main() {\n${statements.map((s) => `  ${s}`).join('\n')}\n}\n\nmain();`;
}

function commandToTypeScript(cmd: RocketCommand): {
  code: string;
  importsNeeded: string[];
} {
  switch (cmd.tool) {
    case 'Read':
      return {
        code: `const content = await fs.readFile('${cmd.parameters.file_path}', 'utf-8');`,
        importsNeeded: ["{ promises as fs } from 'fs'"],
      };

    case 'Write':
      return {
        code: `await fs.writeFile('${cmd.parameters.file_path}', \`${cmd.parameters.content}\`);`,
        importsNeeded: ["{ promises as fs } from 'fs'"],
      };

    case 'Bash':
      return {
        code: `await exec('${cmd.parameters.command}');`,
        importsNeeded: ["{ exec } from 'child_process'"],
      };

    case 'Glob':
      return {
        code: `const files = await glob('${cmd.parameters.pattern}');`,
        importsNeeded: ["{ glob } from 'fast-glob'"],
      };

    case 'Grep':
      return {
        code: `const matches = await grep('${cmd.parameters.pattern}', '${cmd.parameters.path || '.'}');`,
        importsNeeded: ["{ grep } from '@ankr/ankrcode-core'"],
      };

    default:
      return {
        code: `// ${cmd.tool}: ${JSON.stringify(cmd.parameters)}`,
        importsNeeded: [],
      };
  }
}

/**
 * Generate shell script from commands
 */
export function toShellScript(commands: RocketCommand[]): string {
  const lines = ['#!/bin/bash', 'set -e', ''];

  for (const cmd of commands) {
    lines.push(`# ${cmd.raw}`);

    switch (cmd.tool) {
      case 'Read':
        lines.push(`cat "${cmd.parameters.file_path}"`);
        break;

      case 'Write':
        lines.push(`cat > "${cmd.parameters.file_path}" << 'EOF'`);
        lines.push(String(cmd.parameters.content));
        lines.push('EOF');
        break;

      case 'Bash':
        lines.push(String(cmd.parameters.command));
        break;

      case 'Glob':
        lines.push(`find . -name "${cmd.parameters.pattern}"`);
        break;

      case 'Grep':
        lines.push(
          `grep -r "${cmd.parameters.pattern}" ${cmd.parameters.path || '.'}`
        );
        break;

      default:
        lines.push(`# Unsupported: ${cmd.tool}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}
