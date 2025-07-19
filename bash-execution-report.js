#!/usr/bin/env node

/**
 * BASH EXECUTION REPORT
 * Shows what components we have and what's ready to run
 */

const fs = require('fs');
const path = require('path');

console.log('💥 BASH EXECUTION STATUS REPORT');
console.log('==============================\n');

// Check what we have
const components = {
  'Core Files': {
    'Multi-Economy Expansion': 'multi-economy-expansion.js',
    'Mesh Layer Integration': 'mesh-layer-integration.js', 
    'CAMEL Third Hump': 'camel-third-hump.js',
    'Contract Layer Bash': 'contract-layer-bash.js',
    'Ultimate Bash Through': 'ultimate-bash-through.js',
    'Frontend Rebuild': 'frontend-rebuild.js',
    'Projection Narrator': 'projection-narrator.js',
    'Runtime Execution': 'runtime-execution.js'
  },
  'Economy Files': {
    'MVP Generator': 'mvp-generator.js',
    'Dual Economy Generator': 'dual-economy-generator.js',
    'Truth Economy': 'truth-economy.js',
    'Economy Bus': 'economy-bus.js',
    'Economy Runtime': 'economy-runtime.js'
  },
  'Character System': {
    'Bash Through Characters': 'bash-through-characters.js',
    'Post Bash Testing': 'post-bash-testing-camel.js',
    'Post CAMEL Plan': 'post-camel-plan.js'
  },
  'Execution Files': {
    'RIP IT': 'rip-it.js',
    'Bash It Now': 'bash-it-now.js',
    'Execute Contract Bash': 'execute-contract-bash.js'
  }
};

// Check each category
Object.entries(components).forEach(([category, files]) => {
  console.log(`📦 ${category}:`);
  Object.entries(files).forEach(([name, file]) => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`  ${exists ? '✅' : '❌'} ${name} (${file})`);
  });
  console.log('');
});

// Test multi-economy expansion
console.log('🧪 TESTING MULTI-ECONOMY EXPANSION...\n');

try {
  const MultiEconomyExpansion = require('./multi-economy-expansion.js');
  const expansion = new MultiEconomyExpansion();
  
  console.log('✅ Multi-Economy class loaded successfully');
  console.log(`📊 Expansion ID: ${expansion.expansionId}`);
  console.log(`🌍 Original economies: ${Object.keys(expansion.originalEconomies).join(', ')}`);
  console.log(`🎮 Game APIs: ${Object.keys(expansion.gameEconomyAPIs).join(', ')}`);
  
  // Quick synchronous test
  console.log('\n🚀 Running expansion test...');
  expansion.expandEconomies().then(result => {
    console.log('\n✅ MULTI-ECONOMY EXPANSION SUCCESS!');
    console.log(`📊 Total economies: ${result.summary.total_economies}`);
    console.log(`🎮 Game APIs: ${result.summary.game_apis_integrated}`);
    console.log(`🧠 Reasoning differentials: ${result.summary.reasoning_differentials}`);
    console.log(`🔍 Search capabilities: ${result.summary.search_capabilities ? 'Active' : 'Inactive'}`);
    
    console.log('\n💥 SYSTEM IS READY TO BASH!');
    console.log('================================');
    console.log('🚀 Run any of these commands:');
    console.log('   node multi-economy-expansion.js    # Test economies');
    console.log('   node contract-layer-bash.js        # Test contracts');
    console.log('   node camel-third-hump.js          # Test CAMEL');
    console.log('   node ultimate-bash-through.js     # Full system bash');
  }).catch(error => {
    console.error('❌ Multi-economy test failed:', error);
  });
  
} catch (error) {
  console.error('❌ Failed to load multi-economy expansion:', error.message);
}

// Show existing generated files
console.log('\n📄 GENERATED FILES:');
const generatedFiles = [
  'mesh-integration-state.json',
  'camel-third-hump-report.json',
  'contract-bash-report.json',
  'frontend-unified-interface.html',
  'SYSTEM-COMPLETE.md'
];

generatedFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  if (exists) {
    const stats = fs.statSync(path.join(__dirname, file));
    console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  }
});