import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ttsManager } from './utils/tts';
import { sttManager } from './utils/stt';
import { AnimatedCharacter } from './components/AnimatedCharacter';
import type { CharacterState } from './components/AnimatedCharacter';
import './App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface TtsData {
  provider: string;
  method: string;
  text: string;
  metadata?: any;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [status, setStatus] = useState('Connecting...');
  const [characterState, setCharacterState] = useState<CharacterState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [sttSupported, setSttSupported] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check STT support
  useEffect(() => {
    setSttSupported(sttManager.isSupported());
    if (!sttManager.isSupported()) {
      console.warn('[APP] Speech recognition not supported');
    }
  }, []);

  // Initialize Socket.io connection
  useEffect(() => {
    console.log('[APP] Connecting to backend...');

    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('[APP] Connected to backend');
      setConnected(true);
      setStatus('Connected');
    });

    newSocket.on('connected', (data: { message: string; agentInfo: any }) => {
      console.log('[APP] Received connected event:', data);
      setStatus('Ready');
      setCharacterState('idle');
    });

    newSocket.on('disconnect', () => {
      console.log('[APP] Disconnected from backend');
      setConnected(false);
      setStatus('Disconnected');
      setCharacterState('idle');
    });

    newSocket.on('agent-processing', (data: { status: string }) => {
      console.log('[APP] Agent processing:', data.status);
      setStatus(data.status);
      setIsProcessing(true);
      setCharacterState('thinking');
    });

    newSocket.on('agent-response', (data: { displayText: string; speechText: string; tts: TtsData; timestamp: string; processingTimeMs: number }) => {
      console.log('[APP] Agent response:', data);

      // Add assistant message to history (with emojis for display)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.displayText,
        timestamp: data.timestamp,
      }]);

      // Speak the response if TTS is enabled (without emojis for speech)
      if (data.tts && data.tts.method === 'browser') {
        handleSpeak(data.speechText, data.tts.metadata);
      }

      setStatus(`Ready (${data.processingTimeMs}ms)`);
      setIsProcessing(false);
    });

    newSocket.on('agent-error', (data: { error: string; timestamp: string }) => {
      console.error('[APP] Agent error:', data);
      setStatus(`Error: ${data.error}`);
      setIsProcessing(false);
      setCharacterState('idle');
    });

    // Handle frontend tool execution requests
    newSocket.on('execute-tool', (data: { executionId: string; toolName: string; parameters: Record<string, any> }) => {
      console.log('[APP] Received tool execution request:', data);

      try {
        // Execute the tool based on tool name
        switch (data.toolName) {
          case 'changeBackgroundColor': {
            const color = data.parameters.color;
            console.log('[APP] Changing background color to:', color);

            // Change the background color on the .app div
            const appElement = document.querySelector('.app') as HTMLElement;
            if (appElement) {
              appElement.style.background = color;
            }

            // Send success result back to backend
            newSocket.emit('tool-result', {
              executionId: data.executionId,
              success: true,
              result: {
                message: `Background color changed to ${color}`,
                color,
              },
            });
            break;
          }

          default:
            // Unknown tool
            newSocket.emit('tool-result', {
              executionId: data.executionId,
              success: false,
              error: `Unknown tool: ${data.toolName}`,
            });
        }
      } catch (error) {
        // Execution failed
        newSocket.emit('tool-result', {
          executionId: data.executionId,
          success: false,
          error: error instanceof Error ? error.message : 'Tool execution failed',
        });
      }
    });

    setSocket(newSocket);

    return () => {
      console.log('[APP] Cleaning up socket connection');
      newSocket.close();
    };
  }, []);

  // Handle speaking text
  const handleSpeak = (text: string, metadata?: any) => {
    setCharacterState('speaking');

    ttsManager.speak(text, {
      rate: metadata?.rate || 1.0,
      pitch: metadata?.pitch || 1.0,
      volume: metadata?.volume || 1.0,
      onStart: () => {
        console.log('[APP] TTS started');
        setCharacterState('speaking');
      },
      onEnd: () => {
        console.log('[APP] TTS finished');
        setCharacterState('idle');
      },
      onError: (error) => {
        console.error('[APP] TTS error:', error);
        setCharacterState('idle');
      },
    });
  };

  // Handle sending message
  const handleSendMessage = (message: string) => {
    if (!message.trim() || !socket || !connected || isProcessing) {
      return;
    }

    console.log('[APP] Sending message:', message);

    // Add user message to history
    setMessages(prev => [...prev, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }]);

    // Send to backend
    socket.emit('user-message', { message });

    setInputMessage('');
    setVoiceTranscript('');
    setStatus('Processing...');
  };

  // Handle form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  // Handle character click (start/stop voice input)
  const handleCharacterClick = () => {
    if (!sttSupported) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      // Stop listening
      stopVoiceInput();
    } else {
      // Start listening
      startVoiceInput();
    }
  };

  // Start voice input
  const startVoiceInput = () => {
    if (isProcessing) {
      return;
    }

    console.log('[APP] Starting voice input...');
    setIsListening(true);
    setCharacterState('listening');
    setVoiceTranscript('');

    // Stop any ongoing speech
    ttsManager.stop();

    sttManager.startListening({
      continuous: false,
      interimResults: true,
      language: 'en-US',
      onStart: () => {
        console.log('[APP] Voice input started');
        setStatus('Listening...');
      },
      onResult: (transcript: string, isFinal: boolean) => {
        console.log('[APP] Transcript:', transcript, 'Final:', isFinal);
        setVoiceTranscript(transcript);

        if (isFinal) {
          // Send the final transcript
          handleSendMessage(transcript);
          setIsListening(false);
          setCharacterState('idle');
        }
      },
      onEnd: () => {
        console.log('[APP] Voice input ended');
        setIsListening(false);
        if (characterState === 'listening') {
          setCharacterState('idle');
        }
        setStatus('Ready');
      },
      onError: (error: Error) => {
        console.error('[APP] Voice input error:', error);
        setStatus(`Error: ${error.message}`);
        setIsListening(false);
        setCharacterState('idle');
      },
    });
  };

  // Stop voice input
  const stopVoiceInput = () => {
    console.log('[APP] Stopping voice input...');
    sttManager.stopListening();
    setIsListening(false);
    setCharacterState('idle');
  };

  // Handle stop speaking
  const handleStopSpeaking = () => {
    ttsManager.stop();
    setCharacterState('idle');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Meet Pixel - Your AI Companion</h1>
        <p>Powered by Google ADK + Gemma + Ollama</p>
      </header>

      <main className="app-main">
        <AnimatedCharacter
          state={characterState}
          onClick={sttSupported ? handleCharacterClick : undefined}
        />

        <div className="status">
          <p>
            Status: <span className={`status-text ${connected ? 'connected' : 'disconnected'}`}>
              {status}
            </span>
          </p>
          {characterState === 'speaking' && (
            <button onClick={handleStopSpeaking} className="stop-button">
              Stop Speaking
            </button>
          )}
          {isListening && (
            <button onClick={stopVoiceInput} className="stop-button">
              Stop Listening
            </button>
          )}
        </div>

        {voiceTranscript && (
          <div className="voice-transcript">
            <p className="transcript-label">You're saying:</p>
            <p className="transcript-text">{voiceTranscript}</p>
          </div>
        )}

        <div className="conversation-history">
          <h3>Conversation</h3>
          <div className="messages">
            {messages.length === 0 ? (
              <p className="system-message">
                {sttSupported
                  ? 'Click Pixel to talk, or type a message below to start chatting...'
                  : 'Type a message below to start chatting with Pixel...'}
              </p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="message-role">{msg.role === 'user' ? 'You' : 'Pixel'}</div>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="input-form">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={connected ? "Type your message or click Pixel to talk..." : "Connecting to Pixel..."}
            disabled={!connected || isProcessing || isListening}
            className="message-input"
          />
          <button
            type="submit"
            disabled={!connected || !inputMessage.trim() || isProcessing || isListening}
            className="send-button"
          >
            {isProcessing ? 'Processing...' : 'Send'}
          </button>
        </form>
      </main>

      <footer className="app-footer">
        <p>Voice AI Demo • Built with Google ADK, Ollama & Gemma 2</p>
      </footer>
    </div>
  );
}

export default App;
