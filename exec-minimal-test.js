#!/usr/bin/env node

const { exec } = require('child_process');

console.log('🚀 EXECUTING MINIMAL TEST\n');

// Run the minimal test
exec('node minimal-test.js', (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(stdout);
  
  if (stderr) {
    console.error('Stderr:', stderr);
  }
  
  console.log('\n✅ Test complete!');
  console.log('\nBased on the results above, try:');
  console.log('1. npm install (if dependencies missing)');
  console.log('2. node character-system-max.js');
  console.log('3. node fix-and-run.js');
});