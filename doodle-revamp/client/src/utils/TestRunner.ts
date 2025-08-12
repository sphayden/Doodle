/**
 * TestRunner - Automated test execution and reporting for Doodle game
 * Provides comprehensive test suite execution with detailed reporting
 */

import { testingFramework, TestScenario, TestResult as FrameworkTestResult } from './TestingFramework';
import { DevToolsService } from '../services/DevToolsService';
import { GameManager, GameState, GameErrorCode } from '../interfaces/GameManager';

export interface TestSuiteResult {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  results: TestExecutionResult[];
  summary: string;
}

export interface TestExecutionResult {
  testName: string;
  success: boolean;
  duration: number;
  message: string;
  details?: any;
  error?: string;
}

export interface RegressionTestResult {
  testName: string;
  expectedBehavior: string;
  actualBehavior: string;
  passed: boolean;
  duration: number;
}

export class TestRunner {
  private devToolsService: DevToolsService;
  private gameManager: GameManager;
  private results: TestSuiteResult[] = [];

  constructor(gameManager: GameManager) {
    this.gameManager = gameManager;
    this.devToolsService = new DevToolsService(gameManager);
  }

  /**
   * Run complete test suite
   */
  async runFullTestSuite(): Promise<TestSuiteResult[]> {
    console.log('🧪 Starting comprehensive test suite...');
    
    this.results = [];
    
    // Run all test suites
    await this.runBasicFunctionalityTests();
    await this.runNetworkResilienceTests();
    await this.runGameFlowTests();
    await this.runPerformanceTests();
    await this.runRegressionTests();
    
    console.log('✅ Test suite completed!');
    return this.results;
  }

  /**
   * Run basic functionality tests
   */
  async runBasicFunctionalityTests(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestExecutionResult[] = [];

    console.log('🔧 Running basic functionality tests...');

    // Test 1: Game Manager Initialization
    results.push(await this.runTest('GameManager Initialization', async () => {
      const gameState = this.gameManager.getGameState();
      if (!gameState) {
        throw new Error('GameManager should have initial state');
      }
      return { success: true, message: 'GameManager initialized correctly' };
    }));

    // Test 2: Host Game
    results.push(await this.runTest('Host Game', async () => {
      const roomCode = await this.gameManager.hostGame('TestHost');
      if (!roomCode || typeof roomCode !== 'string') {
        throw new Error('Host game should return valid room code');
      }
      return { success: true, message: `Game hosted with room code: ${roomCode}` };
    }));

    // Test 3: Start Voting
    results.push(await this.runTest('Start Voting', async () => {
      this.gameManager.startVoting();
      const gameState = this.gameManager.getGameState();
      if (gameState?.gamePhase !== 'voting') {
        throw new Error('Game should be in voting phase');
      }
      if (!gameState.wordOptions || gameState.wordOptions.length === 0) {
        throw new Error('Should have word options in voting phase');
      }
      return { success: true, message: `Voting started with ${gameState.wordOptions.length} words` };
    }));

    // Test 4: Vote for Word
    results.push(await this.runTest('Vote for Word', async () => {
      const gameState = this.gameManager.getGameState();
      const firstWord = gameState?.wordOptions?.[0];
      if (!firstWord) {
        throw new Error('No words available to vote for');
      }
      
      this.gameManager.voteForWord(firstWord);
      const updatedState = this.gameManager.getGameState();
      
      if (!updatedState?.voteCounts || updatedState.voteCounts[firstWord] !== 1) {
        throw new Error('Vote should be recorded');
      }
      return { success: true, message: `Vote recorded for: ${firstWord}` };
    }));

    // Test 5: State Validation
    results.push(await this.runTest('State Validation', async () => {
      const gameState = this.gameManager.getGameState();
      if (!gameState) {
        throw new Error('No game state available');
      }
      
      const validation = testingFramework.validateGameState(gameState);
      if (!validation.isValid) {
        throw new Error(`State validation failed: ${validation.errors.join(', ')}`);
      }
      return { success: true, message: 'Game state is valid' };
    }));

    const duration = Date.now() - startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;

    const suite: TestSuiteResult = {
      suiteName: 'Basic Functionality Tests',
      totalTests: results.length,
      passedTests: passed,
      failedTests: failed,
      duration,
      results,
      summary: `${passed}/${results.length} tests passed in ${duration}ms`
    };

    this.results.push(suite);
    return suite;
  }

