/**
 * Error Classification and Handling Utilities
 * 
 * This module provides comprehensive error handling utilities including
 * error classification, user-friendly message mapping, logging, and
 * recovery strategy determination.
 */

import { GameError, GameErrorCode } from '../interfaces';

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  CONNECTION = 'connection',
  VALIDATION = 'validation',
  GAME_LOGIC = 'game_logic',
  RATE_LIMITING = 'rate_limiting',
  UNKNOWN = 'unknown'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',           // Minor issues, user can continue
  MEDIUM = 'medium',     // Noticeable issues, some functionality affected
  HIGH = 'high',         // Major issues, significant functionality lost
  CRITICAL = 'critical'  // Critical issues, app unusable
}

/**
 * Recovery strategies for different error types
 */
export enum RecoveryStrategy {
  RETRY = 'retry',                    // Simple retry
  RECONNECT = 'reconnect',           // Reconnect to server
  REFRESH = 'refresh',               // Refresh page
  USER_ACTION = 'user_action',       // User needs to take action
  FALLBACK = 'fallback',             // Use fallback functionality
  NONE = 'none'                      // No recovery possible
}

/**
 * Error classification result
 */
export interface ErrorClassification {
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoveryStrategy: RecoveryStrategy;
  userMessage: string;
  technicalMessage: string;
  suggestions: string[];
  retryable: boolean;
  autoRetry: boolean;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Error logging configuration
 */
export interface ErrorLogConfig {
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableConsoleLog: boolean;
  enableRemoteLogging: boolean;
  remoteEndpoint?: string;
  includeStackTrace: boolean;
  includeUserAgent: boolean;
  includeTimestamp: boolean;
}

/**
 * Default error log configuration
 */
const DEFAULT_LOG_CONFIG: ErrorLogConfig = {
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  enableConsoleLog: true,
  enableRemoteLogging: false,
  includeStackTrace: process.env.NODE_ENV === 'development',
  includeUserAgent: true,
  includeTimestamp: true
};

/**
 * Error classification mapping
 */
const ERROR_CLASSIFICATIONS: Record<GameErrorCode, ErrorClassification> = {
  // Connection Errors
  [GameErrorCode.CONNECTION_FAILED]: {
    category: ErrorCategory.CONNECTION,
    severity: ErrorSeverity.HIGH,
    recoveryStrategy: RecoveryStrategy.RECONNECT,
    userMessage: 'Unable to connect to the game server',
    technicalMessage: 'Network connection failed',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Contact support if the problem persists'
    ],
    retryable: true,
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 2000
  },

  [GameErrorCode.CONNECTION_TIMEOUT]: {
    category: ErrorCategory.CONNECTION,
    severity: ErrorSeverity.MEDIUM,
    recoveryStrategy: RecoveryStrategy.RETRY,
    userMessage: 'Connection timed out',
    technicalMessage: 'Network request timed out',
    suggestions: [
      'Check your internet connection speed',
      'Try again in a moment',
      'Move closer to your WiFi router'
    ],
    retryable: true,
    autoRetry: true,
    maxRetries: 2,
    retryDelay: 3000
  },

  [GameErrorCode.CONNECTION_LOST]: {
    category: ErrorCategory.CONNECTION,
    severity: ErrorSeverity.HIGH,
    recoveryStrategy: RecoveryStrategy.RECONNECT,
    userMessage: 'Connection to server lost',
    technicalMessage: 'WebSocket connection dropped',
    suggestions: [
      'We\'re attempting to reconnect automatically',
      'Check your internet connection',
      'Refresh the page if reconnection fails'
    ],
    retryable: true,
    autoRetry: true,
    maxRetries: 5,
    retryDelay: 2000
  },

  [GameErrorCode.SERVER_UNREACHABLE]: {
    category: ErrorCategory.CONNECTION,
    severity: ErrorSeverity.CRITICAL,
    recoveryStrategy: RecoveryStrategy.REFRESH,
    userMessage: 'Game server is currently unavailable',
    technicalMessage: 'Server is unreachable',
    suggestions: [
      'The server may be temporarily down',
      'Try refreshing the page',
      'Check our status page for updates'
    ],
    retryable: true,
    autoRetry: false,
    maxRetries: 1,
    retryDelay: 10000
  },

  // Game Logic Errors
  [GameErrorCode.ROOM_NOT_FOUND]: {
    category: ErrorCategory.GAME_LOGIC,
    severity: ErrorSeverity.MEDIUM,
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    userMessage: 'Room not found',
    technicalMessage: 'Specified room code does not exist',
    suggestions: [
      'Double-check the room code',
      'Ask the host for the correct code',
      'Make sure the room hasn\'t expired'
    ],
    retryable: false,
    autoRetry: false,
    maxRetries: 0,
    retryDelay: 0
  },

  [GameErrorCode.ROOM_FULL]: {
    category: ErrorCategory.GAME_LOGIC,
    severity: ErrorSeverity.MEDIUM,
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    userMessage: 'Room is full',
    technicalMessage: 'Room has reached maximum player capacity',
    suggestions: [
      'Try joining a different room',
      'Wait for a player to leave',
      'Ask the host to create a new room'
    ],
    retryable: true,
    autoRetry: false,
    maxRetries: 1,
    retryDelay: 5000
  },

