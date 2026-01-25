/**
 * RocketLang Module Resolver
 *
 * Resolves module paths and handles different import sources:
 * - Relative paths: "./utils", "../common"
 * - Package imports: "@ankr/payments", "lodash"
 * - Built-in modules: "collections", "strings", "files"
 * - Absolute paths: "/path/to/module"
 */
import { existsSync } from 'fs';
import { resolve, dirname, join, extname, isAbsolute } from 'path';
/**
 * Built-in modules provided by RocketLang
 */
export const BUILTIN_MODULES = new Set([
    // Core
    'collections', // सूची संग्रह
    'strings', // पाठ
    'numbers', // संख्या
    'datetime', // तारीख-समय
    // I/O
    'files', // फ़ाइलें
    'console', // कंसोल
    'network', // नेटवर्क
    // Advanced
    'json', // JSON
    'crypto', // क्रिप्टो
    'testing', // परीक्षण
    'async', // एसिंक
]);
/**
 * Hindi aliases for built-in modules
 */
export const MODULE_ALIASES = {
    // Hindi
    'संग्रह': 'collections',
    'sangrah': 'collections',
    'पाठ': 'strings',
    'paath': 'strings',
    'संख्या': 'numbers',
    'sankhya': 'numbers',
    'तारीख': 'datetime',
    'tarikh': 'datetime',
    'समय': 'datetime',
    'samay': 'datetime',
    'फ़ाइलें': 'files',
    'फाइलें': 'files',
    'failein': 'files',
    'कंसोल': 'console',
    'console': 'console',
    'नेटवर्क': 'network',
    'network': 'network',
    'परीक्षण': 'testing',
    'parikshan': 'testing',
    'एसिंक': 'async',
    'async': 'async',
};
/**
 * Module Resolver
 */
