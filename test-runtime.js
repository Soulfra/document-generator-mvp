#!/usr/bin/env node

console.log('🧪 TESTING ECONOMY RUNTIME');
console.log('==========================');

try {
  const EconomyRuntime = require('./economy-runtime.js');
  
  console.log('✅ Runtime loaded');
  
  const runtime = new EconomyRuntime();
  console.log('✅ Runtime created');
  
  // Test basic functionality
  runtime.queueTask('simulate_user');
  runtime.queueTask('generate_revenue');
  console.log('✅ Tasks queued');
  
  // Test status
  const status = runtime.getStatus();
  console.log('📊 Status:', JSON.stringify(status, null, 2));
  
  console.log('✅ RUNTIME TEST PASSED');
  
} catch (error) {
  console.error('💥 Runtime test failed:', error.message);
}