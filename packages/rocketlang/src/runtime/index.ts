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

import type { ToolExecutor, RocketCommand, ParseResult } from '../index.js';
import {
  Result,
  Maybe,
  Types,
  isTypeCompatible,
  inferType,
  type RocketType,
  type ResultValue,
  type MaybeValue,
} from '../types/index.js';

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
export type RocketValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | RocketValue[]
  | { [key: string]: RocketValue }
  | RocketFunction
  | ResultValue
  | MaybeValue
  | RocketChannel;

/**
 * Function definition with optional types
 */
export interface RocketFunction {
  type: 'function';
  name: string;
  params: Array<{ name: string; type?: RocketType }>;
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
class Scope {
  private variables: Map<string, RocketValue> = new Map();
  private parent: Scope | null;

  constructor(parent: Scope | null = null) {
    this.parent = parent;
  }

  get(name: string): RocketValue | undefined {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    return undefined;
  }

  set(name: string, value: RocketValue): void {
    this.variables.set(name, value);
  }

  has(name: string): boolean {
    if (this.variables.has(name)) {
      return true;
    }
    if (this.parent) {
      return this.parent.has(name);
    }
    return false;
  }

  assign(name: string, value: RocketValue): boolean {
    // Assign to existing variable in scope chain
    if (this.variables.has(name)) {
      this.variables.set(name, value);
      return true;
    }
    if (this.parent) {
      return this.parent.assign(name, value);
    }
    return false;
  }

  getAll(): Map<string, RocketValue> {
    const all = new Map(this.parent?.getAll() || []);
    for (const [k, v] of this.variables) {
      all.set(k, v);
    }
    return all;
  }
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
export class RocketRuntime {
  private globalScope: Scope;
  private functions: Map<string, RocketFunction>;
  private channels: Map<string, RocketChannel>;
  private executor: ToolExecutor;
  private outputHandler: (value: unknown) => void;
  private errorHandler: (error: Error) => void;
  private typeChecking: boolean;

  constructor(options: {
    executor?: ToolExecutor;
    onOutput?: (value: unknown) => void;
    onError?: (error: Error) => void;
    typeChecking?: boolean;
  } = {}) {
    this.globalScope = new Scope();
    this.functions = new Map();
    this.channels = new Map();
    this.executor = options.executor || this.defaultExecutor.bind(this);
    this.outputHandler = options.onOutput || console.log;
    this.errorHandler = options.onError || console.error;
    this.typeChecking = options.typeChecking ?? false;

    // Register built-in functions
    this.registerBuiltins();
  }

  /**
   * Default executor (logs commands)
   */
  private async defaultExecutor(name: string, params: Record<string, unknown>): Promise<unknown> {
    this.outputHandler(`[Execute] ${name}: ${JSON.stringify(params)}`);
    return { success: true };
  }

  /**
   * Register built-in functions
   */
  private registerBuiltins(): void {
    // print function
    this.defineFunction({
      type: 'function',
      name: 'print',
      params: [{ name: 'value', type: Types.any() }],
      body: [],
      async: false,
    });

    // len function
    this.defineFunction({
      type: 'function',
      name: 'len',
      params: [{ name: 'value', type: Types.any() }],
      returnType: Types.number(),
      body: [],
      async: false,
    });

    // typeof function
    this.defineFunction({
      type: 'function',
      name: 'typeof',
      params: [{ name: 'value', type: Types.any() }],
      returnType: Types.text(),
      body: [],
      async: false,
    });

    // make_channel function (नाली बनाओ)
    this.defineFunction({
      type: 'function',
      name: 'make_channel',
      params: [{ name: 'name', type: Types.text() }],
      body: [],
      async: false,
    });
  }

