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
import { ErrorHandler } from '../utils/errorHandling';
import { NetworkResilienceManager } from '../utils/networkResilience';
import { ErrorRecoveryManager } from '../utils/errorRecovery';
import config from '../config/environment';
import logger from '../utils/logger';
import performanceMonitor from '../utils/performanceMonitor';

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
  
  // Connection management properties
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // Start with 2 seconds
  private connectionTimeout: number = 10000; // 10 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionTimer: NodeJS.Timeout | null = null;
  private isDestroyed: boolean = false;
  private serverUrl: string;
  
  // Enhanced error handling
  private errorHandler: ErrorHandler;
  private networkResilience: NetworkResilienceManager;
  private errorRecovery: ErrorRecoveryManager;

  constructor(onStateChange: GameStateChangeCallback, tieBreakerCallbacks?: TieBreakerCallbacks) {
    this.onStateChange(onStateChange);
    this.tieBreakerCallbacks = tieBreakerCallbacks || null;
    this.serverUrl = config.serverUrl;
    this.maxReconnectAttempts = config.reconnectAttempts;
    this.reconnectDelay = config.reconnectDelay;
    this.connectionTimeout = config.socketTimeout;
    
    // Initialize enhanced error handling
    this.errorHandler = new ErrorHandler();
    this.networkResilience = new NetworkResilienceManager();
    this.errorRecovery = new ErrorRecoveryManager();
    
    logger.info(`SocketGameManager initialized with server: ${this.serverUrl}`, 'NETWORK');
    this.initializeSocket();
  }

  private initializeSocket() {
    if (this.isDestroyed) return;
    
    this.socket = io(this.serverUrl, {
      autoConnect: false,
      timeout: this.connectionTimeout,
      reconnection: false, // We'll handle reconnection manually
      forceNew: true
    });

    this.setupEventHandlers();
  }

  private attemptReconnection() {
    if (this.isDestroyed || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.handleError(createGameError(
          GameErrorCode.CONNECTION_FAILED,
          'Maximum reconnection attempts reached',
          { attempts: this.reconnectAttempts, maxAttempts: this.maxReconnectAttempts },
          false
        ));
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      if (this.isDestroyed) return;
      
      this.connectionStatus = 'connecting';
      this.updateGameState({ connectionStatus: 'connecting' });
      
      // Reinitialize socket for clean reconnection
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      }
      
      this.initializeSocket();
      
      if (this.currentRoomCode && this.playerName) {
        // Try to rejoin the room
        this.rejoinRoom();
      }
    }, delay);
  }

  private async rejoinRoom() {
    if (!this.socket || this.isDestroyed) return;
    
    try {
      if (this.isHostPlayer) {
        // Host tries to recreate the room
        await this.hostGame(this.playerName);
      } else {
        // Player tries to rejoin
        await this.joinGame(this.playerName, this.currentRoomCode);
      }
      
      // Reset reconnection attempts on successful reconnection
      this.reconnectAttempts = 0;
      console.log('✅ Successfully reconnected and rejoined room');
    } catch (error) {
      console.error('❌ Failed to rejoin room:', error);
      this.attemptReconnection();
    }
  }

  private clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  private setupEventHandlers() {
    if (!this.socket || this.isDestroyed) return;

    // Connection events with enhanced error recovery
    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0; // Reset on successful connection
      this.clearTimers();
      
      this.updateGameState({ 
        isConnected: true, 
        connectionStatus: 'connected' 
      });
      
      this.logNetworkMessage('connect', {}, 'received');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.connectionStatus = 'disconnected';
      
      this.updateGameState({ 
        isConnected: false, 
        connectionStatus: 'disconnected' 
      });
      
      this.logNetworkMessage('disconnect', { reason }, 'received');
      
      // Attempt reconnection unless it was intentional
      if (reason !== 'io client disconnect' && !this.isDestroyed) {
        this.attemptReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      this.connectionStatus = 'error';
      
      const gameError = createGameError(
        GameErrorCode.CONNECTION_FAILED,
        'Failed to connect to server',
        { error: error.message, attempts: this.reconnectAttempts },
        true
      );
      
      this.handleError(gameError);
      this.logNetworkMessage('connect_error', { error: error.message }, 'received');
      
      // Attempt reconnection on connection error
      if (!this.isDestroyed) {
        this.attemptReconnection();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
      this.logNetworkMessage('reconnect', { attemptNumber }, 'received');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
      this.logNetworkMessage('reconnect_error', { error: error.message }, 'received');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      this.handleError(createGameError(
        GameErrorCode.CONNECTION_FAILED,
        'Failed to reconnect to server',
        { attempts: this.maxReconnectAttempts },
        false
      ));
      this.logNetworkMessage('reconnect_failed', {}, 'received');
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

    this.socket.on('tiebreaker-resolved', (data) => {
      console.log('🎲 Tiebreaker resolved by server, chosen word:', data.chosenWord);
      
      // Update the tiebreaker modal with the winning word (without restarting animation)
      this.tieBreakerCallbacks?.onTieDetected(
        data.tiedWords,
        data.chosenWord // Server-determined winning word
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
    
    // Process error with enhanced error handling
    const classification = this.errorHandler.processError(error);
    
    // Check if we should throttle this error
    if (this.errorHandler.shouldThrottleError(error)) {
      console.warn('Error throttled due to frequency:', error.code);
      return;
    }
    
    // Attempt automatic recovery for recoverable errors
    if (error.recoverable && classification.autoRetry) {
      this.attemptAutoRecovery(error);
    }
    
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }

  private async attemptAutoRecovery(error: GameError): Promise<void> {
    try {
      const result = await this.errorRecovery.initiateRecovery(error, this, {
        gameState: this.gameState,
        playerName: this.playerName,
        roomCode: this.currentRoomCode,
        isHost: this.isHostPlayer
      });
      
      if (result.success) {
        console.log('✅ Auto-recovery successful:', result.message);
        if (result.newState) {
          this.updateGameState(result.newState);
        }
      } else {
        console.warn('❌ Auto-recovery failed:', result.message);
      }
    } catch (recoveryError) {
      console.error('Recovery process failed:', recoveryError);
    }
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
    logger.info('Attempting to host game', 'GAME', { playerName });
    performanceMonitor.startTiming('host_game', 'GAME');
    
    return await this.networkResilience.executeWithResilience(
      async () => {
        try {
          validatePlayerName(playerName);
          this.playerName = playerName;
          logger.setUserId(playerName);
          
          if (!this.socket) {
            this.initializeSocket();
          }
          
          if (!this.socket) {
            throw createGameError(
              GameErrorCode.CONNECTION_FAILED,
              'Failed to initialize socket connection',
              {},
              false
            );
          }

          this.connectionStatus = 'connecting';
          this.updateGameState({ connectionStatus: 'connecting' });
          
          return new Promise<string>((resolve, reject) => {
            // Set up connection timeout
            this.connectionTimer = setTimeout(() => {
              reject(createGameError(
                GameErrorCode.CONNECTION_TIMEOUT,
                'Connection timeout while creating room',
                { timeout: this.connectionTimeout },
                true
              ));
            }, this.connectionTimeout);

            const cleanup = () => {
              this.clearTimers();
              this.socket?.off('room-created');
              this.socket?.off('error');
              this.socket?.off('connect');
              this.socket?.off('connect_error');
            };

            this.socket!.once('room-created', (data) => {
              console.log('✅ Room created successfully:', data);
              cleanup();
              this.logNetworkMessage('room-created', data, 'received');
              resolve(data.roomCode);
            });

            this.socket!.once('error', (error) => {
              console.error('❌ Server error during room creation:', error);
              cleanup();
              this.logNetworkMessage('error', error, 'received');
              reject(createGameError(
                GameErrorCode.CONNECTION_FAILED,
                error.message || 'Failed to create room',
                { error },
                true
              ));
            });

            this.socket!.once('connect_error', (error) => {
              cleanup();
              reject(createGameError(
                GameErrorCode.CONNECTION_FAILED,
                'Connection failed while creating room',
                { error: error.message },
                true
              ));
            });

            // Wait for connection then create room
            this.socket!.once('connect', () => {
              console.log('🔌 Connected to server, creating room...');
              const message = { playerName };
              this.socket!.emit('create-room', message);
              this.logNetworkMessage('create-room', message, 'sent');
              console.log('📤 Sent create-room message:', message);
            });

            // Start connection
            if (!this.socket!.connected) {
              console.log('🔌 Connecting to server...');
              this.socket!.connect();
            } else {
              // Already connected, emit immediately
              console.log('🔌 Already connected, creating room immediately...');
              const message = { playerName };
              this.socket!.emit('create-room', message);
              this.logNetworkMessage('create-room', message, 'sent');
              console.log('📤 Sent create-room message:', message);
            }
          });
        } catch (error) {
          this.clearTimers();
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
      },
      {
        timeout: this.connectionTimeout,
        requestId: 'host-game'
      }
    );
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
    // Note: Manual tiebreaker resolution removed - server handles all tiebreakers automatically
    // This method is kept for interface compatibility but does nothing
    console.log('🎲 Tiebreaker will be resolved automatically by server');
  }

  notifyTiebreakerAnimationComplete(): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Cannot notify tiebreaker completion: socket not connected');
      return;
    }

    if (!this.currentRoomCode) {
      console.error('Cannot notify tiebreaker completion: no room code');
      return;
    }

    console.log('🎲 Notifying server that tiebreaker animation is complete');
    this.socket.emit('tiebreaker-animation-complete', { 
      roomCode: this.currentRoomCode 
    });
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
    this.isDestroyed = true;
    this.clearTimers();
    
    // Cleanup enhanced error handling
    this.networkResilience.destroy();
    this.errorRecovery.destroy();
    
    // Disconnect gracefully
    if (this.socket) {
      this.socket.removeAllListeners();
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      this.socket = null;
    }
    
    // Clear all callbacks and state
    this.stateChangeCallbacks.clear();
    this.errorCallbacks.clear();
    this.networkMessages = [];
    this.gameState = null;
    this.lastError = null;
    this.tieBreakerCallbacks = null;
    
    // Reset connection state
    this.connectionStatus = 'disconnected';
    this.reconnectAttempts = 0;
    this.currentRoomCode = '';
    this.playerName = '';
    this.isHostPlayer = false;
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

  /**
   * DevTools: Simulate partial game state changes for testing
   */
  simulateState(partialState: Partial<GameState>): void {
    if (!this.gameState) {
      console.warn('Cannot simulate state: No current game state');
      return;
    }

    console.log('🎮 SocketGameManager: Simulating state changes:', partialState);
    
    // Merge the partial state with current state
    this.gameState = {
      ...this.gameState,
      ...partialState
    };

    // Record state change for debugging (if DevTools is attached)
    if (this.devToolsService) {
      this.devToolsService.recordStateChange(this.gameState);
    }

    // Notify all state change callbacks
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(this.gameState!);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  /**
   * DevTools: Reference to DevTools service for debugging
   */
  private devToolsService: any = null;

  /**
   * DevTools: Set DevTools service reference
   */
  setDevToolsService(devToolsService: any): void {
    this.devToolsService = devToolsService;
  }

  /**
   * DevTools: Enable development mode features
   */
  enableDevMode(): void {
    console.log('🛠️ SocketGameManager: Development mode enabled');
    
    // Initialize with a basic game state if none exists
    if (!this.gameState) {
      this.gameState = {
        roomCode: 'DEV-ROOM',
        isConnected: true,
        connectionStatus: 'connected',
        players: [],
        currentPlayer: {
          id: 'dev-player',
          name: 'DevPlayer',
          isHost: true,
          isConnected: true,
          hasVoted: false,
          hasSubmittedDrawing: false,
          score: 0
        },
        hostId: 'dev-player',
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

    // Enable additional logging for development
    this.connectionStatus = 'connected';
  }

  /**
   * DevTools: Get access to socket for message interception
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}