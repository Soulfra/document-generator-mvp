#!/usr/bin/env node

console.log('🩺 DOCTOR RESET - FIXING SHELL RECURSION');

// Reset everything and try direct execution
process.env.PATH = '/usr/local/bin:/usr/bin:/bin';
delete process.env.SHELL_SNAPSHOT;

try {
  const { spawn } = require('child_process');
  
  // Direct Node.js execution
  const child = spawn('node', ['-e', `
    console.log('✅ Direct execution working');
    const fs = require('fs');
    if (fs.existsSync('./flag-mode-hooks.js')) {
      console.log('✅ Flag file exists');
      const FlagModeHooks = require('./flag-mode-hooks.js');
      console.log('✅ Flag class loaded');
      const system = new FlagModeHooks();
      console.log('✅ Flag system created');
      system.setFlag('TEST', true);
      console.log('✅ Flag operation works');
    }
  `], { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  child.on('close', (code) => {
    console.log(`🩺 Doctor result: ${code === 0 ? 'FIXED' : 'FAILED'}`);
  });
  
} catch (error) {
  console.log('🩺 Doctor failed:', error.message);
}