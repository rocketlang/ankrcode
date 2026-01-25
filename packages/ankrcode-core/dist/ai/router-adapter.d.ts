/**
 * AI Router Adapter
 * Integrates @ankr/ai-router when available
 * Also supports ai-proxy (port 4444) as primary provider
 * Falls back to direct API calls if neither available
 */
import type { ToolCall, ToolResult } from '../types.js';
export interface AnkrCodeLLMResponse {
    content: string;
    toolCalls?: ToolCall[];
    provider?: string;
    model?: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
    cost?: number;
}
export interface ToolDefinitionForLLM {
    name: string;
    description: string;
    input_schema: {
        type: string;
        properties?: Record<string, unknown>;
        required?: string[];
        [key: string]: unknown;
    };
}
/**
 * AI Router Adapter
 * Priority order:
 * 1. AI Proxy (port 4444) - ANKR's unified gateway
 * 2. @ankr/ai-router - Multi-provider support
 * 3. Direct API calls - Fallback to Anthropic/OpenAI
 */
export declare class AIRouterAdapter {
    private aiRouter;
    private useRouter;
    private aiProxyAvailable;
    constructor();
    private initialize;
    private checkAIProxy;
    private tryLoadAIRouter;
    /**
     * Check if ai-router is available
     */
    isRouterAvailable(): boolean;
    /**
     * Get available providers
     */
    getAvailableProviders(): string[];
    /**
     * Complete a chat request
     * Priority: ai-proxy -> ai-router -> direct API
     */
    complete(systemPrompt: string, messages: Array<{
        role: string;
        content: string;
        toolCalls?: ToolCall[];
        toolResults?: ToolResult[];
    }>, tools: ToolDefinitionForLLM[], options?: {
        model?: string;
        provider?: string;
        temperature?: number;
        maxTokens?: number;
        strategy?: 'primary' | 'cheapest' | 'fastest' | 'quality';
    }): Promise<AnkrCodeLLMResponse>;
    /**
     * Complete using AI Proxy (ANKR's unified gateway)
     */
    private completeWithAIProxy;
    private convertMessages;
    private convertTools;
    private completeWithRouter;
    private completeDirectly;
    private detectDefaultProvider;
    private callAnthropicDirect;
    private callOpenAIDirect;
    private callGroqDirect;
}
export declare function getAIRouterAdapter(): AIRouterAdapter;
//# sourceMappingURL=router-adapter.d.ts.map