#!/usr/bin/env node

/**
 * ========================================
 * 3D SHIP MODEL GENERATOR
 * ========================================
 * Converts extracted vault blueprints and ShipRekt assets
 * into actual Three.js ship models for the unified 3D game
 * ========================================
 */

const fs = require('fs').promises;
const path = require('path');

console.log(`
🏴‍☠️ 3D SHIP MODEL GENERATOR 🏴‍☠️
Converting vault blueprints to Three.js models
From hidden assets to playable ships!
`);

class Ship3DModelGenerator {
    constructor() {
        this.extractDir = '/Users/matthewmauer/Desktop/Document-Generator/extracted-ship-models';
        this.outputDir = '/Users/matthewmauer/Desktop/Document-Generator/generated-3d-ships';
        this.assetsDir = '/Users/matthewmauer/Desktop/Document-Generator/ship-assets';
        
        // Ship type definitions based on extracted data
        this.shipTypes = {
            sloop: {
                name: 'Pirate Sloop',
                category: 'light',
                size: { length: 20, width: 6, height: 8 },
                stats: { speed: 8, armor: 3, firepower: 4, crew: 12 },
                colors: { hull: 0x8B4513, sails: 0xF5F5DC, trim: 0x4A4A4A },
                description: 'Fast and nimble single-masted vessel'
            },
            
            frigate: {
                name: 'Royal Frigate', 
                category: 'medium',
                size: { length: 35, width: 10, height: 12 },
                stats: { speed: 6, armor: 6, firepower: 7, crew: 28 },
                colors: { hull: 0x2F4F4F, sails: 0xFFFFFF, trim: 0xFFD700 },
                description: 'Well-balanced warship with strong cannons'
            },
            
            galleon: {
                name: 'Spanish Galleon',
                category: 'heavy', 
                size: { length: 50, width: 14, height: 18 },
                stats: { speed: 4, armor: 9, firepower: 9, crew: 45 },
                colors: { hull: 0x654321, sails: 0xF0E68C, trim: 0xB8860B },
                description: 'Massive treasure ship with heavy armor'
            },
            
            submarine: {
                name: 'Steampunk Submarine',
                category: 'special',
                size: { length: 25, width: 5, height: 6 },
                stats: { speed: 5, armor: 7, firepower: 6, crew: 15 },
                colors: { hull: 0x708090, trim: 0xCD7F32, glass: 0x4169E1 },
                description: 'Underwater vessel for sonar perspective'
            },
            
            yacht: {
                name: 'Luxury Yacht',
                category: 'civilian',
                size: { length: 30, width: 8, height: 10 },
                stats: { speed: 7, armor: 2, firepower: 1, crew: 8 },
                colors: { hull: 0xFFFFFF, trim: 0x4169E1, deck: 0xDEB887 },
                description: 'Fast civilian vessel for trading'
            },
            
            destroyer: {
                name: 'Modern Destroyer',
                category: 'military',
                size: { length: 40, width: 12, height: 15 },
                stats: { speed: 9, armor: 8, firepower: 10, crew: 35 },
                colors: { hull: 0x2F4F4F, superstructure: 0x696969, weapons: 0x000000 },
                description: 'High-tech warship with advanced weapons'
            }
        };
        
        // Component definitions for ship building
        this.components = {
            hulls: ['wooden_hull', 'metal_hull', 'reinforced_hull', 'stealth_hull'],
            sails: ['square_sail', 'lateen_sail', 'jib_sail', 'storm_sail'],
            weapons: ['cannon', 'carronade', 'ballista', 'torpedo_tube', 'laser_cannon'],
            decorations: ['figurehead', 'flag', 'lanterns', 'gold_trim'],
            engines: ['wind_power', 'steam_engine', 'diesel_engine', 'fusion_reactor']
        };
        
        this.init();
    }
    
    async init() {
        console.log('🔧 Initializing 3D Ship Model Generator...');
        
        // Create output directories
        await this.createDirectories();
        
        // Load extracted assets
        await this.loadExtractedAssets();
        
        // Generate ship models
        await this.generateAllShipModels();
        
        // Create asset library
        await this.createAssetLibrary();
        
        // Generate integration files
        await this.generateIntegrationFiles();
        
        console.log('✅ 3D Ship Model Generation Complete!');
    }
    
    async createDirectories() {
        const dirs = [
            this.outputDir,
            this.assetsDir,
            `${this.outputDir}/models`,
            `${this.outputDir}/textures`,
            `${this.outputDir}/animations`,
            `${this.assetsDir}/ship-library`,
            `${this.assetsDir}/components`
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        console.log('📁 Created output directories');
    }
    
    async loadExtractedAssets() {
        console.log('📦 Loading extracted assets...');
        
        try {
            // Load ShipRekt data
            const shipRektFiles = await fs.readdir(`${this.extractDir}/ship-models`);
            console.log(`🚢 Found ${shipRektFiles.length} ShipRekt asset files`);
            
            // Load 3D game assets
            const gameFiles = await fs.readdir(`${this.extractDir}/3d-assets`);
            console.log(`🎮 Found ${gameFiles.length} 3D game asset files`);
            
            // Load blueprint files
            const blueprintFiles = await fs.readdir(`${this.extractDir}/blueprints`);
            console.log(`📋 Found ${blueprintFiles.length} blueprint files`);
            
        } catch (error) {
            console.error('❌ Error loading extracted assets:', error.message);
        }
    }
    
    async generateAllShipModels() {
        console.log('⚓ Generating 3D ship models...');
        
        for (const [shipKey, shipData] of Object.entries(this.shipTypes)) {
            console.log(`🔨 Generating ${shipData.name}...`);
            
            const shipModel = await this.generateShipModel(shipKey, shipData);
            const shipCode = this.generateThreeJSCode(shipKey, shipData, shipModel);
            
            // Save ship model code
            await fs.writeFile(
                `${this.outputDir}/models/${shipKey}-model.js`,
                shipCode
            );
            
            // Generate ship configuration
            const shipConfig = this.generateShipConfig(shipKey, shipData);
            await fs.writeFile(
                `${this.outputDir}/models/${shipKey}-config.json`,
                JSON.stringify(shipConfig, null, 2)
            );
            
            console.log(`✅ Generated ${shipData.name} model and config`);
        }
    }
    
    async generateShipModel(shipKey, shipData) {
        // Generate procedural ship geometry based on ship type
        const model = {
            shipKey,
            geometry: this.generateShipGeometry(shipData),
            materials: this.generateShipMaterials(shipData),
            components: this.generateShipComponents(shipData),
            animations: this.generateShipAnimations(shipData),
            physics: this.generateShipPhysics(shipData),
            sounds: this.generateShipSounds(shipData)
        };
        
        return model;
    }
    
    generateShipGeometry(shipData) {
        const { size } = shipData;
        
        return {
            hull: {
                type: 'custom_hull',
                length: size.length,
                width: size.width,
                height: size.height,
                vertices: this.generateHullVertices(size),
                faces: this.generateHullFaces(size),
                uvMapping: this.generateHullUVMapping(size)
            },
            
            deck: {
                type: 'plane',
                width: size.width * 0.8,
                length: size.length * 0.9,
                position: { x: 0, y: size.height * 0.6, z: 0 }
            },
            
            masts: this.generateMasts(shipData),
            sails: this.generateSails(shipData),
            cannons: this.generateCannons(shipData),
            details: this.generateShipDetails(shipData)
        };
    }
    
    generateHullVertices(size) {
        // Generate hull vertices for a realistic ship shape
        const vertices = [];
        const segments = 20;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = (t - 0.5) * size.length;
            
            // Hull profile - narrow at ends, wide in middle
            const widthFactor = Math.sin(Math.PI * (1 - Math.abs(t - 0.5) * 2)) * 0.8 + 0.2;
            const heightFactor = Math.sin(Math.PI * (1 - Math.abs(t - 0.5) * 2)) * 0.6 + 0.4;
            
            // Generate cross-section vertices
            const crossSegments = 12;
            for (let j = 0; j <= crossSegments; j++) {
                const angle = (j / crossSegments) * Math.PI * 2;
                const radius = size.width * 0.5 * widthFactor;
                const y = Math.cos(angle) * size.height * 0.3 * heightFactor;
                const z = Math.sin(angle) * radius;
                
                vertices.push({ x, y, z });
            }
        }
        
        return vertices;
    }
    
