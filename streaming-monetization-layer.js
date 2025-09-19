#!/usr/bin/env node

/**
 * 🎬💰 STREAMING MONETIZATION LAYER
 * OBS integration, viewer interaction, affiliate marketing
 * Real-time donations, chat commands, and revenue optimization
 * Designed for Twitch, YouTube, and developer streamers
 */

const WebSocket = require('ws');
const express = require('express');
const axios = require('axios');

class StreamingMonetizationLayer {
    constructor(mudEngine) {
        this.mudEngine = mudEngine;
        this.app = express();
        this.port = 8888; // Streaming overlay port
        
        // Streaming platforms integration
        this.platforms = {
            twitch: {
                clientId: process.env.TWITCH_CLIENT_ID,
                accessToken: process.env.TWITCH_ACCESS_TOKEN,
                channelName: process.env.TWITCH_CHANNEL,
                active: false
            },
            youtube: {
                apiKey: process.env.YOUTUBE_API_KEY,
                channelId: process.env.YOUTUBE_CHANNEL_ID,
                active: false
            },
            obs: {
                websocket: null,
                overlays: new Map(),
                connected: false
            }
        };
        
        // Revenue tracking
        this.streamRevenue = {
            donations: new Map(), // user -> amount
            subscriptions: 0,
            bits: 0,
            affiliateClicks: 0,
            adRevenue: 0,
            totalStreamTime: 0,
            peakViewers: 0,
            averageViewers: 0
        };
        
        // Viewer interaction system
        this.chatCommands = {
            '!roast': this.handleRoastCommand.bind(this),
            '!donate': this.handleDonateCommand.bind(this),
            '!spawn': this.handleSpawnCommand.bind(this),
            '!stats': this.handleStatsCommand.bind(this),
            '!buy': this.handleBuyCommand.bind(this),
            '!help': this.handleHelpCommand.bind(this),
            '!emacs': this.handleEmacsCommand.bind(this),
            '!revenue': this.handleRevenueCommand.bind(this)
        };
        
        // OBS Overlays for streaming
        this.overlayTemplates = {
            revenue_counter: this.generateRevenueOverlay(),
            viewer_chat: this.generateChatOverlay(),
            game_stats: this.generateStatsOverlay(),
            affiliate_showcase: this.generateAffiliateOverlay(),
            donation_alerts: this.generateDonationAlerts()
        };
        
        // Affiliate product catalog
        this.affiliateProducts = {
            keyboards: [
                { name: 'Das Keyboard Ultimate', price: 169, link: 'https://amzn.to/daskeyboard', commission: 15 },
                { name: 'Keychron K8', price: 89, link: 'https://amzn.to/keychron', commission: 12 }
            ],
            books: [
                { name: 'Clean Code', price: 32, link: 'https://amzn.to/cleancode', commission: 8 },
                { name: 'The Pragmatic Programmer', price: 45, link: 'https://amzn.to/pragmatic', commission: 10 }
            ],
            courses: [
                { name: 'Complete JavaScript Course', price: 199, link: 'https://bit.ly/js-course', commission: 40 },
                { name: 'Docker Mastery', price: 129, link: 'https://bit.ly/docker-course', commission: 25 }
            ],
            hardware: [
                { name: 'LG 4K Monitor', price: 299, link: 'https://amzn.to/lg4k', commission: 45 },
                { name: 'Logitech MX Master 3', price: 99, link: 'https://amzn.to/mx-master', commission: 15 }
            ]
        };
        
        this.setupServer();
        this.initializeStreamingIntegration();
        
        console.log('🎬 Streaming Monetization Layer initializing...');
        console.log('💰 Revenue optimization active');
        console.log('📺 OBS overlay generation ready');
    }
    
