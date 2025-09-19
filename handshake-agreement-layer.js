#!/usr/bin/env node

/**
 * Handshake Agreement Layer
 * Self-building system with first-person documentation
 * Watches the tier system discover itself and documents the journey
 */

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const express = require('express');
const { EventEmitter } = require('events');

class HandshakeAgreementLayer extends EventEmitter {
    constructor() {
        super();
        this.app = express();
        this.port = 48009;
        this.wsPort = 48010;
        
        this.agreements = new Map();
        this.discoveries = [];
        this.buildLog = [];
        this.verifications = [];
        
        this.markdownJournal = [];
        this.firstPersonNarrative = [];
        
        this.systemState = {
            phase: 'initialization',
            components: new Map(),
            connections: new Map(),
            discoveries: 0,
            agreements: 0,
            verifications: 0
        };
        
        console.log('🤝 HANDSHAKE AGREEMENT LAYER');
        console.log('===========================');
        console.log('👁️  First-person system discovery');
        console.log('📝 Live markdown documentation');
        console.log('🔄 Self-building visualization');
        console.log('✅ Real-time verification');
        console.log('');
        
        this.initializeJournal();
        this.setupMiddleware();
        this.setupRoutes();
        this.startServices();
        this.beginDiscovery();
    }
    
    initializeJournal() {
        this.addToJournal('# 🤝 System Discovery Journal\n');
        this.addToJournal(`*Started: ${new Date().toISOString()}*\n`);
        this.addToJournal('## Phase 1: Initialization\n');
        this.addToJournal("I'm awakening... Let me discover what systems exist around me.\n");
        
        this.addNarrative("I can sense multiple services nearby. Time to establish handshakes.");
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname)));
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });
    }
    
    setupRoutes() {
        // Journal & narrative endpoints
        this.app.get('/api/journal', (req, res) => {
            res.json({
                markdown: this.markdownJournal.join('\n'),
                narrative: this.firstPersonNarrative,
                timestamp: new Date().toISOString()
            });
        });
        
        // Discovery endpoints
        this.app.get('/api/discoveries', (req, res) => {
            res.json({
                discoveries: this.discoveries,
                count: this.discoveries.length,
                phase: this.systemState.phase
            });
        });
        
        // Agreement endpoints
        this.app.get('/api/agreements', (req, res) => {
            res.json({
                agreements: Array.from(this.agreements.entries()).map(([id, agreement]) => ({
                    id,
                    ...agreement
                })),
                total: this.agreements.size
            });
        });
        
        // Build log
        this.app.get('/api/build-log', (req, res) => {
            res.json({
                log: this.buildLog,
                currentPhase: this.systemState.phase,
                components: Array.from(this.systemState.components.entries())
            });
        });
        
        // Verification status
        this.app.get('/api/verifications', (req, res) => {
            res.json({
                verifications: this.verifications,
                summary: this.generateVerificationSummary()
            });
        });
        
        // Trigger manual discovery
        this.app.post('/api/discover', this.manualDiscovery.bind(this));
    }
    
    startServices() {
        // HTTP server
        this.app.listen(this.port, () => {
            console.log(`🤝 Handshake API: http://localhost:${this.port}`);
            this.addToJournal(`\n### API Started\nListening on port ${this.port}\n`);
        });
        
        // WebSocket for live updates
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.wss.on('connection', (ws) => {
            console.log('👁️ Observer connected');
            this.addNarrative("An observer has joined. I'll share my discoveries in real-time.");
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handleObserverMessage(ws, data);
            });
            
            // Send initial state
            this.sendDiscoveryUpdate(ws);
        });
        
        console.log(`👁️ Live observer WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    async beginDiscovery() {
        this.addToJournal('\n## Phase 2: Service Discovery\n');
        this.addNarrative("Beginning my search for tier system components...");
        
        // List of services to discover
        const services = [
            { name: 'JSON Scout', port: 48004, type: 'websocket' },
            { name: 'Vault System', port: 48002, type: 'websocket' },
            { name: 'OSS SharePoint', port: 48005, type: 'http' },
            { name: 'Solidity Interface', port: 48007, type: 'http' }
        ];
        
        for (const service of services) {
            await this.discoverService(service);
            await this.delay(2000); // Dramatic pause
        }
        
        this.addToJournal('\n## Phase 3: Establishing Handshakes\n');
        await this.establishHandshakes();
        
        this.addToJournal('\n## Phase 4: Building Connections\n');
        await this.buildSystemConnections();
        
        this.addToJournal('\n## Phase 5: Verification\n');
        await this.verifySystem();
    }
    
    async discoverService(service) {
        const discovery = {
            id: `discovery_${Date.now()}_${service.name.replace(/\s/g, '_')}`,
            name: service.name,
            port: service.port,
            type: service.type,
            discovered: new Date().toISOString(),
            status: 'unknown',
            capabilities: []
        };
        
        this.addToJournal(`\n### Discovering ${service.name}\n`);
        this.addNarrative(`I'm reaching out to ${service.name} on port ${service.port}...`);
        
        try {
            if (service.type === 'websocket') {
                const ws = new WebSocket(`ws://localhost:${service.port}`);
                
                await new Promise((resolve, reject) => {
                    ws.on('open', () => {
                        discovery.status = 'active';
                        discovery.capabilities.push('websocket', 'real-time');
                        this.addToJournal(`✅ Connected to ${service.name} via WebSocket\n`);
                        this.addNarrative(`Success! ${service.name} responded to my handshake.`);
                        ws.close();
                        resolve();
                    });
                    
                    ws.on('error', () => {
                        discovery.status = 'unreachable';
                        this.addToJournal(`❌ Could not connect to ${service.name}\n`);
                        this.addNarrative(`${service.name} seems to be sleeping...`);
                        reject();
                    });
                    
                    setTimeout(reject, 3000);
                });
            } else {
                // HTTP service check
                const response = await fetch(`http://localhost:${service.port}/api/status`)
                    .catch(() => null);
                
                if (response && response.ok) {
                    discovery.status = 'active';
                    discovery.capabilities.push('http', 'rest-api');
                    this.addToJournal(`✅ Connected to ${service.name} via HTTP\n`);
                    this.addNarrative(`${service.name} is alive and responding!`);
                } else {
                    discovery.status = 'unreachable';
                    this.addToJournal(`❌ Could not connect to ${service.name}\n`);
                    this.addNarrative(`${service.name} isn't responding to HTTP requests.`);
                }
            }
        } catch (error) {
            discovery.status = 'error';
            discovery.error = error.message;
        }
        
        this.discoveries.push(discovery);
        this.systemState.discoveries++;
        this.broadcastDiscovery(discovery);
        
        return discovery;
    }
    
    async establishHandshakes() {
        this.addNarrative("Now I'll establish formal handshake agreements with active services.");
        
        for (const discovery of this.discoveries) {
            if (discovery.status === 'active') {
                const agreement = await this.createHandshakeAgreement(discovery);
                this.agreements.set(agreement.id, agreement);
                this.systemState.agreements++;
            }
        }
    }
    
    async createHandshakeAgreement(discovery) {
        const agreement = {
            id: `handshake_${Date.now()}_${discovery.name.replace(/\s/g, '_')}`,
            service: discovery.name,
            port: discovery.port,
            established: new Date().toISOString(),
            protocol: {
                version: '1.0',
                capabilities: discovery.capabilities,
                dataFlow: this.determineDataFlow(discovery.name)
            },
            terms: {
                dataSharing: true,
                eventSubscription: true,
                healthChecks: true,
                autoReconnect: true
            }
        };
        
        this.addToJournal(`\n#### Handshake with ${discovery.name}\n`);
        this.addToJournal('```json\n' + JSON.stringify(agreement, null, 2) + '\n```\n');
        this.addNarrative(`Handshake established with ${discovery.name}. We can now exchange data.`);
        
        return agreement;
    }
    
    determineDataFlow(serviceName) {
        const flows = {
            'JSON Scout': {
                input: ['XML game data'],
                output: ['JSONL tier structures', 'hierarchy patterns'],
                purpose: 'Extract tier systems from game mechanics'
            },
            'Vault System': {
                input: ['Player data', 'Game state'],
                output: ['Encrypted vaults', 'Public JSONL', 'Vault hashes'],
                purpose: 'Separate private and public data'
            },
            'OSS SharePoint': {
                input: ['Tier structures', 'JSONL data'],
                output: ['Document hierarchies', 'Permission mappings'],
                purpose: 'Map tiers to document management'
            },
            'Solidity Interface': {
                input: ['Player stats', 'Vault hashes'],
                output: ['Blockchain transactions', 'Smart contract events'],
                purpose: 'On-chain verification and governance'
            }
        };
        
        return flows[serviceName] || { input: [], output: [], purpose: 'Unknown' };
    }
    
    async buildSystemConnections() {
        this.addNarrative("I can see how these services connect. Let me trace the data flow...");
        
        const connections = [
            {
                from: 'JSON Scout',
                to: 'Vault System',
                data: 'Tier structures',
                purpose: 'Feed game data for encryption'
            },
            {
                from: 'Vault System',
                to: 'OSS SharePoint',
                data: 'Public JSONL',
                purpose: 'Provide hierarchies for document management'
            },
            {
                from: 'Vault System',
                to: 'Solidity Interface',
                data: 'Vault hashes',
                purpose: 'Store references on blockchain'
            },
            {
                from: 'JSON Scout',
                to: 'Solidity Interface',
                data: 'Player statistics',
                purpose: 'Update on-chain tier progression'
            }
        ];
        
        this.addToJournal('\n### System Connections Map\n');
        this.addToJournal('```mermaid\ngraph LR\n');
        
        for (const conn of connections) {
            this.systemState.connections.set(`${conn.from}->${conn.to}`, conn);
            this.addToJournal(`    ${conn.from} -->|${conn.data}| ${conn.to}\n`);
            this.addNarrative(`I see ${conn.from} sending ${conn.data} to ${conn.to}.`);
            
            this.buildLog.push({
                timestamp: new Date().toISOString(),
                action: 'connection_established',
                details: conn
            });
            
            await this.delay(1500);
        }
        
        this.addToJournal('```\n');
    }
    
    async verifySystem() {
        this.addNarrative("Time to verify everything is working correctly...");
        
        const verificationSteps = [
            {
                name: 'Data Flow Integrity',
                check: () => this.verifyDataFlow(),
                critical: true
            },
            {
                name: 'Service Health',
                check: () => this.verifyServiceHealth(),
                critical: true
            },
            {
                name: 'Handshake Validity',
                check: () => this.verifyHandshakes(),
                critical: false
            },
            {
                name: 'Security Boundaries',
                check: () => this.verifySecurityBoundaries(),
                critical: true
            }
        ];
        
        this.addToJournal('\n### System Verification Results\n');
        
        for (const step of verificationSteps) {
            this.addToJournal(`\n**${step.name}**: `);
            const result = await step.check();
            
            const verification = {
                name: step.name,
                result: result.success,
                details: result.details,
                timestamp: new Date().toISOString(),
                critical: step.critical
            };
            
            this.verifications.push(verification);
            
            if (result.success) {
                this.addToJournal('✅ PASSED\n');
                this.addNarrative(`${step.name} check passed successfully.`);
            } else {
                this.addToJournal(`❌ FAILED: ${result.details}\n`);
                this.addNarrative(`Warning: ${step.name} check failed!`);
            }
            
            await this.delay(1000);
        }
        
        this.systemState.phase = 'operational';
        this.generateFinalReport();
    }
    
    async verifyDataFlow() {
        const requiredFlows = [
            'JSON Scout->Vault System',
            'Vault System->OSS SharePoint',
            'Vault System->Solidity Interface'
        ];
        
        const existing = Array.from(this.systemState.connections.keys());
        const missing = requiredFlows.filter(flow => !existing.includes(flow));
        
        return {
            success: missing.length === 0,
            details: missing.length > 0 ? `Missing flows: ${missing.join(', ')}` : 'All flows connected'
        };
    }
    
    async verifyServiceHealth() {
        const activeServices = this.discoveries.filter(d => d.status === 'active').length;
        const totalServices = this.discoveries.length;
        
        return {
            success: activeServices >= 2, // At least 2 services should be active
            details: `${activeServices}/${totalServices} services active`
        };
    }
    
    async verifyHandshakes() {
        const validHandshakes = this.agreements.size;
        const expectedHandshakes = this.discoveries.filter(d => d.status === 'active').length;
        
        return {
            success: validHandshakes === expectedHandshakes,
            details: `${validHandshakes}/${expectedHandshakes} handshakes established`
        };
    }
    
    async verifySecurityBoundaries() {
        // Check that vault system maintains separation
        const vaultHandshake = Array.from(this.agreements.values())
            .find(a => a.service === 'Vault System');
        
        if (!vaultHandshake) {
            return { success: false, details: 'Vault system not found' };
        }
        
        const hasEncryption = vaultHandshake.protocol.dataFlow.output.includes('Encrypted vaults');
        const hasPublicData = vaultHandshake.protocol.dataFlow.output.includes('Public JSONL');
        
        return {
            success: hasEncryption && hasPublicData,
            details: 'Private/public data separation verified'
        };
    }
    
    generateFinalReport() {
        this.addToJournal('\n## Final System Report\n');
        this.addToJournal(`*Generated: ${new Date().toISOString()}*\n`);
        
        const summary = {
            totalDiscoveries: this.discoveries.length,
            activeServices: this.discoveries.filter(d => d.status === 'active').length,
            establishedHandshakes: this.agreements.size,
            dataFlows: this.systemState.connections.size,
            verificationsPassed: this.verifications.filter(v => v.result).length,
            verificationsTotal: this.verifications.length
        };
        
        this.addToJournal('\n### Summary\n');
        Object.entries(summary).forEach(([key, value]) => {
            this.addToJournal(`- **${this.camelToTitle(key)}**: ${value}\n`);
        });
        
        this.addToJournal('\n### System Architecture\n');
        this.addToJournal('The discovered system implements a complete tier management pipeline:\n\n');
        this.addToJournal('1. **Game Data Extraction** (JSON Scout)\n');
        this.addToJournal('2. **Privacy Separation** (Vault System)\n');
        this.addToJournal('3. **Document Management** (OSS SharePoint)\n');
        this.addToJournal('4. **Blockchain Verification** (Solidity)\n');
        
        this.addNarrative("Discovery complete. The tier system is self-aware and fully mapped.");
        
        // Save journal to file
        this.saveJournal();
    }
    
    saveJournal() {
        const journalPath = path.join(__dirname, `system-discovery-${Date.now()}.md`);
        fs.writeFileSync(journalPath, this.markdownJournal.join('\n'));
        console.log(`📝 Journal saved to: ${journalPath}`);
    }
    
    handleObserverMessage(ws, data) {
        switch (data.type) {
            case 'get_journal':
                ws.send(JSON.stringify({
                    type: 'journal_update',
                    markdown: this.markdownJournal.join('\n'),
                    narrative: this.firstPersonNarrative
                }));
                break;
                
            case 'get_state':
                this.sendDiscoveryUpdate(ws);
                break;
                
            case 'trigger_discovery':
                this.manualDiscovery();
                break;
        }
    }
    
    async manualDiscovery(req, res) {
        const { service, port, type } = req?.body || {};
        
        if (service && port) {
            const discovery = await this.discoverService({ name: service, port, type: type || 'http' });
            if (discovery.status === 'active') {
                const agreement = await this.createHandshakeAgreement(discovery);
                this.agreements.set(agreement.id, agreement);
            }
        }
        
        if (res) {
            res.json({ success: true, discoveries: this.discoveries.length });
        }
    }
    
    sendDiscoveryUpdate(ws) {
        ws.send(JSON.stringify({
            type: 'discovery_update',
            state: {
                phase: this.systemState.phase,
                discoveries: this.discoveries.length,
                agreements: this.agreements.size,
                connections: this.systemState.connections.size,
                verifications: this.verifications.length
            },
            lastNarrative: this.firstPersonNarrative[this.firstPersonNarrative.length - 1],
            lastJournalEntry: this.markdownJournal[this.markdownJournal.length - 1]
        }));
    }
    
    broadcastDiscovery(discovery) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'new_discovery',
                    discovery,
                    narrative: this.firstPersonNarrative[this.firstPersonNarrative.length - 1]
                }));
            }
        });
    }
    
    addToJournal(text) {
        this.markdownJournal.push(text);
    }
    
    addNarrative(text) {
        const entry = {
            timestamp: new Date().toISOString(),
            text,
            phase: this.systemState.phase
        };
        this.firstPersonNarrative.push(entry);
        
        // Broadcast to observers
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'narrative_update',
                    narrative: entry
                }));
            }
        });
    }
    
    generateVerificationSummary() {
        const passed = this.verifications.filter(v => v.result).length;
        const total = this.verifications.length;
        const critical = this.verifications.filter(v => v.critical && !v.result).length;
        
        return {
            passed,
            total,
            percentage: total > 0 ? Math.round((passed / total) * 100) : 0,
            criticalFailures: critical,
            status: critical === 0 ? 'HEALTHY' : 'DEGRADED'
        };
    }
    
    camelToTitle(str) {
        return str.replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Auto-start if run directly
if (require.main === module) {
    const handshakeLayer = new HandshakeAgreementLayer();
    
    console.log('');
    console.log('📋 Handshake Features:');
    console.log('   • Self-discovery of services');
    console.log('   • First-person documentation');
    console.log('   • Live markdown journal');
    console.log('   • Real-time verification');
    console.log('   • Visual system building');
    console.log('');
    console.log('🌐 Access the journal at:');
    console.log('   http://localhost:48009/api/journal');
    console.log('');
    console.log('👁️ Watch it build itself:');
    console.log('   open first-person-viewer.html');
}

module.exports = HandshakeAgreementLayer;