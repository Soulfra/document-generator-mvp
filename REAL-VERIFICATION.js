#!/usr/bin/env node

/**
 * REAL VERIFICATION SYSTEM
 * Actually tests if services work, not just if files exist
 */

const http = require('http');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEBUG = true;
const log = (msg, data) => console.log(`[${new Date().toISOString()}] ${msg}`, data || '');
const error = (msg, err) => console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, err || '');

// Real service tests
const services = {
  'document-generator': {
    name: 'Document Generator',
    startCommand: 'node document-generator-app.js',
    port: 4000,
    healthEndpoint: '/health',
    testEndpoint: '/api/process',
    testPayload: {
      document: 'Sample business plan for testing',
      type: 'business-plan'
    }
  },
  'ai-api': {
    name: 'AI API Service',
    startCommand: 'node services/real-ai-api.js',
    port: 3001,
    healthEndpoint: '/health',
    testEndpoint: '/api/analyze',
    testPayload: {
      text: 'Test document content',
      model: 'test'
    }
  },
  'template-processor': {
    name: 'Template Processor',
    startCommand: 'node services/real-template-processor.js',
    port: 3000,
    healthEndpoint: '/health',
    testEndpoint: '/api/templates',
    testPayload: null
  }
};

// Kill process on port
async function killPort(port) {
  try {
    const pid = execSync(`lsof -ti :${port} || echo ""`, { encoding: 'utf8' }).trim();
    if (pid) {
      execSync(`kill -9 ${pid}`);
      log(`Killed process ${pid} on port ${port}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (e) {
    // Port already free
  }
}

// Make HTTP request with timeout
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout after 5s'));
    }, 5000);

    const req = http.request(options, (res) => {
      clearTimeout(timeout);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

// Start a service and wait for it to be ready
async function startService(serviceId) {
  const service = services[serviceId];
  log(`Starting ${service.name}...`);

  // Kill anything on the port first
  await killPort(service.port);

  // Start the service
  const [command, ...args] = service.startCommand.split(' ');
  const proc = spawn(command, args, {
    cwd: process.cwd(),
    stdio: 'pipe',
    detached: false
  });

  let startupLogs = '';
  let errorLogs = '';

  proc.stdout.on('data', (data) => {
    startupLogs += data.toString();
    if (DEBUG) console.log(`[${serviceId}]`, data.toString().trim());
  });

  proc.stderr.on('data', (data) => {
    errorLogs += data.toString();
    if (DEBUG) console.error(`[${serviceId} ERROR]`, data.toString().trim());
  });

  proc.on('error', (err) => {
    error(`Failed to start ${service.name}`, err);
  });

  // Wait for service to be ready
  const maxRetries = 30;
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: service.port,
        path: service.healthEndpoint,
        method: 'GET'
      });

      if (response.statusCode === 200) {
        log(`${service.name} started successfully on port ${service.port}`);
        return { 
          success: true, 
          process: proc, 
          pid: proc.pid,
          startupLogs,
          errorLogs
        };
      }
    } catch (err) {
      // Not ready yet
    }
  }

  // Failed to start
  proc.kill();
  return { 
    success: false, 
    error: 'Service failed to start within 30 seconds',
    startupLogs,
    errorLogs
  };
}

// Test service functionality
async function testService(serviceId) {
  const service = services[serviceId];
  const results = {
    name: service.name,
    port: service.port,
    health: false,
    functional: false,
    responseTime: 0,
    errors: []
  };

  // Test health endpoint
  try {
    const startTime = Date.now();
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: service.port,
      path: service.healthEndpoint,
      method: 'GET'
    });

    results.responseTime = Date.now() - startTime;
    results.health = healthResponse.statusCode === 200;
    
    if (results.health) {
      try {
        results.healthData = JSON.parse(healthResponse.body);
      } catch {
        results.healthData = healthResponse.body;
      }
    }
  } catch (err) {
    results.errors.push(`Health check failed: ${err.message}`);
  }

  // Test functional endpoint
  if (service.testEndpoint) {
    try {
      const funcResponse = await makeRequest({
        hostname: 'localhost',
        port: service.port,
        path: service.testEndpoint,
        method: service.testPayload ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }, service.testPayload);

      results.functional = funcResponse.statusCode < 400;
      results.functionalStatus = funcResponse.statusCode;
      
      try {
        results.functionalData = JSON.parse(funcResponse.body);
      } catch {
        results.functionalData = funcResponse.body;
      }
    } catch (err) {
      results.errors.push(`Functional test failed: ${err.message}`);
    }
  }

  return results;
}

// Check linting setup
function checkLinting() {
  const results = {
    eslint: false,
    prettier: false,
    config: false,
    scripts: []
  };

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check for linting dependencies
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    results.eslint = !!deps.eslint;
    results.prettier = !!deps.prettier;
    
    // Check for config files
    results.config = fs.existsSync('.eslintrc.js') || 
                     fs.existsSync('.eslintrc.json') ||
                     fs.existsSync('.eslintrc.yml');
    
    // Check for lint scripts
    if (packageJson.scripts) {
      results.scripts = Object.entries(packageJson.scripts)
        .filter(([name, cmd]) => cmd.includes('lint') || cmd.includes('eslint'))
        .map(([name, cmd]) => ({ name, command: cmd }));
    }
  } catch (err) {
    error('Failed to check linting setup', err);
  }

  return results;
}

// Check testing setup
function checkTesting() {
  const results = {
    framework: null,
    testFiles: [],
    coverage: false,
    scripts: []
  };

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check for test frameworks
    if (deps.jest) results.framework = 'jest';
    else if (deps.mocha) results.framework = 'mocha';
    else if (deps.vitest) results.framework = 'vitest';
    else if (deps.ava) results.framework = 'ava';
    
    // Check for test files
    const testPatterns = ['**/*.test.js', '**/*.spec.js', '**/test/*.js'];
    // Simplified check - just look for common test directories
    if (fs.existsSync('test')) {
      results.testFiles = fs.readdirSync('test').filter(f => f.endsWith('.js'));
    }
    if (fs.existsSync('tests')) {
      results.testFiles = [...results.testFiles, ...fs.readdirSync('tests').filter(f => f.endsWith('.js'))];
    }
    
    // Check for coverage
    results.coverage = !!deps.nyc || !!deps['c8'] || (deps.jest && fs.existsSync('jest.config.js'));
    
    // Check for test scripts
    if (packageJson.scripts) {
      results.scripts = Object.entries(packageJson.scripts)
        .filter(([name, cmd]) => cmd.includes('test') || cmd.includes('jest') || cmd.includes('mocha'))
        .map(([name, cmd]) => ({ name, command: cmd }));
    }
  } catch (err) {
    error('Failed to check testing setup', err);
  }

  return results;
}

// Check actual database connectivity
async function checkDatabase() {
  const results = {
    postgres: false,
    redis: false,
    sqlite: false,
    errors: []
  };

  // Check PostgreSQL
  try {
    execSync('pg_isready -h localhost -p 5432', { stdio: 'pipe' });
    results.postgres = true;
  } catch {
    results.errors.push('PostgreSQL not responding on port 5432');
  }

  // Check Redis
  try {
    execSync('redis-cli ping', { stdio: 'pipe' });
    results.redis = true;
  } catch {
    results.errors.push('Redis not responding');
  }

  // Check SQLite databases
  try {
    const sqliteFiles = execSync('find . -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" | head -10', { encoding: 'utf8' })
      .split('\n')
      .filter(f => f.trim());
    results.sqlite = sqliteFiles.length > 0;
    results.sqliteFiles = sqliteFiles;
  } catch {
    results.errors.push('No SQLite databases found');
  }

  return results;
}

// Main verification
async function runRealVerification() {
  log('Starting REAL verification...');
  
  const results = {
    timestamp: new Date().toISOString(),
    services: {},
    linting: checkLinting(),
    testing: checkTesting(),
    database: await checkDatabase(),
    actuallyWorking: {
      count: 0,
      total: Object.keys(services).length
    }
  };

  // Test each service
  for (const [serviceId, service] of Object.entries(services)) {
    log(`\nTesting ${service.name}...`);
    
    // First check if already running
    const existingTest = await testService(serviceId);
    
    if (existingTest.health) {
      log(`${service.name} already running!`);
      results.services[serviceId] = {
        ...existingTest,
        status: 'already-running'
      };
      results.actuallyWorking.count++;
    } else {
      // Try to start it
      log(`Starting ${service.name}...`);
      const startResult = await startService(serviceId);
      
      if (startResult.success) {
        // Test it
        const testResult = await testService(serviceId);
        results.services[serviceId] = {
          ...testResult,
          status: 'started',
          pid: startResult.pid
        };
        
        if (testResult.health && testResult.functional) {
          results.actuallyWorking.count++;
        }
        
        // Kill it after testing
        startResult.process.kill();
        log(`Stopped ${service.name} (PID: ${startResult.pid})`);
      } else {
        results.services[serviceId] = {
          name: service.name,
          status: 'failed-to-start',
          errors: [startResult.error],
          startupLogs: startResult.startupLogs,
          errorLogs: startResult.errorLogs
        };
      }
    }
  }

  return results;
}

// Simple HTTP server
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.url === '/api/real-verify') {
    log('Running real verification...');
    try {
      const results = await runRealVerification();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results, null, 2));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message, stack: err.stack }));
    }
    return;
  }

  if (req.url === '/') {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>REAL System Verification</title>
  <style>
    body { font-family: monospace; background: #0a0a0a; color: #00ff41; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { text-align: center; padding: 20px; background: rgba(255, 0, 0, 0.1); border: 2px solid #ff0000; margin-bottom: 20px; }
    h1 { color: #ff0000; }
    .warning { background: #440000; padding: 20px; border: 1px solid #ff0000; margin: 20px 0; }
    .results { background: #111; padding: 20px; border: 1px solid #00ff41; }
    pre { background: #222; padding: 15px; overflow-x: auto; }
    button { background: #ff0000; color: #fff; border: none; padding: 10px 20px; cursor: pointer; font-size: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ REAL SYSTEM VERIFICATION</h1>
      <p>This actually tests if services work, not just if files exist</p>
    </div>
    
    <div class="warning">
      <h3>What This REALLY Does:</h3>
      <ul>
        <li>✓ Actually starts services and tests if they respond</li>
        <li>✓ Makes real API calls to test endpoints</li>
        <li>✓ Checks if linting and testing are configured</li>
        <li>✓ Verifies database connectivity</li>
        <li>✓ Shows real errors and logs</li>
      </ul>
      <p><strong>WARNING:</strong> This will start real processes and make real network calls!</p>
    </div>
    
    <button onclick="runRealTest()">🔍 RUN REAL VERIFICATION</button>
    
    <div id="results" class="results" style="display:none; margin-top: 20px;">
      <h3>Results:</h3>
      <pre id="output">Running verification...</pre>
    </div>
  </div>
  
  <script>
    async function runRealTest() {
      document.getElementById('results').style.display = 'block';
      document.getElementById('output').textContent = 'Running real verification...\\n\\nThis may take 30-60 seconds...';
      
      try {
        const response = await fetch('/api/real-verify');
        const data = await response.json();
        document.getElementById('output').textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        document.getElementById('output').textContent = 'Error: ' + err.message;
      }
    }
  </script>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// Start server
const PORT = 6001;
server.listen(PORT, () => {
  log(`REAL Verification Server started on http://localhost:${PORT}`);
  log('This server actually tests if services work!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});