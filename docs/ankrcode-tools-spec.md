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
