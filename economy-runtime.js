#!/usr/bin/env node

/**
 * ECONOMY RUNTIME - The substrate that runs everything
 * Executes Product, Business, Truth economies + Bus
 */

const EventEmitter = require('events');
const fs = require('fs');

console.log('⚡ ECONOMY RUNTIME - SUBSTRATE LAYER');
console.log('===================================');

class EconomyRuntime extends EventEmitter {
  constructor() {
    super();
    
    this.state = 'initializing';
    this.startTime = Date.now();
    
    // Runtime components
    this.components = {
      bus: null,
      productEconomy: null,
      businessEconomy: null,
      truthEconomy: null
    };
    
    // Runtime stats
    this.stats = {
      uptime: 0,
      messages_processed: 0,
      economies_running: 0,
      conflicts_resolved: 0,
      executions_completed: 0
    };
    
    // Execution queue
    this.executionQueue = [];
    this.isExecuting = false;
  }

  async start() {
    console.log('⚡ Starting Economy Runtime...');
    this.state = 'starting';
    
    try {
      // Phase 1: Load components
      await this.loadComponents();
      
      // Phase 2: Initialize bus
      await this.initializeBus();
      
      // Phase 3: Start economies
      await this.startEconomies();
      
      // Phase 4: Connect everything
      await this.connectEconomies();
      
      // Phase 5: Start execution loop
      await this.startExecutionLoop();
      
      this.state = 'running';
      console.log('✅ Economy Runtime started successfully');
      
      // Run initial test
      await this.runInitialTest();
      
    } catch (error) {
      console.error('💥 Runtime startup failed:', error.message);
      this.state = 'failed';
    }
  }

  async loadComponents() {
    console.log('📦 Loading components...');
    
    try {
      const EconomyBus = require('./economy-bus.js');
      const FlagModeHooks = require('./flag-mode-hooks.js');
      const TruthEconomy = require('./truth-economy.js');
      
      // Create instances
      this.components.bus = new EconomyBus();
      this.components.productEconomy = new FlagModeHooks();
      this.components.truthEconomy = new TruthEconomy();
      
      // Mock business economy
      this.components.businessEconomy = this.createBusinessEconomy();
      
      console.log('✅ All components loaded');
      
    } catch (error) {
      console.error('❌ Component loading failed:', error.message);
      throw error;
    }
  }

  createBusinessEconomy() {
    const businessEconomy = new EventEmitter();
    
    businessEconomy.state = {
      compliance: 95,
      revenue: 0,
      costs: 0,
      legal_status: 'active'
    };
    
    businessEconomy.processMessage = (message) => {
      console.log(`🏢 Business processing: ${message.event}`);
      
      if (message.event === 'user_signup') {
        businessEconomy.state.compliance -= 0.1; // Slight compliance cost
        businessEconomy.emit('compliance_change', { impact: -0.1 });
      }
      
      if (message.event === 'revenue_increase') {
        businessEconomy.state.revenue += message.data.amount;
        businessEconomy.emit('financial_update', { revenue: businessEconomy.state.revenue });
      }
    };
    
    return businessEconomy;
  }

  async initializeBus() {
    console.log('🚌 Initializing bus...');
    
    this.components.bus.startBus();
    
    // Set up bus event handlers
    this.components.bus.on('economy_connected', (data) => {
      console.log(`🔌 ${data.economy} connected to bus`);
      this.stats.economies_running++;
    });
    
    this.components.bus.on('message_processed', () => {
      this.stats.messages_processed++;
    });
    
    console.log('✅ Bus initialized');
  }

  async startEconomies() {
    console.log('🏭 Starting economies...');
    
    // Start Product Economy
    console.log('🚀 Starting Product Economy...');
    this.components.productEconomy.setFlag('DUAL_ECONOMY_ENABLED', true);
    this.components.productEconomy.setFlag('RUNTIME_MODE', true);
    
    // Start Truth Economy
    console.log('⚖️ Starting Truth Economy...');
    // Truth economy is already initialized
    
    // Business economy is already running (mock)
    console.log('🏢 Business Economy ready');
    
    console.log('✅ All economies started');
  }

  async connectEconomies() {
    console.log('🔗 Connecting economies to bus...');
    
    const bus = this.components.bus;
    
    // Connect Product Economy
    bus.connectEconomy('product', this.components.productEconomy);
    
    // Connect Business Economy
    bus.connectEconomy('business', this.components.businessEconomy);
    
    // Connect Truth Economy
    bus.connectEconomy('truth', this.components.truthEconomy);
    
    // Set up cross-economy event handlers
    this.setupCrossEconomyHandlers();
    
    console.log('✅ All economies connected');
  }

  setupCrossEconomyHandlers() {
    const { productEconomy, businessEconomy, truthEconomy, bus } = this.components;
    
    // Product Economy events
    productEconomy.on('user_signup', (data) => {
      bus.sendMessage('product', 'business', 'event', 'user_signup', data);
    });
    
    productEconomy.on('revenue_increase', (data) => {
      bus.sendMessage('product', 'business', 'event', 'revenue_increase', data);
    });
    
    // Business Economy events
    businessEconomy.on('compliance_change', (data) => {
      bus.sendMessage('business', 'product', 'event', 'compliance_change', data);
    });
    
    // Truth Economy conflict resolution
    truthEconomy.on('conflict_resolved', (data) => {
      bus.sendMessage('truth', 'broadcast', 'resolution', 'conflict_resolved', data);
    });
    
    // Bus message routing
    bus.on('bus_message', (message) => {
      this.handleBusMessage(message);
    });
  }

