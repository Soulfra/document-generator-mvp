#!/usr/bin/env node

/**
 * 📜 Living ASCII Scroll Engine
 * 
 * Real-time animated ASCII scrolls that breathe, pulse, and react
 * to signatures. Based on RuneScape's 600ms game tick system with
 * pressure sensitivity, temporal themes, and living certificates.
 * 
 * "The scroll remembers every stroke, every breath, every moment..."
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class LivingASCIIScrollEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Core timing configuration
        this.TICK_RATE = options.tickRate || 600; // RuneScape standard: 600ms
        this.tickCount = 0;
        this.startTime = Date.now();
        
        // Engine configuration
        this.config = {
            // Scroll physics
            unfurlSpeed: options.unfurlSpeed || 0.15, // Percent per tick
            inkFlowRate: options.inkFlowRate || 0.08,
            parchmentAging: options.parchmentAging || 0.001, // Age per tick
            
            // Pressure sensitivity
            minPressure: options.minPressure || 0.1,
            maxPressure: options.maxPressure || 1.0,
            pressureSmoothing: options.pressureSmoothing || 0.3,
            
            // Theme settings
            defaultEpoch: options.defaultEpoch || 'medieval',
            themeTransitionTicks: options.themeTransitionTicks || 10,
            enableParticles: options.enableParticles !== false,
            
            // Animation settings
            breathingIntensity: options.breathingIntensity || 0.02,
            pulseFrequency: options.pulseFrequency || 5, // Ticks per pulse
            glowIntensity: options.glowIntensity || 0.8,
            
            ...options
        };
        
        // Living scroll registry
        this.scrollRegistry = {
            activeScrolls: new Map(),      // scrollId → scroll instance
            signatures: new Map(),         // signatureId → signature data
            animations: new Map(),         // animationId → animation state
            particles: new Map(),          // particleId → particle system
            themes: new Map(),             // themeId → theme configuration
            pressureHistory: new Map()     // scrollId → pressure readings
        };
        
        // Temporal theme definitions
        this.epochs = {
            medieval: {
                name: 'Medieval Illumination',
                symbol: '⚜️',
                borderStyle: 'gothic',
                inkColor: 'sepia',
                effects: ['illumination', 'goldLeaf', 'monkScript'],
                sounds: ['parchment', 'quill', 'churchBells'],
                particles: ['dust', 'candleLight', 'inkDrops']
            },
            cyberpunk: {
                name: 'Neon Future',
                symbol: '💾',
                borderStyle: 'digital',
                inkColor: 'neon',
                effects: ['glitch', 'hologram', 'dataStream'],
                sounds: ['synth', 'static', 'beep'],
                particles: ['pixels', 'sparks', 'dataFragments']
            },
            ancient: {
                name: 'Stone Tablet',
                symbol: '🗿',
                borderStyle: 'hieroglyphic',
                inkColor: 'stone',
                effects: ['erosion', 'sandDrift', 'runeGlow'],
                sounds: ['chisel', 'wind', 'ancientChant'],
                particles: ['sand', 'stoneDust', 'mysticalGlow']
            },
            future: {
                name: 'Quantum Signature',
                symbol: '🌌',
                borderStyle: 'holographic',
                inkColor: 'quantum',
                effects: ['quantumFlux', 'timeDilation', 'probability'],
                sounds: ['whir', 'quantumHum', 'spaceAmbient'],
                particles: ['stardust', 'quantum', 'timeStreams']
            },
            steampunk: {
                name: 'Brass & Gears',
                symbol: '⚙️',
                borderStyle: 'mechanical',
                inkColor: 'brass',
                effects: ['steamPuff', 'gearRotation', 'clockwork'],
                sounds: ['steam', 'gears', 'clockTick'],
                particles: ['steam', 'oil', 'brassShavings']
            }
        };
        
        // Signature physics engine
        this.physics = {
            gravity: 0.05,
            friction: 0.92,
            inkViscosity: 0.85,
            paperRoughness: 0.3,
            quillElasticity: 0.7
        };
        
        // Initialize engine
        this.initialize();
    }
    
    /**
     * Initialize the living scroll engine
     */
    async initialize() {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   📜 LIVING ASCII SCROLL ENGINE 📜             ║
║                                                               ║
║                    "Time flows at 600ms..."                   ║
║                                                               ║
║  ⏱️  Tick Rate: ${this.TICK_RATE}ms                                    ║
║  🎨 Current Epoch: ${this.config.defaultEpoch.toUpperCase().padEnd(20)}         ║
║  ✨ Particles: ${this.config.enableParticles ? 'ENABLED' : 'DISABLED'}                            ║
║                                                               ║
║              "The scrolls await your signature..."            ║
╚═══════════════════════════════════════════════════════════════╝
        `);
        
        try {
            // Initialize theme configurations
            await this.initializeThemes();
            
            // Start the game tick system
            this.startGameTicks();
            
            // Initialize particle systems
            if (this.config.enableParticles) {
                await this.initializeParticles();
            }
            
            // Load any saved scrolls
            await this.loadSavedScrolls();
            
            console.log('✨ Living ASCII Scroll Engine initialized!');
            this.emit('engine-initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize scroll engine:', error);
            throw error;
        }
    }
    
    /**
     * Initialize temporal themes
     */
    async initializeThemes() {
        for (const [epochId, epoch] of Object.entries(this.epochs)) {
            this.scrollRegistry.themes.set(epochId, {
                ...epoch,
                id: epochId,
                initialized: true,
                loadedAssets: new Set(),
                activeEffects: new Map()
            });
        }
    }
    
    /**
     * Start the game tick system
     */
    startGameTicks() {
        this.tickInterval = setInterval(() => {
            this.gameTick();
        }, this.TICK_RATE);
        
        console.log(`⏰ Game ticks started at ${this.TICK_RATE}ms intervals`);
    }
    
    /**
     * Main game tick - the heartbeat of the scroll engine
     */
    gameTick() {
        this.tickCount++;
        const currentTime = Date.now();
        const elapsed = currentTime - this.startTime;
        
        // Update all living scrolls
        for (const [scrollId, scroll] of this.scrollRegistry.activeScrolls) {
            this.updateScroll(scroll, this.tickCount);
        }
        
        // Process animations
        for (const [animId, animation] of this.scrollRegistry.animations) {
            this.processAnimation(animation, this.tickCount);
        }
        
        // Update particle systems
        if (this.config.enableParticles) {
            for (const [particleId, particles] of this.scrollRegistry.particles) {
                this.updateParticles(particles, this.tickCount);
            }
        }
        
        // Process pressure changes
        this.processPressureChanges();
        
        // Apply temporal effects
        this.applyTemporalEffects(this.tickCount);
        
        // Emit tick event
        this.emit('game-tick', {
            tick: this.tickCount,
            time: currentTime,
            elapsed: elapsed,
            activeScrolls: this.scrollRegistry.activeScrolls.size
        });
    }
    
    /**
     * Create a new living scroll
     */
    async createLivingScroll(options = {}) {
        const scrollId = `scroll_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        const scroll = {
            id: scrollId,
            created: new Date(),
            createdAtTick: this.tickCount,
            epoch: options.epoch || this.config.defaultEpoch,
            state: 'unfurling', // unfurling, ready, signing, aging, ancient
            unfurlProgress: 0,
            age: 0,
            
            // Visual properties
            width: options.width || 80,
            height: options.height || 60,
            borderType: this.epochs[options.epoch || this.config.defaultEpoch].borderStyle,
            
            // Content
            title: options.title || 'Untitled Scroll',
            content: options.content || '',
            signatures: [],
            
            // Physics properties
            weight: 1.0,
            elasticity: 0.3,
            roughness: 0.2,
            
            // Animation states
            breathing: {
                phase: 0,
                intensity: this.config.breathingIntensity
            },
            glow: {
                intensity: 0,
                color: 'gold',
                pulse: true
            },
            
            // Interactive properties
            currentPressure: 0,
            averagePressure: 0,
            signatureVelocity: { x: 0, y: 0 },
            inkLevel: 1.0,
            
            // Particle emitters
            particleEmitters: new Map()
        };
        
        // Store scroll
        this.scrollRegistry.activeScrolls.set(scrollId, scroll);
        
        // Initialize pressure history
        this.scrollRegistry.pressureHistory.set(scrollId, []);
        
        // Create unfurl animation
        this.createUnfurlAnimation(scroll);
        
        // Add epoch-specific particles
        if (this.config.enableParticles) {
            await this.addEpochParticles(scroll);
        }
        
        console.log(`📜 Created living scroll: ${scrollId}`);
        console.log(`🎨 Epoch: ${scroll.epoch}`);
        
        this.emit('scroll-created', { scrollId, scroll });
        
        return scroll;
    }
    
    /**
     * Update a living scroll each tick
     */
    updateScroll(scroll, tick) {
        // Update age
        scroll.age += this.config.parchmentAging;
        
        // Update state machine
        switch (scroll.state) {
            case 'unfurling':
                this.updateUnfurling(scroll);
                break;
            case 'ready':
                this.updateReady(scroll);
                break;
            case 'signing':
                this.updateSigning(scroll);
                break;
            case 'aging':
                this.updateAging(scroll);
                break;
            case 'ancient':
                this.updateAncient(scroll);
                break;
        }
        
        // Update breathing animation
        scroll.breathing.phase += (Math.PI * 2) / this.config.pulseFrequency;
        const breathAmount = Math.sin(scroll.breathing.phase) * scroll.breathing.intensity;
        
        // Update glow
        if (scroll.glow.pulse) {
            scroll.glow.intensity = 0.5 + (Math.sin(tick * 0.1) * 0.3);
        }
        
        // Apply physics
        this.applyScrollPhysics(scroll);
    }
    
    /**
     * Update unfurling animation
     */
    updateUnfurling(scroll) {
        scroll.unfurlProgress += this.config.unfurlSpeed;
        
        if (scroll.unfurlProgress >= 1.0) {
            scroll.unfurlProgress = 1.0;
            scroll.state = 'ready';
            
            // Emit unfurled event
            this.emit('scroll-unfurled', { 
                scrollId: scroll.id,
                epoch: scroll.epoch 
            });
            
            console.log(`✅ Scroll ${scroll.id} fully unfurled!`);
        }
    }
    
    /**
     * Add signature with pressure sensitivity
     */
    async addPressureSignature(scrollId, authorityId, options = {}) {
        const scroll = this.scrollRegistry.activeScrolls.get(scrollId);
        if (!scroll) {
            throw new Error(`Scroll not found: ${scrollId}`);
        }
        
        console.log(`✍️  Adding pressure-sensitive signature to scroll ${scrollId}`);
        
        const signature = {
            id: `sig_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            authorityId,
            startTick: this.tickCount,
            
            // Pressure data
            pressureReadings: options.pressureReadings || [],
            averagePressure: 0,
            maxPressure: 0,
            
            // Velocity data
            velocity: options.velocity || { x: 0, y: 0 },
            acceleration: options.acceleration || { x: 0, y: 0 },
            
            // Emotion detection from signing pattern
            emotion: this.detectSigningEmotion(options),
            
            // Visual properties
            inkColor: this.getInkColorForEpoch(scroll.epoch),
            strokeWidth: 1,
            glowIntensity: 0,
            
            // Animation state
            animationPhase: 'drawing', // drawing, settling, glowing, complete
            progress: 0,
            
            // Particle effects
            particleTrail: []
        };
        
        // Calculate pressure metrics
        if (signature.pressureReadings.length > 0) {
            signature.averagePressure = signature.pressureReadings.reduce((a, b) => a + b, 0) / signature.pressureReadings.length;
            signature.maxPressure = Math.max(...signature.pressureReadings);
        }
        
        // Add to scroll
        scroll.signatures.push(signature);
        scroll.state = 'signing';
        
        // Store in registry
        this.scrollRegistry.signatures.set(signature.id, signature);
        
        // Create signing animation
        await this.createSigningAnimation(scroll, signature);
        
        console.log(`📝 Signature added with average pressure: ${signature.averagePressure.toFixed(2)}`);
        console.log(`😊 Detected emotion: ${signature.emotion}`);
        
        this.emit('signature-added', {
            scrollId,
            signatureId: signature.id,
            authorityId,
            emotion: signature.emotion,
            pressure: signature.averagePressure
        });
        
        return signature;
    }
    
    /**
     * Detect emotion from signing pattern
     */
    detectSigningEmotion(options) {
        const velocity = options.velocity || { x: 0, y: 0 };
        const pressure = options.averagePressure || 0.5;
        const duration = options.duration || 3000;
        
        const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
        
        // Emotion detection heuristics
        if (speed > 5 && pressure > 0.8) {
            return 'passionate';
        } else if (speed < 1 && pressure < 0.3) {
            return 'hesitant';
        } else if (duration > 5000 && pressure > 0.6) {
            return 'deliberate';
        } else if (speed > 3 && pressure < 0.5) {
            return 'rushed';
        } else if (pressure > 0.9) {
            return 'emphatic';
        } else {
            return 'neutral';
        }
    }
    
    /**
     * Create unfurl animation
     */
    createUnfurlAnimation(scroll) {
        const animation = {
            id: `unfurl_${scroll.id}`,
            type: 'unfurl',
            scrollId: scroll.id,
            startTick: this.tickCount,
            duration: Math.ceil(1.0 / this.config.unfurlSpeed), // Ticks to complete
            easing: 'easeOutCubic',
            particles: []
        };
        
        this.scrollRegistry.animations.set(animation.id, animation);
        
        // Add unfurl particles
        if (this.config.enableParticles) {
            const epoch = this.scrollRegistry.themes.get(scroll.epoch);
            if (epoch) {
                animation.particles = this.createParticleEffect('unfurl', epoch.particles);
            }
        }
    }
    
    /**
     * Render living scroll as ASCII art
     */
    renderScroll(scrollId) {
        const scroll = this.scrollRegistry.activeScrolls.get(scrollId);
        if (!scroll) return 'Scroll not found';
        
        const epoch = this.epochs[scroll.epoch];
        const breathOffset = Math.sin(scroll.breathing.phase) * scroll.breathing.intensity * 2;
        
        // Calculate visible dimensions based on unfurl progress
        const visibleHeight = Math.floor(scroll.height * scroll.unfurlProgress);
        const visibleWidth = scroll.width + Math.floor(breathOffset);
        
        let output = [];
        
        // Top border with epoch styling
        output.push(this.renderBorder(scroll, 'top', visibleWidth));
        
        // Title section
        if (visibleHeight > 5) {
            output.push(this.renderTitleSection(scroll, epoch));
        }
        
        // Content area
        if (visibleHeight > 10) {
            const contentHeight = Math.min(visibleHeight - 10, scroll.content.split('\n').length);
            output.push(...this.renderContent(scroll, contentHeight));
        }
        
        // Signatures
        if (visibleHeight > 20 && scroll.signatures.length > 0) {
            output.push(...this.renderSignatures(scroll));
        }
        
        // Bottom border
        if (scroll.unfurlProgress >= 1.0) {
            output.push(this.renderBorder(scroll, 'bottom', visibleWidth));
        }
        
        // Add glow effect
        if (scroll.glow.intensity > 0) {
            output = this.addGlowEffect(output, scroll.glow);
        }
        
        // Add particles
        if (this.config.enableParticles) {
            output = this.overlayParticles(output, scroll);
        }
        
        return output.join('\n');
    }
    
    /**
     * Render border with epoch-specific styling
     */
    renderBorder(scroll, position, width) {
        const epoch = this.epochs[scroll.epoch];
        const age = Math.min(scroll.age, 1.0); // 0 to 1
        
        const borders = {
            medieval: {
                top: '╔' + '═'.repeat(width - 2) + '╗',
                bottom: '╚' + '═'.repeat(width - 2) + '╝',
                aged: '┌' + '─'.repeat(width - 2) + '┐'
            },
            cyberpunk: {
                top: '◢' + '▬'.repeat(width - 2) + '◣',
                bottom: '◥' + '▬'.repeat(width - 2) + '◤',
                aged: '◢' + '░'.repeat(width - 2) + '◣'
            },
            ancient: {
                top: '𓊆' + '𓊇'.repeat(width - 2) + '𓊈',
                bottom: '𓊉' + '𓊇'.repeat(width - 2) + '𓊊',
                aged: '≈' + '~'.repeat(width - 2) + '≈'
            },
            future: {
                top: '⟨' + '⬚'.repeat(width - 2) + '⟩',
                bottom: '⟨' + '⬚'.repeat(width - 2) + '⟩',
                aged: '⟨' + '⬡'.repeat(width - 2) + '⟩'
            },
            steampunk: {
                top: '⚙' + '═'.repeat(width - 2) + '⚙',
                bottom: '⚙' + '═'.repeat(width - 2) + '⚙',
                aged: '⚙' + '╌'.repeat(width - 2) + '⚙'
            }
        };
        
        const style = borders[scroll.epoch] || borders.medieval;
        
        // Apply aging
        if (age > 0.5) {
            return style.aged || style[position];
        }
        
        return style[position];
    }
    
    /**
     * Apply temporal effects based on current tick
     */
    applyTemporalEffects(tick) {
        // Cycle through time distortions every 100 ticks
        if (tick % 100 === 0) {
            for (const [scrollId, scroll] of this.scrollRegistry.activeScrolls) {
                if (scroll.epoch === 'future') {
                    // Quantum fluctuations
                    scroll.breathing.intensity = this.config.breathingIntensity * (1 + Math.random() * 0.5);
                } else if (scroll.epoch === 'steampunk') {
                    // Gear rotation
                    scroll.gearRotation = (scroll.gearRotation || 0) + Math.PI / 8;
                }
            }
        }
    }
    
    /**
     * Get ink color for epoch
     */
    getInkColorForEpoch(epochId) {
        const colors = {
            medieval: 'sepia',
            cyberpunk: 'neon-green',
            ancient: 'stone-gray',
            future: 'quantum-blue',
            steampunk: 'brass-gold'
        };
        
        return colors[epochId] || 'black';
    }
    
    /**
     * Generate scroll status report
     */
    generateStatusReport() {
        const report = {
            engine: {
                tickCount: this.tickCount,
                uptime: Date.now() - this.startTime,
                tickRate: this.TICK_RATE,
                currentEpoch: this.config.defaultEpoch
            },
            scrolls: {
                active: this.scrollRegistry.activeScrolls.size,
                signatures: this.scrollRegistry.signatures.size,
                animations: this.scrollRegistry.animations.size,
                particles: this.scrollRegistry.particles.size
            },
            epochs: {},
            performance: {
                averageTickTime: 0, // Would need to track this
                memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
            }
        };
        
        // Count scrolls by epoch
        for (const scroll of this.scrollRegistry.activeScrolls.values()) {
            report.epochs[scroll.epoch] = (report.epochs[scroll.epoch] || 0) + 1;
        }
        
        console.log('\n📊 Living Scroll Engine Status');
        console.log('════════════════════════════════');
        console.log(`⏱️  Ticks: ${report.engine.tickCount}`);
        console.log(`⏰ Uptime: ${Math.floor(report.engine.uptime / 1000)}s`);
        console.log(`📜 Active Scrolls: ${report.scrolls.active}`);
        console.log(`✍️  Total Signatures: ${report.scrolls.signatures}`);
        console.log(`✨ Active Animations: ${report.scrolls.animations}`);
        console.log('\n🎨 Scrolls by Epoch:');
        for (const [epoch, count] of Object.entries(report.epochs)) {
            console.log(`   ${this.epochs[epoch].symbol} ${epoch}: ${count}`);
        }
        
        return report;
    }
    
    /**
     * Stop the engine gracefully
     */
    async shutdown() {
        console.log('🛑 Shutting down Living Scroll Engine...');
        
        // Stop game ticks
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
        }
        
        // Save active scrolls
        await this.saveActiveScrolls();
        
        // Clean up animations
        this.scrollRegistry.animations.clear();
        this.scrollRegistry.particles.clear();
        
        console.log('👋 Living Scroll Engine shutdown complete');
        this.emit('engine-shutdown');
    }
    
    /**
     * CLI demonstration interface
     */
    static async demo() {
        console.log('🎭 Living ASCII Scroll Engine Demo');
        console.log('══════════════════════════════════');
        
        const engine = new LivingASCIIScrollEngine({
            tickRate: 600,
            defaultEpoch: 'medieval',
            enableParticles: true
        });
        
        // Wait for initialization
        await new Promise(resolve => {
            engine.once('engine-initialized', resolve);
        });
        
        // Create a demo scroll
        const scroll = await engine.createLivingScroll({
            title: 'Declaration of Digital Independence',
            content: 'When in the course of computational events...',
            epoch: 'medieval'
        });
        
        console.log('\n📜 Created living scroll:', scroll.id);
        
        // Simulate pressure signatures
        setTimeout(async () => {
            await engine.addPressureSignature(scroll.id, 'black-authority', {
                pressureReadings: [0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4],
                velocity: { x: 2.5, y: 1.2 },
                duration: 3500
            });
        }, 2000);
        
        // Show scroll rendering every few ticks
        let renderCount = 0;
        engine.on('game-tick', (data) => {
            if (data.tick % 5 === 0 && renderCount < 10) { // Every 3 seconds
                console.clear();
                console.log(engine.renderScroll(scroll.id));
                console.log(`\n⏱️  Tick: ${data.tick} | Time: ${Math.floor(data.elapsed / 1000)}s`);
                renderCount++;
            }
        });
        
        // Show status after 30 seconds
        setTimeout(() => {
            engine.generateStatusReport();
        }, 30000);
        
        // Graceful shutdown after 60 seconds
        setTimeout(async () => {
            await engine.shutdown();
            process.exit(0);
        }, 60000);
    }
    
    // Stub methods to be implemented
    async initializeParticles() { /* Particle system initialization */ }
    async loadSavedScrolls() { /* Load saved scrolls from disk */ }
    updateReady(scroll) { /* Update ready state */ }
    updateSigning(scroll) { /* Update signing state */ }
    updateAging(scroll) { /* Update aging state */ }
    updateAncient(scroll) { /* Update ancient state */ }
    applyScrollPhysics(scroll) { /* Apply physics calculations */ }
    processAnimation(animation, tick) { /* Process animations */ }
    updateParticles(particles, tick) { /* Update particle systems */ }
    processPressureChanges() { /* Process pressure input changes */ }
    async addEpochParticles(scroll) { /* Add epoch-specific particles */ }
    async createSigningAnimation(scroll, signature) { /* Create signing animation */ }
    renderTitleSection(scroll, epoch) { return `${epoch.symbol} ${scroll.title} ${epoch.symbol}`; }
    renderContent(scroll, height) { return ['Content area...']; }
    renderSignatures(scroll) { return ['Signatures...']; }
    addGlowEffect(output, glow) { return output; }
    overlayParticles(output, scroll) { return output; }
    createParticleEffect(type, particles) { return []; }
    async saveActiveScrolls() { /* Save scrolls to disk */ }
}

// Run demo if called directly
if (require.main === module) {
    LivingASCIIScrollEngine.demo().catch(console.error);
}

module.exports = LivingASCIIScrollEngine;