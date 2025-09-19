#!/usr/bin/env node

/**
 * SUMO GONG SPAM DETECTOR
 * 
 * A spam detection and tracking service that shows who's latched onto your email
 * or crypto wallets. Features deep gong sounds for important detections and
 * automated trash takeout for cleaning up spam.
 * 
 * "this is basically just a trash takeout for spamming and newsletter stuff"
 */

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class SumoGongSpamDetector extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: 8700,
            wsPort: 8701,
            updateInterval: 30000, // 30 seconds
            maxTrackedEmails: 1000,
            maxTrackedWallets: 100,
            gongThreshold: {
                email: 5,    // 5+ trackers = gong
                wallet: 3,   // 3+ trackers = gong
                spam: 10     // 10+ spam sources = gong
            },
            ...config
        };
        
        // Tracking databases
        this.emailTrackers = new Map();
        this.walletTrackers = new Map();
        this.spamSources = new Map();
        this.newsletterSubscriptions = new Map();
        
        // Detection patterns
        this.spamPatterns = {
            trackingPixels: [
                /track\.customer\.io/,
                /email\.cloudflare\.com/,
                /click\.mailchimp\.com/,
                /trk\.klclick\.com/,
                /open\.spotify\.com\/track/,
                /pixel\.app\.returnpath\.net/
            ],
            spamDomains: [
                'marketing', 'newsletter', 'promo', 'deals',
                'offers', 'campaign', 'bulk', 'noreply'
            ],
            cryptoTrackers: [
                'chainalysis.com',
                'elliptic.co',
                'ciphertrace.com',
                'blockchain.info',
                'etherscan.io'
            ]
        };
        
        // Gong sounds configuration
        this.gongTypes = {
            sumoGong: {
                name: 'Sumo Detection Gong',
                sound: 'sumo-gong-deep.mp3',
                duration: 3000,
                threshold: 'critical'
            },
            mailGong: {
                name: "You've Got Mail",
                sound: 'youve-got-mail.mp3',
                duration: 1000,
                threshold: 'normal'
            },
            spamAlert: {
                name: 'Spam Alert',
                sound: 'spam-alert.mp3',
                duration: 1500,
                threshold: 'warning'
            },
            privacyBreach: {
                name: 'Privacy Breach',
                sound: 'privacy-breach-critical.mp3',
                duration: 2000,
                threshold: 'critical'
            }
        };
        
        // Trash takeout status
        this.trashTakeout = {
            inProgress: false,
            totalCleaned: 0,
            lastCleanup: null,
            scheduledCleanups: []
        };
        
        this.app = express();
        this.setupServer();
        
        console.log('🥋 SUMO GONG SPAM DETECTOR INITIALIZED');
        console.log('🔔 Ready to detect email and wallet trackers');
        console.log('🗑️ Trash takeout service standing by');
    }
    
    setupServer() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Main dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        // API endpoints
        this.app.post('/api/check-email', this.checkEmail.bind(this));
        this.app.post('/api/check-wallet', this.checkWallet.bind(this));
        this.app.get('/api/trackers/:type/:identifier', this.getTrackers.bind(this));
        this.app.post('/api/trash-takeout', this.performTrashTakeout.bind(this));
        this.app.get('/api/statistics', this.getStatistics.bind(this));
        this.app.post('/api/unsubscribe', this.unsubscribeFrom.bind(this));
        
        // WebSocket for real-time updates
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        this.wss.on('connection', this.handleWebSocketConnection.bind(this));
        
        this.app.listen(this.config.port, () => {
            console.log(`🥋 Sumo Gong Spam Detector running on http://localhost:${this.config.port}`);
            console.log(`🔔 WebSocket on ws://localhost:${this.config.wsPort}`);
        });
        
        // Start detection loops
        this.startDetectionLoops();
    }
    
    /**
     * Check email for trackers and spam sources
     */
    async checkEmail(req, res) {
        const { email, headers } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }
        
        console.log(`📧 Checking email: ${this.obfuscateEmail(email)}`);
        
        const analysis = {
            email: this.obfuscateEmail(email),
            timestamp: Date.now(),
            trackers: [],
            spamSources: [],
            newsletters: [],
            privacyScore: 100,
            recommendations: []
        };
        
        // Analyze email headers if provided
        if (headers) {
            const headerAnalysis = this.analyzeEmailHeaders(headers);
            analysis.trackers.push(...headerAnalysis.trackers);
            analysis.spamSources.push(...headerAnalysis.spamSources);
        }
        
        // Check against known spam patterns
        const spamCheck = await this.checkSpamPatterns(email);
        analysis.spamSources.push(...spamCheck.sources);
        analysis.newsletters.push(...spamCheck.newsletters);
        
        // Calculate privacy score
        analysis.privacyScore = this.calculatePrivacyScore(analysis);
        
        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(analysis);
        
        // Store tracking data
        this.emailTrackers.set(email, analysis);
        
        // Check if we need to sound the gong
        if (analysis.trackers.length >= this.config.gongThreshold.email) {
            this.soundGong('sumoGong', `${analysis.trackers.length} trackers detected!`);
        }
        
        res.json(analysis);
    }
    
    /**
     * Check crypto wallet for trackers
     */
    async checkWallet(req, res) {
        const { address, blockchain } = req.body;
        
        if (!address) {
            return res.status(400).json({ error: 'Wallet address required' });
        }
        
        console.log(`💰 Checking wallet: ${this.obfuscateWallet(address)}`);
        
        const analysis = {
            wallet: this.obfuscateWallet(address),
            blockchain: blockchain || 'unknown',
            timestamp: Date.now(),
            trackers: [],
            exposureLevel: 'low',
            transactions: {
                tracked: 0,
                total: 0
            },
            recommendations: []
        };
        
        // Check against known crypto tracking services
        const trackers = await this.checkCryptoTrackers(address, blockchain);
        analysis.trackers = trackers;
        
        // Determine exposure level
        if (trackers.length >= 5) {
            analysis.exposureLevel = 'critical';
        } else if (trackers.length >= 3) {
            analysis.exposureLevel = 'high';
        } else if (trackers.length >= 1) {
            analysis.exposureLevel = 'medium';
        }
        
        // Generate recommendations
        analysis.recommendations = this.generateWalletRecommendations(analysis);
        
        // Store tracking data
        this.walletTrackers.set(address, analysis);
        
        // Check if we need to sound the gong
        if (analysis.trackers.length >= this.config.gongThreshold.wallet) {
            this.soundGong('privacyBreach', `Wallet tracked by ${analysis.trackers.length} services!`);
        }
        
        res.json(analysis);
    }
    
    /**
     * Analyze email headers for tracking
     */
    analyzeEmailHeaders(headers) {
        const result = {
            trackers: [],
            spamSources: []
        };
        
        // Check for tracking pixels
        if (headers['List-Unsubscribe']) {
            result.trackers.push({
                type: 'list-tracking',
                source: 'email-headers',
                detail: 'List-Unsubscribe header present'
            });
        }
        
        // Check return path for marketing domains
        if (headers['Return-Path']) {
            this.spamPatterns.spamDomains.forEach(domain => {
                if (headers['Return-Path'].includes(domain)) {
                    result.spamSources.push({
                        type: 'marketing-domain',
                        source: headers['Return-Path'],
                        confidence: 0.8
                    });
                }
            });
        }
        
        // Check for common tracking headers
        const trackingHeaders = [
            'X-Mailchimp-Campaign',
            'X-Sendgrid-Id',
            'X-Constant-Contact',
            'X-Campaign-Id'
        ];
        
        trackingHeaders.forEach(header => {
            if (headers[header]) {
                result.trackers.push({
                    type: 'email-tracker',
                    source: header,
                    value: headers[header]
                });
            }
        });
        
        return result;
    }
    
    /**
     * Check against spam patterns
     */
    async checkSpamPatterns(email) {
        const result = {
            sources: [],
            newsletters: []
        };
        
        // Simulate checking against spam databases
        // In production, this would query actual spam databases
        const spamDomains = [
            'spammer.com',
            'bulkmail.net',
            'marketing-blast.com'
        ];
        
        const domain = email.split('@')[1];
        if (spamDomains.some(spam => domain.includes(spam))) {
            result.sources.push({
                type: 'known-spammer',
                domain: domain,
                confidence: 0.95
            });
        }
        
        // Check for newsletter patterns
        if (email.includes('newsletter') || email.includes('updates')) {
            result.newsletters.push({
                type: 'newsletter-pattern',
                pattern: 'email-address',
                subscribed: true
            });
        }
        
        return result;
    }
    
    /**
     * Check crypto tracking services
     */
    async checkCryptoTrackers(address, blockchain) {
        const trackers = [];
        
        // Check each known tracker
        this.spamPatterns.cryptoTrackers.forEach(tracker => {
            // Simulate checking if address is in tracker database
            // In production, this would use actual APIs
            const isTracked = Math.random() > 0.6; // 40% chance for demo
            
            if (isTracked) {
                trackers.push({
                    service: tracker,
                    type: 'blockchain-analysis',
                    tracking: true,
                    lastSeen: Date.now() - Math.random() * 86400000 // Random time within last day
                });
            }
        });
        
        return trackers;
    }
    
    /**
     * Calculate privacy score
     */
    calculatePrivacyScore(analysis) {
        let score = 100;
        
        // Deduct points for trackers
        score -= analysis.trackers.length * 5;
        
        // Deduct points for spam sources
        score -= analysis.spamSources.length * 3;
        
        // Deduct points for newsletters
        score -= analysis.newsletters.length * 2;
        
        return Math.max(0, score);
    }
    
    /**
     * Generate recommendations
     */
    generateRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.trackers.length > 0) {
            recommendations.push({
                type: 'privacy',
                action: 'Use privacy-focused email service',
                urgency: 'high'
            });
        }
        
        if (analysis.spamSources.length > 3) {
            recommendations.push({
                type: 'cleanup',
                action: 'Run trash takeout to clean spam',
                urgency: 'medium'
            });
        }
        
        if (analysis.newsletters.length > 5) {
            recommendations.push({
                type: 'unsubscribe',
                action: 'Bulk unsubscribe from newsletters',
                urgency: 'low'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Generate wallet recommendations
     */
    generateWalletRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.exposureLevel === 'critical') {
            recommendations.push({
                type: 'privacy',
                action: 'Consider using a mixer or privacy coin',
                urgency: 'critical'
            });
        }
        
        if (analysis.trackers.length > 0) {
            recommendations.push({
                type: 'security',
                action: 'Create new wallet for sensitive transactions',
                urgency: 'high'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Perform trash takeout (cleanup)
     */
    async performTrashTakeout(req, res) {
        const { targetType, identifiers } = req.body;
        
        if (this.trashTakeout.inProgress) {
            return res.status(409).json({ error: 'Cleanup already in progress' });
        }
        
        console.log('🗑️ Starting trash takeout...');
        this.trashTakeout.inProgress = true;
        
        const results = {
            started: Date.now(),
            cleaned: 0,
            unsubscribed: 0,
            blocked: 0,
            errors: []
        };
        
        try {
            if (targetType === 'email') {
                // Clean email spam
                for (const email of identifiers) {
                    const cleaned = await this.cleanEmailSpam(email);
                    results.cleaned += cleaned.removed;
                    results.unsubscribed += cleaned.unsubscribed;
                }
            } else if (targetType === 'wallet') {
                // Clean wallet associations
                for (const wallet of identifiers) {
                    const cleaned = await this.cleanWalletTracking(wallet);
                    results.blocked += cleaned.blocked;
                }
            }
            
            // Sound success gong
            this.soundGong('mailGong', 'Trash takeout complete!');
            
        } catch (error) {
            results.errors.push(error.message);
            this.soundGong('spamAlert', 'Cleanup encountered errors');
        }
        
        this.trashTakeout.inProgress = false;
        this.trashTakeout.lastCleanup = Date.now();
        this.trashTakeout.totalCleaned += results.cleaned;
        
        res.json(results);
    }
    
    /**
     * Clean email spam
     */
    async cleanEmailSpam(email) {
        // Simulate spam cleanup
        const result = {
            removed: Math.floor(Math.random() * 50) + 10,
            unsubscribed: Math.floor(Math.random() * 10) + 1
        };
        
        console.log(`🧹 Cleaned ${result.removed} spam emails for ${this.obfuscateEmail(email)}`);
        
        return result;
    }
    
    /**
     * Clean wallet tracking
     */
    async cleanWalletTracking(wallet) {
        // Simulate blocking trackers
        const result = {
            blocked: Math.floor(Math.random() * 5) + 1
        };
        
        console.log(`🛡️ Blocked ${result.blocked} trackers for ${this.obfuscateWallet(wallet)}`);
        
        return result;
    }
    
    /**
     * Get trackers for identifier
     */
    getTrackers(req, res) {
        const { type, identifier } = req.params;
        
        let data;
        if (type === 'email') {
            data = this.emailTrackers.get(identifier);
        } else if (type === 'wallet') {
            data = this.walletTrackers.get(identifier);
        }
        
        if (!data) {
            return res.status(404).json({ error: 'No tracking data found' });
        }
        
        res.json(data);
    }
    
    /**
     * Unsubscribe from sources
     */
    async unsubscribeFrom(req, res) {
        const { sources } = req.body;
        
        const results = {
            attempted: sources.length,
            successful: 0,
            failed: []
        };
        
        for (const source of sources) {
            try {
                // Simulate unsubscribe
                const success = Math.random() > 0.2; // 80% success rate
                if (success) {
                    results.successful++;
                    console.log(`✅ Unsubscribed from ${source}`);
                } else {
                    results.failed.push(source);
                }
            } catch (error) {
                results.failed.push(source);
            }
        }
        
        res.json(results);
    }
    
    /**
     * Get statistics
     */
    getStatistics(req, res) {
        const stats = {
            emailsTracked: this.emailTrackers.size,
            walletsTracked: this.walletTrackers.size,
            totalTrackers: Array.from(this.emailTrackers.values())
                .reduce((sum, data) => sum + data.trackers.length, 0),
            totalSpamSources: Array.from(this.emailTrackers.values())
                .reduce((sum, data) => sum + data.spamSources.length, 0),
            trashTakeout: this.trashTakeout,
            lastUpdate: Date.now()
        };
        
        res.json(stats);
    }
    
    /**
     * Sound the gong
     */
    soundGong(type, message) {
        const gong = this.gongTypes[type];
        
        console.log(`🔔 ${gong.name}: ${message}`);
        
        // Emit gong event
        this.emit('gong', {
            type,
            message,
            sound: gong.sound,
            duration: gong.duration,
            timestamp: Date.now()
        });
        
        // Send to all connected WebSocket clients
        this.broadcast({
            type: 'gong',
            gongType: type,
            message,
            sound: gong.sound
        });
    }
    
    /**
     * Handle WebSocket connections
     */
    handleWebSocketConnection(ws) {
        console.log('🔌 New WebSocket connection');
        
        // Send initial data
        ws.send(JSON.stringify({
            type: 'connected',
            statistics: {
                emailsTracked: this.emailTrackers.size,
                walletsTracked: this.walletTrackers.size
            }
        }));
        
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                this.handleWebSocketMessage(ws, data);
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        });
        
        ws.on('close', () => {
            console.log('🔌 WebSocket disconnected');
        });
    }
    
    /**
     * Handle WebSocket messages
     */
    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'check-email':
                this.checkEmail({ body: data }, {
                    json: (result) => ws.send(JSON.stringify({ type: 'email-result', result }))
                });
                break;
                
            case 'check-wallet':
                this.checkWallet({ body: data }, {
                    json: (result) => ws.send(JSON.stringify({ type: 'wallet-result', result }))
                });
                break;
                
            case 'get-stats':
                this.getStatistics({}, {
                    json: (stats) => ws.send(JSON.stringify({ type: 'statistics', stats }))
                });
                break;
        }
    }
    
    /**
     * Broadcast to all WebSocket clients
     */
    broadcast(data) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
    
    /**
     * Start detection loops
     */
    startDetectionLoops() {
        // Periodic tracker updates
        setInterval(() => {
            this.updateTrackerDatabase();
        }, this.config.updateInterval);
        
        // Periodic statistics broadcast
        setInterval(() => {
            this.broadcast({
                type: 'statistics-update',
                stats: {
                    emailsTracked: this.emailTrackers.size,
                    walletsTracked: this.walletTrackers.size,
                    totalCleaned: this.trashTakeout.totalCleaned
                }
            });
        }, 5000);
    }
    
    /**
     * Update tracker database
     */
    updateTrackerDatabase() {
        // Simulate receiving new tracker information
        const newTrackers = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0;
        
        if (newTrackers > 0) {
            console.log(`🔍 Discovered ${newTrackers} new trackers`);
            this.soundGong('spamAlert', `${newTrackers} new trackers discovered`);
        }
    }
    
    /**
     * Obfuscate email for privacy
     */
    obfuscateEmail(email) {
        const parts = email.split('@');
        if (parts.length !== 2) return '***@***';
        
        const name = parts[0];
        const domain = parts[1];
        
        const obfuscatedName = name.substring(0, 2) + '***';
        return `${obfuscatedName}@${domain}`;
    }
    
    /**
     * Obfuscate wallet for privacy
     */
    obfuscateWallet(wallet) {
        if (wallet.length < 10) return '***';
        return wallet.substring(0, 6) + '...' + wallet.substring(wallet.length - 4);
    }
    
    /**
     * Generate dashboard HTML
     */
    generateDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🥋 Sumo Gong Spam Detector</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            text-align: center;
            padding: 40px 0;
            border-bottom: 2px solid #0f3460;
        }
        
        h1 {
            font-size: 3rem;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #e94560, #f47068);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
            font-size: 1.2rem;
            color: #94a3b8;
        }
        
        .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 40px;
        }
        
        .card {
            background: rgba(15, 52, 96, 0.3);
            border: 1px solid #0f3460;
            border-radius: 15px;
            padding: 30px;
            backdrop-filter: blur(10px);
        }
        
        .card h2 {
            font-size: 1.8rem;
            margin-bottom: 20px;
            color: #f47068;
        }
        
        .input-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #94a3b8;
        }
        
        input {
            width: 100%;
            padding: 12px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #0f3460;
            border-radius: 8px;
            color: #fff;
            font-size: 16px;
        }
        
        button {
            background: linear-gradient(45deg, #e94560, #f47068);
            color: #fff;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(233, 69, 96, 0.4);
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 30px;
        }
        
        .stat-box {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #f47068;
        }
        
        .stat-label {
            color: #94a3b8;
            margin-top: 5px;
        }
        
        .results {
            margin-top: 30px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .tracker-item {
            padding: 10px;
            margin: 5px 0;
            background: rgba(233, 69, 96, 0.1);
            border-left: 3px solid #e94560;
            border-radius: 5px;
        }
        
        .privacy-score {
            font-size: 3rem;
            text-align: center;
            margin: 20px 0;
        }
        
        .score-high { color: #10b981; }
        .score-medium { color: #f59e0b; }
        .score-low { color: #ef4444; }
        
        .trash-takeout {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #e94560;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 5px 20px rgba(233, 69, 96, 0.5);
        }
        
        .trash-takeout:hover {
            transform: scale(1.1);
        }
        
        .gong-notification {
            position: fixed;
            top: 30px;
            right: 30px;
            background: rgba(15, 52, 96, 0.9);
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #f47068;
            animation: gongPulse 0.5s ease-out;
            display: none;
        }
        
        @keyframes gongPulse {
            0% {
                transform: scale(0.8);
                opacity: 0;
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #f47068;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🥋 Sumo Gong Spam Detector</h1>
            <p class="subtitle">See who's latched onto your email and crypto wallets</p>
        </header>
        
        <div class="main-grid">
            <!-- Email Checker -->
            <div class="card">
                <h2>📧 Email Tracker Detection</h2>
                <div class="input-group">
                    <label>Enter Email Address</label>
                    <input type="email" id="emailInput" placeholder="your@email.com">
                </div>
                <button onclick="checkEmail()">Check Email Trackers</button>
                
                <div id="emailResults" class="results" style="display: none;">
                    <h3>Detection Results</h3>
                    <div class="privacy-score">
                        Privacy Score: <span id="emailScore">--</span>
                    </div>
                    <div id="emailTrackers"></div>
                </div>
            </div>
            
            <!-- Wallet Checker -->
            <div class="card">
                <h2>💰 Crypto Wallet Tracking</h2>
                <div class="input-group">
                    <label>Enter Wallet Address</label>
                    <input type="text" id="walletInput" placeholder="0x...">
                </div>
                <div class="input-group">
                    <label>Blockchain</label>
                    <select id="blockchainSelect" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.3); border: 1px solid #0f3460; border-radius: 8px; color: #fff;">
                        <option value="ethereum">Ethereum</option>
                        <option value="bitcoin">Bitcoin</option>
                        <option value="polygon">Polygon</option>
                        <option value="bsc">BSC</option>
                    </select>
                </div>
                <button onclick="checkWallet()">Check Wallet Trackers</button>
                
                <div id="walletResults" class="results" style="display: none;">
                    <h3>Tracking Analysis</h3>
                    <div class="privacy-score">
                        Exposure Level: <span id="walletExposure">--</span>
                    </div>
                    <div id="walletTrackers"></div>
                </div>
            </div>
        </div>
        
        <!-- Statistics -->
        <div class="card" style="margin-top: 30px;">
            <h2>📊 Global Statistics</h2>
            <div class="stats">
                <div class="stat-box">
                    <div class="stat-value" id="totalEmails">0</div>
                    <div class="stat-label">Emails Tracked</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value" id="totalWallets">0</div>
                    <div class="stat-label">Wallets Tracked</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value" id="totalTrackers">0</div>
                    <div class="stat-label">Trackers Found</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value" id="totalCleaned">0</div>
                    <div class="stat-label">Spam Cleaned</div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Trash Takeout Button -->
    <div class="trash-takeout" onclick="performTrashTakeout()" title="Clean up spam">
        🗑️
    </div>
    
    <!-- Gong Notification -->
    <div id="gongNotification" class="gong-notification">
        <h3>🔔 <span id="gongTitle">Alert</span></h3>
        <p id="gongMessage">Message</p>
    </div>
    
    <script>
        let ws = null;
        
        // Connect WebSocket
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:8701');
            
            ws.onopen = () => {
                console.log('Connected to Sumo Gong detector');
                updateStatistics();
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onclose = () => {
                console.log('Disconnected, reconnecting...');
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        // Handle WebSocket messages
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'gong':
                    showGongNotification(data);
                    playGongSound(data.sound);
                    break;
                    
                case 'statistics-update':
                    updateStatisticsDisplay(data.stats);
                    break;
                    
                case 'email-result':
                    displayEmailResults(data.result);
                    break;
                    
                case 'wallet-result':
                    displayWalletResults(data.result);
                    break;
            }
        }
        
        // Check email
        async function checkEmail() {
            const email = document.getElementById('emailInput').value;
            if (!email) return;
            
            document.getElementById('emailResults').style.display = 'block';
            document.getElementById('emailTrackers').innerHTML = '<div class="loading"></div> Analyzing...';
            
            try {
                const response = await fetch('/api/check-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                
                const result = await response.json();
                displayEmailResults(result);
            } catch (error) {
                console.error('Error checking email:', error);
            }
        }
        
        // Check wallet
        async function checkWallet() {
            const address = document.getElementById('walletInput').value;
            const blockchain = document.getElementById('blockchainSelect').value;
            
            if (!address) return;
            
            document.getElementById('walletResults').style.display = 'block';
            document.getElementById('walletTrackers').innerHTML = '<div class="loading"></div> Analyzing...';
            
            try {
                const response = await fetch('/api/check-wallet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address, blockchain })
                });
                
                const result = await response.json();
                displayWalletResults(result);
            } catch (error) {
                console.error('Error checking wallet:', error);
            }
        }
        
        // Display email results
        function displayEmailResults(result) {
            const scoreElement = document.getElementById('emailScore');
            scoreElement.textContent = result.privacyScore;
            
            // Color code the score
            scoreElement.className = '';
            if (result.privacyScore >= 80) {
                scoreElement.classList.add('score-high');
            } else if (result.privacyScore >= 50) {
                scoreElement.classList.add('score-medium');
            } else {
                scoreElement.classList.add('score-low');
            }
            
            // Display trackers
            const trackersHtml = result.trackers.map(tracker => 
                '<div class="tracker-item">🔍 ' + tracker.type + ': ' + tracker.detail + '</div>'
            ).join('');
            
            const spamHtml = result.spamSources.map(spam => 
                '<div class="tracker-item">📧 Spam: ' + spam.source + ' (confidence: ' + (spam.confidence * 100).toFixed(0) + '%)</div>'
            ).join('');
            
            document.getElementById('emailTrackers').innerHTML = trackersHtml + spamHtml || '<p>No trackers detected!</p>';
        }
        
        // Display wallet results
        function displayWalletResults(result) {
            const exposureElement = document.getElementById('walletExposure');
            exposureElement.textContent = result.exposureLevel.toUpperCase();
            
            // Color code exposure
            exposureElement.className = '';
            if (result.exposureLevel === 'low') {
                exposureElement.classList.add('score-high');
            } else if (result.exposureLevel === 'medium') {
                exposureElement.classList.add('score-medium');
            } else {
                exposureElement.classList.add('score-low');
            }
            
            // Display trackers
            const trackersHtml = result.trackers.map(tracker => 
                '<div class="tracker-item">🔍 ' + tracker.service + ' - ' + tracker.type + '</div>'
            ).join('');
            
            document.getElementById('walletTrackers').innerHTML = trackersHtml || '<p>No trackers detected!</p>';
        }
        
        // Perform trash takeout
        async function performTrashTakeout() {
            if (confirm('Start trash takeout to clean all detected spam?')) {
                try {
                    const response = await fetch('/api/trash-takeout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            targetType: 'email',
                            identifiers: [document.getElementById('emailInput').value].filter(Boolean)
                        })
                    });
                    
                    const result = await response.json();
                    showGongNotification({
                        gongType: 'mailGong',
                        message: 'Cleaned ' + result.cleaned + ' spam items!'
                    });
                } catch (error) {
                    console.error('Error performing trash takeout:', error);
                }
            }
        }
        
        // Show gong notification
        function showGongNotification(data) {
            const notification = document.getElementById('gongNotification');
            document.getElementById('gongTitle').textContent = data.gongType.replace(/([A-Z])/g, ' $1').trim();
            document.getElementById('gongMessage').textContent = data.message;
            
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 5000);
        }
        
        // Play gong sound
        function playGongSound(soundFile) {
            // Create audio element and play sound
            const audio = new Audio('/sounds/' + soundFile);
            audio.play().catch(e => console.log('Could not play sound:', e));
        }
        
        // Update statistics
        async function updateStatistics() {
            try {
                const response = await fetch('/api/statistics');
                const stats = await response.json();
                updateStatisticsDisplay(stats);
            } catch (error) {
                console.error('Error fetching statistics:', error);
            }
        }
        
        // Update statistics display
        function updateStatisticsDisplay(stats) {
            document.getElementById('totalEmails').textContent = stats.emailsTracked || 0;
            document.getElementById('totalWallets').textContent = stats.walletsTracked || 0;
            document.getElementById('totalTrackers').textContent = stats.totalTrackers || 0;
            document.getElementById('totalCleaned').textContent = stats.trashTakeout?.totalCleaned || 0;
        }
        
        // Initialize
        connectWebSocket();
        setInterval(updateStatistics, 10000);
    </script>
</body>
</html>`;
    }
}

// Export module
module.exports = SumoGongSpamDetector;

// Run if called directly
if (require.main === module) {
    const detector = new SumoGongSpamDetector();
    
    // Example event listeners
    detector.on('gong', (data) => {
        console.log(`🔔 GONG EVENT: ${data.type} - ${data.message}`);
    });
}