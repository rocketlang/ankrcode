/**
 * Task Tool - Agent Spawning
 * Spawn sub-agents for complex, multi-step tasks
 */
import { randomUUID } from 'crypto';
// Agent registry for resuming
const agentRegistry = new Map();
// Agent presets matching Claude Code
const AGENT_PRESETS = {
    explore: {
        systemPrompt: `You are a fast code exploration agent.
- Search and summarize findings quickly
- Use Glob and Grep to find files
- Read files to understand code
- Return concise summaries`,
        tools: ['Read', 'Glob', 'Grep'],
        maxTurns: 10,
        model: 'haiku',
    },
    plan: {
        systemPrompt: `You are a software architect agent.
- Analyze requirements thoroughly
- Identify critical files and dependencies
- Create step-by-step implementation plans
- Consider architectural trade-offs
- For optimization tasks, consider using ALEOptimize tool for multi-trial iteration`,
        tools: ['Read', 'Glob', 'Grep', 'WebFetch'],
        maxTurns: 15,
        model: 'sonnet',
    },
    code: {
        systemPrompt: `You are a code generation agent.
- Write clean, tested, production-ready code
- Follow existing patterns in the codebase
- Include proper error handling
- Document complex logic
- For complex optimization problems, use ALEOptimize to iterate on solutions
- ALEOptimize runs multiple trials with Virtual Power scoring to find best solutions`,
        tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'ALEOptimize', 'ALEQuick'],
        maxTurns: 30,
        model: 'sonnet',
    },
    review: {
        systemPrompt: `You are a code review agent.
- Find bugs, security issues, and improvements
- Prioritize: Correctness > Security > Performance > Maintainability
- Provide specific, actionable feedback
- Focus on issues that matter, not style nitpicks`,
        tools: ['Read', 'Glob', 'Grep'],
        maxTurns: 15,
        model: 'sonnet',
    },
    security: {
        systemPrompt: `You are a security analysis agent.
- Find vulnerabilities using OWASP Top 10
- Check authentication, authorization, input validation
- Identify injection points and data exposure
- Provide practical remediation steps`,
        tools: ['Read', 'Glob', 'Grep', 'Bash'],
        maxTurns: 20,
        model: 'opus',
    },
    bash: {
        systemPrompt: `You are a command execution agent.
- Execute bash commands carefully
- Verify commands before running destructive operations
- Report results clearly`,
        tools: ['Bash'],
        maxTurns: 10,
        model: 'haiku',
    },
    general: {
        systemPrompt: `You are a general-purpose coding assistant.
- Handle any coding task
- Use all available tools as needed
- Be thorough and careful
- For optimization tasks that benefit from iteration, use ALEOptimize tool
- ALEOptimize uses multi-trial optimization with Virtual Power scoring
- Use ALEQuick for fast optimization with preset configurations`,
        tools: ['*'], // All tools
        maxTurns: 50,
        model: 'sonnet',
    },
};
/**
 * Task Tool - Spawn sub-agents
 */
