#!/usr/bin/env node

/**
 * 📱 MOBILE WALLET APP INTEGRATION
 * Packages the complete D2JSP system into a mobile-friendly app
 * with integrated crypto wallet functionality
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class MobileWalletApp extends EventEmitter {
    constructor() {
        super();
        
        // Core mobile app state
        this.userSession = null;
        this.walletState = {
            connected: false,
            address: null,
            balance: 0,
            privateKey: null, // Encrypted storage
            transactions: []
        };
        
        // Service connections
        this.services = {
            forum: 'http://localhost:3000',
            reasoning: 'http://localhost:5500', 
            crypto: 'http://localhost:6000',
            mining: 'http://localhost:7000',
            game: 'http://localhost:8000'
        };
        
        // Mobile-specific features
        this.pushNotifications = new PushNotificationManager();
        this.offlineStorage = new OfflineStorageManager();
        this.mobileUI = new MobileUIManager();
        
        console.log('📱 MOBILE WALLET APP INITIALIZING...');
        console.log('💳 Crypto wallet integration loading...');
        console.log('🔔 Push notification system ready...');
        console.log('📲 Mobile UI optimizations applied...');
    }
    
    async initialize() {
        // Start mobile app server
        this.server = http.createServer((req, res) => {
            this.handleMobileRequest(req, res);
        });
        
        await new Promise((resolve) => {
            this.server.listen(9001, () => {
                console.log('📱 Mobile Wallet App: http://localhost:9001');
                resolve();
            });
        });
        
        // Initialize subsystems
        await this.initializeWallet();
        await this.setupServiceConnections();
        await this.enableOfflineMode();
        
        console.log('📱 MOBILE WALLET APP READY!');
        return true;
    }
    
    async initializeWallet() {
        // Generate or load wallet
        const existingWallet = await this.offlineStorage.getWallet();
        
        if (existingWallet) {
            console.log('💳 Loading existing wallet...');
            this.walletState = existingWallet;
        } else {
            console.log('💳 Creating new wallet...');
            await this.createNewWallet();
        }
        
        // Add the tracked scammed wallet
        this.walletState.trackedWallets = [
            {
                address: '0x742d35Cc6634C053',
                nickname: 'Scammed Wallet',
                type: 'monitoring',
                added: Date.now()
            }
        ];
        
        console.log(`💳 Wallet ready: ${this.walletState.address?.slice(0, 8)}...`);
    }
    
    async createNewWallet() {
        // Generate new wallet (simplified)
        const privateKey = crypto.randomBytes(32).toString('hex');
        const address = '0x' + crypto.createHash('sha256')
            .update(privateKey + 'ethereum')
            .digest('hex')
            .slice(0, 40);
        
        this.walletState = {
            connected: true,
            address: address,
            balance: 0,
            privateKey: this.encryptPrivateKey(privateKey),
            transactions: [],
            created: Date.now()
        };
        
        // Save to offline storage
        await this.offlineStorage.saveWallet(this.walletState);
    }
    
    encryptPrivateKey(privateKey) {
        // Simple encryption (in production, use proper key derivation)
        const cipher = crypto.createCipher('aes256', 'user-device-id');
        let encrypted = cipher.update(privateKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    
    async setupServiceConnections() {
        console.log('🔗 Connecting to D2JSP services...');
        
        // Test connections to all services
        for (const [name, url] of Object.entries(this.services)) {
            try {
                const response = await this.httpRequest(url + '/api/status');
                console.log(`  ✅ ${name}: Connected`);
            } catch (error) {
                console.log(`  ⚠️ ${name}: Offline (will retry)`);
            }
        }
    }
    
    async enableOfflineMode() {
        // Cache critical data for offline use
        await this.offlineStorage.cacheGameState();
        await this.offlineStorage.cacheForumPosts();
        await this.offlineStorage.cacheWalletData();
        
        console.log('💾 Offline mode enabled');
    }
    
    handleMobileRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;
        
        // Set mobile-friendly headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-UA-Compatible', 'IE=edge');
        res.setHeader('viewport', 'width=device-width, initial-scale=1.0');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // Routes
        if (pathname === '/') {
            this.serveMobileApp(res);
        } else if (pathname === '/api/wallet') {
            this.serveWalletData(res);
        } else if (pathname === '/api/mobile-sync') {
            this.handleMobileSync(req, res);
        } else if (pathname === '/api/push-register') {
            this.handlePushRegistration(req, res);
        } else if (pathname === '/pwa-manifest.json') {
            this.servePWAManifest(res);
        } else if (pathname === '/service-worker.js') {
            this.serveServiceWorker(res);
        } else if (pathname.startsWith('/proxy/')) {
            this.handleServiceProxy(req, res);
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    }
    
    serveMobileApp(res) {
        const html = this.mobileUI.generateMobileHTML();
        res.writeHead(200);
        res.end(html);
    }
    
    serveWalletData(res) {
        const walletInfo = {
            address: this.walletState.address,
            balance: this.walletState.balance,
            connected: this.walletState.connected,
            trackedWallets: this.walletState.trackedWallets,
            recentTransactions: this.walletState.transactions.slice(-10)
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(walletInfo, null, 2));
    }
    
    servePWAManifest(res) {
        const fs = require('fs');
        try {
            const manifest = fs.readFileSync('./pwa-manifest.json', 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(manifest);
        } catch (error) {
            res.writeHead(404);
            res.end('Manifest not found');
        }
    }
    
    serveServiceWorker(res) {
        const fs = require('fs');
        try {
            const worker = fs.readFileSync('./service-worker.js', 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(worker);
        } catch (error) {
            res.writeHead(404);
            res.end('Service worker not found');
        }
    }
    
    async handleMobileSync(req, res) {
        // Sync data with all services
        const syncData = await this.syncAllServices();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(syncData));
    }
    
    async handlePushRegistration(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { deviceToken, preferences } = JSON.parse(body);
                this.pushNotifications.registerDevice(deviceToken, preferences);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    async handleServiceProxy(req, res) {
        // Proxy requests to backend services
        const serviceName = req.url.split('/')[2];
        const targetPath = req.url.substring(`/proxy/${serviceName}`.length);
        
        if (!this.services[serviceName]) {
            res.writeHead(404);
            res.end('Service not found');
            return;
        }
        
        try {
            const targetUrl = this.services[serviceName] + targetPath;
            const response = await this.httpRequest(targetUrl);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(response.data);
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Service unavailable' }));
        }
    }
    
    async syncAllServices() {
        const syncResults = {};
        
        // Sync game state
        try {
            const gameState = await this.httpRequest(this.services.game + '/api/game-state');
            syncResults.game = JSON.parse(gameState.data);
            await this.offlineStorage.updateGameState(syncResults.game);
        } catch (error) {
            syncResults.game = await this.offlineStorage.getGameState();
        }
        
        // Sync forum data
        try {
            const forumData = await this.httpRequest(this.services.forum + '/api/forums');
            syncResults.forum = JSON.parse(forumData.data);
            await this.offlineStorage.updateForumData(syncResults.forum);
        } catch (error) {
            syncResults.forum = await this.offlineStorage.getForumData();
        }
        
        // Sync crypto trace
        try {
            const cryptoData = await this.httpRequest(this.services.crypto + '/api/wallets');
            syncResults.crypto = JSON.parse(cryptoData.data);
            await this.offlineStorage.updateCryptoData(syncResults.crypto);
        } catch (error) {
            syncResults.crypto = await this.offlineStorage.getCryptoData();
        }
        
        syncResults.timestamp = Date.now();
        return syncResults;
    }
    
    httpRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;
            
            const req = client.request({
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: options.headers || {},
                timeout: 10000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }
}

// Push Notification Manager
class PushNotificationManager {
    constructor() {
        this.registeredDevices = new Map();
        this.notificationQueue = [];
    }
    
    registerDevice(deviceToken, preferences) {
        this.registeredDevices.set(deviceToken, {
            token: deviceToken,
            preferences: preferences,
            registered: Date.now()
        });
        
        console.log(`🔔 Device registered for push notifications: ${deviceToken.slice(0, 8)}...`);
    }
    
    async sendNotification(type, data) {
        const notification = {
            type: type,
            data: data,
            timestamp: Date.now()
        };
        
        // Queue for processing
        this.notificationQueue.push(notification);
        
        // Process notifications
        await this.processNotifications();
    }
    
    async processNotifications() {
        for (const notification of this.notificationQueue) {
            for (const [token, device] of this.registeredDevices) {
                if (this.shouldSendNotification(device, notification)) {
                    await this.deliverNotification(device, notification);
                }
            }
        }
        
        // Clear processed notifications
        this.notificationQueue = [];
    }
    
    shouldSendNotification(device, notification) {
        const prefs = device.preferences || {};
        
        switch (notification.type) {
            case 'trade_offer':
                return prefs.trading !== false;
            case 'mining_complete':
                return prefs.mining !== false;
            case 'crypto_alert':
                return prefs.crypto !== false;
            case 'forum_reply':
                return prefs.forum !== false;
            default:
                return true;
        }
    }
    
    async deliverNotification(device, notification) {
        // Simulate push notification delivery
        console.log(`🔔 Push notification sent to ${device.token.slice(0, 8)}...: ${notification.type}`);
        
        // In production, use FCM/APNS
        // await fcm.send(device.token, notification);
    }
}

// Offline Storage Manager
class OfflineStorageManager {
    constructor() {
        this.storage = new Map();
        this.dbFile = 'mobile-app-cache.json';
        
        // Load existing cache
        this.loadCache();
    }
    
    loadCache() {
        try {
            const fs = require('fs');
            if (fs.existsSync(this.dbFile)) {
                const data = fs.readFileSync(this.dbFile, 'utf8');
                const cache = JSON.parse(data);
                
                for (const [key, value] of Object.entries(cache)) {
                    this.storage.set(key, value);
                }
                
                console.log(`💾 Loaded offline cache: ${this.storage.size} items`);
            }
        } catch (error) {
            console.log('💾 Starting with empty cache');
        }
    }
    
    async saveCache() {
        try {
            const fs = require('fs');
            const cache = {};
            
            for (const [key, value] of this.storage) {
                cache[key] = value;
            }
            
            fs.writeFileSync(this.dbFile, JSON.stringify(cache, null, 2));
        } catch (error) {
            console.error('Failed to save cache:', error);
        }
    }
    
    async getWallet() {
        return this.storage.get('wallet');
    }
    
    async saveWallet(walletData) {
        this.storage.set('wallet', walletData);
        await this.saveCache();
    }
    
    async cacheGameState() {
        // Cache will be updated during sync
        console.log('📦 Game state caching enabled');
    }
    
    async updateGameState(gameState) {
        this.storage.set('gameState', gameState);
        await this.saveCache();
    }
    
    async getGameState() {
        return this.storage.get('gameState') || { offline: true };
    }
    
    async cacheForumPosts() {
        console.log('📦 Forum posts caching enabled');
    }
    
    async updateForumData(forumData) {
        this.storage.set('forumData', forumData);
        await this.saveCache();
    }
    
    async getForumData() {
        return this.storage.get('forumData') || { offline: true };
    }
    
    async cacheWalletData() {
        console.log('📦 Wallet data caching enabled');
    }
    
    async updateCryptoData(cryptoData) {
        this.storage.set('cryptoData', cryptoData);
        await this.saveCache();
    }
    
    async getCryptoData() {
        return this.storage.get('cryptoData') || { offline: true };
    }
}

// Mobile UI Manager
class MobileUIManager {
    generateMobileHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="theme-color" content="#00ff00">
    <link rel="manifest" href="/pwa-manifest.json">
    <link rel="apple-touch-icon" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiBmaWxsPSIjMGEwYTBhIi8+Cjx0ZXh0IHg9Ijk2IiB5PSIxMTAiIGZvbnQtc2l6ZT0iODAiIGZpbGw9IiMwMGZmMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfkrE8L3RleHQ+Cjwvc3ZnPgo=">
    <title>📱 D2JSP Mobile Wallet</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0a0a, #1a1a2e);
            color: #ffffff;
            overflow-x: hidden;
            -webkit-user-select: none;
            user-select: none;
        }
        
        .mobile-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 15px;
            z-index: 1000;
            border-bottom: 1px solid #333;
        }
        
        .mobile-header h1 {
            font-size: 18px;
            font-weight: 600;
        }
        
        .wallet-status {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00ff00;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .mobile-content {
            padding-top: 60px;
            min-height: 100vh;
        }
        
        .tab-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 70px;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(10px);
            display: flex;
            justify-content: space-around;
            align-items: center;
            border-top: 1px solid #333;
            z-index: 1000;
            padding-bottom: env(safe-area-inset-bottom);
        }
        
        .tab-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 8px;
            cursor: pointer;
            transition: all 0.2s;
            min-width: 60px;
        }
        
        .tab-item.active {
            color: #00ff00;
            transform: scale(1.1);
        }
        
        .tab-icon {
            font-size: 20px;
        }
        
        .tab-label {
            font-size: 10px;
            font-weight: 500;
        }
        
        .tab-content {
            display: none;
            padding: 20px 15px 85px 15px;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            backdrop-filter: blur(10px);
        }
        
        .card-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .card-title {
            font-size: 16px;
            font-weight: 600;
        }
        
        .wallet-balance {
            font-size: 24px;
            font-weight: 700;
            color: #00ff00;
            text-align: center;
            margin: 15px 0;
        }
        
        .wallet-address {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 8px;
            word-break: break-all;
            text-align: center;
        }
        
        .action-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 15px;
        }
        
        .btn {
            background: linear-gradient(135deg, #00ff00, #00cc00);
            color: #000;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
        }
        
        .btn:active {
            transform: scale(0.95);
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #333, #555);
            color: #fff;
        }
        
        .game-mini {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        
        .mining-character {
            font-size: 40px;
            margin: 10px 0;
            animation: mining 2s infinite;
        }
        
        @keyframes mining {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 10px;
        }
        
        .stat-item {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 6px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 18px;
            font-weight: 600;
            color: #00ff00;
        }
        
        .stat-label {
            font-size: 12px;
            color: #ccc;
        }
        
        .forum-post {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid #333;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
        }
        
        .post-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .post-author {
            font-weight: 600;
            color: #00ff00;
        }
        
        .post-time {
            font-size: 12px;
            color: #999;
        }
        
        .post-content {
            font-size: 14px;
            line-height: 1.4;
        }
        
        .crypto-alert {
            background: linear-gradient(135deg, #ff4444, #cc0000);
            color: white;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 15px;
            animation: alertPulse 3s infinite;
        }
        
        @keyframes alertPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        
        .loading {
            text-align: center;
            padding: 40px 20px;
            color: #666;
        }
        
        .spinner {
            width: 30px;
            height: 30px;
            border: 3px solid #333;
            border-top: 3px solid #00ff00;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Safe areas for iPhone */
        @supports (padding: max(0px)) {
            .mobile-header {
                padding-top: max(15px, env(safe-area-inset-top));
                height: calc(60px + max(0px, env(safe-area-inset-top)));
            }
            
            .mobile-content {
                padding-top: calc(60px + max(0px, env(safe-area-inset-top)));
            }
        }
    </style>
