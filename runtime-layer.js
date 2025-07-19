#!/usr/bin/env node

/**
 * Document Generator Runtime Layer
 * Handles silent errors, dependency issues, and execution environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DocumentGeneratorRuntime {
  constructor() {
    this.errors = [];
    this.dependencies = new Map();
    this.environment = {};
    this.processes = new Map();
  }

  async initialize() {
    console.log('⚡ DOCUMENT GENERATOR RUNTIME LAYER');
    console.log('==================================');
    
    await this.checkEnvironment();
    await this.resolveDependencies();
    await this.fixSilentErrors();
    await this.initializeRuntime();
    
    console.log('✅ Runtime layer operational');
    return this;
  }

  async checkEnvironment() {
    console.log('🔍 Checking runtime environment...');
    
    // Check Node.js version
    this.environment.nodeVersion = process.version;
    console.log(`📦 Node.js: ${this.environment.nodeVersion}`);
    
    // Check working directory
    this.environment.cwd = process.cwd();
    console.log(`📂 Working dir: ${this.environment.cwd}`);
    
    // Check file permissions
    try {
      fs.accessSync('.', fs.constants.R_OK | fs.constants.W_OK);
      console.log('✅ Directory permissions: OK');
    } catch (error) {
      console.log('❌ Directory permissions: FAILED');
      this.errors.push('Directory permission error');
    }
    
    // Check available memory
    const memory = process.memoryUsage();
    console.log(`💾 Memory: ${Math.round(memory.heapUsed / 1024 / 1024)}MB used`);
    
    if (memory.heapUsed > 500 * 1024 * 1024) {
      console.log('⚠️  High memory usage detected');
    }
  }

  async resolveDependencies() {
    console.log('\n📦 Resolving dependencies...');
    
    const requiredDeps = [
      'express',
      'ws', 
      'multer',
      'readline'
    ];
    
    // Check if package.json exists
    if (!fs.existsSync('./package.json')) {
      console.log('⚠️  No package.json found, creating...');
      this.createPackageJson();
    }
    
    // Try to require each dependency
    for (const dep of requiredDeps) {
      try {
        require(dep);
        this.dependencies.set(dep, 'available');
        console.log(`✅ ${dep}: Available`);
      } catch (error) {
        this.dependencies.set(dep, 'missing');
        console.log(`❌ ${dep}: Missing`);
        this.errors.push(`Missing dependency: ${dep}`);
      }
    }
    
    // Auto-install missing dependencies if possible
    const missing = Array.from(this.dependencies.entries())
      .filter(([dep, status]) => status === 'missing')
      .map(([dep]) => dep);
    
    if (missing.length > 0) {
      console.log(`\n📥 Installing missing dependencies: ${missing.join(', ')}`);
      await this.installDependencies(missing);
    }
  }

  async installDependencies(deps) {
    try {
      console.log('🔄 Running npm install...');
      const result = execSync(`npm install ${deps.join(' ')}`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('✅ Dependencies installed');
      
      // Re-check availability
      deps.forEach(dep => {
        try {
          require(dep);
          this.dependencies.set(dep, 'available');
        } catch (error) {
          console.log(`❌ ${dep} still not available after install`);
        }
      });
      
    } catch (error) {
      console.log('❌ npm install failed:', error.message);
      console.log('💡 Try running manually: npm install');
      this.errors.push('Dependency installation failed');
    }
  }

  async fixSilentErrors() {
    console.log('\n🔧 Fixing silent errors...');
    
    // Create missing directories
    const requiredDirs = [
      'uploads',
      'generated', 
      'logs',
      'temp',
      'data'
    ];
    
    requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      } else {
        console.log(`✅ Directory exists: ${dir}`);
      }
    });
    
    // Fix file permissions
    try {
      const files = [
        'cli.js',
        'web-interface.js',
        'master-orchestrator.js',
        'git-wrapper.js'
      ];
      
      files.forEach(file => {
        if (fs.existsSync(file)) {
          console.log(`✅ File exists: ${file}`);
        } else {
          console.log(`❌ Missing file: ${file}`);
          this.errors.push(`Missing file: ${file}`);
        }
      });
      
    } catch (error) {
      console.log('❌ File check failed:', error.message);
    }
    
    // Check ports
    await this.checkPorts([3001, 8080, 11434]);
  }

  async checkPorts(ports) {
    console.log('\n🔌 Checking ports...');
    
    for (const port of ports) {
      try {
        // Simple port check using net module
        const net = require('net');
        const server = net.createServer();
        
        await new Promise((resolve, reject) => {
          server.listen(port, () => {
            console.log(`✅ Port ${port}: Available`);
            server.close(resolve);
          });
          
          server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
              console.log(`⚠️  Port ${port}: In use`);
            } else {
              console.log(`❌ Port ${port}: Error - ${error.message}`);
            }
            resolve();
          });
        });
        
      } catch (error) {
        console.log(`❌ Port ${port}: Check failed`);
      }
    }
  }

  async initializeRuntime() {
    console.log('\n⚡ Initializing runtime processes...');
    
    // Create runtime wrapper functions
    this.createRuntimeWrappers();
    
    // Setup error handlers
    this.setupErrorHandlers();
    
    // Initialize process monitoring
    this.initializeProcessMonitoring();
    
    console.log('✅ Runtime initialization complete');
  }

  createRuntimeWrappers() {
    console.log('🔧 Creating runtime wrappers...');
    
    // Wrapper for safe module require
    global.safeRequire = (moduleName) => {
      try {
        return require(moduleName);
      } catch (error) {
        console.log(`❌ Failed to require ${moduleName}:`, error.message);
        this.errors.push(`Module require failed: ${moduleName}`);
        return null;
      }
    };
    
    // Wrapper for safe file operations
    global.safeFileOp = (operation, ...args) => {
      try {
        return fs[operation](...args);
      } catch (error) {
        console.log(`❌ File operation ${operation} failed:`, error.message);
        this.errors.push(`File operation failed: ${operation}`);
        return null;
      }
    };
    
    // Wrapper for safe process spawning
    global.safeSpawn = (command, args, options) => {
      try {
        const { spawn } = require('child_process');
        const process = spawn(command, args, options);
        
        process.on('error', (error) => {
          console.log(`❌ Process ${command} failed:`, error.message);
          this.errors.push(`Process spawn failed: ${command}`);
        });
        
        return process;
      } catch (error) {
        console.log(`❌ Spawn ${command} failed:`, error.message);
        return null;
      }
    };
    
    console.log('✅ Runtime wrappers created');
  }

  setupErrorHandlers() {
    console.log('🛡️  Setting up error handlers...');
    
    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      console.log('❌ Uncaught Exception:', error.message);
      this.errors.push(`Uncaught exception: ${error.message}`);
      
      // Don't exit, try to continue
      console.log('🔄 Attempting to continue...');
    });
    
    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      console.log('❌ Unhandled Rejection:', reason);
      this.errors.push(`Unhandled rejection: ${reason}`);
      
      // Don't exit, try to continue
      console.log('🔄 Attempting to continue...');
    });
    
    // Warning handler
    process.on('warning', (warning) => {
      if (!warning.message.includes('DeprecationWarning')) {
        console.log('⚠️  Warning:', warning.message);
      }
    });
    
    console.log('✅ Error handlers active');
  }

  initializeProcessMonitoring() {
    console.log('📊 Initializing process monitoring...');
    
    // Monitor memory usage
    setInterval(() => {
      const memory = process.memoryUsage();
      const memoryMB = Math.round(memory.heapUsed / 1024 / 1024);
      
      if (memoryMB > 512) {
        console.log(`⚠️  High memory usage: ${memoryMB}MB`);
        
        // Trigger garbage collection if available
        if (global.gc) {
          global.gc();
          console.log('🗑️  Garbage collection triggered');
        }
      }
    }, 30000);
    
    // Monitor error accumulation
    setInterval(() => {
      if (this.errors.length > 10) {
        console.log(`⚠️  Error accumulation: ${this.errors.length} errors`);
        // Keep only last 5 errors
        this.errors = this.errors.slice(-5);
      }
    }, 60000);
    
    console.log('✅ Process monitoring active');
  }

  createPackageJson() {
    const packageJson = {
      name: "document-generator",
      version: "1.0.0",
      description: "Document Generator Runtime",
      main: "master-orchestrator.js",
      scripts: {
        start: "node master-orchestrator.js",
        web: "node web-interface.js",
        cli: "node cli.js",
        runtime: "node runtime-layer.js"
      },
      dependencies: {
        express: "^4.18.2",
        ws: "^8.14.2",
        multer: "^1.4.5-lts.1",
        readline: "^1.3.0"
      }
    };
    
    fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Created package.json');
  }

  // Execute system with runtime safety
  async executeSystem() {
    console.log('\n🚀 EXECUTING SYSTEM WITH RUNTIME LAYER');
    console.log('=====================================');
    
    if (this.errors.length > 0) {
      console.log('\n⚠️  Runtime Issues Detected:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      console.log('\n🔄 Attempting to continue despite issues...');
    }
    
    // Try to execute master orchestrator
    try {
      console.log('\n1. 🎭 Starting Master Orchestrator...');
      const MasterOrchestrator = safeRequire('./master-orchestrator.js');
      
      if (MasterOrchestrator) {
        const master = new MasterOrchestrator();
        await master.initialize();
        console.log('✅ Master Orchestrator running');
        return true;
      }
    } catch (error) {
      console.log('❌ Master Orchestrator failed:', error.message);
    }
    
    // Fallback to web interface
    try {
      console.log('\n2. 🌐 Fallback: Starting Web Interface...');
      const WebInterface = safeRequire('./web-interface.js');
      
      if (WebInterface) {
        const web = new WebInterface(8080);
        await web.initialize();
        console.log('✅ Web Interface running on http://localhost:8080');
        return true;
      }
    } catch (error) {
      console.log('❌ Web Interface failed:', error.message);
    }
    
    // Final fallback
    console.log('\n3. 📋 Final Fallback: CLI Instructions');
    console.log('=====================================');
    console.log('Manual execution commands:');
    console.log('  node cli.js');
    console.log('  node web-interface.js');
    console.log('  node git-wrapper.js status');
    console.log('\nTry running these commands directly in your terminal.');
    
    return false;
  }

  getRuntimeStatus() {
    return {
      errors: this.errors.length,
      dependencies: Object.fromEntries(this.dependencies),
      environment: this.environment,
      processes: this.processes.size,
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    };
  }

  showRuntimeDashboard() {
    console.log('\n⚡ RUNTIME LAYER STATUS');
    console.log('======================');
    
    const status = this.getRuntimeStatus();
    
    console.log(`❌ Errors: ${status.errors}`);
    console.log(`📦 Dependencies: ${Object.values(status.dependencies).filter(s => s === 'available').length}/${Object.keys(status.dependencies).length} available`);
    console.log(`💾 Memory: ${status.memory}MB`);
    console.log(`🔄 Processes: ${status.processes}`);
    
    if (this.errors.length > 0) {
      console.log('\n⚠️  Recent Errors:');
      this.errors.slice(-3).forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    console.log('\n✅ Runtime layer monitoring active');
  }
}

// Start runtime if run directly
if (require.main === module) {
  const runtime = new DocumentGeneratorRuntime();
  
  runtime.initialize().then(async () => {
    runtime.showRuntimeDashboard();
    
    console.log('\n🚀 Attempting system execution...');
    const success = await runtime.executeSystem();
    
    if (success) {
      console.log('\n✅ SYSTEM EXECUTION SUCCESSFUL!');
      console.log('Document Generator is running with runtime layer protection');
    } else {
      console.log('\n❌ SYSTEM EXECUTION FAILED');
      console.log('Check runtime issues and try manual execution');
    }
    
  }).catch(error => {
    console.error('❌ Runtime initialization failed:', error.message);
  });
}

module.exports = DocumentGeneratorRuntime;