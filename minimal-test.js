#!/usr/bin/env node

// MINIMAL TEST - No dependencies required
console.log('🧪 MINIMAL DOCUMENT GENERATOR TEST\n');

const fs = require('fs');

// Test 1: What files exist?
console.log('FILES THAT EXIST:');
const importantFiles = [
  'character-system-max.js',
  'execute-character-system.js',
  'tier-connector.js',
  'cli.js',
  'web-interface.js',
  'master-orchestrator.js',
  'final-executor.js'
];

let foundCount = 0;
importantFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
    foundCount++;
  } else {
    console.log(`❌ ${file}`);
  }
});

console.log(`\nFound ${foundCount}/${importantFiles.length} files`);

// Test 2: Can we load character system?
console.log('\nCHARACTER SYSTEM TEST:');
try {
  // Don't actually require it, just check if it would parse
  const content = fs.readFileSync('./character-system-max.js', 'utf8');
  if (content.includes('CharacterSystemMAX')) {
    console.log('✅ Character system file looks valid');
    console.log('   Contains: CharacterSystemMAX class');
    
    // Count characters
    const charCount = (content.match(/createCharacter\(/g) || []).length;
    console.log(`   Characters defined: ${charCount}`);
  }
} catch (e) {
  console.log('❌ Could not read character system');
}

// Test 3: Check for dependencies
console.log('\nDEPENDENCY CHECK:');
if (fs.existsSync('./node_modules')) {
  console.log('✅ node_modules exists');
} else {
  console.log('❌ node_modules missing - run: npm install');
}

if (fs.existsSync('./package.json')) {
  console.log('✅ package.json exists');
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  console.log(`   Dependencies: ${Object.keys(pkg.dependencies || {}).join(', ')}`);
}

// Test 4: Service directories
console.log('\nSERVICE DIRECTORIES:');
const serviceDirs = [
  './services/api-server',
  './services/sovereign-agents',
  './FinishThisIdea'
];

serviceDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}`);
  } else {
    console.log(`❌ ${dir}`);
  }
});

// Summary
console.log('\n📊 SUMMARY:');
console.log('===========');
if (foundCount >= 5) {
  console.log('✅ Core files present - system should work');
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Run: node character-system-max.js');
  console.log('3. Or run: node execute-character-system.js');
} else {
  console.log('❌ Missing critical files');
  console.log('Check you are in the right directory');
}

console.log('\n💡 SIMPLEST COMMAND TO TRY:');
console.log('   node character-system-max.js');
console.log('\nThis should work even without dependencies installed.');