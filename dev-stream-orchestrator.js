#!/usr/bin/env node

/**
 * 🎬 DEV STREAM ORCHESTRATOR
 * Central hub connecting git monitoring, Twitch bot, RSS feeds, and overlays
 * Manages the entire development streaming ecosystem
 */

const { EventEmitter } = require('events');
const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs').promises;

// Import components
const GitCommitStream = require('./git-commit-stream');
const TwitchDevBot = require('./twitch-dev-bot');
const DevlogRSSGenerator = require('./devlog-rss-generator');
const StreamingMonetizationLayer = require('./streaming-monetization-layer');

class DevStreamOrchestrator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Server configuration
            port: options.port || 8890,
            wsPort: options.wsPort || 8891,
            
            // Project configuration
            projectName: options.projectName || 'My Project',
            repoPath: options.repoPath || process.cwd(),
            
            // Twitch configuration
            twitchEnabled: options.twitchEnabled !== false,
            twitchChannel: options.twitchChannel || process.env.TWITCH_CHANNEL,
            twitchBotUsername: options.twitchBotUsername || process.env.TWITCH_BOT_USERNAME,
            twitchOAuth: options.twitchOAuth || process.env.TWITCH_OAUTH,
            
            // RSS configuration
            rssEnabled: options.rssEnabled !== false,
            rssTitle: options.rssTitle || `${options.projectName || 'Project'} Development Log`,
            rssAuthor: options.rssAuthor || 'Developer',
            rssEmail: options.rssEmail || 'dev@example.com',
            rssSiteUrl: options.rssSiteUrl || 'https://example.com',
            
            // Integration options
            discordWebhook: options.discordWebhook || process.env.DISCORD_WEBHOOK,
            slackWebhook: options.slackWebhook || process.env.SLACK_WEBHOOK,
            
            ...options
        };
        
        // Core services
        this.services = {
            git: null,
            twitch: null,
            rss: null,
            monetization: null,
            server: null,
            wsServer: null
        };
        
        // State management
        this.state = {
            isRunning: false,
            startTime: null,
            sessionStats: {
                commits: 0,
                messages: 0,
                viewers: 0,
                donations: 0,
                feedsGenerated: 0
            },
            overlayClients: new Set(),
            recentEvents: []
        };
        
        // Event queue for processing
        this.eventQueue = [];
        this.processing = false;
        
        console.log('🎬 Dev Stream Orchestrator initialized');
    }
    
    async start() {
        if (this.state.isRunning) {
            console.log('Orchestrator already running');
            return;
        }
        
        console.log('🚀 Starting Dev Stream Orchestrator...');
        
        try {
            // Start web server
            await this.startWebServer();
            
            // Start WebSocket server
            await this.startWebSocketServer();
            
            // Initialize Git monitoring
            await this.initializeGitMonitoring();
            
            // Initialize Twitch bot
            if (this.config.twitchEnabled) {
                await this.initializeTwitchBot();
            }
            
            // Initialize RSS generator
            if (this.config.rssEnabled) {
                await this.initializeRSSGenerator();
            }
            
            // Initialize monetization layer (optional)
            // await this.initializeMonetization();
            
            // Start event processing
            this.startEventProcessing();
            
            this.state.isRunning = true;
            this.state.startTime = Date.now();
            
            console.log('\n✨ Dev Stream Orchestrator is running! ✨');
            console.log(`🌐 Dashboard: http://localhost:${this.config.port}`);
            console.log(`🔌 WebSocket: ws://localhost:${this.config.wsPort}`);
            console.log(`📡 RSS Feeds: http://localhost:${this.config.port}/feeds/`);
            
            this.emit('started');
            
        } catch (error) {
            console.error('Failed to start orchestrator:', error);
            throw error;
        }
    }
    
    async startWebServer() {
        const app = express();
        app.use(express.json());
        app.use(express.static(path.join(__dirname, 'public')));
        
        // Dashboard route
        app.get('/', async (req, res) => {
            res.send(await this.generateDashboardHTML());
        });
        
        // API routes
        app.get('/api/status', (req, res) => {
            res.json(this.getStatus());
        });
        
        app.get('/api/events', (req, res) => {
            res.json(this.state.recentEvents);
        });
        
        app.get('/api/stats', (req, res) => {
            res.json(this.getSessionStats());
        });
        
        app.post('/api/announce', async (req, res) => {
            const { message, platforms } = req.body;
            await this.announce(message, platforms);
            res.json({ success: true });
        });
        
        // RSS feed routes
        app.use('/feeds', express.static(path.join(__dirname, 'feeds')));
        
        // OBS overlay routes
        app.get('/overlay/:type', async (req, res) => {
            const overlayHTML = await this.generateOverlayHTML(req.params.type);
            res.send(overlayHTML);
        });
        
        this.services.server = app.listen(this.config.port);
        console.log(`🌐 Web server running on port ${this.config.port}`);
    }
    
    async startWebSocketServer() {
        this.services.wsServer = new WebSocket.Server({ port: this.config.wsPort });
        
        this.services.wsServer.on('connection', (ws) => {
            console.log('🔌 New WebSocket client connected');
            
            // Add to overlay clients
            this.state.overlayClients.add(ws);
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'init',
                data: {
                    projectName: this.config.projectName,
                    stats: this.state.sessionStats,
                    recentEvents: this.state.recentEvents.slice(-10)
                }
            }));
            
            ws.on('close', () => {
                this.state.overlayClients.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.state.overlayClients.delete(ws);
            });
        });
        
        console.log(`🔌 WebSocket server running on port ${this.config.wsPort}`);
    }
    
    async initializeGitMonitoring() {
        console.log('🔍 Initializing Git monitoring...');
        
        this.services.git = new GitCommitStream({
            repoPath: this.config.repoPath,
            showDiff: true,
            showStats: true,
            showFiles: true
        });
        
        // Git event handlers
        this.services.git.on('commit', async (commit) => {
            console.log(`🎯 New commit detected: ${commit.shortHash}`);
            
            // Add to event queue
            this.queueEvent({
                type: 'commit',
                data: commit,
                timestamp: Date.now()
            });
            
            // Update stats
            this.state.sessionStats.commits++;
        });
        
        this.services.git.on('branchChanged', (data) => {
            this.queueEvent({
                type: 'branch_change',
                data,
                timestamp: Date.now()
            });
        });
        
        await this.services.git.start();
        console.log('✅ Git monitoring started');
    }
    
    async initializeTwitchBot() {
        console.log('🤖 Initializing Twitch bot...');
        
        this.services.twitch = new TwitchDevBot({
            channel: this.config.twitchChannel,
            username: this.config.twitchBotUsername,
            oauth: this.config.twitchOAuth,
            repoPath: this.config.repoPath,
            projectName: this.config.projectName
        });
        
        // Twitch event handlers
        this.services.twitch.on('connected', () => {
            console.log('✅ Twitch bot connected');
            
            this.queueEvent({
                type: 'twitch_connected',
                data: { channel: this.config.twitchChannel },
                timestamp: Date.now()
            });
        });
        
        this.services.twitch.on('overlayUpdate', (update) => {
            this.broadcastToOverlays(update);
        });
        
        await this.services.twitch.connect();
    }
    
    async initializeRSSGenerator() {
        console.log('📡 Initializing RSS feed generator...');
        
        this.services.rss = new DevlogRSSGenerator({
            title: this.config.rssTitle,
            author: this.config.rssAuthor,
            email: this.config.rssEmail,
            siteUrl: this.config.rssSiteUrl,
            feedUrl: `${this.config.rssSiteUrl}/feeds/devlog.xml`,
            autoGenerate: true,
            outputDir: path.join(__dirname, 'feeds')
        });
        
        // RSS event handlers
        this.services.rss.on('feedsGenerated', (results) => {
            console.log('📡 RSS feeds generated:', Object.keys(results).join(', '));
            this.state.sessionStats.feedsGenerated++;
        });
        
        console.log('✅ RSS generator initialized');
    }
    
    /**
     * Event Queue Processing
     */
    queueEvent(event) {
        this.eventQueue.push(event);
        this.processEventQueue();
    }
    
    async processEventQueue() {
        if (this.processing || this.eventQueue.length === 0) {
            return;
        }
        
        this.processing = true;
        
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            
            try {
                await this.processEvent(event);
            } catch (error) {
                console.error('Error processing event:', error);
            }
        }
        
        this.processing = false;
    }
    
    async processEvent(event) {
        // Add to recent events
        this.state.recentEvents.push(event);
        if (this.state.recentEvents.length > 100) {
            this.state.recentEvents = this.state.recentEvents.slice(-100);
        }
        
        // Process based on event type
        switch (event.type) {
            case 'commit':
                await this.handleCommitEvent(event);
                break;
                
            case 'branch_change':
                await this.handleBranchChangeEvent(event);
                break;
                
            case 'twitch_connected':
                await this.handleTwitchConnectedEvent(event);
                break;
                
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        
        // Broadcast to overlays
        this.broadcastToOverlays({
            type: 'event',
            event
        });
        
        // Emit for external listeners
        this.emit('event', event);
    }
    
    async handleCommitEvent(event) {
        const commit = event.data;
        
        // Add to RSS feed
        if (this.services.rss) {
            await this.services.rss.addCommit(commit);
        }
        
        // Announce on Twitch
        if (this.services.twitch && this.services.twitch.isConnected) {
            // Already handled by git monitor in Twitch bot
        }
        
        // Post to Discord/Slack
        await this.postToWebhooks({
            embeds: [commit.formatted.discord]
        });
        
        // Update overlay
        this.broadcastToOverlays({
            type: 'commit',
            data: commit.formatted.overlay
        });
    }
    
    async handleBranchChangeEvent(event) {
        const { oldBranch, newBranch } = event.data;
        
        // Announce everywhere
        const message = `🌿 Switched from ${oldBranch} to ${newBranch}`;
        await this.announce(message);
    }
    
    async handleTwitchConnectedEvent(event) {
        // Maybe announce stream start
        await this.announce(`🎬 Stream started! Working on ${this.config.projectName}`);
    }
    
    /**
     * Cross-platform announcement
     */
    async announce(message, platforms = ['twitch', 'discord', 'slack']) {
        const promises = [];
        
        if (platforms.includes('twitch') && this.services.twitch?.isConnected) {
            promises.push(this.services.twitch.say(message));
        }
        
        if (platforms.includes('discord') && this.config.discordWebhook) {
            promises.push(this.postToDiscord(message));
        }
        
        if (platforms.includes('slack') && this.config.slackWebhook) {
            promises.push(this.postToSlack(message));
        }
        
        await Promise.allSettled(promises);
    }
    
    async postToWebhooks(data) {
        const promises = [];
        
        if (this.config.discordWebhook) {
            promises.push(this.postToDiscord(data));
        }
        
        if (this.config.slackWebhook) {
            promises.push(this.postToSlack(data));
        }
        
        await Promise.allSettled(promises);
    }
    
    async postToDiscord(data) {
        if (!this.config.discordWebhook) return;
        
        try {
            const axios = require('axios');
            
            let payload;
            if (typeof data === 'string') {
                payload = { content: data };
            } else {
                payload = data;
            }
            
            await axios.post(this.config.discordWebhook, payload);
        } catch (error) {
            console.error('Discord webhook error:', error.message);
        }
    }
    
    async postToSlack(data) {
        if (!this.config.slackWebhook) return;
        
        try {
            const axios = require('axios');
            
            let payload;
            if (typeof data === 'string') {
                payload = { text: data };
            } else if (data.embeds) {
                // Convert Discord embed to Slack attachment
                payload = {
                    attachments: data.embeds.map(embed => ({
                        color: embed.color ? `#${embed.color.toString(16)}` : '#36a64f',
                        title: embed.title,
                        text: embed.description,
                        fields: embed.fields?.map(f => ({
                            title: f.name,
                            value: f.value,
                            short: f.inline
                        }))
                    }))
                };
            } else {
                payload = data;
            }
            
            await axios.post(this.config.slackWebhook, payload);
        } catch (error) {
            console.error('Slack webhook error:', error.message);
        }
    }
    
    /**
     * Overlay broadcasting
     */
    broadcastToOverlays(data) {
        const message = JSON.stringify(data);
        
        for (const client of this.state.overlayClients) {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                } catch (error) {
                    console.error('WebSocket send error:', error);
                }
            }
        }
    }
    
    /**
     * Dashboard and overlay generation
     */
    async generateDashboardHTML() {
        const stats = this.getSessionStats();
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Dev Stream Dashboard - ${this.config.projectName}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #1a1a1a;
            color: #e0e0e0;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #00ff88;
            text-align: center;
            margin-bottom: 30px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #00ff88;
            margin: 10px 0;
        }
        .stat-label {
            color: #888;
            text-transform: uppercase;
            font-size: 0.8em;
        }
        .events-container {
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
        }
        .event {
            padding: 10px;
            border-left: 3px solid #00ff88;
            margin-bottom: 10px;
            background: #333;
        }
        .controls {
            margin-top: 30px;
            text-align: center;
        }
        button {
            background: #00ff88;
            color: #1a1a1a;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin: 0 10px;
        }
        button:hover {
            background: #00cc70;
        }
        .links {
            margin-top: 30px;
            text-align: center;
        }
        .links a {
            color: #00ff88;
            text-decoration: none;
            margin: 0 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 Dev Stream Dashboard</h1>
        <h2 style="text-align: center; color: #888;">${this.config.projectName}</h2>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Session Time</div>
                <div class="stat-value">${stats.sessionTime}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Commits</div>
                <div class="stat-value">${stats.commits}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Productivity</div>
                <div class="stat-value">${stats.productivity}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">RSS Feeds</div>
                <div class="stat-value">${stats.feedsGenerated}</div>
            </div>
        </div>
        
        <h3>Recent Events</h3>
        <div class="events-container" id="events">
            <div class="event">Waiting for events...</div>
        </div>
        
        <div class="controls">
            <button onclick="testCommit()">Test Commit</button>
            <button onclick="generateFeeds()">Generate RSS</button>
            <button onclick="announce()">Test Announce</button>
        </div>
        
        <div class="links">
            <a href="/feeds/devlog.xml" target="_blank">📡 RSS Feed</a>
            <a href="/feeds/devlog.atom" target="_blank">📡 Atom Feed</a>
            <a href="/feeds/devlog.json" target="_blank">📡 JSON Feed</a>
            <a href="/overlay/commit" target="_blank">🖥️ Commit Overlay</a>
            <a href="/overlay/stats" target="_blank">🖥️ Stats Overlay</a>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.config.wsPort}');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'event') {
                addEvent(data.event);
            }
        };
        
        function addEvent(event) {
            const container = document.getElementById('events');
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            eventDiv.innerHTML = \`
                <strong>\${event.type}</strong> - 
                \${new Date(event.timestamp).toLocaleTimeString()}<br>
                \${JSON.stringify(event.data).substring(0, 100)}...
            \`;
            
            container.insertBefore(eventDiv, container.firstChild);
            
            // Keep only last 20 events
            while (container.children.length > 20) {
                container.removeChild(container.lastChild);
            }
        }
        
        async function testCommit() {
            // Trigger test commit event
            alert('Check your git repository and make a commit!');
        }
        
        async function generateFeeds() {
            const response = await fetch('/api/generate-feeds', { method: 'POST' });
            alert('RSS feeds generated!');
        }
        
        async function announce() {
            const message = prompt('Enter announcement message:');
            if (message) {
                await fetch('/api/announce', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });
            }
        }
        
        // Auto-refresh stats
        setInterval(async () => {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            // Update stats display
        }, 5000);
    </script>
</body>
</html>
        `;
    }
    
    async generateOverlayHTML(type) {
        if (type === 'commit') {
            return this.generateCommitOverlay();
        } else if (type === 'stats') {
            return this.generateStatsOverlay();
        } else {
            return '<h1>Unknown overlay type</h1>';
        }
    }
    
    generateCommitOverlay() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Commit Overlay</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: transparent;
            font-family: 'Courier New', monospace;
            color: #00ff88;
        }
        .commit-container {
            background: rgba(26, 26, 26, 0.9);
            border: 2px solid #00ff88;
            border-radius: 10px;
            padding: 20px;
            max-width: 600px;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.5s ease;
        }
        .commit-container.show {
            opacity: 1;
            transform: translateY(0);
        }
        .commit-hash {
            color: #ffa500;
            font-size: 14px;
        }
        .commit-message {
            font-size: 18px;
            margin: 10px 0;
        }
        .commit-stats {
            font-size: 14px;
            color: #888;
        }
        .files {
            margin-top: 10px;
            font-size: 12px;
        }
        .file {
            padding: 2px 0;
        }
        .added { color: #4caf50; }
        .modified { color: #ff9800; }
        .deleted { color: #f44336; }
    </style>
</head>
<body>
    <div class="commit-container" id="commitContainer"></div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.config.wsPort}');
        let hideTimeout;
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'commit') {
                showCommit(data.data);
            }
        };
        
        function showCommit(commit) {
            const container = document.getElementById('commitContainer');
            
            container.innerHTML = \`
                <div class="commit-hash">\${commit.hash}</div>
                <div class="commit-message">\${commit.title}</div>
                \${commit.stats ? \`
                    <div class="commit-stats">
                        \${commit.stats.filesChanged} files | 
                        <span class="added">+\${commit.stats.insertions}</span> | 
                        <span class="deleted">-\${commit.stats.deletions}</span>
                    </div>
                \` : ''}
                \${commit.files && commit.files.length > 0 ? \`
                    <div class="files">
                        \${commit.files.slice(0, 5).map(file => \`
                            <div class="file \${file.status}">\${file.status}: \${file.path}</div>
                        \`).join('')}
                    </div>
                \` : ''}
            \`;
            
            container.classList.add('show');
            
            // Hide after 10 seconds
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                container.classList.remove('show');
            }, 10000);
        }
    </script>
</body>
</html>
        `;
    }
    
    generateStatsOverlay() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Stats Overlay</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: transparent;
            font-family: 'Arial', sans-serif;
            color: #fff;
        }
        .stats-container {
            background: rgba(26, 26, 26, 0.9);
            border: 2px solid #00ff88;
            border-radius: 10px;
            padding: 15px;
            display: inline-block;
        }
        .stat {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            min-width: 200px;
        }
        .stat-label {
            color: #888;
        }
        .stat-value {
            color: #00ff88;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="stats-container">
        <div class="stat">
            <span class="stat-label">Commits:</span>
            <span class="stat-value" id="commits">0</span>
        </div>
        <div class="stat">
            <span class="stat-label">Session:</span>
            <span class="stat-value" id="session">0:00</span>
        </div>
        <div class="stat">
            <span class="stat-label">Productivity:</span>
            <span class="stat-value" id="productivity">🌱</span>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.config.wsPort}');
        let startTime = Date.now();
        let stats = { commits: 0 };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'init') {
                stats = data.data.stats;
                updateDisplay();
            } else if (data.type === 'event' && data.event.type === 'commit') {
                stats.commits++;
                updateDisplay();
            }
        };
        
        function updateDisplay() {
            document.getElementById('commits').textContent = stats.commits;
            
            const sessionTime = Math.floor((Date.now() - startTime) / 1000 / 60);
            const hours = Math.floor(sessionTime / 60);
            const minutes = sessionTime % 60;
            document.getElementById('session').textContent = 
                hours > 0 ? \`\${hours}:\${minutes.toString().padStart(2, '0')}\` : \`\${minutes}:00\`;
            
            const cph = stats.commits / ((Date.now() - startTime) / 1000 / 60 / 60);
            let productivity = '🌱';
            if (cph > 5) productivity = '🔥🔥🔥';
            else if (cph > 3) productivity = '🚀';
            else if (cph > 1) productivity = '💪';
            
            document.getElementById('productivity').textContent = productivity;
        }
        
        // Update timer
        setInterval(updateDisplay, 1000);
    </script>
</body>
</html>
        `;
    }
    
    /**
     * Status and statistics
     */
    getStatus() {
        return {
            running: this.state.isRunning,
            uptime: this.state.startTime ? Date.now() - this.state.startTime : 0,
            services: {
                git: !!this.services.git,
                twitch: !!this.services.twitch && this.services.twitch.isConnected,
                rss: !!this.services.rss,
                server: !!this.services.server,
                websocket: !!this.services.wsServer
            },
            stats: this.state.sessionStats,
            overlayClients: this.state.overlayClients.size,
            eventQueueSize: this.eventQueue.length
        };
    }
    
    getSessionStats() {
        const sessionMs = this.state.startTime ? Date.now() - this.state.startTime : 0;
        const sessionMinutes = Math.floor(sessionMs / 1000 / 60);
        const hours = Math.floor(sessionMinutes / 60);
        const minutes = sessionMinutes % 60;
        
        const cph = this.state.sessionStats.commits / (sessionMs / 1000 / 60 / 60);
        let productivity = '🌱 Starting';
        if (cph > 5) productivity = '🔥🔥🔥 ON FIRE!';
        else if (cph > 3) productivity = '🚀 Crushing it!';
        else if (cph > 1) productivity = '💪 Productive';
        else if (cph > 0.5) productivity = '🌱 Steady';
        
        return {
            ...this.state.sessionStats,
            sessionTime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
            commitsPerHour: cph.toFixed(1),
            productivity
        };
    }
    
    /**
     * Shutdown
     */
    async shutdown() {
        console.log('\n🛑 Shutting down Dev Stream Orchestrator...');
        
        this.state.isRunning = false;
        
        // Stop services
        if (this.services.git) {
            await this.services.git.stop();
        }
        
        if (this.services.twitch) {
            await this.services.twitch.shutdown();
        }
        
        // Close servers
        if (this.services.server) {
            this.services.server.close();
        }
        
        if (this.services.wsServer) {
            this.services.wsServer.close();
        }
        
        // Final stats
        console.log('\n📊 Final Session Stats:');
        const stats = this.getSessionStats();
        console.log(`  Session Time: ${stats.sessionTime}`);
        console.log(`  Commits: ${stats.commits}`);
        console.log(`  Productivity: ${stats.productivity}`);
        console.log(`  RSS Feeds Generated: ${stats.feedsGenerated}`);
        
        this.emit('shutdown');
    }
}

module.exports = DevStreamOrchestrator;

// CLI usage
if (require.main === module) {
    const orchestrator = new DevStreamOrchestrator({
        projectName: process.argv[2] || 'My Awesome Project',
        repoPath: process.argv[3] || process.cwd(),
        
        // Twitch settings (set environment variables)
        twitchEnabled: !!process.env.TWITCH_CHANNEL,
        
        // RSS settings
        rssTitle: 'Dev Stream Log',
        rssAuthor: process.env.RSS_AUTHOR || 'Developer',
        rssEmail: process.env.RSS_EMAIL || 'dev@example.com',
        rssSiteUrl: process.env.RSS_SITE_URL || 'https://mydevblog.com',
        
        // Webhooks (optional)
        discordWebhook: process.env.DISCORD_WEBHOOK,
        slackWebhook: process.env.SLACK_WEBHOOK
    });
    
    // Start orchestrator
    orchestrator.start().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await orchestrator.shutdown();
        process.exit(0);
    });
}