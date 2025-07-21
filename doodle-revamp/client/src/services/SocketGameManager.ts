import { io, Socket } from 'socket.io-client';

// Interfaces that match the original P2PGameManager
export interface Player {
  id: string;
  name: string;
  ready: boolean;
  score: number;
  isHost?: boolean;
  hasVoted?: boolean;
  hasSubmittedDrawing?: boolean;
}

export interface GameState {
  roomCode: string;
  gamePhase: 'lobby' | 'voting' | 'drawing' | 'judging' | 'results';
  players: Player[];
  playerCount: number;
  maxPlayers: number;
  
  // Voting data
  wordOptions: string[];
  voteCounts: { [word: string]: number };
  chosenWord: string;
  
  // Drawing data
  timeRemaining: number;
  drawingTimeLimit: number;
  submittedDrawings: number;
  
  // Results data
  aiResults: AIResult[];
}

export interface AIResult {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
  feedback: string;
  canvasData: string;
}

export interface TieBreakerCallbacks {
  onTieDetected: (tiedOptions: string[], winningWord: string) => void;
  onTieResolved: (selectedOption: string) => void;
}

export class SocketGameManager {
  private socket: Socket | null = null;
  private gameState: GameState | null = null;
  private isHost: boolean = false;
  private onStateChange: (state: GameState) => void;
  private tieBreakerCallbacks: TieBreakerCallbacks | null = null;
  private playerName: string = '';
  private currentRoomCode: string = '';

  constructor(onStateChange: (state: GameState) => void, tieBreakerCallbacks?: TieBreakerCallbacks) {
    this.onStateChange = onStateChange;
    this.tieBreakerCallbacks = tieBreakerCallbacks || null;
    this.initializeSocket();
  }

