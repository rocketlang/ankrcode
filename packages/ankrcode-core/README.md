# @ankr/ankrcode-core

AI Coding Assistant for Bharat - Bolo aur Banao!

AnkrCode is a Claude Code-inspired AI coding assistant designed for Indian developers with:
- **Multi-language support**: Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, Gujarati, Malayalam, Punjabi, Odia
- **Voice input**: BHASHINI, Whisper, Google Speech, Azure
- **Multi-LLM**: Claude, GPT, Gemini, Groq, DeepSeek via AI Proxy
- **262+ MCP tools**: Compliance, ERP, CRM, Banking, Government APIs
- **Memory/Knowledge**: EON context engine with vector search
- **Offline mode**: Ollama, LM Studio, llamafile support
- **RocketLang**: Indic-first DSL for code commands

## Installation

```bash
npm install -g @ankr/ankrcode-core
# or
pnpm add -g @ankr/ankrcode-core
```

## Usage

```bash
# Start interactive chat
ankrcode

# Ask a single question
ankrcode ask "How do I create a REST API in Express?"

# Use Hindi
ankrcode -l hi ask "Express mein REST API kaise banayein?"

# Check system health
ankrcode doctor

# List available tools
ankrcode tools
```

## Configuration

Set environment variables:

```bash
# Required: At least one LLM provider
export ANTHROPIC_API_KEY=your-key
export OPENAI_API_KEY=your-key
export GROQ_API_KEY=your-key

# Optional: Voice input
export BHASHINI_API_KEY=your-key
export WHISPER_API_URL=http://localhost:9000

# Optional: Memory backend
export EON_SERVICE_URL=http://localhost:4005
export DATABASE_URL=postgresql://user:pass@localhost/ankr_eon
```

## Features

### Multi-language Support
```bash
# Hindi
ankrcode -l hi

# Tamil
ankrcode -l ta

# Telugu
ankrcode -l te
```

### Voice Input
```bash
# Enable voice mode
ankrcode --voice
```

### Offline Mode
```bash
# Use local Ollama model
ankrcode --offline
```

### MCP Tools
Access 262+ tools for Indian business operations:
- GST validation
- Invoice generation
- Shipment tracking
- Bank account verification
- And more...

## Architecture

```
@ankr/ankrcode-core
├── ai/          # LLM adapters (AI Proxy, Anthropic, OpenAI)
├── memory/      # EON, PostMemory adapters
├── mcp/         # 262+ MCP tool integration
├── voice/       # BHASHINI, Whisper, Google, Azure STT
├── tools/       # Core tools (Read, Write, Bash, etc.)
├── conversation/# Chat management
├── i18n/        # 11 Indic language translations
└── cli/         # Command-line interface
```

## Related Packages

- `@ankr/rocketlang` - Indic-first DSL for code commands
- `@ankr/eon` - Context and memory engine
- `@ankr/ai-router` - Multi-LLM routing
- `@powerpbox/mcp` - MCP tool registry

## License

MIT
