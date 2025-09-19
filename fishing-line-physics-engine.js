#!/usr/bin/env node

/**
 * Fishing Line Physics Engine
 * 
 * Provides realistic physics simulation for the centipede's fishing line,
 * including casting mechanics, line dynamics, and data retrieval interactions.
 * Integrates with authentication depth mapping and steganography systems.
 * 
 * Physics Features:
 * - Verlet integration for smooth line simulation
 * - Gravity, tension, drag, and momentum forces
 * - Casting trajectory with arc physics
 * - Line segment collision detection
 * - Environmental factors (wind, current, obstacles)
 * - Authentication depth interaction mechanics
 */

const EventEmitter = require('events');

class FishingLinePhysicsEngine extends EventEmitter {
    constructor(canvasWidth = 800, canvasHeight = 600) {
        super();
        
        this.engineId = `FLPE-${Date.now()}`;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Physics constants
        this.physics = {
            gravity: 0.3,
            drag: 0.99,
            tension: 0.8,
            elasticity: 0.1,
            segmentLength: 8, // pixels
            maxLineLength: 400, // pixels
            castingForce: 15,
            reelSpeed: 2,
            dampening: 0.95
        };
        
        // Line segments and nodes
        this.line = {
            segments: [],
            casting: false,
            reeling: false,
            deployed: false,
            castDirection: { x: 0, y: 0 },
            castPower: 0,
            castStartTime: 0,
            totalLength: 0,
            maxDepth: 0,
            currentDepth: 0,
            hook: null
        };
        
        // Authentication depth zones
        this.authDepthZones = {
            surface: { 
                yStart: 0, 
                yEnd: 150, 
                color: '#87CEEB', 
                difficulty: 0.2,
                dataType: 'basic_auth',
                resistance: 0.1
            },
            shallow: { 
                yStart: 150, 
                yEnd: 300, 
                color: '#4682B4', 
                difficulty: 0.5,
                dataType: 'token_auth',
                resistance: 0.3
            },
            deep: { 
                yStart: 300, 
                yEnd: 450, 
                color: '#2F4F4F', 
                difficulty: 0.8,
                dataType: 'biometric_auth',
                resistance: 0.6
            },
            abyss: { 
                yStart: 450, 
                yEnd: 600, 
                color: '#000080', 
                difficulty: 1.0,
                dataType: 'quantum_auth',
                resistance: 0.9
            }
        };
        
        // Environmental factors
        this.environment = {
            wind: { x: 0, y: 0, strength: 0.1 },
            current: { x: 0, y: 0.05, strength: 0.2 },
            turbulence: 0.1,
            visibility: 1.0,
            temperature: 20, // Celsius
            pressure: 1.0
        };
        
        // Data nodes floating in the authentication depths
        this.dataNodes = [];
        this.maxDataNodes = 20;
        
        // Hook and bait system
        this.hook = {
            x: 0,
            y: 0,
            prevX: 0,
            prevY: 0,
            weight: 2,
            size: 4,
            caughtData: null,
            magnetism: 10, // attraction radius
            efficiency: 0.8 // catch success rate
        };
        
        // Obstacles and environmental hazards
        this.obstacles = [];
        this.generateObstacles();
        
        // Performance tracking
        this.performance = {
            frameRate: 60,
            lastFrameTime: 0,
            physicsSteps: 0,
            collisionChecks: 0,
            segmentUpdates: 0,
            dataRetrievals: 0
        };
        
        // Animation state
        this.animationState = {
            running: false,
            lastUpdate: 0,
            deltaTime: 0,
            frameId: null
        };
        
        console.log('🎣 Fishing Line Physics Engine Initializing...\n');
        this.initialize();
    }
    
    initialize() {
        console.log('⚙️  PHYSICS CONFIGURATION:');
        console.log(`   Canvas: ${this.canvasWidth}x${this.canvasHeight}`);
        console.log(`   Gravity: ${this.physics.gravity}`);
        console.log(`   Max Line Length: ${this.physics.maxLineLength}px`);
        console.log(`   Segment Length: ${this.physics.segmentLength}px`);
        
        console.log('\n🌊 AUTHENTICATION DEPTH ZONES:');
        Object.entries(this.authDepthZones).forEach(([depth, zone]) => {
            console.log(`   ${depth.toUpperCase()}: Y ${zone.yStart}-${zone.yEnd} (${zone.dataType})`);
        });
        
        // Initialize line segments
        this.initializeLine();
        
        // Generate initial data nodes
        this.generateDataNodes();
        
        // Start physics simulation
        this.startPhysicsLoop();
        
        console.log('\n✅ Fishing Line Physics Engine ready!\n');
        this.emit('physics_engine_initialized');
    }
    
