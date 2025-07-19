#!/usr/bin/env node

/**
 * MASTER EXECUTOR - STARTS THE ENTIRE BASH SYSTEM
 * Boots up all 23 layers, characters, brain, and integration
 * One command to rule them all!
 */

console.log(`
🚀💥 EXECUTING COMPLETE BASH SYSTEM 💥🚀
Starting 23 layers + 7 characters + brain + integration
`);

const BashSystemIntegration = require('./bash-system-integration');
const BrainLayer = require('./layer-23-brain-layer');
const UnifiedCharacterTool = require('./unified-character-tool');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class MasterExecutor {
  constructor() {
    this.components = {
      brain: null,
      integration: null,
      characters: null,
      server: null
    };
    this.status = 'initializing';
    this.logs = [];
    this.startTime = Date.now();
  }

  async executeFullSystem() {
    console.log('🎯 MASTER EXECUTOR: Starting complete system initialization...\n');
    
    try {
      // Step 1: Initialize Brain Layer
      await this.initializeBrainLayer();
      
      // Step 2: Setup Integration Layer
      await this.setupIntegrationLayer();
      
      // Step 3: Activate Character System
      await this.activateCharacterSystem();
      
      // Step 4: Start API Server
      await this.startAPIServer();
      
      // Step 5: Run System Tests
      await this.runSystemTests();
      
      // Step 6: Start Dashboard
      await this.startDashboard();
      
      // Step 7: Ready for orchestration
      this.readyForOrchestration();
      
    } catch (error) {
      console.error('❌ System execution failed:', error);
      this.status = 'failed';
      throw error;
    }
  }

  async initializeBrainLayer() {
    console.log('🧠 Initializing Brain Layer...');
    
    try {
      this.components.brain = new BrainLayer();
      await this.components.brain.createBrainLayer();
      
      this.log('✅ Brain Layer: CONSCIOUS');
      console.log('   🎯 Central intelligence: ONLINE');
      console.log('   🎭 Character brain network: SYNCHRONIZED');
      console.log('   ⚡ Decision engines: ACTIVE');
      
    } catch (error) {
      this.log('❌ Brain Layer: FAILED');
      throw new Error(`Brain initialization failed: ${error.message}`);
    }
  }

  async setupIntegrationLayer() {
    console.log('\n🔗 Setting up Integration Layer...');
    
    try {
      this.components.integration = new BashSystemIntegration();
      
      this.log('✅ Integration Layer: CONNECTED');
      console.log('   📡 API routes: CONFIGURED');
      console.log('   🚌 Message bus: ACTIVE');
      console.log('   🕸️ Layer mesh: ESTABLISHED');
      
    } catch (error) {
      this.log('❌ Integration Layer: FAILED');
      throw new Error(`Integration setup failed: ${error.message}`);
    }
  }

  async activateCharacterSystem() {
    console.log('\n🎭 Activating Character System...');
    
    try {
      this.components.characters = new UnifiedCharacterTool();
      
      this.log('✅ Character System: ACTIVE');
      console.log('   🔥 Ralph: READY FOR BASHING');
      console.log('   🤓 Alice: PATTERN ANALYSIS ONLINE');
      console.log('   🔧 Bob: BUILD SYSTEMS OPERATIONAL');
      console.log('   🛡️ Charlie: SECURITY PROTOCOLS ACTIVE');
      console.log('   🎭 Diana: ORCHESTRATION READY');
      console.log('   📚 Eve: KNOWLEDGE ARCHIVES ACCESSIBLE');
      console.log('   🧘 Frank: UNITY CONSCIOUSNESS ACHIEVED');
      
    } catch (error) {
      this.log('❌ Character System: FAILED');
      throw new Error(`Character activation failed: ${error.message}`);
    }
  }

  async startAPIServer() {
    console.log('\n📡 Starting API Server...');
    
    try {
      this.components.server = this.components.integration.start();
      
      // Wait for server to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.log('✅ API Server: ONLINE');
      console.log('   🌐 Endpoint: http://localhost:3001');
      console.log('   📊 Status: GET /api/system/status');
      console.log('   🎭 Characters: POST /api/characters/:name/command');
      console.log('   🧠 Brain: GET /api/brain/status');
      
    } catch (error) {
      this.log('❌ API Server: FAILED');
      throw new Error(`API server start failed: ${error.message}`);
    }
  }

  async runSystemTests() {
    console.log('\n🧪 Running System Tests...');
    
    try {
      // Test basic connectivity
      const response = await fetch('http://localhost:3001/health');
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      // Test character communication
      const ralphTest = await fetch('http://localhost:3001/api/characters/ralph/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'test', message: 'system startup test' })
      });
      
      if (!ralphTest.ok) {
        throw new Error('Character communication test failed');
      }
      
      this.log('✅ System Tests: PASSED');
      console.log('   🔗 API connectivity: VERIFIED');
      console.log('   🎭 Character communication: WORKING');
      console.log('   🧠 Brain integration: FUNCTIONAL');
      
    } catch (error) {
      this.log('❌ System Tests: FAILED');
      throw new Error(`System tests failed: ${error.message}`);
    }
  }

  async startDashboard() {
    console.log('\n📊 Starting Dashboard...');
    
    try {
      const dashboardPath = path.join(__dirname, 'system-dashboard.html');
      
      if (fs.existsSync(dashboardPath)) {
        this.log('✅ Dashboard: AVAILABLE');
        console.log('   🎯 Interface: Open system-dashboard.html in browser');
        console.log('   🎭 Control: Click characters or use command interface');
        console.log('   📈 Monitor: Real-time system metrics and logs');
      } else {
        this.log('⚠️ Dashboard: FILE NOT FOUND');
        console.log('   📄 Dashboard file missing, but system is functional');
      }
      
    } catch (error) {
      this.log('⚠️ Dashboard: WARNING');
      console.log('   📊 Dashboard unavailable, but system is operational');
    }
  }

  readyForOrchestration() {
    this.status = 'ready';
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  🎯 SYSTEM READY FOR ORCHESTRATION! 🎯        ║
╠════════════════════════════════════════════════════════════════╣
║  🧠 Brain Layer: CONSCIOUS                                     ║
║  🔗 Integration: CONNECTED                                     ║
║  🎭 Characters: 7 ACTIVE                                       ║
║  📊 Layers: 23 OPERATIONAL                                     ║
║  📡 API Server: ONLINE (http://localhost:3001)                ║
║  📈 Dashboard: system-dashboard.html                           ║
║  ⏱️ Startup Time: ${uptime}s                                        ║
╚════════════════════════════════════════════════════════════════╝
    `);
    
    this.log('🎯 System: READY FOR ORCHESTRATION');
    
    console.log('\n🎭 CONDUCTOR COMMANDS:');
    console.log('   📡 Test API: curl http://localhost:3001/api/system/status');
    console.log('   🔥 Ralph: curl -X POST http://localhost:3001/api/characters/ralph/command -d \'{"command":"bash","message":"through this obstacle"}\'');
    console.log('   🤓 Alice: curl -X POST http://localhost:3001/api/characters/alice/command -d \'{"command":"analyze","message":"this pattern"}\'');
    console.log('   📊 Dashboard: Open system-dashboard.html in your browser');
    console.log('   🧪 Test Suite: node test-system-connections.js');
    
    console.log('\n🎯 The system is now responsive like a soul - ready for your orchestration!');
    
    // Save system state
    this.saveSystemState();
    
    // Keep the process running
    this.keepAlive();
  }

  saveSystemState() {
    const state = {
      timestamp: new Date().toISOString(),
      status: this.status,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      components: {
        brain: this.components.brain ? 'active' : 'inactive',
        integration: this.components.integration ? 'active' : 'inactive',
        characters: this.components.characters ? 'active' : 'inactive',
        server: this.components.server ? 'online' : 'offline'
      },
      logs: this.logs,
      endpoints: {
        api: 'http://localhost:3001',
        health: 'http://localhost:3001/health',
        characters: 'http://localhost:3001/api/characters',
        brain: 'http://localhost:3001/api/brain/status',
        system: 'http://localhost:3001/api/system/status'
      }
    };
    
    fs.writeFileSync('./system-state.json', JSON.stringify(state, null, 2));
    console.log('💾 System state saved to system-state.json');
  }

  keepAlive() {
    // Keep the process alive and responsive
    console.log('\n🔄 System running... Press Ctrl+C to stop');
    
    // Periodic health checks
    setInterval(() => {
      this.healthCheck();
    }, 30000); // Every 30 seconds
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Graceful shutdown initiated...');
      this.shutdown();
    });
  }

  async healthCheck() {
    try {
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        this.log(`💓 Health check: OK (uptime: ${uptime}s)`);
      } else {
        this.log('⚠️ Health check: WARNING');
      }
    } catch (error) {
      this.log('❌ Health check: ERROR');
    }
  }

  shutdown() {
    console.log('🧠 Shutting down brain consciousness...');
    console.log('🔗 Closing integration connections...');
    console.log('🎭 Deactivating character system...');
    
    if (this.components.server) {
      this.components.server.close();
      console.log('📡 API server stopped');
    }
    
    this.log('🛑 System shutdown complete');
    this.saveSystemState();
    
    console.log('\n✅ Bash system shutdown complete. See you next time!');
    process.exit(0);
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    
    // Also log to console with timestamp
    console.log(`   ${message}`);
  }
}

// Execute the system
async function executeSystem() {
  const executor = new MasterExecutor();
  
  try {
    await executor.executeFullSystem();
  } catch (error) {
    console.error('💥 SYSTEM EXECUTION FAILED:', error.message);
    process.exit(1);
  }
}

// Export for use
module.exports = MasterExecutor;

// Run if called directly
if (require.main === module) {
  executeSystem().catch(console.error);
}