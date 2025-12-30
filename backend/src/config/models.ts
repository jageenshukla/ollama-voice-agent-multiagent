/**
 * Model Configuration
 * Defines model settings for different providers
 */

import { envConfig } from './env.js';

export interface ModelConfig {
  provider: 'ollama' | 'openai';
  baseUrl?: string;
  model: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Get model configuration based on environment settings
 */
export function getModelConfig(): ModelConfig {
  if (envConfig.modelProvider === 'ollama') {
    return {
      provider: 'ollama',
      baseUrl: envConfig.ollamaBaseUrl,
      model: envConfig.ollamaModel,
      temperature: 0.7, // Higher temperature to encourage tool usage
      maxTokens: 500, // More tokens for complete responses after tool execution
    };
  } else {
    return {
      provider: 'openai',
      model: envConfig.openaiModel!,
      apiKey: envConfig.openaiApiKey,
      temperature: 0.7,
      maxTokens: 300, // Shorter responses for voice
    };
  }
}

/**
 * Model-specific settings for voice optimization
 */
export const VOICE_SETTINGS = {
  // Keep responses concise for voice interaction
  maxTokens: 300,

  // Slightly creative but consistent
  temperature: 0.7,

  // Stop tokens to prevent overly long responses
  stopSequences: ['\n\n\n', 'User:', 'Assistant:'],

  // Streaming for real-time response
  streaming: true,
};

console.log('[MODELS] Model configuration:', getModelConfig());
