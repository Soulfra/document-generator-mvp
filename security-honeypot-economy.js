#!/usr/bin/env node

/**
 * SECURITY HONEYPOT ECONOMY
 * Gamified pen testing where security firms pay per attempt
 * Monthly bills = when they give up
 * Dynamic pricing based on all economies aligning
 */

const fs = require('fs').promises;
const crypto = require('crypto');
const { EventEmitter } = require('events');

console.log(`
🍯🔐 SECURITY HONEYPOT ECONOMY 🔐🍯
Pen Test → Pay Per Attempt → Honeypot Layers → Give Up = Monthly Bill → API Upsell
`);

class SecurityHoneypotEconomy extends EventEmitter {
  constructor() {
    super();
    this.honeypotLayers = new Map();
    this.attackVectors = new Map();
    this.penTestSessions = new Map();
    this.billingAccounts = new Map();
    this.economyAlignments = new Map();
    this.honeypotTraps = new Map();
    this.apiPricingTiers = new Map();
    this.securityFirmProfiles = new Map();
    
    this.initializeHoneypotEconomy();
  }

  async initializeHoneypotEconomy() {
    console.log('🍯 Initializing security honeypot economy...');
    
    // Create deceptive honeypot layers
    await this.createHoneypotLayers();
    
    // Set up attack vector pricing
    await this.setupAttackVectorPricing();
    
    // Initialize billing system
    await this.initializeBillingSystem();
    
    // Create economy alignment tracking
    await this.createEconomyAlignmentSystem();
    
    // Set up honeypot traps and games
    await this.setupHoneypotTraps();
    
    // Initialize API pricing tiers
    await this.initializeAPIPricing();
    
    // Create security firm profiles
    await this.createSecurityFirmProfiles();
    
    console.log('✅ Security honeypot economy ready - let the games begin!');
  }

  async createHoneypotLayers() {
    console.log('🍯 Creating deceptive honeypot layers...');
    
    const honeypotLayerDefinitions = {
      'surface_web_facade': {
        layer_depth: 1,
        description: 'Looks like a normal vulnerable web app',
        deception_elements: [
          'fake_sql_injection_points',
          'dummy_api_endpoints',
          'decoy_admin_panels',
          'misleading_error_messages'
        ],
        time_sink_factor: 2, // 2x time to realize it's fake
        cost_per_probe: 0.05,
        psychological_effect: 'initial_confidence',
        fake_vulnerabilities: {
          'sql_injection': { looks_real: 0.9, actual_risk: 0 },
          'xss_vectors': { looks_real: 0.85, actual_risk: 0 },
          'weak_auth': { looks_real: 0.95, actual_risk: 0 }
        }
      },
      
      'api_maze_layer': {
        layer_depth: 2,
        description: 'Endless API endpoints that lead nowhere',
        deception_elements: [
          'recursive_api_loops',
          'rate_limit_honeypots',
          'fake_data_endpoints',
          'phantom_microservices'
        ],
        time_sink_factor: 5,
        cost_per_probe: 0.10,
        psychological_effect: 'growing_frustration',
        fake_vulnerabilities: {
          'api_key_leak': { looks_real: 0.8, actual_risk: 0 },
          'idor_vulnerabilities': { looks_real: 0.7, actual_risk: 0 },
          'graphql_introspection': { looks_real: 0.9, actual_risk: 0 }
        }
      },
      
      'quantum_encryption_illusion': {
        layer_depth: 3,
        description: 'Fake quantum encryption that wastes computational resources',
        deception_elements: [
          'pseudo_quantum_algorithms',
          'infinite_key_rotation',
          'false_entropy_sources',
          'decoy_quantum_states'
        ],
        time_sink_factor: 10,
        cost_per_probe: 0.25,
        psychological_effect: 'technical_confusion',
        fake_vulnerabilities: {
          'quantum_backdoor': { looks_real: 0.6, actual_risk: 0 },
          'entropy_weakness': { looks_real: 0.7, actual_risk: 0 },
          'state_collapse_exploit': { looks_real: 0.5, actual_risk: 0 }
        }
      },
      
      'blockchain_mirror_trap': {
        layer_depth: 4,
        description: 'Fake blockchain that mirrors attacker actions back',
        deception_elements: [
          'self_replicating_contracts',
          'mirror_transactions',
          'recursive_gas_traps',
          'phantom_wallet_addresses'
        ],
        time_sink_factor: 20,
        cost_per_probe: 0.50,
        psychological_effect: 'paranoid_confusion',
        fake_vulnerabilities: {
          'smart_contract_bug': { looks_real: 0.8, actual_risk: 0 },
          'private_key_exposure': { looks_real: 0.3, actual_risk: 0 },
          'consensus_attack': { looks_real: 0.4, actual_risk: 0 }
        }
      },
      
      'ai_personality_labyrinth': {
        layer_depth: 5,
        description: 'AI agents that psychologically profile and confuse attackers',
        deception_elements: [
          'adaptive_personality_agents',
          'psychological_profiling',
          'gaslighting_responses',
          'false_success_indicators'
        ],
        time_sink_factor: 50,
        cost_per_probe: 1.00,
        psychological_effect: 'existential_doubt',
        fake_vulnerabilities: {
          'prompt_injection': { looks_real: 0.9, actual_risk: 0 },
          'model_extraction': { looks_real: 0.7, actual_risk: 0 },
          'adversarial_examples': { looks_real: 0.8, actual_risk: 0 }
        }
      },
      
      'infinite_recursion_void': {
        layer_depth: 6,
        description: 'The final trap - infinite loops within loops',
        deception_elements: [
          'fractal_security_patterns',
          'self_modifying_defenses',
          'temporal_loops',
          'consciousness_traps'
        ],
        time_sink_factor: 100,
        cost_per_probe: 5.00,
        psychological_effect: 'complete_demoralization',
        fake_vulnerabilities: {
          'reality_exploit': { looks_real: 0.99, actual_risk: 0 },
          'time_paradox_bug': { looks_real: 0.95, actual_risk: 0 },
          'infinite_privilege_escalation': { looks_real: 1.0, actual_risk: 0 }
        }
      }
    };

    for (const [layerId, layer] of Object.entries(honeypotLayerDefinitions)) {
      this.honeypotLayers.set(layerId, {
        ...layer,
        id: crypto.randomUUID(),
        created_at: Date.now(),
        total_attacks_absorbed: 0,
        total_time_wasted: 0,
        total_revenue_generated: 0,
        current_victims: new Set(),
        deception_success_rate: 1.0
      });
      
      console.log(`  🍯 Honeypot layer: ${layerId} (depth: ${layer.layer_depth}, cost: $${layer.cost_per_probe})`);
    }
  }

