/**
 * Unit Tests for GameManager Interface Utilities
 * 
 * Tests the helper functions and type guards for the GameManager interface
 */

import {
  GameErrorCode,
  createGameError,
  isGameManager,
  GameState,
  Player,
  GameResult
} from '../../interfaces/GameManager';

describe('GameManager Interface Utilities', () => {
  describe('createGameError', () => {
    it('should create a GameError with all required fields', () => {
      const error = createGameError(
        GameErrorCode.CONNECTION_FAILED,
        'Test error message',
        { detail: 'test' },
        true
      );

      expect(error).toMatchObject({
        code: GameErrorCode.CONNECTION_FAILED,
        message: 'Test error message',
        details: { detail: 'test' },
        recoverable: true,
        timestamp: expect.any(Date)
      });
    });

    it('should create a GameError with default recoverable value', () => {
      const error = createGameError(
        GameErrorCode.INVALID_PLAYER_NAME,
        'Invalid name'
      );

      expect(error.recoverable).toBe(true);
      expect(error.details).toBeUndefined();
    });

    it('should create a GameError with current timestamp', () => {
      const beforeTime = new Date();
      const error = createGameError(GameErrorCode.UNKNOWN_ERROR, 'Test');
      const afterTime = new Date();

      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should handle all error codes', () => {
      const errorCodes = Object.values(GameErrorCode);
      
      errorCodes.forEach(code => {
        const error = createGameError(code, `Test message for ${code}`);
        expect(error.code).toBe(code);
        expect(error.message).toBe(`Test message for ${code}`);
      });
    });
  });

  describe('isGameManager', () => {
    it('should return true for valid GameManager object', () => {
      const mockGameManager = {
        hostGame: jest.fn(),
        joinGame: jest.fn(),
        getGameState: jest.fn(),
        onStateChange: jest.fn(),
        destroy: jest.fn(),
        // Additional methods would be here in real implementation
        disconnect: jest.fn(),
        startVoting: jest.fn(),
        voteForWord: jest.fn(),
        submitDrawing: jest.fn()
      };

      expect(isGameManager(mockGameManager)).toBe(true);
    });

    it('should return false for object missing required methods', () => {
      const incompleteObject = {
        hostGame: jest.fn(),
        joinGame: jest.fn(),
        // Missing getGameState, onStateChange, destroy
      };

      expect(isGameManager(incompleteObject)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isGameManager(null as any)).toBe(false);
      expect(isGameManager(undefined as any)).toBe(false);
    });

    it('should return false for primitive values', () => {
      expect(isGameManager('string')).toBe(false);
      expect(isGameManager(123)).toBe(false);
      expect(isGameManager(true)).toBe(false);
    });

    it('should return false for object with non-function methods', () => {
      const invalidObject = {
        hostGame: 'not a function',
        joinGame: jest.fn(),
        getGameState: jest.fn(),
        onStateChange: jest.fn(),
        destroy: jest.fn()
      };

      expect(isGameManager(invalidObject)).toBe(false);
    });
  });

  describe('GameErrorCode enum', () => {
    it('should contain all expected error codes', () => {
      const expectedCodes = [
        'CONNECTION_FAILED',
        'CONNECTION_TIMEOUT',
        'CONNECTION_LOST',
        'SERVER_UNREACHABLE',
        'ROOM_NOT_FOUND',
        'ROOM_FULL',
        'INVALID_ROOM_CODE',
        'PLAYER_NOT_FOUND',
        'INVALID_GAME_STATE',
        'UNAUTHORIZED_ACTION',
        'INVALID_PLAYER_NAME',
        'INVALID_DRAWING_DATA',
        'INVALID_VOTE',
        'RATE_LIMITED',
        'TOO_MANY_REQUESTS',
        'UNKNOWN_ERROR'
      ];

      expectedCodes.forEach(code => {
        expect(GameErrorCode[code as keyof typeof GameErrorCode]).toBe(code);
      });
    });

    it('should have unique values for all error codes', () => {
      const values = Object.values(GameErrorCode);
      const uniqueValues = new Set(values);
      
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('Interface Type Validation', () => {
    describe('Player interface', () => {
      it('should validate complete Player object', () => {
        const player: Player = {
          id: 'player-1',
          name: 'TestPlayer',
          isHost: false,
          isConnected: true,
          hasVoted: false,
          hasSubmittedDrawing: false,
          score: 0
        };

        // TypeScript compilation validates the interface
        expect(player.id).toBe('player-1');
        expect(player.name).toBe('TestPlayer');
        expect(player.isHost).toBe(false);
        expect(player.isConnected).toBe(true);
        expect(player.hasVoted).toBe(false);
        expect(player.hasSubmittedDrawing).toBe(false);
        expect(player.score).toBe(0);
      });
    });

    describe('GameResult interface', () => {
      it('should validate complete GameResult object', () => {
        const result: GameResult = {
          playerId: 'player-1',
          playerName: 'TestPlayer',
          rank: 1,
          score: 95,
          feedback: 'Great drawing!',
          canvasData: 'data:image/png;base64,mock-data'
        };

        expect(result.playerId).toBe('player-1');
        expect(result.playerName).toBe('TestPlayer');
        expect(result.rank).toBe(1);
        expect(result.score).toBe(95);
        expect(result.feedback).toBe('Great drawing!');
        expect(result.canvasData).toBe('data:image/png;base64,mock-data');
      });
    });

    describe('GameState interface', () => {
      it('should validate complete GameState object', () => {
        const gameState: GameState = {
          roomCode: 'TEST123',
          isConnected: true,
          connectionStatus: 'connected',
          players: [],
          currentPlayer: null,
          hostId: 'host-1',
          playerCount: 1,
          maxPlayers: 8,
          gamePhase: 'lobby',
          wordOptions: ['cat', 'dog'],
          voteCounts: { cat: 1, dog: 0 },
          chosenWord: 'cat',
          timeRemaining: 60,
          drawingTimeLimit: 60,
          submittedDrawings: 0,
          results: []
        };

        expect(gameState.roomCode).toBe('TEST123');
        expect(gameState.isConnected).toBe(true);
        expect(gameState.connectionStatus).toBe('connected');
        expect(gameState.gamePhase).toBe('lobby');
        expect(gameState.wordOptions).toEqual(['cat', 'dog']);
        expect(gameState.voteCounts).toEqual({ cat: 1, dog: 0 });
      });

      it('should allow optional lastError field', () => {
        const gameStateWithError: GameState = {
          roomCode: 'TEST123',
          isConnected: false,
          connectionStatus: 'error',
          players: [],
          currentPlayer: null,
          hostId: 'host-1',
          playerCount: 1,
          maxPlayers: 8,
          gamePhase: 'lobby',
          wordOptions: [],
          voteCounts: {},
          chosenWord: '',
          timeRemaining: 0,
          drawingTimeLimit: 60,
          submittedDrawings: 0,
          results: [],
          lastError: createGameError(GameErrorCode.CONNECTION_LOST, 'Connection lost')
        };

        expect(gameStateWithError.lastError).toBeDefined();
        expect(gameStateWithError.lastError?.code).toBe(GameErrorCode.CONNECTION_LOST);
      });
    });
  });

  describe('Callback Type Validation', () => {
    it('should validate GameStateChangeCallback type', () => {
      const mockCallback = jest.fn();
      const gameState: GameState = {
        roomCode: 'TEST123',
        isConnected: true,
        connectionStatus: 'connected',
        players: [],
        currentPlayer: null,
        hostId: 'host-1',
        playerCount: 1,
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

      // This should compile without TypeScript errors
      mockCallback(gameState);
      
      expect(mockCallback).toHaveBeenCalledWith(gameState);
    });

    it('should validate GameErrorCallback type', () => {
      const mockCallback = jest.fn();
      const error = createGameError(GameErrorCode.CONNECTION_FAILED, 'Test error');

      // This should compile without TypeScript errors
      mockCallback(error);
      
      expect(mockCallback).toHaveBeenCalledWith(error);
    });

    it('should validate TieBreakerCallbacks type', () => {
      const callbacks = {
        onTieDetected: jest.fn(),
        onTieResolved: jest.fn()
      };

      // This should compile without TypeScript errors
      callbacks.onTieDetected(['cat', 'dog'], 'cat');
      callbacks.onTieResolved('cat');
      
      expect(callbacks.onTieDetected).toHaveBeenCalledWith(['cat', 'dog'], 'cat');
      expect(callbacks.onTieResolved).toHaveBeenCalledWith('cat');
    });
  });

  describe('Error Code Categories', () => {
    it('should categorize connection errors correctly', () => {
      const connectionErrors = [
        GameErrorCode.CONNECTION_FAILED,
        GameErrorCode.CONNECTION_TIMEOUT,
        GameErrorCode.CONNECTION_LOST,
        GameErrorCode.SERVER_UNREACHABLE
      ];

      connectionErrors.forEach(code => {
        expect(code).toMatch(/CONNECTION|SERVER/);
      });
    });

    it('should categorize game logic errors correctly', () => {
      const gameLogicErrors = [
        GameErrorCode.ROOM_NOT_FOUND,
        GameErrorCode.ROOM_FULL,
        GameErrorCode.INVALID_ROOM_CODE,
        GameErrorCode.PLAYER_NOT_FOUND,
        GameErrorCode.INVALID_GAME_STATE,
        GameErrorCode.UNAUTHORIZED_ACTION
      ];

      gameLogicErrors.forEach(code => {
        expect(code).toMatch(/ROOM|PLAYER|GAME|UNAUTHORIZED/);
      });
    });

    it('should categorize validation errors correctly', () => {
      const validationErrors = [
        GameErrorCode.INVALID_PLAYER_NAME,
        GameErrorCode.INVALID_DRAWING_DATA,
        GameErrorCode.INVALID_VOTE
      ];

      validationErrors.forEach(code => {
        expect(code).toMatch(/INVALID/);
      });
    });

    it('should categorize rate limiting errors correctly', () => {
      const rateLimitErrors = [
        GameErrorCode.RATE_LIMITED,
        GameErrorCode.TOO_MANY_REQUESTS
      ];

      rateLimitErrors.forEach(code => {
        expect(code).toMatch(/RATE|REQUESTS/);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle createGameError with complex details object', () => {
      const complexDetails = {
        nested: {
          object: {
            with: ['array', 'values']
          }
        },
        timestamp: new Date(),
        number: 42,
        boolean: true,
        nullValue: null,
        undefinedValue: undefined
      };

      const error = createGameError(
        GameErrorCode.UNKNOWN_ERROR,
        'Complex error',
        complexDetails,
        false
      );

      expect(error.details).toEqual(complexDetails);
      expect(error.recoverable).toBe(false);
    });

    it('should handle isGameManager with objects containing extra properties', () => {
      const gameManagerWithExtras = {
        // Required methods
        hostGame: jest.fn(),
        joinGame: jest.fn(),
        getGameState: jest.fn(),
        onStateChange: jest.fn(),
        destroy: jest.fn(),
        // Extra properties
        extraProperty: 'value',
        extraMethod: jest.fn(),
        extraNumber: 123
      };

      expect(isGameManager(gameManagerWithExtras)).toBe(true);
    });

    it('should handle isGameManager with prototype methods', () => {
      class MockGameManager {
        hostGame() { return Promise.resolve(''); }
        joinGame() { return Promise.resolve(); }
        getGameState() { return null; }
        onStateChange() {}
        destroy() {}
      }

      const instance = new MockGameManager();
      expect(isGameManager(instance)).toBe(true);
    });
  });
});