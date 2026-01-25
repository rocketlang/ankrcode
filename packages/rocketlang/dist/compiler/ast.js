/**
 * RocketLang AST Definitions
 *
 * Provides structured representation of parsed RocketLang code
 * for type checking and compilation.
 */
// =============================================================================
// AST HELPERS
// =============================================================================
/**
 * Create an AST node with location
 */
export function createNode(type, props, location) {
    return {
        type,
        ...props,
        location,
    };
}
/**
 * Create a literal node
 */
export function literal(value, location) {
    return createNode('Literal', { value }, location);
}
/**
 * Create an identifier node
 */
export function identifier(name, location) {
    return createNode('Identifier', { name }, location);
}
/**
 * Create a binary expression
 */
export function binary(operator, left, right, location) {
    return createNode('BinaryExpression', { operator, left, right }, location);
}
/**
 * Create a call expression
 */
export function call(callee, args, location) {
    return createNode('CallExpression', { callee, arguments: args }, location);
}
/**
 * Check if node is an expression
 */
export function isExpression(node) {
    return [
        'Literal',
        'Identifier',
        'BinaryExpression',
        'UnaryExpression',
        'CallExpression',
        'MemberExpression',
        'IndexExpression',
        'ConditionalExpression',
        'ArrowFunction',
        'ArrayExpression',
        'ObjectExpression',
        'AwaitExpression',
        'ResultExpression',
        'ChannelExpression',
        'PipeExpression',
        'TemplateString',
    ].includes(node.type);
}
/**
 * Check if node is a statement
 */
export function isStatement(node) {
    return [
        'VariableDeclaration',
        'FunctionDeclaration',
        'IfStatement',
        'ForStatement',
        'WhileStatement',
        'ReturnStatement',
        'TryStatement',
        'ImportStatement',
        'ExportStatement',
        'TypeAliasStatement',
        'ParallelBlock',
        'TogetherBlock',
        'ExpressionStatement',
    ].includes(node.type);
}
export default {
    createNode,
    literal,
    identifier,
    binary,
    call,
    isExpression,
    isStatement,
};
//# sourceMappingURL=ast.js.map