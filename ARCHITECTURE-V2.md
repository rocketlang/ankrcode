# AnkrCode V2 Architecture - Bird's Eye View Analysis

## Current State Assessment (v1.0.0)

### What We Have
```
@ankr/ankrcode-core (80KB)
├── AI Adapters (Claude, GPT, Gemini, Groq, DeepSeek)
├── MCP Integration (62 tools from @powerpbox/mcp)
├── Memory (EON, PostMemory)
├── Voice (BHASHINI, Whisper, Google, Azure stubs)
├── Offline (Ollama, LM Studio)
├── 11 Indic Languages
└── Basic CLI

@ankr/rocketlang (27KB)
├── Pattern-based Parser
├── PEG Grammar Parser
├── Normalizer (Devanagari, Tamil, Telugu)
├── Code Generation (TypeScript, Shell)
└── Basic Commands (read, write, search, git, npm)
```

---

## GAP ANALYSIS

### 1. Missing Claude Code-like Features

| Feature | Claude Code | AnkrCode | Priority |
|---------|-------------|----------|----------|
| **File Tools** | | | |
| Read with line numbers | ✓ | Partial | HIGH |
| Edit with string replacement | ✓ | Partial | HIGH |
| Write with overwrite protection | ✓ | ✗ | HIGH |
| **Search Tools** | | | |
| Glob with modification time | ✓ | ✗ | HIGH |
| Grep with context (-A/-B/-C) | ✓ | ✗ | HIGH |
| Ripgrep integration | ✓ | Partial | MEDIUM |
| **Bash Tools** | | | |
| Background processes | ✓ | Partial | MEDIUM |
| Shell persistence | ✓ | ✗ | HIGH |
| Timeout management | ✓ | Partial | MEDIUM |
| **Planning** | | | |
| EnterPlanMode | ✓ | ✗ | HIGH |
| ExitPlanMode | ✓ | ✗ | HIGH |
| Plan file management | ✓ | ✗ | HIGH |
| **Task Management** | | | |
| TodoWrite | ✓ | ✗ | HIGH |
| Task agents | ✓ | Partial | HIGH |
| Background agents | ✓ | ✗ | MEDIUM |
| **Configuration** | | | |
| .claude/settings.json | ✓ | ✗ | HIGH |
| CLAUDE.md project rules | ✓ | ✗ | HIGH |
| Hooks (pre/post command) | ✓ | ✗ | MEDIUM |
| **User Interaction** | | | |
| AskUserQuestion | ✓ | Partial | HIGH |
| Permission prompts | ✓ | ✗ | HIGH |
| Multi-select options | ✓ | ✗ | MEDIUM |

### 2. Missing Adaptability Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Plugin System** | Load custom tools/skills | HIGH |
| **Extension API** | Third-party integrations | HIGH |
| **Custom Agents** | Define domain-specific agents | HIGH |
| **Workflow Engine** | Multi-step automated workflows | MEDIUM |
| **Template System** | Reusable command templates | MEDIUM |
| **Macro Recorder** | Record and replay actions | LOW |

### 3. Missing User-Friendly Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Interactive TUI** | Rich terminal UI (blessed/ink) | HIGH |
| **Autocomplete** | Command/file completion | HIGH |
| **History** | Command history with search | HIGH |
| **Contextual Help** | Hindi/English inline help | HIGH |
| **Progress Indicators** | Spinner, progress bars | MEDIUM |
| **Color Themes** | Dark/light, customizable | LOW |
| **Keyboard Shortcuts** | Vim/Emacs modes | LOW |

### 4. Missing RocketLang Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Variables** | `let x = read "file"` | HIGH |
| **Functions** | `fn validate(x) { ... }` | HIGH |
| **Control Flow** | if/else, loops (full) | HIGH |
| **Async/Await** | `await fetch(url)` | HIGH |
| **Error Handling** | try/catch/finally | HIGH |
| **Imports** | `use "module.rl"` | MEDIUM |
| **Types** | Optional type hints | MEDIUM |
| **REPL** | Interactive shell | HIGH |

---

## PROPOSED V2 ARCHITECTURE

### Layer 1: Core Engine

