/**
 * Plugin System - Type Definitions
 *
 * Plugins extend AnkrCode with additional tools, commands, and capabilities.
 */

import type { Tool, ToolResult } from '../types.js';

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Unique plugin identifier */
  id: string;
  /** Display name */
  name: string;
  /** Version string */
  version: string;
  /** Plugin description */
  description: string;
  /** Author name/org */
  author?: string;
  /** Plugin homepage */
  homepage?: string;
  /** Required AnkrCode version */
  ankrcodeVersion?: string;
  /** Plugin tags for discovery */
  tags?: string[];
}

/**
 * Plugin configuration schema
 */
export interface PluginConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    default?: unknown;
    required?: boolean;
    env?: string; // Environment variable to read from
  };
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  /** Called when plugin is loaded */
  onLoad?: () => Promise<void>;
  /** Called when plugin is unloaded */
  onUnload?: () => Promise<void>;
  /** Called before a tool executes */
  beforeToolExecute?: (toolName: string, params: Record<string, unknown>) => Promise<void>;
  /** Called after a tool executes */
  afterToolExecute?: (toolName: string, result: ToolResult) => Promise<void>;
  /** Called on conversation start */
  onConversationStart?: () => Promise<void>;
  /** Called on conversation end */
  onConversationEnd?: () => Promise<void>;
}

/**
 * Plugin command (CLI extension)
 */
export interface PluginCommand {
  /** Command name (e.g., 'git-commit') */
  name: string;
  /** Short description */
  description: string;
  /** Command aliases */
  aliases?: string[];
  /** Command arguments */
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
    default?: string;
  }>;
  /** Command options */
  options?: Array<{
    flags: string; // e.g., '-m, --message <msg>'
    description: string;
    default?: string;
  }>;
  /** Command handler */
  handler: (args: Record<string, unknown>) => Promise<void>;
}

/**
 * Main plugin interface
 */
export interface Plugin {
  /** Plugin metadata */
  metadata: PluginMetadata;

  /** Configuration schema */
  configSchema?: PluginConfigSchema;

  /** Tools provided by this plugin */
  tools?: Tool[];

  /** CLI commands provided by this plugin */
  commands?: PluginCommand[];

  /** Lifecycle hooks */
  hooks?: PluginHooks;

  /** Initialize plugin with config */
  initialize?: (config: Record<string, unknown>) => Promise<void>;
}

/**
 * Plugin loader options
 */
export interface PluginLoaderOptions {
  /** Directories to scan for plugins */
  pluginDirs?: string[];
  /** Plugin packages to load */
  packages?: string[];
  /** Enable/disable specific plugins */
  enabled?: Record<string, boolean>;
  /** Plugin-specific configuration */
  config?: Record<string, Record<string, unknown>>;
}

/**
 * Loaded plugin instance
 */
export interface LoadedPlugin {
  plugin: Plugin;
  path: string;
  enabled: boolean;
  loadedAt: Date;
  error?: Error;
}

/**
 * Plugin registry events
 */
export type PluginEvent =
  | { type: 'loaded'; plugin: PluginMetadata }
  | { type: 'unloaded'; plugin: PluginMetadata }
  | { type: 'error'; plugin: PluginMetadata; error: Error };
