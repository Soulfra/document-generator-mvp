#!/usr/bin/env node

/**
 * 🎬🔊🎵 MOVIE STYLE SOUND EFFECTS 🎵🔊🎬
 * 
 * Epic cinematic audio system that transforms your crypto trading
 * interface into a Hollywood blockbuster experience. Dynamic sound
 * effects, orchestral music, and voice guidance create an immersive
 * billion dollar game atmosphere.
 * 
 * Features:
 * - Real-time sound effects for all trading actions
 * - Epic orchestral soundtrack with dynamic intensity
 * - Voice narration and coaching guidance  
 * - Spatial 3D audio positioning
 * - Adaptive music based on market conditions
 * - Boss battle theme music and effects
 * - Achievement fanfares and victory sounds
 * - Multi-language support for global appeal
 * 
 * @author Document Generator System  
 * @version 6.0.0 - HOLLYWOOD BLOCKBUSTER EDITION
 */

const { EventEmitter } = require('events');
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class MovieStyleSoundEffects extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 3341,
            wsPort: options.wsPort || 3342,
            enableVoiceNarration: options.enableVoiceNarration !== false,
            enableSpatialAudio: options.enableSpatialAudio !== false,
            enableDynamicMusic: options.enableDynamicMusic !== false,
            masterVolume: options.masterVolume || 0.7,
            musicVolume: options.musicVolume || 0.5,
            effectsVolume: options.effectsVolume || 0.8,
            voiceVolume: options.voiceVolume || 0.9,
            audioDir: options.audioDir || './movie-audio'
        };
        
        // Audio state
        this.currentMusic = null;
        this.musicIntensity = 0.5; // 0.0 to 1.0
        this.audioQueue = [];
        this.activeEffects = new Map();
        this.voiceQueue = [];
        this.spatialSources = new Map();
        
        // WebSocket connections
        this.wss = null;
        this.clients = new Set();
        
        // Sound effect library
        this.soundLibrary = {
            // Trading sounds
            orderPlaced: {
                files: ['order-placed-1.mp3', 'order-placed-2.mp3', 'order-placed-3.mp3'],
                volume: 0.6,
                category: 'trading'
            },
            orderFilled: {
                files: ['order-filled-epic.mp3', 'order-filled-victory.mp3'],
                volume: 0.8,
                category: 'trading'
            },
            tradeProfitable: {
                files: ['profit-victory.mp3', 'cash-register-epic.mp3', 'money-rain.mp3'],
                volume: 0.9,
                category: 'success'
            },
            tradeLoss: {
                files: ['loss-dramatic.mp3', 'sad-trombone-epic.mp3'],
                volume: 0.7,
                category: 'failure'
            },
            
            // Burn effects
            burnDetected: {
                files: ['fire-ignition.mp3', 'burn-explosion.mp3', 'phoenix-rise.mp3'],
                volume: 0.9,
                category: 'burn'
            },
            epicBurn: {
                files: ['epic-burn-orchestral.mp3', 'dragon-roar.mp3'],
                volume: 1.0,
                category: 'epic'
            },
            insaneBurn: {
                files: ['insane-burn-symphony.mp3', 'world-ending.mp3'],
                volume: 1.0,
                category: 'legendary'
            },
            
            // Coaching sounds
            coachingTip: {
                files: ['wisdom-chime.mp3', 'mentor-bell.mp3', 'guidance-tone.mp3'],
                volume: 0.5,
                category: 'coaching'
            },
            achievement: {
                files: ['achievement-fanfare.mp3', 'level-up-epic.mp3', 'victory-horn.mp3'],
                volume: 0.9,
                category: 'achievement'
            },
            levelUp: {
                files: ['level-up-orchestral.mp3', 'power-up-epic.mp3'],
                volume: 1.0,
                category: 'achievement'
            },
            
            // Boss battle sounds
            bossSpawn: {
                files: ['boss-spawn-ominous.mp3', 'dragon-awaken.mp3', 'demon-rise.mp3'],
                volume: 1.0,
                category: 'boss'
            },
            bossAttack: {
                files: ['sword-clash.mp3', 'magic-blast.mp3', 'battle-cry.mp3'],
                volume: 0.8,
                category: 'boss'
            },
            bossDefeat: {
                files: ['boss-defeat-epic.mp3', 'victory-orchestral.mp3'],
                volume: 1.0,
                category: 'epic'
            },
            
            // Grand Exchange sounds
            marketOpen: {
                files: ['market-bell.mp3', 'trading-floor-bustle.mp3'],
                volume: 0.7,
                category: 'market'
            },
            priceAlert: {
                files: ['price-alert-chime.mp3', 'notification-elegant.mp3'],
                volume: 0.6,
                category: 'alert'
            },
            
            // System sounds
            connected: {
                files: ['system-online.mp3', 'power-up.mp3'],
                volume: 0.7,
                category: 'system'
            },
            error: {
                files: ['error-dramatic.mp3', 'system-failure.mp3'],
                volume: 0.8,
                category: 'system'
            },
            notification: {
                files: ['elegant-chime.mp3', 'soft-bell.mp3'],
                volume: 0.5,
                category: 'ui'
            }
        };
        
        // Music library with dynamic intensity
        this.musicLibrary = {
            ambient: {
                calm: ['ambient-calm-1.mp3', 'ambient-calm-2.mp3'],
                moderate: ['ambient-moderate-1.mp3', 'ambient-moderate-2.mp3'],
                intense: ['ambient-intense-1.mp3', 'ambient-intense-2.mp3']
            },
            trading: {
                calm: ['trading-calm-orchestral.mp3', 'market-peaceful.mp3'],
                moderate: ['trading-moderate-epic.mp3', 'market-active.mp3'],
                intense: ['trading-intense-battle.mp3', 'market-chaos.mp3']
            },
            boss: {
                calm: ['boss-preparation.mp3'],
                moderate: ['boss-battle-epic.mp3', 'dragon-fight.mp3'],
                intense: ['boss-battle-ultimate.mp3', 'final-battle.mp3']
            },
            victory: {
                calm: ['victory-soft.mp3'],
                moderate: ['victory-epic.mp3'],
                intense: ['victory-legendary.mp3']
            }
        };
        
        // Voice lines for different situations
        this.voiceLines = {
            welcome: [
                "Welcome to the most epic trading experience ever created.",
                "Prepare yourself for billion dollar trading adventures.",
                "The market awaits your legendary trades."
            ],
            orderPlaced: [
                "Order placed. May fortune favor your trade.",
                "Your order enters the battlefield.",
                "The market has received your command."
            ],
            bigProfit: [
                "Exceptional profit achieved! You are becoming legendary.",
                "Outstanding performance! The market bows to your skill.",
                "Incredible gains! Your trading prowess is unmatched."
            ],
            burnDetected: [
                "Burn detected! Tax optimization in progress.",
                "Tokens are being sacrificed to the tax gods.",
                "The fire of optimization burns bright."
            ],
            epicBurn: [
                "EPIC BURN EVENT! The market trembles before your power!",
                "LEGENDARY! This burn will be remembered for ages!",
                "INCREDIBLE! You have achieved trading nirvana!"
            ],
            bossSpawn: [
                "A market boss has appeared! Prepare for battle!",
                "The forces of volatility challenge you!",
                "Epic boss encounter! Show your trading might!"
            ],
            levelUp: [
                "LEVEL UP! Your trading skills have evolved!",
                "Congratulations! You have ascended to new heights!",
                "POWER INCREASE! You are becoming unstoppable!"
            ],
            coaching: [
                "Your mentor has wisdom to share.",
                "Listen carefully to this guidance.",
                "The path to mastery continues."
            ]
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎬 INITIALIZING MOVIE STYLE SOUND EFFECTS...');
        console.log('==============================================');
        
        // Ensure audio directory exists
        await fs.mkdir(this.config.audioDir, { recursive: true });
        
        // Generate sample audio files (in real implementation, these would be actual audio files)
        await this.generateSampleAudioFiles();
        
        // Setup web server
        await this.setupWebServer();
        
        // Setup WebSocket server
        await this.setupWebSocketServer();
        
        // Initialize audio engine
        this.initializeAudioEngine();
        
        // Connect to external systems
        await this.connectExternalSystems();
        
        // Start dynamic music system
        if (this.config.enableDynamicMusic) {
            this.startDynamicMusicSystem();
        }
        
        console.log('🚀 MOVIE STYLE SOUND EFFECTS ARE LIVE!');
        console.log(`🌐 Audio Control Panel: http://localhost:${this.config.port}`);
        console.log(`📡 WebSocket: ws://localhost:${this.config.wsPort}`);
        console.log('🎵 PREPARE FOR AN EPIC AUDIO EXPERIENCE!');
        
        // Play welcome sound
        this.playSound('connected');
        this.playVoiceLine('welcome');
    }
    
    async setupWebServer() {
        console.log('🌐 Setting up sound effects web server...');
        
        this.app = express();
        this.server = http.createServer(this.app);
        
        // Enable CORS and JSON parsing
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
        this.app.use(express.json());
        
        // Serve audio files
        this.app.use('/audio', express.static(this.config.audioDir));
        
        // Serve audio control panel
        this.app.get('/', (req, res) => {
            res.send(this.getAudioControlPanelHTML());
        });
        
        // API endpoints
        this.app.get('/api/audio/status', (req, res) => {
            res.json(this.getAudioStatus());
        });
        
        this.app.post('/api/audio/play', (req, res) => {
            const result = this.playSound(req.body.soundId, req.body.options);
            res.json(result);
        });
        
        this.app.post('/api/audio/music', (req, res) => {
            const result = this.setMusic(req.body.category, req.body.intensity);
            res.json(result);
        });
        
        this.app.post('/api/audio/voice', (req, res) => {
            const result = this.playVoiceLine(req.body.category, req.body.text);
            res.json(result);
        });
        
        this.app.post('/api/audio/volume', (req, res) => {
            const result = this.setVolume(req.body.type, req.body.level);
            res.json(result);
        });
        
        this.server.listen(this.config.port, () => {
            console.log(`✅ Sound Effects Server: LIVE on port ${this.config.port}`);
        });
    }
    
    async setupWebSocketServer() {
        console.log('📡 Setting up sound effects WebSocket...');
        
        this.wss = new WebSocket.Server({ 
            port: this.config.wsPort,
            maxClients: 100
        });
        
        this.wss.on('connection', (ws, req) => {
            console.log(`🔌 Audio client connected (${this.clients.size + 1} total)`);
            
            this.clients.add(ws);
            
            // Send initial audio state
            ws.send(JSON.stringify({
                type: 'audio-connected',
                status: this.getAudioStatus(),
                soundLibrary: Object.keys(this.soundLibrary),
                timestamp: Date.now()
            }));
            
            // Handle messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleAudioMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'audio-error',
                        message: 'Invalid JSON'
                    }));
                }
            });
            
            // Handle disconnect
            ws.on('close', () => {
                this.clients.delete(ws);
                console.log(`🔌 Audio client disconnected (${this.clients.size} remaining)`);
            });
        });
        
        console.log(`✅ Sound Effects WebSocket: LIVE on port ${this.config.wsPort}`);
    }
    
    initializeAudioEngine() {
        console.log('🔊 Initializing audio engine...');
        
        // Audio context state
        this.audioContext = {
            masterGain: this.config.masterVolume,
            musicGain: this.config.musicVolume,
            effectsGain: this.config.effectsVolume,
            voiceGain: this.config.voiceVolume,
            spatialNodes: new Map(),
            currentTrack: null,
            fadeInterval: null
        };
        
        // Audio queue processor
        this.audioQueueProcessor = setInterval(() => {
            this.processAudioQueue();
        }, 100); // Process every 100ms
        
        console.log('✅ Audio Engine: INITIALIZED');
    }
    
    async connectExternalSystems() {
        console.log('🔗 Connecting to external systems for audio triggers...');
        
        const connections = [
            { port: 3334, system: 'Live Ticker Tape', handler: this.handleTickerTapeAudio.bind(this) },
            { port: 3336, system: 'Fire Effects', handler: this.handleFireEffectsAudio.bind(this) },
            { port: 3338, system: 'Coaching System', handler: this.handleCoachingAudio.bind(this) },
            { port: 3340, system: 'Grand Exchange', handler: this.handleExchangeAudio.bind(this) }
        ];
        
        for (const connection of connections) {
            try {
                const ws = new WebSocket(`ws://localhost:${connection.port}`);
                
                ws.on('open', () => {
                    console.log(`🔌 Connected to ${connection.system} for audio triggers`);
                });
                
                ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data);
                        connection.handler(message);
                    } catch (error) {
                        // Ignore parsing errors
                    }
                });
                
                ws.on('close', () => {
                    console.log(`🔌 ${connection.system} audio connection lost, will retry...`);
                    setTimeout(() => this.connectExternalSystems(), 5000);
                });
                
            } catch (error) {
                console.error(`Failed to connect to ${connection.system}:`, error);
            }
        }
    }
    
    handleTickerTapeAudio(message) {
        switch (message.type) {
            case 'order-executed':
                this.playSound('orderFilled');
                if (message.order.value > 10000) {
                    this.playVoiceLine('bigProfit');
                }
                break;
            case 'portfolio-update':
                if (message.change > 5000) {
                    this.playSound('tradeProfitable');
                    this.increaseMusicIntensity(0.2);
                } else if (message.change < -5000) {
                    this.playSound('tradeLoss');
                    this.increaseMusicIntensity(0.1);
                }
                break;
        }
    }
    
    handleFireEffectsAudio(message) {
        switch (message.type) {
            case 'fire-effect-triggered':
                const intensity = message.effect.intensity.level;
                
                if (intensity === 'insane') {
                    this.playSound('insaneBurn');
                    this.playVoiceLine('epicBurn');
                    this.setMusicIntensity(1.0);
                } else if (intensity === 'epic') {
                    this.playSound('epicBurn');
                    this.playVoiceLine('epicBurn');
                    this.setMusicIntensity(0.8);
                } else {
                    this.playSound('burnDetected');
                    this.playVoiceLine('burnDetected');
                    this.increaseMusicIntensity(0.3);
                }
                break;
        }
    }
    
    handleCoachingAudio(message) {
        switch (message.type) {
            case 'coaching-tip':
                this.playSound('coachingTip');
                this.playVoiceLine('coaching');
                break;
            case 'achievement-unlocked':
                this.playSound('achievement');
                this.playVoiceLine('levelUp');
                break;
            case 'level-up':
                this.playSound('levelUp');
                this.playVoiceLine('levelUp');
                break;
        }
    }
    
    handleExchangeAudio(message) {
        switch (message.type) {
            case 'order-result':
                if (message.result.success) {
                    this.playSound('orderPlaced');
                    this.playVoiceLine('orderPlaced');
                } else {
                    this.playSound('error');
                }
                break;
            case 'boss-spawned':
                this.playSound('bossSpawn');
                this.playVoiceLine('bossSpawn');
                this.setMusic('boss', 0.7);
                break;
            case 'boss-defeated':
                this.playSound('bossDefeat');
                this.setMusic('victory', 0.9);
                break;
            case 'trade-executed':
                this.playSound('orderFilled');
                break;
        }
    }
    
    startDynamicMusicSystem() {
        console.log('🎵 Starting dynamic music system...');
        
        // Start with ambient calm music
        this.setMusic('ambient', 0.3);
        
        // Monitor music intensity and adjust accordingly
        this.musicMonitor = setInterval(() => {
            this.updateDynamicMusic();
        }, 5000); // Check every 5 seconds
        
        console.log('✅ Dynamic Music System: ACTIVE');
    }
    
    updateDynamicMusic() {
        // Gradually reduce music intensity over time (return to calm)
        if (this.musicIntensity > 0.3) {
            this.musicIntensity -= 0.05;
            this.updateMusicTrack();
        }
    }
    
    playSound(soundId, options = {}) {
        const sound = this.soundLibrary[soundId];
        if (!sound) {
            console.warn(`Sound not found: ${soundId}`);
            return { success: false, error: 'Sound not found' };
        }
        
        const audioCommand = {
            id: crypto.randomBytes(8).toString('hex'),
            type: 'sound-effect',
            soundId,
            file: this.getRandomFile(sound.files),
            volume: (sound.volume * this.config.effectsVolume * this.config.masterVolume),
            category: sound.category,
            options,
            timestamp: Date.now()
        };
        
        // Add to queue for processing
        this.audioQueue.push(audioCommand);
        
        // Broadcast to connected clients
        this.broadcastAudioCommand(audioCommand);
        
        console.log(`🔊 Playing sound: ${soundId}`);
        
        return { success: true, commandId: audioCommand.id };
    }
    
    setMusic(category, intensity = 0.5) {
        this.musicIntensity = Math.max(0, Math.min(1, intensity));
        
        const musicCategory = this.musicLibrary[category];
        if (!musicCategory) {
            console.warn(`Music category not found: ${category}`);
            return { success: false, error: 'Music category not found' };
        }
        
        // Determine intensity level
        let intensityLevel;
        if (this.musicIntensity < 0.4) {
            intensityLevel = 'calm';
        } else if (this.musicIntensity < 0.7) {
            intensityLevel = 'moderate';
        } else {
            intensityLevel = 'intense';
        }
        
        const tracks = musicCategory[intensityLevel];
        if (!tracks || tracks.length === 0) {
            intensityLevel = 'calm'; // Fallback
        }
        
        const selectedTrack = this.getRandomFile(musicCategory[intensityLevel]);
        
        const musicCommand = {
            id: crypto.randomBytes(8).toString('hex'),
            type: 'background-music',
            category,
            track: selectedTrack,
            intensity: this.musicIntensity,
            volume: this.config.musicVolume * this.config.masterVolume,
            fadeIn: true,
            loop: true,
            timestamp: Date.now()
        };
        
        this.currentMusic = musicCommand;
        this.broadcastAudioCommand(musicCommand);
        
        console.log(`🎵 Setting music: ${category} (${intensityLevel}) - ${selectedTrack}`);
        
        return { success: true, commandId: musicCommand.id };
    }
    
    setMusicIntensity(intensity) {
        this.musicIntensity = Math.max(0, Math.min(1, intensity));
        this.updateMusicTrack();
    }
    
    increaseMusicIntensity(amount) {
        this.setMusicIntensity(this.musicIntensity + amount);
    }
    
    updateMusicTrack() {
        if (this.currentMusic) {
            // Update current music with new intensity
            this.setMusic(this.currentMusic.category, this.musicIntensity);
        }
    }
    
    playVoiceLine(category, customText = null) {
        if (!this.config.enableVoiceNarration) return;
        
        const lines = this.voiceLines[category];
        if (!lines && !customText) {
            console.warn(`Voice category not found: ${category}`);
            return { success: false, error: 'Voice category not found' };
        }
        
        const text = customText || this.getRandomElement(lines);
        
        const voiceCommand = {
            id: crypto.randomBytes(8).toString('hex'),
            type: 'voice-narration',
            category,
            text,
            volume: this.config.voiceVolume * this.config.masterVolume,
            voice: 'epic-narrator', // Could be different voices
            timestamp: Date.now()
        };
        
        this.voiceQueue.push(voiceCommand);
        this.broadcastAudioCommand(voiceCommand);
        
        console.log(`🗣️ Voice line: ${text.substring(0, 50)}...`);
        
        return { success: true, commandId: voiceCommand.id };
    }
    
    setVolume(type, level) {
        level = Math.max(0, Math.min(1, level));
        
        switch (type) {
            case 'master':
                this.config.masterVolume = level;
                break;
            case 'music':
                this.config.musicVolume = level;
                break;
            case 'effects':
                this.config.effectsVolume = level;
                break;
            case 'voice':
                this.config.voiceVolume = level;
                break;
            default:
                return { success: false, error: 'Unknown volume type' };
        }
        
        // Broadcast volume change
        this.broadcastAudioCommand({
            type: 'volume-change',
            volumeType: type,
            level,
            timestamp: Date.now()
        });
        
        console.log(`🔊 Volume changed: ${type} = ${(level * 100).toFixed(0)}%`);
        
        return { success: true, type, level };
    }
    
    processAudioQueue() {
        // Process audio queue (simulate audio playback)
        while (this.audioQueue.length > 0) {
            const command = this.audioQueue.shift();
            this.executeAudioCommand(command);
        }
    }
    
    executeAudioCommand(command) {
        // In a real implementation, this would interact with actual audio APIs
        // For now, we just track active effects
        
        if (command.type === 'sound-effect') {
            this.activeEffects.set(command.id, {
                ...command,
                startTime: Date.now(),
                duration: 3000 // Assume 3 second duration
            });
            
            // Remove after duration
            setTimeout(() => {
                this.activeEffects.delete(command.id);
            }, 3000);
        }
    }
    
    handleAudioMessage(ws, data) {
        switch (data.type) {
            case 'audio-ping':
                ws.send(JSON.stringify({ 
                    type: 'audio-pong', 
                    timestamp: Date.now() 
                }));
                break;
                
            case 'play-sound':
                const soundResult = this.playSound(data.soundId, data.options);
                ws.send(JSON.stringify({
                    type: 'sound-result',
                    result: soundResult,
                    timestamp: Date.now()
                }));
                break;
                
            case 'set-music':
                const musicResult = this.setMusic(data.category, data.intensity);
                ws.send(JSON.stringify({
                    type: 'music-result',
                    result: musicResult,
                    timestamp: Date.now()
                }));
                break;
                
            case 'set-volume':
                const volumeResult = this.setVolume(data.volumeType, data.level);
                ws.send(JSON.stringify({
                    type: 'volume-result',
                    result: volumeResult,
                    timestamp: Date.now()
                }));
                break;
                
            case 'play-voice':
                const voiceResult = this.playVoiceLine(data.category, data.text);
                ws.send(JSON.stringify({
                    type: 'voice-result',
                    result: voiceResult,
                    timestamp: Date.now()
                }));
                break;
        }
    }
    
    getRandomFile(files) {
        return files[Math.floor(Math.random() * files.length)];
    }
    
    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    getAudioStatus() {
        return {
            connected: this.clients.size,
            currentMusic: this.currentMusic,
            musicIntensity: this.musicIntensity,
            activeEffects: this.activeEffects.size,
            voiceQueueLength: this.voiceQueue.length,
            volumes: {
                master: this.config.masterVolume,
                music: this.config.musicVolume,
                effects: this.config.effectsVolume,
                voice: this.config.voiceVolume
            },
            features: {
                voiceNarration: this.config.enableVoiceNarration,
                spatialAudio: this.config.enableSpatialAudio,
                dynamicMusic: this.config.enableDynamicMusic
            },
            timestamp: Date.now()
        };
    }
    
    broadcastAudioCommand(command) {
        if (this.clients.size === 0) return;
        
        const message = JSON.stringify({
            type: 'audio-command',
            command,
            timestamp: Date.now()
        });
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                } catch (error) {
                    console.error('Error sending audio command to client:', error);
                    this.clients.delete(client);
                }
            }
        });
    }
    
    async generateSampleAudioFiles() {
        // In a real implementation, this would contain actual audio files
        // For demonstration, we create placeholder files
        
        console.log('🎵 Generating sample audio file references...');
        
        const sampleFiles = [
            'order-placed-1.mp3', 'order-filled-epic.mp3', 'profit-victory.mp3',
            'fire-ignition.mp3', 'epic-burn-orchestral.mp3', 'achievement-fanfare.mp3',
            'boss-spawn-ominous.mp3', 'trading-calm-orchestral.mp3', 'system-online.mp3'
        ];
        
        for (const file of sampleFiles) {
            const filePath = path.join(this.config.audioDir, file);
            try {
                await fs.writeFile(filePath, '# Sample audio file placeholder', 'utf8');
            } catch (error) {
                // Ignore file creation errors
            }
        }
        
        console.log('✅ Sample audio files: READY');
    }
    
    getAudioControlPanelHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🎬 MOVIE STYLE SOUND EFFECTS 🔊</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%);
            color: #fff;
            font-family: 'Arial', sans-serif;
            overflow: hidden;
        }
        
        .audio-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            display: grid;
            grid-template-areas: 
                "header header header header"
                "controls mixer effects voice"
                "library music queue status"
                "visualizer visualizer visualizer visualizer";
            grid-template-rows: 80px 1fr 1fr 200px;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 10px;
            padding: 10px;
            box-sizing: border-box;
        }
        
        .panel {
            background: rgba(20, 20, 20, 0.9);
            border: 2px solid #444;
            border-radius: 15px;
            padding: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.1);
        }
        
        .audio-header {
            grid-area: header;
            text-align: center;
            font-size: 28px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(45deg, #ff0080, #8000ff);
            border: 2px solid #00ffff;
            animation: audio-glow 2s infinite;
        }
        
        @keyframes audio-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
            50% { box-shadow: 0 0 40px rgba(0, 255, 255, 0.8); }
        }
        
        .audio-controls {
            grid-area: controls;
        }
        
        .volume-mixer {
            grid-area: mixer;
        }
        
        .sound-effects {
            grid-area: effects;
        }
        
        .voice-controls {
            grid-area: voice;
        }
        
        .sound-library {
            grid-area: library;
        }
        
        .music-controls {
            grid-area: music;
        }
        
        .audio-queue {
            grid-area: queue;
        }
        
        .system-status {
            grid-area: status;
        }
        
        .audio-visualizer {
            grid-area: visualizer;
        }
        
        .panel-title {
            font-size: 18px;
            margin-bottom: 15px;
            text-align: center;
            color: #00ffff;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
        }
        
        .control-group {
            margin: 15px 0;
        }
        
        .control-label {
            display: block;
            margin-bottom: 5px;
            color: #ccc;
            font-size: 14px;
        }
        
        .volume-slider {
            width: 100%;
            height: 8px;
            background: #333;
            border-radius: 4px;
            outline: none;
            appearance: none;
        }
        
        .volume-slider::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            background: #00ffff;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
        }
        
        .sound-button {
            display: block;
            width: 100%;
            margin: 8px 0;
            padding: 10px;
            background: linear-gradient(45deg, #444, #666);
            color: #fff;
            border: 1px solid #00ffff;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        .sound-button:hover {
            background: linear-gradient(45deg, #666, #888);
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
            transform: scale(1.02);
        }
        
        .music-category {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 8px 0;
            padding: 8px 12px;
            background: rgba(68, 68, 68, 0.5);
            border: 1px solid #666;
            border-radius: 8px;
        }
        
        .intensity-control {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .intensity-slider {
            width: 100px;
            height: 6px;
            background: #333;
            border-radius: 3px;
            outline: none;
            appearance: none;
        }
        
        .intensity-slider::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            background: #ff8800;
            border-radius: 50%;
            cursor: pointer;
        }
        
        .queue-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 8px;
            margin: 4px 0;
            background: rgba(0, 255, 255, 0.1);
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 6px;
            font-size: 12px;
        }
        
        .status-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #444;
            font-size: 14px;
        }
        
        .status-value {
            font-weight: bold;
            color: #00ffff;
        }
        
        .visualizer-canvas {
            width: 100%;
            height: 100%;
            background: #000;
            border-radius: 10px;
            border: 2px solid #00ffff;
        }
        
        .voice-input {
            width: 100%;
            padding: 8px;
            background: #333;
            border: 1px solid #666;
            border-radius: 6px;
            color: #fff;
            font-size: 14px;
        }
        
        .voice-input:focus {
            outline: none;
            border-color: #00ffff;
            box-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
        }
        
        .category-selector {
            width: 100%;
            padding: 6px;
            background: #333;
            border: 1px solid #666;
            border-radius: 6px;
            color: #fff;
            font-size: 14px;
        }
        
        .effect-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 1s infinite;
        }
        
        .effect-indicator.active {
            background: #00ff00;
        }
        
        .effect-indicator.inactive {
            background: #666;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .scrollable {
            max-height: 200px;
            overflow-y: auto;
        }
        
        .scrollable::-webkit-scrollbar {
            width: 6px;
        }
        
        .scrollable::-webkit-scrollbar-track {
            background: #333;
            border-radius: 3px;
        }
        
        .scrollable::-webkit-scrollbar-thumb {
            background: #666;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="audio-container">
        <div class="panel audio-header">
            🎬 MOVIE STYLE SOUND EFFECTS 🔊
        </div>
        
        <div class="panel audio-controls">
            <div class="panel-title">🎛️ Main Controls</div>
            
            <div class="control-group">
                <label class="control-label">Master Volume</label>
                <input type="range" class="volume-slider" id="masterVolume" min="0" max="1" step="0.1" value="0.7" onchange="setVolume('master', this.value)">
                <span id="masterVolumeValue">70%</span>
            </div>
            
            <div class="control-group">
                <button class="sound-button" onclick="playWelcomeSequence()">
                    🎬 Play Welcome Sequence
                </button>
                <button class="sound-button" onclick="toggleDynamicMusic()">
                    🎵 Toggle Dynamic Music
                </button>
                <button class="sound-button" onclick="testAudioSystem()">
                    🔊 Test Audio System
                </button>
            </div>
        </div>
        
        <div class="panel volume-mixer">
            <div class="panel-title">🎚️ Volume Mixer</div>
            
            <div class="control-group">
                <label class="control-label">Music</label>
                <input type="range" class="volume-slider" id="musicVolume" min="0" max="1" step="0.1" value="0.5" onchange="setVolume('music', this.value)">
                <span id="musicVolumeValue">50%</span>
            </div>
            
            <div class="control-group">
                <label class="control-label">Sound Effects</label>
                <input type="range" class="volume-slider" id="effectsVolume" min="0" max="1" step="0.1" value="0.8" onchange="setVolume('effects', this.value)">
                <span id="effectsVolumeValue">80%</span>
            </div>
            
            <div class="control-group">
                <label class="control-label">Voice Narration</label>
                <input type="range" class="volume-slider" id="voiceVolume" min="0" max="1" step="0.1" value="0.9" onchange="setVolume('voice', this.value)">
                <span id="voiceVolumeValue">90%</span>
            </div>
        </div>
        
        <div class="panel sound-effects">
            <div class="panel-title">🔊 Sound Effects</div>
            <div class="scrollable">
                <button class="sound-button" onclick="playSound('orderPlaced')">📋 Order Placed</button>
                <button class="sound-button" onclick="playSound('orderFilled')">✅ Order Filled</button>
                <button class="sound-button" onclick="playSound('tradeProfitable')">💰 Profitable Trade</button>
                <button class="sound-button" onclick="playSound('burnDetected')">🔥 Burn Detected</button>
                <button class="sound-button" onclick="playSound('epicBurn')">🌋 Epic Burn</button>
                <button class="sound-button" onclick="playSound('achievement')">🏆 Achievement</button>
                <button class="sound-button" onclick="playSound('bossSpawn')">🐉 Boss Spawn</button>
                <button class="sound-button" onclick="playSound('bossDefeat')">⚔️ Boss Defeat</button>
            </div>
        </div>
        
        <div class="panel voice-controls">
            <div class="panel-title">🗣️ Voice Narration</div>
            
            <div class="control-group">
                <label class="control-label">Category</label>
                <select class="category-selector" id="voiceCategory">
                    <option value="welcome">Welcome</option>
                    <option value="orderPlaced">Order Placed</option>
                    <option value="bigProfit">Big Profit</option>
                    <option value="burnDetected">Burn Detected</option>
                    <option value="epicBurn">Epic Burn</option>
                    <option value="bossSpawn">Boss Spawn</option>
                    <option value="levelUp">Level Up</option>
                    <option value="coaching">Coaching</option>
                </select>
            </div>
            
            <div class="control-group">
                <label class="control-label">Custom Text</label>
                <input type="text" class="voice-input" id="customVoiceText" placeholder="Enter custom narration...">
            </div>
            
            <button class="sound-button" onclick="playVoice()">
                🎤 Play Voice Line
            </button>
        </div>
        
        <div class="panel sound-library">
            <div class="panel-title">📚 Sound Library</div>
            <div class="scrollable" id="soundLibrary"></div>
        </div>
        
        <div class="panel music-controls">
            <div class="panel-title">🎵 Music Control</div>
            
            <div class="music-category">
                <span>Ambient</span>
                <div class="intensity-control">
                    <input type="range" class="intensity-slider" min="0" max="1" step="0.1" value="0.3" onchange="setMusic('ambient', this.value)">
                    <button class="sound-button" onclick="setMusic('ambient', 0.3)" style="width: 60px; margin: 0;">Play</button>
                </div>
            </div>
            
            <div class="music-category">
                <span>Trading</span>
                <div class="intensity-control">
                    <input type="range" class="intensity-slider" min="0" max="1" step="0.1" value="0.5" onchange="setMusic('trading', this.value)">
                    <button class="sound-button" onclick="setMusic('trading', 0.5)" style="width: 60px; margin: 0;">Play</button>
                </div>
            </div>
            
            <div class="music-category">
                <span>Boss Battle</span>
                <div class="intensity-control">
                    <input type="range" class="intensity-slider" min="0" max="1" step="0.1" value="0.8" onchange="setMusic('boss', this.value)">
                    <button class="sound-button" onclick="setMusic('boss', 0.8)" style="width: 60px; margin: 0;">Play</button>
                </div>
            </div>
            
            <div class="music-category">
                <span>Victory</span>
                <div class="intensity-control">
                    <input type="range" class="intensity-slider" min="0" max="1" step="0.1" value="0.9" onchange="setMusic('victory', this.value)">
                    <button class="sound-button" onclick="setMusic('victory', 0.9)" style="width: 60px; margin: 0;">Play</button>
                </div>
            </div>
        </div>
        
        <div class="panel audio-queue">
            <div class="panel-title">⏱️ Audio Queue</div>
            <div class="scrollable" id="audioQueue"></div>
        </div>
        
        <div class="panel system-status">
            <div class="panel-title">📊 System Status</div>
            
            <div class="status-item">
                <span>Connected Clients:</span>
                <span class="status-value" id="connectedClients">0</span>
            </div>
            <div class="status-item">
                <span>Active Effects:</span>
                <span class="status-value" id="activeEffects">0</span>
            </div>
            <div class="status-item">
                <span>Music Intensity:</span>
                <span class="status-value" id="musicIntensity">50%</span>
            </div>
            <div class="status-item">
                <span>Voice Queue:</span>
                <span class="status-value" id="voiceQueue">0</span>
            </div>
            <div class="status-item">
                <span>System Health:</span>
                <span class="status-value">🟢 Optimal</span>
            </div>
        </div>
        
        <div class="panel audio-visualizer">
            <div class="panel-title">🌊 Audio Visualizer</div>
            <canvas class="visualizer-canvas" id="visualizerCanvas"></canvas>
        </div>
    </div>
    
    <script>
        let ws;
        let audioStatus = {};
        let canvas, ctx;
        let visualizerData = [];
        
        function init() {
            canvas = document.getElementById('visualizerCanvas');
            ctx = canvas.getContext('2d');
            
            // Set canvas size
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            // Connect WebSocket
            connectWebSocket();
            
            // Start visualizer
            startVisualizer();
            
            // Update interface
            updateInterface();
            setInterval(updateInterface, 1000);
        }
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.config.wsPort}');
            
            ws.onopen = () => {
                console.log('🔊 Connected to audio system');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleAudioMessage(data);
            };
            
            ws.onclose = () => {
                console.log('🔌 Disconnected, reconnecting...');
                setTimeout(connectWebSocket, 1000);
            };
            
            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };
        }
        
        function handleAudioMessage(data) {
            switch (data.type) {
                case 'audio-connected':
                    audioStatus = data.status;
                    updateInterface();
                    break;
                    
                case 'audio-command':
                    handleAudioCommand(data.command);
                    break;
            }
        }
        
        function handleAudioCommand(command) {
            // Add to queue display
            addToQueueDisplay(command);
            
            // Update visualizer
            if (command.type === 'sound-effect') {
                addVisualizerEffect(command);
            }
        }
        
        function playSound(soundId) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'play-sound',
                    soundId: soundId
                }));
            }
        }
        
        function setVolume(type, level) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'set-volume',
                    volumeType: type,
                    level: parseFloat(level)
                }));
            }
            
            // Update display
            document.getElementById(type + 'VolumeValue').textContent = Math.round(level * 100) + '%';
        }
        
        function setMusic(category, intensity) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'set-music',
                    category: category,
                    intensity: parseFloat(intensity)
                }));
            }
        }
        
        function playVoice() {
            const category = document.getElementById('voiceCategory').value;
            const customText = document.getElementById('customVoiceText').value;
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'play-voice',
                    category: category,
                    text: customText || null
                }));
            }
        }
        
        function playWelcomeSequence() {
            playSound('connected');
            setTimeout(() => playVoice(), 1000);
            setTimeout(() => setMusic('ambient', 0.3), 2000);
        }
        
        function toggleDynamicMusic() {
            // Toggle between different music states
            const currentIntensity = audioStatus.musicIntensity || 0.5;
            const newIntensity = currentIntensity > 0.7 ? 0.3 : 0.9;
            setMusic('trading', newIntensity);
        }
        
        function testAudioSystem() {
            playSound('orderPlaced');
            setTimeout(() => playSound('orderFilled'), 500);
            setTimeout(() => playSound('tradeProfitable'), 1000);
            setTimeout(() => playSound('achievement'), 1500);
        }
        
        function updateInterface() {
            // Update status display
            if (audioStatus.connected !== undefined) {
                document.getElementById('connectedClients').textContent = audioStatus.connected;
            }
            if (audioStatus.activeEffects !== undefined) {
                document.getElementById('activeEffects').textContent = audioStatus.activeEffects;
            }
            if (audioStatus.musicIntensity !== undefined) {
                document.getElementById('musicIntensity').textContent = Math.round(audioStatus.musicIntensity * 100) + '%';
            }
            if (audioStatus.voiceQueueLength !== undefined) {
                document.getElementById('voiceQueue').textContent = audioStatus.voiceQueueLength;
            }
        }
        
        function addToQueueDisplay(command) {
            const queue = document.getElementById('audioQueue');
            const item = document.createElement('div');
            item.className = 'queue-item';
            
            const time = new Date().toLocaleTimeString();
            item.innerHTML = \`
                <span>\\${command.type}</span>
                <span>\\${time}</span>
            \`;
            
            queue.insertBefore(item, queue.firstChild);
            
            // Keep only last 10 items
            while (queue.children.length > 10) {
                queue.removeChild(queue.lastChild);
            }
        }
        
        function addVisualizerEffect(command) {
            // Add effect to visualizer data
            visualizerData.push({
                type: command.category || 'default',
                intensity: command.volume || 0.5,
                timestamp: Date.now(),
                decay: 1.0
            });
            
            // Keep visualizer data limited
            if (visualizerData.length > 50) {
                visualizerData.shift();
            }
        }
        
        function startVisualizer() {
            function animate() {
                // Clear canvas
                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw visualizer effects
                const now = Date.now();
                for (let i = visualizerData.length - 1; i >= 0; i--) {
                    const effect = visualizerData[i];
                    const age = now - effect.timestamp;
                    
                    // Update decay
                    effect.decay = Math.max(0, 1 - (age / 3000)); // 3 second decay
                    
                    if (effect.decay <= 0) {
                        visualizerData.splice(i, 1);
                        continue;
                    }
                    
                    // Draw effect
                    drawVisualizerEffect(effect, i);
                }
                
                requestAnimationFrame(animate);
            }
            
            animate();
        }
        
        function drawVisualizerEffect(effect, index) {
            const x = (index / visualizerData.length) * canvas.width;
            const height = effect.intensity * effect.decay * canvas.height * 0.8;
            const y = canvas.height - height;
            
            // Color based on effect type
            let color;
            switch (effect.type) {
                case 'trading': color = '#00ff88'; break;
                case 'burn': color = '#ff4400'; break;
                case 'boss': color = '#ff0000'; break;
                case 'achievement': color = '#ffd700'; break;
                default: color = '#00ffff'; break;
            }
            
            // Draw bar with gradient
            const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, 20, height);
            
            // Add glow effect
            ctx.shadowColor = color;
            ctx.shadowBlur = 10 * effect.decay;
            ctx.fillRect(x, y, 20, height);
            ctx.shadowBlur = 0;
        }
        
        // Initialize on load
        window.addEventListener('load', init);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        });
    </script>
</body>
</html>
        `;
    }
    
    async shutdown() {
        console.log('🎬 Shutting down movie style sound effects...');
        
        // Clear intervals
        clearInterval(this.audioQueueProcessor);
        clearInterval(this.musicMonitor);
        
        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
        }
        
        // Close HTTP server
        if (this.server) {
            this.server.close();
        }
        
        console.log('🎬 Sound effects shutdown complete');
    }
}

