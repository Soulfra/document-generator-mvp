#!/usr/bin/env node

/**
 * 🌌 BLACK HOLE PHYSICS ENGINE
 * 
 * Advanced gravitational physics simulation for particle systems
 * Implements realistic black hole dynamics, gravity wells, and particle interactions
 */

class BlackHolePhysics {
    constructor(config = {}) {
        this.config = {
            // Physical constants
            gravitationalConstant: 6.67430e-11,  // Real G value (scaled for simulation)
            speedOfLight: 299792458,             // Speed of light (scaled)
            planckConstant: 6.62607015e-34,      // Planck constant
            
            // Black hole properties
            blackHoleMass: 1000,                 // Simulation mass units
            schwarzschildRadius: 50,             // Event horizon radius
            innerStableCircularOrbit: 150,       // ISCO radius (3 * Rs)
            photonSphere: 75,                    // Photon sphere (1.5 * Rs)
            
            // Simulation scaling
            timeScale: 1.0,                      // Time dilation factor
            spaceScale: 1.0,                     // Space scaling factor
            massScale: 1.0,                      // Mass scaling factor
            
            // Performance optimizations
            maxCalculationDistance: 2000,        // Beyond this, use approximations
            minForceThreshold: 0.001,           // Minimum force to calculate
            relativistic: false,                 // Enable relativistic effects
            
            ...config
        };
        
        // Cached calculations
        this.forceCache = new Map();
        this.fieldStrengthCache = new Map();
        
        // Physics metrics
        this.metrics = {
            particlesInEventHorizon: 0,
            particlesInISCO: 0,
            totalGravitationalEnergy: 0,
            averageParticleVelocity: 0,
            maxAcceleration: 0
        };
        
        console.log('⚡ Black Hole Physics Engine initialized');
        console.log(`🕳️ Event Horizon: ${this.config.schwarzschildRadius} units`);
        console.log(`🌀 ISCO: ${this.config.innerStableCircularOrbit} units`);
        console.log(`💫 Photon Sphere: ${this.config.photonSphere} units`);
    }
    
    /**
     * Calculate gravitational force between two objects
     */
    calculateGravitationalForce(pos1, pos2, mass1, mass2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dz = pos2.z - pos1.z;
        
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        const distance = Math.sqrt(distanceSquared);
        
        // Avoid singularities and extremely close approaches
        if (distance < this.config.schwarzschildRadius * 0.1) {
            return { x: 0, y: 0, z: 0, distance, magnitude: 0 };
        }
        
        // Apply relativistic corrections if enabled
        let force;
        if (this.config.relativistic && distance < this.config.schwarzschildRadius * 10) {
            force = this.calculateRelativisticForce(distance, mass1, mass2);
        } else {
            // Classical Newtonian gravity
            force = (this.config.gravitationalConstant * mass1 * mass2) / distanceSquared;
        }
        
        // Normalize direction vector
        const directionX = dx / distance;
        const directionY = dy / distance;
        const directionZ = dz / distance;
        
        return {
            x: force * directionX,
            y: force * directionY,
            z: force * directionZ,
            distance,
            magnitude: force
        };
    }
    
    /**
     * Calculate relativistic gravitational effects
     */
    calculateRelativisticForce(distance, mass1, mass2) {
        // Simplified relativistic correction
        const rs = this.config.schwarzschildRadius;
        const relativisticFactor = 1 + (3 * rs) / (2 * distance);
        
        const classicalForce = (this.config.gravitationalConstant * mass1 * mass2) / (distance * distance);
        return classicalForce * relativisticFactor;
    }
    
    /**
     * Calculate tidal forces for particle stretching effects
     */
    calculateTidalForces(position, particleSize, blackHoleMass) {
        const distance = Math.sqrt(
            position.x * position.x + 
            position.y * position.y + 
            position.z * position.z
        );
        
        if (distance > this.config.maxCalculationDistance) {
            return { radial: 0, tangential: 0 };
        }
        
        // Tidal acceleration = 2GM * size / r^3
        const tidalAcceleration = (2 * this.config.gravitationalConstant * blackHoleMass * particleSize) 
                                / Math.pow(distance, 3);
        
        return {
            radial: tidalAcceleration,
            tangential: tidalAcceleration * 0.5
        };
    }
    
