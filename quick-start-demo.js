const { execSync, spawn } = require('child_process');
const path = require('path');

console.log('🔥 DOCUMENT GENERATOR QUICK START DEMO\n');

try {
  // Install dependencies first
  console.log('📦 Installing dependencies...');
  execSync('npm install', {
    cwd: path.join(__dirname, 'services', 'api-server'),
    stdio: 'inherit'
  });
  
  console.log('\n✅ Dependencies installed');
  console.log('🚀 Starting API server...\n');
  
  // Start server
  const serverProcess = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, 'services', 'api-server'),
    stdio: 'inherit'
  });
  
  console.log('📡 API Server running at http://localhost:3001');
  console.log('🎯 Ready for human-in-the-loop document processing!');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
}