import React, { useState, useEffect, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import './TieBreakerModal.css';

interface TieBreakerModalProps {
  show: boolean;
  onHide: () => void;
  tiedOptions: string[];
  winningWord?: string; // Optional server-determined winning word
  onSelectionComplete: (selectedOption: string) => void;
}

const SEGMENT_COLORS = [
  '#FFD600', '#FF6D00', '#DD2C00', '#00B8D4', '#00C853', '#AEEA00',
  '#D500F9', '#304FFE', '#C51162', '#FF1744', '#00BFAE', '#FFAB00',
  '#FF5722', '#9C27B0', '#3F51B5', '#2196F3', '#03DAC6', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFEB3B', '#FF9800', '#795548', '#607D8B',
  '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#00BCD4',
  '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107',
  '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B', '#FF4081',
  '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
  '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740'
];

const WHEEL_SIZE = 340;
const RADIUS = WHEEL_SIZE / 2 - 10;
const CENTER = WHEEL_SIZE / 2;
const POINTER_SIZE = 32;

// Improved deterministic color assignment based on word content
function getColorForWord(word: string, usedColors: Set<string> = new Set()): string {
  // Create a more robust hash
  let hash = 0;
  const prime = 31;
  
  for (let i = 0; i < word.length; i++) {
    const char = word.charCodeAt(i);
    hash = (hash * prime + char) >>> 0; // Use unsigned 32-bit arithmetic
  }
  
  // Try to find a unique color
  for (let attempt = 0; attempt < SEGMENT_COLORS.length; attempt++) {
    const colorIndex = (hash + attempt) % SEGMENT_COLORS.length;
    const color = SEGMENT_COLORS[colorIndex];
    
    // If this color hasn't been used yet, use it
    if (!usedColors.has(color)) {
      return color;
    }
  }
  
  // Fallback: if all colors are used, generate a unique color
  const hue = (hash % 360);
  const saturation = 70 + (hash % 30); // 70-100%
  const lightness = 50 + (hash % 20); // 50-70%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getSegmentPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = (Math.PI / 180) * startAngle;
  const end = (Math.PI / 180) * endAngle;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${x1} ${y1}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
    'Z',
  ].join(' ');
}

