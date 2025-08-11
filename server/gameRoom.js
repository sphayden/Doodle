const AIJudge = require('./aiJudge');
const WordManager = require('./wordManager');

class GameRoom {
  constructor(roomCode, hostId) {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.gamePhase = 'lobby'; // 'lobby', 'voting', 'drawing', 'judging', 'results'
    this.players = new Map(); // playerId -> Player object
    this.maxPlayers = parseInt(process.env.MAX_PLAYERS_PER_ROOM) || 8;
    this.drawingTimeLimit = parseInt(process.env.DRAWING_TIME_LIMIT) || 60;
    
    // Voting state
    this.wordOptions = [];
    this.votes = new Map(); // playerId -> word
    this.voteCounts = new Map(); // word -> count
    this.chosenWord = '';
    
    // Drawing state
    this.drawings = new Map(); // playerId -> canvas data
    this.timeRemaining = 0;
    this.drawingTimer = null;
    
    // Results state
    this.aiResults = [];
    
    this.aiJudge = new AIJudge();
    this.wordManager = new WordManager();
  }

  /**
   * Add player to room
   */
  addPlayer(playerId, playerName, isHost = false) {
    if (this.players.has(playerId)) {
      throw new Error('Player already in room');
    }
    
    if (this.isFull()) {
      throw new Error('Room is full');
    }
    
    const player = {
      id: playerId,
      name: playerName,
      isHost,
      ready: isHost, // Host is ready by default
      score: 0,
      hasVoted: false,
      hasSubmittedDrawing: false
    };
    
    this.players.set(playerId, player);
  }

