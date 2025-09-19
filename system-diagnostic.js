#!/usr/bin/env node

/**
 * 🔍 SYSTEM DIAGNOSTIC TOOL
 * 
 * Quickly identifies what's working and what's broken
 * Provides clear steps to fix issues
 */

const colors = require('colors');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

console.log('🔍 SYSTEM DIAGNOSTIC TOOL'.cyan.bold);
console.log('========================\n'.cyan);

const issues = [];
const working = [];
const recommendations = [];

// Check if a command exists
async function commandExists(command) {
  try {
    await execPromise(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

// Check if port is in use
async function checkPort(port, serviceName) {
  try {
    const { stdout } = await execPromise(`lsof -i :${port} | grep LISTEN`);
    if (stdout) {
      working.push(`${serviceName} (port ${port})`);
      return true;
    }
  } catch {
    issues.push(`${serviceName} not running on port ${port}`);
    return false;
  }
}

// Check API endpoint
async function checkAPI(url, name) {
  try {
    const axios = require('axios');
    const response = await axios.get(url, { timeout: 3000 });
    working.push(`${name}: ${url}`);
    return true;
  } catch (error) {
    issues.push(`${name} not accessible at ${url}`);
    return false;
  }
}

// Check environment variables
function checkEnvVar(varName, description) {
  const value = process.env[varName];
  if (value && value.length > 0) {
    working.push(`${description} configured`);
    return true;
  } else {
    issues.push(`${description} not configured (${varName})`);
    return false;
  }
}

async function runDiagnostics() {
  console.log('🔧 Checking prerequisites...'.yellow);
  
  // 1. Check Node.js
  try {
    const { stdout } = await execPromise('node --version');
    console.log(`  ✅ Node.js: ${stdout.trim()}`.green);
  } catch {
    console.log('  ❌ Node.js not found'.red);
    return;
  }
  
  // 2. Check npm
  if (await commandExists('npm')) {
    console.log('  ✅ npm installed'.green);
  } else {
    console.log('  ❌ npm not found'.red);
    return;
  }
  
  // 3. Check Docker
  if (await commandExists('docker')) {
    console.log('  ✅ Docker installed'.green);
    
    // Check if Docker is running
    try {
      await execPromise('docker info');
      console.log('  ✅ Docker is running'.green);
    } catch {
      console.log('  ❌ Docker is not running'.red);
      issues.push('Docker daemon not running');
      recommendations.push('Start Docker Desktop or run: sudo systemctl start docker');
    }
  } else {
    console.log('  ⚠️ Docker not installed'.yellow);
    recommendations.push('Install Docker for database services');
  }
  
  // 4. Check Ollama
  if (await commandExists('ollama')) {
    console.log('  ✅ Ollama installed'.green);
    
    // Check if Ollama is running
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:11434/api/tags', { timeout: 2000 });
      const models = response.data.models || [];
      console.log(`  ✅ Ollama running with ${models.length} models`.green);
      
      if (models.length === 0) {
        issues.push('No Ollama models installed');
        recommendations.push('Run: ollama pull llama2 && ollama pull codellama');
      }
    } catch {
      issues.push('Ollama not running');
      recommendations.push('Run: ollama serve');
    }
  } else {
    console.log('  ⚠️ Ollama not installed'.yellow);
    recommendations.push('Install Ollama for local AI: https://ollama.ai');
  }
  
  console.log('\n🌐 Checking services...'.yellow);
  
  // Check all services
  await checkPort(3000, 'Template Processor');
  await checkPort(3001, 'AI API Service');
  await checkPort(8080, 'Marketplace Platform');
  await checkPort(8081, 'Notification Service');
  await checkPort(8888, 'Auth Service');
  await checkPort(8899, 'System Bus');
  await checkPort(5432, 'PostgreSQL');
  await checkPort(6379, 'Redis');
  await checkPort(9000, 'MinIO');
  await checkPort(11434, 'Ollama');
  
  console.log('\n🔑 Checking API keys...'.yellow);
  
  // Load .env file
  try {
    require('dotenv').config();
    console.log('  ✅ .env file loaded'.green);
  } catch {
    console.log('  ⚠️ No .env file found'.yellow);
  }
  
  checkEnvVar('ANTHROPIC_API_KEY', 'Anthropic API key');
  checkEnvVar('OPENAI_API_KEY', 'OpenAI API key');
  checkEnvVar('DATABASE_URL', 'PostgreSQL connection');
  checkEnvVar('REDIS_URL', 'Redis connection');
  checkEnvVar('STRIPE_SECRET_KEY', 'Stripe payment');
  
  console.log('\n🧪 Testing service endpoints...'.yellow);
  
  await checkAPI('http://localhost:3001/health', 'AI API Health');
  await checkAPI('http://localhost:3000/', 'Template Processor');
  await checkAPI('http://localhost:8080/health', 'Marketplace');
  await checkAPI('http://localhost:11434/api/tags', 'Ollama API');
  
  // Generate report
  console.log('\n📊 DIAGNOSTIC REPORT'.cyan.bold);
  console.log('==================='.cyan);
  
  if (working.length > 0) {
    console.log('\n✅ Working Components:'.green.bold);
    working.forEach(item => console.log(`  • ${item}`.green));
  }
  
  if (issues.length > 0) {
    console.log('\n❌ Issues Found:'.red.bold);
    issues.forEach(issue => console.log(`  • ${issue}`.red));
  }
  
  if (recommendations.length > 0) {
    console.log('\n💡 Recommendations:'.yellow.bold);
    recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`.yellow));
  }
  
  // Quick fix commands
  console.log('\n🔧 QUICK FIX COMMANDS:'.cyan.bold);
  console.log('===================='.cyan);
  
  console.log('\n1. Start basic databases:'.yellow);
  console.log('   docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres'.gray);
  console.log('   docker run -d --name redis -p 6379:6379 redis'.gray);
  
  console.log('\n2. Install Ollama models:'.yellow);
  console.log('   ollama pull llama2'.gray);
  console.log('   ollama pull codellama'.gray);
  
  console.log('\n3. Add API keys to .env:'.yellow);
  console.log('   echo "OPENAI_API_KEY=sk-your-key-here" >> .env'.gray);
  console.log('   echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" >> .env'.gray);
  
  console.log('\n4. Install dependencies:'.yellow);
  console.log('   npm install axios colors ws socket.io dotenv'.gray);
  
  console.log('\n5. Start all services:'.yellow);
  console.log('   ./launch-marketplace.sh'.gray);
  
  // Readiness score
  const totalChecks = working.length + issues.length;
  const score = totalChecks > 0 ? Math.round((working.length / totalChecks) * 100) : 0;
  
  console.log('\n🎯 SYSTEM READINESS:'.cyan.bold);
  console.log('==================='.cyan);
  
  if (score >= 80) {
    console.log(`${score}% - Ready for testing! 🟢`.green.bold);
  } else if (score >= 50) {
    console.log(`${score}% - Partially ready, fix critical issues 🟡`.yellow.bold);
  } else {
    console.log(`${score}% - Not ready, multiple issues to fix 🔴`.red.bold);
  }
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    score,
    working,
    issues,
    recommendations
  };
  
  require('fs').writeFileSync(
    'DIAGNOSTIC-REPORT.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Full report saved to: DIAGNOSTIC-REPORT.json'.gray);
}

// Check if axios is installed
try {
  require('axios');
  runDiagnostics().catch(console.error);
} catch {
  console.log('📦 Installing required diagnostic dependencies...'.yellow);
  console.log('   Run: npm install axios colors dotenv'.gray);
  console.log('   Then: node system-diagnostic.js'.gray);
}