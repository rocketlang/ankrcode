/**
 * RocketLang JavaScript Emitter
 *
 * Compiles RocketLang AST to JavaScript code.
 * This is the primary compilation target.
 */
/**
 * JavaScript Runtime helpers
 */
const RUNTIME_HELPERS = `
// RocketLang Runtime Helpers
const __rl = {
  // Result type
  success: (value) => ({ __type: 'result', success: true, value }),
  failure: (error) => ({ __type: 'result', success: false, error }),
  isSuccess: (r) => r && r.__type === 'result' && r.success,
  isFailure: (r) => r && r.__type === 'result' && !r.success,

  // Maybe type
  some: (value) => ({ __type: 'maybe', hasValue: true, value }),
  none: () => ({ __type: 'maybe', hasValue: false }),
  isSome: (m) => m && m.__type === 'maybe' && m.hasValue,

  // Channel operations
  createChannel: (name) => ({
    __type: 'channel',
    name,
    buffer: [],
    waiters: [],
    closed: false,
  }),
  send: async (ch, value) => {
    if (ch.closed) throw new Error('Channel closed');
    if (ch.waiters.length > 0) {
      const waiter = ch.waiters.shift();
      waiter(value);
      return __rl.success(true);
    }
    ch.buffer.push(value);
    return __rl.success(true);
  },
  receive: async (ch, timeout = 30000) => {
    if (ch.buffer.length > 0) {
      return __rl.success(ch.buffer.shift());
    }
    if (ch.closed) return __rl.none();
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(__rl.failure('Timeout'));
      }, timeout);
      ch.waiters.push((value) => {
        clearTimeout(timeoutId);
        resolve(__rl.success(value));
      });
    });
  },

  // Parallel execution
  parallel: async (tasks) => {
    return Promise.all(tasks.map(async (task) => {
      try {
        return __rl.success(await task());
      } catch (e) {
        return __rl.failure(e.message);
      }
    }));
  },

  // Collections helpers
  map: (arr, fn) => arr.map(fn),
  filter: (arr, fn) => arr.filter(fn),
  reduce: (arr, fn, init) => arr.reduce(fn, init),
  find: (arr, fn) => arr.find(fn),
};
`;
/**
 * JavaScript Emitter
 */
