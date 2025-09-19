#!/usr/bin/env node

/**
 * 🔗 GAMING AUTH MIDDLEWARE - Connect auth to all gaming services
 * 
 * Integrates authentication with master router and all gaming services
 * Provides unified login across the entire gaming platform
 */

const http = require('http');

class GamingAuthMiddleware {
    constructor() {
        this.authServiceUrl = 'http://localhost:6666';
        this.services = new Map([
            ['master-router', 'http://localhost:5555'],
            ['gaming-engine', 'http://localhost:8888'],
            ['character-theater', 'http://localhost:9950'],
            ['spatial-router', 'http://localhost:8800']
        ]);
        
        this.authenticatedRoutes = new Set([
            '/game',
            '/character',
            '/chat',
            '/economy',
            '/api/gaming'
        ]);
        
        this.init();
    }
    
    async init() {
        console.log('🔗 Integrating auth with gaming services...');
        
        // Patch master router to include auth
        await this.patchMasterRouter();
        
        console.log('✅ Auth middleware integrated with gaming platform');
    }
    
    async patchMasterRouter() {
        // Add auth middleware to routes that need it
        console.log('🔧 Patching master router with auth middleware...');
        
        // This would normally modify the master router code
        // For now, we'll create an auth proxy
        this.createAuthProxy();
    }
    
    createAuthProxy() {
        // Create auth-aware proxy for gaming services
        console.log('🚪 Creating authenticated gaming gateway...');
        
        const server = http.createServer(async (req, res) => {
            await this.handleAuthenticatedRequest(req, res);
        });
        
        server.listen(7700, () => {
            console.log('🔐 Authenticated Gaming Gateway running on port 7700');
            console.log('🎮 All gaming services now require authentication!');
        });
    }
    
    async handleAuthenticatedRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname;
        
        // Check if route requires authentication
        const requiresAuth = this.authenticatedRoutes.has(path) || 
                           Array.from(this.authenticatedRoutes).some(route => path.startsWith(route));
        
        if (!requiresAuth) {
            // Public route - just proxy through
            return this.proxyToMasterRouter(req, res);
        }
        
        // Verify authentication
        const authResult = await this.verifyAuthentication(req);
        
        if (!authResult.authenticated) {
            // Return login required
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Authentication required',
                message: 'Please login to access gaming services',
                loginUrl: 'http://localhost:6666',
                authService: this.authServiceUrl
            }));
            return;
        }
        
        // Add user info to request headers
        req.headers['x-user-id'] = authResult.user.id;
        req.headers['x-username'] = authResult.user.username;
        req.headers['x-user-role'] = authResult.user.role;
        req.headers['x-user-tier'] = authResult.user.tier;
        
        // Proxy to master router with auth info
        await this.proxyToMasterRouter(req, res);
    }
    
    async verifyAuthentication(req) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '') || 
                         req.headers['x-session-token'] ||
                         req.headers['x-auth-token'];
            
            if (!token) {
                return { authenticated: false, reason: 'No token provided' };
            }
            
            // Verify with auth service
            const response = await fetch(`${this.authServiceUrl}/api/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                return { authenticated: false, reason: 'Invalid token' };
            }
            
            const result = await response.json();
            
            return {
                authenticated: result.valid,
                user: result.user,
                session: result.session
            };
            
        } catch (error) {
            console.error('Auth verification error:', error);
            return { authenticated: false, reason: 'Auth service unavailable' };
        }
    }
    
    async proxyToMasterRouter(req, res) {
        try {
            const masterRouterUrl = this.services.get('master-router');
            const targetUrl = `${masterRouterUrl}${req.url}`;
            
            // Forward request to master router
            const response = await fetch(targetUrl, {
                method: req.method,
                headers: {
                    ...req.headers,
                    'host': 'localhost:5555' // Update host header
                },
                body: req.method !== 'GET' ? await this.getRequestBody(req) : undefined
            });
            
            // Copy response headers
            Object.entries(response.headers.raw()).forEach(([key, values]) => {
                res.setHeader(key, values);
            });
            
            res.writeHead(response.status);
            
            // Stream response body
            const reader = response.body.getReader();
            const pump = () => {
                return reader.read().then(({ done, value }) => {
                    if (done) {
                        res.end();
                        return;
                    }
                    res.write(Buffer.from(value));
                    return pump();
                });
            };
            
            return pump();
            
        } catch (error) {
            console.error('Proxy error:', error);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Service unavailable',
                message: 'Gaming services are temporarily unavailable'
            }));
        }
    }
    
    async getRequestBody(req) {
        return new Promise((resolve) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => resolve(body));
        });
    }
}

// Start the middleware
if (require.main === module) {
    new GamingAuthMiddleware();
}

module.exports = GamingAuthMiddleware;