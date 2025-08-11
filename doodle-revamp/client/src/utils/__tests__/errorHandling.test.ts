import { ErrorHandler, createUserFriendlyMessage, isRetryableError, getRetryConfig } from '../errorHandling';
import { GameErrorCode, createGameError } from '../../interfaces';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler({
      enableConsoleLog: false // Disable console logging in tests
    });
  });

  test('should classify connection errors correctly', () => {
    const error = createGameError(
      GameErrorCode.CONNECTION_FAILED,
      'Connection failed',
      {},
      true
    );

    const classification = errorHandler.classifyError(error);

    expect(classification.category).toBe('connection');
    expect(classification.severity).toBe('high');
    expect(classification.recoveryStrategy).toBe('reconnect');
    expect(classification.retryable).toBe(true);
    expect(classification.autoRetry).toBe(true);
  });

  test('should classify validation errors correctly', () => {
    const error = createGameError(
      GameErrorCode.INVALID_PLAYER_NAME,
      'Invalid player name',
      {},
      false
    );

    const classification = errorHandler.classifyError(error);

    expect(classification.category).toBe('validation');
    expect(classification.severity).toBe('low');
    expect(classification.recoveryStrategy).toBe('user_action');
    expect(classification.retryable).toBe(false);
    expect(classification.autoRetry).toBe(false);
  });

  test('should process errors and track frequency', () => {
    const error = createGameError(
      GameErrorCode.CONNECTION_TIMEOUT,
      'Connection timeout',
      {},
      true
    );

    const classification = errorHandler.processError(error);

    expect(classification).toBeDefined();
    expect(classification.userMessage).toBe('Connection timed out');
    
    const stats = errorHandler.getErrorStats();
    expect(stats.length).toBe(1);
    expect(stats[0].count).toBe(1);
  });

  test('should throttle frequent errors', () => {
    const error = createGameError(
      GameErrorCode.CONNECTION_FAILED,
      'Connection failed',
      {},
      true
    );

    // Process the same error multiple times quickly
    for (let i = 0; i < 5; i++) {
      errorHandler.processError(error);
    }

    expect(errorHandler.shouldThrottleError(error)).toBe(true);
  });
});

describe('Error utility functions', () => {
  test('should create user-friendly messages', () => {
    const error = createGameError(
      GameErrorCode.ROOM_NOT_FOUND,
      'Room not found',
      {},
      false
    );

    const message = createUserFriendlyMessage(error);
    expect(message).toBe('Room not found');
  });

  test('should identify retryable errors', () => {
    const retryableError = createGameError(
      GameErrorCode.CONNECTION_TIMEOUT,
      'Timeout',
      {},
      true
    );

    const nonRetryableError = createGameError(
      GameErrorCode.INVALID_PLAYER_NAME,
      'Invalid name',
      {},
      false
    );

    expect(isRetryableError(retryableError)).toBe(true);
    expect(isRetryableError(nonRetryableError)).toBe(false);
  });

  test('should provide retry configuration', () => {
    const error = createGameError(
      GameErrorCode.CONNECTION_FAILED,
      'Connection failed',
      {},
      true
    );

    const config = getRetryConfig(error);
    expect(config.maxRetries).toBe(3);
    expect(config.delay).toBe(2000);
    expect(config.autoRetry).toBe(true);
  });
});