  /**
   * Execute built-in function
   */
  private executeBuiltin(name: string, args: RocketValue[]): RocketValue {
    switch (name) {
      case 'print':
        this.outputHandler(args[0]);
        return null;

      case 'len':
        const val = args[0];
        if (typeof val === 'string') return val.length;
        if (Array.isArray(val)) return val.length;
        if (typeof val === 'object' && val !== null) return Object.keys(val).length;
        return 0;

      case 'typeof':
        if (args[0] === null) return 'null';
        if (Array.isArray(args[0])) return 'array';
        const v = args[0] as { __type?: string };
        if (v && typeof v === 'object' && '__type' in v) return v.__type as string;
        return typeof args[0];

      case 'make_channel':
        const channelName = args[0] as string || `channel_${Date.now()}`;
        const channel: RocketChannel = {
          __type: 'channel',
          name: channelName,
          buffer: [],
          maxSize: 100,
          closed: false,
          waiters: [],
        };
        this.channels.set(channelName, channel);
        return channel;

      default:
        throw new Error(`Unknown built-in function: ${name}`);
    }
  }

  /**
   * Get a variable value
   */
  getVariable(name: string): RocketValue | undefined {
    return this.globalScope.get(name);
  }

  /**
   * Set a variable value
   */
  setVariable(name: string, value: RocketValue): void {
    this.globalScope.set(name, value);
  }

  /**
   * Define a function
   */
  defineFunction(fn: RocketFunction): void {
    this.functions.set(fn.name, fn);
  }

  /**
   * Execute a RocketLang command
   */
  async execute(command: RocketCommand, scope: Scope = this.globalScope): Promise<RocketValue> {
    const ctx: RuntimeContext = {
      executor: this.executor,
      scope,
      functions: this.functions,
      channels: this.channels,
      output: this.outputHandler,
      error: this.errorHandler,
      typeChecking: this.typeChecking,
    };

    return this.evaluateCommand(command, ctx);
  }

  /**
   * Execute multiple commands
   */
  async executeAll(commands: RocketCommand[]): Promise<RocketValue[]> {
    const results: RocketValue[] = [];

    for (const cmd of commands) {
      const result = await this.execute(cmd);
      results.push(result);
    }

    return results;
  }

  /**
   * Evaluate a command
   */
  private async evaluateCommand(command: RocketCommand, ctx: RuntimeContext): Promise<RocketValue> {
    const tool = command.tool.toLowerCase();
    const params = command.parameters;

    // Handle special commands
    switch (tool) {
      case 'let':
      case 'maan':
        return this.handleLet(params, ctx);

      case 'const':
      case 'sthir':
        return this.handleConst(params, ctx);

      case 'fn':
      case 'function':
      case 'karya':
        return this.handleFunction(params, ctx);

      case 'if':
      case 'agar':
      case 'yadi':
        return this.handleIf(params, ctx);

      case 'for':
      case 'har':
        return this.handleFor(params, ctx);

      case 'while':
      case 'jab_tak':
        return this.handleWhile(params, ctx);

      case 'return':
      case 'lautao':
        return this.handleReturn(params, ctx);

      case 'try':
      case 'koshish':
        return this.handleTry(params, ctx);

      // V2: Result pattern
      case 'success':
      case 'safal':
      case 'सफल':
        return this.handleSuccess(params, ctx);

      case 'failure':
      case 'vifal':
      case 'विफल':
        return this.handleFailure(params, ctx);

      // V2: Concurrency
      case 'parallel':
      case 'samantar':
      case 'समानांतर':
        return this.handleParallel(params, ctx);

      case 'wait':
      case 'intezaar':
      case 'इंतज़ार':
      case 'ruko':
        return this.handleWait(params, ctx);

      case 'together':
      case 'saath_mein':
      case 'साथ में':
        return this.handleTogether(params, ctx);

      // V2: Channels
      case 'send':
      case 'bhejo':
      case 'भेजो':
        return this.handleSend(params, ctx);

      case 'receive':
      case 'pao':
      case 'पाओ':
        return this.handleReceive(params, ctx);

      case 'print':
      case 'likho':
        const value = await this.resolveValue(params.value || params[0], ctx);
        ctx.output(value);
        return null;

      default:
        // Check if it's a function call
        if (this.functions.has(tool)) {
          return this.callFunction(tool, params, ctx);
        }

        // Otherwise, execute as tool
        return this.executeTool(command, ctx);
    }
  }

