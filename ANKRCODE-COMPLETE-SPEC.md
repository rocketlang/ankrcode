# AnkrCode: World-Class AI Coding Assistant for Bharat

## Executive Summary

AnkrCode aims to be a Claude Code-equivalent tool, but **Indic-first, voice-enabled, and built for the common man**. The good news: **ANKR Labs already has 70-80% of the required infrastructure**.

---

## Part 1: Claude Code Capability Mapping

### Complete Tool Inventory (Claude Code)

| Tool | Purpose | ANKR Equivalent | Status |
|------|---------|-----------------|--------|
| **Read** | Read files | `fs.readFileSync` | ✅ Trivial |
| **Write** | Write files | `fs.writeFileSync` | ✅ Trivial |
| **Edit** | String replacement edits | Need to build | 🔨 Build |
| **Glob** | File pattern matching | `fast-glob` / existing | ✅ Trivial |
| **Grep** | Content search (ripgrep) | `@vscode/ripgrep` | ✅ Trivial |
| **Bash** | Execute commands | `child_process` (ralph.ts) | ✅ Exists |
| **Task** | Spawn sub-agents | `bani/agent-orchestrator` | ✅ Exists |
| **WebFetch** | Fetch URLs | `fetch` + turndown | ✅ Trivial |
| **WebSearch** | Web search | Need API integration | 🔨 Build |
| **NotebookEdit** | Jupyter editing | Need to build | 🔨 Build |
| **TodoWrite** | Task tracking | Need to build | 🔨 Build |
| **AskUserQuestion** | Interactive prompts | `inquirer` / existing | ✅ Trivial |
| **EnterPlanMode** | Planning mode | State machine needed | 🔨 Build |
| **ExitPlanMode** | Exit planning | State machine needed | 🔨 Build |
| **Skill** | Invoke skills/commands | MCP tools (255+) | ✅ Exists |
| **KillShell** | Kill background process | `process.kill()` | ✅ Trivial |
| **TaskOutput** | Get task output | Need to build | 🔨 Build |

### Capability Summary

| Category | Claude Code | ANKR Has | Gap |
|----------|------------|----------|-----|
| File Operations | 4 tools | 3 ready | Edit tool |
| Search | 2 tools | 2 ready | None |
| Execution | 3 tools | 2 ready | TaskOutput |
| Web | 2 tools | 1 ready | WebSearch |
| Planning | 3 tools | 0 ready | State machine |
| Agents | 2 tools | 2 ready | None |
| Interactive | 2 tools | 1 ready | TodoWrite UI |

---

## Part 2: Existing ANKR Assets (Ready to Reuse)

### Tier 1: Direct Reuse (No Changes)

| Package | Use For | Location |
|---------|---------|----------|
| `@ankr/ai-router` | Multi-LLM routing (15+ providers) | `packages/ai-router` |
| `@ankr/eon` | Memory & context (episodic/semantic) | `packages/ankr-eon` |
| `@ankr/mcp` | 255+ domain tools | `packages/ankr-mcp` |
| `@ankr/mcp-tools` | MCP server implementation | `packages/mcp-tools` |
| `bani` | Agent orchestrator (state machine) | `packages/bani` |
| `@ankr/i18n` | Hindi/Tamil/Telugu/Kannada/Marathi | `packages/ankr-i18n` |
| `claude-delegator` | GPT expert routing | `packages/claude-delegator` |
| `ankr5 CLI` | CLI framework (Commander.js) | `.ankr/cli` |
| `@ankr/config` | Port configuration | `config/ports.config.ts` |

### Tier 2: Extend/Adapt

| Package | Current State | Needed Changes |
|---------|--------------|----------------|
| `bani/agent-orchestrator` | Swayam-focused | Add coding agent types |
| `@ankr/i18n` | 6 languages | Add 5 more Indic languages |
| `ankr5 CLI` | 11 commands | Add ankrcode mode |
| `ralph` | Dev automation | Expose as tools |

### Tier 3: Build New

| Component | Why New | Effort |
|-----------|---------|--------|
| `@ankr/ankrcode-core` | CLI orchestration | Large |
| `@ankr/rocketlang` | DSL parser | Large |
| `@ankr/edit-tool` | Precise file editing | Medium |
| `@ankr/plan-mode` | Planning state machine | Medium |
| `@ankr/voice-input` | Speech-to-text (Indic) | Large |

---

## Part 3: Architecture Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AnkrCode CLI                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Input Layer (Multilingual)                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│   │
│  │  │ Keyboard │  │  Voice   │  │   File   │  │ RocketLang DSL   ││   │
│  │  │  (i18n)  │  │ (Indic)  │  │  Input   │  │    Interpreter   ││   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌─────────────────────────────────▼───────────────────────────────┐   │
│  │                    Conversation Manager                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │ Plan Mode    │  │ Execute Mode │  │  Interactive Mode    │  │   │
│  │  │ State Machine│  │  (default)   │  │  (AskUser, Todo)     │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌─────────────────────────────────▼───────────────────────────────┐   │
│  │                       Tool Executor                              │   │
│  │  ┌────────────────────────────────────────────────────────────┐ │   │
│  │  │                    Core Tools (14)                          │ │   │
│  │  │  Read │ Write │ Edit │ Glob │ Grep │ Bash │ Task │ ...    │ │   │
│  │  └────────────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────────────┐ │   │
│  │  │                  MCP Tools (255+)                           │ │   │
│  │  │  GST │ TDS │ Banking │ Logistics │ EON │ Government │ ...  │ │   │
│  │  └────────────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────────────┐ │   │
│  │  │                  Agent Spawner (bani)                       │ │   │
│  │  │  Explore │ Plan │ Code │ Review │ Security │ Custom       │ │   │
│  │  └────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌─────────────────────────────────▼───────────────────────────────┐   │
│  │                      AI Layer                                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │ @ankr/       │  │ GPT Expert   │  │  Swayam Personality  │  │   │
│  │  │ ai-router    │  │ Delegation   │  │  Layer (optional)    │  │   │
│  │  │ (15+ LLMs)   │  │ (claude-     │  │                      │  │   │
│  │  │              │  │  delegator)  │  │                      │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌─────────────────────────────────▼───────────────────────────────┐   │
│  │                     Memory Layer                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │ EON Memory   │  │ Conversation │  │  Project Context     │  │   │
│  │  │ (long-term)  │  │ (session)    │  │  (CLAUDE.md equiv)   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Agent Architecture (Inspired by bani + Claude Code)

```typescript
// packages/ankrcode-core/src/agents/types.ts

interface AnkrCodeAgent {
  id: string;
  type: AgentType;
  tools: Tool[];
  systemPrompt: string;
  maxTurns: number;
  model: 'claude' | 'gpt' | 'gemini' | 'groq' | 'local';
}

type AgentType =
  | 'general-purpose'  // Full tool access
  | 'explore'          // Read-only, fast exploration
  | 'plan'            // Architecture planning
  | 'code'            // Code generation
  | 'review'          // Code review
  | 'security'        // Security analysis
  | 'bash'            // Command execution
  | 'custom';         // User-defined

// Agent spawning (like Claude Code Task tool)
async function spawnAgent(config: {
  type: AgentType;
  prompt: string;
  context?: ConversationContext;
  runInBackground?: boolean;
}): Promise<AgentResult> {
  // Reuse bani/agent-orchestrator patterns
  const orchestrator = new AgentOrchestrator();
  return orchestrator.execute(config);
}
```

### Tool System Architecture