    /**
     * Calculate orbital velocity for circular orbits
     */
    calculateOrbitalVelocity(radius, centralMass) {
        if (radius <= this.config.schwarzschildRadius) {
            return this.config.speedOfLight; // At event horizon, escape velocity = c
        }
        
        // v = sqrt(GM/r)
        return Math.sqrt(
            (this.config.gravitationalConstant * centralMass) / radius
        );
    }
    
    /**
     * Calculate escape velocity at given radius
     */
    calculateEscapeVelocity(radius, centralMass) {
        if (radius <= this.config.schwarzschildRadius) {
            return this.config.speedOfLight; // Cannot escape from inside event horizon
        }
        
        // v_escape = sqrt(2GM/r)
        return Math.sqrt(
            (2 * this.config.gravitationalConstant * centralMass) / radius
        );
    }
    
    /**
     * Calculate gravitational time dilation
     */
    calculateTimeDilation(radius) {
        if (radius <= this.config.schwarzschildRadius) {
            return 0; // Time stops at event horizon
        }
        
        const rs = this.config.schwarzschildRadius;
        
        // dt/dt_infinity = sqrt(1 - rs/r)
        return Math.sqrt(1 - rs / radius);
    }
    
    /**
     * Calculate gravitational redshift
     */
    calculateRedshift(radius) {
        const timeDilation = this.calculateTimeDilation(radius);
        return 1 / timeDilation - 1; // z = 1/sqrt(1-rs/r) - 1
    }
    
    /**
     * Determine if position is within event horizon
     */
    isWithinEventHorizon(position) {
        const distance = Math.sqrt(
            position.x * position.x + 
            position.y * position.y + 
            position.z * position.z
        );
        return distance <= this.config.schwarzschildRadius;
    }
    
    /**
     * Determine if position is within ISCO
     */
    isWithinISCO(position) {
        const distance = Math.sqrt(
            position.x * position.x + 
            position.y * position.y + 
            position.z * position.z
        );
        return distance <= this.config.innerStableCircularOrbit;
    }
    
    /**
     * Calculate frame dragging effects (Lense-Thirring)
     */
    calculateFrameDragging(position, angularMomentum) {
        const distance = Math.sqrt(
            position.x * position.x + 
            position.y * position.y + 
            position.z * position.z
        );
        
        if (distance > this.config.maxCalculationDistance) {
            return { x: 0, y: 0, z: 0 };
        }
        
        // Simplified frame dragging calculation
        const frameDragStrength = (2 * angularMomentum) / Math.pow(distance, 3);
        
        return {
            x: -position.y * frameDragStrength,
            y: position.x * frameDragStrength,
            z: 0 // Assuming rotation in x-y plane
        };
    }
    
    /**
     * Calculate accretion disk forces
     */
    calculateAccretionForces(position, diskProperties = {}) {
        const {
            innerRadius = this.config.innerStableCircularOrbit,
            outerRadius = this.config.schwarzschildRadius * 20,
            temperature = 1000,
            density = 1.0
        } = diskProperties;
        
        const distance = Math.sqrt(
            position.x * position.x + 
            position.y * position.y + 
            position.z * position.z
        );
        
        const heightFromDisk = Math.abs(position.z);
        
        // Only apply forces if within disk region
        if (distance < innerRadius || distance > outerRadius || heightFromDisk > 50) {
            return { drag: { x: 0, y: 0, z: 0 }, pressure: { x: 0, y: 0, z: 0 } };
        }
        
        // Drag force proportional to velocity and density
        const dragCoefficient = density * 0.001;
        
        // Pressure forces push particles toward disk plane
        const pressureForce = heightFromDisk * temperature * 0.0001;
        
        return {
            drag: {
                x: 0, // Velocity-dependent, calculated in main physics loop
                y: 0,
                z: 0
            },
            pressure: {
                x: 0,
                y: 0,
                z: position.z > 0 ? -pressureForce : pressureForce
            }
        };
    }
    
    /**
     * Calculate Hawking radiation properties
     */
    calculateHawkingRadiation() {
        const mass = this.config.blackHoleMass;
        const kB = 1.380649e-23; // Boltzmann constant
        const hBar = this.config.planckConstant / (2 * Math.PI);
        const c = this.config.speedOfLight;
        
        // Hawking temperature: T = hbar*c^3 / (8*pi*G*M*kB)
        const temperature = (hBar * Math.pow(c, 3)) / 
                           (8 * Math.PI * this.config.gravitationalConstant * mass * kB);
        
        // Evaporation rate (simplified)
        const evaporationRate = Math.pow(mass, -2) * 1e-30;
        
        return {
            temperature,
            evaporationRate,
            luminosity: Math.pow(mass, -2) // Simplified luminosity
        };
    }
    
