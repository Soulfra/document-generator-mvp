#!/usr/bin/env node

/**
 * 🌐🔍 SERVICE PORT REGISTRY 🔍🌐
 * 
 * Central registry for all Document Generator services and their ports
 * Identifies conflicts and provides unified service discovery
 */

const crypto = require('crypto');
const fs = require('fs');
const express = require('express');

class ServicePortRegistry {
    constructor() {
        this.registryId = crypto.randomBytes(16).toString('hex');
        this.services = new Map();
        this.portConflicts = [];
        this.healthStatus = new Map();
        
        console.log('🌐🔍 SERVICE PORT REGISTRY');
        console.log('==========================');
        console.log('Centralized service discovery and port management');
        console.log('');
        
        this.initializeRegistry();
    }
    
    async initializeRegistry() {
        console.log('📋 Initializing service port registry...');
        
        try {
            // Define all known services
            await this.defineServiceRegistry();
            
            // Check for port conflicts
            await this.detectPortConflicts();
            
            // Start health monitoring
            await this.startHealthMonitoring();
            
            // Create registry API
            await this.setupRegistryAPI();
            
            console.log('✅ Service registry initialized');
            
        } catch (error) {
            console.error('❌ Registry initialization failed:', error);
            throw error;
        }
    }
    
    async defineServiceRegistry() {
        console.log('\n📝 Defining service registry...');
        
        // Core Document Generator Services
        this.registerService('document-generator-core', {
            port: 3000,
            category: 'core',
            description: 'Main document processing API',
            healthEndpoint: '/health',
            dependencies: ['postgresql', 'redis'],
            files: ['index.js', 'mcp/template-processor.js']
        });
        
        // AI Services
        this.registerService('ai-api-service', {
            port: 3001,
            category: 'ai',
            description: 'AI service integration layer',
            healthEndpoint: '/health',
            dependencies: ['ollama', 'anthropic-api', 'openai-api'],
            files: ['ai-api-service.js']
        });
        
        this.registerService('analytics-service', {
            port: 3002,
            category: 'analytics',
            description: 'Usage analytics and monitoring',
            healthEndpoint: '/health',
            dependencies: ['redis', 'postgresql'],
            files: ['analytics-service.js']
        });
        
        // Manufacturing System
        this.registerService('calcompare-llm-bitmap', {
            port: 3456,
            category: 'manufacturing',
            description: 'CalCompare LLM bitmap query system',
            healthEndpoint: '/status',
            dependencies: ['ollama', 'ai-api-service'],
            files: ['cal-compare-llm-bitmap-query-3d-model.js']
        });
        
        this.registerService('ai-factory-conveyor', {
            port: 8400,
            category: 'manufacturing',
            description: 'AI Factory conveyor belt system',
            healthEndpoint: '/health',
            dependencies: ['calcompare-llm-bitmap'],
            files: ['ai-factory-conveyor-belt-system.js']
        });
        
        this.registerService('bob-builder-wireframe', {
            port: 8500,
            category: 'manufacturing',
            description: 'Bob Builder wireframe stacking',
            healthEndpoint: '/status',
            dependencies: ['ai-factory-conveyor'],
            files: ['bob-builder-wireframe-stacking-orchestrator.js']
        });
        
        this.registerService('story-mode-narrative', {
            port: 9000,
            category: 'manufacturing',
            description: 'Story mode manufacturing narrative system',
            healthEndpoint: '/health',
            dependencies: ['bob-builder-wireframe'],
            files: ['story-mode-manufacturing-narrative-system.js']
        });
        
        // Conflicting Services (PROBLEM!)
        this.registerService('platform-hub', {
            port: 8080,
            category: 'platform',
            description: 'Main platform hub interface',
            healthEndpoint: '/health',
            dependencies: ['document-generator-core'],
            files: ['platform-hub.js'],
            status: 'CONFLICT_DETECTED'
        });
        
        this.registerService('agent-economy-forum', {
            port: 8080, // ⚠️ CONFLICT!
            category: 'economy',
            description: 'Agent Economy Forum system',
            healthEndpoint: '/status',
            dependencies: ['postgresql', 'redis'],
            files: ['agent-economy-forum.js'],
            status: 'CONFLICT_DETECTED'
        });
        
        // 3D World Integration
        this.registerService('deathtodata-3d-manufacturing', {
            port: 9500,
            category: 'world',
            description: 'Deathtodata 3D manufacturing world integration',
            healthEndpoint: '/health',
            dependencies: ['story-mode-narrative'],
            files: ['deathtodata-3d-manufacturing-world-integration.js']
        });
        
        // Clicking Combat System
        this.registerService('clicking-combat-integration', {
            port: 9600,
            category: 'combat',
            description: 'Clicking combat boss system integration',
            healthEndpoint: '/health',
            dependencies: ['deathtodata-3d-manufacturing'],
            files: ['clicking-combat-integration.js', 'cursor-boss-battle-arena.html']
        });
        
        // Infrastructure Services
        this.registerService('postgresql', {
            port: 5432,
            category: 'database',
            description: 'PostgreSQL database',
            healthEndpoint: null,
            external: true
        });
        
        this.registerService('redis', {
            port: 6379,
            category: 'cache',
            description: 'Redis cache and session storage',
            healthEndpoint: null,
            external: true
        });
        
        this.registerService('minio-s3', {
            port: 9000,
            category: 'storage',
            description: 'MinIO S3-compatible object storage',
            healthEndpoint: '/minio/health/live',
            external: true,
            status: 'PORT_CONFLICT_WITH_STORY_MODE'
        });
        
        this.registerService('ollama', {
            port: 11434,
            category: 'ai',
            description: 'Local Ollama AI inference',
            healthEndpoint: '/api/tags',
            external: true
        });
        
        // WebSocket Services
        this.registerService('websocket-hub', {
            port: 8081,
            category: 'realtime',
            description: 'WebSocket communication hub',
            healthEndpoint: null,
            dependencies: ['platform-hub']
        });
        
        console.log(`✅ Registered ${this.services.size} services`);
    }
    
