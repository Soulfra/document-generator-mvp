// vault-integration-service.js - Integrates Crypto Vault with All Services
// Connects encrypted API keys to Document Generator, AI Services, etc.

const http = require('http');
const EventEmitter = require('events');

// Simple fetch replacement using http
function fetch(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    json: () => Promise.resolve(JSON.parse(data)),
                    statusCode: res.statusCode
                });
            });
        });
        req.on('error', reject);
    });
}

class VaultIntegrationService extends EventEmitter {
    constructor() {
        super();
        this.vaultUrl = 'http://localhost:8888';
        this.keyCache = new Map();
        this.services = new Map();
        this.isConnected = false;
        
        console.log('🔐 Vault Integration Service initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Test vault connection
            await this.connectToVault();
            
            // Load all available keys
            await this.loadAllKeys();
            
            // Setup service integrations
            await this.setupServiceIntegrations();
            
            // Start key refresh scheduler
            this.startKeyRefresh();
            
            this.isConnected = true;
            console.log('✅ Vault Integration Service ready!');
            this.displayIntegrationStatus();
            
        } catch (error) {
            console.error('❌ Vault integration failed:', error);
        }
    }
    
    async connectToVault() {
        console.log('🔗 Connecting to crypto vault...');
        
        const response = await fetch(`${this.vaultUrl}/status`);
        if (!response.ok) {
            throw new Error('Vault not responding');
        }
        
        const status = await response.json();
        console.log(`✅ Connected to vault with ${status.totalKeys} keys`);
        
        return status;
    }
    
    async loadAllKeys() {
        console.log('🔑 Loading all keys from vault...');
        
        const services = ['anthropic', 'openai', 'github', 'vercel', 'railway', 'supabase'];
        const jwtAlgorithms = ['HS256', 'HS384', 'HS512'];
        const stripeEnvs = ['test', 'live'];
        
        // Load service API keys
        for (const service of services) {
            try {
                const response = await fetch(`${this.vaultUrl}/key/${service}`);
                const keyInfo = await response.json();
                
                if (keyInfo.hasKey) {
                    this.keyCache.set(`api_${service}`, {
                        service: service,
                        available: true,
                        needsReplacement: keyInfo.needsReplacement,
                        lastChecked: new Date()
                    });
                    console.log(`🔑 ${service}: ${keyInfo.needsReplacement ? '⚠️ placeholder' : '✅ ready'}`);
                }
            } catch (error) {
                console.error(`❌ Failed to load ${service} key:`, error.message);
            }
        }
        
        // Load JWT secrets
        for (const algorithm of jwtAlgorithms) {
            try {
                const response = await fetch(`${this.vaultUrl}/jwt/${algorithm}`);
                const secretInfo = await response.json();
                
                if (secretInfo.hasSecret) {
                    this.keyCache.set(`jwt_${algorithm}`, {
                        algorithm: algorithm,
                        keyId: secretInfo.keyId,
                        available: true,
                        lastChecked: new Date()
                    });
                    console.log(`🎫 JWT ${algorithm}: ✅ ready`);
                }
            } catch (error) {
                console.error(`❌ Failed to load JWT ${algorithm}:`, error.message);
            }
        }
        
        // Load Stripe keys
        for (const env of stripeEnvs) {
            try {
                const response = await fetch(`${this.vaultUrl}/stripe/${env}`);
                const stripeInfo = await response.json();
                
                if (stripeInfo.hasKeys) {
                    this.keyCache.set(`stripe_${env}`, {
                        environment: env,
                        available: true,
                        needsReplacement: stripeInfo.needsReplacement,
                        lastChecked: new Date()
                    });
                    console.log(`💳 Stripe ${env}: ${stripeInfo.needsReplacement ? '⚠️ placeholder' : '✅ ready'}`);
                }
            } catch (error) {
                console.error(`❌ Failed to load Stripe ${env}:`, error.message);
            }
        }
        
        console.log(`✅ Loaded ${this.keyCache.size} keys from vault`);
    }
    
