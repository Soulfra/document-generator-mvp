#!/usr/bin/env node

// Execute contract layer directly
console.log('📜 EXECUTING CONTRACT LAYER...\n');

const ContractLayerBash = require('./contract-layer-bash.js');
const contracts = new ContractLayerBash();

contracts.executeBashSequence()
  .then(report => {
    console.log('\n✅ CONTRACTS EXECUTED!');
    console.log(`📋 Success Rate: ${(report.summary.successRate * 100).toFixed(1)}%`);
  })
  .catch(console.error);