/**
 * Solution Space Explorer
 * Implements exploration strategies: Greedy, Simulated Annealing, Hybrid, Beam Search
 *
 * Key insight from Sakana's ALE-Agent:
 * ALE-Agent integrated Greedy methods directly into the simulated annealing phase
 * to avoid getting stuck in local optima, using high-speed reconstruction to
 * delete and rebuild large sections of the solution on the fly.
 */

import type {
  Solution,
  SolutionScore,
  ExplorationStrategy,
  GeneratorContext,
  Trial,
} from './types.js';

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
  lastImprovement: number; // iteration when last improved
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
  // Annealing parameters
  initialTemperature: number;
  minTemperature: number;
  coolingRate: number;
  reheatingThreshold: number; // Stuck iterations before reheating
  reheatingFactor: number;

  // Beam search parameters
  beamWidth: number;
  beamPruneThreshold: number;

  // Evolutionary parameters
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  elitismCount: number;

  // General
  stuckThreshold: number; // Iterations without improvement before intervention
}

const DEFAULT_CONFIG: ExplorerConfig = {
  initialTemperature: 1.0,
  minTemperature: 0.01,
  coolingRate: 0.95,
  reheatingThreshold: 10,
  reheatingFactor: 1.5,
  beamWidth: 3,
  beamPruneThreshold: 0.5,
  populationSize: 10,
  mutationRate: 0.1,
  crossoverRate: 0.7,
  elitismCount: 2,
  stuckThreshold: 15,
};

/**
 * Solution Space Explorer class
 */
export class SolutionSpaceExplorer {
  private config: ExplorerConfig;
  private state: ExplorationState;
  private beamCandidates: BeamCandidate[] = [];
  private population: BeamCandidate[] = [];

  constructor(config: Partial<ExplorerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();
  }

  /**
   * Create initial exploration state
   */
  private createInitialState(): ExplorationState {
    return {
      currentBest: null,
      currentBestScore: 0,
      temperature: this.config.initialTemperature,
      acceptedWorse: 0,
      rejectedWorse: 0,
      totalExplorations: 0,
      stuckCount: 0,
      lastImprovement: 0,
    };
  }

  /**
   * Reset explorer state
   */
  reset(): void {
    this.state = this.createInitialState();
    this.beamCandidates = [];
    this.population = [];
  }

  /**
   * Explore solution space using specified strategy
   */
  async explore(
    strategy: ExplorationStrategy,
    context: GeneratorContext,
    generateCandidate: (ctx: GeneratorContext) => Promise<Solution>,
    scoreCandidate: (sol: Solution) => Promise<SolutionScore>
  ): Promise<Solution> {
    this.state.totalExplorations++;

    switch (strategy) {
      case 'greedy':
        return this.greedyExplore(context, generateCandidate, scoreCandidate);

      case 'annealing':
        return this.annealingExplore(context, generateCandidate, scoreCandidate);

      case 'hybrid':
        return this.hybridExplore(context, generateCandidate, scoreCandidate);

      case 'beam':
        return this.beamExplore(context, generateCandidate, scoreCandidate);

      case 'evolutionary':
        return this.evolutionaryExplore(context, generateCandidate, scoreCandidate);

      default:
        return this.greedyExplore(context, generateCandidate, scoreCandidate);
    }
  }

  /**
   * Greedy exploration: Always take the best immediate option
   */
  private async greedyExplore(
    context: GeneratorContext,
    generateCandidate: (ctx: GeneratorContext) => Promise<Solution>,
    scoreCandidate: (sol: Solution) => Promise<SolutionScore>
  ): Promise<Solution> {
    // Generate new candidate based on best so far
    const candidate = await generateCandidate({
      ...context,
      bestSolution: this.state.currentBest || undefined,
      temperature: 0, // No exploration in pure greedy
    });

    const score = await scoreCandidate(candidate);

    // Accept only if better
    if (score.totalScore > this.state.currentBestScore) {
      this.state.currentBest = candidate;
      this.state.currentBestScore = score.totalScore;
      this.state.lastImprovement = this.state.totalExplorations;
      this.state.stuckCount = 0;
    } else {
      this.state.stuckCount++;
    }

    candidate.metadata.explorationStrategy = 'greedy';
    candidate.metadata.accepted = score.totalScore > this.state.currentBestScore;

    return candidate;
  }