  private initializeSocket() {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    this.socket = io(serverUrl, {
      autoConnect: false
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    // Room events
    this.socket.on('room-created', (data) => {
      console.log('🏠 Room created:', data.roomCode);
      this.currentRoomCode = data.roomCode;
      this.isHost = true;
      this.updateGameState(data.gameState);
    });

    this.socket.on('room-joined', (data) => {
      console.log('🚪 Joined room:', data.roomCode);
      this.currentRoomCode = data.roomCode;
      this.isHost = false;
      this.updateGameState(data.gameState);
    });

    this.socket.on('player-joined', (data) => {
      console.log('👋 Player joined:', data.playerName);
      this.updateGameState(data.gameState);
    });

    this.socket.on('player-left', (data) => {
      console.log('👋 Player left:', data.playerId);
      this.updateGameState(data.gameState);
    });

    // Game flow events
    this.socket.on('voting-started', (data) => {
      console.log('🗳️ Voting started');
      this.updateGameState(data.gameState);
    });

    this.socket.on('vote-updated', (data) => {
      console.log('📊 Vote updated');
      this.updateGameState(data.gameState);
    });

    // Handle tiebreaker events
    this.socket.on('tiebreaker-started', (data) => {
      console.log('🎲 Tiebreaker started, tied words:', data.tiedWords);
      
      // Show tiebreaker modal with animation
      this.tieBreakerCallbacks?.onTieDetected(
        data.tiedWords,
        '' // Server will send chosen word after animation
      );
    });

    this.socket.on('drawing-started', (data) => {
      console.log('🎨 Drawing started, word:', data.gameState.chosenWord);
      this.updateGameState(data.gameState);
    });

    this.socket.on('drawing-submitted', (data) => {
      console.log('✅ Drawing submitted by:', data.playerId);
      this.updateGameState(data.gameState);
    });

    this.socket.on('judging-complete', (data) => {
      console.log('🤖 AI judging complete');
      this.updateGameState(data.gameState);
    });

    // Real-time drawing events
    this.socket.on('real-time-stroke', (data) => {
      // Forward to canvas for real-time viewing (optional feature)
      this.onRealTimeStroke?.(data.playerId, data.strokeData);
    });

    // Error handling
    this.socket.on('error', (data) => {
      console.error('🚨 Server error:', data.message);
      this.onError?.(data.message);
    });
  }

  private updateGameState(newState: GameState) {
    this.gameState = newState;
    this.onStateChange(newState);
  }

  // Public API methods (matching P2PGameManager interface)

  /**
   * Host a new game
   */
  async hostGame(playerName: string): Promise<string> {
    this.playerName = playerName;
    
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    return new Promise((resolve, reject) => {
      this.socket!.connect();
      
      this.socket!.once('room-created', (data) => {
        resolve(data.roomCode);
      });

      this.socket!.once('error', (error) => {
        reject(new Error(error.message));
      });

      // Wait for connection then create room
      this.socket!.once('connect', () => {
        this.socket!.emit('create-room', { playerName });
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);
    });
  }

  /**
   * Join an existing game
   */
  async joinGame(playerName: string, roomCode: string): Promise<void> {
    this.playerName = playerName;
    
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    return new Promise((resolve, reject) => {
      this.socket!.connect();

      this.socket!.once('room-joined', () => {
        resolve();
      });

      this.socket!.once('error', (error) => {
        reject(new Error(error.message));
      });

      // Wait for connection then join room
      this.socket!.once('connect', () => {
        this.socket!.emit('join-room', { roomCode, playerName });
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);
    });
  }

  /**
   * Start voting (host only)
   */
  startVoting(): void {
    if (!this.socket || !this.isHost) {
      console.error('Cannot start voting: not host or socket not connected');
      return;
    }

    this.socket.emit('start-voting', { roomCode: this.currentRoomCode });
  }

  /**
   * Vote for a word
   */
  voteForWord(word: string): void {
    if (!this.socket) {
      console.error('Cannot vote: socket not connected');
      return;
    }

    this.socket.emit('vote-word', { roomCode: this.currentRoomCode, word });
  }

  /**
   * Submit drawing
   */
  submitDrawing(canvasData: string): void {
    if (!this.socket) {
      console.error('Cannot submit drawing: socket not connected');
      return;
    }

    this.socket.emit('submit-drawing', { roomCode: this.currentRoomCode, canvasData });
  }

  /**
   * Resolve tiebreaker by sending chosen word to server
   */
  resolveTiebreaker(chosenWord: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Cannot resolve tiebreaker: socket not connected');
      return;
    }

    console.log('🎲 Resolving tiebreaker with word:', chosenWord);
    this.socket.emit('resolve-tiebreaker', { roomCode: this.currentRoomCode, chosenWord });
    
    // Notify callback
    this.tieBreakerCallbacks?.onTieResolved(chosenWord);
  }

  /**
   * Send real-time drawing stroke (for spectating)
   */
  sendDrawingStroke(strokeData: any): void {
    if (!this.socket) {
      return;
    }

    this.socket.emit('drawing-stroke', { roomCode: this.currentRoomCode, strokeData });
  }

  /**
   * Handle tie resolution (compatibility with existing code)
   */
  handleTieResolution(selectedOption: string): void {
    // In server architecture, ties are handled automatically by random selection
    // This method exists for compatibility but doesn't need to do anything
    console.log('Tie resolution handled by server:', selectedOption);
    
    if (this.tieBreakerCallbacks?.onTieResolved) {
      this.tieBreakerCallbacks.onTieResolved(selectedOption);
    }
  }

  /**
   * Finish drawing (mark as done)
   */
  finishDrawing(): void {
    // In this implementation, drawings are submitted when complete
    // This method exists for compatibility
    console.log('Drawing finished');
  }

  // Utility methods

  /**
   * Get current game state
   */
  getGameState(): GameState | null {
    return this.gameState;
  }

  /**
   * Check if current player is host
   */
  getIsHost(): boolean {
    return this.isHost;
  }

  /**
   * Get room ID
   */
  getRoomId(): string {
    return this.currentRoomCode;
  }

  /**
   * Set tie breaker callbacks
   */
  setTieBreakerCallbacks(callbacks: TieBreakerCallbacks): void {
    this.tieBreakerCallbacks = callbacks;
  }

  /**
   * Cleanup and disconnect
   */
  destroy(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Optional callback handlers for additional events
  public onRealTimeStroke?: (playerId: string, strokeData: any) => void;
  public onError?: (message: string) => void;
}