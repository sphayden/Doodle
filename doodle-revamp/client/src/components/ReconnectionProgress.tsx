import React, { useEffect, useState } from 'react';
import { Modal, ProgressBar, Button, Alert } from 'react-bootstrap';
import './ReconnectionProgress.css';

interface ReconnectionProgressProps {
  show: boolean;
  attempt: number;
  maxAttempts: number;
  nextAttemptIn?: number;
  onCancel?: () => void;
  onRetryNow?: () => void;
  error?: string;
}

const ReconnectionProgress: React.FC<ReconnectionProgressProps> = ({
  show,
  attempt,
  maxAttempts,
  nextAttemptIn = 0,
  onCancel,
  onRetryNow,
  error
}) => {
  const [countdown, setCountdown] = useState(nextAttemptIn);

  useEffect(() => {
    setCountdown(nextAttemptIn);
  }, [nextAttemptIn]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const progressPercentage = ((attempt - 1) / maxAttempts) * 100;
  const isLastAttempt = attempt >= maxAttempts;

  return (
    <Modal 
      show={show}
      centered
      backdrop="static"
      keyboard={false}
      className="reconnection-modal"
    >
      <Modal.Header className="reconnection-header">
        <Modal.Title className="d-flex align-items-center">
          <span className="reconnection-icon me-2">🔄</span>
          Reconnecting to Server
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="reconnection-body">
        {error && (
          <Alert variant="warning" className="mb-3">
            <strong>Connection Issue:</strong> {error}
          </Alert>
        )}
        
        <div className="reconnection-status">
          <div className="attempt-info mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <span className="attempt-text">
                Attempt {attempt} of {maxAttempts}
              </span>
              {!isLastAttempt && countdown > 0 && (
                <span className="countdown-text">
                  Next attempt in {countdown}s
                </span>
              )}
            </div>
            
            <ProgressBar 
              now={progressPercentage} 
              variant={isLastAttempt ? 'danger' : 'info'}
              className="mt-2"
              animated
              striped
            />
          </div>
          
          {isLastAttempt ? (
            <Alert variant="danger" className="final-attempt-alert">
              <strong>Final attempt!</strong> If this fails, you'll need to manually reconnect.
            </Alert>
          ) : (
            <div className="reconnection-message">
              <p className="text-muted mb-2">
                We're trying to restore your connection. This usually takes just a moment.
              </p>
              
              <div className="connection-tips">
                <small className="text-muted">
                  <strong>Tips:</strong>
                  <ul className="tips-list">
                    <li>Check your internet connection</li>
                    <li>Make sure the server is accessible</li>
                    <li>Try refreshing the page if reconnection fails</li>
                  </ul>
                </small>
              </div>
            </div>
          )}
        </div>
      </Modal.Body>
      
      <Modal.Footer className="reconnection-footer">
        <div className="d-flex justify-content-between w-100">
          <div className="action-buttons">
            {onRetryNow && (
              <Button
                variant="primary"
                onClick={onRetryNow}
                size="sm"
                className="retry-now-btn"
              >
                🚀 Retry Now
              </Button>
            )}
          </div>
          
          {onCancel && (
            <Button 
              variant="outline-secondary" 
              onClick={onCancel}
              size="sm"
            >
              Cancel
            </Button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ReconnectionProgress;