#!/usr/bin/env node

/**
 * TEMPLATE DEPENDENCIES MANAGER
 * Template all the systems into proper dependencies and package structure
 */

const fs = require('fs').promises;
const path = require('path');

console.log('📦 TEMPLATE DEPENDENCIES MANAGER - ORGANIZING SYSTEM DEPENDENCIES');

class TemplateDependencies {
  constructor() {
    this.systemTemplates = new Map();
    this.dependencies = new Map();
    this.packageStructure = new Map();
    
    this.templateSystems();
  }

  async templateSystems() {
    console.log('📋 Templating systems into dependencies...');
    
    // Define system templates
    await this.defineSystemTemplates();
    
    // Map dependencies
    await this.mapDependencies();
    
    // Create package structure
    await this.createPackageStructure();
    
    // Generate dependency manifest
    await this.generateDependencyManifest();
  }

  async defineSystemTemplates() {
    console.log('📝 Defining system templates...');
    
    this.systemTemplates.set('conductor', {
      file: 'conductor-character.js',
      type: 'character',
      dependencies: ['events', 'crypto'],
      exports: 'Conductor',
      description: 'Master orchestrator character',
      npm_commands: ['conduct', 'symphony', 'manifest', 'just-do-it']
    });
    
    this.systemTemplates.set('unified-interface', {
      file: 'unified-system-interface.js',
      type: 'interface',
      dependencies: ['child_process', 'fs', 'path', 'events', 'readline'],
      exports: 'UnifiedSystemInterface',
      description: 'Single entry point for all systems',
      npm_commands: ['unified', 'unify', 'interface', 'ui']
    });
    
    this.systemTemplates.set('bash-engine', {
      file: 'reasoning-differential-bash-engine.js',
      type: 'processor',
      dependencies: ['child_process', 'fs', 'path', 'crypto', 'events'],
      exports: 'ReasoningDifferentialBashEngine',
      description: 'Bash through documentation to extract truth',
      npm_commands: ['bash', 'differential', 'truth']
    });
    
    this.systemTemplates.set('hidden-layer', {
      file: 'hidden-layer-bus-gas-system.js',
      type: 'infrastructure',
      dependencies: ['child_process', 'fs', 'path', 'events', 'crypto'],
      exports: 'HiddenLayerBusGasSystem',
      description: 'Hidden infrastructure and gas economy',
      npm_commands: ['hidden', 'bus', 'gas', 'infrastructure']
    });
    
    this.systemTemplates.set('backup-auth', {
      file: 'backup-auth-system.js',
      type: 'security',
      dependencies: ['fs', 'crypto', 'path'],
      exports: 'BackupAuthSystem',
      description: 'Backup and authentication system',
      npm_commands: ['backup', 'auth', 'login', 'emergency-backup']
    });
    
    this.systemTemplates.set('device-gis', {
      file: 'device-gis-router.js',
      type: 'router',
      dependencies: ['crypto', 'events'],
      exports: 'DeviceGISRouter',
      description: 'Device GIS dimensional router',
      npm_commands: ['device-gis', 'gis-status', 'nearby', 'map']
    });
    
    this.systemTemplates.set('puppet-test', {
      file: 'puppet-test-automation.js',
      type: 'testing',
      dependencies: ['child_process', 'fs'],
      exports: 'PuppetTestAutomation',
      description: 'Automated testing system',
      npm_commands: ['test-puppet', 'test-quick', 'test-report']
    });
    
    console.log(`✅ Defined ${this.systemTemplates.size} system templates`);
  }

  async mapDependencies() {
    console.log('🔗 Mapping system dependencies...');
    
    // Map internal dependencies (system to system)
    this.dependencies.set('conductor', ['unified-interface', 'bash-engine']);
    this.dependencies.set('unified-interface', ['conductor', 'bash-engine', 'hidden-layer']);
    this.dependencies.set('bash-engine', ['hidden-layer']);
    this.dependencies.set('backup-auth', ['device-gis']);
    this.dependencies.set('device-gis', ['backup-auth']);
    this.dependencies.set('puppet-test', ['conductor', 'unified-interface', 'bash-engine', 'hidden-layer', 'backup-auth', 'device-gis']);
    
    // Map external dependencies (npm packages)
    const externalDeps = new Set();
    for (const [_, template] of this.systemTemplates) {
      template.dependencies.forEach(dep => externalDeps.add(dep));
    }
    
    console.log(`📦 External dependencies: ${Array.from(externalDeps).join(', ')}`);
    console.log(`🔗 Internal dependencies mapped`);
  }

  async createPackageStructure() {
    console.log('🏗️ Creating package structure...');
    
    this.packageStructure.set('characters', [
      'conductor-character.js',
      'cal-character-layer.js',
      'arty-companion.js',
      'unified-flag-system.js'
    ]);
    
    this.packageStructure.set('interfaces', [
      'unified-system-interface.js',
      'runtime-bash-executor.js',
      'simple-start.js'
    ]);
    
    this.packageStructure.set('engines', [
      'reasoning-differential-bash-engine.js',
      'hidden-layer-bus-gas-system.js'
    ]);
    
    this.packageStructure.set('security', [
      'backup-auth-system.js',
      'login-layer.js'
    ]);
    
    this.packageStructure.set('routing', [
      'device-gis-router.js',
      'character-emergence-pipeline.js'
    ]);
    
    this.packageStructure.set('testing', [
      'puppet-test-automation.js',
      'template-dependencies.js'
    ]);
    
    console.log(`📁 Package structure with ${this.packageStructure.size} categories`);
  }