  /**
   * Simulated Annealing: Sometimes accept worse solutions to escape local optima
   */
  private async annealingExplore(
    context: GeneratorContext,
    generateCandidate: (ctx: GeneratorContext) => Promise<Solution>,
    scoreCandidate: (sol: Solution) => Promise<SolutionScore>
  ): Promise<Solution> {
    // Generate candidate with temperature-influenced exploration
    const candidate = await generateCandidate({
      ...context,
      bestSolution: this.state.currentBest || undefined,
      temperature: this.state.temperature,
    });

    const score = await scoreCandidate(candidate);
    const scoreDelta = score.totalScore - this.state.currentBestScore;

    // Acceptance decision
    let accepted = false;

    if (scoreDelta > 0) {
      // Always accept improvements
      accepted = true;
      this.state.currentBest = candidate;
      this.state.currentBestScore = score.totalScore;
      this.state.lastImprovement = this.state.totalExplorations;
      this.state.stuckCount = 0;
    } else {
      // Probabilistically accept worse solutions based on temperature
      // Boltzmann acceptance: P = exp(delta / T)
      const acceptanceProbability = Math.exp(scoreDelta / this.state.temperature);

      if (Math.random() < acceptanceProbability) {
        accepted = true;
        this.state.acceptedWorse++;
        // Don't update best, but continue from this point
      } else {
        this.state.rejectedWorse++;
        this.state.stuckCount++;
      }
    }

    // Cool down temperature
    this.state.temperature = Math.max(
      this.config.minTemperature,
      this.state.temperature * this.config.coolingRate
    );

    // Reheat if stuck
    if (this.state.stuckCount >= this.config.reheatingThreshold) {
      this.reheat();
    }

    candidate.metadata.explorationStrategy = 'annealing';
    candidate.metadata.accepted = accepted;
    candidate.metadata.temperature = this.state.temperature;
    candidate.metadata.acceptanceProbability = scoreDelta > 0 ? 1 : Math.exp(scoreDelta / this.state.temperature);

    return candidate;
  }

  /**
   * Hybrid exploration: Greedy baseline + Annealing refinement
   * This is the key innovation from Sakana's ALE-Agent
   */
  private async hybridExplore(
    context: GeneratorContext,
    generateCandidate: (ctx: GeneratorContext) => Promise<Solution>,
    scoreCandidate: (sol: Solution) => Promise<SolutionScore>
  ): Promise<Solution> {
    const iteration = context.iteration;

    // Phase 1: Greedy exploration (first 30% of iterations)
    // Build a strong baseline using greedy approach
    if (iteration < 10 || this.state.currentBest === null) {
      const candidate = await this.greedyExplore(context, generateCandidate, scoreCandidate);
      candidate.metadata.hybridPhase = 'greedy_baseline';
      return candidate;
    }

    // Phase 2: Reconstruction (occasionally rebuild large sections)
    // This allows escaping local optima by "deleting and rebuilding"
    const shouldReconstruct = this.shouldReconstruct();
    if (shouldReconstruct) {
      const candidate = await this.reconstructionExplore(context, generateCandidate, scoreCandidate);
      candidate.metadata.hybridPhase = 'reconstruction';
      return candidate;
    }

    // Phase 3: Annealing refinement (main phase)
    // Fine-tune around the best solution
    const candidate = await this.annealingExplore(context, generateCandidate, scoreCandidate);
    candidate.metadata.hybridPhase = 'annealing_refinement';

    // Greedy integration: After annealing, try a greedy improvement
    // This is the "integration" aspect from ALE-Agent
    if (Math.random() < 0.3) {
      const greedyCandidate = await generateCandidate({
        ...context,
        bestSolution: candidate,
        temperature: 0,
      });
      const greedyScore = await scoreCandidate(greedyCandidate);

      if (greedyScore.totalScore > this.state.currentBestScore) {
        this.state.currentBest = greedyCandidate;
        this.state.currentBestScore = greedyScore.totalScore;
        this.state.lastImprovement = this.state.totalExplorations;
        greedyCandidate.metadata.hybridPhase = 'greedy_integration';
        return greedyCandidate;
      }
    }

    return candidate;
  }

