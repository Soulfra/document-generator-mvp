#!/usr/bin/env node

// JUST RUN IT - No more complexity
const { exec } = require('child_process');

console.log('🚀 JUST RUNNING THE DOCUMENT GENERATOR\n');

// Option 1: Try the web interface
console.log('Starting web interface...');
const web = exec('node execute-character-system.js');

web.stdout.on('data', (data) => {
  console.log(data.toString());
});

web.stderr.on('data', (data) => {
  console.error(data.toString());
});

web.on('error', (err) => {
  console.log('Web interface failed, trying character system...');
  
  // Option 2: Just the character system
  const chars = exec('node character-system-max.js');
  
  chars.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  chars.on('error', (err2) => {
    console.log('That failed too. Try these manually:');
    console.log('1. node character-system-max.js');
    console.log('2. node tier-connector.js');
    console.log('3. node test-it-now.js');
  });
});

console.log('\n📌 The system should start on http://localhost:8888');
console.log('If nothing happens in 10 seconds, press Ctrl+C and run:');
console.log('   node character-system-max.js');