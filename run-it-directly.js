#!/usr/bin/env node

const { spawn } = require('child_process');

// Just run it
spawn('node', ['test-right-now.js'], { stdio: 'inherit' });