  /**
   * Run network resilience tests
   */
  async runNetworkResilienceTests(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestExecutionResult[] = [];

    console.log('🌐 Running network resilience tests...');

    // Test 1: Network Error Simulation
    results.push(await this.runTest('Network Error Simulation', async () => {
      this.devToolsService.simulateNetworkError();
      const gameState = this.gameManager.getGameState();
      
      if (gameState?.isConnected !== false) {
        throw new Error('Should be disconnected after network error');
      }
      return { success: true, message: 'Network error simulation successful' };
    }));

    // Test 2: Connection Issues - Mild
    results.push(await this.runTest('Mild Connection Issues', async () => {
      this.devToolsService.simulateConnectionIssues('mild');
      const gameState = this.gameManager.getGameState();
      
      if (!gameState?.lastError || gameState.lastError.code !== GameErrorCode.CONNECTION_TIMEOUT) {
        throw new Error('Should have connection timeout error');
      }
      return { success: true, message: 'Mild connection issues handled correctly' };
    }));

    // Test 3: Connection Issues - Severe
    results.push(await this.runTest('Severe Connection Issues', async () => {
      this.devToolsService.simulateConnectionIssues('severe');
      const gameState = this.gameManager.getGameState();
      
      if (!gameState?.lastError || gameState.lastError.code !== GameErrorCode.CONNECTION_FAILED) {
        throw new Error('Should have connection failed error');
      }
      if (gameState.lastError.recoverable !== false) {
        throw new Error('Severe connection errors should not be recoverable');
      }
      return { success: true, message: 'Severe connection issues handled correctly' };
    }));

    // Test 4: Network Degradation Test
    results.push(await this.runTest('Network Degradation', async () => {
      const result = await this.devToolsService.simulateNetworkDegradation();
      if (!result.success) {
        throw new Error('Network degradation test failed');
      }
      return { success: true, message: 'Network degradation test completed' };
    }));

    // Test 5: Recovery Test
    results.push(await this.runTest('Network Recovery', async () => {
      // Simulate disconnection
      this.devToolsService.simulateDisconnection();
      
      // Simulate recovery
      this.devToolsService.simulateGameState({
        isConnected: true,
        connectionStatus: 'connected',
        lastError: undefined
      });
      
      const gameState = this.gameManager.getGameState();
      if (!gameState?.isConnected || gameState.connectionStatus !== 'connected') {
        throw new Error('Should be connected after recovery');
      }
      return { success: true, message: 'Network recovery successful' };
    }));

    const duration = Date.now() - startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;

    const suite: TestSuiteResult = {
      suiteName: 'Network Resilience Tests',
      totalTests: results.length,
      passedTests: passed,
      failedTests: failed,
      duration,
      results,
      summary: `${passed}/${results.length} network tests passed in ${duration}ms`
    };

    this.results.push(suite);
    return suite;
  }

