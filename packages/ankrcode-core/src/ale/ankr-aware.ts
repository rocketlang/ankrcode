/**
 * ANKR-Aware Scorer and Generator
 * Uses RAG to retrieve relevant code context from the indexed ANKR ecosystem
 */

import type {
  Solution,
  SolutionScore,
  ScorerContext,
  GeneratorContext,
  ScorerFunction,
  SolutionGenerator,
} from './types.js';
import { codebaseIndexer, CodeChunk } from './codebase-indexer.js';
import { virtualPowerScorer } from './virtual-power.js';

/**
 * RAG context for a task
 */
export interface RAGContext {
  relevantChunks: CodeChunk[];
  patterns: string[];
  examples: string[];
  apiSuggestions: string[];
  ankrPackages: string[];
}

/**
 * Retrieve relevant context from indexed codebase
 */
export async function retrieveContext(task: string, objective: string): Promise<RAGContext> {
  const chunks = codebaseIndexer.getChunks();

  if (chunks.length === 0) {
    return {
      relevantChunks: [],
      patterns: [],
      examples: [],
      apiSuggestions: [],
      ankrPackages: [],
    };
  }

  // Search for relevant chunks
  const taskWords = task.toLowerCase().split(/\s+/);
  const objectiveWords = objective.toLowerCase().split(/\s+/);
  const searchTerms = [...new Set([...taskWords, ...objectiveWords])].filter(w => w.length > 2);

  // Score each chunk by relevance
  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();
    const nameLower = chunk.name.toLowerCase();
    const descLower = (chunk.metadata.description || '').toLowerCase();

    // Name matches are high value
    for (const term of searchTerms) {
      if (nameLower.includes(term)) score += 10;
      if (descLower.includes(term)) score += 5;
      if (contentLower.includes(term)) score += 1;
    }

    // Boost exported items
    if (chunk.exports) score *= 1.2;

    // Boost classes and functions over raw files
    if (chunk.type === 'class' || chunk.type === 'function') score *= 1.5;
    if (chunk.type === 'interface') score *= 1.3;

    return { chunk, score };
  });

  // Sort by score and take top results
  scoredChunks.sort((a, b) => b.score - a.score);
  const relevantChunks = scoredChunks
    .filter(s => s.score > 0)
    .slice(0, 10)
    .map(s => s.chunk);

  // Extract patterns from relevant chunks
  const patterns: string[] = [];
  for (const chunk of relevantChunks.slice(0, 5)) {
    if (chunk.type === 'class') {
      patterns.push(`Class pattern: ${chunk.name} - ${chunk.metadata.description || 'No description'}`);
    }
    if (chunk.type === 'function' && chunk.exports) {
      patterns.push(`Function: ${chunk.name}(${chunk.metadata.params?.join(', ') || '...'})`);
    }
  }

  // Extract examples
  const examples: string[] = [];
  for (const chunk of relevantChunks) {
    if (chunk.metadata.examples && chunk.metadata.examples.length > 0) {
      examples.push(...chunk.metadata.examples.slice(0, 2));
    }
  }

  // Suggest @ankr packages
  const ankrPackages: string[] = [];
  const allDeps = new Set<string>();
  for (const chunk of relevantChunks) {
    for (const dep of chunk.dependencies) {
      if (dep.startsWith('@ankr/')) {
        allDeps.add(dep);
      }
    }
  }
  ankrPackages.push(...allDeps);

  // API suggestions based on chunk types
  const apiSuggestions: string[] = [];
  for (const chunk of relevantChunks.filter(c => c.type === 'function' && c.exports)) {
    apiSuggestions.push(`import { ${chunk.name} } from '${chunk.package}'`);
  }

  return {
    relevantChunks,
    patterns,
    examples: examples.slice(0, 5),
    apiSuggestions: apiSuggestions.slice(0, 5),
    ankrPackages,
  };
}

/**
 * Build context prompt for LLM
 */
