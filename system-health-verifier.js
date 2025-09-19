#!/usr/bin/env node

/**
 * 🏥 SYSTEM HEALTH VERIFIER
 * Uses the unified .env configuration to verify all services are properly connected
 * Addresses the 17% health issue by checking everything systematically
 */

const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

class SystemHealthVerifier {
    constructor() {
        this.loadEnvironment();
        this.services = this.buildServiceRegistry();
        this.databases = this.buildDatabaseRegistry();
        this.healthResults = {
            databases: {},
            services: {},
            overall: 0,
            issues: [],
            recommendations: []
        };
    }
    
    loadEnvironment() {
        // Load from actual .env or template
        const envPath = fs.existsSync('.env') ? '.env' : '.env.template';
        console.log(`📋 Loading configuration from ${envPath}`);
        
        try {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            
            lines.forEach(line => {
                line = line.trim();
                if (line && !line.startsWith('#') && line.includes('=')) {
                    const [key, ...valueParts] = line.split('=');
                    const value = valueParts.join('=');
                    if (!process.env[key]) {
                        process.env[key] = value;
                    }
                }
            });
            
            console.log('✅ Environment loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load environment:', error.message);
            process.exit(1);
        }
    }
    
    buildServiceRegistry() {
        return {
            // Core Infrastructure
            postgres: {
                type: 'database',
                host: process.env.POSTGRES_HOST || 'localhost',
                port: parseInt(process.env.POSTGRES_PORT) || 5432,
                name: 'PostgreSQL Database',
                critical: true
            },
            redis: {
                type: 'database',
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT) || 6379,
                name: 'Redis Cache',
                critical: true
            },
            ollama: {
                type: 'ai',
                port: parseInt(process.env.OLLAMA_PORT) || 11434,
                name: 'Ollama Local AI',
                healthEndpoint: '/api/tags',
                critical: false
            },
            
            // Core Platform Services
            masterController: {
                type: 'http',
                port: parseInt(process.env.MASTER_CONTROLLER_PORT) || 9999,
                name: 'Master System Controller',
                healthEndpoint: '/',
                critical: true
            },
            templateProcessor: {
                type: 'http',
                port: parseInt(process.env.TEMPLATE_PROCESSOR_PORT) || 3000,
                name: 'Template Processor',
                healthEndpoint: '/health',
                critical: true
            },
            aiApi: {
                type: 'http',
                port: parseInt(process.env.AI_API_PORT) || 3001,
                name: 'AI API Service',
                healthEndpoint: '/health',
                critical: true
            },
            analytics: {
                type: 'http',
                port: parseInt(process.env.ANALYTICS_PORT) || 3002,
                name: 'Analytics Service',
                healthEndpoint: '/health',
                critical: false
            },
            platformHub: {
                type: 'http',
                port: parseInt(process.env.PLATFORM_HUB_PORT) || 8080,
                name: 'Platform Hub',
                healthEndpoint: '/health',
                critical: true
            },
            
            // Discovered Services
            forumSystem: {
                type: 'http',
                port: parseInt(process.env.FORUM_SYSTEM_PORT) || 5555,
                name: 'Forum System',
                healthEndpoint: '/api/metrics',
                critical: false
            },
            aiDebugging: {
                type: 'http',
                port: parseInt(process.env.AI_DEBUGGING_DASHBOARD_PORT) || 5000,
                name: 'AI Debugging Dashboard',
                healthEndpoint: '/health',
                critical: false
            },
            hybridAI: {
                type: 'http',
                port: parseInt(process.env.HYBRID_AI_WORKFLOW_PORT) || 5001,
                name: 'Hybrid AI Workflow',
                healthEndpoint: '/health',
                critical: false
            },
            calCompare: {
                type: 'http',
                port: parseInt(process.env.CAL_COMPARE_PORT) || 5002,
                name: 'CAL Compare Service',
                healthEndpoint: '/health',
                critical: false
            },
            
            // Gaming Services
            gamingAiBridge: {
                type: 'http',
                port: parseInt(process.env.GAMING_AI_BRIDGE_PORT) || 4001,
                name: 'Gaming AI Bridge',
                healthEndpoint: '/health',
                critical: false
            },
            debugGame: {
                type: 'http',
                port: parseInt(process.env.DEBUG_GAME_PORT) || 4002,
                name: 'Debug Game Visualizer',
                healthEndpoint: '/health',
                critical: false
            },
            
            // Storage Services
            minio: {
                type: 'http',
                port: parseInt(process.env.MINIO_PORT) || 9000,
                name: 'MinIO S3 Storage',
                healthEndpoint: '/minio/health/live',
                critical: false
            }
        };
    }
    
    buildDatabaseRegistry() {
        const dbPath = (dbName) => path.resolve(process.env[`${dbName.toUpperCase()}_DB_PATH`] || `./databases/${dbName}.db`);
        
        return {
            // SQLite Databases (discovered from audit)
            gamingDb: {
                type: 'sqlite',
                path: dbPath('gaming'),
                name: 'Gaming Database',
                tables: ['game_sessions', 'players', 'scores']
            },
            aiReasoningDb: {
                type: 'sqlite',
                path: process.env.AI_REASONING_DB_PATH || './ai-reasoning-game.db',
                name: 'AI Reasoning Game',
                tables: ['game_zones', 'ai_agents', 'reasoning_events']
            },
            trustHandshakeDb: {
                type: 'sqlite',
                path: process.env.TRUST_HANDSHAKE_DB_PATH || './trust-handshake.db',
                name: 'Trust Handshake System',
                tables: ['trust_handshakes', 'trust_verifications']
            },
            businessAccountingDb: {
                type: 'sqlite',
                path: process.env.BUSINESS_ACCOUNTING_DB_PATH || './business-accounting.db',
                name: 'Business Accounting',
                tables: ['invoices', 'transactions', 'accounts']
            },
            walletAddressesDb: {
                type: 'sqlite',
                path: process.env.WALLET_ADDRESSES_DB_PATH || './wallet-addresses.db',
                name: 'Wallet Addresses',
                tables: ['addresses', 'wallet_transactions']
            },
            gachaTokensDb: {
                type: 'sqlite',
                path: process.env.GACHA_TOKENS_DB_PATH || './gacha-tokens.db',
                name: 'Gacha Token System',
                tables: ['user_tokens', 'gacha_history']
            },
            mascotWorldDb: {
                type: 'sqlite',
                path: process.env.MASCOT_WORLD_DB_PATH || './mascot-world.db',
                name: 'Mascot World',
                tables: ['mascots', 'rooms', 'outfits']
            },
            taxIntelligenceDb: {
                type: 'sqlite',
                path: process.env.TAX_INTELLIGENCE_DB_PATH || './tax-intelligence.db',
                name: 'Tax Intelligence',
                tables: ['crypto_transactions', 'deductions_found']
            }
        };
    }
    
    async verifySystemHealth() {
        console.log('🏥 STARTING COMPREHENSIVE SYSTEM HEALTH CHECK');
        console.log('===============================================\n');
        
        console.log('🗂️  Step 1: Verifying Database Connections...');
        await this.verifyDatabases();
        
        console.log('\n🌐 Step 2: Verifying Service Health...');
        await this.verifyServices();
        
        console.log('\n🔍 Step 3: Analyzing System Issues...');
        this.analyzeIssues();
        
        console.log('\n📊 Step 4: Generating Health Report...');
        this.generateHealthReport();
        
        console.log('\n💡 Step 5: Providing Recommendations...');
        this.generateRecommendations();
        
        return this.healthResults;
    }
    
    async verifyDatabases() {
        const dbPromises = Object.entries(this.databases).map(async ([key, db]) => {
            try {
                if (db.type === 'sqlite') {
                    const exists = fs.existsSync(db.path);
                    this.healthResults.databases[key] = {
                        name: db.name,
                        status: exists ? 'healthy' : 'missing',
                        path: db.path,
                        exists: exists,
                        size: exists ? fs.statSync(db.path).size : 0
                    };
                    
                    if (exists) {
                        console.log(`  ✅ ${db.name}: Found at ${db.path} (${this.formatBytes(fs.statSync(db.path).size)})`);
                    } else {
                        console.log(`  ❌ ${db.name}: Missing at ${db.path}`);
                        this.healthResults.issues.push(`Database missing: ${db.name} at ${db.path}`);
                    }
                }
            } catch (error) {
                console.log(`  ❌ ${db.name}: Error - ${error.message}`);
                this.healthResults.databases[key] = {
                    name: db.name,
                    status: 'error',
                    error: error.message
                };
                this.healthResults.issues.push(`Database error: ${db.name} - ${error.message}`);
            }
        });
        
        // Check PostgreSQL and Redis separately
        await this.checkPostgreSQL();
        await this.checkRedis();
        
        await Promise.all(dbPromises);
    }
    
    async checkPostgreSQL() {
        try {
            // Simple check - try to connect
            const result = await this.executeCommand('psql', [
                '-h', process.env.POSTGRES_HOST || 'localhost',
                '-p', process.env.POSTGRES_PORT || '5432',
                '-U', process.env.POSTGRES_USER || 'postgres',
                '-d', process.env.POSTGRES_DB || 'document_generator',
                '-c', 'SELECT 1;'
            ], { env: { ...process.env, PGPASSWORD: process.env.POSTGRES_PASSWORD || 'postgres' }});
            
            this.healthResults.databases.postgresql = {
                name: 'PostgreSQL',
                status: 'healthy',
                host: process.env.POSTGRES_HOST || 'localhost',
                port: process.env.POSTGRES_PORT || 5432,
                database: process.env.POSTGRES_DB || 'document_generator'
            };
            console.log(`  ✅ PostgreSQL: Connected to ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}`);
            
        } catch (error) {
            this.healthResults.databases.postgresql = {
                name: 'PostgreSQL',
                status: 'error',
                error: error.message
            };
            console.log(`  ❌ PostgreSQL: ${error.message}`);
            this.healthResults.issues.push(`PostgreSQL connection failed: ${error.message}`);
        }
    }
    
    async checkRedis() {
        try {
            // Try Docker container first, then local redis-cli
            let result;
            try {
                result = await this.executeCommand('docker', [
                    'exec', 'document-generator-redis', 'redis-cli', 'ping'
                ]);
            } catch (dockerError) {
                // Fallback to local redis-cli
                result = await this.executeCommand('redis-cli', [
                    '-h', process.env.REDIS_HOST || 'localhost',
                    '-p', process.env.REDIS_PORT || '6379',
                    'ping'
                ]);
            }
            
            this.healthResults.databases.redis = {
                name: 'Redis',
                status: result.includes('PONG') ? 'healthy' : 'error',
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379
            };
            
            if (result.includes('PONG')) {
                console.log(`  ✅ Redis: Connected to ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
            } else {
                console.log(`  ❌ Redis: Unexpected response - ${result}`);
                this.healthResults.issues.push(`Redis unexpected response: ${result}`);
            }
            
        } catch (error) {
            this.healthResults.databases.redis = {
                name: 'Redis',
                status: 'error',
                error: error.message
            };
            console.log(`  ❌ Redis: ${error.message}`);
            this.healthResults.issues.push(`Redis connection failed: ${error.message}`);
        }
    }
    
    async verifyServices() {
        const servicePromises = Object.entries(this.services).map(async ([key, service]) => {
            try {
                if (service.type === 'http' || service.type === 'ai') {
                    const healthy = await this.checkHttpService(service);
                    this.healthResults.services[key] = {
                        name: service.name,
                        status: healthy ? 'healthy' : 'down',
                        port: service.port,
                        critical: service.critical,
                        url: `http://localhost:${service.port}${service.healthEndpoint || ''}`
                    };
                    
                    if (healthy) {
                        console.log(`  ✅ ${service.name}: Running on port ${service.port}`);
                    } else {
                        console.log(`  ❌ ${service.name}: Not responding on port ${service.port}`);
                        if (service.critical) {
                            this.healthResults.issues.push(`Critical service down: ${service.name} on port ${service.port}`);
                        }
                    }
                } else if (service.type === 'database') {
                    // Database services handled separately
                    const healthy = await this.checkDatabaseService(service);
                    this.healthResults.services[key] = {
                        name: service.name,
                        status: healthy ? 'healthy' : 'down',
                        type: 'database',
                        host: service.host,
                        port: service.port,
                        critical: service.critical
                    };
                }
            } catch (error) {
                console.log(`  ❌ ${service.name}: Error - ${error.message}`);
                this.healthResults.services[key] = {
                    name: service.name,
                    status: 'error',
                    error: error.message,
                    critical: service.critical
                };
                if (service.critical) {
                    this.healthResults.issues.push(`Critical service error: ${service.name} - ${error.message}`);
                }
            }
        });
        
        await Promise.all(servicePromises);
    }
    
    async checkHttpService(service) {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: service.port,
                path: service.healthEndpoint || '/',
                method: 'GET',
                timeout: 3000
            }, (res) => {
                resolve(res.statusCode >= 200 && res.statusCode < 400);
            });
            
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
            
            req.end();
        });
    }
    
    async checkDatabaseService(service) {
        // For database services, we check if the port is open
        return new Promise((resolve) => {
            const net = require('net');
            const socket = new net.Socket();
            
            socket.setTimeout(3000);
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });
            
            socket.on('error', () => resolve(false));
            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });
            
            socket.connect(service.port, service.host);
        });
    }
    
    analyzeIssues() {
        const totalServices = Object.keys(this.services).length;
        const healthyServices = Object.values(this.healthResults.services)
            .filter(s => s.status === 'healthy').length;
        
        const totalDatabases = Object.keys(this.databases).length + 2; // +2 for postgres/redis
        const healthyDatabases = Object.values(this.healthResults.databases)
            .filter(d => d.status === 'healthy').length;
        
        this.healthResults.overall = Math.round(
            ((healthyServices + healthyDatabases) / (totalServices + totalDatabases)) * 100
        );
        
        console.log(`  📊 Overall System Health: ${this.healthResults.overall}%`);
        console.log(`  📊 Services: ${healthyServices}/${totalServices} healthy`);
        console.log(`  📊 Databases: ${healthyDatabases}/${totalDatabases} healthy`);
    }
    
    generateHealthReport() {
        console.log('\n📋 SYSTEM HEALTH REPORT');
        console.log('========================');
        console.log(`Overall Health: ${this.healthResults.overall}%`);
        
        if (this.healthResults.overall < 50) {
            console.log('🚨 CRITICAL: System health is below 50%');
        } else if (this.healthResults.overall < 80) {
            console.log('⚠️  WARNING: System health needs attention');
        } else {
            console.log('✅ GOOD: System health is acceptable');
        }
        
        console.log('\n🗂️  Database Status:');
        Object.entries(this.healthResults.databases).forEach(([key, db]) => {
            const icon = db.status === 'healthy' ? '✅' : '❌';
            console.log(`  ${icon} ${db.name}: ${db.status}`);
        });
        
        console.log('\n🌐 Service Status:');
        Object.entries(this.healthResults.services).forEach(([key, service]) => {
            const icon = service.status === 'healthy' ? '✅' : '❌';
            const critical = service.critical ? '🔥' : '  ';
            console.log(`  ${icon} ${critical} ${service.name}: ${service.status}`);
        });
        
        if (this.healthResults.issues.length > 0) {
            console.log('\n🚨 Issues Found:');
            this.healthResults.issues.forEach((issue, index) => {
                console.log(`  ${index + 1}. ${issue}`);
            });
        }
    }
    
    generateRecommendations() {
        this.healthResults.recommendations = [];
        
        // Critical service issues
        const criticalDown = Object.values(this.healthResults.services)
            .filter(s => s.critical && s.status !== 'healthy');
        
        if (criticalDown.length > 0) {
            this.healthResults.recommendations.push('🔥 Start critical services: docker-compose up -d');
            console.log('🔥 URGENT: Start critical services with: docker-compose up -d');
        }
        
        // Database issues
        const missingDbs = Object.values(this.healthResults.databases)
            .filter(d => d.status === 'missing');
        
        if (missingDbs.length > 0) {
            this.healthResults.recommendations.push('📁 Create missing database directories');
            console.log('📁 Create missing database directories: mkdir -p databases');
        }
        
        // Port conflicts
        if (this.healthResults.overall < 80) {
            this.healthResults.recommendations.push('🔧 Fix port conflicts by updating services to use standardized ports');
            console.log('🔧 Update services to use standardized ports from .env.template');
        }
        
        // Environment sync
        if (!fs.existsSync('.env')) {
            this.healthResults.recommendations.push('📋 Copy .env.template to .env and configure');
            console.log('📋 Copy: cp .env.template .env');
        }
        
        console.log('\n💡 Next Steps:');
        console.log('1. Copy .env.template to .env if not done already');
        console.log('2. Start Docker services: docker-compose up -d');
        console.log('3. Run this health check again to verify improvements');
        console.log('4. Check Master System Controller: http://localhost:9999');
    }
    
    async executeCommand(command, args, options = {}) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, options);
            let output = '';
            let error = '';
            
            child.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                error += data.toString();
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(error || `Command failed with code ${code}`));
                }
            });
            
            child.on('error', (err) => {
                reject(err);
            });
        });
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Run the health verification
async function main() {
    try {
        const verifier = new SystemHealthVerifier();
        const results = await verifier.verifySystemHealth();
        
        // Save results to file
        fs.writeFileSync(
            'system-health-report.json',
            JSON.stringify(results, null, 2)
        );
        
        console.log('\n📄 Full report saved to: system-health-report.json');
        
        // Exit with appropriate code
        process.exit(results.overall >= 80 ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Health verification failed:', error);
        process.exit(1);
    }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Health check interrupted');
    process.exit(1);
});

if (require.main === module) {
    main();
}

module.exports = { SystemHealthVerifier };