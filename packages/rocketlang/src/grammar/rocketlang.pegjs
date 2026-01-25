/**
 * RocketLang PEG Grammar
 * A DSL for coding commands in Indic languages
 *
 * Supports: Hindi, Tamil, Telugu, English, and code-switching
 * Author: AnkrCode Team
 *
 * Usage: peggy -o src/parser/grammar.js src/grammar/rocketlang.pegjs
 */

{
  // Helper functions for the parser
  function makeCommand(tool, params, raw, location) {
    return {
      type: 'command',
      tool: tool,
      parameters: params,
      raw: raw,
      line: location().start.line,
      column: location().start.column
    };
  }

  function makeBlock(commands) {
    return {
      type: 'block',
      commands: commands
    };
  }

  function makeConditional(condition, thenBlock, elseBlock) {
    return {
      type: 'conditional',
      condition: condition,
      then: thenBlock,
      else: elseBlock || null
    };
  }

  function makeLoop(variable, iterable, body) {
    return {
      type: 'loop',
      variable: variable,
      iterable: iterable,
      body: body
    };
  }

  function makeAssignment(name, value, typeAnnotation) {
    return {
      type: 'assignment',
      name: name,
      value: value,
      typeAnnotation: typeAnnotation || null
    };
  }

  function makePipe(left, right) {
    return {
      type: 'pipe',
      left: left,
      right: right
    };
  }

  // V2: Function declaration
  function makeFunctionDecl(name, params, returnType, body, isAsync) {
    return {
      type: 'function_decl',
      name: name,
      params: params,
      returnType: returnType || null,
      body: body,
      async: isAsync || false
    };
  }

  // V2: Try expression (error handling)
  function makeTryExpr(expr, handlers) {
    return {
      type: 'try_expr',
      expression: expr,
      handlers: handlers
    };
  }

  // V2: Result value
  function makeResultValue(isSuccess, value) {
    return {
      type: 'result_value',
      success: isSuccess,
      value: value
    };
  }

  // V2: Parallel block
  function makeParallelBlock(body, timeout) {
    return {
      type: 'parallel_block',
      body: body,
      timeout: timeout || null
    };
  }

  // V2: Await expression
  function makeAwaitExpr(expr) {
    return {
      type: 'await_expr',
      expression: expr
    };
  }

  // V2: Together block (parallel with auto-wait)
  function makeTogetherBlock(assignments) {
    return {
      type: 'together_block',
      assignments: assignments
    };
  }

  // V2: Channel operations
  function makeChannelSend(channel, value) {
    return {
      type: 'channel_send',
      channel: channel,
      value: value
    };
  }

  function makeChannelReceive(channel) {
    return {
      type: 'channel_receive',
      channel: channel
    };
  }

  // V2: Module operations
  function makeImport(items, path, alias) {
    return {
      type: 'import',
      items: items,
      path: path,
      alias: alias || null
    };
  }

  function makeExport(declaration) {
    return {
      type: 'export',
      declaration: declaration
    };
  }

  // V2: Type alias
  function makeTypeAlias(name, targetType) {
    return {
      type: 'type_alias',
      name: name,
      targetType: targetType
    };
  }

  // Normalize common Indic verb forms to English
  const verbMap = {
    // Hindi verbs
    'padho': 'read', 'padh': 'read', 'dekho': 'read',
    'likho': 'write', 'likh': 'write', 'banao': 'create',
    'bana': 'create', 'kholo': 'open', 'khol': 'open',
    'dhoondo': 'search', 'dhundho': 'search', 'khojo': 'search',
    'chalao': 'run', 'chala': 'run', 'karo': 'do',
    'mitao': 'delete', 'hatao': 'delete', 'badlo': 'edit',
    'install': 'install', 'test': 'test', 'build': 'build',
    'commit': 'commit', 'push': 'push', 'pull': 'pull',
    // Tamil verbs (transliterated)
    'padi': 'read', 'ezhudhu': 'write', 'thedi': 'search',
    // Telugu verbs (transliterated)
    'chadhuvu': 'read', 'rayi': 'write', 'vetuku': 'search',
    // English verbs
    'read': 'read', 'write': 'write', 'create': 'create',
    'open': 'open', 'search': 'search', 'find': 'find',
    'run': 'run', 'execute': 'run', 'delete': 'delete',
    'edit': 'edit', 'modify': 'edit', 'change': 'edit',
    'grep': 'grep', 'glob': 'glob'
  };

  function normalizeVerb(verb) {
    const lower = verb.toLowerCase();
    return verbMap[lower] || lower;
  }
}

