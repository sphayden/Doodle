/**
 * Unified GameManager Interface
 * 
 * This interface provides a clean abstraction layer for all game operations,
 * making the architecture more maintainable and testable by separating
 * networking concerns from UI components.
 * 
 * @fileoverview Core interfaces and types for the Doodle multiplayer drawing game
 * @version 1.0.0
 * @author Doodle Game Team
 * @since 2024
 */

/**
 * Represents a player in the game
 * 
 * @interface Player
 * @example
 * ```typescript
 * const player: Player = {
 *   id: 'player-123',
 *   name: 'Alice',
 *   isHost: true,
 *   isConnected: true,
 *   hasVoted: false,
 *   hasSubmittedDrawing: false,
 *   score: 85
 * };
 * ```
 */
export interface Player {
  /** Unique identifier for the player */
  id: string;
  /** Display name chosen by the player (1-15 characters) */
  name: string;
  /** Whether this player is the room host */
  isHost: boolean;
  /** Whether the player is currently connected to the game */
  isConnected: boolean;
  /** Whether the player has voted in the current voting phase */
  hasVoted: boolean;
  /** Whether the player has submitted their drawing */
  hasSubmittedDrawing: boolean;
  /** Current score for this player */
  score: number;
}

/**
 * Represents the result for a single player at the end of a game round
 * 
 * @interface GameResult
 * @example
 * ```typescript
 * const result: GameResult = {
 *   playerId: 'player-123',
 *   playerName: 'Alice',
 *   rank: 1,
 *   score: 92,
 *   feedback: 'Excellent drawing! Very creative interpretation.',
 *   canvasData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
 * };
 * ```
 */
export interface GameResult {
  /** Unique identifier of the player */
  playerId: string;
  /** Display name of the player */
  playerName: string;
  /** Final ranking (1 = first place, 2 = second place, etc.) */
  rank: number;
  /** AI-generated score for the drawing (0-100) */
  score: number;
  /** AI-generated feedback about the drawing */
  feedback: string;
  /** Base64-encoded canvas image data */
  canvasData: string;
}

/**
 * Complete game state containing all information about the current game session
 * 
 * @interface GameState
 * @example
 * ```typescript
 * const gameState: GameState = {
 *   roomCode: 'ABC123',
 *   isConnected: true,
 *   connectionStatus: 'connected',
 *   players: [player1, player2],
 *   currentPlayer: player1,
 *   hostId: 'player-123',
 *   playerCount: 2,
 *   maxPlayers: 8,
 *   gamePhase: 'voting',
 *   wordOptions: ['cat', 'dog', 'bird'],
 *   voteCounts: { 'cat': 1, 'dog': 1 },
 *   chosenWord: '',
 *   timeRemaining: 0,
 *   drawingTimeLimit: 60,
 *   submittedDrawings: 0,
 *   results: []
 * };
 * ```
 */
export interface GameState {
  // Connection Info
  /** 6-character room code for joining the game */
  roomCode: string;
  /** Whether the client is currently connected to the server */
  isConnected: boolean;
  /** Current connection status */
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Player Management
  /** Array of all players in the game */
  players: Player[];
  /** The current player (null if not in a game) */
  currentPlayer: Player | null;
  /** ID of the player who is hosting the game */
  hostId: string;
  /** Current number of players in the game */
  playerCount: number;
  /** Maximum number of players allowed in the game */
  maxPlayers: number;
  
  // Game Flow
  /** Current phase of the game */
  gamePhase: 'lobby' | 'voting' | 'drawing' | 'judging' | 'results';
  
  // Voting Data
  /** Array of word options to vote on */
  wordOptions: string[];
  /** Vote counts for each word option */
  voteCounts: Record<string, number>;
  /** The word chosen after voting (empty during voting) */
  chosenWord: string;
  
  // Drawing Data
  /** Time remaining in current phase (seconds) */
  timeRemaining: number;
  /** Total time limit for drawing phase (seconds) */
  drawingTimeLimit: number;
  /** Number of players who have submitted drawings */
  submittedDrawings: number;
  
  // Results Data
  /** Final results after AI judging */
  results: GameResult[];
  
  // Error State
  /** Last error that occurred (if any) */
  lastError?: GameError;
}