  [GameErrorCode.INVALID_ROOM_CODE]: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    userMessage: 'Invalid room code format',
    technicalMessage: 'Room code format validation failed',
    suggestions: [
      'Room codes are 6 characters long',
      'Check for typos in the room code',
      'Ask the host to share the code again'
    ],
    retryable: false,
    autoRetry: false,
    maxRetries: 0,
    retryDelay: 0
  },

  [GameErrorCode.PLAYER_NOT_FOUND]: {
    category: ErrorCategory.GAME_LOGIC,
    severity: ErrorSeverity.MEDIUM,
    recoveryStrategy: RecoveryStrategy.RECONNECT,
    userMessage: 'Player session not found',
    technicalMessage: 'Player not found in game session',
    suggestions: [
      'Try rejoining the room',
      'Check if you were disconnected',
      'Ask the host to restart the game'
    ],
    retryable: true,
    autoRetry: true,
    maxRetries: 2,
    retryDelay: 1000
  },

  [GameErrorCode.INVALID_GAME_STATE]: {
    category: ErrorCategory.GAME_LOGIC,
    severity: ErrorSeverity.HIGH,
    recoveryStrategy: RecoveryStrategy.REFRESH,
    userMessage: 'Game state error',
    technicalMessage: 'Invalid game state detected',
    suggestions: [
      'Try refreshing the page',
      'Rejoin the room if possible',
      'Contact support if this persists'
    ],
    retryable: true,
    autoRetry: false,
    maxRetries: 1,
    retryDelay: 0
  },

  [GameErrorCode.UNAUTHORIZED_ACTION]: {
    category: ErrorCategory.GAME_LOGIC,
    severity: ErrorSeverity.MEDIUM,
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    userMessage: 'Action not allowed',
    technicalMessage: 'Unauthorized action attempted',
    suggestions: [
      'Make sure you have permission for this action',
      'Check if you\'re the host when required',
      'Wait for the correct game phase'
    ],
    retryable: false,
    autoRetry: false,
    maxRetries: 0,
    retryDelay: 0
  },

  // Validation Errors
  [GameErrorCode.INVALID_PLAYER_NAME]: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    userMessage: 'Invalid player name',
    technicalMessage: 'Player name validation failed',
    suggestions: [
      'Use 1-15 characters for your name',
      'Avoid special characters',
      'Choose a different name'
    ],
    retryable: false,
    autoRetry: false,
    maxRetries: 0,
    retryDelay: 0
  },

  [GameErrorCode.INVALID_DRAWING_DATA]: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    recoveryStrategy: RecoveryStrategy.RETRY,
    userMessage: 'Drawing submission failed',
    technicalMessage: 'Invalid drawing data format',
    suggestions: [
      'Try submitting your drawing again',
      'Make sure you\'ve drawn something',
      'Clear and redraw if the problem persists'
    ],
    retryable: true,
    autoRetry: false,
    maxRetries: 2,
    retryDelay: 1000
  },

  [GameErrorCode.INVALID_VOTE]: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    userMessage: 'Invalid vote selection',
    technicalMessage: 'Vote validation failed',
    suggestions: [
      'Select one of the available options',
      'Make sure voting is still open',
      'Try voting again'
    ],
    retryable: true,
    autoRetry: false,
    maxRetries: 1,
    retryDelay: 500
  },

  // Rate Limiting
  [GameErrorCode.RATE_LIMITED]: {
    category: ErrorCategory.RATE_LIMITING,
    severity: ErrorSeverity.MEDIUM,
    recoveryStrategy: RecoveryStrategy.RETRY,
    userMessage: 'Too many requests',
    technicalMessage: 'Rate limit exceeded',
    suggestions: [
      'Please wait a moment before trying again',
      'Avoid rapid clicking or actions',
      'The limit will reset shortly'
    ],
    retryable: true,
    autoRetry: true,
    maxRetries: 1,
    retryDelay: 5000
  },

  [GameErrorCode.TOO_MANY_REQUESTS]: {
    category: ErrorCategory.RATE_LIMITING,
    severity: ErrorSeverity.HIGH,
    recoveryStrategy: RecoveryStrategy.RETRY,
    userMessage: 'Request limit exceeded',
    technicalMessage: 'Too many requests in short time',
    suggestions: [
      'Please wait before making more requests',
      'Try again in a few minutes',
      'Contact support if this persists'
    ],
    retryable: true,
    autoRetry: false,
    maxRetries: 1,
    retryDelay: 30000
  },

  // Unknown/Generic
  [GameErrorCode.UNKNOWN_ERROR]: {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.HIGH,
    recoveryStrategy: RecoveryStrategy.REFRESH,
    userMessage: 'An unexpected error occurred',
    technicalMessage: 'Unknown error',
    suggestions: [
      'Try refreshing the page',
      'Check your internet connection',
      'Contact support if the problem persists'
    ],
    retryable: true,
    autoRetry: false,
    maxRetries: 1,
    retryDelay: 2000
  }
};

