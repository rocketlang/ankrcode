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
// ALE Engine
export { ALEEngine, aleEngine, optimize, stopOptimization, getOptimizationSession, listOptimizations, } from './ale-engine.js';
// Virtual Power Scorer
export { VirtualPowerScorer, virtualPowerScorer, calculateVirtualPower, } from './virtual-power.js';
// Insights Generator
export { InsightsGenerator, insightsGenerator, generateInsights, summarizeInsights, } from './insights.js';
// Solution Space Explorer
export { SolutionSpaceExplorer, solutionSpaceExplorer, exploreSolutionSpace, } from './solution-space.js';
// Working Memory
export { WorkingMemory, workingMemory, recallFailedStrategies, storeFailedStrategy, buildWorkingMemoryContext, } from './working-memory.js';
/**
 * Quick start function for common optimization patterns
 */
export async function quickOptimize(task, objective, options = {}) {
    const { optimize } = await import('./ale-engine.js');
    // Map strategy presets
    const strategyConfig = {
        fast: { maxTrials: 20, strategy: 'greedy', virtualPowerWeight: 0.1 },
        balanced: { maxTrials: 50, strategy: 'hybrid', virtualPowerWeight: 0.3 },
        thorough: { maxTrials: 100, strategy: 'hybrid', virtualPowerWeight: 0.4 },
    };
    const preset = strategyConfig[options.strategy || 'balanced'];
    const result = await optimize({
        task,
        objective,
        maxTrials: options.maxTrials || preset.maxTrials,
        maxDuration: options.timeout || 300000,
        strategy: preset.strategy,
        virtualPowerWeight: preset.virtualPowerWeight,
        useWorkingMemory: true,
        storeInsights: true,
    });
    return {
        solution: result.bestSolution.content,
        score: result.bestScore.totalScore,
        insights: result.insights.map(i => i.content),
    };
}
/**
 * Version
 */
export const ALE_VERSION = '1.0.0';
//# sourceMappingURL=index.js.map