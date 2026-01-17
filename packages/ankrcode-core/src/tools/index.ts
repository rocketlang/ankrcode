/**
 * Tools Module - Public API
 */

// Registry
export {
  registry,
  registerTool,
  getTool,
  getAllTools,
  getToolDefinitions,
} from './registry.js';

// Executor
export {
  executor,
  ToolExecutor,
  executeTool,
  executeToolsParallel,
} from './executor.js';

// Core tools (for direct access)
export { readTool, writeTool, editTool } from './core/file.js';
export { globTool, grepTool } from './core/search.js';
export { bashTool, taskOutputTool, killShellTool } from './core/bash.js';
export { taskTool } from './core/task.js';
export { todoWriteTool, askUserQuestionTool } from './core/interactive.js';
export { webFetchTool, webSearchTool } from './core/web.js';
export { enterPlanModeTool, exitPlanModeTool } from './core/plan.js';
export { skillTool } from './core/skill.js';
export { notebookEditTool, notebookReadTool } from './core/notebook.js';

// Utilities
export { hasRecentlyRead, markAsRead } from './core/file.js';
export { isInPlanMode, getPlanFile, getAllowedPrompts } from './core/plan.js';
export { getTodos, setTodos } from './core/interactive.js';
export { getAgent, listAgents } from './core/task.js';
export { registerSkill, getSkill, listSkills } from './core/skill.js';
export { getBackgroundTasks } from './core/bash.js';
