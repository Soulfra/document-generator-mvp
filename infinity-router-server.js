#!/usr/bin/env node

/**
 * INFINITY ROUTER HTTP SERVER
 * HTTP wrapper for the Infinity Router System for Docker integration
 */

const http = require('http');
const InfinityRouterSystem = require('./infinity-router-system');

class InfinityRouterServer {
    constructor() {
        this.port = process.env.PORT || 8000;
        this.infinity = new InfinityRouterSystem();
        
        console.log('♾️ INFINITY ROUTER HTTP SERVER');
        console.log('=============================');
    }
    
    async start() {
        // Create HTTP server
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
        
        this.server.listen(this.port, () => {
            console.log(`✅ Infinity Router Server running on port ${this.port}`);
            console.log(`🔍 Health check: http://localhost:${this.port}/health`);
            console.log(`📊 Status: http://localhost:${this.port}/status`);
            console.log(`🚀 Route: http://localhost:${this.port}/route`);
            console.log(`🌌 Portal: http://localhost:${this.port}/portal`);
        });
    }
    
    handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        switch (url.pathname) {
            case '/':
                this.serveHome(res);
                break;
                
            case '/health':
                this.serveHealth(res);
                break;
                
            case '/status':
                this.serveStatus(res);
                break;
                
            case '/route':
                this.handleRoute(req, res);
                break;
                
            case '/portal':
                this.handlePortal(req, res);
                break;
                
            default:
                res.writeHead(404);
                res.end('Not Found');
        }
    }
    
    serveHome(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Infinity Router System</title>
    <style>
        body {
            font-family: monospace;
            background: #0a0a0a;
            color: #0ff;
            margin: 20px;
        }
        h1 { color: #fff; text-align: center; }
        .section { border: 1px solid #0ff; padding: 20px; margin: 10px 0; background: #111; }
        .quantum { border-color: #f0f; color: #f0f; }
        .portal { border-color: #ff0; color: #ff0; }
        button { background: #0ff; color: #000; border: none; padding: 10px 20px; cursor: pointer; margin: 5px; }
        button:hover { background: #0aa; }
        .status { margin: 10px 0; }
    </style>
</head>
<body>
    <h1>♾️ Infinity Router System</h1>
    
    <div class="section">
        <h2>🚀 Quantum Routing</h2>
        <p>Route through infinite possibilities using quantum mechanics.</p>
        <button onclick="routeStandard()">Standard Route</button>
        <button onclick="routeQuantum()">Quantum Route</button>
        <button onclick="routeTranscendent()">Transcendent Route</button>
    </div>
    
    <div class="section quantum">
        <h2>🌀 Quantum Pathways</h2>
        <p>Experience superposition, entanglement, and quantum tunneling.</p>
        <button onclick="testQuantum()">Test Quantum Superposition</button>
        <button onclick="testEntanglement()">Test Entanglement</button>
    </div>
    
    <div class="section portal">
        <h2>🌌 Portal Management</h2>
        <p>Open portals to different universes and dimensions.</p>
        <button onclick="openPortal()">Open Portal</button>
        <button onclick="closePortals()">Close All Portals</button>
    </div>
    
    <div class="section">
        <h2>📊 System Status</h2>
        <div id="status">Loading...</div>
    </div>
    
    <script>
        async function routeStandard() {
            const result = await routeRequest({
                start: 'web_interface',
                end: 'destination_alpha',
                pathway: 'standard'
            });
            alert('Route Result: ' + JSON.stringify(result, null, 2));
        }
        
        async function routeQuantum() {
            const result = await routeRequest({
                start: 'quantum_state',
                end: 'superposition',
                pathway: 'quantum',
                experimental: true
            });
            alert('Quantum Route: ' + JSON.stringify(result, null, 2));
        }
        
        async function routeTranscendent() {
            const result = await routeRequest({
                start: 'consciousness',
                end: 'enlightenment',
                pathway: 'transcendent',
                enlightened: true
            });
            alert('Transcendent Route: ' + JSON.stringify(result, null, 2));
        }
        
        async function testQuantum() {
            const result = await routeRequest({
                start: 'here',
                end: 'everywhere',
                pathway: 'quantum',
                universe: 'universe-13'
            });
            alert('Quantum Test: Universe probability = ' + Math.random());
        }
        
        async function testEntanglement() {
            const result = await routeRequest({
                start: 'particle_a',
                end: 'particle_b',
                pathway: 'quantum',
                entangled: true
            });
            alert('Entanglement achieved across infinite distance!');
        }
        
        async function openPortal() {
            const res = await fetch('/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: 'parallel_universe_' + Math.floor(Math.random() * 42)
                })
            });
            const portal = await res.json();
            alert('Portal Opened: ' + JSON.stringify(portal, null, 2));
        }
        
        async function closePortals() {
            alert('All portals closed. Returning to standard reality.');
        }
        
        async function routeRequest(params) {
            const res = await fetch('/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            return await res.json();
        }
        
        async function updateStatus() {
            const res = await fetch('/status');
            const status = await res.json();
            document.getElementById('status').innerHTML = '<pre>' + JSON.stringify(status, null, 2) + '</pre>';
        }
        
        // Update status on load and every 15 seconds
        updateStatus();
        setInterval(updateStatus, 15000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveHealth(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            service: 'infinity-router',
            quantumState: this.infinity.quantumState,
            activePathways: this.infinity.activePathways,
            infinityLevel: this.infinity.infinityLevel,
            timestamp: new Date().toISOString()
        }));
    }
    
    serveStatus(res) {
        const status = this.infinity.getInfinityStatus();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }
    
    async handleRoute(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405);
            res.end('Method Not Allowed');
            return;
        }
        
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const request = JSON.parse(body);
                const result = await this.infinity.routeThroughInfinity(request);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result, null, 2));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    async handlePortal(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405);
            res.end('Method Not Allowed');
            return;
        }
        
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const request = JSON.parse(body);
                const portal = await this.infinity.openPortal(request.destination);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(portal, null, 2));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
}

// Export for use in other modules
module.exports = InfinityRouterServer;

// Run if executed directly
if (require.main === module) {
    const server = new InfinityRouterServer();
    server.start().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down Infinity Router Server...');
        process.exit(0);
    });
}