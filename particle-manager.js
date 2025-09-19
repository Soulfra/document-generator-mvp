#!/usr/bin/env node

/**
 * 🌌 PARTICLE MANAGER
 * 
 * Advanced particle lifecycle management for the black hole system
 * Handles spawning, aging, interactions, and cleanup of particles
 */

const BlackHolePhysics = require('./black-hole-physics');

class ParticleManager {
    constructor(config = {}) {
        this.config = {
            // Particle limits
            maxParticles: 5000,
            maxParticlesPerType: {
                skill: 2000,
                experience: 1500,
                achievement: 500,
                mastery: 200,
                hawking_radiation: 300
            },
            
            // Lifecycle settings
            defaultLifespan: 30000,          // 30 seconds
            lifespanByType: {
                skill: 45000,                // 45 seconds
                experience: 30000,           // 30 seconds
                achievement: 60000,          // 60 seconds
                mastery: 120000,             // 2 minutes
                hawking_radiation: 10000     // 10 seconds
            },
            
            // Spawning rules
            spawnRates: {
                skill: 0.5,                  // Per second
                experience: 1.0,
                achievement: 0.1,
                mastery: 0.05,
                hawking_radiation: 0.3
            },
            
            // Physics integration
            enableCollisions: true,
            enableMerging: true,
            mergeThreshold: 5,               // Distance for merging
            collisionDamping: 0.8,           // Energy loss in collisions
            
            // Visual properties
            particleStyles: {
                skill: {
                    baseSize: 2,
                    sizeVariation: 1,
                    baseColor: '#00ff88',
                    glowIntensity: 0.8,
                    trailLength: 15
                },
                experience: {
                    baseSize: 1.5,
                    sizeVariation: 0.5,
                    baseColor: '#00bfff',
                    glowIntensity: 0.6,
                    trailLength: 20
                },
                achievement: {
                    baseSize: 4,
                    sizeVariation: 2,
                    baseColor: '#ffd700',
                    glowIntensity: 1.0,
                    trailLength: 25
                },
                mastery: {
                    baseSize: 6,
                    sizeVariation: 3,
                    baseColor: '#ff69b4',
                    glowIntensity: 1.2,
                    trailLength: 30
                },
                hawking_radiation: {
                    baseSize: 0.5,
                    sizeVariation: 0.2,
                    baseColor: '#ffffff',
                    glowIntensity: 2.0,
                    trailLength: 8
                }
            },
            
            ...config
        };
        
        // Core systems
        this.physics = new BlackHolePhysics(config.physics || {});
        this.particles = new Map();
        this.particlePool = new Map(); // Recycling pool
        this.lastParticleId = 0;
        
        // Type tracking
        this.particlesByType = new Map();
        Object.keys(this.config.particleStyles).forEach(type => {
            this.particlesByType.set(type, new Set());
        });
        
        // Performance tracking
        this.stats = {
            totalSpawned: 0,
            totalDestroyed: 0,
            totalMerged: 0,
            totalCollisions: 0,
            currentCount: 0,
            lastCleanup: Date.now()
        };
        
        // Event handlers
        this.eventHandlers = new Map();
        
        console.log('🌌 Particle Manager initialized');
        console.log(`📊 Max particles: ${this.config.maxParticles}`);
        console.log(`♻️ Recycling pool enabled: ${Object.keys(this.config.particleStyles).length} types`);
    }
    
    /**
     * Spawn a new particle
     */
    spawnParticle(options = {}) {
        const {
            type = 'skill',
            position = this.generateRandomPosition(),
            velocity = this.generateRandomVelocity(type),
            skillType = 'general',
            mass = this.generateMass(type),
            userData = {}
        } = options;
        
        // Check particle limits
        if (this.particles.size >= this.config.maxParticles) {
            this.performCleanup();
            if (this.particles.size >= this.config.maxParticles) {
                console.warn('Particle limit reached, skipping spawn');
                return null;
            }
        }
        
        // Check type-specific limits
        const typeSet = this.particlesByType.get(type);
        const maxForType = this.config.maxParticlesPerType[type] || 1000;
        if (typeSet && typeSet.size >= maxForType) {
            console.warn(`Particle type limit reached for ${type}`);
            return null;
        }
        
        // Try to reuse from pool
        let particle = this.getFromPool(type);
        
        if (!particle) {
            // Create new particle
            particle = this.createNewParticle();
        }
        
        // Initialize particle properties
        this.initializeParticle(particle, {
            type,
            position: { ...position },
            velocity: { ...velocity },
            skillType,
            mass,
            userData
        });
        
        // Add to tracking systems
        this.particles.set(particle.id, particle);
        typeSet?.add(particle.id);
        
        // Update stats
        this.stats.totalSpawned++;
        this.stats.currentCount = this.particles.size;
        
        // Emit spawn event
        this.emit('particle_spawned', particle);
        
        return particle;
    }
    