  handleBusMessage(message) {
    console.log(`📨 Bus message: ${message.from} -> ${message.to} | ${message.event}`);
    
    // Route to appropriate economy
    const targetEconomy = this.components[`${message.to}Economy`];
    if (targetEconomy && targetEconomy.processMessage) {
      targetEconomy.processMessage(message);
    }
  }

  async startExecutionLoop() {
    console.log('🔄 Starting execution loop...');
    
    // Main execution loop
    setInterval(() => {
      this.executeNextTask();
      this.updateStats();
    }, 1000);
    
    // Periodic health check
    setInterval(() => {
      this.healthCheck();
    }, 5000);
    
    console.log('✅ Execution loop started');
  }

  executeNextTask() {
    if (this.executionQueue.length > 0 && !this.isExecuting) {
      this.isExecuting = true;
      
      const task = this.executionQueue.shift();
      this.executeTask(task);
      
      this.isExecuting = false;
    }
  }

  async executeTask(task) {
    console.log(`⚡ Executing: ${task.type}`);
    
    try {
      switch (task.type) {
        case 'simulate_user':
          this.simulateUser();
          break;
        case 'generate_revenue':
          this.generateRevenue();
          break;
        case 'run_compliance_check':
          this.runComplianceCheck();
          break;
        case 'resolve_conflict':
          this.resolveConflict(task.data);
          break;
        default:
          console.log(`❓ Unknown task type: ${task.type}`);
      }
      
      this.stats.executions_completed++;
      
    } catch (error) {
      console.error(`❌ Task execution failed: ${error.message}`);
    }
  }

  simulateUser() {
    const userData = {
      email: `user${Date.now()}@example.com`,
      plan: Math.random() < 0.3 ? 'premium' : 'free'
    };
    
    this.components.productEconomy.emit('user_signup', userData);
  }

  generateRevenue() {
    const amount = Math.floor(Math.random() * 100) + 10;
    
    this.components.productEconomy.emit('revenue_increase', {
      amount,
      source: 'subscription'
    });
  }

  runComplianceCheck() {
    const complianceData = {
      type: 'GDPR_check',
      result: Math.random() > 0.1 ? 'passed' : 'failed',
      impact: Math.random() > 0.5 ? 1 : -1
    };
    
    this.components.businessEconomy.emit('compliance_change', complianceData);
  }

  resolveConflict(conflictData) {
    console.log('⚔️ Resolving conflict via Truth Economy...');
    
    this.components.truthEconomy.emit('conflict_resolution', {
      conflict: conflictData,
      resolution: 'truth_economy_decision',
      timestamp: Date.now()
    });
    
    this.stats.conflicts_resolved++;
  }

  updateStats() {
    this.stats.uptime = Date.now() - this.startTime;
  }

  healthCheck() {
    const busStatus = this.components.bus.getBusStatus();
    
    console.log(`💓 Health: ${this.state} | Economies: ${busStatus.connected_economies.length}/3 | Messages: ${busStatus.total_messages}`);
  }

  async runInitialTest() {
    console.log('\n🧪 Running initial runtime test...');
    
    // Queue some test tasks
    this.queueTask('simulate_user');
    this.queueTask('generate_revenue');
    this.queueTask('run_compliance_check');
    
    // Let them execute
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📊 Runtime Test Results:');
    console.log(`  State: ${this.state}`);
    console.log(`  Uptime: ${this.stats.uptime}ms`);
    console.log(`  Messages: ${this.stats.messages_processed}`);
    console.log(`  Executions: ${this.stats.executions_completed}`);
    console.log(`  Economies: ${this.stats.economies_running}/3`);
    
    console.log('\n✅ Initial test completed');
  }

  queueTask(type, data = {}) {
    this.executionQueue.push({ type, data, timestamp: Date.now() });
    console.log(`📋 Task queued: ${type}`);
  }

  getStatus() {
    return {
      state: this.state,
      uptime: this.stats.uptime,
      components: Object.keys(this.components).map(key => ({
        name: key,
        loaded: this.components[key] !== null
      })),
      stats: this.stats,
      queue_length: this.executionQueue.length
    };
  }

  async shutdown() {
    console.log('🛑 Shutting down Economy Runtime...');
    
    this.state = 'shutting_down';
    
    // Save final stats
    const finalReport = {
      shutdown_time: new Date().toISOString(),
      final_state: this.state,
      total_uptime: this.stats.uptime,
      final_stats: this.stats
    };
    
    fs.writeFileSync('./runtime-final-report.json', JSON.stringify(finalReport, null, 2));
    
    console.log('💾 Final report saved');
    console.log('✅ Economy Runtime shutdown complete');
  }
}

// Execute runtime
async function main() {
  const runtime = new EconomyRuntime();
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    await runtime.shutdown();
    process.exit(0);
  });
  
  // Start the runtime
  await runtime.start();
  
  // Keep running
  console.log('\n⚡ Economy Runtime is now running...');
  console.log('📊 Status updates every 5 seconds');
  console.log('🛑 Press Ctrl+C to shutdown\n');
  
  // Periodic status updates
  setInterval(() => {
    const status = runtime.getStatus();
    console.log(`📊 Runtime Status: ${status.state} | Uptime: ${Math.floor(status.uptime/1000)}s | Queue: ${status.queue_length}`);
  }, 10000);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EconomyRuntime;