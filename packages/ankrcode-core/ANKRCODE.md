# AnkrCode

> **AI-Powered CLI Coding Assistant for Bharat**

[![npm version](https://img.shields.io/npm/v/@ankr/ankrcode-core.svg)](https://ankr.in/package/@ankr/ankrcode-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

```
   ___    _   _ _  ______   ____ ___  ____  _____
  / _ \  | \ | | |/ /  _ \ / ___/ _ \|  _ \| ____|
 / /_\ \ |  \| | ' /| |_) | |  | | | | | | |  _|
/ _____ \| |\  | . \|  _ <| |__| |_| | |_| | |___
\_/   \_\_| \_|_|\_\_| \_\\____\___/|____/|_____|

        Bharat-First AI Coding Assistant
```

---

## Overview

**AnkrCode** is an enterprise-grade AI coding assistant built for Indian developers. It combines the power of modern LLMs with deep integration into the ANKR ecosystem, providing:

- **68 AI-powered CLI commands** covering the entire development lifecycle
- **Indic language support** - Hindi, Tamil, Telugu, Bengali, Marathi, and more
- **Voice-enabled** - Works with Swayam voice AI for hands-free coding
- **Offline capable** - Functions without internet using local models
- **MCP integration** - 260+ tools for Indian compliance, banking, logistics

---

## Installation

```bash
# From ANKR Registry
npm install -g @ankr/ankrcode-core --registry https://ankr.in

# From local Verdaccio
npm install -g @ankr/ankrcode-core --registry http://localhost:4873

# Verify installation
ankrcode doctor
```

### Requirements

- Node.js >= 20.0.0
- Optional: @ankr/ai-router, @ankr/eon, @powerpbox/mcp

---

## Quick Start

```bash
# Start interactive chat
ankrcode chat

# Ask a quick question
ankrcode ask "how do I fix this TypeScript error?"

# Review code
ankrcode review src/

# Generate commit message
ankrcode commit

# Check system health
ankrcode doctor
```

---

## ANKR Labs Ecosystem Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ANKR LABS ECOSYSTEM                               │
│                    "सबके लिए AI" - AI for Everyone                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│   │   AnkrCode   │     │    Swayam    │     │     BANI     │              │
│   │  CLI (68cmd) │     │  Voice AI    │     │  WhatsApp AI │              │
│   └──────┬───────┘     └──────┬───────┘     └──────┬───────┘              │
│          │                    │                    │                       │
│          └────────────────────┼────────────────────┘                       │
│                               ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │                    UNIFIED ADAPTER LAYER                         │     │
│   │   Priority: Package → Service → AI Proxy → Direct API           │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                               │                                            │
│       ┌───────────────────────┼───────────────────────┐                   │
│       ▼                       ▼                       ▼                   │
│   ┌────────┐            ┌──────────┐            ┌──────────┐              │
│   │  EON   │            │ AI Proxy │            │   MCP    │              │
│   │ Memory │            │  :4444   │            │  260+    │              │
│   │ :4005  │            │ Gateway  │            │  Tools   │              │
│   └────────┘            └──────────┘            └──────────┘              │
│       │                      │                       │                     │
│       │     ┌────────────────┼────────────────┐     │                     │
│       │     ▼                ▼                ▼     │                     │
│       │ ┌────────┐    ┌──────────┐    ┌────────┐   │                     │
│       │ │Claude  │    │  GPT-4   │    │ Local  │   │                     │
│       │ │Anthropic│   │ OpenAI   │    │ Ollama │   │                     │
│       │ └────────┘    └──────────┘    └────────┘   │                     │
│       │                                             │                     │
│       ▼                                             ▼                     │
│   ┌──────────────────────────────────────────────────────┐               │
│   │                    PostgreSQL + pgvector              │               │
│   │              (Episodic + Semantic Memory)             │               │
│   └──────────────────────────────────────────────────────┘               │
│                                                                           │
│   ┌───────────────────────────────────────────────────────────────────┐  │
│   │                     182 @ankr/* PACKAGES                           │  │
│   ├───────────────────────────────────────────────────────────────────┤  │
│   │ @ankr/eon        │ @ankr/ai-router  │ @ankr/mcp-tools            │  │
│   │ @ankr/iam        │ @ankr/oauth      │ @ankr/compliance-*         │  │
│   │ @ankr/embeddings │ @ankr/voice-ai   │ @ankr/banking-*            │  │
│   │ @ankr/security   │ @ankr/pulse      │ @ankr/gov-*                │  │
│   └───────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│   ┌───────────────────────────────────────────────────────────────────┐  │
│   │                      30+ APPLICATIONS                              │  │
│   ├───────────────────────────────────────────────────────────────────┤  │
│   │ WowTruck (TMS)    │ FreightBox (NVOCC)  │ Fr8X (Exchange)        │  │
│   │ ComplyMitra (GST) │ EverPure (Water)    │ DODD (Documents)       │  │
│   │ Saathi (AI Chat)  │ Driver App (Mobile) │ ERP Bharat             │  │
│   └───────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Fallback Chain

AnkrCode uses an intelligent fallback system:

```
ANKR Fallback Chain:
1. @ankr/* packages (in-memory, 0ms latency)
   ↓ not available?
2. ANKR Services (localhost, ~5ms)
   ↓ not available?
3. AI Proxy (gateway with caching, ~50ms)
   ↓ not available?
4. Direct APIs (Claude/GPT, ~500ms)
   ↓ not available?
5. Offline Mode (local Ollama, works without internet)
```

---

## What Makes ANKR Labs Unique

### 1. India-First Architecture

```
NOT: "Let's localize for India"
BUT: "Built FROM India, FOR India, BY India"
```

| Aspect | Western Tools | ANKR Labs |
|--------|--------------|-----------|
| Language | English-only | 11 Indic languages |
| Compliance | GDPR focus | GST, TDS, ITR, MCA first |
| Banking | Stripe/PayPal | UPI, NEFT, IMPS native |
| Identity | OAuth only | Aadhaar, DigiLocker, PAN |
| Voice | Alexa/Siri | Hindi-first Swayam |

### 2. Vertical Integration

ANKR Labs doesn't just make tools - they build **complete industry solutions**:

**LOGISTICS STACK:**
```
├── WowTruck (TMS) - Fleet management, trip planning
├── FreightBox (NVOCC) - Shipping, container tracking
├── Fr8X (Exchange) - Freight marketplace
├── GPS Server - Real-time vehicle tracking (GT06, Teltonika)
└── Driver App - Mobile app for drivers
```

**COMPLIANCE STACK:**
```
├── ComplyMitra - GST filing, reconciliation
├── @ankr/compliance-gst - GST validation
├── @ankr/compliance-tds - TDS calculations
├── @ankr/compliance-itr - Income tax returns
└── @ankr/gov-* - Government API integrations
```

**ENTERPRISE STACK:**
```
├── ERP Bharat - Full ERP system
├── HRMS - Human resource management
├── CRM - Customer relationship management
└── DMS - Document management
```

### 3. EON Memory System

Unlike ChatGPT which forgets everything, EON remembers:

```typescript
// Memory Types
type MemoryType =
  | 'fact'      // "User prefers dark mode"
  | 'episode'   // "On Jan 15, fixed auth bug in user.ts"
  | 'procedure' // "To deploy: npm run build && pm2 restart"
  | 'knowledge' // "React 19 uses use() hook for data fetching"

// Vector similarity search with pgvector
await eon.recall("how did we fix the auth issue?");
// Returns: Episode from Jan 15 with full context
```

### 4. 260+ India-Specific MCP Tools

```
Compliance (54 tools):
├── gst_validate, gst_file_return, gst_reconcile
├── tds_calculate, tds_file_quarterly
└── itr_generate, itr_file

Banking (28 tools):
├── upi_create_vpa, upi_verify, upi_collect
├── neft_transfer, imps_transfer
└── emi_calculate, loan_eligibility

Government (22 tools):
├── aadhaar_verify, aadhaar_ekyc
├── pan_verify, pan_link_aadhaar
└── digilocker_fetch, digilocker_issue

Logistics (35 tools):
├── shipment_create, shipment_track
├── route_optimize, eta_calculate
└── container_track, bl_generate
```

### 5. The Philosophy

```
"AI shouldn't be a luxury for Silicon Valley.
 A developer in Jaipur deserves the same tools as one in San Francisco.

 ANKR Labs: सबके लिए AI - AI for Everyone"
```

**182 packages. 30+ apps. 260+ MCP tools. 11 Indian languages.**

---

## Commands Reference

### Core Commands (8)

| Command | Description | Example |
|---------|-------------|---------|
| `chat` | Interactive AI chat session | `ankrcode chat` |
| `ask <query>` | Quick one-shot questions | `ankrcode ask "explain this error"` |
| `tools` | List available tools | `ankrcode tools --category ai` |
| `doctor` | Health check & diagnostics | `ankrcode doctor` |
| `plugins` | Manage plugins | `ankrcode plugins --list` |
| `sessions` | List past sessions | `ankrcode sessions` |
| `resume [id]` | Continue previous session | `ankrcode resume abc123` |
| `config` | Manage settings | `ankrcode config --set theme=dark` |

### Code Intelligence (8)

| Command | Description | Example |
|---------|-------------|---------|
| `review` | AI code review | `ankrcode review src/ --strict` |
| `explain` | Explain code | `ankrcode explain complex.ts` |
| `refactor` | AI-assisted refactoring | `ankrcode refactor --pattern singleton` |
| `doc` | Generate documentation | `ankrcode doc src/api/` |
| `test` | Generate/run tests | `ankrcode test --generate` |
| `debug` | AI-analyze errors | `ankrcode debug error.log` |
| `lint` | Lint with AI fixes | `ankrcode lint --ai-fix` |
| `optimize` | Performance optimization | `ankrcode optimize --target perf` |

### Git & Version Control (3)

| Command | Description | Example |
|---------|-------------|---------|
| `commit` | AI-generate commit messages | `ankrcode commit` |
| `pr` | Create/manage PRs | `ankrcode pr --create` |
| `changelog` | Generate changelog | `ankrcode changelog --since v2.0.0` |

### Project Management (5)

| Command | Description | Example |
|---------|-------------|---------|
| `deps` | Dependency management | `ankrcode deps --audit` |
| `security` | Security scanning | `ankrcode security --scan` |
| `upgrade` | Framework upgrades | `ankrcode upgrade --from react@17 --to react@18` |
| `scaffold` | Generate boilerplate | `ankrcode scaffold api users` |
| `api` | API docs & testing | `ankrcode api --docs` |

### DevOps & Infrastructure (8)

| Command | Description | Example |
|---------|-------------|---------|
| `docker` | Docker operations | `ankrcode docker build --optimize` |
| `k8s` | Kubernetes management | `ankrcode k8s deploy --env prod` |
| `ci` | CI/CD pipelines | `ankrcode ci --generate github` |
| `deploy` | Deployment management | `ankrcode deploy --env staging` |
| `monitor` | Application monitoring | `ankrcode monitor --alerts` |
| `log` | Log analysis | `ankrcode log --ai-analyze` |
| `cache` | Cache management | `ankrcode cache status` |
| `queue` | Message queues | `ankrcode queue status` |

### Database & Backend (4)

| Command | Description | Example |
|---------|-------------|---------|
| `db` | Database operations | `ankrcode db --query "SELECT * FROM users"` |
| `migrate` | Database migrations | `ankrcode migrate create add_users` |
| `mock` | Generate mock data | `ankrcode mock --schema api.yaml` |
| `schema` | Schema validation | `ankrcode schema validate data.json` |

### Environment & Secrets (3)

| Command | Description | Example |
|---------|-------------|---------|
| `env` | Environment management | `ankrcode env check` |
| `secret` | Secret management | `ankrcode secret --encrypt` |
| `audit` | Security audits | `ankrcode audit --compliance` |

### Monitoring & Observability (4)

| Command | Description | Example |
|---------|-------------|---------|
| `trace` | Distributed tracing | `ankrcode trace --request-id abc` |
| `metric` | Metrics & dashboards | `ankrcode metric --dashboard` |
| `perf` | Performance profiling | `ankrcode perf profile app.js` |
| `feature` | Feature flags | `ankrcode feature --toggle dark-mode` |

### Automation & Scheduling (4)

| Command | Description | Example |
|---------|-------------|---------|
| `watch` | File watcher | `ankrcode watch "src/**" --command test` |
| `hook` | Git hooks | `ankrcode hook pre-commit` |
| `cron` | Scheduled tasks | `ankrcode cron "0 * * * *" backup` |
| `webhook` | Webhook management | `ankrcode webhook create /deploy` |

### Productivity (12)

| Command | Description | Example |
|---------|-------------|---------|
| `alias` | Custom shortcuts | `ankrcode alias create gs="git status"` |
| `snippet` | Code snippets | `ankrcode snippet save auth-check` |
| `prompt` | AI prompt management | `ankrcode prompt --list` |
| `template` | Project templates | `ankrcode template react-component` |
| `gen` | AI code generation | `ankrcode gen component Button` |
| `history` | Command history | `ankrcode history` |
| `search` | Search codebase | `ankrcode search "TODO"` |
| `backup` | Backup settings | `ankrcode backup --create` |
| `export` | Export sessions | `ankrcode export <session>` |
| `context` | Manage AI context | `ankrcode context --add file.ts` |
| `run` | Run scripts | `ankrcode run build` |
| `completion` | Shell completion | `ankrcode completion bash` |

### System (9)

| Command | Description | Example |
|---------|-------------|---------|
| `init` | Initialize project | `ankrcode init` |
| `stats` | Usage statistics | `ankrcode stats` |
| `diff` | Session diff | `ankrcode diff <session>` |
| `clean` | Clean up data | `ankrcode clean --cache` |
| `info` | System info | `ankrcode info` |
| `update` | Update AnkrCode | `ankrcode update` |
| `bundle` | Bundle analysis | `ankrcode bundle --analyze` |
| `i18n` | Internationalization | `ankrcode i18n extract` |
| `proxy` | Proxy configuration | `ankrcode proxy --set http://...` |

---

## Indic Language Support

AnkrCode supports 11 Indian languages with **real translations**:

| Language | Code | Native | Example |
|----------|------|--------|---------|
| Hindi | `hi` | हिन्दी | `ankrcode ask "यह error कैसे fix करें?"` |
| Tamil | `ta` | தமிழ் | `ankrcode ask "இந்த error-ஐ எப்படி சரி செய்வது?"` |
| Telugu | `te` | తెలుగు | `ankrcode ask "ఈ error ఎలా fix చేయాలి?"` |
| Bengali | `bn` | বাংলা | `ankrcode ask "এই error কিভাবে ঠিক করব?"` |
| Marathi | `mr` | मराठी | `ankrcode ask "हा error कसा fix करायचा?"` |
| Gujarati | `gu` | ગુજરાતી | `ankrcode ask "આ error કેવી રીતે fix કરવી?"` |
| Kannada | `kn` | ಕನ್ನಡ | `ankrcode ask "ಈ error ಅನ್ನು ಹೇಗೆ fix ಮಾಡುವುದು?"` |
| Malayalam | `ml` | മലയാളം | `ankrcode ask "ഈ error എങ്ങനെ fix ചെയ്യും?"` |
| Punjabi | `pa` | ਪੰਜਾਬੀ | `ankrcode ask "ਇਹ error ਕਿਵੇਂ fix ਕਰੀਏ?"` |
| Odia | `or` | ଓଡ଼ିଆ | `ankrcode ask "ଏହି error କିପରି fix କରିବା?"` |
| English | `en` | English | `ankrcode ask "how to fix this error?"` |

### System Prompts in Native Scripts

```
Hindi:
आप स्वयं हैं, एक AI coding assistant।
आप friendly और encouraging हैं।
जब user Hindi में बात करे तो Hindi में जवाब दें।

Tamil:
நீங்கள் ஸ்வயம், ஒரு AI coding assistant.
நீங்கள் நட்பான மற்றும் உற்சாகமளிக்கும்.
```

### Set Language

```bash
# Via flag
ankrcode chat --lang hi

# Via config
ankrcode config --set language=hi

# Via environment
export ANKRCODE_LANG=hi
```

---

## Voice Commands

AnkrCode integrates with Swayam Voice AI:

```bash
# Enable voice mode
ankrcode chat --voice

# Voice commands (Hindi)
> "यह function क्या करता है?"
> "इस code को optimize करो"
> "test cases generate करो"

# Voice commands (English)
> "explain this function"
> "optimize this code"
> "generate test cases"
```

---

## MCP Tools Integration

AnkrCode provides access to 260+ MCP tools:

### Compliance Tools (54)
```bash
ankrcode ask "validate GST number 27AAPFU0939F1ZV"
# → Uses: gst_validate

ankrcode ask "calculate TDS for 50000 salary"
# → Uses: tds_calculate

ankrcode ask "file ITR for FY 2024-25"
# → Uses: itr_file
```

### Banking Tools (28)
```bash
ankrcode ask "verify UPI ID sharma@upi"
# → Uses: upi_verify

ankrcode ask "calculate EMI for 10L loan at 8.5% for 20 years"
# → Uses: emi_calculate
```

### Logistics Tools (35)
```bash
ankrcode ask "track shipment MAEU1234567"
# → Uses: shipment_track

ankrcode ask "optimize route Delhi to Mumbai"
# → Uses: route_optimize
```

### Government Tools (22)
```bash
ankrcode ask "verify Aadhaar 1234-5678-9012"
# → Uses: aadhaar_verify

ankrcode ask "fetch documents from DigiLocker"
# → Uses: digilocker_fetch
```

---

## Configuration

### Global Settings

```bash
# Set AI provider
ankrcode config --set provider=anthropic

# Set language
ankrcode config --set language=hi

# Set theme
ankrcode config --set theme=dark

# View all settings
ankrcode config --list
```

### Project Settings

Create `.ankrcode.json` in your project root:

```json
{
  "language": "hi",
  "provider": "ai-proxy",
  "context": {
    "include": ["src/**/*.ts", "docs/**/*.md"],
    "exclude": ["node_modules", "dist"]
  },
  "hooks": {
    "pre-commit": "ankrcode lint --ai-fix"
  }
}
```

### Environment Variables

```bash
export ANKR_AI_PROXY_URL=http://localhost:4444
export ANKR_EON_URL=http://localhost:4005
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
```

---

## Workflows

### Feature Development

```bash
# 1. Start with AI chat to plan
ankrcode chat
> "I need to add user authentication"