  async generateDependencyManifest() {
    console.log('📄 Generating dependency manifest...');
    
    const manifest = {
      name: "document-generator-system",
      version: "1.0.0",
      description: "Complete AI agent ecosystem with characters, interfaces, and routing",
      
      system_templates: Object.fromEntries(this.systemTemplates),
      
      dependency_graph: Object.fromEntries(this.dependencies),
      
      package_structure: Object.fromEntries(this.packageStructure),
      
      npm_commands: this.generateNPMCommandMap(),
      
      external_dependencies: this.generateExternalDependencies(),
      
      installation_order: [
        'hidden-layer',
        'bash-engine', 
        'backup-auth',
        'device-gis',
        'conductor',
        'unified-interface',
        'puppet-test'
      ],
      
      health_check: {
        critical_systems: ['conductor', 'unified-interface'],
        optional_systems: ['device-gis', 'backup-auth'],
        testing_systems: ['puppet-test']
      }
    };
    
    await fs.writeFile('dependency-manifest.json', JSON.stringify(manifest, null, 2));
    console.log('✅ Dependency manifest created: dependency-manifest.json');
    
    // Also update package.json with proper structure
    await this.updatePackageJSON(manifest);
    
    return manifest;
  }

  generateNPMCommandMap() {
    const commandMap = {};
    
    for (const [systemId, template] of this.systemTemplates) {
      template.npm_commands.forEach(cmd => {
        commandMap[cmd] = {
          system: systemId,
          file: template.file,
          description: template.description
        };
      });
    }
    
    return commandMap;
  }

  generateExternalDependencies() {
    const deps = new Set();
    
    for (const [_, template] of this.systemTemplates) {
      template.dependencies.forEach(dep => {
        // Only include actual npm packages, not Node.js built-ins
        if (!['fs', 'path', 'crypto', 'events', 'child_process', 'readline'].includes(dep)) {
          deps.add(dep);
        }
      });
    }
    
    return Array.from(deps);
  }

  async updatePackageJSON(manifest) {
    console.log('📦 Updating package.json with templated structure...');
    
    try {
      const packageData = await fs.readFile('package.json', 'utf8');
      const pkg = JSON.parse(packageData);
      
      // Add system metadata
      pkg.system_metadata = {
        total_systems: this.systemTemplates.size,
        system_categories: Array.from(this.packageStructure.keys()),
        last_templated: new Date().toISOString()
      };
      
      // Ensure all external dependencies are listed
      const externalDeps = manifest.external_dependencies;
      if (externalDeps.length > 0) {
        pkg.dependencies = pkg.dependencies || {};
        externalDeps.forEach(dep => {
          if (!pkg.dependencies[dep]) {
            pkg.dependencies[dep] = "latest";
          }
        });
      }
      
      await fs.writeFile('package.json', JSON.stringify(pkg, null, 2));
      console.log('✅ package.json updated with system metadata');
      
    } catch (error) {
      console.error('❌ Failed to update package.json:', error.message);
    }
  }

  async verifySystemHealth() {
    console.log('\n🏥 VERIFYING SYSTEM HEALTH...');
    
    let healthyCount = 0;
    let totalCount = 0;
    
    for (const [systemId, template] of this.systemTemplates) {
      totalCount++;
      
      try {
        await fs.access(template.file);
        console.log(`  ✅ ${systemId} - File exists`);
        
        // Try to require it
        const SystemClass = require(`./${template.file}`);
        console.log(`  ✅ ${systemId} - Loads successfully`);
        healthyCount++;
        
      } catch (error) {
        console.log(`  ❌ ${systemId} - ${error.message}`);
      }
    }
    
    const healthPercentage = (healthyCount / totalCount) * 100;
    console.log(`\n📊 System Health: ${healthyCount}/${totalCount} (${healthPercentage.toFixed(1)}%)`);
    
    if (healthPercentage >= 80) {
      console.log('🎉 SYSTEM HEALTH: EXCELLENT');
    } else if (healthPercentage >= 60) {
      console.log('⚠️ SYSTEM HEALTH: NEEDS ATTENTION');
    } else {
      console.log('🚨 SYSTEM HEALTH: CRITICAL - BASH RESET RECOMMENDED');
    }
    
    return healthPercentage;
  }

  // CLI interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'template':
        await this.templateSystems();
        break;
        
      case 'health':
        await this.verifySystemHealth();
        break;
        
      case 'manifest':
        const manifest = await this.generateDependencyManifest();
        console.log('📄 Dependency manifest generated');
        break;
        
      case 'structure':
        console.log('🏗️ Package Structure:');
        for (const [category, files] of this.packageStructure) {
          console.log(`  ${category}:`);
          files.forEach(file => console.log(`    - ${file}`));
        }
        break;

      default:
        console.log(`
📦 Template Dependencies Manager

Usage:
  node template-dependencies.js template   # Template all systems
  node template-dependencies.js health     # Check system health
  node template-dependencies.js manifest   # Generate dependency manifest
  node template-dependencies.js structure  # Show package structure

🏗️ System Organization:
  • Maps all system dependencies
  • Creates package structure
  • Generates dependency manifest
  • Verifies system health
  • Updates package.json metadata

📋 Templates systems into proper dependency structure.
        `);
    }
  }
}

// Export for use as module
module.exports = TemplateDependencies;

// Run CLI if called directly
if (require.main === module) {
  const deps = new TemplateDependencies();
  deps.cli().catch(console.error);
}