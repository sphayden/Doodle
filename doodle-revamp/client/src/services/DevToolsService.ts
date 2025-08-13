/**
 * DevToolsService - Provides programmatic testing and debugging capabilities
 * for the Doodle game. This service allows developers to simulate game states,
 * test multiplayer scenarios, and debug network issues.
 */

import { GameState, Player, GameResult, GameErrorCode, createGameError } from '../interfaces/GameManager';
// import { testingFramework, TestScenario } from '../utils/TestingFramework'; // Removed - TestingFramework was deleted

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

export interface NetworkMessage {
  type: string;
  data: any;
  timestamp: Date;
  direction: 'sent' | 'received';
}

export interface GameScenario {
  name: string;
  description: string;
  steps: ScenarioStep[];
}

export interface ScenarioStep {
  action: string;
  data?: any;
  expectedResult?: any;
  delay?: number;
  validation?: (state: GameState) => { isValid: boolean; errors: string[]; warnings: string[] };
}

export interface TestScenario {
  name: string;
  description: string;
  steps: ScenarioStep[];
}

export class DevToolsService {
  private gameManager: any;
  private networkMessages: NetworkMessage[] = [];
  private isRecording: boolean = false;
  private maxMessageHistory: number = 1000;

  constructor(gameManager: any) {
    this.gameManager = gameManager;
    this.setupMessageInterception();
  }

  /**
   * Setup message interception for debugging
   */
  private setupMessageInterception(): void {
    try {
      // Skip message interception to avoid socket binding issues
      // This feature can be enabled later if needed for debugging
      console.log('DevTools: Message interception disabled to prevent socket binding issues');
    } catch (error) {
      console.warn('DevTools: Failed to setup message interception:', error);
    }
  }

  /**
   * Record network message for debugging
   */
  private recordMessage(type: string, data: any, direction: 'sent' | 'received'): void {
    if (!this.isRecording) return;

    const message: NetworkMessage = {
      type,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: new Date(),
      direction
    };

    this.networkMessages.push(message);

    // Limit message history to prevent memory issues
    if (this.networkMessages.length > this.maxMessageHistory) {
      this.networkMessages.shift();
    }
  }

  /**
   * Start recording network messages
   */
  startRecording(): void {
    this.isRecording = true;
    this.networkMessages = [];
    console.log('🔍 DevTools: Started recording network messages');
  }

  /**
   * Stop recording network messages
   */
  stopRecording(): void {
    this.isRecording = false;
    console.log('🔍 DevTools: Stopped recording network messages');
  }

  /**
   * Get recorded network messages
   */
  getNetworkMessages(): NetworkMessage[] {
    return [...this.networkMessages];
  }

  /**
   * Clear recorded messages
   */
  clearMessages(): void {
    this.networkMessages = [];
  }

  /**
   * Simulate multiple players joining the game
   */
  simulateMultiplePlayers(count: number): void {
    console.log(`🎭 DevTools: Simulating ${count} players`);
    
    // This would typically create mock connections
    // For now, we'll simulate the state changes
    const mockPlayers: Player[] = [];
    
    for (let i = 0; i < count; i++) {
      mockPlayers.push({
        id: `mock-player-${i}`,
        name: `TestPlayer${i + 1}`,
        isHost: i === 0,
        isConnected: true,
        hasVoted: false,
        hasSubmittedDrawing: false,
        score: 0
      });
    }

    // Update game state with mock players
    this.simulateGameState({
      players: mockPlayers
    });
  }

  /**
   * Simulate a voting tie scenario
   */
  simulateVotingTie(words: string[]): void {
    console.log('🎲 DevTools: Simulating voting tie with words:', words);
    
    const votes: Record<string, number> = {};
    const tieVoteCount = 2;
    
    words.forEach(word => {
      votes[word] = tieVoteCount;
    });

    this.simulateGameState({
      gamePhase: 'voting',
      wordOptions: words,
      voteCounts: votes
    });
  }

  /**
   * Simulate network error
   */
  simulateNetworkError(): void {
    console.log('🚨 DevTools: Simulating network error');
    
    this.simulateGameState({
      isConnected: false,
      connectionStatus: 'error',
      lastError: {
        code: 'NETWORK_ERROR',
        message: 'Simulated network error for testing',
        timestamp: new Date(),
        recoverable: true
      }
    });
  }

  /**
   * Simulate player disconnection
   */
  simulateDisconnection(): void {
    console.log('🔌 DevTools: Simulating disconnection');
    
    this.simulateGameState({
      isConnected: false,
      connectionStatus: 'disconnected'
    });
  }