    /**
     * Create a new particle object
     */
    createNewParticle() {
        const particleId = `particle_${++this.lastParticleId}`;
        
        return {
            id: particleId,
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            mass: 1,
            size: 1,
            color: '#ffffff',
            type: 'skill',
            skillType: 'general',
            age: 0,
            lifespan: 30000,
            alive: true,
            trail: [],
            userData: {},
            
            // Physics properties
            speed: 0,
            distanceFromBlackHole: 0,
            timeDilation: 1,
            redshift: 0,
            stretchFactor: 1,
            
            // Special states
            inEventHorizon: false,
            inISCO: false,
            crossedEventHorizon: false,
            captured: false,
            
            // Visual properties
            glow: 0.8,
            opacity: 1.0,
            rotation: 0,
            
            // Interaction properties
            canMerge: true,
            mergeRadius: 5,
            lastCollision: 0,
            
            created: Date.now()
        };
    }
    
    /**
     * Initialize particle with specific properties
     */
    initializeParticle(particle, options) {
        const {
            type,
            position,
            velocity,
            skillType,
            mass,
            userData
        } = options;
        
        const style = this.config.particleStyles[type] || this.config.particleStyles.skill;
        const lifespan = this.config.lifespanByType[type] || this.config.defaultLifespan;
        
        // Basic properties
        particle.type = type;
        particle.skillType = skillType;
        particle.mass = mass;
        particle.position = position;
        particle.velocity = velocity;
        particle.userData = userData;
        
        // Lifecycle
        particle.age = 0;
        particle.lifespan = lifespan + (Math.random() - 0.5) * lifespan * 0.2; // ±10% variation
        particle.alive = true;
        
        // Visual properties
        particle.size = style.baseSize + Math.random() * style.sizeVariation;
        particle.color = this.generateColor(type, style.baseColor);
        particle.glow = style.glowIntensity;
        particle.opacity = 1.0;
        
        // Trail
        particle.trail = [];
        particle.trailLength = style.trailLength;
        
        // Reset physics properties
        particle.acceleration = { x: 0, y: 0, z: 0 };
        particle.speed = 0;
        particle.distanceFromBlackHole = 0;
        particle.timeDilation = 1;
        particle.redshift = 0;
        particle.stretchFactor = 1;
        
        // Reset states
        particle.inEventHorizon = false;
        particle.inISCO = false;
        particle.crossedEventHorizon = false;
        particle.captured = false;
        
        // Interaction properties
        particle.canMerge = type !== 'hawking_radiation';
        particle.mergeRadius = particle.size * 2;
        particle.lastCollision = 0;
        
        particle.created = Date.now();
    }
    
    /**
     * Update all particles
     */
    updateParticles(deltaTime, gravityWells = []) {
        const particlesToRemove = [];
        const particleArray = Array.from(this.particles.values());
        
        // Update individual particles
        for (const particle of particleArray) {
            this.updateParticle(particle, deltaTime, gravityWells);
            
            if (!particle.alive) {
                particlesToRemove.push(particle.id);
            }
        }
        
        // Handle interactions
        if (this.config.enableCollisions) {
            this.processCollisions(particleArray);
        }
        
        if (this.config.enableMerging) {
            this.processMerging(particleArray);
        }
        
        // Remove dead particles
        for (const particleId of particlesToRemove) {
            this.removeParticle(particleId);
        }
        
        // Periodic cleanup
        if (Date.now() - this.stats.lastCleanup > 10000) { // Every 10 seconds
            this.performCleanup();
            this.stats.lastCleanup = Date.now();
        }
        
        this.stats.currentCount = this.particles.size;
    }
    