# 2. Scaffold the feature
ankrcode scaffold api auth

# 3. Implement with AI assistance
ankrcode gen middleware auth-check

# 4. Review code
ankrcode review src/auth/

# 5. Generate tests
ankrcode test --generate src/auth/

# 6. Security scan
ankrcode security --scan src/auth/

# 7. Commit
ankrcode commit

# 8. Create PR
ankrcode pr --create
```

### Bug Fixing

```bash
# 1. Analyze error logs
ankrcode log --ai-analyze --since 1h

# 2. Debug specific error
ankrcode debug "TypeError: Cannot read property 'x' of undefined"

# 3. Find related code
ankrcode search "propertyX"

# 4. Fix and review
ankrcode review --diff

# 5. Commit fix
ankrcode commit --type fix
```

---

## Plugin System

### Built-in Plugins

```bash
# Git plugin
ankrcode plugins enable git

# Docker plugin
ankrcode plugins enable docker
```

### Custom Plugins

Create `~/.ankrcode/plugins/my-plugin.js`:

```javascript
export default {
  name: 'my-plugin',
  version: '1.0.0',
  commands: [
    {
      name: 'my-command',
      description: 'My custom command',
      action: async (args, context) => {
        // Implementation
      }
    }
  ],
  hooks: {
    'pre-commit': async (context) => {
      // Pre-commit hook
    }
  }
};
```

---

## API Usage

AnkrCode can be used programmatically:

```typescript
import {
  createUnifiedAdapter,
  ConversationManager,
  executeTool
} from '@ankr/ankrcode-core';

