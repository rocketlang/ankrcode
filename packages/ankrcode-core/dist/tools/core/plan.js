/**
 * Plan Mode Tools
 * EnterPlanMode and ExitPlanMode - Planning state machine
 */
import * as fs from 'fs/promises';
let planState = {
    inPlanMode: false,
    planFile: null,
    allowedPrompts: [],
};
/**
 * EnterPlanMode Tool - Start planning phase
 */
export const enterPlanModeTool = {
    name: 'EnterPlanMode',
    description: `Enter planning mode for complex implementation tasks.

Use when:
- New feature implementation
- Multiple valid approaches exist
- Architectural decisions needed
- Multi-file changes required
- Unclear requirements need exploration

In plan mode, explore the codebase and design approach before implementation.`,
    parameters: {
        type: 'object',
        properties: {},
    },
    async handler(_params) {
        if (planState.inPlanMode) {
            return {
                success: false,
                error: 'Already in plan mode. Use ExitPlanMode to finish planning.',
            };
        }
        // Create plan file in temp directory
        const timestamp = Date.now();
        const planFile = `/tmp/ankrcode-plan-${timestamp}.md`;
        planState = {
            inPlanMode: true,
            planFile,
            allowedPrompts: [],
        };
        // Create initial plan file
        const template = `# Implementation Plan

## Goal
[Describe the goal here]

## Analysis
[Your analysis of the codebase and requirements]

## Approach
[Your proposed implementation approach]

## Steps
1. [ ] Step 1
2. [ ] Step 2
3. [ ] Step 3

## Files to Modify
- \`path/to/file1.ts\` - Description
- \`path/to/file2.ts\` - Description

## Risks and Considerations
- Risk 1
- Risk 2

## Questions for User (if any)
- Question 1?
`;
        await fs.writeFile(planFile, template, 'utf-8');
        return {
            success: true,
            output: `Entered plan mode.

Write your implementation plan to: ${planFile}

In plan mode:
- Explore the codebase using Read, Glob, Grep
- Design your implementation approach
- Write the plan to the file above
- Use ExitPlanMode when ready for user approval

You are now in READ-ONLY mode for code changes. Use planning tools only.`,
            metadata: { planFile },
        };
    },
};
/**
 * ExitPlanMode Tool - Complete planning and request approval
 */
export const exitPlanModeTool = {
    name: 'ExitPlanMode',
    description: `Exit planning mode when plan is complete.

Before calling:
- Ensure plan is written to the plan file
- Plan should be complete and unambiguous
- If questions remain, use AskUserQuestion first

Can request bash command permissions needed for implementation.`,
    parameters: {
        type: 'object',
        properties: {
            allowedPrompts: {
                type: 'array',
                description: 'Bash permissions needed for implementation',
                items: {
                    type: 'object',
                    properties: {
                        tool: {
                            type: 'string',
                            enum: ['Bash'],
                        },
                        prompt: {
                            type: 'string',
                            description: 'Semantic description of action (e.g., "run tests")',
                        },
                    },
                    required: ['tool', 'prompt'],
                },
            },
        },
    },
    async handler(params) {
        const { allowedPrompts = [] } = params;
        if (!planState.inPlanMode) {
            return {
                success: false,
                error: 'Not in plan mode. Use EnterPlanMode first.',
            };
        }
        if (!planState.planFile) {
            return { success: false, error: 'Plan file not found' };
        }
        // Read the plan
        let planContent;
        try {
            planContent = await fs.readFile(planState.planFile, 'utf-8');
        }
        catch (error) {
            return {
                success: false,
                error: `Could not read plan file: ${error.message}`,
            };
        }
        // Validate plan is not just the template
        if (planContent.includes('[Describe the goal here]')) {
            return {
                success: false,
                error: 'Plan appears incomplete. Fill in all sections before exiting plan mode.',
            };
        }
        // Store allowed prompts
        planState.allowedPrompts = allowedPrompts;
        // Format permissions for display
        const permissionsDisplay = allowedPrompts.length > 0
            ? '\n\nRequested permissions:\n' +
                allowedPrompts.map((p) => `- ${p.tool}: "${p.prompt}"`).join('\n')
            : '';
        // Exit plan mode
        planState.inPlanMode = false;
        return {
            success: true,
            output: `Plan ready for review:

---
${planContent}
---
${permissionsDisplay}

Awaiting user approval to proceed with implementation.`,
            data: {
                planFile: planState.planFile,
                planContent,
                allowedPrompts,
            },
        };
    },
};
// Exported state accessors
export function isInPlanMode() {
    return planState.inPlanMode;
}
export function getPlanFile() {
    return planState.planFile;
}
export function getAllowedPrompts() {
    return planState.allowedPrompts;
}
export function isCommandAllowed(command) {
    // Check if command matches any allowed prompt
    return planState.allowedPrompts.some((allowed) => {
        const normalizedPrompt = allowed.prompt.toLowerCase();
        const normalizedCommand = command.toLowerCase();
        // Simple matching - could be made more sophisticated
        if (normalizedPrompt.includes('run tests')) {
            return /^(npm|yarn|pnpm|bun)\s+(test|run\s+test)/.test(normalizedCommand);
        }
        if (normalizedPrompt.includes('install dependencies')) {
            return /^(npm|yarn|pnpm|bun)\s+install/.test(normalizedCommand);
        }
        if (normalizedPrompt.includes('build')) {
            return /^(npm|yarn|pnpm|bun)\s+(run\s+)?build/.test(normalizedCommand);
        }
        return false;
    });
}
export function resetPlanState() {
    planState = {
        inPlanMode: false,
        planFile: null,
        allowedPrompts: [],
    };
}
//# sourceMappingURL=plan.js.map