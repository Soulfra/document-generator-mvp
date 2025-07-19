const { spawn } = require('child_process');

// Force run character system
const proc = spawn('node', ['character-system-max.js'], { stdio: 'inherit' });

proc.on('error', () => {
  console.log('Failed. Files exist?');
  const fs = require('fs');
  console.log('character-system-max.js exists:', fs.existsSync('./character-system-max.js'));
});