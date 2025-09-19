#!/usr/bin/env node

/**
 * 🔐 VAULT KEY LOADER SERVICE
 * Decrypts and loads API keys from the encrypted vault system
 * Integrates with existing DomainSpecificAPIKeyManager and UnifiedDecryptionLayer
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class VaultKeyLoader {
    constructor(config = {}) {
        this.config = {
            vaultDir: config.vaultDir || './.vault/api-keys',
            masterKeyFile: config.masterKeyFile || './.vault/api-keys/.master.key',
            cacheTimeout: config.cacheTimeout || 300000, // 5 minutes
            enableCache: config.enableCache !== false,
            ...config
        };
        
        // In-memory cache for decrypted keys
        this.keyCache = new Map();
        this.cacheTimestamps = new Map();
        
        console.log('🔐 Vault Key Loader initialized');
        console.log(`📁 Vault directory: ${this.config.vaultDir}`);
    }
    
    /**
     * Load master key for decryption (matches DomainSpecificAPIKeyManager format)
     */
    async loadMasterKey() {
        try {
            const masterKeyData = await fs.readFile(this.config.masterKeyFile, 'utf8');
            return masterKeyData.trim(); // Return as hex string, not buffer
        } catch (error) {
            console.error('❌ Failed to load master key:', error.message);
            throw new Error('Master key not accessible');
        }
    }
    
    /**
     * Get all available API keys for a provider
     */
    async getAPIKeys(provider) {
        console.log(`🔍 Loading keys for provider: ${provider}`);
        
        // Check cache first
        if (this.config.enableCache && this.isKeyCached(provider)) {
            console.log(`💾 Using cached keys for ${provider}`);
            return this.keyCache.get(provider);
        }
        
        const providerDir = path.join(this.config.vaultDir, provider);
        
        try {
            // Check if provider directory exists
            await fs.access(providerDir);
        } catch (error) {
            console.warn(`⚠️ Provider directory not found: ${provider}`);
            return null;
        }
        
        try {
            // Read provider configuration
            const configPath = path.join(providerDir, 'config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(configData);
            
            if (config.status !== 'active') {
                console.warn(`⚠️ Provider ${provider} is not active`);
                return null;
            }
            
            // Get all key files
            const files = await fs.readdir(providerDir);
            const keyFiles = files.filter(f => f.startsWith('key_') && f.endsWith('.json'));
            
            if (keyFiles.length === 0) {
                console.warn(`⚠️ No key files found for ${provider}`);
                return null;
            }
            
            // Load and decrypt keys
            const keys = [];
            const masterKey = await this.loadMasterKey();
            
            for (const keyFile of keyFiles) {
                try {
                    const keyPath = path.join(providerDir, keyFile);
                    const encryptedData = await fs.readFile(keyPath, 'utf8');
                    const keyData = JSON.parse(encryptedData);
                    
                    // Decrypt the key
                    const decryptedKey = await this.decryptKey(keyData, masterKey);
                    
                    if (decryptedKey) {
                        keys.push({
                            id: keyFile.replace('key_', '').replace('.json', ''),
                            key: decryptedKey,
                            metadata: keyData.metadata || {}
                        });
                    }
                } catch (error) {
                    console.error(`❌ Failed to decrypt key ${keyFile}:`, error.message);
                }
            }
            
            if (keys.length === 0) {
                console.warn(`⚠️ No valid keys found for ${provider}`);
                return null;
            }
            
            // Cache the result
            if (this.config.enableCache) {
                this.keyCache.set(provider, keys);
                this.cacheTimestamps.set(provider, Date.now());
            }
            
            console.log(`✅ Loaded ${keys.length} keys for ${provider}`);
            return keys;
            
        } catch (error) {
            console.error(`❌ Failed to load keys for ${provider}:`, error.message);
            return null;
        }
    }
    
    /**
     * Get the first/primary API key for a provider
     */
    async getPrimaryAPIKey(provider) {
        const keys = await this.getAPIKeys(provider);
        return keys && keys.length > 0 ? keys[0].key : null;
    }
    
    /**
     * Decrypt an encrypted key using AES-256-GCM (matches DomainSpecificAPIKeyManager)
     */
    async decryptKey(encryptedKeyData, masterKey) {
        try {
            const { encrypted, salt, iv, authTag, algorithm } = encryptedKeyData;
            
            if (algorithm !== 'aes-256-gcm') {
                throw new Error(`Unsupported algorithm: ${algorithm}`);
            }
            
            // Derive key from master key and salt (match DomainSpecificAPIKeyManager)
            const derivedKey = crypto.pbkdf2Sync(masterKey, Buffer.from(salt, 'hex'), 100000, 32, 'sha256');
            
            // Create decipher
            const decipher = crypto.createDecipheriv(algorithm, derivedKey, Buffer.from(iv, 'hex'));
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            // Decrypt
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            // Parse the JSON data (the decrypted content is JSON with the API key)
            const keyData = JSON.parse(decrypted);
            return keyData.keyValue || keyData.key || keyData.apiKey || decrypted;
            
        } catch (error) {
            console.error('❌ Decryption failed:', error.message);
            return null;
        }
    }
    
    /**
     * Check if keys are cached and still valid
     */
    isKeyCached(provider) {
        if (!this.keyCache.has(provider)) return false;
        
        const timestamp = this.cacheTimestamps.get(provider);
        return (Date.now() - timestamp) < this.config.cacheTimeout;
    }
    
    /**
     * Clear cache for a specific provider or all providers
     */
    clearCache(provider = null) {
        if (provider) {
            this.keyCache.delete(provider);
            this.cacheTimestamps.delete(provider);
            console.log(`🗑️ Cleared cache for ${provider}`);
        } else {
            this.keyCache.clear();
            this.cacheTimestamps.clear();
            console.log('🗑️ Cleared all key cache');
        }
    }
    
    /**
     * Get all available providers
     */
    async getAvailableProviders() {
        try {
            const entries = await fs.readdir(this.config.vaultDir, { withFileTypes: true });
            const providers = [];
            
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    const configPath = path.join(this.config.vaultDir, entry.name, 'config.json');
                    try {
                        const configData = await fs.readFile(configPath, 'utf8');
                        const config = JSON.parse(configData);
                        
                        if (config.status === 'active' && config.keyCount > 0) {
                            providers.push({
                                name: entry.name,
                                keyCount: config.keyCount,
                                lastActivity: config.lastActivity
                            });
                        }
                    } catch (error) {
                        console.warn(`⚠️ Could not read config for ${entry.name}`);
                    }
                }
            }
            
            return providers;
        } catch (error) {
            console.error('❌ Failed to get available providers:', error.message);
            return [];
        }
    }
    
    /**
     * Test connectivity to a provider's API
     */
    async testProviderConnection(provider, apiKey) {
        console.log(`🔍 Testing connection to ${provider}...`);
        
        try {
            switch (provider) {
                case 'openai':
                    const openaiResponse = await fetch('https://api.openai.com/v1/models', {
                        headers: { 'Authorization': `Bearer ${apiKey}` }
                    });
                    return openaiResponse.ok;
                    
                case 'anthropic':
                    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'x-api-key': apiKey,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: 'claude-3-haiku-20240307',
                            messages: [{ role: 'user', content: 'test' }],
                            max_tokens: 1
                        })
                    });
                    return anthropicResponse.ok;
                    
                case 'deepseek':
                    const deepseekResponse = await fetch('https://api.deepseek.com/v1/models', {
                        headers: { 'Authorization': `Bearer ${apiKey}` }
                    });
                    return deepseekResponse.ok;
                    
                default:
                    console.warn(`⚠️ Unknown provider: ${provider}`);
                    return false;
            }
        } catch (error) {
            console.error(`❌ Connection test failed for ${provider}:`, error.message);
            return false;
        }
    }
    
    /**
     * Get status of all providers
     */
    async getProvidersStatus() {
        const providers = await this.getAvailableProviders();
        const status = {};
        
        for (const provider of providers) {
            const primaryKey = await this.getPrimaryAPIKey(provider.name);
            
            status[provider.name] = {
                available: !!primaryKey,
                keyCount: provider.keyCount,
                lastActivity: provider.lastActivity,
                connected: primaryKey ? await this.testProviderConnection(provider.name, primaryKey) : false
            };
        }
        
        return status;
    }
}

