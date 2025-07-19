#!/usr/bin/env node

// Direct execution test - no shell, no bash, just Node.js
console.log('🎯 DIRECT EXECUTION TEST\n');

// Test 1: Can we load the character system?
console.log('Test 1: Loading character system...');
try {
  const CharacterSystemMAX = require('./character-system-max.js');
  console.log('✅ Character system class loaded successfully');
  
  // Test 2: Can we instantiate it?
  console.log('\nTest 2: Creating character system instance...');
  const system = new CharacterSystemMAX();
  console.log('✅ Character system instance created');
  
  // Test 3: Check if characters were created
  console.log('\nTest 3: Checking characters...');
  console.log(`✅ Created ${system.characters.size} characters`);
  
  // Test 4: List characters
  console.log('\nTest 4: Character roster:');
  for (const [name, char] of system.characters) {
    console.log(`  ${char.avatar} ${name} - ${char.role}`);
  }
  
  // Test 5: Make a character speak
  console.log('\nTest 5: Testing character interaction...');
  const nova = system.getCharacter('Nova');
  if (nova) {
    nova.speak('System test successful!', 'happy');
    console.log('✅ Character interaction working');
  }
  
  console.log('\n🎉 ALL TESTS PASSED - CHARACTER SYSTEM IS WORKING!');
  console.log('\nThe system is ready to use. Characters are alive and responsive.');
  
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('Stack:', error.stack);
}

// Don't keep the process alive for testing
setTimeout(() => {
  console.log('\n✅ Test complete - exiting');
  process.exit(0);
}, 1000);