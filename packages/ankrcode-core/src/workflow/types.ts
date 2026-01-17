/**
 * Workflow Types
 */

export interface WorkflowStep {
  name: string;
  description?: string;
  command: string;
  env?: Record<string, string>;
  condition?: string;
  continueOnError?: boolean;
  failFast?: boolean;
  timeout?: number; // seconds
  runAlways?: boolean;
}

export interface WorkflowHooks {
  onStart?: string;
  onSuccess?: string;
  onFailure?: string;
}

export interface WorkflowTrigger {
  branch?: string;
  tag?: string;
  cron?: string;
}

export interface WorkflowDefinition {
  name: string;
  description?: string;
  version?: string;
  author?: string;
  env?: Record<string, string>;
  triggers?: WorkflowTrigger[];
  steps: WorkflowStep[];
  hooks?: WorkflowHooks;
}

export interface StepResult {
  name: string;
  success: boolean;
  exitCode: number;
  output: string;
  error?: string;
  duration: number; // ms
  skipped?: boolean;
}

export interface WorkflowResult {
  name: string;
  status: 'success' | 'failure' | 'partial';
  steps: StepResult[];
  totalDuration: number;
  startedAt: Date;
  completedAt: Date;
}

export interface WorkflowContext {
  env: Record<string, string>;
  steps: Record<string, StepResult>;
  workflow: {
    name: string;
    status: string;
  };
  timestamp: string;
}
