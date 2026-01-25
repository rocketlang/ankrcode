/**
 * Skill Tool
 * Bridge to MCP tools and user-defined skills
 */
import { Tool, ToolResult } from '../../types.js';
interface SkillDefinition {
    name: string;
    description: string;
    handler: (args?: string) => Promise<ToolResult>;
}
/**
 * Skill Tool - Execute skills and slash commands
 */
export declare const skillTool: Tool;
export declare function registerSkill(skill: SkillDefinition): void;
export declare function getSkill(name: string): SkillDefinition | undefined;
export declare function listSkills(): SkillDefinition[];
export declare function removeSkill(name: string): boolean;
export {};
//# sourceMappingURL=skill.d.ts.map