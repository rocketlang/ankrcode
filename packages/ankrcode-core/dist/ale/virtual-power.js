/**
 * Virtual Power Scorer
 * Implements Sakana AI's key innovation: valuing potential future assets
 *
 * Traditional scoring looks at immediate value.
 * Virtual Power looks at potential future value (compound interest effect).
 *
 * Example: A reusable utility function scores lower immediately (doesn't solve
 * the whole problem) but has high Virtual Power (will accelerate future solutions).
 */
/**
 * Default weights for Virtual Power factors
 */
const DEFAULT_WEIGHTS = {
    buildingBlocks: 0.25,
    extensibility: 0.15,
    learningTrajectory: 0.20,
    insightDensity: 0.15,
    compoundPotential: 0.15,
    riskMitigation: 0.10,
};
/**
 * Virtual Power Scorer class
 */
export class VirtualPowerScorer {
    weights;
    constructor(weights = {}) {
        this.weights = { ...DEFAULT_WEIGHTS, ...weights };
    }
    /**
     * Calculate full Virtual Power score with breakdown
     */
    async calculateVirtualPower(solution, context, lookAheadDepth = 2) {
        const factors = {
            buildingBlocks: this.scoreBuildingBlocks(solution),
            extensibility: this.scoreExtensibility(solution),
            learningTrajectory: this.scoreLearningTrajectory(context.previousTrials),
            insightDensity: this.scoreInsightDensity(context.insights, context.previousTrials),
            compoundPotential: this.scoreCompoundPotential(solution, context, lookAheadDepth),
            riskMitigation: this.scoreRiskMitigation(solution, context),
        };
        // Weighted sum
        const score = Object.entries(factors).reduce((sum, [key, value]) => {
            return sum + value * this.weights[key];
        }, 0);
        // Generate reasoning
        const topFactors = Object.entries(factors)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2)
            .map(([key, value]) => `${key}: ${value.toFixed(2)}`);
        const reasoning = `Virtual Power ${score.toFixed(3)} driven by ${topFactors.join(', ')}`;
        return { score, factors, reasoning };
    }
    /**
     * Score building blocks factor
     * Higher if solution creates reusable components
     */
    scoreBuildingBlocks(solution) {
        let score = 0.5; // Base score
        const content = solution.content.toLowerCase();
        const code = solution.code?.toLowerCase() || '';
        const combined = content + ' ' + code;
        // Check for reusable patterns
        const patterns = [
            { regex: /function\s+\w+/, weight: 0.1, name: 'function' },
            { regex: /class\s+\w+/, weight: 0.15, name: 'class' },
            { regex: /interface\s+\w+/, weight: 0.08, name: 'interface' },
            { regex: /type\s+\w+\s*=/, weight: 0.05, name: 'type' },
            { regex: /export\s+(const|function|class)/, weight: 0.1, name: 'export' },
            { regex: /module\s+\w+/, weight: 0.12, name: 'module' },
            { regex: /abstract\s+class/, weight: 0.15, name: 'abstract' },
            { regex: /implements\s+\w+/, weight: 0.08, name: 'implements' },
            { regex: /extends\s+\w+/, weight: 0.08, name: 'extends' },
        ];
        for (const pattern of patterns) {
            if (pattern.regex.test(combined)) {
                score += pattern.weight;
            }
        }
        // Check metadata for component indicators
        if (solution.metadata.hasReusableComponents) {
            score += 0.1;
        }
        return Math.min(1, score);
    }
    /**
     * Score extensibility factor
     * Higher if solution is easy to extend
     */
    scoreExtensibility(solution) {
        let score = 0.5;
        const content = solution.content.toLowerCase();
        const code = solution.code?.toLowerCase() || '';
        const combined = content + ' ' + code;
        // Extensibility indicators
        const indicators = [
            { pattern: /config|options|settings/, weight: 0.1 },
            { pattern: /plugin|hook|middleware/, weight: 0.15 },
            { pattern: /abstract|interface|protocol/, weight: 0.1 },
            { pattern: /dependency injection|di|inject/, weight: 0.1 },
            { pattern: /factory|builder|strategy/, weight: 0.1 },
            { pattern: /event|emit|on\(|subscribe/, weight: 0.08 },
            { pattern: /modular|composable|component/, weight: 0.08 },
        ];
        for (const indicator of indicators) {
            if (indicator.pattern.test(combined)) {
                score += indicator.weight;
            }
        }
        // Penalize hard-coded values
        const hardcodedPatterns = [
            /["']\d{1,5}["']/, // Hard-coded small numbers
            /localhost:\d+/, // Hard-coded ports
            /\/\/\s*todo|fixme|hack/i, // Technical debt markers
        ];
        for (const pattern of hardcodedPatterns) {
            if (pattern.test(combined)) {
                score -= 0.05;
            }
        }
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Score learning trajectory
     * Higher if recent trials show improvement
     */
    scoreLearningTrajectory(previousTrials) {
        if (previousTrials.length < 2) {
            return 0.5; // Neutral if not enough data
        }
        // Calculate trend over recent trials
        const recentCount = Math.min(10, previousTrials.length);
        const recentTrials = previousTrials.slice(-recentCount);
        // Simple linear regression to find trend
        const n = recentTrials.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = recentTrials.reduce((sum, t) => sum + t.score.totalScore, 0);
        const sumXY = recentTrials.reduce((sum, t, i) => sum + i * t.score.totalScore, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        // Convert slope to 0-1 score
        // slope of 0.05 per iteration = excellent (1.0)
        // slope of 0 = neutral (0.5)
        // slope of -0.05 = poor (0.0)
        const normalizedSlope = Math.max(-0.05, Math.min(0.05, slope));
        return 0.5 + (normalizedSlope / 0.1);
    }
    /**
     * Score insight density
     * Higher if we're learning more per trial
     */
    scoreInsightDensity(insights, previousTrials) {
        if (previousTrials.length === 0) {
            return 0.5;
        }
        const density = insights.length / previousTrials.length;
        // Ideal density is around 0.3-0.5 insights per trial
        // Too few = not learning, too many = noise
        if (density < 0.1) {
            return 0.3 + density * 2; // Low: 0.3-0.5
        }
        else if (density <= 0.5) {
            return 0.5 + density * 0.8; // Good: 0.5-0.9
        }
        else {
            return Math.max(0.5, 0.9 - (density - 0.5) * 0.4); // Diminishing: 0.9-0.5
        }
    }
    /**
     * Score compound potential
     * Higher if solution enables exponential future improvement
     */
    scoreCompoundPotential(solution, context, lookAheadDepth) {
        let score = 0.5;
        // Factor 1: Foundation strength
        // Solutions building on successful foundations have higher potential
        if (solution.parentId) {
            const parentTrial = context.previousTrials.find(t => t.solution.id === solution.parentId);
            if (parentTrial) {
                const parentScore = parentTrial.score.totalScore;
                if (parentScore > 0.7) {
                    score += 0.15; // Building on strong foundation
                }
                else if (parentScore < 0.4) {
                    score -= 0.1; // Building on weak foundation
                }
            }
        }
        // Factor 2: Insight leverage
        // Solutions that leverage many insights have compound potential
        const successInsights = context.insights.filter(i => i.type === 'success');
        const leverageRatio = successInsights.length / Math.max(1, context.previousTrials.length);
        score += leverageRatio * 0.2;
        // Factor 3: Look-ahead simulation
        // Project potential improvement over future iterations
        if (lookAheadDepth > 0 && context.previousTrials.length >= 3) {
            const recentImprovement = this.calculateRecentImprovement(context.previousTrials);
            const projectedGain = recentImprovement * lookAheadDepth * 0.8; // Diminishing returns
            score += Math.min(0.2, projectedGain);
        }
        // Factor 4: Avoided pitfalls
        // Solutions avoiding known failures have better compound potential
        const avoidedStrategies = solution.metadata.avoidingStrategies || [];
        score += Math.min(0.1, avoidedStrategies.length * 0.03);
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Score risk mitigation
     * Higher if solution reduces future failure probability
     */
    scoreRiskMitigation(solution, context) {
        let score = 0.5;
        // Factor 1: Error handling
        const content = solution.content.toLowerCase();
        const code = solution.code?.toLowerCase() || '';
        const combined = content + ' ' + code;
        const errorHandlingPatterns = [
            /try\s*{|catch\s*\(|finally\s*{/,
            /\.catch\s*\(/,
            /throw\s+new\s+Error/,
            /if\s*\([^)]*error|err[^a-z]/,
            /validation|validate|sanitize/,
        ];
        for (const pattern of errorHandlingPatterns) {
            if (pattern.test(combined)) {
                score += 0.05;
            }
        }
        // Factor 2: Learning from failures
        const failureInsights = context.insights.filter(i => i.type === 'failure');
        const failureAvoidance = failureInsights.length * 0.03;
        score += Math.min(0.15, failureAvoidance);
        // Factor 3: Avoiding known bad strategies
        const relevantFailures = context.failedStrategies.filter(f => f.hitCount > 1);
        if (relevantFailures.length > 0) {
            const avoidedStrategies = solution.metadata.avoidingStrategies || [];
            const avoidanceRatio = avoidedStrategies.length / relevantFailures.length;
            score += avoidanceRatio * 0.1;
        }
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Calculate recent improvement rate
     */
    calculateRecentImprovement(trials) {
        if (trials.length < 2)
            return 0;
        const recent = trials.slice(-5);
        if (recent.length < 2)
            return 0;
        const firstScore = recent[0].score.totalScore;
        const lastScore = recent[recent.length - 1].score.totalScore;
        return (lastScore - firstScore) / recent.length;
    }
    /**
     * Update weights dynamically based on performance
     */
    updateWeights(trialResults) {
        if (trialResults.length < 10)
            return;
        // Analyze which factors correlate with improvement
        // This is a simplified adaptive mechanism
        const improvements = trialResults.slice(1).map((trial, i) => ({
            improvement: trial.score.totalScore - trialResults[i].score.totalScore,
            factors: trial.score.components,
        }));
        // Find factor correlations with improvement (simplified)
        const correlations = {
            buildingBlocks: 0,
            extensibility: 0,
            learningTrajectory: 0,
            insightDensity: 0,
            compoundPotential: 0,
            riskMitigation: 0,
        };
        for (const imp of improvements) {
            if (imp.improvement > 0) {
                correlations.buildingBlocks += imp.factors.correctness;
                correlations.extensibility += imp.factors.maintainability;
                correlations.compoundPotential += imp.factors.potential;
            }
        }
        // Normalize and blend with existing weights (conservative update)
        const maxCorr = Math.max(...Object.values(correlations));
        if (maxCorr > 0) {
            for (const key of Object.keys(correlations)) {
                const normalized = correlations[key] / maxCorr;
                // Blend: 80% old weight + 20% learned correlation
                this.weights[key] = this.weights[key] * 0.8 + normalized * 0.2;
            }
            // Re-normalize weights to sum to 1
            const totalWeight = Object.values(this.weights).reduce((a, b) => a + b, 0);
            for (const key of Object.keys(this.weights)) {
                this.weights[key] /= totalWeight;
            }
        }
    }
    /**
     * Get current weights
     */
    getWeights() {
        return { ...this.weights };
    }
}
// Singleton instance with default weights
export const virtualPowerScorer = new VirtualPowerScorer();
// Convenience function
export async function calculateVirtualPower(solution, context, lookAheadDepth = 2) {
    const result = await virtualPowerScorer.calculateVirtualPower(solution, context, lookAheadDepth);
    return result.score;
}
//# sourceMappingURL=virtual-power.js.map