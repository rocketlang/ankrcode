/**
 * RocketLang Shell Emitter
 *
 * Compiles RocketLang AST to Shell (Bash) scripts.
 * Useful for simple automation and scripting tasks.
 *
 * Note: Shell has limitations - no objects, limited arrays,
 * no async. Complex programs should target JavaScript.
 */
import type { Program } from './ast.js';
/**
 * Shell emitter configuration
 */
export interface ShellEmitterConfig {
    /** Shell interpreter (default: /bin/bash) */
    interpreter?: string;
    /** Enable strict mode (set -euo pipefail) */
    strictMode?: boolean;
    /** Add comments for debugging */
    debug?: boolean;
}
/**
 * Emit result
 */
export interface ShellEmitResult {
    code: string;
    warnings: string[];
}
/**
 * Shell Emitter
 */
export declare class ShellEmitter {
    private config;
    private output;
    private warnings;
    private indentLevel;
    constructor(config?: Partial<ShellEmitterConfig>);
    /**
     * Emit a program
     */
    emit(program: Program): ShellEmitResult;
    /**
     * Emit helper functions
     */
    private emitHelpers;
    /**
     * Emit a statement
     */
    private emitStatement;
    /**
     * Emit variable declaration
     */
    private emitVariableDeclaration;
    /**
     * Emit function declaration
     */
    private emitFunctionDeclaration;
    /**
     * Emit if statement
     */
    private emitIfStatement;
    /**
     * Emit for statement
     */
    private emitForStatement;
    /**
     * Emit while statement
     */
    private emitWhileStatement;
    /**
     * Emit return statement
     */
    private emitReturnStatement;
    /**
     * Emit expression statement
     */
    private emitExpressionStatement;
    /**
     * Emit a condition for if/while
     */
    private emitCondition;
    /**
     * Emit an expression
     */
    private emitExpression;
    /**
     * Emit literal
     */
    private emitLiteral;
    /**
     * Emit identifier
     */
    private emitIdentifier;
    /**
     * Emit binary expression
     */
    private emitBinaryExpression;
    /**
     * Emit call expression
     */
    private emitCallExpression;
    /**
     * Emit array expression
     */
    private emitArrayExpression;
    /**
     * Get current indentation
     */
    private indent;
}
/**
 * Create a Shell emitter
 */
export declare function createShellEmitter(config?: Partial<ShellEmitterConfig>): ShellEmitter;
/**
 * Emit program to Shell script
 */
export declare function emitShell(program: Program, config?: Partial<ShellEmitterConfig>): ShellEmitResult;
declare const _default: {
    ShellEmitter: typeof ShellEmitter;
    createShellEmitter: typeof createShellEmitter;
    emitShell: typeof emitShell;
};
export default _default;
//# sourceMappingURL=emitter-sh.d.ts.map