  /**
   * Reconstruction exploration: Delete and rebuild sections
   * Inspired by ALE-Agent's "high-speed reconstruction"
   */
  private async reconstructionExplore(
    context: GeneratorContext,
    generateCandidate: (ctx: GeneratorContext) => Promise<Solution>,
    scoreCandidate: (sol: Solution) => Promise<SolutionScore>
  ): Promise<Solution> {
    // Generate completely new solution (not based on current best)
    // This "deletes" the current approach and starts fresh
    const freshCandidate = await generateCandidate({
      ...context,
      bestSolution: undefined, // Don't use current best
      temperature: this.config.initialTemperature, // High exploration
      previousSolutions: context.previousSolutions.slice(-5), // Limited history
    });

    const score = await scoreCandidate(freshCandidate);

    // Accept if competitive (within threshold of best)
    if (score.totalScore > this.state.currentBestScore * 0.9) {
      if (score.totalScore > this.state.currentBestScore) {
        this.state.currentBest = freshCandidate;
        this.state.currentBestScore = score.totalScore;
        this.state.lastImprovement = this.state.totalExplorations;
      }
      this.state.stuckCount = 0;
      // Reset temperature after successful reconstruction
      this.state.temperature = this.config.initialTemperature * 0.5;
    }

    freshCandidate.metadata.explorationStrategy = 'reconstruction';
    freshCandidate.metadata.reconstructionReason = this.state.stuckCount > 10 ? 'stuck' : 'exploration';

    return freshCandidate;
  }

  /**
   * Beam search exploration: Track multiple candidates
   */
  private async beamExplore(
    context: GeneratorContext,
    generateCandidate: (ctx: GeneratorContext) => Promise<Solution>,
    scoreCandidate: (sol: Solution) => Promise<SolutionScore>
  ): Promise<Solution> {
    // Initialize beam if empty
    if (this.beamCandidates.length === 0) {
      const initial = await generateCandidate(context);
      const score = await scoreCandidate(initial);
      this.beamCandidates.push({
        solution: initial,
        score: score.totalScore,
        generation: 0,
      });
    }

    // Expand each candidate in beam
    const newCandidates: BeamCandidate[] = [];

    for (const beamCandidate of this.beamCandidates) {
      // Generate 2 successors per candidate
      for (let i = 0; i < 2; i++) {
        const successor = await generateCandidate({
          ...context,
          bestSolution: beamCandidate.solution,
          temperature: this.state.temperature * (1 - i * 0.3),
        });

        const score = await scoreCandidate(successor);

        newCandidates.push({
          solution: successor,
          score: score.totalScore,
          parentId: beamCandidate.solution.id,
          generation: beamCandidate.generation + 1,
        });
      }
    }

    // Prune to beam width
    const allCandidates = [...this.beamCandidates, ...newCandidates];
    allCandidates.sort((a, b) => b.score - a.score);
    this.beamCandidates = allCandidates.slice(0, this.config.beamWidth);

    // Update best
    const best = this.beamCandidates[0];
    if (best.score > this.state.currentBestScore) {
      this.state.currentBest = best.solution;
      this.state.currentBestScore = best.score;
      this.state.lastImprovement = this.state.totalExplorations;
    }

    // Return best from current beam
    best.solution.metadata.explorationStrategy = 'beam';
    best.solution.metadata.beamPosition = 0;
    best.solution.metadata.beamWidth = this.beamCandidates.length;

    return best.solution;
  }