    setupServer() {
        this.app.use(express.json());
        this.app.use(express.static(__dirname));
        
        // Serve streaming overlays
        this.app.get('/overlay/:type', (req, res) => {
            const { type } = req.params;
            const overlay = this.overlayTemplates[type];
            
            if (!overlay) {
                return res.status(404).json({ error: 'Overlay not found' });
            }
            
            res.send(overlay);
        });
        
        // Webhook for donations
        this.app.post('/webhook/donation', (req, res) => {
            this.handleDonationWebhook(req.body);
            res.json({ success: true });
        });
        
        // Chat command endpoint
        this.app.post('/chat/command', (req, res) => {
            const { command, user, message, platform } = req.body;
            this.processChatCommand(command, user, message, platform);
            res.json({ success: true });
        });
        
        // Revenue analytics API
        this.app.get('/api/stream-revenue', (req, res) => {
            res.json({
                ...this.streamRevenue,
                mudRevenue: this.mudEngine.revenue,
                totalCombined: this.streamRevenue.donations + this.mudEngine.revenue.totalEarned,
                viewerCount: this.getCurrentViewerCount(),
                uptime: this.getStreamUptime()
            });
        });
        
        // Affiliate tracking with attribution
        this.app.post('/api/affiliate/stream-click', (req, res) => {
            const { product, viewer, platform, streamer } = req.body;
            
            this.trackAffiliateClick(product, viewer, platform, streamer);
            res.json({ 
                success: true, 
                message: 'Click tracked! Commission will be credited.',
                estimatedCommission: this.calculateCommission(product)
            });
        });
        
        // Live stats for OBS
        this.app.get('/api/live-stats', (req, res) => {
            res.json({
                totalRevenue: (this.streamRevenue.donations.size * 5 + this.mudEngine.revenue.totalEarned).toFixed(2),
                viewerCount: this.getCurrentViewerCount(),
                playersOnline: this.mudEngine.players.size,
                recentRoasts: this.mudEngine.streamingData.highlightClips.slice(-3),
                topAffiliate: this.getTopAffiliateProduct(),
                streamTime: this.formatStreamTime(this.streamRevenue.totalStreamTime)
            });
        });
        
        const server = this.app.listen(this.port, () => {
            console.log(`🎬 Streaming server running on port ${this.port}`);
        });
        
        // WebSocket for real-time updates
        this.streamWs = new WebSocket.Server({ server });
        this.setupStreamWebSocket();
    }
    
    setupStreamWebSocket() {
        this.streamWs.on('connection', (ws) => {
            console.log('📺 OBS overlay connected');
            
            // Send initial data
            ws.send(JSON.stringify({
                type: 'init',
                data: {
                    revenue: this.streamRevenue,
                    mudStats: this.mudEngine.revenue,
                    affiliates: this.affiliateProducts
                }
            }));
            
            // Handle overlay requests
            ws.on('message', (data) => {
                try {
                    const request = JSON.parse(data);
                    this.handleOverlayRequest(ws, request);
                } catch (error) {
                    console.error('Overlay request error:', error);
                }
            });
        });
        
        // Send updates every 5 seconds
        setInterval(() => {
            this.broadcastLiveUpdates();
        }, 5000);
    }
    
    initializeStreamingIntegration() {
        // Mock Twitch integration (would use real API in production)
        if (process.env.TWITCH_CLIENT_ID) {
            this.setupTwitchIntegration();
        }
        
        // YouTube integration
        if (process.env.YOUTUBE_API_KEY) {
            this.setupYouTubeIntegration();
        }
        
        // OBS WebSocket integration
        this.setupOBSIntegration();
    }
    
    setupTwitchIntegration() {
        console.log('🟣 Twitch integration enabled');
        
        // Mock viewer count updates
        setInterval(() => {
            const viewerCount = Math.floor(Math.random() * 50) + 10;
            this.updateViewerCount(viewerCount);
        }, 30000);
        
        this.platforms.twitch.active = true;
    }
    
    setupOBSIntegration() {
        // Mock OBS WebSocket connection
        console.log('🎥 OBS integration ready');
        console.log('📊 Available overlays:');
        console.log('  - Revenue Counter: http://localhost:8888/overlay/revenue_counter');
        console.log('  - Chat Integration: http://localhost:8888/overlay/viewer_chat');
        console.log('  - Game Stats: http://localhost:8888/overlay/game_stats');
        console.log('  - Affiliate Showcase: http://localhost:8888/overlay/affiliate_showcase');
    }
    
