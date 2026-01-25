/**
 * RocketLang Compiler
 *
 * Multi-target compiler that transforms RocketLang to:
 * - JavaScript (primary target)
 * - Go (high performance)
 * - Shell (simple scripts)
 */
// AST
export * from './ast.js';
// Emitters
export { JavaScriptEmitter, createJavaScriptEmitter, emitJavaScript, } from './emitter-js.js';
export { GoEmitter, createGoEmitter, emitGo, } from './emitter-go.js';
export { ShellEmitter, createShellEmitter, emitShell, } from './emitter-sh.js';
import { emitJavaScript } from './emitter-js.js';
import { emitGo } from './emitter-go.js';
import { emitShell } from './emitter-sh.js';
/**
 * Compile a RocketLang program to the specified target
 */
export function compile(program, options) {
    const target = normalizeTarget(options.target);
    switch (target) {
        case 'js': {
            const result = emitJavaScript(program, options.jsConfig);
            return {
                target: 'js',
                code: result.code,
                sourceMap: result.sourceMap,
            };
        }
        case 'go': {
            const result = emitGo(program, options.goConfig);
            return {
                target: 'go',
                code: result.code,
                imports: result.imports,
            };
        }
        case 'sh': {
            const result = emitShell(program, options.shConfig);
            return {
                target: 'sh',
                code: result.code,
                warnings: result.warnings,
            };
        }
        default:
            throw new Error(`Unknown compilation target: ${options.target}`);
    }
}
/**
 * Normalize target name
 */
function normalizeTarget(target) {
    switch (target) {
        case 'js':
        case 'javascript':
            return 'js';
        case 'go':
        case 'golang':
            return 'go';
        case 'sh':
        case 'shell':
        case 'bash':
            return 'sh';
        default:
            return 'js';
    }
}
/**
 * Get file extension for target
 */
export function getTargetExtension(target) {
    const normalized = normalizeTarget(target);
    switch (normalized) {
        case 'js':
            return '.js';
        case 'go':
            return '.go';
        case 'sh':
            return '.sh';
        default:
            return '.js';
    }
}
/**
 * Get MIME type for target
 */
export function getTargetMimeType(target) {
    const normalized = normalizeTarget(target);
    switch (normalized) {
        case 'js':
            return 'application/javascript';
        case 'go':
            return 'text/x-go';
        case 'sh':
            return 'application/x-sh';
        default:
            return 'text/plain';
    }
}
export default {
    compile,
    getTargetExtension,
    getTargetMimeType,
    emitJavaScript,
    emitGo,
    emitShell,
};
//# sourceMappingURL=index.js.map