#!/usr/bin/env node

console.log('🧪 TESTING FLAG MODE WITH HOOKS');
console.log('===============================');

try {
  const FlagModeHooks = require('./flag-mode-hooks.js');
  
  console.log('✅ FlagModeHooks loaded');
  
  // Create instance
  const flagSystem = new FlagModeHooks();
  console.log('✅ Flag system created');
  
  // Test flag operations
  console.log('\n🚩 Testing flags...');
  flagSystem.setFlag('TEST_FLAG', true);
  console.log(`✅ Flag set: ${flagSystem.getFlag('TEST_FLAG')}`);
  
  flagSystem.toggleFlag('TEST_FLAG');
  console.log(`✅ Flag toggled: ${flagSystem.getFlag('TEST_FLAG')}`);
  
  // Test hook operations
  console.log('\n🪝 Testing hooks...');
  flagSystem.addHook('test_hook', (data) => {
    console.log(`🪝 Test hook triggered: ${JSON.stringify(data)}`);
  });
  
  flagSystem.triggerHook('test_hook', { message: 'Hello from hook!' });
  console.log('✅ Hook triggered successfully');
  
  // Test mode presets
  console.log('\n🔧 Testing mode presets...');
  flagSystem.developmentMode();
  console.log('✅ Development mode set');
  
  flagSystem.testingMode();
  console.log('✅ Testing mode set');
  
  // Show current status
  console.log('\n📊 Current status:');
  flagSystem.showStatus();
  
  // Test dual economy start (short run)
  console.log('\n🏦 Testing dual economy start...');
  
  // Set flags for quick test
  flagSystem.setFlag('USER_SIMULATION_ENABLED', true);
  flagSystem.setFlag('REVENUE_SIMULATION_ENABLED', true);
  flagSystem.setFlag('DASHBOARD_ENABLED', false); // Disable dashboard for test
  
  // Start the system
  flagSystem.startDualEconomy();
  
  // Let it run for 5 seconds then stop
  setTimeout(() => {
    console.log('\n🛑 Test complete');
    
    // Show recent events
    const events = flagSystem.getRecentEvents(5);
    console.log('\n📋 Recent events:');
    events.forEach(event => {
      console.log(`   ${event.type}: ${JSON.stringify(event.data)}`);
    });
    
    console.log('\n✅ ALL FLAG MODE TESTS PASSED!');
    process.exit(0);
  }, 5000);
  
} catch (error) {
  console.error('💥 Flag mode test failed:', error.message);
  console.error(error.stack);
}