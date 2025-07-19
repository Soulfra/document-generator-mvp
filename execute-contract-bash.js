#!/usr/bin/env node

/**
 * EXECUTE CONTRACT BASH
 * Runs the contract layer with guardian approvals
 */

const ContractLayerBash = require('./contract-layer-bash.js');

console.log('🔐 EXECUTING CONTRACT LAYER BASH');
console.log('================================');
console.log('🛡️ Guardian system online');
console.log('📜 Contract validation active');
console.log('💥 Starting bash sequence...\n');

async function executeContractBash() {
  try {
    // Create contract bash instance
    const contractBash = new ContractLayerBash();
    
    // Execute the bash sequence
    const report = await contractBash.executeBashSequence();
    
    // Display final status
    console.log('\n🎯 CONTRACT EXECUTION SUMMARY');
    console.log('============================');
    
    if (report.summary.successRate >= 0.8) {
      console.log('✅ CONTRACT BASH SUCCESSFUL!');
      console.log('🛡️ Guardian approvals obtained');
      console.log('🚀 System deployed with oversight');
    } else {
      console.log('⚠️ CONTRACT BASH PARTIAL SUCCESS');
      console.log('🔧 Some operations require review');
    }
    
    // Show quick stats
    console.log('\n📊 Quick Stats:');
    console.log(`   Actions Attempted: ${report.summary.totalActions}`);
    console.log(`   Successfully Executed: ${report.summary.executed}`);
    console.log(`   Guardian Rejections: ${report.summary.rejected}`);
    console.log(`   Success Rate: ${(report.summary.successRate * 100).toFixed(1)}%`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Contract bash failed:', error);
    process.exit(1);
  }
}

// Run it
executeContractBash()
  .then(() => {
    console.log('\n✅ Contract layer bash complete!');
  })
  .catch(console.error);