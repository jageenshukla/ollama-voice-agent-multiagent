/**
 * Text Processing Utilities
 * Handles emoji stripping and text formatting for TTS vs display
 */

/**
 * Remove emojis from text for TTS
 * Emojis don't work well with text-to-speech
 */
export function stripEmojis(text: string): string {
  // Regex to match emoji characters
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]/gu;

  return text.replace(emojiRegex, '').replace(/\s+/g, ' ').trim();
}

/**
 * Process text for different output formats
 */
export interface ProcessedText {
  display: string;  // Original text with emojis for visual display
  speech: string;   // Text without emojis for TTS
}

/**
 * Process response text for both display and speech
 */
export function processResponseText(text: string): ProcessedText {
  return {
    display: text,
    speech: stripEmojis(text),
  };
}

/**
 * Clean up text formatting
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')  // Multiple spaces to single space
    .replace(/\n{3,}/g, '\n\n')  // Multiple newlines to double newline
    .trim();
}
