#!/usr/bin/env node
// 🚀 ONE BUTTON LAUNCHER - Backend service for the single-button interface

const express = require('express');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');

class OneButtonLauncher {
  constructor() {
    this.app = express();
    this.port = process.env.ONE_BUTTON_PORT || 7777;
    this.baseDir = __dirname;
    this.processes = [];
    this.startupStatus = {
      step: 0,
      total: 8,
      message: 'Ready to start',
      status: 'ready'
    };
    
    this.setupRoutes();
  }

  setupRoutes() {
    // Serve static files
    this.app.use(express.static(this.baseDir));
    this.app.use(express.json());
    
    // Main ONE BUTTON page
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(this.baseDir, 'ONE-BUTTON.html'));
    });
    
    // API Routes
    this.app.post('/api/start-everything', async (req, res) => {
      try {
        await this.startEverything();
        res.json({ success: true, message: 'Everything started successfully!' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    this.app.get('/api/status', (req, res) => {
      res.json(this.startupStatus);
    });
    
    this.app.post('/api/stop-everything', async (req, res) => {
      try {
        await this.stopEverything();
        res.json({ success: true, message: 'Everything stopped' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // Individual startup steps
    this.app.post('/api/check-prerequisites', async (req, res) => {
      const result = await this.checkPrerequisites();
      res.json(result);
    });
    
    this.app.post('/api/create-symlinks', async (req, res) => {
      const result = await this.createSymlinks();
      res.json(result);
    });
    
    this.app.post('/api/init-database', async (req, res) => {
      const result = await this.initDatabase();
      res.json(result);
    });
    
    this.app.post('/api/start-economic-engine', async (req, res) => {
      const result = await this.startEconomicEngine();
      res.json(result);
    });
    
    this.app.post('/api/start-slam-layer', async (req, res) => {
      const result = await this.startSlamLayer();
      res.json(result);
    });
    
    this.app.post('/api/start-dashboard', async (req, res) => {
      const result = await this.startDashboard();
      res.json(result);
    });
    
    this.app.post('/api/run-verification', async (req, res) => {
      const result = await this.runVerification();
      res.json(result);
    });
  }

  async startEverything() {
    console.log(chalk.blue.bold('\n🚀 ONE BUTTON LAUNCHER - Starting Everything...'));
    
    const steps = [
      { name: 'Prerequisites', func: () => this.checkPrerequisites() },
      { name: 'Symlinks', func: () => this.createSymlinks() },
      { name: 'Database', func: () => this.initDatabase() },
      { name: 'Economic Engine', func: () => this.startEconomicEngine() },
      { name: 'Slam Layer', func: () => this.startSlamLayer() },
      { name: 'Dashboard', func: () => this.startDashboard() },
      { name: 'Verification', func: () => this.runVerification() },
      { name: 'Complete', func: () => this.finalize() }
    ];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      this.startupStatus.step = i + 1;
      this.startupStatus.message = `${step.name}...`;
      this.startupStatus.status = 'running';
      
      console.log(chalk.yellow(`[${i + 1}/${steps.length}] ${step.name}...`));
      
      try {
        const result = await step.func();
        if (result && !result.success) {
          throw new Error(result.error || `${step.name} failed`);
        }
        console.log(chalk.green(`✅ ${step.name} completed`));
      } catch (error) {
        console.error(chalk.red(`❌ ${step.name} failed:`, error.message));
        this.startupStatus.status = 'error';
        this.startupStatus.message = `Failed at ${step.name}: ${error.message}`;
        throw error;
      }
    }
    
    this.startupStatus.status = 'complete';
    this.startupStatus.message = 'Everything is ready!';
    
    console.log(chalk.green.bold('\n🎉 ONE BUTTON LAUNCH COMPLETE!'));
    this.showAccessInfo();
  }

  async checkPrerequisites() {
    // Check Node.js
    try {
      await this.execCommand('node --version');
    } catch (error) {
      return { success: false, error: 'Node.js not found' };
    }
    
    // Check npm
    try {
      await this.execCommand('npm --version');
    } catch (error) {
      return { success: false, error: 'npm not found' };
    }
    
    // Check required files
    const requiredFiles = [
      'server.js',
      'slam-it-all-together.js',
      'dashboard-server.js',
      'package.json'
    ];
    
    for (const file of requiredFiles) {
      try {
        await fs.access(path.join(this.baseDir, file));
      } catch (error) {
        return { success: false, error: `Missing file: ${file}` };
      }
    }
    
    // Install dependencies if needed
    try {
      await fs.access(path.join(this.baseDir, 'node_modules'));
    } catch (error) {
      console.log(chalk.blue('Installing dependencies...'));
      await this.execCommand('npm install');
    }
    
    return { success: true };
  }

  async createSymlinks() {
    try {
      // Run symlink script if it exists
      const symlinkScript = path.join(this.baseDir, 'scripts', 'symlink-everything.sh');
      try {
        await fs.access(symlinkScript);
        await this.execCommand(`chmod +x "${symlinkScript}"`);
        await this.execCommand(`"${symlinkScript}"`);
      } catch (error) {
        // Create basic symlinks manually
        await this.createBasicSymlinks();
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createBasicSymlinks() {
    const symlinkDir = path.join(this.baseDir, '.unified');
    
    // Create directories
    await this.execCommand(`mkdir -p "${symlinkDir}/services"`);
    await this.execCommand(`mkdir -p "${symlinkDir}/interfaces"`);
    await this.execCommand(`mkdir -p "${symlinkDir}/config"`);
    
    // Create symlinks
    const symlinks = [
      { src: 'server.js', dest: '.unified/services/economic-engine.js' },
      { src: 'slam-it-all-together.js', dest: '.unified/services/slam-layer.js' },
      { src: 'dashboard-server.js', dest: '.unified/services/dashboard.js' },
      { src: 'visual-dashboard.html', dest: '.unified/interfaces/web.html' },
      { src: 'terminal-dashboard.js', dest: '.unified/interfaces/terminal.js' }
    ];
    
    for (const link of symlinks) {
      const srcPath = path.join(this.baseDir, link.src);
      const destPath = path.join(this.baseDir, link.dest);
      
      try {
        await fs.access(srcPath);
        await this.execCommand(`ln -sf "${srcPath}" "${destPath}"`);
      } catch (error) {
        // File doesn't exist, skip
      }
    }
  }

  async initDatabase() {
    try {
      const initScript = path.join(this.baseDir, 'init-database.js');
      await fs.access(initScript);
      await this.execCommand(`node "${initScript}"`);
      return { success: true };
    } catch (error) {
      // Database init is optional
      console.log(chalk.yellow('⚠️  Database initialization skipped (init script not found)'));
      return { success: true };
    }
  }

  async startEconomicEngine() {
    return this.startService('Economic Engine', 'server.js', 3000);
  }

  async startSlamLayer() {
    return this.startService('Slam Layer', 'slam-it-all-together.js', 9999);
  }

  async startDashboard() {
    return this.startService('Dashboard', 'dashboard-server.js', 8081);
  }

  async startService(name, script, port) {
    try {
      // Kill existing process on port
      try {
        await this.execCommand(`lsof -ti:${port} | xargs kill -9`);
        await this.delay(1000);
      } catch (error) {
        // No existing process, that's fine
      }
      
      // Start the service
      const scriptPath = path.join(this.baseDir, script);
      await fs.access(scriptPath);
      
      const child = spawn('node', [scriptPath], {
        cwd: this.baseDir,
        detached: true,
        stdio: 'ignore'
      });
      
      child.unref();
      this.processes.push({ name, pid: child.pid, port });
      
      // Wait for service to be ready
      await this.waitForPort(port, 15000);
      
      return { success: true, pid: child.pid, port };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async runVerification() {
    try {
      const verifyScript = path.join(this.baseDir, 'scripts', 'startup-verification.js');
      await fs.access(verifyScript);
      await this.execCommand(`node "${verifyScript}"`);
      return { success: true };
    } catch (error) {
      // Run basic verification
      const services = [
        { name: 'Economic Engine', port: 3000 },
        { name: 'Slam Layer', port: 9999 },
        { name: 'Dashboard', port: 8081 }
      ];
      
      for (const service of services) {
        try {
          await this.checkPort(service.port);
        } catch (error) {
          return { success: false, error: `${service.name} not responding on port ${service.port}` };
        }
      }
      
      return { success: true };
    }
  }

  async finalize() {
    // Create quick access scripts
    await this.createQuickScripts();
    return { success: true };
  }

  async createQuickScripts() {
    // Stop script
    const stopScript = `#!/bin/bash
echo "🛑 Stopping all services..."
pkill -f "node.*server.js" || true
pkill -f "node.*slam-it-all-together.js" || true  
pkill -f "node.*dashboard-server.js" || true
echo "✅ All services stopped"`;
    
    await fs.writeFile(path.join(this.baseDir, 'stop.sh'), stopScript);
    await this.execCommand(`chmod +x "${path.join(this.baseDir, 'stop.sh')}"`);
    
    // Status script
    const statusScript = `#!/bin/bash
echo "🔍 System Status:"
echo "Economic Engine: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/status)"
echo "Slam Layer: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:9999/slam/status)"  
echo "Dashboard: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/system/status)"`;
    
    await fs.writeFile(path.join(this.baseDir, 'status.sh'), statusScript);
    await this.execCommand(`chmod +x "${path.join(this.baseDir, 'status.sh')}"`);
  }

  async stopEverything() {
    console.log(chalk.blue('🛑 Stopping all services...'));
    
    // Kill processes by PID
    for (const process of this.processes) {
      try {
        await this.execCommand(`kill ${process.pid}`);
        console.log(chalk.green(`✅ Stopped ${process.name} (PID: ${process.pid})`));
      } catch (error) {
        // Process might already be dead
      }
    }
    
    // Kill by process name
    const killCommands = [
      'pkill -f "node.*server.js"',
      'pkill -f "node.*slam-it-all-together.js"',
      'pkill -f "node.*dashboard-server.js"'
    ];
    
    for (const cmd of killCommands) {
      try {
        await this.execCommand(cmd);
      } catch (error) {
        // Ignore errors
      }
    }
    
    this.processes = [];
    this.startupStatus = {
      step: 0,
      total: 8,
      message: 'Ready to start',
      status: 'ready'
    };
    
    console.log(chalk.green('✅ All services stopped'));
  }

  showAccessInfo() {
    console.log(chalk.blue.bold('\n🎯 ACCESS YOUR PLATFORM:'));
    console.log(chalk.green('🏠 Main Application: http://localhost:9999'));
    console.log(chalk.green('📊 Visual Dashboard: http://localhost:8081/dashboard'));
    console.log(chalk.green('🎛️ ONE BUTTON Interface: http://localhost:7777'));
    console.log(chalk.green('💻 Terminal Dashboard: node terminal-dashboard.js'));
    console.log(chalk.blue('\n🛠️ CONTROL:'));
    console.log(chalk.yellow('./stop.sh - Stop all services'));
    console.log(chalk.yellow('./status.sh - Check system status'));
    console.log('');
  }

  // Utility methods
  execCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.baseDir }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  async waitForPort(port, timeout = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        await this.checkPort(port);
        return true;
      } catch (error) {
        await this.delay(500);
      }
    }
    throw new Error(`Service did not start on port ${port} within ${timeout}ms`);
  }

  checkPort(port) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const child = spawn('curl', ['-s', `http://localhost:${port}`], {
        stdio: 'ignore'
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Port ${port} not responding`));
        }
      });
      
      child.on('error', reject);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async start() {
    this.app.listen(this.port, () => {
      console.log(chalk.green.bold(`\n🚀 ONE BUTTON LAUNCHER`));
      console.log(chalk.blue(`   Interface: http://localhost:${this.port}`));
      console.log(chalk.gray(`   Backend API ready on port ${this.port}\n`));
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n🛑 Shutting down...'));
      await this.stopEverything();
      process.exit(0);
    });
  }
}

// Start the launcher
if (require.main === module) {
  const launcher = new OneButtonLauncher();
  launcher.start();
}

module.exports = OneButtonLauncher;