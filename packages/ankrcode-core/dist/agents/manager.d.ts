/**
 * Agent Manager
 * Manages autonomous AI agents
 */
import { EventEmitter } from 'events';
import type { AgentType, AgentConfig, AgentState, AgentLogEntry, AgentTypeConfig } from './types.js';
/**
 * Agent Manager - Singleton
 */
declare class AgentManager extends EventEmitter {
    private agents;
    private runningAgents;
    /**
     * Spawn a new agent
     */
    spawn(config: AgentConfig): Promise<AgentState>;
    /**
     * Run agent loop
     */
    private runAgent;
    /**
     * Single agent iteration (placeholder for LLM integration)
     */
    private agentIteration;
    /**
     * Update agent state
     */
    private updateState;
    /**
     * Log to agent
     */
    private log;
    /**
     * Stop an agent
     */
    stop(id: string): boolean;
    /**
     * Stop all agents
     */
    stopAll(): number;
    /**
     * Pause an agent
     */
    pause(id: string): boolean;
    /**
     * Resume a paused agent
     */
    resume(id: string): boolean;
    /**
     * Get agent state
     */
    get(id: string): AgentState | undefined;
    /**
     * List all agents
     */
    list(filter?: {
        status?: AgentState['status'];
        type?: AgentType;
    }): AgentState[];
    /**
     * Get running agents
     */
    getRunning(): AgentState[];
    /**
     * Get agent logs
     */
    getLogs(id: string, limit?: number): AgentLogEntry[];
    /**
     * Get agent type configurations
     */
    getAgentTypes(): Record<AgentType, AgentTypeConfig>;
    /**
     * Clean up completed/failed agents older than maxAge (ms)
     */
    cleanup(maxAge?: number): number;
}
export declare const agentManager: AgentManager;
export declare function spawnAgent(config: AgentConfig): Promise<AgentState>;
export declare function stopAgent(id: string): boolean;
export declare function getAgent(id: string): AgentState | undefined;
export declare function listAgents(): AgentState[];
export declare function getAgentTypes(): Record<AgentType, AgentTypeConfig>;
export {};
//# sourceMappingURL=manager.d.ts.map