export function buildContextPrompt(ragContext: RAGContext): string {
  const lines: string[] = [];

  lines.push('## Relevant ANKR Ecosystem Context\n');

  if (ragContext.patterns.length > 0) {
    lines.push('### Patterns Found:');
    ragContext.patterns.forEach(p => lines.push(`- ${p}`));
    lines.push('');
  }

  if (ragContext.ankrPackages.length > 0) {
    lines.push('### Suggested @ankr Packages:');
    ragContext.ankrPackages.forEach(p => lines.push(`- ${p}`));
    lines.push('');
  }

  if (ragContext.apiSuggestions.length > 0) {
    lines.push('### Available APIs:');
    ragContext.apiSuggestions.forEach(a => lines.push(`- ${a}`));
    lines.push('');
  }

  if (ragContext.examples.length > 0) {
    lines.push('### Code Examples:');
    ragContext.examples.forEach(e => {
      lines.push('```typescript');
      lines.push(e);
      lines.push('```');
    });
    lines.push('');
  }

  if (ragContext.relevantChunks.length > 0) {
    lines.push('### Relevant Code Snippets:');
    for (const chunk of ragContext.relevantChunks.slice(0, 3)) {
      lines.push(`\n#### ${chunk.name} (${chunk.package})`);
      lines.push(`File: ${chunk.relativePath}:${chunk.startLine}`);
      if (chunk.metadata.description) {
        lines.push(`Description: ${chunk.metadata.description}`);
      }
      lines.push('```' + chunk.language);
      lines.push(chunk.content.slice(0, 500) + (chunk.content.length > 500 ? '\n// ...' : ''));
      lines.push('```');
    }
  }

  return lines.join('\n');
}

/**
 * Create ANKR-aware scorer
 */
export function createAnkrAwareScorer(): ScorerFunction {
  return async (solution: Solution, context: ScorerContext): Promise<SolutionScore> => {
    // Get RAG context
    const ragContext = await retrieveContext(context.task, context.objective);

    // Calculate base Virtual Power score
    const vpResult = await virtualPowerScorer.calculateVirtualPower(
      solution,
      context,
      2
    );

    // Calculate ANKR-specific scoring

    // 1. Pattern adherence - does solution follow ANKR patterns?
    let patternScore = 0.5;
    const solutionLower = solution.content.toLowerCase();

    // Check for @ankr package usage
    if (solutionLower.includes('@ankr/')) {
      patternScore += 0.1;
    }

    // Check for EventEmitter pattern (common in ANKR)
    if (solutionLower.includes('eventemitter') || solutionLower.includes('extends event')) {
      patternScore += 0.05;
    }

    // Check for async/await pattern
    if (solutionLower.includes('async ') && solutionLower.includes('await ')) {
      patternScore += 0.05;
    }

    // Check for TypeScript patterns
    if (solutionLower.includes('interface ') || solutionLower.includes(': ')) {
      patternScore += 0.05;
    }

    // 2. API usage - does it use relevant ANKR APIs?
    let apiScore = 0.5;
    for (const api of ragContext.apiSuggestions) {
      const funcName = api.match(/import \{ (\w+) \}/)?.[1];
      if (funcName && solutionLower.includes(funcName.toLowerCase())) {
        apiScore += 0.1;
      }
    }
    apiScore = Math.min(1, apiScore);

    // 3. Package usage - does it use recommended packages?
    let packageScore = 0.5;
    for (const pkg of ragContext.ankrPackages) {
      if (solutionLower.includes(pkg.toLowerCase())) {
        packageScore += 0.1;
      }
    }
    packageScore = Math.min(1, packageScore);

    // 4. Code similarity to relevant chunks
    let similarityScore = 0.5;
    if (ragContext.relevantChunks.length > 0) {
      // Simple keyword overlap
      const solutionWords = new Set(solutionLower.split(/\W+/).filter(w => w.length > 3));
      let totalOverlap = 0;

      for (const chunk of ragContext.relevantChunks.slice(0, 5)) {
        const chunkWords = new Set(chunk.content.toLowerCase().split(/\W+/).filter(w => w.length > 3));
        const overlap = [...solutionWords].filter(w => chunkWords.has(w)).length;
        totalOverlap += overlap / Math.max(solutionWords.size, 1);
      }

      similarityScore = Math.min(1, 0.3 + (totalOverlap / 5) * 0.7);
    }

    // Combine scores
    const immediateScore = (
      patternScore * 0.3 +
      apiScore * 0.25 +
      packageScore * 0.2 +
      similarityScore * 0.25
    );

    const totalScore = immediateScore * 0.7 + vpResult.score * 0.3;

    return {
      solutionId: solution.id,
      immediateScore,
      virtualPowerScore: vpResult.score,
      totalScore,
      components: {
        correctness: patternScore,
        efficiency: apiScore,
        maintainability: packageScore,
        potential: vpResult.score,
      },
      confidence: ragContext.relevantChunks.length > 0 ? 0.8 : 0.5,
      reasoning: `ANKR-aware scoring: Pattern adherence ${patternScore.toFixed(2)}, ` +
        `API usage ${apiScore.toFixed(2)}, Package usage ${packageScore.toFixed(2)}, ` +
        `Similarity ${similarityScore.toFixed(2)}. ` +
        `Found ${ragContext.relevantChunks.length} relevant code chunks.`,
    };
  };
}

