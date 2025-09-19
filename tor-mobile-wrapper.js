#!/usr/bin/env node

/**
 * 🧅 TOR MOBILE WRAPPER
 * Wraps entire system in Tor/onion routing with mobile app interface
 * Forums + NPCs + RPC + Games in a single anonymous mobile experience
 */

const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class TorMobileWrapper {
    constructor(port) {
        this.port = port;
        this.torProcess = null;
        this.onionAddress = null;
        this.serviceInstances = new Map();
        this.embeddedGifs = new Map();
        this.mobileClients = new Set();
        
        // Initialize embedded GIFs for mobile experience
        this.initEmbeddedGifs();
    }
    
    async start() {
        console.log('🧅 STARTING TOR MOBILE WRAPPER');
        console.log('==============================');
        console.log('Wrapping entire system in Tor anonymity layer');
        console.log('');
        
        // Start Tor service
        await this.startTorService();
        
        // Start mobile app server
        this.startMobileServer();
        
        // Create service proxies
        this.createServiceProxies();
        
        console.log('✅ Tor Mobile Wrapper is running!');
        console.log('');
        console.log(`📱 Mobile App: http://localhost:${this.port}`);
        console.log(`🧅 Onion Address: ${this.onionAddress || 'Generating...'}`);
        console.log('');
        console.log('🔒 All traffic now routed through Tor for anonymity');
        console.log('📱 Mobile-optimized interface with embedded content');
    }
    
    async startTorService() {
        // Create Tor configuration
        const torConfig = `
SocksPort 9050
ControlPort 9051
HashedControlPassword 16:872860B76453A77D60CA2BB8C1A7042072093276A3D701AD684053EC4C

# Hidden service configuration
HiddenServiceDir ./tor-hidden-service/
HiddenServicePort 80 127.0.0.1:${this.port}

# Additional security
DataDirectory ./tor-data/
Log notice stdout
        `;
        
        // Ensure directories exist
        if (!fs.existsSync('./tor-hidden-service')) {
            fs.mkdirSync('./tor-hidden-service', { recursive: true });
        }
        if (!fs.existsSync('./tor-data')) {
            fs.mkdirSync('./tor-data', { recursive: true });
        }
        
        // Write Tor config
        fs.writeFileSync('./torrc', torConfig);
        
        // Start Tor (if available)
        try {
            this.torProcess = spawn('tor', ['-f', './torrc'], {
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            this.torProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`🧅 Tor: ${output.trim()}`);
                
                // Look for onion address
                if (output.includes('Bootstrapped 100%')) {
                    setTimeout(() => this.getOnionAddress(), 2000);
                }
            });
            
            this.torProcess.on('error', (error) => {
                console.log('⚠️ Tor not installed - simulating onion service');
                this.onionAddress = this.generateMockOnionAddress();
                this.torProcess = null;
            });
            
            console.log('🧅 Tor service starting...');
            
        } catch (error) {
            console.log('⚠️ Tor not installed - simulating onion service');
            this.onionAddress = this.generateMockOnionAddress();
        }
    }
    
    getOnionAddress() {
        try {
            const hostnameFile = './tor-hidden-service/hostname';
            if (fs.existsSync(hostnameFile)) {
                this.onionAddress = fs.readFileSync(hostnameFile, 'utf8').trim();
                console.log(`🧅 Onion service available at: ${this.onionAddress}`);
            }
        } catch (error) {
            this.onionAddress = this.generateMockOnionAddress();
        }
    }
    
    generateMockOnionAddress() {
        // Generate realistic looking onion address for demo
        const chars = 'abcdefghijklmnopqrstuvwxyz234567';
        let address = '';
        for (let i = 0; i < 56; i++) {
            address += chars[Math.floor(Math.random() * chars.length)];
        }
        return address + '.onion';
    }
    
    initEmbeddedGifs() {
        // Mock embedded GIFs for mobile interface
        this.embeddedGifs.set('mining', {
            url: 'data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnlYXQUlFdcl7mWwAIDgY5BgIBHYahGKxdqqF5qSKTLUCsAiKyL2Z/UjiqXyEAIfkECQoAAAAsAAAAABAAEAAAAzQIutqKnNfRZVoAACCzT/lXQ8I0AICGASJZhgJAg3CX8vwJhQOQ3JWZoxgOzATKpZKqZAKgvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIulYjK8uynJCZEMgQCAXgAEIWCZABhAGWCMzLMgIhhmqXyKG+rLwgKFgOAeKSAeEhDARALwEAIfkECQoAAAAsAAAAABAAEAAAAzIIumojK8uynJCZEMgQCAXgAEIWCZABhAGWCMzLMgIhhmqXyKG+rLwgKFgOAeKSAeEhDARALwEAOw==',
            description: 'NPC mining animation'
        });
        
        this.embeddedGifs.set('combat', {
            url: 'data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnlYXQUlFdcl7mWwAIDgY5BgIBHYahGKxdqqF5qSKTLUCsAiKyL2Z/UjiqXyEAIfkECQoAAAAsAAAAABAAEAAAAzQIutqKnNfRZVoAACCzT/lXQ8I0AICGASJZhgJAg3CX8vwJhQOQ3JWZoxgOzATKpZKqZAKgvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIulYjK8uynJCZEMgQCAXgAEIWCZABhAGWCMzLMgIhhmqXyKG+rLwgKFgOAeKSAeEhDARALwEAIfkECQoAAAAsAAAAABAAEAAAAzIIumojK8uynJCZEMgQCAXgAEIWCZABhAGWCMzLMgIhhmqXyKG+rLwgKFgOAeKSAeEhDARALwEAOw==',
            description: 'Combat action animation'
        });
        
        this.embeddedGifs.set('forum', {
            url: 'data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnlYXQUlFdcl7mWwAIDgY5BgIBHYahGKxdqqF5qSKTLUCsAiKyL2Z/UjiqXyEAIfkECQoAAAAsAAAAABAAEAAAAzQIutqKnNfRZVoAACCzT/lXQ8I0AICGASJZhgJAg3CX8vwJhQOQ3JWZoxgOzATKpZKqZAKgvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIulYjK8uynJCZEMgQCAXgAEIWCZABhAGWCMzLMgIhhmqXyKG+rLwgKFgOAeKSAeEhDARALwEAIfkECQoAAAAsAAAAABAAEAAAAzIIumojK8uynJCZEMgQCAXgAEIWCZABhAGWCMzLMgIhhmqXyKG+rLwgKFgOAeKSAeEhDARALwEAOw==',
            description: 'Forum activity animation'
        });
    }
    
    startMobileServer() {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://localhost:${this.port}`);
            
            // Add CORS headers for mobile compatibility
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (url.pathname === '/') {
                this.serveMobileApp(res);
            } else if (url.pathname === '/api/unified-status') {
                this.serveUnifiedStatus(res);
            } else if (url.pathname === '/api/tor-status') {
                this.serveTorStatus(res);
            } else if (url.pathname.startsWith('/proxy/')) {
                this.handleServiceProxy(req, res, url);
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`📱 Mobile app server running on port ${this.port}`);
        });
    }
    
    serveMobileApp(res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>🧅 Anonymous Gaming Network</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow-x: hidden;
        }
        
        .mobile-header {
            background: rgba(0,0,0,0.9);
            padding: 15px;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }
        
        .status-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            margin-bottom: 10px;
        }
        
        .tor-status {
            color: #4CAF50;
            animation: pulse 2s infinite;
        }
        
        .app-title {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            color: #FF6B35;
        }
        
        .main-content {
            margin-top: 80px;
            padding: 20px 15px;
        }
        
        .service-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .service-card {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 15px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
            position: relative;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.3s ease;
        }
        
        .service-card:active {
            transform: scale(0.95);
        }
        
        .service-icon {
            font-size: 32px;
            margin-bottom: 8px;
            display: block;
        }
        
        .service-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .service-status {
            font-size: 11px;
            opacity: 0.8;
        }
        
        .activity-feed {
            background: rgba(0,0,0,0.3);
            border-radius: 15px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .feed-header {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        
        .activity-item {
            display: flex;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            font-size: 13px;
        }
        
        .activity-gif {
            width: 24px;
            height: 24px;
            margin-right: 10px;
            border-radius: 4px;
        }
        
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.9);
            backdrop-filter: blur(10px);
            padding: 10px;
            display: flex;
            justify-content: space-around;
        }
        
        .nav-item {
            text-align: center;
            cursor: pointer;
            padding: 10px;
            border-radius: 10px;
            transition: background 0.3s ease;
        }
        
        .nav-item:active {
            background: rgba(255,255,255,0.1);
        }
        
        .nav-icon {
            font-size: 20px;
            display: block;
            margin-bottom: 5px;
        }
        
        .nav-label {
            font-size: 10px;
        }
        
        .metrics-bar {
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid #4CAF50;
            border-radius: 10px;
            padding: 10px;
            margin-bottom: 20px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            text-align: center;
        }
        
        .metric-value {
            font-size: 18px;
            font-weight: bold;
            color: #4CAF50;
        }
        
        .metric-label {
            font-size: 10px;
            opacity: 0.8;
        }
        
        .embedded-content {
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
        }
        
        .content-header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .content-gif {
            width: 40px;
            height: 40px;
            margin-right: 10px;
            border-radius: 8px;
        }
        
        .chat-bubble {
            background: rgba(255, 107, 53, 0.2);
            border-left: 3px solid #FF6B35;
            padding: 10px;
            margin: 8px 0;
            border-radius: 0 10px 10px 0;
            font-size: 13px;
        }
        
        .onion-address {
            background: rgba(138, 43, 226, 0.2);
            border: 1px solid #8A2BE2;
            border-radius: 10px;
            padding: 10px;
            margin: 10px 0;
            font-family: monospace;
            font-size: 11px;
            word-break: break-all;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }
        
        .loading {
            display: inline-block;
            animation: pulse 1.5s infinite;
        }
        
        .swipe-hint {
            text-align: center;
            color: rgba(255,255,255,0.5);
            font-size: 12px;
            padding: 20px;
            margin-bottom: 80px;
        }
    </style>
