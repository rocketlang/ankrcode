/**
 * Plugin Loader
 *
 * Discovers, loads, and manages plugins for AnkrCode.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import type {
  Plugin,
  PluginMetadata,
  LoadedPlugin,
  PluginLoaderOptions,
  PluginEvent,
  PluginHooks,
} from './types.js';
import type { Tool, ToolResult } from '../types.js';
import { registry } from '../tools/registry.js';

// Default plugin directories
const DEFAULT_PLUGIN_DIRS = [
  // User plugins
  path.join(process.env.HOME || '~', '.ankrcode', 'plugins'),
  // System plugins
  '/usr/local/share/ankrcode/plugins',
  // Project plugins
  '.ankrcode/plugins',
];

/**
 * Plugin Manager - Singleton
 */
class PluginManager extends EventEmitter {
  private plugins = new Map<string, LoadedPlugin>();
  private options: PluginLoaderOptions = {};
  private initialized = false;

  /**
   * Initialize plugin system
   */
  async initialize(options: PluginLoaderOptions = {}): Promise<void> {
    if (this.initialized) return;

    this.options = {
      pluginDirs: DEFAULT_PLUGIN_DIRS,
      packages: [],
      enabled: {},
      config: {},
      ...options,
    };

    // Load plugins from directories
    await this.discoverPlugins();

    // Load plugins from npm packages
    await this.loadPackagePlugins();

    this.initialized = true;
  }

  /**
   * Discover plugins from directories
   */
  private async discoverPlugins(): Promise<void> {
    for (const dir of this.options.pluginDirs || []) {
      const resolvedDir = dir.startsWith('~')
        ? path.join(process.env.HOME || '', dir.slice(1))
        : path.resolve(dir);

      if (!fs.existsSync(resolvedDir)) continue;

      const entries = fs.readdirSync(resolvedDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const pluginPath = path.join(resolvedDir, entry.name);
        const manifestPath = path.join(pluginPath, 'plugin.json');
        const indexPath = path.join(pluginPath, 'index.js');

        if (fs.existsSync(manifestPath) || fs.existsSync(indexPath)) {
          try {
            await this.loadPlugin(pluginPath);
          } catch (error) {
            console.error(`Failed to load plugin from ${pluginPath}:`, error);
          }
        }
      }
    }
  }

  /**
   * Load plugins from npm packages
   */
  private async loadPackagePlugins(): Promise<void> {
    for (const packageName of this.options.packages || []) {
      try {
        await this.loadPackage(packageName);
      } catch (error) {
        console.error(`Failed to load plugin package ${packageName}:`, error);
      }
    }
  }

  /**
   * Load a plugin from a directory
   */
  async loadPlugin(pluginPath: string): Promise<LoadedPlugin> {
    // Try loading manifest
    const manifestPath = path.join(pluginPath, 'plugin.json');
    let manifest: Partial<PluginMetadata> = {};

    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    }

    // Load the plugin module
    const indexPath = path.join(pluginPath, 'index.js');
    if (!fs.existsSync(indexPath)) {
      throw new Error(`Plugin entry point not found: ${indexPath}`);
    }

    const module = await import(indexPath);
    const plugin: Plugin = module.default || module;

    // Merge manifest with plugin metadata
    plugin.metadata = {
      ...plugin.metadata,
      ...manifest,
    };

    if (!plugin.metadata.id) {
      plugin.metadata.id = path.basename(pluginPath);
    }

