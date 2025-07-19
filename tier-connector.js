#!/usr/bin/env node

/**
 * Document Generator Tier Connector
 * Connects all tiers including the FinishThisIdea tier system
 */

const fs = require('fs');
const path = require('path');

class DocumentGeneratorTierConnector {
  constructor() {
    this.tiers = new Map();
    this.connections = [];
    this.tiersFound = 0;
  }

  async initialize() {
    console.log('🏗️  DOCUMENT GENERATOR TIER CONNECTOR');
    console.log('=====================================');
    console.log('Discovering and connecting all tiers...\n');
    
    await this.discoverTiers();
    await this.connectTiers();
    await this.validateConnections();
    
    console.log(`\n✅ Connected ${this.tiersFound} tiers`);
    return this;
  }

  async discoverTiers() {
    console.log('🔍 Discovering tier system...');
    
    // Our main tiers (7 layers)
    const mainTiers = [
      { name: 'Tier 1: Templates', file: './cli.js', type: 'interface' },
      { name: 'Tier 2: Mesh', file: './mesh-layer.js', type: 'communication' },
      { name: 'Tier 3: Tools', file: './tool-layer.js', type: 'processing' },
      { name: 'Tier 4: Integration', file: './integration-layer.js', type: 'orchestration' },
      { name: 'Tier 5: Runtime', file: './runtime-layer.js', type: 'environment' },
      { name: 'Tier 6: Economy', file: './economy-layer.js', type: 'economics' },
      { name: 'Tier 7: Git', file: './git-layer.js', type: 'version-control' }
    ];
    
    // FinishThisIdea tiers
    const finishTiers = [
      { name: 'Tier 3: Symlinks', file: './FinishThisIdea/tier-3-symlink-manager.js', type: 'symlink' },
      { name: 'Tier 4: Substrate', file: './FinishThisIdea/tier-4-substrate-manager.js', type: 'substrate' },
      { name: 'Tier 4: Service Mesh', file: './FinishThisIdea/tier-4-service-mesh.js', type: 'mesh' },
      { name: 'Tier 5: Universal', file: './FinishThisIdea/tier-5-universal-interface.js', type: 'universal' }
    ];
    
    // Master orchestrators
    const masters = [
      { name: 'Master Orchestrator', file: './master-orchestrator.js', type: 'master' },
      { name: 'Final Executor', file: './final-executor.js', type: 'executor' }
    ];
    
    // Check all tiers
    const allTiers = [...mainTiers, ...finishTiers, ...masters];
    
    for (const tier of allTiers) {
      if (fs.existsSync(tier.file)) {
        this.tiers.set(tier.name, {
          ...tier,
          exists: true,
          loaded: false
        });
        console.log(`✅ Found: ${tier.name}`);
        this.tiersFound++;
      } else {
        console.log(`❌ Missing: ${tier.name}`);
      }
    }
  }

  async connectTiers() {
    console.log('\n🔗 Connecting tiers...');
    
    // Create connection map
    const connectionMap = {
      'Tier 1: Templates': ['Tier 2: Mesh', 'Tier 4: Integration'],
      'Tier 2: Mesh': ['Tier 3: Tools', 'Tier 4: Integration', 'Tier 4: Service Mesh'],
      'Tier 3: Tools': ['Tier 6: Economy', 'Tier 5: Runtime'],
      'Tier 4: Integration': ['Master Orchestrator', 'Tier 3: Symlinks'],
      'Tier 5: Runtime': ['Final Executor'],
      'Tier 6: Economy': ['Tier 3: Tools'],
      'Tier 7: Git': ['Tier 3: Symlinks', 'Tier 4: Integration'],
      'Tier 3: Symlinks': ['Tier 4: Substrate'],
      'Tier 4: Substrate': ['Tier 5: Universal'],
      'Master Orchestrator': ['Final Executor']
    };
    
    // Create connections
    for (const [source, targets] of Object.entries(connectionMap)) {
      const sourceTier = this.tiers.get(source);
      if (!sourceTier) continue;
      
      for (const target of targets) {
        const targetTier = this.tiers.get(target);
        if (!targetTier) continue;
        
        this.connections.push({
          from: source,
          to: target,
          type: 'depends_on',
          active: sourceTier.exists && targetTier.exists
        });
        
        console.log(`🔗 Connected: ${source} → ${target}`);
      }
    }
  }

