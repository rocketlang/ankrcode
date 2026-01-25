/**
 * Browser Agent
 * Autonomous agent that executes browser tasks using vision
 */
import { EventEmitter } from 'events';
import { getBrowserController, closeBrowser } from './controller.js';
import { analyzeScreenshot, isGoalCompleted } from './vision.js';
const MAX_STEPS = 20;
const STEP_TIMEOUT = 30000;
/**
 * Generate unique session ID
 */
function generateSessionId() {
    return `browse_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}
/**
 * Browser Agent - Autonomous browser automation
 */
export class BrowserAgent extends EventEmitter {
    sessions = new Map();
    controller = null;
    currentSession = null;
    /**
     * Execute a browse task
     */
    async browse(task) {
        const startTime = Date.now();
        const sessionId = generateSessionId();
        // Create session
        const session = {
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
        const steps = [];
        let success = false;
        let error;
        let finalState;
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
            const previousStepDescriptions = [];
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
                const analysis = await analyzeScreenshot(screenshot, pageState, task.goal, previousStepDescriptions);
                if (task.verbose) {
                    console.log(`   🧠 Analysis: ${analysis.description}`);
                    console.log(`   💭 Reasoning: ${analysis.reasoning}`);
                    console.log(`   📊 Progress: ${analysis.goalProgress}`);
                }
                // Check if goal is completed
                if (analysis.goalProgress === 'completed') {
                    const step = {
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
                    const step = {
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
                // Early search check: On first step, if there's a search box and goal seems searchable,
                // proactively use search instead of clicking around
                const inputsOnPage = pageState.elements.filter(el => el.tagName === 'input');
                if (task.verbose && stepNum === 1) {
                    console.log(`   📋 Inputs on page: ${inputsOnPage.length}`);
                    if (inputsOnPage.length > 0) {
                        inputsOnPage.slice(0, 3).forEach(el => {
                            console.log(`      - ${el.selector} (type=${el.type}, placeholder="${el.placeholder || ''}")`);
                        });
                    }
                }
                if (stepNum === 1 && this.shouldUseSearchFirst(task.goal, pageState)) {
                    const searchAction = this.trySearchBoxFallback(task.goal, pageState, []);
                    if (searchAction) {
                        if (task.verbose) {
                            console.log(`   🔍 Using search directly for: "${searchAction.value}"`);
                        }
                        const result = await this.controller.execute(searchAction);
                        if (result.success) {
                            await this.controller.execute({ type: 'press', key: 'Enter' });
                            await this.controller.execute({ type: 'wait', timeout: 2000 });
                            const step = {
                                stepNumber: stepNum,
                                thought: 'Using search to find goal directly',
                                action: searchAction,
                                screenshot,
                                success: true,
                                observation: `Searched for: ${searchAction.value}`,
                            };
                            steps.push(step);
                            previousStepDescriptions.push(`Searched for "${searchAction.value}"`);
                            if (task.verbose) {
                                console.log(`   ⏎ Pressed Enter to submit search`);
                                console.log(`   ✓ Success`);
                            }
                            // Check if goal completed after search
                            const postSearchState = await this.controller.getPageState();
                            const goalCompleted = this.checkGoalCompletion(task.goal, searchAction, pageState, postSearchState);
                            if (goalCompleted.completed) {
                                success = true;
                                if (task.verbose) {
                                    console.log(`\n✅ Goal completed: ${goalCompleted.reason}`);
                                }
                                break;
                            }
                            continue;
                        }
                    }
                }
                // 3. Execute suggested action (Act)
                if (!analysis.suggestedNextAction) {
                    // No action suggested - try search box fallback before scrolling
                    const searchFallback = this.trySearchBoxFallback(task.goal, pageState, previousStepDescriptions);
                    if (searchFallback) {
                        const step = {
                            stepNumber: stepNum,
                            thought: 'No direct link found, using search box fallback',
                            action: searchFallback,
                            screenshot,
                            success: true,
                        };
                        steps.push(step);
                        previousStepDescriptions.push(`Typed "${searchFallback.value}" into search box`);
                        if (task.verbose) {
                            console.log(`   🔍 Search fallback: typing "${searchFallback.value}" into ${searchFallback.selector}`);
                        }
                        await this.controller.execute(searchFallback);
                        // Press Enter to submit search
                        await this.controller.execute({ type: 'press', key: 'Enter' });
                        await this.controller.execute({ type: 'wait', timeout: 2000 });
                        continue;
                    }
                    // No search box either, scroll to find more content
                    const scrollAction = { type: 'scroll', direction: 'down', amount: 300 };
                    const step = {
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
                let action = analysis.suggestedNextAction;
                // Check if action is a scroll - try search fallback first if we haven't searched yet
                let usedSearchFallback = false;
                if (action.type === 'scroll' && !previousStepDescriptions.some(s => s.includes('search box') || s.includes('Typed'))) {
                    const searchFallback = this.trySearchBoxFallback(task.goal, pageState, previousStepDescriptions);
                    if (searchFallback) {
                        if (task.verbose) {
                            console.log(`   🔍 Search fallback: using search instead of scroll`);
                            console.log(`   📝 Will type "${searchFallback.value}" into ${searchFallback.selector}`);
                        }
                        action = searchFallback;
                        usedSearchFallback = true;
                    }
                    else if (task.verbose) {
                        // Debug: show why search fallback didn't work
                        const inputCount = pageState.elements.filter(el => el.tagName === 'input').length;
                        console.log(`   ℹ️  No search fallback available (${inputCount} inputs found)`);
                    }
                }
                // Validate and fix selector if needed
                if (action.selector) {
                    const validatedAction = this.validateAndFixSelector(action, pageState);
                    if (validatedAction.fixed) {
                        if (task.verbose && validatedAction.originalSelector !== action.selector) {
                            console.log(`   ⚠️  Fixed invalid selector: "${validatedAction.originalSelector}" → "${action.selector}"`);
                        }
                    }
                    action = validatedAction.action;
                }
                if (task.verbose) {
                    console.log(`   🎯 Action: ${action.type}${action.selector ? ` on "${action.selector}"` : ''}${action.value ? ` with "${action.value}"` : ''}${action.url ? ` to "${action.url}"` : ''}`);
                }
                // Execute the action
                const result = await this.controller.execute(action);
                const step = {
                    stepNumber: stepNum,
                    thought: analysis.reasoning,
                    action,
                    screenshot,
                    success: result.success,
                    error: result.error,
                };
                if (result.success) {
                    // If we used search fallback, press Enter to submit
                    if (usedSearchFallback && action.type === 'type') {
                        await this.controller.execute({ type: 'press', key: 'Enter' });
                        await this.controller.execute({ type: 'wait', timeout: 2000 });
                        if (task.verbose) {
                            console.log(`   ⏎ Pressed Enter to submit search`);
                        }
                    }
                    else {
                        // Wait for page to update
                        await this.controller.execute({ type: 'wait', timeout: 1500 });
                    }
                    const actionDesc = this.describeAction(action);
                    previousStepDescriptions.push(actionDesc);
                    step.observation = `Successfully executed: ${actionDesc}`;
                    if (task.verbose) {
                        console.log(`   ✓ Success`);
                    }
                    // Proactive goal completion check after successful action
                    const postActionState = await this.controller.getPageState();
                    const goalCompleted = this.checkGoalCompletion(task.goal, action, pageState, postActionState);
                    if (goalCompleted.completed) {
                        steps.push(step);
                        success = true;
                        if (task.verbose) {
                            console.log(`\n✅ Goal completed: ${goalCompleted.reason}`);
                        }
                        break;
                    }
                }
                else {
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
        }
        catch (err) {
            error = err.message;
            if (task.verbose) {
                console.log(`\n❌ Error: ${error}`);
            }
        }
        finally {
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
        const result = {
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
     * Check if the goal has been completed based on heuristics
     */
    checkGoalCompletion(goal, action, beforeState, afterState) {
        const goalLower = goal.toLowerCase();
        const goalWords = goalLower.split(/\s+/).filter(w => w.length > 2);
        // Detect multi-step goals (goals with conjunctions or multiple actions)
        const isMultiStepGoal = this.isMultiStepGoal(goal);
        // For goto actions on multi-step goals, don't auto-complete just from navigation
        // The user wants to do MORE than just navigate
        if (action.type === 'goto' && isMultiStepGoal) {
            return { completed: false, reason: 'Multi-step goal requires additional actions after navigation' };
        }
        // 1. Click goals - check if we clicked on something matching the goal
        if (action.type === 'click') {
            const clickGoalPatterns = [
                /click\s+(on\s+)?(the\s+)?(.+?)(\s+link|\s+button|\s+element)?$/i,
                /press\s+(the\s+)?(.+?)(\s+button)?$/i,
                /tap\s+(on\s+)?(the\s+)?(.+)/i,
                /select\s+(the\s+)?(.+)/i,
            ];
            for (const pattern of clickGoalPatterns) {
                const match = goal.match(pattern);
                if (match) {
                    const targetText = (match[3] || match[2] || '').toLowerCase().trim();
                    // Check if we navigated to a new page after click
                    if (afterState.url !== beforeState.url) {
                        return {
                            completed: true,
                            reason: `Clicked and navigated to ${afterState.url}`,
                        };
                    }
                    // Check if selector or page content matches target
                    if (action.selector && this.selectorMatchesTarget(action.selector, targetText, beforeState)) {
                        return {
                            completed: true,
                            reason: `Clicked on element matching "${targetText}"`,
                        };
                    }
                }
            }
        }
        // 2. Navigation goals - check URL changes
        if (action.type === 'goto' || action.type === 'click') {
            const navGoalPatterns = [
                /(?:go\s+to|navigate\s+to|open|visit)\s+(?:the\s+)?(.+?)(?:\s+page)?$/i,
                /find\s+(?:the\s+)?(.+?)(?:\s+page)?$/i,
            ];
            for (const pattern of navGoalPatterns) {
                const match = goal.match(pattern);
                if (match) {
                    const targetPage = match[1].toLowerCase().trim();
                    const urlLower = afterState.url.toLowerCase();
                    const titleLower = afterState.title.toLowerCase();
                    // Check if URL or title contains the target
                    if (urlLower.includes(targetPage.replace(/\s+/g, '')) ||
                        urlLower.includes(targetPage.replace(/\s+/g, '-')) ||
                        urlLower.includes(targetPage.replace(/\s+/g, '_')) ||
                        titleLower.includes(targetPage)) {
                        return {
                            completed: true,
                            reason: `Navigated to ${targetPage} page`,
                        };
                    }
                }
            }
        }
        // 3. Search/Type goals - check if we typed and submitted
        if (action.type === 'type' || action.type === 'press') {
            const searchGoalPatterns = [
                /search\s+(?:for\s+)?['"]?(.+?)['"]?$/i,
                /type\s+['"]?(.+?)['"]?$/i,
                /enter\s+['"]?(.+?)['"]?$/i,
            ];
            for (const pattern of searchGoalPatterns) {
                const match = goal.match(pattern);
                if (match) {
                    // If we pressed Enter after typing, goal is likely complete
                    if (action.type === 'press' && action.key?.toLowerCase() === 'enter') {
                        return {
                            completed: true,
                            reason: `Submitted search/form`,
                        };
                    }
                    // If URL changed after typing (form submission), goal complete
                    if (afterState.url !== beforeState.url && afterState.url.includes('search')) {
                        return {
                            completed: true,
                            reason: `Search submitted - now on search results`,
                        };
                    }
                }
            }
        }
        // 4. Generic goal word matching - check if goal keywords appear in result
        // Only use for single-step goals or after a click action (not just navigation)
        const significantUrlChange = afterState.url !== beforeState.url;
        if (significantUrlChange && (action.type === 'click' || !isMultiStepGoal)) {
            const fullUrl = afterState.url.toLowerCase();
            const titleLower = afterState.title.toLowerCase();
            // Filter to only meaningful goal words (exclude common words and site names)
            const meaningfulGoalWords = goalWords.filter(word => !['com', 'org', 'net', 'the', 'and', 'for', 'then', 'find', 'click', 'navigate', 'open', 'visit', 'section', 'page', 'link', 'button'].includes(word));
            const matchingWords = meaningfulGoalWords.filter(word => fullUrl.includes(word) || titleLower.includes(word));
            // Require more matches for multi-step goals
            const requiredMatches = isMultiStepGoal ? 2 : (meaningfulGoalWords.length <= 3 ? 1 : 2);
            if (matchingWords.length >= requiredMatches) {
                return {
                    completed: true,
                    reason: `Page matches goal keywords: ${matchingWords.join(', ')}`,
                };
            }
        }
        // 5. Domain navigation check - only for single-step navigation goals
        // Don't complete just because we reached a site if there are more steps to do
        if (!isMultiStepGoal && afterState.url !== beforeState.url) {
            try {
                const beforeHost = new URL(beforeState.url).hostname;
                const afterHost = new URL(afterState.url).hostname;
                // If we navigated to a different domain, check if it's relevant
                if (beforeHost !== afterHost) {
                    const afterHostClean = afterHost.replace(/^www\./, '').toLowerCase();
                    // Check if the goal is SPECIFICALLY about going to this site
                    const navOnlyPatterns = [
                        /^(?:go\s+to|visit|open|navigate\s+to)\s+(?:www\.)?([a-z0-9-]+(?:\.[a-z]+)+)$/i,
                        /^(?:go\s+to|visit|open)\s+([a-z0-9-]+)$/i,
                    ];
                    for (const pattern of navOnlyPatterns) {
                        const match = goal.match(pattern);
                        if (match && afterHostClean.includes(match[1].toLowerCase().replace(/\.[a-z]+$/, ''))) {
                            return {
                                completed: true,
                                reason: `Navigated to ${afterHost}`,
                            };
                        }
                    }
                }
            }
            catch {
                // URL parsing failed, continue
            }
        }
        return { completed: false, reason: 'Goal not yet completed' };
    }
    /**
     * Detect if a goal has multiple steps/actions
     */
    isMultiStepGoal(goal) {
        const goalLower = goal.toLowerCase();
        // Check for conjunctions that indicate multiple steps
        const multiStepIndicators = [
            /\s+and\s+/, // "go to X and click Y"
            /\s+then\s+/, // "go to X then click Y"
            /,\s*then\s+/, // "go to X, then click Y"
            /,\s*and\s+/, // "go to X, and click Y"
            /\.\s+then\s+/i, // "Go to X. Then click Y"
        ];
        for (const pattern of multiStepIndicators) {
            if (pattern.test(goalLower)) {
                return true;
            }
        }
        // Check for multiple action verbs
        const actionVerbs = ['go', 'navigate', 'visit', 'open', 'click', 'find', 'search', 'type', 'enter', 'select', 'choose', 'scroll', 'read'];
        let verbCount = 0;
        for (const verb of actionVerbs) {
            // Match verb at word boundary
            const verbPattern = new RegExp(`\\b${verb}\\b`, 'gi');
            const matches = goalLower.match(verbPattern);
            if (matches) {
                verbCount += matches.length;
            }
        }
        // More than one action verb suggests multi-step
        return verbCount >= 2;
    }
    /**
     * Determine if we should use search proactively on first step
     */
    shouldUseSearchFirst(goal, pageState) {
        const goalLower = goal.toLowerCase();
        // Goals that suggest search is appropriate
        const searchIndicators = [
            'find information',
            'find the',
            'search for',
            'look for',
            'looking for',
            'information about',
            'learn about',
            'documentation for',
            'tutorial for',
            'how to',
        ];
        const hasSearchIndicator = searchIndicators.some(indicator => goalLower.includes(indicator));
        if (!hasSearchIndicator) {
            return false;
        }
        // Check if there's a search box
        const searchInput = this.findSearchInput(pageState);
        return searchInput !== null;
    }
    /**
     * Try to find a search box and use it as a fallback when no direct links are found
     */
    trySearchBoxFallback(goal, pageState, previousSteps) {
        // Don't use search fallback if we already searched
        if (previousSteps.some(s => s.toLowerCase().includes('search') || s.toLowerCase().includes('typed'))) {
            return null;
        }
        // Find search input elements
        const searchInput = this.findSearchInput(pageState);
        if (!searchInput) {
            return null;
        }
        // Extract search keywords from goal
        const searchQuery = this.extractSearchQuery(goal);
        if (!searchQuery) {
            return null;
        }
        return {
            type: 'type',
            selector: searchInput.selector,
            value: searchQuery,
        };
    }
    /**
     * Find a search input element on the page
     */
    findSearchInput(pageState) {
        // Filter to only input elements first
        const inputElements = pageState.elements.filter(el => el.tagName === 'input' || el.tagName === 'textarea');
        // Priority order for finding search inputs
        const searchPatterns = [
            // 1. Explicit search type
            (el) => el.type === 'search',
            // 2. ID contains 'search' or 'query'
            (el) => {
                const selectorLower = el.selector.toLowerCase();
                return selectorLower.includes('#') && (selectorLower.includes('search') ||
                    selectorLower.includes('query') ||
                    selectorLower.includes('[name="q"]') ||
                    selectorLower.includes('[name="s"]') ||
                    selectorLower.includes('#q') ||
                    selectorLower.includes('#s'));
            },
            // 3. Placeholder mentions search
            (el) => el.placeholder?.toLowerCase().includes('search') ||
                el.placeholder?.toLowerCase().includes('find'),
            // 4. Aria label mentions search
            (el) => el.ariaLabel?.toLowerCase().includes('search') ||
                el.ariaLabel?.toLowerCase().includes('find'),
            // 5. Class contains search
            (el) => {
                const selectorLower = el.selector.toLowerCase();
                return selectorLower.includes('.search') ||
                    selectorLower.includes('searchbox') ||
                    selectorLower.includes('searchinput');
            },
            // 6. Any visible text input (last resort, but only if it looks like a search)
            (el) => el.tagName === 'input' &&
                (el.type === 'text' || el.type === '' || !el.type) &&
                el.isVisible &&
                el.isEnabled &&
                el.placeholder && // Must have a placeholder
                el.placeholder.length < 50, // Short placeholder (likely a search)
        ];
        for (const pattern of searchPatterns) {
            const match = inputElements.find(pattern);
            if (match) {
                return match;
            }
        }
        return null;
    }
    /**
     * Extract a search query from the goal
     */
    extractSearchQuery(goal) {
        const goalLower = goal.toLowerCase();
        // Common goal patterns and their search extractions
        const patterns = [
            // "Find X" → search for "X"
            /find\s+(?:the\s+)?(?:information\s+(?:about|on|for)\s+)?(.+?)(?:\s+page)?$/i,
            // "Navigate to X" → search for "X"
            /navigate\s+to\s+(?:the\s+)?(.+?)(?:\s+page)?$/i,
            // "Go to X" → search for "X"
            /go\s+to\s+(?:the\s+)?(.+?)(?:\s+page)?$/i,
            // "Search for X" → search for "X"
            /search\s+(?:for\s+)?(.+)/i,
            // "Look for X" → search for "X"
            /look\s+(?:for\s+)?(.+)/i,
            // "Click on X" → search for "X"
            /click\s+(?:on\s+)?(?:the\s+)?(.+?)(?:\s+link|\s+button)?$/i,
        ];
        for (const pattern of patterns) {
            const match = goal.match(pattern);
            if (match && match[1]) {
                let query = match[1].trim();
                // Clean up common suffixes
                query = query.replace(/\s+(link|button|page|section|menu|tab)$/i, '');
                if (query.length >= 2) {
                    return query;
                }
            }
        }
        // Fallback: extract significant words from goal
        const stopWords = ['the', 'a', 'an', 'to', 'for', 'on', 'in', 'of', 'and', 'or', 'find', 'go', 'navigate', 'click', 'search', 'look', 'page', 'link', 'button'];
        const words = goalLower
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.includes(w));
        if (words.length > 0) {
            return words.slice(0, 3).join(' ');
        }
        return null;
    }
    /**
     * Validate and fix a selector if it's invalid or not in the element list
     */
    validateAndFixSelector(action, pageState) {
        const selector = action.selector;
        if (!selector) {
            return { action, fixed: false };
        }
        // Check if selector exists in our element list
        const exactMatch = pageState.elements.find(el => el.selector === selector);
        if (exactMatch) {
            return { action, fixed: false };
        }
        // Check if selector is syntactically valid
        const isValidSyntax = this.isValidCSSSelector(selector);
        // If valid syntax but not in our list, it might still work (dynamic elements)
        if (isValidSyntax) {
            // But let's try to find a better match from our known elements
            const betterMatch = this.findBestMatchingElement(selector, pageState);
            if (betterMatch) {
                return {
                    action: { ...action, selector: betterMatch.selector },
                    fixed: true,
                    originalSelector: selector,
                };
            }
            // Valid syntax, not in list, but might work - let it through
            return { action, fixed: false };
        }
        // Invalid syntax - try to find a matching element
        const fallbackMatch = this.findBestMatchingElement(selector, pageState);
        if (fallbackMatch) {
            return {
                action: { ...action, selector: fallbackMatch.selector },
                fixed: true,
                originalSelector: selector,
            };
        }
        // Try to fix common selector syntax issues
        const fixedSelector = this.fixSelectorSyntax(selector);
        if (fixedSelector !== selector && this.isValidCSSSelector(fixedSelector)) {
            return {
                action: { ...action, selector: fixedSelector },
                fixed: true,
                originalSelector: selector,
            };
        }
        // Can't fix - return original and let it fail with a clear error
        return { action, fixed: false };
    }
    /**
     * Check if a CSS selector has valid syntax
     */
    isValidCSSSelector(selector) {
        try {
            // Use a regex to catch common invalid patterns before DOM check
            // Invalid patterns: [a.class], spaces in IDs without escaping, etc.
            // Check for invalid attribute selector patterns like [a.class]
            if (/\[[a-z]+\.[a-z]/i.test(selector)) {
                return false;
            }
            // Check for React-style IDs with colons like #:R10uvnk3crb:
            // These need CSS escaping but are often generated incorrectly
            if (/#:[A-Za-z0-9]+:/.test(selector)) {
                return false;
            }
            // Check for IDs starting with a digit - CSS identifiers cannot start with digits
            // e.g., #0i1, #123abc are invalid
            if (/#\d/.test(selector)) {
                return false;
            }
            // Check for unescaped spaces in ID selectors
            if (/#[^#\s\[]+\s+[^>+~]/.test(selector) && !selector.includes(' > ') && !selector.includes(' + ') && !selector.includes(' ~ ')) {
                return false;
            }
            // Basic structure validation
            // Valid selectors: tag, .class, #id, tag.class, tag#id, [attr], :pseudo
            const validPatterns = /^[a-zA-Z#.\[:*][a-zA-Z0-9_\-#.:\[\]="'()\s>+~*^$|,]*$/;
            if (!validPatterns.test(selector)) {
                return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Find the best matching element from the page state based on selector hints
     */
    findBestMatchingElement(invalidSelector, pageState) {
        // Extract hints from the invalid selector
        const hints = this.extractSelectorHints(invalidSelector);
        if (hints.length === 0) {
            return null;
        }
        let bestMatch = null;
        for (const element of pageState.elements) {
            let score = 0;
            const elementText = (element.text || '').toLowerCase();
            const elementLabel = (element.ariaLabel || '').toLowerCase();
            const elementSelector = element.selector.toLowerCase();
            for (const hint of hints) {
                const hintLower = hint.toLowerCase();
                // Check if hint appears in element text
                if (elementText.includes(hintLower)) {
                    score += 3;
                }
                // Check if hint appears in aria-label
                if (elementLabel.includes(hintLower)) {
                    score += 3;
                }
                // Check if hint appears in selector
                if (elementSelector.includes(hintLower)) {
                    score += 2;
                }
                // Check tag name match
                if (element.tagName.toLowerCase() === hintLower) {
                    score += 1;
                }
            }
            if (score > 0 && (!bestMatch || score > bestMatch.score)) {
                bestMatch = { selector: element.selector, score };
            }
        }
        return bestMatch;
    }
    /**
     * Extract meaningful hints from an invalid selector
     */
    extractSelectorHints(selector) {
        const hints = [];
        // Extract words from the selector (class names, IDs, tag names)
        const words = selector.match(/[a-zA-Z][a-zA-Z0-9_-]{2,}/g) || [];
        for (const word of words) {
            const lower = word.toLowerCase();
            // Skip common CSS words
            if (!['nth', 'child', 'first', 'last', 'not', 'div', 'span', 'input', 'button', 'link'].includes(lower)) {
                hints.push(word);
            }
        }
        // Also try to extract from attribute selectors like [name="value"]
        const attrMatches = selector.match(/\[[\w-]+=['"](.*?)['"]\]/g) || [];
        for (const attr of attrMatches) {
            const valueMatch = attr.match(/['"](.*?)['"]/);
            if (valueMatch) {
                hints.push(valueMatch[1]);
            }
        }
        return hints;
    }
    /**
     * Try to fix common selector syntax issues
     */
    fixSelectorSyntax(selector) {
        let fixed = selector;
        // Fix: [a.class] → a.class
        fixed = fixed.replace(/\[([a-z]+\.[a-z][a-z0-9_-]*)\]/gi, '$1');
        // Fix: spaces in IDs like "#my id" → "#my\\ id" or find element
        // For now, just remove the problematic part
        fixed = fixed.replace(/#([^\s#.\[]+)\s+([^\s>+~]+)(?![>+~])/g, '#$1');
        // Fix: double brackets [[attr]] → [attr]
        fixed = fixed.replace(/\[\[/g, '[').replace(/\]\]/g, ']');
        // Fix: missing quotes in attribute values [attr=value] → [attr="value"]
        fixed = fixed.replace(/\[(\w+)=([^\]"']+)\]/g, '[$1="$2"]');
        return fixed;
    }
    /**
     * Check if a selector matches the target text from the goal
     */
    selectorMatchesTarget(selector, targetText, pageState) {
        const targetWords = targetText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        // Find the element that was clicked
        const element = pageState.elements.find(el => el.selector === selector);
        if (!element)
            return false;
        const elementText = (element.text || element.ariaLabel || '').toLowerCase();
        // Check if element text contains target words
        return targetWords.some(word => elementText.includes(word));
    }
    /**
     * Describe an action in human-readable format
     */
    describeAction(action) {
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
    updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (session) {
            Object.assign(session, updates, { updatedAt: new Date() });
            this.emit('session:updated', session);
        }
    }
    /**
     * Get session by ID
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * List all sessions
     */
    listSessions() {
        return Array.from(this.sessions.values())
            .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    }
    /**
     * Stop current session
     */
    async stop() {
        if (this.currentSession) {
            this.updateSession(this.currentSession, { status: 'failed' });
        }
        await closeBrowser();
        this.controller = null;
        this.currentSession = null;
    }
}
// Singleton instance
let agentInstance = null;
export function getBrowserAgent() {
    if (!agentInstance) {
        agentInstance = new BrowserAgent();
    }
    return agentInstance;
}
/**
 * Quick helper to browse with a goal
 */
export async function browse(goal, options = {}) {
    const agent = getBrowserAgent();
    return agent.browse({
        goal,
        startUrl: options.startUrl,
        verbose: options.verbose ?? true,
        maxSteps: options.maxSteps,
    });
}
//# sourceMappingURL=agent.js.map