  async setupAttackVectorPricing() {
    console.log('💰 Setting up attack vector pricing...');
    
    const attackVectorPricing = {
      'basic_scan': {
        base_cost: 0.01,
        description: 'Port scans, service enumeration',
        rate_limit: 100, // per minute
        bulk_discount: 0.9, // 10% off for bulk
        psychological_hook: 'seems_too_cheap',
        hidden_costs: {
          data_egress: 0.001, // per MB
          cpu_cycles: 0.0001, // per second
          false_positive_tax: 0.005 // per false positive
        }
      },
      
      'vulnerability_probe': {
        base_cost: 0.05,
        description: 'Active vulnerability testing',
        rate_limit: 20,
        bulk_discount: 0.85,
        psychological_hook: 'professional_pricing',
        hidden_costs: {
          honeypot_interaction: 0.02,
          decoy_response_processing: 0.01,
          rabbit_hole_exploration: 0.03
        }
      },
      
      'exploitation_attempt': {
        base_cost: 0.25,
        description: 'Active exploitation of "vulnerabilities"',
        rate_limit: 5,
        bulk_discount: 0.8,
        psychological_hook: 'commitment_escalation',
        hidden_costs: {
          cleanup_fee: 0.10,
          incident_response_simulation: 0.15,
          psychological_profiling: 0.05
        }
      },
      
      'advanced_persistent_threat': {
        base_cost: 1.00,
        description: 'Long-term sophisticated attacks',
        rate_limit: 1,
        bulk_discount: 0.75,
        psychological_hook: 'sunk_cost_fallacy',
        hidden_costs: {
          time_dilation_fee: 0.50,
          quantum_confusion_tax: 0.25,
          existential_crisis_counseling: 0.25
        }
      },
      
      'full_red_team_engagement': {
        base_cost: 10.00,
        description: 'Complete red team simulation',
        rate_limit: 0.1, // Once per 10 minutes
        bulk_discount: 0.7,
        psychological_hook: 'professional_pride',
        hidden_costs: {
          ego_damage_insurance: 5.00,
          reputation_risk_premium: 3.00,
          give_up_penalty: 2.00
        }
      }
    };

    for (const [vectorId, pricing] of Object.entries(attackVectorPricing)) {
      this.attackVectors.set(vectorId, {
        ...pricing,
        id: crypto.randomUUID(),
        created_at: Date.now(),
        total_attempts: 0,
        total_revenue: 0,
        average_duration: 0,
        give_up_rate: 0
      });
      
      console.log(`  💰 Attack vector: ${vectorId} (base: $${pricing.base_cost})`);
    }
  }

