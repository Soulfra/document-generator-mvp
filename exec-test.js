#!/usr/bin/env node

const { exec } = require('child_process');

exec('node test-char-direct.js', (error, stdout, stderr) => {
  console.log('STDOUT:', stdout);
  if (stderr) console.log('STDERR:', stderr);
  if (error) console.log('ERROR:', error.message);
});