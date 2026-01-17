/**
 * AnkrCode Core Types
 * Inspired by Claude Code, built for Bharat
 */

// Tool System Types
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
}

export interface Tool extends ToolDefinition {
  handler: ToolHandler;
}

export type ToolHandler = (params: Record<string, unknown>) => Promise<ToolResult>;

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  data?: unknown;
  metadata?: Record<string, unknown>;
}

export interface ToolInvocation {
  name: string;
  parameters: Record<string, unknown>;
}

// JSON Schema subset
export interface JSONSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array';
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JSONSchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  format?: string;
}

// Conversation Types
export type MessageRole = 'user' | 'assistant' | 'tool' | 'system';

export interface Message {
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
}

export interface ConversationState {
  mode: 'execute' | 'plan';
  messages: Message[];
  todos: Todo[];
  filesRead: Set<string>;
  approvedCommands: Set<string>;
  planFile?: string;
}

// Todo Types
export interface Todo {
  content: string;
  activeForm: string;
  status: 'pending' | 'in_progress' | 'completed';
}

// Agent Types
export type AgentType =
  | 'explore'
  | 'plan'
  | 'code'
  | 'review'
  | 'security'
  | 'bash'
  | 'general';

export interface AgentConfig {
  type: AgentType;
  prompt: string;
  model?: 'haiku' | 'sonnet' | 'opus' | 'gpt-4' | 'groq';
  maxTurns?: number;
  runInBackground?: boolean;
  resume?: string;
}

export interface AgentResult {
  success: boolean;
  response: string;
  agentId: string;
  outputFile?: string;
}

// i18n Types
export type SupportedLanguage =
  | 'en'   // English
  | 'hi'   // Hindi
  | 'ta'   // Tamil
  | 'te'   // Telugu
  | 'kn'   // Kannada
  | 'mr'   // Marathi
  | 'bn'   // Bengali
  | 'gu'   // Gujarati
  | 'ml'   // Malayalam
  | 'pa'   // Punjabi
  | 'or';  // Odia

export interface I18nConfig {
  language: SupportedLanguage;
  fallback: SupportedLanguage;
}

// CLI Types
export interface CLIOptions {
  lang?: SupportedLanguage;
  model?: string;
  offline?: boolean;
  voice?: boolean;
  personality?: 'default' | 'swayam';
  verbose?: boolean;
}

// RocketLang Types
export interface RocketLangCommand {
  tool: string;
  parameters: Record<string, unknown>;
  raw: string;
}

export interface RocketLangParseResult {
  commands: RocketLangCommand[];
  errors: string[];
}
