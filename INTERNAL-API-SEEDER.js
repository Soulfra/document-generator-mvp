const http = require('http');
const crypto = require('crypto');

class InternalAPISeeder {
    constructor() {
        this.port = 1503;
        this.seedData = {
            // Auth Foundation seed data
            auth: {
                users: [
                    { id: 'admin', email: 'admin@empire.local', password: 'admin123', role: 'admin' },
                    { id: 'test', email: 'test@empire.local', password: 'test123', role: 'user' }
                ],
                sessions: new Map(),
                tokens: new Map()
            },
            
            // Sovereign Database seed data
            sovereign: {
                contracts: [
                    { id: 'terms-v1', type: 'terms', content: 'Standard terms of service', active: true },
                    { id: 'privacy-v1', type: 'privacy', content: 'Privacy policy', active: true }
                ],
                entities: new Map(),
                relationships: new Map()
            },
            
            // Employment system seed data
            employment: {
                employees: [
                    { id: 'emp-001', taxId: '123-45-6789', status: 'active', type: '1099' },
                    { id: 'emp-002', taxId: '987-65-4321', status: 'active', type: 'W2' }
                ],
                payroll: new Map(),
                taxDocuments: new Map()
            },
            
            // Enterprise integration seed data
            enterprise: {
                integrations: [
                    { id: 'quickbooks', status: 'connected', lastSync: new Date() },
                    { id: 'github', status: 'connected', lastSync: new Date() }
                ],
                differentials: new Map(),
                credits: new Map([['default', 100]])
            }
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🌱 Internal API Seeder initializing...');
        
        // Create internal API endpoints
        this.server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', '*');
            res.setHeader('Access-Control-Allow-Headers', '*');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = new URL(req.url, `http://localhost:${this.port}`);
            
            // Route to appropriate handler
            if (url.pathname.startsWith('/auth')) {
                this.handleAuth(req, res, url);
            } else if (url.pathname.startsWith('/sovereign')) {
                this.handleSovereign(req, res, url);
            } else if (url.pathname.startsWith('/employment')) {
                this.handleEmployment(req, res, url);
            } else if (url.pathname.startsWith('/enterprise')) {
                this.handleEnterprise(req, res, url);
            } else if (url.pathname === '/seed-all') {
                this.seedAllServices(req, res);
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    service: 'Internal API Seeder',
                    endpoints: {
                        '/seed-all': 'Seed all services with test data',
                        '/auth/*': 'Auth Foundation mock endpoints',
                        '/sovereign/*': 'Sovereign Database mock endpoints',
                        '/employment/*': 'Employment System mock endpoints',
                        '/enterprise/*': 'Enterprise Integration mock endpoints'
                    }
                }, null, 2));
            }
        });
        
        this.server.listen(this.port, () => {
            console.log(`\n🌱 Internal API Seeder running on http://localhost:${this.port}`);
            console.log('📡 This provides mock API responses to fix internal fetch issues\n');
        });
    }
    
    handleAuth(req, res, url) {
        const path = url.pathname.replace('/auth', '');
        
        switch (path) {
            case '/login':
                this.handleLogin(req, res);
                break;
                
            case '/verify':
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    valid: true,
                    user: this.seedData.auth.users[0]
                }));
                break;
                
            case '/boards':
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    boards: [
                        { id: 'tycoon', name: 'Persistent Tycoon', status: 'active' },
                        { id: 'gacha', name: 'Gacha Token System', status: 'active' },
                        { id: 'debug', name: 'Debug Game', status: 'active' }
                    ]
                }));
                break;
                
            default:
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', service: 'auth' }));
        }
    }
    
    handleLogin(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const token = crypto.randomBytes(32).toString('hex');
            const session = {
                token,
                user: this.seedData.auth.users[0],
                created: new Date()
            };
            
            this.seedData.auth.sessions.set(token, session);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                token,
                user: session.user
            }));
        });
    }
    
    handleSovereign(req, res, url) {
        const path = url.pathname.replace('/sovereign', '');
        
        switch (path) {
            case '/contracts':
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    contracts: this.seedData.sovereign.contracts
                }));
                break;
                
            case '/unify':
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    unified: true,
                    databases: ['auth', 'employment', 'enterprise'],
                    timestamp: new Date()
                }));
                break;
                
            default:
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', service: 'sovereign' }));
        }
    }
    
    handleEmployment(req, res, url) {
        const path = url.pathname.replace('/employment', '');
        
        switch (path) {
            case '/employees':
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    employees: this.seedData.employment.employees
                }));
                break;
                
            case '/generate-1099':
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    documentId: '1099-' + Date.now(),
                    status: 'generated'
                }));
                break;
                
            default:
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', service: 'employment' }));
        }
    }
    
    handleEnterprise(req, res, url) {
        const path = url.pathname.replace('/enterprise', '');
        
        switch (path) {
            case '/integrations':
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    integrations: this.seedData.enterprise.integrations
                }));
                break;
                
            case '/credits':
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    credits: Object.fromEntries(this.seedData.enterprise.credits),
                    rate: 100,
                    bugPenalty: -5
                }));
                break;
                
            case '/differential':
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    differential: {
                        changes: Math.floor(Math.random() * 100),
                        additions: Math.floor(Math.random() * 50),
                        deletions: Math.floor(Math.random() * 20)
                    },
                    timestamp: new Date()
                }));
                break;
                
            default:
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', service: 'enterprise' }));
        }
    }
    
    seedAllServices(req, res) {
        // Simulate seeding all services
        const results = {
            seeded: {
                auth: {
                    users: this.seedData.auth.users.length,
                    sessions: this.seedData.auth.sessions.size
                },
                sovereign: {
                    contracts: this.seedData.sovereign.contracts.length,
                    entities: this.seedData.sovereign.entities.size
                },
                employment: {
                    employees: this.seedData.employment.employees.length,
                    documents: this.seedData.employment.taxDocuments.size
                },
                enterprise: {
                    integrations: this.seedData.enterprise.integrations.length,
                    credits: this.seedData.enterprise.credits.size
                }
            },
            timestamp: new Date()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results, null, 2));
    }
}

// Create global fetch interceptor for internal APIs
const originalFetch = global.fetch;
const seeder = new InternalAPISeeder();

// Override fetch to redirect internal API calls to our seeder
if (typeof global.fetch === 'function') {
    global.fetch = async function(url, options) {
        // Check if this is an internal API call
        if (url.includes('localhost:1337') || 
            url.includes('localhost:1338') ||
            url.includes('localhost:1339') ||
            url.includes('localhost:1340')) {
            
            // Extract the path
            const urlObj = new URL(url);
            let newPath = '';
            
            if (url.includes(':1337')) newPath = '/auth' + urlObj.pathname;
            else if (url.includes(':1338')) newPath = '/sovereign' + urlObj.pathname;
            else if (url.includes(':1339')) newPath = '/employment' + urlObj.pathname;
            else if (url.includes(':1340')) newPath = '/enterprise' + urlObj.pathname;
            
            // Redirect to our seeder
            const newUrl = `http://localhost:1503${newPath}`;
            console.log(`🔄 Redirecting ${url} → ${newUrl}`);
            
            return originalFetch(newUrl, options);
        }
        
        // Otherwise use original fetch
        return originalFetch(url, options);
    };
}

module.exports = seeder;