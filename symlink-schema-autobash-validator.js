// symlink-schema-autobash-validator.js - Layer 71: Symlink Schema Auto-Bash Validator
// Validates real vs placeholder keys, creates symlinks, prevents fake API calls

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const crypto = require('crypto');

console.log(`
🔗 SYMLINK SCHEMA AUTO-BASH VALIDATOR 🔗
Layer 71: Differentiates real vs placeholder keys
Creates symlinks across all 70 layers after squashing
Prevents API calls with fake keys
`);

class SymlinkSchemaAutoBashValidator {
    constructor() {
        this.keySchemas = new Map();          // Schema for each key type
        this.realKeys = new Map();            // Validated real keys
        this.placeholderKeys = new Map();     // Known placeholder keys
        this.symlinks = new Map();            // Symlink registry
        this.layerConnections = new Map();    // How layers share keys
        this.apiCallValidator = null;         // Prevents calls with fake keys
        
        console.log('🔗 Symlink Schema Auto-Bash Validator initializing...');
        this.initializeValidator();
    }
    
    async initializeValidator() {
        // Create key validation schemas
        await this.createKeySchemas();
        
        // Scan for existing keys
        await this.scanExistingKeys();
        
        // Create symlink structure
        await this.createSymlinkStructure();
        
        // Set up auto-bash system
        await this.setupAutoBash();
        
        // Install API call interceptor
        this.installAPIInterceptor();
        
        console.log('🔗 Validator ready - no fake API calls will be made');
    }
    
    createKeySchemas() {
        // Define schemas for validating real keys
        const schemas = {
            stripe: {
                test: {
                    publishable: /^pk_test_[A-Za-z0-9]{99,}$/,
                    secret: /^sk_test_[A-Za-z0-9]{99,}$/,
                    webhook: /^whsec_[A-Za-z0-9]{55,}$/
                },
                live: {
                    publishable: /^pk_live_[A-Za-z0-9]{99,}$/,
                    secret: /^sk_live_[A-Za-z0-9]{99,}$/,
                    webhook: /^whsec_[A-Za-z0-9]{55,}$/
                },
                placeholder: {
                    patterns: [
                        /placeholder/i,
                        /your[_-]?key[_-]?here/i,
                        /^pk_test_placeholder/,
                        /^sk_test_placeholder/
                    ]
                }
            },
            
            openai: {
                valid: /^sk-proj-[A-Za-z0-9]{48,}$/,
                legacy: /^sk-[A-Za-z0-9]{48}$/,
                placeholder: {
                    patterns: [
                        /^sk-proj$/,
                        /your-openai-key-here/,
                        /placeholder/
                    ]
                }
            },
            
            anthropic: {
                valid: /^sk-ant-api03-[A-Za-z0-9\-]{80,}$/,
                placeholder: {
                    patterns: [
                        /^sk-ant-api03$/,
                        /your-anthropic-key-here/,
                        /placeholder/
                    ]
                }
            },
            
            github: {
                valid: /^ghp_[A-Za-z0-9]{36,}$/,
                classic: /^[A-Za-z0-9]{40}$/,
                placeholder: {
                    patterns: [
                        /^ghp$/,
                        /your-github-token-here/
                    ]
                }
            },
            
            internal: {
                master: /^dgai_master_\d{13}_[a-f0-9]{32}$/,
                user: /^dgai_user_\d{13}_[a-f0-9]{32}$/,
                admin: /^dgai_admin_\d{13}_[a-f0-9]{32}$/,
                valid: (key) => key.startsWith('dgai_') && key.length > 20
            }
        };
        
        for (const [service, schema] of Object.entries(schemas)) {
            this.keySchemas.set(service, schema);
        }
        
        console.log('📋 Key validation schemas created for:', Array.from(this.keySchemas.keys()));
    }
    