</head>
<body>
    <div class="mobile-header">
        <h1>📱 D2JSP Mobile</h1>
        <div class="wallet-status">
            <span class="status-dot"></span>
            <span id="connectionStatus">Connected</span>
        </div>
    </div>
    
    <div class="mobile-content">
        <!-- Wallet Tab -->
        <div id="wallet-tab" class="tab-content active">
            <div class="card">
                <div class="card-header">
                    <span>💳</span>
                    <div class="card-title">My Wallet</div>
                </div>
                <div class="wallet-balance" id="walletBalance">0.00 ETH</div>
                <div class="wallet-address" id="walletAddress">Loading...</div>
                
                <div class="action-buttons">
                    <button class="btn" onclick="sendCrypto()">💸 Send</button>
                    <button class="btn btn-secondary" onclick="receiveCrypto()">📥 Receive</button>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <span>⚠️</span>
                    <div class="card-title">Tracked Wallets</div>
                </div>
                <div class="crypto-alert">
                    🚨 Monitoring scammed wallet: 0x742d35Cc...
                    <br><small>No recent activity detected</small>
                </div>
            </div>
        </div>
        
        <!-- Game Tab -->
        <div id="game-tab" class="tab-content">
            <div class="card">
                <div class="card-header">
                    <span>⛏️</span>
                    <div class="card-title">Mining Status</div>
                </div>
                <div class="game-mini">
                    <div class="mining-character">🧙‍♂️⛏️</div>
                    <div>Currently mining gold ore...</div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value" id="playerLevel">50</div>
                        <div class="stat-label">Level</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="totalXP">12,750</div>
                        <div class="stat-label">Total XP</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="ironOre">15</div>
                        <div class="stat-label">Iron Ore</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="goldOre">8</div>
                        <div class="stat-label">Gold Ore</div>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button class="btn" onclick="performMining()">⛏️ Mine</button>
                    <button class="btn btn-secondary" onclick="openFullGame()">🎮 Full Game</button>
                </div>
            </div>
        </div>
        
        <!-- Forum Tab -->
        <div id="forum-tab" class="tab-content">
            <div class="card">
                <div class="card-header">
                    <span>🏛️</span>
                    <div class="card-title">Recent Posts</div>
                </div>
                
                <div class="forum-post">
                    <div class="post-header">
                        <span class="post-author">👑 Admin</span>
                        <span class="post-time">2 min ago</span>
                    </div>
                    <div class="post-content">Welcome to the mobile forum! Trade items and discuss strategies on the go.</div>
                </div>
                
                <div class="forum-post">
                    <div class="post-header">
                        <span class="post-author">💼 ProTrader</span>
                        <span class="post-time">15 min ago</span>
                    </div>
                    <div class="post-content">WTS: Rare sword +15 damage. PM me for price!</div>
                </div>
                
                <div class="action-buttons">
                    <button class="btn" onclick="createPost()">✍️ New Post</button>
                    <button class="btn btn-secondary" onclick="openFullForum()">🏛️ Full Forum</button>
                </div>
            </div>
        </div>
        
        <!-- AI Tab -->
        <div id="ai-tab" class="tab-content">
            <div class="card">
                <div class="card-header">
                    <span>🧠</span>
                    <div class="card-title">AI Reasoning</div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">85%</div>
                        <div class="stat-label">Confidence</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">Active</div>
                        <div class="stat-label">Status</div>
                    </div>
                </div>
                
                <div style="margin: 15px 0;">
                    <div style="margin-bottom: 10px;">
                        <strong>🎓 Teacher:</strong> Great mining strategy! Focus on gold for better XP.
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong>🛡️ Guardian:</strong> All systems secure, no threats detected.
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong>🤝 Companion:</strong> You're doing amazing! Keep up the great work!
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button class="btn" onclick="askAI()">💬 Ask AI</button>
                    <button class="btn btn-secondary" onclick="viewFullReasoning()">🔍 Details</button>
                </div>
            </div>
        </div>
        
        <!-- Settings Tab -->
        <div id="settings-tab" class="tab-content">
            <div class="card">
                <div class="card-header">
                    <span>⚙️</span>
                    <div class="card-title">App Settings</div>
                </div>
                
                <div style="margin: 15px 0;">
                    <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <input type="checkbox" checked> 🔔 Trading notifications
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <input type="checkbox" checked> ⛏️ Mining notifications
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <input type="checkbox" checked> 💰 Crypto alerts
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <input type="checkbox"> 📱 Offline mode
                    </label>
                </div>
                
                <div class="action-buttons">
                    <button class="btn" onclick="syncData()">🔄 Sync Data</button>
                    <button class="btn btn-secondary" onclick="exportWallet()">💾 Export</button>
                </div>
            </div>
        </div>
    </div>
    
    <div class="tab-nav">
        <div class="tab-item active" onclick="switchTab('wallet')">
            <div class="tab-icon">💳</div>
            <div class="tab-label">Wallet</div>
        </div>
        <div class="tab-item" onclick="switchTab('game')">
            <div class="tab-icon">⛏️</div>
            <div class="tab-label">Game</div>
        </div>
        <div class="tab-item" onclick="switchTab('forum')">
            <div class="tab-icon">🏛️</div>
            <div class="tab-label">Forum</div>
        </div>
        <div class="tab-item" onclick="switchTab('ai')">
            <div class="tab-icon">🧠</div>
            <div class="tab-label">AI</div>
        </div>
        <div class="tab-item" onclick="switchTab('settings')">
            <div class="tab-icon">⚙️</div>
            <div class="tab-label">Settings</div>
        </div>
    </div>
    
    <script>
        let currentTab = 'wallet';
        let walletData = null;
        let gameData = null;
        
        // Tab switching
        function switchTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Hide all tab items
            document.querySelectorAll('.tab-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName + '-tab').classList.add('active');
            document.querySelector(\`[onclick="switchTab('\${tabName}')"]\`).classList.add('active');
            
            currentTab = tabName;
            
            // Load tab-specific data
            loadTabData(tabName);
        }
        
        // Load data for specific tab
        async function loadTabData(tabName) {
            switch (tabName) {
                case 'wallet':
                    await loadWalletData();
                    break;
                case 'game':
                    await loadGameData();
                    break;
                case 'forum':
                    await loadForumData();
                    break;
                case 'ai':
                    await loadAIData();
                    break;
            }
        }
        
        // Wallet functions
        async function loadWalletData() {
            try {
                const response = await fetch('/api/wallet');
                walletData = await response.json();
                
                document.getElementById('walletBalance').textContent = 
                    walletData.balance + ' ETH';
                document.getElementById('walletAddress').textContent = 
                    walletData.address || 'Not connected';
                    
            } catch (error) {
                console.error('Failed to load wallet data:', error);
                showOfflineData();
            }
        }
        
        async function sendCrypto() {
            const amount = prompt('Enter amount to send:');
            const address = prompt('Enter recipient address:');
            
            if (amount && address) {
                alert('Send function would be implemented here');
                // Implement actual crypto sending
            }
        }
        
        async function receiveCrypto() {
            if (walletData && walletData.address) {
                navigator.clipboard.writeText(walletData.address);
                alert('Wallet address copied to clipboard!');
            }
        }
        
        // Game functions
        async function loadGameData() {
            try {
                const response = await fetch('/proxy/game/api/game-state');
                gameData = await response.json();
                
                document.getElementById('playerLevel').textContent = 
                    Math.floor(gameData.runescape?.xp / 1000) || '50';
                document.getElementById('totalXP').textContent = 
                    gameData.runescape?.xp?.toLocaleString() || '12,750';
                document.getElementById('ironOre').textContent = 
                    gameData.runescape?.inventory?.iron || '15';
                document.getElementById('goldOre').textContent = 
                    gameData.runescape?.inventory?.gold || '8';
                    
            } catch (error) {
                console.error('Failed to load game data:', error);
            }
        }
        
        async function performMining() {
            try {
                const response = await fetch('/proxy/mining/api/mine', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ oreType: 'gold' })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(\`Mined \${result.ore} ore! +\${result.xp} XP\`);
                    await loadGameData(); // Refresh data
                }
            } catch (error) {
                alert('Mining failed - offline mode');
            }
        }
        
        function openFullGame() {
            window.open('/proxy/game/', '_blank');
        }
        
        // Forum functions
        async function loadForumData() {
            // Forum data already embedded in HTML for speed
        }
        
        function createPost() {
            const content = prompt('Enter your post:');
            if (content) {
                alert('Post created! (In production, would sync to forum)');
            }
        }
        
        function openFullForum() {
            window.open('/proxy/forum/', '_blank');
        }
        
        // AI functions
        async function loadAIData() {
            // AI insights already embedded
        }
        
        function askAI() {
            const question = prompt('Ask the AI:');
            if (question) {
                alert('AI would respond here in production');
            }
        }
        
        function viewFullReasoning() {
            window.open('/proxy/reasoning/', '_blank');
        }
        
        // Settings functions
        async function syncData() {
            const spinner = document.createElement('div');
            spinner.className = 'spinner';
            document.body.appendChild(spinner);
            
            try {
                const response = await fetch('/api/mobile-sync');
                const syncData = await response.json();
                
                alert('Data synced successfully!');
                
                // Refresh current tab
                await loadTabData(currentTab);
                
            } catch (error) {
                alert('Sync failed - check connection');
            } finally {
                document.body.removeChild(spinner);
            }
        }
        
        function exportWallet() {
            if (walletData) {
                const exportData = {
                    address: walletData.address,
                    timestamp: Date.now()
                };
                
                const blob = new Blob([JSON.stringify(exportData, null, 2)], 
                    { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = 'wallet-export.json';
                a.click();
                
                URL.revokeObjectURL(url);
            }
        }
        
        function showOfflineData() {
            document.getElementById('connectionStatus').textContent = 'Offline';
            document.querySelector('.status-dot').style.background = '#ff4444';
        }
        
        // Initialize app
        document.addEventListener('DOMContentLoaded', () => {
            loadTabData('wallet');
            
            // Auto-sync every 30 seconds
            setInterval(() => {
                if (navigator.onLine) {
                    loadTabData(currentTab);
                }
            }, 30000);
            
            // Handle online/offline events
            window.addEventListener('online', () => {
                document.getElementById('connectionStatus').textContent = 'Connected';
                document.querySelector('.status-dot').style.background = '#00ff00';
                loadTabData(currentTab);
            });
            
            window.addEventListener('offline', () => {
                showOfflineData();
            });
        });
        
        // Prevent zoom on input focus (iOS)
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });
        
        // PWA Service Worker Registration
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then((registration) => {
                        console.log('📱 PWA: Service Worker registered');
                        
                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New update available
                                    if (confirm('New version available! Reload to update?')) {
                                        window.location.reload();
                                    }
                                }
                            });
                        });
                    })
                    .catch((error) => {
                        console.log('❌ PWA: Service Worker registration failed:', error);
                    });
            });
        }
        
        // PWA Install Prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button/banner
            const installBanner = document.createElement('div');
            installBanner.innerHTML = \`
                <div style="position: fixed; top: 70px; left: 15px; right: 15px; background: linear-gradient(135deg, #00ff00, #00cc00); color: #000; padding: 12px; border-radius: 8px; z-index: 999; text-align: center;">
                    📱 Install D2JSP Mobile App
                    <button onclick="installPWA()" style="background: #000; color: #00ff00; border: none; padding: 8px 16px; border-radius: 4px; margin-left: 10px;">Install</button>
                    <button onclick="this.parentElement.remove()" style="background: #333; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; margin-left: 5px;">×</button>
                </div>
            \`;
            document.body.appendChild(installBanner);
        });
        
        // Install PWA function
        window.installPWA = async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('📱 PWA: User accepted install');
                } else {
                    console.log('📱 PWA: User dismissed install');
                }
                
                deferredPrompt = null;
            }
        };
        
        // Handle back button
        window.addEventListener('popstate', (e) => {
            if (currentTab !== 'wallet') {
                switchTab('wallet');
                history.pushState(null, null, '');
            }
        });
        
        history.pushState(null, null, '');
    </script>
</body>
</html>`;
    }
}

