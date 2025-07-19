const { spawn } = require('child_process');
const path = require('path');

// Execute with proper working directory
const executeProcess = spawn('node', ['execute-production-now.js'], {
  cwd: '/Users/matthewmauer/Desktop/Document-Generator',
  stdio: 'inherit',
  shell: false
});

executeProcess.on('close', (code) => {
  console.log(`\nExecution finished with code: ${code}`);
});

executeProcess.on('error', (error) => {
  console.error('Execution error:', error);
});