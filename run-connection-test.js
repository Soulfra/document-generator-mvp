#!/usr/bin/env node

// Simple runner that executes the connection test
const { spawn } = require('child_process');

console.log('🔗 Running Document Generator Connection Test...\n');

// Run the connect-everything script
const proc = spawn('node', ['connect-everything.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

proc.on('error', (err) => {
  console.error('Error:', err);
  console.log('\nTry running directly:');
  console.log('node connect-everything.js');
});

proc.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ Connection test complete!');
  }
});