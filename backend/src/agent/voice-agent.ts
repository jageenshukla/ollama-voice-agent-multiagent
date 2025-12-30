/**
 * Voice Agent Implementation using Google ADK
 * Creates an LLM-powered conversational agent optimized for voice interaction
 * Supports function calling with FunctionGemma
 */

import { OllamaProvider, type Message, type ToolCall } from '../models/ollama-provider.js';
import { getModelConfig } from '../config/models.js';
import { VOICE_AGENT_SYSTEM_PROMPT } from './prompts.js';
import { availableTools } from '../tools/definitions.js';
import { toolRegistry, type FrontendToolEmitter } from '../tools/registry.js';

/**
 * Conversation history entry
 */
export interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * VoiceAgent class - Multi-Agent Architecture
 * Uses FunctionGemma as router for tool detection + Gemma 2 for conversation
 * This implements a router pattern for intelligent tool calling
 */
export class VoiceAgent {
  private routerProvider: OllamaProvider;      // FunctionGemma: detects if tools are needed
  private conversationProvider: OllamaProvider; // Gemma 2: handles conversation
  private conversationHistory: ConversationEntry[] = [];
  private systemPrompt: string;
  private maxHistoryLength: number = 10; // Keep last 10 exchanges

  constructor() {
    // Initialize FunctionGemma as the router (tool detector)
    const routerConfig = {
      provider: 'ollama' as const,
      baseUrl: 'http://localhost:11434',
      model: 'functiongemma:latest',
      temperature: 0.3,
      maxTokens: 300,
    };

    // Initialize Gemma 2 as the conversational agent
    const conversationConfig = {
      provider: 'ollama' as const,
      baseUrl: 'http://localhost:11434',
      model: 'gemma2:2b',
      temperature: 0.7,
      maxTokens: 500,
    };

    this.routerProvider = new OllamaProvider(routerConfig);
    this.conversationProvider = new OllamaProvider(conversationConfig);
    this.systemPrompt = VOICE_AGENT_SYSTEM_PROMPT;

    console.log('[AGENT] Multi-agent voice agent initialized');
    console.log('[AGENT] Router: functiongemma:latest');
    console.log('[AGENT] Conversation: gemma2:2b');
  }

  /**
   * Set frontend tool emitter for frontend-delegated tools
   */
  setFrontendToolEmitter(emitter: FrontendToolEmitter) {
    toolRegistry.setFrontendToolEmitter(emitter);
  }

  /**
   * Process user input using Multi-Agent Router Pattern
   *
   * Workflow:
   * 1. FunctionGemma (Router): Detects if tool call is needed
   * 2a. If tool needed: Execute tool → Gemma 2 generates natural response
   * 2b. If no tool: Gemma 2 handles conversation directly
   */
  async processMessage(userInput: string): Promise<string> {
    try {
      console.log('[AGENT] Processing message:', userInput);
      console.log('[AGENT] === MULTI-AGENT WORKFLOW START ===');

      // Add user message to history
      this.addToHistory('user', userInput);

      // Build messages array
      let messages = this.buildMessagesArray();

      // STEP 1: Use FunctionGemma as Router to detect if tool is needed
      console.log('[AGENT] STEP 1: Router (FunctionGemma) checking for tool calls...');
      const routerResponse = await this.routerProvider.chat(messages, availableTools);

      // STEP 2: Check router's decision
      if (routerResponse.message.tool_calls && routerResponse.message.tool_calls.length > 0) {
        // BRANCH A: Tool detected - execute it and use Gemma 2 for response
        console.log('[AGENT] ✓ Router detected tool call:', routerResponse.message.tool_calls[0].function.name);

        // Execute each tool call
        let toolResults: any[] = [];
        for (const toolCall of routerResponse.message.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = typeof toolCall.function.arguments === 'string'
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;

          console.log('[AGENT] STEP 2A: Executing tool:', toolName, 'with args:', toolArgs);

          const result = await toolRegistry.executeTool({
            name: toolName,
            parameters: toolArgs,
          });

          console.log('[AGENT] Tool result:', result);
          toolResults.push(result);
        }

        // STEP 3: Use Gemma 2 to generate natural response about tool execution
        console.log('[AGENT] STEP 3: Gemma 2 generating natural response...');
        const responseMessages: Message[] = [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: userInput },
          { role: 'assistant', content: `Tool executed successfully: ${JSON.stringify(toolResults)}. Generate a natural, personality-driven response about what was done.` },
        ];

        const conversationResponse = await this.conversationProvider.chat(responseMessages);
        const finalResponse = conversationResponse.message.content;

        // Add to history
        this.addToHistory('assistant', finalResponse);

        // Clear old history
        if (this.conversationHistory.length > 4) {
          this.conversationHistory = this.conversationHistory.slice(-2);
        }

        console.log('[AGENT] === WORKFLOW COMPLETE (Tool + Response) ===');
        return finalResponse;

      } else {
        // BRANCH B: No tool needed - use Gemma 2 for direct conversation
        console.log('[AGENT] ✗ No tool needed - routing to Gemma 2 for conversation');
        console.log('[AGENT] STEP 2B: Gemma 2 handling conversation...');

        const conversationResponse = await this.conversationProvider.chat(messages);
        const finalResponse = conversationResponse.message.content;

        // Add to history
        this.addToHistory('assistant', finalResponse);

        console.log('[AGENT] === WORKFLOW COMPLETE (Conversation) ===');
        return finalResponse;
      }
    } catch (error) {
      console.error('[AGENT] Error processing message:', error);
      throw new Error(`Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build messages array including system prompt and conversation history
   */
  private buildMessagesArray(): Message[] {
    const messages: Message[] = [
      {
        role: 'system',
        content: this.systemPrompt,
      },
    ];

    // Add conversation history
    for (const entry of this.conversationHistory) {
      messages.push({
        role: entry.role,
        content: entry.content,
      });
    }

    return messages;
  }

  /**
   * Add message to conversation history
   */
  private addToHistory(role: 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
    });
  }

  /**
   * Trim conversation history to maintain context window
   */
  private trimHistory(): void {
    if (this.conversationHistory.length > this.maxHistoryLength * 2) {
      // Keep only recent exchanges (each exchange = user + assistant message)
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
      console.log('[AGENT] Trimmed conversation history');
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): ConversationEntry[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    console.log('[AGENT] Conversation history cleared');
  }

  /**
   * Update system prompt
   */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
    console.log('[AGENT] System prompt updated');
  }

  /**
   * Test the multi-agent connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[AGENT] Testing multi-agent connections...');
      const routerConnected = await this.routerProvider.testConnection();
      const conversationConnected = await this.conversationProvider.testConnection();
      const isConnected = routerConnected && conversationConnected;
      console.log('[AGENT] Router:', routerConnected ? 'SUCCESS' : 'FAILED');
      console.log('[AGENT] Conversation:', conversationConnected ? 'SUCCESS' : 'FAILED');
      return isConnected;
    } catch (error) {
      console.error('[AGENT] Connection test error:', error);
      return false;
    }
  }

  /**
   * Get multi-agent information
   */
  getInfo() {
    return {
      router: this.routerProvider.getModelInfo(),
      conversation: this.conversationProvider.getModelInfo(),
      historyLength: this.conversationHistory.length,
      maxHistoryLength: this.maxHistoryLength,
    };
  }
}

/**
 * Create and export a singleton instance
 */
export const voiceAgent = new VoiceAgent();
