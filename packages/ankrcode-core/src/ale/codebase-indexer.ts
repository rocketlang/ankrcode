/**
 * Codebase Indexer for ALE
 * Indexes the ANKR ecosystem so ALE can learn from it
 *
 * Indexes:
 * - AnkrCode (ankrcode-project)
 * - VibeCoder (ankr-labs-nx/packages/vibecoding-tools)
 * - Swayam (swayam/)
 * - RocketLang (ankr-labs-nx/packages/rocketlang)
 * - Tasher (ankr-labs-nx/packages/tasher)
 * - @ankr/* packages (ankr-labs-nx/packages/*)
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Code chunk extracted from a file
 */
export interface CodeChunk {
  id: string;
  filePath: string;
  relativePath: string;
  package: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'module' | 'file';
  name: string;
  content: string;
  startLine: number;
  endLine: number;
  language: string;
  exports: boolean;
  dependencies: string[];
  metadata: {
    description?: string;
    params?: string[];
    returns?: string;
    examples?: string[];
    tags?: string[];
  };
}

/**
 * Package info
 */
export interface PackageInfo {
  name: string;
  path: string;
  version?: string;
  description?: string;
  main?: string;
  types?: string;
  dependencies: string[];
  files: number;
  chunks: number;
}

/**
 * Index result
 */
export interface IndexResult {
  packages: PackageInfo[];
  totalChunks: number;
  totalFiles: number;
  duration: number;
  errors: string[];
}

/**
 * ANKR Ecosystem paths
 */
export const ANKR_ECOSYSTEM = {
  ankrcode: {
    name: 'AnkrCode',
    paths: ['/root/ankrcode-project/packages/ankrcode-core/src'],
    description: 'AI Coding Assistant - 11 tools, 71 commands, 260+ MCP',
  },
  vibecoder: {
    name: 'VibeCoder',
    paths: ['/root/ankr-labs-nx/packages/vibecoding-tools/src'],
    description: '41 code generation tools with 9 vibe styles',
  },
  swayam: {
    name: 'Swayam',
    paths: ['/root/swayam/packages'],
    description: 'Voice AI with 13 Indian languages',
  },
  rocketlang: {
    name: 'RocketLang',
    paths: ['/root/ankr-labs-nx/packages/rocketlang/src'],
    description: 'DSL with 20 business types, 50+ packages',
  },
  tasher: {
    name: 'Tasher',
    paths: ['/root/ankr-labs-nx/packages/tasher/src'],
    description: 'Manus-style orchestration with 5 agents',
  },
  ankrPackages: {
    name: '@ankr/* Packages',
    paths: ['/root/ankr-labs-nx/packages'],
    description: '50+ reusable packages',
    exclude: ['vibecoding-tools', 'rocketlang', 'tasher'], // Already indexed separately
  },
};

/**
 * Codebase Indexer
 */
export class CodebaseIndexer extends EventEmitter {
  private chunks: Map<string, CodeChunk> = new Map();
  private packages: Map<string, PackageInfo> = new Map();
  private indexedPaths: Set<string> = new Set();

  /**
   * Index the entire ANKR ecosystem
   */
  async indexAnkrEcosystem(): Promise<IndexResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    this.emit('index:started', { ecosystem: 'ANKR' });

    // Index each component
    for (const [key, config] of Object.entries(ANKR_ECOSYSTEM)) {
      try {
        this.emit('index:package', { name: config.name });

        for (const basePath of config.paths) {
          if (!fs.existsSync(basePath)) {
            errors.push(`Path not found: ${basePath}`);
            continue;
          }

          await this.indexDirectory(basePath, config.name, (config as any).exclude);
        }
      } catch (error) {
        errors.push(`Error indexing ${config.name}: ${(error as Error).message}`);
      }
    }

    const result: IndexResult = {
      packages: Array.from(this.packages.values()),
      totalChunks: this.chunks.size,
      totalFiles: this.indexedPaths.size,
      duration: Date.now() - startTime,
      errors,
    };

