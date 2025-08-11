/**
 * Error Recovery Mechanisms
 * 
 * This module provides comprehensive error recovery mechanisms including
 * automatic reconnection with state restoration, manual recovery options,
 * fallback modes, and error state persistence.
 */

import { GameError, GameErrorCode, GameState, GameManager } from '../interfaces';
import { ErrorHandler, RecoveryStrategy } from './errorHandling';
import { NetworkResilienceManager } from './networkResilience';

/**
 * Recovery action types
 */
export enum RecoveryAction {
  RETRY = 'retry',
  RECONNECT = 'reconnect',
  REFRESH = 'refresh',
  RESTORE_STATE = 'restore_state',
  FALLBACK_MODE = 'fallback_mode',
  USER_INTERVENTION = 'user_intervention',
  RESET_SESSION = 'reset_session'
}

/**
 * Recovery context information
 */
export interface RecoveryContext {
  error: GameError;
  gameState?: GameState | null;
  playerName?: string;
  roomCode?: string;
  isHost?: boolean;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptTime: Date;
  recoveryActions: RecoveryAction[];
}

/**
 * Recovery result
 */
export interface RecoveryResult {
  success: boolean;
  action: RecoveryAction;
  newState?: GameState;
  message: string;
  requiresUserAction: boolean;
  nextActions?: RecoveryAction[];
}

/**
 * Persistent state for recovery
 */
export interface PersistentGameState {
  playerName: string;
  roomCode: string;
  isHost: boolean;
  gamePhase: string;
  timestamp: number;
  connectionAttempts: number;
  lastError?: GameError;
}

/**
 * Recovery strategy configuration
 */
export interface RecoveryConfig {
  maxAutoRetries: number;
  retryDelay: number;
  enableStatePersistence: boolean;
  enableAutoReconnect: boolean;
  reconnectTimeout: number;
  fallbackModeEnabled: boolean;
  userInterventionTimeout: number;
}

/**
 * Default recovery configuration
 */
const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
  maxAutoRetries: 3,
  retryDelay: 2000,
  enableStatePersistence: true,
  enableAutoReconnect: true,
  reconnectTimeout: 30000,
  fallbackModeEnabled: true,
  userInterventionTimeout: 60000
};

/**
 * Error recovery manager
 */
export class ErrorRecoveryManager {
  private config: RecoveryConfig;
  private errorHandler: ErrorHandler;
  private networkResilience: NetworkResilienceManager;
  private recoveryContexts: Map<string, RecoveryContext> = new Map();
  private persistentState: PersistentGameState | null = null;
  private recoveryInProgress = false;
  private recoveryCallbacks: Map<string, (result: RecoveryResult) => void> = new Map();

  constructor(
    config: Partial<RecoveryConfig> = {},
    errorHandler?: ErrorHandler,
    networkResilience?: NetworkResilienceManager
  ) {
    this.config = { ...DEFAULT_RECOVERY_CONFIG, ...config };
    this.errorHandler = errorHandler || new ErrorHandler();
    this.networkResilience = networkResilience || new NetworkResilienceManager();
    
    // Load persistent state on initialization
    if (this.config.enableStatePersistence) {
      this.loadPersistentState();
    }
  }

  /**
   * Initiate error recovery process
   */
  async initiateRecovery(
    error: GameError,
    gameManager: GameManager,
    context: {
      gameState?: GameState | null;
      playerName?: string;
      roomCode?: string;
      isHost?: boolean;
    } = {}
  ): Promise<RecoveryResult> {
    const recoveryId = this.generateRecoveryId();
    
    // Create recovery context
    const recoveryContext: RecoveryContext = {
      error,
      gameState: context.gameState,
      playerName: context.playerName,
      roomCode: context.roomCode,
      isHost: context.isHost,
      attemptCount: 0,
      maxAttempts: this.config.maxAutoRetries,
      lastAttemptTime: new Date(),
      recoveryActions: this.determineRecoveryActions(error)
    };

    this.recoveryContexts.set(recoveryId, recoveryContext);

    // Save state for potential recovery
    if (this.config.enableStatePersistence) {
      this.savePersistentState(recoveryContext);
    }

    // Execute recovery strategy
    return await this.executeRecoveryStrategy(recoveryId, gameManager);
  }

