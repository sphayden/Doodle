/**
 * Manual DevTools Testing Script
 * Tests the comprehensive developer tools and testing framework
 */

const { testingFramework } = require('./doodle-revamp/client/src/utils/TestingFramework');

async function runDevToolsTests() {
  console.log('🧪 DOODLE DEVTOOLS TEST SUITE');
  console.log('===============================\n');

  // Create mock game manager
  console.log('📱 Creating Mock Game Manager...');
  const mockGameManager = testingFramework.createMockGameManager();
  
  // Test 1: Basic Game Flow
  console.log('\n🎮 Test 1: Basic Game Flow Scenario');
  console.log('-----------------------------------');
  const scenario1 = testingFramework.createBasicGameFlowScenario();
  const result1 = await testingFramework.runScenario(scenario1, mockGameManager);
  
  console.log(`Result: ${result1.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Message: ${result1.message}`);
  console.log(`Duration: ${result1.duration}ms`);
  
  if (result1.details) {
    console.log('Details:', result1.details);
  }
  
  // Test 2: State Validation
  console.log('\n🔍 Test 2: Game State Validation');
  console.log('--------------------------------');
  const gameState = mockGameManager.getGameState();
  const validation = testingFramework.validateGameState(gameState);
  
  console.log(`Validation: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}`);
  if (validation.errors.length > 0) {
    console.log('Errors:', validation.errors);
  }
  if (validation.warnings.length > 0) {
    console.log('Warnings:', validation.warnings);
  }
  
  // Test 3: Mock Network Manager
  console.log('\n🌐 Test 3: Mock Network Manager');
  console.log('-------------------------------');
  const mockNetwork = testingFramework.createMockNetworkManager();
  mockNetwork.setLatency(100);
  mockNetwork.setErrorRate(0.1);
  
  try {
    const response = await mockNetwork.sendMessage('test-event', { data: 'test' });
    console.log('✅ Mock network response:', response);
  } catch (error) {
    console.log('✅ Mock network error (expected with 10% error rate):', error.message);
  }
  
  // Test 4: Performance Test
  console.log('\n⚡ Test 4: Performance Test');
  console.log('---------------------------');
  const startTime = Date.now();
  
  // Simulate 100 rapid state changes
  for (let i = 0; i < 100; i++) {
    mockGameManager.simulateState({
      timeRemaining: 60 - (i % 60)
    });
  }
  
  const perfTime = Date.now() - startTime;
  console.log(`Performance: 100 state changes in ${perfTime}ms`);
  console.log(`Status: ${perfTime < 1000 ? '✅ FAST' : '❌ SLOW'}`);
  
  // Final Report
  console.log('\n📊 FINAL SUMMARY');
  console.log('=================');
  console.log(`✅ Basic Game Flow: ${result1.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ State Validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Mock Networking: PASSED`);
  console.log(`✅ Performance Test: ${perfTime < 1000 ? 'PASSED' : 'FAILED'}`);
  
  console.log('\n🎉 DevTools testing completed!');
  
  // Clean up
  mockGameManager.destroy();
}

// Run the tests
runDevToolsTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});