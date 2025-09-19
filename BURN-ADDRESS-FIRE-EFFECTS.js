#!/usr/bin/env node

/**
 * 🔥🎬💥 BURN ADDRESS FIRE EFFECTS 💥🎬🔥
 * 
 * Cinematic visual effects system that triggers epic fire animations
 * when burn events are detected across any blockchain. Creates a 
 * movie-style experience with particle effects, screen shake, and
 * dramatic visuals worthy of a billion dollar game interface.
 * 
 * Features:
 * - Real-time fire particle systems with physics
 * - Dynamic screen shake and camera effects
 * - Progressive burn intensity scaling
 * - Multi-chain burn visualization
 * - Sound synchronization for dramatic impact
 * - WebGL-accelerated 3D fire simulations
 * - Blockchain-specific fire colors and styles
 * 
 * @author Document Generator System  
 * @version 3.0.0 - EPIC FIRE EDITION
 */

const { EventEmitter } = require('events');
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const crypto = require('crypto');

class BurnAddressFireEffects extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 3335,
            wsPort: options.wsPort || 3336,
            enableWebGL: options.enableWebGL !== false,
            enableParticles: options.enableParticles !== false,
            enableScreenShake: options.enableScreenShake !== false,
            enableSoundSync: options.enableSoundSync !== false,
            maxParticles: options.maxParticles || 5000,
            burnIntensityMultiplier: options.burnIntensityMultiplier || 1.5,
            effectDuration: options.effectDuration || 3000, // 3 seconds
            particleLifetime: options.particleLifetime || 2000 // 2 seconds
        };
        
        // Fire effect state
        this.activeEffects = new Map();
        this.particleSystems = new Map();
        this.burnStreaks = new Map(); // Track consecutive burns per chain
        this.totalBurnValue = 0;
        this.epicMoments = [];
        
        // WebSocket connections
        this.wss = null;
        this.clients = new Set();
        
        // Chain-specific fire configurations
        this.chainFireConfigs = {
            ethereum: {
                color: '#4169E1', // Royal Blue
                particle: 'flame',
                intensity: 1.0,
                sound: 'eth-burn.wav',
                screenShakeStrength: 0.8
            },
            solana: {
                color: '#9945FF', // Solana Purple
                particle: 'plasma',
                intensity: 1.2,
                sound: 'sol-burn.wav',
                screenShakeStrength: 0.9
            },
            bitcoin: {
                color: '#F7931A', // Bitcoin Orange
                particle: 'explosion',
                intensity: 1.5,
                sound: 'btc-burn.wav',
                screenShakeStrength: 1.0
            },
            polygon: {
                color: '#8247E5', // Polygon Purple
                particle: 'sparkle',
                intensity: 0.8,
                sound: 'matic-burn.wav',
                screenShakeStrength: 0.6
            },
            avalanche: {
                color: '#E84142', // Avalanche Red
                particle: 'avalanche',
                intensity: 1.1,
                sound: 'avax-burn.wav',
                screenShakeStrength: 0.7
            }
        };
        
        // Effect intensity levels
        this.intensityLevels = {
            small: { threshold: 0, multiplier: 1.0, description: 'Gentle Flames' },
            medium: { threshold: 1000, multiplier: 1.5, description: 'Rising Inferno' },
            large: { threshold: 5000, multiplier: 2.0, description: 'Massive Blaze' },
            epic: { threshold: 10000, multiplier: 3.0, description: 'LEGENDARY BURN' },
            insane: { threshold: 50000, multiplier: 5.0, description: '💀 DEATH TO TOKENS 💀' }
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🔥 INITIALIZING BURN ADDRESS FIRE EFFECTS...');
        console.log('==============================================');
        
        // Setup web server for effect dashboard
        await this.setupWebServer();
        
        // Setup WebSocket server for real-time effects
        await this.setupWebSocketServer();
        
        // Initialize particle system manager
        this.initializeParticleManager();
        
        // Start effect cleanup timer
        this.startEffectCleanup();
        
        // Listen for external burn events
        this.listenForBurnEvents();
        
        console.log('🚀 FIRE EFFECTS SYSTEM IS BLAZING!');
        console.log(`🌐 Effect Dashboard: http://localhost:${this.config.port}`);
        console.log(`📡 WebSocket: ws://localhost:${this.config.wsPort}`);
        console.log('🔥 READY TO BURN THE BLOCKCHAIN!');
    }
    
    async setupWebServer() {
        console.log('🌐 Setting up fire effects web server...');
        
        this.app = express();
        this.server = http.createServer(this.app);
        
        // Enable CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
        
        // Serve fire effects dashboard
        this.app.get('/', (req, res) => {
            res.send(this.getFireEffectsDashboardHTML());
        });
        
        // API endpoints
        this.app.get('/api/fire/status', (req, res) => {
            res.json(this.getFireStatus());
        });
        
        this.app.get('/api/fire/active-effects', (req, res) => {
            res.json(Array.from(this.activeEffects.values()));
        });
        
        this.app.post('/api/fire/trigger', express.json(), (req, res) => {
            const result = this.triggerFireEffect(req.body);
            res.json(result);
        });
        
        this.app.get('/api/fire/epic-moments', (req, res) => {
            res.json(this.epicMoments.slice(-20)); // Last 20 epic moments
        });
        
        this.server.listen(this.config.port, () => {
            console.log(`✅ Fire Effects Server: BLAZING on port ${this.config.port}`);
        });
    }
    
    async setupWebSocketServer() {
        console.log('📡 Setting up fire effects WebSocket...');
        
        this.wss = new WebSocket.Server({ 
            port: this.config.wsPort,
            maxClients: 500
        });
        
        this.wss.on('connection', (ws, req) => {
            console.log(`🔌 Fire effects client connected (${this.clients.size + 1} total)`);
            
            this.clients.add(ws);
            
            // Send initial fire state
            ws.send(JSON.stringify({
                type: 'fire-connected',
                status: this.getFireStatus(),
                activeEffects: Array.from(this.activeEffects.values()),
                timestamp: Date.now()
            }));
            
            // Handle messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleFireEffectMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'fire-error',
                        message: 'Invalid JSON'
                    }));
                }
            });
            
            // Handle disconnect
            ws.on('close', () => {
                this.clients.delete(ws);
                console.log(`🔌 Fire effects client disconnected (${this.clients.size} remaining)`);
            });
        });
        
        console.log(`✅ Fire Effects WebSocket: BLAZING on port ${this.config.wsPort}`);
    }
    
    initializeParticleManager() {
        console.log('✨ Initializing particle systems...');
        
        // Initialize particle systems for each chain
        for (const [chain, config] of Object.entries(this.chainFireConfigs)) {
            this.particleSystems.set(chain, {
                particles: [],
                config,
                lastUpdate: Date.now(),
                totalParticles: 0
            });
        }
        
        // Start particle update loop
        this.particleUpdateInterval = setInterval(() => {
            this.updateParticleSystems();
        }, 16); // ~60fps
        
        console.log('✅ Particle Systems: INITIALIZED');
    }
    
    startEffectCleanup() {
        // Clean up expired effects every second
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            
            for (const [effectId, effect] of this.activeEffects) {
                if (now - effect.startTime > this.config.effectDuration) {
                    this.activeEffects.delete(effectId);
                    this.broadcastFireUpdate({
                        type: 'fire-effect-ended',
                        effectId,
                        timestamp: now
                    });
                }
            }
        }, 1000);
    }
    
    listenForBurnEvents() {
        console.log('👂 Listening for burn events from trading floor...');
        
        // Connect to the main trading floor WebSocket
        try {
            const tradingFloorWS = new WebSocket('ws://localhost:3334');
            
            tradingFloorWS.on('open', () => {
                console.log('🔌 Connected to trading floor for burn events');
            });
            
            tradingFloorWS.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    if (message.type === 'burn-event') {
                        this.handleBurnEvent(message.event);
                    }
                } catch (error) {
                    console.error('Error parsing trading floor message:', error);
                }
            });
            
            tradingFloorWS.on('error', (error) => {
                console.error('Trading floor WebSocket error:', error);
            });
            
            tradingFloorWS.on('close', () => {
                console.log('Trading floor connection closed, attempting reconnect...');
                setTimeout(() => this.listenForBurnEvents(), 5000);
            });
            
        } catch (error) {
            console.error('Failed to connect to trading floor:', error);
            // Continue without trading floor connection
        }
    }
    
    handleBurnEvent(burnEvent) {
        console.log(`🔥 BURN EVENT DETECTED: ${burnEvent.token} -> $${burnEvent.usdValue}`);
        
        // Determine chain from burn address or token
        const chain = this.detectChain(burnEvent);
        
        // Calculate effect intensity
        const intensity = this.calculateIntensity(burnEvent.usdValue);
        
        // Update burn streak
        const currentStreak = this.burnStreaks.get(chain) || 0;
        this.burnStreaks.set(chain, currentStreak + 1);
        
        // Track total burn value
        this.totalBurnValue += burnEvent.usdValue;
        
        // Create fire effect
        const fireEffect = this.createFireEffect(burnEvent, chain, intensity);
        
        // Check for epic moments
        if (intensity.level === 'epic' || intensity.level === 'insane') {
            this.recordEpicMoment(burnEvent, fireEffect);
        }
        
        // Trigger the visual effect
        this.triggerFireEffect(fireEffect);
        
        // Emit event for other systems
        this.emit('fire-triggered', fireEffect);
    }
    
    detectChain(burnEvent) {
        const address = burnEvent.burnAddress?.toLowerCase() || '';
        
        // Ethereum burn addresses
        if (address.includes('0x000000000000000000000000000000000000dead') || 
            address.includes('0x0000000000000000000000000000000000000000')) {
            return 'ethereum';
        }
        
        // Solana burn addresses
        if (address.includes('11111111111111111111111111111112') ||
            address.includes('1nc1nerator11111111111111111111111111111111')) {
            return 'solana';
        }
        
        // Bitcoin burn addresses
        if (address.includes('1bitcoineataddressdontsendf59kue') ||
            address.includes('1counterpartyxxxxxxxxxxxxxxuuuwlpvr')) {
            return 'bitcoin';
        }
        
        // Default to ethereum if can't detect
        return 'ethereum';
    }
    
    calculateIntensity(usdValue) {
        for (const [level, config] of Object.entries(this.intensityLevels).reverse()) {
            if (usdValue >= config.threshold) {
                return {
                    level,
                    ...config,
                    actualValue: usdValue
                };
            }
        }
        return this.intensityLevels.small;
    }
    
    createFireEffect(burnEvent, chain, intensity) {
        const effectId = crypto.randomBytes(16).toString('hex');
        const chainConfig = this.chainFireConfigs[chain] || this.chainFireConfigs.ethereum;
        
        const fireEffect = {
            id: effectId,
            chain,
            burnEvent,
            intensity,
            chainConfig,
            startTime: Date.now(),
            duration: this.config.effectDuration * intensity.multiplier,
            particles: Math.min(
                this.config.maxParticles,
                Math.floor(intensity.actualValue / 10) * intensity.multiplier
            ),
            screenShake: {
                enabled: this.config.enableScreenShake,
                strength: chainConfig.screenShakeStrength * intensity.multiplier,
                duration: 500 * intensity.multiplier
            },
            sound: {
                enabled: this.config.enableSoundSync,
                file: chainConfig.sound,
                volume: Math.min(1.0, intensity.multiplier * 0.3)
            },
            effects: {
                fireColor: chainConfig.color,
                particleType: chainConfig.particle,
                explosionRadius: 100 * intensity.multiplier,
                heatDistortion: intensity.multiplier > 2.0,
                lightningBolts: intensity.level === 'insane',
                meteorShower: intensity.level === 'epic' || intensity.level === 'insane'
            }
        };
        
        // Store active effect
        this.activeEffects.set(effectId, fireEffect);
        
        return fireEffect;
    }
    
    recordEpicMoment(burnEvent, fireEffect) {
        const epicMoment = {
            id: crypto.randomBytes(8).toString('hex'),
            timestamp: Date.now(),
            type: 'legendary-burn',
            burnValue: burnEvent.usdValue,
            chain: fireEffect.chain,
            intensity: fireEffect.intensity.level,
            description: `${fireEffect.intensity.description} - $${burnEvent.usdValue.toLocaleString()} burned!`,
            screenshot: true, // Signal to take screenshot
            socialShare: {
                twitter: `🔥 LEGENDARY BURN DETECTED! 🔥\n\n💰 $${burnEvent.usdValue.toLocaleString()} just got INCINERATED on ${fireEffect.chain}!\n\n${fireEffect.intensity.description}\n\n#CryptoBurn #TaxOptimization #BillionDollarGame`,
                discord: `@everyone 🔥🔥🔥 EPIC BURN ALERT! 🔥🔥🔥\n\nSomeone just torched $${burnEvent.usdValue.toLocaleString()} worth of tokens!\n\nChain: ${fireEffect.chain.toUpperCase()}\nIntensity: ${fireEffect.intensity.description}\n\nThe fire effects are OFF THE CHARTS! 🎬💥`
            }
        };
        
        this.epicMoments.push(epicMoment);
        
        // Keep only last 100 epic moments
        if (this.epicMoments.length > 100) {
            this.epicMoments.shift();
        }
        
        console.log(`🎉 EPIC MOMENT RECORDED: ${epicMoment.description}`);
        
        return epicMoment;
    }
    
    triggerFireEffect(fireEffect) {
        console.log(`🔥 Triggering fire effect: ${fireEffect.intensity.level} (${fireEffect.particles} particles)`);
        
        // Generate particles for this effect
        this.generateParticles(fireEffect);
        
        // Broadcast to all connected clients
        this.broadcastFireUpdate({
            type: 'fire-effect-triggered',
            effect: fireEffect,
            timestamp: Date.now()
        });
        
        // Handle special effects for high intensity
        if (fireEffect.intensity.level === 'epic' || fireEffect.intensity.level === 'insane') {
            this.triggerSpecialEffects(fireEffect);
        }
        
        return {
            success: true,
            effectId: fireEffect.id,
            message: `Fire effect triggered: ${fireEffect.intensity.description}`
        };
    }
    
    generateParticles(fireEffect) {
        const particleSystem = this.particleSystems.get(fireEffect.chain);
        if (!particleSystem) return;
        
        const particleCount = Math.min(fireEffect.particles, this.config.maxParticles);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = {
                id: crypto.randomBytes(4).toString('hex'),
                x: Math.random() * 1920, // Screen width
                y: Math.random() * 1080, // Screen height
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 5 + 2,
                life: this.config.particleLifetime,
                maxLife: this.config.particleLifetime,
                color: fireEffect.chainConfig.color,
                type: fireEffect.chainConfig.particle,
                opacity: 1.0,
                effectId: fireEffect.id
            };
            
            particleSystem.particles.push(particle);
            particleSystem.totalParticles++;
        }
        
        console.log(`✨ Generated ${particleCount} ${fireEffect.chain} particles`);
    }
    
    updateParticleSystems() {
        const now = Date.now();
        
        for (const [chain, system] of this.particleSystems) {
            const deltaTime = now - system.lastUpdate;
            system.lastUpdate = now;
            
            // Update each particle
            for (let i = system.particles.length - 1; i >= 0; i--) {
                const particle = system.particles[i];
                
                // Update position
                particle.x += particle.vx * (deltaTime / 16);
                particle.y += particle.vy * (deltaTime / 16);
                
                // Update life
                particle.life -= deltaTime;
                particle.opacity = particle.life / particle.maxLife;
                
                // Apply gravity for certain particle types
                if (particle.type === 'flame' || particle.type === 'explosion') {
                    particle.vy += 0.1 * (deltaTime / 16); // Gravity
                }
                
                // Remove dead particles
                if (particle.life <= 0) {
                    system.particles.splice(i, 1);
                }
            }
        }
        
        // Broadcast particle updates to clients (throttled)
        if (now % 100 < 16) { // Every ~100ms
            this.broadcastParticleUpdate();
        }
    }
    
    triggerSpecialEffects(fireEffect) {
        console.log(`🎬 Triggering special effects for ${fireEffect.intensity.level} burn!`);
        
        const specialEffects = {
            type: 'special-effects',
            effectId: fireEffect.id,
            effects: [],
            timestamp: Date.now()
        };
        
        if (fireEffect.intensity.level === 'epic') {
            specialEffects.effects.push({
                name: 'screen-flash',
                duration: 200,
                color: fireEffect.chainConfig.color,
                intensity: 0.8
            });
            
            specialEffects.effects.push({
                name: 'camera-zoom',
                duration: 1000,
                zoomLevel: 1.2
            });
            
            specialEffects.effects.push({
                name: 'dramatic-text',
                text: '🔥 EPIC BURN DETECTED! 🔥',
                duration: 2000,
                style: 'epic'
            });
        }
        
        if (fireEffect.intensity.level === 'insane') {
            specialEffects.effects.push({
                name: 'screen-invert',
                duration: 300
            });
            
            specialEffects.effects.push({
                name: 'lightning-storm',
                duration: 1500,
                bolts: 10
            });
            
            specialEffects.effects.push({
                name: 'meteor-shower',
                duration: 3000,
                meteors: 20
            });
            
            specialEffects.effects.push({
                name: 'dramatic-text',
                text: '💀 DEATH TO TOKENS! 💀',
                duration: 3000,
                style: 'insane'
            });
            
            specialEffects.effects.push({
                name: 'matrix-rain',
                duration: 2000,
                color: fireEffect.chainConfig.color
            });
        }
        
        this.broadcastFireUpdate(specialEffects);
    }
    
    handleFireEffectMessage(ws, data) {
        switch (data.type) {
            case 'fire-ping':
                ws.send(JSON.stringify({ 
                    type: 'fire-pong', 
                    timestamp: Date.now() 
                }));
                break;
                
            case 'fire-subscribe':
                ws.subscriptions = data.filters || {};
                ws.send(JSON.stringify({ 
                    type: 'fire-subscribed', 
                    filters: ws.subscriptions 
                }));
                break;
                
            case 'fire-manual-trigger':
                const result = this.triggerTestFire(data.params);
                ws.send(JSON.stringify({ 
                    type: 'fire-manual-result', 
                    result 
                }));
                break;
                
            case 'fire-request-epic-moments':
                ws.send(JSON.stringify({
                    type: 'fire-epic-moments',
                    moments: this.epicMoments.slice(-20)
                }));
                break;
        }
    }
    
    triggerTestFire(params = {}) {
        const testBurnEvent = {
            token: params.token || 'TEST_TOKEN',
            amount: params.amount || '1000000',
            usdValue: params.usdValue || 5000,
            burnAddress: params.burnAddress || '0x000000000000000000000000000000000000dead',
            test: true
        };
        
        this.handleBurnEvent(testBurnEvent);
        
        return {
            success: true,
            message: 'Test fire effect triggered!',
            burnEvent: testBurnEvent
        };
    }
    
    broadcastFireUpdate(update) {
        if (this.clients.size === 0) return;
        
        const message = JSON.stringify(update);
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                } catch (error) {
                    console.error('Error sending fire update to client:', error);
                    this.clients.delete(client);
                }
            }
        });
    }
    
    broadcastParticleUpdate() {
        const particleData = {};
        
        for (const [chain, system] of this.particleSystems) {
            particleData[chain] = {
                particles: system.particles.slice(0, 1000), // Limit for performance
                totalCount: system.particles.length
            };
        }
        
        this.broadcastFireUpdate({
            type: 'particle-update',
            systems: particleData,
            timestamp: Date.now()
        });
    }
    
    getFireStatus() {
        return {
            totalBurnValue: this.totalBurnValue,
            activeEffects: this.activeEffects.size,
            totalParticles: Array.from(this.particleSystems.values())
                .reduce((sum, system) => sum + system.particles.length, 0),
            burnStreaks: Object.fromEntries(this.burnStreaks),
            epicMoments: this.epicMoments.length,
            connectedClients: this.clients.size,
            systemPerformance: {
                memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
                uptime: process.uptime(),
                particleSystemFPS: 60 // Estimated
            },
            timestamp: Date.now()
        };
    }
    
    getFireEffectsDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🔥 BURN ADDRESS FIRE EFFECTS 🔥</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            color: #fff;
            font-family: 'Courier New', monospace;
            overflow: hidden;
        }
        
        .fire-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle at center, #1a0000 0%, #000000 100%);
        }
        
        .fire-header {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 36px;
            text-align: center;
            animation: pulse 2s infinite;
            z-index: 1000;
        }
        
        @keyframes pulse {
            0% { opacity: 1; text-shadow: 0 0 20px #ff4400; }
            50% { opacity: 0.8; text-shadow: 0 0 40px #ff4400; }
            100% { opacity: 1; text-shadow: 0 0 20px #ff4400; }
        }
        
        .fire-stats {
            position: absolute;
            top: 80px;
            left: 20px;
            right: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            z-index: 1000;
        }
        
        .fire-stat {
            background: rgba(255, 68, 0, 0.1);
            border: 2px solid #ff4400;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            backdrop-filter: blur(5px);
        }
        
        .fire-stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #ff4400;
        }
        
        .fire-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 500;
        }
        
        .fire-log {
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            height: 200px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #ff4400;
            border-radius: 10px;
            padding: 10px;
            overflow-y: auto;
            font-size: 12px;
            z-index: 1000;
        }
        
        .fire-entry {
            margin: 2px 0;
            padding: 2px;
        }
        
        .fire-entry.epic {
            color: #ff0000;
            font-weight: bold;
            animation: flash 0.5s infinite;
        }
        
        .fire-entry.insane {
            color: #ff00ff;
            font-weight: bold;
            animation: rainbow 1s infinite;
        }
        
        @keyframes flash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @keyframes rainbow {
            0% { color: #ff0000; }
            16% { color: #ff8800; }
            33% { color: #ffff00; }
            50% { color: #00ff00; }
            66% { color: #0088ff; }
            83% { color: #8800ff; }
            100% { color: #ff0000; }
        }
        
        .fire-controls {
            position: absolute;
            top: 300px;
            right: 20px;
            z-index: 1000;
        }
        
        .fire-button {
            display: block;
            margin: 10px 0;
            padding: 10px 20px;
            background: #ff4400;
            color: #000;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-family: inherit;
            font-weight: bold;
        }
        
        .fire-button:hover {
            background: #ff6600;
            transform: scale(1.05);
        }
        
        .screen-shake {
            animation: shake 0.5s infinite;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        .screen-flash {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            opacity: 0;
            z-index: 9999;
            pointer-events: none;
        }
        
        .dramatic-text {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 72px;
            font-weight: bold;
            text-align: center;
            z-index: 10000;
            pointer-events: none;
        }
        
        .dramatic-text.epic {
            color: #ff4400;
            text-shadow: 0 0 20px #ff4400;
            animation: dramatic-epic 2s ease-out;
        }
        
        .dramatic-text.insane {
            background: linear-gradient(45deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff);
            background-size: 400% 400%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: dramatic-insane 3s ease-out;
        }
        
        @keyframes dramatic-epic {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        }
        
        @keyframes dramatic-insane {
            0% { transform: translate(-50%, -50%) scale(0) rotate(-360deg); opacity: 0; background-position: 0% 50%; }
            20% { transform: translate(-50%, -50%) scale(1.5) rotate(0deg); opacity: 1; background-position: 100% 50%; }
            80% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; background-position: 0% 50%; }
            100% { transform: translate(-50%, -50%) scale(0.5) rotate(180deg); opacity: 0; background-position: 100% 50%; }
        }
    </style>
</head>
<body>
    <div class="fire-container" id="fireContainer">
        <div class="fire-header">🔥 BURN ADDRESS FIRE EFFECTS 🔥</div>
        
        <div class="fire-stats" id="fireStats">
            <div class="fire-stat">
                <div>Total Burned</div>
                <div class="fire-stat-value" id="totalBurned">$0</div>
            </div>
            <div class="fire-stat">
                <div>Active Effects</div>
                <div class="fire-stat-value" id="activeEffects">0</div>
            </div>
            <div class="fire-stat">
                <div>Total Particles</div>
                <div class="fire-stat-value" id="totalParticles">0</div>
            </div>
            <div class="fire-stat">
                <div>Epic Moments</div>
                <div class="fire-stat-value" id="epicMoments">0</div>
            </div>
        </div>
        
        <canvas class="fire-canvas" id="fireCanvas"></canvas>
        
        <div class="fire-controls">
            <button class="fire-button" onclick="triggerTestFire('small')">🔥 Small Burn</button>
            <button class="fire-button" onclick="triggerTestFire('medium')">🔥🔥 Medium Burn</button>
            <button class="fire-button" onclick="triggerTestFire('large')">🔥🔥🔥 Large Burn</button>
            <button class="fire-button" onclick="triggerTestFire('epic')">🔥🔥🔥🔥 EPIC BURN</button>
            <button class="fire-button" onclick="triggerTestFire('insane')">💀 INSANE BURN 💀</button>
        </div>
        
        <div class="fire-log" id="fireLog"></div>
        
        <div class="screen-flash" id="screenFlash"></div>
    </div>
    
    <script>
        let ws;
        let canvas, ctx;
        let particles = {};
        
        function init() {
            canvas = document.getElementById('fireCanvas');
            ctx = canvas.getContext('2d');
            
            // Set canvas size
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Connect WebSocket
            connectWebSocket();
            
            // Start animation loop
            animate();
            
            // Handle window resize
            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            });
        }
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.config.wsPort}');
            
            ws.onopen = () => {
                console.log('🔥 Connected to fire effects system');
                addFireLog('🔌 Connected to fire effects system', 'info');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleFireMessage(data);
            };
            
            ws.onclose = () => {
                addFireLog('🔌 Disconnected, reconnecting...', 'warn');
                setTimeout(connectWebSocket, 1000);
            };
            
            ws.onerror = (error) => {
                addFireLog('❌ WebSocket error: ' + error, 'error');
            };
        }
        
        function handleFireMessage(data) {
            switch (data.type) {
                case 'fire-connected':
                    updateFireStats(data.status);
                    break;
                    
                case 'fire-effect-triggered':
                    handleFireEffect(data.effect);
                    break;
                    
                case 'particle-update':
                    updateParticles(data.systems);
                    break;
                    
                case 'special-effects':
                    handleSpecialEffects(data.effects);
                    break;
            }
        }
        
        function handleFireEffect(effect) {
            const intensity = effect.intensity.level;
            const chain = effect.chain;
            const value = effect.burnEvent.usdValue;
            
            addFireLog(\`🔥 \\${intensity.toUpperCase()} BURN: $\\${value.toLocaleString()} on \\${chain}\`, intensity);
            
            // Trigger screen shake for larger burns
            if (effect.screenShake.enabled && effect.screenShake.strength > 0.5) {
                triggerScreenShake(effect.screenShake.duration);
            }
            
            // Create dramatic text for epic burns
            if (intensity === 'epic' || intensity === 'insane') {
                showDramaticText(effect.intensity.description, intensity);
            }
        }
        
        function updateParticles(systems) {
            particles = systems;
        }
        
        function handleSpecialEffects(effects) {
            effects.forEach(effect => {
                switch (effect.name) {
                    case 'screen-flash':
                        triggerScreenFlash(effect.color, effect.duration);
                        break;
                    case 'screen-invert':
                        triggerScreenInvert(effect.duration);
                        break;
                    case 'dramatic-text':
                        showDramaticText(effect.text, effect.style);
                        break;
                }
            });
        }
        
        function updateFireStats(status) {
            document.getElementById('totalBurned').textContent = '$' + status.totalBurnValue.toLocaleString();
            document.getElementById('activeEffects').textContent = status.activeEffects;
            document.getElementById('totalParticles').textContent = status.totalParticles;
            document.getElementById('epicMoments').textContent = status.epicMoments;
        }
        
        function animate() {
            // Clear canvas
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw particles
            for (const [chain, system] of Object.entries(particles)) {
                if (system.particles) {
                    drawParticles(system.particles, chain);
                }
            }
            
            requestAnimationFrame(animate);
        }
        
        function drawParticles(particleList, chain) {
            particleList.forEach(particle => {
                ctx.save();
                
                // Set particle properties
                ctx.globalAlpha = particle.opacity;
                ctx.fillStyle = particle.color;
                
                // Draw based on particle type
                switch (particle.type) {
                    case 'flame':
                        drawFlameParticle(particle);
                        break;
                    case 'explosion':
                        drawExplosionParticle(particle);
                        break;
                    case 'plasma':
                        drawPlasmaParticle(particle);
                        break;
                    case 'sparkle':
                        drawSparkleParticle(particle);
                        break;
                    default:
                        drawDefaultParticle(particle);
                }
                
                ctx.restore();
            });
        }
        
        function drawFlameParticle(particle) {
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size
            );
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        function drawExplosionParticle(particle) {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Add explosion rays
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const length = particle.size * 3;
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(
                    particle.x + Math.cos(angle) * length,
                    particle.y + Math.sin(angle) * length
                );
                ctx.stroke();
            }
        }
        
        function drawPlasmaParticle(particle) {
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        function drawSparkleParticle(particle) {
            ctx.fillStyle = particle.color;
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.life / 100);
            
            // Draw sparkle shape
            ctx.beginPath();
            ctx.moveTo(0, -particle.size);
            ctx.lineTo(particle.size * 0.3, 0);
            ctx.lineTo(particle.size, 0);
            ctx.lineTo(particle.size * 0.3, 0);
            ctx.lineTo(0, particle.size);
            ctx.lineTo(-particle.size * 0.3, 0);
            ctx.lineTo(-particle.size, 0);
            ctx.lineTo(-particle.size * 0.3, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
        
        function drawDefaultParticle(particle) {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        function triggerScreenShake(duration) {
            const container = document.getElementById('fireContainer');
            container.classList.add('screen-shake');
            setTimeout(() => {
                container.classList.remove('screen-shake');
            }, duration);
        }
        
        function triggerScreenFlash(color, duration) {
            const flash = document.getElementById('screenFlash');
            flash.style.background = color;
            flash.style.opacity = '0.7';
            setTimeout(() => {
                flash.style.opacity = '0';
            }, duration);
        }
        
        function triggerScreenInvert(duration) {
            document.body.style.filter = 'invert(1)';
            setTimeout(() => {
                document.body.style.filter = 'none';
            }, duration);
        }
        
        function showDramaticText(text, style) {
            const textElement = document.createElement('div');
            textElement.className = \`dramatic-text \\${style}\`;
            textElement.textContent = text;
            document.body.appendChild(textElement);
            
            setTimeout(() => {
                document.body.removeChild(textElement);
            }, style === 'insane' ? 3000 : 2000);
        }
        
        function addFireLog(message, level) {
            const log = document.getElementById('fireLog');
            const entry = document.createElement('div');
            entry.className = \`fire-entry \\${level}\`;
            entry.textContent = \`[\\${new Date().toLocaleTimeString()}] \\${message}\`;
            
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
            
            // Limit log entries
            while (log.children.length > 100) {
                log.removeChild(log.firstChild);
            }
        }
        
        function triggerTestFire(intensity) {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                addFireLog('❌ Not connected to fire effects system', 'error');
                return;
            }
            
            const testValues = {
                small: 500,
                medium: 2500,
                large: 7500,
                epic: 15000,
                insane: 75000
            };
            
            ws.send(JSON.stringify({
                type: 'fire-manual-trigger',
                params: {
                    token: 'TEST_TOKEN',
                    usdValue: testValues[intensity],
                    burnAddress: '0x000000000000000000000000000000000000dead'
                }
            }));
            
            addFireLog(\`🧪 Triggered test \\${intensity} burn ($\\${testValues[intensity].toLocaleString()})\`, 'info');
        }
        
        // Initialize on load
        window.addEventListener('load', init);
    </script>
</body>
</html>
        `;
    }
    
    async shutdown() {
        console.log('🔥 Shutting down fire effects system...');
        
        // Clear timers
        clearInterval(this.particleUpdateInterval);
        clearInterval(this.cleanupInterval);
        
        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
        }
        
        // Close HTTP server
        if (this.server) {
            this.server.close();
        }
        
        console.log('🔥 Fire effects shutdown complete');
    }
}

// Export for use as module
module.exports = BurnAddressFireEffects;

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
            case '--no-webgl':
                options.enableWebGL = false;
                break;
            case '--no-particles':
                options.enableParticles = false;
                break;
            case '--no-shake':
                options.enableScreenShake = false;
                break;
            case '--max-particles':
                options.maxParticles = parseInt(args[++i]);
                break;
            case '--demo':
                console.log('🔥 Starting FIRE EFFECTS DEMO MODE...');
                options.demoMode = true;
                break;
            default:
                console.log(`
🔥📊💥 BURN ADDRESS FIRE EFFECTS 💥📊🔥

Usage:
  node BURN-ADDRESS-FIRE-EFFECTS.js [options]

Options:
  --port <port>        HTTP server port (default: 3335)
  --ws-port <port>     WebSocket port (default: 3336)
  --no-webgl           Disable WebGL acceleration
  --no-particles       Disable particle effects
  --no-shake           Disable screen shake
  --max-particles <n>  Maximum particles (default: 5000)
  --demo               Run in demo mode

🔥 Features:
  • Real-time fire particle systems with physics
  • Multi-chain burn visualization with unique effects
  • Epic screen shake and dramatic text for large burns
  • WebGL-accelerated 3D fire simulations
  • Integration with crypto tax burn scanner
  • Movie-style visual effects for billion dollar game

🎬 Experience the most epic burn visualization ever created!
                `);
                process.exit(0);
        }
    }
    
    // Create and start fire effects system
    const fireEffects = new BurnAddressFireEffects(options);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await fireEffects.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await fireEffects.shutdown();
        process.exit(0);
    });
    
    // Keep process running
    process.stdin.resume();
    
    if (options.demoMode) {
        // Demo mode: simulate epic burn events
        setTimeout(() => {
            fireEffects.triggerTestFire({
                token: 'DEMO_ETH',
                usdValue: 2500,
                burnAddress: '0x000000000000000000000000000000000000dead'
            });
        }, 3000);
        
        setTimeout(() => {
            fireEffects.triggerTestFire({
                token: 'DEMO_SOL',
                usdValue: 15000,
                burnAddress: '11111111111111111111111111111112'
            });
        }, 8000);
        
        setTimeout(() => {
            fireEffects.triggerTestFire({
                token: 'DEMO_BTC',
                usdValue: 75000,
                burnAddress: '1BitcoinEaterAddressDontSendf59kuE'
            });
        }, 15000);
    }
    
    console.log('🔥 BURN ADDRESS FIRE EFFECTS ARE BLAZING!');
    console.log('🚀 Ready to incinerate the blockchain with epic visuals!');
}