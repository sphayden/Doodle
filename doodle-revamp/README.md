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
- **Node.js 16+** and npm
- Modern web browser with WebSocket support
- Basic knowledge of React and TypeScript (for development)

### Installation & Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd doodle-revamp
   
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

2. **Configure environment variables:**
   
   **Server (.env in server/ directory):**
   ```env
   PORT=3001
   NODE_ENV=development
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   
   **Client (.env in client/ directory):**
   ```env
   REACT_APP_SERVER_URL=http://localhost:3001
   REACT_APP_LOG_LEVEL=debug
   REACT_APP_DEV_MODE=true
   ```

3. **Start the application:**
   
   **Terminal 1 - Start the server:**
   ```bash
   cd server
   npm start
   # Server will run on http://localhost:3001
   ```
   
   **Terminal 2 - Start the client:**
   ```bash
   cd client
   npm start
   # Client will run on http://localhost:3000
   ```

4. **Open your browser:**
   - Game: http://localhost:3000
   - Server API: http://localhost:3001

### Development Setup

For development with hot reloading and debugging tools:

```bash
# Start server in development mode
cd server
npm run dev

# Start client in development mode (separate terminal)
cd client
npm start
```

### Testing

```bash
# Run all tests
cd client
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run end-to-end tests
npm run test:e2e
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

## Project Status

### ✅ Completed Features

**Core Architecture:**
- Unified Socket.io-based networking architecture
- Comprehensive TypeScript interfaces and type safety
- Robust error handling and automatic recovery
- Connection resilience with exponential backoff
- Developer tools and debugging utilities

**Game Features:**
- Complete multiplayer lobby system (2-8 players)
- Real-time word voting with tie-breaker handling
- Advanced HTML5 canvas drawing with multiple tools
- AI-powered drawing evaluation and scoring
- Comprehensive results screen with rankings and feedback
- Real-time game state synchronization

**Developer Experience:**
- Extensive JSDoc documentation
- Comprehensive test suite (unit, integration, E2E)
- Developer debugging tools and state simulation
- Performance monitoring and optimization
- Detailed architecture and troubleshooting guides

### 🔄 Ongoing Improvements

- Performance optimizations for large player counts
- Enhanced mobile touch support
- Additional drawing tools and effects
- Spectator mode for watching games
- Game replay and session export features

## Development

### Available Scripts

**Server:**
```bash
cd server
npm start          # Start production server
npm run dev        # Start development server with hot reload
npm test           # Run server tests
```

**Client:**
```bash
cd client
npm start          # Start development server
npm run build      # Build for production
npm test           # Run test suite
npm test -- --coverage  # Run tests with coverage
npm run test:e2e   # Run end-to-end tests
npm run analyze    # Analyze bundle size
```

### Project Structure

```
doodle-revamp/
├── server/                 # Node.js backend
│   ├── index.js           # Server entry point
│   ├── gameManager.js     # Game logic and room management
│   ├── aiJudge.js         # AI drawing evaluation
│   └── utils/             # Server utilities
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React UI components
│   │   ├── interfaces/    # TypeScript interfaces
│   │   ├── services/      # Business logic services
│   │   ├── utils/         # Utility functions
│   │   ├── config/        # Configuration files
│   │   └── __tests__/     # Test files
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md    # Architecture overview
│   ├── DEVELOPER_GUIDE.md # Developer onboarding
│   ├── TESTING_GUIDE.md   # Testing strategies
│   └── TROUBLESHOOTING.md # Debugging guide
└── README.md              # This file
```

### Key Files and Directories

**Core Interfaces:**
- `client/src/interfaces/GameManager.ts` - Main game interface definitions
- `client/src/interfaces/NetworkManager.ts` - Network communication interfaces

**Services:**
- `client/src/services/SocketGameManager.ts` - Socket.io game implementation
- `client/src/services/DevToolsService.ts` - Developer debugging tools

**Components:**
- `client/src/components/` - All React UI components
- `client/src/App.tsx` - Main application component

**Utilities:**
- `client/src/utils/errorHandling.ts` - Error classification and handling
- `client/src/utils/networkResilience.ts` - Connection resilience features
- `client/src/utils/validation.ts` - Input validation utilities

## Environment Configuration

### Development Environment

**Client (.env.development):**
```env
REACT_APP_SERVER_URL=http://localhost:3001
REACT_APP_LOG_LEVEL=debug
REACT_APP_DEV_MODE=true
```

**Server (.env.development):**
```env
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
LOG_LEVEL=debug
```

### Production Environment

**Client (.env.production):**
```env
REACT_APP_SERVER_URL=wss://your-production-server.com
REACT_APP_LOG_LEVEL=error
REACT_APP_DEV_MODE=false
```

**Server (.env.production):**
```env
PORT=3001
NODE_ENV=production
OPENAI_API_KEY=your_production_openai_key
LOG_LEVEL=error
```

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

# Analyze bundle size
npm run analyze

# Check for security vulnerabilities
npm audit
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Architecture Guide](docs/ARCHITECTURE.md)**: Technical architecture and design decisions
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)**: Onboarding and development workflow
- **[Testing Guide](docs/TESTING_GUIDE.md)**: Testing strategies and best practices
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)**: Common issues and solutions

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository** and create a feature branch
2. **Read the documentation** in the `docs/` directory
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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Documentation**: Check the `docs/` directory for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Debugging**: Use the built-in developer tools and debugging guides
- **Community**: Join discussions and ask questions in GitHub Discussions 