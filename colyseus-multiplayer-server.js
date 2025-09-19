#!/usr/bin/env node
// colyseus-multiplayer-server.js - Multiplayer game server for unified layer
// Handles real-time synchronization of all players in the unified experience

console.log('🎮 Colyseus Multiplayer Server - Real-time unified experience');

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

// Since we don't have Colyseus installed, we'll create a compatible implementation
class ColyseusCompatibleServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        // Game rooms
        this.rooms = new Map();
        
        // Player states
        this.players = new Map();
        
        // ICP-based game modes
        this.gameModes = {
            developer: {
                name: 'Code Battle Arena',
                maxPlayers: 10,
                objective: 'Solve programming challenges faster than opponents',
                rewards: ['API Keys', 'Documentation Access', 'Code Templates']
            },
            startup: {
                name: 'MVP Race',
                maxPlayers: 8,
                objective: 'Build and launch MVPs to gain market share',
                rewards: ['Funding Tokens', 'Mentor Access', 'Resource Boosts']
            },
            enterprise: {
                name: 'Corporate Conquest',
                maxPlayers: 6,
                objective: 'Scale infrastructure and maintain compliance',
                rewards: ['Compliance Badges', 'Security Tokens', 'Scale Credits']
            },
            gamer: {
                name: 'Streaming Showdown',
                maxPlayers: 16,
                objective: 'Gain viewers and subscribers through epic gameplay',
                rewards: ['Viewer Boosts', 'Emote Packs', 'Stream Overlays']
            },
            pirate: {
                name: 'CTF Treasure Hunt',
                maxPlayers: 32,
                objective: 'Find flags and exploit vulnerabilities',
                rewards: ['Exploit Tools', 'Hidden Flags', 'Pirate Reputation']
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupMiddleware();
        this.setupSocketHandlers();
        this.startGameLoops();
        
        const PORT = process.env.COLYSEUS_PORT || 2567;
        this.server.listen(PORT, () => {
            console.log(`✅ Colyseus-compatible server running on port ${PORT}`);
        });
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'online',
                rooms: this.rooms.size,
                players: this.players.size,
                uptime: process.uptime()
            });
        });
        
        // List available rooms
        this.app.get('/rooms', (req, res) => {
            const roomList = Array.from(this.rooms.values()).map(room => ({
                id: room.id,
                mode: room.mode,
                players: room.players.size,
                maxPlayers: room.maxPlayers,
                state: room.state
            }));
            
            res.json(roomList);
        });
        
        // Get game modes
        this.app.get('/modes', (req, res) => {
            res.json(this.gameModes);
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Player connected: ${socket.id}`);
            
            // Initialize player
            const player = {
                id: socket.id,
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                icp: 'developer',
                score: 0,
                achievements: [],
                currentRoom: null
            };
            
            this.players.set(socket.id, player);
            
            // Join room
            socket.on('joinRoom', (data) => {
                const { roomId, mode, playerData } = data;
                
                let room = this.rooms.get(roomId);
                if (!room) {
                    room = this.createRoom(roomId, mode);
                }
                
                if (room.players.size < room.maxPlayers) {
                    // Update player data
                    Object.assign(player, playerData);
                    player.currentRoom = roomId;
                    
                    // Add to room
                    room.players.set(socket.id, player);
                    socket.join(roomId);
                    
                    // Send room state to player
                    socket.emit('roomJoined', {
                        roomId,
                        state: room.state,
                        players: Array.from(room.players.values())
                    });
                    
                    // Notify others
                    socket.to(roomId).emit('playerJoined', player);
                    
                    console.log(`✅ Player ${socket.id} joined room ${roomId}`);
                } else {
                    socket.emit('roomFull', { roomId });
                }
            });
            
            // Handle player movement
            socket.on('move', (data) => {
                const { position, rotation } = data;
                
                player.position = position;
                player.rotation = rotation;
                
                if (player.currentRoom) {
                    // Broadcast to others in room
                    socket.to(player.currentRoom).emit('playerMoved', {
                        playerId: socket.id,
                        position,
                        rotation
                    });
                }
            });
            
            // Handle ICP rotation
            socket.on('rotateICP', (data) => {
                const { icp } = data;
                player.icp = icp;
                
                if (player.currentRoom) {
                    socket.to(player.currentRoom).emit('playerRotatedICP', {
                        playerId: socket.id,
                        icp
                    });
                }
                
                console.log(`🔄 Player ${socket.id} rotated to ICP: ${icp}`);
            });
            
            // Handle game actions
            socket.on('gameAction', (data) => {
                const { action, params } = data;
                
                if (player.currentRoom) {
                    const room = this.rooms.get(player.currentRoom);
                    
                    // Process action based on game mode
                    this.processGameAction(room, player, action, params);
                    
                    // Broadcast action result
                    this.io.to(player.currentRoom).emit('actionResult', {
                        playerId: socket.id,
                        action,
                        result: 'success',
                        state: room.state
                    });
                }
            });
            
            // Handle chat
            socket.on('chat', (data) => {
                const { message } = data;
                
                if (player.currentRoom) {
                    this.io.to(player.currentRoom).emit('chatMessage', {
                        playerId: socket.id,
                        message,
                        timestamp: Date.now()
                    });
                }
            });
            
            // Handle disconnect
            socket.on('disconnect', () => {
                console.log(`🔌 Player disconnected: ${socket.id}`);
                
                // Remove from room
                if (player.currentRoom) {
                    const room = this.rooms.get(player.currentRoom);
                    if (room) {
                        room.players.delete(socket.id);
                        
                        // Notify others
                        socket.to(player.currentRoom).emit('playerLeft', socket.id);
                        
                        // Clean up empty rooms
                        if (room.players.size === 0) {
                            this.rooms.delete(player.currentRoom);
                            console.log(`🧹 Removed empty room: ${player.currentRoom}`);
                        }
                    }
                }
                
                // Remove player
                this.players.delete(socket.id);
            });
        });
    }
    
    createRoom(roomId, mode = 'developer') {
        const gameMode = this.gameModes[mode];
        
        const room = {
            id: roomId,
            mode,
            players: new Map(),
            maxPlayers: gameMode.maxPlayers,
            state: {
                mode,
                objective: gameMode.objective,
                scores: {},
                flags: this.generateFlags(mode),
                treasures: this.generateTreasures(mode),
                challenges: this.generateChallenges(mode),
                startTime: Date.now()
            },
            createdAt: Date.now()
        };
        
        this.rooms.set(roomId, room);
        console.log(`🏠 Created room: ${roomId} (${mode} mode)`);
        
        return room;
    }
    
    generateFlags(mode) {
        // Generate CTF flags based on mode
        const flagTemplates = {
            developer: ['API_KEY', 'SECRET_ENDPOINT', 'DEBUG_MODE'],
            startup: ['FUNDING_ROUND', 'FIRST_CUSTOMER', 'PRODUCT_LAUNCH'],
            enterprise: ['COMPLIANCE_CERT', 'SECURITY_AUDIT', 'SCALE_MILESTONE'],
            gamer: ['EPIC_MOMENT', 'VIEWER_MILESTONE', 'SPONSORSHIP'],
            pirate: ['HIDDEN_TREASURE', 'EXPLOIT_FOUND', 'SYSTEM_PWNED']
        };
        
        const flags = [];
        const templates = flagTemplates[mode] || flagTemplates.developer;
        
        templates.forEach((template, i) => {
            flags.push({
                id: `${mode}_flag_${i}`,
                name: template,
                position: {
                    x: Math.random() * 20 - 10,
                    y: Math.random() * 5,
                    z: Math.random() * 20 - 10
                },
                value: `UNIFIED{${template}_${Math.random().toString(36).substr(2, 9)}}`,
                captured: false,
                capturedBy: null
            });
        });
        
        return flags;
    }
    
    generateTreasures(mode) {
        // Generate collectible treasures
        const treasures = [];
        const count = 10;
        
        for (let i = 0; i < count; i++) {
            treasures.push({
                id: `treasure_${i}`,
                type: this.getTreasureType(mode),
                position: {
                    x: Math.random() * 30 - 15,
                    y: Math.random() * 3,
                    z: Math.random() * 30 - 15
                },
                value: Math.floor(Math.random() * 100) + 10,
                collected: false
            });
        }
        
        return treasures;
    }
    
    getTreasureType(mode) {
        const types = {
            developer: ['Code Snippet', 'API Credit', 'Debug Tool'],
            startup: ['Angel Investment', 'User Signup', 'Press Coverage'],
            enterprise: ['Enterprise Contract', 'Compliance Badge', 'Scale Token'],
            gamer: ['Rare Skin', 'Subscriber Pack', 'Donation Boost'],
            pirate: ['Exploit Kit', 'Zero Day', 'Bitcoin Cache']
        };
        
        const modeTypes = types[mode] || types.developer;
        return modeTypes[Math.floor(Math.random() * modeTypes.length)];
    }
    
    generateChallenges(mode) {
        // Generate mode-specific challenges
        const challenges = {
            developer: [
                { id: 'debug_1', name: 'Fix the Bug', difficulty: 'easy', reward: 50 },
                { id: 'api_1', name: 'Integrate API', difficulty: 'medium', reward: 100 },
                { id: 'scale_1', name: 'Optimize Algorithm', difficulty: 'hard', reward: 200 }
            ],
            startup: [
                { id: 'pitch_1', name: 'Perfect Pitch', difficulty: 'easy', reward: 75 },
                { id: 'mvp_1', name: 'Launch MVP', difficulty: 'medium', reward: 150 },
                { id: 'funding_1', name: 'Close Series A', difficulty: 'hard', reward: 300 }
            ],
            pirate: [
                { id: 'recon_1', name: 'Port Scan', difficulty: 'easy', reward: 25 },
                { id: 'exploit_1', name: 'SQL Injection', difficulty: 'medium', reward: 125 },
                { id: 'pwn_1', name: 'Root the Box', difficulty: 'hard', reward: 500 }
            ]
        };
        
        return challenges[mode] || challenges.developer;
    }
    
    processGameAction(room, player, action, params) {
        switch (action) {
            case 'captureFlag':
                this.handleFlagCapture(room, player, params.flagId);
                break;
                
            case 'collectTreasure':
                this.handleTreasureCollection(room, player, params.treasureId);
                break;
                
            case 'completeChallenge':
                this.handleChallengeCompletion(room, player, params.challengeId);
                break;
                
            case 'deployService':
                this.handleServiceDeployment(room, player, params.service);
                break;
                
            default:
                console.log(`Unknown action: ${action}`);
        }
    }
    
    handleFlagCapture(room, player, flagId) {
        const flag = room.state.flags.find(f => f.id === flagId);
        
        if (flag && !flag.captured) {
            flag.captured = true;
            flag.capturedBy = player.id;
            
            // Award points
            player.score += 100;
            room.state.scores[player.id] = player.score;
            
            console.log(`🏁 Player ${player.id} captured flag: ${flag.name}`);
            
            // Check for win condition
            const capturedCount = room.state.flags.filter(f => f.capturedBy === player.id).length;
            if (capturedCount >= 3) {
                this.io.to(room.id).emit('gameWon', {
                    winner: player.id,
                    reason: 'Captured 3 flags'
                });
            }
        }
    }
    
    handleTreasureCollection(room, player, treasureId) {
        const treasure = room.state.treasures.find(t => t.id === treasureId);
        
        if (treasure && !treasure.collected) {
            treasure.collected = true;
            
            // Award points
            player.score += treasure.value;
            room.state.scores[player.id] = player.score;
            
            // Grant achievement
            player.achievements.push({
                type: 'treasure',
                name: treasure.type,
                timestamp: Date.now()
            });
            
            console.log(`💎 Player ${player.id} collected treasure: ${treasure.type}`);
        }
    }
    
    handleChallengeCompletion(room, player, challengeId) {
        const challenge = room.state.challenges.find(c => c.id === challengeId);
        
        if (challenge) {
            // Award points
            player.score += challenge.reward;
            room.state.scores[player.id] = player.score;
            
            console.log(`✅ Player ${player.id} completed challenge: ${challenge.name}`);
        }
    }
    
    handleServiceDeployment(room, player, service) {
        // Simulate deploying a service in the game world
        console.log(`🚀 Player ${player.id} deployed service: ${service}`);
        
        // Award points based on service type
        const servicePoints = {
            streaming: 50,
            gaming: 75,
            security: 100,
            ai: 150
        };
        
        player.score += servicePoints[service] || 25;
        room.state.scores[player.id] = player.score;
    }
    
    startGameLoops() {
        // Main game loop - runs every 100ms
        setInterval(() => {
            this.rooms.forEach((room, roomId) => {
                // Update room state
                this.updateRoomState(room);
                
                // Check for events
                this.checkRoomEvents(room);
            });
        }, 100);
        
        // Slower loop for spawning new items - every 10 seconds
        setInterval(() => {
            this.rooms.forEach((room, roomId) => {
                // Spawn new treasures
                if (room.state.treasures.filter(t => !t.collected).length < 5) {
                    const newTreasure = this.generateTreasures(room.mode)[0];
                    room.state.treasures.push(newTreasure);
                    
                    this.io.to(roomId).emit('treasureSpawned', newTreasure);
                }
            });
        }, 10000);
    }
    
    updateRoomState(room) {
        // Update game timer
        room.state.gameTime = Date.now() - room.state.startTime;
        
        // Update leaderboard
        const leaderboard = Array.from(room.players.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(p => ({
                id: p.id,
                score: p.score,
                icp: p.icp
            }));
        
        room.state.leaderboard = leaderboard;
    }
    
    checkRoomEvents(room) {
        // Check for special events based on game time
        const gameMinutes = Math.floor(room.state.gameTime / 60000);
        
        // Every 5 minutes, trigger a special event
        if (gameMinutes > 0 && gameMinutes % 5 === 0 && !room.state.lastEventMinute || room.state.lastEventMinute !== gameMinutes) {
            room.state.lastEventMinute = gameMinutes;
            
            const events = [
                { type: 'doublePoints', duration: 60000, message: 'Double points activated!' },
                { type: 'flagRush', duration: 120000, message: 'Flag rush! All flags worth 2x!' },
                { type: 'bossBattle', duration: 180000, message: 'Boss battle incoming!' }
            ];
            
            const event = events[Math.floor(Math.random() * events.length)];
            
            this.io.to(room.id).emit('specialEvent', event);
            console.log(`🎉 Special event in room ${room.id}: ${event.type}`);
        }
    }
}

// Create and start server
const multiplayerServer = new ColyseusCompatibleServer();

// Export for use in other modules
module.exports = ColyseusCompatibleServer;