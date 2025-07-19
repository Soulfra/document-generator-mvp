#!/usr/bin/env node

/**
 * Start Docker Services - Launch all required services
 */

const { spawn } = require('child_process');

console.log('🐳 STARTING DOCKER SERVICES');
console.log('===========================');

function executeCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 ${description}...`);
    console.log(`   Command: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('  ', data.toString().trim());
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('  ', data.toString().trim());
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`);
        resolve({ success: true, stdout, stderr });
      } else {
        console.log(`❌ ${description} failed with code ${code}`);
        resolve({ success: false, code, stdout, stderr });
      }
    });
    
    process.on('error', (error) => {
      console.error(`💥 ${description} error:`, error.message);
      reject(error);
    });
  });
}

async function startDockerServices() {
  try {
    // Check if Docker is running
    console.log('🔍 Checking Docker status...');
    const dockerCheck = await executeCommand('docker', ['ps'], 'Docker status check');
    
    if (!dockerCheck.success) {
      console.log('⚠️ Docker may not be running. Attempting to start anyway...');
    }
    
    // Stop any existing services
    console.log('\n🛑 Stopping existing services...');
    await executeCommand('docker-compose', ['down'], 'Stop existing services');
    
    // Build and start services
    console.log('\n🏗️ Building and starting services...');
    const startResult = await executeCommand(
      'docker-compose', 
      ['up', '-d', '--build'], 
      'Build and start Docker services'
    );
    
    if (startResult.success) {
      console.log('\n🎉 DOCKER SERVICES STARTED!');
      console.log('==========================');
      
      // Wait a bit for services to initialize
      console.log('⏳ Waiting for services to initialize...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check service status
      console.log('\n📊 Checking service status...');
      const statusResult = await executeCommand('docker-compose', ['ps'], 'Service status check');
      
      console.log('\n🎯 DOCKER STARTUP COMPLETE!');
      console.log('===========================');
      console.log('✅ All services should be running');
      console.log('🔗 Services should be available at:');
      console.log('   - Template Processor: http://localhost:3000');
      console.log('   - AI Service: http://localhost:3001');
      console.log('   - Analytics: http://localhost:3002');
      console.log('   - Platform Hub: http://localhost:8080');
      console.log('   - Sovereign Agents: http://localhost:8085');
      console.log('   - WebSocket: ws://localhost:8081');
      
      return true;
    } else {
      console.log('\n❌ DOCKER STARTUP FAILED');
      console.log('========================');
      console.log('Check the output above for errors');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Docker startup error:', error.message);
    return false;
  }
}

// Execute immediately
startDockerServices()
  .then(success => {
    if (success) {
      console.log('\n🚀 NEXT STEP: node direct-error-logger.js');
    } else {
      console.log('\n⚠️ Docker services failed to start properly');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });