# Doodle - Multiplayer Drawing Game

A modern multiplayer drawing game with real-time lobbies, voting, and AI-powered judging. Built with a unified Socket.io architecture for reliable real-time gameplay.

## Features

- **🎮 Complete Game Flow**: Lobby → Voting → Drawing → AI Judging → Results
- **👥 Multiplayer Lobbies**: Up to 8 players with real-time synchronization
- **🗳️ Word Voting System**: Democratic word selection with tie-breaker handling
- **🎨 Advanced Drawing Canvas**: Full-featured drawing tools with real-time strokes
- **🤖 AI-Powered Judging**: Intelligent drawing evaluation and scoring
- **🔄 Connection Resilience**: Automatic reconnection and error recovery
- **🛠️ Developer Tools**: Comprehensive debugging and testing utilities
- **📱 Responsive Design**: Works on desktop and mobile devices

## Architecture

This project uses a **unified Socket.io architecture** that provides:

- **Clean Separation of Concerns**: UI, networking, and game logic are clearly separated
- **Interface-Based Design**: All components use TypeScript interfaces for type safety
- **Comprehensive Error Handling**: Automatic recovery and user-friendly error messages
- **Developer-Friendly**: Rich debugging tools and extensive documentation

### Tech Stack

**Backend:**
- Node.js + Express server
- Socket.io for real-time communication
- AI integration for drawing evaluation
- Room-based game management

**Frontend:**
- React 18 + TypeScript
- Socket.io-client for real-time updates
- HTML5 Canvas for drawing
- Comprehensive error handling and recovery
- Built-in developer tools and debugging utilities

**Key Components:**
- `GameManager Interface`: Unified API for all game operations
- `SocketGameManager`: Socket.io implementation with connection resilience
- `DevToolsService`: Advanced debugging and testing capabilities
- `Error Handling System`: Comprehensive error classification and recovery

## Quick Start

### Prerequisites
- **Node.js 18+** and npm
- Modern web browser with WebSocket support
- Basic knowledge of React and TypeScript (for development)

### Installation & Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd doodle
   
   # Install all dependencies (server + client)
   npm run install:all
   ```

2. **Configure environment variables:**
   
   **Server (.env in server/ directory):**
   ```env
   PORT=3001
   NODE_ENV=development
   OPENAI_API_KEY=your_openai_api_key_here
   CLIENT_URL=http://localhost:3000
   MAX_PLAYERS_PER_ROOM=8
   DRAWING_TIME_LIMIT=60
   ROOM_CODE_LENGTH=6
   ```
   
   **Client (.env in doodle-revamp/client/ directory):**
   ```env
   REACT_APP_SERVER_URL=http://localhost:3001
   REACT_APP_DEBUG_MODE=true
   ```

3. **Start the application:**
   
   **Option 1 - Start both server and client together:**
   ```bash
   npm start
   # Server will run on http://localhost:3001
   # Client will run on http://localhost:3000
   ```
   
   **Option 2 - Start separately:**
   ```bash
   # Terminal 1 - Start the server
   npm run start:server
   
   # Terminal 2 - Start the client
   npm run start:client
   ```

4. **Open your browser:**
   - Game: http://localhost:3000
   - Server API: http://localhost:3001

### Development Setup

For development with hot reloading and debugging tools:

```bash
# Start both server and client in development mode
npm run dev

# Or start separately:
npm run dev:server    # Server with nodemon
npm run dev:client    # Client with hot reload
```

### Testing

```bash
# Run all tests (server + client)
npm test

# Run tests separately
npm run test:server   # Server tests
npm run test:client   # Client tests with coverage

# Run client tests in watch mode
cd doodle-revamp/client
npm test
```

### Building for Production

```bash
# Build client for production
npm run build

