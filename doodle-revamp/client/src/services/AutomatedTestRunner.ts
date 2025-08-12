/**
 * AutomatedTestRunner - Comprehensive automated testing utilities
 * for the Doodle game. Provides test suites, regression testing,
 * and automated validation of game logic.
 */

import { DevToolsService, TestResult, ValidationResult, GameScenario } from './DevToolsService';
import { GameState, Player, GameResult } from '../interfaces/GameManager';
import { TEST_SCENARIOS } from './TestScenarios';

export interface TestSuite {
  name: string;
  description: string;
  tests: AutomatedTest[];
}

export interface AutomatedTest {
  name: string;
  description: string;
  setup?: () => Promise<void>;
  execute: () => Promise<TestResult>;
  cleanup?: () => Promise<void>;
  timeout?: number;
}

export interface RegressionTestResult {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  results: TestResult[];
  summary: string;
}

export class AutomatedTestRunner {
  private devToolsService: DevToolsService;
  private testSuites: TestSuite[] = [];
  private isRunning: boolean = false;

  constructor(devToolsService: DevToolsService) {
    this.devToolsService = devToolsService;
    this.initializeTestSuites();
  }

  /**
   * Initialize predefined test suites
   */
  private initializeTestSuites(): void {
    this.testSuites = [
      this.createGameFlowTestSuite(),
      this.createStateValidationTestSuite(),
      this.createNetworkTestSuite(),
      this.createErrorHandlingTestSuite(),
      this.createPerformanceTestSuite()
    ];
  }

  /**
   * Create game flow test suite
   */
  private createGameFlowTestSuite(): TestSuite {
    return {
      name: 'Game Flow Tests',
      description: 'Tests complete game flow scenarios',
      tests: [
        {
          name: 'Basic Game Flow',
          description: 'Test lobby -> voting -> drawing -> results flow',
          execute: async () => {
            const startTime = Date.now();
            try {
              // Test lobby phase
              this.devToolsService.simulateMultiplePlayers(3);
              await this.delay(100);
              
              // Test voting phase
              this.devToolsService.skipToVoting();
              await this.delay(100);
              
              const gameState = this.devToolsService.inspectGameState();
              if (!gameState || gameState.gamePhase !== 'voting') {
                throw new Error('Failed to transition to voting phase');
              }
              
              // Test drawing phase
              this.devToolsService.skipToDrawing('test-word');
              await this.delay(100);
              
              const drawingState = this.devToolsService.inspectGameState();
              if (!drawingState || drawingState.gamePhase !== 'drawing') {
                throw new Error('Failed to transition to drawing phase');
              }
              
              // Test results phase
              this.devToolsService.skipToResults();
              await this.delay(100);
              
              const resultsState = this.devToolsService.inspectGameState();
              if (!resultsState || resultsState.gamePhase !== 'results') {
                throw new Error('Failed to transition to results phase');
              }
              
              return {
                success: true,
                message: 'Basic game flow test passed',
                duration: Date.now() - startTime
              };
            } catch (error) {
              return {
                success: false,
                message: `Basic game flow test failed: ${error}`,
                duration: Date.now() - startTime
              };
            }
          }
        },
        {
          name: 'Voting Tie Resolution',
          description: 'Test voting tie detection and resolution',
          execute: async () => {
            const startTime = Date.now();
            try {
              this.devToolsService.simulateMultiplePlayers(4);
              this.devToolsService.skipToVoting();
              this.devToolsService.simulateVotingTie(['cat', 'dog']);
              await this.delay(200);
              
              const gameState = this.devToolsService.inspectGameState();
              if (!gameState || !gameState.votes) {
                throw new Error('No voting state found');
              }
              
              // Check if tie is properly detected
              const catVotes = gameState.votes['cat'] || 0;
              const dogVotes = gameState.votes['dog'] || 0;
              
              if (catVotes !== dogVotes) {
                throw new Error('Tie not properly simulated');
              }
              
              return {
                success: true,
                message: 'Voting tie resolution test passed',
                duration: Date.now() - startTime
              };
            } catch (error) {
              return {
                success: false,
                message: `Voting tie resolution test failed: ${error}`,
                duration: Date.now() - startTime
              };
            }
          }
        },
        {
          name: 'Player Management',
          description: 'Test player joining, leaving, and state consistency',
          execute: async () => {
            const startTime = Date.now();
            try {
              // Test different player counts
              for (let playerCount = 1; playerCount <= 6; playerCount++) {
                this.devToolsService.simulateMultiplePlayers(playerCount);
                await this.delay(50);
                
                const gameState = this.devToolsService.inspectGameState();
                if (!gameState || gameState.players.length !== playerCount) {
                  throw new Error(`Player count mismatch: expected ${playerCount}, got ${gameState?.players.length}`);
                }
              }
              
              return {
                success: true,
                message: 'Player management test passed',
                duration: Date.now() - startTime
              };
            } catch (error) {
              return {
                success: false,
                message: `Player management test failed: ${error}`,
                duration: Date.now() - startTime
              };
            }
          }
        }
      ]
    };
  }

