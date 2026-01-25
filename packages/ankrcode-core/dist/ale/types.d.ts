/**
 * ALE (Agentic Learning Engine) Types
 * Inspired by Sakana AI's ALE-Agent for inference-time optimization
 */
/**
 * Solution represents a candidate solution being optimized
 */
export interface Solution {
    id: string;
    content: string;
    code?: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
    iteration: number;
    parentId?: string;
}
/**
 * Score breakdown for a solution
 */
export interface SolutionScore {
    solutionId: string;
    immediateScore: number;
    virtualPowerScore: number;
    totalScore: number;
    components: {
        correctness: number;
        efficiency: number;
        maintainability: number;
        potential: number;
    };
    confidence: number;
    reasoning: string;
}
/**
 * Trial represents one attempt at solving a problem
 */
export interface Trial {
    id: string;
    iteration: number;
    solution: Solution;
    score: SolutionScore;
    duration: number;
    toolsUsed: string[];
    startedAt: Date;
    completedAt: Date;
}
/**
 * Insight extracted from a trial
 */
export interface Insight {
    id: string;
    trialId: string;
    type: 'success' | 'failure' | 'pattern' | 'observation';
    content: string;
    confidence: number;
    applicableTo: string[];
    createdAt: Date;
}
/**
 * Strategy for exploring solution space
 */
export type ExplorationStrategy = 'greedy' | 'annealing' | 'hybrid' | 'beam' | 'evolutionary';
/**
 * Configuration for ALE optimization
 */
export interface ALEConfig {
    task: string;
    objective: string;
    constraints?: string[];
    maxTrials: number;
    maxDuration: number;
    targetScore: number;
    strategy: ExplorationStrategy;
    temperature?: number;
    coolingRate?: number;
    beamWidth?: number;
    populationSize?: number;
    virtualPowerWeight: number;
    lookAheadDepth: number;
    useWorkingMemory: boolean;
    storeInsights: boolean;
    agentType?: string;
    tools?: string[];
    onTrialComplete?: (trial: Trial) => void;
    onInsightGenerated?: (insight: Insight) => void;
    onProgressUpdate?: (progress: ALEProgress) => void;
}
/**
 * Progress update during optimization
 */
export interface ALEProgress {
    currentTrial: number;
    totalTrials: number;
    bestScore: number;
    averageScore: number;
    elapsedTime: number;
    estimatedRemaining: number;
    currentPhase: 'exploring' | 'refining' | 'converging';
    temperature?: number;
}
/**
 * Result of ALE optimization
 */
export interface ALEResult {
    success: boolean;
    bestSolution: Solution;
    bestScore: SolutionScore;
    totalTrials: number;
    totalDuration: number;
    averageScore: number;
    scoreImprovement: number;
    trials: Trial[];
    insights: Insight[];
    config: ALEConfig;
    completedAt: Date;
    stoppedReason: 'target_reached' | 'max_trials' | 'timeout' | 'converged' | 'stopped';
}
/**
 * Working memory entry for failed strategies
 */
export interface FailedStrategy {
    id: string;
    description: string;
    reason: string;
    taskPattern: string;
    avoidanceHint: string;
    createdAt: Date;
    hitCount: number;
}
/**
 * ALE Engine status
 */
export type ALEStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'stopped';
/**
 * ALE Engine state
 */
export interface ALEState {
    id: string;
    status: ALEStatus;
    config: ALEConfig;
    progress: ALEProgress;
    currentTrial?: Trial;
    bestSolution?: Solution;
    bestScore?: SolutionScore;
    trials: Trial[];
    insights: Insight[];
    startedAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    error?: string;
}
/**
 * Scorer function type
 */
export type ScorerFunction = (solution: Solution, context: ScorerContext) => Promise<SolutionScore>;
/**
 * Context passed to scorer
 */
export interface ScorerContext {
    task: string;
    objective: string;
    constraints: string[];
    previousTrials: Trial[];
    insights: Insight[];
    failedStrategies: FailedStrategy[];
}
/**
 * Generator function type for creating new solutions
 */
export type SolutionGenerator = (context: GeneratorContext) => Promise<Solution>;
/**
 * Context passed to solution generator
 */
export interface GeneratorContext {
    task: string;
    objective: string;
    constraints: string[];
    previousSolutions: Solution[];
    bestSolution?: Solution;
    insights: Insight[];
    failedStrategies: FailedStrategy[];
    temperature: number;
    iteration: number;
}
//# sourceMappingURL=types.d.ts.map