    // ===========================================
    // LINE INITIALIZATION AND MANAGEMENT
    // ===========================================
    
    initializeLine() {
        this.line.segments = [];
        
        // Create initial line segments (retracted state)
        const segmentCount = Math.floor(this.physics.maxLineLength / this.physics.segmentLength);
        const startX = this.canvasWidth / 2;
        const startY = 50; // Starting height
        
        for (let i = 0; i < segmentCount; i++) {
            this.line.segments.push({
                x: startX,
                y: startY + (i * 2), // Compressed initially
                prevX: startX,
                prevY: startY + (i * 2),
                vx: 0,
                vy: 0,
                fixed: i === 0, // First segment is fixed to centipede
                active: i < 5, // Only first few segments active initially
                constraint: i > 0 ? this.line.segments[i - 1] : null,
                index: i,
                mass: 1.0,
                friction: 0.98
            });
        }
        
        // Attach hook to the last segment
        const lastSegment = this.line.segments[this.line.segments.length - 1];
        this.hook.x = lastSegment.x;
        this.hook.y = lastSegment.y;
        this.hook.prevX = lastSegment.x;
        this.hook.prevY = lastSegment.y;
        
        this.line.totalLength = 0;
        this.line.currentDepth = 0;
    }
    
    // ===========================================
    // CASTING MECHANICS
    // ===========================================
    
    startCast(targetX, targetY, power = 0.8) {
        if (this.line.casting || this.line.deployed) {
            console.log('⚠️  Cannot cast: line already in use');
            return false;
        }
        
        console.log(`🎣 Starting cast to (${targetX}, ${targetY}) with power ${power}`);
        
        // Calculate cast direction
        const startX = this.line.segments[0].x;
        const startY = this.line.segments[0].y;
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.line.castDirection = {
            x: dx / distance,
            y: dy / distance
        };
        
        this.line.castPower = Math.min(1.0, Math.max(0.1, power));
        this.line.casting = true;
        this.line.castStartTime = Date.now();
        
        // Apply initial casting force to segments
        this.applyCastingForce();
        
        this.emit('cast_started', {
            target: { x: targetX, y: targetY },
            power: this.line.castPower,
            direction: this.line.castDirection
        });
        
        return true;
    }
    
    applyCastingForce() {
        const force = this.physics.castingForce * this.line.castPower;
        
        // Apply force to line segments progressively
        this.line.segments.forEach((segment, index) => {
            if (!segment.fixed && segment.active) {
                const forceMult = 1 - (index * 0.1); // Diminishing force
                segment.vx += this.line.castDirection.x * force * forceMult;
                segment.vy += this.line.castDirection.y * force * forceMult;
            }
        });
        
        // Gradually activate more segments as line extends
        const activeSegments = Math.min(
            this.line.segments.length,
            Math.floor(this.line.castPower * 20) + 5
        );
        
        for (let i = 0; i < activeSegments; i++) {
            this.line.segments[i].active = true;
        }
    }
    
    // ===========================================
    // PHYSICS SIMULATION
    // ===========================================
    
    startPhysicsLoop() {
        this.animationState.running = true;
        this.animationState.lastUpdate = performance.now();
        
        const physicsLoop = (currentTime) => {
            if (!this.animationState.running) return;
            
            this.animationState.deltaTime = currentTime - this.animationState.lastUpdate;
            this.animationState.lastUpdate = currentTime;
            
            // Update physics
            this.updatePhysics(this.animationState.deltaTime);
            
            // Continue loop
            this.animationState.frameId = requestAnimationFrame(physicsLoop);
        };
        
        this.animationState.frameId = requestAnimationFrame(physicsLoop);
    }
    
