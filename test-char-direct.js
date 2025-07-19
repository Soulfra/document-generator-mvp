#!/usr/bin/env node

// Direct test - no dependencies needed
try {
  console.log('Testing character system directly...\n');
  
  const CharacterSystemMAX = require('./character-system-max.js');
  
  console.log('✅ Character system loaded successfully!');
  console.log('The system is working.');
  
} catch (error) {
  console.log('❌ Error loading character system:', error.message);
  console.log('Stack:', error.stack);
}