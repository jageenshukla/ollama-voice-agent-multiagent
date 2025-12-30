/**
 * Main Backend Server
 * Express + Socket.io server with Voice Agent integration
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { envConfig } from './config/env.js';
import { voiceAgent } from './agent/voice-agent.js';
import { responsePipeline } from './pipeline/response-pipeline.js';

// Create Express app
const app = express();
const httpServer = createServer(app);

// Configure Socket.io
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*', // Allow all origins in development
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    agent: voiceAgent.getInfo(),
  });
});

/**
 * Agent info endpoint
 */
app.get('/api/agent/info', (req, res) => {
  res.json(voiceAgent.getInfo());
});

/**
 * Test agent endpoint
 */
app.post('/api/agent/test', async (req, res) => {
  try {
    const isConnected = await voiceAgent.testConnection();
    res.json({
      success: isConnected,
      message: isConnected ? 'Agent is connected and ready' : 'Agent connection failed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Socket.io connection handler
 */
io.on('connection', (socket) => {
  console.log('[SERVER] Client connected:', socket.id);

  // Send connection confirmation
  socket.emit('connected', {
    message: 'Connected to Pixel - Your AI Companion',
    agentInfo: voiceAgent.getInfo(),
  });

  // Map to track pending tool executions
  const pendingToolExecutions = new Map<string, {
    resolve: (result: any) => void;
    reject: (error: any) => void;
  }>();

  // Setup frontend tool emitter for this socket
  voiceAgent.setFrontendToolEmitter(async (toolName: string, parameters: Record<string, any>) => {
    console.log('[SERVER] Requesting frontend tool execution:', toolName, parameters);

    return new Promise((resolve, reject) => {
      const executionId = `${socket.id}-${Date.now()}`;

      // Store promise resolvers
      pendingToolExecutions.set(executionId, { resolve, reject });

      // Emit tool execution request to frontend
      socket.emit('execute-tool', {
        executionId,
        toolName,
        parameters,
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (pendingToolExecutions.has(executionId)) {
          pendingToolExecutions.delete(executionId);
          reject(new Error('Tool execution timeout'));
        }
      }, 10000);
    });
  });

  // Handle tool result from frontend
  socket.on('tool-result', (data: { executionId: string; success: boolean; result?: any; error?: string }) => {
    console.log('[SERVER] Received tool result:', data);

    const pending = pendingToolExecutions.get(data.executionId);
    if (pending) {
      pendingToolExecutions.delete(data.executionId);

      if (data.success) {
        pending.resolve({
          success: true,
          result: data.result,
        });
      } else {
        pending.reject(new Error(data.error || 'Tool execution failed'));
      }
    }
  });

  /**
   * Handle user message
   */
  socket.on('user-message', async (data: { message: string }) => {
    try {
      const { message } = data;
      console.log('[SERVER] Received message from', socket.id, ':', message);

      // Emit processing status
      socket.emit('agent-processing', { status: 'Processing your message...' });

      // Process message through complete pipeline (agent + TTS)
      const pipelineResponse = await responsePipeline.process(message);

      // Emit agent response with TTS data
      socket.emit('agent-response', {
        displayText: pipelineResponse.displayText,  // Text with emojis for display
        speechText: pipelineResponse.speechText,    // Text without emojis for TTS
        tts: pipelineResponse.tts,
        timestamp: pipelineResponse.timestamp,
        processingTimeMs: pipelineResponse.processingTimeMs,
      });

      console.log('[SERVER] Sent response to', socket.id, '- Processing time:', pipelineResponse.processingTimeMs, 'ms');
    } catch (error) {
      console.error('[SERVER] Error processing message:', error);

      socket.emit('agent-error', {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Handle conversation history request
   */
  socket.on('get-history', () => {
    const history = voiceAgent.getHistory();
    socket.emit('conversation-history', { history });
  });

  /**
   * Handle clear history request
   */
  socket.on('clear-history', () => {
    voiceAgent.clearHistory();
    socket.emit('history-cleared', {
      message: 'Conversation history cleared',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Handle disconnect
   */
  socket.on('disconnect', () => {
    console.log('[SERVER] Client disconnected:', socket.id);
  });
});

/**
 * Start server
 */
async function startServer() {
  try {
    console.log('\n🚀 Starting Voice AI Agent Server...\n');

    // Test agent connection
    console.log('Testing agent connection...');
    const isConnected = await voiceAgent.testConnection();

    if (!isConnected) {
      console.error('❌ Failed to connect to AI model');
      console.error('   Make sure Ollama is running: ollama serve');
      console.error(`   Model loaded: ollama run ${envConfig.ollamaModel}`);
      process.exit(1);
    }

    console.log('✅ Agent connection successful\n');

    // Start HTTP server
    httpServer.listen(envConfig.port, () => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🎙️  Voice AI Agent Server Running');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`   HTTP Server:  http://localhost:${envConfig.port}`);
      console.log(`   Health Check: http://localhost:${envConfig.port}/health`);
      console.log(`   WebSocket:    ws://localhost:${envConfig.port}`);
      console.log('');
      console.log('   Model Provider:', envConfig.modelProvider.toUpperCase());
      console.log('   Model:', envConfig.ollamaModel);
      console.log('═══════════════════════════════════════════════════════');
      console.log('\n✅ Ready for connections!\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('\n⏳ Shutting down server...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⏳ Shutting down server...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();