// ============================================================================
// MAIN GRAMMAR
// ============================================================================

Program
  = _ statements:StatementList _ { return makeBlock(statements); }

StatementList
  = first:Statement rest:(_ Statement)* {
      return [first, ...rest.map(r => r[1])].filter(s => s !== null);
    }
  / _ { return []; }

Statement
  = Comment { return null; }
  / ImportStatement
  / ExportStatement
  / TypeAliasStatement
  / FunctionDeclaration
  / ParallelBlock
  / TogetherBlock
  / TryExpression
  / Conditional
  / Loop
  / TypedAssignment
  / Assignment
  / PipeExpression
  / ChannelOperation
  / AwaitExpression
  / ResultExpression
  / Command

// ============================================================================
// COMMANDS
// ============================================================================

Command
  = FileCommand
  / SearchCommand
  / GitCommand
  / PackageCommand
  / BashCommand
  / CodeGenCommand
  / DirectToolCall

// File Operations
FileCommand
  = verb:WriteVerb _ content:QuotedString _ ("to"i / "in"i) _ path:FilePath {
      return makeCommand('Write', { file_path: path, content: content }, text(), location);
    }
  / verb:EditVerb _ path:FilePath _ old:QuotedString _ "->" _ new_:QuotedString {
      return makeCommand('Edit', { file_path: path, old_string: old, new_string: new_ }, text(), location);
    }
  / verb:FileVerb _ path:FilePath {
      const tool = verb === 'read' || verb === 'open' ? 'Read' :
                   verb === 'write' ? 'Write' :
                   verb === 'delete' ? 'Bash' : 'Edit';
      const params = verb === 'delete'
        ? { command: 'rm ' + path }
        : { file_path: path };
      return makeCommand(tool, params, text(), location);
    }

FileVerb
  = verb:Verb &{ return ['read', 'open', 'write', 'delete', 'edit'].includes(normalizeVerb(verb)); } {
      return normalizeVerb(verb);
    }

WriteVerb
  = verb:Verb &{ return ['write', 'create'].includes(normalizeVerb(verb)); } {
      return normalizeVerb(verb);
    }

EditVerb
  = verb:Verb &{ return ['edit', 'change', 'modify', 'replace'].includes(normalizeVerb(verb)); } {
      return normalizeVerb(verb);
    }

// Search Operations
SearchCommand
  = verb:SearchVerb _ pattern:QuotedString _ "in"i _ path:FilePath {
      const tool = normalizeVerb(verb) === 'glob' ? 'Glob' : 'Grep';
      return makeCommand(tool, { pattern: pattern, path: path }, text(), location);
    }
  / verb:SearchVerb _ pattern:QuotedString {
      const tool = normalizeVerb(verb) === 'glob' ? 'Glob' : 'Grep';
      return makeCommand(tool, { pattern: pattern }, text(), location);
    }

SearchVerb
  = verb:Verb &{ return ['search', 'find', 'grep', 'glob'].includes(normalizeVerb(verb)); } {
      return normalizeVerb(verb);
    }

// Git Operations
GitCommand
  = "commit"i _ message:QuotedString {
      return makeCommand('Bash', { command: 'git commit -m ' + JSON.stringify(message) }, text(), location);
    }
  / "push"i _ remote:Identifier? _ branch:Identifier? {
      const cmd = 'git push' + (remote ? ' ' + remote : '') + (branch ? ' ' + branch : '');
      return makeCommand('Bash', { command: cmd.trim() }, text(), location);
    }
  / "pull"i _ remote:Identifier? _ branch:Identifier? {
      const cmd = 'git pull' + (remote ? ' ' + remote : '') + (branch ? ' ' + branch : '');
      return makeCommand('Bash', { command: cmd.trim() }, text(), location);
    }
  / "git"i _ args:RestOfLine {
      return makeCommand('Bash', { command: 'git ' + args }, text(), location);
    }

// Package Management
PackageCommand
  = "npm"i _ cmd:("install"i / "i"i) _ pkg:Identifier? {
      const command = 'npm install' + (pkg ? ' ' + pkg : '');
      return makeCommand('Bash', { command: command }, text(), location);
    }
  / "npm"i _ cmd:("test"i / "t"i) {
      return makeCommand('Bash', { command: 'npm test' }, text(), location);
    }
  / "npm"i _ "run"i _ script:Identifier {
      return makeCommand('Bash', { command: 'npm run ' + script }, text(), location);
    }
  / verb:InstallVerb _ pkg:Identifier {
      return makeCommand('Bash', { command: 'npm install ' + pkg }, text(), location);
    }

