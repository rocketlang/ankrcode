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
// Default configuration
const DEFAULT_CONFIG = {
    maxTrials: 100,
    maxDuration: 300000, // 5 minutes
    targetScore: 0.95,
    strategy: 'hybrid',
    temperature: 0.8,
    coolingRate: 0.95,
    beamWidth: 3,
    virtualPowerWeight: 0.3,
    lookAheadDepth: 2,
    useWorkingMemory: true,
    storeInsights: true,
};
/**
 * Generate unique ID
 */
function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}
/**
 * ALE Engine - Main optimization engine
 */
export class ALEEngine extends EventEmitter {
    sessions = new Map();
    runningSessions = new Set();
    // Pluggable components
    scorer = null;
    generator = null;
    // Working memory (failed strategies)
    failedStrategies = [];
    /**
     * Set custom scorer function
     */
    setScorer(scorer) {
        this.scorer = scorer;
    }
    /**
     * Set custom solution generator
     */
    setGenerator(generator) {
        this.generator = generator;
    }
    /**
     * Start a new optimization session
     */
    async optimize(config) {
        const fullConfig = {
            ...DEFAULT_CONFIG,
            ...config,
            constraints: config.constraints || [],
        };
        const id = generateId('ale');
        const state = {
            id,
            status: 'running',
            config: fullConfig,
            progress: {
                currentTrial: 0,
                totalTrials: fullConfig.maxTrials,
                bestScore: 0,
                averageScore: 0,
                elapsedTime: 0,
                estimatedRemaining: fullConfig.maxDuration,
                currentPhase: 'exploring',
                temperature: fullConfig.temperature,
            },
            trials: [],
            insights: [],
            startedAt: new Date(),
            updatedAt: new Date(),
        };
        this.sessions.set(id, state);
        this.runningSessions.add(id);
        this.emit('session:started', state);
        try {
            const result = await this.runOptimization(id, fullConfig);
            return result;
        }
        catch (error) {
            const err = error;
            this.updateState(id, {
                status: 'failed',
                error: err.message,
                completedAt: new Date(),
            });
            this.emit('session:failed', { id, error: err.message });
            throw error;
        }
        finally {
            this.runningSessions.delete(id);
        }
    }
    /**
     * Main optimization loop
     */
    async runOptimization(id, config) {
        const startTime = Date.now();
        let temperature = config.temperature || 0.8;
        const coolingRate = config.coolingRate || 0.95;
        // Load failed strategies from working memory
        const failedStrategies = config.useWorkingMemory
            ? await this.loadFailedStrategies(config.task)
            : [];
        let bestSolution;
        let bestScore;
        const allTrials = [];
        const allInsights = [];
        // Phase 1: Exploration (Greedy)
        this.updateProgress(id, { currentPhase: 'exploring' });
        for (let i = 0; i < config.maxTrials; i++) {
            const state = this.sessions.get(id);
            if (!state || state.status === 'stopped' || state.status === 'paused') {
                break;
            }
            // Check timeout
            const elapsed = Date.now() - startTime;
            if (elapsed > config.maxDuration) {
                this.log(id, 'info', 'Optimization timed out');
                break;
            }
            // Update progress
            this.updateProgress(id, {
                currentTrial: i + 1,
                elapsedTime: elapsed,
                estimatedRemaining: Math.max(0, config.maxDuration - elapsed),
                temperature,
            });
            // Generate new solution
            const generatorContext = {
                task: config.task,
                objective: config.objective,
                constraints: config.constraints || [],
                previousSolutions: allTrials.map(t => t.solution),
                bestSolution,
                insights: allInsights,
                failedStrategies,
                temperature,
                iteration: i,
            };
            const solution = await this.generateSolution(generatorContext, config);
            // Score the solution
            const scorerContext = {
                task: config.task,
                objective: config.objective,
                constraints: config.constraints || [],
                previousTrials: allTrials,
                insights: allInsights,
                failedStrategies,
            };
            const trialStart = Date.now();
            const score = await this.scoreSolution(solution, scorerContext, config);
            const trialDuration = Date.now() - trialStart;
            // Create trial record
            const trial = {
                id: generateId('trial'),
                iteration: i,
                solution,
                score,
                duration: trialDuration,
                toolsUsed: config.tools || [],
                startedAt: new Date(trialStart),
                completedAt: new Date(),
            };
            allTrials.push(trial);
            // Update best solution
            if (!bestScore || score.totalScore > bestScore.totalScore) {
                bestSolution = solution;
                bestScore = score;
                this.log(id, 'info', `New best score: ${score.totalScore.toFixed(4)} at trial ${i + 1}`);
                this.emit('session:improved', { id, trial, score });
            }
            // Update progress with scores
            const avgScore = allTrials.reduce((sum, t) => sum + t.score.totalScore, 0) / allTrials.length;
            this.updateProgress(id, {
                bestScore: bestScore.totalScore,
                averageScore: avgScore,
            });
            // Generate insights from this trial
            const insight = await this.generateInsight(trial, allTrials, config);
            if (insight) {
                allInsights.push(insight);
                this.emit('insight:generated', insight);
                config.onInsightGenerated?.(insight);
            }
            // Callback
            config.onTrialComplete?.(trial);
            this.emit('trial:completed', trial);
            // Check if target reached
            if (score.totalScore >= config.targetScore) {
                this.log(id, 'info', `Target score ${config.targetScore} reached!`);
                break;
            }
            // Detect convergence
            if (this.hasConverged(allTrials, config)) {
                this.log(id, 'info', 'Optimization converged');
                this.updateProgress(id, { currentPhase: 'converging' });
                break;
            }
            // Phase transition: Exploration → Refinement
            if (i > config.maxTrials * 0.3 && state.progress.currentPhase === 'exploring') {
                this.updateProgress(id, { currentPhase: 'refining' });
            }
            // Cool down temperature (simulated annealing)
            if (config.strategy === 'annealing' || config.strategy === 'hybrid') {
                temperature *= coolingRate;
                this.updateProgress(id, { temperature });
            }
        }
        // Store failed strategies for future avoidance
        if (config.useWorkingMemory) {
            await this.storeFailedStrategies(allTrials, allInsights, config.task);
        }
        // Determine stop reason
        const elapsed = Date.now() - startTime;
        let stoppedReason = 'max_trials';
        if (bestScore && bestScore.totalScore >= config.targetScore) {
            stoppedReason = 'target_reached';
        }
        else if (elapsed >= config.maxDuration) {
            stoppedReason = 'timeout';
        }
        else if (this.hasConverged(allTrials, config)) {
            stoppedReason = 'converged';
        }
        else if (this.sessions.get(id)?.status === 'stopped') {
            stoppedReason = 'stopped';
        }
        // Build result
        const result = {
            success: bestScore ? bestScore.totalScore >= config.targetScore : false,
            bestSolution: bestSolution || this.createEmptySolution(config),
            bestScore: bestScore || this.createEmptyScore(),
            totalTrials: allTrials.length,
            totalDuration: elapsed,
            averageScore: allTrials.length > 0
                ? allTrials.reduce((sum, t) => sum + t.score.totalScore, 0) / allTrials.length
                : 0,
            scoreImprovement: allTrials.length > 1
                ? (bestScore?.totalScore || 0) - allTrials[0].score.totalScore
                : 0,
            trials: allTrials,
            insights: allInsights,
            config,
            completedAt: new Date(),
            stoppedReason,
        };
        // Update state
        this.updateState(id, {
            status: 'completed',
            bestSolution,
            bestScore,
            trials: allTrials,
            insights: allInsights,
            completedAt: new Date(),
        });
        this.emit('session:completed', result);
        return result;
    }
    /**
     * Generate a new solution candidate
     */
    async generateSolution(context, config) {
        // Use custom generator if provided
        if (this.generator) {
            return this.generator(context);
        }
        // Default generator (placeholder - in real impl, would call LLM)
        const solution = {
            id: generateId('sol'),
            content: `Solution for: ${context.task}`,
            metadata: {
                strategy: config.strategy,
                temperature: context.temperature,
                basedOn: context.bestSolution?.id,
            },
            createdAt: new Date(),
            iteration: context.iteration,
            parentId: context.bestSolution?.id,
        };
        // Apply strategy-specific modifications
        switch (config.strategy) {
            case 'greedy':
                // Pure greedy: Always try to improve on best
                solution.metadata.approach = 'greedy_improve';
                break;
            case 'annealing':
                // Simulated annealing: Sometimes accept worse solutions
                const acceptWorse = Math.random() < context.temperature;
                solution.metadata.approach = acceptWorse ? 'annealing_explore' : 'annealing_exploit';
                break;
            case 'hybrid':
                // Hybrid: Greedy baseline + annealing refinement
                if (context.iteration < 10) {
                    solution.metadata.approach = 'hybrid_greedy_phase';
                }
                else {
                    const shouldExplore = Math.random() < context.temperature * 0.5;
                    solution.metadata.approach = shouldExplore ? 'hybrid_explore' : 'hybrid_refine';
                }
                break;
            case 'beam':
                // Beam search: Track multiple candidates
                solution.metadata.approach = 'beam_candidate';
                solution.metadata.beamWidth = config.beamWidth;
                break;
            case 'evolutionary':
                // Evolutionary: Mutation + crossover
                solution.metadata.approach = 'evolutionary_mutate';
                solution.metadata.populationSize = config.populationSize;
                break;
        }
        // Avoid failed strategies
        const relevantFailures = context.failedStrategies.filter(f => this.isStrategyRelevant(f, context.task));
        if (relevantFailures.length > 0) {
            solution.metadata.avoidingStrategies = relevantFailures.map(f => f.id);
        }
        return solution;
    }
    /**
     * Score a solution using Virtual Power concept
     */
    async scoreSolution(solution, context, config) {
        // Use custom scorer if provided
        if (this.scorer) {
            return this.scorer(solution, context);
        }
        // Default scorer (placeholder - in real impl, would evaluate via execution)
        // Immediate score (traditional evaluation)
        const immediateScore = this.calculateImmediateScore(solution, context);
        // Virtual Power score (future potential)
        const virtualPowerScore = await this.calculateVirtualPower(solution, context, config.lookAheadDepth);
        // Weighted combination
        const vpWeight = config.virtualPowerWeight;
        const totalScore = (1 - vpWeight) * immediateScore + vpWeight * virtualPowerScore;
        return {
            solutionId: solution.id,
            immediateScore,
            virtualPowerScore,
            totalScore,
            components: {
                correctness: immediateScore * 0.4 + Math.random() * 0.1,
                efficiency: immediateScore * 0.3 + Math.random() * 0.1,
                maintainability: immediateScore * 0.2 + Math.random() * 0.1,
                potential: virtualPowerScore,
            },
            confidence: 0.7 + Math.random() * 0.2,
            reasoning: `Immediate: ${immediateScore.toFixed(3)}, Virtual Power: ${virtualPowerScore.toFixed(3)}`,
        };
    }
    /**
     * Calculate immediate score (traditional evaluation)
     */
    calculateImmediateScore(solution, context) {
        // Placeholder - in real implementation would:
        // 1. Execute the solution
        // 2. Run tests
        // 3. Check constraints
        // 4. Measure performance
        let score = 0.5; // Base score
        // Boost if building on successful solution
        if (solution.parentId) {
            const parentTrial = context.previousTrials.find(t => t.solution.id === solution.parentId);
            if (parentTrial && parentTrial.score.totalScore > 0.7) {
                score += 0.1;
            }
        }
        // Apply insights
        const relevantInsights = context.insights.filter(i => i.type === 'success');
        score += relevantInsights.length * 0.02;
        // Penalize if similar to failed strategies
        const failures = context.failedStrategies.filter(f => this.isStrategyRelevant(f, context.task));
        score -= failures.length * 0.05;
        // Add some randomness (simulating real evaluation variance)
        score += (Math.random() - 0.5) * 0.2;
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Calculate Virtual Power (future potential value)
     * This is the key innovation from Sakana's ALE-Agent
     */
    async calculateVirtualPower(solution, context, lookAheadDepth) {
        // Virtual Power concept: Value potential future assets rather than just current ones
        // This enables "compound interest effect" - investing early pays off later
        let virtualPower = 0.5; // Base potential
        // Factor 1: Building blocks created
        // Solutions that create reusable components have higher potential
        const hasReusableComponents = solution.content.includes('function') ||
            solution.content.includes('class') ||
            solution.content.includes('module');
        if (hasReusableComponents) {
            virtualPower += 0.1;
        }
        // Factor 2: Extensibility
        // Solutions that are easy to extend have higher potential
        const isExtensible = solution.metadata.approach !== 'greedy_improve';
        if (isExtensible) {
            virtualPower += 0.05;
        }
        // Factor 3: Learning trajectory
        // If recent trials show improvement, future is promising
        if (context.previousTrials.length >= 3) {
            const recentTrials = context.previousTrials.slice(-3);
            const scores = recentTrials.map(t => t.score.totalScore);
            const trend = (scores[2] - scores[0]) / 2;
            virtualPower += trend * 0.2;
        }
        // Factor 4: Insight density
        // More insights = better understanding = higher potential
        const insightDensity = context.insights.length / Math.max(1, context.previousTrials.length);
        virtualPower += insightDensity * 0.1;
        // Factor 5: Look-ahead simulation (simplified)
        // In full implementation, would simulate future iterations
        if (lookAheadDepth > 0) {
            // Simulate potential improvement
            const projectedImprovement = 0.02 * lookAheadDepth;
            virtualPower += projectedImprovement;
        }
        return Math.max(0, Math.min(1, virtualPower));
    }
    /**
     * Generate insight from trial (reflection)
     */
    async generateInsight(trial, allTrials, config) {
        // Not all trials generate insights
        if (Math.random() > 0.3)
            return null;
        const isSuccess = trial.score.totalScore > 0.7;
        const isFailure = trial.score.totalScore < 0.3;
        const isImprovement = allTrials.length > 1 &&
            trial.score.totalScore > allTrials[allTrials.length - 2].score.totalScore;
        let type = 'observation';
        let content = '';
        if (isSuccess) {
            type = 'success';
            content = `Successful approach at iteration ${trial.iteration}: ${trial.solution.metadata.approach}. Score: ${trial.score.totalScore.toFixed(3)}`;
        }
        else if (isFailure) {
            type = 'failure';
            content = `Failed approach at iteration ${trial.iteration}: ${trial.solution.metadata.approach}. Reason: ${trial.score.reasoning}`;
        }
        else if (isImprovement) {
            type = 'pattern';
            content = `Improvement detected at iteration ${trial.iteration}. Strategy ${trial.solution.metadata.approach} yielded +${(trial.score.totalScore - allTrials[allTrials.length - 2].score.totalScore).toFixed(3)}`;
        }
        else {
            content = `Observation at iteration ${trial.iteration}: Score ${trial.score.totalScore.toFixed(3)}, approach: ${trial.solution.metadata.approach}`;
        }
        return {
            id: generateId('insight'),
            trialId: trial.id,
            type,
            content,
            confidence: trial.score.confidence,
            applicableTo: [config.task.split(' ')[0]], // Simple tagging
            createdAt: new Date(),
        };
    }
    /**
     * Check if optimization has converged
     */
    hasConverged(trials, config) {
        if (trials.length < 10)
            return false;
        // Check if last N scores are similar (within threshold)
        const recentScores = trials.slice(-5).map(t => t.score.totalScore);
        const variance = this.calculateVariance(recentScores);
        // Converged if variance is very low
        return variance < 0.001;
    }
    /**
     * Calculate variance of numbers
     */
    calculateVariance(numbers) {
        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
    }
    /**
     * Load failed strategies from working memory (EON)
     */
    async loadFailedStrategies(task) {
        // In real implementation, would query EON
        return this.failedStrategies.filter(f => this.isStrategyRelevant(f, task));
    }
    /**
     * Store failed strategies to working memory
     */
    async storeFailedStrategies(trials, insights, task) {
        // Find consistently failing approaches
        const failedTrials = trials.filter(t => t.score.totalScore < 0.3);
        for (const trial of failedTrials) {
            const existingFailure = this.failedStrategies.find(f => f.description === trial.solution.metadata.approach);
            if (existingFailure) {
                existingFailure.hitCount++;
            }
            else {
                this.failedStrategies.push({
                    id: generateId('fail'),
                    description: String(trial.solution.metadata.approach || 'unknown'),
                    reason: trial.score.reasoning,
                    taskPattern: task.split(' ').slice(0, 3).join(' '),
                    avoidanceHint: `Avoid ${trial.solution.metadata.approach} approach`,
                    createdAt: new Date(),
                    hitCount: 1,
                });
            }
        }
    }
    /**
     * Check if a failed strategy is relevant to current task
     */
    isStrategyRelevant(strategy, task) {
        const taskWords = task.toLowerCase().split(' ');
        const patternWords = strategy.taskPattern.toLowerCase().split(' ');
        const overlap = taskWords.filter(w => patternWords.includes(w));
        return overlap.length >= 2;
    }
    /**
     * Create empty solution (fallback)
     */
    createEmptySolution(config) {
        return {
            id: generateId('sol'),
            content: `No solution found for: ${config.task}`,
            metadata: { empty: true },
            createdAt: new Date(),
            iteration: 0,
        };
    }
    /**
     * Create empty score (fallback)
     */
    createEmptyScore() {
        return {
            solutionId: '',
            immediateScore: 0,
            virtualPowerScore: 0,
            totalScore: 0,
            components: {
                correctness: 0,
                efficiency: 0,
                maintainability: 0,
                potential: 0,
            },
            confidence: 0,
            reasoning: 'No evaluation performed',
        };
    }
    /**
     * Update session state
     */
    updateState(id, updates) {
        const state = this.sessions.get(id);
        if (state) {
            Object.assign(state, updates, { updatedAt: new Date() });
            this.emit('session:updated', state);
        }
    }
    /**
     * Update progress
     */
    updateProgress(id, updates) {
        const state = this.sessions.get(id);
        if (state) {
            Object.assign(state.progress, updates);
            state.updatedAt = new Date();
            this.emit('progress:updated', state.progress);
            state.config.onProgressUpdate?.(state.progress);
        }
    }
    /**
     * Log message
     */
    log(id, level, message) {
        this.emit('log', { id, level, message, timestamp: new Date() });
    }
    /**
     * Stop a running session
     */
    stop(id) {
        const state = this.sessions.get(id);
        if (state && this.runningSessions.has(id)) {
            this.updateState(id, { status: 'stopped' });
            this.emit('session:stopped', { id });
            return true;
        }
        return false;
    }
    /**
     * Pause a running session
     */
    pause(id) {
        const state = this.sessions.get(id);
        if (state && state.status === 'running') {
            this.updateState(id, { status: 'paused' });
            return true;
        }
        return false;
    }
    /**
     * Resume a paused session
     */
    resume(id) {
        const state = this.sessions.get(id);
        if (state && state.status === 'paused') {
            this.updateState(id, { status: 'running' });
            return true;
        }
        return false;
    }
    /**
     * Get session state
     */
    getSession(id) {
        return this.sessions.get(id);
    }
    /**
     * List all sessions
     */
    listSessions(filter) {
        let sessions = Array.from(this.sessions.values());
        if (filter?.status) {
            sessions = sessions.filter(s => s.status === filter.status);
        }
        return sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    }
    /**
     * Get running sessions
     */
    getRunning() {
        return this.listSessions({ status: 'running' });
    }
    /**
     * Clear completed sessions
     */
    cleanup(maxAge = 24 * 60 * 60 * 1000) {
        const cutoff = Date.now() - maxAge;
        let count = 0;
        for (const [id, state] of this.sessions) {
            if ((state.status === 'completed' || state.status === 'failed' || state.status === 'stopped') &&
                state.completedAt &&
                state.completedAt.getTime() < cutoff) {
                this.sessions.delete(id);
                count++;
            }
        }
        return count;
    }
    /**
     * Get failed strategies (for inspection)
     */
    getFailedStrategies() {
        return [...this.failedStrategies];
    }
    /**
     * Clear failed strategies
     */
    clearFailedStrategies() {
        this.failedStrategies = [];
    }
}
// Singleton instance
export const aleEngine = new ALEEngine();
// Helper functions
export function optimize(config) {
    return aleEngine.optimize(config);
}
export function stopOptimization(id) {
    return aleEngine.stop(id);
}
export function getOptimizationSession(id) {
    return aleEngine.getSession(id);
}
export function listOptimizations() {
    return aleEngine.listSessions();
}
//# sourceMappingURL=ale-engine.js.map