  /**
   * Run game flow tests
   */
  async runGameFlowTests(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestExecutionResult[] = [];

    console.log('🎮 Running game flow tests...');

    // Test 1: Complete Game Flow
    results.push(await this.runTest('Complete Game Flow', async () => {
      const result = await this.devToolsService.runGameFlowTest();
      if (!result.success) {
        throw new Error(`Game flow test failed: ${result.message}`);
      }
      return { success: true, message: 'Complete game flow executed successfully' };
    }));

    // Test 2: Voting Tie Scenario
    results.push(await this.runTest('Voting Tie Resolution', async () => {
      const words = ['cat', 'dog', 'bird'];
      this.devToolsService.simulateVotingTie(words);
      
      const gameState = this.gameManager.getGameState();
      if (gameState?.gamePhase !== 'voting') {
        throw new Error('Should be in voting phase');
      }
      
      const hasAllWords = words.every(word => 
        gameState.wordOptions?.includes(word) && gameState.voteCounts?.[word] === 2
      );
      if (!hasAllWords) {
        throw new Error('All words should have equal votes');
      }
      return { success: true, message: 'Voting tie scenario handled correctly' };
    }));

    // Test 3: Multiple Players Simulation
    results.push(await this.runTest('Multiple Players', async () => {
      this.devToolsService.simulateMultiplePlayers(6);
      
      const gameState = this.gameManager.getGameState();
      if (!gameState?.players || gameState.players.length !== 6) {
        throw new Error('Should have 6 players');
      }
      
      const hostCount = gameState.players.filter(p => p.isHost).length;
      if (hostCount !== 1) {
        throw new Error('Should have exactly one host');
      }
      return { success: true, message: '6 players simulated correctly' };
    }));

    // Test 4: Phase Transitions
    results.push(await this.runTest('Phase Transitions', async () => {
      this.devToolsService.skipToVoting();
      let gameState = this.gameManager.getGameState();
      if (gameState?.gamePhase !== 'voting') {
        throw new Error('Should transition to voting');
      }

      this.devToolsService.skipToDrawing('house');
      gameState = this.gameManager.getGameState();
      if (gameState?.gamePhase !== 'drawing' || gameState.chosenWord !== 'house') {
        throw new Error('Should transition to drawing with correct word');
      }

      this.devToolsService.skipToResults();
      gameState = this.gameManager.getGameState();
      if (gameState?.gamePhase !== 'results') {
        throw new Error('Should transition to results');
      }
      return { success: true, message: 'Phase transitions working correctly' };
    }));

    const duration = Date.now() - startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;

    const suite: TestSuiteResult = {
      suiteName: 'Game Flow Tests',
      totalTests: results.length,
      passedTests: passed,
      failedTests: failed,
      duration,
      results,
      summary: `${passed}/${results.length} game flow tests passed in ${duration}ms`
    };

    this.results.push(suite);
    return suite;
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestExecutionResult[] = [];

    console.log('⚡ Running performance tests...');

    // Test 1: Rapid State Changes
    results.push(await this.runTest('Rapid State Changes', async () => {
      const testStartTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        this.devToolsService.simulateGameState({
          timeRemaining: 60 - (i % 60)
        });
      }
      
      const testDuration = Date.now() - testStartTime;
      if (testDuration > 1000) {
        throw new Error(`Too slow: ${testDuration}ms for 100 state changes`);
      }
      return { success: true, message: `100 state changes completed in ${testDuration}ms` };
    }));

    // Test 2: Large Player Simulation
    results.push(await this.runTest('Large Player Simulation', async () => {
      const testStartTime = Date.now();
      
      this.devToolsService.simulateMultiplePlayers(8);
      
      const testDuration = Date.now() - testStartTime;
      const gameState = this.gameManager.getGameState();
      
      if (testDuration > 100) {
        throw new Error(`Too slow: ${testDuration}ms for 8 players`);
      }
      if (gameState?.players?.length !== 8) {
        throw new Error('Should have 8 players');
      }
      return { success: true, message: `8 players simulated in ${testDuration}ms` };
    }));

    // Test 3: Message Recording Performance
    results.push(await this.runTest('Message Recording Performance', async () => {
      const testStartTime = Date.now();
      
      this.devToolsService.startRecording();
      
      // Generate many messages
      for (let i = 0; i < 50; i++) {
        this.gameManager.voteForWord(`word${i}`);
      }
      
      const messages = this.devToolsService.getNetworkMessages();
      this.devToolsService.stopRecording();
      
      const testDuration = Date.now() - testStartTime;
      if (testDuration > 500) {
        throw new Error(`Too slow: ${testDuration}ms for message recording`);
      }
      return { success: true, message: `${messages.length} messages recorded in ${testDuration}ms` };
    }));

    const duration = Date.now() - startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;

    const suite: TestSuiteResult = {
      suiteName: 'Performance Tests',
      totalTests: results.length,
      passedTests: passed,
      failedTests: failed,
      duration,
      results,
      summary: `${passed}/${results.length} performance tests passed in ${duration}ms`
    };

