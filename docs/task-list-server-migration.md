# Doodle Multiplayer Game - Server Architecture Migration Plan

## Migration Overview

**FROM**: P2P (PeerJS) Architecture → **TO**: Dedicated Server (Socket.io) Architecture
**Inspiration**: Skribbl.io-style turn-based drawing and guessing game
**Approach**: Keep existing React UI components, replace networking and game logic

---

## Architecture Comparison

### Previous P2P Architecture ❌
```
Client A (Host) ←→ Client B (Player)
      ↕                ↕
  PeerJS           PeerJS
  
Issues:
- Complex AI judging on client
- Host dependency (game dies if host leaves)
- NAT traversal problems
- Synchronization challenges
```

### New Server Architecture ✅
```
Client A ←→ Server ←→ Client B
           Socket.io
           
Benefits:
- Server-authoritative game state
- Real-time drawing and chat
- No AI needed (human guessing)
- Reliable connectivity
- Turn-based gameplay
```

---

## Game Flow Changes

### **Old Flow (P2P + AI Judging)**
1. Lobby → All players draw simultaneously
2. Voting → Players vote on words
3. Drawing → Everyone draws the chosen word
4. AI Judging → AI evaluates all drawings
5. Results → Winner announced

### **New Flow (Server + Turn-based)**
1. **Lobby** → Players join room with code
2. **Round Start** → One player selected as drawer
3. **Drawing Phase** → Drawer draws, others guess in chat
4. **Scoring** → Points awarded for correct guesses
5. **Turn Rotation** → Next player becomes drawer
6. **Game End** → After all rounds, winner announced

---

## Technical Migration Plan

### Phase 1: Server Infrastructure Setup ⚡
**Timeline**: 1-2 days

#### 1.1 Server Foundation
- [ ] Create `server/` directory structure
- [ ] Setup Node.js + Express + Socket.io
- [ ] Implement basic room management
- [ ] Add player connection handling
- [ ] Create game state management

#### 1.2 Core Server Components
```typescript
// server/GameRoom.ts
interface GameRoom {
  id: string;
  players: Player[];
  currentDrawer: string;
  currentWord: string;
  roundNumber: number;
  maxRounds: number;
  gameState: 'lobby' | 'drawing' | 'results';
  scores: { [playerId: string]: number };
}

// server/GameManager.ts
class GameManager {
  rooms: Map<string, GameRoom>;
  createRoom(): string;
  joinRoom(roomId: string, player: Player): boolean;
  startGame(roomId: string): void;
  handleGuess(roomId: string, playerId: string, guess: string): void;
}
```

#### 1.3 Socket Event Handlers
```typescript
// Core socket events
socket.on('create-room', handleCreateRoom);
socket.on('join-room', handleJoinRoom);
socket.on('start-game', handleStartGame);
socket.on('drawing-stroke', handleDrawingStroke);
socket.on('chat-message', handleChatMessage);
socket.on('disconnect', handleDisconnect);
```

### Phase 2: Client Migration 🔄
**Timeline**: 2-3 days

#### 2.1 Replace P2P with Socket.io
- [ ] Remove P2PGameManager.ts
- [ ] Create SocketGameManager.ts
- [ ] Replace PeerJS with socket.io-client
- [ ] Update all network calls to use Socket.io

#### 2.2 Game State Management Update
```typescript
// client/src/services/SocketGameManager.ts
interface ClientGameState {
  roomId: string;
  players: Player[];
  currentDrawer: string;
  currentWord: string; // Only visible to drawer
  roundNumber: number;
  maxRounds: number;
  timeRemaining: number;
  chatMessages: ChatMessage[];
  scores: { [playerId: string]: number };
  isMyTurn: boolean;
}

class SocketGameManager {
  private socket: Socket;
  
  constructor(onStateChange: (state: ClientGameState) => void) {
    this.socket = io('http://localhost:3001');
    this.setupEventHandlers();
  }
  
  createRoom(playerName: string): Promise<string>;
  joinRoom(roomId: string, playerName: string): Promise<void>;
  sendDrawingStroke(strokeData: any): void;
  sendChatMessage(message: string): void;
}
```

#### 2.3 UI Component Updates
- [ ] **StartScreen**: Update to use SocketGameManager
- [ ] **LobbyScreen**: Show current drawer, turn order
- [ ] **GameScreen**: Split into DrawingView and GuessingView
- [ ] **ChatComponent**: New component for real-time chat
- [ ] **ScoreBoard**: Real-time score display

### Phase 3: New Game Features 🎯
**Timeline**: 2-3 days

#### 3.1 Turn-Based Drawing System
```typescript
// Components/DrawingView.tsx (for current drawer)
interface DrawingViewProps {
  word: string;
  timeRemaining: number;
  onStroke: (strokeData: StrokeData) => void;
}

// Components/GuessingView.tsx (for other players)
interface GuessingViewProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  chatMessages: ChatMessage[];
  onGuess: (guess: string) => void;
}
```

#### 3.2 Real-Time Chat System
```typescript
interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isCorrectGuess?: boolean;
  isSystemMessage?: boolean;
}

// Chat features
- Real-time message display
- Correct guess highlighting
- System messages (player joined, correct guess, etc.)
- Emoji support
- Chat input validation
```

