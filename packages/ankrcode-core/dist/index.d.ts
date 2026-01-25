/**
 * AnkrCode Core
 * AI Coding Assistant for Bharat
 */
export * from './types.js';
export { registry, registerTool, getTool, getAllTools, getToolDefinitions, executor, executeTool, executeToolsParallel, } from './tools/index.js';
export { ConversationManager } from './conversation/manager.js';
export { loadConfig, getConfig, getSettings, getProjectRules, saveGlobalSettings, saveProjectSettings, initProject, isCommandAllowed, isToolEnabled, getHooks, invalidateConfig, getConfigSummary, } from './config/index.js';
export type { AnkrCodeSettings, Config, ProjectRules, MCPServerConfig, } from './config/index.js';
export { isDangerousCommand, isProtectedPath, hasSessionApproval, grantSessionPermission, revokeSessionPermission, clearSessionPermissions, checkCommandPermission, checkFileWritePermission, checkFileDeletePermission, formatPermissionPrompt, getPermissionSummary, } from './config/permissions.js';
export type { PermissionLevel, PermissionType, PermissionRequest, PermissionResponse, } from './config/permissions.js';
export { SwayamAdapter, createSwayamAdapter, } from './swayam/index.js';
export type { SwayamConnectionState, SwayamContext, SwayamConfig, ConversationTurn, VoiceCommandResult, } from './swayam/index.js';
export { AIRouterAdapter, getAIRouterAdapter } from './ai/router-adapter.js';
export { OfflineAdapter, getOfflineAdapter } from './ai/offline-adapter.js';
export { EONAdapter, getEONAdapter, remember, recall } from './memory/eon-adapter.js';
export { MCPAdapter, getMCPAdapter, registerMCPToolsToRegistry } from './mcp/adapter.js';
export { VoiceAdapter, getVoiceAdapter, parseVoiceCommand } from './voice/adapter.js';
export { createUnifiedAdapter, UnifiedLLMAdapter, UnifiedMemoryAdapter, UnifiedMCPAdapter, detectANKRPackages, checkAllServices, } from './adapters/index.js';
export type { UnifiedAdapters, ServiceHealth, AdapterConfig, LLMRequest, LLMResponse, MemoryEntry, } from './adapters/index.js';
export { runDiagnostics, formatDiagnostics, printDiagnostics, quickCheck, getDoctorCommand, } from './startup/index.js';
export { MCPDiscovery, getDiscovery, discoverMCPTools, formatToolList, CORE_TOOLS, } from './mcp/discovery.js';
export type { MCPTool, ToolCategory, DiscoveryResult, } from './mcp/discovery.js';
export { pluginManager, loadPlugin, loadPackagePlugin, getPlugins, getPlugin, initializePlugins, createPlugin, gitPlugin, dockerPlugin, } from './plugins/index.js';
export type { Plugin, PluginMetadata, PluginConfigSchema, PluginHooks, PluginCommand, PluginLoaderOptions, LoadedPlugin, PluginEvent, } from './plugins/index.js';
export { runWorkflow, loadWorkflow, saveWorkflow, listWorkflows, deleteWorkflow, getWorkflowTemplates, createFromTemplate, } from './workflow/index.js';
export type { WorkflowDefinition, WorkflowStep, WorkflowResult, StepResult, WorkflowContext, WorkflowHooks, } from './workflow/index.js';
export { agentManager, spawnAgent, stopAgent, getAgent, listAgents, getAgentTypes, } from './agents/index.js';
export type { AgentType, AgentStatus, AgentConfig, AgentState, AgentResult, AgentLogEntry, AgentTypeConfig, } from './agents/index.js';
export { getBashCompletion, getZshCompletion, getFishCompletion, installCompletion, detectShell, getCompletionInstallPath, } from './completions/index.js';
export type { ShellType } from './completions/index.js';
export { browse, getBrowserAgent, BrowserAgent, BrowserController, getBrowserController, closeBrowser, analyzeScreenshot, isGoalCompleted, } from './browser/index.js';
export type { BrowserAction, BrowserActionType, BrowserConfig, BrowseTask, BrowseStep, BrowseResult, BrowserSession, BrowserStatus, PageState, ElementInfo, VisionAnalysis, } from './browser/index.js';
export { ALEEngine, aleEngine, optimize, stopOptimization, getOptimizationSession, listOptimizations, quickOptimize, VirtualPowerScorer, virtualPowerScorer, calculateVirtualPower, InsightsGenerator, insightsGenerator, generateInsights, summarizeInsights, SolutionSpaceExplorer, solutionSpaceExplorer, exploreSolutionSpace, WorkingMemory, workingMemory, recallFailedStrategies, storeFailedStrategy, buildWorkingMemoryContext, ALE_VERSION, } from './ale/index.js';
export type { Solution, SolutionScore, Trial, Insight, ExplorationStrategy, ALEConfig, ALEProgress, ALEResult, FailedStrategy, ALEStatus, ALEState, ScorerFunction, SolutionGenerator, ScorerContext, GeneratorContext, VirtualPowerFactors, InsightConfig, DetectedPattern, ExplorationState, BeamCandidate, ExplorerConfig, WorkingMemoryEntry, PatternMatch, WorkingMemoryConfig, } from './ale/index.js';
export declare const VERSION = "2.43.0";
//# sourceMappingURL=index.d.ts.map