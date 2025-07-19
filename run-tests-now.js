#!/usr/bin/env node

// Direct test runner - bypass shell issues
const { spawn } = require('child_process');
const fs = require('fs');

console.log('🔗 RUNNING CONNECTION TESTS NOW');
console.log('===============================\n');

// Run the test script
const testScript = require('./test-all-connections.js');

// Execute tests
testScript.runAllTests().then(() => {
  console.log('\n✅ Test complete!');
  
  // Show quick start options
  console.log('\n🚀 QUICK START OPTIONS:');
  console.log('======================');
  console.log('\n1. Start Character System:');
  console.log('   node character-system-max.js\n');
  console.log('2. Start Web Interface:');
  console.log('   node execute-character-system.js');
  console.log('   → Then open http://localhost:8888\n');
  console.log('3. Run Full System:');
  console.log('   node final-executor.js\n');
  console.log('4. Minimal Memory Mode:');
  console.log('   node launch.js');
  console.log('   → Then open http://localhost:7777\n');
  
  // Try to start character system automatically
  console.log('\n🎭 Starting Character System in 3 seconds...');
  console.log('Press Ctrl+C to cancel\n');
  
  setTimeout(() => {
    const char = spawn('node', ['execute-character-system.js'], {
      stdio: 'inherit'
    });
    
    char.on('error', (err) => {
      console.error('Failed to start:', err.message);
      console.log('\nRun manually: node execute-character-system.js');
    });
  }, 3000);
  
}).catch(error => {
  console.error('Test failed:', error);
});