    /**
     * Update individual particle
     */
    updateParticle(particle, deltaTime, gravityWells) {
        // Age the particle
        particle.age += deltaTime * particle.timeDilation; // Account for time dilation
        
        // Check if particle should die
        if (particle.age > particle.lifespan) {
            particle.alive = false;
            this.emit('particle_died', particle, 'age');
            return;
        }
        
        // Update physics
        this.physics.updateParticlePhysics(particle, deltaTime, gravityWells);
        
        // Update trail
        this.updateParticleTrail(particle);
        
        // Update visual properties
        this.updateParticleVisuals(particle);
        
        // Check for special events
        this.checkParticleEvents(particle);
        
        // Handle event horizon crossing
        if (particle.inEventHorizon && !particle.crossedEventHorizon) {
            particle.crossedEventHorizon = true;
            this.handleEventHorizonCrossing(particle);
        }
    }
    
    /**
     * Update particle trail
     */
    updateParticleTrail(particle) {
        // Add current position to trail
        particle.trail.push({
            x: particle.position.x,
            y: particle.position.y,
            z: particle.position.z,
            timestamp: Date.now(),
            opacity: particle.opacity
        });
        
        // Limit trail length
        while (particle.trail.length > particle.trailLength) {
            particle.trail.shift();
        }
        
        // Update trail opacity
        for (let i = 0; i < particle.trail.length; i++) {
            const point = particle.trail[i];
            const age = Date.now() - point.timestamp;
            const maxAge = 2000; // 2 seconds
            point.opacity = Math.max(0, 1 - age / maxAge) * particle.opacity;
        }
    }
    
    /**
     * Update particle visual properties
     */
    updateParticleVisuals(particle) {
        // Calculate opacity based on age and proximity to black hole
        const ageRatio = particle.age / particle.lifespan;
        const distanceOpacity = Math.min(1, particle.distanceFromBlackHole / 50);
        
        particle.opacity = Math.max(0.1, (1 - ageRatio * 0.7) * distanceOpacity);
        
        // Apply redshift to color
        if (particle.redshift > 0.01) {
            particle.color = this.applyRedshift(particle.color, particle.redshift);
        }
        
        // Apply stretching effect from tidal forces
        if (particle.stretchFactor > 1.1) {
            particle.size *= particle.stretchFactor;
        }
        
        // Rotation based on orbital motion
        if (particle.speed > 1) {
            particle.rotation += particle.speed * 0.01;
        }
        
        // Pulsing effect for special particles
        if (particle.type === 'mastery' || particle.type === 'achievement') {
            const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 1;
            particle.glow = (this.config.particleStyles[particle.type].glowIntensity || 1) * pulse;
        }
    }
    
    /**
     * Check for special particle events
     */
    checkParticleEvents(particle) {
        // Near-miss with event horizon
        if (particle.distanceFromBlackHole < this.physics.config.schwarzschildRadius * 1.5 &&
            particle.distanceFromBlackHole > this.physics.config.schwarzschildRadius &&
            !particle.nearMissReported) {
            
            particle.nearMissReported = true;
            this.emit('near_miss', particle);
        }
        
        // Entering ISCO
        if (particle.inISCO && !particle.enteredISCO) {
            particle.enteredISCO = true;
            this.emit('entered_isco', particle);
        }
        
        // High-speed detection
        if (particle.speed > particle.escapeVelocity * 0.8 && !particle.highSpeedReported) {
            particle.highSpeedReported = true;
            this.emit('high_speed', particle);
        }
    }
    
    /**
     * Handle event horizon crossing
     */
    handleEventHorizonCrossing(particle) {
        console.log(`🕳️ Particle ${particle.id} crossed event horizon`);
        
        // Award experience based on particle type and mass
        const experience = this.calculateExperience(particle);
        
        // Spawn Hawking radiation
        this.spawnHawkingRadiation(particle);
        
        // Mark for removal after brief delay
        setTimeout(() => {
            particle.alive = false;
        }, 1000);
        
        this.emit('horizon_crossed', {
            particle,
            experience,
            position: { ...particle.position }
        });
    }
    
