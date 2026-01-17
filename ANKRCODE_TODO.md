# AnkrCode TODO & Implementation Tracker

> **Last Updated**: 2026-01-16
> **Version**: 2.38.0

## Quick Links

- [Implementation Status](#implementation-status)
- [Priority Tasks](#priority-tasks)
- [Claude Reference](#claude-reference)

---

## Implementation Status

### Core Components

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| CLI Entry | ✅ Done | `src/cli/index.ts` | Commander.js |
| Tool Registry | ✅ Done | `src/tools/registry.ts` | Dynamic registration |
| Tool Executor | ✅ Done | `src/tools/executor.ts` | Async execution |
| Conversation Manager | ✅ Done | `src/conversation/manager.ts` | Message handling |
| i18n (11 languages) | ✅ Done | `src/i18n/index.ts` | Hindi, Tamil, Telugu, etc. |

### Tool Implementation

| Tool | Status | Location | Claude Code Parity |
|------|--------|----------|-------------------|
| Read | ✅ Done | `src/tools/core/file.ts` | 100% |
| Write | ✅ Done | `src/tools/core/file.ts` | 100% |
| Edit | ✅ Done | `src/tools/core/file.ts` | 100% |
| Glob | ✅ Done | `src/tools/core/search.ts` | 100% |
| Grep | ✅ Done | `src/tools/core/search.ts` | 100% |
| Bash | ✅ Done | `src/tools/core/bash.ts` | 90% |
| Task | ✅ Done | `src/tools/core/task.ts` | 80% |
| TodoWrite | ✅ Done | `src/tools/core/interactive.ts` | 100% |
| AskUserQuestion | ✅ Done | `src/tools/core/interactive.ts` | 100% |
| WebFetch | ✅ Done | `src/tools/core/web.ts` | 100% |
| WebSearch | ✅ Done | `src/tools/core/web.ts` | 100% |
| EnterPlanMode | ✅ Done | `src/tools/core/plan.ts` | 100% |
| ExitPlanMode | ✅ Done | `src/tools/core/plan.ts` | 100% |
| Skill | ⚠️ Basic | `src/tools/core/skill.ts` | 70% |
| NotebookEdit | ✅ Done | `src/tools/core/notebook.ts` | 100% |
| NotebookRead | ✅ Done | `src/tools/core/notebook.ts` | 100% |

### Adapters

| Adapter | Status | Location | Fallback Chain |
|---------|--------|----------|----------------|
| AI Router | ✅ Done | `src/ai/router-adapter.ts` | AI Proxy → Direct API |
| Offline Mode | ✅ Done | `src/ai/offline-adapter.ts` | Local-only |
| EON Memory | ⚠️ Basic | `src/memory/eon-adapter.ts` | Package → Service → InMemory |
| MCP Tools | ⚠️ Basic | `src/mcp/adapter.ts` | Package → Server → Core |
| Voice/Swayam | ✅ Done | `src/voice/adapter.ts` | Swayam → Whisper → Google/Azure |
| **Unified Adapter** | ✅ Done | `src/adapters/unified.ts` | Full ANKR-first fallback |
| **Startup Diagnostics** | ✅ Done | `src/startup/diagnostics.ts` | Health checks |
| **MCP Discovery** | ✅ Done | `src/mcp/discovery.ts` | Auto-discover tools |

### RocketLang DSL

| Feature | Status | Location |
|---------|--------|----------|
| PEG Parser | ✅ Done | `packages/rocketlang/src/parser/` |
| Hindi Verbs | ✅ Done | Normalizer |
| Code-switching | ✅ Done | Normalizer |
| Tamil/Telugu | ⚠️ Basic | Partial support |
| Compiler | ❌ TODO | Generate tool calls |

---

## Priority Tasks

### ✅ P0: Critical (COMPLETED)

#### 1. Unified Adapter with Full Fallback Chain ✅
**File**: `src/adapters/unified.ts`

```typescript
// ANKR-first architecture implemented
import { createUnifiedAdapter } from './adapters/unified';

const adapters = await createUnifiedAdapter();
// → Uses: packages → services → proxy → direct APIs
```

**Completed**:
- [x] Create `src/adapters/unified.ts`
- [x] Implement package detection at startup
- [x] Add health checks for all services
- [x] Create graceful degradation logic
- [x] Export from main index.ts

#### 2. Startup Diagnostics ✅
**File**: `src/startup/diagnostics.ts`

```bash
$ ankrcode doctor
╭─────────────────────────────────────────╮
│        AnkrCode Health Check            │
├─────────────────────────────────────────┤
│ ANKR Packages:                          │
│   ✅ @ankr/eon (2.0.0)                  │
│   ...                                   │
│ Mode: ANKR-First + AI Proxy             │
╰─────────────────────────────────────────╯
```

**Completed**:
- [x] Create diagnostics module
- [x] Add `ankrcode doctor` command
- [x] Display package versions
- [x] Check service health with latency
- [x] Recommend fixes for issues

#### 3. MCP Tool Auto-Discovery ✅
**File**: `src/mcp/discovery.ts`

```typescript
import { discoverMCPTools } from './mcp/discovery';

const result = await discoverMCPTools();
// → { tools: [...], categories: [...], source: 'package', duration: 42 }
```

**Completed**:
- [x] Scan @ankr/mcp-tools for available tools
- [x] Create tool wrappers with proper schemas
- [x] Implement lazy loading for performance
- [x] Add tool categories (Compliance, Banking, etc.)
- [x] Cache tool definitions

### ✅ P1: Important (COMPLETED)

#### 4. NotebookEdit Tool ✅
**File**: `src/tools/core/notebook.ts`

Jupyter notebook editing support:
- [x] Parse .ipynb JSON structure
- [x] Edit cell contents (replace mode)
- [x] Insert/delete cells
- [x] Handle cell outputs
- [x] NotebookRead companion tool

#### 5. Enhanced WebSearch ✅
**File**: `src/tools/core/web.ts`

- [x] Multi-provider support (Tavily, Brave, SearXNG)
- [x] Add domain filtering (allowed/blocked)
- [x] Improve result formatting with Sources
- [x] Add 5-minute caching
- [x] Auto-fallback between providers

#### 6. Voice Pipeline v2 ✅
**File**: `src/voice/adapter.ts`

- [x] Real-time streaming (processAudioChunk)
- [x] Voice Activity Detection (VAD)
- [x] Automatic language detection (11 Indic scripts)
- [x] Long audio chunking (transcribeLong)
- [x] Event emitter (speech_start, speech_end, silence)

### ✅ P2: Nice to Have (COMPLETED)

#### 7. Plugin System ✅
**Files**: `src/plugins/`

- [x] Plugin interface definition (`types.ts`)
- [x] Plugin loader with discovery (`loader.ts`)
- [x] Built-in plugins: Git, Docker
- [x] CLI command: `ankrcode plugins`
- [x] Lifecycle hooks (onLoad, beforeToolExecute, etc.)

#### 8. Conversation Persistence ✅
**File**: `src/conversation/manager.ts`

- [x] Save conversations to EON Memory
- [x] Load/resume sessions by ID
- [x] List saved conversations
- [x] Export/import to JSON
- [x] Session statistics

### 🟢 P3: Future (Backlog)

#### 9. Monorepo Integration
- [ ] Move packages to `ankr-labs-nx/packages/`
- [ ] Configure Nx build targets
- [ ] Set up workspace dependencies

#### 10. RocketLang Compiler
- [ ] Parse RocketLang to AST
- [ ] Generate tool calls from AST
- [ ] Full Tamil/Telugu support

---

## Claude Reference

### What is AnkrCode?

AnkrCode is an AI coding assistant CLI built for Indian developers with:
- **Indic-first**: 11 Indian languages (Hindi, Tamil, Telugu, Kannada, etc.)
- **Voice-enabled**: Speak commands naturally
- **RocketLang DSL**: Mix Hindi/English naturally
- **260+ Domain Tools**: GST, Banking, Logistics, Government
- **ANKR Integration**: Leverages ANKR ecosystem

### CLI Commands

```bash
# Chat
ankrcode chat              # Interactive chat (auto-save enabled)
ankrcode chat --lang ta    # Tamil mode
ankrcode ask "question"    # Single question

# Sessions (NEW in v2.4)
ankrcode sessions          # List saved sessions
ankrcode sessions -s <id>  # Show session stats
ankrcode sessions -e <id>  # Export to JSON
ankrcode resume            # Resume a session (interactive)
ankrcode resume <id>       # Resume specific session

# Configuration (NEW in v2.5)
ankrcode config            # View all settings
ankrcode config --get key  # Get a setting value
ankrcode config --set key=value  # Set project setting
ankrcode config --global --set key=value  # Set global setting
ankrcode config --init     # Initialize project config
ankrcode config --reset    # Reset to defaults

# Tools & Plugins
ankrcode tools             # List tools
ankrcode tools --category compliance  # Filter by category
ankrcode plugins           # List plugins
ankrcode plugins --enable-builtin  # Enable git, docker plugins

# RocketLang (NEW in v2.6)
ankrcode run script.rocket           # Execute RocketLang script
ankrcode run script.rocket --dry-run # Show tool calls without executing
ankrcode run script.rocket -c js     # Compile to JavaScript
ankrcode run script.rocket -c sh     # Compile to Shell script

# History (NEW in v2.6)
ankrcode history           # Show command history
ankrcode history -s        # Show session history
ankrcode history -n 20     # Show last 20 entries
ankrcode history --clear   # Clear history

# Search (NEW in v2.7)
ankrcode search "pattern"       # Search code in current directory
ankrcode search "TODO" -t ts    # Search only TypeScript files
ankrcode search "error" -i      # Case insensitive search
ankrcode search "func" -f       # Show only file names
ankrcode search "class" -c      # Show only counts

# Shell Completions (NEW in v2.7)
ankrcode completion bash   # Generate bash completion
ankrcode completion zsh    # Generate zsh completion
ankrcode completion fish   # Generate fish completion

# Project Init (NEW in v2.8)
ankrcode init              # Initialize in current directory
ankrcode init my-project   # Create and init new directory
ankrcode init -t python    # Use Python template
ankrcode init -t go        # Use Go template
ankrcode init --no-rules   # Skip ANKRCODE.md

# Usage Stats (NEW in v2.8)
ankrcode stats             # Show project statistics
ankrcode stats -g          # Show global statistics
ankrcode stats --reset     # Reset statistics

# Export (NEW in v2.9)
ankrcode export <sessionId>       # Export to Markdown
ankrcode export <id> -f html      # Export to HTML
ankrcode export <id> -f json      # Export to JSON
ankrcode export <id> --include-tool-calls  # Include tool details

# Diff (NEW in v2.9)
ankrcode diff              # Show changes in most recent session
ankrcode diff <sessionId>  # Show changes in specific session
ankrcode diff --stat       # Show only statistics
ankrcode diff --files      # List only changed files

# Maintenance (v2.10+)
ankrcode clean             # Clean sessions and cache
ankrcode clean --sessions  # Clean only sessions
ankrcode clean --cache     # Clean only cache
ankrcode clean --all       # Clean everything
ankrcode clean --dry-run   # Preview what would be deleted
ankrcode info              # Show detailed system info

# Updates (NEW in v2.11)
ankrcode update            # Check and install updates
ankrcode update --check    # Check only, don't install
ankrcode update --force    # Force reinstall

# Memory (v2.11+)
ankrcode context           # List stored memories
ankrcode context --list    # List memories
ankrcode context --search "query"  # Search memories
ankrcode context --add "note"      # Add a memory
ankrcode context --remove <id>     # Remove a memory
ankrcode context --clear   # Clear all memories
ankrcode context --export  # Export to JSON

# Aliases (NEW in v2.12)
ankrcode alias             # List all aliases
ankrcode alias --add "name=command"  # Create alias
ankrcode alias --remove <name>       # Remove alias
ankrcode alias --exec <name>         # Execute alias

# Snippets (v2.12+)
ankrcode snippet           # List all snippets
ankrcode snippet --save <name>       # Save snippet from stdin
ankrcode snippet --get <name>        # Get snippet content
ankrcode snippet --remove <name>     # Remove snippet
ankrcode snippet --edit <name>       # Edit description/tags
ankrcode snippet --tag "api,utils"   # Filter by tags
ankrcode snippet --import file.json  # Import snippets
ankrcode snippet --export            # Export all snippets

# Prompts (NEW in v2.13)
ankrcode prompt            # List saved prompts
ankrcode prompt --save <name>        # Save a new prompt
ankrcode prompt --use <name>         # Use a prompt (fills variables)
ankrcode prompt --remove <name>      # Remove prompt
ankrcode prompt --edit <name>        # Edit description/category
ankrcode prompt --category <cat>     # Filter by category
ankrcode prompt --import file.json   # Import prompts
ankrcode prompt --export             # Export all prompts

# Logs (NEW in v2.13)
ankrcode log               # View recent activity
ankrcode log -n 50         # Show last 50 entries
ankrcode log -t tool       # Filter by type (tool, chat, error)
ankrcode log -d today      # Filter by date
ankrcode log -s "search"   # Search in logs
ankrcode log --tail        # Follow logs in real-time
ankrcode log --clear       # Clear all logs
ankrcode log --export      # Export logs to JSON

# Backup (NEW in v2.14)
ankrcode backup            # List available backups
ankrcode backup -c         # Create backup with timestamp
ankrcode backup -c mybackup  # Create named backup
ankrcode backup -c --compress  # Create compressed backup
ankrcode backup -r <file>  # Restore from backup
ankrcode backup -d <name>  # Delete a backup
ankrcode backup --include settings,snippets  # Selective backup

# Environment (NEW in v2.14)
ankrcode env               # List current environment
ankrcode env -l            # List current environment
ankrcode env -s "KEY=value"  # Set environment variable
ankrcode env -u KEY        # Unset environment variable
ankrcode env -p dev        # Switch to 'dev' profile
ankrcode env --create-profile staging  # Create new profile
ankrcode env --delete-profile staging  # Delete profile
ankrcode env --list-profiles  # List all profiles
ankrcode env --export      # Export to .env file

# Watch (NEW in v2.15)
ankrcode watch             # Watch all files
ankrcode watch "src/**/*.ts"  # Watch TypeScript files
ankrcode watch -c "npm test"  # Run tests on changes
ankrcode watch -c "npm run build" --initial  # Run immediately
ankrcode watch --debounce 500  # Set debounce to 500ms
ankrcode watch -i "test/**,*.spec.ts"  # Ignore patterns
ankrcode watch -v          # Verbose mode (show changed files)
ankrcode watch --clear     # Clear screen before command

# Hooks (NEW in v2.15)
ankrcode hook              # List all hooks
ankrcode hook --events     # Show available events
ankrcode hook --add "startup:echo Starting"  # Add hook
ankrcode hook --remove <id>  # Remove hook
ankrcode hook --enable <id>  # Enable hook
ankrcode hook --disable <id>  # Disable hook
ankrcode hook --test startup  # Test hooks for event
ankrcode hook --clear      # Clear all hooks

# Templates (NEW in v2.16)
ankrcode template          # List all templates
ankrcode template --list   # List all templates
ankrcode template --category function  # Filter by category
ankrcode template --use "React Component" --output MyComponent.tsx --vars '{"componentName":"MyComponent"}'
ankrcode template --create "My Template"  # Create custom template
ankrcode template --delete "My Template"  # Delete custom template
ankrcode template --export "React Component"  # Export to file
ankrcode template --import template.json  # Import from file

# Code Generation (NEW in v2.16)
ankrcode gen "validate email address"  # Generate code
ankrcode gen "fetch user data" -l ts   # Generate TypeScript
ankrcode gen "REST API endpoint" -t api -f express  # Express API
ankrcode gen "user form" -t component -f react  # React component
ankrcode gen "parse JSON" -l py        # Generate Python
ankrcode gen "calculate sum" -o sum.ts # Save to file
ankrcode gen "sort array" --dry-run    # Preview only
ankrcode gen "auth middleware" --explain  # With comments
ankrcode gen "data processor" -i       # Interactive refinement

# Code Review (NEW in v2.17)
ankrcode review            # Review staged git changes
ankrcode review file.ts    # Review specific file
ankrcode review -d         # Review git diff (staged)
ankrcode review -c abc123  # Review specific commit
ankrcode review -f security,bugs  # Focus on specific areas
ankrcode review -s warning # Minimum severity (info/warning/error)
ankrcode review --fix      # Include fix suggestions
ankrcode review --json     # Output as JSON
ankrcode review -o report.md  # Save to file

# Code Explanation (NEW in v2.17)
ankrcode explain file.ts   # Explain entire file
ankrcode explain file.ts -l 10-50  # Explain lines 10-50
ankrcode explain file.ts -f myFunction  # Explain function
ankrcode explain file.ts -c MyClass  # Explain class
ankrcode explain file.ts --lang hi  # Explain in Hindi
ankrcode explain file.ts --lang ta  # Explain in Tamil
ankrcode explain file.ts -d brief   # Brief explanation
ankrcode explain file.ts -d detailed  # Detailed explanation
ankrcode explain file.ts --diagram  # Include ASCII diagrams
ankrcode explain file.ts -o explanation.md  # Save to file

# Refactoring (NEW in v2.18)
ankrcode refactor file.ts  # AI-powered refactoring suggestions
ankrcode refactor file.ts -t rename -n newName  # Rename refactoring
ankrcode refactor file.ts -t extract  # Extract function/method
ankrcode refactor file.ts -t inline   # Inline variable/function
ankrcode refactor file.ts -t simplify # Simplify complex code
ankrcode refactor file.ts -t modernize  # Update to modern syntax
ankrcode refactor file.ts -l 10-50   # Refactor specific lines
ankrcode refactor file.ts -f myFunc  # Refactor specific function
ankrcode refactor file.ts --preview  # Preview without applying
ankrcode refactor file.ts --backup   # Create backup before changes
ankrcode refactor file.ts -i         # Interactive confirmation mode

# Documentation (NEW in v2.18)
ankrcode doc file.ts       # Generate documentation
ankrcode doc src/**/*.ts   # Document multiple files
ankrcode doc -t api        # Generate API documentation
ankrcode doc -t readme     # Generate README
ankrcode doc -t jsdoc      # Generate JSDoc comments
ankrcode doc -t inline     # Add inline documentation
ankrcode doc -f md         # Output as Markdown (default)
ankrcode doc -f html       # Output as HTML
ankrcode doc -f json       # Output as JSON
ankrcode doc -o docs/      # Output to directory
ankrcode doc --include-private  # Include private members
ankrcode doc --include-examples  # Generate usage examples
ankrcode doc --toc         # Include table of contents
ankrcode doc -g "src/**/*.ts"  # Use glob pattern

# Testing (NEW in v2.19)
ankrcode test              # Run tests (auto-detect framework)
ankrcode test -r           # Run existing tests
ankrcode test -g src/utils.ts  # Generate tests for file
ankrcode test src/**/*.ts -g   # Generate tests for multiple files
ankrcode test -f jest      # Use specific framework
ankrcode test -f vitest    # Use Vitest
ankrcode test -t unit      # Generate unit tests
ankrcode test -t integration  # Generate integration tests
ankrcode test -t e2e       # Generate e2e tests
ankrcode test -c           # Run with coverage
ankrcode test --watch      # Watch mode
ankrcode test -u           # Update snapshots
ankrcode test -o tests/    # Output to directory
ankrcode test --min-coverage 90  # Set coverage threshold
ankrcode test -i           # Interactive mode

# Debugging (NEW in v2.19)
ankrcode debug file.ts     # Analyze file for issues
ankrcode debug -e "TypeError: undefined"  # Analyze error message
ankrcode debug -s "at line 42..."  # Analyze stack trace
ankrcode debug -l app.log  # Analyze log file
ankrcode debug file.ts --breakpoints  # Suggest breakpoints
ankrcode debug file.ts --variables    # Analyze variable states
ankrcode debug file.ts --flow         # Trace execution flow
ankrcode debug file.ts --memory       # Detect memory issues
ankrcode debug file.ts --performance  # Find bottlenecks
ankrcode debug file.ts -f  # Auto-fix issues
ankrcode debug file.ts -w  # Watch mode
ankrcode debug file.ts -i  # Interactive fixing

# Linting (NEW in v2.20)
ankrcode lint              # Lint all source files
ankrcode lint src/**/*.ts  # Lint specific files
ankrcode lint -g "**/*.js" # Lint with glob pattern
ankrcode lint -r security,perf  # Check specific rules
ankrcode lint -s error     # Only show errors
ankrcode lint -s info      # Show all severities
ankrcode lint --fix        # Auto-fix fixable issues
ankrcode lint --fix-dry-run  # Show fixes without applying
ankrcode lint -f json      # Output as JSON
ankrcode lint -f sarif     # Output as SARIF (for CI)
ankrcode lint -o report.json  # Save to file
ankrcode lint --ignore "test,spec"  # Ignore patterns
ankrcode lint --config .lintrc  # Use custom config
ankrcode lint -q           # Quiet mode (errors only)
ankrcode lint --max-warnings 10  # Fail if >10 warnings

# Optimization (NEW in v2.20)
ankrcode optimize file.ts  # Optimize for performance
ankrcode optimize file.ts -t perf  # Performance optimization
ankrcode optimize file.ts -t memory  # Memory optimization
ankrcode optimize file.ts -t size  # Code size optimization
ankrcode optimize file.ts -t readability  # Improve readability
ankrcode optimize file.ts -t perf,memory  # Multiple types
ankrcode optimize file.ts -l 10-50  # Optimize line range
ankrcode optimize file.ts -f myFunc  # Optimize function
ankrcode optimize file.ts --aggressive  # Aggressive mode
ankrcode optimize file.ts --benchmark  # Run benchmarks
ankrcode optimize file.ts --preview  # Preview only
ankrcode optimize file.ts --backup  # Create backup
ankrcode optimize file.ts -i  # Interactive mode
ankrcode optimize file.ts -o optimized.ts  # Output to file

# Git Commit (NEW in v2.21)
ankrcode commit            # Generate commit from staged changes
ankrcode commit -a         # Stage all and commit
ankrcode commit -t feat    # Specify commit type
ankrcode commit -s auth    # Specify scope
ankrcode commit --conventional  # Use conventional commits
ankrcode commit --emoji    # Include emoji
ankrcode commit -m "context"  # Add context hint
ankrcode commit --amend    # Amend previous commit
ankrcode commit -n         # Dry run (preview only)
ankrcode commit -i         # Interactive mode (edit message)
ankrcode commit --no-verify  # Skip pre-commit hooks
ankrcode commit -l hi      # Commit message in Hindi

# Pull Request (NEW in v2.21)
ankrcode pr                # Generate PR description
ankrcode pr -b develop     # Compare against develop branch
ankrcode pr -t "My PR title"  # Specify title
ankrcode pr --template .github/pr.md  # Use template
ankrcode pr --draft        # Create as draft
ankrcode pr -l bug,urgent  # Add labels
ankrcode pr -r user1,user2 # Add reviewers
ankrcode pr --include-tests  # Add test plan section
ankrcode pr --include-screenshots  # Add screenshot section
ankrcode pr --breaking     # Mark as breaking change
ankrcode pr -n             # Dry run (preview only)
ankrcode pr -o pr.md       # Save to file
ankrcode pr --open         # Open in browser after creation

# Dependencies (NEW in v2.22)
ankrcode deps              # Analyze dependencies
ankrcode deps -a           # Full analysis
ankrcode deps -o           # Show outdated packages
ankrcode deps -u           # Find unused dependencies
ankrcode deps -d           # Find duplicate packages
ankrcode deps -l           # Check licenses
ankrcode deps -t           # Show dependency tree
ankrcode deps --why lodash # Why is lodash installed
ankrcode deps --upgrade    # Upgrade outdated packages
ankrcode deps --upgrade-major  # Include major upgrades
ankrcode deps -f json      # Output as JSON
ankrcode deps --output report.json  # Save to file
ankrcode deps -i           # Interactive upgrade mode

# Security (NEW in v2.22)
ankrcode security          # Run security scan
ankrcode security -a       # Run npm audit
ankrcode security -c       # Scan code for vulnerabilities
ankrcode security -s       # Scan for hardcoded secrets
ankrcode security -d       # Scan dependencies for CVEs
ankrcode security --owasp  # Check against OWASP Top 10
ankrcode security -l low   # Include low severity issues
ankrcode security -l critical  # Only critical issues
ankrcode security --fix    # Auto-fix vulnerabilities
ankrcode security -f json  # Output as JSON
ankrcode security -f sarif # Output as SARIF (for CI)
ankrcode security -o report.json  # Save to file
ankrcode security --ignore CVE-123  # Ignore specific CVEs
ankrcode security -g "src/**/*.ts"  # Scan specific files

# Changelog generation (v2.23)
ankrcode changelog           # Generate changelog from recent commits
ankrcode changelog -v 1.2.0  # Set version for release
ankrcode changelog -f v1.0.0 # From specific tag
ankrcode changelog -f v1.0.0 -t v2.0.0  # Range between tags
ankrcode changelog --conventional  # Parse conventional commits
ankrcode changelog --group    # Group by commit type (feat, fix, etc.)
ankrcode changelog --format json  # Output as JSON
ankrcode changelog --format html  # Output as HTML
ankrcode changelog --include-author  # Include commit authors
ankrcode changelog --include-date    # Include commit dates
ankrcode changelog --breaking  # Highlight breaking changes
ankrcode changelog -o CHANGELOG.md  # Output to specific file
ankrcode changelog --prepend  # Prepend to existing changelog
ankrcode changelog --ai-enhance  # AI-enhance commit descriptions

# Migration assistance (v2.23)
ankrcode migrate src/       # Analyze and migrate source directory
ankrcode migrate -t version --from react@17 --to react@18  # Version upgrade
ankrcode migrate -t framework --from express --to fastify  # Framework migration
ankrcode migrate -t language --from js --to ts  # JS to TypeScript
ankrcode migrate -t database --from mysql --to postgres  # DB migration
ankrcode migrate src/ -n    # Dry run (show changes without applying)
ankrcode migrate src/ --backup  # Create backups before migrating
ankrcode migrate src/ -i    # Interactive mode with confirmations
ankrcode migrate src/ --codemods  # Apply codemods automatically
ankrcode migrate src/ --deps  # Update dependencies
ankrcode migrate -g "**/*.js" --to ts  # Migrate all JS files to TS
ankrcode migrate src/ --report  # Generate migration report

# Scaffolding (v2.24)
ankrcode scaffold              # Interactive mode - show available types
ankrcode scaffold component Button  # Create React component
ankrcode scaffold component Card --with-tests  # With test file
ankrcode scaffold component Modal --with-storybook  # With Storybook
ankrcode scaffold hook useAuth  # Create custom React hook
ankrcode scaffold service user  # Create service class
ankrcode scaffold module products  # Create feature module (types, service, hooks)
ankrcode scaffold api orders --template fastify  # Create API routes
ankrcode scaffold project myapp --template react  # Full project scaffold
ankrcode scaffold component Form --style tailwind  # With Tailwind styles
ankrcode scaffold --dry-run component Widget  # Preview without creating
ankrcode scaffold component Card --js  # JavaScript instead of TypeScript
ankrcode scaffold --from-spec openapi.yaml  # Generate from spec
ankrcode scaffold component UserCard --ai-enhance  # AI-improved code

# API documentation (v2.24)
ankrcode api                   # Show help
ankrcode api src/routes/       # Generate OpenAPI docs from routes
ankrcode api src/ -o api-docs.yaml  # Custom output file
ankrcode api src/ --format json  # Output as JSON
ankrcode api openapi.yaml -t validate  # Validate existing spec
ankrcode api openapi.yaml -t client  # Generate TypeScript client
ankrcode api openapi.yaml -t client --lang python  # Python client
ankrcode api openapi.yaml -t client --framework axios  # Use axios
ankrcode api src/ -t mock      # Generate mock server
ankrcode api src/ -t test      # Generate API tests
ankrcode api src/ --postman    # Export as Postman collection
ankrcode api src/ --insomnia   # Export as Insomnia collection
ankrcode api src/ --ai-enhance # AI-enhance descriptions
ankrcode api src/ --with-examples  # Include examples

# Bundle analysis (v2.25)
ankrcode bundle                # Show help
ankrcode bundle .              # Analyze current directory
ankrcode bundle dist/          # Analyze dist folder
ankrcode bundle -t optimize    # Get optimization suggestions
ankrcode bundle --show-duplicates  # Show duplicate packages
ankrcode bundle --show-chunks  # Show chunk breakdown
ankrcode bundle --show-modules # Show module breakdown
ankrcode bundle --gzip         # Show gzipped sizes
ankrcode bundle --brotli       # Show brotli sizes
ankrcode bundle --threshold 100kb  # Custom size threshold
ankrcode bundle --compare old-stats.json  # Compare with previous
ankrcode bundle --ai-suggest   # AI optimization suggestions
ankrcode bundle -o report.json # Save report as JSON
ankrcode bundle -o report.html --format html  # HTML report

# Internationalization (v2.25)
ankrcode i18n                  # Show help
ankrcode i18n src/             # Extract strings from source
ankrcode i18n src/ --locales en,hi,ta,te  # Specify target locales
ankrcode i18n src/ -o locales/ # Output directory
ankrcode i18n -t translate --ai-translate  # AI translate missing
ankrcode i18n -t sync          # Sync locale files
ankrcode i18n -t validate      # Validate translations
ankrcode i18n -t stats         # Show translation coverage
ankrcode i18n src/ --key-style flat  # Flat key style
ankrcode i18n src/ --format yaml  # Output as YAML
ankrcode i18n -t translate --locales hi --ai-translate  # Translate to Hindi
ankrcode i18n --coverage       # Show coverage stats
ankrcode i18n --sort-keys      # Sort keys alphabetically
ankrcode i18n --remove-unused  # Remove unused translations

# Environment management (v2.26)
ankrcode env                  # Show help
ankrcode env check            # Validate .env against .env.example
ankrcode env generate         # Generate .env from .env.example
ankrcode env sync             # Sync .env with .env.example
ankrcode env diff             # Show differences between files
ankrcode env encrypt --key mykey  # Encrypt sensitive values
ankrcode env decrypt --key mykey  # Decrypt values
ankrcode env --check-secrets  # Check for hardcoded secrets in code
ankrcode env --generate-types # Generate TypeScript env types
ankrcode env --generate-schema # Generate JSON schema
ankrcode env check --ai-suggest # AI-suggest missing variables
ankrcode env -f .env.prod -e .env.example  # Custom files

# Performance profiling (v2.26)
ankrcode perf                 # Show help
ankrcode perf app.js          # Profile Node.js script
ankrcode perf -t memory app.js # Memory profiling
ankrcode perf -t cpu app.js --ai-analyze  # CPU with AI analysis
ankrcode perf http://localhost:3000 -t network  # Network analysis
ankrcode perf http://localhost:3000 -t lighthouse  # Lighthouse audit
ankrcode perf http://localhost:3000 -t load -d 30  # 30s load test
ankrcode perf app.js -o report.json  # Save report as JSON
ankrcode perf app.js -o report.html --format html  # HTML report
ankrcode perf app.js --compare baseline.json  # Compare with baseline
ankrcode perf --threshold 50  # Custom slow threshold (ms)

# Database operations (v2.27)
ankrcode db                  # Show help
ankrcode db schema           # Analyze and show database schema
ankrcode db schema -o schema.json --format json  # Export as JSON
ankrcode db schema --format typescript  # Generate TypeScript types
ankrcode db migrate          # Run migrations (auto-detect prisma/drizzle)
ankrcode db migrate --dry-run # Preview migration changes
ankrcode db migrate --from old.sql --to new.sql --ai-generate  # AI-generate migration
ankrcode db seed             # Run default seed (prisma db seed)
ankrcode db seed --seed-file seeds/data.sql  # Run specific seed file
ankrcode db seed --table users --ai-generate --seed-count 20  # AI-generate 20 users
ankrcode db query -q "SELECT * FROM users"  # Execute SQL query
ankrcode db query --ai-explain  # AI explain query plan
ankrcode db query --analyze  # Show EXPLAIN ANALYZE
ankrcode db diff --from old.prisma --to new.prisma  # Compare schemas
ankrcode db diff --ai-generate  # Generate migration from diff
ankrcode db backup --backup-dir ./backups  # Create backup
ankrcode db backup --compress  # Create compressed backup
ankrcode db restore --from backup.sql.gz  # Restore from backup
ankrcode db --indexes --schema prisma/schema.prisma  # AI suggest indexes
ankrcode db -c postgresql://localhost:5432/mydb  # Custom connection URL

# Deployment (v2.27)
ankrcode deploy              # Show help
ankrcode deploy check        # Run pre-deployment checks
ankrcode deploy check --build --test --lint  # Full CI checks
ankrcode deploy check --ai-review  # AI review changes before deploy
ankrcode deploy preview      # Create preview deployment
ankrcode deploy preview --dry-run  # Show what would be deployed
ankrcode deploy release      # Deploy to staging
ankrcode deploy release --env prod --tag v1.0.0  # Deploy to production
ankrcode deploy release --build --test --changelog  # Full release
ankrcode deploy release --health-check  # Run health check after deploy
ankrcode deploy release --notify slack  # Send notification
ankrcode deploy rollback     # Show available versions
ankrcode deploy rollback --rollback-to v0.9.0  # Rollback to version
ankrcode deploy rollback --dry-run  # Preview rollback
ankrcode deploy status       # Show deployment status
ankrcode deploy status --env prod  # Status for production
ankrcode deploy --provider vercel  # Use specific provider
ankrcode deploy --provider docker  # Deploy as Docker container
ankrcode deploy --provider k8s  # Deploy to Kubernetes

# Mock server (v2.28)
ankrcode mock                 # Show help
ankrcode mock server          # Start mock server with default data
ankrcode mock server -s api.json  # From OpenAPI spec
ankrcode mock server -d data.json # From data file
ankrcode mock server -t user -c 50  # Generate 50 users
ankrcode mock server --delay 200 --error-rate 5  # Simulate latency/errors
ankrcode mock server --locale hi  # Hindi locale data
ankrcode mock data -t user -c 100 -o users.json  # Generate 100 users
ankrcode mock data -t product --seed 12345  # Reproducible data
ankrcode mock data --ai-generate -t custom  # AI-generate data
ankrcode mock data --schema types.ts  # Generate from schema
ankrcode mock api -s openapi.json -o ./mock-api  # Generate Express API
ankrcode mock record --proxy https://api.example.com  # Record requests
ankrcode mock replay --record-file recordings.json  # Replay recorded

# CI/CD management (v2.28)
ankrcode ci                   # Show help
ankrcode ci init              # Auto-detect and create CI config
ankrcode ci init -p github --cache --matrix  # GitHub with features
ankrcode ci init -p gitlab -t python  # GitLab for Python
ankrcode ci init --ai-generate  # AI-generate config
ankrcode ci validate          # Validate CI configuration
ankrcode ci validate --ai-fix  # Validate and auto-fix issues
ankrcode ci run --local       # Run pipeline locally
ankrcode ci run --local --docker  # Run in Docker (using act)
ankrcode ci run --jobs build,test  # Run specific jobs
ankrcode ci status            # Check CI status (requires gh/glab CLI)
ankrcode ci fix               # AI-fix CI issues
ankrcode ci fix --dry-run     # Preview fixes
ankrcode ci migrate --from gitlab --to github  # Migrate configs
ankrcode ci migrate --from jenkins --to github -o .github/workflows/ci.yml

# Kubernetes management (v2.29)
ankrcode k8s                  # Show help
ankrcode k8s init             # Create initial k8s manifests for project
ankrcode k8s init --ai-generate  # AI-generate manifests based on project
ankrcode k8s init -t deployment --image nginx --port 80 --replicas 3  # Generate deployment
ankrcode k8s init -t service --port 80 --service-type LoadBalancer  # Generate service
ankrcode k8s init -t ingress --host app.example.com  # Generate ingress
ankrcode k8s deploy -f manifests/  # Deploy all manifests in directory
ankrcode k8s deploy -f app.yaml -n production  # Deploy to namespace
ankrcode k8s deploy --dry-run  # Preview deployment
ankrcode k8s status           # Get cluster status
ankrcode k8s status -n production  # Status for namespace
ankrcode k8s logs -p my-pod   # View pod logs
ankrcode k8s logs -p my-pod --follow --tail 200  # Follow logs
ankrcode k8s exec -p my-pod   # Exec into pod
ankrcode k8s exec -p my-pod --container app -- /bin/sh  # Exec into specific container
ankrcode k8s scale --replicas 5  # Scale deployment
ankrcode k8s rollback         # Rollback deployment
ankrcode k8s debug -p my-pod  # Debug pod issues
ankrcode k8s debug --ai-debug  # AI-debug pod issues
ankrcode k8s --ai-optimize    # AI-optimize resource limits

# Docker management (v2.29)
ankrcode docker               # Show help
ankrcode docker build         # Build from Dockerfile in current dir
ankrcode docker build -f Dockerfile.prod -t myapp:v1  # Custom build
ankrcode docker build --multi-stage --platform linux/amd64  # Multi-arch build
ankrcode docker build --no-cache --build-arg NODE_ENV=production  # Build with args
ankrcode docker build --ai-generate  # AI-generate Dockerfile
ankrcode docker build --ai-optimize  # AI-optimize existing Dockerfile
ankrcode docker run -i myapp:v1 -p 3000:3000  # Run container
ankrcode docker run -i myapp -d -e NODE_ENV=prod  # Run detached with env
ankrcode docker run -v ./data:/app/data --network my-net  # With volume and network
ankrcode docker compose       # docker-compose up
ankrcode docker compose -f docker-compose.prod.yml  # Use specific file
ankrcode docker compose --ai-generate  # AI-generate docker-compose.yml
ankrcode docker scan          # Scan for vulnerabilities
ankrcode docker scan -i myapp:v1 --ai-scan  # AI-powered security scan
ankrcode docker optimize      # Optimize Dockerfile
ankrcode docker optimize --ai-optimize  # AI-optimize with suggestions
ankrcode docker clean         # Clean up unused images/containers
ankrcode docker clean --all   # Remove all stopped containers and images
ankrcode docker push -t myapp:v1 --registry ghcr.io/user  # Push to registry

# Log management (v2.30)
ankrcode log                  # Show help
ankrcode log tail -f app.log  # Tail log file
ankrcode log tail -f app.log --follow  # Follow mode (tail -f)
ankrcode log tail -f app.log -l error  # Filter by level
ankrcode log search -p "ERROR" -f app.log  # Search pattern
ankrcode log search -l error -s 1h  # Errors in last hour
ankrcode log search -p "timeout" --count  # Count matches
ankrcode log parse --json -f app.log  # Parse JSON logs
ankrcode log parse --fields timestamp,level,message  # Extract fields
ankrcode log parse --format table  # Output as table
ankrcode log analyze -f app.log  # Basic log analysis
ankrcode log analyze --ai-analyze  # AI analyze issues
ankrcode log analyze --ai-summarize  # AI summarize patterns
ankrcode log analyze --ai-alert  # AI detect anomalies
ankrcode log export -o logs.csv --format csv  # Export to CSV
ankrcode log export -o logs.json --format json  # Export to JSON
ankrcode log aggregate --group-by level  # Aggregate by level
ankrcode log aggregate --group-by level --count  # With counts
ankrcode log stream -d /var/log/ --follow  # Stream multiple logs

# Monitor (v2.30)
ankrcode monitor              # Show help
ankrcode monitor health -u http://localhost:3000/health  # Health check
ankrcode monitor health -u https://api.example.com --expect-status 200
ankrcode monitor health -u http://localhost:3000 --expect-body "ok"
ankrcode monitor start -u http://localhost:3000 -i 30  # Monitor every 30s
ankrcode monitor start -u http://localhost:3000 --webhook https://...  # With alerts
ankrcode monitor status       # System resource status
ankrcode monitor status --cpu --memory  # Specific resources
ankrcode monitor status --ai-analyze  # AI analysis
ankrcode monitor metrics --cpu --memory --disk  # Collect metrics
ankrcode monitor metrics --process node  # Process-specific metrics
ankrcode monitor metrics -o metrics.json --format json  # Export JSON
ankrcode monitor metrics --format prometheus  # Prometheus format
ankrcode monitor alerts --threshold-cpu 80 --threshold-memory 80
ankrcode monitor alerts --webhook https://slack.com/webhook  # With alerting
ankrcode monitor dashboard    # Live terminal dashboard
ankrcode monitor --ai-analyze  # AI analyze system metrics
ankrcode monitor --ai-optimize  # AI optimization suggestions
ankrcode monitor --ai-predict  # AI predict resource needs

# Secret management (v2.31)
ankrcode secret               # Show help
ankrcode secret scan          # Scan for secrets in current directory
ankrcode secret scan -d ./src # Scan specific directory
ankrcode secret scan --git-history  # Scan git history for leaked secrets
ankrcode secret scan --ai-scan  # AI-enhanced secret detection
ankrcode secret scan --ai-suggest  # AI suggest secure alternatives
ankrcode secret encrypt -f .env -k mykey  # Encrypt file
ankrcode secret encrypt -f config.json --algorithm aes-256-gcm
ankrcode secret decrypt -f .env.enc -k mykey  # Decrypt file
ankrcode secret generate --type password --length 32  # Generate password
ankrcode secret generate --type token  # Generate hex token
ankrcode secret generate --type key    # Generate base64 key
ankrcode secret generate --type uuid   # Generate UUID
ankrcode secret rotate --env-file .env  # Rotate all secrets in .env
ankrcode secret vault --vault-path secret/myapp  # Fetch from Vault
ankrcode secret vault --vault-addr https://vault.example.com --vault-token xxx
ankrcode secret env --env-file .env --format json  # Convert .env to JSON
ankrcode secret env --env-file .env --format yaml  # Convert .env to YAML

# Security audit (v2.31)
ankrcode audit                # Show help
ankrcode audit deps           # Audit npm/pip dependencies
ankrcode audit deps --fix     # Auto-fix vulnerabilities
ankrcode audit deps --severity high  # Filter by severity
ankrcode audit code           # Run SAST code analysis
ankrcode audit code --owasp   # Include OWASP checks
ankrcode audit code --ai-fix  # AI suggest code fixes
ankrcode audit config         # Audit configuration files
ankrcode audit docker         # Audit Dockerfile
ankrcode audit docker --ai-analyze  # AI analyze Dockerfile
ankrcode audit k8s            # Audit Kubernetes manifests
ankrcode audit k8s -f deployment.yaml  # Audit specific manifest
ankrcode audit full           # Full security audit
ankrcode audit full --ai-report  # AI generate detailed report
ankrcode audit report -o report.html --format html  # Generate HTML report
ankrcode audit report -o report.json --format json  # Generate JSON report
ankrcode audit report --format sarif  # Generate SARIF for CI/CD
ankrcode audit --sbom -o sbom.json  # Generate SBOM (CycloneDX)
ankrcode audit --compliance pci  # PCI compliance check
ankrcode audit --compliance hipaa  # HIPAA compliance check
ankrcode audit --compliance soc2  # SOC2 compliance check
ankrcode audit --compliance gdpr  # GDPR compliance check

# Database Migrations
ankrcode migrate              # Show migration status
ankrcode migrate status       # Show pending/applied migrations
ankrcode migrate create --name add_users_table  # Create migration
ankrcode migrate create --name add_users --sql  # Create SQL migration
ankrcode migrate create --name add_users --prisma  # Use Prisma
ankrcode migrate create --name add_users --typeorm  # Use TypeORM
ankrcode migrate create --name add_users --knex  # Use Knex
ankrcode migrate up           # Run all pending migrations
ankrcode migrate up --steps 2  # Run 2 migrations
ankrcode migrate up --to v20260116  # Migrate to specific version
ankrcode migrate up --dry-run  # Show what would run
ankrcode migrate up --ai-review  # AI review migrations before running
ankrcode migrate down         # Rollback last migration
ankrcode migrate down --steps 3  # Rollback 3 migrations
ankrcode migrate rollback     # Alias for down
ankrcode migrate reset --force  # Rollback all migrations
ankrcode migrate seed         # Run all seed files
ankrcode migrate seed --seed-file seeds/users.sql  # Run specific seed
ankrcode migrate generate --name create_posts --ai-generate  # AI generate migration
ankrcode migrate history      # Show migration history
ankrcode migrate diff --prisma  # Show schema diff (Prisma)

# Cache Management
ankrcode cache                # Show cache status
ankrcode cache status         # Show cache statistics
ankrcode cache set -k mykey --value "data" --ttl 3600  # Set with TTL
ankrcode cache get -k mykey   # Get value
ankrcode cache delete -k mykey  # Delete key
ankrcode cache delete --pattern "user:*"  # Delete by pattern
ankrcode cache clear          # Clear all cache
ankrcode cache clear --pattern "session:*"  # Clear by pattern
ankrcode cache warm --warm-urls urls.txt  # Warm cache from URL list
ankrcode cache warm --warm-keys data.json  # Warm cache from JSON
ankrcode cache export -o backup.json  # Export cache
ankrcode cache import -i backup.json  # Import cache
ankrcode cache stats          # Detailed statistics
ankrcode cache analyze        # Analyze cache issues
ankrcode cache analyze --ai-analyze  # AI analysis
ankrcode cache analyze --ai-optimize  # AI optimization suggestions
ankrcode cache --type redis --redis-url redis://localhost:6379  # Use Redis
ankrcode cache set -k key --value data --compress  # Compress values
ankrcode cache set -k key --value data --encrypt  # Encrypt values
ankrcode cache --namespace myapp  # Use namespace prefix

# Message Queues
ankrcode queue                # Show default queue status
ankrcode queue status -q myqueue  # Show queue status
ankrcode queue create -q myqueue  # Create new queue
ankrcode queue delete -q myqueue  # Delete queue
ankrcode queue list           # List all queues
ankrcode queue send -q myqueue -m '{"event":"test"}'  # Send message
ankrcode queue send -q myqueue -f messages.json  # Send from file
ankrcode queue send -q myqueue -m "data" --priority 5  # With priority
ankrcode queue send -q myqueue -m "data" --delay 5000  # Delayed message
ankrcode queue receive -q myqueue  # Receive message
ankrcode queue receive -q myqueue --count 10 --ack  # Receive and ack
ankrcode queue peek -q myqueue  # Peek without removing
ankrcode queue purge -q myqueue  # Purge all messages
ankrcode queue stats -q myqueue  # Queue statistics
ankrcode queue monitor -q myqueue  # Live monitoring
ankrcode queue replay -q myqueue  # Replay dead letter messages
ankrcode queue --type redis --redis-url redis://localhost:6379  # Use Redis
ankrcode queue --ai-analyze   # AI queue analysis

# Webhooks (v2.34)
ankrcode webhook              # Show help
ankrcode webhook create -n payment-hook -u https://api.example.com/webhooks -e payment.success,payment.failed
ankrcode webhook create -n notify --secret mysecret --algorithm sha256  # With signing
ankrcode webhook list         # List all webhooks
ankrcode webhook test -n payment-hook  # Test webhook delivery
ankrcode webhook test -n payment-hook -d '{"event":"test"}'  # With custom data
ankrcode webhook test -u https://webhook.site/xxx -H "X-Custom:value"  # Test external URL
ankrcode webhook logs -n payment-hook  # View delivery logs
ankrcode webhook logs -n payment-hook --status failed  # Filter by status
ankrcode webhook delete -n payment-hook  # Delete webhook
ankrcode webhook server -p 8888  # Start local webhook receiver
ankrcode webhook server -p 8888 --forward https://api.example.com  # With forwarding
ankrcode webhook inspect -n payment-hook  # View webhook details
ankrcode webhook replay -n payment-hook --delivery-id abc123  # Replay delivery
ankrcode webhook sign -d '{"event":"test"}' --secret mysecret  # Generate signature
ankrcode webhook verify -d '{"event":"test"}' --signature sig --secret mysecret  # Verify
ankrcode webhook --ai-debug -n payment-hook  # AI debug delivery issues

# Cron Jobs (v2.34)
ankrcode cron                 # Show help
ankrcode cron list            # List all cron jobs
ankrcode cron add -n backup -s "0 2 * * *" -c "npm run backup"  # Add daily backup
ankrcode cron add -n cleanup -s "0 * * * *" -c "./cleanup.sh" --desc "Hourly cleanup"
ankrcode cron remove -n backup  # Remove job
ankrcode cron enable -n backup  # Enable job
ankrcode cron disable -n backup  # Disable job
ankrcode cron run -n backup   # Run job immediately
ankrcode cron logs -n backup  # View execution logs
ankrcode cron logs -n backup --status failed  # Filter by status
ankrcode cron logs -n backup --last 20  # Last 20 runs
ankrcode cron status -n backup  # Get job status
ankrcode cron edit -n backup -s "0 3 * * *"  # Change schedule
ankrcode cron export -o crontab.json  # Export all jobs
ankrcode cron import -f crontab.json  # Import jobs
ankrcode cron parse "0 */2 * * *"  # Parse cron expression
ankrcode cron next -n backup --count 5  # Show next 5 runs
ankrcode cron --ai-suggest -t "run daily at 2am"  # AI suggest cron expression
ankrcode cron --ai-analyze -n backup  # AI analyze schedule conflicts

# HTTP Proxy (v2.35)
ankrcode proxy              # Show help
ankrcode proxy start -p 8080 -t http://api.example.com  # Start proxy
ankrcode proxy start --mock "/api/test:{\\"status\\":\\"ok\\"}"  # With mock
ankrcode proxy start --record --delay 100  # Record with delay
ankrcode proxy start -r "/api/*:http://localhost:4000"  # With routing rule
ankrcode proxy start --https --cors  # HTTPS with CORS
ankrcode proxy stop           # Stop proxy
ankrcode proxy status         # Show proxy status
ankrcode proxy logs           # View request logs
ankrcode proxy logs --method GET,POST --status 200  # Filter logs
ankrcode proxy logs --format json  # JSON output
ankrcode proxy rules          # List routing rules
ankrcode proxy mock           # List mock rules
ankrcode proxy intercept      # Show interception help
ankrcode proxy replay --replay recordings.json  # Replay requests
ankrcode proxy export -o logs.json  # Export as JSON
ankrcode proxy export --format har -o traffic.har  # Export as HAR
ankrcode proxy --ai-analyze   # AI analyze request patterns
ankrcode proxy --ai-debug     # AI debug API issues
ankrcode proxy --ai-mock "/api/users"  # AI generate mock

# Feature Flags (v2.35)
ankrcode feature              # Show help
ankrcode feature list         # List all flags
ankrcode feature list --tags beta,experiment  # Filter by tags
ankrcode feature create -n dark-mode --enabled --percentage 50
ankrcode feature create -n new-checkout -d "New checkout flow" --env staging
ankrcode feature update -n dark-mode --percentage 75
ankrcode feature delete -n old-feature
ankrcode feature enable -n dark-mode  # Enable globally
ankrcode feature enable -n dark-mode --target-env production  # Enable in env
ankrcode feature disable -n dark-mode  # Disable globally
ankrcode feature toggle -n dark-mode  # Toggle state
ankrcode feature status -n dark-mode  # Show flag details
ankrcode feature evaluate -n dark-mode --context '{"userId":"123"}'  # Evaluate
ankrcode feature export -o flags.json  # Export as JSON
ankrcode feature export --format yaml -o flags.yaml  # Export as YAML
ankrcode feature export --format env  # Export as env vars
ankrcode feature import -f flags.json  # Import flags
ankrcode feature sync --provider launchdarkly --api-key xxx  # Sync with provider
ankrcode feature --ai-suggest -n "payment retry"  # AI suggest config
ankrcode feature --ai-analyze  # AI analyze flag usage
ankrcode feature --ai-cleanup  # AI suggest stale flags

# Distributed Tracing (v2.36)
ankrcode trace                # Show help
ankrcode trace list           # List recent traces
ankrcode trace list --service user-service --status error  # Filter traces
ankrcode trace list --min-duration 500  # Slow traces only
ankrcode trace show -t abc123  # Show trace details
ankrcode trace show -t abc123 --waterfall  # With waterfall visualization
ankrcode trace spans -t abc123  # List spans in trace
ankrcode trace spans --service database  # Filter by service
ankrcode trace services       # Show service map
ankrcode trace services --service-map  # Show dependency graph
ankrcode trace errors         # List error traces
ankrcode trace latency        # Show latency distribution
ankrcode trace latency --service database  # Per-service latency
ankrcode trace compare -t abc123 --compare-trace def456  # Compare traces
ankrcode trace export -o traces.json  # Export as JSON
ankrcode trace export --format jaeger -o traces.jaeger  # Jaeger format
ankrcode trace export --format zipkin -o traces.zipkin  # Zipkin format
ankrcode trace --ai-analyze   # AI analyze trace patterns
ankrcode trace --ai-debug     # AI debug slow/failing traces
ankrcode trace --ai-optimize  # AI suggest optimizations

# Metrics (v2.36)
ankrcode metric               # Show help
ankrcode metric list          # List all metrics
ankrcode metric list --type gauge  # Filter by type
ankrcode metric query -n cpu_usage  # Query metric
ankrcode metric query -n cpu_usage --chart  # With ASCII chart
ankrcode metric query -n http_requests --interval 5m --aggregation sum
ankrcode metric record -n requests_total -v 1 -t counter  # Record value
ankrcode metric record -n response_time -v 45 --labels "endpoint:/api/users"
ankrcode metric histogram -n http_request_duration  # Show histogram
ankrcode metric percentile -n http_request_duration  # Show percentiles
ankrcode metric alert -n cpu_usage --threshold 80  # Create alert
ankrcode metric compare -n http_requests --compare-period 1d  # Compare periods
ankrcode metric dashboard     # Show metrics dashboard
ankrcode metric export -o metrics.json  # Export as JSON
ankrcode metric export --format prometheus  # Prometheus format
ankrcode metric export --format csv -o metrics.csv  # CSV format
ankrcode metric --ai-analyze  # AI analyze patterns
ankrcode metric --ai-anomaly  # AI detect anomalies
ankrcode metric --ai-forecast  # AI forecast future values
ankrcode metric --ai-correlate  # AI find correlations

# Secret Management (v2.37)
ankrcode secret               # Show help
ankrcode secret list          # List all secrets
ankrcode secret list --env prod  # Filter by environment
ankrcode secret list --vault production  # Filter by vault
ankrcode secret get --name API_KEY  # Get secret (masked)
ankrcode secret get --name API_KEY --decrypt  # Get with value
ankrcode secret set --name DB_PASS --value secret123  # Set secret
ankrcode secret set --name API_KEY --value xxx --encrypt  # With encryption
ankrcode secret set --name TOKEN --value xxx --ttl 30d  # With expiration
ankrcode secret delete --name OLD_KEY  # Delete secret
ankrcode secret rotate --name API_KEY  # Rotate secret value
ankrcode secret audit         # View audit log
ankrcode secret audit --name API_KEY  # Audit specific secret
ankrcode secret generate      # Generate secure secret
ankrcode secret generate --name NEW_KEY --env prod  # Generate and save
ankrcode secret share --name API_KEY --ttl 1h  # Create share link
ankrcode secret export --format dotenv --env prod  # Export to .env
ankrcode secret export --format yaml  # Export as YAML
ankrcode secret import --file secrets.json  # Import from file
ankrcode secret --ai-audit    # AI audit secret usage
ankrcode secret --ai-suggest  # AI suggest improvements
ankrcode secret --ai-detect   # AI detect exposed secrets

# Environment Variables (v2.37)
ankrcode env                  # Show help
ankrcode env list             # List dev env variables
ankrcode env list --env prod  # List prod env variables
ankrcode env get --name DATABASE_URL  # Get variable (masked)
ankrcode env get --name DATABASE_URL --no-mask  # Get with value
ankrcode env set --name PORT --value 3000 --type number  # Set with type
ankrcode env set --name API_URL --value https://api.example.com --type url
ankrcode env delete --name OLD_VAR  # Delete variable
ankrcode env validate --env prod  # Validate environment
ankrcode env validate --env prod --template nodejs  # Validate against template
ankrcode env diff --source dev --target prod  # Compare environments
ankrcode env diff --source dev --target prod --verbose  # With value diff
ankrcode env sync --source dev --target staging  # Sync missing vars
ankrcode env export --env prod  # Export as .env format
ankrcode env export --env prod --format shell  # Export as shell
ankrcode env export --env prod --format yaml  # Export as YAML
ankrcode env import --file .env.prod --env prod  # Import from file
ankrcode env template         # List available templates
ankrcode env template --template nodejs  # Show template details
ankrcode env --ai-validate    # AI validate configuration
ankrcode env --ai-suggest     # AI suggest missing variables
ankrcode env --ai-security    # AI check for security issues

# API Management (v2.38)
ankrcode api                  # Show help
ankrcode api docs             # Generate API documentation
ankrcode api docs --file openapi.yaml --format markdown
ankrcode api docs --format json -o api-docs.json
ankrcode api test             # Run API tests
ankrcode api test --url http://localhost:3000
ankrcode api test --endpoint /api/users
ankrcode api mock             # Start mock server
ankrcode api mock --port 4080
ankrcode api validate         # Validate OpenAPI spec
ankrcode api validate --file openapi.yaml
ankrcode api diff             # Compare API versions
ankrcode api generate         # Generate API client
ankrcode api coverage         # Show test coverage
ankrcode api lint             # Lint API specification
ankrcode api --ai-generate    # AI generate documentation
ankrcode api --ai-test        # AI generate test cases
ankrcode api --ai-mock        # AI generate mock responses
ankrcode api --ai-security    # AI security analysis

# Schema Management (v2.38)
ankrcode schema               # Show help
ankrcode schema validate      # Validate data against schema
ankrcode schema validate --file schema.json --data input.json
ankrcode schema generate      # Generate schema
ankrcode schema generate --type typescript
ankrcode schema generate --type graphql
ankrcode schema generate --type json-schema
ankrcode schema convert       # Convert between formats
ankrcode schema convert --from json-schema --to typescript
ankrcode schema convert --from json-schema --to graphql
ankrcode schema diff          # Compare schema versions
ankrcode schema merge         # Merge multiple schemas
ankrcode schema lint          # Lint schema for issues
ankrcode schema docs          # Generate documentation
ankrcode schema mock          # Generate mock data
ankrcode schema mock --samples 5
ankrcode schema infer         # Infer schema from data
ankrcode schema infer --data sample.json
ankrcode schema migrate       # Migrate schema version
ankrcode schema --ai-generate # AI generate schema
ankrcode schema --ai-infer    # AI infer from data
ankrcode schema --ai-docs     # AI documentation
ankrcode schema --ai-migrate  # AI migration plan

# System
ankrcode doctor            # Health check
```

### In-Chat Commands

```
/save    - Save current session
/stats   - Show session statistics
/clear   - Clear conversation and start fresh
exit     - Exit and auto-save
```

### RocketLang Syntax

```rocketlang
# Hindi commands
पढ़ो "file.ts"              # Read file
लिखो "content" में "file"   # Write file
बनाओ function for login    # Create function
खोजो "TODO" in src/        # Search

# Code-switching
ek API banao for users     # Create an API
database mein check karo   # Check database
commit karo "fixed bug"    # Git commit

# Bash escape
$ npm install
$ git status
```

### Tool Usage

| Tool | Hindi | Romanized | Example |
|------|-------|-----------|---------|
| Read | पढ़ो | padho | `पढ़ो "config.ts"` |
| Write | लिखो | likho | `likho "hello" in file.txt` |
| Edit | बदलो | badlo | `badlo "old" → "new" in file` |
| Search | खोजो | khojo | `khojo "error" in logs/` |
| Create | बनाओ | banao | `banao function for auth` |
| Delete | मिटाओ | mitao | `mitao "temp.txt"` |
| Run | चलाओ | chalao | `chalao "npm test"` |
| Show | दिखाओ | dikhao | `dikhao git status` |

### MCP Tool Categories

```typescript
// 255+ tools organized by domain
const categories = {
  compliance: 54,  // GST, TDS, ITR
  banking: 28,     // UPI, NEFT, EMI
  logistics: 35,   // Shipment, Route
  government: 22,  // Aadhaar, DigiLocker
  memory: 14,      // EON recall/remember
  erp: 44,         // Invoice, Inventory
  crm: 30,         // Lead, Contact
  other: 28,
};
```

### Architecture

```
┌─────────────────────────────────────────┐
│              AnkrCode CLI               │
├─────────────────────────────────────────┤
│ Priority 1: @ankr/* packages            │
│   @ankr/eon, @ankr/mcp-tools            │
├─────────────────────────────────────────┤
│ Priority 2: ANKR Services               │
│   EON :4005, MCP :4006, Swayam :7777    │
├─────────────────────────────────────────┤
│ Priority 3: AI Proxy :4444              │
│   Routes to best LLM, caches, fallback  │
├─────────────────────────────────────────┤
│ Priority 4: Direct LLM APIs             │
│   Claude, OpenAI, Groq (fallback only)  │
└─────────────────────────────────────────┘
```

### For AI Assistants Working on AnkrCode

1. **ANKR-first**: Always try `@ankr/*` packages before external dependencies
2. **Graceful degradation**: Every adapter needs fallback chain
3. **i18n required**: User-facing strings must use `t(lang, key)`
4. **Code-switching**: Support mixed Hindi-English input
5. **Port conventions**: Use `ankr5 ports get <service>`

### Environment Variables

```bash
ANTHROPIC_API_KEY=sk-...
AI_PROXY_URL=http://localhost:4444
EON_URL=http://localhost:4005
MCP_URL=http://localhost:4006
ANKRCODE_LANG=hi
ANKRCODE_VOICE=true
```

### Project Structure

```
ankrcode-project/
├── packages/
│   ├── ankrcode-core/        # Main CLI
│   │   └── src/
│   │       ├── cli/          # Entry point
│   │       ├── tools/        # 14 core tools
│   │       ├── adapters/     # Unified adapter (NEW)
│   │       ├── ai/           # LLM adapters
│   │       ├── mcp/          # MCP integration
│   │       ├── memory/       # EON adapter
│   │       ├── voice/        # Swayam integration
│   │       ├── i18n/         # 11 languages
│   │       ├── config/       # Configuration
│   │       └── swayam/       # Personality
│   └── rocketlang/           # DSL parser
└── docs/
```

---

## Changelog

### v2.38.0 (2026-01-16)
- Added `api` command for API documentation, testing, and OpenAPI management
- Added `schema` command for schema validation, generation, and conversion
- API supports: docs, test, mock, validate, diff, generate, coverage, lint with AI documentation/testing/security
- Schema supports: validate, generate, convert, diff, merge, lint, docs, mock, infer, migrate with AI generation/inference

### v2.37.0 (2026-01-16)
- Added `secret` command for secret and credential management with encryption
- Added `env` command for environment variable management and validation
- Secret supports: list, get, set, delete, rotate, audit, export, import, generate, share with vault integration and AI audit/detection
- Env supports: list, get, set, delete, validate, diff, sync, export, import, template with type validation and AI security analysis

### v2.36.0 (2026-01-16)
- Added `trace` command for distributed tracing and request flow analysis
- Added `metric` command for metrics collection, visualization, and analysis

### v2.35.0 (2026-01-16)
- Added `proxy` command for HTTP proxy and API debugging
- Added `feature` command for feature flag management and A/B testing

### v2.34.0 (2026-01-16)
- Added `webhook` command for webhook management and testing
- Added `cron` command for scheduled task and cron job management

### v2.33.0 (2026-01-16)
- Added `cache` command for cache management and optimization
- Added `queue` command for message queue management
- Cache supports: status, clear, warm, analyze, set, get, delete, export, import, stats with TTL, compression, encryption, and AI analysis/optimization
- Queue supports: status, send, receive, peek, purge, stats, create, delete, list, monitor, replay with priority, delay, DLQ, and AI analysis

### v2.32.0 (2026-01-16)
- Added `migrate` command for database and code migration management
- Migrate supports: create, up, down, status, reset, seed, generate, rollback, history, diff with Prisma/TypeORM/Knex support and AI generation/review

### v2.31.0 (2026-01-16)
- Added `secret` command for secret and credential management
- Added `audit` command for security audit and vulnerability scanning
- Secret supports: scan, encrypt, decrypt, rotate, generate, vault, env with AI detection/suggestions
- Audit supports: deps, code, config, docker, k8s, full, report, SBOM, compliance checks with AI analysis

### v2.30.0 (2026-01-16)
- Added `log` command for log management and analysis
- Added `monitor` command for application monitoring and health checks
- Log supports: tail, search, parse, analyze, export, stream, aggregate with AI analysis/summarization
- Monitor supports: health, start, status, metrics, alerts, dashboard with AI analysis/optimization/prediction

### v2.29.0 (2026-01-16)
- Added `k8s` command for Kubernetes management and deployment
- Added `docker` command for Docker management and optimization
- K8s supports: init, deploy, logs, exec, status, scale, rollback, debug, AI manifests/debug/optimize
- Docker supports: build, run, compose, optimize, scan, clean, push, AI generation/optimization/scanning

### v2.28.0 (2026-01-16)
- Added `mock` command for mock server and API mocking
- Added `ci` command for CI/CD pipeline management
- Mock supports: server, data generation, API from OpenAPI spec, record/replay requests
- CI supports: init, validate, run locally, status check, fix issues, migrate between providers

### v2.27.0 (2026-01-16)
- Added `db` command for database operations and management
- Added `deploy` command for deployment helpers and release management
- DB supports: schema, migrate, seed, query, diff, backup, restore, AI-generate migrations
- Deploy supports: check, preview, release, rollback, status, AI review, health checks

### v2.26.0 (2026-01-16)
- Added `env` command for environment variable management and validation
- Added `perf` command for performance profiling and analysis
- Env supports: check, generate, sync, diff, encrypt/decrypt, secrets detection, TypeScript types
- Perf supports: CPU/memory profiling, network analysis, Lighthouse audit, load testing, AI analysis

### v2.25.0 (2026-01-16)
- Added `bundle` command for AI-powered bundle analysis and optimization
- Added `i18n` command for internationalization management
- Bundle supports: analyze, optimize, tree-shake, duplicates, gzip/brotli sizes, AI suggestions
- i18n supports: extract, translate, sync, validate with AI translation for Indian languages

### v2.24.0 (2026-01-16)
- Added `scaffold` command for AI-powered project scaffolding
- Added `api` command for API documentation and client generation
- Scaffold supports: project, component, module, api, service, hook, test templates
- API supports: OpenAPI docs generation, TypeScript client, mock server, Postman/Insomnia export

### v2.23.0 (2026-01-16)
- Added `changelog` command for AI-enhanced changelog generation
- Added `migrate` command for AI-assisted code migration
- Changelog supports: conventional commits, grouping, multiple formats (md/json/html), prepend mode
- Migrate supports: version/framework/language/database migrations, dry-run, backup, codemods

### v2.22.0 (2026-01-16)
- Added `deps` command for dependency analysis and management
- Added `security` command for security vulnerability scanning
- Deps supports: outdated, unused, duplicates, licenses, tree, interactive upgrade
- Security supports: npm audit, secret scanning, AI code analysis, OWASP checks, SARIF output

### v2.21.0 (2026-01-16)
- Added `commit` command for AI-powered git commit message generation
- Added `pr` command for AI-powered pull request description generation
- Commit supports: conventional commits, emoji, scopes, amend, Hindi messages
- PR supports: custom templates, labels, reviewers, test plans, GitHub CLI integration

### v2.20.0 (2026-01-16)
- Added `lint` command for AI-powered code linting
- Added `optimize` command for AI-powered code optimization
- Lint supports: multiple output formats (text, json, sarif), custom rules, auto-fix
- Optimize supports: perf, memory, size, readability types; function/line targeting

### v2.19.0 (2026-01-16)
- Added `test` command for AI-powered test generation and running
- Added `debug` command for AI-assisted debugging
- Test supports: jest, vitest, mocha, pytest; unit/integration/e2e types; coverage
- Debug supports: error analysis, stack traces, log analysis, breakpoints, auto-fix

### v2.18.0 (2026-01-16)
- Added `refactor` command for AI-powered code refactoring
- Added `doc` command for documentation generation
- Refactor supports: rename, extract, inline, simplify, modernize operations
- Doc supports multiple formats (md, html, json), API docs, README, JSDoc, inline comments

### v2.17.0 (2026-01-16)
- Added `review` command for AI-powered code review
- Added `explain` command for code explanation
- Review supports git diff, commits, multiple focus areas, JSON output
- Explain supports line ranges, functions, classes, Indic languages (hi, ta, te)

### v2.16.0 (2026-01-16)
- Added `template` command for code template management
- Added `gen` command for AI-powered code generation
- 5 built-in templates: TypeScript Function, React Component, Express Route, Python Class, Jest Test
- Gen supports multiple languages, frameworks, interactive refinement mode

### v2.15.0 (2026-01-16)
- Added `watch` command for file watching with command execution
- Added `hook` command for lifecycle hooks management
- Watch supports debouncing, ignore patterns, initial run, verbose mode
- Hooks support 13 events: startup, shutdown, pre/post-chat, pre/post-tool, etc.

### v2.14.0 (2026-01-16)
- Added `backup` command for data backup and restore
- Added `env` command for environment variable profiles
- Backup supports compression, selective includes, restore functionality
- Env supports multiple profiles, export to .env files

### v2.13.0 (2026-01-16)
- Added `prompt` command for saved prompts and templates
- Added `log` command for activity history viewing
- Prompts support variables with {{placeholder}} syntax
- Built-in prompts: review, explain, refactor, test, document
- Logs support filtering by type, date, and search

### v2.12.0 (2026-01-16)
- Added `alias` command for command shortcuts and macros
- Added `snippet` command for code snippet management
- Aliases support ankrcode commands and bash commands
- Snippets support tags, descriptions, import/export, language detection

### v2.11.0 (2026-01-16)
- Added `update` command for self-update capability
- Added `context` command for EON memory management
- Update checks npm registry and auto-installs new versions
- Context supports list, search, add, remove, clear, export operations

### v2.10.0 (2026-01-16)
- Added `clean` command for cache and session cleanup
- Added `info` command for detailed system information
- Clean supports dry-run mode to preview deletions
- Info shows platform, paths, config, environment, features, and resources

### v2.9.0 (2026-01-16)
- Added `export` command for session export (md, json, html formats)
- Added `diff` command to review file changes in sessions
- Export includes optional tool call details
- Diff shows read/write/edit operations with visual indicators

### v2.8.0 (2026-01-16)
- Added `init` command with project templates (node, python, go, rust)
- Added `stats` command for usage statistics
- Templates include ANKRCODE.md with framework-specific rules
- Stats show sessions, messages, language usage with visual bars

### v2.7.0 (2026-01-16)
- Added `search` command for quick code search (ripgrep-powered)
- Added `completion` command for shell completions (bash, zsh, fish)
- Search supports file type filtering, glob patterns, count mode

### v2.6.0 (2026-01-16)
- Added `run` command for executing RocketLang scripts
- Added `history` command for session/command history
- RocketLang `run` supports compile mode (js, sh, go)
- RocketLang `run` supports dry-run mode

### v2.5.0 (2026-01-16)
- Added `config` command for managing settings
- Added auto-save to main chat command
- Added `/clear` in-chat command
- Sessions now show resume instructions on exit

### v2.4.0 (2026-01-16)
- Added `sessions` command for listing saved sessions
- Added `resume` command with interactive picker
- Added in-chat commands: `/save`, `/stats`
- Added session persistence to EON Memory

### v2.3.0 (2026-01-16)
- Added Plugin System with Git and Docker plugins
- Added Conversation Persistence to EON Memory
- Enhanced ConversationManager with save/load/export

### v2.2.0 (2026-01-16)
- Completed P1: NotebookEdit, WebSearch, Voice Pipeline v2
- Added multi-provider WebSearch (Tavily, Brave, SearXNG)
- Added Voice Activity Detection (VAD) and Indic language detection

### v2.1.0 (2026-01-16)
- Completed P0: Unified Adapter, Startup Diagnostics, MCP Discovery
- Added `ankrcode doctor` command

### Previous
- Initial TODO structure
- Basic tool inventory
