/**
 * Component Tests with Mocked GameManager
 * 
 * Tests all UI components with mocked dependencies to verify:
 * - Error state handling and display
 * - User interactions and state updates
 * - Accessibility and usability
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Fabric.js before importing components
const mockCanvas = {
  freeDrawingBrush: { width: 5, color: '#000000' },
  isDrawingMode: true,
  dispose: jest.fn(),
  clear: jest.fn(),
  renderAll: jest.fn(),
  calcOffset: jest.fn(),
  setDimensions: jest.fn(),
  toDataURL: jest.fn(() => 'data:image/png;base64,mock-canvas-data'),
  on: jest.fn(),
  wrapperEl: { 
    style: {
      position: '',
      width: '',
      height: ''
    } 
  },
  backgroundColor: '#ffffff',
  add: jest.fn(),
  selectionColor: 'transparent',
  selectionBorderColor: 'transparent',
  selectionLineWidth: 0,
  uniformScaling: false
};

jest.mock('fabric', () => ({
  Canvas: jest.fn().mockImplementation(() => mockCanvas),
  PencilBrush: jest.fn().mockImplementation(() => ({
    width: 5,
    color: '#000000',
    shadow: null
  })),
  Rect: jest.fn()
}));

// Import components to test
import StartScreen from '../StartScreen';
import LobbyScreen from '../LobbyScreen';
import VotingScreen from '../VotingScreen';
import GameScreen from '../GameScreen';
import ResultsScreen from '../ResultsScreen';
import ErrorModal from '../ErrorModal';
import ConnectionStatus from '../ConnectionStatus';

// Import types
import { GameState, GameError, GameErrorCode, Player, GameResult } from '../../interfaces/GameManager';

// No need for mockGameManager since components don't use it directly

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
  chosenWord: '',
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

describe('Game Components with Mocked GameManager', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('StartScreen Component', () => {
    const mockProps = {
      onHostGame: jest.fn(),
      onJoinGame: jest.fn(),
      error: undefined,
      onClearError: jest.fn(),
      isConnecting: false,
      connectionStatus: 'disconnected' as const
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render host and join buttons', () => {
      render(<StartScreen {...mockProps} />);
      
      expect(screen.getByText(/HOST GAME/i)).toBeInTheDocument();
      expect(screen.getByText(/JOIN GAME/i)).toBeInTheDocument();
    });

    it('should handle host game button click', () => {
      render(<StartScreen {...mockProps} />);
      
      const hostButton = screen.getByText(/HOST GAME/i);
      fireEvent.click(hostButton);
      
      expect(mockProps.onHostGame).toHaveBeenCalled();
    });

    it('should handle join game button click', () => {
      render(<StartScreen {...mockProps} />);
      
      const joinButton = screen.getByText(/JOIN GAME/i);
      fireEvent.click(joinButton);
      
      expect(mockProps.onJoinGame).toHaveBeenCalled();
    });

    it('should show loading state when connecting', () => {
      render(<StartScreen {...mockProps} isConnecting={true} />);
      
      expect(screen.getByText(/HOSTING.../i)).toBeInTheDocument();
    });

    it('should display connection error', () => {
      const errorProps = {
        ...mockProps,
        error: 'Failed to connect to server'
      };
      
      render(<StartScreen {...errorProps} />);
      
      expect(screen.getByText(/failed to connect/i)).toBeInTheDocument();
    });

    it('should be accessible with proper ARIA labels', () => {
      render(<StartScreen {...mockProps} />);
      
      const hostButton = screen.getByRole('button', { name: /HOST GAME/i });
      const joinButton = screen.getByRole('button', { name: /JOIN GAME/i });
      
      expect(hostButton).toBeInTheDocument();
      expect(joinButton).toBeInTheDocument();
    });
  });

  describe('LobbyScreen Component', () => {
    const mockProps = {
      players: mockPlayers,
      canStart: true,
      onStartVoting: jest.fn(),
      isHost: true,
      roomCode: 'TEST123',
      isConnected: true,
      connectionStatus: 'connected' as const
    };

    beforeEach(() => {
      jest.clearAllMocks();
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

    it('should show start game button for host when can start', () => {
      render(<LobbyScreen {...mockProps} />);
      
      expect(screen.getByText(/Start Game!/i)).toBeInTheDocument();
    });

    it('should not show start game button for non-host', () => {
      const nonHostProps = {
        ...mockProps,
        isHost: false,
        canStart: false
      };
      
      render(<LobbyScreen {...nonHostProps} />);
      
      expect(screen.queryByText(/Start Game!/i)).not.toBeInTheDocument();
    });

    it('should handle start game button click', async () => {
      render(<LobbyScreen {...mockProps} />);
      
      const startButton = screen.getByText(/Start Game!/i);
      await userEvent.click(startButton);
      
      expect(mockProps.onStartVoting).toHaveBeenCalled();
    });

    it('should display host indicator', () => {
      render(<LobbyScreen {...mockProps} />);
      
      // Look for host indicator (crown emoji)
      expect(screen.getByText(/👑/)).toBeInTheDocument();
    });
  });

  describe('VotingScreen Component', () => {
    const mockProps = {
      wordOptions: ['cat', 'dog', 'bird'],
      votes: { cat: 1, dog: 0, bird: 1 },
      onVote: jest.fn(),
      isConnected: true,
      connectionStatus: 'connected' as const,
      playerCount: 2,
      playersVoted: 0
    };

    beforeEach(() => {
      jest.clearAllMocks();
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

    it('should display vote counts', () => {
      render(<VotingScreen {...mockProps} />);
      
      // Should show vote counts for each word
      expect(screen.getAllByText(/1/)[0]).toBeInTheDocument(); // cat has 1 vote
    });

    it('should disable voting when disconnected', () => {
      const disconnectedProps = {
        ...mockProps,
        isConnected: false
      };
      
      render(<VotingScreen {...disconnectedProps} />);
      
      const catButton = screen.getByText('cat').closest('li');
      expect(catButton).toHaveClass('disabled');
      expect(catButton).toHaveStyle({ cursor: 'not-allowed' });
    });
  });

  describe('GameScreen Component', () => {
    const mockProps = {
      word: 'cat',
      timeRemaining: 45,
      onDrawingComplete: jest.fn(),
      onFinishDrawing: jest.fn(),
      playersFinished: [],
      currentPlayerId: 'player1',
      isConnected: true,
      connectionStatus: 'connected' as const,
      playerCount: 2,
      submittedDrawings: 0
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should display chosen word', () => {
      render(<GameScreen {...mockProps} />);
      
      expect(screen.getAllByText(/cat/i)[0]).toBeInTheDocument();
    });

    it('should display time remaining', () => {
      render(<GameScreen {...mockProps} />);
      
      expect(screen.getAllByText(/0:45/)[0]).toBeInTheDocument();
    });

    it('should show drawing canvas', () => {
      render(<GameScreen {...mockProps} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should handle finish drawing button click', async () => {
      render(<GameScreen {...mockProps} />);
      
      const finishButton = screen.getByText(/Finish Drawing/i);
      
      await act(async () => {
        await userEvent.click(finishButton);
      });
      
      expect(mockProps.onDrawingComplete).toHaveBeenCalled();
    });

    it('should show progress indicator', () => {
      render(<GameScreen {...mockProps} />);
      
      // Should show player status section
      expect(screen.getByText(/Time Remaining:/)).toBeInTheDocument();
      expect(screen.getByText(/Draw:/)).toBeInTheDocument();
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

    beforeEach(() => {
      jest.clearAllMocks();
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
      
      expect(screen.getAllByText(/cat/i)).toHaveLength(2); // Word appears in multiple places
    });

    it('should show winner celebration', () => {
      render(<ResultsScreen {...mockProps} />);
      
      // Should show winner indicator (gold medal)
      expect(screen.getByText(/🥇/)).toBeInTheDocument();
    });

    it('should handle new game button click', async () => {
      render(<ResultsScreen {...mockProps} />);
      
      const newGameButton = screen.getByText(/New Game/i);
      await userEvent.click(newGameButton);
      
      expect(mockProps.onNewGame).toHaveBeenCalled();
    });

    it('should handle play again button click', async () => {
      render(<ResultsScreen {...mockProps} />);
      
      const playAgainButton = screen.getByText(/Play Again/i);
      await userEvent.click(playAgainButton);
      
      expect(mockProps.onPlayAgain).toHaveBeenCalled();
    });

    it('should display AI feedback', () => {
      render(<ResultsScreen {...mockProps} />);
      
      expect(screen.getByText('Excellent drawing!')).toBeInTheDocument();
      expect(screen.getByText('Good effort!')).toBeInTheDocument();
    });

    it('should be accessible with proper heading structure', () => {
      render(<ResultsScreen {...mockProps} />);
      
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      
      // Should have proper heading hierarchy
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
    });
  });

  describe('ErrorModal Component', () => {
    const mockProps = {
      show: true,
      error: mockError,
      onHide: jest.fn(),
      onRetry: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should display error message', () => {
      render(<ErrorModal {...mockProps} />);
      
      expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
    });

    it('should show retry button for recoverable errors', () => {
      render(<ErrorModal {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should not show retry button for non-recoverable errors', () => {
      const nonRecoverableError: GameError = {
        ...mockError,
        recoverable: false
      };
      
      const nonRecoverableProps = {
        ...mockProps,
        error: nonRecoverableError
      };
      
      render(<ErrorModal {...nonRecoverableProps} />);
      
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('should handle close button click', async () => {
      render(<ErrorModal {...mockProps} />);
      
      const closeButton = screen.getByText(/close/i);
      await userEvent.click(closeButton);
      
      expect(mockProps.onHide).toHaveBeenCalled();
    });

    it('should handle retry button click', async () => {
      render(<ErrorModal {...mockProps} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);
      
      expect(mockProps.onRetry).toHaveBeenCalled();
    });

    it('should be accessible with proper modal attributes', () => {
      render(<ErrorModal {...mockProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
      render(<ErrorModal {...mockProps} />);
      
      // Should be able to tab through interactive elements
      await userEvent.tab();
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveFocus();
      
      await userEvent.tab();
      const closeButton = screen.getByText(/close/i);
      expect(closeButton).toHaveFocus();
    });
  });

  describe('ConnectionStatus Component', () => {
    const mockProps = {
      connectionStatus: 'connected' as const,
      isReconnecting: false,
      reconnectAttempts: 0,
      maxReconnectAttempts: 3
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should show connected status', () => {
      render(<ConnectionStatus {...mockProps} />);
      
      // Connected status doesn't show an alert, so just verify it renders without error
      expect(document.querySelector('.connection-status-alert')).not.toBeInTheDocument();
    });

    it('should show disconnected status', () => {
      const disconnectedProps = {
        ...mockProps,
        connectionStatus: 'disconnected' as const
      };
      
      render(<ConnectionStatus {...disconnectedProps} />);
      
      expect(screen.getAllByText(/disconnected/i)[0]).toBeInTheDocument();
    });

    it('should show reconnecting status', () => {
      const reconnectingProps = {
        ...mockProps,
        connectionStatus: 'connecting' as const,
        isReconnecting: true,
        reconnectAttempts: 1
      };
      
      render(<ConnectionStatus {...reconnectingProps} />);
      
      expect(screen.getAllByText(/connecting/i)[0]).toBeInTheDocument();
    });

    it('should show error status', () => {
      const errorProps = {
        ...mockProps,
        connectionStatus: 'error' as const
      };
      
      render(<ConnectionStatus {...errorProps} />);
      
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it('should update status dynamically', () => {
      const { rerender } = render(<ConnectionStatus {...mockProps} />);
      
      // Update to disconnected
      rerender(<ConnectionStatus {...mockProps} connectionStatus="disconnected" />);
      
      expect(screen.getAllByText(/disconnected/i)[0]).toBeInTheDocument();
    });
  });

  describe('Component Integration and State Management', () => {
    it('should handle state changes across components', async () => {
      
      // Start with lobby screen
      const { rerender } = render(
        <LobbyScreen 
          players={mockPlayers}
          canStart={true}
          onStartVoting={jest.fn()}
          isHost={true}
          roomCode="TEST123"
        />
      );
      
      expect(screen.getByText(/Game Lobby/i)).toBeInTheDocument();
      
      // Transition to voting screen
      rerender(
        <VotingScreen 
          wordOptions={['cat', 'dog', 'bird']}
          votes={{ cat: 1, dog: 0, bird: 1 }}
          onVote={jest.fn()}
        />
      );
      
      expect(screen.getByText(/What To Doodle/i)).toBeInTheDocument();
    });

    it('should handle error states consistently', () => {
      render(
        <ConnectionStatus 
          connectionStatus="error"
          isReconnecting={false}
          reconnectAttempts={0}
          maxReconnectAttempts={3}
        />
      );
      
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it('should maintain accessibility across state changes', async () => {
      const { rerender } = render(
        <StartScreen 
          onHostGame={jest.fn()}
          onJoinGame={jest.fn()}
          onClearError={jest.fn()}
          isConnecting={false}
        />
      );
      
      // Check initial accessibility - should have at least 2 buttons (HOST and JOIN), possibly 3 if clear name button is present
      const initialButtons = screen.getAllByRole('button');
      expect(initialButtons.length).toBeGreaterThanOrEqual(2);
      expect(initialButtons.length).toBeLessThanOrEqual(3);
      
      // Change to connecting state
      rerender(
        <StartScreen 
          onHostGame={jest.fn()}
          onJoinGame={jest.fn()}
          onClearError={jest.fn()}
          isConnecting={true}
        />
      );
      
      // Should still be accessible
      expect(screen.getByText(/HOSTING.../i)).toBeInTheDocument();
    });
  });

  describe('Performance and Usability', () => {
    it('should render components efficiently', () => {
      const startTime = performance.now();
      
      render(<StartScreen 
        onHostGame={jest.fn()}
        onJoinGame={jest.fn()}
        onClearError={jest.fn()}
        isConnecting={false}
      />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle rapid user interactions', async () => {
      const mockOnVote = jest.fn();
      
      render(<VotingScreen 
        wordOptions={['cat', 'dog', 'bird']}
        votes={{ cat: 1, dog: 0, bird: 1 }}
        onVote={mockOnVote}
      />);
      
      // Rapid clicks should be handled properly
      const catButton = screen.getByText('cat');
      await userEvent.click(catButton);
      await userEvent.click(catButton);
      await userEvent.click(catButton);
      
      // Should handle multiple clicks gracefully
      expect(mockOnVote).toHaveBeenCalled();
    });

    it('should provide visual feedback for user actions', async () => {
      
      render(<StartScreen 
        onHostGame={jest.fn()}
        onJoinGame={jest.fn()}
        onClearError={jest.fn()}
        isConnecting={false}
      />);
      
      const hostButton = screen.getByText(/HOST GAME/i);
      
      // Button should provide visual feedback on interaction
      await userEvent.hover(hostButton);
      expect(hostButton).toHaveClass(/btn/); // Should have button styling
      
      await userEvent.click(hostButton);
      // Should handle click without errors
    });
  });
});