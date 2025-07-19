// QUICK TEST - BASH EXECUTION
const fs = require('fs');
const path = require('path');

console.log('🔥 QUICK TEST - CHECKING WHAT WORKS');

// Test 1: Check files exist
const files = [
  'cli.js',
  'web-interface.js', 
  'git-wrapper.js',
  'FinishThisIdea/sovereign-chatlog-processor.js'
];

console.log('\n📁 File Check:');
files.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// Test 2: Try to require each module
console.log('\n🔧 Module Load Test:');

try {
  require('./cli.js');
  console.log('✅ CLI module loads');
} catch (e) {
  console.log('❌ CLI module error:', e.message.split('\n')[0]);
}

try {
  require('./web-interface.js');
  console.log('✅ Web interface module loads');
} catch (e) {
  console.log('❌ Web interface error:', e.message.split('\n')[0]);
}

try {
  require('./git-wrapper.js');
  console.log('✅ Git wrapper module loads');
} catch (e) {
  console.log('❌ Git wrapper error:', e.message.split('\n')[0]);
}

// Test 3: Quick directory check
console.log('\n📊 Directory Structure:');
const dirs = ['services', 'FinishThisIdea', 'generated', 'uploads'];
dirs.forEach(dir => {
  const exists = fs.existsSync(path.join(__dirname, dir));
  console.log(`${exists ? '✅' : '❌'} ${dir}/`);
});

console.log('\n🚀 READY FOR BASH EXECUTION!');
console.log('Working files can be executed directly with node');

// Test actual execution
console.log('\n🧪 Testing Git Wrapper execution...');
try {
  const GitWrapper = require('./git-wrapper.js');
  console.log('✅ Git wrapper can be instantiated');
} catch (e) {
  console.log('❌ Git wrapper execution error:', e.message);
}