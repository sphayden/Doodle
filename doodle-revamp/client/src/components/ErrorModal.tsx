import React from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import { GameError, GameErrorCode } from '../interfaces';
import './ErrorModal.css';

interface ErrorModalProps {
  show: boolean;
  error: GameError | null;
  onHide: () => void;
  onRetry?: () => void;
  onReconnect?: () => void;
  isRetrying?: boolean;
  isReconnecting?: boolean;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  show,
  error,
  onHide,
  onRetry,
  onReconnect,
  isRetrying = false,
  isReconnecting = false
}) => {
  if (!error) return null;

  const getErrorConfig = () => {
    const isConnectionError = [
      GameErrorCode.CONNECTION_FAILED,
      GameErrorCode.CONNECTION_TIMEOUT,
      GameErrorCode.CONNECTION_LOST,
      GameErrorCode.SERVER_UNREACHABLE
    ].includes(error.code as GameErrorCode);

    const isGameError = [
      GameErrorCode.ROOM_NOT_FOUND,
      GameErrorCode.ROOM_FULL,
      GameErrorCode.INVALID_ROOM_CODE,
      GameErrorCode.PLAYER_NOT_FOUND,
      GameErrorCode.INVALID_GAME_STATE,
      GameErrorCode.UNAUTHORIZED_ACTION
    ].includes(error.code as GameErrorCode);

    const isValidationError = [
      GameErrorCode.INVALID_PLAYER_NAME,
      GameErrorCode.INVALID_DRAWING_DATA,
      GameErrorCode.INVALID_VOTE
    ].includes(error.code as GameErrorCode);

    if (isConnectionError) {
      return {
        title: 'Connection Problem',
        variant: 'warning' as const,
        icon: '🔌',
        showReconnect: error.recoverable,
        showRetry: error.recoverable,
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact support if the problem persists'
        ]
      };
    }

    if (isGameError) {
      return {
        title: 'Game Error',
        variant: 'danger' as const,
        icon: '🎮',
        showReconnect: false,
        showRetry: error.recoverable,
        suggestions: error.code === GameErrorCode.ROOM_NOT_FOUND 
          ? ['Double-check the room code', 'Ask the host for the correct code']
          : error.code === GameErrorCode.ROOM_FULL
          ? ['Try joining a different room', 'Wait for a player to leave']
          : ['Try the action again', 'Refresh the page if the problem continues']
      };
    }

    if (isValidationError) {
      return {
        title: 'Input Error',
        variant: 'info' as const,
        icon: '✏️',
        showReconnect: false,
        showRetry: true,
        suggestions: [
          'Check your input and try again',
          'Make sure all required fields are filled'
        ]
      };
    }

    return {
      title: 'Unexpected Error',
      variant: 'danger' as const,
      icon: '⚠️',
      showReconnect: error.recoverable,
      showRetry: error.recoverable,
      suggestions: [
        'Try refreshing the page',
        'Contact support if the problem persists'
      ]
    };
  };

  const config = getErrorConfig();

  const handleRetry = () => {
    if (onRetry && !isRetrying) {
      onRetry();
    }
  };

  const handleReconnect = () => {
    if (onReconnect && !isReconnecting) {
      onReconnect();
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      centered
      backdrop="static"
      keyboard={false}
      className="error-modal"
    >
      <Modal.Header className={`error-modal-header bg-${config.variant}`}>
        <Modal.Title className="d-flex align-items-center text-white">
          <span className="error-icon me-2">{config.icon}</span>
          {config.title}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="error-modal-body">
        <Alert variant={config.variant} className="error-alert">
          <div className="error-details">
            <h6 className="error-message">{error.message}</h6>
            
            {error.details && (
              <details className="error-technical-details mt-2">
                <summary className="text-muted">Technical Details</summary>
                <pre className="mt-2 p-2 bg-light rounded">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </Alert>

        {config.suggestions.length > 0 && (
          <div className="error-suggestions">
            <h6>What you can try:</h6>
            <ul className="suggestions-list">
              {config.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {error.recoverable && (
          <div className="recovery-info">
            <small className="text-muted">
              <strong>Good news:</strong> This error can usually be resolved automatically or with a simple retry.
            </small>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer className="error-modal-footer">
        <div className="d-flex justify-content-between w-100">
          <div className="action-buttons">
            {config.showReconnect && onReconnect && (
              <Button
                variant="warning"
                onClick={handleReconnect}
                disabled={isReconnecting}
                className="me-2"
              >
                {isReconnecting ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Reconnecting...
                  </>
                ) : (
                  '🔄 Reconnect'
                )}
              </Button>
            )}
            
            {config.showRetry && onRetry && (
              <Button
                variant="primary"
                onClick={handleRetry}
                disabled={isRetrying}
                className="me-2"
              >
                {isRetrying ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Retrying...
                  </>
                ) : (
                  '🔄 Retry'
                )}
              </Button>
            )}
          </div>
          
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ErrorModal;