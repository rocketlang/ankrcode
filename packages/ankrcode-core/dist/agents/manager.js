/**
 * Agent Manager
 * Manages autonomous AI agents
 */
import { EventEmitter } from 'events';
// Agent type configurations
const AGENT_CONFIGS = {
    researcher: {
        name: 'Researcher',
        description: 'Search, explore, and gather information',
        tools: ['WebSearch', 'WebFetch', 'Read', 'Grep', 'Glob'],
        systemPrompt: `You are a research specialist. Your task is to thoroughly research and gather information.
- Search the web for relevant information
- Read and analyze documents
- Synthesize findings into clear summaries
- Cite sources when possible
Be thorough but focused on the specific research task.`,
        maxIterations: 20,
        timeout: 300,
    },
    coder: {
        name: 'Coder',
        description: 'Write code and implement features',
        tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
        systemPrompt: `You are an expert programmer. Your task is to write high-quality code.
- Understand the requirements before coding
- Follow best practices and coding standards
- Write clean, maintainable code
- Add appropriate error handling
- Test your code when possible
Focus on completing the implementation correctly.`,
        maxIterations: 50,
        timeout: 600,
    },
    reviewer: {
        name: 'Reviewer',
        description: 'Code review and find issues',
        tools: ['Read', 'Grep', 'Glob'],
        systemPrompt: `You are a senior code reviewer. Your task is to review code for quality and issues.
- Check for bugs and logic errors
- Identify security vulnerabilities
- Evaluate code organization and readability
- Suggest improvements
- Be constructive in feedback
Prioritize: Correctness > Security > Performance > Style.`,
        maxIterations: 30,
        timeout: 300,
    },
    tester: {
        name: 'Tester',
        description: 'Generate and run tests',
        tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob'],
        systemPrompt: `You are a testing specialist. Your task is to ensure code quality through testing.
- Analyze code to understand what needs testing
- Write comprehensive test cases
- Cover edge cases and error conditions
- Run tests and verify results
- Report test coverage and results
Focus on meaningful tests that catch real bugs.`,
        maxIterations: 40,
        timeout: 300,
    },
    debugger: {
        name: 'Debugger',
        description: 'Debug errors and fix issues',
        tools: ['Read', 'Edit', 'Bash', 'Grep', 'Glob'],
        systemPrompt: `You are a debugging expert. Your task is to find and fix bugs.
- Analyze error messages and stack traces
- Identify root causes, not just symptoms
- Trace execution flow to find issues
- Apply targeted fixes
- Verify the fix works
Be methodical and thorough in debugging.`,
        maxIterations: 40,
        timeout: 300,
    },
    architect: {
        name: 'Architect',
        description: 'Design systems and plan architecture',
        tools: ['Read', 'Glob', 'Grep', 'WebSearch'],
        systemPrompt: `You are a software architect. Your task is to design robust systems.
- Understand requirements and constraints
- Consider scalability and maintainability
- Design clean interfaces and abstractions
- Document architectural decisions
- Consider trade-offs explicitly
Think long-term while being pragmatic.`,
        maxIterations: 25,
        timeout: 300,
    },
    documenter: {
        name: 'Documenter',
        description: 'Write documentation',
        tools: ['Read', 'Write', 'Glob', 'Grep'],
        systemPrompt: `You are a documentation specialist. Your task is to write clear documentation.
- Read and understand the code
- Write for your audience (developers, users, etc.)
- Include examples and use cases
- Keep documentation accurate and up-to-date
- Use clear, concise language
Good documentation empowers users.`,
        maxIterations: 30,
        timeout: 300,
    },
};
/**
 * Generate unique agent ID
 */
function generateAgentId() {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}
/**
 * Agent Manager - Singleton
 */
