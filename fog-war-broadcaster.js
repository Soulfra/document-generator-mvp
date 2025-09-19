#!/usr/bin/env node

/**
 * 🌫️📡 FOG OF WAR MULTI-PLATFORM BROADCASTER
 * ==========================================
 * Broadcasts fog of war exploration to:
 * - Twitch (RTMP)
 * - YouTube Live
 * - Tor/Onion hidden services
 * - Self-hosted websites (GoDaddy, etc)
 * - P2P networks
 */

const express = require('express');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class FogWarBroadcaster {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 3003;
        
        // Broadcasting states
        this.activeStreams = new Map();
        this.viewers = new Map();
        this.torRelay = null;
        this.onionAddress = null;
        
        // Platform configurations
        this.platforms = {
            twitch: {
                rtmpUrl: 'rtmp://live.twitch.tv/live/',
                enabled: false,
                streamKey: null,
                viewers: 0
            },
            youtube: {
                rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2/',
                enabled: false,
                streamKey: null,
                viewers: 0
            },
            tor: {
                enabled: false,
                onionUrl: null,
                hiddenServiceDir: './tor-hidden-service',
                viewers: 0
            },
            selfHosted: {
                enabled: false,
                domains: [],
                cdnEnabled: false,
                viewers: 0
            }
        };
        
        this.initializeServer();
        this.setupRoutes();
        this.setupWebSocket();
        this.initializeBroadcasting();
        
        console.log('🌫️📡 FOG OF WAR BROADCASTER INITIALIZED');
        console.log('=====================================');
        console.log('📺 Multi-platform streaming ready');
        console.log('🧅 Tor/Onion broadcasting available');
        console.log('🌐 Self-hosted streaming supported');
    }
    
    initializeServer() {
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        // CORS for cross-origin streaming
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });
    }
    
    setupRoutes() {
        // Main broadcaster dashboard
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'fog-war-broadcast-dashboard.html'));
        });
        
        // Start broadcasting to platform
        this.app.post('/api/broadcast/start', async (req, res) => {
            try {
                const { platform, config } = req.body;
                
                console.log(`📡 Starting broadcast to ${platform}...`);
                
                const streamId = crypto.randomUUID();
                const stream = await this.startBroadcast(platform, config);
                
                this.activeStreams.set(streamId, {
                    id: streamId,
                    platform,
                    stream,
                    startTime: new Date(),
                    status: 'broadcasting',
                    viewers: 0
                });
                
                res.json({
                    success: true,
                    streamId,
                    message: `Broadcasting to ${platform} started!`,
                    streamUrl: this.getStreamUrl(platform, stream)
                });
                
            } catch (error) {
                console.error('❌ Broadcast start failed:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Stop broadcasting
        this.app.post('/api/broadcast/stop', async (req, res) => {
            try {
                const { streamId } = req.body;
                
                const stream = this.activeStreams.get(streamId);
                if (!stream) {
                    return res.status(404).json({ success: false, error: 'Stream not found' });
                }
                
                await this.stopBroadcast(stream);
                this.activeStreams.delete(streamId);
                
                res.json({ success: true, message: 'Broadcast stopped' });
                
            } catch (error) {
                console.error('❌ Broadcast stop failed:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Setup Tor hidden service
        this.app.post('/api/tor/setup', async (req, res) => {
            try {
                console.log('🧅 Setting up Tor hidden service...');
                
                const onionAddress = await this.setupTorService();
                
                res.json({
                    success: true,
                    onionAddress,
                    message: 'Tor hidden service created!'
                });
                
            } catch (error) {
                console.error('❌ Tor setup failed:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Configure self-hosted streaming
        this.app.post('/api/selfhost/configure', async (req, res) => {
            try {
                const { domains, cdnConfig } = req.body;
                
                console.log(`🌐 Configuring self-hosted streaming for ${domains.length} domains`);
                
                const config = await this.configureSelfHostedStreaming(domains, cdnConfig);
                
                res.json({
                    success: true,
                    config,
                    embedCode: this.generateEmbedCode(domains[0])
                });
                
            } catch (error) {
                console.error('❌ Self-hosting configuration failed:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Get active streams
        this.app.get('/api/streams', (req, res) => {
            const streams = Array.from(this.activeStreams.values()).map(stream => ({
                id: stream.id,
                platform: stream.platform,
                status: stream.status,
                viewers: stream.viewers,
                duration: Date.now() - stream.startTime,
                url: this.getStreamUrl(stream.platform, stream.stream)
            }));
            
            res.json({ success: true, streams });
        });
        
        // Get viewer statistics
        this.app.get('/api/stats', (req, res) => {
            const stats = {
                totalViewers: this.getTotalViewers(),
                platformStats: this.getPlatformStats(),
                torViewers: this.platforms.tor.viewers,
                bandwidth: this.calculateBandwidth(),
                uptime: process.uptime()
            };
            
            res.json({ success: true, stats });
        });
        
        // Stream health check
        this.app.get('/api/health/:streamId', (req, res) => {
            const stream = this.activeStreams.get(req.params.streamId);
            
            if (!stream) {
                return res.status(404).json({ success: false, error: 'Stream not found' });
            }
            
            res.json({
                success: true,
                health: {
                    status: stream.status,
                    bitrate: stream.bitrate || 'calculating...',
                    fps: stream.fps || 30,
                    keyframeInterval: 2,
                    viewers: stream.viewers
                }
            });
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const viewerId = crypto.randomUUID();
            const viewer = {
                id: viewerId,
                ws,
                connectedAt: new Date(),
                platform: req.url.split('/')[1] || 'direct'
            };
            
            this.viewers.set(viewerId, viewer);
            
            console.log(`👤 New viewer connected: ${viewerId}`);
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleViewerMessage(viewerId, data);
                } catch (error) {
                    console.error('Invalid viewer message:', error);
                }
            });
            
            ws.on('close', () => {
                this.viewers.delete(viewerId);
                console.log(`👤 Viewer disconnected: ${viewerId}`);
            });
            
            // Send initial stream data
            ws.send(JSON.stringify({
                type: 'welcome',
                viewerId,
                activeStreams: Array.from(this.activeStreams.keys())
            }));
        });
    }
    
    async startBroadcast(platform, config) {
        switch (platform) {
            case 'twitch':
                return this.startTwitchStream(config);
            
            case 'youtube':
                return this.startYouTubeStream(config);
            
            case 'tor':
                return this.startTorStream(config);
            
            case 'selfhosted':
                return this.startSelfHostedStream(config);
            
            default:
                throw new Error(`Unknown platform: ${platform}`);
        }
    }
    
    async startTwitchStream(config) {
        if (!config.streamKey) {
            throw new Error('Twitch stream key required');
        }
        
        console.log('📺 Starting Twitch stream...');
        
        // Use FFmpeg to capture and stream to Twitch
        const ffmpegCmd = [
            '-f', 'x11grab',
            '-video_size', '1920x1080',
            '-framerate', '30',
            '-i', ':0.0',
            '-f', 'pulse',
            '-i', 'default',
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-maxrate', '3000k',
            '-bufsize', '6000k',
            '-pix_fmt', 'yuv420p',
            '-g', '60',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-f', 'flv',
            `${this.platforms.twitch.rtmpUrl}${config.streamKey}`
        ];
        
        const ffmpeg = spawn('ffmpeg', ffmpegCmd);
        
        ffmpeg.stdout.on('data', (data) => {
            console.log(`FFmpeg: ${data}`);
        });
        
        ffmpeg.stderr.on('data', (data) => {
            // FFmpeg outputs to stderr
            const output = data.toString();
            if (output.includes('frame=')) {
                // Parse streaming stats
                const fps = output.match(/fps=\s*(\d+)/);
                if (fps) {
                    this.updateStreamStats('twitch', { fps: parseInt(fps[1]) });
                }
            }
        });
        
        this.platforms.twitch.enabled = true;
        this.platforms.twitch.streamKey = config.streamKey;
        
        return {
            process: ffmpeg,
            platform: 'twitch',
            config
        };
    }
    
    async startYouTubeStream(config) {
        if (!config.streamKey) {
            throw new Error('YouTube stream key required');
        }
        
        console.log('📺 Starting YouTube Live stream...');
        
        // Similar to Twitch but with YouTube-specific settings
        const ffmpegCmd = [
            '-f', 'x11grab',
            '-video_size', '1920x1080',
            '-framerate', '30',
            '-i', ':0.0',
            '-f', 'pulse',
            '-i', 'default',
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-maxrate', '4500k',
            '-bufsize', '9000k',
            '-pix_fmt', 'yuv420p',
            '-g', '60',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-f', 'flv',
            `${this.platforms.youtube.rtmpUrl}${config.streamKey}`
        ];
        
        const ffmpeg = spawn('ffmpeg', ffmpegCmd);
        
        this.platforms.youtube.enabled = true;
        this.platforms.youtube.streamKey = config.streamKey;
        
        return {
            process: ffmpeg,
            platform: 'youtube',
            config
        };
    }
    
    async startTorStream(config) {
        console.log('🧅 Starting Tor hidden service stream...');
        
        // Create WebRTC stream that can be accessed via Tor
        const torStream = {
            id: crypto.randomUUID(),
            type: 'tor',
            port: 8080 + Math.floor(Math.random() * 1000),
            onionAddress: this.onionAddress
        };
        
        // Start local streaming server
        const streamServer = express();
        const torHttpServer = http.createServer(streamServer);
        
        streamServer.get('/', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>🌫️ Fog of War - Tor Stream</title>
                    <style>
                        body { 
                            margin: 0; 
                            background: #000; 
                            color: #00ff00;
                            font-family: monospace;
                        }
                        #stream { 
                            width: 100vw; 
                            height: 100vh; 
                        }
                        .tor-badge {
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            background: #7d4698;
                            color: #fff;
                            padding: 5px 10px;
                            border-radius: 5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="tor-badge">🧅 TOR STREAM</div>
                    <iframe id="stream" src="/fog-of-war-3d-explorer.html"></iframe>
                </body>
                </html>
            `);
        });
        
        torHttpServer.listen(torStream.port);
        
        this.platforms.tor.enabled = true;
        
        return {
            server: torHttpServer,
            ...torStream
        };
    }
    
    async startSelfHostedStream(config) {
        console.log(`🌐 Starting self-hosted stream for ${config.domains.join(', ')}`);
        
        // Generate nginx configuration for streaming
        const nginxConfig = `
server {
    listen 80;
    server_name ${config.domains.join(' ')};
    
    location / {
        proxy_pass http://localhost:${this.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /stream {
        proxy_pass http://localhost:${this.port}/stream;
        proxy_buffering off;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /ws {
        proxy_pass http://localhost:${this.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
        `;
        
        // Save nginx config
        await fs.writeFile('./nginx-fog-stream.conf', nginxConfig);
        
        // Setup HLS streaming for self-hosted
        const hlsDir = './hls-stream';
        await fs.mkdir(hlsDir, { recursive: true });
        
        // Start HLS segmenter
        const ffmpegHLS = spawn('ffmpeg', [
            '-f', 'x11grab',
            '-video_size', '1920x1080',
            '-framerate', '30',
            '-i', ':0.0',
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-maxrate', '2500k',
            '-bufsize', '5000k',
            '-pix_fmt', 'yuv420p',
            '-g', '60',
            '-hls_time', '4',
            '-hls_list_size', '10',
            '-hls_flags', 'delete_segments',
            '-f', 'hls',
            `${hlsDir}/stream.m3u8`
        ]);
        
        this.platforms.selfHosted.enabled = true;
        this.platforms.selfHosted.domains = config.domains;
        
        return {
            process: ffmpegHLS,
            nginxConfig,
            hlsDir,
            domains: config.domains
        };
    }
    
    async setupTorService() {
        console.log('🧅 Creating Tor hidden service...');
        
        const torrcContent = `
# Fog of War Tor Configuration
HiddenServiceDir ${path.resolve(this.platforms.tor.hiddenServiceDir)}
HiddenServicePort 80 127.0.0.1:${this.port}
HiddenServicePort 8080 127.0.0.1:8080
        `;
        
        // Create tor directory
        await fs.mkdir(this.platforms.tor.hiddenServiceDir, { recursive: true });
        
        // Write torrc
        await fs.writeFile('./torrc-fog', torrcContent);
        
        // Start tor
        this.torRelay = spawn('tor', ['-f', './torrc-fog']);
        
        return new Promise((resolve, reject) => {
            this.torRelay.stdout.on('data', async (data) => {
                const output = data.toString();
                console.log(`Tor: ${output}`);
                
                if (output.includes('100%')) {
                    // Read onion address
                    try {
                        const hostname = await fs.readFile(
                            path.join(this.platforms.tor.hiddenServiceDir, 'hostname'),
                            'utf8'
                        );
                        this.onionAddress = hostname.trim();
                        this.platforms.tor.onionUrl = `http://${this.onionAddress}`;
                        
                        console.log(`🧅 Tor hidden service: ${this.onionAddress}`);
                        resolve(this.onionAddress);
                    } catch (error) {
                        reject(error);
                    }
                }
            });
            
            this.torRelay.stderr.on('data', (data) => {
                console.error(`Tor error: ${data}`);
            });
            
            setTimeout(() => {
                reject(new Error('Tor startup timeout'));
            }, 30000);
        });
    }
    
    async configureSelfHostedStreaming(domains, cdnConfig) {
        const config = {
            domains,
            cdn: cdnConfig || {
                enabled: false,
                provider: 'cloudflare'
            },
            ssl: {
                enabled: true,
                autoRenew: true
            },
            streaming: {
                protocol: 'HLS',
                segmentDuration: 4,
                playlistSize: 10
            }
        };
        
        // Generate SSL certificates with certbot if needed
        if (config.ssl.enabled) {
            for (const domain of domains) {
                console.log(`🔒 Generating SSL certificate for ${domain}`);
                // In production, would use certbot
            }
        }
        
        // Setup CDN if enabled
        if (config.cdn.enabled) {
            console.log(`☁️ Configuring CDN with ${config.cdn.provider}`);
            // Configure CDN endpoints
        }
        
        return config;
    }
    
    generateEmbedCode(domain) {
        return `
<!-- Fog of War Stream Embed -->
<iframe 
    src="https://${domain}/embed"
    width="800"
    height="600"
    frameborder="0"
    allowfullscreen
    allow="autoplay; fullscreen">
</iframe>

<!-- Alternative: Direct HLS Player -->
<video 
    id="fog-stream"
    controls
    width="800"
    height="600">
    <source src="https://${domain}/hls-stream/stream.m3u8" type="application/x-mpegURL">
</video>
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script>
    if (Hls.isSupported()) {
        var video = document.getElementById('fog-stream');
        var hls = new Hls();
        hls.loadSource('https://${domain}/hls-stream/stream.m3u8');
        hls.attachMedia(video);
    }
</script>
        `;
    }
    
    handleViewerMessage(viewerId, data) {
        const viewer = this.viewers.get(viewerId);
        if (!viewer) return;
        
        switch (data.type) {
            case 'join-stream':
                this.joinStream(viewerId, data.streamId);
                break;
            
            case 'chat':
                this.broadcastChat(viewerId, data.message);
                break;
            
            case 'interaction':
                this.handleViewerInteraction(viewerId, data);
                break;
        }
    }
    
    joinStream(viewerId, streamId) {
        const stream = this.activeStreams.get(streamId);
        if (stream) {
            stream.viewers++;
            console.log(`👤 Viewer ${viewerId} joined stream ${streamId}`);
        }
    }
    
    broadcastChat(viewerId, message) {
        const chatMessage = {
            type: 'chat',
            viewerId,
            message,
            timestamp: new Date()
        };
        
        // Broadcast to all viewers
        this.viewers.forEach(viewer => {
            viewer.ws.send(JSON.stringify(chatMessage));
        });
    }
    
    async stopBroadcast(stream) {
        console.log(`🛑 Stopping broadcast on ${stream.platform}`);
        
        if (stream.stream.process) {
            stream.stream.process.kill('SIGTERM');
        }
        
        if (stream.stream.server) {
            stream.stream.server.close();
        }
        
        // Update platform status
        if (this.platforms[stream.platform]) {
            this.platforms[stream.platform].enabled = false;
        }
    }
    
    getStreamUrl(platform, stream) {
        switch (platform) {
            case 'twitch':
                return `https://twitch.tv/${stream.config.channelName || 'fogofwarexplorer'}`;
            
            case 'youtube':
                return `https://youtube.com/watch?v=${stream.config.videoId || 'live'}`;
            
            case 'tor':
                return stream.onionAddress ? 
                    `http://${stream.onionAddress}` : 
                    'Generating onion address...';
            
            case 'selfhosted':
                return stream.domains ? 
                    `https://${stream.domains[0]}` : 
                    'Configuring domains...';
            
            default:
                return 'Unknown platform';
        }
    }
    
    getTotalViewers() {
        let total = 0;
        this.activeStreams.forEach(stream => {
            total += stream.viewers;
        });
        return total + this.viewers.size;
    }
    
    getPlatformStats() {
        const stats = {};
        Object.keys(this.platforms).forEach(platform => {
            stats[platform] = {
                enabled: this.platforms[platform].enabled,
                viewers: this.platforms[platform].viewers
            };
        });
        return stats;
    }
    
    calculateBandwidth() {
        // Estimate bandwidth based on active streams
        const streamCount = this.activeStreams.size;
        const avgBitrate = 3000; // kbps
        return streamCount * avgBitrate;
    }
    
    updateStreamStats(platform, stats) {
        // Update platform-specific stats
        if (this.platforms[platform]) {
            Object.assign(this.platforms[platform], stats);
        }
    }
    
    async initializeBroadcasting() {
        // Create necessary directories
        await fs.mkdir('./streams', { recursive: true });
        await fs.mkdir('./hls-stream', { recursive: true });
        await fs.mkdir('./tor-hidden-service', { recursive: true });
        
        // Check for required tools
        this.checkDependencies();
        
        console.log('📡 Broadcasting system initialized');
    }
    
    checkDependencies() {
        const dependencies = ['ffmpeg', 'tor', 'nginx'];
        
        dependencies.forEach(dep => {
            exec(`which ${dep}`, (error) => {
                if (error) {
                    console.warn(`⚠️ ${dep} not found - some features may not work`);
                } else {
                    console.log(`✅ ${dep} available`);
                }
            });
        });
    }
    
    start() {
        this.server.listen(this.port, () => {
            console.log('\n🌫️📡 FOG OF WAR BROADCASTER READY');
            console.log('===================================');
            console.log(`📡 Server running at http://localhost:${this.port}`);
            console.log(`📺 Twitch streaming: ${this.platforms.twitch.enabled ? 'Ready' : 'Configured'}`);
            console.log(`📺 YouTube streaming: ${this.platforms.youtube.enabled ? 'Ready' : 'Configured'}`);
            console.log(`🧅 Tor broadcasting: ${this.platforms.tor.enabled ? 'Ready' : 'Available'}`);
            console.log(`🌐 Self-hosted streaming: ${this.platforms.selfHosted.enabled ? 'Ready' : 'Available'}`);
            console.log('');
            console.log('🚀 Ready to broadcast fog of war exploration everywhere!');
        });
    }
}

// Start the broadcaster
const broadcaster = new FogWarBroadcaster();
broadcaster.start();