    // Chat command handlers
    async handleRoastCommand(user, message, platform) {
        // Find a player to roast or create fake interaction
        const players = Array.from(this.mudEngine.players.values());
        const targetPlayer = players[Math.floor(Math.random() * players.length)] || { name: user };
        
        const roastContext = {
            username: targetPlayer.name,
            subject: 'chat roast request',
            message: `${user} requested a roast from chat on ${platform}`
        };
        
        const response = await this.mudEngine.calAI.generateResponse(roastContext);
        
        if (response) {
            // Send to all connected overlays
            this.broadcastToOverlays({
                type: 'cal_roast',
                user,
                target: targetPlayer.name,
                roast: response.text,
                rarity: response.rarity,
                platform
            });
            
            // Track for revenue (roasts drive engagement = more donations)
            this.streamRevenue.affiliateClicks += 0.5; // Engagement metric
            
            return {
                success: true,
                message: response.text,
                rarity: response.rarity
            };
        }
        
        return { success: false, message: 'Cal is busy roasting someone else!' };
    }
    
    handleDonateCommand(user, message, platform) {
        // Parse donation amount
        const match = message.match(/\$?(\d+(?:\.\d{2})?)/);
        const amount = match ? parseFloat(match[1]) : 5.00;
        
        // Track donation
        const currentDonations = this.streamRevenue.donations.get(user) || 0;
        this.streamRevenue.donations.set(user, currentDonations + amount);
        
        // Trigger donation alert
        this.triggerDonationAlert(user, amount, platform);
        
        // Give player in-game benefits
        this.givePlayerBenefits(user, amount);
        
        console.log(`💰 Donation: $${amount} from ${user} on ${platform}`);
        
        return {
            success: true,
            message: `Thank you ${user} for the $${amount} donation! You've unlocked special perks!`,
            amount
        };
    }
    
    handleSpawnCommand(user, message, platform) {
        // Force spawn Cal AI for viewer entertainment
        const players = Array.from(this.mudEngine.players.values());
        if (players.length === 0) {
            return { success: false, message: 'No players online to spawn Cal for!' };
        }
        
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        const currentRoom = this.mudEngine.rooms.get(randomPlayer.currentRoom);
        
        // Force Cal spawn
        setTimeout(() => {
            this.mudEngine.handleCalSpawn(randomPlayer, currentRoom);
        }, 1000);
        
        this.broadcastToOverlays({
            type: 'forced_spawn',
            user,
            target: randomPlayer.name,
            platform
        });
        
        return {
            success: true,
            message: `${user} forced Cal to spawn for ${randomPlayer.name}!`
        };
    }
    
    handleBuyCommand(user, message, platform) {
        // Parse product request
        const productMatch = message.toLowerCase();
        let category = 'keyboards';
        
        if (productMatch.includes('book')) category = 'books';
        if (productMatch.includes('course')) category = 'courses';
        if (productMatch.includes('monitor') || productMatch.includes('mouse')) category = 'hardware';
        
        const products = this.affiliateProducts[category];
        const product = products[Math.floor(Math.random() * products.length)];
        
        // Track affiliate click
        this.trackAffiliateClick(product, user, platform, 'stream');
        
        this.broadcastToOverlays({
            type: 'affiliate_showcase',
            user,
            product,
            platform
        });
        
        return {
            success: true,
            message: `🛒 Showing ${product.name} - $${product.price} (Commission: $${product.commission})`,
            product
        };
    }
    
    handleRevenueCommand(user, message, platform) {
        const totalRevenue = (
            Array.from(this.streamRevenue.donations.values()).reduce((a, b) => a + b, 0) +
            this.mudEngine.revenue.totalEarned
        ).toFixed(2);
        
        return {
            success: true,
            message: `💰 Total Revenue: $${totalRevenue} | Viewers: ${this.getCurrentViewerCount()} | Players: ${this.mudEngine.players.size}`,
            data: {
                streamRevenue: Array.from(this.streamRevenue.donations.values()).reduce((a, b) => a + b, 0),
                mudRevenue: this.mudEngine.revenue.totalEarned,
                totalRevenue: parseFloat(totalRevenue)
            }
        };
    }
    