export const taskTool = {
    name: 'Task',
    description: `Launch a sub-agent to handle complex, multi-step tasks autonomously.

Available agent types:
- explore: Fast codebase exploration (read-only)
- plan: Architecture and implementation planning
- code: Code generation and modification
- review: Code review and bug finding
- security: Security vulnerability analysis
- bash: Command execution specialist
- general: Full tool access for any task

Use 'resume' parameter with agent ID to continue previous agent's work.`,
    parameters: {
        type: 'object',
        properties: {
            subagent_type: {
                type: 'string',
                enum: ['explore', 'plan', 'code', 'review', 'security', 'bash', 'general'],
                description: 'Type of agent to spawn',
            },
            prompt: {
                type: 'string',
                description: 'The task for the agent to perform',
            },
            description: {
                type: 'string',
                description: 'Short 3-5 word description of the task',
            },
            model: {
                type: 'string',
                enum: ['haiku', 'sonnet', 'opus'],
                description: 'Model to use (default: from preset)',
            },
            max_turns: {
                type: 'number',
                description: 'Maximum turns before stopping',
            },
            run_in_background: {
                type: 'boolean',
                description: 'Run agent in background',
            },
            resume: {
                type: 'string',
                description: 'Agent ID to resume',
            },
        },
        required: ['subagent_type', 'prompt', 'description'],
    },
    async handler(params) {
        const { subagent_type, prompt, description, model, max_turns, run_in_background = false, resume, } = params;
        // Resume existing agent
        if (resume) {
            const agent = agentRegistry.get(resume);
            if (!agent) {
                return { success: false, error: `Agent not found: ${resume}` };
            }
            return continueAgent(agent, prompt);
        }
        // Get preset for agent type
        const preset = AGENT_PRESETS[subagent_type];
        if (!preset) {
            return { success: false, error: `Unknown agent type: ${subagent_type}` };
        }
        // Create agent instance
        const agent = {
            id: randomUUID(),
            type: subagent_type,
            config: {
                ...preset,
                model: model || preset.model,
                maxTurns: max_turns || preset.maxTurns,
            },
            history: [],
            status: 'idle',
        };
        agentRegistry.set(agent.id, agent);
        if (run_in_background) {
            return runAgentInBackground(agent, prompt);
        }
        return runAgent(agent, prompt);
    },
};
async function runAgent(agent, prompt) {
    agent.status = 'running';
    // Add user prompt to history
    agent.history.push({ role: 'user', content: prompt });
    try {
        // This is where we'd integrate with @ankr/ai-router
        // For now, return a placeholder showing the structure
        const response = await executeAgentTurn(agent, prompt);
        agent.status = 'completed';
        agent.history.push({ role: 'assistant', content: response });
        return {
            success: true,
            output: response,
            metadata: { agentId: agent.id },
        };
    }
    catch (error) {
        agent.status = 'completed';
        return {
            success: false,
            error: `Agent error: ${error.message}`,
            metadata: { agentId: agent.id },
        };
    }
}
async function runAgentInBackground(agent, prompt) {
    const outputFile = `/tmp/agent-${agent.id}.log`;
    agent.outputFile = outputFile;
    agent.status = 'running';
    // Run async without awaiting
    (async () => {
        try {
            const fs = await import('fs/promises');
            await fs.writeFile(outputFile, `Agent ${agent.id} started\n`);
            const response = await executeAgentTurn(agent, prompt);
            await fs.appendFile(outputFile, `\n${response}\n\nAgent completed.`);
            agent.status = 'completed';
        }
        catch (error) {
            const fs = await import('fs/promises');
            await fs.appendFile(outputFile, `\nError: ${error.message}`);
            agent.status = 'completed';
        }
    })();
    return {
        success: true,
        output: `Agent ${agent.id} running in background.\nOutput file: ${outputFile}`,
        metadata: { agentId: agent.id, outputFile },
    };
}
async function continueAgent(agent, prompt) {
    agent.history.push({ role: 'user', content: prompt });
    return runAgent(agent, prompt);
}
async function executeAgentTurn(agent, prompt) {
    // TODO: Integrate with @ankr/ai-router
    // This is the core agent execution loop:
    // 1. Build system prompt with agent config
    // 2. Call LLM with tools available for this agent type
    // 3. Execute tool calls
    // 4. Repeat until no more tool calls or max turns reached
    // Placeholder for now
    return `[Agent ${agent.type}] Would process: "${prompt}"

System prompt: ${agent.config.systemPrompt}
Available tools: ${agent.config.tools.join(', ')}
Model: ${agent.config.model}

To complete implementation:
1. Import @ankr/ai-router
2. Call LLM with agent.config.systemPrompt
3. Handle tool calls in a loop
4. Return final response`;
}
export function getAgent(id) {
    return agentRegistry.get(id);
}
export function listAgents() {
    return Array.from(agentRegistry.values());
}
//# sourceMappingURL=task.js.map