```typescript
// packages/ankrcode-core/src/tools/registry.ts

// Core tools (Claude Code equivalent)
const CORE_TOOLS: Tool[] = [
  { name: 'Read', handler: readTool, schema: readSchema },
  { name: 'Write', handler: writeTool, schema: writeSchema },
  { name: 'Edit', handler: editTool, schema: editSchema },
  { name: 'Glob', handler: globTool, schema: globSchema },
  { name: 'Grep', handler: grepTool, schema: grepSchema },
  { name: 'Bash', handler: bashTool, schema: bashSchema },
  { name: 'Task', handler: taskTool, schema: taskSchema },
  { name: 'WebFetch', handler: webFetchTool, schema: webFetchSchema },
  { name: 'WebSearch', handler: webSearchTool, schema: webSearchSchema },
  { name: 'TodoWrite', handler: todoWriteTool, schema: todoWriteSchema },
  { name: 'AskUserQuestion', handler: askUserTool, schema: askUserSchema },
  { name: 'EnterPlanMode', handler: enterPlanTool, schema: enterPlanSchema },
  { name: 'ExitPlanMode', handler: exitPlanTool, schema: exitPlanSchema },
  { name: 'Skill', handler: skillTool, schema: skillSchema },
];

// Domain tools (ANKR's 255+ MCP tools)
import { getAllMCPTools } from '@ankr/mcp';
const DOMAIN_TOOLS = getAllMCPTools();

// Combined registry
export const ALL_TOOLS = [...CORE_TOOLS, ...DOMAIN_TOOLS];
```

---

## Part 4: RocketLang DSL

### Design Philosophy

```
Natural Indic Language → Intent Extraction → Tool Calls → Execution
```

RocketLang is NOT a programming language. It's an **intent specification language** that maps natural speech patterns (especially code-switching Indian English) to tool invocations.

### Grammar Specification

```peg
// rocketlang.pegjs

Program = Statement+

Statement
  = FileOperation
  / GitOperation
  / ApiOperation
  / DatabaseOperation
  / NaturalCommand

FileOperation
  = ("पढ़ो" / "padho" / "read") _ path:FilePath { return { tool: 'Read', path } }
  / ("लिखो" / "likho" / "write") _ content:String _ ("में" / "mein" / "in" / "to") _ path:FilePath
    { return { tool: 'Write', path, content } }
  / ("बदलो" / "badlo" / "change" / "edit") _ old:String _ ("को" / "ko" / "to") _ new:String _ ("में" / "mein" / "in") _ path:FilePath
    { return { tool: 'Edit', path, oldString: old, newString: new } }

GitOperation
  = ("commit" _ "करो" / "commit" _ "karo" / "commit") _ message:String
    { return { tool: 'Bash', command: `git commit -m "${message}"` } }
  / ("push" _ "करो" / "push" _ "karo" / "push") _ remote:Identifier? _ branch:Identifier?
    { return { tool: 'Bash', command: `git push ${remote || 'origin'} ${branch || 'main'}` } }

ApiOperation
  = ("API" _ "बनाओ" / "API" _ "banao" / "create" _ "API") _ endpoint:Endpoint _ ("for" / "के लिए" / "ke liye")? _ domain:Identifier
    { return { tool: 'Task', type: 'code', prompt: `Create REST API for ${domain} at ${endpoint}` } }

DatabaseOperation
  = ("table" _ "बनाओ" / "table" _ "banao" / "create" _ "table") _ name:Identifier _ schema:SchemaBlock
    { return { tool: 'Task', type: 'code', prompt: `Create database table ${name}` } }

NaturalCommand
  = words:Word+ { return { tool: 'LLM', prompt: words.join(' ') } }

// Terminals
FilePath = [a-zA-Z0-9_./-]+
String = '"' [^"]* '"' / "'" [^']* "'"
Identifier = [a-zA-Z_][a-zA-Z0-9_]*
Word = [^\n]+
_ = [ \t]*
```

### Code-Switching Support

The key innovation: Indians naturally mix Hindi/English. RocketLang must understand:

```javascript
// packages/rocketlang/src/codeswitching.ts

const EQUIVALENTS = {
  // Verbs
  'बनाओ': ['banao', 'create', 'make'],
  'पढ़ो': ['padho', 'read'],
  'लिखो': ['likho', 'write'],
  'बदलो': ['badlo', 'change', 'edit', 'modify'],
  'हटाओ': ['hatao', 'delete', 'remove'],
  'खोजो': ['khojo', 'search', 'find'],
  'चलाओ': ['chalao', 'run', 'execute'],
  'दिखाओ': ['dikhao', 'show', 'display'],

  // Connectors
  'में': ['mein', 'in', 'to'],
  'से': ['se', 'from'],
  'को': ['ko', 'to'],
  'के लिए': ['ke liye', 'for'],
  'और': ['aur', 'and'],

  // Nouns
  'फ़ाइल': ['file'],
  'फ़ोल्डर': ['folder', 'directory'],
  'कोड': ['code'],
  'फ़ंक्शन': ['function'],
  'एपीआई': ['API'],
};

function normalizeInput(input: string): string {
  let normalized = input.toLowerCase();
  for (const [canonical, variants] of Object.entries(EQUIVALENTS)) {
    for (const variant of variants) {
      normalized = normalized.replace(new RegExp(variant, 'gi'), canonical);
    }
  }
  return normalized;
}
```

### Example Interactions

```
# User types (code-switching):
"ek function banao jo array ko reverse kare"

# RocketLang parses to:
{
  tool: 'Task',
  type: 'code',
  prompt: 'Create a function that reverses an array',
  language: 'detected-from-context'
}

# Tool executes and returns code
```

```
# User types:
"padho src/index.ts"

# RocketLang parses to:
{
  tool: 'Read',
  path: 'src/index.ts'
}
```

```
# User types (pure Hindi):
"मुझे सारे .ts files दिखाओ"

# RocketLang parses to:
{
  tool: 'Glob',
  pattern: '**/*.ts'
}
```

---

## Part 5: Differentiation Strategy

### Claude Code vs AnkrCode

| Feature | Claude Code | AnkrCode |
|---------|-------------|----------|
| **Primary Language** | English | Indic (11 languages) |
| **Input Modes** | Text | Text + Voice + RocketLang DSL |
| **Target User** | Professional devs | Common man + devs |
| **Domain Tools** | Generic (16) | Generic + India-specific (270+) |
| **Memory** | Session-based | EON (persistent knowledge graph) |
| **LLM Provider** | Claude only | 15+ providers (ai-router) |
| **Personality** | Professional | Swayam (friendly, encouraging) |
| **Offline Mode** | No | Yes (local models) |
| **Cost** | Premium | Free tier + premium |
| **Cultural Context** | Western | Indian (festivals, business practices) |

### Unique Value Propositions

1. **"Bolo aur Banao"** (Speak and Build)
   - Voice-first development in Hindi/Tamil/Telugu
   - "GST invoice banao 5000 rupees ka" → generates complete GST invoice

2. **India-Specific Tools**
   - GST compliance (54 tools)
   - Government integrations (Aadhaar, DigiLocker)
   - Banking (UPI, BBPS)
   - Regional business practices

3. **Vernacular Error Messages**
   - `TypeError` → "प्रकार में गलती - string चाहिए था, number मिला"
   - Explanations in simple Hindi/regional language

4. **Swayam Personality**
   - Encouraging: "बहुत बढ़िया! अब अगला step..."
   - Teaching mode for beginners
   - Cultural references

5. **Offline Capability**
   - Works in tier-2/3 cities with poor connectivity
   - Local models (Ollama, LM Studio)

---