    /**
     * Calculate experience from particle absorption
     */
    calculateExperience(particle) {
        const baseExperience = {
            skill: 10,
            experience: 25,
            achievement: 100,
            mastery: 500,
            hawking_radiation: 5
        };
        
        const base = baseExperience[particle.type] || 10;
        const massMultiplier = Math.log(particle.mass + 1) + 1;
        const timeMultiplier = Math.min(2, particle.age / particle.lifespan + 0.5);
        
        return Math.floor(base * massMultiplier * timeMultiplier);
    }
    
    /**
     * Spawn Hawking radiation from absorbed particle
     */
    spawnHawkingRadiation(originParticle) {
        const radiationCount = Math.floor(Math.random() * 3) + 1;
        const eventHorizon = this.physics.config.schwarzschildRadius;
        
        for (let i = 0; i < radiationCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const elevation = (Math.random() - 0.5) * Math.PI * 0.5;
            const distance = eventHorizon + Math.random() * 20 + 5;
            
            this.spawnParticle({
                type: 'hawking_radiation',
                position: {
                    x: Math.cos(angle) * Math.cos(elevation) * distance,
                    y: Math.sin(angle) * Math.cos(elevation) * distance,
                    z: Math.sin(elevation) * distance
                },
                velocity: {
                    x: Math.cos(angle) * Math.cos(elevation) * 100,
                    y: Math.sin(angle) * Math.cos(elevation) * 100,
                    z: Math.sin(elevation) * 100
                },
                mass: originParticle.mass * 0.1,
                skillType: originParticle.skillType,
                userData: {
                    originParticle: originParticle.id,
                    hawkingGeneration: true
                }
            });
        }
    }
    