/**
 * Represents an error that occurred during game operations
 * 
 * @interface GameError
 * @example
 * ```typescript
 * const error: GameError = {
 *   code: 'CONNECTION_FAILED',
 *   message: 'Unable to connect to game server',
 *   details: { serverUrl: 'ws://localhost:3001', attempts: 3 },
 *   timestamp: new Date(),
 *   recoverable: true
 * };
 * ```
 */
export interface GameError {
  /** Standardized error code (see GameErrorCode enum) */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details for debugging */
  details?: any;
  /** When the error occurred */
  timestamp: Date;
  /** Whether the error can be recovered from automatically */
  recoverable: boolean;
}

/**
 * Represents a network message for debugging and monitoring
 * 
 * @interface NetworkMessage
 * @example
 * ```typescript
 * const message: NetworkMessage = {
 *   type: 'vote-word',
 *   data: { roomCode: 'ABC123', word: 'cat' },
 *   timestamp: new Date(),
 *   direction: 'sent'
 * };
 * ```
 */
export interface NetworkMessage {
  /** Type of the network message (e.g., 'vote-word', 'room-created') */
  type: string;
  /** Message payload data */
  data: any;
  /** When the message was sent/received */
  timestamp: Date;
  /** Whether the message was sent or received */
  direction: 'sent' | 'received';
}

/**
 * Callbacks for handling tie-breaker scenarios during voting
 * 
 * @interface TieBreakerCallbacks
 * @example
 * ```typescript
 * const callbacks: TieBreakerCallbacks = {
 *   onTieDetected: (tiedWords, winningWord) => {
 *     console.log('Tie detected between:', tiedWords);
 *     showTieBreakerModal(tiedWords, winningWord);
 *   },
 *   onTieResolved: (selectedWord) => {
 *     console.log('Tie resolved, chosen word:', selectedWord);
 *     hideTieBreakerModal();
 *   }
 * };
 * ```
 */
export interface TieBreakerCallbacks {
  /** Called when a voting tie is detected */
  onTieDetected: (tiedOptions: string[], winningWord: string) => void;
  /** Called when the tie has been resolved */
  onTieResolved: (selectedOption: string) => void;
}

/**
 * Callback function type for game state changes
 * 
 * @callback GameStateChangeCallback
 * @param {GameState} state - The new game state
 * @example
 * ```typescript
 * const onStateChange: GameStateChangeCallback = (state) => {
 *   console.log('Game phase changed to:', state.gamePhase);
 *   updateUI(state);
 * };
 * ```
 */
export type GameStateChangeCallback = (state: GameState) => void;

/**
 * Callback function type for game errors
 * 
 * @callback GameErrorCallback
 * @param {GameError} error - The error that occurred
 * @example
 * ```typescript
 * const onError: GameErrorCallback = (error) => {
 *   console.error('Game error:', error.message);
 *   showErrorModal(error);
 * };
 * ```
 */
export type GameErrorCallback = (error: GameError) => void;

/**
 * Main GameManager Interface
 * 
 * Provides a unified API for all game operations, abstracting away
 * networking details from UI components. This is the primary interface
 * that UI components should interact with for all game functionality.
 * 
 * @interface GameManager
 * @example
 * ```typescript
 * // Create a game manager instance
 * const gameManager = new SocketGameManager(
 *   (state) => console.log('State changed:', state),
 *   {
 *     onTieDetected: (words, winner) => showTieBreaker(words, winner),
 *     onTieResolved: (word) => hideTieBreaker()
 *   }
 * );
 * 
 * // Host a game
 * try {
 *   const roomCode = await gameManager.hostGame('Alice');
 *   console.log('Room created:', roomCode);
 * } catch (error) {
 *   console.error('Failed to host game:', error);
 * }
 * 
 * // Join a game
 * try {
 *   await gameManager.joinGame('Bob', 'ABC123');
 *   console.log('Joined game successfully');
 * } catch (error) {
 *   console.error('Failed to join game:', error);
 * }
 * ```
 */
