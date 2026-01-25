/**
 * Unified Adapter - ANKR-First Architecture
 *
 * Priority Chain:
 * 1. @ankr/* packages (in-process, fastest)
 * 2. ANKR services (localhost)
 * 3. AI Proxy (gateway with caching/routing)
 * 4. Direct LLM APIs (fallback only)
 */
import { EventEmitter } from 'events';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
async function detectPackage(name) {
    // Try dynamic import first (for ESM packages)
    try {
        const pkg = await import(name);
        const version = pkg.version || pkg.VERSION || pkg.default?.version || 'unknown';
        return { name, available: true, version };
    }
    catch {
        // Fallback to require for CJS packages
        try {
            const pkg = require(name);
            const version = pkg.version || pkg.VERSION || 'unknown';
            return { name, available: true, version };
        }
        catch {
            return { name, available: false };
        }
    }
}
export async function detectANKRPackages() {
    const packages = [
        '@ankr/eon',
        '@ankr/mcp-tools',
        '@ankr/vibecoding-tools',
        '@ankr/ai-router',
        '@ankr/config',
        '@ankr/i18n',
    ];
    const results = {};
    await Promise.all(packages.map(async (name) => {
        results[name] = await detectPackage(name);
    }));
    return results;
}
// ============================================================================
// Service Health Checks
// ============================================================================
async function checkServiceHealth(name, url, timeout = 3000) {
    const start = Date.now();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(`${url}/health`, {
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (response.ok) {
            const data = await response.json().catch(() => ({}));
            return {
                name,
                available: true,
                latency: Date.now() - start,
                version: data.version,
            };
        }
        return { name, available: false, error: `HTTP ${response.status}` };
    }
    catch (error) {
        return {
            name,
            available: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
export async function checkAllServices(config) {
    const services = [
        { name: 'AI Proxy', url: config.aiProxyUrl },
        { name: 'EON Memory', url: config.eonUrl },
        { name: 'MCP Server', url: config.mcpUrl },
        { name: 'Swayam', url: config.swayamUrl },
    ];
    return Promise.all(services.map(({ name, url }) => checkServiceHealth(name, url, config.timeout)));
}
// ============================================================================
// LLM Adapter
// ============================================================================
export class UnifiedLLMAdapter extends EventEmitter {
    config;
    packages = {};
    services = [];
    constructor(config = {}) {
        super();
        this.config = {
            aiProxyUrl: config.aiProxyUrl || process.env.AI_PROXY_URL || 'http://localhost:4444',
            eonUrl: config.eonUrl || process.env.EON_URL || 'http://localhost:4005',
            mcpUrl: config.mcpUrl || process.env.MCP_URL || 'http://localhost:4006',
            swayamUrl: config.swayamUrl || process.env.SWAYAM_URL || 'http://localhost:7777',
            anthropicKey: config.anthropicKey || process.env.ANTHROPIC_API_KEY,
            openaiKey: config.openaiKey || process.env.OPENAI_API_KEY,
            preferOffline: config.preferOffline ?? false,
            timeout: config.timeout || 3000,
        };
    }
    async initialize() {
        const [packages, services] = await Promise.all([
            detectANKRPackages(),
            checkAllServices(this.config),
        ]);
        this.packages = packages;
        this.services = services;
        this.emit('initialized', { packages, services });
    }
    getStatus() {
        return { packages: this.packages, services: this.services };
    }
    async complete(request) {
        // Priority 1: @ankr/ai-router package
        if (this.packages['@ankr/ai-router']?.available) {
            try {
                const result = await this.completeViaPackage(request);
                return { ...result, source: 'package' };
            }
            catch (error) {
                this.emit('fallback', { from: 'package', to: 'service', error });
            }
        }
        // Priority 2: AI Proxy service
        const aiProxy = this.services.find(s => s.name === 'AI Proxy');
        if (aiProxy?.available) {
            try {
                const result = await this.completeViaProxy(request);
                return { ...result, source: 'proxy' };
            }
            catch (error) {
                this.emit('fallback', { from: 'proxy', to: 'direct', error });
            }
        }
        // Priority 3: Direct API
        if (this.config.anthropicKey) {
            try {
                const result = await this.completeViaDirect(request);
                return { ...result, source: 'direct' };
            }
            catch (error) {
                this.emit('error', { type: 'llm', error });
                throw error;
            }
        }
        throw new Error('No LLM backend available. Install @ankr/ai-router, start AI Proxy, or set ANTHROPIC_API_KEY.');
    }
    async completeViaPackage(request) {
        const mod = await import('@ankr/ai-router');
        const AIRouter = mod.AIRouter || mod.default;
        const router = new AIRouter();
        const response = await router.complete({
            messages: request.messages,
            tools: request.tools,
            model: request.model || 'auto',
        });
        return {
            content: response.content,
            toolCalls: response.toolCalls || response.tool_calls,
            model: response.model,
        };
    }
    async completeViaProxy(request) {
        const response = await fetch(`${this.config.aiProxyUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: request.messages,
                tools: request.tools,
                model: request.model || 'auto',
                stream: request.stream || false,
            }),
        });
        if (!response.ok) {
            throw new Error(`AI Proxy error: ${response.status}`);
        }
        const data = await response.json();
        const choice = data.choices?.[0];
        return {
            content: choice?.message?.content || '',
            toolCalls: choice?.message?.tool_calls,
            model: data.model,
        };
    }
    async completeViaDirect(request) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.anthropicKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: request.model || 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                messages: request.messages.map(m => ({
                    role: m.role === 'user' ? 'user' : 'assistant',
                    content: m.content,
                })),
                tools: request.tools?.map(t => ({
                    name: t.name,
                    description: t.description,
                    input_schema: t.parameters || t.inputSchema,
                })),
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API error: ${error}`);
        }
        const data = await response.json();
        const content = data.content?.find((c) => c.type === 'text')?.text || '';
        const toolUse = data.content?.filter((c) => c.type === 'tool_use');
        return {
            content,
            toolCalls: toolUse?.map((t) => ({
                id: t.id,
                name: t.name,
                arguments: t.input,
            })),
            model: data.model,
        };
    }
}
// ============================================================================
// Memory Adapter
// ============================================================================
export class UnifiedMemoryAdapter extends EventEmitter {
    config;
    packages = {};
    inMemoryStore = new Map();
    constructor(config = {}) {
        super();
        this.config = {
            aiProxyUrl: config.aiProxyUrl || 'http://localhost:4444',
            eonUrl: config.eonUrl || process.env.EON_URL || 'http://localhost:4005',
            mcpUrl: config.mcpUrl || 'http://localhost:4006',
            swayamUrl: config.swayamUrl || 'http://localhost:7777',
            preferOffline: config.preferOffline ?? false,
            timeout: config.timeout || 3000,
        };
    }
    async initialize() {
        this.packages = await detectANKRPackages();
        this.emit('initialized', { packages: this.packages });
    }
    async remember(key, value, metadata) {
        // Priority 1: @ankr/eon package
        if (this.packages['@ankr/eon']?.available) {
            try {
                const mod = await import('@ankr/eon');
                const EON = mod.EON || mod.default;
                const eon = new EON({ mode: 'local' });
                if (typeof eon.remember === 'function') {
                    await eon.remember(key, value, metadata);
                    return;
                }
            }
            catch (error) {
                this.emit('fallback', { from: 'package', to: 'service', error });
            }
        }
        // Priority 2: EON service
        try {
            const response = await fetch(`${this.config.eonUrl}/api/memory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value, metadata }),
            });
            if (response.ok)
                return;
        }
        catch (error) {
            this.emit('fallback', { from: 'service', to: 'memory', error });
        }
        // Priority 3: In-memory fallback
        this.inMemoryStore.set(key, { key, value, metadata });
        this.emit('stored', { key, backend: 'memory' });
    }
    async recall(query) {
        // Priority 1: @ankr/eon package
        if (this.packages['@ankr/eon']?.available) {
            try {
                const mod = await import('@ankr/eon');
                const EON = mod.EON || mod.default;
                const eon = new EON({ mode: 'local' });
                if (typeof eon.recall === 'function') {
                    return await eon.recall(query);
                }
            }
            catch (error) {
                this.emit('fallback', { from: 'package', to: 'service', error });
            }
        }
        // Priority 2: EON service
        try {
            const response = await fetch(`${this.config.eonUrl}/api/memory/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                return await response.json();
            }
        }
        catch (error) {
            this.emit('fallback', { from: 'service', to: 'memory', error });
        }
        // Priority 3: In-memory search
        const results = [];
        for (const entry of this.inMemoryStore.values()) {
            if (entry.key.includes(query) ||
                JSON.stringify(entry.value).includes(query)) {
                results.push(entry);
            }
        }
        return results;
    }
}
// ============================================================================
// MCP Tools Adapter
// ============================================================================
export class UnifiedMCPAdapter extends EventEmitter {
    config;
    packages = {};
    toolCache = [];
    coreTools = [];
    constructor(config = {}) {
        super();
        this.config = {
            aiProxyUrl: config.aiProxyUrl || 'http://localhost:4444',
            eonUrl: config.eonUrl || 'http://localhost:4005',
            mcpUrl: config.mcpUrl || process.env.MCP_URL || 'http://localhost:4006',
            swayamUrl: config.swayamUrl || 'http://localhost:7777',
            preferOffline: config.preferOffline ?? false,
            timeout: config.timeout || 3000,
        };
        // Core tools always available
        this.coreTools = [
            { name: 'Read', description: 'Read a file', inputSchema: { type: 'object', properties: { path: { type: 'string' } } } },
            { name: 'Write', description: 'Write to a file', inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } } } },
            { name: 'Edit', description: 'Edit a file', inputSchema: { type: 'object', properties: { path: { type: 'string' }, old: { type: 'string' }, new: { type: 'string' } } } },
            { name: 'Glob', description: 'Find files by pattern', inputSchema: { type: 'object', properties: { pattern: { type: 'string' } } } },
            { name: 'Grep', description: 'Search file contents', inputSchema: { type: 'object', properties: { pattern: { type: 'string' }, path: { type: 'string' } } } },
            { name: 'Bash', description: 'Run shell command', inputSchema: { type: 'object', properties: { command: { type: 'string' } } } },
        ];
    }
    async initialize() {
        this.packages = await detectANKRPackages();
        await this.discoverTools();
        this.emit('initialized', { packages: this.packages, toolCount: this.toolCache.length });
    }
    async discoverTools() {
        // Priority 1: @ankr/mcp-tools package
        if (this.packages['@ankr/mcp-tools']?.available) {
            try {
                const mod = await import('@ankr/mcp-tools');
                const getAllTools = mod.getAllTools || mod.default?.getAllTools;
                if (typeof getAllTools === 'function') {
                    this.toolCache = await getAllTools();
                    this.emit('discovered', { source: 'package', count: this.toolCache.length });
                    return this.toolCache;
                }
            }
            catch (error) {
                this.emit('fallback', { from: 'package', to: 'service', error });
            }
        }
        // Priority 2: MCP service
        try {
            const response = await fetch(`${this.config.mcpUrl}/tools`);
            if (response.ok) {
                this.toolCache = await response.json();
                this.emit('discovered', { source: 'service', count: this.toolCache.length });
                return this.toolCache;
            }
        }
        catch (error) {
            this.emit('fallback', { from: 'service', to: 'core', error });
        }
        // Priority 3: Core tools only
        this.toolCache = this.coreTools;
        this.emit('discovered', { source: 'core', count: this.toolCache.length });
        return this.toolCache;
    }
    getTools() {
        return this.toolCache.length > 0 ? this.toolCache : this.coreTools;
    }
    getToolsByCategory(category) {
        return this.toolCache.filter(t => t.category === category);
    }
    async executeTool(name, params) {
        // Priority 1: Package execution
        if (this.packages['@ankr/mcp-tools']?.available) {
            try {
                const mod = await import('@ankr/mcp-tools');
                const executeTool = mod.executeTool || mod.default?.executeTool;
                if (typeof executeTool === 'function') {
                    return await executeTool(name, params);
                }
            }
            catch (error) {
                this.emit('fallback', { from: 'package', to: 'service', error });
            }
        }
        // Priority 2: Service execution
        try {
            const response = await fetch(`${this.config.mcpUrl}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tool: name, params }),
            });
            if (response.ok) {
                return await response.json();
            }
        }
        catch (error) {
            this.emit('error', { tool: name, error });
            throw error;
        }
        throw new Error(`Tool ${name} not available`);
    }
}
export async function createUnifiedAdapter(config = {}) {
    const llm = new UnifiedLLMAdapter(config);
    const memory = new UnifiedMemoryAdapter(config);
    const mcp = new UnifiedMCPAdapter(config);
    await Promise.all([
        llm.initialize(),
        memory.initialize(),
        mcp.initialize(),
    ]);
    const llmStatus = llm.getStatus();
    const mode = determineMode(llmStatus.packages, llmStatus.services);
    return {
        llm,
        memory,
        mcp,
        status: () => ({
            packages: llmStatus.packages,
            services: llmStatus.services,
            mode,
        }),
    };
}
function determineMode(packages, services) {
    const hasPackages = Object.values(packages).some(p => p.available);
    const hasProxy = services.find(s => s.name === 'AI Proxy')?.available;
    const hasEon = services.find(s => s.name === 'EON Memory')?.available;
    if (hasPackages && hasProxy && hasEon) {
        return 'ANKR-Full (packages + services + proxy)';
    }
    if (hasPackages && hasProxy) {
        return 'ANKR-Hybrid (packages + proxy)';
    }
    if (hasPackages) {
        return 'ANKR-Offline (packages only)';
    }
    if (hasProxy) {
        return 'Proxy-Only (AI Proxy)';
    }
    return 'Direct-API (fallback)';
}
export default createUnifiedAdapter;
//# sourceMappingURL=unified.js.map