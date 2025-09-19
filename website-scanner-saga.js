#!/usr/bin/env node

/**
 * 🌐📜 WEBSITE SCANNER SAGA
 * ========================
 * XML Handshake Scanner for Frontend/Backend Analysis
 * Tracing the Internet's Origin Story through HollowTown
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs').promises;
const url = require('url');

class WebsiteScannerSaga {
    constructor() {
        this.port = 4444;
        this.scanHistory = [];
        this.xmlHandshakes = new Map();
        this.websiteArchaeology = new Map();
        
        // The Saga Elements
        this.saga = {
            chapters: [
                {
                    era: 'The Dial-Up Dawn',
                    year: '1969-1995',
                    artifacts: ['ARPANET', 'TCP/IP', 'HTML', 'Mosaic'],
                    story: 'When modems sang their songs of connection...'
                },
                {
                    era: 'The Browser Wars',
                    year: '1995-2001',
                    artifacts: ['Netscape', 'IE', 'JavaScript', 'CSS'],
                    story: 'Champions fought for control of the viewing glass...'
                },
                {
                    era: 'The Social Awakening',
                    year: '2001-2010',
                    artifacts: ['MySpace', 'Facebook', 'Twitter', 'YouTube'],
                    story: 'People became the content, stories became viral...'
                },
                {
                    era: 'The Mobile Revolution',
                    year: '2010-2020',
                    artifacts: ['iPhone', 'Android', 'Apps', 'Responsive'],
                    story: 'The internet fit in your pocket, always watching...'
                },
                {
                    era: 'The Metaverse Emergence',
                    year: '2020-Present',
                    artifacts: ['Web3', 'AI', 'VR', 'Blockchain'],
                    story: 'Reality and digital merge, HollowTown rises...'
                }
            ],
            currentChapter: 4,
            hollowTownLore: {
                depths: 7,
                treasures: new Map(),
                worldbuilders: [],
                storytellers: []
            }
        };
        
        // Scanner configurations
        this.scanPatterns = {
            frontend: {
                frameworks: /(?:react|angular|vue|svelte|jquery|backbone)/gi,
                bundlers: /(?:webpack|vite|parcel|rollup|browserify)/gi,
                styles: /(?:css|scss|sass|less|stylus|tailwind|bootstrap)/gi,
                state: /(?:redux|mobx|vuex|zustand|recoil)/gi
            },
            backend: {
                languages: /(?:node|python|ruby|php|java|go|rust)/gi,
                frameworks: /(?:express|django|rails|laravel|spring|gin)/gi,
                databases: /(?:mysql|postgres|mongodb|redis|elasticsearch)/gi,
                servers: /(?:nginx|apache|iis|caddy|traefik)/gi
            },
            integration: {
                apis: /(?:rest|graphql|grpc|websocket|soap)/gi,
                auth: /(?:oauth|jwt|saml|ldap|auth0)/gi,
                cloud: /(?:aws|azure|gcp|heroku|vercel|netlify)/gi,
                monitoring: /(?:datadog|newrelic|sentry|prometheus)/gi
            }
        };
        
        // XML Handshake Protocol
        this.handshakeProtocol = {
            version: '2.0',
            namespace: 'http://hollowtown.saga/scanner',
            schema: {
                scan: {
                    url: 'string',
                    timestamp: 'datetime',
                    depth: 'number',
                    artifacts: 'array'
                },
                integration: {
                    frontend: 'object',
                    backend: 'object',
                    connections: 'array'
                },
                story: {
                    chapter: 'string',
                    narrative: 'string',
                    treasureFound: 'boolean'
                }
            }
        };
    }
    
    async initialize() {
        console.log('🌐📜 WEBSITE SCANNER SAGA INITIALIZING...');
        console.log('=========================================');
        console.log('📖 Loading the saga of the internet...');
        console.log('🏰 Preparing to explore HollowTown depths...');
        console.log('🔍 XML handshake scanner ready...');
        console.log('');
        
        // Load existing scan history
        await this.loadScanHistory();
        
        // Initialize storyteller mode
        await this.initializeStoryteller();
        
        // Start the scanner server
        await this.startScannerServer();
    }
    
    async loadScanHistory() {
        console.log('📚 Loading historical scans...');
        
        // Create initial worldbuilders
        this.saga.hollowTownLore.worldbuilders = [
            { name: 'Tim Berners-Lee', contribution: 'The Web Weaver', era: 0 },
            { name: 'Marc Andreessen', contribution: 'The Browser Builder', era: 1 },
            { name: 'Mark Zuckerberg', contribution: 'The Social Architect', era: 2 },
            { name: 'Steve Jobs', contribution: 'The Mobile Magician', era: 3 },
            { name: 'Satoshi Nakamoto', contribution: 'The Crypto Creator', era: 4 }
        ];
        
        // Initialize treasures at different depths
        for (let depth = 1; depth <= this.saga.hollowTownLore.depths; depth++) {
            this.saga.hollowTownLore.treasures.set(depth, {
                name: this.generateTreasureName(depth),
                power: this.generateTreasurePower(depth),
                guardian: this.generateGuardian(depth),
                found: false
            });
        }
        
        console.log(`   ✅ Loaded ${this.saga.hollowTownLore.worldbuilders.length} worldbuilders`);
        console.log(`   ✅ Generated ${this.saga.hollowTownLore.depths} treasure depths`);
    }
    
    generateTreasureName(depth) {
        const names = [
            'The Protocol Stone',
            'The Packet Prism',
            'The Binary Blade',
            'The Encryption Eye',
            'The Algorithm Amulet',
            'The Quantum Key',
            'The Singularity Seed'
        ];
        return names[depth - 1] || 'Unknown Artifact';
    }
    
    generateTreasurePower(depth) {
        const powers = [
            'Reveals all network connections',
            'Decodes any data format',
            'Cuts through firewalls',
            'Sees through obfuscation',
            'Optimizes any algorithm',
            'Unlocks quantum computing',
            'Controls the digital realm'
        ];
        return powers[depth - 1] || 'Unknown power';
    }
    
    generateGuardian(depth) {
        const guardians = [
            'The Ping Dragon',
            'The Cache Sphinx',
            'The Buffer Overflow Beast',
            'The Memory Leak Monster',
            'The Race Condition Wraith',
            'The Deadlock Demon',
            'The Null Pointer King'
        ];
        return guardians[depth - 1] || 'Unknown Guardian';
    }
    
    async initializeStoryteller() {
        console.log('🎭 Initializing storyteller mode...');
        
        this.saga.hollowTownLore.storytellers = [
            {
                name: 'The Chrome Chronicler',
                specialty: 'Frontend tales',
                reactions: []
            },
            {
                name: 'The Node Narrator',
                specialty: 'Backend epics',
                reactions: []
            },
            {
                name: 'The Cloud Bard',
                specialty: 'Integration sagas',
                reactions: []
            }
        ];
        
        console.log('   ✅ Storytellers ready to observe reactions');
    }
    
    async scanWebsite(targetUrl, depth = 1) {
        console.log(`\n🔍 Scanning: ${targetUrl} (Depth: ${depth})`);
        
        const scan = {
            id: crypto.randomUUID(),
            url: targetUrl,
            timestamp: new Date().toISOString(),
            depth: depth,
            frontend: {},
            backend: {},
            integration: {},
            artifacts: [],
            story: {
                chapter: this.saga.chapters[this.saga.currentChapter].era,
                narrative: '',
                treasureFound: false
            }
        };
        
        try {
            // Perform frontend scan
            scan.frontend = await this.scanFrontend(targetUrl);
            
            // Perform backend scan (inferential)
            scan.backend = await this.scanBackend(targetUrl);
            
            // Analyze integration patterns
            scan.integration = await this.analyzeIntegration(targetUrl);
            
            // Check for treasures at this depth
            const treasure = await this.searchForTreasure(targetUrl, depth);
            if (treasure) {
                scan.story.treasureFound = true;
                scan.story.narrative = `Found ${treasure.name} guarded by ${treasure.guardian}!`;
                scan.artifacts.push(treasure);
            }
            
            // Generate XML handshake
            const xmlHandshake = await this.generateXMLHandshake(scan);
            this.xmlHandshakes.set(scan.id, xmlHandshake);
            
            // Record the scan
            this.scanHistory.push(scan);
            
            // Update storyteller reactions
            this.updateStorytellerReactions(scan);
            
            return scan;
            
        } catch (error) {
            console.error(`   ❌ Scan failed: ${error.message}`);
            scan.error = error.message;
            return scan;
        }
    }
    
    async scanFrontend(targetUrl) {
        const frontend = {
            frameworks: [],
            bundlers: [],
            styles: [],
            state: [],
            detected: false
        };
        
        try {
            // Fetch the page
            const html = await this.fetchPage(targetUrl);
            
            // Scan for frontend patterns
            for (const [category, pattern] of Object.entries(this.scanPatterns.frontend)) {
                const matches = html.match(pattern) || [];
                frontend[category] = [...new Set(matches.map(m => m.toLowerCase()))];
            }
            
            // Check for common frontend indicators
            if (html.includes('React.createElement') || html.includes('__REACT')) {
                frontend.frameworks.push('react');
            }
            if (html.includes('ng-app') || html.includes('angular')) {
                frontend.frameworks.push('angular');
            }
            if (html.includes('Vue.component') || html.includes('v-model')) {
                frontend.frameworks.push('vue');
            }
            
            frontend.detected = frontend.frameworks.length > 0 || 
                               frontend.bundlers.length > 0;
            
        } catch (error) {
            console.log(`   ⚠️ Frontend scan limited: ${error.message}`);
        }
        
        return frontend;
    }
    
    async scanBackend(targetUrl) {
        const backend = {
            server: 'unknown',
            language: 'unknown',
            framework: 'unknown',
            headers: {},
            inferred: true
        };
        
        try {
            // Analyze response headers
            const headers = await this.fetchHeaders(targetUrl);
            backend.headers = headers;
            
            // Infer from headers
            if (headers['server']) {
                backend.server = headers['server'];
            }
            if (headers['x-powered-by']) {
                const powered = headers['x-powered-by'].toLowerCase();
                if (powered.includes('express')) backend.framework = 'express';
                if (powered.includes('php')) backend.language = 'php';
                if (powered.includes('asp')) backend.language = 'dotnet';
            }
            
            // Common patterns
            if (targetUrl.includes('.php')) backend.language = 'php';
            if (targetUrl.includes('.aspx')) backend.language = 'dotnet';
            if (targetUrl.includes('.jsp')) backend.language = 'java';
            
        } catch (error) {
            console.log(`   ⚠️ Backend scan limited: ${error.message}`);
        }
        
        return backend;
    }
    
    async analyzeIntegration(targetUrl) {
        const integration = {
            apis: [],
            auth: [],
            cloud: [],
            monitoring: [],
            connections: []
        };
        
        try {
            const html = await this.fetchPage(targetUrl);
            
            // Scan for integration patterns
            for (const [category, pattern] of Object.entries(this.scanPatterns.integration)) {
                const matches = html.match(pattern) || [];
                integration[category] = [...new Set(matches.map(m => m.toLowerCase()))];
            }
            
            // Look for API endpoints
            const apiMatches = html.match(/(?:\/api\/|\/v\d\/|graphql)/gi) || [];
            integration.connections = apiMatches.map(api => ({
                type: 'api',
                endpoint: api,
                discovered: new Date().toISOString()
            }));
            
        } catch (error) {
            console.log(`   ⚠️ Integration scan limited: ${error.message}`);
        }
        
        return integration;
    }
    
    async searchForTreasure(targetUrl, depth) {
        const treasure = this.saga.hollowTownLore.treasures.get(depth);
        
        if (treasure && !treasure.found) {
            // Check if this URL contains treasure indicators
            const urlLower = targetUrl.toLowerCase();
            const treasureKeywords = ['api', 'auth', 'admin', 'config', 'secret', 'key', 'token'];
            
            const foundKeyword = treasureKeywords.some(keyword => urlLower.includes(keyword));
            
            if (foundKeyword || Math.random() < 0.1) { // 10% chance to find treasure
                treasure.found = true;
                treasure.discoveredAt = targetUrl;
                treasure.discoveredBy = 'The Code Archaeologist';
                return treasure;
            }
        }
        
        return null;
    }
    
    async generateXMLHandshake(scan) {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<WebsiteScan xmlns="${this.handshakeProtocol.namespace}" version="${this.handshakeProtocol.version}">
    <Metadata>
        <ScanID>${scan.id}</ScanID>
        <URL>${scan.url}</URL>
        <Timestamp>${scan.timestamp}</Timestamp>
        <Depth>${scan.depth}</Depth>
    </Metadata>
    
    <Frontend detected="${scan.frontend.detected}">
        <Frameworks count="${scan.frontend.frameworks.length}">
            ${scan.frontend.frameworks.map(f => `<Framework>${f}</Framework>`).join('\n            ')}
        </Frameworks>
        <Bundlers count="${scan.frontend.bundlers.length}">
            ${scan.frontend.bundlers.map(b => `<Bundler>${b}</Bundler>`).join('\n            ')}
        </Bundlers>
        <Styles count="${scan.frontend.styles.length}">
            ${scan.frontend.styles.map(s => `<Style>${s}</Style>`).join('\n            ')}
        </Styles>
    </Frontend>
    
    <Backend inferred="${scan.backend.inferred}">
        <Server>${scan.backend.server}</Server>
        <Language>${scan.backend.language}</Language>
        <Framework>${scan.backend.framework}</Framework>
        <Headers>
            ${Object.entries(scan.backend.headers).map(([k, v]) => 
                `<Header name="${k}">${v}</Header>`
            ).join('\n            ')}
        </Headers>
    </Backend>
    
    <Integration>
        <APIs count="${scan.integration.apis.length}">
            ${scan.integration.apis.map(a => `<API>${a}</API>`).join('\n            ')}
        </APIs>
        <Connections count="${scan.integration.connections.length}">
            ${scan.integration.connections.map(c => 
                `<Connection type="${c.type}" endpoint="${c.endpoint}" />`
            ).join('\n            ')}
        </Connections>
    </Integration>
    
    <Story chapter="${scan.story.chapter}">
        <Narrative>${scan.story.narrative || 'The journey continues...'}</Narrative>
        <TreasureFound>${scan.story.treasureFound}</TreasureFound>
        ${scan.artifacts.map(a => `
        <Artifact>
            <Name>${a.name}</Name>
            <Power>${a.power}</Power>
            <Guardian>${a.guardian}</Guardian>
        </Artifact>`).join('')}
    </Story>
</WebsiteScan>`;
        
        return xml;
    }
    
    async fetchPage(targetUrl) {
        return new Promise((resolve, reject) => {
            const protocol = targetUrl.startsWith('https') ? https : http;
            
            protocol.get(targetUrl, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });
    }
    
    async fetchHeaders(targetUrl) {
        return new Promise((resolve, reject) => {
            const protocol = targetUrl.startsWith('https') ? https : http;
            
            protocol.get(targetUrl, (res) => {
                resolve(res.headers);
                res.destroy(); // Don't need the body
            }).on('error', reject);
        });
    }
    
    updateStorytellerReactions(scan) {
        // Each storyteller reacts to the scan
        this.saga.hollowTownLore.storytellers.forEach(storyteller => {
            const reaction = {
                scanId: scan.id,
                timestamp: new Date().toISOString(),
                observation: '',
                mediaConsumptionInsight: ''
            };
            
            if (storyteller.specialty === 'Frontend tales' && scan.frontend.detected) {
                reaction.observation = `Ah, I see they use ${scan.frontend.frameworks.join(', ')} to weave their interface!`;
                reaction.mediaConsumptionInsight = 'Users expect rich, interactive experiences now';
            } else if (storyteller.specialty === 'Backend epics' && scan.backend.server !== 'unknown') {
                reaction.observation = `The ${scan.backend.server} server guards their secrets well`;
                reaction.mediaConsumptionInsight = 'Server architecture shapes how stories are delivered';
            } else if (storyteller.specialty === 'Integration sagas' && scan.integration.connections.length > 0) {
                reaction.observation = `${scan.integration.connections.length} pathways connect this realm to others`;
                reaction.mediaConsumptionInsight = 'Modern media is interconnected, APIs are the new plot devices';
            }
            
            storyteller.reactions.push(reaction);
        });
    }
    
    async startScannerServer() {
        const server = http.createServer(async (req, res) => {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            
            if (req.url === '/') {
                res.end(await this.generateScannerInterface());
            } else if (req.url === '/api/scan' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    const { url: targetUrl, depth } = JSON.parse(body);
                    const result = await this.scanWebsite(targetUrl, depth || 1);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(result));
                });
            } else if (req.url === '/api/saga') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(this.saga));
            } else if (req.url === '/api/history') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(this.scanHistory));
            } else if (req.url.startsWith('/api/handshake/')) {
                const scanId = req.url.split('/').pop();
                const xml = this.xmlHandshakes.get(scanId);
                if (xml) {
                    res.setHeader('Content-Type', 'application/xml');
                    res.end(xml);
                } else {
                    res.statusCode = 404;
                    res.end('Handshake not found');
                }
            }
        });
        
        server.listen(this.port, () => {
            console.log(`\n🌐 WEBSITE SCANNER SAGA ACTIVE`);
            console.log(`📜 Scanner Interface: http://localhost:${this.port}`);
            console.log(`\n📖 THE SAGA:`);
            console.log(`   • Current Chapter: ${this.saga.chapters[this.saga.currentChapter].era}`);
            console.log(`   • Worldbuilders: ${this.saga.hollowTownLore.worldbuilders.length}`);
            console.log(`   • Treasure Depths: ${this.saga.hollowTownLore.depths}`);
            console.log(`   • Storytellers: ${this.saga.hollowTownLore.storytellers.length}`);
            console.log(`\n🔍 SCANNER READY:`);
            console.log(`   • XML Handshake Protocol v${this.handshakeProtocol.version}`);
            console.log(`   • Frontend/Backend analysis`);
            console.log(`   • Integration mapping`);
            console.log(`   • Treasure hunting enabled`);
        });
    }
    
    async generateScannerInterface() {
        const treasures = Array.from(this.saga.hollowTownLore.treasures.entries());
        const foundTreasures = treasures.filter(([_, t]) => t.found).length;
        
        return `<!DOCTYPE html>
<html>
<head>
    <title>Website Scanner Saga - The HollowTown Chronicles</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Crimson+Text:ital@0;1&display=swap');
        
        body {
            font-family: 'Crimson Text', serif;
            background: #1a1a1a;
            color: #d4af37;
            margin: 0;
            padding: 20px;
            background-image: 
                radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(212, 175, 55, 0.05) 0%, transparent 50%);
        }
        
        .parchment {
            max-width: 1200px;
            margin: 0 auto;
            background: #2a2416;
            border: 3px solid #d4af37;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 0 50px rgba(212, 175, 55, 0.3);
        }
        
        h1, h2 {
            font-family: 'Cinzel', serif;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        h1 {
            font-size: 3em;
            margin: 0 0 10px 0;
            color: #d4af37;
        }
        
        .subtitle {
            text-align: center;
            font-style: italic;
            margin-bottom: 30px;
            color: #b8960a;
        }
        
        .saga-nav {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
            padding: 20px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
        }
        
        .saga-nav div {
            text-align: center;
        }
        
        .saga-nav .number {
            font-size: 2em;
            font-weight: bold;
            color: #fff;
        }
        
        .scanner-section {
            background: rgba(0, 0, 0, 0.2);
            padding: 30px;
            border-radius: 10px;
            margin: 30px 0;
            border: 1px solid #d4af37;
        }
        
        .scan-form {
            display: flex;
            gap: 20px;
            align-items: flex-end;
        }
        
        .form-group {
            flex: 1;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
        }
        
        input[type="text"], input[type="number"], select {
            width: 100%;
            padding: 10px;
            background: #1a1a1a;
            border: 2px solid #d4af37;
            color: #d4af37;
            font-family: 'Crimson Text', serif;
            font-size: 16px;
            border-radius: 5px;
        }
        
        button {
            background: #d4af37;
            color: #1a1a1a;
            border: none;
            padding: 12px 30px;
            font-family: 'Cinzel', serif;
            font-weight: 600;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        button:hover {
            background: #b8960a;
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
        }
        
        .treasures-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .treasure-card {
            background: rgba(212, 175, 55, 0.1);
            border: 2px solid #d4af37;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            transition: all 0.3s;
        }
        
        .treasure-card.found {
            background: rgba(212, 175, 55, 0.3);
            box-shadow: 0 0 30px rgba(212, 175, 55, 0.5);
        }
        
        .treasure-card h3 {
            margin: 0 0 10px 0;
            color: #fff;
        }
        
        .treasure-card .depth {
            font-size: 0.9em;
            color: #b8960a;
        }
        
        .treasure-card .guardian {
            font-style: italic;
            margin: 10px 0;
        }
        
        .storytellers {
            margin: 40px 0;
            padding: 30px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
        }
        
        .storyteller {
            margin: 20px 0;
            padding: 15px;
            background: rgba(212, 175, 55, 0.05);
            border-left: 3px solid #d4af37;
        }
        
        .storyteller h4 {
            margin: 0 0 5px 0;
            color: #d4af37;
        }
        
        .storyteller .reaction {
            font-style: italic;
            color: #b8960a;
        }
        
        .scan-results {
            margin-top: 30px;
            display: none;
        }
        
        .result-section {
            margin: 20px 0;
            padding: 20px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
        }
        
        .result-section h3 {
            margin-top: 0;
            color: #d4af37;
        }
        
        .tech-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
        }
        
        .tech-tag {
            background: #d4af37;
            color: #1a1a1a;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
        }
        
        .loading {
            text-align: center;
            font-size: 1.5em;
            color: #d4af37;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .xml-viewer {
            background: #000;
            color: #0f0;
            padding: 20px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            overflow-x: auto;
            max-height: 400px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="parchment">
        <h1>📜 The Website Scanner Saga</h1>
        <p class="subtitle">
            Tracing the Internet's Origin Story through the Depths of HollowTown
        </p>
        
        <div class="saga-nav">
            <div>
                <div class="number">${this.saga.chapters.length}</div>
                <div>Saga Chapters</div>
            </div>
            <div>
                <div class="number">${this.saga.hollowTownLore.depths}</div>
                <div>Treasure Depths</div>
            </div>
            <div>
                <div class="number">${foundTreasures}</div>
                <div>Treasures Found</div>
            </div>
            <div>
                <div class="number">${this.scanHistory.length}</div>
                <div>Sites Explored</div>
            </div>
        </div>
        
        <div class="scanner-section">
            <h2>🔍 XML Handshake Scanner</h2>
            <p>Scan websites to uncover their frontend/backend integration and search for digital treasures</p>
            
            <div class="scan-form">
                <div class="form-group">
                    <label for="scanUrl">Website URL:</label>
                    <input type="text" id="scanUrl" placeholder="https://example.com" value="https://example.com">
                </div>
                <div class="form-group" style="max-width: 150px;">
                    <label for="scanDepth">Depth Level:</label>
                    <input type="number" id="scanDepth" min="1" max="7" value="1">
                </div>
                <button onclick="scanWebsite()">Begin Scan</button>
            </div>
            
            <div id="scanResults" class="scan-results"></div>
        </div>
        
        <div class="treasures-grid">
            <h2 style="grid-column: 1 / -1;">🏆 The Seven Treasures of HollowTown</h2>
            ${treasures.map(([depth, treasure]) => `
                <div class="treasure-card ${treasure.found ? 'found' : ''}">
                    <h3>${treasure.name}</h3>
                    <div class="depth">Depth ${depth}</div>
                    <div class="guardian">Guardian: ${treasure.guardian}</div>
                    <div class="power">${treasure.power}</div>
                    ${treasure.found ? `<div style="color: #0f0; margin-top: 10px;">✓ Found!</div>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="storytellers">
            <h2>🎭 The Storytellers Observe</h2>
            <p style="text-align: center; font-style: italic;">
                "The storytellers watch as worldbuilders dig through HollowTown,<br>
                observing how people react to this new way of consuming media..."
            </p>
            
            ${this.saga.hollowTownLore.storytellers.map(storyteller => `
                <div class="storyteller">
                    <h4>${storyteller.name}</h4>
                    <div>Specialty: ${storyteller.specialty}</div>
                    ${storyteller.reactions.length > 0 ? 
                        `<div class="reaction">"${storyteller.reactions[storyteller.reactions.length - 1].observation}"</div>` : 
                        '<div class="reaction">*waiting to observe...*</div>'
                    }
                </div>
            `).join('')}
        </div>
    </div>
    
    <script>
        async function scanWebsite() {
            const url = document.getElementById('scanUrl').value;
            const depth = parseInt(document.getElementById('scanDepth').value);
            const resultsDiv = document.getElementById('scanResults');
            
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = '<div class="loading">🔍 Scanning the digital realm...</div>';
            
            try {
                const response = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, depth })
                });
                
                const scan = await response.json();
                displayScanResults(scan);
                
                // Refresh the page to show updated treasures
                setTimeout(() => location.reload(), 5000);
                
            } catch (error) {
                resultsDiv.innerHTML = '<div style="color: #ff6b6b;">❌ Scan failed: ' + error.message + '</div>';
            }
        }
        
        function displayScanResults(scan) {
            const resultsDiv = document.getElementById('scanResults');
            
            let html = '<h3>📊 Scan Results</h3>';
            
            // Frontend
            html += '<div class="result-section">';
            html += '<h3>Frontend Analysis</h3>';
            if (scan.frontend.frameworks.length > 0) {
                html += '<div>Frameworks detected:</div>';
                html += '<div class="tech-list">';
                scan.frontend.frameworks.forEach(f => {
                    html += '<span class="tech-tag">' + f + '</span>';
                });
                html += '</div>';
            } else {
                html += '<div>No frontend frameworks detected</div>';
            }
            html += '</div>';
            
            // Backend
            html += '<div class="result-section">';
            html += '<h3>Backend Analysis</h3>';
            html += '<div>Server: ' + scan.backend.server + '</div>';
            html += '<div>Language: ' + scan.backend.language + '</div>';
            html += '<div>Framework: ' + scan.backend.framework + '</div>';
            html += '</div>';
            
            // Story
            if (scan.story.treasureFound) {
                html += '<div class="result-section" style="background: rgba(212, 175, 55, 0.2);">';
                html += '<h3>🏆 Treasure Found!</h3>';
                html += '<div>' + scan.story.narrative + '</div>';
                html += '</div>';
            }
            
            // XML Handshake
            html += '<div class="result-section">';
            html += '<h3>XML Handshake</h3>';
            html += '<button onclick="viewXMLHandshake(\'' + scan.id + '\')">View XML</button>';
            html += '<div id="xmlViewer-' + scan.id + '" style="display: none; margin-top: 20px;"></div>';
            html += '</div>';
            
            resultsDiv.innerHTML = html;
        }
        
        async function viewXMLHandshake(scanId) {
            const viewerDiv = document.getElementById('xmlViewer-' + scanId);
            
            if (viewerDiv.style.display === 'none') {
                const response = await fetch('/api/handshake/' + scanId);
                const xml = await response.text();
                
                viewerDiv.innerHTML = '<div class="xml-viewer"><pre>' + escapeHtml(xml) + '</pre></div>';
                viewerDiv.style.display = 'block';
            } else {
                viewerDiv.style.display = 'none';
            }
        }
        
        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        }
    </script>
</body>
</html>`;
    }
}

// Initialize the scanner saga
const scannerSaga = new WebsiteScannerSaga();
scannerSaga.initialize().catch(error => {
    console.error('❌ Failed to initialize scanner saga:', error);
});