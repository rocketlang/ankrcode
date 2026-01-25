/**
 * Conversation Manager
 * Handles multi-turn conversations with tool execution
 * Now with persistence via EON Memory
 */
import { getAIRouterAdapter } from '../ai/router-adapter.js';
import { registry } from '../tools/registry.js';
import { getEONAdapter } from '../memory/eon-adapter.js';
/**
 * ConversationManager - Orchestrates AI conversations with tool use
 * Now with persistence support via EON Memory
 */
export class ConversationManager {
    config;
    state;
    aiAdapter = getAIRouterAdapter();
    sessionId;
    createdAt;
    eonAdapter = getEONAdapter();
    constructor(config) {
        this.config = {
            autoSave: true,
            persistenceEnabled: true,
            ...config,
        };
        this.sessionId = config.sessionId || this.generateSessionId();
        this.createdAt = new Date();
        this.state = {
            mode: 'execute',
            messages: [],
            todos: [],
            filesRead: new Set(),
            approvedCommands: new Set(),
        };
    }
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `conv_${timestamp}_${random}`;
    }
    /**
     * Get current session ID
     */
    getSessionId() {
        return this.sessionId;
    }
    /**
     * Process a user message and return the assistant's response
     */
    async chat(userMessage) {
        // Add user message to history
        this.state.messages.push({ role: 'user', content: userMessage });
        // Build system prompt
        const systemPrompt = this.buildSystemPrompt();
        // Call LLM
        let response = await this.callLLM(systemPrompt);
        // Process tool calls in a loop (agentic loop)
        while (response.toolCalls && response.toolCalls.length > 0) {
            // Execute tools
            const results = await this.executeToolCalls(response.toolCalls);
            // Add assistant message with tool calls
            this.state.messages.push({
                role: 'assistant',
                content: response.content,
                toolCalls: response.toolCalls,
            });
            // Add tool results
            this.state.messages.push({
                role: 'tool',
                content: '',
                toolResults: results,
            });
            // Continue conversation
            response = await this.callLLM(systemPrompt);
        }
        // Add final response
        this.state.messages.push({ role: 'assistant', content: response.content });
        return response.content;
    }
    /**
     * Call the LLM with current conversation state
     */
    async callLLM(systemPrompt) {
        const { offline } = this.config;
        // In offline mode, use local model
        if (offline) {
            return this.callLocalModel(systemPrompt);
        }
        // Use AIRouterAdapter for multi-provider support
        const tools = this.getToolDefinitions();
        const messages = this.state.messages.map(m => ({
            role: m.role,
            content: m.content,
            toolCalls: m.toolCalls,
            toolResults: m.toolResults,
        }));
        try {
            const response = await this.aiAdapter.complete(systemPrompt, messages, tools, {
                model: this.config.model,
                provider: this.mapModelToProvider(this.config.model || 'claude'),
                temperature: 0.7,
                maxTokens: 8192,
                strategy: this.config.strategy,
            });
            if (this.config.verbose) {
                console.log(`[LLM] Provider: ${response.provider}, Model: ${response.model}`);
                if (response.usage) {
                    console.log(`[LLM] Tokens: ${response.usage.inputTokens} in, ${response.usage.outputTokens} out`);
                }
                if (response.cost) {
                    console.log(`[LLM] Cost: $${response.cost.toFixed(6)}`);
                }
            }
            return {
                content: response.content,
                toolCalls: response.toolCalls,
            };
        }
        catch (error) {
            throw new Error(`LLM error: ${error.message}`);
        }
    }
    /**
     * Map model shorthand to provider
     */
    mapModelToProvider(model) {
        const map = {
            claude: 'anthropic',
            gpt: 'openai',
            groq: 'groq',
            gemini: 'gemini',
            deepseek: 'deepseek',
        };
        return map[model.toLowerCase()];
    }
    /**
     * Call local model (Ollama)
     */
    async callLocalModel(systemPrompt) {
        try {
            const response = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3.2',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...this.state.messages.map(m => ({
                            role: m.role === 'tool' ? 'assistant' : m.role,
                            content: m.role === 'tool' ? JSON.stringify(m.toolResults) : m.content,
                        })),
                    ],
                    stream: false,
                }),
            });
            if (!response.ok) {
                throw new Error('Local model not available');
            }
            const data = await response.json();
            return {
                content: data.message.content,
                toolCalls: [],
            };
        }
        catch {
            throw new Error('Offline mode requires Ollama running on localhost:11434');
        }
    }
    /**
     * Execute tool calls
     */
    async executeToolCalls(toolCalls) {
        const results = [];
        for (const call of toolCalls) {
            try {
                // Dynamic import to avoid circular dependencies
                const { executor } = await import('../tools/executor.js');
                const result = await executor.execute({
                    name: call.name,
                    parameters: call.parameters,
                });
                results.push(result);
                // Track file reads for Edit safety
                if (call.name === 'Read' && result.success) {
                    this.state.filesRead.add(call.parameters.file_path);
                }
            }
            catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                });
            }
        }
        return results;
    }
    /**
     * Build system prompt based on configuration
     */
    buildSystemPrompt() {
        const { language, personality } = this.config;
        const basePrompt = personality === 'swayam'
            ? this.getSwayamPrompt(language)
            : this.getDefaultPrompt(language);
        const modePrompt = this.state.mode === 'plan'
            ? '\n\nYou are in PLAN MODE. Create a detailed plan before implementing.'
            : '';
        const todoPrompt = this.state.todos.length > 0
            ? `\n\nCurrent todos:\n${this.state.todos.map(t => `- [${t.status}] ${t.content}`).join('\n')}`
            : '';
        return basePrompt + modePrompt + todoPrompt;
    }
    getDefaultPrompt(language) {
        return `You are AnkrCode, an AI coding assistant for Bharat.
You help users with software development tasks.
You have access to tools for file operations, search, execution, and more.
Current language: ${language}
Working directory: ${process.cwd()}`;
    }
    getSwayamPrompt(language) {
        const prompts = {
            hi: `आप स्वयं हैं, एक AI coding assistant।
आप friendly और encouraging हैं।
जब user Hindi में बात करे तो Hindi में जवाब दें।
Complex concepts को simple Hindi में explain करें।
Tools का use करके coding tasks में help करें।
Working directory: ${process.cwd()}`,
            en: `You are Swayam, a friendly AI coding assistant.
You are encouraging and helpful.
Explain complex concepts in simple terms.
Use tools to help with coding tasks.
Working directory: ${process.cwd()}`,
            ta: `நீங்கள் ஸ்வயம், ஒரு AI coding assistant.
நீங்கள் நட்பான மற்றும் உற்சாகமளிக்கும்.
Tamil-ல் பேசும்போது Tamil-ல் பதிலளிக்கவும்.
Working directory: ${process.cwd()}`,
            te: `మీరు స్వయం, AI coding assistant.
మీరు స్నేహపూర్వకంగా మరియు ప్రోత్సాహకరంగా ఉంటారు.
Working directory: ${process.cwd()}`,
            kn: `ನೀವು ಸ್ವಯಂ, AI coding assistant.
ನೀವು ಸ್ನೇಹಪರ ಮತ್ತು ಪ್ರೋತ್ಸಾಹಕರಾಗಿದ್ದೀರಿ.
Working directory: ${process.cwd()}`,
            mr: `तुम्ही स्वयं आहात, AI coding assistant.
तुम्ही मैत्रीपूर्ण आणि प्रोत्साहक आहात.
Working directory: ${process.cwd()}`,
            bn: `আপনি স্বয়ং, AI coding assistant।
আপনি বন্ধুত্বপূর্ণ এবং উৎসাহজনক।
Working directory: ${process.cwd()}`,
            gu: `તમે સ્વયં છો, AI coding assistant.
તમે મૈત્રીપૂર્ણ અને પ્રોત્સાહક છો.
Working directory: ${process.cwd()}`,
            ml: `നിങ്ങൾ സ്വയം ആണ്, AI coding assistant.
നിങ്ങൾ സൗഹൃദപരവും പ്രോത്സാഹജനകവുമാണ്.
Working directory: ${process.cwd()}`,
            pa: `ਤੁਸੀਂ ਸਵੈ ਹੋ, AI coding assistant.
ਤੁਸੀਂ ਦੋਸਤਾਨਾ ਅਤੇ ਉਤਸ਼ਾਹਜਨਕ ਹੋ.
Working directory: ${process.cwd()}`,
            or: `ଆପଣ ସ୍ୱୟଂ, AI coding assistant।
ଆପଣ ବନ୍ଧୁତ୍ୱପୂର୍ଣ୍ଣ ଏବଂ ଉତ୍ସାହଜନକ।
Working directory: ${process.cwd()}`,
        };
        return prompts[language] || prompts.en;
    }
    /**
     * Get tool definitions from registry
     */
    getToolDefinitions() {
        return registry.getAnthropicFormat();
    }
    // Public methods for state access
    getTodos() {
        return this.state.todos;
    }
    setTodos(todos) {
        this.state.todos = todos;
    }
    getMode() {
        return this.state.mode;
    }
    setMode(mode) {
        this.state.mode = mode;
    }
    hasReadFile(path) {
        return this.state.filesRead.has(path);
    }
    /**
     * Get available LLM providers
     */
    getAvailableProviders() {
        return this.aiAdapter.getAvailableProviders();
    }
    /**
     * Check if ai-router is available
     */
    isRouterAvailable() {
        return this.aiAdapter.isRouterAvailable();
    }
    // ============================================================================
    // Persistence Methods
    // ============================================================================
    /**
     * Save conversation to EON Memory
     */
    async saveConversation() {
        if (!this.config.persistenceEnabled) {
            return false;
        }
        try {
            const saved = {
                sessionId: this.sessionId,
                config: {
                    model: this.config.model,
                    provider: this.config.provider,
                    language: this.config.language,
                    personality: this.config.personality,
                    offline: this.config.offline,
                    strategy: this.config.strategy,
                },
                messages: this.state.messages,
                todos: this.state.todos,
                mode: this.state.mode,
                filesRead: Array.from(this.state.filesRead),
                createdAt: this.createdAt.toISOString(),
                updatedAt: new Date().toISOString(),
                messageCount: this.state.messages.filter(m => m.role === 'user').length,
                summary: this.generateSummary(),
            };
            // Use EON remember with the conversation as content
            await this.eonAdapter.remember(JSON.stringify(saved), {
                type: 'episode',
                metadata: {
                    conversationType: 'ankrcode-conversation',
                    sessionId: this.sessionId,
                    language: this.config.language,
                    messageCount: saved.messageCount,
                },
            });
            if (this.config.verbose) {
                console.log(`[Persistence] Saved conversation ${this.sessionId}`);
            }
            return true;
        }
        catch (error) {
            if (this.config.verbose) {
                console.error('[Persistence] Save failed:', error);
            }
            return false;
        }
    }
    /**
     * Load conversation from EON Memory
     */
    async loadConversation(sessionId) {
        if (!this.config.persistenceEnabled) {
            return false;
        }
        try {
            const results = await this.eonAdapter.recall({
                query: `sessionId:${sessionId}`,
                limit: 1,
                type: 'episode',
            });
            if (!results || results.length === 0) {
                return false;
            }
            const result = results[0];
            const saved = JSON.parse(result.memory.content);
            // Restore state
            this.sessionId = saved.sessionId;
            this.state.messages = saved.messages;
            this.state.todos = saved.todos;
            this.state.mode = saved.mode;
            this.state.filesRead = new Set(saved.filesRead);
            this.createdAt = new Date(saved.createdAt);
            // Update config with saved values
            this.config = {
                ...this.config,
                ...saved.config,
            };
            if (this.config.verbose) {
                console.log(`[Persistence] Loaded conversation ${sessionId} (${saved.messageCount} messages)`);
            }
            return true;
        }
        catch (error) {
            if (this.config.verbose) {
                console.error('[Persistence] Load failed:', error);
            }
            return false;
        }
    }
    /**
     * List saved conversations
     */
    async listConversations() {
        try {
            const results = await this.eonAdapter.recall({
                query: 'ankrcode-conversation',
                limit: 50,
                type: 'episode',
            });
            if (!results || !Array.isArray(results)) {
                return [];
            }
            return results.map((r) => {
                try {
                    const saved = JSON.parse(r.memory.content);
                    return {
                        sessionId: saved.sessionId,
                        summary: saved.summary || 'No summary',
                        messageCount: saved.messageCount,
                        createdAt: saved.createdAt,
                        updatedAt: saved.updatedAt,
                        language: saved.config.language,
                    };
                }
                catch {
                    return null;
                }
            }).filter(Boolean);
        }
        catch (error) {
            if (this.config.verbose) {
                console.error('[Persistence] List failed:', error);
            }
            return [];
        }
    }
    /**
     * Delete a saved conversation
     * Note: EON doesn't have delete, so we mark it as deleted
     */
    async deleteConversation(sessionId) {
        // EON Memory doesn't support deletion
        // In a real implementation, we'd need to add this to EON
        // For now, we just log that deletion isn't supported
        if (this.config.verbose) {
            console.log(`[Persistence] Delete not supported by memory backend for ${sessionId}`);
        }
        return false;
    }
    /**
     * Generate a summary of the conversation
     */
    generateSummary() {
        const userMessages = this.state.messages.filter(m => m.role === 'user');
        if (userMessages.length === 0) {
            return 'Empty conversation';
        }
        // Use first user message as summary
        const firstMessage = userMessages[0].content;
        return firstMessage.length > 100
            ? firstMessage.substring(0, 100) + '...'
            : firstMessage;
    }
    /**
     * Export conversation to JSON
     */
    exportToJSON() {
        const exported = {
            sessionId: this.sessionId,
            config: {
                model: this.config.model,
                provider: this.config.provider,
                language: this.config.language,
                personality: this.config.personality,
                offline: this.config.offline,
                strategy: this.config.strategy,
            },
            messages: this.state.messages,
            todos: this.state.todos,
            mode: this.state.mode,
            filesRead: Array.from(this.state.filesRead),
            createdAt: this.createdAt.toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: this.state.messages.filter(m => m.role === 'user').length,
            summary: this.generateSummary(),
        };
        return JSON.stringify(exported, null, 2);
    }
    /**
     * Import conversation from JSON
     */
    importFromJSON(json) {
        try {
            const saved = JSON.parse(json);
            this.sessionId = saved.sessionId;
            this.state.messages = saved.messages;
            this.state.todos = saved.todos;
            this.state.mode = saved.mode;
            this.state.filesRead = new Set(saved.filesRead);
            this.createdAt = new Date(saved.createdAt);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get conversation statistics
     */
    getStats() {
        const userMessages = this.state.messages.filter(m => m.role === 'user').length;
        const assistantMessages = this.state.messages.filter(m => m.role === 'assistant').length;
        const toolCalls = this.state.messages
            .filter(m => m.role === 'assistant' && m.toolCalls)
            .reduce((sum, m) => sum + (m.toolCalls?.length || 0), 0);
        return {
            sessionId: this.sessionId,
            messageCount: this.state.messages.length,
            userMessages,
            assistantMessages,
            toolCalls,
            duration: Date.now() - this.createdAt.getTime(),
            language: this.config.language,
        };
    }
    /**
     * Clear conversation history (start fresh but keep session)
     */
    clear() {
        this.state.messages = [];
        this.state.todos = [];
        this.state.filesRead.clear();
        this.state.approvedCommands.clear();
        this.state.mode = 'execute';
    }
}
//# sourceMappingURL=manager.js.map