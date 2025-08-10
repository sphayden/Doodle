import React, { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import JoinGameScreen from './components/JoinGameScreen';
import LobbyScreen from './components/LobbyScreen';
import VotingScreen from './components/VotingScreen';
import GameScreen from './components/GameScreen';
import TieBreakerModal from './components/TieBreakerModal';
import TestUtils from './utils/TestUtils';
import { SocketGameManager, GameState as SocketGameState, TieBreakerCallbacks } from './services/SocketGameManager';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface AppState {
  currentScreen: 'start' | 'join' | 'lobby' | 'voting' | 'game' | 'results';
  playerName: string;
  gameManager: SocketGameManager | null;
  gameState: SocketGameState | null;
  isHost: boolean;
  roomCode: string;
  error: string;
  isConnecting: boolean;
  showTieBreaker: boolean;
  tiedOptions: string[];
  winningWord: string;
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    currentScreen: 'start',
    playerName: '',
    gameManager: null,
    gameState: null,
    isHost: false,
    roomCode: '',
    error: '',
    isConnecting: false,
    showTieBreaker: false,
    tiedOptions: [],
    winningWord: ''
  });

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (appState.gameManager) {
        appState.gameManager.destroy();
      }
    };
  }, [appState.gameManager]);

  const handleGameStateChange = (gameState: SocketGameState) => {
    setAppState(prev => ({
      ...prev,
      gameState: gameState,
      roomCode: gameState.roomCode,
      currentScreen: gameState.gamePhase === 'lobby' ? 'lobby' : 
                     gameState.gamePhase === 'voting' ? 'voting' :
                     gameState.gamePhase === 'drawing' ? 'game' :
                     gameState.gamePhase === 'results' ? 'results' : 'lobby'
    }));
  };

  const hostGame = async (playerName: string) => {
    console.log('hostGame called with playerName:', playerName);
    try {
      setAppState(prev => ({ 
        ...prev, 
        playerName, 
        isConnecting: true, 
        error: '' 
      }));

      console.log('Creating SocketGameManager...');
      const tieBreakerCallbacks: TieBreakerCallbacks = {
        onTieDetected: handleTieDetected,
        onTieResolved: handleTieResolved
      };
      const gameManager = new SocketGameManager(handleGameStateChange, tieBreakerCallbacks);
      console.log('Calling hostGame...');
      const roomCode = await gameManager.hostGame(playerName);
      console.log('Host game successful, roomCode:', roomCode);

      setAppState(prev => ({
        ...prev,
        gameManager,
        isHost: true,
        roomCode,
        currentScreen: 'lobby',
        isConnecting: false
      }));
    } catch (error) {
      console.error('Error hosting game:', error);
      setAppState(prev => ({
        ...prev,
        error: 'Failed to host game. Please try again.',
        isConnecting: false
      }));
    }
  };

  const showJoinGame = (playerName: string) => {
    setAppState(prev => ({
      ...prev,
      playerName,
      currentScreen: 'join',
      error: '',
      gameManager: null,
      gameState: null,
      roomCode: '',
      isConnecting: false
    }));
  };

  const joinGame = async (roomCode: string) => {
    try {
      setAppState(prev => ({ 
        ...prev, 
        isConnecting: true, 
        error: '' 
      }));

      const tieBreakerCallbacks: TieBreakerCallbacks = {
        onTieDetected: handleTieDetected,
        onTieResolved: handleTieResolved
      };
      const gameManager = new SocketGameManager(handleGameStateChange, tieBreakerCallbacks);
      await gameManager.joinGame(appState.playerName, roomCode);

      setAppState(prev => ({
        ...prev,
        gameManager,
        isHost: false,
        roomCode,
        currentScreen: 'lobby',
        isConnecting: false
      }));
    } catch (error) {
      console.error('Error joining game:', error);
      setAppState(prev => ({
        ...prev,
        error: 'Failed to join game. Check the room code and try again.',
        isConnecting: false
      }));
    }
  };

  const backToStart = () => {
    setAppState(prev => ({
      ...prev,
      currentScreen: 'start',
      error: '',
      isConnecting: false
    }));
  };

  const clearError = () => {
    setAppState(prev => ({
      ...prev,
      error: ''
    }));
  };

  const handleTieDetected = (tiedOptions: string[], winningWord: string) => {
    console.log('🎲 [APP] handleTieDetected called with options:', tiedOptions, 'winning word:', winningWord);
    setAppState(prev => ({
      ...prev,
      showTieBreaker: true,
      tiedOptions,
      winningWord
    }));
  };

  const handleTieResolved = (selectedOption: string) => {
    console.log('🎲 [APP] handleTieResolved called with option:', selectedOption);
    setAppState(prev => ({
      ...prev,
      showTieBreaker: false,
      tiedOptions: []
    }));
  };

  const startVoting = () => {
    if (appState.gameManager) {
      appState.gameManager.startVoting();
    }
  };

  const voteForWord = (word: string) => {
    if (appState.gameManager) {
      appState.gameManager.voteForWord(word);
    }
  };

  const handleTieSelectionComplete = (selectedOption: string) => {
    console.log('🎲 [APP] Tie selection complete, chosen word:', selectedOption);
    if (appState.gameManager) {
      appState.gameManager.resolveTiebreaker(selectedOption);
    }
    // Hide the modal
    setAppState(prev => ({
      ...prev,
      showTieBreaker: false,
      tiedOptions: []
    }));
  };

  // Test simulation functions (moved to DevTools)
  const simulateTie = (tiedOptions: string[]) => {
    console.log('🧪 [APP] Simulating tie with options:', tiedOptions);
    const winningWord = tiedOptions[Math.floor(Math.random() * tiedOptions.length)];
    setAppState(prev => ({
      ...prev,
      showTieBreaker: true,
      tiedOptions,
      winningWord
    }));
  };

  const simulateVoting = (wordOptions: string[], votes: { [word: string]: number }) => {
    console.log('🧪 [APP] Simulating voting scenario');
    const mockGameState: SocketGameState = {
      roomCode: 'TEST123',
      players: [
        { id: '1', name: 'Test Player 1', ready: true, score: 0 },
        { id: '2', name: 'Test Player 2', ready: true, score: 0 }
      ],
      playerCount: 2,
      maxPlayers: 8,
      gamePhase: 'voting',
      wordOptions,
      voteCounts: votes,
      chosenWord: '',
      timeRemaining: 0,
      drawingTimeLimit: 60,
      submittedDrawings: 0,
      aiResults: []
    };
    
    setAppState(prev => ({
      ...prev,
      gameState: mockGameState,
      currentScreen: 'voting'
    }));
  };

  const simulateGameStart = (word: string) => {
    console.log('🧪 [APP] Simulating game start with word:', word);
    const mockGameState: SocketGameState = {
      roomCode: 'TEST123',
      players: [
        { id: '1', name: 'Test Player 1', ready: true, score: 0 },
        { id: '2', name: 'Test Player 2', ready: true, score: 0 }
      ],
      playerCount: 2,
      maxPlayers: 8,
      gamePhase: 'drawing',
      wordOptions: [],
      voteCounts: {},
      chosenWord: word,
      timeRemaining: 60,
      drawingTimeLimit: 60,
      submittedDrawings: 0,
      aiResults: []
    };
    
    setAppState(prev => ({
      ...prev,
      gameState: mockGameState,
      currentScreen: 'game'
    }));
  };

  const renderCurrentScreen = () => {
    console.log('Rendering screen:', gameState.currentScreen, 'isHost:', gameState.isHost, 'roomCode:', gameState.roomCode);
    switch (gameState.currentScreen) {
      case 'start':
        return <StartScreen 
          onHostGame={hostGame} 
          onJoinGame={showJoinGame} 
          error={gameState.error}
          onClearError={clearError}
        />;
      case 'join':
        return (
          <JoinGameScreen
            playerName={gameState.playerName}
            onJoinGame={joinGame}
            onBack={backToStart}
            error={gameState.error}
            onClearError={clearError}
            isConnecting={gameState.isConnecting}
          />
        );
      case 'lobby':
        return (
          <LobbyScreen
            players={gameState.socketGameState?.players || []}
            canStart={(gameState.socketGameState?.playerCount || 0) >= 2 && gameState.isHost}
            onStartVoting={startVoting}
            isHost={gameState.isHost}
            roomCode={gameState.roomCode}
          />
        );
      case 'voting':
        if (!gameState.socketGameState) return null;
        return (
          <VotingScreen
            wordOptions={gameState.socketGameState.wordOptions}
            votes={gameState.socketGameState.voteCounts}
            onVote={voteForWord}
          />
        );
      case 'game':
        if (!gameState.socketGameState) return null;
        return (
          <GameScreen
            word={gameState.socketGameState.chosenWord}
            timeRemaining={gameState.socketGameState.timeRemaining}
            onDrawingComplete={(canvasData) => {
              if (gameState.gameManager) {
                gameState.gameManager.submitDrawing(canvasData);
              }
            }}
            onFinishDrawing={() => {
              if (gameState.gameManager) {
                gameState.gameManager.finishDrawing();
              }
            }}
            playersFinished={[]} // Will implement this later
            currentPlayerId={gameState.gameManager?.getRoomId()}
          />
        );
      case 'results':
        if (!gameState.socketGameState) return null;
        return (
          <div className="results-screen">
            <h2>AI Judging Results!</h2>
            <div className="results-container">
              {gameState.socketGameState.aiResults.map((result, index) => (
                <div key={result.playerId} className="result-item">
                  <div className="rank">#{result.rank}</div>
                  <div className="player-info">
                    <h3>{result.playerName}</h3>
                    <p>Score: {result.score}/100</p>
                    <p>{result.feedback}</p>
                  </div>
                  <img src={result.canvasData} alt={`${result.playerName}'s drawing`} className="result-drawing" />
                </div>
              ))}
            </div>
            <button onClick={() => setGameState(prev => ({ ...prev, currentScreen: 'start', gameManager: null, socketGameState: null }))}>
              New Game
            </button>
          </div>
        );
              default:
        return <StartScreen 
          onHostGame={hostGame} 
          onJoinGame={showJoinGame} 
          error={gameState.error}
          onClearError={clearError}
        />;
    }
  };

  return (
    <div className="App">
      <div className="overlay"></div>
      {renderCurrentScreen()}
      
      <TieBreakerModal
        show={gameState.showTieBreaker}
        onHide={() => {}} // Modal cannot be closed manually during tie breaking
        tiedOptions={gameState.tiedOptions}
        winningWord={gameState.winningWord}
        onSelectionComplete={handleTieSelectionComplete}
      />

      {/* Development Test Panel - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <TestUtils
          onSimulateTie={simulateTie}
          onSimulateVoting={simulateVoting}
          onSimulateGameStart={simulateGameStart}
        />
      )}
    </div>
  );
}

export default App;