    handleStatsCommand(user, message, platform) {
        const uptime = this.formatStreamTime(this.streamRevenue.totalStreamTime);
        const totalDonations = Array.from(this.streamRevenue.donations.values()).reduce((a, b) => a + b, 0);
        
        return {
            success: true,
            message: `📊 Stream Stats | Uptime: ${uptime} | Peak Viewers: ${this.streamRevenue.peakViewers} | Donations: $${totalDonations.toFixed(2)} | Players: ${this.mudEngine.players.size}`,
            data: {
                uptime: this.streamRevenue.totalStreamTime,
                peakViewers: this.streamRevenue.peakViewers,
                donations: totalDonations,
                playersOnline: this.mudEngine.players.size
            }
        };
    }
    
    handleHelpCommand(user, message, platform) {
        return {
            success: true,
            message: `🎮 Chat Commands: !roast, !donate $X, !spawn, !buy, !stats, !revenue, !emacs | Visit http://localhost:3030 to play!`,
            data: {
                commands: Object.keys(this.chatCommands),
                gameUrl: 'http://localhost:3030'
            }
        };
    }
    
    handleEmacsCommand(user, message, platform) {
        const tips = [
            'Try the git wrap technique: use your LEFT hand for RIGHT-side keys!',
            'Ctrl-X Ctrl-S is muscle memory - practice it until it hurts!',
            'M-x git-wrap activates the wrong-arm challenge mode!',
            'Real developers reach across the keyboard without looking!'
        ];
        
        const tip = tips[Math.floor(Math.random() * tips.length)];
        
        return {
            success: true,
            message: `⌨️ Emacs Tip: ${tip}`,
            data: {
                tip,
                emacsMode: true
            }
        };
    }
    
    // Revenue tracking
    trackAffiliateClick(product, user, platform, source) {
        const click = {
            product: product.name,
            user,
            platform,
            source,
            timestamp: Date.now(),
            estimatedCommission: product.commission,
            clicked: true
        };
        
        // In production, this would ping affiliate networks
        console.log(`🔗 Affiliate click: ${product.name} by ${user} (${source})`);
        
        this.streamRevenue.affiliateClicks++;
        this.mudEngine.revenue.affiliateClicks++;
        
        // Estimate commission (real tracking happens on affiliate network)
        setTimeout(() => {
            this.streamRevenue.adRevenue += product.commission;
            this.mudEngine.revenue.totalEarned += product.commission;
            
            this.broadcastToOverlays({
                type: 'commission_earned',
                amount: product.commission,
                product: product.name,
                user
            });
        }, Math.random() * 10000 + 5000); // Simulate 5-15 second delay
    }
    
    triggerDonationAlert(user, amount, platform) {
        const alert = {
            type: 'donation',
            user,
            amount,
            platform,
            message: this.generateDonationMessage(user, amount),
            timestamp: Date.now()
        };
        
        this.broadcastToOverlays(alert);
        
        // Play sound/animation for X seconds based on amount
        const duration = Math.min(amount * 1000, 10000); // Max 10 seconds
        
        setTimeout(() => {
            this.broadcastToOverlays({
                type: 'alert_end',
                alertId: alert.timestamp
            });
        }, duration);
    }
    
    givePlayerBenefits(user, amount) {
        // Find player by username or create virtual player
        const players = Array.from(this.mudEngine.players.values());
        let player = players.find(p => p.name.toLowerCase().includes(user.toLowerCase()));
        
        if (!player) {
            // Create virtual player for donor benefits
            player = {
                name: user,
                stats: { donations: amount },
                benefits: ['donor_status']
            };
        }
        
        // Give benefits based on donation amount
        const benefits = [];
        if (amount >= 5) benefits.push('cal_immunity'); // Cal can't roast for 5 minutes
        if (amount >= 10) benefits.push('force_spawn'); // Can force Cal spawns
        if (amount >= 25) benefits.push('premium_roasts'); // Access to premium Cal responses
        if (amount >= 50) benefits.push('room_teleport'); // Can teleport in MUD
        
        this.broadcastToOverlays({
            type: 'donor_benefits',
            user,
            amount,
            benefits
        });
    }
    
