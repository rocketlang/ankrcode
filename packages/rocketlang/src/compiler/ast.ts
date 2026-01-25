/**
 * RocketLang AST Definitions
 *
 * Provides structured representation of parsed RocketLang code
 * for type checking and compilation.
 */

import type { RocketType } from '../types/index.js';

/**
 * Source location
 */
export interface SourceLocation {
  line: number;
  column: number;
  offset?: number;
  file?: string;
}

/**
 * Base AST node
 */
export interface ASTNode {
  type: string;
  location?: SourceLocation;
}

// =============================================================================
// STATEMENTS
// =============================================================================

export type Statement =
  | VariableDeclaration
  | FunctionDeclaration
  | IfStatement
  | ForStatement
  | WhileStatement
  | ReturnStatement
  | TryStatement
  | ImportStatement
  | ExportStatement
  | TypeAliasStatement
  | ParallelBlock
  | TogetherBlock
  | ExpressionStatement;

/**
 * Variable declaration: let/const/maan/sthir
 */
export interface VariableDeclaration extends ASTNode {
  type: 'VariableDeclaration';
  kind: 'let' | 'const';
  name: string;
  typeAnnotation?: RocketType;
  value: Expression;
}

/**
 * Function declaration
 */
export interface FunctionDeclaration extends ASTNode {
  type: 'FunctionDeclaration';
  name: string;
  params: Parameter[];
  returnType?: RocketType;
  body: Statement[];
  async: boolean;
  exported: boolean;
}

/**
 * Function parameter
 */
export interface Parameter {
  name: string;
  type?: RocketType;
  defaultValue?: Expression;
}

/**
 * If statement
 */
export interface IfStatement extends ASTNode {
  type: 'IfStatement';
  condition: Expression;
  consequent: Statement[];
  alternate?: Statement[] | IfStatement;
}

/**
 * For loop
 */
export interface ForStatement extends ASTNode {
  type: 'ForStatement';
  variable: string;
  iterable: Expression;
  body: Statement[];
}

/**
 * While loop
 */
export interface WhileStatement extends ASTNode {
  type: 'WhileStatement';
  condition: Expression;
  body: Statement[];
}

/**
 * Return statement
 */
export interface ReturnStatement extends ASTNode {
  type: 'ReturnStatement';
  value?: Expression;
}

/**
 * Try statement
 */
export interface TryStatement extends ASTNode {
  type: 'TryStatement';
  tryBlock: Statement[];
  catchBlock?: Statement[];
  catchParam?: string;
  finallyBlock?: Statement[];
}

/**
 * Import statement: use/उपयोग
 */
export interface ImportStatement extends ASTNode {
  type: 'ImportStatement';
  items: ImportItem[];
  source: string;
  namespace?: string;
}

/**
 * Import item
 */
export interface ImportItem {
  name: string;
  alias?: string;
}

/**
 * Export statement: export/निर्यात
 */
export interface ExportStatement extends ASTNode {
  type: 'ExportStatement';
  declaration?: FunctionDeclaration | VariableDeclaration;
  names?: string[];
  from?: string;
}

/**
 * Type alias: type/प्रकार
 */
export interface TypeAliasStatement extends ASTNode {
  type: 'TypeAliasStatement';
  name: string;
  typeValue: RocketType;
}

/**
 * Parallel block: parallel/समानांतर
 */
export interface ParallelBlock extends ASTNode {
  type: 'ParallelBlock';
  body: Statement[];
  timeout?: Expression;
}

/**
 * Together block: together/साथ में
 */
export interface TogetherBlock extends ASTNode {
  type: 'TogetherBlock';
  tasks: Array<{
    name: string;
    expression: Expression;
  }>;
  timeout?: Expression;
}

/**
 * Expression statement
 */
export interface ExpressionStatement extends ASTNode {
  type: 'ExpressionStatement';
  expression: Expression;
}

// =============================================================================
// EXPRESSIONS
// =============================================================================

export type Expression =
  | Literal
  | Identifier
  | BinaryExpression
  | UnaryExpression
  | CallExpression
  | MemberExpression
  | IndexExpression
  | ConditionalExpression
  | ArrowFunction
  | ArrayExpression
  | ObjectExpression
  | AwaitExpression
  | ResultExpression
  | ChannelExpression
  | PipeExpression
  | TemplateString;

