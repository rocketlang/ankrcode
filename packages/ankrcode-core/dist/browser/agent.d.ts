/**
 * Browser Agent
 * Autonomous agent that executes browser tasks using vision
 */
import { EventEmitter } from 'events';
import type { BrowseTask, BrowseResult, BrowserSession } from './types.js';
/**
 * Browser Agent - Autonomous browser automation
 */
export declare class BrowserAgent extends EventEmitter {
    private sessions;
    private controller;
    private currentSession;
    /**
     * Execute a browse task
     */
    browse(task: BrowseTask): Promise<BrowseResult>;
    /**
     * Check if the goal has been completed based on heuristics
     */
    private checkGoalCompletion;
    /**
     * Detect if a goal has multiple steps/actions
     */
    private isMultiStepGoal;
    /**
     * Determine if we should use search proactively on first step
     */
    private shouldUseSearchFirst;
    /**
     * Try to find a search box and use it as a fallback when no direct links are found
     */
    private trySearchBoxFallback;
    /**
     * Find a search input element on the page
     */
    private findSearchInput;
    /**
     * Extract a search query from the goal
     */
    private extractSearchQuery;
    /**
     * Validate and fix a selector if it's invalid or not in the element list
     */
    private validateAndFixSelector;
    /**
     * Check if a CSS selector has valid syntax
     */
    private isValidCSSSelector;
    /**
     * Find the best matching element from the page state based on selector hints
     */
    private findBestMatchingElement;
    /**
     * Extract meaningful hints from an invalid selector
     */
    private extractSelectorHints;
    /**
     * Try to fix common selector syntax issues
     */
    private fixSelectorSyntax;
    /**
     * Check if a selector matches the target text from the goal
     */
    private selectorMatchesTarget;
    /**
     * Describe an action in human-readable format
     */
    private describeAction;
    /**
     * Update session state
     */
    private updateSession;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): BrowserSession | undefined;
    /**
     * List all sessions
     */
    listSessions(): BrowserSession[];
    /**
     * Stop current session
     */
    stop(): Promise<void>;
}
export declare function getBrowserAgent(): BrowserAgent;
/**
 * Quick helper to browse with a goal
 */
export declare function browse(goal: string, options?: {
    startUrl?: string;
    verbose?: boolean;
    maxSteps?: number;
}): Promise<BrowseResult>;
//# sourceMappingURL=agent.d.ts.map