/**
 * PEG-based RocketLang Parser
 * Wrapper around the generated PEG.js parser
 */
import type { ParseResult } from '../index.js';
/**
 * Parse RocketLang code using PEG grammar
 */
export declare function parsePEG(input: string): ParseResult;
/**
 * Check if PEG parser is available
 */
export declare function isPEGAvailable(): boolean;
/**
 * Get supported features
 */
export declare function getSupportedFeatures(): string[];
//# sourceMappingURL=peg-parser.d.ts.map