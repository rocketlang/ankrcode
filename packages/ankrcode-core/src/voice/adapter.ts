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

// Voice recognition result
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

// Voice segment for detailed transcription
export interface VoiceSegment {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

// Streaming event types
export interface StreamingEvents {
  'partial': (result: VoiceResult) => void;
  'final': (result: VoiceResult) => void;
  'silence': () => void;
  'speech_start': () => void;
  'speech_end': () => void;
  'error': (error: Error) => void;
  'language_detected': (language: SupportedLanguage) => void;
}

// Voice adapter configuration
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

// Language to BCP-47 code mapping
const LANGUAGE_CODES: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  or: 'or-IN',
};

// BHASHINI API configuration
const BHASHINI_API_URL = process.env.BHASHINI_API_URL || 'https://meity-auth.ulcacontrib.org';
const BHASHINI_API_KEY = process.env.BHASHINI_API_KEY;

// Whisper API configuration (local or OpenAI)
const WHISPER_API_URL = process.env.WHISPER_API_URL || 'http://localhost:9000';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Audio processing utilities
const SAMPLE_RATE = 16000;
const FRAME_SIZE = 480; // 30ms at 16kHz
const VAD_SPEECH_THRESHOLD = 0.5;
const DEFAULT_SILENCE_TIMEOUT = 2000; // 2 seconds
const MAX_CHUNK_DURATION = 30000; // 30 seconds

/**
 * Simple Voice Activity Detection
 * Detects speech presence in audio frames
 */
class SimpleVAD {
  private threshold: number;
  private windowSize: number = 10;
  private energyHistory: number[] = [];
  private isSpeaking = false;
  private silenceFrames = 0;
  private silenceThreshold = 30; // frames of silence before speech end

  constructor(threshold: number = VAD_SPEECH_THRESHOLD) {
    this.threshold = threshold;
  }

  /**
   * Process audio frame and detect speech
   */
  process(samples: Float32Array | Int16Array): {
    isSpeech: boolean;
    energy: number;
    speechStart: boolean;
    speechEnd: boolean;
  } {
    // Calculate RMS energy
    let sum = 0;
    const isFloat = samples instanceof Float32Array;
    for (let i = 0; i < samples.length; i++) {
      const sample = isFloat
        ? (samples as Float32Array)[i]
        : (samples as Int16Array)[i] / 32768;
      sum += sample * sample;
    }
    const energy = Math.sqrt(sum / samples.length);

    // Update energy history
    this.energyHistory.push(energy);
    if (this.energyHistory.length > this.windowSize) {
      this.energyHistory.shift();
    }

    // Calculate dynamic threshold
    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    const dynamicThreshold = Math.max(this.threshold * avgEnergy, 0.01);

    const isSpeech = energy > dynamicThreshold;
    const wasSpeaking = this.isSpeaking;

    if (isSpeech) {
      this.silenceFrames = 0;
      this.isSpeaking = true;
    } else {
      this.silenceFrames++;
      if (this.silenceFrames > this.silenceThreshold) {
        this.isSpeaking = false;
      }
    }

    return {
      isSpeech,
      energy,
      speechStart: !wasSpeaking && this.isSpeaking,
      speechEnd: wasSpeaking && !this.isSpeaking,
    };
  }

  reset(): void {
    this.energyHistory = [];
    this.isSpeaking = false;
    this.silenceFrames = 0;
  }
}

/**
 * Automatic Language Detection for Indic Languages
 */