  /**
   * Handle let/maan (variable declaration)
   */
  private async handleLet(params: Record<string, unknown>, ctx: RuntimeContext): Promise<RocketValue> {
    const name = params.name as string;
    const value = await this.resolveValue(params.value, ctx);
    ctx.scope.set(name, value);
    return value;
  }

  /**
   * Handle const/sthir (constant declaration)
   */
  private async handleConst(params: Record<string, unknown>, ctx: RuntimeContext): Promise<RocketValue> {
    const name = params.name as string;
    if (ctx.scope.has(name)) {
      throw new Error(`Constant '${name}' already defined`);
    }
    const value = await this.resolveValue(params.value, ctx);
    ctx.scope.set(name, value);
    return value;
  }

  /**
   * Handle function definition
   */
  private handleFunction(params: Record<string, unknown>, ctx: RuntimeContext): RocketValue {
    // Handle params - convert string[] to typed params for backward compatibility
    const rawParams = (params.params as unknown[]) || [];
    const typedParams: Array<{ name: string; type?: RocketType }> = rawParams.map((p) => {
      if (typeof p === 'string') {
        return { name: p };
      }
      if (typeof p === 'object' && p !== null) {
        const paramObj = p as { name: string; type?: RocketType };
        return { name: paramObj.name, type: paramObj.type };
      }
      return { name: String(p) };
    });

    const fn: RocketFunction = {
      type: 'function',
      name: params.name as string,
      params: typedParams,
      returnType: params.returnType as RocketType | undefined,
      body: (params.body as RocketCommand[]) || [],
      async: (params.async as boolean) || false,
    };

    this.functions.set(fn.name, fn);
    return fn;
  }

  /**
   * Call a function
   */
  private async callFunction(
    name: string,
    args: Record<string, unknown>,
    ctx: RuntimeContext
  ): Promise<RocketValue> {
    const fn = this.functions.get(name);
    if (!fn) {
      throw new Error(`Function '${name}' not defined`);
    }

    // Resolve argument values
    const argValues = await Promise.all(
      Object.values(args).map(v => this.resolveValue(v, ctx))
    );

    // Check for built-in
    if (fn.body.length === 0) {
      return this.executeBuiltin(name, argValues);
    }

    // Type check arguments if enabled
    if (ctx.typeChecking) {
      for (let i = 0; i < fn.params.length; i++) {
        const param = fn.params[i];
        if (param.type && argValues[i] !== undefined) {
          const actualType = inferType(argValues[i]);
          if (!isTypeCompatible(param.type, actualType)) {
            throw new Error(
              `Type error: argument '${param.name}' expects ${param.type.kind}, got ${actualType.kind}`
            );
          }
        }
      }
    }

    // Create new scope for function
    const fnScope = new Scope(ctx.scope);

    // Bind arguments to parameter names
    for (let i = 0; i < fn.params.length; i++) {
      const paramName = fn.params[i].name;
      fnScope.set(paramName, argValues[i] ?? null);
    }

    // Execute body
    const fnCtx = { ...ctx, scope: fnScope };
    let result: RocketValue = null;

    for (const cmd of fn.body) {
      try {
        result = await this.evaluateCommand(cmd, fnCtx);
      } catch (e) {
        if ((e as Error).message.startsWith('RETURN:')) {
          const returnValue = JSON.parse((e as Error).message.slice(7));

          // Type check return value if enabled
          if (ctx.typeChecking && fn.returnType) {
            const actualType = inferType(returnValue);
            if (!isTypeCompatible(fn.returnType, actualType)) {
              throw new Error(
                `Type error: function '${name}' should return ${fn.returnType.kind}, got ${actualType.kind}`
              );
            }
          }

          return returnValue;
        }
        throw e;
      }
    }

    return result;
  }

