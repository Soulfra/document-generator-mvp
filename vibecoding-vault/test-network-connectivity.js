/**
 * Network Connectivity Test Script
 * Tests various network configurations to diagnose connectivity issues
 */

const https = require('https');
const http = require('http');
const dns = require('dns');
const { promisify } = require('util');
const net = require('net');

const dnsLookup = promisify(dns.lookup);
const dnsResolve4 = promisify(dns.resolve4);

console.log('🔍 Starting Network Connectivity Tests...\n');

// Test DNS resolution
async function testDNS() {
  console.log('📡 Testing DNS Resolution...');
  const domains = ['google.com', 'cloudflare.com', 'github.com'];
  
  for (const domain of domains) {
    try {
      const addresses = await dnsResolve4(domain);
      console.log(`✅ DNS resolution for ${domain}: ${addresses.join(', ')}`);
    } catch (error) {
      console.error(`❌ DNS resolution failed for ${domain}:`, error.message);
    }
  }
  console.log();
}

// Test HTTP/HTTPS connectivity
async function testHTTP() {
  console.log('🌐 Testing HTTP/HTTPS Connectivity...');
  
  const urls = [
    { url: 'https://www.google.com', name: 'Google HTTPS' },
    { url: 'http://www.google.com', name: 'Google HTTP' },
    { url: 'https://1.1.1.1', name: 'Cloudflare DNS' },
    { url: 'https://api.github.com', name: 'GitHub API' }
  ];
  
  for (const { url, name } of urls) {
    await testURL(url, name);
  }
  console.log();
}

function testURL(url, name) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const options = {
      timeout: 5000,
      // Ignore certificate errors for testing
      rejectUnauthorized: false
    };
    
    const startTime = Date.now();
    
    protocol.get(url, options, (res) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (res.statusCode >= 200 && res.statusCode < 400) {
        console.log(`✅ ${name}: Connected successfully (${res.statusCode}) in ${duration}ms`);
      } else {
        console.log(`⚠️  ${name}: Connected but got status ${res.statusCode} in ${duration}ms`);
      }
      
      res.destroy();
      resolve();
    }).on('error', (err) => {
      console.error(`❌ ${name}: Connection failed - ${err.message}`);
      resolve();
    }).on('timeout', () => {
      console.error(`❌ ${name}: Connection timeout after 5 seconds`);
      resolve();
    });
  });
}

// Test direct socket connections
async function testSockets() {
  console.log('🔌 Testing Direct Socket Connections...');
  
  const targets = [
    { host: '8.8.8.8', port: 53, name: 'Google DNS' },
    { host: '1.1.1.1', port: 53, name: 'Cloudflare DNS' },
    { host: 'google.com', port: 80, name: 'Google HTTP' },
    { host: 'google.com', port: 443, name: 'Google HTTPS' }
  ];
  
  for (const target of targets) {
    await testSocket(target);
  }
  console.log();
}

function testSocket({ host, port, name }) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const startTime = Date.now();
    
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`✅ ${name} (${host}:${port}): Connected in ${duration}ms`);
      socket.destroy();
      resolve();
    });
    
    socket.on('timeout', () => {
      console.error(`❌ ${name} (${host}:${port}): Connection timeout`);
      socket.destroy();
      resolve();
    });
    
    socket.on('error', (err) => {
      console.error(`❌ ${name} (${host}:${port}): ${err.message}`);
      resolve();
    });
    
    socket.connect(port, host);
  });
}

// Check system proxy settings
function checkProxySettings() {
  console.log('🔧 System Proxy Settings:');
  
  const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy', 'no_proxy'];
  let hasProxy = false;
  
  for (const varName of proxyVars) {
    if (process.env[varName]) {
      console.log(`  ${varName}: ${process.env[varName]}`);
      hasProxy = true;
    }
  }
  
  if (!hasProxy) {
    console.log('  No proxy settings detected');
  }
  console.log();
}

// Check network interfaces
function checkNetworkInterfaces() {
  console.log('🖥️  Network Interfaces:');
  
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const [name, addresses] of Object.entries(interfaces)) {
    console.log(`  ${name}:`);
    for (const addr of addresses) {
      if (addr.family === 'IPv4') {
        console.log(`    IPv4: ${addr.address} (${addr.internal ? 'internal' : 'external'})`);
      }
    }
  }
  console.log();
}

// Main test runner
async function runTests() {
  try {
    checkNetworkInterfaces();
    checkProxySettings();
    await testDNS();
    await testHTTP();
    await testSockets();
    
    console.log('✨ Network connectivity tests completed!\n');
    
    // Provide recommendations
    console.log('💡 Recommendations:');
    console.log('1. If DNS tests fail, try changing DNS servers to 8.8.8.8 or 1.1.1.1');
    console.log('2. If HTTPS fails but HTTP works, check certificate/TLS settings');
    console.log('3. If all tests fail, check firewall and antivirus settings');
    console.log('4. If behind a proxy, ensure proxy settings are correctly configured');
    console.log('5. Try disabling IPv6 if having connectivity issues');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run the tests
runTests();