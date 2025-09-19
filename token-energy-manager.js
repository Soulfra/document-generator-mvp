#!/usr/bin/env node

/**
 * 💰⚡ TOKEN ENERGY MANAGER
 * Manages the $ layer, energy systems, plugins, and special abilities
 * Core economic engine for the cybersecurity gaming ecosystem
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class TokenEnergyManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // $ Layer Configuration
            dollarLayer: {
                enabled: true,
                realWorldValue: false, // Set to true for actual monetary integration
                exchangeRates: {
                    'database_token': 0.01,     // $0.01 per token
                    'agent_coin': 0.05,         // $0.05 per coin
                    'vibes_coin': 0.10,         // $0.10 per coin
                    'meme_token': 0.25          // $0.25 per token
                },
                dailyLimits: {
                    'database_token': 1000,
                    'agent_coin': 200,
                    'vibes_coin': 50,
                    'meme_token': 20
                }
            },
            
            // Energy System Configuration
            energy: {
                maxEnergy: 200,
                baseRegenRate: 2,           // Energy per second
                energyEfficiency: {
                    'player_level_1': 1.0,
                    'player_level_5': 1.2,
                    'player_level_10': 1.5,
                    'player_level_20': 2.0
                },
                energyDecayRate: 0.1        // Decay when at max capacity
            },
            
            // Plugin System
            plugins: {
                maxActivePlugins: 8,
                pluginTypes: {
                    'shield_enhancer': {
                        cost: { 'agent_coin': 10 },
                        energyCost: 15,
                        duration: 30000,        // 30 seconds
                        effect: 'increase_shield_strength',
                        multiplier: 1.5
                    },
                    'token_multiplier': {
                        cost: { 'vibes_coin': 5 },
                        energyCost: 25,
                        duration: 60000,        // 1 minute
                        effect: 'multiply_token_earnings',
                        multiplier: 2.0
                    },
                    'energy_booster': {
                        cost: { 'database_token': 50 },
                        energyCost: 0,          // This gives energy
                        duration: 0,            // Instant effect
                        effect: 'restore_energy',
                        amount: 100
                    },
                    'threat_radar': {
                        cost: { 'agent_coin': 15 },
                        energyCost: 20,
                        duration: 45000,        // 45 seconds
                        effect: 'enhanced_threat_detection',
                        range: 2.0
                    },
                    'crypto_accelerator': {
                        cost: { 'meme_token': 2 },
                        energyCost: 30,
                        duration: 120000,       // 2 minutes
                        effect: 'faster_encryption',
                        speedBoost: 3.0
                    },
                    'vulnerability_scanner': {
                        cost: { 'vibes_coin': 8 },
                        energyCost: 35,
                        duration: 90000,        // 1.5 minutes
                        effect: 'auto_scan_vulnerabilities',
                        scanRate: 5000          // Every 5 seconds
                    },
                    'shield_regenerator': {
                        cost: { 'agent_coin': 20 },
                        energyCost: 40,
                        duration: 180000,       // 3 minutes
                        effect: 'accelerated_shield_regen',
                        regenBoost: 3.0
                    },
                    'token_converter': {
                        cost: { 'database_token': 100 },
                        energyCost: 10,
                        duration: 0,            // Instant
                        effect: 'convert_tokens',
                        conversionRates: {
                            'database_token_to_agent_coin': 5,
                            'agent_coin_to_vibes_coin': 2,
                            'vibes_coin_to_meme_token': 4
                        }
                    }
                }
            },
            
            // Special Abilities System
            specials: {
                maxActiveSpecials: 3,
                specialAbilities: {
                    'nuclear_firewall': {
                        cost: { 'meme_token': 5 },
                        energyCost: 150,
                        cooldown: 300000,       // 5 minutes
                        duration: 30000,        // 30 seconds
                        effect: 'ultimate_protection',
                        description: 'Creates an impenetrable firewall dome'
                    },
                    'quantum_encryption': {
                        cost: { 'vibes_coin': 25 },
                        energyCost: 100,
                        cooldown: 180000,       // 3 minutes
                        duration: 60000,        // 1 minute
                        effect: 'quantum_shield',
                        description: 'Quantum-level encryption for all data'
                    },
                    'ai_threat_hunter': {
                        cost: { 'agent_coin': 50 },
                        energyCost: 75,
                        cooldown: 120000,       // 2 minutes
                        duration: 45000,        // 45 seconds
                        effect: 'ai_powered_scanning',
                        description: 'AI automatically hunts and neutralizes threats'
                    },
                    'economic_warfare': {
                        cost: { 'database_token': 200 },
                        energyCost: 125,
                        cooldown: 240000,       // 4 minutes
                        duration: 90000,        // 1.5 minutes
                        effect: 'economic_attack',
                        description: 'Disrupts attacker economic systems'
                    },
                    'shield_storm': {
                        cost: { 'meme_token': 3, 'vibes_coin': 10 },
                        energyCost: 175,
                        cooldown: 360000,       // 6 minutes
                        duration: 20000,        // 20 seconds
                        effect: 'multiple_shields',
                        description: 'Summons a storm of protective shields'
                    }
                }
            },
            
            // Economic Events
            economicEvents: {
                enabled: true,
                events: {
                    'token_rush': {
                        probability: 0.1,       // 10% chance per hour
                        duration: 300000,       // 5 minutes
                        effect: 'double_token_earnings',
                        announcement: '🚀 TOKEN RUSH! Double earnings for 5 minutes!'
                    },
                    'energy_storm': {
                        probability: 0.05,      // 5% chance per hour
                        duration: 600000,       // 10 minutes
                        effect: 'free_energy_regen',
                        announcement: '⚡ ENERGY STORM! Free energy regeneration!'
                    },
                    'plugin_sale': {
                        probability: 0.15,      // 15% chance per hour
                        duration: 900000,       // 15 minutes
                        effect: 'half_price_plugins',
                        announcement: '💰 PLUGIN SALE! 50% off all plugins!'
                    },
                    'threat_surge': {
                        probability: 0.08,      // 8% chance per hour
                        duration: 450000,       // 7.5 minutes
                        effect: 'increased_threat_spawns',
                        announcement: '🚨 THREAT SURGE! Increased threats but better rewards!'
                    }
                }
            },
            
            ...config
        };
        
        // System State
        this.state = {
            // Player economic state
            player: {
                energy: this.config.energy.maxEnergy,
                maxEnergy: this.config.energy.maxEnergy,
                energyRegenRate: this.config.energy.baseRegenRate,
                level: 1,
                
                // Token balances
                tokens: new Map([
                    ['database_token', 100],
                    ['agent_coin', 50],
                    ['vibes_coin', 25],
                    ['meme_token', 10]
                ]),
                
                // $ Layer tracking
                dollarValue: 0,
                dailyEarnings: new Map(),
                lifetimeEarnings: 0,
                
                // Active systems
                activePlugins: new Map(),
                activeSpecials: new Map(),
                cooldowns: new Map()
            },
            
            // Economic events
            activeEvents: new Map(),
            eventHistory: [],
            
            // Statistics
            stats: {
                tokensEarned: new Map(),
                energyUsed: 0,
                pluginsActivated: 0,
                specialsUsed: 0,
                dollarValueGenerated: 0
            }
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('💰⚡ Initializing Token Energy Manager...');
        
        try {
            // Start energy regeneration system
            this.startEnergyRegeneration();
            
            // Start economic event system
            this.startEconomicEvents();
            
            // Initialize plugin system
            this.initializePluginSystem();
            
            // Initialize special abilities
            this.initializeSpecialAbilities();
            
            // Start $ layer calculations
            this.startDollarLayerCalculations();
            
            // Start monitoring systems
            this.startMonitoringSystems();
            
            console.log('✅ Token Energy Manager initialized');
            this.logSystemStatus();
            
        } catch (error) {
            console.error('❌ Failed to initialize Token Energy Manager:', error);
            throw error;
        }
    }
    
    // ==================== ENERGY MANAGEMENT ====================
    
    startEnergyRegeneration() {
        setInterval(() => {
            this.regenerateEnergy();
        }, 1000); // Every second
        
        console.log('⚡ Energy regeneration system started');
    }
    
    regenerateEnergy() {
        const player = this.state.player;
        
        if (player.energy < player.maxEnergy) {
            // Calculate regeneration based on efficiency
            const efficiency = this.getEnergyEfficiency();
            const regenAmount = player.energyRegenRate * efficiency;
            
            player.energy = Math.min(player.maxEnergy, player.energy + regenAmount);
            
            this.emit('energy_regenerated', {
                amount: regenAmount,
                currentEnergy: player.energy,
                maxEnergy: player.maxEnergy,
                efficiency: efficiency
            });
        } else if (player.energy === player.maxEnergy) {
            // Apply decay when at max capacity
            const decayAmount = this.config.energy.energyDecayRate;
            player.energy = Math.max(player.maxEnergy - 10, player.energy - decayAmount);
        }
    }
    
    getEnergyEfficiency() {
        const level = this.state.player.level;
        
        if (level >= 20) return this.config.energy.energyEfficiency.player_level_20;
        if (level >= 10) return this.config.energy.energyEfficiency.player_level_10;
        if (level >= 5) return this.config.energy.energyEfficiency.player_level_5;
        return this.config.energy.energyEfficiency.player_level_1;
    }
    
    useEnergy(amount, purpose) {
        if (this.state.player.energy >= amount) {
            this.state.player.energy -= amount;
            this.state.stats.energyUsed += amount;
            
            this.emit('energy_consumed', {
                amount,
                purpose,
                remaining: this.state.player.energy
            });
            
            return true;
        }
        
        this.emit('energy_insufficient', {
            required: amount,
            available: this.state.player.energy,
            purpose
        });
        
        return false;
    }
    
    // ==================== DOLLAR LAYER ====================
    
    startDollarLayerCalculations() {
        if (!this.config.dollarLayer.enabled) return;
        
        // Update dollar values every 10 seconds
        setInterval(() => {
            this.updateDollarValue();
        }, 10000);
        
        // Reset daily earnings at midnight
        setInterval(() => {
            this.resetDailyEarnings();
        }, 86400000); // 24 hours
        
        console.log('💰 Dollar layer calculations started');
    }
    
    updateDollarValue() {
        let totalValue = 0;
        
        for (const [tokenType, amount] of this.state.player.tokens) {
            const rate = this.config.dollarLayer.exchangeRates[tokenType] || 0;
            totalValue += amount * rate;
        }
        
        this.state.player.dollarValue = totalValue;
        
        this.emit('dollar_value_updated', {
            totalValue,
            breakdown: this.getDollarBreakdown()
        });
    }
    
    getDollarBreakdown() {
        const breakdown = {};
        
        for (const [tokenType, amount] of this.state.player.tokens) {
            const rate = this.config.dollarLayer.exchangeRates[tokenType] || 0;
            breakdown[tokenType] = {
                amount,
                rate,
                value: amount * rate
            };
        }
        
        return breakdown;
    }
    
    resetDailyEarnings() {
        this.state.player.dailyEarnings.clear();
        
        this.emit('daily_earnings_reset', {
            previousEarnings: Object.fromEntries(this.state.player.dailyEarnings),
            resetTime: Date.now()
        });
    }
    
    // ==================== TOKEN MANAGEMENT ====================
    
    earnTokens(tokenType, amount, reason) {
        // Apply any active multipliers
        const finalAmount = this.applyTokenMultipliers(tokenType, amount);
        
        // Check daily limits
        if (!this.checkDailyLimit(tokenType, finalAmount)) {
            this.emit('daily_limit_reached', { tokenType, amount: finalAmount });
            return false;
        }
        
        // Add tokens
        const currentAmount = this.state.player.tokens.get(tokenType) || 0;
        this.state.player.tokens.set(tokenType, currentAmount + finalAmount);
        
        // Track daily earnings
        const dailyAmount = this.state.player.dailyEarnings.get(tokenType) || 0;
        this.state.player.dailyEarnings.set(tokenType, dailyAmount + finalAmount);
        
        // Track lifetime earnings
        this.state.player.lifetimeEarnings += finalAmount;
        
        // Track stats
        const statsAmount = this.state.stats.tokensEarned.get(tokenType) || 0;
        this.state.stats.tokensEarned.set(tokenType, statsAmount + finalAmount);
        
        this.emit('tokens_earned', {
            tokenType,
            amount: finalAmount,
            reason,
            newBalance: currentAmount + finalAmount,
            multiplierApplied: finalAmount !== amount
        });
        
        // Update dollar value
        this.updateDollarValue();
        
        return true;
    }
    
    applyTokenMultipliers(tokenType, amount) {
        let multiplier = 1.0;
        
        // Check for active token multiplier plugins
        for (const [pluginId, plugin] of this.state.player.activePlugins) {
            if (plugin.type === 'token_multiplier' && plugin.active) {
                multiplier *= plugin.multiplier;
            }
        }
        
        // Check for active economic events
        for (const [eventId, event] of this.state.activeEvents) {
            if (event.effect === 'double_token_earnings') {
                multiplier *= 2.0;
            }
        }
        
        return Math.floor(amount * multiplier);
    }
    
    checkDailyLimit(tokenType, amount) {
        const dailyLimit = this.config.dollarLayer.dailyLimits[tokenType];
        if (!dailyLimit) return true;
        
        const currentDaily = this.state.player.dailyEarnings.get(tokenType) || 0;
        return (currentDaily + amount) <= dailyLimit;
    }
    
    spendTokens(cost) {
        // Check if player can afford
        for (const [tokenType, amount] of Object.entries(cost)) {
            const currentBalance = this.state.player.tokens.get(tokenType) || 0;
            if (currentBalance < amount) {
                this.emit('insufficient_tokens', { required: cost, available: Object.fromEntries(this.state.player.tokens) });
                return false;
            }
        }
        
        // Deduct tokens
        for (const [tokenType, amount] of Object.entries(cost)) {
            const currentBalance = this.state.player.tokens.get(tokenType);
            this.state.player.tokens.set(tokenType, currentBalance - amount);
        }
        
        this.emit('tokens_spent', { cost });
        this.updateDollarValue();
        
        return true;
    }
    
    // ==================== PLUGIN SYSTEM ====================
    
    initializePluginSystem() {
        console.log('🔌 Initializing plugin system...');
        
        // Plugin management loop
        setInterval(() => {
            this.updateActivePlugins();
        }, 1000);
        
        console.log(`✅ Plugin system ready with ${Object.keys(this.config.plugins.pluginTypes).length} available plugins`);
    }
    
    activatePlugin(pluginType, duration = null) {
        const plugin = this.config.plugins.pluginTypes[pluginType];
        if (!plugin) {
            this.emit('plugin_not_found', { pluginType });
            return false;
        }
        
        // Check if player can afford
        if (!this.spendTokens(plugin.cost)) {
            return false;
        }
        
        // Check energy cost
        if (!this.useEnergy(plugin.energyCost, `activate_plugin_${pluginType}`)) {
            // Refund tokens
            for (const [tokenType, amount] of Object.entries(plugin.cost)) {
                const currentBalance = this.state.player.tokens.get(tokenType);
                this.state.player.tokens.set(tokenType, currentBalance + amount);
            }
            return false;
        }
        
        // Check max active plugins
        if (this.state.player.activePlugins.size >= this.config.plugins.maxActivePlugins) {
            this.emit('max_plugins_reached', { maxPlugins: this.config.plugins.maxActivePlugins });
            return false;
        }
        
        const pluginId = `${pluginType}_${Date.now()}`;
        const pluginInstance = {
            id: pluginId,
            type: pluginType,
            ...plugin,
            activatedAt: Date.now(),
            duration: duration || plugin.duration,
            active: true
        };
        
        this.state.player.activePlugins.set(pluginId, pluginInstance);
        this.state.stats.pluginsActivated++;
        
        // Execute plugin effect
        this.executePluginEffect(pluginInstance);
        
        this.emit('plugin_activated', {
            pluginId,
            pluginType,
            duration: pluginInstance.duration,
            effect: plugin.effect
        });
        
        return pluginId;
    }
    
    executePluginEffect(plugin) {
        switch (plugin.effect) {
            case 'restore_energy':
                this.state.player.energy = Math.min(
                    this.state.player.maxEnergy,
                    this.state.player.energy + plugin.amount
                );
                this.emit('energy_restored', { amount: plugin.amount });
                break;
                
            case 'convert_tokens':
                this.handleTokenConversion(plugin);
                break;
                
            default:
                // Most plugins have ongoing effects handled in update loop
                break;
        }
    }
    
    handleTokenConversion(plugin) {
        // Token conversion interface
        this.emit('token_conversion_available', {
            rates: plugin.conversionRates,
            pluginId: plugin.id
        });
    }
    
    convertTokens(fromToken, toToken, amount, pluginId) {
        const plugin = this.state.player.activePlugins.get(pluginId);
        if (!plugin || plugin.effect !== 'convert_tokens') return false;
        
        const conversionKey = `${fromToken}_to_${toToken}`;
        const rate = plugin.conversionRates[conversionKey];
        if (!rate) return false;
        
        const fromBalance = this.state.player.tokens.get(fromToken) || 0;
        if (fromBalance < amount) return false;
        
        const convertedAmount = Math.floor(amount / rate);
        
        // Execute conversion
        this.state.player.tokens.set(fromToken, fromBalance - amount);
        const toBalance = this.state.player.tokens.get(toToken) || 0;
        this.state.player.tokens.set(toToken, toBalance + convertedAmount);
        
        this.emit('tokens_converted', {
            from: { token: fromToken, amount },
            to: { token: toToken, amount: convertedAmount },
            rate
        });
        
        this.updateDollarValue();
        return true;
    }
    
    updateActivePlugins() {
        const now = Date.now();
        
        for (const [pluginId, plugin] of this.state.player.activePlugins) {
            const elapsed = now - plugin.activatedAt;
            
            if (plugin.duration > 0 && elapsed >= plugin.duration) {
                // Plugin expired
                this.state.player.activePlugins.delete(pluginId);
                
                this.emit('plugin_expired', {
                    pluginId,
                    pluginType: plugin.type,
                    duration: elapsed
                });
            }
        }
    }
    
    // ==================== SPECIAL ABILITIES ====================
    
    initializeSpecialAbilities() {
        console.log('✨ Initializing special abilities system...');
        
        // Cooldown management
        setInterval(() => {
            this.updateSpecialCooldowns();
        }, 1000);
        
        console.log(`✅ Special abilities ready with ${Object.keys(this.config.specials.specialAbilities).length} available specials`);
    }
    
    useSpecialAbility(abilityName) {
        const ability = this.config.specials.specialAbilities[abilityName];
        if (!ability) {
            this.emit('special_not_found', { abilityName });
            return false;
        }
        
        // Check cooldown
        const lastUsed = this.state.player.cooldowns.get(abilityName);
        if (lastUsed && Date.now() - lastUsed < ability.cooldown) {
            const remaining = ability.cooldown - (Date.now() - lastUsed);
            this.emit('special_on_cooldown', { abilityName, remaining });
            return false;
        }
        
        // Check cost
        if (!this.spendTokens(ability.cost)) {
            return false;
        }
        
        // Check energy
        if (!this.useEnergy(ability.energyCost, `special_${abilityName}`)) {
            // Refund tokens
            for (const [tokenType, amount] of Object.entries(ability.cost)) {
                const currentBalance = this.state.player.tokens.get(tokenType);
                this.state.player.tokens.set(tokenType, currentBalance + amount);
            }
            return false;
        }
        
        // Check max active specials
        if (this.state.player.activeSpecials.size >= this.config.specials.maxActiveSpecials) {
            this.emit('max_specials_reached', { maxSpecials: this.config.specials.maxActiveSpecials });
            return false;
        }
        
        const specialId = `${abilityName}_${Date.now()}`;
        const specialInstance = {
            id: specialId,
            name: abilityName,
            ...ability,
            activatedAt: Date.now(),
            active: true
        };
        
        this.state.player.activeSpecials.set(specialId, specialInstance);
        this.state.player.cooldowns.set(abilityName, Date.now());
        this.state.stats.specialsUsed++;
        
        // Execute special ability
        this.executeSpecialAbility(specialInstance);
        
        this.emit('special_ability_used', {
            specialId,
            abilityName,
            duration: ability.duration,
            effect: ability.effect,
            description: ability.description
        });
        
        return specialId;
    }
    
    executeSpecialAbility(special) {
        // Most special abilities create effects in external systems
        // This manager just tracks their state and duration
        
        if (special.duration > 0) {
            setTimeout(() => {
                this.state.player.activeSpecials.delete(special.id);
                
                this.emit('special_ability_expired', {
                    specialId: special.id,
                    abilityName: special.name
                });
            }, special.duration);
        }
    }
    
    updateSpecialCooldowns() {
        const cooldownUpdate = {};
        const now = Date.now();
        
        for (const [abilityName, lastUsed] of this.state.player.cooldowns) {
            const ability = this.config.specials.specialAbilities[abilityName];
            if (!ability) continue;
            
            const timeRemaining = Math.max(0, ability.cooldown - (now - lastUsed));
            cooldownUpdate[abilityName] = {
                timeRemaining,
                ready: timeRemaining === 0
            };
        }
        
        this.emit('cooldowns_updated', cooldownUpdate);
    }
    
    // ==================== ECONOMIC EVENTS ====================
    
    startEconomicEvents() {
        if (!this.config.economicEvents.enabled) return;
        
        // Check for events every hour
        setInterval(() => {
            this.checkForEconomicEvents();
        }, 3600000); // 1 hour
        
        console.log('📈 Economic events system started');
    }
    
    checkForEconomicEvents() {
        for (const [eventName, eventConfig] of Object.entries(this.config.economicEvents.events)) {
            if (Math.random() < eventConfig.probability) {
                this.triggerEconomicEvent(eventName, eventConfig);
            }
        }
    }
    
    triggerEconomicEvent(eventName, eventConfig) {
        const eventId = `${eventName}_${Date.now()}`;
        const event = {
            id: eventId,
            name: eventName,
            ...eventConfig,
            startTime: Date.now(),
            active: true
        };
        
        this.state.activeEvents.set(eventId, event);
        this.state.eventHistory.push(event);
        
        console.log(`📈 Economic event triggered: ${eventConfig.announcement}`);
        
        this.emit('economic_event_started', {
            eventId,
            eventName,
            duration: eventConfig.duration,
            effect: eventConfig.effect,
            announcement: eventConfig.announcement
        });
        
        // Schedule event end
        setTimeout(() => {
            this.endEconomicEvent(eventId);
        }, eventConfig.duration);
    }
    
    endEconomicEvent(eventId) {
        const event = this.state.activeEvents.get(eventId);
        if (event) {
            event.active = false;
            this.state.activeEvents.delete(eventId);
            
            this.emit('economic_event_ended', {
                eventId,
                eventName: event.name,
                duration: Date.now() - event.startTime
            });
        }
    }
    
    // ==================== MONITORING SYSTEMS ====================
    
    startMonitoringSystems() {
        // Performance monitoring
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 5000); // Every 5 seconds
        
        // Economic health check
        setInterval(() => {
            this.checkEconomicHealth();
        }, 30000); // Every 30 seconds
        
        console.log('📊 Monitoring systems started');
    }
    
    updatePerformanceMetrics() {
        const metrics = {
            energyUtilization: (this.state.player.energy / this.state.player.maxEnergy) * 100,
            activePlugins: this.state.player.activePlugins.size,
            activeSpecials: this.state.player.activeSpecials.size,
            activeEvents: this.state.activeEvents.size,
            dollarValue: this.state.player.dollarValue,
            tokenDiversity: this.state.player.tokens.size
        };
        
        this.emit('performance_metrics', metrics);
    }
    
    checkEconomicHealth() {
        const health = {
            tokenBalance: this.calculateTokenBalance(),
            energyEfficiency: this.getEnergyEfficiency(),
            economicStability: this.calculateEconomicStability(),
            recommendations: this.generateRecommendations()
        };
        
        this.emit('economic_health', health);
    }
    
    calculateTokenBalance() {
        let totalValue = 0;
        for (const [tokenType, amount] of this.state.player.tokens) {
            const rate = this.config.dollarLayer.exchangeRates[tokenType] || 0;
            totalValue += amount * rate;
        }
        return totalValue;
    }
    
    calculateEconomicStability() {
        // Simple stability metric based on token distribution
        const tokenValues = Array.from(this.state.player.tokens.values());
        const total = tokenValues.reduce((sum, val) => sum + val, 0);
        
        if (total === 0) return 0;
        
        // Calculate entropy (higher = more diversified = more stable)
        let entropy = 0;
        for (const value of tokenValues) {
            if (value > 0) {
                const probability = value / total;
                entropy -= probability * Math.log2(probability);
            }
        }
        
        return Math.min(1, entropy / Math.log2(tokenValues.length));
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        // Energy recommendations
        if (this.state.player.energy < 50) {
            recommendations.push('Consider using an energy booster plugin');
        }
        
        // Token recommendations
        const dollarValue = this.state.player.dollarValue;
        if (dollarValue > 50) {
            recommendations.push('High dollar value - consider investing in special abilities');
        }
        
        // Plugin recommendations
        if (this.state.player.activePlugins.size === 0) {
            recommendations.push('Activate plugins to boost performance');
        }
        
        return recommendations;
    }
    
    // ==================== UTILITY METHODS ====================
    
    logSystemStatus() {
        console.log('\n💰⚡ TOKEN ENERGY MANAGER STATUS:');
        console.log('===============================');
        console.log(`⚡ Energy: ${this.state.player.energy}/${this.state.player.maxEnergy}`);
        console.log(`💰 Dollar Value: $${this.state.player.dollarValue.toFixed(4)}`);
        console.log(`💳 Token Balances:`);
        for (const [tokenType, amount] of this.state.player.tokens) {
            const rate = this.config.dollarLayer.exchangeRates[tokenType] || 0;
            const value = amount * rate;
            console.log(`   ${tokenType}: ${amount} ($${value.toFixed(4)})`);
        }
        console.log(`🔌 Active Plugins: ${this.state.player.activePlugins.size}/${this.config.plugins.maxActivePlugins}`);
        console.log(`✨ Active Specials: ${this.state.player.activeSpecials.size}/${this.config.specials.maxActiveSpecials}`);
        console.log(`📈 Active Events: ${this.state.activeEvents.size}`);
        console.log(`📊 Stats - Energy Used: ${this.state.stats.energyUsed}, Plugins: ${this.state.stats.pluginsActivated}, Specials: ${this.state.stats.specialsUsed}`);
        console.log('===============================\n');
    }
    
    // ==================== API METHODS ====================
    
    getPlayerState() {
        return {
            energy: this.state.player.energy,
            maxEnergy: this.state.player.maxEnergy,
            energyRegenRate: this.state.player.energyRegenRate,
            level: this.state.player.level,
            tokens: Object.fromEntries(this.state.player.tokens),
            dollarValue: this.state.player.dollarValue,
            dailyEarnings: Object.fromEntries(this.state.player.dailyEarnings),
            lifetimeEarnings: this.state.player.lifetimeEarnings,
            activePlugins: Array.from(this.state.player.activePlugins.values()),
            activeSpecials: Array.from(this.state.player.activeSpecials.values()),
            cooldowns: Object.fromEntries(this.state.player.cooldowns)
        };
    }
    
    getAvailablePlugins() {
        const plugins = {};
        for (const [pluginType, config] of Object.entries(this.config.plugins.pluginTypes)) {
            plugins[pluginType] = {
                ...config,
                canAfford: this.canAffordCost(config.cost),
                hasEnergy: this.state.player.energy >= config.energyCost
            };
        }
        return plugins;
    }
    
    getAvailableSpecials() {
        const specials = {};
        const now = Date.now();
        
        for (const [abilityName, config] of Object.entries(this.config.specials.specialAbilities)) {
            const lastUsed = this.state.player.cooldowns.get(abilityName) || 0;
            const cooldownRemaining = Math.max(0, config.cooldown - (now - lastUsed));
            
            specials[abilityName] = {
                ...config,
                canAfford: this.canAffordCost(config.cost),
                hasEnergy: this.state.player.energy >= config.energyCost,
                cooldownRemaining,
                ready: cooldownRemaining === 0
            };
        }
        
        return specials;
    }
    
    canAffordCost(cost) {
        for (const [tokenType, amount] of Object.entries(cost)) {
            const balance = this.state.player.tokens.get(tokenType) || 0;
            if (balance < amount) return false;
        }
        return true;
    }
    
    getActiveEvents() {
        return Array.from(this.state.activeEvents.values());
    }
    
    getEconomicStats() {
        return {
            ...this.state.stats,
            tokensEarned: Object.fromEntries(this.state.stats.tokensEarned),
            economicHealth: this.calculateEconomicStability(),
            dollarValueGenerated: this.state.player.dollarValue
        };
    }
}

module.exports = TokenEnergyManager;

// CLI usage
if (require.main === module) {
    const manager = new TokenEnergyManager();
    
    // Demo mode
    setTimeout(() => {
        console.log('\n💰 DEMO: Earning tokens...');
        manager.earnTokens('database_token', 25, 'vulnerability_found');
        manager.earnTokens('agent_coin', 10, 'threat_blocked');
    }, 3000);
    
    setTimeout(() => {
        console.log('\n🔌 DEMO: Activating plugin...');
        manager.activatePlugin('shield_enhancer');
    }, 6000);
    
    setTimeout(() => {
        console.log('\n✨ DEMO: Using special ability...');
        manager.useSpecialAbility('quantum_encryption');
    }, 9000);
    
    setTimeout(() => {
        console.log('\n📈 DEMO: Triggering economic event...');
        manager.triggerEconomicEvent('token_rush', manager.config.economicEvents.events.token_rush);
    }, 12000);
}