# The built files will be in doodle-revamp/client/build/
```

## How to Play

### Game Flow

1. **🏠 Host or Join**: Create a new game or join with a room code
2. **👥 Lobby**: Wait for 2-8 players to join
3. **🗳️ Voting**: All players vote on which word to draw
4. **🎨 Drawing**: Race against time (60 seconds) to draw the chosen word
5. **🤖 AI Judging**: AI evaluates all drawings for creativity and accuracy
6. **🏆 Results**: See scores, rankings, and AI feedback

### Controls

**Drawing:**
- **Mouse/Touch**: Draw on the canvas
- **Color Picker**: Choose from multiple colors
- **Brush Size**: Adjust brush thickness
- **Clear**: Start over with a blank canvas
- **Submit**: Submit your drawing when finished

**Game Actions:**
- **Host**: Start voting phase, manage game flow
- **Players**: Vote for words, submit drawings
- **All**: View real-time game updates and player status

## Project Structure

```
doodle/
├── server/                    # Node.js backend
│   ├── index.js              # Server entry point
│   ├── gameManager.js        # Game logic and room management
│   ├── aiJudge.js            # AI drawing evaluation
│   ├── utils/                # Server utilities
│   ├── config/               # Server configuration
│   └── package.json          # Server dependencies
├── doodle-revamp/            # React frontend
│   ├── client/
│   │   ├── src/
│   │   │   ├── components/   # React UI components
│   │   │   ├── interfaces/   # TypeScript interfaces
│   │   │   ├── services/     # Business logic services
│   │   │   ├── utils/        # Utility functions
│   │   │   ├── config/       # Configuration files
│   │   │   └── __tests__/    # Test files
│   │   ├── public/           # Static assets
│   │   └── package.json      # Frontend dependencies
│   └── docs/                 # Documentation
│       ├── ARCHITECTURE.md   # Architecture overview
│       ├── DEVELOPER_GUIDE.md # Developer onboarding
│       ├── TESTING_GUIDE.md  # Testing strategies
│       └── TROUBLESHOOTING.md # Debugging guide
├── package.json              # Root package.json with unified scripts
└── README.md                 # This file
```

## Available Scripts

**Root Level (Unified Commands):**
```bash
npm start              # Start both server and client
npm run dev            # Start both in development mode
npm run install:all    # Install all dependencies
npm test               # Run all tests
npm run build          # Build client for production
```

**Server Commands:**
```bash
npm run start:server   # Start production server
npm run dev:server     # Start development server with hot reload
npm run test:server    # Run server tests
```

**Client Commands:**
```bash
npm run start:client   # Start client development server
npm run test:client    # Run client tests
npm run build:client   # Build client for production
```

## Environment Configuration

### Development Environment

**Server (.env in server/ directory):**
```env
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
CLIENT_URL=http://localhost:3000
MAX_PLAYERS_PER_ROOM=8
DRAWING_TIME_LIMIT=60
ROOM_CODE_LENGTH=6
```

**Client (.env in doodle-revamp/client/ directory):**
```env
REACT_APP_SERVER_URL=http://localhost:3001
REACT_APP_DEBUG_MODE=true
```

### Production Environment

**Server (.env.production):**
```env
PORT=3001
NODE_ENV=production
OPENAI_API_KEY=your_production_openai_key
CLIENT_URL=https://your-domain.com
MAX_PLAYERS_PER_ROOM=8
DRAWING_TIME_LIMIT=60
ROOM_CODE_LENGTH=6
```

**Client (.env.production):**
```env
REACT_APP_SERVER_URL=wss://your-production-server.com
REACT_APP_DEBUG_MODE=false
```

### Environment Variables Reference

**Server Variables:**
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `OPENAI_API_KEY`: OpenAI API key for AI judging (optional)
- `CLIENT_URL`: Client URL for CORS configuration
- `MAX_PLAYERS_PER_ROOM`: Maximum players per game room
- `DRAWING_TIME_LIMIT`: Drawing phase time limit in seconds
- `ROOM_CODE_LENGTH`: Length of generated room codes

**Client Variables:**
- `REACT_APP_SERVER_URL`: Backend server URL
- `REACT_APP_DEBUG_MODE`: Enable debug features and logging

## Debugging and Developer Tools

### Built-in Developer Tools

The game includes comprehensive developer tools for debugging and testing:

```typescript
// Enable developer mode (development only)
gameManager.enableDevMode?.();

// Access debugging tools from browser console
window.debugGame.simulateMultiplePlayers(4);
window.debugGame.skipToVoting();
window.debugGame.simulateNetworkError();
```

### Available Debug Features

- **State Simulation**: Test different game phases and scenarios
- **Network Debugging**: Monitor WebSocket messages and connection health
- **Error Simulation**: Test error handling and recovery mechanisms
- **Performance Monitoring**: Track rendering and network performance
- **Session Export**: Export game sessions for debugging

### Debugging Commands

```bash
# Enable verbose logging
DEBUG=doodle:* npm start

# Run specific tests
npm test -- --testNamePattern="GameManager"