    updatePhysics(deltaTime) {
        // Cap delta time to prevent physics explosions
        const dt = Math.min(deltaTime / 16.67, 2.0); // Max 2x normal frame time
        
        // Update environment
        this.updateEnvironment();
        
        // Update line segments using Verlet integration
        this.updateLineSegments(dt);
        
        // Apply constraints to maintain line integrity
        this.applyConstraints();
        
        // Update hook position
        this.updateHook(dt);
        
        // Check for data interactions
        this.checkDataInteractions();
        
        // Update animation state
        this.updateAnimationState();
        
        // Update performance metrics
        this.performance.physicsSteps++;
        
        // Emit physics update
        this.emit('physics_updated', {
            deltaTime: dt,
            lineDepth: this.line.currentDepth,
            hookPosition: { x: this.hook.x, y: this.hook.y },
            casting: this.line.casting,
            deployed: this.line.deployed
        });
    }
    
    updateLineSegments(dt) {
        this.line.segments.forEach((segment, index) => {
            if (!segment.active || segment.fixed) return;
            
            // Store previous position
            const tempX = segment.x;
            const tempY = segment.y;
            
            // Verlet integration: x = x + (x - prev_x) + acceleration
            segment.x += (segment.x - segment.prevX) * segment.friction;
            segment.y += (segment.y - segment.prevY) * segment.friction;
            
            // Apply gravity
            segment.y += this.physics.gravity * dt;
            
            // Apply environmental forces
            this.applyEnvironmentalForces(segment, dt);
            
            // Apply drag based on depth
            const depth = this.getAuthDepthZone(segment.y);
            const resistance = depth ? depth.resistance : 0.1;
            segment.x *= 1 - (resistance * 0.01);
            segment.y *= 1 - (resistance * 0.01);
            
            // Update previous position
            segment.prevX = tempX;
            segment.prevY = tempY;
            
            // Boundary constraints
            this.applyBoundaryConstraints(segment);
            
            this.performance.segmentUpdates++;
        });
    }
    
    applyEnvironmentalForces(segment, dt) {
        // Wind force
        segment.x += this.environment.wind.x * this.environment.wind.strength * dt;
        segment.y += this.environment.wind.y * this.environment.wind.strength * dt;
        
        // Current force (stronger underwater)
        if (segment.y > this.authDepthZones.surface.yEnd) {
            segment.x += this.environment.current.x * this.environment.current.strength * dt;
            segment.y += this.environment.current.y * this.environment.current.strength * dt;
        }
        
        // Turbulence (random forces)
        const turbulence = this.environment.turbulence * dt;
        segment.x += (Math.random() - 0.5) * turbulence;
        segment.y += (Math.random() - 0.5) * turbulence;
    }
    
