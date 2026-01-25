/**
 * RocketLang Compiler
 *
 * Multi-target compiler that transforms RocketLang to:
 * - JavaScript (primary target)
 * - Go (high performance)
 * - Shell (simple scripts)
 */
export * from './ast.js';
export { JavaScriptEmitter, createJavaScriptEmitter, emitJavaScript, type EmitterConfig as JsEmitterConfig, type EmitResult as JsEmitResult, } from './emitter-js.js';
export { GoEmitter, createGoEmitter, emitGo, type GoEmitterConfig, type GoEmitResult, } from './emitter-go.js';
export { ShellEmitter, createShellEmitter, emitShell, type ShellEmitterConfig, type ShellEmitResult, } from './emitter-sh.js';
import type { Program } from './ast.js';
import { emitJavaScript, type EmitterConfig as JsEmitterConfig } from './emitter-js.js';
import { emitGo, type GoEmitterConfig } from './emitter-go.js';
import { emitShell, type ShellEmitterConfig } from './emitter-sh.js';
/**
 * Compilation target
 */
export type CompilationTarget = 'js' | 'javascript' | 'go' | 'golang' | 'sh' | 'shell' | 'bash';
/**
 * Compiler options
 */
export interface CompilerOptions {
    target: CompilationTarget;
    jsConfig?: Partial<JsEmitterConfig>;
    goConfig?: Partial<GoEmitterConfig>;
    shConfig?: Partial<ShellEmitterConfig>;
}
/**
 * Compile result
 */
export interface CompileResult {
    target: CompilationTarget;
    code: string;
    warnings?: string[];
    sourceMap?: string;
    imports?: string[];
}
/**
 * Compile a RocketLang program to the specified target
 */
export declare function compile(program: Program, options: CompilerOptions): CompileResult;
/**
 * Get file extension for target
 */
export declare function getTargetExtension(target: CompilationTarget): string;
/**
 * Get MIME type for target
 */
export declare function getTargetMimeType(target: CompilationTarget): string;
declare const _default: {
    compile: typeof compile;
    getTargetExtension: typeof getTargetExtension;
    getTargetMimeType: typeof getTargetMimeType;
    emitJavaScript: typeof emitJavaScript;
    emitGo: typeof emitGo;
    emitShell: typeof emitShell;
};
export default _default;
//# sourceMappingURL=index.d.ts.map