class LanguageDetector {
  // Unicode ranges for Indic scripts
  private static readonly SCRIPT_RANGES: Record<SupportedLanguage, RegExp> = {
    hi: /[\u0900-\u097F]/,  // Devanagari (Hindi, Marathi, Sanskrit)
    mr: /[\u0900-\u097F]/,  // Devanagari (shared with Hindi)
    ta: /[\u0B80-\u0BFF]/,  // Tamil
    te: /[\u0C00-\u0C7F]/,  // Telugu
    kn: /[\u0C80-\u0CFF]/,  // Kannada
    bn: /[\u0980-\u09FF]/,  // Bengali
    gu: /[\u0A80-\u0AFF]/,  // Gujarati
    ml: /[\u0D00-\u0D7F]/,  // Malayalam
    pa: /[\u0A00-\u0A7F]/,  // Gurmukhi (Punjabi)
    or: /[\u0B00-\u0B7F]/,  // Odia
    en: /^[a-zA-Z\s\d.,!?'"()-]+$/, // ASCII (English)
  };

  // Common words for distinguishing similar scripts
  private static readonly LANGUAGE_MARKERS: Record<string, SupportedLanguage> = {
    // Hindi markers
    'है': 'hi', 'हैं': 'hi', 'का': 'hi', 'की': 'hi', 'में': 'hi', 'को': 'hi',
    // Marathi markers
    'आहे': 'mr', 'होते': 'mr', 'केले': 'mr', 'झाले': 'mr',
    // Tamil markers
    'இருக்கிறது': 'ta', 'என்ன': 'ta', 'இது': 'ta',
    // Telugu markers
    'ఉంది': 'te', 'అది': 'te', 'ఇది': 'te',
    // Kannada markers
    'ಇದೆ': 'kn', 'ಅದು': 'kn', 'ಇದು': 'kn',
    // Bengali markers
    'আছে': 'bn', 'এটা': 'bn', 'হয়': 'bn',
    // Gujarati markers
    'છે': 'gu', 'હતું': 'gu', 'કરે': 'gu',
    // Malayalam markers
    'ആണ്': 'ml', 'ഉണ്ട്': 'ml', 'ഇത്': 'ml',
    // Punjabi markers
    'ਹੈ': 'pa', 'ਦਾ': 'pa', 'ਦੀ': 'pa',
    // Odia markers
    'ଅଛି': 'or', 'ଏହା': 'or', 'ହେଉଛି': 'or',
  };

  /**
   * Detect language from text
   */
  static detect(text: string): { language: SupportedLanguage; confidence: number } {
    if (!text || text.trim().length === 0) {
      return { language: 'en', confidence: 0 };
    }

    // Check for language markers first
    for (const [marker, lang] of Object.entries(this.LANGUAGE_MARKERS)) {
      if (text.includes(marker)) {
        return { language: lang, confidence: 0.9 };
      }
    }

    // Count script occurrences
    const scriptCounts: Partial<Record<SupportedLanguage, number>> = {};

    for (const [lang, regex] of Object.entries(this.SCRIPT_RANGES) as [SupportedLanguage, RegExp][]) {
      const matches = text.match(new RegExp(regex, 'g'));
      if (matches) {
        scriptCounts[lang] = (scriptCounts[lang] || 0) + matches.length;
      }
    }

    // Find dominant script
    let maxCount = 0;
    let detectedLang: SupportedLanguage = 'en';

    for (const [lang, count] of Object.entries(scriptCounts) as [SupportedLanguage, number][]) {
      if (count > maxCount) {
        maxCount = count;
        detectedLang = lang;
      }
    }

    // Calculate confidence based on dominance
    const totalChars = text.replace(/\s/g, '').length;
    const confidence = totalChars > 0 ? Math.min(maxCount / totalChars, 1) : 0;

    return { language: detectedLang, confidence };
  }
}

/**
 * Voice Adapter for Indic language STT - Enhanced v2
 */
export class VoiceAdapter extends EventEmitter {
  private config: VoiceConfig;
  private backend: 'bhashini' | 'whisper' | 'google' | 'azure' | 'local' = 'local';
  private isListening = false;
  private vad: SimpleVAD | null = null;
  private audioBuffer: Buffer[] = [];
  private silenceTimer: NodeJS.Timeout | null = null;
  private streamStartTime: number = 0;

