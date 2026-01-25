/**
 * Plugin Loader
 *
 * Discovers, loads, and manages plugins for AnkrCode.
 */
import { EventEmitter } from 'events';
import type { Plugin, LoadedPlugin, PluginLoaderOptions, PluginHooks } from './types.js';
import type { Tool } from '../types.js';
/**
 * Plugin Manager - Singleton
 */
declare class PluginManager extends EventEmitter {
    private plugins;
    private options;
    private initialized;
    /**
     * Initialize plugin system
     */
    initialize(options?: PluginLoaderOptions): Promise<void>;
    /**
     * Discover plugins from directories
     */
    private discoverPlugins;
    /**
     * Load plugins from npm packages
     */
    private loadPackagePlugins;
    /**
     * Load a plugin from a directory
     */
    loadPlugin(pluginPath: string): Promise<LoadedPlugin>;
    /**
     * Load a plugin from npm package
     */
    loadPackage(packageName: string): Promise<LoadedPlugin>;
    /**
     * Register a plugin
     */
    private registerPlugin;
    /**
     * Unload a plugin
     */
    unloadPlugin(id: string): Promise<void>;
    /**
     * Get loaded plugins
     */
    getPlugins(): LoadedPlugin[];
    /**
     * Get a specific plugin
     */
    getPlugin(id: string): LoadedPlugin | undefined;
    /**
     * Check if plugin is loaded
     */
    hasPlugin(id: string): boolean;
    /**
     * Get all plugin tools
     */
    getPluginTools(): Tool[];
    /**
     * Execute hook across all plugins
     */
    executeHook<K extends keyof PluginHooks>(hookName: K, ...args: Parameters<NonNullable<PluginHooks[K]>>): Promise<void>;
    /**
     * Get plugin commands
     */
    getCommands(): Array<{
        pluginId: string;
        command: NonNullable<Plugin['commands']>[number];
    }>;
    /**
     * Emit plugin event
     */
    private emitEvent;
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
    };
    /**
     * Clear all plugins
     */
    clear(): Promise<void>;
}
export declare const pluginManager: PluginManager;
export declare function loadPlugin(path: string): Promise<LoadedPlugin>;
export declare function loadPackagePlugin(packageName: string): Promise<LoadedPlugin>;
export declare function getPlugins(): LoadedPlugin[];
export declare function getPlugin(id: string): LoadedPlugin | undefined;
export declare function initializePlugins(options?: PluginLoaderOptions): Promise<void>;
export {};
//# sourceMappingURL=loader.d.ts.map