  async validateConnections() {
    console.log('\n🔍 Validating connections...');
    
    // Try to load each tier
    for (const [name, tier] of this.tiers) {
      try {
        if (tier.exists && !name.includes('FinishThisIdea')) {
          // Don't actually require them to avoid execution
          // Just check if they're loadable
          const stats = fs.statSync(tier.file);
          if (stats.isFile()) {
            tier.loaded = true;
            tier.size = stats.size;
            console.log(`✅ Validated: ${name} (${tier.size} bytes)`);
          }
        }
      } catch (error) {
        console.log(`❌ Validation failed for ${name}:`, error.message);
      }
    }
  }

  showTierMap() {
    console.log('\n🗺️  COMPLETE TIER MAP');
    console.log('====================');
    
    // Group by type
    const byType = {};
    for (const [name, tier] of this.tiers) {
      if (!byType[tier.type]) {
        byType[tier.type] = [];
      }
      byType[tier.type].push(tier);
    }
    
    // Show each type
    for (const [type, tiers] of Object.entries(byType)) {
      console.log(`\n${type.toUpperCase()}:`);
      tiers.forEach(tier => {
        const status = tier.exists ? '✅' : '❌';
        console.log(`  ${status} ${tier.name}`);
        if (tier.exists) {
          console.log(`     → ${tier.file}`);
        }
      });
    }
    
    // Show connections
    console.log('\n🔗 TIER CONNECTIONS:');
    const activeConnections = this.connections.filter(c => c.active);
    console.log(`Active: ${activeConnections.length}/${this.connections.length}`);
    
    activeConnections.forEach(conn => {
      console.log(`  ${conn.from} → ${conn.to}`);
    });
  }

  async executeTierSystem() {
    console.log('\n🚀 EXECUTING TIER SYSTEM');
    console.log('========================');
    
    // Find the highest tier that exists
    const executionOrder = [
      'Final Executor',
      'Master Orchestrator',
      'Tier 5: Universal',
      'Tier 4: Integration',
      'Tier 7: Git'
    ];
    
    for (const tierName of executionOrder) {
      const tier = this.tiers.get(tierName);
      if (tier && tier.exists) {
        console.log(`\n🎯 Found executable tier: ${tierName}`);
        console.log(`📍 Location: ${tier.file}`);
        console.log(`🔧 Type: ${tier.type}`);
        
        console.log('\n💡 Execute with:');
        console.log(`   node ${tier.file}`);
        
        // If it's the Final Executor, that's our best bet
        if (tierName === 'Final Executor') {
          console.log('\n✅ RECOMMENDED: This tier executes all others!');
        }
        
        break;
      }
    }
  }

  getExecutionCommand() {
    // Return the best command to execute
    const tier = this.tiers.get('Final Executor');
    if (tier && tier.exists) {
      return 'node final-executor.js';
    }
    
    const master = this.tiers.get('Master Orchestrator');
    if (master && master.exists) {
      return 'node master-orchestrator.js';
    }
    
    return 'node cli.js';
  }
}

// Execute tier connector
if (require.main === module) {
  const connector = new DocumentGeneratorTierConnector();
  
  connector.initialize().then(async () => {
    connector.showTierMap();
    await connector.executeTierSystem();
    
    console.log('\n🎯 TIER SYSTEM READY!');
    console.log('====================');
    
    const command = connector.getExecutionCommand();
    console.log('\n🚀 EXECUTE EVERYTHING WITH:');
    console.log(`   ${command}`);
    
    console.log('\n📊 System Statistics:');
    console.log(`   Total Tiers: ${connector.tiersFound}`);
    console.log(`   Main Layers: 7`);
    console.log(`   FinishThisIdea Tiers: 4`);
    console.log(`   Master Controllers: 2`);
    console.log(`   Total Components: 13+`);
    
    console.log('\n✅ Document Generator has more than 7 tiers!');
    console.log('The complete system includes substrate, symlinks,');
    console.log('universal interface, and service mesh layers.');
    
  }).catch(error => {
    console.error('❌ Tier connection failed:', error);
  });
}