    /**
     * Process particle collisions
     */
    processCollisions(particles) {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                
                if (!p1.alive || !p2.alive) continue;
                
                const distance = this.calculateDistance(p1.position, p2.position);
                const collisionRadius = (p1.size + p2.size) * 0.5;
                
                if (distance < collisionRadius) {
                    this.handleCollision(p1, p2);
                }
            }
        }
    }
    
    /**
     * Handle collision between two particles
     */
    handleCollision(p1, p2) {
        const now = Date.now();
        
        // Prevent multiple collisions in short time
        if (now - p1.lastCollision < 100 || now - p2.lastCollision < 100) {
            return;
        }
        
        p1.lastCollision = now;
        p2.lastCollision = now;
        
        // Calculate collision response
        const totalMass = p1.mass + p2.mass;
        const massRatio1 = p2.mass / totalMass;
        const massRatio2 = p1.mass / totalMass;
        
        // Exchange momentum with damping
        const damping = this.config.collisionDamping;
        
        const v1x = p1.velocity.x;
        const v1y = p1.velocity.y;
        const v1z = p1.velocity.z;
        
        p1.velocity.x = (p1.velocity.x * massRatio2 + p2.velocity.x * massRatio1) * damping;
        p1.velocity.y = (p1.velocity.y * massRatio2 + p2.velocity.y * massRatio1) * damping;
        p1.velocity.z = (p1.velocity.z * massRatio2 + p2.velocity.z * massRatio1) * damping;
        
        p2.velocity.x = (v1x * massRatio1 + p2.velocity.x * massRatio2) * damping;
        p2.velocity.y = (v1y * massRatio1 + p2.velocity.y * massRatio2) * damping;
        p2.velocity.z = (v1z * massRatio1 + p2.velocity.z * massRatio2) * damping;
        
        // Separate particles to prevent sticking
        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const dz = p2.position.z - p1.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance > 0) {
            const separationDistance = (p1.size + p2.size) * 0.6;
            const separationFactor = separationDistance / distance;
            
            p1.position.x -= dx * separationFactor * 0.5;
            p1.position.y -= dy * separationFactor * 0.5;
            p1.position.z -= dz * separationFactor * 0.5;
            
            p2.position.x += dx * separationFactor * 0.5;
            p2.position.y += dy * separationFactor * 0.5;
            p2.position.z += dz * separationFactor * 0.5;
        }
        
        this.stats.totalCollisions++;
        this.emit('collision', { p1, p2 });
    }
    
    /**
     * Process particle merging
     */
    processMerging(particles) {
        const mergeCandidates = [];
        
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                
                if (!p1.alive || !p2.alive || !p1.canMerge || !p2.canMerge) continue;
                if (p1.type !== p2.type || p1.skillType !== p2.skillType) continue;
                
                const distance = this.calculateDistance(p1.position, p2.position);
                const mergeRadius = Math.min(p1.mergeRadius, p2.mergeRadius);
                
                if (distance < mergeRadius) {
                    mergeCandidates.push([p1, p2]);
                }
            }
        }
        
        // Process merges
        for (const [p1, p2] of mergeCandidates) {
            if (p1.alive && p2.alive) {
                this.mergeParticles(p1, p2);
            }
        }
    }
    
    /**
     * Merge two particles
     */
    mergeParticles(p1, p2) {
        // Calculate merged properties
        const totalMass = p1.mass + p2.mass;
        const massRatio1 = p1.mass / totalMass;
        const massRatio2 = p2.mass / totalMass;
        
        // Merge into p1, remove p2
        p1.position.x = p1.position.x * massRatio1 + p2.position.x * massRatio2;
        p1.position.y = p1.position.y * massRatio1 + p2.position.y * massRatio2;
        p1.position.z = p1.position.z * massRatio1 + p2.position.z * massRatio2;
        
        p1.velocity.x = p1.velocity.x * massRatio1 + p2.velocity.x * massRatio2;
        p1.velocity.y = p1.velocity.y * massRatio1 + p2.velocity.y * massRatio2;
        p1.velocity.z = p1.velocity.z * massRatio1 + p2.velocity.z * massRatio2;
        
        p1.mass = totalMass;
        p1.size = Math.pow(totalMass, 1/3) * 2; // Volume-based sizing
        p1.lifespan = Math.max(p1.lifespan, p2.lifespan);
        
        // Merge user data
        p1.userData = { ...p1.userData, ...p2.userData };
        
        // Remove merged particle
        p2.alive = false;
        
        this.stats.totalMerged++;
        this.emit('merge', { survivor: p1, merged: p2 });
        
        console.log(`🔄 Particles merged: ${p2.id} → ${p1.id} (mass: ${totalMass.toFixed(2)})`);
    }
    
    /**
     * Remove particle from system
     */
    removeParticle(particleId) {
        const particle = this.particles.get(particleId);
        if (!particle) return;
        
        // Remove from type tracking
        const typeSet = this.particlesByType.get(particle.type);
        typeSet?.delete(particleId);
        
        // Return to pool for reuse
        this.returnToPool(particle);
        
        // Remove from main collection
        this.particles.delete(particleId);
        
        this.stats.totalDestroyed++;
        this.emit('particle_removed', particle);
    }
    
    /**
     * Get particle from recycling pool
     */
    getFromPool(type) {
        const poolKey = type;
        const pool = this.particlePool.get(poolKey) || [];
        
        if (pool.length > 0) {
            return pool.pop();
        }
        
        return null;
    }
    
    /**
     * Return particle to recycling pool
     */
    returnToPool(particle) {
        // Clean particle for reuse
        particle.alive = false;
        particle.age = 0;
        particle.trail = [];
        particle.userData = {};
        
        // Add to pool
        const poolKey = particle.type;
        if (!this.particlePool.has(poolKey)) {
            this.particlePool.set(poolKey, []);
        }
        
        const pool = this.particlePool.get(poolKey);
        if (pool.length < 100) { // Limit pool size
            pool.push(particle);
        }
    }
    
    /**
     * Perform cleanup operations
     */
    performCleanup() {
        // Remove very old particles
        const oldThreshold = Date.now() - 60000; // 60 seconds
        const toRemove = [];
        
        for (const [id, particle] of this.particles) {
            if (particle.created < oldThreshold) {
                toRemove.push(id);
            }
        }
        
        toRemove.forEach(id => this.removeParticle(id));
        
        // Clean up pools
        for (const [type, pool] of this.particlePool) {
            if (pool.length > 50) {
                this.particlePool.set(type, pool.slice(-50));
            }
        }
        
        console.log(`🧹 Cleanup: removed ${toRemove.length} old particles`);
    }
    
    /**
     * Generate particle properties
     */
    generateRandomPosition() {
        const radius = Math.random() * 800 + 200;
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 200;
        
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: height
        };
    }
    
    generateRandomVelocity(type) {
        const baseSpeed = {
            skill: 20,
            experience: 15,
            achievement: 30,
            mastery: 25,
            hawking_radiation: 80
        }[type] || 20;
        
        const speed = baseSpeed * (0.5 + Math.random());
        const angle = Math.random() * Math.PI * 2;
        const elevation = (Math.random() - 0.5) * Math.PI * 0.3;
        
        return {
            x: Math.cos(angle) * Math.cos(elevation) * speed,
            y: Math.sin(angle) * Math.cos(elevation) * speed,
            z: Math.sin(elevation) * speed
        };
    }
    
    generateMass(type) {
        const baseMass = {
            skill: 1,
            experience: 0.8,
            achievement: 3,
            mastery: 5,
            hawking_radiation: 0.2
        }[type] || 1;
        
        return baseMass * (0.5 + Math.random());
    }
    
    generateColor(type, baseColor) {
        // Add some variation to base color
        const variations = [
            baseColor,
            this.adjustColor(baseColor, 0.1),
            this.adjustColor(baseColor, -0.1),
            this.adjustColor(baseColor, 0, 0.1),
            this.adjustColor(baseColor, 0, -0.1)
        ];
        
        return variations[Math.floor(Math.random() * variations.length)];
    }
    
    adjustColor(color, hueShift = 0, saturationShift = 0) {
        // Simple color adjustment (would be more sophisticated in production)
        return color;
    }
    
    applyRedshift(color, redshift) {
        // Shift color toward red spectrum based on redshift
        // This is a simplified implementation
        if (redshift < 0.1) return color;
        
        const redshiftColors = [
            color,
            '#ff8888',
            '#ff6666',
            '#ff4444',
            '#ff0000'
        ];
        
        const index = Math.min(4, Math.floor(redshift * 10));
        return redshiftColors[index];
    }
    
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dz = pos2.z - pos1.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * Event system
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    
    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Event handler error for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Get current statistics
     */
    getStatistics() {
        const typeStats = {};
        for (const [type, set] of this.particlesByType) {
            typeStats[type] = set.size;
        }
        
        return {
            ...this.stats,
            particlesByType: typeStats,
            poolSizes: Object.fromEntries(
                Array.from(this.particlePool.entries()).map(([type, pool]) => [type, pool.length])
            )
        };
    }
    
    /**
     * Get all particles
     */
    getAllParticles() {
        return Array.from(this.particles.values());
    }
    
    /**
     * Get particles by type
     */
    getParticlesByType(type) {
        const ids = this.particlesByType.get(type);
        if (!ids) return [];
        
        return Array.from(ids).map(id => this.particles.get(id)).filter(Boolean);
    }
    
    /**
     * Clear all particles
     */
    clearAll() {
        this.particles.clear();
        this.particlesByType.forEach(set => set.clear());
        this.particlePool.clear();
        
        console.log('🧹 All particles cleared');
    }
    
    /**
     * Get configuration
     */
    getConfiguration() {
        return { ...this.config };
    }
}

