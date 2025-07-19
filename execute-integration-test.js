#!/usr/bin/env node

/**
 * Execute integration test directly with Node.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Executing Integration Test\n');

const testProcess = spawn('node', ['test-integration-now.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

testProcess.on('close', (code) => {
  console.log(`\n🏁 Test completed with code ${code}`);
  
  if (code === 0) {
    console.log('\n✅ Integration test passed!');
    console.log('🎯 Proceeding to install dependencies...\n');
    
    // Install API server dependencies
    const installProcess = spawn('npm', ['install'], {
      cwd: path.join(__dirname, 'services', 'api-server'),
      stdio: 'inherit'
    });
    
    installProcess.on('close', (installCode) => {
      if (installCode === 0) {
        console.log('\n✅ Dependencies installed!');
        console.log('🚀 Ready to start the API server');
        console.log('\nNext: cd services/api-server && npm start');
      } else {
        console.log('\n❌ Dependency installation failed');
      }
    });
    
  } else {
    console.log('\n❌ Integration test failed');
  }
});

testProcess.on('error', (error) => {
  console.error('❌ Test execution failed:', error);
});