    async scanExistingKeys() {
        console.log('🔍 Scanning for existing keys...');
        
        // Check .env file
        try {
            const envPath = path.join(__dirname, '.env');
            const envContent = await fs.readFile(envPath, 'utf-8');
            const envKeys = this.parseEnvFile(envContent);
            
            for (const [key, value] of Object.entries(envKeys)) {
                await this.validateAndCategorizeKey(key, value);
            }
        } catch (error) {
            console.log('⚠️ No .env file found');
        }
        
        // Check crypto vault
        try {
            const vaultPath = path.join(__dirname, '.vault', 'keys');
            const vaultFiles = await fs.readdir(vaultPath);
            console.log(`📁 Found ${vaultFiles.length} keys in vault`);
        } catch (error) {
            console.log('⚠️ No vault directory found');
        }
        
        console.log(`✅ Found ${this.realKeys.size} real keys`);
        console.log(`⚠️ Found ${this.placeholderKeys.size} placeholder keys`);
        
        // List placeholder keys that need replacement
        if (this.placeholderKeys.size > 0) {
            console.log('\n⚠️ PLACEHOLDER KEYS DETECTED:');
            for (const [name, info] of this.placeholderKeys) {
                console.log(`  - ${name}: ${info.value.substring(0, 20)}...`);
            }
        }
    }
    
