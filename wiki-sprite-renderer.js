#!/usr/bin/env node

/**
 * 🎨🔮 WIKI SPRITE RENDERER
 * 
 * Visual representation system that converts wiki knowledge into animated sprites
 * and 3D models. Information is revealed through quantum particle effects and
 * visual leaking patterns.
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const unifiedColorSystem = require('./unified-color-system');

class WikiSpriteRenderer extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.rendererId = crypto.randomBytes(8).toString('hex');
        this.rendererName = 'Wiki Sprite Renderer';
        
        // Rendering configuration
        this.renderConfig = {
            // Sprite dimensions
            sprites: {
                defaultSize: { width: 64, height: 64 },
                maxSize: { width: 256, height: 256 },
                pixelFormat: 'RGBA',
                frameRate: 30,
                animationTypes: ['idle', 'revealing', 'quantum_flux', 'entangled']
            },
            
            // 3D model configuration
            models: {
                format: 'quantum_mesh',
                defaultVertices: 1000,
                maxVertices: 10000,
                shaderTypes: ['quantum_glow', 'information_particles', 'holographic']
            },
            
            // Visual effects
            effects: {
                quantumParticles: {
                    enabled: true,
                    particleCount: 100,
                    lifespan: 2000, // ms
                    colors: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00']
                },
                informationLeaking: {
                    enabled: true,
                    leakStyle: 'dissolve', // dissolve, drip, fragment, quantum
                    speed: 0.5
                },
                holographic: {
                    enabled: true,
                    scanlines: true,
                    glitchFrequency: 0.1,
                    opacity: 0.8
                }
            },
            
            // Rendering patterns
            patterns: {
                fibonacci_spiral: {
                    name: 'Fibonacci Spiral',
                    function: (t, x, y) => {
                        const phi = (1 + Math.sqrt(5)) / 2;
                        const theta = t * Math.PI * 2;
                        const r = Math.pow(phi, theta / (2 * Math.PI));
                        return {
                            x: x + r * Math.cos(theta),
                            y: y + r * Math.sin(theta)
                        };
                    }
                },
                quantum_wave: {
                    name: 'Quantum Wave Function',
                    function: (t, x, y) => ({
                        x: x + Math.sin(t * 0.1) * Math.cos(y * 0.1),
                        y: y + Math.cos(t * 0.1) * Math.sin(x * 0.1)
                    })
                },
                mandelbrot: {
                    name: 'Mandelbrot Set',
                    function: (t, x, y) => {
                        let zx = 0, zy = 0;
                        const cx = (x - 128) / 64;
                        const cy = (y - 128) / 64;
                        
                        for (let i = 0; i < 10; i++) {
                            const tmp = zx * zx - zy * zy + cx;
                            zy = 2 * zx * zy + cy;
                            zx = tmp;
                        }
                        
                        return { x: x + zx * 10, y: y + zy * 10 };
                    }
                }
            }
        };
        
        // Sprite cache
        this.spriteCache = new Map();
        this.modelCache = new Map();
        this.animationFrames = new Map();
        
        // Rendering state
        this.renderingState = {
            activeRenders: new Map(),
            particleSystems: new Map(),
            shaderPrograms: new Map(),
            frameCount: 0,
            lastFrameTime: Date.now()
        };
        
        console.log(unifiedColorSystem.formatStatus('info', 'Wiki Sprite Renderer initializing...'));
        this.initialize();
    }
    
    async initialize() {
        try {
            // Initialize sprite rendering system
            await this.initializeSpriteSystem();
            
            // Initialize 3D model system
            await this.initialize3DSystem();
            
            // Load shader programs
            await this.loadShaderPrograms();
            
            // Start animation loop
            this.startAnimationLoop();
            
            console.log(unifiedColorSystem.formatStatus('success', 'Wiki Sprite Renderer ready!'));
            
            this.emit('rendererReady', {
                rendererId: this.rendererId,
                capabilities: this.getCapabilities()
            });
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('error', `Renderer initialization failed: ${error.message}`));
            throw error;
        }
    }
    
    /**
     * SPRITE SYSTEM INITIALIZATION
     */
    async initializeSpriteSystem() {
        console.log(unifiedColorSystem.formatStatus('info', 'Initializing sprite system...'));
        
        // Create base sprite templates
        this.spriteTemplates = {
            // Knowledge orb sprite
            knowledge_orb: {
                base: this.createBaseSprite(64, 64),
                animations: {
                    idle: this.createOrbIdleAnimation(),
                    revealing: this.createOrbRevealAnimation(),
                    quantum_flux: this.createQuantumFluxAnimation()
                }
            },
            
            // Information crystal
            info_crystal: {
                base: this.createCrystalSprite(64, 64),
                animations: {
                    idle: this.createCrystalIdleAnimation(),
                    revealing: this.createCrystalRevealAnimation(),
                    entangled: this.createEntangledAnimation()
                }
            },
            
            // Data stream
            data_stream: {
                base: this.createStreamSprite(128, 32),
                animations: {
                    flowing: this.createStreamFlowAnimation(),
                    leaking: this.createLeakingAnimation()
                }
            }
        };
        
        console.log(unifiedColorSystem.formatStatus('success', 'Sprite system initialized'));
    }
    
    createBaseSprite(width, height) {
        const pixels = new Uint8ClampedArray(width * height * 4);
        
        // Create circular gradient
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) / 2;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const intensity = Math.max(0, 1 - distance / maxRadius);
                
                // Quantum blue glow
                pixels[index] = 0;                      // R
                pixels[index + 1] = intensity * 200;   // G
                pixels[index + 2] = intensity * 255;   // B
                pixels[index + 3] = intensity * 255;   // A
            }
        }
        
        return { width, height, pixels };
    }
    
    createCrystalSprite(width, height) {
        const pixels = new Uint8ClampedArray(width * height * 4);
        
        // Create hexagonal crystal shape
        const centerX = width / 2;
        const centerY = height / 2;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const dx = Math.abs(x - centerX);
                const dy = Math.abs(y - centerY);
                
                // Hexagon check
                if (dx < width / 3 && dy < height / 3) {
                    const intensity = 1 - (dx + dy) / (width / 2);
                    
                    // Crystal purple
                    pixels[index] = intensity * 200;     // R
                    pixels[index + 1] = intensity * 100; // G
                    pixels[index + 2] = intensity * 255; // B
                    pixels[index + 3] = intensity * 255; // A
                } else {
                    pixels[index + 3] = 0; // Transparent
                }
            }
        }
        
        return { width, height, pixels };
    }
    
    createStreamSprite(width, height) {
        const pixels = new Uint8ClampedArray(width * height * 4);
        
        // Create flowing data stream
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const wave = Math.sin(x * 0.1) * 0.5 + 0.5;
                const intensity = wave * (1 - Math.abs(y - height / 2) / (height / 2));
                
                // Data green
                pixels[index] = intensity * 50;      // R
                pixels[index + 1] = intensity * 255; // G
                pixels[index + 2] = intensity * 100; // B
                pixels[index + 3] = intensity * 200; // A
            }
        }
        
        return { width, height, pixels };
    }
    
    /**
     * ANIMATION CREATION
     */
    createOrbIdleAnimation() {
        const frames = [];
        const frameCount = 30;
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / frameCount;
            frames.push({
                duration: 33, // ~30fps
                transform: {
                    scale: 1 + Math.sin(t * Math.PI * 2) * 0.1,
                    rotation: t * Math.PI * 2,
                    opacity: 0.8 + Math.sin(t * Math.PI * 4) * 0.2
                }
            });
        }
        
        return frames;
    }
    
    createOrbRevealAnimation() {
        const frames = [];
        const frameCount = 60;
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / frameCount;
            frames.push({
                duration: 16,
                transform: {
                    scale: 0.5 + t * 1.5,
                    rotation: t * Math.PI * 4,
                    opacity: t
                },
                effect: {
                    particleBurst: i === 30,
                    glowIntensity: Math.sin(t * Math.PI) * 2
                }
            });
        }
        
        return frames;
    }
    
    createQuantumFluxAnimation() {
        const frames = [];
        const frameCount = 120;
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / frameCount;
            const quantum = Math.sin(t * Math.PI * 8) * Math.cos(t * Math.PI * 3);
            
            frames.push({
                duration: 16,
                transform: {
                    scale: 1 + quantum * 0.3,
                    rotation: quantum * Math.PI,
                    opacity: 0.5 + Math.abs(quantum) * 0.5,
                    blur: Math.abs(quantum) * 3
                },
                effect: {
                    quantumDistortion: quantum,
                    phaseShift: t * Math.PI * 2
                }
            });
        }
        
        return frames;
    }
    
    /**
     * 3D MODEL SYSTEM
     */
    async initialize3DSystem() {
        console.log(unifiedColorSystem.formatStatus('info', 'Initializing 3D model system...'));
        
        // Create base 3D models
        this.modelTemplates = {
            // Knowledge sphere
            knowledge_sphere: {
                vertices: this.createSphereVertices(32, 32),
                normals: this.createSphereNormals(32, 32),
                uvs: this.createSphereUVs(32, 32),
                shader: 'quantum_glow'
            },
            
            // Information torus
            info_torus: {
                vertices: this.createTorusVertices(32, 16),
                normals: this.createTorusNormals(32, 16),
                uvs: this.createTorusUVs(32, 16),
                shader: 'information_particles'
            },
            
            // Data helix
            data_helix: {
                vertices: this.createHelixVertices(100),
                normals: this.createHelixNormals(100),
                shader: 'holographic'
            }
        };
        
        console.log(unifiedColorSystem.formatStatus('success', '3D model system initialized'));
    }
    
    createSphereVertices(latSegments, lonSegments) {
        const vertices = [];
        
        for (let lat = 0; lat <= latSegments; lat++) {
            const theta = lat * Math.PI / latSegments;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let lon = 0; lon <= lonSegments; lon++) {
                const phi = lon * 2 * Math.PI / lonSegments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                vertices.push({
                    x: cosPhi * sinTheta,
                    y: cosTheta,
                    z: sinPhi * sinTheta
                });
            }
        }
        
        return vertices;
    }
    
    createTorusVertices(majorSegments, minorSegments) {
        const vertices = [];
        const majorRadius = 1;
        const minorRadius = 0.3;
        
        for (let i = 0; i <= majorSegments; i++) {
            const u = i / majorSegments * Math.PI * 2;
            
            for (let j = 0; j <= minorSegments; j++) {
                const v = j / minorSegments * Math.PI * 2;
                
                vertices.push({
                    x: (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u),
                    y: minorRadius * Math.sin(v),
                    z: (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u)
                });
            }
        }
        
        return vertices;
    }
    
    createHelixVertices(segments) {
        const vertices = [];
        const radius = 0.5;
        const height = 3;
        const turns = 3;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * Math.PI * 2 * turns;
            
            vertices.push({
                x: radius * Math.cos(angle),
                y: t * height - height / 2,
                z: radius * Math.sin(angle)
            });
            
            // Double helix
            vertices.push({
                x: radius * Math.cos(angle + Math.PI),
                y: t * height - height / 2,
                z: radius * Math.sin(angle + Math.PI)
            });
        }
        
        return vertices;
    }
    
    createSphereNormals(latSegments, lonSegments) {
        // For a unit sphere, normals are same as vertices
        return this.createSphereVertices(latSegments, lonSegments);
    }
    
    createTorusNormals(majorSegments, minorSegments) {
        const normals = [];
        
        for (let i = 0; i <= majorSegments; i++) {
            const u = i / majorSegments * Math.PI * 2;
            
            for (let j = 0; j <= minorSegments; j++) {
                const v = j / minorSegments * Math.PI * 2;
                
                normals.push({
                    x: Math.cos(v) * Math.cos(u),
                    y: Math.sin(v),
                    z: Math.cos(v) * Math.sin(u)
                });
            }
        }
        
        return normals;
    }
    
    createHelixNormals(segments) {
        const normals = [];
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * Math.PI * 2 * 3;
            
            // Perpendicular to helix direction
            normals.push({
                x: -Math.sin(angle),
                y: 0,
                z: Math.cos(angle)
            });
            
            normals.push({
                x: -Math.sin(angle + Math.PI),
                y: 0,
                z: Math.cos(angle + Math.PI)
            });
        }
        
        return normals;
    }
    
    createSphereUVs(latSegments, lonSegments) {
        const uvs = [];
        
        for (let lat = 0; lat <= latSegments; lat++) {
            for (let lon = 0; lon <= lonSegments; lon++) {
                uvs.push({
                    u: lon / lonSegments,
                    v: lat / latSegments
                });
            }
        }
        
        return uvs;
    }
    
    createTorusUVs(majorSegments, minorSegments) {
        const uvs = [];
        
        for (let i = 0; i <= majorSegments; i++) {
            for (let j = 0; j <= minorSegments; j++) {
                uvs.push({
                    u: i / majorSegments,
                    v: j / minorSegments
                });
            }
        }
        
        return uvs;
    }
    
    /**
     * SHADER PROGRAMS
     */
    async loadShaderPrograms() {
        console.log(unifiedColorSystem.formatStatus('info', 'Loading shader programs...'));
        
        this.shaders = {
            quantum_glow: {
                vertex: `
                    attribute vec3 position;
                    attribute vec3 normal;
                    uniform mat4 modelView;
                    uniform mat4 projection;
                    uniform float time;
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    
                    void main() {
                        float wave = sin(position.y * 10.0 + time) * 0.1;
                        vec3 pos = position + normal * wave;
                        vNormal = normal;
                        vPosition = pos;
                        gl_Position = projection * modelView * vec4(pos, 1.0);
                    }
                `,
                fragment: `
                    precision mediump float;
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    uniform float time;
                    uniform float quantum;
                    
                    void main() {
                        float glow = dot(vNormal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
                        glow *= sin(vPosition.y * 20.0 + time * 2.0) * 0.5 + 0.5;
                        
                        vec3 color = vec3(0.0, glow * 0.8, glow);
                        color += vec3(0.2, 0.5, 1.0) * quantum;
                        
                        gl_FragColor = vec4(color, 0.8);
                    }
                `
            },
            
            information_particles: {
                vertex: `
                    attribute vec3 position;
                    attribute vec2 uv;
                    uniform mat4 modelView;
                    uniform mat4 projection;
                    uniform float time;
                    varying vec2 vUV;
                    varying float vParticle;
                    
                    void main() {
                        vUV = uv;
                        vParticle = fract(position.x + position.y + position.z + time * 0.1);
                        
                        vec3 pos = position;
                        pos += vec3(
                            sin(time + position.y * 10.0) * 0.05,
                            cos(time + position.x * 10.0) * 0.05,
                            sin(time + position.z * 10.0) * 0.05
                        );
                        
                        gl_Position = projection * modelView * vec4(pos, 1.0);
                        gl_PointSize = 3.0 + sin(vParticle * 6.28) * 2.0;
                    }
                `,
                fragment: `
                    precision mediump float;
                    varying vec2 vUV;
                    varying float vParticle;
                    uniform float time;
                    
                    void main() {
                        float dist = length(gl_PointCoord - vec2(0.5));
                        if (dist > 0.5) discard;
                        
                        float alpha = 1.0 - dist * 2.0;
                        vec3 color = vec3(vParticle, 1.0 - vParticle, sin(vParticle * 6.28) * 0.5 + 0.5);
                        
                        gl_FragColor = vec4(color, alpha * 0.8);
                    }
                `
            },
            
            holographic: {
                vertex: `
                    attribute vec3 position;
                    uniform mat4 modelView;
                    uniform mat4 projection;
                    varying vec3 vPosition;
                    
                    void main() {
                        vPosition = position;
                        gl_Position = projection * modelView * vec4(position, 1.0);
                    }
                `,
                fragment: `
                    precision mediump float;
                    varying vec3 vPosition;
                    uniform float time;
                    uniform float scanline;
                    uniform float glitch;
                    
                    void main() {
                        float holo = sin(vPosition.y * 100.0 + time * 10.0) * 0.1 + 0.9;
                        
                        // Scanlines
                        if (scanline > 0.5) {
                            holo *= sin(gl_FragCoord.y * 2.0) * 0.1 + 0.9;
                        }
                        
                        // Glitch effect
                        if (glitch > 0.5 && fract(time * 0.1) < 0.1) {
                            holo *= fract(sin(gl_FragCoord.x * 43758.5453));
                        }
                        
                        vec3 color = vec3(0.0, holo, holo * 0.5);
                        gl_FragColor = vec4(color, holo * 0.7);
                    }
                `
            }
        };
        
        console.log(unifiedColorSystem.formatStatus('success', 'Shader programs loaded'));
    }
    
    /**
     * RENDERING METHODS
     */
    async renderWikiEntry(entryId, entryData, progress) {
        const renderJob = {
            id: crypto.randomBytes(8).toString('hex'),
            entryId: entryId,
            entryData: entryData,
            progress: progress,
            startTime: Date.now(),
            sprites: [],
            models: [],
            particles: []
        };
        
        // Choose sprite based on entry type
        const spriteType = this.chooseSpriteType(entryData);
        const sprite = await this.renderSprite(spriteType, progress);
        renderJob.sprites.push(sprite);
        
        // Generate 3D model if progress > 50%
        if (progress > 0.5) {
            const modelType = this.chooseModelType(entryData);
            const model = await this.render3DModel(modelType, progress);
            renderJob.models.push(model);
        }
        
        // Add particle effects
        if (this.renderConfig.effects.quantumParticles.enabled) {
            const particles = this.createParticleSystem(entryId, progress);
            renderJob.particles.push(particles);
        }
        
        // Store render job
        this.renderingState.activeRenders.set(renderJob.id, renderJob);
        
        this.emit('renderCreated', {
            renderId: renderJob.id,
            entryId: entryId,
            progress: progress,
            sprites: renderJob.sprites.length,
            models: renderJob.models.length
        });
        
        return renderJob;
    }
    
    chooseSpriteType(entryData) {
        // Choose sprite based on entry category
        if (entryData.category === 'quantum_physics') return 'knowledge_orb';
        if (entryData.category === 'mathematics') return 'info_crystal';
        return 'data_stream';
    }
    
    chooseModelType(entryData) {
        if (entryData.category === 'quantum_physics') return 'knowledge_sphere';
        if (entryData.category === 'mathematics') return 'info_torus';
        return 'data_helix';
    }
    
    async renderSprite(spriteType, progress) {
        const template = this.spriteTemplates[spriteType];
        if (!template) throw new Error(`Unknown sprite type: ${spriteType}`);
        
        // Clone base sprite
        const sprite = {
            type: spriteType,
            width: template.base.width,
            height: template.base.height,
            pixels: new Uint8ClampedArray(template.base.pixels),
            animation: 'revealing',
            frame: 0,
            progress: progress
        };
        
        // Apply progress-based modifications
        this.applyProgressToSprite(sprite, progress);
        
        // Apply visual effects
        if (this.renderConfig.effects.informationLeaking.enabled) {
            this.applyLeakingEffect(sprite, progress);
        }
        
        // Cache sprite
        const spriteId = `${spriteType}_${Math.floor(progress * 100)}`;
        this.spriteCache.set(spriteId, sprite);
        
        return sprite;
    }
    
    applyProgressToSprite(sprite, progress) {
        const pixels = sprite.pixels;
        const leakStyle = this.renderConfig.effects.informationLeaking.leakStyle;
        
        switch (leakStyle) {
            case 'dissolve':
                // Dissolve from edges
                for (let i = 0; i < pixels.length; i += 4) {
                    const pixelIndex = i / 4;
                    const x = pixelIndex % sprite.width;
                    const y = Math.floor(pixelIndex / sprite.width);
                    const centerDist = Math.sqrt(
                        Math.pow(x - sprite.width / 2, 2) + 
                        Math.pow(y - sprite.height / 2, 2)
                    );
                    const maxDist = Math.sqrt(sprite.width * sprite.width + sprite.height * sprite.height) / 2;
                    const revealThreshold = progress * maxDist;
                    
                    if (centerDist > revealThreshold) {
                        pixels[i + 3] = 0; // Make transparent
                    }
                }
                break;
                
            case 'drip':
                // Information drips down
                for (let i = 0; i < pixels.length; i += 4) {
                    const pixelIndex = i / 4;
                    const y = Math.floor(pixelIndex / sprite.width);
                    const revealLine = sprite.height * (1 - progress);
                    
                    if (y < revealLine) {
                        pixels[i + 3] = 0;
                    } else if (y < revealLine + 10) {
                        // Drip effect
                        pixels[i + 3] *= (y - revealLine) / 10;
                    }
                }
                break;
                
            case 'quantum':
                // Quantum probability clouds
                for (let i = 0; i < pixels.length; i += 4) {
                    const probability = Math.random();
                    if (probability > progress) {
                        pixels[i + 3] *= probability;
                    }
                }
                break;
        }
    }
    
    applyLeakingEffect(sprite, progress) {
        // Add visual artifacts for leaking information
        const pixels = sprite.pixels;
        
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] > 0) { // Only affect visible pixels
                // Add quantum noise
                const noise = (Math.random() - 0.5) * 50 * (1 - progress);
                pixels[i] = Math.max(0, Math.min(255, pixels[i] + noise));
                pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + noise));
                pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + noise));
                
                // Information particles
                if (Math.random() < 0.01 * progress) {
                    pixels[i] = 255;
                    pixels[i + 1] = 255;
                    pixels[i + 2] = 255;
                    pixels[i + 3] = 255;
                }
            }
        }
    }
    
    async render3DModel(modelType, progress) {
        const template = this.modelTemplates[modelType];
        if (!template) throw new Error(`Unknown model type: ${modelType}`);
        
        // Create model instance
        const model = {
            type: modelType,
            vertices: [],
            normals: template.normals ? [] : null,
            uvs: template.uvs ? [] : null,
            shader: template.shader,
            progress: progress,
            transforms: {
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
                position: { x: 0, y: 0, z: 0 }
            }
        };
        
        // Reveal vertices based on progress
        const revealCount = Math.floor(template.vertices.length * progress);
        model.vertices = template.vertices.slice(0, revealCount);
        
        if (template.normals) {
            model.normals = template.normals.slice(0, revealCount);
        }
        
        if (template.uvs) {
            model.uvs = template.uvs.slice(0, revealCount);
        }
        
        // Apply quantum distortion
        this.applyQuantumDistortion(model, progress);
        
        // Cache model
        const modelId = `${modelType}_${Math.floor(progress * 100)}`;
        this.modelCache.set(modelId, model);
        
        return model;
    }
    
    applyQuantumDistortion(model, progress) {
        // Apply quantum uncertainty to vertex positions
        const uncertainty = (1 - progress) * 0.1;
        
        model.vertices = model.vertices.map(vertex => ({
            x: vertex.x + (Math.random() - 0.5) * uncertainty,
            y: vertex.y + (Math.random() - 0.5) * uncertainty,
            z: vertex.z + (Math.random() - 0.5) * uncertainty
        }));
    }
    
    createParticleSystem(entryId, progress) {
        const config = this.renderConfig.effects.quantumParticles;
        
        const particleSystem = {
            id: crypto.randomBytes(8).toString('hex'),
            entryId: entryId,
            particles: [],
            emitRate: config.particleCount * progress,
            lifespan: config.lifespan,
            colors: config.colors,
            active: true
        };
        
        // Initialize particles
        for (let i = 0; i < config.particleCount * progress; i++) {
            particleSystem.particles.push({
                position: { x: 0, y: 0, z: 0 },
                velocity: {
                    x: (Math.random() - 0.5) * 0.1,
                    y: Math.random() * 0.2,
                    z: (Math.random() - 0.5) * 0.1
                },
                life: Math.random() * config.lifespan,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                size: Math.random() * 3 + 1
            });
        }
        
        this.renderingState.particleSystems.set(particleSystem.id, particleSystem);
        
        return particleSystem;
    }
    
    /**
     * ANIMATION LOOP
     */
    startAnimationLoop() {
        const animate = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - this.renderingState.lastFrameTime;
            
            // Update all active renders
            for (const [renderId, renderJob] of this.renderingState.activeRenders) {
                this.updateRenderJob(renderJob, deltaTime);
            }
            
            // Update particle systems
            for (const [systemId, system] of this.renderingState.particleSystems) {
                this.updateParticleSystem(system, deltaTime);
            }
            
            // Update frame count
            this.renderingState.frameCount++;
            this.renderingState.lastFrameTime = currentTime;
            
            // Continue animation
            setTimeout(animate, 1000 / this.renderConfig.sprites.frameRate);
        };
        
        animate();
    }
    
    updateRenderJob(renderJob, deltaTime) {
        // Update sprite animations
        for (const sprite of renderJob.sprites) {
            const template = this.spriteTemplates[sprite.type];
            const animation = template.animations[sprite.animation];
            
            if (animation) {
                sprite.frame = (sprite.frame + 1) % animation.length;
                const frame = animation[sprite.frame];
                
                // Apply frame transforms
                if (frame.transform) {
                    sprite.transform = frame.transform;
                }
            }
        }
        
        // Update 3D model rotations
        for (const model of renderJob.models) {
            model.transforms.rotation.y += 0.01;
            model.transforms.rotation.x += 0.005;
        }
        
        // Emit update event
        this.emit('renderUpdate', {
            renderId: renderJob.id,
            deltaTime: deltaTime,
            progress: renderJob.progress
        });
    }
    
    updateParticleSystem(system, deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds
        
        for (let i = system.particles.length - 1; i >= 0; i--) {
            const particle = system.particles[i];
            
            // Update position
            particle.position.x += particle.velocity.x * dt;
            particle.position.y += particle.velocity.y * dt;
            particle.position.z += particle.velocity.z * dt;
            
            // Update life
            particle.life -= deltaTime;
            
            // Remove dead particles
            if (particle.life <= 0) {
                system.particles.splice(i, 1);
                
                // Spawn new particle if system is active
                if (system.active) {
                    system.particles.push({
                        position: { x: 0, y: 0, z: 0 },
                        velocity: {
                            x: (Math.random() - 0.5) * 0.1,
                            y: Math.random() * 0.2,
                            z: (Math.random() - 0.5) * 0.1
                        },
                        life: system.lifespan,
                        color: system.colors[Math.floor(Math.random() * system.colors.length)],
                        size: Math.random() * 3 + 1
                    });
                }
            }
        }
    }
    
    /**
     * PUBLIC API
     */
    getCapabilities() {
        return {
            sprites: {
                maxSize: this.renderConfig.sprites.maxSize,
                frameRate: this.renderConfig.sprites.frameRate,
                animationTypes: this.renderConfig.sprites.animationTypes
            },
            models: {
                format: this.renderConfig.models.format,
                maxVertices: this.renderConfig.models.maxVertices,
                shaders: Object.keys(this.shaders)
            },
            effects: {
                quantumParticles: this.renderConfig.effects.quantumParticles.enabled,
                informationLeaking: this.renderConfig.effects.informationLeaking.enabled,
                holographic: this.renderConfig.effects.holographic.enabled
            },
            patterns: Object.keys(this.renderConfig.patterns)
        };
    }
    
    getRendererStatus() {
        return {
            rendererId: this.rendererId,
            activeRenders: this.renderingState.activeRenders.size,
            particleSystems: this.renderingState.particleSystems.size,
            frameCount: this.renderingState.frameCount,
            caches: {
                sprites: this.spriteCache.size,
                models: this.modelCache.size
            }
        };
    }
    
    exportRender(renderId, format = 'json') {
        const renderJob = this.renderingState.activeRenders.get(renderId);
        if (!renderJob) return null;
        
        switch (format) {
            case 'json':
                return JSON.stringify(renderJob, null, 2);
                
            case 'binary':
                // Export as binary format
                return this.exportBinaryFormat(renderJob);
                
            case 'webgl':
                // Export WebGL-ready data
                return this.exportWebGLFormat(renderJob);
                
            default:
                return renderJob;
        }
    }
}

