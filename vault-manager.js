#!/usr/bin/env node

/**
 * Vault Manager - Secure encryption/decryption for sensitive data
 * "Hiding vaults in plain sight" - encrypt sensitive data while keeping structure visible
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class VaultManager {
    constructor(options = {}) {
        // Use environment variables or options
        this.masterKey = process.env.VAULT_MASTER_KEY || options.masterKey;
        this.salt = process.env.VAULT_SALT || options.salt;
        this.iterations = parseInt(process.env.VAULT_ITERATIONS || options.iterations || 100000);
        this.algorithm = 'aes-256-gcm';
        this.vaultPath = path.join(__dirname, '.vault');
        
        // Validate setup
        if (!this.masterKey || !this.salt) {
            this.needsSetup = true;
        }
    }
    
    /**
     * Initialize vault with new master key
     */
    async initialize() {
        console.log('🔐 Initializing Document Generator Vault...');
        
        // Generate secure master key and salt
        const masterKey = crypto.randomBytes(32).toString('hex');
        const salt = crypto.randomBytes(16).toString('hex');
        
        // Create vault directory
        await fs.mkdir(this.vaultPath, { recursive: true });
        await fs.mkdir(path.join(this.vaultPath, 'keys'), { recursive: true });
        
        // Save vault config (encrypted)
        const config = {
            version: '1.0.0',
            created: new Date().toISOString(),
            algorithm: this.algorithm,
            iterations: this.iterations
        };
        
        await fs.writeFile(
            path.join(this.vaultPath, '.config'),
            JSON.stringify(config, null, 2)
        );
        
        console.log('\n✅ Vault initialized successfully!');
        console.log('\n🔑 IMPORTANT: Save these values in your .env file:');
        console.log(`VAULT_MASTER_KEY=${masterKey}`);
        console.log(`VAULT_SALT=${salt}`);
        console.log(`VAULT_ITERATIONS=${this.iterations}`);
        console.log('\n⚠️  Keep these values secure and never commit them to git!\n');
        
        return { masterKey, salt, iterations: this.iterations };
    }
    
    /**
     * Derive encryption key from master key
     */
    deriveKey(purpose = 'encryption') {
        if (!this.masterKey || !this.salt) {
            throw new Error('Vault not initialized. Run "node vault-manager.js init" first.');
        }
        
        const salt = Buffer.concat([
            Buffer.from(this.salt, 'hex'),
            Buffer.from(purpose)
        ]);
        
        return crypto.pbkdf2Sync(
            this.masterKey,
            salt,
            this.iterations,
            32,
            'sha256'
        );
    }
    
    /**
     * Encrypt data
     */
    encrypt(data, purpose = 'general') {
        const key = this.deriveKey(purpose);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(data), 'utf8'),
            cipher.final()
        ]);
        
        const tag = cipher.getAuthTag();
        
        // Combine iv + tag + encrypted data
        const combined = Buffer.concat([iv, tag, encrypted]);
        
        return {
            encrypted: combined.toString('base64'),
            purpose,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Decrypt data
     */
    decrypt(encryptedData, purpose = 'general') {
        const key = this.deriveKey(purpose);
        
        // Parse encrypted data
        const combined = Buffer.from(encryptedData.encrypted || encryptedData, 'base64');
        
        // Extract components
        const iv = combined.slice(0, 16);
        const tag = combined.slice(16, 32);
        const encrypted = combined.slice(32);
        
        // Create decipher
        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
        decipher.setAuthTag(tag);
        
        try {
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final()
            ]);
            
            return JSON.parse(decrypted.toString('utf8'));
        } catch (error) {
            throw new Error('Failed to decrypt data. Invalid key or corrupted data.');
        }
    }
    
    /**
     * Store encrypted key
     */
    async storeKey(name, value, metadata = {}) {
        const encrypted = this.encrypt(value, `key:${name}`);
        
        const keyData = {
            name,
            ...encrypted,
            metadata,
            version: 1
        };
        
        const filename = `${name}_${Date.now()}.enc`;
        await fs.writeFile(
            path.join(this.vaultPath, 'keys', filename),
            JSON.stringify(keyData, null, 2)
        );
        
        console.log(`✅ Key '${name}' stored securely`);
        return filename;
    }
    
    /**
     * Retrieve decrypted key
     */
    async getKey(name) {
        const keysDir = path.join(this.vaultPath, 'keys');
        const files = await fs.readdir(keysDir);
        
        // Find latest version of key
        const keyFiles = files
            .filter(f => f.startsWith(`${name}_`) && f.endsWith('.enc'))
            .sort()
            .reverse();
        
        if (keyFiles.length === 0) {
            throw new Error(`Key '${name}' not found`);
        }
        
        const keyData = JSON.parse(
            await fs.readFile(path.join(keysDir, keyFiles[0]), 'utf8')
        );
        
        return this.decrypt(keyData, `key:${name}`);
    }
    
    /**
     * List all stored keys
     */
    async listKeys() {
        const keysDir = path.join(this.vaultPath, 'keys');
        
        try {
            const files = await fs.readdir(keysDir);
            const keys = new Map();
            
            for (const file of files) {
                if (file.endsWith('.enc')) {
                    const match = file.match(/^(.+?)_(\d+)\.enc$/);
                    if (match) {
                        const [, name, timestamp] = match;
                        if (!keys.has(name) || keys.get(name).timestamp < timestamp) {
                            const keyData = JSON.parse(
                                await fs.readFile(path.join(keysDir, file), 'utf8')
                            );
                            keys.set(name, {
                                name,
                                timestamp: new Date(parseInt(timestamp)),
                                metadata: keyData.metadata
                            });
                        }
                    }
                }
            }
            
            return Array.from(keys.values());
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Encrypt environment file
     */
    async encryptEnvFile(envPath = '.env', outputPath = '.env.vault') {
        console.log(`🔐 Encrypting ${envPath}...`);
        
        const envContent = await fs.readFile(envPath, 'utf8');
        const lines = envContent.split('\n');
        
        const encrypted = {};
        const publicConfig = {};
        
        for (const line of lines) {
            if (line.trim() && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=');
                
                // Determine if this should be encrypted
                if (this.shouldEncrypt(key)) {
                    encrypted[key] = this.encrypt(value, `env:${key}`).encrypted;
                } else {
                    publicConfig[key] = value;
                }
            }
        }
        
        const vaultData = {
            version: '1.0.0',
            created: new Date().toISOString(),
            encrypted,
            public: publicConfig
        };
        
        await fs.writeFile(outputPath, JSON.stringify(vaultData, null, 2));
        console.log(`✅ Environment encrypted to ${outputPath}`);
        
        return vaultData;
    }
    
    /**
     * Decrypt environment file
     */
    async decryptEnvFile(vaultPath = '.env.vault') {
        console.log(`🔓 Decrypting ${vaultPath}...`);
        
        const vaultData = JSON.parse(await fs.readFile(vaultPath, 'utf8'));
        const decrypted = {};
        
        // Copy public config
        Object.assign(decrypted, vaultData.public);
        
        // Decrypt encrypted values
        for (const [key, encryptedValue] of Object.entries(vaultData.encrypted)) {
            try {
                decrypted[key] = this.decrypt(encryptedValue, `env:${key}`);
            } catch (error) {
                console.error(`❌ Failed to decrypt ${key}: ${error.message}`);
            }
        }
        
        return decrypted;
    }
    
    /**
     * Determine if a key should be encrypted
     */
    shouldEncrypt(key) {
        const sensitivePatterns = [
            /_KEY$/,
            /_SECRET$/,
            /_PASSWORD$/,
            /_TOKEN$/,
            /^JWT_/,
            /^ENCRYPTION_/,
            /^VAULT_/,
            /_API_KEY$/,
            /_WEBHOOK_/,
            /_PRIVATE_/
        ];
        
        return sensitivePatterns.some(pattern => pattern.test(key));
    }
    
    /**
     * Generate secure random key
     */
    generateKey(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    
    /**
     * CLI Interface
     */
    async cli(args) {
        const command = args[0];
        
        switch (command) {
            case 'init':
                await this.initialize();
                break;
                
            case 'encrypt':
                if (args[1]) {
                    const result = this.encrypt(args[1]);
                    console.log('🔐 Encrypted:', result.encrypted);
                } else {
                    console.error('Usage: vault-manager encrypt <data>');
                }
                break;
                
            case 'decrypt':
                if (args[1]) {
                    const result = this.decrypt(args[1]);
                    console.log('🔓 Decrypted:', result);
                } else {
                    console.error('Usage: vault-manager decrypt <encrypted-data>');
                }
                break;
                
            case 'store-key':
                if (args[1] && args[2]) {
                    await this.storeKey(args[1], args[2]);
                } else {
                    console.error('Usage: vault-manager store-key <name> <value>');
                }
                break;
                
            case 'get-key':
                if (args[1]) {
                    const value = await this.getKey(args[1]);
                    console.log('🔑 Key value:', value);
                } else {
                    console.error('Usage: vault-manager get-key <name>');
                }
                break;
                
            case 'list-keys':
                const keys = await this.listKeys();
                console.log('\n🗝️  Stored Keys:');
                for (const key of keys) {
                    console.log(`  - ${key.name} (${key.timestamp.toISOString()})`);
                    if (key.metadata && Object.keys(key.metadata).length > 0) {
                        console.log(`    Metadata:`, key.metadata);
                    }
                }
                break;
                
            case 'encrypt-env':
                await this.encryptEnvFile(args[1], args[2]);
                break;
                
            case 'decrypt-env':
                const env = await this.decryptEnvFile(args[1]);
                if (args[2] === '--stdout') {
                    for (const [key, value] of Object.entries(env)) {
                        console.log(`${key}=${value}`);
                    }
                }
                break;
                
            case 'generate-key':
                const length = parseInt(args[1]) || 32;
                const key = this.generateKey(length);
                console.log(`🔑 Generated ${length}-byte key:`, key);
                break;
                
            default:
                console.log(`
Document Generator Vault Manager

Usage:
  node vault-manager.js <command> [options]

Commands:
  init                    Initialize new vault with master key
  encrypt <data>          Encrypt data
  decrypt <data>          Decrypt data
  store-key <name> <val>  Store encrypted key
  get-key <name>          Retrieve decrypted key
  list-keys               List all stored keys
  encrypt-env [path]      Encrypt .env file
  decrypt-env [path]      Decrypt .env.vault file
  generate-key [length]   Generate secure random key

Examples:
  node vault-manager.js init
  node vault-manager.js store-key openai_api_key "sk-..."
  node vault-manager.js encrypt-env
  node vault-manager.js generate-key 64
`);
        }
    }
}

// Export for use in other modules
module.exports = VaultManager;

// CLI execution
if (require.main === module) {
    const vault = new VaultManager();
    vault.cli(process.argv.slice(2)).catch(console.error);
}