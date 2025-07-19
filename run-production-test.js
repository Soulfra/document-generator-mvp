const { spawn } = require('child_process');
const path = require('path');

console.log('🔥 EXECUTING Production System Test NOW\n');

// Start the API server with all monitoring
console.log('Starting production API server...');
const serverProcess = spawn('node', ['index.js'], {
  cwd: path.join(__dirname, 'services', 'api-server'),
  stdio: 'inherit',
  env: { 
    ...process.env, 
    PORT: '3001',
    NODE_ENV: 'production'
  }
});

// Wait for server to start, then test monitoring
setTimeout(() => {
  console.log('\nTesting monitoring system...');
  
  const testProcess = spawn('node', ['test-monitoring-system.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Production monitoring system working!');
      console.log('📊 All monitoring endpoints operational');
      console.log('🔄 Error recovery system active');
    } else {
      console.log('\n❌ Test failed');
    }
  });
  
}, 3000);