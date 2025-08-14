const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const GameManager = require('./gameManager');
const { getConfig, validateConfig, logCurrentConfig } = require('./config/environment');
const logger = require('./utils/logger');
const metricsCollector = require('./utils/metrics');

// Initialize configuration
const config = getConfig();

// Validate configuration
const configValidation = validateConfig();
if (!configValidation.isValid) {
  logger.error('Configuration validation failed', 'CONFIG', { errors: configValidation.errors });
  process.exit(1);
}

// Log configuration in development
logCurrentConfig();
logger.info('Server starting up', 'SYSTEM', { environment: config.environment });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: config.corsOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Performance monitoring middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.logAccess(req, res, responseTime);
    
    // Record metrics
    metricsCollector.recordRequest(responseTime, res.statusCode);
    
    // Log slow requests
    if (responseTime > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.url}`, 'PERFORMANCE', {
        responseTime,
        statusCode: res.statusCode
      });
    }
  });
  
  next();
});

// Middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));
app.use(express.json());

// Serve React build files in production (static files only here)
if (config.environment === 'production') {
  const path = require('path');
  const buildPath = path.join(__dirname, '../doodle-revamp/client/build');
  
  // Serve static files
  app.use(express.static(buildPath));
}

// Initialize game manager
const gameManager = new GameManager();

// Set up timer callbacks
gameManager.setTimerCallbacks({
  onTimerExpired: (roomCode, gameState) => {
    console.log(`⏰ Timer expired for room: ${roomCode}, notifying clients`);
    io.to(roomCode).emit('drawing-time-expired', { gameState });
  },
  onJudgingComplete: (roomCode, gameState) => {
    console.log(`🤖 AI judging complete for room: ${roomCode}`);
    io.to(roomCode).emit('judging-complete', { gameState });
  },
  onJudgingError: (roomCode, error) => {
    console.error(`❌ AI judging error for room: ${roomCode}:`, error);
    io.to(roomCode).emit('error', { message: 'AI judging failed' });
  }
});

// Health check endpoint with detailed metrics
app.get('/health', (req, res) => {
  try {
    // Update game metrics
    metricsCollector.updateGameMetrics(gameManager);
    
    const healthStatus = metricsCollector.getHealthStatus();
    const gameStats = {
      activeRooms: gameManager.getActiveRoomsCount(),
      totalPlayers: gameManager.getTotalPlayersCount()
    };
    
    res.json({
      status: healthStatus.status,
      timestamp: healthStatus.timestamp,
      uptime: healthStatus.uptime,
      ...gameStats,
      system: healthStatus.system,
      performance: healthStatus.performance,
      alerts: healthStatus.alerts
    });
  } catch (error) {
    logger.error('Health check failed', 'HEALTH', { error: error.message });
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Detailed metrics endpoint
app.get('/metrics', (req, res) => {
  try {
    // Update game metrics
    metricsCollector.updateGameMetrics(gameManager);
    
    const metrics = metricsCollector.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Metrics endpoint failed', 'METRICS', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve metrics'
    });
  }
});

// System status endpoint
app.get('/status', (req, res) => {
  try {
    const status = {
      server: {
        environment: config.environment,
        uptime: Math.round((Date.now() - Date.now()) / 1000),
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version
      },
      game: {
        activeRooms: gameManager.getActiveRoomsCount(),
        totalPlayers: gameManager.getTotalPlayersCount(),
        maxRooms: config.maxRooms,
        maxPlayersPerRoom: config.maxPlayersPerRoom
      },
      features: {
        aiJudging: config.enableAiJudging,
        metrics: config.enableMetrics,
        rateLimiting: config.enableRateLimiting,
        compression: config.enableCompression
      }
    };
    
    res.json(status);
  } catch (error) {
    logger.error('Status endpoint failed', 'STATUS', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve status'
    });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Record connection metrics
  metricsCollector.recordConnection();
  logger.networkEvent('connection', socket.id);

  // Handle batched messages from client
  socket.on('batch-messages', (data) => {
    console.log(`📦 Received batched messages from ${socket.id}:`, data.messages?.length || 0);
    
    if (data.messages && Array.isArray(data.messages)) {
      // Process each message in the batch
      data.messages.forEach((msg) => {
        if (msg.type && msg.data) {
          // Re-emit each message as if it came individually
          socket.emit(msg.type, msg.data);
        }
      });
    }
  });

  // Room management
  socket.on('create-room', async (data) => {
    console.log(`🎮 Create room request from ${socket.id}:`, data);
    try {
      const { playerName } = data;
      console.log(`📝 Creating room for player: ${playerName}`);
      
      const { roomCode, gameState } = await gameManager.createRoom(socket.id, playerName);
      console.log(`✅ Room created successfully: ${roomCode}`);
      
      socket.join(roomCode);
      socket.emit('room-created', { roomCode, gameState });
      
      console.log(`🏠 Room ${roomCode} created by ${playerName}, game state:`, gameState);
    } catch (error) {
      console.error('❌ Error creating room:', error.message);
      console.error('Full error:', error);
      socket.emit('error', { message: error.message || 'Failed to create room' });
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
            console.log(`🎲 [SERVER] Starting auto-resolve for room: ${roomCode} after 3 second delay`);
            const resolvedResult = await gameManager.autoResolveTiebreaker(roomCode);
            console.log(`Tiebreaker auto-resolved in room: ${roomCode}, chose: ${resolvedResult.tiebreaker.chosenWord} from`, resolvedResult.tiebreaker.tiedWords);
            
            io.to(roomCode).emit('tiebreaker-resolved', { 
              tiedWords: resolvedResult.tiebreaker.tiedWords,
              chosenWord: resolvedResult.tiebreaker.chosenWord,
              maxVotes: resolvedResult.tiebreaker.maxVotes
            });
            
            // Wait for client to signal tiebreaker animation completion
            // Fallback timeout in case client doesn't respond
            const fallbackTimeout = setTimeout(() => {
              io.to(roomCode).emit('drawing-started', { gameState: resolvedResult });
              console.log(`Drawing phase started in room: ${roomCode} (fallback timeout), word: ${resolvedResult.chosenWord}`);
            }, 8000); // 8 second fallback
            
            // Store the timeout so we can clear it when client responds
            if (!global.tiebreakerTimeouts) global.tiebreakerTimeouts = new Map();
            global.tiebreakerTimeouts.set(roomCode, { timeout: fallbackTimeout, gameState: resolvedResult });
            
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

  // Handle tiebreaker animation completion from client
  socket.on('tiebreaker-animation-complete', async (data) => {
    try {
      const { roomCode } = data;
      console.log(`🎲 Tiebreaker animation completed in room: ${roomCode} from socket: ${socket.id}`);
      
      // Check if we have a pending drawing start for this room
      if (global.tiebreakerTimeouts && global.tiebreakerTimeouts.has(roomCode)) {
        const { timeout, gameState } = global.tiebreakerTimeouts.get(roomCode);
        
        // Clear the fallback timeout
        clearTimeout(timeout);
        global.tiebreakerTimeouts.delete(roomCode);
        
        // Start drawing phase now
        io.to(roomCode).emit('drawing-started', { gameState });
        console.log(`Drawing phase started in room: ${roomCode} (client-triggered), word: ${gameState.chosenWord}`);
      } else {
        console.log(`🎲 No pending tiebreaker timeout found for room: ${roomCode}`);
        if (global.tiebreakerTimeouts) {
          console.log(`🎲 Available timeouts:`, Array.from(global.tiebreakerTimeouts.keys()));
        }
      }
    } catch (error) {
      console.error('Error handling tiebreaker animation completion:', error);
    }
  });

  // Note: Manual tiebreaker resolution removed - server now handles all tiebreakers automatically

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

  // Play again functionality
  socket.on('play-again', async (data) => {
    try {
      const { roomCode } = data;
      console.log(`🔄 Play again request from ${socket.id} in room ${roomCode}`);
      
      const result = await gameManager.handlePlayAgain(roomCode, socket.id);
      
      if (result.success) {
        // New room created - move players to new lobby
        const { newRoomCode, gameState, playersJoined, newHost } = result;
        
        // Remove players from old room and add to new room
        socket.leave(roomCode);
        socket.join(newRoomCode);
        
        // Notify this player they're in the new lobby
        socket.emit('play-again-lobby-created', {
          newRoomCode,
          gameState,
          newHost
        });
        
        // Notify other players who wanted to play again
        for (const player of playersJoined) {
          if (player.id !== socket.id) {
            const playerSocket = io.sockets.sockets.get(player.id);
            if (playerSocket && playerSocket.connected) {
              console.log(`🔄 Moving player ${player.name} (${player.id}) to new lobby ${newRoomCode}`);
              playerSocket.leave(roomCode);
              playerSocket.join(newRoomCode);
              playerSocket.emit('play-again-lobby-created', {
                newRoomCode,
                gameState,
                newHost
              });
            } else {
              console.warn(`🔄 Player ${player.name} (${player.id}) socket not found or disconnected`);
            }
          }
        }
        
        console.log(`🔄 Successfully created play-again lobby ${newRoomCode} with ${playersJoined.length} players`);
      } else {
        // Still waiting for more players
        socket.emit('play-again-waiting', result);
        
        // Notify other players in the room about the updated count
        socket.to(roomCode).emit('play-again-status-update', {
          playersReady: result.playersReady,
          totalPlayers: result.totalPlayers,
          playersNeeded: result.playersNeeded
        });
        
        console.log(`🔄 Play again waiting: ${result.playersReady}/${result.totalPlayers} players ready`);
      }
    } catch (error) {
      console.error('Error handling play again:', error);
      socket.emit('error', { message: error.message });
    }
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

// Catch-all handler for React Router (must be last)
if (config.environment === 'production') {
  const path = require('path');
  const buildPath = path.join(__dirname, '../doodle-revamp/client/build');
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

server.listen(config.port, config.host, () => {
  logger.info(`Server started on ${config.host}:${config.port}`, 'SYSTEM', {
    environment: config.environment,
    clientUrl: config.clientUrl,
    aiJudging: config.enableAiJudging,
    openaiConfigured: !!config.openaiApiKey,
    metricsEnabled: config.enableMetrics
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});