```
@ankr/ankrcode-engine
├── Runtime
│   ├── ExecutionContext (sandboxed)
│   ├── PermissionManager
│   ├── SessionManager
│   └── StateStore (persistent)
├── Tools
│   ├── FileSystem (Read, Write, Edit, Glob, Grep)
│   ├── Process (Bash, Background, Kill)
│   ├── Network (Fetch, WebSocket)
│   ├── Planning (EnterPlan, ExitPlan, TodoWrite)
│   └── Agents (Task, Explore, Plan)
├── Memory
│   ├── ShortTerm (conversation)
│   ├── LongTerm (EON/PostMemory)
│   └── Knowledge (facts, procedures)
└── Events
    ├── Hooks (pre/post tool)
    ├── Notifications
    └── Progress
```

### Layer 2: Language Runtime

```
@ankr/rocketlang-runtime
├── Parser (PEG + Pattern)
├── Compiler
│   ├── AST → IR (intermediate)
│   ├── IR → JS (execution)
│   └── IR → Shell (generation)
├── Standard Library
│   ├── io (read, write, print)
│   ├── fs (glob, grep, edit)
│   ├── net (fetch, ws)
│   ├── git (commit, push, pr)
│   ├── npm (install, run)
│   └── mcp (all 262+ tools)
├── Type System (optional)
└── REPL
```

### Layer 3: Interfaces

```
@ankr/ankrcode-cli        # Terminal interface
@ankr/ankrcode-tui        # Rich terminal UI (ink/blessed)
@ankr/ankrcode-api        # HTTP/WebSocket API
@ankr/ankrcode-vscode     # VS Code extension
@ankr/ankrcode-swayam     # Swayam voice integration
```

### Layer 4: Plugins

```
@ankr/ankrcode-plugin-git
@ankr/ankrcode-plugin-docker
@ankr/ankrcode-plugin-aws
@ankr/ankrcode-plugin-gcp
@ankr/ankrcode-plugin-compliance
```

---

## ROCKETLANG V2 DESIGN

### Vision: Beyond DSL - A Practical Programming Language for Automation

RocketLang V2 should be a **full programming language** optimized for:
1. Automation scripts
2. CLI tools
3. Workflow definitions
4. Cross-language code generation

### Syntax Design (Hybrid: Python + TypeScript + Hindi)

```rocketlang
# === Variables & Types (optional typing) ===
let name = "AnkrCode"
let count: number = 42
let files: string[] = glob "*.ts"

# === Functions ===
fn greet(name: string) -> string {
  return "Namaste, " + name
}

# === Async/Await ===
async fn fetchData(url: string) {
  let response = await fetch url
  return response.json()
}

# === Control Flow ===
if count > 10 {
  print "bahut hai!"
} else {
  print "thoda aur chahiye"
}

for file in files {
  let content = read file
  if content.contains("TODO") {
    print file + " mein TODO mila"
  }
}

# === Pattern Matching (Hindi keywords optional) ===
match status {
  "success" | "safal" => print "Done!"
  "error" | "galti" => print "Problem!"
  _ => print "Unknown"
}

# === Error Handling ===
try {
  let data = read "config.json"
  let config = JSON.parse(data)
} catch (e) {
  print "Error: " + e.message
} finally {
  cleanup()
}

# === Pipelines (Unix-like) ===
read "log.txt" | grep "error" | sort | uniq | write "errors.txt"

# === Hindi Syntax Mode ===
yadi count > 10 {
  likho "bahut hai!"
} nahi_toh {
  likho "thoda aur chahiye"
}

har file mein files {
  padho file | dhundho "TODO"
}

# === Modules ===
use "./utils.rl"
use "@ankr/mcp/gst" as gst

let result = gst.verify(gstin: "12345")

# === MCP Tool Call (direct) ===
@gst_verify { gstin: "12345" }
@shipment_track { awb: "AWB123" }

# === Shell Escape ===
$ docker build -t myapp .
$ kubectl apply -f deployment.yaml

# === Code Generation ===
generate typescript {
  interface User {
    name: string
    email: string
  }
}

generate api {
  endpoint "/users"
  method "GET"
  response User[]
}

# === Workflow Definition ===
workflow deploy {
  step "build" {
    npm run build
  }
  step "test" {
    npm test
  }
  step "deploy" {
    $ docker push myapp
    $ kubectl rollout restart
  }
}

# === Agent Invocation ===
agent architect {
  task: "Design user authentication"
  mode: "advisory"
}

# === Inline Hindi Comments ===
# यह function user को validate करता है
fn validateUser(user) {
  # email check करो
  if not user.email.includes("@") {
    return false
  }
  return true
}
```

