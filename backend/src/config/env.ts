/**
 * Environment Configuration
 * Loads and validates environment variables from .env file
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

export interface EnvConfig {
  port: number;
  modelProvider: 'ollama' | 'openai';
  ollamaBaseUrl: string;
  ollamaModel: string;
  openaiApiKey?: string;
  openaiModel?: string;
}

/**
 * Parse and validate environment variables
 */
function loadEnvConfig(): EnvConfig {
  const port = parseInt(process.env.PORT || '3001', 10);
  const modelProvider = (process.env.MODEL_PROVIDER || 'ollama') as 'ollama' | 'openai';

  // Ollama configuration
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'gemma2:2b';

  // OpenAI configuration (optional)
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4';

  // Validation
  if (modelProvider === 'openai' && !openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required when MODEL_PROVIDER=openai');
  }

  return {
    port,
    modelProvider,
    ollamaBaseUrl,
    ollamaModel,
    openaiApiKey,
    openaiModel,
  };
}

export const envConfig = loadEnvConfig();

// Log configuration (without sensitive data)
console.log('[ENV] Configuration loaded:', {
  port: envConfig.port,
  modelProvider: envConfig.modelProvider,
  ollamaBaseUrl: envConfig.ollamaBaseUrl,
  ollamaModel: envConfig.ollamaModel,
  openaiModel: envConfig.openaiModel,
  openaiConfigured: !!envConfig.openaiApiKey,
});
