#!/usr/bin/env node

/**
 * 🎮🗣️ INTERACTIVE GROUP CHAT GAMES
 * Voice + Text + Swipe-based multiplayer games for real-time collaboration
 * Finally building what you actually wanted!
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

class InteractiveGroupChatGames {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = 9999;
        this.gameRooms = new Map();
        this.players = new Map();
        this.activeGames = new Map();
        
        // Game types
        this.gameTypes = {
            'swipe-vote': 'Swipe Vote Battle',
            'voice-debate': 'Voice Debate Arena', 
            'quick-build': 'Speed Building Challenge',
            'shiprekt': 'ShipRekt Team Battle',
            'document-duel': 'Document Review Duel'
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupGameHandlers();
        
        console.log('🎮🗣️ Interactive Group Chat Games initializing...');
    }
    
    setupMiddleware() {
        this.app.use(express.static('public'));
        this.app.use(express.json());
        
        // CORS for cross-platform access
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });
    }
    
    setupRoutes() {
        // Main gaming interface
        this.app.get('/', (req, res) => {
            res.send(this.generateGamingInterface());
        });
        
        // Mobile-friendly interface
        this.app.get('/mobile', (req, res) => {
            res.send(this.generateMobileInterface());
        });
        
        // Game room API
        this.app.get('/api/rooms', (req, res) => {
            const rooms = Array.from(this.gameRooms.entries()).map(([id, room]) => ({
                id,
                name: room.name,
                gameType: room.gameType,
                players: room.players.length,
                maxPlayers: room.maxPlayers,
                status: room.status,
                created: room.created
            }));
            res.json(rooms);
        });
        
        this.app.post('/api/rooms', (req, res) => {
            const { name, gameType, maxPlayers = 8 } = req.body;
            const roomId = this.generateRoomId();
            
            const room = {
                id: roomId,
                name: name || `Game Room ${roomId}`,
                gameType: gameType || 'swipe-vote',
                maxPlayers,
                players: [],
                teams: { saveOrSink: [], dealOrDelete: [] },
                gameState: {},
                status: 'waiting',
                created: new Date().toISOString()
            };
            
            this.gameRooms.set(roomId, room);
            console.log(`🎮 Game room created: ${room.name} (${gameType})`);
            
            res.json(room);
        });
    }
    
    setupGameHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🎮 Player connected: ${socket.id}`);
            
            // Player joins game room
            socket.on('join-game', (data) => {
                const { roomId, playerName, team, avatar } = data;
                const room = this.gameRooms.get(roomId);
                
                if (room && room.players.length < room.maxPlayers) {
                    socket.join(roomId);
                    
                    const player = {
                        id: socket.id,
                        name: playerName || `Player_${socket.id.slice(0, 6)}`,
                        team: team || this.autoAssignTeam(room),
                        avatar: avatar || '🎮',
                        joinedAt: new Date().toISOString(),
                        speaking: false,
                        score: 0,
                        ready: false
                    };
                    
                    this.players.set(socket.id, { ...player, roomId });
                    room.players.push(player);
                    room.teams[player.team].push(player);
                    
                    // Notify room of new player
                    this.io.to(roomId).emit('player-joined', {
                        player,
                        room: this.getRoomInfo(room)
                    });
                    
                    // Send room state to new player
                    socket.emit('game-state', {
                        room: this.getRoomInfo(room),
                        players: room.players,
                        gameType: room.gameType,
                        gameState: room.gameState
                    });
                    
                    console.log(`🎮 ${player.name} joined ${room.name} (Team: ${player.team})`);
                }
            });
            
            // Voice activity tracking
            socket.on('voice-activity', (data) => {
                const player = this.players.get(socket.id);
                if (player) {
                    player.speaking = data.speaking;
                    socket.to(player.roomId).emit('player-voice-activity', {
                        playerId: socket.id,
                        playerName: player.name,
                        speaking: data.speaking
                    });
                }
            });
            
            // Chat messages with game integration
            socket.on('chat-message', (data) => {
                const player = this.players.get(socket.id);
                if (player) {
                    const room = this.gameRooms.get(player.roomId);
                    if (room) {
                        const message = {
                            id: Date.now(),
                            playerId: socket.id,
                            playerName: player.name,
                            team: player.team,
                            message: data.message,
                            type: data.type || 'chat',
                            timestamp: new Date().toISOString()
                        };
                        
                        // Check for game commands
                        this.processGameCommand(message, room);
                        
                        this.io.to(player.roomId).emit('new-message', message);
                    }
                }
            });
            
            // Swipe actions
            socket.on('swipe-action', (data) => {
                const player = this.players.get(socket.id);
                if (player) {
                    const room = this.gameRooms.get(player.roomId);
                    if (room) {
                        this.handleSwipeAction(room, player, data);
                    }
                }
            });
            
            // Game-specific actions
            socket.on('game-action', (data) => {
                const player = this.players.get(socket.id);
                if (player) {
                    const room = this.gameRooms.get(player.roomId);
                    if (room) {
                        this.handleGameAction(room, player, data);
                    }
                }
            });
            
            // Player ready state
            socket.on('player-ready', (data) => {
                const player = this.players.get(socket.id);
                if (player) {
                    const room = this.gameRooms.get(player.roomId);
                    if (room) {
                        player.ready = data.ready;
                        
                        this.io.to(player.roomId).emit('player-ready-state', {
                            playerId: socket.id,
                            playerName: player.name,
                            ready: data.ready
                        });
                        
                        // Check if all players are ready
                        if (room.players.every(p => p.ready) && room.players.length >= 2) {
                            this.startGame(room);
                        }
                    }
                }
            });
            
            // WebRTC signaling for voice
            socket.on('webrtc-offer', (data) => {
                socket.to(data.targetPlayerId).emit('webrtc-offer', {
                    offer: data.offer,
                    fromPlayerId: socket.id
                });
            });
            
            socket.on('webrtc-answer', (data) => {
                socket.to(data.targetPlayerId).emit('webrtc-answer', {
                    answer: data.answer,
                    fromPlayerId: socket.id
                });
            });
            
            socket.on('webrtc-ice-candidate', (data) => {
                socket.to(data.targetPlayerId).emit('webrtc-ice-candidate', {
                    candidate: data.candidate,
                    fromPlayerId: socket.id
                });
            });
            
            // Disconnect handling
            socket.on('disconnect', () => {
                const player = this.players.get(socket.id);
                if (player) {
                    const room = this.gameRooms.get(player.roomId);
                    if (room) {
                        // Remove player from room and teams
                        room.players = room.players.filter(p => p.id !== socket.id);
                        room.teams.saveOrSink = room.teams.saveOrSink.filter(p => p.id !== socket.id);
                        room.teams.dealOrDelete = room.teams.dealOrDelete.filter(p => p.id !== socket.id);
                        
                        this.io.to(player.roomId).emit('player-left', {
                            playerId: socket.id,
                            playerName: player.name,
                            room: this.getRoomInfo(room)
                        });
                        
                        // If no players left, clean up room
                        if (room.players.length === 0) {
                            this.gameRooms.delete(player.roomId);
                            this.activeGames.delete(player.roomId);
                        }
                        
                        console.log(`🎮 ${player.name} left ${room.name}`);
                    }
                    this.players.delete(socket.id);
                }
            });
        });
    }
    
    autoAssignTeam(room) {
        // Balance teams
        if (room.teams.saveOrSink.length <= room.teams.dealOrDelete.length) {
            return 'saveOrSink';
        } else {
            return 'dealOrDelete';
        }
    }
    
    getRoomInfo(room) {
        return {
            id: room.id,
            name: room.name,
            gameType: room.gameType,
            playerCount: room.players.length,
            maxPlayers: room.maxPlayers,
            status: room.status,
            teams: {
                saveOrSink: room.teams.saveOrSink.length,
                dealOrDelete: room.teams.dealOrDelete.length
            }
        };
    }
    
    processGameCommand(message, room) {
        const text = message.message.toLowerCase();
        
        // Game command detection
        if (text.includes('/start')) {
            if (room.players.length >= 2) {
                this.startGame(room);
            } else {
                this.io.to(room.id).emit('system-message', {
                    message: 'Need at least 2 players to start!',
                    type: 'warning'
                });
            }
        } else if (text.includes('/ready')) {
            const player = room.players.find(p => p.id === message.playerId);
            if (player) {
                player.ready = !player.ready;
                this.io.to(room.id).emit('player-ready-state', {
                    playerId: player.id,
                    playerName: player.name,
                    ready: player.ready
                });
            }
        }
    }
    
    handleSwipeAction(room, player, data) {
        const { direction, item, context } = data;
        
        console.log(`🎮 ${player.name} swiped ${direction} on ${item}`);
        
        // Add to room game state
        if (!room.gameState.swipes) room.gameState.swipes = [];
        
        const swipe = {
            playerId: player.id,
            playerName: player.name,
            team: player.team,
            direction,
            item,
            context,
            timestamp: new Date().toISOString()
        };
        
        room.gameState.swipes.push(swipe);
        
        // Broadcast swipe to all players
        this.io.to(room.id).emit('swipe-result', {
            swipe,
            totalSwipes: room.gameState.swipes.length,
            teamVotes: this.getTeamSwipeResults(room)
        });
        
        // Check for game completion
        if (room.gameState.swipes.length >= room.players.length) {
            this.endSwipeRound(room);
        }
    }
    
    handleGameAction(room, player, data) {
        const { action, payload } = data;
        
        switch (room.gameType) {
            case 'voice-debate':
                this.handleVoiceDebateAction(room, player, action, payload);
                break;
            case 'quick-build':
                this.handleQuickBuildAction(room, player, action, payload);
                break;
            case 'shiprekt':
                this.handleShipRektAction(room, player, action, payload);
                break;
            case 'document-duel':
                this.handleDocumentDuelAction(room, player, action, payload);
                break;
        }
    }
    
    startGame(room) {
        room.status = 'playing';
        room.gameState = { 
            round: 1,
            startTime: new Date().toISOString(),
            ...this.initializeGameState(room.gameType)
        };
        
        this.activeGames.set(room.id, room);
        
        this.io.to(room.id).emit('game-started', {
            gameType: room.gameType,
            gameState: room.gameState,
            players: room.players,
            teams: room.teams
        });
        
        console.log(`🎮 Game started in ${room.name}: ${room.gameType}`);
        
        // Start game-specific logic
        switch (room.gameType) {
            case 'swipe-vote':
                this.startSwipeVoteGame(room);
                break;
            case 'voice-debate':
                this.startVoiceDebateGame(room);
                break;
            case 'quick-build':
                this.startQuickBuildGame(room);
                break;
        }
    }
    
    initializeGameState(gameType) {
        switch (gameType) {
            case 'swipe-vote':
                return {
                    currentItem: this.getRandomSwipeItem(),
                    swipes: [],
                    scores: { saveOrSink: 0, dealOrDelete: 0 }
                };
            case 'voice-debate':
                return {
                    topic: this.getRandomDebateTopic(),
                    speakingTime: { saveOrSink: 0, dealOrDelete: 0 },
                    currentSpeaker: null
                };
            case 'quick-build':
                return {
                    challenge: this.getRandomBuildChallenge(),
                    submissions: [],
                    timeLimit: 300 // 5 minutes
                };
            default:
                return {};
        }
    }
    
    startSwipeVoteGame(room) {
        this.io.to(room.id).emit('swipe-item', {
            item: room.gameState.currentItem,
            instructions: 'Swipe left to SINK 💥, swipe right to SAVE 💚',
            round: room.gameState.round
        });
    }
    
    getRandomSwipeItem() {
        const items = [
            { type: 'app-idea', content: 'AI-powered pet translator app', emoji: '🐕' },
            { type: 'business', content: 'Subscription service for houseplants', emoji: '🌱' },
            { type: 'feature', content: 'Dark mode for refrigerators', emoji: '❄️' },
            { type: 'startup', content: 'Uber but for grocery shopping', emoji: '🛒' },
            { type: 'product', content: 'Smart socks that detect holes', emoji: '🧦' },
            { type: 'service', content: 'AI dating coach for introverts', emoji: '💕' },
            { type: 'invention', content: 'Self-folding laundry machine', emoji: '👕' },
            { type: 'app-idea', content: 'Social media for houseplants', emoji: '📱' }
        ];
        
        return items[Math.floor(Math.random() * items.length)];
    }
    
    getRandomDebateTopic() {
        const topics = [
            'Should AI replace human customer service?',
            'Is remote work better than office work?',
            'Should social media require age verification?',
            'Is cryptocurrency the future of money?',
            'Should apps charge for dark mode?'
        ];
        
        return topics[Math.floor(Math.random() * topics.length)];
    }
    
    getRandomBuildChallenge() {
        const challenges = [
            'Build a simple calculator with voice commands',
            'Create a to-do app that speaks back to you',
            'Design a game where you swipe to make decisions',
            'Build a chat app with custom emoji reactions',
            'Create a weather app with personality'
        ];
        
        return challenges[Math.floor(Math.random() * challenges.length)];
    }
    
    getTeamSwipeResults(room) {
        const swipes = room.gameState.swipes || [];
        const teamResults = {
            saveOrSink: { left: 0, right: 0 },
            dealOrDelete: { left: 0, right: 0 }
        };
        
        swipes.forEach(swipe => {
            if (swipe.direction === 'left') {
                teamResults[swipe.team].left++;
            } else if (swipe.direction === 'right') {
                teamResults[swipe.team].right++;
            }
        });
        
        return teamResults;
    }
    
    endSwipeRound(room) {
        const results = this.getTeamSwipeResults(room);
        
        // Determine winner
        const saveOrSinkTotal = results.saveOrSink.left + results.saveOrSink.right;
        const dealOrDeleteTotal = results.dealOrDelete.left + results.dealOrDelete.right;
        const saveVotes = results.saveOrSink.right + results.dealOrDelete.right;
        const sinkVotes = results.saveOrSink.left + results.dealOrDelete.left;
        
        const outcome = saveVotes > sinkVotes ? 'SAVED' : 'SUNK';
        const winner = saveVotes > sinkVotes ? 'Team Save' : 'Team Sink';
        
        this.io.to(room.id).emit('round-ended', {
            results,
            outcome,
            winner,
            item: room.gameState.currentItem,
            saveVotes,
            sinkVotes
        });
        
        // Prepare next round
        setTimeout(() => {
            room.gameState.round++;
            room.gameState.currentItem = this.getRandomSwipeItem();
            room.gameState.swipes = [];
            
            if (room.gameState.round <= 5) {
                this.startSwipeVoteGame(room);
            } else {
                this.endGame(room);
            }
        }, 3000);
    }
    
    endGame(room) {
        room.status = 'finished';
        
        this.io.to(room.id).emit('game-ended', {
            finalResults: this.calculateFinalScores(room),
            duration: new Date() - new Date(room.gameState.startTime),
            gameType: room.gameType
        });
        
        console.log(`🎮 Game ended in ${room.name}`);
        
        // Clean up after 30 seconds
        setTimeout(() => {
            this.activeGames.delete(room.id);
        }, 30000);
    }
    
    calculateFinalScores(room) {
        // Game-specific scoring logic
        return {
            teams: room.teams,
            mvp: this.getMVP(room),
            stats: room.gameState
        };
    }
    
    getMVP(room) {
        // Simple MVP calculation - most active player
        const swipeCounts = {};
        room.gameState.swipes?.forEach(swipe => {
            swipeCounts[swipe.playerId] = (swipeCounts[swipe.playerId] || 0) + 1;
        });
        
        const mvpId = Object.keys(swipeCounts).reduce((a, b) => 
            swipeCounts[a] > swipeCounts[b] ? a : b, Object.keys(swipeCounts)[0]
        );
        
        return room.players.find(p => p.id === mvpId);
    }
    
    generateRoomId() {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
    }
    
    // Voice debate game handlers
    handleVoiceDebateAction(room, player, action, payload) {
        // Implementation for voice debate mechanics
        console.log(`🎙️ Voice debate action: ${action} from ${player.name}`);
    }
    
    // Quick build game handlers  
    handleQuickBuildAction(room, player, action, payload) {
        // Implementation for quick build challenges
        console.log(`🔨 Quick build action: ${action} from ${player.name}`);
    }
    
    // ShipRekt game handlers
    handleShipRektAction(room, player, action, payload) {
        // Implementation for ShipRekt battle mechanics
        console.log(`⚔️ ShipRekt action: ${action} from ${player.name}`);
    }
    
    // Document duel handlers
    handleDocumentDuelAction(room, player, action, payload) {
        // Implementation for document review competitions
        console.log(`📄 Document duel action: ${action} from ${player.name}`);
    }
    
    generateGamingInterface() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>🎮🗣️ Interactive Group Chat Games</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff88;
            height: 100vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: rgba(0, 255, 136, 0.1);
            padding: 10px 20px;
            border-bottom: 2px solid #00ff88;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .main-container {
            flex: 1;
            display: grid;
            grid-template-columns: 300px 1fr 250px;
            gap: 10px;
            padding: 10px;
            overflow: hidden;
        }
        
        .sidebar {
            background: rgba(26, 26, 46, 0.8);
            border: 1px solid #00ff88;
            border-radius: 8px;
            padding: 15px;
            overflow-y: auto;
        }
        
        .game-area {
            background: rgba(26, 26, 46, 0.8);
            border: 1px solid #00ff88;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
        }
        
        .swipe-zone {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            touch-action: none;
        }
        
        .swipe-card {
            width: 300px;
            height: 400px;
            background: linear-gradient(135deg, #2a2a2a, #1a1a2e);
            border: 2px solid #00ff88;
            border-radius: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 30px;
            cursor: grab;
            transition: transform 0.3s ease;
            user-select: none;
        }
        
        .swipe-card:active {
            cursor: grabbing;
        }
        
        .swipe-card.swiping-left {
            transform: translateX(-100px) rotate(-10deg);
            border-color: #ff6666;
        }
        
        .swipe-card.swiping-right {
            transform: translateX(100px) rotate(10deg);
            border-color: #66ff66;
        }
        
        .swipe-card .emoji {
            font-size: 4em;
            margin-bottom: 20px;
        }
        
        .swipe-card .content {
            font-size: 1.2em;
            line-height: 1.4;
        }
        
        .swipe-hints {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 40px;
            font-size: 1.2em;
        }
        
        .hint-left {
            color: #ff6666;
        }
        
        .hint-right {
            color: #66ff66;
        }
        
        .chat-container {
            height: 200px;
            border-top: 1px solid #333;
            display: flex;
            flex-direction: column;
        }
        
        .chat-messages {
            flex: 1;
            padding: 10px;
            overflow-y: auto;
            font-size: 0.9em;
        }
        
        .message {
            margin: 5px 0;
            padding: 5px 10px;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.4);
        }
        
        .message.save-or-sink { border-left: 4px solid #00ff88; }
        .message.deal-or-delete { border-left: 4px solid #ff6666; }
        .message.system { border-left: 4px solid #888; color: #888; }
        
        .chat-input {
            display: flex;
            padding: 10px;
            gap: 10px;
        }
        
        .chat-input input {
            flex: 1;
            padding: 8px;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid #00ff88;
            border-radius: 4px;
            color: #00ff88;
            font-size: 0.9em;
        }
        
        .chat-input button {
            padding: 8px 15px;
            background: #00ff88;
            color: #001122;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
        }
        
        .player-list {
            list-style: none;
            margin: 10px 0;
        }
        
        .player-item {
            padding: 8px;
            margin: 5px 0;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .player-item.speaking {
            border: 2px solid #ffff00;
            animation: pulse 1s ease-in-out infinite;
        }
        
        .player-item.ready {
            border-left: 4px solid #00ff88;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .game-controls {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 15px 0;
        }
        
        .game-btn {
            padding: 10px;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid #00ff88;
            border-radius: 4px;
            color: #00ff88;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
        }
        
        .game-btn:hover {
            background: rgba(0, 255, 136, 0.1);
        }
        
        .game-btn.active {
            background: #00ff88;
            color: #001122;
        }
        
        .game-status {
            background: rgba(0, 0, 0, 0.6);
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
        }
        
        .team-indicator {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
        }
        
        .team-save-or-sink {
            background: #00ff88;
            color: #001122;
        }
        
        .team-deal-or-delete {
            background: #ff6666;
            color: #fff;
        }
        
        .mobile-controls {
            display: none;
        }
        
        @media (max-width: 768px) {
            .main-container {
                grid-template-columns: 1fr;
                grid-template-rows: 1fr auto auto;
            }
            
            .mobile-controls {
                display: flex;
                justify-content: space-around;
                padding: 10px;
                background: rgba(26, 26, 46, 0.8);
                border-top: 1px solid #00ff88;
            }
            
            .mobile-btn {
                padding: 15px;
                background: rgba(0, 0, 0, 0.6);
                border: 1px solid #00ff88;
                border-radius: 50%;
                color: #00ff88;
                font-size: 1.5em;
                cursor: pointer;
            }
        }
        
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            z-index: 1000;
            display: none;
        }
        
        .loading.active {
            display: block;
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid #00ff88;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>
    <div class="header">
        <h1>🎮🗣️ Interactive Group Chat Games</h1>
        <div>
            <span id="roomName">Lobby</span> | 
            <span id="playerCount">0</span> players |
            <span id="gameStatus">Waiting</span>
        </div>
    </div>
    
    <div class="main-container">
        <!-- Left Sidebar - Players & Controls -->
        <div class="sidebar">
            <h3>👥 Players</h3>
            <ul class="player-list" id="playerList">
                <!-- Players will be populated here -->
            </ul>
            
            <div class="game-controls">
                <button class="game-btn" id="readyBtn" onclick="toggleReady()">🎯 Ready to Play</button>
                <button class="game-btn" id="voiceBtn" onclick="toggleVoice()">🎤 Voice Chat</button>
                <button class="game-btn" onclick="startGame()">🚀 Start Game</button>
            </div>
            
            <div class="game-status" id="gameStatus">
                <h4>🎮 Current Game</h4>
                <p><strong>Type:</strong> <span id="gameType">Swipe Vote Battle</span></p>
                <p><strong>Round:</strong> <span id="currentRound">-</span></p>
                <p><strong>Score:</strong> <span id="teamScores">0 - 0</span></p>
            </div>
        </div>
        
        <!-- Center - Game Area -->
        <div class="game-area">
            <div class="swipe-zone" id="swipeZone">
                <div class="swipe-hints">
                    <div class="hint-left">← SINK 💥</div>
                    <div class="hint-right">SAVE 💚 →</div>
                </div>
                
                <div class="swipe-card" id="swipeCard">
                    <div class="emoji">🎮</div>
                    <div class="content">
                        <h2>Welcome to Group Chat Games!</h2>
                        <p>Join a room and start playing interactive games with voice chat and swipe mechanics.</p>
                        <br>
                        <p>Swipe left to SINK ideas, swipe right to SAVE them!</p>
                    </div>
                </div>
            </div>
            
            <div class="chat-container">
                <div class="chat-messages" id="chatMessages">
                    <div class="message system">
                        <strong>System:</strong> Welcome! Join a game room to start playing.
                    </div>
                </div>
                
                <div class="chat-input">
                    <input type="text" id="messageInput" placeholder="Type a message... (try /ready or /start)" onkeypress="handleKeyPress(event)">
                    <button onclick="sendMessage()">Send</button>
                </div>
            </div>
        </div>
        
        <!-- Right Sidebar - Game Info -->
        <div class="sidebar">
            <h3>🎯 Game Types</h3>
            <div class="game-controls">
                <div class="game-btn" onclick="selectGameType('swipe-vote')">📱 Swipe Vote Battle</div>
                <div class="game-btn" onclick="selectGameType('voice-debate')">🎙️ Voice Debate Arena</div>
                <div class="game-btn" onclick="selectGameType('quick-build')">⚡ Speed Building</div>
                <div class="game-btn" onclick="selectGameType('shiprekt')">⚔️ ShipRekt Battle</div>
            </div>
            
            <h4>📊 Live Stats</h4>
            <div id="liveStats">
                <p>Total Swipes: <span id="totalSwipes">0</span></p>
                <p>Voice Active: <span id="voiceActive">0</span></p>
                <p>Team Battle: <span id="teamBattle">SaveOrSink vs DealOrDelete</span></p>
            </div>
            
            <h4>🎮 Quick Actions</h4>
            <button class="game-btn" onclick="createRoom()">➕ Create Room</button>
            <button class="game-btn" onclick="joinRandomRoom()">🎲 Random Room</button>
        </div>
    </div>
    
    <!-- Mobile Controls -->
    <div class="mobile-controls">
        <button class="mobile-btn" onclick="swipeLeft()">👈</button>
        <button class="mobile-btn" onclick="toggleVoice()">🎤</button>
        <button class="mobile-btn" onclick="sendMessage()">💬</button>
        <button class="mobile-btn" onclick="swipeRight()">👉</button>
    </div>
    
    <div class="loading" id="loading">
        <div class="spinner"></div>
        <p>Connecting to game...</p>
    </div>
    
    <script>
        // Initialize socket connection
        const socket = io();
        
        let gameState = {
            connected: false,
            playerName: '',
            team: '',
            roomId: '',
            ready: false,
            voiceEnabled: false,
            currentGameType: 'swipe-vote'
        };
        
        let swipeState = {
            isDragging: false,
            startX: 0,
            currentX: 0,
            card: null
        };
        
        // Auto-join on load
        window.addEventListener('load', () => {
            showLoading(true);
            
            const playerName = prompt('Enter your player name:') || \`Player_\${Date.now().toString().slice(-4)}\`;
            gameState.playerName = playerName;
            
            // Auto-join main room or create one
            joinRoom('MAIN-LOBBY', playerName);
        });
        
        // Socket event handlers
        socket.on('connect', () => {
            gameState.connected = true;
            showLoading(false);
            console.log('🎮 Connected to game server');
        });
        
        socket.on('player-joined', (data) => {
            addPlayer(data.player);
            addSystemMessage(\`\${data.player.name} joined the game! (Team: \${data.player.team})\`);
            updateRoomInfo(data.room);
        });
        
        socket.on('player-left', (data) => {
            removePlayer(data.playerId);
            addSystemMessage(\`\${data.playerName} left the game\`);
            updateRoomInfo(data.room);
        });
        
        socket.on('game-state', (data) => {
            updateGameState(data);
            showLoading(false);
        });
        
        socket.on('new-message', (message) => {
            addMessage(message);
        });
        
        socket.on('player-voice-activity', (data) => {
            updatePlayerVoiceActivity(data.playerId, data.speaking);
        });
        
        socket.on('player-ready-state', (data) => {
            updatePlayerReady(data.playerId, data.ready);
        });
        
        socket.on('swipe-item', (data) => {
            updateSwipeCard(data.item);
            addSystemMessage(\`Round \${data.round}: \${data.instructions}\`);
        });
        
        socket.on('swipe-result', (data) => {
            showSwipeResult(data);
            updateStats(data);
        });
        
        socket.on('round-ended', (data) => {
            showRoundResults(data);
        });
        
        socket.on('game-started', (data) => {
            addSystemMessage(\`🎮 Game started: \${data.gameType}\`);
            document.getElementById('gameStatus').textContent = 'Playing';
        });
        
        socket.on('game-ended', (data) => {
            showGameResults(data);
        });
        
        socket.on('system-message', (data) => {
            addSystemMessage(data.message, data.type);
        });
        
        // Game functions
        function joinRoom(roomId, playerName) {
            gameState.roomId = roomId;
            gameState.team = Math.random() > 0.5 ? 'saveOrSink' : 'dealOrDelete';
            
            socket.emit('join-game', {
                roomId,
                playerName,
                team: gameState.team,
                avatar: '🎮'
            });
            
            document.getElementById('roomName').textContent = roomId;
        }
        
        function createRoom() {
            const roomName = prompt('Room name:') || \`Room_\${Date.now().toString().slice(-4)}\`;
            
            fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: roomName,
                    gameType: gameState.currentGameType,
                    maxPlayers: 8
                })
            })
            .then(res => res.json())
            .then(room => {
                joinRoom(room.id, gameState.playerName);
            })
            .catch(err => {
                console.error('Failed to create room:', err);
                addSystemMessage('Failed to create room', 'error');
            });
        }
        
        function joinRandomRoom() {
            fetch('/api/rooms')
            .then(res => res.json())
            .then(rooms => {
                const openRooms = rooms.filter(r => r.players < r.maxPlayers && r.status === 'waiting');
                if (openRooms.length > 0) {
                    const randomRoom = openRooms[Math.floor(Math.random() * openRooms.length)];
                    joinRoom(randomRoom.id, gameState.playerName);
                } else {
                    addSystemMessage('No open rooms found, creating a new one...');
                    createRoom();
                }
            })
            .catch(err => {
                console.error('Failed to find rooms:', err);
                createRoom();
            });
        }
        
        function toggleReady() {
            gameState.ready = !gameState.ready;
            
            socket.emit('player-ready', { ready: gameState.ready });
            
            const btn = document.getElementById('readyBtn');
            if (gameState.ready) {
                btn.textContent = '✅ Ready!';
                btn.classList.add('active');
            } else {
                btn.textContent = '🎯 Ready to Play';
                btn.classList.remove('active');
            }
        }
        
        function toggleVoice() {
            gameState.voiceEnabled = !gameState.voiceEnabled;
            
            const btn = document.getElementById('voiceBtn');
            if (gameState.voiceEnabled) {
                startVoiceChat();
                btn.textContent = '🔇 Mute';
                btn.classList.add('active');
            } else {
                stopVoiceChat();
                btn.textContent = '🎤 Voice Chat';
                btn.classList.remove('active');
            }
        }
        
        function startVoiceChat() {
            navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                socket.emit('voice-activity', { speaking: true });
                addSystemMessage('🎤 Voice chat enabled');
            })
            .catch(err => {
                console.error('Failed to access microphone:', err);
                addSystemMessage('Failed to access microphone', 'error');
                gameState.voiceEnabled = false;
            });
        }
        
        function stopVoiceChat() {
            socket.emit('voice-activity', { speaking: false });
            addSystemMessage('🔇 Voice chat disabled');
        }
        
        function startGame() {
            if (gameState.ready) {
                socket.emit('game-action', { action: 'start' });
            } else {
                addSystemMessage('You must be ready to start the game!', 'warning');
            }
        }
        
        function selectGameType(gameType) {
            gameState.currentGameType = gameType;
            document.getElementById('gameType').textContent = gameType;
            addSystemMessage(\`Game type selected: \${gameType}\`);
        }
        
        // Swipe mechanics
        function setupSwipeHandlers() {
            const card = document.getElementById('swipeCard');
            swipeState.card = card;
            
            // Mouse events
            card.addEventListener('mousedown', startSwipe);
            document.addEventListener('mousemove', handleSwipe);
            document.addEventListener('mouseup', endSwipe);
            
            // Touch events
            card.addEventListener('touchstart', startSwipe, { passive: false });
            document.addEventListener('touchmove', handleSwipe, { passive: false });
            document.addEventListener('touchend', endSwipe);
        }
        
        function startSwipe(e) {
            e.preventDefault();
            swipeState.isDragging = true;
            swipeState.startX = e.clientX || e.touches[0].clientX;
            swipeState.card.style.transition = 'none';
        }
        
        function handleSwipe(e) {
            if (!swipeState.isDragging) return;
            
            e.preventDefault();
            swipeState.currentX = (e.clientX || e.touches[0].clientX) - swipeState.startX;
            
            const card = swipeState.card;
            const threshold = 100;
            
            card.style.transform = \`translateX(\${swipeState.currentX}px) rotate(\${swipeState.currentX * 0.1}deg)\`;
            
            // Visual feedback
            if (swipeState.currentX < -threshold) {
                card.classList.add('swiping-left');
                card.classList.remove('swiping-right');
            } else if (swipeState.currentX > threshold) {
                card.classList.add('swiping-right');
                card.classList.remove('swiping-left');
            } else {
                card.classList.remove('swiping-left', 'swiping-right');
            }
        }
        
        function endSwipe(e) {
            if (!swipeState.isDragging) return;
            
            swipeState.isDragging = false;
            const card = swipeState.card;
            const threshold = 100;
            
            card.style.transition = 'transform 0.3s ease';
            
            if (Math.abs(swipeState.currentX) > threshold) {
                const direction = swipeState.currentX > 0 ? 'right' : 'left';
                performSwipe(direction);
            } else {
                // Snap back
                card.style.transform = 'translateX(0) rotate(0)';
                card.classList.remove('swiping-left', 'swiping-right');
            }
            
            swipeState.currentX = 0;
        }
        
        function performSwipe(direction) {
            const cardContent = document.querySelector('.swipe-card .content').textContent;
            
            socket.emit('swipe-action', {
                direction,
                item: cardContent,
                context: 'game'
            });
            
            addSystemMessage(\`You swiped \${direction === 'left' ? 'SINK 💥' : 'SAVE 💚'}\`);
            
            // Reset card after animation
            setTimeout(() => {
                resetSwipeCard();
            }, 500);
        }
        
        function swipeLeft() {
            performSwipe('left');
        }
        
        function swipeRight() {
            performSwipe('right');
        }
        
        function resetSwipeCard() {
            const card = swipeState.card;
            card.style.transform = 'translateX(0) rotate(0)';
            card.classList.remove('swiping-left', 'swiping-right');
        }
        
        function updateSwipeCard(item) {
            const card = document.getElementById('swipeCard');
            card.innerHTML = \`
                <div class="emoji">\${item.emoji}</div>
                <div class="content">
                    <h2>\${item.type.toUpperCase()}</h2>
                    <p>\${item.content}</p>
                </div>
            \`;
            resetSwipeCard();
        }
        
        // Chat functions
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (message) {
                socket.emit('chat-message', { message });
                input.value = '';
            }
        }
        
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
        
        function addMessage(message) {
            const chatMessages = document.getElementById('chatMessages');
            const messageEl = document.createElement('div');
            messageEl.className = \`message \${message.team}\`;
            
            const timeString = new Date(message.timestamp).toLocaleTimeString();
            messageEl.innerHTML = \`
                <strong>\${message.playerName}:</strong> \${message.message}
                <small style="color: #888; margin-left: 10px;">\${timeString}</small>
            \`;
            
            chatMessages.appendChild(messageEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        function addSystemMessage(text, type = 'info') {
            const chatMessages = document.getElementById('chatMessages');
            const messageEl = document.createElement('div');
            messageEl.className = \`message system\`;
            
            const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
            messageEl.innerHTML = \`
                <strong>System:</strong> \${icon} \${text}
                <small style="color: #888; margin-left: 10px;">\${new Date().toLocaleTimeString()}</small>
            \`;
            
            chatMessages.appendChild(messageEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        // UI update functions
        function addPlayer(player) {
            const playerList = document.getElementById('playerList');
            const playerEl = document.createElement('li');
            playerEl.className = \`player-item \${player.team}\`;
            playerEl.id = \`player-\${player.id}\`;
            
            playerEl.innerHTML = \`
                <div>
                    <strong>\${player.name}</strong>
                    <span class="team-indicator team-\${player.team.replace('Or', '-or-').toLowerCase()}">\${player.team}</span>
                </div>
                <div>\${player.avatar}</div>
            \`;
            
            playerList.appendChild(playerEl);
            updatePlayerCount();
        }
        
        function removePlayer(playerId) {
            const playerEl = document.getElementById(\`player-\${playerId}\`);
            if (playerEl) {
                playerEl.remove();
                updatePlayerCount();
            }
        }
        
        function updatePlayerVoiceActivity(playerId, speaking) {
            const playerEl = document.getElementById(\`player-\${playerId}\`);
            if (playerEl) {
                if (speaking) {
                    playerEl.classList.add('speaking');
                } else {
                    playerEl.classList.remove('speaking');
                }
            }
        }
        
        function updatePlayerReady(playerId, ready) {
            const playerEl = document.getElementById(\`player-\${playerId}\`);
            if (playerEl) {
                if (ready) {
                    playerEl.classList.add('ready');
                } else {
                    playerEl.classList.remove('ready');
                }
            }
        }
        
        function updatePlayerCount() {
            const count = document.querySelectorAll('.player-item').length;
            document.getElementById('playerCount').textContent = count;
        }
        
        function updateRoomInfo(room) {
            if (room) {
                document.getElementById('playerCount').textContent = room.playerCount;
            }
        }
        
        function updateGameState(data) {
            if (data.room) {
                document.getElementById('roomName').textContent = data.room.name;
                document.getElementById('gameType').textContent = data.gameType || 'Swipe Vote Battle';
            }
            
            if (data.players) {
                // Clear and repopulate player list
                document.getElementById('playerList').innerHTML = '';
                data.players.forEach(player => addPlayer(player));
            }
        }
        
        function showSwipeResult(data) {
            const totalSwipes = data.totalSwipes;
            document.getElementById('totalSwipes').textContent = totalSwipes;
            
            // Show visual feedback
            addSystemMessage(\`Swipe recorded! Total: \${totalSwipes}\`);
        }
        
        function showRoundResults(data) {
            addSystemMessage(\`🎯 Round Result: \${data.item.content} was \${data.outcome}! Winner: \${data.winner}\`);
            addSystemMessage(\`📊 Votes - Save: \${data.saveVotes}, Sink: \${data.sinkVotes}\`);
        }
        
        function showGameResults(data) {
            addSystemMessage(\`🏆 Game Over! Check the final results.\`);
            
            if (data.finalResults && data.finalResults.mvp) {
                addSystemMessage(\`👑 MVP: \${data.finalResults.mvp.name}\`);
            }
        }
        
        function updateStats(data) {
            // Update live stats
            if (data.totalSwipes) {
                document.getElementById('totalSwipes').textContent = data.totalSwipes;
            }
        }
        
        function showLoading(show) {
            const loading = document.getElementById('loading');
            if (show) {
                loading.classList.add('active');
            } else {
                loading.classList.remove('active');
            }
        }
        
        // Initialize swipe handlers when page loads
        window.addEventListener('load', () => {
            setupSwipeHandlers();
        });
        
        // Update voice active count
        setInterval(() => {
            const activeCount = document.querySelectorAll('.player-item.speaking').length;
            document.getElementById('voiceActive').textContent = activeCount;
        }, 1000);
    </script>
</body>
</html>`;
    }
    
    generateMobileInterface() {
        // Simplified mobile-optimized version
        return this.generateGamingInterface().replace(
            'grid-template-columns: 300px 1fr 250px',
            'grid-template-columns: 1fr'
        );
    }
    
    start() {
        this.server.listen(this.port, () => {
            console.log('🎮🗣️ INTERACTIVE GROUP CHAT GAMES');
            console.log('=====================================');
            console.log(`⚡ Server running at: http://localhost:${this.port}`);
            console.log(`📱 Mobile version: http://localhost:${this.port}/mobile`);
            console.log(`🎮 Game Types: Swipe Vote, Voice Debate, Quick Build, ShipRekt`);
            console.log(`🗣️ Voice Chat: WebRTC + Socket.IO real-time`);
            console.log(`📱 Touch/Swipe: Full mobile support`);
            console.log(`👥 Teams: SaveOrSink vs DealOrDelete`);
            console.log('\n🎯 Ready for interactive group gaming!');
        });
    }
}

// Start the service
if (require.main === module) {
    const gameServer = new InteractiveGroupChatGames();
    gameServer.start();
}

module.exports = InteractiveGroupChatGames;