  /**
   * Handle if/agar (conditional)
   */
  private async handleIf(params: Record<string, unknown>, ctx: RuntimeContext): Promise<RocketValue> {
    const condition = await this.resolveValue(params.condition, ctx);

    if (this.isTruthy(condition)) {
      const thenBody = params.then as RocketCommand[];
      if (thenBody) {
        for (const cmd of thenBody) {
          await this.evaluateCommand(cmd, ctx);
        }
      }
    } else if (params.else) {
      const elseBody = params.else as RocketCommand[];
      for (const cmd of elseBody) {
        await this.evaluateCommand(cmd, ctx);
      }
    }

    return null;
  }

  /**
   * Handle for/har (loop)
   */
  private async handleFor(params: Record<string, unknown>, ctx: RuntimeContext): Promise<RocketValue> {
    const varName = params.variable as string;
    const iterable = await this.resolveValue(params.iterable, ctx);
    const body = params.body as RocketCommand[];

    if (!Array.isArray(iterable)) {
      throw new Error('for loop requires an iterable (array)');
    }

    const loopScope = new Scope(ctx.scope);
    const loopCtx = { ...ctx, scope: loopScope };

    for (const item of iterable) {
      loopScope.set(varName, item);
      for (const cmd of body) {
        await this.evaluateCommand(cmd, loopCtx);
      }
    }

    return null;
  }

  /**
   * Handle while/jab_tak (while loop)
   */
  private async handleWhile(params: Record<string, unknown>, ctx: RuntimeContext): Promise<RocketValue> {
    const body = params.body as RocketCommand[];
    let iterations = 0;
    const maxIterations = 10000; // Safety limit

    while (iterations < maxIterations) {
      const condition = await this.resolveValue(params.condition, ctx);
      if (!this.isTruthy(condition)) break;

      for (const cmd of body) {
        await this.evaluateCommand(cmd, ctx);
      }

      iterations++;
    }

    if (iterations >= maxIterations) {
      throw new Error('While loop exceeded maximum iterations');
    }

    return null;
  }

  /**
   * Handle return/lautao
   */
  private async handleReturn(params: Record<string, unknown>, ctx: RuntimeContext): Promise<RocketValue> {
    const value = await this.resolveValue(params.value, ctx);
    throw new Error('RETURN:' + JSON.stringify(value));
  }

  /**
   * Handle try/koshish (error handling)
   */
  private async handleTry(params: Record<string, unknown>, ctx: RuntimeContext): Promise<RocketValue> {
    const tryBody = params.try as RocketCommand[];
    const catchBody = params.catch as RocketCommand[];
    const finallyBody = params.finally as RocketCommand[];

    try {
      for (const cmd of tryBody) {
        await this.evaluateCommand(cmd, ctx);
      }
    } catch (error) {
      if (catchBody) {
        const catchScope = new Scope(ctx.scope);
        catchScope.set('error', (error as Error).message);
        const catchCtx = { ...ctx, scope: catchScope };
        for (const cmd of catchBody) {
          await this.evaluateCommand(cmd, catchCtx);
        }
      }
    } finally {
      if (finallyBody) {
        for (const cmd of finallyBody) {
          await this.evaluateCommand(cmd, ctx);
        }
      }
    }

    return null;
  }

  // =============================================================================
  // V2 HANDLERS: Result Pattern
  // =============================================================================

  /**
   * Handle success/सफल (Result success)
   */
  private async handleSuccess(params: Record<string, unknown>, ctx: RuntimeContext): Promise<RocketValue> {
    const value = await this.resolveValue(params.value, ctx);
    return Result.success(value);
  }

  /**
   * Handle failure/विफल (Result failure)
   */
  private async handleFailure(params: Record<string, unknown>, ctx: RuntimeContext): Promise<RocketValue> {
    const error = await this.resolveValue(params.error || params.message, ctx);
    return Result.failure(error as string);
  }

  // =============================================================================
  // V2 HANDLERS: Concurrency
  // =============================================================================

