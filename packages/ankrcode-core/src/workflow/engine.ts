/**
 * Workflow Engine
 * Executes multi-step workflows with variable interpolation
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowResult,
  StepResult,
  WorkflowContext,
} from './types.js';

const execAsync = promisify(exec);

const WORKFLOWS_DIR = path.join(process.env.HOME || '/root', '.ankrcode', 'workflows');

/**
 * Ensure workflows directory exists
 */
function ensureWorkflowsDir(): void {
  if (!fs.existsSync(WORKFLOWS_DIR)) {
    fs.mkdirSync(WORKFLOWS_DIR, { recursive: true });
  }
}

/**
 * Get workflow file path
 */
function getWorkflowPath(name: string): string {
  return path.join(WORKFLOWS_DIR, `${name}.yaml`);
}

/**
 * Interpolate variables in a string
 */
function interpolate(template: string, context: WorkflowContext): string {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expr) => {
    const parts = expr.trim().split('.');
    let value: unknown = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return `{{ ${expr} }}`; // Keep original if not found
      }
    }

    return String(value ?? '');
  });
}

/**
 * Evaluate a condition expression
 */
function evaluateCondition(condition: string, context: WorkflowContext): boolean {
  const interpolated = interpolate(condition, context);

  // Simple boolean evaluation
  if (interpolated === 'true') return true;
  if (interpolated === 'false') return false;

  // Simple comparisons
  const eqMatch = interpolated.match(/^(.+?)\s*==\s*(.+)$/);
  if (eqMatch) {
    return eqMatch[1].trim() === eqMatch[2].trim();
  }

  const neqMatch = interpolated.match(/^(.+?)\s*!=\s*(.+)$/);
  if (neqMatch) {
    return neqMatch[1].trim() !== neqMatch[2].trim();
  }

  // Default to true if we can't parse
  return true;
}

/**
 * Execute a single workflow step
 */