## Part 6: Implementation Roadmap

### Phase 0: Foundation (Week 1-2)

| Task | Effort | Depends On |
|------|--------|------------|
| Create `@ankr/ankrcode-core` package | Medium | - |
| Port core tools (Read, Write, Glob, Grep) | Small | ankrcode-core |
| Build Edit tool (string replacement) | Medium | - |
| Build Bash tool (with sandboxing) | Medium | - |
| Setup CLI entry point | Small | ankrcode-core |

**Deliverable**: `ankrcode` CLI that can read/write/edit files and run bash commands.

### Phase 1: Tool Parity (Week 3-4)

| Task | Effort | Depends On |
|------|--------|------------|
| Build Task tool (agent spawning) | Large | bani integration |
| Build TodoWrite tool | Medium | - |
| Build AskUserQuestion tool | Small | inquirer |
| Build WebFetch tool | Small | - |
| Build WebSearch tool | Medium | Search API |
| Build Plan mode state machine | Medium | - |

**Deliverable**: Near-parity with Claude Code tools.

### Phase 2: AI Integration (Week 5-6)

| Task | Effort | Depends On |
|------|--------|------------|
| Integrate @ankr/ai-router | Medium | Phase 1 |
| Build conversation manager | Large | ai-router |
| Integrate EON memory | Medium | ankr-eon |
| Build context builder (like CLAUDE.md) | Medium | - |
| Integrate MCP tools (255+) | Medium | ankr-mcp |

**Deliverable**: AI-powered coding assistant.

### Phase 3: Indic-First (Week 7-8)

| Task | Effort | Depends On |
|------|--------|------------|
| Extend @ankr/i18n to 11 languages | Medium | - |
| Build RocketLang parser | Large | - |
| Integrate transliteration | Medium | - |
| Build voice input (Indic STT) | Large | - |
| Create Swayam personality layer | Medium | - |

**Deliverable**: Hindi/regional language support.

### Phase 4: Polish & Launch (Week 9-10)

| Task | Effort | Depends On |
|------|--------|------------|
| Performance optimization | Medium | All phases |
| Offline mode (local models) | Large | - |
| Documentation (multilingual) | Medium | - |
| Beta testing | Large | - |
| npm publish | Small | - |

**Deliverable**: Production-ready AnkrCode v1.0.

---

## Part 7: Package Structure

```
ankr-labs-nx/
├── packages/
│   ├── ankrcode-core/              # NEW - Main CLI package
│   │   ├── src/
│   │   │   ├── cli/
│   │   │   │   ├── index.ts        # Entry point
│   │   │   │   ├── repl.ts         # Interactive mode
│   │   │   │   └── commands/       # CLI commands
│   │   │   ├── tools/
│   │   │   │   ├── registry.ts     # Tool registration
│   │   │   │   ├── core/           # Core tools (Read, Write, Edit, etc.)
│   │   │   │   └── adapters/       # MCP tool adapters
│   │   │   ├── agents/
│   │   │   │   ├── types.ts        # Agent type definitions
│   │   │   │   ├── spawner.ts      # Agent spawning
│   │   │   │   └── presets/        # Predefined agents
│   │   │   ├── conversation/
│   │   │   │   ├── manager.ts      # Conversation state
│   │   │   │   ├── plan-mode.ts    # Planning state machine
│   │   │   │   └── history.ts      # Context management
│   │   │   ├── i18n/
│   │   │   │   ├── messages/       # Translated UI strings
│   │   │   │   └── errors/         # Vernacular errors
│   │   │   └── personality/
│   │   │       └── swayam.ts       # Swayam personality
│   │   └── package.json
│   │
│   ├── rocketlang/                 # NEW - DSL package
│   │   ├── src/
│   │   │   ├── grammar/
│   │   │   │   └── rocketlang.pegjs
│   │   │   ├── parser/
│   │   │   │   └── index.ts
│   │   │   ├── normalizer/
│   │   │   │   ├── codeswitching.ts
│   │   │   │   └── transliteration.ts
│   │   │   └── codegen/
│   │   │       └── tool-mapper.ts
│   │   └── package.json
│   │
│   ├── ankr-voice-input/           # NEW - Voice input
│   │   ├── src/
│   │   │   ├── stt/                # Speech-to-text
│   │   │   ├── languages/          # Language models
│   │   │   └── streaming/          # Real-time transcription
│   │   └── package.json
│   │
│   ├── ankr-edit-tool/             # NEW - Precise editing
│   │   ├── src/
│   │   │   ├── string-replace.ts   # Like Claude Code Edit
│   │   │   ├── diff.ts             # Diff generation
│   │   │   └── validation.ts       # Edit validation
│   │   └── package.json
│   │
│   ├── ai-router/                  # EXISTING - Reuse
│   ├── ankr-eon/                   # EXISTING - Reuse
│   ├── ankr-mcp/                   # EXISTING - Reuse
│   ├── mcp-tools/                  # EXISTING - Reuse
│   ├── bani/                       # EXISTING - Extend
│   ├── ankr-i18n/                  # EXISTING - Extend
│   └── claude-delegator/           # EXISTING - Reuse
```

---

## Part 8: Code Examples

### Entry Point

```typescript
// packages/ankrcode-core/src/cli/index.ts

#!/usr/bin/env node
import { Command } from 'commander';
import { createConversationManager } from '../conversation/manager';
import { createToolRegistry } from '../tools/registry';
import { loadI18n, detectLanguage } from '@ankr/i18n';
import { aiRouter } from '@ankr/ai-router';
import { eon } from '@ankr/eon';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();

program
  .name('ankrcode')
  .description('AI coding assistant for Bharat - Bolo aur Banao!')
  .version('1.0.0')
  .option('-l, --lang <language>', 'UI language (hi, ta, te, en)', 'hi')
  .option('-m, --model <model>', 'LLM model to use', 'claude')
  .option('--offline', 'Use local models only')
  .option('--voice', 'Enable voice input');

program
  .command('chat')
  .description('Start interactive chat / चैट शुरू करें')
  .action(async (options) => {
    const lang = options.lang || detectLanguage();
    const i18n = await loadI18n(lang);

    console.log(chalk.cyan(i18n.t('welcome')));
    // "नमस्ते! मैं AnkrCode हूं। आज मैं आपकी क्या मदद कर सकता हूं?"

    const conversation = createConversationManager({
      model: options.model,
      language: lang,
      personality: 'swayam',
      memory: eon,
    });

    await conversation.startREPL();
  });

program
  .command('run <file>')
  .description('Execute RocketLang script / रॉकेटलैंग स्क्रिप्ट चलाएं')
  .action(async (file) => {
    const { parseRocketLang } = await import('@ankr/rocketlang');
    const script = await fs.readFile(file, 'utf-8');
    const commands = parseRocketLang(script);

    for (const cmd of commands) {
      await executeCommand(cmd);
    }
  });

program.parse();
```

### Tool Execution

