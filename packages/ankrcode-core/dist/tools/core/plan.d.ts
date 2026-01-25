/**
 * Plan Mode Tools
 * EnterPlanMode and ExitPlanMode - Planning state machine
 */
import { Tool } from '../../types.js';
/**
 * EnterPlanMode Tool - Start planning phase
 */
export declare const enterPlanModeTool: Tool;
/**
 * ExitPlanMode Tool - Complete planning and request approval
 */
export declare const exitPlanModeTool: Tool;
export declare function isInPlanMode(): boolean;
export declare function getPlanFile(): string | null;
export declare function getAllowedPrompts(): Array<{
    tool: string;
    prompt: string;
}>;
export declare function isCommandAllowed(command: string): boolean;
export declare function resetPlanState(): void;
//# sourceMappingURL=plan.d.ts.map