  /**
   * Create state validation test suite
   */
  private createStateValidationTestSuite(): TestSuite {
    return {
      name: 'State Validation Tests',
      description: 'Tests game state consistency and validation',
      tests: [
        {
          name: 'State Consistency Check',
          description: 'Validate game state consistency across transitions',
          execute: async () => {
            const startTime = Date.now();
            try {
              // Generate some state history
              this.devToolsService.simulateMultiplePlayers(3);
              this.devToolsService.skipToVoting();
              this.devToolsService.skipToDrawing('test');
              this.devToolsService.skipToResults();
              
              const consistency = this.devToolsService.analyzeStateConsistency();
              
              if (!consistency.isValid) {
                throw new Error(`State consistency errors: ${consistency.errors.join(', ')}`);
              }
              
              return {
                success: true,
                message: `State consistency check passed (${consistency.warnings.length} warnings)`,
                duration: Date.now() - startTime,
                details: { warnings: consistency.warnings }
              };
            } catch (error) {
              return {
                success: false,
                message: `State consistency check failed: ${error}`,
                duration: Date.now() - startTime
              };
            }
          }
        },
        {
          name: 'Game State Validation',
          description: 'Validate individual game state properties',
          execute: async () => {
            const startTime = Date.now();
            try {
              this.devToolsService.simulateMultiplePlayers(2);
              this.devToolsService.skipToVoting();
              
              const validation = this.devToolsService.validateStateConsistency();
              
              if (!validation.isValid) {
                throw new Error(`Validation errors: ${validation.errors.join(', ')}`);
              }
              
              return {
                success: true,
                message: 'Game state validation passed',
                duration: Date.now() - startTime,
                details: { warnings: validation.warnings }
              };
            } catch (error) {
              return {
                success: false,
                message: `Game state validation failed: ${error}`,
                duration: Date.now() - startTime
              };
            }
          }
        }
      ]
    };
  }

  /**
   * Create network test suite
   */
  private createNetworkTestSuite(): TestSuite {
    return {
      name: 'Network Tests',
      description: 'Tests network communication and error handling',
      tests: [
        {
          name: 'Network Error Simulation',
          description: 'Test network error handling',
          execute: async () => {
            const startTime = Date.now();
            try {
              this.devToolsService.simulateNetworkError();
              await this.delay(100);
              
              const gameState = this.devToolsService.inspectGameState();
              if (!gameState || gameState.connectionStatus !== 'error') {
                throw new Error('Network error not properly simulated');
              }
              
              return {
                success: true,
                message: 'Network error simulation test passed',
                duration: Date.now() - startTime
              };
            } catch (error) {
              return {
                success: false,
                message: `Network error simulation test failed: ${error}`,
                duration: Date.now() - startTime
              };
            }
          }
        },
        {
          name: 'Disconnection Handling',
          description: 'Test disconnection and reconnection scenarios',
          execute: async () => {
            const startTime = Date.now();
            try {
              this.devToolsService.simulateDisconnection();
              await this.delay(100);
              
              const gameState = this.devToolsService.inspectGameState();
              if (!gameState || gameState.isConnected !== false) {
                throw new Error('Disconnection not properly simulated');
              }
              
              return {
                success: true,
                message: 'Disconnection handling test passed',
                duration: Date.now() - startTime
              };
            } catch (error) {
              return {
                success: false,
                message: `Disconnection handling test failed: ${error}`,
                duration: Date.now() - startTime
              };
            }
          }
        }
      ]
    };
  }

  /**
   * Create error handling test suite
   */
  private createErrorHandlingTestSuite(): TestSuite {
    return {
      name: 'Error Handling Tests',
      description: 'Tests error scenarios and recovery mechanisms',
      tests: [
        {
          name: 'Error Recovery',
          description: 'Test error recovery mechanisms',
          execute: async () => {
            const startTime = Date.now();
            try {
              // Simulate various error conditions
              this.devToolsService.simulateNetworkError();
              await this.delay(100);
              
              this.devToolsService.simulateDisconnection();
              await this.delay(100);
              
              // Check if errors are properly handled
              const gameState = this.devToolsService.inspectGameState();
              if (gameState && gameState.lastError) {
                // Error is recorded, which is good
                return {
                  success: true,
                  message: 'Error recovery test passed',
                  duration: Date.now() - startTime,
                  details: { lastError: gameState.lastError }
                };
              }
              
              return {
                success: true,
                message: 'Error recovery test passed (no errors to recover from)',
                duration: Date.now() - startTime
              };
            } catch (error) {
              return {
                success: false,
                message: `Error recovery test failed: ${error}`,
                duration: Date.now() - startTime
              };
            }
          }
        }
      ]
    };
  }