    async setupServiceIntegrations() {
        console.log('🔌 Setting up service integrations...');
        
        // Document Generator AI Services Integration
        this.services.set('document-generator', {
            port: 8080,
            endpoints: ['/api/ai/process', '/api/generate'],
            requiredKeys: ['anthropic', 'openai'],
            status: 'configuring'
        });
        
        // Template Processor (MCP) Integration
        this.services.set('template-processor', {
            port: 3000,
            endpoints: ['/api/templates', '/api/generate'],
            requiredKeys: ['anthropic', 'openai'],
            status: 'configuring'
        });
        
        // AI API Service Integration
        this.services.set('ai-api', {
            port: 3001,
            endpoints: ['/ai/complete', '/ai/stream'],
            requiredKeys: ['anthropic', 'openai', 'jwt_HS256'],
            status: 'configuring'
        });
        
        // Analytics Service Integration
        this.services.set('analytics', {
            port: 3002,
            endpoints: ['/api/track', '/api/analyze'],
            requiredKeys: ['jwt_HS256'],
            status: 'configuring'
        });
        
        // Configure each service with vault keys
        for (const [serviceName, config] of this.services) {
            await this.configureService(serviceName, config);
        }
        
        console.log('✅ Service integrations configured');
    }
    
    async configureService(serviceName, config) {
        console.log(`🔧 Configuring ${serviceName}...`);
        
        const serviceKeys = {};
        let allKeysAvailable = true;
        
        // Get required keys for this service
        for (const keyName of config.requiredKeys) {
            const cacheKey = keyName.startsWith('jwt_') ? keyName : `api_${keyName}`;
            const keyInfo = this.keyCache.get(cacheKey);
            
            if (keyInfo && keyInfo.available) {
                serviceKeys[keyName] = {
                    available: true,
                    needsReplacement: keyInfo.needsReplacement || false
                };
            } else {
                serviceKeys[keyName] = { available: false };
                allKeysAvailable = false;
            }
        }
        
        // Update service status
        config.keys = serviceKeys;
        config.status = allKeysAvailable ? 'ready' : 'missing-keys';
        config.lastConfigured = new Date();
        
        console.log(`${allKeysAvailable ? '✅' : '⚠️'} ${serviceName}: ${config.status}`);
    }
    
    // API method to get actual key values (would be secured in production)
    async getKeyForService(service, keyType) {
        const cacheKey = keyType.startsWith('jwt_') ? keyType : `api_${keyType}`;
        const keyInfo = this.keyCache.get(cacheKey);
        
        if (!keyInfo || !keyInfo.available) {
            return null;
        }
        
        // In development, return mock keys
        // In production, this would securely fetch from vault
        return {
            service: service,
            type: keyType,
            value: this.generateMockKey(keyType),
            needsReplacement: keyInfo.needsReplacement || false
        };
    }
    
    generateMockKey(keyType) {
        // Generate realistic mock keys for development
        const mockKeys = {
            anthropic: 'sk-ant-api03-mock-development-key-for-testing-purposes-only',
            openai: 'sk-proj-mock-development-key-for-testing-purposes-only',
            github: 'ghp_mock-development-key-for-testing-purposes-only',
            jwt_HS256: 'mock-jwt-secret-for-development-testing-only'
        };
        
        return mockKeys[keyType] || `mock-${keyType}-development-key`;
    }
    
    startKeyRefresh() {
        // Refresh key cache every 5 minutes
        setInterval(async () => {
            try {
                await this.loadAllKeys();
                console.log('🔄 Key cache refreshed');
            } catch (error) {
                console.error('❌ Key refresh failed:', error.message);
            }
        }, 5 * 60 * 1000);
        
        console.log('🔄 Key refresh scheduler started');
    }
    
