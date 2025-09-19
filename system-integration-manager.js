#!/usr/bin/env node

/**
 * SYSTEM INTEGRATION MANAGER
 * Manages system lifecycle and prevents circular dependencies
 * Provides centralized system registry and dependency injection
 */

const EventEmitter = require('events');

class SystemIntegrationManager extends EventEmitter {
  constructor() {
    super();
    
    // System registry - single instances
    this.systems = new Map();
    this.systemStatus = new Map();
    this.initializationOrder = [];
    this.dependencyGraph = new Map();
    
    // System state tracking
    this.state = {
      initializing: false,
      ready: false,
      errors: [],
      startTime: null
    };
    
    console.log('🔧 SYSTEM INTEGRATION MANAGER INITIALIZED');
    console.log('🏗️ Centralized system lifecycle and dependency management');
    console.log('🔄 Prevents circular dependencies and manages shared instances');
  }
  
  /**
   * Register a system class with its dependencies
   */
  registerSystem(name, SystemClass, dependencies = [], config = {}) {
    if (this.systems.has(name)) {
      console.log(`⚠️ System ${name} already registered, skipping`);
      return;
    }
    
    this.dependencyGraph.set(name, {
      SystemClass,
      dependencies,
      config,
      instance: null,
      status: 'registered'
    });
    
    console.log(`📦 Registered system: ${name} (deps: ${dependencies.join(', ') || 'none'})`);
  }
  
  /**
   * Get or create a system instance
   */
  getSystem(name) {
    if (this.systems.has(name)) {
      return this.systems.get(name);
    }
    
    if (!this.dependencyGraph.has(name)) {
      throw new Error(`System ${name} not registered`);
    }
    
    const systemInfo = this.dependencyGraph.get(name);
    if (systemInfo.instance) {
      return systemInfo.instance;
    }
    
    // Create instance if not exists
    return this.initializeSystem(name);
  }
  
  /**
   * Initialize a single system
   */
  initializeSystem(name) {
    if (this.systems.has(name)) {
      return this.systems.get(name);
    }
    
    const systemInfo = this.dependencyGraph.get(name);
    if (!systemInfo) {
      throw new Error(`System ${name} not registered`);
    }
    
    if (systemInfo.status === 'initializing') {
      throw new Error(`Circular dependency detected for system ${name}`);
    }
    
    try {
      console.log(`🚀 Initializing system: ${name}`);
      systemInfo.status = 'initializing';
      
      // Initialize dependencies first
      const dependencies = {};
      for (const depName of systemInfo.dependencies) {
        dependencies[depName] = this.getSystem(depName);
      }
      
      // Create instance with dependency injection
      const instance = new systemInfo.SystemClass(dependencies, systemInfo.config);
      
      // Store instance
      this.systems.set(name, instance);
      systemInfo.instance = instance;
      systemInfo.status = 'ready';
      
      console.log(`✅ System ready: ${name}`);
      this.emit('systemReady', name, instance);
      
      return instance;
      
    } catch (error) {
      systemInfo.status = 'error';
      console.error(`❌ Failed to initialize ${name}:`, error.message);
      this.state.errors.push({ system: name, error: error.message });
      throw error;
    }
  }
  
