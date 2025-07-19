// crypto-key-vault-layer.js - Layer 68: Crypto Key Management Vault
// Public/Private key management + local/cloud decision engine

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

console.log(`
🔐 CRYPTO KEY VAULT LAYER 🔐
Layer 68: Public/Private Key Management + Local/Cloud Decision Engine
Auto-generating keys for Stripe, login systems, JWT, SSH, etc.
`);

class CryptoKeyVaultLayer extends EventEmitter {
    constructor() {
        super();
        this.keyVault = new Map();          // All generated keys
        this.keyPairs = new Map();          // RSA/ECDSA key pairs
        this.apiKeys = new Map();           // Service API keys
        this.jwtSecrets = new Map();        // JWT signing keys
        this.stripeKeys = new Map();        // Stripe keys
        this.sshKeys = new Map();           // SSH key pairs
        this.deploymentKeys = new Map();    // Deployment keys
        this.localCloudDecision = new Map(); // Where to store each key
        
        console.log('🔐 Crypto Key Vault initializing...');
        this.initializeVault();
    }
    
    async initializeVault() {
        // Create secure vault directory
        await this.createVaultDirectory();
        
        // Generate master encryption key
        await this.generateMasterKey();
        
        // Create all key types
        await this.generateAllKeyTypes();
        
        // Set up local/cloud decision engine
        this.setupLocalCloudEngine();
        
        // Start key rotation scheduler
        this.startKeyRotation();
        
        console.log('🔐 Crypto Key Vault ready with all key types');
    }
    
    async createVaultDirectory() {
        this.vaultPath = path.join(__dirname, '.vault');
        this.keysPath = path.join(this.vaultPath, 'keys');
        this.backupPath = path.join(this.vaultPath, 'backup');
        
        try {
            await fs.mkdir(this.vaultPath, { recursive: true });
            await fs.mkdir(this.keysPath, { recursive: true });
            await fs.mkdir(this.backupPath, { recursive: true });
            
            // Set restrictive permissions (Unix only)
            if (process.platform !== 'win32') {
                await fs.chmod(this.vaultPath, 0o700);
                await fs.chmod(this.keysPath, 0o700);
            }
            
            console.log('🗄️ Secure vault directory created');
        } catch (error) {
            console.error('❌ Failed to create vault directory:', error);
        }
    }
    
    async generateMasterKey() {
        // Generate master encryption key for vault
        const masterKey = crypto.randomBytes(32); // 256-bit key
        const masterKeyHash = crypto.createHash('sha256').update(masterKey).digest('hex');
        
        this.masterKey = masterKey;
        this.masterKeyId = masterKeyHash.substring(0, 16);
        
        // Store encrypted master key (paradox, but using system keyring in production)
        const encryptedMaster = this.encryptWithSystemKey(masterKey);
        await this.storeSecurely('master_key', encryptedMaster, 'local');
        
        console.log(`🔐 Master key generated: ${this.masterKeyId}`);
    }
    
    async generateAllKeyTypes() {
        console.log('🔑 Generating all key types...');
        
        // 1. RSA Key Pairs (2048, 3072, 4096 bit)
        await this.generateRSAKeyPairs();
        
        // 2. ECDSA Key Pairs (P-256, P-384, P-521)
        await this.generateECDSAKeyPairs();
        
        // 3. JWT Secrets (HS256, HS384, HS512)
        await this.generateJWTSecrets();
        
        // 4. Stripe Keys (test and live)
        await this.generateStripeKeyStructure();
        
        // 5. SSH Key Pairs
        await this.generateSSHKeys();
        
        // 6. API Keys for all services
        await this.generateServiceAPIKeys();
        
        // 7. Deployment Keys
        await this.generateDeploymentKeys();
        
        // 8. Database Encryption Keys
        await this.generateDatabaseKeys();
        
        console.log('✅ All key types generated successfully');
    }
    
    async generateRSAKeyPairs() {
        const rsaSizes = [2048, 3072, 4096];
        
        for (const keySize of rsaSizes) {
            const keyPair = crypto.generateKeyPairSync('rsa', {
                modulusLength: keySize,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });
            
            const keyId = `rsa_${keySize}_${Date.now()}`;
            this.keyPairs.set(keyId, {
                type: 'rsa',
                size: keySize,
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey,
                created: new Date(),
                uses: []
            });
            
            // Decide local vs cloud storage
            const storage = this.decideStorage(keyId, 'rsa', keySize);
            await this.storeKeyPair(keyId, keyPair, storage);
        }
        
        console.log('🔐 RSA key pairs generated: 2048, 3072, 4096 bit');
    }
    