export interface GameManager {
  // Connection Management
  /**
   * Host a new game room and become the room host
   * 
   * @param {string} playerName - Name of the host player (1-15 characters, no special chars)
   * @returns {Promise<string>} Promise that resolves to the 6-character room code
   * @throws {GameError} CONNECTION_FAILED if unable to connect to server
   * @throws {GameError} INVALID_PLAYER_NAME if player name is invalid
   * @throws {GameError} CONNECTION_TIMEOUT if connection times out
   * 
   * @example
   * ```typescript
   * try {
   *   const roomCode = await gameManager.hostGame('Alice');
   *   console.log('Game hosted with room code:', roomCode);
   *   // Room code will be something like 'ABC123'
   * } catch (error) {
   *   if (error.code === 'INVALID_PLAYER_NAME') {
   *     console.error('Please choose a valid player name');
   *   } else {
   *     console.error('Failed to host game:', error.message);
   *   }
   * }
   * ```
   */
  hostGame(playerName: string): Promise<string>;
  
  /**
   * Join an existing game room
   * 
   * @param {string} playerName - Name of the joining player (1-15 characters, no special chars)
   * @param {string} roomCode - 6-character room code to join
   * @returns {Promise<void>} Promise that resolves when successfully joined
   * @throws {GameError} ROOM_NOT_FOUND if room code doesn't exist
   * @throws {GameError} ROOM_FULL if room has reached maximum capacity
   * @throws {GameError} INVALID_ROOM_CODE if room code format is invalid
   * @throws {GameError} INVALID_PLAYER_NAME if player name is invalid
   * @throws {GameError} CONNECTION_FAILED if unable to connect to server
   * 
   * @example
   * ```typescript
   * try {
   *   await gameManager.joinGame('Bob', 'ABC123');
   *   console.log('Successfully joined the game');
   * } catch (error) {
   *   switch (error.code) {
   *     case 'ROOM_NOT_FOUND':
   *       console.error('Room not found. Check the room code.');
   *       break;
   *     case 'ROOM_FULL':
   *       console.error('Room is full. Try another room.');
   *       break;
   *     case 'INVALID_ROOM_CODE':
   *       console.error('Invalid room code format.');
   *       break;
   *     default:
   *       console.error('Failed to join game:', error.message);
   *   }
   * }
   * ```
   */
  joinGame(playerName: string, roomCode: string): Promise<void>;
  
  /**
   * Disconnect from the current game and clean up resources
   * 
   * This method gracefully disconnects from the server and notifies other
   * players that you have left the game. It does not throw errors.
   * 
   * @example
   * ```typescript
   * // Disconnect when user leaves the page
   * window.addEventListener('beforeunload', () => {
   *   gameManager.disconnect();
   * });
   * 
   * // Or disconnect when user clicks leave button
   * leaveButton.onclick = () => {
   *   gameManager.disconnect();
   *   navigateToMainMenu();
   * };
   * ```
   */
  disconnect(): void;
  
  /**
   * Get the current connection status
   * 
   * @returns {('connecting'|'connected'|'disconnected'|'error')} Current connection state
   * 
   * @example
   * ```typescript
   * const status = gameManager.getConnectionStatus();
   * switch (status) {
   *   case 'connecting':
   *     showLoadingSpinner();
   *     break;
   *   case 'connected':
   *     hideLoadingSpinner();
   *     break;
   *   case 'disconnected':
   *     showReconnectButton();
   *     break;
   *   case 'error':
   *     showErrorMessage();
   *     break;
   * }
   * ```
   */
  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Game Actions
  /**
   * Start the voting phase (host only)
   * 
   * This method transitions the game from lobby to voting phase. Only the
   * host can call this method. The server will generate word options and
   * notify all players to start voting.
   * 
   * @throws {GameError} UNAUTHORIZED_ACTION if called by non-host player
   * @throws {GameError} INVALID_GAME_STATE if not in lobby phase
   * @throws {GameError} CONNECTION_LOST if not connected to server
   * 
   * @example
   * ```typescript
   * // Host starts voting when ready
   * if (gameManager.isHost()) {
   *   try {
   *     gameManager.startVoting();
   *     console.log('Voting phase started');
   *   } catch (error) {
   *     if (error.code === 'UNAUTHORIZED_ACTION') {
   *       console.error('Only the host can start voting');
   *     }
   *   }
   * }
   * ```
   */
  startVoting(): void;
  
