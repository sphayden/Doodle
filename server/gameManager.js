const GameRoom = require('./gameRoom');
const { generateRoomCode } = require('./utils/roomCodeGenerator');
const { validatePlayerName, validateRoomCode } = require('./utils/validation');

class GameManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> GameRoom
    this.playerRooms = new Map(); // playerId -> roomCode
  }

  /**
   * Create a new game room
   */
  async createRoom(hostId, playerName) {
    validatePlayerName(playerName);
    
    const roomCode = generateRoomCode();
    const gameRoom = new GameRoom(roomCode, hostId);
    
    // Set up timer expired callback
    gameRoom.setTimerExpiredCallback(() => {
      this.handleDrawingTimerExpired(roomCode);
    });
    
    // Add host as first player
    gameRoom.addPlayer(hostId, playerName, true);
    
    this.rooms.set(roomCode, gameRoom);
    this.playerRooms.set(hostId, roomCode);
    
    return {
      roomCode,
      gameState: gameRoom.getGameState()
    };
  }

  /**
   * Join an existing room
   */
  async joinRoom(roomCode, playerId, playerName) {
    validateRoomCode(roomCode);
    validatePlayerName(playerName);
    
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }
    
    if (room.isFull()) {
      throw new Error('Room is full');
    }
    
    if (room.gamePhase !== 'lobby') {
      throw new Error('Game already in progress');
    }
    
    // Ensure timer callback is set (in case it wasn't set during creation)
    if (!room.onTimerExpired) {
      room.setTimerExpiredCallback(() => {
        this.handleDrawingTimerExpired(roomCode);
      });
    }
    
    room.addPlayer(playerId, playerName, false);
    this.playerRooms.set(playerId, roomCode);
    
    return room.getGameState();
  }

  /**
   * Start voting phase
   */
  async startVoting(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }
    
    if (!room.isHost(playerId)) {
      throw new Error('Only host can start voting');
    }
    
    if (room.players.size < 2) {
      throw new Error('Need at least 2 players to start');
    }
    
    room.startVoting();
    return room.getGameState();
  }

  /**
   * Vote for a word
   */
  async voteForWord(roomCode, playerId, word) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }
    
    if (!room.hasPlayer(playerId)) {
      throw new Error('Player not in room');
    }
    
    room.voteForWord(playerId, word);
    
    // Check if voting is complete
    if (room.isVotingComplete()) {
      console.log('🗺️ [MANAGER] Voting complete! Checking for tie...');
      const tieResult = room.checkForTie();
      
      if (tieResult.isTie) {
        console.log('🎲 [MANAGER] TIE DETECTED! Tied words:', tieResult.tiedWords);
        
        // Return state showing tie detected (don't resolve immediately)
        return {
          ...room.getGameState(),
          tiebreaker: {
            isTie: true,
            tiedWords: tieResult.tiedWords,
            maxVotes: tieResult.maxVotes
          }
        };
      } else {
        console.log('✅ [MANAGER] No tie detected. Starting drawing immediately.');
        // No tie, start drawing immediately
        room.startDrawing();
      }
    }
    
    return room.getGameState();
  }

  // Manual tiebreaker resolution removed - server handles all tiebreakers automatically

  /**
   * Automatically resolve tiebreaker with random selection
   */
  async autoResolveTiebreaker(roomCode) {
    console.log(`🎲 [MANAGER] Auto-resolving tiebreaker for room: ${roomCode}`);
    console.log(`🎲 [MANAGER] Available rooms:`, Array.from(this.rooms.keys()));
    
    const room = this.rooms.get(roomCode);
    if (!room) {
      console.error(`🎲 [MANAGER] Room not found: ${roomCode}. Available rooms:`, Array.from(this.rooms.keys()));
      throw new Error('Room not found');
    }
    
    if (room.gamePhase !== 'voting') {
      throw new Error('Not in voting phase');
    }
    
    const tieResult = room.checkForTie();
    if (!tieResult.isTie) {
      throw new Error('No tie to resolve');
    }
    
    // Randomly choose one of the tied words
    const randomIndex = Math.floor(Math.random() * tieResult.tiedWords.length);
    const chosenWord = tieResult.tiedWords[randomIndex];
    console.log('🎯 [MANAGER] Auto-resolving tie. Randomly chosen word:', chosenWord);
    
    room.startDrawing(chosenWord);
    
    return {
      ...room.getGameState(),
      tiebreaker: {
        wasResolved: true,
        tiedWords: tieResult.tiedWords,
        chosenWord: chosenWord,
        maxVotes: tieResult.maxVotes
      }
    };
  }

  /**
   * Submit a drawing
   */
  async submitDrawing(roomCode, playerId, canvasData) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }
    
    if (!room.hasPlayer(playerId)) {
      throw new Error('Player not in room');
    }
    
    room.submitDrawing(playerId, canvasData);
    
    // Check if all drawings submitted
    if (room.areAllDrawingsSubmitted()) {
      room.startJudging();
    }
    
    return room.getGameState();
  }

  /**
   * Handle drawing timer expiration
   */
  async handleDrawingTimerExpired(roomCode) {
    console.log(`⏰ Drawing timer expired for room: ${roomCode}`);
    
    const room = this.rooms.get(roomCode);
    if (!room) {
      console.error(`Room not found when timer expired: ${roomCode}`);
      return;
    }
    
    if (room.gamePhase !== 'drawing') {
      console.error(`Room ${roomCode} not in drawing phase when timer expired, current phase: ${room.gamePhase}`);
      return;
    }
    
    // Notify clients that timer expired (they should auto-submit their current drawings)
    if (this.onTimerExpired) {
      this.onTimerExpired(roomCode, room.getGameState());
    }
    
    // Give clients 3 seconds to auto-submit their current drawings
    setTimeout(async () => {
      try {
        // Now transition to judging phase
        room.startJudging();
        
        // Auto-submit empty drawings for any players who still haven't submitted
        room.autoSubmitMissingDrawings();
        
        console.log(`🤖 Starting AI judging for room: ${roomCode} after timer expiration and auto-submit grace period`);
        const finalGameState = await this.startAIJudging(roomCode);
        
        // Notify that judging is complete
        if (this.onJudgingComplete) {
          this.onJudgingComplete(roomCode, finalGameState);
        }
      } catch (error) {
        console.error(`Error during AI judging for room ${roomCode}:`, error);
        if (this.onJudgingError) {
          this.onJudgingError(roomCode, error);
        }
      }
    }, 3000); // 3 second grace period for client auto-submit
  }

  /**
   * Set callbacks for timer events
   */
  setTimerCallbacks(callbacks) {
    this.onTimerExpired = callbacks.onTimerExpired;
    this.onJudgingComplete = callbacks.onJudgingComplete;
    this.onJudgingError = callbacks.onJudgingError;
  }

  /**
   * Start AI judging process
   */
  async startAIJudging(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }
    
    const results = await room.judgeDrawings();
    room.setResults(results);
    
    return room.getGameState();
  }

  /**
   * Handle player disconnect
   */
  handlePlayerDisconnect(playerId, callback) {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) {
      return;
    }
    
    const room = this.rooms.get(roomCode);
    if (!room) {
      return;
    }
    
    const wasHost = room.isHost(playerId);
    room.removePlayer(playerId);
    this.playerRooms.delete(playerId);
    
    // If room is empty or host left, clean up
    if (room.isEmpty() || wasHost) {
      this.cleanupRoom(roomCode);
      callback(roomCode, null); // Signal room closed
    } else {
      callback(roomCode, room.getGameState());
    }
  }

  /**
   * Clean up empty room
   */
  cleanupRoom(roomCode) {
    // Don't cleanup rooms that have pending tiebreaker timeouts
    if (global.tiebreakerTimeouts && global.tiebreakerTimeouts.has(roomCode)) {
      console.log(`🎲 [MANAGER] Delaying room cleanup for ${roomCode} - tiebreaker in progress`);
      return;
    }

    const room = this.rooms.get(roomCode);
    if (room) {
      // Remove all players from playerRooms map
      for (const playerId of room.players.keys()) {
        this.playerRooms.delete(playerId);
      }
      
      // Clean up any pending tiebreaker timeouts
      if (global.tiebreakerTimeouts && global.tiebreakerTimeouts.has(roomCode)) {
        const { timeout } = global.tiebreakerTimeouts.get(roomCode);
        clearTimeout(timeout);
        global.tiebreakerTimeouts.delete(roomCode);
        console.log(`🎲 [MANAGER] Cleared pending tiebreaker timeout for room: ${roomCode}`);
      }
      
      this.rooms.delete(roomCode);
      console.log(`Room cleaned up: ${roomCode}`);
    }
  }

  /**
   * Get statistics
   */
  getActiveRoomsCount() {
    return this.rooms.size;
  }

  getTotalPlayersCount() {
    return Array.from(this.rooms.values())
      .reduce((total, room) => total + room.players.size, 0);
  }

  /**
   * Get room by code (for debugging)
   */
  getRoom(roomCode) {
    return this.rooms.get(roomCode);
  }
}

module.exports = GameManager;