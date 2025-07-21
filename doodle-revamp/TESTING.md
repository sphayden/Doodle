# 🧪 Testing Guide - Doodle Game Tie Breaker

This guide explains how to easily test the tie breaker functionality without manually setting up games every time.

## 🚀 Quick Start

### Method 1: Built-in Test Panel (Recommended)

1. **Start the React app:**
   ```bash
   cd client
   npm start
   ```

2. **Open the app:**
   Go to `http://localhost:3000`

3. **Use the test panel:**
   - Look for the 🧪 **Test Mode** button in the top-right corner
   - Click it to open the test panel
   - Click **🎯 Quick Tie Test** to immediately see the tie breaker

### Method 2: Browser Console Commands

1. **Start the app** (same as above)

2. **Open browser console** (F12)

3. **Use these commands:**
   ```javascript
   // Quick tie breaker test
   quickTestTie()
   
   // Simulate voting with tie
   simulateTieVoting()
   
   // Check current game state
   checkGameState()
   
   // Reset the game
   resetGame()
   ```

### Method 3: Test Page

1. **Open the test page:**
   Open `test-page.html` in your browser

2. **Use the buttons** to test different scenarios

3. **Follow the instructions** on the page

## 🎯 Testing Scenarios

### Tie Breaker Modal Test
- **What it tests:** The spinning wheel animation and tie resolution
- **How to trigger:** Click "🎯 Quick Tie Test" in the test panel
- **Expected result:** Modal appears with spinning wheel, randomly selects an option

### Voting with Tie Test
- **What it tests:** Vote counting and tie detection
- **How to trigger:** Use `simulateTieVoting()` in console
- **Expected result:** Voting screen with tied options

### Game State Transitions
- **What it tests:** Game flow from voting to drawing
- **How to trigger:** Use `simulateGameStart()` in console
- **Expected result:** Game screen with chosen word

## 🔧 Development Tools

### TestUtils Component
Located in `client/src/utils/TestUtils.tsx`
- Provides a floating test panel
- Only shows in development mode
- Includes quick test buttons

### Browser Automation Script
Located in `test-automation.js`
- Provides console commands
- Can be loaded in any browser
- Works with both React and Vue versions

### Test Page
Located in `test-page.html`
- Standalone testing interface
- Beautiful UI with test buttons
- Status feedback for each test

## 🐛 Debugging

### Console Logs
The test functions include detailed console logging:
- `🧪 [TEST]` - Test utility logs
- `🎯 [APP]` - App simulation logs
- `🎲 [P2P]` - P2P game manager logs

### Common Issues

**Test panel not showing:**
- Make sure you're in development mode (`NODE_ENV=development`)
- Check that the React app is running on localhost

**Tie breaker not working:**
- Check browser console for errors
- Verify that the P2P game manager is initialized
- Make sure the socket connection is established

**Animation not smooth:**
- Check browser performance
- Verify CSS animations are enabled
- Try reducing the spin duration in `TieBreakerModal.css`

## 🎮 Manual Testing Steps

If you want to test the full game flow manually:

1. **Create a lobby:**
   - Start the app
   - Click "Create Game"
   - Copy the room code

2. **Join with multiple browsers/tabs:**
   - Open multiple browser windows/tabs
   - Join the same room with different names
   - Have at least 2-3 players

3. **Trigger a tie:**
   - Start the game
   - Vote for the same option multiple times
   - Create a tie scenario

4. **Observe the tie breaker:**
   - All players should see the spinning wheel
   - Animation should be synchronized
   - Random selection should work

## 📝 Test Data

### Default Test Options
- **Tie options:** `['Cat', 'Dog', 'House']`
- **Voting options:** `['Cat', 'Dog', 'House', 'Tree']`
- **Test votes:** `{ 'Cat': 2, 'Dog': 2, 'House': 1, 'Tree': 0 }`
- **Test word:** `'Cat'`

### Customizing Test Data
You can modify the test data in:
- `TestUtils.tsx` - Built-in test panel
- `test-automation.js` - Console commands
- `test-page.html` - Test page

## 🎯 Quick Commands Reference

```javascript
// Quick tie test
quickTestTie()

// Simulate players
simulatePlayers(4)

// Simulate voting
simulateTieVoting()

// Check state
checkGameState()

// Reset game
resetGame()

// Access all functions
window.tieBreakerTests
```

## 🚨 Troubleshooting

### Test panel not appearing
```javascript
// Check if in development mode
console.log(process.env.NODE_ENV)

// Manually trigger test
window.simulateTie && window.simulateTie(['Test1', 'Test2'])
```

### Tie breaker not showing
```javascript
// Check game state
checkGameState()

// Force tie breaker
window.simulateTie && window.simulateTie(['Cat', 'Dog'])
```

### Animation issues
```javascript
// Check CSS animations
document.body.style.animation = 'none'
document.body.style.animation = ''
```

---

**Happy Testing! 🎲✨** 