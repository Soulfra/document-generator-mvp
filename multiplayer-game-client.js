#!/usr/bin/env node

/**
 * Multiplayer Game Client
 * Handles real-time synchronization for the HyperCam Arena
 */

class MultiplayerGameClient {
    constructor(options = {}) {
        this.serverUrl = options.serverUrl || 'ws://localhost:2567';
        this.roomId = options.roomId || 'default';
        this.playerId = null;
        this.socket = null;
        this.connected = false;
        
        // Game state sync
        this.localPlayer = null;
        this.remotePlayers = new Map();
        this.projectiles = new Map();
        this.gameState = {
            arena: { width: 2000, height: 2000 },
            mode: 'deathmatch',
            timeLimit: 600, // 10 minutes
            scoreLimit: 50
        };
        
        // Network optimization
        this.sendRate = 60; // Updates per second
        this.interpolationDelay = 100; // ms
        this.predictionEnabled = true;
        this.lastUpdateTime = 0;
        
        // Recording metadata
        this.recordingMetadata = {
            events: [],
            highlights: [],
            playerStats: new Map()
        };
        
        // Event handlers
        this.eventHandlers = new Map();
    }
    
    // Connect to game server
    async connect(playerData) {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(this.serverUrl);
                
                this.socket.onopen = () => {
                    console.log('🔌 Connected to multiplayer server');
                    this.connected = true;
                    
                    // Send join request
                    this.send('join', {
                        roomId: this.roomId,
                        player: playerData
                    });
                    
                    resolve();
                };
                
                this.socket.onmessage = (event) => {
                    this.handleMessage(JSON.parse(event.data));
                };
                
                this.socket.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    reject(error);
                };
                