    async generateECDSAKeyPairs() {
        const curves = ['prime256v1', 'secp384r1', 'secp521r1'];
        
        for (const curve of curves) {
            const keyPair = crypto.generateKeyPairSync('ec', {
                namedCurve: curve,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });
            
            const keyId = `ecdsa_${curve}_${Date.now()}`;
            this.keyPairs.set(keyId, {
                type: 'ecdsa',
                curve: curve,
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey,
                created: new Date(),
                uses: []
            });
            
            const storage = this.decideStorage(keyId, 'ecdsa', curve);
            await this.storeKeyPair(keyId, keyPair, storage);
        }
        
        console.log('🔐 ECDSA key pairs generated: P-256, P-384, P-521');
    }
    
    async generateJWTSecrets() {
        const algorithms = ['HS256', 'HS384', 'HS512'];
        const keySizes = { 'HS256': 32, 'HS384': 48, 'HS512': 64 };
        
        for (const alg of algorithms) {
            const secret = crypto.randomBytes(keySizes[alg]);
            const keyId = `jwt_${alg.toLowerCase()}_${Date.now()}`;
            
            this.jwtSecrets.set(keyId, {
                algorithm: alg,
                secret: secret,
                secretB64: secret.toString('base64'),
                secretHex: secret.toString('hex'),
                created: new Date(),
                rotateAfter: 90 * 24 * 60 * 60 * 1000 // 90 days
            });
            
            const storage = this.decideStorage(keyId, 'jwt', alg);
            await this.storeSecurely(keyId, secret, storage);
        }
        
        console.log('🔐 JWT secrets generated: HS256, HS384, HS512');
    }
    
    async generateStripeKeyStructure() {
        // Generate structure for Stripe keys (will be replaced with real keys)
        const environments = ['test', 'live'];
        
        for (const env of environments) {
            const stripeConfig = {
                publishableKey: `pk_${env}_placeholder_${this.generateRandomString(50)}`,
                secretKey: `sk_${env}_placeholder_${this.generateRandomString(50)}`,
                webhookSecret: `whsec_${this.generateRandomString(55)}`,
                environment: env,
                created: new Date(),
                needsReplacement: true
            };
            
            this.stripeKeys.set(`stripe_${env}`, stripeConfig);
            
            // Store in cloud for live, local for test
            const storage = env === 'live' ? 'cloud' : 'local';
            await this.storeSecurely(`stripe_${env}`, stripeConfig, storage);
        }
        
        console.log('🔐 Stripe key structure generated (placeholders)');
    }
    
    async generateSSHKeys() {
        // Generate SSH key pairs for deployment
        const keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
        
        // Convert to SSH format (simplified)
        const sshPublicKey = `ssh-rsa ${Buffer.from(keyPair.publicKey).toString('base64')} document-generator@localhost`;
        
        const keyId = `ssh_deployment_${Date.now()}`;
        this.sshKeys.set(keyId, {
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
            sshPublicKey: sshPublicKey,
            created: new Date(),
            purpose: 'deployment'
        });
        
        await this.storeKeyPair(keyId, keyPair, 'local');
        
        console.log('🔐 SSH deployment keys generated');
    }
    
    async generateServiceAPIKeys() {
        const services = [
            { name: 'anthropic', prefix: 'sk-ant-api03' },
            { name: 'openai', prefix: 'sk-proj' },
            { name: 'github', prefix: 'ghp' },
            { name: 'vercel', prefix: 'vercel' },
            { name: 'railway', prefix: 'railway' },
            { name: 'supabase', prefix: 'sbp' },
            { name: 'planetscale', prefix: 'pscale' }
        ];
        
        for (const service of services) {
            const apiKey = `${service.prefix}_${this.generateRandomString(40)}`;
            const keyId = `api_${service.name}_${Date.now()}`;
            
            this.apiKeys.set(keyId, {
                service: service.name,
                key: apiKey,
                prefix: service.prefix,
                created: new Date(),
                needsReplacement: true,
                permissions: []
            });
            
            // Store API keys in cloud for security
            await this.storeSecurely(keyId, apiKey, 'cloud');
        }
        
        console.log('🔐 Service API key placeholders generated');
    }
    