// Export for use as module
module.exports = MovieStyleSoundEffects;

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    let options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--port':
                options.port = parseInt(args[++i]);
                break;
            case '--ws-port':
                options.wsPort = parseInt(args[++i]);
                break;
            case '--audio-dir':
                options.audioDir = args[++i];
                break;
            case '--no-voice':
                options.enableVoiceNarration = false;
                break;
            case '--no-spatial':
                options.enableSpatialAudio = false;
                break;
            case '--no-dynamic':
                options.enableDynamicMusic = false;
                break;
            case '--master-volume':
                options.masterVolume = parseFloat(args[++i]);
                break;
            case '--demo':
                console.log('🎬 Starting MOVIE SOUND EFFECTS DEMO MODE...');
                options.demoMode = true;
                break;
            default:
                console.log(`
🎬🔊🎵 MOVIE STYLE SOUND EFFECTS 🎵🔊🎬

Usage:
  node MOVIE-STYLE-SOUND-EFFECTS.js [options]

Options:
  --port <port>          HTTP server port (default: 3341)
  --ws-port <port>       WebSocket port (default: 3342)
  --audio-dir <path>     Audio files directory (default: ./movie-audio)
  --no-voice            Disable voice narration
  --no-spatial          Disable spatial audio
  --no-dynamic          Disable dynamic music
  --master-volume <vol>  Master volume 0.0-1.0 (default: 0.7)
  --demo                Run in demo mode

🎬 Audio Features:
  • Real-time sound effects for all trading actions
  • Epic orchestral soundtrack with dynamic intensity
  • Voice narration and coaching guidance
  • Spatial 3D audio positioning
  • Adaptive music based on market conditions
  • Boss battle themes and achievement fanfares

🔊 Transform your trading into a Hollywood blockbuster!
                `);
                process.exit(0);
        }
    }
    
    // Create and start sound effects system
    const soundEffects = new MovieStyleSoundEffects(options);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await soundEffects.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await soundEffects.shutdown();
        process.exit(0);
    });
    
    // Keep process running
    process.stdin.resume();
    
    if (options.demoMode) {
        // Demo mode: play epic audio sequence
        setTimeout(() => {
            console.log('🎬 Demo: Playing welcome sequence...');
            soundEffects.playVoiceLine('welcome');
            soundEffects.setMusic('ambient', 0.3);
        }, 2000);
        
        setTimeout(() => {
            console.log('🔊 Demo: Trading sounds...');
            soundEffects.playSound('orderPlaced');
        }, 5000);
        
        setTimeout(() => {
            console.log('🔥 Demo: Epic burn sequence...');
            soundEffects.playSound('epicBurn');
            soundEffects.playVoiceLine('epicBurn');
            soundEffects.setMusic('boss', 0.8);
        }, 8000);
        
        setTimeout(() => {
            console.log('🏆 Demo: Achievement fanfare...');
            soundEffects.playSound('achievement');
            soundEffects.playVoiceLine('levelUp');
        }, 12000);
    }
    
    console.log('🎬 MOVIE STYLE SOUND EFFECTS ARE LIVE!');
    console.log('🎵 Your trading experience is now a Hollywood blockbuster!');
}