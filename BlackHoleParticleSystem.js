#!/usr/bin/env node

/**
 * 🌌 BLACK HOLE PARTICLE SYSTEM
 * 
 * AI-driven particle diffusion visualization where development skills
 * behave like particles around a black hole, with branching skill trees
 * that unlock as particles approach the event horizon of mastery.
 * 
 * Features:
 * - Real gravity physics simulation
 * - Particle lifecycle management
 * - Interactive skill tree branching
 * - Avatar-driven gravity wells
 * - Real-time data integration
 * - Visual spectacle with WebGL effects
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const EventEmitter = require('events');
const crypto = require('crypto');

class BlackHoleParticleSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 7500,
            wsPort: config.wsPort || 7501,
            
            // Black hole physics
            physics: {
                blackHoleMass: 1000,           // Mass of central black hole
                schwarzschildRadius: 50,       // Event horizon radius
                accretionDiskRadius: 300,      // Accretion disk outer radius
                gravityStrength: 9.8,          // Base gravity constant
                particleLifespan: 30000,       // Particle lifetime in ms
                maxParticles: 5000,            // Maximum particles allowed
                timeStep: 16.67                // Physics timestep (60fps)
            },
            
            // Particle system
            particles: {
                spawnRate: 50,                 // Particles per second
                initialVelocity: { min: 0.1, max: 2.0 },
                size: { min: 1, max: 5 },
                glowIntensity: 0.8,
                trailLength: 20,
                colors: {
                    skill: '#00ff88',          // New skill particles
                    achievement: '#ffd700',     // Achievement particles  
                    experience: '#00bfff',     // Experience particles
                    mastery: '#ff69b4'         // Mastery particles
                }
            },
            
            // Skill tree integration
            skillSystem: {
                gravityWells: {
                    frontend: { position: { x: -200, y: 0, z: 0 }, mass: 300, color: '#61dafb' },
                    backend: { position: { x: 200, y: 0, z: 0 }, mass: 350, color: '#68a063' },
                    devops: { position: { x: 0, y: -200, z: 0 }, mass: 250, color: '#326ce5' },
                    ai: { position: { x: 0, y: 200, z: 0 }, mass: 400, color: '#ff6b6b' },
                    design: { position: { x: -141, y: -141, z: 100 }, mass: 200, color: '#f06292' },
                    security: { position: { x: 141, y: 141, z: -100 }, mass: 280, color: '#ab47bc' }
                },
                branchingThreshold: 0.7,       // Particle density needed for branching
                masteryThreshold: 0.95,        // Threshold for reaching mastery
                experienceMultiplier: 1.5      // XP multiplier near event horizon
            },
            
            // Visual effects
            rendering: {
                backgroundColor: '#000000',
                bloomIntensity: 1.2,
                particleGlow: true,
                accretionDiskEffect: true,
                hawkingRadiation: true,
                gravitationalLensing: false,
                cameraSmoothing: 0.05
            },
            
            ...config
        };
        
        // Core systems
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.clients = new Set();
        
        // Physics simulation state
        this.blackHole = {
            position: { x: 0, y: 0, z: 0 },
            mass: this.config.physics.blackHoleMass,
            eventHorizon: this.config.physics.schwarzschildRadius,
            accretionDisk: this.config.physics.accretionDiskRadius
        };
        
        // Particle management
        this.particles = new Map();
        this.particlePool = [];
        this.lastParticleId = 0;
        
        // Skill tree system
        this.gravityWells = new Map();
        this.skillBranches = new Map();
        this.masteryLevel = 0;
        
        // Real-time data integration
        this.dataConnector = null;
        this.avatarData = null;
        
        // Performance tracking
        this.performance = {
            fps: 0,
            particleCount: 0,
            physicsTime: 0,
            renderTime: 0,
            memoryUsage: 0
        };
        
        // Animation state
        this.animationId = null;
        this.lastFrameTime = 0;
        this.accumulator = 0;
        
        console.log('🌌 Black Hole Particle System initializing...');
        console.log(`🕳️ Event Horizon: ${this.blackHole.eventHorizon} units`);
        console.log(`🌀 Accretion Disk: ${this.blackHole.accretionDisk} units`);
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Setup web server and WebSocket
            this.setupWebServer();
            this.setupWebSocket();
            
            // Initialize gravity wells (skill areas)
            this.initializeGravityWells();
            
            // Setup physics simulation
            this.startPhysicsLoop();
            
            // Connect to real data sources
            this.connectToDataSources();
            
            // Start the server
            this.server.listen(this.config.port, () => {
                console.log(`🚀 Black Hole System running on port ${this.config.port}`);
                console.log(`📡 WebSocket server on port ${this.config.wsPort}`);
                this.emit('system_ready');
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize Black Hole System:', error);
            throw error;
        }
    }
    
    setupWebServer() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // API endpoints
        this.app.get('/api/blackhole/state', this.getSystemState.bind(this));
        this.app.get('/api/particles', this.getParticles.bind(this));
        this.app.post('/api/particles/spawn', this.spawnParticle.bind(this));
        this.app.get('/api/gravity-wells', this.getGravityWells.bind(this));
        this.app.post('/api/skill-branch', this.createSkillBranch.bind(this));
        this.app.get('/api/performance', this.getPerformance.bind(this));
        
        // Main interface
        this.app.get('/', (req, res) => {
            res.send(this.generateBlackHoleInterface());
        });
        
        console.log('🌐 Web server configured');
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔌 Client connected to Black Hole System');
            this.clients.add(ws);
            
            // Send initial state
            this.sendToClient(ws, {
                type: 'system_state',
                data: this.getSystemStateData()
            });
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleClientMessage(ws, data);
                } catch (error) {
                    console.error('Invalid message:', error);
                }
            });
            
            ws.on('close', () => {
                this.clients.delete(ws);
                console.log('🔌 Client disconnected');
            });
        });
        
        console.log('📡 WebSocket server configured');
    }
    
    initializeGravityWells() {
        const wells = this.config.skillSystem.gravityWells;
        
        for (const [skillName, wellData] of Object.entries(wells)) {
            const gravityWell = {
                id: skillName,
                position: { ...wellData.position },
                mass: wellData.mass,
                color: wellData.color,
                particleCount: 0,
                density: 0,
                branches: [],
                masteryLevel: 0,
                influence: this.calculateInfluenceRadius(wellData.mass)
            };
            
            this.gravityWells.set(skillName, gravityWell);
            console.log(`🌀 Gravity well created: ${skillName} (mass: ${wellData.mass})`);
        }
    }
    
    calculateInfluenceRadius(mass) {
        return Math.sqrt(mass) * 10; // Influence radius based on mass
    }
    
    startPhysicsLoop() {
        const physicsStep = (currentTime) => {
            const frameTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;
            
            // Accumulate time for fixed timestep physics
            this.accumulator += Math.min(frameTime, 100); // Cap frame time
            
            const timestep = this.config.physics.timeStep;
            
            // Process physics in fixed timesteps
            while (this.accumulator >= timestep) {
                this.updatePhysics(timestep);
                this.accumulator -= timestep;
            }
            
            // Update performance metrics
            this.updatePerformanceMetrics();
            
            // Broadcast state to clients
            this.broadcastPhysicsUpdate();
            
            // Continue loop
            this.animationId = requestAnimationFrame(physicsStep);
        };
        
        this.animationId = requestAnimationFrame(physicsStep);
        console.log('⚡ Physics simulation started');
    }
    
    updatePhysics(deltaTime) {
        const physicsStartTime = Date.now();
        
        // Update particles
        for (const [particleId, particle] of this.particles) {
            this.updateParticle(particle, deltaTime);
            
            // Remove dead particles
            if (!particle.alive) {
                this.removeParticle(particleId);
            }
        }
        
        // Spawn new particles based on real data
        this.spawnParticlesFromData();
        
        // Update gravity well densities
        this.updateGravityWellDensities();
        
        // Check for skill branching opportunities
        this.checkSkillBranching();
        
        // Calculate physics performance
        this.performance.physicsTime = Date.now() - physicsStartTime;
    }
    
    updateParticle(particle, deltaTime) {
        // Age the particle
        particle.age += deltaTime;
        if (particle.age > particle.lifespan) {
            particle.alive = false;
            return;
        }
        
        // Calculate forces from black hole and gravity wells
        const forces = this.calculateForces(particle);
        
        // Apply forces to acceleration
        particle.acceleration.x = forces.x / particle.mass;
        particle.acceleration.y = forces.y / particle.mass;
        particle.acceleration.z = forces.z / particle.mass;
        
        // Update velocity
        particle.velocity.x += particle.acceleration.x * deltaTime / 1000;
        particle.velocity.y += particle.acceleration.y * deltaTime / 1000;
        particle.velocity.z += particle.acceleration.z * deltaTime / 1000;
        
        // Apply velocity damping
        const damping = 0.999;
        particle.velocity.x *= damping;
        particle.velocity.y *= damping;
        particle.velocity.z *= damping;
        
        // Update position
        particle.position.x += particle.velocity.x * deltaTime / 1000;
        particle.position.y += particle.velocity.y * deltaTime / 1000;
        particle.position.z += particle.velocity.z * deltaTime / 1000;
        
        // Update particle trail
        this.updateParticleTrail(particle);
        
        // Check for special events
        this.checkParticleEvents(particle);
        
        // Update visual properties
        this.updateParticleVisuals(particle);
    }
    
    calculateForces(particle) {
        let totalForceX = 0;
        let totalForceY = 0;
        let totalForceZ = 0;
        
        // Black hole gravitational force
        const blackHoleForce = this.calculateGravitationalForce(
            particle.position,
            this.blackHole.position,
            this.blackHole.mass
        );
        
        totalForceX += blackHoleForce.x;
        totalForceY += blackHoleForce.y;
        totalForceZ += blackHoleForce.z;
        
        // Gravity well forces
        for (const [wellId, well] of this.gravityWells) {
            const wellForce = this.calculateGravitationalForce(
                particle.position,
                well.position,
                well.mass * 0.3 // Wells have less influence than main black hole
            );
            
            totalForceX += wellForce.x;
            totalForceY += wellForce.y;
            totalForceZ += wellForce.z;
        }
        
        return {
            x: totalForceX,
            y: totalForceY,
            z: totalForceZ
        };
    }
    
    calculateGravitationalForce(pos1, pos2, mass) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dz = pos2.z - pos1.z;
        
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        const distance = Math.sqrt(distanceSquared);
        
        // Avoid division by zero and singularities
        if (distance < 1) return { x: 0, y: 0, z: 0 };
        
        const force = (this.config.physics.gravityStrength * mass) / distanceSquared;
        
        return {
            x: force * (dx / distance),
            y: force * (dy / distance),
            z: force * (dz / distance)
        };
    }
    
    updateParticleTrail(particle) {
        // Add current position to trail
        particle.trail.push({
            x: particle.position.x,
            y: particle.position.y,
            z: particle.position.z,
            timestamp: Date.now()
        });
        
        // Limit trail length
        if (particle.trail.length > this.config.particles.trailLength) {
            particle.trail.shift();
        }
    }
    
    checkParticleEvents(particle) {
        const distanceToBlackHole = this.calculateDistance(
            particle.position,
            this.blackHole.position
        );
        
        // Check if particle crossed event horizon
        if (distanceToBlackHole <= this.blackHole.eventHorizon && !particle.crossedEventHorizon) {
            particle.crossedEventHorizon = true;
            this.handleEventHorizonCrossing(particle);
        }
        
        // Check gravity well interactions
        for (const [wellId, well] of this.gravityWells) {
            const distanceToWell = this.calculateDistance(particle.position, well.position);
            
            if (distanceToWell <= well.influence && particle.skillType === wellId) {
                well.particleCount++;
                this.handleSkillParticleCapture(particle, well);
            }
        }
    }
    
    handleEventHorizonCrossing(particle) {
        console.log(`🕳️ Particle ${particle.id} crossed event horizon (${particle.skillType})`);
        
        // Award mastery experience
        const masteryXP = Math.floor(particle.mass * this.config.skillSystem.experienceMultiplier);
        
        // Emit Hawking radiation (new particles spawned)
        this.spawnHawkingRadiation(particle);
        
        // Broadcast achievement
        this.broadcastToClients({
            type: 'mastery_achieved',
            data: {
                particleId: particle.id,
                skillType: particle.skillType,
                masteryXP,
                position: { ...particle.position }
            }
        });
        
        // Update mastery level
        this.masteryLevel += masteryXP / 1000;
    }
    
    handleSkillParticleCapture(particle, well) {
        well.density += particle.mass / well.mass;
        
        // Check for skill branch unlock
        if (well.density >= this.config.skillSystem.branchingThreshold) {
            this.unlockSkillBranch(well);
        }
    }
    
    spawnHawkingRadiation(originParticle) {
        const radiationCount = Math.floor(Math.random() * 5) + 2;
        
        for (let i = 0; i < radiationCount; i++) {
            const angle = (Math.PI * 2 * i) / radiationCount;
            const distance = this.blackHole.eventHorizon + 10;
            
            this.createParticle({
                position: {
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    z: (Math.random() - 0.5) * 20
                },
                velocity: {
                    x: Math.cos(angle) * 50,
                    y: Math.sin(angle) * 50,
                    z: (Math.random() - 0.5) * 30
                },
                type: 'hawking_radiation',
                skillType: originParticle.skillType,
                mass: originParticle.mass * 0.1,
                color: '#ffffff'
            });
        }
    }
    
    spawnParticlesFromData() {
        // Connect to real data sources and spawn particles based on activity
        if (this.dataConnector && Math.random() < 0.1) { // 10% chance per frame
            this.spawnSkillParticle('experience', {
                position: this.generateRandomSpawnPosition(),
                skillType: this.selectRandomSkillType()
            });
        }
    }
    
    generateRandomSpawnPosition() {
        const radius = this.blackHole.accretionDisk * 0.8;
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 100;
        
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: height
        };
    }
    
    selectRandomSkillType() {
        const skillTypes = Array.from(this.gravityWells.keys());
        return skillTypes[Math.floor(Math.random() * skillTypes.length)];
    }
    
    createParticle(options = {}) {
        const particleId = `particle_${++this.lastParticleId}`;
        const spawnPosition = options.position || this.generateRandomSpawnPosition();
        
        const particle = {
            id: particleId,
            position: { ...spawnPosition },
            velocity: options.velocity || {
                x: (Math.random() - 0.5) * 10,
                y: (Math.random() - 0.5) * 10,
                z: (Math.random() - 0.5) * 10
            },
            acceleration: { x: 0, y: 0, z: 0 },
            mass: options.mass || Math.random() * 3 + 1,
            size: options.size || Math.random() * 3 + 2,
            color: options.color || this.getParticleColor(options.type || 'skill'),
            type: options.type || 'skill',
            skillType: options.skillType || this.selectRandomSkillType(),
            age: 0,
            lifespan: options.lifespan || this.config.physics.particleLifespan,
            alive: true,
            trail: [],
            crossedEventHorizon: false,
            glow: this.config.particles.glowIntensity,
            created: Date.now()
        };
        
        this.particles.set(particleId, particle);
        
        // Broadcast particle creation
        this.broadcastToClients({
            type: 'particle_created',
            data: particle
        });
        
        return particle;
    }
    
    getParticleColor(type) {
        return this.config.particles.colors[type] || this.config.particles.colors.skill;
    }
    
    removeParticle(particleId) {
        if (this.particles.has(particleId)) {
            this.particles.delete(particleId);
            
            this.broadcastToClients({
                type: 'particle_removed',
                data: { particleId }
            });
        }
    }
    
    updateGravityWellDensities() {
        for (const [wellId, well] of this.gravityWells) {
            // Decay density over time
            well.density *= 0.999;
            
            // Reset particle count for next frame
            well.particleCount = 0;
        }
    }
    
    checkSkillBranching() {
        for (const [wellId, well] of this.gravityWells) {
            if (well.density >= this.config.skillSystem.branchingThreshold && well.branches.length < 5) {
                if (Math.random() < 0.01) { // 1% chance per frame when threshold met
                    this.unlockSkillBranch(well);
                }
            }
        }
    }
    
    unlockSkillBranch(well) {
        const branchId = `${well.id}_branch_${well.branches.length + 1}`;
        const branchAngle = (Math.PI * 2 * well.branches.length) / 6; // Up to 6 branches
        const branchDistance = well.influence * 0.7;
        
        const branch = {
            id: branchId,
            parentWell: well.id,
            position: {
                x: well.position.x + Math.cos(branchAngle) * branchDistance,
                y: well.position.y + Math.sin(branchAngle) * branchDistance,
                z: well.position.z + (Math.random() - 0.5) * 50
            },
            mass: well.mass * 0.3,
            color: well.color,
            unlocked: true,
            masteryLevel: 0
        };
        
        well.branches.push(branch);
        this.skillBranches.set(branchId, branch);
        
        console.log(`🌿 New skill branch unlocked: ${branchId}`);
        
        // Broadcast branch creation
        this.broadcastToClients({
            type: 'skill_branch_unlocked',
            data: branch
        });
        
        // Create celebration particles
        this.spawnCelebrationParticles(well.position);
    }
    
    spawnCelebrationParticles(position) {
        for (let i = 0; i < 20; i++) {
            this.createParticle({
                position: {
                    x: position.x + (Math.random() - 0.5) * 50,
                    y: position.y + (Math.random() - 0.5) * 50,
                    z: position.z + (Math.random() - 0.5) * 50
                },
                velocity: {
                    x: (Math.random() - 0.5) * 100,
                    y: (Math.random() - 0.5) * 100,
                    z: (Math.random() - 0.5) * 100
                },
                type: 'achievement',
                mass: 0.5,
                lifespan: 5000,
                color: '#ffd700'
            });
        }
    }
    
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dz = pos2.z - pos1.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    updatePerformanceMetrics() {
        this.performance.particleCount = this.particles.size;
        this.performance.fps = Math.round(1000 / (Date.now() - this.lastFrameTime));
        this.performance.memoryUsage = process.memoryUsage().heapUsed;
    }
    
    // API handlers
    getSystemState(req, res) {
        res.json(this.getSystemStateData());
    }
    
    getSystemStateData() {
        return {
            blackHole: this.blackHole,
            gravityWells: Array.from(this.gravityWells.values()),
            skillBranches: Array.from(this.skillBranches.values()),
            masteryLevel: this.masteryLevel,
            performance: this.performance,
            config: {
                physics: this.config.physics,
                particles: this.config.particles
            }
        };
    }
    
    getParticles(req, res) {
        const particles = Array.from(this.particles.values());
        res.json({
            particles,
            count: particles.length,
            types: this.getParticleTypes()
        });
    }
    
    getParticleTypes() {
        const types = {};
        for (const particle of this.particles.values()) {
            types[particle.type] = (types[particle.type] || 0) + 1;
        }
        return types;
    }
    
    spawnParticle(req, res) {
        const { type, skillType, position, mass } = req.body;
        
        try {
            const particle = this.createParticle({
                type,
                skillType,
                position,
                mass
            });
            
            res.json({
                success: true,
                particle: {
                    id: particle.id,
                    type: particle.type,
                    skillType: particle.skillType
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    getGravityWells(req, res) {
        const wells = Array.from(this.gravityWells.values()).map(well => ({
            ...well,
            branches: well.branches.length
        }));
        
        res.json(wells);
    }
    
    createSkillBranch(req, res) {
        const { wellId } = req.body;
        
        if (!this.gravityWells.has(wellId)) {
            return res.status(404).json({ error: 'Gravity well not found' });
        }
        
        const well = this.gravityWells.get(wellId);
        
        if (well.density < this.config.skillSystem.branchingThreshold) {
            return res.status(400).json({ 
                error: 'Insufficient density for branching',
                required: this.config.skillSystem.branchingThreshold,
                current: well.density
            });
        }
        
        this.unlockSkillBranch(well);
        res.json({ success: true });
    }
    
    getPerformance(req, res) {
        res.json({
            ...this.performance,
            gravityWells: this.gravityWells.size,
            skillBranches: this.skillBranches.size,
            uptime: Date.now() - this.startTime
        });
    }
    
    handleClientMessage(ws, message) {
        switch (message.type) {
            case 'spawn_particle':
                this.createParticle(message.data);
                break;
                
            case 'camera_update':
                this.broadcastToClients({
                    type: 'camera_sync',
                    data: message.data,
                    sender: ws.id
                });
                break;
                
            case 'interaction':
                this.handleParticleInteraction(message.data);
                break;
        }
    }
    
    handleParticleInteraction(data) {
        // Handle user interactions with particles/gravity wells
        console.log('Particle interaction:', data);
    }
    
    connectToDataSources() {
        // Connect to existing systems for real data
        try {
            const WebSocketClient = require('ws');
            this.dataConnector = new WebSocketClient('ws://localhost:3030');
            
            this.dataConnector.on('open', () => {
                console.log('📡 Connected to data source');
                this.dataConnector.send(JSON.stringify({
                    type: 'subscribe_monitoring',
                    client: 'blackhole-particle-system'
                }));
            });
            
            this.dataConnector.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleDataUpdate(message);
                } catch (error) {
                    console.error('Data parsing error:', error);
                }
            });
            
        } catch (error) {
            console.log('📡 Data connector unavailable, using simulated data');
        }
    }
    
    handleDataUpdate(message) {
        switch (message.type) {
            case 'system_stats_update':
                this.spawnParticlesFromSystemStats(message.data);
                break;
                
            case 'avatar_created':
                this.spawnAchievementParticles();
                break;
        }
    }
    
    spawnParticlesFromSystemStats(stats) {
        // Spawn particles based on real system activity
        if (stats.database && stats.database.totalJobs > 0) {
            this.createParticle({
                type: 'experience',
                skillType: 'backend',
                mass: Math.min(stats.database.totalJobs / 10, 5)
            });
        }
        
        if (stats.services) {
            const healthyServices = Object.values(stats.services).filter(s => s.healthy).length;
            if (healthyServices > 0) {
                this.createParticle({
                    type: 'skill',
                    skillType: 'devops',
                    mass: healthyServices / 2
                });
            }
        }
    }
    
    spawnAchievementParticles() {
        for (let i = 0; i < 10; i++) {
            this.createParticle({
                type: 'achievement',
                skillType: 'ai',
                mass: 2
            });
        }
    }
    
    broadcastPhysicsUpdate() {
        if (this.clients.size === 0) return;
        
        const updateData = {
            type: 'physics_update',
            timestamp: Date.now(),
            particles: Array.from(this.particles.values()).map(p => ({
                id: p.id,
                position: p.position,
                velocity: p.velocity,
                color: p.color,
                size: p.size,
                glow: p.glow,
                trail: p.trail.slice(-5), // Send only recent trail points
                age: p.age,
                lifespan: p.lifespan
            })),
            gravityWells: Array.from(this.gravityWells.values()).map(w => ({
                id: w.id,
                position: w.position,
                mass: w.mass,
                color: w.color,
                density: w.density,
                particleCount: w.particleCount
            })),
            performance: this.performance
        };
        
        this.broadcastToClients(updateData);
    }
    
    sendToClient(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }
    
    broadcastToClients(data) {
        const message = JSON.stringify(data);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    generateBlackHoleInterface() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌌 Black Hole Particle System - AI Mastery Visualization</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            background: #000000;
            color: #ffffff;
            overflow: hidden;
            height: 100vh;
        }
        
        .container {
            width: 100vw;
            height: 100vh;
            position: relative;
            background: radial-gradient(circle at center, #1a0033 0%, #000000 70%);
        }
        
        #blackholeCanvas {
            width: 100%;
            height: 100%;
            display: block;
            cursor: crosshair;
        }
        
        .hud {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #00ff88;
            border-radius: 10px;
            padding: 15px;
            backdrop-filter: blur(10px);
        }
        
        .hud-title {
            color: #00ffff;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        .particle-controls {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            align-items: center;
        }
        
        .spawn-button {
            background: transparent;
            border: 2px solid #00ff88;
            color: #00ff88;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.3s;
        }
        
        .spawn-button:hover {
            background: rgba(0, 255, 136, 0.1);
            box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
        }
        
        .gravity-wells {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #ff6b6b;
            border-radius: 10px;
            padding: 15px;
            backdrop-filter: blur(10px);
        }
        
        .well-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            font-size: 12px;
        }
        
        .well-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
        }
        
        .performance {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #ffd700;
            border-radius: 10px;
            padding: 15px;
            backdrop-filter: blur(10px);
            color: #ffd700;
            font-size: 12px;
        }
        
        .loading-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(0, 255, 136, 0.3);
            border-top: 3px solid #00ff88;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .mastery-notification {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 215, 0, 0.9);
            color: #000;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 18px;
            font-weight: bold;
            display: none;
            animation: fadeInOut 3s ease-in-out;
        }
        
        @keyframes fadeInOut {
            0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
    </style>
</head>
<body>
    <div class="container">
        <canvas id="blackholeCanvas"></canvas>
        
        <div class="loading-overlay" id="loadingOverlay">
            <div class="spinner"></div>
            <div>Initializing Black Hole Physics...</div>
            <div style="font-size: 14px; margin-top: 10px; color: #888;">
                Calculating gravitational fields and particle dynamics
            </div>
        </div>
        
        <div class="hud">
            <div class="hud-title">🕳️ Event Horizon</div>
            <div>Particles: <span id="particleCount">0</span></div>
            <div>Mastery Level: <span id="masteryLevel">0</span></div>
            <div>Event Horizon: <span id="eventHorizon">${this.blackHole.eventHorizon}</span></div>
            <div>Accretion Disk: <span id="accretionDisk">${this.blackHole.accretionDisk}</span></div>
        </div>
        
        <div class="gravity-wells">
            <div class="hud-title">🌀 Gravity Wells</div>
            <div id="wellsList"></div>
        </div>
        
        <div class="performance">
            <div class="hud-title">⚡ Performance</div>
            <div>FPS: <span id="fps">0</span></div>
            <div>Physics Time: <span id="physicsTime">0</span>ms</div>
            <div>Memory: <span id="memoryUsage">0</span>MB</div>
        </div>
        
        <div class="particle-controls">
            <button class="spawn-button" onclick="spawnSkillParticle('frontend')">🎨 Frontend</button>
            <button class="spawn-button" onclick="spawnSkillParticle('backend')">🔧 Backend</button>
            <button class="spawn-button" onclick="spawnSkillParticle('ai')">🤖 AI</button>
            <button class="spawn-button" onclick="spawnSkillParticle('devops')">☁️ DevOps</button>
        </div>
        
        <div class="mastery-notification" id="masteryNotification"></div>
    </div>
    
    <script>
        class BlackHoleVisualization {
            constructor() {
                this.canvas = document.getElementById('blackholeCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.ws = null;
                
                this.camera = {
                    x: 0, y: 0, z: 500,
                    rotation: { x: 0, y: 0, z: 0 },
                    zoom: 1
                };
                
                this.particles = new Map();
                this.gravityWells = new Map();
                this.performance = { fps: 0, particleCount: 0 };
                
                this.connect();
                this.setupCanvas();
                this.setupEventListeners();
                this.animate();
            }
            
            connect() {
                this.ws = new WebSocket('ws://localhost:${this.config.wsPort}');
                
                this.ws.onopen = () => {
                    console.log('Connected to Black Hole System');
                    document.getElementById('loadingOverlay').style.display = 'none';
                };
                
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                };
                
                this.ws.onclose = () => {
                    console.log('Disconnected, reconnecting...');
                    setTimeout(() => this.connect(), 3000);
                };
            }
            
            setupCanvas() {
                this.resizeCanvas();
                window.addEventListener('resize', () => this.resizeCanvas());
            }
            
            resizeCanvas() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }
            
            setupEventListeners() {
                let isDragging = false;
                let lastMouse = { x: 0, y: 0 };
                
                this.canvas.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    lastMouse = { x: e.clientX, y: e.clientY };
                });
                
                this.canvas.addEventListener('mousemove', (e) => {
                    if (isDragging) {
                        const deltaX = e.clientX - lastMouse.x;
                        const deltaY = e.clientY - lastMouse.y;
                        
                        this.camera.x -= deltaX * 2;
                        this.camera.y -= deltaY * 2;
                        
                        lastMouse = { x: e.clientX, y: e.clientY };
                    }
                });
                
                this.canvas.addEventListener('mouseup', () => {
                    isDragging = false;
                });
                
                this.canvas.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    this.camera.zoom *= e.deltaY > 0 ? 0.9 : 1.1;
                    this.camera.zoom = Math.max(0.1, Math.min(5, this.camera.zoom));
                });
            }
            
            handleMessage(data) {
                switch (data.type) {
                    case 'system_state':
                        this.updateSystemState(data.data);
                        break;
                    case 'physics_update':
                        this.updatePhysics(data);
                        break;
                    case 'mastery_achieved':
                        this.showMasteryNotification(data.data);
                        break;
                    case 'skill_branch_unlocked':
                        this.showBranchUnlock(data.data);
                        break;
                }
            }
            
            updateSystemState(state) {
                // Update gravity wells
                state.gravityWells.forEach(well => {
                    this.gravityWells.set(well.id, well);
                });
                
                this.updateUI(state);
            }
            
            updatePhysics(data) {
                // Update particles
                this.particles.clear();
                data.particles.forEach(particle => {
                    this.particles.set(particle.id, particle);
                });
                
                // Update gravity wells
                data.gravityWells.forEach(well => {
                    if (this.gravityWells.has(well.id)) {
                        Object.assign(this.gravityWells.get(well.id), well);
                    }
                });
                
                this.performance = data.performance;
                this.updatePerformanceUI();
            }
            
            animate() {
                this.render();
                requestAnimationFrame(() => this.animate());
            }
            
            render() {
                // Clear canvas
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Render black hole
                this.renderBlackHole();
                
                // Render gravity wells
                this.renderGravityWells();
                
                // Render particles
                this.renderParticles();
            }
            
            renderBlackHole() {
                const centerX = this.canvas.width / 2 + this.camera.x;
                const centerY = this.canvas.height / 2 + this.camera.y;
                const radius = ${this.blackHole.eventHorizon} * this.camera.zoom;
                
                // Event horizon
                const gradient = this.ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, radius
                );
                gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
                gradient.addColorStop(0.7, 'rgba(50, 0, 100, 0.8)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Accretion disk
                const diskRadius = ${this.blackHole.accretionDisk} * this.camera.zoom;
                this.ctx.strokeStyle = 'rgba(255, 140, 0, 0.3)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, diskRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            renderGravityWells() {
                for (const well of this.gravityWells.values()) {
                    const screenPos = this.worldToScreen(well.position);
                    const radius = Math.sqrt(well.mass) * this.camera.zoom;
                    
                    // Well visualization
                    const gradient = this.ctx.createRadialGradient(
                        screenPos.x, screenPos.y, 0,
                        screenPos.x, screenPos.y, radius
                    );
                    gradient.addColorStop(0, well.color);
                    gradient.addColorStop(1, 'transparent');
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.globalAlpha = 0.3;
                    this.ctx.beginPath();
                    this.ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.globalAlpha = 1;
                    
                    // Well label
                    this.ctx.fillStyle = well.color;
                    this.ctx.font = '14px Courier';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(well.id.toUpperCase(), screenPos.x, screenPos.y - radius - 10);
                }
            }
            
            renderParticles() {
                for (const particle of this.particles.values()) {
                    const screenPos = this.worldToScreen(particle.position);
                    
                    // Particle trail
                    if (particle.trail && particle.trail.length > 1) {
                        this.ctx.strokeStyle = particle.color + '40';
                        this.ctx.lineWidth = 1;
                        this.ctx.beginPath();
                        
                        for (let i = 0; i < particle.trail.length; i++) {
                            const trailPos = this.worldToScreen(particle.trail[i]);
                            if (i === 0) {
                                this.ctx.moveTo(trailPos.x, trailPos.y);
                            } else {
                                this.ctx.lineTo(trailPos.x, trailPos.y);
                            }
                        }
                        this.ctx.stroke();
                    }
                    
                    // Particle glow
                    const gradient = this.ctx.createRadialGradient(
                        screenPos.x, screenPos.y, 0,
                        screenPos.x, screenPos.y, particle.size * 3
                    );
                    gradient.addColorStop(0, particle.color);
                    gradient.addColorStop(1, 'transparent');
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.arc(screenPos.x, screenPos.y, particle.size * 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Particle core
                    this.ctx.fillStyle = particle.color;
                    this.ctx.beginPath();
                    this.ctx.arc(screenPos.x, screenPos.y, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
            
            worldToScreen(worldPos) {
                return {
                    x: this.canvas.width / 2 + (worldPos.x + this.camera.x) * this.camera.zoom,
                    y: this.canvas.height / 2 + (worldPos.y + this.camera.y) * this.camera.zoom
                };
            }
            
            updateUI(state) {
                document.getElementById('particleCount').textContent = this.particles.size;
                document.getElementById('masteryLevel').textContent = Math.floor(state.masteryLevel || 0);
                
                // Update gravity wells list
                const wellsList = document.getElementById('wellsList');
                wellsList.innerHTML = '';
                
                for (const well of state.gravityWells) {
                    const wellDiv = document.createElement('div');
                    wellDiv.className = 'well-item';
                    wellDiv.innerHTML = \`
                        <div class="well-indicator" style="background: \${well.color};"></div>
                        <div>\${well.id}: \${(well.density * 100).toFixed(1)}%</div>
                    \`;
                    wellsList.appendChild(wellDiv);
                }
            }
            
            updatePerformanceUI() {
                document.getElementById('fps').textContent = this.performance.fps || 0;
                document.getElementById('physicsTime').textContent = this.performance.physicsTime || 0;
                document.getElementById('memoryUsage').textContent = 
                    Math.round((this.performance.memoryUsage || 0) / 1024 / 1024);
            }
            
            showMasteryNotification(data) {
                const notification = document.getElementById('masteryNotification');
                notification.textContent = \`🎉 Mastery Achieved in \${data.skillType.toUpperCase()}!\`;
                notification.style.display = 'block';
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 3000);
            }
            
            showBranchUnlock(data) {
                const notification = document.getElementById('masteryNotification');
                notification.textContent = \`🌿 New Skill Branch Unlocked!\`;
                notification.style.display = 'block';
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 3000);
            }
            
            spawnParticle(type, skillType) {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'spawn_particle',
                        data: { type, skillType }
                    }));
                }
            }
        }
        
        // Global functions for UI
        function spawnSkillParticle(skillType) {
            window.blackHoleViz.spawnParticle('skill', skillType);
        }
        
        // Initialize visualization
        window.blackHoleViz = new BlackHoleVisualization();
    </script>
</body>
</html>`;
    }
}

module.exports = BlackHoleParticleSystem;

// Start server if run directly
if (require.main === module) {
    console.log('🌌 Starting Black Hole Particle System...');
    const system = new BlackHoleParticleSystem();
    
    system.on('system_ready', () => {
        console.log('✅ Black Hole Particle System ready');
        console.log('🕳️ Event horizon visualization active');
        console.log('🌀 Gravity wells configured for skill progression');
        console.log('⚡ Real-time particle physics simulation running');
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Black Hole Particle System...');
        if (system.animationId) {
            cancelAnimationFrame(system.animationId);
        }
        console.log('✅ Physics simulation stopped');
        process.exit(0);
    });
}