  constructor(config: VoiceConfig) {
    super();
    this.config = {
      vadEnabled: true,
      vadThreshold: VAD_SPEECH_THRESHOLD,
      silenceTimeout: DEFAULT_SILENCE_TIMEOUT,
      maxChunkDuration: MAX_CHUNK_DURATION,
      autoDetectLanguage: false,
      ...config,
    };

    if (this.config.vadEnabled) {
      this.vad = new SimpleVAD(this.config.vadThreshold);
    }

    this.detectBackend();
  }

  private async detectBackend(): Promise<void> {
    if (this.config.backend && this.config.backend !== 'auto') {
      this.backend = this.config.backend;
      return;
    }

    // Auto-detect available backend
    // Priority: BHASHINI (for Indic) > Whisper (local) > Google > Azure

    if (this.config.language !== 'en' && BHASHINI_API_KEY) {
      if (await this.checkBhashini()) {
        this.backend = 'bhashini';
        console.log('[VoiceAdapter] Using BHASHINI for Indic STT');
        return;
      }
    }

    if (await this.checkWhisper()) {
      this.backend = 'whisper';
      console.log('[VoiceAdapter] Using Whisper for STT');
      return;
    }

    console.log('[VoiceAdapter] No STT backend available');
    this.backend = 'local';
  }

