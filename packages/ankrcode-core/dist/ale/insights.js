/**
 * Insights Generator
 * Reflects on trials to extract learnings and prevent cycling back to failed strategies
 *
 * Key concept from Sakana's ALE-Agent:
 * The agent generates textual "insights" by reflecting on each trial.
 * It gathers this knowledge to prevent cycling back to previously failed strategies
 * and creates a working memory that allows it to look a few steps ahead.
 */
const DEFAULT_CONFIG = {
    successThreshold: 0.7,
    failureThreshold: 0.3,
    improvementThreshold: 0.05,
    maxInsightsPerTrial: 3,
    minConfidence: 0.5,
    detectPatterns: true,
    patternWindowSize: 5,
    useLLMReflection: false,
};
/**
 * Insights Generator class
 */
export class InsightsGenerator {
    config;
    patterns = [];
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Generate insights from a trial
     */
    async generateInsights(trial, allTrials, existingInsights) {
        const insights = [];
        // 1. Basic trial outcome insight
        const outcomeInsight = this.generateOutcomeInsight(trial, allTrials);
        if (outcomeInsight) {
            insights.push(outcomeInsight);
        }
        // 2. Improvement/regression insight
        if (allTrials.length > 1) {
            const deltaInsight = this.generateDeltaInsight(trial, allTrials);
            if (deltaInsight) {
                insights.push(deltaInsight);
            }
        }
        // 3. Strategy effectiveness insight
        const strategyInsight = this.generateStrategyInsight(trial, allTrials);
        if (strategyInsight) {
            insights.push(strategyInsight);
        }
        // 4. Pattern-based insights
        if (this.config.detectPatterns && allTrials.length >= this.config.patternWindowSize) {
            const patternInsights = this.generatePatternInsights(trial, allTrials);
            insights.push(...patternInsights);
        }
        // 5. Component-specific insights
        const componentInsights = this.generateComponentInsights(trial);
        insights.push(...componentInsights);
        // Filter by confidence and limit
        return insights
            .filter(i => i.confidence >= this.config.minConfidence)
            .slice(0, this.config.maxInsightsPerTrial);
    }
    /**
     * Generate insight about trial outcome
     */
    generateOutcomeInsight(trial, allTrials) {
        const score = trial.score.totalScore;
        const isSuccess = score >= this.config.successThreshold;
        const isFailure = score <= this.config.failureThreshold;
        if (!isSuccess && !isFailure) {
            return null; // No notable outcome
        }
        const approach = trial.solution.metadata.approach || 'unknown';
        if (isSuccess) {
            return {
                id: this.generateId(),
                trialId: trial.id,
                type: 'success',
                content: `Successful approach "${approach}" achieved score ${score.toFixed(3)}. ` +
                    `Key factors: ${trial.score.reasoning}`,
                confidence: Math.min(1, score + 0.1),
                applicableTo: this.extractTags(trial),
                createdAt: new Date(),
            };
        }
        if (isFailure) {
            return {
                id: this.generateId(),
                trialId: trial.id,
                type: 'failure',
                content: `Failed approach "${approach}" scored only ${score.toFixed(3)}. ` +
                    `Avoid this strategy for similar tasks. Reason: ${trial.score.reasoning}`,
                confidence: Math.min(1, (1 - score) + 0.1),
                applicableTo: this.extractTags(trial),
                createdAt: new Date(),
            };
        }
        return null;
    }
    /**
     * Generate insight about improvement or regression
     */
    generateDeltaInsight(trial, allTrials) {
        const prevTrial = allTrials[allTrials.length - 2];
        if (!prevTrial)
            return null;
        const delta = trial.score.totalScore - prevTrial.score.totalScore;
        if (Math.abs(delta) < this.config.improvementThreshold) {
            return null; // No significant change
        }
        const approach = trial.solution.metadata.approach || 'unknown';
        const prevApproach = prevTrial.solution.metadata.approach || 'unknown';
        if (delta > 0) {
            return {
                id: this.generateId(),
                trialId: trial.id,
                type: 'pattern',
                content: `Improvement of +${delta.toFixed(3)} achieved by switching from "${prevApproach}" to "${approach}". ` +
                    `This suggests "${approach}" is more effective for this task type.`,
                confidence: Math.min(1, 0.5 + delta),
                applicableTo: this.extractTags(trial),
                createdAt: new Date(),
            };
        }
        else {
            return {
                id: this.generateId(),
                trialId: trial.id,
                type: 'observation',
                content: `Regression of ${delta.toFixed(3)} when switching from "${prevApproach}" to "${approach}". ` +
                    `Consider reverting to "${prevApproach}" strategy.`,
                confidence: Math.min(1, 0.5 + Math.abs(delta)),
                applicableTo: this.extractTags(trial),
                createdAt: new Date(),
            };
        }
    }
    /**
     * Generate insight about strategy effectiveness
     */
    generateStrategyInsight(trial, allTrials) {
        const approach = trial.solution.metadata.approach;
        if (!approach)
            return null;
        // Find all trials with same approach
        const sameApproach = allTrials.filter(t => t.solution.metadata.approach === approach);
        if (sameApproach.length < 2)
            return null;
        const avgScore = sameApproach.reduce((sum, t) => sum + t.score.totalScore, 0) / sameApproach.length;
        const consistency = this.calculateConsistency(sameApproach.map(t => t.score.totalScore));
        let content = '';
        let type = 'observation';
        if (avgScore >= this.config.successThreshold && consistency > 0.7) {
            type = 'pattern';
            content = `Strategy "${approach}" is consistently effective (avg: ${avgScore.toFixed(3)}, consistency: ${(consistency * 100).toFixed(0)}%). ` +
                `Recommended for similar tasks.`;
        }
        else if (avgScore <= this.config.failureThreshold) {
            type = 'failure';
            content = `Strategy "${approach}" consistently underperforms (avg: ${avgScore.toFixed(3)}). ` +
                `Should be avoided for this task type.`;
        }
        else if (consistency < 0.3) {
            content = `Strategy "${approach}" has high variance (consistency: ${(consistency * 100).toFixed(0)}%). ` +
                `Results are unpredictable.`;
        }
        else {
            return null;
        }
        return {
            id: this.generateId(),
            trialId: trial.id,
            type,
            content,
            confidence: consistency,
            applicableTo: this.extractTags(trial),
            createdAt: new Date(),
        };
    }
    /**
     * Generate insights from detected patterns
     */
    generatePatternInsights(trial, allTrials) {
        const insights = [];
        const recentTrials = allTrials.slice(-this.config.patternWindowSize);
        // Detect patterns
        const newPatterns = this.detectPatterns(recentTrials);
        for (const pattern of newPatterns) {
            // Check if pattern is new
            const existing = this.patterns.find(p => p.type === pattern.type && p.description === pattern.description);
            if (existing) {
                existing.occurrences++;
                existing.trialIds.push(trial.id);
                continue;
            }
            this.patterns.push(pattern);
            insights.push({
                id: this.generateId(),
                trialId: trial.id,
                type: 'pattern',
                content: `Pattern detected: ${pattern.description}. ${pattern.recommendation}`,
                confidence: pattern.confidence,
                applicableTo: this.extractTags(trial),
                createdAt: new Date(),
            });
        }
        return insights;
    }
    /**
     * Detect patterns in recent trials
     */
    detectPatterns(trials) {
        const patterns = [];
        const scores = trials.map(t => t.score.totalScore);
        // Pattern 1: Plateau (scores stable but not improving)
        if (this.isPlateaued(scores)) {
            patterns.push({
                id: this.generateId(),
                type: 'plateau',
                description: 'Optimization has plateaued - scores stable but not improving',
                occurrences: 1,
                confidence: 0.7,
                trialIds: trials.map(t => t.id),
                recommendation: 'Try increasing exploration (temperature) or a different strategy',
            });
        }
        // Pattern 2: Oscillation (scores bouncing up and down)
        if (this.isOscillating(scores)) {
            patterns.push({
                id: this.generateId(),
                type: 'oscillation',
                description: 'Scores oscillating - alternating between approaches without convergence',
                occurrences: 1,
                confidence: 0.6,
                trialIds: trials.map(t => t.id),
                recommendation: 'Focus on the higher-scoring approach and reduce exploration',
            });
        }
        // Pattern 3: Breakthrough (sudden significant improvement)
        const lastDelta = scores[scores.length - 1] - scores[scores.length - 2];
        if (lastDelta > 0.15) {
            patterns.push({
                id: this.generateId(),
                type: 'breakthrough',
                description: `Breakthrough improvement of +${lastDelta.toFixed(3)}`,
                occurrences: 1,
                confidence: 0.8,
                trialIds: [trials[trials.length - 1].id],
                recommendation: 'Exploit this approach - focus refinement around current solution',
            });
        }
        // Pattern 4: Consistent success pattern
        const successfulTrials = trials.filter(t => t.score.totalScore >= this.config.successThreshold);
        if (successfulTrials.length >= 3) {
            const commonApproach = this.findCommonApproach(successfulTrials);
            if (commonApproach) {
                patterns.push({
                    id: this.generateId(),
                    type: 'success_pattern',
                    description: `Strategy "${commonApproach}" consistently succeeds`,
                    occurrences: successfulTrials.length,
                    confidence: successfulTrials.length / trials.length,
                    trialIds: successfulTrials.map(t => t.id),
                    recommendation: `Continue using "${commonApproach}" strategy`,
                });
            }
        }
        return patterns;
    }
    /**
     * Generate insights about score components
     */
    generateComponentInsights(trial) {
        const insights = [];
        const components = trial.score.components;
        // Find weakest component
        const entries = Object.entries(components);
        const sorted = entries.sort(([, a], [, b]) => a - b);
        const [weakest, weakestScore] = sorted[0];
        const [strongest, strongestScore] = sorted[sorted.length - 1];
        // Insight for weak component
        if (weakestScore < 0.4) {
            insights.push({
                id: this.generateId(),
                trialId: trial.id,
                type: 'observation',
                content: `Weak in "${weakest}" (${weakestScore.toFixed(2)}). ` +
                    `Focus improvement efforts on this area.`,
                confidence: 1 - weakestScore,
                applicableTo: [weakest],
                createdAt: new Date(),
            });
        }
        // Insight for strong component
        if (strongestScore > 0.8 && weakestScore < 0.5) {
            insights.push({
                id: this.generateId(),
                trialId: trial.id,
                type: 'observation',
                content: `Strong "${strongest}" (${strongestScore.toFixed(2)}) but weak "${weakest}". ` +
                    `Consider rebalancing approach.`,
                confidence: strongestScore - weakestScore,
                applicableTo: [strongest, weakest],
                createdAt: new Date(),
            });
        }
        return insights;
    }
    /**
     * Convert insights to failed strategies (for working memory)
     */
    extractFailedStrategies(insights, task) {
        const failureInsights = insights.filter(i => i.type === 'failure');
        return failureInsights.map(insight => ({
            id: this.generateId(),
            description: this.extractApproachFromContent(insight.content),
            reason: insight.content,
            taskPattern: task.split(' ').slice(0, 5).join(' '),
            avoidanceHint: `Based on insight: ${insight.content.slice(0, 100)}...`,
            createdAt: insight.createdAt,
            hitCount: 1,
        }));
    }
    /**
     * Summarize insights for context injection
     */
    summarizeInsights(insights) {
        if (insights.length === 0) {
            return 'No insights gathered yet.';
        }
        const successCount = insights.filter(i => i.type === 'success').length;
        const failureCount = insights.filter(i => i.type === 'failure').length;
        const patternCount = insights.filter(i => i.type === 'pattern').length;
        const summary = [
            `Total insights: ${insights.length}`,
            `- Successes: ${successCount}`,
            `- Failures: ${failureCount}`,
            `- Patterns: ${patternCount}`,
            '',
            'Key learnings:',
        ];
        // Add top insights by confidence
        const topInsights = [...insights]
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);
        for (const insight of topInsights) {
            summary.push(`- [${insight.type}] ${insight.content.slice(0, 100)}...`);
        }
        return summary.join('\n');
    }
    /**
     * Get detected patterns
     */
    getPatterns() {
        return [...this.patterns];
    }
    /**
     * Clear patterns (for new optimization run)
     */
    clearPatterns() {
        this.patterns = [];
    }
    // Helper methods
    generateId() {
        return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    extractTags(trial) {
        const tags = [];
        // Extract from approach
        const approach = trial.solution.metadata.approach;
        if (approach) {
            tags.push(approach.split('_')[0]);
        }
        // Extract from tools used
        if (trial.toolsUsed.length > 0) {
            tags.push(...trial.toolsUsed.slice(0, 2));
        }
        return tags;
    }
    calculateConsistency(scores) {
        if (scores.length < 2)
            return 1;
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        // Consistency is inverse of coefficient of variation
        // Lower stdDev relative to mean = higher consistency
        const cv = stdDev / Math.max(0.01, mean);
        return Math.max(0, 1 - cv);
    }
    isPlateaued(scores) {
        if (scores.length < 4)
            return false;
        const recent = scores.slice(-4);
        const variance = this.calculateVariance(recent);
        const trend = recent[recent.length - 1] - recent[0];
        // Plateaued if low variance and no trend
        return variance < 0.01 && Math.abs(trend) < 0.02;
    }
    isOscillating(scores) {
        if (scores.length < 4)
            return false;
        // Count direction changes
        let changes = 0;
        for (let i = 2; i < scores.length; i++) {
            const prev = scores[i - 1] - scores[i - 2];
            const curr = scores[i] - scores[i - 1];
            if ((prev > 0 && curr < 0) || (prev < 0 && curr > 0)) {
                changes++;
            }
        }
        // Oscillating if more than 60% of possible changes
        return changes > (scores.length - 2) * 0.6;
    }
    calculateVariance(numbers) {
        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        return numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    }
    findCommonApproach(trials) {
        const approaches = {};
        for (const trial of trials) {
            const approach = trial.solution.metadata.approach;
            if (approach) {
                approaches[approach] = (approaches[approach] || 0) + 1;
            }
        }
        const entries = Object.entries(approaches);
        if (entries.length === 0)
            return null;
        const sorted = entries.sort(([, a], [, b]) => b - a);
        const [mostCommon, count] = sorted[0];
        // Return only if majority
        return count >= trials.length / 2 ? mostCommon : null;
    }
    extractApproachFromContent(content) {
        const match = content.match(/"([^"]+)"/);
        return match ? match[1] : 'unknown_approach';
    }
}
// Singleton instance
export const insightsGenerator = new InsightsGenerator();
// Convenience functions
export async function generateInsights(trial, allTrials, existingInsights = []) {
    return insightsGenerator.generateInsights(trial, allTrials, existingInsights);
}
export function summarizeInsights(insights) {
    return insightsGenerator.summarizeInsights(insights);
}
//# sourceMappingURL=insights.js.map