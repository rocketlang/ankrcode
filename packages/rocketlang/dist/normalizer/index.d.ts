/**
 * Normalizer - Convert Indic text to canonical form
 *
 * Handles:
 * - Transliteration (roman ↔ Devanagari)
 * - Code-switching normalization
 * - Synonym resolution
 */
/**
 * Normalize input text to canonical English form
 */
export declare function normalize(input: string): string;
/**
 * Transliterate between scripts
 */
export declare function transliterate(text: string, from: 'devanagari' | 'roman', to: 'devanagari' | 'roman'): string;
/**
 * Detect script of input
 */
export declare function detectScript(text: string): 'devanagari' | 'tamil' | 'telugu' | 'roman' | 'mixed';
//# sourceMappingURL=index.d.ts.map