```typescript
// packages/ankrcode-core/src/tools/core/edit.ts

import { Tool, ToolResult } from '../types';
import * as fs from 'fs/promises';

export const editTool: Tool = {
  name: 'Edit',
  description: 'Performs exact string replacements in files',
  schema: {
    type: 'object',
    properties: {
      file_path: { type: 'string', description: 'Absolute path to file' },
      old_string: { type: 'string', description: 'Text to replace' },
      new_string: { type: 'string', description: 'Replacement text' },
      replace_all: { type: 'boolean', default: false },
    },
    required: ['file_path', 'old_string', 'new_string'],
  },

  async handler(params): Promise<ToolResult> {
    const { file_path, old_string, new_string, replace_all } = params;

    const content = await fs.readFile(file_path, 'utf-8');

    // Check uniqueness
    const occurrences = content.split(old_string).length - 1;
    if (occurrences === 0) {
      return { success: false, error: 'old_string not found in file' };
    }
    if (occurrences > 1 && !replace_all) {
      return {
        success: false,
        error: `old_string found ${occurrences} times. Use replace_all or provide unique string.`
      };
    }

    const newContent = replace_all
      ? content.replaceAll(old_string, new_string)
      : content.replace(old_string, new_string);

    await fs.writeFile(file_path, newContent);

    return {
      success: true,
      data: {
        file_path,
        replacements: replace_all ? occurrences : 1
      }
    };
  }
};
```

### Agent Spawning

```typescript
// packages/ankrcode-core/src/agents/spawner.ts

import { AgentOrchestrator } from 'bani';
import { aiRouter } from '@ankr/ai-router';

type AgentType = 'explore' | 'plan' | 'code' | 'review' | 'security' | 'bash' | 'general';

interface AgentConfig {
  type: AgentType;
  prompt: string;
  model?: string;
  maxTurns?: number;
  runInBackground?: boolean;
}

const AGENT_PRESETS: Record<AgentType, Partial<AgentConfig>> = {
  explore: {
    maxTurns: 10,
    model: 'haiku', // Fast, cheap
    systemPrompt: 'You are a code exploration agent. Search and summarize findings.',
  },
  plan: {
    maxTurns: 5,
    model: 'sonnet',
    systemPrompt: 'You are a software architect. Create detailed implementation plans.',
  },
  code: {
    maxTurns: 20,
    model: 'sonnet',
    systemPrompt: 'You are a code generation agent. Write clean, tested code.',
  },
  review: {
    maxTurns: 10,
    model: 'sonnet',
    systemPrompt: 'You are a code reviewer. Find bugs, security issues, and improvements.',
  },
  security: {
    maxTurns: 10,
    model: 'opus',
    systemPrompt: 'You are a security analyst. Find vulnerabilities and suggest fixes.',
  },
  bash: {
    maxTurns: 5,
    model: 'haiku',
    systemPrompt: 'You execute bash commands. Be careful with destructive operations.',
  },
  general: {
    maxTurns: 50,
    model: 'sonnet',
    systemPrompt: 'You are a general-purpose coding assistant.',
  },
};

export async function spawnAgent(config: AgentConfig): Promise<AgentResult> {
  const preset = AGENT_PRESETS[config.type];
  const orchestrator = new AgentOrchestrator();

  const agent = orchestrator.createAgent({
    ...preset,
    ...config,
    tools: getToolsForAgent(config.type),
    llm: aiRouter.getProvider(config.model || preset.model),
  });

  if (config.runInBackground) {
    return orchestrator.runInBackground(agent, config.prompt);
  }

  return orchestrator.run(agent, config.prompt);
}

function getToolsForAgent(type: AgentType): Tool[] {
  switch (type) {
    case 'explore':
      return [readTool, globTool, grepTool]; // Read-only
    case 'bash':
      return [bashTool];
    case 'plan':
      return [readTool, globTool, grepTool, webFetchTool];
    default:
      return ALL_TOOLS;
  }
}
```

---

## Part 9: Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tool Parity | 100% of Claude Code tools | Checklist |
| Language Support | 11 Indic languages | i18n coverage |
| Voice Accuracy | >90% Hindi recognition | STT benchmark |
| Response Time | <3s for simple queries | P95 latency |
| Offline Mode | Full functionality | Feature parity |
| User Adoption | 10K MAU in 6 months | Analytics |

---

## Summary

**AnkrCode can achieve near-100% Claude Code capability** because:

1. **70-80% infrastructure exists**: ai-router, eon, mcp (255+ tools), bani orchestrator, i18n
2. **Clear gaps identified**: Edit tool, Plan mode, WebSearch, Voice input
3. **Differentiation is clear**: Indic-first, voice, 255+ domain tools, Swayam personality
4. **RocketLang** adds unique value for code-switching Indian developers

The ask is achievable in **10-12 weeks** with focused effort.
# AnkrCode Tool System Specification

## Deep Dive: How Claude Code Tools Work + How to Build with ANKR

---

## Part 1: Claude Code Tool Architecture (Reverse-Engineered)

### Tool Execution Flow

```
User Input
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                  Conversation Manager                    │
│  - Maintains message history                            │
│  - Tracks tool calls and results                        │
│  - Manages context window                               │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                      LLM Call                            │
│  - System prompt with tool definitions                  │
│  - Tool schemas as functions                            │
│  - Streaming response with tool_use blocks              │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                  Tool Executor                           │
│  - Parses tool_use from response                        │
│  - Routes to appropriate handler                        │
│  - Validates parameters                                 │
│  - Handles permissions/approvals                        │
│  - Returns tool_result                                  │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│               Continue Conversation                      │
│  - Append tool_result to messages                       │
│  - Call LLM again with updated context                  │
│  - Repeat until no more tool calls                      │
└─────────────────────────────────────────────────────────┘
```

### Tool Definition Schema

Every Claude Code tool follows this pattern:

```typescript
interface ToolDefinition {
  name: string;                    // e.g., "Read", "Bash", "Task"
  description: string;             // Detailed description for LLM
  parameters: JSONSchema;          // Input validation schema
}

interface ToolInvocation {
  name: string;
  parameters: Record<string, unknown>;
}

interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
}
```

---

## Part 2: Complete Tool Specifications

### Tool 1: Read

```typescript
// ANKR Implementation: Trivial (fs.readFileSync)
// Existing: Can reuse from any file utility

const ReadTool: ToolDefinition = {
  name: 'Read',
  description: `Reads a file from the filesystem.
- file_path must be absolute
- Returns content with line numbers (cat -n format)
- Can read images (returns base64 for multimodal)
- Can read PDFs (extracts text + images)
- Can read Jupyter notebooks (.ipynb)
- Supports offset/limit for large files`,
  parameters: {
    type: 'object',
    properties: {
      file_path: { type: 'string', description: 'Absolute path to file' },
      offset: { type: 'number', description: 'Line number to start from' },
      limit: { type: 'number', description: 'Number of lines to read' },
    },
    required: ['file_path'],
  },
};

// Implementation
async function readHandler(params: ReadParams): Promise<ToolResult> {
  const { file_path, offset = 0, limit = 2000 } = params;

  if (!path.isAbsolute(file_path)) {
    return { success: false, error: 'Path must be absolute' };
  }

  const content = await fs.readFile(file_path, 'utf-8');
  const lines = content.split('\n');
  const selected = lines.slice(offset, offset + limit);

  // Format with line numbers
  const formatted = selected
    .map((line, i) => `${String(offset + i + 1).padStart(6)}  ${line}`)
    .join('\n');

  return { success: true, output: formatted };
}
```

### Tool 2: Write

```typescript
// ANKR Implementation: Trivial (fs.writeFileSync)

const WriteTool: ToolDefinition = {
  name: 'Write',
  description: `Writes content to a file.
- Overwrites existing file
- Creates parent directories if needed
- REQUIRES reading file first if it exists (safety check)`,
  parameters: {
    type: 'object',
    properties: {
      file_path: { type: 'string', description: 'Absolute path' },
      content: { type: 'string', description: 'Content to write' },
    },
    required: ['file_path', 'content'],
  },
};
```

### Tool 3: Edit (NEW - Must Build)

