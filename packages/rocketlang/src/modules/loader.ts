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

import { readFileSync, existsSync } from 'fs';
import { ModuleResolver, BUILTIN_MODULES, type ModuleResolution } from './resolver.js';
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
 * Built-in module implementations
 */
const BUILTIN_IMPLEMENTATIONS: Record<string, () => ModuleExports> = {
  collections: () => ({
    // List/Array operations
    map: createBuiltinFn('map', ['list', 'fn']),
    filter: createBuiltinFn('filter', ['list', 'fn']),
    reduce: createBuiltinFn('reduce', ['list', 'fn', 'initial']),
    find: createBuiltinFn('find', ['list', 'fn']),
    some: createBuiltinFn('some', ['list', 'fn']),
    every: createBuiltinFn('every', ['list', 'fn']),
    sort: createBuiltinFn('sort', ['list', 'fn']),
    reverse: createBuiltinFn('reverse', ['list']),
    slice: createBuiltinFn('slice', ['list', 'start', 'end']),
    concat: createBuiltinFn('concat', ['list1', 'list2']),
    flatten: createBuiltinFn('flatten', ['list']),
    unique: createBuiltinFn('unique', ['list']),

    // Map/Dict operations
    keys: createBuiltinFn('keys', ['map']),
    values: createBuiltinFn('values', ['map']),
    entries: createBuiltinFn('entries', ['map']),
    has_key: createBuiltinFn('has_key', ['map', 'key']),
    merge: createBuiltinFn('merge', ['map1', 'map2']),
  }),

  strings: () => ({
    uppercase: createBuiltinFn('uppercase', ['text']),
    lowercase: createBuiltinFn('lowercase', ['text']),
    trim: createBuiltinFn('trim', ['text']),
    split: createBuiltinFn('split', ['text', 'delimiter']),
    join: createBuiltinFn('join', ['list', 'delimiter']),
    replace: createBuiltinFn('replace', ['text', 'search', 'replacement']),
    contains: createBuiltinFn('contains', ['text', 'search']),
    starts_with: createBuiltinFn('starts_with', ['text', 'prefix']),
    ends_with: createBuiltinFn('ends_with', ['text', 'suffix']),
    substring: createBuiltinFn('substring', ['text', 'start', 'end']),
    pad_left: createBuiltinFn('pad_left', ['text', 'length', 'char']),
    pad_right: createBuiltinFn('pad_right', ['text', 'length', 'char']),
  }),

  numbers: () => ({
    abs: createBuiltinFn('abs', ['n']),
    round: createBuiltinFn('round', ['n', 'decimals']),
    floor: createBuiltinFn('floor', ['n']),
    ceil: createBuiltinFn('ceil', ['n']),
    min: createBuiltinFn('min', ['a', 'b']),
    max: createBuiltinFn('max', ['a', 'b']),
    random: createBuiltinFn('random', []),
    random_int: createBuiltinFn('random_int', ['min', 'max']),
    parse_int: createBuiltinFn('parse_int', ['text']),
    parse_float: createBuiltinFn('parse_float', ['text']),
  }),

  datetime: () => ({
    now: createBuiltinFn('now', []),
    today: createBuiltinFn('today', []),
    format_date: createBuiltinFn('format_date', ['date', 'format']),
    parse_date: createBuiltinFn('parse_date', ['text', 'format']),
    add_days: createBuiltinFn('add_days', ['date', 'days']),
    add_months: createBuiltinFn('add_months', ['date', 'months']),
    diff_days: createBuiltinFn('diff_days', ['date1', 'date2']),
    is_before: createBuiltinFn('is_before', ['date1', 'date2']),
    is_after: createBuiltinFn('is_after', ['date1', 'date2']),
  }),

  files: () => ({
    read_file: createBuiltinFn('read_file', ['path']),
    write_file: createBuiltinFn('write_file', ['path', 'content']),
    append_file: createBuiltinFn('append_file', ['path', 'content']),
    delete_file: createBuiltinFn('delete_file', ['path']),
    exists: createBuiltinFn('exists', ['path']),
    list_dir: createBuiltinFn('list_dir', ['path']),
    make_dir: createBuiltinFn('make_dir', ['path']),
    copy_file: createBuiltinFn('copy_file', ['src', 'dest']),
    move_file: createBuiltinFn('move_file', ['src', 'dest']),
  }),

  console: () => ({
    print: createBuiltinFn('print', ['value']),
    log: createBuiltinFn('log', ['value']),
    error: createBuiltinFn('error', ['value']),
    warn: createBuiltinFn('warn', ['value']),
    info: createBuiltinFn('info', ['value']),
    clear: createBuiltinFn('clear', []),
    input: createBuiltinFn('input', ['prompt']),
  }),

  network: () => ({
    fetch: createBuiltinFn('fetch', ['url', 'options']),
    get: createBuiltinFn('get', ['url']),
    post: createBuiltinFn('post', ['url', 'body']),
    put: createBuiltinFn('put', ['url', 'body']),
    delete: createBuiltinFn('delete', ['url']),
  }),

  json: () => ({
    parse: createBuiltinFn('parse', ['text']),
    stringify: createBuiltinFn('stringify', ['value']),
    read_json: createBuiltinFn('read_json', ['path']),
    write_json: createBuiltinFn('write_json', ['path', 'value']),
  }),

  crypto: () => ({
    hash: createBuiltinFn('hash', ['text', 'algorithm']),
    random_bytes: createBuiltinFn('random_bytes', ['length']),
    uuid: createBuiltinFn('uuid', []),
    encrypt: createBuiltinFn('encrypt', ['text', 'key']),
    decrypt: createBuiltinFn('decrypt', ['encrypted', 'key']),
  }),

  testing: () => ({
    test: createBuiltinFn('test', ['name', 'fn']),
    expect: createBuiltinFn('expect', ['actual']),
    assert: createBuiltinFn('assert', ['condition', 'message']),
    assert_equal: createBuiltinFn('assert_equal', ['actual', 'expected']),
    assert_not_equal: createBuiltinFn('assert_not_equal', ['actual', 'expected']),
    assert_throws: createBuiltinFn('assert_throws', ['fn']),
  }),

  async: () => ({
    sleep: createBuiltinFn('sleep', ['ms']),
    timeout: createBuiltinFn('timeout', ['fn', 'ms']),
    parallel: createBuiltinFn('parallel', ['tasks']),
    race: createBuiltinFn('race', ['tasks']),
  }),
};

