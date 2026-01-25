/**
 * RocketLang Go Emitter
 *
 * Compiles RocketLang AST to Go code.
 * For high-performance compiled applications.
 */
/**
 * Go Emitter
 */
export class GoEmitter {
    config;
    output = [];
    imports = new Set();
    indentLevel = 0;
    constructor(config = {}) {
        this.config = {
            packageName: config.packageName || 'main',
            includeFmt: config.includeFmt ?? true,
            generateMain: config.generateMain ?? true,
        };
    }
    /**
     * Emit a program
     */
    emit(program) {
        this.output = [];
        this.imports = new Set();
        this.indentLevel = 0;
        // Collect imports and generate code
        const bodyCode = [];
        for (const stmt of program.body) {
            const code = this.emitStatement(stmt);
            if (code) {
                bodyCode.push(code);
            }
        }
        // Build final output
        this.output.push(`package ${this.config.packageName}`);
        this.output.push('');
        // Imports
        if (this.imports.size > 0 || this.config.includeFmt) {
            this.imports.add('fmt');
            this.output.push('import (');
            for (const imp of Array.from(this.imports).sort()) {
                this.output.push(`\t"${imp}"`);
            }
            this.output.push(')');
            this.output.push('');
        }
        // Add helper types
        this.emitHelperTypes();
        this.output.push('');
        // Body
        this.output.push(...bodyCode);
        // Main function if needed
        if (this.config.generateMain) {
            this.output.push('');
            this.output.push('func main() {');
            this.output.push('\t// Entry point');
            this.output.push('}');
        }
        return {
            code: this.output.join('\n'),
            imports: Array.from(this.imports),
        };
    }
    /**
     * Emit helper types
     */
    emitHelperTypes() {
        this.output.push('// Result type for error handling');
        this.output.push('type Result[T any] struct {');
        this.output.push('\tSuccess bool');
        this.output.push('\tValue   T');
        this.output.push('\tError   error');
        this.output.push('}');
        this.output.push('');
        this.output.push('func Success[T any](value T) Result[T] {');
        this.output.push('\treturn Result[T]{Success: true, Value: value}');
        this.output.push('}');
        this.output.push('');
        this.output.push('func Failure[T any](err error) Result[T] {');
        this.output.push('\treturn Result[T]{Success: false, Error: err}');
        this.output.push('}');
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
            case 'ExpressionStatement':
                return this.emitExpressionStatement(stmt);
            case 'ParallelBlock':
                return this.emitParallelBlock(stmt);
            case 'TogetherBlock':
                return this.emitTogetherBlock(stmt);
            default:
                return `// Unsupported: ${stmt.type}`;
        }
    }
    /**
     * Emit variable declaration
     */
    emitVariableDeclaration(stmt) {
        const name = stmt.name;
        const value = this.emitExpression(stmt.value);
        const goType = stmt.typeAnnotation ? this.mapType(stmt.typeAnnotation) : '';
        if (goType) {
            return `${this.indent()}var ${name} ${goType} = ${value}`;
        }
        return `${this.indent()}${name} := ${value}`;
    }
    /**
     * Emit function declaration
     */
    emitFunctionDeclaration(stmt) {
        const lines = [];
        const params = stmt.params.map(p => {
            const pType = p.type ? this.mapType(p.type) : 'interface{}';
            return `${p.name} ${pType}`;
        }).join(', ');
        const returnType = stmt.returnType ? this.mapType(stmt.returnType) : '';
        const returnPart = returnType ? ` ${returnType}` : '';
        lines.push(`${this.indent()}func ${stmt.name}(${params})${returnPart} {`);
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
        lines.push(`${this.indent()}if ${condition} {`);
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
                const elseIf = this.emitIfStatement(stmt.alternate);
                lines.push(`${this.indent()}} else ${elseIf.trimStart()}`);
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
        lines.push(`${this.indent()}for _, ${stmt.variable} := range ${iterable} {`);
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
        lines.push(`${this.indent()}for ${condition} {`);
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
            return `${this.indent()}return ${this.emitExpression(stmt.value)}`;
        }
        return `${this.indent()}return`;
    }
    /**
     * Emit expression statement
     */
    emitExpressionStatement(stmt) {
        return `${this.indent()}${this.emitExpression(stmt.expression)}`;
    }
    /**
     * Emit parallel block (goroutines)
     */
    emitParallelBlock(stmt) {
        this.imports.add('sync');
        const lines = [];
        lines.push(`${this.indent()}var wg sync.WaitGroup`);
        for (const bodyStmt of stmt.body) {
            lines.push(`${this.indent()}wg.Add(1)`);
            lines.push(`${this.indent()}go func() {`);
            this.indentLevel++;
            lines.push(`${this.indent()}defer wg.Done()`);
            lines.push(this.emitStatement(bodyStmt));
            this.indentLevel--;
            lines.push(`${this.indent()}}()`);
        }
        lines.push(`${this.indent()}wg.Wait()`);
        return lines.join('\n');
    }
    /**
     * Emit together block
     */
    emitTogetherBlock(stmt) {
        this.imports.add('sync');
        const lines = [];
        lines.push(`${this.indent()}var wg sync.WaitGroup`);
        // Declare result variables
        for (const task of stmt.tasks) {
            lines.push(`${this.indent()}var ${task.name} interface{}`);
        }
        // Launch goroutines
        for (const task of stmt.tasks) {
            lines.push(`${this.indent()}wg.Add(1)`);
            lines.push(`${this.indent()}go func() {`);
            this.indentLevel++;
            lines.push(`${this.indent()}defer wg.Done()`);
            lines.push(`${this.indent()}${task.name} = ${this.emitExpression(task.expression)}`);
            this.indentLevel--;
            lines.push(`${this.indent()}}()`);
        }
        lines.push(`${this.indent()}wg.Wait()`);
        return lines.join('\n');
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
            case 'ArrayExpression':
                return this.emitArrayExpression(expr);
            case 'ObjectExpression':
                return this.emitObjectExpression(expr);
            case 'ResultExpression':
                return this.emitResultExpression(expr);
            case 'ChannelExpression':
                return this.emitChannelExpression(expr);
            default:
                return `/* Unsupported: ${expr.type} */`;
        }
    }
    /**
     * Emit literal
     */
    emitLiteral(expr) {
        if (typeof expr.value === 'string') {
            return `"${expr.value.replace(/"/g, '\\"')}"`;
        }
        if (expr.value === null) {
            return 'nil';
        }
        if (typeof expr.value === 'boolean') {
            return expr.value ? 'true' : 'false';
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
        // Map operators
        const opMap = {
            '===': '==',
            '!==': '!=',
        };
        const op = opMap[expr.operator] || expr.operator;
        return `(${left} ${op} ${right})`;
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
        if (expr.callee.type !== 'Identifier') {
            return `/* Complex call */`;
        }
        const name = expr.callee.name;
        const args = expr.arguments.map(a => this.emitExpression(a)).join(', ');
        // Map common functions
        const funcMap = {
            print: 'fmt.Println',
            len: 'len',
            append: 'append',
            make: 'make',
        };
        if (funcMap[name]) {
            if (name === 'print') {
                this.imports.add('fmt');
            }
            return `${funcMap[name]}(${args})`;
        }
        return `${name}(${args})`;
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
     * Emit array expression
     */
    emitArrayExpression(expr) {
        const elements = expr.elements.map(e => this.emitExpression(e)).join(', ');
        return `[]interface{}{${elements}}`;
    }
    /**
     * Emit object expression
     */
    emitObjectExpression(expr) {
        const props = expr.properties
            .map(p => `"${p.key}": ${this.emitExpression(p.value)}`)
            .join(', ');
        return `map[string]interface{}{${props}}`;
    }
    /**
     * Emit result expression
     */
    emitResultExpression(expr) {
        const value = this.emitExpression(expr.value);
        if (expr.kind === 'success') {
            return `Success(${value})`;
        }
        this.imports.add('errors');
        return `Failure[interface{}](errors.New(${value}))`;
    }
    /**
     * Emit channel expression
     */
    emitChannelExpression(expr) {
        const channel = this.emitExpression(expr.channel);
        switch (expr.operation) {
            case 'create':
                return `make(chan interface{})`;
            case 'send':
                const value = expr.value ? this.emitExpression(expr.value) : 'nil';
                return `${channel} <- ${value}`;
            case 'receive':
                return `<-${channel}`;
        }
    }
    /**
     * Map RocketLang type to Go type
     */
    mapType(type) {
        switch (type.kind) {
            case 'primitive':
                switch (type.name) {
                    case 'number':
                        return 'float64';
                    case 'text':
                        return 'string';
                    case 'bool':
                        return 'bool';
                    case 'nothing':
                        return '';
                    default:
                        return 'interface{}';
                }
            case 'generic':
                switch (type.name) {
                    case 'list':
                        const elemType = type.typeArgs[0] ? this.mapType(type.typeArgs[0]) : 'interface{}';
                        return `[]${elemType}`;
                    case 'map':
                        const keyType = type.typeArgs[0] ? this.mapType(type.typeArgs[0]) : 'string';
                        const valType = type.typeArgs[1] ? this.mapType(type.typeArgs[1]) : 'interface{}';
                        return `map[${keyType}]${valType}`;
                    case 'channel':
                        const chanType = type.typeArgs[0] ? this.mapType(type.typeArgs[0]) : 'interface{}';
                        return `chan ${chanType}`;
                    default:
                        return 'interface{}';
                }
            case 'result':
                const successType = this.mapType(type.successType);
                return `Result[${successType}]`;
            case 'any':
                return 'interface{}';
            default:
                return 'interface{}';
        }
    }
    /**
     * Get current indentation
     */
    indent() {
        return '\t'.repeat(this.indentLevel);
    }
}
/**
 * Create a Go emitter
 */
export function createGoEmitter(config) {
    return new GoEmitter(config);
}
/**
 * Emit program to Go
 */
export function emitGo(program, config) {
    const emitter = createGoEmitter(config);
    return emitter.emit(program);
}
export default {
    GoEmitter,
    createGoEmitter,
    emitGo,
};
//# sourceMappingURL=emitter-go.js.map