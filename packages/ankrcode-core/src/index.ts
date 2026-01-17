/**
 * AnkrCode Core
 * AI Coding Assistant for Bharat
 */

// Types
export * from './types.js';

// Tools
export {
  registry,
  registerTool,
  getTool,
  getAllTools,
  getToolDefinitions,
  executor,
  executeTool,
  executeToolsParallel,
} from './tools/index.js';

// Conversation
export { ConversationManager } from './conversation/manager.js';

// Config
export {
  loadConfig,
  getConfig,
  getSettings,
  getProjectRules,
  saveGlobalSettings,
  saveProjectSettings,
  initProject,
  isCommandAllowed,
  isToolEnabled,
  getHooks,
  invalidateConfig,
  getConfigSummary,
} from './config/index.js';

export type {
  AnkrCodeSettings,
  Config,
  ProjectRules,
  MCPServerConfig,
} from './config/index.js';

// Permissions
export {
  isDangerousCommand,
  isProtectedPath,
  hasSessionApproval,
  grantSessionPermission,
  revokeSessionPermission,
  clearSessionPermissions,
  checkCommandPermission,
  checkFileWritePermission,
  checkFileDeletePermission,
  formatPermissionPrompt,
  getPermissionSummary,
} from './config/permissions.js';

export type {
  PermissionLevel,
  PermissionType,
  PermissionRequest,
  PermissionResponse,
} from './config/permissions.js';

// Swayam Integration
export {
  SwayamAdapter,
  createSwayamAdapter,
} from './swayam/index.js';

export type {
  SwayamConnectionState,
  SwayamContext,
  SwayamConfig,
  ConversationTurn,
  VoiceCommandResult,
} from './swayam/index.js';

// Adapters
export { AIRouterAdapter, getAIRouterAdapter } from './ai/router-adapter.js';
export { OfflineAdapter, getOfflineAdapter } from './ai/offline-adapter.js';
export { EONAdapter, getEONAdapter, remember, recall } from './memory/eon-adapter.js';
export { MCPAdapter, getMCPAdapter, registerMCPToolsToRegistry } from './mcp/adapter.js';
export { VoiceAdapter, getVoiceAdapter, parseVoiceCommand } from './voice/adapter.js';

// Unified Adapter (ANKR-First Architecture)
export {
  createUnifiedAdapter,
  UnifiedLLMAdapter,
  UnifiedMemoryAdapter,
  UnifiedMCPAdapter,
  detectANKRPackages,
  checkAllServices,
} from './adapters/index.js';

export type {
  UnifiedAdapters,
  ServiceHealth,
  AdapterConfig,
  LLMRequest,
  LLMResponse,
  MemoryEntry,
} from './adapters/index.js';

// Startup & Diagnostics
export {
  runDiagnostics,
  formatDiagnostics,
  printDiagnostics,
  quickCheck,
  getDoctorCommand,
} from './startup/index.js';

// MCP Discovery
export {
  MCPDiscovery,
  getDiscovery,
  discoverMCPTools,
  formatToolList,
  CORE_TOOLS,
} from './mcp/discovery.js';

export type {
  MCPTool,
  ToolCategory,
  DiscoveryResult,
} from './mcp/discovery.js';

// Plugins
export {
  pluginManager,
  loadPlugin,
  loadPackagePlugin,
  getPlugins,
  getPlugin,
  initializePlugins,
  createPlugin,
  gitPlugin,
  dockerPlugin,
} from './plugins/index.js';

export type {
  Plugin,
  PluginMetadata,
  PluginConfigSchema,
  PluginHooks,
  PluginCommand,
  PluginLoaderOptions,
  LoadedPlugin,
  PluginEvent,
} from './plugins/index.js';

// Workflow Engine (v2.39)
export {
  runWorkflow,
  loadWorkflow,
  saveWorkflow,
  listWorkflows,
  deleteWorkflow,
  getWorkflowTemplates,
  createFromTemplate,
} from './workflow/index.js';

export type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowResult,
  StepResult,
  WorkflowContext,
  WorkflowHooks,
} from './workflow/index.js';

// Autonomous Agents (v2.39)
export {
  agentManager,
  spawnAgent,
  stopAgent,
  getAgent,
  listAgents,
  getAgentTypes,
} from './agents/index.js';

export type {
  AgentType,
  AgentStatus,
  AgentConfig,
  AgentState,
  AgentResult,
  AgentLogEntry,
  AgentTypeConfig,
} from './agents/index.js';

// Shell Completions (v2.40)
export {
  getBashCompletion,
  getZshCompletion,
  getFishCompletion,
  installCompletion,
  detectShell,
  getCompletionInstallPath,
} from './completions/index.js';

export type { ShellType } from './completions/index.js';

// Version
export const VERSION = '2.40.0';
