// Test script to debug tiebreaker functionality
const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3002';

async function testTiebreaker() {
  console.log('🧪 Starting tiebreaker test...');
  
  // Create two socket connections
  const player1 = io(SERVER_URL);
  const player2 = io(SERVER_URL);
  
  let roomCode = null;
  let wordOptions = [];
  
  // Player 1 hosts the game
  player1.on('connect', () => {
    console.log('👤 Player 1 connected');
    player1.emit('create-room', { playerName: 'TestPlayer1' });
  });
  
  player1.on('room-created', (data) => {
    roomCode = data.roomCode;
    console.log('🏠 Room created:', roomCode);
    
    // Player 2 joins
    player2.emit('join-room', { roomCode, playerName: 'TestPlayer2' });
  });
  
  player2.on('connect', () => {
    console.log('👤 Player 2 connected');
  });
  
  player2.on('room-joined', () => {
    console.log('✅ Player 2 joined room');
    
    // Start voting
    setTimeout(() => {
      console.log('🗳️ Starting voting...');
      player1.emit('start-voting', { roomCode });
    }, 1000);
  });
  
  // Both players listen for voting started
  player1.on('voting-started', (data) => {
    console.log('🗳️ Voting started, options:', data.gameState.wordOptions);
    wordOptions = data.gameState.wordOptions;
    
    // Both players vote for the same word to create a tie
    if (wordOptions.length >= 2) {
      console.log('👤 Player 1 voting for:', wordOptions[0]);
      player1.emit('vote-word', { roomCode, word: wordOptions[0] });
      
      console.log('👤 Player 2 voting for:', wordOptions[1]);
      player2.emit('vote-word', { roomCode, word: wordOptions[1] });
    }
  });
  
  player2.on('voting-started', (data) => {
    console.log('🗳️ Player 2 received voting started');
  });
  
  // Listen for vote updates
  player1.on('vote-updated', (data) => {
    console.log('📊 Vote updated:', data.gameState.voteCounts);
  });
  
  // Listen for tiebreaker detection
  player1.on('tiebreaker-started', (data) => {
    console.log('🎲 TIEBREAKER DETECTED!', data);
    console.log('⏱️ Waiting for automatic resolution...');
  });
  
  player2.on('tiebreaker-started', (data) => {
    console.log('🎲 Player 2 received tiebreaker detection!', data);
  });

  // Listen for automatic tiebreaker resolution
  player1.on('tiebreaker-resolved', (data) => {
    console.log('🎲 TIEBREAKER AUTO-RESOLVED!', data);
    console.log('🎯 System chose:', data.chosenWord, 'from tied words:', data.tiedWords);
  });
  
  player2.on('tiebreaker-resolved', (data) => {
    console.log('🎲 Player 2 received tiebreaker resolution!', data);
  });
  
  // Listen for drawing started
  player1.on('drawing-started', (data) => {
    console.log('🎨 Drawing started with word:', data.gameState.chosenWord);
    
    // End test
    setTimeout(() => {
      console.log('✅ Test completed');
      player1.disconnect();
      player2.disconnect();
      process.exit(0);
    }, 2000);
  });
  
  // Error handling
  player1.on('error', (error) => {
    console.error('❌ Player 1 error:', error);
  });
  
  player2.on('error', (error) => {
    console.error('❌ Player 2 error:', error);
  });
}

testTiebreaker().catch(console.error);