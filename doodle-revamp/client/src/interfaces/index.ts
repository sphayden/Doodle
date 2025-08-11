/**
 * Unified Interfaces Export
 * 
 * This file exports all interfaces used throughout the application,
 * providing a single import point for type definitions.
 */

// Main GameManager interface and related types
export type {
  GameManager,
  GameManagerFactory,
  GameManagerConfig,
  GameState,
  Player,
  GameResult,
  GameError,
  NetworkMessage,
  TieBreakerCallbacks,
  GameStateChangeCallback,
  GameErrorCallback
} from './GameManager';

export {
  GameErrorCode,
  createGameError,
  isGameManager
} from './GameManager';

// Network layer interfaces
export type {
  NetworkManager,
  NetworkEvents,
  NetworkConfig
} from './NetworkManager';

export {
  DEFAULT_NETWORK_CONFIG
} from './NetworkManager';

// Re-export commonly used types for convenience
export type GamePhase = 'lobby' | 'voting' | 'drawing' | 'judging' | 'results';
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Type utility for making all properties of an interface optional
 */
export type PartialGameState = Partial<import('./GameManager').GameState>;

/**
 * Type utility for picking specific properties from GameState
 */
export type GameStateSubset<K extends keyof import('./GameManager').GameState> = Pick<import('./GameManager').GameState, K>;

/**
 * Type for component props that need game state
 */
export interface GameStateProps {
  gameState: import('./GameManager').GameState | null;
}

/**
 * Type for component props that need game manager
 */
export interface GameManagerProps {
  gameManager: import('./GameManager').GameManager | null;
}

/**
 * Combined props for components that need both
 */
export interface GameProps extends GameStateProps, GameManagerProps {}

/**
 * Type for error boundary props
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: import('./GameManager').GameError;
}

/**
 * Type for development tools props
 */
export interface DevToolsProps {
  gameManager: import('./GameManager').GameManager;
  onSimulateTie: (tiedOptions: string[]) => void;
  onSimulateVoting: (wordOptions: string[], votes: Record<string, number>) => void;
  onSimulateGameStart: (word: string) => void;
}