InstallVerb
  = "install"i { return 'install'; }

// Direct Bash Commands
BashCommand
  = "$" _ cmd:RestOfLine {
      return makeCommand('Bash', { command: cmd }, text(), location);
    }
  / "run"i _ cmd:RestOfLine {
      return makeCommand('Bash', { command: cmd }, text(), location);
    }
  / verb:RunVerb _ cmd:QuotedString {
      return makeCommand('Bash', { command: cmd }, text(), location);
    }

RunVerb
  = verb:Verb &{ return ['run', 'execute', 'chalao'].includes(normalizeVerb(verb)); } {
      return normalizeVerb(verb);
    }

// Code Generation
CodeGenCommand
  = "create"i _ type:CodeType _ "for"i _ name:Identifier {
      return makeCommand('Task', {
        prompt: 'Create a ' + type + ' for ' + name,
        subagent_type: 'general-purpose'
      }, text(), location);
    }
  / verb:CreateVerb _ type:CodeType _ name:Identifier {
      return makeCommand('Task', {
        prompt: 'Create a ' + type + ' named ' + name,
        subagent_type: 'general-purpose'
      }, text(), location);
    }

CreateVerb
  = verb:Verb &{ return ['create', 'banao', 'bana'].includes(normalizeVerb(verb)); } {
      return normalizeVerb(verb);
    }

CodeType
  = "api"i { return 'API endpoint'; }
  / "function"i { return 'function'; }
  / "component"i { return 'React component'; }
  / "class"i { return 'class'; }
  / "test"i { return 'test'; }
  / "service"i { return 'service'; }

// Direct Tool Call (for MCP tools)
DirectToolCall
  = "@" tool:Identifier _ params:ObjectLiteral {
      return makeCommand(tool, params, text(), location);
    }

// ============================================================================
// CONTROL FLOW
// ============================================================================

Conditional
  = "if"i _ condition:Expression _ "then"i _ thenBlock:Statement elseClause:(_ "else"i _ Statement)? {
      return makeConditional(condition, thenBlock, elseClause ? elseClause[3] : null);
    }
  / "agar"i _ condition:Expression _ "toh"i _ thenBlock:Statement elseClause:(_ "nahi"i _ "toh"i _ Statement)? {
      return makeConditional(condition, thenBlock, elseClause ? elseClause[4] : null);
    }

Loop
  = "for"i _ variable:Identifier _ "in"i _ iterable:Expression _ "do"i _ body:Statement {
      return makeLoop(variable, iterable, body);
    }
  / "har"i _ variable:Identifier _ "mein"i _ iterable:Expression _ "karo"i _ body:Statement {
      return makeLoop(variable, iterable, body);
    }

// ============================================================================
// EXPRESSIONS
// ============================================================================

Expression
  = Comparison

Comparison
  = left:Term _ op:ComparisonOp _ right:Term {
      return { type: 'comparison', operator: op, left: left, right: right };
    }
  / Term

ComparisonOp
  = "==" { return '=='; }
  / "!=" { return '!='; }
  / ">=" { return '>='; }
  / "<=" { return '<='; }
  / ">" { return '>'; }
  / "<" { return '<'; }
  / "exists"i { return 'exists'; }

Term
  = VariableRef
  / Literal

VariableRef
  = "$" name:Identifier {
      return { type: 'variable', name: name };
    }

Literal
  = QuotedString
  / Number
  / Boolean
  / FilePath

// ============================================================================
// PIPE EXPRESSIONS
// ============================================================================

PipeExpression
  = left:Command _ "|" _ right:(PipeExpression / Command) {
      return makePipe(left, right);
    }

// ============================================================================
// ASSIGNMENT
// ============================================================================

Assignment
  = name:Identifier _ "=" _ value:Expression {
      return makeAssignment(name, value, null);
    }
  / "let"i _ name:Identifier _ "=" _ value:Expression {
      return makeAssignment(name, value, null);
    }
  / "maan"i _ name:Identifier _ "=" _ value:Expression {
      return makeAssignment(name, value, null);
    }

// V2: Assignment with type annotation
TypedAssignment
  = "let"i _ name:Identifier _ ":" _ typeAnn:TypeAnnotation _ "=" _ value:Expression {
      return makeAssignment(name, value, typeAnn);
    }
  / "maan"i _ name:Identifier _ ":" _ typeAnn:TypeAnnotation _ "=" _ value:Expression {
      return makeAssignment(name, value, typeAnn);
    }
  / "const"i _ name:Identifier _ ":" _ typeAnn:TypeAnnotation _ "=" _ value:Expression {
      return makeAssignment(name, value, typeAnn);
    }