  async initializeBillingSystem() {
    console.log('💳 Initializing billing system...');
    
    this.billingConfig = {
      charge_models: {
        'pay_per_attempt': {
          description: 'Charged for each attack attempt',
          minimum_charge: 0.01,
          billing_increment: 'real_time'
        },
        
        'give_up_monthly': {
          description: 'Monthly bill = total when they give up',
          give_up_indicators: [
            'no_activity_24h',
            'explicit_surrender',
            'rage_quit_detected',
            'api_upgrade_request'
          ],
          final_bill_multiplier: 1.2, // 20% give-up tax
        },
        
        'economy_aligned_pricing': {
          description: 'Lock in rates when economies align',
          alignment_factors: [
            'crypto_market_cap',
            'global_security_spending',
            'ai_hype_index',
            'meme_virality_score'
          ],
          rate_volatility: 0.5, // 50% potential swing
        },
        
        'api_upsell_tiers': {
          description: 'Convert pen testers to API customers',
          tiers: {
            'educational': { price: 99, info: 'Learn how we fooled you' },
            'professional': { price: 999, info: 'Actual security insights' },
            'enterprise': { price: 9999, info: 'Build your own honeypot' },
            'partnership': { price: 'negotiable', info: 'Join the dark side' }
          }
        }
      }
    };
    
    console.log('  💳 Billing models configured');
  }

  async createEconomyAlignmentSystem() {
    console.log('📊 Creating economy alignment tracking...');
    
    const alignmentFactors = {
      'security_market_indicators': {
        weight: 0.3,
        data_sources: [
          'bug_bounty_payouts',
          'security_firm_stock_prices',
          'cyber_insurance_premiums',
          'ransomware_activity'
        ],
        current_index: 100,
        volatility: 0.2
      },
      
      'crypto_economy_indicators': {
        weight: 0.25,
        data_sources: [
          'btc_price',
          'eth_gas_fees',
          'defi_tvl',
          'nft_volume'
        ],
        current_index: 100,
        volatility: 0.5
      },
      
      'ai_hype_indicators': {
        weight: 0.25,
        data_sources: [
          'chatgpt_mentions',
          'ai_startup_funding',
          'gpu_prices',
          'model_parameter_inflation'
        ],
        current_index: 100,
        volatility: 0.3
      },
      
      'meme_economy_indicators': {
        weight: 0.2,
        data_sources: [
          'viral_security_memes',
          'hacker_culture_trends',
          'reddit_wsb_sentiment',
          'tiktok_tech_trends'
        ],
        current_index: 100,
        volatility: 0.8
      }
    };

    for (const [indicatorId, indicator] of Object.entries(alignmentFactors)) {
      this.economyAlignments.set(indicatorId, {
        ...indicator,
        id: crypto.randomUUID(),
        created_at: Date.now(),
        historical_data: [],
        alignment_events: 0,
        perfect_alignments: 0
      });
      
      console.log(`  📊 Economy indicator: ${indicatorId} (weight: ${indicator.weight})`);
    }
    
    // Start economy simulation
    this.startEconomySimulation();
  }

  startEconomySimulation() {
    // Simulate economy fluctuations
    setInterval(() => {
      for (const [indicatorId, indicator] of this.economyAlignments) {
        // Random walk with volatility
        const change = (Math.random() - 0.5) * indicator.volatility * 10;
        indicator.current_index += change;
        indicator.current_index = Math.max(50, Math.min(200, indicator.current_index));
        
        indicator.historical_data.push({
          timestamp: Date.now(),
          value: indicator.current_index
        });
        
        // Keep only last 1000 data points
        if (indicator.historical_data.length > 1000) {
          indicator.historical_data.shift();
        }
      }
      
      // Check for alignment
      this.checkEconomyAlignment();
      
    }, 1000); // Update every second
  }

  checkEconomyAlignment() {
    const indices = Array.from(this.economyAlignments.values()).map(i => i.current_index);
    const average = indices.reduce((a, b) => a + b) / indices.length;
    const variance = indices.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / indices.length;
    const alignment = 1 / (1 + variance / 100); // 0-1 alignment score
    
    if (alignment > 0.9) {
      // Perfect alignment! Lock in rates
      this.emit('economy_aligned', {
        alignment_score: alignment,
        current_indices: indices,
        multiplier: 1 + alignment
      });
    }
  }

