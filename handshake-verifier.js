#!/usr/bin/env node

/**
 * 🤝✅ HANDSHAKE VERIFIER SYSTEM
 * =============================
 * Tests all handshakes and shows what's actually working
 * Verifies connections between all your systems
 */

const fs = require('fs').promises;
const http = require('http');
const crypto = require('crypto');
const path = require('path');

class HandshakeVerifier {
    constructor() {
        this.port = 5555;
        
        // All systems to verify
        this.systems = new Map([
            ['centipede-os', { port: 2222, status: 'unknown', handshake: null }],
            ['minimap-eyeball', { port: 3333, status: 'unknown', handshake: null }],
            ['collection-log', { port: 4444, status: 'unknown', handshake: null }],
            ['infinite-layers', { port: 11111, status: 'unknown', handshake: null }],
            ['matrix-game', { port: 8888, status: 'unknown', handshake: null }],
            ['hollowtown', { port: 8888, status: 'unknown', handshake: null }] // Same as matrix
        ]);
        
        // Handshake tests to run
        this.handshakeTests = [
            {
                name: 'Lost User Handshake',
                trigger: "I'm lost, what should I do?",
                expectedResponse: /suggest|recommend|build|next/i,
                systems: ['collection-log'],
                confidence: 0.9
            },
            {
                name: 'Build Request Handshake',
                trigger: "Build something cool",
                expectedResponse: /build|create|suggest|ready/i,
                systems: ['collection-log'],
                confidence: 0.8
            },
            {
                name: 'Eye Focus Handshake',
                trigger: "Focus on centipede zone",
                expectedResponse: /focus|building|segment/i,
                systems: ['minimap-eyeball'],
                confidence: 0.7
            },
            {
                name: 'Segment Process Handshake',
                trigger: "/api/process/head",
                expectedResponse: /success|proof|segment/i,
                systems: ['centipede-os'],
                confidence: 0.8
            },
            {
                name: 'Layer Navigation Handshake',
                trigger: "/api/layers",
                expectedResponse: /layer|symlink|element/i,
                systems: ['infinite-layers'],
                confidence: 0.7
            },
            {
                name: 'Matrix Integration Handshake',
                trigger: "/api/levels",
                expectedResponse: /level|domingo|boss/i,
                systems: ['matrix-game'],
                confidence: 0.6
            }
        ];
        
        // Verification results
        this.verificationResults = {
            systemStatus: new Map(),
            handshakeResults: [],
            overallHealth: 0,
            lastVerification: null,
            recommendations: []
        };
        
        // Real-time monitoring
        this.monitoring = {
            enabled: true,
            interval: 10000, // 10 seconds
            alerts: [],
            uptime: new Map()
        };
    }
    
    async initialize() {
        console.log('🤝✅ HANDSHAKE VERIFIER SYSTEM INITIALIZING...');
        console.log('===============================================');
        console.log('🔍 Scanning for active systems...');
        console.log('🤝 Testing handshake protocols...');
        console.log('⚡ Setting up real-time monitoring...');
        console.log('📊 Generating verification report...');
        console.log('');
        
        await this.scanSystems();
        await this.testHandshakes();
        await this.startMonitoring();
        await this.startVerifierServer();
    }
    
    async scanSystems() {
        console.log('🔍 Scanning systems...');
        
        for (const [systemName, system] of this.systems) {
            try {
                const response = await this.checkSystemHealth(system.port);
                system.status = response.healthy ? 'online' : 'offline';
                system.handshake = response;
                
                if (response.healthy) {
                    console.log(`   ✅ ${systemName}: ONLINE (port ${system.port})`);
                } else {
                    console.log(`   ❌ ${systemName}: OFFLINE (port ${system.port})`);
                }
            } catch (error) {
                system.status = 'error';
                system.handshake = { error: error.message };
                console.log(`   🔥 ${systemName}: ERROR - ${error.message}`);
            }
        }
        
        const online = Array.from(this.systems.values()).filter(s => s.status === 'online').length;
        const total = this.systems.size;
        console.log(`\n📊 System Status: ${online}/${total} systems online`);
    }
    
