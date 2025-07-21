import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Alert } from 'react-bootstrap';

interface TestUtilsProps {
  onSimulateTie: (tiedOptions: string[]) => void;
  onSimulateVoting: (wordOptions: string[], votes: { [word: string]: number }) => void;
  onSimulateGameStart: (word: string) => void;
}

// Word bank for random word selection
const WORD_BANK = [
  'Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew',
  'Cat', 'Dog', 'Elephant', 'Fox', 'Giraffe', 'Hippo', 'Iguana', 'Jaguar',
  'House', 'Car', 'Tree', 'Boat', 'Plane', 'Train', 'Bicycle', 'Rocket',
  'Sun', 'Moon', 'Star', 'Cloud', 'Rain', 'Snow', 'Wind', 'Storm',
  'Book', 'Chair', 'Table', 'Lamp', 'Bed', 'Sofa', 'Clock', 'Phone',
  'Flower', 'Mountain', 'River', 'Rainbow', 'Cake', 'Guitar', 'Piano', 'Camera',
  'Computer', 'Airplane', 'Bus', 'Lion', 'Tiger', 'Bear', 'Rabbit', 'Butterfly',
  'Dragon', 'Castle', 'Bridge', 'Lighthouse', 'Robot'
];

// Function to get random words from the word bank
const getRandomWords = (count: number): string[] => {
  const shuffled = [...WORD_BANK].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const TestUtils: React.FC<TestUtilsProps> = ({
  onSimulateTie,
  onSimulateVoting,
  onSimulateGameStart
}) => {
  const [showTestPanel, setShowTestPanel] = useState(false);

  const simulateTieScenario = useCallback((options?: string[]) => {
    const tiedOptions = options || getRandomWords(3);
    console.log('🧪 [TEST] Simulating tie scenario with options:', tiedOptions);
    onSimulateTie(tiedOptions);
  }, [onSimulateTie]);

  const simulateVotingScenario = useCallback(() => {
    const wordOptions = getRandomWords(4);
    const votes: { [word: string]: number } = {};
    votes[wordOptions[0]] = 2; // Tie
    votes[wordOptions[1]] = 2; // Tie
    votes[wordOptions[2]] = 1;
    votes[wordOptions[3]] = 0;
    console.log('🧪 [TEST] Simulating voting scenario:', { wordOptions, votes });
    onSimulateVoting(wordOptions, votes);
  }, [onSimulateVoting]);

  const simulateGameStart = useCallback(() => {
    const word = getRandomWords(1)[0];
    console.log('🧪 [TEST] Simulating game start with word:', word);
    onSimulateGameStart(word);
  }, [onSimulateGameStart]);

  const quickTestTie = useCallback((options?: string[]) => {
    simulateTieScenario(options);
    setShowTestPanel(false);
  }, [simulateTieScenario]);

  // Expose test functions to the window for console/test-page access
  useEffect(() => {
    (window as any).quickTestTie = quickTestTie;
    (window as any).simulateTie = simulateTieScenario;
    (window as any).simulateVoting = simulateVotingScenario;
    (window as any).simulateGameStart = simulateGameStart;
    return () => {
      delete (window as any).quickTestTie;
      delete (window as any).simulateTie;
      delete (window as any).simulateVoting;
      delete (window as any).simulateGameStart;
    };
  }, [quickTestTie, simulateGameStart, simulateTieScenario, simulateVotingScenario]);

  return (
    <>
      {/* Test Panel Toggle Button */}
      <div 
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          background: 'rgba(0,0,0,0.8)',
          padding: '10px',
          borderRadius: '8px',
          border: '2px solid #007bff'
        }}
      >
        <Button
          variant="outline-info"
          size="sm"
          onClick={() => setShowTestPanel(!showTestPanel)}
          style={{ fontSize: '12px' }}
        >
          🧪 Test Mode
        </Button>
      </div>

      {/* Test Panel Modal */}
      <Modal
        show={showTestPanel}
        onHide={() => setShowTestPanel(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>🧪 Development Test Panel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Quick Testing Tools</strong><br />
            Use these buttons to quickly test different scenarios without manually setting up games.
          </Alert>

          <div className="mb-4">
            <h5>🎲 Tie Breaker Tests</h5>
            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                onClick={() => quickTestTie()}
                size="lg"
              >
                🎯 Quick Tie Test (3 options)
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={() => simulateTieScenario()}
              >
                🎲 Simulate Tie Detection
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <h5>🗳️ Voting Tests</h5>
            <div className="d-grid gap-2">
              <Button 
                variant="success" 
                onClick={simulateVotingScenario}
              >
                📊 Simulate Voting with Tie
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <h5>🎮 Game Tests</h5>
            <div className="d-grid gap-2">
              <Button 
                variant="warning" 
                onClick={simulateGameStart}
              >
                🎨 Simulate Game Start
              </Button>
            </div>
          </div>

          <Alert variant="warning">
            <strong>Note:</strong> These tests simulate the game state directly. 
            Make sure you're in the appropriate screen for the best testing experience.
          </Alert>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default TestUtils; 