    /**
     * Apply gravitational lensing effect
     */
    calculateLensing(lightRayPosition, lightRayDirection) {
        const distance = Math.sqrt(
            lightRayPosition.x * lightRayPosition.x + 
            lightRayPosition.y * lightRayPosition.y + 
            lightRayPosition.z * lightRayPosition.z
        );
        
        if (distance > this.config.maxCalculationDistance) {
            return { x: 0, y: 0, z: 0 };
        }
        
        // Impact parameter
        const b = distance;
        const rs = this.config.schwarzschildRadius;
        
        // Deflection angle (weak field approximation)
        const deflectionAngle = (4 * this.config.gravitationalConstant * this.config.blackHoleMass) / 
                               (this.config.speedOfLight * this.config.speedOfLight * b);
        
        // Calculate perpendicular direction for deflection
        const perpX = -lightRayPosition.y / distance;
        const perpY = lightRayPosition.x / distance;
        
        return {
            x: perpX * deflectionAngle,
            y: perpY * deflectionAngle,
            z: 0
        };
    }
    
    /**
     * Update particle physics state
     */
    updateParticlePhysics(particle, deltaTime, gravityWells = []) {
        const forces = { x: 0, y: 0, z: 0 };
        
        // Black hole gravitational force
        const blackHoleForce = this.calculateGravitationalForce(
            particle.position,
            { x: 0, y: 0, z: 0 }, // Black hole at origin
            particle.mass,
            this.config.blackHoleMass
        );
        
        forces.x += blackHoleForce.x;
        forces.y += blackHoleForce.y;
        forces.z += blackHoleForce.z;
        
        // Gravity well forces
        for (const well of gravityWells) {
            const wellForce = this.calculateGravitationalForce(
                particle.position,
                well.position,
                particle.mass,
                well.mass
            );
            
            forces.x += wellForce.x * 0.3; // Reduce well influence
            forces.y += wellForce.y * 0.3;
            forces.z += wellForce.z * 0.3;
        }
        
        // Apply tidal forces if close to black hole
        const distance = Math.sqrt(
            particle.position.x * particle.position.x + 
            particle.position.y * particle.position.y + 
            particle.position.z * particle.position.z
        );
        
        if (distance < this.config.schwarzschildRadius * 10) {
            const tidalForces = this.calculateTidalForces(
                particle.position,
                particle.size || 1,
                this.config.blackHoleMass
            );
            
            // Apply stretching effect
            const stretchFactor = 1 + tidalForces.radial * 0.001;
            particle.stretchFactor = stretchFactor;
        }
        
        // Calculate time dilation effect
        particle.timeDilation = this.calculateTimeDilation(distance);
        
        // Apply time-dilated physics
        const effectiveDeltaTime = deltaTime * particle.timeDilation;
        
        // Update acceleration
        particle.acceleration = {
            x: forces.x / particle.mass,
            y: forces.y / particle.mass,
            z: forces.z / particle.mass
        };
        
        // Update velocity
        particle.velocity.x += particle.acceleration.x * effectiveDeltaTime / 1000;
        particle.velocity.y += particle.acceleration.y * effectiveDeltaTime / 1000;
        particle.velocity.z += particle.acceleration.z * effectiveDeltaTime / 1000;
        
        // Apply velocity damping for stability
        const damping = 0.9999;
        particle.velocity.x *= damping;
        particle.velocity.y *= damping;
        particle.velocity.z *= damping;
        
        // Update position
        particle.position.x += particle.velocity.x * effectiveDeltaTime / 1000;
        particle.position.y += particle.velocity.y * effectiveDeltaTime / 1000;
        particle.position.z += particle.velocity.z * effectiveDeltaTime / 1000;
        
        // Calculate derived properties
        particle.speed = Math.sqrt(
            particle.velocity.x * particle.velocity.x +
            particle.velocity.y * particle.velocity.y +
            particle.velocity.z * particle.velocity.z
        );
        
        particle.distanceFromBlackHole = distance;
        particle.orbitalVelocity = this.calculateOrbitalVelocity(distance, this.config.blackHoleMass);
        particle.escapeVelocity = this.calculateEscapeVelocity(distance, this.config.blackHoleMass);
        
        // Check special regions
        particle.inEventHorizon = this.isWithinEventHorizon(particle.position);
        particle.inISCO = this.isWithinISCO(particle.position);
        
        // Calculate gravitational redshift for visual effects
        particle.redshift = this.calculateRedshift(distance);
        
        return particle;
    }
    
