# Doodle Game Client

React + TypeScript frontend for the Doodle multiplayer drawing game.

## Overview

This is the client-side application built with React 18 and TypeScript, featuring a unified Socket.io architecture for real-time multiplayer gameplay.

## Features

- **🎮 Complete Game Interface**: Lobby, voting, drawing, and results screens
- **🔄 Real-time Updates**: Socket.io integration with automatic reconnection
- **🎨 Advanced Drawing Canvas**: HTML5 canvas with multiple drawing tools
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🛠️ Developer Tools**: Built-in debugging and testing utilities
- **⚡ Performance Optimized**: Efficient rendering and state management

## Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn
- Running game server (see ../server/README.md)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Open browser to http://localhost:3000
```

### Environment Configuration

Create environment files for different configurations:

**.env.development:**
```env
REACT_APP_SERVER_URL=http://localhost:3001
REACT_APP_LOG_LEVEL=debug
REACT_APP_DEV_MODE=true
```

**.env.production:**
```env
REACT_APP_SERVER_URL=wss://your-production-server.com
REACT_APP_LOG_LEVEL=error
REACT_APP_DEV_MODE=false
```

## Available Scripts

### Development

```bash
npm start                    # Start development server
npm run build               # Build for production
npm run eject               # Eject from Create React App (irreversible)
```

### Testing

```bash
npm test                    # Run test suite in watch mode
npm test -- --coverage     # Run tests with coverage report
npm test -- --watchAll=false  # Run tests once (CI mode)
npm run test:e2e           # Run end-to-end tests with Playwright
```

### Analysis and Debugging

```bash
npm run analyze            # Analyze bundle size
npm run lint               # Run ESLint
npm run type-check         # Run TypeScript compiler check
```

## Architecture

### Core Components

The client follows a clean architecture with clear separation of concerns:

```
src/
├── components/           # React UI components
├── interfaces/          # TypeScript type definitions
├── services/           # Business logic services
├── utils/              # Utility functions
├── config/             # Configuration files
└── __tests__/          # Test files
```

### Key Services

- **GameManager**: Unified interface for all game operations
- **SocketGameManager**: Socket.io implementation with connection resilience
- **DevToolsService**: Developer debugging and testing utilities
- **ErrorHandler**: Comprehensive error classification and recovery

### State Management

The application uses a centralized state management approach:

- **GameState**: Single source of truth for all game data
- **State Callbacks**: Components subscribe to state changes
- **Error Handling**: Centralized error reporting and recovery

## Component Structure

### Main Components

- **App.tsx**: Root application component with routing
- **StartScreen**: Initial screen for hosting/joining games
- **LobbyScreen**: Player lobby with room management
- **VotingScreen**: Word voting interface
- **GameScreen**: Drawing canvas and game controls
- **ResultsScreen**: Final scores and AI feedback

### Utility Components

- **ConnectionStatus**: Network connection indicator
- **ErrorModal**: User-friendly error messages
- **DevTools**: Developer debugging interface
- **ReconnectionProgress**: Reconnection status display

## Development Guide

### Adding New Components

1. **Create component file:**
   ```typescript
   // components/NewComponent.tsx
   import React from 'react';
   import { GameState, GameManager } from '../interfaces';

   interface NewComponentProps {
     gameState: GameState;
     gameManager: GameManager;
   }

   export const NewComponent: React.FC<NewComponentProps> = ({
     gameState,
     gameManager
   }) => {
     return (
       <div>
         {/* Component JSX */}
       </div>
     );
   };
   ```

2. **Add corresponding test:**
   ```typescript
   // components/__tests__/NewComponent.test.tsx
   import { render, screen } from '@testing-library/react';
   import { NewComponent } from '../NewComponent';
   import { createMockGameManager, createMockGameState } from '../../utils/TestUtils';

   describe('NewComponent', () => {
     it('should render correctly', () => {
       const mockGameManager = createMockGameManager();
       const mockGameState = createMockGameState();

       render(
         <NewComponent 
           gameState={mockGameState} 
           gameManager={mockGameManager} 
         />
       );

       expect(screen.getByText('Expected text')).toBeInTheDocument();
     });
   });
   ```

3. **Add CSS styling:**
   ```css
   /* components/NewComponent.css */
   .new-component {
     /* Component styles */
   }
   ```

### Working with GameManager

The GameManager provides a unified API for all game operations:

```typescript
import { GameManager } from '../interfaces';

// Host a game
const roomCode = await gameManager.hostGame('PlayerName');

// Join a game
await gameManager.joinGame('PlayerName', 'ABC123');

// Subscribe to state changes
gameManager.onStateChange((newState) => {
  console.log('Game state updated:', newState);
});

