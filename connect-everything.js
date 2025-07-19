#!/usr/bin/env node

/**
 * CONNECT EVERYTHING - One script to rule them all
 * This connects all 13+ tiers and starts the system
 */

console.log('🔗 CONNECTING DOCUMENT GENERATOR');
console.log('================================\n');

// Check what exists
const fs = require('fs');
const { spawn } = require('child_process');

// Core components we need
const coreFiles = {
  character: './character-system-max.js',
  web: './execute-character-system.js',
  api: './services/api-server/index.js',
  sovereign: './services/sovereign-agents/src/index.js',
  orchestrator: './master-orchestrator.js',
  executor: './final-executor.js',
  tierConnector: './tier-connector.js'
};

// Check what's available
console.log('📋 Checking components...');
const available = {};
for (const [name, path] of Object.entries(coreFiles)) {
  if (fs.existsSync(path)) {
    console.log(`✅ ${name}: ${path}`);
    available[name] = path;
  } else {
    console.log(`❌ ${name}: missing`);
  }
}

console.log(`\n✅ Found ${Object.keys(available).length}/${Object.keys(coreFiles).length} components`);

// Connection strategy
console.log('\n🎯 CONNECTION STRATEGY');
console.log('=====================');

if (available.executor) {
  console.log('✅ Best option: Final Executor (connects all layers)');
  console.log('   Command: node final-executor.js\n');
} else if (available.orchestrator) {
  console.log('✅ Good option: Master Orchestrator');
  console.log('   Command: node master-orchestrator.js\n');
} else if (available.character && available.web) {
  console.log('✅ Character system available');
  console.log('   Command: node execute-character-system.js\n');
}

// Quick connection test
console.log('🧪 QUICK CONNECTION TEST');
console.log('========================');

// Test character system
if (available.character) {
  try {
    const CharacterSystem = require(available.character);
    const chars = new CharacterSystem();
    console.log(`✅ Character system: ${chars.characters.size} characters ready`);
    
    // Show characters
    const charList = Array.from(chars.characters.keys()).join(', ');
    console.log(`   Characters: ${charList}`);
  } catch (e) {
    console.log('❌ Character system error:', e.message);
  }
}

// Test tier connections
if (available.tierConnector) {
  console.log('\n🔗 Tier connections:');
  try {
    const TierConnector = require(available.tierConnector);
    const connector = new TierConnector();
    console.log('✅ Tier connector loaded');
  } catch (e) {
    console.log('❌ Tier connector error:', e.message);
  }
}

// Manual connection commands
console.log('\n📝 MANUAL CONNECTION COMMANDS');
console.log('=============================');
console.log('Connect and test each component:\n');

console.log('1. Start Character System:');
console.log('   node character-system-max.js\n');

console.log('2. Start Web Interface:');
console.log('   node execute-character-system.js');
console.log('   → Open http://localhost:8888\n');

console.log('3. View All Tiers:');
console.log('   node tier-connector.js\n');

console.log('4. Start Everything:');
console.log('   node final-executor.js\n');

console.log('5. Minimal Memory Mode:');
console.log('   node launch.js');
console.log('   → Open http://localhost:7777\n');

// Auto-start option
console.log('🚀 AUTO-START OPTIONS');
console.log('====================');

function startBestOption() {
  if (available.web) {
    console.log('\n🎭 Starting Character Web Interface...');
    console.log('This connects characters to all tiers\n');
    
    const proc = spawn('node', [available.web], { stdio: 'inherit' });
    
    proc.on('error', (err) => {
      console.error('Failed to start:', err.message);
      console.log('\nTry running manually:');
      console.log('node execute-character-system.js');
    });
    
    proc.on('exit', (code) => {
      if (code !== 0) {
        console.log('\nProcess exited. Try these alternatives:');
        console.log('1. node character-system-max.js');
        console.log('2. node launch.js');
        console.log('3. ./quick-deploy.sh');
      }
    });
  } else {
    console.log('\n⚠️  Web interface not found');
    console.log('Try these commands:');
    console.log('1. node character-system-max.js');
    console.log('2. node tier-connector.js');
  }
}

// Check for command line args
const args = process.argv.slice(2);

if (args.includes('--start')) {
  startBestOption();
} else if (args.includes('--test')) {
  console.log('\n🧪 Running connection test...');
  require('./test-all-connections.js');
} else {
  console.log('\n💡 To auto-start the best option:');
  console.log('   node connect-everything.js --start\n');
  console.log('To run full tests:');
  console.log('   node connect-everything.js --test\n');
  
  // Countdown to auto-start
  console.log('⏰ Auto-starting in 5 seconds... (Press Ctrl+C to cancel)');
  
  let countdown = 5;
  const timer = setInterval(() => {
    countdown--;
    process.stdout.write(`\r⏰ Auto-starting in ${countdown} seconds... (Press Ctrl+C to cancel)`);
    
    if (countdown === 0) {
      clearInterval(timer);
      console.log('\n');
      startBestOption();
    }
  }, 1000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});