    this.results.push(suite);
    return suite;
  }

  /**
   * Run regression tests
   */
  async runRegressionTests(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestExecutionResult[] = [];

    console.log('🔄 Running regression tests...');

    // Test 1: State Consistency After Operations
    results.push(await this.runTest('State Consistency', async () => {
      // Perform various operations
      await this.gameManager.hostGame('RegressionTest');
      this.gameManager.startVoting();
      this.gameManager.voteForWord('test');
      this.devToolsService.simulateMultiplePlayers(3);
      
      // Validate final state
      const gameState = this.gameManager.getGameState();
      const validation = testingFramework.validateGameState(gameState!);
      
      if (!validation.isValid) {
        throw new Error(`State inconsistency: ${validation.errors.join(', ')}`);
      }
      return { success: true, message: 'State remains consistent after operations' };
    }));

    // Test 2: Memory Leaks
    results.push(await this.runTest('Memory Leak Check', async () => {
      const initialMessages = this.devToolsService.getNetworkMessages().length;
      
      // Perform operations that could cause memory leaks
      this.devToolsService.startRecording();
      for (let i = 0; i < 20; i++) {
        this.devToolsService.simulateMultiplePlayers(8);
        this.devToolsService.clearMessages();
      }
      
      // Check for excessive memory usage
      const finalMessages = this.devToolsService.getNetworkMessages().length;
      if (finalMessages > initialMessages + 50) {
        throw new Error(`Potential memory leak: ${finalMessages} messages retained`);
      }
      return { success: true, message: 'No memory leaks detected' };
    }));

    // Test 3: Error State Recovery
    results.push(await this.runTest('Error State Recovery', async () => {
      // Create error state
      this.devToolsService.simulateNetworkError();
      
      // Attempt recovery
      this.devToolsService.simulateGameState({
        isConnected: true,
        connectionStatus: 'connected',
        lastError: undefined
      });
      
      // Verify normal operation is possible
      this.gameManager.startVoting();
      const gameState = this.gameManager.getGameState();
      
      if (gameState?.gamePhase !== 'voting') {
        throw new Error('Should be able to resume normal operation');
      }
      return { success: true, message: 'Recovery from error state successful' };
    }));

    const duration = Date.now() - startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;

    const suite: TestSuiteResult = {
      suiteName: 'Regression Tests',
      totalTests: results.length,
      passedTests: passed,
      failedTests: failed,
      duration,
      results,
      summary: `${passed}/${results.length} regression tests passed in ${duration}ms`
    };

    this.results.push(suite);
    return suite;
  }

  /**
   * Execute a single test with error handling
   */
  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<TestExecutionResult> {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      return {
        testName,
        success: true,
        duration,
        message: result.message || 'Test passed',
        details: result.details
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        testName,
        success: false,
        duration,
        message: 'Test failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateReport(): string {
    const totalTests = this.results.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalDuration = this.results.reduce((sum, suite) => sum + suite.duration, 0);
    
    const report = [
      '🧪 DOODLE GAME TEST REPORT',
      '==========================',
      '',
      `📊 OVERALL SUMMARY:`,
      `Total Tests: ${totalTests}`,
      `Passed: ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`,
      `Failed: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)`,
      `Total Duration: ${totalDuration}ms`,
      `Average Test Time: ${(totalDuration / totalTests).toFixed(2)}ms`,
      ''
    ];

    // Add suite summaries
    report.push('📋 SUITE RESULTS:');
    report.push('-----------------');
    this.results.forEach(suite => {
      const status = suite.failedTests === 0 ? '✅' : '❌';
      report.push(`${status} ${suite.suiteName}: ${suite.summary}`);
    });
    report.push('');

    // Add detailed results for failed tests
    const failedTests = this.results.flatMap(suite => 
      suite.results.filter(result => !result.success)
    );
    
    if (failedTests.length > 0) {
      report.push('❌ FAILED TESTS:');
      report.push('----------------');
      failedTests.forEach(test => {
        report.push(`- ${test.testName}: ${test.error || test.message}`);
      });
      report.push('');
    }

    // Add performance metrics
    const performanceSuite = this.results.find(s => s.suiteName === 'Performance Tests');
    if (performanceSuite) {
      report.push('⚡ PERFORMANCE METRICS:');
      report.push('----------------------');
      performanceSuite.results.forEach(test => {
        report.push(`${test.testName}: ${test.duration}ms`);
      });
      report.push('');
    }

    report.push(`Generated at: ${new Date().toLocaleString()}`);
    
    return report.join('\n');
  }

  /**
   * Get test results
   */
  getResults(): TestSuiteResult[] {
    return this.results;
  }
}

// Export singleton for easy access
export const createTestRunner = (gameManager: GameManager) => new TestRunner(gameManager);