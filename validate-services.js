#!/usr/bin/env node

/**
 * SERVICE VALIDATOR
 * Actually tests if services work, not just if files exist
 */

const http = require('http');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

// Colors
const RED = '\033[0;31m';
const GREEN = '\033[0;32m';
const YELLOW = '\033[1;33m';
const BLUE = '\033[0;34m';
const NC = '\033[0m';

// Service definitions
const SERVICES = {
  'document-generator': {
    name: 'Document Generator',
    file: './document-generator-app.js',
    port: 4000,
    healthEndpoint: '/health',
    testEndpoints: [
      { path: '/api/process', method: 'POST', body: { document: 'test', type: 'test' } },
      { path: '/api/status', method: 'GET' }
    ]
  },
  'ai-api': {
    name: 'AI API Service',
    file: './services/real-ai-api.js',
    port: 3001,
    healthEndpoint: '/health',
    testEndpoints: [
      { path: '/api/analyze', method: 'POST', body: { text: 'test content' } },
      { path: '/api/models', method: 'GET' }
    ]
  },
  'template-processor': {
    name: 'Template Processor',
    file: './services/real-template-processor.js',
    port: 3000,
    healthEndpoint: '/health',
    testEndpoints: [
      { path: '/api/templates', method: 'GET' },
      { path: '/api/generate', method: 'POST', body: { template: 'test' } }
    ]
  }
};

// Test results
const results = {
  services: {},
  summary: {
    total: 0,
    healthy: 0,
    functional: 0,
    failed: 0
  }
};

// Kill process on port
async function killPort(port) {
  try {
    const pids = execSync(`lsof -ti :${port} 2>/dev/null || echo ""`, { encoding: 'utf8' }).trim();
    if (pids) {
      pids.split('\n').forEach(pid => {
        if (pid) {
          try {
            process.kill(parseInt(pid), 'SIGKILL');
            console.log(`${YELLOW}Killed process ${pid} on port ${port}${NC}`);
          } catch (e) {
            // Process might already be dead
          }
        }
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (e) {
    // Port already free
  }
}

// Make HTTP request
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout (5s)'));
    }, 5000);

    const req = http.request(options, (res) => {
      clearTimeout(timeout);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json: JSON.parse(data)
          });
        } catch {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json: null
          });
        }
      });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    if (postData) {
      req.setHeader('Content-Type', 'application/json');
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

// Test if service is already running
async function testRunningService(serviceId) {
  const service = SERVICES[serviceId];
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: service.port,
      path: service.healthEndpoint,
      method: 'GET'
    });
    
    return {
      running: response.statusCode < 500,
      healthy: response.statusCode === 200,
      response
    };
  } catch (err) {
    return {
      running: false,
      healthy: false,
      error: err.message
    };
  }
}

// Start a service
async function startService(serviceId) {
  const service = SERVICES[serviceId];
  
  console.log(`\n${BLUE}Starting ${service.name}...${NC}`);
  
  // Check if file exists
  if (!fs.existsSync(service.file)) {
    throw new Error(`Service file not found: ${service.file}`);
  }
  
  // Kill anything on the port
  await killPort(service.port);
  
  // Start the service
  const proc = spawn('node', [service.file], {
    cwd: process.cwd(),
    stdio: 'pipe',
    detached: false
  });
  
  let startupLogs = '';
  let errorLogs = '';
  let started = false;
  
  proc.stdout.on('data', (data) => {
    startupLogs += data.toString();
    if (!started) console.log(`  ${data.toString().trim()}`);
  });
  
  proc.stderr.on('data', (data) => {
    errorLogs += data.toString();
    if (!started) console.error(`  ${RED}${data.toString().trim()}${NC}`);
  });
  
  proc.on('error', (err) => {
    console.error(`${RED}Failed to start: ${err.message}${NC}`);
  });
  
  // Wait for service to be ready
  const maxRetries = 30;
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const test = await testRunningService(serviceId);
    if (test.healthy) {
      started = true;
      console.log(`${GREEN}✓ ${service.name} started successfully${NC}`);
      return {
        success: true,
        process: proc,
        pid: proc.pid
      };
    }
  }
  
  // Failed to start
  proc.kill();
  throw new Error(`Service failed to start within 30 seconds`);
}

// Test service endpoints
async function testServiceEndpoints(serviceId) {
  const service = SERVICES[serviceId];
  const endpointResults = [];
  
  console.log(`  Testing endpoints...`);
  
  for (const endpoint of service.testEndpoints) {
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: service.port,
        path: endpoint.path,
        method: endpoint.method
      }, endpoint.body);
      
      const success = response.statusCode < 400;
      console.log(`    ${endpoint.method} ${endpoint.path}: ${
        success ? `${GREEN}✓${NC}` : `${RED}✗${NC}`
      } (${response.statusCode})`);
      
      endpointResults.push({
        endpoint: `${endpoint.method} ${endpoint.path}`,
        success,
        statusCode: response.statusCode,
        hasData: !!response.json
      });
    } catch (err) {
      console.log(`    ${endpoint.method} ${endpoint.path}: ${RED}✗${NC} (${err.message})`);
      endpointResults.push({
        endpoint: `${endpoint.method} ${endpoint.path}`,
        success: false,
        error: err.message
      });
    }
  }
  
  return endpointResults;
}

