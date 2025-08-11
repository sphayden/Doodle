/**
 * Unified GameManager Interface
 * 
 * This interface provides a clean abstraction layer for all game operations,
 * making the architecture more maintainable and testable by separating
 * networking concerns from UI components.
 */

// Core data types
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  hasVoted: boolean;
  hasSubmittedDrawing: boolean;
  score: number;
}

export interface GameResult {
  playerId: string;
  playerName: string;
  rank: number;
  score: number;
  feedback: string;
  canvasData: string;
}

export interface GameState {
  // Connection Info
  roomCode: string;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Player Management
  players: Player[];
  currentPlayer: Player | null;
  hostId: string;
  playerCount: number;
  maxPlayers: number;
  
  // Game Flow
  gamePhase: 'lobby' | 'voting' | 'drawing' | 'judging' | 'results';
  
  // Voting Data
  wordOptions: string[];
  voteCounts: Record<string, number>;
  chosenWord: string;
  
  // Drawing Data
  timeRemaining: number;
  drawingTimeLimit: number;
  submittedDrawings: number;
  
  // Results Data
  results: GameResult[];
  
  // Error State
  lastError?: GameError;
}

export interface GameError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

export interface NetworkMessage {
  type: string;
  data: any;
  timestamp: Date;
  direction: 'sent' | 'received';
}

// Callback types
export interface TieBreakerCallbacks {
  onTieDetected: (tiedOptions: string[], winningWord: string) => void;
  onTieResolved: (selectedOption: string) => void;
}

export type GameStateChangeCallback = (state: GameState) => void;
export type GameErrorCallback = (error: GameError) => void;

/**
 * Main GameManager Interface
 * 
 * Provides a unified API for all game operations, abstracting away
 * networking details from UI components.
 */
export interface GameManager {
  // Connection Management
  /**
   * Host a new game room
   * @param playerName Name of the host player
   * @returns Promise that resolves to the room code
   */
  hostGame(playerName: string): Promise<string>;
  
  /**
   * Join an existing game room
   * @param playerName Name of the joining player
   * @param roomCode Code of the room to join
   * @returns Promise that resolves when successfully joined
   */
  joinGame(playerName: string, roomCode: string): Promise<void>;
  
  /**
   * Disconnect from the current game
   */
  disconnect(): void;
  
  /**
   * Get current connection status
   */
  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Game Actions
  /**
   * Start the voting phase (host only)
   */
  startVoting(): void;
  
  /**
   * Vote for a word option
   * @param word The word to vote for
   */
  voteForWord(word: string): void;
  
  /**
   * Submit a completed drawing
   * @param canvasData Base64 encoded canvas data
   */
  submitDrawing(canvasData: string): void;
  
  /**
   * Mark drawing as finished
   */
  finishDrawing(): void;
  
  /**
   * Resolve a tie-breaker situation
   * @param selectedOption The chosen word from tied options
   */
  resolveTiebreaker(selectedOption: string): void;
  
  /**
   * Send real-time drawing stroke data (for spectating)
   * @param strokeData Drawing stroke information
   */
  sendDrawingStroke(strokeData: any): void;
  
  // State Management
  /**
   * Get current game state
   */
  getGameState(): GameState | null;
  
  /**
   * Register callback for game state changes
   * @param callback Function to call when state changes
   */
  onStateChange(callback: GameStateChangeCallback): void;
  
  /**
   * Remove state change callback
   * @param callback Function to remove
   */
  offStateChange(callback: GameStateChangeCallback): void;
  
  // Error Handling
  /**
   * Register callback for game errors
   * @param callback Function to call when errors occur
   */
  onError(callback: GameErrorCallback): void;
  
  /**
   * Remove error callback
   * @param callback Function to remove
   */
  offError(callback: GameErrorCallback): void;
  
  /**
   * Get the last error that occurred
   */
  getLastError(): GameError | null;
  
  /**
   * Clear the last error
   */
  clearError(): void;
  
  // Utility Methods
  /**
   * Check if current player is the host
   */
  isHost(): boolean;
  
  /**
   * Get current room code
   */
  getRoomCode(): string;
  
  /**
   * Get current player information
   */
  getCurrentPlayer(): Player | null;
  
  /**
   * Set tie breaker callbacks
   * @param callbacks Callbacks for tie breaker events
   */
  setTieBreakerCallbacks(callbacks: TieBreakerCallbacks): void;
  
  /**
   * Clean up resources and disconnect
   */
  destroy(): void;
  
  // Development Tools (only available in development mode)
  /**
   * Enable development mode features
   */
  enableDevMode?(): void;
  
  /**
   * Simulate a game state for testing
   * @param state Partial game state to simulate
   */
  simulateGameState?(state: Partial<GameState>): void;
  
  /**
   * Get network message history for debugging
   */
  getNetworkMessages?(): NetworkMessage[];
  
  /**
   * Export current game session for debugging
   */
  exportGameSession?(): string;
}

/**
 * Factory function type for creating GameManager instances
 */
export type GameManagerFactory = (
  onStateChange: GameStateChangeCallback,
  tieBreakerCallbacks?: TieBreakerCallbacks
) => GameManager;

/**
 * Configuration options for GameManager
 */
export interface GameManagerConfig {
  serverUrl?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  connectionTimeout?: number;
  enableDevMode?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Error codes for standardized error handling
 */
export enum GameErrorCode {
  // Connection Errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_LOST = 'CONNECTION_LOST',
  SERVER_UNREACHABLE = 'SERVER_UNREACHABLE',
  
  // Game Logic Errors
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_FULL = 'ROOM_FULL',
  INVALID_ROOM_CODE = 'INVALID_ROOM_CODE',
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  INVALID_GAME_STATE = 'INVALID_GAME_STATE',
  UNAUTHORIZED_ACTION = 'UNAUTHORIZED_ACTION',
  
  // Validation Errors
  INVALID_PLAYER_NAME = 'INVALID_PLAYER_NAME',
  INVALID_DRAWING_DATA = 'INVALID_DRAWING_DATA',
  INVALID_VOTE = 'INVALID_VOTE',
  
  // Rate Limiting
  RATE_LIMITED = 'RATE_LIMITED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Unknown/Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Helper function to create standardized GameError objects
 */
export function createGameError(
  code: GameErrorCode,
  message: string,
  details?: any,
  recoverable: boolean = true
): GameError {
  return {
    code,
    message,
    details,
    timestamp: new Date(),
    recoverable
  };
}

/**
 * Type guard to check if an object implements GameManager interface
 */
export function isGameManager(obj: any): obj is GameManager {
  return obj &&
    typeof obj.hostGame === 'function' &&
    typeof obj.joinGame === 'function' &&
    typeof obj.getGameState === 'function' &&
    typeof obj.onStateChange === 'function' &&
    typeof obj.destroy === 'function';
}