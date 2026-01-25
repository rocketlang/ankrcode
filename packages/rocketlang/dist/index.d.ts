/**
 * RocketLang - Indic-first DSL for AnkrCode
 *
 * RocketLang allows developers to write commands in:
 * - Hindi (Devanagari or transliterated)
 * - Tamil, Telugu, Kannada, and other Indic languages
 * - English
 * - Mixed code-switching (how Indians actually speak)
 */
export { parse, parseFile } from './parser/index.js';
export { parsePEG, isPEGAvailable, getSupportedFeatures } from './parser/peg-parser.js';
export { normalize, transliterate, detectScript } from './normalizer/index.js';
export { toToolCalls, toTypeScript, toShellScript } from './codegen/index.js';
export { RocketREPL, startREPL, runScript } from './repl/index.js';
export type { REPLOptions } from './repl/index.js';
export { RocketRuntime, createRuntime } from './runtime/index.js';
export type { RocketValue, RocketFunction, RocketChannel, ParallelTask } from './runtime/index.js';
export { Types, TYPE_ALIASES, parseType, formatType, isTypeCompatible, inferType, Result, Maybe, } from './types/index.js';
export type { RocketType, PrimitiveType, GenericType, FunctionType, ResultType, MaybeType, CustomType, AnyType, PrimitiveTypeName, GenericTypeName, ResultValue, MaybeValue, } from './types/index.js';
export { ModuleResolver, createResolver, ModuleLoader, createLoader, BUILTIN_MODULES, MODULE_ALIASES, } from './modules/index.js';
export type { ModuleResolution, ResolverConfig, LoadedModule, ModuleExports, ImportSpec, ExportSpec, LoaderConfig, } from './modules/index.js';
export { compile, getTargetExtension, getTargetMimeType, emitJavaScript, emitGo, emitShell, JavaScriptEmitter, GoEmitter, ShellEmitter, createJavaScriptEmitter, createGoEmitter, createShellEmitter, } from './compiler/index.js';
export type { CompilationTarget, CompilerOptions, CompileResult, Program, Statement, Expression, SourceLocation, } from './compiler/index.js';
export interface RocketCommand {
    tool: string;
    parameters: Record<string, unknown>;
    raw: string;
    line: number;
}
export interface ParseResult {
    commands: RocketCommand[];
    errors: ParseError[];
}
export interface ParseError {
    message: string;
    line: number;
    column: number;
}
export interface ToolCall {
    name: string;
    parameters: Record<string, unknown>;
}
export interface ToolExecutor {
    (name: string, params: Record<string, unknown>): Promise<unknown>;
}
/**
 * Execute a RocketLang script
 * @param script - The RocketLang script to execute
 * @param executor - Tool executor function (from ankrcode-core)
 */
export declare function execute(script: string, executor: ToolExecutor): Promise<void>;
//# sourceMappingURL=index.d.ts.map