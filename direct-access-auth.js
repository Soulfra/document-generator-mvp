#!/usr/bin/env node

/**
 * 🔑 DIRECT ACCESS AUTHENTICATION SYSTEM
 * 
 * Simple authentication like looking up public records:
 * - Master API key for direct access
 * - Admin bypass mode (development)
 * - No bureaucratic OAuth flows
 * - Direct portal access with minimal barriers
 * 
 * Think: GIS property lookup, not government office visits
 */

const express = require('express');
const crypto = require('crypto');
const path = require('path');

class DirectAccessAuth {
    constructor(port = 7001) {
        this.app = express();
        this.port = port;
        
        // Simple configuration - like public records access keys
        this.masterKeys = new Set([
            'admin-key-12345',           // Development master key
            'public-records-access-key', // Public data access key
            'portal-master-key',         // Portal access key
            'document-generator-key'     // Document system key
        ]);
        
        // Simple sessions - no complex token management
        this.activeSessions = new Map();
        
        // Admin bypass mode (like having access to all public records)
        this.bypassMode = process.env.BYPASS_AUTH === 'true' || false;
        
        console.log('🔑 DIRECT ACCESS AUTHENTICATION SYSTEM');
        console.log('=====================================');
        console.log('✅ Simple API key authentication');
        console.log('✅ Admin bypass mode available');
        console.log('✅ No OAuth complexity');
        console.log('🗂️ Works like public records lookup');
        
        if (this.bypassMode) {
            console.log('🚫 BYPASS MODE ACTIVE - All auth disabled');
        }
        
        this.setupExpress();
        this.setupRoutes();
    }
    
    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Simple CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
            next();
        });
        
        // Simple logging
        this.app.use((req, res, next) => {
            console.log(`${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }
    
    setupRoutes() {
        // Main access portal (like public records homepage)
        this.app.get('/', this.serveAccessPortal.bind(this));
        
        // Simple key-based login
        this.app.post('/access/login', this.handleKeyLogin.bind(this));
        
        // Admin bypass login
        this.app.post('/access/admin', this.handleAdminAccess.bind(this));
        
        // Check access status
        this.app.get('/access/status', this.checkAccess.bind(this));
        
        // Simple logout
        this.app.post('/access/logout', this.handleLogout.bind(this));
        
        // Portal redirect (direct access after auth)
        this.app.get('/portal', this.portalAccess.bind(this));
        
        // Direct document access (like looking up specific records)
        this.app.get('/documents/:id?', this.documentAccess.bind(this));
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'Direct Access Auth',
                bypassMode: this.bypassMode,
                timestamp: new Date()
            });
        });
    }
    
    async serveAccessPortal(req, res) {
        const sessionKey = this.getSessionKey(req);
        const hasAccess = this.bypassMode || this.activeSessions.has(sessionKey);
        
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔑 Direct Access Portal</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: #ecf0f1;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            background: rgba(52, 73, 94, 0.9);
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            text-align: center;
            border: 2px solid #3498db;
        }
        
        .header {
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.2em;
            margin-bottom: 10px;
            color: #3498db;
        }
        
        .subtitle {
            font-size: 1.1em;
            opacity: 0.8;
            margin-bottom: 20px;
        }
        
        .access-form {
            background: rgba(44, 62, 80, 0.8);
            border-radius: 8px;
            padding: 25px;
            margin: 20px 0;
        }
        
        .input-group {
            margin-bottom: 20px;
            text-align: left;
        }
        
        .input-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #bdc3c7;
        }
        
        .input-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #34495e;
            border-radius: 6px;
            background: #2c3e50;
            color: #ecf0f1;
            font-size: 16px;
            font-family: 'Courier New', monospace;
        }
        
        .input-group input:focus {
            border-color: #3498db;
            outline: none;
        }
        
        .access-button {
            background: #3498db;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            margin: 10px;
            transition: all 0.3s ease;
            font-family: 'Courier New', monospace;
        }
        
        .access-button:hover {
            background: #2980b9;
            transform: translateY(-2px);
        }
        
        .bypass-button {
            background: #e74c3c;
        }
        
        .bypass-button:hover {
            background: #c0392b;
        }
        
        .features {
            margin-top: 30px;
            text-align: left;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            padding: 8px 0;
            opacity: 0.9;
        }
        
        .feature-icon {
            margin-right: 12px;
            font-size: 1.2em;
        }
        
        .status-message {
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
        }
        
        .success {
            background: rgba(39, 174, 96, 0.2);
            border: 1px solid #27ae60;
            color: #2ecc71;
        }
        
        .warning {
            background: rgba(241, 196, 15, 0.2);
            border: 1px solid #f1c40f;
            color: #f39c12;
        }
        
        .access-links {
            margin-top: 30px;
            display: grid;
            gap: 15px;
        }
        
        .access-link {
            display: block;
            padding: 15px;
            background: rgba(26, 188, 156, 0.2);
            border: 1px solid #1abc9c;
            border-radius: 6px;
            color: #1abc9c;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .access-link:hover {
            background: rgba(26, 188, 156, 0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔑 Direct Access Portal</h1>
            <p class="subtitle">Simple authentication like public records lookup</p>
        </div>
        
        ${this.bypassMode ? this.renderBypassMode() : ''}
        ${hasAccess ? this.renderAccessGranted() : this.renderLoginForm()}
        
        <div class="features">
            <div class="feature-item">
                <span class="feature-icon">🗂️</span>
                <span>Direct access like GIS property lookup</span>
            </div>
            <div class="feature-item">
                <span class="feature-icon">🔑</span>
                <span>Simple API key authentication</span>
            </div>
            <div class="feature-item">
                <span class="feature-icon">⚡</span>
                <span>No bureaucratic OAuth flows</span>
            </div>
            <div class="feature-item">
                <span class="feature-icon">🚫</span>
                <span>Admin bypass mode for development</span>
            </div>
        </div>
    </div>
    
    <script>
        async function login(event) {
            event.preventDefault();
            
            const apiKey = document.getElementById('apiKey').value;
            const username = document.getElementById('username').value;
            
            try {
                const response = await fetch('/access/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ apiKey, username })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    localStorage.setItem('accessKey', result.sessionKey);
                    window.location.reload();
                } else {
                    alert('Access denied: ' + result.message);
                }
            } catch (error) {
                alert('Login failed: ' + error.message);
            }
        }
        
        async function adminBypass() {
            try {
                const response = await fetch('/access/admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ bypass: true })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    localStorage.setItem('accessKey', result.sessionKey);
                    window.location.reload();
                } else {
                    alert('Admin access failed: ' + result.message);
                }
            } catch (error) {
                alert('Admin bypass failed: ' + error.message);
            }
        }
        
        async function logout() {
            try {
                await fetch('/access/logout', { method: 'POST' });
                localStorage.removeItem('accessKey');
                window.location.reload();
            } catch (error) {
                console.error('Logout failed:', error);
            }
        }
        
        // Auto-check access status
        window.addEventListener('load', async () => {
            const accessKey = localStorage.getItem('accessKey');
            if (accessKey) {
                try {
                    const response = await fetch('/access/status', {
                        headers: {
                            'Authorization': 'Bearer ' + accessKey
                        }
                    });
                    
                    if (!response.ok) {
                        localStorage.removeItem('accessKey');
                        window.location.reload();
                    }
                } catch (error) {
                    console.error('Status check failed:', error);
                }
            }
        });
    </script>
</body>
</html>`;
        
        res.send(html);
    }
    
    renderBypassMode() {
        return `
        <div class="status-message warning">
            🚫 BYPASS MODE ACTIVE - All authentication disabled for development
        </div>`;
    }
    
    renderLoginForm() {
        return `
        <form class="access-form" onsubmit="login(event)">
            <h3>🔑 Access Authentication</h3>
            <div class="input-group">
                <label for="username">Username (optional)</label>
                <input type="text" id="username" placeholder="admin, user, or leave blank">
            </div>
            <div class="input-group">
                <label for="apiKey">API Key</label>
                <input type="password" id="apiKey" placeholder="Enter your access key" required>
            </div>
            <button type="submit" class="access-button">🔑 Access Portal</button>
            <button type="button" class="access-button bypass-button" onclick="adminBypass()">
                🚫 Admin Bypass
            </button>
        </form>
        
        <div style="margin-top: 20px; font-size: 0.9em; opacity: 0.7;">
            <p><strong>Development Keys:</strong></p>
            <p>admin-key-12345</p>
            <p>portal-master-key</p>
            <p>document-generator-key</p>
        </div>`;
    }
    
    renderAccessGranted() {
        return `
        <div class="status-message success">
            ✅ ACCESS GRANTED - You have direct portal access
        </div>
        
        <div class="access-links">
            <a href="/portal" class="access-link">
                🌐 Document Generator Portal
            </a>
            <a href="/documents" class="access-link">
                📄 Direct Document Access
            </a>
            <a href="http://localhost:3333/portal" class="access-link">
                🔗 Legacy Portal (if running)
            </a>
        </div>
        
        <button onclick="logout()" class="access-button" style="background: #e74c3c; margin-top: 20px;">
            🚪 Logout
        </button>`;
    }
    
    async handleKeyLogin(req, res) {
        const { apiKey, username = 'user' } = req.body;
        
        // Bypass mode allows any login
        if (this.bypassMode) {
            const sessionKey = this.createSession(username, 'bypass');
            return res.json({
                success: true,
                message: 'Bypass mode - access granted',
                sessionKey,
                username
            });
        }
        
        // Check if API key is valid
        if (!this.masterKeys.has(apiKey)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid API key'
            });
        }
        
        // Create simple session
        const sessionKey = this.createSession(username, apiKey);
        
        res.json({
            success: true,
            message: 'Access granted',
            sessionKey,
            username
        });
    }
    
    async handleAdminAccess(req, res) {
        // Always allow admin bypass in development
        const sessionKey = this.createSession('admin', 'bypass');
        
        res.json({
            success: true,
            message: 'Admin bypass access granted',
            sessionKey,
            username: 'admin'
        });
    }
    
    async checkAccess(req, res) {
        const sessionKey = this.getSessionKey(req);
        
        if (this.bypassMode) {
            return res.json({
                hasAccess: true,
                username: 'bypass-user',
                method: 'bypass'
            });
        }
        
        if (!sessionKey || !this.activeSessions.has(sessionKey)) {
            return res.status(401).json({
                hasAccess: false,
                message: 'No valid session'
            });
        }
        
        const session = this.activeSessions.get(sessionKey);
        
        res.json({
            hasAccess: true,
            username: session.username,
            method: session.method,
            createdAt: session.createdAt
        });
    }
    
    async handleLogout(req, res) {
        const sessionKey = this.getSessionKey(req);
        
        if (sessionKey && this.activeSessions.has(sessionKey)) {
            this.activeSessions.delete(sessionKey);
        }
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    
    async portalAccess(req, res) {
        const sessionKey = this.getSessionKey(req);
        
        if (!this.bypassMode && (!sessionKey || !this.activeSessions.has(sessionKey))) {
            return res.redirect('/?redirect=portal');
        }
        
        // Redirect to actual portal or show simple landing
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Portal Access</title>
            <style>
                body { 
                    font-family: monospace; 
                    background: #2c3e50; 
                    color: #ecf0f1; 
                    padding: 40px; 
                    text-align: center; 
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: rgba(52, 73, 94, 0.9);
                    padding: 40px;
                    border-radius: 12px;
                }
                .access-link {
                    display: block;
                    padding: 15px;
                    margin: 15px 0;
                    background: #3498db;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    transition: background 0.3s ease;
                }
                .access-link:hover {
                    background: #2980b9;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🌐 Portal Access Granted</h1>
                <p>Direct access to document generation system</p>
                
                <a href="http://localhost:3333/portal" class="access-link">
                    📄 Document Generator Portal
                </a>
                
                <a href="http://localhost:8080" class="access-link">
                    🎯 Platform Hub (if running)
                </a>
                
                <a href="/documents" class="access-link">
                    📂 Direct Document Access
                </a>
                
                <a href="/" class="access-link" style="background: #95a5a6;">
                    🔙 Back to Access Portal
                </a>
            </div>
        </body>
        </html>
        `);
    }
    
    async documentAccess(req, res) {
        const sessionKey = this.getSessionKey(req);
        
        if (!this.bypassMode && (!sessionKey || !this.activeSessions.has(sessionKey))) {
            return res.status(401).json({
                error: 'Access denied - authentication required'
            });
        }
        
        // Simple document access (like public records lookup)
        const documentId = req.params.id;
        
        res.json({
            message: 'Document access granted',
            documentId: documentId || 'all',
            access: 'direct',
            timestamp: new Date()
        });
    }
    
    // Helper methods
    createSession(username, method) {
        const sessionKey = crypto.randomBytes(32).toString('hex');
        
        this.activeSessions.set(sessionKey, {
            username,
            method,
            createdAt: new Date(),
            lastActivity: new Date()
        });
        
        console.log(`✅ Session created for ${username} (${method})`);
        return sessionKey;
    }
    
    getSessionKey(req) {
        // Check Authorization header first
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.slice(7);
        }
        
        // Check query parameter
        if (req.query.session) {
            return req.query.session;
        }
        
        // Check cookies
        const cookies = req.headers.cookie;
        if (cookies) {
            const sessionMatch = cookies.match(/session=([^;]+)/);
            if (sessionMatch) {
                return sessionMatch[1];
            }
        }
        
        return null;
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log(`\n🔑 Direct Access Authentication Started!`);
            console.log(`======================================`);
            console.log(`\n🌐 Access portal at:`);
            console.log(`   http://localhost:${this.port}`);
            console.log(`\n🔑 Development API Keys:`);
            console.log(`   admin-key-12345`);
            console.log(`   portal-master-key`);
            console.log(`   document-generator-key`);
            console.log(`\n🚫 Admin Bypass:`);
            console.log(`   Click "Admin Bypass" button or set BYPASS_AUTH=true`);
            console.log(`\n💡 Usage:`);
            console.log(`   1. Enter any development key above`);
            console.log(`   2. Click "Access Portal" for direct access`);
            console.log(`   3. Or use "Admin Bypass" to skip all auth`);
            
            if (this.bypassMode) {
                console.log(`\n🚨 BYPASS MODE ACTIVE - All auth disabled`);
            }
            
            console.log(`\n🎯 Simple like GIS property lookup - no OAuth bureaucracy!\n`);
        });
    }
}

// Start the direct access system
if (require.main === module) {
    const port = process.env.PORT || 7001;
    const auth = new DirectAccessAuth(port);
    auth.start();
}

module.exports = DirectAccessAuth;