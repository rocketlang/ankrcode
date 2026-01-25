/**
 * RocketLang Module Resolver
 *
 * Resolves module paths and handles different import sources:
 * - Relative paths: "./utils", "../common"
 * - Package imports: "@ankr/payments", "lodash"
 * - Built-in modules: "collections", "strings", "files"
 * - Absolute paths: "/path/to/module"
 */
/**
 * Module resolution result
 */
export interface ModuleResolution {
    type: 'file' | 'package' | 'builtin' | 'url';
    path: string;
    originalPath: string;
    isBuiltin: boolean;
}
/**
 * Resolver configuration
 */
export interface ResolverConfig {
    /** Base directory for relative imports */
    baseDir: string;
    /** Additional search paths */
    searchPaths?: string[];
    /** Module aliases (e.g., "@" -> "src/") */
    aliases?: Record<string, string>;
    /** Allowed extensions */
    extensions?: string[];
    /** Node modules paths for package resolution */
    nodeModulesPaths?: string[];
}
/**
 * Built-in modules provided by RocketLang
 */
export declare const BUILTIN_MODULES: Set<string>;
/**
 * Hindi aliases for built-in modules
 */
export declare const MODULE_ALIASES: Record<string, string>;
/**
 * Module Resolver
 */
export declare class ModuleResolver {
    private config;
    private cache;
    constructor(config?: Partial<ResolverConfig>);
    /**
     * Resolve a module path
     *
     * @param importPath - The import path (e.g., "./utils", "@ankr/core", "collections")
     * @param fromFile - The file doing the import (for relative resolution)
     */
    resolve(importPath: string, fromFile?: string): ModuleResolution;
    /**
     * Resolve a relative or absolute file path
     */
    private resolveFile;
    /**
     * Resolve a package import
     */
    private resolvePackage;
    /**
     * Find file with extensions
     */
    private findWithExtensions;
    /**
     * Resolve package main entry point
     */
    private resolvePackageMain;
    /**
     * Find node_modules paths by walking up from baseDir
     */
    private findNodeModulesPaths;
    /**
     * Clear the resolution cache
     */
    clearCache(): void;
    /**
     * Get base directory
     */
    getBaseDir(): string;
    /**
     * Update base directory
     */
    setBaseDir(baseDir: string): void;
}
/**
 * Create a new module resolver
 */
export declare function createResolver(config?: Partial<ResolverConfig>): ModuleResolver;
declare const _default: {
    ModuleResolver: typeof ModuleResolver;
    createResolver: typeof createResolver;
    BUILTIN_MODULES: Set<string>;
    MODULE_ALIASES: Record<string, string>;
};
export default _default;
//# sourceMappingURL=resolver.d.ts.map