/**
 * Error handler class for managing error processing and logging
 */
export class ErrorHandler {
  private config: ErrorLogConfig;
  private errorCounts: Map<string, number> = new Map();
  private lastErrors: Map<string, number> = new Map();

  constructor(config: Partial<ErrorLogConfig> = {}) {
    this.config = { ...DEFAULT_LOG_CONFIG, ...config };
  }

  /**
   * Classify an error and get handling information
   */
  classifyError(error: GameError): ErrorClassification {
    const classification = ERROR_CLASSIFICATIONS[error.code as GameErrorCode];
    
    if (!classification) {
      return ERROR_CLASSIFICATIONS[GameErrorCode.UNKNOWN_ERROR];
    }

    return classification;
  }

  /**
   * Process an error with full classification and logging
   */
  processError(error: GameError): ErrorClassification {
    const classification = this.classifyError(error);
    
    // Update error tracking
    this.trackError(error);
    
    // Log the error
    this.logError(error, classification);
    
    return classification;
  }

  /**
   * Track error frequency and patterns
   */
  private trackError(error: GameError): void {
    const errorKey = `${error.code}:${error.message}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
    this.lastErrors.set(errorKey, Date.now());
  }

  /**
   * Check if error should be throttled (too frequent)
   */
  shouldThrottleError(error: GameError): boolean {
    const errorKey = `${error.code}:${error.message}`;
    const lastOccurrence = this.lastErrors.get(errorKey);
    const count = this.errorCounts.get(errorKey) || 0;
    
    if (!lastOccurrence) return false;
    
    const timeSinceLastError = Date.now() - lastOccurrence;
    const throttleThreshold = 5000; // 5 seconds
    
    return timeSinceLastError < throttleThreshold && count > 3;
  }

  /**
   * Log error with appropriate level and details
   */
  private logError(error: GameError, classification: ErrorClassification): void {
    if (!this.config.enableConsoleLog) return;

    const logData = {
      timestamp: this.config.includeTimestamp ? new Date().toISOString() : undefined,
      code: error.code,
      message: error.message,
      category: classification.category,
      severity: classification.severity,
      recoverable: error.recoverable,
      details: error.details,
      userAgent: this.config.includeUserAgent ? navigator.userAgent : undefined,
      stackTrace: this.config.includeStackTrace ? new Error().stack : undefined
    };

    // Log based on severity
    switch (classification.severity) {
      case ErrorSeverity.LOW:
        if (this.config.logLevel === 'debug') {
          console.debug('🔍 Game Error (Low):', logData);
        }
        break;
      
      case ErrorSeverity.MEDIUM:
        if (['debug', 'info', 'warn'].includes(this.config.logLevel)) {
          console.warn('⚠️ Game Error (Medium):', logData);
        }
        break;
      
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        console.error('🚨 Game Error (High/Critical):', logData);
        break;
    }

    // Send to remote logging if enabled
    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      this.sendToRemoteLogging(logData);
    }
  }

  /**
   * Send error to remote logging service
   */
  private async sendToRemoteLogging(logData: any): Promise<void> {
    try {
      if (!this.config.remoteEndpoint) return;
      
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      console.warn('Failed to send error to remote logging:', error);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { errorCode: string; count: number; lastOccurrence: Date }[] {
    return Array.from(this.errorCounts.entries()).map(([errorKey, count]) => ({
      errorCode: errorKey,
      count,
      lastOccurrence: new Date(this.lastErrors.get(errorKey) || 0)
    }));
  }

  /**
   * Clear error tracking data
   */
  clearErrorStats(): void {
    this.errorCounts.clear();
    this.lastErrors.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorLogConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Create user-friendly error message from GameError
 */
export function createUserFriendlyMessage(error: GameError): string {
  const classification = ERROR_CLASSIFICATIONS[error.code as GameErrorCode];
  
  if (!classification) {
    return error.message || 'An unexpected error occurred';
  }

  return classification.userMessage;
}

/**
 * Get recovery suggestions for an error
 */
export function getRecoverySuggestions(error: GameError): string[] {
  const classification = ERROR_CLASSIFICATIONS[error.code as GameErrorCode];
  
  if (!classification) {
    return ['Try refreshing the page', 'Contact support if the problem persists'];
  }

  return classification.suggestions;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: GameError): boolean {
  const classification = ERROR_CLASSIFICATIONS[error.code as GameErrorCode];
  return classification?.retryable || false;
}

/**
 * Get retry configuration for an error
 */
export function getRetryConfig(error: GameError): { maxRetries: number; delay: number; autoRetry: boolean } {
  const classification = ERROR_CLASSIFICATIONS[error.code as GameErrorCode];
  
  if (!classification) {
    return { maxRetries: 0, delay: 0, autoRetry: false };
  }

  return {
    maxRetries: classification.maxRetries,
    delay: classification.retryDelay,
    autoRetry: classification.autoRetry
  };
}

/**
 * Default error handler instance
 */
export const defaultErrorHandler = new ErrorHandler();

/**
 * Convenience function to process errors
 */
export function handleError(error: GameError): ErrorClassification {
  return defaultErrorHandler.processError(error);
}