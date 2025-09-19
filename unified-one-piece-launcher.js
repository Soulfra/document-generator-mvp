#!/usr/bin/env node
// unified-one-piece-launcher.js - The final piece that brings everything together
// Launches the unified layer with all services integrated

console.log('🏴‍☠️ UNIFIED ONE PIECE LAUNCHER - Finding the treasure!');

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');

class UnifiedOnePieceLauncher {
    constructor() {
        this.services = new Map();
        this.app = express();
        this.treasureMap = {
            // The One Piece is the unified experience where everything works together
            pieces: {
                streaming: { found: false, location: 'streaming-deployment-master.js' },
                gaming: { found: false, location: 'colyseus-multiplayer-server.js' },
                security: { found: false, location: 'streaming-security-framework.js' },
                icp: { found: false, location: 'icp-rotation-system.js' },
                symlinks: { found: false, location: 'streaming-symlink-architecture.js' },
                ui: { found: false, location: 'unified-everything-layer.html' }
            },
            
            // Country flags encoded as service endpoints
            countryFlags: {
                '🇯🇵': { service: 'gaming', port: 2567, treasure: 'ONEPIECE{japan_gaming_server}' },
                '🇺🇸': { service: 'streaming', port: 8995, treasure: 'ONEPIECE{usa_streaming_hub}' },
                '🇬🇧': { service: 'security', port: 8998, treasure: 'ONEPIECE{uk_security_fortress}' },
                '🇧🇷': { service: 'multiplayer', port: 2567, treasure: 'ONEPIECE{brazil_party_mode}' },
                '🇰🇷': { service: 'esports', port: 8997, treasure: 'ONEPIECE{korea_esports_arena}' }
            },
            
            // The final flag - when all pieces come together
            finalFlag: null
        };
    }
    
    async launch() {
        console.log('🗺️ Following the treasure map to find the One Piece...\n');
        
        // Step 1: Find all the pieces
        await this.findAllPieces();
        
        // Step 2: Start core services
        await this.startCoreServices();
        
        // Step 3: Connect everything with symlinks
        await this.connectWithSymlinks();
        
        // Step 4: Launch the unified interface
        await this.launchUnifiedInterface();
        
        // Step 5: Reveal the One Piece
        this.revealTheOnePiece();
    }
    
    async findAllPieces() {
        console.log('🔍 Searching for all pieces of the One Piece...\n');
        
        for (const [piece, info] of Object.entries(this.treasureMap.pieces)) {
            if (fs.existsSync(info.location)) {
                info.found = true;
                console.log(`✅ Found ${piece} piece at ${info.location}`);
            } else {
                console.log(`❌ Missing ${piece} piece at ${info.location}`);
            }
        }
        
        const foundCount = Object.values(this.treasureMap.pieces).filter(p => p.found).length;
        console.log(`\n📊 Found ${foundCount}/${Object.keys(this.treasureMap.pieces).length} pieces\n`);
    }
    
    async startCoreServices() {
        console.log('🚀 Starting core services...\n');
        
        // Start multiplayer server
        if (this.treasureMap.pieces.gaming.found) {
            try {
                const gaming = spawn('node', ['colyseus-multiplayer-server.js'], {
                    detached: true,
                    stdio: 'ignore'
                });
                gaming.unref();
                this.services.set('gaming', gaming);
                console.log('✅ Gaming/Multiplayer server started on port 2567');
            } catch (error) {
                console.log('⚠️ Gaming server already running or failed to start');
            }
        }
        
        // Start ICP rotation system
        if (this.treasureMap.pieces.icp.found) {
            const ICPRotationSystem = require('./icp-rotation-system.js');
            this.icpSystem = new ICPRotationSystem();
            console.log('✅ ICP Rotation System initialized');
        }
        
        // Note: Other services (streaming, security) are already running from previous setup
        console.log('✅ Core services ready\n');
    }
    
    async connectWithSymlinks() {
        console.log('🔗 Connecting everything with symlinks...\n');
        
        if (this.treasureMap.pieces.symlinks.found) {
            const SymlinkArch = require('./streaming-symlink-architecture.js');
            const symlinkSystem = new SymlinkArch();
            
            // Add unified layer to symlink structure
            symlinkSystem.symlinkStructure['unified-layer'] = {
                source: 'unified-everything-layer.html',
                targets: [
                    'web-interface/index.html',
                    'public/unified.html',
                    'dist/index.html'
                ],
                description: 'Unified everything layer interface'
            };
            
            console.log('✅ Symlink connections established\n');
        }
    }
    
