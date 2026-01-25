/**
 * Plugin System - Public API
 */
// Loader
export { pluginManager, loadPlugin, loadPackagePlugin, getPlugins, getPlugin, initializePlugins, } from './loader.js';
// Built-in plugins
export { gitPlugin } from './builtin/git.js';
export { dockerPlugin } from './builtin/docker.js';
/**
 * Create a new plugin
 * Helper function for plugin authors
 */
export function createPlugin(definition) {
    return {
        metadata: {
            id: definition.id,
            name: definition.name,
            version: definition.version,
            description: definition.description,
            author: definition.author,
            tags: definition.tags,
        },
        tools: definition.tools,
        commands: definition.commands,
        hooks: definition.hooks,
        configSchema: definition.configSchema,
        initialize: definition.initialize,
    };
}
//# sourceMappingURL=index.js.map