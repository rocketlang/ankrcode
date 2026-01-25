/**
 * AnkrCode Configuration System
 *
 * Loads settings from:
 * - ~/.ankrcode/settings.json (global)
 * - .ankrcode/settings.json (project)
 * - ANKRCODE.md (project rules)
 */
/**
 * Settings schema (mirrors Claude Code's settings.json)
 */
export interface AnkrCodeSettings {
    model?: string;
    fallbackModel?: string;
    language?: string;
    voiceEnabled?: boolean;
    voiceProvider?: 'bhashini' | 'whisper' | 'google' | 'azure';
    allowedCommands?: string[];
    blockedCommands?: string[];
    requireApproval?: boolean;
    enabledTools?: string[];
    disabledTools?: string[];
    defaultAgentModel?: string;
    maxAgentTurns?: number;
    hooks?: {
        preCommand?: string[];
        postCommand?: string[];
        preTool?: string[];
        postTool?: string[];
    };
    mcpServers?: Record<string, MCPServerConfig>;
    theme?: 'dark' | 'light' | 'auto';
    showProgressBars?: boolean;
    verboseOutput?: boolean;
    enableMemory?: boolean;
    memoryProvider?: 'eon' | 'postmemory' | 'local';
    custom?: Record<string, unknown>;
}
export interface MCPServerConfig {
    command: string;
    args?: string[];
    env?: Record<string, string>;
}
export interface ProjectRules {
    content: string;
    path: string;
    lastModified: Date;
}
export interface Config {
    settings: AnkrCodeSettings;
    projectRules: ProjectRules | null;
    globalSettingsPath: string;
    projectSettingsPath: string | null;
    projectRulesPath: string | null;
}
/**
 * Load configuration
 */
export declare function loadConfig(projectDir?: string): Promise<Config>;
/**
 * Get current config (loads if not initialized)
 */
export declare function getConfig(): Promise<Config>;
/**
 * Get current settings
 */
export declare function getSettings(): Promise<AnkrCodeSettings>;
/**
 * Get project rules content
 */
export declare function getProjectRules(): Promise<string | null>;
/**
 * Save global settings
 */
export declare function saveGlobalSettings(settings: Partial<AnkrCodeSettings>): Promise<void>;
/**
 * Save project settings
 */
export declare function saveProjectSettings(settings: Partial<AnkrCodeSettings>, projectDir?: string): Promise<void>;
/**
 * Initialize project configuration
 */
export declare function initProject(projectDir?: string): Promise<string>;
/**
 * Check if a command is allowed
 */
export declare function isCommandAllowed(command: string): Promise<boolean>;
/**
 * Check if a tool is enabled
 */
export declare function isToolEnabled(toolName: string): Promise<boolean>;
/**
 * Get hooks for a lifecycle event
 */
export declare function getHooks(event: keyof NonNullable<AnkrCodeSettings['hooks']>): Promise<string[]>;
/**
 * Reload configuration (for hot reload)
 */
export declare function invalidateConfig(): void;
/**
 * Get configuration summary for display
 */
export declare function getConfigSummary(): Promise<string>;
declare const _default: {
    loadConfig: typeof loadConfig;
    getConfig: typeof getConfig;
    getSettings: typeof getSettings;
    getProjectRules: typeof getProjectRules;
    saveGlobalSettings: typeof saveGlobalSettings;
    saveProjectSettings: typeof saveProjectSettings;
    initProject: typeof initProject;
    isCommandAllowed: typeof isCommandAllowed;
    isToolEnabled: typeof isToolEnabled;
    getHooks: typeof getHooks;
    invalidateConfig: typeof invalidateConfig;
    getConfigSummary: typeof getConfigSummary;
};
export default _default;
//# sourceMappingURL=index.d.ts.map