# Analyze bundle size (client)
cd doodle-revamp/client
npm run build
npx webpack-bundle-analyzer build/static/js/*.js

# Check for security vulnerabilities
npm audit
```

### Common Debugging Scenarios

**Connection Issues:**
1. Check server is running on correct port
2. Verify environment variables are set correctly
3. Check browser console for WebSocket errors
4. Use developer tools to inspect network messages

**Game State Issues:**
1. Use built-in state inspector in developer tools
2. Check for TypeScript errors in browser console
3. Verify game state transitions in network tab
4. Export game session for detailed analysis

**Performance Issues:**
1. Use React DevTools Profiler
2. Monitor WebSocket message frequency
3. Check for memory leaks in long-running games
4. Analyze bundle size and loading performance

## Testing

### Test Structure

```bash
# Client Tests
doodle-revamp/client/src/__tests__/
├── components/           # Component tests
├── services/            # Service layer tests
├── utils/               # Utility function tests
└── integration/         # Integration tests

# Server Tests
server/__tests__/
├── gameManager.test.js  # Game logic tests
├── aiJudge.test.js      # AI judging tests
└── utils/               # Server utility tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:client -- --coverage

# Run tests in watch mode
cd doodle-revamp/client
npm test

# Run specific test files
npm test -- GameManager.test.ts
npm test -- --testNamePattern="connection"
```

### Test Categories

**Unit Tests:**
- Component rendering and interactions
- Service method functionality
- Utility function behavior
- Error handling scenarios

**Integration Tests:**
- GameManager with real network layer
- Component integration with services
- End-to-end game flow scenarios
- Error recovery mechanisms

**Performance Tests:**
- Network message handling
- Canvas rendering performance
- Memory usage monitoring
- Connection resilience

## Documentation

Comprehensive documentation is available in the `doodle-revamp/docs/` directory:

- **[Architecture Guide](doodle-revamp/docs/ARCHITECTURE.md)**: Technical architecture and design decisions
- **[Developer Guide](doodle-revamp/docs/DEVELOPER_GUIDE.md)**: Onboarding and development workflow
- **[Testing Guide](doodle-revamp/docs/TESTING_GUIDE.md)**: Testing strategies and best practices
- **[Troubleshooting Guide](doodle-revamp/docs/TROUBLESHOOTING.md)**: Common issues and solutions

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository** and create a feature branch
2. **Read the documentation** in the `doodle-revamp/docs/` directory
3. **Follow the coding standards** (TypeScript, JSDoc comments, error handling)
4. **Write tests** for new features and bug fixes
5. **Test thoroughly** including edge cases and error scenarios
6. **Update documentation** if needed
7. **Submit a pull request** with a clear description

### Development Workflow

1. **Setup**: Follow the installation instructions above
2. **Branch**: Create a feature branch from `main`
3. **Develop**: Use the developer tools and debugging features
4. **Test**: Run the full test suite and add new tests
5. **Document**: Update JSDoc comments and guides as needed
6. **Review**: Submit PR and address feedback

### Code Standards

- **TypeScript**: Use strict typing and interfaces
- **JSDoc**: Document all public methods and classes
- **Error Handling**: Implement comprehensive error recovery
- **Testing**: Write unit and integration tests
- **Performance**: Consider performance implications
- **Accessibility**: Ensure UI is accessible

## Troubleshooting

### Common Issues

**"Cannot connect to server":**
- Verify server is running: `npm run start:server`
- Check server URL in client environment variables
- Ensure no firewall blocking port 3001

**"Room not found" errors:**
- Check room code is entered correctly
- Verify server is maintaining room state
- Check for server restarts that clear room data

**Drawing canvas not working:**
- Ensure browser supports HTML5 Canvas
- Check for JavaScript errors in console
- Verify Fabric.js is loaded correctly

**AI judging not working:**
- Check OPENAI_API_KEY is set correctly
- Verify OpenAI API quota and billing
- Check server logs for API errors

**Tests failing:**
- Run `npm run install:all` to ensure dependencies are up to date
- Clear node_modules and reinstall if needed
- Check for version conflicts in package.json files

### Getting Help

- **Documentation**: Check the comprehensive guides in `doodle-revamp/docs/`
- **Issues**: Report bugs via GitHub Issues
- **Debugging**: Use built-in developer tools and debugging guides
- **Community**: Join discussions in GitHub Discussions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React, Node.js, and Socket.io
- AI judging powered by OpenAI
- Canvas drawing with Fabric.js
- UI components with React Bootstrap
