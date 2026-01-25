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
