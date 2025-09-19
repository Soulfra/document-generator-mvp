#!/usr/bin/env node

/**
 * 🎭 Multi-Environment Orchestrator
 * 
 * Manages King and Queen dancing across different encrypted environments.
 * Each system maintains its own keys while sharing choreography.
 * 
 * Uses dotenvx pattern for secure cross-environment variable management.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class MultiEnvOrchestrator extends EventEmitter {
    constructor() {
        super();
        
        // Environment configurations
        this.environments = {
            king: {
                name: 'King Environment (Technical)',
                envFile: '.env.king',
                keyFile: '.env.king.key',
                encryption: 'aes-256-gcm',
                variables: new Map(),
                memory: new Map()
            },
            queen: {
                name: 'Queen Environment (Human)',
                envFile: '.env.queen',
                keyFile: '.env.queen.key',
                encryption: 'aes-256-gcm',
                variables: new Map(),
                memory: new Map()
            },
            bridge: {
                name: 'Bridge Environment (Shared)',
                envFile: '.env.bridge',
                keyFile: '.env.bridge.key',
                encryption: 'aes-256-gcm',
                variables: new Map(),
                memory: new Map()
            },
            vault: {
                name: 'Vault Environment (Encrypted Memories)',
                envFile: '.env.vault',
                keyFile: '.env.vault.key',
                encryption: 'aes-256-gcm',
                variables: new Map(),
                memory: new Map()
            }
        };
        
        // Shared choreography patterns
        this.sharedChoreography = {
            waltz: { king: 'technical-check', queen: 'user-happiness' },
            tango: { king: 'error-analysis', queen: 'frustration-mapping' },
            salsa: { king: 'performance-boost', queen: 'delight-detection' }
        };
        
        // COBOL-style memory patterns
        this.cobolPatterns = {
            '01-KING-MEMORY': {
                '05-SERVICE-STATUS': 'PIC X(10)',
                '05-ERROR-COUNT': 'PIC 9(5)',
                '05-LATENCY-MS': 'PIC 9(7)'
            },
            '01-QUEEN-MEMORY': {
                '05-USER-EMOTION': 'PIC X(20)',
                '05-SATISFACTION': 'PIC 9(3)',
                '05-JOURNEY-STEP': 'PIC X(50)'
            }
        };
        
        this.initialized = false;
    }
    
    /**
     * Initialize all environments
     */
    async initialize() {
        console.log('🎭 Initializing Multi-Environment Orchestrator...');
        
        for (const [envName, config] of Object.entries(this.environments)) {
            await this.initializeEnvironment(envName, config);
        }
        
        this.initialized = true;
        console.log('✅ All environments initialized');
        
        // Start memory synchronization
        this.startMemorySync();
    }
    
    /**
     * Initialize a single environment
     */
    async initializeEnvironment(name, config) {
        console.log(`🔧 Initializing ${config.name}...`);
        
        // Check if env file exists
        if (fs.existsSync(config.envFile)) {
            // Load encrypted variables
            await this.loadEncryptedEnv(name, config);
        } else {
            // Create new environment
            await this.createEnvironment(name, config);
        }
        
        // Generate or load encryption key
        await this.ensureEncryptionKey(name, config);
    }
    
    /**
     * Load encrypted environment variables
     */
    async loadEncryptedEnv(name, config) {
        try {
            const encryptedContent = fs.readFileSync(config.envFile, 'utf8');
            const key = await this.loadEncryptionKey(config.keyFile);
            
            if (key) {
                const decrypted = this.decrypt(encryptedContent, key);
                const variables = this.parseEnvContent(decrypted);
                
                config.variables = new Map(Object.entries(variables));
                console.log(`✅ Loaded ${config.variables.size} variables for ${name}`);
            } else {
                console.log(`⚠️  No encryption key found for ${name}`);
            }
        } catch (error) {
            console.error(`❌ Error loading ${name}:`, error.message);
        }
    }
    
    /**
     * Create new environment with defaults
     */
    async createEnvironment(name, config) {
        const defaults = this.getDefaultVariables(name);
        config.variables = new Map(Object.entries(defaults));
        
        // Save encrypted
        await this.saveEnvironment(name);
    }
    
    /**
     * Get default variables for each environment
     */
    getDefaultVariables(name) {
        const defaults = {
            king: {
                KING_PORT: '9999',
                KING_ROLE: 'technical_monitor',
                KING_METRICS: 'true',
                KING_DANCE_STYLE: 'precise',
                SYSTEM_HEALTH_THRESHOLD: '80'
            },
            queen: {
                QUEEN_PORT: '9998',
                QUEEN_ROLE: 'human_experience',
                QUEEN_EMPATHY: 'true',
                QUEEN_DANCE_STYLE: 'graceful',
                USER_HAPPINESS_TARGET: '90'
            },
            bridge: {
                BRIDGE_PORT: '9997',
                BRIDGE_ROLE: 'translator',
                SYNC_INTERVAL: '5000',
                WEBSOCKET_SECURE: 'true',
                SHARED_SECRET: crypto.randomBytes(32).toString('hex')
            },
            vault: {
                VAULT_TYPE: 'shared_memory',
                VAULT_ENCRYPTION: 'aes-256-gcm',
                VAULT_VERSION: '1.0',
                DANCE_PATTERNS: JSON.stringify(this.sharedChoreography)
            }
        };
        
        return defaults[name] || {};
    }
    
    /**
     * Ensure encryption key exists
     */
    async ensureEncryptionKey(name, config) {
        if (!fs.existsSync(config.keyFile)) {
            // Generate new key
            const key = crypto.randomBytes(32);
            fs.writeFileSync(config.keyFile, key.toString('hex'), 'utf8');
            console.log(`🔐 Generated new encryption key for ${name}`);
        }
    }
    
    /**
     * Load encryption key
     */
    async loadEncryptionKey(keyFile) {
        if (fs.existsSync(keyFile)) {
            const keyHex = fs.readFileSync(keyFile, 'utf8').trim();
            return Buffer.from(keyHex, 'hex');
        }
        return null;
    }
    
    /**
     * Encrypt content
     */
    encrypt(text, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }
    
    /**
     * Decrypt content
     */
    decrypt(encryptedData, key) {
        const { encrypted, iv, authTag } = JSON.parse(encryptedData);
        
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            key,
            Buffer.from(iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
    
    /**
     * Parse environment content
     */
    parseEnvContent(content) {
        const variables = {};
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key) {
                    variables[key.trim()] = valueParts.join('=').trim();
                }
            }
        }
        
        return variables;
    }
    
    /**
     * Save environment (encrypted)
     */
    async saveEnvironment(name) {
        const config = this.environments[name];
        if (!config) return;
        
        // Convert variables to env format
        const content = Array.from(config.variables.entries())
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        
        // Encrypt
        const key = await this.loadEncryptionKey(config.keyFile);
        if (key) {
            const encrypted = this.encrypt(content, key);
            fs.writeFileSync(config.envFile, JSON.stringify(encrypted), 'utf8');
            console.log(`💾 Saved ${name} environment`);
        }
    }
    
    /**
     * Start memory synchronization between environments
     */
    startMemorySync() {
        console.log('🔄 Starting cross-environment memory sync...');
        
        setInterval(() => {
            this.syncMemories();
        }, 5000);
    }
    
    /**
     * Sync memories between King and Queen through Bridge
     */
    syncMemories() {
        // Get King's technical memories
        const kingMemory = this.environments.king.memory;
        const kingData = {
            serviceHealth: kingMemory.get('service_health') || 100,
            errorCount: kingMemory.get('error_count') || 0,
            latency: kingMemory.get('latency_ms') || 0
        };
        
        // Translate to Queen's emotional understanding
        const queenData = this.translateKingToQueen(kingData);
        
        // Update Queen's memory
        const queenMemory = this.environments.queen.memory;
        queenMemory.set('user_emotion', queenData.emotion);
        queenMemory.set('satisfaction', queenData.satisfaction);
        queenMemory.set('journey_status', queenData.journeyStatus);
        
        // Store in vault for persistence
        this.storeInVault('last_sync', {
            timestamp: new Date().toISOString(),
            king: kingData,
            queen: queenData
        });
        
        this.emit('memory_synced', { king: kingData, queen: queenData });
    }
    
    /**
     * Translate King's technical data to Queen's emotional data
     */
    translateKingToQueen(kingData) {
        let emotion = 'happy';
        let satisfaction = 100;
        let journeyStatus = 'smooth';
        
        // Map technical metrics to emotions
        if (kingData.serviceHealth < 50) {
            emotion = 'frustrated';
            satisfaction = 30;
            journeyStatus = 'blocked';
        } else if (kingData.serviceHealth < 80) {
            emotion = 'confused';
            satisfaction = 60;
            journeyStatus = 'bumpy';
        }
        
        if (kingData.errorCount > 10) {
            emotion = 'frustrated';
            satisfaction = Math.max(satisfaction - 20, 0);
        }
        
        if (kingData.latency > 2000) {
            emotion = 'impatient';
            satisfaction = Math.max(satisfaction - 10, 0);
            journeyStatus = 'slow';
        }
        
        return { emotion, satisfaction, journeyStatus };
    }
    
    /**
     * Store in encrypted vault
     */
    storeInVault(key, value) {
        const vault = this.environments.vault;
        vault.memory.set(key, value);
        
        // Also update vault variables for persistence
        vault.variables.set(`MEMORY_${key.toUpperCase()}`, JSON.stringify(value));
        this.saveEnvironment('vault');
    }
    
    /**
     * Get shared dance pattern
     */
    getSharedDance(danceType) {
        return this.sharedChoreography[danceType] || null;
    }
    
    /**
     * Execute synchronized dance
     */
    async executeDance(danceType) {
        const dance = this.getSharedDance(danceType);
        if (!dance) {
            console.log(`❌ Unknown dance: ${danceType}`);
            return;
        }
        
        console.log(`💃 Executing ${danceType}...`);
        
        // King performs his part
        const kingResult = await this.performKingMove(dance.king);
        
        // Queen performs her part
        const queenResult = await this.performQueenMove(dance.queen);
        
        // Sync results
        this.emit('dance_completed', {
            dance: danceType,
            king: kingResult,
            queen: queenResult
        });
    }
    
    /**
     * King's dance move (technical)
     */
    async performKingMove(move) {
        console.log(`👑 King performing: ${move}`);
        
        // Simulate technical check
        const result = {
            move,
            metrics: {
                cpu: Math.random() * 100,
                memory: Math.random() * 100,
                services: Math.floor(Math.random() * 10) + 20
            }
        };
        
        // Store in King's memory
        this.environments.king.memory.set('last_move', result);
        
        return result;
    }
    
    /**
     * Queen's dance move (human)
     */
    async performQueenMove(move) {
        console.log(`👸 Queen performing: ${move}`);
        
        // Simulate human experience check
        const result = {
            move,
            experience: {
                happiness: Math.floor(Math.random() * 100),
                confusion: Math.floor(Math.random() * 50),
                delight: Math.floor(Math.random() * 100)
            }
        };
        
        // Store in Queen's memory
        this.environments.queen.memory.set('last_move', result);
        
        return result;
    }
    
    /**
     * Get environment status
     */
    getStatus() {
        const status = {};
        
        for (const [name, config] of Object.entries(this.environments)) {
            status[name] = {
                name: config.name,
                variables: config.variables.size,
                memories: config.memory.size,
                encrypted: fs.existsSync(config.envFile),
                hasKey: fs.existsSync(config.keyFile)
            };
        }
        
        return status;
    }
}

// Export for use
module.exports = MultiEnvOrchestrator;

// Run if called directly
if (require.main === module) {
    const orchestrator = new MultiEnvOrchestrator();
    
    orchestrator.on('memory_synced', (data) => {
        console.log('🔄 Memory synced:', data);
    });
    
    orchestrator.on('dance_completed', (data) => {
        console.log('💃 Dance completed:', data);
    });
    
    orchestrator.initialize().then(() => {
        console.log('🎭 Multi-Environment Orchestrator ready!');
        console.log('📊 Status:', orchestrator.getStatus());
        
        // Demo: Execute a waltz
        setTimeout(() => {
            orchestrator.executeDance('waltz');
        }, 2000);
    });
}