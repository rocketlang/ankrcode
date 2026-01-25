/**
 * Working Memory
 * EON integration for failed strategy avoidance and pattern learning
 *
 * Key concept from Sakana's ALE-Agent:
 * The agent maintains a "working memory" that stores insights from previous trials.
 * This prevents cycling back to previously failed strategies and enables
 * looking a few steps ahead rather than just reacting to immediate feedback.
 */
// EON service configuration
const EON_SERVICE_URL = process.env.EON_SERVICE_URL || 'http://localhost:4005';
const DEFAULT_CONFIG = {
    useEON: true,
    localFallback: true,
    maxEntries: 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    minHitCountForRetention: 1,
    minSimilarity: 0.5,
    maxMatches: 10,
    learnFromFailures: true,
    learnFromSuccesses: true,
    minConfidenceForLearning: 0.6,
};
/**
 * Working Memory class
 */
export class WorkingMemory {
    config;
    localMemory = new Map();
    eonAvailable = null;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.checkEONAvailability();
    }
    /**
     * Check if EON service is available
     */
    async checkEONAvailability() {
        if (!this.config.useEON) {
            this.eonAvailable = false;
            return;
        }
        try {
            const response = await fetch(`${EON_SERVICE_URL}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000),
            });
            this.eonAvailable = response.ok;
        }
        catch {
            this.eonAvailable = false;
        }
    }
    /**
     * Store a failed strategy
     */
    async storeFailedStrategy(strategy) {
        const entry = {
            id: strategy.id,
            type: 'failed_strategy',
            content: `Failed: ${strategy.description}. Reason: ${strategy.reason}`,
            metadata: {
                description: strategy.description,
                reason: strategy.reason,
                avoidanceHint: strategy.avoidanceHint,
            },
            taskPattern: strategy.taskPattern,
            confidence: 0.8,
            hitCount: strategy.hitCount,
            lastAccessed: new Date(),
            createdAt: strategy.createdAt,
        };
        await this.store(entry);
    }
    /**
     * Store a success pattern
     */
    async storeSuccessPattern(trial, taskPattern) {
        const entry = {
            id: this.generateId(),
            type: 'success_pattern',
            content: `Success: ${trial.solution.metadata.approach} achieved ${trial.score.totalScore.toFixed(3)}`,
            metadata: {
                approach: trial.solution.metadata.approach,
                score: trial.score.totalScore,
                components: trial.score.components,
                toolsUsed: trial.toolsUsed,
            },
            taskPattern,
            confidence: trial.score.confidence,
            hitCount: 1,
            lastAccessed: new Date(),
            createdAt: new Date(),
        };
        await this.store(entry);
    }
    /**
     * Store an insight
     */
    async storeInsight(insight, taskPattern) {
        if (insight.confidence < this.config.minConfidenceForLearning) {
            return; // Don't store low-confidence insights
        }
        const entry = {
            id: insight.id,
            type: 'insight',
            content: insight.content,
            metadata: {
                insightType: insight.type,
                applicableTo: insight.applicableTo,
                trialId: insight.trialId,
            },
            taskPattern,
            confidence: insight.confidence,
            hitCount: 1,
            lastAccessed: new Date(),
            createdAt: insight.createdAt,
        };
        await this.store(entry);
    }
    /**
     * Store a context entry (for general knowledge)
     */
    async storeContext(content, taskPattern, metadata = {}) {
        const entry = {
            id: this.generateId(),
            type: 'context',
            content,
            metadata,
            taskPattern,
            confidence: 0.7,
            hitCount: 1,
            lastAccessed: new Date(),
            createdAt: new Date(),
        };
        await this.store(entry);
    }
    /**
     * Store entry (local + EON)
     */
    async store(entry) {
        // Always store locally
        this.localMemory.set(entry.id, entry);
        // Try EON if available
        if (this.eonAvailable) {
            try {
                await this.storeToEON(entry);
            }
            catch (error) {
                console.warn('[WorkingMemory] Failed to store to EON:', error.message);
            }
        }
        // Cleanup if needed
        this.cleanup();
    }
    /**
     * Store to EON service
     */
    async storeToEON(entry) {
        const response = await fetch(`${EON_SERVICE_URL}/api/memory/store`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: entry.content,
                type: entry.type,
                metadata: {
                    ...entry.metadata,
                    taskPattern: entry.taskPattern,
                    confidence: entry.confidence,
                    hitCount: entry.hitCount,
                    aleWorkingMemory: true,
                },
                userId: 'ale_engine',
            }),
        });
        if (!response.ok) {
            throw new Error(`EON store failed: ${await response.text()}`);
        }
    }
    /**
     * Recall failed strategies for a task
     */
    async recallFailedStrategies(task) {
        const matches = await this.recall(task, 'failed_strategy');
        return matches.map(match => ({
            id: match.entry.id,
            description: match.entry.metadata.description || 'unknown',
            reason: match.entry.metadata.reason || 'unknown',
            taskPattern: match.entry.taskPattern,
            avoidanceHint: match.entry.metadata.avoidanceHint || '',
            createdAt: match.entry.createdAt,
            hitCount: match.entry.hitCount,
        }));
    }
    /**
     * Recall success patterns for a task
     */
    async recallSuccessPatterns(task) {
        return this.recall(task, 'success_pattern');
    }
    /**
     * Recall insights for a task
     */
    async recallInsights(task) {
        const matches = await this.recall(task, 'insight');
        return matches.map(match => ({
            id: match.entry.id,
            trialId: match.entry.metadata.trialId || '',
            type: match.entry.metadata.insightType || 'observation',
            content: match.entry.content,
            confidence: match.entry.confidence,
            applicableTo: match.entry.metadata.applicableTo || [],
            createdAt: match.entry.createdAt,
        }));
    }
    /**
     * Recall all relevant entries for a task
     */
    async recallAll(task) {
        const [failedStrategies, successPatterns, insights, context] = await Promise.all([
            this.recallFailedStrategies(task),
            this.recallSuccessPatterns(task),
            this.recallInsights(task),
            this.recall(task, 'context'),
        ]);
        return { failedStrategies, successPatterns, insights, context };
    }
    /**
     * Recall entries matching a task
     */
    async recall(task, type) {
        const matches = [];
        // Search local memory
        for (const entry of this.localMemory.values()) {
            if (type && entry.type !== type)
                continue;
            const similarity = this.calculateSimilarity(task, entry.taskPattern, entry.content);
            if (similarity >= this.config.minSimilarity) {
                // Update hit count
                entry.hitCount++;
                entry.lastAccessed = new Date();
                matches.push({
                    entry,
                    similarity,
                    relevance: this.explainRelevance(task, entry),
                });
            }
        }
        // Search EON if available
        if (this.eonAvailable) {
            try {
                const eonMatches = await this.searchEON(task, type);
                matches.push(...eonMatches);
            }
            catch (error) {
                console.warn('[WorkingMemory] EON search failed:', error.message);
            }
        }
        // Sort by similarity and limit
        matches.sort((a, b) => b.similarity - a.similarity);
        return matches.slice(0, this.config.maxMatches);
    }
    /**
     * Search EON service
     */
    async searchEON(task, type) {
        const params = new URLSearchParams({
            q: task,
            userId: 'ale_engine',
        });
        const response = await fetch(`${EON_SERVICE_URL}/api/memory/search?${params}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            throw new Error(`EON search failed: ${await response.text()}`);
        }
        const data = await response.json();
        return (data.results || [])
            .filter(r => !type || r.metadata?.type === type)
            .filter(r => r.metadata?.aleWorkingMemory === true)
            .map(r => ({
            entry: {
                id: r.id || this.generateId(),
                type: r.metadata?.type || 'context',
                content: r.content,
                metadata: r.metadata || {},
                taskPattern: r.metadata?.taskPattern || '',
                confidence: r.metadata?.confidence || 0.5,
                hitCount: r.metadata?.hitCount || 1,
                lastAccessed: new Date(),
                createdAt: new Date(),
            },
            similarity: r.score || r.similarity || 0.5,
            relevance: 'EON semantic match',
        }));
    }
    /**
     * Calculate similarity between task and entry
     */
    calculateSimilarity(task, pattern, content) {
        // Simple word overlap similarity (in production, use embeddings)
        const taskWords = new Set(task.toLowerCase().split(/\s+/));
        const patternWords = new Set(pattern.toLowerCase().split(/\s+/));
        const contentWords = new Set(content.toLowerCase().split(/\s+/));
        // Pattern similarity
        const patternOverlap = [...taskWords].filter(w => patternWords.has(w)).length;
        const patternSimilarity = patternOverlap / Math.max(taskWords.size, patternWords.size);
        // Content similarity
        const contentOverlap = [...taskWords].filter(w => contentWords.has(w)).length;
        const contentSimilarity = contentOverlap / Math.max(taskWords.size, contentWords.size);
        // Weighted average (pattern is more important)
        return patternSimilarity * 0.7 + contentSimilarity * 0.3;
    }
    /**
     * Explain why an entry is relevant
     */
    explainRelevance(task, entry) {
        const taskWords = task.toLowerCase().split(/\s+/);
        const patternWords = entry.taskPattern.toLowerCase().split(/\s+/);
        const commonWords = taskWords.filter(w => patternWords.includes(w));
        if (commonWords.length > 0) {
            return `Matches keywords: ${commonWords.join(', ')}`;
        }
        return 'Semantic similarity';
    }
    /**
     * Learn from a set of trials
     */
    async learnFromTrials(trials, insights, task) {
        const taskPattern = this.extractTaskPattern(task);
        let failedStrategiesStored = 0;
        let successPatternsStored = 0;
        let insightsStored = 0;
        // Store failed strategies
        if (this.config.learnFromFailures) {
            const failedTrials = trials.filter(t => t.score.totalScore < 0.3);
            for (const trial of failedTrials) {
                await this.storeFailedStrategy({
                    id: this.generateId(),
                    description: String(trial.solution.metadata.approach || 'unknown'),
                    reason: trial.score.reasoning,
                    taskPattern,
                    avoidanceHint: `Avoid ${trial.solution.metadata.approach} for ${taskPattern}`,
                    createdAt: new Date(),
                    hitCount: 1,
                });
                failedStrategiesStored++;
            }
        }
        // Store success patterns
        if (this.config.learnFromSuccesses) {
            const successTrials = trials.filter(t => t.score.totalScore >= 0.7);
            for (const trial of successTrials) {
                await this.storeSuccessPattern(trial, taskPattern);
                successPatternsStored++;
            }
        }
        // Store high-confidence insights
        for (const insight of insights) {
            if (insight.confidence >= this.config.minConfidenceForLearning) {
                await this.storeInsight(insight, taskPattern);
                insightsStored++;
            }
        }
        return { failedStrategiesStored, successPatternsStored, insightsStored };
    }
    /**
     * Extract task pattern from task description
     */
    extractTaskPattern(task) {
        // Extract first 5 meaningful words
        const words = task.toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 2)
            .slice(0, 5);
        return words.join(' ');
    }
    /**
     * Build context string for injection into prompts
     */
    async buildContextString(task) {
        const { failedStrategies, successPatterns, insights } = await this.recallAll(task);
        const lines = ['## Working Memory Context\n'];
        // Failed strategies
        if (failedStrategies.length > 0) {
            lines.push('### Avoid These Approaches:');
            for (const fs of failedStrategies.slice(0, 3)) {
                lines.push(`- ${fs.description}: ${fs.reason}`);
            }
            lines.push('');
        }
        // Success patterns
        if (successPatterns.length > 0) {
            lines.push('### Successful Approaches:');
            for (const sp of successPatterns.slice(0, 3)) {
                lines.push(`- ${sp.entry.metadata.approach}: Score ${sp.entry.metadata.score}`);
            }
            lines.push('');
        }
        // Relevant insights
        if (insights.length > 0) {
            lines.push('### Relevant Insights:');
            for (const insight of insights.slice(0, 5)) {
                lines.push(`- [${insight.type}] ${insight.content.slice(0, 100)}...`);
            }
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * Cleanup old/unused entries
     */
    cleanup() {
        if (this.localMemory.size <= this.config.maxEntries)
            return;
        const now = Date.now();
        const entries = Array.from(this.localMemory.entries());
        // Remove old entries with low hit count
        for (const [id, entry] of entries) {
            const age = now - entry.createdAt.getTime();
            if (age > this.config.maxAge && entry.hitCount < this.config.minHitCountForRetention) {
                this.localMemory.delete(id);
            }
        }
        // If still over limit, remove oldest
        if (this.localMemory.size > this.config.maxEntries) {
            const sorted = entries.sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime());
            const toRemove = sorted.slice(0, this.localMemory.size - this.config.maxEntries);
            for (const [id] of toRemove) {
                this.localMemory.delete(id);
            }
        }
    }
    /**
     * Get memory statistics
     */
    getStats() {
        const byType = {};
        let oldest = null;
        let newest = null;
        for (const entry of this.localMemory.values()) {
            byType[entry.type] = (byType[entry.type] || 0) + 1;
            if (!oldest || entry.createdAt < oldest) {
                oldest = entry.createdAt;
            }
            if (!newest || entry.createdAt > newest) {
                newest = entry.createdAt;
            }
        }
        return {
            totalEntries: this.localMemory.size,
            byType,
            eonAvailable: this.eonAvailable || false,
            oldestEntry: oldest,
            newestEntry: newest,
        };
    }
    /**
     * Clear all local memory
     */
    clear() {
        this.localMemory.clear();
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `wm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
}
// Singleton instance
export const workingMemory = new WorkingMemory();
// Convenience functions
export async function recallFailedStrategies(task) {
    return workingMemory.recallFailedStrategies(task);
}
export async function storeFailedStrategy(strategy) {
    return workingMemory.storeFailedStrategy(strategy);
}
export async function buildWorkingMemoryContext(task) {
    return workingMemory.buildContextString(task);
}
//# sourceMappingURL=working-memory.js.map