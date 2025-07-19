#!/usr/bin/env node

// BASH OUR WAY FORWARD - TEST EVERYTHING NOW
const { spawn } = require('child_process');
const path = require('path');

console.log('🔥 BASHING FORWARD - TESTING ALL INTERFACES NOW');
console.log('================================================');

async function testInterface(name, script, args = []) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testing ${name}...`);
    
    const process = spawn('node', [script, ...args], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    let hasError = false;
    
    process.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(`${name}:`, text.trim());
    });
    
    process.stderr.on('data', (data) => {
      const text = data.toString();
      if (!text.includes('DeprecationWarning')) {
        hasError = true;
        console.error(`${name} ERROR:`, text.trim());
      }
    });
    
    setTimeout(() => {
      process.kill();
      console.log(`✅ ${name} test completed (${hasError ? 'WITH ERRORS' : 'SUCCESS'})`);
      resolve({ name, success: !hasError, output });
    }, 5000); // 5 second test window
  });
}

async function runAllTests() {
  console.log('Starting rapid-fire testing...\n');
  
  // Test 1: Git Wrapper (safest)
  const gitResult = await testInterface('Git Wrapper', 'git-wrapper.js', ['status']);
  
  // Test 2: Web Interface 
  const webResult = await testInterface('Web Interface', 'web-interface.js');
  
  // Test 3: CLI Interface
  const cliResult = await testInterface('CLI Interface', 'cli.js');
  
  // Test 4: Sovereign Processor
  const sovereignResult = await testInterface('Sovereign Processor', 'FinishThisIdea/sovereign-chatlog-processor.js');
  
  // Results
  console.log('\n🎯 TEST RESULTS SUMMARY');
  console.log('=======================');
  
  const results = [gitResult, webResult, cliResult, sovereignResult];
  results.forEach(result => {
    const status = result.success ? '✅ WORKING' : '❌ FAILED';
    console.log(`${result.name}: ${status}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n🏆 ${successCount}/${results.length} interfaces working`);
  
  if (successCount > 0) {
    console.log('\n🚀 READY TO BASH FORWARD WITH WORKING INTERFACES!');
    console.log('Next: Use working interfaces to process documents');
  } else {
    console.log('\n🔧 Need to fix interface issues before proceeding');
  }
}

runAllTests().catch(console.error);