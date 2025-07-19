#!/usr/bin/env node

/**
 * RALPH BASH MODE - Let Ralph break everything properly
 */

console.log('🔨 RALPH BASH MODE ACTIVATED');
console.log('============================');

const { exec } = require('child_process');

// Ralph's bash sequence
const bashCommands = [
  'node execute.js',
  'node bash-tests.js', 
  'node execute-plan.js',
  'node ralph-sovereign-agent-test.js',
  'node character-system-max.js'
];

let commandIndex = 0;

function bashNext() {
  if (commandIndex >= bashCommands.length) {
    console.log('🎉 RALPH BASH COMPLETE');
    return;
  }
  
  const command = bashCommands[commandIndex];
  console.log(`\n🔨 RALPH BASHING: ${command}`);
  
  exec(command, (error, stdout, stderr) => {
    if (stdout) console.log('OUTPUT:', stdout);
    if (stderr) console.log('ERROR:', stderr);
    if (error) console.log('FAILED:', error.message);
    
    commandIndex++;
    bashNext();
  });
}

// Start Ralph's bash sequence
bashNext();