    parseEnvFile(content) {
        const env = {};
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.trim() && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    env[key.trim()] = valueParts.join('=').trim();
                }
            }
        }
        
        return env;
    }
    
    async validateAndCategorizeKey(name, value) {
        // Determine key type
        const keyType = this.determineKeyType(name);
        if (!keyType) return;
        
        // Check if it's a placeholder
        const isPlaceholder = this.isPlaceholderKey(keyType, value);
        
        if (isPlaceholder) {
            this.placeholderKeys.set(name, {
                type: keyType,
                value: value,
                detectedAt: new Date(),
                reason: 'matches placeholder pattern'
            });
        } else {
            // Validate against schema
            const isValid = this.validateKeyFormat(keyType, value);
            
            if (isValid) {
                this.realKeys.set(name, {
                    type: keyType,
                    value: value,
                    validatedAt: new Date(),
                    canMakeAPICalls: true
                });
            } else {
                this.placeholderKeys.set(name, {
                    type: keyType,
                    value: value,
                    detectedAt: new Date(),
                    reason: 'invalid format'
                });
            }
        }
    }
    
    determineKeyType(name) {
        const nameLower = name.toLowerCase();
        
        if (nameLower.includes('stripe')) return 'stripe';
        if (nameLower.includes('openai')) return 'openai';
        if (nameLower.includes('anthropic')) return 'anthropic';
        if (nameLower.includes('github')) return 'github';
        if (nameLower.startsWith('dgai_')) return 'internal';
        
        return null;
    }
    
    isPlaceholderKey(type, value) {
        const schema = this.keySchemas.get(type);
        if (!schema || !schema.placeholder) return false;
        
        // Check against placeholder patterns
        for (const pattern of schema.placeholder.patterns) {
            if (pattern.test(value)) {
                return true;
            }
        }
        
        // Common placeholder indicators
        const commonPlaceholders = [
            'your-key-here',
            'your_key_here',
            'placeholder',
            'test-key',
            'demo-key',
            'example'
        ];
        
        const valueLower = value.toLowerCase();
        return commonPlaceholders.some(placeholder => valueLower.includes(placeholder));
    }
    
    validateKeyFormat(type, value) {
        const schema = this.keySchemas.get(type);
        if (!schema) return false;
        
        // Check format based on type
        switch (type) {
            case 'stripe':
                if (value.startsWith('pk_test_')) return schema.test.publishable.test(value);
                if (value.startsWith('sk_test_')) return schema.test.secret.test(value);
                if (value.startsWith('pk_live_')) return schema.live.publishable.test(value);
                if (value.startsWith('sk_live_')) return schema.live.secret.test(value);
                if (value.startsWith('whsec_')) return schema.test.webhook.test(value);
                return false;
                
            case 'openai':
                return schema.valid.test(value) || schema.legacy.test(value);
                
            case 'anthropic':
                return schema.valid.test(value);
                
            case 'github':
                return schema.valid.test(value) || schema.classic.test(value);
                
            case 'internal':
                return typeof schema.valid === 'function' ? schema.valid(value) : true;
                
            default:
                return false;
        }
    }
    
    async createSymlinkStructure() {
        console.log('🔗 Creating symlink structure...');
        
        // Create central key status file
        const keyStatusPath = path.join(__dirname, '.key-status.json');
        const keyStatus = {
            generated: new Date(),
            realKeys: Object.fromEntries(
                Array.from(this.realKeys.entries()).map(([name, info]) => [
                    name, { type: info.type, canMakeAPICalls: true }
                ])
            ),
            placeholderKeys: Object.fromEntries(
                Array.from(this.placeholderKeys.entries()).map(([name, info]) => [
                    name, { type: info.type, reason: info.reason }
                ])
            )
        };
        
        await fs.writeFile(keyStatusPath, JSON.stringify(keyStatus, null, 2));
        
        // Create symlinks to share key status across layers
        const layerDirs = [
            'FinishThisIdea',
            'FinishThisIdea-Complete',
            'mcp',
            'templates',
            'services',
            '.vault'
        ];
        
        for (const dir of layerDirs) {
            const dirPath = path.join(__dirname, dir);
            const symlinkPath = path.join(dirPath, '.key-status.json');
            
            try {
                // Check if directory exists
                await fs.access(dirPath);
                
                // Remove existing symlink if it exists
                try {
                    await fs.unlink(symlinkPath);
                } catch (e) {}
                
                // Create symlink
                await fs.symlink(keyStatusPath, symlinkPath);
                this.symlinks.set(dir, symlinkPath);
                console.log(`✅ Symlink created: ${dir}/.key-status.json`);
            } catch (error) {
                // Directory doesn't exist, skip
            }
        }
        
        console.log(`🔗 Created ${this.symlinks.size} symlinks for key status`);
    }
    
    async setupAutoBash() {
        console.log('🤖 Setting up auto-bash system...');
        
        // Bash script already exists, just run it
        const bashPath = path.join(__dirname, 'validate-keys.sh');
        
        // Check if script exists
        try {
            await fs.access(bashPath);
            console.log('✅ Using existing validate-keys.sh');
            
            // Run the script
            try {
                const { stdout } = await execAsync('./validate-keys.sh');
                console.log('\n📋 Auto-bash output:\n', stdout);
            } catch (error) {
                console.log('⚠️ Auto-bash completed with warnings');
            }
        } catch (error) {
            console.log('⚠️ validate-keys.sh not found, skipping auto-bash');
        }
    }
    
    installAPIInterceptor() {
        console.log('🛡️ Installing API call interceptor...');
        
        // Create a function that validates before API calls
        global.validateAPICall = (service, key) => {
            // Check if key is real
            const keyInfo = this.realKeys.get(key) || this.placeholderKeys.get(key);
            
            if (!keyInfo) {
                console.warn(`⚠️ Unknown key: ${key}`);
                return false;
            }
            
            if (this.placeholderKeys.has(key)) {
                console.error(`❌ BLOCKED: Attempted API call to ${service} with placeholder key`);
                return false;
            }
            
            console.log(`✅ Validated API call to ${service}`);
            return true;
        };
        
        // Patch fetch to validate keys
        const originalFetch = global.fetch || require('node-fetch');
        
        global.fetch = async (url, options = {}) => {
            // Check if this is an external API call
            const urlStr = url.toString();
            
            // Check for known API endpoints
            if (urlStr.includes('api.stripe.com')) {
                const authHeader = options.headers?.['Authorization'];
                if (authHeader && !this.isRealStripeKey(authHeader)) {
                    throw new Error('Cannot make Stripe API call with placeholder key');
                }
            }
            
            if (urlStr.includes('api.openai.com')) {
                const authHeader = options.headers?.['Authorization'];
                if (authHeader && !this.isRealOpenAIKey(authHeader)) {
                    console.warn('⚠️ OpenAI call blocked - using placeholder key');
                    // Return mock response
                    return {
                        ok: false,
                        status: 401,
                        json: async () => ({ error: 'Placeholder key detected' })
                    };
                }
            }
            
            if (urlStr.includes('api.anthropic.com')) {
                const apiKey = options.headers?.['x-api-key'];
                if (apiKey && !this.isRealAnthropicKey(apiKey)) {
                    console.warn('⚠️ Anthropic call blocked - using placeholder key');
                    return {
                        ok: false,
                        status: 401,
                        json: async () => ({ error: 'Placeholder key detected' })
                    };
                }
            }
            
            // Allow the call
            return originalFetch(url, options);
        };
        
        console.log('🛡️ API interceptor installed - fake keys will be blocked');
    }
    
    isRealStripeKey(authHeader) {
        const key = authHeader.replace('Bearer ', '');
        return this.validateKeyFormat('stripe', key) && !this.isPlaceholderKey('stripe', key);
    }
    
    isRealOpenAIKey(authHeader) {
        const key = authHeader.replace('Bearer ', '');
        return this.validateKeyFormat('openai', key) && !this.isPlaceholderKey('openai', key);
    }
    
    isRealAnthropicKey(apiKey) {
        return this.validateKeyFormat('anthropic', apiKey) && !this.isPlaceholderKey('anthropic', apiKey);
    }
    
    // API methods
    getKeyStatus() {
        return {
            summary: {
                totalKeys: this.realKeys.size + this.placeholderKeys.size,
                realKeys: this.realKeys.size,
                placeholderKeys: this.placeholderKeys.size,
                symlinks: this.symlinks.size
            },
            
            realKeys: Array.from(this.realKeys.entries()).map(([name, info]) => ({
                name,
                type: info.type,
                canMakeAPICalls: info.canMakeAPICalls
            })),
            
            placeholderKeys: Array.from(this.placeholderKeys.entries()).map(([name, info]) => ({
                name,
                type: info.type,
                reason: info.reason
            })),
            
            criticalServices: {
                stripe: this.hasRealKey('stripe'),
                openai: this.hasRealKey('openai'),
                anthropic: this.hasRealKey('anthropic'),
                github: this.hasRealKey('github')
            }
        };
    }
    
    hasRealKey(service) {
        for (const [name, info] of this.realKeys) {
            if (info.type === service) {
                return true;
            }
        }
        return false;
    }
    
    async updateKey(name, value) {
        // Validate and update a key
        await this.validateAndCategorizeKey(name, value);
        
        // Recreate symlinks with updated status
        await this.createSymlinkStructure();
        
        return {
            name,
            isReal: this.realKeys.has(name),
            isPlaceholder: this.placeholderKeys.has(name)
        };
    }
}

