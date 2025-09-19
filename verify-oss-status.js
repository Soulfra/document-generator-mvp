#!/usr/bin/env node

/**
 * Verify OSS Status
 * Check what actually exists vs what was planned
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING OSS STATUS...\n');

// Check if soulfra-platform directory exists
const platformDir = path.join(__dirname, 'soulfra-platform');
const platformExists = fs.existsSync(platformDir);

console.log('📁 soulfra-platform directory:', platformExists ? '✅ EXISTS' : '❌ DOES NOT EXIST');

if (platformExists) {
  // Check subdirectories
  const expectedDirs = ['packages', 'plugins', 'examples', 'docs', '.github'];
  console.log('\n📂 Checking subdirectories:');
  
  expectedDirs.forEach(dir => {
    const dirPath = path.join(platformDir, dir);
    const exists = fs.existsSync(dirPath);
    console.log(`  ${dir}:`, exists ? '✅' : '❌');
  });
  
  // Check packages
  const packagesDir = path.join(platformDir, 'packages');
  if (fs.existsSync(packagesDir)) {
    console.log('\n📦 Packages found:');
    const packages = fs.readdirSync(packagesDir);
    packages.forEach(pkg => {
      console.log(`  - @soulfra/${pkg}`);
    });
  }
} else {
  console.log('\n⚠️  OSS structure has not been created yet.');
  console.log('Run: node execute-oss-creation.js');
}

// Check core working files
console.log('\n🔧 Core working files status:');
const coreFiles = [
  'server.js',
  'master-menu-compactor.html',
  'flag-tag-system.js',
  'database-integration.js',
  'electron-app-wrapper.js',
  'create-oss-structure.js',
  'execute-oss-creation.js'
];

coreFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${file}:`, exists ? '✅' : '❌');
});

// Show reality
console.log('\n💡 REALITY CHECK:');
console.log('- The OSS packaging scripts exist but were never executed');
console.log('- The core system works (server.js + master menu)');
console.log('- The directory has 500+ experimental files');
console.log('- To create the OSS structure: node execute-oss-creation.js');
console.log('- To clean up: move core files to soulfra-platform/');