    // Overlay generators
    generateRevenueOverlay() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Revenue Counter Overlay</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: transparent;
            color: #00ff41;
            font-family: 'Courier New', monospace;
            font-size: 18px;
        }
        .revenue-box {
            background: rgba(0, 20, 0, 0.9);
            border: 2px solid #00ff41;
            border-radius: 10px;
            padding: 15px;
            min-width: 300px;
        }
        .revenue-amount {
            font-size: 24px;
            font-weight: bold;
            color: #00ff00;
        }
        .revenue-breakdown {
            font-size: 14px;
            margin-top: 10px;
            opacity: 0.8;
        }
        .pulse {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="revenue-box">
        <div>💰 Total Revenue</div>
        <div class="revenue-amount pulse">$<span id="total">0.00</span></div>
        <div class="revenue-breakdown">
            🎬 Stream: $<span id="stream">0.00</span><br>
            🎮 MUD: $<span id="mud">0.00</span><br>
            👥 Viewers: <span id="viewers">0</span>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:8888');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'revenue_update') {
                document.getElementById('total').textContent = data.total.toFixed(2);
                document.getElementById('stream').textContent = data.stream.toFixed(2);
                document.getElementById('mud').textContent = data.mud.toFixed(2);
                document.getElementById('viewers').textContent = data.viewers;
            }
        };
    </script>
</body>
</html>`;
    }
    
    generateChatOverlay() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Chat Integration Overlay</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: transparent;
            color: #00ff41;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            height: 400px;
            overflow: hidden;
        }
        .chat-container {
            background: rgba(0, 20, 0, 0.9);
            border: 2px solid #00ff41;
            border-radius: 10px;
            padding: 15px;
            height: 100%;
            overflow-y: auto;
        }
        .chat-message {
            margin-bottom: 10px;
            padding: 5px;
            border-left: 3px solid #00ff41;
            padding-left: 10px;
        }
        .roast-message {
            border-left-color: #ff6600;
            background: rgba(255, 102, 0, 0.1);
        }
        .donation-message {
            border-left-color: #ffd700;
            background: rgba(255, 215, 0, 0.1);
        }
        .username {
            font-weight: bold;
            color: #00ff00;
        }
    </style>
</head>
<body>
    <div class="chat-container" id="chatContainer">
        <div class="chat-message">
            <span class="username">System:</span> Chat integration active!
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:8888');
        const container = document.getElementById('chatContainer');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'cal_roast' || data.type === 'donation' || data.type === 'chat_command') {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'chat-message ' + (data.type === 'cal_roast' ? 'roast-message' : 
                                                          data.type === 'donation' ? 'donation-message' : '');
                
                let content = '';
                if (data.type === 'cal_roast') {
                    content = \`<span class="username">\${data.user}:</span> !roast → <strong>Cal AI:</strong> \${data.roast.substring(0, 100)}...\`;
                } else if (data.type === 'donation') {
                    content = \`<span class="username">\${data.user}</span> donated $\${data.amount}! 💰\`;
                } else {
                    content = \`<span class="username">\${data.user}:</span> \${data.message}\`;
                }
                
                messageDiv.innerHTML = content;
                container.appendChild(messageDiv);
                
                // Keep only last 20 messages
                while (container.children.length > 20) {
                    container.removeChild(container.firstChild);
                }
                
                // Auto scroll
                container.scrollTop = container.scrollHeight;
            }
        };
    </script>
</body>
</html>`;
    }
    
    generateStatsOverlay() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Game Stats Overlay</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: transparent;
            color: #00ff41;
            font-family: 'Courier New', monospace;
            font-size: 16px;
        }
        .stats-container {
            background: rgba(0, 20, 0, 0.9);
            border: 2px solid #00ff41;
            border-radius: 10px;
            padding: 15px;
            min-width: 250px;
        }
        .stat-item {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }
        .stat-value {
            color: #00ff00;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="stats-container">
        <div class="stat-item">
            <span>🎮 Players Online:</span>
            <span class="stat-value" id="players">0</span>
        </div>
        <div class="stat-item">
            <span>👥 Viewers:</span>
            <span class="stat-value" id="viewers">0</span>
        </div>
        <div class="stat-item">
            <span>🤖 Cal Spawns:</span>
            <span class="stat-value" id="calSpawns">0</span>
        </div>
        <div class="stat-item">
            <span>💰 Revenue/hr:</span>
            <span class="stat-value">$<span id="revenueRate">0.00</span></span>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:8888');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'stats_update') {
                document.getElementById('players').textContent = data.players;
                document.getElementById('viewers').textContent = data.viewers;
                document.getElementById('calSpawns').textContent = data.calSpawns;
                document.getElementById('revenueRate').textContent = data.revenueRate;
            }
        };
    </script>