// ============================================================================
// V2: TYPE SYSTEM
// ============================================================================

TypeAnnotation
  = type:Type { return type; }

Type
  = GenericType
  / PrimitiveType
  / FunctionType
  / CustomType

PrimitiveType
  = ("number"i / "\u0938\u0902\u0916\u094D\u092F\u093E" / "sankhya"i) { return { kind: 'primitive', name: 'number' }; }
  / ("text"i / "string"i / "\u092A\u093E\u0920" / "paath"i) { return { kind: 'primitive', name: 'text' }; }
  / ("bool"i / "boolean"i / "\u0939\u093E\u0901-\u0928\u0939\u0940\u0902") { return { kind: 'primitive', name: 'bool' }; }
  / ("nothing"i / "void"i / "\u0915\u0941\u091B \u0928\u0939\u0940\u0902") { return { kind: 'primitive', name: 'nothing' }; }
  / ("any"i / "\u0915\u094B\u0908 \u092D\u0940") { return { kind: 'any' }; }

GenericType
  = base:GenericBaseName _ "<" _ args:TypeArgList _ ">" {
      return { kind: 'generic', name: base, typeArgs: args };
    }

GenericBaseName
  = ("list"i / "array"i / "\u0938\u0942\u091A\u0940" / "soochi"i) { return 'list'; }
  / ("map"i / "dict"i / "\u0928\u0915\u094D\u0936\u093E" / "naksha"i) { return 'map'; }
  / ("channel"i / "\u0928\u093E\u0932\u0940" / "naali"i) { return 'channel'; }
  / ("result"i / "\u092A\u0930\u093F\u0923\u093E\u092E" / "parinam"i) { return 'result'; }
  / ("maybe"i / "optional"i / "\u0936\u093E\u092F\u0926" / "shayad"i) { return 'maybe'; }

TypeArgList
  = first:Type rest:(_ "," _ Type)* {
      return [first, ...rest.map(r => r[3])];
    }

FunctionType
  = "(" _ params:ParamTypeList? _ ")" _ "->" _ ret:Type {
      return { kind: 'function', params: params || [], returnType: ret };
    }

ParamTypeList
  = first:ParamType rest:(_ "," _ ParamType)* {
      return [first, ...rest.map(r => r[3])];
    }

ParamType
  = name:Identifier _ ":" _ type:Type {
      return { name: name, type: type };
    }
  / name:Identifier {
      return { name: name, type: { kind: 'any' } };
    }

CustomType
  = name:Identifier { return { kind: 'custom', name: name }; }

// ============================================================================
// V2: FUNCTION DECLARATIONS
// ============================================================================

FunctionDeclaration
  = async_:("async"i _)? ("fn"i / "function"i / "karya"i) _ name:Identifier _ "(" _ params:ParamTypeList? _ ")" _ returnType:("->" _ Type)? _ ":" _ body:FunctionBody {
      return makeFunctionDecl(name, params || [], returnType ? returnType[2] : null, body, !!async_);
    }

FunctionBody
  = "{" _ statements:StatementList _ "}" { return makeBlock(statements); }
  / Statement

// ============================================================================
// V2: ERROR HANDLING (Result Pattern)
// ============================================================================

TryExpression
  = ("try"i / "\u0915\u094B\u0936\u093F\u0936" / "koshish"i) _ expr:Expression _ handlers:Handler* {
      return makeTryExpr(expr, handlers);
    }

Handler
  = _ ("if"i / "agar"i) _ ("success"i / "\u0938\u092B\u0932" / "safal"i) _ ":" _ block:Statement {
      return { type: 'success', body: block };
    }
  / _ ("if"i / "agar"i) _ ("failure"i / "\u0935\u093F\u092B\u0932" / "vifal"i) _ errorType:("with"i _ Type)? _ ":" _ block:Statement {
      return { type: 'failure', errorType: errorType ? errorType[2] : null, body: block };
    }
  / _ ("otherwise"i / "\u0905\u0928\u094D\u092F\u0925\u093E" / "anyatha"i) _ ":" _ block:Statement {
      return { type: 'otherwise', body: block };
    }

ResultExpression
  = ("success"i / "\u0938\u092B\u0932" / "safal"i) _ value:Expression {
      return makeResultValue(true, value);
    }
  / ("failure"i / "\u0935\u093F\u092B\u0932" / "vifal"i) _ value:Expression {
      return makeResultValue(false, value);
    }

// ============================================================================
// V2: CONCURRENCY
// ============================================================================

