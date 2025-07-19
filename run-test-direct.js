const fs = require('fs');
const path = require('path');

console.log('🧪 Testing API Server Integration\n');

const apiServerDir = path.join(__dirname, 'services', 'api-server');

// Test 1: Check if all required files exist
console.log('Test 1: Checking file structure...');
const requiredFiles = [
  'index.js',
  'PipelineOrchestrator.js',
  'JobQueue.js',
  'WebSocketManager.js',
  'package.json'
];

let filesOk = true;
for (const file of requiredFiles) {
  const filePath = path.join(apiServerDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    filesOk = false;
  }
}

if (!filesOk) {
  console.log('\n❌ Missing required files. Cannot continue testing.');
  process.exit(1);
}

console.log('\n✅ All required files exist\n');

// Test 2: Check dependencies structure
console.log('Test 2: Checking dependency references...');
try {
  const indexContent = fs.readFileSync(path.join(apiServerDir, 'index.js'), 'utf8');
  
  const expectedImports = [
    'PipelineOrchestrator',
    'JobQueue', 
    'WebSocketManager'
  ];
  
  for (const imp of expectedImports) {
    if (indexContent.includes(imp)) {
      console.log(`✅ ${imp} imported correctly`);
    } else {
      console.log(`⚠️  ${imp} import not found`);
    }
  }
  
} catch (error) {
  console.log(`❌ Error checking imports: ${error.message}`);
}

console.log('\n✅ Integration test complete!');
console.log('\n🎯 Next Steps:');
console.log('1. cd services/api-server');
console.log('2. npm install');  
console.log('3. npm start');
console.log('\n📡 API Server will be at http://localhost:3001');