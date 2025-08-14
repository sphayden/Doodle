/**
 * ResultsScreen Component - Enhanced results display with animations and modern UI
 * Matches the application's design theme with blue background and card-based layout
 */

import React, { useState, useEffect } from 'react';
import { Button, Badge, Modal } from 'react-bootstrap';
import AnimatedBackground from './AnimatedBackground';
import { GameResult, GameState } from '../interfaces/GameManager';
import './ResultsScreen.css';

interface ResultsScreenProps {
  gameState: GameState;
  onNewGame: () => void;
  onPlayAgain?: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({
  gameState,
  onNewGame,
  onPlayAgain
}) => {
  const [showResults, setShowResults] = useState(false);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<GameResult | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Animate results reveal
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowResults(true);
      
      // Show winner celebration
      if (gameState.results && gameState.results.length > 0) {
        const winner = gameState.results.find(r => r.rank === 1);
        if (winner) {
          setTimeout(() => setShowCelebration(true), 1000);
          setTimeout(() => setShowCelebration(false), 4000);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [gameState.results]);

  // Animate individual results
  useEffect(() => {
    if (!showResults || !gameState.results) return;

    const animateResults = async () => {
      for (let i = 0; i < gameState.results.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setCurrentResultIndex(i);
      }
    };

    animateResults();
  }, [showResults, gameState.results]);

  const handleDrawingClick = (result: GameResult) => {
    setSelectedDrawing(result);
    setShowDrawingModal(true);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return '#6c757d'; // Gray
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#28a745'; // Green
    if (score >= 70) return '#ffc107'; // Yellow
    if (score >= 50) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };

  if (!gameState.results || gameState.results.length === 0) {
    return (
      <div className="results-screen">
        <AnimatedBackground />
        <div className="container-fluid">
          <div className="results-container">
            <div className="results-header">
              <h1 className="results-title">🎨 Game Results</h1>
              <p className="results-subtitle">No results available</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="results-screen">
      <AnimatedBackground />
      
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-content">
            <div className="celebration-emoji">🎉</div>
            <div className="celebration-text">
              Congratulations {gameState.results.find(r => r.rank === 1)?.playerName}!
            </div>
            <div className="celebration-emoji">🏆</div>
          </div>
        </div>
      )}

      <div className="container-fluid">
        <div className="results-container">
          
          {/* Header */}
          <div className="results-header">
            <div className="logo-container">
              <img 
                src="/logo.png" 
                alt="Doodle Logo" 
                className="logo-responsive"
                onError={(e) => {
                  // Fallback to text logo if image fails to load
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="text-logo">🎨 DOODLE</div>';
                  }
                }}
              />
            </div>
            <h1 className="results-title">🎨 AI Judging Results!</h1>
            <p className="results-subtitle">
              The word was: <span className="chosen-word">"{gameState.chosenWord}"</span>
            </p>
          </div>

          {/* Results Grid */}
          <div className="results-grid-container">
            {gameState.results && gameState.results.length > 3 && (
              <div className="scroll-hint">
                <span>← Scroll to see all results →</span>
              </div>
            )}
            <div className="results-grid">
              {gameState.results
                .sort((a, b) => a.rank - b.rank)
                .map((result, index) => (
                <div
                  key={result.playerId}
                  className={`result-card ${
                    showResults && index <= currentResultIndex ? 'visible' : ''
                  } ${result.rank === 1 ? 'winner' : ''}`}
                  style={{ 
                    animationDelay: `${index * 0.3}s`,
                    '--rank-color': getRankColor(result.rank)
                  } as React.CSSProperties}
                >
                  <div className="result-card-inner">
                    
                    {/* Rank Badge */}
                    <div className="rank-badge" style={{ backgroundColor: getRankColor(result.rank) }}>
                      <span className="rank-icon">{getRankIcon(result.rank)}</span>
                    </div>

                    {/* Player Info */}
                    <div className="player-section">
                      <h3 className="player-name">{result.playerName}</h3>
                      <div className="score-section">
                        <div 
                          className="score-circle"
                          style={{ borderColor: getScoreColor(result.score) }}
                        >
                          <span 
                            className="score-number"
                            style={{ color: getScoreColor(result.score) }}
                          >
                            {result.score}
                          </span>
                          <span className="score-label">/ 100</span>
                        </div>
                      </div>
                    </div>

                    {/* Drawing Preview */}
                    <div className="drawing-section">
                      <div 
                        className="drawing-preview"
                        onClick={() => handleDrawingClick(result)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleDrawingClick(result);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`View ${result.playerName}'s drawing in full size`}
                      >
                        <img 
                          src={result.canvasData} 
                          alt={`${result.playerName}'s drawing of "${gameState.chosenWord}"`}
                          className="drawing-image"
                          onError={(e) => {
                            // Fallback for broken images
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                        <div className="drawing-overlay">
                          <span className="view-text">👁️ View</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Feedback */}
                    <div className="feedback-section">
                      <div className="feedback-bubble">
                        <div className="feedback-header">
                          <span className="ai-icon">🤖</span>
                          <span className="ai-label">AI Judge</span>
                        </div>
                        <p className="feedback-text">{result.feedback}</p>
                      </div>
                    </div>

                  </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-section">
            <div className="action-buttons">
              {onPlayAgain && (
                <Button
                  className="action-btn play-again-btn"
                  onClick={onPlayAgain}
                  size="lg"
                >
                  🔄 Play Again
                </Button>
              )}
              <Button
                className="action-btn new-game-btn"
                onClick={onNewGame}
                size="lg"
              >
                🏠 New Game
              </Button>
            </div>
            
            {/* Game Stats */}
            <div className="game-stats">
              <div className="stat-item">
                <span className="stat-label">Players:</span>
                <span className="stat-value">{gameState.results.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Word:</span>
                <span className="stat-value">"{gameState.chosenWord}"</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Room:</span>
                <span className="stat-value">{gameState.roomCode}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Drawing Modal */}
      <Modal 
        show={showDrawingModal} 
        onHide={() => setShowDrawingModal(false)}
        size="lg"
        centered
        className="drawing-modal"
      >
        <Modal.Header closeButton className="drawing-modal-header">
          <Modal.Title>
            {selectedDrawing?.playerName}'s Drawing
            <Badge 
              className="ms-2"
              style={{ backgroundColor: getRankColor(selectedDrawing?.rank || 0) }}
            >
              {getRankIcon(selectedDrawing?.rank || 0)}
            </Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="drawing-modal-body">
          {selectedDrawing && (
            <>
              <div className="modal-drawing-container">
                <img 
                  src={selectedDrawing.canvasData} 
                  alt={`${selectedDrawing.playerName}'s drawing`}
                  className="modal-drawing-image"
                />
              </div>
              <div className="modal-drawing-info">
                <div className="modal-score">
                  <span className="modal-score-label">Score:</span>
                  <span 
                    className="modal-score-value"
                    style={{ color: getScoreColor(selectedDrawing.score) }}
                  >
                    {selectedDrawing.score}/100
                  </span>
                </div>
                <div className="modal-feedback">
                  <div className="modal-feedback-header">
                    <span className="ai-icon">🤖</span>
                    <span>AI Feedback</span>
                  </div>
                  <p className="modal-feedback-text">{selectedDrawing.feedback}</p>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

    </div>
  );
};

export default ResultsScreen;