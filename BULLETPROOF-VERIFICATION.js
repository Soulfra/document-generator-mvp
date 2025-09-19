#!/usr/bin/env node

/**
 * BULLETPROOF SYSTEM VERIFICATION
 * Ultra-lightweight, no dependencies, comprehensive debug logging
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 6000;
const DEBUG = true;

// Debug logger
function debug(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] DEBUG: ${message}`);
  if (data) {
    console.log(`[${timestamp}] DATA:`, JSON.stringify(data, null, 2));
  }
}

// Error logger
function error(message, err = null) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`);
  if (err) {
    console.error(`[${timestamp}] STACK:`, err.stack || err.message || err);
  }
}

// Success logger
function success(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ✅ SUCCESS: ${message}`);
  if (data) {
    console.log(`[${timestamp}] RESULT:`, JSON.stringify(data, null, 2));
  }
}

debug('Starting BULLETPROOF VERIFICATION system...');

// System resource check
function getSystemResources() {
  try {
    debug('Checking system resources...');
    
    // Get memory usage
    const memInfo = execSync('ps -o pid,ppid,pcpu,pmem,command -A | head -20').toString();
    
    // Get disk usage
    const diskInfo = execSync('df -h .').toString();
    
    // Get process count
    const processCount = execSync('ps aux | wc -l').toString().trim();
    
    // Get our Node processes
    const nodeProcesses = execSync('ps aux | grep -v grep | grep "node.*\\.js" || echo "No Node processes"').toString();
    
    success('System resources checked', {
      processCount: parseInt(processCount),
      hasNodeProcesses: nodeProcesses !== 'No Node processes\n'
    });
    
    return {
      memory: memInfo.split('\n').slice(0, 10),
      disk: diskInfo,
      processCount: parseInt(processCount),
      nodeProcesses: nodeProcesses.split('\n').filter(line => line.trim())
    };
  } catch (err) {
    error('Failed to get system resources', err);
    return { error: err.message };
  }
}

// Service file verification
function verifyServiceFiles() {
  debug('Verifying service files...');
  
  const services = {
    'document-generator': {
      name: 'Document Generator',
      file: './document-generator-app.js',
      port: 4000,
      revenue: '$1/document'
    },
    'ai-api': {
      name: 'AI API Service',
      file: './services/real-ai-api.js', 
      port: 3001,
      revenue: '$0.10/call'
    },
    'template-processor': {
      name: 'Template Processor',
      file: './services/real-template-processor.js',
      port: 3000,
      revenue: '$5/MVP'
    }
  };
  
  const results = {};
  
  for (const [serviceId, service] of Object.entries(services)) {
    debug(`Checking service: ${service.name}`);
    
    const result = {
      name: service.name,
      file: service.file,
      port: service.port,
      revenue: service.revenue,
      exists: false,
      size: 0,
      modified: null,
      readable: false,
      status: 'unknown'
    };
    
    try {
      // Check if file exists
      result.exists = fs.existsSync(service.file);
      debug(`File ${service.file} exists: ${result.exists}`);
      
      if (result.exists) {
        // Get file stats
        const stats = fs.statSync(service.file);
        result.size = Math.round(stats.size / 1024);
        result.modified = stats.mtime.toISOString().split('T')[0];
        
        // Check if readable
        try {
          fs.accessSync(service.file, fs.constants.R_OK);
          result.readable = true;
          result.status = 'file-ready';
          success(`Service file verified: ${service.name}`, {
            size: `${result.size}KB`,
            modified: result.modified
          });
        } catch {
          result.readable = false;
          result.status = 'file-unreadable';
          error(`Service file unreadable: ${service.name}`);
        }
      } else {
        result.status = 'file-missing';
        error(`Service file missing: ${service.name} at ${service.file}`);
      }
    } catch (err) {
      result.status = 'file-error';
      error(`Service file check failed: ${service.name}`, err);
    }
    
    results[serviceId] = result;
  }
  
  success('Service file verification complete', {
    totalServices: Object.keys(services).length,
    readyServices: Object.values(results).filter(r => r.status === 'file-ready').length
  });
  
  return results;
}

// Check deployment readiness
function checkDeploymentFiles() {
  debug('Checking deployment files...');
  
  const deploymentFiles = {
    'package.json': { required: true, description: 'Node.js dependencies' },
    'docker-compose.yml': { required: true, description: 'Container orchestration' },
    '.env.example': { required: false, description: 'Environment template' },
    'database-schema.sql': { required: false, description: 'Database schema' },
    'README.md': { required: false, description: 'Documentation' },
    'CLAUDE.md': { required: false, description: 'AI instructions' }
  };
  
  const results = {};
  let requiredCount = 0;
  let requiredExists = 0;
  let totalExists = 0;
  
  for (const [filename, info] of Object.entries(deploymentFiles)) {
    debug(`Checking deployment file: ${filename}`);
    
    const exists = fs.existsSync(`./${filename}`);
    let size = 0;
    let modified = null;
    
    if (exists) {
      try {
        const stats = fs.statSync(`./${filename}`);
        size = Math.round(stats.size / 1024);
        modified = stats.mtime.toISOString().split('T')[0];
        totalExists++;
        if (info.required) requiredExists++;
      } catch (err) {
        error(`Failed to stat file: ${filename}`, err);
      }
    }
    
    if (info.required) requiredCount++;
    
    results[filename] = {
      exists,
      required: info.required,
      description: info.description,
      size,
      modified
    };
    
    debug(`File ${filename}: exists=${exists}, required=${info.required}, size=${size}KB`);
  }
  
  const percentage = Math.round((totalExists / Object.keys(deploymentFiles).length) * 100);
  const requiredReady = requiredExists === requiredCount;
  
  success('Deployment files checked', {
    percentage,
    requiredReady,
    totalFiles: Object.keys(deploymentFiles).length,
    existingFiles: totalExists
  });
  
  return {
    files: results,
    percentage,
    requiredReady,
    totalFiles: Object.keys(deploymentFiles).length,
    existingFiles: totalExists
  };
}

// Calculate revenue projections
function calculateRevenue() {
  debug('Calculating revenue projections...');
  
  // Conservative estimates
  const estimates = {
    documentsPerDay: 5,
    apiCallsPerDay: 25,
    mvpsPerWeek: 2
  };
  
  const revenue = {
    daily: (estimates.documentsPerDay * 1) + (estimates.apiCallsPerDay * 0.10),
    weekly: 0,
    monthly: 0,
    yearly: 0
  };
  
  revenue.weekly = (revenue.daily * 7) + (estimates.mvpsPerWeek * 5);
  revenue.monthly = revenue.weekly * 4.33;
  revenue.yearly = revenue.monthly * 12;
  
  // Round to 2 decimal places
  Object.keys(revenue).forEach(key => {
    revenue[key] = Math.round(revenue[key] * 100) / 100;
  });
  
  const subscriptionTiers = {
    'Basic': { price: 29, features: '50 documents/month', users: 50 },
    'Pro': { price: 99, features: '500 documents + API access', users: 20 },
    'Enterprise': { price: 299, features: 'Unlimited + custom templates', users: 5 }
  };
  
  success('Revenue projections calculated', revenue);
  
  return {
    payPerUse: revenue,
    subscriptionTiers,
    projectedUsers: 75,
    subscriptionRevenue: (50 * 29) + (20 * 99) + (5 * 299)
  };
}

// Port availability check
function checkPorts() {
  debug('Checking port availability...');
  
  const ports = [3000, 3001, 4000, 6000];
  const results = {};
  
  ports.forEach(port => {
    try {
      const result = execSync(`lsof -i :${port} || echo "PORT_FREE"`).toString().trim();
      const inUse = result !== 'PORT_FREE';
      
      results[port] = {
        inUse,
        process: inUse ? result.split('\n')[1] : null
      };
      
      debug(`Port ${port}: ${inUse ? 'IN USE' : 'FREE'}`);
    } catch (err) {
      results[port] = { inUse: false, process: null, error: err.message };
      debug(`Port ${port}: CHECK FAILED - ${err.message}`);
    }
  });
  
  return results;
}

// Main verification function
function runFullVerification() {
  debug('Starting full system verification...');
  
  const startTime = Date.now();
  
  const results = {
    timestamp: new Date().toISOString(),
    system: getSystemResources(),
    services: verifyServiceFiles(),
    deployment: checkDeploymentFiles(),
    revenue: calculateRevenue(),
    ports: checkPorts(),
    verificationTime: 0
  };
  
  results.verificationTime = Date.now() - startTime;
  
  success('Full verification complete', {
    verificationTime: `${results.verificationTime}ms`,
    servicesReady: Object.values(results.services).filter(s => s.status === 'file-ready').length,
    deploymentReady: results.deployment.requiredReady
  });
  
  return results;
}

// Simple HTTP server (no Express dependencies)
const server = http.createServer((req, res) => {
  debug(`Request: ${req.method} ${req.url}`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/api/verify') {
    debug('API verification request received');
    try {
      const verification = runFullVerification();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        method: 'bulletproof-verification',
        data: verification
      }, null, 2));
      success('API verification response sent');
    } catch (err) {
      error('API verification failed', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: err.message,
        stack: err.stack
      }));
    }
    return;
  }
  
  if (req.url === '/' || req.url === '/index.html') {
    debug('Dashboard request received');
    try {
      const verification = runFullVerification();
      
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>BULLETPROOF System Verification</title>
  <style>
    body { 
      font-family: monospace; 
      background: #0a0a0a; 
      color: #00ff41; 
      padding: 20px; 
      margin: 0; 
      line-height: 1.4;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header {
      text-align: center;
      padding: 20px;
      background: rgba(0, 255, 65, 0.1);
      border: 2px solid #00ff41;
      margin-bottom: 20px;
      border-radius: 10px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }
    .card {
      background: #111;
      border: 1px solid #00ff41;
      padding: 20px;
      border-radius: 10px;
    }
    .card h3 {
      color: #00ff41;
      margin-top: 0;
      border-bottom: 1px solid #00ff41;
      padding-bottom: 10px;
    }
    .status-ready { color: #00ff41; font-weight: bold; }
    .status-missing { color: #ff4444; font-weight: bold; }
    .status-error { color: #ffaa00; font-weight: bold; }
    .metric {
      font-size: 28px;
      font-weight: bold;
      color: #00ff41;
    }
    .debug-info {
      background: #222;
      padding: 15px;
      border-radius: 5px;
      margin: 10px 0;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
    }
    pre { 
      background: #333; 
      padding: 10px; 
      border-radius: 5px; 
      overflow-x: auto; 
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔧 BULLETPROOF SYSTEM VERIFICATION</h1>
      <p>Ultra-lightweight • No dependencies • Comprehensive debug logging</p>
      <div class="metric">Verification Time: ${verification.verificationTime}ms</div>
    </div>
    
    <div class="grid">
      <div class="card">
        <h3>🔍 Service Files</h3>
        ${Object.entries(verification.services).map(([id, service]) => `
          <div class="debug-info">
            <strong>${service.name}</strong><br>
            File: ${service.file}<br>
            Status: <span class="status-${service.status.includes('ready') ? 'ready' : service.status.includes('missing') ? 'missing' : 'error'}">${service.status.toUpperCase()}</span><br>
            ${service.exists ? `Size: ${service.size}KB • Modified: ${service.modified}` : 'File not found'}<br>
            Revenue Model: ${service.revenue}
          </div>
        `).join('')}
      </div>
      
      <div class="card">
        <h3>🚀 Deployment Readiness</h3>
        <div class="metric">${verification.deployment.percentage}%</div>
        <p>Files Ready (${verification.deployment.existingFiles}/${verification.deployment.totalFiles})</p>
        <div class="debug-info">
          ${Object.entries(verification.deployment.files).map(([file, info]) => `
            <div>${info.exists ? '✅' : '❌'} ${file} ${info.required ? '(Required)' : '(Optional)'}<br>
            &nbsp;&nbsp;${info.description}${info.exists ? ` • ${info.size}KB` : ''}</div>
          `).join('')}
        </div>
      </div>
      
      <div class="card">
        <h3>💰 Revenue Projections</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
          <div>
            <div class="metric">$${verification.revenue.payPerUse.daily}</div>
            <div>Daily Revenue</div>
          </div>
          <div>
            <div class="metric">$${verification.revenue.payPerUse.monthly}</div>
            <div>Monthly Revenue</div>
          </div>
          <div>
            <div class="metric">$${verification.revenue.payPerUse.yearly}</div>
            <div>Yearly Revenue</div>
          </div>
          <div>
            <div class="metric">$${verification.revenue.subscriptionRevenue}</div>
            <div>Subscription Revenue</div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3>🔌 System Resources</h3>
        <div class="debug-info">
          <strong>Process Count:</strong> ${verification.system.processCount}<br>
          <strong>Node Processes:</strong> ${verification.system.nodeProcesses.length}<br>
          <strong>Port Status:</strong><br>
          ${Object.entries(verification.ports).map(([port, info]) => 
            `&nbsp;&nbsp;Port ${port}: ${info.inUse ? '🔴 IN USE' : '✅ FREE'}`
          ).join('<br>')}
        </div>
        <pre>${verification.system.disk}</pre>
      </div>
    </div>
    
    <div class="card" style="margin-top: 20px;">
      <h3>🐛 Debug Log</h3>
      <div class="debug-info">
        <strong>Verification completed successfully!</strong><br>
        • No Express.js dependencies<br>  
        • No network calls to hang<br>
        • Pure file system verification<br>
        • Resource monitoring included<br>
        • ${verification.verificationTime}ms execution time<br>
        <br>
        <button onclick="location.reload()">🔄 Refresh Verification</button>
        <button onclick="fetch('/api/verify').then(r=>r.json()).then(console.log)">🧪 Test API</button>
      </div>
    </div>
  </div>
</body>
</html>`;
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      success('Dashboard response sent');
    } catch (err) {
      error('Dashboard generation failed', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error: ${err.message}\n\nStack:\n${err.stack}`);
    }
    return;
  }
  
  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Start server with error handling
server.on('error', (err) => {
  error('Server error', err);
  process.exit(1);
});

server.listen(PORT, () => {
  success('BULLETPROOF VERIFICATION SERVER STARTED', {
    port: PORT,
    url: `http://localhost:${PORT}`,
    api: `http://localhost:${PORT}/api/verify`,
    pid: process.pid
  });
  
  // Run initial verification
  debug('Running initial verification...');
  const initialResults = runFullVerification();
  success('Initial verification complete', {
    servicesReady: Object.values(initialResults.services).filter(s => s.status === 'file-ready').length,
    deploymentReady: initialResults.deployment.requiredReady,
    verificationTime: `${initialResults.verificationTime}ms`
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  debug('Received SIGINT, shutting down gracefully...');
  server.close(() => {
    success('Server closed successfully');
    process.exit(0);
  });
});

module.exports = server;