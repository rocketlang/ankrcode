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