class AgentManager extends EventEmitter {
    agents = new Map();
    runningAgents = new Set();
    /**
     * Spawn a new agent
     */
    async spawn(config) {
        const id = generateAgentId();
        const typeConfig = AGENT_CONFIGS[config.type];
        if (!typeConfig) {
            throw new Error(`Unknown agent type: ${config.type}`);
        }
        const state = {
            id,
            type: config.type,
            task: config.task,
            status: 'idle',
            progress: 0,
            iterations: 0,
            startedAt: new Date(),
            updatedAt: new Date(),
            logs: [],
        };
        this.agents.set(id, state);
        this.emit('agent:spawned', state);
        // Start the agent asynchronously
        this.runAgent(id, config, typeConfig).catch(error => {
            this.updateState(id, {
                status: 'failed',
                error: error.message,
            });
        });
        return state;
    }
    /**
     * Run agent loop
     */
    async runAgent(id, config, typeConfig) {
        this.runningAgents.add(id);
        this.updateState(id, { status: 'running' });
        this.log(id, 'info', `Starting ${typeConfig.name} agent: ${config.task}`);
        const maxIterations = config.maxIterations || typeConfig.maxIterations;
        const timeout = (config.timeout || typeConfig.timeout) * 1000;
        const startTime = Date.now();
        try {
            let iteration = 0;
            let output = '';
            while (iteration < maxIterations) {
                // Check timeout
                if (Date.now() - startTime > timeout) {
                    this.log(id, 'warn', 'Agent timed out');
                    break;
                }
                // Check if stopped
                const state = this.agents.get(id);
                if (!state || state.status === 'stopped' || state.status === 'paused') {
                    break;
                }
                iteration++;
                this.updateState(id, {
                    iterations: iteration,
                    progress: Math.min(95, Math.round((iteration / maxIterations) * 100)),
                });
                this.log(id, 'debug', `Iteration ${iteration}/${maxIterations}`);
                // Simulate agent work (in real implementation, this would call LLM)
                await this.agentIteration(id, config, typeConfig, iteration);
                // Check completion (simplified - real implementation would check LLM response)
                if (iteration >= 3) {
                    output = `Agent ${typeConfig.name} completed task: ${config.task}\n\nIterations: ${iteration}\nDuration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`;
                    break;
                }
            }
            // Mark completed
            this.updateState(id, {
                status: 'completed',
                progress: 100,
                output,
                completedAt: new Date(),
            });
            this.log(id, 'info', 'Agent completed successfully');
            this.emit('agent:completed', this.agents.get(id));
            // Execute onComplete hook
            if (config.onComplete) {
                try {
                    const { exec } = await import('child_process');
                    const { promisify } = await import('util');
                    await promisify(exec)(config.onComplete);
                }
                catch {
                    // Ignore hook errors
                }
            }
        }
        catch (error) {
            const err = error;
            this.updateState(id, {
                status: 'failed',
                error: err.message,
                completedAt: new Date(),
            });
            this.log(id, 'error', `Agent failed: ${err.message}`);
            this.emit('agent:failed', this.agents.get(id));
            // Execute onError hook
            if (config.onError) {
                try {
                    const { exec } = await import('child_process');
                    const { promisify } = await import('util');
                    await promisify(exec)(config.onError);
                }
                catch {
                    // Ignore hook errors
                }
            }
        }
        finally {
            this.runningAgents.delete(id);
        }
    }
    /**
     * Single agent iteration (placeholder for LLM integration)
     */
    async agentIteration(id, config, typeConfig, iteration) {
        // In a real implementation, this would:
        // 1. Build a prompt with the task and available tools
        // 2. Call the LLM
        // 3. Parse tool calls from response
        // 4. Execute tools
        // 5. Feed results back to LLM
        // 6. Check for completion
        this.log(id, 'debug', `Executing iteration ${iteration} with tools: ${typeConfig.tools.join(', ')}`);
        // Simulate work
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    /**
     * Update agent state
     */
    updateState(id, updates) {
        const state = this.agents.get(id);
        if (state) {
            Object.assign(state, updates, { updatedAt: new Date() });
            this.emit('agent:updated', state);
        }
    }
    /**
     * Log to agent
     */
    log(id, level, message, data) {
        const state = this.agents.get(id);
        if (state) {
            state.logs.push({
                timestamp: new Date(),
                level,
                message,
                data,
            });
        }
    }
    /**
     * Stop an agent
     */
    stop(id) {
        const state = this.agents.get(id);
        if (state && this.runningAgents.has(id)) {
            this.updateState(id, { status: 'stopped' });
            this.log(id, 'info', 'Agent stopped by user');
            this.emit('agent:stopped', state);
            return true;
        }
        return false;
    }
    /**
     * Stop all agents
     */
    stopAll() {
        let count = 0;
        for (const id of this.runningAgents) {
            if (this.stop(id))
                count++;
        }
        return count;
    }
    /**
     * Pause an agent
     */
    pause(id) {
        const state = this.agents.get(id);
        if (state && state.status === 'running') {
            this.updateState(id, { status: 'paused' });
            this.log(id, 'info', 'Agent paused');
            return true;
        }
        return false;
    }
    /**
     * Resume a paused agent
     */
    resume(id) {
        const state = this.agents.get(id);
        if (state && state.status === 'paused') {
            this.updateState(id, { status: 'running' });
            this.log(id, 'info', 'Agent resumed');
            return true;
        }
        return false;
    }
    /**
     * Get agent state
     */
    get(id) {
        return this.agents.get(id);
    }
    /**
     * List all agents
     */
    list(filter) {
        let agents = Array.from(this.agents.values());
        if (filter?.status) {
            agents = agents.filter(a => a.status === filter.status);
        }
        if (filter?.type) {
            agents = agents.filter(a => a.type === filter.type);
        }
        return agents.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    }
    /**
     * Get running agents
     */
    getRunning() {
        return this.list({ status: 'running' });
    }
    /**
     * Get agent logs
     */
    getLogs(id, limit = 50) {
        const state = this.agents.get(id);
        if (!state)
            return [];
        return state.logs.slice(-limit);
    }
    /**
     * Get agent type configurations
     */
    getAgentTypes() {
        return AGENT_CONFIGS;
    }
    /**
     * Clean up completed/failed agents older than maxAge (ms)
     */
    cleanup(maxAge = 24 * 60 * 60 * 1000) {
        const cutoff = Date.now() - maxAge;
        let count = 0;
        for (const [id, state] of this.agents) {
            if ((state.status === 'completed' || state.status === 'failed' || state.status === 'stopped') &&
                state.completedAt &&
                state.completedAt.getTime() < cutoff) {
                this.agents.delete(id);
                count++;
            }
        }
        return count;
    }
}
// Singleton instance
export const agentManager = new AgentManager();
// Export helper functions
export function spawnAgent(config) {
    return agentManager.spawn(config);
}
export function stopAgent(id) {
    return agentManager.stop(id);
}
export function getAgent(id) {
    return agentManager.get(id);
}
export function listAgents() {
    return agentManager.list();
}
export function getAgentTypes() {
    return agentManager.getAgentTypes();
}
//# sourceMappingURL=manager.js.map