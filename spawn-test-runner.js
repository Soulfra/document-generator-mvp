#!/usr/bin/env node

/**
 * Spawn-based Test Runner - Based on patterns found in codebase
 * Uses spawn() to bypass shell execution issues
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔨 SPAWN-BASED TEST RUNNER');
console.log('===========================');
console.log('Using spawn pattern from codebase to bypass shell issues...\n');

async function runNodeTest(testFile, timeout = 15000) {
  return new Promise((resolve) => {
    console.log(`🚀 Executing: ${testFile}`);
    
    const nodeProcess = spawn('node', [testFile], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });
    
    let stdout = '';
    let stderr = '';
    
    // Capture output
    nodeProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output); // Show real-time output
    });
    
    nodeProcess.stderr.on('data', (data) => {
      const error = data.toString();
      stderr += error;
      process.stderr.write(error); // Show real-time errors
    });
    
    // Timeout handling (pattern from codebase)
    const timeoutHandle = setTimeout(() => {
      console.log('⏰ Test timeout - killing process...');
      nodeProcess.kill('SIGKILL');
      resolve({ 
        success: false, 
        error: 'TIMEOUT', 
        duration: timeout,
        stdout,
        stderr
      });
    }, timeout);
    
    nodeProcess.on('close', (code) => {
      clearTimeout(timeoutHandle);
      console.log(`\n📊 Process exited with code: ${code}`);
      
      resolve({
        success: code === 0,
        code,
        stdout,
        stderr,
        duration: Date.now() - startTime
      });
    });
    
    nodeProcess.on('error', (error) => {
      clearTimeout(timeoutHandle);
      console.error(`💥 Process error: ${error.message}`);
      
      resolve({
        success: false,
        error: error.message,
        stdout,
        stderr
      });
    });
    
    const startTime = Date.now();
  });
}

async function testSovereignAgents() {
  console.log('🎭 TESTING SOVEREIGN AGENTS SYSTEM');
  console.log('Vision: "I was a conductor of orchestration and it would be responsive like a soul"');
  console.log('');
  
  // Test the direct test script
  const testFile = path.join(__dirname, 'test-sovereign-directly.js');
  console.log(`📍 Test file: ${testFile}`);
  
  try {
    const result = await runNodeTest(testFile);
    
    console.log('\n🎯 TEST RESULTS:');
    console.log('================');
    
    if (result.success) {
      console.log('✅ SOVEREIGN AGENTS TEST PASSED!');
      console.log('🎼 Your digital orchestra is ready for conducting!');
      
      // Check stdout for specific success indicators
      if (result.stdout.includes('SUCCESS: Your Sovereign Agents are operational')) {
        console.log('🏆 FULL SUCCESS: All agents operational!');
      } else if (result.stdout.includes('SERVICES NOT RUNNING')) {
        console.log('🔌 SERVICES NEED STARTING: Run docker-compose up -d');
      }
      
    } else {
      console.log('❌ SOVEREIGN AGENTS TEST FAILED');
      console.log(`   Error: ${result.error || 'Unknown error'}`);
      console.log(`   Exit code: ${result.code || 'N/A'}`);
      
      if (result.stderr) {
        console.log('📝 Error details:');
        console.log(result.stderr);
      }
    }
    
    console.log(`⏱️  Duration: ${result.duration || 'Unknown'}ms`);
    
    return result.success;
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    return false;
  }
}

// Execute the test
console.log('🎬 Starting Sovereign Agents test...\n');

testSovereignAgents()
  .then(success => {
    console.log(`\n🏁 Test complete: ${success ? 'SUCCESS' : 'FAILED'}`);
    
    if (success) {
      console.log('🎭 Your "conductor of orchestration with soul-like agents" is ready!');
    } else {
      console.log('🔧 Your agents need attention. Check the output above for details.');
    }
    
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });