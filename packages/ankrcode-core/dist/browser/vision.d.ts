/**
 * Vision Analyzer
 * Analyzes page state to suggest browser actions
 * Note: Uses element analysis. Vision API integration can be added later.
 */
import type { PageState, VisionAnalysis } from './types.js';
/**
 * Analyze page state and suggest next action
 */
export declare function analyzeScreenshot(_screenshot: string, // Reserved for future vision API
pageState: PageState, goal: string, previousSteps?: string[]): Promise<VisionAnalysis>;
/**
 * Determine if goal is completed based on page state
 */
export declare function isGoalCompleted(_screenshot: string, pageState: PageState, goal: string): Promise<{
    completed: boolean;
    reason: string;
}>;
/**
 * Extract text from page (without vision)
 */
export declare function extractTextFromScreenshot(_screenshot: string): Promise<string>;
//# sourceMappingURL=vision.d.ts.map