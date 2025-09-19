#!/usr/bin/env node

/**
 * 🔍⚔️📊 DEATHTODATA SERVICE REGISTRY
 * 
 * Service registration and discovery for deathtodata search engine components
 * Integrates with existing SERVICE-DISCOVERY-ENGINE.js and unified-service-registry.js
 * Resolves port conflicts and provides health monitoring
 */

const EventEmitter = require('events');
const ServiceDiscoveryEngine = require('./SERVICE-DISCOVERY-ENGINE');
const UnifiedServiceRegistry = require('./unified-service-registry');

class DeathtodataServiceRegistry extends EventEmitter {
    constructor() {
        super();
        
        console.log('🔍⚔️📊 DEATHTODATA SERVICE REGISTRY');
        console.log('===================================');
        console.log('Registering search engine components...');
        console.log('Resolving port conflicts...');
        console.log('Setting up health monitoring...');
        console.log('');
        
        // Service definitions with fixed ports
        this.serviceDefinitions = {
            'deathtodata-search-engine': {
                script: 'deathtodata-search-boss-connector.js',
                port: 3456,
                name: 'Deathtodata Search Engine',
                type: 'gaming',
                priority: 'high',
                description: 'Main search-to-boss connector with raid mechanics',
                healthCheck: 'http://localhost:3456/health',
                dependencies: ['boss-pipeline', 'npc-layer', 'llm-search'],
                features: ['search-as-raid', 'boss-battles', 'crawler-agents', 'bpm-risk-reward'],
                category: 'deathtodata-core'
            },
            
            'deathtodata-forums': {
                script: 'deathtodata-character-forums.js',
                port: 5001,  // Fixed: was 5000 (conflict with Matrix phpBB)
                name: 'Deathtodata Character Forums',
                type: 'gaming',
                priority: 'medium',
                description: 'Character-specific phpBB forums for raids and strategies',
                healthCheck: 'http://localhost:5001/health',
                dependencies: ['phpbb-system'],
                features: ['character-forums', 'raid-discussions', 'boss-strategies'],
                category: 'deathtodata-forums'
            },
            
            'deathtodata-bpm-system': {
                script: 'deathtodata-bpm-risk-reward.js',
                port: 7777,
                name: 'Deathtodata BPM Risk/Reward System',
                type: 'gaming',
                priority: 'high',
                description: 'BPM-based risk/reward with Infernal Cape mechanics',
                healthCheck: 'http://localhost:7777/health',
                dependencies: ['groove-layer'],
                features: ['bpm-scaling', 'death-mechanics', 'reward-scaling', 'infernal-mode'],
                category: 'deathtodata-core'
            },
            
            'deathtodata-npc-layer': {
                script: 'npc-gaming-layer.js',
                port: 8889,  // Fixed: was 8888 (conflict with Crypto Key Vault)
                name: 'Deathtodata NPC Gaming Layer',
                type: 'gaming',
                priority: 'medium',
                description: 'NPC and crawler agent management system',
                healthCheck: 'http://localhost:8889/health',
                dependencies: [],
                features: ['crawler-agents', 'npc-management', 'agent-actions'],
                category: 'deathtodata-agents'
            },
            
            'deathtodata-interface': {
                type: 'static',
                file: 'deathtodata-unified-search-raid.html',
                port: null, // Static file
                name: 'Deathtodata 3D Search Interface',
                type: 'frontend',
                priority: 'high',
                description: '3D interface with character-centered camera and raid mechanics',
                dependencies: ['deathtodata-search-engine'],
                features: ['3d-interface', 'character-centering', 'raid-visualization'],
                category: 'deathtodata-frontend'
            }
        };
        
        // Registry integration
        this.discoveryEngine = null;
        this.unifiedRegistry = null;
        
        // Status tracking
        this.registrationStatus = new Map();
        this.healthStatus = new Map();
        
        // Port conflict resolutions
        this.portResolutions = {
            'original_5000': { 
                old: 5000, 
                new: 5001, 
                reason: 'Conflict with Matrix phpBB Control Panel',
                service: 'deathtodata-forums'
            },
            'original_8888': { 
                old: 8888, 
                new: 8889, 
                reason: 'Conflict with Crypto Key Vault',
                service: 'deathtodata-npc-layer'
            }
        };
    }
    