```typescript
// ANKR Implementation: NEW - Must build
// This is the most critical tool for code editing

const EditTool: ToolDefinition = {
  name: 'Edit',
  description: `Performs exact string replacement in files.
- old_string must be UNIQUE in file (or use replace_all)
- Preserves exact indentation
- REQUIRES reading file first
- Fails if old_string not found or not unique`,
  parameters: {
    type: 'object',
    properties: {
      file_path: { type: 'string' },
      old_string: { type: 'string', description: 'Exact text to replace' },
      new_string: { type: 'string', description: 'Replacement text' },
      replace_all: { type: 'boolean', default: false },
    },
    required: ['file_path', 'old_string', 'new_string'],
  },
};

// Implementation - CRITICAL for code editing
async function editHandler(params: EditParams): Promise<ToolResult> {
  const { file_path, old_string, new_string, replace_all = false } = params;

  // Safety: Must have read file recently (tracked in conversation)
  if (!hasRecentlyRead(file_path)) {
    return { success: false, error: 'Must read file before editing' };
  }

  const content = await fs.readFile(file_path, 'utf-8');

  // Count occurrences
  const regex = new RegExp(escapeRegex(old_string), 'g');
  const matches = content.match(regex);
  const count = matches ? matches.length : 0;

  if (count === 0) {
    return { success: false, error: 'old_string not found in file' };
  }

  if (count > 1 && !replace_all) {
    return {
      success: false,
      error: `old_string found ${count} times. Provide more context to make it unique, or use replace_all.`
    };
  }

  // Perform replacement
  const newContent = replace_all
    ? content.replaceAll(old_string, new_string)
    : content.replace(old_string, new_string);

  await fs.writeFile(file_path, newContent);

  return {
    success: true,
    output: `Replaced ${replace_all ? count : 1} occurrence(s) in ${file_path}`
  };
}
```

### Tool 4: Glob

```typescript
// ANKR Implementation: Use fast-glob (npm package)
// Or reuse from ralph.ts patterns

const GlobTool: ToolDefinition = {
  name: 'Glob',
  description: `Fast file pattern matching.
- Supports patterns like "**/*.ts", "src/**/*.tsx"
- Returns files sorted by modification time
- Use instead of bash find command`,
  parameters: {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Glob pattern' },
      path: { type: 'string', description: 'Directory to search in' },
    },
    required: ['pattern'],
  },
};

// Implementation
import fg from 'fast-glob';

async function globHandler(params: GlobParams): Promise<ToolResult> {
  const { pattern, path: searchPath = process.cwd() } = params;

  const files = await fg(pattern, {
    cwd: searchPath,
    absolute: true,
    stats: true,
  });

  // Sort by mtime descending
  files.sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);

  return {
    success: true,
    output: files.map(f => f.path).join('\n')
  };
}
```

### Tool 5: Grep

```typescript
// ANKR Implementation: Use @vscode/ripgrep
// Much faster than native grep

const GrepTool: ToolDefinition = {
  name: 'Grep',
  description: `Search file contents using ripgrep.
- Supports regex patterns
- output_mode: "content" | "files_with_matches" | "count"
- Can filter by file type or glob
- Use -A/-B/-C for context lines`,
  parameters: {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Regex pattern' },
      path: { type: 'string', description: 'Search directory' },
      output_mode: { enum: ['content', 'files_with_matches', 'count'] },
      glob: { type: 'string', description: 'File filter pattern' },
      type: { type: 'string', description: 'File type (js, py, ts, etc.)' },
      '-A': { type: 'number', description: 'Lines after match' },
      '-B': { type: 'number', description: 'Lines before match' },
      '-C': { type: 'number', description: 'Lines around match' },
      '-i': { type: 'boolean', description: 'Case insensitive' },
    },
    required: ['pattern'],
  },
};

// Implementation
import { rgPath } from '@vscode/ripgrep';
import { spawn } from 'child_process';

async function grepHandler(params: GrepParams): Promise<ToolResult> {
  const args = buildRipgrepArgs(params);

  return new Promise((resolve) => {
    const rg = spawn(rgPath, args);
    let output = '';

    rg.stdout.on('data', (data) => { output += data; });
    rg.on('close', () => {
      resolve({ success: true, output: output.trim() });
    });
  });
}
```

### Tool 6: Bash

```typescript
// ANKR Implementation: Exists in ralph.ts (execSync, spawn)
// Add sandboxing and security

const BashTool: ToolDefinition = {
  name: 'Bash',
  description: `Execute bash commands.
- For terminal operations (git, npm, docker)
- DO NOT use for file ops (use Read/Write/Edit)
- Commands timeout after 2 minutes by default
- Can run in background with run_in_background`,
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Command to execute' },
      description: { type: 'string', description: 'What this command does' },
      timeout: { type: 'number', description: 'Timeout in ms (max 600000)' },
      run_in_background: { type: 'boolean' },
    },
    required: ['command'],
  },
};

// Implementation with security
async function bashHandler(params: BashParams): Promise<ToolResult> {
  const { command, timeout = 120000, run_in_background = false } = params;

  // Security checks
  if (isDangerous(command)) {
    return { success: false, error: 'Command blocked for safety' };
  }

  if (run_in_background) {
    const taskId = crypto.randomUUID();
    spawnBackground(taskId, command);
    return { success: true, output: `Background task started: ${taskId}` };
  }

  return new Promise((resolve) => {
    const proc = spawn('bash', ['-c', command], {
      timeout,
      cwd: process.cwd(),
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d; });
    proc.stderr.on('data', (d) => { stderr += d; });

    proc.on('close', (code) => {
      resolve({
        success: code === 0,
        output: stdout + stderr,
        error: code !== 0 ? `Exit code: ${code}` : undefined,
      });
    });
  });
}

function isDangerous(command: string): boolean {
  const dangerous = [
    /rm\s+-rf\s+[\/~]/,       // rm -rf /
    />\s*\/dev\/sd/,          // overwrite disk
    /mkfs/,                   // format disk
    /dd\s+if=.*of=\/dev/,     // dd to device
    /:(){.*};:/,              // fork bomb
  ];
  return dangerous.some(re => re.test(command));
}
```

### Tool 7: Task (Agent Spawning) - CRITICAL

```typescript
// ANKR Implementation: Extend bani/agent-orchestrator
// This is the most complex tool

const TaskTool: ToolDefinition = {
  name: 'Task',
  description: `Spawn sub-agents for complex tasks.
