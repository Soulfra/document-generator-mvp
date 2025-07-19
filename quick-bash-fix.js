#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔨 QUICK BASH FIX');

// 1. Symlink services
console.log('\n🔗 Symlinking services...');
try {
  execSync('node symlink-services.js', { stdio: 'inherit' });
} catch (e) {
  console.log('Symlink failed');
}

// 2. Install deps
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
} catch (e) {
  console.log('npm install failed');
}

// 3. Run character system
console.log('\n🎭 Running character system...');
try {
  execSync('node character-system-max.js', { stdio: 'inherit' });
} catch (e) {
  console.log('Character system failed');
}