    async generateDeploymentKeys() {
        const deploymentTypes = ['docker', 'kubernetes', 'terraform', 'ansible'];
        
        for (const type of deploymentTypes) {
            const deployKey = crypto.randomBytes(32).toString('hex');
            const keyId = `deploy_${type}_${Date.now()}`;
            
            this.deploymentKeys.set(keyId, {
                type: type,
                key: deployKey,
                created: new Date(),
                environments: ['staging', 'production']
            });
            
            await this.storeSecurely(keyId, deployKey, 'local');
        }
        
        console.log('🔐 Deployment keys generated');
    }
    
    async generateDatabaseKeys() {
        const databases = ['postgres', 'redis', 'mongodb'];
        
        for (const db of databases) {
            const encryptionKey = crypto.randomBytes(32);
            const keyId = `db_${db}_${Date.now()}`;
            
            this.keyVault.set(keyId, {
                type: 'database_encryption',
                database: db,
                key: encryptionKey,
                keyHex: encryptionKey.toString('hex'),
                created: new Date(),
                rotateAfter: 365 * 24 * 60 * 60 * 1000 // 1 year
            });
            
            await this.storeSecurely(keyId, encryptionKey, 'local');
        }
        
        console.log('🔐 Database encryption keys generated');
    }
    
    decideStorage(keyId, keyType, size) {
        // Decision engine: local vs cloud storage
        let decision = 'local'; // Default
        
        // High-security keys go to cloud
        if (keyType === 'rsa' && size >= 4096) {
            decision = 'cloud';
        }
        
        // Production keys go to cloud
        if (keyId.includes('live') || keyId.includes('production')) {
            decision = 'cloud';
        }
        
        // Development keys stay local
        if (keyId.includes('test') || keyId.includes('dev')) {
            decision = 'local';
        }
        
        // API keys generally go to cloud
        if (keyType === 'api') {
            decision = 'cloud';
        }
        
        this.localCloudDecision.set(keyId, decision);
        return decision;
    }
    
    async storeKeyPair(keyId, keyPair, storage) {
        if (storage === 'local') {
            // Store locally in vault
            const keyPath = path.join(this.keysPath, `${keyId}.json`);
            const encrypted = this.encryptData({
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey
            });
            
            await fs.writeFile(keyPath, JSON.stringify(encrypted));
        } else {
            // In production, would store in cloud HSM/KMS
            console.log(`🌐 Would store ${keyId} in cloud HSM`);
        }
    }
    
    async storeSecurely(keyId, data, storage) {
        if (storage === 'local') {
            const keyPath = path.join(this.keysPath, `${keyId}.enc`);
            const encrypted = this.encryptData(data);
            await fs.writeFile(keyPath, JSON.stringify(encrypted));
        } else {
            console.log(`🌐 Would store ${keyId} in cloud KMS`);
        }
    }
    
