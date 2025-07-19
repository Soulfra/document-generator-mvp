const { spawn } = require('child_process');
const path = require('path');

console.log('🔥 EXECUTING BASH SCRIPT NOW - Bypassing Shell Issues');

// Execute the bash script directly
const bashProcess = spawn('bash', ['run-sovereign-document-generator.sh'], {
  cwd: '/Users/matthewmauer/Desktop/Document-Generator/FinishThisIdea',
  stdio: 'inherit'
});

bashProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Bash script executed successfully');
  } else {
    console.log(`\n❌ Bash script exited with code ${code}`);
  }
});

bashProcess.on('error', (error) => {
  console.error('❌ Failed to execute bash script:', error.message);
  
  // Fallback: run the Node.js script directly
  console.log('\n🔄 Fallback: Running Node.js script directly...');
  
  const nodeProcess = spawn('node', ['sovereign-chatlog-processor.js'], {
    cwd: '/Users/matthewmauer/Desktop/Document-Generator/FinishThisIdea',
    stdio: 'inherit'
  });
  
  nodeProcess.on('close', (nodeCode) => {
    console.log(`\nNode.js script finished with code: ${nodeCode}`);
  });
});