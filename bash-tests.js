#!/usr/bin/env node

const { exec } = require('child_process');

console.log('🔨 BASH TESTS RUNNING');

// Test 1: Run execute.js
exec('node execute.js', (error, stdout, stderr) => {
  console.log('EXECUTE OUTPUT:', stdout);
  if (stderr) console.log('EXECUTE ERROR:', stderr);
  
  // Test 2: Run character system directly
  exec('node character-system-max.js', (error2, stdout2, stderr2) => {
    console.log('CHAR SYSTEM OUTPUT:', stdout2);
    if (stderr2) console.log('CHAR SYSTEM ERROR:', stderr2);
    
    // Test 3: Check if web interface works
    exec('node execute-character-system.js', (error3, stdout3, stderr3) => {
      console.log('WEB INTERFACE OUTPUT:', stdout3);
      if (stderr3) console.log('WEB INTERFACE ERROR:', stderr3);
      
      console.log('\n✅ ALL TESTS COMPLETE');
    });
  });
});