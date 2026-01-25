/**
 * AnkrCode Core Types
 * Inspired by Claude Code, built for Bharat
 */
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
export interface Todo {
    content: string;
    activeForm: string;
    status: 'pending' | 'in_progress' | 'completed';
}
export type AgentType = 'explore' | 'plan' | 'code' | 'review' | 'security' | 'bash' | 'general';
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
export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'mr' | 'bn' | 'gu' | 'ml' | 'pa' | 'or';
export interface I18nConfig {
    language: SupportedLanguage;
    fallback: SupportedLanguage;
}
export interface CLIOptions {
    lang?: SupportedLanguage;
    model?: string;
    offline?: boolean;
    voice?: boolean;
    personality?: 'default' | 'swayam';
    verbose?: boolean;
}
export interface RocketLangCommand {
    tool: string;
    parameters: Record<string, unknown>;
    raw: string;
}
export interface RocketLangParseResult {
    commands: RocketLangCommand[];
    errors: string[];
}
//# sourceMappingURL=types.d.ts.map