    applyConstraints() {
        // Apply distance constraints between connected segments
        for (let i = 0; i < 3; i++) { // Multiple passes for stability
            this.line.segments.forEach((segment, index) => {
                if (!segment.active || index === 0) return;
                
                const prevSegment = this.line.segments[index - 1];
                if (!prevSegment.active) return;
                
                const dx = segment.x - prevSegment.x;
                const dy = segment.y - prevSegment.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const difference = this.physics.segmentLength - distance;
                    const percent = difference / distance / 2;
                    const offsetX = dx * percent;
                    const offsetY = dy * percent;
                    
                    // Adjust positions to maintain constraint
                    if (!prevSegment.fixed) {
                        prevSegment.x -= offsetX * this.physics.tension;
                        prevSegment.y -= offsetY * this.physics.tension;
                    }
                    
                    segment.x += offsetX * this.physics.tension;
                    segment.y += offsetY * this.physics.tension;
                }
            });
        }
    }
    
    applyBoundaryConstraints(segment) {
        // Keep segments within canvas bounds
        if (segment.x < 0) {
            segment.x = 0;
            segment.prevX = segment.x + (segment.x - segment.prevX) * this.physics.elasticity;
        } else if (segment.x > this.canvasWidth) {
            segment.x = this.canvasWidth;
            segment.prevX = segment.x + (segment.x - segment.prevX) * this.physics.elasticity;
        }
        
        if (segment.y < 0) {
            segment.y = 0;
            segment.prevY = segment.y + (segment.y - segment.prevY) * this.physics.elasticity;
        } else if (segment.y > this.canvasHeight) {
            segment.y = this.canvasHeight;
            segment.prevY = segment.y + (segment.y - segment.prevY) * this.physics.elasticity;
        }
    }
    
    updateHook(dt) {
        // Hook follows the last active segment
        const lastActiveSegment = this.getLastActiveSegment();
        
        if (lastActiveSegment) {
            // Smooth hook movement with physics
            const hookWeight = this.hook.weight * 0.1;
            
            const tempX = this.hook.x;
            const tempY = this.hook.y;
            
            // Apply hook physics
            this.hook.x += (this.hook.x - this.hook.prevX) * 0.95;
            this.hook.y += (this.hook.y - this.hook.prevY) * 0.95;
            
            // Extra gravity for hook
            this.hook.y += hookWeight * dt;
            
            // Constrain to last segment
            const dx = this.hook.x - lastActiveSegment.x;
            const dy = this.hook.y - lastActiveSegment.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.physics.segmentLength) {
                const constraintFactor = this.physics.segmentLength / distance;
                this.hook.x = lastActiveSegment.x + dx * constraintFactor;
                this.hook.y = lastActiveSegment.y + dy * constraintFactor;
            }
            
            this.hook.prevX = tempX;
            this.hook.prevY = tempY;
        }
        
        // Update line depth and deployment status
        this.updateLineStatus();
    }
    
    getLastActiveSegment() {
        for (let i = this.line.segments.length - 1; i >= 0; i--) {
            if (this.line.segments[i].active) {
                return this.line.segments[i];
            }
        }
        return this.line.segments[0];
    }
    
    updateLineStatus() {
        // Calculate total deployed line length
        let totalLength = 0;
        for (let i = 1; i < this.line.segments.length; i++) {
            if (!this.line.segments[i].active) break;
            
            const seg1 = this.line.segments[i - 1];
            const seg2 = this.line.segments[i];
            const dx = seg2.x - seg1.x;
            const dy = seg2.y - seg1.y;
            totalLength += Math.sqrt(dx * dx + dy * dy);
        }
        
        this.line.totalLength = totalLength;
        this.line.currentDepth = Math.max(0, this.hook.y - this.authDepthZones.surface.yStart);
        this.line.maxDepth = Math.max(this.line.maxDepth, this.line.currentDepth);
        
        // Update deployment status
        if (this.line.casting && this.hook.y > this.authDepthZones.surface.yStart + 20) {
            this.line.casting = false;
            this.line.deployed = true;
            
            this.emit('line_deployed', {
                depth: this.line.currentDepth,
                totalLength: this.line.totalLength,
                zone: this.getCurrentDepthZone()
            });
        }
    }
    
    // ===========================================
    // DATA INTERACTION SYSTEM
    // ===========================================
    
    generateDataNodes() {
        this.dataNodes = [];
        
        for (let i = 0; i < this.maxDataNodes; i++) {
            const zone = this.getRandomDepthZone();
            
            this.dataNodes.push({
                id: `data_${i}`,
                x: Math.random() * this.canvasWidth,
                y: zone.yStart + Math.random() * (zone.yEnd - zone.yStart),
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.2,
                size: 3 + Math.random() * 4,
                type: zone.dataType,
                depth: this.getDepthNameFromZone(zone),
                value: Math.floor(Math.random() * 100) + 1,
                lifetime: 10000 + Math.random() * 20000, // 10-30 seconds
                birthTime: Date.now(),
                caught: false,
                difficulty: zone.difficulty,
                color: this.getDataNodeColor(zone.dataType)
            });
        }
    }
    
    getRandomDepthZone() {
        const zones = Object.values(this.authDepthZones);
        return zones[Math.floor(Math.random() * zones.length)];
    }
    
    getDepthNameFromZone(zone) {
        return Object.keys(this.authDepthZones).find(key => 
            this.authDepthZones[key] === zone
        ) || 'unknown';
    }
    
    getDataNodeColor(dataType) {
        const colors = {
            basic_auth: '#90EE90',
            token_auth: '#87CEEB',
            biometric_auth: '#DDA0DD',
            quantum_auth: '#FFD700'
        };
        return colors[dataType] || '#FFFFFF';
    }
    
    checkDataInteractions() {
        this.dataNodes.forEach((node, index) => {
            if (node.caught) return;
            
            // Update node physics
            this.updateDataNode(node);
            
            // Check interaction with hook
            const dx = node.x - this.hook.x;
            const dy = node.y - this.hook.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.hook.magnetism && distance < (node.size + this.hook.size)) {
                this.attemptDataCapture(node, index);
            }
            
            // Remove expired nodes
            if (Date.now() - node.birthTime > node.lifetime) {
                this.respawnDataNode(index);
            }
            
            this.performance.collisionChecks++;
        });
    }
    
    updateDataNode(node) {
        // Simple physics for data nodes
        node.x += node.vx;
        node.y += node.vy;
        
        // Boundary bouncing
        if (node.x <= 0 || node.x >= this.canvasWidth) {
            node.vx *= -0.8;
            node.x = Math.max(0, Math.min(this.canvasWidth, node.x));
        }
        
        // Keep nodes in their depth zone
        const zone = this.getAuthDepthZone(node.y);
        if (zone) {
            if (node.y < zone.yStart || node.y > zone.yEnd) {
                node.vy *= -0.8;
                node.y = Math.max(zone.yStart, Math.min(zone.yEnd, node.y));
            }
        }
        
        // Add some drift
        node.vx += (Math.random() - 0.5) * 0.01;
        node.vy += (Math.random() - 0.5) * 0.01;
        
        // Apply drag
        node.vx *= 0.98;
        node.vy *= 0.98;
    }
    
    attemptDataCapture(node, nodeIndex) {
        // Calculate capture probability based on various factors
        const hookEfficiency = this.hook.efficiency;
        const nodeEvasion = node.difficulty;
        const depthPenalty = this.line.currentDepth / this.physics.maxLineLength;
        
        const captureChance = hookEfficiency * (1 - nodeEvasion) * (1 - depthPenalty * 0.3);
        
        if (Math.random() < captureChance) {
            this.captureDataNode(node, nodeIndex);
        } else {
            this.dataNodeEscape(node);
        }
    }
    
    captureDataNode(node, nodeIndex) {
        console.log(`🎣 Data captured: ${node.type} (Value: ${node.value})`);
        
        node.caught = true;
        this.hook.caughtData = node;
        
        // Apply weight to hook
        this.hook.weight += node.size * 0.1;
        
        this.performance.dataRetrievals++;
        
        this.emit('data_captured', {
            node: node,
            depth: this.line.currentDepth,
            zone: this.getCurrentDepthZone(),
            hookPosition: { x: this.hook.x, y: this.hook.y },
            captureTime: Date.now()
        });
        
        // Respawn node after capture
        setTimeout(() => {
            this.respawnDataNode(nodeIndex);
        }, 2000);
    }
    
    dataNodeEscape(node) {
        // Apply evasion force
        const dx = node.x - this.hook.x;
        const dy = node.y - this.hook.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const escapeForce = 2.0;
            node.vx += (dx / distance) * escapeForce;
            node.vy += (dy / distance) * escapeForce;
        }
        
        this.emit('data_escaped', {
            node: node,
            hookPosition: { x: this.hook.x, y: this.hook.y }
        });
    }
    
    respawnDataNode(index) {
        const zone = this.getRandomDepthZone();
        
        this.dataNodes[index] = {
            id: `data_${index}_${Date.now()}`,
            x: Math.random() * this.canvasWidth,
            y: zone.yStart + Math.random() * (zone.yEnd - zone.yStart),
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.2,
            size: 3 + Math.random() * 4,
            type: zone.dataType,
            depth: this.getDepthNameFromZone(zone),
            value: Math.floor(Math.random() * 100) + 1,
            lifetime: 10000 + Math.random() * 20000,
            birthTime: Date.now(),
            caught: false,
            difficulty: zone.difficulty,
            color: this.getDataNodeColor(zone.dataType)
        };
    }
    
    // ===========================================
    // REELING AND LINE MANAGEMENT
    // ===========================================
    
    startReeling(speed = 1.0) {
        if (!this.line.deployed) {
            console.log('⚠️  Cannot reel: line not deployed');
            return false;
        }
        
        console.log('🎣 Starting to reel in line...');
        
        this.line.reeling = true;
        this.reel(speed);
        
        this.emit('reeling_started', {
            currentDepth: this.line.currentDepth,
            totalLength: this.line.totalLength,
            caughtData: this.hook.caughtData
        });
        
        return true;
    }
    
    reel(speed) {
        if (!this.line.reeling) return;
        
        const reelSpeed = this.physics.reelSpeed * speed;
        
        // Gradually deactivate segments from the end
        let segmentsToDeactivate = Math.floor(reelSpeed);
        
        for (let i = this.line.segments.length - 1; i >= 0 && segmentsToDeactivate > 0; i--) {
            if (this.line.segments[i].active && i > 5) { // Keep minimum 5 segments
                this.line.segments[i].active = false;
                segmentsToDeactivate--;
            }
        }
        
        // Apply upward force to remaining segments
        this.line.segments.forEach((segment, index) => {
            if (segment.active && !segment.fixed) {
                segment.vy -= reelSpeed * 0.5;
            }
        });
        
        // Check if fully reeled in
        if (this.hook.y < this.authDepthZones.surface.yStart + 30) {
            this.completeReeling();
        }
        
        this.emit('reeling_progress', {
            currentDepth: this.line.currentDepth,
            progress: 1 - (this.line.currentDepth / this.line.maxDepth)
        });
    }
    
    completeReeling() {
        console.log('✅ Line fully reeled in');
        
        this.line.reeling = false;
        this.line.deployed = false;
        this.line.casting = false;
        
        // Reset line to starting position
        this.initializeLine();
        
        // Process caught data
        if (this.hook.caughtData) {
            this.processCaughtData(this.hook.caughtData);
            this.hook.caughtData = null;
        }
        
        // Reset hook weight
        this.hook.weight = 2;
        
        this.emit('line_reeled_in', {
            maxDepthReached: this.line.maxDepth,
            dataRetrieved: this.performance.dataRetrievals
        });
    }
    
    processCaughtData(data) {
        console.log(`📊 Processing caught data: ${data.type} from ${data.depth} depth`);
        
        this.emit('data_processed', {
            data: data,
            authDepth: data.depth,
            value: data.value,
            processingTime: Date.now()
        });
    }
    
    // ===========================================
    // ENVIRONMENT AND OBSTACLES
    // ===========================================
    
    updateEnvironment() {
        // Dynamic wind
        this.environment.wind.x += (Math.random() - 0.5) * 0.02;
        this.environment.wind.y += (Math.random() - 0.5) * 0.01;
        this.environment.wind.x *= 0.95; // Dampening
        this.environment.wind.y *= 0.95;
        
        // Dynamic current
        this.environment.current.x += (Math.random() - 0.5) * 0.01;
        this.environment.current.x *= 0.98;
        
        // Limit environmental forces
        this.environment.wind.x = Math.max(-0.3, Math.min(0.3, this.environment.wind.x));
        this.environment.wind.y = Math.max(-0.2, Math.min(0.2, this.environment.wind.y));
        this.environment.current.x = Math.max(-0.1, Math.min(0.1, this.environment.current.x));
    }
    
    generateObstacles() {
        this.obstacles = [];
        
        // Generate some underwater obstacles
        for (let i = 0; i < 5; i++) {
            this.obstacles.push({
                x: Math.random() * this.canvasWidth,
                y: this.authDepthZones.shallow.yStart + Math.random() * 300,
                width: 20 + Math.random() * 40,
                height: 15 + Math.random() * 30,
                type: 'rock',
                hardness: 0.8
            });
        }
        
        // Generate some surface obstacles
        for (let i = 0; i < 3; i++) {
            this.obstacles.push({
                x: Math.random() * this.canvasWidth,
                y: this.authDepthZones.surface.yStart + Math.random() * 50,
                width: 30 + Math.random() * 50,
                height: 10 + Math.random() * 20,
                type: 'debris',
                hardness: 0.3
            });
        }
    }
    
    // ===========================================
    // UTILITY FUNCTIONS
    // ===========================================
    
    getAuthDepthZone(y) {
        return Object.values(this.authDepthZones).find(zone => 
            y >= zone.yStart && y <= zone.yEnd
        ) || null;
    }
    
    getCurrentDepthZone() {
        return this.getAuthDepthZone(this.hook.y);
    }
    
    updateAnimationState() {
        // Update casting state
        if (this.line.casting) {
            const castDuration = Date.now() - this.line.castStartTime;
            if (castDuration > 3000) { // 3 second max cast time
                this.line.casting = false;
            }
        }
        
        // Continue reeling if active
        if (this.line.reeling) {
            this.reel(1.0);
        }
    }
    
    getPhysicsState() {
        return {
            engineId: this.engineId,
            line: {
                casting: this.line.casting,
                deployed: this.line.deployed,
                reeling: this.line.reeling,
                totalLength: this.line.totalLength,
                currentDepth: this.line.currentDepth,
                maxDepth: this.line.maxDepth,
                activeSegments: this.line.segments.filter(s => s.active).length
            },
            hook: {
                position: { x: this.hook.x, y: this.hook.y },
                weight: this.hook.weight,
                caughtData: this.hook.caughtData ? {
                    type: this.hook.caughtData.type,
                    value: this.hook.caughtData.value,
                    depth: this.hook.caughtData.depth
                } : null
            },
            environment: this.environment,
            performance: this.performance,
            dataNodes: this.dataNodes.length,
            currentZone: this.getCurrentDepthZone()
        };
    }
    
    getDetailedState() {
        return {
            ...this.getPhysicsState(),
            segments: this.line.segments,
            dataNodes: this.dataNodes,
            obstacles: this.obstacles,
            authDepthZones: this.authDepthZones
        };
    }
    
    // ===========================================
    // CONTROL INTERFACE
    // ===========================================
    
    stopPhysics() {
        this.animationState.running = false;
        
        if (this.animationState.frameId) {
            cancelAnimationFrame(this.animationState.frameId);
        }
        
        console.log('⏹️  Physics engine stopped');
        this.emit('physics_stopped');
    }
    
    resetLine() {
        this.line.casting = false;
        this.line.deployed = false;
        this.line.reeling = false;
        
        this.initializeLine();
        
        console.log('🔄 Line reset to starting position');
        this.emit('line_reset');
    }
    
    setEnvironment(environmentConfig) {
        Object.assign(this.environment, environmentConfig);
        
        console.log('🌊 Environment updated:', environmentConfig);
        this.emit('environment_changed', this.environment);
    }
    
    adjustPhysics(physicsConfig) {
        Object.assign(this.physics, physicsConfig);
        
        console.log('⚙️  Physics parameters updated:', physicsConfig);
        this.emit('physics_adjusted', this.physics);
    }
}