// Export the renderer
module.exports = WikiSpriteRenderer;

// CLI interface
if (require.main === module) {
    (async () => {
        console.log('🎨🔮 Wiki Sprite Renderer Demo\n');
        
        const renderer = new WikiSpriteRenderer();
        
        // Wait for initialization
        await new Promise(resolve => {
            renderer.on('rendererReady', resolve);
        });
        
        // Display capabilities
        const capabilities = renderer.getCapabilities();
        
        console.log('\n🎨 Renderer Capabilities:');
        console.log(`  Max Sprite Size: ${capabilities.sprites.maxSize.width}x${capabilities.sprites.maxSize.height}`);
        console.log(`  Frame Rate: ${capabilities.sprites.frameRate} fps`);
        console.log(`  3D Models: ${capabilities.models.maxVertices} max vertices`);
        console.log(`  Shaders: ${capabilities.models.shaders.join(', ')}`);
        
        console.log('\n✨ Visual Effects:');
        console.log(`  Quantum Particles: ${capabilities.effects.quantumParticles ? '✅' : '❌'}`);
        console.log(`  Information Leaking: ${capabilities.effects.informationLeaking ? '✅' : '❌'}`);
        console.log(`  Holographic: ${capabilities.effects.holographic ? '✅' : '❌'}`);
        
        // Create test render
        console.log('\n🎬 Creating test wiki entry render...');
        
        const testEntry = {
            id: 'quantum_mechanics_basics',
            category: 'quantum_physics',
            title: 'Quantum Mechanics Basics',
            content: 'Introduction to quantum mechanics...'
        };
        
        // Simulate progressive rendering
        let progress = 0;
        const renderInterval = setInterval(async () => {
            progress += 0.1;
            
            const renderJob = await renderer.renderWikiEntry(
                testEntry.id,
                testEntry,
                progress
            );
            
            console.log(`📊 Rendering: ${(progress * 100).toFixed(0)}% complete`);
            console.log(`  Sprites: ${renderJob.sprites.length}`);
            console.log(`  Models: ${renderJob.models.length}`);
            console.log(`  Particles: ${renderJob.particles.length}`);
            
            if (progress >= 1) {
                clearInterval(renderInterval);
                console.log('\n✅ Rendering complete!');
                
                const status = renderer.getRendererStatus();
                console.log(`\n📈 Renderer Status:`);
                console.log(`  Active Renders: ${status.activeRenders}`);
                console.log(`  Particle Systems: ${status.particleSystems}`);
                console.log(`  Frame Count: ${status.frameCount}`);
            }
        }, 1000);
        
        console.log('\n✨ Wiki Sprite Renderer is active!');
        console.log('Visual representations reveal as information leaks through quantum channels.');
        
    })().catch(console.error);
}