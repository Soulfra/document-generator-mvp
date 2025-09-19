#!/usr/bin/env node

/**
 * 🛡️ CYBERSECURITY SHIELDS LAYER
 * Main coordinator integrating shields, tokens, energy, constructors, and keys
 * into a unified security gaming experience
 */

const EventEmitter = require('events');
const HoneypotShieldTrap = require('./token-economy-feed/src/security/HoneypotShieldTrap');
const TokenEconomyExportSystem = require('./TokenEconomyExportSystem');
const UnfuckwithableSecurityLayer = require('./UNFUCKWITHABLE-SECURITY-LAYER');
const EmergencyNotificationSystem = require('./emergency-notification-system');

class CybersecurityShieldsLayer extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Shield system configuration
            shields: {
                maxShields: 5,
                baseEnergy: 100,
                energyRegenRate: 1, // per second
                shieldStrength: 100,
                shieldRegenRate: 2 // per second
            },
            
            // Token economy integration
            tokens: {
                energyCost: {
                    basicShield: 10,      // database_token
                    advancedShield: 25,   // agent_coin
                    ultimateShield: 50,   // vibes_coin
                    megaShield: 100       // meme_token
                },
                earningRates: {
                    threatBlocked: 5,
                    vulnerabilityFound: 15,
                    systemSecured: 25,
                    bossDefeated: 100
                }
            },
            
            // Energy and special abilities
            energy: {
                maxEnergy: 200,
                specialAbilities: {
                    'encryption_burst': { cost: 30, cooldown: 10000 },
                    'firewall_dome': { cost: 50, cooldown: 20000 },
                    'intrusion_detection': { cost: 20, cooldown: 5000 },
                    'quantum_shield': { cost: 100, cooldown: 60000 }
                }
            },
            
            // Security tool classes and constructors
            constructors: {
                'shield_generator': { materials: ['database_token', 'encryption_key'], cost: 25 },
                'threat_detector': { materials: ['agent_coin', 'scan_algorithm'], cost: 40 },
                'encryption_engine': { materials: ['vibes_coin', 'crypto_key'], cost: 60 },
                'firewall_system': { materials: ['meme_token', 'rule_engine'], cost: 80 }
            },
            
            // Key management system
            keys: {
                types: ['encryption', 'access', 'signature', 'quantum'],
                maxKeys: 20,
                keyStrength: {
                    'weak': { bits: 128, cost: 5 },
                    'medium': { bits: 256, cost: 15 },
                    'strong': { bits: 512, cost: 30 },
                    'quantum': { bits: 1024, cost: 100 }
                }
            },
            
            ...config
        };
        
        // Core system states
        this.gameState = {
            player: {
                energy: this.config.energy.maxEnergy,
                shields: new Map(),
                tokens: new Map(),
                keys: new Map(),
                constructedTools: new Map(),
                activeAbilities: new Map()
            },
            
            threats: new Map(),
            activeShields: new Map(),
            securityEvents: new Map(),
            economyStats: {
                tokensEarned: 0,
                threatsBlocked: 0,
                vulnerabilitiesFound: 0,
                systemsSecured: 0
            }
        };
        
        // Integration with existing systems
        this.honeypotShield = null;
        this.tokenEconomy = null;
        this.securityLayer = null;
        this.emergencySystem = null;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🛡️ Initializing Cybersecurity Shields Layer...');
        
        try {
            // Initialize integrated systems
            await this.initializeIntegratedSystems();
            
            // Setup shield system
            await this.initializeShieldSystem();
            
            // Initialize token economy
            await this.initializeTokenEconomy();
            
            // Setup energy management
            this.initializeEnergySystem();
            
            // Initialize security tools
            this.initializeSecurityTools();
            
            // Setup key management
            this.initializeKeyManagement();
            
            // Start gaming loops
            this.startGameLoop();
            
            console.log('✅ Cybersecurity Shields Layer initialized');
            this.logSystemStatus();
            
        } catch (error) {
            console.error('❌ Failed to initialize Cybersecurity Shields Layer:', error);
            throw error;
        }
    }
    
    async initializeIntegratedSystems() {
        console.log('🔗 Connecting to existing systems...');
        
        // Initialize honeypot shield system
        this.honeypotShield = new HoneypotShieldTrap(
            { query: () => ({}) }, // Mock database
            { addToBlacklist: () => ({}) }, // Mock jumper cables
            {
                enableVisualGlitch: true,
                enablePulsingAnimation: true,
                enableSubliminalMessaging: true,
                enableLogicCapture: true,
                enableDoorSlam: true,
                enableCrazyCharacter: true
            }
        );
        
        // Initialize token economy
        this.tokenEconomy = new TokenEconomyExportSystem({
            includeDecoder: true,
            includeMathProofs: true,
            selfDescribing: true
        });
        
        // Initialize security layer
        this.securityLayer = new UnfuckwithableSecurityLayer(7095);
        
        // Initialize emergency system
        this.emergencySystem = new EmergencyNotificationSystem();
        
        // Connect event handlers
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        // Honeypot shield events
        this.honeypotShield.on('trap_sprung', (data) => {
            this.handleThreatDetected(data);
        });
        
        this.honeypotShield.on('door_slammed', (data) => {
            this.handleThreatNeutralized(data);
        });
        
        // Emergency system events
        this.emergencySystem.on('honeypot_activated', (data) => {
            this.createSecurityShield(data.trapId, 'honeypot');
        });
        
        // Token economy events
        this.tokenEconomy.on('token_minted', (data) => {
            this.updatePlayerTokens(data);
        });
    }
    
    async initializeShieldSystem() {
        console.log('🛡️ Initializing shield system...');
        
        // Create initial player shields
        this.createShield('basic_firewall', {
            type: 'firewall',
            strength: 100,
            energy: 50,
            position: { x: 0, y: 2, z: 0 },
            effects: ['ddos_protection', 'malware_blocking']
        });
        
        this.createShield('encryption_barrier', {
            type: 'encryption',
            strength: 75,
            energy: 40,
            position: { x: 2, y: 2, z: 0 },
            effects: ['data_encryption', 'privacy_protection']
        });
        
        console.log('✅ Shield system initialized with 2 basic shields');
    }
    
    async initializeTokenEconomy() {
        console.log('💰 Initializing token economy integration...');
        
        // Initialize player token balances
        this.gameState.player.tokens.set('database_token', 100);
        this.gameState.player.tokens.set('agent_coin', 50);
        this.gameState.player.tokens.set('vibes_coin', 25);
        this.gameState.player.tokens.set('meme_token', 10);
        
        // Update token economy with initial balances
        for (const [tokenType, amount] of this.gameState.player.tokens) {
            await this.tokenEconomy.updateTokenBalance(tokenType, 'player_001', amount, 'mint');
        }
        
        console.log('✅ Token economy initialized with starting balances');
    }
    
    initializeEnergySystem() {
        console.log('⚡ Initializing energy system...');
        
        // Start energy regeneration
        setInterval(() => {
            this.regenerateEnergy();
        }, 1000); // Every second
        
        // Start ability cooldown management
        setInterval(() => {
            this.updateAbilityCooldowns();
        }, 100); // Every 100ms for smooth cooldowns
        
        console.log('✅ Energy system initialized');
    }
    
    initializeSecurityTools() {
        console.log('🔧 Initializing security tool constructors...');
        
        // Define security tool classes
        this.securityToolClasses = {
            ShieldGenerator: class ShieldGenerator {
                constructor(materials, energy) {
                    this.materials = materials;
                    this.energy = energy;
                    this.shields = new Map();
                }
                
                generateShield(type, strength) {
                    const shieldId = `shield_${Date.now()}`;
                    this.shields.set(shieldId, {
                        type,
                        strength,
                        created: Date.now(),
                        active: true
                    });
                    return shieldId;
                }
                
                upgradeShield(shieldId, enhancement) {
                    const shield = this.shields.get(shieldId);
                    if (shield) {
                        shield.strength += enhancement.strength || 0;
                        shield.effects = [...(shield.effects || []), ...(enhancement.effects || [])];
                        return true;
                    }
                    return false;
                }
            },
            
            ThreatDetector: class ThreatDetector {
                constructor(algorithms, sensitivity) {
                    this.algorithms = algorithms;
                    this.sensitivity = sensitivity;
                    this.detections = new Map();
                }
                
                scanForThreats(area) {
                    const threats = [];
                    // Simulate threat detection
                    const threatTypes = ['malware', 'intrusion', 'ddos', 'phishing'];
                    
                    for (let i = 0; i < Math.floor(Math.random() * 3); i++) {
                        threats.push({
                            id: `threat_${Date.now()}_${i}`,
                            type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
                            severity: Math.floor(Math.random() * 5) + 1,
                            position: {
                                x: (Math.random() - 0.5) * 20,
                                y: Math.random() * 5,
                                z: (Math.random() - 0.5) * 20
                            }
                        });
                    }
                    
                    return threats;
                }
            },
            
            EncryptionEngine: class EncryptionEngine {
                constructor(keySize, algorithm) {
                    this.keySize = keySize;
                    this.algorithm = algorithm;
                    this.keys = new Map();
                }
                
                generateKey(type) {
                    const keyId = `key_${Date.now()}`;
                    this.keys.set(keyId, {
                        type,
                        strength: this.keySize,
                        algorithm: this.algorithm,
                        created: Date.now()
                    });
                    return keyId;
                }
                
                encryptData(data, keyId) {
                    const key = this.keys.get(keyId);
                    if (!key) return null;
                    
                    // Simulate encryption
                    return {
                        encrypted: Buffer.from(JSON.stringify(data)).toString('base64'),
                        keyId,
                        algorithm: key.algorithm
                    };
                }
            }
        };
        
        console.log('✅ Security tool classes initialized');
    }
    
    initializeKeyManagement() {
        console.log('🔑 Initializing key management system...');
        
        // Generate initial keys
        const initialKeys = ['encryption', 'access', 'signature'];
        
        for (const keyType of initialKeys) {
            const keyId = this.generateCryptoKey(keyType, 'medium');
            this.gameState.player.keys.set(keyId, {
                type: keyType,
                strength: 'medium',
                bits: 256,
                created: Date.now(),
                uses: 0,
                maxUses: 100
            });
        }
        
        console.log('✅ Key management initialized with 3 initial keys');
    }
    
    // ==================== SHIELD MANAGEMENT ====================
    
    createShield(shieldId, config) {
        const shield = {
            id: shieldId,
            type: config.type,
            strength: config.strength,
            maxStrength: config.strength,
            energy: config.energy,
            maxEnergy: config.energy,
            position: config.position,
            effects: config.effects || [],
            created: Date.now(),
            active: true,
            visual: {
                color: this.getShieldColor(config.type),
                size: config.strength / 50, // Scale based on strength
                animation: config.type === 'encryption' ? 'pulse' : 'rotate'
            }
        };
        
        this.gameState.activeShields.set(shieldId, shield);
        this.gameState.player.shields.set(shieldId, shield);
        
        // Emit shield creation event for 3D visualization
        this.emit('shield_created', {
            shield,
            position: config.position,
            visual: shield.visual
        });
        
        return shield;
    }
    
    getShieldColor(type) {
        const colors = {
            'firewall': 0xff4444,      // Red
            'encryption': 0x44ff44,    // Green  
            'intrusion': 0x4444ff,     // Blue
            'antivirus': 0xffff44,     // Yellow
            'honeypot': 0xff44ff,      // Magenta
            'quantum': 0x44ffff        // Cyan
        };
        return colors[type] || 0x888888;
    }
    
    upgradeShield(shieldId, enhancement) {
        const shield = this.gameState.activeShields.get(shieldId);
        if (!shield) return false;
        
        // Check if player has required tokens
        const cost = this.calculateUpgradeCost(shield, enhancement);
        if (!this.canAfford(cost)) return false;
        
        // Deduct tokens
        this.spendTokens(cost);
        
        // Apply upgrade
        shield.strength += enhancement.strength || 0;
        shield.maxStrength += enhancement.strength || 0;
        shield.energy += enhancement.energy || 0;
        shield.maxEnergy += enhancement.energy || 0;
        shield.effects = [...shield.effects, ...(enhancement.effects || [])];
        
        // Emit upgrade event
        this.emit('shield_upgraded', { shield, enhancement });
        
        return true;
    }
    
    // ==================== ENERGY MANAGEMENT ====================
    
    regenerateEnergy() {
        const currentEnergy = this.gameState.player.energy;
        const maxEnergy = this.config.energy.maxEnergy;
        const regenRate = this.config.shields.energyRegenRate;
        
        if (currentEnergy < maxEnergy) {
            this.gameState.player.energy = Math.min(maxEnergy, currentEnergy + regenRate);
            
            // Emit energy update
            this.emit('energy_updated', {
                energy: this.gameState.player.energy,
                maxEnergy: maxEnergy,
                percentage: (this.gameState.player.energy / maxEnergy) * 100
            });
        }
        
        // Regenerate shield energy
        for (const [shieldId, shield] of this.gameState.activeShields) {
            if (shield.energy < shield.maxEnergy && shield.active) {
                shield.energy = Math.min(shield.maxEnergy, shield.energy + this.config.shields.shieldRegenRate);
                
                // Emit shield energy update
                this.emit('shield_energy_updated', { shieldId, shield });
            }
        }
    }
    
    useEnergy(amount, purpose) {
        if (this.gameState.player.energy >= amount) {
            this.gameState.player.energy -= amount;
            
            this.emit('energy_consumed', {
                amount,
                purpose,
                remaining: this.gameState.player.energy
            });
            
            return true;
        }
        
        return false;
    }
    
    useSpecialAbility(abilityName) {
        const ability = this.config.energy.specialAbilities[abilityName];
        if (!ability) return false;
        
        // Check cooldown
        const lastUsed = this.gameState.player.activeAbilities.get(abilityName);
        if (lastUsed && Date.now() - lastUsed < ability.cooldown) {
            return false;
        }
        
        // Check energy cost
        if (!this.useEnergy(ability.cost, abilityName)) {
            return false;
        }
        
        // Execute ability
        this.executeSpecialAbility(abilityName);
        
        // Set cooldown
        this.gameState.player.activeAbilities.set(abilityName, Date.now());
        
        return true;
    }
    
    executeSpecialAbility(abilityName) {
        switch (abilityName) {
            case 'encryption_burst':
                this.createTemporaryShield('encryption_burst', {
                    type: 'encryption',
                    strength: 150,
                    duration: 10000, // 10 seconds
                    effects: ['data_protection', 'communication_security']
                });
                break;
                
            case 'firewall_dome':
                this.createAreaEffect('firewall_dome', {
                    radius: 10,
                    duration: 15000,
                    effects: ['block_malicious_traffic', 'ddos_protection']
                });
                break;
                
            case 'intrusion_detection':
                this.performThreatScan();
                break;
                
            case 'quantum_shield':
                this.createShield('quantum_shield', {
                    type: 'quantum',
                    strength: 300,
                    energy: 200,
                    position: { x: 0, y: 3, z: 0 },
                    effects: ['quantum_encryption', 'probability_defense']
                });
                break;
        }
        
        this.emit('special_ability_used', { abilityName });
    }
    
    updateAbilityCooldowns() {
        const now = Date.now();
        const cooldownUpdate = {};
        
        for (const [abilityName, lastUsed] of this.gameState.player.activeAbilities) {
            const ability = this.config.energy.specialAbilities[abilityName];
            if (!ability) continue;
            
            const timeRemaining = Math.max(0, ability.cooldown - (now - lastUsed));
            cooldownUpdate[abilityName] = {
                timeRemaining,
                ready: timeRemaining === 0
            };
        }
        
        this.emit('cooldowns_updated', cooldownUpdate);
    }
    
    // ==================== TOKEN ECONOMY ====================
    
    earnTokens(tokenType, amount, reason) {
        const currentBalance = this.gameState.player.tokens.get(tokenType) || 0;
        this.gameState.player.tokens.set(tokenType, currentBalance + amount);
        
        // Update token economy system
        this.tokenEconomy.updateTokenBalance(tokenType, 'player_001', amount, 'mint');
        
        // Update economy stats
        this.gameState.economyStats.tokensEarned += amount;
        
        this.emit('tokens_earned', {
            tokenType,
            amount,
            reason,
            newBalance: currentBalance + amount
        });
    }
    
    spendTokens(cost) {
        for (const [tokenType, amount] of Object.entries(cost)) {
            const currentBalance = this.gameState.player.tokens.get(tokenType) || 0;
            this.gameState.player.tokens.set(tokenType, currentBalance - amount);
            
            // Update token economy system
            this.tokenEconomy.updateTokenBalance(tokenType, 'player_001', amount, 'burn');
        }
        
        this.emit('tokens_spent', { cost });
    }
    
    canAfford(cost) {
        for (const [tokenType, amount] of Object.entries(cost)) {
            const currentBalance = this.gameState.player.tokens.get(tokenType) || 0;
            if (currentBalance < amount) return false;
        }
        return true;
    }
    
    calculateUpgradeCost(shield, enhancement) {
        const baseCost = shield.strength / 10; // Base cost scales with current strength
        return {
            'database_token': Math.floor(baseCost),
            'agent_coin': Math.floor(baseCost / 2)
        };
    }
    
    // ==================== SECURITY TOOLS CONSTRUCTORS ====================
    
    constructSecurityTool(toolType, materials) {
        const constructor = this.config.constructors[toolType];
        if (!constructor) return null;
        
        // Check materials
        const hasMaterials = constructor.materials.every(material => {
            if (material.endsWith('_token') || material.endsWith('_coin')) {
                const balance = this.gameState.player.tokens.get(material) || 0;
                return balance >= constructor.cost;
            }
            // Check for other materials (keys, algorithms, etc.)
            return this.gameState.player.keys.has(material) || 
                   this.gameState.player.constructedTools.has(material);
        });
        
        if (!hasMaterials) return null;
        
        // Deduct materials
        const cost = {};
        constructor.materials.forEach(material => {
            if (material.endsWith('_token') || material.endsWith('_coin')) {
                cost[material] = constructor.cost;
            }
        });
        
        if (Object.keys(cost).length > 0) {
            this.spendTokens(cost);
        }
        
        // Create tool
        const toolId = `${toolType}_${Date.now()}`;
        let tool;
        
        switch (toolType) {
            case 'shield_generator':
                tool = new this.securityToolClasses.ShieldGenerator(materials, 100);
                break;
            case 'threat_detector':
                tool = new this.securityToolClasses.ThreatDetector(['signature', 'behavioral'], 0.8);
                break;
            case 'encryption_engine':
                tool = new this.securityToolClasses.EncryptionEngine(256, 'AES');
                break;
            default:
                return null;
        }
        
        this.gameState.player.constructedTools.set(toolId, {
            tool,
            type: toolType,
            created: Date.now(),
            uses: 0
        });
        
        this.emit('tool_constructed', { toolId, toolType, tool });
        
        return toolId;
    }
    
    // ==================== KEY MANAGEMENT ====================
    
    generateCryptoKey(type, strength) {
        const keyConfig = this.config.keys.keyStrength[strength];
        if (!keyConfig) return null;
        
        // Check if player can afford key generation
        const cost = { 'database_token': keyConfig.cost };
        if (!this.canAfford(cost)) return null;
        
        this.spendTokens(cost);
        
        const keyId = `${type}_key_${Date.now()}`;
        
        this.emit('key_generated', {
            keyId,
            type,
            strength,
            bits: keyConfig.bits
        });
        
        return keyId;
    }
    
    useKey(keyId, purpose) {
        const key = this.gameState.player.keys.get(keyId);
        if (!key) return false;
        
        if (key.uses >= key.maxUses) return false;
        
        key.uses++;
        
        this.emit('key_used', { keyId, purpose, remainingUses: key.maxUses - key.uses });
        
        return true;
    }
    
    // ==================== THREAT HANDLING ====================
    
    handleThreatDetected(threatData) {
        console.log('🚨 Threat detected:', threatData.trapId);
        
        const threat = {
            id: threatData.trapId,
            type: 'honeypot_intrusion',
            severity: 'high',
            position: {
                x: (Math.random() - 0.5) * 20,
                y: 1,
                z: (Math.random() - 0.5) * 20
            },
            detected: Date.now(),
            neutralized: false
        };
        
        this.gameState.threats.set(threat.id, threat);
        
        // Emit threat for 3D visualization
        this.emit('threat_detected', { threat });
        
        // Award tokens for detection
        this.earnTokens('agent_coin', this.config.tokens.earningRates.vulnerabilityFound, 'threat_detected');
        
        this.gameState.economyStats.threatsBlocked++;
    }
    
    handleThreatNeutralized(slamData) {
        console.log('💥 Threat neutralized:', slamData.trapId);
        
        const threat = this.gameState.threats.get(slamData.trapId);
        if (threat) {
            threat.neutralized = true;
            threat.neutralizedAt = Date.now();
            
            // Award bonus tokens
            this.earnTokens('vibes_coin', this.config.tokens.earningRates.bossDefeated, 'threat_neutralized');
            
            this.emit('threat_neutralized', { threat, slamData });
        }
    }
    
    performThreatScan() {
        // Use threat detector tool if available
        const detectorTool = Array.from(this.gameState.player.constructedTools.values())
            .find(tool => tool.type === 'threat_detector');
        
        if (detectorTool) {
            const threats = detectorTool.tool.scanForThreats({ x: 0, y: 0, z: 0, radius: 20 });
            
            threats.forEach(threat => {
                this.gameState.threats.set(threat.id, {
                    ...threat,
                    detected: Date.now(),
                    neutralized: false
                });
                
                this.emit('threat_detected', { threat });
            });
            
            if (threats.length > 0) {
                this.earnTokens('database_token', threats.length * 5, 'threat_scan');
            }
        }
    }
    
    // ==================== GAME LOOP ====================
    
    startGameLoop() {
        console.log('🎮 Starting game loop...');
        
        // Main game tick (10 FPS for game logic)
        setInterval(() => {
            this.updateGameLogic();
        }, 100);
        
        // Slow update tick (1 FPS for heavy operations)
        setInterval(() => {
            this.updateSlowSystems();
        }, 1000);
        
        // Fast update tick (30 FPS for smooth visuals)
        setInterval(() => {
            this.updateVisuals();
        }, 33);
    }
    
    updateGameLogic() {
        // Update shield positions and effects
        for (const [shieldId, shield] of this.gameState.activeShields) {
            if (shield.active) {
                // Animate shield rotation/pulse
                shield.visual.rotation = (shield.visual.rotation || 0) + 0.02;
                
                // Check for threat interactions
                this.checkShieldThreatInteractions(shield);
            }
        }
        
        // Update threat movements
        for (const [threatId, threat] of this.gameState.threats) {
            if (!threat.neutralized) {
                // Move threats toward player
                const direction = {
                    x: -threat.position.x * 0.01,
                    z: -threat.position.z * 0.01
                };
                threat.position.x += direction.x;
                threat.position.z += direction.z;
            }
        }
    }
    
    updateSlowSystems() {
        // Periodic threat generation
        if (Math.random() < 0.1) { // 10% chance per second
            this.generateRandomThreat();
        }
        
        // Clean up old neutralized threats
        for (const [threatId, threat] of this.gameState.threats) {
            if (threat.neutralized && Date.now() - threat.neutralizedAt > 30000) {
                this.gameState.threats.delete(threatId);
            }
        }
        
        // Export token economy state
        this.exportEconomyState();
    }
    
    updateVisuals() {
        // Emit visual updates for 3D renderer
        this.emit('visual_update', {
            shields: Array.from(this.gameState.activeShields.values()),
            threats: Array.from(this.gameState.threats.values()),
            energy: this.gameState.player.energy,
            tokens: Object.fromEntries(this.gameState.player.tokens)
        });
    }
    
    checkShieldThreatInteractions(shield) {
        for (const [threatId, threat] of this.gameState.threats) {
            if (threat.neutralized) continue;
            
            const distance = Math.sqrt(
                Math.pow(shield.position.x - threat.position.x, 2) +
                Math.pow(shield.position.z - threat.position.z, 2)
            );
            
            if (distance < 3) { // Shield interaction range
                // Shield blocks threat
                this.handleShieldThreatCollision(shield, threat);
            }
        }
    }
    
    handleShieldThreatCollision(shield, threat) {
        // Reduce shield strength
        shield.strength = Math.max(0, shield.strength - threat.severity * 5);
        
        // Neutralize threat
        threat.neutralized = true;
        threat.neutralizedAt = Date.now();
        
        // Award tokens for blocking
        this.earnTokens('database_token', this.config.tokens.earningRates.threatBlocked, 'threat_blocked');
        
        this.emit('shield_threat_collision', { shield, threat });
        
        // Deactivate shield if strength reaches 0
        if (shield.strength <= 0) {
            shield.active = false;
            this.emit('shield_destroyed', { shield });
        }
    }
    
    generateRandomThreat() {
        const threatTypes = ['malware', 'intrusion', 'ddos', 'phishing', 'ransomware'];
        const threat = {
            id: `random_threat_${Date.now()}`,
            type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
            severity: Math.floor(Math.random() * 5) + 1,
            position: {
                x: (Math.random() - 0.5) * 40, // Spawn outside inner area
                y: 1,
                z: (Math.random() - 0.5) * 40
            },
            detected: Date.now(),
            neutralized: false
        };
        
        this.gameState.threats.set(threat.id, threat);
        this.emit('threat_detected', { threat });
    }
    
    async exportEconomyState() {
        try {
            const exportData = await this.tokenEconomy.exportToFormat('json');
            
            // Store export for external audit
            this.emit('economy_exported', {
                exportData,
                playerStats: this.gameState.economyStats,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Failed to export economy state:', error);
        }
    }
    
    // ==================== UTILITY METHODS ====================
    
    createTemporaryShield(shieldId, config) {
        const shield = this.createShield(shieldId, config);
        
        if (config.duration) {
            setTimeout(() => {
                this.gameState.activeShields.delete(shieldId);
                this.gameState.player.shields.delete(shieldId);
                this.emit('shield_expired', { shield });
            }, config.duration);
        }
    }
    
    createAreaEffect(effectId, config) {
        const effect = {
            id: effectId,
            type: 'area_effect',
            radius: config.radius,
            effects: config.effects,
            created: Date.now(),
            active: true
        };
        
        this.emit('area_effect_created', { effect });
        
        if (config.duration) {
            setTimeout(() => {
                effect.active = false;
                this.emit('area_effect_expired', { effect });
            }, config.duration);
        }
    }
    
    logSystemStatus() {
        console.log('\n🛡️ CYBERSECURITY SHIELDS STATUS:');
        console.log('================================');
        console.log(`🛡️  Active Shields: ${this.gameState.activeShields.size}`);
        console.log(`⚡ Player Energy: ${this.gameState.player.energy}/${this.config.energy.maxEnergy}`);
        console.log(`💰 Token Balances:`);
        for (const [tokenType, balance] of this.gameState.player.tokens) {
            console.log(`   ${tokenType}: ${balance}`);
        }
        console.log(`🔑 Keys Available: ${this.gameState.player.keys.size}`);
        console.log(`🔧 Constructed Tools: ${this.gameState.player.constructedTools.size}`);
        console.log(`🚨 Active Threats: ${Array.from(this.gameState.threats.values()).filter(t => !t.neutralized).length}`);
        console.log(`📊 Stats - Threats Blocked: ${this.gameState.economyStats.threatsBlocked}, Tokens Earned: ${this.gameState.economyStats.tokensEarned}`);
        console.log('================================\n');
    }
    
    // ==================== API METHODS ====================
    
    getPlayerState() {
        return {
            energy: this.gameState.player.energy,
            maxEnergy: this.config.energy.maxEnergy,
            tokens: Object.fromEntries(this.gameState.player.tokens),
            shields: Array.from(this.gameState.activeShields.values()),
            keys: Array.from(this.gameState.player.keys.entries()),
            tools: Array.from(this.gameState.player.constructedTools.entries()),
            stats: this.gameState.economyStats
        };
    }
    
    getActiveThreats() {
        return Array.from(this.gameState.threats.values()).filter(t => !t.neutralized);
    }
    
    getAvailableAbilities() {
        const abilities = {};
        const now = Date.now();
        
        for (const [abilityName, config] of Object.entries(this.config.energy.specialAbilities)) {
            const lastUsed = this.gameState.player.activeAbilities.get(abilityName) || 0;
            const cooldownRemaining = Math.max(0, config.cooldown - (now - lastUsed));
            
            abilities[abilityName] = {
                cost: config.cost,
                cooldown: config.cooldown,
                cooldownRemaining,
                canUse: cooldownRemaining === 0 && this.gameState.player.energy >= config.cost
            };
        }
        
        return abilities;
    }
}

module.exports = CybersecurityShieldsLayer;

// CLI usage
if (require.main === module) {
    const shieldsLayer = new CybersecurityShieldsLayer();
    
    // Demo mode
    setTimeout(() => {
        console.log('\n🎮 DEMO: Using special ability...');
        shieldsLayer.useSpecialAbility('firewall_dome');
    }, 3000);
    
    setTimeout(() => {
        console.log('\n🔧 DEMO: Constructing security tool...');
        shieldsLayer.constructSecurityTool('threat_detector', ['agent_coin', 'scan_algorithm']);
    }, 6000);
    
    setTimeout(() => {
        console.log('\n🔑 DEMO: Generating crypto key...');
        shieldsLayer.generateCryptoKey('encryption', 'strong');
    }, 9000);
}