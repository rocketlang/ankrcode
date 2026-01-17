# AnkrCode Deep Dive

> **Version:** 2.38.3 | **Binary:** `ankrcode` | **Package:** `@ankr/ankrcode-core`

---

## Project Structure

```
/root/ankrcode-project/
├── packages/
│   ├── ankrcode-core/          # Main CLI package (v2.38.3)
│   │   ├── src/
│   │   │   ├── cli/            # CLI entry point (890KB!)
│   │   │   ├── tools/core/     # 14 core tools
│   │   │   ├── ai/             # AI router + offline adapter
│   │   │   ├── mcp/            # MCP tools integration
│   │   │   ├── memory/         # EON adapter
│   │   │   ├── voice/          # Voice input adapter
│   │   │   ├── swayam/         # Swayam personality layer
│   │   │   ├── conversation/   # State management
│   │   │   ├── config/         # Configuration + permissions
│   │   │   ├── plugins/        # Git, Docker plugins
│   │   │   └── i18n/           # 11 languages
│   │   └── ANKRCODE.md         # Self-awareness file
│   │
│   └── rocketlang/             # DSL package
│       ├── src/
│       │   ├── grammar/        # PEG grammar (21KB)
│       │   ├── parser/         # Pattern + PEG parsers
│       │   ├── normalizer/     # Indic → English
│       │   ├── compiler/       # AST + emitters
│       │   ├── runtime/        # Execution engine
│       │   └── repl/           # Interactive mode
│       └── README.md
```

---

## ankr5 vs AnkrCode - The Definitive Answer

| Aspect | **ankr5** | **AnkrCode** |
|--------|-----------|--------------|
| **Purpose** | Service gateway CLI | AI coding assistant |
| **Binary** | `ankr5` | `ankrcode` |
| **Version** | 2.1.0 | 2.38.3 |
| **Location** | `.ankr/cli/` | `ankrcode-project/` |
| **Package** | `@ankr/cli-local` | `@ankr/ankrcode-core` |
| **Commands** | 11 service commands | 68 AI commands |
| **Input** | CLI only | CLI + Voice + RocketLang |
| **Languages** | English | 11 Indic languages |
| **Equivalent** | `kubectl` | Claude Code |

### ankr5 Commands (11)
```bash
ankr5 gateway status    # Service health
ankr5 ports get X       # Port lookup
ankr5 mcp list          # Tool catalog
ankr5 eon search X      # Memory search
ankr5 ralph commit      # Dev automation
```

### AnkrCode Commands (68)
```bash
ankrcode chat           # Interactive AI
ankrcode ask "..."      # Quick question
ankrcode review src/    # Code review
ankrcode commit         # AI commit
ankrcode doctor         # Health check
```

---

## Core Tools (14)

Located in `src/tools/core/`:

| Tool | File | Claude Code Equivalent |
|------|------|------------------------|
| **Read** | file.ts | Read |
| **Write** | file.ts | Write |
| **Edit** | file.ts | Edit |
| **Glob** | search.ts | Glob |
| **Grep** | search.ts | Grep |
| **Bash** | bash.ts | Bash |
| **Task** | task.ts | Task |
| **WebFetch** | web.ts | WebFetch |
| **WebSearch** | web.ts | WebSearch |
| **TodoWrite** | interactive.ts | TodoWrite |
| **AskUser** | interactive.ts | AskUserQuestion |
| **EnterPlan** | plan.ts | EnterPlanMode |
| **ExitPlan** | plan.ts | ExitPlanMode |
| **Skill** | skill.ts | Skill |
| **NotebookEdit** | notebook.ts | NotebookEdit |

---

## RocketLang DSL

**Package:** `@ankr/rocketlang`

### What It Does

Converts Hindi/Tamil/Telugu commands to tool calls:

```
"पढ़ो package.json"  →  { tool: 'Read', path: 'package.json' }
"commit करो"        →  { tool: 'Bash', command: 'git commit' }
"API बनाओ users"    →  { tool: 'Task', type: 'code', prompt: '...' }
```

