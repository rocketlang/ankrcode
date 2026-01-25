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
export {
  JavaScriptEmitter,
  createJavaScriptEmitter,
  emitJavaScript,
  type EmitterConfig as JsEmitterConfig,
  type EmitResult as JsEmitResult,
} from './emitter-js.js';

export {
  GoEmitter,
  createGoEmitter,
  emitGo,
  type GoEmitterConfig,
  type GoEmitResult,
} from './emitter-go.js';

export {
  ShellEmitter,
  createShellEmitter,
  emitShell,
  type ShellEmitterConfig,
  type ShellEmitResult,
} from './emitter-sh.js';

import type { Program } from './ast.js';
import { emitJavaScript, type EmitResult as JsEmitResult, type EmitterConfig as JsEmitterConfig } from './emitter-js.js';
import { emitGo, type GoEmitResult, type GoEmitterConfig } from './emitter-go.js';
import { emitShell, type ShellEmitResult, type ShellEmitterConfig } from './emitter-sh.js';

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
export function compile(program: Program, options: CompilerOptions): CompileResult {
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
function normalizeTarget(target: CompilationTarget): 'js' | 'go' | 'sh' {
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
export function getTargetExtension(target: CompilationTarget): string {
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
export function getTargetMimeType(target: CompilationTarget): string {
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