/**
 * Create ANKR-aware generator
 */
export function createAnkrAwareGenerator(): SolutionGenerator {
  return async (context: GeneratorContext): Promise<Solution> => {
    // Get RAG context
    const ragContext = await retrieveContext(context.task, context.objective);

    // Build solution content with ANKR context
    const contextPrompt = buildContextPrompt(ragContext);

    // Generate solution based on context and strategy
    let solutionContent = '';
    let approach = 'ankr_aware';

    if (context.bestSolution && context.temperature < 0.5) {
      // Refine existing solution
      approach = 'ankr_refine';
      solutionContent = refineSolution(context.bestSolution.content, ragContext);
    } else if (ragContext.relevantChunks.length > 0) {
      // Generate based on similar code
      approach = 'ankr_pattern';
      solutionContent = generateFromPatterns(context.task, context.objective, ragContext);
    } else {
      // Generate fresh
      approach = 'ankr_fresh';
      solutionContent = generateFresh(context.task, context.objective, context.constraints);
    }

    // Add context as metadata
    const solution: Solution = {
      id: generateId(),
      content: solutionContent,
      metadata: {
        approach,
        temperature: context.temperature,
        ragChunksUsed: ragContext.relevantChunks.length,
        patternsApplied: ragContext.patterns.length,
        packagesRecommended: ragContext.ankrPackages,
        contextPrompt: contextPrompt.slice(0, 500),
      },
      createdAt: new Date(),
      iteration: context.iteration,
      parentId: context.bestSolution?.id,
    };

    return solution;
  };
}

/**
 * Refine an existing solution using ANKR patterns
 */
function refineSolution(existing: string, ragContext: RAGContext): string {
  let refined = existing;

  // Add @ankr package imports if relevant
  if (ragContext.ankrPackages.length > 0 && !existing.includes('@ankr/')) {
    const importSuggestion = `// Consider using: ${ragContext.ankrPackages.slice(0, 3).join(', ')}\n`;
    refined = importSuggestion + refined;
  }

  // Add pattern suggestions
  if (ragContext.patterns.length > 0) {
    refined += `\n\n// Patterns from ANKR codebase:\n`;
    ragContext.patterns.slice(0, 2).forEach(p => {
      refined += `// - ${p}\n`;
    });
  }

  return refined;
}

/**
 * Generate solution from ANKR patterns
 */