#### 3.3 Scoring System
```typescript
// Time-based scoring (skribbl.io style)
function calculateGuessScore(timeToGuess: number, maxTime: number): number {
  const basePoints = 100;
  const timeBonus = Math.max(0, ((maxTime - timeToGuess) / maxTime) * 50);
  return Math.floor(basePoints + timeBonus);
}

function calculateDrawerScore(correctGuesses: number, totalPlayers: number): number {
  const percentage = correctGuesses / (totalPlayers - 1);
  return Math.floor(percentage * 75); // Max 75 points for drawer
}
```

### Phase 4: Advanced Features 🚀
**Timeline**: 1-2 days

#### 4.1 Enhanced Drawing Tools
- [ ] **Undo/Redo**: Canvas history management
- [ ] **Shapes**: Rectangle, circle, line tools
- [ ] **Fill Tool**: Bucket fill functionality
- [ ] **Eraser**: Improved eraser tool
- [ ] **Layers**: Basic layer support

#### 4.2 Game Configuration
```typescript
interface GameSettings {
  maxPlayers: number; // 2-10
  roundDuration: number; // 30s, 60s, 90s, 120s
  maxRounds: number; // 1-10
  customWords: string[]; // Custom word list
  difficulty: 'easy' | 'medium' | 'hard';
}
```

#### 4.3 Word Management
```typescript
// Difficulty-based word lists
const WORD_LISTS = {
  easy: ['cat', 'dog', 'house', 'car', 'sun'],
  medium: ['butterfly', 'mountain', 'guitar', 'laptop'],
  hard: ['metamorphosis', 'synchronization', 'philosophy']
};

// Word hint system
function generateHint(word: string, progress: number): string {
  // Progressive hints: _ _ _ → C _ _ → C A _
}
```

---

## File Structure Changes

### New Server Structure
```
server/
├── index.js                 # Express + Socket.io setup
├── gameManager.js           # Room and game state management
├── gameRoom.js              # Individual room logic
├── wordManager.js           # Word lists and selection
├── scoreCalculator.js       # Scoring algorithms
└── utils/
    ├── roomCodeGenerator.js # Generate unique room codes
    └── validation.js        # Input validation
```

### Updated Client Structure
```
client/src/
├── services/
│   ├── SocketGameManager.ts     # Replace P2PGameManager
│   └── canvasManager.ts         # Drawing utilities
├── components/
│   ├── ChatComponent.tsx        # Real-time chat
│   ├── DrawingView.tsx          # Drawer's interface
│   ├── GuessingView.tsx         # Guesser's interface
│   ├── ScoreBoard.tsx           # Live scores
│   ├── TurnIndicator.tsx        # Current drawer display
│   └── GameSettings.tsx         # Room configuration
└── hooks/
    ├── useSocket.ts             # Socket connection hook
    └── useGameState.ts          # Game state management
```

---

## Migration Checklist

### Server Development
- [ ] **Setup**: Node.js project with dependencies
- [ ] **Room Management**: Create, join, leave rooms
- [ ] **Game Logic**: Turn rotation, word selection, timing
- [ ] **Real-Time**: Drawing stroke broadcasting
- [ ] **Chat**: Message handling with guess detection
- [ ] **Scoring**: Point calculation and leaderboards
- [ ] **Persistence**: Optional game history storage

### Client Migration
- [ ] **Networking**: Replace P2P with Socket.io
- [ ] **State Management**: Update for server-authoritative state
- [ ] **UI Components**: Adapt for turn-based gameplay
- [ ] **Drawing**: Real-time stroke synchronization
- [ ] **Chat**: Integrate guessing interface
- [ ] **Responsive**: Mobile-optimized interface

### Testing & Deployment
- [ ] **Local Testing**: Multi-client testing setup
- [ ] **Performance**: Canvas and network optimization
- [ ] **Security**: Input validation, rate limiting
- [ ] **Deployment**: Cloud hosting setup (Railway/Render)
- [ ] **Monitoring**: Error tracking and analytics

---

## Benefits of Migration

### Technical Benefits
✅ **Simplified Architecture** - No complex P2P networking
✅ **Server Authority** - Prevents cheating, ensures fair play
✅ **Reliable Connections** - No NAT traversal issues
✅ **Real-Time Features** - WebSocket-based instant updates
✅ **Scalable Hosting** - Standard web hosting platforms

### Gameplay Benefits
✅ **More Engaging** - Turn-based creates anticipation
✅ **Social Interaction** - Chat-based guessing is inherently fun
✅ **Natural Judging** - Human guessing > AI evaluation
✅ **Proven Model** - Skribbl.io validates the approach
✅ **Extensible** - Easy to add features like tournaments, teams

### Development Benefits
✅ **Faster Development** - No AI complexity
✅ **Easier Testing** - Predictable server environment
✅ **Better Debugging** - Centralized state management
✅ **Community Features** - Room browsing, leaderboards, etc.

---

## Risk Mitigation

### Technical Risks
- **Server Costs**: Use free tiers initially (Railway, Render)
- **Scalability**: Design for horizontal scaling from start
- **Real-Time Performance**: Optimize drawing stroke frequency

### Gameplay Risks
- **Player Engagement**: Add progression, achievements
- **Chat Moderation**: Implement word filtering, reporting
- **Game Balance**: Playtesting for fair scoring

---

## Timeline Summary

**Week 1**: Server infrastructure + basic room management
**Week 2**: Client migration + turn-based gameplay
**Week 3**: Chat system + scoring + polish
**Week 4**: Testing + deployment + advanced features

**Total Estimated Time**: 3-4 weeks for full migration

This migration transforms the project from a complex P2P system to a proven, scalable server architecture that's more fun, reliable, and easier to develop.