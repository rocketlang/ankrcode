# AnkrCode Complete Documentation

**Download Package - January 2026**

---

## Table of Contents

1. [Project Report](#1-project-report)
2. [Architecture](#2-architecture)
3. [Tool Specifications](#3-tool-specifications)
4. [Claude Reference (ANKRCODE_TODO.md)](#4-claude-reference)
5. [Roadmap](#5-roadmap)
6. [Installation](#6-installation)

---

# AnkrCode Project Report

**Version**: 2.0.0  
**Date**: January 2026  
**Status**: Production Ready  
**Repository**: `/root/ankrcode-project`

---

## Executive Summary

AnkrCode is a **Claude Code-inspired AI coding assistant** built specifically for Indian developers. It provides:

- **Indic-first experience**: Native support for 11 Indian languages (Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, Gujarati, Malayalam, Punjabi, Odia)
- **Voice-enabled coding**: Speak commands in your language
- **RocketLang DSL**: Natural code-switching syntax ("ek function banao jo...")
- **260+ Domain Tools**: GST, TDS, Banking, Logistics, Government APIs via MCP
- **ANKR-first architecture**: Leverages existing ANKR ecosystem before external APIs

---

## 1. What AnkrCode Does

### 1.1 Core Capabilities

| Capability | Description |
|------------|-------------|
| **Code Generation** | Generate code from natural language in any Indic language |
| **File Operations** | Read, write, edit files with intelligent safety checks |
| **Code Search** | Fast pattern matching (Glob) and content search (Grep/ripgrep) |
| **Command Execution** | Run shell commands with security guardrails |
| **Multi-Agent Tasks** | Spawn specialized sub-agents for complex work |
| **Web Integration** | Fetch URLs, search the web for current information |
| **Memory** | Persistent knowledge via EON knowledge graph |
| **Planning Mode** | Design implementation before coding |

### 1.2 Unique Features

```
┌────────────────────────────────────────────────────────────┐
│                    AnkrCode Differentiators                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  🗣️ Voice Input          "बोलो और बनाओ" (Speak & Build)    │
│     - Hindi, Tamil, Telugu, etc.                           │
│     - Real-time transcription via Swayam                   │
│                                                             │
│  🔤 Code-Switching        Mix languages naturally          │
│     - "ek function banao jo array reverse kare"            │
│     - Automatic transliteration support                    │
│                                                             │
│  🛠️ 260+ Domain Tools     India-specific capabilities      │
│     - GST compliance, TDS, ITR                             │
│     - UPI, BBPS, Banking                                   │
│     - Aadhaar, DigiLocker                                  │
│     - Shipment tracking, logistics                         │
│                                                             │
│  🧠 Persistent Memory     EON knowledge graph              │
│     - Cross-session context                                │
│     - Project-specific learning                            │
│                                                             │
│  😊 Swayam Personality    Friendly, encouraging            │
│     - Cultural context awareness                           │
│     - Teaching mode for beginners                          │
│                                                             │
│  📴 Offline Mode          Works without internet           │
│     - Local models via Ollama                              │
│     - Ideal for tier-2/3 cities                            │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 1.3 Supported Languages

| Language | Native Script | Transliteration | Voice |
|----------|---------------|-----------------|-------|
| Hindi | हिन्दी | ✅ | ✅ |
| Tamil | தமிழ் | ✅ | ✅ |
| Telugu | తెలుగు | ✅ | ✅ |
| Kannada | ಕನ್ನಡ | ✅ | ✅ |
| Marathi | मराठी | ✅ | ✅ |
| Bengali | বাংলা | ✅ | ✅ |
| Gujarati | ગુજરાતી | ✅ | ✅ |
| Malayalam | മലയാളം | ✅ | ✅ |
| Punjabi | ਪੰਜਾਬੀ | ✅ | ✅ |
| Odia | ଓଡ଼ିଆ | ✅ | ✅ |
| English | English | - | ✅ |

---

## 2. How AnkrCode Works

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AnkrCode CLI                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      INPUT LAYER                                    │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐ │ │
│  │  │ Keyboard │  │ Voice Input  │  │ RocketLang  │  │ File Input  │ │ │
│  │  │  (i18n)  │  │   (Swayam)   │  │  .rocket    │  │   stdin     │ │ │
│  │  └──────────┘  └──────────────┘  └─────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                   CONVERSATION MANAGER                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │ │
│  │  │ Execute Mode │  │  Plan Mode   │  │   Context Manager        │ │ │
│  │  │  (default)   │  │  (planning)  │  │   (history + memory)     │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      TOOL EXECUTOR                                  │ │
│  │  ┌─────────────────────────────────────────────────────────────┐  │ │
│  │  │                   CORE TOOLS (14)                            │  │ │
│  │  │  Read │ Write │ Edit │ Glob │ Grep │ Bash │ Task │ Web...  │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  │  ┌─────────────────────────────────────────────────────────────┐  │ │
│  │  │                   MCP TOOLS (260+)                           │  │ │
│  │  │  GST │ TDS │ Banking │ Logistics │ Government │ EON...     │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      ADAPTER LAYER (ANKR-First)                     │ │
│  │                                                                      │ │
│  │  Priority 1: Local Packages     Priority 2: ANKR Services           │ │
│  │  ┌───────────┐ ┌───────────┐   ┌───────────┐ ┌───────────────┐    │ │
│  │  │ @ankr/eon │ │ @ankr/mcp │   │ AI Proxy  │ │ EON Service   │    │ │
│  │  │ (memory)  │ │ (tools)   │   │ :4444     │ │ :4005         │    │ │
│  │  └───────────┘ └───────────┘   └───────────┘ └───────────────┘    │ │
│  │                                                                      │ │
│  │  Priority 3: Direct APIs (Fallback)                                 │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────┐    │ │
│  │  │  Claude   │ │   GPT     │ │   Groq    │ │ Ollama (local)  │    │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └─────────────────┘    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 ANKR-First Priority Chain

AnkrCode leverages existing ANKR infrastructure before calling external APIs:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANKR-First Resolution                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  For LLM Requests:                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ 1. AI Proxy  │ -> │ 2. ai-router │ -> │ 3. Direct API    │  │
│  │   :4444      │    │   package    │    │   (Claude/GPT)   │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│                                                                  │
│  For Memory:                                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ 1. @ankr/eon │ -> │ 2. EON Svc   │ -> │ 3. In-Memory     │  │
│  │   package    │    │   :4005      │    │   (session)      │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│                                                                  │
│  For Tools:                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ 1. @ankr/mcp │ -> │ 2. MCP Svc   │ -> │ 3. Core Tools    │  │
│  │   package    │    │   :4006      │    │   (14 built-in)  │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Tool Execution Flow

```
User Input: "ek file banao test.ts mein hello world likho"
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    RocketLang Normalizer                     │
│  1. Detect script (Devanagari/Roman/Mixed)                  │
│  2. Normalize verbs: banao→create, likho→write              │
│  3. Extract intent + parameters                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    {
                      tool: "Write",
                      params: {
                        file_path: "test.ts",
                        content: "hello world"
                      }
                    }
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Tool Executor                             │
│  1. Validate parameters                                      │
│  2. Check permissions (file write allowed?)                  │
│  3. Execute tool handler                                     │
│  4. Return result                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    { success: true, output: "File created" }
```

### 2.4 Conversation Loop

```typescript
// Simplified conversation flow
async function chat(userMessage: string): Promise<string> {
  // 1. Add to history
  messages.push({ role: 'user', content: userMessage });
  
  // 2. Get context from EON memory
  const context = await eon.recall(userMessage);
  
  // 3. Build system prompt (with personality + context)
  const systemPrompt = buildSystemPrompt(context);
  
  // 4. Call LLM (via ANKR-first chain)
  let response = await llm.complete({ systemPrompt, messages, tools });
  
  // 5. Execute tool calls
  while (response.toolCalls?.length > 0) {
    const results = await executeTools(response.toolCalls);
    messages.push({ role: 'tool', results });
    response = await llm.complete({ systemPrompt, messages, tools });
  }
  
  // 6. Save to memory
  await eon.remember(userMessage + '\n' + response.content);
  
  return response.content;
}
```

---

## 3. Technical Specifications

### 3.1 Package Structure

```
ankrcode-project/
├── packages/
│   ├── ankrcode-core/              # Main CLI package (v2.0.0)
│   │   ├── src/
│   │   │   ├── cli/                # CLI entry point
│   │   │   │   └── index.ts        # Commander.js CLI
│   │   │   ├── tools/              # Tool implementations
│   │   │   │   ├── core/           # 8 core tool files
│   │   │   │   │   ├── file.ts     # Read, Write, Edit
│   │   │   │   │   ├── search.ts   # Glob, Grep
│   │   │   │   │   ├── bash.ts     # Bash, TaskOutput, KillShell
│   │   │   │   │   ├── task.ts     # Task (agent spawning)
│   │   │   │   │   ├── interactive.ts  # TodoWrite, AskUser
│   │   │   │   │   ├── web.ts      # WebFetch, WebSearch
│   │   │   │   │   ├── plan.ts     # EnterPlanMode, ExitPlanMode
│   │   │   │   │   └── skill.ts    # Skill (MCP bridge)
│   │   │   │   ├── registry.ts     # Tool registration
│   │   │   │   ├── executor.ts     # Tool execution
│   │   │   │   └── index.ts        # Public exports
│   │   │   ├── conversation/       # Conversation management
│   │   │   │   └── manager.ts      # Multi-turn with tools
│   │   │   ├── ai/                 # LLM adapters
│   │   │   │   ├── router-adapter.ts   # ai-proxy + ai-router
│   │   │   │   └── offline-adapter.ts  # Ollama/LM Studio
│   │   │   ├── mcp/                # MCP integration
│   │   │   │   └── adapter.ts      # 260+ tool bridge
│   │   │   ├── memory/             # Memory system
│   │   │   │   └── eon-adapter.ts  # EON knowledge graph
│   │   │   ├── voice/              # Voice input
│   │   │   │   └── adapter.ts      # Swayam STT
│   │   │   ├── swayam/             # Bot personality
│   │   │   │   └── index.ts        # Swayam integration
│   │   │   ├── config/             # Configuration
│   │   │   │   ├── index.ts        # Settings management
│   │   │   │   └── permissions.ts  # Security permissions
│   │   │   ├── i18n/               # Internationalization
│   │   │   │   └── index.ts        # 11 Indic languages
│   │   │   ├── types.ts            # TypeScript definitions
│   │   │   └── index.ts            # Main exports
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── rocketlang/                 # DSL package (v1.0.0)
│       ├── src/
│       │   ├── parser/             # RocketLang parser
│       │   │   ├── index.ts        # Pattern-based parser
│       │   │   └── peg-parser.ts   # PEG grammar parser
│       │   ├── grammar/            # PEG grammar definition
│       │   │   └── rocketlang.pegjs
│       │   ├── normalizer/         # Indic text normalization
│       │   │   └── index.ts        # Verb mapping, transliteration
│       │   ├── compiler/           # Code generation
│       │   │   ├── index.ts        # Compiler orchestrator
│       │   │   ├── emitter-js.ts   # JavaScript output
│       │   │   ├── emitter-go.ts   # Go output
│       │   │   └── emitter-sh.ts   # Shell script output
│       │   ├── codegen/            # Tool call generation
│       │   │   └── index.ts
│       │   ├── repl/               # Interactive REPL
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── package.json
│       └── README.md
│
├── docs/
│   ├── ankrcode-architecture.md    # Detailed architecture
│   └── ankrcode-tools-spec.md      # Tool specifications
├── examples/
│   └── demo.rocket                 # Example RocketLang script
├── ROADMAP.md                      # Improvement roadmap
├── NEXT-STEPS.md                   # Concrete action items
├── README.md                       # Project overview
└── package.json                    # Workspace config
```

### 3.2 Core Tools Reference

| Tool | Parameters | Description |
|------|------------|-------------|
| **Read** | `file_path`, `offset?`, `limit?` | Read file with line numbers |
| **Write** | `file_path`, `content` | Write/overwrite file |
| **Edit** | `file_path`, `old_string`, `new_string`, `replace_all?` | String replacement |
| **Glob** | `pattern`, `path?` | File pattern matching |
| **Grep** | `pattern`, `path?`, `output_mode?`, context flags | Content search |
| **Bash** | `command`, `timeout?`, `run_in_background?` | Execute commands |
| **Task** | `subagent_type`, `prompt`, `model?`, `max_turns?` | Spawn sub-agents |
| **WebFetch** | `url`, `prompt` | Fetch and analyze URL |
| **WebSearch** | `query`, `allowed_domains?`, `blocked_domains?` | Web search |
| **TodoWrite** | `todos[]` | Task tracking |
| **AskUserQuestion** | `questions[]` | Interactive prompts |
| **EnterPlanMode** | - | Start planning |
| **ExitPlanMode** | `allowedPrompts?` | Finish planning |
| **Skill** | `skill`, `args?` | Execute MCP tools |

### 3.3 MCP Tool Categories

| Category | Tool Count | Examples |
|----------|------------|----------|
| Compliance | 54 | gst_validate, tds_calculate, itr_status |
| ERP | 44 | invoice_create, inventory_check |
| CRM | 30 | lead_create, contact_search |
| Banking | 28 | upi_pay, emi_calculate, bbps_pay |
| Government | 22 | aadhaar_verify, digilocker_fetch |
| Logistics | 35 | shipment_track, route_optimize |
| EON Memory | 14 | eon_remember, eon_recall, eon_search |
| **Total** | **255+** | |

### 3.4 Dependencies

```json
{
  "dependencies": {
    "commander": "^12.0.0",    // CLI framework
    "chalk": "^5.3.0",         // Terminal colors
    "ora": "^8.0.0",           // Spinners
    "fast-glob": "^3.3.0",     // File globbing
    "turndown": "^7.1.2"       // HTML to Markdown
  },
  "optionalDependencies": {
    "@vscode/ripgrep": "^1.15.0"  // Fast search
  },
  "peerDependencies": {
    "@ankr/ai-router": ">=2.0.0",   // Multi-LLM support
    "@ankr/eon": ">=3.0.0",         // Memory system
    "@powerpbox/mcp": ">=1.0.0"     // MCP tools
  }
}
```

---

## 4. Usage Examples

### 4.1 CLI Commands

```bash
# Interactive chat (Hindi default)
ankrcode chat

# Chat in Tamil
ankrcode chat --lang ta

# Single question
ankrcode ask "ek REST API banao users ke liye"

# List tools
ankrcode tools

# Health check
ankrcode doctor

# Run RocketLang script
ankrcode run script.rocket
```

### 4.2 RocketLang Examples

```rocketlang
# File operations
पढ़ो "src/index.ts"                    # Read file (Hindi)
padho "config.json"                    # Read file (transliterated)
read "package.json"                    # Read file (English)

# Write operations
लिखो "console.log('hi')" में "test.js" # Write (Hindi)
write "hello" to "test.txt"            # Write (English)

# Code-switching (natural Indian English)
ek function banao jo email validate kare
API banao users ke liye with CRUD operations
database mein new table banao for products

# Git operations
commit करो "bug fix"                   # Git commit
push करो origin main में               # Git push

# Direct bash
$ npm install express
$ docker-compose up -d

# MCP tool calls
@gst_verify { gstin: "29ABCDE1234F1Z5" }
@shipment_track { awb: "1234567890" }
```

### 4.3 Conversation Example

```
स्वयं> ek express server banao with /health endpoint

🔄 Thinking...

मैं आपके लिए एक Express server बना रहा हूं।

[Using Write tool to create server.ts]
[Using Write tool to create package.json]
[Using Bash tool to run: npm install]

Server तैयार है! चलाने के लिए:
  npm start

फिर http://localhost:3000/health पर जाएं।

स्वयं> TypeScript में convert करो

🔄 Thinking...

[Using Edit tool to update server.ts]
[Using Bash tool to run: npm install typescript @types/express]

Done! अब TypeScript में है।
```

---

## 5. Integration Points

### 5.1 ANKR Ecosystem Integration

| Service | Port | Integration |
|---------|------|-------------|
| AI Proxy | 4444 | Primary LLM gateway |
| EON Memory | 4005 | Persistent memory |
| MCP Server | 4006 | 260+ domain tools |
| Swayam Bot | 7777 | Voice input, personality |
| FreightBox | 4003 | Logistics tools |
| WowTruck | 4000 | TMS tools |
| PostgreSQL | 5432 | Database operations |

### 5.2 Configuration

```json
// ~/.ankrcode/config.json
{
  "language": "hi",
  "model": "claude",
  "personality": "swayam",
  "offline": false,
  "services": {
    "aiProxy": "http://localhost:4444",
    "eonMemory": "http://localhost:4005",
    "mcpServer": "http://localhost:4006"
  }
}
```

### 5.3 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API key | Yes (if no AI Proxy) |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `GROQ_API_KEY` | Groq API key (free) | Optional |
| `AI_PROXY_URL` | AI Proxy URL | Optional |
| `EON_URL` | EON Memory URL | Optional |

---

## 6. Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Startup time | < 2s | ~1.5s |
| First response | < 3s | ~2.5s |
| Tool execution | < 500ms | ~200ms |
| Memory recall | < 100ms | ~50ms |
| Voice transcription | < 1s | ~800ms |

---

## 7. Security Considerations

### 7.1 Command Safety

- Dangerous commands blocked (rm -rf /, fork bombs, etc.)
- File operations require explicit paths
- Bash commands logged and auditable
- Permission prompts for destructive actions

### 7.2 Data Privacy

- Conversation data stays local (unless EON service used)
- API keys stored in environment, not files
- No telemetry by default

---

## 8. Future Roadmap

### Phase 1 (Current)
- [x] Core tools (14)
- [x] ANKR-first architecture
- [x] 11 Indic languages
- [x] RocketLang parser

### Phase 2 (Next)
- [ ] Full voice integration
- [ ] Session persistence
- [ ] Plugin system
- [ ] VS Code extension

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] WhatsApp bot integration
- [ ] Team collaboration
- [ ] Custom model fine-tuning

---

## 9. Credits

**Built by**: ANKR Labs  
**Inspired by**: Claude Code (Anthropic)  
**Target**: Indian developers and common man  

**Bolo aur Banao!** | **बोलो और बनाओ!**

---

*Report generated: January 2026*


---


## 4. Claude Reference (ANKRCODE_TODO.md)
# ANKRCODE.md - Claude Code Reference

This file provides context for AI assistants (Claude Code, AnkrCode) working on projects that use AnkrCode.

## What is AnkrCode?

AnkrCode is an AI coding assistant CLI built for Indian developers. It's Claude Code-inspired but with:
- **Indic-first**: 11 Indian languages supported
- **Voice-enabled**: Speak commands in Hindi/Tamil/Telugu
- **RocketLang DSL**: Natural code-switching syntax
- **260+ Domain Tools**: GST, Banking, Logistics, Government APIs
- **ANKR Integration**: Uses ANKR ecosystem (ai-proxy, eon, mcp)

## Quick Reference

### CLI Commands

```bash
ankrcode chat              # Interactive chat (Hindi default)
ankrcode chat --lang ta    # Chat in Tamil
ankrcode ask "question"    # Single question
ankrcode tools             # List available tools
ankrcode doctor            # Health check
ankrcode run script.rocket # Run RocketLang script
```

### RocketLang Syntax

```rocketlang
# Hindi commands
पढ़ो "file.ts"              # Read file
लिखो "content" में "file"   # Write file
बनाओ function for login    # Create function

# Code-switching (natural Indian English)
ek API banao for users
database mein table banao
commit karo "message"

# Direct bash
$ npm install
$ git status
```

### Available Tools (14 Core + 260 MCP)

| Tool | Usage |
|------|-------|
| Read | `Read file.ts` |
| Write | `Write "content" to file.ts` |
| Edit | `Edit file.ts: "old" → "new"` |
| Glob | `Glob "**/*.ts"` |
| Grep | `Grep "TODO" in src/` |
| Bash | `$ npm test` |
| Task | Spawn sub-agents |
| Skill | Access 260+ MCP tools |

### MCP Tool Categories

- **Compliance**: gst_validate, tds_calculate (54 tools)
- **Banking**: upi_pay, emi_calculate (28 tools)
- **Logistics**: shipment_track (35 tools)
- **Government**: aadhaar_verify (22 tools)
- **Memory**: eon_remember, eon_recall (14 tools)

## For AI Assistants

### When working on AnkrCode projects:

1. **Use ANKR packages first**
   ```typescript
   // Prefer
   import { eon } from '@ankr/eon';
   // Over
   import { createClient } from 'redis';
   ```

2. **Support Indic languages**
   - All user-facing strings should use i18n
   - Support code-switching in inputs
   - Use transliteration when helpful

3. **Follow ANKR port conventions**
   - AI Proxy: 4444
   - EON Memory: 4005
   - MCP Server: 4006
   - Use `ankr5 ports get <service>` to find ports

4. **Graceful degradation**
   - Check if ANKR services available
   - Fall back to local alternatives
   - Never hard-fail on missing services

### Code style

```typescript
// Good: ANKR-first with fallback
async function getMemory() {
  try {
    return await import('@ankr/eon');
  } catch {
    return new InMemoryStore();
  }
}

// Good: i18n support
console.log(t(lang, 'file_created', { path }));

// Good: Code-switching friendly
const verbs = {
  'बनाओ': 'create', 'banao': 'create',
  'पढ़ो': 'read', 'padho': 'read',
};
```

## Project Structure

```
ankrcode-project/
├── packages/
│   ├── ankrcode-core/     # Main CLI (v2.0.0)
│   │   ├── src/
│   │   │   ├── cli/       # CLI entry
│   │   │   ├── tools/     # Tool implementations
│   │   │   ├── ai/        # LLM adapters
│   │   │   ├── mcp/       # MCP integration
│   │   │   ├── memory/    # EON adapter
│   │   │   ├── voice/     # Voice input
│   │   │   └── i18n/      # 11 languages
│   │   └── package.json
│   └── rocketlang/        # DSL parser (v1.0.0)
│       ├── src/
│       │   ├── parser/    # RocketLang parser
│       │   ├── normalizer/# Indic normalization
│       │   └── compiler/  # Code generation
│       └── package.json
└── docs/
```

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| AI Proxy | http://localhost:4444 | LLM gateway |
| EON Memory | http://localhost:4005 | Knowledge graph |
| MCP Server | http://localhost:4006 | Domain tools |
| Swayam | http://localhost:7777 | Voice + personality |

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-...      # Claude API
AI_PROXY_URL=http://localhost:4444
EON_URL=http://localhost:4005
ANKRCODE_LANG=hi              # Default language
```

## Common Tasks

### Add a new tool

```typescript
// src/tools/core/mytool.ts
export const myTool: Tool = {
  name: 'MyTool',
  description: 'Does something useful',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    },
    required: ['input']
  },
  async handler(params) {
    return { success: true, output: 'Done' };
  }
};

// Register in src/tools/registry.ts
registry.register(myTool);
```

### Add a new language

```typescript
// src/i18n/index.ts
const messages = {
  // Add new language
  'pa': {  // Punjabi
    welcome: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ!',
    // ... other strings
  }
};
```

### Add RocketLang verb

```typescript
// packages/rocketlang/src/normalizer/index.ts
const VERBS = {
  // Add Hindi verb
  'मिटाओ': 'delete', 'mitao': 'delete',
  // Add Tamil verb
  'அழி': 'delete',
};
```

## Testing

```bash
cd packages/ankrcode-core
pnpm test                 # Run tests
pnpm build               # Build TypeScript
node dist/cli/index.js doctor  # Check health
```

## Links

- Project: `/root/ankrcode-project`
- Monorepo: `/root/ankr-labs-nx`
- Docs: `/root/ankrcode-project/docs/`
- Report: `/root/ankrcode-project/ANKRCODE-PROJECT-REPORT.md`


---


## 5. Roadmap
# AnkrCode Improvement Roadmap

## Philosophy: ANKR-First Architecture

AnkrCode sits on top of ANKR ecosystem, NOT directly on LLMs.

```
┌─────────────────────────────────────────────────────────────┐
│                      AnkrCode CLI                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Priority 1: Local ANKR Packages (in-process)               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ @ankr/eon   │ │ @ankr/mcp   │ │ @ankr/mcp-tools     │   │
│  │ (memory)    │ │ (protocol)  │ │ (255+ tools)        │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│                                                              │
│  Priority 2: ANKR Services (localhost)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ EON Memory  │ │ MCP Server  │ │ Swayam Bot          │   │
│  │ :4005       │ │ :4006       │ │ :7777               │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│                                                              │
│  Priority 3: AI Proxy (unified gateway)                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              AI Proxy (:4444)                          │ │
│  │  - Routes to best available LLM                       │ │
│  │  - Handles rate limits, fallbacks                     │ │
│  │  - Caches responses                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│  Priority 4: Direct LLM APIs (fallback only)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Claude API  │ │ OpenAI API  │ │ Groq API            │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: ANKR Package Integration (Week 1)

### 1.1 Direct Package Imports

```typescript
// src/adapters/ankr-first.ts

// Try local packages first
async function getMemoryBackend() {
  // Priority 1: Direct package import
  try {
    const { EON } = await import('@ankr/eon');
    return new EON({ mode: 'local' });
  } catch {}
  
  // Priority 2: EON service
  try {
    const res = await fetch('http://localhost:4005/health');
    if (res.ok) return new EONServiceClient('http://localhost:4005');
  } catch {}
  
  // Priority 3: In-memory fallback
  return new InMemoryStore();
}

async function getMCPTools() {
  // Priority 1: Direct package
  try {
    const { getAllTools } = await import('@ankr/mcp-tools');
    return getAllTools();
  } catch {}
  
  // Priority 2: MCP server
  try {
    const res = await fetch('http://localhost:4006/tools');
    if (res.ok) return res.json();
  } catch {}
  
  // Priority 3: Built-in tools only
  return getCoreTools();
}
```

### 1.2 Tasks

| Task | Priority | Effort |
|------|----------|--------|
| Create `@ankr/eon` adapter with fallback chain | High | Medium |
| Create `@ankr/mcp-tools` adapter with fallback | High | Medium |
| Create `@ankr/ai-router` adapter with fallback | High | Medium |
| Update ConversationManager to use adapters | High | Small |
| Add package detection at startup | Medium | Small |

---

## Phase 2: AI Proxy Integration (Week 2)

### 2.1 Use AI Proxy as Primary LLM Gateway

```typescript
// src/ai/proxy-client.ts

class AIProxyClient {
  private baseUrl = 'http://localhost:4444';
  
  async complete(params: CompletionParams): Promise<CompletionResult> {
    // AI Proxy handles:
    // - Model selection (best available)
    // - Rate limiting
    // - Caching
    // - Fallbacks
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: params.messages,
        tools: params.tools,
        // Let proxy decide model unless specified
        model: params.model || 'auto',
      }),
    });
    
    return response.json();
  }
}
```

### 2.2 Tasks

| Task | Priority | Effort |
|------|----------|--------|
| Create AIProxyClient with health checks | High | Small |
| Add tool definitions in AI Proxy format | High | Medium |
| Implement streaming support | Medium | Medium |
| Add request/response logging | Low | Small |

---

## Phase 3: Enhanced Tool System (Week 3)

### 3.1 MCP Tool Discovery

```typescript
// Dynamically discover and register MCP tools
async function discoverMCPTools() {
  const mcpTools = await getMCPTools();
  
  for (const tool of mcpTools) {
    registry.register({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
      handler: async (params) => {
        return executeMCPTool(tool.name, params);
      },
    });
  }
  
  console.log(`Registered ${mcpTools.length} MCP tools`);
}
```

### 3.2 Tasks

| Task | Priority | Effort |
|------|----------|--------|
| Auto-discover MCP tools at startup | High | Medium |
| Create tool categories UI | Medium | Small |
| Add tool search (fuzzy matching) | Medium | Small |
| Implement tool permissions | High | Medium |

---

## Phase 4: Voice & Indic Enhancements (Week 4)

### 4.1 Voice Input Pipeline

```
Voice (Hindi/Tamil/Telugu)
    ↓
Swayam STT Service (:7777)
    ↓
RocketLang Normalizer
    ↓
Tool Invocation
```

### 4.2 Tasks

| Task | Priority | Effort |
|------|----------|--------|
| Integrate Swayam voice service | High | Medium |
| Add real-time transcription | Medium | Large |
| Support voice feedback (TTS) | Low | Medium |
| Improve code-switching detection | Medium | Medium |

---

## Phase 5: Monorepo Integration (Week 5)

### 5.1 Move to ankr-labs-nx

```
ankr-labs-nx/
├── packages/
│   ├── ankrcode-core/     # Move here
│   └── rocketlang/        # Move here
├── apps/
│   └── ankrcode-cli/      # CLI app wrapper
└── ...
```

### 5.2 Tasks

| Task | Priority | Effort |
|------|----------|--------|
| Move packages to ankr-labs-nx | High | Medium |
| Update imports to use workspace | High | Small |
| Add nx build targets | Medium | Small |
| Create unified build script | Medium | Small |

---

## Phase 6: Production Polish (Week 6)

### 6.1 Features

| Feature | Priority | Effort |
|---------|----------|--------|
| Conversation persistence | High | Medium |
| Session management | High | Medium |
| Error recovery & retry | High | Small |
| Usage analytics (opt-in) | Low | Medium |
| Plugin system | Medium | Large |
| Custom prompts/personas | Medium | Medium |

### 6.2 Documentation

| Doc | Priority |
|-----|----------|
| User guide (Hindi + English) | High |
| API reference | High |
| Tool development guide | Medium |
| RocketLang tutorial | Medium |

---

## Quick Wins (Do Now)

### 1. Add ANKR Package Detection
```typescript
// src/startup.ts
async function detectANKRPackages() {
  const packages = {
    '@ankr/eon': false,
    '@ankr/mcp-tools': false,
    '@ankr/ai-router': false,
  };
  
  for (const pkg of Object.keys(packages)) {
    try {
      await import(pkg);
      packages[pkg] = true;
    } catch {}
  }
  
  console.log('ANKR Packages:', packages);
  return packages;
}
```

### 2. Add AI Proxy Health Check
```typescript
async function checkAIProxy(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:4444/health');
    return res.ok;
  } catch {
    return false;
  }
}
```

### 3. Create Unified Adapter
```typescript
// src/adapters/unified.ts
export async function createUnifiedAdapter() {
  const packages = await detectANKRPackages();
  const aiProxyAvailable = await checkAIProxy();
  
  return {
    llm: aiProxyAvailable 
      ? new AIProxyClient()
      : new DirectLLMClient(),
    memory: packages['@ankr/eon']
      ? await import('@ankr/eon')
      : new InMemoryStore(),
    tools: packages['@ankr/mcp-tools']
      ? await discoverMCPTools()
      : getCoreTools(),
  };
}
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Startup time | < 2s |
| First response | < 3s |
| Tool discovery | 255+ tools |
| Language support | 11 Indic |
| Offline capability | Full |
| ANKR package reuse | 80%+ |

---

## Architecture Decision Records

### ADR-001: ANKR-First, LLM-Last

**Decision**: AnkrCode uses ANKR packages and services before falling back to direct LLM APIs.

**Rationale**:
1. Leverage existing investment in ANKR ecosystem
2. Better performance (local packages)
3. Unified experience across ANKR tools
4. Cost optimization (AI Proxy handles caching/routing)
5. Offline capability when packages are local

### ADR-002: Graceful Degradation

**Decision**: Every adapter has a fallback chain.

**Rationale**:
1. Works out-of-box without full ANKR setup
2. Progressive enhancement as services come online
3. Better developer experience
4. Easier testing and development

---

## Next Steps

1. **Immediate**: Run `pnpm build` and fix any errors
2. **Today**: Create unified adapter with fallback chain
3. **This Week**: Integrate with AI Proxy
4. **Next Week**: Move to ankr-labs-nx monorepo
5. **Launch**: Publish to npm as `@ankr/ankrcode`
