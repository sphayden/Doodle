import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Badge, Alert, Spinner } from 'react-bootstrap';
import AnimatedBackground from './AnimatedBackground';
import { Player, GameError } from '../interfaces';
import './LobbyScreen.css';

interface LobbyScreenProps {
  players: Player[];
  canStart: boolean;
  onStartVoting: () => void;
  isHost?: boolean;
  roomCode?: string;
  isConnected?: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: GameError | null;
  isStarting?: boolean;
}

const LoadingDots = () => (
  <span className="loading-dots">
    Waiting for players
    <span className="dot">.</span>
    <span className="dot">.</span>
    <span className="dot">.</span>
  </span>
);

const LobbyScreen: React.FC<LobbyScreenProps> = ({ 
  players, 
  canStart, 
  onStartVoting, 
  isHost, 
  roomCode,
  isConnected = true,
  connectionStatus = 'connected',
  error = null,
  isStarting = false
}) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
    }
  };

  // Dynamically calculate empty slots based on screen size and available space
  const getEmptySlotCount = () => {
    const remaining = Math.max(0, 8 - players.length);
    const { width, height } = windowSize;
    
    // For very small screens or when there are many players, show fewer empty slots
    if (height < 600 || width < 500) {
      return Math.min(remaining, 2);
    } else if (height < 800 || remaining > 4) {
      return Math.min(remaining, 3);
    }
    
    return remaining;
  };

  const emptySlotCount = getEmptySlotCount();
  const hiddenSlots = Math.max(0, (8 - players.length) - emptySlotCount);

  return (
    <div className="lobby-screen">
      <AnimatedBackground />
      
      <Container fluid className="lobby-container">
        <Row className="justify-content-center h-100">
          <Col xs={12} sm={11} md={10} lg={8} xl={6} className="d-flex flex-column">
            
            {/* Header Section */}
            <div className="lobby-header text-center">
              <img 
                src="/logo.svg" 
                alt="Doodle Logo" 
                className="logo-responsive" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }} 
              />
              
              {/* Connection Status */}
              {connectionStatus !== 'connected' && (
                <Alert variant="warning" className="connection-alert mb-3">
                  {connectionStatus === 'connecting' && (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Connecting to server...
                    </>
                  )}
                  {connectionStatus === 'disconnected' && 'Disconnected from server'}
                  {connectionStatus === 'error' && 'Connection error - attempting to reconnect'}
                </Alert>
              )}
              
              {/* Error Display */}
              {error && (
                <Alert variant="danger" className="error-alert mb-3">
                  <strong>Error:</strong> {error.message}
                  {error.recoverable && (
                    <div className="mt-1">
                      <small>Attempting to recover...</small>
                    </div>
                  )}
                </Alert>
              )}
              
              {players.length === 1 ? (
                <div className="waiting-section">
                  <h2 className="waiting-title">
                    <LoadingDots />
                  </h2>
                  <p className="waiting-subtitle">
                    {isHost ? 'Share the room code to invite friends!' : 'Host is preparing the game...'}
                  </p>
                </div>
              ) : (
                <div className="game-ready-section">
                  <h2 className="lobby-title">Game Lobby</h2>
                  <p className="lobby-subtitle">
                    {players.length}/8 players joined
                    {canStart && isConnected && ' - Ready to start!'}
                    {!isConnected && ' - Reconnecting...'}
                  </p>
                </div>
              )}
            </div>

            {/* Room Code Section */}
            {isHost && roomCode && (
              <Card className="room-code-card">
                <Card.Body className="room-code-body">
                  <div className="room-code-display">
                    <span className="room-code-text">{roomCode}</span>
                    <Button 
                      variant="outline-primary"
                      size="sm"
                      onClick={copyRoomCode}
                      className="copy-btn"
                      title="Copy room code"
                    >
                      📋
                    </Button>
                  </div>
                  <div className="room-code-help">
                    Share this code with friends
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Players List */}
            <Card className={`players-card ${isHost && roomCode ? 'with-room-code' : ''}`}>
              <Card.Header className="players-header">
                <span className="players-title">
                  Players ({players.length})
                </span>
                <Badge bg="info" className="max-players-badge">
                  Max 8
                </Badge>
              </Card.Header>
              <Card.Body className="players-body">
                <div className="players-list">
                  {players.map((player, index) => {
                    const duplicateCount = players.filter(p => p.name === player.name).length;
                    const duplicateIndex = players.filter((p, i) => p.name === player.name && i <= index).length;
                    
                    return (
                      <div key={player.id} className="player-item">
                        <div className="player-info">
                          <div className="player-details">
                            <span className="player-name">
                              {player.name}
                              {duplicateCount > 1 && (
                                <small className="duplicate-indicator"> #{duplicateIndex}</small>
                              )}
                            </span>
                            <div className="player-badges">
                              {player.isHost && (
                                <Badge bg="warning" className="host-badge" title="Host">
                                  👑
                                </Badge>
                              )}
                              {player.isConnected && (
                                <Badge bg="success" className="ready-badge" title="Connected">
                                  Connected
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Empty slots - responsive count */}
                  {Array.from({ length: emptySlotCount }, (_, index) => (
                    <div key={`empty-${index}`} className="player-item empty-slot">
                      <div className="player-info">
                        <span className="empty-slot-text">Waiting for player...</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show remaining count if there are hidden empty slots */}
                  {hiddenSlots > 0 && (
                    <div className="remaining-slots">
                      +{hiddenSlots} more slot{hiddenSlots > 1 ? 's' : ''} available
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Action Section */}
            <div className="action-section text-center">
              {canStart && isConnected ? (
                <Button 
                  variant="success"
                  size="lg"
                  onClick={onStartVoting}
                  className={`start-game-btn ${isStarting ? 'starting' : ''}`}
                  disabled={isStarting || !isConnected}
                >
                  {isStarting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Starting Game...
                    </>
                  ) : (
                    '🎨 Start Game!'
                  )}
                </Button>
              ) : (
                <div className="waiting-info">
                  <p className="waiting-info-text">
                    {!isConnected 
                      ? "Reconnecting to server..." 
                      : players.length < 2 
                        ? "Need at least 2 players to start" 
                        : "Waiting for host to start..."}
                  </p>
                </div>
              )}
            </div>

          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LobbyScreen; 