    encryptData(data) {
        // Encrypt data with master key
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            iv: iv.toString('hex'),
            data: encrypted,
            tag: cipher.getAuthTag().toString('hex')
        };
    }
    
    encryptWithSystemKey(data) {
        // Simplified system encryption (in production, use OS keyring)
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    
    generateRandomString(length) {
        return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').substring(0, length);
    }
    
    setupLocalCloudEngine() {
        console.log('🏗️ Setting up local/cloud decision engine...');
        
        // Rules for key storage decisions
        this.storageRules = {
            // Local storage rules
            local: [
                'development keys',
                'test environments', 
                'SSH keys for deployment',
                'database encryption for local dev',
                'JWT secrets for testing'
            ],
            
            // Cloud storage rules  
            cloud: [
                'production API keys',
                'live Stripe keys',
                'high-security RSA keys (4096+)',
                'backup encryption keys',
                'certificate signing keys'
            ]
        };
        
        console.log('📍 Storage rules configured for optimal security');
    }
    
    startKeyRotation() {
        // Start automatic key rotation
        setInterval(() => {
            this.rotateExpiredKeys();
        }, 24 * 60 * 60 * 1000); // Daily check
        
        console.log('🔄 Key rotation scheduler started');
    }
    
    async rotateExpiredKeys() {
        console.log('🔄 Checking for expired keys...');
        
        for (const [keyId, key] of this.jwtSecrets) {
            if (key.rotateAfter && Date.now() - key.created.getTime() > key.rotateAfter) {
                console.log(`🔄 Rotating expired JWT key: ${keyId}`);
                await this.rotateJWTSecret(keyId);
            }
        }
    }
    
    async rotateJWTSecret(keyId) {
        const oldKey = this.jwtSecrets.get(keyId);
        if (!oldKey) return;
        
        // Generate new secret
        const keySizes = { 'HS256': 32, 'HS384': 48, 'HS512': 64 };
        const newSecret = crypto.randomBytes(keySizes[oldKey.algorithm]);
        
        // Update with new secret
        this.jwtSecrets.set(keyId, {
            ...oldKey,
            secret: newSecret,
            secretB64: newSecret.toString('base64'),
            secretHex: newSecret.toString('hex'),
            created: new Date(),
            previousSecret: oldKey.secret // Keep old for verification during transition
        });
        
        // Store new secret
        const storage = this.localCloudDecision.get(keyId) || 'local';
        await this.storeSecurely(keyId, newSecret, storage);
        
        console.log(`✅ Rotated JWT secret: ${keyId}`);
    }
    
    // API Methods for other layers
    getKeyForService(service, environment = 'test') {
        // Get API key for specific service
        for (const [keyId, key] of this.apiKeys) {
            if (key.service === service) {
                return {
                    keyId: keyId,
                    key: key.key,
                    needsReplacement: key.needsReplacement
                };
            }
        }
        return null;
    }
    
    getJWTSecret(algorithm = 'HS256') {
        // Get JWT secret for signing
        for (const [keyId, secret] of this.jwtSecrets) {
            if (secret.algorithm === algorithm) {
                return {
                    keyId: keyId,
                    secret: secret.secretB64,
                    algorithm: algorithm
                };
            }
        }
        return null;
    }
    
    getStripeKeys(environment = 'test') {
        const stripeKey = this.stripeKeys.get(`stripe_${environment}`);
        return stripeKey || null;
    }
    
    getSSHKey() {
        // Get SSH key for deployment
        for (const [keyId, key] of this.sshKeys) {
            if (key.purpose === 'deployment') {
                return {
                    keyId: keyId,
                    publicKey: key.sshPublicKey,
                    privateKeyPath: path.join(this.keysPath, `${keyId}.json`)
                };
            }
        }
        return null;
    }
    
    // Status and health methods
    getVaultStatus() {
        return {
            totalKeys: this.keyVault.size,
            keyPairs: this.keyPairs.size,
            apiKeys: this.apiKeys.size,
            jwtSecrets: this.jwtSecrets.size,
            stripeKeys: this.stripeKeys.size,
            sshKeys: this.sshKeys.size,
            deploymentKeys: this.deploymentKeys.size,
            localStorage: Array.from(this.localCloudDecision.values()).filter(v => v === 'local').length,
            cloudStorage: Array.from(this.localCloudDecision.values()).filter(v => v === 'cloud').length,
            masterKeyId: this.masterKeyId,
            vaultPath: this.vaultPath
        };
    }
}

// Export for use with other layers
module.exports = CryptoKeyVaultLayer;

// If run directly, start the vault
if (require.main === module) {
    console.log('🔐 Starting Crypto Key Vault Layer...');
    
    const vault = new CryptoKeyVaultLayer();
    
    // Set up HTTP interface
    const express = require('express');
    const app = express();
    const port = process.env.PORT || 8888;
    
    app.use(express.json());
    
    // Vault status endpoint
    app.get('/status', (req, res) => {
        res.json(vault.getVaultStatus());
    });
    
    // Get service key endpoint
    app.get('/key/:service', (req, res) => {
        const key = vault.getKeyForService(req.params.service);
        if (key) {
            res.json({ service: req.params.service, hasKey: true, needsReplacement: key.needsReplacement });
        } else {
            res.json({ service: req.params.service, hasKey: false });
        }
    });
    
    // Get JWT secret endpoint
    app.get('/jwt/:algorithm?', (req, res) => {
        const algorithm = req.params.algorithm || 'HS256';
        const secret = vault.getJWTSecret(algorithm);
        if (secret) {
            res.json({ algorithm: algorithm, hasSecret: true, keyId: secret.keyId });
        } else {
            res.json({ algorithm: algorithm, hasSecret: false });
        }
    });
    
    // Get Stripe keys endpoint
    app.get('/stripe/:environment?', (req, res) => {
        const environment = req.params.environment || 'test';
        const keys = vault.getStripeKeys(environment);
        if (keys) {
            res.json({ 
                environment: environment, 
                hasKeys: true, 
                needsReplacement: keys.needsReplacement 
            });
        } else {
            res.json({ environment: environment, hasKeys: false });
        }
    });
    
    app.listen(port, () => {
        console.log(`🔐 Crypto Key Vault running on port ${port}`);
        console.log(`📊 Vault Status: http://localhost:${port}/status`);
        console.log(`🔑 Service Keys: http://localhost:${port}/key/stripe`);
        console.log(`🎫 JWT Secrets: http://localhost:${port}/jwt/HS256`);
    });
}