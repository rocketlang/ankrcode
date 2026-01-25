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
  parentId?: string; // For tracking lineage
}

/**
 * Score breakdown for a solution
 */
export interface SolutionScore {
  solutionId: string;

  // Immediate value (traditional scoring)
  immediateScore: number;

  // Virtual Power score (future potential value)
  virtualPowerScore: number;

  // Combined weighted score
  totalScore: number;

  // Component scores
  components: {
    correctness: number;      // Does it work?
    efficiency: number;       // How well does it perform?
    maintainability: number;  // How clean is the code?
    potential: number;        // Future improvement potential
  };

  // Confidence in this score
  confidence: number;

  // Reasoning for the score
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
  duration: number; // ms
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
  applicableTo: string[]; // Tags for when this insight applies
  createdAt: Date;
}

/**
 * Strategy for exploring solution space
 */
export type ExplorationStrategy =
  | 'greedy'           // Best immediate choice at each step
  | 'annealing'        // Simulated annealing with temperature
  | 'hybrid'           // Greedy baseline + annealing refinement
  | 'beam'             // Beam search with k candidates
  | 'evolutionary';    // Genetic algorithm style

/**
 * Configuration for ALE optimization
 */
export interface ALEConfig {
  // Problem definition
  task: string;
  objective: string;
  constraints?: string[];

  // Optimization parameters
  maxTrials: number;
  maxDuration: number; // ms
  targetScore: number; // Stop if achieved

  // Strategy configuration
  strategy: ExplorationStrategy;
  temperature?: number;        // For annealing (0-1)
  coolingRate?: number;        // For annealing
  beamWidth?: number;          // For beam search
  populationSize?: number;     // For evolutionary

  // Virtual Power settings
  virtualPowerWeight: number;  // 0-1, how much to weight future potential
  lookAheadDepth: number;      // How many steps to simulate ahead

  // Memory settings
  useWorkingMemory: boolean;   // Use EON for failed strategy avoidance
  storeInsights: boolean;      // Store insights for future runs

  // Agent integration
  agentType?: string;          // Which agent type to use for execution
  tools?: string[];            // Available tools

  // Callbacks
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

  // Statistics
  totalTrials: number;
  totalDuration: number;
  averageScore: number;
  scoreImprovement: number; // Best - First

  // History
  trials: Trial[];
  insights: Insight[];

  // Metadata
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
  hitCount: number; // How many times this has prevented repeat failures
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
