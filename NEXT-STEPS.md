# AnkrCode Next Steps

## Immediate (Today)

### 1. Move to ankr-labs-nx Monorepo

```bash
# Copy packages to monorepo
cp -r /root/ankrcode-project/packages/ankrcode-core /root/ankr-labs-nx/packages/
cp -r /root/ankrcode-project/packages/rocketlang /root/ankr-labs-nx/packages/

# Update workspace
cd /root/ankr-labs-nx
echo "  - 'packages/ankrcode-core'" >> pnpm-workspace.yaml
echo "  - 'packages/rocketlang'" >> pnpm-workspace.yaml

# Install and build
pnpm install
pnpm nx build ankrcode-core
```

### 2. Test with Live ANKR Services

```bash
# Check services are running
curl http://localhost:4444/health  # AI Proxy
curl http://localhost:4005/health  # EON Memory
curl http://localhost:4006/health  # MCP Server

# Run ankrcode
cd /root/ankr-labs-nx/packages/ankrcode-core
pnpm build
node dist/cli/index.js doctor
node dist/cli/index.js chat
```

### 3. Create Integration Test

```typescript
// src/__tests__/integration.test.ts
import { getAIRouterAdapter } from '../ai/router-adapter';
import { getEONAdapter } from '../memory/eon-adapter';
import { getMCPAdapter } from '../mcp/adapter';

describe('ANKR Integration', () => {
  test('AI Proxy connection', async () => {
    const adapter = getAIRouterAdapter();
    await adapter.initialize();
    expect(adapter.isAvailable()).toBe(true);
  });

  test('EON Memory', async () => {
    const eon = getEONAdapter();
    const id = await eon.remember('test content');
    const results = await eon.recall('test');
    expect(results.length).toBeGreaterThan(0);
  });

  test('MCP Tools', async () => {
    const mcp = getMCPAdapter();
    const stats = mcp.getStats();
    expect(stats.totalTools).toBeGreaterThan(0);
  });
});
```

---

## This Week

### 4. Improve RocketLang Parser

Add more Indic verbs:
```typescript
// packages/rocketlang/src/normalizer/verbs.ts
export const INDIC_VERBS = {
  // Hindi
  'पढ़ो': 'read', 'padho': 'read',
  'लिखो': 'write', 'likho': 'write',
  'बनाओ': 'create', 'banao': 'create',
  'खोजो': 'search', 'khojo': 'search',
  'चलाओ': 'run', 'chalao': 'run',
  'मिटाओ': 'delete', 'mitao': 'delete',
  'बदलो': 'edit', 'badlo': 'edit',
  
  // Tamil
  'படி': 'read',
  'எழுது': 'write',
  'உருவாக்கு': 'create',
  
  // Telugu
  'చదువు': 'read',
  'రాయి': 'write',
};
```

### 5. Add Project Detection

```typescript
// src/context/project.ts
async function detectProject(): Promise<ProjectContext> {
  const cwd = process.cwd();
  
  // Check for ANKRCODE.md or CLAUDE.md
  const contextFiles = ['ANKRCODE.md', 'CLAUDE.md', '.ankrcode/context.md'];
  for (const file of contextFiles) {
    if (await fileExists(path.join(cwd, file))) {
      return { contextFile: file, content: await readFile(file) };
    }
  }
  
  // Detect project type
  if (await fileExists('package.json')) return { type: 'node' };
  if (await fileExists('Cargo.toml')) return { type: 'rust' };
  if (await fileExists('go.mod')) return { type: 'go' };
  if (await fileExists('requirements.txt')) return { type: 'python' };
  
  return { type: 'unknown' };
}
```

---

## Next Week

### 6. Voice Input Integration

```typescript
// src/voice/swayam-client.ts
import WebSocket from 'ws';

class SwayamVoiceClient {
  private ws: WebSocket;
  
  constructor(url = 'ws://localhost:7777/voice') {
    this.ws = new WebSocket(url);
  }
  
  async transcribe(audioBuffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      this.ws.send(audioBuffer);
      this.ws.once('message', (data) => {
        const result = JSON.parse(data.toString());
        resolve(result.text);
      });
    });
  }
}
```

### 7. Conversation Persistence

```typescript
// src/persistence/session.ts
import { getEONAdapter } from '../memory/eon-adapter';

async function saveSession(sessionId: string, messages: Message[]): Promise<void> {
  const eon = getEONAdapter();
  await eon.remember(JSON.stringify(messages), {
    type: 'session',
    sessionId,
    timestamp: Date.now(),
  });
}

async function loadSession(sessionId: string): Promise<Message[]> {
  const eon = getEONAdapter();
  const results = await eon.recall(`session:${sessionId}`);
  return results[0] ? JSON.parse(results[0].content) : [];
}
```

---

## Launch Checklist

- [ ] All tests passing
- [ ] Build succeeds
- [ ] Doctor command shows all services connected
- [ ] Chat works in Hindi
- [ ] RocketLang scripts execute
- [ ] MCP tools discovered (255+)
- [ ] Memory persists across sessions
- [ ] Voice input works (if Swayam running)
- [ ] Offline mode works (if Ollama installed)
- [ ] README updated
- [ ] Published to npm

---

## Commands to Run Now

```bash
# 1. Build and test
cd /root/ankrcode-project/packages/ankrcode-core
pnpm build
pnpm test

# 2. Run doctor to see status
node dist/cli/index.js doctor

# 3. Try interactive chat
node dist/cli/index.js chat --lang hi

# 4. Move to monorepo (when ready)
cp -r /root/ankrcode-project/packages/* /root/ankr-labs-nx/packages/
```
