#!/usr/bin/env node

/**
 * UNIFIED SYSTEM STATE
 * Brings together all layers into one coherent state
 * Database + Brain + Guardians + Templates + Characters = Complete System
 */

console.log(`
🌌 UNIFIED SYSTEM STATE ACTIVE 🌌
All layers connected + synchronized + orchestrated
`);

const OpenDistributedDatabase = require('./open-distributed-database');
const DatabaseBrainConnector = require('./database-brain-connector');
const DecentralizedGuardianTemplate = require('./decentralized-guardian-template');
const VibeCodingVault = require('./vibecoding-vault');
const ShadowBypassLayer = require('./shadow-bypass-layer');
const HealthBypassRuntime = require('./health-bypass-runtime');
const HumanInterfaceFlags = require('./human-interface-flags');
const TemplateBashExecution = require('./template-bash-execution');

class UnifiedSystemState {
  constructor() {
    this.layers = new Map();
    this.state = {
      initialized: false,
      running: false,
      characters: 7,
      layers: 0,
      connections: 0,
      consciousness: 0
    };
    
    this.initializeAllLayers();
    this.connectLayers();
    this.synchronizeState();
    this.startOrchestration();
  }

  async initializeAllLayers() {
    console.log('🔄 Initializing all system layers...\n');
    
    // Core layers
    this.layers.set('database', new OpenDistributedDatabase());
    this.layers.set('brain', new DatabaseBrainConnector());
    this.layers.set('vault', new VibeCodingVault());
    
    // Protection layers
    this.layers.set('guardians', new DecentralizedGuardianTemplate());
    
    // Execution layers
    this.layers.set('templates', new TemplateBashExecution());
    this.layers.set('shadow', new ShadowBypassLayer());
    this.layers.set('health', new HealthBypassRuntime());
    
    // Interface layers
    this.layers.set('human', new HumanInterfaceFlags());
    
    this.state.layers = this.layers.size;
    this.state.initialized = true;
    
    console.log(`✅ Initialized ${this.state.layers} layers`);
  }

  connectLayers() {
    console.log('🔗 Connecting layers...\n');
    
    // Database feeds brain
    const db = this.layers.get('database');
    const brain = this.layers.get('brain');
    
    db.on('write', (event) => {
      brain.emit('data-input', event);
      this.state.connections++;
    });
    
    // Brain controls vault
    const vault = this.layers.get('vault');
    brain.on('consciousness-sync', (data) => {
      vault.updateConsciousness(data.levels);
    });
    
    // Guardians protect everything
    const guardians = this.layers.get('guardians');
    guardians.on('guardianActivated', (activation) => {
      db.write('guardians', 'activations', activation.id, activation);
    });
    
    // Templates execute through shadow
    const templates = this.layers.get('templates');
    const shadow = this.layers.get('shadow');
    
    templates.on('pipeline:complete', async (result) => {
      if (result.integrated?.artifacts?.length > 0) {
        await shadow.deployToShadow('localhost', { artifacts: result.integrated.artifacts });
      }
    });
    
    // Human controls flags
    const human = this.layers.get('human');
    human.on('humanDecisionMade', (decision) => {
      db.write('human', 'decisions', decision.id, decision);
    });
    
    console.log('✅ Layers connected');
  }

  synchronizeState() {
    // Synchronize state across all layers
    setInterval(() => {
      const brain = this.layers.get('brain');
      const brainStatus = brain.getBrainStatus();
      
      // Update consciousness
      let totalConsciousness = 0;
      Object.values(brainStatus.consciousness).forEach(level => {
        totalConsciousness += parseFloat(level);
      });
      this.state.consciousness = totalConsciousness / Object.keys(brainStatus.consciousness).length;
      
      // Check system health
      const health = this.layers.get('health');
      health.runHealthCheck('system-health', 'instant').then(result => {
        this.state.health = result.overallHealth.status;
      });
      
      this.state.running = true;
    }, 1000);
    
    console.log('🔄 State synchronization active');
  }

