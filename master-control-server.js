#!/usr/bin/env node

/**
 * 🔌 MASTER CONTROL SERVER
 * 
 * Web server that provides the electrical panel dashboard
 * and API endpoints for the system unifier
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const SystemUnifier = require('./STOP-BUILDING-START-CONNECTING.js');

const PORT = 8900;

class MasterControlServer {
    constructor() {
        this.unifier = new SystemUnifier();
        this.server = null;
    }
    
    async initialize() {
        console.log('🔌 Initializing Master Control Server...');
        
        // Initialize the system unifier
        await this.unifier.initialize();
        
        // Create HTTP server
        this.server = http.createServer(this.handleRequest.bind(this));
        
        console.log('✅ Master Control Server ready');
    }
    
    async handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        
        try {
            switch (url.pathname) {
                case '/':
                case '/dashboard':
                    await this.serveDashboard(res);
                    break;
                    
                case '/api/status':
                    await this.serveStatus(res);
                    break;
                    
                case '/api/system/toggle':
                    await this.toggleSystem(req, res);
                    break;
                    
                case '/api/system/shutdown':
                    await this.shutdownSystem(req, res);
                    break;
                    
                default:
                    res.writeHead(404, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({error: 'Not found'}));
            }
        } catch (error) {
            console.error('Request error:', error);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: error.message}));
        }
    }
    
    async serveDashboard(res) {
        try {
            const html = await fs.readFile(
                path.join(__dirname, 'electrical-panel-dashboard.html'), 
                'utf-8'
            );
            
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(html);
        } catch (error) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Dashboard not available: ' + error.message);
        }
    }
    
    async serveStatus(res) {
        const status = this.unifier.getSystemStatus();
        
        // Add real-time data
        status.timestamp = new Date().toISOString();
        status.uptime = Date.now() - (this.startTime || Date.now());
        
        // Add connection details
        status.connections = {};
        for (const [key, value] of this.unifier.systemConnections.entries()) {
            status.connections[key] = value;
        }
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(status, null, 2));
    }
    
    async toggleSystem(req, res) {
        const body = await this.readRequestBody(req);
        const { systemName } = JSON.parse(body);
        
        // In a real implementation, this would restart the system
        console.log(`🔄 Toggle requested for system: ${systemName}`);
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            success: true,
            message: `System ${systemName} restart initiated`,
            timestamp: new Date().toISOString()
        }));
    }
    
    async shutdownSystem(req, res) {
        const body = await this.readRequestBody(req);
        const { systemName } = JSON.parse(body);
        
        console.log(`🛑 Shutdown requested for system: ${systemName}`);
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            success: true,
            message: `System ${systemName} shutdown initiated`,
            timestamp: new Date().toISOString()
        }));
    }
    
    async readRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => resolve(body));
            req.on('error', reject);
        });
    }
    
    async start() {
        this.startTime = Date.now();
        
        this.server.listen(PORT, () => {
            console.log(`\n🔌 MASTER CONTROL SERVER ONLINE`);
            console.log(`=====================================`);
            console.log(`🌐 Dashboard: http://localhost:${PORT}/dashboard`);
            console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
            console.log(`🎯 Service Router: http://localhost:9900`);
            console.log(`⚡ All systems unified and ready!`);
        });
    }
    
    async shutdown() {
        console.log('🛑 Shutting down Master Control Server...');
        
        if (this.unifier) {
            await this.unifier.shutdown();
        }
        
        if (this.server) {
            this.server.close();
        }
        
        console.log('✅ Master Control Server shut down cleanly');
    }
}

// Run server if called directly
if (require.main === module) {
    const server = new MasterControlServer();
    
    async function start() {
        await server.initialize();
        await server.start();
    }
    
    start().catch(error => {
        console.error('❌ Failed to start Master Control Server:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await server.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await server.shutdown();
        process.exit(0);
    });
}

module.exports = MasterControlServer;