// Validate a service
async function validateService(serviceId) {
  const service = SERVICES[serviceId];
  
  console.log(`\n${BLUE}═══ Validating ${service.name} ═══${NC}`);
  
  results.summary.total++;
  const result = {
    name: service.name,
    port: service.port,
    file: service.file,
    fileExists: fs.existsSync(service.file),
    wasRunning: false,
    isHealthy: false,
    endpoints: [],
    errors: []
  };
  
  try {
    // Check if already running
    const runningTest = await testRunningService(serviceId);
    
    if (runningTest.running) {
      console.log(`${YELLOW}Service already running on port ${service.port}${NC}`);
      result.wasRunning = true;
      result.isHealthy = runningTest.healthy;
      
      if (runningTest.healthy) {
        results.summary.healthy++;
        // Test endpoints
        result.endpoints = await testServiceEndpoints(serviceId);
        const functionalEndpoints = result.endpoints.filter(e => e.success).length;
        if (functionalEndpoints > 0) {
          results.summary.functional++;
        }
      }
    } else {
      // Try to start it
      const startResult = await startService(serviceId);
      
      // Test health
      const healthTest = await testRunningService(serviceId);
      result.isHealthy = healthTest.healthy;
      
      if (healthTest.healthy) {
        results.summary.healthy++;
        // Test endpoints
        result.endpoints = await testServiceEndpoints(serviceId);
        const functionalEndpoints = result.endpoints.filter(e => e.success).length;
        if (functionalEndpoints > 0) {
          results.summary.functional++;
        }
      }
      
      // Stop the service we started
      console.log(`  Stopping service (PID: ${startResult.pid})...`);
      startResult.process.kill();
    }
  } catch (err) {
    console.error(`${RED}Validation failed: ${err.message}${NC}`);
    result.errors.push(err.message);
    results.summary.failed++;
  }
  
  results.services[serviceId] = result;
}

// Main validation
async function runValidation() {
  console.log(`${BLUE}╔════════════════════════════════════════╗${NC}`);
  console.log(`${BLUE}║    SERVICE VALIDATION (REAL TESTS)     ║${NC}`);
  console.log(`${BLUE}╚════════════════════════════════════════╝${NC}`);
  
  // Validate each service
  for (const serviceId of Object.keys(SERVICES)) {
    await validateService(serviceId);
  }
  
  // Print summary
  console.log(`\n${BLUE}═══ VALIDATION SUMMARY ═══${NC}`);
  console.log(`Total Services: ${results.summary.total}`);
  console.log(`Healthy Services: ${
    results.summary.healthy > 0 ? GREEN : RED
  }${results.summary.healthy}${NC}`);
  console.log(`Functional Services: ${
    results.summary.functional > 0 ? GREEN : RED
  }${results.summary.functional}${NC}`);
  console.log(`Failed Services: ${
    results.summary.failed > 0 ? RED : GREEN
  }${results.summary.failed}${NC}`);
  
  // Detailed results
  console.log(`\n${BLUE}═══ DETAILED RESULTS ═══${NC}`);
  for (const [serviceId, result] of Object.entries(results.services)) {
    console.log(`\n${result.name}:`);
    console.log(`  File Exists: ${result.fileExists ? `${GREEN}Yes${NC}` : `${RED}No${NC}`}`);
    console.log(`  Was Running: ${result.wasRunning ? `${YELLOW}Yes${NC}` : 'No'}`);
    console.log(`  Health Check: ${result.isHealthy ? `${GREEN}Passed${NC}` : `${RED}Failed${NC}`}`);
    
    if (result.endpoints.length > 0) {
      console.log(`  Endpoint Tests:`);
      result.endpoints.forEach(ep => {
        console.log(`    ${ep.endpoint}: ${
          ep.success ? `${GREEN}✓${NC}` : `${RED}✗${NC}`
        }`);
      });
    }
    
    if (result.errors.length > 0) {
      console.log(`  ${RED}Errors:${NC}`);
      result.errors.forEach(err => {
        console.log(`    - ${err}`);
      });
    }
  }
  
  // Save results
  fs.writeFileSync(
    'validation-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log(`\n${GREEN}Results saved to validation-results.json${NC}`);
  
  // Exit code based on results
  const allHealthy = results.summary.healthy === results.summary.total;
  const someFunctional = results.summary.functional > 0;
  
  if (allHealthy && someFunctional) {
    console.log(`\n${GREEN}✅ ALL SERVICES VALIDATED SUCCESSFULLY!${NC}`);
    process.exit(0);
  } else if (someFunctional) {
    console.log(`\n${YELLOW}⚠️  SOME SERVICES WORKING${NC}`);
    process.exit(1);
  } else {
    console.log(`\n${RED}❌ NO SERVICES WORKING PROPERLY${NC}`);
    process.exit(2);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log(`\n${YELLOW}Validation interrupted${NC}`);
  process.exit(130);
});

// Run validation
runValidation().catch(err => {
  console.error(`${RED}Fatal error: ${err.message}${NC}`);
  process.exit(1);
});