async function executeStep(
  step: WorkflowStep,
  context: WorkflowContext,
  options: { dryRun?: boolean; verbose?: boolean } = {}
): Promise<StepResult> {
  const startTime = Date.now();
  const stepName = step.name;

  // Check condition
  if (step.condition) {
    const shouldRun = evaluateCondition(step.condition, context);
    if (!shouldRun) {
      return {
        name: stepName,
        success: true,
        exitCode: 0,
        output: 'Skipped (condition not met)',
        duration: 0,
        skipped: true,
      };
    }
  }

  // Interpolate command
  const command = interpolate(step.command, context);

  if (options.dryRun) {
    console.log(`  [DRY-RUN] ${stepName}: ${command}`);
    return {
      name: stepName,
      success: true,
      exitCode: 0,
      output: '[dry-run]',
      duration: 0,
    };
  }

  if (options.verbose) {
    console.log(`  ▶ ${stepName}: ${command}`);
  }

  try {
    // Merge environment variables
    const env = {
      ...process.env,
      ...context.env,
      ...(step.env || {}),
    };

    const { stdout, stderr } = await execAsync(command, {
      env,
      timeout: (step.timeout || 300) * 1000, // Default 5 minutes
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    const duration = Date.now() - startTime;
    const output = stdout + (stderr ? `\n${stderr}` : '');

    if (options.verbose) {
      console.log(`  ✓ ${stepName} (${duration}ms)`);
    }

    return {
      name: stepName,
      success: true,
      exitCode: 0,
      output,
      duration,
    };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const err = error as { code?: number; stdout?: string; stderr?: string; message?: string };

    if (options.verbose) {
      console.log(`  ✗ ${stepName} (${duration}ms): ${err.message || 'Unknown error'}`);
    }

    return {
      name: stepName,
      success: false,
      exitCode: err.code || 1,
      output: err.stdout || '',
      error: err.stderr || err.message || 'Unknown error',
      duration,
    };
  }
}

/**
 * Execute a workflow
 */
export async function runWorkflow(
  workflow: WorkflowDefinition,
  options: {
    dryRun?: boolean;
    verbose?: boolean;
    steps?: string[];
    fromStep?: string;
  } = {}
): Promise<WorkflowResult> {
  const startedAt = new Date();
  const results: StepResult[] = [];

  // Initialize context
  const context: WorkflowContext = {
    env: { ...process.env, ...(workflow.env || {}) } as Record<string, string>,
    steps: {},
    workflow: {
      name: workflow.name,
      status: 'running',
    },
    timestamp: new Date().toISOString(),
  };

  console.log(`\n🚀 Running workflow: ${workflow.name}`);
  if (workflow.description) {
    console.log(`   ${workflow.description}`);
  }
  console.log('');

  // Execute onStart hook
  if (workflow.hooks?.onStart && !options.dryRun) {
    try {
      await execAsync(workflow.hooks.onStart);
    } catch {
      // Ignore hook errors
    }
  }

  // Filter steps if specified
  let stepsToRun = workflow.steps;
  let startIndex = 0;

  if (options.fromStep) {
    startIndex = stepsToRun.findIndex(s => s.name === options.fromStep);
    if (startIndex === -1) {
      throw new Error(`Step "${options.fromStep}" not found in workflow`);
    }
    stepsToRun = stepsToRun.slice(startIndex);
  }

  if (options.steps && options.steps.length > 0) {
    stepsToRun = stepsToRun.filter(s => options.steps!.includes(s.name));
  }

  let hasFailure = false;

  // Execute steps
  for (const step of stepsToRun) {
    // Skip non-runAlways steps after failure
    if (hasFailure && !step.runAlways && !step.continueOnError) {
      results.push({
        name: step.name,
        success: false,
        exitCode: -1,
        output: 'Skipped due to previous failure',
        duration: 0,
        skipped: true,
      });
      continue;
    }

    const result = await executeStep(step, context, options);
    results.push(result);

    // Update context with step result
    context.steps[step.name] = result;

    if (!result.success && !step.continueOnError) {
      hasFailure = true;
      if (step.failFast) {
        console.log(`\n❌ Workflow stopped: ${step.name} failed (failFast=true)`);
        break;
      }
    }
  }

  const completedAt = new Date();
  const totalDuration = completedAt.getTime() - startedAt.getTime();

  // Determine final status
  const allSuccess = results.every(r => r.success || r.skipped);
  const anySuccess = results.some(r => r.success && !r.skipped);
  const status = allSuccess ? 'success' : anySuccess ? 'partial' : 'failure';

  // Execute hooks
  if (!options.dryRun) {
    const hookCommand = status === 'success' ? workflow.hooks?.onSuccess : workflow.hooks?.onFailure;
    if (hookCommand) {
      try {
        await execAsync(hookCommand);
      } catch {
        // Ignore hook errors
      }
    }
  }

  // Print summary
  console.log('\n' + '─'.repeat(50));
  console.log(`Workflow: ${workflow.name}`);
  console.log(`Status: ${status === 'success' ? '✓ Success' : status === 'partial' ? '⚠ Partial' : '✗ Failed'}`);
  console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`Steps: ${results.filter(r => r.success).length}/${results.length} passed`);
  console.log('─'.repeat(50));

  return {
    name: workflow.name,
    status,
    steps: results,
    totalDuration,
    startedAt,
    completedAt,
  };
}

/**
 * Load a workflow from file
 */
export function loadWorkflow(name: string): WorkflowDefinition {
  const filePath = getWorkflowPath(name);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Workflow "${name}" not found at ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return yaml.parse(content) as WorkflowDefinition;
}

/**
 * Save a workflow to file
 */
export function saveWorkflow(workflow: WorkflowDefinition): void {
  ensureWorkflowsDir();
  const filePath = getWorkflowPath(workflow.name);
  const content = yaml.stringify(workflow);
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * List all workflows
 */
export function listWorkflows(): string[] {
  ensureWorkflowsDir();

  if (!fs.existsSync(WORKFLOWS_DIR)) {
    return [];
  }

  return fs.readdirSync(WORKFLOWS_DIR)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map(f => f.replace(/\.ya?ml$/, ''));
}

/**
 * Delete a workflow
 */
export function deleteWorkflow(name: string): boolean {
  const filePath = getWorkflowPath(name);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }

  return false;
}

/**
 * Get built-in workflow templates
 */
export function getWorkflowTemplates(): Record<string, WorkflowDefinition> {
  return {
    ci: {
      name: 'ci',
      description: 'Continuous Integration - Lint, Test, Build',
      steps: [
        { name: 'lint', command: 'npm run lint', description: 'Run linting' },
        { name: 'test', command: 'npm test', description: 'Run tests', failFast: true },
        { name: 'build', command: 'npm run build', description: 'Build project' },
      ],
    },
    cd: {
      name: 'cd',
      description: 'Continuous Deployment - Build, Deploy, Notify',
      steps: [
        { name: 'build', command: 'npm run build', description: 'Build project' },
        { name: 'deploy', command: 'npm run deploy', description: 'Deploy to server' },
        { name: 'notify', command: 'echo "Deployment complete"', description: 'Send notification', runAlways: true },
      ],
    },
    release: {
      name: 'release',
      description: 'Release workflow - Version, Changelog, Tag, Publish',
      steps: [
        { name: 'version', command: 'npm version patch', description: 'Bump version' },
        { name: 'changelog', command: 'ankrcode changelog -o CHANGELOG.md --prepend', description: 'Generate changelog' },
        { name: 'commit', command: 'git add -A && git commit -m "chore: release"', description: 'Commit changes' },
        { name: 'tag', command: 'git tag -a v$(node -p "require(\'./package.json\').version") -m "Release"', description: 'Create tag' },
        { name: 'publish', command: 'npm publish', description: 'Publish to registry' },
      ],
    },
    review: {
      name: 'review',
      description: 'Code Review workflow - Lint, Test, Security, Review',
      steps: [
        { name: 'lint', command: 'ankrcode lint', description: 'Run linting' },
        { name: 'test', command: 'ankrcode test -c', description: 'Run tests with coverage' },
        { name: 'security', command: 'ankrcode security', description: 'Security scan', continueOnError: true },
        { name: 'review', command: 'ankrcode review', description: 'AI code review' },
      ],
    },
    hotfix: {
      name: 'hotfix',
      description: 'Hotfix workflow - Fast test and deploy',
      steps: [
        { name: 'test', command: 'npm test -- --bail', description: 'Quick test', timeout: 60 },
        { name: 'build', command: 'npm run build', description: 'Build' },
        { name: 'deploy', command: 'npm run deploy:prod', description: 'Deploy to production' },
      ],
    },
  };
}

/**
 * Create workflow from template
 */
export function createFromTemplate(name: string, templateName: string): WorkflowDefinition {
  const templates = getWorkflowTemplates();
  const template = templates[templateName];

  if (!template) {
    throw new Error(`Template "${templateName}" not found. Available: ${Object.keys(templates).join(', ')}`);
  }

  return {
    ...template,
    name,
  };
}