// Handle errors
gameManager.onError((error) => {
  console.error('Game error:', error);
});
```

### Error Handling

All components should handle errors gracefully:

```typescript
try {
  await gameManager.hostGame(playerName);
} catch (error) {
  if (error.code === 'INVALID_PLAYER_NAME') {
    setErrorMessage('Please enter a valid player name');
  } else {
    setErrorMessage('Failed to host game. Please try again.');
  }
}
```

## Testing

### Test Structure

Tests are organized alongside their corresponding source files:

```
src/
├── components/
│   ├── GameScreen.tsx
│   └── __tests__/
│       └── GameScreen.test.tsx
├── services/
│   ├── SocketGameManager.ts
│   └── __tests__/
│       └── SocketGameManager.test.ts
└── utils/
    ├── validation.ts
    └── __tests__/
        └── validation.test.ts
```

### Writing Tests

Use the provided test utilities for consistent testing:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMockGameManager, createMockGameState } from '../utils/TestUtils';

describe('Component', () => {
  let mockGameManager: any;
  let mockGameState: any;

  beforeEach(() => {
    mockGameManager = createMockGameManager();
    mockGameState = createMockGameState();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    
    render(<Component gameState={mockGameState} gameManager={mockGameManager} />);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);
    
    expect(mockGameManager.someMethod).toHaveBeenCalled();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test GameScreen.test.tsx

# Run tests with coverage
npm test -- --coverage

# Run tests in CI mode (no watch)
npm test -- --watchAll=false
```

## Developer Tools

### Built-in Debugging

The application includes comprehensive developer tools:

```typescript
// Enable developer mode (development only)
if (process.env.NODE_ENV === 'development') {
  gameManager.enableDevMode?.();
  
  // Access from browser console
  (window as any).debugGame = {
    gameManager,
    simulateMultiplePlayers: (count) => devTools.simulateMultiplePlayers(count),
    skipToVoting: () => devTools.skipToVoting(),
    simulateError: (code) => devTools.simulateNetworkError()
  };
}
```

### Available Debug Commands

```javascript
// Browser console commands (development mode)
debugGame.simulateMultiplePlayers(4);  // Add 4 mock players
debugGame.skipToVoting();              // Jump to voting phase
debugGame.skipToDrawing('cat');        // Jump to drawing phase
debugGame.simulateError();             // Test error handling
debugGame.getState();                  // View current game state
debugGame.getMessages();               // View network messages
```

### Performance Monitoring

Monitor performance in development:

```typescript
// Enable performance monitoring
import { performanceMonitor } from './utils/performanceMonitor';

performanceMonitor.startTiming('render', 'COMPONENT');
// ... component render
performanceMonitor.endTiming('render', 'COMPONENT');
```

## Deployment

### Building for Production

```bash
# Create production build
npm run build

# The build folder contains optimized static files
# Deploy the contents to your web server
```

### Environment Variables

Set production environment variables:

```env
REACT_APP_SERVER_URL=wss://your-production-server.com
REACT_APP_LOG_LEVEL=error
REACT_APP_DEV_MODE=false
```

### Performance Optimization

The build process includes:

- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Remove unused code
- **Minification**: Compress JavaScript and CSS
- **Asset Optimization**: Optimize images and fonts
- **Caching**: Generate cache-friendly filenames

## Troubleshooting

### Common Issues

**Build Errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Errors:**
```bash
# Check TypeScript configuration
npm run type-check
```

**Test Failures:**
```bash
# Run tests with verbose output
npm test -- --verbose
```

### Debug Mode

Enable debug logging:

```bash
# Enable all debug logs
DEBUG=doodle:* npm start

# Enable specific debug categories
DEBUG=doodle:network,doodle:game npm start
```

### Browser DevTools

Use browser developer tools effectively:

1. **Console**: Check for JavaScript errors and debug logs
2. **Network**: Monitor WebSocket connections and API calls
3. **Application**: Inspect localStorage and sessionStorage
4. **Performance**: Profile rendering and memory usage

## Contributing

When contributing to the client:

1. **Follow TypeScript best practices**
2. **Write comprehensive tests**
3. **Add JSDoc comments for public APIs**
4. **Handle errors gracefully**
5. **Update documentation as needed**

### Code Style

- Use TypeScript strict mode
- Follow React functional component patterns
- Use hooks for state management
- Implement proper error boundaries
- Add accessibility attributes

### Testing Requirements

- Unit tests for all components and services
- Integration tests for component interactions
- E2E tests for critical user flows
- Maintain >80% code coverage

For more detailed information, see the main project documentation in the `../docs/` directory.