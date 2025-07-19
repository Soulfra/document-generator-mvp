#!/usr/bin/env node

const { exec } = require('child_process');

console.log('🔥 JUST FUCKING RUN IT');

// Run character system NOW
exec('node character-system-max.js', (error, stdout, stderr) => {
  if (stdout) console.log(stdout);
  if (stderr) console.log(stderr);
  if (error) {
    console.log('Failed. Trying web interface...');
    
    exec('node execute-character-system.js', (error2, stdout2, stderr2) => {
      if (stdout2) console.log(stdout2);
      if (stderr2) console.log(stderr2);
      if (error2) {
        console.log('Also failed. Check your files.');
      }
    });
  }
});