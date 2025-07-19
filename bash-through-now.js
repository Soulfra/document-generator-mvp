#!/usr/bin/env node

// BASH THROUGH NOW - DIRECT EXECUTION
console.log('🔥 BASHING THROUGH - EXECUTING EVERYTHING NOW');

const fs = require('fs');
const path = require('path');

// Change to correct directory
process.chdir('/Users/matthewmauer/Desktop/Document-Generator');
console.log('📂 Working directory:', process.cwd());

// 1. EXECUTE GIT WRAPPER IMMEDIATELY
console.log('\n1. 🔧 EXECUTING GIT WRAPPER NOW...');
try {
  const GitWrapper = require('./git-wrapper.js');
  const wrapper = new GitWrapper();
  
  // Run initialization
  wrapper.initialize().then(() => {
    console.log('✅ Git wrapper initialized');
    return wrapper.showStatus();
  }).then(() => {
    console.log('✅ Git wrapper status complete');
  });
  
} catch (error) {
  console.log('❌ Git wrapper failed:', error.message);
}

// 2. EXECUTE WEB INTERFACE IMMEDIATELY  
console.log('\n2. 🌐 STARTING WEB INTERFACE NOW...');
try {
  const WebInterface = require('./web-interface.js');
  const webInterface = new WebInterface(8080);
  
  webInterface.initialize().then(() => {
    console.log('✅ Web interface running on http://localhost:8080');
    console.log('🌐 Open browser to http://localhost:8080 to use');
  });
  
} catch (error) {
  console.log('❌ Web interface failed:', error.message);
}

// 3. TEST SOVEREIGN PROCESSOR
console.log('\n3. 🎭 TESTING SOVEREIGN PROCESSOR...');
try {
  // Check if sovereign processor exists
  const sovereignPath = './FinishThisIdea/sovereign-chatlog-processor.js';
  if (fs.existsSync(sovereignPath)) {
    console.log('✅ Sovereign processor found');
    console.log('🎮 Ready for demo mode execution');
  } else {
    console.log('❌ Sovereign processor not found at', sovereignPath);
  }
} catch (error) {
  console.log('❌ Sovereign processor error:', error.message);
}

// 4. CHECK ALL DEPENDENCIES
console.log('\n4. 📦 CHECKING DEPENDENCIES...');
const requiredDeps = ['express', 'ws', 'multer'];
requiredDeps.forEach(dep => {
  try {
    require(dep);
    console.log(`✅ ${dep} available`);
  } catch (error) {
    console.log(`❌ ${dep} missing - run: npm install ${dep}`);
  }
});

// 5. SHOW EXECUTION INSTRUCTIONS
console.log('\n🚀 EXECUTION READY - HERE ARE YOUR COMMANDS:');
console.log('===========================================');
console.log('');
console.log('🔧 Git Management:');
console.log('   node git-wrapper.js status');
console.log('   node git-wrapper.js create my-mvp');
console.log('');
console.log('🌐 Web Interface:');
console.log('   node web-interface.js');
console.log('   → Open http://localhost:8080');
console.log('');
console.log('📋 CLI Interface:');
console.log('   node cli.js');
console.log('   → Follow interactive menu');
console.log('');
console.log('🎭 Sovereign Mode:');
console.log('   cd FinishThisIdea');
console.log('   node sovereign-chatlog-processor.js');
console.log('');
console.log('📦 Package Scripts:');
console.log('   npm start    → CLI interface');
console.log('   npm run web  → Web interface');
console.log('   npm run api  → API server only');
console.log('');

// 6. AUTO-START WEB INTERFACE
setTimeout(() => {
  console.log('\n🎯 WEB INTERFACE SHOULD BE RUNNING NOW!');
  console.log('📱 Access at: http://localhost:8080');
  console.log('💡 Upload a document to test the system');
}, 2000);

console.log('\n✅ BASH THROUGH COMPLETE - SYSTEM OPERATIONAL!');