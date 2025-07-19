const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Executing API Server Integration NOW\n');

try {
  // Step 1: Create missing sovereign agents
  console.log('Step 1: Creating missing Sovereign Agent components...');
  execSync('node services/sovereign-agents/create-missing-agents.js', { stdio: 'inherit' });
  
  // Step 2: Test integration
  console.log('\nStep 2: Testing integration...');
  execSync('node run-test-direct.js', { stdio: 'inherit' });
  
  // Step 3: Install API server dependencies
  console.log('\nStep 3: Installing API server dependencies...');
  execSync('npm install', { 
    cwd: path.join(__dirname, 'services', 'api-server'),
    stdio: 'inherit' 
  });
  
  // Step 4: Quick component test
  console.log('\nStep 4: Testing components...');
  execSync('node quick-test.js', { 
    cwd: path.join(__dirname, 'services', 'api-server'),
    stdio: 'inherit' 
  });
  
  console.log('\n✅ ALL STEPS COMPLETED!');
  console.log('\n🎯 Ready to start server:');
  console.log('cd services/api-server && node index.js');
  
} catch (error) {
  console.error('❌ Execution failed:', error.message);
}