#!/usr/bin/env node

/**
 * Test Sovereign System - Complete end-to-end system test
 */

const { spawn } = require('child_process');

console.log('🎭 TESTING SOVEREIGN AGENTS SYSTEM');
console.log('==================================');

async function executeSequence() {
  const commands = [
    {
      name: 'Environment Bypass',
      script: 'run-bypass-now.js',
      description: 'Create valid environment configuration'
    },
    {
      name: 'Feature Disable',
      script: 'execute-disable-features.js', 
      description: 'Disable blocking feature flags'
    },
    {
      name: 'Docker Services',
      script: 'start-docker-services.js',
      description: 'Start all Docker services'
    },
    {
      name: 'System Diagnostics',
      script: 'run-full-diagnostics.js',
      description: 'Run comprehensive system diagnostics'
    }
  ];

  console.log('🎯 EXECUTING FULL SYSTEM SEQUENCE');
  console.log('=================================');
  
  for (const [index, command] of commands.entries()) {
    console.log(`\n📋 STEP ${index + 1}/${commands.length}: ${command.name}`);
    console.log(`🔄 ${command.description}...`);
    
    const success = await executeCommand(command.script, command.name);
    
    if (!success) {
      console.log(`\n❌ SEQUENCE FAILED AT STEP ${index + 1}`);
      console.log(`💥 ${command.name} execution failed`);
      console.log('\n⚠️ Check the output above for specific errors');
      return false;
    }
    
    console.log(`✅ Step ${index + 1} completed successfully`);
  }
  
  console.log('\n🎉 FULL SEQUENCE COMPLETED!');
  console.log('===========================');
  console.log('✅ Environment configured');
  console.log('✅ Features disabled');
  console.log('✅ Docker services started');
  console.log('✅ Diagnostics passed');
  
  return true;
}

function executeCommand(script, name) {
  return new Promise((resolve) => {
    console.log(`   Executing: node ${script}`);
    
    const process = spawn('node', [script], {
      stdio: 'inherit'
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`   ✅ ${name} completed`);
        resolve(true);
      } else {
        console.log(`   ❌ ${name} failed (exit code: ${code})`);
        resolve(false);
      }
    });
    
    process.on('error', (error) => {
      console.error(`   💥 ${name} error:`, error.message);
      resolve(false);
    });
  });
}

// Test endpoints function
async function testEndpoints() {
  console.log('\n🌐 TESTING SERVICE ENDPOINTS');
  console.log('============================');
  
  const endpoints = [
    { url: 'http://localhost:8085/health', name: 'Sovereign Agents' },
    { url: 'http://localhost:3000/health', name: 'Template Processor' },
    { url: 'http://localhost:3001/health', name: 'AI Service' },
    { url: 'http://localhost:8080/health', name: 'Platform Hub' }
  ];
  
  let allHealthy = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name}: HEALTHY`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, JSON.stringify(data, null, 4));
      } else {
        console.log(`⚠️ ${endpoint.name}: ERROR ${response.status}`);
        allHealthy = false;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: UNREACHABLE`);
      console.log(`   Error: ${error.message}`);
      allHealthy = false;
    }
  }
  
  return allHealthy;
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting complete system test...\n');
    
    // Execute the full sequence
    const sequenceSuccess = await executeSequence();
    
    if (!sequenceSuccess) {
      console.log('\n💥 SYSTEM TEST FAILED');
      console.log('Sequence execution incomplete');
      process.exit(1);
    }
    
    // Wait for services to stabilize
    console.log('\n⏳ Waiting for services to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Test endpoints
    const endpointsHealthy = await testEndpoints();
    
    console.log('\n🎯 FINAL SYSTEM STATUS');
    console.log('=====================');
    
    if (sequenceSuccess && endpointsHealthy) {
      console.log('🎉 SYSTEM FULLY OPERATIONAL!');
      console.log('============================');
      console.log('✅ All sequences completed');
      console.log('✅ All endpoints responding');
      console.log('✅ Sovereign agents ready');
      
      console.log('\n🎭 SOVEREIGN AGENTS READY FOR ACTION!');
      console.log('====================================');
      console.log('🔗 Sovereign Agents: http://localhost:8085');
      console.log('🎨 Template Processor: http://localhost:3000');
      console.log('🤖 AI Service: http://localhost:3001');
      console.log('🏠 Platform Hub: http://localhost:8080');
      
      console.log('\n🎯 READY TO PROCESS DOCUMENTS!');
      console.log('Upload your 500MB chat logs and watch the magic happen!');
      
      process.exit(0);
    } else {
      console.log('❌ SYSTEM ISSUES DETECTED');
      console.log('=========================');
      console.log(`Sequence: ${sequenceSuccess ? 'OK' : 'FAILED'}`);
      console.log(`Endpoints: ${endpointsHealthy ? 'OK' : 'FAILED'}`);
      
      console.log('\n⚠️ Manual troubleshooting required');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 System test fatal error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Execute main function
main();