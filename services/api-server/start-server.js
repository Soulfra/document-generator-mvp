#!/usr/bin/env node

/**
 * Start API Server with proper error handling
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Document Generator API Server\n');

// First install dependencies if needed
const installProcess = spawn('npm', ['install'], {
  cwd: __dirname,
  stdio: 'inherit'
});

installProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Dependencies ready');
    console.log('🚀 Starting server...\n');
    
    // Start the server
    const serverProcess = spawn('node', ['index.js'], {
      cwd: __dirname,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PORT: '3001'
      }
    });
    
    serverProcess.on('error', (error) => {
      console.error('❌ Failed to start server:', error);
    });
    
  } else {
    console.log('\n❌ Failed to install dependencies');
  }
});

installProcess.on('error', (error) => {
  console.error('❌ Failed to install dependencies:', error);
});