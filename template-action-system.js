#!/usr/bin/env node

/**
 * TEMPLATE ACTION SYSTEM
 * Dynamic template + action composition system
 * Create, test, and deploy character abilities
 */

console.log(`
⚡ TEMPLATE ACTION SYSTEM ACTIVE ⚡
Compose abilities → Test in shadow → Deploy to production
`);

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const ShadowPlaytestSystem = require('./shadow-playtest-system');

class TemplateActionSystem extends EventEmitter {
  constructor() {
    super();
    this.templates = new Map();
    this.actions = new Map();
    this.compositions = new Map();
    this.deployments = new Map();
    this.validations = new Map();
    this.shadowPlaytest = new ShadowPlaytestSystem();
    
    this.initializeTemplates();
    this.initializeActions();
    this.createCompositionEngine();
    this.setupValidation();
    this.initializeDeployment();
  }

  initializeTemplates() {
    // Base templates for different action types
    this.templates.set('combat-action', {
      id: 'combat-action',
      name: 'Combat Action Template',
      category: 'combat',
      slots: {
        trigger: { type: 'event', required: true },
        effect: { type: 'function', required: true },
        damage: { type: 'number', default: 0 },
        cooldown: { type: 'number', default: 1000 },
        animation: { type: 'string', default: 'default' }
      },
      validation: {
        damage: (val) => val >= 0 && val <= 9999,
        cooldown: (val) => val >= 0
      }
    });

    this.templates.set('utility-action', {
      id: 'utility-action',
      name: 'Utility Action Template',
      category: 'utility',
      slots: {
        trigger: { type: 'event', required: true },
        effect: { type: 'function', required: true },
        duration: { type: 'number', default: 0 },
        stackable: { type: 'boolean', default: false },
        resource: { type: 'object', default: {} }
      }
    });

    this.templates.set('passive-ability', {
      id: 'passive-ability',
      name: 'Passive Ability Template',
      category: 'passive',
      slots: {
        condition: { type: 'function', required: true },
        modifier: { type: 'object', required: true },
        priority: { type: 'number', default: 0 },
        conflicts: { type: 'array', default: [] }
      }
    });

    this.templates.set('ultimate-action', {
      id: 'ultimate-action',
      name: 'Ultimate Action Template',
      category: 'ultimate',
      slots: {
        chargeRequired: { type: 'number', default: 100 },
        effect: { type: 'function', required: true },
        globalEffect: { type: 'boolean', default: false },
        cinematics: { type: 'object', default: {} },
        voiceLine: { type: 'string', default: '' }
      }
    });

    this.templates.set('reaction-action', {
      id: 'reaction-action',
      name: 'Reaction Action Template',
      category: 'reaction',
      slots: {
        triggerCondition: { type: 'function', required: true },
        reaction: { type: 'function', required: true },
        priority: { type: 'number', default: 0 },
        consumesReaction: { type: 'boolean', default: true }
      }
    });

    this.templates.set('transformation-action', {
      id: 'transformation-action',
      name: 'Transformation Action Template',
      category: 'transformation',
      slots: {
        transformInto: { type: 'string', required: true },
        duration: { type: 'number', default: -1 },
        statsModifier: { type: 'object', required: true },
        abilities: { type: 'array', default: [] },
        revertCondition: { type: 'function', default: null }
      }
    });

    console.log('📋 Templates initialized:', this.templates.size);
  }

