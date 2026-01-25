/**
 * RocketLang REPL - Interactive Shell
 *
 * Features:
 * - Execute RocketLang commands interactively
 * - Variable persistence across commands
 * - Command history
 * - Multi-line input
 * - Hindi/English prompts
 */

import * as readline from 'readline';
import { parse } from '../parser/index.js';
import { parsePEG, isPEGAvailable } from '../parser/peg-parser.js';
import { toToolCalls } from '../codegen/index.js';
import { detectScript } from '../normalizer/index.js';
import type { ToolExecutor, RocketCommand, ParseResult } from '../index.js';

/**
 * REPL Options
 */
export interface REPLOptions {
  prompt?: string;
  language?: 'en' | 'hi';
  executor?: ToolExecutor;
  usePEG?: boolean;
  showAST?: boolean;
  verbose?: boolean;
  onOutput?: (output: string) => void;
  onError?: (error: string) => void;
}

/**
 * REPL State
 */
interface REPLState {
  variables: Map<string, unknown>;
  history: string[];
  historyIndex: number;
  multilineBuffer: string[];
  isMultiline: boolean;
  running: boolean;
}

/**
 * Default executor (just logs commands)
 */
const defaultExecutor: ToolExecutor = async (name, params) => {
  console.log(`[Execute] ${name}:`, JSON.stringify(params, null, 2));
  return { success: true, output: `Executed ${name}` };
};

/**
 * REPL prompts in different languages
 */
const PROMPTS = {
  en: {
    normal: 'rocket> ',
    multiline: '....... ',
    welcome: 'RocketLang REPL v1.0.0 - Type .help for commands',
    goodbye: 'Goodbye!',
    help: `
Commands:
  .help     Show this help
  .exit     Exit REPL
  .clear    Clear variables
  .vars     Show variables
  .history  Show command history
  .ast      Toggle AST display
  .peg      Toggle PEG parser

RocketLang Examples:
  read "file.txt"           Read a file
  padho "config.json"       Hindi: read
  search "TODO" in "src"    Search files
  commit "my message"       Git commit
  let x = read "file.txt"   Assign to variable
  @gst_verify { gstin: "123" }  MCP tool call
`,
  },
  hi: {
    normal: '\u0930\u0949\u0915\u0947\u091F> ',
    multiline: '....... ',
    welcome: 'RocketLang REPL v1.0.0 - .help type karo commands ke liye',
    goodbye: 'Alvida!',
    help: `
Commands:
  .help     Yeh help dikhao
  .exit     REPL se bahar jao
  .clear    Variables clear karo
  .vars     Variables dikhao
  .history  History dikhao
  .ast      AST display toggle karo
  .peg      PEG parser toggle karo

RocketLang Examples:
  padho "file.txt"           File padho
  likho "hello" mein "test.txt"  File mein likho
  khojo "TODO" mein "src"    Files mein khojo
  commit "mera message"      Git commit
  maan x = padho "file.txt"  Variable mein rakho
`,
  },
};

/**
 * RocketLang REPL
 */
export class RocketREPL {
  private options: Required<REPLOptions>;
  private state: REPLState;
  private rl: readline.Interface | null = null;

  constructor(options: REPLOptions = {}) {
    this.options = {
      prompt: options.prompt || PROMPTS.en.normal,
      language: options.language || 'en',
      executor: options.executor || defaultExecutor,
      usePEG: options.usePEG ?? isPEGAvailable(),
      showAST: options.showAST ?? false,
      verbose: options.verbose ?? false,
      onOutput: options.onOutput || console.log,
      onError: options.onError || console.error,
    };

    this.state = {
      variables: new Map(),
      history: [],
      historyIndex: -1,
      multilineBuffer: [],
      isMultiline: false,
      running: false,
    };
  }

