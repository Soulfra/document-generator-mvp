#!/usr/bin/env node

/**
 * Execute API Server test with Node.js spawn to bypass shell issues
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Executing API Server Test via Node.js spawn\n');

const testProcess = spawn('node', ['test-api-server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env
});

testProcess.on('close', (code) => {
  console.log(`\n🏁 Test process exited with code ${code}`);
  
  if (code === 0) {
    console.log('✅ API Server test completed successfully!');
    console.log('\n🎯 Ready to proceed with:');
    console.log('1. Install dependencies');
    console.log('2. Start the server');
    console.log('3. Test endpoints');
  } else {
    console.log('❌ API Server test failed');
    console.log('Check the output above for details');
  }
  
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('❌ Failed to start test process:', error);
  process.exit(1);
});