#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');

console.log('🔧 NPM INSTALL THEN RUN');
console.log('=======================\n');

// First, check if character-system-max.js exists
if (fs.existsSync('./character-system-max.js')) {
  console.log('✅ character-system-max.js exists');
} else {
  console.log('❌ character-system-max.js missing');
  process.exit(1);
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (e) {
  console.log('❌ npm install failed, trying specific packages...');
  
  // Try installing specific packages
  const packages = ['express', 'ws', 'multer', 'node-fetch'];
  packages.forEach(pkg => {
    try {
      console.log(`Installing ${pkg}...`);
      execSync(`npm install ${pkg}`, { stdio: 'inherit' });
    } catch (e) {
      console.log(`Failed to install ${pkg}`);
    }
  });
}

// Try running character system
console.log('\n🎭 Starting character system...');
const charSystem = spawn('node', ['character-system-max.js'], {
  stdio: 'inherit'
});

charSystem.on('error', (err) => {
  console.log('\n❌ Character system failed to start:', err.message);
  
  // Try web interface as fallback
  console.log('\n🌐 Trying web interface...');
  const webInterface = spawn('node', ['execute-character-system.js'], {
    stdio: 'inherit'
  });
  
  webInterface.on('error', (err2) => {
    console.log('\n❌ Web interface also failed:', err2.message);
    console.log('\n📝 Manual commands to try:');
    console.log('1. node character-system-max.js');
    console.log('2. node execute-character-system.js');
    console.log('3. node minimal-test.js');
  });
});

charSystem.on('exit', (code) => {
  if (code !== 0) {
    console.log(`\n⚠️  Character system exited with code ${code}`);
  }
});