    this.emit('index:completed', result);
    return result;
  }

  /**
   * Index a specific directory
   */
  async indexDirectory(
    dirPath: string,
    packageName: string,
    exclude: string[] = []
  ): Promise<void> {
    const files = this.walkDirectory(dirPath, exclude);

    let packageInfo = this.packages.get(packageName);
    if (!packageInfo) {
      packageInfo = {
        name: packageName,
        path: dirPath,
        dependencies: [],
        files: 0,
        chunks: 0,
      };
      this.packages.set(packageName, packageInfo);
    }

    // Try to read package.json
    const pkgJsonPath = path.join(dirPath, '..', 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        packageInfo.version = pkgJson.version;
        packageInfo.description = pkgJson.description;
        packageInfo.main = pkgJson.main;
        packageInfo.types = pkgJson.types;
        packageInfo.dependencies = Object.keys(pkgJson.dependencies || {});
      } catch {
        // Ignore parse errors
      }
    }

    for (const file of files) {
      if (this.indexedPaths.has(file)) continue;

      try {
        const chunks = await this.indexFile(file, packageName, dirPath);
        packageInfo.files++;
        packageInfo.chunks += chunks.length;
        this.indexedPaths.add(file);

        this.emit('file:indexed', { file, chunks: chunks.length });
      } catch (error) {
        this.emit('file:error', { file, error: (error as Error).message });
      }
    }
  }

  /**
   * Index a single file
   */
  async indexFile(filePath: string, packageName: string, basePath: string): Promise<CodeChunk[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const language = this.getLanguage(filePath);
    const relativePath = path.relative(basePath, filePath);

    const chunks: CodeChunk[] = [];

    // Extract different code structures
    if (language === 'typescript' || language === 'javascript') {
      chunks.push(...this.extractFunctions(content, filePath, relativePath, packageName, language));
      chunks.push(...this.extractClasses(content, filePath, relativePath, packageName, language));
      chunks.push(...this.extractInterfaces(content, filePath, relativePath, packageName, language));
      chunks.push(...this.extractTypes(content, filePath, relativePath, packageName, language));
      chunks.push(...this.extractExports(content, filePath, relativePath, packageName, language));
    }

    // Always add file-level chunk for context
    chunks.push({
      id: this.generateId('file', filePath),
      filePath,
      relativePath,
      package: packageName,
      type: 'file',
      name: path.basename(filePath),
      content: content.slice(0, 5000), // First 5KB for overview
      startLine: 1,
      endLine: content.split('\n').length,
      language,
      exports: content.includes('export '),
      dependencies: this.extractImports(content),
      metadata: {
        description: this.extractFileDescription(content),
        tags: this.extractTags(content),
      },
    });

    // Store chunks
    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk);
    }

    return chunks;
  }

  /**
   * Extract functions from code
   */
  private extractFunctions(
    content: string,
    filePath: string,
    relativePath: string,
    packageName: string,
    language: string
  ): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    const lines = content.split('\n');

    // Match function declarations and arrow functions
    const functionPatterns = [
      /^(export\s+)?(async\s+)?function\s+(\w+)/,
      /^(export\s+)?const\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>/,
      /^(export\s+)?const\s+(\w+)\s*=\s*(async\s+)?function/,
    ];

    let currentFunction: { name: string; start: number; exported: boolean } | null = null;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for function start
      if (!currentFunction) {
        for (const pattern of functionPatterns) {
          const match = line.match(pattern);
          if (match) {
            const exported = line.includes('export');
            const name = match[3] || match[2];
            currentFunction = { name, start: i, exported };
            braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
            break;
          }
        }
      } else {
        // Track braces to find function end
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount <= 0) {
          // Function ended
          const functionContent = lines.slice(currentFunction.start, i + 1).join('\n');

          chunks.push({
            id: this.generateId('function', `${filePath}:${currentFunction.name}`),
            filePath,
            relativePath,
            package: packageName,
            type: 'function',
            name: currentFunction.name,
            content: functionContent,
            startLine: currentFunction.start + 1,
            endLine: i + 1,
            language,
            exports: currentFunction.exported,
            dependencies: this.extractImportsFromContent(functionContent),
            metadata: this.extractJSDocMetadata(functionContent),
          });

          currentFunction = null;
          braceCount = 0;
        }
      }
    }

    return chunks;
  }

  /**
   * Extract classes from code
   */
  private extractClasses(
    content: string,
    filePath: string,
    relativePath: string,
    packageName: string,
    language: string
  ): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    const lines = content.split('\n');

    const classPattern = /^(export\s+)?(abstract\s+)?class\s+(\w+)/;

    let currentClass: { name: string; start: number; exported: boolean } | null = null;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!currentClass) {
        const match = line.match(classPattern);
        if (match) {
          currentClass = {
            name: match[3],
            start: i,
            exported: line.includes('export'),
          };
          braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        }
      } else {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount <= 0) {
          const classContent = lines.slice(currentClass.start, i + 1).join('\n');

          chunks.push({
            id: this.generateId('class', `${filePath}:${currentClass.name}`),
            filePath,
            relativePath,
            package: packageName,
            type: 'class',
            name: currentClass.name,
            content: classContent,
            startLine: currentClass.start + 1,
            endLine: i + 1,
            language,
            exports: currentClass.exported,
            dependencies: this.extractImportsFromContent(classContent),
            metadata: this.extractJSDocMetadata(classContent),
          });

          currentClass = null;
          braceCount = 0;
        }
      }
    }

    return chunks;
  }

  /**
   * Extract interfaces from code
   */
  private extractInterfaces(
    content: string,
    filePath: string,
    relativePath: string,
    packageName: string,
    language: string
  ): CodeChunk[] {
    const chunks: CodeChunk[] = [];

    // Simple regex for interfaces (TypeScript)
    const interfaceRegex = /(export\s+)?interface\s+(\w+)[\s\S]*?^\}/gm;
    let match;

    while ((match = interfaceRegex.exec(content)) !== null) {
      const startLine = content.slice(0, match.index).split('\n').length;
      const endLine = startLine + match[0].split('\n').length - 1;

      chunks.push({
        id: this.generateId('interface', `${filePath}:${match[2]}`),
        filePath,
        relativePath,
        package: packageName,
        type: 'interface',
        name: match[2],
        content: match[0],
        startLine,
        endLine,
        language,
        exports: match[0].includes('export'),
        dependencies: [],
        metadata: this.extractJSDocMetadata(match[0]),
      });
    }

    return chunks;
  }

  /**
   * Extract type aliases
   */
  private extractTypes(
    content: string,
    filePath: string,
    relativePath: string,
    packageName: string,
    language: string
  ): CodeChunk[] {
    const chunks: CodeChunk[] = [];

    const typeRegex = /(export\s+)?type\s+(\w+)\s*=\s*[^;]+;/g;
    let match;

    while ((match = typeRegex.exec(content)) !== null) {
      const startLine = content.slice(0, match.index).split('\n').length;

      chunks.push({
        id: this.generateId('type', `${filePath}:${match[2]}`),
        filePath,
        relativePath,
        package: packageName,
        type: 'type',
        name: match[2],
        content: match[0],
        startLine,
        endLine: startLine,
        language,
        exports: match[0].includes('export'),
        dependencies: [],
        metadata: {},
      });
    }

    return chunks;
  }

  /**
   * Extract exported constants and objects
   */
  private extractExports(
    content: string,
    filePath: string,
    relativePath: string,
    packageName: string,
    language: string
  ): CodeChunk[] {
    const chunks: CodeChunk[] = [];

    // Match exported const objects
    const constRegex = /export\s+const\s+(\w+)\s*(?::\s*[^=]+)?\s*=\s*\{/g;
    let match;

    while ((match = constRegex.exec(content)) !== null) {
      const startIndex = match.index;
      let braceCount = 1;
      let endIndex = startIndex + match[0].length;

      // Find matching closing brace
      while (braceCount > 0 && endIndex < content.length) {
        if (content[endIndex] === '{') braceCount++;
        if (content[endIndex] === '}') braceCount--;
        endIndex++;
      }

      const constContent = content.slice(startIndex, endIndex);
      const startLine = content.slice(0, startIndex).split('\n').length;
      const endLine = startLine + constContent.split('\n').length - 1;

      chunks.push({
        id: this.generateId('const', `${filePath}:${match[1]}`),
        filePath,
        relativePath,
        package: packageName,
        type: 'const',
        name: match[1],
        content: constContent.slice(0, 2000), // Limit size
        startLine,
        endLine,
        language,
        exports: true,
        dependencies: [],
        metadata: {},
      });
    }

    return chunks;
  }

  /**
   * Extract import statements
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+(?:(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Extract imports from a content chunk
   */
  private extractImportsFromContent(content: string): string[] {
    // Look for used identifiers that might be imports
    const identifiers: string[] = [];

    // Match common patterns
    const patterns = [
      /\b(fs|path|crypto|util|events)\b/g,
      /@ankr\/[\w-]+/g,
      /\b(React|useState|useEffect|useMemo)\b/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (!identifiers.includes(match[0])) {
          identifiers.push(match[0]);
        }
      }
    }

    return identifiers;
  }

  /**
   * Extract JSDoc metadata
   */
  private extractJSDocMetadata(content: string): CodeChunk['metadata'] {
    const metadata: CodeChunk['metadata'] = {};

    // Extract description
    const descMatch = content.match(/\/\*\*\s*\n\s*\*\s*([^\n@]+)/);
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }

    // Extract @param
    const paramMatches = content.matchAll(/@param\s+(?:\{[^}]+\}\s+)?(\w+)\s*-?\s*([^\n@]*)/g);
    metadata.params = [];
    for (const match of paramMatches) {
      metadata.params.push(`${match[1]}: ${match[2].trim()}`);
    }

    // Extract @returns
    const returnsMatch = content.match(/@returns?\s+(?:\{[^}]+\}\s+)?([^\n@]*)/);
    if (returnsMatch) {
      metadata.returns = returnsMatch[1].trim();
    }

    // Extract @example
    const exampleMatches = content.matchAll(/@example\s*\n([\s\S]*?)(?=\n\s*\*\s*@|\n\s*\*\/)/g);
    metadata.examples = [];
    for (const match of exampleMatches) {
      metadata.examples.push(match[1].replace(/^\s*\*\s?/gm, '').trim());
    }

    return metadata;
  }

  /**
   * Extract file-level description
   */
  private extractFileDescription(content: string): string | undefined {
    // Look for file header comment
    const headerMatch = content.match(/^\/\*\*\s*\n([\s\S]*?)\*\//);
    if (headerMatch) {
      return headerMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .filter(line => !line.startsWith('@'))
        .join(' ')
        .trim();
    }
    return undefined;
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string): string[] {
    const tags: string[] = [];

    // Infer tags from content
    if (content.includes('EventEmitter')) tags.push('event-emitter');
    if (content.includes('async ')) tags.push('async');
    if (content.includes('Promise')) tags.push('promise');
    if (content.includes('export class')) tags.push('class');
    if (content.includes('interface ')) tags.push('interface');
    if (content.includes('@ankr/')) tags.push('ankr-package');
    if (content.includes('React')) tags.push('react');
    if (content.includes('express') || content.includes('fastify')) tags.push('server');

    return tags;
  }

  /**
   * Get language from file extension
   */
  private getLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languages: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.json': 'json',
      '.md': 'markdown',
      '.yaml': 'yaml',
      '.yml': 'yaml',
    };
    return languages[ext] || 'unknown';
  }

  /**
   * Walk directory recursively
   */
  private walkDirectory(dir: string, exclude: string[] = []): string[] {
    const files: string[] = [];

    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip excluded directories
      if (exclude.some(ex => entry.name === ex || fullPath.includes(ex))) {
        continue;
      }

      // Skip common non-code directories
      if (['node_modules', 'dist', '.git', 'coverage', '__tests__', '.next'].includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        files.push(...this.walkDirectory(fullPath, exclude));
      } else if (entry.isFile()) {
        // Only index code files
        if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Generate unique ID
   */
  private generateId(type: string, identifier: string): string {
    const hash = identifier.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `${type}_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get all indexed chunks
   */
  getChunks(): CodeChunk[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Get chunks by package
   */
  getChunksByPackage(packageName: string): CodeChunk[] {
    return this.getChunks().filter(c => c.package === packageName);
  }

  /**
   * Get chunks by type
   */
  getChunksByType(type: CodeChunk['type']): CodeChunk[] {
    return this.getChunks().filter(c => c.type === type);
  }

  /**
   * Search chunks by name or content
   */
  searchChunks(query: string): CodeChunk[] {
    const queryLower = query.toLowerCase();
    return this.getChunks().filter(c =>
      c.name.toLowerCase().includes(queryLower) ||
      c.content.toLowerCase().includes(queryLower) ||
      c.metadata.description?.toLowerCase().includes(queryLower)
    );
  }

  /**
   * Get package info
   */
  getPackages(): PackageInfo[] {
    return Array.from(this.packages.values());
  }

  /**
   * Get stats
   */
  getStats(): {
    packages: number;
    files: number;
    chunks: number;
    byType: Record<string, number>;
    byPackage: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    const byPackage: Record<string, number> = {};

    for (const chunk of this.chunks.values()) {
      byType[chunk.type] = (byType[chunk.type] || 0) + 1;
      byPackage[chunk.package] = (byPackage[chunk.package] || 0) + 1;
    }

    return {
      packages: this.packages.size,
      files: this.indexedPaths.size,
      chunks: this.chunks.size,
      byType,
      byPackage,
    };
  }

  /**
   * Clear index
   */
  clear(): void {
    this.chunks.clear();
    this.packages.clear();
    this.indexedPaths.clear();
  }
}

// Singleton instance
export const codebaseIndexer = new CodebaseIndexer();

// Convenience function
export async function indexAnkrEcosystem(): Promise<IndexResult> {
  return codebaseIndexer.indexAnkrEcosystem();
}
