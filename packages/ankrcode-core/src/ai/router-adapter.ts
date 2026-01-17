/**
 * AI Router Adapter
 * Integrates @ankr/ai-router when available
 * Also supports ai-proxy (port 4444) as primary provider
 * Falls back to direct API calls if neither available
 */

import type { ToolCall, ToolResult } from '../types.js';

// AI Proxy configuration (ANKR's unified gateway)
const AI_PROXY_URL = process.env.AI_PROXY_URL || 'http://localhost:4444';

// Types from ai-router
interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCallAIRouter[];
  tool_call_id?: string;
}

interface ToolCallAIRouter {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface LLMRequest {
  provider?: string;
  model?: string;
  messages: LLMMessage[];
  temperature?: number;
  max_tokens?: number;
  strategy?: string;
  tools?: AIRouterTool[];
  tool_choice?: string | object;
}

interface AIRouterTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

interface LLMResponse {
  provider: string;
  model: string;
  content: string;
  usage: { input_tokens: number; output_tokens: number; total_tokens: number };
  cost: { input_cost: number; output_cost: number; total_cost: number };
  latency_ms: number;
  tool_calls?: ToolCallAIRouter[];
  finish_reason?: 'stop' | 'tool_calls' | 'length';
}

// AnkrCode internal response format
export interface AnkrCodeLLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  provider?: string;
  model?: string;
  usage?: { inputTokens: number; outputTokens: number };
  cost?: number;
}

// Tool definition for LLM
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
 * Map shorthand model names to full API model names
 */
function resolveModelName(model: string): string {
  const modelMap: Record<string, string> = {
    // Shorthand mappings
    'claude': 'claude-sonnet-4-20250514',
    'claude-sonnet': 'claude-sonnet-4-20250514',
    'claude-opus': 'claude-opus-4-20250514',
    'claude-haiku': 'claude-3-5-haiku-20241022',
    'claude-3-sonnet': 'claude-3-5-sonnet-20241022',
    'claude-3-opus': 'claude-3-opus-20240229',
    'gpt': 'gpt-4o',
    'gpt-4': 'gpt-4o',
    'gpt-4o': 'gpt-4o',
    'gpt-4-turbo': 'gpt-4-turbo',
    'groq': 'llama-3.3-70b-versatile',
    'deepseek': 'deepseek-chat',
    'gemini': 'gemini-1.5-pro',
  };

  // Return mapped name or original if not found
  return modelMap[model.toLowerCase()] || model;
}

/**
 * AI Router Adapter
 * Priority order:
 * 1. AI Proxy (port 4444) - ANKR's unified gateway
 * 2. @ankr/ai-router - Multi-provider support
 * 3. Direct API calls - Fallback to Anthropic/OpenAI
 */
export class AIRouterAdapter {
  private aiRouter: unknown = null;
  private useRouter = false;
  private aiProxyAvailable = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // First, check if ai-proxy is available
    await this.checkAIProxy();