    async checkSystemHealth(port) {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: port,
                path: '/',
                method: 'GET',
                timeout: 3000
            }, (res) => {
                resolve({
                    healthy: res.statusCode === 200,
                    statusCode: res.statusCode,
                    responseTime: Date.now()
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    healthy: false,
                    error: error.message,
                    responseTime: null
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    healthy: false,
                    error: 'timeout',
                    responseTime: null
                });
            });
            
            req.end();
        });
    }
    
    async testHandshakes() {
        console.log('\n🤝 Testing handshakes...');
        
        for (const test of this.handshakeTests) {
            console.log(`\n   Testing: ${test.name}`);
            
            const results = [];
            
            for (const systemName of test.systems) {
                const system = this.systems.get(systemName);
                
                if (!system || system.status !== 'online') {
                    results.push({
                        system: systemName,
                        success: false,
                        reason: 'system offline',
                        response: null
                    });
                    console.log(`     ❌ ${systemName}: System offline`);
                    continue;
                }
                
                try {
                    const handshakeResult = await this.performHandshake(system.port, test.trigger);
                    const success = test.expectedResponse.test(handshakeResult.response || '');
                    
                    results.push({
                        system: systemName,
                        success: success,
                        reason: success ? 'handshake successful' : 'unexpected response',
                        response: handshakeResult.response?.substring(0, 100) + '...',
                        responseTime: handshakeResult.responseTime
                    });
                    
                    if (success) {
                        console.log(`     ✅ ${systemName}: Handshake successful`);
                    } else {
                        console.log(`     ⚠️ ${systemName}: Unexpected response`);
                    }
                } catch (error) {
                    results.push({
                        system: systemName,
                        success: false,
                        reason: error.message,
                        response: null
                    });
                    console.log(`     🔥 ${systemName}: ${error.message}`);
                }
            }
            
            this.verificationResults.handshakeResults.push({
                ...test,
                results: results,
                overallSuccess: results.every(r => r.success),
                timestamp: Date.now()
            });
        }
        
        // Calculate overall health
        const totalTests = this.verificationResults.handshakeResults.length;
        const successfulTests = this.verificationResults.handshakeResults.filter(t => t.overallSuccess).length;
        this.verificationResults.overallHealth = Math.round((successfulTests / totalTests) * 100);
        
        console.log(`\n📊 Handshake Health: ${this.verificationResults.overallHealth}%`);
    }
    
    async performHandshake(port, trigger) {
        const startTime = Date.now();
        
        // Different handshake methods based on trigger
        if (trigger.startsWith('/api/')) {
            // API endpoint test
            return this.testAPIEndpoint(port, trigger);
        } else {
            // Message-based handshake
            return this.testMessageHandshake(port, trigger);
        }
    }
    
    async testAPIEndpoint(port, endpoint) {
        return new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port: port,
                path: endpoint,
                method: 'GET',
                timeout: 5000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        response: data,
                        responseTime: Date.now(),
                        statusCode: res.statusCode
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('API timeout'));
            });
            
            req.end();
        });
    }
    
    async testMessageHandshake(port, message) {
        return new Promise((resolve, reject) => {
            const encodedMessage = encodeURIComponent(message);
            const req = http.request({
                hostname: 'localhost',
                port: port,
                path: `/api/message/${encodedMessage}`,
                method: 'GET',
                timeout: 5000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve({
                            response: parsed.response || parsed.suggestions || data,
                            responseTime: Date.now(),
                            statusCode: res.statusCode
                        });
                    } catch (error) {
                        resolve({
                            response: data,
                            responseTime: Date.now(),
                            statusCode: res.statusCode
                        });
                    }
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Message timeout'));
            });
            
            req.end();
        });
    }
    
    async startMonitoring() {
        console.log('\n⚡ Starting real-time monitoring...');
        
        setInterval(async () => {
            if (!this.monitoring.enabled) return;
            
            // Quick health check of all systems
            for (const [systemName, system] of this.systems) {
                const health = await this.checkSystemHealth(system.port);
                const wasOnline = system.status === 'online';
                const isOnline = health.healthy;
                
                if (wasOnline && !isOnline) {
                    this.monitoring.alerts.push({
                        type: 'system-down',
                        system: systemName,
                        timestamp: Date.now(),
                        message: `${systemName} went offline`
                    });
                    console.log(`⚠️ ALERT: ${systemName} went offline!`);
                } else if (!wasOnline && isOnline) {
                    this.monitoring.alerts.push({
                        type: 'system-up',
                        system: systemName,
                        timestamp: Date.now(),
                        message: `${systemName} came online`
                    });
                    console.log(`✅ RECOVERY: ${systemName} came online!`);
                }
                
                system.status = isOnline ? 'online' : 'offline';
                system.handshake = health;
            }
        }, this.monitoring.interval);
        
        console.log(`   ✅ Monitoring active (${this.monitoring.interval/1000}s intervals)`);
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        // Check for offline systems
        const offlineSystems = Array.from(this.systems.entries())
            .filter(([name, system]) => system.status !== 'online');
        
        if (offlineSystems.length > 0) {
            recommendations.push({
                type: 'critical',
                title: 'Offline Systems Detected',
                description: `${offlineSystems.length} systems are offline: ${offlineSystems.map(([name]) => name).join(', ')}`,
                action: 'Start these systems using their launch scripts'
            });
        }
        
        // Check handshake health
        if (this.verificationResults.overallHealth < 70) {
            recommendations.push({
                type: 'warning',
                title: 'Poor Handshake Health',
                description: `Only ${this.verificationResults.overallHealth}% of handshakes are working`,
                action: 'Review failed handshakes and fix integration issues'
            });
        }
        
        // Check for missing integrations
        const onlineSystems = Array.from(this.systems.entries())
            .filter(([name, system]) => system.status === 'online')
            .map(([name]) => name);
        
        if (onlineSystems.length >= 2 && this.verificationResults.overallHealth < 100) {
            recommendations.push({
                type: 'improvement',
                title: 'Integration Opportunities',
                description: 'Multiple systems are online but not fully integrated',
                action: 'Test cross-system handshakes and add missing API endpoints'
            });
        }
        
        return recommendations;
    }
    
    async startVerifierServer() {
        const server = http.createServer(async (req, res) => {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            
            if (req.url === '/') {
                res.end(await this.generateVerifierInterface());
            } else if (req.url === '/api/status') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    systems: Array.from(this.systems.entries()),
                    verificationResults: this.verificationResults,
                    monitoring: this.monitoring,
                    recommendations: this.generateRecommendations()
                }));
            } else if (req.url === '/api/retest') {
                await this.testHandshakes();
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, results: this.verificationResults }));
            } else if (req.url === '/api/rescan') {
                await this.scanSystems();
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, systems: Array.from(this.systems.entries()) }));
            }
        });
        
        server.listen(this.port, () => {
            console.log(`\n🤝 HANDSHAKE VERIFIER SYSTEM ACTIVE`);
            console.log(`✅ Interface: http://localhost:${this.port}`);
            console.log(`\n📊 VERIFICATION SUMMARY:`);
            console.log(`   • Systems Scanned: ${this.systems.size}`);
            console.log(`   • Handshake Tests: ${this.handshakeTests.length}`);
            console.log(`   • Overall Health: ${this.verificationResults.overallHealth}%`);
            console.log(`   • Monitoring: ${this.monitoring.enabled ? 'Active' : 'Disabled'}`);
            console.log(`\n🎯 FEATURES:`);
            console.log(`   • Real-time system health monitoring`);
            console.log(`   • Automated handshake testing`);
            console.log(`   • Integration verification`);
            console.log(`   • Smart recommendations`);
            console.log(`   • Alert system for failures`);
            console.log(`\n🔄 LIVE MONITORING:`);
            console.log(`   • Scans all systems every ${this.monitoring.interval/1000} seconds`);
            console.log(`   • Alerts when systems go up/down`);
            console.log(`   • Tracks handshake success rates`);
        });
    }
    
    async generateVerifierInterface() {
        const onlineSystems = Array.from(this.systems.values()).filter(s => s.status === 'online').length;
        const successfulHandshakes = this.verificationResults.handshakeResults.filter(h => h.overallSuccess).length;
        const recommendations = this.generateRecommendations();
        
        return `<!DOCTYPE html>
<html>
<head>
    <title>Handshake Verifier - System Health Dashboard</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        
        body {
            font-family: 'JetBrains Mono', monospace;
            background: #000;
            color: #00ff41;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        h1 {
            font-size: 3em;
            margin: 0;
            color: #00ff41;
            text-shadow: 0 0 20px #00ff41;
        }
        
        .health-overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .health-card {
            background: rgba(0, 255, 65, 0.1);
            border: 2px solid #00ff41;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
        }
        
        .health-card.warning {
            border-color: #ffff00;
            background: rgba(255, 255, 0, 0.1);
            color: #ffff00;
        }
        
        .health-card.critical {
            border-color: #ff4444;
            background: rgba(255, 68, 68, 0.1);
            color: #ff4444;
        }
        
        .health-number {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .systems-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .system-card {
            background: rgba(0, 255, 255, 0.05);
            border: 1px solid #00ffff;
            border-radius: 10px;
            padding: 20px;
        }
        
        .system-card h3 {
            color: #00ffff;
            margin: 0 0 15px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .status-indicator {
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.8em;
            font-weight: bold;
        }
        
        .status-online {
            background: #00ff41;
            color: #000;
        }
        
        .status-offline {
            background: #ff4444;
            color: #fff;
        }
        
        .status-error {
            background: #ff8800;
            color: #000;
        }
        
        .handshake-tests {
            margin: 30px 0;
        }
        
        .test-result {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 5px;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid;
        }
        
        .test-result.success {
            border-left-color: #00ff41;
        }
        
        .test-result.failure {
            border-left-color: #ff4444;
        }
        
        .test-result.partial {
            border-left-color: #ffff00;
        }
        
        .recommendations {
            background: rgba(255, 0, 255, 0.1);
            border: 2px solid #ff00ff;
            border-radius: 10px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .recommendations h3 {
            color: #ff00ff;
            margin: 0 0 15px 0;
        }
        
        .recommendation {
            background: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid;
        }
        
        .recommendation.critical {
            border-left-color: #ff4444;
        }
        
        .recommendation.warning {
            border-left-color: #ffff00;
        }
        
        .recommendation.improvement {
            border-left-color: #00ff41;
        }
        
        .controls {
            display: flex;
            gap: 15px;
            margin: 30px 0;
            justify-content: center;
        }
        
        .control-button {
            background: #00ff41;
            color: #000;
            border: none;
            padding: 12px 25px;
            border-radius: 5px;
            cursor: pointer;
            font-family: inherit;
            font-weight: bold;
            transition: all 0.3s;
        }
        
        .control-button:hover {
            background: #00cc33;
            transform: scale(1.05);
        }
        
        .control-button.warning {
            background: #ffff00;
        }
        
        .control-button.critical {
            background: #ff4444;
            color: #fff;
        }
        
        .monitoring-status {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ffff;
            padding: 15px;
            border-radius: 10px;
            min-width: 200px;
        }
        
        .monitoring-status h4 {
            margin: 0 0 10px 0;
            color: #00ffff;
        }
        
        .alert {
            background: rgba(255, 68, 68, 0.2);
            border: 1px solid #ff4444;
            border-radius: 5px;
            padding: 10px;
            margin: 5px 0;
            font-size: 0.9em;
        }
        
        .realtime-updates {
            color: #888;
            font-size: 0.9em;
            text-align: center;
            margin: 20px 0;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .updating {
            animation: pulse 1s infinite;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤝✅ HANDSHAKE VERIFIER</h1>
            <p>System Health Dashboard & Integration Testing</p>
        </div>
        
        <div class="monitoring-status">
            <h4>🔄 Live Monitoring</h4>
            <div>Status: <span style="color: #00ff41;">ACTIVE</span></div>
            <div>Interval: ${this.monitoring.interval/1000}s</div>
            <div>Alerts: <span id="alertCount">${this.monitoring.alerts.length}</span></div>
            ${this.monitoring.alerts.slice(-3).map(alert => `
                <div class="alert">${alert.message}</div>
            `).join('')}
        </div>
        
        <div class="health-overview">
            <div class="health-card ${onlineSystems < this.systems.size ? 'warning' : ''}">
                <div>🖥️ SYSTEMS ONLINE</div>
                <div class="health-number">${onlineSystems}/${this.systems.size}</div>
                <div>${Math.round((onlineSystems/this.systems.size)*100)}% operational</div>
            </div>
            <div class="health-card ${this.verificationResults.overallHealth < 70 ? 'critical' : this.verificationResults.overallHealth < 90 ? 'warning' : ''}">
                <div>🤝 HANDSHAKE HEALTH</div>
                <div class="health-number">${this.verificationResults.overallHealth}%</div>
                <div>${successfulHandshakes}/${this.handshakeTests.length} tests passing</div>
            </div>
            <div class="health-card ${recommendations.filter(r => r.type === 'critical').length > 0 ? 'critical' : ''}">
                <div>⚠️ RECOMMENDATIONS</div>
                <div class="health-number">${recommendations.length}</div>
                <div>action items</div>
            </div>
            <div class="health-card">
                <div>⏱️ LAST VERIFIED</div>
                <div class="health-number" style="font-size: 1.5em;">NOW</div>
                <div>real-time monitoring</div>
            </div>
        </div>
        
        <div class="controls">
            <button class="control-button" onclick="rescanSystems()">🔍 Rescan Systems</button>
            <button class="control-button" onclick="retestHandshakes()">🤝 Retest Handshakes</button>
            <button class="control-button warning" onclick="toggleMonitoring()">⏸️ Pause Monitoring</button>
            <button class="control-button critical" onclick="clearAlerts()">🔔 Clear Alerts</button>
        </div>
        
        <div class="systems-grid">
            ${Array.from(this.systems.entries()).map(([name, system]) => `
                <div class="system-card">
                    <h3>
                        ${name.toUpperCase()}
                        <span class="status-indicator status-${system.status}">${system.status.toUpperCase()}</span>
                    </h3>
                    <div>Port: ${system.port}</div>
                    ${system.handshake ? `
                        <div>Response Time: ${system.handshake.responseTime ? (Date.now() - system.handshake.responseTime) + 'ms' : 'N/A'}</div>
                        ${system.handshake.error ? `<div style="color: #ff4444;">Error: ${system.handshake.error}</div>` : ''}
                    ` : ''}
                    <div style="margin-top: 10px;">
                        <a href="http://localhost:${system.port}" target="_blank" style="color: #00ffff;">Open Interface</a>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="handshake-tests">
            <h2>🤝 Handshake Test Results</h2>
            ${this.verificationResults.handshakeResults.map(test => `
                <div class="test-result ${test.overallSuccess ? 'success' : test.results.some(r => r.success) ? 'partial' : 'failure'}">
                    <h4>${test.name} ${test.overallSuccess ? '✅' : test.results.some(r => r.success) ? '⚠️' : '❌'}</h4>
                    <div>Trigger: "${test.trigger}"</div>
                    <div>Expected: ${test.expectedResponse.source}</div>
                    <div>Systems: ${test.systems.join(', ')}</div>
                    ${test.results.map(result => `
                        <div style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 3px;">
                            <strong>${result.system}:</strong> ${result.success ? '✅ Success' : '❌ ' + result.reason}
                            ${result.response ? `<br><small style="color: #888;">Response: ${result.response}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
        
        ${recommendations.length > 0 ? `
            <div class="recommendations">
                <h3>💡 SMART RECOMMENDATIONS</h3>
                ${recommendations.map(rec => `
                    <div class="recommendation ${rec.type}">
                        <h4>${rec.title}</h4>
                        <div>${rec.description}</div>
                        <div style="margin-top: 10px; color: #00ff41;"><strong>Action:</strong> ${rec.action}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div class="realtime-updates">
            🔄 Dashboard updates automatically every 10 seconds
        </div>
    </div>
    
    <script>
        async function rescanSystems() {
            document.querySelector('.container').classList.add('updating');
            try {
                const response = await fetch('/api/rescan');
                const data = await response.json();
                if (data.success) {
                    location.reload();
                }
            } catch (error) {
                alert('Rescan failed: ' + error.message);
            }
            document.querySelector('.container').classList.remove('updating');
        }
        
        async function retestHandshakes() {
            document.querySelector('.container').classList.add('updating');
            try {
                const response = await fetch('/api/retest');
                const data = await response.json();
                if (data.success) {
                    location.reload();
                }
            } catch (error) {
                alert('Retest failed: ' + error.message);
            }
            document.querySelector('.container').classList.remove('updating');
        }
        
        function toggleMonitoring() {
            // Would toggle monitoring on/off
            alert('Monitoring toggle not implemented yet');
        }
        
        function clearAlerts() {
            document.getElementById('alertCount').textContent = '0';
            document.querySelectorAll('.alert').forEach(el => el.remove());
        }
        
        // Auto-refresh every 10 seconds
        setInterval(() => {
            fetch('/api/status')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('alertCount').textContent = data.monitoring.alerts.length;
                })
                .catch(console.error);
        }, 10000);
    </script>
</body>
</html>`;
    }
}

// Initialize the handshake verifier
const verifier = new HandshakeVerifier();
verifier.initialize().catch(error => {
    console.error('❌ Failed to initialize Handshake Verifier:', error);
});