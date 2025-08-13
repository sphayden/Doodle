# Troubleshooting and Debugging Guide

This guide provides comprehensive troubleshooting steps and debugging techniques for common issues in the Doodle multiplayer drawing game.

## Table of Contents

- [Common Issues](#common-issues)
- [Connection Problems](#connection-problems)
- [Game State Issues](#game-state-issues)
- [Performance Problems](#performance-problems)
- [Testing Issues](#testing-issues)
- [Development Environment](#development-environment)
- [Debugging Tools](#debugging-tools)
- [Error Analysis](#error-analysis)
- [Network Debugging](#network-debugging)
- [Browser-Specific Issues](#browser-specific-issues)

## Common Issues

### Issue: Cannot Connect to Game Server

**Symptoms:**
- "Connection failed" error messages
- Infinite loading when hosting/joining games
- WebSocket connection errors in browser console

**Diagnosis Steps:**
1. Check if server is running:
   ```bash
   cd server
   npm start
   # Should see "Server running on port 3001"
   ```

2. Verify server URL in client configuration:
   ```typescript
   // Check .env files
   REACT_APP_SERVER_URL=http://localhost:3001
   ```

3. Check browser network tab for failed requests

**Solutions:**
- Ensure server is running on correct port
- Check firewall settings
- Verify CORS configuration in server
- Try different browser or incognito mode

**Prevention:**
- Use environment variables for server URLs
- Implement health check endpoints
- Add connection status indicators

### Issue: Game State Not Updating

**Symptoms:**
- UI doesn't reflect game changes
- Players don't see each other's actions
- Stuck in loading states

**Diagnosis Steps:**
1. Check state change callbacks:
   ```typescript
   gameManager.onStateChange((state) => {
     console.log('State updated:', state);
   });
   ```

2. Verify GameManager initialization:
   ```typescript
   const gameManager = new SocketGameManager(
     handleStateChange, // Make sure this is defined
     tieBreakerCallbacks
   );
   ```

3. Check for memory leaks in event listeners

**Solutions:**
- Ensure state callbacks are properly registered
- Check for component unmounting issues
- Verify GameManager is not destroyed prematurely
- Use React DevTools to inspect component state

### Issue: Drawing Canvas Not Working

**Symptoms:**
- Cannot draw on canvas
- Drawing strokes not appearing
- Canvas appears blank

**Diagnosis Steps:**
1. Check canvas element exists:
   ```typescript
   const canvas = document.getElementById('drawingCanvas');
   console.log('Canvas element:', canvas);
   ```

2. Verify canvas context:
   ```typescript
   const ctx = canvas.getContext('2d');
   console.log('Canvas context:', ctx);
   ```

3. Check for CSS issues affecting canvas size

**Solutions:**
- Ensure canvas has proper dimensions
- Check for CSS transforms affecting coordinates
- Verify touch event handling for mobile
- Clear canvas context properly between drawings

## Connection Problems

### WebSocket Connection Issues

**Error:** `WebSocket connection to 'ws://localhost:3001' failed`

**Diagnosis:**
```javascript
// Check WebSocket connection in browser console
const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => console.log('Connected');
ws.onerror = (error) => console.error('WebSocket error:', error);
```

**Solutions:**
1. **Server not running:**
   ```bash
   cd server
   npm start
   ```

2. **Port conflicts:**
   ```bash
   # Check what's running on port 3001
   lsof -i :3001
   # Kill conflicting process if needed
   kill -9 <PID>
   ```

3. **CORS issues:**
   ```javascript
   // server/index.js
   const cors = require('cors');
   app.use(cors({
     origin: "http://localhost:3000",
     credentials: true
   }));
   ```

### Reconnection Problems

**Error:** Frequent disconnections or failed reconnections

**Diagnosis:**
```typescript
gameManager.onError((error) => {
  if (error.code === 'CONNECTION_LOST') {
    console.log('Connection lost, attempting recovery...');
  }
});
```

**Solutions:**
1. **Adjust reconnection settings:**
   ```typescript
   const gameManager = new SocketGameManager(
     onStateChange,
     tieBreakerCallbacks,
     {
       reconnectAttempts: 5,
       reconnectDelay: 2000,
       connectionTimeout: 10000
     }
   );
   ```

2. **Check network stability:**
   ```bash
   # Test network connectivity
   ping google.com
   # Check for packet loss
   ```

3. **Implement connection health monitoring:**
   ```typescript
   setInterval(() => {
     const status = gameManager.getConnectionStatus();
     console.log('Connection status:', status);
   }, 5000);
   ```

## Game State Issues

### State Synchronization Problems

**Symptoms:**
- Players see different game states
- Actions not reflected for all players
- Inconsistent player counts

**Diagnosis:**
```typescript
// Enable state debugging
gameManager.enableDevMode?.();

// Compare states between players
const state1 = gameManager1.getGameState();
const state2 = gameManager2.getGameState();
console.log('State diff:', {
  player1: state1,
  player2: state2
});
```

**Solutions:**
1. **Server-side state validation:**
   ```javascript
   // Ensure server is authoritative
   function validateGameState(roomCode, action) {
     const room = rooms[roomCode];
     if (!room) {
       throw new Error('Room not found');
     }
     // Validate action against current state
   }
   ```

2. **Client-side state reconciliation:**
   ```typescript
   gameManager.onStateChange((newState) => {
     // Validate state consistency
     if (validateStateTransition(currentState, newState)) {
       setCurrentState(newState);
     } else {
       console.warn('Invalid state transition detected');
       requestStateSync();
     }
   });
   ```

### Memory Leaks in State Management

**Symptoms:**
- Increasing memory usage over time
- Browser becomes slow/unresponsive
- "Out of memory" errors

**Diagnosis:**
```typescript
// Monitor memory usage
setInterval(() => {
  if (performance.memory) {
    console.log('Memory usage:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB'
    });
  }
}, 10000);
```

**Solutions:**
1. **Proper cleanup:**
   ```typescript
   useEffect(() => {
     const handleStateChange = (state) => {
       // Handle state change
     };
     
     gameManager.onStateChange(handleStateChange);
     
     return () => {
       gameManager.offStateChange(handleStateChange);
     };
   }, []);
   ```

2. **Limit message history:**
   ```typescript
   // In SocketGameManager
   private logNetworkMessage(type: string, data: any) {
     this.networkMessages.push({ type, data, timestamp: new Date() });
     
     // Keep only last 100 messages
     if (this.networkMessages.length > 100) {
       this.networkMessages = this.networkMessages.slice(-100);
     }
   }
   ```

## Performance Problems

### Slow Rendering

**Symptoms:**
- UI updates are laggy
- High CPU usage in browser
- Dropped frames in animations

**Diagnosis:**
```typescript
// Use React DevTools Profiler
// Or add performance monitoring
const startTime = performance.now();
// ... render operation
const endTime = performance.now();
console.log(`Render took ${endTime - startTime} milliseconds`);
```

**Solutions:**
1. **Optimize React components:**
   ```typescript
   const ExpensiveComponent = React.memo(({ data }) => {
     return <div>{/* Component content */}</div>;
   });
   
   const useOptimizedCallback = useCallback((id) => {
     // Callback logic
   }, [dependency]);
   ```

2. **Reduce unnecessary re-renders:**
   ```typescript
   const memoizedValue = useMemo(() => {
     return expensiveCalculation(data);
   }, [data]);
   ```

3. **Optimize canvas operations:**
   ```typescript
   // Batch canvas operations
   const ctx = canvas.getContext('2d');
   ctx.beginPath();
   // Multiple drawing operations
   ctx.stroke(); // Single stroke call
   ```

### Network Performance Issues

**Symptoms:**
- Slow message delivery
- High bandwidth usage
- Connection timeouts

**Diagnosis:**
```typescript
// Monitor network performance
gameManager.getNetworkMessages?.().forEach(msg => {
  console.log(`${msg.type}: ${JSON.stringify(msg.data).length} bytes`);
});
```

**Solutions:**
1. **Message compression:**
   ```typescript
   // Compress large payloads
   const compressedData = LZString.compress(JSON.stringify(largeData));
   socket.emit('large-data', { compressed: compressedData });
   ```

2. **Batch updates:**
   ```typescript
   // Batch frequent updates
   const updateQueue = [];
   const flushUpdates = debounce(() => {
     socket.emit('batch-update', updateQueue);
     updateQueue.length = 0;
   }, 100);
   ```

## Testing Issues

### Tests Failing Intermittently

**Symptoms:**
- Tests pass sometimes, fail other times
- Different results on different machines
- Timing-related failures

**Diagnosis:**
```typescript
// Add debugging to flaky tests
test('flaky test', async () => {
  console.log('Test starting at:', new Date().toISOString());
  
  // Add delays to see timing issues
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Log intermediate states
  console.log('Intermediate state:', getCurrentState());
});
```

**Solutions:**
1. **Proper async handling:**
   ```typescript
   // Use waitFor for async operations
   await waitFor(() => {
     expect(screen.getByText('Expected text')).toBeInTheDocument();
   });
   ```

2. **Mock timers:**
   ```typescript
   beforeEach(() => {
     jest.useFakeTimers();
   });
   
   afterEach(() => {
     jest.useRealTimers();
   });
   ```

3. **Deterministic test data:**
   ```typescript
   // Use fixed seeds for random data
   const faker = require('faker');
   faker.seed(123);
   ```

### Mock Issues

**Symptoms:**
- Mocks not working as expected
- Real network calls in tests
- Inconsistent mock behavior

**Solutions:**
1. **Proper mock setup:**
   ```typescript
   // Mock at module level
   jest.mock('../services/SocketGameManager', () => ({
     SocketGameManager: jest.fn().mockImplementation(() => ({
       hostGame: jest.fn(),
       joinGame: jest.fn(),
       // ... other methods
     }))
   }));
   ```

2. **Reset mocks between tests:**
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

## Development Environment

### Build Issues

**Error:** `Module not found` or compilation errors

**Solutions:**
1. **Clear node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check TypeScript configuration:**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true
     }
   }
   ```

3. **Verify import paths:**
   ```typescript
   // Use relative imports correctly
   import { GameManager } from '../interfaces/GameManager';
   // Not: import { GameManager } from 'interfaces/GameManager';
   ```

### Hot Reload Not Working

**Solutions:**
1. **Check file watching:**
   ```bash
   # Increase file watcher limit on Linux
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Restart development server:**
   ```bash
   npm start
   ```

## Debugging Tools

### Browser DevTools

1. **Network Tab:**
   - Monitor WebSocket connections
   - Check for failed requests
   - Analyze message timing

2. **Console:**
   ```typescript
   // Enable verbose logging
   localStorage.setItem('debug', 'doodle:*');
   ```

3. **Application Tab:**
   - Check localStorage/sessionStorage
   - Monitor service workers
   - Inspect cookies

### React DevTools

1. **Components Tab:**
   - Inspect component props and state
   - Track re-renders
   - Identify performance issues

2. **Profiler Tab:**
   - Measure render performance
   - Identify expensive components
   - Analyze commit phases

### Custom Debugging

```typescript
// Add to window for debugging
if (process.env.NODE_ENV === 'development') {
  (window as any).debugGame = {
    gameManager,
    devTools,
    getState: () => gameManager.getGameState(),
    getMessages: () => gameManager.getNetworkMessages?.(),
    simulateError: (code: string) => {
      const error = createGameError(code as GameErrorCode, 'Debug error');
      gameManager.onError?.(error);
    }
  };
}
```

## Error Analysis

### Error Classification

1. **Connection Errors:**
   - `CONNECTION_FAILED`: Server unreachable
   - `CONNECTION_TIMEOUT`: Request timed out
   - `CONNECTION_LOST`: Disconnected during game

2. **Validation Errors:**
   - `INVALID_PLAYER_NAME`: Name validation failed
   - `INVALID_ROOM_CODE`: Room code format invalid
   - `INVALID_DRAWING_DATA`: Canvas data corrupted

3. **Game Logic Errors:**
   - `ROOM_NOT_FOUND`: Room doesn't exist
   - `ROOM_FULL`: Maximum players reached
   - `UNAUTHORIZED_ACTION`: Permission denied

### Error Recovery Strategies

```typescript
gameManager.onError((error) => {
  switch (error.code) {
    case 'CONNECTION_LOST':
      // Automatic reconnection
      showReconnectingMessage();
      break;
      
    case 'ROOM_NOT_FOUND':
      // User action required
      showRoomNotFoundDialog();
      break;
      
    case 'INVALID_PLAYER_NAME':
      // Input validation
      highlightNameInput();
      showValidationMessage();
      break;
      
    default:
      // Generic error handling
      showGenericErrorDialog(error.message);
  }
});
```

## Network Debugging

### WebSocket Debugging

```typescript
// Log all WebSocket messages
const originalEmit = socket.emit;
socket.emit = function(event, data) {
  console.log('→ Sending:', event, data);
  return originalEmit.call(this, event, data);
};

socket.onAny((event, data) => {
  console.log('← Received:', event, data);
});
```

### Network Quality Testing

```typescript
// Test connection quality
async function testNetworkQuality() {
  const startTime = Date.now();
  
  try {
    const response = await fetch('/api/ping');
    const latency = Date.now() - startTime;
    
    console.log('Network latency:', latency + 'ms');
    
    if (latency > 1000) {
      console.warn('High latency detected');
    }
  } catch (error) {
    console.error('Network test failed:', error);
  }
}
```

## Browser-Specific Issues

### Safari Issues

**Problem:** WebSocket connections fail in Safari

**Solution:**
```typescript
// Safari WebSocket workaround
const isWebSocketSupported = 'WebSocket' in window;
if (!isWebSocketSupported) {
  // Fallback to polling
  usePollingTransport();
}
```

### Chrome Memory Issues

**Problem:** High memory usage in Chrome

**Solution:**
```typescript
// Monitor memory in Chrome
if ('memory' in performance) {
  setInterval(() => {
    const memory = (performance as any).memory;
    if (memory.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
      console.warn('High memory usage detected');
      // Trigger cleanup
      cleanupResources();
    }
  }, 30000);
}
```

### Firefox Canvas Issues

**Problem:** Canvas rendering differences in Firefox

**Solution:**
```typescript
// Firefox-specific canvas handling
const isFirefox = navigator.userAgent.includes('Firefox');
if (isFirefox) {
  // Use different canvas settings
  ctx.imageSmoothingEnabled = false;
}
```

## Quick Reference

### Debugging Commands

```bash
# Check server status
curl http://localhost:3001/health

# Monitor network traffic
netstat -an | grep 3001

# Check process memory usage
ps aux | grep node

# View browser console logs
# Open DevTools → Console

# Run specific test
npm test -- --testNamePattern="specific test"

# Build with source maps
npm run build -- --source-map
```

### Environment Variables

```bash
# Enable debug logging
DEBUG=doodle:* npm start

# Disable service worker
GENERATE_SOURCEMAP=false npm start

# Use different server URL
REACT_APP_SERVER_URL=ws://staging-server.com npm start
```

### Useful Browser Console Commands

```javascript
// Check WebSocket connection
console.log('WebSocket state:', window.gameManager?.socket?.readyState);

// Force garbage collection (Chrome)
window.gc?.();

// Monitor performance
console.time('operation');
// ... perform operation
console.timeEnd('operation');

// Check memory usage
console.log('Memory:', performance.memory);
```

This troubleshooting guide should help you diagnose and resolve most common issues in the Doodle game. Remember to check the browser console first, as it often contains the most relevant error information.