  /**
   * Skip to voting phase
   */
  skipToVoting(): void {
    console.log('⏭️ DevTools: Skipping to voting phase');
    
    this.simulateGameState({
      gamePhase: 'voting',
      wordOptions: ['cat', 'dog', 'bird', 'fish']
    });
  }

  /**
   * Skip to drawing phase
   */
  skipToDrawing(word: string): void {
    console.log('✏️ DevTools: Skipping to drawing phase with word:', word);
    
    this.simulateGameState({
      gamePhase: 'drawing',
      chosenWord: word,
      timeRemaining: 60,
      drawingTimeLimit: 60
    });
  }

  /**
   * Skip to results phase
   */
  skipToResults(mockResults?: GameResult[]): void {
    console.log('🏆 DevTools: Skipping to results phase');
    
    const defaultResults: GameResult[] = [
      {
        playerId: 'player1',
        playerName: 'TestPlayer1',
        rank: 1,
        score: 85,
        feedback: 'Great drawing!',
        canvasData: 'mock-canvas-data-1'
      },
      {
        playerId: 'player2',
        playerName: 'TestPlayer2',
        rank: 2,
        score: 72,
        feedback: 'Good effort!',
        canvasData: 'mock-canvas-data-2'
      }
    ];

    this.simulateGameState({
      gamePhase: 'results',
      results: mockResults || defaultResults
    });
  }

  /**
   * Simulate partial game state changes
   */
  simulateGameState(partialState: Partial<GameState>): void {
    console.log('🎮 DevTools: Simulating game state:', partialState);
    
    // Call the game manager's simulateState method if available
    if ('simulateState' in this.gameManager && typeof this.gameManager.simulateState === 'function') {
      this.gameManager.simulateState(partialState);
    } else {
      console.warn('GameManager does not support state simulation');
    }
  }

  /**
   * Get current game state for inspection
   */
  inspectGameState(): GameState | null {
    if (this.gameManager.getGameState) {
      return this.gameManager.getGameState();
    }
    return null;
  }

  /**
   * Export current game session data
   */
  exportGameSession(): string {
    const sessionData = {
      gameState: this.inspectGameState(),
      networkMessages: this.getNetworkMessages(),
      timestamp: new Date(),
      version: '1.0.0'
    };

    return JSON.stringify(sessionData, null, 2);
  }

  /**
   * Import game session data
   */
  importGameSession(sessionData: string): boolean {
    try {
      const data = JSON.parse(sessionData);
      
      if (data.gameState) {
        this.simulateGameState(data.gameState);
      }
      
      if (data.networkMessages) {
        this.networkMessages = data.networkMessages;
      }
      
      console.log('📥 DevTools: Successfully imported game session');
      return true;
    } catch (error) {
      console.error('❌ DevTools: Failed to import game session:', error);
      return false;
    }
  }