  /**
   * Vote for a word option during the voting phase
   * 
   * @param {string} word - The word to vote for (must be one of the available options)
   * @throws {GameError} INVALID_VOTE if word is not in available options
   * @throws {GameError} INVALID_GAME_STATE if not in voting phase
   * @throws {GameError} CONNECTION_LOST if not connected to server
   * 
   * @example
   * ```typescript
   * // Vote for a word when options are available
   * const gameState = gameManager.getGameState();
   * if (gameState?.gamePhase === 'voting' && gameState.wordOptions.length > 0) {
   *   try {
   *     gameManager.voteForWord('cat');
   *     console.log('Vote submitted for: cat');
   *   } catch (error) {
   *     if (error.code === 'INVALID_VOTE') {
   *       console.error('Please select a valid word option');
   *     }
   *   }
   * }
   * ```
   */
  voteForWord(word: string): void;
  
  /**
   * Submit a completed drawing for AI judging
   * 
   * @param {string} canvasData - Base64 encoded canvas image data (PNG format)
   * @throws {GameError} INVALID_DRAWING_DATA if canvas data is invalid or too large
   * @throws {GameError} INVALID_GAME_STATE if not in drawing phase
   * @throws {GameError} CONNECTION_LOST if not connected to server
   * 
   * @example
   * ```typescript
   * // Submit drawing from canvas element
   * const canvas = document.getElementById('drawingCanvas') as HTMLCanvasElement;
   * const canvasData = canvas.toDataURL('image/png');
   * 
   * try {
   *   gameManager.submitDrawing(canvasData);
   *   console.log('Drawing submitted successfully');
   * } catch (error) {
   *   if (error.code === 'INVALID_DRAWING_DATA') {
   *     console.error('Drawing data is invalid or too large');
   *   } else if (error.code === 'INVALID_GAME_STATE') {
   *     console.error('Cannot submit drawing outside of drawing phase');
   *   }
   * }
   * ```
   */
  submitDrawing(canvasData: string): void;
  
  /**
   * Mark drawing as finished (notifies server that player is done drawing)
   * 
   * This method tells the server that the player has finished their drawing,
   * even if they haven't submitted it yet. This can help speed up the game
   * flow by letting other players know when someone is done.
   * 
   * @example
   * ```typescript
   * // Mark as finished when player clicks "Done" button
   * doneButton.onclick = () => {
   *   gameManager.finishDrawing();
   *   console.log('Marked drawing as finished');
   * };
   * ```
   */
  finishDrawing(): void;
  
  /**
   * Resolve a tie-breaker situation (deprecated - server handles automatically)
   * 
   * @deprecated This method is kept for interface compatibility but does nothing.
   * The server now handles all tie-breaker resolution automatically.
   * 
   * @param {string} selectedOption - The chosen word from tied options (ignored)
   * 
   * @example
   * ```typescript
   * // This method no longer has any effect
   * gameManager.resolveTiebreaker('cat'); // Does nothing
   * ```
   */
  resolveTiebreaker(selectedOption: string): void;
  
  /**
   * Notify server that tiebreaker animation has completed
   * 
   * This method should be called when the client-side tiebreaker animation
   * finishes playing, so the server knows it can proceed to the next phase.
   * 
   * @example
   * ```typescript
   * // Call after tiebreaker animation completes
   * tiebreakerAnimation.onComplete = () => {
   *   gameManager.notifyTiebreakerAnimationComplete();
   *   console.log('Tiebreaker animation completed');
   * };
   * ```
   */
  notifyTiebreakerAnimationComplete(): void;
  
  /**
   * Send real-time drawing stroke data for spectating
   * 
   * This method sends individual drawing strokes to other players in real-time,
   * allowing them to see the drawing being created. This is optional and used
   * for enhanced spectating experience.
   * 
   * @param {any} strokeData - Drawing stroke information (coordinates, color, etc.)
   * 
   * @example
   * ```typescript
   * // Send stroke data during drawing
   * canvas.onMouseMove = (event) => {
   *   if (isDrawing) {
   *     const strokeData = {
   *       x: event.offsetX,
   *       y: event.offsetY,
   *       color: currentColor,
   *       brushSize: currentBrushSize
   *     };
   *     gameManager.sendDrawingStroke(strokeData);
   *   }
   * };
   * ```
   */
  sendDrawingStroke(strokeData: any): void;
  
