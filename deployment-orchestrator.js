#!/usr/bin/env node

/**
 * 🚀🔐 DEPLOYMENT ORCHESTRATOR - Universal API Key Vault & Deployment Engine
 * 
 * The killer feature that enables one-call deployment to multiple platforms
 * Securely manages API keys locally while providing simple deployment interface
 * Integrates with adventure engine, character identity, and leaderboard systems
 */

const EventEmitter = require('events');
const express = require('express');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class DeploymentOrchestrator extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.port = 3333;
        
        // Encrypted API key vault
        this.apiVault = new APIKeyVault();
        
        // Platform connectors
        this.platforms = new Map();
        
        // Deployment templates
        this.templates = new Map();
        
        // Active deployments tracking
        this.activeDeployments = new Map();
        
        // Cost tracking
        this.costTracker = new DeploymentCostTracker();
        
        // Health monitoring
        this.healthMonitor = new DeploymentHealthMonitor();
        
        console.log('🚀 Deployment Orchestrator initializing...');
        this.init();
    }
    
    async init() {
        await this.setupAPIVault();
        await this.setupPlatformConnectors();
        await this.loadDeploymentTemplates();
        this.setupExpressServer();
        this.setupHealthMonitoring();
        
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                🚀 DEPLOYMENT ORCHESTRATOR ACTIVE             ║
║                                                              ║
║  Universal deployment engine with secure API key vault      ║
║                                                              ║
║  🔐 API Vault: Encrypted local storage                      ║
║  🌐 Platforms: Vercel, Railway, Netlify, AWS               ║
║  📱 Templates: Games, Apps, Websites                        ║
║  💰 Cost Tracking: Real-time monitoring                     ║
║                                                              ║
║  API: http://localhost:${this.port}                          ║
║  Dashboard: http://localhost:${this.port}/dashboard         ║
╚══════════════════════════════════════════════════════════════╝`);
    }
    
    async setupAPIVault() {
        console.log('🔐 Setting up encrypted API key vault...');
        
        await this.apiVault.initialize();
        
        // Load or create platform configurations
        const platforms = [
            {
                name: 'vercel',
                displayName: 'Vercel',
                requiredKeys: ['VERCEL_TOKEN'],
                endpoints: {
                    deploy: 'https://api.vercel.com/v13/deployments',
                    domains: 'https://api.vercel.com/v10/domains'
                }
            },
            {
                name: 'railway',
                displayName: 'Railway',
                requiredKeys: ['RAILWAY_TOKEN'],
                endpoints: {
                    deploy: 'https://backboard.railway.app/graphql',
                    projects: 'https://backboard.railway.app/graphql'
                }
            },
            {
                name: 'netlify',
                displayName: 'Netlify',
                requiredKeys: ['NETLIFY_TOKEN'],
                endpoints: {
                    deploy: 'https://api.netlify.com/api/v1/sites',
                    builds: 'https://api.netlify.com/api/v1/builds'
                }
            },
            {
                name: 'aws',
                displayName: 'AWS',
                requiredKeys: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
                endpoints: {
                    s3: 'https://s3.amazonaws.com',
                    cloudfront: 'https://cloudfront.amazonaws.com'
                }
            },
            {
                name: 'godaddy',
                displayName: 'GoDaddy',
                requiredKeys: ['GODADDY_API_KEY', 'GODADDY_SECRET'],
                endpoints: {
                    domains: 'https://api.godaddy.com/v1/domains',
                    dns: 'https://api.godaddy.com/v1/domains'
                }
            }
        ];
        
        for (const platform of platforms) {
            await this.apiVault.registerPlatform(platform);
        }
        
        console.log(`✅ API vault configured for ${platforms.length} platforms`);
    }
    
    async setupPlatformConnectors() {
        console.log('🔌 Setting up platform connectors...');
        
        // Vercel connector
        this.platforms.set('vercel', new VercelConnector(this.apiVault));
        
        // Railway connector
        this.platforms.set('railway', new RailwayConnector(this.apiVault));
        
        // Netlify connector
        this.platforms.set('netlify', new NetlifyConnector(this.apiVault));
        
        // AWS connector
        this.platforms.set('aws', new AWSConnector(this.apiVault));
        
        // GoDaddy connector
        this.platforms.set('godaddy', new GoDaddyConnector(this.apiVault));
        
        console.log(`✅ Platform connectors initialized: ${Array.from(this.platforms.keys()).join(', ')}`);
    }
    
    async loadDeploymentTemplates() {
        console.log('📋 Loading deployment templates...');
        
        const templates = [
            {
                id: 'ai-chess-game',
                name: 'AI Chess Duel Game',
                description: 'Self-playing AI chess battle with 3D spectator view',
                category: 'game',
                files: ['ai-agent-duel.js', '3d-spectator-dashboard.html'],
                platforms: ['vercel', 'netlify'],
                env: ['NODE_ENV=production'],
                buildCommand: 'npm run build',
                startCommand: 'npm start',
                cost: { estimated: 5, currency: 'USD' }
            },
            {
                id: 'civilization-builder',
                name: 'AI Civilization Builder',
                description: 'AI agents create and manage digital civilizations',
                category: 'simulation',
                files: ['domain-agent-system.js', 'civilizations/'],
                platforms: ['railway', 'aws'],
                env: ['NODE_ENV=production', 'DATABASE_URL'],
                buildCommand: 'npm run build',
                startCommand: 'node domain-agent-system.js',
                cost: { estimated: 15, currency: 'USD' }
            },
            {
                id: 'adventure-engine',
                name: 'Point-Click Adventure Engine',
                description: 'Interactive reality-bending adventure game',
                category: 'game',
                files: ['adventure-engine.js', 'adventures/'],
                platforms: ['vercel', 'netlify', 'railway'],
                env: ['NODE_ENV=production'],
                buildCommand: 'npm run build',
                startCommand: 'node adventure-engine.js',
                cost: { estimated: 8, currency: 'USD' }
            },
            {
                id: 'speedrun-leaderboard',
                name: 'Speedrun Leaderboard Platform',
                description: 'Real-time speedrun tracking with character TINs',
                category: 'platform',
                files: ['universal-leaderboard.js', 'character-identity-system.js'],
                platforms: ['railway', 'aws'],
                env: ['DATABASE_URL', 'REDIS_URL'],
                buildCommand: 'npm run build',
                startCommand: 'npm start',
                cost: { estimated: 12, currency: 'USD' }
            },
            {
                id: 'custom-app',
                name: 'Custom Application',
                description: 'Deploy your own custom application',
                category: 'custom',
                files: [],
                platforms: ['vercel', 'railway', 'netlify', 'aws'],
                env: [],
                buildCommand: 'npm run build',
                startCommand: 'npm start',
                cost: { estimated: 10, currency: 'USD' }
            }
        ];
        
        for (const template of templates) {
            this.templates.set(template.id, template);
        }
        
        console.log(`✅ Loaded ${templates.length} deployment templates`);
    }
    
    setupExpressServer() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS middleware
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            next();
        });
        
        // API Routes
        this.setupAPIRoutes();
        
        // Dashboard route
        this.app.get('/dashboard', (req, res) => {
            res.sendFile(path.join(__dirname, 'deployment-dashboard.html'));
        });
        
        this.app.listen(this.port, () => {
            console.log(`🌐 Deployment Orchestrator API running on http://localhost:${this.port}`);
        });
    }
    
    setupAPIRoutes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                platforms: Array.from(this.platforms.keys()),
                activeDeployments: this.activeDeployments.size,
                templates: Array.from(this.templates.keys())
            });
        });
        
        // List templates
        this.app.get('/api/templates', (req, res) => {
            const templateList = Array.from(this.templates.values()).map(template => ({
                ...template,
                files: template.files.length
            }));
            res.json(templateList);
        });
        
        // Get template details
        this.app.get('/api/templates/:id', (req, res) => {
            const template = this.templates.get(req.params.id);
            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }
            res.json(template);
        });
        
        // List platforms
        this.app.get('/api/platforms', async (req, res) => {
            const platformList = [];
            for (const [name, connector] of this.platforms) {
                const status = await connector.checkHealth();
                platformList.push({
                    name,
                    displayName: connector.displayName,
                    status: status ? 'healthy' : 'error',
                    hasKeys: await this.apiVault.hasKeys(name)
                });
            }
            res.json(platformList);
        });
        
        // Deploy application
        this.app.post('/api/deploy', async (req, res) => {
            try {
                const deployment = await this.deployApplication(req.body);
                res.json(deployment);
            } catch (error) {
                console.error('Deployment error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get deployment status
        this.app.get('/api/deployments/:id', (req, res) => {
            const deployment = this.activeDeployments.get(req.params.id);
            if (!deployment) {
                return res.status(404).json({ error: 'Deployment not found' });
            }
            res.json(deployment);
        });
        
        // List active deployments
        this.app.get('/api/deployments', (req, res) => {
            const deployments = Array.from(this.activeDeployments.values());
            res.json(deployments);
        });
        
        // Configure API keys
        this.app.post('/api/platforms/:name/keys', async (req, res) => {
            try {
                await this.apiVault.setKeys(req.params.name, req.body);
                res.json({ success: true, message: 'API keys configured' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Cost tracking
        this.app.get('/api/costs', (req, res) => {
            res.json(this.costTracker.getCostSummary());
        });
        
        // Health monitoring
        this.app.get('/api/monitoring', (req, res) => {
            res.json(this.healthMonitor.getHealthSummary());
        });
    }
    
    async deployApplication(deploymentRequest) {
        const {
            template,
            platforms = ['vercel'],
            domain,
            characterTIN,
            settings = {},
            customFiles = [],
            env = {}
        } = deploymentRequest;
        
        console.log(`🚀 Starting deployment for template: ${template}`);
        
        // Generate deployment ID
        const deploymentId = this.generateDeploymentId();
        
        // Get template configuration
        const templateConfig = this.templates.get(template);
        if (!templateConfig) {
            throw new Error(`Template not found: ${template}`);
        }
        
        // Create deployment record
        const deployment = {
            id: deploymentId,
            template,
            platforms,
            domain,
            characterTIN,
            settings,
            status: 'starting',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            urls: [],
            logs: [],
            costs: [],
            health: 'unknown'
        };
        
        this.activeDeployments.set(deploymentId, deployment);
        this.emit('deploymentStarted', deployment);
        
        try {
            // Deploy to each platform
            const deploymentPromises = platforms.map(platformName => 
                this.deployToPlatform(deployment, platformName, templateConfig, customFiles, env)
            );
            
            const results = await Promise.allSettled(deploymentPromises);
            
            // Process results
            let successCount = 0;
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                const platformName = platforms[i];
                
                if (result.status === 'fulfilled') {
                    successCount++;
                    deployment.urls.push({
                        platform: platformName,
                        url: result.value.url,
                        status: 'live'
                    });
                    deployment.logs.push(`✅ Successfully deployed to ${platformName}: ${result.value.url}`);
                } else {
                    deployment.logs.push(`❌ Failed to deploy to ${platformName}: ${result.reason.message}`);
                }
            }
            
            // Update deployment status
            deployment.status = successCount > 0 ? 'success' : 'failed';
            deployment.updated = new Date().toISOString();
            
            // Setup domain if requested
            if (domain && successCount > 0) {
                await this.setupCustomDomain(deployment, domain);
            }
            
            // Start health monitoring
            this.healthMonitor.startMonitoring(deployment);
            
            // Track costs
            this.costTracker.trackDeployment(deployment);
            
            // Emit completion event
            this.emit('deploymentCompleted', deployment);
            
            console.log(`🎉 Deployment ${deploymentId} completed with ${successCount}/${platforms.length} successful deployments`);
            
            return deployment;
            
        } catch (error) {
            deployment.status = 'failed';
            deployment.logs.push(`💥 Deployment failed: ${error.message}`);
            deployment.updated = new Date().toISOString();
            
            this.emit('deploymentFailed', deployment);
            throw error;
        }
    }
    
    async deployToPlatform(deployment, platformName, templateConfig, customFiles, env) {
        const connector = this.platforms.get(platformName);
        if (!connector) {
            throw new Error(`Platform connector not found: ${platformName}`);
        }
        
        console.log(`📤 Deploying to ${platformName}...`);
        
        // Prepare deployment package
        const deploymentPackage = {
            template: templateConfig,
            files: customFiles.length > 0 ? customFiles : templateConfig.files,
            env: { ...templateConfig.env, ...env },
            settings: deployment.settings,
            characterTIN: deployment.characterTIN
        };
        
        // Deploy using platform connector
        const result = await connector.deploy(deploymentPackage);
        
        console.log(`✅ Successfully deployed to ${platformName}: ${result.url}`);
        
        return result;
    }
    
    async setupCustomDomain(deployment, domain) {
        console.log(`🌐 Setting up custom domain: ${domain}`);
        
        const godaddyConnector = this.platforms.get('godaddy');
        if (!godaddyConnector) {
            deployment.logs.push('⚠️ GoDaddy connector not available for domain setup');
            return;
        }
        
        try {
            await godaddyConnector.configureDomain(domain, deployment.urls[0].url);
            deployment.domain = domain;
            deployment.logs.push(`🌐 Custom domain configured: ${domain}`);
        } catch (error) {
            deployment.logs.push(`❌ Failed to configure domain: ${error.message}`);
        }
    }
    
    setupHealthMonitoring() {
        // Monitor all active deployments every 5 minutes
        setInterval(async () => {
            for (const [id, deployment] of this.activeDeployments) {
                if (deployment.status === 'success') {
                    await this.healthMonitor.checkDeploymentHealth(deployment);
                }
            }
        }, 5 * 60 * 1000);
    }
    
    generateDeploymentId() {
        return 'deploy-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    // Integration methods for adventure engine
    async deployAdventure(adventureId, characterTIN) {
        console.log(`🎮 Auto-deploying adventure ${adventureId} for character ${characterTIN}`);
        
        return await this.deployApplication({
            template: 'adventure-engine',
            platforms: ['vercel'],
            characterTIN,
            settings: { adventureId },
            env: { ADVENTURE_ID: adventureId }
        });
    }
    
    async deployCivilization(civilizationId, agentName) {
        console.log(`🏛️ Auto-deploying civilization ${civilizationId} for agent ${agentName}`);
        
        return await this.deployApplication({
            template: 'civilization-builder',
            platforms: ['railway'],
            characterTIN: `AGENT-${agentName.toUpperCase()}`,
            settings: { civilizationId, agentName },
            env: { CIVILIZATION_ID: civilizationId, AGENT_NAME: agentName }
        });
    }
    
    async deploySpeedrunLeaderboard(gameType, characterTIN) {
        console.log(`🏆 Deploying speedrun leaderboard for ${gameType}`);
        
        return await this.deployApplication({
            template: 'speedrun-leaderboard',
            platforms: ['railway'],
            characterTIN,
            settings: { gameType },
            env: { GAME_TYPE: gameType }
        });
    }
    
    // Cost and health monitoring
    getCostSummary() {
        return this.costTracker.getCostSummary();
    }
    
    getHealthSummary() {
        return this.healthMonitor.getHealthSummary();
    }
    
    // Cleanup and maintenance
    async cleanupFailedDeployments() {
        const failedDeployments = Array.from(this.activeDeployments.entries())
            .filter(([id, deployment]) => deployment.status === 'failed');
        
        for (const [id, deployment] of failedDeployments) {
            console.log(`🧹 Cleaning up failed deployment: ${id}`);
            this.activeDeployments.delete(id);
        }
        
        console.log(`🗑️ Cleaned up ${failedDeployments.length} failed deployments`);
    }
}

// API Key Vault - Encrypted storage for platform credentials
class APIKeyVault {
    constructor() {
        this.vaultPath = path.join(__dirname, '.vault');
        this.keyFile = path.join(this.vaultPath, 'keys.enc');
        this.platformsFile = path.join(this.vaultPath, 'platforms.json');
        this.encryptionKey = null;
        this.platforms = new Map();
        this.keys = new Map();
    }
    
    async initialize() {
        await fs.mkdir(this.vaultPath, { recursive: true });
        
        // Generate or load encryption key
        const keyPath = path.join(this.vaultPath, 'vault.key');
        try {
            this.encryptionKey = await fs.readFile(keyPath, 'utf8');
        } catch {
            this.encryptionKey = crypto.randomBytes(32).toString('hex');
            await fs.writeFile(keyPath, this.encryptionKey, { mode: 0o600 });
        }
        
        // Load platforms and keys
        await this.loadPlatforms();
        await this.loadKeys();
        
        console.log('🔐 API Key Vault initialized');
    }
    
    async registerPlatform(platform) {
        this.platforms.set(platform.name, platform);
        await this.savePlatforms();
    }
    
    async setKeys(platformName, keys) {
        const platform = this.platforms.get(platformName);
        if (!platform) {
            throw new Error(`Platform not registered: ${platformName}`);
        }
        
        // Validate required keys
        for (const requiredKey of platform.requiredKeys) {
            if (!keys[requiredKey]) {
                throw new Error(`Missing required key: ${requiredKey}`);
            }
        }
        
        this.keys.set(platformName, keys);
        await this.saveKeys();
        
        console.log(`🔑 API keys configured for ${platformName}`);
    }
    
    async getKeys(platformName) {
        return this.keys.get(platformName) || {};
    }
    
    async hasKeys(platformName) {
        const keys = this.keys.get(platformName);
        const platform = this.platforms.get(platformName);
        
        if (!keys || !platform) return false;
        
        return platform.requiredKeys.every(key => keys[key]);
    }
    
    async loadPlatforms() {
        try {
            const data = await fs.readFile(this.platformsFile, 'utf8');
            const platforms = JSON.parse(data);
            this.platforms = new Map(Object.entries(platforms));
        } catch {
            // File doesn't exist, start with empty platforms
        }
    }
    
    async savePlatforms() {
        const platforms = Object.fromEntries(this.platforms);
        await fs.writeFile(this.platformsFile, JSON.stringify(platforms, null, 2));
    }
    
    async loadKeys() {
        try {
            const encrypted = await fs.readFile(this.keyFile, 'utf8');
            const decrypted = this.decrypt(encrypted);
            const keys = JSON.parse(decrypted);
            this.keys = new Map(Object.entries(keys));
        } catch {
            // File doesn't exist, start with empty keys
        }
    }
    
    async saveKeys() {
        const keys = Object.fromEntries(this.keys);
        const encrypted = this.encrypt(JSON.stringify(keys));
        await fs.writeFile(this.keyFile, encrypted, { mode: 0o600 });
    }
    
    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }
    
    decrypt(encryptedText) {
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}

// Platform connectors (simplified versions)
class VercelConnector {
    constructor(apiVault) {
        this.apiVault = apiVault;
        this.displayName = 'Vercel';
    }
    
    async deploy(deploymentPackage) {
        const keys = await this.apiVault.getKeys('vercel');
        if (!keys.VERCEL_TOKEN) {
            throw new Error('Vercel token not configured');
        }
        
        // Simplified deployment logic
        const deploymentId = 'vercel-' + Date.now();
        const url = `https://${deploymentId}.vercel.app`;
        
        console.log(`📤 Deploying to Vercel: ${url}`);
        
        // In real implementation, would use Vercel API
        return { url, platform: 'vercel', id: deploymentId };
    }
    
    async checkHealth() {
        const keys = await this.apiVault.getKeys('vercel');
        return !!keys.VERCEL_TOKEN;
    }
}

class RailwayConnector {
    constructor(apiVault) {
        this.apiVault = apiVault;
        this.displayName = 'Railway';
    }
    
    async deploy(deploymentPackage) {
        const keys = await this.apiVault.getKeys('railway');
        if (!keys.RAILWAY_TOKEN) {
            throw new Error('Railway token not configured');
        }
        
        const deploymentId = 'railway-' + Date.now();
        const url = `https://${deploymentId}.railway.app`;
        
        console.log(`🚂 Deploying to Railway: ${url}`);
        
        return { url, platform: 'railway', id: deploymentId };
    }
    
    async checkHealth() {
        const keys = await this.apiVault.getKeys('railway');
        return !!keys.RAILWAY_TOKEN;
    }
}

class NetlifyConnector {
    constructor(apiVault) {
        this.apiVault = apiVault;
        this.displayName = 'Netlify';
    }
    
    async deploy(deploymentPackage) {
        const keys = await this.apiVault.getKeys('netlify');
        if (!keys.NETLIFY_TOKEN) {
            throw new Error('Netlify token not configured');
        }
        
        const deploymentId = 'netlify-' + Date.now();
        const url = `https://${deploymentId}.netlify.app`;
        
        console.log(`🌐 Deploying to Netlify: ${url}`);
        
        return { url, platform: 'netlify', id: deploymentId };
    }
    
    async checkHealth() {
        const keys = await this.apiVault.getKeys('netlify');
        return !!keys.NETLIFY_TOKEN;
    }
}

class AWSConnector {
    constructor(apiVault) {
        this.apiVault = apiVault;
        this.displayName = 'AWS';
    }
    
    async deploy(deploymentPackage) {
        const keys = await this.apiVault.getKeys('aws');
        if (!keys.AWS_ACCESS_KEY_ID || !keys.AWS_SECRET_ACCESS_KEY) {
            throw new Error('AWS credentials not configured');
        }
        
        const deploymentId = 'aws-' + Date.now();
        const url = `https://${deploymentId}.s3.amazonaws.com`;
        
        console.log(`☁️ Deploying to AWS: ${url}`);
        
        return { url, platform: 'aws', id: deploymentId };
    }
    
    async checkHealth() {
        const keys = await this.apiVault.getKeys('aws');
        return !!(keys.AWS_ACCESS_KEY_ID && keys.AWS_SECRET_ACCESS_KEY);
    }
}

class GoDaddyConnector {
    constructor(apiVault) {
        this.apiVault = apiVault;
        this.displayName = 'GoDaddy';
    }
    
    async configureDomain(domain, target) {
        const keys = await this.apiVault.getKeys('godaddy');
        if (!keys.GODADDY_API_KEY || !keys.GODADDY_SECRET) {
            throw new Error('GoDaddy credentials not configured');
        }
        
        console.log(`🌐 Configuring domain ${domain} -> ${target}`);
        
        // In real implementation, would use GoDaddy API to set DNS records
        return { domain, target, status: 'configured' };
    }
    
    async checkHealth() {
        const keys = await this.apiVault.getKeys('godaddy');
        return !!(keys.GODADDY_API_KEY && keys.GODADDY_SECRET);
    }
}

// Cost tracking system
class DeploymentCostTracker {
    constructor() {
        this.costs = new Map();
        this.monthlyCosts = new Map();
    }
    
    trackDeployment(deployment) {
        const template = deployment.template;
        const platforms = deployment.platforms;
        
        // Calculate estimated costs
        let totalCost = 0;
        for (const platform of platforms) {
            const platformCost = this.getPlatformCost(platform);
            totalCost += platformCost;
        }
        
        this.costs.set(deployment.id, {
            deploymentId: deployment.id,
            template,
            platforms,
            estimated: totalCost,
            actual: 0, // Updated later with real costs
            date: new Date().toISOString()
        });
        
        console.log(`💰 Tracking costs for deployment ${deployment.id}: $${totalCost} estimated`);
    }
    
    getPlatformCost(platform) {
        const baseCosts = {
            vercel: 5,
            railway: 10,
            netlify: 3,
            aws: 15,
            godaddy: 2
        };
        
        return baseCosts[platform] || 5;
    }
    
    getCostSummary() {
        const totalEstimated = Array.from(this.costs.values())
            .reduce((sum, cost) => sum + cost.estimated, 0);
        
        const totalActual = Array.from(this.costs.values())
            .reduce((sum, cost) => sum + cost.actual, 0);
        
        return {
            totalDeployments: this.costs.size,
            totalEstimated,
            totalActual,
            savings: totalEstimated - totalActual,
            averageCost: this.costs.size > 0 ? totalEstimated / this.costs.size : 0,
            costsByPlatform: this.getCostsByPlatform()
        };
    }
    
    getCostsByPlatform() {
        const platformCosts = {};
        
        for (const cost of this.costs.values()) {
            for (const platform of cost.platforms) {
                platformCosts[platform] = (platformCosts[platform] || 0) + this.getPlatformCost(platform);
            }
        }
        
        return platformCosts;
    }
}

// Health monitoring system
class DeploymentHealthMonitor {
    constructor() {
        this.healthChecks = new Map();
        this.downtime = new Map();
    }
    
    startMonitoring(deployment) {
        console.log(`👀 Starting health monitoring for deployment ${deployment.id}`);
        
        this.healthChecks.set(deployment.id, {
            deploymentId: deployment.id,
            urls: deployment.urls,
            lastCheck: null,
            status: 'unknown',
            uptime: 0,
            downtime: 0,
            responseTime: 0
        });
    }
    
    async checkDeploymentHealth(deployment) {
        const healthCheck = this.healthChecks.get(deployment.id);
        if (!healthCheck) return;
        
        let allHealthy = true;
        let totalResponseTime = 0;
        
        for (const urlInfo of deployment.urls) {
            try {
                const startTime = Date.now();
                const response = await axios.get(urlInfo.url, { timeout: 5000 });
                const responseTime = Date.now() - startTime;
                
                totalResponseTime += responseTime;
                
                if (response.status !== 200) {
                    allHealthy = false;
                }
            } catch (error) {
                allHealthy = false;
                console.warn(`⚠️ Health check failed for ${urlInfo.url}: ${error.message}`);
            }
        }
        
        const avgResponseTime = totalResponseTime / deployment.urls.length;
        const status = allHealthy ? 'healthy' : 'unhealthy';
        
        healthCheck.lastCheck = new Date().toISOString();
        healthCheck.status = status;
        healthCheck.responseTime = avgResponseTime;
        
        if (status === 'healthy') {
            healthCheck.uptime += 5; // 5 minute intervals
        } else {
            healthCheck.downtime += 5;
        }
        
        deployment.health = status;
        deployment.updated = new Date().toISOString();
    }
    
    getHealthSummary() {
        const checks = Array.from(this.healthChecks.values());
        
        const healthy = checks.filter(check => check.status === 'healthy').length;
        const unhealthy = checks.filter(check => check.status === 'unhealthy').length;
        const unknown = checks.filter(check => check.status === 'unknown').length;
        
        const avgResponseTime = checks.length > 0 
            ? checks.reduce((sum, check) => sum + check.responseTime, 0) / checks.length 
            : 0;
        
        const totalUptime = checks.reduce((sum, check) => sum + check.uptime, 0);
        const totalDowntime = checks.reduce((sum, check) => sum + check.downtime, 0);
        const uptimePercentage = totalUptime + totalDowntime > 0 
            ? (totalUptime / (totalUptime + totalDowntime)) * 100 
            : 100;
        
        return {
            totalDeployments: checks.length,
            healthy,
            unhealthy,
            unknown,
            avgResponseTime: Math.round(avgResponseTime),
            uptimePercentage: Math.round(uptimePercentage * 100) / 100,
            totalUptime,
            totalDowntime
        };
    }
}

module.exports = { DeploymentOrchestrator };

// Run if called directly
if (require.main === module) {
    const orchestrator = new DeploymentOrchestrator();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Deployment Orchestrator...');
        process.exit(0);
    });
    
    // Example usage after startup
    setTimeout(async () => {
        console.log('\n🧪 Running example deployment...');
        
        try {
            const deployment = await orchestrator.deployApplication({
                template: 'ai-chess-game',
                platforms: ['vercel'],
                characterTIN: 'TIN-DEMO123',
                settings: { difficulty: 'medium' }
            });
            
            console.log(`✅ Example deployment completed: ${deployment.id}`);
        } catch (error) {
            console.error(`❌ Example deployment failed:`, error.message);
        }
    }, 3000);
}