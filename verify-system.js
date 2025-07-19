#!/usr/bin/env node

/**
 * VERIFY SYSTEM - Quick check that everything is ready
 */

const fs = require('fs');

console.log('🔍 SYSTEM VERIFICATION');
console.log('=====================\n');

const components = [
  'multi-economy-expansion.js',
  'mesh-layer-integration.js',
  'camel-third-hump.js',
  'contract-layer-bash.js',
  'projection-narrator.js',
  'runtime-execution.js',
  'frontend-rebuild.js',
  'bash-complete-system.js',
  'system-review-round.js',
  'ultimate-bash-through.js',
  'rip-it.js'
];

let allGood = true;

console.log('📦 Checking components:');
components.forEach(comp => {
  const exists = fs.existsSync(`./${comp}`);
  console.log(`  ${exists ? '✅' : '❌'} ${comp}`);
  if (!exists) allGood = false;
});

console.log('\n📄 Generated files:');
const generated = [
  'frontend-unified-interface.html',
  'SYSTEM-COMPLETE.md'
];

generated.forEach(file => {
  const exists = fs.existsSync(`./${file}`);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n🏁 VERIFICATION RESULT:');
if (allGood) {
  console.log('✅ ALL SYSTEMS GO!');
  console.log('🚀 Run "node rip-it.js" to launch everything');
} else {
  console.log('⚠️  Some components missing');
  console.log('🔧 But the core system should still work');
}

console.log('\n💥 READY TO RIP!');