  // State Management
  /**
   * Get the current game state
   * 
   * @returns {GameState | null} Current game state, or null if not in a game
   * 
   * @example
   * ```typescript
   * const gameState = gameManager.getGameState();
   * if (gameState) {
   *   console.log('Current phase:', gameState.gamePhase);
   *   console.log('Players:', gameState.players.length);
   *   console.log('Room code:', gameState.roomCode);
   * } else {
   *   console.log('Not currently in a game');
   * }
   * ```
   */
  getGameState(): GameState | null;
  
  /**
   * Register a callback for game state changes
   * 
   * The callback will be called whenever the game state changes, such as
   * when players join/leave, phases change, votes are cast, etc.
   * 
   * @param {GameStateChangeCallback} callback - Function to call when state changes
   * 
   * @example
   * ```typescript
   * const handleStateChange = (newState: GameState) => {
   *   console.log('Game state updated:', newState.gamePhase);
   *   
   *   // Update UI based on new state
   *   switch (newState.gamePhase) {
   *     case 'lobby':
   *       showLobbyScreen(newState);
   *       break;
   *     case 'voting':
   *       showVotingScreen(newState);
   *       break;
   *     case 'drawing':
   *       showDrawingScreen(newState);
   *       break;
   *     case 'results':
   *       showResultsScreen(newState);
   *       break;
   *   }
   * };
   * 
   * gameManager.onStateChange(handleStateChange);
   * ```
   */
  onStateChange(callback: GameStateChangeCallback): void;
  
  /**
   * Remove a previously registered state change callback
   * 
   * @param {GameStateChangeCallback} callback - The callback function to remove
   * 
   * @example
   * ```typescript
   * // Remove callback when component unmounts
   * useEffect(() => {
   *   const handleStateChange = (state: GameState) => {
   *     // Handle state change
   *   };
   *   
   *   gameManager.onStateChange(handleStateChange);
   *   
   *   // Cleanup on unmount
   *   return () => {
   *     gameManager.offStateChange(handleStateChange);
   *   };
   * }, []);
   * ```
   */
  offStateChange(callback: GameStateChangeCallback): void;
  
  // Error Handling
  /**
   * Register a callback for game errors
   * 
   * The callback will be called whenever an error occurs, such as connection
   * failures, validation errors, or server errors. Use this to show error
   * messages to users and handle error recovery.
   * 
   * @param {GameErrorCallback} callback - Function to call when errors occur
   * 
   * @example
   * ```typescript
   * const handleError = (error: GameError) => {
   *   console.error('Game error occurred:', error);
   *   
   *   // Show user-friendly error message
   *   switch (error.code) {
   *     case 'CONNECTION_FAILED':
   *       showErrorModal('Unable to connect to server. Please check your internet connection.');
   *       break;
   *     case 'ROOM_NOT_FOUND':
   *       showErrorModal('Room not found. Please check the room code.');
   *       break;
   *     case 'ROOM_FULL':
   *       showErrorModal('Room is full. Please try another room.');
   *       break;
   *     default:
   *       showErrorModal(error.message);
   *   }
   *   
   *   // Attempt recovery for recoverable errors
   *   if (error.recoverable) {
   *     showRetryButton(() => {
   *       // Retry the failed operation
   *     });
   *   }
   * };
   * 
   * gameManager.onError(handleError);
   * ```
   */
  onError(callback: GameErrorCallback): void;
  
  /**
   * Remove a previously registered error callback
   * 
   * @param {GameErrorCallback} callback - The callback function to remove
   * 
   * @example
   * ```typescript
   * // Remove error callback when component unmounts
   * useEffect(() => {
   *   const handleError = (error: GameError) => {
   *     // Handle error
   *   };
   *   
   *   gameManager.onError(handleError);
   *   
   *   // Cleanup on unmount
   *   return () => {
   *     gameManager.offError(handleError);
   *   };
   * }, []);
   * ```
   */
  offError(callback: GameErrorCallback): void;
  
  /**
   * Get the last error that occurred
   * 
   * @returns {GameError | null} The most recent error, or null if no errors
   * 
   * @example
   * ```typescript
   * const lastError = gameManager.getLastError();
   * if (lastError) {
   *   console.log('Last error:', lastError.message);
   *   console.log('Error code:', lastError.code);
   *   console.log('Recoverable:', lastError.recoverable);
   * }
   * ```
   */
  getLastError(): GameError | null;
  