/**
 * Create a built-in function definition
 */
function createBuiltinFn(name: string, params: string[]): RocketFunction {
  return {
    type: 'function',
    name,
    params: params.map(p => ({ name: p })),
    body: [],
    async: false,
  };
}

/**
 * Module Loader
 */
export class ModuleLoader {
  private resolver: ModuleResolver;
  private cache: Map<string, LoadedModule> = new Map();
  private parser?: (source: string) => ParseResult;
  private executor?: (commands: RocketCommand[]) => Promise<ModuleExports>;
  private loading: Set<string> = new Set(); // Circular dependency detection

  constructor(config: LoaderConfig = {}) {
    this.resolver = config.resolver || new ModuleResolver();
    this.parser = config.parser;
    this.executor = config.executor;
  }

  /**
   * Load a module
   *
   * @param importPath - The import path
   * @param fromFile - The file doing the import
   */
  async load(importPath: string, fromFile?: string): Promise<LoadedModule> {
    const resolution = this.resolver.resolve(importPath, fromFile);

    // Check cache
    if (this.cache.has(resolution.path)) {
      return this.cache.get(resolution.path)!;
    }

    // Check for circular dependency
    if (this.loading.has(resolution.path)) {
      throw new Error(`Circular dependency detected: ${resolution.path}`);
    }

    this.loading.add(resolution.path);

    try {
      let module: LoadedModule;

      switch (resolution.type) {
        case 'builtin':
          module = this.loadBuiltin(resolution);
          break;

        case 'file':
          module = await this.loadFile(resolution);
          break;

        case 'package':
          module = await this.loadPackage(resolution);
          break;

        case 'url':
          module = await this.loadUrl(resolution);
          break;

        default:
          throw new Error(`Unknown module type: ${resolution.type}`);
      }

      this.cache.set(resolution.path, module);
      return module;
    } finally {
      this.loading.delete(resolution.path);
    }
  }

  /**
   * Load a built-in module
   */
  private loadBuiltin(resolution: ModuleResolution): LoadedModule {
    const implementation = BUILTIN_IMPLEMENTATIONS[resolution.path];

    if (!implementation) {
      throw new Error(`Built-in module not found: ${resolution.path}`);
    }

    return {
      path: resolution.path,
      exports: implementation(),
      dependencies: [],
      isBuiltin: true,
    };
  }

  /**
   * Load a file module (.rl)
   */
  private async loadFile(resolution: ModuleResolution): Promise<LoadedModule> {
    if (!existsSync(resolution.path)) {
      throw new Error(`Module not found: ${resolution.path}`);
    }

    const source = readFileSync(resolution.path, 'utf-8');

    // Check if it's a JavaScript/TypeScript file
    if (resolution.path.endsWith('.js') || resolution.path.endsWith('.ts')) {
      return this.loadJavaScriptModule(resolution, source);
    }

    // Parse and execute RocketLang file
    if (!this.parser || !this.executor) {
      throw new Error('Parser and executor required to load .rl files');
    }

    const parseResult = this.parser(source);
    if (parseResult.errors.length > 0) {
      throw new Error(`Parse errors in ${resolution.path}:\n${parseResult.errors.map(e => e.message).join('\n')}`);
    }

    // Extract imports to find dependencies
    const dependencies: string[] = [];
    for (const cmd of parseResult.commands) {
      if (cmd.tool === 'import' || cmd.tool === 'use' || cmd.tool === 'उपयोग') {
        const dep = cmd.parameters.path as string || cmd.parameters.from as string;
        if (dep) {
          dependencies.push(dep);
        }
      }
    }

    // Execute module to get exports
    const exports = await this.executor(parseResult.commands);

    return {
      path: resolution.path,
      exports,
      dependencies,
      isBuiltin: false,
      source,
    };
  }

