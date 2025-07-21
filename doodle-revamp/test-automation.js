// Browser automation script for testing tie breaker functionality
// Run this in the browser console when the app is loaded

console.log('🤖 Tie Breaker Test Automation Script Loaded');
console.log('Use these functions to test the tie breaker functionality:');

// Function to quickly test tie breaker
window.quickTestTie = function() {
  console.log('🎯 Running quick tie test...');
  
  // Simulate tie detection
  if (window.VUE) {
    // For the old .NET version
    console.log('Detected Vue app - simulating tie in .NET version');
    // You can add specific Vue testing here
  } else {
    // For the React version
    console.log('Detected React app - simulating tie in React version');
    
    // Try to find and click the test button
    const testButton = document.querySelector('button[onclick*="quickTestTie"]') || 
                      document.querySelector('button:contains("Quick Tie Test")');
    
    if (testButton) {
      console.log('Found test button, clicking...');
      testButton.click();
    } else {
      console.log('Test button not found. Make sure you\'re in development mode.');
      console.log('You can manually trigger the tie breaker by:');
      console.log('1. Opening the test panel (🧪 Test Mode button)');
      console.log('2. Clicking "🎯 Quick Tie Test"');
    }
  }
};

// Function to simulate multiple players joining
window.simulatePlayers = function(count = 4) {
  console.log(`👥 Simulating ${count} players joining...`);
  
  // This would need to be implemented based on the specific game manager
  console.log('Note: This function needs to be customized based on your game implementation');
};

// Function to simulate voting with tie
window.simulateTieVoting = function() {
  console.log('🗳️ Simulating voting with tie scenario...');
  
  // Try to find voting buttons and click them to create a tie
  const votingButtons = document.querySelectorAll('[onclick*="vote"], [onclick*="Vote"]');
  
  if (votingButtons.length > 0) {
    console.log(`Found ${votingButtons.length} voting buttons`);
    console.log('Click the same option multiple times to create a tie, then click different options');
  } else {
    console.log('No voting buttons found. Make sure you\'re in the voting screen.');
  }
};

// Function to check current game state
window.checkGameState = function() {
  console.log('🔍 Checking current game state...');
  
  // Check for React state
  const reactApp = document.querySelector('#root');
  if (reactApp) {
    console.log('React app detected');
    console.log('Current URL:', window.location.href);
    console.log('Available test functions:');
    console.log('- window.quickTestTie()');
    console.log('- window.simulatePlayers(count)');
    console.log('- window.simulateTieVoting()');
  }
  
  // Check for Vue app
  if (window.VUE) {
    console.log('Vue app detected');
    console.log('Vue state:', window.VUE);
  }
};

// Function to reset game state
window.resetGame = function() {
  console.log('🔄 Resetting game state...');
  
  // Reload the page
  window.location.reload();
};

// Auto-run check
setTimeout(() => {
  console.log('\n🎲 Tie Breaker Test Automation Ready!');
  console.log('Available commands:');
  console.log('  quickTestTie()     - Quick tie breaker test');
  console.log('  simulatePlayers(n) - Simulate n players joining');
  console.log('  simulateTieVoting() - Simulate voting with tie');
  console.log('  checkGameState()   - Check current game state');
  console.log('  resetGame()        - Reset/reload the game');
  
  // Check if we're in development mode
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('\n✅ Development environment detected');
    console.log('Look for the 🧪 Test Mode button in the top-right corner');
  }
}, 1000);

// Export functions for easy access
window.tieBreakerTests = {
  quickTest: window.quickTestTie,
  simulatePlayers: window.simulatePlayers,
  simulateVoting: window.simulateTieVoting,
  checkState: window.checkGameState,
  reset: window.resetGame
}; 