    return this.registerPlugin(plugin, pluginPath);
  }

  /**
   * Load a plugin from npm package
   */
  async loadPackage(packageName: string): Promise<LoadedPlugin> {
    const module = await import(packageName);
    const plugin: Plugin = module.default || module;

    if (!plugin.metadata?.id) {
      plugin.metadata = {
        ...plugin.metadata,
        id: packageName,
        name: packageName,
        version: '0.0.0',
        description: `Plugin from ${packageName}`,
      };
    }

    return this.registerPlugin(plugin, packageName);
  }

  /**
   * Register a plugin
   */
  private async registerPlugin(plugin: Plugin, pluginPath: string): Promise<LoadedPlugin> {
    const id = plugin.metadata.id;

    // Check if already loaded
    if (this.plugins.has(id)) {
      throw new Error(`Plugin ${id} is already loaded`);
    }

    // Check if disabled
    const enabled = this.options.enabled?.[id] !== false;

    // Get plugin config
    const config = this.options.config?.[id] || {};

    // Initialize plugin
    if (enabled && plugin.initialize) {
      await plugin.initialize(config);
    }

    // Register tools
    if (enabled && plugin.tools) {
      for (const tool of plugin.tools) {
        registry.register({
          ...tool,
          name: `${id}:${tool.name}`, // Namespace the tool
        });
      }
    }

    // Call onLoad hook
    if (enabled && plugin.hooks?.onLoad) {
      await plugin.hooks.onLoad();
    }

    const loadedPlugin: LoadedPlugin = {
      plugin,
      path: pluginPath,
      enabled,
      loadedAt: new Date(),
    };

    this.plugins.set(id, loadedPlugin);

    this.emitEvent({ type: 'loaded', plugin: plugin.metadata });

    return loadedPlugin;
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(id: string): Promise<void> {
    const loaded = this.plugins.get(id);
    if (!loaded) return;

    const { plugin } = loaded;

    // Call onUnload hook
    if (plugin.hooks?.onUnload) {
      await plugin.hooks.onUnload();
    }

    // Unregister tools (would need registry support for removal)
    // For now, just mark as disabled

    this.plugins.delete(id);
    this.emitEvent({ type: 'unloaded', plugin: plugin.metadata });
  }

  /**
   * Get loaded plugins
   */
  getPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific plugin
   */
  getPlugin(id: string): LoadedPlugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Check if plugin is loaded
   */
  hasPlugin(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * Get all plugin tools
   */
  getPluginTools(): Tool[] {
    const tools: Tool[] = [];
    for (const { plugin, enabled } of this.plugins.values()) {
      if (enabled && plugin.tools) {
        tools.push(...plugin.tools);
      }
    }
    return tools;
  }

  /**
   * Execute hook across all plugins
   */
  async executeHook<K extends keyof PluginHooks>(
    hookName: K,
    ...args: Parameters<NonNullable<PluginHooks[K]>>
  ): Promise<void> {
    for (const { plugin, enabled } of this.plugins.values()) {
      if (!enabled || !plugin.hooks?.[hookName]) continue;

      try {
        const hook = plugin.hooks[hookName] as (...args: unknown[]) => Promise<void>;
        await hook(...args);
      } catch (error) {
        console.error(`Plugin hook ${hookName} failed:`, error);
      }
    }
  }

  /**
   * Get plugin commands
   */
  getCommands(): Array<{ pluginId: string; command: NonNullable<Plugin['commands']>[number] }> {
    const commands: Array<{ pluginId: string; command: NonNullable<Plugin['commands']>[number] }> = [];

    for (const { plugin, enabled } of this.plugins.values()) {
      if (!enabled || !plugin.commands) continue;

      for (const command of plugin.commands) {
        commands.push({ pluginId: plugin.metadata.id, command });
      }
    }

    return commands;
  }

  /**
   * Emit plugin event
   */
  private emitEvent(event: PluginEvent): void {
    this.emit(event.type, event);
    this.emit('plugin', event);
  }

  /**
   * Get plugin status summary
   */
  getStatus(): {
    total: number;
    enabled: number;
    disabled: number;
    plugins: Array<{
      id: string;
      name: string;
      version: string;
      enabled: boolean;
      tools: number;
      commands: number;
    }>;
  } {
    const plugins = Array.from(this.plugins.values()).map(({ plugin, enabled }) => ({
      id: plugin.metadata.id,
      name: plugin.metadata.name,
      version: plugin.metadata.version,
      enabled,
      tools: plugin.tools?.length || 0,
      commands: plugin.commands?.length || 0,
    }));

    return {
      total: plugins.length,
      enabled: plugins.filter((p) => p.enabled).length,
      disabled: plugins.filter((p) => !p.enabled).length,
      plugins,
    };
  }

  /**
   * Clear all plugins
   */
  async clear(): Promise<void> {
    for (const id of this.plugins.keys()) {
      await this.unloadPlugin(id);
    }
    this.initialized = false;
  }
}

// Singleton instance
export const pluginManager = new PluginManager();

// Convenience exports
export async function loadPlugin(path: string): Promise<LoadedPlugin> {
  return pluginManager.loadPlugin(path);
}

export async function loadPackagePlugin(packageName: string): Promise<LoadedPlugin> {
  return pluginManager.loadPackage(packageName);
}

export function getPlugins(): LoadedPlugin[] {
  return pluginManager.getPlugins();
}

export function getPlugin(id: string): LoadedPlugin | undefined {
  return pluginManager.getPlugin(id);
}

export async function initializePlugins(options?: PluginLoaderOptions): Promise<void> {
  return pluginManager.initialize(options);
}
