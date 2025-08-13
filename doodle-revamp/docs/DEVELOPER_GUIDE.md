# Developer Onboarding Guide

Welcome to the Doodle multiplayer drawing game! This guide will help you get up to speed with the codebase, architecture, and development workflow.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Core Concepts](#core-concepts)
- [Development Workflow](#development-workflow)
- [Testing Guide](#testing-guide)
- [Debugging Tools](#debugging-tools)
- [Common Tasks](#common-tasks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Basic knowledge of React, TypeScript, and Socket.io
- Understanding of real-time multiplayer game concepts

### Initial Setup

1. **Clone and Install Dependencies**
   ```bash
   cd doodle-revamp/client
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Start Game Server** (in separate terminal)
   ```bash
   cd ../server
   npm install
   npm start
   ```

4. **Run Tests**
   ```bash
   cd ../client
   npm test
   ```

### Environment Configuration

Create environment files for different configurations:

```bash
# .env.development
REACT_APP_SERVER_URL=http://localhost:3001
REACT_APP_LOG_LEVEL=debug
REACT_APP_DEV_MODE=true

# .env.production
REACT_APP_SERVER_URL=wss://your-production-server.com
REACT_APP_LOG_LEVEL=error
REACT_APP_DEV_MODE=false
```

## Project Structure

```
doodle-revamp/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── interfaces/     # TypeScript interfaces
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration files
│   │   └── __tests__/      # Test files
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Node.js backend
│   ├── index.js           # Server entry point
│   ├── gameManager.js     # Game logic
│   └── package.json
└── docs/                  # Documentation
```

### Key Directories

- **`src/interfaces/`**: TypeScript type definitions and interfaces
- **`src/services/`**: Core business logic (GameManager, DevTools, etc.)
- **`src/components/`**: React UI components
- **`src/utils/`**: Utility functions (error handling, validation, etc.)
- **`src/__tests__/`**: Test files organized by component/service

## Core Concepts

### 1. GameManager Interface

The `GameManager` is the central interface for all game operations:

```typescript
import { GameManager, GameState } from '../interfaces';

// Create a game manager
const gameManager: GameManager = new SocketGameManager(
  (state: GameState) => {
    // Handle state changes
    console.log('Game state updated:', state.gamePhase);
  }
);

// Host a game
const roomCode = await gameManager.hostGame('PlayerName');

// Join a game
await gameManager.joinGame('PlayerName', 'ABC123');
```

### 2. Game State Management

All game data is contained in the `GameState` object:

```typescript
interface GameState {
  roomCode: string;
  gamePhase: 'lobby' | 'voting' | 'drawing' | 'judging' | 'results';
  players: Player[];
  currentPlayer: Player | null;
  // ... other properties
}
```

### 3. Error Handling

Errors are handled through the standardized `GameError` system:

```typescript
gameManager.onError((error: GameError) => {
  switch (error.code) {
    case 'CONNECTION_FAILED':
      showConnectionError();
      break;
    case 'ROOM_NOT_FOUND':
      showRoomNotFoundError();
      break;
    default:
      showGenericError(error.message);
  }
});
```

### 4. Component Architecture

UI components follow a consistent pattern:

```typescript
interface ComponentProps {
  gameState: GameState;
  gameManager: GameManager;
}

const GameComponent: React.FC<ComponentProps> = ({ gameState, gameManager }) => {
  // Component logic
  const handleAction = () => {
    try {
      gameManager.someAction();
    } catch (error) {
      // Error handling
    }
  };

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

## Development Workflow

### 1. Feature Development Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature-name
   ```

2. **Write Tests First** (TDD approach)
   ```typescript
   // __tests__/NewFeature.test.tsx
   describe('NewFeature', () => {
     it('should handle user interaction', () => {
       // Test implementation
     });
   });
   ```

3. **Implement Feature**
   - Follow existing patterns and interfaces
   - Add proper TypeScript types
   - Include error handling

4. **Test Implementation**
   ```bash
   npm test -- --watch
   ```

5. **Update Documentation**
   - Add JSDoc comments
   - Update relevant guides
   - Include usage examples

### 2. Code Style Guidelines

- **TypeScript**: Use strict typing, avoid `any`
- **React**: Use functional components with hooks
- **Naming**: Use descriptive names, follow camelCase
- **Comments**: Add JSDoc for public APIs
- **Error Handling**: Always handle errors gracefully

### 3. Git Workflow

```bash
# Feature development
git checkout -b feature/feature-name
git add .
git commit -m "feat: add new feature description"
git push origin feature/feature-name

# Create pull request for review
```

## Testing Guide

### Test Structure

```
src/
├── __tests__/
│   ├── components/
│   │   ├── GameScreen.test.tsx
│   │   └── LobbyScreen.test.tsx
│   ├── services/
│   │   └── SocketGameManager.test.ts
│   └── utils/
│       └── validation.test.ts
```

### Writing Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { GameScreen } from '../components/GameScreen';
import { createMockGameManager } from '../utils/TestUtils';

describe('GameScreen', () => {
  it('should render drawing canvas', () => {
    const mockGameManager = createMockGameManager();
    const mockGameState = {
      gamePhase: 'drawing' as const,
      chosenWord: 'cat',
      // ... other properties
    };

    render(
      <GameScreen 
        gameState={mockGameState} 
        gameManager={mockGameManager} 
      />
    );

    expect(screen.getByTestId('drawing-canvas')).toBeInTheDocument();
  });
});
```

### Writing Service Tests

```typescript
import { SocketGameManager } from '../services/SocketGameManager';
import { createMockSocket } from '../utils/TestUtils';

describe('SocketGameManager', () => {
  it('should handle room creation', async () => {
    const mockSocket = createMockSocket();
    const gameManager = new SocketGameManager(jest.fn());
    
    // Mock socket behavior
    mockSocket.emit.mockImplementation((event, data) => {
      if (event === 'create-room') {
        mockSocket.trigger('room-created', { roomCode: 'ABC123' });
      }
    });

    const roomCode = await gameManager.hostGame('TestPlayer');
    expect(roomCode).toBe('ABC123');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test GameScreen.test.tsx

# Run tests with coverage
npm test -- --coverage
```

## Debugging Tools

### 1. DevTools Service

The `DevToolsService` provides powerful debugging capabilities:

```typescript
import { DevToolsService } from '../services/DevToolsService';

const devTools = new DevToolsService(gameManager);

// Simulate game states
devTools.simulateMultiplePlayers(4);
devTools.skipToVoting();
devTools.skipToDrawing('cat');

// Debug network issues
devTools.simulateNetworkError();
devTools.simulateDisconnection();

// Export session data
const sessionData = devTools.exportGameSession();
```

### 2. Browser DevTools Integration

Enable development mode for enhanced debugging:

```typescript
// In development environment
if (process.env.NODE_ENV === 'development') {
  gameManager.enableDevMode?.();
  
  // Access from browser console
  (window as any).gameManager = gameManager;
  (window as any).devTools = devTools;
}
```

### 3. Network Message Inspection

Monitor network messages in real-time:

```typescript
// View message history
const messages = gameManager.getNetworkMessages?.();
console.table(messages);

// Filter by message type
const voteMessages = messages?.filter(m => m.type === 'vote-word');
```

### 4. State History Tracking

Track state changes over time:

```typescript
const devTools = new DevToolsService(gameManager);
devTools.startRecording();

// Perform actions...

const stateHistory = devTools.getStateHistory();
console.log('State changes:', stateHistory);
```

## Common Tasks

### 1. Adding a New Game Phase

1. **Update GameState Interface**
   ```typescript
   // interfaces/GameManager.ts
   gamePhase: 'lobby' | 'voting' | 'drawing' | 'judging' | 'results' | 'newPhase';
   ```

2. **Handle Phase in Components**
   ```typescript
   switch (gameState.gamePhase) {
     case 'newPhase':
       return <NewPhaseComponent />;
     // ... other cases
   }
   ```

3. **Add Server-Side Logic**
   ```javascript
   // server/gameManager.js
   case 'start-new-phase':
     // Handle new phase logic
     break;
   ```

### 2. Adding New Error Types

1. **Define Error Code**
   ```typescript
   // interfaces/GameManager.ts
   export enum GameErrorCode {
     NEW_ERROR_TYPE = 'NEW_ERROR_TYPE',
     // ... existing codes
   }
   ```

2. **Add Error Classification**
   ```typescript
   // utils/errorHandling.ts
   [GameErrorCode.NEW_ERROR_TYPE]: {
     category: ErrorCategory.VALIDATION,
     severity: ErrorSeverity.MEDIUM,
     // ... other properties
   }
   ```

3. **Handle in UI**
   ```typescript
   gameManager.onError((error) => {
     if (error.code === 'NEW_ERROR_TYPE') {
       showSpecificErrorMessage();
     }
   });
   ```

### 3. Adding New DevTools Features

1. **Extend DevToolsService**
   ```typescript
   // services/DevToolsService.ts
   simulateNewScenario(): void {
     this.simulateGameState({
       // New scenario state
     });
   }
   ```

2. **Add to DevTools Component**
   ```typescript
   // components/DevTools.tsx
   <button onClick={() => devTools.simulateNewScenario()}>
     Simulate New Scenario
   </button>
   ```

### 4. Performance Optimization

1. **Memoize Expensive Components**
   ```typescript
   const ExpensiveComponent = React.memo(({ data }) => {
     // Component implementation
   });
   ```

2. **Optimize State Updates**
   ```typescript
   const [gameState, setGameState] = useState<GameState | null>(null);
   
   const handleStateChange = useCallback((newState: GameState) => {
     setGameState(prevState => {
       // Only update if actually changed
       if (JSON.stringify(prevState) !== JSON.stringify(newState)) {
         return newState;
       }
       return prevState;
     });
   }, []);
   ```

## Best Practices

### 1. TypeScript Usage

- **Always use strict typing**
  ```typescript
  // Good
  interface PlayerProps {
    player: Player;
    onPlayerClick: (playerId: string) => void;
  }
  
  // Avoid
  const props: any = { ... };
  ```

- **Use type guards for runtime checks**
  ```typescript
  function isPlayer(obj: unknown): obj is Player {
    return typeof obj === 'object' && obj !== null && 'id' in obj;
  }
  ```

### 2. Error Handling

- **Always handle errors gracefully**
  ```typescript
  try {
    await gameManager.hostGame(playerName);
  } catch (error) {
    if (error instanceof GameError) {
      handleGameError(error);
    } else {
      handleUnknownError(error);
    }
  }
  ```

- **Provide user-friendly error messages**
  ```typescript
  const getUserFriendlyMessage = (error: GameError): string => {
    switch (error.code) {
      case 'CONNECTION_FAILED':
        return 'Unable to connect. Please check your internet connection.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };
  ```

### 3. Component Design

- **Keep components focused and small**
- **Use composition over inheritance**
- **Separate concerns (UI vs logic)**
- **Make components testable**

### 4. State Management

- **Single source of truth (GameState)**
- **Immutable state updates**
- **Predictable state transitions**
- **Clear state ownership**

### 5. Testing

- **Write tests first (TDD)**
- **Test behavior, not implementation**
- **Use descriptive test names**
- **Mock external dependencies**

## Troubleshooting

### Common Issues

#### 1. Connection Problems

**Symptoms**: Can't connect to server, frequent disconnections

**Solutions**:
- Check server is running on correct port
- Verify CORS configuration
- Check firewall settings
- Review network logs in DevTools

#### 2. State Synchronization Issues

**Symptoms**: UI doesn't update, inconsistent state

**Solutions**:
- Check state change callbacks are registered
- Verify GameManager is properly initialized
- Use DevTools to inspect state changes
- Check for memory leaks in event listeners

#### 3. Test Failures

**Symptoms**: Tests fail unexpectedly, flaky tests

**Solutions**:
- Check mock implementations
- Verify async operations are properly awaited
- Clean up resources in test teardown
- Use `act()` for React state updates

#### 4. Performance Issues

**Symptoms**: Slow rendering, high memory usage

**Solutions**:
- Use React DevTools Profiler
- Check for unnecessary re-renders
- Optimize expensive computations with `useMemo`
- Clean up event listeners and timers

### Debugging Checklist

1. **Check Browser Console**: Look for JavaScript errors
2. **Network Tab**: Inspect WebSocket connections and messages
3. **React DevTools**: Examine component state and props
4. **DevTools Service**: Use built-in debugging features
5. **Server Logs**: Check server-side error messages
6. **Test Coverage**: Ensure adequate test coverage

### Getting Help

1. **Documentation**: Check this guide and architecture docs
2. **Code Comments**: Look for JSDoc comments in source code
3. **Tests**: Examine existing tests for usage examples
4. **DevTools**: Use debugging tools to understand behavior
5. **Team**: Ask team members for guidance

### Useful Commands

```bash
# Development
npm start                    # Start development server
npm test                     # Run tests
npm run build               # Build for production

# Debugging
npm test -- --verbose       # Verbose test output
npm run analyze             # Bundle analysis
npm run lint                # Code linting

# Maintenance
npm audit                   # Security audit
npm outdated               # Check for updates
npm run clean              # Clean build artifacts
```

This guide should help you get started with the Doodle game codebase. Remember to refer to the architecture documentation for deeper technical details and the JSDoc comments in the code for specific API usage.