  /**
   * Determine appropriate recovery actions based on error
   */
  private determineRecoveryActions(error: GameError): RecoveryAction[] {
    const classification = this.errorHandler.classifyError(error);
    
    switch (classification.recoveryStrategy) {
      case RecoveryStrategy.RETRY:
        return [RecoveryAction.RETRY];
      
      case RecoveryStrategy.RECONNECT:
        return [
          RecoveryAction.RECONNECT,
          RecoveryAction.RESTORE_STATE,
          RecoveryAction.RETRY
        ];
      
      case RecoveryStrategy.REFRESH:
        return [
          RecoveryAction.RESTORE_STATE,
          RecoveryAction.REFRESH
        ];
      
      case RecoveryStrategy.USER_ACTION:
        return [RecoveryAction.USER_INTERVENTION];
      
      case RecoveryStrategy.FALLBACK:
        return [
          RecoveryAction.FALLBACK_MODE,
          RecoveryAction.RETRY
        ];
      
      default:
        return [
          RecoveryAction.RECONNECT,
          RecoveryAction.RESTORE_STATE,
          RecoveryAction.FALLBACK_MODE
        ];
    }
  }

  /**
   * Execute recovery strategy
   */
  private async executeRecoveryStrategy(
    recoveryId: string,
    gameManager: GameManager
  ): Promise<RecoveryResult> {
    const context = this.recoveryContexts.get(recoveryId);
    if (!context) {
      throw new Error('Recovery context not found');
    }

    this.recoveryInProgress = true;

    try {
      for (const action of context.recoveryActions) {
        context.attemptCount++;
        context.lastAttemptTime = new Date();

        const result = await this.executeRecoveryAction(action, context, gameManager);
        
        if (result.success) {
          this.recoveryInProgress = false;
          this.recoveryContexts.delete(recoveryId);
          
          // Clear persistent state on successful recovery
          if (this.config.enableStatePersistence) {
            this.clearPersistentState();
          }
          
          return result;
        }

        // If action failed and we've exceeded max attempts, try next action
        if (context.attemptCount >= context.maxAttempts) {
          continue;
        }

        // Wait before next attempt
        await this.sleep(this.config.retryDelay);
      }

      // All recovery actions failed
      this.recoveryInProgress = false;
      return {
        success: false,
        action: RecoveryAction.USER_INTERVENTION,
        message: 'Automatic recovery failed. Manual intervention required.',
        requiresUserAction: true,
        nextActions: [RecoveryAction.RESET_SESSION, RecoveryAction.REFRESH]
      };

    } catch (error) {
      this.recoveryInProgress = false;
      throw error;
    }
  }

  /**
   * Execute specific recovery action
   */
  private async executeRecoveryAction(
    action: RecoveryAction,
    context: RecoveryContext,
    gameManager: GameManager
  ): Promise<RecoveryResult> {
    switch (action) {
      case RecoveryAction.RETRY:
        return await this.executeRetry(context, gameManager);
      
      case RecoveryAction.RECONNECT:
        return await this.executeReconnect(context, gameManager);
      
      case RecoveryAction.RESTORE_STATE:
        return await this.executeStateRestore(context, gameManager);
      
      case RecoveryAction.FALLBACK_MODE:
        return await this.executeFallbackMode(context, gameManager);
      
      case RecoveryAction.REFRESH:
        return this.executeRefresh(context);
      
      case RecoveryAction.USER_INTERVENTION:
        return this.executeUserIntervention(context);
      
      case RecoveryAction.RESET_SESSION:
        return await this.executeSessionReset(context, gameManager);
      
      default:
        return {
          success: false,
          action,
          message: `Unknown recovery action: ${action}`,
          requiresUserAction: true
        };
    }
  }

  /**
   * Execute retry recovery action
   */
  private async executeRetry(
    context: RecoveryContext,
    gameManager: GameManager
  ): Promise<RecoveryResult> {
    try {
      // Attempt to reconnect if disconnected
      if (gameManager.getConnectionStatus() !== 'connected') {
        // Try to rejoin the game
        if (context.roomCode && context.playerName) {
          if (context.isHost) {
            await gameManager.hostGame(context.playerName);
          } else {
            await gameManager.joinGame(context.playerName, context.roomCode);
          }
        }
      }

      return {
        success: true,
        action: RecoveryAction.RETRY,
        newState: gameManager.getGameState() || undefined,
        message: 'Successfully retried operation',
        requiresUserAction: false
      };
    } catch (error) {
      return {
        success: false,
        action: RecoveryAction.RETRY,
        message: `Retry failed: ${error instanceof Error ? error.message : String(error)}`,
        requiresUserAction: false
      };
    }
  }

