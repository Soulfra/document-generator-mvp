const { spawn } = require('child_process');
const path = require('path');

console.log('🎬 DOCUMENT GENERATOR QUICK DEMO\n');

// Step 1: Test system
console.log('Step 1: Testing complete system...');
const testProcess = spawn('node', ['final-system-test.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ System test passed!\n');
    
    // Step 2: Start server
    console.log('Step 2: Starting API server...');
    const serverProcess = spawn('node', ['index.js'], {
      cwd: path.join(__dirname, 'services', 'api-server'),
      stdio: 'inherit',
      env: { ...process.env, PORT: '3001' }
    });
    
    // Give server time to start, then test upload
    setTimeout(() => {
      console.log('\nStep 3: Testing document upload...');
      const uploadTest = spawn('node', ['test-upload-document.js'], {
        cwd: __dirname,
        stdio: 'inherit'
      });
    }, 3000);
    
  } else {
    console.log('\n❌ System test failed');
  }
});