ParallelBlock
  = ("parallel"i / "\u0938\u092E\u093E\u0928\u093E\u0902\u0924\u0930" / "samantar"i) _ timeout:TimeoutClause? _ ":" _ body:Statement {
      return makeParallelBlock(body, timeout);
    }

TimeoutClause
  = "with"i _ "timeout"i _ duration:Number _ unit:TimeUnit {
      return { value: duration, unit: unit };
    }

TimeUnit
  = "seconds"i { return 'seconds'; }
  / "minutes"i { return 'minutes'; }
  / "ms"i { return 'ms'; }

AwaitExpression
  = ("wait"i / "\u0907\u0902\u0924\u091C\u093C\u093E\u0930" / "intezaar"i / "ruko"i) _ expr:Expression {
      return makeAwaitExpr(expr);
    }

TogetherBlock
  = ("together"i / "\u0938\u093E\u0925 \u092E\u0947\u0902" / "saath"i _ "mein"i) _ ":" _ assignments:TogetherAssignments {
      return makeTogetherBlock(assignments);
    }

TogetherAssignments
  = first:TogetherAssignment rest:(_ TogetherAssignment)* {
      return [first, ...rest.map(r => r[1])];
    }

TogetherAssignment
  = expr:Expression _ "->" _ name:Identifier {
      return { expression: expr, target: name };
    }

ChannelOperation
  = ("send"i / "\u092D\u0947\u091C\u094B" / "bhejo"i) _ value:Expression _ ("to"i / "mein"i) _ channel:Identifier {
      return makeChannelSend(channel, value);
    }
  / ("receive"i / "\u092A\u093E\u0913" / "pao"i) _ ("from"i / "se"i) _ channel:Identifier {
      return makeChannelReceive(channel);
    }

// ============================================================================
// V2: MODULE SYSTEM
// ============================================================================

ImportStatement
  = ("use"i / "\u0909\u092A\u092F\u094B\u0917" / "upyog"i) _ items:ImportItems? _ ("from"i / "\u0938\u0947" / "se"i)? _ path:QuotedString alias:(_ ("as"i / "\u091C\u0948\u0938\u0947" / "jaise"i) _ Identifier)? {
      return makeImport(items, path, alias ? alias[3] : null);
    }

ImportItems
  = first:Identifier rest:(_ "," _ Identifier)* {
      return [first, ...rest.map(r => r[3])];
    }

ExportStatement
  = ("export"i / "\u0928\u093F\u0930\u094D\u092F\u093E\u0924" / "niryat"i) _ decl:(FunctionDeclaration / TypedAssignment / Assignment) {
      return makeExport(decl);
    }

TypeAliasStatement
  = "type"i _ name:Identifier _ "=" _ targetType:Type {
      return makeTypeAlias(name, targetType);
    }

// ============================================================================
// TOKENS
// ============================================================================

Verb
  = chars:IndicOrRomanWord { return chars; }

IndicOrRomanWord
  = chars:[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7Fa-zA-Z]+ {
      return chars.join('');
    }

Identifier
  = first:[a-zA-Z_\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F] rest:[a-zA-Z0-9_\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F-]* {
      return first + rest.join('');
    }

FilePath
  = QuotedString
  / chars:[a-zA-Z0-9_./-]+ { return chars.join(''); }

QuotedString
  = '"' chars:[^"]* '"' { return chars.join(''); }
  / "'" chars:[^']* "'" { return chars.join(''); }

Number
  = digits:[0-9]+ { return parseInt(digits.join(''), 10); }

Boolean
  = "true"i { return true; }
  / "false"i { return false; }
  / "haan"i { return true; }  // Hindi: yes
  / "nahi"i { return false; } // Hindi: no

ObjectLiteral
  = "{" _ pairs:KeyValuePairs? _ "}" {
      const obj = {};
      if (pairs) pairs.forEach(([k, v]) => obj[k] = v);
      return obj;
    }

KeyValuePairs
  = first:KeyValue rest:(_ "," _ KeyValue)* {
      return [first, ...rest.map(r => r[3])];
    }

KeyValue
  = key:Identifier _ ":" _ value:(QuotedString / Number / Boolean / Identifier) {
      return [key, value];
    }

RestOfLine
  = chars:[^\n\r]+ { return chars.join('').trim(); }

Comment
  = "#" [^\n\r]* { return null; }
  / "//" [^\n\r]* { return null; }

// Whitespace
_ "whitespace"
  = [ \t\n\r]*

__ "required whitespace"
  = [ \t\n\r]+
