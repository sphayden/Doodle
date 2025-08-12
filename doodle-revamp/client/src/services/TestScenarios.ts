/**
 * TestScenarios - Predefined test scenarios for automated testing
 * of the Doodle game functionality.
 */

import { GameScenario } from './DevToolsService';

/**
 * Enhanced Test Scenarios with comprehensive validation and error handling
 */
export const TEST_SCENARIOS: GameScenario[] = [
  {
    name: 'Basic Game Flow',
    description: 'Tests the complete game flow from lobby to results',
    steps: [
      {
        action: 'simulateMultiplePlayers',
        data: { count: 3 },
        delay: 500
      },
      {
        action: 'skipToVoting',
        delay: 1000
      },
      {
        action: 'skipToDrawing',
        data: { word: 'cat' },
        delay: 1000
      },
      {
        action: 'skipToResults',
        delay: 1000
      }
    ]
  },
  {
    name: 'Voting Tie Scenario',
    description: 'Tests the voting tie resolution mechanism',
    steps: [
      {
        action: 'simulateMultiplePlayers',
        data: { count: 4 },
        delay: 500
      },
      {
        action: 'skipToVoting',
        delay: 500
      },
      {
        action: 'simulateVotingTie',
        data: { words: ['cat', 'dog', 'bird'] },
        delay: 2000
      },
      {
        action: 'skipToDrawing',
        data: { word: 'cat' },
        delay: 1000
      }
    ]
  },
  {
    name: 'Network Error Recovery',
    description: 'Tests network error handling and recovery',
    steps: [
      {
        action: 'simulateMultiplePlayers',
        data: { count: 2 },
        delay: 500
      },
      {
        action: 'skipToVoting',
        delay: 500
      },
      {
        action: 'simulateNetworkError',
        delay: 2000
      },
      {
        action: 'simulateDisconnection',
        delay: 1000
      }
    ]
  },
  {
    name: 'Single Player Edge Case',
    description: 'Tests behavior with only one player',
    steps: [
      {
        action: 'simulateMultiplePlayers',
        data: { count: 1 },
        delay: 500
      },
      {
        action: 'skipToVoting',
        delay: 1000
      }
    ]
  },
  {
    name: 'Maximum Players',
    description: 'Tests behavior with maximum number of players',
    steps: [
      {
        action: 'simulateMultiplePlayers',
        data: { count: 8 },
        delay: 500
      },
      {
        action: 'skipToVoting',
        delay: 1000
      },
      {
        action: 'skipToDrawing',
        data: { word: 'house' },
        delay: 1000
      },
      {
        action: 'skipToResults',
        delay: 1000
      }
    ]
  },
  {
    name: 'Rapid Phase Changes',
    description: 'Tests rapid transitions between game phases',
    steps: [
      {
        action: 'simulateMultiplePlayers',
        data: { count: 3 },
        delay: 100
      },
      {
        action: 'skipToVoting',
        delay: 200
      },
      {
        action: 'skipToDrawing',
        data: { word: 'test' },
        delay: 200
      },
      {
        action: 'skipToResults',
        delay: 200
      },
      {
        action: 'skipToVoting',
        delay: 200
      }
    ]
  },
  {
    name: 'Comprehensive Network Failure Test',
    description: 'Tests complete network failure and recovery scenarios',
    steps: [
      {
        action: 'simulateMultiplePlayers',
        data: { count: 4 },
        delay: 300
      },
      {
        action: 'skipToVoting',
        delay: 500
      },
      {
        action: 'simulateConnectionIssues',
        data: { severity: 'mild' },
        delay: 1000
      },
      {
        action: 'simulateConnectionIssues', 
        data: { severity: 'moderate' },
        delay: 1500
      },
      {
        action: 'simulateConnectionIssues',
        data: { severity: 'severe' },
        delay: 2000
      },
      {
        action: 'simulateState',
        data: {
          isConnected: true,
          connectionStatus: 'connected',
          lastError: undefined
        },
        delay: 1000
      },
      {
        action: 'skipToDrawing',
        data: { word: 'recovery' },
        delay: 500
      }
    ]
  },
  {
    name: 'Stress Test - Rapid Operations',
    description: 'Tests system performance under rapid state changes',
    steps: Array.from({ length: 50 }, (_, i) => ({
      action: i % 3 === 0 ? 'simulateState' : i % 3 === 1 ? 'voteForWord' : 'skipToVoting',
      data: i % 3 === 0 ? { timeRemaining: 60 - (i % 60) } : 
            i % 3 === 1 ? { word: `word${i}` } : undefined,
      delay: 10
    })),
  },
  {
    name: 'Memory Stress Test',
    description: 'Tests memory management with large data sets',
    steps: [
      {
        action: 'simulateMultiplePlayers',
        data: { count: 8 },
        delay: 100
      },
      ...Array.from({ length: 20 }, (_, i) => ({
        action: 'simulateVotingTie',
        data: { 
          words: [`word${i}_1`, `word${i}_2`, `word${i}_3`, `word${i}_4`, `word${i}_5`]
        },
        delay: 50
      })),
      {
        action: 'skipToResults',
        delay: 200
      }
    ]
  },
  {
    name: 'Error Recovery Chain',
    description: 'Tests recovery from multiple consecutive errors',
    steps: [
      {
        action: 'simulateMultiplePlayers',
        data: { count: 3 },
        delay: 200
      },
      {
        action: 'simulateNetworkError',
        delay: 1000
      },
      {
        action: 'simulateDisconnection',
        delay: 1000
      },
      {
        action: 'simulateConnectionIssues',
        data: { severity: 'severe' },
        delay: 1500
      },
      {
        action: 'simulateState',
        data: {
          isConnected: true,
          connectionStatus: 'connected',
          lastError: undefined,
          gamePhase: 'voting',
          wordOptions: ['recovery', 'test', 'success']
        },
        delay: 1000
      },
      {
        action: 'skipToDrawing',
        data: { word: 'resilience' },
        delay: 500
      },
      {
        action: 'skipToResults',
        delay: 500
      }
    ]
  },
  {
    name: 'State Consistency Validation',
    description: 'Comprehensive state validation across all game phases',
    steps: [
      {
        action: 'simulateMultiplePlayers',
        data: { count: 6 },
        delay: 200,
        validation: (state) => {
          const errors = [];
          if (state.players?.length !== 6) errors.push('Should have 6 players');
          const hosts = state.players?.filter(p => p.isHost) || [];
          if (hosts.length !== 1) errors.push('Should have exactly 1 host');
          return { isValid: errors.length === 0, errors, warnings: [] };
        }
      },
      {
        action: 'skipToVoting',
        delay: 300,
        validation: (state) => {
          const errors = [];
          if (state.gamePhase !== 'voting') errors.push('Should be in voting phase');
          if (!state.wordOptions?.length) errors.push('Should have word options');
          return { isValid: errors.length === 0, errors, warnings: [] };
        }
      },
      {
        action: 'voteForWord',
        data: { word: 'test' },
        delay: 200,
        validation: (state) => {
          const errors = [];
          if (!state.voteCounts || Object.keys(state.voteCounts).length === 0) {
            errors.push('Should have recorded votes');
          }
          return { isValid: errors.length === 0, errors, warnings: [] };
        }
      },
      {
        action: 'skipToDrawing',
        data: { word: 'validation' },
        delay: 300,
        validation: (state) => {
          const errors = [];
          if (state.gamePhase !== 'drawing') errors.push('Should be in drawing phase');
          if (state.chosenWord !== 'validation') errors.push('Should have correct chosen word');
          if (state.timeRemaining <= 0) errors.push('Should have time remaining');
          return { isValid: errors.length === 0, errors, warnings: [] };
        }
      },
      {
        action: 'skipToResults',
        delay: 300,
        validation: (state) => {
          const errors = [];
          if (state.gamePhase !== 'results') errors.push('Should be in results phase');
          if (!state.results?.length) errors.push('Should have results');
          return { isValid: errors.length === 0, errors, warnings: [] };
        }
      }
    ]
  }
];

export const getScenarioByName = (name: string): GameScenario | undefined => {
  return TEST_SCENARIOS.find(scenario => scenario.name === name);
};

export const getScenarioNames = (): string[] => {
  return TEST_SCENARIOS.map(scenario => scenario.name);
};