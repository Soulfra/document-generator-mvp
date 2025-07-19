#!/usr/bin/env node

/**
 * Direct Error Logger - Bypasses shell to capture actual errors
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

console.log('🔍 DIRECT ERROR LOGGER');
console.log('======================');
console.log('Capturing errors without shell dependencies...\n');

class DirectErrorLogger {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  log(level, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    this[level].push(entry);
    console.log(`[${level.toUpperCase()}] ${message}`);
    if (data) console.log('  Data:', JSON.stringify(data, null, 2));
  }

  async checkDockerStatus() {
    this.log('info', '🐳 Checking Docker status...');
    
    return new Promise((resolve) => {
      const dockerProcess = spawn('docker', ['ps', '--format', 'table {{.Names}}\\t{{.Status}}'], {
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      dockerProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      dockerProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      dockerProcess.on('close', (code) => {
        if (code === 0) {
          this.log('info', 'Docker available', { output: output.trim() });
          resolve(true);
        } else {
          this.log('errors', 'Docker failed', { 
            code, 
            error: errorOutput.trim(),
            output: output.trim()
          });
          resolve(false);
        }
      });
      
      dockerProcess.on('error', (error) => {
        this.log('errors', 'Docker command error', { 
          message: error.message,
          code: error.code 
        });
        resolve(false);
      });
    });
  }

  async testLocalhost() {
    this.log('info', '🌐 Testing localhost endpoints...');
    
    const endpoints = [
      'http://localhost:8085/health',
      'http://localhost:3000/health', 
      'http://localhost:3001/health',
      'http://localhost:8080/health'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          const data = await response.json();
          this.log('info', `✅ ${endpoint} responding`, { status: response.status, data });
        } else {
          this.log('warnings', `⚠️ ${endpoint} error response`, { status: response.status });
        }
      } catch (error) {
        this.log('errors', `❌ ${endpoint} failed`, { 
          message: error.message,
          code: error.code
        });
      }
    }
  }

  async checkFiles() {
    this.log('info', '📁 Checking critical files...');
    
    const criticalFiles = [
      'docker-compose.yml',
      '.env',
      'services/sovereign-agents/src/index.js',
      'vibecoding-vault/package.json',
      'FinishThisIdea/symlink-manager.js'
    ];
    
    for (const file of criticalFiles) {
      try {
        await fs.access(file);
        this.log('info', `✅ ${file} exists`);
      } catch (error) {
        this.log('errors', `❌ ${file} missing`, { message: error.message });
      }
    }
  }

  async checkProcesses() {
    this.log('info', '🔄 Checking running processes...');
    
    return new Promise((resolve) => {
      const psProcess = spawn('ps', ['aux'], { stdio: 'pipe' });
      
      let output = '';
      
      psProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      psProcess.on('close', (code) => {
        const relevantProcesses = output
          .split('\n')
          .filter(line => 
            line.includes('node') || 
            line.includes('docker') || 
            line.includes('electron') ||
            line.includes('sovereign')
          );
        
        this.log('info', 'Relevant processes found', { 
          count: relevantProcesses.length,
          processes: relevantProcesses.slice(0, 10) // First 10
        });
        
        resolve(true);
      });
      
      psProcess.on('error', (error) => {
        this.log('errors', 'Process check failed', { message: error.message });
        resolve(false);
      });
    });
  }

  async checkSymlinks() {
    this.log('info', '🔗 Checking symlinks in project...');
    
    const checkDir = async (dir) => {
      try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        const symlinks = items.filter(item => item.isSymbolicLink());
        
        for (const symlink of symlinks) {
          const linkPath = path.join(dir, symlink.name);
          try {
            await fs.access(linkPath);
            this.log('info', `✅ Valid symlink: ${linkPath}`);
          } catch {
            this.log('errors', `❌ Broken symlink: ${linkPath}`);
          }
        }
        
        return symlinks.length;
      } catch (error) {
        this.log('warnings', `Could not check ${dir}`, { message: error.message });
        return 0;
      }
    };
    
    const dirs = ['FinishThisIdea', 'vibecoding-vault', 'services'];
    let totalSymlinks = 0;
    
    for (const dir of dirs) {
      totalSymlinks += await checkDir(dir);
    }
    
    this.log('info', `Total symlinks found: ${totalSymlinks}`);
  }

  async testNodeExecution() {
    this.log('info', '🚀 Testing Node.js execution...');
    
    const testScript = `
console.log('Node.js execution test successful');
console.log('Environment:', {
  nodeVersion: process.version,
  platform: process.platform,
  cwd: process.cwd(),
  env: {
    NODE_ENV: process.env.NODE_ENV,
    PATH: process.env.PATH ? 'SET' : 'NOT_SET'
  }
});
`;
    
    return new Promise((resolve) => {
      const nodeProcess = spawn('node', ['-e', testScript], { stdio: 'pipe' });
      
      let output = '';
      let errorOutput = '';
      
      nodeProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      nodeProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      nodeProcess.on('close', (code) => {
        if (code === 0) {
          this.log('info', 'Node.js execution successful', { output });
        } else {
          this.log('errors', 'Node.js execution failed', { 
            code,
            output,
            error: errorOutput
          });
        }
        resolve(code === 0);
      });
      
      nodeProcess.on('error', (error) => {
        this.log('errors', 'Node.js spawn failed', { message: error.message });
        resolve(false);
      });
    });
  }

  async runDiagnostics() {
    this.log('info', '🎯 Starting comprehensive diagnostics...');
    
    // Run all diagnostic checks
    await this.checkFiles();
    await this.testNodeExecution();
    await this.checkDockerStatus();
    await this.testLocalhost();
    await this.checkProcesses();
    await this.checkSymlinks();
    
    // Generate summary
    this.log('info', '📊 Diagnostic Summary', {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      totalInfo: this.info.length
    });
    
    // Save detailed log
    const logData = {
      timestamp: new Date().toISOString(),
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        info: this.info.length
      },
      errors: this.errors,
      warnings: this.warnings,
      info: this.info
    };
    
    try {
      await fs.writeFile(
        'diagnostic-log.json',
        JSON.stringify(logData, null, 2)
      );
      this.log('info', '💾 Detailed log saved to diagnostic-log.json');
    } catch (error) {
      this.log('errors', 'Could not save log file', { message: error.message });
    }
    
    console.log('\n🎯 DIAGNOSTIC COMPLETE');
    console.log('======================');
    
    if (this.errors.length > 0) {
      console.log('❌ Critical Errors Found:');
      this.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.message}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning.message}`);
      });
    }
    
    console.log(`\n📊 Total Issues: ${this.errors.length} errors, ${this.warnings.length} warnings`);
    console.log('📁 Detailed log: diagnostic-log.json');
    
    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }
}

// Execute if run directly
if (require.main === module) {
  const logger = new DirectErrorLogger();
  logger.runDiagnostics().catch(console.error);
}

module.exports = DirectErrorLogger;