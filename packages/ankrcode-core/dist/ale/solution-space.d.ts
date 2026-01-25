/**
 * Solution Space Explorer
 * Implements exploration strategies: Greedy, Simulated Annealing, Hybrid, Beam Search
 *
 * Key insight from Sakana's ALE-Agent:
 * ALE-Agent integrated Greedy methods directly into the simulated annealing phase
 * to avoid getting stuck in local optima, using high-speed reconstruction to
 * delete and rebuild large sections of the solution on the fly.
 */
import type { Solution, SolutionScore, ExplorationStrategy, GeneratorContext } from './types.js';
/**
 * Exploration state tracking
 */
export interface ExplorationState {
    currentBest: Solution | null;
    currentBestScore: number;
    temperature: number;
    acceptedWorse: number;
    rejectedWorse: number;
    totalExplorations: number;
    stuckCount: number;
    lastImprovement: number;
}
/**
 * Solution candidate in beam search
 */
export interface BeamCandidate {
    solution: Solution;
    score: number;
    parentId?: string;
    generation: number;
}
/**
 * Solution Space Explorer configuration
 */
export interface ExplorerConfig {
    initialTemperature: number;
    minTemperature: number;
    coolingRate: number;
    reheatingThreshold: number;
    reheatingFactor: number;
    beamWidth: number;
    beamPruneThreshold: number;
    populationSize: number;
    mutationRate: number;
    crossoverRate: number;
    elitismCount: number;
    stuckThreshold: number;
}
/**
 * Solution Space Explorer class
 */
export declare class SolutionSpaceExplorer {
    private config;
    private state;
    private beamCandidates;
    private population;
    constructor(config?: Partial<ExplorerConfig>);
    /**
     * Create initial exploration state
     */
    private createInitialState;
    /**
     * Reset explorer state
     */
    reset(): void;
    /**
     * Explore solution space using specified strategy
     */
    explore(strategy: ExplorationStrategy, context: GeneratorContext, generateCandidate: (ctx: GeneratorContext) => Promise<Solution>, scoreCandidate: (sol: Solution) => Promise<SolutionScore>): Promise<Solution>;
    /**
     * Greedy exploration: Always take the best immediate option
     */
    private greedyExplore;
    /**
     * Simulated Annealing: Sometimes accept worse solutions to escape local optima
     */
    private annealingExplore;
    /**
     * Hybrid exploration: Greedy baseline + Annealing refinement
     * This is the key innovation from Sakana's ALE-Agent
     */
    private hybridExplore;
    /**
     * Reconstruction exploration: Delete and rebuild sections
     * Inspired by ALE-Agent's "high-speed reconstruction"
     */
    private reconstructionExplore;
    /**
     * Beam search exploration: Track multiple candidates
     */
    private beamExplore;
    /**
     * Evolutionary exploration: Genetic algorithm style
     */
    private evolutionaryExplore;
    /**
     * Tournament selection for evolutionary strategy
     */
    private tournamentSelect;
    /**
     * Determine if reconstruction is needed
     */
    private shouldReconstruct;
    /**
     * Reheat temperature (escape local optima)
     */
    private reheat;
    /**
     * Get current exploration state
     */
    getState(): ExplorationState;
    /**
     * Get exploration statistics
     */
    getStats(): {
        totalExplorations: number;
        acceptanceRate: number;
        currentTemperature: number;
        stuckCount: number;
        bestScore: number;
        beamSize: number;
        populationSize: number;
    };
    /**
     * Force temperature setting (for external control)
     */
    setTemperature(temperature: number): void;
    /**
     * Inject a solution as current best (for warm starting)
     */
    warmStart(solution: Solution, score: number): void;
}
export declare const solutionSpaceExplorer: SolutionSpaceExplorer;
export declare function exploreSolutionSpace(strategy: ExplorationStrategy, context: GeneratorContext, generateCandidate: (ctx: GeneratorContext) => Promise<Solution>, scoreCandidate: (sol: Solution) => Promise<SolutionScore>): Promise<Solution>;
//# sourceMappingURL=solution-space.d.ts.map