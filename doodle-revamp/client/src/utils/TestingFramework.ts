/**
 * TestingFramework - Comprehensive testing utilities for the Doodle game
 * Provides mock services, test utilities, and automated testing capabilities
 */

import { GameManager, GameState, Player, GameResult, GameError, GameErrorCode, createGameError } from '../interfaces';
import type { TieBreakerCallbacks } from '../interfaces/GameManager';

export interface TestResult {
  success: boolean;
  message: string;
  duration: number;
  details?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TestScenario {
  name: string;
  description: string;
  steps: TestStep[];
  expectedDuration?: number;
}

export interface TestStep {
  action: string;
  data?: any;
  delay?: number;
  validation?: (state: GameState) => ValidationResult;
}

export interface MockServerResponse {
  event: string;
  data: any;
  delay?: number;
}

/**
 * Mock GameManager for testing UI components in isolation
 */
export class MockGameManager implements GameManager {
  private gameState: GameState;
  private stateCallbacks: Set<(state: GameState) => void> = new Set();
  private errorCallbacks: Set<(error: GameError) => void> = new Set();
  private mockNetworkDelay: number = 100;

  constructor() {
    this.gameState = this.createDefaultGameState();
  }

  private createDefaultGameState(): GameState {
    return {
      roomCode: 'MOCK123',
      isConnected: true,
      connectionStatus: 'connected',
      players: [
        {
          id: 'mock-player-1',
          name: 'MockPlayer1',
          isHost: true,
          isConnected: true,
          hasVoted: false,
          hasSubmittedDrawing: false,
          score: 0
        }
      ],
      currentPlayer: {
        id: 'mock-player-1',
        name: 'MockPlayer1',
        isHost: true,
        isConnected: true,
        hasVoted: false,
        hasSubmittedDrawing: false,
        score: 0
      },
      hostId: 'mock-player-1',
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
  }

  // GameManager interface implementation
  async hostGame(playerName: string): Promise<string> {
    await this.delay(this.mockNetworkDelay);
    this.gameState = {
      ...this.gameState,
      currentPlayer: { ...this.gameState.currentPlayer!, name: playerName },
      players: [{ ...this.gameState.players[0], name: playerName }]
    };
    this.notifyStateChange();
    return this.gameState.roomCode;
  }

  async joinGame(playerName: string, roomCode: string): Promise<void> {
    await this.delay(this.mockNetworkDelay);
    this.gameState = {
      ...this.gameState,
      roomCode,
      currentPlayer: { 
        id: 'mock-player-2',
        name: playerName,
        isHost: false,
        isConnected: true,
        hasVoted: false,
        hasSubmittedDrawing: false,
        score: 0
      },
      players: [
        ...this.gameState.players,
        {
          id: 'mock-player-2',
          name: playerName,
          isHost: false,
          isConnected: true,
          hasVoted: false,
          hasSubmittedDrawing: false,
          score: 0
        }
      ]
    };
    this.notifyStateChange();
  }

  disconnect(): void {
    this.gameState = {
      ...this.gameState,
      isConnected: false,
      connectionStatus: 'disconnected'
    };
    this.notifyStateChange();
  }

  destroy(): void {
    this.stateCallbacks.clear();
    this.errorCallbacks.clear();
  }

  startVoting(): void {
    this.gameState = {
      ...this.gameState,
      gamePhase: 'voting',
      wordOptions: ['cat', 'dog', 'bird', 'fish']
    };
    this.notifyStateChange();
  }

  voteForWord(word: string): void {
    const currentVotes = { ...this.gameState.voteCounts };
    currentVotes[word] = (currentVotes[word] || 0) + 1;
    this.gameState = {
      ...this.gameState,
      voteCounts: currentVotes
    };
    this.notifyStateChange();
  }

  async submitDrawing(canvasData: string): Promise<void> {
    await this.delay(this.mockNetworkDelay);
    this.gameState = {
      ...this.gameState,
      submittedDrawings: this.gameState.submittedDrawings + 1
    };
    this.notifyStateChange();
  }

  finishDrawing(): void {
    this.gameState = {
      ...this.gameState,
      gamePhase: 'results',
      results: this.createMockResults()
    };
    this.notifyStateChange();
  }

  resolveTiebreaker(selectedWord: string): void {
    this.gameState = {
      ...this.gameState,
      chosenWord: selectedWord,
      gamePhase: 'drawing',
      timeRemaining: 60
    };
    this.notifyStateChange();
  }

  notifyTiebreakerAnimationComplete(): void {
    // Mock implementation - just log the notification
    console.log('Mock: Tiebreaker animation complete notification');
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  getCurrentPlayer(): Player | null {
    return this.gameState.currentPlayer;
  }

  getRoomCode(): string {
    return this.gameState.roomCode;
  }

  isHost(): boolean {
    return this.gameState.currentPlayer?.isHost || false;
  }

  onStateChange(callback: (state: GameState) => void): void {
    this.stateCallbacks.add(callback);
  }

  onError(callback: (error: GameError) => void): void {
    this.errorCallbacks.add(callback);
  }

  offStateChange(callback: (state: GameState) => void): void {
    this.stateCallbacks.delete(callback);
  }

  offError(callback: (error: GameError) => void): void {
    this.errorCallbacks.delete(callback);
  }

  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    return this.gameState.connectionStatus;
  }

  sendDrawingStroke(strokeData: any): void {
    // Mock implementation - just log the stroke
    console.log('Mock: Drawing stroke sent', strokeData);
  }

  getPlayerCount(): number {
    return this.gameState.players.length;
  }

  getMaxPlayers(): number {
    return this.gameState.maxPlayers || 8;
  }

  getLastError(): GameError | null {
    return this.gameState.lastError || null;
  }

  clearError(): void {
    this.gameState = {
      ...this.gameState,
      lastError: undefined
    };
    this.notifyStateChange();
  }

  setTieBreakerCallbacks(callbacks: TieBreakerCallbacks): void {
    // Mock implementation - just log the callbacks
    console.log('Mock: Tie breaker callbacks set', callbacks);
  }

  // Mock-specific methods
  simulateState(partialState: Partial<GameState>): void {
    this.gameState = {
      ...this.gameState,
      ...partialState
    };
    this.notifyStateChange();
  }

  simulateError(errorCode: GameErrorCode, message?: string): void {
    const error = createGameError(errorCode, message || 'Mock error for testing');
    this.errorCallbacks.forEach(callback => callback(error));
  }

  setNetworkDelay(delay: number): void {
    this.mockNetworkDelay = delay;
  }

  private createMockResults(): GameResult[] {
    return [
      {
        playerId: 'mock-player-1',
        playerName: 'MockPlayer1',
        rank: 1,
        score: 85,
        feedback: 'Excellent drawing!',
        canvasData: 'data:image/png;base64,mock-canvas-data-1'
      },
      {
        playerId: 'mock-player-2',
        playerName: 'MockPlayer2',
        rank: 2,
        score: 72,
        feedback: 'Good effort!',
        canvasData: 'data:image/png;base64,mock-canvas-data-2'
      }
    ];
  }

  private notifyStateChange(): void {
    this.stateCallbacks.forEach(callback => callback(this.getGameState()));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Mock Network Manager for testing network scenarios
 */
export class MockNetworkManager {
  private isConnected: boolean = true;
  private latency: number = 100;
  private errorRate: number = 0;
  private responses: Map<string, MockServerResponse> = new Map();

  setConnected(connected: boolean): void {
    this.isConnected = connected;
  }

  setLatency(ms: number): void {
    this.latency = ms;
  }

  setErrorRate(rate: number): void {
    this.errorRate = Math.max(0, Math.min(1, rate));
  }

  addMockResponse(event: string, response: MockServerResponse): void {
    this.responses.set(event, response);
  }

  async sendMessage(event: string, data: any): Promise<any> {
    // Simulate network error
    if (Math.random() < this.errorRate) {
      throw new Error('Simulated network error');
    }

    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, this.latency));

    // Return mock response if available
    const mockResponse = this.responses.get(event);
    if (mockResponse) {
      if (mockResponse.delay) {
        await new Promise(resolve => setTimeout(resolve, mockResponse.delay));
      }
      return mockResponse.data;
    }

    return { success: true, event, receivedData: data };
  }
}

/**
 * Main Testing Framework
 */
export class TestingFramework {
  private mockGameManager: MockGameManager | null = null;
  private mockNetworkManager: MockNetworkManager | null = null;