    registerService(name, config) {
        this.services.set(name, {
            name,
            ...config,
            registeredAt: Date.now(),
            lastHealthCheck: null,
            healthy: null
        });
    }
    
    async detectPortConflicts() {
        console.log('\\n⚠️ Detecting port conflicts...');\n        \n        const portUsage = new Map();\n        this.portConflicts = [];\n        \n        // Group services by port\n        for (const [serviceName, config] of this.services) {\n            const port = config.port;\n            \n            if (!portUsage.has(port)) {\n                portUsage.set(port, []);\n            }\n            portUsage.get(port).push(serviceName);\n        }\n        \n        // Find conflicts\n        for (const [port, services] of portUsage) {\n            if (services.length > 1) {\n                this.portConflicts.push({\n                    port,\n                    services,\n                    severity: services.some(s => this.services.get(s).category === 'core') ? 'critical' : 'high'\n                });\n                \n                console.log(`🚨 CONFLICT: Port ${port} used by:`);\n                services.forEach(service => {\n                    const config = this.services.get(service);\n                    console.log(`   • ${service} (${config.category}): ${config.description}`);\n                });\n            }\n        }\n        \n        console.log(`\\n${this.portConflicts.length > 0 ? '❌' : '✅'} Found ${this.portConflicts.length} port conflicts`);\n    }\n    \n    async resolvePortConflicts() {\n        console.log('\\n🔧 Resolving port conflicts...');\n        \n        const resolutions = [];\n        \n        for (const conflict of this.portConflicts) {\n            const { port, services } = conflict;\n            \n            if (port === 8080) {\n                // Platform Hub vs Agent Economy\n                console.log(`🔄 Resolving port 8080 conflict...`);\n                \n                // Keep Platform Hub on 8080 (main interface)\n                // Move Agent Economy to 8090\n                const agentEconomyService = this.services.get('agent-economy-forum');\n                agentEconomyService.port = 8090;\n                agentEconomyService.status = 'PORT_RESOLVED';\n                \n                resolutions.push({\n                    conflict: 'platform-hub vs agent-economy-forum',\n                    resolution: 'Moved Agent Economy to port 8090',\n                    newPort: 8090\n                });\n                \n                console.log('   ✅ Agent Economy Forum moved to port 8090');\n            }\n            \n            if (port === 9000) {\n                // Story Mode vs MinIO\n                console.log(`🔄 Resolving port 9000 conflict...`);\n                \n                // Keep Story Mode on 9000 (part of manufacturing pipeline)\n                // MinIO typically runs on 9000 but we'll suggest 9001\n                const minioService = this.services.get('minio-s3');\n                minioService.port = 9001;\n                minioService.status = 'PORT_RESOLVED';\n                \n                resolutions.push({\n                    conflict: 'story-mode-narrative vs minio-s3',\n                    resolution: 'Moved MinIO to port 9001',\n                    newPort: 9001\n                });\n                \n                console.log('   ✅ MinIO moved to port 9001');\n            }\n        }\n        \n        // Re-detect conflicts after resolution\n        await this.detectPortConflicts();\n        \n        return resolutions;\n    }\n    \n    async startHealthMonitoring() {\n        console.log('\\n💓 Starting health monitoring...');\n        \n        const healthCheckInterval = setInterval(async () => {\n            await this.performHealthChecks();\n        }, 30000); // Every 30 seconds\n        \n        // Initial health check\n        await this.performHealthChecks();\n        \n        console.log('✅ Health monitoring started');\n    }\n    \n    async performHealthChecks() {\n        const healthPromises = [];\n        \n        for (const [serviceName, config] of this.services) {\n            if (!config.external || config.healthEndpoint) {\n                healthPromises.push(this.checkServiceHealth(serviceName, config));\n            }\n        }\n        \n        await Promise.allSettled(healthPromises);\n    }\n    \n    async checkServiceHealth(serviceName, config) {\n        try {\n            if (!config.healthEndpoint) {\n                // No health endpoint, assume healthy if port is responding\n                return;\n            }\n            \n            const healthUrl = `http://localhost:${config.port}${config.healthEndpoint}`;\n            \n            // Use fetch with timeout\n            const controller = new AbortController();\n            const timeoutId = setTimeout(() => controller.abort(), 5000);\n            \n            const response = await fetch(healthUrl, {\n                signal: controller.signal,\n                method: 'GET'\n            });\n            \n            clearTimeout(timeoutId);\n            \n            const healthy = response.ok;\n            this.healthStatus.set(serviceName, {\n                healthy,\n                lastCheck: Date.now(),\n                status: response.status,\n                response: healthy ? await response.json().catch(() => ({})) : null\n            });\n            \n        } catch (error) {\n            this.healthStatus.set(serviceName, {\n                healthy: false,\n                lastCheck: Date.now(),\n                error: error.message\n            });\n        }\n    }\n    \n    async setupRegistryAPI() {\n        console.log('\\n🌐 Setting up registry API...');\n        \n        const app = express();\n        app.use(express.json());\n        \n        // Registry overview\n        app.get('/registry', (req, res) => {\n            const services = Array.from(this.services.entries()).map(([name, config]) => ({\n                name,\n                port: config.port,\n                category: config.category,\n                description: config.description,\n                status: config.status || 'active',\n                healthy: this.healthStatus.get(name)?.healthy,\n                lastHealthCheck: this.healthStatus.get(name)?.lastCheck\n            }));\n            \n            res.json({\n                success: true,\n                registryId: this.registryId,\n                totalServices: services.length,\n                conflicts: this.portConflicts.length,\n                services\n            });\n        });\n        \n        // Port conflicts\n        app.get('/registry/conflicts', (req, res) => {\n            res.json({\n                success: true,\n                conflicts: this.portConflicts\n            });\n        });\n        \n        // Health status\n        app.get('/registry/health', (req, res) => {\n            const healthSummary = {};\n            \n            for (const [serviceName] of this.services) {\n                const health = this.healthStatus.get(serviceName);\n                healthSummary[serviceName] = health || { healthy: null, status: 'unknown' };\n            }\n            \n            const totalServices = this.services.size;\n            const healthyServices = Object.values(healthSummary).filter(h => h.healthy === true).length;\n            const unhealthyServices = Object.values(healthSummary).filter(h => h.healthy === false).length;\n            \n            res.json({\n                success: true,\n                summary: {\n                    total: totalServices,\n                    healthy: healthyServices,\n                    unhealthy: unhealthyServices,\n                    unknown: totalServices - healthyServices - unhealthyServices\n                },\n                services: healthSummary\n            });\n        });\n        \n        // Service details\n        app.get('/registry/service/:name', (req, res) => {\n            const service = this.services.get(req.params.name);\n            if (!service) {\n                return res.status(404).json({\n                    success: false,\n                    error: 'Service not found'\n                });\n            }\n            \n            const health = this.healthStatus.get(req.params.name);\n            \n            res.json({\n                success: true,\n                service: {\n                    ...service,\n                    health\n                }\n            });\n        });\n        \n        // Resolve conflicts endpoint\n        app.post('/registry/resolve-conflicts', async (req, res) => {\n            try {\n                const resolutions = await this.resolvePortConflicts();\n                res.json({\n                    success: true,\n                    resolutions,\n                    remainingConflicts: this.portConflicts.length\n                });\n            } catch (error) {\n                res.status(500).json({\n                    success: false,\n                    error: error.message\n                });\n            }\n        });\n        \n        const PORT = process.env.REGISTRY_PORT || 9999;\n        app.listen(PORT, () => {\n            console.log(`✅ Service Registry API running on port ${PORT}`);\n        });\n        \n        this.app = app;\n    }\n    \n    generateDockerCompose() {\n        console.log('\\n🐳 Generating docker-compose configuration...');\n        \n        const dockerServices = {};\n        \n        for (const [serviceName, config] of this.services) {\n            if (!config.external) {\n                dockerServices[serviceName.replace(/-/g, '_')] = {\n                    build: '.',\n                    ports: [`${config.port}:${config.port}`],\n                    environment: {\n                        NODE_ENV: 'production',\n                        PORT: config.port,\n                        SERVICE_NAME: serviceName\n                    },\n                    depends_on: config.dependencies || [],\n                    healthcheck: config.healthEndpoint ? {\n                        test: [`CMD`, `curl`, `-f`, `http://localhost:${config.port}${config.healthEndpoint}`],\n                        interval: '30s',\n                        timeout: '10s',\n                        retries: 3\n                    } : null\n                };\n            }\n        }\n        \n        const dockerCompose = {\n            version: '3.8',\n            services: dockerServices\n        };\n        \n        return dockerCompose;\n    }\n    \n    displayRegistrySummary() {\n        console.log('\\n🌐🔍 SERVICE PORT REGISTRY SUMMARY');\n        console.log('==================================');\n        \n        console.log(`\\n📊 Registry Status:`);\n        console.log(`  • Total Services: ${this.services.size}`);\n        console.log(`  • Port Conflicts: ${this.portConflicts.length}`);\n        \n        // Group by category\n        const categories = {};\n        for (const [, config] of this.services) {\n            if (!categories[config.category]) {\n                categories[config.category] = [];\n            }\n            categories[config.category].push(config);\n        }\n        \n        console.log('\\n📋 Services by Category:');\n        Object.entries(categories).forEach(([category, services]) => {\n            console.log(`\\n  ${category.toUpperCase()}:`);\n            services.forEach(service => {\n                const status = service.status || 'active';\n                const statusIcon = status.includes('CONFLICT') ? '🚨' : \n                                 status.includes('RESOLVED') ? '✅' : '🟢';\n                console.log(`    ${statusIcon} ${service.name}: ${service.port}`);\n            });\n        });\n        \n        if (this.portConflicts.length > 0) {\n            console.log('\\n🚨 CONFLICTS TO RESOLVE:');\n            this.portConflicts.forEach(conflict => {\n                console.log(`  • Port ${conflict.port}: ${conflict.services.join(', ')}`);\n            });\n        }\n        \n        console.log('\\n🌐 INTEGRATION READY:');\n        console.log('  • Unified service discovery');\n        console.log('  • Health monitoring dashboard');\n        console.log('  • Port conflict resolution');\n        console.log('  • Docker Compose generation');\n    }\n}\n\n// Export for integration\nmodule.exports = ServicePortRegistry;\n\n// Run if called directly\nif (require.main === module) {\n    const registry = new ServicePortRegistry();\n    \n    setTimeout(async () => {\n        registry.displayRegistrySummary();\n        \n        console.log('\\n🎯 SERVICE REGISTRY ACTIVE!');\n        console.log('🌐 All Document Generator services mapped');\n        console.log('🔍 Port conflicts identified and resolutions provided');\n        console.log('💓 Health monitoring running');\n        console.log('🐳 Docker Compose ready for generation');\n        \n        // Auto-resolve conflicts\n        console.log('\\n🔧 Auto-resolving conflicts...');\n        await registry.resolvePortConflicts();\n        \n        console.log('\\n📋 Registry API Endpoints:');\n        console.log('  • GET  /registry - Service overview');\n        console.log('  • GET  /registry/conflicts - Port conflicts');\n        console.log('  • GET  /registry/health - Health status');\n        console.log('  • POST /registry/resolve-conflicts - Auto-resolve');\n        \n    }, 1000);\n}"