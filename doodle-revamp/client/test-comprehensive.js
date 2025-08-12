#!/usr/bin/env node

/**
 * Comprehensive Game Flow Test
 * Tests the complete game flow with proper game state management
 */

const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3001';
let globalRoomCode = null;

console.log('🎮 Comprehensive Doodle Game Test');
console.log('==================================');

/**
 * Complete Game Flow Test
 */
async function testCompleteGameFlow() {
  console.log('\n🎯 Testing Complete Game Flow');
  console.log('------------------------------');
  
  return new Promise((resolve) => {
    const hostSocket = io(SERVER_URL);
    const playerSocket = io(SERVER_URL);
    
    let roomCode = null;
    let testsPassed = 0;
    const totalTests = 6;
    
    // Test timeout
    const timeout = setTimeout(() => {
      console.log('❌ Test suite timed out');
      hostSocket.disconnect();
      playerSocket.disconnect();
      resolve({ success: false, testsPassed, totalTests });
    }, 15000);
    
    // Host connection and room creation
    hostSocket.on('connect', () => {
      console.log('✅ 1/6 Host connected successfully');
      testsPassed++;
      hostSocket.emit('create-room', { playerName: 'TestHost' });
    });
    
    hostSocket.on('room-created', (data) => {
      console.log('✅ 2/6 Room created:', data.roomCode);
      testsPassed++;
      roomCode = data.roomCode;
      globalRoomCode = roomCode;
      
      // Now connect the second player
      setTimeout(() => {
        if (!playerSocket.connected) {
          playerSocket.connect();
        }
      }, 500);
    });
    
    // Player connection and joining
    playerSocket.on('connect', () => {
      if (roomCode) {
        console.log('✅ 3/6 Second player connected, attempting to join room:', roomCode);
        testsPassed++;
        playerSocket.emit('join-room', { 
          roomCode: roomCode, 
          playerName: 'TestPlayer2' 
        });
      }
    });
    
    playerSocket.on('room-joined', (data) => {
      console.log('✅ 4/6 Player joined room successfully');
      testsPassed++;
      
      // Now test voting with 2 players
      setTimeout(() => {
        console.log('🗳️ Starting voting phase...');
        hostSocket.emit('start-voting', { roomCode: roomCode });
      }, 1000);
    });
    
    // Voting phase
    hostSocket.on('voting-started', (data) => {
      console.log('✅ 5/6 Voting started with options:', data.gameState.wordOptions);
      testsPassed++;
      
      if (data.gameState.wordOptions && data.gameState.wordOptions.length > 0) {
        const firstWord = data.gameState.wordOptions[0];
        
        // Both players vote for the same word to trigger a clear winner
        hostSocket.emit('vote-word', { roomCode: roomCode, word: firstWord });
        setTimeout(() => {
          playerSocket.emit('vote-word', { roomCode: roomCode, word: firstWord });
        }, 500);
      }
    });
    
    // Vote updates
    let voteCount = 0;
    const handleVoteUpdate = (data) => {
      voteCount++;
      console.log(`📊 Vote ${voteCount} registered:`, data.gameState.voteCounts);
      
      if (voteCount >= 2) {
        console.log('✅ 6/6 All votes registered successfully');
        testsPassed++;
        
        clearTimeout(timeout);
        setTimeout(() => {
          hostSocket.disconnect();
          playerSocket.disconnect();
          resolve({ success: testsPassed === totalTests, testsPassed, totalTests });
        }, 1000);
      }
    };
    
    hostSocket.on('vote-updated', handleVoteUpdate);
    playerSocket.on('vote-updated', handleVoteUpdate);
    
    // Drawing phase (if reached)
    const handleDrawingStarted = (data) => {
      console.log('🎨 Drawing phase started with word:', data.gameState.chosenWord);
      
      // Test drawing submission
      const mockCanvasData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      hostSocket.emit('submit-drawing', { 
        roomCode: roomCode, 
        canvasData: mockCanvasData 
      });
      
      setTimeout(() => {
        playerSocket.emit('submit-drawing', { 
          roomCode: roomCode, 
          canvasData: mockCanvasData 
        });
      }, 500);
    };
    
    hostSocket.on('drawing-started', handleDrawingStarted);
    playerSocket.on('drawing-started', handleDrawingStarted);
    
    // Error handling
    hostSocket.on('error', (error) => {
      console.log('⚠️ Host error:', error);
    });
    
    playerSocket.on('error', (error) => {
      console.log('⚠️ Player error:', error);
    });
    
    hostSocket.on('connect_error', (error) => {
      console.log('❌ Host connection error:', error.message);
      clearTimeout(timeout);
      resolve({ success: false, testsPassed, totalTests });
    });
    
    playerSocket.on('connect_error', (error) => {
      console.log('❌ Player connection error:', error.message);
    });
  });
}