  /**
   * Create a mock GameManager for testing
   */
  createMockGameManager(): MockGameManager {
    this.mockGameManager = new MockGameManager();
    return this.mockGameManager;
  }

  /**
   * Create a mock network manager for testing
   */
  createMockNetworkManager(): MockNetworkManager {
    this.mockNetworkManager = new MockNetworkManager();
    return this.mockNetworkManager;
  }

  /**
   * Run a complete test scenario
   */
  async runScenario(scenario: TestScenario, gameManager?: GameManager): Promise<TestResult> {
    const startTime = Date.now();
    const targetManager = gameManager || this.createMockGameManager();

    try {
      console.log(`🎬 Running scenario: ${scenario.name}`);
      
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        console.log(`  📋 Step ${i + 1}: ${step.action}`);
        
        await this.executeTestStep(step, targetManager);
        
        // Run validation if provided
        if (step.validation) {
          const gameState = targetManager.getGameState();
          if (gameState) {
            const validation = step.validation(gameState);
            if (!validation.isValid) {
              throw new Error(`Validation failed at step ${i + 1}: ${validation.errors.join(', ')}`);
            }
          }
        }
        
        // Apply delay if specified
        if (step.delay) {
          await new Promise(resolve => setTimeout(resolve, step.delay));
        }
      }

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        message: `Scenario "${scenario.name}" completed successfully`,
        duration,
        details: {
          steps: scenario.steps.length,
          expectedDuration: scenario.expectedDuration,
          actualDuration: duration
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        message: `Scenario "${scenario.name}" failed: ${error}`,
        duration,
        details: {
          error: error instanceof Error ? error.message : String(error),
          scenario
        }
      };
    }
  }

