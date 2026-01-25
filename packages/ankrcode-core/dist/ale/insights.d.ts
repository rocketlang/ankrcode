/**
 * Insights Generator
 * Reflects on trials to extract learnings and prevent cycling back to failed strategies
 *
 * Key concept from Sakana's ALE-Agent:
 * The agent generates textual "insights" by reflecting on each trial.
 * It gathers this knowledge to prevent cycling back to previously failed strategies
 * and creates a working memory that allows it to look a few steps ahead.
 */
import type { Trial, Insight, FailedStrategy } from './types.js';
/**
 * Insight extraction configuration
 */
export interface InsightConfig {
    successThreshold: number;
    failureThreshold: number;
    improvementThreshold: number;
    maxInsightsPerTrial: number;
    minConfidence: number;
    detectPatterns: boolean;
    patternWindowSize: number;
    useLLMReflection: boolean;
    reflectionModel?: string;
}
/**
 * Pattern detected across multiple trials
 */
export interface DetectedPattern {
    id: string;
    type: 'success_pattern' | 'failure_pattern' | 'oscillation' | 'plateau' | 'breakthrough';
    description: string;
    occurrences: number;
    confidence: number;
    trialIds: string[];
    recommendation: string;
}
/**
 * Insights Generator class
 */
export declare class InsightsGenerator {
    private config;
    private patterns;
    constructor(config?: Partial<InsightConfig>);
    /**
     * Generate insights from a trial
     */
    generateInsights(trial: Trial, allTrials: Trial[], existingInsights: Insight[]): Promise<Insight[]>;
    /**
     * Generate insight about trial outcome
     */
    private generateOutcomeInsight;
    /**
     * Generate insight about improvement or regression
     */
    private generateDeltaInsight;
    /**
     * Generate insight about strategy effectiveness
     */
    private generateStrategyInsight;
    /**
     * Generate insights from detected patterns
     */
    private generatePatternInsights;
    /**
     * Detect patterns in recent trials
     */
    private detectPatterns;
    /**
     * Generate insights about score components
     */
    private generateComponentInsights;
    /**
     * Convert insights to failed strategies (for working memory)
     */
    extractFailedStrategies(insights: Insight[], task: string): FailedStrategy[];
    /**
     * Summarize insights for context injection
     */
    summarizeInsights(insights: Insight[]): string;
    /**
     * Get detected patterns
     */
    getPatterns(): DetectedPattern[];
    /**
     * Clear patterns (for new optimization run)
     */
    clearPatterns(): void;
    private generateId;
    private extractTags;
    private calculateConsistency;
    private isPlateaued;
    private isOscillating;
    private calculateVariance;
    private findCommonApproach;
    private extractApproachFromContent;
}
export declare const insightsGenerator: InsightsGenerator;
export declare function generateInsights(trial: Trial, allTrials: Trial[], existingInsights?: Insight[]): Promise<Insight[]>;
export declare function summarizeInsights(insights: Insight[]): string;
//# sourceMappingURL=insights.d.ts.map