/**
 * Tool Definitions for Function Calling
 * Defines available tools that the AI agent can use
 */

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
}

/**
 * changeBackgroundColor tool
 * Frontend-controlled tool that changes the UI background color
 */
export const changeBackgroundColorTool: Tool = {
  type: 'function',
  function: {
    name: 'changeBackgroundColor',
    description: 'Changes the background color of the user interface to match what the user is currently requesting. IMPORTANT: Extract the color from the user\'s LATEST message, not from previous messages.',
    parameters: {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          description: 'The color name from the user\'s CURRENT request. Examples: if user says "I want blue", use "blue". If user says "change to red", use "red". If user says "make it green", use "green". ALWAYS use the color from the latest user message.',
        },
      },
      required: ['color'],
    },
  },
};

/**
 * All available tools
 */
export const availableTools: Tool[] = [
  changeBackgroundColorTool,
];