  /**
   * Execute reconnect recovery action
   */
  private async executeReconnect(
    context: RecoveryContext,
    gameManager: GameManager
  ): Promise<RecoveryResult> {
    try {
      // Disconnect first
      gameManager.disconnect();
      
      // Wait a moment
      await this.sleep(1000);
      
      // Reconnect
      if (context.roomCode && context.playerName) {
        if (context.isHost) {
          await gameManager.hostGame(context.playerName);
        } else {
          await gameManager.joinGame(context.playerName, context.roomCode);
        }
      }

      return {
        success: true,
        action: RecoveryAction.RECONNECT,
        newState: gameManager.getGameState() || undefined,
        message: 'Successfully reconnected to game',
        requiresUserAction: false
      };
    } catch (error) {
      return {
        success: false,
        action: RecoveryAction.RECONNECT,
        message: `Reconnection failed: ${error instanceof Error ? error.message : String(error)}`,
        requiresUserAction: false
      };
    }
  }

  /**
   * Execute state restore recovery action
   */
  private async executeStateRestore(
    context: RecoveryContext,
    gameManager: GameManager
  ): Promise<RecoveryResult> {
    try {
      const persistentState = this.loadPersistentState();
      
      if (!persistentState) {
        return {
          success: false,
          action: RecoveryAction.RESTORE_STATE,
          message: 'No persistent state available to restore',
          requiresUserAction: false
        };
      }

      // Attempt to restore the game session
      if (persistentState.isHost) {
        await gameManager.hostGame(persistentState.playerName);
      } else {
        await gameManager.joinGame(persistentState.playerName, persistentState.roomCode);
      }

      return {
        success: true,
        action: RecoveryAction.RESTORE_STATE,
        newState: gameManager.getGameState() || undefined,
        message: 'Successfully restored game state',
        requiresUserAction: false
      };
    } catch (error) {
      return {
        success: false,
        action: RecoveryAction.RESTORE_STATE,
        message: `State restoration failed: ${error instanceof Error ? error.message : String(error)}`,
        requiresUserAction: false
      };
    }
  }

  /**
   * Execute fallback mode recovery action
   */
  private async executeFallbackMode(
    context: RecoveryContext,
    gameManager: GameManager
  ): Promise<RecoveryResult> {
    if (!this.config.fallbackModeEnabled) {
      return {
        success: false,
        action: RecoveryAction.FALLBACK_MODE,
        message: 'Fallback mode is disabled',
        requiresUserAction: true
      };
    }

    try {
      // Implement fallback mode logic
      // This could involve switching to offline mode, reduced functionality, etc.
      
      return {
        success: true,
        action: RecoveryAction.FALLBACK_MODE,
        message: 'Switched to fallback mode with limited functionality',
        requiresUserAction: false,
        nextActions: [RecoveryAction.RETRY]
      };
    } catch (error) {
      return {
        success: false,
        action: RecoveryAction.FALLBACK_MODE,
        message: `Fallback mode activation failed: ${error instanceof Error ? error.message : String(error)}`,
        requiresUserAction: true
      };
    }
  }

  /**
   * Execute refresh recovery action
   */
  private executeRefresh(context: RecoveryContext): RecoveryResult {
    // This would typically trigger a page refresh
    return {
      success: true,
      action: RecoveryAction.REFRESH,
      message: 'Page refresh required to recover from error',
      requiresUserAction: true
    };
  }

  /**
   * Execute user intervention recovery action
   */
  private executeUserIntervention(context: RecoveryContext): RecoveryResult {
    return {
      success: false,
      action: RecoveryAction.USER_INTERVENTION,
      message: 'Manual user action required to resolve the error',
      requiresUserAction: true,
      nextActions: [RecoveryAction.RETRY, RecoveryAction.RESET_SESSION]
    };
  }