  /**
   * Execute a single test step
   */
  private async executeTestStep(step: TestStep, gameManager: GameManager): Promise<void> {
    switch (step.action) {
      case 'hostGame':
        await gameManager.hostGame(step.data?.playerName || 'TestHost');
        break;
      
      case 'joinGame':
        await gameManager.joinGame(
          step.data?.playerName || 'TestPlayer',
          step.data?.roomCode || 'TEST123'
        );
        break;
      
      case 'startVoting':
        gameManager.startVoting();
        break;
      
      case 'voteForWord':
        gameManager.voteForWord(step.data?.word || 'test');
        break;
      
      case 'submitDrawing':
        await gameManager.submitDrawing(step.data?.canvasData || 'mock-canvas-data');
        break;
      
      case 'finishDrawing':
        gameManager.finishDrawing();
        break;
      
      case 'disconnect':
        gameManager.disconnect();
        break;
      
      case 'simulateState':
        if ('simulateState' in gameManager) {
          (gameManager as any).simulateState(step.data);
        }
        break;
      
      case 'simulateError':
        if (gameManager instanceof MockGameManager) {
          gameManager.simulateError(step.data?.errorCode || GameErrorCode.CONNECTION_LOST);
        }
        break;
      
      default:
        console.warn(`Unknown test step action: ${step.action}`);
    }
  }

  /**
   * Validate game state consistency
   */
  validateGameState(state: GameState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!state.roomCode) {
      errors.push('Missing room code');
    }