  /**
   * Clear the last error from memory
   * 
   * Call this after handling an error to clear it from the error state.
   * This is useful for dismissing error messages and resetting error state.
   * 
   * @example
   * ```typescript
   * // Clear error when user dismisses error modal
   * errorModal.onDismiss = () => {
   *   gameManager.clearError();
   *   hideErrorModal();
   * };
   * ```
   */
  clearError(): void;
  
  // Utility Methods
  /**
   * Check if the current player is the host of the game
   * 
   * @returns {boolean} True if current player is the host, false otherwise
   * 
   * @example
   * ```typescript
   * if (gameManager.isHost()) {
   *   // Show host-only UI elements
   *   showStartGameButton();
   *   showKickPlayerButtons();
   * } else {
   *   // Show regular player UI
   *   hideHostControls();
   * }
   * ```
   */
  isHost(): boolean;
  
  /**
   * Get the current room code
   * 
   * @returns {string} The 6-character room code, or empty string if not in a room
   * 
   * @example
   * ```typescript
   * const roomCode = gameManager.getRoomCode();
   * if (roomCode) {
   *   displayRoomCode(roomCode);
   *   enableShareButton(roomCode);
   * }
   * ```
   */
  getRoomCode(): string;
  
  /**
   * Get information about the current player
   * 
   * @returns {Player | null} Current player object, or null if not in a game
   * 
   * @example
   * ```typescript
   * const currentPlayer = gameManager.getCurrentPlayer();
   * if (currentPlayer) {
   *   console.log('Player name:', currentPlayer.name);
   *   console.log('Player score:', currentPlayer.score);
   *   console.log('Has voted:', currentPlayer.hasVoted);
   * }
   * ```
   */
  getCurrentPlayer(): Player | null;
  
  /**
   * Set callbacks for tie-breaker events
   * 
   * These callbacks will be called when voting results in a tie and when
   * the tie is resolved. This allows the UI to show appropriate animations
   * and notifications.
   * 
   * @param {TieBreakerCallbacks} callbacks - Callbacks for tie breaker events
   * 
   * @example
   * ```typescript
   * gameManager.setTieBreakerCallbacks({
   *   onTieDetected: (tiedWords, winningWord) => {
   *     console.log('Voting tie detected between:', tiedWords);
   *     showTieBreakerAnimation(tiedWords, winningWord);
   *   },
   *   onTieResolved: (selectedWord) => {
   *     console.log('Tie resolved, chosen word:', selectedWord);
   *     hideTieBreakerAnimation();
   *     proceedToDrawingPhase(selectedWord);
   *   }
   * });
   * ```
   */
  setTieBreakerCallbacks(callbacks: TieBreakerCallbacks): void;
  
  /**
   * Clean up all resources and disconnect from the game
   * 
   * This method should be called when the GameManager is no longer needed,
   * such as when navigating away from the game or when the component unmounts.
   * It cleans up network connections, timers, and event listeners.
   * 
   * @example
   * ```typescript
   * // Clean up when component unmounts
   * useEffect(() => {
   *   return () => {
   *     gameManager.destroy();
   *   };
   * }, []);
   * 
   * // Or clean up when navigating away
   * window.addEventListener('beforeunload', () => {
   *   gameManager.destroy();
   * });
   * ```
   */
  destroy(): void;
  
  // Development Tools (only available in development mode)
  /**
   * Enable development mode features for testing and debugging
   * 
   * This method enables additional debugging capabilities such as state
   * simulation, network message logging, and automated testing features.
   * Only available in development builds.
   * 
   * @example
   * ```typescript
   * if (process.env.NODE_ENV === 'development') {
   *   gameManager.enableDevMode?.();
   *   console.log('Development mode enabled');
   * }
   * ```
   */
  enableDevMode?(): void;
  
  /**
   * Simulate a partial game state for testing purposes
   * 
   * This method allows developers to manually set game state for testing
   * different scenarios without going through the normal game flow.
   * Only available in development mode.
   * 
   * @param {Partial<GameState>} state - Partial game state to simulate
   * 
   * @example
   * ```typescript
   * // Simulate voting phase for testing
   * gameManager.simulateGameState?.({
   *   gamePhase: 'voting',
   *   wordOptions: ['cat', 'dog', 'bird'],
   *   players: [
   *     { id: '1', name: 'Alice', isHost: true, isConnected: true, hasVoted: false, hasSubmittedDrawing: false, score: 0 },
   *     { id: '2', name: 'Bob', isHost: false, isConnected: true, hasVoted: true, hasSubmittedDrawing: false, score: 0 }
   *   ]
   * });
   * ```
   */
  simulateGameState?(state: Partial<GameState>): void;
  
