/**
 * Working Component Tests
 * 
 * Comprehensive tests for all UI components that actually work with the real component implementations.
 * These tests are designed to match the actual component behavior and interfaces.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import components to test
import StartScreen from '../../components/StartScreen';
import LobbyScreen from '../../components/LobbyScreen';
import VotingScreen from '../../components/VotingScreen';
import ResultsScreen from '../../components/ResultsScreen';
import ErrorModal from '../../components/ErrorModal';
import ConnectionStatus from '../../components/ConnectionStatus';
import AnimatedBackground from '../../components/AnimatedBackground';
import AnimatedLogo from '../../components/AnimatedLogo';

// Import types
import { GameState, GameError, GameErrorCode, Player, GameResult } from '../../interfaces/GameManager';

// Mock GameManager
const mockGameManager = {
  hostGame: jest.fn(),
  joinGame: jest.fn(),
  startVoting: jest.fn(),
  voteForWord: jest.fn(),
  submitDrawing: jest.fn(),
  finishDrawing: jest.fn(),
  disconnect: jest.fn(),
  getGameState: jest.fn(),
  getConnectionStatus: jest.fn(),
  isHost: jest.fn(),
  getRoomCode: jest.fn(),
  getCurrentPlayer: jest.fn(),
  onStateChange: jest.fn(),
  offStateChange: jest.fn(),
  onError: jest.fn(),
  offError: jest.fn(),
  getLastError: jest.fn(),
  clearError: jest.fn(),
  destroy: jest.fn()
};

// Mock data
const mockPlayers: Player[] = [
  {
    id: 'player1',
    name: 'TestPlayer1',
    isHost: true,
    isConnected: true,
    hasVoted: false,
    hasSubmittedDrawing: false,
    score: 0
  },
  {
    id: 'player2',
    name: 'TestPlayer2',
    isHost: false,
    isConnected: true,
    hasVoted: false,
    hasSubmittedDrawing: false,
    score: 0
  }
];

const mockGameState: GameState = {
  roomCode: 'TEST123',
  isConnected: true,
  connectionStatus: 'connected',
  players: mockPlayers,
  currentPlayer: mockPlayers[0],
  hostId: 'player1',
  playerCount: 2,
  maxPlayers: 8,
  gamePhase: 'lobby',
  wordOptions: ['cat', 'dog', 'bird'],
  voteCounts: { cat: 1, dog: 0, bird: 1 },
  chosenWord: 'cat',
  timeRemaining: 60,
  drawingTimeLimit: 60,
  submittedDrawings: 0,
  results: []
};

const mockGameResults: GameResult[] = [
  {
    playerId: 'player1',
    playerName: 'TestPlayer1',
    rank: 1,
    score: 95,
    feedback: 'Excellent drawing!',
    canvasData: 'data:image/png;base64,mock-data-1'
  },
  {
    playerId: 'player2',
    playerName: 'TestPlayer2',
    rank: 2,
    score: 78,
    feedback: 'Good effort!',
    canvasData: 'data:image/png;base64,mock-data-2'
  }
];

const mockError: GameError = {
  code: GameErrorCode.CONNECTION_FAILED,
  message: 'Failed to connect to server',
  timestamp: new Date(),
  recoverable: true
};

describe('Working Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set default mock returns
    mockGameManager.getGameState.mockReturnValue(mockGameState);
    mockGameManager.getConnectionStatus.mockReturnValue('connected');
    mockGameManager.isHost.mockReturnValue(true);
    mockGameManager.getRoomCode.mockReturnValue('TEST123');
    mockGameManager.getCurrentPlayer.mockReturnValue(mockPlayers[0]);
    mockGameManager.getLastError.mockReturnValue(null);
  });

  describe('StartScreen Component', () => {
    const mockProps = {
      onHostGame: jest.fn(),
      onJoinGame: jest.fn(),
      onClearError: jest.fn(),
      isConnecting: false
    };

    it('should render without crashing', () => {
      expect(() => {
        render(<StartScreen {...mockProps} />);
      }).not.toThrow();
    });

    it('should display host and join buttons', () => {
      render(<StartScreen {...mockProps} />);
      
      expect(screen.getByText(/host game/i)).toBeInTheDocument();
      expect(screen.getByText(/join game/i)).toBeInTheDocument();
    });

    it('should handle button clicks', () => {
      render(<StartScreen {...mockProps} />);
      
      const hostButton = screen.getByText(/host game/i);
      const joinButton = screen.getByText(/join game/i);
      
      fireEvent.click(hostButton);
      expect(mockProps.onHostGame).toHaveBeenCalled();
      
      fireEvent.click(joinButton);
      expect(mockProps.onJoinGame).toHaveBeenCalled();
    });

    it('should be accessible with proper button roles', () => {
      render(<StartScreen {...mockProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('LobbyScreen Component', () => {
    const mockProps = {
      players: mockGameState.players,
      canStart: true,
      onStartVoting: jest.fn(),
      isHost: true,
      roomCode: mockGameState.roomCode,
      isConnected: true,
      connectionStatus: 'connected' as const
    };

    it('should render without crashing', () => {
      expect(() => {
        render(<LobbyScreen {...mockProps} />);
      }).not.toThrow();
    });

    it('should display room code', () => {
      render(<LobbyScreen {...mockProps} />);
      
      expect(screen.getByText(/TEST123/)).toBeInTheDocument();
    });

    it('should display player list', () => {
      render(<LobbyScreen {...mockProps} />);
      
      expect(screen.getByText('TestPlayer1')).toBeInTheDocument();
      expect(screen.getByText('TestPlayer2')).toBeInTheDocument();
    });

    it('should show start voting button for host', () => {
      render(<LobbyScreen {...mockProps} />);
      
      expect(screen.getByText(/start game/i)).toBeInTheDocument();
    });

    it('should handle start voting button click', async () => {
      render(<LobbyScreen {...mockProps} />);
      
      const startButton = screen.getByText(/start game/i);
      await userEvent.click(startButton);
      
      expect(mockProps.onStartVoting).toHaveBeenCalled();
    });
  });

  describe('VotingScreen Component', () => {
    const votingGameState = {
      ...mockGameState,
      gamePhase: 'voting' as const,
      wordOptions: ['cat', 'dog', 'bird']
    };

    const mockProps = {
      wordOptions: votingGameState.wordOptions || ['cat', 'dog', 'bird'],
      votes: { cat: 1, dog: 0, bird: 1 },
      onVote: jest.fn(),
      isConnected: true,
      connectionStatus: 'connected' as const,
      playerCount: 2,
      playersVoted: 1
    };

    it('should render without crashing', () => {
      expect(() => {
        render(<VotingScreen {...mockProps} />);
      }).not.toThrow();
    });

    it('should display word options', () => {
      render(<VotingScreen {...mockProps} />);
      
      expect(screen.getByText('cat')).toBeInTheDocument();
      expect(screen.getByText('dog')).toBeInTheDocument();
      expect(screen.getByText('bird')).toBeInTheDocument();
    });

    it('should handle word selection', async () => {
      render(<VotingScreen {...mockProps} />);
      
      const catButton = screen.getByText('cat');
      await userEvent.click(catButton);
      
      expect(mockProps.onVote).toHaveBeenCalledWith('cat');
    });

    it('should be accessible with proper button roles', () => {
      render(<VotingScreen {...mockProps} />);
      
      const wordOptions = screen.getAllByRole('listitem');
      expect(wordOptions.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('ResultsScreen Component', () => {
    const resultsGameState = {
      ...mockGameState,
      gamePhase: 'results' as const,
      chosenWord: 'cat',
      results: mockGameResults
    };

    const mockProps = {
      gameState: resultsGameState,
      onNewGame: jest.fn(),
      onPlayAgain: jest.fn()
    };

    it('should render without crashing', () => {
      expect(() => {
        render(<ResultsScreen {...mockProps} />);
      }).not.toThrow();
    });

    it('should display game results', () => {
      render(<ResultsScreen {...mockProps} />);
      
      expect(screen.getByText('TestPlayer1')).toBeInTheDocument();
      expect(screen.getByText('TestPlayer2')).toBeInTheDocument();
      expect(screen.getByText('95')).toBeInTheDocument();
      expect(screen.getByText('78')).toBeInTheDocument();
    });

    it('should display chosen word', () => {
      render(<ResultsScreen {...mockProps} />);
      
      // Word appears in multiple places, so check that it exists
      expect(screen.getAllByText(/cat/i).length).toBeGreaterThan(0);
    });

    it('should handle new game button click', async () => {
      render(<ResultsScreen {...mockProps} />);
      
      const newGameButton = screen.getByText(/new game/i);
      await userEvent.click(newGameButton);
      
      expect(mockProps.onNewGame).toHaveBeenCalled();
    });

    it('should handle play again button click', async () => {
      render(<ResultsScreen {...mockProps} />);
      
      const playAgainButton = screen.getByText(/play again/i);
      await userEvent.click(playAgainButton);
      
      expect(mockProps.onPlayAgain).toHaveBeenCalled();
    });

    it('should display AI feedback', () => {
      render(<ResultsScreen {...mockProps} />);
      
      expect(screen.getByText('Excellent drawing!')).toBeInTheDocument();
      expect(screen.getByText('Good effort!')).toBeInTheDocument();
    });
  });

  describe('ErrorModal Component', () => {
    const mockProps = {
      show: true,
      error: mockError,
      onHide: jest.fn(),
      onRetry: jest.fn()
    };

    it('should render without crashing', () => {
      expect(() => {
        render(<ErrorModal {...mockProps} />);
      }).not.toThrow();
    });

    it('should display error message', () => {
      render(<ErrorModal {...mockProps} />);
      
      expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
    });

    it('should show retry button for recoverable errors', () => {
      render(<ErrorModal {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle retry button click', async () => {
      render(<ErrorModal {...mockProps} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);
      
      expect(mockProps.onRetry).toHaveBeenCalled();
    });

    it('should not render when show is false', () => {
      render(<ErrorModal {...mockProps} show={false} />);
      
      expect(screen.queryByText('Failed to connect to server')).not.toBeInTheDocument();
    });

    it('should be accessible as a modal dialog', () => {
      render(<ErrorModal {...mockProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('ConnectionStatus Component', () => {
    it('should render without crashing for connected status', () => {
      const props = {
        connectionStatus: 'connected' as const,
        isReconnecting: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3
      };
      
      expect(() => {
        render(<ConnectionStatus {...props} />);
      }).not.toThrow();
    });

    it('should show disconnected status', () => {
      const props = {
        connectionStatus: 'disconnected' as const,
        isReconnecting: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3
      };
      
      render(<ConnectionStatus {...props} />);
      
      // Should show disconnected status (appears in multiple places)
      expect(screen.getAllByText(/disconnected/i)).toHaveLength(2);
    });

    it('should show error status', () => {
      const props = {
        connectionStatus: 'error' as const,
        isReconnecting: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3
      };
      
      render(<ConnectionStatus {...props} />);
      
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it('should show connecting status', () => {
      const props = {
        connectionStatus: 'connecting' as const,
        isReconnecting: true,
        reconnectAttempts: 2,
        maxReconnectAttempts: 3
      };
      
      render(<ConnectionStatus {...props} />);
      
      // Should show connecting status (appears in multiple places)
      expect(screen.getAllByText(/connecting/i)).toHaveLength(2);
    });
  });

  describe('AnimatedBackground Component', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(<AnimatedBackground />);
      }).not.toThrow();
    });

    it('should render animated elements', () => {
      render(<AnimatedBackground />);
      
      const background = document.querySelector('.animated-background');
      expect(background).toBeInTheDocument();
      
      const doodles = document.querySelectorAll('.doodle');
      expect(doodles.length).toBeGreaterThan(0);
    });
  });

  describe('AnimatedLogo Component', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(<AnimatedLogo />);
      }).not.toThrow();
    });

    it('should render logo element', () => {
      render(<AnimatedLogo />);
      
      const logo = document.querySelector('.animated-logo');
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render multiple components together without conflicts', () => {
      expect(() => {
        render(
          <div>
            <AnimatedBackground />
            <StartScreen 
              onHostGame={jest.fn()}
              onJoinGame={jest.fn()}
              onClearError={jest.fn()}
              isConnecting={false}
            />
            <ErrorModal 
              show={true}
              error={mockError}
              onHide={jest.fn()}
              onRetry={jest.fn()}
            />
            <ConnectionStatus 
              connectionStatus="connected"
              isReconnecting={false}
              reconnectAttempts={0}
              maxReconnectAttempts={3}
            />
          </div>
        );
      }).not.toThrow();
    });

    it('should handle state changes properly', () => {
      const { rerender } = render(
        <StartScreen 
          onHostGame={jest.fn()}
          onJoinGame={jest.fn()}
          onClearError={jest.fn()}
          isConnecting={false}
        />
      );
      
      expect(screen.getByText(/host game/i)).toBeInTheDocument();
      
      // Update to error state
      rerender(
        <StartScreen 
          onHostGame={jest.fn()}
          onJoinGame={jest.fn()}
          onClearError={jest.fn()}
          isConnecting={false}
          error="Connection failed"
        />
      );
      
      // Should still render without crashing
      expect(screen.getByText(/host game/i)).toBeInTheDocument();
    });
  });

  describe('Component Performance', () => {
    it('should render components efficiently', () => {
      const startTime = performance.now();
      
      render(<StartScreen 
        onHostGame={jest.fn()}
        onJoinGame={jest.fn()}
        gameManager={mockGameManager}
        isConnecting={false}
        connectionError={null}
      />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle multiple re-renders efficiently', () => {
      const { rerender } = render(<ErrorModal 
        show={true}
        error={mockError}
        onHide={jest.fn()}
        onRetry={jest.fn()}
      />);
      
      // Multiple re-renders should not cause performance issues
      for (let i = 0; i < 5; i++) {
        rerender(<ErrorModal 
          show={i % 2 === 0}
          error={mockError}
          onHide={jest.fn()}
          onRetry={jest.fn()}
        />);
      }
      
      // Should complete without issues
      expect(document.querySelector('.modal')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing props gracefully', () => {
      expect(() => {
        render(<AnimatedBackground />);
      }).not.toThrow();
      
      expect(() => {
        render(<AnimatedLogo />);
      }).not.toThrow();
    });

    it('should handle component errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const ThrowingComponent = () => {
        throw new Error('Component crashed');
      };
      
      expect(() => {
        render(<ThrowingComponent />);
      }).toThrow('Component crashed');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should provide proper button accessibility', () => {
      render(<StartScreen 
        onHostGame={jest.fn()}
        onJoinGame={jest.fn()}
        gameManager={mockGameManager}
        isConnecting={false}
        connectionError={null}
      />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).not.toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should provide proper modal accessibility', () => {
      render(<ErrorModal 
        show={true}
        error={mockError}
        onHide={jest.fn()}
        onRetry={jest.fn()}
      />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });
  });
});