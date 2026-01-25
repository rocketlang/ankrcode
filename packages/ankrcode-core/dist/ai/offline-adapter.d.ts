/**
 * Offline AI Adapter
 * Supports local models via:
 * - Ollama (recommended)
 * - LM Studio
 * - llamafile
 * - LocalAI
 */
import type { ToolCall } from '../types.js';
interface OfflineResponse {
    content: string;
    toolCalls?: ToolCall[];
    model: string;
    provider: string;
}
interface LocalModel {
    name: string;
    size?: string;
    quantization?: string;
    context?: number;
    supportsTools?: boolean;
}
declare const RECOMMENDED_MODELS: Record<string, string[]>;
/**
 * Offline AI Adapter
 */
export declare class OfflineAdapter {
    private provider;
    private availableModels;
    private currentModel;
    constructor();
    private initialize;
    private checkProvider;
    private loadModels;
    private selectBestModel;
    /**
     * Check if offline mode is available
     */
    isAvailable(): boolean;
    /**
     * Get current provider
     */
    getProvider(): string;
    /**
     * Get available models
     */
    getModels(): LocalModel[];
    /**
     * Get current model
     */
    getCurrentModel(): string;
    /**
     * Set model to use
     */
    setModel(model: string): boolean;
    /**
     * Complete a chat request
     */
    complete(systemPrompt: string, messages: Array<{
        role: string;
        content: string;
    }>, options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
    }): Promise<OfflineResponse>;
    private completeOllama;
    private completeOpenAICompatible;
    /**
     * Pull a model (Ollama only)
     */
    pullModel(model: string): Promise<boolean>;
    /**
     * Get stats
     */
    getStats(): {
        available: boolean;
        provider: string;
        model: string;
        modelsCount: number;
        models: string[];
    };
}
export declare function getOfflineAdapter(): OfflineAdapter;
export { RECOMMENDED_MODELS };
//# sourceMappingURL=offline-adapter.d.ts.map