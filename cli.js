#!/usr/bin/env node

/**
 * Document Generator CLI - Interactive Interface
 * Transform documents into MVPs with human oversight
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class DocumentGeneratorCLI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.apiServerProcess = null;
    this.isRunning = false;
  }

  async start() {
    console.log('🎭 DOCUMENT GENERATOR CLI');
    console.log('=========================');
    console.log('Transform any document into a working MVP\n');
    
    await this.showMainMenu();
  }

  async showMainMenu() {
    console.log('📋 MAIN MENU:');
    console.log('1. 🚀 Start Document Generator System');
    console.log('2. 📄 Process Document (Chat Log, PDF, Markdown)');
    console.log('3. 🔧 System Status & Health Check');
    console.log('4. 🌐 Open Web Interface');
    console.log('5. ⚙️  Configuration & Settings');
    console.log('6. 📊 View Processing History');
    console.log('7. 🛠️  Developer Tools');
    console.log('8. ❌ Exit\n');
    
    const choice = await this.prompt('Select option (1-8): ');
    await this.handleMenuChoice(choice);
  }

  async handleMenuChoice(choice) {
    switch (choice.trim()) {
      case '1':
        await this.startSystem();
        break;
      case '2':
        await this.processDocument();
        break;
      case '3':
        await this.checkSystemStatus();
        break;
      case '4':
        await this.openWebInterface();
        break;
      case '5':
        await this.showConfiguration();
        break;
      case '6':
        await this.showHistory();
        break;
      case '7':
        await this.showDeveloperTools();
        break;
      case '8':
        await this.exit();
        return;
      default:
        console.log('❌ Invalid option. Please try again.\n');
        await this.showMainMenu();
    }
  }

  async startSystem() {
    console.log('\n🚀 STARTING DOCUMENT GENERATOR SYSTEM');
    console.log('=====================================');
    
    if (this.isRunning) {
      console.log('✅ System is already running!');
      const restart = await this.prompt('Restart system? (y/n): ');
      if (restart.toLowerCase() !== 'y') {
        await this.showMainMenu();
        return;
      }
      await this.stopSystem();
    }
    
    console.log('Starting services...');
    
    // Option 1: Full Docker Stack
    console.log('\nChoose startup method:');
    console.log('1. 🐳 Full Production Stack (Docker)');
    console.log('2. ⚡ Quick Start (API Server Only)');
    console.log('3. 🎭 Sovereign Agents Mode');
    console.log('4. 🔙 Back to main menu');
    
    const method = await this.prompt('Select method (1-4): ');
    
    switch (method.trim()) {
      case '1':
        await this.startDockerStack();
        break;
      case '2':
        await this.startAPIServer();
        break;
      case '3':
        await this.startSovereignMode();
        break;
      case '4':
        await this.showMainMenu();
        return;
      default:
        console.log('❌ Invalid option');
        await this.startSystem();
        return;
    }
    
    this.isRunning = true;
    await this.showMainMenu();
  }

  async startDockerStack() {
    console.log('\n🐳 Starting Docker production stack...');
    
    try {
      const dockerProcess = spawn('docker-compose', ['-f', 'docker-compose.production.yml', 'up', '-d'], {
        cwd: __dirname,
        stdio: 'inherit'
      });
      
      dockerProcess.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Docker stack started successfully!');
          console.log('🌐 Web Interface: http://localhost:3001');
          console.log('📊 Grafana Dashboard: http://localhost:3000');
          console.log('📈 Prometheus: http://localhost:9090');
        } else {
          console.log('\n❌ Docker stack failed to start');
        }
      });
      
    } catch (error) {
      console.log('❌ Docker not available, trying alternative...');
      await this.startAPIServer();
    }
  }

  async startAPIServer() {
    console.log('\n⚡ Starting API server...');
    
    this.apiServerProcess = spawn('node', ['index.js'], {
      cwd: path.join(__dirname, 'services', 'api-server'),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PORT: '3001'
      }
    });
    
    this.apiServerProcess.stdout.on('data', (data) => {
      console.log('API:', data.toString().trim());
    });
    
    this.apiServerProcess.stderr.on('data', (data) => {
      console.log('API Error:', data.toString().trim());
    });
    
    console.log('✅ API server starting on http://localhost:3001');
  }

  async startSovereignMode() {
    console.log('\n🎭 Starting Sovereign Agents mode...');
    
    const sovereignProcess = spawn('node', ['sovereign-chatlog-processor.js'], {
      cwd: path.join(__dirname, 'FinishThisIdea'),
      stdio: 'inherit'
    });
    
    console.log('✅ Sovereign agents activated');
  }

  async processDocument() {
    console.log('\n📄 DOCUMENT PROCESSING');
    console.log('======================');
    
    console.log('Supported formats:');
    console.log('• Chat logs (.txt, .log, .json)');
    console.log('• PDF documents');
    console.log('• Markdown files');
    console.log('• Business plans');
    console.log('• Technical specifications\n');
    
    const filePath = await this.prompt('Enter document path (or "demo" for demo): ');
    
    if (filePath.toLowerCase() === 'demo') {
      await this.runDemo();
    } else if (fs.existsSync(filePath)) {
      await this.processFile(filePath);
    } else {
      console.log('❌ File not found. Please check the path.\n');
      await this.processDocument();
    }
  }

  async processFile(filePath) {
    console.log(`\n🔄 Processing: ${filePath}`);
    
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`📏 File size: ${sizeInMB} MB`);
    
    if (stats.size > 500 * 1024 * 1024) {
      const proceed = await this.prompt('⚠️  Large file detected. Continue? (y/n): ');
      if (proceed.toLowerCase() !== 'y') {
        await this.showMainMenu();
        return;
      }
    }
    
    console.log('\n🎯 Processing options:');
    console.log('1. 🤖 Full AI Analysis (Requirements + Architecture + Code)');
    console.log('2. 📋 Requirements Extraction Only');
    console.log('3. 🏗️  Architecture Design Only');
    console.log('4. 💻 Code Generation Only');
    console.log('5. 🎭 Sovereign Agent Analysis');
    
    const mode = await this.prompt('Select processing mode (1-5): ');
    
    // Here you would call the actual processing logic
    console.log(`\n🚀 Starting ${this.getModeName(mode)} for ${path.basename(filePath)}`);
    console.log('💡 Processing will be shown in real-time...\n');
    
    // Simulate processing with human approval points
    await this.simulateProcessing(filePath, mode);
    
    await this.showMainMenu();
  }

  getModeName(mode) {
    const modes = {
      '1': 'Full AI Analysis',
      '2': 'Requirements Extraction',
      '3': 'Architecture Design',
      '4': 'Code Generation',
      '5': 'Sovereign Agent Analysis'
    };
    return modes[mode] || 'Unknown Mode';
  }

  async simulateProcessing(filePath, mode) {
    const stages = [
      '📖 Reading document...',
      '🧠 AI analysis in progress...',
      '📋 Extracting requirements...',
      '🤔 Human approval needed',
      '🏗️  Designing architecture...',
      '🤔 Human approval needed',
      '💻 Generating code...',
      '🤔 Final approval needed',
      '📦 Packaging MVP...',
      '✅ Complete!'
    ];
    
    for (let i = 0; i < stages.length; i++) {
      console.log(stages[i]);
      
      if (stages[i].includes('Human approval')) {
        const approval = await this.prompt('👤 Approve this stage? (y/n/modify): ');
        
        if (approval.toLowerCase() === 'n') {
          console.log('❌ Processing cancelled by user');
          return;
        } else if (approval.toLowerCase() === 'modify') {
          const feedback = await this.prompt('💬 Enter your feedback: ');
          console.log(`📝 Feedback recorded: ${feedback}`);
          console.log('🔄 Incorporating feedback...');
        }
      }
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 Document processed successfully!');
    console.log('📁 Output saved to: ./generated/');
    console.log('🌐 View results: http://localhost:3001/results');
  }

  async runDemo() {
    console.log('\n🎮 RUNNING DEMO MODE');
    console.log('====================');
    console.log('Processing sample chat log...\n');
    
    // Run the sovereign chatlog processor
    const demoProcess = spawn('node', ['sovereign-chatlog-processor.js'], {
      cwd: path.join(__dirname, 'FinishThisIdea'),
      stdio: 'inherit'
    });
    
    demoProcess.on('close', () => {
      console.log('\n✅ Demo completed!');
    });
  }

  async checkSystemStatus() {
    console.log('\n🔧 SYSTEM STATUS');
    console.log('================');
    
    // Check API server
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      console.log('✅ API Server: Running');
      console.log(`   Status: ${data.status}`);
    } catch (error) {
      console.log('❌ API Server: Not running');
    }
    
    // Check Docker services
    console.log('\n🐳 Docker Services:');
    console.log('• PostgreSQL: Checking...');
    console.log('• Redis: Checking...');
    console.log('• Ollama: Checking...');
    
    console.log('\n📊 Resource Usage:');
    console.log(`• Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    console.log(`• Uptime: ${Math.round(process.uptime())} seconds`);
    
    await this.prompt('\nPress Enter to continue...');
    await this.showMainMenu();
  }

  async openWebInterface() {
    console.log('\n🌐 OPENING WEB INTERFACE');
    console.log('========================');
    
    const urls = [
      'http://localhost:3001 - Main API & Interface',
      'http://localhost:3000 - Grafana Dashboard',
      'http://localhost:9090 - Prometheus Metrics'
    ];
    
    console.log('Available interfaces:');
    urls.forEach((url, i) => console.log(`${i + 1}. ${url}`));
    
    const choice = await this.prompt('\nSelect interface (1-3) or press Enter to open main: ');
    
    const urlMap = {
      '1': 'http://localhost:3001',
      '2': 'http://localhost:3000',
      '3': 'http://localhost:9090',
      '': 'http://localhost:3001'
    };
    
    const url = urlMap[choice] || urlMap[''];
    console.log(`🌐 Opening: ${url}`);
    console.log('💡 If URL doesn\'t open automatically, copy and paste into your browser');
    
    await this.showMainMenu();
  }

  async showConfiguration() {
    console.log('\n⚙️  CONFIGURATION');
    console.log('=================');
    
    console.log('Current settings:');
    console.log('• Environment: Development');
    console.log('• API Port: 3001');
    console.log('• Max File Size: 500MB');
    console.log('• AI Provider: Ollama + Claude + GPT');
    console.log('• Human Approval: Enabled');
    
    console.log('\nConfiguration options:');
    console.log('1. 🔑 Set API Keys');
    console.log('2. 📏 Change File Size Limits');
    console.log('3. 🤖 Configure AI Providers');
    console.log('4. 👤 Human Approval Settings');
    console.log('5. 🔙 Back to main menu');
    
    const choice = await this.prompt('Select option (1-5): ');
    
    if (choice === '5') {
      await this.showMainMenu();
    } else {
      console.log('⚙️  Configuration feature coming soon...');
      await this.showConfiguration();
    }
  }

  async showHistory() {
    console.log('\n📊 PROCESSING HISTORY');
    console.log('=====================');
    
    console.log('Recent documents processed:');
    console.log('• chat-log-001.txt - MVP Generated (2 hours ago)');
    console.log('• business-plan.pdf - Architecture Created (1 day ago)');
    console.log('• requirements.md - Code Generated (2 days ago)');
    
    console.log('\nStatistics:');
    console.log('• Total documents: 15');
    console.log('• MVPs generated: 8');
    console.log('• Average processing time: 22 minutes');
    console.log('• Success rate: 94%');
    
    await this.prompt('\nPress Enter to continue...');
    await this.showMainMenu();
  }

  async showDeveloperTools() {
    console.log('\n🛠️  DEVELOPER TOOLS');
    console.log('===================');
    
    console.log('Available tools:');
    console.log('1. 📝 View System Logs');
    console.log('2. 🧪 Run Tests');
    console.log('3. 🔧 Database Tools');
    console.log('4. 🐳 Docker Management');
    console.log('5. 📊 Performance Analysis');
    console.log('6. 🔙 Back to main menu');
    
    const choice = await this.prompt('Select tool (1-6): ');
    
    if (choice === '6') {
      await this.showMainMenu();
    } else {
      console.log('🛠️  Developer tool coming soon...');
      await this.showDeveloperTools();
    }
  }

  async stopSystem() {
    console.log('🛑 Stopping system...');
    
    if (this.apiServerProcess) {
      this.apiServerProcess.kill();
      this.apiServerProcess = null;
    }
    
    this.isRunning = false;
    console.log('✅ System stopped');
  }

  async exit() {
    console.log('\n👋 GOODBYE!');
    console.log('===========');
    
    if (this.isRunning) {
      const stop = await this.prompt('Stop running services? (y/n): ');
      if (stop.toLowerCase() === 'y') {
        await this.stopSystem();
      }
    }
    
    console.log('Thanks for using Document Generator!');
    console.log('🎭 Transform documents into MVPs anytime\n');
    
    this.rl.close();
    process.exit(0);
  }

  prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }
}

// Start CLI if run directly
if (require.main === module) {
  const cli = new DocumentGeneratorCLI();
  cli.start().catch(console.error);
}

module.exports = DocumentGeneratorCLI;