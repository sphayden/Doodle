#!/bin/bash

# Doodle Game Startup Script
# This script starts both the backend server and frontend client

echo "🎮 Starting Doodle Multiplayer Drawing Game..."
echo "=========================================="

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "📦 Checking dependencies..."

# Install server dependencies if needed
if [ ! -d "server/node_modules" ]; then
    echo "📥 Installing server dependencies..."
    cd server
    npm install
    cd ..
fi

# Install client dependencies if needed
if [ ! -d "doodle-revamp/client/node_modules" ]; then
    echo "📥 Installing client dependencies..."
    cd doodle-revamp/client
    npm install
    cd ../..
fi

echo "✅ Dependencies ready!"
echo ""

# Start the backend server
echo "🚀 Starting backend server on port 3001..."
cd server
npm start &
SERVER_PID=$!
cd ..

# Wait a moment for server to start
sleep 3

# Check if server started successfully
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Failed to start backend server"
    exit 1
fi

echo "✅ Backend server started (PID: $SERVER_PID)"

# Start the frontend client
echo "🚀 Starting frontend client on port 3000..."
cd doodle-revamp/client
npm start &
CLIENT_PID=$!
cd ../..

# Wait a moment for client to start
sleep 3

# Check if client started successfully
if ! kill -0 $CLIENT_PID 2>/dev/null; then
    echo "❌ Failed to start frontend client"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend client started (PID: $CLIENT_PID)"
echo ""
echo "🎉 Game is ready!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $SERVER_PID $CLIENT_PID