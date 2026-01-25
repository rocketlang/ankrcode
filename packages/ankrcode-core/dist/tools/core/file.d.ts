/**
 * File Operation Tools
 * Read, Write, Edit - Core tools for file manipulation
 */
import { Tool } from '../../types.js';
export declare function hasRecentlyRead(filePath: string): boolean;
export declare function markAsRead(filePath: string): void;
/**
 * Read Tool - Read file contents with line numbers
 */
export declare const readTool: Tool;
/**
 * Write Tool - Write content to a file
 */
export declare const writeTool: Tool;
/**
 * Edit Tool - Precise string replacement in files
 * This is the CRITICAL tool for code editing
 */
export declare const editTool: Tool;
//# sourceMappingURL=file.d.ts.map