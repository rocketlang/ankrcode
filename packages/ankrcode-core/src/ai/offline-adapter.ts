/**
 * Offline AI Adapter
 * Supports local models via:
 * - Ollama (recommended)
 * - LM Studio
 * - llamafile
 * - LocalAI
 */

import type { ToolCall } from '../types.js';

// Response interface
interface OfflineResponse {
  content: string;
  toolCalls?: ToolCall[];
  model: string;
  provider: string;
}

// Model info
interface LocalModel {
  name: string;
  size?: string;
  quantization?: string;
  context?: number;
  supportsTools?: boolean;
}

// Provider configuration
interface ProviderConfig {
  name: string;
  baseUrl: string;
  chatEndpoint: string;
  modelsEndpoint: string;
  healthEndpoint?: string;
}

// Default configurations
const PROVIDERS: Record<string, ProviderConfig> = {
  ollama: {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434',
    chatEndpoint: '/api/chat',
    modelsEndpoint: '/api/tags',
    healthEndpoint: '/api/version',
  },
  lmstudio: {
    name: 'LM Studio',
    baseUrl: 'http://localhost:1234',
    chatEndpoint: '/v1/chat/completions',
    modelsEndpoint: '/v1/models',
  },
  llamafile: {
    name: 'llamafile',
    baseUrl: 'http://localhost:8080',
    chatEndpoint: '/completion',
    modelsEndpoint: '/models',
  },
  localai: {
    name: 'LocalAI',
    baseUrl: 'http://localhost:8080',
    chatEndpoint: '/v1/chat/completions',
    modelsEndpoint: '/v1/models',
  },
};

// Recommended models for different tasks
const RECOMMENDED_MODELS: Record<string, string[]> = {
  coding: ['codellama', 'deepseek-coder', 'starcoder2', 'codegemma'],
  general: ['llama3.2', 'mistral', 'gemma2', 'phi3'],
  multilingual: ['llama3.2', 'aya', 'gemma2'],
  small: ['phi3:mini', 'gemma2:2b', 'tinyllama'],
};

/**
 * Offline AI Adapter
 */
export class OfflineAdapter {
  private provider: ProviderConfig | null = null;
  private availableModels: LocalModel[] = [];
  private currentModel: string = 'llama3.2';

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Try providers in order of preference
    for (const [key, config] of Object.entries(PROVIDERS)) {
      if (await this.checkProvider(config)) {
        this.provider = config;
        console.log(`[OfflineAdapter] Using ${config.name} at ${config.baseUrl}`);
        await this.loadModels();
        return;
      }
    }
    console.log('[OfflineAdapter] No local model provider available');
  }

  private async checkProvider(config: ProviderConfig): Promise<boolean> {
    try {
      const endpoint = config.healthEndpoint || config.modelsEndpoint;
      const response = await fetch(`${config.baseUrl}${endpoint}`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async loadModels(): Promise<void> {
    if (!this.provider) return;

    try {
      const response = await fetch(`${this.provider.baseUrl}${this.provider.modelsEndpoint}`);
      if (!response.ok) return;

      const data = await response.json();

      // Parse based on provider format
      if (this.provider.name === 'Ollama') {
        const ollamaData = data as { models?: Array<{ name: string; size?: number }> };
        this.availableModels = (ollamaData.models || []).map(m => ({
          name: m.name,
          size: m.size ? `${Math.round(m.size / 1e9)}GB` : undefined,
        }));
      } else {
        // OpenAI-compatible format
        const openaiData = data as { data?: Array<{ id: string }> };
        this.availableModels = (openaiData.data || []).map(m => ({
          name: m.id,
        }));
      }

      // Select best model
      this.selectBestModel();
    } catch (error) {
      console.warn('[OfflineAdapter] Failed to load models:', (error as Error).message);
    }
  }

  private selectBestModel(): void {
    if (this.availableModels.length === 0) return;

    // Prefer coding models for code tasks
    for (const preferred of RECOMMENDED_MODELS.coding) {
      const found = this.availableModels.find(m =>
        m.name.toLowerCase().includes(preferred.toLowerCase())
      );
      if (found) {
        this.currentModel = found.name;
        console.log(`[OfflineAdapter] Selected model: ${this.currentModel}`);
        return;
      }
    }

    // Fall back to general models
    for (const preferred of RECOMMENDED_MODELS.general) {
      const found = this.availableModels.find(m =>
        m.name.toLowerCase().includes(preferred.toLowerCase())
      );
      if (found) {
        this.currentModel = found.name;
        console.log(`[OfflineAdapter] Selected model: ${this.currentModel}`);
        return;
      }
    }

    // Use first available
    this.currentModel = this.availableModels[0].name;
    console.log(`[OfflineAdapter] Selected model: ${this.currentModel}`);
  }

  /**
   * Check if offline mode is available
   */
  isAvailable(): boolean {
    return this.provider !== null;
  }

  /**
   * Get current provider
   */
  getProvider(): string {
    return this.provider?.name || 'none';
  }

  /**
   * Get available models
   */
  getModels(): LocalModel[] {
    return this.availableModels;
  }

  /**
   * Get current model
   */
  getCurrentModel(): string {
    return this.currentModel;
  }

  /**
   * Set model to use
   */
  setModel(model: string): boolean {
    const found = this.availableModels.find(m => m.name === model);
    if (found) {
      this.currentModel = model;
      return true;
    }
    return false;
  }

  /**
   * Complete a chat request
   */
  async complete(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<OfflineResponse> {
    if (!this.provider) {
      throw new Error('No local model provider available. Install Ollama: https://ollama.ai');
    }

    const model = options?.model || this.currentModel;

    if (this.provider.name === 'Ollama') {
      return this.completeOllama(systemPrompt, messages, model, options);
    } else {
      return this.completeOpenAICompatible(systemPrompt, messages, model, options);
    }
  }

  private async completeOllama(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
    model: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<OfflineResponse> {
    const response = await fetch(`${this.provider!.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 4096,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama error: ${text}`);
    }

    const data = await response.json() as {
      message: { content: string };
      model: string;
    };

    return {
      content: data.message.content,
      model: data.model,
      provider: 'Ollama',
    };
  }

  private async completeOpenAICompatible(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
    model: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<OfflineResponse> {
    const response = await fetch(`${this.provider!.baseUrl}${this.provider!.chatEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${this.provider!.name} error: ${text}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      model: string;
    };

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      provider: this.provider!.name,
    };
  }

  /**
   * Pull a model (Ollama only)
   */
  async pullModel(model: string): Promise<boolean> {
    if (!this.provider || this.provider.name !== 'Ollama') {
      return false;
    }

    console.log(`[OfflineAdapter] Pulling model: ${model}...`);

    try {
      const response = await fetch(`${this.provider.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model }),
      });

      if (response.ok) {
        await this.loadModels();
        return true;
      }
    } catch (error) {
      console.error('[OfflineAdapter] Pull failed:', (error as Error).message);
    }
    return false;
  }

  /**
   * Get stats
   */
  getStats(): {
    available: boolean;
    provider: string;
    model: string;
    modelsCount: number;
    models: string[];
  } {
    return {
      available: this.isAvailable(),
      provider: this.getProvider(),
      model: this.currentModel,
      modelsCount: this.availableModels.length,
      models: this.availableModels.map(m => m.name),
    };
  }
}

// Singleton
let instance: OfflineAdapter | null = null;

export function getOfflineAdapter(): OfflineAdapter {
  if (!instance) {
    instance = new OfflineAdapter();
  }
  return instance;
}

// Recommended models export
export { RECOMMENDED_MODELS };
