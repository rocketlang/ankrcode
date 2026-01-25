/**
 * Task Tool - Agent Spawning
 * Spawn sub-agents for complex, multi-step tasks
 */
import { Tool, AgentType } from '../../types.js';
interface AgentPreset {
    systemPrompt: string;
    tools: string[];
    maxTurns: number;
    model: string;
}
interface AgentInstance {
    id: string;
    type: AgentType;
    config: AgentPreset;
    history: Array<{
        role: string;
        content: string;
    }>;
    status: 'idle' | 'running' | 'completed';
    outputFile?: string;
}
/**
 * Task Tool - Spawn sub-agents
 */
export declare const taskTool: Tool;
export declare function getAgent(id: string): AgentInstance | undefined;
export declare function listAgents(): AgentInstance[];
export {};
//# sourceMappingURL=task.d.ts.map