const { spawn } = require('child_process');

// Just run the character system
spawn('node', ['character-system-max.js'], { stdio: 'inherit' });