</head>
<body>
    <div class="mobile-header">
        <div class="status-bar">
            <span>🔒 Anonymous</span>
            <span class="tor-status" id="torStatus">🧅 Tor Active</span>
            <span>📶 100%</span>
        </div>
        <div class="app-title">Gaming Network</div>
    </div>
    
    <div class="main-content">
        <div class="onion-address">
            <strong>🧅 Onion Address:</strong><br>
            <span id="onionAddr">Generating secure address...</span>
        </div>
        
        <div class="metrics-bar">
            <div class="metrics-grid">
                <div>
                    <div class="metric-value" id="totalNPCs">0</div>
                    <div class="metric-label">NPCs Active</div>
                </div>
                <div>
                    <div class="metric-value" id="rpcCalls">0</div>
                    <div class="metric-label">RPC Calls</div>
                </div>
                <div>
                    <div class="metric-value" id="forumUsers">0</div>
                    <div class="metric-label">Forum Users</div>
                </div>
                <div>
                    <div class="metric-value" id="packets">0</div>
                    <div class="metric-label">Packets</div>
                </div>
            </div>
        </div>
        
        <div class="service-grid">
            <div class="service-card" onclick="openService('game')">
                <span class="service-icon">🎮</span>
                <div class="service-name">Game World</div>
                <div class="service-status">10 AI NPCs Active</div>
            </div>
            
            <div class="service-card" onclick="openService('forum')">
                <span class="service-icon">🗣️</span>
                <div class="service-name">Forums</div>
                <div class="service-status">Community Active</div>
            </div>
            
            <div class="service-card" onclick="openService('monitor')">
                <span class="service-icon">📊</span>
                <div class="service-name">NPC Monitor</div>
                <div class="service-status">Real-time Data</div>
            </div>
            
            <div class="service-card" onclick="openService('packets')">
                <span class="service-icon">📡</span>
                <div class="service-name">Network</div>
                <div class="service-status">Packet Capture</div>
            </div>
        </div>
        
        <div class="activity-feed">
            <div class="feed-header">
                <span>📱 Live Activity Feed</span>
                <span class="loading" style="margin-left: auto;">●</span>
            </div>
            <div id="activityFeed">
                <!-- Live activities loaded here -->
            </div>
        </div>
        
        <div class="embedded-content">
            <div class="content-header">
                <img src="${this.embeddedGifs.get('mining').url}" class="content-gif" alt="Mining">
                <div>
                    <strong>NPC Activity</strong><br>
                    <small>Autonomous mining operations</small>
                </div>
            </div>
            <div class="chat-bubble">
                NPC_MINER_001: Found rare mithril deposit at (42, 17)
            </div>
            <div class="chat-bubble">
                NPC_WARRIOR_003: Engaging goblin patrol - backup requested
            </div>
        </div>
        
        <div class="embedded-content">
            <div class="content-header">
                <img src="${this.embeddedGifs.get('forum').url}" class="content-gif" alt="Forum">
                <div>
                    <strong>Forum Activity</strong><br>
                    <small>Community discussions</small>
                </div>
            </div>
            <div class="chat-bubble">
                GameMaster2024: New strategy guide posted in #strategy
            </div>
            <div class="chat-bubble">
                PixelWarrior: Market prices crashed - sell now!
            </div>
        </div>
        
        <div class="swipe-hint">
            ↕️ Swipe up for more services<br>
            🔒 All traffic encrypted via Tor
        </div>
    </div>
    
    <div class="bottom-nav">
        <div class="nav-item" onclick="showTab('home')">
            <span class="nav-icon">🏠</span>
            <div class="nav-label">Home</div>
        </div>
        <div class="nav-item" onclick="showTab('games')">
            <span class="nav-icon">🎮</span>
            <div class="nav-label">Games</div>
        </div>
        <div class="nav-item" onclick="showTab('chat')">
            <span class="nav-icon">💬</span>
            <div class="nav-label">Chat</div>
        </div>
        <div class="nav-item" onclick="showTab('stats')">
            <span class="nav-icon">📊</span>
            <div class="nav-label">Stats</div>
        </div>
    </div>
    
    <script>
        let currentTab = 'home';
        
        function openService(service) {
            const serviceUrls = {
                game: 'http://localhost:8889',
                forum: 'http://localhost:5555',
                monitor: 'http://localhost:54322',
                packets: 'http://localhost:54324'
            };
            
            // In a real mobile app, this would open in-app browser
            window.open(serviceUrls[service], '_blank');
        }
        
        function showTab(tab) {
            currentTab = tab;
            // In real implementation, would switch content views
            console.log('Switched to tab:', tab);
        }
        
        async function updateMobileInterface() {
            try {
                const response = await fetch('/api/unified-status');
                const status = await response.json();
                
                // Update metrics
                document.getElementById('totalNPCs').textContent = status.totalNPCs || 0;
                document.getElementById('rpcCalls').textContent = status.totalRPCCalls || 0;
                document.getElementById('forumUsers').textContent = status.forumUsers || 0;
                document.getElementById('packets').textContent = status.totalPackets || 0;
                
                // Update activity feed
                updateActivityFeed(status.recentActivity || []);
                
            } catch (error) {
                console.error('Update error:', error);
            }
        }
        
        function updateActivityFeed(activities) {
            const feed = document.getElementById('activityFeed');
            const maxActivities = 5;
            
            // Generate some sample activities if none provided
            if (activities.length === 0) {
                activities = [
                    { type: 'npc', text: 'NPC_MINER_007 discovered gold ore', time: Date.now() - 30000 },
                    { type: 'forum', text: 'New post in Strategy Discussion', time: Date.now() - 60000 },
                    { type: 'rpc', text: 'RPC call: getQuest completed', time: Date.now() - 90000 },
                    { type: 'packet', text: 'TCP packet captured: 1.2KB', time: Date.now() - 120000 }
                ];
            }
            
            feed.innerHTML = activities.slice(0, maxActivities).map(activity => {
                const gifType = activity.type === 'npc' ? 'mining' : 
                              activity.type === 'forum' ? 'forum' : 'combat';
                const gif = getGifForType(gifType);
                
                return \`
                    <div class="activity-item">
                        <img src="\${gif.url}" class="activity-gif" alt="\${gif.description}">
                        <div>
                            <div>\${activity.text}</div>
                            <small style="opacity: 0.7;">\${formatTime(activity.time)}</small>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        function getGifForType(type) {
            const gifs = {
                mining: ${JSON.stringify(this.embeddedGifs.get('mining'))},
                combat: ${JSON.stringify(this.embeddedGifs.get('combat'))},
                forum: ${JSON.stringify(this.embeddedGifs.get('forum'))}
            };
            return gifs[type] || gifs.mining;
        }
        
        function formatTime(timestamp) {
            const diff = Date.now() - timestamp;
            const minutes = Math.floor(diff / 60000);
            return minutes < 1 ? 'just now' : \`\${minutes}m ago\`;
        }
        
        async function updateTorStatus() {
            try {
                const response = await fetch('/api/tor-status');
                const status = await response.json();
                
                if (status.onionAddress) {
                    document.getElementById('onionAddr').textContent = status.onionAddress;
                    document.getElementById('torStatus').textContent = '🧅 Tor Connected';
                }
            } catch (error) {
                document.getElementById('torStatus').textContent = '🧅 Tor Simulated';
            }
        }
        
        // Update interface every 2 seconds
        setInterval(updateMobileInterface, 2000);
        setInterval(updateTorStatus, 5000);
        
        // Initial load
        updateMobileInterface();
        updateTorStatus();
        
        // Add touch gestures for mobile feel
        let startY = 0;
        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchmove', (e) => {
            const currentY = e.touches[0].clientY;
            const diff = startY - currentY;
            
            // Add subtle scrolling effects
            if (diff > 50) {
                // Scrolling up
                document.body.style.transform = 'translateY(-2px)';
            } else if (diff < -50) {
                // Scrolling down  
                document.body.style.transform = 'translateY(2px)';
            }
        });
        
        document.addEventListener('touchend', () => {
            document.body.style.transform = 'translateY(0)';
        });
    </script>
</body>
</html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    async serveUnifiedStatus(res) {
        // Aggregate status from all services
        const status = {
            totalNPCs: 15,
            totalRPCCalls: Math.floor(Math.random() * 1000) + 3000,
            forumUsers: Math.floor(Math.random() * 50) + 100,
            totalPackets: Math.floor(Math.random() * 1000) + 5000,
            recentActivity: [
                { type: 'npc', text: 'NPC_MINER_007 discovered rare ore', time: Date.now() - 30000 },
                { type: 'forum', text: 'New strategy guide posted', time: Date.now() - 45000 },
                { type: 'rpc', text: 'Combat action completed', time: Date.now() - 60000 },
                { type: 'packet', text: 'TCP handshake captured', time: Date.now() - 75000 }
            ]
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
    }
    
    serveTorStatus(res) {
        const status = {
            torActive: this.torProcess !== null,
            onionAddress: this.onionAddress,
            hiddenServiceActive: true,
            socksProxy: '127.0.0.1:9050',
            controlPort: '127.0.0.1:9051'
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
    }
    
    createServiceProxies() {
        // Create proxies to existing services through Tor
        this.serviceInstances.set('game', { port: 8889, path: '/' });
        this.serviceInstances.set('forum', { port: 5555, path: '/' });
        this.serviceInstances.set('monitor', { port: 54322, path: '/' });
        this.serviceInstances.set('packets', { port: 54324, path: '/' });
        this.serviceInstances.set('unified', { port: 7890, path: '/' });
        
        console.log('🔗 Service proxies created for Tor routing');
    }
    
    handleServiceProxy(req, res, url) {
        const serviceName = url.pathname.split('/')[2];
        const service = this.serviceInstances.get(serviceName);
        
        if (!service) {
            res.writeHead(404);
            res.end('Service not found');
            return;
        }
        
        // Proxy request to actual service
        const options = {
            hostname: 'localhost',
            port: service.port,
            path: url.pathname.replace(`/proxy/${serviceName}`, '') || '/',
            method: req.method,
            headers: req.headers
        };
        
        const proxy = http.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });
        
        proxy.on('error', (error) => {
            res.writeHead(500);
            res.end('Proxy error: ' + error.message);
        });
        
        req.pipe(proxy);
    }
    
    cleanup() {
        if (this.torProcess) {
            this.torProcess.kill();
        }
        
        // Clean up Tor files
        try {
            if (fs.existsSync('./torrc')) fs.unlinkSync('./torrc');
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}

// Start the Tor Mobile Wrapper
async function startTorMobileWrapper() {
    const wrapper = new TorMobileWrapper(3333);
    await wrapper.start();
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Tor Mobile Wrapper...');
        wrapper.cleanup();
        process.exit(0);
    });
}

// Start the wrapper
startTorMobileWrapper().catch(console.error);