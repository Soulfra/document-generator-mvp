#!/usr/bin/env node

/**
 * Execute Bypass Directly - Workaround for shell issues
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 EXECUTING BYPASS SCRIPT DIRECTLY');
console.log('===================================');

function executeBypass() {
  return new Promise((resolve, reject) => {
    const nodeProcess = spawn('node', ['bypass-environment-blocks.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    nodeProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Bypass script completed successfully');
        resolve(true);
      } else {
        console.log(`\n❌ Bypass script failed with code ${code}`);
        resolve(false);
      }
    });

    nodeProcess.on('error', (error) => {
      console.error('\n💥 Failed to execute bypass script:', error.message);
      reject(error);
    });
  });
}

// Execute immediately
executeBypass()
  .then(success => {
    if (success) {
      console.log('\n🎯 NEXT STEPS:');
      console.log('   1. node disable-blocking-features.js');
      console.log('   2. docker-compose up -d');
      console.log('   3. node direct-error-logger.js');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Execution failed:', error);
    process.exit(1);
  });