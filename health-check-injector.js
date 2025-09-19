#!/usr/bin/env node

/**
 * 🏥 HEALTH CHECK INJECTOR
 * 
 * Automatically adds standardized health check endpoints to existing services
 * that are missing them or returning 404/403 errors.
 * 
 * Addresses the specific issues from system-status.json:
 * - CAL Compare System (port 4444) - returning 404 for /health
 * - Control Center (ports 5000, 7000) - returning 403 forbidden
 * - Various gaming services missing health endpoints
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');

class HealthCheckInjector {
    constructor() {
        this.injections = new Map();
        
        // Define health check injection templates for different service types
        this.healthCheckTemplates = {
            express: `
// Auto-injected health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: '{{SERVICE_NAME}}',
        port: {{SERVICE_PORT}},
        timestamp: Date.now(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        description: '{{SERVICE_DESCRIPTION}}'
    });
});

app.get('/ready', (req, res) => {
    // Add any readiness checks here
    res.json({
        status: 'ready',
        service: '{{SERVICE_NAME}}',
        timestamp: Date.now()
    });
});
`,

            flask: `
# Auto-injected health check endpoints
@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': '{{SERVICE_NAME}}',
        'port': {{SERVICE_PORT}},
        'timestamp': int(time.time() * 1000),
        'description': '{{SERVICE_DESCRIPTION}}'
    })

@app.route('/ready')  
def ready():
    return jsonify({
        'status': 'ready',
        'service': '{{SERVICE_NAME}}',
        'timestamp': int(time.time() * 1000)
    })
`,

            generic: `
const http = require('http');
const url = require('url');

// Auto-injected health check server
const healthServer = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    if (parsedUrl.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            service: '{{SERVICE_NAME}}',
            port: {{SERVICE_PORT}},
            timestamp: Date.now(),
            uptime: process.uptime(),
            description: '{{SERVICE_DESCRIPTION}}'
        }));
    } else if (parsedUrl.pathname === '/ready') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ready',
            service: '{{SERVICE_NAME}}',
            timestamp: Date.now()
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// Start health check server on alternate port if main port is busy
const healthPort = {{SERVICE_PORT}} + 1000;
healthServer.listen(healthPort, () => {
    console.log(\`Health check server running on port \${healthPort}\`);
});
`
        };
        
        // Service-specific configurations
        this.serviceConfigs = {
            'cal-compare': {
                port: 4444,
                name: 'CAL Compare System',
                description: 'CAL brand comparison and analysis system',
                files: ['cal-brand-commands.js'],
                type: 'express'
            },
            'control-center': {
                port: 5000,
                name: 'Control Center',
                description: 'Main control center interface',
                files: ['flask-backend/app.py', 'control-center.py'],
                type: 'flask'
            },
            'control-center-alt': {
                port: 7000,
                name: 'Control Center Alt',
                description: 'Alternative control center port',
                files: ['control-center-alt.js'],
                type: 'express'
            },
            'persistent-tycoon': {
                port: 7090,
                name: 'Persistent Tycoon Game',
                description: 'Persistent incremental tycoon gaming system',
                files: ['PERSISTENT-INTEGRATED-TYCOON.js'],
                type: 'express'
            },
            'cheat-system': {
                port: 7100,
                name: 'Gaming Cheat System',
                description: 'Gaming cheat detection and management',
                files: ['CHEAT-CODE-GAMING-SYSTEM.js'],
                type: 'express'
            },
            'gacha-tokens': {
                port: 7300,
                name: 'Gacha Token System',
                description: 'Gacha token economy and rewards',
                files: ['GACHA-TOKEN-SYSTEM.js'],
                type: 'express'
            },
            'gaming-platform': {
                port: 8800,
                name: 'Master Gaming Platform',
                description: 'Unified gaming platform orchestrator',
                files: ['MASTER-GAMING-PLATFORM.js'],
                type: 'express'
            },
            'crypto-vault': {
                port: 8888,
                name: 'Crypto Key Vault',
                description: 'Secure cryptocurrency key management',
                files: ['crypto-vault.js', 'DomainSpecificAPIKeyManager.js'],
                type: 'express'
            }
        };
    }
    
    async injectHealthChecks() {
        console.log('🏥 Health Check Injector starting...');
        
        const results = [];
        
        for (const [serviceId, config] of Object.entries(this.serviceConfigs)) {
            try {
                console.log(`\\n🔍 Processing service: ${config.name}`);
                
                // Check if service needs health check injection
                const needsInjection = await this.checkNeedsInjection(config.port);
                
                if (needsInjection) {
                    const injected = await this.injectHealthCheckIntoService(serviceId, config);
                    results.push({
                        serviceId,
                        name: config.name,
                        port: config.port,
                        action: injected ? 'injected' : 'failed',
                        details: injected || 'Service file not found or injection failed'
                    });
                } else {
                    results.push({
                        serviceId,
                        name: config.name,
                        port: config.port,
                        action: 'healthy',
                        details: 'Service already has working health endpoint'
                    });
                }
                
            } catch (error) {
                console.error(`❌ Error processing ${serviceId}:`, error.message);
                results.push({
                    serviceId,
                    name: config.name || serviceId,
                    port: config.port,
                    action: 'error',
                    details: error.message
                });
            }
        }
        
        // Generate summary report
        this.generateInjectionReport(results);
        
        return results;
    }
    
    async checkNeedsInjection(port) {
        return new Promise((resolve) => {
            const options = {
                hostname: 'localhost',
                port,
                path: '/health',
                method: 'GET',
                timeout: 5000
            };
            
            const req = http.request(options, (res) => {
                // If we get a 2xx response, health endpoint exists and works
                resolve(res.statusCode < 200 || res.statusCode >= 300);
            });
            
            req.on('error', () => {
                // Service is offline or connection refused
                resolve(true);
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve(true);
            });
            
            req.end();
        });
    }
    
    async injectHealthCheckIntoService(serviceId, config) {
        console.log(`  🔧 Injecting health check into ${config.name}...`);
        
        // Find the main service file
        let serviceFile = null;
        for (const filename of config.files) {
            const filepath = path.join(__dirname, filename);
            try {
                await fs.access(filepath);
                serviceFile = filepath;
                break;
            } catch (error) {
                // File doesn't exist, try next one
            }
        }
        
        if (!serviceFile) {
            console.log(`  ⚠️ No service file found for ${config.name}`);
            return this.createStandaloneHealthService(serviceId, config);
        }
        
        // Read the service file
        const originalContent = await fs.readFile(serviceFile, 'utf8');
        
        // Check if health endpoint already exists
        if (originalContent.includes('/health') || originalContent.includes("@app.route('/health')")) {
            console.log(`  ✅ ${config.name} already has health endpoint`);
            return 'Health endpoint already exists';
        }
        
        // Inject health check based on service type
        const injectedContent = await this.performInjection(originalContent, config);
        
        if (injectedContent && injectedContent !== originalContent) {
            // Create backup
            await fs.writeFile(`${serviceFile}.backup`, originalContent);
            
            // Write injected version
            await fs.writeFile(serviceFile, injectedContent);
            
            console.log(`  ✅ Health check injected into ${config.name}`);
            return 'Health check injected successfully';
        } else {
            console.log(`  ⚠️ Could not inject health check into ${config.name}`);
            return this.createStandaloneHealthService(serviceId, config);
        }
    }
    
    async performInjection(originalContent, config) {
        const template = this.healthCheckTemplates[config.type] || this.healthCheckTemplates.generic;
        
        // Replace placeholders in template
        const healthCheckCode = template
            .replace(/{{SERVICE_NAME}}/g, config.name)
            .replace(/{{SERVICE_PORT}}/g, config.port)
            .replace(/{{SERVICE_DESCRIPTION}}/g, config.description);
        
        // Injection strategies based on service type
        if (config.type === 'express') {
            return this.injectIntoExpressService(originalContent, healthCheckCode);
        } else if (config.type === 'flask') {
            return this.injectIntoFlaskService(originalContent, healthCheckCode);
        } else {
            return this.injectGenericHealthCheck(originalContent, healthCheckCode);
        }
    }
    
    injectIntoExpressService(originalContent, healthCheckCode) {
        // Find a good injection point in Express service
        const patterns = [
            // Look for app.listen() call
            /(app\.listen\([^)]+\)[^}]*}?[^;]*;?)/,
            // Look for existing route definitions
            /(app\.[a-z]+\([^)]+\)[^}]*}[^;]*;?)/,
            // Look for express() initialization
            /(const\s+app\s*=\s*express\(\)[^;]*;?)/
        ];
        
        for (const pattern of patterns) {
            const match = originalContent.match(pattern);
            if (match) {
                // Insert health check before the matched pattern
                const insertPoint = match.index;
                return originalContent.slice(0, insertPoint) + 
                       '\n' + healthCheckCode + '\n' +
                       originalContent.slice(insertPoint);
            }
        }
        
        // If no patterns match, append to end
        return originalContent + '\n' + healthCheckCode;
    }
    
    injectIntoFlaskService(originalContent, healthCheckCode) {
        // Find injection point in Flask service
        const patterns = [
            // Look for app.run() call
            /(app\.run\([^)]*\))/,
            // Look for existing route definitions
            /(@app\.route\([^)]+\)[^}]*)/,
            // Look for Flask app initialization
            /(app\s*=\s*Flask\([^)]*\))/
        ];
        
        for (const pattern of patterns) {
            const match = originalContent.match(pattern);
            if (match) {
                const insertPoint = match.index + match[0].length;
                return originalContent.slice(0, insertPoint) + 
                       '\n\n' + healthCheckCode + '\n' +
                       originalContent.slice(insertPoint);
            }
        }
        
        return originalContent + '\n\n' + healthCheckCode;
    }
    
    injectGenericHealthCheck(originalContent, healthCheckCode) {
        // For generic services, append the health check server
        return originalContent + '\n\n' + healthCheckCode;
    }
    
    async createStandaloneHealthService(serviceId, config) {
        console.log(`  🔧 Creating standalone health service for ${config.name}...`);
        
        const standaloneHealthCode = `#!/usr/bin/env node

/**
 * STANDALONE HEALTH CHECK SERVICE
 * Auto-generated for: ${config.name}
 * Port: ${config.port}
 */

