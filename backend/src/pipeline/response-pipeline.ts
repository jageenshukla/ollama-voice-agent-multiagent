/**
 * Response Pipeline
 * Orchestrates the flow from user input → agent → TTS → response
 */

import { voiceAgent } from '../agent/voice-agent.js';
import { ttsService, type TtsResult } from './tts-service.js';
import { processResponseText, type ProcessedText } from '../utils/text-processing.js';

export interface PipelineResponse {
  displayText: string;  // Text with emojis for display
  speechText: string;   // Text without emojis for TTS
  tts: TtsResult;
  timestamp: string;
  processingTimeMs: number;
}

/**
 * ResponsePipeline class
 * Handles the complete flow of processing user input and generating response with TTS
 */
export class ResponsePipeline {
  constructor() {
    console.log('[PIPELINE] Response pipeline initialized');
  }

  /**
   * Process user message through the complete pipeline
   * 1. Get text response from agent
   * 2. Convert to speech via TTS
   * 3. Return combined result
   */
  async process(userMessage: string): Promise<PipelineResponse> {
    const startTime = Date.now();

    try {
      console.log('[PIPELINE] Processing message:', userMessage);

      // Step 1: Get text response from agent
      console.log('[PIPELINE] Step 1: Getting agent response...');
      const agentResponse = await voiceAgent.processMessage(userMessage);

      // Step 2: Process text for display vs speech
      console.log('[PIPELINE] Step 2: Processing text (emojis)...');
      const processedText = processResponseText(agentResponse);

      // Step 3: Convert speech text to audio (without emojis)
      console.log('[PIPELINE] Step 3: Converting to speech...');
      const ttsResult = await ttsService.textToSpeech(processedText.speech);

      const processingTimeMs = Date.now() - startTime;
      console.log('[PIPELINE] Processing completed in', processingTimeMs, 'ms');
      console.log('[PIPELINE] Display text:', processedText.display);
      console.log('[PIPELINE] Speech text:', processedText.speech);

      return {
        displayText: processedText.display,
        speechText: processedText.speech,
        tts: ttsResult,
        timestamp: new Date().toISOString(),
        processingTimeMs,
      };
    } catch (error) {
      console.error('[PIPELINE] Error processing message:', error);
      throw new Error(`Pipeline error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test the pipeline
   */
  async test(): Promise<boolean> {
    try {
      console.log('[PIPELINE] Testing pipeline...');

      const response = await this.process('Hello');

      const success = !!(response.text && response.tts);
      console.log('[PIPELINE] Test result:', success ? 'SUCCESS' : 'FAILED');

      return success;
    } catch (error) {
      console.error('[PIPELINE] Test failed:', error);
      return false;
    }
  }

  /**
   * Get pipeline statistics
   */
  getStats() {
    return {
      agent: voiceAgent.getInfo(),
      tts: ttsService.getConfig(),
    };
  }
}

/**
 * Export singleton instance
 */
export const responsePipeline = new ResponsePipeline();