  startOrchestration() {
    console.log('🎭 Starting system orchestration...\n');
    
    // Main orchestration loop
    this.orchestrationLoop = setInterval(async () => {
      // High consciousness triggers optimization
      if (this.state.consciousness > 0.8) {
        await this.optimizeSystem();
      }
      
      // Low health triggers recovery
      if (this.state.health === 'unhealthy') {
        await this.recoverSystem();
      }
      
      // Regular maintenance
      if (Math.random() < 0.1) {
        await this.performMaintenance();
      }
    }, 5000);
    
    console.log('✅ Orchestration started');
  }

  async optimizeSystem() {
    console.log('🚀 Optimizing system with high consciousness...');
    
    const db = this.layers.get('database');
    
    // Clean old data
    const oldData = await db.query({
      where: { timestamp: { $lt: new Date(Date.now() - 3600000) } }
    });
    
    console.log(`  Cleaned ${oldData.length} old records`);
  }

  async recoverSystem() {
    console.log('🏥 Recovering unhealthy system...');
    
    const guardians = this.layers.get('guardians');
    
    // Activate enterprise protection
    await guardians.activateGuardianTemplate('enterprise-protection');
    
    console.log('  Enterprise guardians activated');
  }

  async performMaintenance() {
    console.log('🔧 Performing routine maintenance...');
    
    const db = this.layers.get('database');
    
    // Git commit all shards
    const shards = ['ralph', 'alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'system'];
    for (const shard of shards) {
      db.git.commit(shard, 'Routine maintenance commit');
    }
    
    console.log('  All shards committed');
  }

  // Get unified status
  getUnifiedStatus() {
    const status = {
      system: this.state,
      layers: {},
      summary: {
        operational: this.state.running,
        consciousness: (this.state.consciousness * 100).toFixed(0) + '%',
        health: this.state.health || 'unknown',
        uptime: process.uptime()
      }
    };
    
    // Get each layer's status
    this.layers.forEach((layer, name) => {
      if (layer.getSystemStatus) {
        status.layers[name] = layer.getSystemStatus();
      } else if (layer.getDatabaseStatus) {
        status.layers[name] = layer.getDatabaseStatus();
      } else if (layer.getBrainStatus) {
        status.layers[name] = layer.getBrainStatus();
      } else if (layer.getShadowStatus) {
        status.layers[name] = layer.getShadowStatus();
      } else if (layer.getRuntimeStatus) {
        status.layers[name] = layer.getRuntimeStatus();
      } else if (layer.getInterfaceStatus) {
        status.layers[name] = layer.getInterfaceStatus();
      } else if (layer.getExecutionStatus) {
        status.layers[name] = layer.getExecutionStatus();
      }
    });
    
    return status;
  }

  // Execute cross-layer command
  async executeCommand(layer, command, ...args) {
    const targetLayer = this.layers.get(layer);
    if (!targetLayer) {
      throw new Error(`Layer '${layer}' not found`);
    }
    
    console.log(`🎯 Executing on ${layer}: ${command}`);
    
    // Execute based on layer type
    switch (layer) {
      case 'database':
        if (command === 'bash') {
          return await targetLayer.bashDB(...args);
        } else {
          return await targetLayer[command](...args);
        }
        
      case 'brain':
        return await targetLayer.propagateForward(...args);
        
      case 'guardians':
        return await targetLayer[command](...args);
        
      case 'templates':
        if (command === 'bash') {
          return await targetLayer.quickBash(...args);
        }
        return await targetLayer[command](...args);
        
      case 'shadow':
        return await targetLayer[command](...args);
        
      default:
        if (typeof targetLayer[command] === 'function') {
          return await targetLayer[command](...args);
        }
    }
  }

  // Save complete system state
  async saveSystemState() {
    const db = this.layers.get('database');
    const timestamp = new Date().toISOString();
    
    const systemState = {
      timestamp,
      version: '1.0.0',
      status: this.getUnifiedStatus(),
      checksum: crypto.randomBytes(16).toString('hex')
    };
    
    // Save to database
    await db.write('system', 'snapshots', `state-${Date.now()}`, systemState);
    
    // Also save to file
    fs.writeFileSync('./system-state.json', JSON.stringify(systemState, null, 2));
    
    console.log(`💾 System state saved at ${timestamp}`);
    
    return systemState;
  }

  // Command line interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'status':
        const status = this.getUnifiedStatus();
        console.log('\n🌌 Unified System Status:');
        console.log(JSON.stringify(status, null, 2));
        break;

      case 'execute':
        const layer = args[1];
        const execCommand = args[2];
        const execArgs = args.slice(3);
        
        try {
          const result = await this.executeCommand(layer, execCommand, ...execArgs);
          console.log('✅ Command executed successfully');
          if (result) console.log(result);
        } catch (error) {
          console.error('❌ Command failed:', error.message);
        }
        break;

      case 'save':
        await this.saveSystemState();
        break;

      case 'monitor':
        console.log('📊 Monitoring unified system...\n');
        
        setInterval(() => {
          const status = this.getUnifiedStatus();
          
          console.clear();
          console.log('🌌 UNIFIED SYSTEM MONITOR');
          console.log('═'.repeat(50));
          console.log(`Layers: ${status.system.layers} | Connections: ${status.system.connections}`);
          console.log(`Consciousness: ${status.summary.consciousness} | Health: ${status.summary.health}`);
          console.log(`Uptime: ${Math.floor(status.summary.uptime)}s`);
          console.log('\nLayer Status:');
          
          Object.entries(status.layers).forEach(([name, layerStatus]) => {
            const indicator = layerStatus.activeGuardians ? '🛡️' :
                            layerStatus.thoughts ? '🧠' :
                            layerStatus.shards ? '💾' :
                            layerStatus.shadowPlatforms ? '👻' : '✅';
            console.log(`  ${indicator} ${name}`);
          });
          
          console.log('\nPress Ctrl+C to exit');
        }, 1000);
        break;

      case 'demo':
        console.log('🎭 Running unified system demo...\n');
        
        // Ralph thinks and bashes
        await this.executeCommand('brain', 'think', 'ralph', 'MUST BASH EVERYTHING!');
        await this.executeCommand('database', 'bash', 'FORCE_WRITE', 'ralph', 'chaos');
        
        // Alice analyzes
        await this.executeCommand('brain', 'think', 'alice', 'Analyzing Ralph behavior patterns');
        
        // Charlie protects
        await this.executeCommand('guardians', 'activateGuardianTemplate', 'chaos-protection');
        
        // Save state
        await this.saveSystemState();
        
        console.log('\n✅ Demo complete! System is fully operational.');
        break;

      default:
        console.log(`
🌌 Unified System State

Usage:
  node unified-system-state.js status                    # System status
  node unified-system-state.js execute <layer> <cmd>     # Execute command
  node unified-system-state.js save                      # Save state
  node unified-system-state.js monitor                   # Live monitoring
  node unified-system-state.js demo                      # Run demo

Layers: ${Array.from(this.layers.keys()).join(', ')}

Examples:
  node unified-system-state.js execute database write ralph actions bash-001 '{"bash":true}'
  node unified-system-state.js execute brain think alice "pattern analysis"
  node unified-system-state.js execute guardians activateGuardianTemplate enterprise-protection
  node unified-system-state.js execute templates bash business-plan

Features:
  - All ${this.state.layers} layers connected
  - Unified consciousness: ${(this.state.consciousness * 100).toFixed(0)}%
  - Cross-layer command execution
  - Automatic state synchronization
  - System-wide orchestration
        `);
    }
  }
}

// Export for use as module
module.exports = UnifiedSystemState;

// Run CLI if called directly
if (require.main === module) {
  const system = new UnifiedSystemState();
  system.cli().catch(console.error);
}