  private async checkBhashini(): Promise<boolean> {
    try {
      const response = await fetch(`${BHASHINI_API_URL}/ulca/apis/v0/model/getModelsPipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(BHASHINI_API_KEY && { Authorization: BHASHINI_API_KEY }),
        },
        body: JSON.stringify({
          pipelineTasks: [{ taskType: 'asr' }],
          pipelineRequestConfig: {
            pipelineId: '64392f96daac500b55c543cd',
          },
        }),
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkWhisper(): Promise<boolean> {
    try {
      const response = await fetch(`${WHISPER_API_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check if voice input is available
   */
  isAvailable(): boolean {
    return this.backend !== 'local';
  }

  /**
   * Get current backend
   */
  getBackend(): string {
    return this.backend;
  }

  /**
   * Transcribe audio buffer to text
   */
  async transcribe(audioBuffer: Buffer | ArrayBuffer): Promise<VoiceResult> {
    switch (this.backend) {
      case 'bhashini':
        return this.transcribeWithBhashini(audioBuffer);
      case 'whisper':
        return this.transcribeWithWhisper(audioBuffer);
      case 'google':
        return this.transcribeWithGoogle(audioBuffer);
      case 'azure':
        return this.transcribeWithAzure(audioBuffer);
      default:
        throw new Error('No STT backend available');
    }
  }

  /**
   * Transcribe using BHASHINI (Indian Government's AI4Bharat)
   */
  private async transcribeWithBhashini(audioBuffer: Buffer | ArrayBuffer): Promise<VoiceResult> {
    const langCode = LANGUAGE_CODES[this.config.language];

    // First, get the ASR pipeline config
    const configResponse = await fetch(`${BHASHINI_API_URL}/ulca/apis/v0/model/getModelsPipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(BHASHINI_API_KEY && { Authorization: BHASHINI_API_KEY }),
      },
      body: JSON.stringify({
        pipelineTasks: [{
          taskType: 'asr',
          config: {
            language: { sourceLanguage: langCode.split('-')[0] },
          },
        }],
        pipelineRequestConfig: {
          pipelineId: '64392f96daac500b55c543cd',
        },
      }),
    });

    if (!configResponse.ok) {
      throw new Error('Failed to get BHASHINI pipeline config');
    }

    const config = await configResponse.json() as {
      pipelineInferenceAPIEndPoint: { inferenceApiKey: { value: string }; callbackUrl: string };
      pipelineResponseConfig: Array<{ config: Array<{ serviceId: string }> }>;
    };

    // Now call the ASR service
    const base64Audio = Buffer.isBuffer(audioBuffer)
      ? audioBuffer.toString('base64')
      : Buffer.from(audioBuffer).toString('base64');

    const asrResponse = await fetch(config.pipelineInferenceAPIEndPoint.callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.pipelineInferenceAPIEndPoint.inferenceApiKey.value,
      },
      body: JSON.stringify({
        pipelineTasks: [{
          taskType: 'asr',
          config: {
            language: { sourceLanguage: langCode.split('-')[0] },
            serviceId: config.pipelineResponseConfig[0].config[0].serviceId,
            audioFormat: 'wav',
            samplingRate: 16000,
          },
        }],
        inputData: {
          audio: [{ audioContent: base64Audio }],
        },
      }),
    });

    if (!asrResponse.ok) {
      throw new Error('BHASHINI ASR request failed');
    }

    const result = await asrResponse.json() as {
      pipelineResponse: Array<{ output: Array<{ source: string }> }>;
    };

    const text = result.pipelineResponse?.[0]?.output?.[0]?.source || '';

    return {
      text,
      language: this.config.language,
      confidence: 0.9,
    };
  }

  /**
   * Transcribe using Whisper (local or OpenAI)
   */
  private async transcribeWithWhisper(audioBuffer: Buffer | ArrayBuffer): Promise<VoiceResult> {
    const langCode = LANGUAGE_CODES[this.config.language].split('-')[0];

    // Try local Whisper first
    try {
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      formData.append('file', blob, 'audio.wav');
      formData.append('language', langCode);

      const response = await fetch(`${WHISPER_API_URL}/asr`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json() as { text: string };
        return {
          text: result.text,
          language: this.config.language,
          confidence: 0.85,
        };
      }
    } catch {
      // Fall back to OpenAI Whisper
    }

    // Fall back to OpenAI Whisper API
    if (OPENAI_API_KEY) {
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      formData.append('file', blob, 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', langCode);

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json() as { text: string };
        return {
          text: result.text,
          language: this.config.language,
          confidence: 0.9,
        };
      }
    }

    throw new Error('Whisper transcription failed');
  }

  /**
   * Transcribe using Google Speech-to-Text
   */
  private async transcribeWithGoogle(audioBuffer: Buffer | ArrayBuffer): Promise<VoiceResult> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    const langCode = LANGUAGE_CODES[this.config.language];
    const base64Audio = Buffer.isBuffer(audioBuffer)
      ? audioBuffer.toString('base64')
      : Buffer.from(audioBuffer).toString('base64');

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: langCode,
            alternativeLanguageCodes: ['en-IN'],
          },
          audio: { content: base64Audio },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Google Speech API request failed');
    }

    const result = await response.json() as {
      results?: Array<{
        alternatives?: Array<{ transcript: string; confidence: number }>;
      }>;
    };

    const alternative = result.results?.[0]?.alternatives?.[0];
    return {
      text: alternative?.transcript || '',
      language: this.config.language,
      confidence: alternative?.confidence || 0.8,
    };
  }

  /**
   * Transcribe using Azure Speech Services
   */
  private async transcribeWithAzure(audioBuffer: Buffer | ArrayBuffer): Promise<VoiceResult> {
    const apiKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || 'centralindia';

    if (!apiKey) {
      throw new Error('Azure Speech key not configured');
    }

    const langCode = LANGUAGE_CODES[this.config.language];

    const response = await fetch(
      `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${langCode}`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        },
        body: audioBuffer,
      }
    );

    if (!response.ok) {
      throw new Error('Azure Speech API request failed');
    }

    const result = await response.json() as {
      DisplayText?: string;
      RecognitionStatus: string;
    };

    return {
      text: result.DisplayText || '',
      language: this.config.language,
      confidence: result.RecognitionStatus === 'Success' ? 0.9 : 0.5,
    };
  }

  /**
   * Process audio chunk for streaming transcription
   * Use with continuous audio input from microphone
   */
  async processAudioChunk(audioChunk: Buffer | ArrayBuffer): Promise<void> {
    if (!this.isListening) return;

    // Convert to buffer if needed
    const buffer = Buffer.isBuffer(audioChunk)
      ? audioChunk
      : Buffer.from(audioChunk);

    // VAD processing
    if (this.vad && buffer.length >= FRAME_SIZE * 2) {
      const samples = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
      const vadResult = this.vad.process(samples);

      if (vadResult.speechStart) {
        this.emit('speech_start');
        this.streamStartTime = Date.now();
        this.clearSilenceTimer();
      }

      if (vadResult.speechEnd) {
        this.emit('speech_end');
        await this.flushAudioBuffer();
      }

      if (!vadResult.isSpeech) {
        this.startSilenceTimer();
      }
    }

    // Accumulate audio
    this.audioBuffer.push(buffer);

    // Check for max duration
    const duration = Date.now() - this.streamStartTime;
    if (duration > (this.config.maxChunkDuration || MAX_CHUNK_DURATION)) {
      await this.flushAudioBuffer();
    }
  }

  /**
   * Flush accumulated audio and transcribe
   */
  private async flushAudioBuffer(): Promise<void> {
    if (this.audioBuffer.length === 0) return;

    const combinedAudio = Buffer.concat(this.audioBuffer);
    this.audioBuffer = [];
    this.streamStartTime = Date.now();

    try {
      const result = await this.transcribe(combinedAudio);

      // Auto-detect language if enabled
      if (this.config.autoDetectLanguage && result.text) {
        const detected = LanguageDetector.detect(result.text);
        result.detectedLanguage = detected.language;

        if (detected.confidence > 0.7 && detected.language !== this.config.language) {
          this.emit('language_detected', detected.language);
        }
      }

      result.isFinal = true;
      this.emit('final', result);
    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  /**
   * Start silence timer
   */
  private startSilenceTimer(): void {
    if (this.silenceTimer) return;

    this.silenceTimer = setTimeout(async () => {
      this.emit('silence');
      await this.flushAudioBuffer();
      this.silenceTimer = null;
    }, this.config.silenceTimeout || DEFAULT_SILENCE_TIMEOUT);
  }

  /**
   * Clear silence timer
   */
  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /**
   * Start listening for voice input (streaming mode)
   * Returns a readable stream of transcription results
   */
  startListening(): AsyncIterable<VoiceResult> {
    this.isListening = true;
    this.audioBuffer = [];
    this.streamStartTime = Date.now();

    if (this.vad) {
      this.vad.reset();
    }

    // Return an async generator that yields results
    const self = this;
    const results: VoiceResult[] = [];
    let resolveNext: ((value: IteratorResult<VoiceResult>) => void) | null = null;

    // Listen for final results
    const onFinal = (result: VoiceResult) => {
      if (resolveNext) {
        resolveNext({ done: false, value: result });
        resolveNext = null;
      } else {
        results.push(result);
      }
    };

    this.on('final', onFinal);

    return {
      [Symbol.asyncIterator]() {
        return {
          async next(): Promise<IteratorResult<VoiceResult>> {
            if (!self.isListening && results.length === 0) {
              self.off('final', onFinal);
              return { done: true, value: undefined };
            }

            if (results.length > 0) {
              return { done: false, value: results.shift()! };
            }

            return new Promise((resolve) => {
              resolveNext = resolve;
            });
          },
        };
      },
    };
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    this.isListening = false;
    this.clearSilenceTimer();

    // Flush any remaining audio
    if (this.audioBuffer.length > 0) {
      this.flushAudioBuffer().catch(() => {});
    }

    if (this.vad) {
      this.vad.reset();
    }
  }

  /**
   * Transcribe with automatic language detection
   */
  async transcribeWithDetection(audioBuffer: Buffer | ArrayBuffer): Promise<VoiceResult> {
    const result = await this.transcribe(audioBuffer);

    if (result.text) {
      const detected = LanguageDetector.detect(result.text);
      result.detectedLanguage = detected.language;
    }

    return result;
  }

  /**
   * Transcribe long audio by chunking
   */
  async transcribeLong(
    audioBuffer: Buffer | ArrayBuffer,
    chunkDurationMs: number = 30000
  ): Promise<VoiceResult> {
    const buffer = Buffer.isBuffer(audioBuffer)
      ? audioBuffer
      : Buffer.from(audioBuffer);

    // Calculate chunk size (assuming 16kHz, 16-bit mono)
    const bytesPerSecond = SAMPLE_RATE * 2;
    const chunkSize = Math.floor((chunkDurationMs / 1000) * bytesPerSecond);

    if (buffer.length <= chunkSize) {
      return this.transcribe(buffer);
    }

    const segments: VoiceSegment[] = [];
    const texts: string[] = [];
    let offset = 0;

    while (offset < buffer.length) {
      const chunk = buffer.subarray(offset, Math.min(offset + chunkSize, buffer.length));
      const startTime = (offset / bytesPerSecond) * 1000;

      try {
        const result = await this.transcribe(chunk);
        const endTime = startTime + (chunk.length / bytesPerSecond) * 1000;

        if (result.text) {
          texts.push(result.text);
          segments.push({
            text: result.text,
            start: startTime,
            end: endTime,
            confidence: result.confidence,
          });
        }
      } catch (error) {
        console.error(`Chunk transcription failed at offset ${offset}:`, error);
      }

      offset += chunkSize;
    }

    const fullText = texts.join(' ');
    const avgConfidence = segments.length > 0
      ? segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
      : 0;

    const result: VoiceResult = {
      text: fullText,
      language: this.config.language,
      confidence: avgConfidence,
      duration: buffer.length / bytesPerSecond * 1000,
      segments,
    };

    // Detect language from combined text
    if (this.config.autoDetectLanguage && fullText) {
      const detected = LanguageDetector.detect(fullText);
      result.detectedLanguage = detected.language;
    }

    return result;
  }

  /**
   * Get supported languages for the current backend
   */
  getSupportedLanguages(): SupportedLanguage[] {
    switch (this.backend) {
      case 'bhashini':
        // BHASHINI supports all Indian languages
        return ['hi', 'ta', 'te', 'kn', 'mr', 'bn', 'gu', 'ml', 'pa', 'or', 'en'];
      case 'whisper':
        // Whisper supports all languages
        return ['en', 'hi', 'ta', 'te', 'kn', 'mr', 'bn', 'gu', 'ml', 'pa', 'or'];
      case 'google':
      case 'azure':
        // Google and Azure support major Indian languages
        return ['en', 'hi', 'ta', 'te', 'kn', 'mr', 'bn', 'gu', 'ml'];
      default:
        return ['en'];
    }
  }
}

// Singleton instance
let adapterInstance: VoiceAdapter | null = null;

export function getVoiceAdapter(config?: VoiceConfig): VoiceAdapter {
  if (!adapterInstance || config) {
    adapterInstance = new VoiceAdapter(config || { language: 'en' });
  }
  return adapterInstance;
}

// Voice command patterns for different languages
export const VOICE_COMMANDS: Record<SupportedLanguage, Record<string, string[]>> = {
  en: {
    help: ['help', 'assist', 'what can you do'],
    search: ['search', 'find', 'look for'],
    run: ['run', 'execute', 'start'],
    stop: ['stop', 'cancel', 'abort'],
    read: ['read', 'open', 'show'],
    write: ['write', 'create', 'make'],
  },
  hi: {
    help: ['मदद', 'सहायता', 'help'],
    search: ['खोजो', 'ढूंढो', 'search'],
    run: ['चलाओ', 'शुरू करो', 'run'],
    stop: ['रुको', 'बंद करो', 'stop'],
    read: ['पढ़ो', 'दिखाओ', 'read'],
    write: ['लिखो', 'बनाओ', 'write'],
  },
  ta: {
    help: ['உதவி', 'help'],
    search: ['தேடு', 'search'],
    run: ['இயக்கு', 'run'],
    stop: ['நிறுத்து', 'stop'],
    read: ['படி', 'read'],
    write: ['எழுது', 'write'],
  },
  te: {
    help: ['సహాయం', 'help'],
    search: ['వెతుకు', 'search'],
    run: ['అమలు చేయి', 'run'],
    stop: ['ఆపు', 'stop'],
    read: ['చదువు', 'read'],
    write: ['రాయి', 'write'],
  },
  kn: {
    help: ['ಸಹಾಯ', 'help'],
    search: ['ಹುಡುಕು', 'search'],
    run: ['ರನ್ ಮಾಡು', 'run'],
    stop: ['ನಿಲ್ಲಿಸು', 'stop'],
    read: ['ಓದು', 'read'],
    write: ['ಬರೆ', 'write'],
  },
  mr: {
    help: ['मदत', 'help'],
    search: ['शोधा', 'search'],
    run: ['चालवा', 'run'],
    stop: ['थांबा', 'stop'],
    read: ['वाचा', 'read'],
    write: ['लिहा', 'write'],
  },
  bn: {
    help: ['সাহায্য', 'help'],
    search: ['খুঁজুন', 'search'],
    run: ['চালান', 'run'],
    stop: ['থামুন', 'stop'],
    read: ['পড়ুন', 'read'],
    write: ['লিখুন', 'write'],
  },
  gu: {
    help: ['મદદ', 'help'],
    search: ['શોધો', 'search'],
    run: ['ચલાવો', 'run'],
    stop: ['રોકો', 'stop'],
    read: ['વાંચો', 'read'],
    write: ['લખો', 'write'],
  },
  ml: {
    help: ['സഹായം', 'help'],
    search: ['തിരയുക', 'search'],
    run: ['പ്രവർത്തിപ്പിക്കുക', 'run'],
    stop: ['നിർത്തുക', 'stop'],
    read: ['വായിക്കുക', 'read'],
    write: ['എഴുതുക', 'write'],
  },
  pa: {
    help: ['ਮਦਦ', 'help'],
    search: ['ਲੱਭੋ', 'search'],
    run: ['ਚਲਾਓ', 'run'],
    stop: ['ਰੁਕੋ', 'stop'],
    read: ['ਪੜ੍ਹੋ', 'read'],
    write: ['ਲਿਖੋ', 'write'],
  },
  or: {
    help: ['ସାହାଯ୍ୟ', 'help'],
    search: ['ଖୋଜ', 'search'],
    run: ['ଚଲାଅ', 'run'],
    stop: ['ବନ୍ଦ କର', 'stop'],
    read: ['ପଢ଼', 'read'],
    write: ['ଲେଖ', 'write'],
  },
};

/**
 * Parse voice input to detect command intent
 */
export function parseVoiceCommand(
  text: string,
  language: SupportedLanguage
): { command: string; args: string } | null {
  const commands = VOICE_COMMANDS[language] || VOICE_COMMANDS.en;
  const textLower = text.toLowerCase().trim();

  for (const [command, triggers] of Object.entries(commands)) {
    for (const trigger of triggers) {
      if (textLower.startsWith(trigger.toLowerCase())) {
        const args = textLower.slice(trigger.length).trim();
        return { command, args };
      }
    }
  }

  return null;
}

/**
 * Detect language from text (exported utility)
 */
export function detectLanguage(text: string): {
  language: SupportedLanguage;
  confidence: number;
} {
  return LanguageDetector.detect(text);
}

/**
 * Check if text contains Indic script
 */
export function containsIndicScript(text: string): boolean {
  // Check for any Indic Unicode ranges
  const indicRange = /[\u0900-\u0D7F]/;
  return indicRange.test(text);
}

/**
 * Normalize text for consistent processing
 * - Removes extra whitespace
 * - Normalizes Unicode
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

// StreamingEvents is already exported as an interface above
