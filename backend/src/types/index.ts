/**
 * Shared TypeScript type definitions
 */

/**
 * Socket.io event types
 */
export interface SocketEvents {
  // Client -> Server
  'user-message': (data: { message: string }) => void;
  'get-history': () => void;
  'clear-history': () => void;

  // Server -> Client
  'connected': (data: { message: string; agentInfo: any }) => void;
  'agent-processing': (data: { status: string }) => void;
  'agent-response': (data: { message: string; timestamp: string }) => void;
  'agent-error': (data: { error: string; timestamp: string }) => void;
  'conversation-history': (data: { history: any[] }) => void;
  'history-cleared': (data: { message: string; timestamp: string }) => void;
}

/**
 * API response types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Agent status
 */
export interface AgentStatus {
  connected: boolean;
  model: string;
  provider: string;
  ready: boolean;
}

/**
 * Message type
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}
