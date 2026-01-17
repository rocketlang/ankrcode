/**
 * Browser Automation Types
 * Computer Use capabilities for Manus-like agents
 */

export type BrowserActionType =
  | 'goto'
  | 'click'
  | 'type'
  | 'scroll'
  | 'screenshot'
  | 'wait'
  | 'hover'
  | 'select'
  | 'press'
  | 'evaluate';

export interface BrowserAction {
  type: BrowserActionType;
  selector?: string;
  value?: string;
  url?: string;
  key?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  amount?: number;
  timeout?: number;
  script?: string;
}

export interface ElementInfo {
  selector: string;
  tagName: string;
  text?: string;
  placeholder?: string;
  ariaLabel?: string;
  role?: string;
  href?: string;
  type?: string;
  isVisible: boolean;
  isEnabled: boolean;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PageState {
  url: string;
  title: string;
  screenshot?: string; // Base64 encoded
  elements: ElementInfo[];
  scrollPosition: { x: number; y: number };
  viewport: { width: number; height: number };
}

export interface BrowserConfig {
  headless?: boolean;
  viewport?: { width: number; height: number };
  timeout?: number;
  userAgent?: string;
  proxy?: string;
  slowMo?: number; // Slow down actions for debugging
}

export interface BrowseTask {
  goal: string;
  startUrl?: string;
  maxSteps?: number;
  timeout?: number;
  verbose?: boolean;
}

export interface BrowseStep {
  stepNumber: number;
  thought: string;
  action: BrowserAction;
  observation?: string;
  screenshot?: string;
  success: boolean;
  error?: string;
}

export interface BrowseResult {
  goal: string;
  success: boolean;
  steps: BrowseStep[];
  finalState?: PageState;
  output?: string;
  error?: string;
  duration: number;
}

export interface VisionAnalysis {
  description: string;
  interactiveElements: {
    selector: string;
    description: string;
    suggestedAction?: string;
  }[];
  suggestedNextAction?: BrowserAction;
  goalProgress: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  reasoning: string;
}

export type BrowserStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export interface BrowserSession {
  id: string;
  status: BrowserStatus;
  task?: BrowseTask;
  currentStep: number;
  steps: BrowseStep[];
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
