/**
 * Adapter Tests
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { getMCPAdapter } from '../mcp/adapter.js';
import { getEONAdapter } from '../memory/eon-adapter.js';
import { getVoiceAdapter } from '../voice/adapter.js';
import { getOfflineAdapter } from '../ai/offline-adapter.js';
describe('MCP Adapter', () => {
    let mcp;
    beforeAll(async () => {
        mcp = getMCPAdapter();
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
    });
    it('should initialize', () => {
        expect(mcp).toBeDefined();
    });
    it('should report availability status', () => {
        const available = mcp.isAvailable();
        expect(typeof available).toBe('boolean');
    });
    it('should provide stats', () => {
        const stats = mcp.getStats();
        expect(stats).toHaveProperty('totalTools');
        expect(stats).toHaveProperty('categories');
        expect(stats).toHaveProperty('available');
    });
    it('should search tools', () => {
        const results = mcp.searchTools('gst');
        expect(Array.isArray(results)).toBe(true);
    });
    it('should get tools by category', () => {
        const tools = mcp.getToolsByCategory('compliance');
        expect(Array.isArray(tools)).toBe(true);
    });
    it('should convert to AnkrCode format', () => {
        const tools = mcp.getAllAsAnkrCodeTools();
        expect(Array.isArray(tools)).toBe(true);
        if (tools.length > 0) {
            expect(tools[0]).toHaveProperty('name');
            expect(tools[0]).toHaveProperty('description');
            expect(tools[0]).toHaveProperty('handler');
        }
    });
});
describe('EON Adapter', () => {
    let eon;
    beforeAll(async () => {
        eon = getEONAdapter();
        await new Promise(resolve => setTimeout(resolve, 1000));
    });
    it('should initialize', () => {
        expect(eon).toBeDefined();
    });
    it('should report backend', () => {
        const backend = eon.getBackend();
        expect(['eon-service', 'eon-embedded', 'postmemory', 'local']).toContain(backend);
    });
    it('should remember content', async () => {
        const memory = await eon.remember('Test memory content', { type: 'fact' });
        expect(memory).toHaveProperty('id');
        expect(memory).toHaveProperty('content');
        expect(memory.content).toBe('Test memory content');
    });
    it('should recall memories', async () => {
        const results = await eon.recall({ query: 'test', limit: 5 });
        expect(Array.isArray(results)).toBe(true);
    });
    it('should get session context', async () => {
        const context = await eon.getSessionContext('test');
        expect(context).toHaveProperty('memories');
        expect(context).toHaveProperty('facts');
        expect(context).toHaveProperty('relevantKnowledge');
    });
    it('should learn facts', async () => {
        const memory = await eon.learnFact('TypeScript is a typed superset of JavaScript');
        expect(memory.type).toBe('fact');
    });
    it('should store procedures', async () => {
        const memory = await eon.storeProcedure('Deploy', ['Build', 'Test', 'Push', 'Deploy']);
        expect(memory.type).toBe('procedure');
        expect(memory.content).toContain('Deploy');
    });
    it('should provide stats', () => {
        const stats = eon.getStats();
        expect(stats).toHaveProperty('totalMemories');
        expect(stats).toHaveProperty('backend');
        expect(stats).toHaveProperty('available');
    });
});
describe('Voice Adapter', () => {
    let voice;
    beforeAll(async () => {
        voice = getVoiceAdapter({ language: 'hi' });
        await new Promise(resolve => setTimeout(resolve, 500));
    });
    it('should initialize', () => {
        expect(voice).toBeDefined();
    });
    it('should report backend', () => {
        const backend = voice.getBackend();
        expect(['bhashini', 'whisper', 'google', 'azure', 'local']).toContain(backend);
    });
    it('should report supported languages', () => {
        const languages = voice.getSupportedLanguages();
        expect(Array.isArray(languages)).toBe(true);
        expect(languages.length).toBeGreaterThan(0);
    });
});
describe('Offline Adapter', () => {
    let offline;
    beforeAll(async () => {
        offline = getOfflineAdapter();
        await new Promise(resolve => setTimeout(resolve, 1000));
    });
    it('should initialize', () => {
        expect(offline).toBeDefined();
    });
    it('should report availability', () => {
        const available = offline.isAvailable();
        expect(typeof available).toBe('boolean');
    });
    it('should report provider', () => {
        const provider = offline.getProvider();
        expect(['Ollama', 'LM Studio', 'llamafile', 'LocalAI', 'none']).toContain(provider);
    });
    it('should provide stats', () => {
        const stats = offline.getStats();
        expect(stats).toHaveProperty('available');
        expect(stats).toHaveProperty('provider');
        expect(stats).toHaveProperty('model');
        expect(stats).toHaveProperty('modelsCount');
    });
    it('should list models', () => {
        const models = offline.getModels();
        expect(Array.isArray(models)).toBe(true);
    });
});
//# sourceMappingURL=adapters.test.js.map