  /**
   * Run automated game flow test (TestingFramework removed)
   */
  async runGameFlowTest(): Promise<TestResult> {
    console.log('🧪 DevTools: Running basic game flow test');
    const startTime = Date.now();
    
    try {
      // Basic game flow simulation without TestingFramework
      this.simulateMultiplePlayers(2);
      await this.delay(1000);
      this.skipToVoting();
      await this.delay(1000);
      this.skipToDrawing('test');
      await this.delay(1000);
      this.skipToResults();
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        message: 'Basic game flow test completed',
        duration,
        details: { phases: ['lobby', 'voting', 'drawing', 'results'] }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        message: `Game flow test failed: ${error}`,
        duration,
        details: { error }
      };
    }
  }

  /**
   * Run a custom test scenario (TestingFramework removed - use runScenario instead)
   */
  async runCustomScenario(scenario: GameScenario): Promise<TestResult> {
    console.log('⚠️ DevTools: runCustomScenario is deprecated. Use runScenario instead.');
    return this.runScenario(scenario);
  }

  /**
   * Simulate network connection issues
   */
  simulateConnectionIssues(severity: 'mild' | 'moderate' | 'severe' = 'moderate'): void {
    console.log(`🌐 DevTools: Simulating ${severity} connection issues`);
    
    let errorCode: GameErrorCode;
    let reconnectable = true;
    
    switch (severity) {
      case 'mild':
        errorCode = GameErrorCode.CONNECTION_TIMEOUT;
        break;
      case 'moderate':
        errorCode = GameErrorCode.CONNECTION_LOST;
        break;
      case 'severe':
        errorCode = GameErrorCode.CONNECTION_FAILED;
        reconnectable = false;
        break;
    }

    const error = createGameError(
      errorCode,
      `Simulated ${severity} connection issue`,
      { severity, simulated: true },
      reconnectable
    );

    // Always update connection state directly
    this.simulateGameState({
      isConnected: false,
      connectionStatus: 'error',
      lastError: error
    });
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(testResults: TestResult[]): string {
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: testResults.length,
      passed: testResults.filter(r => r.success).length,
      failed: testResults.filter(r => !r.success).length,
      totalDuration: testResults.reduce((sum, r) => sum + r.duration, 0),
      results: testResults
    };
    
    return JSON.stringify(report, null, 2);
  }

  /**
   * Simulate progressive network degradation
   */
  async simulateNetworkDegradation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🌊 DevTools: Simulating progressive network degradation');
      
      // Step 1: Mild issues
      this.simulateConnectionIssues('mild');
      await this.delay(2000);
      
      // Step 2: Moderate issues
      this.simulateConnectionIssues('moderate');
      await this.delay(2000);
      
      // Step 3: Severe issues
      this.simulateConnectionIssues('severe');
      await this.delay(2000);
      
      // Step 4: Recovery
      this.simulateGameState({
        isConnected: true,
        connectionStatus: 'connected',
        lastError: undefined
      });
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        message: 'Network degradation simulation completed',
        duration,
        details: {
          phases: ['mild', 'moderate', 'severe', 'recovery'],
          totalTime: duration
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        message: `Network degradation simulation failed: ${error}`,
        duration,
        details: { error }
      };
    }
  }

  /**
   * Validate game state consistency
   */
  validateStateConsistency(): ValidationResult {
    const gameState = this.inspectGameState();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!gameState) {
      errors.push('No game state available');
      return { isValid: false, errors, warnings };
    }

    // Validate player consistency
    if (gameState.players && gameState.players.length === 0) {
      warnings.push('No players in game');
    }

    // Validate phase consistency
    if (gameState.gamePhase === 'voting' && !gameState.wordOptions?.length) {
      errors.push('Voting phase without word options');
    }

    if (gameState.gamePhase === 'drawing' && !gameState.chosenWord) {
      errors.push('Drawing phase without chosen word');
    }

    if (gameState.gamePhase === 'results' && !gameState.results?.length) {
      errors.push('Results phase without results');
    }

    // Validate connection state
    if (!gameState.isConnected && gameState.connectionStatus === 'connected') {
      errors.push('Inconsistent connection state');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Utility method for delays in async operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Advanced debugging: Get detailed network statistics
   */
  getNetworkStatistics(): any {
    const messages = this.getNetworkMessages();
    const stats = {
      totalMessages: messages.length,
      sentMessages: messages.filter(m => m.direction === 'sent').length,
      receivedMessages: messages.filter(m => m.direction === 'received').length,
      messageTypes: {} as Record<string, number>,
      averageMessageSize: 0,
      timeRange: {
        start: messages.length > 0 ? messages[0].timestamp : null,
        end: messages.length > 0 ? messages[messages.length - 1].timestamp : null
      }
    };

    // Count message types
    messages.forEach(msg => {
      stats.messageTypes[msg.type] = (stats.messageTypes[msg.type] || 0) + 1;
    });

    // Calculate average message size
    if (messages.length > 0) {
      const totalSize = messages.reduce((sum, msg) => {
        return sum + JSON.stringify(msg.data).length;
      }, 0);
      stats.averageMessageSize = Math.round(totalSize / messages.length);
    }

    return stats;
  }

  /**
   * Advanced debugging: Monitor game state changes over time
   */
  private stateHistory: Array<{ timestamp: Date; state: Partial<GameState> }> = [];
  private maxStateHistory: number = 100;

  recordStateChange(state: GameState): void {
    this.stateHistory.push({
      timestamp: new Date(),
      state: JSON.parse(JSON.stringify(state)) // Deep clone
    });

    // Limit history size
    if (this.stateHistory.length > this.maxStateHistory) {
      this.stateHistory.shift();
    }
  }

  getStateHistory(): Array<{ timestamp: Date; state: Partial<GameState> }> {
    return [...this.stateHistory];
  }

  /**
   * Advanced debugging: Analyze state consistency across time
   */
  analyzeStateConsistency(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const history = this.getStateHistory();

    if (history.length < 2) {
      warnings.push('Insufficient state history for analysis');
      return { isValid: true, errors, warnings };
    }

    // Check for invalid state transitions
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1].state;
      const curr = history[i].state;

      // Check phase transitions
      if (prev.gamePhase && curr.gamePhase) {
        const validTransitions: Record<string, string[]> = {
          'lobby': ['voting'],
          'voting': ['drawing'],
          'drawing': ['judging'],
          'judging': ['results'],
          'results': ['lobby', 'voting']
        };

        if (prev.gamePhase !== curr.gamePhase) {
          const allowed = validTransitions[prev.gamePhase] || [];
          if (!allowed.includes(curr.gamePhase)) {
            errors.push(`Invalid phase transition: ${prev.gamePhase} -> ${curr.gamePhase}`);
          }
        }
      }

      // Check player count consistency
      if (prev.players && curr.players) {
        if (curr.players.length < prev.players.length) {
          warnings.push(`Player count decreased: ${prev.players.length} -> ${curr.players.length}`);
        }
      }

      // Check connection status consistency
      if (prev.isConnected === true && curr.isConnected === false) {
        warnings.push('Connection lost detected');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Advanced debugging: Performance monitoring
   */
  private performanceMetrics: Array<{ 
    timestamp: Date; 
    action: string; 
    duration: number; 
    details?: any 
  }> = [];

  recordPerformanceMetric(action: string, duration: number, details?: any): void {
    this.performanceMetrics.push({
      timestamp: new Date(),
      action,
      duration,
      details
    });

    // Keep only last 50 metrics
    if (this.performanceMetrics.length > 50) {
      this.performanceMetrics.shift();
    }
  }

  getPerformanceMetrics(): Array<{ 
    timestamp: Date; 
    action: string; 
    duration: number; 
    details?: any 
  }> {
    return [...this.performanceMetrics];
  }

  /**
   * Advanced debugging: Memory usage tracking
   */
  getMemoryUsage(): any {
    const usage = {
      networkMessages: this.networkMessages.length,
      stateHistory: this.stateHistory.length,
      performanceMetrics: this.performanceMetrics.length,
      estimatedMemoryKB: 0
    };

    // Rough memory estimation
    const networkMemory = this.networkMessages.reduce((sum, msg) => {
      return sum + JSON.stringify(msg).length;
    }, 0);

    const stateMemory = this.stateHistory.reduce((sum, entry) => {
      return sum + JSON.stringify(entry).length;
    }, 0);

    const perfMemory = this.performanceMetrics.reduce((sum, metric) => {
      return sum + JSON.stringify(metric).length;
    }, 0);

    usage.estimatedMemoryKB = Math.round((networkMemory + stateMemory + perfMemory) / 1024);

    return usage;
  }

  /**
   * Advanced debugging: Clear all debugging data
   */
  clearAllDebuggingData(): void {
    this.networkMessages = [];
    this.stateHistory = [];
    this.performanceMetrics = [];
    console.log('🧹 DevTools: All debugging data cleared');
  }

  /**
   * Run a custom game scenario
   */
  async runScenario(scenario: GameScenario): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🎬 DevTools: Running scenario "${scenario.name}"`);
      
      for (const step of scenario.steps) {
        console.log(`  📋 Executing step: ${step.action}`);
        
        switch (step.action) {
          case 'simulateMultiplePlayers':
            this.simulateMultiplePlayers(step.data?.count || 2);
            break;
          case 'skipToVoting':
            this.skipToVoting();
            break;
          case 'skipToDrawing':
            this.skipToDrawing(step.data?.word || 'test');
            break;
          case 'skipToResults':
            this.skipToResults(step.data?.results);
            break;
          case 'simulateNetworkError':
            this.simulateNetworkError();
            break;
          case 'simulateDisconnection':
            this.simulateDisconnection();
            break;
          case 'simulateState':
            this.simulateGameState(step.data);
            break;
          case 'simulateConnectionIssues':
            this.simulateConnectionIssues(step.data?.severity || 'moderate');
            break;
          case 'hostGame':
          case 'joinGame':
          case 'startVoting':
          case 'simulateError':
            // These actions would typically call methods on the game manager
            // For testing purposes, we can simulate their effects
            if (step.action === 'startVoting') {
              this.simulateGameState({ gamePhase: 'voting', wordOptions: ['cat', 'dog', 'bird', 'fish'] });
            }
            break;
          default:
            console.warn(`Unknown scenario step: ${step.action}`);
        }
        
        if (step.delay) {
          await this.delay(step.delay);
        }
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        message: `Scenario "${scenario.name}" completed successfully`,
        duration,
        details: { scenario }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        message: `Scenario "${scenario.name}" failed: ${error}`,
        duration,
        details: { scenario, error }
      };
    }
  }
}