/**
 * Text-to-Speech Utility
 * Uses Web Speech API for browser-based TTS
 */

export interface TtsOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

/**
 * TTS Manager class
 * Handles text-to-speech using Web Speech API
 */
export class TtsManager {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (!('speechSynthesis' in window)) {
      throw new Error('Web Speech API not supported in this browser');
    }

    this.synth = window.speechSynthesis;
    this.loadVoices();

    // Voices load asynchronously, so listen for changes
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }

    console.log('[TTS] TTS Manager initialized');
  }

  /**
   * Load available voices
   */
  private loadVoices(): void {
    this.voices = this.synth.getVoices();
    console.log('[TTS] Loaded', this.voices.length, 'voices');
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    return this.voices;
  }

  /**
   * Find voice by name
   */
  findVoice(name: string): SpeechSynthesisVoice | undefined {
    const voices = this.getVoices();
    return voices.find(voice =>
      voice.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  /**
   * Get default English voice
   */
  getDefaultVoice(): SpeechSynthesisVoice | undefined {
    const voices = this.getVoices();

    // Try to find Google US English voice (high quality)
    let voice = voices.find(v => v.name.includes('Google US English'));

    // Fallback to any English voice
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith('en'));
    }

    // Fallback to first available voice
    if (!voice && voices.length > 0) {
      voice = voices[0];
    }

    return voice;
  }

  /**
   * Speak text
   */
  speak(text: string, options: TtsOptions = {}): void {
    // Stop any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);

    // Set voice
    if (options.voice) {
      const voice = this.findVoice(options.voice);
      if (voice) {
        utterance.voice = voice;
      }
    } else {
      const defaultVoice = this.getDefaultVoice();
      if (defaultVoice) {
        utterance.voice = defaultVoice;
      }
    }

    // Set parameters
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    // Set event handlers
    utterance.onstart = () => {
      console.log('[TTS] Started speaking');
      options.onStart?.();
    };

    utterance.onend = () => {
      console.log('[TTS] Finished speaking');
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('[TTS] Speech error:', event.error);
      this.currentUtterance = null;
      options.onError?.(new Error(event.error));
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);

    console.log('[TTS] Speaking:', text.slice(0, 50) + '...');
  }

  /**
   * Stop speaking
   */
  stop(): void {
    if (this.synth.speaking) {
      this.synth.cancel();
      this.currentUtterance = null;
      console.log('[TTS] Stopped speaking');
    }
  }

  /**
   * Pause speaking
   */
  pause(): void {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      console.log('[TTS] Paused speaking');
    }
  }

  /**
   * Resume speaking
   */
  resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
      console.log('[TTS] Resumed speaking');
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synth.speaking;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.synth.paused;
  }
}

/**
 * Export singleton instance
 */
export const ttsManager = new TtsManager();
