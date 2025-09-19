const http = require('http');
const https = require('https');

class APIConnectionFixer {
    constructor() {
        this.port = 1502;
        this.services = {
            auth: { port: 1337, name: 'Auth Foundation', url: 'http://localhost:1337' },
            sovereign: { port: 1338, name: 'Sovereign DB', url: 'http://localhost:1338' },
            employment: { port: 1339, name: 'Employment', url: 'http://localhost:1339' },
            enterprise: { port: 1340, name: 'Enterprise', url: 'http://localhost:1340' },
            diagnostic: { port: 1400, name: 'Diagnostic', url: 'http://localhost:1400' }
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🔧 API Connection Fixer starting...');
        
        // Test all services
        await this.testAllConnections();
        
        // Fix internal fetch issues
        this.setupInternalProxy();
        
        // Start monitoring server
        this.startServer();
    }
    
    async testAllConnections() {
        console.log('\n🔍 Testing service connections...\n');
        
        for (const [key, service] of Object.entries(this.services)) {
            const result = await this.testService(service);
            console.log(`${result.success ? '✅' : '❌'} ${service.name} (${service.port}): ${result.message}`);
        }
    }
    
    testService(service) {
        return new Promise((resolve) => {
            const req = http.get(`${service.url}/api/health`, { timeout: 5000 }, (res) => {
                if (res.statusCode === 200) {
                    resolve({ success: true, message: 'Connected successfully' });
                } else {
                    resolve({ success: false, message: `Status ${res.statusCode}` });
                }
                res.resume();
            });
            
            req.on('error', (err) => {
                if (err.code === 'ECONNREFUSED') {
                    resolve({ success: false, message: 'Connection refused - service not running' });
                } else if (err.code === 'ETIMEDOUT') {
                    resolve({ success: false, message: 'Timeout - service not responding' });
                } else {
                    resolve({ success: false, message: err.message });
                }
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({ success: false, message: 'Request timeout' });
            });
        });
    }
    
    setupInternalProxy() {
        // Create internal routing table
        this.routingTable = new Map();
        
        // Map common API patterns to correct services
        this.routingTable.set('/api/auth', 'auth');
        this.routingTable.set('/api/user', 'auth');
        this.routingTable.set('/api/login', 'auth');
        this.routingTable.set('/api/database', 'sovereign');
        this.routingTable.set('/api/data', 'sovereign');
        this.routingTable.set('/api/employee', 'employment');
        this.routingTable.set('/api/tax', 'employment');
        this.routingTable.set('/api/enterprise', 'enterprise');
        this.routingTable.set('/api/integration', 'enterprise');
        this.routingTable.set('/api/diagnostic', 'diagnostic');
        this.routingTable.set('/api/health', 'diagnostic');
        
        console.log('\n📡 Internal routing configured');
    }
    
    startServer() {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://localhost:${this.port}`);
            
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            // Special endpoints
            if (url.pathname === '/fix') {
                this.handleFix(req, res);
                return;
            }
            
            if (url.pathname === '/proxy') {
                this.handleProxy(req, res);
                return;
            }
            
            if (url.pathname === '/status') {
                this.handleStatus(req, res);
                return;
            }
            
            // Default response
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                service: 'API Connection Fixer',
                endpoints: {
                    '/status': 'Check all service status',
                    '/fix': 'Attempt to fix broken connections',
                    '/proxy?service=auth&path=/api/health': 'Proxy request to internal service'
                }
            }, null, 2));
        });
        
        server.listen(this.port, () => {
            console.log(`\n🔧 API Connection Fixer running on http://localhost:${this.port}\n`);
        });
    }
    
    async handleStatus(req, res) {
        const status = {};
        
        for (const [key, service] of Object.entries(this.services)) {
            const result = await this.testService(service);
            status[key] = {
                ...service,
                status: result.success ? 'online' : 'offline',
                message: result.message
            };
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }
    
    async handleFix(req, res) {
        const fixes = [];
        
        // Try to fix common issues
        for (const [key, service] of Object.entries(this.services)) {
            const result = await this.testService(service);
            
            if (!result.success) {
                // Attempt fixes based on error type
                if (result.message.includes('Connection refused')) {
                    fixes.push({
                        service: service.name,
                        issue: 'Not running',
                        action: 'Would start service (manual intervention needed)',
                        command: `node ${key.toUpperCase()}-SERVICE.js`
                    });
                } else if (result.message.includes('Timeout')) {
                    fixes.push({
                        service: service.name,
                        issue: 'Not responding',
                        action: 'Service may be overloaded or frozen'
                    });
                }
            }
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ fixes }, null, 2));
    }
    
    handleProxy(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const serviceName = url.searchParams.get('service');
        const path = url.searchParams.get('path') || '/';
        
        const service = this.services[serviceName];
        if (!service) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Service not found' }));
            return;
        }
        
        // Proxy the request
        const proxyReq = http.request({
            hostname: 'localhost',
            port: service.port,
            path: path,
            method: req.method,
            headers: req.headers
        }, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });
        
        proxyReq.on('error', (err) => {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
        });
        
        req.pipe(proxyReq);
    }
}

// Create a singleton instance
let fixer;

// Auto-fix function for other services to use
function autoFixConnection(serviceName, endpoint) {
    if (!fixer) {
        fixer = new APIConnectionFixer();
    }
    
    // Return a promise that attempts to connect with retry
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 3;
        
        const tryConnect = () => {
            attempts++;
            
            const service = fixer.services[serviceName];
            if (!service) {
                reject(new Error('Unknown service: ' + serviceName));
                return;
            }
            
            const req = http.get(`${service.url}${endpoint}`, { timeout: 5000 }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ status: res.statusCode, data });
                    } else if (attempts < maxAttempts) {
                        setTimeout(tryConnect, 1000 * attempts); // Exponential backoff
                    } else {
                        reject(new Error(`Failed after ${attempts} attempts: ${res.statusCode}`));
                    }
                });
            });
            
            req.on('error', (err) => {
                if (attempts < maxAttempts) {
                    console.log(`⚠️ Retry ${attempts}/${maxAttempts} for ${serviceName}${endpoint}`);
                    setTimeout(tryConnect, 1000 * attempts);
                } else {
                    reject(err);
                }
            });
        };
        
        tryConnect();
    });
}

// Start the fixer
if (require.main === module) {
    fixer = new APIConnectionFixer();
}

module.exports = { APIConnectionFixer, autoFixConnection };