  /**
   * Load a JavaScript/TypeScript module
   */
  private async loadJavaScriptModule(resolution: ModuleResolution, _source: string): Promise<LoadedModule> {
    try {
      const module = await import(resolution.path);
      const exports: ModuleExports = {};

      for (const [key, value] of Object.entries(module)) {
        if (key !== 'default') {
          exports[key] = value as RocketValue;
        }
      }

      // Also include default export if present
      if (module.default) {
        exports.default = module.default;
      }

      return {
        path: resolution.path,
        exports,
        dependencies: [],
        isBuiltin: false,
      };
    } catch (error) {
      throw new Error(`Failed to load JavaScript module ${resolution.path}: ${(error as Error).message}`);
    }
  }

  /**
   * Load a package module
   */
  private async loadPackage(resolution: ModuleResolution): Promise<LoadedModule> {
    // First try to load as file
    if (existsSync(resolution.path)) {
      return this.loadFile(resolution);
    }

    // Try to require/import the package
    try {
      const module = await import(resolution.originalPath);
      const exports: ModuleExports = {};

      for (const [key, value] of Object.entries(module)) {
        if (key !== 'default') {
          exports[key] = value as RocketValue;
        }
      }

      if (module.default) {
        exports.default = module.default;
      }

      return {
        path: resolution.path,
        exports,
        dependencies: [],
        isBuiltin: false,
      };
    } catch (error) {
      throw new Error(`Failed to load package ${resolution.originalPath}: ${(error as Error).message}`);
    }
  }

  /**
   * Load a URL module
   */
  private async loadUrl(resolution: ModuleResolution): Promise<LoadedModule> {
    // Fetch the module from URL
    try {
      const response = await fetch(resolution.path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const source = await response.text();

      // Parse as RocketLang
      if (!this.parser || !this.executor) {
        throw new Error('Parser and executor required to load URL modules');
      }

      const parseResult = this.parser(source);
      if (parseResult.errors.length > 0) {
        throw new Error(`Parse errors in ${resolution.path}:\n${parseResult.errors.map(e => e.message).join('\n')}`);
      }

      const exports = await this.executor(parseResult.commands);

      return {
        path: resolution.path,
        exports,
        dependencies: [],
        isBuiltin: false,
        source,
      };
    } catch (error) {
      throw new Error(`Failed to fetch module from ${resolution.path}: ${(error as Error).message}`);
    }
  }

  /**
   * Import specific items from a module
   */
  async import(spec: ImportSpec, fromFile?: string): Promise<ModuleExports> {
    const module = await this.load(spec.path, fromFile);
    const result: ModuleExports = {};

    // Import as namespace
    if (spec.namespace) {
      result[spec.namespace] = module.exports as unknown as RocketValue;
      return result;
    }

    // Import all
    if (spec.items.length === 0) {
      return { ...module.exports };
    }

    // Import specific items
    for (const item of spec.items) {
      if (!(item.name in module.exports)) {
        throw new Error(`'${item.name}' is not exported from '${spec.path}'`);
      }
      const key = item.alias || item.name;
      result[key] = module.exports[item.name];
    }

    return result;
  }

  /**
   * Check if a module is loaded
   */
  isLoaded(path: string): boolean {
    return this.cache.has(path);
  }

  /**
   * Get a loaded module
   */
  getModule(path: string): LoadedModule | undefined {
    return this.cache.get(path);
  }

  /**
   * Clear the module cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all loaded modules
   */
  getAllModules(): Map<string, LoadedModule> {
    return new Map(this.cache);
  }

  /**
   * Set parser
   */
  setParser(parser: (source: string) => ParseResult): void {
    this.parser = parser;
  }

  /**
   * Set executor
   */
  setExecutor(executor: (commands: RocketCommand[]) => Promise<ModuleExports>): void {
    this.executor = executor;
  }
}

/**
 * Create a new module loader
 */
export function createLoader(config?: LoaderConfig): ModuleLoader {
  return new ModuleLoader(config);
}

export default {
  ModuleLoader,
  createLoader,
  BUILTIN_IMPLEMENTATIONS,
};
