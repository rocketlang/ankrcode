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
import { EventEmitter } from 'events';
// Language to BCP-47 code mapping
const LANGUAGE_CODES = {
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
    threshold;
    windowSize = 10;
    energyHistory = [];
    isSpeaking = false;
    silenceFrames = 0;
    silenceThreshold = 30; // frames of silence before speech end
    constructor(threshold = VAD_SPEECH_THRESHOLD) {
        this.threshold = threshold;
    }
    /**
     * Process audio frame and detect speech
     */
    process(samples) {
        // Calculate RMS energy
        let sum = 0;
        const isFloat = samples instanceof Float32Array;
        for (let i = 0; i < samples.length; i++) {
            const sample = isFloat
                ? samples[i]
                : samples[i] / 32768;
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
        }
        else {
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
    reset() {
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
    static SCRIPT_RANGES = {
        hi: /[\u0900-\u097F]/, // Devanagari (Hindi, Marathi, Sanskrit)
        mr: /[\u0900-\u097F]/, // Devanagari (shared with Hindi)
        ta: /[\u0B80-\u0BFF]/, // Tamil
        te: /[\u0C00-\u0C7F]/, // Telugu
        kn: /[\u0C80-\u0CFF]/, // Kannada
        bn: /[\u0980-\u09FF]/, // Bengali
        gu: /[\u0A80-\u0AFF]/, // Gujarati
        ml: /[\u0D00-\u0D7F]/, // Malayalam
        pa: /[\u0A00-\u0A7F]/, // Gurmukhi (Punjabi)
        or: /[\u0B00-\u0B7F]/, // Odia
        en: /^[a-zA-Z\s\d.,!?'"()-]+$/, // ASCII (English)
    };
    // Common words for distinguishing similar scripts
    static LANGUAGE_MARKERS = {
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
    static detect(text) {
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
        const scriptCounts = {};
        for (const [lang, regex] of Object.entries(this.SCRIPT_RANGES)) {
            const matches = text.match(new RegExp(regex, 'g'));
            if (matches) {
                scriptCounts[lang] = (scriptCounts[lang] || 0) + matches.length;
            }
        }
        // Find dominant script
        let maxCount = 0;
        let detectedLang = 'en';
        for (const [lang, count] of Object.entries(scriptCounts)) {
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
    config;
    backend = 'local';
    isListening = false;
    vad = null;
    audioBuffer = [];
    silenceTimer = null;
    streamStartTime = 0;
    constructor(config) {
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
    async detectBackend() {
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
    async checkBhashini() {
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
        }
        catch {
            return false;
        }
    }
    async checkWhisper() {
        try {
            const response = await fetch(`${WHISPER_API_URL}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000),
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    /**
     * Check if voice input is available
     */
    isAvailable() {
        return this.backend !== 'local';
    }
    /**
     * Get current backend
     */
    getBackend() {
        return this.backend;
    }
    /**
     * Transcribe audio buffer to text
     */
    async transcribe(audioBuffer) {
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
    async transcribeWithBhashini(audioBuffer) {
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
        const config = await configResponse.json();
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
        const result = await asrResponse.json();
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
    async transcribeWithWhisper(audioBuffer) {
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
                const result = await response.json();
                return {
                    text: result.text,
                    language: this.config.language,
                    confidence: 0.85,
                };
            }
        }
        catch {
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
                const result = await response.json();
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
    async transcribeWithGoogle(audioBuffer) {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error('Google API key not configured');
        }
        const langCode = LANGUAGE_CODES[this.config.language];
        const base64Audio = Buffer.isBuffer(audioBuffer)
            ? audioBuffer.toString('base64')
            : Buffer.from(audioBuffer).toString('base64');
        const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
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
        });
        if (!response.ok) {
            throw new Error('Google Speech API request failed');
        }
        const result = await response.json();
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
    async transcribeWithAzure(audioBuffer) {
        const apiKey = process.env.AZURE_SPEECH_KEY;
        const region = process.env.AZURE_SPEECH_REGION || 'centralindia';
        if (!apiKey) {
            throw new Error('Azure Speech key not configured');
        }
        const langCode = LANGUAGE_CODES[this.config.language];
        const response = await fetch(`https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${langCode}`, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
            },
            body: audioBuffer,
        });
        if (!response.ok) {
            throw new Error('Azure Speech API request failed');
        }
        const result = await response.json();
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
    async processAudioChunk(audioChunk) {
        if (!this.isListening)
            return;
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
    async flushAudioBuffer() {
        if (this.audioBuffer.length === 0)
            return;
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
        }
        catch (error) {
            this.emit('error', error);
        }
    }
    /**
     * Start silence timer
     */
    startSilenceTimer() {
        if (this.silenceTimer)
            return;
        this.silenceTimer = setTimeout(async () => {
            this.emit('silence');
            await this.flushAudioBuffer();
            this.silenceTimer = null;
        }, this.config.silenceTimeout || DEFAULT_SILENCE_TIMEOUT);
    }
    /**
     * Clear silence timer
     */
    clearSilenceTimer() {
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }
    }
    /**
     * Start listening for voice input (streaming mode)
     * Returns a readable stream of transcription results
     */
    startListening() {
        this.isListening = true;
        this.audioBuffer = [];
        this.streamStartTime = Date.now();
        if (this.vad) {
            this.vad.reset();
        }
        // Return an async generator that yields results
        const self = this;
        const results = [];
        let resolveNext = null;
        // Listen for final results
        const onFinal = (result) => {
            if (resolveNext) {
                resolveNext({ done: false, value: result });
                resolveNext = null;
            }
            else {
                results.push(result);
            }
        };
        this.on('final', onFinal);
        return {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        if (!self.isListening && results.length === 0) {
                            self.off('final', onFinal);
                            return { done: true, value: undefined };
                        }
                        if (results.length > 0) {
                            return { done: false, value: results.shift() };
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
    stopListening() {
        this.isListening = false;
        this.clearSilenceTimer();
        // Flush any remaining audio
        if (this.audioBuffer.length > 0) {
            this.flushAudioBuffer().catch(() => { });
        }
        if (this.vad) {
            this.vad.reset();
        }
    }
    /**
     * Transcribe with automatic language detection
     */
    async transcribeWithDetection(audioBuffer) {
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
    async transcribeLong(audioBuffer, chunkDurationMs = 30000) {
        const buffer = Buffer.isBuffer(audioBuffer)
            ? audioBuffer
            : Buffer.from(audioBuffer);
        // Calculate chunk size (assuming 16kHz, 16-bit mono)
        const bytesPerSecond = SAMPLE_RATE * 2;
        const chunkSize = Math.floor((chunkDurationMs / 1000) * bytesPerSecond);
        if (buffer.length <= chunkSize) {
            return this.transcribe(buffer);
        }
        const segments = [];
        const texts = [];
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
            }
            catch (error) {
                console.error(`Chunk transcription failed at offset ${offset}:`, error);
            }
            offset += chunkSize;
        }
        const fullText = texts.join(' ');
        const avgConfidence = segments.length > 0
            ? segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
            : 0;
        const result = {
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
    getSupportedLanguages() {
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
let adapterInstance = null;
export function getVoiceAdapter(config) {
    if (!adapterInstance || config) {
        adapterInstance = new VoiceAdapter(config || { language: 'en' });
    }
    return adapterInstance;
}
// Voice command patterns for different languages
export const VOICE_COMMANDS = {
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
export function parseVoiceCommand(text, language) {
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
export function detectLanguage(text) {
    return LanguageDetector.detect(text);
}
/**
 * Check if text contains Indic script
 */
export function containsIndicScript(text) {
    // Check for any Indic Unicode ranges
    const indicRange = /[\u0900-\u0D7F]/;
    return indicRange.test(text);
}
/**
 * Normalize text for consistent processing
 * - Removes extra whitespace
 * - Normalizes Unicode
 */
export function normalizeText(text) {
    return text
        .normalize('NFC')
        .replace(/\s+/g, ' ')
        .trim();
}
// StreamingEvents is already exported as an interface above
//# sourceMappingURL=adapter.js.map