/**
 * Literal value
 */
export interface Literal extends ASTNode {
  type: 'Literal';
  value: string | number | boolean | null;
  raw?: string;
}

/**
 * Identifier
 */
export interface Identifier extends ASTNode {
  type: 'Identifier';
  name: string;
}

/**
 * Binary expression: a + b, x == y
 */
export interface BinaryExpression extends ASTNode {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

/**
 * Unary expression: !x, -n
 */
export interface UnaryExpression extends ASTNode {
  type: 'UnaryExpression';
  operator: string;
  argument: Expression;
  prefix: boolean;
}

/**
 * Function call
 */
export interface CallExpression extends ASTNode {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

/**
 * Member access: obj.prop
 */
export interface MemberExpression extends ASTNode {
  type: 'MemberExpression';
  object: Expression;
  property: string;
}

/**
 * Index access: arr[i]
 */
export interface IndexExpression extends ASTNode {
  type: 'IndexExpression';
  object: Expression;
  index: Expression;
}

/**
 * Conditional expression: a ? b : c
 */
export interface ConditionalExpression extends ASTNode {
  type: 'ConditionalExpression';
  test: Expression;
  consequent: Expression;
  alternate: Expression;
}

/**
 * Arrow function: (x) -> x * 2
 */
export interface ArrowFunction extends ASTNode {
  type: 'ArrowFunction';
  params: Parameter[];
  body: Expression | Statement[];
  async: boolean;
}

/**
 * Array literal: [1, 2, 3]
 */
export interface ArrayExpression extends ASTNode {
  type: 'ArrayExpression';
  elements: Expression[];
}

/**
 * Object literal: {key: value}
 */
export interface ObjectExpression extends ASTNode {
  type: 'ObjectExpression';
  properties: Array<{
    key: string;
    value: Expression;
  }>;
}

/**
 * Await expression: wait/इंतज़ार
 */
export interface AwaitExpression extends ASTNode {
  type: 'AwaitExpression';
  argument: Expression;
}

/**
 * Result expression: success/सफल, failure/विफल
 */
export interface ResultExpression extends ASTNode {
  type: 'ResultExpression';
  kind: 'success' | 'failure';
  value: Expression;
}

/**
 * Channel expression: send/भेजो, receive/पाओ
 */
export interface ChannelExpression extends ASTNode {
  type: 'ChannelExpression';
  operation: 'send' | 'receive' | 'create';
  channel: Expression;
  value?: Expression;
}

/**
 * Pipe expression: data |> transform |> output
 */
export interface PipeExpression extends ASTNode {
  type: 'PipeExpression';
  left: Expression;
  right: Expression;
}

/**
 * Template string: `Hello ${name}`
 */
export interface TemplateString extends ASTNode {
  type: 'TemplateString';
  parts: Array<string | Expression>;
}

// =============================================================================
// PROGRAM
// =============================================================================

/**
 * Complete program AST
 */
export interface Program extends ASTNode {
  type: 'Program';
  body: Statement[];
  sourceFile?: string;
}

// =============================================================================
// AST HELPERS
// =============================================================================

/**
 * Create an AST node with location
 */
export function createNode<T extends ASTNode>(
  type: T['type'],
  props: Omit<T, 'type' | 'location'>,
  location?: SourceLocation
): T {
  return {
    type,
    ...props,
    location,
  } as T;
}

/**
 * Create a literal node
 */
export function literal(value: string | number | boolean | null, location?: SourceLocation): Literal {
  return createNode('Literal', { value }, location);
}

/**
 * Create an identifier node
 */
export function identifier(name: string, location?: SourceLocation): Identifier {
  return createNode('Identifier', { name }, location);
}

/**
 * Create a binary expression
 */
export function binary(
  operator: string,
  left: Expression,
  right: Expression,
  location?: SourceLocation
): BinaryExpression {
  return createNode('BinaryExpression', { operator, left, right }, location);
}

/**
 * Create a call expression
 */
export function call(
  callee: Expression,
  args: Expression[],
  location?: SourceLocation
): CallExpression {
  return createNode('CallExpression', { callee, arguments: args }, location);
}

/**
 * Check if node is an expression
 */
export function isExpression(node: ASTNode): node is Expression {
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
export function isStatement(node: ASTNode): node is Statement {
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
