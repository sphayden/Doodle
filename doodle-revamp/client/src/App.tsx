import React, { useState, useEffect, useCallback } from 'react';
import StartScreen from './components/StartScreen';
import JoinGameScreen from './components/JoinGameScreen';
import LobbyScreen from './components/LobbyScreen';
import VotingScreen from './components/VotingScreen';
import GameScreen from './components/GameScreen';
import TieBreakerModal from './components/TieBreakerModal';
import TestUtils from './utils/TestUtils';
import ConnectionStatus from './components/ConnectionStatus';
import ErrorModal from './components/ErrorModal';
import ReconnectionProgress from './components/ReconnectionProgress';
import { 
  GameManager, 
  GameState, 
  GameError, 
  TieBreakerCallbacks,
  GameErrorCode 
} from './interfaces';
import { SocketGameManager } from './services/SocketGameManager';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface AppState {
  currentScreen: 'start' | 'join' | 'lobby' | 'voting' | 'game' | 'results';
  playerName: string;
  gameManager: GameManager | null;
  gameState: GameState | null;
  isHost: boolean;
  roomCode: string;
  error: string;
  isConnecting: boolean;
  showTieBreaker: boolean;
  tiedOptions: string[];
  winningWord: string;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  showErrorModal: boolean;
  showReconnectionProgress: boolean;
  reconnectionAttempt: number;
  maxReconnectionAttempts: number;
  nextAttemptIn: number;
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
    winningWord: '',
    connectionStatus: 'disconnected',
    showErrorModal: false,
    showReconnectionProgress: false,
    reconnectionAttempt: 0,
    maxReconnectionAttempts: 5,
    nextAttemptIn: 0
  });

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (appState.gameManager) {
        appState.gameManager.destroy();
      }
    };
  }, [appState.gameManager]);

  const handleGameStateChange = useCallback((gameState: GameState) => {
    setAppState(prev => ({
      ...prev,
      gameState: gameState,
      roomCode: gameState.roomCode,
      connectionStatus: gameState.connectionStatus,
      currentScreen: gameState.gamePhase === 'lobby' ? 'lobby' : 
                     gameState.gamePhase === 'voting' ? 'voting' :
                     gameState.gamePhase === 'drawing' ? 'game' :
                     gameState.gamePhase === 'results' ? 'results' : 'lobby'
    }));
  }, []);

  const handleGameError = useCallback((error: GameError) => {
    console.error('Game error:', error);
    
    // Update state with error and show modal for serious errors
    setAppState(prev => ({
      ...prev,
      error: error.message,
      isConnecting: false,
      connectionStatus: error.code.includes('CONNECTION') ? 'error' : prev.connectionStatus,
      showErrorModal: !error.recoverable || [
        GameErrorCode.CONNECTION_FAILED,
        GameErrorCode.ROOM_NOT_FOUND,
        GameErrorCode.ROOM_FULL,
        GameErrorCode.INVALID_ROOM_CODE
      ].includes(error.code as GameErrorCode)
    }));
    
    // Show reconnection progress for connection errors
    if ([GameErrorCode.CONNECTION_LOST, GameErrorCode.CONNECTION_TIMEOUT].includes(error.code as GameErrorCode)) {
      setAppState(prev => ({
        ...prev,
        showReconnectionProgress: true,
        reconnectionAttempt: 1
      }));
    }
  }, []);

  const hostGame = async (playerName: string) => {
    console.log('hostGame called with playerName:', playerName);
    try {
      setAppState(prev => ({ 
        ...prev, 
        playerName, 
        isConnecting: true, 
        error: '',
        connectionStatus: 'connecting'
      }));

      console.log('Creating GameManager...');
      const tieBreakerCallbacks: TieBreakerCallbacks = {
        onTieDetected: handleTieDetected,
        onTieResolved: handleTieResolved
      };
      
      const gameManager = new SocketGameManager(handleGameStateChange, tieBreakerCallbacks);
      
      // Set up error handling
      gameManager.onError(handleGameError);
      
      console.log('Calling hostGame...');
      const roomCode = await gameManager.hostGame(playerName);
      console.log('Host game successful, roomCode:', roomCode);

      setAppState(prev => ({
        ...prev,
        gameManager,
        isHost: true,
        roomCode,
        currentScreen: 'lobby',
        isConnecting: false,
        connectionStatus: 'connected'
      }));
    } catch (error) {
      console.error('Error hosting game:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to host game. Please try again.';
      setAppState(prev => ({
        ...prev,
        error: errorMessage,
        isConnecting: false,
        connectionStatus: 'error'
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
        error: '',
        connectionStatus: 'connecting'
      }));

      const tieBreakerCallbacks: TieBreakerCallbacks = {
        onTieDetected: handleTieDetected,
        onTieResolved: handleTieResolved
      };
      
      const gameManager = new SocketGameManager(handleGameStateChange, tieBreakerCallbacks);
      
      // Set up error handling
      gameManager.onError(handleGameError);
      
      await gameManager.joinGame(appState.playerName, roomCode);

      setAppState(prev => ({
        ...prev,
        gameManager,
        isHost: false,
        roomCode,
        currentScreen: 'lobby',
        isConnecting: false,
        connectionStatus: 'connected'
      }));
    } catch (error) {
      console.error('Error joining game:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join game. Check the room code and try again.';
      setAppState(prev => ({
        ...prev,
        error: errorMessage,
        isConnecting: false,
        connectionStatus: 'error'
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
      error: '',
      showErrorModal: false
    }));
  };

  const handleRetry = () => {
    if (appState.gameManager) {
      // Clear error and attempt to reconnect
      setAppState(prev => ({
        ...prev,
        error: '',
        showErrorModal: false,
        isConnecting: true,
        connectionStatus: 'connecting'
      }));
      
      // Try to reconnect based on current state
      if (appState.isHost) {
        hostGame(appState.playerName);
      } else if (appState.roomCode) {
        joinGame(appState.roomCode);
      }
    }
  };

  const handleReconnect = () => {
    if (appState.gameManager) {
      setAppState(prev => ({
        ...prev,
        showReconnectionProgress: true,
        reconnectionAttempt: 1,
        isConnecting: true,
        connectionStatus: 'connecting'
      }));
      
      // Attempt reconnection
      handleRetry();
    }
  };

  const handleCancelReconnection = () => {
    setAppState(prev => ({
      ...prev,
      showReconnectionProgress: false,
      reconnectionAttempt: 0,
      isConnecting: false
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
    
    // Only call resolveTiebreaker if this is a manual selection (no server-determined winning word)
    if (appState.gameManager && !appState.winningWord) {
      console.log('🎲 [APP] Manual tiebreaker resolution, sending to server');
      appState.gameManager.resolveTiebreaker(selectedOption);
    } else {
      console.log('🎲 [APP] Server-resolved tiebreaker, no need to send to server');
    }
    
    // Hide the modal
    setAppState(prev => ({
      ...prev,
      showTieBreaker: false,
      tiedOptions: [],
      winningWord: '' // Reset winning word
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
    const mockGameState: GameState = {
      roomCode: 'TEST123',
      isConnected: true,
      connectionStatus: 'connected',
      players: [
        { id: '1', name: 'Test Player 1', isHost: false, isConnected: true, hasVoted: true, hasSubmittedDrawing: false, score: 0 },
        { id: '2', name: 'Test Player 2', isHost: false, isConnected: true, hasVoted: true, hasSubmittedDrawing: false, score: 0 }
      ],
      currentPlayer: null,
      hostId: '1',
      playerCount: 2,
      maxPlayers: 8,
      gamePhase: 'voting',
      wordOptions,
      voteCounts: votes,
      chosenWord: '',
      timeRemaining: 0,
      drawingTimeLimit: 60,
      submittedDrawings: 0,
      results: []
    };
    
    setAppState(prev => ({
      ...prev,
      gameState: mockGameState,
      currentScreen: 'voting'
    }));
  };

  const simulateGameStart = (word: string) => {
    console.log('🧪 [APP] Simulating game start with word:', word);
    const mockGameState: GameState = {
      roomCode: 'TEST123',
      isConnected: true,
      connectionStatus: 'connected',
      players: [
        { id: '1', name: 'Test Player 1', isHost: false, isConnected: true, hasVoted: true, hasSubmittedDrawing: false, score: 0 },
        { id: '2', name: 'Test Player 2', isHost: false, isConnected: true, hasVoted: true, hasSubmittedDrawing: false, score: 0 }
      ],
      currentPlayer: null,
      hostId: '1',
      playerCount: 2,
      maxPlayers: 8,
      gamePhase: 'drawing',
      wordOptions: [],
      voteCounts: {},
      chosenWord: word,
      timeRemaining: 60,
      drawingTimeLimit: 60,
      submittedDrawings: 0,
      results: []
    };
    
    setAppState(prev => ({
      ...prev,
      gameState: mockGameState,
      currentScreen: 'game'
    }));
  };

  const renderCurrentScreen = () => {
    console.log('Rendering screen:', appState.currentScreen, 'isHost:', appState.isHost, 'roomCode:', appState.roomCode);
    switch (appState.currentScreen) {
      case 'start':
        return <StartScreen 
          onHostGame={hostGame} 
          onJoinGame={showJoinGame} 
          error={appState.error}
          onClearError={clearError}
          isConnecting={appState.isConnecting}
          connectionStatus={appState.connectionStatus}
        />;
      case 'join':
        return (
          <JoinGameScreen
            playerName={appState.playerName}
            onJoinGame={joinGame}
            onBack={backToStart}
            error={appState.error}
            onClearError={clearError}
            isConnecting={appState.isConnecting}
          />
        );
      case 'lobby':
        return (
          <LobbyScreen
            players={appState.gameState?.players || []}
            canStart={(appState.gameState?.playerCount || 0) >= 2 && appState.isHost}
            onStartVoting={startVoting}
            isHost={appState.isHost}
            roomCode={appState.roomCode}
            isConnected={appState.gameState?.isConnected || false}
            connectionStatus={appState.connectionStatus}
            error={appState.gameState?.lastError || null}
            isStarting={appState.isConnecting && appState.gameState?.gamePhase === 'lobby'}
          />
        );
      case 'voting':
        if (!appState.gameState) return null;
        return (
          <VotingScreen
            wordOptions={appState.gameState.wordOptions}
            votes={appState.gameState.voteCounts}
            onVote={voteForWord}
            isConnected={appState.gameState.isConnected}
            connectionStatus={appState.connectionStatus}
            error={appState.gameState.lastError}
            playerCount={appState.gameState.playerCount}
            playersVoted={Object.values(appState.gameState.voteCounts).reduce((sum, count) => sum + count, 0)}
          />
        );
      case 'game':
        if (!appState.gameState) return null;
        return (
          <GameScreen
            word={appState.gameState.chosenWord}
            timeRemaining={appState.gameState.timeRemaining}
            onDrawingComplete={async (canvasData) => {
              if (appState.gameManager) {
                return appState.gameManager.submitDrawing(canvasData);
              }
            }}
            onFinishDrawing={() => {
              if (appState.gameManager) {
                appState.gameManager.finishDrawing();
              }
            }}
            playersFinished={[]} // Will implement this later
            currentPlayerId={appState.gameManager?.getCurrentPlayer()?.id}
            isConnected={appState.gameState.isConnected}
            connectionStatus={appState.connectionStatus}
            error={appState.gameState.lastError}
            playerCount={appState.gameState.playerCount}
            submittedDrawings={appState.gameState.submittedDrawings}
          />
        );
      case 'results':
        if (!appState.gameState) return null;
        return (
          <div className="results-screen">
            <h2>AI Judging Results!</h2>
            <div className="results-container">
              {appState.gameState.results.map((result, index) => (
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
            <button onClick={() => {
              if (appState.gameManager) {
                appState.gameManager.destroy();
              }
              setAppState(prev => ({ 
                ...prev, 
                currentScreen: 'start', 
                gameManager: null, 
                gameState: null,
                connectionStatus: 'disconnected'
              }));
            }}>
              New Game
            </button>
          </div>
        );
              default:
        return <StartScreen 
          onHostGame={hostGame} 
          onJoinGame={showJoinGame} 
          error={appState.error}
          onClearError={clearError}
        />;
    }
  };

  return (
    <div className="App">
      <div className="overlay"></div>
      
      {/* Connection Status Indicator - Only show when there's an active game */}
      {appState.gameManager && (
        <ConnectionStatus
          connectionStatus={appState.connectionStatus}
          error={appState.gameState?.lastError || null}
          onRetry={handleRetry}
          className="connection-status-fixed"
        />
      )}
      
      {renderCurrentScreen()}
      
      {/* Modals */}
      <TieBreakerModal
        show={appState.showTieBreaker}
        onHide={() => {}} // Modal cannot be closed manually during tie breaking
        tiedOptions={appState.tiedOptions}
        winningWord={appState.winningWord}
        onSelectionComplete={handleTieSelectionComplete}
      />

      <ErrorModal
        show={appState.showErrorModal}
        error={appState.gameState?.lastError || null}
        onHide={clearError}
        onRetry={handleRetry}
        onReconnect={handleReconnect}
        isRetrying={appState.isConnecting}
        isReconnecting={appState.showReconnectionProgress}
      />

      <ReconnectionProgress
        show={appState.showReconnectionProgress}
        attempt={appState.reconnectionAttempt}
        maxAttempts={appState.maxReconnectionAttempts}
        nextAttemptIn={appState.nextAttemptIn}
        onCancel={handleCancelReconnection}
        onRetryNow={handleRetry}
        error={appState.error}
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