                this.socket.onclose = () => {
                    console.log('🔌 Disconnected from server');
                    this.connected = false;
                    this.emit('disconnected');
                };
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Send message to server
    send(type, data) {
        if (this.connected && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, data, timestamp: Date.now() }));
        }
    }
    
    // Handle incoming messages
    handleMessage(message) {
        const { type, data } = message;
        
        switch (type) {
            case 'joined':
                this.handleJoined(data);
                break;
                
            case 'playerUpdate':
                this.handlePlayerUpdate(data);
                break;
                
            case 'playerLeft':
                this.handlePlayerLeft(data);
                break;
                
            case 'projectileSpawned':
                this.handleProjectileSpawned(data);
                break;
                
            case 'projectileHit':
                this.handleProjectileHit(data);
                break;
                
            case 'playerKilled':
                this.handlePlayerKilled(data);
                break;
                
            case 'gameStateUpdate':
                this.handleGameStateUpdate(data);
                break;
                
            case 'chatMessage':
                this.handleChatMessage(data);
                break;
                
            case 'highlight':
                this.handleHighlight(data);
                break;
                
            default:
                this.emit(type, data);
        }
    }
    
    handleJoined(data) {
        this.playerId = data.playerId;
        this.localPlayer = data.player;
        this.gameState = { ...this.gameState, ...data.gameState };
        
        // Initialize other players
        data.players.forEach(player => {
            if (player.id !== this.playerId) {
                this.remotePlayers.set(player.id, {
                    ...player,
                    interpolation: {
                        positions: [],
                        lastUpdate: Date.now()
                    }
                });
            }
        });
        
        this.emit('joined', data);
        console.log(`✅ Joined room ${this.roomId} as ${this.localPlayer.name}`);
    }
    
    handlePlayerUpdate(data) {
        const { playerId, position, rotation, velocity, health, score } = data;
        
        if (playerId === this.playerId) return; // Ignore own updates
        
        const player = this.remotePlayers.get(playerId);
        if (player) {
            // Add to interpolation buffer
            player.interpolation.positions.push({
                position,
                rotation,
                velocity,
                timestamp: Date.now()
            });
            
            // Keep buffer size reasonable
            if (player.interpolation.positions.length > 10) {
                player.interpolation.positions.shift();
            }
            
            // Update other properties
            player.health = health;
            player.score = score;
            
            player.interpolation.lastUpdate = Date.now();
        }
    }
    
    handlePlayerLeft(data) {
        const { playerId } = data;
        this.remotePlayers.delete(playerId);
        this.emit('playerLeft', playerId);
        
        // Record event for highlights
        this.recordEvent({
            type: 'playerLeft',
            playerId,
            timestamp: Date.now()
        });
    }
    
    handleProjectileSpawned(data) {
        const { projectileId, position, velocity, owner } = data;
        
        this.projectiles.set(projectileId, {
            id: projectileId,
            position: { ...position },
            velocity: { ...velocity },
            owner,
            spawnTime: Date.now()
        });
        
        this.emit('projectileSpawned', data);
    }
    
    handleProjectileHit(data) {
        const { projectileId, targetId, damage } = data;
        
        this.projectiles.delete(projectileId);
        
        // Update health if target is local player
        if (targetId === this.playerId && this.localPlayer) {
            this.localPlayer.health -= damage;
        }
        
        this.emit('projectileHit', data);
        
        // Record for highlights
        this.recordEvent({
            type: 'hit',
            projectileId,
            targetId,
            damage,
            timestamp: Date.now()
        });
    }
    
    handlePlayerKilled(data) {
        const { victimId, killerId } = data;
        
        this.emit('playerKilled', data);
        
        // Record kill for highlights
        this.recordEvent({
            type: 'kill',
            victimId,
            killerId,
            timestamp: Date.now()
        });
        
        // Check for highlight-worthy moments
        this.checkForHighlights(data);
    }
    
    handleGameStateUpdate(data) {
        this.gameState = { ...this.gameState, ...data };
        this.emit('gameStateUpdate', this.gameState);
    }
    
    handleChatMessage(data) {
        this.emit('chatMessage', data);
        
        // Record chat for replay
        this.recordEvent({
            type: 'chat',
            ...data,
            timestamp: Date.now()
        });
    }
    
    handleHighlight(data) {
        this.recordingMetadata.highlights.push(data);
        this.emit('highlight', data);
    }
    
    // Send player update
    updatePlayer(playerState) {
        if (!this.connected) return;
        
        const now = Date.now();
        if (now - this.lastUpdateTime < 1000 / this.sendRate) return;
        
        this.send('playerUpdate', {
            position: playerState.position,
            rotation: playerState.rotation,
            velocity: playerState.velocity,
            health: playerState.health,
            score: playerState.score
        });
        
        this.lastUpdateTime = now;
    }
    
    // Spawn projectile
    spawnProjectile(projectileData) {
        this.send('spawnProjectile', projectileData);
    }
    
    // Send chat message
    sendChat(message) {
        this.send('chat', {
            message,
            sender: this.localPlayer.name,
            color: this.localPlayer.color
        });
    }
    
    // Interpolate remote player positions
    interpolatePlayers() {
        const now = Date.now();
        const renderTime = now - this.interpolationDelay;
        
        this.remotePlayers.forEach(player => {
            const positions = player.interpolation.positions;
            if (positions.length < 2) return;
            
            // Find interpolation points
            let before = null;
            let after = null;
            
            for (let i = 0; i < positions.length - 1; i++) {
                if (positions[i].timestamp <= renderTime && 
                    positions[i + 1].timestamp >= renderTime) {
                    before = positions[i];
                    after = positions[i + 1];
                    break;
                }
            }
            
            if (before && after) {
                // Interpolate between positions
                const t = (renderTime - before.timestamp) / 
                         (after.timestamp - before.timestamp);
                
                player.x = before.position.x + (after.position.x - before.position.x) * t;
                player.y = before.position.y + (after.position.y - before.position.y) * t;
                player.angle = this.lerpAngle(before.rotation, after.rotation, t);
            }
        });
    }
    
    // Angle interpolation helper
    lerpAngle(a, b, t) {
        let diff = b - a;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return a + diff * t;
    }
    
    // Update projectiles
    updateProjectiles(deltaTime) {
        this.projectiles.forEach((projectile, id) => {
            projectile.position.x += projectile.velocity.x * deltaTime;
            projectile.position.y += projectile.velocity.y * deltaTime;
            
            // Remove old projectiles
            if (Date.now() - projectile.spawnTime > 5000) {
                this.projectiles.delete(id);
            }
        });
    }
    
    // Record event for replay/highlights
    recordEvent(event) {
        this.recordingMetadata.events.push(event);
        
        // Keep event history reasonable
        if (this.recordingMetadata.events.length > 1000) {
            this.recordingMetadata.events.shift();
        }
    }
    
    // Check for highlight-worthy moments
    checkForHighlights(killData) {
        const killer = this.remotePlayers.get(killData.killerId) || this.localPlayer;
        if (!killer) return;
        
        // Multi-kill detection
        const recentKills = this.recordingMetadata.events
            .filter(e => e.type === 'kill' && e.killerId === killData.killerId)
            .filter(e => Date.now() - e.timestamp < 5000);
        
        if (recentKills.length >= 3) {
            this.recordingMetadata.highlights.push({
                type: 'multikill',
                player: killer.name,
                kills: recentKills.length,
                timestamp: Date.now()
            });
            
            this.emit('highlight', {
                type: 'multikill',
                message: `${killer.name} got a ${recentKills.length}x MULTI-KILL!`
            });
        }
        
        // Long-range kill detection
        if (killData.distance && killData.distance > 500) {
            this.recordingMetadata.highlights.push({
                type: 'longshot',
                player: killer.name,
                distance: killData.distance,
                timestamp: Date.now()
            });
            
            this.emit('highlight', {
                type: 'longshot',
                message: `${killer.name} with a LONG SHOT from ${Math.round(killData.distance)}m!`
            });
        }
    }
    
    // Generate highlight reel data
    generateHighlightReel() {
        const highlights = this.recordingMetadata.highlights
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10); // Top 10 moments
        
        return {
            highlights,
            playerStats: this.getPlayerStats(),
            duration: this.getSessionDuration(),
            timestamp: Date.now()
        };
    }
    
    // Get player statistics
    getPlayerStats() {
        const stats = new Map();
        
        // Count kills, deaths, etc.
        this.recordingMetadata.events.forEach(event => {
            if (event.type === 'kill') {
                const killerStats = stats.get(event.killerId) || { kills: 0, deaths: 0 };
                killerStats.kills++;
                stats.set(event.killerId, killerStats);
                
                const victimStats = stats.get(event.victimId) || { kills: 0, deaths: 0 };
                victimStats.deaths++;
                stats.set(event.victimId, victimStats);
            }
        });
        
        return Array.from(stats.entries()).map(([playerId, stats]) => ({
            playerId,
            ...stats,
            kdr: stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills
        }));
    }
    
    // Get session duration
    getSessionDuration() {
        if (this.recordingMetadata.events.length === 0) return 0;
        
        const firstEvent = this.recordingMetadata.events[0];
        const lastEvent = this.recordingMetadata.events[this.recordingMetadata.events.length - 1];
        
        return lastEvent.timestamp - firstEvent.timestamp;
    }
    
    // Event emitter functionality
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    
    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }
    
    // Disconnect from server
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.connected = false;
        }
    }
    
    // Get current game state
    getGameState() {
        return {
            localPlayer: this.localPlayer,
            remotePlayers: Array.from(this.remotePlayers.values()),
            projectiles: Array.from(this.projectiles.values()),
            gameState: this.gameState,
            connected: this.connected
        };
    }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiplayerGameClient;
} else if (typeof window !== 'undefined') {
    window.MultiplayerGameClient = MultiplayerGameClient;
}