### Supported Verbs

| English | Hindi | Tamil | Telugu |
|---------|-------|-------|--------|
| read | पढ़ो / padho | படி | చదువు |
| write | लिखो / likho | எழுது | రాయు |
| create | बनाओ / banao | உருவாக்கு | సృష్టించు |
| search | खोजो / khojo | தேடு | వెతుకు |
| run | चलाओ / chalao | இயக்கு | అమలు |
| edit | बदलो / badlo | மாற்று | మార్చు |
| delete | हटाओ / hatao | நீக்கு | తొలగించు |

### Code Generation

RocketLang can emit code in multiple targets:

```typescript
import { parse, toTypeScript, toShellScript, toGo } from '@ankr/rocketlang';

const result = parse('read "config.json"');

toTypeScript(result);  // await fs.readFile('config.json', 'utf-8')
toShellScript(result); // cat config.json
toGo(result);          // ioutil.ReadFile("config.json")
```

### Grammar Features

The PEG grammar (`rocketlang.pegjs` - 21KB) supports:
- File operations
- Search operations (grep, glob, find)
- Git operations
- Package management (npm)
- Direct bash (`$ ls -la`)
- MCP tool calls (`@gst_verify {...}`)
- Conditionals (`if/then/else`, `agar/toh/nahi`)
- Loops (`for/in/do`, `har/mein/karo`)
- Pipes (`cmd1 | cmd2`)
- Variables (`let x = value`)

---

## AI Integration

### Router Adapter (`src/ai/router-adapter.ts`)

Uses `@ankr/ai-router` for multi-LLM support:

```typescript
// Supports 15+ providers
const providers = [
  'anthropic', 'openai', 'groq', 'deepseek',
  'together', 'fireworks', 'ollama', ...
];

// Fallback strategy
strategy: 'free_first' | 'cheapest' | 'fastest' | 'quality'
```

### Offline Adapter (`src/ai/offline-adapter.ts`)

Works without internet using local models:

```typescript
// Supports
- Ollama (llama2, mistral, codellama)
- LM Studio
- LocalAI
```

---

## Memory Integration

### EON Adapter (`src/memory/eon-adapter.ts`)

Connects to EON memory system:

```typescript
// Memory types
type MemoryType = 'fact' | 'episode' | 'procedure' | 'knowledge';

// Operations
await eon.remember(content, type);
await eon.recall(query, options);
await eon.search(query, filters);
```

---

## Voice Integration

### Voice Adapter (`src/voice/adapter.ts` - 29KB)

Supports Indic speech-to-text:

```typescript
// Languages supported
const LANGUAGES = [
  'hi-IN', // Hindi
  'ta-IN', // Tamil
  'te-IN', // Telugu
  'bn-IN', // Bengali
  'mr-IN', // Marathi
  'gu-IN', // Gujarati
  'kn-IN', // Kannada
  'ml-IN', // Malayalam
  'pa-IN', // Punjabi
  'or-IN', // Odia
  'en-IN', // Indian English
];

// Providers
- Swayam voice service
- Google Speech-to-Text
- Azure Speech
- Local Whisper
```

---

## Swayam Personality

### Personality Layer (`src/swayam/index.ts`)

Makes AnkrCode friendly and encouraging:

```typescript
const SWAYAM_TRAITS = {
  language: 'hinglish',      // Hindi-English mix
  tone: 'encouraging',       // "बहुत बढ़िया!"
  teaching: true,            // Explains concepts
  cultural: true,            // Indian references
  humor: 'gentle',           // Light humor
};

// Example responses
"बहुत बढ़िया! अब अगला step..."
"Arre wah! Code perfect hai!"
"Thoda sa error hai, let me fix..."
```

---

## MCP Integration

### MCP Adapter (`src/mcp/adapter.ts`)

Connects to 260+ MCP tools:

