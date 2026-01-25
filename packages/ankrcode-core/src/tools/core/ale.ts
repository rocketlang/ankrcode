/**
 * ALE Tool - Agentic Learning Engine
 * Multi-trial optimization for complex tasks
 *
 * Inspired by Sakana AI's ALE-Agent (AtCoder AHC058 winner)
 */

import { Tool, ToolResult } from '../../types.js';
import {
  optimize,
  quickOptimize,
  stopOptimization,
  getOptimizationSession,
  listOptimizations,
  buildWorkingMemoryContext,
  summarizeInsights,
} from '../../ale/index.js';
import type { ALEConfig, ExplorationStrategy } from '../../ale/types.js';

/**
 * ALE Optimize Tool - Run multi-trial optimization
 */
export const aleOptimizeTool: Tool = {
  name: 'ALEOptimize',
  description: `Run multi-trial optimization on a task using the ALE (Agentic Learning Engine).

ALE uses inference-time scaling to generate, test, and iterate over many solutions.
Key features:
- Virtual Power scoring: Values future potential, not just immediate results
- Insights: Learns from each trial to avoid repeating failures
- Working Memory: Remembers failed strategies across sessions (via EON)
- Strategies: greedy, annealing, hybrid (recommended), beam, evolutionary

Use this tool when:
- A task has multiple valid solutions and you want the best one
- Optimization problems that benefit from iteration
- Complex code generation where trial-and-error helps
- Performance tuning with measurable objectives

Example tasks:
- "Optimize the caching strategy to maximize hit rate"
- "Refactor this function for better performance"
- "Find the best algorithm for this sorting problem"`,

  parameters: {
    type: 'object',
    properties: {
      task: {
        type: 'string',
        description: 'The optimization task to perform',
      },
      objective: {
        type: 'string',
        description: 'The goal/metric to optimize for',
      },
      constraints: {
        type: 'array',
        items: { type: 'string' },
        description: 'Constraints the solution must satisfy',
      },
      strategy: {
        type: 'string',
        enum: ['greedy', 'annealing', 'hybrid', 'beam', 'evolutionary'],
        description: 'Exploration strategy (default: hybrid)',
      },
      max_trials: {
        type: 'number',
        description: 'Maximum number of trials (default: 50)',
      },
      target_score: {
        type: 'number',
        description: 'Stop if this score is achieved (0-1, default: 0.95)',
      },
      timeout_seconds: {
        type: 'number',
        description: 'Maximum time in seconds (default: 300)',
      },
      virtual_power_weight: {
        type: 'number',
        description: 'Weight for future potential vs immediate value (0-1, default: 0.3)',
      },
    },
    required: ['task', 'objective'],
  },

  async handler(params): Promise<ToolResult> {
    const {
      task,
      objective,
      constraints = [],
      strategy = 'hybrid',
      max_trials = 50,
      target_score = 0.95,
      timeout_seconds = 300,
      virtual_power_weight = 0.3,
    } = params as {
      task: string;
      objective: string;
      constraints?: string[];
      strategy?: ExplorationStrategy;
      max_trials?: number;
      target_score?: number;
      timeout_seconds?: number;
      virtual_power_weight?: number;
    };

    try {
      // Load working memory context
      const workingMemoryContext = await buildWorkingMemoryContext(task);

      const config: Partial<ALEConfig> & { task: string; objective: string } = {
        task,
        objective,
        constraints,
        strategy,
        maxTrials: max_trials,
        targetScore: target_score,
        maxDuration: timeout_seconds * 1000,
        virtualPowerWeight: virtual_power_weight,
        useWorkingMemory: true,
        storeInsights: true,
      };

      const result = await optimize(config);

      // Format output
      const output = [
        `## ALE Optimization Complete`,
        ``,
        `**Task**: ${task}`,
        `**Objective**: ${objective}`,
        `**Strategy**: ${strategy}`,
        ``,
        `### Results`,
        `- **Success**: ${result.success ? 'Yes (target achieved)' : 'No (best effort)'}`,
        `- **Best Score**: ${result.bestScore.totalScore.toFixed(4)}`,
        `  - Immediate: ${result.bestScore.immediateScore.toFixed(4)}`,
        `  - Virtual Power: ${result.bestScore.virtualPowerScore.toFixed(4)}`,
        `- **Trials**: ${result.totalTrials}`,
        `- **Duration**: ${(result.totalDuration / 1000).toFixed(1)}s`,
        `- **Score Improvement**: +${result.scoreImprovement.toFixed(4)}`,
        `- **Stop Reason**: ${result.stoppedReason}`,
        ``,
        `### Best Solution`,
        '```',
        result.bestSolution.content,
        '```',
        ``,
        `### Insights Learned (${result.insights.length})`,
        ...result.insights.slice(0, 5).map(i => `- [${i.type}] ${i.content.slice(0, 100)}...`),
        result.insights.length > 5 ? `- ... and ${result.insights.length - 5} more` : '',
        ``,
        workingMemoryContext ? `### Working Memory\n${workingMemoryContext}` : '',
      ].filter(Boolean).join('\n');

      return {
        success: true,
        output,
        data: {
          bestScore: result.bestScore.totalScore,
          trials: result.totalTrials,
          duration: result.totalDuration,
          insights: result.insights.length,
          solution: result.bestSolution.content,
        },
        metadata: {
          strategy,
          stoppedReason: result.stoppedReason,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `ALE optimization failed: ${(error as Error).message}`,
      };
    }
  },
};

/**
 * ALE Quick Tool - Fast optimization with presets
 */
export const aleQuickTool: Tool = {
  name: 'ALEQuick',
  description: `Quick ALE optimization with preset configurations.

Presets:
- fast: 20 trials, greedy strategy, quick results
- balanced: 50 trials, hybrid strategy (recommended)
- thorough: 100 trials, hybrid with higher Virtual Power weight

Use for simpler optimization tasks where you want quick results.`,

  parameters: {
    type: 'object',
    properties: {
      task: {
        type: 'string',
        description: 'The optimization task',
      },
      objective: {
        type: 'string',
        description: 'What to optimize for',
      },
      preset: {
        type: 'string',
        enum: ['fast', 'balanced', 'thorough'],
        description: 'Optimization preset (default: balanced)',
      },
    },
    required: ['task', 'objective'],
  },

  async handler(params): Promise<ToolResult> {
    const { task, objective, preset = 'balanced' } = params as {
      task: string;
      objective: string;
      preset?: 'fast' | 'balanced' | 'thorough';
    };

    try {
      const result = await quickOptimize(task, objective, { strategy: preset });

      return {
        success: true,
        output: [
          `## Quick Optimization (${preset})`,
          ``,
          `**Score**: ${result.score.toFixed(4)}`,
          ``,
          `### Solution`,
          result.solution,
          ``,
          `### Key Insights`,
          ...result.insights.slice(0, 3).map(i => `- ${i}`),
        ].join('\n'),
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: `Quick optimization failed: ${(error as Error).message}`,
      };
    }
  },
};

/**
 * ALE Status Tool - Check optimization status
 */
export const aleStatusTool: Tool = {
  name: 'ALEStatus',
  description: 'Check status of ALE optimization sessions, view history, or stop running optimizations.',

  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'status', 'stop', 'insights'],
        description: 'Action to perform',
      },
      session_id: {
        type: 'string',
        description: 'Session ID (for status/stop/insights)',
      },
    },
    required: ['action'],
  },

  async handler(params): Promise<ToolResult> {
    const { action, session_id } = params as {
      action: 'list' | 'status' | 'stop' | 'insights';
      session_id?: string;
    };

    try {
      switch (action) {
        case 'list': {
          const sessions = listOptimizations();
          if (sessions.length === 0) {
            return { success: true, output: 'No optimization sessions found.' };
          }

          const output = [
            '## ALE Sessions',
            '',
            '| ID | Status | Task | Best Score | Trials |',
            '|----|--------|------|------------|--------|',
            ...sessions.map(s =>
              `| ${s.id.slice(0, 8)}... | ${s.status} | ${s.config.task.slice(0, 30)}... | ${s.bestScore?.totalScore.toFixed(3) || 'N/A'} | ${s.trials.length} |`
            ),
          ].join('\n');

          return { success: true, output };
        }

        case 'status': {
          if (!session_id) {
            return { success: false, error: 'session_id required for status' };
          }

          const session = getOptimizationSession(session_id);
          if (!session) {
            return { success: false, error: `Session not found: ${session_id}` };
          }

          return {
            success: true,
            output: [
              `## Session: ${session.id}`,
              `- Status: ${session.status}`,
              `- Task: ${session.config.task}`,
              `- Progress: ${session.progress.currentTrial}/${session.progress.totalTrials}`,
              `- Best Score: ${session.bestScore?.totalScore.toFixed(4) || 'N/A'}`,
              `- Temperature: ${session.progress.temperature?.toFixed(3) || 'N/A'}`,
              `- Phase: ${session.progress.currentPhase}`,
            ].join('\n'),
            data: session,
          };
        }

        case 'stop': {
          if (!session_id) {
            return { success: false, error: 'session_id required for stop' };
          }

          const stopped = stopOptimization(session_id);
          return {
            success: stopped,
            output: stopped ? `Stopped session: ${session_id}` : `Could not stop session: ${session_id}`,
          };
        }

        case 'insights': {
          if (!session_id) {
            return { success: false, error: 'session_id required for insights' };
          }

          const session = getOptimizationSession(session_id);
          if (!session) {
            return { success: false, error: `Session not found: ${session_id}` };
          }

          const summary = summarizeInsights(session.insights);
          return { success: true, output: summary };
        }

        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return {
        success: false,
        error: `ALE status error: ${(error as Error).message}`,
      };
    }
  },
};
