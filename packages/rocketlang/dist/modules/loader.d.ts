/**
 * RocketLang Module Loader
 *
 * Loads and caches modules, handles exports/imports, and manages module scope.
 *
 * Keywords:
 * - use/उपयोग - Import module
 * - export/निर्यात - Export from module
 * - from/से - Import source
 * - as/जैसे - Alias
 */
import { ModuleResolver } from './resolver.js';
import type { RocketCommand, ParseResult } from '../index.js';
import type { RocketValue, RocketFunction } from '../runtime/index.js';
/**
 * Module exports
 */
export interface ModuleExports {
    [name: string]: RocketValue | RocketFunction;
}
/**
 * Loaded module
 */
export interface LoadedModule {
    path: string;
    exports: ModuleExports;
    dependencies: string[];
    isBuiltin: boolean;
    source?: string;
}
/**
 * Import specification
 */
export interface ImportSpec {
    /** Items to import (empty = import all) */
    items: Array<{
        name: string;
        alias?: string;
    }>;
    /** Module path */
    path: string;
    /** Import as namespace (import * as X) */
    namespace?: string;
}
/**
 * Export specification
 */
export interface ExportSpec {
    /** Export name */
    name: string;
    /** Actual value name (if different) */
    localName?: string;
    /** Re-export from another module */
    from?: string;
}
/**
 * Module loader configuration
 */
export interface LoaderConfig {
    /** Module resolver */
    resolver?: ModuleResolver;
    /** Parser function for .rl files */
    parser?: (source: string) => ParseResult;
    /** Executor for running module code */
    executor?: (commands: RocketCommand[]) => Promise<ModuleExports>;
}
/**
 * Module Loader
 */
export declare class ModuleLoader {
    private resolver;
    private cache;
    private parser?;
    private executor?;
    private loading;
    constructor(config?: LoaderConfig);
    /**
     * Load a module
     *
     * @param importPath - The import path
     * @param fromFile - The file doing the import
     */
    load(importPath: string, fromFile?: string): Promise<LoadedModule>;
    /**
     * Load a built-in module
     */
    private loadBuiltin;
    /**
     * Load a file module (.rl)
     */
    private loadFile;
    /**
     * Load a JavaScript/TypeScript module
     */
    private loadJavaScriptModule;
    /**
     * Load a package module
     */
    private loadPackage;
    /**
     * Load a URL module
     */
    private loadUrl;
    /**
     * Import specific items from a module
     */
    import(spec: ImportSpec, fromFile?: string): Promise<ModuleExports>;
    /**
     * Check if a module is loaded
     */
    isLoaded(path: string): boolean;
    /**
     * Get a loaded module
     */
    getModule(path: string): LoadedModule | undefined;
    /**
     * Clear the module cache
     */
    clearCache(): void;
    /**
     * Get all loaded modules
     */
    getAllModules(): Map<string, LoadedModule>;
    /**
     * Set parser
     */
    setParser(parser: (source: string) => ParseResult): void;
    /**
     * Set executor
     */
    setExecutor(executor: (commands: RocketCommand[]) => Promise<ModuleExports>): void;
}
/**
 * Create a new module loader
 */
export declare function createLoader(config?: LoaderConfig): ModuleLoader;
declare const _default: {
    ModuleLoader: typeof ModuleLoader;
    createLoader: typeof createLoader;
    BUILTIN_IMPLEMENTATIONS: Record<string, () => ModuleExports>;
};
export default _default;
//# sourceMappingURL=loader.d.ts.map