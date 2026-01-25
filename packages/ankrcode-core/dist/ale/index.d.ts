/**
 * ALE (Agentic Learning Engine) Module
 *
 * Multi-trial optimization engine inspired by Sakana AI's ALE-Agent
 * that won first place in the AtCoder Heuristic Contest (AHC058).
 *
 * Key Features:
 * - Inference-time scaling: Generate, test, iterate over many solutions
 * - Virtual Power: Value potential future outcomes, not just immediate feedback
 * - Insights: Reflect on each trial to extract learnings
 * - Working Memory: Avoid repeating failed strategies via EON integration
 * - Solution Space Exploration: Greedy baseline + simulated annealing
 *
 * @example
 * ```typescript
 * import { optimize, ALEConfig } from './ale';
 *
 * const result = await optimize({
 *   task: 'Optimize the caching strategy for the API',
 *   objective: 'Maximize cache hit rate while minimizing memory usage',
 *   constraints: ['Max 512MB memory', 'Sub-100ms response time'],
 *   maxTrials: 50,
 *   strategy: 'hybrid',
 *   virtualPowerWeight: 0.3,
 * });
 *
 * console.log('Best solution:', result.bestSolution);
 * console.log('Score:', result.bestScore.totalScore);
 * console.log('Insights learned:', result.insights.length);
 * ```
 */
export type { Solution, SolutionScore, Trial, Insight, ExplorationStrategy, ALEConfig, ALEProgress, ALEResult, FailedStrategy, ALEStatus, ALEState, ScorerFunction, SolutionGenerator, ScorerContext, GeneratorContext, } from './types.js';
export { ALEEngine, aleEngine, optimize, stopOptimization, getOptimizationSession, listOptimizations, } from './ale-engine.js';
export { VirtualPowerScorer, virtualPowerScorer, calculateVirtualPower, } from './virtual-power.js';
export type { VirtualPowerFactors } from './virtual-power.js';
export { InsightsGenerator, insightsGenerator, generateInsights, summarizeInsights, } from './insights.js';
export type { InsightConfig, DetectedPattern } from './insights.js';
export { SolutionSpaceExplorer, solutionSpaceExplorer, exploreSolutionSpace, } from './solution-space.js';
export type { ExplorationState, BeamCandidate, ExplorerConfig, } from './solution-space.js';
export { WorkingMemory, workingMemory, recallFailedStrategies, storeFailedStrategy, buildWorkingMemoryContext, } from './working-memory.js';
export type { WorkingMemoryEntry, PatternMatch, WorkingMemoryConfig, } from './working-memory.js';
/**
 * Quick start function for common optimization patterns
 */
export declare function quickOptimize(task: string, objective: string, options?: {
    maxTrials?: number;
    timeout?: number;
    strategy?: 'fast' | 'balanced' | 'thorough';
}): Promise<{
    solution: string;
    score: number;
    insights: string[];
}>;
/**
 * Version
 */
export declare const ALE_VERSION = "1.0.0";
//# sourceMappingURL=index.d.ts.map