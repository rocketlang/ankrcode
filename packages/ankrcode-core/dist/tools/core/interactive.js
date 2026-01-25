/**
 * Interactive Tools
 * TodoWrite and AskUserQuestion - User interaction tools
 */
// Current todo list state
let currentTodos = [];
/**
 * TodoWrite Tool - Task tracking
 */
export const todoWriteTool = {
    name: 'TodoWrite',
    description: `Create and manage a task list for the current session.

Use when:
- Complex multi-step tasks (3+ steps)
- User provides multiple tasks
- Need to track progress

Task states: pending, in_progress, completed
Only ONE task should be in_progress at a time.`,
    parameters: {
        type: 'object',
        properties: {
            todos: {
                type: 'array',
                description: 'The updated todo list',
                items: {
                    type: 'object',
                    properties: {
                        content: {
                            type: 'string',
                            description: 'Imperative form: "Run tests"',
                        },
                        activeForm: {
                            type: 'string',
                            description: 'Present continuous: "Running tests"',
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'in_progress', 'completed'],
                        },
                    },
                    required: ['content', 'activeForm', 'status'],
                },
            },
        },
        required: ['todos'],
    },
    async handler(params) {
        const { todos } = params;
        // Validate: only one in_progress
        const inProgress = todos.filter((t) => t.status === 'in_progress');
        if (inProgress.length > 1) {
            return {
                success: false,
                error: 'Only one task can be in_progress at a time',
            };
        }
        currentTodos = todos;
        // Format output for display
        const display = formatTodos(todos);
        return {
            success: true,
            output: display,
            data: { todos },
        };
    },
};
/**
 * AskUserQuestion Tool - Interactive prompts
 */
export const askUserQuestionTool = {
    name: 'AskUserQuestion',
    description: `Ask the user questions during execution.

Use for:
- Gathering preferences
- Clarifying ambiguous instructions
- Getting decisions on implementation choices

Max 4 questions per call. Users can always select "Other" for custom input.`,
    parameters: {
        type: 'object',
        properties: {
            questions: {
                type: 'array',
                description: 'Questions to ask (1-4)',
                items: {
                    type: 'object',
                    properties: {
                        question: {
                            type: 'string',
                            description: 'The question to ask',
                        },
                        header: {
                            type: 'string',
                            description: 'Short label (max 12 chars)',
                        },
                        options: {
                            type: 'array',
                            description: '2-4 options',
                            items: {
                                type: 'object',
                                properties: {
                                    label: { type: 'string' },
                                    description: { type: 'string' },
                                },
                            },
                        },
                        multiSelect: {
                            type: 'boolean',
                            description: 'Allow multiple selections',
                        },
                    },
                    required: ['question', 'header', 'options'],
                },
            },
        },
        required: ['questions'],
    },
    async handler(params) {
        const { questions } = params;
        // Validate questions
        if (questions.length > 4) {
            return { success: false, error: 'Maximum 4 questions allowed' };
        }
        for (const q of questions) {
            if (q.options.length < 2 || q.options.length > 4) {
                return { success: false, error: 'Each question must have 2-4 options' };
            }
            if (q.header.length > 12) {
                return { success: false, error: 'Header must be max 12 characters' };
            }
        }
        // In CLI mode, we'd use inquirer here
        // For now, format the questions for display
        const formatted = questions
            .map((q) => {
            const opts = q.options
                .map((o, i) => `  ${i + 1}. ${o.label} - ${o.description}`)
                .join('\n');
            return `[${q.header}] ${q.question}\n${opts}`;
        })
            .join('\n\n');
        // This would normally wait for user input via inquirer
        // Returning placeholder showing what would be asked
        return {
            success: true,
            output: `Questions for user:\n\n${formatted}`,
            data: {
                questions,
                // In real implementation, this would contain user's answers
                // answers: await promptUser(questions)
            },
        };
    },
};
// Helper functions
function formatTodos(todos) {
    if (todos.length === 0) {
        return 'No tasks';
    }
    const icons = {
        pending: '\u2B1C', // White square
        in_progress: '\uD83D\uDD04', // Rotating arrows
        completed: '\u2705', // Check mark
    };
    const lines = todos.map((todo) => {
        const icon = icons[todo.status];
        const text = todo.status === 'in_progress' ? todo.activeForm : todo.content;
        return `${icon} ${text}`;
    });
    return 'Tasks:\n' + lines.join('\n');
}
export function getTodos() {
    return currentTodos;
}
export function setTodos(todos) {
    currentTodos = todos;
}
//# sourceMappingURL=interactive.js.map