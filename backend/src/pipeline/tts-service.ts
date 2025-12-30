/**
 * TTS (Text-to-Speech) Service
 * Handles text-to-speech conversion with multiple backend support
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { getTtsConfig, type TtsConfig } from '../config/tts.js';

const execAsync = promisify(exec);

export interface TtsResult {
  provider: string;
  method: 'browser' | 'audio' | 'stream';
  text: string;
  audioData?: Buffer;
  audioUrl?: string;
  metadata?: {
    duration?: number;
    voice?: string;
    [key: string]: any;
  };
}

/**
 * TtsService class
 * Provides text-to-speech conversion with multiple backend support
 */
export class TtsService {
  private config: TtsConfig;

  constructor() {
    this.config = getTtsConfig();
    console.log('[TTS] Service initialized with provider:', this.config.provider);
  }

  /**
   * Convert text to speech
   * Returns metadata for browser-based TTS or audio data for server-side TTS
   */
  async textToSpeech(text: string): Promise<TtsResult> {
    if (!this.config.enabled) {
      console.log('[TTS] TTS disabled, returning text only');
      return {
        provider: 'none',
        method: 'browser',
        text,
      };
    }

    switch (this.config.provider) {
      case 'browser':
        return this.browserTts(text);

      case 'system':
        return this.systemTts(text);

      case 'piper':
        return this.piperTts(text);

      case 'coqui':
        return this.coquiTts(text);

      default:
        console.warn('[TTS] Unknown provider, falling back to browser TTS');
        return this.browserTts(text);
    }
  }

  /**
   * Browser-based TTS (Web Speech API)
   * Returns text for frontend to speak using browser's TTS
   */
  private async browserTts(text: string): Promise<TtsResult> {
    console.log('[TTS] Using browser TTS for:', text.slice(0, 50) + '...');

    return {
      provider: 'browser',
      method: 'browser',
      text,
      metadata: {
        voice: this.config.browserVoice,
        rate: this.config.rate,
        pitch: this.config.pitch,
        volume: this.config.volume,
      },
    };
  }

  /**
   * System TTS (say command on macOS, espeak on Linux)
   * Generates audio file using system command
   */
  private async systemTts(text: string): Promise<TtsResult> {
    try {
      console.log('[TTS] Using system TTS for:', text.slice(0, 50) + '...');

      // On macOS, use 'say' command
      // Note: This plays audio on the server, not ideal for web app
      // Better to generate audio file and stream it

      const command = this.config.systemCommand || 'say';
      const rate = Math.round((this.config.rate || 1.0) * 200); // Convert to words per minute

      // For now, just log that we'd use system TTS
      // In production, you'd generate an audio file
      console.log('[TTS] Would execute:', `${command} -r ${rate} "${text}"`);

      return {
        provider: 'system',
        method: 'browser', // Fallback to browser for now
        text,
        metadata: {
          command,
          rate,
        },
      };
    } catch (error) {
      console.error('[TTS] System TTS error:', error);
      // Fallback to browser TTS
      return this.browserTts(text);
    }
  }

  /**
   * Piper TTS (local neural TTS)
   * Fast, high-quality local TTS
   */
  private async piperTts(text: string): Promise<TtsResult> {
    try {
      console.log('[TTS] Piper TTS requested but not implemented yet');
      console.log('[TTS] Falling back to browser TTS');

      // TODO: Implement Piper TTS integration
      // This would require:
      // 1. Installing Piper: https://github.com/rhasspy/piper
      // 2. Downloading a voice model
      // 3. Running: echo "text" | piper --model model.onnx --output_file output.wav

      return this.browserTts(text);
    } catch (error) {
      console.error('[TTS] Piper TTS error:', error);
      return this.browserTts(text);
    }
  }

  /**
   * Coqui TTS (requires separate Python service)
   * High-quality TTS with multiple voices
   */
  private async coquiTts(text: string): Promise<TtsResult> {
    try {
      console.log('[TTS] Coqui TTS requested but not implemented yet');
      console.log('[TTS] Falling back to browser TTS');

      // TODO: Implement Coqui TTS integration
      // This would require:
      // 1. Running Coqui TTS server: docker run -p 5002:5002 ghcr.io/coqui-ai/tts
      // 2. Making HTTP request to generate audio
      // 3. Streaming audio back to client

      return this.browserTts(text);
    } catch (error) {
      console.error('[TTS] Coqui TTS error:', error);
      return this.browserTts(text);
    }
  }

  /**
   * Get TTS configuration
   */
  getConfig(): TtsConfig {
    return { ...this.config };
  }

  /**
   * Test TTS service
   */
  async test(): Promise<boolean> {
    try {
      const result = await this.textToSpeech('Hello, this is a test.');
      return !!result.text;
    } catch (error) {
      console.error('[TTS] Test failed:', error);
      return false;
    }
  }
}

/**
 * Export singleton instance
 */
export const ttsService = new TtsService();
