#!/usr/bin/env node

/**
 * BASH SYSTEM - Main Entry Point
 * Export all components for use as a dependency
 * Complete 23-layer orchestration platform
 */

const BashSystemIntegration = require('./bash-system-integration');
const BrainLayer = require('./layer-23-brain-layer');
const UnifiedCharacterTool = require('./unified-character-tool');
const MasterExecutor = require('./execute-bash-system');
const SystemConnectionTester = require('./test-system-connections');

// Main BashSystem class for easy instantiation
class BashSystem {
  constructor(options = {}) {
    this.options = {
      port: 3001,
      autoStart: false,
      dashboard: true,
      ...options
    };
    
    this.components = {
      integration: null,
      brain: null,
      characters: null,
      executor: null
    };
    
    this.status = 'initialized';
  }

  // Initialize all components
  async initialize() {
    console.log('🚀 Initializing Bash System...');
    
    this.components.brain = new BrainLayer();
    this.components.integration = new BashSystemIntegration();
    this.components.characters = new UnifiedCharacterTool();
    this.components.executor = new MasterExecutor();
    
    this.status = 'ready';
    console.log('✅ Bash System initialized and ready');
    
    return this;
  }

  // Start the complete system
  async start() {
    if (this.status !== 'ready') {
      await this.initialize();
    }
    
    console.log('🎯 Starting complete Bash System...');
    await this.components.executor.executeFullSystem();
    
    this.status = 'running';
    return this;
  }

  // Get system status
  getStatus() {
    return {
      status: this.status,
      components: {
        brain: this.components.brain ? 'active' : 'inactive',
        integration: this.components.integration ? 'active' : 'inactive',
        characters: this.components.characters ? 'active' : 'inactive',
        executor: this.components.executor ? 'active' : 'inactive'
      },
      api: `http://localhost:${this.options.port}`,
      dashboard: this.options.dashboard ? 'system-dashboard.html' : 'disabled'
    };
  }

  // Execute character command
  async executeCharacterCommand(character, command, message) {
    if (!this.components.integration) {
      throw new Error('System not initialized. Call initialize() first.');
    }
    
    return this.components.integration.executeCharacterCommand(character, command, message);
  }

  // Test system connections
  async test() {
    const tester = new SystemConnectionTester();
    return tester.runAllTests();
  }

  // Stop the system
  async stop() {
    console.log('🛑 Stopping Bash System...');
    this.status = 'stopped';
    console.log('✅ Bash System stopped');
  }
}

// Export individual components and main class
module.exports = {
  // Main class
  BashSystem,
  
  // Individual components
  BashSystemIntegration,
  BrainLayer,
  UnifiedCharacterTool,
  MasterExecutor,
  SystemConnectionTester,
  
  // Convenience functions
  async create(options) {
    const system = new BashSystem(options);
    await system.initialize();
    return system;
  },
  
  async start(options) {
    const system = new BashSystem(options);
    await system.start();
    return system;
  },
  
  // Character helpers
  characters: {
    ralph: (message) => ({ character: 'ralph', command: 'bash', message }),
    alice: (message) => ({ character: 'alice', command: 'analyze', message }),
    bob: (message) => ({ character: 'bob', command: 'build', message }),
    charlie: (message) => ({ character: 'charlie', command: 'secure', message }),
    diana: (message) => ({ character: 'diana', command: 'orchestrate', message }),
    eve: (message) => ({ character: 'eve', command: 'learn', message }),
    frank: (message) => ({ character: 'frank', command: 'unify', message })
  }
};

// If run directly, start the system
if (require.main === module) {
  const system = new BashSystem();
  system.start().catch(console.error);
}