/**
 * Agent Types
 */

export type AgentType =
  | 'researcher'
  | 'coder'
  | 'reviewer'
  | 'tester'
  | 'debugger'
  | 'architect'
  | 'documenter';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'stopped';

export interface AgentConfig {
  type: AgentType;
  task: string;
  model?: string;
  timeout?: number; // seconds
  maxIterations?: number;
  verbose?: boolean;
  tools?: string[];
  systemPrompt?: string;
  onComplete?: string;
  onError?: string;
}

export interface AgentState {
  id: string;
  type: AgentType;
  task: string;
  status: AgentStatus;
  progress: number; // 0-100
  iterations: number;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  output?: string;
  error?: string;
  logs: AgentLogEntry[];
}

export interface AgentLogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown;
}

export interface AgentResult {
  id: string;
  type: AgentType;
  task: string;
  status: 'success' | 'failure' | 'stopped';
  output: string;
  artifacts?: string[]; // Files created/modified
  duration: number; // ms
  iterations: number;
}

export interface AgentTypeConfig {
  name: string;
  description: string;
  tools: string[];
  systemPrompt: string;
  maxIterations: number;
  timeout: number;
}
