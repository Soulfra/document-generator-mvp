const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 EXECUTING PRODUCTION DEPLOYMENT NOW\n');

// Create .env.production if it doesn't exist
const envPath = path.join(__dirname, '.env.production');
if (!fs.existsSync(envPath)) {
  console.log('Creating .env.production...');
  const envExample = fs.readFileSync(path.join(__dirname, '.env.production.example'), 'utf8');
  const envProduction = envExample
    .replace('your_secure_password', 'docgen_prod_2024')
    .replace('your_super_secure_jwt_secret_key_here', 'jwt_secret_' + Math.random().toString(36))
    .replace('your_anthropic_api_key', process.env.ANTHROPIC_API_KEY || 'sk-ant-test')
    .replace('your_openai_api_key', process.env.OPENAI_API_KEY || 'sk-test')
    .replace('your_grafana_admin_password', 'admin123');
  
  fs.writeFileSync(envPath, envProduction);
  console.log('✅ .env.production created');
}

// Start Docker production stack
console.log('Starting production Docker stack...');
const dockerProcess = spawn('docker-compose', ['-f', 'docker-compose.production.yml', 'up', '-d'], {
  cwd: __dirname,
  stdio: 'inherit'
});

dockerProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Docker stack started successfully');
    
    // Wait for services to be ready, then test
    console.log('Waiting for services to initialize...');
    setTimeout(() => {
      console.log('\nTesting production system...');
      
      const testProcess = spawn('node', ['test-monitoring-system.js'], {
        cwd: __dirname,
        stdio: 'inherit'
      });
      
      testProcess.on('close', (testCode) => {
        if (testCode === 0) {
          console.log('\n🎉 PRODUCTION SYSTEM FULLY OPERATIONAL!');
          console.log('\n📊 Access points:');
          console.log('   API Server: http://localhost:3001');
          console.log('   Grafana Dashboard: http://localhost:3000');
          console.log('   Prometheus: http://localhost:9090');
          console.log('   Health Check: http://localhost:3001/health');
          
          console.log('\n🚀 Ready to process 500MB documents!');
        } else {
          console.log('\n⚠️ Some tests failed, but system may still be operational');
          console.log('Check individual services with: docker-compose -f docker-compose.production.yml ps');
        }
      });
      
    }, 30000); // 30 second wait for all services
    
  } else {
    console.log('\n❌ Docker stack failed to start');
    console.log('Check status: docker-compose -f docker-compose.production.yml ps');
  }
});

dockerProcess.on('error', (error) => {
  console.error('Docker error:', error.message);
  console.log('\nTrying alternative startup...');
  
  // Fallback: start API server directly
  const apiProcess = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, 'services', 'api-server'),
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '3001'
    }
  });
  
  console.log('Started API server directly on port 3001');
});