/**
 * Tool Registry
 * Manages tool execution and frontend tool delegation
 */

import type { ToolCall } from './definitions.js';

export interface ToolExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
}

export type FrontendToolEmitter = (toolName: string, parameters: Record<string, any>) => Promise<ToolExecutionResult>;

/**
 * Tool Registry Class
 * Handles tool execution - both local and frontend-delegated
 */
export class ToolRegistry {
  private frontendToolEmitter?: FrontendToolEmitter;

  /**
   * Set the frontend tool emitter (Socket.io emit function)
   */
  setFrontendToolEmitter(emitter: FrontendToolEmitter) {
    this.frontendToolEmitter = emitter;
  }

  /**
   * Execute a tool call
   * For changeBackgroundColor, this delegates to the frontend
   */
  async executeTool(toolCall: ToolCall): Promise<ToolExecutionResult> {
    console.log('[TOOL REGISTRY] Executing tool:', toolCall.name, 'with parameters:', toolCall.parameters);

    switch (toolCall.name) {
      case 'changeBackgroundColor':
        return await this.executeChangeBackgroundColor(toolCall.parameters);

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolCall.name}`,
        };
    }
  }

  /**
   * Execute changeBackgroundColor tool (frontend-delegated)
   */
  private async executeChangeBackgroundColor(parameters: Record<string, any>): Promise<ToolExecutionResult> {
    if (!this.frontendToolEmitter) {
      return {
        success: false,
        error: 'Frontend tool emitter not configured',
      };
    }

    try {
      const color = parameters.color;

      // Convert color names to hex if needed
      const hexColor = this.colorToHex(color);

      console.log('[TOOL] Delegating changeBackgroundColor to frontend:', hexColor);

      // Delegate to frontend
      const result = await this.frontendToolEmitter('changeBackgroundColor', { color: hexColor });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Convert color names to hex codes
   */
  private colorToHex(color: string): string {
    // If already hex, return as-is
    if (color.startsWith('#')) {
      return color;
    }

    // Common color name to hex mapping
    const colorMap: Record<string, string> = {
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#00FF00',
      'yellow': '#FFFF00',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'cyan': '#00FFFF',
      'black': '#000000',
      'white': '#FFFFFF',
      'gray': '#808080',
      'grey': '#808080',
      'dark': '#1a1a1a',
      'light': '#f5f5f5',
    };

    return colorMap[color.toLowerCase()] || color;
  }
}

/**
 * Singleton instance
 */
export const toolRegistry = new ToolRegistry();
