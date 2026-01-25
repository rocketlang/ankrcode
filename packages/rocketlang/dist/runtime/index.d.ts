/**
 * RocketLang Runtime V2
 *
 * Executes RocketLang code with:
 * - Variable storage and scoping
 * - Function definitions and calls
 * - Async/await support
 * - Error handling with Result pattern
 * - Parallel execution
 * - Channel communication
 * - Type checking (optional)
 */
import type { ToolExecutor, RocketCommand } from '../index.js';
import { type RocketType, type ResultValue, type MaybeValue } from '../types/index.js';
/**
 * Channel for inter-task communication
 */
export interface RocketChannel<T = unknown> {
    __type: 'channel';
    name: string;
    buffer: T[];
    maxSize: number;
    closed: boolean;
    waiters: Array<(value: T) => void>;
}
/**
 * Value types in RocketLang
 */
export type RocketValue = string | number | boolean | null | undefined | RocketValue[] | {
    [key: string]: RocketValue;
} | RocketFunction | ResultValue | MaybeValue | RocketChannel;
/**
 * Function definition with optional types
 */
export interface RocketFunction {
    type: 'function';
    name: string;
    params: Array<{
        name: string;
        type?: RocketType;
    }>;
    returnType?: RocketType;
    body: RocketCommand[];
    async: boolean;
}
/**
 * Parallel task definition
 */
export interface ParallelTask {
    id: string;
    expression: RocketCommand;
    promise?: Promise<RocketValue>;
    result?: RocketValue;
    error?: Error;
}
/**
 * Scope for variable storage
 */
declare class Scope {
    private variables;
    private parent;
    constructor(parent?: Scope | null);
    get(name: string): RocketValue | undefined;
    set(name: string, value: RocketValue): void;
    has(name: string): boolean;
    assign(name: string, value: RocketValue): boolean;
    getAll(): Map<string, RocketValue>;
}
/**
 * Runtime execution context
 */
export interface RuntimeContext {
    executor: ToolExecutor;
    scope: Scope;
    functions: Map<string, RocketFunction>;
    channels: Map<string, RocketChannel>;
    output: (value: unknown) => void;
    error: (error: Error) => void;
    typeChecking: boolean;
}
/**
 * RocketLang Runtime V2
 */
export declare class RocketRuntime {
    private globalScope;
    private functions;
    private channels;
    private executor;
    private outputHandler;
    private errorHandler;
    private typeChecking;
    constructor(options?: {
        executor?: ToolExecutor;
        onOutput?: (value: unknown) => void;
        onError?: (error: Error) => void;
        typeChecking?: boolean;
    });
    /**
     * Default executor (logs commands)
     */
    private defaultExecutor;
    /**
     * Register built-in functions
     */
    private registerBuiltins;
    /**
     * Execute built-in function
     */
    private executeBuiltin;
    /**
     * Get a variable value
     */
    getVariable(name: string): RocketValue | undefined;
    /**
     * Set a variable value
     */
    setVariable(name: string, value: RocketValue): void;
    /**
     * Define a function
     */
    defineFunction(fn: RocketFunction): void;
    /**
     * Execute a RocketLang command
     */
    execute(command: RocketCommand, scope?: Scope): Promise<RocketValue>;
    /**
     * Execute multiple commands
     */
    executeAll(commands: RocketCommand[]): Promise<RocketValue[]>;
    /**
     * Evaluate a command
     */
    private evaluateCommand;
    /**
     * Handle let/maan (variable declaration)
     */
    private handleLet;
    /**
     * Handle const/sthir (constant declaration)
     */
    private handleConst;
    /**
     * Handle function definition
     */
    private handleFunction;
    /**
     * Call a function
     */
    private callFunction;
    /**
     * Handle if/agar (conditional)
     */
    private handleIf;
    /**
     * Handle for/har (loop)
     */
    private handleFor;
    /**
     * Handle while/jab_tak (while loop)
     */
    private handleWhile;
    /**
     * Handle return/lautao
     */
    private handleReturn;
    /**
     * Handle try/koshish (error handling)
     */
    private handleTry;
    /**
     * Handle success/सफल (Result success)
     */
    private handleSuccess;
    /**
     * Handle failure/विफल (Result failure)
     */
    private handleFailure;
    /**
     * Handle parallel/समानांतर (run in background)
     */
    private handleParallel;
    /**
     * Handle wait/इंतज़ार (await async result)
     */
    private handleWait;
    /**
     * Handle together/साथ में (run multiple tasks in parallel, wait for all)
     */
    private handleTogether;
    /**
     * Handle send/भेजो (send to channel)
     */
    private handleSend;
    /**
     * Handle receive/पाओ (receive from channel)
     */
    private handleReceive;
    /**
     * Close a channel
     */
    closeChannel(name: string): boolean;
    /**
     * Execute a tool
     */
    private executeTool;
    /**
     * Resolve a value (handles variable references, expressions)
     */
    private resolveValue;
    /**
     * Check if value is truthy
     */
    private isTruthy;
    /**
     * Get all variables
     */
    getAllVariables(): Map<string, RocketValue>;
    /**
     * Get all functions
     */
    getAllFunctions(): Map<string, RocketFunction>;
    /**
     * Get all channels
     */
    getAllChannels(): Map<string, RocketChannel>;
    /**
     * Check if type checking is enabled
     */
    isTypeCheckingEnabled(): boolean;
    /**
     * Enable or disable type checking
     */
    setTypeChecking(enabled: boolean): void;
    /**
     * Clear runtime state
     */
    clear(): void;
}
/**
 * Create a new runtime instance
 */
export declare function createRuntime(options?: {
    executor?: ToolExecutor;
    onOutput?: (value: unknown) => void;
    onError?: (error: Error) => void;
    typeChecking?: boolean;
}): RocketRuntime;
declare const _default: {
    RocketRuntime: typeof RocketRuntime;
    createRuntime: typeof createRuntime;
};
export default _default;
//# sourceMappingURL=index.d.ts.map