  initializeActions() {
    // Pre-built actions that can be composed
    
    // Ralph actions
    this.actions.set('bash-base', {
      id: 'bash-base',
      name: 'Basic Bash',
      template: 'combat-action',
      character: 'ralph',
      data: {
        trigger: 'on-command',
        effect: async (ctx) => {
          return { 
            damage: 100 * (ctx.chaosLevel || 1), 
            message: 'BASH!' 
          };
        },
        damage: 100,
        cooldown: 0,
        animation: 'bash-swing'
      }
    });

    this.actions.set('chaos-aura', {
      id: 'chaos-aura',
      name: 'Chaos Aura',
      template: 'passive-ability',
      character: 'ralph',
      data: {
        condition: (ctx) => ctx.character === 'ralph',
        modifier: {
          chaosLevel: '+50%',
          guardianResistance: '-25%',
          realityStability: '-10%'
        },
        priority: 100
      }
    });

    // Alice actions
    this.actions.set('analyze-pattern', {
      id: 'analyze-pattern',
      name: 'Pattern Analysis',
      template: 'utility-action',
      character: 'alice',
      data: {
        trigger: 'on-observe',
        effect: async (ctx) => {
          const patterns = await ctx.scanPatterns();
          return {
            patterns: patterns.length,
            predictions: patterns.map(p => p.nextState)
          };
        },
        duration: 5000,
        resource: { focus: 10 }
      }
    });

    this.actions.set('probability-shield', {
      id: 'probability-shield',
      name: 'Probability Shield',
      template: 'reaction-action',
      character: 'alice',
      data: {
        triggerCondition: (ctx) => ctx.incomingDamage > 50,
        reaction: async (ctx) => {
          const dodgeChance = 0.3 + (ctx.intelligence * 0.01);
          if (Math.random() < dodgeChance) {
            return { dodged: true, damage: 0 };
          }
          return { dodged: false };
        },
        priority: 50
      }
    });

    // Bob actions
    this.actions.set('instant-build', {
      id: 'instant-build',
      name: 'Instant Construction',
      template: 'utility-action',
      character: 'bob',
      data: {
        trigger: 'on-design',
        effect: async (ctx) => {
          const structure = ctx.buildStructure(ctx.blueprint);
          return {
            built: structure.id,
            quality: 100,
            time: 0
          };
        },
        duration: 0,
        resource: { materials: 50 }
      }
    });

    // Charlie actions
    this.actions.set('guardian-stance', {
      id: 'guardian-stance',
      name: 'Guardian Stance',
      template: 'transformation-action',
      character: 'charlie',
      data: {
        transformInto: 'guardian-prime',
        duration: 30000,
        statsModifier: {
          defense: '*3',
          speed: '*0.5',
          ralphResistance: '+100%'
        },
        abilities: ['absolute-defense', 'guardian-taunt', 'ralph-containment'],
        revertCondition: (ctx) => ctx.threatsContained
      }
    });

    // System actions
    this.actions.set('template-test', {
      id: 'template-test',
      name: 'Template Test Action',
      template: 'utility-action',
      character: 'system',
      data: {
        trigger: 'on-test',
        effect: async (ctx) => {
          return {
            tested: true,
            templateValid: true,
            timestamp: Date.now()
          };
        }
      }
    });

    console.log('⚡ Actions loaded:', this.actions.size);
  }

  createCompositionEngine() {
    // Engine for composing templates and actions
    this.compositionEngine = {
      // Compose action from template
      compose: (templateId, actionData) => {
        const template = this.templates.get(templateId);
        if (!template) {
          throw new Error(`Template ${templateId} not found`);
        }

        const composition = {
          id: crypto.randomUUID(),
          template: templateId,
          created: new Date(),
          data: {}
        };

        // Fill template slots
        for (const [slot, config] of Object.entries(template.slots)) {
          if (config.required && !actionData[slot]) {
            throw new Error(`Required slot '${slot}' not provided`);
          }
          
          composition.data[slot] = actionData[slot] || config.default;
          
          // Validate if validator exists
          if (template.validation && template.validation[slot]) {
            if (!template.validation[slot](composition.data[slot])) {
              throw new Error(`Validation failed for slot '${slot}'`);
            }
          }
        }

        return composition;
      },

      // Merge multiple actions
      merge: (actionIds) => {
        const actions = actionIds.map(id => this.actions.get(id)).filter(Boolean);
        
        if (actions.length === 0) {
          throw new Error('No valid actions to merge');
        }

        const merged = {
          id: crypto.randomUUID(),
          name: `Merged Action (${actions.map(a => a.name).join(' + ')})`,
          template: 'composite',
          data: {
            components: actions.map(a => a.id),
            effects: actions.map(a => a.data.effect),
            combinedStats: this.combineStats(actions)
          }
        };

        return merged;
      },

      // Mutate existing action
      mutate: (actionId, mutations) => {
        const action = this.actions.get(actionId);
        if (!action) {
          throw new Error(`Action ${actionId} not found`);
        }

        const mutated = {
          ...action,
          id: `${action.id}-mutated-${Date.now()}`,
          name: `${action.name} (Mutated)`,
          data: { ...action.data }
        };

        // Apply mutations
        for (const [key, value] of Object.entries(mutations)) {
          if (typeof value === 'function') {
            mutated.data[key] = value(mutated.data[key]);
          } else {
            mutated.data[key] = value;
          }
        }

        return mutated;
      },

      // Create combo action
      createCombo: (sequence) => {
        return {
          id: crypto.randomUUID(),
          name: 'Combo Action',
          template: 'combo',
          data: {
            sequence: sequence.map(s => ({
              action: s.action,
              timing: s.timing || 0,
              condition: s.condition || (() => true)
            })),
            comboMultiplier: 1 + (sequence.length * 0.25)
          }
        };
      }
    };

    console.log('🔧 Composition engine ready');
  }

