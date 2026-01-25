/**
 * RocketLang Module System
 *
 * Provides import/export functionality:
 * - use/उपयोग - Import module
 * - export/निर्यात - Export from module
 * - from/से - Import source
 * - as/जैसे - Alias
 */
export { ModuleResolver, createResolver, BUILTIN_MODULES, MODULE_ALIASES, } from './resolver.js';
export { ModuleLoader, createLoader, } from './loader.js';
import { ModuleResolver, createResolver } from './resolver.js';
import { ModuleLoader, createLoader } from './loader.js';
export default {
    ModuleResolver,
    ModuleLoader,
    createResolver,
    createLoader,
};
//# sourceMappingURL=index.js.map