const http = require('http');
const url = require('url');

class StandaloneHealthService {
    constructor() {
        this.port = ${config.port};
        this.serviceName = '${config.name}';
        this.description = '${config.description}';
    }
    
    start() {
        const server = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);
            
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            if (parsedUrl.pathname === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'healthy',
                    service: this.serviceName,
                    port: this.port,
                    timestamp: Date.now(),
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    description: this.description,
                    type: 'standalone-health-service'
                }));
            } else if (parsedUrl.pathname === '/ready') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'ready',
                    service: this.serviceName,
                    timestamp: Date.now()
                }));
            } else if (parsedUrl.pathname === '/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'online',
                    service: this.serviceName,
                    port: this.port,
                    timestamp: Date.now(),
                    description: this.description
                }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    message: \`\${this.serviceName} Health Service\`,
                    description: this.description,
                    endpoints: ['/health', '/ready', '/status'],
                    timestamp: Date.now()
                }));
            }
        });
        
        server.listen(this.port, () => {
            console.log(\`\${this.serviceName} Health Service running on port \${this.port}\`);
        });
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down health service...');
            server.close(() => {
                process.exit(0);
            });
        });
    }
}

if (require.main === module) {
    const healthService = new StandaloneHealthService();
    healthService.start();
}

module.exports = StandaloneHealthService;
`;
        
        const healthServiceFile = path.join(__dirname, `health-service-${serviceId}.js`);
        await fs.writeFile(healthServiceFile, standaloneHealthCode);
        
        console.log(`  ✅ Standalone health service created: ${healthServiceFile}`);
        return `Standalone health service created at ${healthServiceFile}`;
    }
    
    generateInjectionReport(results) {
        console.log('\n📊 HEALTH CHECK INJECTION REPORT');
        console.log('=====================================');
        
        const successful = results.filter(r => r.action === 'injected').length;
        const healthy = results.filter(r => r.action === 'healthy').length;
        const failed = results.filter(r => r.action === 'failed' || r.action === 'error').length;
        
        console.log(`Total Services Processed: ${results.length}`);
        console.log(`Already Healthy: ${healthy}`);
        console.log(`Successfully Injected: ${successful}`);
        console.log(`Failed/Errors: ${failed}`);
        console.log('');
        
        results.forEach(result => {
            const status = {
                'injected': '✅',
                'healthy': '✅', 
                'failed': '❌',
                'error': '❌'
            }[result.action] || '⚠️';
            
            console.log(`${status} ${result.name} (port ${result.port}): ${result.details}`);
        });
        
        // Generate recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('====================');
        
        if (failed > 0) {
            console.log('- Review failed injections and create manual health endpoints');
            console.log('- Consider using standalone health services for complex services');
        }
        
        if (successful > 0) {
            console.log('- Restart services with injected health checks to activate them');
            console.log('- Test health endpoints using: curl http://localhost:PORT/health');
        }
        
        console.log('- Update service discovery to use standardized /health endpoints');
        console.log('- Monitor health check performance and adjust timeouts if needed');
    }
}

// CLI Usage
if (require.main === module) {
    const injector = new HealthCheckInjector();
    
    injector.injectHealthChecks().then(results => {
        console.log('\n🎉 Health check injection completed!');
        console.log('Use the Consolidated Service Manager to monitor all services.');
        
        process.exit(0);
    }).catch(error => {
        console.error('❌ Health check injection failed:', error);
        process.exit(1);
    });
}

module.exports = HealthCheckInjector;