  setupValidation() {
    // Validation rules for actions
    this.validators = {
      // Check if action is valid
      validateAction: (action) => {
        const errors = [];
        
        if (!action.id) errors.push('Action must have an ID');
        if (!action.template) errors.push('Action must have a template');
        if (!action.data) errors.push('Action must have data');
        
        const template = this.templates.get(action.template);
        if (!template) {
          errors.push(`Template ${action.template} not found`);
          return { valid: false, errors };
        }
        
        // Check required slots
        for (const [slot, config] of Object.entries(template.slots)) {
          if (config.required && !action.data[slot]) {
            errors.push(`Required slot '${slot}' missing`);
          }
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      },

      // Check balance
      checkBalance: (action) => {
        const metrics = {
          powerLevel: 0,
          resourceCost: 0,
          cooldownRatio: 1
        };
        
        // Calculate power level
        if (action.data.damage) {
          metrics.powerLevel += action.data.damage / 100;
        }
        
        if (action.data.cooldown) {
          metrics.cooldownRatio = action.data.damage / action.data.cooldown;
        }
        
        // Balance score
        const balanceScore = Math.min(100, Math.max(0, 
          100 - Math.abs(metrics.powerLevel - 5) * 20
        ));
        
        return {
          metrics,
          balanceScore,
          balanced: balanceScore > 70,
          suggestions: this.getBalanceSuggestions(metrics)
        };
      },

      // Check compatibility
      checkCompatibility: (action, character) => {
        const compatible = {
          character: true,
          system: true,
          conflicts: []
        };
        
        // Character-specific checks
        if (action.character && action.character !== character) {
          compatible.character = false;
        }
        
        // Check for conflicts
        this.actions.forEach((existing, id) => {
          if (existing.data.conflicts?.includes(action.id)) {
            compatible.conflicts.push(id);
          }
        });
        
        return compatible;
      }
    };

    console.log('✅ Validation system ready');
  }

  initializeDeployment() {
    // Deployment system for tested actions
    this.deploymentSystem = {
      // Deploy to production
      deploy: async (actionId, target = 'production') => {
        const action = this.compositions.get(actionId) || this.actions.get(actionId);
        if (!action) {
          throw new Error('Action not found');
        }

        // Validate before deployment
        const validation = this.validators.validateAction(action);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Test in shadow realm first
        console.log('🧪 Testing in shadow realm...');
        const testResult = await this.testInShadow(action);
        
        if (!testResult.passed) {
          throw new Error(`Shadow test failed: ${testResult.error}`);
        }

        // Deploy
        const deployment = {
          id: crypto.randomUUID(),
          actionId: action.id,
          target,
          version: '1.0.0',
          deployed: new Date(),
          status: 'active'
        };

        this.deployments.set(deployment.id, deployment);
        
        console.log(`✅ Deployed ${action.name} to ${target}`);
        return deployment;
      },

      // Rollback deployment
      rollback: async (deploymentId) => {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
          throw new Error('Deployment not found');
        }

        deployment.status = 'rolled-back';
        deployment.rolledBack = new Date();
        
        console.log(`↩️ Rolled back deployment ${deploymentId}`);
        return deployment;
      },

      // Hot reload action
      hotReload: async (actionId, changes) => {
        console.log(`🔄 Hot reloading ${actionId}...`);
        
        const action = this.actions.get(actionId);
        if (!action) {
          throw new Error('Action not found');
        }

        // Apply changes
        const updated = { ...action, data: { ...action.data, ...changes } };
        
        // Test changes
        const testResult = await this.testInShadow(updated);
        if (!testResult.passed) {
          console.error('❌ Hot reload failed tests');
          return false;
        }

        // Update action
        this.actions.set(actionId, updated);
        
        console.log('✅ Hot reload successful');
        return true;
      }
    };

    console.log('🚀 Deployment system ready');
  }

