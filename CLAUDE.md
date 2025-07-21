# Doodle Project - AI Assistant Memory

## Project Overview
<!-- Please fill in the project details and end goal below -->

### Current State
- Legacy ASP.NET MVC application with SignalR (in `/Doodle/` folder)
- New React/Node.js revamp (in `/doodle-revamp/` folder) with P2P implementation
- **MIGRATION IN PROGRESS**: Moving from P2P to dedicated server architecture

- The Legacy code is the initial application 6 years ago. 
- in `/doodle-revamp/` contains P2P client game that is being migrated to server-based architecture.

### End Goal
A browser-based multiplayer drawing game inspired by skribbl.io's infrastructure where ALL players draw the same word simultaneously, and an AI judges which drawing best represents the word. The game features real-time drawing, AI-powered evaluation, and competitive scoring.

### Key Requirements (Updated for Server Architecture)
 - **Lobby System**: Players join rooms via unique codes hosted on dedicated server
 - **Word Selection**: Players vote on words from predetermined lists (keeping original voting system)
 - **Simultaneous Drawing**: ALL players draw the chosen word at the same time (60 seconds)
 - **Real-Time Drawing**: Live drawing strokes broadcast to all players for spectating
 - **AI Judging**: AI evaluates all drawings and determines winner based on accuracy to word
 - **Drawing Tools**: Full drawing palette with colors, brush sizes, shapes, undo/redo
 - **Scoring System**: Points awarded based on AI ranking (1st place = most points)
 - **Results Screen**: AI scores, winner announcement, and drawing gallery

### Technical Constraints (Updated)
 - **Server-Based Architecture**: Dedicated Node.js server with Socket.io for real-time communication
 - **Browser-Based**: Accessible via web browser without downloads
 - **Real-Time Communication**: WebSocket connections for live drawing and chat
 - **Modern Framework**: React + TypeScript frontend with responsive design
 - **Scalable Hosting**: Deployable to modern cloud platforms (Railway, Render, Fly.io)

### Priority Tasks (Updated)
 1. **Server Infrastructure**: Node.js + Socket.io backend with room management ✅
 2. **Word Voting System**: Migrate existing voting logic to server-based ✅
 3. **Simultaneous Drawing**: All players draw at once with real-time stroke sync
 4. **AI Judging Integration**: Server-side AI evaluation of all drawings
 5. **Results & Scoring**: AI-ranked results with drawing gallery display

### Recent Implementations (2025-07-21)
#### ✅ Automatic Tie Breaker System
- **Location**: `/server/gameManager.js`, `/server/index.js`
- **Functionality**: When word voting results in a tie, the system automatically resolves it with visual feedback
- **Flow**: 
  1. Tie detection → `tiebreaker-started` event (shows tied words)
  2. 3-second delay for visual feedback
  3. Random word selection → `tiebreaker-resolved` event (shows chosen word)
  4. 1.5-second delay to display result
  5. Drawing phase begins with chosen word
- **Key Methods**:
  - `gameRoom.checkForTie()`: Detects voting ties
  - `gameManager.autoResolveTiebreaker()`: Randomly selects from tied words
- **Events**: `tiebreaker-started`, `tiebreaker-resolved`, `drawing-started`
- **Testing**: `test-tiebreaker.js` verifies complete flow with proper timing

#### 🎯 Key Features Implemented
- **Random Selection**: Uses `Math.random()` to fairly choose from tied words
- **Visual Feedback**: 4.5-second total delay ensures players see the tiebreaker process
- **Real-time Events**: All players receive synchronized tiebreaker notifications
- **Comprehensive Testing**: Automated test validates tie detection, resolution, and timing

### Development Commands
- **Start Server**: `cd server && npm start` (runs on port 3002)
- **Test Tiebreaker**: `node test-tiebreaker.js` (requires running server)
- **Kill Server**: `taskkill //PID <PID> //F` (find PID with `netstat -ano | findstr :3002`)

 # Author Notes
 - Take the art style from the doodle-revamp, but you do not have to follow the existing code. Create this in a secure and modern way like a seasoned software engineer.
---
*This file helps the AI assistant understand the project context and goals throughout our conversation.*