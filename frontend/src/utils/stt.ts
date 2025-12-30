/**
 * Speech-to-Text Utility
 * Uses Web Speech API for voice recognition
 */

export interface SttOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

/**
 * STT Manager class
 * Handles speech recognition using Web Speech API
 */
export class SttManager {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;

  constructor() {
    // Check for browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('[STT] Web Speech API not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    console.log('[STT] STT Manager initialized');
  }

  /**
   * Check if STT is supported
   */
  isSupported(): boolean {
    return this.recognition !== null;
  }

  /**
   * Start listening for voice input
   */
  startListening(options: SttOptions = {}): void {
    if (!this.recognition) {
      console.error('[STT] Speech recognition not available');
      options.onError?.(new Error('Speech recognition not supported'));
      return;
    }

    if (this.isListening) {
      console.warn('[STT] Already listening');
      return;
    }

    console.log('[STT] Starting to listen...');

    // Configure recognition
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.lang = options.language || 'en-US';

    // Set up event handlers
    this.recognition.onstart = () => {
      console.log('[STT] Recognition started');
      this.isListening = true;
      options.onStart?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      let isFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        transcript += result[0].transcript;
        if (result.isFinal) {
          isFinal = true;
        }
      }

      console.log('[STT] Transcript:', transcript, '(final:', isFinal, ')');
      options.onResult?.(transcript, isFinal);
    };

    this.recognition.onend = () => {
      console.log('[STT] Recognition ended');
      this.isListening = false;
      options.onEnd?.();
    };

    this.recognition.onerror = (event: any) => {
      console.error('[STT] Recognition error:', event.error);
      this.isListening = false;

      const errorMessage = this.getErrorMessage(event.error);
      options.onError?.(new Error(errorMessage));
    };

    // Start recognition
    try {
      this.recognition.start();
    } catch (error) {
      console.error('[STT] Failed to start recognition:', error);
      this.isListening = false;
      options.onError?.(error instanceof Error ? error : new Error('Failed to start recognition'));
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (!this.recognition) {
      return;
    }

    if (!this.isListening) {
      console.warn('[STT] Not currently listening');
      return;
    }

    console.log('[STT] Stopping listening...');
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('[STT] Error stopping recognition:', error);
    }
  }

  /**
   * Abort listening
   */
  abort(): void {
    if (!this.recognition) {
      return;
    }

    if (!this.isListening) {
      return;
    }

    console.log('[STT] Aborting listening...');
    try {
      this.recognition.abort();
      this.isListening = false;
    } catch (error) {
      console.error('[STT] Error aborting recognition:', error);
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: string): string {
    switch (error) {
      case 'no-speech':
        return 'No speech detected. Please try again.';
      case 'audio-capture':
        return 'No microphone found. Please check your microphone.';
      case 'not-allowed':
        return 'Microphone permission denied. Please allow microphone access.';
      case 'network':
        return 'Network error occurred. Please check your connection.';
      case 'aborted':
        return 'Speech recognition aborted.';
      default:
        return `Speech recognition error: ${error}`;
    }
  }
}

/**
 * Export singleton instance
 */
export const sttManager = new SttManager();