</body>
</html>`;
    }
    
    generateDonationAlerts() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Donation Alerts Overlay</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: transparent;
            font-family: 'Courier New', monospace;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .donation-alert {
            background: linear-gradient(45deg, #ffd700, #ffed4e);
            color: #000;
            padding: 30px 50px;
            border-radius: 15px;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            border: 4px solid #ff6600;
            display: none;
            animation: alertBounce 0.6s ease-out;
        }
        .donation-alert.active {
            display: block;
        }
        .donation-amount {
            font-size: 36px;
            color: #ff6600;
            margin: 10px 0;
        }
        @keyframes alertBounce {
            0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
            50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="donation-alert" id="donationAlert">
        <div id="donationUser">Username</div>
        <div class="donation-amount">$<span id="donationAmount">0.00</span></div>
        <div>Thank you for supporting the stream! 🎉</div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:8888');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'donation') {
                const alert = document.getElementById('donationAlert');
                document.getElementById('donationUser').textContent = data.user;
                document.getElementById('donationAmount').textContent = data.amount.toFixed(2);
                
                alert.classList.add('active');
                
                // Hide after duration based on amount (min 3s, max 10s)
                const duration = Math.min(Math.max(data.amount * 1000, 3000), 10000);
                setTimeout(() => {
                    alert.classList.remove('active');
                }, duration);
            }
        };
    </script>
</body>
</html>`;
    }
    
    generateAffiliateOverlay() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Affiliate Product Showcase</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: transparent;
            color: #00ff41;
            font-family: 'Courier New', monospace;
        }
        .product-showcase {
            background: rgba(0, 20, 0, 0.9);
            border: 2px solid #00ff41;
            border-radius: 10px;
            padding: 20px;
            max-width: 400px;
        }
        .product-name {
            font-size: 20px;
            font-weight: bold;
            color: #00ff00;
            margin-bottom: 10px;
        }
        .product-price {
            font-size: 18px;
            color: #ffd700;
        }
        .commission-info {
            font-size: 14px;
            opacity: 0.8;
            margin-top: 10px;
        }
        .buy-now {
            background: #ff6600;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            margin-top: 15px;
            font-size: 16px;
            cursor: pointer;
        }
        .fade-in {
            animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="product-showcase fade-in" id="showcase" style="display: none;">
        <div class="product-name" id="productName">Featured Product</div>
        <div class="product-price">$<span id="productPrice">0.00</span></div>
        <div class="commission-info">
            Commission: $<span id="commission">0.00</span> | 
            Clicks: <span id="clicks">0</span>
        </div>
        <button class="buy-now" id="buyButton">Buy Now & Support Stream!</button>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:8888');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'affiliate_showcase') {
                const showcase = document.getElementById('showcase');
                document.getElementById('productName').textContent = data.product.name;
                document.getElementById('productPrice').textContent = data.product.price;
                document.getElementById('commission').textContent = data.product.commission;
                
                showcase.style.display = 'block';
                showcase.className = 'product-showcase fade-in';
                
                // Hide after 10 seconds
                setTimeout(() => {
                    showcase.style.display = 'none';
                }, 10000);
            }
        };
    </script>
