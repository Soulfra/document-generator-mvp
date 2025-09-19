#!/usr/bin/env node

/**
 * FLAG AND TAG SYSTEM
 * Tag everything, flag all components, rip through all layers
 * Master coordination system for the entire platform
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const DatabaseIntegration = require('./database-integration');

class FlagTagSystem {
  constructor() {
    this.flags = new Map();
    this.tags = new Map();
    this.componentRegistry = new Map();
    this.ripQueue = [];
    this.systemMap = new Map();
    
    // Initialize database integration
    this.db = new DatabaseIntegration();
    
    this.initializeFlagTagSystem();
  }

  initializeFlagTagSystem() {
    console.log('🏴 Initializing Flag and Tag System...');
    
    // Initialize core flags
    this.setupCoreFlags();
    
    // Initialize tag taxonomy
    this.setupTagTaxonomy();
    
    // Scan and register all components
    this.scanAndRegisterComponents();
    
    // Create system map
    this.generateSystemMap();
    
    console.log('✅ Flag and Tag System ready');
  }

  setupCoreFlags() {
    console.log('🚩 Setting up core flags...');
    
    this.coreFlags = {
      // System Status Flags
      'SYSTEM_ONLINE': { color: 'green', priority: 1, description: 'System is operational' },
      'SYSTEM_DEGRADED': { color: 'yellow', priority: 2, description: 'System performance degraded' },
      'SYSTEM_OFFLINE': { color: 'red', priority: 3, description: 'System is down' },
      
      // Component State Flags
      'COMPONENT_ACTIVE': { color: 'blue', priority: 1, description: 'Component is active and responding' },
      'COMPONENT_IDLE': { color: 'gray', priority: 2, description: 'Component is idle' },
      'COMPONENT_ERROR': { color: 'red', priority: 3, description: 'Component has errors' },
      
      // Data Flow Flags
      'DATA_FLOWING': { color: 'cyan', priority: 1, description: 'Data is flowing correctly' },
      'DATA_STALE': { color: 'orange', priority: 2, description: 'Data is stale or cached' },
      'DATA_MISSING': { color: 'red', priority: 3, description: 'Data is missing or corrupted' },
      
      // AI Network Flags
      'AI_CONNECTED': { color: 'purple', priority: 1, description: 'AI is connected and responsive' },
      'AI_DISCONNECTED': { color: 'red', priority: 3, description: 'AI is disconnected' },
      'AI_PROCESSING': { color: 'blue', priority: 1, description: 'AI is processing requests' },
      
      // Deployment Flags
      'DEPLOYED': { color: 'green', priority: 1, description: 'Component is deployed' },
      'DEPLOYMENT_PENDING': { color: 'yellow', priority: 2, description: 'Deployment in progress' },
      'DEPLOYMENT_FAILED': { color: 'red', priority: 3, description: 'Deployment failed' },
      
      // Feature Flags
      'FEATURE_ENABLED': { color: 'green', priority: 1, description: 'Feature is enabled' },
      'FEATURE_DISABLED': { color: 'gray', priority: 2, description: 'Feature is disabled' },
      'FEATURE_BETA': { color: 'orange', priority: 2, description: 'Feature is in beta' },
      
      // Security Flags
      'SECURE': { color: 'green', priority: 1, description: 'Component is secure' },
      'VULNERABLE': { color: 'red', priority: 3, description: 'Security vulnerability detected' },
      'AUTH_REQUIRED': { color: 'yellow', priority: 2, description: 'Authentication required' }
    };

    // Set initial flags
    Object.entries(this.coreFlags).forEach(([flag, config]) => {
      const flagData = {
        ...config,
        set_at: Date.now(),
        components: new Set()
      };
      this.flags.set(flag, flagData);
      // Save to database
      this.db.saveFlag(flag, flagData);
    });
  }

  setupTagTaxonomy() {
    console.log('🏷️ Setting up tag taxonomy...');
    
    this.tagTaxonomy = {
      // Layer Tags
      'layer': {
        'documentation': { description: 'Documentation layer components' },
        'mvp': { description: 'MVP layer components' },
        'distributed': { description: 'Distributed infrastructure components' },
        'vanity': { description: 'Vanity rooms and flex components' },
        'hooks': { description: 'Real data hooks and API connections' },
        'ai-network': { description: 'AI-to-AI communication components' },
        'flag-tag': { description: 'Flag and tag system components' }
      },
      
      // Function Tags
      'function': {
        'auth': { description: 'Authentication and authorization' },
        'api': { description: 'API endpoints and services' },
        'ui': { description: 'User interface components' },
        'storage': { description: 'Data storage and persistence' },
        'processing': { description: 'Data processing and computation' },
        'monitoring': { description: 'System monitoring and health checks' },
        'deployment': { description: 'Deployment and infrastructure' }
      },
      
      // Technology Tags
      'tech': {
        'javascript': { description: 'JavaScript/Node.js components' },
        'html': { description: 'HTML interface components' },
        'json': { description: 'JSON configuration files' },
        'markdown': { description: 'Markdown documentation' },
        'ipfs': { description: 'IPFS distributed storage' },
        'arweave': { description: 'Arweave permanent storage' },
        'blockchain': { description: 'Blockchain integration' },
        'ai': { description: 'AI/ML components' }
      },
      
      // Status Tags
      'status': {
        'production': { description: 'Production ready components' },
        'development': { description: 'In development' },
        'experimental': { description: 'Experimental features' },
        'deprecated': { description: 'Deprecated components' },
        'broken': { description: 'Known broken components' }
      },
      
      // Priority Tags
      'priority': {
        'critical': { description: 'Critical system components' },
        'high': { description: 'High priority components' },
        'medium': { description: 'Medium priority components' },
        'low': { description: 'Low priority components' },
        'optional': { description: 'Optional components' }
      }
    };

    // Initialize tag registry
    Object.entries(this.tagTaxonomy).forEach(([category, tags]) => {
      Object.entries(tags).forEach(([tag, config]) => {
        const fullTag = `${category}:${tag}`;
        const tagData = {
          ...config,
          category: category,
          tag: tag,
          components: new Set(),
          created_at: Date.now()
        };
        this.tags.set(fullTag, tagData);
        // Save to database
        this.db.saveTag(fullTag, tagData);
      });
    });
  }

  scanAndRegisterComponents() {
    console.log('🔍 Scanning and registering all components...');
    
    const componentDefinitions = [
      // Core Platform Files
      {
        id: 'server-js',
        path: './server.js',
        type: 'core',
        tags: ['layer:mvp', 'function:api', 'tech:javascript', 'status:production', 'priority:critical'],
        flags: ['SYSTEM_ONLINE', 'COMPONENT_ACTIVE', 'DEPLOYED', 'FEATURE_ENABLED']
      },
      
      // Documentation Layer
      {
        id: 'documentation-layer-compact',
        path: './documentation-layer-compact.md',
        type: 'documentation',
        tags: ['layer:documentation', 'tech:markdown', 'status:production', 'priority:high'],
        flags: ['COMPONENT_ACTIVE', 'DEPLOYED', 'DATA_FLOWING']
      },
      
      {
        id: 'journey-documentation',
        path: './journey-documentation.md',
        type: 'documentation',
        tags: ['layer:documentation', 'tech:markdown', 'status:production', 'priority:medium'],
        flags: ['COMPONENT_ACTIVE', 'DEPLOYED']
      },
      
      {
        id: 'revival-checklist',
        path: './revival-checklist.md',
        type: 'documentation',
        tags: ['layer:documentation', 'tech:markdown', 'status:production', 'priority:high'],
        flags: ['COMPONENT_ACTIVE', 'DEPLOYED', 'FEATURE_ENABLED']
      },
      
      // MVP Layer
      {
        id: 'mvp-layer-compact',
        path: './mvp-layer-compact.js',
        type: 'mvp',
        tags: ['layer:mvp', 'function:deployment', 'tech:javascript', 'status:production', 'priority:critical'],
        flags: ['COMPONENT_ACTIVE', 'DEPLOYED', 'FEATURE_ENABLED']
      },
      
      // Distributed Infrastructure
      {
        id: 'distributed-deployment-layer',
        path: './distributed-deployment-layer.js',
        type: 'infrastructure',
        tags: ['layer:distributed', 'function:deployment', 'tech:ipfs', 'tech:arweave', 'tech:blockchain', 'status:experimental', 'priority:high'],
        flags: ['COMPONENT_ACTIVE', 'FEATURE_BETA']
      },
      
      // Vanity Layer
      {
        id: 'vanity-rooms-layer',
        path: './vanity-rooms-layer.html',
        type: 'interface',
        tags: ['layer:vanity', 'function:ui', 'tech:html', 'status:production', 'priority:medium'],
        flags: ['COMPONENT_ACTIVE', 'DEPLOYED', 'FEATURE_ENABLED']
      },
      
      // Real Data Hooks
      {
        id: 'real-data-hooks-layer',
        path: './real-data-hooks-layer.js',
        type: 'integration',
        tags: ['layer:hooks', 'function:api', 'function:processing', 'tech:javascript', 'status:production', 'priority:high'],
        flags: ['COMPONENT_ACTIVE', 'DATA_FLOWING', 'FEATURE_ENABLED']
      },
      
      // Revival System
      {
        id: 'revive-decay-system',
        path: './revive-decay-system.html',
        type: 'interface',
        tags: ['layer:mvp', 'function:ui', 'function:monitoring', 'tech:html', 'status:production', 'priority:high'],
        flags: ['COMPONENT_ACTIVE', 'DEPLOYED', 'FEATURE_ENABLED']
      },
      
      // Free Tier Collapse
      {
        id: 'free-tier-collapse',
        path: './free-tier-collapse.html',
        type: 'interface',
        tags: ['layer:mvp', 'function:ui', 'function:auth', 'tech:html', 'status:production', 'priority:critical'],
        flags: ['COMPONENT_ACTIVE', 'DEPLOYED', 'FEATURE_ENABLED']
      },
      
      // AI Economy
      {
        id: 'ai-economy-runtime',
        path: './ai-economy-runtime.js',
        type: 'ai',
        tags: ['layer:ai-network', 'function:processing', 'tech:ai', 'tech:javascript', 'status:production', 'priority:high'],
        flags: ['COMPONENT_ACTIVE', 'AI_CONNECTED', 'DATA_FLOWING']
      },
      
      // .soulfra Format
      {
        id: 'soulfra-format-spec',
        path: './soulfra-format-spec.md',
        type: 'specification',
        tags: ['layer:documentation', 'function:storage', 'tech:json', 'tech:markdown', 'status:production', 'priority:critical'],
        flags: ['COMPONENT_ACTIVE', 'DEPLOYED', 'FEATURE_ENABLED']
      },
      
      // Flag Tag System (self-reference)
      {
        id: 'flag-tag-system',
        path: './flag-tag-system.js',
        type: 'coordination',
        tags: ['layer:flag-tag', 'function:monitoring', 'tech:javascript', 'status:production', 'priority:critical'],
        flags: ['COMPONENT_ACTIVE', 'SYSTEM_ONLINE', 'FEATURE_ENABLED']
      }
    ];

    // Register each component
    componentDefinitions.forEach(component => {
      this.registerComponent(component);
    });
  }

  registerComponent(component) {
    // Check if file exists
    const exists = fs.existsSync(component.path);
    
    const registeredComponent = {
      ...component,
      exists: exists,
      registered_at: Date.now(),
      last_updated: exists ? this.getFileModTime(component.path) : null,
      size: exists ? this.getFileSize(component.path) : 0,
      active_flags: new Set(),
      active_tags: new Set()
    };

    // Apply tags
    component.tags.forEach(tag => {
      this.applyTag(component.id, tag);
      registeredComponent.active_tags.add(tag);
    });

    // Apply flags based on file existence and status
    if (exists) {
      component.flags.forEach(flag => {
        this.setFlag(component.id, flag);
        registeredComponent.active_flags.add(flag);
      });
    } else {
      this.setFlag(component.id, 'COMPONENT_ERROR');
      registeredComponent.active_flags.add('COMPONENT_ERROR');
    }

    this.componentRegistry.set(component.id, registeredComponent);
    
    // Save to database
    this.db.saveComponent({
      ...registeredComponent,
      active_flags: Array.from(registeredComponent.active_flags),
      active_tags: Array.from(registeredComponent.active_tags)
    });
    
    console.log(`  📝 Registered ${component.id}: ${component.tags.length} tags, ${registeredComponent.active_flags.size} flags`);
  }

  applyTag(componentId, tag) {
    if (this.tags.has(tag)) {
      this.tags.get(tag).components.add(componentId);
      // Save to database
      this.db.setComponentTag(componentId, tag);
    }
  }

  setFlag(componentId, flag) {
    if (this.flags.has(flag)) {
      this.flags.get(flag).components.add(componentId);
      // Save to database
      this.db.setComponentFlag(componentId, flag);
    }
  }

  getFileModTime(filePath) {
    try {
      return fs.statSync(filePath).mtime.getTime();
    } catch {
      return null;
    }
  }

  getFileSize(filePath) {
    try {
      return fs.statSync(filePath).size;
    } catch {
      return 0;
    }
  }

  generateSystemMap() {
    console.log('🗺️ Generating system map...');
    
    this.systemMap = {
      overview: {
        total_components: this.componentRegistry.size,
        total_flags: this.flags.size,
        total_tags: this.tags.size,
        system_health: this.calculateSystemHealth()
      },
      
      layers: this.getComponentsByLayer(),
      functions: this.getComponentsByFunction(),
      technologies: this.getComponentsByTechnology(),
      status_distribution: this.getStatusDistribution(),
      flag_summary: this.getFlagSummary(),
      tag_summary: this.getTagSummary(),
      
      critical_path: this.identifyCriticalPath(),
      health_alerts: this.getHealthAlerts(),
      recommendations: this.generateRecommendations()
    };
  }

  getComponentsByLayer() {
    const layers = {};
    
    Array.from(this.componentRegistry.values()).forEach(component => {
      component.active_tags.forEach(tag => {
        if (tag.startsWith('layer:')) {
          const layer = tag.split(':')[1];
          if (!layers[layer]) layers[layer] = [];
          layers[layer].push({
            id: component.id,
            type: component.type,
            status: this.getComponentStatus(component),
            path: component.path
          });
        }
      });
    });
    
    return layers;
  }

  getComponentsByFunction() {
    const functions = {};
    
    Array.from(this.componentRegistry.values()).forEach(component => {
      component.active_tags.forEach(tag => {
        if (tag.startsWith('function:')) {
          const func = tag.split(':')[1];
          if (!functions[func]) functions[func] = [];
          functions[func].push(component.id);
        }
      });
    });
    
    return functions;
  }

  getComponentsByTechnology() {
    const technologies = {};
    
    Array.from(this.componentRegistry.values()).forEach(component => {
      component.active_tags.forEach(tag => {
        if (tag.startsWith('tech:')) {
          const tech = tag.split(':')[1];
          if (!technologies[tech]) technologies[tech] = [];
          technologies[tech].push(component.id);
        }
      });
    });
    
    return technologies;
  }

  getStatusDistribution() {
    const status = {};
    
    Array.from(this.componentRegistry.values()).forEach(component => {
      component.active_tags.forEach(tag => {
        if (tag.startsWith('status:')) {
          const stat = tag.split(':')[1];
          status[stat] = (status[stat] || 0) + 1;
        }
      });
    });
    
    return status;
  }

  getFlagSummary() {
    const summary = {};
    
    this.flags.forEach((flag, name) => {
      summary[name] = {
        components: flag.components.size,
        priority: flag.priority,
        color: flag.color,
        description: flag.description
      };
    });
    
    return summary;
  }

  getTagSummary() {
    const summary = {};
    
    this.tags.forEach((tag, name) => {
      summary[name] = {
        components: tag.components.size,
        category: tag.category,
        description: tag.description
      };
    });
    
    return summary;
  }

  calculateSystemHealth() {
    let totalComponents = this.componentRegistry.size;
    let healthyComponents = 0;
    
    this.componentRegistry.forEach(component => {
      if (component.exists && !component.active_flags.has('COMPONENT_ERROR')) {
        healthyComponents++;
      }
    });
    
    const healthPercentage = Math.round((healthyComponents / totalComponents) * 100);
    
    // Record system health to database
    this.db.recordSystemHealth({
      total_components: totalComponents,
      healthy_components: healthyComponents,
      health_percentage: healthPercentage
    });
    
    return healthPercentage;
  }

  getComponentStatus(component) {
    if (!component.exists) return 'missing';
    if (component.active_flags.has('COMPONENT_ERROR')) return 'error';
    if (component.active_flags.has('COMPONENT_ACTIVE')) return 'active';
    if (component.active_flags.has('COMPONENT_IDLE')) return 'idle';
    return 'unknown';
  }

  identifyCriticalPath() {
    const criticalComponents = [];
    
    this.componentRegistry.forEach(component => {
      if (component.active_tags.has('priority:critical')) {
        criticalComponents.push({
          id: component.id,
          type: component.type,
          status: this.getComponentStatus(component),
          dependencies: this.findDependencies(component.id)
        });
      }
    });
    
    return criticalComponents;
  }

  findDependencies(componentId) {
    // Simple dependency detection based on requires/imports
    const component = this.componentRegistry.get(componentId);
    if (!component || !component.exists) return [];
    
    try {
      const content = fs.readFileSync(component.path, 'utf8');
      const dependencies = [];
      
      // Look for require statements
      const requireMatches = content.match(/require\(['"`]([^'"`]+)['"`]\)/g);
      if (requireMatches) {
        requireMatches.forEach(match => {
          const dep = match.match(/require\(['"`]([^'"`]+)['"`]\)/)[1];
          if (dep.startsWith('./')) {
            dependencies.push(dep);
          }
        });
      }
      
      return dependencies;
    } catch {
      return [];
    }
  }

  getHealthAlerts() {
    const alerts = [];
    
    this.componentRegistry.forEach(component => {
      if (!component.exists) {
        alerts.push({
          level: 'error',
          component: component.id,
          message: `Component file missing: ${component.path}`,
          timestamp: Date.now()
        });
      }
      
      if (component.active_flags.has('COMPONENT_ERROR')) {
        alerts.push({
          level: 'error',
          component: component.id,
          message: 'Component has errors',
          timestamp: Date.now()
        });
      }
    });
    
    return alerts;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Check for missing critical components
    const criticalMissing = Array.from(this.componentRegistry.values())
      .filter(c => c.active_tags.has('priority:critical') && !c.exists);
    
    if (criticalMissing.length > 0) {
      recommendations.push({
        type: 'critical',
        action: 'Create missing critical components',
        components: criticalMissing.map(c => c.id),
        priority: 1
      });
    }
    
    // Check for experimental components in production
    const expInProd = Array.from(this.componentRegistry.values())
      .filter(c => c.active_tags.has('status:experimental') && c.active_flags.has('DEPLOYED'));
    
    if (expInProd.length > 0) {
      recommendations.push({
        type: 'warning',
        action: 'Review experimental components in production',
        components: expInProd.map(c => c.id),
        priority: 2
      });
    }
    
    return recommendations;
  }

  // API Methods for Express integration
  createAPIRoutes(app) {
    console.log('🛣️ Creating flag/tag API routes...');

    // Get system map
    app.get('/api/flags/system-map', (req, res) => {
      this.generateSystemMap();
      res.json(this.systemMap);
    });

    // Get all flags
    app.get('/api/flags', (req, res) => {
      const flagsArray = Array.from(this.flags.entries()).map(([name, flag]) => ({
        name,
        ...flag,
        components: Array.from(flag.components)
      }));
      res.json(flagsArray);
    });

    // Get all tags
    app.get('/api/tags', (req, res) => {
      const tagsArray = Array.from(this.tags.entries()).map(([name, tag]) => ({
        name,
        ...tag,
        components: Array.from(tag.components)
      }));
      res.json(tagsArray);
    });

    // Get components by tag
    app.get('/api/tags/:tag/components', (req, res) => {
      const tag = req.params.tag;
      if (this.tags.has(tag)) {
        const components = Array.from(this.tags.get(tag).components)
          .map(id => this.componentRegistry.get(id))
          .filter(Boolean);
        res.json(components);
      } else {
        res.status(404).json({ error: 'Tag not found' });
      }
    });

    // Get components by flag
    app.get('/api/flags/:flag/components', (req, res) => {
      const flag = req.params.flag;
      if (this.flags.has(flag)) {
        const components = Array.from(this.flags.get(flag).components)
          .map(id => this.componentRegistry.get(id))
          .filter(Boolean);
        res.json(components);
      } else {
        res.status(404).json({ error: 'Flag not found' });
      }
    });

    // Set flag for component
    app.post('/api/flags/:flag/components/:componentId', (req, res) => {
      const { flag, componentId } = req.params;
      
      if (this.flags.has(flag) && this.componentRegistry.has(componentId)) {
        this.setFlag(componentId, flag);
        const component = this.componentRegistry.get(componentId);
        component.active_flags.add(flag);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Flag or component not found' });
      }
    });

    // Apply tag to component
    app.post('/api/tags/:tag/components/:componentId', (req, res) => {
      const { tag, componentId } = req.params;
      
      if (this.tags.has(tag) && this.componentRegistry.has(componentId)) {
        this.applyTag(componentId, tag);
        const component = this.componentRegistry.get(componentId);
        component.active_tags.add(tag);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Tag or component not found' });
      }
    });

    // Rip through system (batch operations)
    app.post('/api/flags/rip-through', (req, res) => {
      const { operation, filter } = req.body;
      const results = this.ripThroughSystem(operation, filter);
      res.json(results);
    });
  }

  ripThroughSystem(operation, filter = {}) {
    console.log(`🔥 Ripping through system with operation: ${operation}`);
    
    let targetComponents = Array.from(this.componentRegistry.values());
    
    // Apply filters
    if (filter.layer) {
      targetComponents = targetComponents.filter(c => 
        c.active_tags.has(`layer:${filter.layer}`)
      );
    }
    
    if (filter.status) {
      targetComponents = targetComponents.filter(c => 
        c.active_tags.has(`status:${filter.status}`)
      );
    }
    
    if (filter.priority) {
      targetComponents = targetComponents.filter(c => 
        c.active_tags.has(`priority:${filter.priority}`)
      );
    }

    const results = {
      operation: operation,
      filter: filter,
      targets: targetComponents.length,
      processed: 0,
      errors: [],
      success: []
    };

    targetComponents.forEach(component => {
      try {
        switch (operation) {
          case 'refresh_flags':
            this.refreshComponentFlags(component);
            results.success.push(component.id);
            break;
            
          case 'validate_existence':
            if (!component.exists) {
              this.setFlag(component.id, 'COMPONENT_ERROR');
              results.errors.push(`${component.id}: File missing`);
            } else {
              this.setFlag(component.id, 'COMPONENT_ACTIVE');
              results.success.push(component.id);
            }
            break;
            
          case 'update_timestamps':
            component.last_updated = this.getFileModTime(component.path);
            results.success.push(component.id);
            break;
            
          default:
            results.errors.push(`Unknown operation: ${operation}`);
        }
        results.processed++;
      } catch (error) {
        results.errors.push(`${component.id}: ${error.message}`);
      }
    });

    // Log the rip-through operation to database
    this.db.logRipThroughOperation({
      operation: operation,
      filter_used: filter,
      targets: results.targets,
      processed: results.processed,
      success_count: results.success.length,
      error_count: results.errors.length,
      success_list: results.success,
      error_list: results.errors,
      executed_at: Date.now()
    });

    return results;
  }

  refreshComponentFlags(component) {
    // Clear existing flags
    component.active_flags.clear();
    
    // Reapply based on current state
    if (component.exists) {
      this.setFlag(component.id, 'COMPONENT_ACTIVE');
      component.active_flags.add('COMPONENT_ACTIVE');
    } else {
      this.setFlag(component.id, 'COMPONENT_ERROR');
      component.active_flags.add('COMPONENT_ERROR');
    }
  }

  // Export system state
  exportSystemState() {
    return {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      system_map: this.systemMap,
      components: Object.fromEntries(this.componentRegistry),
      flags: Object.fromEntries(this.flags),
      tags: Object.fromEntries(this.tags)
    };
  }
}

module.exports = FlagTagSystem;