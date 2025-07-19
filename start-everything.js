const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Document Generator API Server\n');

// Change to API server directory and start
const apiServerDir = path.join(__dirname, 'services', 'api-server');

console.log('📦 Installing dependencies...');
const installProcess = spawn('npm', ['install'], {
  cwd: apiServerDir,
  stdio: 'inherit'
});

installProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Dependencies installed');
    console.log('🔥 Starting API server...\n');
    
    const serverProcess = spawn('node', ['index.js'], {
      cwd: apiServerDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: '3001'
      }
    });
    
    serverProcess.on('error', (error) => {
      console.error('❌ Server start failed:', error);
    });
    
  } else {
    console.log('\n❌ Dependency installation failed');
  }
});

installProcess.on('error', (error) => {
  console.error('❌ Installation failed:', error);
});