  /**
   * Get network message history for debugging
   * 
   * Returns an array of all network messages sent and received during the
   * current session. Useful for debugging network issues and understanding
   * message flow. Only available in development mode.
   * 
   * @returns {NetworkMessage[]} Array of network messages
   * 
   * @example
   * ```typescript
   * const messages = gameManager.getNetworkMessages?.() || [];
   * console.log('Total messages:', messages.length);
   * 
   * messages.forEach(msg => {
   *   console.log(`${msg.direction}: ${msg.type}`, msg.data);
   * });
   * ```
   */
  getNetworkMessages?(): NetworkMessage[];
  
  /**
   * Export current game session data for debugging
   * 
   * Returns a JSON string containing the current game state, network message
   * history, and other debugging information. This can be saved to a file
   * and imported later for debugging. Only available in development mode.
   * 
   * @returns {string} JSON string containing session data
   * 
   * @example
   * ```typescript
   * const sessionData = gameManager.exportGameSession?.();
   * if (sessionData) {
   *   // Save to file or send to debugging service
   *   const blob = new Blob([sessionData], { type: 'application/json' });
   *   const url = URL.createObjectURL(blob);
   *   const a = document.createElement('a');
   *   a.href = url;
   *   a.download = 'game-session.json';
   *   a.click();
   * }
   * ```
   */
  exportGameSession?(): string;
}

/**
 * Factory function type for creating GameManager instances
 * 
 * This type defines the signature for factory functions that create
 * GameManager instances. Useful for dependency injection and testing.
 * 
 * @callback GameManagerFactory
 * @param {GameStateChangeCallback} onStateChange - Callback for state changes
 * @param {TieBreakerCallbacks} [tieBreakerCallbacks] - Optional tie-breaker callbacks
 * @returns {GameManager} A new GameManager instance
 * 
 * @example
 * ```typescript
 * const createGameManager: GameManagerFactory = (onStateChange, tieBreakerCallbacks) => {
 *   return new SocketGameManager(onStateChange, tieBreakerCallbacks);
 * };
 * 
 * // Use the factory
 * const gameManager = createGameManager(
 *   (state) => console.log('State changed:', state),
 *   {
 *     onTieDetected: (words, winner) => showTieBreaker(words, winner),
 *     onTieResolved: (word) => hideTieBreaker()
 *   }
 * );
 * ```
 */
export type GameManagerFactory = (
  onStateChange: GameStateChangeCallback,
  tieBreakerCallbacks?: TieBreakerCallbacks
) => GameManager;

/**
 * Configuration options for GameManager instances
 * 
 * @interface GameManagerConfig
 * @example
 * ```typescript
 * const config: GameManagerConfig = {
 *   serverUrl: 'wss://game-server.example.com',
 *   reconnectAttempts: 5,
 *   reconnectDelay: 2000,
 *   connectionTimeout: 10000,
 *   enableDevMode: process.env.NODE_ENV === 'development',
 *   logLevel: 'info'
 * };
 * 
 * const gameManager = new SocketGameManager(onStateChange, tieBreakerCallbacks, config);
 * ```
 */
