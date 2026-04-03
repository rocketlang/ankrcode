/**
 * Type declarations for PEG.js generated grammar
 */

export interface SyntaxError extends Error {
// @rule:RLNG-001 — grammar.d
  location: {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
  expected: Array<{
    type: string;
    text?: string;
    ignoreCase?: boolean;
  }>;
  found: string | null;
}

export interface ParseOptions {
  startRule?: string;
  tracer?: {
    trace: (event: {
      type: string;
      rule: string;
      location: {
        start: { line: number; column: number; offset: number };
        end: { line: number; column: number; offset: number };
      };
    }) => void;
  };
}

export function parse(input: string, options?: ParseOptions): unknown;
