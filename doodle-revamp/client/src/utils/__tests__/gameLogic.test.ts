/**
 * Game Logic Test Suite
 * Comprehensive tests for Doodle game functionality using the TestingFramework
 */

import { testingFramework, TestScenario } from '../TestingFramework';
import { GameErrorCode } from '../../interfaces/GameManager';

describe('Game Logic Tests', () => {
  let mockGameManager: any;

  beforeEach(() => {
    mockGameManager = testingFramework.createMockGameManager();
  });

  afterEach(() => {
    if (mockGameManager) {
      mockGameManager.destroy();
    }
  });

  describe('Basic Game Flow', () => {
    test('should complete full game flow successfully', async () => {
      const scenario = testingFramework.createBasicGameFlowScenario();
      const result = await testingFramework.runScenario(scenario, mockGameManager);

      expect(result.success).toBe(true);
      expect(result.message).toContain('completed successfully');
      expect(result.duration).toBeGreaterThan(0);
    });

    test('should handle hosting a game', async () => {
      const roomCode = await mockGameManager.hostGame('TestHost');
      
      expect(roomCode).toBeDefined();
      expect(typeof roomCode).toBe('string');
      
      const gameState = mockGameManager.getGameState();
      expect(gameState.currentPlayer?.name).toBe('TestHost');
      expect(gameState.currentPlayer?.isHost).toBe(true);
      expect(gameState.gamePhase).toBe('lobby');
    });

    test('should handle joining a game', async () => {
      await mockGameManager.joinGame('TestPlayer', 'TEST123');
      
      const gameState = mockGameManager.getGameState();
      expect(gameState.roomCode).toBe('TEST123');
      expect(gameState.currentPlayer?.name).toBe('TestPlayer');
      expect(gameState.players).toHaveLength(2); // Original player + new player
    });

    test('should transition through game phases correctly', async () => {
      await mockGameManager.hostGame('TestHost');
      
      // Start voting
      mockGameManager.startVoting();
      let gameState = mockGameManager.getGameState();
      expect(gameState.gamePhase).toBe('voting');
      expect(gameState.wordOptions).toHaveLength(4);
      
      // Vote for a word
      mockGameManager.voteForWord('cat');
      gameState = mockGameManager.getGameState();
      expect(gameState.voteCounts['cat']).toBe(1);
      
      // Simulate drawing phase
      mockGameManager.simulateState({
        gamePhase: 'drawing',
        chosenWord: 'cat',
        timeRemaining: 60
      });
      gameState = mockGameManager.getGameState();
      expect(gameState.gamePhase).toBe('drawing');
      expect(gameState.chosenWord).toBe('cat');
      
      // Submit drawing
      await mockGameManager.submitDrawing('mock-canvas-data');
      gameState = mockGameManager.getGameState();
      expect(gameState.submittedDrawings).toBe(1);
      
      // Finish game
      mockGameManager.finishDrawing();
      gameState = mockGameManager.getGameState();
      expect(gameState.gamePhase).toBe('results');
      expect(gameState.results).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', () => {
      mockGameManager.simulateError(GameErrorCode.NETWORK_ERROR);
      
      // The error should be handled without crashing
      const gameState = mockGameManager.getGameState();
      expect(gameState).toBeDefined();
    });

    test('should handle connection timeout', () => {
      mockGameManager.simulateError(GameErrorCode.CONNECTION_TIMEOUT);
      
      const gameState = mockGameManager.getGameState();
      expect(gameState).toBeDefined();
    });

    test('should handle connection lost scenario', () => {
      mockGameManager.simulateError(GameErrorCode.CONNECTION_LOST);
      
      const gameState = mockGameManager.getGameState();
      expect(gameState).toBeDefined();
    });
  });

  describe('State Validation', () => {
    test('should validate valid game state', () => {
      const gameState = mockGameManager.getGameState();
      const validation = testingFramework.validateGameState(gameState);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect invalid game state', () => {
      // Create an invalid state
      const invalidState = {
        ...mockGameManager.getGameState(),
        roomCode: '', // Missing room code
        players: [] // No players
      };
      
      const validation = testingFramework.validateGameState(invalidState);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Missing room code');
      expect(validation.errors).toContain('No host player found');
    });

    test('should detect phase inconsistencies', () => {
      // Voting phase without word options
      const invalidState = {
        ...mockGameManager.getGameState(),
        gamePhase: 'voting' as const,
        wordOptions: []
      };
      
      const validation = testingFramework.validateGameState(invalidState);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Voting phase without word options');
    });

    test('should detect drawing phase issues', () => {
      // Drawing phase without chosen word
      const invalidState = {
        ...mockGameManager.getGameState(),
        gamePhase: 'drawing' as const,
        chosenWord: ''
      };
      
      const validation = testingFramework.validateGameState(invalidState);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Drawing phase without chosen word');
    });
  });

  describe('Custom Scenarios', () => {
    test('should run voting tie scenario', async () => {
      const votingTieScenario: TestScenario = {
        name: 'Voting Tie Test',
        description: 'Tests voting tie resolution',
        steps: [
          {
            action: 'hostGame',
            data: { playerName: 'Host' }
          },
          {
            action: 'startVoting'
          },
          {
            action: 'simulateState',
            data: {
              votes: { cat: 2, dog: 2, bird: 2 }
            }
          }
        ]
      };

      const result = await testingFramework.runScenario(votingTieScenario, mockGameManager);
      
      expect(result.success).toBe(true);
      
      const gameState = mockGameManager.getGameState();
      expect(gameState.voteCounts['cat']).toBe(2);
      expect(gameState.voteCounts['dog']).toBe(2);
      expect(gameState.voteCounts['bird']).toBe(2);
    });

    test('should handle disconnection scenarios', async () => {
      const disconnectionScenario: TestScenario = {
        name: 'Disconnection Test',
        description: 'Tests player disconnection handling',
        steps: [
          {
            action: 'hostGame',
            data: { playerName: 'Host' }
          },
          {
            action: 'joinGame',
            data: { playerName: 'Player2', roomCode: 'TEST123' }
          },
          {
            action: 'simulateError',
            data: { errorCode: GameErrorCode.CONNECTION_LOST }
          }
        ]
      };

      const result = await testingFramework.runScenario(disconnectionScenario, mockGameManager);
      
      expect(result.success).toBe(true);
    });

    test('should handle maximum players scenario', async () => {
      const maxPlayersScenario: TestScenario = {
        name: 'Maximum Players Test',
        description: 'Tests behavior with 8 players',
        steps: [
          {
            action: 'hostGame',
            data: { playerName: 'Host' }
          },
          {
            action: 'simulateState',
            data: {
              players: Array.from({ length: 8 }, (_, i) => ({
                id: `player-${i}`,
                name: `Player${i}`,
                isHost: i === 0,
                isConnected: true,
                hasVoted: false,
                hasSubmittedDrawing: false,
                score: 0
              }))
            }
          },
          {
            action: 'startVoting'
          }
        ]
      };

      const result = await testingFramework.runScenario(maxPlayersScenario, mockGameManager);
      
      expect(result.success).toBe(true);
      
      const gameState = mockGameManager.getGameState();
      expect(gameState.players).toHaveLength(8);
    });
  });

  describe('Performance Tests', () => {
    test('should complete basic game flow within reasonable time', async () => {
      const scenario = testingFramework.createBasicGameFlowScenario();
      const startTime = Date.now();
      
      const result = await testingFramework.runScenario(scenario, mockGameManager);
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle rapid state changes', async () => {
      const rapidChangesScenario: TestScenario = {
        name: 'Rapid Changes Test',
        description: 'Tests rapid game state transitions',
        expectedDuration: 1000,
        steps: [
          { action: 'hostGame', data: { playerName: 'Host' }, delay: 10 },
          { action: 'startVoting', delay: 10 },
          { action: 'simulateState', data: { gamePhase: 'drawing', chosenWord: 'test' }, delay: 10 },
          { action: 'simulateState', data: { gamePhase: 'results' }, delay: 10 },
          { action: 'simulateState', data: { gamePhase: 'lobby' }, delay: 10 }
        ]
      };

      const result = await testingFramework.runScenario(rapidChangesScenario, mockGameManager);
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(1000); // Should be very fast
    });
  });

  describe('Edge Cases', () => {
    test('should handle single player game', async () => {
      await mockGameManager.hostGame('SoloPlayer');
      
      const gameState = mockGameManager.getGameState();
      expect(gameState.players).toHaveLength(1);
      expect(gameState.currentPlayer?.isHost).toBe(true);
      
      // Validation should show warning but not error
      const validation = testingFramework.validateGameState(gameState);
      expect(validation.warnings).toContain('No players in game');
    });

    test('should handle empty word options', () => {
      mockGameManager.simulateState({
        gamePhase: 'voting',
        wordOptions: []
      });
      
      const gameState = mockGameManager.getGameState();
      const validation = testingFramework.validateGameState(gameState);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Voting phase without word options');
    });

    test('should handle inconsistent connection state', () => {
      mockGameManager.simulateState({
        isConnected: false,
        connectionStatus: 'connected' // Inconsistent!
      });
      
      const gameState = mockGameManager.getGameState();
      const validation = testingFramework.validateGameState(gameState);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Inconsistent connection state');
    });
  });
});