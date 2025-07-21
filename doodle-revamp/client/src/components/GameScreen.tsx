import React, { useEffect, useState, useRef } from 'react';
import { Canvas, PencilBrush, Rect } from 'fabric';
import './GameScreen.css';

interface GameScreenProps {
  word: string;
  timeRemaining: number;
  onDrawingComplete?: (canvasData: string) => void;
  onFinishDrawing?: () => void;
  playersFinished?: string[];
  currentPlayerId?: string;
}

const GameScreen: React.FC<GameScreenProps> = ({ 
  word, 
  timeRemaining, 
  onDrawingComplete,
  onFinishDrawing,
  playersFinished = [],
  currentPlayerId
}) => {
  const [timeLeft, setTimeLeft] = useState(timeRemaining);
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [isFinished, setIsFinished] = useState(false);
  const [toolsVisible, setToolsVisible] = useState(true);
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
      canvas.wrapperEl.style.position = 'relative';
      canvas.wrapperEl.style.width = canvasWidth + 'px';
      canvas.wrapperEl.style.height = canvasHeight + 'px';
      
      // Fix cursor positioning issues
      canvas.calcOffset();
      
      // Ensure smooth rendering
      canvas.renderAll();
      
      console.log('Canvas initialized:', {
        width: canvasWidth,
        height: canvasHeight,
        isDrawingMode: canvas.isDrawingMode,
        brushWidth: canvas.freeDrawingBrush.width,
        brushColor: canvas.freeDrawingBrush.color
      });

      // Handle drawing events for debugging and future features
      canvas.on('path:created', (e) => {
        console.log('Path created and saved:', e);
        // Force render to ensure path is visible
        canvas.renderAll();
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
        canvas.renderAll();
      });

      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, []);

  // Update brush settings when they change
  useEffect(() => {
    if (fabricCanvasRef.current) {
      if (!fabricCanvasRef.current.freeDrawingBrush) {
        fabricCanvasRef.current.freeDrawingBrush = new PencilBrush(fabricCanvasRef.current);
      }
      fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
      fabricCanvasRef.current.freeDrawingBrush.color = brushColor;
      fabricCanvasRef.current.isDrawingMode = true;
      
      // Recalculate offsets to ensure cursor accuracy
      fabricCanvasRef.current.calcOffset();
      
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

        fabricCanvasRef.current.setDimensions({
          width: canvasWidth,
          height: canvasHeight
        });
        
        // Recalculate offsets after resize to fix cursor position
        fabricCanvasRef.current.calcOffset();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Timer effect
  useEffect(() => {
    setTimeLeft(timeRemaining);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Clear canvas
  const clearCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = '#ffffff';
      fabricCanvasRef.current.renderAll();
      // Recalculate offsets after clearing
      fabricCanvasRef.current.calcOffset();
      console.log('Canvas cleared');
    }
  };

  // Test drawing function
  const testDrawing = () => {
    if (fabricCanvasRef.current) {
      console.log('Testing canvas drawing capability...');
      
      // Add a test rectangle to verify canvas is working
      const rect = new Rect({
        left: 100,
        top: 100,
        width: 50,
        height: 50,
        fill: 'red'
      });
      
      fabricCanvasRef.current.add(rect);
      fabricCanvasRef.current.renderAll();
      
      console.log('Test rectangle added - if you see a red square, canvas is working');
    }
  };

  // Finish drawing
  const handleFinishDrawing = () => {
    if (fabricCanvasRef.current && onDrawingComplete) {
      const canvasData = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 1
      });
      onDrawingComplete(canvasData);
      setIsFinished(true);
      if (onFinishDrawing) {
        onFinishDrawing();
      }
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
          </div>
          
          <div className="status-section">
            <div className="player-status">
              {playersFinished.length > 0 && (
                <div className="finished-players">
                  <span>Finished: {playersFinished.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="game-content">
        <div className="canvas-container">
          <canvas 
            ref={canvasRef}
            className={`drawing-canvas ${isFinished ? 'finished' : ''}`}
          />
          
          {isFinished && (
            <div className="canvas-overlay">
              <div className="finished-message">
                <h3>Drawing Complete!</h3>
                <p>Waiting for other players...</p>
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
                disabled={isFinished}
              >
                🗑️ Clear
              </button>
              
              <button 
                className="tool-btn test-btn"
                onClick={testDrawing}
                style={{ background: '#ffc107', color: '#000' }}
              >
                🧪 Test Canvas
              </button>
              
              <button 
                className="tool-btn finish-btn"
                onClick={handleFinishDrawing}
                disabled={isFinished}
              >
                ✅ Finish Drawing
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