    async initialize() {
        console.log('🚀 Initializing Deathtodata Service Registry...\n');
        
        try {
            // Initialize discovery engine integration
            await this.initializeDiscoveryIntegration();
            
            // Register services with unified registry
            await this.registerWithUnifiedRegistry();
            
            // Add to discovery patterns
            await this.addDiscoveryPatterns();
            
            // Start health monitoring
            this.startHealthMonitoring();
            
            // Display port conflict resolutions
            this.displayPortResolutions();
            
            console.log('✅ Deathtodata Service Registry initialized!');
            console.log(`📊 Registered ${Object.keys(this.serviceDefinitions).length} services`);
            console.log(`🔧 Resolved ${Object.keys(this.portResolutions).length} port conflicts\n`);
            
            this.emit('registry:ready');
            
        } catch (error) {
            console.error('❌ Registry initialization failed:', error);
            throw error;
        }
    }
    
    async initializeDiscoveryIntegration() {
        console.log('🔍 Integrating with Service Discovery Engine...');
        
        // Create discovery engine instance if needed
        try {
            this.discoveryEngine = new ServiceDiscoveryEngine();
            console.log('  ✅ Discovery engine connected');
        } catch (error) {
            console.log('  ⚠️ Discovery engine not available, continuing without it');
        }
    }
    
    async registerWithUnifiedRegistry() {
        console.log('📋 Registering with Unified Service Registry...');
        
        try {
            this.unifiedRegistry = new UnifiedServiceRegistry();
            
            // Add our service definitions to the unified registry
            for (const [serviceId, config] of Object.entries(this.serviceDefinitions)) {
                if (config.type !== 'static') {
                    this.unifiedRegistry.serviceDefinitions[`deathtodata-${serviceId}`] = {
                        script: config.script,
                        port: config.port,
                        description: config.description,
                        priority: this.mapPriorityToNumber(config.priority),
                        required: config.priority === 'high',
                        healthCheck: config.healthCheck,
                        dependencies: config.dependencies || []
                    };
                    
                    console.log(`  📝 Registered: ${config.name} (${config.port})`);
                }
                
                this.registrationStatus.set(serviceId, {
                    registered: true,
                    timestamp: Date.now(),
                    port: config.port,
                    status: 'registered'
                });
            }
            
            console.log('  ✅ All services registered with unified registry');
            
        } catch (error) {
            console.log('  ⚠️ Unified registry not available, services registered locally');
        }
    }
    
    mapPriorityToNumber(priority) {
        const priorityMap = {
            'high': 2,
            'medium': 3,
            'low': 4
        };
        return priorityMap[priority] || 3;
    }
    
    async addDiscoveryPatterns() {
        console.log('🎯 Adding discovery patterns...');
        
        // Add deathtodata patterns to discovery engine
        const deathtodataPatterns = [
            { port: 3456, name: 'Deathtodata Search Engine', type: 'gaming', priority: 'high' },
            { port: 5001, name: 'Deathtodata Character Forums', type: 'gaming', priority: 'medium' },
            { port: 7777, name: 'Deathtodata BPM System', type: 'gaming', priority: 'high' },
            { port: 8889, name: 'Deathtodata NPC Layer', type: 'gaming', priority: 'medium' }
        ];
        
        if (this.discoveryEngine && this.discoveryEngine.servicePatterns) {
            // Add our patterns to the discovery engine
            this.discoveryEngine.servicePatterns.push(...deathtodataPatterns);
            console.log(`  ✅ Added ${deathtodataPatterns.length} discovery patterns`);
        } else {
            console.log('  ⚠️ Could not add patterns to discovery engine');
        }
        
        // Store patterns locally for reference
        this.discoveryPatterns = deathtodataPatterns;
    }
    
    displayPortResolutions() {
        console.log('🔧 Port Conflict Resolutions:');
        console.log('=============================');
        
        for (const [key, resolution] of Object.entries(this.portResolutions)) {
            console.log(`  📍 ${resolution.service}:`);
            console.log(`     Old Port: ${resolution.old} → New Port: ${resolution.new}`);
            console.log(`     Reason: ${resolution.reason}\n`);
        }
    }
    
    startHealthMonitoring() {
        console.log('❤️ Starting health monitoring...');
        
        // Initial health check after 5 seconds
        setTimeout(() => {
            this.performHealthChecks();
        }, 5000);
        
        // Periodic health checks every 30 seconds
        setInterval(() => {
            this.performHealthChecks();
        }, 30000);
        
        console.log('  ⏰ Health checks scheduled every 30 seconds');
    }
    
    async performHealthChecks() {
        for (const [serviceId, config] of Object.entries(this.serviceDefinitions)) {
            if (config.type === 'static') continue;
            
            try {
                const isHealthy = await this.checkServiceHealth(config);
                
                this.healthStatus.set(serviceId, {
                    healthy: isHealthy,
                    lastCheck: Date.now(),
                    port: config.port,
                    url: config.healthCheck
                });
                
            } catch (error) {
                this.healthStatus.set(serviceId, {
                    healthy: false,
                    lastCheck: Date.now(),
                    error: error.message,
                    port: config.port
                });
            }
        }
        
        // Emit health update event
        this.emit('health:update', this.getHealthSummary());
    }
    
