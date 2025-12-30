/**
 * Simple test script to verify agent is working
 */

import { voiceAgent } from './src/agent/voice-agent.js';

async function testAgent() {
  console.log('\n🧪 Testing Voice Agent...\n');

  try {
    // Test 1: Connection
    console.log('Test 1: Connection test');
    const isConnected = await voiceAgent.testConnection();
    console.log(`✅ Connection: ${isConnected ? 'SUCCESS' : 'FAILED'}\n`);

    if (!isConnected) {
      console.error('❌ Agent not connected. Exiting.');
      process.exit(1);
    }

    // Test 2: Process a simple message
    console.log('Test 2: Processing message "Hello, how are you?"');
    const response1 = await voiceAgent.processMessage('Hello, how are you?');
    console.log('✅ Response:', response1);
    console.log('');

    // Test 3: Process a follow-up message
    console.log('Test 3: Processing follow-up "What can you help me with?"');
    const response2 = await voiceAgent.processMessage('What can you help me with?');
    console.log('✅ Response:', response2);
    console.log('');

    // Test 4: Check conversation history
    console.log('Test 4: Checking conversation history');
    const history = voiceAgent.getHistory();
    console.log(`✅ History length: ${history.length} messages`);
    console.log('');

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ All tests passed!');
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAgent();
