const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 EXECUTING API Server Test & Start\n');

const apiDir = path.join(__dirname, 'services', 'api-server');

// Step 1: Quick component test
console.log('Step 1: Testing components...');
const testProcess = spawn('node', ['quick-test.js'], {
  cwd: apiDir,
  stdio: 'inherit'
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Components OK - Installing dependencies...');
    
    // Step 2: Install dependencies
    const installProcess = spawn('npm', ['install'], {
      cwd: apiDir,
      stdio: 'inherit'
    });
    
    installProcess.on('close', (installCode) => {
      if (installCode === 0) {
        console.log('\n✅ Dependencies installed - Starting server...');
        
        // Step 3: Start the server
        const serverProcess = spawn('node', ['index.js'], {
          cwd: apiDir,
          stdio: 'inherit',
          env: {
            ...process.env,
            PORT: '3001',
            NODE_ENV: 'development'
          }
        });
        
        console.log('\n🔥 API Server starting at http://localhost:3001');
        console.log('📤 Upload: POST /api/documents/upload');
        console.log('🔌 WebSocket: ws://localhost:3001/socket.io/');
        
      } else {
        console.log('\n❌ Install failed');
      }
    });
    
  } else {
    console.log('\n❌ Component test failed');
  }
});