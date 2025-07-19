const path = require('path');

console.log('🧪 Testing API Server Startup\n');

try {
  // Change to API server directory
  const apiDir = path.join(__dirname, 'services', 'api-server');
  process.chdir(apiDir);
  
  console.log('📋 Testing JobQueue...');
  const JobQueue = require('./JobQueue');
  const jobQueue = new JobQueue();
  console.log('✅ JobQueue works');
  
  console.log('🔌 Testing WebSocketManager...');
  const WebSocketManager = require('./WebSocketManager');
  const wsManager = new WebSocketManager();
  console.log('✅ WebSocketManager works');
  
  console.log('🎯 Testing PipelineOrchestrator...');
  const PipelineOrchestrator = require('./PipelineOrchestrator');
  const pipeline = new PipelineOrchestrator(jobQueue, wsManager);
  console.log('✅ PipelineOrchestrator works');
  
  console.log('\n🚀 All components load successfully!');
  console.log('Ready to start server: node index.js');
  
  // Test actual server start
  console.log('\n🔥 Testing server initialization...');
  const app = require('./index.js');
  console.log('✅ Server module loads without errors');
  
} catch (error) {
  console.error('❌ Startup test failed:', error.message);
  console.error('Stack:', error.stack);
}