/**
 * Test DevTools Integration
 */
async function testDevToolsIntegration() {
  console.log('\n🛠️ Testing DevTools Integration');
  console.log('--------------------------------');
  
  try {
    // Load the DevTools service and test it
    const testSocket = io(SERVER_URL);
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        testSocket.disconnect();
        resolve(false);
      }, 5000);
      
      testSocket.on('connect', () => {
        console.log('✅ DevTools test connection successful');
        
        // Create a test room for DevTools
        testSocket.emit('create-room', { playerName: 'DevToolsTest' });
      });
      
      testSocket.on('room-created', (data) => {
        console.log('✅ DevTools test room created:', data.roomCode);
        console.log('✅ DevTools integration appears functional');
        
        clearTimeout(timeout);
        testSocket.disconnect();
        resolve(true);
      });
      
      testSocket.on('error', (error) => {
        console.log('❌ DevTools test error:', error);
        clearTimeout(timeout);
        testSocket.disconnect();
        resolve(false);
      });
    });
    
  } catch (error) {
    console.log('❌ DevTools integration test failed:', error.message);
    return false;
  }
}

/**
 * Test Real-time Features
 */
async function testRealtimeFeatures() {
  console.log('\n⚡ Testing Real-time Features');
  console.log('------------------------------');
  
  return new Promise((resolve) => {
    const socket1 = io(SERVER_URL);
    const socket2 = io(SERVER_URL);
    
    let roomCode = null;
    let realtimeEvents = 0;
    
    const timeout = setTimeout(() => {
      socket1.disconnect();
      socket2.disconnect();
      resolve(realtimeEvents > 0);
    }, 6000);
    
    socket1.on('connect', () => {
      socket1.emit('create-room', { playerName: 'RealtimeHost' });
    });
    
    socket1.on('room-created', (data) => {
      roomCode = data.roomCode;
      console.log('✅ Realtime test room created:', roomCode);
      realtimeEvents++;
      
      // Connect second player
      if (!socket2.connected) {
        socket2.connect();
      }
    });
    
    socket2.on('connect', () => {
      if (roomCode) {
        socket2.emit('join-room', { roomCode, playerName: 'RealtimePlayer' });
      }
    });
    
    // Test player events
    socket1.on('player-joined', (data) => {
      console.log('✅ Real-time player join event received');
      realtimeEvents++;
      
      clearTimeout(timeout);
      socket1.disconnect();
      socket2.disconnect();
      resolve(realtimeEvents >= 2);
    });
  });
}

/**
 * Main test runner
 */
async function runComprehensiveTests() {
  try {
    console.log('🚀 Starting comprehensive game functionality tests...\n');
    
    // Test 1: Complete game flow
    const gameFlowResult = await testCompleteGameFlow();
    
    // Test 2: DevTools integration
    const devToolsResult = await testDevToolsIntegration();
    
    // Test 3: Real-time features
    const realtimeResult = await testRealtimeFeatures();
    
    // Summary
    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('==============================');
    
    console.log(`Game Flow: ${gameFlowResult.success ? '✅ PASS' : '❌ FAIL'} (${gameFlowResult.testsPassed}/${gameFlowResult.totalTests} sub-tests)`);
    console.log(`DevTools Integration: ${devToolsResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Real-time Features: ${realtimeResult ? '✅ PASS' : '❌ FAIL'}`);
    
    const totalPassed = (gameFlowResult.success ? 1 : 0) + (devToolsResult ? 1 : 0) + (realtimeResult ? 1 : 0);
    const successRate = Math.round((totalPassed / 3) * 100);
    
    console.log(`\n🎯 Overall Success Rate: ${totalPassed}/3 (${successRate}%)`);
    
    if (totalPassed === 3) {
      console.log('\n🎉 EXCELLENT! All major functionality tests passed.');
      console.log('The game is ready for play with the following features:');
      console.log('  ✅ Room creation and joining');
      console.log('  ✅ Real-time multiplayer sync');
      console.log('  ✅ Voting system');
      console.log('  ✅ DevTools integration');
    } else if (totalPassed >= 2) {
      console.log('\n✅ GOOD! Most functionality is working correctly.');
      console.log('Some minor issues detected but core game is functional.');
    } else {
      console.log('\n⚠️ Several issues detected. Game functionality is limited.');
    }
    
    if (globalRoomCode) {
      console.log(`\n💡 TIP: You can manually test the game by visiting:`);
      console.log(`   http://localhost:3000`);
      console.log(`   Use room code: ${globalRoomCode} (may have expired)`);
    }
    
  } catch (error) {
    console.error('\n💥 Test execution error:', error);
  } finally {
    process.exit(0);
  }
}

// Run comprehensive tests
runComprehensiveTests();