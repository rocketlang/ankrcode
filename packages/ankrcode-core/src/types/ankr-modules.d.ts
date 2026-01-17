/**
 * Type declarations for optional ANKR modules
 * These modules are dynamically imported and may not be installed
 */

declare module '@ankr/mcp-tools' {
  export function getAllTools(): Promise<any[]>;
  export function executeTool(name: string, params: any): Promise<any>;
}

declare module '@ankr/ai-router' {
  export class AIRouter {
    complete(params: {
      messages: any[];
      tools?: any[];
      model?: string;
    }): Promise<{
      content: string;
      toolCalls?: any[];
      tool_calls?: any[];
      model: string;
    }>;
  }
}

declare module '@ankr/eon' {
  export class EON {
    constructor(options?: { mode?: string });
    remember(key: string, value: any, metadata?: any): Promise<void>;
    recall(query: string): Promise<any[]>;
  }
}

declare module '@ankr/config' {
  export const PORTS: Record<string, Record<string, number>>;
  export function getBackendUrl(service: string, path?: string): string;
  export function getAppPort(app: string): number;
}

declare module '@ankr/i18n' {
  export function t(lang: string, key: string, params?: Record<string, any>): string;
  export function detectLanguage(): string;
}
