# Doodle Revamp - Multiplayer Drawing Game

A modern multiplayer drawing game with real-time lobbies, voting, and AI-powered judging.

## Features

- **Lobby System**: Up to 8 players can join a lobby
- **Word Voting**: Players vote on what word to draw
- **Real-time Multiplayer**: Built with Socket.io for instant updates
- **Modern UI**: React + TypeScript frontend
- **AI Judging**: OpenAI integration for intelligent drawing evaluation (coming soon)

## Tech Stack

### Backend
- Node.js + Express
- Socket.io for real-time communication
- OpenAI API for AI judging

### Frontend
- React 18 + TypeScript
- Bootstrap for responsive design
- Fabric.js for advanced canvas drawing (coming soon)
- Socket.io-client for real-time updates

## Getting Started

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. **Install backend dependencies:**
```bash
npm install
```

2. **Install frontend dependencies:**
```bash
cd client
npm install
cd ..
```

3. **Set up environment variables:**
Create a `.env` file in the root directory:
```env
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

### Running the Application

1. **Start the backend server:**
```bash
npm run dev
```

2. **In a new terminal, start the frontend:**
```bash
cd client
npm start
```

3. **Open your browser:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Game Flow

1. **Start Screen**: Enter your name to join
2. **Lobby**: Wait for other players (2-8 players)
3. **Voting**: Vote on which word to draw
4. **Drawing**: Race against time to create the best drawing
5. **Judging**: AI evaluates all drawings and declares a winner

## Current Status

✅ **Completed:**
- Node.js backend with Socket.io
- React frontend with TypeScript
- Lobby system (up to 8 players)
- Word voting system
- Real-time player management
- Original styling preserved

🚧 **In Progress:**
- Advanced canvas with Fabric.js
- OpenAI integration for judging
- Drawing tools (brushes, colors, sizes)
- End game results screen

## Development

### Scripts
- `npm run dev` - Start backend in development mode
- `npm start` - Start backend in production mode
- `npm run install-all` - Install all dependencies

### Project Structure
```
doodle-revamp/
├── server.js          # Backend server
├── config.js          # Configuration
├── package.json       # Backend dependencies
└── client/            # React frontend
    ├── src/
    │   ├── components/    # React components
    │   ├── App.tsx        # Main app component
    │   └── index.tsx      # Entry point
    └── package.json       # Frontend dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Next Steps

1. Implement advanced canvas with Fabric.js
2. Add OpenAI integration for drawing evaluation
3. Create results screen with scoring
4. Add player avatars and profiles
5. Implement room codes for private lobbies 