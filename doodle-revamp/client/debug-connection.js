#!/usr/bin/env node

/**
 * Debug Connection Test
 * Tests the exact same connection pattern as the UI
 */

const { io } = require('socket.io-client');

console.log('🔍 Debug: Testing Frontend-Backend Connection');
console.log('============================================');

const SERVER_URL = 'http://localhost:3001';
const TEST_PLAYER_NAME = 'DebugUser';

// Test the exact same flow as the UI
function testUIConnection() {
  console.log('\n🎯 Testing UI Connection Flow');
  console.log('Server URL:', SERVER_URL);
  console.log('Player Name:', TEST_PLAYER_NAME);
  
  const socket = io(SERVER_URL, {
    autoConnect: false,
    timeout: 10000,
    reconnection: false,
    forceNew: true
  });
  
  let isResolved = false;
  
  // Set up timeout
  const timeout = setTimeout(() => {
    if (!isResolved) {
      console.log('❌ Connection timeout (10 seconds)');
      socket.disconnect();
      process.exit(1);
    }
  }, 10000);
  
  // Connection events
  socket.on('connect', () => {
    console.log('✅ Socket connected successfully');
    console.log('Socket ID:', socket.id);
    
    // Send create room request
    console.log('📤 Sending create-room request...');
    socket.emit('create-room', { playerName: TEST_PLAYER_NAME });
  });
  
  socket.on('room-created', (data) => {
    console.log('✅ Room created successfully!');
    console.log('Room Code:', data.roomCode);
    console.log('Game State:', JSON.stringify(data.gameState, null, 2));
    
    isResolved = true;
    clearTimeout(timeout);
    socket.disconnect();
    
    console.log('\n🎉 SUCCESS: UI connection flow is working correctly!');
    console.log('The issue must be in the frontend error handling or display.');
    process.exit(0);
  });
  
  socket.on('connect_error', (error) => {
    console.log('❌ Connection error:', error.message);
    console.log('Error details:', error);
    
    isResolved = true;
    clearTimeout(timeout);
    process.exit(1);
  });
  
  socket.on('error', (error) => {
    console.log('❌ Socket error:', error);
    
    isResolved = true;
    clearTimeout(timeout);
    socket.disconnect();
    process.exit(1);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });
  
  // Start connection
  console.log('🔌 Connecting to server...');
  socket.connect();
}

// Additional server connectivity test
async function testServerConnectivity() {
  console.log('\n🌐 Testing Server Connectivity');
  console.log('------------------------------');
  
  try {
    const http = require('http');
    const url = require('url');
    
    const serverUrl = url.parse(SERVER_URL);
    
    return new Promise((resolve, reject) => {
      const request = http.request({
        hostname: serverUrl.hostname,
        port: serverUrl.port,
        path: '/socket.io/',
        method: 'GET',
        timeout: 5000
      }, (response) => {
        console.log('✅ Server is reachable');
        console.log('Status:', response.statusCode);
        console.log('Headers:', response.headers);
        resolve(true);
      });
      
      request.on('timeout', () => {
        console.log('❌ Server connection timed out');
        reject(new Error('Timeout'));
      });
      
      request.on('error', (error) => {
        console.log('❌ Server unreachable:', error.message);
        reject(error);
      });
      
      request.end();
    });
    
  } catch (error) {
    console.log('❌ Connectivity test failed:', error.message);
    return false;
  }
}

// Run tests
async function runDebugTests() {
  try {
    console.log('Starting debug tests...\n');
    
    // Test 1: Basic server connectivity
    await testServerConnectivity();
    
    // Test 2: Socket.io connection flow
    testUIConnection();
    
  } catch (error) {
    console.log('\n💥 Debug test failed:', error.message);
    console.log('\n🔧 TROUBLESHOOTING SUGGESTIONS:');
    console.log('1. Check if backend server is running: lsof -ti:3001');
    console.log('2. Check server logs for errors');
    console.log('3. Verify REACT_APP_SERVER_URL environment variable');
    console.log('4. Check browser console for specific error messages');
    process.exit(1);
  }
}

runDebugTests();