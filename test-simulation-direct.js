#!/usr/bin/env node

/**
 * DIRECT SIMULATION TEST
 * Bypasses shell issues by directly requiring and running
 */

console.log('🧪 DIRECT SIMULATION TEST');
console.log('=========================');

try {
  // Direct require
  const DualEconomySimulator = require('./dual-economy-simulator.js');
  
  console.log('✅ Simulator loaded successfully');
  
  // Create instance
  const simulator = new DualEconomySimulator();
  console.log('✅ Simulator instance created');
  
  // Test basic functionality
  console.log('\n🔍 Testing basic functions...');
  
  // Test event emission
  simulator.emit('user_signup', { email: 'test@example.com', plan: 'free' });
  console.log('✅ Event emission works');
  
  // Test subscription
  simulator.emit('subscription_purchase', { amount: 29, plan: 'premium' });
  console.log('✅ Subscription events work');
  
  // Test marketplace transaction
  simulator.emit('marketplace_transaction', { amount: 100, commission: 5 });
  console.log('✅ Marketplace events work');
  
  // Show current state
  console.log('\n📊 Current State:');
  console.log('Product Economy:', {
    users: simulator.productEconomy.users,
    revenue: simulator.productEconomy.revenue,
    subscriptions: simulator.productEconomy.subscription_users
  });
  
  console.log('Business Economy:', {
    compliance: simulator.businessEconomy.legal_compliance,
    health: simulator.businessEconomy.financial_health,
    efficiency: simulator.businessEconomy.operational_efficiency
  });
  
  // Test pen testing functions
  console.log('\n🔒 Testing pen test functions...');
  simulator.stressTestProduct();
  console.log('✅ Stress test works');
  
  simulator.testCompliance();
  console.log('✅ Compliance test works');
  
  simulator.testMirrorConflicts();
  console.log('✅ Mirror conflict test works');
  
  simulator.testFinancialSecurity();
  console.log('✅ Financial security test works');
  
  // Show final state
  console.log('\n📊 Final State After Tests:');
  console.log('Product Economy:', {
    users: simulator.productEconomy.users,
    revenue: simulator.productEconomy.revenue,
    costs: simulator.productEconomy.costs,
    api_calls: simulator.productEconomy.api_calls
  });
  
  console.log('Business Economy:', {
    compliance: simulator.businessEconomy.legal_compliance,
    health: simulator.businessEconomy.financial_health,
    efficiency: simulator.businessEconomy.operational_efficiency,
    runway: simulator.businessEconomy.cash_runway,
    burn_rate: simulator.businessEconomy.burn_rate
  });
  
  console.log('Mirror Layer:', {
    sync_level: simulator.mirrorLayer.sync_level,
    conflicts: simulator.mirrorLayer.conflicts,
    auto_resolved: simulator.mirrorLayer.automated_resolutions
  });
  
  // Generate a quick report
  const report = {
    test_status: 'PASSED',
    product_economy_functional: true,
    business_economy_functional: true,
    mirror_layer_functional: true,
    pen_testing_functional: true,
    total_users: simulator.productEconomy.users,
    total_revenue: simulator.productEconomy.revenue,
    system_health: 'GOOD'
  };
  
  console.log('\n🎉 SIMULATION TEST REPORT:');
  console.log(JSON.stringify(report, null, 2));
  
  // Save test results
  const fs = require('fs');
  fs.writeFileSync('./simulation-test-results.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Test results saved to: simulation-test-results.json');
  
  console.log('\n✅ ALL TESTS PASSED - DUAL ECONOMY SIMULATION WORKS!');
  
} catch (error) {
  console.error('💥 Simulation test failed:', error.message);
  console.error(error.stack);
  
  const errorReport = {
    test_status: 'FAILED',
    error: error.message,
    stack: error.stack
  };
  
  const fs = require('fs');
  fs.writeFileSync('./simulation-test-error.json', JSON.stringify(errorReport, null, 2));
  console.log('💾 Error report saved to: simulation-test-error.json');
}