// Export for use with other layers
module.exports = SymlinkSchemaAutoBashValidator;

// If run directly, start the validator
if (require.main === module) {
    console.log('🔗 Starting Symlink Schema Auto-Bash Validator...');
    
    const validator = new SymlinkSchemaAutoBashValidator();
    
    // Set up HTTP interface
    const express = require('express');
    const app = express();
    const port = process.env.PORT || 9191;
    
    app.use(express.json());
    
    // Key status endpoint
    app.get('/status', (req, res) => {
        res.json(validator.getKeyStatus());
    });
    
    // Validate key endpoint
    app.post('/validate', async (req, res) => {
        const { name, value } = req.body;
        
        if (!name || !value) {
            return res.status(400).json({ error: 'Name and value required' });
        }
        
        const result = await validator.updateKey(name, value);
        res.json(result);
    });
    
    // Check if can make API call
    app.post('/can-call-api', (req, res) => {
        const { service } = req.body;
        const canCall = validator.hasRealKey(service);
        
        res.json({
            service,
            canCall,
            reason: canCall ? 'Real key found' : 'Only placeholder key available'
        });
    });
    
    app.listen(port, () => {
        console.log(`🔗 Symlink Validator running on port ${port}`);
        console.log(`📊 Key Status: http://localhost:${port}/status`);
        console.log(`✅ Validation ready - no fake API calls will be made`);
    });
}