  /**
   * Handle parallel/समानांतर (run in background)
   */
  private async handleParallel(params: Record<string, unknown>, ctx: RuntimeContext): Promise<RocketValue> {
    const body = params.body as RocketCommand[];
    const timeout = (params.timeout as number) || 30000;

    // Execute body in background (non-blocking)
    const promise = (async () => {
      const results: RocketValue[] = [];
      for (const cmd of body) {
        const result = await this.evaluateCommand(cmd, ctx);
        results.push(result);
      }
      return results.length === 1 ? results[0] : results;
    })();

    // Return a promise-like object that can be awaited
    return {
      __type: 'parallel_task',
      promise,
      timeout,
    } as unknown as RocketValue;
  }

  /**
   * Handle wait/इंतज़ार (await async result)
   */
  private async handleWait(params: Record<string, unknown>, ctx: RuntimeContext): Promise<RocketValue> {
    const expr = await this.resolveValue(params.expression, ctx);

    // Check if it's a parallel task
    if (expr && typeof expr === 'object' && (expr as Record<string, unknown>).__type === 'parallel_task') {
      const task = expr as unknown as { promise: Promise<RocketValue>; timeout: number };
      try {
        const result = await Promise.race([
          task.promise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout waiting for parallel task')), task.timeout)
          ),
        ]);
        return Result.success(result);
      } catch (error) {
        return Result.failure((error as Error).message);
      }
    }

    // If it's a promise, await it directly
    if (expr instanceof Promise) {
      try {
        const result = await expr;
        return Result.success(result);
      } catch (error) {
        return Result.failure((error as Error).message);
      }
    }

    return expr;
  }

  /**
   * Handle together/साथ में (run multiple tasks in parallel, wait for all)
   */
  private async handleTogether(params: Record<string, unknown>, ctx: RuntimeContext): Promise<RocketValue> {
    const tasks = params.tasks as Array<{ name: string; expression: RocketCommand }>;
    const timeout = (params.timeout as number) || 30000;

    if (!tasks || !Array.isArray(tasks)) {
      throw new Error('together requires an array of tasks');
    }

    // Create promises for all tasks
    const taskPromises = tasks.map(async (task) => {
      try {
        const result = await this.evaluateCommand(task.expression, ctx);
        return { name: task.name, success: true, value: result };
      } catch (error) {
        return { name: task.name, success: false, error: (error as Error).message };
      }
    });

    // Wait for all with timeout
    try {
      const results = await Promise.race([
        Promise.all(taskPromises),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout in together block')), timeout)
        ),
      ]);

      // Build result object with task names as keys
      const resultObj: Record<string, RocketValue> = {};
      for (const result of results) {
        if (result.success) {
          resultObj[result.name] = result.value;
          ctx.scope.set(result.name, result.value);
        } else {
          resultObj[result.name] = Result.failure(result.error);
        }
      }

      return resultObj;
    } catch (error) {
      return Result.failure((error as Error).message);
    }
  }

  // =============================================================================
  // V2 HANDLERS: Channels
  // =============================================================================