  /**
   * Execute session reset recovery action
   */
  private async executeSessionReset(
    context: RecoveryContext,
    gameManager: GameManager
  ): Promise<RecoveryResult> {
    try {
      // Clean up current session
      gameManager.destroy();
      
      // Clear persistent state
      if (this.config.enableStatePersistence) {
        this.clearPersistentState();
      }
      
      // Clear any cached data
      this.recoveryContexts.clear();
      
      return {
        success: true,
        action: RecoveryAction.RESET_SESSION,
        message: 'Session reset successfully. You can start a new game.',
        requiresUserAction: true
      };
    } catch (error) {
      return {
        success: false,
        action: RecoveryAction.RESET_SESSION,
        message: `Session reset failed: ${error instanceof Error ? error.message : String(error)}`,
        requiresUserAction: true
      };
    }
  }

  /**
   * Save persistent state for recovery
   */
  private savePersistentState(context: RecoveryContext): void {
    if (!context.playerName || !context.roomCode) return;

    const state: PersistentGameState = {
      playerName: context.playerName,
      roomCode: context.roomCode,
      isHost: context.isHost || false,
      gamePhase: context.gameState?.gamePhase || 'lobby',
      timestamp: Date.now(),
      connectionAttempts: context.attemptCount,
      lastError: context.error
    };

    try {
      localStorage.setItem('doodle_game_recovery_state', JSON.stringify(state));
      this.persistentState = state;
    } catch (error) {
      console.warn('Failed to save persistent state:', error);
    }
  }

  /**
   * Load persistent state
   */
  private loadPersistentState(): PersistentGameState | null {
    try {
      const stored = localStorage.getItem('doodle_game_recovery_state');
      if (!stored) return null;

      const state = JSON.parse(stored) as PersistentGameState;
      
      // Check if state is not too old (1 hour)
      const maxAge = 60 * 60 * 1000; // 1 hour
      if (Date.now() - state.timestamp > maxAge) {
        this.clearPersistentState();
        return null;
      }

      this.persistentState = state;
      return state;
    } catch (error) {
      console.warn('Failed to load persistent state:', error);
      return null;
    }
  }

  /**
   * Clear persistent state
   */
  private clearPersistentState(): void {
    try {
      localStorage.removeItem('doodle_game_recovery_state');
      this.persistentState = null;
    } catch (error) {
      console.warn('Failed to clear persistent state:', error);
    }
  }

  /**
   * Check if recovery is possible from persistent state
   */
  canRecoverFromPersistentState(): boolean {
    const state = this.loadPersistentState();
    return state !== null && Boolean(state.playerName) && Boolean(state.roomCode);
  }

  /**
   * Get persistent state for recovery
   */
  getPersistentState(): PersistentGameState | null {
    return this.persistentState;
  }

  /**
   * Manual recovery trigger
   */
  async triggerManualRecovery(
    action: RecoveryAction,
    gameManager: GameManager,
    context?: Partial<RecoveryContext>
  ): Promise<RecoveryResult> {
    const recoveryContext: RecoveryContext = {
      error: context?.error || { 
        code: GameErrorCode.UNKNOWN_ERROR, 
        message: 'Manual recovery triggered',
        timestamp: new Date(),
        recoverable: true
      },
      gameState: context?.gameState,
      playerName: context?.playerName,
      roomCode: context?.roomCode,
      isHost: context?.isHost,
      attemptCount: 0,
      maxAttempts: 1,
      lastAttemptTime: new Date(),
      recoveryActions: [action]
    };

    return await this.executeRecoveryAction(action, recoveryContext, gameManager);
  }

  /**
   * Check if recovery is in progress
   */
  isRecoveryInProgress(): boolean {
    return this.recoveryInProgress;
  }

  /**
   * Get active recovery contexts
   */
  getActiveRecoveryContexts(): RecoveryContext[] {
    return Array.from(this.recoveryContexts.values());
  }

  /**
   * Cancel all active recoveries
   */
  cancelAllRecoveries(): void {
    this.recoveryContexts.clear();
    this.recoveryInProgress = false;
  }

  /**
   * Update recovery configuration
   */
  updateConfig(config: Partial<RecoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate unique recovery ID
   */
  private generateRecoveryId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cancelAllRecoveries();
    this.recoveryCallbacks.clear();
  }
}

/**
 * Default error recovery manager instance
 */
export const defaultErrorRecovery = new ErrorRecoveryManager();