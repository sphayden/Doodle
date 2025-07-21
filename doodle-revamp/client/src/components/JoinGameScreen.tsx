import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import AnimatedBackground from './AnimatedBackground';
import NotificationModal from './NotificationModal';
import './JoinGameScreen.css';

interface JoinGameScreenProps {
  playerName: string;
  onJoinGame: (roomId: string) => void;
  onBack: () => void;
  error?: string;
  onClearError: () => void;
  isConnecting?: boolean;
}

const JoinGameScreen: React.FC<JoinGameScreenProps> = ({ 
  playerName, 
  onJoinGame, 
  onBack, 
  error, 
  onClearError,
  isConnecting 
}) => {
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = () => {
    if (roomCode.trim()) {
      onJoinGame(roomCode.trim().toUpperCase());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && roomCode.trim() && !isConnecting) {
      handleJoin();
    }
  };

  const formatRoomCode = (value: string) => {
    // Convert to uppercase and limit to 6 characters
    return value.toUpperCase().slice(0, 6);
  };

  return (
    <div className="join-game-screen">
      <AnimatedBackground />
      
      <Container fluid className="h-100 d-flex align-items-center">
        <Row className="w-100 justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5} className="text-center">
            
            {/* Logo Section */}
            <div className="logo-section mb-4">
              <img 
                src="/Logo3.PNG" 
                alt="Doodle Logo" 
                className="logo-responsive" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }} 
              />
              <h2 className="welcome-text mt-3">Welcome, {playerName}!</h2>
              <h3 className="instruction-text">Enter room code to join:</h3>
            </div>

            {/* Room Code Input Section */}
            <div className="room-code-section mb-4">
              <Form.Control
                type="text"
                placeholder="ABCD12"
                value={roomCode}
                onChange={(e) => setRoomCode(formatRoomCode(e.target.value))}
                onKeyPress={handleKeyPress}
                maxLength={6}
                disabled={isConnecting}
                autoFocus
                className="room-code-input"
                size="lg"
              />
              <Form.Text className="helper-text">
                Enter the 6-character room code
              </Form.Text>
            </div>

            {/* Notification Modal */}
            <NotificationModal
              show={!!error}
              message={error || ''}
              type="error"
              onClose={onClearError}
            />
            
            {/* Action Buttons */}
            <div className="action-buttons">
              <Button 
                variant="success"
                size="lg"
                onClick={handleJoin}
                disabled={!roomCode.trim() || isConnecting}
                className={`join-btn mb-3 ${isConnecting ? 'connecting' : ''}`}
              >
                {isConnecting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Connecting...
                  </>
                ) : (
                  'JOIN GAME'
                )}
              </Button>
              
              <Button 
                variant="outline-light"
                onClick={onBack}
                disabled={isConnecting}
                className="back-btn"
              >
                ← Back
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default JoinGameScreen; 