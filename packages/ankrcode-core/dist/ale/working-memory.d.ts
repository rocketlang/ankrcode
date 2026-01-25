/**
 * Working Memory
 * EON integration for failed strategy avoidance and pattern learning
 *
 * Key concept from Sakana's ALE-Agent:
 * The agent maintains a "working memory" that stores insights from previous trials.
 * This prevents cycling back to previously failed strategies and enables
 * looking a few steps ahead rather than just reacting to immediate feedback.
 */
import type { FailedStrategy, Insight, Trial } from './types.js';
/**
 * Working Memory entry
 */
export interface WorkingMemoryEntry {
    id: string;
    type: 'failed_strategy' | 'success_pattern' | 'insight' | 'context';
    content: string;
    metadata: Record<string, unknown>;
    taskPattern: string;
    confidence: number;
    hitCount: number;
    lastAccessed: Date;
    createdAt: Date;
}
/**
 * Pattern match result
 */
export interface PatternMatch {
    entry: WorkingMemoryEntry;
    similarity: number;
    relevance: string;
}
/**
 * Working Memory configuration
 */
export interface WorkingMemoryConfig {
    useEON: boolean;
    localFallback: boolean;
    maxEntries: number;
    maxAge: number;
    minHitCountForRetention: number;
    minSimilarity: number;
    maxMatches: number;
    learnFromFailures: boolean;
    learnFromSuccesses: boolean;
    minConfidenceForLearning: number;
}
/**
 * Working Memory class
 */
export declare class WorkingMemory {
    private config;
    private localMemory;
    private eonAvailable;
    constructor(config?: Partial<WorkingMemoryConfig>);
    /**
     * Check if EON service is available
     */
    private checkEONAvailability;
    /**
     * Store a failed strategy
     */
    storeFailedStrategy(strategy: FailedStrategy): Promise<void>;
    /**
     * Store a success pattern
     */
    storeSuccessPattern(trial: Trial, taskPattern: string): Promise<void>;
    /**
     * Store an insight
     */
    storeInsight(insight: Insight, taskPattern: string): Promise<void>;
    /**
     * Store a context entry (for general knowledge)
     */
    storeContext(content: string, taskPattern: string, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Store entry (local + EON)
     */
    private store;
    /**
     * Store to EON service
     */
    private storeToEON;
    /**
     * Recall failed strategies for a task
     */
    recallFailedStrategies(task: string): Promise<FailedStrategy[]>;
    /**
     * Recall success patterns for a task
     */
    recallSuccessPatterns(task: string): Promise<PatternMatch[]>;
    /**
     * Recall insights for a task
     */
    recallInsights(task: string): Promise<Insight[]>;
    /**
     * Recall all relevant entries for a task
     */
    recallAll(task: string): Promise<{
        failedStrategies: FailedStrategy[];
        successPatterns: PatternMatch[];
        insights: Insight[];
        context: PatternMatch[];
    }>;
    /**
     * Recall entries matching a task
     */
    private recall;
    /**
     * Search EON service
     */
    private searchEON;
    /**
     * Calculate similarity between task and entry
     */
    private calculateSimilarity;
    /**
     * Explain why an entry is relevant
     */
    private explainRelevance;
    /**
     * Learn from a set of trials
     */
    learnFromTrials(trials: Trial[], insights: Insight[], task: string): Promise<{
        failedStrategiesStored: number;
        successPatternsStored: number;
        insightsStored: number;
    }>;
    /**
     * Extract task pattern from task description
     */
    private extractTaskPattern;
    /**
     * Build context string for injection into prompts
     */
    buildContextString(task: string): Promise<string>;
    /**
     * Cleanup old/unused entries
     */
    private cleanup;
    /**
     * Get memory statistics
     */
    getStats(): {
        totalEntries: number;
        byType: Record<string, number>;
        eonAvailable: boolean;
        oldestEntry: Date | null;
        newestEntry: Date | null;
    };
    /**
     * Clear all local memory
     */
    clear(): void;
    /**
     * Generate unique ID
     */
    private generateId;
}
export declare const workingMemory: WorkingMemory;
export declare function recallFailedStrategies(task: string): Promise<FailedStrategy[]>;
export declare function storeFailedStrategy(strategy: FailedStrategy): Promise<void>;
export declare function buildWorkingMemoryContext(task: string): Promise<string>;
//# sourceMappingURL=working-memory.d.ts.map