/**
 * Integration Test Suite
 * Tests the complete integration between components, services, and network layer
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { testingFramework, TestScenario } from '../TestingFramework';
import { DevToolsService } from '../../services/DevToolsService';
import { SocketGameManager } from '../../services/SocketGameManager';
import { GameErrorCode } from '../../interfaces/GameManager';

// Mock the socket.io-client to avoid real network calls
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true
  }))
}));

describe('Integration Tests', () => {
  let mockGameManager: any;
  let devToolsService: DevToolsService;

  beforeEach(() => {
    mockGameManager = testingFramework.createMockGameManager();
    devToolsService = new DevToolsService(mockGameManager);
  });

  afterEach(() => {
    if (mockGameManager) {
      mockGameManager.destroy();
    }
  });

  describe('DevTools Integration', () => {
    test('should initialize DevToolsService with GameManager', () => {
      expect(devToolsService).toBeInstanceOf(DevToolsService);
      expect(devToolsService.inspectGameState()).toBeDefined();
    });

    test('should simulate multiple players correctly', () => {
      devToolsService.simulateMultiplePlayers(4);
      
      const gameState = devToolsService.inspectGameState();
      expect(gameState?.players).toHaveLength(4);
      expect(gameState?.players[0].isHost).toBe(true);
      expect(gameState?.players[1].isHost).toBe(false);
    });

    test('should simulate voting tie scenario', () => {
      const words = ['cat', 'dog', 'bird'];
      devToolsService.simulateVotingTie(words);
      
      const gameState = devToolsService.inspectGameState();
      expect(gameState?.gamePhase).toBe('voting');
      expect(gameState?.wordOptions).toEqual(words);
      expect(gameState?.voteCounts['cat']).toBe(2);
      expect(gameState?.voteCounts['dog']).toBe(2);
      expect(gameState?.voteCounts['bird']).toBe(2);
    });

    test('should export and import game session', () => {
      // Set up a specific game state
      devToolsService.simulateMultiplePlayers(3);
      devToolsService.skipToDrawing('house');
      
      // Export session
      const sessionData = devToolsService.exportGameSession();
      expect(sessionData).toBeDefined();
      expect(typeof sessionData).toBe('string');
      
      // Parse and verify content
      const parsedData = JSON.parse(sessionData);
      expect(parsedData.gameState).toBeDefined();
      expect(parsedData.gameState.chosenWord).toBe('house');
      expect(parsedData.gameState.gamePhase).toBe('drawing');
      
      // Import session (this would typically reset state)
      const importSuccess = devToolsService.importGameSession(sessionData);
      expect(importSuccess).toBe(true);
    });

    test('should validate state consistency', () => {
      // Start with valid state
      let validation = devToolsService.validateStateConsistency();
      expect(validation.isValid).toBe(true);
      
      // Create invalid state
      mockGameManager.simulateState({
        gamePhase: 'voting',
        wordOptions: [] // Invalid: voting without options
      });
      
      validation = devToolsService.validateStateConsistency();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Voting phase without word options');
    });

    test('should run automated game flow test', async () => {
      const result = await devToolsService.runGameFlowTest();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('completed successfully');
      expect(result.duration).toBeGreaterThan(0);
      expect(result.details).toBeDefined();
    });
  });

  describe('Network Simulation Integration', () => {
    test('should simulate network errors with different severities', () => {
      // Test mild connection issues
      devToolsService.simulateConnectionIssues('mild');
      let gameState = devToolsService.inspectGameState();
      expect(gameState?.isConnected).toBe(false); // DevTools simulation sets connection to false
      expect(gameState?.connectionStatus).toBe('error');
      expect(gameState?.lastError).toBeDefined();
      
      // Test moderate connection issues
      devToolsService.simulateConnectionIssues('moderate');
      gameState = devToolsService.inspectGameState();
      expect(gameState).toBeDefined();
      expect(gameState?.lastError?.code).toBe('CONNECTION_LOST');
      
      // Test severe connection issues
      devToolsService.simulateConnectionIssues('severe');
      gameState = devToolsService.inspectGameState();
      expect(gameState).toBeDefined();
      expect(gameState?.lastError?.code).toBe('CONNECTION_FAILED');
    });

    test('should run network degradation test', async () => {
      jest.setTimeout(15000); // Increase timeout for this test
      
      const result = await devToolsService.simulateNetworkDegradation();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Network degradation simulation completed');
      expect(result.duration).toBeGreaterThan(6000); // Should take at least 6 seconds with delays
      
      // Should end in connected state after recovery
      const gameState = devToolsService.inspectGameState();
      expect(gameState?.isConnected).toBe(true);
      expect(gameState?.connectionStatus).toBe('connected');
    }, 10000);

    test('should handle network message recording', () => {
      // Start recording
      devToolsService.startRecording();
      
      // Simulate some network activity
      mockGameManager.startVoting();
      mockGameManager.voteForWord('test');
      
      // Get recorded messages
      const messages = devToolsService.getNetworkMessages();
      expect(Array.isArray(messages)).toBe(true);
      
      // Stop recording
      devToolsService.stopRecording();
      
      // Clear messages
      devToolsService.clearMessages();
      const clearedMessages = devToolsService.getNetworkMessages();
      expect(clearedMessages).toHaveLength(0);
    });
  });

  describe('Custom Scenario Integration', () => {
    test('should run custom multiplayer scenario', async () => {
      const multiplayerScenario: TestScenario = {
        name: 'Full Multiplayer Flow',
        description: 'Complete multiplayer game with 4 players',
        steps: [
          {
            action: 'simulateMultiplePlayers',
            data: { count: 4 },
            delay: 100
          },
          {
            action: 'skipToVoting',
            delay: 200
          },
          {
            action: 'simulateVotingTie',
            data: { words: ['cat', 'dog', 'fish'] },
            delay: 300
          },
          {
            action: 'skipToDrawing',
            data: { word: 'cat' },
            delay: 200
          },
          {
            action: 'skipToResults',
            delay: 200
          }
        ]
      };

      const result = await devToolsService.runCustomScenario(multiplayerScenario);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Full Multiplayer Flow');
      expect(result.duration).toBeGreaterThan(1000); // Should take at least 1 second with delays
      
      // Verify final state
      const gameState = devToolsService.inspectGameState();
      expect(gameState?.gamePhase).toBe('results'); // Final step sets it to results
      expect(gameState?.players).toHaveLength(4);
      expect(gameState?.results).toBeDefined();
    });

    test('should handle error recovery scenario', async () => {
      const errorRecoveryScenario: TestScenario = {
        name: 'Error Recovery Test',
        description: 'Test error handling and recovery',
        steps: [
          {
            action: 'hostGame',
            data: { playerName: 'TestHost' }
          },
          {
            action: 'startVoting'
          },
          {
            action: 'simulateConnectionIssues',
            data: { severity: 'severe' },
            delay: 1000
          },
          {
            action: 'simulateState',
            data: {
              isConnected: true,
              connectionStatus: 'connected',
              lastError: undefined
            },
            delay: 500
          }
        ]
      };

      const result = await devToolsService.runCustomScenario(errorRecoveryScenario);
      
      expect(result.success).toBe(true);
      
      // Should end in recovered state
      const gameState = devToolsService.inspectGameState();
      expect(gameState?.isConnected).toBe(true);
      expect(gameState?.connectionStatus).toBe('connected');
      expect(gameState?.lastError).toBeUndefined();
    });
  });

  describe('Performance Integration Tests', () => {
    test('should handle rapid state changes efficiently', async () => {
      const startTime = Date.now();
      
      // Perform 100 rapid state changes
      for (let i = 0; i < 100; i++) {
        devToolsService.simulateGameState({
          timeRemaining: 60 - i
        });
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle large player simulation efficiently', () => {
      const startTime = Date.now();
      
      // Simulate maximum players
      devToolsService.simulateMultiplePlayers(8);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should be very fast
      
      // Verify state
      const gameState = devToolsService.inspectGameState();
      expect(gameState?.players).toHaveLength(8);
    });

    test('should handle complex scenario execution efficiently', async () => {
      const complexScenario: TestScenario = {
        name: 'Complex Performance Test',
        description: 'Tests performance with many rapid operations',
        expectedDuration: 2000,
        steps: Array.from({ length: 20 }, (_, i) => ({
          action: i % 2 === 0 ? 'simulateState' : 'skipToVoting',
          data: i % 2 === 0 ? { timeRemaining: 60 - i } : undefined,
          delay: 10
        }))
      };

      const result = await devToolsService.runCustomScenario(complexScenario);
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Memory and Cleanup Integration', () => {
    test('should properly clean up resources', () => {
      // Create and use resources
      devToolsService.startRecording();
      devToolsService.simulateMultiplePlayers(8);
      
      // Generate some network messages
      for (let i = 0; i < 100; i++) {
        mockGameManager.voteForWord(`word${i}`);
      }
      
      // Cleanup
      devToolsService.clearMessages();
      mockGameManager.destroy();
      
      // Verify cleanup
      const messages = devToolsService.getNetworkMessages();
      expect(messages).toHaveLength(0);
    });

    test('should handle large message history efficiently', () => {
      devToolsService.startRecording();
      
      // Generate many messages
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        mockGameManager.voteForWord(`word${i}`);
      }
      const generationTime = Date.now() - startTime;
      
      // Retrieve messages
      const retrievalStartTime = Date.now();
      const messages = devToolsService.getNetworkMessages();
      const retrievalTime = Date.now() - retrievalStartTime;
      
      expect(generationTime).toBeLessThan(1000);
      expect(retrievalTime).toBeLessThan(100);
      expect(Array.isArray(messages)).toBe(true);
      
      devToolsService.stopRecording();
    });
  });
});