// Export for use in other modules
module.exports = FishingLinePhysicsEngine;

// Demo if run directly
if (require.main === module) {
    console.log('🎣 Fishing Line Physics Engine Demo\n');
    
    const physics = new FishingLinePhysicsEngine(800, 600);
    
    physics.on('physics_engine_initialized', () => {
        console.log('🚀 RUNNING PHYSICS SIMULATION...\n');
        
        // Demo cast
        setTimeout(() => {
            console.log('1️⃣ Casting line to deep waters...');
            physics.startCast(400, 400, 0.8);
        }, 1000);
        
        // Let it settle
        setTimeout(() => {
            console.log('2️⃣ Line deployed, checking for data...');
            const state = physics.getPhysicsState();
            console.log(`   Current depth: ${state.line.currentDepth.toFixed(1)}px`);
            console.log(`   Auth zone: ${state.currentZone?.dataType || 'unknown'}`);
        }, 5000);
        
        // Start reeling
        setTimeout(() => {
            console.log('3️⃣ Starting to reel in line...');
            physics.startReeling(1.2);
        }, 8000);
        
        // Environmental changes
        setTimeout(() => {
            console.log('4️⃣ Changing environmental conditions...');
            physics.setEnvironment({
                wind: { x: 0.2, y: -0.1, strength: 0.3 },
                current: { x: -0.1, y: 0.08, strength: 0.4 },
                turbulence: 0.2
            });
        }, 10000);
        
        // Final status
        setTimeout(() => {
            console.log('📊 FINAL SIMULATION STATUS:');
            const state = physics.getPhysicsState();
            console.log(`   Max Depth Reached: ${state.line.maxDepth.toFixed(1)}px`);
            console.log(`   Data Retrievals: ${state.performance.dataRetrievals}`);
            console.log(`   Physics Steps: ${state.performance.physicsSteps}`);
            console.log(`   Current Zone: ${state.currentZone?.dataType || 'surface'}`);
            
            physics.stopPhysics();
        }, 15000);
    });
    
    physics.on('line_deployed', (data) => {
        console.log(`🌊 Line deployed at depth ${data.depth.toFixed(1)}px in ${data.zone?.dataType || 'unknown'} zone`);
    });
    
    physics.on('data_captured', (data) => {
        console.log(`🎣 Data captured: ${data.node.type} (Value: ${data.node.value}) at depth ${data.depth.toFixed(1)}px`);
    });
    
    physics.on('data_escaped', (data) => {
        console.log(`💨 Data escaped: ${data.node.type}`);
    });
    
    physics.on('line_reeled_in', (data) => {
        console.log(`✅ Line reeled in. Max depth: ${data.maxDepthReached.toFixed(1)}px, Data retrieved: ${data.dataRetrieved}`);
    });
}