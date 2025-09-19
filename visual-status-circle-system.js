#!/usr/bin/env node

/**
 * VISUAL STATUS CIRCLE SYSTEM
 * Red → Orange/Yellow → Green circle progression with outline/background variants
 * Norse/Westby/Readstown layer integration for geographic/thematic status
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class VisualStatusCircleSystem extends EventEmitter {
  constructor() {
    super();
    
    // Visual circle configuration
    this.circleConfig = {
      statusProgression: ['red', 'orange', 'yellow', 'green'],
      finalTarget: 'green',
      
      // Circle variants
      variants: {
        solid: { type: 'solid', transparency: 1.0 },
        outline: { type: 'outline', strokeWidth: 2, fill: 'transparent' },
        background: { type: 'background', transparency: 0.3 },
        gradient: { type: 'gradient', stops: ['dark', 'light'] }
      },
      
      // Animation states
      transitions: {
        duration: 300, // ms
        easing: 'ease-in-out',
        pulseOnChange: true,
        glowOnGreen: true
      }
    };
    
    // Layer system architecture (Norse/Westby/Readstown)
    this.layerSystem = {
      norse: {
        name: 'Norse Layer',
        theme: 'Nordic/Mythological',
        geography: 'Northern territories',
        characteristics: ['strength', 'tradition', 'wisdom'],
        colors: { primary: '#1E3A8A', secondary: '#3B82F6', accent: '#60A5FA' }
      },
      
      westby: {
        name: 'Westby Layer', 
        theme: 'Western/Frontier',
        geography: 'Western territories',
        characteristics: ['innovation', 'freedom', 'exploration'],
        colors: { primary: '#DC2626', secondary: '#EF4444', accent: '#F87171' }
      },
      
      readstown: {
        name: 'Readstown Layer',
        theme: 'Academic/Literary',
        geography: 'Central/Educational',
        characteristics: ['knowledge', 'learning', 'communication'],
        colors: { primary: '#059669', secondary: '#10B981', accent: '#34D399' }
      }
    };
    
    // Status progression rules
    this.statusRules = {
      red: {
        meaning: 'Critical/Blocked/Offline',
        conditions: ['system_down', 'critical_error', 'blocked_access'],
        nextStates: ['orange', 'yellow'],
        requirements: 'Fix critical issues'
      },
      
      orange: {
        meaning: 'Warning/Partial/Degraded',
        conditions: ['partial_functionality', 'warnings_present', 'degraded_performance'],
        nextStates: ['red', 'yellow', 'green'],
        requirements: 'Address warnings and stabilize'
      },
      
      yellow: {
        meaning: 'Caution/Processing/Almost Ready',
        conditions: ['processing', 'almost_ready', 'minor_issues'],
        nextStates: ['orange', 'green'],
        requirements: 'Complete processing and final checks'
      },
      
      green: {
        meaning: 'Operational/Ready/Success',
        conditions: ['fully_operational', 'all_checks_passed', 'ready_for_use'],
        nextStates: ['yellow', 'orange'], // Can degrade
        requirements: 'Maintain operational status'
      }
    };
    
    // Active status tracking
    this.activeStatuses = new Map();
    this.layerMappings = new Map();
    this.visualElements = new Map();
    
    console.log('🎨 VISUAL STATUS CIRCLE SYSTEM INITIALIZED');
    console.log('🔴 → 🟠 → 🟡 → 🟢 Status progression ready');
    console.log('🏔️ Norse/Westby/Readstown layer system active\n');
    
    this.initializeVisualSystem();
  }
  
  /**
   * Initialize the complete visual status system
   */
  async initializeVisualSystem() {
    console.log('🚀 Initializing visual status circle system...\n');
    
    try {
      // Setup circle variants and styles
      await this.setupCircleVariants();
      
      // Initialize layer system
      await this.initializeLayerSystem();
      
      // Create status progression logic
      await this.setupStatusProgression();
      
      // Build visual rendering engine
      await this.buildVisualRenderingEngine();
      
      // Setup geographic layer mapping
      await this.setupGeographicLayerMapping();
      
      console.log('✅ Visual status circle system ready\n');
      this.emit('visualSystemReady');
      
    } catch (error) {
      console.error('❌ Visual system initialization failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Setup circle variants and styles
   */
  async setupCircleVariants() {
    console.log('🎨 Setting up circle variants...');
    
    // Define CSS/SVG styles for each variant
    this.circleStyles = {
      red: {
        solid: {
          fill: '#DC2626',
          stroke: 'none',
          shadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
        },
        outline: {
          fill: 'transparent',
          stroke: '#DC2626',
          strokeWidth: '2px',
          shadow: '0 0 8px rgba(220, 38, 38, 0.5)'
        },
        background: {
          fill: 'rgba(220, 38, 38, 0.3)',
          stroke: '#DC2626',
          strokeWidth: '1px'
        }
      },
      
      orange: {
        solid: {
          fill: '#EA580C',
          stroke: 'none',
          shadow: '0 2px 4px rgba(234, 88, 12, 0.3)'
        },
        outline: {
          fill: 'transparent',
          stroke: '#EA580C',
          strokeWidth: '2px',
          shadow: '0 0 8px rgba(234, 88, 12, 0.5)'
        },
        background: {
          fill: 'rgba(234, 88, 12, 0.3)',
          stroke: '#EA580C',
          strokeWidth: '1px'
        }
      },
      
      yellow: {
        solid: {
          fill: '#FACC15',
          stroke: 'none',
          shadow: '0 2px 4px rgba(250, 204, 21, 0.3)'
        },
        outline: {
          fill: 'transparent',
          stroke: '#FACC15',
          strokeWidth: '2px',
          shadow: '0 0 8px rgba(250, 204, 21, 0.5)'
        },
        background: {
          fill: 'rgba(250, 204, 21, 0.3)',
          stroke: '#FACC15',
          strokeWidth: '1px'
        }
      },
      
      green: {
        solid: {
          fill: '#16A34A',
          stroke: 'none',
          shadow: '0 2px 4px rgba(22, 163, 74, 0.3)',
          glow: '0 0 12px rgba(22, 163, 74, 0.6)' // Special glow for green
        },
        outline: {
          fill: 'transparent',
          stroke: '#16A34A',
          strokeWidth: '2px',
          shadow: '0 0 8px rgba(22, 163, 74, 0.5)',
          glow: '0 0 16px rgba(22, 163, 74, 0.8)'
        },
        background: {
          fill: 'rgba(22, 163, 74, 0.3)',
          stroke: '#16A34A',
          strokeWidth: '1px',
          glow: '0 0 8px rgba(22, 163, 74, 0.4)'
        }
      }
    };
    
    console.log('  ✅ Circle color variants configured');
    console.log('  ✅ Solid/Outline/Background styles defined');
    console.log('  ✅ Green glow effects activated');
  }
  
  /**
   * Initialize layer system (Norse/Westby/Readstown)
   */
  async initializeLayerSystem() {
    console.log('🏔️ Initializing Norse/Westby/Readstown layer system...');
    
    // Layer hierarchy and relationships
    this.layerHierarchy = {
      primary: 'readstown', // Academic/Central layer
      secondary: ['norse', 'westby'], // Supporting layers
      
      interactions: {
        norse_westby: 'Traditional vs Innovation tension',
        norse_readstown: 'Wisdom meets Knowledge',
        westby_readstown: 'Innovation meets Learning'
      },
      
      geographic_distribution: {
        north: 'norse',
        west: 'westby', 
        center: 'readstown',
        overlap_zones: ['norse_readstown', 'westby_readstown']
      }
    };
    
    // Layer-specific status meanings
    this.layerStatusMeanings = {
      norse: {
        red: 'Traditional systems failing',
        orange: 'Heritage under threat',
        yellow: 'Wisdom being processed',
        green: 'Traditional strength operational'
      },
      
      westby: {
        red: 'Innovation blocked',
        orange: 'Frontier challenges present',
        yellow: 'New territories being explored',
        green: 'Innovation flowing freely'
      },
      
      readstown: {
        red: 'Knowledge systems down',
        orange: 'Learning disrupted',
        yellow: 'Education processing',
        green: 'Knowledge systems operational'
      }
    };
    
    console.log('  🏔️ Norse Layer: Traditional/Wisdom (Blue themes)');
    console.log('  🤠 Westby Layer: Innovation/Frontier (Red themes)');
    console.log('  📚 Readstown Layer: Knowledge/Learning (Green themes)');
    console.log('  ✅ Layer interactions and geography mapped');
  }
  
  /**
   * Setup status progression logic
   */
  async setupStatusProgression() {
    console.log('🔄 Setting up status progression logic...');
    
    // Progression algorithms
    this.progressionAlgorithms = {
      automatic: {
        name: 'Automatic Health Check Progression',
        triggers: ['health_check_pass', 'error_resolution', 'system_recovery'],
        rules: [
          'red → orange: When critical errors are resolved',
          'orange → yellow: When warnings are addressed',
          'yellow → green: When all checks pass',
          'green → yellow: When minor issues detected',
          'any → red: When critical failures occur'
        ]
      },
      
      manual: {
        name: 'Manual Status Override',
        triggers: ['admin_override', 'maintenance_mode', 'testing_phase'],
        rules: [
          'Allow direct status setting with justification',
          'Require approval for degrading green status',
          'Log all manual changes for audit'
        ]
      },
      
      conditional: {
        name: 'Conditional Layer-Based Progression',
        triggers: ['layer_status_change', 'geographic_event', 'cross_layer_dependency'],
        rules: [
          'Norse layer affects traditional system status',
          'Westby layer affects innovation system status', 
          'Readstown layer affects knowledge system status',
          'Cross-layer dependencies can cascade status changes'
        ]
      }
    };
    
    // Status change validation
    this.statusValidation = {
      allowedTransitions: {
        red: ['orange', 'yellow'], // Can't go directly to green
        orange: ['red', 'yellow', 'green'],
        yellow: ['orange', 'green'],
        green: ['yellow', 'orange'] // Graceful degradation
      },
      
      requiresApproval: ['green_to_red', 'manual_override'],
      
      autoRevert: {
        enabled: true,
        timeout: 300000, // 5 minutes
        revertTo: 'previous_stable_state'
      }
    };
    
    console.log('  ✅ Automatic progression algorithms configured');
    console.log('  ✅ Manual override capabilities enabled');
    console.log('  ✅ Layer-based conditional logic active');
    console.log('  ✅ Status validation rules established');
  }
  
  /**
   * Build visual rendering engine
   */
  async buildVisualRenderingEngine() {
    console.log('🎬 Building visual rendering engine...');
    
    this.renderingEngine = {
      svg: {
        generateCircle: (status, variant, size = 20, layer = null) => {
          const style = this.circleStyles[status][variant];
          const layerTheme = layer ? this.layerSystem[layer].colors : {};
          
          return `
            <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
              <circle 
                cx="${size/2}" 
                cy="${size/2}" 
                r="${size/2 - 2}"
                fill="${style.fill}"
                stroke="${layerTheme.primary || style.stroke}"
                stroke-width="${style.strokeWidth || 0}"
                filter="${status === 'green' ? 'url(#glow)' : 'url(#shadow)'}"
                class="status-circle ${status} ${variant} ${layer || ''}"
              />
              ${this.generateFilters(status)}
            </svg>
          `;
        }
      },
      
      css: {
        generateStyles: () => {
          return `
            .status-circle {
              transition: all ${this.circleConfig.transitions.duration}ms ${this.circleConfig.transitions.easing};
              cursor: pointer;
            }
            
            .status-circle:hover {
              transform: scale(1.1);
              filter: brightness(1.2);
            }
            
            .status-circle.green {
              animation: pulse-glow 2s infinite ease-in-out;
            }
            
            @keyframes pulse-glow {
              0%, 100% { filter: drop-shadow(0 0 8px currentColor); }
              50% { filter: drop-shadow(0 0 16px currentColor); }
            }
            
            .status-circle.changing {
              animation: status-change 0.6s ease-in-out;
            }
            
            @keyframes status-change {
              0% { transform: scale(1); }
              50% { transform: scale(1.3); opacity: 0.7; }
              100% { transform: scale(1); }
            }
          `;
        }
      },
      
      html: {
        generateStatusIndicator: (id, status, variant, layer, metadata = {}) => {
          const circle = this.renderingEngine.svg.generateCircle(status, variant, 24, layer);
          const layerInfo = layer ? this.layerSystem[layer] : {};
          const statusMeaning = layer ? this.layerStatusMeanings[layer][status] : this.statusRules[status].meaning;
          
          return `
            <div class="status-indicator" data-id="${id}" data-layer="${layer || 'none'}">
              ${circle}
              <div class="status-tooltip">
                <div class="status-info">
                  <strong>${statusMeaning}</strong>
                  ${layer ? `<br>Layer: ${layerInfo.name}` : ''}
                  ${metadata.description ? `<br>${metadata.description}` : ''}
                </div>
                <div class="status-actions">
                  <button onclick="changeStatus('${id}', 'next')">Advance</button>
                  <button onclick="showDetails('${id}')">Details</button>
                </div>
              </div>
            </div>
          `;
        }
      }
    };
    
    console.log('  ✅ SVG circle generator ready');
    console.log('  ✅ CSS animation styles configured');
    console.log('  ✅ HTML component templates created');
    console.log('  ✅ Interactive tooltip system enabled');
  }
  
  /**
   * Setup geographic layer mapping
   */
  async setupGeographicLayerMapping() {
    console.log('🗺️ Setting up geographic layer mapping...');
    
    this.geographicMapping = {
      territories: {
        north: {
          layer: 'norse',
          zones: ['northern_territories', 'traditional_strongholds', 'wisdom_centers'],
          characteristics: ['stable', 'traditional', 'strong']
        },
        
        west: {
          layer: 'westby',
          zones: ['western_frontier', 'innovation_hubs', 'exploration_zones'],
          characteristics: ['dynamic', 'innovative', 'expanding']
        },
        
        center: {
          layer: 'readstown',
          zones: ['academic_centers', 'knowledge_hubs', 'learning_districts'],
          characteristics: ['educated', 'connected', 'communicative']
        }
      },
      
      statusByGeography: {
        calculateRegionalStatus: (territory) => {
          const regions = this.geographicMapping.territories[territory].zones;
          const statuses = regions.map(zone => this.getZoneStatus(zone));
          
          // Aggregate regional status
          const criticalCount = statuses.filter(s => s === 'red').length;
          const warningCount = statuses.filter(s => s === 'orange').length;
          const processingCount = statuses.filter(s => s === 'yellow').length;
          const operationalCount = statuses.filter(s => s === 'green').length;
          
          if (criticalCount > 0) return 'red';
          if (warningCount > statuses.length / 2) return 'orange';
          if (processingCount > 0) return 'yellow';
          return 'green';
        }
      }
    };
    
    console.log('  🏔️ Northern territories (Norse) mapped');
    console.log('  🤠 Western frontier (Westby) mapped');
    console.log('  📚 Central academic (Readstown) mapped');
    console.log('  ✅ Regional status aggregation configured');
  }
  
  /**
   * Create status circle with progression logic
   */
  createStatusCircle(id, options = {}) {
    const {
      initialStatus = 'red',
      variant = 'solid',
      layer = null,
      autoProgress = true,
      metadata = {}
    } = options;
    
    const statusCircle = {
      id,
      currentStatus: initialStatus,
      variant,
      layer,
      autoProgress,
      metadata,
      
      // Status history
      history: [{
        status: initialStatus,
        timestamp: new Date(),
        trigger: 'creation',
        layer
      }],
      
      // Progress tracking
      progressionTarget: 'green',
      progressionPath: this.calculateProgressionPath(initialStatus, 'green'),
      
      // Visual properties
      visual: {
        size: 24,
        animated: true,
        glowOnGreen: true,
        pulseOnChange: true
      }
    };
    
    // Store the circle
    this.activeStatuses.set(id, statusCircle);
    
    // Map to layer if specified
    if (layer) {
      if (!this.layerMappings.has(layer)) {
        this.layerMappings.set(layer, new Set());
      }
      this.layerMappings.get(layer).add(id);
    }
    
    console.log(`🎨 Created status circle: ${id} (${initialStatus} ${variant}${layer ? ` in ${layer} layer` : ''})`);
    
    this.emit('statusCircleCreated', {
      id,
      status: initialStatus,
      variant,
      layer,
      statusCircle
    });
    
    return statusCircle;
  }
  
  /**
   * Change status with validation and animation
   */
  async changeStatus(id, newStatus, trigger = 'manual', options = {}) {
    const statusCircle = this.activeStatuses.get(id);
    if (!statusCircle) {
      throw new Error(`Status circle ${id} not found`);
    }
    
    const currentStatus = statusCircle.currentStatus;
    
    // Validate transition
    const allowedTransitions = this.statusValidation.allowedTransitions[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid transition: ${currentStatus} → ${newStatus}`);
    }
    
    // Check if approval required
    const transitionKey = `${currentStatus}_to_${newStatus}`;
    if (this.statusValidation.requiresApproval.includes(transitionKey)) {
      if (!options.approved) {
        throw new Error(`Transition ${currentStatus} → ${newStatus} requires approval`);
      }
    }
    
    // Update status
    statusCircle.currentStatus = newStatus;
    statusCircle.history.push({
      status: newStatus,
      previousStatus: currentStatus,
      timestamp: new Date(),
      trigger,
      layer: statusCircle.layer
    });
    
    // Trigger visual update
    await this.updateVisualStatus(id, newStatus, currentStatus);
    
    // Check for layer-wide effects
    if (statusCircle.layer) {
      await this.checkLayerEffects(statusCircle.layer);
    }
    
    console.log(`🔄 Status changed: ${id} (${currentStatus} → ${newStatus}) [${trigger}]`);
    
    this.emit('statusChanged', {
      id,
      previousStatus: currentStatus,
      newStatus,
      trigger,
      layer: statusCircle.layer,
      statusCircle
    });
    
    return statusCircle;
  }
  
  /**
   * Auto-progress status based on conditions
   */
  async autoProgressStatus(id, conditions = {}) {
    const statusCircle = this.activeStatuses.get(id);
    if (!statusCircle || !statusCircle.autoProgress) {
      return false;
    }
    
    const currentStatus = statusCircle.currentStatus;
    const targetStatus = this.determineNextStatus(currentStatus, conditions);
    
    if (targetStatus && targetStatus !== currentStatus) {
      await this.changeStatus(id, targetStatus, 'auto_progress', { conditions });
      return true;
    }
    
    return false;
  }
  
  /**
   * Determine next status based on conditions
   */
  determineNextStatus(currentStatus, conditions) {
    const rules = this.statusRules[currentStatus];
    
    // Check conditions against status rules
    const meetsRequirements = this.checkStatusRequirements(currentStatus, conditions);
    
    if (meetsRequirements) {
      // Progress toward green
      const progression = this.circleConfig.statusProgression;
      const currentIndex = progression.indexOf(currentStatus);
      
      if (currentIndex < progression.length - 1) {
        return progression[currentIndex + 1];
      }
    }
    
    return null;
  }
  
  /**
   * Check if conditions meet status requirements
   */
  checkStatusRequirements(status, conditions) {
    const rules = this.statusRules[status];
    
    // Simple condition checking (would be more sophisticated in real implementation)
    switch (status) {
      case 'red':
        return conditions.criticalErrorsResolved === true;
      case 'orange':
        return conditions.warningsAddressed === true;
      case 'yellow':
        return conditions.processingComplete === true;
      case 'green':
        return conditions.maintenanceRequired !== true;
      default:
        return false;
    }
  }
  
  /**
   * Update visual status with animation
   */
  async updateVisualStatus(id, newStatus, previousStatus) {
    const statusCircle = this.activeStatuses.get(id);
    
    // Generate new visual
    const newVisual = this.renderingEngine.html.generateStatusIndicator(
      id,
      newStatus,
      statusCircle.variant,
      statusCircle.layer,
      statusCircle.metadata
    );
    
    // Store visual element
    this.visualElements.set(id, {
      html: newVisual,
      svg: this.renderingEngine.svg.generateCircle(
        newStatus,
        statusCircle.variant,
        statusCircle.visual.size,
        statusCircle.layer
      ),
      timestamp: new Date()
    });
    
    console.log(`  🎨 Visual updated: ${id} (${previousStatus} → ${newStatus})`);
  }
  
  /**
   * Check layer-wide effects
   */
  async checkLayerEffects(layer) {
    const layerCircles = this.layerMappings.get(layer);
    if (!layerCircles) return;
    
    const statuses = Array.from(layerCircles).map(id => {
      const circle = this.activeStatuses.get(id);
      return circle ? circle.currentStatus : null;
    }).filter(Boolean);
    
    // Calculate layer health
    const layerHealth = this.calculateLayerHealth(statuses);
    
    console.log(`  🏔️ Layer ${layer} health: ${layerHealth}`);
    
    this.emit('layerHealthUpdate', {
      layer,
      health: layerHealth,
      statuses,
      circleCount: layerCircles.size
    });
  }
  
  /**
   * Calculate layer health based on circle statuses
   */
  calculateLayerHealth(statuses) {
    const weights = { red: 0, orange: 0.3, yellow: 0.7, green: 1.0 };
    const totalWeight = statuses.reduce((sum, status) => sum + weights[status], 0);
    const averageHealth = totalWeight / statuses.length;
    
    if (averageHealth >= 0.8) return 'excellent';
    if (averageHealth >= 0.6) return 'good';
    if (averageHealth >= 0.4) return 'fair';
    if (averageHealth >= 0.2) return 'poor';
    return 'critical';
  }
  
  /**
   * Calculate progression path from current to target status
   */
  calculateProgressionPath(currentStatus, targetStatus) {
    const progression = this.circleConfig.statusProgression;
    const currentIndex = progression.indexOf(currentStatus);
    const targetIndex = progression.indexOf(targetStatus);
    
    if (currentIndex === -1 || targetIndex === -1) {
      return [];
    }
    
    if (currentIndex < targetIndex) {
      return progression.slice(currentIndex + 1, targetIndex + 1);
    } else {
      return progression.slice(targetIndex, currentIndex).reverse();
    }
  }
  
  /**
   * Generate SVG filters for effects
   */
  generateFilters(status) {
    return `
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    `;
  }
  
  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      circleSystem: {
        totalCircles: this.activeStatuses.size,
        statusCounts: this.getStatusCounts(),
        layerDistribution: this.getLayerDistribution()
      },
      
      layerSystem: {
        activeLayers: Array.from(this.layerMappings.keys()),
        layerHealth: this.getLayerHealthSummary(),
        geographicCoverage: Object.keys(this.geographicMapping.territories)
      },
      
      progression: {
        autoProgressEnabled: true,
        validationRules: Object.keys(this.statusValidation.allowedTransitions).length,
        visualEffects: ['glow', 'pulse', 'transitions', 'hover']
      },
      
      features: [
        '✅ Red → Orange → Yellow → Green progression',
        '✅ Solid/Outline/Background variants',
        '✅ Norse/Westby/Readstown layer system',
        '✅ Geographic territory mapping',
        '✅ Automatic status progression',
        '✅ Visual animations and effects',
        '✅ Layer health monitoring',
        '✅ Interactive tooltips and controls'
      ]
    };
  }
  
  /**
   * Get status counts across all circles
   */
  getStatusCounts() {
    const counts = { red: 0, orange: 0, yellow: 0, green: 0 };
    
    this.activeStatuses.forEach(circle => {
      counts[circle.currentStatus]++;
    });
    
    return counts;
  }
  
  /**
   * Get layer distribution
   */
  getLayerDistribution() {
    const distribution = {};
    
    this.layerMappings.forEach((circles, layer) => {
      distribution[layer] = circles.size;
    });
    
    return distribution;
  }
  
  /**
   * Get layer health summary
   */
  getLayerHealthSummary() {
    const summary = {};
    
    this.layerMappings.forEach((circles, layer) => {
      const statuses = Array.from(circles).map(id => {
        const circle = this.activeStatuses.get(id);
        return circle ? circle.currentStatus : null;
      }).filter(Boolean);
      
      summary[layer] = this.calculateLayerHealth(statuses);
    });
    
    return summary;
  }
}

// Export the system
if (require.main === module) {
  console.log('🎨 INITIALIZING VISUAL STATUS CIRCLE SYSTEM...\n');
  
  const visualSystem = new VisualStatusCircleSystem();
  
  visualSystem.on('visualSystemReady', async () => {
    console.log('🎨 VISUAL STATUS CIRCLE SYSTEM STATUS:');
    console.log('=====================================');
    
    const status = visualSystem.getSystemStatus();
    
    console.log('\n🔴 STATUS PROGRESSION:');
    console.log('  Red → Orange → Yellow → Green');
    console.log('  Variants: Solid, Outline, Background');
    console.log('  Animation: Transitions, Glow, Pulse');
    
    console.log('\n🏔️ LAYER SYSTEM:');
    console.log('  Norse Layer: Traditional/Wisdom (Blue)');
    console.log('  Westby Layer: Innovation/Frontier (Red)');
    console.log('  Readstown Layer: Knowledge/Learning (Green)');
    
    console.log('\n🎯 VISUAL FEATURES:');
    status.features.forEach(feature => {
      console.log(`  ${feature}`);
    });
    
    console.log('\n🚀 CREATING DEMO STATUS CIRCLES...');
    
    try {
      // Create demo circles in different layers
      const norseCircle = visualSystem.createStatusCircle('norse-system-1', {
        initialStatus: 'red',
        variant: 'solid',
        layer: 'norse',
        metadata: { description: 'Traditional system status' }
      });
      
      const westbyCircle = visualSystem.createStatusCircle('westby-innovation-1', {
        initialStatus: 'orange',
        variant: 'outline',
        layer: 'westby',
        metadata: { description: 'Innovation hub status' }
      });
      
      const readstownCircle = visualSystem.createStatusCircle('readstown-knowledge-1', {
        initialStatus: 'yellow',
        variant: 'background',
        layer: 'readstown',
        metadata: { description: 'Knowledge center status' }
      });
      
      console.log('\n✅ Demo circles created:');
      console.log(`  🔴 Norse system (red solid)`);
      console.log(`  🟠 Westby innovation (orange outline)`);
      console.log(`  🟡 Readstown knowledge (yellow background)`);
      
      // Demo progression
      console.log('\n🔄 Testing status progression...');
      await visualSystem.changeStatus('readstown-knowledge-1', 'green', 'demo_progression');
      console.log('  ✅ Readstown circle: yellow → green');
      
      // Show final status
      const finalStatus = visualSystem.getSystemStatus();
      console.log('\n📊 FINAL STATUS:');
      console.log(`  Total circles: ${finalStatus.circleSystem.totalCircles}`);
      console.log(`  Status counts:`, finalStatus.circleSystem.statusCounts);
      console.log(`  Layer health:`, finalStatus.layerSystem.layerHealth);
      
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
    }
  });
}

module.exports = VisualStatusCircleSystem;