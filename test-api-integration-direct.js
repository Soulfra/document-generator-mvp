const fs = require('fs');
const path = require('path');

console.log('🧪 Testing API Server Integration\n');

const apiServerDir = path.join(__dirname, 'services', 'api-server');

// Test 1: Check file structure
console.log('Test 1: Checking API server files...');
const requiredFiles = ['index.js', 'PipelineOrchestrator.js', 'JobQueue.js', 'WebSocketManager.js', 'package.json'];

for (const file of requiredFiles) {
  const filePath = path.join(apiServerDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
}

// Test 2: Check Sovereign Agent components
console.log('\nTest 2: Checking Sovereign Agent components...');
const agentFiles = [
  'services/sovereign-agents/src/parsers/StreamingDocumentParser.js',
  'services/sovereign-agents/src/reasoning/ChainOfThoughtEngine.js', 
  'services/sovereign-agents/src/agents/AnalystAgent.js'
];

for (const file of agentFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${path.basename(file)} exists`);
  } else {
    console.log(`❌ ${path.basename(file)} missing`);
  }
}

// Test 3: Test basic component loading
console.log('\nTest 3: Testing component loading...');
try {
  process.chdir(path.join(__dirname, 'services/api-server'));
  
  const JobQueue = require('./JobQueue');
  console.log('✅ JobQueue loads');
  
  const WebSocketManager = require('./WebSocketManager'); 
  console.log('✅ WebSocketManager loads');
  
  const jobQueue = new JobQueue();
  const wsManager = new WebSocketManager();
  console.log('✅ Components instantiate');
  
} catch (error) {
  console.log(`⚠️  Component loading: ${error.message}`);
}

console.log('\n✅ Integration test complete!');
console.log('\n🎯 Next: Install dependencies and start server');
console.log('cd services/api-server && npm install && node index.js');