export class ModuleResolver {
    config;
    cache = new Map();
    constructor(config = {}) {
        this.config = {
            baseDir: config.baseDir || process.cwd(),
            searchPaths: config.searchPaths || [],
            aliases: config.aliases || {},
            extensions: config.extensions || ['.rl', '.rocketlang', '.js', '.ts'],
            nodeModulesPaths: config.nodeModulesPaths || this.findNodeModulesPaths(config.baseDir || process.cwd()),
        };
    }
    /**
     * Resolve a module path
     *
     * @param importPath - The import path (e.g., "./utils", "@ankr/core", "collections")
     * @param fromFile - The file doing the import (for relative resolution)
     */
    resolve(importPath, fromFile) {
        const cacheKey = `${fromFile || ''}:${importPath}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        let resolution;
        // Normalize Hindi aliases
        const normalizedPath = MODULE_ALIASES[importPath] || importPath;
        // Check if it's a built-in module
        if (BUILTIN_MODULES.has(normalizedPath)) {
            resolution = {
                type: 'builtin',
                path: normalizedPath,
                originalPath: importPath,
                isBuiltin: true,
            };
        }
        // Check for URL imports
        else if (importPath.startsWith('http://') || importPath.startsWith('https://')) {
            resolution = {
                type: 'url',
                path: importPath,
                originalPath: importPath,
                isBuiltin: false,
            };
        }
        // Check for package imports (scoped or unscoped)
        else if (importPath.startsWith('@') || (!importPath.startsWith('.') && !isAbsolute(importPath))) {
            resolution = this.resolvePackage(importPath);
        }
        // Relative or absolute path
        else {
            resolution = this.resolveFile(importPath, fromFile);
        }
        this.cache.set(cacheKey, resolution);
        return resolution;
    }
    /**
     * Resolve a relative or absolute file path
     */
    resolveFile(importPath, fromFile) {
        const baseDir = fromFile ? dirname(fromFile) : this.config.baseDir;
        // Apply aliases
        let resolvedPath = importPath;
        for (const [alias, target] of Object.entries(this.config.aliases || {})) {
            if (importPath.startsWith(alias)) {
                resolvedPath = importPath.replace(alias, target);
                break;
            }
        }
        // Resolve to absolute path
        const absolutePath = isAbsolute(resolvedPath)
            ? resolvedPath
            : resolve(baseDir, resolvedPath);
        // Try with extensions if no extension provided
        const finalPath = this.findWithExtensions(absolutePath);
        return {
            type: 'file',
            path: finalPath,
            originalPath: importPath,
            isBuiltin: false,
        };
    }
    /**
     * Resolve a package import
     */
    resolvePackage(packagePath) {
        // Split package name and subpath
        const parts = packagePath.split('/');
        const isScoped = packagePath.startsWith('@');
        const packageName = isScoped ? `${parts[0]}/${parts[1]}` : parts[0];
        const subPath = isScoped ? parts.slice(2).join('/') : parts.slice(1).join('/');
        // Search in node_modules paths
        for (const nodeModulesPath of this.config.nodeModulesPaths || []) {
            const packageDir = join(nodeModulesPath, packageName);
            if (existsSync(packageDir)) {
                // If subPath specified, resolve it
                if (subPath) {
                    const fullPath = this.findWithExtensions(join(packageDir, subPath));
                    return {
                        type: 'package',
                        path: fullPath,
                        originalPath: packagePath,
                        isBuiltin: false,
                    };
                }
                // Otherwise, try package.json main or index
                const mainPath = this.resolvePackageMain(packageDir);
                return {
                    type: 'package',
                    path: mainPath,
                    originalPath: packagePath,
                    isBuiltin: false,
                };
            }
        }
        // Package not found - return as-is (might be external)
        return {
            type: 'package',
            path: packagePath,
            originalPath: packagePath,
            isBuiltin: false,
        };
    }
    /**
     * Find file with extensions
     */
    findWithExtensions(basePath) {
        // Check if already has extension
        const ext = extname(basePath);
        if (ext && existsSync(basePath)) {
            return basePath;
        }
        // Try with each extension
        for (const extension of this.config.extensions || []) {
            const withExt = `${basePath}${extension}`;
            if (existsSync(withExt)) {
                return withExt;
            }
        }
        // Try as directory with index file
        for (const extension of this.config.extensions || []) {
            const indexPath = join(basePath, `index${extension}`);
            if (existsSync(indexPath)) {
                return indexPath;
            }
        }
        // Return as-is (might not exist yet)
        return basePath;
    }
    /**
     * Resolve package main entry point
     */
    resolvePackageMain(packageDir) {
        const packageJsonPath = join(packageDir, 'package.json');
        if (existsSync(packageJsonPath)) {
            try {
                const packageJson = require(packageJsonPath);
                const main = packageJson.main || packageJson.module || 'index.js';
                return join(packageDir, main);
            }
            catch {
                // Fall through to index.js
            }
        }
        // Default to index.js
        return this.findWithExtensions(join(packageDir, 'index'));
    }
    /**
     * Find node_modules paths by walking up from baseDir
     */
    findNodeModulesPaths(baseDir) {
        const paths = [];
        let currentDir = baseDir;
        while (currentDir !== dirname(currentDir)) {
            const nodeModulesPath = join(currentDir, 'node_modules');
            if (existsSync(nodeModulesPath)) {
                paths.push(nodeModulesPath);
            }
            currentDir = dirname(currentDir);
        }
        // Also add global node_modules
        const globalPaths = [
            '/usr/lib/node_modules',
            '/usr/local/lib/node_modules',
        ];
        for (const p of globalPaths) {
            if (existsSync(p)) {
                paths.push(p);
            }
        }
        return paths;
    }
    /**
     * Clear the resolution cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get base directory
     */
    getBaseDir() {
        return this.config.baseDir;
    }
    /**
     * Update base directory
     */
    setBaseDir(baseDir) {
        this.config.baseDir = baseDir;
        this.clearCache();
    }
}
/**
 * Create a new module resolver
 */
export function createResolver(config) {
    return new ModuleResolver(config);
}
export default {
    ModuleResolver,
    createResolver,
    BUILTIN_MODULES,
    MODULE_ALIASES,
};
//# sourceMappingURL=resolver.js.map