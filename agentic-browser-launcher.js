#!/usr/bin/env node

/**
 * 🚀 AGENTIC BROWSER LAUNCHER
 * 
 * Main launcher for the Agentic Browser with:
 * - Dependency checking and setup
 * - Service discovery and connection
 * - Error handling and graceful fallbacks
 * - Integration with existing Document Generator services
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Import dependency checker
const DependencyChecker = require('./scripts/check-dependencies');

class AgenticBrowserLauncher {
  constructor() {
    this.config = {
      isDev: process.argv.includes('--dev') || process.env.NODE_ENV === 'development',
      autoInstall: process.argv.includes('--auto-install'),
      skipChecks: process.argv.includes('--skip-checks'),
      verbose: process.argv.includes('--verbose'),
      port: parseInt(process.argv.find(arg => arg.startsWith('--port='))?.split('=')[1]) || 3060
    };

    this.services = {
      calCompare: { url: 'http://localhost:3001', required: false, name: 'CalCompare Consultation Hub', startScript: 'FinishThisIdea/ai-os-clean/cal-compare-complete.js' },
      dashboard: { url: 'http://localhost:3000', required: false, name: 'Production Master Dashboard' },
      webFetcher: { url: 'http://localhost:3052', required: false, name: 'Web Content Fetcher', startScript: 'web-content-fetcher-service.js' },
      aiOrchestrator: { url: 'http://localhost:3050', required: false, name: 'AI Orchestrator' },
      platformHub: { url: 'http://localhost:8080', required: false, name: 'Platform Hub' },
      ollama: { url: 'http://localhost:11434', required: true, name: 'Ollama LLM Service' }
    };

    this.agenticBrowserProcess = null;
    this.isShuttingDown = false;

    console.log('🚀 Agentic Browser Launcher');
    console.log(`📊 Mode: ${this.config.isDev ? 'Development' : 'Production'}`);
  }

  async launch() {
    try {
      // Step 1: Check dependencies
      if (!this.config.skipChecks) {
        await this.checkDependencies();
      }

      // Step 2: Discover and connect to services
      await this.discoverServices();

      // Step 3: Start the Agentic Browser
      await this.startAgenticBrowser();

      // Step 4: Setup graceful shutdown
      this.setupGracefulShutdown();

      console.log('\n✅ Agentic Browser launched successfully!');
      console.log(`🌐 Open http://localhost:${this.config.port} in your browser`);

    } catch (error) {
      console.error('\n❌ Failed to launch Agentic Browser:', error.message);
      
      if (this.config.verbose) {
        console.error('Stack trace:', error.stack);
      }

      await this.cleanup();
      process.exit(1);
    }
  }

  async checkDependencies() {
    console.log('\n🔍 Checking dependencies...');

    const checker = new DependencyChecker();
    const isReady = await checker.check();

    if (!isReady) {
      if (this.config.autoInstall) {
        console.log('\n🔧 Auto-installing missing dependencies...');
        await this.installDependencies();
      } else {
        console.log('\n💡 To install missing dependencies, run:');
        console.log('   npm run setup-deps');
        console.log('\nOr add --auto-install flag to install automatically');
        throw new Error('Dependencies not ready');
      }
    }
  }

  async installDependencies() {
    try {
      const DependencyInstaller = require('./scripts/install-dependencies');
      const installer = new DependencyInstaller();
      await installer.run();
    } catch (error) {
      throw new Error(`Dependency installation failed: ${error.message}`);
    }
  }

  async discoverServices() {
    console.log('\n🔎 Discovering services...');

    const discoveries = await Promise.all(
      Object.entries(this.services).map(async ([name, service]) => {
        try {
          await execAsync(`curl -s -f ${service.url}/health || curl -s -f ${service.url}`);
          console.log(`✅ ${service.name || name} service found at ${service.url}`);
          return { name, status: 'online', url: service.url, service };
        } catch (error) {
          const status = service.required ? '❌' : '⚠️';
          console.log(`${status} ${service.name || name} service not available at ${service.url}`);
          return { name, status: 'offline', url: service.url, required: service.required, service };
        }
      })
    );

    // Auto-start optional services if possible
    const offlineServices = discoveries.filter(d => d.status === 'offline' && !d.required);
    for (const discovery of offlineServices) {
      if (discovery.service.startScript && this.config.autoStart !== false) {
        try {
          console.log(`🚀 Attempting to start ${discovery.service.name}...`);
          await this.startService(discovery.service.startScript, discovery.service.name);
          
          // Wait a moment and check again
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          try {
            await execAsync(`curl -s -f ${discovery.service.url}/health`);
            discovery.status = 'online';
            console.log(`✅ ${discovery.service.name} started successfully`);
          } catch {
            console.log(`⚠️ ${discovery.service.name} may still be starting up...`);
          }
        } catch (startError) {
          console.log(`⚠️ Could not auto-start ${discovery.service.name}: ${startError.message}`);
        }
      }
    }

    // Check if required services are available
    const missingRequired = discoveries.filter(d => d.required && d.status === 'offline');
    if (missingRequired.length > 0) {
      console.log('\n❌ Required services missing:');
      missingRequired.forEach(discovery => {
        console.log(`   - ${discovery.service.name || discovery.name}: ${discovery.url}`);
      });

      if (missingRequired.some(d => d.name === 'ollama')) {
        console.log('\n💡 To start Ollama: ollama serve');
      }

      throw new Error('Required services not available');
    }

    // Store discovered services for configuration
    this.discoveredServices = discoveries;
  }

  async startAgenticBrowser() {
    console.log('\n🚀 Starting Agentic Browser...');

    // Check if the main browser file exists
    const browserPath = path.join(__dirname, 'electron-agentic-browser.js');
    
    try {
      await fs.access(browserPath);
    } catch (error) {
      throw new Error(`Agentic Browser file not found: ${browserPath}`);
    }

    // Start the Electron application
    const args = [browserPath];
    
    if (this.config.isDev) {
      args.push('--dev');
    }

    if (this.config.verbose) {
      args.push('--verbose');
    }

    args.push(`--port=${this.config.port}`);

    // Add discovered services as environment variables
    const env = {
      ...process.env,
      AGENTIC_BROWSER_PORT: this.config.port.toString(),
      DISCOVERED_SERVICES: JSON.stringify(this.discoveredServices)
    };

    try {
      this.agenticBrowserProcess = spawn('node', args, {
        env,
        stdio: this.config.verbose ? 'inherit' : ['ignore', 'pipe', 'pipe']
      });

      // Handle process output
      if (!this.config.verbose) {
        this.agenticBrowserProcess.stdout.on('data', (data) => {
          const output = data.toString().trim();
          if (output.includes('ready') || output.includes('started') || output.includes('error')) {
            console.log(output);
          }
        });

        this.agenticBrowserProcess.stderr.on('data', (data) => {
          console.error('Browser Error:', data.toString().trim());
        });
      }

      // Handle process exit
      this.agenticBrowserProcess.on('close', (code) => {
        if (!this.isShuttingDown) {
          if (code === 0) {
            console.log('\n👋 Agentic Browser closed gracefully');
          } else {
            console.error(`\n❌ Agentic Browser exited with code ${code}`);
          }
          process.exit(code);
        }
      });

      // Wait a moment to ensure it started properly
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if process is still running
      if (this.agenticBrowserProcess.killed) {
        throw new Error('Agentic Browser process died immediately');
      }

    } catch (error) {
      throw new Error(`Failed to start Agentic Browser: ${error.message}`);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      this.isShuttingDown = true;
      
      await this.cleanup();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart
  }

  async startService(scriptPath, serviceName) {
    return new Promise((resolve, reject) => {
      const fullPath = path.join(__dirname, scriptPath);
      
      console.log(`🔧 Starting ${serviceName} from ${fullPath}...`);
      
      const serviceProcess = spawn('node', [fullPath], {
        detached: true,
        stdio: 'ignore'
      });
      
      serviceProcess.unref(); // Allow parent process to exit
      
      // Give the service time to start
      setTimeout(() => {
        if (serviceProcess.killed) {
          reject(new Error(`${serviceName} process died immediately`));
        } else {
          resolve();
        }
      }, 1000);
      
      serviceProcess.on('error', (error) => {
        reject(new Error(`Failed to start ${serviceName}: ${error.message}`));
      });
    });
  }

  async cleanup() {
    if (this.agenticBrowserProcess && !this.agenticBrowserProcess.killed) {
      console.log('🧹 Stopping Agentic Browser...');
      
      // Try graceful shutdown first
      this.agenticBrowserProcess.kill('SIGTERM');
      
      // Force kill after timeout
      setTimeout(() => {
        if (!this.agenticBrowserProcess.killed) {
          this.agenticBrowserProcess.kill('SIGKILL');
        }
      }, 5000);
    }
  }

  static displayHelp() {
    console.log(`
🚀 Agentic Browser Launcher

Usage: npm run agentic-browser [options]

Options:
  --dev               Run in development mode
  --auto-install      Automatically install missing dependencies  
  --skip-checks       Skip dependency checking
  --verbose           Show detailed output
  --port=3060         Set custom port number
  --help              Show this help message

Examples:
  npm run agentic-browser                    # Normal startup
  npm run agentic-browser -- --dev          # Development mode
  npm run agentic-browser -- --auto-install # Auto-install deps
  npm run agentic-browser -- --port=3070    # Custom port

Prerequisites:
  - Node.js 16+
  - Ollama (for local AI)
  - Optional: yt-dlp, ffmpeg, whisper

Quick setup:
  npm run setup-deps    # Install all dependencies
  npm run check-deps    # Check system status
`);
  }
}

// Handle command line arguments
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    AgenticBrowserLauncher.displayHelp();
    process.exit(0);
  }

  const launcher = new AgenticBrowserLauncher();
  launcher.launch().catch(error => {
    console.error('💥 Launch failed:', error.message);
    process.exit(1);
  });
}

module.exports = AgenticBrowserLauncher;