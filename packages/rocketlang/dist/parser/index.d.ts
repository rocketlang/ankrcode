/**
 * RocketLang Parser
 *
 * Parses RocketLang scripts into executable commands.
 * Uses pattern matching for common patterns, with LLM fallback for complex cases.
 */
import type { ParseResult } from '../index.js';
/**
 * Parse RocketLang script
 */
export declare function parse(script: string): ParseResult;
/**
 * Parse RocketLang file
 */
export declare function parseFile(filePath: string): Promise<ParseResult>;
//# sourceMappingURL=index.d.ts.map