    // If no ai-proxy, try ai-router
    if (!this.aiProxyAvailable) {
      await this.tryLoadAIRouter();
    }
  }

  private async checkAIProxy(): Promise<void> {
    try {
      const response = await fetch(`${AI_PROXY_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        this.aiProxyAvailable = true;
        console.log('[AIRouterAdapter] Using ai-proxy at', AI_PROXY_URL);
      }
    } catch {
      this.aiProxyAvailable = false;
    }
  }

  private async tryLoadAIRouter(): Promise<void> {
    try {
      // Try to dynamically import ai-router
      const module: any = await import('@ankr/ai-router');
      const AIRouter = module.AIRouter || module.default;
      this.aiRouter = new AIRouter();
      this.useRouter = true;
      console.log('[AIRouterAdapter] Using @ankr/ai-router for multi-LLM support');
    } catch {
      console.log('[AIRouterAdapter] Using direct API calls');
      this.useRouter = false;
    }
  }

  /**
   * Check if ai-router is available
   */
  isRouterAvailable(): boolean {
    return this.aiProxyAvailable || (this.useRouter && this.aiRouter !== null);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    if (this.aiProxyAvailable) {
      return ['ai-proxy', 'anthropic', 'openai', 'groq', 'deepseek', 'gemini'];
    }

    if (this.useRouter) {
      return (this.aiRouter as { getAvailableProviders(): string[] }).getAvailableProviders();
    }

    // Return providers based on available env vars
    const providers: string[] = [];
    if (process.env.ANTHROPIC_API_KEY) providers.push('anthropic');
    if (process.env.OPENAI_API_KEY) providers.push('openai');
    if (process.env.GROQ_API_KEY) providers.push('groq');
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) providers.push('gemini');
    if (process.env.DEEPSEEK_API_KEY) providers.push('deepseek');
    return providers;
  }

  /**
   * Complete a chat request
   * Priority: ai-proxy -> ai-router -> direct API
   */
  async complete(
    systemPrompt: string,
    messages: Array<{ role: string; content: string; toolCalls?: ToolCall[]; toolResults?: ToolResult[] }>,
    tools: ToolDefinitionForLLM[],
    options: {
      model?: string;
      provider?: string;
      temperature?: number;
      maxTokens?: number;
      strategy?: 'primary' | 'cheapest' | 'fastest' | 'quality';
    } = {}
  ): Promise<AnkrCodeLLMResponse> {
    // Convert internal format to ai-router format
    const aiRouterMessages = this.convertMessages(systemPrompt, messages);
    const aiRouterTools = this.convertTools(tools);

    // Try ai-proxy first
    if (this.aiProxyAvailable) {
      try {
        return await this.completeWithAIProxy(aiRouterMessages, aiRouterTools, options);
      } catch (error) {
        console.warn('[AIRouterAdapter] ai-proxy failed, falling back:', (error as Error).message);
      }
    }

    // Try ai-router
    if (this.useRouter) {
      try {
        return await this.completeWithRouter(aiRouterMessages, aiRouterTools, options);
      } catch (error) {
        console.warn('[AIRouterAdapter] ai-router failed, falling back:', (error as Error).message);
      }
    }

    // Direct API calls (Anthropic as last resort)
    return this.completeDirectly(aiRouterMessages, aiRouterTools, options);
  }

  /**
   * Complete using AI Proxy (ANKR's unified gateway)
   */
  private async completeWithAIProxy(
    messages: LLMMessage[],
    tools: AIRouterTool[],
    options: {
      model?: string;
      provider?: string;
      temperature?: number;
      maxTokens?: number;
      strategy?: string;
    }
  ): Promise<AnkrCodeLLMResponse> {
    const response = await fetch(`${AI_PROXY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: resolveModelName(options.model || 'claude'),
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 8192,
        // AI Proxy specific options
        strategy: options.strategy || 'quality',
        fallback: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI Proxy error: ${error}`);
    }

    const data = await response.json() as {
      choices: Array<{
        message: {
          content: string | null;
          tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
        };
      }>;
      model?: string;
      usage?: { prompt_tokens: number; completion_tokens: number };
      provider?: string;
    };

    const msg = data.choices[0].message;
    const toolCalls = msg.tool_calls?.map(tc => ({
      id: tc.id,
      name: tc.function.name,
      parameters: JSON.parse(tc.function.arguments),
    }));

    return {
      content: msg.content || '',
      toolCalls: toolCalls?.length ? toolCalls : undefined,
      provider: data.provider || 'ai-proxy',
      model: data.model || options.model || 'unknown',
      usage: data.usage ? {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      } : undefined,
    };
  }

  private convertMessages(
    systemPrompt: string,
    messages: Array<{ role: string; content: string; toolCalls?: ToolCall[]; toolResults?: ToolResult[] }>
  ): LLMMessage[] {
    const result: LLMMessage[] = [];

    // Add system prompt
    if (systemPrompt) {
      result.push({ role: 'system', content: systemPrompt });
    }

    // Convert messages
    for (const msg of messages) {
      if (msg.role === 'tool') {
        // Tool results
        if (msg.toolResults) {
          for (const tr of msg.toolResults) {
            result.push({
              role: 'tool',
              content: tr.success ? (tr.output || '') : (tr.error || 'Error'),
              tool_call_id: 'tool_call_' + Date.now(), // Would need proper ID tracking
            });
          }
        }
      } else if (msg.role === 'assistant' && msg.toolCalls?.length) {
        // Assistant with tool calls
        result.push({
          role: 'assistant',
          content: msg.content,
          tool_calls: msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.parameters),
            },
          })),
        });
      } else {
        result.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    return result;
  }

  private convertTools(tools: ToolDefinitionForLLM[]): AIRouterTool[] {
    return tools.map(t => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      },
    }));
  }

  private async completeWithRouter(
    messages: LLMMessage[],
    tools: AIRouterTool[],
    options: {
      model?: string;
      provider?: string;
      temperature?: number;
      maxTokens?: number;
      strategy?: string;
    }
  ): Promise<AnkrCodeLLMResponse> {
    const router = this.aiRouter as { complete(req: LLMRequest): Promise<LLMResponse> };

    const response = await router.complete({
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      provider: options.provider as LLMRequest['provider'],
      model: resolveModelName(options.model || 'claude'),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      strategy: options.strategy as LLMRequest['strategy'],
    });

    return {
      content: response.content,
      toolCalls: response.tool_calls?.map(tc => ({
        id: tc.id,
        name: tc.function.name,
        parameters: JSON.parse(tc.function.arguments),
      })),
      provider: response.provider,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      cost: response.cost.total_cost,
    };
  }

  private async completeDirectly(
    messages: LLMMessage[],
    tools: AIRouterTool[],
    options: {
      model?: string;
      provider?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AnkrCodeLLMResponse> {
    const provider = options.provider || this.detectDefaultProvider();

    switch (provider) {
      case 'anthropic':
        return this.callAnthropicDirect(messages, tools, options);
      case 'openai':
        return this.callOpenAIDirect(messages, tools, options);
      case 'groq':
        return this.callGroqDirect(messages, tools, options);
      default:
        return this.callAnthropicDirect(messages, tools, options);
    }
  }

  private detectDefaultProvider(): string {
    if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
    if (process.env.OPENAI_API_KEY) return 'openai';
    if (process.env.GROQ_API_KEY) return 'groq';
    throw new Error('No API key configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY');
  }

  private async callAnthropicDirect(
    messages: LLMMessage[],
    tools: AIRouterTool[],
    options: { model?: string; temperature?: number; maxTokens?: number }
  ): Promise<AnkrCodeLLMResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

    const systemMsg = messages.find(m => m.role === 'system');
    const otherMsgs = messages.filter(m => m.role !== 'system');

    const payload: Record<string, unknown> = {
      model: resolveModelName(options.model || 'claude'),
      max_tokens: options.maxTokens || 8192,
      temperature: options.temperature ?? 0.7,
      messages: otherMsgs.map(m => {
        if (m.role === 'tool') {
          return {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: m.tool_call_id, content: m.content }],
          };
        }
        if (m.role === 'assistant' && m.tool_calls) {
          return {
            role: 'assistant',
            content: m.tool_calls.map(tc => ({
              type: 'tool_use',
              id: tc.id,
              name: tc.function.name,
              input: JSON.parse(tc.function.arguments),
            })),
          };
        }
        return { role: m.role, content: m.content };
      }),
    };

    if (systemMsg) payload.system = systemMsg.content;

    if (tools.length > 0) {
      payload.tools = tools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      }));
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
      usage?: { input_tokens: number; output_tokens: number };
    };

    const content: string[] = [];
    const toolCalls: ToolCall[] = [];

    for (const block of data.content) {
      if (block.type === 'text') {
        content.push(block.text || '');
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id || '',
          name: block.name || '',
          parameters: block.input || {},
        });
      }
    }

    return {
      content: content.join('\n'),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      provider: 'anthropic',
      model: resolveModelName(options.model || 'claude'),
      usage: data.usage ? {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      } : undefined,
    };
  }

  private async callOpenAIDirect(
    messages: LLMMessage[],
    tools: AIRouterTool[],
    options: { model?: string; temperature?: number; maxTokens?: number }
  ): Promise<AnkrCodeLLMResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');

    const payload: Record<string, unknown> = {
      model: resolveModelName(options.model || 'gpt'),
      messages: messages.map(m => {
        if (m.role === 'tool') {
          return { role: 'tool', content: m.content, tool_call_id: m.tool_call_id };
        }
        if (m.role === 'assistant' && m.tool_calls) {
          return { role: 'assistant', content: m.content || null, tool_calls: m.tool_calls };
        }
        return { role: m.role, content: m.content };
      }),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 4096,
    };

    if (tools.length > 0) {
      payload.tools = tools;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json() as {
      choices: Array<{
        message: {
          content: string | null;
          tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
        };
      }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    const msg = data.choices[0].message;
    const toolCalls = msg.tool_calls?.map(tc => ({
      id: tc.id,
      name: tc.function.name,
      parameters: JSON.parse(tc.function.arguments),
    }));

    return {
      content: msg.content || '',
      toolCalls: toolCalls?.length ? toolCalls : undefined,
      provider: 'openai',
      model: resolveModelName(options.model || 'gpt'),
      usage: data.usage ? {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      } : undefined,
    };
  }

  private async callGroqDirect(
    messages: LLMMessage[],
    _tools: AIRouterTool[],
    options: { model?: string; temperature?: number; maxTokens?: number }
  ): Promise<AnkrCodeLLMResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not set');

    // Groq uses OpenAI-compatible API but limited tool support
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: resolveModelName(options.model || 'groq'),
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    return {
      content: data.choices[0].message.content,
      provider: 'groq',
      model: resolveModelName(options.model || 'groq'),
      usage: data.usage ? {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      } : undefined,
    };
  }
}

// Singleton instance
let adapterInstance: AIRouterAdapter | null = null;

export function getAIRouterAdapter(): AIRouterAdapter {
  if (!adapterInstance) {
    adapterInstance = new AIRouterAdapter();
  }
  return adapterInstance;
}
