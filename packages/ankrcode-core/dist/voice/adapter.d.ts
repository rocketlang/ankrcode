/**
 * Voice Input Adapter - Enhanced v2
 * Supports multiple STT backends for Indic languages:
 * - BHASHINI (Indian languages via Meity)
 * - Whisper (OpenAI, offline capable)
 * - Google Speech-to-Text
 * - Azure Speech Services
 *
 * Features:
 * - Real-time streaming support
 * - Automatic language detection
 * - Voice Activity Detection (VAD)
 * - Audio normalization
 * - Chunked transcription for long audio
 */
import type { SupportedLanguage } from '../types.js';
import { EventEmitter } from 'events';
export interface VoiceResult {
    text: string;
    language: SupportedLanguage;
    confidence: number;
    alternatives?: string[];
    isFinal?: boolean;
    detectedLanguage?: SupportedLanguage;
    duration?: number;
    segments?: VoiceSegment[];
}
export interface VoiceSegment {
    text: string;
    start: number;
    end: number;
    confidence: number;
}
export interface StreamingEvents {
    'partial': (result: VoiceResult) => void;
    'final': (result: VoiceResult) => void;
    'silence': () => void;
    'speech_start': () => void;
    'speech_end': () => void;
    'error': (error: Error) => void;
    'language_detected': (language: SupportedLanguage) => void;
}
export interface VoiceConfig {
    language: SupportedLanguage;
    backend?: 'bhashini' | 'whisper' | 'google' | 'azure' | 'auto';
    continuous?: boolean;
    interimResults?: boolean;
    autoDetectLanguage?: boolean;
    vadEnabled?: boolean;
    vadThreshold?: number;
    silenceTimeout?: number;
    maxChunkDuration?: number;
}
/**
 * Voice Adapter for Indic language STT - Enhanced v2
 */
export declare class VoiceAdapter extends EventEmitter {
    private config;
    private backend;
    private isListening;
    private vad;
    private audioBuffer;
    private silenceTimer;
    private streamStartTime;
    constructor(config: VoiceConfig);
    private detectBackend;
    private checkBhashini;
    private checkWhisper;
    /**
     * Check if voice input is available
     */
    isAvailable(): boolean;
    /**
     * Get current backend
     */
    getBackend(): string;
    /**
     * Transcribe audio buffer to text
     */
    transcribe(audioBuffer: Buffer | ArrayBuffer): Promise<VoiceResult>;
    /**
     * Transcribe using BHASHINI (Indian Government's AI4Bharat)
     */
    private transcribeWithBhashini;
    /**
     * Transcribe using Whisper (local or OpenAI)
     */
    private transcribeWithWhisper;
    /**
     * Transcribe using Google Speech-to-Text
     */
    private transcribeWithGoogle;
    /**
     * Transcribe using Azure Speech Services
     */
    private transcribeWithAzure;
    /**
     * Process audio chunk for streaming transcription
     * Use with continuous audio input from microphone
     */
    processAudioChunk(audioChunk: Buffer | ArrayBuffer): Promise<void>;
    /**
     * Flush accumulated audio and transcribe
     */
    private flushAudioBuffer;
    /**
     * Start silence timer
     */
    private startSilenceTimer;
    /**
     * Clear silence timer
     */
    private clearSilenceTimer;
    /**
     * Start listening for voice input (streaming mode)
     * Returns a readable stream of transcription results
     */
    startListening(): AsyncIterable<VoiceResult>;
    /**
     * Stop listening
     */
    stopListening(): void;
    /**
     * Transcribe with automatic language detection
     */
    transcribeWithDetection(audioBuffer: Buffer | ArrayBuffer): Promise<VoiceResult>;
    /**
     * Transcribe long audio by chunking
     */
    transcribeLong(audioBuffer: Buffer | ArrayBuffer, chunkDurationMs?: number): Promise<VoiceResult>;
    /**
     * Get supported languages for the current backend
     */
    getSupportedLanguages(): SupportedLanguage[];
}
export declare function getVoiceAdapter(config?: VoiceConfig): VoiceAdapter;
export declare const VOICE_COMMANDS: Record<SupportedLanguage, Record<string, string[]>>;
/**
 * Parse voice input to detect command intent
 */
export declare function parseVoiceCommand(text: string, language: SupportedLanguage): {
    command: string;
    args: string;
} | null;
/**
 * Detect language from text (exported utility)
 */
export declare function detectLanguage(text: string): {
    language: SupportedLanguage;
    confidence: number;
};
/**
 * Check if text contains Indic script
 */
export declare function containsIndicScript(text: string): boolean;
/**
 * Normalize text for consistent processing
 * - Removes extra whitespace
 * - Normalizes Unicode
 */
export declare function normalizeText(text: string): string;
//# sourceMappingURL=adapter.d.ts.map