  /**
   * Remove player from room
   */
  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) {
      return false;
    }
    
    // Clean up voting state
    if (this.votes.has(playerId)) {
      const votedWord = this.votes.get(playerId);
      this.votes.delete(playerId);
      
      const currentCount = this.voteCounts.get(votedWord) || 0;
      if (currentCount > 1) {
        this.voteCounts.set(votedWord, currentCount - 1);
      } else {
        this.voteCounts.delete(votedWord);
      }
    }
    
    // Clean up drawing state
    this.drawings.delete(playerId);
    
    this.players.delete(playerId);
    return true;
  }

  /**
   * Start voting phase
   */
  startVoting() {
    if (this.gamePhase !== 'lobby') {
      throw new Error('Cannot start voting from current phase');
    }
    
    this.gamePhase = 'voting';
    this.wordOptions = this.wordManager.getRandomWords(4);
    this.votes.clear();
    this.voteCounts.clear();
    
    // Reset voting flags
    for (const player of this.players.values()) {
      player.hasVoted = false;
    }
  }

  /**
   * Vote for a word
   */
  voteForWord(playerId, word) {
    if (this.gamePhase !== 'voting') {
      throw new Error('Not in voting phase');
    }
    
    if (!this.wordOptions.includes(word)) {
      throw new Error('Invalid word option');
    }
    
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    
    // Remove previous vote if exists
    if (this.votes.has(playerId)) {
      const previousWord = this.votes.get(playerId);
      const currentCount = this.voteCounts.get(previousWord) || 0;
      if (currentCount > 1) {
        this.voteCounts.set(previousWord, currentCount - 1);
      } else {
        this.voteCounts.delete(previousWord);
      }
    }
    
    // Add new vote
    this.votes.set(playerId, word);
    this.voteCounts.set(word, (this.voteCounts.get(word) || 0) + 1);
    player.hasVoted = true;
  }

  /**
   * Check if voting is complete
   */
  isVotingComplete() {
    return this.votes.size === this.players.size;
  }

  /**
   * Check if there's a tie in voting
   */
  checkForTie() {
    if (this.gamePhase !== 'voting') {
      throw new Error('Cannot check tie from current phase');
    }
    
    console.log('🔍 [GAME] Checking for tie. Vote counts:', Object.fromEntries(this.voteCounts));
    
    // Determine winning word(s)
    let maxVotes = 0;
    let winningWords = [];
    
    for (const [word, count] of this.voteCounts.entries()) {
      console.log(`🗺️ [GAME] Word "${word}" has ${count} votes`);
      if (count > maxVotes) {
        maxVotes = count;
        winningWords = [word];
      } else if (count === maxVotes) {
        winningWords.push(word);
      }
    }
    
    const result = {
      isTie: winningWords.length > 1,
      tiedWords: winningWords,
      maxVotes
    };
    
    console.log(`🎲 [GAME] Tie check result:`, result);
    return result;
  }

  /**
   * Start drawing phase
   */
  startDrawing(chosenWord = null) {
    if (this.gamePhase !== 'voting') {
      throw new Error('Cannot start drawing from current phase');
    }
    
    // Use provided word or determine winning word
    if (chosenWord) {
      this.chosenWord = chosenWord;
    } else {
      // Determine winning word
      let maxVotes = 0;
      let winningWords = [];
      
      for (const [word, count] of this.voteCounts.entries()) {
        if (count > maxVotes) {
          maxVotes = count;
          winningWords = [word];
        } else if (count === maxVotes) {
          winningWords.push(word);
        }
      }
      
      // Handle tie by random selection
      this.chosenWord = winningWords[Math.floor(Math.random() * winningWords.length)];
    }
    
    this.gamePhase = 'drawing';
    this.timeRemaining = this.drawingTimeLimit;
    this.drawings.clear();
    
    // Reset drawing flags
    for (const player of this.players.values()) {
      player.hasSubmittedDrawing = false;
    }
    
    // Start countdown timer
    this.startDrawingTimer();
  }

  /**
   * Start drawing timer
   */
  startDrawingTimer() {
    if (this.drawingTimer) {
      clearInterval(this.drawingTimer);
    }
    
    this.drawingTimer = setInterval(() => {
      this.timeRemaining--;
      
      if (this.timeRemaining <= 0) {
        clearInterval(this.drawingTimer);
        this.drawingTimer = null;
        this.startJudging();
      }
    }, 1000);
  }

  /**
   * Submit a drawing
   */
  submitDrawing(playerId, canvasData) {
    if (this.gamePhase !== 'drawing') {
      throw new Error('Not in drawing phase');
    }
    
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    
    this.drawings.set(playerId, canvasData);
    player.hasSubmittedDrawing = true;
  }

  /**
   * Check if all drawings submitted
   */
  areAllDrawingsSubmitted() {
    return this.drawings.size === this.players.size;
  }

  /**
   * Start judging phase
   */
  startJudging() {
    if (this.drawingTimer) {
      clearInterval(this.drawingTimer);
      this.drawingTimer = null;
    }
    
    this.gamePhase = 'judging';
    this.timeRemaining = 0;
  }

  /**
   * Judge drawings using AI
   */
  async judgeDrawings() {
    const drawingSubmissions = [];
    
    for (const [playerId, canvasData] of this.drawings.entries()) {
      const player = this.players.get(playerId);
      drawingSubmissions.push({
        playerId,
        playerName: player.name,
        canvasData,
        word: this.chosenWord
      });
    }
    
    return await this.aiJudge.evaluateDrawings(drawingSubmissions);
  }

  /**
   * Set AI judging results
   */
  setResults(results) {
    this.gamePhase = 'results';
    this.aiResults = results;
    
    // Update player scores based on ranking
    for (const result of results) {
      const player = this.players.get(result.playerId);
      if (player) {
        // Score based on rank (1st = 100pts, 2nd = 75pts, 3rd = 50pts, etc.)
        const baseScore = Math.max(25, 100 - (result.rank - 1) * 25);
        player.score += baseScore;
      }
    }
  }

  /**
   * Utility methods
   */
  hasPlayer(playerId) {
    return this.players.has(playerId);
  }

  isHost(playerId) {
    const player = this.players.get(playerId);
    return player && player.isHost;
  }

  isFull() {
    return this.players.size >= this.maxPlayers;
  }

  isEmpty() {
    return this.players.size === 0;
  }

  /**
   * Get current game state for clients
   */
  getGameState() {
    const playersArray = Array.from(this.players.values()).map(player => ({
      id: player.id,
      name: player.name,
      isHost: player.isHost,
      isConnected: true, // All players in the room are connected
      hasVoted: player.hasVoted,
      hasSubmittedDrawing: player.hasSubmittedDrawing,
      score: player.score
    }));
    
    return {
      // Connection Info
      roomCode: this.roomCode,
      isConnected: true,
      connectionStatus: 'connected',
      
      // Player Management
      players: playersArray,
      currentPlayer: null, // Will be set by client based on socket ID
      hostId: this.hostId,
      playerCount: this.players.size,
      maxPlayers: this.maxPlayers,
      
      // Game Flow
      gamePhase: this.gamePhase,
      
      // Voting data
      wordOptions: this.wordOptions,
      voteCounts: Object.fromEntries(this.voteCounts),
      chosenWord: this.chosenWord,
      
      // Drawing data
      timeRemaining: this.timeRemaining,
      drawingTimeLimit: this.drawingTimeLimit,
      submittedDrawings: this.drawings.size,
      
      // Results data
      results: this.aiResults || []
    };
  }

  /**
   * Cleanup on room destruction
   */
  destroy() {
    if (this.drawingTimer) {
      clearInterval(this.drawingTimer);
      this.drawingTimer = null;
    }
  }
}

module.exports = GameRoom;// Force reload