// Demo usage
if (require.main === module) {
    console.log('🎮 Multiplayer Game Client Demo');
    
    const client = new MultiplayerGameClient({
        serverUrl: 'ws://localhost:2567',
        roomId: 'demo-room'
    });
    
    // Event listeners
    client.on('joined', (data) => {
        console.log('✅ Joined game:', data);
    });
    
    client.on('playerUpdate', (data) => {
        console.log('👤 Player updated:', data);
    });
    
    client.on('highlight', (data) => {
        console.log('🌟 HIGHLIGHT:', data.message);
    });
    
    client.on('disconnected', () => {
        console.log('❌ Disconnected from server');
    });
    
    // Connect with demo player
    client.connect({
        name: 'DemoPlayer',
        color: '#00ff88',
        avatar: 'default'
    }).then(() => {
        console.log('🔌 Connected successfully!');
        
        // Simulate player updates
        setInterval(() => {
            if (client.connected && client.localPlayer) {
                client.updatePlayer({
                    position: { 
                        x: Math.random() * 2000, 
                        y: Math.random() * 2000 
                    },
                    rotation: Math.random() * Math.PI * 2,
                    velocity: { x: 0, y: 0 },
                    health: 100,
                    score: Math.floor(Math.random() * 1000)
                });
            }
        }, 100);
        
    }).catch(error => {
        console.error('❌ Connection failed:', error);
    });
}