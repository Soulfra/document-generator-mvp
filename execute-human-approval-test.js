const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 EXECUTING Human-in-the-Loop Test NOW\n');

// Step 1: Start the API server
console.log('Step 1: Starting API server...');
const serverProcess = spawn('node', ['index.js'], {
  cwd: path.join(__dirname, 'services', 'api-server'),
  stdio: 'inherit',
  env: { ...process.env, PORT: '3001' }
});

// Give server time to start
setTimeout(() => {
  console.log('\nStep 2: Running human approval test...');
  
  // Step 2: Run the human approval test
  const testProcess = spawn('node', ['test-human-approval.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  testProcess.on('close', (code) => {
    console.log(`\n🏁 Test completed with code ${code}`);
    if (code === 0) {
      console.log('✅ Human-in-the-loop system working!');
    } else {
      console.log('❌ Test failed - check output above');
    }
  });
  
}, 3000);