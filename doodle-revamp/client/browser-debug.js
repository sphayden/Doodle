/**
 * Browser Debug Script
 * Run this in the browser console (F12) to diagnose the UI error
 */

console.log('🔍 Doodle Game Debug Script');
console.log('===========================');

// Check current app state
console.log('\n📊 Current App State:');
console.log('React Dev Tools available:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

// Check network connectivity
console.log('\n🌐 Network Connectivity Test:');
fetch('http://localhost:3001/socket.io/')
  .then(response => {
    console.log('✅ Server reachable:', response.status, response.statusText);
    return response.text();
  })
  .then(data => {
    console.log('Server response:', data.substring(0, 100) + '...');
  })
  .catch(error => {
    console.log('❌ Server unreachable:', error.message);
  });

// Check Socket.IO connection
console.log('\n🔌 Socket.IO Connection Test:');
const testSocket = io('http://localhost:3001');

testSocket.on('connect', () => {
  console.log('✅ Socket.IO connected successfully');
  console.log('Socket ID:', testSocket.id);
  
  // Test room creation
  testSocket.emit('create-room', { playerName: 'BrowserDebugTest' });
});

testSocket.on('room-created', (data) => {
  console.log('✅ Room creation successful:', data.roomCode);
  testSocket.disconnect();
});

testSocket.on('connect_error', (error) => {
  console.log('❌ Socket connection error:', error);
});

testSocket.on('error', (error) => {
  console.log('❌ Socket error:', error);
});

// Check for common issues
console.log('\n🔧 Common Issue Checks:');
console.log('Current URL:', window.location.href);
console.log('Environment variables:');
console.log('  NODE_ENV:', process?.env?.NODE_ENV || 'undefined');
console.log('  REACT_APP_SERVER_URL:', process?.env?.REACT_APP_SERVER_URL || 'undefined');

// Check React errors
const reactErrors = window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__?.errors;
if (reactErrors && reactErrors.length > 0) {
  console.log('⚠️ React Errors Found:', reactErrors);
} else {
  console.log('✅ No React errors detected');
}

// Check console errors
const originalError = console.error;
const errors = [];
console.error = function(...args) {
  errors.push(args);
  originalError.apply(console, args);
};

setTimeout(() => {
  console.log('\n📝 Console Errors Captured:', errors);
  console.error = originalError;
}, 2000);

console.log('\n💡 INSTRUCTIONS:');
console.log('1. Check the output above for any red ❌ marks');
console.log('2. Look for specific error messages');
console.log('3. If Socket.IO connects successfully, the backend is working');
console.log('4. Try hard refreshing the page (Ctrl+Shift+R or Cmd+Shift+R)');
console.log('5. Check Network tab in DevTools for failed requests');
console.log('6. Clear browser cache if the issue persists');

// Auto-cleanup
setTimeout(() => {
  if (testSocket.connected) {
    testSocket.disconnect();
  }
}, 5000);