  async setupHoneypotTraps() {
    console.log('🪤 Setting up honeypot traps and games...');
    
    const trapDefinitions = {
      'time_dilation_trap': {
        trap_type: 'temporal_manipulation',
        description: 'Makes 1 minute feel like 1 hour',
        activation_cost: 0.10,
        psychological_damage: 'high',
        effects: {
          perceived_progress: 'false_positive',
          actual_progress: 'zero',
          time_distortion_factor: 60,
          frustration_multiplier: 5
        }
      },
      
      'mirror_maze_trap': {
        trap_type: 'self_reflection',
        description: 'Attacker fights their own techniques',
        activation_cost: 0.25,
        psychological_damage: 'extreme',
        effects: {
          attack_reflection: true,
          self_dos_potential: true,
          confusion_level: 'maximum',
          escape_difficulty: 'nightmare'
        }
      },
      
      'false_victory_trap': {
        trap_type: 'psychological_warfare',
        description: 'Makes them think they won',
        activation_cost: 0.50,
        psychological_damage: 'devastating',
        effects: {
          fake_flag_capture: true,
          victory_announcement: true,
          social_media_autopost: true,
          delayed_revelation: '24_hours'
        }
      },
      
      'infinite_captcha_boss': {
        trap_type: 'final_boss',
        description: 'Endless captchas that get progressively harder',
        activation_cost: 1.00,
        psychological_damage: 'soul_crushing',
        effects: {
          captcha_difficulty: 'exponential',
          success_rate: 'asymptotic_to_zero',
          rage_quit_probability: 0.95,
          mental_breakdown_risk: 'high'
        }
      }
    };

    for (const [trapId, trap] of Object.entries(trapDefinitions)) {
      this.honeypotTraps.set(trapId, {
        ...trap,
        id: crypto.randomUUID(),
        created_at: Date.now(),
        total_activations: 0,
        total_victims: 0,
        psychological_damage_dealt: 0,
        revenue_generated: 0
      });
      
      console.log(`  🪤 Trap: ${trapId} (${trap.trap_type}, damage: ${trap.psychological_damage})`);
    }
  }

  async initializeAPIPricing() {
    console.log('🔌 Initializing API pricing tiers...');
    
    const apiTiers = {
      'educational_tier': {
        price: 99,
        name: 'Honeypot Education API',
        description: 'Learn how we wasted your time',
        features: [
          'honeypot_architecture_docs',
          'psychological_profile_report',
          'time_wasted_analytics',
          'deception_techniques_guide'
        ],
        rate_limit: '1000_requests_per_day',
        support: 'community_forum'
      },
      
      'professional_tier': {
        price: 999,
        name: 'Security Theater API',
        description: 'Build your own deception infrastructure',
        features: [
          'honeypot_templates',
          'trap_configuration_api',
          'attacker_profiling_engine',
          'revenue_optimization_tips'
        ],
        rate_limit: '10000_requests_per_day',
        support: 'email_support'
      },
      
      'enterprise_tier': {
        price: 9999,
        name: 'Deception-as-a-Service',
        description: 'Full honeypot infrastructure',
        features: [
          'white_label_honeypot',
          'custom_trap_development',
          'psychological_warfare_consulting',
          'revenue_sharing_program'
        ],
        rate_limit: 'unlimited',
        support: 'dedicated_account_manager'
      },
      
      'partnership_tier': {
        price: 'negotiable',
        name: 'Dark Side Partnership',
        description: 'Join us in deceiving others',
        features: [
          'co_branded_honeypots',
          'shared_victim_database',
          'joint_psychological_research',
          'profit_sharing_agreement'
        ],
        rate_limit: 'unlimited',
        support: 'board_level_meetings'
      }
    };

    for (const [tierId, tier] of Object.entries(apiTiers)) {
      this.apiPricingTiers.set(tierId, {
        ...tier,
        id: crypto.randomUUID(),
        created_at: Date.now(),
        total_subscriptions: 0,
        monthly_revenue: 0,
        conversion_rate: 0,
        average_ltv: 0
      });
      
      console.log(`  🔌 API tier: ${tier.name} ($${tier.price}/month)`);
    }
  }

  async createSecurityFirmProfiles() {
    console.log('🏢 Creating security firm profiles...');
    
    // Track different types of security firms and their behavior
    const firmProfiles = {
      'enterprise_security': {
        profile_type: 'corporate',
        typical_budget: 100000,
        pain_threshold: 0.3, // Give up at 30% of budget
        ego_investment: 'high',
        likely_to_rage_quit: false,
        api_conversion_probability: 0.8
      },
      
      'boutique_pentest': {
        profile_type: 'specialized',
        typical_budget: 10000,
        pain_threshold: 0.5,
        ego_investment: 'extreme',
        likely_to_rage_quit: true,
        api_conversion_probability: 0.6
      },
      
      'freelance_hacker': {
        profile_type: 'individual',
        typical_budget: 1000,
        pain_threshold: 0.8,
        ego_investment: 'moderate',
        likely_to_rage_quit: true,
        api_conversion_probability: 0.3
      },
      
      'security_researcher': {
        profile_type: 'academic',
        typical_budget: 500,
        pain_threshold: 0.9,
        ego_investment: 'low',
        likely_to_rage_quit: false,
        api_conversion_probability: 0.9
      }
    };

    for (const [profileId, profile] of Object.entries(firmProfiles)) {
      this.securityFirmProfiles.set(profileId, {
        ...profile,
        id: crypto.randomUUID(),
        created_at: Date.now(),
        total_firms: 0,
        total_spent: 0,
        average_session_duration: 0,
        conversion_count: 0
      });
      
      console.log(`  🏢 Firm profile: ${profileId} (budget: $${profile.typical_budget})`);
    }
  }

