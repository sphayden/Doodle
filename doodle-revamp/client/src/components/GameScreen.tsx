import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Canvas, PencilBrush, Rect } from 'fabric';
import { Alert, Spinner } from 'react-bootstrap';
import { GameError } from '../interfaces';
import './GameScreen.css';

interface GameScreenProps {
  word: string;
  timeRemaining: number;
  onDrawingComplete?: (canvasData: string) => void;
  onFinishDrawing?: () => void;
  playersFinished?: string[];
  currentPlayerId?: string;
  isConnected?: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: GameError | null;
  playerCount?: number;
  submittedDrawings?: number;
}

const GameScreen: React.FC<GameScreenProps> = ({ 
  word, 
  timeRemaining, 
  onDrawingComplete,
  onFinishDrawing,
  playersFinished = [],
  currentPlayerId,
  isConnected = true,
  connectionStatus = 'connected',
  error = null,
  playerCount = 0,
  submittedDrawings = 0
}) => {
  const [timeLeft, setTimeLeft] = useState(timeRemaining);
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [isFinished, setIsFinished] = useState(false);
  // const [toolsVisible, setToolsVisible] = useState(true); // Reserved for future use
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      // Get container size for responsive canvas
      const container = canvasRef.current.parentElement;
      const containerWidth = container?.clientWidth || 800;
      const containerHeight = container?.clientHeight || 600;
      
      // Calculate canvas size to use most of the available space
      const canvasWidth = containerWidth - 60; // Leave small margin
      const canvasHeight = containerHeight - 60; // Leave small margin

      const canvas = new Canvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: '#ffffff',
        isDrawingMode: true,
        selection: false,
        preserveObjectStacking: true,
        allowTouchScrolling: false,
        imageSmoothingEnabled: true,
        enableRetinaScaling: true,
        devicePixelRatio: window.devicePixelRatio || 1,
        renderOnAddRemove: true,
        skipTargetFind: true
      });

      fabricCanvasRef.current = canvas;

      // Set initial brush settings with explicit brush creation
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.shadow = null; // Remove shadow for better performance
      
      // Ensure drawing mode is properly enabled
      canvas.isDrawingMode = true;
      
      // Remove any default borders/grid lines and prevent layering issues
      canvas.selectionColor = 'transparent';
      canvas.selectionBorderColor = 'transparent';
      canvas.selectionLineWidth = 0;
      canvas.uniformScaling = false;
      
      // Ensure single unified canvas appearance
      if (canvas.wrapperEl && canvas.wrapperEl.style) {
        canvas.wrapperEl.style.position = 'relative';
        canvas.wrapperEl.style.width = canvasWidth + 'px';
        canvas.wrapperEl.style.height = canvasHeight + 'px';
      }
      
      // Fix cursor positioning issues
      if (typeof canvas.calcOffset === 'function') {
        canvas.calcOffset();
      }
      
      // Ensure smooth rendering
      if (typeof canvas.renderAll === 'function') {
        canvas.renderAll();
      }
      
      console.log('Canvas initialized:', {
        width: canvasWidth,
        height: canvasHeight,
        isDrawingMode: canvas.isDrawingMode,
        brushWidth: canvas.freeDrawingBrush.width,
        brushColor: canvas.freeDrawingBrush.color
      });

      // Handle drawing events for debugging and future features
      if (typeof canvas.on === 'function') {
        canvas.on('path:created', (e) => {
          console.log('Path created and saved:', e);
          // Force render to ensure path is visible
          if (typeof canvas.renderAll === 'function') {
            canvas.renderAll();
          }
          // Future: Send stroke data to other players for real-time viewing
        });
        
        canvas.on('mouse:down', (e) => {
          console.log('Mouse down on canvas at:', e.pointer);
        });
        
        canvas.on('mouse:move', (e) => {
          if (canvas.isDrawingMode && e.pointer) {
            console.log('Drawing at:', e.pointer);
          }
        });
        
        canvas.on('mouse:up', () => {
          console.log('Mouse up on canvas');
          // Force render after drawing
          if (typeof canvas.renderAll === 'function') {
            canvas.renderAll();
          }
        });
      }

      return () => {
        if (typeof canvas.dispose === 'function') {
          canvas.dispose();
        }
        fabricCanvasRef.current = null;
      };
    }
  }, []);  // Canvas initialization only happens once

  // Update brush settings when they change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (fabricCanvasRef.current) {
      if (!fabricCanvasRef.current.freeDrawingBrush) {
        fabricCanvasRef.current.freeDrawingBrush = new PencilBrush(fabricCanvasRef.current);
      }
      fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
      fabricCanvasRef.current.freeDrawingBrush.color = brushColor;
      fabricCanvasRef.current.isDrawingMode = true;
      
      // Recalculate offsets to ensure cursor accuracy
      if (typeof fabricCanvasRef.current.calcOffset === 'function') {
        fabricCanvasRef.current.calcOffset();
      }
      
      console.log('Brush updated:', {
        width: brushSize,
        color: brushColor,
        isDrawingMode: fabricCanvasRef.current.isDrawingMode
      });
    }
  }, [brushSize, brushColor]);

  // Recalculate canvas offsets after component mounts and DOM settles
  useEffect(() => {
    const recalcOffsets = () => {
      if (fabricCanvasRef.current) {
        setTimeout(() => {
          fabricCanvasRef.current?.calcOffset();
          console.log('Canvas offsets recalculated for cursor accuracy');
        }, 100);
      }
    };

    recalcOffsets();
    window.addEventListener('scroll', recalcOffsets);
    return () => window.removeEventListener('scroll', recalcOffsets);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (fabricCanvasRef.current && canvasRef.current) {
        const container = canvasRef.current.parentElement;
        const containerWidth = container?.clientWidth || 800;
        const containerHeight = container?.clientHeight || 600;
        
        const canvasWidth = containerWidth - 60;
        const canvasHeight = containerHeight - 60;

        if (typeof fabricCanvasRef.current.setDimensions === 'function') {
          fabricCanvasRef.current.setDimensions({
            width: canvasWidth,
            height: canvasHeight
          });
        }
        
        // Recalculate offsets after resize to fix cursor position
        if (typeof fabricCanvasRef.current.calcOffset === 'function') {
          fabricCanvasRef.current.calcOffset();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Finish drawing function (defined before timer effect to avoid dependency issues)
  const handleFinishDrawing = useCallback(async () => {
    if (fabricCanvasRef.current && onDrawingComplete && !isSubmitting) {
      setIsSubmitting(true);
      
      try {
        const canvasData = typeof fabricCanvasRef.current.toDataURL === 'function' 
          ? fabricCanvasRef.current.toDataURL({
            format: 'png',
            quality: 0.8,
            multiplier: 1
          })
          : 'data:image/png;base64,mock-canvas-data';
        
        await onDrawingComplete(canvasData);
        setIsFinished(true);
        
        if (onFinishDrawing) {
          onFinishDrawing();
        }
      } catch (error) {
        console.error('Failed to submit drawing:', error);
        setIsSubmitting(false);
      }
    }
  }, [onDrawingComplete, onFinishDrawing, isSubmitting]);

  // Set up global auto-submit function for server-triggered auto-submit
  useEffect(() => {
    console.log('🔥 Setting up GameScreen auto-submit function');
    (window as any).gameScreenAutoSubmit = () => {
      console.log('🔥 GameScreen auto-submit called!');
      console.log('🔥 isFinished:', isFinished, 'isSubmitting:', isSubmitting);
      console.log('🔥 fabricCanvasRef.current:', !!fabricCanvasRef.current);
      console.log('🔥 onDrawingComplete:', !!onDrawingComplete);
      
      if (!isFinished && !isSubmitting) {
        console.log('🔥 Conditions met, calling handleFinishDrawing...');
        handleFinishDrawing();
      } else {
        console.warn('🔥 Auto-submit conditions not met!');
      }
    };

    // Cleanup on unmount
    return () => {
      console.log('🔥 Cleaning up GameScreen auto-submit function');
      delete (window as any).gameScreenAutoSubmit;
    };
  }, [handleFinishDrawing, isFinished, isSubmitting, onDrawingComplete]);

  // Timer effect
  useEffect(() => {
    setTimeLeft(timeRemaining);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit drawing when timer expires
          if (!isFinished && !isSubmitting && fabricCanvasRef.current && onDrawingComplete) {
            console.log('⏰ Timer expired, auto-submitting drawing...');
            handleFinishDrawing();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isFinished, isSubmitting, onDrawingComplete, handleFinishDrawing]);

  // Clear canvas
  const clearCanvas = () => {
    if (fabricCanvasRef.current) {
      if (typeof fabricCanvasRef.current.clear === 'function') {
        fabricCanvasRef.current.clear();
      }
      fabricCanvasRef.current.backgroundColor = '#ffffff';
      if (typeof fabricCanvasRef.current.renderAll === 'function') {
        fabricCanvasRef.current.renderAll();
      }
      // Recalculate offsets after clearing
      if (typeof fabricCanvasRef.current.calcOffset === 'function') {
        fabricCanvasRef.current.calcOffset();
      }
      console.log('Canvas cleared');
    }
  };





  // Color options
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
  ];

  // Brush sizes
  const brushSizes = [2, 5, 10, 15, 20];

  const getTimeStyle = () => {
    if (timeLeft <= 5) return 'text-danger timer-critical';
    if (timeLeft <= 10) return 'text-danger';
    if (timeLeft <= 20) return 'text-warning';
    return 'text-success';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="screen-container">
      <div className="game-header">
        <div className="header-content">
          <div className="timer-section">
            <h3>Time Remaining:</h3>
            <span className={`timer ${getTimeStyle()}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          
          <div className="word-section">
            <h2>Draw: <span className="word">{word}</span></h2>
            {timeLeft <= 10 && timeLeft > 0 && !isFinished && (
              <div className="time-warning">
                <small className="text-danger">
                  ⚠️ {timeLeft <= 5 ? 'Drawing will auto-submit in' : 'Time running out!'} {timeLeft}s
                </small>
              </div>
            )}
          </div>
          
          <div className="status-section">
            <div className="player-status">
              {submittedDrawings > 0 && playerCount > 0 && (
                <div className="finished-players">
                  <span>Submitted: {submittedDrawings}/{playerCount}</span>
                </div>
              )}
              
              {/* Connection Status */}
              {connectionStatus !== 'connected' && (
                <div className="connection-status">
                  {connectionStatus === 'connecting' && (
                    <span className="text-warning">
                      <Spinner size="sm" className="me-1" />
                      Reconnecting...
                    </span>
                  )}
                  {connectionStatus === 'disconnected' && (
                    <span className="text-danger">Disconnected</span>
                  )}
                  {connectionStatus === 'error' && (
                    <span className="text-danger">Connection Error</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="game-content">
        {/* Error Display */}
        {error && (
          <Alert variant="danger" className="game-error-alert">
            <strong>Error:</strong> {error.message}
            {error.recoverable && (
              <div className="mt-2">
                <small>The game will attempt to recover automatically.</small>
              </div>
            )}
          </Alert>
        )}
        
        <div className="canvas-container">
          <canvas 
            ref={canvasRef}
            className={`drawing-canvas ${isFinished ? 'finished' : ''} ${!isConnected ? 'disconnected' : ''}`}
          />
          
          {(isFinished || isSubmitting) && (
            <div className="canvas-overlay">
              <div className="finished-message">
                {isSubmitting ? (
                  <>
                    <Spinner animation="border" className="mb-3" />
                    <h3>Submitting Drawing...</h3>
                    <p>Please wait while we save your masterpiece!</p>
                  </>
                ) : (
                  <>
                    <h3>Drawing Complete!</h3>
                    <p>Waiting for other players...</p>
                    {submittedDrawings > 0 && playerCount > 0 && (
                      <p className="submission-progress">
                        {submittedDrawings}/{playerCount} players finished
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          
          {!isConnected && !isFinished && (
            <div className="canvas-overlay disconnected-overlay">
              <div className="disconnected-message">
                <Spinner animation="border" variant="warning" className="mb-3" />
                <h3>Connection Lost</h3>
                <p>Attempting to reconnect...</p>
                <small>Your drawing is safe and will be submitted when reconnected.</small>
              </div>
            </div>
          )}
        </div>

        <div className="tools-panel">
          <div className="tool-section">
            <h4>Colors</h4>
            <div className="color-palette">
              {colors.map(color => (
                <button
                  key={color}
                  className={`color-btn ${brushColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setBrushColor(color)}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="tool-section">
            <h4>Brush Size</h4>
            <div className="brush-sizes">
              {brushSizes.map(size => (
                <button
                  key={size}
                  className={`brush-btn ${brushSize === size ? 'active' : ''}`}
                  onClick={() => setBrushSize(size)}
                  title={`Size ${size}`}
                >
                  <div 
                    className="brush-preview"
                    style={{ 
                      width: size, 
                      height: size, 
                      backgroundColor: brushColor 
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="tool-section">
            <h4>Tools</h4>
            <div className="tool-buttons">
              <button 
                className="tool-btn clear-btn"
                onClick={clearCanvas}
                disabled={isFinished || isSubmitting || !isConnected}
                title={!isConnected ? 'Reconnecting...' : 'Clear canvas'}
              >
                🗑️ Clear
              </button>
              

              <button 
                className="tool-btn finish-btn"
                onClick={handleFinishDrawing}
                disabled={isFinished || isSubmitting || !isConnected}
                title={!isConnected ? 'Reconnecting...' : 'Submit your drawing'}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="me-1" />
                    Submitting...
                  </>
                ) : (
                  '✅ Finish Drawing'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Space */}
      <div className="game-footer">
        <div className="footer-content">
          <span>Draw "{word}" • Time: {formatTime(timeLeft)}</span>
        </div>
      </div>
    </div>
  );
};

export default GameScreen; 