// Create adapters
const adapters = await createUnifiedAdapter();

// Use LLM
const response = await adapters.llm.complete(
  'You are a helpful assistant',
  [{ role: 'user', content: 'Hello!' }]
);

// Use memory
await adapters.memory.remember('user-preference', { theme: 'dark' });
const memories = await adapters.memory.recall('preferences');

// Execute tool
const result = await executeTool('Bash', { command: 'ls -la' });
```

---

## Roadmap

### Immediate (v2.39-2.40)

| Feature | Description |
|---------|-------------|
| `workflow` | Custom workflow automation - `ankrcode workflow create "deploy-prod"` |
| `agent` | Autonomous AI agents - `ankrcode agent spawn researcher` |

### Short-term (v3.0)

**RocketLang DSL Compiler**
```
// Write in Hindi + code mix
file_path = "src/api.ts"
padho file_path se code     // Read from file
dhundo usme "TODO"          // Search for TODO
agar mila toh batao         // If found, show
```

**Multi-Agent Collaboration**
```
├── Architect Agent - System design
├── Coder Agent - Implementation
├── Reviewer Agent - Code review
└── Tester Agent - Test generation
```

**IDE Extensions**
- VS Code extension
- JetBrains plugin
- Cursor integration

### Long-term Vision

**ANKR Saathi** - AI companion for every Indian developer:
- Voice-first coding (speak in Hindi, code in any language)
- Learns your patterns across all projects
- Understands Indian business context (GST, compliance)
- Works offline in areas with poor connectivity
- Costs fraction of western alternatives

---

## Troubleshooting

### Common Issues

**"Module not found: @ankr/ai-router"**
```bash
npm install @ankr/ai-router @ankr/eon --registry https://ankr.in
```

**"AI Proxy not responding"**
```bash
ankrcode doctor
pm2 start ai-proxy
```

**"EON Memory unavailable"**
```bash
# Falls back to in-memory storage
pm2 start eon-memory
```

### Debug Mode

```bash
DEBUG=ankrcode:* ankrcode chat
ankrcode doctor --verbose
```

---

## Contributing

```bash
git clone https://github.com/ankr-labs/ankrcode.git
cd ankrcode
pnpm install
pnpm build
pnpm test
npm link
```

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

- **Documentation**: https://ankr.in/project/documents/
- **Issues**: https://github.com/ankr-labs/ankrcode/issues

---

<p align="center">
  <b>Built with pride in Bharat</b><br>
  <sub>सबके लिए AI - AI for Everyone</sub><br>
  <sub>ANKR Labs &copy; 2024-2026</sub>
</p>
