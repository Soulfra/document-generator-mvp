#!/usr/bin/env node

/**
 * 🚀 INJECT TESTING KEYS
 * 
 * Automated key injection script that rotates placeholders with working keys
 * Like a fuel injection system that automatically switches to working gas
 * 
 * Features:
 * - Automatic discovery of working keys from .env.template
 * - Safe backup and restore of user keys
 * - Flag/tag system for test vs production modes
 * - Integration with gas tank key manager
 * - One-click testing mode activation
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class TestingKeyInjector {
    constructor(config = {}) {
        this.config = {
            enableBackup: config.enableBackup !== false,
            enableRotation: config.enableRotation !== false,
            enableAutoRestore: config.enableAutoRestore !== false,
            backupSuffix: config.backupSuffix || '.backup',
            testingFlag: config.testingFlag || '# TESTING_MODE_ACTIVE',
            ...config
        };
        
        this.workingDir = __dirname;
        this.envPath = path.join(this.workingDir, '.env');
        this.templatePath = path.join(this.workingDir, '.env.template');
        this.backupPath = path.join(this.workingDir, '.env.backup');
        
        // Track injection state
        this.injectionHistory = [];
        this.currentMode = 'unknown';
        
        console.log('🚀 Testing Key Injector initialized');
        console.log(`📁 Working directory: ${this.workingDir}`);
        
        this.initialize();
    }
    
    async initialize() {
        // Detect current mode
        this.currentMode = await this.detectCurrentMode();
        
        console.log(`✅ Key Injector ready (mode: ${this.currentMode})`);
    }
    
    /**
     * Detect if we're in testing mode or production mode
     */
    async detectCurrentMode() {
        try {
            const envContent = await fs.readFile(this.envPath, 'utf-8');
            
            if (envContent.includes(this.config.testingFlag)) {
                return 'testing';
            }
            
            // Check if we have working keys (not placeholders)
            const hasWorkingKeys = this.hasWorkingKeys(envContent);
            
            if (hasWorkingKeys) {
                return 'production';
            }
            
            return 'empty';
            
        } catch (error) {
            return 'no_env';
        }
    }
    
    /**
     * Check if environment has working (non-placeholder) keys
     */
    hasWorkingKeys(envContent) {
        const keyLines = envContent.split('\n')
            .filter(line => line.includes('_API_KEY='))
            .filter(line => !line.startsWith('#'));
        
        let workingKeys = 0;
        
        for (const line of keyLines) {
            const value = line.split('=')[1];
            if (value && !this.isPlaceholder(value)) {
                workingKeys++;
            }
        }
        
        return workingKeys > 0;
    }
    
    /**
     * Check if a key value is a placeholder
     */
    isPlaceholder(value) {
        const placeholderPatterns = [
            'your_',
            '_here',
            'example',
            'placeholder',
            'sk-your',
            'key_your',
            'demo-key'
        ];
        
        return placeholderPatterns.some(pattern => value.includes(pattern));
    }
    
    /**
     * Extract working keys from .env.template
     */
    async extractWorkingKeys() {
        console.log('🔍 Extracting working keys from template...');
        
        try {
            const templateContent = await fs.readFile(this.templatePath, 'utf-8');
            const workingKeys = {};
            
            const lines = templateContent.split('\n');
            
            for (const line of lines) {
                if (line.includes('_API_KEY=') && !line.startsWith('#')) {
                    const [keyName, keyValue] = line.split('=');
                    
                    if (keyValue && !this.isPlaceholder(keyValue)) {
                        workingKeys[keyName] = keyValue;
                        console.log(`  ✅ Found working key: ${keyName}`);
                    }
                }
            }
            
            console.log(`🔑 Extracted ${Object.keys(workingKeys).length} working keys`);
            return workingKeys;
            
        } catch (error) {
            console.error(`❌ Failed to extract working keys: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Backup current .env file
     */
    async backupCurrentEnv() {
        if (!this.config.enableBackup) {
            console.log('⚠️  Backup disabled, skipping...');
            return null;
        }
        
        try {
            console.log('💾 Backing up current .env...');
            
            const envContent = await fs.readFile(this.envPath, 'utf-8');
            
            // Create timestamped backup
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const timestampedBackup = path.join(this.workingDir, `.env.backup-${timestamp}`);
            
            await fs.writeFile(this.backupPath, envContent);
            await fs.writeFile(timestampedBackup, envContent);
            
            console.log(`  💾 Backup saved: .env.backup`);
            console.log(`  💾 Timestamped: .env.backup-${timestamp}`);
            
            return {
                backupPath: this.backupPath,
                timestampedPath: timestampedBackup,
                timestamp
            };
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('  ℹ️  No existing .env to backup');
                return null;
            }
            throw error;
        }
    }
    
    /**
     * Inject working keys into .env for testing
     */
    async injectTestingKeys() {
        console.log('🚀 Injecting testing keys...');
        
        const injectionId = crypto.randomUUID();
        const startTime = Date.now();
        
        try {
            // Extract working keys from template
            const workingKeys = await this.extractWorkingKeys();
            
            if (Object.keys(workingKeys).length === 0) {
                throw new Error('No working keys found in .env.template');
            }
            
            // Backup current environment
            const backup = await this.backupCurrentEnv();
            
            // Read current .env or create new one
            let envContent = '';
            try {
                envContent = await fs.readFile(this.envPath, 'utf-8');
                console.log('📝 Updating existing .env file...');
            } catch (error) {
                console.log('📝 Creating new .env file...');
                // Start with basic template
                envContent = `# Generated by Testing Key Injector\n${this.config.testingFlag}\n\n`;
            }
            
            // Remove existing testing flag and add new one
            envContent = envContent.replace(new RegExp(`^${this.config.testingFlag}.*$`, 'gm'), '');
            envContent = `${this.config.testingFlag} - ${new Date().toISOString()}\n` + envContent;
            
            // Inject working keys
            let keysInjected = 0;
            
            for (const [keyName, keyValue] of Object.entries(workingKeys)) {
                const pattern = new RegExp(`^${keyName}=.*$`, 'm');
                
                if (pattern.test(envContent)) {
                    // Replace existing key
                    envContent = envContent.replace(pattern, `${keyName}=${keyValue}`);
                    console.log(`  🔄 Updated ${keyName}`);
                } else {
                    // Add new key
                    envContent += `${keyName}=${keyValue}\n`;
                    console.log(`  ➕ Added ${keyName}`);
                }
                
                keysInjected++;
            }
            
            // Write updated .env
            await fs.writeFile(this.envPath, envContent);
            
            // Record injection
            const injection = {
                injectionId,
                timestamp: new Date().toISOString(),
                keysInjected,
                duration: Date.now() - startTime,
                backup: backup,
                workingKeys: Object.keys(workingKeys),
                mode: 'testing'
            };
            
            this.injectionHistory.push(injection);
            this.currentMode = 'testing';
            
            console.log(`✅ Injection complete: ${keysInjected} keys injected`);
            console.log(`⛽ Gas tank mode activated for testing`);
            
            // Reload environment variables for current process
            delete require.cache[require.resolve('dotenv')];
            require('dotenv').config();
            
            return injection;
            
        } catch (error) {
            console.error(`❌ Key injection failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Restore original .env from backup
     */
    async restoreOriginalKeys() {
        console.log('♻️  Restoring original keys...');
        
        try {
            const backupContent = await fs.readFile(this.backupPath, 'utf-8');
            
            // Remove testing flag from backup if present
            const cleanedContent = backupContent.replace(new RegExp(`^${this.config.testingFlag}.*$`, 'gm'), '');
            
            await fs.writeFile(this.envPath, cleanedContent);
            
            this.currentMode = await this.detectCurrentMode();
            
            console.log('✅ Original keys restored');
            console.log(`🔧 Mode: ${this.currentMode}`);
            
            // Reload environment variables for current process
            delete require.cache[require.resolve('dotenv')];
            require('dotenv').config();
            
            return {
                restored: true,
                mode: this.currentMode,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ Restore failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Rotate to next set of keys (gas tank rotation)
     */
    async rotateToNextKeys() {
        console.log('🔄 Rotating to next set of keys...');
        
        // For now, this re-injects from template (in full system would rotate through key sets)
        return this.injectTestingKeys();
    }
    
    /**
     * Check injection status
     */
    async getInjectionStatus() {
        const status = {
            currentMode: this.currentMode,
            hasBackup: false,
            testingActive: false,
            workingKeysAvailable: false,
            injectionHistory: this.injectionHistory.slice(-5), // Last 5 injections
            lastInjection: this.injectionHistory[this.injectionHistory.length - 1] || null
        };
        
        // Check if backup exists
        try {
            await fs.access(this.backupPath);
            status.hasBackup = true;
        } catch (error) {
            status.hasBackup = false;
        }
        
        // Check if testing mode is active
        try {
            const envContent = await fs.readFile(this.envPath, 'utf-8');
            status.testingActive = envContent.includes(this.config.testingFlag);
        } catch (error) {
            status.testingActive = false;
        }
        
        // Check if working keys are available in template
        try {
            const workingKeys = await this.extractWorkingKeys();
            status.workingKeysAvailable = Object.keys(workingKeys).length > 0;
            status.availableKeys = Object.keys(workingKeys);
        } catch (error) {
            status.workingKeysAvailable = false;
            status.availableKeys = [];
        }
        
        return status;
    }
    
    /**
     * Enable testing mode with one command
     */
    async enableTestingMode() {
        console.log('🎮 Enabling testing mode...');
        
        const status = await this.getInjectionStatus();
        
        if (status.testingActive) {
            console.log('ℹ️  Testing mode already active');
            return status;
        }
        
        if (!status.workingKeysAvailable) {
            throw new Error('No working keys available in .env.template for testing');
        }
        
        // Inject testing keys
        const injection = await this.injectTestingKeys();
        
        console.log('✅ Testing mode enabled');
        console.log('🎮 Vibecheck system ready for demo with working keys');
        console.log('⛽ Gas tank active - automatic fallback to hidden keys');
        
        return {
            enabled: true,
            injection,
            status: await this.getInjectionStatus()
        };
    }
    
    /**
     * Disable testing mode and restore production
     */
    async disableTestingMode() {
        console.log('🔧 Disabling testing mode...');
        
        const status = await this.getInjectionStatus();
        
        if (!status.testingActive) {
            console.log('ℹ️  Testing mode not active');
            return status;
        }
        
        if (!status.hasBackup) {
            console.warn('⚠️  No backup available, will remove testing flag only');
            
            // Just remove testing flag
            try {
                const envContent = await fs.readFile(this.envPath, 'utf-8');
                const cleanedContent = envContent.replace(new RegExp(`^${this.config.testingFlag}.*$`, 'gm'), '');
                await fs.writeFile(this.envPath, cleanedContent);
                
                this.currentMode = await this.detectCurrentMode();
                
                console.log('✅ Testing flag removed');
                return { disabled: true, mode: this.currentMode };
            } catch (error) {
                throw new Error(`Failed to remove testing flag: ${error.message}`);
            }
        }
        
        // Restore from backup
        const restore = await this.restoreOriginalKeys();
        
        console.log('✅ Testing mode disabled');
        console.log('🔧 Production keys restored');
        
        return {
            disabled: true,
            restore,
            status: await this.getInjectionStatus()
        };
    }
    
    /**
     * Generate injection report
     */
    generateInjectionReport() {
        const status = this.getInjectionStatus();
        
        const report = `# 🚀 Testing Key Injection Report

## Current Status
- **Mode**: ${status.currentMode}
- **Testing Active**: ${status.testingActive ? 'YES' : 'NO'}
- **Backup Available**: ${status.hasBackup ? 'YES' : 'NO'}
- **Working Keys Available**: ${status.workingKeysAvailable ? 'YES' : 'NO'}

## Available Keys
${status.availableKeys.map(key => `- ${key}`).join('\n')}

## Recent Injections
${status.injectionHistory.map(injection => 
    `- **${injection.timestamp}**: ${injection.keysInjected} keys (${injection.duration}ms)`
).join('\n')}

## Commands
- Enable testing: \`node inject-testing-keys.js enable\`
- Disable testing: \`node inject-testing-keys.js disable\`
- Check status: \`node inject-testing-keys.js status\`
- Rotate keys: \`node inject-testing-keys.js rotate\`

---
*Gas tank key injection system - automatic fallback for testing*
        `;
        
        return report;
    }
    
    /**
     * Emergency cleanup - remove all testing artifacts
     */
    async emergencyCleanup() {
        console.log('🚨 Emergency cleanup - removing all testing artifacts...');
        
        try {
            // Remove testing flag from .env
            if (await this.fileExists(this.envPath)) {
                const envContent = await fs.readFile(this.envPath, 'utf-8');
                const cleanedContent = envContent.replace(new RegExp(`^${this.config.testingFlag}.*$`, 'gm'), '');
                await fs.writeFile(this.envPath, cleanedContent);
                console.log('  🧹 Removed testing flag from .env');
            }
            
            // Remove gas tank stats
            const statsPath = path.join(this.workingDir, '.gas-tank-stats.json');
            if (await this.fileExists(statsPath)) {
                await fs.unlink(statsPath);
                console.log('  🧹 Removed gas tank stats');
            }
            
            // List backup files
            const files = await fs.readdir(this.workingDir);
            const backupFiles = files.filter(f => f.startsWith('.env.backup'));
            
            console.log(`  ℹ️  Found ${backupFiles.length} backup files (not removed)`);
            
            console.log('✅ Emergency cleanup complete');
            
            return {
                cleaned: true,
                backupFilesFound: backupFiles.length,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ Emergency cleanup failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Utility: Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = TestingKeyInjector;

// CLI interface
if (require.main === module) {
    const injector = new TestingKeyInjector();
    
    const command = process.argv[2];
    
    setTimeout(async () => {
        try {
            switch (command) {
                case 'enable':
                    console.log('🎮 Enabling testing mode...');
                    const enableResult = await injector.enableTestingMode();
                    console.log('✅ Testing mode enabled!');
                    console.log(JSON.stringify(enableResult, null, 2));
                    break;
                
                case 'disable':
                    console.log('🔧 Disabling testing mode...');
                    const disableResult = await injector.disableTestingMode();
                    console.log('✅ Testing mode disabled!');
                    console.log(JSON.stringify(disableResult, null, 2));
                    break;
                
                case 'status':
                    console.log('📊 Checking injection status...');
                    const status = await injector.getInjectionStatus();
                    console.log(JSON.stringify(status, null, 2));
                    break;
                
                case 'rotate':
                    console.log('🔄 Rotating keys...');
                    const rotateResult = await injector.rotateToNextKeys();
                    console.log('✅ Keys rotated!');
                    console.log(JSON.stringify(rotateResult, null, 2));
                    break;
                
                case 'cleanup':
                    console.log('🚨 Emergency cleanup...');
                    const cleanupResult = await injector.emergencyCleanup();
                    console.log('✅ Cleanup complete!');
                    console.log(JSON.stringify(cleanupResult, null, 2));
                    break;
                
                case 'report':
                    console.log('📋 Generating injection report...');
                    const report = injector.generateInjectionReport();
                    console.log(report);
                    break;
                
                default:
                    console.log('🚀 Testing Key Injector');
                    console.log('');
                    console.log('Commands:');
                    console.log('  enable   - Enable testing mode with working keys');
                    console.log('  disable  - Disable testing mode and restore original');
                    console.log('  status   - Check current injection status');
                    console.log('  rotate   - Rotate to next set of keys');
                    console.log('  cleanup  - Emergency cleanup of testing artifacts');
                    console.log('  report   - Generate detailed injection report');
                    console.log('');
                    console.log('Examples:');
                    console.log('  node inject-testing-keys.js enable   # Start testing with hidden keys');
                    console.log('  node inject-testing-keys.js disable  # Restore production keys');
                    console.log('  node inject-testing-keys.js status   # Check what mode we\'re in');
                    console.log('');
                    console.log('⛽ Gas tank system: User keys → Hidden vault keys → Demo keys');
                    console.log('🎮 Perfect for testing vibecheck system without user API keys');
                    
                    // Show current status
                    const currentStatus = await injector.getInjectionStatus();
                    console.log('\n📊 Current Status:');
                    console.log(`Mode: ${currentStatus.currentMode}`);
                    console.log(`Testing Active: ${currentStatus.testingActive ? 'YES' : 'NO'}`);
                    console.log(`Working Keys Available: ${currentStatus.workingKeysAvailable ? 'YES' : 'NO'}`);
                    console.log(`Available Keys: ${currentStatus.availableKeys.join(', ')}`);
            }
            
        } catch (error) {
            console.error('❌ Command failed:', error.message);
            process.exit(1);
        }
    }, 500);
}