module.exports = ParticleManager;

// Example usage
if (require.main === module) {
    console.log('🌌 Particle Manager Test');
    
    const manager = new ParticleManager({
        maxParticles: 100
    });
    
    // Set up event listeners
    manager.on('particle_spawned', (particle) => {
        console.log(`Spawned: ${particle.id} (${particle.type})`);
    });
    
    manager.on('horizon_crossed', (data) => {
        console.log(`Horizon crossed: ${data.particle.id}, XP: ${data.experience}`);
    });
    
    manager.on('merge', (data) => {
        console.log(`Merge: ${data.merged.id} → ${data.survivor.id}`);
    });
    
    // Spawn some test particles
    for (let i = 0; i < 10; i++) {
        manager.spawnParticle({
            type: i % 2 === 0 ? 'skill' : 'experience',
            skillType: ['frontend', 'backend', 'ai', 'devops'][i % 4]
        });
    }
    
    // Simulate updates
    let frame = 0;
    const simulate = () => {
        manager.updateParticles(16.67); // 60fps
        
        if (frame % 60 === 0) { // Every second
            console.log('Stats:', manager.getStatistics());
        }
        
        frame++;
        
        if (frame < 600) { // Run for 10 seconds
            setTimeout(simulate, 16);
        } else {
            console.log('Final stats:', manager.getStatistics());
        }
    };
    
    simulate();
}