### Core Language Features

| Feature | Syntax | Example |
|---------|--------|---------|
| Variables | `let x = value` | `let files = glob "*.ts"` |
| Constants | `const X = value` | `const API_URL = "..."` |
| Functions | `fn name(args) { }` | `fn greet(name) { print name }` |
| Async | `async fn`, `await` | `await fetch url` |
| If/Else | `if cond { } else { }` | `if x > 10 { ... }` |
| For Loop | `for x in items { }` | `for f in files { ... }` |
| While Loop | `while cond { }` | `while running { ... }` |
| Match | `match x { pat => }` | `match status { "ok" => ... }` |
| Try/Catch | `try { } catch (e) { }` | `try { ... } catch { ... }` |
| Pipe | `cmd1 \| cmd2` | `read f \| grep "x"` |
| Modules | `use "path"` | `use "@ankr/mcp/gst"` |
| Types | `: type` (optional) | `let x: number = 42` |

### Hindi Keyword Aliases

| English | Hindi | Devanagari |
|---------|-------|------------|
| let | let / maan | मान |
| const | const / sthir | स्थिर |
| fn | fn / karya | कार्य |
| if | if / agar / yadi | अगर / यदि |
| else | else / nahi_toh | नहीं तो |
| for | for / har | हर |
| in | in / mein | में |
| while | while / jab_tak | जब तक |
| return | return / lautao | लौटाओ |
| true | true / sach / haan | सच / हाँ |
| false | false / jhooth / nahi | झूठ / नहीं |
| try | try / koshish | कोशिश |
| catch | catch / pakdo | पकड़ो |
| print | print / likho | लिखो |
| read | read / padho | पढ़ो |
| write | write / likho | लिखो |

---

## IMPLEMENTATION ROADMAP

### Phase 1: Core Enhancement (2 weeks)
- [ ] Add Claude Code-like tools (Read, Write, Edit, Glob, Grep, Bash)
- [ ] Implement TodoWrite, EnterPlanMode, ExitPlanMode
- [ ] Add .ankrcode/settings.json configuration
- [ ] Add ANKRCODE.md project rules support
- [ ] Implement permission system

### Phase 2: RocketLang V2 (3 weeks)
- [ ] Full PEG grammar with all features
- [ ] Compiler to JavaScript
- [ ] Standard library
- [ ] REPL mode
- [ ] Hindi keyword aliases

### Phase 3: User Experience (2 weeks)
- [ ] Rich TUI with ink
- [ ] Autocomplete
- [ ] Command history
- [ ] Contextual Hindi help

### Phase 4: Integration (2 weeks)
- [ ] VS Code extension
- [ ] Swayam integration
- [ ] Plugin system
- [ ] Workflow engine

---

## SWAYAM INTEGRATION

### Current Integration Points
1. Voice commands → RocketLang parser
2. MCP tools shared with Bani
3. EON memory shared

### Proposed Enhancements
1. **Bidirectional**: Swayam can invoke AnkrCode, AnkrCode can invoke Swayam
2. **Voice-first workflows**: Define workflows that work with voice
3. **Context sharing**: Share conversation context between CLI and voice
4. **Handoff**: Start on CLI, continue on voice (and vice versa)

---

## SUMMARY: TOP 10 PRIORITIES

1. **TodoWrite tool** - Essential for task tracking
2. **Plan mode** (Enter/Exit) - Essential for complex tasks
3. **Permission system** - Security for dangerous operations
4. **.ankrcode/ config** - Project-level customization
5. **RocketLang REPL** - Interactive experimentation
6. **Variables & functions** - Full language capability
7. **Rich TUI** - Better user experience
8. **Plugin system** - Extensibility
9. **Swayam handoff** - Voice-CLI integration
10. **VS Code extension** - IDE integration
