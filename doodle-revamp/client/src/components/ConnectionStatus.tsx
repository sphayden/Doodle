import React from 'react';
import { Alert, Spinner, Button } from 'react-bootstrap';
import { GameError } from '../interfaces';
import './ConnectionStatus.css';

interface ConnectionStatusProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: GameError | null;
  onRetry?: () => void;
  showWhenConnected?: boolean;
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionStatus,
  error,
  onRetry,
  showWhenConnected = false,
  className = ''
}) => {
  // Don't show anything when connected unless explicitly requested
  if (connectionStatus === 'connected' && !showWhenConnected) {
    return null;
  }

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connecting':
        return {
          variant: 'info' as const,
          icon: <Spinner size="sm" className="me-2" />,
          title: 'Connecting',
          message: 'Connecting to server...',
          showRetry: false
        };
      
      case 'connected':
        return {
          variant: 'success' as const,
          icon: '✅',
          title: 'Connected',
          message: 'Connected to server',
          showRetry: false
        };
      
      case 'disconnected':
        return {
          variant: 'warning' as const,
          icon: '⚠️',
          title: 'Disconnected',
          message: error?.message || 'Disconnected from server',
          showRetry: true
        };
      
      case 'error':
        return {
          variant: 'danger' as const,
          icon: '❌',
          title: 'Connection Error',
          message: error?.message || 'Failed to connect to server',
          showRetry: error?.recoverable !== false
        };
      
      default:
        return {
          variant: 'secondary' as const,
          icon: '❓',
          title: 'Unknown Status',
          message: 'Unknown connection status',
          showRetry: false
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Alert 
      variant={config.variant} 
      className={`connection-status-alert ${className}`}
      dismissible={false}
    >
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <span className="status-icon me-2">
            {config.icon}
          </span>
          <div>
            <strong>{config.title}</strong>
            {config.message && (
              <div className="status-message">
                {config.message}
              </div>
            )}
            {error?.recoverable && connectionStatus === 'error' && (
              <small className="text-muted">
                Attempting to reconnect automatically...
              </small>
            )}
          </div>
        </div>
        
        {config.showRetry && onRetry && (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onRetry}
            className="retry-btn"
          >
            Retry
          </Button>
        )}
      </div>
    </Alert>
  );
};

export default ConnectionStatus;