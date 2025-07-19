#!/usr/bin/env node

/**
 * Direct Ralph Execution - Bypass shell environment issues
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔨 RALPH DIRECT EXECUTOR');
console.log('========================');
console.log('Bypassing shell environment to execute Ralph...\n');

// Execute Ralph's script directly
const ralphScript = path.join(__dirname, 'execute-ralph-now.js');
console.log(`📍 Executing: ${ralphScript}\n`);

const ralph = spawn('node', [ralphScript], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'test'
  }
});

ralph.on('close', (code) => {
  console.log(`\n🔨 Ralph execution completed with exit code: ${code}`);
  
  if (code === 0) {
    console.log('✅ RALPH SUCCESS: Sovereign Agents are operational!');
  } else {
    console.log('⚠️ RALPH DETECTED ISSUES: Check output above for details');
  }
  
  process.exit(code);
});

ralph.on('error', (error) => {
  console.error(`💥 Ralph execution failed: ${error.message}`);
  process.exit(1);
});