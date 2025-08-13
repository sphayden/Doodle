# Testing Strategies and Tools Guide

This guide covers the comprehensive testing approach for the Doodle multiplayer drawing game, including strategies, tools, and best practices for ensuring code quality and reliability.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Pyramid](#testing-pyramid)
- [Testing Tools and Frameworks](#testing-tools-and-frameworks)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [Component Testing](#component-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Test Utilities and Helpers](#test-utilities-and-helpers)
- [Automated Testing](#automated-testing)
- [Debugging Tests](#debugging-tests)
- [Best Practices](#best-practices)

## Testing Philosophy

Our testing approach follows these core principles:

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Test-Driven Development (TDD)**: Write tests before implementation when possible
3. **Comprehensive Coverage**: Aim for high test coverage while focusing on critical paths
4. **Fast Feedback**: Tests should run quickly to enable rapid development
5. **Reliable Tests**: Tests should be deterministic and not flaky
6. **Maintainable Tests**: Tests should be easy to understand and modify

## Testing Pyramid

```
    /\
   /  \     E2E Tests (Few)
  /____\    - Full game flows
 /      \   - User scenarios
/________\  Integration Tests (Some)
           - Component interactions
           - Service integrations
___________________
Unit Tests (Many)
- Individual functions
- Component logic
- Service methods
```

### Test Distribution

- **70% Unit Tests**: Fast, isolated, focused on individual components
- **20% Integration Tests**: Test component interactions and data flow
- **10% End-to-End Tests**: Test complete user workflows

## Testing Tools and Frameworks

### Core Testing Stack

- **Jest**: Primary testing framework for unit and integration tests
- **React Testing Library**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **MSW (Mock Service Worker)**: API mocking for integration tests
- **Playwright**: End-to-end testing framework

### Additional Tools

- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing
- **jest-canvas-mock**: Canvas API mocking for drawing tests
- **socket.io-mock**: Socket.io mocking for network tests
- **faker.js**: Test data generation

### Installation

```bash
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-canvas-mock \
  msw \
  faker
```

## Unit Testing

Unit tests focus on individual functions, methods, and components in isolation.

### Testing Services

```typescript
// services/__tests__/SocketGameManager.test.ts
import { SocketGameManager } from '../SocketGameManager';
import { createMockSocket } from '../../utils/TestUtils';
import { GameErrorCode } from '../../interfaces';

describe('SocketGameManager', () => {
  let gameManager: SocketGameManager;
  let mockSocket: any;
  let onStateChange: jest.Mock;

  beforeEach(() => {
    mockSocket = createMockSocket();
    onStateChange = jest.fn();
    gameManager = new SocketGameManager(onStateChange);
    
    // Inject mock socket
    (gameManager as any).socket = mockSocket;
  });

  afterEach(() => {
    gameManager.destroy();
  });

  describe('hostGame', () => {
    it('should create room and return room code', async () => {
      // Arrange
      const playerName = 'TestPlayer';
      const expectedRoomCode = 'ABC123';
      
      mockSocket.emit.mockImplementation((event: string, data: any) => {
        if (event === 'create-room') {
          setTimeout(() => {
            mockSocket.trigger('room-created', {
              roomCode: expectedRoomCode,
              gameState: { roomCode: expectedRoomCode }
            });
          }, 0);
        }
      });

      // Act
      const roomCode = await gameManager.hostGame(playerName);

      // Assert
      expect(roomCode).toBe(expectedRoomCode);
      expect(mockSocket.emit).toHaveBeenCalledWith('create-room', {
        playerName
      });
    });

    it('should throw error for invalid player name', async () => {
      // Arrange
      const invalidName = '';

      // Act & Assert
      await expect(gameManager.hostGame(invalidName))
        .rejects
        .toMatchObject({
          code: GameErrorCode.INVALID_PLAYER_NAME
        });
    });

    it('should handle connection timeout', async () => {
      // Arrange
      const playerName = 'TestPlayer';
      mockSocket.emit.mockImplementation(() => {
        // Don't trigger any response (simulate timeout)
      });

      // Act & Assert
      await expect(gameManager.hostGame(playerName))
        .rejects
        .toMatchObject({
          code: GameErrorCode.CONNECTION_TIMEOUT
        });
    });
  });

  describe('error handling', () => {
    it('should process and classify errors correctly', () => {
      const onError = jest.fn();
      gameManager.onError(onError);

      // Simulate server error
      mockSocket.trigger('error', {
        message: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found'
        })
      );
    });
  });
});
```

### Testing Utilities

```typescript
// utils/__tests__/validation.test.ts
import {
  validatePlayerName,
  validateRoomCode,
  validateCanvasData
} from '../validation';
import { GameErrorCode } from '../../interfaces';

describe('validation utilities', () => {
  describe('validatePlayerName', () => {
    it('should accept valid player names', () => {
      const validNames = ['Alice', 'Bob123', 'Player_1'];
      
      validNames.forEach(name => {
        expect(() => validatePlayerName(name)).not.toThrow();
      });
    });

    it('should reject invalid player names', () => {
      const invalidNames = ['', 'a'.repeat(16), '   ', 'name@domain'];
      
      invalidNames.forEach(name => {
        expect(() => validatePlayerName(name)).toThrow(
          expect.objectContaining({
            code: GameErrorCode.INVALID_PLAYER_NAME
          })
        );
      });
    });
  });

  describe('validateRoomCode', () => {
    it('should accept valid room codes', () => {
      const validCodes = ['ABC123', 'XYZ789', 'DEF456'];
      
      validCodes.forEach(code => {
        expect(() => validateRoomCode(code)).not.toThrow();
      });
    });

    it('should reject invalid room codes', () => {
      const invalidCodes = ['', 'ABC', 'ABCDEFG', 'abc123', '123456'];
      
      invalidCodes.forEach(code => {
        expect(() => validateRoomCode(code)).toThrow(
          expect.objectContaining({
            code: GameErrorCode.INVALID_ROOM_CODE
          })
        );
      });
    });
  });
});
```

## Integration Testing

Integration tests verify that multiple components work together correctly.

### Service Integration Tests

```typescript
// services/__tests__/GameManager.integration.test.ts
import { SocketGameManager } from '../SocketGameManager';
import { DevToolsService } from '../DevToolsService';
import { createTestServer } from '../../utils/TestServer';

describe('GameManager Integration', () => {
  let testServer: any;
  let gameManager1: SocketGameManager;
  let gameManager2: SocketGameManager;

  beforeAll(async () => {
    testServer = await createTestServer();
  });

  afterAll(async () => {
    await testServer.close();
  });

  beforeEach(() => {
    gameManager1 = new SocketGameManager(jest.fn());
    gameManager2 = new SocketGameManager(jest.fn());
  });

  afterEach(() => {
    gameManager1.destroy();
    gameManager2.destroy();
  });

  it('should handle complete game flow', async () => {
    // Host creates room
    const roomCode = await gameManager1.hostGame('Host');
    expect(roomCode).toMatch(/^[A-Z]{6}$/);

    // Player joins room
    await gameManager2.joinGame('Player', roomCode);

    // Verify both players see each other
    const hostState = gameManager1.getGameState();
    const playerState = gameManager2.getGameState();

    expect(hostState?.players).toHaveLength(2);
    expect(playerState?.players).toHaveLength(2);
    expect(hostState?.roomCode).toBe(roomCode);
    expect(playerState?.roomCode).toBe(roomCode);
  });

  it('should handle voting flow', async () => {
    // Setup game
    const roomCode = await gameManager1.hostGame('Host');
    await gameManager2.joinGame('Player', roomCode);

    // Start voting
    gameManager1.startVoting();

    // Wait for voting state
    await waitForGamePhase(gameManager1, 'voting');
    await waitForGamePhase(gameManager2, 'voting');

    // Both players vote
    const hostState = gameManager1.getGameState();
    const wordOptions = hostState?.wordOptions || [];
    
    gameManager1.voteForWord(wordOptions[0]);
    gameManager2.voteForWord(wordOptions[1]);

    // Verify votes are counted
    await waitFor(() => {
      const state = gameManager1.getGameState();
      return Object.keys(state?.voteCounts || {}).length > 0;
    });
  });
});
```

### Network Resilience Tests

```typescript
// utils/__tests__/networkResilience.integration.test.ts
import { NetworkResilienceManager } from '../networkResilience';
import { createUnstableServer } from '../../utils/TestServer';

describe('Network Resilience Integration', () => {
  let resilienceManager: NetworkResilienceManager;
  let unstableServer: any;

  beforeEach(() => {
    resilienceManager = new NetworkResilienceManager();
    unstableServer = createUnstableServer();
  });

  afterEach(() => {
    resilienceManager.destroy();
    unstableServer.close();
  });

  it('should retry failed requests', async () => {
    let attemptCount = 0;
    
    const requestFn = jest.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Network error');
      }
      return Promise.resolve('success');
    });

    const result = await resilienceManager.executeWithResilience(
      requestFn,
      { retryConfig: { maxAttempts: 3 } }
    );

    expect(result).toBe('success');
    expect(requestFn).toHaveBeenCalledTimes(3);
  });

  it('should handle circuit breaker', async () => {
    // Trigger circuit breaker with multiple failures
    const failingRequest = () => Promise.reject(new Error('Server error'));

    for (let i = 0; i < 5; i++) {
      try {
        await resilienceManager.executeWithResilience(failingRequest);
      } catch (error) {
        // Expected to fail
      }
    }

    // Circuit should be open now
    const status = resilienceManager.getCircuitBreakerStatus();
    expect(status.state).toBe('open');

    // Next request should fail immediately
    const startTime = Date.now();
    try {
      await resilienceManager.executeWithResilience(failingRequest);
    } catch (error) {
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should fail fast
    }
  });
});
```

## Component Testing

Component tests verify React component behavior and user interactions.

### Basic Component Tests

```typescript
// components/__tests__/LobbyScreen.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LobbyScreen } from '../LobbyScreen';
import { createMockGameManager, createMockGameState } from '../../utils/TestUtils';

describe('LobbyScreen', () => {
  let mockGameManager: any;
  let mockGameState: any;

  beforeEach(() => {
    mockGameManager = createMockGameManager();
    mockGameState = createMockGameState({
      gamePhase: 'lobby',
      players: [
        { id: '1', name: 'Host', isHost: true, isConnected: true },
        { id: '2', name: 'Player1', isHost: false, isConnected: true }
      ],
      currentPlayer: { id: '1', name: 'Host', isHost: true },
      roomCode: 'ABC123'
    });
  });

  it('should display room code', () => {
    render(
      <LobbyScreen 
        gameState={mockGameState} 
        gameManager={mockGameManager} 
      />
    );

    expect(screen.getByText('Room Code: ABC123')).toBeInTheDocument();
  });

  it('should display all players', () => {
    render(
      <LobbyScreen 
        gameState={mockGameState} 
        gameManager={mockGameManager} 
      />
    );

    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText('Player1')).toBeInTheDocument();
  });

  it('should show start button for host', () => {
    render(
      <LobbyScreen 
        gameState={mockGameState} 
        gameManager={mockGameManager} 
      />
    );

    const startButton = screen.getByRole('button', { name: /start game/i });
    expect(startButton).toBeInTheDocument();
  });

  it('should not show start button for non-host', () => {
    const playerGameState = {
      ...mockGameState,
      currentPlayer: { id: '2', name: 'Player1', isHost: false }
    };

    render(
      <LobbyScreen 
        gameState={playerGameState} 
        gameManager={mockGameManager} 
      />
    );

    const startButton = screen.queryByRole('button', { name: /start game/i });
    expect(startButton).not.toBeInTheDocument();
  });

  it('should call startVoting when start button clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <LobbyScreen 
        gameState={mockGameState} 
        gameManager={mockGameManager} 
      />
    );

    const startButton = screen.getByRole('button', { name: /start game/i });
    await user.click(startButton);

    expect(mockGameManager.startVoting).toHaveBeenCalled();
  });

  it('should handle copy room code', async () => {
    const user = userEvent.setup();
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    });

    render(
      <LobbyScreen 
        gameState={mockGameState} 
        gameManager={mockGameManager} 
      />
    );

    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123');
  });
});
```

### Canvas Component Tests

```typescript
// components/__tests__/GameScreen.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { GameScreen } from '../GameScreen';
import { createMockGameManager, createMockGameState } from '../../utils/TestUtils';

// Mock canvas context
const mockContext = {
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn()
};

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);
  HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mock');
});

describe('GameScreen', () => {
  let mockGameManager: any;
  let mockGameState: any;

  beforeEach(() => {
    mockGameManager = createMockGameManager();
    mockGameState = createMockGameState({
      gamePhase: 'drawing',
      chosenWord: 'cat',
      timeRemaining: 60,
      drawingTimeLimit: 60
    });
  });

  it('should render drawing canvas', () => {
    render(
      <GameScreen 
        gameState={mockGameState} 
        gameManager={mockGameManager} 
      />
    );

    const canvas = screen.getByTestId('drawing-canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should display chosen word', () => {
    render(
      <GameScreen 
        gameState={mockGameState} 
        gameManager={mockGameManager} 
      />
    );

    expect(screen.getByText('Draw: cat')).toBeInTheDocument();
  });

  it('should display time remaining', () => {
    render(
      <GameScreen 
        gameState={mockGameState} 
        gameManager={mockGameManager} 
      />
    );

    expect(screen.getByText('Time: 1:00')).toBeInTheDocument();
  });

  it('should handle drawing interactions', () => {
    render(
      <GameScreen 
        gameState={mockGameState} 
        gameManager={mockGameManager} 
      />
    );

    const canvas = screen.getByTestId('drawing-canvas');
    
    // Simulate drawing
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
    fireEvent.mouseUp(canvas);

    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.moveTo).toHaveBeenCalledWith(100, 100);
    expect(mockContext.lineTo).toHaveBeenCalledWith(150, 150);
    expect(mockContext.stroke).toHaveBeenCalled();
  });

  it('should submit drawing when done', async () => {
    const user = userEvent.setup();
    
    render(
      <GameScreen 
        gameState={mockGameState} 
        gameManager={mockGameManager} 
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(mockGameManager.submitDrawing).toHaveBeenCalledWith(
      'data:image/png;base64,mock'
    );
  });
});
```

## End-to-End Testing

E2E tests verify complete user workflows using Playwright.

### Setup Playwright

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
```

### E2E Test Examples

```typescript
// e2e/game-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Game Flow', () => {
  test('should complete full multiplayer game', async ({ browser }) => {
    // Create two browser contexts for two players
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    // Host creates game
    await hostPage.goto('/');
    await hostPage.fill('[data-testid="player-name-input"]', 'Host');
    await hostPage.click('[data-testid="host-game-button"]');
    
    // Get room code
    const roomCodeElement = await hostPage.waitForSelector('[data-testid="room-code"]');
    const roomCode = await roomCodeElement.textContent();

    // Player joins game
    await playerPage.goto('/');
    await playerPage.fill('[data-testid="player-name-input"]', 'Player');
    await playerPage.fill('[data-testid="room-code-input"]', roomCode!);
    await playerPage.click('[data-testid="join-game-button"]');

    // Verify both players are in lobby
    await expect(hostPage.locator('[data-testid="player-list"]')).toContainText('Host');
    await expect(hostPage.locator('[data-testid="player-list"]')).toContainText('Player');
    await expect(playerPage.locator('[data-testid="player-list"]')).toContainText('Host');
    await expect(playerPage.locator('[data-testid="player-list"]')).toContainText('Player');

    // Host starts voting
    await hostPage.click('[data-testid="start-game-button"]');

    // Both players vote
    await hostPage.waitForSelector('[data-testid="word-option"]');
    await playerPage.waitForSelector('[data-testid="word-option"]');
    
    await hostPage.click('[data-testid="word-option"]:first-child');
    await playerPage.click('[data-testid="word-option"]:first-child');

    // Wait for drawing phase
    await hostPage.waitForSelector('[data-testid="drawing-canvas"]');
    await playerPage.waitForSelector('[data-testid="drawing-canvas"]');

    // Simulate drawing
    const hostCanvas = hostPage.locator('[data-testid="drawing-canvas"]');
    await hostCanvas.click({ position: { x: 100, y: 100 } });
    
    const playerCanvas = playerPage.locator('[data-testid="drawing-canvas"]');
    await playerCanvas.click({ position: { x: 150, y: 150 } });

    // Submit drawings
    await hostPage.click('[data-testid="submit-drawing-button"]');
    await playerPage.click('[data-testid="submit-drawing-button"]');

    // Wait for results
    await hostPage.waitForSelector('[data-testid="results-screen"]');
    await playerPage.waitForSelector('[data-testid="results-screen"]');

    // Verify results are displayed
    await expect(hostPage.locator('[data-testid="results-screen"]')).toBeVisible();
    await expect(playerPage.locator('[data-testid="results-screen"]')).toBeVisible();

    // Cleanup
    await hostContext.close();
    await playerContext.close();
  });

  test('should handle connection errors gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Try to join non-existent room
    await page.fill('[data-testid="player-name-input"]', 'Player');
    await page.fill('[data-testid="room-code-input"]', 'INVALID');
    await page.click('[data-testid="join-game-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Room not found');
  });
});
```

## Performance Testing

Performance tests ensure the application performs well under various conditions.

### Load Testing

```typescript
// performance/__tests__/load.test.ts
import { performance } from 'perf_hooks';
import { SocketGameManager } from '../../src/services/SocketGameManager';

describe('Performance Tests', () => {
  it('should handle multiple simultaneous connections', async () => {
    const connectionCount = 50;
    const gameManagers: SocketGameManager[] = [];
    const startTime = performance.now();

    try {
      // Create multiple connections
      const connectionPromises = Array.from({ length: connectionCount }, (_, i) => {
        const gameManager = new SocketGameManager(jest.fn());
        gameManagers.push(gameManager);
        return gameManager.hostGame(`Player${i}`);
      });

      await Promise.all(connectionPromises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds
      
      console.log(`Created ${connectionCount} connections in ${duration}ms`);
    } finally {
      // Cleanup
      gameManagers.forEach(gm => gm.destroy());
    }
  });

  it('should handle rapid state updates', async () => {
    const gameManager = new SocketGameManager(jest.fn());
    const updateCount = 1000;
    const startTime = performance.now();

    try {
      // Simulate rapid state updates
      for (let i = 0; i < updateCount; i++) {
        gameManager.simulateGameState?.({
          timeRemaining: updateCount - i
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle updates efficiently
      expect(duration).toBeLessThan(1000); // 1 second
      
      console.log(`Processed ${updateCount} state updates in ${duration}ms`);
    } finally {
      gameManager.destroy();
    }
  });
});
```

### Memory Leak Testing

```typescript
// performance/__tests__/memory.test.ts
describe('Memory Leak Tests', () => {
  it('should not leak memory on repeated create/destroy cycles', () => {
    const initialMemory = process.memoryUsage().heapUsed;
    const cycles = 100;

    for (let i = 0; i < cycles; i++) {
      const gameManager = new SocketGameManager(jest.fn());
      
      // Simulate some activity
      gameManager.simulateGameState?.({
        players: Array.from({ length: 8 }, (_, j) => ({
          id: `player-${j}`,
          name: `Player${j}`,
          isHost: j === 0,
          isConnected: true,
          hasVoted: false,
          hasSubmittedDrawing: false,
          score: 0
        }))
      });

      gameManager.destroy();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreasePerCycle = memoryIncrease / cycles;

    // Memory increase should be minimal
    expect(memoryIncreasePerCycle).toBeLessThan(1024 * 10); // 10KB per cycle
    
    console.log(`Memory increase: ${memoryIncrease} bytes (${memoryIncreasePerCycle} per cycle)`);
  });
});
```

## Test Utilities and Helpers

### Mock Factories

```typescript
// utils/TestUtils.tsx
import { GameManager, GameState, Player } from '../interfaces';

export function createMockGameManager(): jest.Mocked<GameManager> {
  return {
    hostGame: jest.fn(),
    joinGame: jest.fn(),
    disconnect: jest.fn(),
    getConnectionStatus: jest.fn().mockReturnValue('connected'),
    startVoting: jest.fn(),
    voteForWord: jest.fn(),
    submitDrawing: jest.fn(),
    finishDrawing: jest.fn(),
    resolveTiebreaker: jest.fn(),
    notifyTiebreakerAnimationComplete: jest.fn(),
    sendDrawingStroke: jest.fn(),
    getGameState: jest.fn(),
    onStateChange: jest.fn(),
    offStateChange: jest.fn(),
    onError: jest.fn(),
    offError: jest.fn(),
    getLastError: jest.fn(),
    clearError: jest.fn(),
    isHost: jest.fn(),
    getRoomCode: jest.fn(),
    getCurrentPlayer: jest.fn(),
    setTieBreakerCallbacks: jest.fn(),
    destroy: jest.fn(),
    enableDevMode: jest.fn(),
    simulateGameState: jest.fn(),
    getNetworkMessages: jest.fn(),
    exportGameSession: jest.fn()
  };
}

export function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    roomCode: 'ABC123',
    isConnected: true,
    connectionStatus: 'connected',
    players: [],
    currentPlayer: null,
    hostId: 'host-id',
    playerCount: 0,
    maxPlayers: 8,
    gamePhase: 'lobby',
    wordOptions: [],
    voteCounts: {},
    chosenWord: '',
    timeRemaining: 0,
    drawingTimeLimit: 60,
    submittedDrawings: 0,
    results: [],
    ...overrides
  };
}

export function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-id',
    name: 'TestPlayer',
    isHost: false,
    isConnected: true,
    hasVoted: false,
    hasSubmittedDrawing: false,
    score: 0,
    ...overrides
  };
}

export function createMockSocket() {
  const eventHandlers: Record<string, Function[]> = {};
  
  return {
    emit: jest.fn(),
    on: jest.fn((event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);
    }),
    off: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
    trigger: (event: string, data: any) => {
      const handlers = eventHandlers[event] || [];
      handlers.forEach(handler => handler(data));
    }
  };
}
```

### Test Helpers

```typescript
// utils/TestHelpers.ts
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

export async function waitForGamePhase(
  gameManager: GameManager,
  expectedPhase: string,
  timeout: number = 5000
): Promise<void> {
  return waitFor(() => {
    const state = gameManager.getGameState();
    return state?.gamePhase === expectedPhase;
  }, timeout);
}

export function createTestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
}
```

## Automated Testing

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd doodle-revamp/client
          npm ci
      
      - name: Run unit tests
        run: |
          cd doodle-revamp/client
          npm test -- --coverage --watchAll=false
      
      - name: Run E2E tests
        run: |
          cd doodle-revamp/client
          npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./doodle-revamp/client/coverage/lcov.info
```

### Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:performance": "jest --testPathPattern=performance",
    "test:ci": "jest --coverage --watchAll=false --maxWorkers=2"
  }
}
```

## Debugging Tests

### Common Debugging Techniques

1. **Use `screen.debug()`** to see rendered DOM
2. **Add `console.log`** statements in tests
3. **Use Jest's `--verbose` flag** for detailed output
4. **Run single tests** with `--testNamePattern`
5. **Use debugger statements** and run with `--runInBand`

### Debug Configuration

```typescript
// jest.config.js
module.exports = {
  // Enable debugging
  verbose: true,
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  // Test environment
  testEnvironment: 'jsdom',
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  }
};
```

## Best Practices

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the behavior
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests independent** and isolated
5. **Clean up resources** in `afterEach`/`afterAll`

### Test Quality

1. **Test behavior, not implementation**
2. **Use realistic test data**
3. **Mock external dependencies**
4. **Avoid testing third-party libraries**
5. **Keep tests simple and focused**

### Performance

1. **Use `beforeEach` for common setup**
2. **Avoid unnecessary re-renders**
3. **Mock expensive operations**
4. **Run tests in parallel when possible**
5. **Use `--maxWorkers` to control parallelism**

### Maintenance

1. **Update tests when behavior changes**
2. **Remove obsolete tests**
3. **Refactor test utilities**
4. **Keep test dependencies up to date**
5. **Review test coverage regularly**

This comprehensive testing guide should help you write effective tests for the Doodle game application. Remember to focus on testing the most critical paths and user interactions while maintaining good test coverage and performance.