/**
 * Basic Component Tests with Mocked GameManager
 * 
 * Simplified tests focusing on core functionality:
 * - Component rendering
 * - Basic user interactions
 * - Error state handling
 * - Accessibility basics
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import components to test
import StartScreen from '../StartScreen';
import ErrorModal from '../ErrorModal';
import ConnectionStatus from '../ConnectionStatus';

// Import types
import { GameError, GameErrorCode } from '../../interfaces/GameManager';

const mockError: GameError = {
  code: GameErrorCode.CONNECTION_FAILED,
  message: 'Failed to connect to server',
  timestamp: new Date(),
  recoverable: true
};

describe('Basic Component Tests', () => {
  beforeEach(() => {
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

    it('should render without crashing', () => {
      render(<StartScreen {...mockProps} />);
      expect(screen.getByText(/HOST GAME/i)).toBeInTheDocument();
    });

    it('should display host and join buttons', () => {
      render(<StartScreen {...mockProps} />);
      
      expect(screen.getByText(/HOST GAME/i)).toBeInTheDocument();
      expect(screen.getByText(/JOIN GAME/i)).toBeInTheDocument();
    });

    it('should handle button clicks', () => {
      render(<StartScreen {...mockProps} />);
      
      const hostButton = screen.getByText(/HOST GAME/i);
      const joinButton = screen.getByText(/JOIN GAME/i);
      
      fireEvent.click(hostButton);
      expect(mockProps.onHostGame).toHaveBeenCalled();
      
      fireEvent.click(joinButton);
      expect(mockProps.onJoinGame).toHaveBeenCalled();
    });

    it('should show loading state when connecting', () => {
      const loadingProps = { ...mockProps, isConnecting: true };
      render(<StartScreen {...loadingProps} />);
      
      // Should show some loading indicator
      expect(screen.getByText(/HOSTING.../i)).toBeInTheDocument();
    });

    it('should display connection error when present', () => {
      const errorProps = { 
        ...mockProps, 
        error: 'Connection failed' 
      };
      render(<StartScreen {...errorProps} />);
      
      expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
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

  describe('ErrorModal Component', () => {
    const mockProps = {
      show: true,
      error: mockError,
      onHide: jest.fn(),
      onRetry: jest.fn()
    };

    it('should render without crashing', () => {
      render(<ErrorModal {...mockProps} />);
      expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(<ErrorModal {...mockProps} />);
      
      expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
    });

    it('should show retry button for recoverable errors', () => {
      render(<ErrorModal {...mockProps} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should handle button clicks', () => {
      render(<ErrorModal {...mockProps} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      const closeButton = screen.getByRole('button', { name: /close/i });
      
      fireEvent.click(retryButton);
      expect(mockProps.onRetry).toHaveBeenCalled();
      
      fireEvent.click(closeButton);
      expect(mockProps.onHide).toHaveBeenCalled();
    });

    it('should not show retry button for non-recoverable errors', () => {
      const nonRecoverableProps = {
        ...mockProps,
        error: { ...mockError, recoverable: false }
      };
      
      render(<ErrorModal {...nonRecoverableProps} />);
      
      // For non-recoverable errors, the retry button should not be shown
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('should be accessible as a modal dialog', () => {
      render(<ErrorModal {...mockProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('ConnectionStatus Component', () => {
    it('should render without crashing', () => {
      const props = {
        connectionStatus: 'connected' as const,
        isReconnecting: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3
      };
      
      render(<ConnectionStatus {...props} />);
      // Component should render without throwing
    });

    it('should show disconnected status', () => {
      const props = {
        connectionStatus: 'disconnected' as const,
        isReconnecting: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3
      };
      
      render(<ConnectionStatus {...props} />);
      
      // Should show disconnected status - use getAllByText since it appears multiple times
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

    it('should show reconnecting status with attempt count', () => {
      const props = {
        connectionStatus: 'connecting' as const,
        isReconnecting: true,
        reconnectAttempts: 2,
        maxReconnectAttempts: 3
      };
      
      render(<ConnectionStatus {...props} />);
      
      // Should show connecting status - use getAllByText since it appears multiple times
      expect(screen.getAllByText(/connecting/i)).toHaveLength(2);
    });
  });

  describe('Component Error Handling', () => {
    it('should handle missing props gracefully', () => {
      // Test that components don't crash with minimal props
      const minimalStartProps = {
        onHostGame: jest.fn(),
        onJoinGame: jest.fn(),
        onClearError: jest.fn(),
        isConnecting: false
      };
      
      expect(() => {
        render(<StartScreen {...minimalStartProps} />);
      }).not.toThrow();
    });

    it('should handle null/undefined values gracefully', () => {
      const propsWithNulls = {
        onHostGame: jest.fn(),
        onJoinGame: jest.fn(),
        onClearError: jest.fn(),
        isConnecting: false,
        error: undefined
      };
      
      expect(() => {
        render(<StartScreen {...propsWithNulls} />);
      }).not.toThrow();
    });
  });

  describe('Component Accessibility', () => {
    it('should have proper button accessibility', () => {
      const props = {
        onHostGame: jest.fn(),
        onJoinGame: jest.fn(),
        onClearError: jest.fn(),
        isConnecting: false
      };
      
      render(<StartScreen {...props} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // All buttons should be accessible
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).not.toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should provide proper modal accessibility', () => {
      const props = {
        show: true,
        error: mockError,
        onHide: jest.fn(),
        onRetry: jest.fn()
      };
      
      render(<ErrorModal {...props} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('should update when props change', () => {
      const initialProps = {
        onHostGame: jest.fn(),
        onJoinGame: jest.fn(),
        onClearError: jest.fn(),
        isConnecting: false
      };
      
      const { rerender } = render(<StartScreen {...initialProps} />);
      
      expect(screen.queryByText(/HOSTING.../i)).not.toBeInTheDocument();
      
      // Update to connecting state
      const updatedProps = { ...initialProps, isConnecting: true };
      rerender(<StartScreen {...updatedProps} />);
      
      expect(screen.getByText(/HOSTING.../i)).toBeInTheDocument();
    });

    it('should handle error state changes', () => {
      const initialProps = {
        onHostGame: jest.fn(),
        onJoinGame: jest.fn(),
        onClearError: jest.fn(),
        isConnecting: false
      };
      
      const { rerender } = render(<StartScreen {...initialProps} />);
      
      expect(screen.queryByText(/connection error/i)).not.toBeInTheDocument();
      
      // Update to error state
      const errorProps = { ...initialProps, error: 'Connection error' };
      rerender(<StartScreen {...errorProps} />);
      
      expect(screen.getByText(/connection error/i)).toBeInTheDocument();
    });
  });

  describe('Component Performance', () => {
    it('should render efficiently', () => {
      const props = {
        onHostGame: jest.fn(),
        onJoinGame: jest.fn(),
        onClearError: jest.fn(),
        isConnecting: false
      };
      
      const startTime = performance.now();
      render(<StartScreen {...props} />);
      const endTime = performance.now();
      
      // Should render quickly (less than 50ms)
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle multiple rapid re-renders', () => {
      const props = {
        onHostGame: jest.fn(),
        onJoinGame: jest.fn(),
        onClearError: jest.fn(),
        isConnecting: false
      };
      
      const { rerender } = render(<StartScreen {...props} />);
      
      // Rapid re-renders should not cause issues
      for (let i = 0; i < 10; i++) {
        rerender(<StartScreen {...props} isConnecting={i % 2 === 0} />);
      }
      
      // Should still be functional
      expect(screen.getByText(/HOST GAME/i)).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should work together without conflicts', () => {
      const startProps = {
        onHostGame: jest.fn(),
        onJoinGame: jest.fn(),
        onClearError: jest.fn(),
        isConnecting: false
      };
      
      const errorProps = {
        show: true,
        error: mockError,
        onHide: jest.fn(),
        onRetry: jest.fn()
      };
      
      const statusProps = {
        connectionStatus: 'connected' as const,
        isReconnecting: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3
      };
      
      // Should be able to render multiple components together
      expect(() => {
        render(
          <div>
            <StartScreen {...startProps} />
            <ErrorModal {...errorProps} />
            <ConnectionStatus {...statusProps} />
          </div>
        );
      }).not.toThrow();
    });
  });
});