  /**
   * Evolutionary exploration: Genetic algorithm style
   */
  private async evolutionaryExplore(
    context: GeneratorContext,
    generateCandidate: (ctx: GeneratorContext) => Promise<Solution>,
    scoreCandidate: (sol: Solution) => Promise<SolutionScore>
  ): Promise<Solution> {
    // Initialize population if empty
    if (this.population.length < this.config.populationSize) {
      const candidate = await generateCandidate(context);
      const score = await scoreCandidate(candidate);
      this.population.push({
        solution: candidate,
        score: score.totalScore,
        generation: 0,
      });

      if (score.totalScore > this.state.currentBestScore) {
        this.state.currentBest = candidate;
        this.state.currentBestScore = score.totalScore;
      }

      candidate.metadata.explorationStrategy = 'evolutionary';
      candidate.metadata.evolutionaryPhase = 'initialization';
      return candidate;
    }

    // Selection (tournament)
    const parent1 = this.tournamentSelect();
    const parent2 = this.tournamentSelect();

    // Generate offspring (simulated crossover/mutation)
    const offspring = await generateCandidate({
      ...context,
      bestSolution: Math.random() < 0.5 ? parent1.solution : parent2.solution,
      temperature: this.config.mutationRate,
      previousSolutions: [parent1.solution, parent2.solution],
    });

    const offspringScore = await scoreCandidate(offspring);

    // Replace worst in population
    this.population.sort((a, b) => a.score - b.score);
    if (offspringScore.totalScore > this.population[0].score) {
      this.population[0] = {
        solution: offspring,
        score: offspringScore.totalScore,
        parentId: parent1.solution.id,
        generation: Math.max(parent1.generation, parent2.generation) + 1,
      };
    }

    // Update best
    if (offspringScore.totalScore > this.state.currentBestScore) {
      this.state.currentBest = offspring;
      this.state.currentBestScore = offspringScore.totalScore;
      this.state.lastImprovement = this.state.totalExplorations;
    }

    offspring.metadata.explorationStrategy = 'evolutionary';
    offspring.metadata.evolutionaryPhase = 'evolution';
    offspring.metadata.generation = this.population[this.population.length - 1]?.generation || 0;

    return offspring;
  }

  /**
   * Tournament selection for evolutionary strategy
   */
  private tournamentSelect(): BeamCandidate {
    const tournamentSize = 3;
    const selected: BeamCandidate[] = [];

    for (let i = 0; i < tournamentSize; i++) {
      const idx = Math.floor(Math.random() * this.population.length);
      selected.push(this.population[idx]);
    }

    selected.sort((a, b) => b.score - a.score);
    return selected[0];
  }

  /**
   * Determine if reconstruction is needed
   */
  private shouldReconstruct(): boolean {
    // Reconstruct if stuck for too long
    if (this.state.stuckCount > this.config.stuckThreshold) {
      return true;
    }

    // Random reconstruction (5% chance per iteration)
    if (Math.random() < 0.05) {
      return true;
    }

    return false;
  }

  /**
   * Reheat temperature (escape local optima)
   */
  private reheat(): void {
    this.state.temperature = Math.min(
      this.config.initialTemperature,
      this.state.temperature * this.config.reheatingFactor
    );
    this.state.stuckCount = 0;
  }

  /**
   * Get current exploration state
   */
  getState(): ExplorationState {
    return { ...this.state };
  }

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
  } {
    const totalWorse = this.state.acceptedWorse + this.state.rejectedWorse;
    const acceptanceRate = totalWorse > 0
      ? this.state.acceptedWorse / totalWorse
      : 0;

    return {
      totalExplorations: this.state.totalExplorations,
      acceptanceRate,
      currentTemperature: this.state.temperature,
      stuckCount: this.state.stuckCount,
      bestScore: this.state.currentBestScore,
      beamSize: this.beamCandidates.length,
      populationSize: this.population.length,
    };
  }

  /**
   * Force temperature setting (for external control)
   */
  setTemperature(temperature: number): void {
    this.state.temperature = Math.max(
      this.config.minTemperature,
      Math.min(this.config.initialTemperature, temperature)
    );
  }

  /**
   * Inject a solution as current best (for warm starting)
   */
  warmStart(solution: Solution, score: number): void {
    this.state.currentBest = solution;
    this.state.currentBestScore = score;
    this.state.lastImprovement = this.state.totalExplorations;

    // Also add to beam/population if applicable
    this.beamCandidates.push({
      solution,
      score,
      generation: 0,
    });

    this.population.push({
      solution,
      score,
      generation: 0,
    });
  }
}

// Singleton instance
export const solutionSpaceExplorer = new SolutionSpaceExplorer();

// Convenience function
export async function exploreSolutionSpace(
  strategy: ExplorationStrategy,
  context: GeneratorContext,
  generateCandidate: (ctx: GeneratorContext) => Promise<Solution>,
  scoreCandidate: (sol: Solution) => Promise<SolutionScore>
): Promise<Solution> {
  return solutionSpaceExplorer.explore(strategy, context, generateCandidate, scoreCandidate);
}
