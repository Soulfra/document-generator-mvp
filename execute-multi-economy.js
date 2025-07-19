#!/usr/bin/env node

// Execute multi-economy expansion directly
console.log('🌍 EXECUTING MULTI-ECONOMY EXPANSION...\n');

const MultiEconomyExpansion = require('./multi-economy-expansion.js');
const expansion = new MultiEconomyExpansion();

expansion.expandEconomies()
  .then(result => {
    console.log('\n✅ SUCCESS!');
    console.log(`🌍 Economies: ${result.summary.total_economies}`);
    console.log(`🎮 APIs: ${result.summary.game_apis_integrated}`);
  })
  .catch(console.error);