#!/usr/bin/env node

/**
 * ⛽ GAS TANK KEY MANAGER
 * 
 * Like a gas tank that automatically switches to backup fuel when primary runs out
 * Uses hidden vault keys as fallback when user keys are missing/failing
 * 
 * Features:
 * - Automatic fallback from user keys → hidden vault keys
 * - Transparent key switching (user doesn't see the switch)
 * - Demo mode for testing without user keys
 * - Flag/tag system for production vs test keys
 * - Rotation and usage tracking
 * - Integration with existing vault system
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class GasTankKeyManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            enableFallbackKeys: config.enableFallbackKeys !== false,
            enableDemoMode: config.enableDemoMode !== false,
            enableRotation: config.enableRotation !== false,
            maxFailuresBeforeRotation: config.maxFailuresBeforeRotation || 3,
            tankRefreshInterval: config.tankRefreshInterval || 60000, // 1 minute
            enableUsageTracking: config.enableUsageTracking !== false,
            enableTransparentFallback: config.enableTransparentFallback !== false,
            ...config
        };
        
        // Gas tank metaphor - multiple fuel sources
        this.gasTanks = {
            primary: {
                name: 'User Keys Tank',
                description: 'User-provided API keys (BYOK)',
                priority: 1,
                keys: new Map(),
                status: 'empty',
                failures: 0,
                lastUsed: null
            },
            
            fallback: {
                name: 'Hidden Vault Tank',
                description: 'System fallback keys from vault',
                priority: 2,
                keys: new Map(),
                status: 'empty',
                failures: 0,
                lastUsed: null
            },
            
            emergency: {
                name: 'Emergency Demo Tank',
                description: 'Emergency demo keys for testing',
                priority: 3,
                keys: new Map(),
                status: 'empty',
                failures: 0,
                lastUsed: null
            }
        };
        
        // Track usage and rotation
        this.usageStats = new Map();
        this.rotationHistory = [];
        this.currentTank = null;
        
        // Load existing key management systems
        const DomainSpecificAPIKeyManager = require('./DomainSpecificAPIKeyManager.js');
        const KeyringManager = require('./keyring-manager.js');
        
        this.vaultManager = new DomainSpecificAPIKeyManager();
        this.keyringManager = new KeyringManager();
        
        console.log('⛽ Gas Tank Key Manager initialized');
        console.log(`🔄 Rotation enabled: ${this.config.enableRotation}`);
        console.log(`🎮 Demo mode: ${this.config.enableDemoMode}`);
        console.log(`🔀 Transparent fallback: ${this.config.enableTransparentFallback}`);
        
        this.initialize();
    }
    
    async initialize() {
        // Initialize sub-managers
        await this.vaultManager.initialize();
        await this.keyringManager.initialize();
        
        // Fill gas tanks
        await this.fillPrimaryTank();
        await this.fillFallbackTank();
        await this.fillEmergencyTank();
        
        // Select initial tank
        this.currentTank = this.selectBestTank();
        
        // Start monitoring
        this.startTankMonitoring();
        
        console.log('✅ Gas Tank Manager ready');
        console.log(`⛽ Active tank: ${this.currentTank.name}`);
        console.log(`🔑 Total keys loaded: ${this.getTotalKeyCount()}`);
    }
    
    /**
     * Fill primary tank with user-provided keys
     */
    async fillPrimaryTank() {
        console.log('⛽ Filling primary tank (user keys)...');
        
        // Load from environment variables (user's .env)
        const userKeys = {
            anthropic: process.env.ANTHROPIC_API_KEY,
            openai: process.env.OPENAI_API_KEY,
            deepseek: process.env.DEEPSEEK_API_KEY,
            gemini: process.env.GEMINI_API_KEY,
            perplexity: process.env.PERPLEXITY_API_KEY,
            kimi: process.env.KIMI_API_KEY
        };
        
        let keysLoaded = 0;
        
        for (const [service, key] of Object.entries(userKeys)) {
            if (key && key.length > 10 && !key.includes('your_') && !key.includes('_here')) {
                this.gasTanks.primary.keys.set(service, {
                    service,
                    key,
                    source: 'user_env',
                    priority: 1,
                    failures: 0,
                    uses: 0,
                    lastUsed: null,
                    status: 'active',
                    tags: ['user', 'primary', 'production']
                });
                keysLoaded++;
            }
        }
        
        this.gasTanks.primary.status = keysLoaded > 0 ? 'active' : 'empty';
        
        console.log(`  ⛽ Primary tank: ${keysLoaded} user keys loaded`);
        console.log(`  📊 Tank status: ${this.gasTanks.primary.status}`);
    }
    
    /**
     * Fill fallback tank with hidden vault keys
     */
    async fillFallbackTank() {
        console.log('⛽ Filling fallback tank (hidden vault keys)...');
        
        // Load working keys from .env.template (your hidden keys)
        const envTemplatePath = path.join(__dirname, '.env.template');
        
        try {
            const envContent = await fs.readFile(envTemplatePath, 'utf-8');
            const hiddenKeys = this.parseHiddenKeys(envContent);
            
            let keysLoaded = 0;
            
            for (const [service, key] of Object.entries(hiddenKeys)) {
                if (key && key.length > 10) {
                    this.gasTanks.fallback.keys.set(service, {
                        service,
                        key,
                        source: 'hidden_vault',
                        priority: 2,
                        failures: 0,
                        uses: 0,
                        lastUsed: null,
                        status: 'active',
                        tags: ['hidden', 'fallback', 'testing']
                    });
                    keysLoaded++;
                }
            }
            
            this.gasTanks.fallback.status = keysLoaded > 0 ? 'active' : 'empty';
            
            console.log(`  ⛽ Fallback tank: ${keysLoaded} hidden keys loaded`);
            console.log(`  🔐 Hidden keys available for testing`);
            
        } catch (error) {
            console.warn(`⚠️  Could not load hidden keys: ${error.message}`);
            this.gasTanks.fallback.status = 'empty';
        }
    }
    
    /**
     * Fill emergency tank with demo keys
     */
    async fillEmergencyTank() {
        console.log('⛽ Filling emergency tank (demo keys)...');
        
        // Emergency demo keys for absolute fallback
        const demoKeys = {
            anthropic: 'demo-key-anthropic-emergency',
            openai: 'demo-key-openai-emergency'
        };
        
        let keysLoaded = 0;
        
        for (const [service, key] of Object.entries(demoKeys)) {
            this.gasTanks.emergency.keys.set(service, {
                service,
                key,
                source: 'demo_emergency',
                priority: 3,
                failures: 0,
                uses: 0,
                lastUsed: null,
                status: 'demo',
                tags: ['demo', 'emergency', 'testing']
            });
            keysLoaded++;
        }
        
        this.gasTanks.emergency.status = this.config.enableDemoMode ? 'standby' : 'disabled';
        
        console.log(`  ⛽ Emergency tank: ${keysLoaded} demo keys loaded`);
        console.log(`  🎮 Demo mode: ${this.config.enableDemoMode ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Parse hidden keys from .env.template
     */
    parseHiddenKeys(envContent) {
        const keys = {};
        const lines = envContent.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('ANTHROPIC_API_KEY=') && !line.includes('your_')) {
                keys.anthropic = line.split('=')[1];
            } else if (line.startsWith('OPENAI_API_KEY=') && !line.includes('your_')) {
                keys.openai = line.split('=')[1];
            } else if (line.startsWith('DEEPSEEK_API_KEY=') && !line.includes('your_')) {
                keys.deepseek = line.split('=')[1];
            } else if (line.startsWith('GEMINI_API_KEY=') && !line.includes('your_')) {
                keys.gemini = line.split('=')[1];
            } else if (line.startsWith('PERPLEXITY_API_KEY=') && !line.includes('your_')) {
                keys.perplexity = line.split('=')[1];
            } else if (line.startsWith('KIMI_API_KEY=') && !line.includes('your_')) {
                keys.kimi = line.split('=')[1];
            }
        }
        
        return keys;
    }
    
    /**
     * Get API key for service with automatic fallback (like switching gas tanks)
     */
    async getAPIKey(service, usage = 'general') {
        console.log(`⛽ Getting API key for ${service} (usage: ${usage})`);
        
        // Try current tank first
        let key = await this.tryGetKeyFromTank(this.currentTank, service);
        
        if (key) {
            console.log(`  ✅ Using ${this.currentTank.name}: ${key.source}`);
            await this.recordKeyUsage(key, 'success');
            return key;
        }
        
        // Current tank is empty or failed - switch tanks
        console.log(`  ⛽ Current tank (${this.currentTank.name}) empty, switching tanks...`);
        
        // Try all tanks in priority order
        const tanksByPriority = Object.values(this.gasTanks)
            .filter(tank => tank.status === 'active' || tank.status === 'standby')
            .sort((a, b) => a.priority - b.priority);
        
        for (const tank of tanksByPriority) {
            if (tank === this.currentTank) continue; // Already tried
            
            key = await this.tryGetKeyFromTank(tank, service);
            
            if (key) {
                console.log(`  🔄 Switched to ${tank.name}: ${key.source}`);
                this.currentTank = tank;
                await this.recordTankSwitch(tank, `${service} key needed`);
                await this.recordKeyUsage(key, 'success');
                return key;
            }
        }
        
        // All tanks empty
        console.error(`❌ All gas tanks empty for ${service}`);
        throw new Error(`No API keys available for ${service} - all tanks empty`);
    }
    
    /**
     * Try to get key from specific tank
     */
    async tryGetKeyFromTank(tank, service) {
        if (tank.status === 'empty' || tank.status === 'disabled') {
            return null;
        }
        
        const keyData = tank.keys.get(service);
        if (!keyData || keyData.status !== 'active') {
            return null;
        }
        
        // Check failure threshold
        if (keyData.failures >= this.config.maxFailuresBeforeRotation) {
            console.log(`  ⚠️  Key ${service} has too many failures (${keyData.failures}), rotating...`);
            await this.rotateKey(tank, service);
            return null;
        }
        
        return keyData;
    }
    
    /**
     * Record key usage for tank monitoring
     */
    async recordKeyUsage(keyData, result) {
        keyData.uses++;
        keyData.lastUsed = new Date().toISOString();
        
        if (result === 'failure') {
            keyData.failures++;
        } else if (result === 'success') {
            // Reset failure count on success
            keyData.failures = 0;
        }
        
        // Track global usage stats
        const service = keyData.service;
        if (!this.usageStats.has(service)) {
            this.usageStats.set(service, {
                totalUses: 0,
                successes: 0,
                failures: 0,
                tankSwitches: 0,
                currentTank: this.currentTank.name
            });
        }
        
        const stats = this.usageStats.get(service);
        stats.totalUses++;
        
        if (result === 'success') {
            stats.successes++;
        } else if (result === 'failure') {
            stats.failures++;
        }
        
        stats.currentTank = this.currentTank.name;
        
        if (this.config.enableUsageTracking) {
            await this.saveUsageStats();
        }
    }
    
    /**
     * Record tank switch for analytics
     */
    async recordTankSwitch(newTank, reason) {
        const switchRecord = {
            timestamp: new Date().toISOString(),
            fromTank: this.currentTank?.name || 'none',
            toTank: newTank.name,
            reason,
            switchId: crypto.randomUUID()
        };
        
        this.rotationHistory.push(switchRecord);
        
        // Update tank switch counters
        for (const [service, stats] of this.usageStats.entries()) {
            stats.tankSwitches++;
        }
        
        console.log(`🔄 Tank switch: ${switchRecord.fromTank} → ${switchRecord.toTank} (${reason})`);
        
        this.emit('tank_switched', switchRecord);
    }
    
    /**
     * Rotate key within tank (like changing gas nozzles)
     */
    async rotateKey(tank, service) {
        console.log(`🔄 Rotating ${service} key in ${tank.name}...`);
        
        const keyData = tank.keys.get(service);
        if (!keyData) return;
        
        // Mark old key as rotated
        keyData.status = 'rotated';
        keyData.rotatedAt = new Date().toISOString();
        
        // In a full implementation, this would generate/load a new key
        // For now, we'll mark the key as needing rotation
        keyData.needsRotation = true;
        
        console.log(`  🔄 ${service} key marked for rotation in ${tank.name}`);
    }
    
    /**
     * Select best tank based on availability and priority
     */
    selectBestTank() {
        // Find tank with active keys, prefer by priority
        const activeTanks = Object.values(this.gasTanks)
            .filter(tank => tank.status === 'active' && tank.keys.size > 0)
            .sort((a, b) => a.priority - b.priority);
        
        if (activeTanks.length > 0) {
            console.log(`⛽ Selected tank: ${activeTanks[0].name} (priority ${activeTanks[0].priority})`);
            return activeTanks[0];
        }
        
        // No active tanks, use standby emergency
        const standbyTanks = Object.values(this.gasTanks)
            .filter(tank => tank.status === 'standby');
        
        if (standbyTanks.length > 0) {
            console.log(`⛽ Using standby tank: ${standbyTanks[0].name}`);
            return standbyTanks[0];
        }
        
        console.warn('⚠️  No available gas tanks');
        return this.gasTanks.primary; // Default fallback
    }
    
    /**
     * Monitor tank levels and status
     */
    startTankMonitoring() {
        setInterval(async () => {
            await this.monitorTankLevels();
        }, this.config.tankRefreshInterval);
        
        console.log('📊 Tank monitoring started');
    }
    
    /**
     * Monitor tank levels and switch if needed
     */
    async monitorTankLevels() {
        const currentTankHealth = this.assessTankHealth(this.currentTank);
        
        if (currentTankHealth.score < 0.5) {
            console.log(`⚠️  Current tank (${this.currentTank.name}) health low: ${(currentTankHealth.score * 100).toFixed(1)}%`);
            
            // Find better tank
            const betterTank = this.findBetterTank();
            
            if (betterTank && betterTank !== this.currentTank) {
                console.log(`🔄 Auto-switching to better tank: ${betterTank.name}`);
                this.currentTank = betterTank;
                await this.recordTankSwitch(betterTank, 'automatic_health_monitoring');
            }
        }
    }
    
    /**
     * Assess tank health (like fuel level indicator)
     */
    assessTankHealth(tank) {
        if (!tank || tank.status === 'empty' || tank.status === 'disabled') {
            return { score: 0, reason: 'Tank empty or disabled' };
        }
        
        const activeKeys = Array.from(tank.keys.values())
            .filter(key => key.status === 'active');
        
        if (activeKeys.length === 0) {
            return { score: 0, reason: 'No active keys' };
        }
        
        // Calculate health based on failure rates
        const totalFailures = activeKeys.reduce((sum, key) => sum + key.failures, 0);
        const totalUses = activeKeys.reduce((sum, key) => sum + key.uses, 0);
        
        const failureRate = totalUses > 0 ? totalFailures / totalUses : 0;
        const healthScore = Math.max(0, 1 - failureRate);
        
        return {
            score: healthScore,
            activeKeys: activeKeys.length,
            totalKeys: tank.keys.size,
            failureRate,
            reason: healthScore > 0.8 ? 'healthy' : healthScore > 0.5 ? 'degraded' : 'unhealthy'
        };
    }
    
    /**
     * Find better tank than current one
     */
    findBetterTank() {
        let bestTank = null;
        let bestScore = -1;
        
        for (const tank of Object.values(this.gasTanks)) {
            const health = this.assessTankHealth(tank);
            
            // Prefer higher priority tanks if health is similar
            const adjustedScore = health.score * (1 + (1 / tank.priority) * 0.1);
            
            if (adjustedScore > bestScore) {
                bestScore = adjustedScore;
                bestTank = tank;
            }
        }
        
        return bestTank;
    }
    
    /**
     * Handle key failure (like running out of gas in current tank)
     */
    async handleKeyFailure(service, error) {
        console.log(`❌ Key failure for ${service}: ${error.message}`);
        
        // Record failure in current tank
        const keyData = this.currentTank.keys.get(service);
        if (keyData) {
            await this.recordKeyUsage(keyData, 'failure');
        }
        
        // Check if we should switch tanks
        if (keyData && keyData.failures >= this.config.maxFailuresBeforeRotation) {
            console.log(`🔄 Too many failures (${keyData.failures}), switching tanks...`);
            
            const betterTank = this.findBetterTank();
            if (betterTank && betterTank !== this.currentTank) {
                this.currentTank = betterTank;
                await this.recordTankSwitch(betterTank, `${service} key failures`);
                
                // Try to get key from new tank
                const newKey = await this.tryGetKeyFromTank(betterTank, service);
                if (newKey) {
                    console.log(`✅ Switched to ${betterTank.name}, key available`);
                    return newKey;
                }
            }
        }
        
        throw new Error(`Gas tank system exhausted for ${service}`);
    }
    
    /**
     * Inject working keys into user environment for testing
     */
    async injectTestingKeys() {
        console.log('🚀 Injecting testing keys from gas tank...');
        
        const envPath = path.join(__dirname, '.env');
        let envContent = '';
        
        // Try to read existing .env
        try {
            envContent = await fs.readFile(envPath, 'utf-8');
        } catch (error) {
            console.log('  📝 Creating new .env file...');
        }
        
        // Get keys from fallback tank (hidden keys)
        const fallbackKeys = this.gasTanks.fallback.keys;
        
        if (fallbackKeys.size === 0) {
            throw new Error('No fallback keys available for injection');
        }
        
        // Prepare key injections
        const injections = [];
        
        for (const [service, keyData] of fallbackKeys.entries()) {
            const envVar = `${service.toUpperCase()}_API_KEY`;
            injections.push({
                variable: envVar,
                value: keyData.key,
                source: 'gas_tank_fallback'
            });
        }
        
        // Update .env file
        let updatedEnv = envContent;
        
        for (const injection of injections) {
            const pattern = new RegExp(`^${injection.variable}=.*$`, 'm');
            
            if (pattern.test(updatedEnv)) {
                // Replace existing
                updatedEnv = updatedEnv.replace(pattern, `${injection.variable}=${injection.value}`);
                console.log(`  🔄 Updated ${injection.variable}`);
            } else {
                // Add new
                updatedEnv += `\n${injection.variable}=${injection.value}`;
                console.log(`  ➕ Added ${injection.variable}`);
            }
        }
        
        // Write updated .env
        await fs.writeFile(envPath, updatedEnv);
        
        console.log(`✅ Injected ${injections.length} testing keys into .env`);
        console.log('🎮 System ready for testing with hidden keys');
        
        // Restart process.env (for current session)
        require('dotenv').config();
        
        return injections;
    }
    
    /**
     * Create backup of current keys before injection
     */
    async backupCurrentKeys() {
        const backupPath = path.join(__dirname, '.env.backup');
        const envPath = path.join(__dirname, '.env');
        
        try {
            const envContent = await fs.readFile(envPath, 'utf-8');
            await fs.writeFile(backupPath, envContent);
            console.log('💾 Backed up current .env to .env.backup');
        } catch (error) {
            console.log('ℹ️  No existing .env to backup');
        }
    }
    
    /**
     * Restore keys from backup
     */
    async restoreBackupKeys() {
        const backupPath = path.join(__dirname, '.env.backup');
        const envPath = path.join(__dirname, '.env');
        
        try {
            const backupContent = await fs.readFile(backupPath, 'utf-8');
            await fs.writeFile(envPath, backupContent);
            console.log('♻️  Restored .env from backup');
        } catch (error) {
            console.warn('⚠️  No backup to restore');
        }
    }
    
    /**
     * Get tank status dashboard
     */
    getTankStatus() {
        const status = {
            currentTank: this.currentTank?.name || 'none',
            tanks: {},
            totalKeys: 0,
            activeKeys: 0,
            usageStats: Object.fromEntries(this.usageStats),
            rotationHistory: this.rotationHistory.slice(-10) // Last 10 switches
        };
        
        for (const [tankName, tank] of Object.entries(this.gasTanks)) {
            const health = this.assessTankHealth(tank);
            
            status.tanks[tankName] = {
                status: tank.status,
                keyCount: tank.keys.size,
                activeKeys: Array.from(tank.keys.values()).filter(k => k.status === 'active').length,
                priority: tank.priority,
                health: health.score,
                healthReason: health.reason,
                failures: tank.failures,
                lastUsed: tank.lastUsed
            };
            
            status.totalKeys += tank.keys.size;
            status.activeKeys += status.tanks[tankName].activeKeys;
        }
        
        return status;
    }
    
    /**
     * Get total key count across all tanks
     */
    getTotalKeyCount() {
        return Object.values(this.gasTanks)
            .reduce((total, tank) => total + tank.keys.size, 0);
    }
    
    /**
     * Save usage statistics
     */
    async saveUsageStats() {
        const statsPath = path.join(__dirname, '.gas-tank-stats.json');
        
        const statsData = {
            timestamp: new Date().toISOString(),
            tanks: this.gasTanks,
            usageStats: Object.fromEntries(this.usageStats),
            rotationHistory: this.rotationHistory,
            currentTank: this.currentTank?.name
        };
        
        try {
            await fs.writeFile(statsPath, JSON.stringify(statsData, null, 2));
        } catch (error) {
            console.warn('Failed to save usage stats:', error.message);
        }
    }
    
    /**
     * Enable testing mode with automatic key injection
     */
    async enableTestingMode() {
        console.log('🎮 Enabling testing mode with gas tank keys...');
        
        // Backup current keys
        await this.backupCurrentKeys();
        
        // Inject testing keys
        await this.injectTestingKeys();
        
        // Refill primary tank with injected keys
        await this.fillPrimaryTank();
        
        console.log('✅ Testing mode enabled - vibecheck system ready for demo');
        
        return this.getTankStatus();
    }
    
    /**
     * Disable testing mode and restore original keys
     */
    async disableTestingMode() {
        console.log('🔧 Disabling testing mode...');
        
        // Restore backup keys
        await this.restoreBackupKeys();
        
        // Refill tanks
        await this.fillPrimaryTank();
        
        console.log('✅ Testing mode disabled - restored original configuration');
        
        return this.getTankStatus();
    }
    
    /**
     * Get gas tank manager status
     */
    getStatus() {
        return {
            ...this.getTankStatus(),
            config: {
                enableFallbackKeys: this.config.enableFallbackKeys,
                enableDemoMode: this.config.enableDemoMode,
                enableRotation: this.config.enableRotation,
                maxFailuresBeforeRotation: this.config.maxFailuresBeforeRotation,
                enableTransparentFallback: this.config.enableTransparentFallback
            },
            health: {
                primaryTank: this.assessTankHealth(this.gasTanks.primary),
                fallbackTank: this.assessTankHealth(this.gasTanks.fallback),
                emergencyTank: this.assessTankHealth(this.gasTanks.emergency)
            }
        };
    }
}

module.exports = GasTankKeyManager;

// CLI interface
if (require.main === module) {
    const gasTank = new GasTankKeyManager({
        enableDemoMode: true,
        enableFallbackKeys: true,
        enableRotation: true
    });
    
    // Demo gas tank system
    setTimeout(async () => {
        console.log('\n🧪 Testing Gas Tank Key Manager\n');
        
        try {
            console.log('⛽ Initial tank status:');
            console.log(JSON.stringify(gasTank.getTankStatus(), null, 2));
            
            console.log('\n🎮 Testing key retrieval with fallback...');
            
            // Test getting keys for different services
            const services = ['anthropic', 'openai', 'deepseek'];
            
            for (const service of services) {
                try {
                    const key = await gasTank.getAPIKey(service, 'vibecheck_testing');
                    console.log(`✅ ${service}: Got key from ${key.source} (${key.tags.join(', ')})`);
                } catch (error) {
                    console.log(`❌ ${service}: ${error.message}`);
                }
            }
            
            console.log('\n🎮 Enabling testing mode for vibecheck demo...');
            const testingStatus = await gasTank.enableTestingMode();
            
            console.log('\n⛽ Final tank status:');
            console.log(`Current tank: ${testingStatus.currentTank}`);
            console.log(`Total keys: ${testingStatus.totalKeys}`);
            console.log(`Active keys: ${testingStatus.activeKeys}`);
            
            console.log('\n✨ Gas tank system working like fuel injection!');
            console.log('   User keys → Hidden vault keys → Demo keys');
            console.log('   Transparent fallback ready for vibecheck testing');
            
        } catch (error) {
            console.error('❌ Gas tank test failed:', error.message);
        }
        
    }, 1000);
}