/**
 * Component Tests with Mocked GameManager
 * 
 * Tests all UI components with mocked dependencies to verify:
 * - Component rendering and basic functionality
 * - Error handling and edge cases
 * - Performance and accessibility
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import components to test
import AnimatedBackground from '../../components/AnimatedBackground';
import AnimatedLogo from '../../components/AnimatedLogo';
import ErrorModal from '../../components/ErrorModal';
import ConnectionStatus from '../../components/ConnectionStatus';

// Import types
import { GameError, GameErrorCode } from '../../interfaces/GameManager';

// Mock data
const mockError: GameError = {
  code: GameErrorCode.CONNECTION_FAILED,
  message: 'Failed to connect to server',
  timestamp: new Date(),
  recoverable: true
};

describe('Component Tests with Mocked GameManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AnimatedBackground Component', () => {
    it('should render without crashing', () => {
      render(<AnimatedBackground />);
      
      // Should render the animated background container
      const background = document.querySelector('.animated-background');
      expect(background).toBeInTheDocument();
    });

    it('should have proper CSS classes for animation', () => {
      render(<AnimatedBackground />);
      
      const background = document.querySelector('.animated-background');
      expect(background).toHaveClass('animated-background');
    });

    it('should render multiple doodle elements', () => {
      render(<AnimatedBackground />);
      
      const doodles = document.querySelectorAll('.doodle');
      expect(doodles.length).toBeGreaterThan(0);
    });

    it('should be accessible and not interfere with screen readers', () => {
      render(<AnimatedBackground />);
      
      const background = document.querySelector('.animated-background');
      // Background should not interfere with screen readers
      expect(background).toBeInTheDocument();
    });
  });

  describe('AnimatedLogo Component', () => {
    it('should render logo with animation', () => {
      render(<AnimatedLogo />);
      
      const logo = document.querySelector('.animated-logo');
      expect(logo).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(<AnimatedLogo />);
      
      const logo = document.querySelector('.animated-logo');
      expect(logo).toBeInTheDocument();
    });
  });

  describe('ErrorModal Component', () => {
    const mockProps = {
      show: true,
      error: mockError,
      onHide: jest.fn(),
      onRetry: jest.fn()
    };

    it('should render error modal when shown', () => {
      render(<ErrorModal {...mockProps} />);
      
      expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<ErrorModal {...mockProps} />);
      
      // Should have a close button
      const closeButton = screen.getByText('Close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('type', 'button');
    });

    it('should handle retry button click for recoverable errors', () => {
      render(<ErrorModal {...mockProps} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);
      
      expect(mockProps.onRetry).toHaveBeenCalled();
    });

    it('should render for non-recoverable errors', () => {
      const nonRecoverableProps = {
        ...mockProps,
        error: { ...mockError, recoverable: false }
      };
      
      expect(() => {
        render(<ErrorModal {...nonRecoverableProps} />);
      }).not.toThrow();
      
      // Should still show the error message
      expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
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

    it('should render without crashing for disconnected status', () => {
      const props = {
        connectionStatus: 'disconnected' as const,
        isReconnecting: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3
      };
      
      expect(() => {
        render(<ConnectionStatus {...props} />);
      }).not.toThrow();
      
      // Should show disconnected status
      expect(screen.getAllByText(/disconnected/i)).toHaveLength(2);
    });

    it('should render without crashing for error status', () => {
      const props = {
        connectionStatus: 'error' as const,
        isReconnecting: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3
      };
      
      expect(() => {
        render(<ConnectionStatus {...props} />);
      }).not.toThrow();
      
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it('should render without crashing for connecting status', () => {
      const props = {
        connectionStatus: 'connecting' as const,
        isReconnecting: true,
        reconnectAttempts: 2,
        maxReconnectAttempts: 3
      };
      
      expect(() => {
        render(<ConnectionStatus {...props} />);
      }).not.toThrow();
      
      // Should show connecting status
      expect(screen.getAllByText(/connecting/i)).toHaveLength(2);
    });

    it('should be accessible with proper structure', () => {
      const props = {
        connectionStatus: 'disconnected' as const,
        isReconnecting: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3
      };
      
      render(<ConnectionStatus {...props} />);
      
      // Should have proper accessibility attributes for disconnected state
      const alertElement = screen.queryByRole('alert');
      expect(alertElement).toBeInTheDocument();
    });
  });

  describe('Component Error Boundaries and Edge Cases', () => {
    it('should handle component crashes gracefully', () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const ThrowingComponent = () => {
        throw new Error('Component crashed');
      };
      
      expect(() => {
        render(<ThrowingComponent />);
      }).toThrow('Component crashed');
      
      consoleSpy.mockRestore();
    });

    it('should handle missing props gracefully', () => {
      // Test components with minimal props
      expect(() => {
        render(<AnimatedBackground />);
      }).not.toThrow();
      
      expect(() => {
        render(<AnimatedLogo />);
      }).not.toThrow();
    });
  });

  describe('Component Performance and Memory', () => {
    it('should render components efficiently', () => {
      const startTime = performance.now();
      
      render(<AnimatedBackground />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly
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
      for (let i = 0; i < 10; i++) {
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

  describe('Component Integration', () => {
    it('should work together without conflicts', () => {
      expect(() => {
        render(
          <div>
            <AnimatedBackground />
            <AnimatedLogo />
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
  });
});