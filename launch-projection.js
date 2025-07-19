#!/usr/bin/env node

/**
 * LAUNCH PROJECTION SYSTEM
 * Starts the complete multi-economy visualization
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 LAUNCHING PROJECTION SYSTEM');
console.log('==============================');

// Check if projection narrator exists
if (!fs.existsSync('./projection-narrator.js')) {
  console.error('❌ projection-narrator.js not found!');
  process.exit(1);
}

console.log('✅ Starting Projection Narrator...');

// Start the projection narrator
const narrator = spawn('node', ['projection-narrator.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

narrator.on('error', (err) => {
  console.error('❌ Failed to start narrator:', err);
});

narrator.on('exit', (code) => {
  console.log(`Narrator exited with code ${code}`);
});

console.log('\n📺 PROJECTION SYSTEM LAUNCHED!');
console.log('===============================');
console.log('🌐 Open in browser: http://localhost:8888');
console.log('📊 Live visualization of:');
console.log('   - 9 Active Economies');
console.log('   - 5 Game Economy APIs');
console.log('   - Real-time reasoning differentials');
console.log('   - Cross-economy synergies');
console.log('   - Live event narration');
console.log('\n🎭 The system is now visible and narrated!');
console.log('Press Ctrl+C to stop the projection');