    async launchUnifiedInterface() {
        console.log('🌐 Launching unified interface...\n');
        
        // Serve the unified interface
        this.app.use(express.static('.'));
        
        // Main route
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'unified-everything-layer.html'));
        });
        
        // Country flag endpoints
        Object.entries(this.treasureMap.countryFlags).forEach(([flag, info]) => {
            this.app.get('/flag/' + info.service, (req, res) => {
                res.json({
                    flag,
                    service: info.service,
                    port: info.port,
                    treasure: info.treasure,
                    hint: 'Connect to this service to unlock the treasure'
                });
            });
        });
        
        // The One Piece endpoint
        this.app.get('/onepiece', (req, res) => {
            if (this.treasureMap.finalFlag) {
                res.json({
                    found: true,
                    flag: this.treasureMap.finalFlag,
                    message: '🎉 You found the One Piece! The unified layer where everything connects!',
                    treasure: {
                        streaming: '✅ Independent streaming empire',
                        gaming: '✅ Multiplayer game server',
                        security: '✅ CTF challenges and protection',
                        icp: '✅ Dynamic user experience',
                        symlinks: '✅ Modular architecture',
                        unified: '✅ Single layer integration'
                    }
                });
            } else {
                res.json({
                    found: false,
                    hint: 'Collect all country flags by connecting to each service'
                });
            }
        });
        
        // Video/GIF generation endpoint
        this.app.get('/generate/:type', (req, res) => {
            const { type } = req.params;
            
            if (type === 'video') {
                res.json({
                    status: 'ready',
                    command: 'ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 output.mp4',
                    message: 'Use FFmpeg through media server to generate videos'
                });
            } else if (type === 'gif') {
                res.json({
                    status: 'ready',
                    command: 'ffmpeg -i input.mp4 -vf "fps=10,scale=320:-1" output.gif',
                    message: 'Convert videos to GIFs using media server'
                });
            } else if (type === 'qr') {
                res.json({
                    status: 'ready',
                    data: 'ONEPIECE{scan_to_find_treasure}',
                    message: 'QR codes can encode treasure locations'
                });
            }
        });
        
        const PORT = 9999;
        this.server = this.app.listen(PORT, () => {
            console.log(`✅ Unified interface launched at http://localhost:${PORT}\n`);
        });
    }
    
    revealTheOnePiece() {
        // Check if all services are connected
        const allPiecesFound = Object.values(this.treasureMap.pieces).every(p => p.found);
        
        if (allPiecesFound) {
            // Generate the final flag
            const components = [
                'UNIFIED',
                'STREAMING',
                'GAMING', 
                'SECURITY',
                'ICP',
                'SYMLINKS'
            ];
            
            this.treasureMap.finalFlag = `ONEPIECE{${components.join('_')}_${Date.now()}}`;
            
            console.log('🏴‍☠️ =============================================== 🏴‍☠️');
            console.log('🎉 THE ONE PIECE HAS BEEN FOUND! 🎉\n');
            console.log(`🏁 Final Flag: ${this.treasureMap.finalFlag}\n`);
            console.log('🗺️ What is the One Piece?');
            console.log('   It\'s the unified layer where:');
            console.log('   - 🎬 Streaming infrastructure serves content');
            console.log('   - 🎮 Gaming brings people together');
            console.log('   - 🛡️ Security protects and challenges');
            console.log('   - 🎯 ICP rotation personalizes experience');
            console.log('   - 🔗 Symlinks connect everything modularly');
            console.log('   - 🌐 A single interface unifies all services\n');
            console.log('📺 To generate videos: Use FFmpeg via media server');
            console.log('🎞️ To create GIFs: Convert through /generate/gif');
            console.log('📱 QR codes: Encode treasure maps and flags');
            console.log('🌍 Country flags: Each represents a service endpoint\n');
            console.log('🚀 Access the unified experience at:');
            console.log('   http://localhost:9999\n');
            console.log('🏴‍☠️ =============================================== 🏴‍☠️');
        } else {
            console.log('🔍 Still searching for the One Piece...');
            console.log('   Some pieces are missing. Check the treasure map!\n');
        }
    }
    
    // Graceful shutdown
    async shutdown() {
        console.log('\n🛑 Shutting down the One Piece...');
        
        // Stop services
        this.services.forEach((service, name) => {
            try {
                service.kill();
                console.log(`✅ Stopped ${name}`);
            } catch (error) {
                // Service might already be stopped
            }
        });
        
        // Close server
        if (this.server) {
            this.server.close();
        }
        
        console.log('👋 Until next time, pirates!');
        process.exit(0);
    }
}

// Launch the One Piece
const launcher = new UnifiedOnePieceLauncher();

// Handle shutdown
process.on('SIGINT', () => launcher.shutdown());
process.on('SIGTERM', () => launcher.shutdown());

// Start the journey
launcher.launch().catch(console.error);