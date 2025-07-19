const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 STARTING DOCUMENT GENERATOR PRODUCTION SYSTEM');
console.log('Bypassing shell issues with direct Node.js execution\n');

// Start API server directly
console.log('Starting API Server...');
const apiServer = spawn('node', ['index.js'], {
  cwd: path.join(__dirname, 'services', 'api-server'),
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '3001',
    DATABASE_URL: 'file:./database.db'  // Use SQLite for now
  }
});

apiServer.stdout.on('data', (data) => {
  console.log('API:', data.toString().trim());
});

apiServer.stderr.on('data', (data) => {
  console.error('API Error:', data.toString().trim());
});

// Wait 5 seconds then test
setTimeout(() => {
  console.log('\nTesting system...');
  
  const testScript = `
const fetch = require('node-fetch');

async function quickTest() {
  try {
    console.log('Testing health endpoint...');
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('✅ Health check:', data.status);
    
    console.log('\\nTesting job submission...');
    const jobResponse = await fetch('http://localhost:3001/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'document-analysis',
        input: { content: 'Test document for processing' }
      })
    });
    
    const jobData = await jobResponse.json();
    console.log('✅ Job created:', jobData.jobId);
    
    console.log('\\n🎉 SYSTEM OPERATIONAL!');
    console.log('Document Generator ready to process files');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

quickTest();
`;

  fs.writeFileSync(path.join(__dirname, 'quick-test.js'), testScript);
  
  const testProcess = spawn('node', ['quick-test.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
}, 5000);

console.log('System starting... API server should be running on http://localhost:3001');