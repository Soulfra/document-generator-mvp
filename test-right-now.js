#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');

console.log('🔨 TESTING RIGHT NOW - NO MORE PLANNING\n');

// Quick check what exists
console.log('FILES THAT EXIST:');
try {
  const files = execSync('ls -1 *.js | head -10', { encoding: 'utf8' });
  console.log(files);
} catch (e) {
  console.log('Cannot list files');
}

// Try to run character system directly
console.log('\nRUNNING CHARACTER SYSTEM NOW:');
const char = spawn('node', ['character-system-max.js'], {
  stdio: 'inherit'
});

char.on('error', (err) => {
  console.log('\nCharacter system failed, trying to symlink services...\n');
  
  // Create symlinks to services
  try {
    if (!fs.existsSync('./SovereignAgent.js') && fs.existsSync('./services/sovereign-agents/src/services/SovereignAgent.js')) {
      fs.symlinkSync('./services/sovereign-agents/src/services/SovereignAgent.js', './SovereignAgent.js');
      console.log('✅ Symlinked SovereignAgent.js');
    }
    
    if (!fs.existsSync('./SovereignOrchestrationDatabase.js') && fs.existsSync('./services/sovereign-agents/src/services/SovereignOrchestrationDatabase.js')) {
      fs.symlinkSync('./services/sovereign-agents/src/services/SovereignOrchestrationDatabase.js', './SovereignOrchestrationDatabase.js');
      console.log('✅ Symlinked SovereignOrchestrationDatabase.js');
    }
  } catch (e) {
    console.log('Symlink failed:', e.message);
  }
  
  // Try npm install
  console.log('\nRunning npm install...');
  try {
    execSync('npm install', { stdio: 'inherit' });
  } catch (e) {
    console.log('npm install failed');
  }
});

char.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ Character system is running!');
  } else {
    console.log('\n❌ Character system exited with code:', code);
    console.log('\nTrying minimal test...');
    
    // Just test if we can load the file
    try {
      const content = fs.readFileSync('./character-system-max.js', 'utf8');
      console.log('✅ Character system file exists and is readable');
      console.log(`   File size: ${content.length} bytes`);
      
      // Check for require statements
      const requires = content.match(/require\(['"](.*?)['"]\)/g) || [];
      console.log(`\n   Dependencies found: ${requires.length}`);
      requires.slice(0, 5).forEach(r => console.log(`     ${r}`));
      
    } catch (e) {
      console.log('❌ Cannot read character-system-max.js');
    }
  }
});