#!/usr/bin/env node

console.log('🧪 TESTING BASH COMPONENTS...\n');

// Test 1: Multi-Economy
console.log('TEST 1: Multi-Economy Expansion');
try {
  const MultiEconomyExpansion = require('./multi-economy-expansion.js');
  console.log('✅ Multi-Economy module loads');
} catch (e) {
  console.log('❌ Multi-Economy failed:', e.message);
}

// Test 2: CAMEL
console.log('\nTEST 2: CAMEL Third Hump');
try {
  const CAMELThirdHump = require('./camel-third-hump.js');
  console.log('✅ CAMEL module loads');
} catch (e) {
  console.log('❌ CAMEL failed:', e.message);
}

// Test 3: Contracts
console.log('\nTEST 3: Contract Layer');
try {
  const ContractLayerBash = require('./contract-layer-bash.js');
  console.log('✅ Contract module loads');
} catch (e) {
  console.log('❌ Contract failed:', e.message);
}

console.log('\n🚀 Ready to bash! Run: node BASH-ULTIMATE-NOW.js');