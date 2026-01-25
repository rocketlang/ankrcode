# @ankr/rocketlang

RocketLang - Indic-first DSL for code generation

Write code commands in Hindi, Tamil, Telugu, or any Indian language!

## Installation

```bash
npm install @ankr/rocketlang
# or
pnpm add @ankr/rocketlang
```

## Usage

### Pattern-based Parser

```typescript
import { parse, toToolCalls } from '@ankr/rocketlang';

// Parse RocketLang commands
const result = parse(`
  read "package.json"
  padho "config.json"        # Hindi: read
  search "TODO" in "src"
  commit "feat: add feature"
`);

// Convert to tool calls
const calls = toToolCalls(result.commands);
```

### PEG Parser (Advanced)

```typescript
import { parsePEG, getSupportedFeatures } from '@ankr/rocketlang';

// Parse with PEG grammar (supports more features)
const result = parsePEG(`
  read "package.json"
  write "hello" to "test.txt"
  @gst_verify { gstin: "123456789" }
`);

// List supported features
console.log(getSupportedFeatures());
```

### Normalization

```typescript
import { normalize, transliterate, detectScript } from '@ankr/rocketlang';

// Detect script
detectScript('पढ़ो'); // 'devanagari'
detectScript('read'); // 'roman'
detectScript('पढ़ो file'); // 'mixed'

// Normalize Indic verbs to English
normalize('पढ़ो');   // 'read'
normalize('लिखो');  // 'write'
normalize('banao'); // 'create'

// Transliterate
transliterate('नमस्ते', 'devanagari', 'roman'); // 'namaste'
```

### Code Generation

```typescript
import { parse, toTypeScript, toShellScript } from '@ankr/rocketlang';

const result = parse('read "file.txt"');

// Generate TypeScript
const ts = toTypeScript(result.commands);
// Output: await fs.readFile('file.txt', 'utf-8')

// Generate Shell script
const sh = toShellScript(result.commands);
// Output: cat file.txt
```

## Supported Commands

### File Operations
```
read "file.txt"           # Read file
padho "config.json"       # Hindi: read
write "content" to "out"  # Write to file
likho "text" mein "out"   # Hindi: write
edit "file" "old" -> "new"# Edit file
```

### Search
```
search "TODO" in "src"    # Grep search
grep "pattern" in "*.ts"  # Grep
glob "*.js"               # File glob
```

### Git
```
commit "message"          # Git commit
push                      # Git push
pull                      # Git pull
git status                # Any git command
```

### Package Management
```
npm install typescript    # npm install
npm test                  # npm test
npm run build             # npm run
```

### Bash
```
$ ls -la                  # Direct bash
run "echo hello"          # Run command
chalao "build.sh"         # Hindi: run
```

### MCP Tools
```
@gst_verify { gstin: "123" }  # Direct MCP call
```

## Supported Languages

| Language | Verbs Example |
|----------|---------------|
| Hindi | पढ़ो, लिखो, बनाओ, खोजो, चलाओ |
| Tamil | படி, எழுது, தேடு |
| Telugu | చదువు, రాయి, వెతుకు |
| English | read, write, create, search, run |

## Grammar (PEG)

The PEG parser supports:
- File operations (read, write, edit, delete)
- Search operations (grep, glob, find)
- Git operations (commit, push, pull)
- Package management (npm install, test, run)
- Direct bash commands ($ prefix, run)
- Code generation (create API, function, component)
- Direct MCP tool calls (@tool {...})
- Conditionals (if/then/else, agar/toh/nahi)
- Loops (for/in/do, har/mein/karo)
- Pipe expressions (cmd1 | cmd2)
- Variable assignment (let x = value)

## Development

```bash
# Build
pnpm build

# Build grammar only
pnpm build:grammar

# Test
pnpm test
```

## License

MIT
