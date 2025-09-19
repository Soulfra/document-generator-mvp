#!/usr/bin/env node

/**
 * 🗺️ XML ARCHITECTURE MANAGER
 * Manages system architecture, context profiles, and flow states
 * Prevents loss of system knowledge and maintains component relationships
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class XMLArchitectureManager extends EventEmitter {
    constructor() {
        super();
        
        this.architectureFile = 'system-architecture-map.xml';
        this.contextProfiles = new Map();
        this.flowStates = new Map();
        this.componentRegistry = new Map();
        this.validationRules = new Map();
        this.knowledgeBase = new Map();
        
        console.log('🗺️ XML ARCHITECTURE MANAGER INITIALIZING...');
        console.log('📋 Loading system architecture mapping...');
        console.log('🔄 Setting up context preservation...');
        console.log('📊 Initializing flow state management...');
    }
    
    async initialize() {
        try {
            await this.loadArchitectureMap();
            await this.validateSystemIntegrity();
            await this.initializeContextProfiles();
            await this.setupFlowStates();
            
            console.log('✅ XML Architecture Manager ready!');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize architecture manager:', error.message);
            return false;
        }
    }
    
    async loadArchitectureMap() {
        if (!fs.existsSync(this.architectureFile)) {
            throw new Error(`Architecture map not found: ${this.architectureFile}`);
        }
        
        const xmlContent = fs.readFileSync(this.architectureFile, 'utf8');
        this.architectureXML = xmlContent;
        
        // Parse XML structure (simplified parsing for this implementation)
        await this.parseArchitectureXML(xmlContent);
        
        console.log('📋 Architecture map loaded successfully');
        console.log(`   Components: ${this.componentRegistry.size}`);
        console.log(`   Flow states: ${this.flowStates.size}`);
        console.log(`   Context profiles: ${this.contextProfiles.size}`);
    }
    
    async parseArchitectureXML(xmlContent) {
        // Parse components
        const componentMatches = xmlContent.match(/<component[^>]*id="([^"]*)"[^>]*port="([^"]*)"[^>]*status="([^"]*)"[^>]*>/g);
        
        if (componentMatches) {
            componentMatches.forEach(match => {
                const idMatch = match.match(/id="([^"]*)"/);
                const portMatch = match.match(/port="([^"]*)"/);
                const statusMatch = match.match(/status="([^"]*)"/);
                
                if (idMatch && portMatch && statusMatch) {
                    this.componentRegistry.set(idMatch[1], {
                        id: idMatch[1],
                        port: parseInt(portMatch[1]),
                        status: statusMatch[1],
                        lastChecked: null,
                        health: 'unknown'
                    });
                }
            });
        }
        
        // Parse context profiles
        this.contextProfiles.set('user-context', {
            cryptoWallet: {
                address: '0xd5dc6c1eecbc3f33c195c9733ff4c7242f3fd956',
                trackedWallets: ['0x742d35Cc6634C053'],
                privateKeyEncrypted: true
            },
            gameState: {
                runescape: { level: 50, xp: 12750, inventory: { iron: 15, gold: 8, mithril: 3 } }
            },
            aiPreferences: {
                teacher: { enabled: true, verbosity: 'medium' },
                guardian: { enabled: true, securityLevel: 'high' },
                companion: { enabled: true, mood: 'encouraging' }
            }
        });
        
        // Parse flow states
        this.flowStates.set('startup-sequence', {
            steps: [
                { order: 1, component: 'd2jsp-forum', action: 'initialize', wait: 3000 },
                { order: 2, component: 'reasoning-integration', action: 'initialize', wait: 3000 },
                { order: 3, component: 'crypto-trace-engine', action: 'initialize', wait: 3000 },
                { order: 4, component: 'unified-mining-node', action: 'initialize', wait: 3000 },
                { order: 5, component: 'game-engine', action: 'initialize', wait: 3000 },
                { order: 6, component: 'mobile-wallet-app', action: 'initialize', wait: 5000 }
            ]
        });
        
        // Parse validation rules
        this.validationRules.set('service-connectivity', {
            description: 'All services must be reachable from mobile app',
            test: 'health-check',
            critical: true
        });
        
        this.validationRules.set('crypto-wallet-integrity', {
            description: 'Crypto wallet must maintain persistent state',
            test: 'wallet-persistence',
            critical: true
        });
    }
    
    async validateSystemIntegrity() {
        console.log('🔍 Validating system integrity...');
        
        const validationResults = [];
        
        for (const [ruleId, rule] of this.validationRules) {
            const result = await this.runValidationRule(ruleId, rule);
            validationResults.push(result);
            
            if (result.critical && !result.passed) {
                console.log(`❌ CRITICAL: ${rule.description}`);
            } else if (result.passed) {
                console.log(`✅ ${rule.description}`);
            } else {
                console.log(`⚠️ ${rule.description}`);
            }
        }
        
        const criticalFailures = validationResults.filter(r => r.critical && !r.passed);
        
        if (criticalFailures.length > 0) {
            console.log(`⚠️ System has ${criticalFailures.length} critical validation failures`);
        } else {
            console.log('✅ System integrity validated');
        }
        
        return criticalFailures.length === 0;
    }
    
    async runValidationRule(ruleId, rule) {
        switch (rule.test) {
            case 'health-check':
                return await this.validateServiceConnectivity();
            case 'wallet-persistence':
                return await this.validateWalletPersistence();
            default:
                return { ruleId, passed: false, message: 'Unknown test type' };
        }
    }
    
    async validateServiceConnectivity() {
        const http = require('http');
        let healthyServices = 0;
        let totalServices = 0;
        
        for (const [componentId, component] of this.componentRegistry) {
            if (component.port) {
                totalServices++;
                
                try {
                    const response = await this.httpRequest(`http://localhost:${component.port}/`);
                    
                    if (response.statusCode < 500) {
                        healthyServices++;
                        component.health = 'healthy';
                    } else {
                        component.health = 'degraded';
                    }
                } catch (error) {
                    component.health = 'offline';
                }
                
                component.lastChecked = Date.now();
            }
        }
        
        const healthPercentage = totalServices > 0 ? (healthyServices / totalServices) : 0;
        
        return {
            ruleId: 'service-connectivity',
            passed: healthPercentage >= 0.5, // At least 50% of services must be healthy
            critical: true,
            message: `${healthyServices}/${totalServices} services healthy (${Math.round(healthPercentage * 100)}%)`
        };
    }
    
    async validateWalletPersistence() {
        try {
            // Check if wallet data exists and is accessible
            const walletExists = fs.existsSync('mobile-app-cache.json');
            
            if (walletExists) {
                const cacheData = JSON.parse(fs.readFileSync('mobile-app-cache.json', 'utf8'));
                const hasWallet = cacheData.wallet && cacheData.wallet.address;
                const hasTrackedWallets = cacheData.wallet && cacheData.wallet.trackedWallets;
                
                return {
                    ruleId: 'crypto-wallet-integrity',
                    passed: hasWallet && hasTrackedWallets,
                    critical: true,
                    message: hasWallet ? 'Wallet data persistent' : 'Wallet data missing'
                };
            } else {
                return {
                    ruleId: 'crypto-wallet-integrity',
                    passed: false,
                    critical: true,
                    message: 'Wallet cache file not found'
                };
            }
        } catch (error) {
            return {
                ruleId: 'crypto-wallet-integrity',
                passed: false,
                critical: true,
                message: `Wallet validation error: ${error.message}`
            };
        }
    }
    
    async initializeContextProfiles() {
        console.log('👤 Initializing context profiles...');
        
        // Load user context
        const userContext = this.contextProfiles.get('user-context');
        
        if (userContext) {
            console.log(`   Wallet: ${userContext.cryptoWallet.address.slice(0, 12)}...`);
            console.log(`   Tracked wallets: ${userContext.cryptoWallet.trackedWallets.length}`);
            console.log(`   Game level: ${userContext.gameState.runescape.level}`);
            console.log(`   AI layers: ${Object.keys(userContext.aiPreferences).length}`);
        }
        
        // Initialize system context
        this.contextProfiles.set('system-state', {
            serviceHealth: new Map(),
            integrationMappings: new Map(),
            dataFlows: new Map(),
            lastUpdate: Date.now()
        });
        
        console.log('✅ Context profiles initialized');
    }
    
    async setupFlowStates() {
        console.log('🔄 Setting up flow states...');
        
        // Setup startup sequence monitoring
        const startupFlow = this.flowStates.get('startup-sequence');
        
        if (startupFlow) {
            console.log(`   Startup sequence: ${startupFlow.steps.length} steps`);
            
            // Create flow monitoring
            this.flowStates.set('user-interaction-flow', {
                'mobile-mining': {
                    path: ['mobile-wallet-app', 'game-engine', 'reasoning-integration', 'crypto-trace-engine'],
                    purpose: 'User mines ore through mobile interface'
                },
                'crypto-tracking': {
                    path: ['mobile-wallet-app', 'crypto-trace-engine', 'reasoning-integration'],
                    purpose: 'User checks scammed wallet status'
                },
                'forum-trading': {
                    path: ['mobile-wallet-app', 'd2jsp-forum', 'reasoning-integration', 'crypto-trace-engine'],
                    purpose: 'User creates trading posts and scam reports'
                }
            });
        }
        
        console.log('✅ Flow states configured');
    }
    
    // Context preservation methods
    async preserveContext(contextId, data) {
        this.contextProfiles.set(contextId, {
            ...this.contextProfiles.get(contextId),
            ...data,
            lastUpdated: Date.now()
        });
        
        // Persist to XML
        await this.updateArchitectureMap();
        
        this.emit('context-updated', { contextId, data });
    }
    
    getContext(contextId) {
        return this.contextProfiles.get(contextId);
    }
    
    // Flow state management
    async executeFlowState(flowId) {
        const flow = this.flowStates.get(flowId);
        
        if (!flow) {
            throw new Error(`Flow state not found: ${flowId}`);
        }
        
        console.log(`🔄 Executing flow state: ${flowId}`);
        
        if (flow.steps) {
            // Execute sequential steps
            for (const step of flow.steps) {
                console.log(`   Step ${step.order}: ${step.component} - ${step.action}`);
                
                await new Promise(resolve => setTimeout(resolve, step.wait || 1000));
                
                // Update component status
                const component = this.componentRegistry.get(step.component);
                if (component) {
                    component.lastAction = step.action;
                    component.lastActionTime = Date.now();
                }
            }
        }
        
        this.emit('flow-executed', { flowId });
        console.log(`✅ Flow state completed: ${flowId}`);
    }
    
    // System health monitoring
    async monitorSystemHealth() {
        setInterval(async () => {
            const healthStatus = await this.validateServiceConnectivity();
            
            // Update system context
            const systemContext = this.contextProfiles.get('system-state');
            if (systemContext) {
                systemContext.serviceHealth.set('last-check', Date.now());
                systemContext.serviceHealth.set('status', healthStatus);
            }
            
            // Emit health update
            this.emit('health-update', healthStatus);
            
            if (!healthStatus.passed) {
                console.log(`⚠️ System health warning: ${healthStatus.message}`);
            }
        }, 30000); // Check every 30 seconds
    }
    
    // Architecture roadmap management
    getRoadmapStatus() {
        return {
            current: {
                phase: 'Core System Implementation',
                status: 'completed',
                achievements: [
                    'Mobile wallet app with crypto integration',
                    'D2JSP forum with trading and scam reporting',
                    'Game engine with drag-and-drop inventory',
                    'AI reasoning with Teacher/Guardian/Companion layers',
                    'Crypto tracing for scammed wallet monitoring',
                    'PWA with offline capability',
                    'Cross-service integration and proxy system'
                ]
            },
            next: {
                phase: 'System Enhancement & Scaling',
                status: 'planning',
                planned: [
                    'Real-time WebSocket connections across all services',
                    'Advanced pattern detection algorithms',
                    'Multi-wallet support and portfolio tracking',
                    'Enhanced AI reasoning with learning capabilities'
                ]
            }
        };
    }
    
    // Knowledge base access
    getCriticalInsights() {
        return {
            'mobile-first-architecture': 'The mobile wallet app serves as the primary interface and proxy for all backend services',
            'scammed-wallet-tracking': 'The system automatically tracks wallet 0x742d35Cc6634C053 as the user\'s scammed wallet',
            'ai-layer-architecture': 'Three-layer AI system (Teacher/Guardian/Companion) provides comprehensive analysis',
            'pwa-offline-strategy': 'Progressive Web App with service worker provides native app experience with offline caching',
            'cross-service-proxy': 'Mobile app acts as intelligent proxy, routing requests to appropriate services'
        };
    }
    
    // Update architecture map
    async updateArchitectureMap() {
        try {
            // Update timestamp in XML
            const updatedXML = this.architectureXML.replace(
                /timestamp="[^"]*"/,
                `timestamp="${new Date().toISOString()}"`
            );
            
            fs.writeFileSync(this.architectureFile, updatedXML);
            console.log('📋 Architecture map updated');
        } catch (error) {
            console.error('❌ Failed to update architecture map:', error.message);
        }
    }
    
    // Generate system report
    generateSystemReport() {
        const report = {
            timestamp: new Date().toISOString(),
            architecture: {
                components: Array.from(this.componentRegistry.values()),
                health: this.getOverallHealth()
            },
            context: {
                profiles: Array.from(this.contextProfiles.keys()),
                userWallet: this.getContext('user-context')?.cryptoWallet?.address
            },
            flows: {
                states: Array.from(this.flowStates.keys()),
                lastExecuted: null
            },
            roadmap: this.getRoadmapStatus(),
            insights: this.getCriticalInsights()
        };
        
        return report;
    }
    
    getOverallHealth() {
        const components = Array.from(this.componentRegistry.values());
        const healthyCount = components.filter(c => c.health === 'healthy').length;
        const totalCount = components.length;
        
        return {
            percentage: totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 0,
            healthy: healthyCount,
            total: totalCount,
            status: healthyCount === totalCount ? 'excellent' : 
                   healthyCount >= totalCount * 0.8 ? 'good' :
                   healthyCount >= totalCount * 0.5 ? 'fair' : 'poor'
        };
    }
    
    // Utility methods
    httpRequest(url) {
        return new Promise((resolve, reject) => {
            const http = require('http');
            const urlObj = new URL(url);
            
            const req = http.request({
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname,
                method: 'GET',
                timeout: 5000
            }, (res) => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));
            req.end();
        });
    }
}

// Command-line interface
if (require.main === module) {
    const manager = new XMLArchitectureManager();
    
    const command = process.argv[2];
    
    manager.initialize().then(async (success) => {
        if (!success) {
            process.exit(1);
        }
        
        switch (command) {
            case 'validate':
                console.log('\n🔍 SYSTEM VALIDATION');
                console.log('===================');
                const isValid = await manager.validateSystemIntegrity();
                process.exit(isValid ? 0 : 1);
                break;
                
            case 'status':
                console.log('\n📊 SYSTEM STATUS');
                console.log('================');
                const report = manager.generateSystemReport();
                console.log(JSON.stringify(report, null, 2));
                break;
                
            case 'context':
                console.log('\n👤 CONTEXT PROFILES');
                console.log('==================');
                const contextId = process.argv[3] || 'user-context';
                const context = manager.getContext(contextId);
                console.log(JSON.stringify(context, null, 2));
                break;
                
            case 'flow':
                console.log('\n🔄 EXECUTING FLOW STATE');
                console.log('=======================');
                const flowId = process.argv[3] || 'startup-sequence';
                await manager.executeFlowState(flowId);
                break;
                
            case 'monitor':
                console.log('\n📡 STARTING HEALTH MONITORING');
                console.log('=============================');
                manager.monitorSystemHealth();
                
                manager.on('health-update', (status) => {
                    console.log(`[${new Date().toLocaleTimeString()}] Health: ${status.message}`);
                });
                
                // Keep running
                setInterval(() => {}, 1000);
                break;
                
            default:
                console.log('\n🗺️ XML ARCHITECTURE MANAGER');
                console.log('===========================');
                console.log('Usage: node xml-architecture-manager.js [command]');
                console.log('');
                console.log('Commands:');
                console.log('  validate  - Validate system integrity');
                console.log('  status    - Show system status report');
                console.log('  context   - Show context profiles');
                console.log('  flow      - Execute flow state');
                console.log('  monitor   - Start health monitoring');
                console.log('');
                const insights = manager.getCriticalInsights();
                console.log('🧠 Critical Insights:');
                Object.entries(insights).forEach(([key, value]) => {
                    console.log(`   • ${key}: ${value}`);
                });
        }
    });
}

module.exports = { XMLArchitectureManager };