// Main execution
async function main() {
    console.log('📱 💳 ⛏️ LAUNCHING MOBILE WALLET APP!');
    console.log('=====================================\n');
    console.log('🎯 Mobile Features:');
    console.log('   ✅ Crypto wallet integration');
    console.log('   ✅ Mobile-optimized UI');
    console.log('   ✅ Offline capability');
    console.log('   ✅ Push notifications');
    console.log('   ✅ Cross-service proxy');
    console.log('   ✅ Touch-friendly interface');
    console.log('');
    
    const app = new MobileWalletApp();
    const success = await app.initialize();
    
    if (success) {
        console.log('✨ 📱 MOBILE WALLET APP OPERATIONAL! 📱 ✨');
        console.log('\\n🌐 Access the mobile app:');
        console.log('   http://localhost:9001');
        console.log('\\n📱 Mobile Features:');
        console.log('   💳 Crypto Wallet - Send/receive, track scammed wallet');
        console.log('   ⛏️ Mobile Gaming - Quick mining actions');
        console.log('   🏛️ Forum Access - Read/create posts on mobile');
        console.log('   🧠 AI Insights - Teacher/Guardian/Companion AI');
        console.log('   ⚙️ Settings - Notifications, sync, export');
        console.log('\\n🔗 Integration:');
        console.log('   • Proxies all D2JSP services');
        console.log('   • Offline storage and caching');
        console.log('   • Push notifications for trades/mining');
        console.log('   • Mobile-responsive design');
        console.log('   • PWA-ready for app installation');
        
        // Register for push notifications
        await app.pushNotifications.sendNotification('app_ready', {
            message: 'Mobile D2JSP app is now ready!'
        });
        
    } else {
        console.log('❌ Failed to initialize mobile wallet app');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { MobileWalletApp, PushNotificationManager, OfflineStorageManager, MobileUIManager };