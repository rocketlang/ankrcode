/**
 * Vision Analyzer
 * Analyzes page state to suggest browser actions
 * Note: Uses element analysis. Vision API integration can be added later.
 */

import type { PageState, VisionAnalysis, BrowserAction } from './types.js';
import { getAIRouterAdapter } from '../ai/router-adapter.js';

/**
 * Analyze page state and suggest next action
 */
export async function analyzeScreenshot(
  _screenshot: string, // Reserved for future vision API
  pageState: PageState,
  goal: string,
  previousSteps: string[] = []
): Promise<VisionAnalysis> {
  const adapter = getAIRouterAdapter();

  const systemPrompt = `You are a Computer Use agent analyzing a web page to help achieve a goal.
Your task is to suggest the next browser action based on the page elements.

AVAILABLE ACTIONS:
- goto: Navigate to a URL (requires url parameter)
- click: Click on an element (requires CSS selector from the list below)
- type: Type text into an input field (requires CSS selector and value)
- press: Press a key (e.g., Enter, Tab, Escape)
- scroll: Scroll the page (direction: up, down, left, right)
- wait: Wait for an element or time

CRITICAL RULES FOR SELECTORS:
1. You MUST use EXACTLY one of the selectors from the numbered element list below
2. Copy the selector EXACTLY as shown - do not modify, abbreviate, or invent selectors
3. The selector appears in square brackets like [selector] - use only what's inside
4. If no suitable element exists in the list, use scroll or goto instead
5. NEVER make up selectors like "[a.class]" or "#id with spaces" - these will fail

Respond with valid JSON only (no markdown, no code blocks).`;

  const elementsDescription = pageState.elements
    .slice(0, 25)
    .map((el, i) => {
      let desc = `${i + 1}. [${el.selector}] ${el.tagName}`;
      if (el.text) desc += ` "${el.text.slice(0, 40)}"`;
      if (el.placeholder) desc += ` (placeholder: "${el.placeholder}")`;
      if (el.ariaLabel) desc += ` [${el.ariaLabel}]`;
      if (el.href) desc += ` -> ${el.href.slice(0, 40)}`;
      if (el.type) desc += ` (type: ${el.type})`;
      return desc;
    })
    .join('\n');

  const previousStepsText = previousSteps.length > 0
    ? `\nPrevious steps taken:\n${previousSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    : '';

  const userPrompt = `Goal: "${goal}"

Current page:
- URL: ${pageState.url}
- Title: ${pageState.title}
${previousStepsText}

Interactive elements on page:
${elementsDescription || 'No interactive elements found'}

Based on the goal and available elements, what should be the next action?

Respond with ONLY valid JSON (no markdown):
{
  "description": "Brief description of current page state",
  "reasoning": "Your reasoning about what to do next",
  "goalProgress": "not_started" | "in_progress" | "completed" | "blocked",
  "suggestedNextAction": {
    "type": "goto" | "click" | "type" | "press" | "scroll" | "wait",
    "selector": "exact CSS selector from the list above (if needed)",
    "value": "text to type (if type action)",
    "url": "URL to navigate to (if goto action)",
    "key": "key name (if press action)",
    "direction": "up or down (if scroll action)"
  }
}`;

  try {
    const response = await adapter.complete(
      systemPrompt,
      [{ role: 'user', content: userPrompt }],
      [], // No tools needed for vision analysis
      { model: 'claude' }
    );

    // Parse JSON from response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return createFallbackAnalysis(goal, pageState);
    }

    const analysis = JSON.parse(jsonMatch[0]) as VisionAnalysis;
    return analysis;
  } catch (err) {
    console.error('Analysis failed:', (err as Error).message);
    return createFallbackAnalysis(goal, pageState);
  }
}

/**
 * Create a fallback analysis when LLM fails
 */
function createFallbackAnalysis(goal: string, pageState: PageState): VisionAnalysis {
  const goalLower = goal.toLowerCase();
  let suggestedAction: BrowserAction | undefined;

  // Heuristic: Check if we need to search
  if (goalLower.includes('search') || goalLower.includes('find')) {
    const searchInput = pageState.elements.find(
      el => el.type === 'search' || el.type === 'text' ||
        el.placeholder?.toLowerCase().includes('search') ||
        el.ariaLabel?.toLowerCase().includes('search')
    );
    if (searchInput) {
      suggestedAction = { type: 'click', selector: searchInput.selector };
    }
  }

  // Heuristic: Check if we need to click a link
  if (goalLower.includes('go to') || goalLower.includes('navigate') || goalLower.includes('click')) {
    const goalWords = goalLower.split(/\s+/);
    for (const el of pageState.elements) {
      const elText = (el.text || el.ariaLabel || '').toLowerCase();
      if (goalWords.some(word => word.length > 3 && elText.includes(word))) {
        suggestedAction = { type: 'click', selector: el.selector };
        break;
      }
    }
  }

  // Heuristic: Check if goal mentions a URL
  const urlMatch = goal.match(/https?:\/\/[^\s]+/);
  if (urlMatch && !suggestedAction) {
    suggestedAction = { type: 'goto', url: urlMatch[0] };
  }

  // Default: scroll to explore
  if (!suggestedAction) {
    suggestedAction = { type: 'scroll', direction: 'down', amount: 300 };
  }

  return {
    description: `Page: ${pageState.title} at ${pageState.url}`,
    reasoning: 'Using heuristic-based suggestion',
    goalProgress: 'in_progress',
    suggestedNextAction: suggestedAction,
    interactiveElements: pageState.elements.slice(0, 5).map(el => ({
      selector: el.selector,
      description: el.text || el.ariaLabel || el.tagName,
    })),
  };
}

/**
 * Determine if goal is completed based on page state
 */
export async function isGoalCompleted(
  _screenshot: string,
  pageState: PageState,
  goal: string
): Promise<{ completed: boolean; reason: string }> {
  const adapter = getAIRouterAdapter();

  const prompt = `Goal: "${goal}"

Current page:
- URL: ${pageState.url}
- Title: ${pageState.title}
- Elements visible: ${pageState.elements.length}

Based on the page state, has the goal been completed?
Respond with JSON only: {"completed": true/false, "reason": "explanation"}`;

  try {
    const response = await adapter.complete(
      'You are evaluating if a browser automation goal has been completed.',
      [{ role: 'user', content: prompt }],
      [], // No tools needed
      { model: 'claude' }
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fall back to heuristics
  }

  // Enhanced heuristic checks
  const goalLower = goal.toLowerCase();
  const urlLower = pageState.url.toLowerCase();
  const titleLower = pageState.title.toLowerCase();

  // Extract significant words from goal (3+ chars, not common words)
  const stopWords = ['the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'are', 'was', 'were', 'been', 'being', 'page', 'link', 'button'];
  const goalWords = goalLower.split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.includes(w));

  // 1. Check for navigation goals
  const navPatterns = [
    /(?:go\s+to|navigate\s+to|open|visit|find)\s+(?:the\s+)?(.+?)(?:\s+page)?$/i,
  ];

  for (const pattern of navPatterns) {
    const match = goal.match(pattern);
    if (match) {
      const target = match[1].toLowerCase().trim();
      const targetVariants = [
        target,
        target.replace(/\s+/g, ''),
        target.replace(/\s+/g, '-'),
        target.replace(/\s+/g, '_'),
      ];

      for (const variant of targetVariants) {
        if (urlLower.includes(variant) || titleLower.includes(variant)) {
          return { completed: true, reason: `Navigated to ${target}` };
        }
      }
    }
  }

  // 2. Check for click goals - if URL changed, likely completed
  if (goalLower.includes('click')) {
    const clickMatch = goal.match(/click\s+(?:on\s+)?(?:the\s+)?(.+?)(?:\s+link|\s+button)?$/i);
    if (clickMatch) {
      const target = clickMatch[1].toLowerCase();
      // If URL or title contains any target words, probably succeeded
      if (target.split(/\s+/).some(word =>
        word.length > 3 && (urlLower.includes(word) || titleLower.includes(word))
      )) {
        return { completed: true, reason: `Clicked and navigated successfully` };
      }
    }
  }

  // 3. Check for search goals
  if (goalLower.includes('search')) {
    if (urlLower.includes('search') || urlLower.includes('q=') || urlLower.includes('query=')) {
      return { completed: true, reason: 'Search performed' };
    }
  }

  // 4. Generic: Check if multiple goal keywords appear in URL/title
  const matchingWords = goalWords.filter(word =>
    urlLower.includes(word) || titleLower.includes(word)
  );

  if (matchingWords.length >= 2) {
    return { completed: true, reason: `Page matches goal: ${matchingWords.join(', ')}` };
  }

  return { completed: false, reason: 'Goal completion could not be verified' };
}

/**
 * Extract text from page (without vision)
 */
export async function extractTextFromScreenshot(_screenshot: string): Promise<string> {
  return 'Text extraction requires vision API';
}
