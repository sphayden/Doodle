@echo off
REM Doodle Game Startup Script for Windows
REM This script starts both the backend server and frontend client

echo 🎮 Starting Doodle Multiplayer Drawing Game...
echo ==========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm and try again.
    pause
    exit /b 1
)

echo 📦 Checking dependencies...

REM Install server dependencies if needed
if not exist "server\node_modules" (
    echo 📥 Installing server dependencies...
    cd server
    call npm install
    cd ..
)

REM Install client dependencies if needed
if not exist "doodle-revamp\client\node_modules" (
    echo 📥 Installing client dependencies...
    cd doodle-revamp\client
    call npm install
    cd ..\..
)

echo ✅ Dependencies ready!
echo.

REM Start the backend server
echo 🚀 Starting backend server on port 3001...
cd server
start "Doodle Backend Server" cmd /k "npm start"
cd ..

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Start the frontend client
echo 🚀 Starting frontend client on port 3000...
cd doodle-revamp\client
start "Doodle Frontend Client" cmd /k "npm start"
cd ..\..

echo ✅ Both servers are starting up!
echo.
echo 🎉 Game will be ready shortly!
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:3001
echo.
echo Two command windows have opened:
echo - One for the backend server (port 3001)
echo - One for the frontend client (port 3000)
echo.
echo Close both windows to stop the servers.
echo.
pause