</body>
</html>`;
    }
    
    // Utility functions
    getCurrentViewerCount() {
        return Math.floor(Math.random() * 45) + 15; // Mock viewer count
    }
    
    getStreamUptime() {
        return this.streamRevenue.totalStreamTime;
    }
    
    calculateCommission(product) {
        return product.commission;
    }
    
    getTopAffiliateProduct() {
        // Return most clicked affiliate product
        return this.affiliateProducts.keyboards[0]; // Mock
    }
    
    formatStreamTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
    
    generateDonationMessage(user, amount) {
        const messages = [
            `${user} just became a legend with $${amount}!`,
            `Holy cow! ${user} dropped $${amount} on us!`,
            `${user} is keeping the MUD alive with $${amount}!`,
            `Big thanks to ${user} for the $${amount} donation!`
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    broadcastToOverlays(data) {
        this.streamWs.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
    
    broadcastLiveUpdates() {
        const totalDonations = Array.from(this.streamRevenue.donations.values()).reduce((a, b) => a + b, 0);
        const update = {
            type: 'revenue_update',
            total: totalDonations + this.mudEngine.revenue.totalEarned,
            stream: totalDonations,
            mud: this.mudEngine.revenue.totalEarned,
            viewers: this.getCurrentViewerCount()
        };
        
        this.broadcastToOverlays(update);
    }
    
    updateViewerCount(count) {
        if (count > this.streamRevenue.peakViewers) {
            this.streamRevenue.peakViewers = count;
        }
        
        // Update average (simple running average)
        this.streamRevenue.averageViewers = Math.floor(
            (this.streamRevenue.averageViewers + count) / 2
        );
    }
    
    processChatCommand(command, user, message, platform) {
        const handler = this.chatCommands[command];
        
        if (handler) {
            const result = handler(user, message, platform);
            
            this.broadcastToOverlays({
                type: 'chat_command',
                command,
                user,
                message,
                platform,
                result
            });
            
            return result;
        }
        
        return { success: false, message: `Unknown command: ${command}` };
    }
    
    handleOverlayRequest(ws, request) {
        switch (request.type) {
            case 'get_revenue':
                ws.send(JSON.stringify({
                    type: 'revenue_data',
                    data: this.streamRevenue
                }));
                break;
                
            case 'get_products':
                ws.send(JSON.stringify({
                    type: 'product_data',
                    data: this.affiliateProducts
                }));
                break;
                
            case 'force_update':
                this.broadcastLiveUpdates();
                break;
        }
    }
    
    start() {
        console.log(`
🎬💰 STREAMING MONETIZATION LAYER ACTIVE! 💰🎬
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📺 OBS Overlays: http://localhost:${this.port}/overlay/
💰 Revenue API: http://localhost:${this.port}/api/stream-revenue
🔴 Live Stats: http://localhost:${this.port}/api/live-stats

🎯 AVAILABLE OVERLAYS:
  • Revenue Counter: /overlay/revenue_counter
  • Chat Integration: /overlay/viewer_chat  
  • Affiliate Showcase: /overlay/affiliate_showcase
  • Donation Alerts: /overlay/donation_alerts

💬 CHAT COMMANDS:
  • !roast - Force Cal AI to roast someone
  • !donate $X - Simulate donation
  • !spawn - Force Cal spawn
  • !buy - Show affiliate product
  • !stats - Stream statistics
  • !revenue - Total revenue stats

🎬 Perfect for developer streamers!
💰 Every interaction generates revenue!
        `);
    }
}

module.exports = StreamingMonetizationLayer;

// Export for integration
if (require.main === module) {
    console.log('🎬 Run this with the MUD Engine for full integration!');
    console.log('Example: const mud = new RevenueMUDEngine(); new StreamingMonetizationLayer(mud);');
}