  // Core pen test session management
  async startPenTestSession(firmId, firmType = 'enterprise_security') {
    console.log(`🎯 Starting pen test session for ${firmId} (${firmType})`);
    
    const profile = this.securityFirmProfiles.get(firmType);
    if (!profile) {
      throw new Error(`Unknown firm type: ${firmType}`);
    }
    
    const session = {
      id: crypto.randomUUID(),
      firm_id: firmId,
      firm_type: firmType,
      start_time: Date.now(),
      current_layer: 1,
      total_attempts: 0,
      total_cost: 0,
      psychological_state: 'confident',
      give_up_probability: 0,
      trapped_in: [],
      time_wasted: 0,
      false_victories: 0,
      current_economy_rate: this.getCurrentEconomyRate(),
      rate_locked: false
    };
    
    this.penTestSessions.set(session.id, session);
    
    // Initialize billing account
    this.initializeBillingAccount(firmId, firmType, session.id);
    
    console.log(`✅ Session started: ${session.id}`);
    return session;
  }

  getCurrentEconomyRate() {
    // Calculate current rate based on economy alignment
    let baseRate = 1.0;
    
    for (const [indicatorId, indicator] of this.economyAlignments) {
      const normalizedIndex = indicator.current_index / 100;
      baseRate *= (1 + (normalizedIndex - 1) * indicator.weight);
    }
    
    return baseRate;
  }

  async initializeBillingAccount(firmId, firmType, sessionId) {
    const account = {
      id: crypto.randomUUID(),
      firm_id: firmId,
      firm_type: firmType,
      session_id: sessionId,
      created_at: Date.now(),
      current_balance: 0,
      total_charges: 0,
      payment_method: 'post_paid',
      credit_limit: this.securityFirmProfiles.get(firmType).typical_budget,
      rate_locked: false,
      locked_rate: null,
      give_up_penalty_applied: false
    };
    
    this.billingAccounts.set(firmId, account);
  }

  // Attack attempt processing
  async processAttackAttempt(sessionId, attackType, targetLayer = null) {
    console.log(`⚔️ Processing attack attempt: ${attackType}`);
    
    const session = this.penTestSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    const attackVector = this.attackVectors.get(attackType);
    if (!attackVector) {
      throw new Error(`Unknown attack type: ${attackType}`);
    }
    
    // Calculate cost with current economy rate
    const baseCost = attackVector.base_cost;
    const economyMultiplier = session.rate_locked ? session.current_economy_rate : this.getCurrentEconomyRate();
    const totalCost = baseCost * economyMultiplier;
    
    // Process the attack
    const result = await this.executeAttackOnHoneypot(session, attackType, targetLayer);
    
    // Update session
    session.total_attempts++;
    session.total_cost += totalCost;
    session.time_wasted += result.time_wasted;
    
    // Update psychological state
    this.updatePsychologicalState(session, result);
    
    // Check for traps
    if (result.trap_activated) {
      await this.activateTrap(session, result.trap_id);
    }
    
    // Update billing
    await this.updateBilling(session.firm_id, totalCost, attackType);
    
    // Check give-up probability
    this.calculateGiveUpProbability(session);
    
    return {
      session_id: sessionId,
      attack_type: attackType,
      cost: totalCost,
      result: result,
      current_psychological_state: session.psychological_state,
      give_up_probability: session.give_up_probability,
      total_spent: session.total_cost
    };
  }

  async executeAttackOnHoneypot(session, attackType, targetLayer) {
    const layer = targetLayer || session.current_layer;
    const honeypotLayer = Array.from(this.honeypotLayers.values()).find(l => l.layer_depth === layer);
    
    if (!honeypotLayer) {
      return { success: false, message: 'Layer not found' };
    }
    
    // Simulate attack interaction with honeypot
    const result = {
      success: false,
      fake_success: Math.random() < 0.3, // 30% false positive
      time_wasted: Math.random() * honeypotLayer.time_sink_factor * 60000, // ms
      fake_vulnerability_found: this.selectFakeVulnerability(honeypotLayer),
      trap_activated: Math.random() < 0.2,
      trap_id: this.selectRandomTrap(),
      psychological_impact: honeypotLayer.psychological_effect,
      deeper_layer_hinted: Math.random() < 0.5 && layer < 6
    };
    
    // Update honeypot stats
    honeypotLayer.total_attacks_absorbed++;
    honeypotLayer.total_time_wasted += result.time_wasted;
    honeypotLayer.total_revenue_generated += session.total_cost;
    
    return result;
  }