  // Test action in shadow realm
  async testInShadow(action) {
    try {
      // Create shadow session
      const session = await this.shadowPlaytest.createPlaytestSession({
        realm: 'sandbox',
        environment: 'unit-test'
      });

      // Execute action
      const result = await this.shadowPlaytest.executeAction(
        session.id,
        action.id,
        { test: true }
      );

      return {
        passed: true,
        result,
        sessionId: session.id
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  // Helper functions
  combineStats(actions) {
    const combined = {};
    
    actions.forEach(action => {
      if (action.data.damage) {
        combined.damage = (combined.damage || 0) + action.data.damage;
      }
      if (action.data.cooldown) {
        combined.cooldown = Math.max(combined.cooldown || 0, action.data.cooldown);
      }
    });
    
    return combined;
  }

  getBalanceSuggestions(metrics) {
    const suggestions = [];
    
    if (metrics.powerLevel > 10) {
      suggestions.push('Reduce damage or add resource cost');
    }
    if (metrics.cooldownRatio > 1) {
      suggestions.push('Increase cooldown time');
    }
    
    return suggestions;
  }

  // Get system status
  getSystemStatus() {
    return {
      templates: this.templates.size,
      actions: this.actions.size,
      compositions: this.compositions.size,
      deployments: Array.from(this.deployments.values()).filter(d => d.status === 'active').length,
      categories: Array.from(new Set(Array.from(this.templates.values()).map(t => t.category)))
    };
  }

  // CLI interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'list':
        const type = args[1] || 'all';
        
        if (type === 'templates' || type === 'all') {
          console.log('\n📋 Templates:');
          this.templates.forEach(template => {
            console.log(`  ${template.id}: ${template.name} (${template.category})`);
          });
        }
        
        if (type === 'actions' || type === 'all') {
          console.log('\n⚡ Actions:');
          this.actions.forEach(action => {
            console.log(`  ${action.id}: ${action.name} (${action.character || 'system'})`);
          });
        }
        
        if (type === 'deployments' || type === 'all') {
          console.log('\n🚀 Active Deployments:');
          this.deployments.forEach(dep => {
            if (dep.status === 'active') {
              console.log(`  ${dep.id}: ${dep.actionId} → ${dep.target}`);
            }
          });
        }
        break;

      case 'compose':
        const templateId = args[1];
        const dataJson = args[2];
        
        if (!templateId || !dataJson) {
          console.error('Usage: compose <templateId> <jsonData>');
          return;
        }
        
        try {
          const data = JSON.parse(dataJson);
          const composition = this.compositionEngine.compose(templateId, data);
          
          this.compositions.set(composition.id, composition);
          
          console.log('\n✅ Composition created:');
          console.log(JSON.stringify(composition, null, 2));
        } catch (error) {
          console.error('❌ Composition failed:', error.message);
        }
        break;

      case 'test':
        const actionId = args[1];
        
        if (!actionId) {
          console.error('Usage: test <actionId>');
          return;
        }
        
        const action = this.actions.get(actionId) || this.compositions.get(actionId);
        if (!action) {
          console.error('Action not found');
          return;
        }
        
        console.log(`\n🧪 Testing ${action.name}...`);
        const result = await this.testInShadow(action);
        
        if (result.passed) {
          console.log('✅ Test passed!');
          console.log('Result:', JSON.stringify(result.result, null, 2));
        } else {
          console.log('❌ Test failed:', result.error);
        }
        break;

      case 'deploy':
        const deployActionId = args[1];
        const target = args[2] || 'production';
        
        if (!deployActionId) {
          console.error('Usage: deploy <actionId> [target]');
          return;
        }
        
        try {
          const deployment = await this.deploymentSystem.deploy(deployActionId, target);
          console.log(`\nDeployment ID: ${deployment.id}`);
        } catch (error) {
          console.error('❌ Deployment failed:', error.message);
        }
        break;

      case 'balance':
        const checkActionId = args[1];
        
        if (!checkActionId) {
          console.error('Usage: balance <actionId>');
          return;
        }
        
        const checkAction = this.actions.get(checkActionId);
        if (!checkAction) {
          console.error('Action not found');
          return;
        }
        
        const balance = this.validators.checkBalance(checkAction);
        console.log('\n⚖️ Balance Check:');
        console.log(`  Score: ${balance.balanceScore}/100`);
        console.log(`  Status: ${balance.balanced ? 'BALANCED' : 'UNBALANCED'}`);
        
        if (balance.suggestions.length > 0) {
          console.log('  Suggestions:');
          balance.suggestions.forEach(s => console.log(`    - ${s}`));
        }
        break;

      case 'demo':
        console.log('\n🎮 Template Action Demo\n');
        
        // Create custom bash action
        console.log('1️⃣ Creating custom Ralph action...');
        const customBash = this.compositionEngine.compose('combat-action', {
          trigger: 'on-rage',
          effect: async (ctx) => ({
            damage: 500,
            message: 'ULTIMATE BASH OF CHAOS!',
            sideEffects: ['screen-shake', 'reality-crack']
          }),
          damage: 500,
          cooldown: 5000,
          animation: 'mega-bash-ultimate'
        });
        
        this.compositions.set(customBash.id, {
          ...customBash,
          name: 'Ultimate Chaos Bash',
          character: 'ralph'
        });
        
        console.log('✅ Created:', customBash.id);
        
        // Test it
        console.log('\n2️⃣ Testing in shadow realm...');
        const testResult = await this.testInShadow(customBash);
        console.log('Test result:', testResult.passed ? 'PASSED' : 'FAILED');
        
        // Create combo
        console.log('\n3️⃣ Creating combo action...');
        const combo = this.compositionEngine.createCombo([
          { action: 'bash-base', timing: 0 },
          { action: 'chaos-aura', timing: 500 },
          { action: customBash.id, timing: 1000 }
        ]);
        
        console.log('✅ Combo created:', combo.name);
        
        // Check balance
        console.log('\n4️⃣ Checking balance...');
        const balanceCheck = this.validators.checkBalance({
          data: { damage: 500, cooldown: 5000 }
        });
        console.log('Balance score:', balanceCheck.balanceScore);
        
        console.log('\n✅ Demo complete!');
        break;

      default:
        console.log(`
⚡ Template Action System

Usage:
  node template-action-system.js list [type]           # List items
  node template-action-system.js compose <template> <data>  # Create action
  node template-action-system.js test <actionId>      # Test in shadow
  node template-action-system.js deploy <actionId>    # Deploy action
  node template-action-system.js balance <actionId>   # Check balance
  node template-action-system.js demo                 # Run demo

Templates:
  combat-action    - Combat abilities
  utility-action   - Utility abilities
  passive-ability  - Passive effects
  ultimate-action  - Ultimate abilities
  reaction-action  - Reaction triggers
  transformation   - Form changes

Examples:
  compose combat-action '{"trigger":"on-click","effect":"bash","damage":150}'
  test bash-base
  deploy ultimate-chaos-bash production
  balance mega-bash

Features:
  - Template-based action creation
  - Shadow realm testing
  - Balance checking
  - Hot reload support
  - Combo creation
  - Deployment management
        `);
    }
  }
}

// Export for use as module
module.exports = TemplateActionSystem;

// Run CLI if called directly
if (require.main === module) {
  const system = new TemplateActionSystem();
  system.cli().catch(console.error);
}