/**
 * Browser Agent
 * Autonomous agent that executes browser tasks using vision
 */

import { EventEmitter } from 'events';
import { BrowserController, getBrowserController, closeBrowser } from './controller.js';
import { analyzeScreenshot, isGoalCompleted } from './vision.js';
import type {
  BrowseTask,
  BrowseStep,
  BrowseResult,
  BrowserSession,
  BrowserStatus,
  BrowserAction,
  PageState,
} from './types.js';

const MAX_STEPS = 20;
const STEP_TIMEOUT = 30000;

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `browse_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Browser Agent - Autonomous browser automation
 */
export class BrowserAgent extends EventEmitter {
  private sessions: Map<string, BrowserSession> = new Map();
  private controller: BrowserController | null = null;
  private currentSession: string | null = null;

  /**
   * Execute a browse task
   */
  async browse(task: BrowseTask): Promise<BrowseResult> {
    const startTime = Date.now();
    const sessionId = generateSessionId();

    // Create session
    const session: BrowserSession = {
      id: sessionId,
      status: 'running',
      task,
      currentStep: 0,
      steps: [],
      startedAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    this.currentSession = sessionId;
    this.emit('session:started', session);

    const steps: BrowseStep[] = [];
    let success = false;
    let error: string | undefined;
    let finalState: PageState | undefined;

    try {
      // Initialize browser
      this.controller = getBrowserController({ headless: true });
      await this.controller.init();
      this.emit('browser:initialized', sessionId);

      if (task.verbose) {
        console.log(`\n🌐 Browser Agent: ${task.goal}`);
        console.log('─'.repeat(50));
      }

      // Navigate to start URL if provided
      if (task.startUrl) {
        const gotoResult = await this.controller.execute({ type: 'goto', url: task.startUrl });
        if (!gotoResult.success) {
          throw new Error(`Failed to navigate to ${task.startUrl}: ${gotoResult.error}`);
        }
        if (task.verbose) {
          console.log(`📍 Navigated to: ${task.startUrl}`);
        }
        // Wait for page to load
        await this.controller.execute({ type: 'wait', timeout: 2000 });
      }

      const maxSteps = task.maxSteps || MAX_STEPS;
      const previousStepDescriptions: string[] = [];

      // ReAct loop: Reason → Act → Observe
      for (let stepNum = 1; stepNum <= maxSteps; stepNum++) {
        this.updateSession(sessionId, { currentStep: stepNum });

        // 1. Take screenshot and get page state
        const screenshot = await this.controller.screenshot();
        const pageState = await this.controller.getPageState();

        if (task.verbose) {
          console.log(`\n📸 Step ${stepNum}: Analyzing page...`);
          console.log(`   URL: ${pageState.url}`);
          console.log(`   Title: ${pageState.title}`);
        }

        // 2. Analyze with vision (Reason)
        const analysis = await analyzeScreenshot(
          screenshot,
          pageState,
          task.goal,
          previousStepDescriptions
        );

        if (task.verbose) {
          console.log(`   🧠 Analysis: ${analysis.description}`);
          console.log(`   💭 Reasoning: ${analysis.reasoning}`);
          console.log(`   📊 Progress: ${analysis.goalProgress}`);
        }

        // Check if goal is completed
        if (analysis.goalProgress === 'completed') {
          const step: BrowseStep = {
            stepNumber: stepNum,
            thought: 'Goal completed!',
            action: { type: 'screenshot' },
            observation: analysis.description,
            screenshot,
            success: true,
          };
          steps.push(step);
          success = true;

          if (task.verbose) {
            console.log(`\n✅ Goal completed in ${stepNum} steps!`);
          }
          break;
        }

        // Check if blocked
        if (analysis.goalProgress === 'blocked') {
          const step: BrowseStep = {
            stepNumber: stepNum,
            thought: 'Goal cannot be completed - blocked',
            action: { type: 'screenshot' },
            observation: analysis.reasoning,
            screenshot,
            success: false,
            error: 'Goal blocked',
          };
          steps.push(step);
          error = `Goal blocked: ${analysis.reasoning}`;

          if (task.verbose) {
            console.log(`\n❌ Goal blocked: ${analysis.reasoning}`);
          }
          break;
        }

        // 3. Execute suggested action (Act)
        if (!analysis.suggestedNextAction) {
          // No action suggested, try scrolling to find more content
          const scrollAction: BrowserAction = { type: 'scroll', direction: 'down', amount: 300 };

          const step: BrowseStep = {
            stepNumber: stepNum,
            thought: 'No clear action, scrolling to find more content',
            action: scrollAction,
            screenshot,
            success: true,
          };
          steps.push(step);
          previousStepDescriptions.push('Scrolled down to find more content');

          await this.controller.execute(scrollAction);
          continue;
        }

        const action = analysis.suggestedNextAction;

        if (task.verbose) {
          console.log(`   🎯 Action: ${action.type}${action.selector ? ` on "${action.selector}"` : ''}${action.value ? ` with "${action.value}"` : ''}${action.url ? ` to "${action.url}"` : ''}`);
        }

        // Execute the action
        const result = await this.controller.execute(action);

        const step: BrowseStep = {
          stepNumber: stepNum,
          thought: analysis.reasoning,
          action,
          screenshot,
          success: result.success,
          error: result.error,
        };

        if (result.success) {
          // Wait for page to update
          await this.controller.execute({ type: 'wait', timeout: 1500 });

          const actionDesc = this.describeAction(action);
          previousStepDescriptions.push(actionDesc);
          step.observation = `Successfully executed: ${actionDesc}`;

          if (task.verbose) {
            console.log(`   ✓ Success`);
          }
        } else {
          step.observation = `Failed: ${result.error}`;
          previousStepDescriptions.push(`Failed to ${action.type}: ${result.error}`);

          if (task.verbose) {
            console.log(`   ✗ Failed: ${result.error}`);
          }
        }

        steps.push(step);
        this.emit('step:completed', step);

        // Update session
        this.updateSession(sessionId, { steps: [...steps] });
      }

      // Get final state
      finalState = await this.controller.getPageState();

      // Final goal check if not already determined
      if (!success && !error) {
        const screenshot = await this.controller.screenshot();
        const goalCheck = await isGoalCompleted(screenshot, finalState, task.goal);
        success = goalCheck.completed;
        if (!success) {
          error = `Max steps (${maxSteps}) reached without completing goal`;
        }
      }

    } catch (err) {
      error = (err as Error).message;
      if (task.verbose) {
        console.log(`\n❌ Error: ${error}`);
      }
    } finally {
      // Close browser
      await closeBrowser();
      this.controller = null;
    }

    const duration = Date.now() - startTime;

    // Update session
    this.updateSession(sessionId, {
      status: success ? 'completed' : 'failed',
      completedAt: new Date(),
    });

    const result: BrowseResult = {
      goal: task.goal,
      success,
      steps,
      finalState,
      error,
      duration,
      output: success
        ? `Successfully completed: ${task.goal}`
        : `Failed to complete: ${task.goal}${error ? ` - ${error}` : ''}`,
    };

    this.emit('session:completed', result);

    if (task.verbose) {
      console.log('\n' + '─'.repeat(50));
      console.log(`${success ? '✅' : '❌'} Result: ${result.output}`);
      console.log(`⏱️  Duration: ${(duration / 1000).toFixed(1)}s`);
      console.log(`📊 Steps: ${steps.length}`);
    }

    return result;
  }

  /**
   * Describe an action in human-readable format
   */
  private describeAction(action: BrowserAction): string {
    switch (action.type) {
      case 'goto':
        return `Navigated to ${action.url}`;
      case 'click':
        return `Clicked on ${action.selector}`;
      case 'type':
        return `Typed "${action.value}" into ${action.selector}`;
      case 'press':
        return `Pressed ${action.key}`;
      case 'scroll':
        return `Scrolled ${action.direction}`;
      case 'hover':
        return `Hovered over ${action.selector}`;
      case 'select':
        return `Selected "${action.value}" in ${action.selector}`;
      case 'wait':
        return `Waited for ${action.selector || action.timeout + 'ms'}`;
      default:
        return `Executed ${action.type}`;
    }
  }

  /**
   * Update session state
   */
  private updateSession(sessionId: string, updates: Partial<BrowserSession>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates, { updatedAt: new Date() });
      this.emit('session:updated', session);
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): BrowserSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all sessions
   */
  listSessions(): BrowserSession[] {
    return Array.from(this.sessions.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  /**
   * Stop current session
   */
  async stop(): Promise<void> {
    if (this.currentSession) {
      this.updateSession(this.currentSession, { status: 'failed' });
    }
    await closeBrowser();
    this.controller = null;
    this.currentSession = null;
  }
}

// Singleton instance
let agentInstance: BrowserAgent | null = null;

export function getBrowserAgent(): BrowserAgent {
  if (!agentInstance) {
    agentInstance = new BrowserAgent();
  }
  return agentInstance;
}

/**
 * Quick helper to browse with a goal
 */
export async function browse(
  goal: string,
  options: { startUrl?: string; verbose?: boolean; maxSteps?: number } = {}
): Promise<BrowseResult> {
  const agent = getBrowserAgent();
  return agent.browse({
    goal,
    startUrl: options.startUrl,
    verbose: options.verbose ?? true,
    maxSteps: options.maxSteps,
  });
}
