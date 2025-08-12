/**
 * DevTools Component - React component providing a developer panel
 * for testing and debugging the Doodle game. Includes tools for
 * simulating game states, testing multiplayer scenarios, and debugging.
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Form, Alert, Tabs, Tab, Badge } from 'react-bootstrap';
import { DevToolsService, TestResult, ValidationResult, NetworkMessage, GameScenario } from '../services/DevToolsService';
import { GameState } from '../interfaces/GameManager';
import { TEST_SCENARIOS } from '../services/TestScenarios';
import { AutomatedTestRunner, RegressionTestResult, TestSuite } from '../services/AutomatedTestRunner';

interface DevToolsProps {
  show: boolean;
  onHide: () => void;
  devToolsService: DevToolsService;
}

export const DevTools: React.FC<DevToolsProps> = ({ show, onHide, devToolsService }) => {
  const [activeTab, setActiveTab] = useState<string>('simulation');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [networkMessages, setNetworkMessages] = useState<NetworkMessage[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  
  // Automated testing state
  const [testRunner] = useState<AutomatedTestRunner>(() => new AutomatedTestRunner(devToolsService));
  const [regressionResults, setRegressionResults] = useState<RegressionTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedTestSuite, setSelectedTestSuite] = useState<string>('');
  
  // Form states
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [tieWords, setTieWords] = useState<string>('cat,dog,bird');
  const [drawingWord, setDrawingWord] = useState<string>('house');
  const [sessionData, setSessionData] = useState<string>('');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [runningScenario, setRunningScenario] = useState<boolean>(false);

  const refreshGameState = React.useCallback(() => {
    const state = devToolsService.inspectGameState();
    setGameState(state);
  }, [devToolsService]);

  const refreshNetworkMessages = React.useCallback(() => {
    const messages = devToolsService.getNetworkMessages();
    setNetworkMessages(messages);
  }, [devToolsService]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (show) {
      refreshGameState();
      refreshNetworkMessages();
      setTestSuites(testRunner.getTestSuites());
    }
  }, [show, testRunner]);  // Dependencies managed separately to avoid order issues

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const handleSimulateMultiplePlayers = () => {
    devToolsService.simulateMultiplePlayers(playerCount);
    refreshGameState();
    addTestResult({
      success: true,
      message: `Simulated ${playerCount} players`,
      duration: 0
    });
  };

  const handleSimulateVotingTie = () => {
    const words = tieWords.split(',').map(w => w.trim()).filter(w => w);
    devToolsService.simulateVotingTie(words);
    refreshGameState();
    addTestResult({
      success: true,
      message: `Simulated voting tie with words: ${words.join(', ')}`,
      duration: 0
    });
  };

  const handleSimulateNetworkError = () => {
    devToolsService.simulateNetworkError();
    refreshGameState();
    addTestResult({
      success: true,
      message: 'Simulated network error',
      duration: 0
    });
  };

  const handleSimulateDisconnection = () => {
    devToolsService.simulateDisconnection();
    refreshGameState();
    addTestResult({
      success: true,
      message: 'Simulated disconnection',
      duration: 0
    });
  };

  const handleSkipToVoting = () => {
    devToolsService.skipToVoting();
    refreshGameState();
    addTestResult({
      success: true,
      message: 'Skipped to voting phase',
      duration: 0
    });
  };

  const handleSkipToDrawing = () => {
    devToolsService.skipToDrawing(drawingWord);
    refreshGameState();
    addTestResult({
      success: true,
      message: `Skipped to drawing phase with word: ${drawingWord}`,
      duration: 0
    });
  };

  const handleSkipToResults = () => {
    devToolsService.skipToResults();
    refreshGameState();
    addTestResult({
      success: true,
      message: 'Skipped to results phase',
      duration: 0
    });
  };

  const handleRunGameFlowTest = async () => {
    const result = await devToolsService.runGameFlowTest();
    addTestResult(result);
    refreshGameState();
  };

  const handleRunNetworkDegradationTest = async () => {
    addTestResult({
      success: true,
      message: 'Network degradation test - feature coming soon',
      duration: 0
    });
  };

  const handleSimulateConnectionIssues = (severity: 'mild' | 'moderate' | 'severe') => {
    switch (severity) {
      case 'mild':
        devToolsService.simulateNetworkError();
        break;
      case 'moderate':
        devToolsService.simulateDisconnection();
        break;
      case 'severe':
        devToolsService.simulateNetworkError();
        setTimeout(() => devToolsService.simulateDisconnection(), 1000);
        break;
    }
    addTestResult({
      success: true,
      message: `Simulated ${severity} connection issues`,
      duration: 0
    });
  };

  const handleRunNetworkDegradationTest = async () => {
    const result = await devToolsService.simulateNetworkDegradation();
    addTestResult(result);
    refreshGameState();
  };

  const handleSimulateConnectionIssues = (severity: 'mild' | 'moderate' | 'severe') => {
    devToolsService.simulateConnectionIssues(severity);
    refreshGameState();
    addTestResult({
      success: true,
      message: `Simulated ${severity} connection issues`,
      duration: 0
    });
  };

  const handleValidateState = () => {
    const result = devToolsService.validateStateConsistency();
    setValidationResult(result);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      devToolsService.stopRecording();
      setIsRecording(false);
    } else {
      devToolsService.startRecording();
      setIsRecording(true);
    }
    refreshNetworkMessages();
  };

  const handleClearMessages = () => {
    devToolsService.clearMessages();
    refreshNetworkMessages();
  };

  const handleExportSession = () => {
    const data = devToolsService.exportGameSession();
    setSessionData(data);
    
    // Also copy to clipboard
    navigator.clipboard.writeText(data).then(() => {
      addTestResult({
        success: true,
        message: 'Session data exported to clipboard',
        duration: 0
      });
    });
  };

  const handleImportSession = () => {
    const success = devToolsService.importGameSession(sessionData);
    if (success) {
      refreshGameState();
      refreshNetworkMessages();
      addTestResult({
        success: true,
        message: 'Session data imported successfully',
        duration: 0
      });
    } else {
      addTestResult({
        success: false,
        message: 'Failed to import session data',
        duration: 0
      });
    }
  };

  const handleRunScenario = async () => {
    if (!selectedScenario) return;
    
    const scenario = TEST_SCENARIOS.find(s => s.name === selectedScenario);
    if (!scenario) return;

    setRunningScenario(true);
    try {
      const result = await devToolsService.runScenario(scenario);
      addTestResult(result);
      refreshGameState();
    } finally {
      setRunningScenario(false);
    }
  };

  const handleRunTestSuite = async () => {
    if (!selectedTestSuite || isRunningTests) return;

    setIsRunningTests(true);
    try {
      const result = await testRunner.runTestSuite(selectedTestSuite);
      setRegressionResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
      
      // Add individual test results to the main results list
      result.results.forEach(testResult => addTestResult(testResult));
      
      addTestResult({
        success: result.failedTests === 0,
        message: `Test suite "${selectedTestSuite}" completed: ${result.summary}`,
        duration: result.duration,
        details: result
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleRunAllTests = async () => {
    if (isRunningTests) return;

    setIsRunningTests(true);
    try {
      const results = await testRunner.runAllTests();
      setRegressionResults(results);
      
      const totalPassed = results.reduce((sum, r) => sum + r.passedTests, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failedTests, 0);
      const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
      
      addTestResult({
        success: totalFailed === 0,
        message: `Regression test completed: ${totalPassed} passed, ${totalFailed} failed`,
        duration: totalDuration,
        details: results
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleRunScenarioTests = async () => {
    if (isRunningTests) return;

    setIsRunningTests(true);
    try {
      const results = await testRunner.runScenarioTests();
      results.forEach(result => addTestResult(result));
      
      const passed = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      addTestResult({
        success: failed === 0,
        message: `Scenario tests completed: ${passed} passed, ${failed} failed`,
        duration: results.reduce((sum, r) => sum + r.duration, 0),
        details: results
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const renderSimulationTab = () => (
    <div className="p-3">
      <Card className="mb-3">
        <Card.Header>Player Simulation</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Number of Players</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="8"
              value={playerCount}
              onChange={(e) => setPlayerCount(parseInt(e.target.value) || 2)}
            />
          </Form.Group>
          <Button variant="primary" onClick={handleSimulateMultiplePlayers}>
            Simulate Multiple Players
          </Button>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Game Phase Control</Card.Header>
        <Card.Body>
          <div className="d-grid gap-2">
            <Button variant="outline-primary" onClick={handleSkipToVoting}>
              Skip to Voting
            </Button>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Drawing word"
                value={drawingWord}
                onChange={(e) => setDrawingWord(e.target.value)}
              />
              <Button variant="outline-primary" onClick={handleSkipToDrawing}>
                Skip to Drawing
              </Button>
            </div>
            <Button variant="outline-primary" onClick={handleSkipToResults}>
              Skip to Results
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Error Simulation</Card.Header>
        <Card.Body>
          <div className="d-grid gap-2">
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Comma-separated words"
                value={tieWords}
                onChange={(e) => setTieWords(e.target.value)}
              />
              <Button variant="outline-warning" onClick={handleSimulateVotingTie}>
                Simulate Tie
              </Button>
            </div>
            <Button variant="outline-danger" onClick={handleSimulateNetworkError}>
              Simulate Network Error
            </Button>
            <Button variant="outline-danger" onClick={handleSimulateDisconnection}>
              Simulate Disconnection
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  const renderDebuggingTab = () => {
    const networkStats = devToolsService.getNetworkStatistics();
    const stateHistory = devToolsService.getStateHistory();
    const performanceMetrics = devToolsService.getPerformanceMetrics();
    const memoryUsage = devToolsService.getMemoryUsage();

    return (
      <div className="p-3">
        <Card className="mb-3">
          <Card.Header>
            Network Messages 
            <Badge bg={isRecording ? 'success' : 'secondary'} className="ms-2">
              {isRecording ? 'Recording' : 'Stopped'}
            </Badge>
          </Card.Header>
          <Card.Body>
            <div className="d-flex gap-2 mb-3">
              <Button 
                variant={isRecording ? 'danger' : 'success'} 
                onClick={handleToggleRecording}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
              <Button variant="outline-secondary" onClick={handleClearMessages}>
                Clear Messages
              </Button>
              <Button variant="outline-info" onClick={refreshNetworkMessages}>
                Refresh
              </Button>
            </div>

            {/* Network Statistics */}
            <div className="row mb-3">
              <div className="col-md-6">
                <small className="text-muted">Total Messages: <strong>{networkStats.totalMessages}</strong></small><br />
                <small className="text-muted">Sent: <strong>{networkStats.sentMessages}</strong></small><br />
                <small className="text-muted">Received: <strong>{networkStats.receivedMessages}</strong></small>
              </div>
              <div className="col-md-6">
                <small className="text-muted">Avg Size: <strong>{networkStats.averageMessageSize} bytes</strong></small><br />
                <small className="text-muted">Types: <strong>{Object.keys(networkStats.messageTypes).length}</strong></small>
              </div>
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {networkMessages.length === 0 ? (
                <p className="text-muted">No messages recorded</p>
              ) : (
                networkMessages.map((msg, index) => (
                  <div key={index} className="border-bottom pb-2 mb-2">
                    <div className="d-flex justify-content-between">
                      <strong className={msg.direction === 'sent' ? 'text-primary' : 'text-success'}>
                        {msg.direction === 'sent' ? '→' : '←'} {msg.type}
                      </strong>
                      <small className="text-muted">
                        {msg.timestamp.toLocaleTimeString()}
                      </small>
                    </div>
                    <pre className="small text-muted mt-1">
                      {JSON.stringify(msg.data, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header>Game State Inspector</Card.Header>
          <Card.Body>
            <div className="d-flex gap-2 mb-3">
              <Button variant="outline-info" onClick={refreshGameState}>
                Refresh State
              </Button>
              <Button variant="outline-warning" onClick={() => {
                const consistency = devToolsService.analyzeStateConsistency();
                setValidationResult(consistency);
              }}>
                Analyze Consistency
              </Button>
            </div>

            {/* State History Summary */}
            <div className="mb-3">
              <small className="text-muted">
                State History: <strong>{stateHistory.length}</strong> entries
                {stateHistory.length > 0 && (
                  <span> (Last: {stateHistory[stateHistory.length - 1].timestamp.toLocaleTimeString()})</span>
                )}
              </small>
            </div>
            
            {gameState ? (
              <pre style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '0.8rem' }}>
                {JSON.stringify(gameState, null, 2)}
              </pre>
            ) : (
              <p className="text-muted">No game state available</p>
            )}
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header>Performance Metrics</Card.Header>
          <Card.Body>
            {performanceMetrics.length === 0 ? (
              <p className="text-muted">No performance metrics recorded</p>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {performanceMetrics.slice(-10).map((metric, index) => (
                  <div key={index} className="d-flex justify-content-between border-bottom pb-1 mb-1">
                    <span className="small">{metric.action}</span>
                    <span className="small text-muted">{metric.duration}ms</span>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header>Memory Usage</Card.Header>
          <Card.Body>
            <div className="row">
              <div className="col-md-6">
                <small className="text-muted">Network Messages: <strong>{memoryUsage.networkMessages}</strong></small><br />
                <small className="text-muted">State History: <strong>{memoryUsage.stateHistory}</strong></small>
              </div>
              <div className="col-md-6">
                <small className="text-muted">Performance Metrics: <strong>{memoryUsage.performanceMetrics}</strong></small><br />
                <small className="text-muted">Estimated Memory: <strong>{memoryUsage.estimatedMemoryKB} KB</strong></small>
              </div>
            </div>
            <Button 
              variant="outline-danger" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                devToolsService.clearAllDebuggingData();
                refreshNetworkMessages();
                refreshGameState();
              }}
            >
              Clear All Debug Data
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  };

  const renderTestingTab = () => (
    <div className="p-3">
      <Card className="mb-3">
        <Card.Header>
          Automated Testing
          {isRunningTests && <Badge bg="warning" className="ms-2">Running...</Badge>}
        </Card.Header>
        <Card.Body>
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  onClick={handleRunAllTests}
                  disabled={isRunningTests}
                >
                  {isRunningTests ? 'Running All Tests...' : 'Run All Tests (Regression)'}
                </Button>
                <Button 
                  variant="outline-primary" 
                  onClick={handleRunScenarioTests}
                  disabled={isRunningTests}
                >
                  Run Scenario Tests
                </Button>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-grid gap-2">
                <Button variant="outline-secondary" onClick={handleRunGameFlowTest}>
                  Run Game Flow Test
                </Button>
                <Button variant="outline-secondary" onClick={handleValidateState}>
                  Validate State Consistency
                </Button>
              </div>
            </div>
          </div>

          <Card className="mb-3">
            <Card.Header>Connection Issue Simulation</Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-warning" onClick={() => handleSimulateConnectionIssues('mild')}>
                  Simulate Mild Issues
                </Button>
                <Button variant="outline-warning" onClick={() => handleSimulateConnectionIssues('moderate')}>
                  Simulate Moderate Issues
                </Button>
                <Button variant="outline-danger" onClick={() => handleSimulateConnectionIssues('severe')}>
                  Simulate Severe Issues
                </Button>
              </div>
            </Card.Body>
          </Card>

          {validationResult && (
            <Alert variant={validationResult.isValid ? 'success' : 'danger'}>
              <strong>Validation Result:</strong> {validationResult.isValid ? 'Valid' : 'Invalid'}
              {validationResult.errors.length > 0 && (
                <ul className="mb-0 mt-2">
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
              {validationResult.warnings.length > 0 && (
                <div className="mt-2">
                  <strong>Warnings:</strong>
                  <ul className="mb-0">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Test Suites</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Select Test Suite</Form.Label>
            <Form.Select
              value={selectedTestSuite}
              onChange={(e) => setSelectedTestSuite(e.target.value)}
            >
              <option value="">Choose a test suite...</option>
              {testSuites.map((suite) => (
                <option key={suite.name} value={suite.name}>
                  {suite.name} ({suite.tests.length} tests)
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {selectedTestSuite && (
            <div className="mb-3">
              <Alert variant="info">
                <strong>{selectedTestSuite}</strong>
                <br />
                {testSuites.find(s => s.name === selectedTestSuite)?.description}
              </Alert>
            </div>
          )}

          <Button
            variant="outline-primary"
            onClick={handleRunTestSuite}
            disabled={!selectedTestSuite || isRunningTests}
          >
            {isRunningTests ? 'Running Test Suite...' : 'Run Selected Test Suite'}
          </Button>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Regression Test Results</Card.Header>
        <Card.Body>
          {regressionResults.length === 0 ? (
            <p className="text-muted">No regression test results yet</p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {regressionResults.map((result, index) => (
                <Card key={index} className="mb-2">
                  <Card.Body className="py-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <strong className={result.failedTests === 0 ? 'text-success' : 'text-danger'}>
                          {result.suiteName}
                        </strong>
                        <br />
                        <small className="text-muted">{result.summary}</small>
                      </div>
                      <Badge bg={result.failedTests === 0 ? 'success' : 'danger'}>
                        {result.passedTests}/{result.totalTests}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Test Results</Card.Header>
        <Card.Body>
          {testResults.length === 0 ? (
            <p className="text-muted">No test results yet</p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {testResults.map((result, index) => (
                <Alert 
                  key={index} 
                  variant={result.success ? 'success' : 'danger'}
                  className="py-2"
                >
                  <div className="d-flex justify-content-between">
                    <span>{result.message}</span>
                    <small>{result.duration}ms</small>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );

  const renderSessionTab = () => (
    <div className="p-3">
      <Card className="mb-3">
        <Card.Header>Session Export/Import</Card.Header>
        <Card.Body>
          <div className="d-grid gap-2 mb-3">
            <Button variant="outline-primary" onClick={handleExportSession}>
              Export Current Session
            </Button>
          </div>
          
          <Form.Group className="mb-3">
            <Form.Label>Session Data</Form.Label>
            <Form.Control
              as="textarea"
              rows={10}
              value={sessionData}
              onChange={(e) => setSessionData(e.target.value)}
              placeholder="Paste session data here to import..."
            />
          </Form.Group>
          
          <Button 
            variant="outline-success" 
            onClick={handleImportSession}
            disabled={!sessionData.trim()}
          >
            Import Session
          </Button>
        </Card.Body>
      </Card>
    </div>
  );

  const renderScenariosTab = () => (
    <div className="p-3">
      <Card className="mb-3">
        <Card.Header>Predefined Test Scenarios</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Select Scenario</Form.Label>
            <Form.Select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
            >
              <option value="">Choose a scenario...</option>
              {TEST_SCENARIOS.map((scenario) => (
                <option key={scenario.name} value={scenario.name}>
                  {scenario.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {selectedScenario && (
            <Alert variant="info" className="mb-3">
              <strong>{selectedScenario}</strong>
              <br />
              {TEST_SCENARIOS.find(s => s.name === selectedScenario)?.description}
            </Alert>
          )}

          <Button
            variant="primary"
            onClick={handleRunScenario}
            disabled={!selectedScenario || runningScenario}
          >
            {runningScenario ? 'Running Scenario...' : 'Run Scenario'}
          </Button>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Available Scenarios</Card.Header>
        <Card.Body>
          {TEST_SCENARIOS.map((scenario, index) => (
            <Card key={index} className="mb-2">
              <Card.Body className="py-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong>{scenario.name}</strong>
                    <br />
                    <small className="text-muted">{scenario.description}</small>
                    <br />
                    <small className="text-info">{scenario.steps.length} steps</small>
                  </div>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => {
                      setSelectedScenario(scenario.name);
                      handleRunScenario();
                    }}
                    disabled={runningScenario}
                  >
                    Run
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </Card.Body>
      </Card>
    </div>
  );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>🛠️ Developer Tools</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'simulation')}>
          <Tab eventKey="simulation" title="Simulation">
            {renderSimulationTab()}
          </Tab>
          <Tab eventKey="debugging" title="Debugging">
            {renderDebuggingTab()}
          </Tab>
          <Tab eventKey="testing" title="Testing">
            {renderTestingTab()}
          </Tab>
          <Tab eventKey="scenarios" title="Scenarios">
            {renderScenariosTab()}
          </Tab>
          <Tab eventKey="session" title="Session">
            {renderSessionTab()}
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DevTools;