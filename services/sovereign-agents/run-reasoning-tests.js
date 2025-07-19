#!/usr/bin/env node

/**
 * Run Chain of Thought Reasoning Tests without shell
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Running Chain of Thought Reasoning Tests');
console.log('==========================================\n');

const testScript = path.join(__dirname, 'test-chain-of-thought.js');

const nodeProcess = spawn('node', [testScript], {
  stdio: 'inherit',
  cwd: __dirname
});

nodeProcess.on('error', (error) => {
  console.error('❌ Failed to run tests:', error.message);
  process.exit(1);
});

nodeProcess.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ All reasoning tests passed!');
    console.log('🧠 Chain of Thought reasoning is working correctly');
    console.log('🚀 Ready to build specialized agents!');
  } else {
    console.log('\n❌ Some tests failed');
    console.log('Please check the output above for details');
  }
  process.exit(code);
});