  /**
   * Handle send/भेजो (send to channel)
   */
  private async handleSend(params: Record<string, unknown>, ctx: RuntimeContext): Promise<RocketValue> {
    const channelName = params.channel as string;
    const value = await this.resolveValue(params.value, ctx);

    const channel = ctx.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel '${channelName}' not found`);
    }

    if (channel.closed) {
      throw new Error(`Cannot send to closed channel '${channelName}'`);
    }

    // If there are waiters, deliver directly
    if (channel.waiters.length > 0) {
      const waiter = channel.waiters.shift()!;
      waiter(value);
      return Result.success(true);
    }

    // Otherwise, buffer the value
    if (channel.buffer.length >= channel.maxSize) {
      throw new Error(`Channel '${channelName}' buffer full`);
    }

    channel.buffer.push(value);
    return Result.success(true);
  }

  /**
   * Handle receive/पाओ (receive from channel)
   */
  private async handleReceive(params: Record<string, unknown>, ctx: RuntimeContext): Promise<RocketValue> {
    const channelName = params.channel as string;
    const timeout = (params.timeout as number) || 30000;

    const channel = ctx.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel '${channelName}' not found`);
    }

    // If buffer has values, return immediately
    if (channel.buffer.length > 0) {
      return Result.success(channel.buffer.shift()!);
    }

    // If channel is closed and empty, return nothing
    if (channel.closed) {
      return Maybe.none();
    }

    // Wait for a value
    return new Promise<RocketValue>((resolve) => {
      const timeoutId = setTimeout(() => {
        const idx = channel.waiters.indexOf(handler);
        if (idx !== -1) channel.waiters.splice(idx, 1);
        resolve(Result.failure('Timeout waiting for channel value'));
      }, timeout);

      const handler = (value: unknown) => {
        clearTimeout(timeoutId);
        resolve(Result.success(value));
      };

      channel.waiters.push(handler);
    });
  }

  /**
   * Close a channel
   */
  closeChannel(name: string): boolean {
    const channel = this.channels.get(name);
    if (channel) {
      channel.closed = true;
      // Notify all waiters
      for (const waiter of channel.waiters) {
        waiter(Maybe.none());
      }
      channel.waiters = [];
      return true;
    }
    return false;
  }

  /**
   * Execute a tool
   */
  private async executeTool(command: RocketCommand, ctx: RuntimeContext): Promise<RocketValue> {
    // Resolve any variable references in parameters
    const resolvedParams: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(command.parameters)) {
      resolvedParams[key] = await this.resolveValue(value, ctx);
    }

    // Execute via tool executor
    const result = await ctx.executor(command.tool, resolvedParams);

    // Extract value from result
    if (typeof result === 'object' && result !== null) {
      const resultObj = result as Record<string, unknown>;
      if ('output' in resultObj) return resultObj.output as RocketValue;
      if ('data' in resultObj) return resultObj.data as RocketValue;
    }

    return result as RocketValue;
  }

  /**
   * Resolve a value (handles variable references, expressions)
   */
  private async resolveValue(value: unknown, ctx: RuntimeContext): Promise<RocketValue> {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      // Check for variable reference
      if (value.startsWith('$')) {
        const varName = value.slice(1);
        return ctx.scope.get(varName) ?? null;
      }

      // Check for template string
      if (value.includes('${')) {
        return value.replace(/\$\{(\w+)\}/g, (_, name) => {
          const v = ctx.scope.get(name);
          return v !== undefined ? String(v) : '';
        });
      }

      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (Array.isArray(value)) {
      return Promise.all(value.map(v => this.resolveValue(v, ctx)));
    }

    if (typeof value === 'object') {
      const resolved: Record<string, RocketValue> = {};
      for (const [k, v] of Object.entries(value)) {
        resolved[k] = await this.resolveValue(v, ctx);
      }
      return resolved;
    }

    return null;
  }

  /**
   * Check if value is truthy
   */
  private isTruthy(value: RocketValue): boolean {
    if (value === null || value === undefined || value === false || value === 0 || value === '') {
      return false;
    }
    return true;
  }

  /**
   * Get all variables
   */
  getAllVariables(): Map<string, RocketValue> {
    return this.globalScope.getAll();
  }

  /**
   * Get all functions
   */
  getAllFunctions(): Map<string, RocketFunction> {
    return new Map(this.functions);
  }

  /**
   * Get all channels
   */
  getAllChannels(): Map<string, RocketChannel> {
    return new Map(this.channels);
  }

  /**
   * Check if type checking is enabled
   */
  isTypeCheckingEnabled(): boolean {
    return this.typeChecking;
  }

  /**
   * Enable or disable type checking
   */
  setTypeChecking(enabled: boolean): void {
    this.typeChecking = enabled;
  }

  /**
   * Clear runtime state
   */
  clear(): void {
    this.globalScope = new Scope();
    this.functions.clear();
    this.channels.clear();
    this.registerBuiltins();
  }
}

/**
 * Create a new runtime instance
 */
export function createRuntime(options?: {
  executor?: ToolExecutor;
  onOutput?: (value: unknown) => void;
  onError?: (error: Error) => void;
  typeChecking?: boolean;
}): RocketRuntime {
  return new RocketRuntime(options);
}

export default {
  RocketRuntime,
  createRuntime,
};
