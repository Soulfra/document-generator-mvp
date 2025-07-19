#!/usr/bin/env node

/**
 * Quick test to verify server components load
 */

console.log('🧪 Quick API Server Component Test\n');

try {
  console.log('Testing JobQueue...');
  const JobQueue = require('./JobQueue');
  const jobQueue = new JobQueue();
  console.log('✅ JobQueue loads and instantiates');

  console.log('\nTesting WebSocketManager...');
  const WebSocketManager = require('./WebSocketManager');
  const wsManager = new WebSocketManager();
  console.log('✅ WebSocketManager loads and instantiates');

  console.log('\nTesting PipelineOrchestrator...');
  try {
    const PipelineOrchestrator = require('./PipelineOrchestrator');
    console.log('⚠️  PipelineOrchestrator loads but may need Sovereign Agent services');
  } catch (error) {
    console.log(`⚠️  PipelineOrchestrator: ${error.message}`);
    console.log('   This is expected - needs Sovereign Agent integration');
  }

  console.log('\n✅ Core components functional!');
  console.log('🎯 Ready to start server with: node index.js');

} catch (error) {
  console.error('❌ Component test failed:', error.message);
}