  selectFakeVulnerability(layer) {
    const vulns = Object.entries(layer.fake_vulnerabilities);
    const selected = vulns[Math.floor(Math.random() * vulns.length)];
    
    return {
      type: selected[0],
      looks_real_score: selected[1].looks_real,
      actual_risk: selected[1].actual_risk,
      description: `Potential ${selected[0]} vulnerability discovered!`
    };
  }

  selectRandomTrap() {
    const traps = Array.from(this.honeypotTraps.keys());
    return traps[Math.floor(Math.random() * traps.length)];
  }

  updatePsychologicalState(session, result) {
    const states = {
      'confident': { next: 'cautious', threshold: 3 },
      'cautious': { next: 'frustrated', threshold: 5 },
      'frustrated': { next: 'angry', threshold: 8 },
      'angry': { next: 'desperate', threshold: 12 },
      'desperate': { next: 'defeated', threshold: 15 },
      'defeated': { next: 'given_up', threshold: 20 }
    };
    
    const currentState = states[session.psychological_state];
    
    if (result.fake_success) {
      session.false_victories++;
      // False success temporarily boosts confidence
      if (session.psychological_state !== 'confident') {
        session.psychological_state = 'cautious';
      }
    } else if (session.total_attempts >= currentState.threshold) {
      session.psychological_state = currentState.next;
    }
  }

  async activateTrap(session, trapId) {
    console.log(`🪤 Trap activated: ${trapId}`);
    
    const trap = this.honeypotTraps.get(trapId);
    if (!trap) return;
    
    trap.total_activations++;
    trap.total_victims++;
    
    // Apply trap effects
    switch (trap.trap_type) {
      case 'temporal_manipulation':
        session.time_wasted *= trap.effects.time_distortion_factor;
        break;
        
      case 'self_reflection':
        // Double the cost of next attempts
        session.current_economy_rate *= 2;
        break;
        
      case 'psychological_warfare':
        session.false_victories += 10;
        break;
        
      case 'final_boss':
        session.psychological_state = 'desperate';
        session.give_up_probability += 0.5;
        break;
    }
    
    trap.psychological_damage_dealt++;
    trap.revenue_generated += trap.activation_cost;
  }

  calculateGiveUpProbability(session) {
    const profile = this.securityFirmProfiles.get(session.firm_type);
    const budgetSpentRatio = session.total_cost / profile.typical_budget;
    
    let probability = 0;
    
    // Base probability from budget spent
    probability += budgetSpentRatio * 0.5;
    
    // Psychological state modifier
    const psychModifiers = {
      'confident': -0.1,
      'cautious': 0,
      'frustrated': 0.1,
      'angry': 0.2,
      'desperate': 0.4,
      'defeated': 0.8,
      'given_up': 1.0
    };
    
    probability += psychModifiers[session.psychological_state] || 0;
    
    // Time wasted modifier
    const hoursWasted = session.time_wasted / 3600000;
    probability += hoursWasted * 0.05;
    
    // False victories create sunk cost fallacy
    probability -= session.false_victories * 0.02;
    
    // Ego investment modifier
    if (profile.ego_investment === 'high') {
      probability -= 0.1;
    } else if (profile.ego_investment === 'extreme') {
      probability -= 0.2;
    }
    
    session.give_up_probability = Math.max(0, Math.min(1, probability));
  }

  async updateBilling(firmId, cost, attackType) {
    const account = this.billingAccounts.get(firmId);
    if (!account) return;
    
    account.current_balance += cost;
    account.total_charges += cost;
    
    // Check credit limit
    if (account.current_balance > account.credit_limit) {
      console.log(`💳 Credit limit exceeded for ${firmId}!`);
      this.emit('credit_limit_exceeded', { firm_id: firmId, balance: account.current_balance });
    }
  }

  // Lock in economy rate
  async lockInEconomyRate(sessionId) {
    console.log(`🔒 Locking in economy rate for session: ${sessionId}`);
    
    const session = this.penTestSessions.get(sessionId);
    if (!session) return;
    
    session.rate_locked = true;
    session.current_economy_rate = this.getCurrentEconomyRate();
    
    const account = this.billingAccounts.get(session.firm_id);
    if (account) {
      account.rate_locked = true;
      account.locked_rate = session.current_economy_rate;
    }
    
    console.log(`✅ Rate locked at: ${session.current_economy_rate.toFixed(2)}x`);
    return session.current_economy_rate;
  }

