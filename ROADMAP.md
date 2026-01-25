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
