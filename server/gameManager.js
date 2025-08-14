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
   * Handle play again request
   */
  async handlePlayAgain(roomCode, playerId) {
    console.log(`🔄 [MANAGER] handlePlayAgain called for room ${roomCode}, player ${playerId}`);
    
    const room = this.rooms.get(roomCode);
    if (!room) {
      console.error(`🔄 [MANAGER] Room ${roomCode} not found`);
      throw new Error('Room not found');
    }
    
    if (room.gamePhase !== 'results') {
      console.error(`🔄 [MANAGER] Room ${roomCode} not in results phase, current phase: ${room.gamePhase}`);
      throw new Error('Can only play again from results screen');
    }
    
    if (!room.hasPlayer(playerId)) {
      console.error(`🔄 [MANAGER] Player ${playerId} not found in room ${roomCode}`);
      throw new Error('Player not in room');
    }
    
    // Initialize play again tracking if not exists
    if (!room.playAgainRequests) {
      console.log(`🔄 [MANAGER] Initializing play-again tracking for room ${roomCode}`);
      room.playAgainRequests = new Set();
      room.playAgainTimeout = setTimeout(() => {
        // Auto-cleanup after 2 minutes if not enough players want to play again
        console.log(`🔄 [MANAGER] Auto-cleanup timeout reached for room ${roomCode}`);
        this.cleanupPlayAgainSession(roomCode);
      }, 120000); // 2 minutes
    }
    
    // Add player to play again requests
    room.playAgainRequests.add(playerId);
    const playerName = room.players.get(playerId)?.name || 'Unknown';
    
    console.log(`🔄 [MANAGER] Player ${playerName} (${playerId}) wants to play again in room ${roomCode}`);
    console.log(`🔄 [MANAGER] Play-again status: ${room.playAgainRequests.size}/${room.players.size} players ready`);
    console.log(`🔄 [MANAGER] Players who want to play again:`, Array.from(room.playAgainRequests).map(id => room.players.get(id)?.name || id));
    
    const playersNeeded = Math.max(2, Math.ceil(room.players.size / 2));
    console.log(`🔄 [MANAGER] Need ${playersNeeded} players to start new game`);
    
    // Check if we have enough players (at least 2) to start a new game
    if (room.playAgainRequests.size >= 2 && room.playAgainRequests.size >= playersNeeded) {
      console.log(`🔄 [MANAGER] Enough players ready! Creating new room...`);
      return await this.createPlayAgainRoom(roomCode);
    }
    
    // Return current state - waiting for more players
    console.log(`🔄 [MANAGER] Still waiting for more players...`);
    return {
      waiting: true,
      playersReady: room.playAgainRequests.size,
      totalPlayers: room.players.size,
      playersNeeded: playersNeeded
    };
  }
  
  /**
   * Create a new room for play again session
   */
  async createPlayAgainRoom(originalRoomCode) {
    console.log(`🔄 [MANAGER] createPlayAgainRoom called for ${originalRoomCode}`);
    
    const originalRoom = this.rooms.get(originalRoomCode);
    if (!originalRoom) {
      console.error(`🔄 [MANAGER] Original room ${originalRoomCode} not found`);
      throw new Error('Original room not found');
    }
    
    // Determine new host - prefer original host if they want to play again, otherwise pick first player
    let newHostId = null;
    const originalHostId = originalRoom.hostId;
    const originalHostName = originalRoom.players.get(originalHostId)?.name || 'Unknown';
    
    console.log(`🔄 [MANAGER] Original host: ${originalHostName} (${originalHostId})`);
    console.log(`🔄 [MANAGER] Original host wants to play again: ${originalRoom.playAgainRequests.has(originalHostId)}`);
    
    if (originalRoom.playAgainRequests.has(originalHostId)) {
      newHostId = originalHostId;
      console.log(`🔄 [MANAGER] Original host will remain host`);
    } else {
      // Pick first player who wants to play again as new host
      newHostId = Array.from(originalRoom.playAgainRequests)[0];
      const newHostName = originalRoom.players.get(newHostId)?.name || 'Unknown';
      console.log(`🔄 [MANAGER] New host will be: ${newHostName} (${newHostId})`);
    }
    
    const newHostPlayer = originalRoom.players.get(newHostId);
    if (!newHostPlayer) {
      console.error(`🔄 [MANAGER] New host player not found: ${newHostId}`);
      throw new Error('New host player not found');
    }
    
    // Create new room
    const newRoomCode = generateRoomCode();
    console.log(`🔄 [MANAGER] Creating new room: ${newRoomCode}`);
    
    const newGameRoom = new GameRoom(newRoomCode, newHostId);
    
    // Set up timer expired callback
    newGameRoom.setTimerExpiredCallback(() => {
      this.handleDrawingTimerExpired(newRoomCode);
    });
    
    // Add all players who want to play again
    const playersToAdd = [];
    console.log(`🔄 [MANAGER] Adding players to new room...`);
    
    for (const playerId of originalRoom.playAgainRequests) {
      const player = originalRoom.players.get(playerId);
      if (player) {
        const isHost = playerId === newHostId;
        console.log(`🔄 [MANAGER] Adding player: ${player.name} (${playerId}), isHost: ${isHost}`);
        
        try {
          newGameRoom.addPlayer(playerId, player.name, isHost);
          this.playerRooms.set(playerId, newRoomCode);
          playersToAdd.push({
            id: playerId,
            name: player.name,
            isHost
          });
        } catch (error) {
          console.error(`🔄 [MANAGER] Error adding player ${player.name}:`, error);
        }
      } else {
        console.warn(`🔄 [MANAGER] Player ${playerId} not found in original room`);
      }
    }
    
    this.rooms.set(newRoomCode, newGameRoom);
    
    console.log(`🔄 [MANAGER] Successfully created new play-again room ${newRoomCode} with ${playersToAdd.length} players`);
    console.log(`🔄 [MANAGER] New host: ${newHostPlayer.name} (${newHostId})`);
    console.log(`🔄 [MANAGER] Players in new room:`, playersToAdd.map(p => `${p.name} (host: ${p.isHost})`));
    
    // Clean up original room's play again session
    this.cleanupPlayAgainSession(originalRoomCode);
    
    return {
      success: true,
      newRoomCode,
      gameState: newGameRoom.getGameState(),
      playersJoined: playersToAdd,
      newHost: {
        id: newHostId,
        name: newHostPlayer.name
      }
    };
  }
  
  /**
   * Clean up play again session
   */
  cleanupPlayAgainSession(roomCode) {
    const room = this.rooms.get(roomCode);
    if (room && room.playAgainTimeout) {
      clearTimeout(room.playAgainTimeout);
      delete room.playAgainTimeout;
      delete room.playAgainRequests;
      console.log(`🔄 Cleaned up play-again session for room ${roomCode}`);
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
      // Clean up play again session if exists
      this.cleanupPlayAgainSession(roomCode);
      
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