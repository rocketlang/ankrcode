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
export { RocketRuntime, createRuntime } from './runtime/index.js';
// Type System (V2)
export { Types, TYPE_ALIASES, parseType, formatType, isTypeCompatible, inferType, Result, Maybe, } from './types/index.js';
// Module System (V2)
export { ModuleResolver, createResolver, ModuleLoader, createLoader, BUILTIN_MODULES, MODULE_ALIASES, } from './modules/index.js';
// Compiler (V2)
export { compile, getTargetExtension, getTargetMimeType, emitJavaScript, emitGo, emitShell, JavaScriptEmitter, GoEmitter, ShellEmitter, createJavaScriptEmitter, createGoEmitter, createShellEmitter, } from './compiler/index.js';
/**
 * Execute a RocketLang script
 * @param script - The RocketLang script to execute
 * @param executor - Tool executor function (from ankrcode-core)
 */
export async function execute(script, executor) {
    const { parse } = await import('./parser/index.js');
    const { toToolCalls } = await import('./codegen/index.js');
    const result = parse(script);
    if (result.errors.length > 0) {
        throw new Error(`Parse errors:\n${result.errors.map((e) => e.message).join('\n')}`);
    }
    const toolCalls = toToolCalls(result.commands);
    // Execute tool calls using injected executor
    for (const call of toolCalls) {
        await executor(call.name, call.parameters);
    }
}
//# sourceMappingURL=index.js.map