Available agent types:
- explore: Fast codebase exploration (read-only)
- plan: Architecture and implementation planning
- code: Code generation
- review: Code review
- security: Security analysis
- bash: Command execution
- general: Full tool access`,
  parameters: {
    type: 'object',
    properties: {
      subagent_type: { type: 'string', enum: ['explore', 'plan', 'code', 'review', 'security', 'bash', 'general'] },
      prompt: { type: 'string', description: 'Task description' },
      description: { type: 'string', description: 'Short 3-5 word summary' },
      model: { type: 'string', enum: ['haiku', 'sonnet', 'opus'] },
      max_turns: { type: 'number' },
      run_in_background: { type: 'boolean' },
      resume: { type: 'string', description: 'Agent ID to resume' },
    },
    required: ['subagent_type', 'prompt', 'description'],
  },
};

// Implementation - Extends bani orchestrator
import { AgentOrchestrator } from 'bani';
import { aiRouter } from '@ankr/ai-router';

const agentRegistry = new Map<string, AgentInstance>();

async function taskHandler(params: TaskParams): Promise<ToolResult> {
  const {
    subagent_type,
    prompt,
    model = 'sonnet',
    max_turns = 20,
    run_in_background = false,
    resume,
  } = params;

  // Resume existing agent
  if (resume && agentRegistry.has(resume)) {
    const agent = agentRegistry.get(resume)!;
    return agent.continue(prompt);
  }

  // Create new agent
  const agentConfig = AGENT_PRESETS[subagent_type];
  const orchestrator = new AgentOrchestrator();

  const agent = orchestrator.createAgent({
    id: crypto.randomUUID(),
    type: subagent_type,
    systemPrompt: agentConfig.systemPrompt,
    tools: agentConfig.tools,
    maxTurns: max_turns,
    llm: aiRouter.getProvider(model),
  });

  agentRegistry.set(agent.id, agent);

  if (run_in_background) {
    const outputFile = `/tmp/agent-${agent.id}.log`;
    agent.runInBackground(prompt, outputFile);
    return {
      success: true,
      output: `Agent ${agent.id} running in background. Output: ${outputFile}`
    };
  }

  const result = await agent.run(prompt);
  return {
    success: true,
    output: result.response,
    agentId: agent.id,
  };
}

// Agent presets
const AGENT_PRESETS = {
  explore: {
    systemPrompt: 'You are a fast code exploration agent. Search and summarize.',
    tools: ['Read', 'Glob', 'Grep'],  // Read-only
    model: 'haiku',
  },
  plan: {
    systemPrompt: 'You are a software architect. Create detailed plans.',
    tools: ['Read', 'Glob', 'Grep', 'WebFetch'],
    model: 'sonnet',
  },
  code: {
    systemPrompt: 'You are a code generation agent. Write clean, tested code.',
    tools: ALL_TOOLS,
    model: 'sonnet',
  },
  review: {
    systemPrompt: 'You are a code reviewer. Find bugs and improvements.',
    tools: ['Read', 'Glob', 'Grep'],
    model: 'sonnet',
  },
  security: {
    systemPrompt: 'You are a security analyst. Find vulnerabilities.',
    tools: ['Read', 'Glob', 'Grep', 'Bash'],
    model: 'opus',
  },
  bash: {
    systemPrompt: 'You execute bash commands carefully.',
    tools: ['Bash'],
    model: 'haiku',
  },
  general: {
    systemPrompt: 'You are a general-purpose coding assistant.',
    tools: ALL_TOOLS,
    model: 'sonnet',
  },
};
```

### Tool 8: TodoWrite

```typescript
// ANKR Implementation: NEW - Must build
// Track tasks in conversation

const TodoWriteTool: ToolDefinition = {
  name: 'TodoWrite',
  description: `Manage task list for current session.
- Use for complex multi-step tasks
- States: pending, in_progress, completed
- Only ONE task should be in_progress at a time`,
  parameters: {
    type: 'object',
    properties: {
      todos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Imperative: "Run tests"' },
            activeForm: { type: 'string', description: 'Continuous: "Running tests"' },
            status: { enum: ['pending', 'in_progress', 'completed'] },
          },
          required: ['content', 'activeForm', 'status'],
        },
      },
    },
    required: ['todos'],
  },
};

// Implementation - In-memory + display
interface Todo {
  content: string;
  activeForm: string;
  status: 'pending' | 'in_progress' | 'completed';
}

let currentTodos: Todo[] = [];

async function todoWriteHandler(params: { todos: Todo[] }): Promise<ToolResult> {
  currentTodos = params.todos;

  // Display in terminal
  displayTodos(currentTodos);

  return { success: true, output: 'Todos updated' };
}

function displayTodos(todos: Todo[]) {
  console.log('\n📋 Tasks:');
  todos.forEach((todo, i) => {
    const icon = {
      pending: '⬜',
      in_progress: '🔄',
      completed: '✅',
    }[todo.status];

    const text = todo.status === 'in_progress' ? todo.activeForm : todo.content;
    console.log(`  ${icon} ${text}`);
  });
  console.log();
}
```

### Tool 9: AskUserQuestion

```typescript
// ANKR Implementation: Use inquirer.js
// Already exists in CLI patterns

const AskUserQuestionTool: ToolDefinition = {
  name: 'AskUserQuestion',
  description: `Ask user questions during execution.
- For clarifications, preferences, decisions
- Supports single and multi-select
- Max 4 questions per call`,
  parameters: {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        maxItems: 4,
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            header: { type: 'string', maxLength: 12 },
            options: {
              type: 'array',
              minItems: 2,
              maxItems: 4,
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
            multiSelect: { type: 'boolean', default: false },
          },
        },
      },
    },
  },
};

// Implementation
import inquirer from 'inquirer';

async function askUserHandler(params: AskUserParams): Promise<ToolResult> {
  const answers: Record<string, string[]> = {};

  for (const q of params.questions) {
    const choices = [
      ...q.options.map(o => ({ name: `${o.label} - ${o.description}`, value: o.label })),
      { name: 'Other (custom input)', value: '__other__' },
    ];

    const { answer } = await inquirer.prompt([{
      type: q.multiSelect ? 'checkbox' : 'list',
      name: 'answer',
      message: q.question,
      choices,
    }]);

    if (answer === '__other__' || (Array.isArray(answer) && answer.includes('__other__'))) {
      const { custom } = await inquirer.prompt([{
        type: 'input',
        name: 'custom',
        message: 'Enter your answer:',
      }]);
      answers[q.header] = [custom];
    } else {
      answers[q.header] = Array.isArray(answer) ? answer : [answer];
    }
  }

  return { success: true, output: JSON.stringify(answers) };
}
```

### Tool 10: WebFetch

```typescript
// ANKR Implementation: Trivial (fetch + turndown)

const WebFetchTool: ToolDefinition = {
  name: 'WebFetch',
  description: `Fetch URL and process content.
- Converts HTML to markdown
- Handles redirects
- 15-minute cache`,
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', format: 'uri' },
      prompt: { type: 'string', description: 'What to extract from page' },
    },
    required: ['url', 'prompt'],
  },
};

// Implementation
import TurndownService from 'turndown';

const cache = new Map<string, { content: string; timestamp: number }>();

async function webFetchHandler(params: WebFetchParams): Promise<ToolResult> {
  const { url, prompt } = params;

  // Check cache (15 min)
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < 15 * 60 * 1000) {
    return processWithLLM(cached.content, prompt);
  }

  const response = await fetch(url);
  const html = await response.text();

  const turndown = new TurndownService();
  const markdown = turndown.turndown(html);

  cache.set(url, { content: markdown, timestamp: Date.now() });

  return processWithLLM(markdown, prompt);
}
```

### Tool 11: WebSearch

```typescript
// ANKR Implementation: NEW - Need search API integration
// Options: Brave Search, SerpAPI, Tavily

const WebSearchTool: ToolDefinition = {
  name: 'WebSearch',
  description: `Search the web for current information.
- For info beyond knowledge cutoff
- Returns search results with links
- MUST include Sources section in response`,
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', minLength: 2 },
      allowed_domains: { type: 'array', items: { type: 'string' } },
      blocked_domains: { type: 'array', items: { type: 'string' } },
    },
    required: ['query'],
  },
};

// Implementation - Using Tavily (or similar)
async function webSearchHandler(params: WebSearchParams): Promise<ToolResult> {
  const { query, allowed_domains, blocked_domains } = params;

  // Using Tavily API (or Brave, SerpAPI)
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      include_domains: allowed_domains,
      exclude_domains: blocked_domains,
    }),
  });

  const data = await response.json();

  const formatted = data.results.map((r: any) =>
    `**${r.title}**\n${r.url}\n${r.snippet}`
  ).join('\n\n');

  return { success: true, output: formatted };
}
```

