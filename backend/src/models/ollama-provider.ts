/**
 * Ollama Provider for ADK
 * Wraps Ollama client to make it compatible with Google ADK
 * Supports function calling with FunctionGemma
 */

import { Ollama } from 'ollama';
import type { ModelConfig } from '../config/models.js';
import type { Tool } from '../tools/definitions.js';

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id?: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionResponse {
  message: {
    role: string;
    content: string;
    tool_calls?: ToolCall[];
  };
  done: boolean;
}

/**
 * OllamaProvider class
 * Provides a consistent interface for Ollama model interactions
 */
export class OllamaProvider {
  private client: Ollama;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: ModelConfig) {
    if (config.provider !== 'ollama') {
      throw new Error('OllamaProvider requires provider to be "ollama"');
    }

    this.client = new Ollama({
      host: config.baseUrl,
    });

    this.model = config.model;
    this.temperature = config.temperature || 0.3; // Lower temperature for more focused tool calling
    this.maxTokens = config.maxTokens || 500; // More tokens for complete responses after tool execution

    console.log('[OLLAMA] Provider initialized:', {
      baseUrl: config.baseUrl,
      model: this.model,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    });
  }

  /**
   * Generate a chat completion using Ollama
   */
  async chat(messages: Message[], tools?: Tool[]): Promise<ChatCompletionResponse> {
    try {
      console.log('[OLLAMA] Generating response for', messages.length, 'messages');
      if (tools) {
        console.log('[OLLAMA] Using tools:', tools.map(t => t.function.name).join(', '));
      }

      const requestBody: any = {
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
        })),
        stream: false,
        options: {
          temperature: this.temperature,
          num_predict: this.maxTokens,
        },
      };

      // Add tools if provided
      if (tools && tools.length > 0) {
        requestBody.tools = tools;
      }

      const response = await this.client.chat(requestBody);

      const content = response.message.content || '';
      const tool_calls = response.message.tool_calls;

      if (tool_calls && tool_calls.length > 0) {
        console.log('[OLLAMA] Tool calls detected:', tool_calls.map((tc: any) => tc.function.name).join(', '));
      } else {
        console.log('[OLLAMA] Response generated:', content.slice(0, 100) + (content.length > 100 ? '...' : ''));
      }

      return {
        message: {
          role: response.message.role,
          content,
          tool_calls: tool_calls as ToolCall[] | undefined,
        },
        done: response.done,
      };
    } catch (error) {
      console.error('[OLLAMA] Error generating response:', error);
      throw new Error(`Ollama chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream chat completion (for future use)
   */
  async *chatStream(messages: Message[]): AsyncGenerator<string> {
    try {
      console.log('[OLLAMA] Starting stream for', messages.length, 'messages');

      const stream = await this.client.chat({
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        stream: true,
        options: {
          temperature: this.temperature,
          num_predict: this.maxTokens,
        },
      });

      for await (const chunk of stream) {
        if (chunk.message && chunk.message.content) {
          yield chunk.message.content;
        }
      }

      console.log('[OLLAMA] Stream completed');
    } catch (error) {
      console.error('[OLLAMA] Error in stream:', error);
      throw new Error(`Ollama stream failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test the connection to Ollama
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[OLLAMA] Testing connection...');

      const response = await this.client.chat({
        model: this.model,
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      });

      const success = !!response.message.content;
      console.log('[OLLAMA] Connection test:', success ? 'SUCCESS' : 'FAILED');

      return success;
    } catch (error) {
      console.error('[OLLAMA] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      provider: 'ollama',
      model: this.model,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    };
  }
}