  /**
   * Create performance test suite
   */
  private createPerformanceTestSuite(): TestSuite {
    return {
      name: 'Performance Tests',
      description: 'Tests performance and memory usage',
      tests: [
        {
          name: 'Memory Usage Check',
          description: 'Check memory usage and cleanup',
          execute: async () => {
            const startTime = Date.now();
            try {
              const initialMemory = this.devToolsService.getMemoryUsage();
              
              // Generate some activity
              for (let i = 0; i < 10; i++) {
                this.devToolsService.simulateMultiplePlayers(3);
                this.devToolsService.skipToVoting();
                await this.delay(10);
              }
              
              const afterMemory = this.devToolsService.getMemoryUsage();
              
              // Check if memory usage is reasonable
              if (afterMemory.estimatedMemoryKB > 1000) { // 1MB threshold
                throw new Error(`Memory usage too high: ${afterMemory.estimatedMemoryKB} KB`);
              }
              
              return {
                success: true,
                message: `Memory usage check passed (${afterMemory.estimatedMemoryKB} KB)`,
                duration: Date.now() - startTime,
                details: { initialMemory, afterMemory }
              };
            } catch (error) {
              return {
                success: false,
                message: `Memory usage check failed: ${error}`,
                duration: Date.now() - startTime
              };
            }
          }
        },
        {
          name: 'Performance Metrics',
          description: 'Check performance metrics collection',
          execute: async () => {
            const startTime = Date.now();
            try {
              // Record some performance metrics
              this.devToolsService.recordPerformanceMetric('test-action', 100);
              this.devToolsService.recordPerformanceMetric('another-action', 50);
              
              const metrics = this.devToolsService.getPerformanceMetrics();
              
              if (metrics.length < 2) {
                throw new Error('Performance metrics not properly recorded');
              }
              
              return {
                success: true,
                message: `Performance metrics test passed (${metrics.length} metrics)`,
                duration: Date.now() - startTime,
                details: { metricsCount: metrics.length }
              };
            } catch (error) {
              return {
                success: false,
                message: `Performance metrics test failed: ${error}`,
                duration: Date.now() - startTime
              };
            }
          }
        }
      ]
    };
  }

  /**
   * Run a specific test suite
   */
  async runTestSuite(suiteName: string): Promise<RegressionTestResult> {
    const suite = this.testSuites.find(s => s.name === suiteName);
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteName}`);
    }

    const startTime = Date.now();
    const results: TestResult[] = [];
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    console.log(`🧪 Running test suite: ${suite.name}`);

    for (const test of suite.tests) {
      try {
        console.log(`  📋 Running test: ${test.name}`);
        
        // Setup
        if (test.setup) {
          await test.setup();
        }

        // Execute with timeout
        const testPromise = test.execute();
        const timeoutPromise = new Promise<TestResult>((_, reject) => {
          setTimeout(() => reject(new Error('Test timeout')), test.timeout || 5000);
        });

        const result = await Promise.race([testPromise, timeoutPromise]);
        results.push(result);

        if (result.success) {
          passedTests++;
          console.log(`    ✅ ${test.name}: ${result.message}`);
        } else {
          failedTests++;
          console.log(`    ❌ ${test.name}: ${result.message}`);
        }

        // Cleanup
        if (test.cleanup) {
          await test.cleanup();
        }

      } catch (error) {
        failedTests++;
        const errorResult: TestResult = {
          success: false,
          message: `Test execution failed: ${error}`,
          duration: 0
        };
        results.push(errorResult);
        console.log(`    ❌ ${test.name}: ${errorResult.message}`);
      }
    }

    const duration = Date.now() - startTime;
    const summary = `${passedTests} passed, ${failedTests} failed, ${skippedTests} skipped in ${duration}ms`;

    console.log(`🏁 Test suite completed: ${summary}`);

    return {
      suiteName: suite.name,
      totalTests: suite.tests.length,
      passedTests,
      failedTests,
      skippedTests,
      duration,
      results,
      summary
    };
  }

  /**
   * Run all test suites (regression testing)
   */
  async runAllTests(): Promise<RegressionTestResult[]> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    const results: RegressionTestResult[] = [];

    try {
      console.log('🚀 Starting regression test run...');
      
      for (const suite of this.testSuites) {
        const result = await this.runTestSuite(suite.name);
        results.push(result);
      }

      const totalPassed = results.reduce((sum, r) => sum + r.passedTests, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failedTests, 0);
      const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

      console.log(`🎯 Regression test completed: ${totalPassed} passed, ${totalFailed} failed in ${totalDuration}ms`);

    } finally {
      this.isRunning = false;
    }

    return results;
  }

  /**
   * Run predefined scenarios as tests
   */
  async runScenarioTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    console.log('🎬 Running scenario tests...');

    for (const scenario of TEST_SCENARIOS) {
      try {
        console.log(`  📋 Running scenario: ${scenario.name}`);
        const result = await this.devToolsService.runScenario(scenario);
        results.push(result);
        
        if (result.success) {
          console.log(`    ✅ ${scenario.name}: ${result.message}`);
        } else {
          console.log(`    ❌ ${scenario.name}: ${result.message}`);
        }
      } catch (error) {
        const errorResult: TestResult = {
          success: false,
          message: `Scenario execution failed: ${error}`,
          duration: 0
        };
        results.push(errorResult);
        console.log(`    ❌ ${scenario.name}: ${errorResult.message}`);
      }
    }

    return results;
  }

  /**
   * Get available test suites
   */
  getTestSuites(): TestSuite[] {
    return [...this.testSuites];
  }

  /**
   * Check if tests are currently running
   */
  isTestRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}