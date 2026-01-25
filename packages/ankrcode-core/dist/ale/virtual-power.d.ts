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
import type { Solution, ScorerContext, Trial } from './types.js';
/**
 * Virtual Power factors and their weights
 */
export interface VirtualPowerFactors {
    buildingBlocks: number;
    extensibility: number;
    learningTrajectory: number;
    insightDensity: number;
    compoundPotential: number;
    riskMitigation: number;
}
/**
 * Virtual Power Scorer class
 */
export declare class VirtualPowerScorer {
    private weights;
    constructor(weights?: Partial<VirtualPowerFactors>);
    /**
     * Calculate full Virtual Power score with breakdown
     */
    calculateVirtualPower(solution: Solution, context: ScorerContext, lookAheadDepth?: number): Promise<{
        score: number;
        factors: VirtualPowerFactors;
        reasoning: string;
    }>;
    /**
     * Score building blocks factor
     * Higher if solution creates reusable components
     */
    private scoreBuildingBlocks;
    /**
     * Score extensibility factor
     * Higher if solution is easy to extend
     */
    private scoreExtensibility;
    /**
     * Score learning trajectory
     * Higher if recent trials show improvement
     */
    private scoreLearningTrajectory;
    /**
     * Score insight density
     * Higher if we're learning more per trial
     */
    private scoreInsightDensity;
    /**
     * Score compound potential
     * Higher if solution enables exponential future improvement
     */
    private scoreCompoundPotential;
    /**
     * Score risk mitigation
     * Higher if solution reduces future failure probability
     */
    private scoreRiskMitigation;
    /**
     * Calculate recent improvement rate
     */
    private calculateRecentImprovement;
    /**
     * Update weights dynamically based on performance
     */
    updateWeights(trialResults: Trial[]): void;
    /**
     * Get current weights
     */
    getWeights(): VirtualPowerFactors;
}
export declare const virtualPowerScorer: VirtualPowerScorer;
export declare function calculateVirtualPower(solution: Solution, context: ScorerContext, lookAheadDepth?: number): Promise<number>;
//# sourceMappingURL=virtual-power.d.ts.map