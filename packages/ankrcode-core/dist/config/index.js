/**
 * AnkrCode Configuration System
 *
 * Loads settings from:
 * - ~/.ankrcode/settings.json (global)
 * - .ankrcode/settings.json (project)
 * - ANKRCODE.md (project rules)
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
// Default settings
const DEFAULT_SETTINGS = {
    model: 'claude-3-opus',
    language: 'en',
    voiceEnabled: false,
    voiceProvider: 'bhashini',
    requireApproval: true,
    maxAgentTurns: 10,
    theme: 'auto',
    showProgressBars: true,
    verboseOutput: false,
    enableMemory: true,
    memoryProvider: 'eon',
};
// Singleton config instance
let currentConfig = null;
/**
 * Get global settings directory
 */
function getGlobalConfigDir() {
    return path.join(os.homedir(), '.ankrcode');
}
/**
 * Get global settings file path
 */
function getGlobalSettingsPath() {
    return path.join(getGlobalConfigDir(), 'settings.json');
}
/**
 * Find project root (looks for .ankrcode/, .git, or package.json)
 */
async function findProjectRoot(startDir = process.cwd()) {
    let dir = startDir;
    while (true) {
        // Check for .ankrcode directory
        try {
            await fs.access(path.join(dir, '.ankrcode'));
            return dir;
        }
        catch { }
        // Check for .git
        try {
            await fs.access(path.join(dir, '.git'));
            return dir;
        }
        catch { }
        // Check for package.json
        try {
            await fs.access(path.join(dir, 'package.json'));
            return dir;
        }
        catch { }
        // Move up
        const parent = path.dirname(dir);
        if (parent === dir) {
            // Reached root
            return null;
        }
        dir = parent;
    }
}
/**
 * Load settings from a file
 */
async function loadSettingsFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return {};
    }
}
/**
 * Load project rules from ANKRCODE.md
 */
async function loadProjectRules(projectRoot) {
    if (!projectRoot)
        return null;
    // Check for ANKRCODE.md in various locations
    const possiblePaths = [
        path.join(projectRoot, 'ANKRCODE.md'),
        path.join(projectRoot, '.ankrcode', 'rules.md'),
        path.join(projectRoot, 'ankrcode.md'),
    ];
    for (const rulesPath of possiblePaths) {
        try {
            const stat = await fs.stat(rulesPath);
            const content = await fs.readFile(rulesPath, 'utf-8');
            return {
                content,
                path: rulesPath,
                lastModified: stat.mtime,
            };
        }
        catch {
            continue;
        }
    }
    return null;
}
/**
 * Merge settings (project overrides global)
 */
function mergeSettings(global, project) {
    return {
        ...DEFAULT_SETTINGS,
        ...global,
        ...project,
        // Deep merge for hooks
        hooks: {
            ...global.hooks,
            ...project.hooks,
        },
        // Deep merge for MCP servers
        mcpServers: {
            ...global.mcpServers,
            ...project.mcpServers,
        },
        // Deep merge for custom
        custom: {
            ...global.custom,
            ...project.custom,
        },
    };
}
/**
 * Load configuration
 */
export async function loadConfig(projectDir) {
    const globalSettingsPath = getGlobalSettingsPath();
    const projectRoot = await findProjectRoot(projectDir || process.cwd());
    // Load global settings
    const globalSettings = await loadSettingsFile(globalSettingsPath);
    // Load project settings
    let projectSettings = {};
    let projectSettingsPath = null;
    if (projectRoot) {
        projectSettingsPath = path.join(projectRoot, '.ankrcode', 'settings.json');
        projectSettings = await loadSettingsFile(projectSettingsPath);
    }
    // Load project rules
    const projectRules = await loadProjectRules(projectRoot);
    // Merge settings
    const settings = mergeSettings(globalSettings, projectSettings);
    // Create config
    const config = {
        settings,
        projectRules,
        globalSettingsPath,
        projectSettingsPath,
        projectRulesPath: projectRules?.path || null,
    };
    currentConfig = config;
    return config;
}
/**
 * Get current config (loads if not initialized)
 */
export async function getConfig() {
    if (!currentConfig) {
        return loadConfig();
    }
    return currentConfig;
}
/**
 * Get current settings
 */
export async function getSettings() {
    const config = await getConfig();
    return config.settings;
}
/**
 * Get project rules content
 */
export async function getProjectRules() {
    const config = await getConfig();
    return config.projectRules?.content || null;
}
/**
 * Save global settings
 */
export async function saveGlobalSettings(settings) {
    const configDir = getGlobalConfigDir();
    const settingsPath = getGlobalSettingsPath();
    // Ensure directory exists
    await fs.mkdir(configDir, { recursive: true });
    // Load existing settings
    const existing = await loadSettingsFile(settingsPath);
    // Merge and save
    const merged = { ...existing, ...settings };
    await fs.writeFile(settingsPath, JSON.stringify(merged, null, 2), 'utf-8');
    // Invalidate cache
    currentConfig = null;
}
/**
 * Save project settings
 */