  /**
   * Initialize all systems in dependency order
   */
  async initializeAll() {
    if (this.state.initializing) {
      console.log('⏳ Systems already initializing...');
      return;
    }
    
    console.log('🔧 Starting system initialization...');
    this.state.initializing = true;
    this.state.startTime = Date.now();
    
    try {
      // Resolve dependency order
      const order = this.resolveDependencyOrder();
      console.log(`📋 Initialization order: ${order.join(' → ')}`);
      
      // Initialize systems in order
      for (const systemName of order) {
        if (!this.systems.has(systemName)) {
          this.initializeSystem(systemName);
        }
      }
      
      this.state.ready = true;
      this.state.initializing = false;
      
      const duration = Date.now() - this.state.startTime;
      console.log(`✅ All systems initialized in ${duration}ms`);
      this.emit('allSystemsReady', this.systems);
      
    } catch (error) {
      this.state.initializing = false;
      console.error('❌ System initialization failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Resolve dependency order using topological sort
   */
  resolveDependencyOrder() {
    const graph = new Map();
    const inDegree = new Map();
    
    // Build graph and calculate in-degrees
    for (const [name, info] of this.dependencyGraph) {
      graph.set(name, info.dependencies);
      inDegree.set(name, 0);
    }
    
    for (const [name, deps] of graph) {
      for (const dep of deps) {
        if (!graph.has(dep)) {
          throw new Error(`Dependency ${dep} for ${name} not registered`);
        }
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      }
    }
    
    // Topological sort
    const queue = [];
    const result = [];
    
    for (const [name, degree] of inDegree) {
      if (degree === 0) {
        queue.push(name);
      }
    }
    
    while (queue.length > 0) {
      const current = queue.shift();
      result.push(current);
      
      const deps = graph.get(current) || [];
      for (const dep of deps) {
        inDegree.set(dep, inDegree.get(dep) - 1);
        if (inDegree.get(dep) === 0) {
          queue.push(dep);
        }
      }
    }
    
    if (result.length !== graph.size) {
      throw new Error('Circular dependency detected in system graph');
    }
    
    return result.reverse(); // Dependencies first
  }
  
  /**
   * Get system status report
   */
  getStatus() {
    const status = {
      manager: {
        ready: this.state.ready,
        initializing: this.state.initializing,
        errors: this.state.errors.length,
        uptime: this.state.startTime ? Date.now() - this.state.startTime : 0
      },
      systems: {}
    };
    
    for (const [name, info] of this.dependencyGraph) {
      status.systems[name] = {
        status: info.status,
        hasInstance: !!info.instance,
        dependencies: info.dependencies
      };
    }
    
    return status;
  }
  
  /**
   * Shutdown all systems
   */
  async shutdown() {
    console.log('🛑 Shutting down systems...');
    
    for (const [name, system] of this.systems) {
      try {
        if (typeof system.shutdown === 'function') {
          await system.shutdown();
        }
        console.log(`✅ Shutdown: ${name}`);
      } catch (error) {
        console.error(`❌ Failed to shutdown ${name}:`, error.message);
      }
    }
    
    this.systems.clear();
    this.state.ready = false;
    console.log('✅ All systems shutdown complete');
  }
  
  /**
   * Register common systems with proper dependencies
   */
  registerCommonSystems() {
    // Load system classes
    const DebitOnlyEconomicController = require('./debit-only-economic-controller.js');
    const BrandIdentityTaggingSystem = require('./brand-identity-tagging-system.js');
    const TagSignatureVerificationSystem = require('./tag-signature-verification-system.js');
    const TokenGravitySystem = require('./token-gravity-reinforcement-system.js');
    const GamifiedTippingAppreciationSystem = require('./gamified-tipping-appreciation-system.js');
    const CharacterBreedingEvolutionSystem = require('./character-breeding-evolution-system.js');
    const AppreciationCommunityBridge = require('./appreciation-community-bridge.js');
    const CharacterLineageTracker = require('./character-lineage-tracker.js');
    const GeneticCharacterVisualizer = require('./genetic-character-visualizer.js');
    
    // Register systems with dependencies
    this.registerSystem('debitController', DebitOnlyEconomicController, []);
    this.registerSystem('brandSystem', BrandIdentityTaggingSystem, []);
    this.registerSystem('tagVerification', TagSignatureVerificationSystem, ['brandSystem']);
    this.registerSystem('tokenGravity', TokenGravitySystem, ['debitController', 'brandSystem', 'tagVerification']);
    this.registerSystem('tippingSystem', GamifiedTippingAppreciationSystem, ['debitController', 'brandSystem', 'tagVerification', 'tokenGravity']);
    this.registerSystem('breedingSystem', CharacterBreedingEvolutionSystem, ['tippingSystem']);
    this.registerSystem('communityBridge', AppreciationCommunityBridge, ['tippingSystem', 'breedingSystem']);
    this.registerSystem('lineageTracker', CharacterLineageTracker, ['breedingSystem', 'communityBridge']);
    this.registerSystem('visualizer', GeneticCharacterVisualizer, ['breedingSystem']);
    
    console.log('📦 Common systems registered with dependency graph');
  }
}

// Export class
module.exports = SystemIntegrationManager;

// If run directly, start the integration manager
if (require.main === module) {
  async function main() {
    try {
      const manager = new SystemIntegrationManager();
      
      // Register systems
      manager.registerCommonSystems();
      
      // Initialize all systems
      await manager.initializeAll();
      
      // Show status
      console.log('\n📊 SYSTEM STATUS REPORT:');
      console.log(JSON.stringify(manager.getStatus(), null, 2));
      
      // Wait for user input before shutdown
      console.log('\nPress Ctrl+C to shutdown...');
      process.on('SIGINT', async () => {
        await manager.shutdown();
        process.exit(0);
      });
      
    } catch (error) {
      console.error('❌ Integration manager failed:', error.message);
      process.exit(1);
    }
  }
  
  main().catch(console.error);
}