  /**
   * Start the REPL
   */
  async start(): Promise<void> {
    const prompts = PROMPTS[this.options.language];

    this.output(prompts.welcome);
    this.output('');

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.getPrompt(),
      historySize: 1000,
    });

    this.state.running = true;

    this.rl.on('line', async (line) => {
      await this.handleLine(line);
      if (this.state.running) {
        this.rl?.setPrompt(this.getPrompt());
        this.rl?.prompt();
      }
    });

    this.rl.on('close', () => {
      this.output(prompts.goodbye);
      this.state.running = false;
    });

    this.rl.prompt();
  }

  /**
   * Stop the REPL
   */
  stop(): void {
    this.state.running = false;
    this.rl?.close();
  }

  /**
   * Execute a single command (for programmatic use)
   */
  async execute(input: string): Promise<unknown> {
    return this.processInput(input);
  }

  /**
   * Get current prompt
   */
  private getPrompt(): string {
    const prompts = PROMPTS[this.options.language];
    return this.state.isMultiline ? prompts.multiline : prompts.normal;
  }

  /**
   * Handle a line of input
   */
  private async handleLine(line: string): Promise<void> {
    const trimmed = line.trim();

    // Handle multi-line input
    if (this.state.isMultiline) {
      if (trimmed === '') {
        // Empty line ends multi-line mode
        const fullInput = this.state.multilineBuffer.join('\n');
        this.state.multilineBuffer = [];
        this.state.isMultiline = false;
        await this.processInput(fullInput);
      } else {
        this.state.multilineBuffer.push(line);
      }
      return;
    }

    // Check for multi-line start (open brace or backslash)
    if (trimmed.endsWith('{') || trimmed.endsWith('\\')) {
      this.state.isMultiline = true;
      this.state.multilineBuffer = [line.replace(/\\$/, '')];
      return;
    }

    // Handle dot commands
    if (trimmed.startsWith('.')) {
      await this.handleDotCommand(trimmed);
      return;
    }

    // Skip empty lines
    if (trimmed === '') {
      return;
    }

    // Add to history
    this.state.history.push(trimmed);
    this.state.historyIndex = this.state.history.length;

    // Process input
    await this.processInput(trimmed);
  }

  /**
   * Handle dot commands (.help, .exit, etc.)
   */
  private async handleDotCommand(command: string): Promise<void> {
    const prompts = PROMPTS[this.options.language];
    const cmd = command.toLowerCase();

    switch (cmd) {
      case '.help':
        this.output(prompts.help);
        break;

      case '.exit':
      case '.quit':
        this.stop();
        break;

      case '.clear':
        this.state.variables.clear();
        this.output('Variables cleared');
        break;

      case '.vars':
        if (this.state.variables.size === 0) {
          this.output('No variables defined');
        } else {
          this.output('Variables:');
          for (const [name, value] of this.state.variables) {
            this.output(`  ${name} = ${JSON.stringify(value)}`);
          }
        }
        break;

      case '.history':
        if (this.state.history.length === 0) {
          this.output('No history');
        } else {
          this.output('History:');
          this.state.history.slice(-20).forEach((cmd, i) => {
            this.output(`  ${i + 1}. ${cmd}`);
          });
        }
        break;

      case '.ast':
        this.options.showAST = !this.options.showAST;
        this.output(`AST display: ${this.options.showAST ? 'ON' : 'OFF'}`);
        break;

      case '.peg':
        if (isPEGAvailable()) {
          this.options.usePEG = !this.options.usePEG;
          this.output(`PEG parser: ${this.options.usePEG ? 'ON' : 'OFF'}`);
        } else {
          this.output('PEG parser not available (grammar not built)');
        }
        break;

      default:
        this.error(`Unknown command: ${command}`);
    }
  }

  /**
   * Process RocketLang input
   */
  private async processInput(input: string): Promise<unknown> {
    try {
      // Parse input
      const parseResult: ParseResult = this.options.usePEG
        ? parsePEG(input)
        : parse(input);

      // Check for parse errors
      if (parseResult.errors.length > 0) {
        for (const err of parseResult.errors) {
          this.error(`Parse error at line ${err.line}: ${err.message}`);
        }
        return null;
      }

      // Show AST if enabled
      if (this.options.showAST) {
        this.output('AST:');
        this.output(JSON.stringify(parseResult.commands, null, 2));
      }

      // Execute commands
      const results: unknown[] = [];

      for (const cmd of parseResult.commands) {
        const result = await this.executeCommand(cmd);
        results.push(result);

        // Handle assignment
        if (cmd.tool === 'let' || cmd.tool === 'maan') {
          const varName = cmd.parameters.name as string;
          this.state.variables.set(varName, result);
          if (this.options.verbose) {
            this.output(`${varName} = ${JSON.stringify(result)}`);
          }
        }
      }

      // Return last result
      return results.length > 0 ? results[results.length - 1] : null;
    } catch (error) {
      this.error(`Error: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Execute a single command
   */
  private async executeCommand(cmd: RocketCommand): Promise<unknown> {
    // Substitute variables in parameters
    const params = this.substituteVariables(cmd.parameters);

    // Convert to tool call
    const toolCalls = toToolCalls([{ ...cmd, parameters: params }]);

    if (toolCalls.length === 0) {
      return null;
    }

    const toolCall = toolCalls[0];

    if (this.options.verbose) {
      this.output(`> ${toolCall.name}(${JSON.stringify(toolCall.parameters)})`);
    }

    // Execute using executor
    const result = await this.options.executor(toolCall.name, toolCall.parameters);

    // Display result
    if (result !== null && result !== undefined) {
      if (typeof result === 'object' && 'output' in (result as Record<string, unknown>)) {
        this.output((result as { output: string }).output);
      } else if (typeof result === 'string') {
        this.output(result);
      }
    }

    return result;
  }

  /**
   * Substitute variables in parameters
   */
  private substituteVariables(params: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        // Check for variable references ($varName or ${varName})
        result[key] = value.replace(/\$\{?(\w+)\}?/g, (_, name) => {
          const varValue = this.state.variables.get(name);
          return varValue !== undefined ? String(varValue) : `$${name}`;
        });
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Output to user
   */
  private output(text: string): void {
    this.options.onOutput(text);
  }

  /**
   * Output error
   */
  private error(text: string): void {
    this.options.onError(text);
  }

  /**
   * Get variable value
   */
  getVariable(name: string): unknown {
    return this.state.variables.get(name);
  }

  /**
   * Set variable value
   */
  setVariable(name: string, value: unknown): void {
    this.state.variables.set(name, value);
  }

  /**
   * Get all variables
   */
  getVariables(): Map<string, unknown> {
    return new Map(this.state.variables);
  }
}

/**
 * Create and start a REPL
 */
export function startREPL(options?: REPLOptions): RocketREPL {
  const repl = new RocketREPL(options);
  repl.start();
  return repl;
}

/**
 * Execute a script string
 */
export async function runScript(
  script: string,
  executor?: ToolExecutor,
  options?: Partial<REPLOptions>
): Promise<unknown[]> {
  const repl = new RocketREPL({
    ...options,
    executor: executor || defaultExecutor,
  });

  const results: unknown[] = [];

  for (const line of script.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const result = await repl.execute(trimmed);
      results.push(result);
    }
  }

  return results;
}

export default {
  RocketREPL,
  startREPL,
  runScript,
};