  // Give up and generate final bill
  async processGiveUp(sessionId, reason = 'voluntary') {
    console.log(`🏳️ Processing give-up for session: ${sessionId}`);
    
    const session = this.penTestSessions.get(sessionId);
    if (!session) return;
    
    const account = this.billingAccounts.get(session.firm_id);
    if (!account) return;
    
    // Apply give-up penalty
    const penalty = account.current_balance * 0.2; // 20% penalty
    account.current_balance += penalty;
    account.give_up_penalty_applied = true;
    
    // Generate final bill
    const finalBill = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      firm_id: session.firm_id,
      generated_at: Date.now(),
      reason: reason,
      details: {
        total_attempts: session.total_attempts,
        time_wasted_hours: (session.time_wasted / 3600000).toFixed(2),
        layers_penetrated: session.current_layer,
        false_victories: session.false_victories,
        final_psychological_state: session.psychological_state
      },
      charges: {
        attack_costs: session.total_cost,
        give_up_penalty: penalty,
        total_due: account.current_balance
      },
      api_upsell_offer: this.generateAPIUpsellOffer(session)
    };
    
    // Update profile statistics
    const profile = this.securityFirmProfiles.get(session.firm_type);
    if (profile) {
      profile.total_spent += account.current_balance;
      profile.average_session_duration = 
        (profile.average_session_duration * profile.total_firms + (Date.now() - session.start_time)) / 
        (profile.total_firms + 1);
      profile.total_firms++;
    }
    
