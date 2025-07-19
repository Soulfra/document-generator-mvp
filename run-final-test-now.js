const { execSync } = require('child_process');

console.log('🚀 EXECUTING FINAL SYSTEM TEST NOW\n');

try {
  // Run the complete system test
  execSync('node final-system-test.js', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('\n🎯 Test completed - proceeding to start server...\n');
  
  // Install dependencies and start server
  execSync('npm install', {
    stdio: 'inherit', 
    cwd: require('path').join(__dirname, 'services', 'api-server')
  });
  
  console.log('\n✅ Dependencies installed - starting API server...\n');
  
  // Start the server
  const { spawn } = require('child_process');
  const serverProcess = spawn('node', ['index.js'], {
    cwd: require('path').join(__dirname, 'services', 'api-server'),
    stdio: 'inherit',
    env: { ...process.env, PORT: '3001' }
  });
  
  console.log('🔥 API Server starting at http://localhost:3001');
  
} catch (error) {
  console.error('❌ Execution failed:', error.message);
}