### Tool 12: Plan Mode Tools

```typescript
// ANKR Implementation: NEW - State machine

const EnterPlanModeTool: ToolDefinition = {
  name: 'EnterPlanMode',
  description: `Enter planning mode for complex tasks.
Use when:
- New feature implementation
- Multiple valid approaches exist
- Architectural decisions needed
- Multi-file changes`,
  parameters: {
    type: 'object',
    properties: {},
  },
};

const ExitPlanModeTool: ToolDefinition = {
  name: 'ExitPlanMode',
  description: `Exit planning mode when plan is ready.
- Plan should be written to designated file
- Request bash permissions needed`,
  parameters: {
    type: 'object',
    properties: {
      allowedPrompts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tool: { enum: ['Bash'] },
            prompt: { type: 'string', description: 'Action description' },
          },
        },
      },
    },
  },
};

// State machine implementation
type ConversationMode = 'execute' | 'plan';

interface ConversationState {
  mode: ConversationMode;
  planFile?: string;
  allowedPrompts: Array<{ tool: string; prompt: string }>;
}

let state: ConversationState = { mode: 'execute', allowedPrompts: [] };

async function enterPlanHandler(): Promise<ToolResult> {
  state.mode = 'plan';
  state.planFile = `/tmp/plan-${Date.now()}.md`;

  return {
    success: true,
    output: `Entered plan mode. Write your plan to: ${state.planFile}`
  };
}

async function exitPlanHandler(params: ExitPlanParams): Promise<ToolResult> {
  if (state.mode !== 'plan') {
    return { success: false, error: 'Not in plan mode' };
  }

  state.allowedPrompts = params.allowedPrompts || [];
  state.mode = 'execute';

  // Read and display plan for user approval
  const plan = await fs.readFile(state.planFile!, 'utf-8');

  return {
    success: true,
    output: `Plan ready for review:\n\n${plan}\n\nRequested permissions: ${JSON.stringify(state.allowedPrompts)}`
  };
}
```

### Tool 13: Skill (MCP Tools)

```typescript
// ANKR Implementation: EXISTS - @ankr/mcp (255+ tools)

const SkillTool: ToolDefinition = {
  name: 'Skill',
  description: `Execute skills/slash commands.
Available skills:
- ankr-db: PostgreSQL operations
- ankr-delegate: GPT expert delegation
- ankr-eon: Memory operations
- ankr-freightbox: NVOCC platform
- ankr-wowtruck: TMS operations
- ankr-mcp: Access 260+ MCP tools
- ankr-ports: Service port discovery
Plus user-defined skills`,
  parameters: {
    type: 'object',
    properties: {
      skill: { type: 'string', description: 'Skill name' },
      args: { type: 'string', description: 'Arguments for skill' },
    },
    required: ['skill'],
  },
};

// Implementation - Bridge to MCP tools
import { executeMCPTool, getToolByName } from '@ankr/mcp';

async function skillHandler(params: SkillParams): Promise<ToolResult> {
  const { skill, args } = params;

  // Check if it's an MCP tool
  const mcpTool = getToolByName(skill);
  if (mcpTool) {
    const parsedArgs = args ? JSON.parse(args) : {};
    return executeMCPTool(skill, parsedArgs);
  }

  // Check user-defined skills
  const userSkill = loadUserSkill(skill);
  if (userSkill) {
    return userSkill.execute(args);
  }

  return { success: false, error: `Unknown skill: ${skill}` };
}
```

---

## Part 3: Tool Registry & Executor

### Tool Registry

```typescript
// packages/ankrcode-core/src/tools/registry.ts

import { Tool, ToolDefinition, ToolResult } from './types';

class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getDefinitions(): ToolDefinition[] {
    return this.getAll().map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  // For OpenAI function calling format
  getOpenAIFunctions(): OpenAIFunction[] {
    return this.getAll().map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  // For Anthropic tool_use format
  getAnthropicTools(): AnthropicTool[] {
    return this.getAll().map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));
  }
}

// Singleton instance
export const registry = new ToolRegistry();

// Register all tools
import { readTool, writeTool, editTool } from './core/file';
import { globTool, grepTool } from './core/search';
import { bashTool } from './core/bash';
import { taskTool } from './core/task';
import { todoWriteTool } from './core/todo';
import { askUserTool } from './core/interactive';
import { webFetchTool, webSearchTool } from './core/web';
import { enterPlanTool, exitPlanTool } from './core/plan';
import { skillTool } from './core/skill';

// Core tools
registry.register(readTool);
registry.register(writeTool);
registry.register(editTool);
registry.register(globTool);
registry.register(grepTool);
registry.register(bashTool);
registry.register(taskTool);
registry.register(todoWriteTool);
registry.register(askUserTool);
registry.register(webFetchTool);
registry.register(webSearchTool);
registry.register(enterPlanTool);
registry.register(exitPlanTool);
registry.register(skillTool);

// Import MCP tools
import { getAllMCPTools } from '@ankr/mcp';
getAllMCPTools().forEach(t => registry.register(t));
```

### Tool Executor

```typescript
// packages/ankrcode-core/src/tools/executor.ts

import { registry } from './registry';
import { ToolInvocation, ToolResult } from './types';

interface ExecutorOptions {
  requireApproval?: boolean;
  timeout?: number;
  sandbox?: boolean;
}

class ToolExecutor {
  private filesRead = new Set<string>();  // Track reads for Edit safety
  private approvedCommands = new Set<string>();

  async execute(
    invocation: ToolInvocation,
    options: ExecutorOptions = {}
  ): Promise<ToolResult> {
    const tool = registry.get(invocation.name);

    if (!tool) {
      return { success: false, error: `Unknown tool: ${invocation.name}` };
    }

    // Validate parameters
    const validation = validateParams(invocation.parameters, tool.parameters);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Check permissions
    if (options.requireApproval && this.needsApproval(invocation)) {
      const approved = await this.requestApproval(invocation);
      if (!approved) {
        return { success: false, error: 'User denied permission' };
      }
    }

    // Track file reads (for Edit safety)
    if (invocation.name === 'Read') {
      this.filesRead.add(invocation.parameters.file_path);
    }

    // Check Edit prerequisites
    if (invocation.name === 'Edit') {
      if (!this.filesRead.has(invocation.parameters.file_path)) {
        return { success: false, error: 'Must Read file before Edit' };
      }
    }

    // Execute with timeout
    try {
      const result = await Promise.race([
        tool.handler(invocation.parameters),
        this.timeout(options.timeout || 120000),
      ]);

      return result;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Execute multiple tools in parallel
  async executeParallel(
    invocations: ToolInvocation[],
    options: ExecutorOptions = {}
  ): Promise<ToolResult[]> {
    return Promise.all(
      invocations.map(inv => this.execute(inv, options))
    );
  }

  private needsApproval(invocation: ToolInvocation): boolean {
    // Bash commands need approval unless pre-approved
    if (invocation.name === 'Bash') {
      const cmd = invocation.parameters.command;
      return !this.approvedCommands.has(cmd);
    }
    return false;
  }

  private async requestApproval(invocation: ToolInvocation): Promise<boolean> {
    const { answer } = await inquirer.prompt([{
      type: 'confirm',
      name: 'answer',
      message: `Allow ${invocation.name}: ${JSON.stringify(invocation.parameters)}?`,
    }]);
    return answer;
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    );
  }
}

export const executor = new ToolExecutor();
```

---

## Part 4: Conversation Manager