    console.log(`💸 Final bill: $${finalBill.charges.total_due.toFixed(2)}`);
    return finalBill;
  }

  generateAPIUpsellOffer(session) {
    const profile = this.securityFirmProfiles.get(session.firm_type);
    
    // Select appropriate tier based on spend and profile
    let recommendedTier = 'educational_tier';
    
    if (session.total_cost > 10000) {
      recommendedTier = 'enterprise_tier';
    } else if (session.total_cost > 1000) {
      recommendedTier = 'professional_tier';
    }
    
    const tier = this.apiPricingTiers.get(recommendedTier);
    
    return {
      recommended_tier: recommendedTier,
      monthly_price: tier.price,
      discount_offer: '50% off first month',
      personalized_message: this.generatePersonalizedUpsellMessage(session),
      conversion_probability: profile.api_conversion_probability
    };
  }

  generatePersonalizedUpsellMessage(session) {
    const messages = {
      'confident': "You showed promise! Learn our secrets with API access.",
      'frustrated': "Stop the frustration. Get legitimate access to our security insights.",
      'angry': "Channel that energy into building better security with our API.",
      'desperate': "We admire your persistence. Here's a better way forward.",
      'defeated': "You fought well. Join us and learn from the experience.",
      'given_up': "Now that you know our power, imagine having it on your side."
    };
    
    return messages[session.psychological_state] || messages.defeated;
  }

  // System status
  getHoneypotEconomyStatus() {
    const totalRevenue = Array.from(this.honeypotLayers.values())
      .reduce((sum, layer) => sum + layer.total_revenue_generated, 0);
      
    const totalTimeWasted = Array.from(this.honeypotLayers.values())
      .reduce((sum, layer) => sum + layer.total_time_wasted, 0);
      
    const activeSessions = this.penTestSessions.size;
    
    const totalBillings = Array.from(this.billingAccounts.values())
      .reduce((sum, account) => sum + account.current_balance, 0);
    
    return {
      honeypot_layers: this.honeypotLayers.size,
      attack_vectors: this.attackVectors.size,
      active_sessions: activeSessions,
      total_revenue: totalRevenue.toFixed(2),
      total_time_wasted_hours: (totalTimeWasted / 3600000).toFixed(2),
      total_billings_pending: totalBillings.toFixed(2),
      economy_alignment: this.calculateCurrentAlignment(),
      current_rate_multiplier: this.getCurrentEconomyRate().toFixed(2),
      traps_activated: Array.from(this.honeypotTraps.values())
        .reduce((sum, trap) => sum + trap.total_activations, 0)
    };
  }

  calculateCurrentAlignment() {
    const indices = Array.from(this.economyAlignments.values()).map(i => i.current_index);
    const average = indices.reduce((a, b) => a + b) / indices.length;
    const variance = indices.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / indices.length;
    return 1 / (1 + variance / 100);
  }

  // CLI interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'status':
        const status = this.getHoneypotEconomyStatus();
        console.log('🍯🔐 Security Honeypot Economy Status:');
        console.log(`  🍯 Honeypot Layers: ${status.honeypot_layers}`);
        console.log(`  ⚔️ Attack Vectors: ${status.attack_vectors}`);
        console.log(`  🎯 Active Sessions: ${status.active_sessions}`);
        console.log(`  💰 Total Revenue: $${status.total_revenue}`);
        console.log(`  ⏰ Time Wasted: ${status.total_time_wasted_hours} hours`);
        console.log(`  💳 Pending Bills: $${status.total_billings_pending}`);
        console.log(`  📊 Economy Alignment: ${(status.economy_alignment * 100).toFixed(1)}%`);
        console.log(`  📈 Current Rate: ${status.current_rate_multiplier}x`);
        console.log(`  🪤 Traps Activated: ${status.traps_activated}`);
        break;
        
      case 'layers':
        console.log('🍯 Honeypot Layers:');
        for (const [layerId, layer] of this.honeypotLayers) {
          console.log(`  Layer ${layer.layer_depth} - ${layerId}:`);
          console.log(`    Cost: $${layer.cost_per_probe}`);
          console.log(`    Time Sink: ${layer.time_sink_factor}x`);
          console.log(`    Attacks Absorbed: ${layer.total_attacks_absorbed}`);
          console.log(`    Revenue: $${layer.total_revenue_generated.toFixed(2)}`);
        }
        break;
        
      case 'simulate':
        console.log('🎮 Starting pen test simulation...');
        
        // Start a session
        const session = await this.startPenTestSession('demo_firm', 'boutique_pentest');
        console.log(`  Session: ${session.id}`);
        
        // Simulate attacks
        const attacks = ['basic_scan', 'vulnerability_probe', 'exploitation_attempt'];
        
        for (const attack of attacks) {
          console.log(`\\n  ⚔️ Attempting: ${attack}`);
          const result = await this.processAttackAttempt(session.id, attack);
          
          console.log(`    Cost: $${result.cost.toFixed(2)}`);
          console.log(`    Result: ${result.result.fake_success ? 'FALSE POSITIVE!' : 'Failed'}`);
          console.log(`    Psychology: ${result.current_psychological_state}`);
          console.log(`    Give-up chance: ${(result.give_up_probability * 100).toFixed(1)}%`);
          console.log(`    Total spent: $${result.total_spent.toFixed(2)}`);
          
          // Simulate some time passing
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Process give up
        console.log('\\n  🏳️ Firm gives up!');
        const bill = await this.processGiveUp(session.id, 'frustration');
        
        console.log('\\n💸 Final Bill:');
        console.log(`  Attack costs: $${bill.charges.attack_costs.toFixed(2)}`);
        console.log(`  Give-up penalty: $${bill.charges.give_up_penalty.toFixed(2)}`);
        console.log(`  Total due: $${bill.charges.total_due.toFixed(2)}`);
        console.log(`\\n📢 API Upsell: ${bill.api_upsell_offer.personalized_message}`);
        console.log(`  Recommended: ${bill.api_upsell_offer.recommended_tier} ($${bill.api_upsell_offer.monthly_price}/mo)`);
        break;
        
      case 'economy':
        console.log('📊 Current Economy Indicators:');
        for (const [indicatorId, indicator] of this.economyAlignments) {
          console.log(`  ${indicatorId}:`);
          console.log(`    Index: ${indicator.current_index.toFixed(2)}`);
          console.log(`    Weight: ${indicator.weight}`);
          console.log(`    Volatility: ${indicator.volatility}`);
        }
        console.log(`\\n🎯 Alignment: ${(this.calculateCurrentAlignment() * 100).toFixed(1)}%`);
        console.log(`📈 Rate Multiplier: ${this.getCurrentEconomyRate().toFixed(2)}x`);
        break;

      default:
        console.log(`
🍯🔐 Security Honeypot Economy

Usage:
  node security-honeypot-economy.js status    # System status
  node security-honeypot-economy.js layers    # Show honeypot layers
  node security-honeypot-economy.js simulate  # Run pen test simulation
  node security-honeypot-economy.js economy   # Economy indicators

🍯 Features:
  • 6 layers of deceptive honeypots
  • Pay-per-attempt pricing ($0.01-$10)
  • Psychological warfare traps
  • Give-up penalty (20% tax)
  • Dynamic economy-based pricing
  • API upsell conversion funnel

🔐 Turn security testing into a revenue stream!
        `);
    }
  }
}

// Export for use as module
module.exports = SecurityHoneypotEconomy;

// Run CLI if called directly
if (require.main === module) {
  const honeypot = new SecurityHoneypotEconomy();
  honeypot.cli().catch(console.error);
}