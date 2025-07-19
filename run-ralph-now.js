#!/usr/bin/env node

// Run Ralph directly
console.log('🚀 RUNNING RALPH NOW');

try {
  require('./ralph-sovereign-agent-test.js');
} catch (e) {
  console.log('Ralph failed:', e.message);
  
  // Try character system
  try {
    require('./character-system-max.js');
  } catch (e2) {
    console.log('Character system failed:', e2.message);
  }
}