#!/usr/bin/env node

/**
 * EXECUTE BASH ALL - Direct execution wrapper
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('💥 EXECUTING BASH-IT-ALL-FINAL.js...\n');

// Execute the main bash script
const bashProcess = spawn('node', [path.join(__dirname, 'BASH-IT-ALL-FINAL.js')], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

bashProcess.on('error', (error) => {
  console.error('❌ Failed to execute:', error);
  process.exit(1);
});

bashProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ BASH EXECUTION COMPLETE!');
  } else {
    console.log(`\n❌ Process exited with code ${code}`);
  }
});