import React, { useEffect, useState } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import './NotificationModal.css';

interface NotificationModalProps {
  show: boolean;
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title?: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  show,
  message,
  type,
  title,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000
}) => {
  const [timeLeft, setTimeLeft] = useState(autoCloseDelay / 1000);

  useEffect(() => {
    if (show && autoClose) {
      setTimeLeft(autoCloseDelay / 1000);
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [show, autoClose, autoCloseDelay, onClose]);

  const getVariant = () => {
    switch (type) {
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      case 'success': return 'Success';
      case 'info': return 'Information';
      default: return 'Notification';
    }
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop="static"
      keyboard={true}
      className="notification-modal"
    >
      <Modal.Header className={`notification-header ${type}`}>
        <Modal.Title className="notification-title">
          <span className="notification-icon">{getIcon()}</span>
          {getTitle()}
        </Modal.Title>
        <Button
          variant="outline-light"
          size="sm"
          className="close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </Button>
      </Modal.Header>
      
      <Modal.Body className="notification-body">
        <Alert variant={getVariant()} className="notification-alert">
          {message}
        </Alert>
        
        {autoClose && timeLeft > 0 && (
          <div className="auto-close-info">
            <small className="text-muted">
              Auto-closing in {timeLeft} seconds...
            </small>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer className="notification-footer">
        <Button variant="primary" onClick={onClose} className="dismiss-btn">
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NotificationModal; 