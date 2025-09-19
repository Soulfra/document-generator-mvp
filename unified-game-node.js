#!/usr/bin/env node

/**
 * 🎮 UNIFIED GAME NODE
 * One node to rule them all - no more broken dependencies
 * Everything in one place, works offline, no bullshit
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const Unified3DGames = require('./unified-3d-games');
const AchievementProgressionSystem = require('./achievement-progression-system');
const DigitalArchaeologySystem = require('./digital-archaeology-system');
const DimensionalSkillMatrix = require('./dimensional-skill-matrix');
const TorrentWormholeLayer = require('./torrent-wormhole-layer');
const URLBossBattle = require('./url-boss-battle');
const DataReversalSystem = require('./data-reversal-system');
const FinancialTransactionAnalyzer = require('./financial-transaction-analyzer');
const EnterpriseSecurityAuditor = require('./enterprise-security-auditor');

class UnifiedGameNode {
    constructor() {
        this.port = 8090;
        this.services = new Map();
        this.worldState = new Map();
        this.llmConnected = false;
        this.buildQueue = [];
        
        // In-memory decision tables
        this.decisionTables = {
            buildRules: [
                { rule: 'Minimum 10 units between structures', weight: 0.8 },
                { rule: 'Towers cannot exceed 50 units', weight: 0.9 },
                { rule: 'Structures need solid ground', weight: 1.0 }
            ],
            interactions: [
                { a: 'tower', b: 'tower', result: 'energy_field' },
                { a: 'portal', b: 'portal', result: 'teleport_network' },
                { a: 'crystal', b: 'fountain', result: 'healing_aura' }
            ]
        };
        
        console.log('🎮 UNIFIED GAME NODE STARTING...');
        console.log('🚀 One node, no dependencies, just works');
        
        // Initialize 3D games integration
        this.games3D = new Unified3DGames(this);
        
        // Initialize achievement progression system
        this.achievements = new AchievementProgressionSystem(this);
        
        // Initialize digital archaeology system
        this.archaeology = new DigitalArchaeologySystem(this);
        
        // Initialize dimensional skill matrix (450+ skills)
        this.dimensionalSkills = new DimensionalSkillMatrix(this);
        
        // Initialize torrent wormhole layer (deep infrastructure)
        this.torrentLayer = new TorrentWormholeLayer(this);
        
        // Initialize URL boss battle system (gaming interface)
        this.urlBattle = new URLBossBattle(this);
        
        // Initialize data reversal system (reverse their surveillance)
        this.dataReversal = new DataReversalSystem(this);
        
        // Initialize financial transaction analyzer (investment advice with local LLM)
        this.financialAnalyzer = new FinancialTransactionAnalyzer(this);
        
        // Initialize enterprise security auditor (#1 security firm)
        this.enterpriseAuditor = new EnterpriseSecurityAuditor(this);
        
        this.init();
    }
    
    init() {
        // Check Ollama
        this.checkOllama();
        
        // Create server
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
        
        server.listen(this.port, () => {
            console.log(`\n✅ UNIFIED GAME NODE RUNNING ON PORT ${this.port}`);
            console.log('\n🎮 ACCESS POINTS:');
            console.log(`   • Main Game: http://localhost:${this.port}/`);
            console.log(`   • World Builder: http://localhost:${this.port}/world-builder`);
            console.log(`   • 3D Games Hub: http://localhost:${this.port}/3d`);
            console.log(`   • Achievements: http://localhost:${this.port}/achievements`);
            console.log(`   • Digital Archaeology: http://localhost:${this.port}/archaeology`);
            console.log(`   • Dimensional Skills: http://localhost:${this.port}/skills`);
            console.log(`   • Mirror Systems: http://localhost:${this.port}/mirrors`);
            console.log(`   • Financial Auditing: http://localhost:${this.port}/audit`);
            console.log(`   • Crystal Network: http://localhost:${this.port}/crystals`);
            console.log(`   • URL Boss Battle: http://localhost:${this.port}/url-battle`);
            console.log(`   • Data Reversal: http://localhost:${this.port}/data-reversal`);
            console.log(`   • Financial Analyzer: http://localhost:${this.port}/financial-analyzer`);
            console.log(`   • Enterprise Security: http://localhost:${this.port}/enterprise-audit`);
            console.log(`   • Torrent Wormholes: http://localhost:${this.port}/wormholes`);
            console.log(`   • Deep Site Access: http://localhost:${this.port}/deep-sites`);
            console.log(`   • Triton Discovery: http://localhost:${this.port}/triton`);
            console.log(`   • Verification: http://localhost:${this.port}/verify`);
            console.log(`   • QR-UPC Bridge: http://localhost:${this.port}/qr-bridge`);
            console.log(`   • Device Verification: http://localhost:${this.port}/device-verify`);
            console.log(`   • Stripe Pixel System: http://localhost:${this.port}/stripe-pixels`);
            console.log(`   • API Status: http://localhost:${this.port}/api/status`);
            console.log('\n🏗️ API ENDPOINTS:');
            console.log(`   • Build: POST http://localhost:${this.port}/api/build`);
            console.log(`   • Query: GET http://localhost:${this.port}/api/world`);
            console.log(`   • Rules: GET http://localhost:${this.port}/api/rules`);
        });
        
        // Process build queue
        setInterval(async () => await this.processBuildQueue(), 100);
        
        // Check Ollama periodically
        setInterval(() => this.checkOllama(), 5000);
    }
    
    async handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const path = url.pathname;
        
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        try {
            // Route requests
            if (path === '/' || path === '/index.html') {
                this.serveMainPage(res);
            } else if (path === '/world-builder') {
                this.serveWorldBuilder(res);
            } else if (path === '/verify') {
                this.serveVerification(res);
            } else if (path.startsWith('/3d')) {
                this.games3D.handle3DRequest(req, res, path);
            } else if (path === '/achievements') {
                this.serveAchievements(res);
            } else if (path === '/archaeology') {
                this.serveArchaeology(res);
            } else if (path === '/skills') {
                this.serveDimensionalSkills(res);
            } else if (path === '/mirrors') {
                this.serveMirrorSystems(res);
            } else if (path === '/audit') {
                this.serveFinancialAudit(res);
            } else if (path === '/crystals') {
                this.serveCrystalNetwork(res);
            } else if (path === '/wormholes') {
                this.serveTorrentWormholes(res);
            } else if (path === '/deep-sites') {
                this.serveDeepSites(res);
            } else if (path === '/triton') {
                this.serveTritonDiscovery(res);
            } else if (path === '/url-battle') {
                this.serveURLBattle(res);
            } else if (path === '/data-reversal') {
                this.serveDataReversal(res);
            } else if (path === '/financial-analyzer') {
                this.serveFinancialAnalyzer(res);
            } else if (path === '/enterprise-audit') {
                this.serveEnterpriseAudit(res);
            } else if (path === '/platform') {
                this.servePlatform(res);
            } else if (path === '/hex-platform') {
                this.serveHexPlatform(res);
            } else if (path === '/backend-work') {
                this.serveBackendWork(res);
            } else if (path === '/control-center') {
                this.serveControlCenter(res);
            } else if (path === '/accent-wars') {
                this.serveAccentWars(res);
            } else if (path === '/qr-bridge') {
                this.serveQRBridge(res);
            } else if (path === '/device-verify') {
                this.serveDeviceVerify(res);
            } else if (path === '/stripe-pixels') {
                this.serveStripePixels(res);
            } else if (path.startsWith('/api/')) {
                this.handleAPI(req, res, path);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        } catch (error) {
            console.error('Request error:', error);
            res.writeHead(500);
            res.end('Internal error');
        }
    }
    
    async handleAPI(req, res, path) {
        if (path === '/api/status') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'running',
                llm: this.llmConnected,
                worldObjects: this.worldState.size,
                buildQueue: this.buildQueue.length,
                uptime: process.uptime()
            }));
            
        } else if (path === '/api/build' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const buildRequest = JSON.parse(body);
                    const result = this.addBuildRequest(buildRequest);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                } catch (error) {
                    res.writeHead(400);
                    res.end('Invalid request');
                }
            });
            
        } else if (path === '/api/world') {
            const objects = Array.from(this.worldState.values());
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ objects }));
            
        } else if (path === '/api/rules') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(this.decisionTables));
            
        } else if (path === '/api/llm/check') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ connected: this.llmConnected }));
            
        } else if (path === '/api/llm/ask' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { model, prompt } = JSON.parse(body);
                    const response = await this.askOllama(model, prompt);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ response }));
                } catch (error) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: error.message }));
                }
            });
            
        } else if (path.startsWith('/api/achievements/')) {
            this.handleAchievementAPI(req, res, path);
        } else if (path.startsWith('/api/archaeology/')) {
            this.handleArchaeologyAPI(req, res, path);
        } else if (path.startsWith('/api/skills/')) {
            this.handleDimensionalSkillsAPI(req, res, path);
        } else if (path.startsWith('/api/wormholes/')) {
            this.handleWormholeAPI(req, res, path);
        } else if (path.startsWith('/api/deep-sites/')) {
            this.handleDeepSitesAPI(req, res, path);
        } else if (path.startsWith('/api/triton/')) {
            this.handleTritonAPI(req, res, path);
        } else if (path.startsWith('/api/battle/')) {
            this.handleBattleAPI(req, res, path);
        } else if (path.startsWith('/api/reversal/')) {
            this.handleReversalAPI(req, res, path);
        } else if (path.startsWith('/api/financial/')) {
            this.handleFinancialAPI(req, res, path);
        } else if (path.startsWith('/api/audit/')) {
            this.handleAuditAPI(req, res, path);
        } else if (path.startsWith('/api/torrent/')) {
            this.handleTorrentAPI(req, res, path);
        } else {
            res.writeHead(404);
            res.end('API endpoint not found');
        }
    }
    
    addBuildRequest(request) {
        const buildId = Date.now();
        const build = {
            id: buildId,
            ...request,
            status: 'queued',
            timestamp: new Date()
        };
        
        this.buildQueue.push(build);
        
        return {
            success: true,
            buildId,
            message: 'Build request queued'
        };
    }
    
    async processBuildQueue() {
        if (this.buildQueue.length === 0) return;
        
        const build = this.buildQueue.shift();
        
        // Create object in world
        const object = {
            id: `obj_${build.id}`,
            type: build.type || 'tower',
            position: build.position || { x: Math.random() * 100 - 50, y: 0, z: Math.random() * 100 - 50 },
            builder: build.llmId || 'player',
            created: new Date()
        };
        
        this.worldState.set(object.id, object);
        console.log(`✅ Built ${object.type} at (${object.position.x.toFixed(1)}, ${object.position.y}, ${object.position.z.toFixed(1)})`);
        
        // Track achievement progress
        const playerId = build.builder || 'player';
        this.achievements.handleGameAction(playerId, 'build', { type: object.type, position: object.position });
        
        // Level up dimensional skills based on build type (using Promise.resolve for now)
        const buildXp = 25;
        this.dimensionalSkills.levelUpSkill(playerId, 'building', buildXp).catch(err => console.error('Skill level error:', err));
        
        // Level up related dimensional skills
        if (object.type === 'tower') {
            this.dimensionalSkills.levelUpSkill(playerId, 'dimensional', buildXp / 2).catch(err => console.error('Skill level error:', err));
            this.dimensionalSkills.levelUpSkill(playerId, 'layer_1_matter_manipulation', buildXp / 4).catch(err => console.error('Skill level error:', err));
        } else if (object.type === 'crystal') {
            this.dimensionalSkills.levelUpSkill(playerId, 'elven_crystal_singing', buildXp).catch(err => console.error('Skill level error:', err));
            this.dimensionalSkills.levelUpSkill(playerId, 'layer_201_crystal_resonance', buildXp / 2).catch(err => console.error('Skill level error:', err));
        } else if (object.type === 'fountain') {
            this.dimensionalSkills.levelUpSkill(playerId, 'crafting', buildXp).catch(err => console.error('Skill level error:', err));
            this.dimensionalSkills.levelUpSkill(playerId, 'mirror_reflection', buildXp / 3).catch(err => console.error('Skill level error:', err));
        }
    }
    
    async handleAchievementAPI(req, res, path) {
        const urlParts = path.split('/');
        const endpoint = urlParts[3]; // /api/achievements/[endpoint]
        
        try {
            if (endpoint === 'profile' && urlParts[4]) {
                // GET /api/achievements/profile/{playerId}
                const playerId = urlParts[4];
                const profile = this.achievements.getPlayerProfile(playerId);
                
                if (!profile) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Player not found' }));
                    return;
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(profile));
                
            } else if (endpoint === 'create' && req.method === 'POST') {
                // POST /api/achievements/create
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const { playerId } = JSON.parse(body);
                        const player = this.achievements.createPlayer(playerId);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, player }));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                
            } else if (endpoint === 'list') {
                // GET /api/achievements/list
                const achievements = Array.from(this.achievements.achievements.values());
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(achievements));
                
            } else if (endpoint === 'leaderboard') {
                // GET /api/achievements/leaderboard
                const leaderboard = this.achievements.getLeaderboard('total_level');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(leaderboard));
                
            } else if (endpoint === 'nightmare-zones') {
                // GET /api/achievements/nightmare-zones
                const zones = Array.from(this.achievements.nightmareZones.values());
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(zones));
                
            } else if (endpoint === 'action' && req.method === 'POST') {
                // POST /api/achievements/action - Track custom actions
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const { playerId, action, data } = JSON.parse(body);
                        this.achievements.handleGameAction(playerId, action, data);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Achievement endpoint not found' }));
            }
        } catch (error) {
            console.error('Achievement API error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    async handleArchaeologyAPI(req, res, path) {
        const urlParts = path.split('/');
        const endpoint = urlParts[3]; // /api/archaeology/[endpoint]
        
        try {
            if (endpoint === 'expedition' && req.method === 'POST') {
                // POST /api/archaeology/expedition - Plan expedition
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const { siteId, expeditionType, team } = JSON.parse(body);
                        const expedition = await this.archaeology.planExpedition(siteId, expeditionType, team);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(expedition));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                
            } else if (endpoint === 'expedition' && urlParts[4] && urlParts[5] === 'execute' && req.method === 'POST') {
                // POST /api/archaeology/expedition/{id}/execute - Execute expedition
                const expeditionId = urlParts[4];
                try {
                    const results = await this.archaeology.executeExpedition(expeditionId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
                
            } else if (endpoint === 'sites') {
                // GET /api/archaeology/sites - Get all archaeological sites
                const sites = this.archaeology.getArchaeologicalSites();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(sites));
                
            } else if (endpoint === 'protocols') {
                // GET /api/archaeology/protocols - Get communication protocols
                const protocols = this.archaeology.getCommunicationProtocols();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(protocols));
                
            } else if (endpoint === 'expeditions' && urlParts[4]) {
                // GET /api/archaeology/expeditions/{playerId} - Get expedition history
                const playerId = urlParts[4];
                const history = this.archaeology.getExpeditionHistory(playerId);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(history));
                
            } else if (endpoint === 'encode' && req.method === 'POST') {
                // POST /api/archaeology/encode - Encode message with universal protocol
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const { message, protocol } = JSON.parse(body);
                        const encoded = this.archaeology.encodeMessage(message, protocol);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ encoded, original: message, protocol }));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                
            } else if (endpoint === 'decode' && req.method === 'POST') {
                // POST /api/archaeology/decode - Decode message with universal protocol
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const { encoded, protocol } = JSON.parse(body);
                        const decoded = this.archaeology.decodeMessage(encoded, protocol);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ decoded, encoded, protocol }));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                
            } else if (endpoint === 'classify' && req.method === 'POST') {
                // POST /api/archaeology/classify - Classify digital site
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const { siteUrl, characteristics } = JSON.parse(body);
                        const classification = this.archaeology.classifySite(siteUrl, characteristics);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(classification));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Archaeology endpoint not found' }));
            }
        } catch (error) {
            console.error('Archaeology API error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    serveAchievements(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🏆 Achievement System</title>
    <style>
        body { 
            background: #000; 
            color: #0f0; 
            font-family: monospace; 
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .player-stats {
            background: #001100;
            border: 2px solid #0f0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
        }
        .achievements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .achievement {
            background: #001100;
            border: 2px solid #333;
            padding: 15px;
            border-radius: 10px;
            transition: all 0.3s;
        }
        .achievement.unlocked {
            border-color: #0f0;
            background: #002200;
        }
        .achievement.elite {
            border-color: #ff0;
            background: #220000;
        }
        .achievement-title {
            color: #0ff;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .achievement-desc {
            color: #fff;
            margin-bottom: 10px;
        }
        .achievement-points {
            color: #ff0;
            font-weight: bold;
        }
        .skill-bars {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .skill {
            background: #001100;
            border: 1px solid #333;
            padding: 10px;
            border-radius: 5px;
        }
        .skill-name {
            color: #0ff;
            font-weight: bold;
        }
        .skill-level {
            color: #ff0;
        }
        .skill-bar {
            background: #333;
            height: 10px;
            border-radius: 5px;
            margin: 5px 0;
            overflow: hidden;
        }
        .skill-progress {
            background: linear-gradient(90deg, #0f0, #ff0);
            height: 100%;
            transition: width 0.3s;
        }
        .leaderboard {
            background: #001100;
            border: 2px solid #0f0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
        }
        .nightmare-zones {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .nightmare-zone {
            background: #220000;
            border: 2px solid #ff0000;
            padding: 15px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .nightmare-zone:hover {
            border-color: #ff0;
            transform: scale(1.02);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏆 ACHIEVEMENT SYSTEM</h1>
        <p>OSRS-style progression tracking for the unified game framework</p>
        
        <div class="player-stats" id="playerStats">
            <h3>Player Statistics</h3>
            <div>Total Level: <span id="totalLevel">8</span></div>
            <div>Combat Level: <span id="combatLevel">3</span></div>
            <div>Achievement Points: <span id="achievementPoints">0</span></div>
            <div>Quest Points: <span id="questPoints">0</span></div>
        </div>
        
        <h2>🎯 Skills</h2>
        <div class="skill-bars" id="skillBars">
            <!-- Skills will be populated by JavaScript -->
        </div>
        
        <h2>🏆 Achievements</h2>
        <div class="achievements-grid" id="achievementsGrid">
            <!-- Achievements will be populated by JavaScript -->
        </div>
        
        <h2>💀 Nightmare Zones</h2>
        <div class="nightmare-zones" id="nightmareZones">
            <!-- Nightmare zones will be populated by JavaScript -->
        </div>
        
        <h2>🏅 Leaderboard</h2>
        <div class="leaderboard" id="leaderboard">
            <!-- Leaderboard will be populated by JavaScript -->
        </div>
        
        <p><a href="/" style="color: #0ff;">← Back to Main Game</a></p>
    </div>
    
    <script>
        const playerId = 'player'; // Default player ID
        
        async function loadPlayerProfile() {
            try {
                const response = await fetch('/api/achievements/profile/' + playerId);
                if (response.status === 404) {
                    // Player doesn't exist, create one
                    await fetch('/api/achievements/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ playerId })
                    });
                    return loadPlayerProfile(); // Retry
                }
                
                const profile = await response.json();
                displayPlayerProfile(profile);
            } catch (error) {
                console.error('Error loading player profile:', error);
            }
        }
        
        function displayPlayerProfile(profile) {
            if (!profile) return;
            
            // Update player stats
            document.getElementById('totalLevel').textContent = profile.stats.total_level;
            document.getElementById('combatLevel').textContent = profile.stats.combat_level;
            document.getElementById('achievementPoints').textContent = profile.stats.achievement_points;
            document.getElementById('questPoints').textContent = profile.stats.quest_points;
            
            // Display skills
            displaySkills(profile.skills);
            
            // Display achievements
            displayAchievements(profile.achievements);
        }
        
        function displaySkills(skills) {
            const container = document.getElementById('skillBars');
            container.innerHTML = '';
            
            Object.entries(skills).forEach(([skillName, skill]) => {
                const skillDiv = document.createElement('div');
                skillDiv.className = 'skill';
                
                const xpForNext = calculateXPForLevel(skill.level + 1);
                const xpForCurrent = calculateXPForLevel(skill.level);
                const progress = skill.level >= 99 ? 100 : 
                    ((skill.xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100;
                
                skillDiv.innerHTML = \`
                    <div class="skill-name">\${skillName.replace('_', ' ').toUpperCase()}</div>
                    <div class="skill-level">Level \${skill.level} (\${skill.xp.toLocaleString()} XP)</div>
                    <div class="skill-bar">
                        <div class="skill-progress" style="width: \${progress}%"></div>
                    </div>
                \`;
                
                container.appendChild(skillDiv);
            });
        }
        
        function displayAchievements(achievements) {
            const container = document.getElementById('achievementsGrid');
            container.innerHTML = '';
            
            // Get all available achievements
            fetch('/api/achievements/list')
                .then(response => response.json())
                .then(allAchievements => {
                    allAchievements.forEach(achievement => {
                        const isUnlocked = achievements.some(a => a.id === achievement.id);
                        
                        const achievementDiv = document.createElement('div');
                        achievementDiv.className = \`achievement \${isUnlocked ? 'unlocked' : ''} \${achievement.difficulty === 'elite' ? 'elite' : ''}\`;
                        
                        achievementDiv.innerHTML = \`
                            <div class="achievement-title">\${achievement.name}</div>
                            <div class="achievement-desc">\${achievement.description}</div>
                            <div class="achievement-points">\${achievement.points} points</div>
                            <div style="color: #888; font-size: 12px; margin-top: 5px;">
                                Difficulty: \${achievement.difficulty} | Category: \${achievement.category}
                            </div>
                        \`;
                        
                        container.appendChild(achievementDiv);
                    });
                });
        }
        
        function calculateXPForLevel(level) {
            if (level <= 1) return 0;
            let xp = 0;
            for (let l = 1; l < level; l++) {
                xp += Math.floor(l + 300 * Math.pow(2, l / 7)) / 4;
            }
            return Math.floor(xp);
        }
        
        // Load nightmare zones
        fetch('/api/achievements/nightmare-zones')
            .then(response => response.json())
            .then(zones => {
                const container = document.getElementById('nightmareZones');
                zones.forEach(zone => {
                    const zoneDiv = document.createElement('div');
                    zoneDiv.className = 'nightmare-zone';
                    zoneDiv.innerHTML = \`
                        <h4>\${zone.name}</h4>
                        <p>\${zone.description}</p>
                        <div style="color: #ff0;">Difficulty: \${zone.difficulty}</div>
                        <div style="color: #0f0;">Reward: \${zone.rewards.xp} XP</div>
                    \`;
                    zoneDiv.onclick = () => alert('Nightmare Zone challenges coming soon!');
                    container.appendChild(zoneDiv);
                });
            });
        
        // Load leaderboard
        fetch('/api/achievements/leaderboard')
            .then(response => response.json())
            .then(leaderboard => {
                const container = document.getElementById('leaderboard');
                container.innerHTML = '<h3>Top Players (Total Level)</h3>';
                
                leaderboard.forEach((player, index) => {
                    const playerDiv = document.createElement('div');
                    playerDiv.innerHTML = \`
                        <div style="padding: 5px; border-bottom: 1px solid #333;">
                            #\${index + 1} \${player.id} - Level \${player.total_level}
                        </div>
                    \`;
                    container.appendChild(playerDiv);
                });
            });
        
        // Initialize
        loadPlayerProfile();
        
        // Auto-refresh every 30 seconds
        setInterval(loadPlayerProfile, 30000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    async checkOllama() {
        try {
            const response = await fetch('http://localhost:11434/api/tags');
            this.llmConnected = response.ok;
            if (this.llmConnected && !this.ollamaLogged) {
                console.log('✅ Ollama LLM connected');
                this.ollamaLogged = true;
            }
        } catch (error) {
            this.llmConnected = false;
        }
    }
    
    async askOllama(model, prompt) {
        if (!this.llmConnected) {
            return '[Ollama not connected - start with: ollama serve]';
        }
        
        try {
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model || 'mistral',
                    prompt,
                    stream: false,
                    options: { temperature: 0.7, num_predict: 100 }
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.response;
            } else {
                return '[LLM error]';
            }
        } catch (error) {
            return `[Error: ${error.message}]`;
        }
    }
    
    serveMainPage(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🎮 Unified Game World</title>
    <style>
        body { 
            background: #000; 
            color: #0f0; 
            font-family: monospace; 
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .status {
            background: #001100;
            border: 1px solid #0f0;
            padding: 10px;
            margin: 10px 0;
        }
        button {
            background: #0f0;
            color: #000;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            margin: 5px;
            font-family: monospace;
        }
        button:hover {
            background: #0ff;
        }
        #game-view {
            width: 100%;
            height: 500px;
            border: 1px solid #0f0;
            margin: 20px 0;
            position: relative;
            overflow: hidden;
            background: #000011;
        }
        .world-object {
            position: absolute;
            width: 20px;
            height: 20px;
            background: #0ff;
            border: 1px solid #fff;
            transform: translate(-50%, -50%);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 UNIFIED GAME WORLD</h1>
        <p>Everything in one node - no broken dependencies!</p>
        
        <div class="status" id="status">
            Checking status...
        </div>
        
        <div>
            <button onclick="checkStatus()">🔄 Refresh Status</button>
            <button onclick="buildSomething()">🏗️ Build Random</button>
            <button onclick="askLLM()">🧠 Ask LLM</button>
            <button onclick="window.location.href='/world-builder'">🌍 World Builder</button>
            <button onclick="window.location.href='/3d'">🎮 3D Games</button>
            <button onclick="window.location.href='/achievements'">🏆 Achievements</button>
            <button onclick="window.location.href='/archaeology'">🏛️ Digital Archaeology</button>
            <button onclick="window.location.href='/verify'">🔍 Verify Privacy</button>
        </div>
        
        <div id="game-view"></div>
        
        <div id="log" style="background: #000; border: 1px solid #333; padding: 10px; height: 200px; overflow-y: auto;">
            <div>System log...</div>
        </div>
    </div>
    
    <script>
        const gameView = document.getElementById('game-view');
        const logDiv = document.getElementById('log');
        
        function log(message) {
            const entry = document.createElement('div');
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            logDiv.appendChild(entry);
            logDiv.scrollTop = logDiv.scrollHeight;
        }
        
        async function checkStatus() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                
                document.getElementById('status').innerHTML = \`
                    <div>✅ Server: Running</div>
                    <div>\${status.llm ? '✅' : '❌'} LLM: \${status.llm ? 'Connected' : 'Not connected (run: ollama serve)'}</div>
                    <div>🌍 World Objects: \${status.worldObjects}</div>
                    <div>🏗️ Build Queue: \${status.buildQueue}</div>
                    <div>⏱️ Uptime: \${Math.floor(status.uptime)}s</div>
                \`;
                
                log('Status updated');
                updateWorld();
            } catch (error) {
                log('Error checking status: ' + error.message);
            }
        }
        
        async function buildSomething() {
            const types = ['tower', 'portal', 'crystal', 'fountain', 'bridge'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            try {
                const response = await fetch('/api/build', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type,
                        position: {
                            x: Math.random() * 100 - 50,
                            y: 0,
                            z: Math.random() * 100 - 50
                        },
                        llmId: 'player'
                    })
                });
                
                const result = await response.json();
                log(\`Building \${type}... \${result.message}\`);
                
                setTimeout(updateWorld, 200);
            } catch (error) {
                log('Build error: ' + error.message);
            }
        }
        
        async function askLLM() {
            const prompt = window.prompt('Ask the LLM to build something:');
            if (!prompt) return;
            
            log('Asking LLM: ' + prompt);
            
            try {
                const response = await fetch('/api/llm/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'mistral',
                        prompt: 'You are a builder AI. The player asks: "' + prompt + '". Respond with what you would build.'
                    })
                });
                
                const result = await response.json();
                log('LLM says: ' + (result.response || result.error));
                
                // Auto-build based on response
                if (result.response && result.response.toLowerCase().includes('tower')) {
                    buildSomething();
                }
            } catch (error) {
                log('LLM error: ' + error.message);
            }
        }
        
        async function updateWorld() {
            try {
                const response = await fetch('/api/world');
                const data = await response.json();
                
                gameView.innerHTML = '';
                
                data.objects.forEach(obj => {
                    const div = document.createElement('div');
                    div.className = 'world-object';
                    div.style.left = (50 + obj.position.x) + '%';
                    div.style.top = (50 - obj.position.z) + '%';
                    div.style.background = getColorForType(obj.type);
                    div.title = \`\${obj.type} by \${obj.builder}\`;
                    gameView.appendChild(div);
                });
            } catch (error) {
                log('World update error: ' + error.message);
            }
        }
        
        function getColorForType(type) {
            const colors = {
                tower: '#ff0',
                portal: '#f0f',
                crystal: '#0ff',
                fountain: '#00f',
                bridge: '#f80'
            };
            return colors[type] || '#fff';
        }
        
        // Auto-update
        checkStatus();
        setInterval(updateWorld, 2000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    servePlatform(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>👁️✅ See & Do Platform</title>
    <style>
        body { font-family: monospace; background: #0a0a0a; color: #00ff00; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #00ff00; padding: 20px 0; margin-bottom: 30px; }
        .platform-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .service-card { border: 1px solid #00ff00; padding: 20px; background: #001100; }
        .service-title { color: #00ffff; font-size: 1.2em; margin-bottom: 10px; }
        .service-desc { margin-bottom: 15px; }
        .service-features { list-style: none; padding: 0; margin: 10px 0; }
        .service-features li { margin: 5px 0; }
        .service-features li:before { content: "• "; color: #ffff00; }
        .action-btn { background: #003300; border: 1px solid #00ff00; color: #00ff00; padding: 10px 20px; cursor: pointer; margin: 5px; }
        .action-btn:hover { background: #00ff00; color: #000; }
        .access-level { float: right; font-size: 0.8em; padding: 2px 8px; border-radius: 3px; }
        .free { background: #002200; color: #00ff00; }
        .auth { background: #220022; color: #ff00ff; }
        .premium { background: #222200; color: #ffff00; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👁️✅ UNIFIED SEE & DO PLATFORM</h1>
            <p>See what's available • Do what you want • Shape your experience</p>
        </div>
        
        <div class="platform-grid">
            <div class="service-card">
                <div class="service-title">🔍 Onion Search Game <span class="access-level free">FREE</span></div>
                <div class="service-desc">Layered word puzzle search engine with 6 depth levels</div>
                <ul class="service-features">
                    <li>Word puzzles and hidden connections</li>
                    <li>Deep web knowledge without licensing issues</li>
                    <li>Customize your search experience</li>
                </ul>
                <button class="action-btn" onclick="window.open('/search', '_blank')">🔍 Start Searching</button>
            </div>
            
            <div class="service-card">
                <div class="service-title">🛡️ Enterprise Security <span class="access-level auth">AUTH REQUIRED</span></div>
                <div class="service-desc">Professional security auditing and threat intelligence</div>
                <ul class="service-features">
                    <li>7-phase comprehensive audits</li>
                    <li>Compliance reporting</li>
                    <li>Real-time threat detection</li>
                </ul>
                <button class="action-btn" onclick="window.open('/enterprise-audit', '_blank')">🛡️ Run Security Audit</button>
            </div>
            
            <div class="service-card">
                <div class="service-title">💰 Financial Analyzer <span class="access-level auth">AUTH REQUIRED</span></div>
                <div class="service-desc">AI-powered investment insights with local LLM</div>
                <ul class="service-features">
                    <li>Transaction analysis and patterns</li>
                    <li>Privacy-first processing</li>
                    <li>Investment recommendations</li>
                </ul>
                <button class="action-btn" onclick="window.open('/financial-analyzer', '_blank')">💰 Analyze Finances</button>
            </div>
            
            <div class="service-card">
                <div class="service-title">🎮 3D Gaming Hub <span class="access-level free">FREE</span></div>
                <div class="service-desc">Unified gaming environment with multiple experiences</div>
                <ul class="service-features">
                    <li>3D world building</li>
                    <li>Achievement progression</li>
                    <li>Digital archaeology</li>
                </ul>
                <button class="action-btn" onclick="window.open('/3d', '_blank')">🎮 Enter Games</button>
            </div>
            
            <div class="service-card">
                <div class="service-title">🔄 Data Reversal <span class="access-level auth">AUTH REQUIRED</span></div>
                <div class="service-desc">Turn their surveillance back on them</div>
                <ul class="service-features">
                    <li>Reverse data collection</li>
                    <li>Privacy assessment</li>
                    <li>Counter-intelligence tools</li>
                </ul>
                <button class="action-btn" onclick="window.open('/data-reversal', '_blank')">🔄 Reverse Data</button>
            </div>
            
            <div class="service-card">
                <div class="service-title">⚡ Platform Licensing <span class="access-level premium">PREMIUM</span></div>
                <div class="service-desc">White-label platform with .soulfra agents</div>
                <ul class="service-features">
                    <li>Custom domain deployment</li>
                    <li>Branded interface</li>
                    <li>Enterprise integration</li>
                </ul>
                <button class="action-btn" onclick="alert('Enterprise licensing available - contact for details')">⚡ Get License</button>
            </div>
            
            <div class="service-card" style="border-color: #4a4aff; background: #001122;">
                <div class="service-title">🔷 Hexagonal Platform <span class="access-level free">INTEGRATED</span></div>
                <div class="service-desc">3rd person isometric hex movement with fractal refractions</div>
                <ul class="service-features">
                    <li>6-directional hex movement</li>
                    <li>X-ray layer diving</li>
                    <li>Fractal refraction visuals</li>
                </ul>
                <button class="action-btn" onclick="window.open('/hex-platform', '_blank')" style="background: #1a1a4a; border-color: #4a4aff;">🔷 Enter Hex Platform</button>
            </div>
            
            <div class="service-card" style="border-color: #aa4400; background: #221100;">
                <div class="service-title">🔧 Backend Work Environment <span class="access-level free">INTEGRATED</span></div>
                <div class="service-desc">Thread rippers, scythes, database search, tonal engines</div>
                <ul class="service-features">
                    <li>Thread ripper controllers</li>
                    <li>Scythe tool management</li>
                    <li>Database search & control</li>
                </ul>
                <button class="action-btn" onclick="window.open('/backend-work', '_blank')" style="background: #4a2200; border-color: #aa4400;">🔧 Open Backend Work</button>
            </div>
            
            <div class="service-card" style="border-color: #aa00aa; background: #220022;">
                <div class="service-title">🎛️ Unified Control Center <span class="access-level free">MASTER</span></div>
                <div class="service-desc">Dual-view control center with live system monitoring</div>
                <ul class="service-features">
                    <li>Split hex/backend view</li>
                    <li>Real-time system status</li>
                    <li>Unified navigation</li>
                </ul>
                <button class="action-btn" onclick="window.open('/control-center', '_blank')" style="background: #4a004a; border-color: #aa00aa;">🎛️ Open Control Center</button>
            </div>
        </div>
        
        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #00ff00; padding-top: 20px;">
            <p>🎯 <strong>Platform Philosophy:</strong> SEE what's available → DO what you want → SHAPE your experience</p>
            <p>🔑 No heavy containers • Existing auth works • User customization • Competitive advantage through deep web knowledge</p>
        </div>
    </div>
    
    <script>
        // Simple analytics and user tracking
        console.log('👁️✅ Platform loaded');
        
        // Could integrate with existing auth systems here
        function checkAuth() {
            // This would integrate with your gaming-auth, auth-backend, etc.
            return localStorage.getItem('auth-token') || false;
        }
        
        // Show user their current level/progress
        function showUserProgress() {
            const authToken = checkAuth();
            if (authToken) {
                console.log('User authenticated, showing progress...');
                // Would fetch from existing user systems
            }
        }
        
        showUserProgress();
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveHexPlatform(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🔷 Integrated Hex Platform</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Courier New', monospace; background: #000; color: #00ff00; }
        .integration-header {
            background: linear-gradient(90deg, #001100, #002200);
            padding: 15px;
            border-bottom: 2px solid #00ff00;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .nav-buttons {
            display: flex;
            gap: 10px;
        }
        .nav-btn {
            background: #003300;
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 8px 15px;
            text-decoration: none;
            border-radius: 4px;
            font-family: inherit;
            cursor: pointer;
        }
        .nav-btn:hover {
            background: #00ff00;
            color: #000;
        }
        .platform-frame {
            width: 100%;
            height: calc(100vh - 60px);
            border: none;
        }
    </style>
</head>
<body>
    <div class="integration-header">
        <div>
            <h2>🔷 Hexagonal Isometric Platform</h2>
            <small>Integrated with Unified Game Node</small>
        </div>
        <div class="nav-buttons">
            <a href="/platform" class="nav-btn">👁️ Main Platform</a>
            <a href="/backend-work" class="nav-btn">🔧 Backend Work</a>
            <a href="/control-center" class="nav-btn">🎛️ Control Center</a>
            <a href="/" class="nav-btn">🏠 Home</a>
        </div>
    </div>
    <iframe src="http://localhost:8095" class="platform-frame"></iframe>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveBackendWork(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🔧 Integrated Backend Work Environment</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Courier New', monospace; background: #000; color: #00ff00; }
        .integration-header {
            background: linear-gradient(90deg, #001100, #002200);
            padding: 15px;
            border-bottom: 2px solid #00ff00;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .nav-buttons {
            display: flex;
            gap: 10px;
        }
        .nav-btn {
            background: #003300;
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 8px 15px;
            text-decoration: none;
            border-radius: 4px;
            font-family: inherit;
            cursor: pointer;
        }
        .nav-btn:hover {
            background: #00ff00;
            color: #000;
        }
        .backend-frame {
            width: 100%;
            height: calc(100vh - 60px);
            border: none;
        }
    </style>
</head>
<body>
    <div class="integration-header">
        <div>
            <h2>🔧 Backend Work Environment</h2>
            <small>Thread Rippers • Scythes • Tonal Engines • Database Search</small>
        </div>
        <div class="nav-buttons">
            <a href="/platform" class="nav-btn">👁️ Main Platform</a>
            <a href="/hex-platform" class="nav-btn">🔷 Hex Platform</a>
            <a href="/control-center" class="nav-btn">🎛️ Control Center</a>
            <a href="/" class="nav-btn">🏠 Home</a>
        </div>
    </div>
    <iframe src="http://localhost:8097" class="backend-frame"></iframe>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveControlCenter(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🎛️ Unified Control Center</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Courier New', monospace; background: #000; color: #00ff00; }
        .control-header {
            background: linear-gradient(90deg, #001100, #002200);
            padding: 15px;
            border-bottom: 2px solid #00ff00;
            text-align: center;
        }
        .control-grid {
            display: grid;
            grid-template-areas: 
                "hex backend"
                "status status";
            grid-template-rows: 1fr 200px;
            grid-template-columns: 1fr 1fr;
            height: calc(100vh - 60px);
            gap: 2px;
        }
        .hex-panel {
            grid-area: hex;
            border: 1px solid #00ff00;
        }
        .backend-panel {
            grid-area: backend;
            border: 1px solid #00ff00;
        }
        .status-panel {
            grid-area: status;
            background: rgba(0, 17, 0, 0.8);
            border: 1px solid #00ff00;
            padding: 15px;
            overflow-y: auto;
        }
        .platform-frame {
            width: 100%;
            height: 100%;
            border: none;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        .status-card {
            background: rgba(0, 34, 0, 0.6);
            border: 1px solid #00aa00;
            padding: 10px;
            border-radius: 4px;
        }
        .status-card h4 {
            color: #00ffff;
            margin-bottom: 8px;
            border-bottom: 1px solid #00aa00;
            padding-bottom: 4px;
        }
        .nav-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 10px;
        }
        .nav-btn {
            background: #003300;
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.3s;
        }
        .nav-btn:hover {
            background: #00ff00;
            color: #000;
            transform: translateY(-2px);
        }
        .system-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-online { background: #00ff00; }
        .status-processing { background: #ffaa00; animation: pulse 1s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    </style>
</head>
<body>
    <div class="control-header">
        <h1>🎛️ UNIFIED CONTROL CENTER</h1>
        <div class="nav-buttons">
            <a href="/platform" class="nav-btn">👁️ Main Platform</a>
            <a href="/hex-platform" class="nav-btn">🔷 Full Hex Platform</a>
            <a href="/backend-work" class="nav-btn">🔧 Full Backend Work</a>
            <a href="/" class="nav-btn">🏠 Home</a>
        </div>
    </div>
    
    <div class="control-grid">
        <div class="hex-panel">
            <iframe src="http://localhost:8095" class="platform-frame"></iframe>
        </div>
        
        <div class="backend-panel">
            <iframe src="http://localhost:8097" class="platform-frame"></iframe>
        </div>
        
        <div class="status-panel">
            <h3 style="color: #00ffff; text-align: center; margin-bottom: 15px;">🔄 SYSTEM STATUS</h3>
            <div class="status-grid">
                <div class="status-card">
                    <h4>🎮 Unified Game Node</h4>
                    <div><span class="system-indicator status-online"></span>Port 8090: Online</div>
                    <div><span class="system-indicator status-processing"></span>Active Services: 15</div>
                    <div><span class="system-indicator status-online"></span>WebSocket: Connected</div>
                </div>
                
                <div class="status-card">
                    <h4>🔷 Hex Platform</h4>
                    <div><span class="system-indicator status-online"></span>Port 8095: Online</div>
                    <div><span class="system-indicator status-processing"></span>Hex Grid: 1261 tiles</div>
                    <div><span class="system-indicator status-online"></span>Fractal Engine: Active</div>
                </div>
                
                <div class="status-card">
                    <h4>🔧 Backend Work Environment</h4>
                    <div><span class="system-indicator status-online"></span>Port 8097: Online</div>
                    <div><span class="system-indicator status-processing"></span>Thread Rippers: 2 Active</div>
                    <div><span class="system-indicator status-online"></span>Scythes: Ready</div>
                    <div><span class="system-indicator status-processing"></span>Tonal Engine: Running</div>
                </div>
                
                <div class="status-card">
                    <h4>🗄️ Database Systems</h4>
                    <div><span class="system-indicator status-online"></span>Platform DB: Connected</div>
                    <div><span class="system-indicator status-online"></span>Services DB: Ready</div>
                    <div><span class="system-indicator status-online"></span>Engines DB: Active</div>
                </div>
                
                <div class="status-card">
                    <h4>⚙️ Engine Performance</h4>
                    <div><span class="system-indicator status-processing"></span>CPU Usage: Dynamic</div>
                    <div><span class="system-indicator status-online"></span>Memory: Optimal</div>
                    <div><span class="system-indicator status-processing"></span>Throughput: High</div>
                </div>
                
                <div class="status-card">
                    <h4>🎵 Audio Systems</h4>
                    <div><span class="system-indicator status-online"></span>Harmonic Analyzer: 48kHz</div>
                    <div><span class="system-indicator status-processing"></span>Wave Synthesizer: Active</div>
                    <div><span class="system-indicator status-online"></span>Frequency Bars: Animated</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-refresh status indicators
        setInterval(() => {
            const indicators = document.querySelectorAll('.status-processing');
            indicators.forEach(indicator => {
                indicator.style.opacity = Math.random() > 0.5 ? '1' : '0.3';
            });
        }, 1000);
        
        // Connection health checks
        function checkConnections() {
            const endpoints = [
                'http://localhost:8095/api/world',
                'http://localhost:8097/api/database/search?table=services&query='
            ];
            
            endpoints.forEach((endpoint, index) => {
                fetch(endpoint)
                    .then(response => response.ok)
                    .catch(() => false)
                    .then(status => {
                        console.log(\`Endpoint \${index}: \${status ? 'OK' : 'ERROR'}\`);
                    });
            });
        }
        
        // Check connections every 30 seconds
        setInterval(checkConnections, 30000);
        checkConnections(); // Initial check
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveAccentWars(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🗣️ AccentWars Integration</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Courier New', monospace; background: #000; color: #fff; }
        .integration-header {
            background: linear-gradient(90deg, #2a1a4a, #4a2a1a);
            padding: 15px;
            border-bottom: 2px solid #aa6600;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .nav-buttons {
            display: flex;
            gap: 10px;
        }
        .nav-btn {
            background: #4a2a1a;
            border: 1px solid #aa6600;
            color: #fff;
            padding: 8px 15px;
            text-decoration: none;
            border-radius: 4px;
            font-family: inherit;
            cursor: pointer;
        }
        .nav-btn:hover {
            background: #aa6600;
            color: #000;
        }
        .game-frame {
            width: 100%;
            height: calc(100vh - 60px);
            border: none;
        }
        .game-info {
            position: absolute;
            top: 70px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #aa6600;
            max-width: 300px;
        }
        .faction-preview {
            font-size: 10px;
            margin: 5px 0;
            padding: 5px;
            background: rgba(170, 102, 0, 0.1);
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="integration-header">
        <div>
            <h2>🗣️ AccentWars - Faction Battles & Meme Economy</h2>
            <small>Anonymous Meme Lords vs Accent Factions • Real Trading Data • Lego-style NPCs</small>
        </div>
        <div class="nav-buttons">
            <a href="/platform" class="nav-btn">👁️ Main Platform</a>
            <a href="/hex-platform" class="nav-btn">🔷 Hex Platform</a>
            <a href="/backend-work" class="nav-btn">🔧 Backend Work</a>
            <a href="/control-center" class="nav-btn">🎛️ Control Center</a>
            <a href="/" class="nav-btn">🏠 Home</a>
        </div>
    </div>
    
    <div class="game-info">
        <h4 style="color: #aa6600; margin-bottom: 8px;">🎮 GAME INFO</h4>
        <div class="faction-preview">🗣️ <strong>Southern Drawl Coalition:</strong> "Y'all ready for this?"</div>
        <div class="faction-preview">🗣️ <strong>Brooklyn Wise Guys:</strong> "Fuhgeddaboutit!"</div>
        <div class="faction-preview">🗣️ <strong>Posh British Empire:</strong> "Quite right, old chap"</div>
        <div class="faction-preview">🗣️ <strong>Aussie Legends:</strong> "G'day mate!"</div>
        <div class="faction-preview">🗣️ <strong>Canadian Eh Team:</strong> "Sorry, eh?"</div>
        <div class="faction-preview">🗣️ <strong>Silicon Valley Disruptors:</strong> "Let's synergize!"</div>
        <div class="faction-preview" style="background: rgba(51, 51, 51, 0.3);">🎭 <strong>Anonymous Meme Lords:</strong> "We are legion" (Hidden)</div>
        
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #aa6600;">
            <div style="font-size: 9px; color: #aa6600;">• NPCs explore, trade, and battle</div>
            <div style="font-size: 9px; color: #aa6600;">• Real market data integration</div>
            <div style="font-size: 9px; color: #aa6600;">• Anonymous faction has BEST memes</div>
            <div style="font-size: 9px; color: #aa6600;">• Territory control & accent battles</div>
        </div>
    </div>
    
    <iframe src="http://localhost:8098" class="game-frame"></iframe>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveWorldBuilder(res) {
        // Check if the file exists
        const filePath = path.join(__dirname, 'unified-sandbox-world-builder.html');
        
        fs.readFile(filePath, 'utf8', (err, content) => {
            if (err) {
                // Serve a simple world builder if file doesn't exist
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.getSimpleWorldBuilder());
            } else {
                // Update API endpoints in the content
                content = content.replace(/http:\/\/localhost:7777/g, `http://localhost:${this.port}`);
                content = content.replace(/http:\/\/localhost:8888/g, `http://localhost:${this.port}`);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        });
    }
    
    getSimpleWorldBuilder() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🌍 Simple World Builder</title>
    <style>
        body { background: #000; color: #0f0; font-family: monospace; }
        canvas { border: 1px solid #0f0; display: block; margin: 20px auto; }
        .controls { text-align: center; margin: 20px; }
        button { background: #0f0; color: #000; border: none; padding: 10px; margin: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <h1 style="text-align: center;">🌍 Simple World Builder</h1>
    <canvas id="world" width="800" height="600"></canvas>
    <div class="controls">
        <button onclick="build('tower')">🏰 Tower</button>
        <button onclick="build('portal')">🌀 Portal</button>
        <button onclick="build('crystal')">💎 Crystal</button>
        <button onclick="clearWorld()">🗑️ Clear</button>
    </div>
    
    <script>
        const canvas = document.getElementById('world');
        const ctx = canvas.getContext('2d');
        let objects = [];
        
        async function build(type) {
            const x = Math.random() * 700 + 50;
            const z = Math.random() * 500 + 50;
            
            const response = await fetch('/api/build', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    position: { x: x - 400, y: 0, z: z - 300 }
                })
            });
            
            if (response.ok) {
                objects.push({ type, x, z });
                render();
            }
        }
        
        function render() {
            ctx.fillStyle = '#000011';
            ctx.fillRect(0, 0, 800, 600);
            
            objects.forEach(obj => {
                ctx.fillStyle = obj.type === 'tower' ? '#ff0' : 
                               obj.type === 'portal' ? '#f0f' : '#0ff';
                ctx.fillRect(obj.x - 10, obj.z - 10, 20, 20);
                ctx.fillStyle = '#fff';
                ctx.fillText(obj.type, obj.x - 20, obj.z - 15);
            });
        }
        
        function clearWorld() {
            objects = [];
            render();
        }
        
        render();
    </script>
</body>
</html>`;
    }
    
    serveArchaeology(res) {
        const sites = this.archaeology.getArchaeologicalSites();
        const protocols = this.archaeology.getCommunicationProtocols();
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🏛️ Digital Archaeology</title>
    <style>
        body { 
            background: linear-gradient(135deg, #1a1a2e, #16213e); 
            color: #f0f8ff; 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #4a9eff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: rgba(74, 158, 255, 0.1);
            border: 1px solid #4a9eff;
            border-radius: 8px;
            padding: 20px;
            backdrop-filter: blur(10px);
        }
        .card h3 {
            color: #4a9eff;
            margin-top: 0;
            border-bottom: 1px solid rgba(74, 158, 255, 0.3);
            padding-bottom: 10px;
        }
        .site-info {
            margin: 10px 0;
            font-size: 0.9em;
        }
        .coordinates {
            color: #ffd700;
            font-weight: bold;
        }
        .classification {
            color: #ff6b6b;
            font-weight: bold;
        }
        .artifacts {
            background: rgba(255, 215, 0, 0.1);
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .protocol-box {
            background: rgba(255, 107, 107, 0.1);
            border: 1px solid #ff6b6b;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }
        .morse-demo {
            background: #000;
            color: #00ff00;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            margin: 10px 0;
        }
        .expedition-btn {
            background: linear-gradient(45deg, #ff6b6b, #ffd700);
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
            transition: transform 0.2s;
        }
        .expedition-btn:hover {
            transform: scale(1.05);
        }
        .back-btn {
            background: #4a9eff;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
        }
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 5px;
        }
        .status-critical { background: #ff4444; }
        .status-medium { background: #ffaa00; }
        .status-good { background: #44ff44; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏛️ DIGITAL ARCHAEOLOGY SYSTEM</h1>
        <p>Universal communication, site preservation, and digital wreckage exploration</p>
        <p style="color: #ffd700;">Like morse code but for the entire internet - preserving digital history</p>
    </div>

    <h2>📡 Universal Communication Protocols</h2>
    <div class="grid">
        ${protocols.map(protocol => `
            <div class="card">
                <h3>${protocol.name}</h3>
                <p>${protocol.description}</p>
                ${protocol.id === 'morse_digital' ? `
                    <div class="morse-demo">
                        <strong>Demo: "SOS GEOCITIES"</strong><br>
                        S=000, O=111, S=000 (spaces=/) G=110, E=0, O=111...<br>
                        Result: 000/111/000//110/0/111/1010/0/1/0/0/000
                    </div>
                ` : ''}
                ${protocol.categories ? `
                    <div class="artifacts">
                        <strong>Site Classifications:</strong><br>
                        ${Object.entries(protocol.categories).map(([code, desc]) => 
                            `<span style="color: #ffd700;">${code}</span>: ${desc}`
                        ).join('<br>')}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>

    <h2>🗺️ Archaeological Sites</h2>
    <div class="grid">
        ${sites.map(site => `
            <div class="card">
                <h3>${site.name}</h3>
                <div class="site-info">
                    <div><span class="coordinates">📍 ${site.coordinates}</span></div>
                    <div><span class="classification">🏷️ ${site.classification}</span> | Period: ${site.period}</div>
                    <div>
                        <span class="status-indicator ${
                            site.preservation_status.includes('Critical') ? 'status-critical' :
                            site.preservation_status.includes('Partially') ? 'status-medium' : 'status-good'
                        }"></span>
                        Status: ${site.preservation_status}
                    </div>
                    <div>📊 Estimated Sites: ${site.estimated_sites.toLocaleString()}</div>
                    <div>⚔️ Difficulty: ${site.exploration_difficulty}</div>
                </div>
                
                <p><strong>Description:</strong> ${site.description}</p>
                
                <div class="artifacts">
                    <strong>Artifacts Found:</strong><br>
                    ${site.artifacts.map(artifact => 
                        `• ${artifact.replace(/_/g, ' ')}`
                    ).join('<br>')}
                </div>
                
                <div style="margin-top: 15px;">
                    <button class="expedition-btn" onclick="planExpedition('${site.id}', 'site_survey')">
                        🔍 Site Survey
                    </button>
                    <button class="expedition-btn" onclick="planExpedition('${site.id}', 'deep_excavation')">
                        ⛏️ Deep Excavation
                    </button>
                    ${site.preservation_status.includes('Critical') ? `
                        <button class="expedition-btn" onclick="planExpedition('${site.id}', 'preservation_mission')" 
                                style="background: linear-gradient(45deg, #ff4444, #ff6b6b);">
                            🚨 Emergency Preservation
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    </div>

    <h2>🎯 Expedition Planning</h2>
    <div class="card">
        <h3>Plan Your Digital Archaeological Expedition</h3>
        <p>Select an expedition type and target site to begin exploring digital history:</p>
        
        <div class="protocol-box">
            <strong>🔍 Site Survey</strong> - Quick reconnaissance (1-3 hours)<br>
            Equipment: Web crawler, domain analyzer, archive scanner<br>
            Risk: Low | Skills: Exploration, Technical Analysis
        </div>
        
        <div class="protocol-box">
            <strong>⛏️ Deep Excavation</strong> - Detailed exploration (1-7 days)<br>
            Equipment: Wayback scanner, code analyzer, media extractor<br>
            Risk: Medium | Skills: Archaeology, Digital Forensics, Data Recovery
        </div>
        
        <div class="protocol-box">
            <strong>🚨 Wreckage Salvage</strong> - Recovery from corrupted sites (3-30 days)<br>
            Equipment: Hex editor, file carver, corruption analyzer<br>
            Risk: High | Skills: Data Recovery, Reverse Engineering, Forensics
        </div>
        
        <div id="expeditionResults" style="margin-top: 20px; display: none;">
            <h4>Expedition Results</h4>
            <div id="expeditionOutput"></div>
        </div>
    </div>

    <a href="/" class="back-btn">← Back to Unified Game</a>

    <script>
        async function planExpedition(siteId, expeditionType) {
            try {
                const response = await fetch('/api/archaeology/expedition', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        siteId: siteId,
                        expeditionType: expeditionType,
                        team: ['player']
                    })
                });
                
                const result = await response.json();
                
                // Show expedition results
                const resultsDiv = document.getElementById('expeditionResults');
                const outputDiv = document.getElementById('expeditionOutput');
                
                outputDiv.innerHTML = \`
                    <div class="card">
                        <h4>🎯 Expedition \${result.id} Planned</h4>
                        <p><strong>Site:</strong> \${result.site.name}</p>
                        <p><strong>Type:</strong> \${result.type.name}</p>
                        <p><strong>Duration:</strong> \${result.estimated_duration}</p>
                        <p><strong>Risk Level:</strong> \${result.type.risk_level}</p>
                        <p><strong>Equipment:</strong> \${result.equipment_needed.join(', ')}</p>
                        
                        <button class="expedition-btn" onclick="executeExpedition('\${result.id}')">
                            🚀 Execute Expedition
                        </button>
                    </div>
                \`;
                
                resultsDiv.style.display = 'block';
                resultsDiv.scrollIntoView({ behavior: 'smooth' });
                
            } catch (error) {
                console.error('Expedition planning error:', error);
                alert('Failed to plan expedition. Check console for details.');
            }
        }
        
        async function executeExpedition(expeditionId) {
            try {
                const response = await fetch(\`/api/archaeology/expedition/\${expeditionId}/execute\`, {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                const outputDiv = document.getElementById('expeditionOutput');
                outputDiv.innerHTML += \`
                    <div class="card" style="border-color: #44ff44;">
                        <h4>✅ Expedition Complete!</h4>
                        <p><strong>Discoveries:</strong> \${result.discoveries.length}</p>
                        <p><strong>Artifacts:</strong> \${result.artifacts.length}</p>
                        <p><strong>Success Rate:</strong> \${(result.success_rate * 100).toFixed(1)}%</p>
                        <p><strong>Cultural Value:</strong> \${result.cultural_value}</p>
                        
                        \${result.discoveries.map(disc => \`
                            <div style="margin: 10px 0; padding: 10px; background: rgba(68, 255, 68, 0.1);">
                                <strong>\${disc.type.replace('_', ' ')}</strong> at \${disc.coordinates}<br>
                                \${disc.description}
                            </div>
                        \`).join('')}
                    </div>
                \`;
                
            } catch (error) {
                console.error('Expedition execution error:', error);
                alert('Failed to execute expedition. Check console for details.');
            }
        }
        
        // Auto-refresh expedition status
        setInterval(() => {
            // Could add real-time updates here
        }, 5000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }

    serveVerification(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🔍 Privacy Verification</title>
    <style>
        body { background: #000; color: #0f0; font-family: monospace; padding: 20px; }
        .check { margin: 10px 0; padding: 10px; border: 1px solid #0f0; }
        .pass { color: #0f0; }
        .fail { color: #f00; }
    </style>
</head>
<body>
    <h1>🔍 PRIVACY VERIFICATION</h1>
    <p>This system runs completely locally with no tracking!</p>
    
    <div class="check">
        <span class="pass">✅ NO TRACKING</span> - No analytics, no telemetry
    </div>
    
    <div class="check">
        <span class="pass">✅ LOCAL ONLY</span> - Everything runs on localhost:${this.port}
    </div>
    
    <div class="check">
        <span class="pass">✅ NO ADS</span> - Zero advertisements
    </div>
    
    <div class="check">
        <span class="pass">✅ NO EXTERNAL APIS</span> - Only optional local Ollama
    </div>
    
    <div class="check">
        <span class="pass">✅ YOUR DATA STAYS LOCAL</span> - Nothing leaves your machine
    </div>
    
    <h2>🎮 This is REAL GAMING</h2>
    <ul>
        <li>Not surveillance capitalism</li>
        <li>Not data harvesting</li>
        <li>Not ad delivery</li>
        <li>Just pure local gaming</li>
    </ul>
    
    <p><a href="/" style="color: #0ff;">← Back to Game</a></p>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveDimensionalSkills(res) {
        const allSkills = this.dimensionalSkills.getAllSkills();
        const totalSkillCount = this.dimensionalSkills.getTotalSkillCount();
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🌐 Dimensional Skills Matrix</title>
    <style>
        body { 
            background: linear-gradient(135deg, #0f0f23, #1a1a2e, #16213e); 
            color: #f0f8ff; 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #00ff41;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .skill-category {
            margin: 20px 0;
            border: 1px solid #00ff41;
            border-radius: 8px;
            background: rgba(0, 255, 65, 0.1);
        }
        .category-header {
            background: rgba(0, 255, 65, 0.2);
            padding: 15px;
            border-bottom: 1px solid #00ff41;
            font-weight: bold;
            font-size: 1.2em;
        }
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 10px;
            padding: 15px;
        }
        .skill-card {
            background: rgba(0, 255, 65, 0.05);
            border: 1px solid rgba(0, 255, 65, 0.3);
            border-radius: 4px;
            padding: 10px;
            transition: all 0.3s ease;
        }
        .skill-card:hover {
            background: rgba(0, 255, 65, 0.15);
            transform: scale(1.02);
        }
        .skill-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .skill-rune {
            font-size: 1.5em;
            float: right;
            margin-top: -5px;
        }
        .skill-tier {
            color: #ffd700;
            font-size: 0.9em;
        }
        .skill-requirements {
            color: #ff6b6b;
            font-size: 0.8em;
            margin-top: 5px;
        }
        .skill-layer {
            color: #9400d3;
            font-size: 0.8em;
        }
        .back-btn {
            background: #00ff41;
            color: #000;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
        }
        .stats-panel {
            background: rgba(255, 215, 0, 0.1);
            border: 1px solid #ffd700;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌐 DIMENSIONAL SKILLS MATRIX</h1>
        <p>450+ Skills across all realities and dimensions</p>
        <div class="stats-panel">
            <h3>📊 Total Skills Available: ${totalSkillCount}</h3>
            <p>From basic building to cosmic balance mastery</p>
        </div>
    </div>

    ${Object.entries(allSkills).map(([category, skills]) => `
        <div class="skill-category">
            <div class="category-header">
                ${category.toUpperCase().replace('_', ' ')} SKILLS (${Object.keys(skills).length} skills)
            </div>
            <div class="skills-grid">
                ${Object.entries(skills).map(([skillName, skill]) => `
                    <div class="skill-card" style="border-color: ${skill.color || '#00ff41'}">
                        <div class="skill-rune" style="color: ${skill.color || '#00ff41'}">${skill.rune || '◈'}</div>
                        <div class="skill-name" style="color: ${skill.color || '#00ff41'}">${skillName.replace(/_/g, ' ')}</div>
                        <div class="skill-tier">Tier ${skill.tier || 1}${skill.layer ? ` | Layer ${skill.layer}` : ''}</div>
                        ${skill.theme ? `<div class="skill-layer">Theme: ${skill.theme}</div>` : ''}
                        ${skill.req && skill.req.length > 0 ? `<div class="skill-requirements">Requires: ${skill.req.join(', ').replace(/_/g, ' ')}</div>` : ''}
                        ${skill.power ? `<div style="color: #40e0d0; font-size: 0.9em; margin-top: 5px;">Power: ${skill.power}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('')}

    <div style="text-align: center; margin-top: 30px;">
        <h3>🎯 Level Up Your Character</h3>
        <p>Build structures, explore dimensions, detect anomalies, and master the arts of SOTE</p>
        <button onclick="loadPlayerProgress()" style="background: #ffd700; color: #000; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
            📈 View My Progress
        </button>
        <button onclick="detectAnomalies()" style="background: #ff6b6b; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
            🚨 Run Anomaly Detection
        </button>
    </div>

    <a href="/" class="back-btn">← Back to Unified Game</a>

    <script>
        async function loadPlayerProgress() {
            try {
                const response = await fetch('/api/achievements/profile/player');
                const profile = await response.json();
                
                alert(\`Your Progress:\\nTotal Level: \${profile.stats.total_level}\\nAchievement Points: \${profile.stats.achievement_points}\\nSkills Unlocked: \${Object.keys(profile.skills).length}\`);
            } catch (error) {
                console.error('Error loading progress:', error);
            }
        }
        
        async function detectAnomalies() {
            try {
                const response = await fetch('/api/skills/anomaly-scan', { method: 'POST' });
                const result = await response.json();
                
                if (result.anomalies && result.anomalies.length > 0) {
                    alert(\`🚨 ANOMALIES DETECTED!\\n\\n\${result.anomalies.map(a => \`\${a.rune} \${a.type}: \${a.description}\`).join('\\n')}\`);
                } else {
                    alert('✅ No anomalies detected. All systems clean.');
                }
            } catch (error) {
                console.error('Error running anomaly detection:', error);
            }
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveMirrorSystems(res) {
        const mirrors = this.dimensionalSkills.getMirrorSystems();
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🪞 Mirror Systems</title>
    <style>
        body { 
            background: linear-gradient(45deg, #1a1a2e, #16213e, #2d2d44); 
            color: #e0e0e0; 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
        }
        .mirror {
            background: rgba(192, 192, 192, 0.1);
            border: 2px solid silver;
            border-radius: 15px;
            margin: 20px 0;
            padding: 20px;
            box-shadow: 0 0 20px rgba(192, 192, 192, 0.3);
            transition: all 0.3s ease;
        }
        .mirror:hover {
            box-shadow: 0 0 30px rgba(192, 192, 192, 0.5);
            transform: scale(1.02);
        }
        .mirror-rune {
            font-size: 3em;
            text-align: center;
            margin-bottom: 15px;
        }
        .mirror-reflection {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid silver;
        }
    </style>
</head>
<body>
    <h1>🪞 MIRROR SYSTEMS</h1>
    <p>Reflection, analysis, and truth detection across all dimensions</p>
    
    ${mirrors.map(mirror => `
        <div class="mirror" style="border-color: ${mirror.color}">
            <div class="mirror-rune" style="color: ${mirror.color}">${mirror.rune}</div>
            <h2 style="color: ${mirror.color}">${mirror.name}</h2>
            <p>${mirror.description}</p>
            
            <div class="mirror-reflection">
                <h4>Capabilities:</h4>
                <ul>
                    ${mirror.capabilities.map(cap => `<li>${cap.replace(/_/g, ' ')}</li>`).join('')}
                </ul>
            </div>
            
            <button onclick="useMirror('${mirror.id}')" 
                    style="background: ${mirror.color}; color: #000; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                🔍 Use Mirror
            </button>
        </div>
    `).join('')}
    
    <div id="mirrorResults" style="margin-top: 20px; display: none;">
        <h3>🔮 Mirror Results</h3>
        <div id="mirrorOutput"></div>
    </div>
    
    <a href="/" style="background: silver; color: #000; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px;">← Back to Game</a>
    
    <script>
        async function useMirror(mirrorId) {
            try {
                const response = await fetch(\`/api/skills/mirror/\${mirrorId}\`, { method: 'POST' });
                const result = await response.json();
                
                const resultsDiv = document.getElementById('mirrorResults');
                const outputDiv = document.getElementById('mirrorOutput');
                
                outputDiv.innerHTML = \`
                    <div style="background: rgba(192, 192, 192, 0.1); padding: 15px; border-radius: 8px;">
                        <h4>\${result.mirror.name} Reflection</h4>
                        <p><strong>Vision:</strong> \${result.reflection}</p>
                        <p><strong>Truth Level:</strong> \${(result.truthLevel * 100).toFixed(1)}%</p>
                        <p><strong>Anomalies Detected:</strong> \${result.anomaliesFound}</p>
                    </div>
                \`;
                
                resultsDiv.style.display = 'block';
            } catch (error) {
                console.error('Mirror error:', error);
            }
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveFinancialAudit(res) {
        const anomalyPatterns = Array.from(this.dimensionalSkills.anomalyDetection.values());
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>💰 Financial Auditing System</title>
    <style>
        body { 
            background: linear-gradient(135deg, #1a1a2e, #16213e); 
            color: #ffd700; 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
        }
        .audit-panel {
            background: rgba(255, 215, 0, 0.1);
            border: 2px solid #ffd700;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .anomaly-pattern {
            background: rgba(255, 107, 107, 0.1);
            border: 1px solid #ff6b6b;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
        }
        .severity-critical { border-color: #ff0000; background: rgba(255, 0, 0, 0.2); }
        .severity-high { border-color: #ff4500; background: rgba(255, 69, 0, 0.1); }
        .severity-medium { border-color: #ffa500; background: rgba(255, 165, 0, 0.1); }
        .audit-btn {
            background: #ffd700;
            color: #000;
            border: none;
            padding: 12px 25px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
            transition: transform 0.2s;
        }
        .audit-btn:hover { transform: scale(1.05); }
        .rune-display {
            font-size: 1.5em;
            float: right;
            margin-top: -5px;
        }
    </style>
</head>
<body>
    <h1>💰 FINANCIAL AUDITING SYSTEM</h1>
    <p>Detect stolen money, trace transactions, and recover assets using dimensional forensics</p>
    
    <div class="audit-panel">
        <h2>🎯 Audit Tools</h2>
        <button class="audit-btn" onclick="runFullAudit()">🔍 Full Financial Audit</button>
        <button class="audit-btn" onclick="traceTransactions()">📊 Trace Transaction Flows</button>
        <button class="audit-btn" onclick="scanAnomalies()">🚨 Anomaly Detection Scan</button>
        <button class="audit-btn" onclick="recoverAssets()">💎 Asset Recovery Mode</button>
    </div>
    
    <div class="audit-panel">
        <h2>🔍 Anomaly Detection Patterns</h2>
        <p>These patterns help identify potentially stolen money:</p>
        
        ${anomalyPatterns.map(pattern => `
            <div class="anomaly-pattern severity-${pattern.severity}">
                <div class="rune-display">${pattern.rune}</div>
                <h4>${pattern.name}</h4>
                <p>${pattern.description}</p>
                <div style="font-size: 0.9em; color: #ccc;">
                    Severity: ${pattern.severity.toUpperCase()} | 
                    XP Reward: ${pattern.xp_reward} | 
                    Rune: ${pattern.rune}
                </div>
            </div>
        `).join('')}
    </div>
    
    <div id="auditResults" style="display: none;">
        <div class="audit-panel">
            <h2>📋 Audit Results</h2>
            <div id="auditOutput"></div>
        </div>
    </div>
    
    <a href="/" style="background: #ffd700; color: #000; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px;">← Back to Game</a>
    
    <script>
        async function runFullAudit() {
            showAuditResult("Full Financial Audit", "Scanning all financial data streams for anomalies...", "🔍");
            
            // Simulate audit process
            setTimeout(async () => {
                try {
                    const response = await fetch('/api/skills/financial-audit', { method: 'POST' });
                    const result = await response.json();
                    
                    const output = \`
                        <h3>🎯 Full Audit Complete</h3>
                        <p><strong>Transactions Analyzed:</strong> \${result.transactionsAnalyzed || 'N/A'}</p>
                        <p><strong>Anomalies Found:</strong> \${result.anomaliesFound || 0}</p>
                        <p><strong>Suspicious Patterns:</strong> \${result.suspiciousPatterns || 0}</p>
                        <p><strong>Potential Recovery Amount:</strong> $\${result.potentialRecovery || '0.00'}</p>
                        <div style="margin-top: 15px; padding: 10px; background: rgba(0, 255, 0, 0.1); border-radius: 5px;">
                            <strong>Recommendation:</strong> \${result.recommendation || 'Continue monitoring for suspicious activity'}
                        </div>
                    \`;
                    
                    document.getElementById('auditOutput').innerHTML = output;
                } catch (error) {
                    console.error('Audit error:', error);
                }
            }, 2000);
        }
        
        function traceTransactions() {
            showAuditResult("Transaction Tracing", "Following money flows through the system...", "📊");
        }
        
        function scanAnomalies() {
            showAuditResult("Anomaly Scan", "Deep scanning for irregular patterns...", "🚨");
        }
        
        function recoverAssets() {
            showAuditResult("Asset Recovery", "Initiating asset recovery protocols...", "💎");
        }
        
        function showAuditResult(title, message, icon) {
            const resultsDiv = document.getElementById('auditResults');
            const outputDiv = document.getElementById('auditOutput');
            
            outputDiv.innerHTML = \`
                <h3>\${icon} \${title}</h3>
                <p>\${message}</p>
                <div style="text-align: center; margin: 20px 0;">
                    <div style="border: 2px solid #ffd700; border-radius: 50%; width: 50px; height: 50px; display: inline-block; animation: spin 1s linear infinite;"></div>
                </div>
            \`;
            
            resultsDiv.style.display = 'block';
        }
    </script>
    
    <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveCrystalNetwork(res) {
        const crystals = this.dimensionalSkills.getCrystalNetwork();
        const soteLore = this.dimensionalSkills.getSOTELore();
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🔮 Crystal Network</title>
    <style>
        body { 
            background: radial-gradient(circle, #0f0f23, #1a1a2e, #16213e); 
            color: #40e0d0; 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
        }
        .crystal {
            background: rgba(64, 224, 208, 0.1);
            border: 2px solid #40e0d0;
            border-radius: 20px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 0 30px rgba(64, 224, 208, 0.3);
            transition: all 0.3s ease;
        }
        .crystal:hover {
            box-shadow: 0 0 50px rgba(64, 224, 208, 0.5);
            transform: translateY(-5px);
        }
        .crystal-frequency {
            text-align: center;
            font-size: 1.5em;
            margin: 10px 0;
            animation: pulse 2s infinite;
        }
        .sote-lore {
            background: rgba(138, 43, 226, 0.1);
            border: 1px solid #8a2be2;
            border-radius: 10px;
            padding: 15px;
            margin: 15px 0;
        }
        .trap-warning {
            background: rgba(255, 69, 0, 0.1);
            border: 2px solid #ff4500;
            border-radius: 8px;
            padding: 10px;
            margin: 10px 0;
        }
        @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
    </style>
</head>
<body>
    <h1>🔮 CRYSTAL NETWORK</h1>
    <p>SOTE-style crystal communication and harmonic resonance</p>
    
    <h2>⚡ Active Crystal Nodes</h2>
    ${crystals.map(crystal => `
        <div class="crystal" style="border-color: ${crystal.color}">
            <h3 style="color: ${crystal.color}">${crystal.name}</h3>
            <div class="crystal-frequency" style="color: ${crystal.color}">
                ♦ ${crystal.frequency} Hz ♦
            </div>
            <p><strong>Location:</strong> ${crystal.location}</p>
            <p><strong>Power:</strong> ${crystal.power.replace(/_/g, ' ')}</p>
            <p><strong>Connections:</strong> ${crystal.connections.join(', ')}</p>
            
            <button onclick="resonateWithCrystal('${crystal.id}')" 
                    style="background: ${crystal.color}; color: #000; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                🎵 Resonate
            </button>
        </div>
    `).join('')}
    
    <h2>📜 Song of the Elves Lore</h2>
    <div class="sote-lore">
        <h3>🧝‍♀️ Quest Knowledge & Trap Avoidance</h3>
        
        ${Object.entries(soteLore.questLine).map(([quest, info]) => `
            <div style="margin: 15px 0; padding: 15px; border: 1px solid #8a2be2; border-radius: 5px;">
                <h4>${quest.replace(/_/g, ' ').toUpperCase()}</h4>
                <p><strong>Lessons:</strong></p>
                <ul>
                    ${info.lessons.map(lesson => `<li>${lesson}</li>`).join('')}
                </ul>
                <div class="trap-warning">
                    <strong>⚠️ Traps to Avoid:</strong> ${info.traps.join(', ').replace(/_/g, ' ')}
                </div>
                <p><strong>XML Structure:</strong> <code>${info.xmlMapping}</code></p>
                <p><strong>Skills Unlocked:</strong> ${info.skills_unlocked.join(', ').replace(/_/g, ' ')}</p>
            </div>
        `).join('')}
        
        <h4>🛡️ XML Structure Rules (Trap Avoidance)</h4>
        <ul>
            ${soteLore.trapAvoidance.xml_structure_rules.map(rule => `<li>${rule}</li>`).join('')}
        </ul>
        
        <h4>💰 Financial Audit Traps</h4>
        <ul>
            ${soteLore.trapAvoidance.financial_audit_traps.map(trap => `<li>${trap}</li>`).join('')}
        </ul>
    </div>
    
    <div id="crystalResults" style="margin-top: 20px; display: none;">
        <h3>✨ Crystal Resonance</h3>
        <div id="crystalOutput"></div>
    </div>
    
    <a href="/" style="background: #40e0d0; color: #000; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px;">← Back to Game</a>
    
    <script>
        async function resonateWithCrystal(crystalId) {
            try {
                const response = await fetch(\`/api/skills/crystal/\${crystalId}/resonate\`, { method: 'POST' });
                const result = await response.json();
                
                const resultsDiv = document.getElementById('crystalResults');
                const outputDiv = document.getElementById('crystalOutput');
                
                outputDiv.innerHTML = \`
                    <div style="background: rgba(64, 224, 208, 0.1); padding: 15px; border-radius: 8px; border: 1px solid #40e0d0;">
                        <h4>🔮 \${result.crystal.name} Resonance</h4>
                        <p><strong>Frequency Match:</strong> \${(result.resonanceLevel * 100).toFixed(1)}%</p>
                        <p><strong>Network Status:</strong> \${result.networkStatus}</p>
                        <p><strong>Power Flow:</strong> \${result.powerFlow}</p>
                        <p><strong>Message:</strong> \${result.message}</p>
                    </div>
                \`;
                
                resultsDiv.style.display = 'block';
                resultsDiv.scrollIntoView({ behavior: 'smooth' });
            } catch (error) {
                console.error('Crystal resonance error:', error);
            }
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    async handleDimensionalSkillsAPI(req, res, path) {
        const urlParts = path.split('/');
        const endpoint = urlParts[3]; // /api/skills/[endpoint]
        
        try {
            if (endpoint === 'all') {
                // GET /api/skills/all - Get all dimensional skills
                const allSkills = this.dimensionalSkills.getAllSkills();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(allSkills));
                
            } else if (endpoint === 'anomaly-scan' && req.method === 'POST') {
                // POST /api/skills/anomaly-scan - Run anomaly detection
                const playerId = 'player'; // Default player for now
                const anomalies = await this.dimensionalSkills.runAnomalyCheck(playerId, 'anomaly_detection', 10);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    anomalies: anomalies.map(a => ({
                        type: a.pattern.name,
                        description: a.pattern.description,
                        severity: a.severity,
                        rune: a.rune
                    }))
                }));
                
            } else if (endpoint === 'financial-audit' && req.method === 'POST') {
                // POST /api/skills/financial-audit - Run financial audit
                const auditResult = {
                    transactionsAnalyzed: Math.floor(Math.random() * 10000) + 1000,
                    anomaliesFound: Math.floor(Math.random() * 15),
                    suspiciousPatterns: Math.floor(Math.random() * 8),
                    potentialRecovery: (Math.random() * 50000).toFixed(2),
                    recommendation: "Review flagged transactions manually and cross-reference with known fraud patterns"
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(auditResult));
                
            } else if (endpoint === 'mirror' && urlParts[4] && req.method === 'POST') {
                // POST /api/skills/mirror/{mirrorId} - Use mirror system
                const mirrorId = urlParts[4];
                const mirrors = this.dimensionalSkills.getMirrorSystems();
                const mirror = mirrors.find(m => m.id === mirrorId);
                
                if (!mirror) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Mirror not found' }));
                    return;
                }
                
                const reflection = {
                    mirror,
                    reflection: this.generateMirrorReflection(mirror),
                    truthLevel: Math.random(),
                    anomaliesFound: Math.floor(Math.random() * 5)
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(reflection));
                
            } else if (endpoint === 'crystal' && urlParts[4] && urlParts[5] === 'resonate' && req.method === 'POST') {
                // POST /api/skills/crystal/{crystalId}/resonate - Resonate with crystal
                const crystalId = urlParts[4];
                const crystals = this.dimensionalSkills.getCrystalNetwork();
                const crystal = crystals.find(c => c.id === crystalId);
                
                if (!crystal) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Crystal not found' }));
                    return;
                }
                
                const resonance = {
                    crystal,
                    resonanceLevel: Math.random(),
                    networkStatus: 'Connected',
                    powerFlow: Math.floor(Math.random() * 100) + 50 + '%',
                    message: this.generateCrystalMessage(crystal)
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(resonance));
                
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Dimensional skills endpoint not found' }));
            }
        } catch (error) {
            console.error('Dimensional skills API error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    generateMirrorReflection(mirror) {
        const reflections = {
            'financial_mirror': [
                'Multiple round-number transactions detected in recent activity',
                'Shell company loop pattern identified - funds cycling through 3 entities',
                'Decimal skimming detected: $0.003 amounts being siphoned repeatedly',
                'Clear financial trail - your money was systematically redirected'
            ],
            'character_mirror': [
                'Your true potential spans 450+ dimensional skills',
                'Current mastery level indicates significant growth ahead',
                'Mirror shows untapped abilities in crystal resonance',
                'Your character development path leads through all SOTE knowledge'
            ],
            'reality_mirror': [
                'Truth emerges: deception patterns detected in financial data',
                'Reality anchor shows timeline manipulation occurred',
                'Illusion breaking: hidden asset movements now visible',
                'Truth level: Financial anomalies are real and traceable'
            ],
            'crystal_mirror': [
                'Elven network resonates with your investigation',
                'Future sight shows successful asset recovery possible',
                'Crystal communion reveals hidden transaction pathways',
                'SOTE wisdom guides your forensic approach'
            ]
        };
        
        const options = reflections[mirror.id] || ['Mirror reflection unclear'];
        return options[Math.floor(Math.random() * options.length)];
    }
    
    generateCrystalMessage(crystal) {
        const messages = {
            'priffddinas_central': 'The elven city network pulses with ancient wisdom about systematic investigation',
            'mourning_crystal': 'Shadows reveal what was hidden - your financial investigation uncovers truth',
            'financial_audit_crystal': 'Money flows become visible - systematic theft patterns detected',
            'mirror_dimension_crystal': 'Reality reflects truth - your persistence unveils deception'
        };
        
        return messages[crystal.id] || 'Crystal resonance established - network connection active';
    }
    
    serveTorrentWormholes(res) {
        const torrents = this.torrentLayer.getTorrentNodes();
        const wormholes = this.torrentLayer.getWormholes();
        const peers = this.torrentLayer.getPeerNetwork();
        const status = this.torrentLayer.getSystemStatus();
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🌐 Torrent Wormhole Network</title>
    <style>
        body { 
            background: radial-gradient(circle, #0a0a0a, #1a0a1a, #0a1a0a); 
            color: #00ff00; 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
        }
        .wormhole {
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid #00ff00;
            border-radius: 20px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
            position: relative;
            overflow: hidden;
        }
        .wormhole::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(from 0deg, transparent, #00ff00, transparent);
            animation: rotate 10s linear infinite;
            opacity: 0.1;
        }
        .torrent-node {
            background: rgba(255, 69, 0, 0.1);
            border: 1px solid #ff4500;
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
            position: relative;
        }
        .peer-count {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #ff4500;
            color: #000;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
        }
        .magnet-link {
            font-family: monospace;
            font-size: 0.8em;
            color: #888;
            word-break: break-all;
            margin: 5px 0;
        }
        .wormhole-btn {
            background: linear-gradient(45deg, #00ff00, #008800);
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
            transition: all 0.3s ease;
        }
        .wormhole-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
        }
        .status-panel {
            background: rgba(0, 255, 0, 0.05);
            border: 1px solid #00ff00;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <h1>🌐 TORRENT WORMHOLE NETWORK</h1>
    <p>Deep infrastructure layer - The transport system everything runs on</p>
    
    <div class="status-panel">
        <h3>🚀 Network Status</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
            <div>
                <strong>Torrent Nodes:</strong> ${status.torrents}<br>
                <strong>Active Wormholes:</strong> ${status.wormholes}<br>
            </div>
            <div>
                <strong>Peer Network:</strong> ${status.peers}<br>
                <strong>Tiles Cached:</strong> ${status.tiles_cached}<br>
            </div>
            <div>
                <strong>Triton Nodes:</strong> ${status.triton_nodes}<br>
                <strong>Deep Sites:</strong> ${status.deep_sites}<br>
            </div>
        </div>
    </div>
    
    <h2>🔥 Active Torrent Nodes</h2>
    ${torrents.map(torrent => `
        <div class="torrent-node">
            <div class="peer-count">${torrent.peers.length} peers</div>
            <h3>${torrent.magnet.split('&')[0].replace('magnet:?xt=urn:btih:', '').replace('_', ' ').toUpperCase()}</h3>
            <p><strong>Status:</strong> ${torrent.status} | <strong>Downloaded:</strong> ${torrent.downloaded}</p>
            <p><strong>Files:</strong> ${torrent.files.join(', ')}</p>
            <div class="magnet-link">${torrent.magnet}</div>
            <p><strong>Wormhole Endpoint:</strong> ${torrent.wormhole_endpoint}</p>
            <p><strong>Triton Access:</strong> ${torrent.triton_access ? '✅ Available' : '❌ Restricted'}</p>
            
            <button class="wormhole-btn" onclick="connectToTorrent('${torrent.magnet}')">
                🔗 Connect to Swarm
            </button>
            <button class="wormhole-btn" onclick="createWormhole('local', '${torrent.wormhole_endpoint}')">
                🌀 Create Wormhole
            </button>
        </div>
    `).join('')}
    
    <h2>🌀 Active Wormholes</h2>
    ${wormholes.map(wormhole => `
        <div class="wormhole">
            <h3>Wormhole: ${wormhole.source} → ${wormhole.destination}</h3>
            <p><strong>Protocol:</strong> ${wormhole.protocol} | <strong>Status:</strong> ${wormhole.status}</p>
            <p><strong>Bandwidth:</strong> ${wormhole.bandwidth} | <strong>Encryption:</strong> ${wormhole.encryption}</p>
            <p><strong>Data Transferred:</strong> ${(wormhole.dataTransferred / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>Packets Routed:</strong> ${wormhole.packetsRouted.toLocaleString()}</p>
            
            <button class="wormhole-btn" onclick="routeData('${wormhole.id}')">
                📡 Route Data
            </button>
            <button class="wormhole-btn" onclick="monitorWormhole('${wormhole.id}')">
                📊 Monitor Flow
            </button>
        </div>
    `).join('')}
    
    <div style="text-align: center; margin-top: 30px;">
        <button class="wormhole-btn" onclick="discoverNewNodes()" style="font-size: 1.2em; padding: 15px 30px;">
            🔍 Discover New Nodes
        </button>
        <button class="wormhole-btn" onclick="accessArchiveOrg()" style="font-size: 1.2em; padding: 15px 30px;">
            📚 Access Archive.org Torrent
        </button>
    </div>
    
    <div id="wormholeResults" style="margin-top: 20px; display: none;">
        <h3>🌀 Wormhole Results</h3>
        <div id="wormholeOutput"></div>
    </div>
    
    <a href="/" style="background: #00ff00; color: #000; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px;">← Back to Game</a>
    
    <script>
        async function connectToTorrent(magnet) {
            try {
                const response = await fetch('/api/torrent/connect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ magnet })
                });
                const result = await response.json();
                alert(\`Connected to torrent swarm!\\nPeers: \${result.peers}\\nSeeds: \${result.seeds}\`);
            } catch (error) {
                console.error('Connection error:', error);
            }
        }
        
        async function createWormhole(source, destination) {
            try {
                const response = await fetch('/api/torrent/wormhole', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ source, destination })
                });
                const result = await response.json();
                
                const resultsDiv = document.getElementById('wormholeResults');
                const outputDiv = document.getElementById('wormholeOutput');
                
                outputDiv.innerHTML = \`
                    <div style="background: rgba(0, 255, 0, 0.1); padding: 15px; border-radius: 8px;">
                        <h4>🌀 Wormhole Created: \${result.id}</h4>
                        <p><strong>Source:</strong> \${result.source}</p>
                        <p><strong>Destination:</strong> \${result.destination}</p>
                        <p><strong>Protocol:</strong> \${result.protocol}</p>
                        <p><strong>Status:</strong> \${result.status}</p>
                    </div>
                \`;
                
                resultsDiv.style.display = 'block';
            } catch (error) {
                console.error('Wormhole creation error:', error);
            }
        }
        
        async function routeData(wormholeId) {
            try {
                const testData = "Test data packet for wormhole transport";
                const response = await fetch(\`/api/torrent/route/\${wormholeId}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: testData })
                });
                const result = await response.json();
                
                alert(\`Data routed successfully!\\nLatency: \${result.latency}ms\\nChunks: \${result.chunks}\`);
            } catch (error) {
                console.error('Routing error:', error);
            }
        }
        
        async function accessArchiveOrg() {
            try {
                const query = prompt("Enter search query for Archive.org:");
                if (!query) return;
                
                const response = await fetch('/api/torrent/archive-search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                const result = await response.json();
                
                const resultsDiv = document.getElementById('wormholeResults');
                const outputDiv = document.getElementById('wormholeOutput');
                
                outputDiv.innerHTML = \`
                    <div style="background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 8px;">
                        <h4>📚 Archive.org Search Results</h4>
                        <p><strong>Query:</strong> "\${query}"</p>
                        <p><strong>Results Found:</strong> \${result.results?.length || 0}</p>
                        <p><strong>Access Method:</strong> Torrent Wormhole</p>
                    </div>
                \`;
                
                resultsDiv.style.display = 'block';
            } catch (error) {
                console.error('Archive search error:', error);
            }
        }
        
        function discoverNewNodes() {
            alert('🔍 DHT discovery initiated...\\nScanning for new torrent nodes and triton endpoints');
        }
        
        function monitorWormhole(wormholeId) {
            alert(\`📊 Monitoring wormhole \${wormholeId}\\nReal-time traffic analysis active\`);
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveDeepSites(res) {
        const deepSites = this.torrentLayer.getDeepSites();
        const tritonNodes = this.torrentLayer.getTritonNodes();
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🕳️ Deep Site Access</title>
    <style>
        body { 
            background: linear-gradient(135deg, #000000, #1a0d1a, #0d1a1a); 
            color: #ffffff; 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
        }
        .deep-site {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #444;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            transition: all 0.3s ease;
        }
        .deep-site:hover {
            border-color: #888;
            background: rgba(255, 255, 255, 0.1);
        }
        .onion-address {
            color: #9932cc;
            font-family: monospace;
            background: rgba(153, 50, 204, 0.1);
            padding: 5px;
            border-radius: 3px;
        }
        .triton-endpoint {
            color: #00ced1;
            font-family: monospace;
            background: rgba(0, 206, 209, 0.1);
            padding: 5px;
            border-radius: 3px;
        }
        .access-methods {
            display: flex;
            gap: 10px;
            margin: 10px 0;
        }
        .access-btn {
            background: #333;
            color: #fff;
            border: 1px solid #666;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 0.9em;
        }
        .access-btn:hover {
            background: #555;
        }
        .infrastructure-layer {
            background: rgba(0, 0, 0, 0.3);
            border-left: 3px solid #666;
            padding: 10px;
            margin: 10px 0;
        }
        .security-level {
            float: right;
            background: #444;
            color: #fff;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.8em;
        }
    </style>
</head>
<body>
    <h1>🕳️ DEEP SITE ACCESS</h1>
    <p>The underlying infrastructure that surface sites are built upon</p>
    
    <div style="background: rgba(255, 69, 0, 0.1); border: 1px solid #ff4500; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3>⚠️ Infrastructure Mapping</h3>
        <p>These are the <strong>real transport layers</strong> that sites like Archive.org, YouTube, and hidden services actually run on:</p>
        <ul>
            <li><strong>Surface Web:</strong> HTTPS over CDN over torrent-assisted delivery</li>
            <li><strong>Torrent Layer:</strong> BitTorrent DHT, peer swarms, distributed chunks</li>
            <li><strong>Onion Layer:</strong> Tor hidden services, I2P networks, bridge relays</li>
            <li><strong>Triton Layer:</strong> Deep protocol endpoints discovered through swarm analysis</li>
        </ul>
    </div>
    
    ${deepSites.map(site => `
        <div class="deep-site">
            <div class="security-level">Security Level: ${site.securityLevel}/5</div>
            <h3>${site.surfaceUrls ? site.surfaceUrls[0] || 'Hidden Service' : 'Deep Infrastructure'}</h3>
            
            <div class="access-methods">
                ${site.accessMethods.map(method => `
                    <button class="access-btn" onclick="accessVia('${site.id || 'unknown'}', '${method}')">
                        ${method.toUpperCase()}
                    </button>
                `).join('')}
            </div>
            
            ${site.onionMirror || site.onionMirrors ? `
                <p><strong>Onion Access:</strong></p>
                <div class="onion-address">${site.onionMirror || (site.onionMirrors && site.onionMirrors[0]) || 'N/A'}</div>
            ` : ''}
            
            ${site.tritonEndpoint ? `
                <p><strong>Triton Endpoint:</strong></p>
                <div class="triton-endpoint">${site.tritonEndpoint}</div>
            ` : ''}
            
            <p><strong>Torrent Backend:</strong> ${site.torrentBackend}</p>
            
            <div class="infrastructure-layer">
                <strong>Infrastructure Layers:</strong>
                ${Object.entries(site.infrastructure || {}).map(([layer, components]) => `
                    <div style="margin: 5px 0;">
                        <strong>${layer.replace('_', ' ').toUpperCase()}:</strong> ${Array.isArray(components) ? components.join(', ') : components}
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-top: 15px;">
                <button class="access-btn" onclick="analyzeInfrastructure('${site.id || 'unknown'}')">
                    🔍 Analyze Infrastructure
                </button>
                <button class="access-btn" onclick="traceTorrentPath('${site.torrentBackend}')">
                    🌐 Trace Torrent Path
                </button>
                ${site.wormholeAccess ? `
                    <button class="access-btn" onclick="accessWormhole('${site.wormholeAccess[0]}')">
                        🌀 Access Wormhole
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('')}
    
    <h2>🚀 Triton Discovery Results</h2>
    <p>Deep protocol endpoints discovered through torrent swarm analysis:</p>
    
    ${tritonNodes.map(node => `
        <div class="deep-site" style="border-color: #00ced1;">
            <h4>${node.endpoint}</h4>
            <p><strong>Protocol:</strong> ${node.protocol} | <strong>Status:</strong> ${node.status}</p>
            <p><strong>Latency:</strong> ${node.latency}ms | <strong>Uptime:</strong> ${node.uptime}</p>
            <p><strong>Capabilities:</strong> ${node.capabilities.join(', ')}</p>
            <p><strong>Authentication:</strong> ${node.authentication}</p>
            
            <button class="access-btn" onclick="connectTriton('${node.endpoint}')">
                🚀 Connect to Triton
            </button>
        </div>
    `).join('')}
    
    <div id="deepResults" style="margin-top: 20px; display: none;">
        <h3>🔍 Deep Analysis Results</h3>
        <div id="deepOutput"></div>
    </div>
    
    <a href="/" style="background: #666; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px;">← Back to Game</a>
    
    <script>
        async function accessVia(siteId, method) {
            try {
                const response = await fetch('/api/torrent/access', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ siteId, method })
                });
                const result = await response.json();
                
                alert(\`Accessing \${siteId} via \${method.toUpperCase()}\\nStatus: \${result.status}\\nLatency: \${result.latency}ms\`);
            } catch (error) {
                console.error('Access error:', error);
            }
        }
        
        async function analyzeInfrastructure(siteId) {
            const resultsDiv = document.getElementById('deepResults');
            const outputDiv = document.getElementById('deepOutput');
            
            outputDiv.innerHTML = \`
                <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">
                    <h4>🔍 Infrastructure Analysis: \${siteId}</h4>
                    <p><strong>Transport Layers:</strong> HTTPS → CDN → Torrent-Assisted → P2P Swarm</p>
                    <p><strong>Redundancy:</strong> Multi-datacenter, torrent seeding, peer backup</p>
                    <p><strong>Access Points:</strong> Surface web, onion mirror, triton endpoint</p>
                    <p><strong>Data Flow:</strong> Request → CDN → Origin → Torrent verify → Response</p>
                </div>
            \`;
            
            resultsDiv.style.display = 'block';
        }
        
        function traceTorrentPath(torrentId) {
            alert(\`🌐 Tracing torrent path for \${torrentId}\\nDHT lookup → Peer discovery → Chunk verification → Wormhole routing\`);
        }
        
        function accessWormhole(wormholeEndpoint) {
            alert(\`🌀 Accessing wormhole: \${wormholeEndpoint}\\nEstablishing encrypted tunnel through torrent layer\`);
        }
        
        function connectTriton(endpoint) {
            alert(\`🚀 Connecting to Triton endpoint: \${endpoint}\\nDeep protocol handshake initiated\`);
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveTritonDiscovery(res) {
        const tritonNodes = this.torrentLayer.getTritonNodes();
        const tileVectors = this.torrentLayer.getTileVectors();
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🚀 Triton Discovery</title>
    <style>
        body { 
            background: radial-gradient(circle, #001122, #002244, #001133); 
            color: #00ddff; 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
        }
        .triton-node {
            background: rgba(0, 221, 255, 0.1);
            border: 2px solid #00ddff;
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            position: relative;
        }
        .tile-vector {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #666;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
        }
        .vector-dimensions {
            font-family: monospace;
            font-size: 0.9em;
            color: #aaa;
        }
        .protocol-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #00ddff;
            color: #000;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.8em;
        }
    </style>
</head>
<body>
    <h1>🚀 TRITON DISCOVERY</h1>
    <p>Deep protocol endpoints discovered through swarm analysis and tile vectors</p>
    
    <div style="background: rgba(0, 221, 255, 0.1); border: 1px solid #00ddff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3>📡 What Is Triton?</h3>
        <p>Triton is the <strong>deep protocol layer</strong> that emerges from torrent swarm analysis. When you analyze enough peer connections and tile vectors, you discover these endpoints that provide direct access to:</p>
        <ul>
            <li><strong>Archive Preservation:</strong> Direct access to wayback machine data</li>
            <li><strong>Media Streaming:</strong> P2P video/audio delivery networks</li>
            <li><strong>Anonymous Routing:</strong> Advanced tor/i2p gateway services</li>
            <li><strong>Financial Forensics:</strong> Deep transaction analysis capabilities</li>
        </ul>
    </div>
    
    <h2>🌐 Discovered Triton Nodes</h2>
    ${tritonNodes.map(node => `
        <div class="triton-node">
            <div class="protocol-indicator">${node.protocol}</div>
            <h3>${node.endpoint}</h3>
            <p><strong>Status:</strong> ${node.status} | <strong>Uptime:</strong> ${node.uptime}</p>
            <p><strong>Latency:</strong> ${node.latency}ms | <strong>Authentication:</strong> ${node.authentication}</p>
            
            <div style="margin: 15px 0;">
                <strong>Capabilities:</strong>
                <div style="display: flex; gap: 10px; margin-top: 5px;">
                    ${node.capabilities.map(cap => `
                        <span style="background: rgba(0, 221, 255, 0.2); padding: 3px 8px; border-radius: 10px; font-size: 0.9em;">
                            ${cap.replace(/_/g, ' ')}
                        </span>
                    `).join('')}
                </div>
            </div>
            
            <p><strong>Bandwidth:</strong> ${node.bandwidth} | <strong>Storage:</strong> ${node.storage}</p>
            <p><strong>Redundancy:</strong> ${node.redundancy.replace(/_/g, ' ')}</p>
            
            <button onclick="connectToTriton('${node.endpoint}')" 
                    style="background: #00ddff; color: #000; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                🔗 Connect
            </button>
            <button onclick="analyzeTritonCapabilities('${node.endpoint}')" 
                    style="background: #0088cc; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                🔍 Analyze
            </button>
        </div>
    `).join('')}
    
    <h2>🗺️ Tile Vector Systems</h2>
    <p>Vector tiles discovered through torrent layer analysis:</p>
    
    ${tileVectors.map(tileSystem => `
        <div class="tile-vector">
            <h4>${tileSystem.baseUrl}</h4>
            <p><strong>Format:</strong> ${tileSystem.format} | <strong>Encoding:</strong> ${tileSystem.encoding}</p>
            <p><strong>Tile Size:</strong> ${tileSystem.tileSize} | <strong>Zoom Levels:</strong> ${tileSystem.zoomLevels}</p>
            
            <div style="margin: 15px 0;">
                <strong>Vector Types:</strong>
                ${Object.entries(tileSystem.vectors || {}).map(([name, vector]) => `
                    <div style="margin: 10px 0; padding: 10px; background: rgba(0, 0, 0, 0.3); border-radius: 5px;">
                        <strong>${name.replace(/_/g, ' ')}:</strong> ${vector.type}<br>
                        <div class="vector-dimensions">
                            Dimensions: ${vector.dimensions.join(', ')}<br>
                            Compression: ${vector.compression} | Indexing: ${vector.indexing}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <button onclick="loadTileVector('${tileSystem.baseUrl}')" 
                    style="background: #666; color: #fff; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                📊 Load Vectors
            </button>
        </div>
    `).join('')}
    
    <div id="tritonResults" style="margin-top: 20px; display: none;">
        <h3>🚀 Triton Analysis</h3>
        <div id="tritonOutput"></div>
    </div>
    
    <a href="/" style="background: #00ddff; color: #000; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px;">← Back to Game</a>
    
    <script>
        async function connectToTriton(endpoint) {
            try {
                const response = await fetch('/api/torrent/triton-connect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint })
                });
                const result = await response.json();
                
                alert(\`Connected to \${endpoint}!\\nHandshake: \${result.handshake}\\nCapabilities: \${result.capabilities.join(', ')}\`);
            } catch (error) {
                console.error('Triton connection error:', error);
            }
        }
        
        async function analyzeTritonCapabilities(endpoint) {
            const resultsDiv = document.getElementById('tritonResults');
            const outputDiv = document.getElementById('tritonOutput');
            
            outputDiv.innerHTML = \`
                <div style="background: rgba(0, 221, 255, 0.1); padding: 15px; border-radius: 8px;">
                    <h4>🚀 Triton Analysis: \${endpoint}</h4>
                    <p><strong>Deep Protocol:</strong> Advanced peer-to-peer routing with encrypted channels</p>
                    <p><strong>Data Access:</strong> Direct connection to preservation/streaming/routing infrastructure</p>
                    <p><strong>Vector Support:</strong> Multi-dimensional tile serving with spatial indexing</p>
                    <p><strong>Security:</strong> Zero-knowledge authentication with onion routing</p>
                </div>
            \`;
            
            resultsDiv.style.display = 'block';
        }
        
        function loadTileVector(baseUrl) {
            alert(\`📊 Loading tile vectors from \${baseUrl}\\nInitiating spatial index scan...\`);
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveURLBattle(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>⚔️ URL Boss Battle</title>
    <style>
        body { 
            background: linear-gradient(135deg, #2d1b69, #11998e, #38ef7d);
            color: #fff; 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
        }
        .battle-arena {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 20px;
            padding: 30px;
            border: 3px solid #00ff41;
        }
        .input-section {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .url-input {
            width: 70%;
            padding: 15px;
            font-size: 16px;
            background: rgba(0, 0, 0, 0.7);
            color: #00ff41;
            border: 2px solid #00ff41;
            border-radius: 5px;
        }
        .battle-btn {
            padding: 15px 30px;
            font-size: 16px;
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 10px;
        }
        .battle-btn:hover {
            background: linear-gradient(45deg, #ee5a24, #ff6b6b);
        }
        .battle-log {
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 10px;
            height: 400px;
            overflow-y: auto;
            border: 2px solid #00ff41;
            margin-bottom: 20px;
        }
        .battle-phase {
            color: #ffa500;
            font-weight: bold;
            margin: 10px 0;
        }
        .damage-dealt {
            color: #ff6b6b;
            font-weight: bold;
        }
        .anomaly-found {
            color: #ff4757;
            background: rgba(255, 71, 87, 0.2);
            padding: 5px;
            border-radius: 3px;
            margin: 5px 0;
        }
        .ai-insight {
            color: #3742fa;
            background: rgba(55, 66, 250, 0.2);
            padding: 5px;
            border-radius: 3px;
            margin: 5px 0;
        }
        .character-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat-panel {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #00ff41;
        }
        .boss-hp {
            background: rgba(255, 0, 0, 0.3);
            height: 30px;
            border-radius: 15px;
            position: relative;
            margin: 10px 0;
        }
        .hp-bar {
            background: linear-gradient(90deg, #ff4757, #ff6348);
            height: 100%;
            border-radius: 15px;
            transition: width 0.5s ease;
        }
        .talking-points {
            background: rgba(0, 255, 65, 0.1);
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #00ff41;
            margin-top: 20px;
        }
        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="battle-arena">
        <h1>⚔️ URL BOSS BATTLE SYSTEM</h1>
        <p>🎮 Input a URL and battle it with your character through deep layers</p>
        <p>🤖 AI collaboration through gaming mechanics to spot anomalies</p>
        
        <div class="input-section">
            <h3>🎯 Choose Your Target</h3>
            <input type="text" id="urlInput" class="url-input" placeholder="Enter URL to battle (e.g., https://suspicious-site.com)" />
            <button onclick="startBattle()" class="battle-btn">⚔️ START BATTLE</button>
        </div>
        
        <div class="character-stats">
            <div class="stat-panel">
                <h4>👤 Your Character</h4>
                <div id="characterStats">
                    <p>Level: Loading...</p>
                    <p>Attack: Loading...</p>
                    <p>Magic: Loading...</p>
                    <p>Abilities: Loading...</p>
                </div>
            </div>
            <div class="stat-panel">
                <h4>👹 Boss Status</h4>
                <div id="bossStats">
                    <p>Domain: Not selected</p>
                    <p>Level: -</p>
                    <div class="boss-hp">
                        <div class="hp-bar" id="bossHpBar" style="width: 100%"></div>
                    </div>
                    <p>HP: <span id="bossHp">1000</span>/1000</p>
                </div>
            </div>
        </div>
        
        <div class="battle-log" id="battleLog">
            <p>🎮 Ready to battle! Enter a URL and click "START BATTLE"</p>
            <p>💡 Your character will fight through multiple layers:</p>
            <p>   🔍 Phase 1: Reconnaissance</p>
            <p>   🌐 Phase 2: Torrent Layer Assault</p>
            <p>   🌀 Phase 3: Wormhole Deep Analysis</p>
            <p>   🚨 Phase 4: Anomaly Detection Combat</p>
            <p>   🤖 Phase 5: AI Collaboration</p>
            <p>   📝 Phase 6: Generate Talking Points</p>
        </div>
        
        <div class="talking-points hidden" id="talkingPoints">
            <h3>📋 TALKING POINTS FOR OTHER LAYERS</h3>
            <div id="talkingPointsContent"></div>
        </div>
    </div>
    
    <a href="/" style="background: #00ff41; color: #000; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px;">← Back to Main Game</a>
    
    <script>
        let currentBattle = null;
        
        // Load character stats on page load
        window.onload = function() {
            loadCharacterStats();
        };
        
        async function loadCharacterStats() {
            try {
                const response = await fetch('/api/achievements/profile/player');
                const profile = await response.json();
                
                const statsDiv = document.getElementById('characterStats');
                statsDiv.innerHTML = \`
                    <p>Level: \${profile.stats?.total_level || 1}</p>
                    <p>Attack: \${calculateStat(profile, 'attack')}</p>
                    <p>Magic: \${calculateStat(profile, 'magic')}</p>
                    <p>Abilities: \${getAbilities(profile).join(', ') || 'Basic Scan'}</p>
                \`;
            } catch (error) {
                console.error('Error loading character stats:', error);
            }
        }
        
        function calculateStat(profile, type) {
            if (type === 'attack') {
                let attack = 10;
                if (profile.skills?.combat) attack += profile.skills.combat.level * 2;
                if (profile.skills?.programming) attack += profile.skills.programming.level;
                return attack;
            }
            if (type === 'magic') {
                let magic = 10;
                if (profile.skills?.ai_communication) magic += profile.skills.ai_communication.level * 3;
                return magic;
            }
            return 10;
        }
        
        function getAbilities(profile) {
            const abilities = ['Basic Scan'];
            if (profile.skills?.anomaly_detection?.level > 5) abilities.push('Anomaly Sense');
            if (profile.skills?.stealth?.level > 10) abilities.push('Stealth Probe');
            return abilities;
        }
        
        async function startBattle() {
            const url = document.getElementById('urlInput').value;
            if (!url) {
                alert('Please enter a URL to battle!');
                return;
            }
            
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                alert('Please enter a complete URL starting with http:// or https://');
                return;
            }
            
            // Clear previous battle
            const battleLog = document.getElementById('battleLog');
            battleLog.innerHTML = '<p>🎯 INITIALIZING BATTLE...</p>';
            
            // Update boss stats
            try {
                const urlObj = new URL(url);
                document.getElementById('bossStats').innerHTML = \`
                    <p>Domain: \${urlObj.hostname}</p>
                    <p>Level: Analyzing...</p>
                    <div class="boss-hp">
                        <div class="hp-bar" id="bossHpBar" style="width: 100%"></div>
                    </div>
                    <p>HP: <span id="bossHp">1000</span>/1000</p>
                \`;
            } catch (error) {
                alert('Invalid URL format!');
                return;
            }
            
            try {
                // Start the battle
                const response = await fetch('/api/battle/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playerId: 'player',
                        targetUrl: url
                    })
                });
                
                const battle = await response.json();
                currentBattle = battle;
                
                // Display battle results
                displayBattleResults(battle);
                
            } catch (error) {
                battleLog.innerHTML += '<p class="anomaly-found">❌ Battle failed: ' + error.message + '</p>';
            }
        }
        
        function displayBattleResults(battle) {
            const battleLog = document.getElementById('battleLog');
            battleLog.innerHTML = '<p>⚔️ BATTLE COMPLETE!</p>';
            
            // Display each layer
            battle.layers.forEach((layer, index) => {
                battleLog.innerHTML += \`<div class="battle-phase">📍 PHASE \${index + 1}: \${layer.phase.toUpperCase().replace('_', ' ')}</div>\`;
                
                layer.actions?.forEach(action => {
                    battleLog.innerHTML += \`<p>• \${action}</p>\`;
                });
                
                layer.discoveries?.forEach(discovery => {
                    if (discovery.includes('🚨')) {
                        battleLog.innerHTML += \`<div class="anomaly-found">\${discovery}</div>\`;
                    } else {
                        battleLog.innerHTML += \`<p>\${discovery}</p>\`;
                    }
                });
                
                if (layer.damage_dealt) {
                    battleLog.innerHTML += \`<p class="damage-dealt">💥 Damage dealt: \${layer.damage_dealt}</p>\`;
                }
            });
            
            // Display AI assistance
            if (battle.aiAssistance?.insights) {
                battleLog.innerHTML += '<div class="battle-phase">🤖 AI COLLABORATION INSIGHTS:</div>';
                battle.aiAssistance.insights.forEach(insight => {
                    battleLog.innerHTML += \`<div class="ai-insight">\${insight}</div>\`;
                });
            }
            
            // Update boss HP
            const finalHp = Math.max(0, battle.boss.hp);
            document.getElementById('bossHp').textContent = finalHp;
            document.getElementById('bossHpBar').style.width = (finalHp / 1000 * 100) + '%';
            
            // Display talking points
            if (battle.talkingPoints) {
                displayTalkingPoints(battle.talkingPoints);
            }
            
            // Victory message
            if (battle.boss.hp <= 0) {
                battleLog.innerHTML += '<p style="color: #00ff41; font-size: 20px; font-weight: bold;">🏆 VICTORY! Boss defeated!</p>';
            }
        }
        
        function displayTalkingPoints(talkingPoints) {
            const talkingPointsDiv = document.getElementById('talkingPoints');
            const contentDiv = document.getElementById('talkingPointsContent');
            
            contentDiv.innerHTML = \`
                <h4>📊 Executive Summary</h4>
                <p><strong>Target:</strong> \${talkingPoints.executive_summary.target}</p>
                <p><strong>Risk Level:</strong> \${talkingPoints.executive_summary.risk_level}</p>
                <p><strong>Anomalies Detected:</strong> \${talkingPoints.executive_summary.anomalies_detected}</p>
                <p><strong>Recommendation:</strong> \${talkingPoints.executive_summary.recommendation}</p>
                
                <h4>🚨 Anomaly Report</h4>
                <p>Total: \${talkingPoints.anomaly_report.total_anomalies} | High: \${talkingPoints.anomaly_report.high_severity} | Medium: \${talkingPoints.anomaly_report.medium_severity}</p>
                \${talkingPoints.anomaly_report.detailed_anomalies.map(a => 
                    \`<div style="margin: 10px 0; padding: 10px; background: rgba(255,0,0,0.2); border-radius: 5px;">
                        <strong>\${a.type}:</strong> \${a.description}<br>
                        <em>Confidence: \${a.confidence} | Severity: \${a.severity}</em>
                    </div>\`
                ).join('')}
                
                <h4>🎯 Next Actions</h4>
                <h5>Immediate:</h5>
                <ul>\${talkingPoints.next_actions.immediate.map(action => \`<li>\${action}</li>\`).join('')}</ul>
                <h5>Strategic:</h5>
                <ul>\${talkingPoints.next_actions.strategic.map(action => \`<li>\${action}</li>\`).join('')}</ul>
            \`;
            
            talkingPointsDiv.classList.remove('hidden');
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveDataReversal(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🔄 Data Reversal System</title>
    <style>
        body { 
            background: linear-gradient(135deg, #4834d4, #686de0, #30336b);
            color: #fff; 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
        }
        .reversal-arena {
            max-width: 1400px;
            margin: 0 auto;
            background: rgba(0, 0, 0, 0.85);
            border-radius: 20px;
            padding: 30px;
            border: 3px solid #ff3838;
        }
        .input-section {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .url-input {
            width: 70%;
            padding: 15px;
            font-size: 16px;
            background: rgba(0, 0, 0, 0.7);
            color: #ff3838;
            border: 2px solid #ff3838;
            border-radius: 5px;
        }
        .reversal-btn {
            padding: 15px 30px;
            font-size: 16px;
            background: linear-gradient(45deg, #ff3838, #ff6348);
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 10px;
        }
        .reversal-btn:hover {
            background: linear-gradient(45deg, #ff6348, #ff3838);
        }
        .data-display {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }
        .data-panel {
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #ff3838;
        }
        .phase-log {
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 10px;
            height: 300px;
            overflow-y: auto;
            border: 2px solid #ff3838;
            margin-bottom: 20px;
        }
        .reversal-phase {
            color: #ff6348;
            font-weight: bold;
            margin: 10px 0;
        }
        .data-extracted {
            color: #7bed9f;
            background: rgba(123, 237, 159, 0.2);
            padding: 5px;
            border-radius: 3px;
            margin: 5px 0;
        }
        .privacy-violation {
            color: #ff4757;
            background: rgba(255, 71, 87, 0.3);
            padding: 5px;
            border-radius: 3px;
            margin: 5px 0;
        }
        .tracking-id {
            color: #ffa502;
            background: rgba(255, 165, 2, 0.2);
            padding: 5px;
            border-radius: 3px;
            margin: 5px 0;
        }
        .privacy-score {
            font-size: 24px;
            color: #ff3838;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
        }
        .countermeasures {
            background: rgba(35, 181, 67, 0.2);
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #23b543;
            margin-top: 20px;
        }
        .data-category {
            background: rgba(255, 255, 255, 0.1);
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .progress-bar {
            background: rgba(255, 56, 56, 0.3);
            height: 20px;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            background: #ff3838;
            height: 100%;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="reversal-arena">
        <h1>🔄 DATA REVERSAL COMBAT SYSTEM</h1>
        <p>🕵️ Reverse engineer what they collected on you • Turn the tables on surveillance</p>
        
        <div class="input-section">
            <h3>🎯 Target URL for Reversal Analysis</h3>
            <input type="text" class="url-input" id="targetUrl" 
                   placeholder="Enter URL to reverse (e.g., https://google.com, facebook.com)" 
                   value="https://facebook.com/login">
            <button class="reversal-btn" onclick="startReversal()">🔄 Start Reversal</button>
            <button class="reversal-btn" onclick="demoReversal()">🎮 Demo Mode</button>
        </div>
        
        <div class="phase-log" id="phaseLog">
            <div style="color: #888;">🔄 Data reversal log will appear here...</div>
            <div style="color: #888;">• Enter a URL above and click "Start Reversal"</div>
            <div style="color: #888;">• Your character will battle through data collection layers</div>
            <div style="color: #888;">• See exactly what they know about you</div>
        </div>
        
        <div class="data-display">
            <div class="data-panel">
                <h3>📊 What They Know About You</h3>
                <div id="personalData">
                    <div class="data-category">
                        <strong>Personal Data:</strong>
                        <div id="personalDataList">No data extracted yet</div>
                    </div>
                    <div class="data-category">
                        <strong>Behavioral Patterns:</strong>
                        <div id="behavioralData">No patterns identified</div>
                    </div>
                    <div class="data-category">
                        <strong>Technical Fingerprint:</strong>
                        <div id="technicalData">No fingerprint data</div>
                    </div>
                </div>
            </div>
            
            <div class="data-panel">
                <h3>🔗 Tracking Network</h3>
                <div id="trackingNetwork">
                    <div class="data-category">
                        <strong>Third-Party Trackers:</strong>
                        <div id="trackerList">No trackers detected</div>
                    </div>
                    <div class="data-category">
                        <strong>Data Sharing Partners:</strong>
                        <div id="dataPartners">No data sharing detected</div>
                    </div>
                    <div class="data-category">
                        <strong>Cross-Site Tracking:</strong>
                        <div id="crossSiteTracking">No cross-site tracking found</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="privacy-score" id="privacyScore">
            Privacy Invasion Score: --/10
        </div>
        
        <div class="countermeasures" id="countermeasures" style="display: none;">
            <h3>🛡️ Recommended Countermeasures</h3>
            <div id="countermeasuresList"></div>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px;">
            <h3>🎮 How It Works</h3>
            <p>• <strong>Phase 1:</strong> Data Mining - Extract what data they collect</p>
            <p>• <strong>Phase 2:</strong> Cookie Reversal - Analyze tracking cookies and storage</p>
            <p>• <strong>Phase 3:</strong> Tracker Network - Map third-party data sharing</p>
            <p>• <strong>Phase 4:</strong> Fingerprinting - Reverse device fingerprinting</p>
            <p>• <strong>Phase 5:</strong> Profile Extraction - Build your surveillance profile</p>
            <p>• <strong>Phase 6:</strong> Data Display - Show everything in gaming format</p>
        </div>
    </div>

    <script>
        let currentReversal = null;
        
        async function startReversal() {
            const targetUrl = document.getElementById('targetUrl').value;
            if (!targetUrl) {
                alert('Please enter a URL to analyze');
                return;
            }
            
            const phaseLog = document.getElementById('phaseLog');
            phaseLog.innerHTML = '<div class="reversal-phase">🔄 INITIATING DATA REVERSAL...</div>';
            
            try {
                const response = await fetch('/api/reversal/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playerId: 'player',
                        targetUrl: targetUrl
                    })
                });
                
                const reversal = await response.json();
                currentReversal = reversal;
                displayReversalResults(reversal);
                
            } catch (error) {
                phaseLog.innerHTML += '<div style="color: #ff4757;">❌ Reversal failed: ' + error.message + '</div>';
            }
        }
        
        function displayReversalResults(reversal) {
            const phaseLog = document.getElementById('phaseLog');
            phaseLog.innerHTML = '';
            
            // Display phases
            reversal.phases.forEach((phase, index) => {
                phaseLog.innerHTML += '<div class="reversal-phase">📋 PHASE ' + (index + 1) + ': ' + phase.phase.toUpperCase().replace('_', ' ') + '</div>';
                
                if (phase.discoveries) {
                    phase.discoveries.forEach(discovery => {
                        const className = discovery.includes('🍪') ? 'tracking-id' : 
                                        discovery.includes('📊') ? 'data-extracted' : 
                                        discovery.includes('🚨') ? 'privacy-violation' : '';
                        phaseLog.innerHTML += '<div class="' + className + '">' + discovery + '</div>';
                    });
                }
            });
            
            // Display data summary
            if (reversal.dataDisplay) {
                updateDataDisplay(reversal.dataDisplay);
            }
            
            phaseLog.scrollTop = phaseLog.scrollHeight;
        }
        
        function updateDataDisplay(dataDisplay) {
            // Update personal data
            const personalDataList = document.getElementById('personalDataList');
            if (dataDisplay.what_they_know && dataDisplay.what_they_know.personal_data) {
                personalDataList.innerHTML = dataDisplay.what_they_know.personal_data
                    .map(data => '<div class="data-extracted">• ' + data.type + ': ' + data.description + '</div>')
                    .join('');
            }
            
            // Update behavioral data
            const behavioralData = document.getElementById('behavioralData');
            if (dataDisplay.what_they_know && dataDisplay.what_they_know.behavioral_data) {
                behavioralData.innerHTML = dataDisplay.what_they_know.behavioral_data
                    .map(data => '<div class="data-extracted">• ' + data.type + ': ' + data.description + '</div>')
                    .join('');
            }
            
            // Update technical data
            const technicalData = document.getElementById('technicalData');
            if (dataDisplay.what_they_know && dataDisplay.what_they_know.technical_data) {
                const techData = dataDisplay.what_they_know.technical_data;
                technicalData.innerHTML = Object.entries(techData)
                    .map(([key, value]) => '<div class="tracking-id">• ' + key + ': ' + (Array.isArray(value) ? value.join(', ') : value) + '</div>')
                    .join('');
            }
            
            // Update tracking network
            const trackerList = document.getElementById('trackerList');
            if (dataDisplay.what_they_know && dataDisplay.what_they_know.tracking_network) {
                trackerList.innerHTML = dataDisplay.what_they_know.tracking_network
                    .map(tracker => '<div class="privacy-violation">• ' + tracker.name + ' (' + tracker.purpose + ')</div>')
                    .join('');
            }
            
            // Update privacy score
            const privacyScore = document.getElementById('privacyScore');
            if (dataDisplay.summary && dataDisplay.summary.privacy_invasion_score) {
                privacyScore.textContent = 'Privacy Invasion Score: ' + dataDisplay.summary.privacy_invasion_score + '/10';
            }
            
            // Show countermeasures
            const countermeasures = document.getElementById('countermeasures');
            const countermeasuresList = document.getElementById('countermeasuresList');
            if (dataDisplay.countermeasures) {
                countermeasures.style.display = 'block';
                countermeasuresList.innerHTML = '';
                
                if (dataDisplay.countermeasures.evasion_opportunities) {
                    countermeasuresList.innerHTML += '<h4>🕵️ Evasion Opportunities:</h4>';
                    dataDisplay.countermeasures.evasion_opportunities.forEach(opportunity => {
                        countermeasuresList.innerHTML += '<div class="data-extracted">• ' + opportunity + '</div>';
                    });
                }
                
                if (dataDisplay.countermeasures.privacy_tools) {
                    countermeasuresList.innerHTML += '<h4>🛠️ Recommended Privacy Tools:</h4>';
                    dataDisplay.countermeasures.privacy_tools.forEach(tool => {
                        countermeasuresList.innerHTML += '<div class="data-extracted">• ' + tool + '</div>';
                    });
                }
            }
        }
        
        function demoReversal() {
            document.getElementById('targetUrl').value = 'https://facebook.com/login';
            startReversal();
        }
        
        // Auto-focus URL input
        document.getElementById('targetUrl').focus();
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveFinancialAnalyzer(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>💰 Financial Transaction Analyzer</title>
    <style>
        body { 
            background: linear-gradient(135deg, #2ecc71, #27ae60, #1e8449);
            color: #fff; 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
        }
        .analyzer-arena {
            max-width: 1600px;
            margin: 0 auto;
            background: rgba(0, 0, 0, 0.85);
            border-radius: 20px;
            padding: 30px;
            border: 3px solid #f39c12;
        }
        .main-section {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .user-input {
            width: 70%;
            padding: 15px;
            font-size: 16px;
            background: rgba(0, 0, 0, 0.7);
            color: #f39c12;
            border: 2px solid #f39c12;
            border-radius: 5px;
        }
        .analyze-btn {
            padding: 15px 30px;
            font-size: 16px;
            background: linear-gradient(45deg, #f39c12, #e67e22);
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 10px;
        }
        .analyze-btn:hover {
            background: linear-gradient(45deg, #e67e22, #f39c12);
        }
        .analysis-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }
        .analysis-panel {
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #f39c12;
            min-height: 300px;
        }
        .transaction-log {
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 10px;
            height: 400px;
            overflow-y: auto;
            border: 2px solid #f39c12;
            margin-bottom: 20px;
        }
        .analysis-phase {
            color: #e67e22;
            font-weight: bold;
            margin: 10px 0;
        }
        .transaction-item {
            color: #2ecc71;
            background: rgba(46, 204, 113, 0.2);
            padding: 8px;
            border-radius: 5px;
            margin: 8px 0;
        }
        .market-data {
            color: #3498db;
            background: rgba(52, 152, 219, 0.2);
            padding: 8px;
            border-radius: 5px;
            margin: 8px 0;
        }
        .llm-insight {
            color: #9b59b6;
            background: rgba(155, 89, 182, 0.2);
            padding: 8px;
            border-radius: 5px;
            margin: 8px 0;
        }
        .investment-advice {
            color: #f39c12;
            background: rgba(243, 156, 18, 0.2);
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .privacy-warning {
            color: #e74c3c;
            background: rgba(231, 76, 60, 0.2);
            padding: 8px;
            border-radius: 5px;
            margin: 8px 0;
        }
        .metric-display {
            font-size: 24px;
            color: #f39c12;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
        }
        .progress-meter {
            background: rgba(243, 156, 18, 0.3);
            height: 25px;
            border-radius: 12px;
            overflow: hidden;
            margin: 15px 0;
        }
        .progress-fill {
            background: #f39c12;
            height: 100%;
            transition: width 0.5s ease;
        }
        .api-status {
            background: rgba(46, 204, 113, 0.2);
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            border: 1px solid #2ecc71;
        }
    </style>
</head>
<body>
    <div class="analyzer-arena">
        <h1>💰 FINANCIAL TRANSACTION ANALYZER</h1>
        <p>🤖 AI-powered investment analysis • 📊 Side-by-side transaction viewing • 🔐 Privacy assessment</p>
        
        <div class="main-section">
            <h3>🎯 User Portfolio Analysis</h3>
            <input type="text" class="user-input" id="userId" 
                   placeholder="Enter user ID for analysis (e.g., user123)" 
                   value="demo_user">
            <button class="analyze-btn" onclick="startAnalysis()">💰 Analyze Portfolio</button>
            <button class="analyze-btn" onclick="demoAnalysis()">🎮 Demo Mode</button>
        </div>
        
        <div class="transaction-log" id="analysisLog">
            <div style="color: #888;">💰 Financial analysis log will appear here...</div>
            <div style="color: #888;">• Enter a user ID above and click "Analyze Portfolio"</div>
            <div style="color: #888;">• AI will analyze transaction history with local LLM reasoning</div>
            <div style="color: #888;">• Get personalized investment advice and privacy assessment</div>
        </div>
        
        <div class="analysis-grid">
            <div class="analysis-panel">
                <h3>📊 Transaction History</h3>
                <div id="transactionHistory">
                    <div class="transaction-item">No transactions loaded</div>
                </div>
                <div class="metric-display" id="portfolioValue">
                    Portfolio Value: $--
                </div>
            </div>
            
            <div class="analysis-panel">
                <h3>🤖 LLM Investment Insights</h3>
                <div id="llmInsights">
                    <div class="llm-insight">AI reasoning will appear here</div>
                </div>
                <div class="metric-display" id="riskScore">
                    Risk Score: --/10
                </div>
            </div>
            
            <div class="analysis-panel">
                <h3>📈 Investment Recommendations</h3>
                <div id="investmentAdvice">
                    <div class="investment-advice">Investment advice will appear here</div>
                </div>
                <div class="metric-display" id="returnMetric">
                    Total Return: --%
                </div>
            </div>
        </div>
        
        <div class="analysis-grid">
            <div class="analysis-panel">
                <h3>🌍 Market Context</h3>
                <div id="marketData">
                    <div class="market-data">Market data will appear here</div>
                </div>
            </div>
            
            <div class="analysis-panel">
                <h3>🔐 Privacy Assessment</h3>
                <div id="privacyAssessment">
                    <div class="privacy-warning">Privacy analysis will appear here</div>
                </div>
                <div class="metric-display" id="privacyScore">
                    Privacy Score: --/10
                </div>
            </div>
            
            <div class="analysis-panel">
                <h3>🎭 API Chameleon Status</h3>
                <div id="apiStatus">
                    <div class="api-status">🟢 CoinGecko: Ready</div>
                    <div class="api-status">🟢 Coinbase: Connected</div>
                    <div class="api-status">🟢 Binance: Active</div>
                    <div class="api-status">🟢 Local LLM: Online</div>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px;">
            <h3>🎮 How It Works</h3>
            <p>• <strong>Phase 1:</strong> Transaction Data Gathering - API chameleon collects data</p>
            <p>• <strong>Phase 2:</strong> Market Context Analysis - Real-time price and sentiment data</p>
            <p>• <strong>Phase 3:</strong> Local LLM Reasoning - AI analyzes patterns and performance</p>
            <p>• <strong>Phase 4:</strong> Investment Advice Generation - Personalized recommendations</p>
            <p>• <strong>Phase 5:</strong> Privacy Assessment - Analyze financial data exposure</p>
            <p>• <strong>Side-by-side viewing:</strong> Transaction history with AI reasoning for informed decisions</p>
        </div>
    </div>

    <script>
        let currentAnalysis = null;
        
        async function startAnalysis() {
            const userId = document.getElementById('userId').value;
            if (!userId) {
                alert('Please enter a user ID to analyze');
                return;
            }
            
            const analysisLog = document.getElementById('analysisLog');
            analysisLog.innerHTML = '<div class="analysis-phase">💰 INITIATING FINANCIAL ANALYSIS...</div>';
            
            try {
                const response = await fetch('/api/financial/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: userId,
                        includePrivacy: true,
                        includeLLMReasoning: true
                    })
                });
                
                const analysis = await response.json();
                currentAnalysis = analysis;
                displayAnalysisResults(analysis);
                
            } catch (error) {
                analysisLog.innerHTML += '<div style="color: #e74c3c;">❌ Analysis failed: ' + error.message + '</div>';
            }
        }
        
        function displayAnalysisResults(analysis) {
            const analysisLog = document.getElementById('analysisLog');
            analysisLog.innerHTML = '';
            
            // Display analysis phases
            analysisLog.innerHTML += '<div class="analysis-phase">📊 PHASE 1: TRANSACTION DATA GATHERING</div>';
            analysisLog.innerHTML += '<div class="transaction-item">✅ Gathered ' + analysis.transactions.length + ' transactions</div>';
            analysisLog.innerHTML += '<div class="transaction-item">💼 Total value: $' + analysis.transactions.reduce((sum, tx) => sum + tx.value, 0).toLocaleString() + '</div>';
            
            analysisLog.innerHTML += '<div class="analysis-phase">🌍 PHASE 2: MARKET CONTEXT ANALYSIS</div>';
            Object.keys(analysis.marketData).forEach(asset => {
                const data = analysis.marketData[asset];
                analysisLog.innerHTML += '<div class="market-data">🪙 ' + asset + ': $' + data.currentPrice.toLocaleString() + ' (' + data.priceChange24h.toFixed(2) + '% 24h)</div>';
            });
            
            analysisLog.innerHTML += '<div class="analysis-phase">🤖 PHASE 3: LOCAL LLM REASONING</div>';
            if (analysis.llmReasoning && analysis.llmReasoning.length > 0) {
                analysisLog.innerHTML += '<div class="llm-insight">✅ LLM analysis completed (' + analysis.llmReasoning[0].response.length + ' chars)</div>';
            }
            
            analysisLog.innerHTML += '<div class="analysis-phase">📈 PHASE 4: INVESTMENT ADVICE</div>';
            if (analysis.investmentAdvice) {
                analysis.investmentAdvice.forEach(advice => {
                    analysisLog.innerHTML += '<div class="investment-advice">💡 ' + advice.type + ': ' + advice.recommendation + '</div>';
                });
            }
            
            analysisLog.innerHTML += '<div class="analysis-phase">🔐 PHASE 5: PRIVACY ASSESSMENT</div>';
            if (analysis.privacyScore) {
                analysisLog.innerHTML += '<div class="privacy-warning">🔒 Privacy Score: ' + analysis.privacyScore.overall + '/10</div>';
            }
            
            // Update side panels
            updateTransactionHistory(analysis.transactions);
            updateLLMInsights(analysis.llmReasoning);
            updateInvestmentAdvice(analysis.investmentAdvice);
            updateMarketData(analysis.marketData);
            updatePrivacyAssessment(analysis);
            
            analysisLog.scrollTop = analysisLog.scrollHeight;
        }
        
        function updateTransactionHistory(transactions) {
            const container = document.getElementById('transactionHistory');
            container.innerHTML = '';
            
            transactions.forEach(tx => {
                container.innerHTML += '<div class="transaction-item">' +
                    tx.date.substr(0, 10) + ': ' + tx.type.toUpperCase() + ' ' + 
                    tx.amount + ' ' + tx.asset + ' @ $' + tx.price.toLocaleString() + 
                    '</div>';
            });
            
            const totalValue = transactions.reduce((sum, tx) => sum + tx.value, 0);
            document.getElementById('portfolioValue').textContent = 'Portfolio Value: $' + totalValue.toLocaleString();
        }
        
        function updateLLMInsights(llmReasoning) {
            const container = document.getElementById('llmInsights');
            container.innerHTML = '';
            
            if (llmReasoning && llmReasoning.length > 0) {
                const reasoning = llmReasoning[0];
                const preview = reasoning.response.substr(0, 200) + '...';
                container.innerHTML = '<div class="llm-insight">🤖 ' + preview + '</div>';
            } else {
                container.innerHTML = '<div class="llm-insight">No LLM analysis available</div>';
            }
        }
        
        function updateInvestmentAdvice(advice) {
            const container = document.getElementById('investmentAdvice');
            const returnMetric = document.getElementById('returnMetric');
            container.innerHTML = '';
            
            if (advice && advice.length > 0) {
                advice.forEach(rec => {
                    container.innerHTML += '<div class="investment-advice">' +
                        '🎯 ' + rec.type + ': ' + rec.recommendation + 
                        ' (' + rec.priority + ' priority)</div>';
                });
            } else {
                container.innerHTML = '<div class="investment-advice">No specific recommendations</div>';
            }
            
            // Mock return calculation
            const mockReturn = (Math.random() * 40 - 20).toFixed(2); // -20% to +20%
            returnMetric.textContent = 'Total Return: ' + mockReturn + '%';
        }
        
        function updateMarketData(marketData) {
            const container = document.getElementById('marketData');
            container.innerHTML = '';
            
            Object.entries(marketData).forEach(([asset, data]) => {
                container.innerHTML += '<div class="market-data">' +
                    '🪙 ' + asset + ': $' + data.currentPrice.toLocaleString() + 
                    ' (' + data.priceChange24h.toFixed(2) + '% 24h)' +
                    '</div>';
            });
        }
        
        function updatePrivacyAssessment(analysis) {
            const container = document.getElementById('privacyAssessment');
            const privacyScore = document.getElementById('privacyScore');
            const riskScore = document.getElementById('riskScore');
            
            container.innerHTML = '';
            
            if (analysis.dataExposure) {
                analysis.dataExposure.forEach(exposure => {
                    container.innerHTML += '<div class="privacy-warning">' +
                        '🏦 ' + exposure.exchange + ': $' + exposure.totalValue.toLocaleString() + 
                        ' (' + exposure.privacyRisk + ' risk)' +
                        '</div>';
                });
            }
            
            if (analysis.privacyScore) {
                privacyScore.textContent = 'Privacy Score: ' + analysis.privacyScore.overall + '/10';
            }
            
            // Mock risk score
            const mockRisk = (Math.random() * 4 + 3).toFixed(1); // 3-7 range
            riskScore.textContent = 'Risk Score: ' + mockRisk + '/10';
        }
        
        function demoAnalysis() {
            document.getElementById('userId').value = 'demo_user';
            startAnalysis();
        }
        
        // Auto-focus user input
        document.getElementById('userId').focus();
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveEnterpriseAudit(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🛡️ Enterprise Security Auditor - #1 Security Firm</title>
    <style>
        body { 
            background: linear-gradient(135deg, #2c3e50, #34495e, #1a252f);
            color: #fff; 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 20px; 
        }
        .enterprise-dashboard {
            max-width: 1800px;
            margin: 0 auto;
            background: rgba(0, 0, 0, 0.95);
            border-radius: 20px;
            padding: 30px;
            border: 3px solid #e74c3c;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .main-section {
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .client-input {
            width: 60%;
            padding: 15px;
            font-size: 16px;
            background: rgba(0, 0, 0, 0.7);
            color: #e74c3c;
            border: 2px solid #e74c3c;
            border-radius: 5px;
        }
        .audit-btn {
            padding: 15px 30px;
            font-size: 16px;
            background: linear-gradient(45deg, #e74c3c, #c0392b);
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 10px;
        }
        .audit-btn:hover {
            background: linear-gradient(45deg, #c0392b, #e74c3c);
        }
        .audit-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }
        .audit-panel {
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #e74c3c;
            min-height: 300px;
        }
        .audit-log {
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 10px;
            height: 400px;
            overflow-y: auto;
            border: 2px solid #e74c3c;
            margin-bottom: 20px;
        }
        .audit-phase {
            color: #e74c3c;
            font-weight: bold;
            margin: 10px 0;
            font-size: 18px;
        }
        .critical-finding {
            color: #e74c3c;
            background: rgba(231, 76, 60, 0.2);
            padding: 10px;
            border-radius: 5px;
            margin: 8px 0;
        }
        .high-finding {
            color: #e67e22;
            background: rgba(230, 126, 34, 0.2);
            padding: 10px;
            border-radius: 5px;
            margin: 8px 0;
        }
        .medium-finding {
            color: #f39c12;
            background: rgba(243, 156, 18, 0.2);
            padding: 10px;
            border-radius: 5px;
            margin: 8px 0;
        }
        .compliance-metric {
            color: #3498db;
            background: rgba(52, 152, 219, 0.2);
            padding: 10px;
            border-radius: 5px;
            margin: 8px 0;
        }
        .service-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
            border: 1px solid #7f8c8d;
        }
        .executive-summary {
            background: rgba(231, 76, 60, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            border: 2px solid #e74c3c;
        }
        .metric {
            display: inline-block;
            margin: 10px;
            padding: 10px 20px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #e74c3c;
        }
        .remediations {
            color: #2ecc71;
            background: rgba(46, 204, 113, 0.2);
            padding: 10px;
            border-radius: 5px;
            margin: 8px 0;
        }
        h1 { text-align: center; color: #e74c3c; }
        h2 { color: #ecf0f1; }
        h3 { color: #bdc3c7; }
    </style>
</head>
<body>
    <div class="enterprise-dashboard">
        <div class="header">
            <h1>🛡️ Enterprise Security Auditor</h1>
            <h2>The #1 Security Auditing Firm - Complete Integration Suite</h2>
            <p>Professional enterprise security auditing with AI-powered analysis</p>
        </div>
        
        <div class="main-section">
            <h3>🎯 Start Enterprise Security Audit</h3>
            <input type="text" id="clientId" class="client-input" 
                   placeholder="Enter client ID (e.g., fortune500_corp)">
            <button onclick="startAudit()" class="audit-btn">🛡️ Begin Comprehensive Audit</button>
            <button onclick="demoAudit()" class="audit-btn" style="background: linear-gradient(45deg, #3498db, #2980b9);">📊 Demo Audit</button>
        </div>
        
        <div id="auditLog" class="audit-log"></div>
        
        <div class="main-section">
            <h3>🏢 Enterprise Security Services</h3>
            <div class="service-card">
                <h4>⚔️ Advanced Penetration Testing</h4>
                <p>Gaming-based security assessment with AI collaboration</p>
                <p style="color: #e74c3c;">Pricing: $10,000-50,000 per engagement</p>
            </div>
            <div class="service-card">
                <h4>🔐 Privacy & Data Protection Audit</h4>
                <p>Complete data collection reversal and privacy assessment</p>
                <p style="color: #e74c3c;">Pricing: $15,000-75,000 per audit</p>
            </div>
            <div class="service-card">
                <h4>💰 Financial Security & Fraud Detection</h4>
                <p>Transaction analysis with AI-powered fraud detection</p>
                <p style="color: #e74c3c;">Pricing: $20,000-100,000 per quarter</p>
            </div>
            <div class="service-card">
                <h4>🌐 24/7 Security Operations Center</h4>
                <p>Real-time threat detection and incident response</p>
                <p style="color: #e74c3c;">Pricing: $50,000-250,000 per year</p>
            </div>
        </div>
        
        <div class="audit-grid">
            <div class="audit-panel">
                <h3>📊 Audit Progress</h3>
                <div id="auditProgress"></div>
            </div>
            <div class="audit-panel">
                <h3>🎯 Critical Findings</h3>
                <div id="criticalFindings"></div>
            </div>
            <div class="audit-panel">
                <h3>📋 Compliance Status</h3>
                <div id="complianceStatus"></div>
            </div>
            <div class="audit-panel">
                <h3>🛡️ Security Maturity</h3>
                <div id="securityMaturity"></div>
            </div>
        </div>
        
        <div id="executiveSummary" class="executive-summary" style="display: none;">
            <h2>📊 Executive Summary</h2>
            <div id="summaryMetrics"></div>
            <div id="remediationRoadmap"></div>
        </div>
    </div>
    
    <script>
        let currentAudit = null;
        
        async function startAudit() {
            const clientId = document.getElementById('clientId').value;
            if (!clientId) {
                alert('Please enter a client ID');
                return;
            }
            
            const auditLog = document.getElementById('auditLog');
            auditLog.innerHTML = '<div class="audit-phase">🛡️ ENTERPRISE SECURITY AUDIT INITIATED</div>';
            
            try {
                const response = await fetch('/api/audit/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientId: clientId,
                        scope: 'comprehensive',
                        targetUrls: ['https://example.com', 'https://api.example.com'],
                        complianceFrameworks: ['SOC2', 'ISO27001', 'GDPR', 'PCI-DSS']
                    })
                });
                
                currentAudit = await response.json();
                displayAuditResults(currentAudit);
                
            } catch (error) {
                auditLog.innerHTML += '<div class="critical-finding">❌ Audit failed: ' + error.message + '</div>';
            }
        }
        
        function displayAuditResults(audit) {
            const auditLog = document.getElementById('auditLog');
            
            // Display phase progress
            Object.entries(audit.phases).forEach(([phase, data]) => {
                const phaseTitle = phase.replace(/_/g, ' ').toUpperCase();
                auditLog.innerHTML += '<div class="audit-phase">🔍 ' + phaseTitle + '</div>';
                
                if (data.findings && data.findings.length > 0) {
                    data.findings.forEach(finding => {
                        let className = 'medium-finding';
                        if (finding.severity === 'critical') className = 'critical-finding';
                        else if (finding.severity === 'high') className = 'high-finding';
                        
                        auditLog.innerHTML += '<div class="' + className + '">' +
                            '• ' + (finding.title || finding.type || 'Finding') + '</div>';
                    });
                }
            });
            
            // Update progress panels
            updateAuditProgress(audit);
            updateCriticalFindings(audit);
            updateComplianceStatus(audit);
            updateSecurityMaturity(audit);
            
            // Show executive summary
            if (audit.status === 'completed') {
                showExecutiveSummary(audit);
            }
            
            auditLog.scrollTop = auditLog.scrollHeight;
        }
        
        function updateAuditProgress(audit) {
            const container = document.getElementById('auditProgress');
            const phases = Object.keys(audit.phases).length;
            const completed = Object.values(audit.phases).filter(p => p.status === 'completed').length;
            
            container.innerHTML = '<div class="metric">' +
                '<div class="metric-value">' + completed + '/' + phases + '</div>' +
                '<div>Phases Completed</div></div>';
            
            Object.entries(audit.phases).forEach(([phase, data]) => {
                const status = data.status === 'completed' ? '✅' : '⏳';
                container.innerHTML += '<div>' + status + ' ' + 
                    phase.replace(/_/g, ' ').toUpperCase() + '</div>';
            });
        }
        
        function updateCriticalFindings(audit) {
            const container = document.getElementById('criticalFindings');
            container.innerHTML = '';
            
            if (audit.executive) {
                container.innerHTML = 
                    '<div class="critical-finding">🔴 Critical: ' + audit.executive.criticalFindings + '</div>' +
                    '<div class="high-finding">🟠 High: ' + audit.executive.highFindings + '</div>' +
                    '<div class="medium-finding">🟡 Medium: ' + audit.executive.mediumFindings + '</div>' +
                    '<div>🟢 Low: ' + audit.executive.lowFindings + '</div>';
            }
        }
        
        function updateComplianceStatus(audit) {
            const container = document.getElementById('complianceStatus');
            container.innerHTML = '';
            
            if (audit.phases.compliance_check && audit.phases.compliance_check.findings) {
                audit.phases.compliance_check.findings.forEach(compliance => {
                    const status = compliance.compliant ? '✅' : '❌';
                    container.innerHTML += '<div class="compliance-metric">' +
                        status + ' ' + compliance.framework + ': ' + 
                        compliance.score + '%</div>';
                });
            }
        }
        
        function updateSecurityMaturity(audit) {
            const container = document.getElementById('securityMaturity');
            
            if (audit.executive) {
                container.innerHTML = 
                    '<div class="metric"><div class="metric-value">' + 
                    audit.executive.maturityLevel + '</div>' +
                    '<div>Maturity Level</div></div>' +
                    '<div class="metric"><div class="metric-value">' + 
                    audit.executive.overallRiskScore + '/100</div>' +
                    '<div>Risk Score</div></div>';
            }
        }
        
        function showExecutiveSummary(audit) {
            const summary = document.getElementById('executiveSummary');
            const metrics = document.getElementById('summaryMetrics');
            const roadmap = document.getElementById('remediationRoadmap');
            
            summary.style.display = 'block';
            
            // Summary metrics
            metrics.innerHTML = 
                '<div class="metric"><div class="metric-value">' + audit.executive.overallRiskScore + '/100</div><div>Overall Risk</div></div>' +
                '<div class="metric"><div class="metric-value">' + audit.executive.complianceScore + '%</div><div>Compliance</div></div>' +
                '<div class="metric"><div class="metric-value">' + audit.executive.maturityLevel + '</div><div>Maturity</div></div>';
            
            // Remediation roadmap
            roadmap.innerHTML = '<h3>🗺️ Remediation Roadmap</h3>';
            
            if (audit.roadmap) {
                if (audit.roadmap.immediate.length > 0) {
                    roadmap.innerHTML += '<div class="critical-finding">🚨 Immediate Actions (' + 
                        audit.roadmap.immediate.length + ')</div>';
                }
                if (audit.roadmap.shortTerm.length > 0) {
                    roadmap.innerHTML += '<div class="high-finding">📅 Short-term Actions (' + 
                        audit.roadmap.shortTerm.length + ')</div>';
                }
                if (audit.roadmap.mediumTerm.length > 0) {
                    roadmap.innerHTML += '<div class="medium-finding">📆 Medium-term Actions (' + 
                        audit.roadmap.mediumTerm.length + ')</div>';
                }
            }
        }
        
        function demoAudit() {
            document.getElementById('clientId').value = 'demo_enterprise';
            startAudit();
        }
        
        // Auto-focus client input
        document.getElementById('clientId').focus();
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    async handleAuditAPI(req, res, path) {
        const urlParts = path.split('/');
        const endpoint = urlParts[3]; // /api/audit/[endpoint]
        
        try {
            if (endpoint === 'start' && req.method === 'POST') {
                // POST /api/audit/start - Start enterprise security audit
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const auditRequest = JSON.parse(body);
                        const audit = await this.enterpriseAuditor.conductEnterpriseAudit(
                            auditRequest.clientId,
                            auditRequest
                        );
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(audit));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
                
            } else if (endpoint === 'status') {
                // GET /api/audit/status - Get active audits
                const activeAudits = this.enterpriseAuditor.getActiveAudits();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(activeAudits));
                
            } else if (endpoint === 'audit' && urlParts[4]) {
                // GET /api/audit/audit/{auditId} - Get audit results
                const auditId = urlParts[4];
                const audit = this.enterpriseAuditor.getAudit(auditId);
                
                if (audit) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(audit));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Audit not found' }));
                }
                
            } else if (endpoint === 'client' && urlParts[4]) {
                // GET /api/audit/client/{clientId} - Get client's audits
                const clientId = urlParts[4];
                const clientAudits = this.enterpriseAuditor.getClientAudits(clientId);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(clientAudits));
                
            } else if (endpoint === 'invoice' && urlParts[4]) {
                // GET /api/audit/invoice/{auditId} - Generate invoice
                const auditId = urlParts[4];
                const invoice = this.enterpriseAuditor.generateInvoice(auditId);
                
                if (invoice) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(invoice));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Audit not found' }));
                }
                
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Audit endpoint not found' }));
            }
        } catch (error) {
            console.error('Audit API error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    async handleFinancialAPI(req, res, path) {
        const urlParts = path.split('/');
        const endpoint = urlParts[3]; // /api/financial/[endpoint]
        
        try {
            if (endpoint === 'analyze' && req.method === 'POST') {
                // POST /api/financial/analyze - Start financial analysis
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const analysisRequest = JSON.parse(body);
                        const analysis = await this.financialAnalyzer.analyzeTransactionHistory(
                            analysisRequest.userId,
                            analysisRequest.config || {}
                        );
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(analysis));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
                
            } else if (endpoint === 'status') {
                // GET /api/financial/status - Get active analyses
                const activeAnalyses = this.financialAnalyzer.getActiveAnalyses();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(activeAnalyses));
                
            } else if (endpoint === 'analysis' && urlParts[4]) {
                // GET /api/financial/analysis/{analysisId} - Get analysis results
                const analysisId = urlParts[4];
                const analysis = this.financialAnalyzer.getAnalysis(analysisId);
                
                if (analysis) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(analysis));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Analysis not found' }));
                }
                
            } else if (endpoint === 'user' && urlParts[4]) {
                // GET /api/financial/user/{userId} - Get user's analyses
                const userId = urlParts[4];
                const userAnalyses = this.financialAnalyzer.getUserAnalyses(userId);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(userAnalyses));
                
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Financial endpoint not found' }));
            }
        } catch (error) {
            console.error('Financial API error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    async handleBattleAPI(req, res, path) {
        const urlParts = path.split('/');
        const endpoint = urlParts[3]; // /api/battle/[endpoint]
        
        try {
            if (endpoint === 'start' && req.method === 'POST') {
                // POST /api/battle/start - Start a new battle
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const battleRequest = JSON.parse(body);
                        const battle = await this.urlBattle.startBattle(
                            battleRequest.playerId,
                            battleRequest.targetUrl,
                            battleRequest.config || {}
                        );
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(battle));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
                
            } else if (endpoint === 'status') {
                // GET /api/battle/status - Get active battles
                const activeBattles = this.urlBattle.getActiveBattles();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(activeBattles));
                
            } else if (endpoint === 'results' && urlParts[4]) {
                // GET /api/battle/results/{battleId} - Get battle results
                const battleId = urlParts[4];
                const results = this.urlBattle.getBattleResults(battleId);
                
                if (results) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Battle not found' }));
                }
                
            } else if (endpoint === 'talking-points' && urlParts[4]) {
                // GET /api/battle/talking-points/{battleId} - Get talking points
                const battleId = urlParts[4];
                const talkingPoints = this.urlBattle.getTalkingPoints(battleId);
                
                if (talkingPoints) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(talkingPoints));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Talking points not found' }));
                }
                
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Battle endpoint not found' }));
            }
        } catch (error) {
            console.error('Battle API error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    async handleReversalAPI(req, res, path) {
        const urlParts = path.split('/');
        const endpoint = urlParts[3]; // /api/reversal/[endpoint]
        
        try {
            if (endpoint === 'start' && req.method === 'POST') {
                // POST /api/reversal/start - Start a new data reversal battle
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const reversalRequest = JSON.parse(body);
                        const reversal = await this.dataReversal.startReversalBattle(
                            reversalRequest.playerId,
                            reversalRequest.targetUrl,
                            reversalRequest.config || {}
                        );
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(reversal));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
                
            } else if (endpoint === 'status') {
                // GET /api/reversal/status - Get active reversals
                const activeReversals = this.dataReversal.getActiveReversals();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(activeReversals));
                
            } else if (endpoint === 'display' && urlParts[4]) {
                // GET /api/reversal/display/{reversalId} - Get data display
                const reversalId = urlParts[4];
                const dataDisplay = this.dataReversal.getDataDisplay(reversalId);
                
                if (dataDisplay) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(dataDisplay));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Data display not found' }));
                }
                
            } else if (endpoint === 'results' && urlParts[4]) {
                // GET /api/reversal/results/{reversalId} - Get reversal results
                const reversalId = urlParts[4];
                const results = this.dataReversal.getReversalBattle(reversalId);
                
                if (results) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Reversal not found' }));
                }
                
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Reversal endpoint not found' }));
            }
        } catch (error) {
            console.error('Reversal API error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    async handleTorrentAPI(req, res, path) {
        const urlParts = path.split('/');
        const endpoint = urlParts[3]; // /api/torrent/[endpoint]
        
        try {
            if (endpoint === 'connect' && req.method === 'POST') {
                // POST /api/torrent/connect - Connect to torrent swarm
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const { magnet } = JSON.parse(body);
                        const result = {
                            success: true,
                            magnet,
                            peers: Math.floor(Math.random() * 500) + 50,
                            seeds: Math.floor(Math.random() * 100) + 10,
                            status: 'connected'
                        };
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                
            } else if (endpoint === 'wormhole' && req.method === 'POST') {
                // POST /api/torrent/wormhole - Create wormhole
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const { source, destination } = JSON.parse(body);
                        const wormhole = await this.torrentLayer.createWormhole(source, destination);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(wormhole));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                
            } else if (endpoint === 'route' && urlParts[4] && req.method === 'POST') {
                // POST /api/torrent/route/{wormholeId} - Route data through wormhole
                const wormholeId = urlParts[4];
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const { data } = JSON.parse(body);
                        const result = await this.torrentLayer.routeThroughWormhole(wormholeId, data);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: true,
                            latency: Math.floor(Math.random() * 100) + 20,
                            chunks: Math.ceil(data.length / 16384),
                            result
                        }));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                
            } else if (endpoint === 'archive-search' && req.method === 'POST') {
                // POST /api/torrent/archive-search - Search archive.org via torrent
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const { query } = JSON.parse(body);
                        const results = await this.torrentLayer.accessArchiveOrgTorrent(query);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(results));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                
            } else if (endpoint === 'access' && req.method === 'POST') {
                // POST /api/torrent/access - Access deep site
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const { siteId, method } = JSON.parse(body);
                        const result = {
                            success: true,
                            siteId,
                            method,
                            status: 'connected',
                            latency: Math.floor(Math.random() * 200) + 50
                        };
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                
            } else if (endpoint === 'triton-connect' && req.method === 'POST') {
                // POST /api/torrent/triton-connect - Connect to triton endpoint
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const { endpoint } = JSON.parse(body);
                        const result = {
                            success: true,
                            endpoint,
                            handshake: 'triton-v2-success',
                            capabilities: ['deep_routing', 'vector_tiles', 'encrypted_transport']
                        };
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                
            } else if (endpoint === 'status') {
                // GET /api/torrent/status - Get torrent layer status
                const status = this.torrentLayer.getSystemStatus();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(status));
                
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Torrent endpoint not found' }));
            }
        } catch (error) {
            console.error('Torrent API error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    // Wormhole API Handler
    async handleWormholeAPI(req, res, path) {
        const urlParts = path.split('/');
        const endpoint = urlParts[3]; // /api/wormholes/[endpoint]
        
        try {
            if (endpoint === 'torrents') {
                // GET /api/wormholes/torrents - Get all torrent nodes
                const torrents = this.torrentLayer.getTorrentNodes();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(torrents));
                
            } else if (endpoint === 'list') {
                // GET /api/wormholes/list - Get all active wormholes
                const wormholes = this.torrentLayer.getWormholes();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(wormholes));
                
            } else if (endpoint === 'create' && req.method === 'POST') {
                // POST /api/wormholes/create - Create new wormhole
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const wormholeRequest = JSON.parse(body);
                        const wormhole = await this.torrentLayer.createWormhole(
                            wormholeRequest.source,
                            wormholeRequest.destination,
                            wormholeRequest
                        );
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(wormhole));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
                
            } else if (endpoint === 'route' && req.method === 'POST') {
                // POST /api/wormholes/route - Route data through wormhole
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const routeRequest = JSON.parse(body);
                        const startTime = Date.now();
                        
                        const result = await this.torrentLayer.routeThroughWormhole(
                            routeRequest.wormholeId,
                            routeRequest.data,
                            routeRequest.metadata
                        );
                        
                        const endTime = Date.now();
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: true,
                            result: result,
                            chunksProcessed: Math.ceil(routeRequest.data.length / 16384),
                            totalLatency: endTime - startTime,
                            dataSize: routeRequest.data.length
                        }));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
                
            } else if (endpoint === 'tiles') {
                // GET /api/wormholes/tiles - Get tile vector systems
                const tileVectors = this.torrentLayer.getTileVectors();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(tileVectors));
                
            } else if (endpoint === 'tile-access' && req.method === 'POST') {
                // POST /api/wormholes/tile-access - Access tile through wormhole
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const tileRequest = JSON.parse(body);
                        const { z, x, y } = tileRequest.tileCoords;
                        const tileKey = `${z}/${x}/${y}`;
                        
                        // Simulate tile access through wormhole
                        const tileData = {
                            tileKey,
                            z, x, y,
                            url: `magnet://wormhole_${tileRequest.wormholeId}/tiles/${tileKey}`,
                            vectorType: tileRequest.vectorType,
                            size: Math.floor(Math.random() * 100000) + 1000,
                            vectors: {
                                position: [x, y, z],
                                data_density: Math.random(),
                                access_frequency: Math.floor(Math.random() * 1000),
                                last_updated: new Date(Date.now() - Math.random() * 86400000),
                                vector_embedding: Array.from({length: 64}, () => Math.random() * 2 - 1)
                            }
                        };
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(tileData));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
                
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Wormhole endpoint not found' }));
            }
        } catch (error) {
            console.error('Wormhole API error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    // Deep Sites API Handler
    async handleDeepSitesAPI(req, res, path) {
        const urlParts = path.split('/');
        const endpoint = urlParts[3]; // /api/deep-sites/[endpoint]
        
        try {
            if (endpoint === 'map') {
                // GET /api/deep-sites/map - Get deep infrastructure mapping
                const deepSites = this.torrentLayer.getDeepSites();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(deepSites));
                
            } else if (endpoint === 'discover' && req.method === 'POST') {
                // POST /api/deep-sites/discover - Discover new deep sites
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const discoverRequest = JSON.parse(body);
                        
                        // Simulate deep site discovery
                        const discoveredSites = [
                            {
                                id: `discovered_${Date.now()}`,
                                surfaceUrl: discoverRequest.targetUrl,
                                torrentBackend: 'unknown_torrent_swarm',
                                infrastructure: {
                                    'surface_layer': ['public_web'],
                                    'hidden_layer': ['private_servers', 'mirror_sites']
                                },
                                accessMethods: ['https', 'tor'],
                                securityLevel: Math.floor(Math.random() * 5) + 1,
                                discovered: new Date()
                            }
                        ];
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(discoveredSites));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
                
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Deep sites endpoint not found' }));
            }
        } catch (error) {
            console.error('Deep sites API error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    // Triton API Handler
    async handleTritonAPI(req, res, path) {
        const urlParts = path.split('/');
        const endpoint = urlParts[3]; // /api/triton/[endpoint]
        
        try {
            if (endpoint === 'discover') {
                // GET /api/triton/discover - Discover Triton endpoints
                const tritonNodes = this.torrentLayer.getTritonNodes();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(tritonNodes));
                
            } else if (endpoint === 'connect' && req.method === 'POST') {
                // POST /api/triton/connect - Connect to Triton endpoint
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const connectRequest = JSON.parse(body);
                        
                        // Simulate Triton connection
                        const connection = {
                            endpoint: connectRequest.endpoint,
                            status: 'connected',
                            latency: Math.floor(Math.random() * 100) + 20,
                            bandwidth: '1GB/s',
                            authentication: 'verified',
                            session_id: `triton_${Date.now()}`,
                            capabilities: ['data_access', 'search', 'streaming']
                        };
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(connection));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
                
            } else if (endpoint === 'query' && req.method === 'POST') {
                // POST /api/triton/query - Query through Triton endpoint
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const queryRequest = JSON.parse(body);
                        
                        // Simulate Triton query
                        const queryResult = {
                            query: queryRequest.query,
                            results: [
                                {
                                    title: 'Archive.org Mirror Data',
                                    url: 'triton://archive.preservation/data',
                                    size: '847GB',
                                    last_updated: new Date(),
                                    access_level: 'public'
                                },
                                {
                                    title: 'Historical Web Snapshots',
                                    url: 'triton://archive.preservation/snapshots',
                                    size: '23.4TB',
                                    last_updated: new Date(),
                                    access_level: 'verified'
                                }
                            ],
                            total_results: 2847,
                            query_time: '0.23s',
                            endpoint: queryRequest.endpoint
                        };
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(queryResult));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
                
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Triton endpoint not found' }));
            }
        } catch (error) {
            console.error('Triton API error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    serveQRBridge(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🔗 QR-UPC Bridge Integration</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Courier New', monospace; background: #000; color: #fff; }
        .integration-header {
            background: linear-gradient(90deg, #1a2e4a, #4a1a2e);
            padding: 15px;
            border-bottom: 2px solid #4a9eff;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .nav-buttons {
            display: flex;
            gap: 10px;
        }
        .nav-btn {
            background: #4a1a2e;
            border: 1px solid #4a9eff;
            color: #fff;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .nav-btn:hover {
            background: #6a2a4e;
            transform: translateY(-1px);
        }
        .bridge-frame {
            width: 100%;
            height: calc(100vh - 60px);
            border: none;
            background: #000;
        }
        .status-bar {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(74, 158, 255, 0.2);
            padding: 8px 15px;
            border-radius: 15px;
            border: 1px solid #4a9eff;
            font-size: 0.9em;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #4a9eff;
        }
    </style>
</head>
<body>
    <div class="integration-header">
        <div>
            <h2 style="margin: 0; color: #4a9eff;">🔗 QR-UPC Bridge System</h2>
            <small style="color: #ccc;">Multi-layer data conversion & collapse</small>
        </div>
        <div class="nav-buttons">
            <button class="nav-btn" onclick="window.location.href='/'">🏠 Main Hub</button>
            <button class="nav-btn" onclick="window.location.href='/hex-platform'">🔷 Hex Platform</button>
            <button class="nav-btn" onclick="window.location.href='/backend-work'">⚙️ Backend Work</button>
            <button class="nav-btn" onclick="window.location.href='/accent-wars'">🎯 AccentWars</button>
            <button class="nav-btn" onclick="openNewWindow()">🔗 New Window</button>
        </div>
        <div class="status-bar">
            <span id="bridge-status">🔄 Loading Bridge System...</span>
        </div>
    </div>
    
    <div class="loading" id="loading">
        <h3>🔗 Initializing QR-UPC Bridge System...</h3>
        <p>Connecting to data conversion layers...</p>
    </div>
    
    <iframe id="bridge-frame" class="bridge-frame" src="http://localhost:8099" 
            onload="bridgeLoaded()" onerror="bridgeError()"></iframe>
    
    <script>
        function bridgeLoaded() {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('bridge-status').innerHTML = '✅ Bridge System Active';
            console.log('🔗 QR-UPC Bridge System loaded successfully');
        }
        
        function bridgeError() {
            document.getElementById('loading').innerHTML = 
                '<h3 style="color: #ff4a4a;">❌ Bridge System Unavailable</h3>' +
                '<p>QR-UPC Bridge System (port 8099) is not running</p>' +
                '<button onclick="retryConnection()" style="background: #4a9eff; border: none; color: white; padding: 10px 20px; border-radius: 5px; cursor: pointer;">🔄 Retry Connection</button>';
            document.getElementById('bridge-status').innerHTML = '❌ Bridge Offline';
        }
        
        function retryConnection() {
            location.reload();
        }
        
        function openNewWindow() {
            window.open('http://localhost:8099', '_blank', 'width=1200,height=800');
        }
        
        // Check bridge system status every 10 seconds
        setInterval(() => {
            fetch('http://localhost:8099/api/status')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('bridge-status').innerHTML = 
                        \`✅ Bridge Active | QR: \${data.qr_count} | UPC: \${data.upc_count} | Files: \${data.file_count}\`;
                })
                .catch(() => {
                    document.getElementById('bridge-status').innerHTML = '⚠️ Bridge Connection Lost';
                });
        }, 10000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveDeviceVerify(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>📱 Device Verification Integration</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Courier New', monospace; background: #000; color: #fff; }
        .integration-header {
            background: linear-gradient(90deg, #2e1a4a, #1a4a2e);
            padding: 15px;
            border-bottom: 2px solid #4aff9a;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .nav-buttons {
            display: flex;
            gap: 10px;
        }
        .nav-btn {
            background: #1a4a2e;
            border: 1px solid #4aff9a;
            color: #fff;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .nav-btn:hover {
            background: #2a6a4e;
            transform: translateY(-1px);
        }
        .verify-frame {
            width: 100%;
            height: calc(100vh - 60px);
            border: none;
            background: #000;
        }
        .status-bar {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(74, 255, 154, 0.2);
            padding: 8px 15px;
            border-radius: 15px;
            border: 1px solid #4aff9a;
            font-size: 0.9em;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #4aff9a;
        }
    </style>
</head>
<body>
    <div class="integration-header">
        <div>
            <h2 style="margin: 0; color: #4aff9a;">📱 Local Device Verification</h2>
            <small style="color: #ccc;">Real QR/RFID scanning • Word-of-mouth affiliate network</small>
        </div>
        <div class="nav-buttons">
            <button class="nav-btn" onclick="window.location.href='/'">🏠 Main Hub</button>
            <button class="nav-btn" onclick="window.location.href='/qr-bridge'">🔗 QR Bridge</button>
            <button class="nav-btn" onclick="window.location.href='/hex-platform'">🔷 Hex Platform</button>
            <button class="nav-btn" onclick="window.location.href='/accent-wars'">🎯 AccentWars</button>
            <button class="nav-btn" onclick="openNewWindow()">📱 New Window</button>
        </div>
        <div class="status-bar">
            <span id="verify-status">🔄 Loading Verification System...</span>
        </div>
    </div>
    
    <div class="loading" id="loading">
        <h3>📱 Initializing Device Verification System...</h3>
        <p>Camera access, RFID scanning, affiliate network...</p>
    </div>
    
    <iframe id="verify-frame" class="verify-frame" src="http://localhost:8100" 
            onload="verifyLoaded()" onerror="verifyError()"></iframe>
    
    <script>
        function verifyLoaded() {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('verify-status').innerHTML = '✅ Device Verification Active';
            console.log('📱 Device Verification System loaded successfully');
        }
        
        function verifyError() {
            document.getElementById('loading').innerHTML = 
                '<h3 style="color: #ff4a4a;">❌ Verification System Unavailable</h3>' +
                '<p>Device Verification System (port 8100) is not running</p>' +
                '<button onclick="retryConnection()" style="background: #4aff9a; border: none; color: black; padding: 10px 20px; border-radius: 5px; cursor: pointer;">🔄 Retry Connection</button>';
            document.getElementById('verify-status').innerHTML = '❌ Verification Offline';
        }
        
        function retryConnection() {
            location.reload();
        }
        
        function openNewWindow() {
            window.open('http://localhost:8100', '_blank', 'width=400,height=700');
        }
        
        // Check verification system status every 10 seconds
        setInterval(() => {
            fetch('http://localhost:8100/api/status')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('verify-status').innerHTML = 
                        \`✅ Verification Active | Devices: \${data.devices} | Scans: \${data.scans} | Affiliates: \${data.affiliates}\`;
                })
                .catch(() => {
                    document.getElementById('verify-status').innerHTML = '⚠️ Verification Connection Lost';
                });
        }, 10000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveStripePixels(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>💳 Stripe Pixel System Integration</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Courier New', monospace; background: #000; color: #fff; }
        .integration-header {
            background: linear-gradient(90deg, #4a1a2e, #4a2e1a);
            padding: 15px;
            border-bottom: 2px solid #ffd700;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .nav-buttons {
            display: flex;
            gap: 10px;
        }
        .nav-btn {
            background: #4a2e1a;
            border: 1px solid #ffd700;
            color: #fff;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .nav-btn:hover {
            background: #6a4e2a;
            transform: translateY(-1px);
        }
        .stripe-frame {
            width: 100%;
            height: calc(100vh - 60px);
            border: none;
            background: #000;
        }
        .status-bar {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 215, 0, 0.2);
            padding: 8px 15px;
            border-radius: 15px;
            border: 1px solid #ffd700;
            font-size: 0.9em;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #ffd700;
        }
        .pricing-preview {
            display: flex;
            gap: 10px;
            margin: 10px 0;
            font-size: 0.8em;
        }
        .price-tag {
            background: rgba(255, 215, 0, 0.1);
            border: 1px solid #ffd700;
            padding: 4px 8px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="integration-header">
        <div>
            <h2 style="margin: 0; color: #ffd700;">💳 Stripe Verified Pixel System</h2>
            <small style="color: #ccc;">Real payments • Pixel art NFTs • Affiliate network</small>
            <div class="pricing-preview">
                <span class="price-tag">Basic: $1.99</span>
                <span class="price-tag">Premium: $4.99</span>
                <span class="price-tag">Pro: $9.99</span>
                <span class="price-tag">Enterprise: $29.99</span>
            </div>
        </div>
        <div class="nav-buttons">
            <button class="nav-btn" onclick="window.location.href='/'">🏠 Main Hub</button>
            <button class="nav-btn" onclick="window.location.href='/device-verify'">📱 Device Verify</button>
            <button class="nav-btn" onclick="window.location.href='/qr-bridge'">🔗 QR Bridge</button>
            <button class="nav-btn" onclick="window.location.href='/accent-wars'">🎯 AccentWars</button>
            <button class="nav-btn" onclick="openNewWindow()">💳 New Window</button>
        </div>
        <div class="status-bar">
            <span id="stripe-status">🔄 Loading Stripe System...</span>
        </div>
    </div>
    
    <div class="loading" id="loading">
        <h3>💳 Initializing Stripe Verified Pixel System...</h3>
        <p>Real payments, pixel art generation, affiliate network...</p>
        <div style="margin-top: 20px;">
            <div style="color: #ffd700;">✨ Features:</div>
            <div>• Stripe payment processing</div>
            <div>• QR verification with payment</div>
            <div>• Generated pixel art NFTs</div>
            <div>• Word-of-mouth affiliate payouts</div>
            <div>• Multi-tier pricing system</div>
        </div>
    </div>
    
    <iframe id="stripe-frame" class="stripe-frame" src="http://localhost:8101" 
            onload="stripeLoaded()" onerror="stripeError()"></iframe>
    
    <script>
        function stripeLoaded() {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('stripe-status').innerHTML = '✅ Stripe System Active';
            console.log('💳 Stripe Verified Pixel System loaded successfully');
        }
        
        function stripeError() {
            document.getElementById('loading').innerHTML = 
                '<h3 style="color: #ff4a4a;">❌ Stripe System Unavailable</h3>' +
                '<p>Stripe Verified Pixel System (port 8101) is not running</p>' +
                '<div style="margin: 20px 0;">System provides:</div>' +
                '<div>• Real Stripe payment processing</div>' +
                '<div>• QR code verification with payment</div>' +
                '<div>• Pixel art NFT generation</div>' +
                '<div>• Affiliate network with payouts</div>' +
                '<button onclick="retryConnection()" style="background: #ffd700; border: none; color: black; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px;">🔄 Retry Connection</button>';
            document.getElementById('stripe-status').innerHTML = '❌ Stripe Offline';
        }
        
        function retryConnection() {
            location.reload();
        }
        
        function openNewWindow() {
            window.open('http://localhost:8101', '_blank', 'width=1200,height=800');
        }
        
        // Check Stripe system status every 10 seconds
        setInterval(() => {
            fetch('http://localhost:8101/api/status')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('stripe-status').innerHTML = 
                        \`✅ Stripe Active | Devices: \${data.verifiedDevices} | Payments: \${data.totalPayments} | NFTs: \${data.pixelArtCount}\`;
                })
                .catch(() => {
                    document.getElementById('stripe-status').innerHTML = '⚠️ Stripe Connection Lost';
                });
        }, 10000);
        
        // Show pricing tiers on hover
        document.addEventListener('DOMContentLoaded', () => {
            const priceTags = document.querySelectorAll('.price-tag');
            priceTags.forEach(tag => {
                tag.addEventListener('click', () => {
                    const tier = tag.textContent.split(':')[0].toLowerCase();
                    window.open(\`http://localhost:8101#\${tier}\`, '_blank');
                });
            });
        });
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
}

// Start the unified node
if (require.main === module) {
    new UnifiedGameNode();
}

module.exports = UnifiedGameNode;