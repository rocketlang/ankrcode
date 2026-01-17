/**
 * Plugin System - Public API
 */

// Types
export type {
  Plugin,
  PluginMetadata,
  PluginConfigSchema,
  PluginHooks,
  PluginCommand,
  PluginLoaderOptions,
  LoadedPlugin,
  PluginEvent,
} from './types.js';

// Loader
export {
  pluginManager,
  loadPlugin,
  loadPackagePlugin,
  getPlugins,
  getPlugin,
  initializePlugins,
} from './loader.js';

// Built-in plugins
export { gitPlugin } from './builtin/git.js';
export { dockerPlugin } from './builtin/docker.js';

/**
 * Create a new plugin
 * Helper function for plugin authors
 */
export function createPlugin(definition: {
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
}): import('./types.js').Plugin {
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
