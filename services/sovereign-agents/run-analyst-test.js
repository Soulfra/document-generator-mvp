#!/usr/bin/env node

/**
 * Run Analyst Agent Test
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Running Analyst Agent Test');
console.log('=============================\n');

const testScript = path.join(__dirname, 'test-analyst-agent.js');

const nodeProcess = spawn('node', [testScript], {
  stdio: 'inherit',
  cwd: __dirname
});

nodeProcess.on('error', (error) => {
  console.error('❌ Failed to run test:', error.message);
  process.exit(1);
});

nodeProcess.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ Analyst Agent test passed!');
    console.log('🔍 The Analyst Agent can successfully:');
    console.log('   - Extract requirements from business documents');
    console.log('   - Analyze technical specifications');
    console.log('   - Process chat conversations');
    console.log('   - Generate actionable insights');
    console.log('   - Recommend technology stacks');
    console.log('\n🚀 Ready to build the Architect Agent!');
  } else {
    console.log('\n❌ Analyst Agent test failed');
    console.log('Please check the output above for details');
  }
  process.exit(code);
});