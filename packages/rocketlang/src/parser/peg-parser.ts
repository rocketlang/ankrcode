/**
 * PEG-based RocketLang Parser
 * Wrapper around the generated PEG.js parser
 */

import { parse as pegParse } from './grammar.js';
import type { RocketCommand, ParseResult, ParseError } from '../index.js';
import { normalize, transliterate, detectScript } from '../normalizer/index.js';

// AST Node types from PEG parser
interface ASTNode {
  type: string;
  [key: string]: unknown;
}

interface CommandNode extends ASTNode {
  type: 'command';
  tool: string;
  parameters: Record<string, unknown>;
  raw: string;
  line: number;
  column: number;
}

interface BlockNode extends ASTNode {
  type: 'block';
  commands: ASTNode[];
}

interface ConditionalNode extends ASTNode {
  type: 'conditional';
  condition: ASTNode;
  then: ASTNode;
  else: ASTNode | null;
}

interface LoopNode extends ASTNode {
  type: 'loop';
  variable: string;
  iterable: ASTNode;
  body: ASTNode;
}

interface PipeNode extends ASTNode {
  type: 'pipe';
  left: ASTNode;
  right: ASTNode;
}

interface AssignmentNode extends ASTNode {
  type: 'assignment';
  name: string;
  value: unknown;
}

/**
 * Parse RocketLang code using PEG grammar
 */
export function parsePEG(input: string): ParseResult {
  const commands: RocketCommand[] = [];
  const errors: ParseError[] = [];

  // Pre-process: normalize Indic text
  const script = detectScript(input);
  let normalizedInput = input;

  if (script !== 'roman') {
    // Normalize each line
    normalizedInput = input
      .split('\n')
      .map(line => {
        // Keep comments as-is
        if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
          return line;
        }
        // Normalize and transliterate if needed
        let processed = normalize(line);
        if (script === 'devanagari') {
          processed = transliterate(processed, 'devanagari', 'roman');
        }
        // Tamil and Telugu transliteration would need separate mappings
        // For now, just use normalized form
        return processed;
      })
      .join('\n');
  }

  try {
    const ast = pegParse(normalizedInput) as BlockNode;
    extractCommands(ast, commands, errors);
  } catch (err) {
    const pegError = err as { location?: { start: { line: number; column: number } }; message: string };
    errors.push({
      message: pegError.message,
      line: pegError.location?.start.line ?? 1,
      column: pegError.location?.start.column ?? 1,
    });
  }

  return { commands, errors };
}

/**
 * Extract commands from AST
 */
function extractCommands(
  node: ASTNode,
  commands: RocketCommand[],
  errors: ParseError[]
): void {
  if (!node) return;

  switch (node.type) {
    case 'block':
      for (const child of (node as BlockNode).commands) {
        extractCommands(child, commands, errors);
      }
      break;

    case 'command':
      const cmdNode = node as CommandNode;
      commands.push({
        tool: cmdNode.tool,
        parameters: cmdNode.parameters,
        raw: cmdNode.raw,
        line: cmdNode.line,
      });
      break;

    case 'conditional':
      const condNode = node as ConditionalNode;
      // For now, just execute the 'then' block
      // TODO: Implement conditional evaluation
      extractCommands(condNode.then, commands, errors);
      break;

    case 'loop':
      const loopNode = node as LoopNode;
      // For now, just extract the body
      // TODO: Implement loop evaluation
      extractCommands(loopNode.body, commands, errors);
      break;

    case 'pipe':
      const pipeNode = node as PipeNode;
      // For pipes, we execute left first, then right
      extractCommands(pipeNode.left, commands, errors);
      extractCommands(pipeNode.right, commands, errors);
      break;

    case 'assignment':
      // Assignments are tracked but not executed as commands
      // TODO: Implement variable storage
      break;

    default:
      // Unknown node type, skip
      break;
  }
}

/**
 * Check if PEG parser is available
 */
export function isPEGAvailable(): boolean {
  try {
    // Try to import the grammar module
    return typeof pegParse === 'function';
  } catch {
    return false;
  }
}

/**
 * Get supported features
 */
export function getSupportedFeatures(): string[] {
  return [
    'File operations (read, write, edit, delete)',
    'Search operations (grep, glob, find)',
    'Git operations (commit, push, pull)',
    'Package management (npm install, test, run)',
    'Direct bash commands ($ prefix, run)',
    'Code generation (create API, function, component)',
    'Direct MCP tool calls (@tool {...})',
    'Conditionals (if/then/else, agar/toh/nahi)',
    'Loops (for/in/do, har/mein/karo)',
    'Pipe expressions (cmd1 | cmd2)',
    'Variable assignment (let x = value)',
    'Hindi verb support (padho, likho, banao, etc.)',
    'Tamil verb support (padi, ezhudhu, thedi)',
    'Telugu verb support (chadhuvu, rayi, vetuku)',
  ];
}