    async checkServiceHealth(config) {
        if (!config.healthCheck) return false;
        
        const http = require('http');
        const url = new URL(config.healthCheck);
        
        return new Promise((resolve) => {
            const request = http.get({
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                timeout: 3000
            }, (res) => {
                resolve(res.statusCode >= 200 && res.statusCode < 300);
            });
            
            request.on('error', () => resolve(false));
            request.on('timeout', () => {
                request.destroy();
                resolve(false);
            });
        });
    }
    
    getHealthSummary() {
        const summary = {
            timestamp: new Date().toISOString(),
            totalServices: Object.keys(this.serviceDefinitions).length,
            healthyServices: 0,
            unhealthyServices: 0,
            details: {}
        };
        
        for (const [serviceId, status] of this.healthStatus) {
            if (status.healthy) {
                summary.healthyServices++;
            } else {
                summary.unhealthyServices++;
            }
            
            summary.details[serviceId] = {
                healthy: status.healthy,
                port: status.port,
                lastCheck: new Date(status.lastCheck).toLocaleTimeString(),
                error: status.error || null
            };
        }
        
        return summary;
    }
    
    getServiceDefinitions() {
        return this.serviceDefinitions;
    }
    
    getRegistrationStatus() {
        return Array.from(this.registrationStatus.entries()).map(([id, status]) => ({
            serviceId: id,
            ...status,
            service: this.serviceDefinitions[id]?.name
        }));
    }
    
    getPortResolutions() {
        return this.portResolutions;
    }
    
    // Generate service registry report
    generateReport() {
        const health = this.getHealthSummary();
        const registrations = this.getRegistrationStatus();
        
        return {
            timestamp: Date.now(),
            registry: 'deathtodata',
            services: Object.keys(this.serviceDefinitions).length,
            registeredServices: registrations.length,
            healthyServices: health.healthyServices,
            unhealthyServices: health.unhealthyServices,
            portConflictsResolved: Object.keys(this.portResolutions).length,
            serviceDefinitions: this.serviceDefinitions,
            healthStatus: health.details,
            registrationStatus: registrations,
            portResolutions: this.portResolutions
        };
    }
    
    // API for external access
    async startAPI() {
        const express = require('express');
        const app = express();
        const port = 9996; // Different from main discovery engine (avoiding 9998 Docker conflict)
        
        app.use(express.json());
        
        // Health endpoint
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'deathtodata-service-registry',
                timestamp: Date.now()
            });
        });
        
        // Service definitions
        app.get('/api/services', (req, res) => {
            res.json(this.serviceDefinitions);
        });
        
        // Health status
        app.get('/api/health', (req, res) => {
            res.json(this.getHealthSummary());
        });
        
        // Registration status
        app.get('/api/registration', (req, res) => {
            res.json(this.getRegistrationStatus());
        });
        
        // Full report
        app.get('/api/report', (req, res) => {
            res.json(this.generateReport());
        });
        
        // Port resolutions
        app.get('/api/ports', (req, res) => {
            res.json(this.portResolutions);
        });
        
        app.listen(port, () => {
            console.log(`🌐 Deathtodata Registry API running on http://localhost:${port}`);
        });
        
        return port;
    }
}

// Export for use
module.exports = DeathtodataServiceRegistry;

// Run if called directly
if (require.main === module) {
    const registry = new DeathtodataServiceRegistry();
    
    registry.initialize()
        .then(async () => {
            // Start API server
            await registry.startAPI();
            
            console.log('\n🎮 DEATHTODATA REGISTRY ACTIVE');
            console.log('==============================');
            console.log('📊 All services registered and monitored');
            console.log('🔧 Port conflicts resolved');
            console.log('❤️ Health monitoring active');
            console.log('🌐 API available at http://localhost:9996');
            console.log('\nService Status:');
            
            // Display initial status
            setTimeout(() => {
                const health = registry.getHealthSummary();
                console.log(`  ✅ Healthy: ${health.healthyServices}`);
                console.log(`  ⚠️ Unhealthy: ${health.unhealthyServices}`);
                console.log(`  📊 Total: ${health.totalServices}`);
            }, 6000);
            
            // Status updates every minute
            setInterval(() => {
                const health = registry.getHealthSummary();
                console.log(`\n📊 Health Update: ${health.healthyServices}/${health.totalServices} services healthy`);
            }, 60000);
        })
        .catch(error => {
            console.error('Failed to start registry:', error);
            process.exit(1);
        });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Deathtodata Service Registry...');
        process.exit(0);
    });
}