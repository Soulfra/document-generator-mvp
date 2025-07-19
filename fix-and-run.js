#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');

console.log('🔧 FIX AND RUN DOCUMENT GENERATOR\n');

// Check if node_modules exists
if (!fs.existsSync('./node_modules')) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');
  } catch (e) {
    console.log('❌ Failed to install dependencies');
    console.log('Try running: npm install\n');
  }
} else {
  console.log('✅ Dependencies already installed\n');
}

// Check if express is actually installed
try {
  require('express');
  console.log('✅ Express found');
} catch (e) {
  console.log('❌ Express missing - run: npm install express');
}

// Create a minimal test server
console.log('\n🚀 Creating minimal test server...\n');

const testServer = `
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Document Generator Test</title>
      <style>
        body { font-family: Arial; padding: 20px; max-width: 800px; margin: 0 auto; }
        .status { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .btn { padding: 10px 20px; margin: 5px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>🚀 Document Generator - Test Server</h1>
      
      <div class="status">
        <h3>✅ Server is running!</h3>
        <p>This confirms Express is working.</p>
      </div>
      
      <h2>Available Systems:</h2>
      <button class="btn" onclick="window.location.href='http://localhost:8888'">
        🎭 Character System (port 8888)
      </button>
      <button class="btn" onclick="window.location.href='http://localhost:3001'">
        🔌 API Server (port 3001)
      </button>
      
      <h2>Manual Commands:</h2>
      <pre>
# Start Character System:
node character-system-max.js

# Start Web Interface:
node execute-character-system.js

# View All Tiers:
node tier-connector.js

# Generate Documentation:
node generate-real-docs.js
      </pre>
      
      <div class="status">
        <h3>📊 System Status:</h3>
        <p>Characters: 7 (Nova, Aria, Flux, Zen, Rex, Sage, Pixel)</p>
        <p>Tiers: 13+</p>
        <p>Status: Ready to test</p>
      </div>
    </body>
    </html>
  \`);
});

const PORT = 7777;
app.listen(PORT, () => {
  console.log(\`✅ Test server running at http://localhost:\${PORT}\`);
  console.log('This confirms your environment is working!');
  console.log('\\nNow starting character system...');
});
`;

// Write and run test server
fs.writeFileSync('test-server.js', testServer);

// Start test server
const server = spawn('node', ['test-server.js'], { stdio: 'inherit' });

// After 2 seconds, try to start character system
setTimeout(() => {
  console.log('\n🎭 Starting character system...\n');
  
  const charSystem = spawn('node', ['execute-character-system.js'], {
    stdio: 'inherit'
  });
  
  charSystem.on('error', (err) => {
    console.log('Character system failed. Try:');
    console.log('1. node character-system-max.js');
    console.log('2. node test-it-now.js');
  });
}, 2000);

console.log('\n📌 WHAT\'S HAPPENING:');
console.log('1. Test server starting on http://localhost:7777');
console.log('2. Character system starting on http://localhost:8888');
console.log('3. If nothing works, check test-report.json');

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});