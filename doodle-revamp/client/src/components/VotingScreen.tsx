import React, { useState } from 'react';
import { Spinner, Alert } from 'react-bootstrap';
import AnimatedBackground from './AnimatedBackground';
import { GameError } from '../interfaces';
import './VotingScreen.css';

interface VotingScreenProps {
  wordOptions: string[];
  votes: { [word: string]: number };
  onVote: (word: string) => void;
  isConnected?: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: GameError | null;
  playerCount?: number;
  playersVoted?: number;
}

const VotingScreen: React.FC<VotingScreenProps> = ({ 
  wordOptions, 
  votes, 
  onVote,
  isConnected = true,
  connectionStatus = 'connected',
  error = null,
  playerCount = 0,
  playersVoted = 0
}) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (word: string) => {
    if (isVoting || !isConnected) return;
    
    setIsVoting(true);
    setSelectedWord(word);
    
    try {
      onVote(word);
      // Keep the voting state for a moment to show feedback
      setTimeout(() => {
        setIsVoting(false);
      }, 1000);
    } catch (error) {
      setIsVoting(false);
      setSelectedWord(null);
    }
  };

  const getTotalVotes = () => {
    return Object.values(votes).reduce((sum, count) => sum + count, 0);
  };
  return (
    <div id="VotingScreen" className="screen-container">
      <AnimatedBackground />
      <div className="container-fluid" style={{ height: '100vh' }}>
        <div className="row align-items-center" style={{ height: '20%' }}>
          <div className="col text-center">
            <img src="/logo.svg" alt="Doodle Logo" className="logo-image-small" onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }} />
          </div>
        </div>
        
        <div className="row justify-content-center align-items-center" style={{ height: '20%' }}>
          <div className="col-10 text-center">
            <h1 className="vote-title">What To Doodle?</h1>
            <h3 className="text-white">Choose what everyone will draw!</h3>
            
            {/* Connection Status */}
            {connectionStatus !== 'connected' && (
              <Alert variant="warning" className="connection-alert">
                {connectionStatus === 'connecting' && (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Connecting...
                  </>
                )}
                {connectionStatus === 'disconnected' && 'Disconnected from server'}
                {connectionStatus === 'error' && 'Connection error'}
              </Alert>
            )}
            
            {/* Error Display */}
            {error && (
              <Alert variant="danger" className="error-alert">
                {error.message}
              </Alert>
            )}
          </div>
        </div>
        
        <div className="row justify-content-center" style={{ height: '60%' }}>
          <div className="col-lg-8 text-center">
            <div className="row align-items-center" style={{ height: '15%' }}>
              <div className="col text-center">
                <h2>Word Options</h2>
              </div>
            </div>
            <div className="row align-items-start" style={{ height: '85%' }}>
              <div className="col text-center">
                {wordOptions.length === 0 ? (
                  <div className="loading-words">
                    <Spinner animation="border" variant="light" />
                    <p className="text-white mt-3">Loading word options...</p>
                  </div>
                ) : (
                  <ul className="list-group align-items-center">
                    {wordOptions.map((word) => {
                      const isSelected = selectedWord === word;
                      const voteCount = votes[word] || 0;
                      
                      return (
                        <li 
                          key={word}
                          className={`li-element-term list-group-item d-flex justify-content-between align-items-center shadow ${
                            isSelected ? 'selected' : ''
                          } ${!isConnected ? 'disabled' : ''}`}
                          onClick={() => handleVote(word)}
                          style={{ 
                            cursor: isConnected ? 'pointer' : 'not-allowed',
                            opacity: !isConnected ? 0.6 : 1
                          }}
                        >
                          <h3 className="h3-override-term">
                            {word}
                            {isSelected && isVoting && (
                              <Spinner size="sm" className="ms-2" />
                            )}
                          </h3>
                          <span className="badge badge-primary badge-pill">
                            {voteCount}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                
                <div className="voting-info mt-4">
                  <p className="text-white">
                    {isConnected ? (
                      <>
                        Click on a word to vote! 
                        {playerCount > 0 && (
                          <span className="vote-progress">
                            {' '}({getTotalVotes()}/{playerCount} votes)
                          </span>
                        )}
                      </>
                    ) : (
                      'Reconnecting to server...'
                    )}
                  </p>
                  
                  {selectedWord && !isVoting && (
                    <p className="text-success">
                      ✓ You voted for "{selectedWord}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingScreen; 