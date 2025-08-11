import { io, Socket } from 'socket.io-client';
import {
  GameManager,
  GameState,
  Player,
  GameResult,
  GameError,
  GameErrorCode,
  TieBreakerCallbacks,
  GameStateChangeCallback,
  GameErrorCallback,
  NetworkMessage,
  createGameError
} from '../interfaces';
import { validatePlayerName, validateRoomCode, validateCanvasData, validateVote } from '../utils/validation';

// Legacy interface for backward compatibility
export interface AIResult extends GameResult {}

// Re-export types for backward compatibility
export type { GameState as SocketGameState, TieBreakerCallbacks } from '../interfaces';

export class SocketGameManager implements GameManager {
  private socket: Socket | null = null;
  private gameState: GameState | null = null;
  private isHostPlayer: boolean = false;
  private stateChangeCallbacks: Set<GameStateChangeCallback> = new Set();
  private errorCallbacks: Set<GameErrorCallback> = new Set();
  private tieBreakerCallbacks: TieBreakerCallbacks | null = null;
  private playerName: string = '';
  private currentRoomCode: string = '';
  private lastError: GameError | null = null;
  private networkMessages: NetworkMessage[] = [];
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';

  constructor(onStateChange: GameStateChangeCallback, tieBreakerCallbacks?: TieBreakerCallbacks) {
    this.onStateChange(onStateChange);
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
      this.connectionStatus = 'connected';
      this.logNetworkMessage('connect', {}, 'received');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      this.connectionStatus = 'disconnected';
      this.logNetworkMessage('disconnect', {}, 'received');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      this.connectionStatus = 'error';
      this.handleError(createGameError(
        GameErrorCode.CONNECTION_FAILED,
        'Failed to connect to server',
        { error: error.message },
        true
      ));
      this.logNetworkMessage('connect_error', { error: error.message }, 'received');
    });

    // Room events
    this.socket.on('room-created', (data) => {
      console.log('🏠 Room created:', data.roomCode);
      this.currentRoomCode = data.roomCode;
      this.isHostPlayer = true;
      this.updateGameState({
        ...data.gameState,
        roomCode: data.roomCode,
        isConnected: true,
        connectionStatus: 'connected'
      });
      this.logNetworkMessage('room-created', data, 'received');
    });

    this.socket.on('room-joined', (data) => {
      console.log('🚪 Joined room:', data.roomCode);
      this.currentRoomCode = data.roomCode;
      this.isHostPlayer = false;
      this.updateGameState({
        ...data.gameState,
        roomCode: data.roomCode,
        isConnected: true,
        connectionStatus: 'connected'
      });
      this.logNetworkMessage('room-joined', data, 'received');
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

  private updateGameState(newState: Partial<GameState>) {
    // Merge with existing state to ensure all required fields are present
    this.gameState = {
      ...this.createDefaultGameState(),
      ...this.gameState,
      ...newState
    };
    
    // Notify all state change callbacks
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(this.gameState!);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  private createDefaultGameState(): GameState {
    return {
      roomCode: '',
      isConnected: false,
      connectionStatus: this.connectionStatus,
      players: [],
      currentPlayer: null,
      hostId: '',
      playerCount: 0,
      maxPlayers: 8,
      gamePhase: 'lobby',
      wordOptions: [],
      voteCounts: {},
      chosenWord: '',
      timeRemaining: 0,
      drawingTimeLimit: 60,
      submittedDrawings: 0,
      results: []
    };
  }

  private handleError(error: GameError) {
    this.lastError = error;
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }

  private logNetworkMessage(type: string, data: any, direction: 'sent' | 'received') {
    const message: NetworkMessage = {
      type,
      data,
      timestamp: new Date(),
      direction
    };
    
    this.networkMessages.push(message);
    
    // Keep only last 100 messages to prevent memory leaks
    if (this.networkMessages.length > 100) {
      this.networkMessages = this.networkMessages.slice(-100);
    }
  }

  // GameManager Interface Implementation

  async hostGame(playerName: string): Promise<string> {
    try {
      validatePlayerName(playerName);
      this.playerName = playerName;
      
      if (!this.socket) {
        throw createGameError(
          GameErrorCode.CONNECTION_FAILED,
          'Socket not initialized',
          {},
          false
        );
      }

      this.connectionStatus = 'connecting';
      
      return new Promise((resolve, reject) => {
        this.socket!.connect();
        
        this.socket!.once('room-created', (data) => {
          this.logNetworkMessage('room-created', data, 'received');
          resolve(data.roomCode);
        });

        this.socket!.once('error', (error) => {
          this.logNetworkMessage('error', error, 'received');
          reject(createGameError(
            GameErrorCode.CONNECTION_FAILED,
            error.message || 'Failed to create room',
            { error },
            true
          ));
        });

        // Wait for connection then create room
        this.socket!.once('connect', () => {
          const message = { playerName };
          this.socket!.emit('create-room', message);
          this.logNetworkMessage('create-room', message, 'sent');
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          reject(createGameError(
            GameErrorCode.CONNECTION_TIMEOUT,
            'Connection timeout while creating room',
            { timeout: 10000 },
            true
          ));
        }, 10000);
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw GameError
      }
      throw createGameError(
        GameErrorCode.UNKNOWN_ERROR,
        'Unexpected error while hosting game',
        { error: error instanceof Error ? error.message : String(error) },
        true
      );
    }
  }

  async joinGame(playerName: string, roomCode: string): Promise<void> {
    try {
      validatePlayerName(playerName);
      validateRoomCode(roomCode);
      
      this.playerName = playerName;
      
      if (!this.socket) {
        throw createGameError(
          GameErrorCode.CONNECTION_FAILED,
          'Socket not initialized',
          {},
          false
        );
      }

      this.connectionStatus = 'connecting';

      return new Promise((resolve, reject) => {
        this.socket!.connect();

        this.socket!.once('room-joined', (data) => {
          this.logNetworkMessage('room-joined', data, 'received');
          resolve();
        });

        this.socket!.once('error', (error) => {
          this.logNetworkMessage('error', error, 'received');
          reject(createGameError(
            GameErrorCode.ROOM_NOT_FOUND,
            error.message || 'Failed to join room',
            { error, roomCode },
            true
          ));
        });

        // Wait for connection then join room
        this.socket!.once('connect', () => {
          const message = { roomCode, playerName };
          this.socket!.emit('join-room', message);
          this.logNetworkMessage('join-room', message, 'sent');
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          reject(createGameError(
            GameErrorCode.CONNECTION_TIMEOUT,
            'Connection timeout while joining room',
            { timeout: 10000, roomCode },
            true
          ));
        }, 10000);
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw GameError
      }
      throw createGameError(
        GameErrorCode.UNKNOWN_ERROR,
        'Unexpected error while joining game',
        { error: error instanceof Error ? error.message : String(error) },
        true
      );
    }
  }

  // Game Actions
  startVoting(): void {
    try {
      if (!this.socket || !this.socket.connected) {
        throw createGameError(
          GameErrorCode.CONNECTION_LOST,
          'Cannot start voting: not connected to server',
          {},
          true
        );
      }

      if (!this.isHostPlayer) {
        throw createGameError(
          GameErrorCode.UNAUTHORIZED_ACTION,
          'Cannot start voting: only host can start voting',
          {},
          false
        );
      }

      const message = { roomCode: this.currentRoomCode };
      this.socket.emit('start-voting', message);
      this.logNetworkMessage('start-voting', message, 'sent');
    } catch (error) {
      this.handleError(error as GameError);
    }
  }

  voteForWord(word: string): void {
    try {
      if (!this.socket || !this.socket.connected) {
        throw createGameError(
          GameErrorCode.CONNECTION_LOST,
          'Cannot vote: not connected to server',
          {},
          true
        );
      }

      if (this.gameState?.wordOptions) {
        validateVote(word, this.gameState.wordOptions);
      }

      const message = { roomCode: this.currentRoomCode, word };
      this.socket.emit('vote-word', message);
      this.logNetworkMessage('vote-word', message, 'sent');
    } catch (error) {
      this.handleError(error as GameError);
    }
  }

  submitDrawing(canvasData: string): void {
    try {
      validateCanvasData(canvasData);

      if (!this.socket || !this.socket.connected) {
        throw createGameError(
          GameErrorCode.CONNECTION_LOST,
          'Cannot submit drawing: not connected to server',
          {},
          true
        );
      }

      const message = { roomCode: this.currentRoomCode, canvasData };
      this.socket.emit('submit-drawing', message);
      this.logNetworkMessage('submit-drawing', { roomCode: this.currentRoomCode, canvasDataSize: canvasData.length }, 'sent');
    } catch (error) {
      this.handleError(error as GameError);
    }
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
   * Mark drawing as finished (notifies server)
   */
  finishDrawing(): void {
    if (!this.socket) {
      console.error('Cannot finish drawing: socket not connected');
      return;
    }

    this.socket.emit('finish-drawing', { roomCode: this.currentRoomCode });
  }

  // Connection Management
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.connectionStatus = 'disconnected';
      this.logNetworkMessage('disconnect', {}, 'sent');
    }
  }

  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    return this.connectionStatus;
  }

  // State Management
  getGameState(): GameState | null {
    return this.gameState;
  }

  onStateChange(callback: GameStateChangeCallback): void {
    this.stateChangeCallbacks.add(callback);
  }

  offStateChange(callback: GameStateChangeCallback): void {
    this.stateChangeCallbacks.delete(callback);
  }

  // Error Handling
  onError(callback: GameErrorCallback): void {
    this.errorCallbacks.add(callback);
  }

  offError(callback: GameErrorCallback): void {
    this.errorCallbacks.delete(callback);
  }

  getLastError(): GameError | null {
    return this.lastError;
  }

  clearError(): void {
    this.lastError = null;
  }

  // Utility Methods
  isHost(): boolean {
    return this.isHostPlayer;
  }

  getRoomCode(): string {
    return this.currentRoomCode;
  }

  getCurrentPlayer(): Player | null {
    if (!this.gameState || !this.playerName) {
      return null;
    }
    
    return this.gameState.players.find(p => p.name === this.playerName) || null;
  }

  setTieBreakerCallbacks(callbacks: TieBreakerCallbacks): void {
    this.tieBreakerCallbacks = callbacks;
  }

  destroy(): void {
    this.disconnect();
    this.stateChangeCallbacks.clear();
    this.errorCallbacks.clear();
    this.networkMessages = [];
    this.gameState = null;
    this.lastError = null;
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket = null;
    }
  }

  // Development Tools (optional methods)
  enableDevMode?(): void {
    console.log('🧪 Development mode enabled for SocketGameManager');
  }

  simulateGameState?(state: Partial<GameState>): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Simulating game state:', state);
      this.updateGameState(state);
    }
  }

  getNetworkMessages?(): NetworkMessage[] {
    return [...this.networkMessages];
  }

  exportGameSession?(): string {
    return JSON.stringify({
      gameState: this.gameState,
      networkMessages: this.networkMessages,
      lastError: this.lastError,
      connectionStatus: this.connectionStatus,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  // Legacy methods for backward compatibility
  getIsHost(): boolean {
    return this.isHost();
  }

  getRoomId(): string {
    return this.getRoomCode();
  }

  // Optional callback handlers for additional events
  public onRealTimeStroke?: (playerId: string, strokeData: any) => void;
}