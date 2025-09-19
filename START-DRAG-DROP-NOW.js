#!/usr/bin/env node
// ONE COMMAND TO START EVERYTHING

const { spawn, execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 STARTING DRAG & DROP INTERFACE\n');

// Quick dependency check
try {
  require('express');
  require('multer');
  console.log('✅ Dependencies ready\n');
} catch (e) {
  console.log('📦 Installing dependencies...\n');
  execSync('npm install express multer node-fetch', { stdio: 'inherit' });
}

// Start the server
console.log('🎯 Starting server...\n');
const server = spawn('node', ['real-drag-drop.js'], { stdio: 'inherit' });

// Open browser after 2 seconds
setTimeout(() => {
  const url = 'http://localhost:5678';
  console.log(`\n🌐 Opening ${url} in browser...\n`);
  
  try {
    if (process.platform === 'darwin') {
      execSync(`open ${url}`);
    } else if (process.platform === 'linux') {
      execSync(`xdg-open ${url}`);
    } else {
      execSync(`start ${url}`);
    }
  } catch (e) {
    console.log(`\n📎 Open manually: ${url}\n`);
  }
}, 2000);

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  server.kill();
  process.exit();
});