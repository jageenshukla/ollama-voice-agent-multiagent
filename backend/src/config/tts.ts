/**
 * TTS (Text-to-Speech) Configuration
 * Defines TTS settings for different providers
 */

export type TtsProvider = 'browser' | 'system' | 'piper' | 'coqui';

export interface TtsConfig {
  provider: TtsProvider;
  enabled: boolean;

  // Browser TTS (Web Speech API)
  browserVoice?: string;

  // System TTS (say command on macOS, espeak on Linux)
  systemCommand?: string;

  // Piper TTS (local neural TTS)
  piperPath?: string;
  piperModel?: string;

  // Coqui TTS (requires separate Python service)
  coquiUrl?: string;

  // Common settings
  rate?: number;      // Speech rate (0.1 to 10)
  pitch?: number;     // Speech pitch (0 to 2)
  volume?: number;    // Speech volume (0 to 1)
}

/**
 * Get TTS configuration from environment
 */
export function getTtsConfig(): TtsConfig {
  const provider = (process.env.TTS_PROVIDER || 'browser') as TtsProvider;
  const enabled = process.env.TTS_ENABLED !== 'false';

  return {
    provider,
    enabled,

    // Browser TTS settings
    browserVoice: process.env.TTS_BROWSER_VOICE || 'Google US English',

    // System TTS settings
    systemCommand: process.env.TTS_SYSTEM_COMMAND || 'say', // macOS default

    // Piper TTS settings
    piperPath: process.env.PIPER_PATH,
    piperModel: process.env.PIPER_MODEL || 'en_US-lessac-medium',

    // Coqui TTS settings
    coquiUrl: process.env.COQUI_TTS_URL || 'http://localhost:5002',

    // Common settings
    rate: parseFloat(process.env.TTS_RATE || '1.0'),
    pitch: parseFloat(process.env.TTS_PITCH || '1.0'),
    volume: parseFloat(process.env.TTS_VOLUME || '1.0'),
  };
}

export const ttsConfig = getTtsConfig();

console.log('[TTS] Configuration loaded:', {
  provider: ttsConfig.provider,
  enabled: ttsConfig.enabled,
});