    /**
     * Calculate field strength at a point
     */
    calculateFieldStrength(position) {
        const distance = Math.sqrt(
            position.x * position.x + 
            position.y * position.y + 
            position.z * position.z
        );
        
        if (distance <= this.config.schwarzschildRadius) {
            return Infinity; // Infinite tidal forces at event horizon
        }
        
        // Gravitational field strength
        return (this.config.gravitationalConstant * this.config.blackHoleMass) / (distance * distance);
    }
    
    /**
     * Update physics metrics
     */
    updateMetrics(particles) {
        this.metrics.particlesInEventHorizon = 0;
        this.metrics.particlesInISCO = 0;
        this.metrics.totalGravitationalEnergy = 0;
        
        let totalVelocity = 0;
        let maxAcceleration = 0;
        
        for (const particle of particles) {
            if (particle.inEventHorizon) {
                this.metrics.particlesInEventHorizon++;
            }
            
            if (particle.inISCO) {
                this.metrics.particlesInISCO++;
            }
            
            // Calculate gravitational potential energy
            const potentialEnergy = -(this.config.gravitationalConstant * this.config.blackHoleMass * particle.mass) 
                                   / particle.distanceFromBlackHole;
            this.metrics.totalGravitationalEnergy += potentialEnergy;
            
            totalVelocity += particle.speed;
            
            const accelerationMagnitude = Math.sqrt(
                particle.acceleration.x * particle.acceleration.x +
                particle.acceleration.y * particle.acceleration.y +
                particle.acceleration.z * particle.acceleration.z
            );
            
            maxAcceleration = Math.max(maxAcceleration, accelerationMagnitude);
        }
        
        this.metrics.averageParticleVelocity = particles.length > 0 ? totalVelocity / particles.length : 0;
        this.metrics.maxAcceleration = maxAcceleration;
    }
    
    /**
     * Get current physics metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            schwarzschildRadius: this.config.schwarzschildRadius,
            innerStableCircularOrbit: this.config.innerStableCircularOrbit,
            photonSphere: this.config.photonSphere,
            hawkingRadiation: this.calculateHawkingRadiation()
        };
    }
    
    /**
     * Create stable circular orbit
     */
    createStableOrbit(radius, mass = 1) {
        const orbitalVelocity = this.calculateOrbitalVelocity(radius, this.config.blackHoleMass);
        
        return {
            position: { x: radius, y: 0, z: 0 },
            velocity: { x: 0, y: orbitalVelocity, z: 0 },
            mass: mass
        };
    }
    
    /**
     * Clear physics caches
     */
    clearCaches() {
        this.forceCache.clear();
        this.fieldStrengthCache.clear();
    }
    
    /**
     * Get physics configuration
     */
    getConfiguration() {
        return { ...this.config };
    }
    
    /**
     * Update configuration
     */
    updateConfiguration(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.clearCaches();
        
        console.log('⚡ Physics configuration updated');
    }
}

module.exports = BlackHolePhysics;

// Example usage
if (require.main === module) {
    console.log('🌌 Black Hole Physics Engine Test');
    
    const physics = new BlackHolePhysics({
        relativistic: true,
        blackHoleMass: 1000
    });
    
    // Create test particle
    const testParticle = {
        position: { x: 200, y: 0, z: 0 },
        velocity: { x: 0, y: 30, z: 0 },
        acceleration: { x: 0, y: 0, z: 0 },
        mass: 1,
        size: 1
    };
    
    console.log('Initial particle state:', testParticle);
    
    // Simulate for 10 time steps
    for (let i = 0; i < 10; i++) {
        physics.updateParticlePhysics(testParticle, 16.67); // 60fps
        
        console.log(`Step ${i + 1}:`, {
            position: testParticle.position,
            velocity: testParticle.velocity,
            distance: testParticle.distanceFromBlackHole.toFixed(2),
            speed: testParticle.speed.toFixed(2),
            inEventHorizon: testParticle.inEventHorizon,
            timeDilation: testParticle.timeDilation?.toFixed(4)
        });
    }
    
    // Display final metrics
    console.log('\nPhysics Metrics:', physics.getMetrics());
}