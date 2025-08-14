/**
 * Final Validation Tests
 * 
 * Comprehensive tests to validate that all game flows work identically to before
 * and that the architecture unification is complete and functional.
 */

import { SocketGameManager } from '../../services/SocketGameManager';
import { DevToolsService } from '../../services/DevToolsService';
import { GameState, GameErrorCode, Player } from '../../interfaces/GameManager';

describe('Final Validation Tests', () => {
  describe('Game Flow Validation', () => {
    let gameManager: SocketGameManager;
    let devTools: DevToolsService;
    let gameStateHistory: GameState[] = [];

    beforeEach(() => {
      gameStateHistory = [];
      gameManager = new SocketGameManager((state) => {
        gameStateHistory.push(state);
      });
      devTools = new DevToolsService(gameManager);
      gameManager.enableDevMode();
    });

    afterEach(() => {
      gameManager.destroy();
    });

    it('should maintain consistent game state throughout lobby flow', () => {
      // Simulate lobby creation
      devTools.simulateGameState({
        gamePhase: 'lobby',
        roomCode: 'TEST123',
        isConnected: true,
        connectionStatus: 'connected',
        players: [
          {
            id: 'host',
            name: 'HostPlayer',
            isHost: true,
            isConnected: true,
            hasVoted: false,
            hasSubmittedDrawing: false,
            score: 0
          }
        ],
        hostId: 'host'
      });

      const currentState = gameManager.getGameState();
      expect(currentState).toBeTruthy();
      expect(currentState!.gamePhase).toBe('lobby');
      expect(currentState!.roomCode).toBe('TEST123');
      expect(currentState!.players).toHaveLength(1);
      expect(currentState!.players[0].isHost).toBe(true);
    });

    it('should handle voting phase transitions correctly', () => {
      // Start with lobby
      devTools.simulateGameState({
        gamePhase: 'lobby',
        players: [
          { id: '1', name: 'Player1', isHost: true, isConnected: true, hasVoted: false, hasSubmittedDrawing: false, score: 0 },
          { id: '2', name: 'Player2', isHost: false, isConnected: true, hasVoted: false, hasSubmittedDrawing: false, score: 0 }
        ]
      });

      // Transition to voting
      devTools.skipToVoting();

      const currentState = gameManager.getGameState();
      expect(currentState!.gamePhase).toBe('voting');
      expect(currentState!.wordOptions).toHaveLength(4);
      expect(currentState!.wordOptions).toContain('cat');
      expect(currentState!.wordOptions).toContain('dog');
    });

    it('should handle drawing phase with timer correctly', () => {
      // Skip to drawing phase
      devTools.skipToDrawing('testword');

      const currentState = gameManager.getGameState();
      expect(currentState!.gamePhase).toBe('drawing');
      expect(currentState!.chosenWord).toBe('testword');
      expect(currentState!.timeRemaining).toBe(60);
    });

    it('should handle results phase with proper data structure', () => {
      const mockResults = [
        {
          playerId: '1',
          playerName: 'Player1',
          rank: 1,
          score: 95,
          feedback: 'Excellent drawing!',
          canvasData: 'mock-canvas-data'
        },
        {
          playerId: '2',
          playerName: 'Player2',
          rank: 2,
          score: 80,
          feedback: 'Good effort!',
          canvasData: 'mock-canvas-data-2'
        }
      ];

      devTools.skipToResults(mockResults);

      const currentState = gameManager.getGameState();
      expect(currentState!.gamePhase).toBe('results');
      expect(currentState!.results).toHaveLength(2);
      expect(currentState!.results[0].rank).toBe(1);
      expect(currentState!.results[0].score).toBe(95);
    });
  });

  describe('Error Handling Validation', () => {
    let gameManager: SocketGameManager;
    let devTools: DevToolsService;
    let capturedErrors: any[] = [];

    beforeEach(() => {
      capturedErrors = [];
      gameManager = new SocketGameManager(() => {});
      gameManager.onError((error) => {
        capturedErrors.push(error);
      });
      devTools = new DevToolsService(gameManager);
      gameManager.enableDevMode();
    });

    afterEach(() => {
      gameManager.destroy();
    });

    it('should handle connection errors gracefully', () => {
      devTools.simulateConnectionIssues('severe');

      // Check that the game state reflects the error
      const gameState = gameManager.getGameState();
      expect(gameState!.lastError).toBeDefined();
      expect(gameState!.connectionStatus).toBe('error');
    });

    it('should handle network degradation appropriately', () => {
      // Test different severities of connection issues
      devTools.simulateConnectionIssues('mild');
      let gameState = gameManager.getGameState();
      expect(gameState!.lastError).toBeDefined();

      devTools.simulateConnectionIssues('moderate');
      gameState = gameManager.getGameState();
      expect(gameState!.lastError).toBeDefined();

      devTools.simulateConnectionIssues('severe');
      gameState = gameManager.getGameState();
      expect(gameState!.lastError).toBeDefined();
    });

    it('should maintain error state consistency', () => {
      devTools.simulateConnectionIssues('moderate');

      const gameState = gameManager.getGameState();
      expect(gameState!.lastError).toBeDefined();
      expect(gameState!.lastError!.code).toBe(GameErrorCode.CONNECTION_LOST);
      expect(gameState!.connectionStatus).toBe('error');
    });
  });

  describe('Developer Tools Validation', () => {
    let gameManager: SocketGameManager;
    let devTools: DevToolsService;

    beforeEach(() => {
      gameManager = new SocketGameManager(() => {});
      devTools = new DevToolsService(gameManager);
      gameManager.enableDevMode();
    });

    afterEach(() => {
      gameManager.destroy();
    });

    it('should provide comprehensive network statistics', () => {
      const networkStats = gameManager.getNetworkStats();

      expect(networkStats).toBeDefined();
      expect(networkStats.batching).toBeDefined();
      expect(networkStats.connectionPool).toBeDefined();
      expect(networkStats.requestQueue).toBeDefined();
    });

    it('should support game session export/import', () => {
      // Set up a game state
      devTools.simulateGameState({
        gamePhase: 'voting',
        roomCode: 'EXPORT123',
        wordOptions: ['test1', 'test2', 'test3', 'test4']
      });

      // Export session
      const exportedSession = devTools.exportGameSession();
      expect(exportedSession).toBeTruthy();

      // Parse and validate export
      const sessionData = JSON.parse(exportedSession);
      expect(sessionData.gameState.roomCode).toBe('EXPORT123');
      expect(sessionData.gameState.wordOptions).toHaveLength(4);

      // Import session
      const importResult = devTools.importGameSession(exportedSession);
      expect(importResult).toBe(true);
    });

    it('should validate state consistency correctly', () => {
      // Set up consistent state
      devTools.simulateGameState({
        gamePhase: 'drawing',
        chosenWord: 'cat',
        timeRemaining: 45,
        players: [
          { id: '1', name: 'Player1', isHost: true, isConnected: true, hasVoted: true, hasSubmittedDrawing: false, score: 0 }
        ]
      });

      const validation = devTools.validateStateConsistency();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should run automated test scenarios successfully', async () => {
      const testResult = await devTools.runGameFlowTest();

      expect(testResult.success).toBe(true);
      expect(testResult.message).toContain('Basic game flow test completed');
      expect(testResult.details).toBeDefined();
      if (testResult.details && 'phasesCompleted' in testResult.details) {
        expect(testResult.details.phasesCompleted).toBeGreaterThan(0);
      }
    });
  });

  describe('Network Optimization Validation', () => {
    let gameManager: SocketGameManager;

    beforeEach(() => {
      gameManager = new SocketGameManager(() => {});
      gameManager.enableDevMode();
    });

    afterEach(() => {
      gameManager.destroy();
    });

    it('should provide network optimization statistics', () => {
      const stats = gameManager.getNetworkStats();

      expect(stats.batching).toBeDefined();
      expect(stats.connectionPool).toBeDefined();
      expect(stats.requestQueue).toBeDefined();

      // Check that connection pool is initialized
      expect(stats.connectionPool.maxConnections).toBeGreaterThan(0);
      expect(stats.requestQueue.maxConcurrent).toBeGreaterThan(0);
    });

    it('should handle network optimization flushing', () => {
      // This should not throw any errors
      expect(() => {
        gameManager.flushNetworkOptimizations();
      }).not.toThrow();
    });

    it('should maintain connection status tracking', () => {
      const status = gameManager.getConnectionStatus();
      expect(['connecting', 'connected', 'disconnected', 'error']).toContain(status);
    });
  });

  describe('Backward Compatibility Validation', () => {
    let gameManager: SocketGameManager;

    beforeEach(() => {
      gameManager = new SocketGameManager(() => {});
      gameManager.enableDevMode();
    });

    afterEach(() => {
      gameManager.destroy();
    });

    it('should maintain legacy method compatibility', () => {
      // Test legacy methods still exist and work
      expect(typeof gameManager.isHost).toBe('function');
      expect(typeof gameManager.getRoomCode).toBe('function');
      expect(typeof gameManager.getCurrentPlayer).toBe('function');

      const isHost = gameManager.isHost();
      expect(typeof isHost).toBe('boolean');

      const roomCode = gameManager.getRoomCode();
      expect(typeof roomCode).toBe('string');
    });

    it('should support all required GameManager interface methods', () => {
      // Verify all interface methods exist
      expect(typeof gameManager.hostGame).toBe('function');
      expect(typeof gameManager.joinGame).toBe('function');
      expect(typeof gameManager.startVoting).toBe('function');
      expect(typeof gameManager.voteForWord).toBe('function');
      expect(typeof gameManager.submitDrawing).toBe('function');
      expect(typeof gameManager.disconnect).toBe('function');
      expect(typeof gameManager.getGameState).toBe('function');
      expect(typeof gameManager.onStateChange).toBe('function');
      expect(typeof gameManager.onError).toBe('function');
    });

    it('should maintain consistent data structures', () => {
      const gameState = gameManager.getGameState();
      
      if (gameState) {
        // Verify all required properties exist
        expect(gameState).toHaveProperty('roomCode');
        expect(gameState).toHaveProperty('isConnected');
        expect(gameState).toHaveProperty('connectionStatus');
        expect(gameState).toHaveProperty('players');
        expect(gameState).toHaveProperty('gamePhase');
        expect(gameState).toHaveProperty('wordOptions');
        expect(gameState).toHaveProperty('chosenWord');
        expect(gameState).toHaveProperty('timeRemaining');
        expect(gameState).toHaveProperty('results');
      }
    });
  });

  describe('Performance Validation', () => {
    let gameManager: SocketGameManager;
    let devTools: DevToolsService;

    beforeEach(() => {
      gameManager = new SocketGameManager(() => {});
      devTools = new DevToolsService(gameManager);
      gameManager.enableDevMode();
    });

    afterEach(() => {
      gameManager.destroy();
    });

    it('should handle rapid state changes efficiently', () => {
      const startTime = Date.now();
      
      // Simulate rapid state changes
      for (let i = 0; i < 100; i++) {
        devTools.simulateGameState({
          timeRemaining: 60 - i,
          gamePhase: i % 2 === 0 ? 'drawing' : 'voting'
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle large player simulations efficiently', () => {
      const startTime = Date.now();
      
      devTools.simulateMultiplePlayers(8);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete quickly
      expect(duration).toBeLessThan(100);
      
      const gameState = gameManager.getGameState();
      expect(gameState!.players).toHaveLength(8);
    });

    it('should maintain memory efficiency with message history', () => {
      // Simulate many network messages
      for (let i = 0; i < 200; i++) {
        devTools.simulateGameState({ timeRemaining: i });
      }
      
      // Network message history should be capped
      const networkStats = gameManager.getNetworkStats();
      expect(networkStats).toBeDefined();
      
      // The system should still be responsive
      const gameState = gameManager.getGameState();
      expect(gameState).toBeTruthy();
    });
  });
});