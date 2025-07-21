import Peer, { DataConnection } from 'peerjs';

export interface Player {
  id: string;
  name: string;
  ready: boolean;
  score: number;
  isHost?: boolean;
}

export interface GameMessage {
  type: 'player-joined' | 'player-left' | 'lobby-updated' | 'voting-started' | 'vote-updated' | 'game-started' | 'game-state' | 'host-disconnected' | 'tie-detected' | 'tie-resolved' | 'drawing-submitted' | 'drawing-finished';
  data: any;
  timestamp: number;
}

export interface GameState {
  players: Player[];
  gamePhase: 'lobby' | 'voting' | 'game' | 'results';
  wordOptions: string[];
  votes: { [word: string]: number };
  playerVotes: { [playerId: string]: string }; // Track who voted for what
  chosenWord: string;
  timeRemaining: number;
  hostId: string;
  finishedPlayers: string[]; // Track players who have finished drawing
}

export interface TieBreakerCallbacks {
  onTieDetected: (tiedOptions: string[], winningWord: string) => void;
  onTieResolved: (selectedOption: string) => void;
}

export class P2PGameManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private gameState: GameState;
  private isHost: boolean = false;
  private onStateChange: (state: GameState) => void;
  private tieBreakerCallbacks: TieBreakerCallbacks | null = null;
  private playerName: string = '';
  private beforeUnloadHandler: (() => void) | null = null;

  // Predefined word list for the game
  private wordList = [
    'cat', 'dog', 'house', 'tree', 'car', 'sun', 'moon', 'star', 'fish', 'bird',
    'flower', 'mountain', 'river', 'cloud', 'rainbow', 'apple', 'cake', 'book',
    'guitar', 'piano', 'camera', 'phone', 'computer', 'bicycle', 'airplane',
    'boat', 'train', 'bus', 'elephant', 'lion', 'tiger', 'bear', 'rabbit',
    'butterfly', 'dragon', 'castle', 'bridge', 'lighthouse', 'rocket', 'robot'
  ];

  constructor(onStateChange: (state: GameState) => void, tieBreakerCallbacks?: TieBreakerCallbacks) {
    this.onStateChange = onStateChange;
    this.tieBreakerCallbacks = tieBreakerCallbacks || null;
    this.gameState = {
      players: [],
      gamePhase: 'lobby',
      wordOptions: [],
      votes: {},
      playerVotes: {},
      chosenWord: '',
      timeRemaining: 0,
      hostId: '',
      finishedPlayers: []
    };

    // Add event listener for browser close/refresh
    this.setupBrowserExitHandler();
  }

  // Generate a random room ID for hosting
  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Set up browser exit detection for proper cleanup
  private setupBrowserExitHandler() {
    const handleBeforeUnload = () => {
      console.log('Browser closing/refreshing - cleaning up...');
      this.cleanup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);
    
    // Store reference to remove listeners later
    this.beforeUnloadHandler = handleBeforeUnload;
  }

  // Host a new game
  async hostGame(playerName: string): Promise<string> {
    this.playerName = playerName;
    this.isHost = true;
    
    const roomId = this.generateRoomId();
    
    try {
      this.peer = new Peer(roomId, {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true
      });

      await new Promise<void>((resolve, reject) => {
        this.peer!.on('open', (id) => {
          console.log('Host peer connected with ID:', id);
          
          // Add host as first player
          const hostPlayer: Player = {
            id: this.peer!.id,
            name: playerName,
            ready: true,
            score: 0,
            isHost: true
          };
          
          this.gameState.players = [hostPlayer];
          this.gameState.hostId = this.peer!.id;
          this.updateGameState();
          resolve();
        });

        this.peer!.on('error', (error) => {
          console.error('Host peer error:', error);
          reject(error);
        });

        this.peer!.on('connection', (conn) => {
          this.handleNewConnection(conn);
        });
      });

      return roomId;
    } catch (error) {
      console.error('Error hosting game:', error);
      throw error;
    }
  }

  // Join an existing game
  async joinGame(playerName: string, roomId: string): Promise<void> {
    this.playerName = playerName;
    this.isHost = false;

    try {
      this.peer = new Peer({
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true
      });

      await new Promise<void>((resolve, reject) => {
        this.peer!.on('open', (id) => {
          console.log('Player peer connected with ID:', id);
          
          const conn = this.peer!.connect(roomId);
          
          conn.on('open', () => {
            console.log('Connected to host');
            this.connections.set(roomId, conn);
            
            // Send join request
            this.sendMessage({
              type: 'player-joined',
              data: { name: playerName, id: this.peer!.id },
              timestamp: Date.now()
            });

            this.setupConnectionHandlers(conn);
            resolve();
          });

          conn.on('error', (error) => {
            console.error('Connection error:', error);
            reject(error);
          });
        });

        this.peer!.on('error', (error) => {
          console.error('Player peer error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error joining game:', error);
      throw error;
    }
  }

  // Handle new connections (host only)
  private handleNewConnection(conn: DataConnection) {
    if (!this.isHost) return;

    console.log('New player connecting:', conn.peer);
    
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.setupConnectionHandlers(conn);
    });
  }

  // Set up message handlers for a connection
  private setupConnectionHandlers(conn: DataConnection) {
    conn.on('data', (data) => {
      const message = data as GameMessage;
      this.handleMessage(message, conn.peer);
    });

    conn.on('close', () => {
      console.log('Player disconnected:', conn.peer);
      
      // Check if the disconnected peer is the host
      if (!this.isHost && conn.peer === this.gameState.hostId) {
        console.log('Host has disconnected! Closing lobby...');
        this.handleHostDisconnected();
      } else {
        this.handlePlayerLeft(conn.peer);
      }
    });

    conn.on('error', (error) => {
      console.error('Connection error:', error);
      
      // Also check for host disconnection on error
      if (!this.isHost && conn.peer === this.gameState.hostId) {
        console.log('Host connection error! Closing lobby...');
        this.handleHostDisconnected();
      }
    });
  }

  // Handle incoming messages
  private handleMessage(message: GameMessage, senderId: string) {
    console.log('Received message:', message.type, 'from:', senderId);

    switch (message.type) {
      case 'player-joined':
        if (this.isHost) {
          this.handlePlayerJoined(message.data, senderId);
        }
        break;
      case 'voting-started':
        if (!this.isHost) {
          this.gameState.gamePhase = 'voting';
          this.gameState.wordOptions = message.data.words;
          this.gameState.votes = {};
          this.updateGameState();
        }
        break;
      case 'vote-updated':
        if (this.isHost && message.data.vote && message.data.playerId) {
          // Handle individual vote from player
          const playerId = message.data.playerId;
          const word = message.data.vote;
          
          // If player already voted, remove their previous vote
          if (this.gameState.playerVotes[playerId]) {
            const previousVote = this.gameState.playerVotes[playerId];
            this.gameState.votes[previousVote] = Math.max(0, (this.gameState.votes[previousVote] || 0) - 1);
          }
          
          // Add new vote
          this.gameState.playerVotes[playerId] = word;
          this.gameState.votes[word] = (this.gameState.votes[word] || 0) + 1;
          
          this.broadcastMessage({
            type: 'vote-updated',
            data: this.gameState.votes,
            timestamp: Date.now()
          });

          this.updateGameState();

          // Check if all players have voted (based on unique player IDs)
          const totalVotes = Object.keys(this.gameState.playerVotes).length;
          if (totalVotes >= this.gameState.players.length) {
            this.finishVoting();
          }
        } else if (!this.isHost) {
          // Update vote counts from host
          this.gameState.votes = message.data;
          this.updateGameState();
        }
        break;
      case 'game-started':
        if (!this.isHost) {
          this.gameState.gamePhase = 'game';
          this.gameState.chosenWord = message.data.word;
          this.gameState.timeRemaining = message.data.timeLimit;
          this.updateGameState();
        }
        break;
      case 'lobby-updated':
        if (!this.isHost) {
          this.gameState.players = message.data.players;
          this.updateGameState();
        }
        break;

      case 'host-disconnected':
        if (!this.isHost) {
          console.log('Received host disconnect notification');
          this.handleHostDisconnected();
        }
        break;
      case 'tie-detected':
        if (!this.isHost) {
          console.log('🎲 [PLAYER] Received tie detection from host');
          console.log('🔍 [PLAYER] Tied options:', message.data.tiedOptions);
          console.log('🔍 [PLAYER] tieBreakerCallbacks available:', !!this.tieBreakerCallbacks);
          // Trigger tie breaker modal for non-host players
          if (this.tieBreakerCallbacks?.onTieDetected) {
            console.log('✅ [PLAYER] Triggering tie breaker modal');
            this.tieBreakerCallbacks.onTieDetected(message.data.tiedOptions, message.data.winningWord);
          } else {
            console.log('⚠️ [PLAYER] No tieBreakerCallbacks set');
          }
        }
        break;
      case 'tie-resolved':
        if (!this.isHost) {
          console.log('🎲 [PLAYER] Received tie resolution from host');
          console.log('🔍 [PLAYER] Selected option:', message.data.selectedOption);
          // Handle tie resolution for non-host players
          if (this.tieBreakerCallbacks?.onTieResolved) {
            console.log('✅ [PLAYER] Handling tie resolution');
            this.tieBreakerCallbacks.onTieResolved(message.data.selectedOption);
          } else {
            console.log('⚠️ [PLAYER] No tieBreakerCallbacks set for resolution');
          }
        }
        break;
      case 'drawing-submitted':
        if (this.isHost) {
          // Host receives drawing data from player
          console.log('🎨 [HOST] Received drawing from player:', message.data.playerId);
          // Store drawing data for later use (could be used for results screen)
          // For now, just acknowledge receipt
        }
        break;
      case 'drawing-finished':
        if (this.isHost) {
          // Host receives notification that player finished drawing
          const playerId = message.data.playerId;
          console.log('✅ [HOST] Player finished drawing:', playerId);
          
          // Add player to finished list if not already there
          if (!this.gameState.finishedPlayers.includes(playerId)) {
            this.gameState.finishedPlayers.push(playerId);
            
            // Broadcast updated finished players list to all players
            this.broadcastMessage({
              type: 'drawing-finished',
              data: { finishedPlayers: this.gameState.finishedPlayers },
              timestamp: Date.now()
            });
            
            this.updateGameState();
          }
        } else {
          // Non-host players receive updated finished players list
          this.gameState.finishedPlayers = message.data.finishedPlayers;
          this.updateGameState();
        }
        break;
    }
  }

  // Handle player joining (host only)
  private handlePlayerJoined(playerData: { name: string; id: string }, peerId: string) {
    if (!this.isHost) return;

    // Check if player with this ID is already in the game (reconnection case)
    const existingPlayer = this.gameState.players.find(p => p.id === playerData.id);
    if (existingPlayer) {
      // Player is reconnecting, just update their connection
      console.log('Player reconnecting:', playerData.name);
      this.broadcastGameState();
      return;
    }

    // Check if lobby is full
    if (this.gameState.players.length >= 8) {
      const conn = this.connections.get(peerId);
      if (conn) {
        this.sendMessageToPlayer(peerId, {
          type: 'game-state',
          data: { error: 'Lobby is full' },
          timestamp: Date.now()
        });
      }
      return;
    }

    // Add new player (duplicate names are allowed, ID is what matters)
    const newPlayer: Player = {
      id: playerData.id,
      name: playerData.name,
      ready: false,
      score: 0,
      isHost: false
    };

    this.gameState.players.push(newPlayer);
    console.log('Player joined:', playerData.name, 'ID:', playerData.id);
    this.broadcastGameState();
  }

  // Handle player leaving
  private handlePlayerLeft(peerId: string) {
    this.connections.delete(peerId);
    this.gameState.players = this.gameState.players.filter(p => p.id !== peerId);
    
    if (this.isHost) {
      this.broadcastGameState();
    }
  }

  // Handle host disconnection (for players only)
  private handleHostDisconnected() {
    if (this.isHost) return; // This shouldn't happen for hosts
    
    console.log('Host has left the game. Lobby is closing...');
    
    // Update game state to show host disconnected
    this.gameState.gamePhase = 'lobby';
    this.gameState.players = [];
    
    // Notify the UI about host disconnection
    this.updateGameState();
    
    // Trigger a special state that the App can handle
    this.onStateChange({
      ...this.gameState,
      hostId: '', // Clear host ID to signal disconnection
      players: [] // Clear players to signal lobby closed
    });
    
    // Clean up connections
    this.cleanup();
  }

  // Internal cleanup method
  private cleanup() {
    // If host is leaving, notify all players first
    if (this.isHost && this.connections.size > 0) {
      console.log('Host is leaving - notifying all players...');
      try {
        this.broadcastMessage({
          type: 'host-disconnected',
          data: { message: 'Host has left the game' },
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error notifying players of host disconnect:', error);
      }
    }
    
    this.connections.forEach(conn => {
      if (conn.open) {
        conn.close();
      }
    });
    this.connections.clear();
    
    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy();
    }

    // Remove browser event listeners
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      window.removeEventListener('unload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }

  // Start voting (host only)
  startVoting() {
    if (!this.isHost) return;

    // Select 4 random words
    const shuffled = [...this.wordList].sort(() => 0.5 - Math.random());
    const wordOptions = shuffled.slice(0, 4);

    this.gameState.gamePhase = 'voting';
    this.gameState.wordOptions = wordOptions;
    this.gameState.votes = {};
    this.gameState.playerVotes = {};

    this.broadcastMessage({
      type: 'voting-started',
      data: { words: wordOptions },
      timestamp: Date.now()
    });

    this.updateGameState();
  }

  // Vote for a word
  voteForWord(word: string) {
    if (this.isHost) {
      // Host processes their own vote
      const hostId = this.peer!.id;
      
      // If host already voted, remove their previous vote
      if (this.gameState.playerVotes[hostId]) {
        const previousVote = this.gameState.playerVotes[hostId];
        this.gameState.votes[previousVote] = Math.max(0, (this.gameState.votes[previousVote] || 0) - 1);
      }
      
      // Add new vote
      this.gameState.playerVotes[hostId] = word;
      this.gameState.votes[word] = (this.gameState.votes[word] || 0) + 1;
      
      this.broadcastMessage({
        type: 'vote-updated',
        data: this.gameState.votes,
        timestamp: Date.now()
      });

      this.updateGameState();

      // Check if all players have voted (based on unique player IDs)
      const totalVotes = Object.keys(this.gameState.playerVotes).length;
      if (totalVotes >= this.gameState.players.length) {
        this.finishVoting();
      }
    } else {
      // Player sends vote to host
      this.sendMessage({
        type: 'vote-updated',
        data: { vote: word, playerId: this.peer!.id },
        timestamp: Date.now()
      });
    }
  }

  // Finish voting and start game (host only)
  private finishVoting() {
    if (!this.isHost) return;

    console.log('🔍 [HOST] finishVoting() called');

    // Find word with most votes
    let maxVotes = 0;
    let winningWords: string[] = [];

    for (const [word, votes] of Object.entries(this.gameState.votes)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        winningWords = [word];
      } else if (votes === maxVotes) {
        winningWords.push(word);
      }
    }

    console.log('🔍 [HOST] Vote analysis:', { maxVotes, winningWords, votes: this.gameState.votes });

    // If there's a tie, broadcast to all players and trigger the tie breaker modal
    if (winningWords.length > 1) {
      console.log(`🎲 [HOST] Voting tie detected! Options: ${winningWords.join(', ')}`);
      
      // Host determines the winning word randomly
      const randomIndex = Math.floor(Math.random() * winningWords.length);
      const winningWord = winningWords[randomIndex];
      
      // Broadcast tie detection with winning word to all players
      console.log('🔍 [HOST] Broadcasting tie-detected message with winning word to all players');
      this.broadcastMessage({
        type: 'tie-detected',
        data: { tiedOptions: winningWords, winningWord },
        timestamp: Date.now()
      });
      
      // Trigger modal locally for host with winning word
      console.log('🔍 [HOST] Triggering tie breaker modal locally');
      if (this.tieBreakerCallbacks?.onTieDetected) {
        this.tieBreakerCallbacks.onTieDetected(winningWords, winningWord);
      } else {
        console.log('⚠️ [HOST] No tieBreakerCallbacks set, using fallback');
        // Fallback to direct game start
        this.startGameWithWord(winningWord);
      }
    } else {
      console.log('✅ [HOST] No tie - clear winner:', winningWords[0]);
      // No tie, start game immediately
      this.startGameWithWord(winningWords[0]);
    }
  }

  // Start game with the chosen word
  private startGameWithWord(chosenWord: string) {
    this.gameState.gamePhase = 'game';
    this.gameState.chosenWord = chosenWord;
    this.gameState.timeRemaining = 60; // 60 seconds to draw

    this.broadcastMessage({
      type: 'game-started',
      data: { word: chosenWord, timeLimit: 60 },
      timestamp: Date.now()
    });

    this.updateGameState();
  }

  // Handle tie resolution from modal
  handleTieResolution(selectedOption: string) {
    console.log(`Tie resolved! Selected: ${selectedOption}`);
    
    // Broadcast tie resolution to all players
    this.broadcastMessage({
      type: 'tie-resolved',
      data: { selectedOption },
      timestamp: Date.now()
    });
    
    this.startGameWithWord(selectedOption);
    
    if (this.tieBreakerCallbacks?.onTieResolved) {
      this.tieBreakerCallbacks.onTieResolved(selectedOption);
    }
  }

  // Send message to all connected players
  private broadcastMessage(message: GameMessage) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }

  // Send message to specific player
  private sendMessageToPlayer(peerId: string, message: GameMessage) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(message);
    }
  }

  // Send message (for non-host players)
  private sendMessage(message: GameMessage) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }

  // Broadcast current game state (host only)
  private broadcastGameState() {
    if (!this.isHost) return;

    this.broadcastMessage({
      type: 'lobby-updated',
      data: { players: this.gameState.players },
      timestamp: Date.now()
    });

    this.updateGameState();
  }

  // Update local game state and notify components
  private updateGameState() {
    this.onStateChange(this.gameState);
  }

  // Get current game state
  getGameState(): GameState {
    return this.gameState;
  }

  // Check if current player is host
  getIsHost(): boolean {
    return this.isHost;
  }

  // Get room ID (for sharing)
  getRoomId(): string {
    return this.peer?.id || '';
  }

  // Cleanup
  destroy() {
    this.cleanup();
  }

  // Set tie breaker callbacks (can be called after construction)
  setTieBreakerCallbacks(callbacks: TieBreakerCallbacks) {
    this.tieBreakerCallbacks = callbacks;
  }

  // Submit drawing (for non-host players)
  submitDrawing(canvasData: string) {
    if (!this.isHost) {
      this.sendMessage({
        type: 'drawing-submitted',
        data: { canvasData, playerId: this.peer!.id },
        timestamp: Date.now()
      });
    }
  }

  // Finish drawing (for non-host players)
  finishDrawing() {
    if (!this.isHost) {
      this.sendMessage({
        type: 'drawing-finished',
        data: { playerId: this.peer!.id },
        timestamp: Date.now()
      });
    }
  }
} 