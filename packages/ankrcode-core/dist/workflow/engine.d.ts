/**
 * Workflow Engine
 * Executes multi-step workflows with variable interpolation
 */
import type { WorkflowDefinition, WorkflowResult } from './types.js';
/**
 * Execute a workflow
 */
export declare function runWorkflow(workflow: WorkflowDefinition, options?: {
    dryRun?: boolean;
    verbose?: boolean;
    steps?: string[];
    fromStep?: string;
}): Promise<WorkflowResult>;
/**
 * Load a workflow from file
 */
export declare function loadWorkflow(name: string): WorkflowDefinition;
/**
 * Save a workflow to file
 */
export declare function saveWorkflow(workflow: WorkflowDefinition): void;
/**
 * List all workflows
 */
export declare function listWorkflows(): string[];
/**
 * Delete a workflow
 */
export declare function deleteWorkflow(name: string): boolean;
/**
 * Get built-in workflow templates
 */
export declare function getWorkflowTemplates(): Record<string, WorkflowDefinition>;
/**
 * Create workflow from template
 */
export declare function createFromTemplate(name: string, templateName: string): WorkflowDefinition;
//# sourceMappingURL=engine.d.ts.map