export async function saveProjectSettings(settings, projectDir) {
    const projectRoot = await findProjectRoot(projectDir || process.cwd());
    if (!projectRoot) {
        throw new Error('No project root found. Create a .ankrcode directory or initialize a git repo.');
    }
    const configDir = path.join(projectRoot, '.ankrcode');
    const settingsPath = path.join(configDir, 'settings.json');
    // Ensure directory exists
    await fs.mkdir(configDir, { recursive: true });
    // Load existing settings
    const existing = await loadSettingsFile(settingsPath);
    // Merge and save
    const merged = { ...existing, ...settings };
    await fs.writeFile(settingsPath, JSON.stringify(merged, null, 2), 'utf-8');
    // Invalidate cache
    currentConfig = null;
}
/**
 * Initialize project configuration
 */
export async function initProject(projectDir) {
    const dir = projectDir || process.cwd();
    const configDir = path.join(dir, '.ankrcode');
    const settingsPath = path.join(configDir, 'settings.json');
    const rulesPath = path.join(dir, 'ANKRCODE.md');
    // Create .ankrcode directory
    await fs.mkdir(configDir, { recursive: true });
    // Create default settings
    const defaultProjectSettings = {
        model: 'claude-3-sonnet',
        language: 'hi', // Default to Hindi for Indian projects
        requireApproval: true,
        hooks: {
            preCommand: [],
            postCommand: [],
        },
    };
    await fs.writeFile(settingsPath, JSON.stringify(defaultProjectSettings, null, 2), 'utf-8');
    // Create ANKRCODE.md template
    const rulesTemplate = `# AnkrCode Project Rules

This file contains instructions and context for AnkrCode AI assistant.

## Project Overview

[Describe your project here]

## Coding Standards

- [Add your coding standards]

## Architecture

[Describe your architecture]

## Important Files

- \`src/\` - Source code
- \`tests/\` - Test files

## Commands

\`\`\`bash
# Build
npm run build

# Test
npm test
\`\`\`

## Notes for AI

- [Add any special instructions for the AI]
`;
    await fs.writeFile(rulesPath, rulesTemplate, 'utf-8');
    // Invalidate cache
    currentConfig = null;
    return configDir;
}
/**
 * Check if a command is allowed
 */
export async function isCommandAllowed(command) {
    const settings = await getSettings();
    // Check blocked commands
    if (settings.blockedCommands?.length) {
        for (const pattern of settings.blockedCommands) {
            if (matchesPattern(command, pattern)) {
                return false;
            }
        }
    }
    // Check allowed commands
    if (settings.allowedCommands?.length) {
        for (const pattern of settings.allowedCommands) {
            if (matchesPattern(command, pattern)) {
                return true;
            }
        }
        // If allowedCommands is set, only those are allowed
        return false;
    }
    // Default: require approval if set
    return !settings.requireApproval;
}
/**
 * Check if a tool is enabled
 */
export async function isToolEnabled(toolName) {
    const settings = await getSettings();
    // Check disabled tools
    if (settings.disabledTools?.includes(toolName)) {
        return false;
    }
    // Check enabled tools
    if (settings.enabledTools?.length) {
        return settings.enabledTools.includes(toolName);
    }
    return true;
}
/**
 * Get hooks for a lifecycle event
 */
export async function getHooks(event) {
    const settings = await getSettings();
    return settings.hooks?.[event] || [];
}
/**
 * Pattern matching for command filtering
 */
function matchesPattern(command, pattern) {
    // Support simple wildcards
    if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(command);
    }
    // Prefix match
    return command.startsWith(pattern);
}
/**
 * Reload configuration (for hot reload)
 */
export function invalidateConfig() {
    currentConfig = null;
}
/**
 * Get configuration summary for display
 */
export async function getConfigSummary() {
    const config = await getConfig();
    const lines = [
        'AnkrCode Configuration:',
        `  Global: ${config.globalSettingsPath}`,
        `  Project: ${config.projectSettingsPath || 'Not found'}`,
        `  Rules: ${config.projectRulesPath || 'Not found'}`,
        '',
        'Settings:',
        `  Model: ${config.settings.model}`,
        `  Language: ${config.settings.language}`,
        `  Voice: ${config.settings.voiceEnabled ? `Yes (${config.settings.voiceProvider})` : 'No'}`,
        `  Memory: ${config.settings.enableMemory ? `Yes (${config.settings.memoryProvider})` : 'No'}`,
        `  Approval: ${config.settings.requireApproval ? 'Required' : 'Not required'}`,
    ];
    if (config.projectRules) {
        lines.push('', 'Project Rules:', `  Found at ${config.projectRules.path}`);
    }
    return lines.join('\n');
}
export default {
    loadConfig,
    getConfig,
    getSettings,
    getProjectRules,
    saveGlobalSettings,
    saveProjectSettings,
    initProject,
    isCommandAllowed,
    isToolEnabled,
    getHooks,
    invalidateConfig,
    getConfigSummary,
};
//# sourceMappingURL=index.js.map