export interface GameManagerConfig {
  /** URL of the game server to connect to */
  serverUrl?: string;
  /** Maximum number of automatic reconnection attempts */
  reconnectAttempts?: number;
  /** Delay between reconnection attempts in milliseconds */
  reconnectDelay?: number;
  /** Connection timeout in milliseconds */
  connectionTimeout?: number;
  /** Whether to enable development mode features */
  enableDevMode?: boolean;
  /** Logging level for debugging */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Standardized error codes for game operations
 * 
 * These error codes provide consistent error identification across the application.
 * Each code represents a specific type of error that can occur during game operations.
 * 
 * @enum {string}
 * @example
 * ```typescript
 * // Check for specific error types
 * gameManager.onError((error) => {
 *   switch (error.code) {
 *     case GameErrorCode.CONNECTION_FAILED:
 *       showConnectionErrorDialog();
 *       break;
 *     case GameErrorCode.ROOM_NOT_FOUND:
 *       showRoomNotFoundMessage();
 *       break;
 *     case GameErrorCode.INVALID_PLAYER_NAME:
 *       highlightPlayerNameInput();
 *       break;
 *   }
 * });
 * ```
 */
export enum GameErrorCode {
  // Connection Errors
  /** Failed to establish connection to server */
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  /** Connection attempt timed out */
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  /** Lost connection to server during game */
  CONNECTION_LOST = 'CONNECTION_LOST',
  /** Server is unreachable or down */
  SERVER_UNREACHABLE = 'SERVER_UNREACHABLE',
  
  // Game Logic Errors
  /** Room with specified code does not exist */
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  /** Room has reached maximum player capacity */
  ROOM_FULL = 'ROOM_FULL',
  /** Room code format is invalid */
  INVALID_ROOM_CODE = 'INVALID_ROOM_CODE',
  /** Player not found in current game session */
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  /** Game is in an invalid state for the requested operation */
  INVALID_GAME_STATE = 'INVALID_GAME_STATE',
  /** Player is not authorized to perform this action */
  UNAUTHORIZED_ACTION = 'UNAUTHORIZED_ACTION',
  
  // Validation Errors
  /** Player name does not meet validation requirements */
  INVALID_PLAYER_NAME = 'INVALID_PLAYER_NAME',
  /** Drawing data is invalid or corrupted */
  INVALID_DRAWING_DATA = 'INVALID_DRAWING_DATA',
  /** Vote selection is invalid */
  INVALID_VOTE = 'INVALID_VOTE',
  
  // Rate Limiting
  /** Request rate limit exceeded */
  RATE_LIMITED = 'RATE_LIMITED',
  /** Too many requests in a short time period */
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Unknown/Generic
  /** Unknown or unexpected error occurred */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Helper function to create standardized GameError objects
 * 
 * This utility function ensures consistent GameError object creation
 * throughout the application with proper typing and default values.
 * 
 * @param {GameErrorCode} code - Standardized error code
 * @param {string} message - Human-readable error message
 * @param {any} [details] - Additional error details for debugging
 * @param {boolean} [recoverable=true] - Whether the error can be recovered from
 * @returns {GameError} A properly formatted GameError object
 * 
 * @example
 * ```typescript
 * // Create a connection error
 * const connectionError = createGameError(
 *   GameErrorCode.CONNECTION_FAILED,
 *   'Unable to connect to game server',
 *   { serverUrl: 'wss://game.example.com', attempts: 3 },
 *   true
 * );
 * 
 * // Create a validation error
 * const validationError = createGameError(
 *   GameErrorCode.INVALID_PLAYER_NAME,
 *   'Player name must be 1-15 characters',
 *   { providedName: 'VeryLongPlayerNameThatExceedsLimit' },
 *   false
 * );
 * ```
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
 * Type guard to check if an object implements the GameManager interface
 * 
 * This function performs runtime type checking to verify that an object
 * implements the required GameManager methods. Useful for validation
 * and type safety in dynamic scenarios.
 * 
 * @param {any} obj - Object to check
 * @returns {obj is GameManager} True if object implements GameManager interface
 * 
 * @example
 * ```typescript
 * function useGameManager(manager: unknown) {
 *   if (isGameManager(manager)) {
 *     // TypeScript now knows manager is a GameManager
 *     const state = manager.getGameState();
 *     manager.onStateChange((newState) => {
 *       console.log('State changed:', newState);
 *     });
 *   } else {
 *     throw new Error('Invalid GameManager implementation');
 *   }
 * }
 * 
 * // Usage with dependency injection
 * const manager = container.get('gameManager');
 * if (isGameManager(manager)) {
 *   await manager.hostGame('Alice');
 * }
 * ```
 */
export function isGameManager(obj: any): obj is GameManager {
  return !!(obj &&
    typeof obj.hostGame === 'function' &&
    typeof obj.joinGame === 'function' &&
    typeof obj.getGameState === 'function' &&
    typeof obj.onStateChange === 'function' &&
    typeof obj.destroy === 'function');
}