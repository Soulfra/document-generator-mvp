#!/usr/bin/env node

// Direct execution bypass
console.log('🔄 Executing Dual Economy Generator...');

try {
  const DualEconomyGenerator = require('./dual-economy-generator.js');
  
  async function run() {
    const generator = new DualEconomyGenerator();
    const result = await generator.generateDualEconomy('./test-document.md');
    
    console.log('✅ DUAL ECONOMY GENERATED!');
    console.log('Product Economy:', result.productEconomy.name);
    console.log('Business Economy:', result.businessEconomy.name);
    console.log('Mirror Links:', result.analytics.mirror_links);
    console.log('Symlinks:', result.analytics.symlinks_created);
    
    return result;
  }
  
  run().catch(console.error);
  
} catch (error) {
  console.error('💥 Failed:', error.message);
}