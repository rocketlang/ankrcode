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
import type { ToolExecutor } from '../index.js';
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
 * RocketLang REPL
 */
export declare class RocketREPL {
    private options;
    private state;
    private rl;
    constructor(options?: REPLOptions);
    /**
     * Start the REPL
     */
    start(): Promise<void>;
    /**
     * Stop the REPL
     */
    stop(): void;
    /**
     * Execute a single command (for programmatic use)
     */
    execute(input: string): Promise<unknown>;
    /**
     * Get current prompt
     */
    private getPrompt;
    /**
     * Handle a line of input
     */
    private handleLine;
    /**
     * Handle dot commands (.help, .exit, etc.)
     */
    private handleDotCommand;
    /**
     * Process RocketLang input
     */
    private processInput;
    /**
     * Execute a single command
     */
    private executeCommand;
    /**
     * Substitute variables in parameters
     */
    private substituteVariables;
    /**
     * Output to user
     */
    private output;
    /**
     * Output error
     */
    private error;
    /**
     * Get variable value
     */
    getVariable(name: string): unknown;
    /**
     * Set variable value
     */
    setVariable(name: string, value: unknown): void;
    /**
     * Get all variables
     */
    getVariables(): Map<string, unknown>;
}
/**
 * Create and start a REPL
 */
export declare function startREPL(options?: REPLOptions): RocketREPL;
/**
 * Execute a script string
 */
export declare function runScript(script: string, executor?: ToolExecutor, options?: Partial<REPLOptions>): Promise<unknown[]>;
declare const _default: {
    RocketREPL: typeof RocketREPL;
    startREPL: typeof startREPL;
    runScript: typeof runScript;
};
export default _default;
//# sourceMappingURL=index.d.ts.map