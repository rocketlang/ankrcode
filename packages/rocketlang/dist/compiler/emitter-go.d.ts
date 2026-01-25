/**
 * RocketLang Go Emitter
 *
 * Compiles RocketLang AST to Go code.
 * For high-performance compiled applications.
 */
import type { Program } from './ast.js';
/**
 * Go emitter configuration
 */
export interface GoEmitterConfig {
    /** Package name */
    packageName?: string;
    /** Add fmt import for printing */
    includeFmt?: boolean;
    /** Generate main function wrapper */
    generateMain?: boolean;
}
/**
 * Emit result
 */
export interface GoEmitResult {
    code: string;
    imports: string[];
}
/**
 * Go Emitter
 */
export declare class GoEmitter {
    private config;
    private output;
    private imports;
    private indentLevel;
    constructor(config?: Partial<GoEmitterConfig>);
    /**
     * Emit a program
     */
    emit(program: Program): GoEmitResult;
    /**
     * Emit helper types
     */
    private emitHelperTypes;
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
     * Emit parallel block (goroutines)
     */
    private emitParallelBlock;
    /**
     * Emit together block
     */
    private emitTogetherBlock;
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
     * Emit array expression
     */
    private emitArrayExpression;
    /**
     * Emit object expression
     */
    private emitObjectExpression;
    /**
     * Emit result expression
     */
    private emitResultExpression;
    /**
     * Emit channel expression
     */
    private emitChannelExpression;
    /**
     * Map RocketLang type to Go type
     */
    private mapType;
    /**
     * Get current indentation
     */
    private indent;
}
/**
 * Create a Go emitter
 */
export declare function createGoEmitter(config?: Partial<GoEmitterConfig>): GoEmitter;
/**
 * Emit program to Go
 */
export declare function emitGo(program: Program, config?: Partial<GoEmitterConfig>): GoEmitResult;
declare const _default: {
    GoEmitter: typeof GoEmitter;
    createGoEmitter: typeof createGoEmitter;
    emitGo: typeof emitGo;
};
export default _default;
//# sourceMappingURL=emitter-go.d.ts.map