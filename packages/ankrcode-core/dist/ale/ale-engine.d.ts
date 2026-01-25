/**
 * ALE Engine (Agentic Learning Engine)
 * Multi-trial optimization inspired by Sakana AI's ALE-Agent
 *
 * Key features:
 * - Inference-time scaling: Generate, test, iterate over many solutions
 * - Virtual Power: Value potential future outcomes, not just immediate feedback
 * - Insights: Reflect on each trial to extract learnings
 * - Working Memory: Avoid repeating failed strategies via EON integration
 * - Solution Space Exploration: Greedy baseline + simulated annealing
 */
import { EventEmitter } from 'events';
import type { ALEConfig, ALEState, ALEStatus, ALEResult, FailedStrategy, ScorerFunction, SolutionGenerator } from './types.js';
/**
 * ALE Engine - Main optimization engine
 */
export declare class ALEEngine extends EventEmitter {
    private sessions;
    private runningSessions;
    private scorer;
    private generator;
    private failedStrategies;
    /**
     * Set custom scorer function
     */
    setScorer(scorer: ScorerFunction): void;
    /**
     * Set custom solution generator
     */
    setGenerator(generator: SolutionGenerator): void;
    /**
     * Start a new optimization session
     */
    optimize(config: Partial<ALEConfig> & {
        task: string;
        objective: string;
    }): Promise<ALEResult>;
    /**
     * Main optimization loop
     */
    private runOptimization;
    /**
     * Generate a new solution candidate
     */
    private generateSolution;
    /**
     * Score a solution using Virtual Power concept
     */
    private scoreSolution;
    /**
     * Calculate immediate score (traditional evaluation)
     */
    private calculateImmediateScore;
    /**
     * Calculate Virtual Power (future potential value)
     * This is the key innovation from Sakana's ALE-Agent
     */
    private calculateVirtualPower;
    /**
     * Generate insight from trial (reflection)
     */
    private generateInsight;
    /**
     * Check if optimization has converged
     */
    private hasConverged;
    /**
     * Calculate variance of numbers
     */
    private calculateVariance;
    /**
     * Load failed strategies from working memory (EON)
     */
    private loadFailedStrategies;
    /**
     * Store failed strategies to working memory
     */
    private storeFailedStrategies;
    /**
     * Check if a failed strategy is relevant to current task
     */
    private isStrategyRelevant;
    /**
     * Create empty solution (fallback)
     */
    private createEmptySolution;
    /**
     * Create empty score (fallback)
     */
    private createEmptyScore;
    /**
     * Update session state
     */
    private updateState;
    /**
     * Update progress
     */
    private updateProgress;
    /**
     * Log message
     */
    private log;
    /**
     * Stop a running session
     */
    stop(id: string): boolean;
    /**
     * Pause a running session
     */
    pause(id: string): boolean;
    /**
     * Resume a paused session
     */
    resume(id: string): boolean;
    /**
     * Get session state
     */
    getSession(id: string): ALEState | undefined;
    /**
     * List all sessions
     */
    listSessions(filter?: {
        status?: ALEStatus;
    }): ALEState[];
    /**
     * Get running sessions
     */
    getRunning(): ALEState[];
    /**
     * Clear completed sessions
     */
    cleanup(maxAge?: number): number;
    /**
     * Get failed strategies (for inspection)
     */
    getFailedStrategies(): FailedStrategy[];
    /**
     * Clear failed strategies
     */
    clearFailedStrategies(): void;
}
export declare const aleEngine: ALEEngine;
export declare function optimize(config: Partial<ALEConfig> & {
    task: string;
    objective: string;
}): Promise<ALEResult>;
export declare function stopOptimization(id: string): boolean;
export declare function getOptimizationSession(id: string): ALEState | undefined;
export declare function listOptimizations(): ALEState[];
//# sourceMappingURL=ale-engine.d.ts.map