    displayIntegrationStatus() {
        console.log('\n🔐 VAULT INTEGRATION STATUS 🔐');
        console.log('═'.repeat(50));
        
        console.log('\n📊 Services:');
        for (const [name, config] of this.services) {
            const statusIcon = config.status === 'ready' ? '✅' : 
                             config.status === 'missing-keys' ? '⚠️' : '🔧';
            console.log(`  ${statusIcon} ${name} (port ${config.port}): ${config.status}`);
            
            for (const keyName of config.requiredKeys) {
                const keyStatus = config.keys[keyName];
                const keyIcon = keyStatus.available ? 
                    (keyStatus.needsReplacement ? '🔶' : '🔑') : '❌';
                console.log(`    ${keyIcon} ${keyName}`);
            }
        }
        
        console.log('\n🔑 Available Keys:');
        for (const [keyName, keyInfo] of this.keyCache) {
            const statusIcon = keyInfo.needsReplacement ? '🔶' : '✅';
            console.log(`  ${statusIcon} ${keyName}`);
        }
        
        console.log('\n🌐 Vault Connection:');
        console.log(`  📡 URL: ${this.vaultUrl}`);
        console.log(`  🔗 Status: ${this.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
        console.log(`  💾 Cached Keys: ${this.keyCache.size}`);
        
        console.log('\n🎯 Next Steps:');
        console.log('  1. Replace placeholder API keys with real keys in vault');
        console.log('  2. Configure services to use vault keys');
        console.log('  3. Test end-to-end document processing');
        
        console.log('═'.repeat(50));
    }
    
    // Health check method
    async healthCheck() {
        try {
            const vaultStatus = await this.connectToVault();
            const servicesReady = Array.from(this.services.values())
                .filter(s => s.status === 'ready').length;
            
            return {
                healthy: true,
                vault: {
                    connected: true,
                    totalKeys: vaultStatus.totalKeys
                },
                services: {
                    total: this.services.size,
                    ready: servicesReady,
                    configured: Array.from(this.services.values())
                        .filter(s => s.status !== 'unconfigured').length
                },
                keys: {
                    cached: this.keyCache.size,
                    needReplacement: Array.from(this.keyCache.values())
                        .filter(k => k.needsReplacement).length
                }
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message
            };
        }
    }
}

module.exports = VaultIntegrationService;

// If run directly, start the integration service
if (require.main === module) {
    console.log('🚀 Starting Vault Integration Service...');
    
    const integrationService = new VaultIntegrationService();
    
    // Set up HTTP interface for other services to use
    const express = require('express');
    const app = express();
    const port = process.env.PORT || 8889;
    
    app.use(express.json());
    
    // Health check endpoint
    app.get('/health', async (req, res) => {
        const health = await integrationService.healthCheck();
        res.json(health);
    });
    
    // Get service configuration
    app.get('/service/:serviceName', (req, res) => {
        const service = integrationService.services.get(req.params.serviceName);
        if (service) {
            res.json(service);
        } else {
            res.status(404).json({ error: 'Service not found' });
        }
    });
    
    // Get key for service (development only)
    app.get('/key/:service/:keyType', async (req, res) => {
        const { service, keyType } = req.params;
        const key = await integrationService.getKeyForService(service, keyType);
        
        if (key) {
            res.json({
                service: key.service,
                type: key.type,
                available: true,
                needsReplacement: key.needsReplacement
                // Note: actual key value not returned for security
            });
        } else {
            res.status(404).json({ error: 'Key not found' });
        }
    });
    
    app.listen(port, () => {
        console.log(`\n🔌 Vault Integration Service running on port ${port}`);
        console.log(`🏥 Health Check: http://localhost:${port}/health`);
        console.log(`🔧 Service Config: http://localhost:${port}/service/document-generator`);
        console.log(`🔑 Key Access: http://localhost:${port}/key/document-generator/anthropic`);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Vault Integration Service...');
        process.exit(0);
    });
}