function generateFromPatterns(
  task: string,
  objective: string,
  ragContext: RAGContext
): string {
  const lines: string[] = [];

  lines.push(`/**`);
  lines.push(` * Solution for: ${task}`);
  lines.push(` * Objective: ${objective}`);
  lines.push(` * Generated using ANKR ecosystem patterns`);
  lines.push(` */`);
  lines.push('');

  // Add imports based on relevant chunks
  if (ragContext.ankrPackages.length > 0) {
    lines.push('// Recommended imports from ANKR ecosystem:');
    for (const pkg of ragContext.ankrPackages.slice(0, 5)) {
      lines.push(`// import { ... } from '${pkg}';`);
    }
    lines.push('');
  }

  // Add API suggestions
  if (ragContext.apiSuggestions.length > 0) {
    lines.push('// Available APIs:');
    for (const api of ragContext.apiSuggestions.slice(0, 3)) {
      lines.push(`// ${api}`);
    }
    lines.push('');
  }

  // Include example pattern if available
  if (ragContext.relevantChunks.length > 0) {
    const bestMatch = ragContext.relevantChunks[0];
    lines.push(`// Pattern from ${bestMatch.package}: ${bestMatch.name}`);
    lines.push(`// File: ${bestMatch.relativePath}`);
    lines.push('');

    // Use structure from best match
    if (bestMatch.type === 'class') {
      lines.push(`export class Solution {`);
      lines.push(`  // Implement based on ${bestMatch.name} pattern`);
      lines.push(`  constructor() {`);
      lines.push(`    // Initialize`);
      lines.push(`  }`);
      lines.push('');
      lines.push(`  async execute(): Promise<void> {`);
      lines.push(`    // Implementation for: ${task}`);
      lines.push(`  }`);
      lines.push(`}`);
    } else if (bestMatch.type === 'function') {
      lines.push(`export async function solution(): Promise<void> {`);
      lines.push(`  // Implementation for: ${task}`);
      lines.push(`  // Based on pattern from: ${bestMatch.name}`);
      lines.push(`}`);
    } else {
      lines.push(`// Solution for: ${task}`);
      lines.push(`export const solution = {`);
      lines.push(`  // Configuration based on ANKR patterns`);
      lines.push(`};`);
    }
  } else {
    lines.push(`// Solution for: ${task}`);
    lines.push(`export async function solution(): Promise<unknown> {`);
    lines.push(`  // TODO: Implement solution`);
    lines.push(`  // Objective: ${objective}`);
    lines.push(`  return {};`);
    lines.push(`}`);
  }

  return lines.join('\n');
}

/**
 * Generate fresh solution without patterns
 */
function generateFresh(
  task: string,
  objective: string,
  constraints: string[]
): string {
  const lines: string[] = [];

  lines.push(`/**`);
  lines.push(` * Solution for: ${task}`);
  lines.push(` * Objective: ${objective}`);
  if (constraints.length > 0) {
    lines.push(` * Constraints:`);
    constraints.forEach(c => lines.push(` *   - ${c}`));
  }
  lines.push(` */`);
  lines.push('');
  lines.push(`export async function solution(): Promise<unknown> {`);
  lines.push(`  // Implementation`);
  lines.push(`  return {};`);
  lines.push(`}`);

  return lines.join('\n');
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `sol_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Register ANKR-aware scorer and generator with ALE engine
 */
export async function enableAnkrAwareness(): Promise<void> {
  // Import aleEngine dynamically to avoid circular dependency
  const { aleEngine } = await import('./ale-engine.js');

  aleEngine.setScorer(createAnkrAwareScorer());
  aleEngine.setGenerator(createAnkrAwareGenerator());
}

/**
 * Get current RAG stats
 */
export function getRAGStats(): {
  indexed: boolean;
  chunks: number;
  packages: number;
} {
  const stats = codebaseIndexer.getStats();
  return {
    indexed: stats.chunks > 0,
    chunks: stats.chunks,
    packages: stats.packages,
  };
}
