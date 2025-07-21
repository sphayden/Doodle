require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const GameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Initialize game manager
const gameManager = new GameManager();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeRooms: gameManager.getActiveRoomsCount(),
    totalPlayers: gameManager.getTotalPlayersCount()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Room management
  socket.on('create-room', async (data) => {
    try {
      const { playerName } = data;
      const { roomCode, gameState } = await gameManager.createRoom(socket.id, playerName);
      
      socket.join(roomCode);
      socket.emit('room-created', { roomCode, gameState });
      
      console.log(`Room created: ${roomCode} by ${playerName}`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  socket.on('join-room', async (data) => {
    try {
      const { roomCode, playerName } = data;
      const gameState = await gameManager.joinRoom(roomCode, socket.id, playerName);
      
      socket.join(roomCode);
      socket.emit('room-joined', { roomCode, gameState });
      
      // Notify other players in room
      socket.to(roomCode).emit('player-joined', {
        playerId: socket.id,
        playerName,
        gameState
      });
      
      console.log(`${playerName} joined room: ${roomCode}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Game flow events
  socket.on('start-voting', async (data) => {
    try {
      const { roomCode } = data;
      const gameState = await gameManager.startVoting(roomCode, socket.id);
      
      io.to(roomCode).emit('voting-started', { gameState });
      console.log(`Voting started in room: ${roomCode}`);
    } catch (error) {
      console.error('Error starting voting:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('vote-word', async (data) => {
    try {
      const { roomCode, word } = data;
      const result = await gameManager.voteForWord(roomCode, socket.id, word);
      
      io.to(roomCode).emit('vote-updated', { gameState: result });
      
      // Check if there's a tiebreaker that needs to be shown
      if (result.tiebreaker && result.tiebreaker.isTie) {
        console.log(`Tiebreaker detected in room: ${roomCode}, tied words:`, result.tiebreaker.tiedWords);
        io.to(roomCode).emit('tiebreaker-started', { 
          tiedWords: result.tiebreaker.tiedWords,
          maxVotes: result.tiebreaker.maxVotes
        });
        
        // Auto-resolve after 3 seconds for visual feedback
        setTimeout(async () => {
          try {
            const resolvedResult = await gameManager.autoResolveTiebreaker(roomCode);
            console.log(`Tiebreaker auto-resolved in room: ${roomCode}, chose: ${resolvedResult.tiebreaker.chosenWord} from`, resolvedResult.tiebreaker.tiedWords);
            
            io.to(roomCode).emit('tiebreaker-resolved', { 
              tiedWords: resolvedResult.tiebreaker.tiedWords,
              chosenWord: resolvedResult.tiebreaker.chosenWord,
              maxVotes: resolvedResult.tiebreaker.maxVotes
            });
            
            // Start drawing after another short delay
            setTimeout(() => {
              io.to(roomCode).emit('drawing-started', { gameState: resolvedResult });
              console.log(`Drawing phase started in room: ${roomCode}, word: ${resolvedResult.chosenWord}`);
            }, 1500);
            
          } catch (error) {
            console.error('Error auto-resolving tiebreaker:', error);
          }
        }, 3000);
      }
      // Check if voting is complete and drawing started (no tie)
      else if (result.gamePhase === 'drawing') {
        io.to(roomCode).emit('drawing-started', { gameState: result });
        console.log(`Drawing phase started in room: ${roomCode}, word: ${result.chosenWord}`);
      }
    } catch (error) {
      console.error('Error voting for word:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Handle tiebreaker resolution
  socket.on('resolve-tiebreaker', async (data) => {
    try {
      const { roomCode, chosenWord } = data;
      const gameState = await gameManager.resolveTiebreaker(roomCode, socket.id, chosenWord);
      
      io.to(roomCode).emit('drawing-started', { gameState });
      console.log(`Tiebreaker resolved in room: ${roomCode}, chosen word: ${chosenWord}`);
    } catch (error) {
      console.error('Error resolving tiebreaker:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('submit-drawing', async (data) => {
    try {
      const { roomCode, canvasData } = data;
      const gameState = await gameManager.submitDrawing(roomCode, socket.id, canvasData);
      
      io.to(roomCode).emit('drawing-submitted', { 
        playerId: socket.id,
        gameState 
      });
      
      // Check if all drawings submitted
      if (gameState.gamePhase === 'judging') {
        console.log(`All drawings submitted in room: ${roomCode}, starting AI judging...`);
        
        // Start AI judging (async)
        gameManager.startAIJudging(roomCode)
          .then((finalGameState) => {
            io.to(roomCode).emit('judging-complete', { gameState: finalGameState });
            console.log(`AI judging complete in room: ${roomCode}`);
          })
          .catch((error) => {
            console.error('AI judging error:', error);
            io.to(roomCode).emit('error', { message: 'AI judging failed' });
          });
      }
    } catch (error) {
      console.error('Error submitting drawing:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Real-time drawing strokes (optional spectating)
  socket.on('drawing-stroke', (data) => {
    const { roomCode, strokeData } = data;
    socket.to(roomCode).emit('real-time-stroke', {
      playerId: socket.id,
      strokeData
    });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    gameManager.handlePlayerDisconnect(socket.id, (roomCode, gameState) => {
      if (roomCode && gameState) {
        io.to(roomCode).emit('player-left', { 
          playerId: socket.id,
          gameState 
        });
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Doodle server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🎨 OpenAI API: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});