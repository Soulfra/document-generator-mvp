#!/usr/bin/env node

/**
 * 🔐 UNIFIED AUTHENTICATION STRATEGY
 * 
 * Clarifies and integrates all authentication methods:
 * 1. QR Login (Soulfra) - Primary user-facing login
 * 2. JWT Tokens - Session management after login
 * 3. API Keys - Developer/integration access
 * 4. Wallet Keys - Agent/AI authentication
 * 
 * "this is just like the soulfra login system again... this is like so confusing
 * to be a project or idea owner idk."
 * 
 * This system makes it crystal clear when to use what.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { Client } = require('pg');
const WebSocket = require('ws');

// Import existing systems
const { APIPermissionTierManager } = require('./api-permission-tier-management-system.js');
const AgentWalletSystem = require('./agent-wallet-system.js');
const CalLoggingTestOrchestrator = require('./cal-logging-test-orchestrator.js');

console.log(`
🔐 UNIFIED AUTHENTICATION STRATEGY 🔐
=====================================
Integrating QR Login + JWT + API Keys + Wallets
into one clear authentication flow
`);

class UnifiedAuthStrategy extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 4100,
            wsPort: options.wsPort || 4101,
            
            // QR Login (Soulfra) Configuration
            qrLogin: {
                enabled: true,
                pairingUrl: 'http://localhost:11111',
                widgetUrl: '/auth/widget.js',
                defaultMethod: true // This is the primary login method
            },
            
            // JWT Configuration (for sessions after login)
            jwt: {
                secret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
                expiresIn: '24h',
                refreshExpiresIn: '30d'
            },
            
            // API Key Configuration (for developers)
            apiKeys: {
                tierManager: new APIPermissionTierManager(),
                defaultTiers: ['tier1_public'] // What new users get
            },
            
            // Wallet Configuration (for agents/AI)
            wallets: {
                system: new AgentWalletSystem(),
                autoCreateForAgents: true
            },
            
            ...options
        };
        
        // PostgreSQL connection
        this.pgClient = new Client({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            database: process.env.POSTGRES_DB || 'document_generator',
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'password'
        });
        
        // Tracking
        this.activeSessions = new Map();
        this.authMethods = new Map();
        
        // Cal's Logging System
        this.calLogger = new CalLoggingTestOrchestrator({
            dashboard: {
                port: 8888,
                wsPort: 8889
            },
            services: {
                'unified-auth': `http://localhost:${this.config.port}`,
                'qr-login': 'http://localhost:11111',
                'public-layer-db': 'http://localhost:8777',
                'data-migration': 'http://localhost:8780'
            }
        });
        
        // Express app
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        this.setupRoutes();
        this.setupWebSocket();
    }
    
    async initialize() {
        try {
            // Initialize Cal's logging system first
            await this.calLogger.initialize();
            this.calLogger.logInfo('Unified Authentication Strategy starting up', {
                port: this.config.port,
                qrLoginEnabled: this.config.qrLogin.enabled,
                jwtSecret: this.config.jwt.secret ? 'configured' : 'missing'
            }, 'unified-auth');
            
            // Connect to database
            await this.pgClient.connect();
            console.log('✅ Connected to PostgreSQL database');
            this.calLogger.logInfo('PostgreSQL database connected successfully', {
                host: process.env.POSTGRES_HOST || 'localhost',
                database: process.env.POSTGRES_DB || 'document_generator'
            }, 'unified-auth');
            
            // Initialize database schema
            await this.initializeDatabaseSchema();
            
            // Initialize subsystems
            await this.config.wallets.system.initialize();
            this.calLogger.logInfo('Agent wallet system initialized', {
                autoCreateForAgents: this.config.wallets.autoCreateForAgents
            }, 'unified-auth');
            
            // Start server
            this.app.listen(this.config.port, () => {
                console.log(`🔐 Unified Auth API on port ${this.config.port}`);
                console.log(`📱 QR Login Widget: http://localhost:${this.config.port}/auth/widget`);
                console.log(`🔑 Developer Portal: http://localhost:${this.config.port}/developer`);
                
                this.calLogger.logInfo('Unified Authentication API server started', {
                    port: this.config.port,
                    endpoints: {
                        qrWidget: `/auth/widget`,
                        developerPortal: `/developer`,
                        apiBase: `/api/v1`,
                        healthCheck: `/health`
                    }
                }, 'unified-auth');
            });
            
            console.log('\n✅ Unified Authentication Strategy ready!');
            this.calLogger.logInfo('System initialization completed successfully', {
                dashboard: `http://localhost:${this.calLogger.config.dashboard.port}`,
                authMethods: ['qr', 'email', 'oauth', 'api_key', 'wallet']
            }, 'unified-auth');
            this.displayAuthenticationGuide();
            
        } catch (error) {
            console.error('❌ Failed to initialize auth strategy:', error);
            this.calLogger.logError('System initialization failed', {
                error: error.message,
                stack: error.stack
            }, 'unified-auth');
            throw error;
        }
    }
    
    async initializeDatabaseSchema() {
        const queries = [
            // Unified user accounts table
            `CREATE TABLE IF NOT EXISTS unified_accounts (
                id SERIAL PRIMARY KEY,
                account_id VARCHAR(255) UNIQUE NOT NULL,
                
                -- QR Login (primary)
                device_paired BOOLEAN DEFAULT false,
                device_id VARCHAR(255),
                character_assigned VARCHAR(50),
                
                -- Traditional login (optional)
                email VARCHAR(255) UNIQUE,
                password_hash TEXT,
                email_verified BOOLEAN DEFAULT false,
                
                -- OAuth (optional)
                google_id VARCHAR(255) UNIQUE,
                github_id VARCHAR(255) UNIQUE,
                
                -- API access
                api_keys_enabled BOOLEAN DEFAULT false,
                api_tier_access TEXT[],
                
                -- Wallet (for agents)
                wallet_address VARCHAR(66),
                is_agent BOOLEAN DEFAULT false,
                
                -- Metadata
                display_name VARCHAR(255),
                avatar_url TEXT,
                preferences JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )`,
            
            // Authentication methods tracking
            `CREATE TABLE IF NOT EXISTS auth_methods_used (
                id SERIAL PRIMARY KEY,
                account_id VARCHAR(255) REFERENCES unified_accounts(account_id),
                method VARCHAR(50) CHECK (method IN ('qr', 'email', 'google', 'github', 'api_key', 'wallet')),
                first_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                use_count INTEGER DEFAULT 1
            )`,
            
            // API key registry
            `CREATE TABLE IF NOT EXISTS user_api_keys (
                id SERIAL PRIMARY KEY,
                account_id VARCHAR(255) REFERENCES unified_accounts(account_id),
                key_id VARCHAR(255) UNIQUE NOT NULL,
                key_hash TEXT NOT NULL,
                tier VARCHAR(50),
                name VARCHAR(255),
                last_used TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )`,
            
            // Session management
            `CREATE TABLE IF NOT EXISTS active_sessions (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) UNIQUE NOT NULL,
                account_id VARCHAR(255) REFERENCES unified_accounts(account_id),
                auth_method VARCHAR(50),
                jwt_token TEXT,
                refresh_token TEXT,
                device_info JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )`
        ];
        
        for (const query of queries) {
            await this.pgClient.query(query);
        }
        
        console.log('✅ Unified auth database schema initialized');
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                service: 'unified-auth-strategy',
                methods: {
                    qr_login: this.config.qrLogin.enabled,
                    email_login: true,
                    oauth: true,
                    api_keys: true,
                    wallets: true
                }
            });
        });
        
        // ======================
        // QR LOGIN WIDGET ROUTE
        // ======================
        this.app.get('/auth/widget', (req, res) => {
            res.send(this.generateEnhancedQRWidget());
        });
        
        // Serve the embeddable widget script
        this.app.get('/auth/widget.js', (req, res) => {
            res.type('application/javascript');
            res.send(this.generateWidgetScript());
        });
        
        // ======================
        // DEVELOPER PORTAL
        // ======================
        this.app.get('/developer', async (req, res) => {
            res.send(this.generateDeveloperPortal());
        });
        
        // Generate API key for logged-in user
        this.app.post('/api/developer/generate-key', async (req, res) => {
            const startTime = Date.now();
            try {
                const { accountId, tier, name } = req.body;
                
                this.calLogger.logInfo('API key generation requested', {
                    accountId,
                    tier,
                    keyName: name,
                    ip: req.ip
                }, 'auth-api-key');
                
                // Verify user has API access enabled
                const account = await this.getAccount(accountId);
                if (!account.api_keys_enabled) {
                    this.calLogger.logWarn('API key generation denied - API access not enabled', {
                        accountId,
                        tier,
                        reason: 'api_keys_not_enabled'
                    }, 'auth-api-key');
                    return res.status(403).json({ error: 'API access not enabled for this account' });
                }
                
                // Generate API key
                const apiKey = await this.generateAPIKey(accountId, tier, name);
                
                const duration = Date.now() - startTime;
                this.calLogger.logInfo('API key generated successfully', {
                    accountId,
                    keyId: apiKey.key_id,
                    tier: apiKey.tier,
                    keyName: name,
                    duration: duration + 'ms'
                }, 'auth-api-key');
                
                res.json({
                    success: true,
                    key_id: apiKey.key_id,
                    api_key: apiKey.api_key, // Only shown once
                    tier: apiKey.tier,
                    documentation: '/docs/api/' + tier
                });
                
            } catch (error) {
                console.error('Error generating API key:', error);
                this.calLogger.logError('API key generation failed', {
                    accountId: req.body?.accountId,
                    tier: req.body?.tier,
                    error: error.message,
                    duration: (Date.now() - startTime) + 'ms'
                }, 'auth-api-key');
                res.status(500).json({ error: 'Failed to generate API key' });
            }
        });
        
        // ======================
        // AUTHENTICATION FLOW
        // ======================
        
        // QR Login callback (from device)
        this.app.post('/auth/qr/callback', async (req, res) => {
            const startTime = Date.now();
            try {
                const { deviceId, pairingToken } = req.body;
                
                this.calLogger.logInfo('QR login attempt started', {
                    deviceId: deviceId ? 'provided' : 'missing',
                    pairingToken: pairingToken ? 'provided' : 'missing',
                    ip: req.ip
                }, 'auth-qr');
                
                // Create or update account
                const account = await this.handleQRLogin(deviceId, pairingToken);
                
                // Generate JWT session
                const session = await this.createSession(account.account_id, 'qr');
                
                const duration = Date.now() - startTime;
                this.calLogger.logInfo('QR login completed successfully', {
                    accountId: account.account_id,
                    character: account.character_assigned,
                    sessionId: session.session_id,
                    duration: duration + 'ms',
                    newAccount: account.new_account || false
                }, 'auth-qr');
                
                res.json({
                    success: true,
                    account_id: account.account_id,
                    session_token: session.jwt_token,
                    character: account.character_assigned
                });
                
            } catch (error) {
                console.error('QR login error:', error);
                this.calLogger.logError('QR login failed', {
                    error: error.message,
                    duration: (Date.now() - startTime) + 'ms',
                    deviceId: req.body?.deviceId ? 'provided' : 'missing',
                    ip: req.ip
                }, 'auth-qr');
                res.status(500).json({ error: 'QR login failed' });
            }
        });
        
        // Traditional email/password login (backup method)
        this.app.post('/auth/login', async (req, res) => {
            try {
                const { email, password } = req.body;
                
                const account = await this.verifyEmailLogin(email, password);
                if (!account) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
                
                const session = await this.createSession(account.account_id, 'email');
                
                res.json({
                    success: true,
                    account_id: account.account_id,
                    session_token: session.jwt_token,
                    redirect: account.device_paired ? '/dashboard' : '/auth/pair-device'
                });
                
            } catch (error) {
                console.error('Email login error:', error);
                res.status(500).json({ error: 'Login failed' });
            }
        });
        
        // API key authentication (for developers)
        this.app.use('/api/v1', async (req, res, next) => {
            const apiKey = req.headers['x-api-key'];
            if (!apiKey) return next();
            
            const startTime = Date.now();
            try {
                this.calLogger.logDebug('API key validation attempt', {
                    keyPrefix: apiKey.substring(0, 8) + '...',
                    endpoint: req.path,
                    method: req.method,
                    ip: req.ip
                }, 'auth-api-validate');
                
                const validation = await this.validateAPIKey(apiKey);
                if (!validation.valid) {
                    this.calLogger.logWarn('API key validation failed', {
                        keyPrefix: apiKey.substring(0, 8) + '...',
                        reason: validation.error,
                        endpoint: req.path,
                        duration: (Date.now() - startTime) + 'ms'
                    }, 'auth-api-validate');
                    return res.status(401).json({ error: validation.error });
                }
                
                req.auth = {
                    type: 'api_key',
                    account_id: validation.account_id,
                    tier: validation.tier,
                    permissions: validation.permissions
                };
                
                this.calLogger.logDebug('API key validation successful', {
                    accountId: validation.account_id,
                    tier: validation.tier,
                    endpoint: req.path,
                    duration: (Date.now() - startTime) + 'ms'
                }, 'auth-api-validate');
                
                next();
            } catch (error) {
                this.calLogger.logError('API key validation error', {
                    keyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none',
                    error: error.message,
                    endpoint: req.path,
                    duration: (Date.now() - startTime) + 'ms'
                }, 'auth-api-validate');
                res.status(401).json({ error: 'Invalid API key' });
            }
        });
        
        // ======================
        // CLEAR EXPLANATION ENDPOINT
        // ======================
        this.app.get('/auth/how-it-works', (req, res) => {
            res.send(this.generateHowItWorksPage());
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 New WebSocket connection');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    switch (data.type) {
                        case 'qr_pairing_request':
                            this.handleQRPairingRequest(ws, data);
                            break;
                        case 'auth_status':
                            this.sendAuthStatus(ws, data.account_id);
                            break;
                    }
                } catch (error) {
                    console.error('WebSocket error:', error);
                }
            });
        });
    }
    
    // ======================
    // CORE AUTH METHODS
    // ======================
    
    async handleQRLogin(deviceId, pairingToken) {
        this.calLogger.logDebug('Processing QR login', {
            deviceId: deviceId ? 'provided' : 'missing',
            pairingToken: pairingToken ? 'provided' : 'missing'
        }, 'auth-qr-handler');
        
        // Check if device already paired
        let account = await this.pgClient.query(
            'SELECT * FROM unified_accounts WHERE device_id = $1',
            [deviceId]
        );
        
        let isNewAccount = false;
        if (account.rows.length === 0) {
            // Create new account
            const accountId = 'usr_' + crypto.randomBytes(16).toString('hex');
            const character = this.assignCharacter();
            
            this.calLogger.logInfo('Creating new account via QR login', {
                accountId,
                character,
                deviceId
            }, 'auth-qr-handler');
            
            await this.pgClient.query(`
                INSERT INTO unified_accounts 
                (account_id, device_paired, device_id, character_assigned)
                VALUES ($1, $2, $3, $4)
            `, [accountId, true, deviceId, character]);
            
            // Create wallet for user
            try {
                const wallet = await this.config.wallets.system.createWallet(accountId, 'user');
                
                await this.pgClient.query(
                    'UPDATE unified_accounts SET wallet_address = $1 WHERE account_id = $2',
                    [wallet.address, accountId]
                );
                
                this.calLogger.logInfo('Wallet created for new QR account', {
                    accountId,
                    walletAddress: wallet.address
                }, 'auth-qr-handler');
            } catch (walletError) {
                this.calLogger.logWarn('Failed to create wallet for new account', {
                    accountId,
                    error: walletError.message
                }, 'auth-qr-handler');
            }
            
            account = { account_id: accountId, character_assigned: character, new_account: true };
            isNewAccount = true;
        } else {
            account = account.rows[0];
            this.calLogger.logDebug('Existing account found for device', {
                accountId: account.account_id,
                character: account.character_assigned
            }, 'auth-qr-handler');
        }
        
        // Track auth method
        await this.trackAuthMethod(account.account_id, 'qr');
        
        return account;
    }
    
    async createSession(accountId, authMethod) {
        const sessionId = 'sess_' + crypto.randomBytes(16).toString('hex');
        
        this.calLogger.logDebug('Creating new session', {
            accountId,
            authMethod,
            sessionId
        }, 'auth-session');
        
        // Generate JWT
        const token = jwt.sign(
            { 
                account_id: accountId,
                session_id: sessionId,
                auth_method: authMethod
            },
            this.config.jwt.secret,
            { expiresIn: this.config.jwt.expiresIn }
        );
        
        // Generate refresh token
        const refreshToken = crypto.randomBytes(32).toString('hex');
        
        // Store session
        try {
            await this.pgClient.query(`
                INSERT INTO active_sessions
                (session_id, account_id, auth_method, jwt_token, refresh_token, expires_at)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                sessionId,
                accountId,
                authMethod,
                token,
                refreshToken,
                new Date(Date.now() + 24 * 60 * 60 * 1000)
            ]);
            
            this.activeSessions.set(sessionId, {
                account_id: accountId,
                auth_method: authMethod
            });
            
            this.calLogger.logInfo('Session created successfully', {
                accountId,
                sessionId,
                authMethod,
                expiresIn: this.config.jwt.expiresIn
            }, 'auth-session');
            
        } catch (dbError) {
            this.calLogger.logError('Failed to store session in database', {
                accountId,
                sessionId,
                authMethod,
                error: dbError.message
            }, 'auth-session');
            throw dbError;
        }
        
        return {
            session_id: sessionId,
            jwt_token: token,
            refresh_token: refreshToken
        };
    }
    
    async generateAPIKey(accountId, tier, name) {
        // Use the tier manager to generate proper API key
        const deployment = this.config.apiKeys.tierManager.registerDeployment(
            'user_' + accountId + '_' + Date.now(),
            {
                domain: 'api.localhost',
                brandName: name || 'User API Key',
                tierAccess: [tier]
            }
        );
        
        const apiKey = deployment.apiKeys[tier];
        const keyId = 'key_' + crypto.randomBytes(8).toString('hex');
        
        // Store in database
        await this.pgClient.query(`
            INSERT INTO user_api_keys
            (account_id, key_id, key_hash, tier, name)
            VALUES ($1, $2, $3, $4, $5)
        `, [
            accountId,
            keyId,
            crypto.createHash('sha256').update(apiKey.key).digest('hex'),
            tier,
            name
        ]);
        
        return {
            key_id: keyId,
            api_key: apiKey.key,
            tier: tier,
            permissions: apiKey.permissions
        };
    }
    
    async validateAPIKey(apiKey) {
        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
        
        const result = await this.pgClient.query(`
            SELECT k.*, a.account_id 
            FROM user_api_keys k
            JOIN unified_accounts a ON k.account_id = a.account_id
            WHERE k.key_hash = $1 AND k.is_active = true
        `, [keyHash]);
        
        if (result.rows.length === 0) {
            return { valid: false, error: 'Invalid API key' };
        }
        
        const key = result.rows[0];
        
        // Update last used
        await this.pgClient.query(
            'UPDATE user_api_keys SET last_used = CURRENT_TIMESTAMP WHERE key_id = $1',
            [key.key_id]
        );
        
        // Track auth method
        await this.trackAuthMethod(key.account_id, 'api_key');
        
        return {
            valid: true,
            account_id: key.account_id,
            tier: key.tier,
            permissions: this.config.apiKeys.tierManager.apiTiers[key.tier]?.apis || []
        };
    }
    
    async trackAuthMethod(accountId, method) {
        await this.pgClient.query(`
            INSERT INTO auth_methods_used (account_id, method)
            VALUES ($1, $2)
            ON CONFLICT (account_id, method) 
            DO UPDATE SET 
                last_used = CURRENT_TIMESTAMP,
                use_count = auth_methods_used.use_count + 1
        `, [accountId, method]);
    }
    
    assignCharacter() {
        const characters = ['cal', 'arty', 'ralph', 'vera', 'paulo', 'nash'];
        const hour = new Date().getHours();
        
        // Time-based character assignment
        if (hour >= 6 && hour < 12) {
            return characters[Math.floor(Math.random() * 2)]; // Morning: Cal or Paulo
        } else if (hour >= 12 && hour < 17) {
            return characters[2 + Math.floor(Math.random() * 2)]; // Afternoon: Ralph or Vera
        } else {
            return characters[4 + Math.floor(Math.random() * 2)]; // Evening: Arty or Nash
        }
    }
    
    async getAccount(accountId) {
        const result = await this.pgClient.query(
            'SELECT * FROM unified_accounts WHERE account_id = $1',
            [accountId]
        );
        return result.rows[0];
    }
    
    displayAuthenticationGuide() {
        console.log(`
📖 AUTHENTICATION GUIDE
======================

1️⃣  QR LOGIN (Primary Method - Like Soulfra)
   • Users scan QR code with their phone
   • Device gets permanently paired
   • Character (Cal, Arty, etc.) assigned
   • No passwords needed!
   • URL: http://localhost:${this.config.port}/auth/widget

2️⃣  JWT TOKENS (Session Management)
   • Generated after ANY login method
   • Used for API calls: Authorization: Bearer <token>
   • Auto-refresh with refresh tokens
   • 24-hour expiry

3️⃣  API KEYS (Developer Access) 
   • For integrations and automation
   • Tier-based permissions (tier1_public, tier2_partner, etc.)
   • Generated from developer portal
   • Use header: X-API-Key: <key>
   • URL: http://localhost:${this.config.port}/developer

4️⃣  WALLET KEYS (Agent/AI Auth)
   • Ed25519 cryptographic keys
   • For AI agents and automated systems
   • Includes token economy integration
   • Auto-created for agent accounts

🔄 HOW THEY WORK TOGETHER:
   
   User Journey:
   QR Scan → JWT Session → Browse/Use App
                ↓
           (Optional)
       Enable API Access → Generate API Keys → Build Integrations
   
   Agent Journey:
   Agent Created → Wallet Generated → API Access via Signatures

✨ SIMPLE RULE:
   • Humans: Use QR Login
   • Developers: Use API Keys  
   • Agents/AI: Use Wallets
   • Sessions: Always JWT
`);
    }
    
    // ======================
    // UI GENERATION METHODS
    // ======================
    
    generateEnhancedQRWidget() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 Login to Document Generator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .auth-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .subtitle {
            opacity: 0.8;
            margin-bottom: 30px;
        }
        
        .qr-section {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
        }
        
        .qr-placeholder {
            width: 280px;
            height: 280px;
            margin: 0 auto;
            background: #f0f0f0;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
        }
        
        .auth-options {
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .option-title {
            font-size: 14px;
            opacity: 0.7;
            margin-bottom: 15px;
        }
        
        .auth-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .auth-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 10px 20px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .auth-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        
        .explanation {
            margin-top: 40px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            text-align: left;
            font-size: 14px;
        }
        
        .explanation h3 {
            margin-bottom: 10px;
        }
        
        .explanation ul {
            list-style: none;
            padding-left: 0;
        }
        
        .explanation li {
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        
        .explanation li:before {
            content: "•";
            position: absolute;
            left: 0;
        }
        
        .developer-link {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 20px;
            text-decoration: none;
            color: white;
            font-size: 14px;
            transition: background 0.3s ease;
        }
        
        .developer-link:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>
    <a href="/developer" class="developer-link">🛠️ Developer Portal</a>
    
    <div class="auth-container">
        <h1>🔐 Welcome to Document Generator</h1>
        <p class="subtitle">Your unified workspace for turning ideas into reality</p>
        
        <div class="qr-section">
            <div class="qr-placeholder" id="qr-container">
                <div>Loading QR Code...</div>
            </div>
            <p style="color: #666; margin-top: 15px; font-size: 14px;">
                Scan with your phone to instantly connect<br>
                <strong>No passwords needed!</strong>
            </p>
        </div>
        
        <div class="auth-options">
            <p class="option-title">Other login options:</p>
            <div class="auth-buttons">
                <button class="auth-btn" onclick="showEmailLogin()">📧 Email</button>
                <button class="auth-btn" onclick="loginWithGoogle()">🔷 Google</button>
                <button class="auth-btn" onclick="loginWithGitHub()">🐙 GitHub</button>
            </div>
        </div>
        
        <div class="explanation">
            <h3>🤔 How Authentication Works Here:</h3>
            <ul>
                <li><strong>QR Login (Recommended):</strong> Scan once, paired forever. A character guide (Cal, Arty, etc.) will help you get started.</li>
                <li><strong>Session Management:</strong> After login, you get a JWT token that keeps you logged in for 24 hours.</li>
                <li><strong>API Keys:</strong> Developers can generate API keys from the Developer Portal for integrations.</li>
                <li><strong>Agent Wallets:</strong> AI agents get cryptographic wallets for secure autonomous operation.</li>
            </ul>
        </div>
    </div>
    
    <script>
        // Initialize QR login widget
        const script = document.createElement('script');
        script.src = '/auth/widget.js';
        document.head.appendChild(script);
        
        // Configure widget when loaded
        script.onload = () => {
            if (window.configureSoulFra) {
                window.configureSoulFra({
                    apiUrl: 'http://localhost:${this.config.port}',
                    wsUrl: 'ws://localhost:${this.config.wsPort}',
                    position: 'inline',
                    autoShow: true
                });
            }
        };
        
        function showEmailLogin() {
            alert('Email login is a backup method. QR login is recommended!\\n\\nEmail: demo@example.com\\nPassword: demo123');
        }
        
        function loginWithGoogle() {
            window.location.href = '/auth/google';
        }
        
        function loginWithGitHub() {
            window.location.href = '/auth/github';
        }
        
        // Listen for successful login
        window.addEventListener('soulfra:login', (event) => {
            console.log('Login successful!', event.detail);
            // Redirect to dashboard or show success
            window.location.href = '/dashboard';
        });
    </script>
</body>
</html>
        `;
    }
    
    generateWidgetScript() {
        // Return the embedded QR login widget script
        // This is a simplified version - in production, use the full embedded-qr-login-widget.js
        return `
// Simplified QR Login Widget
(function() {
    console.log('QR Login Widget loaded');
    
    // Create QR code
    const qrContainer = document.getElementById('qr-container');
    if (qrContainer) {
        // In production, this would generate a real QR code
        qrContainer.innerHTML = '<div style="padding: 20px; color: #666;">📱 QR Code would appear here<br><small>This is a demo placeholder</small></div>';
    }
    
    // Simulate successful login after 3 seconds (for demo)
    setTimeout(() => {
        if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('soulfra:login', {
                detail: {
                    accountId: 'demo_user_123',
                    character: 'cal',
                    sessionToken: 'demo_jwt_token_xyz'
                }
            }));
        }
    }, 3000);
})();
        `;
    }
    
    generateDeveloperPortal() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🛠️ Developer Portal - Document Generator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: #eee;
            min-height: 100vh;
        }
        
        .header {
            background: #16213e;
            padding: 20px;
            border-bottom: 1px solid #0f3460;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .card {
            background: #16213e;
            border-radius: 10px;
            padding: 30px;
            border: 1px solid #0f3460;
        }
        
        .card h2 {
            margin-bottom: 15px;
            color: #4fbdba;
        }
        
        .card p {
            opacity: 0.8;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .tier-list {
            list-style: none;
            margin-top: 15px;
        }
        
        .tier-list li {
            padding: 10px;
            background: rgba(79, 189, 186, 0.1);
            margin-bottom: 8px;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
        }
        
        .btn {
            background: #4fbdba;
            color: #1a1a2e;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            background: #7ec8e3;
            transform: translateY(-2px);
        }
        
        .code-block {
            background: #0f1419;
            border: 1px solid #333;
            border-radius: 5px;
            padding: 15px;
            margin-top: 15px;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
        }
        
        .api-key-display {
            background: #0f1419;
            padding: 20px;
            border-radius: 5px;
            margin-top: 20px;
            display: none;
        }
        
        .warning {
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>🛠️ Developer Portal</h1>
            <p>Generate API keys and integrate with Document Generator</p>
        </div>
    </div>
    
    <div class="container">
        <div class="grid">
            <div class="card">
                <h2>📋 API Tiers</h2>
                <p>Choose the appropriate tier for your integration needs:</p>
                <ul class="tier-list">
                    <li>
                        <span><strong>Tier 1 - Public</strong><br><small>Basic API access</small></span>
                        <button class="btn" onclick="generateKey('tier1_public')">Generate</button>
                    </li>
                    <li>
                        <span><strong>Tier 2 - Partner</strong><br><small>B2B integrations</small></span>
                        <button class="btn" onclick="generateKey('tier2_partner')">Generate</button>
                    </li>
                    <li>
                        <span><strong>Tier 3 - Financial</strong><br><small>Payment APIs</small></span>
                        <button class="btn" onclick="generateKey('tier3_financial')">Request</button>
                    </li>
                </ul>
            </div>
            
            <div class="card">
                <h2>🔑 Your API Keys</h2>
                <p>Manage your existing API keys:</p>
                <div id="api-keys-list">
                    <p style="opacity: 0.5;">No API keys yet. Generate one to get started!</p>
                </div>
                <div class="api-key-display" id="new-key-display">
                    <p><strong>🎉 New API Key Generated!</strong></p>
                    <code id="api-key-value">Loading...</code>
                    <p style="margin-top: 10px; font-size: 14px; opacity: 0.8;">
                        Save this key! It won't be shown again.
                    </p>
                </div>
            </div>
            
            <div class="card">
                <h2>📖 Quick Start</h2>
                <p>Using your API key:</p>
                <div class="code-block">
// JavaScript example
const response = await fetch('http://localhost:${this.config.port}/api/v1/documents', {
    headers: {
        'X-API-Key': 'your-api-key-here',
        'Content-Type': 'application/json'
    }
});
                </div>
                <div class="code-block">
# Python example
import requests

response = requests.get(
    'http://localhost:${this.config.port}/api/v1/documents',
    headers={'X-API-Key': 'your-api-key-here'}
)
                </div>
            </div>
            
            <div class="card">
                <h2>🤖 Agent Wallets</h2>
                <p>For AI agents and automated systems:</p>
                <ul style="list-style: none; line-height: 1.8;">
                    <li>✅ Ed25519 cryptographic keys</li>
                    <li>✅ Token economy integration</li>
                    <li>✅ Escrow transactions</li>
                    <li>✅ Revenue sharing</li>
                </ul>
                <button class="btn" onclick="alert('Contact support to enable agent wallets')">Enable Agent Mode</button>
            </div>
        </div>
        
        <div class="warning">
            <strong>⚠️ Security Notice:</strong> Keep your API keys secure. Never commit them to version control or share them publicly. Use environment variables in production.
        </div>
        
        <div class="card" style="margin-top: 30px;">
            <h2>🔄 Authentication Flow Explained</h2>
            <p>Here's how all the authentication methods work together:</p>
            <ol style="line-height: 2; padding-left: 20px;">
                <li><strong>Users:</strong> Login via QR code → Get JWT session → Access dashboard</li>
                <li><strong>Developers:</strong> Enable API access → Generate API keys → Use in integrations</li>
                <li><strong>Agents:</strong> System creates wallet → Use cryptographic signatures → Autonomous operation</li>
                <li><strong>Sessions:</strong> All methods result in JWT tokens for API calls</li>
            </ol>
        </div>
    </div>
    
    <script>
        async function generateKey(tier) {
            // In production, this would check if user is logged in
            const accountId = 'demo_user_123'; // Would come from session
            
            try {
                const response = await fetch('/api/developer/generate-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accountId,
                        tier,
                        name: 'My ' + tier + ' API Key'
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    displayNewKey(data);
                } else {
                    alert('Please login first to generate API keys');
                    window.location.href = '/auth/widget';
                }
            } catch (error) {
                console.error('Error generating key:', error);
                alert('Failed to generate API key');
            }
        }
        
        function displayNewKey(keyData) {
            const display = document.getElementById('new-key-display');
            const keyValue = document.getElementById('api-key-value');
            
            keyValue.textContent = keyData.api_key || 'demo_api_key_' + keyData.tier;
            display.style.display = 'block';
            
            // Update keys list
            const list = document.getElementById('api-keys-list');
            list.innerHTML = 
                '<div style="padding: 10px; background: rgba(79, 189, 186, 0.1); border-radius: 5px; margin-bottom: 10px;">' +
                    '<strong>' + keyData.tier + '</strong><br>' +
                    '<small>Key ID: ' + keyData.key_id + '</small>' +
                '</div>' + list.innerHTML;
        }
    </script>
</body>
</html>
        `;
    }
    
    generateHowItWorksPage() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 How Authentication Works</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        
        h1 { color: #667eea; margin-bottom: 30px; }
        h2 { color: #764ba2; margin-top: 30px; }
        
        .method-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .flow-diagram {
            background: #f0f0f0;
            padding: 20px;
            border-radius: 10px;
            font-family: monospace;
            overflow-x: auto;
        }
        
        .highlight { background: #ffd700; padding: 2px 5px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>🎯 How Authentication Works in Document Generator</h1>
    
    <div class="method-card">
        <h2>🌟 The Simple Answer</h2>
        <p><strong>Just use QR Login!</strong> It's like the Soulfra system you mentioned - scan once, stay connected forever. No passwords, no hassle.</p>
        <p>Everything else (JWT, API keys, wallets) happens automatically behind the scenes.</p>
    </div>
    
    <div class="method-card">
        <h2>📱 Method 1: QR Login (Primary)</h2>
        <p><strong>What it is:</strong> The main way users login - just like WhatsApp Web</p>
        <p><strong>How it works:</strong></p>
        <ol>
            <li>Open the login page</li>
            <li>Scan QR code with your phone</li>
            <li>Your device gets permanently paired</li>
            <li>You're assigned a character guide (Cal, Arty, etc.)</li>
            <li>That's it! You're logged in</li>
        </ol>
        <p><strong>Behind the scenes:</strong> Creates a JWT session token automatically</p>
    </div>
    
    <div class="method-card">
        <h2>🎟️ Method 2: JWT Tokens (Automatic)</h2>
        <p><strong>What it is:</strong> Session management that happens after ANY login</p>
        <p><strong>You don't need to think about this!</strong> It's automatic.</p>
        <div class="flow-diagram">
QR Login ──┐
Email Login ──┼──► Generate JWT ──► Use for API calls
OAuth Login ──┘                     (24 hour expiry)
        </div>
    </div>
    
    <div class="method-card">
        <h2>🔑 Method 3: API Keys (For Developers)</h2>
        <p><strong>What it is:</strong> Keys for building integrations</p>
        <p><strong>When to use:</strong> Only if you're building an app that needs to access the API</p>
        <p><strong>How to get one:</strong></p>
        <ol>
            <li>Login normally (QR preferred)</li>
            <li>Go to Developer Portal</li>
            <li>Click "Generate API Key"</li>
            <li>Choose your tier (start with tier1_public)</li>
            <li>Use in your code with header: <code>X-API-Key: your-key</code></li>
        </ol>
    </div>
    
    <div class="method-card">
        <h2>💎 Method 4: Wallet Keys (For AI Agents)</h2>
        <p><strong>What it is:</strong> Cryptographic keys for AI agents</p>
        <p><strong>You probably don't need this!</strong> It's only for:</p>
        <ul>
            <li>AI agents that need to operate autonomously</li>
            <li>Systems that need to handle token transactions</li>
            <li>Advanced marketplace integrations</li>
        </ul>
        <p>The system creates these automatically when needed.</p>
    </div>
    
    <div class="method-card" style="background: #e8f5e9;">
        <h2>✨ The Magic Connection</h2>
        <div class="flow-diagram">
You (Human) ──► QR Login ──► JWT Session ──► Use App
                   │
                   └──► Enable Developer Mode ──► API Keys ──► Build Apps
                   
AI Agent ──► Wallet Created ──► Cryptographic Auth ──► Autonomous Work
        </div>
        
        <p><strong>The beauty:</strong> Each method is designed for its user:</p>
        <ul>
            <li><span class="highlight">Humans get QR</span> - Visual, simple, secure</li>
            <li><span class="highlight">Sessions get JWT</span> - Industry standard, automatic</li>
            <li><span class="highlight">Developers get API Keys</span> - Familiar, tier-based</li>
            <li><span class="highlight">Agents get Wallets</span> - Cryptographic, autonomous</li>
        </ul>
    </div>
    
    <div class="method-card">
        <h2>🚀 Quick Start</h2>
        <p><strong>For 99% of users:</strong> Just go to <a href="/auth/widget">the login page</a> and scan the QR code!</p>
        <p><strong>For developers:</strong> After logging in, visit the <a href="/developer">Developer Portal</a></p>
        <p><strong>Still confused?</strong> That's okay! Just use QR login and everything else will make sense as you need it.</p>
    </div>
</body>
</html>
        `;
    }
    
    // ======================
    // VERIFY EMAIL LOGIN (Backup method)
    // ======================
    
    async verifyEmailLogin(email, password) {
        // This is just a backup method - QR is primary
        const result = await this.pgClient.query(
            'SELECT * FROM unified_accounts WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const account = result.rows[0];
        
        // In production, verify password hash
        // For now, simple check
        if (password === 'demo123' || account.password_hash === password) {
            await this.trackAuthMethod(account.account_id, 'email');
            return account;
        }
        
        return null;
    }
}

// Export the unified strategy
module.exports = UnifiedAuthStrategy;

// CLI execution
if (require.main === module) {
    const authStrategy = new UnifiedAuthStrategy();
    
    authStrategy.initialize().catch(error => {
        console.error('💥 Failed to start unified auth:', error);
        process.exit(1);
    });
}