    generateHullFaces(size) {
        // Generate faces connecting hull vertices
        const faces = [];
        const segments = 20;
        const crossSegments = 12;
        
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < crossSegments; j++) {
                const current = i * (crossSegments + 1) + j;
                const next = current + (crossSegments + 1);
                
                // Create quads
                faces.push([current, current + 1, next + 1, next]);
            }
        }
        
        return faces;
    }
    
    generateHullUVMapping(size) {
        return {
            hull_texture: 'wooden_planks.jpg',
            normal_map: 'wood_normal.jpg',
            roughness_map: 'wood_roughness.jpg',
            scale: { u: size.length / 10, v: size.width / 5 }
        };
    }
    
    generateMasts(shipData) {
        const masts = [];
        const mastCount = shipData.category === 'light' ? 1 : shipData.category === 'medium' ? 2 : 3;
        
        for (let i = 0; i < mastCount; i++) {
            const mastPosition = {
                x: (i - mastCount/2 + 0.5) * shipData.size.length * 0.3,
                y: shipData.size.height * 0.6,
                z: 0
            };
            
            masts.push({
                type: 'cylinder',
                radius: 0.3,
                height: shipData.size.height * 1.5,
                position: mastPosition,
                material: 'wood',
                color: 0x8B4513
            });
        }
        
        return masts;
    }
    
    generateSails(shipData) {
        const sails = [];
        const sailCount = shipData.category === 'light' ? 1 : shipData.category === 'medium' ? 3 : 5;
        
        for (let i = 0; i < sailCount; i++) {
            const sailSize = {
                width: shipData.size.width * 0.8,
                height: shipData.size.height * 0.8
            };
            
            sails.push({
                type: 'plane',
                width: sailSize.width,
                height: sailSize.height,
                position: {
                    x: (i - sailCount/2 + 0.5) * shipData.size.length * 0.25,
                    y: shipData.size.height * 1.2,
                    z: 0
                },
                material: 'cloth',
                color: shipData.colors.sails,
                animation: 'wind_flutter'
            });
        }
        
        return sails;
    }
    
    generateCannons(shipData) {
        const cannons = [];
        const cannonCount = Math.floor(shipData.stats.firepower / 2);
        
        for (let i = 0; i < cannonCount; i++) {
            const side = i % 2 === 0 ? 1 : -1;
            
            cannons.push({
                type: 'cylinder',
                radius: 0.2,
                height: 2,
                position: {
                    x: (i - cannonCount/2) * 3,
                    y: shipData.size.height * 0.4,
                    z: side * shipData.size.width * 0.4
                },
                rotation: { x: 0, y: 0, z: Math.PI / 2 },
                material: 'metal',
                color: 0x2F4F4F
            });
        }
        
        return cannons;
    }
    
    generateShipDetails(shipData) {
        return {
            figurehead: {
                type: 'custom_mesh',
                position: { x: shipData.size.length * 0.45, y: shipData.size.height * 0.7, z: 0 },
                model: 'dragon_figurehead.obj',
                scale: 0.5
            },
            
            wheel: {
                type: 'cylinder',
                radius: 1,
                height: 0.2,
                position: { x: -shipData.size.length * 0.4, y: shipData.size.height * 0.8, z: 0 },
                material: 'wood',
                interactive: true
            },
            
            flag: {
                type: 'plane',
                width: 2,
                height: 1.5,
                position: { x: 0, y: shipData.size.height * 2, z: 0 },
                texture: 'pirate_flag.png',
                animation: 'flag_wave'
            }
        };
    }
    
    generateShipMaterials(shipData) {
        return {
            hull: {
                type: 'MeshStandardMaterial',
                color: shipData.colors.hull,
                map: 'textures/wooden_planks.jpg',
                normalMap: 'textures/wood_normal.jpg',
                roughnessMap: 'textures/wood_roughness.jpg',
                roughness: 0.8,
                metalness: 0.1
            },
            
            sails: {
                type: 'MeshStandardMaterial',
                color: shipData.colors.sails,
                map: 'textures/canvas.jpg',
                transparent: true,
                opacity: 0.9,
                side: 'DoubleSide'
            },
            
            metal: {
                type: 'MeshStandardMaterial',
                color: 0x2F4F4F,
                metalness: 0.8,
                roughness: 0.3,
                envMapIntensity: 1
            },
            
            rope: {
                type: 'MeshStandardMaterial',
                color: 0x8B4513,
                roughness: 0.9,
                metalness: 0
            }
        };
    }
    
    generateShipComponents(shipData) {
        return {
            upgradeable: [
                {
                    type: 'hull_armor',
                    levels: ['wood', 'iron', 'steel', 'mythril'],
                    stats: { armor: [0, 2, 4, 8] }
                },
                {
                    type: 'sail_efficiency', 
                    levels: ['cotton', 'silk', 'windweave', 'stormcloth'],
                    stats: { speed: [0, 1, 2, 4] }
                },
                {
                    type: 'cannon_upgrade',
                    levels: ['iron', 'steel', 'dragonfire', 'plasma'],
                    stats: { firepower: [0, 2, 4, 8] }
                }
            ],
            
            customizable: [
                'hull_color',
                'sail_pattern', 
                'figurehead_style',
                'flag_design',
                'cannon_style'
            ]
        };
    }
    
    generateShipAnimations(shipData) {
        return {
            idle: {
                sails: 'gentle_flutter',
                ship: 'gentle_bob',
                flag: 'wave_slowly'
            },
            
            sailing: {
                sails: 'wind_flutter',
                ship: 'forward_motion',
                wake: 'generate_wake'
            },
            
            combat: {
                cannons: 'recoil_sequence',
                ship: 'battle_rock',
                smoke: 'cannon_smoke'
            },
            
            damaged: {
                ship: 'listing_motion',
                sails: 'torn_flutter',
                particles: 'damage_sparks'
            }
        };
    }
    
    generateShipPhysics(shipData) {
        return {
            mass: shipData.stats.armor * 100,
            drag: {
                water: 0.1,
                air: 0.05
            },
            buoyancy: {
                displacement: shipData.size.length * shipData.size.width * 0.3,
                center: { x: 0, y: -shipData.size.height * 0.2, z: 0 }
            },
            collision: {
                type: 'compound',
                shapes: [
                    {
                        type: 'box',
                        size: shipData.size,
                        offset: { x: 0, y: 0, z: 0 }
                    }
                ]
            }
        };
    }
    
    generateShipSounds(shipData) {
        return {
            ambient: [
                'ocean_waves.ogg',
                'creaking_wood.ogg',
                'wind_through_rigging.ogg'
            ],
            
            actions: {
                cannon_fire: 'cannon_boom.ogg',
                sail_unfurl: 'canvas_snap.ogg',
                anchor_drop: 'chain_rattle.ogg',
                bell: 'ship_bell.ogg'
            },
            
            damage: [
                'wood_crack.ogg',
                'cannon_hit.ogg',
                'water_rush.ogg'
            ]
        };
    }
    
    generateThreeJSCode(shipKey, shipData, shipModel) {
        return `/**
 * ${shipData.name} - Three.js Model
 * Generated from vault blueprints
 * Category: ${shipData.category}
 */

class ${shipKey.charAt(0).toUpperCase() + shipKey.slice(1)}Ship extends THREE.Group {
    constructor(options = {}) {
        super();
        
        this.shipData = ${JSON.stringify(shipData, null, 8)};
        this.model = ${JSON.stringify(shipModel, null, 8)};
        this.options = options;
        
        this.parts = {};
        this.animations = {};
        this.sounds = {};
        
        this.buildShip();
        this.setupAnimations();
        this.setupPhysics();
    }
    
    buildShip() {
        // Build hull
        this.buildHull();
        
        // Build masts and sails
        this.buildMasts();
        this.buildSails();
        
        // Build cannons
        this.buildCannons();
        
        // Build details
        this.buildDetails();
        
        // Set initial position
        this.position.set(0, 0, 0);
        this.rotation.set(0, 0, 0);
    }
    
    buildHull() {
        const hullGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const faces = [];
        
        // Convert hull vertices to Three.js format
        this.model.geometry.hull.vertices.forEach(vertex => {
            vertices.push(vertex.x, vertex.y, vertex.z);
        });
        
        hullGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        const hullMaterial = new THREE.MeshStandardMaterial({
            color: this.shipData.colors.hull,
            roughness: 0.8,
            metalness: 0.1
        });
        
        this.parts.hull = new THREE.Mesh(hullGeometry, hullMaterial);
        this.add(this.parts.hull);
    }
    
    buildMasts() {
        this.parts.masts = [];
        
        this.model.geometry.masts.forEach((mastData, index) => {
            const mastGeometry = new THREE.CylinderGeometry(
                mastData.radius, 
                mastData.radius, 
                mastData.height
            );
            
            const mastMaterial = new THREE.MeshStandardMaterial({
                color: mastData.color
            });
            
            const mast = new THREE.Mesh(mastGeometry, mastMaterial);
            mast.position.set(mastData.position.x, mastData.position.y, mastData.position.z);
            
            this.parts.masts.push(mast);
            this.add(mast);
        });
    }
    
    buildSails() {
        this.parts.sails = [];
        
        this.model.geometry.sails.forEach((sailData, index) => {
            const sailGeometry = new THREE.PlaneGeometry(sailData.width, sailData.height);
            
            const sailMaterial = new THREE.MeshStandardMaterial({
                color: sailData.color,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            
            const sail = new THREE.Mesh(sailGeometry, sailMaterial);
            sail.position.set(sailData.position.x, sailData.position.y, sailData.position.z);
            
            this.parts.sails.push(sail);
            this.add(sail);
        });
    }
    
    buildCannons() {
        this.parts.cannons = [];
        
        this.model.geometry.cannons.forEach((cannonData, index) => {
            const cannonGeometry = new THREE.CylinderGeometry(
                cannonData.radius,
                cannonData.radius,
                cannonData.height
            );
            
            const cannonMaterial = new THREE.MeshStandardMaterial({
                color: cannonData.color,
                metalness: 0.8,
                roughness: 0.3
            });
            
            const cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
            cannon.position.set(cannonData.position.x, cannonData.position.y, cannonData.position.z);
            cannon.rotation.set(cannonData.rotation.x, cannonData.rotation.y, cannonData.rotation.z);
            
            this.parts.cannons.push(cannon);
            this.add(cannon);
        });
    }
    
    buildDetails() {
        // Build ship wheel
        const wheelGeometry = new THREE.CylinderGeometry(1, 1, 0.2);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        this.parts.wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        
        const wheelData = this.model.geometry.details.wheel;
        this.parts.wheel.position.set(wheelData.position.x, wheelData.position.y, wheelData.position.z);
        this.add(this.parts.wheel);
        
        // Build flag
        const flagGeometry = new THREE.PlaneGeometry(2, 1.5);
        const flagMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.8
        });
        this.parts.flag = new THREE.Mesh(flagGeometry, flagMaterial);
        
        const flagData = this.model.geometry.details.flag;
        this.parts.flag.position.set(flagData.position.x, flagData.position.y, flagData.position.z);
        this.add(this.parts.flag);
    }
    
    setupAnimations() {
        // Sail animation
        this.animations.sailFlutter = () => {
            if (this.parts.sails) {
                this.parts.sails.forEach((sail, index) => {
                    const time = Date.now() * 0.001;
                    sail.rotation.z = Math.sin(time + index) * 0.1;
                });
            }
        };
        
        // Ship bobbing animation
        this.animations.shipBob = () => {
            const time = Date.now() * 0.001;
            this.position.y = Math.sin(time * 0.5) * 0.5;
            this.rotation.z = Math.sin(time * 0.3) * 0.02;
        };
        
        // Flag wave animation
        this.animations.flagWave = () => {
            if (this.parts.flag) {
                const time = Date.now() * 0.001;
                this.parts.flag.rotation.y = Math.sin(time * 2) * 0.2;
            }
        };
    }
    
    setupPhysics() {
        this.physics = {
            velocity: new THREE.Vector3(0, 0, 0),
            acceleration: new THREE.Vector3(0, 0, 0),
            mass: this.model.physics.mass,
            drag: this.model.physics.drag
        };
    }
    
    update(deltaTime) {
        // Update animations
        this.animations.sailFlutter();
        this.animations.shipBob();
        this.animations.flagWave();
        
        // Update physics
        this.updatePhysics(deltaTime);
        
        // Update position based on velocity
        this.position.add(this.physics.velocity.clone().multiplyScalar(deltaTime));
    }
    
    updatePhysics(deltaTime) {
        // Apply drag
        this.physics.velocity.multiplyScalar(1 - this.physics.drag.water * deltaTime);
        
        // Add velocity from acceleration
        this.physics.velocity.add(this.physics.acceleration.clone().multiplyScalar(deltaTime));
        
        // Reset acceleration
        this.physics.acceleration.set(0, 0, 0);
    }
    
    applyCannons() {
        // Cannon firing logic
        this.parts.cannons.forEach((cannon, index) => {
            // Create particle effect
            const smokeGeometry = new THREE.SphereGeometry(0.5);
            const smokeMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x666666, 
                transparent: true, 
                opacity: 0.5 
            });
            
            const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            smoke.position.copy(cannon.position);
            this.add(smoke);
            
            // Remove smoke after animation
            setTimeout(() => {
                this.remove(smoke);
            }, 1000);
        });
    }
    
    takeDamage(amount) {
        this.shipData.stats.armor -= amount;
        
        if (this.shipData.stats.armor <= 0) {
            this.sink();
        }
    }
    
    sink() {
        // Sinking animation
        const sinkAnimation = () => {
            this.position.y -= 0.1;
            this.rotation.z += 0.02;
            
            if (this.position.y > -20) {
                requestAnimationFrame(sinkAnimation);
            }
        };
        
        sinkAnimation();
    }
    
    getShipData() {
        return {
            type: '${shipKey}',
            name: this.shipData.name,
            category: this.shipData.category,
            stats: this.shipData.stats,
            position: this.position.toArray(),
            rotation: this.rotation.toArray(),
            health: this.shipData.stats.armor
        };
    }
}

export default ${shipKey.charAt(0).toUpperCase() + shipKey.slice(1)}Ship;`;
    }
    
    generateShipConfig(shipKey, shipData) {
        return {
            id: shipKey,
            name: shipData.name,
            category: shipData.category,
            description: shipData.description,
            
            stats: shipData.stats,
            size: shipData.size,
            colors: shipData.colors,
            
            cost: {
                gold: shipData.stats.armor * 100,
                materials: {
                    wood: shipData.size.length * 10,
                    metal: shipData.stats.armor * 5,
                    cloth: shipData.stats.speed * 3
                }
            },
            
            unlockRequirements: {
                level: shipData.category === 'light' ? 1 : shipData.category === 'medium' ? 5 : 10,
                victories: shipData.category === 'light' ? 0 : shipData.category === 'medium' ? 10 : 25
            },
            
            specialAbilities: this.generateSpecialAbilities(shipData),
            
            compatibleWith: {
                perspectives: ['all'],
                gameMode: ['naval_combat', 'trading', 'exploration'],
                multiplayer: true
            },
            
            assetPaths: {
                model: `models/${shipKey}-model.js`,
                textures: `textures/${shipKey}/`,
                sounds: `sounds/${shipKey}/`,
                animations: `animations/${shipKey}/`
            }
        };
    }
    
    generateSpecialAbilities(shipData) {
        const abilities = [];
        
        switch (shipData.category) {
            case 'light':
                abilities.push({
                    name: 'Swift Escape',
                    description: 'Temporarily increase speed by 50%',
                    cooldown: 30000,
                    effect: 'speed_boost'
                });
                break;
                
            case 'medium':
                abilities.push({
                    name: 'Broadside',
                    description: 'Fire all cannons simultaneously',
                    cooldown: 45000,
                    effect: 'mass_cannon_fire'
                });
                break;
                
            case 'heavy':
                abilities.push({
                    name: 'Iron Resolve',
                    description: 'Reduce damage taken by 75% for 10 seconds',
                    cooldown: 60000,
                    effect: 'damage_reduction'
                });
                break;
                
            case 'special':
                abilities.push({
                    name: 'Dive',
                    description: 'Submerge underwater to avoid attacks',
                    cooldown: 40000,
                    effect: 'underwater_mode'
                });
                break;
        }
        
        return abilities;
    }
    
    async createAssetLibrary() {
        console.log('📚 Creating ship asset library...');
        
        const library = {
            version: '1.0.0',
            generatedAt: new Date().toISOString(),
            ships: {},
            components: this.components,
            
            integration: {
                unified3DGame: 'unified-3d-game-experience.html',
                shipRektEngine: 'shiprekt-charting-game-engine.js',
                perspectiveOrchestrator: 'unified-3d-perspective-orchestrator.js'
            },
            
            neuralNetwork: {
                seaToSatellite: {
                    sonarLayer: 'underwater ship detection via sonar pings',
                    surfaceLayer: 'visual ship recognition at sea level',
                    aerialLayer: 'satellite imagery of ship formations', 
                    satelliteLayer: 'thermal signatures and global tracking'
                }
            }
        };
        
        // Add each ship to library
        for (const [shipKey, shipData] of Object.entries(this.shipTypes)) {
            library.ships[shipKey] = {
                name: shipData.name,
                category: shipData.category,
                modelFile: `models/${shipKey}-model.js`,
                configFile: `models/${shipKey}-config.json`,
                stats: shipData.stats,
                description: shipData.description
            };
        }
        
        await fs.writeFile(
            `${this.assetsDir}/ship-library.json`,
            JSON.stringify(library, null, 2)
        );
        
        console.log('✅ Created ship asset library');
    }
    
    async generateIntegrationFiles() {
        console.log('🔗 Generating integration files...');
        
        // Generate ship loader for unified 3D game
        const shipLoader = this.generateShipLoader();
        await fs.writeFile(`${this.outputDir}/ship-loader.js`, shipLoader);
        
        // Generate neural network integration
        const neuralIntegration = this.generateNeuralNetworkIntegration();
        await fs.writeFile(`${this.outputDir}/neural-network-integration.js`, neuralIntegration);
        
        // Generate ShipRekt visual integration
        const shipRektIntegration = this.generateShipRektIntegration();
        await fs.writeFile(`${this.outputDir}/shiprekt-visual-integration.js`, shipRektIntegration);
        
        console.log('✅ Generated integration files');
    }
    
    generateShipLoader() {
        return `/**
 * SHIP LOADER - Integration with Unified 3D Game
 * Loads generated ship models into the game
 */

class ShipLoader {
    constructor() {
        this.loadedShips = new Map();
        this.shipLibrary = null;
        this.assetPath = './generated-3d-ships/';
    }
    
    async init() {
        // Load ship library
        const response = await fetch('./ship-assets/ship-library.json');
        this.shipLibrary = await response.json();
        
        console.log('📚 Ship library loaded:', this.shipLibrary.ships);
    }
    
    async loadShip(shipType, options = {}) {
        if (this.loadedShips.has(shipType)) {
            return this.createShipInstance(shipType, options);
        }
        
        try {
            // Import ship model
            const shipModule = await import(\`\${this.assetPath}models/\${shipType}-model.js\`);
            const ShipClass = shipModule.default;
            
            // Store ship class
            this.loadedShips.set(shipType, ShipClass);
            
            return this.createShipInstance(shipType, options);
            
        } catch (error) {
            console.error(\`Failed to load ship \${shipType}:\`, error);
            return null;
        }
    }
    
    createShipInstance(shipType, options) {
        const ShipClass = this.loadedShips.get(shipType);
        return new ShipClass(options);
    }
    
    getAvailableShips() {
        return Object.keys(this.shipLibrary.ships);
    }
    
    getShipInfo(shipType) {
        return this.shipLibrary.ships[shipType];
    }
    
    async loadAllShips() {
        const shipTypes = this.getAvailableShips();
        const loadPromises = shipTypes.map(type => this.loadShip(type));
        
        await Promise.all(loadPromises);
        console.log('⚓ All ships loaded and ready!');
    }
    
    // Integration with existing game systems
    connectToUnified3DGame(gameInstance) {
        gameInstance.shipLoader = this;
        
        // Add ship spawning methods to game
        gameInstance.spawnShip = (shipType, position, team) => {
            return this.loadShip(shipType, { position, team });
        };
        
        gameInstance.getAvailableShips = () => {
            return this.getAvailableShips();
        };
    }
    
    connectToShipRektEngine(engineInstance) {
        engineInstance.shipLoader = this;
        
        // Add visual ship support to ShipRekt
        engineInstance.spawnVisualShip = async (teamData, position) => {
            const shipType = teamData.shipType || 'sloop';
            const ship = await this.loadShip(shipType, {
                position,
                team: teamData.team,
                colors: teamData.colors
            });
            
            return ship;
        };
    }
}

export default ShipLoader;`;
    }
    
    generateNeuralNetworkIntegration() {
        return `/**
 * NEURAL NETWORK INTEGRATION - Sea to Satellite
 * Connects ship models to perspective switching system
 */

class SeaToSatelliteNeuralNetwork {
    constructor(perspectiveOrchestrator, shipLoader) {
        this.orchestrator = perspectiveOrchestrator;
        this.shipLoader = shipLoader;
        
        this.layers = {
            sonar: { depth: 'underwater', range: 1000, ships: new Map() },
            surface: { depth: 'sea_level', range: 500, ships: new Map() },
            aerial: { altitude: 'low_altitude', range: 2000, ships: new Map() },
            satellite: { altitude: 'high_orbit', range: 10000, ships: new Map() }
        };
        
        this.currentLayer = 'surface';
        this.detectionAccuracy = 1.0;
        
        this.init();
    }
    
    init() {
        console.log('🧠 Initializing Sea-to-Satellite Neural Network...');
        
        // Connect to perspective orchestrator
        this.orchestrator.on('view-changed', (data) => {
            this.handlePerspectiveChange(data);
        });
        
        // Start neural analysis loop
        this.startNeuralAnalysis();
        
        console.log('✅ Neural network online');
    }
    
    handlePerspectiveChange(data) {
        const { to: newPerspective } = data;
        
        // Map perspectives to neural layers
        const perspectiveToLayer = {
            'sonar': 'sonar',
            'first-person': 'surface', 
            'third-person': 'surface',
            'aerial': 'aerial',
            'drone': 'aerial',
            'tactical': 'satellite'
        };
        
        const newLayer = perspectiveToLayer[newPerspective] || 'surface';
        
        if (newLayer !== this.currentLayer) {
            this.switchNeuralLayer(newLayer);
        }
    }
    
    switchNeuralLayer(targetLayer) {
        console.log(\`🔄 Switching neural layer: \${this.currentLayer} → \${targetLayer}\`);
        
        const transition = {
            from: this.currentLayer,
            to: targetLayer,
            ships: this.getShipsInLayer(targetLayer),
            detectionMethod: this.getDetectionMethod(targetLayer)
        };
        
        // Update ship visibility and detection
        this.updateShipDetection(transition);
        
        // Adjust AI copilot suggestions
        this.updateAISuggestions(targetLayer);
        
        this.currentLayer = targetLayer;
        
        // Emit neural transition event
        this.orchestrator.emit('neural-layer-changed', transition);
    }
    
    getDetectionMethod(layer) {
        const methods = {
            sonar: {
                type: 'acoustic',
                accuracy: 0.7,
                range: 1000,
                detectsSubmerged: true,
                effect: 'sonar_ping_visualization'
            },
            
            surface: {
                type: 'visual',
                accuracy: 0.9,
                range: 500,
                detectsSurface: true,
                effect: 'visual_recognition'
            },
            
            aerial: {
                type: 'optical',
                accuracy: 0.8,
                range: 2000,
                detectsFormations: true,
                effect: 'aerial_photography'
            },
            
            satellite: {
                type: 'thermal',
                accuracy: 0.6,
                range: 10000,
                detectsGlobal: true,
                effect: 'heat_signature_analysis'
            }
        };
        
        return methods[layer];
    }
    
    updateShipDetection(transition) {
        const { to: targetLayer, detectionMethod } = transition;
        
        // Update detection accuracy based on layer
        this.detectionAccuracy = detectionMethod.accuracy;
        
        // Apply layer-specific ship modifications
        this.layers[targetLayer].ships.forEach((ship, shipId) => {
            this.applyLayerEffects(ship, targetLayer);
        });
    }
    
    applyLayerEffects(ship, layer) {
        switch (layer) {
            case 'sonar':
                // Convert to sonar representation
                ship.material.opacity = 0.6;
                ship.material.color.setHex(0x00ff00);
                this.addSonarPingEffect(ship);
                break;
                
            case 'surface':
                // Normal visual representation
                ship.material.opacity = 1.0;
                ship.material.color.setHex(ship.originalColor);
                this.addWakeEffect(ship);
                break;
                
            case 'aerial':
                // Top-down aerial view
                ship.scale.set(0.5, 0.1, 0.5); // Flatten for aerial view
                this.addShadowEffect(ship);
                break;
                
            case 'satellite':
                // Thermal/heat signature
                ship.material.emissive.setHex(0xff4444);
                ship.scale.set(0.1, 0.1, 0.1); // Very small from satellite
                break;
        }
    }
    
    addSonarPingEffect(ship) {
        // Create expanding sonar ring around ship
        const ringGeometry = new THREE.RingGeometry(0, 50, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3
        });
        
        const sonarRing = new THREE.Mesh(ringGeometry, ringMaterial);
        sonarRing.position.copy(ship.position);
        sonarRing.rotation.x = -Math.PI / 2;
        
        ship.parent.add(sonarRing);
        
        // Animate ping expansion
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const scale = (elapsed / 1000) * 10; // Expand over 1 second
            
            sonarRing.scale.set(scale, scale, 1);
            sonarRing.material.opacity = 0.3 * (1 - elapsed / 1000);
            
            if (elapsed < 1000) {
                requestAnimationFrame(animate);
            } else {
                ship.parent.remove(sonarRing);
            }
        };
        
        animate();
    }
    
    addWakeEffect(ship) {
        // Create wake particles behind ship
        const wakeGeometry = new THREE.BufferGeometry();
        const wakeVertices = [];
        
        for (let i = 0; i < 100; i++) {
            wakeVertices.push(
                (Math.random() - 0.5) * 20,
                0,
                -Math.random() * 50
            );
        }
        
        wakeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wakeVertices, 3));
        
        const wakeMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0.3
        });
        
        const wake = new THREE.Points(wakeGeometry, wakeMaterial);
        wake.position.copy(ship.position);
        ship.parent.add(wake);
        
        ship.wake = wake; // Store reference for cleanup
    }
    
    startNeuralAnalysis() {
        // Continuous analysis of ship positions and behaviors
        setInterval(() => {
            this.analyzeShipFormations();
            this.predictShipMovements();
            this.updateThreatAssessment();
        }, 1000);
    }
    
    analyzeShipFormations() {
        const ships = Array.from(this.layers[this.currentLayer].ships.values());
        
        if (ships.length < 2) return;
        
        // Detect formation patterns
        const formations = this.detectFormations(ships);
        
        if (formations.length > 0) {
            this.orchestrator.emit('formation-detected', {
                layer: this.currentLayer,
                formations,
                recommendedAction: this.getFormationResponse(formations)
            });
        }
    }
    
    detectFormations(ships) {
        const formations = [];
        
        // Simple formation detection - check if ships are in line or group
        for (let i = 0; i < ships.length - 1; i++) {
            for (let j = i + 1; j < ships.length; j++) {
                const distance = ships[i].position.distanceTo(ships[j].position);
                
                if (distance < 100) { // Ships close together
                    formations.push({
                        type: 'group',
                        ships: [ships[i], ships[j]],
                        strength: this.calculateFormationStrength([ships[i], ships[j]])
                    });
                }
            }
        }
        
        return formations;
    }
    
    calculateFormationStrength(ships) {
        return ships.reduce((total, ship) => {
            return total + (ship.shipData?.stats?.firepower || 1);
        }, 0);
    }
    
    getFormationResponse(formations) {
        const totalStrength = formations.reduce((sum, f) => sum + f.strength, 0);
        
        if (totalStrength > 20) {
            return {
                threat: 'high',
                recommendation: 'Switch to tactical view for strategic overview',
                suggestedPerspective: 'tactical'
            };
        } else if (totalStrength > 10) {
            return {
                threat: 'medium', 
                recommendation: 'Maintain current perspective, prepare for engagement',
                suggestedPerspective: this.currentLayer
            };
        } else {
            return {
                threat: 'low',
                recommendation: 'Continue monitoring',
                suggestedPerspective: this.currentLayer
            };
        }
    }
    
    updateAISuggestions(layer) {
        const suggestions = {
            sonar: [
                'Track submarine movements',
                'Monitor underwater formations',
                'Analyze acoustic signatures'
            ],
            
            surface: [
                'Visual ship identification',
                'Track surface formations',
                'Monitor wake patterns'
            ],
            
            aerial: [
                'Survey fleet positions',
                'Identify strategic formations',
                'Plan tactical movements'
            ],
            
            satellite: [
                'Global fleet tracking',
                'Monitor shipping lanes',
                'Detect heat signatures'
            ]
        };
        
        // Send suggestions to AI copilot
        this.orchestrator.emit('ai-layer-suggestions', {
            layer,
            suggestions: suggestions[layer],
            detectionMethod: this.getDetectionMethod(layer)
        });
    }
    
    // API for ship management
    registerShip(ship, layer = this.currentLayer) {
        const shipId = ship.uuid || \`ship_\${Date.now()}_\${Math.random()}\`;
        this.layers[layer].ships.set(shipId, ship);
        
        // Store original properties for layer switching
        ship.originalColor = ship.material.color.getHex();
        ship.originalScale = ship.scale.clone();
        
        console.log(\`🚢 Ship registered in \${layer} layer\`);
        
        return shipId;
    }
    
    removeShip(shipId, layer = this.currentLayer) {
        return this.layers[layer].ships.delete(shipId);
    }
    
    getShipsInLayer(layer) {
        return Array.from(this.layers[layer].ships.values());
    }
    
    getAllShips() {
        const allShips = [];
        Object.values(this.layers).forEach(layer => {
            allShips.push(...Array.from(layer.ships.values()));
        });
        return allShips;
    }
}

export default SeaToSatelliteNeuralNetwork;`;
    }
    
    generateShipRektIntegration() {
        return `/**
 * SHIPREKT VISUAL INTEGRATION
 * Connects ShipRekt game logic to 3D ship models
 */

class ShipRektVisualIntegration {
    constructor(shipRektEngine, shipLoader, gameScene) {
        this.engine = shipRektEngine;
        this.loader = shipLoader;
        this.scene = gameScene;
        
        this.visualShips = new Map();
        this.battleEffects = new Map();
        
        this.init();
    }
    
    init() {
        console.log('⚔️ Initializing ShipRekt Visual Integration...');
        
        // Connect to ShipRekt events
        this.engine.on('game_started', (data) => this.handleGameStart(data));
        this.engine.on('player-update', (data) => this.handlePlayerUpdate(data));
        this.engine.on('projectile-fired', (data) => this.handleProjectileFired(data));
        this.engine.on('ship-destroyed', (data) => this.handleShipDestroyed(data));
        this.engine.on('market_event', (data) => this.handleMarketEvent(data));
        
        console.log('✅ ShipRekt visual integration ready');
    }
    
    async handleGameStart(data) {
        const { game_id, players, chart } = data;
        
        console.log(\`⚓ Spawning ships for game \${game_id}\`);
        
        // Spawn visual ships for each player
        for (const [playerId, player] of data.players || new Map()) {
            await this.spawnPlayerShip(playerId, player);
        }
        
        // Setup battle arena based on chart data
        this.setupBattleArena(chart);
    }
    
    async spawnPlayerShip(playerId, playerData) {
        // Determine ship type based on team and stats
        const shipType = this.determineShipType(playerData);
        
        // Load ship model
        const ship = await this.loader.loadShip(shipType, {
            team: playerData.team,
            position: playerData.position || this.getRandomSpawnPosition(),
            playerId: playerId,
            colors: this.getTeamColors(playerData.team)
        });
        
        if (ship) {
            // Store ship reference
            this.visualShips.set(playerId, ship);
            
            // Add to scene
            this.scene.add(ship);
            
            // Setup ship UI elements
            this.setupShipUI(ship, playerData);
            
            console.log(\`🚢 Spawned \${shipType} for player \${playerId} (team: \${playerData.team})\`);
        }
    }
    
    determineShipType(playerData) {
        // Map team and stats to ship types
        if (playerData.team === 'saveOrSink') {
            // Conservative team gets defensive ships
            return playerData.stats?.armor > 7 ? 'galleon' : 'frigate';
        } else if (playerData.team === 'dealOrDelete') {
            // Aggressive team gets fast attack ships
            return playerData.stats?.speed > 7 ? 'destroyer' : 'sloop';
        } else {
            // Neutral or special teams
            return 'yacht';
        }
    }
    
    getTeamColors(team) {
        const teamColors = {
            saveOrSink: {
                hull: 0x00ff88,    // Green
                sails: 0xffffff,   // White
                trim: 0x004400     // Dark green
            },
            dealOrDelete: {
                hull: 0xff6666,    // Red
                sails: 0x000000,   // Black  
                trim: 0x660000     // Dark red
            },
            neutral: {
                hull: 0xffff00,    // Yellow
                sails: 0xf5f5dc,   // Beige
                trim: 0x888800     // Dark yellow
            }
        };
        
        return teamColors[team] || teamColors.neutral;
    }
    
    getRandomSpawnPosition() {
        const radius = 200;
        const angle = Math.random() * Math.PI * 2;
        
        return {
            x: Math.cos(angle) * radius,
            y: 0,
            z: Math.sin(angle) * radius
        };
    }
    
    setupShipUI(ship, playerData) {
        // Create health bar above ship
        const healthBarGeometry = new THREE.PlaneGeometry(10, 1);
        const healthBarMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });
        
        const healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        healthBar.position.set(0, ship.shipData.size.height + 5, 0);
        healthBar.lookAt(0, healthBar.position.y, 1); // Face camera
        
        ship.add(healthBar);
        ship.healthBar = healthBar;
        
        // Create player name tag
        this.createNameTag(ship, playerData.name || playerData.playerId);
    }
    
    createNameTag(ship, name) {
        // Create text sprite for player name
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = 'white';
        context.font = 'bold 20px Arial';
        context.textAlign = 'center';
        context.fillText(name, canvas.width / 2, canvas.height / 2 + 7);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        sprite.position.set(0, ship.shipData.size.height + 10, 0);
        sprite.scale.set(20, 5, 1);
        
        ship.add(sprite);
        ship.nameTag = sprite;
    }
    
    handlePlayerUpdate(data) {
        const { playerId, player } = data;
        const ship = this.visualShips.get(playerId);
        
        if (ship) {
            // Update ship position
            ship.position.set(player.x, player.y, player.z);
            ship.rotation.y = player.rotation || 0;
            
            // Update health bar
            if (ship.healthBar) {
                const healthPercent = player.health / 100;
                ship.healthBar.scale.x = healthPercent;
                ship.healthBar.material.color.setHex(
                    healthPercent > 0.6 ? 0x00ff00 : 
                    healthPercent > 0.3 ? 0xffff00 : 0xff0000
                );
            }
            
            // Update ship animations based on movement
            if (player.velocity) {
                const speed = Math.sqrt(
                    player.velocity.x ** 2 + 
                    player.velocity.z ** 2
                );
                
                ship.animations.speedFactor = speed / 10;
            }
        }
    }
    
    handleProjectileFired(data) {
        const { projectile } = data;
        const sourceShip = this.visualShips.get(projectile.owner);
        
        if (sourceShip) {
            // Fire cannons on source ship
            sourceShip.applyCannons();
            
            // Create visual projectile
            this.createVisualProjectile(projectile, sourceShip);
        }
    }
    
    createVisualProjectile(projectileData, sourceShip) {
        // Create cannonball
        const ballGeometry = new THREE.SphereGeometry(0.5);
        const ballMaterial = new THREE.MeshStandardMaterial({
            color: 0x2f2f2f,
            metalness: 0.8,
            roughness: 0.3
        });
        
        const cannonball = new THREE.Mesh(ballGeometry, ballMaterial);
        cannonball.position.copy(sourceShip.position);
        
        // Create smoke trail
        const smokeGeometry = new THREE.SphereGeometry(0.3);
        const smokeMaterial = new THREE.MeshBasicMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.5
        });
        
        const smokeTrail = [];
        
        this.scene.add(cannonball);
        
        // Animate projectile
        const startTime = Date.now();
        const duration = 2000; // 2 seconds flight time
        
        const animateProjectile = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Update position based on projectile data
                cannonball.position.x += projectileData.velocity.x * 0.016;
                cannonball.position.y += projectileData.velocity.y * 0.016;
                cannonball.position.z += projectileData.velocity.z * 0.016;
                
                // Add gravity
                projectileData.velocity.y -= 9.8 * 0.016;
                
                // Create smoke particle
                if (elapsed % 100 < 16) { // Every 100ms
                    const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial.clone());
                    smoke.position.copy(cannonball.position);
                    smoke.scale.setScalar(Math.random() * 0.5 + 0.5);
                    
                    this.scene.add(smoke);
                    smokeTrail.push(smoke);
                    
                    // Fade out smoke
                    setTimeout(() => {
                        this.scene.remove(smoke);
                    }, 1000);
                }
                
                requestAnimationFrame(animateProjectile);
            } else {
                // Impact
                this.createExplosionEffect(cannonball.position);
                this.scene.remove(cannonball);
                
                // Clean up smoke trail
                smokeTrail.forEach(smoke => this.scene.remove(smoke));
            }
        };
        
        animateProjectile();
    }
    
    createExplosionEffect(position) {
        // Create explosion particles
        const particleCount = 50;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random() * 0.1, 1, 0.5),
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            // Random velocity
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                Math.random() * 15,
                (Math.random() - 0.5) * 20
            );
            
            particles.push(particle);
            this.scene.add(particle);
        }
        
        // Animate explosion
        const startTime = Date.now();
        const animateExplosion = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 1000; // 1 second explosion
            
            particles.forEach(particle => {
                particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
                particle.velocity.y -= 9.8 * 0.016; // Gravity
                particle.material.opacity = 1 - progress;
            });
            
            if (progress < 1) {
                requestAnimationFrame(animateExplosion);
            } else {
                // Clean up particles
                particles.forEach(particle => this.scene.remove(particle));
            }
        };
        
        animateExplosion();
    }
    
    handleShipDestroyed(data) {
        const { playerId } = data;
        const ship = this.visualShips.get(playerId);
        
        if (ship) {
            // Play destruction animation
            ship.sink();
            
            // Remove from tracking
            this.visualShips.delete(playerId);
            
            // Remove from scene after animation
            setTimeout(() => {
                this.scene.remove(ship);
            }, 5000);
        }
    }
    
    handleMarketEvent(data) {
        const { event, impact } = data;
        
        // Create visual effects for market events
        this.createMarketEventEffect(event, impact);
    }
    
    createMarketEventEffect(event, impact) {
        // Map market events to visual effects
        const effects = {
            volatility_spike: () => this.createLightningEffect(),
            storm_approaching: () => this.createStormEffect(),
            calm_seas: () => this.createCalmEffect(),
            perfect_setup: () => this.createGoldenEffect()
        };
        
        const effectFunction = effects[event];
        if (effectFunction) {
            effectFunction();
        }
    }
    
    createLightningEffect() {
        // Lightning flash effect
        const originalFog = this.scene.fog;
        this.scene.fog = new THREE.Fog(0x8888ff, 1, 2000);
        
        setTimeout(() => {
            this.scene.fog = originalFog;
        }, 200);
    }
    
    createStormEffect() {
        // Storm clouds and rain
        console.log('🌩️ Storm approaching - creating storm effects');
        
        // Add storm particles would go here
        // This would create rain particles and dark clouds
    }
    
    setupBattleArena(chartData) {
        // Create battle arena based on market chart
        const arenaSize = 500;
        
        // Ocean floor
        const oceanGeometry = new THREE.PlaneGeometry(arenaSize, arenaSize);
        const oceanMaterial = new THREE.MeshStandardMaterial({
            color: 0x006994,
            transparent: true,
            opacity: 0.8
        });
        
        const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
        ocean.rotation.x = -Math.PI / 2;
        ocean.position.y = -5;
        
        this.scene.add(ocean);
        
        // Create boundaries
        this.createArenaBoundaries(arenaSize);
    }
    
    createArenaBoundaries(size) {
        const boundaryMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.3
        });
        
        const boundaries = [
            { pos: [size/2, 0, 0], rot: [0, 0, Math.PI/2] },
            { pos: [-size/2, 0, 0], rot: [0, 0, Math.PI/2] },
            { pos: [0, 0, size/2], rot: [0, 0, 0] },
            { pos: [0, 0, -size/2], rot: [0, 0, 0] }
        ];
        
        boundaries.forEach(boundary => {
            const wallGeometry = new THREE.PlaneGeometry(size, 20);
            const wall = new THREE.Mesh(wallGeometry, boundaryMaterial);
            wall.position.set(...boundary.pos);
            wall.rotation.set(...boundary.rot);
            
            this.scene.add(wall);
        });
    }
    
    // API methods
    getVisualShip(playerId) {
        return this.visualShips.get(playerId);
    }
    
    getAllVisualShips() {
        return Array.from(this.visualShips.values());
    }
    
    updateAllShips(deltaTime) {
        this.visualShips.forEach(ship => {
            if (ship.update) {
                ship.update(deltaTime);
            }
        });
    }
}

export default ShipRektVisualIntegration;`;
    }
}

// Start the generator
if (require.main === module) {
    new Ship3DModelGenerator();
}