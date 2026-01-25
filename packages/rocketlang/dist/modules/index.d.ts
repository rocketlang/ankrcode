/**
 * RocketLang Module System
 *
 * Provides import/export functionality:
 * - use/उपयोग - Import module
 * - export/निर्यात - Export from module
 * - from/से - Import source
 * - as/जैसे - Alias
 */
export { ModuleResolver, createResolver, BUILTIN_MODULES, MODULE_ALIASES, type ModuleResolution, type ResolverConfig, } from './resolver.js';
export { ModuleLoader, createLoader, type LoadedModule, type ModuleExports, type ImportSpec, type ExportSpec, type LoaderConfig, } from './loader.js';
import { ModuleResolver, createResolver } from './resolver.js';
import { ModuleLoader, createLoader } from './loader.js';
declare const _default: {
    ModuleResolver: typeof ModuleResolver;
    ModuleLoader: typeof ModuleLoader;
    createResolver: typeof createResolver;
    createLoader: typeof createLoader;
};
export default _default;
//# sourceMappingURL=index.d.ts.map