module.exports = VaultKeyLoader;

// CLI test interface
if (require.main === module) {
    const vaultLoader = new VaultKeyLoader();
    
    async function testVault() {
        console.log('🔐 VAULT KEY LOADER TEST');
        console.log('═'.repeat(50));
        
        // Test getting available providers
        const providers = await vaultLoader.getAvailableProviders();
        console.log('\n📋 Available Providers:');
        providers.forEach(p => {
            console.log(`  - ${p.name}: ${p.keyCount} keys, last active: ${p.lastActivity}`);
        });
        
        // Test loading keys for each provider
        for (const provider of providers) {
            const keys = await vaultLoader.getAPIKeys(provider.name);
            if (keys) {
                console.log(`\n🔑 ${provider.name} keys loaded: ${keys.length}`);
                
                // Test primary key
                const primaryKey = await vaultLoader.getPrimaryAPIKey(provider.name);
                console.log(`🎯 Primary key: ${primaryKey ? primaryKey.slice(0, 10) + '...' : 'None'}`);
            }
        }
        
        // Get overall status
        const status = await vaultLoader.getProvidersStatus();
        console.log('\n📊 Provider Status:');
        Object.entries(status).forEach(([name, info]) => {
            const statusIcon = info.connected ? '✅' : info.available ? '🔑' : '❌';
            console.log(`  ${statusIcon} ${name}: ${info.available ? 'Keys Available' : 'No Keys'} ${info.connected ? '(Connected)' : '(Not Connected)'}`);
        });
    }
    
    testVault().catch(console.error);
}