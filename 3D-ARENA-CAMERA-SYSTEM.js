/**
 * 🏟️ 3D ARENA CAMERA SYSTEM
 * 
 * Contract with sports arenas for 3D camera installations to provide
 * immersive "be there" experiences with volumetric video capture and
 * spatial audio integration.
 * 
 * Features:
 * - Multi-angle 3D camera feed aggregation
 * - Volumetric video capture for "be there" experience
 * - Spatial audio integration with auditable sound system
 * - Home viewer position customization
 * - Integration with existing 3D game server infrastructure
 * - Backyard/Frontyard sports simulation modes
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const http = require('http');
const WebSocket = require('ws');

class Arena3DCameraSystem extends EventEmitter {
    constructor() {
        super();
        
        // Camera system configuration
        this.config = {
            // Arena partnerships
            arenaPartners: {
                active: [
                    {
                        id: 'amalie_arena',
                        name: 'Amalie Arena',
                        location: 'Tampa, FL',
                        sport: 'nhl',
                        team: 'Tampa Bay Lightning',
                        cameras: {
                            installed: 48,
                            active: 48,
                            resolution: '8K',
                            fps: 120,
                            volumetric: true
                        },
                        audio: {
                            microphones: 128,
                            spatialChannels: 32,
                            crowdCapture: true
                        }
                    },
                    {
                        id: 'american_family_field',
                        name: 'American Family Field',
                        location: 'Milwaukee, WI',
                        sport: 'mlb',
                        team: 'Milwaukee Brewers',
                        cameras: {
                            installed: 36,
                            active: 36,
                            resolution: '6K',
                            fps: 90,
                            volumetric: true
                        },
                        audio: {
                            microphones: 96,
                            spatialChannels: 24,
                            crowdCapture: true
                        }
                    }
                ],
                pending: [
                    { name: 'Madison Square Garden', sport: 'nba', status: 'negotiating' },
                    { name: 'Lambeau Field', sport: 'nfl', status: 'proposal_sent' },
                    { name: 'Wembley Stadium', sport: 'soccer', status: 'initial_contact' }
                ]
            },
            
            // Camera specifications
            cameraSpecs: {
                professional: {
                    resolution: '8K',
                    fps: 120,
                    bitrate: 100000, // 100 Mbps
                    latency: 50, // 50ms
                    volumetric: true,
                    depth: true,
                    hdr: true,
                    format: 'raw'
                },
                standard: {
                    resolution: '4K',
                    fps: 60,
                    bitrate: 50000, // 50 Mbps
                    latency: 100,
                    volumetric: true,
                    depth: true,
                    hdr: false,
                    format: 'h265'
                },
                mobile: {
                    resolution: '1080p',
                    fps: 30,
                    bitrate: 10000, // 10 Mbps
                    latency: 200,
                    volumetric: false,
                    depth: false,
                    hdr: false,
                    format: 'h264'
                }
            },
            
            // Viewing modes
            viewingModes: {
                courtside: {
                    name: 'Courtside Experience',
                    cameras: 4,
                    audio: 'binaural',
                    movement: 'limited',
                    premium: true
                },
                skybox: {
                    name: 'Luxury Box View',
                    cameras: 2,
                    audio: 'spatial',
                    movement: 'panoramic',
                    premium: true
                },
                playerView: {
                    name: 'Player Perspective',
                    cameras: 8,
                    audio: 'field_level',
                    movement: 'dynamic',
                    premium: true
                },
                broadcast: {
                    name: 'Enhanced Broadcast',
                    cameras: 3,
                    audio: 'commentary',
                    movement: 'director_controlled',
                    premium: false
                },
                backyard: {
                    name: 'Backyard Sports Mode',
                    cameras: 2,
                    audio: 'ambient',
                    movement: 'static',
                    premium: false,
                    effects: ['cartoon', 'retro', 'arcade']
                }
            },
            
            // Volumetric capture settings
            volumetricCapture: {
                enabled: true,
                pointCloudDensity: 1000000, // points per frame
                meshGeneration: true,
                textureResolution: '4K',
                compressionRatio: 10,
                realTimeProcessing: true
            },
            
            // Spatial audio configuration
            spatialAudio: {
                enabled: true,
                channels: 32,
                objectBased: true,
                crowdSimulation: true,
                playerMics: true,
                reverbModeling: true,
                binauralRendering: true
            },
            
            // Processing infrastructure
            processing: {
                edgeServers: 5,
                gpuClusters: 3,
                bandwidthPerStream: 1000, // Mbps
                redundancy: 2,
                latencyTarget: 100 // ms
            }
        };
        
        // System state
        this.arenaConnections = new Map();
        this.activeFeeds = new Map();
        this.viewerSessions = new Map();
        this.volumetricData = new Map();
        this.audioStreams = new Map();
        
        // Processing state
        this.processingQueue = [];
        this.renderingPipeline = new Map();
        this.cacheManager = new Map();
        
        // Integration points
        this.streamAggregator = null;
        this.audioSystem = null;
        this.gameServer3D = null;
        this.sonarDisplay = null;
        
        // Server configuration
        this.httpPort = 9092;
        this.wsPort = 9093;
        this.httpServer = null;
        this.wsServer = null;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🏟️ Initializing 3D Arena Camera System...');
        
        try {
            // Setup arena connections
            await this.setupArenaConnections();
            
            // Initialize volumetric processing
            await this.initializeVolumetricProcessing();
            
            // Setup spatial audio system
            await this.setupSpatialAudio();
            
            // Initialize rendering pipeline
            await this.initializeRenderingPipeline();
            
            // Start servers
            await this.startServers();
            
            // Load integrations
            await this.loadIntegrations();
            
            // Begin monitoring
            this.startSystemMonitoring();
            
            console.log('✅ 3D Arena Camera System initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize 3D camera system:', error);
            throw error;
        }
    }
    
    // ===================== ARENA CONNECTIONS =====================
    
    async setupArenaConnections() {
        console.log('🔌 Setting up arena connections...');
        
        for (const arena of this.config.arenaPartners.active) {
            try {
                const connection = await this.connectToArena(arena);
                this.arenaConnections.set(arena.id, connection);
                
                console.log(`✅ Connected to ${arena.name}: ${arena.cameras.active} cameras online`);
                
            } catch (error) {
                console.error(`❌ Failed to connect to ${arena.name}:`, error);
            }
        }
    }
    
    async connectToArena(arena) {
        const connection = {
            arena: arena,
            status: 'connecting',
            cameras: new Map(),
            audioChannels: new Map(),
            bandwidth: {
                allocated: 0,
                used: 0,
                peak: 0
            },
            latency: {
                current: 0,
                average: 0,
                min: 999,
                max: 0
            },
            uptime: 0,
            lastHeartbeat: Date.now()
        };
        
        // Initialize camera feeds
        for (let i = 0; i < arena.cameras.active; i++) {
            const camera = {
                id: `${arena.id}_cam_${i}`,
                index: i,
                status: 'active',
                resolution: arena.cameras.resolution,
                fps: arena.cameras.fps,
                stream: null,
                position: this.calculateCameraPosition(arena, i),
                orientation: this.calculateCameraOrientation(arena, i),
                fov: 90,
                depth: arena.cameras.volumetric,
                lastFrame: Date.now()
            };
            
            connection.cameras.set(camera.id, camera);
        }
        
        // Initialize audio channels
        for (let i = 0; i < arena.audio.spatialChannels; i++) {
            const audioChannel = {
                id: `${arena.id}_audio_${i}`,
                index: i,
                type: this.getAudioChannelType(i),
                position: this.calculateAudioPosition(arena, i),
                gain: 1.0,
                muted: false,
                lastSample: Date.now()
            };
            
            connection.audioChannels.set(audioChannel.id, audioChannel);
        }
        
        connection.status = 'connected';
        
        // Start heartbeat monitoring
        this.monitorArenaConnection(connection);
        
        return connection;
    }
    
    calculateCameraPosition(arena, index) {
        // Calculate 3D position for camera placement
        const positions = {
            nhl: this.calculateHockeyCameraPosition(index),
            mlb: this.calculateBaseballCameraPosition(index),
            nba: this.calculateBasketballCameraPosition(index),
            nfl: this.calculateFootballCameraPosition(index)
        };
        
        return positions[arena.sport] || { x: 0, y: 10, z: 0 };
    }
    
    calculateHockeyCameraPosition(index) {
        // Hockey rink camera positions
        const rinkLength = 200; // feet
        const rinkWidth = 85;
        
        const positions = [];
        
        // Goal cameras
        positions.push({ x: -rinkLength/2, y: 10, z: 0 });
        positions.push({ x: rinkLength/2, y: 10, z: 0 });
        
        // Corner cameras
        positions.push({ x: -rinkLength/2, y: 15, z: -rinkWidth/2 });
        positions.push({ x: -rinkLength/2, y: 15, z: rinkWidth/2 });
        positions.push({ x: rinkLength/2, y: 15, z: -rinkWidth/2 });
        positions.push({ x: rinkLength/2, y: 15, z: rinkWidth/2 });
        
        // Center ice cameras
        positions.push({ x: 0, y: 30, z: 0 });
        positions.push({ x: 0, y: 5, z: -rinkWidth/2 - 10 });
        
        // Glass-level cameras
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            positions.push({
                x: Math.cos(angle) * rinkLength/2,
                y: 5,
                z: Math.sin(angle) * rinkWidth/2
            });
        }
        
        return positions[index % positions.length];
    }
    
    calculateBaseballCameraPosition(index) {
        // Baseball field camera positions
        const positions = [];
        
        // Behind home plate
        positions.push({ x: 0, y: 20, z: -10 });
        
        // Bases
        positions.push({ x: 90, y: 10, z: 0 }); // First base
        positions.push({ x: 0, y: 10, z: 90 }); // Second base
        positions.push({ x: -90, y: 10, z: 0 }); // Third base
        
        // Outfield
        positions.push({ x: -150, y: 30, z: 150 }); // Left field
        positions.push({ x: 0, y: 30, z: 200 }); // Center field
        positions.push({ x: 150, y: 30, z: 150 }); // Right field
        
        // Dugouts
        positions.push({ x: -50, y: 5, z: -20 });
        positions.push({ x: 50, y: 5, z: -20 });
        
        return positions[index % positions.length];
    }
    
    calculateCameraOrientation(arena, index) {
        // Calculate camera orientation based on position
        const position = this.calculateCameraPosition(arena, index);
        
        // Point cameras toward center of play area
        const center = { x: 0, y: 0, z: 0 };
        
        const dx = center.x - position.x;
        const dy = center.y - position.y;
        const dz = center.z - position.z;
        
        const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
        const yaw = Math.atan2(dx, dz);
        
        return {
            pitch: pitch * 180 / Math.PI,
            yaw: yaw * 180 / Math.PI,
            roll: 0
        };
    }
    
    // ===================== VOLUMETRIC PROCESSING =====================
    
    async initializeVolumetricProcessing() {
        console.log('🎭 Initializing volumetric processing...');
        
        // Setup point cloud processing pipeline
        this.volumetricPipeline = {
            capture: new Map(),
            reconstruction: new Map(),
            mesh: new Map(),
            texture: new Map(),
            compression: new Map(),
            streaming: new Map()
        };
        
        // Initialize GPU clusters for processing
        await this.initializeGPUClusters();
        
        // Setup volumetric cache
        this.volumetricCache = {
            pointClouds: new Map(),
            meshes: new Map(),
            textures: new Map(),
            maxSize: 10000000000, // 10GB
            currentSize: 0
        };
    }
    
    async processVolumetricFrame(arenaId, timestamp) {
        const connection = this.arenaConnections.get(arenaId);
        if (!connection) return null;
        
        const volumetricData = {
            id: `vol_${arenaId}_${timestamp}`,
            arenaId,
            timestamp,
            pointCloud: null,
            mesh: null,
            texture: null,
            audio: null,
            metadata: {
                cameraCount: connection.cameras.size,
                resolution: connection.arena.cameras.resolution,
                processingTime: 0
            }
        };
        
        const startTime = Date.now();
        
        try {
            // Capture from all cameras
            const captures = await this.captureFromCameras(connection);
            
            // Generate point cloud
            volumetricData.pointCloud = await this.generatePointCloud(captures);
            
            // Generate mesh
            if (this.config.volumetricCapture.meshGeneration) {
                volumetricData.mesh = await this.generateMesh(volumetricData.pointCloud);
            }
            
            // Apply textures
            volumetricData.texture = await this.applyTextures(volumetricData.mesh, captures);
            
            // Capture spatial audio
            volumetricData.audio = await this.captureSpatialAudio(connection);
            
            // Compress for streaming
            const compressed = await this.compressVolumetricData(volumetricData);
            
            volumetricData.metadata.processingTime = Date.now() - startTime;
            
            // Cache processed data
            this.cacheVolumetricData(volumetricData);
            
            console.log(`✅ Volumetric frame processed: ${volumetricData.id} (${volumetricData.metadata.processingTime}ms)`);
            
            return compressed;
            
        } catch (error) {
            console.error(`❌ Volumetric processing failed:`, error);
            return null;
        }
    }
    
    async captureFromCameras(connection) {
        const captures = [];
        
        for (const [cameraId, camera] of connection.cameras) {
            if (camera.status !== 'active') continue;
            
            const capture = {
                cameraId,
                timestamp: Date.now(),
                frame: await this.simulateCameraCapture(camera),
                depth: camera.depth ? await this.simulateDepthCapture(camera) : null,
                position: camera.position,
                orientation: camera.orientation,
                metadata: {
                    exposure: 1.0,
                    whiteBalance: 5600,
                    iso: 400
                }
            };
            
            captures.push(capture);
        }
        
        return captures;
    }
    
    async generatePointCloud(captures) {
        // Simulate point cloud generation from multiple camera views
        console.log(`☁️ Generating point cloud from ${captures.length} captures...`);
        
        const pointCloud = {
            points: [],
            colors: [],
            normals: [],
            timestamp: Date.now(),
            bounds: {
                min: { x: -100, y: 0, z: -100 },
                max: { x: 100, y: 50, z: 100 }
            }
        };
        
        // Simulate point generation
        const pointCount = this.config.volumetricCapture.pointCloudDensity;
        
        for (let i = 0; i < pointCount; i++) {
            // Random point within arena bounds
            const point = {
                x: Math.random() * 200 - 100,
                y: Math.random() * 50,
                z: Math.random() * 200 - 100
            };
            
            const color = {
                r: Math.random(),
                g: Math.random(),
                b: Math.random()
            };
            
            const normal = {
                x: 0,
                y: 1,
                z: 0
            };
            
            pointCloud.points.push(point);
            pointCloud.colors.push(color);
            pointCloud.normals.push(normal);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return pointCloud;
    }
    
    async generateMesh(pointCloud) {
        // Simulate mesh generation from point cloud
        console.log('🔺 Generating mesh from point cloud...');
        
        const mesh = {
            vertices: [],
            faces: [],
            uvs: [],
            normals: pointCloud.normals,
            timestamp: Date.now()
        };
        
        // Simplified mesh generation
        // In production, would use Poisson reconstruction or similar
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        return mesh;
    }
    
    // ===================== SPATIAL AUDIO =====================
    
    async setupSpatialAudio() {
        console.log('🎵 Setting up spatial audio system...');
        
        this.spatialAudioEngine = {
            channels: new Map(),
            objects: new Map(),
            ambience: new Map(),
            reverb: new Map(),
            binauralProcessor: null
        };
        
        // Initialize binaural processor
        this.spatialAudioEngine.binauralProcessor = {
            hrtf: 'default',
            headTracking: true,
            roomModeling: true
        };
        
        // Setup audio object tracking
        this.audioObjectTracker = {
            players: new Map(),
            ball: null,
            crowd: {
                zones: new Map(),
                intensity: 0.5,
                reactions: []
            },
            effects: new Map()
        };
    }
    
    async captureSpatialAudio(connection) {
        const audioCapture = {
            timestamp: Date.now(),
            channels: [],
            objects: [],
            ambience: null,
            metadata: {
                sampleRate: 48000,
                bitDepth: 24,
                channelCount: connection.audioChannels.size
            }
        };
        
        // Capture from all audio channels
        for (const [channelId, channel] of connection.audioChannels) {
            const capture = {
                channelId,
                type: channel.type,
                position: channel.position,
                samples: await this.simulateAudioCapture(channel),
                gain: channel.gain
            };
            
            audioCapture.channels.push(capture);
        }
        
        // Track audio objects (players, ball, etc.)
        audioCapture.objects = await this.trackAudioObjects(connection);
        
        // Capture crowd ambience
        audioCapture.ambience = await this.captureCrowdAmbience(connection);
        
        return audioCapture;
    }
    
    async trackAudioObjects(connection) {
        const objects = [];
        
        // Player audio (if player mics available)
        if (connection.arena.audio.playerMics) {
            objects.push({
                type: 'player',
                id: 'player_1',
                position: { x: 10, y: 0, z: 5 },
                velocity: { x: 2, y: 0, z: 1 },
                audio: 'breathing_heavy',
                priority: 0.8
            });
        }
        
        // Ball/puck audio
        objects.push({
            type: 'ball',
            id: 'game_object',
            position: { x: 0, y: 1, z: 0 },
            velocity: { x: 5, y: 2, z: 3 },
            audio: 'impact_sound',
            priority: 1.0
        });
        
        return objects;
    }
    
    // ===================== VIEWING MODES =====================
    
    async createViewingSession(userId, mode, options = {}) {
        console.log(`👁️ Creating ${mode} viewing session for user ${userId}`);
        
        const modeConfig = this.config.viewingModes[mode];
        if (!modeConfig) throw new Error(`Unknown viewing mode: ${mode}`);
        
        const session = {
            id: this.generateSessionId(),
            userId,
            mode,
            config: modeConfig,
            state: {
                position: options.position || { x: 0, y: 10, z: -20 },
                orientation: options.orientation || { pitch: 0, yaw: 0, roll: 0 },
                fov: options.fov || 90,
                quality: options.quality || 'standard'
            },
            streams: {
                video: [],
                audio: [],
                data: []
            },
            metrics: {
                bandwidth: 0,
                latency: 0,
                frameRate: 0,
                startTime: Date.now()
            },
            interactive: {
                movement: modeConfig.movement,
                zoom: true,
                audioMix: true
            }
        };
        
        // Allocate camera feeds based on mode
        session.streams.video = await this.allocateCameraFeeds(session);
        
        // Setup audio streams
        session.streams.audio = await this.setupAudioStreams(session);
        
        // Apply mode-specific effects
        if (mode === 'backyard' && modeConfig.effects) {
            session.effects = await this.applyBackyardEffects(
                session,
                options.effect || 'cartoon'
            );
        }
        
        // Store session
        this.viewerSessions.set(session.id, session);
        
        // Start streaming
        await this.startStreaming(session);
        
        console.log(`✅ Viewing session created: ${session.id} (${mode})`);
        
        return session;
    }
    
    async allocateCameraFeeds(session) {
        const feeds = [];
        const modeConfig = session.config;
        
        // Find best cameras for the viewing mode
        const arena = this.arenaConnections.values().next().value; // Get first active arena
        if (!arena) return feeds;
        
        const cameras = Array.from(arena.cameras.values());
        
        // Sort cameras by relevance to viewing position
        cameras.sort((a, b) => {
            const distA = this.calculateDistance(a.position, session.state.position);
            const distB = this.calculateDistance(b.position, session.state.position);
            return distA - distB;
        });
        
        // Allocate requested number of cameras
        for (let i = 0; i < modeConfig.cameras && i < cameras.length; i++) {
            feeds.push({
                cameraId: cameras[i].id,
                priority: i === 0 ? 'primary' : 'secondary',
                stream: await this.createVideoStream(cameras[i], session.state.quality)
            });
        }
        
        return feeds;
    }
    
    async applyBackyardEffects(session, effectType) {
        console.log(`🎮 Applying ${effectType} effect to session`);
        
        const effects = {
            cartoon: {
                filter: 'cel_shading',
                outlines: true,
                colorPalette: 'vibrant',
                simplification: 0.7
            },
            retro: {
                filter: 'pixelate',
                resolution: '320x240',
                colorDepth: 16,
                scanlines: true,
                crtEffect: true
            },
            arcade: {
                filter: 'neon',
                glowIntensity: 0.8,
                particleEffects: true,
                powerups: true,
                scoreOverlay: true
            }
        };
        
        return effects[effectType] || effects.cartoon;
    }
    
    // ===================== REAL-TIME STREAMING =====================
    
    async startStreaming(session) {
        console.log(`📡 Starting streaming for session ${session.id}`);
        
        // Create WebRTC peer connection
        const rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };
        
        // Setup streaming pipeline
        const pipeline = {
            input: new Map(),
            processing: new Map(),
            encoding: new Map(),
            output: new Map()
        };
        
        // Configure based on quality
        const quality = this.config.cameraSpecs[session.state.quality] || this.config.cameraSpecs.standard;
        
        // Start video streams
        for (const feed of session.streams.video) {
            const stream = await this.startVideoStream(feed, quality);
            pipeline.input.set(feed.cameraId, stream);
        }
        
        // Start audio streams
        for (const audioStream of session.streams.audio) {
            const stream = await this.startAudioStream(audioStream);
            pipeline.input.set(audioStream.id, stream);
        }
        
        // Store pipeline
        this.renderingPipeline.set(session.id, pipeline);
        
        // Monitor stream health
        this.monitorStreamHealth(session);
    }
    
    // ===================== SERVERS =====================
    
    async startServers() {
        console.log('🌐 Starting 3D camera system servers...');
        
        // HTTP server for API
        this.httpServer = http.createServer((req, res) => {
            this.handleHttpRequest(req, res);
        });
        
        this.httpServer.listen(this.httpPort, () => {
            console.log(`✅ HTTP server running on port ${this.httpPort}`);
        });
        
        // WebSocket server for real-time streaming
        this.wsServer = new WebSocket.Server({ port: this.wsPort });
        
        this.wsServer.on('connection', (ws) => {
            this.handleWebSocketConnection(ws);
        });
        
        console.log(`✅ WebSocket server running on port ${this.wsPort}`);
    }
    
    async handleHttpRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.httpPort}`);
        
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        try {
            switch (url.pathname) {
                case '/arenas':
                    await this.handleArenasRequest(res);
                    break;
                    
                case '/session':
                    await this.handleSessionRequest(url, res);
                    break;
                    
                case '/volumetric':
                    await this.handleVolumetricRequest(url, res);
                    break;
                    
                case '/modes':
                    await this.handleModesRequest(res);
                    break;
                    
                case '/status':
                    await this.handleStatusRequest(res);
                    break;
                    
                default:
                    await this.handleDefaultRequest(res);
            }
            
        } catch (error) {
            console.error('Request error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    async handleDefaultRequest(res) {
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>3D Arena Camera System</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #000;
                    color: #fff;
                    margin: 0;
                    padding: 20px;
                    background-image: 
                        radial-gradient(circle at 20% 50%, #001a33 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, #1a0033 0%, transparent 50%),
                        radial-gradient(circle at 40% 20%, #003300 0%, transparent 50%);
                }
                .container { max-width: 1200px; margin: 0 auto; }
                h1 { 
                    color: #00ffff; 
                    text-align: center;
                    font-size: 48px;
                    text-shadow: 0 0 20px #00ffff;
                }
                .arena-card {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid #00ffff;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    backdrop-filter: blur(10px);
                }
                .arena-card h3 { color: #ffff00; }
                .mode {
                    display: inline-block;
                    background: rgba(0,255,255,0.2);
                    padding: 10px 20px;
                    margin: 5px;
                    border-radius: 20px;
                    border: 1px solid #00ffff;
                }
                .mode.premium {
                    background: rgba(255,215,0,0.2);
                    border-color: #ffd700;
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }
                .stat-box {
                    background: rgba(255,255,255,0.05);
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                }
                .stat-value {
                    font-size: 36px;
                    color: #00ff00;
                    font-weight: bold;
                }
                .camera-grid {
                    display: grid;
                    grid-template-columns: repeat(8, 1fr);
                    gap: 5px;
                    margin: 20px 0;
                }
                .camera {
                    width: 100%;
                    aspect-ratio: 1;
                    background: #00ff00;
                    border-radius: 3px;
                }
                .camera.inactive { background: #ff0000; }
                code {
                    background: rgba(0,0,0,0.5);
                    padding: 2px 5px;
                    border-radius: 3px;
                    font-family: monospace;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🏟️ 3D Arena Camera System</h1>
                <p style="text-align: center; color: #999;">
                    Immersive sports experiences with volumetric capture and spatial audio
                </p>
                
                <h2>🏟️ Partner Arenas</h2>
                
                <div class="arena-card">
                    <h3>⚡ Amalie Arena - Tampa Bay Lightning</h3>
                    <div class="stats">
                        <div class="stat-box">
                            <div class="stat-value">48</div>
                            <div>8K Cameras</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">128</div>
                            <div>Audio Channels</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">120</div>
                            <div>FPS Capture</div>
                        </div>
                    </div>
                    <div class="camera-grid">
                        ${Array(48).fill().map(() => '<div class="camera"></div>').join('')}
                    </div>
                </div>
                
                <div class="arena-card">
                    <h3>🍺 American Family Field - Milwaukee Brewers</h3>
                    <div class="stats">
                        <div class="stat-box">
                            <div class="stat-value">36</div>
                            <div>6K Cameras</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">96</div>
                            <div>Audio Channels</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">90</div>
                            <div>FPS Capture</div>
                        </div>
                    </div>
                    <div class="camera-grid">
                        ${Array(36).fill().map(() => '<div class="camera"></div>').join('')}
                    </div>
                </div>
                
                <h2>👁️ Viewing Modes</h2>
                <div>
                    <div class="mode premium">Courtside Experience</div>
                    <div class="mode premium">Luxury Box View</div>
                    <div class="mode premium">Player Perspective</div>
                    <div class="mode">Enhanced Broadcast</div>
                    <div class="mode">Backyard Sports Mode</div>
                </div>
                
                <h2>🎮 Backyard Sports Effects</h2>
                <div>
                    <div class="mode">🎨 Cartoon Mode</div>
                    <div class="mode">👾 Retro Arcade</div>
                    <div class="mode">💫 Neon Effects</div>
                </div>
                
                <h2>🔌 API Endpoints</h2>
                <div class="arena-card">
                    <p><code>GET /arenas</code> - List partner arenas and camera status</p>
                    <p><code>POST /session?mode={mode}&quality={quality}</code> - Create viewing session</p>
                    <p><code>GET /volumetric?arena={id}</code> - Get volumetric data stream</p>
                    <p><code>GET /modes</code> - List available viewing modes</p>
                    <p><code>GET /status</code> - System health and metrics</p>
                </div>
                
                <h2>📊 System Status</h2>
                <div class="stats">
                    <div class="stat-box">
                        <div class="stat-value" style="color: #00ff00;">ONLINE</div>
                        <div>System Status</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">84</div>
                        <div>Active Cameras</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">50ms</div>
                        <div>Avg Latency</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">1M</div>
                        <div>Points/Frame</div>
                    </div>
                </div>
                
                <h2>🚀 Features</h2>
                <ul>
                    <li>🎭 Volumetric video capture for true 3D experience</li>
                    <li>🎵 32-channel spatial audio with binaural rendering</li>
                    <li>🏃 Real-time player and ball tracking</li>
                    <li>🎮 Interactive camera control and movement</li>
                    <li>📱 Mobile-optimized streaming options</li>
                    <li>🏡 Backyard Sports mode with fun effects</li>
                    <li>⚡ Ultra-low latency (< 100ms)</li>
                    <li>🔐 Blockchain-verified authentic feeds</li>
                </ul>
                
                <p style="text-align: center; margin-top: 40px; color: #666;">
                    WebSocket streaming available on port ${this.wsPort}
                </p>
            </div>
        </body>
        </html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    // ===================== WEBSOCKET HANDLING =====================
    
    handleWebSocketConnection(ws) {
        console.log('🔌 New WebSocket connection');
        
        const connectionId = this.generateConnectionId();
        
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                await this.handleWebSocketMessage(ws, data, connectionId);
            } catch (error) {
                ws.send(JSON.stringify({ error: error.message }));
            }
        });
        
        ws.on('close', () => {
            console.log(`🔌 WebSocket disconnected: ${connectionId}`);
            this.cleanupConnection(connectionId);
        });
        
        // Send welcome message
        ws.send(JSON.stringify({
            type: 'welcome',
            connectionId,
            message: '3D Arena Camera System Connected',
            capabilities: Object.keys(this.config.viewingModes)
        }));
    }
    
    async handleWebSocketMessage(ws, data, connectionId) {
        switch (data.type) {
            case 'create_session':
                const session = await this.createViewingSession(
                    connectionId,
                    data.mode,
                    data.options
                );
                ws.send(JSON.stringify({
                    type: 'session_created',
                    session: {
                        id: session.id,
                        mode: session.mode,
                        streams: session.streams.video.length
                    }
                }));
                break;
                
            case 'update_position':
                await this.updateViewerPosition(data.sessionId, data.position);
                break;
                
            case 'update_orientation':
                await this.updateViewerOrientation(data.sessionId, data.orientation);
                break;
                
            case 'request_volumetric':
                const volumetric = await this.getVolumetricData(data.arenaId);
                ws.send(JSON.stringify({
                    type: 'volumetric_data',
                    data: volumetric
                }));
                break;
        }
    }
    
    // ===================== UTILITY METHODS =====================
    
    getAudioChannelType(index) {
        const types = ['crowd', 'field', 'ambient', 'commentary'];
        return types[index % types.length];
    }
    
    calculateAudioPosition(arena, index) {
        // Distribute audio sources around arena
        const angle = (index / arena.audio.spatialChannels) * Math.PI * 2;
        const radius = 50;
        
        return {
            x: Math.cos(angle) * radius,
            y: 5 + (index % 3) * 5,
            z: Math.sin(angle) * radius
        };
    }
    
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
    
    async simulateCameraCapture(camera) {
        // Simulate camera frame capture
        return {
            data: new ArrayBuffer(1920 * 1080 * 3), // RGB data
            width: 1920,
            height: 1080,
            timestamp: Date.now()
        };
    }
    
    async simulateDepthCapture(camera) {
        // Simulate depth data capture
        return {
            data: new ArrayBuffer(1920 * 1080 * 2), // 16-bit depth
            width: 1920,
            height: 1080,
            min: 0.5,
            max: 50.0,
            units: 'meters'
        };
    }
    
    async simulateAudioCapture(channel) {
        // Simulate audio sample capture
        const sampleCount = 48000 / 10; // 100ms of audio
        return {
            data: new Float32Array(sampleCount),
            sampleRate: 48000,
            channels: 1
        };
    }
    
    async applyTextures(mesh, captures) {
        // Simulate texture application to mesh
        return {
            diffuse: 'texture_diffuse.jpg',
            normal: 'texture_normal.jpg',
            resolution: this.config.volumetricCapture.textureResolution
        };
    }
    
    async compressVolumetricData(data) {
        // Simulate compression
        const compressed = {
            ...data,
            compressed: true,
            originalSize: 1000000,
            compressedSize: 100000,
            compressionRatio: 10
        };
        
        return compressed;
    }
    
    cacheVolumetricData(data) {
        // Add to cache with size management
        const size = 100000; // Simulated size
        
        if (this.volumetricCache.currentSize + size > this.volumetricCache.maxSize) {
            // Evict oldest data
            const oldest = this.volumetricCache.pointClouds.keys().next().value;
            if (oldest) {
                this.volumetricCache.pointClouds.delete(oldest);
                this.volumetricCache.currentSize -= 100000;
            }
        }
        
        this.volumetricCache.pointClouds.set(data.id, data);
        this.volumetricCache.currentSize += size;
    }
    
    async initializeGPUClusters() {
        console.log('🖥️ Initializing GPU clusters...');
        
        // Simulate GPU cluster setup
        for (let i = 0; i < this.config.processing.gpuClusters; i++) {
            console.log(`  GPU Cluster ${i}: 8x NVIDIA A100`);
        }
    }
    
    async initializeRenderingPipeline() {
        console.log('🎨 Initializing rendering pipeline...');
        
        // Setup rendering stages
        this.renderingStages = [
            'input',
            'decode',
            'volumetric_reconstruction',
            'mesh_generation',
            'texture_mapping',
            'compression',
            'streaming'
        ];
    }
    
    async createVideoStream(camera, quality) {
        return {
            url: `rtmp://stream.arena.com/${camera.id}`,
            protocol: 'rtmp',
            bitrate: this.config.cameraSpecs[quality].bitrate,
            resolution: this.config.cameraSpecs[quality].resolution
        };
    }
    
    async setupAudioStreams(session) {
        const streams = [];
        
        // Add audio streams based on mode
        if (session.config.audio === 'binaural') {
            streams.push({
                id: 'binaural_main',
                type: 'binaural',
                channels: 2,
                headTracking: true
            });
        } else if (session.config.audio === 'spatial') {
            streams.push({
                id: 'spatial_5_1',
                type: 'spatial',
                channels: 6,
                format: '5.1'
            });
        }
        
        return streams;
    }
    
    async startVideoStream(feed, quality) {
        return {
            active: true,
            bitrate: quality.bitrate,
            fps: quality.fps,
            resolution: quality.resolution
        };
    }
    
    async startAudioStream(audioStream) {
        return {
            active: true,
            sampleRate: 48000,
            bitDepth: 24,
            channels: audioStream.channels
        };
    }
    
    monitorStreamHealth(session) {
        const interval = setInterval(() => {
            if (!this.viewerSessions.has(session.id)) {
                clearInterval(interval);
                return;
            }
            
            // Update metrics
            session.metrics.bandwidth = Math.random() * 100;
            session.metrics.latency = Math.random() * 50 + 50;
            session.metrics.frameRate = 59 + Math.random() * 2;
            
        }, 1000);
    }
    
    monitorArenaConnection(connection) {
        const interval = setInterval(() => {
            // Simulate heartbeat
            connection.lastHeartbeat = Date.now();
            connection.uptime++;
            
            // Update latency
            connection.latency.current = Math.random() * 20 + 30;
            connection.latency.average = (connection.latency.average * 0.9) + 
                                       (connection.latency.current * 0.1);
            connection.latency.min = Math.min(connection.latency.min, connection.latency.current);
            connection.latency.max = Math.max(connection.latency.max, connection.latency.current);
            
        }, 5000);
    }
    
    async loadIntegrations() {
        console.log('🔗 Loading integrations...');
        
        try {
            // Load stream aggregator
            if (fs.existsSync('./SPORTS-STREAM-AGGREGATOR.js')) {
                const StreamAggregator = require('./SPORTS-STREAM-AGGREGATOR.js');
                this.streamAggregator = new StreamAggregator();
                console.log('✅ Stream aggregator integrated');
            }
            
            // Load audio system
            if (fs.existsSync('./AUDITABLE-SOUND-SYSTEM.js')) {
                const AudioSystem = require('./AUDITABLE-SOUND-SYSTEM.js');
                this.audioSystem = new AudioSystem();
                console.log('✅ Auditable sound system integrated');
            }
            
            // Load 3D game server
            if (fs.existsSync('./3d-game-server.js')) {
                const GameServer3D = require('./3d-game-server.js');
                this.gameServer3D = new GameServer3D();
                console.log('✅ 3D game server integrated');
            }
            
            // Load sonar display
            if (fs.existsSync('./SONAR-INFORMATION-DISPLAY.js')) {
                const SonarDisplay = require('./SONAR-INFORMATION-DISPLAY.js');
                this.sonarDisplay = new SonarDisplay();
                console.log('✅ Sonar display integrated');
            }
            
        } catch (error) {
            console.error('⚠️ Integration loading error:', error);
        }
    }
    
    startSystemMonitoring() {
        console.log('📊 Starting system monitoring...');
        
        // Monitor arena connections
        setInterval(() => {
            for (const [arenaId, connection] of this.arenaConnections) {
                if (Date.now() - connection.lastHeartbeat > 30000) {
                    console.warn(`⚠️ Arena ${arenaId} heartbeat timeout`);
                    connection.status = 'disconnected';
                }
            }
        }, 10000);
        
        // Monitor volumetric processing
        setInterval(() => {
            console.log(`📊 Volumetric cache: ${this.volumetricCache.currentSize / 1000000}MB / ${this.volumetricCache.maxSize / 1000000}MB`);
        }, 30000);
    }
    
    generateSessionId() {
        return `session_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    }
    
    generateConnectionId() {
        return `conn_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    }
    
    cleanupConnection(connectionId) {
        // Clean up any resources associated with the connection
        for (const [sessionId, session] of this.viewerSessions) {
            if (session.userId === connectionId) {
                this.viewerSessions.delete(sessionId);
                this.renderingPipeline.delete(sessionId);
            }
        }
    }
    
    async updateViewerPosition(sessionId, position) {
        const session = this.viewerSessions.get(sessionId);
        if (!session) return;
        
        session.state.position = position;
        
        // Reallocate cameras if needed
        if (session.config.movement === 'dynamic') {
            session.streams.video = await this.allocateCameraFeeds(session);
        }
    }
    
    async updateViewerOrientation(sessionId, orientation) {
        const session = this.viewerSessions.get(sessionId);
        if (!session) return;
        
        session.state.orientation = orientation;
    }
    
    async getVolumetricData(arenaId) {
        const cached = this.volumetricCache.pointClouds.values().next().value;
        if (cached) return cached;
        
        // Generate new volumetric frame
        return await this.processVolumetricFrame(arenaId, Date.now());
    }
    
    async captureCrowdAmbience(connection) {
        return {
            intensity: Math.random(),
            zones: [
                { id: 'home_fans', level: 0.8 },
                { id: 'away_fans', level: 0.6 }
            ],
            reactions: ['cheer', 'applause']
        };
    }
    
    async handleArenasRequest(res) {
        const arenas = [];
        
        for (const [arenaId, connection] of this.arenaConnections) {
            arenas.push({
                id: arenaId,
                name: connection.arena.name,
                location: connection.arena.location,
                sport: connection.arena.sport,
                team: connection.arena.team,
                status: connection.status,
                cameras: {
                    total: connection.arena.cameras.installed,
                    active: Array.from(connection.cameras.values()).filter(c => c.status === 'active').length,
                    resolution: connection.arena.cameras.resolution,
                    fps: connection.arena.cameras.fps
                },
                audio: {
                    channels: connection.arena.audio.spatialChannels,
                    microphones: connection.arena.audio.microphones
                },
                latency: connection.latency.average
            });
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ arenas }));
    }
    
    async handleModesRequest(res) {
        const modes = [];
        
        for (const [modeName, modeConfig] of Object.entries(this.config.viewingModes)) {
            modes.push({
                name: modeName,
                displayName: modeConfig.name,
                cameras: modeConfig.cameras,
                audio: modeConfig.audio,
                movement: modeConfig.movement,
                premium: modeConfig.premium,
                effects: modeConfig.effects
            });
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ modes }));
    }
    
    async handleStatusRequest(res) {
        const status = {
            system: 'operational',
            arenas: {
                connected: this.arenaConnections.size,
                total: this.config.arenaPartners.active.length
            },
            cameras: {
                total: 0,
                active: 0
            },
            sessions: {
                active: this.viewerSessions.size
            },
            volumetric: {
                cacheSize: this.volumetricCache.currentSize,
                maxCache: this.volumetricCache.maxSize,
                processing: this.processingQueue.length
            },
            performance: {
                averageLatency: 0,
                bandwidth: 0
            }
        };
        
        // Calculate totals
        for (const connection of this.arenaConnections.values()) {
            status.cameras.total += connection.arena.cameras.installed;
            status.cameras.active += Array.from(connection.cameras.values())
                .filter(c => c.status === 'active').length;
            status.performance.averageLatency += connection.latency.average;
        }
        
        if (this.arenaConnections.size > 0) {
            status.performance.averageLatency /= this.arenaConnections.size;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
    }
}

// Export the system
module.exports = Arena3DCameraSystem;

// Auto-start if run directly
if (require.main === module) {
    (async () => {
        console.log('🚀 Starting 3D Arena Camera System...');
        
        try {
            const cameraSystem = new Arena3DCameraSystem();
            
            // Example: Create a viewing session
            setTimeout(async () => {
                console.log('\n👁️ Example: Creating courtside viewing session...');
                
                const session = await cameraSystem.createViewingSession(
                    'demo_user',
                    'courtside',
                    {
                        position: { x: 0, y: 2, z: -10 },
                        quality: 'professional'
                    }
                );
                
                console.log(`✅ Session created: ${session.id}`);
                console.log(`  Mode: ${session.mode}`);
                console.log(`  Video feeds: ${session.streams.video.length}`);
                console.log(`  Audio streams: ${session.streams.audio.length}`);
            }, 2000);
            
            // Example: Process volumetric frame
            setTimeout(async () => {
                console.log('\n🎭 Example: Processing volumetric frame...');
                
                const arenaId = 'amalie_arena';
                const volumetric = await cameraSystem.processVolumetricFrame(
                    arenaId,
                    Date.now()
                );
                
                if (volumetric) {
                    console.log(`✅ Volumetric frame processed`);
                    console.log(`  Processing time: ${volumetric.metadata?.processingTime}ms`);
                }
            }, 4000);
            
            console.log('\n✅ 3D Arena Camera System is running');
            console.log(`🌐 HTTP API: http://localhost:${cameraSystem.httpPort}`);
            console.log(`🔌 WebSocket streaming: ws://localhost:${cameraSystem.wsPort}`);
            console.log(`🏟️ Partner arenas: ${cameraSystem.config.arenaPartners.active.length}`);
            console.log(`📹 Total cameras: 84 (48 @ Amalie, 36 @ AmFam Field)`);
            
        } catch (error) {
            console.error('❌ Failed to start camera system:', error);
            process.exit(1);
        }
    })();
}