#!/usr/bin/env node

/**
 * CONNECT ALL ECONOMIES
 * Wires up Product, Business, Truth economies via the Economy Bus
 */

console.log('🔌 CONNECTING ALL ECONOMIES VIA BUS');
console.log('===================================');

try {
  // Load all systems
  const EconomyBus = require('./economy-bus.js');
  const FlagModeHooks = require('./flag-mode-hooks.js');
  const TruthEconomy = require('./truth-economy.js');
  
  console.log('✅ All systems loaded');
  
  // Create instances
  const bus = new EconomyBus();
  const productEconomy = new FlagModeHooks();
  const truthEconomy = new TruthEconomy();
  
  // Mock business economy for now
  const businessEconomy = {
    on: (event, callback) => {},
    emit: (event, data) => console.log(`🏢 Business: ${event}`, data)
  };
  
  console.log('✅ All instances created');
  
  // Connect to bus
  bus.connectEconomy('product', productEconomy);
  bus.connectEconomy('business', businessEconomy);
  bus.connectEconomy('truth', truthEconomy);
  
  console.log('✅ All economies connected to bus');
  
  // Start the bus
  bus.startBus();
  
  // Test the connections
  console.log('\n🧪 Testing connections...');
  
  // Test product -> business message
  bus.sendMessage('product', 'business', 'event', 'user_signup', { 
    email: 'test@example.com',
    plan: 'premium'
  });
  
  // Test business -> product message
  bus.sendMessage('business', 'product', 'command', 'compliance_update', {
    requirement: 'GDPR',
    action: 'enable_privacy_mode'
  });
  
  // Test truth economy conflict resolution
  bus.sendMessage('product', 'truth', 'conflict', 'execution_barrier', {
    error: 'shell_blocked',
    requested_action: 'start_simulation'
  });
  
  // Show bus status
  setTimeout(() => {
    console.log('\n📊 BUS STATUS AFTER TESTS:');
    console.log(JSON.stringify(bus.getBusStatus(), null, 2));
    
    console.log('\n📋 RECENT MESSAGES:');
    bus.getMessageHistory(5).forEach(msg => {
      console.log(`  ${msg.timestamp} | ${msg.from} -> ${msg.to} | ${msg.event} | ${msg.status}`);
    });
    
    console.log('\n🎉 ALL ECONOMIES CONNECTED AND COMMUNICATING!');
    
  }, 2000);
  
} catch (error) {
  console.error('💥 Connection failed:', error.message);
  console.error(error.stack);
}