/**
 * RocketLang JavaScript Emitter
 *
 * Compiles RocketLang AST to JavaScript code.
 * This is the primary compilation target.
 */
import type { Program } from './ast.js';
/**
 * Emitter configuration
 */
export interface EmitterConfig {
    /** Indentation string (default: 2 spaces) */
    indent?: string;
    /** Whether to include runtime helpers */
    includeRuntime?: boolean;
    /** Target module system: 'esm' | 'commonjs' */
    moduleSystem?: 'esm' | 'commonjs';
    /** Whether to add source maps */
    sourceMaps?: boolean;
}
/**
 * Emit result
 */
export interface EmitResult {
    code: string;
    sourceMap?: string;
}
/**
 * JavaScript Emitter
 */
export declare class JavaScriptEmitter {
    private config;
    private indentLevel;
    private output;
    constructor(config?: Partial<EmitterConfig>);
    /**
     * Emit a program
     */
    emit(program: Program): EmitResult;
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
     * Emit try statement
     */
    private emitTryStatement;
    /**
     * Emit import statement
     */
    private emitImportStatement;
    /**
     * Emit export statement
     */
    private emitExportStatement;
    /**
     * Emit parallel block
     */
    private emitParallelBlock;
    /**
     * Emit together block
     */
    private emitTogetherBlock;
    /**
     * Emit expression statement
     */
    private emitExpressionStatement;
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
     * Emit unary expression
     */
    private emitUnaryExpression;
    /**
     * Emit call expression
     */
    private emitCallExpression;
    /**
     * Emit member expression
     */
    private emitMemberExpression;
    /**
     * Emit index expression
     */
    private emitIndexExpression;
    /**
     * Emit conditional expression
     */
    private emitConditionalExpression;
    /**
     * Emit arrow function
     */
    private emitArrowFunction;
    /**
     * Emit array expression
     */
    private emitArrayExpression;
    /**
     * Emit object expression
     */
    private emitObjectExpression;
    /**
     * Emit await expression
     */
    private emitAwaitExpression;
    /**
     * Emit result expression
     */
    private emitResultExpression;
    /**
     * Emit channel expression
     */
    private emitChannelExpression;
    /**
     * Emit pipe expression
     */
    private emitPipeExpression;
    /**
     * Emit template string
     */
    private emitTemplateString;
    /**
     * Get current indentation
     */
    private indent;
}
/**
 * Create a JavaScript emitter
 */
export declare function createJavaScriptEmitter(config?: Partial<EmitterConfig>): JavaScriptEmitter;
/**
 * Emit program to JavaScript
 */
export declare function emitJavaScript(program: Program, config?: Partial<EmitterConfig>): EmitResult;
declare const _default: {
    JavaScriptEmitter: typeof JavaScriptEmitter;
    createJavaScriptEmitter: typeof createJavaScriptEmitter;
    emitJavaScript: typeof emitJavaScript;
    RUNTIME_HELPERS: string;
};
export default _default;
//# sourceMappingURL=emitter-js.d.ts.map