const TieBreakerModal: React.FC<TieBreakerModalProps> = ({
  show,
  onHide,
  tiedOptions,
  winningWord,
  onSelectionComplete
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Animate the spin
  const animate = (
    ts: number,
    start: number,
    duration: number,
    initialRotation: number,
    finalAngle: number,
    winner: number
  ) => {
    const elapsed = ts - start;
    const t = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const current = initialRotation + ease * (finalAngle - initialRotation);
    setRotation(current);
    if (t < 1) {
      animationRef.current = requestAnimationFrame((nextTs) => animate(nextTs, start, duration, initialRotation, finalAngle, winner));
    } else {
      setIsSpinning(false);
      setHasSpun(true);
      setTimeout(() => {
        onSelectionComplete(tiedOptions[winner]);
      }, 1800);
    }
  };

  useEffect(() => {
    if (show && tiedOptions.length > 0) {
      setIsSpinning(true);
      setHasSpun(false);
      // Use server-determined winning word if provided, otherwise fall back to random
      let winner: number;
      if (winningWord) {
        winner = tiedOptions.indexOf(winningWord);
        if (winner === -1) {
          console.error('Winning word not found in tied options:', winningWord, tiedOptions);
          return;
        }
      } else {
        // Fallback to random selection for backward compatibility
        winner = Math.floor(Math.random() * tiedOptions.length);
      }
      setSelectedIndex(winner);
      const spins = 5;
      const anglePerSegment = 360 / tiedOptions.length;
      const finalAngle = 360 * spins + (360 - (winner * anglePerSegment) - anglePerSegment / 2 - 90);
      let duration = 4000 + Math.random() * 1000;
      setRotation(0);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      const start = performance.now();
      animationRef.current = requestAnimationFrame((ts) => animate(ts, start, duration, 0, finalAngle, winner));
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line
  }, [show, tiedOptions, winningWord]);

  // Draw segments and radial text
  const anglePerSegment = 360 / tiedOptions.length;
  const usedColors = new Set<string>();
  const segments = tiedOptions.map((option, i) => {
    const startAngle = i * anglePerSegment;
    const endAngle = (i + 1) * anglePerSegment;
    const path = getSegmentPath(CENTER, CENTER, RADIUS, startAngle, endAngle);
    const color = getColorForWord(option, usedColors);
    usedColors.add(color); // Track this color as used
    const midAngle = startAngle + anglePerSegment / 2;

    // Calculate centroid for text placement (center of the segment)
    const centroidRadius = RADIUS * 0.6; // Position text at 60% of radius
    const x = CENTER + centroidRadius * Math.cos((Math.PI / 180) * midAngle);
    const y = CENTER + centroidRadius * Math.sin((Math.PI / 180) * midAngle);
    
    return { path, color, text: option, i };
  });

  // Pointer triangle at the top
  const pointer = (
    <polygon
      points={`${CENTER - POINTER_SIZE / 2},10 ${CENTER + POINTER_SIZE / 2},10 ${CENTER},${POINTER_SIZE + 10}`}
      fill={!isSpinning && hasSpun ? "#FFD700" : "#222"}
      stroke="#fff"
      strokeWidth={!isSpinning && hasSpun ? "4" : "3"}
      style={{ 
        filter: !isSpinning && hasSpun 
          ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))' 
          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        transition: 'all 0.3s ease'
      }}
    />
  );

  return (
    <Modal
      show={show}
      onHide={onHide}
      backdrop="static"
      keyboard={false}
      centered
      size="lg"
      className="tie-breaker-modal"
    >
      <Modal.Header className="text-center border-0">
        <Modal.Title className="w-100">
          <h2 className="mb-0">🎲 Tie Breaker! 🎲</h2>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <div className="tie-breaker-content">
          <div style={{ 
            position: 'relative',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {/* Legend positioned absolutely to the left */}
            <div className="wheel-legend" style={{ 
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              textAlign: 'left',
              padding: '10px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              minWidth: '120px',
              zIndex: 10
            }}>
              <h6 style={{ color: 'white', marginBottom: '10px', fontSize: '14px' }}>Options:</h6>
              {segments.map(seg => (
                <div 
                  key={seg.i} 
                  style={{ 
                    display: 'block', 
                    margin: '4px 0',
                    padding: '4px 8px',
                    backgroundColor: seg.color,
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                    boxShadow: !isSpinning && hasSpun && seg.i === selectedIndex 
                      ? '0 2px 8px rgba(255,255,255,0.6), 0 0 15px rgba(255,255,255,0.4)' 
                      : '0 1px 4px rgba(0,0,0,0.3)',
                    transform: !isSpinning && hasSpun && seg.i === selectedIndex ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.3s ease',
                    border: !isSpinning && hasSpun && seg.i === selectedIndex 
                      ? '2px solid rgba(255,255,255,0.8)' 
                      : 'none'
                  }}
                >
                  {seg.text}
                  {!isSpinning && hasSpun && seg.i === selectedIndex && ' 🎉'}
                </div>
              ))}
            </div>
            
            {/* Centered wheel */}
            <div style={{ position: 'relative', width: WHEEL_SIZE, height: WHEEL_SIZE, display: 'block' }}>
              <svg
                width="100%"
                height="100%"
                style={{ display: 'block', transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'none' : 'transform 0.5s' }}
              >
                {segments.map(seg => (
                  <g key={seg.i}>
                    <path 
                      d={seg.path} 
                      fill={seg.color} 
                      stroke="#fff" 
                      strokeWidth={!isSpinning && hasSpun && seg.i === selectedIndex ? "4" : "2"}
                      style={{
                        filter: !isSpinning && hasSpun && seg.i === selectedIndex 
                          ? 'brightness(1.3) drop-shadow(0 0 15px rgba(255, 255, 255, 0.8))' 
                          : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </g>
                ))}
              </svg>
              {/* Pointer overlay */}
              <svg
                width="100%"
                height={POINTER_SIZE + 20}
                style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', display: 'block' }}
              >
                {pointer}
              </svg>
            </div>
          </div>
          <div className="tie-breaker-info mt-4">
            {isSpinning ? (
              <div className="spinning-message">
                <h4 className="text-info">
                  <span className="spinning-icon">⚡</span>
                  Spinning the wheel...
                </h4>
                <p className="text-muted">Randomly selecting from tied options</p>
              </div>
            ) : hasSpun ? (
              <div className="result-message">
                <h4 className="text-success">
                  <span className="celebration-icon">🎉</span>
                  Selected!
                </h4>
                <p className="text-primary fs-5 fw-bold">
                  "{tiedOptions[selectedIndex]}" wins!
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default TieBreakerModal; 