#!/usr/bin/env node

/**
 * GUARDIAN TEACHER HTTP SERVER
 * HTTP wrapper for the Guardian Teacher System for Docker integration
 */

const http = require('http');
const GuardianTeacherSystem = require('./guardian-teacher-system');

class GuardianTeacherServer {
    constructor() {
        this.port = process.env.PORT || 9999;
        this.guardian = new GuardianTeacherSystem();
        
        console.log('🛡️📚 GUARDIAN TEACHER HTTP SERVER');
        console.log('===============================');
    }
    
    async start() {
        // Initialize the Guardian Teacher System
        await this.guardian.init();
        
        // Create HTTP server
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
        
        this.server.listen(this.port, () => {
            console.log(`✅ Guardian Teacher Server running on port ${this.port}`);
            console.log(`🔍 Health check: http://localhost:${this.port}/health`);
            console.log(`📊 Status: http://localhost:${this.port}/status`);
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
                
            case '/teach':
                this.handleTeach(req, res);
                break;
                
            case '/alert':
                this.handleAlert(req, res);
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
    <title>Guardian Teacher System</title>
    <style>
        body {
            font-family: monospace;
            background: #0a0a0a;
            color: #0f0;
            margin: 20px;
        }
        h1 { color: #fff; text-align: center; }
        .section { border: 1px solid #0f0; padding: 20px; margin: 10px 0; background: #111; }
        .alert { border-color: #f00; color: #f00; }
        button { background: #0f0; color: #000; border: none; padding: 10px 20px; cursor: pointer; margin: 5px; }
        button:hover { background: #0a0; }
        .status { margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🛡️📚 Guardian Teacher System</h1>
    
    <div class="section">
        <h2>🛡️ Guardian Monitoring</h2>
        <p>Real-time monitoring for critical situations and system issues.</p>
        <button onclick="testAlert()">Test Emergency Alert</button>
        <button onclick="checkStatus()">Check Status</button>
    </div>
    
    <div class="section">
        <h2>📚 Teacher Mode</h2>
        <p>Interactive teaching and learning system.</p>
        <button onclick="teachConcept()">Teach ELOOP Errors</button>
        <button onclick="demonstrateSolution()">Demonstrate Solution</button>
    </div>
    
    <div class="section">
        <h2>📊 System Status</h2>
        <div id="status">Loading...</div>
    </div>
    
    <script>
        async function testAlert() {
            const res = await fetch('/alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level: 'WARNING',
                    situation: 'Test alert from web interface',
                    details: { source: 'web', test: true }
                })
            });
            const result = await res.json();
            alert('Alert ID: ' + result.alertId);
            updateStatus();
        }
        
        async function teachConcept() {
            const res = await fetch('/teach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    concept: 'ELOOP_ERRORS',
                    context: { currentSituation: 'Web interface demonstration' }
                })
            });
            const result = await res.json();
            alert('Teaching Result: ' + result.success);
            updateStatus();
        }
        
        async function demonstrateSolution() {
            const res = await fetch('/teach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'demonstrate',
                    problem: 'ELOOP_FIX'
                })
            });
            const result = await res.json();
            alert('Demonstration completed');
            updateStatus();
        }
        
        async function checkStatus() {
            await updateStatus();
        }
        
        async function updateStatus() {
            const res = await fetch('/status');
            const status = await res.json();
            document.getElementById('status').innerHTML = '<pre>' + JSON.stringify(status, null, 2) + '</pre>';
        }
        
        // Update status on load and every 30 seconds
        updateStatus();
        setInterval(updateStatus, 30000);
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
            service: 'guardian-teacher',
            guardianActive: this.guardian.guardianActive,
            teacherMode: this.guardian.teacherMode,
            timestamp: new Date().toISOString()
        }));
    }
    
    serveStatus(res) {
        const status = this.guardian.getGuardianStatus();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }
    
    async handleTeach(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405);
            res.end('Method Not Allowed');
            return;
        }
        
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                if (data.concept) {
                    const success = this.guardian.explainConcept(data.concept, data.context || {});
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success, concept: data.concept }));
                } else if (data.action === 'demonstrate') {
                    this.guardian.demonstrateSolution(data.problem);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, action: 'demonstrate' }));
                } else {
                    res.writeHead(400);
                    res.end('Invalid request');
                }
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    async handleAlert(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405);
            res.end('Method Not Allowed');
            return;
        }
        
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const alertId = this.guardian.alertGuardian(
                    data.level || 'INFO',
                    data.situation || 'Alert from HTTP API',
                    data.details || {}
                );
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ alertId, timestamp: new Date().toISOString() }));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
}

// Export for use in other modules
module.exports = GuardianTeacherServer;

// Run if executed directly
if (require.main === module) {
    const server = new GuardianTeacherServer();
    server.start().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down Guardian Teacher Server...');
        process.exit(0);
    });
}