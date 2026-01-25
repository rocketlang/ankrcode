/**
 * Plugin System - Public API
 */
export type { Plugin, PluginMetadata, PluginConfigSchema, PluginHooks, PluginCommand, PluginLoaderOptions, LoadedPlugin, PluginEvent, } from './types.js';
export { pluginManager, loadPlugin, loadPackagePlugin, getPlugins, getPlugin, initializePlugins, } from './loader.js';
export { gitPlugin } from './builtin/git.js';
export { dockerPlugin } from './builtin/docker.js';
/**
 * Create a new plugin
 * Helper function for plugin authors
 */
export declare function createPlugin(definition: {
    id: string;
    name: string;
    version: string;
    description: string;
    author?: string;
    tags?: string[];
    tools?: import('./types.js').Plugin['tools'];
    commands?: import('./types.js').Plugin['commands'];
    hooks?: import('./types.js').Plugin['hooks'];
    configSchema?: import('./types.js').PluginConfigSchema;
    initialize?: import('./types.js').Plugin['initialize'];
}): import('./types.js').Plugin;
//# sourceMappingURL=index.d.ts.map