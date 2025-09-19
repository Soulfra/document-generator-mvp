#!/usr/bin/env node

/**
 * 🎨 3D Texture Harmonics Engine
 * 
 * Renders 3D textures that respond to phonetic brand analysis.
 * Creates dynamic visual experiences that adapt to pronunciation
 * frequencies and cultural patterns.
 * 
 * Based on Three.js with custom shaders for texture responsiveness.
 */

const { EventEmitter } = require('events');

class ThreeDTextureHarmonics extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Rendering configuration
            canvasId: config.canvasId || 'brand-canvas',
            width: config.width || 1920,
            height: config.height || 1080,
            pixelRatio: config.pixelRatio || (typeof window !== 'undefined' ? window.devicePixelRatio : 1),
            
            // Scene configuration
            backgroundColor: config.backgroundColor || 0x000000,
            cameraPosition: config.cameraPosition || { x: 0, y: 0, z: 5 },
            cameraFov: config.cameraFov || 75,
            
            // Animation configuration
            animationSpeed: config.animationSpeed || 1.0,
            autoRotate: config.autoRotate !== false,
            rotationSpeed: config.rotationSpeed || 0.01,
            
            // Texture configuration
            textureResolution: config.textureResolution || 512,
            maxTextures: config.maxTextures || 10,
            textureUpdateRate: config.textureUpdateRate || 60, // FPS
            
            ...config
        };
        
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        
        // Brand logo mesh and materials
        this.brandMesh = null;
        this.brandMaterial = null;
        this.brandGeometry = null;
        
        // Dynamic textures
        this.dynamicTextures = new Map();
        this.activeTexture = null;
        
        // Shader uniforms (passed to GPU)
        this.uniforms = {
            uTime: { value: 0.0 },
            uFrequency: { value: 528.0 }, // Default love frequency
            uIntensity: { value: 0.5 },
            uLanguageId: { value: 0.0 },
            uRhythm: { value: [1.0, 0.5, 1.0, 0.5] },
            uColors: { value: [
                { r: 1.0, g: 1.0, b: 1.0 }, // White
                { r: 1.0, g: 0.0, b: 0.0 }, // Red
                { r: 0.0, g: 1.0, b: 0.0 }  // Green
            ]},
            uResolution: { value: { x: this.config.width, y: this.config.height } },
            uMouse: { value: { x: 0.0, y: 0.0 } },
            uNoiseScale: { value: 1.0 },
            uDisplacement: { value: 0.1 },
            uReflection: { value: 0.5 },
            uOpacity: { value: 1.0 }
        };
        
        // Vertex shader - defines geometry transformation
        this.vertexShader = `
            uniform float uTime;
            uniform float uFrequency;
            uniform float uIntensity;
            uniform float uDisplacement;
            uniform vec4 uRhythm;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying float vRhythm;
            
            // Noise function for organic displacement
            float noise(vec3 pos) {
                return fract(sin(dot(pos, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
            }
            
            // Smooth noise
            float smoothNoise(vec3 pos) {
                vec3 i = floor(pos);
                vec3 f = fract(pos);
                f = f * f * (3.0 - 2.0 * f);
                
                float a = noise(i);
                float b = noise(i + vec3(1.0, 0.0, 0.0));
                float c = noise(i + vec3(0.0, 1.0, 0.0));
                float d = noise(i + vec3(1.0, 1.0, 0.0));
                
                return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }
            
            void main() {
                vUv = uv;
                vPosition = position;
                vNormal = normal;
                
                // Calculate rhythm factor based on time
                float rhythmTime = mod(uTime * uFrequency / 1000.0, 4.0);
                int rhythmIndex = int(floor(rhythmTime));
                vRhythm = uRhythm[rhythmIndex];
                
                // Apply frequency-based displacement
                vec3 pos = position;
                float freqFactor = uFrequency / 1000.0;
                
                // Create displacement based on frequency and rhythm
                float displacement = smoothNoise(pos * freqFactor + uTime * 0.1) 
                                   * uDisplacement 
                                   * uIntensity 
                                   * vRhythm;
                
                // Apply displacement along normal
                pos += normal * displacement;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
        
        // Fragment shader - defines surface appearance
        this.fragmentShader = `
            uniform float uTime;
            uniform float uFrequency;
            uniform float uIntensity;
            uniform float uLanguageId;
            uniform vec3 uColors[3];
            uniform vec2 uResolution;
            uniform float uNoiseScale;
            uniform float uReflection;
            uniform float uOpacity;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying float vRhythm;
            
            // Advanced noise functions
            float hash(float n) {
                return fract(sin(n) * 43758.5453);
            }
            
            float noise3d(vec3 x) {
                vec3 p = floor(x);
                vec3 f = fract(x);
                f = f * f * (3.0 - 2.0 * f);
                
                float n = p.x + p.y * 57.0 + 113.0 * p.z;
                return mix(
                    mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                        mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
                    mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                        mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
            }
            
            // Fractal Brownian Motion for complex textures
            float fbm(vec3 pos) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;
                
                for(int i = 0; i < 4; i++) {
                    value += amplitude * noise3d(pos * frequency);
                    amplitude *= 0.5;
                    frequency *= 2.0;
                }
                
                return value;
            }
            
            // Convert frequency to color temperature
            vec3 frequencyToColor(float freq) {
                // Map frequency to color temperature (Kelvin)
                float temp = 1000.0 + freq * 5.0;
                
                // Simplified blackbody radiation color
                vec3 color;
                if (temp < 3300.0) {
                    color = vec3(1.0, 0.4 + 0.6 * temp / 3300.0, 0.0);
                } else if (temp < 5000.0) {
                    color = vec3(1.0, 0.8, 0.4 + 0.6 * (temp - 3300.0) / 1700.0);
                } else {
                    color = vec3(0.8 + 0.2 * (6500.0 - temp) / 1500.0, 0.9, 1.0);
                }
                
                return color;
            }
            
            // Language-specific texture patterns
            vec3 getLanguageTexture(vec2 uv, float langId) {
                vec3 basePos = vec3(uv * uNoiseScale, uTime * 0.1);
                
                if (langId < 0.1) {
                    // English: Geometric, corporate
                    float grid = step(0.5, mod(uv.x * 10.0, 1.0)) + step(0.5, mod(uv.y * 10.0, 1.0));
                    return mix(uColors[0], uColors[1], grid * 0.5);
                    
                } else if (langId < 0.2) {
                    // Spanish: Flowing, warm
                    float flow = sin(uv.x * 6.28 + uTime) * cos(uv.y * 6.28 + uTime * 0.7);
                    return mix(uColors[1], uColors[2], flow * 0.5 + 0.5);
                    
                } else if (langId < 0.3) {
                    // Chinese: Crystalline, precise
                    float crystal = fbm(basePos * 3.0);
                    return mix(uColors[0], uColors[2], crystal);
                    
                } else if (langId < 0.4) {
                    // Arabic: Calligraphic, flowing
                    float wave = sin(uv.x * 12.56 + cos(uv.y * 8.0) + uTime);
                    return mix(uColors[1], uColors[0], wave * 0.3 + 0.7);
                    
                } else {
                    // Hindi: Organic, spiritual
                    float organic = fbm(basePos) * noise3d(basePos * 2.0);
                    return mix(uColors[2], uColors[1], organic);
                }
            }
            
            void main() {
                vec2 uv = vUv;
                
                // Get base texture from language pattern
                vec3 languageTexture = getLanguageTexture(uv, uLanguageId);
                
                // Apply frequency-based color modulation
                vec3 frequencyColor = frequencyToColor(uFrequency);
                
                // Combine language texture with frequency color
                vec3 baseColor = mix(languageTexture, frequencyColor, 0.3);
                
                // Add rhythm-based intensity variation
                float rhythmIntensity = vRhythm * uIntensity;
                
                // Apply noise-based surface detail
                vec3 noisePos = vPosition * uNoiseScale + uTime * 0.1;
                float surfaceNoise = fbm(noisePos);
                
                // Modulate color with noise and rhythm
                vec3 finalColor = baseColor * (0.8 + 0.4 * surfaceNoise * rhythmIntensity);
                
                // Add frequency-based highlights
                float highlight = pow(max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
                finalColor += frequencyColor * highlight * 0.2;
                
                // Apply reflection
                float fresnel = 1.0 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
                finalColor = mix(finalColor, vec3(1.0), fresnel * uReflection);
                
                // Gamma correction
                finalColor = pow(finalColor, vec3(1.0 / 2.2));
                
                gl_FragColor = vec4(finalColor, uOpacity);
            }
        `;
        
        // Animation state
        this.animationId = null;
        this.startTime = 0;
        this.lastTime = 0;
        
        // Performance monitoring
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = 0;
        
        this.initialized = false;
    }
    
    /**
     * Initialize the 3D texture harmonics engine
     */
    async initialize(canvasElement = null) {
        console.log('🎨 Initializing 3D Texture Harmonics Engine...');
        
        try {
            // Get or create canvas element
            this.canvas = canvasElement || this.getOrCreateCanvas();
            
            // Initialize Three.js
            await this.initializeThreeJS();
            
            // Create brand geometry and materials
            await this.createBrandGeometry();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start animation loop
            this.startAnimation();
            
            this.initialized = true;
            console.log('✅ 3D Texture Harmonics Engine initialized');
            console.log(`🖼️ Resolution: ${this.config.width}x${this.config.height}`);
            console.log(`🎮 Renderer: ${this.renderer.capabilities.isWebGL2 ? 'WebGL2' : 'WebGL'}`);
            
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize 3D Texture Harmonics Engine:', error);
            throw error;
        }
    }
    
    /**
     * Get or create canvas element
     */
    getOrCreateCanvas() {
        if (typeof document !== 'undefined') {
            let canvas = document.getElementById(this.config.canvasId);
            
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.id = this.config.canvasId;
                canvas.width = this.config.width;
                canvas.height = this.config.height;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.display = 'block';
                
                // Add to document if body exists
                if (document.body) {
                    document.body.appendChild(canvas);
                }
            }
            
            return canvas;
        }
        
        // Node.js environment - create mock canvas
        return {
            width: this.config.width,
            height: this.config.height,
            getContext: () => null
        };
    }
    
    /**
     * Initialize Three.js components
     */
    async initializeThreeJS() {
        // Check if Three.js is available
        if (typeof window === 'undefined' || !window.THREE) {
            console.warn('⚠️ Three.js not available, using mock renderer');
            this.createMockRenderer();
            return;
        }
        
        const THREE = window.THREE;
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.config.backgroundColor);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            this.config.cameraFov,
            this.config.width / this.config.height,
            0.1,
            1000
        );
        
        this.camera.position.set(
            this.config.cameraPosition.x,
            this.config.cameraPosition.y,
            this.config.cameraPosition.z
        );
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        
        this.renderer.setSize(this.config.width, this.config.height);
        this.renderer.setPixelRatio(this.config.pixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        console.log('🎮 Three.js initialized successfully');
    }
    
    /**
     * Create mock renderer for Node.js environment
     */
    createMockRenderer() {
        this.scene = { add: () => {}, remove: () => {} };
        this.camera = { position: { set: () => {} } };
        this.renderer = {
            render: () => {},
            setSize: () => {},
            capabilities: { isWebGL2: false }
        };
        
        console.log('🎭 Mock renderer created for Node.js environment');
    }
    
    /**
     * Create brand geometry and materials
     */
    async createBrandGeometry() {
        if (!window.THREE) {
            console.log('🎭 Skipping geometry creation (Three.js not available)');
            return;
        }
        
        const THREE = window.THREE;
        
        // Create custom shader material
        this.brandMaterial = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create brand logo geometry (customizable)
        this.brandGeometry = this.createLogoGeometry(THREE);
        
        // Create mesh
        this.brandMesh = new THREE.Mesh(this.brandGeometry, this.brandMaterial);
        this.scene.add(this.brandMesh);
        
        console.log('🎨 Brand geometry and materials created');
    }
    
    /**
     * Create logo geometry (can be customized for different brands)
     */
    createLogoGeometry(THREE) {
        // Default: Create a stylized "D" shape for "DeathToData"
        const shape = new THREE.Shape();
        
        // Create letter "D" path
        shape.moveTo(0, 1);
        shape.lineTo(0, -1);
        shape.lineTo(0.8, -1);
        shape.bezierCurveTo(1.5, -1, 2, -0.5, 2, 0);
        shape.bezierCurveTo(2, 0.5, 1.5, 1, 0.8, 1);
        shape.lineTo(0, 1);
        
        // Extrude the shape to create 3D geometry
        const extrudeSettings = {
            depth: 0.3,
            bevelEnabled: true,
            bevelSegments: 8,
            steps: 2,
            bevelSize: 0.1,
            bevelThickness: 0.1
        };
        
        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (typeof window === 'undefined') return;
        
        // Mouse movement for interactive effects
        window.addEventListener('mousemove', (event) => {
            if (this.canvas) {
                const rect = this.canvas.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width;
                const y = 1.0 - (event.clientY - rect.top) / rect.height;
                
                this.uniforms.uMouse.value.x = x;
                this.uniforms.uMouse.value.y = y;
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Visibility change (pause when not visible)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimation();
            } else {
                this.resumeAnimation();
            }
        });
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.camera || !this.renderer) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        this.uniforms.uResolution.value.x = width;
        this.uniforms.uResolution.value.y = height;
        
        console.log(`📏 Resized to ${width}x${height}`);
    }
    
    /**
     * Start animation loop
     */
    startAnimation() {
        if (this.animationId) return;
        
        this.startTime = performance.now();
        this.lastTime = this.startTime;
        this.lastFpsUpdate = this.startTime;
        
        this.animate();
        
        console.log('▶️ Animation started');
    }
    
    /**
     * Animation loop
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        const elapsedTime = (currentTime - this.startTime) / 1000.0;
        
        // Update uniforms
        this.uniforms.uTime.value = elapsedTime * this.config.animationSpeed;
        
        // Auto-rotate brand mesh
        if (this.brandMesh && this.config.autoRotate) {
            this.brandMesh.rotation.y += this.config.rotationSpeed;
        }
        
        // Render scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
        
        // Update performance metrics
        this.updatePerformanceMetrics(currentTime);
        
        this.lastTime = currentTime;
    }
    
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFpsUpdate > 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
            
            this.emit('performance_update', {
                fps: this.fps,
                timestamp: new Date()
            });
        }
    }
    
    /**
     * Pause animation
     */
    pauseAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            console.log('⏸️ Animation paused');
        }
    }
    
    /**
     * Resume animation
     */
    resumeAnimation() {
        if (!this.animationId) {
            this.startAnimation();
            console.log('▶️ Animation resumed');
        }
    }
    
    /**
     * Update texture from phonetic analysis
     */
    updateFromPhoneticAnalysis(analysis) {
        console.log(`🎨 Updating texture for "${analysis.brandName}" (${analysis.language})`);
        
        if (!analysis.textureSignature) {
            console.warn('⚠️ No texture signature in analysis');
            return;
        }
        
        const texture = analysis.textureSignature;
        const frequencies = analysis.frequencies;
        
        // Update shader uniforms
        this.uniforms.uFrequency.value = frequencies.baseFrequency || 528;
        this.uniforms.uIntensity.value = texture.intensity || 0.5;
        this.uniforms.uLanguageId.value = texture.shaderUniforms?.uLanguageId || 0.0;
        this.uniforms.uDisplacement.value = texture.displacement || 0.1;
        this.uniforms.uReflection.value = texture.reflection || 0.5;
        this.uniforms.uOpacity.value = texture.opacity || 1.0;
        
        // Update rhythm pattern
        if (texture.rhythmPattern) {
            const rhythm = texture.rhythmPattern.slice(0, 4); // Limit to 4 elements
            while (rhythm.length < 4) rhythm.push(1.0); // Fill missing values
            this.uniforms.uRhythm.value = rhythm;
        }
        
        // Update colors
        if (texture.colors && texture.colors.length >= 3) {
            this.uniforms.uColors.value = texture.colors.slice(0, 3).map(color => {
                // Convert hex colors to RGB
                if (typeof color === 'string' && color.startsWith('#')) {
                    const hex = color.slice(1);
                    return {
                        r: parseInt(hex.slice(0, 2), 16) / 255,
                        g: parseInt(hex.slice(2, 4), 16) / 255,
                        b: parseInt(hex.slice(4, 6), 16) / 255
                    };
                }
                return { r: 1.0, g: 1.0, b: 1.0 }; // Default white
            });
        }
        
        // Update animation speed
        if (texture.animationSpeed) {
            this.config.animationSpeed = texture.animationSpeed;
        }
        
        console.log(`🎵 Updated to ${frequencies.baseFrequency}Hz (${texture.culturalStyle})`);
        
        this.emit('texture_updated', {
            brandName: analysis.brandName,
            language: analysis.language,
            frequency: frequencies.baseFrequency,
            style: texture.culturalStyle,
            timestamp: new Date()
        });
    }
    
    /**
     * Create custom texture for brand
     */
    createCustomTexture(brandName, textureConfig) {
        console.log(`🎨 Creating custom texture for ${brandName}`);
        
        const textureId = `${brandName}_${Date.now()}`;
        
        // Store texture configuration
        this.dynamicTextures.set(textureId, {
            brandName,
            config: textureConfig,
            created: new Date()
        });
        
        // Apply immediately if no active texture
        if (!this.activeTexture) {
            this.activeTexture = textureId;
            this.applyTexture(textureConfig);
        }
        
        this.emit('texture_created', { textureId, brandName });
        
        return textureId;
    }
    
    /**
     * Apply texture configuration
     */
    applyTexture(config) {
        Object.keys(config).forEach(key => {
            if (this.uniforms[key]) {
                this.uniforms[key].value = config[key];
            }
        });
    }
    
    /**
     * Switch to different texture
     */
    switchTexture(textureId) {
        const texture = this.dynamicTextures.get(textureId);
        
        if (texture) {
            this.activeTexture = textureId;
            this.applyTexture(texture.config);
            
            console.log(`🔄 Switched to texture: ${texture.brandName}`);
            this.emit('texture_switched', { textureId, brandName: texture.brandName });
        } else {
            console.warn(`⚠️ Texture not found: ${textureId}`);
        }
    }
    
    /**
     * Export current frame as image
     */
    exportFrame(format = 'png') {
        if (!this.renderer || !this.canvas) {
            console.warn('⚠️ Cannot export frame - renderer not available');
            return null;
        }
        
        try {
            const dataURL = this.canvas.toDataURL(`image/${format}`);
            console.log(`📸 Frame exported as ${format}`);
            
            this.emit('frame_exported', { format, dataURL, timestamp: new Date() });
            
            return dataURL;
        } catch (error) {
            console.error('❌ Failed to export frame:', error);
            return null;
        }
    }
    
    /**
     * Get current performance metrics
     */
    getPerformanceMetrics() {
        return {
            fps: this.fps,
            frameCount: this.frameCount,
            isAnimating: !!this.animationId,
            activeTextures: this.dynamicTextures.size,
            memoryUsage: this.renderer ? this.renderer.info.memory : null,
            renderCalls: this.renderer ? this.renderer.info.render.calls : null
        };
    }
    
    /**
     * Get available textures
     */
    getAvailableTextures() {
        const textures = [];
        
        for (const [id, texture] of this.dynamicTextures.entries()) {
            textures.push({
                id,
                brandName: texture.brandName,
                created: texture.created,
                active: id === this.activeTexture
            });
        }
        
        return textures;
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        console.log('🧹 Cleaning up 3D Texture Harmonics Engine...');
        
        // Stop animation
        this.pauseAnimation();
        
        // Dispose of Three.js resources
        if (this.brandGeometry) {
            this.brandGeometry.dispose();
        }
        
        if (this.brandMaterial) {
            this.brandMaterial.dispose();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Clear textures
        this.dynamicTextures.clear();
        
        console.log('✅ Cleanup completed');
    }
}

// Export the class
module.exports = ThreeDTextureHarmonics;

// Demo if run directly (browser environment)
if (require.main === module && typeof window !== 'undefined') {
    const harmonics = new ThreeDTextureHarmonics({
        width: 800,
        height: 600,
        animationSpeed: 1.5
    });
    
    // Event listeners
    harmonics.on('initialized', () => {
        console.log('🎨 3D Texture Harmonics ready!');
        
        // Demo texture updates
        setTimeout(() => {
            // Simulate English "DeathToData" analysis
            harmonics.updateFromPhoneticAnalysis({
                brandName: 'DeathToData',
                language: 'en-US',
                frequencies: { baseFrequency: 396 },
                textureSignature: {
                    intensity: 0.8,
                    displacement: 0.2,
                    reflection: 0.3,
                    opacity: 0.9,
                    culturalStyle: 'geometric',
                    colors: ['#000000', '#ff0000', '#333333'],
                    rhythmPattern: [1.0, 0.5, 1.0, 0.5],
                    shaderUniforms: { uLanguageId: 0.0 }
                }
            });
        }, 2000);
        
        setTimeout(() => {
            // Simulate Spanish "Muerte a Datos" analysis
            harmonics.updateFromPhoneticAnalysis({
                brandName: 'MuerteADatos',
                language: 'es-ES',
                frequencies: { baseFrequency: 528 },
                textureSignature: {
                    intensity: 0.7,
                    displacement: 0.15,
                    reflection: 0.6,
                    opacity: 0.85,
                    culturalStyle: 'flowing',
                    colors: ['#8B4513', '#FF6347', '#FFD700'],
                    rhythmPattern: [1.0, 0.5, 0.8, 0.5],
                    shaderUniforms: { uLanguageId: 0.1 }
                }
            });
        }, 5000);
        
        setTimeout(() => {
            // Simulate Chinese "数据之死" analysis
            harmonics.updateFromPhoneticAnalysis({
                brandName: 'DataDeath',
                language: 'zh-CN',
                frequencies: { baseFrequency: 741 },
                textureSignature: {
                    intensity: 0.9,
                    displacement: 0.1,
                    reflection: 0.8,
                    opacity: 0.95,
                    culturalStyle: 'crystalline',
                    colors: ['#FFD700', '#00FF00', '#FF0000'],
                    rhythmPattern: [1.0, 0.0, 1.0, 0.0],
                    shaderUniforms: { uLanguageId: 0.2 }
                }
            });
        }, 8000);
    });
    
    harmonics.on('texture_updated', (data) => {
        console.log(`🎨 Texture updated: ${data.brandName} (${data.language}) @ ${data.frequency}Hz`);
    });
    
    harmonics.on('performance_update', (metrics) => {
        if (metrics.fps < 30) {
            console.warn(`⚠️ Low FPS: ${metrics.fps}`);
        }
    });
    
    // Initialize
    harmonics.initialize().catch(console.error);
    
    // Export global reference for testing
    window.textureHarmonics = harmonics;
}