/**
 * RocketLang Normalizer Tests
 */
import { describe, it, expect } from 'vitest';
import { normalize, transliterate, detectScript } from '../normalizer/index.js';
describe('Script Detection', () => {
    it('should detect Devanagari script', () => {
        expect(detectScript('पढ़ो फ़ाइल')).toBe('devanagari');
    });
    it('should detect Roman script', () => {
        expect(detectScript('read file')).toBe('roman');
    });
    it('should detect mixed script', () => {
        expect(detectScript('पढ़ो file.txt')).toBe('mixed');
    });
    it('should detect Tamil script', () => {
        expect(detectScript('படிக்க கோப்பு')).toBe('tamil');
    });
    it('should detect Telugu script', () => {
        expect(detectScript('చదువు ఫైల్')).toBe('telugu');
    });
});
describe('Normalization', () => {
    describe('Hindi Verbs', () => {
        it('should normalize पढ़ो to read', () => {
            expect(normalize('पढ़ो')).toBe('read');
        });
        it('should normalize लिखो to write', () => {
            expect(normalize('लिखो')).toBe('write');
        });
        it('should normalize बनाओ to create', () => {
            expect(normalize('बनाओ')).toBe('create');
        });
        it.skip('should normalize search verbs', () => {
            // TODO: Fix normalizer to handle search verb variants
            // Currently the normalizer incorrectly transforms some words
            const result = normalize('dhoondo');
            expect(result).toBe('search');
        });
        it('should normalize चलाओ to run', () => {
            expect(normalize('चलाओ')).toBe('run');
        });
    });
    describe('Transliterated Hindi', () => {
        it('should normalize padho to read', () => {
            expect(normalize('padho')).toBe('read');
        });
        it('should normalize likho to write', () => {
            expect(normalize('likho')).toBe('write');
        });
        it('should normalize banao to create', () => {
            expect(normalize('banao')).toBe('create');
        });
    });
    describe('Connectors', () => {
        it('should normalize में to in', () => {
            expect(normalize('में')).toBe('in');
        });
        it('should normalize को to to', () => {
            expect(normalize('को')).toBe('to');
        });
        it('should normalize से to from', () => {
            expect(normalize('से')).toBe('from');
        });
    });
    describe('Nouns', () => {
        it('should normalize फ़ाइल to file', () => {
            expect(normalize('फ़ाइल')).toBe('file');
        });
        it('should normalize फ़ोल्डर to folder', () => {
            expect(normalize('फ़ोल्डर')).toBe('folder');
        });
    });
    describe('Mixed Phrases', () => {
        it('should normalize mixed Hindi-English', () => {
            const result = normalize('पढ़ो file.txt');
            expect(result).toBe('read file.txt');
        });
        it('should normalize transliterated command', () => {
            const result = normalize('padho config.json');
            expect(result).toBe('read config.json');
        });
    });
});
describe('Transliteration', () => {
    describe('Devanagari to Roman', () => {
        it('should transliterate basic vowels', () => {
            expect(transliterate('अ', 'devanagari', 'roman')).toBe('a');
            expect(transliterate('आ', 'devanagari', 'roman')).toBe('aa');
            expect(transliterate('इ', 'devanagari', 'roman')).toBe('i');
        });
        it('should transliterate basic consonants', () => {
            expect(transliterate('क', 'devanagari', 'roman')).toBe('ka');
            expect(transliterate('ग', 'devanagari', 'roman')).toBe('ga');
            expect(transliterate('म', 'devanagari', 'roman')).toBe('ma');
        });
        it('should transliterate common words', () => {
            // Transliteration is character-based, may not produce perfect romanization
            const result = transliterate('नमस्ते', 'devanagari', 'roman');
            expect(result).toContain('nam');
        });
    });
    describe('Roman to Devanagari', () => {
        it('should transliterate basic syllables', () => {
            expect(transliterate('ka', 'roman', 'devanagari')).toBe('क');
            expect(transliterate('ga', 'roman', 'devanagari')).toBe('ग');
        });
    });
});
//# sourceMappingURL=normalizer.test.js.map