```typescript
// Categories
const TOOL_CATEGORIES = {
  compliance: 54,  // GST, TDS, ITR
  erp: 44,         // Invoice, Inventory
  crm: 30,         // Leads, Contacts
  banking: 28,     // UPI, NEFT, EMI
  government: 22,  // Aadhaar, DigiLocker
  logistics: 35,   // Shipment, Route
  eon: 14,         // Memory
  ralph: 24,       // Dev automation
};
```

### Discovery (`src/mcp/discovery.ts`)

Auto-discovers MCP servers:

```typescript
// Discovery sources
1. @powerpbox/mcp package
2. AI-Proxy @ 4444
3. ankr-mcp-tools @ 4002
4. Custom MCP servers
```

---

## Plugins System

### Built-in Plugins

**Git Plugin** (`src/plugins/builtin/git.ts`):
```typescript
// Commands
git.status()
git.commit(message)
git.push(remote, branch)
git.pull()
git.diff()
git.log(count)
```

**Docker Plugin** (`src/plugins/builtin/docker.ts`):
```typescript
// Commands
docker.ps()
docker.logs(container)
docker.exec(container, command)
docker.build(tag, dockerfile)
docker.compose.up()
docker.compose.down()
```

---

## Conversation Manager

### State Machine (`src/conversation/manager.ts`)

```
┌─────────────┐
│   IDLE      │
└──────┬──────┘
       │ user input
       ▼
┌─────────────┐     ┌─────────────┐
│  PLANNING   │────▶│  EXECUTING  │
└─────────────┘     └──────┬──────┘
       ▲                   │
       │                   ▼
       │            ┌─────────────┐
       └────────────│  WAITING    │
                    └─────────────┘
```

### Modes

| Mode | Description |
|------|-------------|
| **Interactive** | Default chat mode |
| **Plan** | Planning before execution |
| **Execute** | Running tools |
| **Background** | Async task execution |

---

## Fallback Chain

AnkrCode uses intelligent fallbacks:

```
1. @ankr/* packages (0ms)      ← Local imports
   ↓ not available?
2. ANKR Services (~5ms)         ← localhost:4xxx
   ↓ not available?
3. AI Proxy (~50ms)             ← localhost:4444
   ↓ not available?
4. Direct APIs (~500ms)         ← Claude/GPT
   ↓ not available?
5. Offline Mode                 ← Local Ollama
```

---

## What Makes AnkrCode Unique vs Claude Code

| Feature | Claude Code | AnkrCode |
|---------|-------------|----------|
| **Languages** | English | 11 Indic |
| **Voice** | No | Yes |
| **DSL** | No | RocketLang |
| **LLMs** | Claude only | 15+ providers |
| **Memory** | Session | Persistent (EON) |
| **Tools** | 16 generic | 14 + 260 MCP |
| **Offline** | No | Yes |
| **Personality** | Professional | Swayam (friendly) |
| **Domain** | Generic | India-specific |
| **Cost** | Premium | Free tier available |

---

## Installation & Usage

```bash
# Install
npm install -g @ankr/ankrcode-core --registry http://localhost:4873

# Start
ankrcode chat

# Quick commands
ankrcode ask "create a REST API for users"
ankrcode review src/
ankrcode commit
ankrcode doctor

# Hindi commands (via RocketLang)
ankrcode ask "ek function banao jo array ko reverse kare"
```

---

## Key Files Summary

| File | Size | Purpose |
|------|------|---------|
| `cli/index.ts` | 890KB | Main CLI (68 commands bundled) |
| `voice/adapter.ts` | 29KB | Voice input (11 languages) |
| `ai/router-adapter.ts` | 18KB | Multi-LLM routing |
| `conversation/manager.ts` | 19KB | State management |
| `swayam/index.ts` | 16KB | Personality layer |
| `mcp/discovery.ts` | 14KB | MCP auto-discovery |
| `memory/eon-adapter.ts` | 13KB | EON integration |
| `rocketlang/grammar.pegjs` | 21KB | DSL grammar |
| `rocketlang/runtime.ts` | 27KB | DSL execution |

---

*AnkrCode - AI Coding Assistant for Bharat*
*सबके लिए AI - AI for Everyone*
