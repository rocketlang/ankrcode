/**
 * i18n Module
 * Internationalization for AnkrCode - Indic languages first
 */
import type { SupportedLanguage } from '../types.js';
/**
 * Translate a message key
 */
export declare function t(lang: SupportedLanguage, key: string, params?: Record<string, string | number>): string;
/**
 * Detect user's preferred language
 */
export declare function detectLanguage(): SupportedLanguage;
/**
 * Get all supported languages
 */
export declare function getSupportedLanguages(): SupportedLanguage[];
/**
 * Get language display name
 */
export declare function getLanguageName(lang: SupportedLanguage): {
    native: string;
    english: string;
};
//# sourceMappingURL=index.d.ts.map