```typescript
// packages/ankrcode-core/src/conversation/manager.ts

import { aiRouter } from '@ankr/ai-router';
import { eon } from '@ankr/eon';
import { registry, executor } from '../tools';
import { Message, ToolCall } from './types';

interface ConversationConfig {
  model: string;
  language: string;
  personality?: 'default' | 'swayam';
  memory?: typeof eon;
}

class ConversationManager {
  private messages: Message[] = [];
  private config: ConversationConfig;
  private mode: 'execute' | 'plan' = 'execute';

  constructor(config: ConversationConfig) {
    this.config = config;
  }

  async chat(userMessage: string): Promise<string> {
    // Add user message
    this.messages.push({ role: 'user', content: userMessage });

    // Get context from EON memory
    const context = await this.config.memory?.recall(userMessage);

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(context);

    // Call LLM
    const response = await this.callLLM(systemPrompt);

    // Process tool calls
    while (response.toolCalls?.length) {
      const results = await this.executeToolCalls(response.toolCalls);
      this.messages.push({ role: 'assistant', content: response.content, toolCalls: response.toolCalls });
      this.messages.push({ role: 'tool', results });

      // Continue conversation with tool results
      const continuation = await this.callLLM(systemPrompt);
      response.content = continuation.content;
      response.toolCalls = continuation.toolCalls;
    }

    // Add final response
    this.messages.push({ role: 'assistant', content: response.content });

    // Save to memory
    await this.config.memory?.remember({
      input: userMessage,
      output: response.content,
      context: this.extractLearnings(),
    });

    return response.content;
  }

  private async callLLM(systemPrompt: string) {
    const provider = aiRouter.getProvider(this.config.model);

    return provider.complete({
      system: systemPrompt,
      messages: this.messages,
      tools: registry.getAnthropicTools(),
      stream: true,
    });
  }

  private async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    // Parallel execution for independent tools
    const independent = this.findIndependent(toolCalls);
    const sequential = toolCalls.filter(t => !independent.includes(t));

    const parallelResults = await executor.executeParallel(independent);
    const sequentialResults = [];

    for (const call of sequential) {
      sequentialResults.push(await executor.execute(call));
    }

    return [...parallelResults, ...sequentialResults];
  }

  private findIndependent(toolCalls: ToolCall[]): ToolCall[] {
    // Tools that don't depend on each other can run in parallel
    // e.g., multiple Read calls, or Read + Glob
    const readOnly = ['Read', 'Glob', 'Grep', 'WebFetch'];
    return toolCalls.filter(t => readOnly.includes(t.name));
  }

  private buildSystemPrompt(context?: any): string {
    const base = SYSTEM_PROMPTS[this.config.personality || 'default'];
    const tools = registry.getDefinitions();
    const projectContext = this.loadProjectContext();

    return `${base}

${context ? `## Relevant Context from Memory\n${context}` : ''}

${projectContext ? `## Project Context\n${projectContext}` : ''}

## Available Tools
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

## Current Mode: ${this.mode}
${this.mode === 'plan' ? 'You are in planning mode. Create a detailed plan before implementation.' : ''}
`;
  }

  private loadProjectContext(): string | null {
    // Look for ANKRCODE.md, CLAUDE.md, or similar
    const contextFiles = ['ANKRCODE.md', 'CLAUDE.md', '.ankrcode/context.md'];
    for (const file of contextFiles) {
      if (fs.existsSync(file)) {
        return fs.readFileSync(file, 'utf-8');
      }
    }
    return null;
  }
}

const SYSTEM_PROMPTS = {
  default: `You are AnkrCode, an AI coding assistant.`,
  swayam: `आप AnkrCode हैं, एक AI coding assistant।
आप friendly और encouraging हैं।
जब user Hindi में बात करे तो Hindi में जवाब दें।
Complex concepts को simple Hindi में explain करें।`,
};
```

---

## Part 5: Integration with Existing ANKR

### Reusing @ankr/ai-router

```typescript
// Already supports 15+ providers
import { aiRouter } from '@ankr/ai-router';

// Configure providers
aiRouter.configure({
  defaultProvider: 'claude',
  providers: {
    claude: { apiKey: process.env.ANTHROPIC_API_KEY },
    openai: { apiKey: process.env.OPENAI_API_KEY },
    groq: { apiKey: process.env.GROQ_API_KEY },
    // ... 12 more
  },
  fallback: ['groq', 'openai'],  // If primary fails
  freeTier: ['groq', 'cohere'],  // Free options
});
```

### Reusing @ankr/eon Memory

```typescript
// Already has episodic + semantic memory
import { eon } from '@ankr/eon';

// Remember conversation context
await eon.remember({
  type: 'episodic',
  content: 'User asked about React hooks',
  metadata: { project: 'myapp', timestamp: Date.now() },
});

// Recall relevant context
const context = await eon.recall('React useState best practices', {
  limit: 5,
  types: ['episodic', 'semantic'],
});
```

### Reusing @ankr/mcp Tools

```typescript
// Already has 255+ tools
import { getAllMCPTools, executeMCPTool, getToolsByCategory } from '@ankr/mcp';

// Get all tools for registry
const mcpTools = getAllMCPTools();  // 255+ tools

// Execute specific tool
const result = await executeMCPTool('gst_validate', { gstNumber: '29XXXXX' });

// Get category-specific tools
const bankingTools = getToolsByCategory('banking');  // 28 tools
const complianceTools = getToolsByCategory('compliance');  // 54 tools
```

### Reusing bani/agent-orchestrator

```typescript
// Already has multi-agent orchestration
import { AgentOrchestrator } from 'bani';

const orchestrator = new AgentOrchestrator();

// Create agent with specific tools
const agent = orchestrator.createAgent({
  type: 'code',
  tools: ['Read', 'Write', 'Edit', 'Bash'],
  systemPrompt: 'You are a code generation agent',
});

// Run agent
const result = await orchestrator.run(agent, 'Create a React component');
```

---

## Part 6: What Needs to Be Built

### Priority 1: Must Build (Core)

| Component | Effort | Description |
|-----------|--------|-------------|
| `Edit` tool | Medium | String replacement with uniqueness check |
| `TodoWrite` tool | Small | Task tracking with display |
| `Plan mode` state machine | Medium | Enter/exit planning |
| `TaskOutput` tool | Small | Get background task results |
| CLI entry point | Medium | Wire everything together |

### Priority 2: Should Build (Differentiation)

| Component | Effort | Description |
|-----------|--------|-------------|
| `WebSearch` tool | Small | API integration (Tavily/Brave) |
| RocketLang parser | Large | DSL for Indic code-switching |
| Voice input | Large | Indic STT integration |
| Swayam personality | Medium | Friendly Hindi responses |

### Priority 3: Nice to Have

| Component | Effort | Description |
|-----------|--------|-------------|
| `NotebookEdit` tool | Medium | Jupyter support |
| Offline mode | Large | Local model integration |
| Visual mode | Large | GUI for non-CLI users |

---

## Summary

**ANKR already has:**
- ✅ LLM routing (15+ providers)
- ✅ Memory system (EON)
- ✅ 255+ domain tools (MCP)
- ✅ Agent orchestration (bani)
- ✅ i18n foundation (6 languages)
- ✅ CLI framework (ankr5)
- ✅ Expert delegation (claude-delegator)

**Need to build:**
- 🔨 Edit tool (critical)
- 🔨 TodoWrite tool
- 🔨 Plan mode state machine
- 🔨 Conversation manager (glue)
- 🔨 CLI entry point

**Estimated effort:** 6-8 weeks for Claude Code parity, +4 weeks for Indic-first differentiation.