    if (!state.players || !Array.isArray(state.players)) {
      errors.push('Invalid players array');
    } else {
      // Player validation
      if (state.players.length === 0) {
        warnings.push('No players in game');
      }

      // Host validation
      const hosts = state.players.filter(p => p.isHost);
      if (hosts.length === 0) {
        errors.push('No host player found');
      } else if (hosts.length > 1) {
        errors.push('Multiple host players found');
      }

      // Player ID uniqueness
      const playerIds = state.players.map(p => p.id);
      const uniqueIds = new Set(playerIds);
      if (playerIds.length !== uniqueIds.size) {
        errors.push('Duplicate player IDs found');
      }
    }

    // Phase-specific validation
    switch (state.gamePhase) {
      case 'voting':
        if (!state.wordOptions || state.wordOptions.length === 0) {
          errors.push('Voting phase without word options');
        }
        break;
      
      case 'drawing':
        if (!state.chosenWord) {
          errors.push('Drawing phase without chosen word');
        }
        if (state.timeRemaining <= 0) {
          warnings.push('Drawing phase with no time remaining');
        }
        break;
      
      case 'results':
        if (!state.results || state.results.length === 0) {
          errors.push('Results phase without results');
        }
        break;
    }

    // Connection validation
    if (!state.isConnected && state.connectionStatus === 'connected') {
      errors.push('Inconsistent connection state');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(results: TestResult[]): string {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalDuration / totalTests;

    const report = [
      '🧪 TEST REPORT',
      '===============',
      `Total Tests: ${totalTests}`,
      `Passed: ${passedTests}`,
      `Failed: ${failedTests}`,
      `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`,
      `Total Duration: ${totalDuration}ms`,
      `Average Duration: ${averageDuration.toFixed(1)}ms`,
      '',
      '📊 DETAILED RESULTS:',
      '-------------------'
    ];

    results.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      report.push(`${index + 1}. ${status} - ${result.message} (${result.duration}ms)`);
      
      if (!result.success && result.details) {
        report.push(`   Error: ${result.details.error || 'Unknown error'}`);
      }
    });

    return report.join('\n');
  }

  /**
   * Create predefined test scenarios
   */
  createBasicGameFlowScenario(): TestScenario {
    return {
      name: 'Basic Game Flow',
      description: 'Tests complete game flow from hosting to results',
      expectedDuration: 5000,
      steps: [
        {
          action: 'hostGame',
          data: { playerName: 'TestHost' },
          delay: 100,
          validation: (state) => {
            const errors = [];
            if (state.gamePhase !== 'lobby') errors.push('Should be in lobby phase');
            if (!state.currentPlayer?.isHost) errors.push('Should be host');
            return { isValid: errors.length === 0, errors, warnings: [] };
          }
        },
        {
          action: 'startVoting',
          delay: 100,
          validation: (state) => {
            const errors = [];
            if (state.gamePhase !== 'voting') errors.push('Should be in voting phase');
            if (!state.wordOptions?.length) errors.push('Should have word options');
            return { isValid: errors.length === 0, errors, warnings: [] };
          }
        },
        {
          action: 'voteForWord',
          data: { word: 'cat' },
          delay: 100
        },
        {
          action: 'simulateState',
          data: { 
            gamePhase: 'drawing', 
            chosenWord: 'cat', 
            timeRemaining: 60 
          },
          delay: 100
        },
        {
          action: 'submitDrawing',
          data: { canvasData: 'mock-drawing-data' },
          delay: 100
        },
        {
          action: 'finishDrawing',
          delay: 100,
          validation: (state) => {
            const errors = [];
            if (state.gamePhase !== 'results') errors.push('Should be in results phase');
            if (!state.results?.length) errors.push('Should have results');
            return { isValid: errors.length === 0, errors, warnings: [] };
          }
        }
      ]
    };
  }
}

// Export singleton instance
export const testingFramework = new TestingFramework();