export class JavaScriptEmitter {
    config;
    indentLevel = 0;
    output = [];
    constructor(config = {}) {
        this.config = {
            indent: config.indent || '  ',
            includeRuntime: config.includeRuntime ?? true,
            moduleSystem: config.moduleSystem || 'esm',
            sourceMaps: config.sourceMaps ?? false,
        };
    }
    /**
     * Emit a program
     */
    emit(program) {
        this.output = [];
        this.indentLevel = 0;
        // Add runtime helpers if needed
        if (this.config.includeRuntime) {
            this.output.push(RUNTIME_HELPERS);
            this.output.push('');
        }
        // Emit each statement
        for (const stmt of program.body) {
            const code = this.emitStatement(stmt);
            if (code) {
                this.output.push(code);
            }
        }
        return {
            code: this.output.join('\n'),
        };
    }
    /**
     * Emit a statement
     */
    emitStatement(stmt) {
        switch (stmt.type) {
            case 'VariableDeclaration':
                return this.emitVariableDeclaration(stmt);
            case 'FunctionDeclaration':
                return this.emitFunctionDeclaration(stmt);
            case 'IfStatement':
                return this.emitIfStatement(stmt);
            case 'ForStatement':
                return this.emitForStatement(stmt);
            case 'WhileStatement':
                return this.emitWhileStatement(stmt);
            case 'ReturnStatement':
                return this.emitReturnStatement(stmt);
            case 'TryStatement':
                return this.emitTryStatement(stmt);
            case 'ImportStatement':
                return this.emitImportStatement(stmt);
            case 'ExportStatement':
                return this.emitExportStatement(stmt);
            case 'ParallelBlock':
                return this.emitParallelBlock(stmt);
            case 'TogetherBlock':
                return this.emitTogetherBlock(stmt);
            case 'ExpressionStatement':
                return this.emitExpressionStatement(stmt);
            default:
                return `// Unknown statement type: ${stmt.type}`;
        }
    }
    /**
     * Emit variable declaration
     */
    emitVariableDeclaration(stmt) {
        const keyword = stmt.kind;
        const value = this.emitExpression(stmt.value);
        return `${this.indent()}${keyword} ${stmt.name} = ${value};`;
    }
    /**
     * Emit function declaration
     */
    emitFunctionDeclaration(stmt) {
        const async = stmt.async ? 'async ' : '';
        const params = stmt.params.map(p => p.name).join(', ');
        const exportKw = stmt.exported ? 'export ' : '';
        const lines = [];
        lines.push(`${this.indent()}${exportKw}${async}function ${stmt.name}(${params}) {`);
        this.indentLevel++;
        for (const bodyStmt of stmt.body) {
            lines.push(this.emitStatement(bodyStmt));
        }
        this.indentLevel--;
        lines.push(`${this.indent()}}`);
        return lines.join('\n');
    }
    /**
     * Emit if statement
     */
    emitIfStatement(stmt) {
        const lines = [];
        const condition = this.emitExpression(stmt.condition);
        lines.push(`${this.indent()}if (${condition}) {`);
        this.indentLevel++;
        for (const bodyStmt of stmt.consequent) {
            lines.push(this.emitStatement(bodyStmt));
        }
        this.indentLevel--;
        if (stmt.alternate) {
            if (Array.isArray(stmt.alternate)) {
                lines.push(`${this.indent()}} else {`);
                this.indentLevel++;
                for (const bodyStmt of stmt.alternate) {
                    lines.push(this.emitStatement(bodyStmt));
                }
                this.indentLevel--;
            }
            else {
                // else if
                const elseIf = this.emitIfStatement(stmt.alternate);
                lines.push(`${this.indent()}} else ${elseIf.trim()}`);
                return lines.join('\n');
            }
        }
        lines.push(`${this.indent()}}`);
        return lines.join('\n');
    }
    /**
     * Emit for statement
     */
    emitForStatement(stmt) {
        const lines = [];
        const iterable = this.emitExpression(stmt.iterable);
        lines.push(`${this.indent()}for (const ${stmt.variable} of ${iterable}) {`);
        this.indentLevel++;
        for (const bodyStmt of stmt.body) {
            lines.push(this.emitStatement(bodyStmt));
        }
        this.indentLevel--;
        lines.push(`${this.indent()}}`);
        return lines.join('\n');
    }
    /**
     * Emit while statement
     */
    emitWhileStatement(stmt) {
        const lines = [];
        const condition = this.emitExpression(stmt.condition);
        lines.push(`${this.indent()}while (${condition}) {`);
        this.indentLevel++;
        for (const bodyStmt of stmt.body) {
            lines.push(this.emitStatement(bodyStmt));
        }
        this.indentLevel--;
        lines.push(`${this.indent()}}`);
        return lines.join('\n');
    }
    /**
     * Emit return statement
     */
    emitReturnStatement(stmt) {
        if (stmt.value) {
            return `${this.indent()}return ${this.emitExpression(stmt.value)};`;
        }
        return `${this.indent()}return;`;
    }
    /**
     * Emit try statement
     */
    emitTryStatement(stmt) {
        const lines = [];
        lines.push(`${this.indent()}try {`);
        this.indentLevel++;
        for (const bodyStmt of stmt.tryBlock) {
            lines.push(this.emitStatement(bodyStmt));
        }
        this.indentLevel--;
        if (stmt.catchBlock) {
            const param = stmt.catchParam || 'error';
            lines.push(`${this.indent()}} catch (${param}) {`);
            this.indentLevel++;
            for (const bodyStmt of stmt.catchBlock) {
                lines.push(this.emitStatement(bodyStmt));
            }
            this.indentLevel--;
        }
        if (stmt.finallyBlock) {
            lines.push(`${this.indent()}} finally {`);
            this.indentLevel++;
            for (const bodyStmt of stmt.finallyBlock) {
                lines.push(this.emitStatement(bodyStmt));
            }
            this.indentLevel--;
        }
        lines.push(`${this.indent()}}`);
        return lines.join('\n');
    }
    /**
     * Emit import statement
     */
    emitImportStatement(stmt) {
        if (this.config.moduleSystem === 'esm') {
            if (stmt.namespace) {
                return `${this.indent()}import * as ${stmt.namespace} from '${stmt.source}';`;
            }
            if (stmt.items.length === 0) {
                return `${this.indent()}import '${stmt.source}';`;
            }
            const items = stmt.items.map(item => item.alias ? `${item.name} as ${item.alias}` : item.name).join(', ');
            return `${this.indent()}import { ${items} } from '${stmt.source}';`;
        }
        else {
            // CommonJS
            if (stmt.namespace) {
                return `${this.indent()}const ${stmt.namespace} = require('${stmt.source}');`;
            }
            const items = stmt.items.map(item => item.alias ? `${item.name}: ${item.alias}` : item.name).join(', ');
            return `${this.indent()}const { ${items} } = require('${stmt.source}');`;
        }
    }
    /**
     * Emit export statement
     */
    emitExportStatement(stmt) {
        if (stmt.declaration) {
            // Export with declaration
            if (stmt.declaration.type === 'FunctionDeclaration') {
                return this.emitFunctionDeclaration({ ...stmt.declaration, exported: true });
            }
            return `${this.indent()}export ${this.emitVariableDeclaration(stmt.declaration)}`;
        }
        if (stmt.names) {
            if (stmt.from) {
                return `${this.indent()}export { ${stmt.names.join(', ')} } from '${stmt.from}';`;
            }
            return `${this.indent()}export { ${stmt.names.join(', ')} };`;
        }
        return '';
    }
    /**
     * Emit parallel block
     */
    emitParallelBlock(stmt) {
        const lines = [];
        lines.push(`${this.indent()}await __rl.parallel([`);
        this.indentLevel++;
        for (const bodyStmt of stmt.body) {
            lines.push(`${this.indent()}async () => {`);
            this.indentLevel++;
            lines.push(this.emitStatement(bodyStmt));
            this.indentLevel--;
            lines.push(`${this.indent()}},`);
        }
        this.indentLevel--;
        lines.push(`${this.indent()}]);`);
        return lines.join('\n');
    }
    /**
     * Emit together block
     */
    emitTogetherBlock(stmt) {
        const lines = [];
        lines.push(`${this.indent()}const [${stmt.tasks.map(t => t.name).join(', ')}] = await Promise.all([`);
        this.indentLevel++;
        for (const task of stmt.tasks) {
            lines.push(`${this.indent()}(async () => ${this.emitExpression(task.expression)})(),`);
        }
        this.indentLevel--;
        lines.push(`${this.indent()}]);`);
        return lines.join('\n');
    }
    /**
     * Emit expression statement
     */
    emitExpressionStatement(stmt) {
        return `${this.indent()}${this.emitExpression(stmt.expression)};`;
    }
    /**
     * Emit an expression
     */
    emitExpression(expr) {
        switch (expr.type) {
            case 'Literal':
                return this.emitLiteral(expr);
            case 'Identifier':
                return this.emitIdentifier(expr);
            case 'BinaryExpression':
                return this.emitBinaryExpression(expr);
            case 'UnaryExpression':
                return this.emitUnaryExpression(expr);
            case 'CallExpression':
                return this.emitCallExpression(expr);
            case 'MemberExpression':
                return this.emitMemberExpression(expr);
            case 'IndexExpression':
                return this.emitIndexExpression(expr);
            case 'ConditionalExpression':
                return this.emitConditionalExpression(expr);
            case 'ArrowFunction':
                return this.emitArrowFunction(expr);
            case 'ArrayExpression':
                return this.emitArrayExpression(expr);
            case 'ObjectExpression':
                return this.emitObjectExpression(expr);
            case 'AwaitExpression':
                return this.emitAwaitExpression(expr);
            case 'ResultExpression':
                return this.emitResultExpression(expr);
            case 'ChannelExpression':
                return this.emitChannelExpression(expr);
            case 'PipeExpression':
                return this.emitPipeExpression(expr);
            case 'TemplateString':
                return this.emitTemplateString(expr);
            default:
                return `/* Unknown expression type: ${expr.type} */`;
        }
    }
    /**
     * Emit literal
     */
    emitLiteral(expr) {
        if (typeof expr.value === 'string') {
            return JSON.stringify(expr.value);
        }
        if (expr.value === null) {
            return 'null';
        }
        return String(expr.value);
    }
    /**
     * Emit identifier
     */
    emitIdentifier(expr) {
        return expr.name;
    }
    /**
     * Emit binary expression
     */
    emitBinaryExpression(expr) {
        const left = this.emitExpression(expr.left);
        const right = this.emitExpression(expr.right);
        return `(${left} ${expr.operator} ${right})`;
    }
    /**
     * Emit unary expression
     */
    emitUnaryExpression(expr) {
        const arg = this.emitExpression(expr.argument);
        return expr.prefix ? `${expr.operator}${arg}` : `${arg}${expr.operator}`;
    }
    /**
     * Emit call expression
     */
    emitCallExpression(expr) {
        const callee = this.emitExpression(expr.callee);
        const args = expr.arguments.map(a => this.emitExpression(a)).join(', ');
        return `${callee}(${args})`;
    }
    /**
     * Emit member expression
     */
    emitMemberExpression(expr) {
        const obj = this.emitExpression(expr.object);
        return `${obj}.${expr.property}`;
    }
    /**
     * Emit index expression
     */
    emitIndexExpression(expr) {
        const obj = this.emitExpression(expr.object);
        const index = this.emitExpression(expr.index);
        return `${obj}[${index}]`;
    }
    /**
     * Emit conditional expression
     */
    emitConditionalExpression(expr) {
        const test = this.emitExpression(expr.test);
        const consequent = this.emitExpression(expr.consequent);
        const alternate = this.emitExpression(expr.alternate);
        return `(${test} ? ${consequent} : ${alternate})`;
    }
    /**
     * Emit arrow function
     */
    emitArrowFunction(expr) {
        const async = expr.async ? 'async ' : '';
        const params = expr.params.map(p => p.name).join(', ');
        if (Array.isArray(expr.body)) {
            const lines = [];
            lines.push(`${async}(${params}) => {`);
            this.indentLevel++;
            for (const stmt of expr.body) {
                lines.push(this.emitStatement(stmt));
            }
            this.indentLevel--;
            lines.push('}');
            return lines.join('\n');
        }
        return `${async}(${params}) => ${this.emitExpression(expr.body)}`;
    }
    /**
     * Emit array expression
     */
    emitArrayExpression(expr) {
        const elements = expr.elements.map(e => this.emitExpression(e)).join(', ');
        return `[${elements}]`;
    }
    /**
     * Emit object expression
     */
    emitObjectExpression(expr) {
        const props = expr.properties
            .map(p => `${p.key}: ${this.emitExpression(p.value)}`)
            .join(', ');
        return `{ ${props} }`;
    }
    /**
     * Emit await expression
     */
    emitAwaitExpression(expr) {
        return `await ${this.emitExpression(expr.argument)}`;
    }
    /**
     * Emit result expression
     */
    emitResultExpression(expr) {
        const value = this.emitExpression(expr.value);
        if (expr.kind === 'success') {
            return `__rl.success(${value})`;
        }
        return `__rl.failure(${value})`;
    }
    /**
     * Emit channel expression
     */
    emitChannelExpression(expr) {
        const channel = this.emitExpression(expr.channel);
        switch (expr.operation) {
            case 'create':
                return `__rl.createChannel(${channel})`;
            case 'send':
                const value = expr.value ? this.emitExpression(expr.value) : 'null';
                return `await __rl.send(${channel}, ${value})`;
            case 'receive':
                return `await __rl.receive(${channel})`;
        }
    }
    /**
     * Emit pipe expression
     */
    emitPipeExpression(expr) {
        const left = this.emitExpression(expr.left);
        const right = this.emitExpression(expr.right);
        // Transform a |> f to f(a)
        return `((__pipe_val) => ${right})(${left})`.replace(/\(__pipe_val\)/g, '__pipe_val');
    }
    /**
     * Emit template string
     */
    emitTemplateString(expr) {
        const parts = expr.parts.map(part => {
            if (typeof part === 'string') {
                return part;
            }
            return `\${${this.emitExpression(part)}}`;
        }).join('');
        return `\`${parts}\``;
    }
    /**
     * Get current indentation
     */
    indent() {
        return this.config.indent.repeat(this.indentLevel);
    }
}
/**
 * Create a JavaScript emitter
 */
export function createJavaScriptEmitter(config) {
    return new JavaScriptEmitter(config);
}
/**
 * Emit program to JavaScript
 */
export function emitJavaScript(program, config) {
    const emitter = createJavaScriptEmitter(config);
    return emitter.emit(program);
}
export default {
    JavaScriptEmitter,
    createJavaScriptEmitter,
    emitJavaScript,
    RUNTIME_HELPERS,
};
//# sourceMappingURL=emitter-js.js.map