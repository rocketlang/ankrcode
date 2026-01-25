# AnkrCode

**AI Coding Assistant for Bharat - Bolo aur Banao!**

AnkrCode is a Claude Code-inspired CLI tool built for Indian developers, with:
- **Indic-first**: Support for 11 Indian languages (Hindi, Tamil, Telugu, etc.)
- **Voice-enabled**: Speak your commands in your language
- **RocketLang DSL**: Natural code-switching friendly syntax
- **260+ Domain Tools**: GST, TDS, Banking, Logistics, Government APIs
- **Swayam Personality**: Friendly, encouraging assistant

## Installation

```bash
# From npm (when published)
npm install -g @ankr/ankrcode-core

# From source
cd packages/ankrcode-core
pnpm install
pnpm build
npm link
```

## Usage

### Interactive Chat

```bash
# Start chat in Hindi
ankrcode chat --lang hi

# Start with Swayam personality
ankrcode chat --personality swayam
```

### Quick Questions

```bash
# Ask in English
ankrcode ask "How do I create a REST API?"

# Ask in Hindi
ankrcode ask "मुझे REST API कैसे बनानी है?"
```

### RocketLang Scripts

```bash
# Run a .rocket script
ankrcode run script.rocket
```

### Direct Tool Execution

```bash
# Execute a tool directly
ankrcode exec Read --params '{"file_path": "/path/to/file.ts"}'
```

## RocketLang Examples

RocketLang understands natural Indic language and code-switching:

```rocketlang
# Hindi commands
पढ़ो src/index.ts
लिखो "hello" में test.txt

# Code-switching (Hindi + English mix)
ek function banao jo array ko reverse kare
API banao users ke liye

# English
read src/index.ts
create function that validates email
commit "fixed bug in auth"

# Direct bash
$ npm test
$ git status
```

## Available Tools

### Core Tools (14)
- **Read**: Read file contents
- **Write**: Write to file
- **Edit**: String replacement edits
- **Glob**: File pattern matching
- **Grep**: Content search (ripgrep)
- **Bash**: Execute commands
- **Task**: Spawn sub-agents
- **WebFetch**: Fetch web content
- **WebSearch**: Search the web
- **TodoWrite**: Task tracking
- **AskUserQuestion**: Interactive prompts
- **EnterPlanMode**: Start planning
- **ExitPlanMode**: Finish planning
- **Skill**: Execute skills/MCP tools

### Domain Tools (260+)
- **Compliance**: GST, TDS, ITR, MCA (54 tools)
- **ERP**: Invoice, Inventory, Sales (44 tools)
- **CRM**: Lead, Contact, Activity (30 tools)
- **Banking**: UPI, BBPS, Loans (28 tools)
- **Government**: Aadhaar, DigiLocker (22 tools)
- **Logistics**: Shipment, GPS, Routes (35 tools)
- **Memory**: EON knowledge graph (14 tools)

## Architecture

```
AnkrCode
├── @ankr/ankrcode-core     # Main CLI package
│   ├── cli/                # CLI entry point
│   ├── tools/              # Tool implementations
│   ├── conversation/       # Conversation manager
│   └── i18n/               # Translations
├── @ankr/rocketlang        # DSL package
│   ├── parser/             # RocketLang parser
│   ├── normalizer/         # Indic text normalization
│   └── codegen/            # Code generation
└── docs/
    ├── architecture.md     # System design
    └── tools-spec.md       # Tool specifications
```

## Configuration

Create `~/.ankrcode/config.json`:

```json
{
  "language": "hi",
  "model": "claude",
  "personality": "swayam",
  "offline": false
}
```

Environment variables:
- `ANTHROPIC_API_KEY`: Claude API key
- `OPENAI_API_KEY`: OpenAI API key
- `GROQ_API_KEY`: Groq API key (free tier)

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run CLI in dev mode
pnpm dev

# Run tests
pnpm test
```

## Roadmap

- [x] Core tool system (14 tools)
- [x] RocketLang parser (basic)
- [x] CLI with REPL
- [ ] Integration with @ankr/ai-router
- [ ] Integration with @ankr/eon (memory)
- [ ] Integration with @ankr/mcp (260+ tools)
- [ ] Voice input (Indic STT)
- [ ] Full i18n (11 languages)
- [ ] Offline mode (local models)

## License

MIT

## Credits

Built by ANKR Labs, inspired by Claude Code.

**Bolo aur Banao!** | **बोलो और बनाओ!**
