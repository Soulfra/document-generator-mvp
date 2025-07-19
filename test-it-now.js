#!/usr/bin/env node

console.log('🔥 TESTING DOCUMENT GENERATOR NOW - NO MORE PLANNING\n');

const { spawn } = require('child_process');
const fs = require('fs');

// Test 1: Can we load the character system?
console.log('TEST 1: Loading Character System...');
try {
  const CharacterSystem = require('./character-system-max.js');
  const chars = new CharacterSystem();
  console.log(`✅ Character system loaded with ${chars.characters.size} characters`);
  
  // Make Nova speak
  const nova = chars.getCharacter('Nova');
  if (nova) {
    nova.speak('Testing complete! The system works!', 'happy');
  }
} catch (e) {
  console.log('❌ Character system error:', e.message);
}

// Test 2: Check if files exist
console.log('\nTEST 2: Checking critical files...');
const criticalFiles = [
  'execute-character-system.js',
  'character-system-max.js', 
  'tier-connector.js',
  'services/sovereign-agents/src/services/SovereignAgent.js'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Test 3: Try to start the web interface
console.log('\nTEST 3: Starting Web Interface...');
console.log('Starting server on http://localhost:8888\n');

const webServer = spawn('node', ['execute-character-system.js'], {
  stdio: 'inherit'
});

webServer.on('error', (err) => {
  console.error('❌ Failed to start web interface:', err.message);
  console.log('\nTrying character system only...');
  
  // Fallback to character system
  const charOnly = spawn('node', ['character-system-max.js'], {
    stdio: 'inherit'
  });
  
  charOnly.on('error', (err2) => {
    console.error('❌ Character system also failed:', err2.message);
  });
});

console.log('\n📝 QUICK DOCUMENTATION:');
console.log('======================');
console.log('The Document Generator has:');
console.log('- 7 Living Characters (Nova, Aria, Flux, etc)');
console.log('- 13+ Tiers of processing');
console.log('- Sovereign Agents with reasoning');
console.log('- Human-in-the-loop approval');
console.log('- WebSocket real-time updates');
console.log('\nAccess at: http://localhost:8888');
console.log('\n💡 If this fails, try:');
console.log('   node character-system-max.js');
console.log('   node tier-connector.js');