#!/usr/bin/env node

/**
 * SEE EVERYTHING - The missing layer
 */

const { spawn } = require('child_process');

console.log('👁️  SEE EVERYTHING MODE');
console.log('===================');

// Start mesh visualizer
console.log('🕸️ Starting mesh visualizer...');
const meshViz = spawn('node', ['mesh-visualizer.js'], { stdio: 'inherit' });

// Start blamechain
console.log('⛓️ Starting blamechain...');
setTimeout(() => {
  const blamechain = spawn('node', ['blamechain.js'], { stdio: 'inherit' });
}, 2000);

// Start character system
console.log('🎭 Starting character system...');
setTimeout(() => {
  const characters = spawn('node', ['character-system-max.js'], { stdio: 'inherit' });
}, 4000);

console.log('\n👁️  NOW YOU CAN SEE EVERYTHING:');
console.log('==============================');
console.log('🕸️ Mesh Visualizer: http://localhost:9999');
console.log('🎭 Character System: Running in background');
console.log('⛓️ Blamechain: Tracking failures');
console.log('\nThe whole point was to SEE what\'s happening!');
console.log('Now you can see all the connections, failures, and processes.');