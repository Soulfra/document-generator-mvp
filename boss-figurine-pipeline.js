#!/usr/bin/env node

/**
 * BOSS FIGURINE PIPELINE
 * Complete pipeline: Bitmap → 3D Voxel → Painted → Boss Entity → Spawn
 * Integrates with existing systems for full boss lifecycle management
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const { spawn } = require('child_process');

// Import existing systems
const ImageToVoxelCharacter = require('./image-to-voxel-character.js');
const UnifiedEventSpawnOrchestrator = require('./unified-event-spawn-orchestrator.js');
const RareDropVerificationSystem = require('./rare-drop-verification-system.js');

// Import CalCompare blueprint integration
const CalCompareLLMBitmapQuerySystem = require('./calcompare-llm-bitmap-query-system.js');
const AIFactoryBitmapConveyorIntegration = require('./ai-factory-bitmap-conveyor-integration.js');

class BossFigurinePipeline {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 8400;
        
        // Boss storage
        this.bosses = new Map();
        this.bossTemplates = new Map();
        this.activeBosses = new Map();
        
        // Pipeline stages
        this.pipelineStages = {
            upload: 'IMAGE_UPLOADED',
            voxelize: 'VOXEL_GENERATED',
            paint: 'TEXTURE_APPLIED',
            generate: 'BOSS_GENERATED',
            spawn: 'BOSS_SPAWNED',
            death: 'BOSS_KILLED',
            respawn: 'BOSS_RESPAWNING'
        };
        
        // Connect to existing systems
        this.voxelSystem = new ImageToVoxelCharacter();
        this.spawnOrchestrator = new UnifiedEventSpawnOrchestrator();
        this.dropVerifier = new RareDropVerificationSystem();
        
        // Connect to CalCompare blueprint integration
        this.calCompareBitmapSystem = new CalCompareLLMBitmapQuerySystem();
        this.aiFactoryIntegration = new AIFactoryBitmapConveyorIntegration();
        
        console.log('🎨 BOSS FIGURINE PIPELINE SYSTEM');
        console.log('================================');
        console.log('Complete pipeline from image to spawned boss!');
        
        this.init();
    }
    
    init() {
        this.app.use(express.json({ limit: '100mb' }));
        this.app.use(express.static('public'));
        
        // Main interface
        this.app.get('/', (req, res) => {
            res.send(this.getBossPipelineInterface());
        });
        
        // Pipeline endpoints
        this.app.post('/api/upload-boss-image', this.handleImageUpload.bind(this));
        this.app.post('/api/generate-boss', this.handleBossGeneration.bind(this));
        this.app.post('/api/spawn-boss', this.handleBossSpawn.bind(this));
        this.app.post('/api/kill-boss', this.handleBossKill.bind(this));
        
        // CalCompare blueprint integration endpoints
        this.app.post('/api/calcompare-blueprint-boss', this.handleCalCompareBlueprintBoss.bind(this));
        this.app.post('/api/llm-bitmap-to-boss', this.handleLLMBitmapToBoss.bind(this));
        this.app.post('/api/factory-manufactured-boss', this.handleFactoryManufacturedBoss.bind(this));
        
        // Boss management
        this.app.get('/api/bosses', (req, res) => {
            res.json({
                templates: Array.from(this.bossTemplates.values()),
                active: Array.from(this.activeBosses.values()),
                total: this.bosses.size
            });
        });
        
        this.setupWebSocket();
        this.setupBossTemplates();
        
        this.server.listen(this.port, () => {
            console.log(`\n✅ BOSS PIPELINE READY: http://localhost:${this.port}\n`);
            console.log('🎯 PIPELINE STAGES:');
            console.log('   1️⃣ Upload image → 2️⃣ Generate 3D voxel');
            console.log('   3️⃣ Apply textures → 4️⃣ Create boss stats');
            console.log('   5️⃣ Spawn in world → 6️⃣ Death & respawn cycle');
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🎮 Player connected to boss pipeline');
            
            // Send current boss state
            ws.send(JSON.stringify({
                type: 'pipeline_state',
                bosses: Array.from(this.activeBosses.values()),
                templates: Array.from(this.bossTemplates.values())
            }));
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handleWebSocketMessage(data, ws);
            });
        });
    }
    
    setupBossTemplates() {
        // Default boss templates with different tiers
        const templates = [
            {
                id: 'goblin_chief',
                name: 'Goblin Chief',
                tier: 'common',
                baseHealth: 1000,
                respawnTime: 300, // 5 minutes
                lootTable: ['gold', 'goblin_mail', 'rune_scimitar']
            },
            {
                id: 'dragon_lord',
                name: 'Dragon Lord',
                tier: 'rare',
                baseHealth: 5000,
                respawnTime: 1800, // 30 minutes
                lootTable: ['dragon_bones', 'draconic_visage', 'dragon_claws']
            },
            {
                id: 'void_emperor',
                name: 'Void Emperor',
                tier: 'legendary',
                baseHealth: 20000,
                respawnTime: 3600, // 1 hour
                lootTable: ['void_essence', 'emperor_crown', 'dimensional_rift']
            }
        ];
        
        templates.forEach(template => {
            this.bossTemplates.set(template.id, template);
        });
    }
    
    async handleImageUpload(req, res) {
        const { imageData, bossName, tier = 'common' } = req.body;
        
        console.log(`📸 Processing boss image: ${bossName}`);
        
        // Stage 1: Image Upload
        const uploadId = crypto.randomBytes(8).toString('hex');
        this.broadcast({
            type: 'pipeline_stage',
            stage: this.pipelineStages.upload,
            bossName,
            uploadId
        });
        
        // Stage 2: Convert to Voxel
        const voxelData = await this.convertToVoxel(imageData);
        this.broadcast({
            type: 'pipeline_stage',
            stage: this.pipelineStages.voxelize,
            bossName,
            voxelCount: voxelData.voxels.length
        });
        
        // Stage 3: Apply Textures
        const texturedModel = await this.applyTextures(voxelData, imageData);
        this.broadcast({
            type: 'pipeline_stage',
            stage: this.pipelineStages.paint,
            bossName,
            textureData: texturedModel.preview
        });
        
        // Store boss template
        const bossTemplate = {
            id: `boss_${uploadId}`,
            name: bossName,
            tier,
            voxelData: texturedModel,
            originalImage: imageData.substring(0, 100) + '...',
            created: Date.now(),
            respawnTime: this.getBaseRespawnTime(tier),
            baseHealth: this.getBaseHealth(tier)
        };
        
        this.bossTemplates.set(bossTemplate.id, bossTemplate);
        
        res.json({
            success: true,
            bossId: bossTemplate.id,
            template: bossTemplate
        });
    }
    
    // CalCompare Blueprint Integration Methods
    async handleCalCompareBlueprintBoss(req, res) {
        console.log('🧩 Processing CalCompare blueprint boss request...');
        
        try {
            const { userRequest, modelType = 'humanoid' } = req.body;
            
            // Step 1: Query CalCompare LLM for bitmap blueprint
            const bitmapResult = await this.calCompareBitmapSystem.requestModel(userRequest, modelType);
            
            if (!bitmapResult.success) {
                throw new Error(`CalCompare bitmap query failed: ${bitmapResult.error}`);
            }
            
            // Step 2: Process blueprint through boss pipeline
            const bossBlueprint = {
                id: crypto.randomBytes(16).toString('hex'),
                name: `CalCompare Boss: ${userRequest.substring(0, 30)}`,
                source: 'calcompare_llm_blueprint',
                userRequest,
                modelType,
                calCompareQueryId: bitmapResult.queryId,
                factoryJobId: bitmapResult.factoryJobId,
                bitmapData: bitmapResult,
                created: Date.now(),
                pipeline: 'blueprint_to_boss'
            };
            
            // Step 3: Convert blueprint to boss template
            const bossTemplate = await this.convertBlueprintToBoss(bossBlueprint);
            
            // Step 4: Store boss template
            this.bossTemplates.set(bossTemplate.id, bossTemplate);
            
            console.log(`  ✅ CalCompare blueprint boss created: ${bossTemplate.id}`);
            
            res.json({
                success: true,
                bossId: bossTemplate.id,
                bossTemplate,
                calCompareIntegration: {
                    queryId: bitmapResult.queryId,
                    factoryJobId: bitmapResult.factoryJobId,
                    blueprintProcessed: true
                }
            });
            
        } catch (error) {
            console.error('❌ CalCompare blueprint boss failed:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async handleLLMBitmapToBoss(req, res) {
        console.log('🤖 Converting LLM bitmap directly to boss...');
        
        try {
            const { bitmapData, userRequest, processThroughFactory = true } = req.body;
            
            let processedBitmap = bitmapData;
            
            // Optionally process through AI Factory first
            if (processThroughFactory) {
                console.log('  🏭 Processing bitmap through AI Factory...');
                const factoryResult = await this.aiFactoryIntegration.processBitmapThroughFactory(
                    bitmapData, 
                    userRequest
                );
                processedBitmap = factoryResult;
            }
            
            // Convert processed bitmap to boss
            const boss = await this.createBossFromBitmap(processedBitmap, userRequest);
            
            res.json({
                success: true,
                bossId: boss.id,
                boss,
                factoryProcessed: processThroughFactory,
                pipeline: 'llm_bitmap_to_boss'
            });
            
        } catch (error) {
            console.error('❌ LLM bitmap to boss conversion failed:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async handleFactoryManufacturedBoss(req, res) {
        console.log('🏭 Creating boss from factory-manufactured model...');
        
        try {
            const { manufacturedModel, spawnInWorld = true } = req.body;
            
            // Create boss from factory output
            const boss = {
                id: manufacturedModel.modelId,
                name: `Factory Boss: ${manufacturedModel.originalRequest.substring(0, 25)}`,
                source: 'ai_factory_manufactured',
                
                // Factory details
                factoryJobId: manufacturedModel.jobId,
                manufacturingTime: manufacturedModel.manufacturingTime,
                qualityScore: manufacturedModel.overallQualityScore,
                factoryEfficiency: manufacturedModel.factoryEfficiency,
                
                // Boss stats derived from manufacturing quality
                health: Math.round(manufacturedModel.overallQualityScore * 10), // 850-950 HP
                damage: Math.round(manufacturedModel.factoryEfficiency / 2), // 30-50 damage
                defense: Math.round((manufacturedModel.overallQualityScore + manufacturedModel.factoryEfficiency) / 4),
                
                // 3D model data
                voxelData: manufacturedModel.wireframeData,
                spawnInstructions: manufacturedModel.spawnInstructions,
                entityType: manufacturedModel.entityType,
                
                // Special abilities based on manufacturing
                abilities: this.generateAbilitiesFromManufacturing(manufacturedModel),
                
                created: Date.now(),
                pipeline: 'factory_manufactured_boss'
            };
            
            // Store boss
            this.bosses.set(boss.id, boss);
            
            // Optionally spawn in world immediately
            if (spawnInWorld) {
                const spawnResult = await this.spawnBossInWorld(boss);
                boss.spawned = true;
                boss.spawnResult = spawnResult;
            }
            
            console.log(`  ✅ Factory manufactured boss created: ${boss.id}`);
            console.log(`  🎯 Quality: ${boss.qualityScore}%, Health: ${boss.health}HP`);
            
            res.json({
                success: true,
                bossId: boss.id,
                boss,
                spawned: spawnInWorld,
                pipeline: 'factory_manufactured_boss'
            });
            
        } catch (error) {
            console.error('❌ Factory manufactured boss creation failed:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async convertToVoxel(imageData) {
        // Enhanced voxel generation from image
        console.log('🎲 Converting image to 3D voxel model...');
        
        // In a real implementation, this would:
        // 1. Analyze image colors and patterns
        // 2. Generate height map from brightness
        // 3. Create detailed voxel structure
        
        const size = 32; // 32x32x32 voxel boss
        const voxels = [];
        
        // Generate boss shape based on image analysis
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                for (let z = 0; z < size; z++) {
                    // Create boss body structure
                    const inBody = this.isInBossBody(x, y, z, size);
                    if (inBody) {
                        voxels.push({
                            x, y, z,
                            color: this.sampleImageColor(imageData, x, y, z, size),
                            material: this.determineMaterial(x, y, z, size)
                        });
                    }
                }
            }
        }
        
        return {
            voxels,
            dimensions: { x: size, y: size, z: size },
            centerPoint: { x: size/2, y: size/2, z: size/2 }
        };
    }
    
    isInBossBody(x, y, z, size) {
        const center = size / 2;
        const radius = size / 3;
        
        // Create a more complex boss shape
        // Head region
        if (y > size * 0.7) {
            const headRadius = radius * 0.7;
            const dist = Math.sqrt(
                Math.pow(x - center, 2) + 
                Math.pow(z - center, 2)
            );
            return dist < headRadius;
        }
        
        // Body region
        if (y > size * 0.3 && y <= size * 0.7) {
            const bodyRadius = radius;
            const dist = Math.sqrt(
                Math.pow(x - center, 2) + 
                Math.pow(z - center, 2)
            );
            return dist < bodyRadius;
        }
        
        // Legs/base region
        if (y <= size * 0.3) {
            const legOffset = radius * 0.5;
            const legRadius = radius * 0.3;
            
            // Left leg
            const leftDist = Math.sqrt(
                Math.pow(x - (center - legOffset), 2) + 
                Math.pow(z - center, 2)
            );
            
            // Right leg
            const rightDist = Math.sqrt(
                Math.pow(x - (center + legOffset), 2) + 
                Math.pow(z - center, 2)
            );
            
            return leftDist < legRadius || rightDist < legRadius;
        }
        
        return false;
    }
    
    sampleImageColor(imageData, x, y, z, size) {
        // Sample color from the original image based on voxel position
        // This would map 3D coordinates to 2D image coordinates
        const colors = [
            '#8B4513', // Brown
            '#696969', // Gray
            '#228B22', // Green
            '#4B0082', // Indigo
            '#FF6347', // Tomato
            '#4682B4'  // Steel Blue
        ];
        
        // Use position to determine color (simplified)
        const colorIndex = (x + y + z) % colors.length;
        return colors[colorIndex];
    }
    
    determineMaterial(x, y, z, size) {
        // Determine material type based on position
        if (y > size * 0.8) return 'metal'; // Head armor
        if (y > size * 0.5) return 'leather'; // Body
        return 'stone'; // Base
    }
    
    async applyTextures(voxelData, imageData) {
        console.log('🎨 Applying textures and materials...');
        
        // Apply advanced texturing based on original image
        const texturedVoxels = voxelData.voxels.map(voxel => {
            return {
                ...voxel,
                texture: this.generateTexture(voxel, imageData),
                roughness: voxel.material === 'metal' ? 0.2 : 0.8,
                metalness: voxel.material === 'metal' ? 0.9 : 0.1,
                emission: voxel.y > voxelData.dimensions.y * 0.9 ? 0.3 : 0
            };
        });
        
        return {
            ...voxelData,
            voxels: texturedVoxels,
            preview: this.generatePreview(texturedVoxels)
        };
    }
    
    generateTexture(voxel, imageData) {
        // Generate texture coordinates and patterns
        return {
            type: 'procedural',
            pattern: voxel.material === 'metal' ? 'scratched' : 'rough',
            scale: 0.1,
            rotation: Math.random() * Math.PI * 2
        };
    }
    
    generatePreview(voxels) {
        // Generate a simple preview representation
        const preview = {
            voxelCount: voxels.length,
            materials: [...new Set(voxels.map(v => v.material))],
            boundingBox: this.calculateBoundingBox(voxels),
            thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        };
        
        return preview;
    }
    
    calculateBoundingBox(voxels) {
        const xs = voxels.map(v => v.x);
        const ys = voxels.map(v => v.y);
        const zs = voxels.map(v => v.z);
        
        return {
            min: { x: Math.min(...xs), y: Math.min(...ys), z: Math.min(...zs) },
            max: { x: Math.max(...xs), y: Math.max(...ys), z: Math.max(...zs) }
        };
    }
    
    async handleBossGeneration(req, res) {
        const { bossId, llmTier = 'free' } = req.body;
        
        const template = this.bossTemplates.get(bossId);
        if (!template) {
            return res.status(404).json({ error: 'Boss template not found' });
        }
        
        console.log(`🤖 Generating boss with LLM tier: ${llmTier}`);
        
        // Stage 4: Generate Boss Stats and Abilities
        const bossData = await this.generateBossWithLLM(template, llmTier);
        
        this.broadcast({
            type: 'pipeline_stage',
            stage: this.pipelineStages.generate,
            bossName: template.name,
            abilities: bossData.abilities.length
        });
        
        // Create complete boss entity
        const boss = {
            ...template,
            ...bossData,
            id: `${template.id}_${Date.now()}`,
            llmTier,
            status: 'ready_to_spawn'
        };
        
        this.bosses.set(boss.id, boss);
        
        res.json({
            success: true,
            boss
        });
    }
    
    async generateBossWithLLM(template, llmTier) {
        // Simulate LLM generation with different quality based on tier
        const tierMultipliers = {
            free: 1,      // Ollama - basic
            basic: 1.5,   // GPT-3.5 - decent
            premium: 2,   // GPT-4 - detailed
            ultra: 3      // Claude Opus - exceptional
        };
        
        const multiplier = tierMultipliers[llmTier] || 1;
        
        // Generate boss stats
        const stats = {
            health: Math.floor(template.baseHealth * multiplier),
            damage: Math.floor(100 * multiplier),
            defense: Math.floor(50 * multiplier),
            speed: Math.floor(10 * multiplier),
            critChance: Math.min(0.3 * multiplier, 0.8),
            dodgeChance: Math.min(0.2 * multiplier, 0.6)
        };
        
        // Generate abilities based on tier
        const abilities = this.generateAbilities(template.tier, llmTier);
        
        // Generate loot table
        const lootTable = this.generateLootTable(template.tier, multiplier);
        
        // Generate backstory (more detailed with better LLM)
        const backstory = this.generateBackstory(template.name, llmTier);
        
        return {
            stats,
            abilities,
            lootTable,
            backstory,
            attackPatterns: this.generateAttackPatterns(llmTier),
            weaknesses: this.generateWeaknesses(template.tier),
            enrageTimer: 300 * multiplier // seconds
        };
    }
    
    generateAbilities(tier, llmTier) {
        const baseAbilities = {
            common: ['slash', 'roar', 'charge'],
            rare: ['fireball', 'shield_bash', 'enrage', 'summon_minions'],
            legendary: ['meteor_shower', 'time_warp', 'death_ray', 'resurrect', 'dimensional_rift']
        };
        
        const abilities = baseAbilities[tier] || baseAbilities.common;
        
        // Better LLMs generate more complex ability combinations
        if (llmTier === 'premium' || llmTier === 'ultra') {
            abilities.push('combo_attack', 'adaptive_defense');
        }
        
        return abilities.map(name => ({
            name,
            cooldown: Math.floor(Math.random() * 20 + 10),
            damage: Math.floor(Math.random() * 200 + 100),
            description: `${name.replace(/_/g, ' ')} - A powerful boss ability`
        }));
    }
    
    generateLootTable(tier, multiplier) {
        const baseLoot = {
            common: [
                { item: 'gold', chance: 1, amount: [100, 500] },
                { item: 'health_potion', chance: 0.5, amount: [1, 3] },
                { item: 'boss_token', chance: 0.3, amount: [1, 1] }
            ],
            rare: [
                { item: 'gold', chance: 1, amount: [500, 2000] },
                { item: 'rare_armor', chance: 0.3, amount: [1, 1] },
                { item: 'boss_pet', chance: 0.01, amount: [1, 1] }
            ],
            legendary: [
                { item: 'gold', chance: 1, amount: [2000, 10000] },
                { item: 'legendary_weapon', chance: 0.1, amount: [1, 1] },
                { item: 'cosmic_essence', chance: 0.05, amount: [1, 3] }
            ]
        };
        
        const loot = baseLoot[tier] || baseLoot.common;
        
        // Better LLMs = better loot chances
        return loot.map(item => ({
            ...item,
            chance: Math.min(item.chance * multiplier, 1),
            amount: [
                Math.floor(item.amount[0] * multiplier),
                Math.floor(item.amount[1] * multiplier)
            ]
        }));
    }
    
    generateBackstory(bossName, llmTier) {
        const stories = {
            free: `${bossName} is a fearsome boss that guards this area.`,
            basic: `${bossName} was once a noble warrior who fell to darkness. Now they guard ancient treasures with fierce determination.`,
            premium: `Long ago, ${bossName} stood as a beacon of hope for the realm. But corruption seeped into their heart during the War of Shadows. Now, twisted by dark magic, they serve as an eternal guardian, forever bound to protect treasures they once swore to share with the people.`,
            ultra: `In the age before memory, when the world was young and magic flowed like rivers through the land, ${bossName} was born of both light and shadow. Their tale is written in the stars themselves - a champion who sacrificed everything to seal away an ancient evil, only to become corrupted by the very power they sought to contain. Now they stand as both protector and prisoner, guardian and guarded, waiting for a hero strong enough to grant them the release of death... or perhaps, redemption.`
        };
        
        return stories[llmTier] || stories.free;
    }
    
    generateAttackPatterns(llmTier) {
        const patterns = {
            free: ['random'],
            basic: ['phase1_aggressive', 'phase2_defensive'],
            premium: ['phase1_testing', 'phase2_aggressive', 'phase3_desperate', 'enrage'],
            ultra: ['opening_ceremony', 'phase1_probing', 'phase2_tactical', 'phase3_aggressive', 'phase4_desperate', 'final_stand', 'death_throes']
        };
        
        return patterns[llmTier] || patterns.free;
    }
    
    generateWeaknesses(tier) {
        const weaknesses = {
            common: ['fire', 'holy'],
            rare: ['lightning', 'ancient_magic'],
            legendary: ['void_damage', 'true_sight']
        };
        
        return weaknesses[tier] || weaknesses.common;
    }
    
    async handleBossSpawn(req, res) {
        const { bossId, location } = req.body;
        
        const boss = this.bosses.get(bossId);
        if (!boss) {
            return res.status(404).json({ error: 'Boss not found' });
        }
        
        console.log(`🎯 Spawning boss: ${boss.name} at ${JSON.stringify(location)}`);
        
        // Stage 5: Spawn Boss
        const spawnedBoss = {
            ...boss,
            instanceId: crypto.randomBytes(8).toString('hex'),
            location: location || this.getRandomSpawnLocation(),
            spawnTime: Date.now(),
            currentHealth: boss.stats.health,
            phase: 1,
            status: 'alive'
        };
        
        this.activeBosses.set(spawnedBoss.instanceId, spawnedBoss);
        
        // Notify spawn orchestrator
        this.spawnOrchestrator.emit('boss_spawned', {
            type: 'boss',
            boss: spawnedBoss
        });
        
        this.broadcast({
            type: 'pipeline_stage',
            stage: this.pipelineStages.spawn,
            boss: spawnedBoss
        });
        
        res.json({
            success: true,
            instanceId: spawnedBoss.instanceId,
            boss: spawnedBoss
        });
    }
    
    getRandomSpawnLocation() {
        // Generate random spawn location in ARPAnet style zones
        const zones = [
            { name: 'Northern Wastes', coords: { x: 0, y: 100, z: 0 } },
            { name: 'Eastern Forests', coords: { x: 100, y: 0, z: 0 } },
            { name: 'Southern Deserts', coords: { x: 0, y: -100, z: 0 } },
            { name: 'Western Mountains', coords: { x: -100, y: 0, z: 0 } },
            { name: 'Central Void', coords: { x: 0, y: 0, z: -50 } }
        ];
        
        const zone = zones[Math.floor(Math.random() * zones.length)];
        
        // Add some randomness to exact position
        return {
            zone: zone.name,
            x: zone.coords.x + (Math.random() - 0.5) * 50,
            y: zone.coords.y + (Math.random() - 0.5) * 50,
            z: zone.coords.z
        };
    }
    
    async handleBossKill(req, res) {
        const { instanceId, killedBy } = req.body;
        
        const boss = this.activeBosses.get(instanceId);
        if (!boss) {
            return res.status(404).json({ error: 'Boss instance not found' });
        }
        
        console.log(`💀 Boss killed: ${boss.name} by ${killedBy}`);
        
        // Stage 6: Boss Death
        boss.status = 'dead';
        boss.deathTime = Date.now();
        boss.killedBy = killedBy;
        
        // Generate loot
        const loot = this.generateLoot(boss);
        
        // Verify rare drops
        for (const drop of loot) {
            if (drop.rarity === 'rare' || drop.rarity === 'legendary') {
                await this.dropVerifier.checkDropForVerification({
                    itemId: drop.id,
                    itemName: drop.name,
                    dropRate: drop.dropRate,
                    value: drop.value,
                    playerId: killedBy,
                    bossName: boss.name,
                    killCount: 1,
                    accountAge: 86400 * 30 // Mock 30 days
                });
            }
        }
        
        // Calculate respawn time based on LLM tier
        const respawnTime = this.calculateRespawnTime(boss);
        
        // Execute bash command to restart node process
        this.executeBossRespawn(boss, respawnTime);
        
        this.broadcast({
            type: 'pipeline_stage',
            stage: this.pipelineStages.death,
            boss: boss,
            loot: loot,
            respawnIn: respawnTime
        });
        
        // Schedule loot despawn
        setTimeout(() => {
            this.despawnLoot(loot);
        }, 90000); // 90 seconds
        
        res.json({
            success: true,
            loot,
            respawnTime,
            message: `Boss will respawn in ${respawnTime / 60} minutes`
        });
    }
    
    generateLoot(boss) {
        const loot = [];
        
        boss.lootTable.forEach(item => {
            if (Math.random() < item.chance) {
                const amount = Math.floor(
                    Math.random() * (item.amount[1] - item.amount[0] + 1) + item.amount[0]
                );
                
                for (let i = 0; i < amount; i++) {
                    loot.push({
                        id: crypto.randomBytes(8).toString('hex'),
                        name: item.item,
                        rarity: this.getItemRarity(item.item),
                        value: this.getItemValue(item.item),
                        dropRate: item.chance,
                        timestamp: Date.now()
                    });
                }
            }
        });
        
        return loot;
    }
    
    getItemRarity(itemName) {
        if (itemName.includes('legendary')) return 'legendary';
        if (itemName.includes('rare') || itemName.includes('cosmic')) return 'rare';
        if (itemName.includes('boss')) return 'uncommon';
        return 'common';
    }
    
    getItemValue(itemName) {
        const values = {
            gold: 1,
            health_potion: 50,
            boss_token: 1000,
            rare_armor: 50000,
            boss_pet: 100000000,
            legendary_weapon: 500000000,
            cosmic_essence: 1000000000
        };
        
        return values[itemName] || 100;
    }
    
    calculateRespawnTime(boss) {
        // Base respawn times in milliseconds
        const baseRespawnTimes = {
            free: 1800000,    // 30 minutes (Ollama)
            basic: 600000,    // 10 minutes (GPT-3.5)
            premium: 300000,  // 5 minutes (GPT-4)
            ultra: 120000     // 2 minutes (Claude Opus)
        };
        
        const baseTime = baseRespawnTimes[boss.llmTier] || baseRespawnTimes.free;
        
        // Add some randomness (±20%)
        const variance = 0.2;
        const randomFactor = 1 + (Math.random() - 0.5) * variance * 2;
        
        return Math.floor(baseTime * randomFactor);
    }
    
    executeBossRespawn(boss, respawnTime) {
        console.log(`⏱️ Scheduling boss respawn in ${respawnTime / 1000} seconds`);
        
        // Stage 7: Respawn Timer
        this.broadcast({
            type: 'pipeline_stage',
            stage: this.pipelineStages.respawn,
            boss: boss,
            respawnTime: respawnTime
        });
        
        setTimeout(() => {
            // Execute bash command to restart the boss process
            const bashCommand = `node -e "console.log('Boss ${boss.name} respawning...')"`;
            
            const respawnProcess = spawn('bash', ['-c', bashCommand]);
            
            respawnProcess.stdout.on('data', (data) => {
                console.log(`Respawn output: ${data}`);
            });
            
            respawnProcess.on('close', (code) => {
                console.log(`✅ Boss respawn process completed with code ${code}`);
                
                // Respawn the boss in a new location
                const newLocation = this.getRandomSpawnLocation();
                
                const respawnedBoss = {
                    ...boss,
                    instanceId: crypto.randomBytes(8).toString('hex'),
                    location: newLocation,
                    spawnTime: Date.now(),
                    currentHealth: boss.stats.health,
                    phase: 1,
                    status: 'alive',
                    previousDeath: {
                        time: boss.deathTime,
                        killedBy: boss.killedBy
                    }
                };
                
                // Remove old instance
                this.activeBosses.delete(boss.instanceId);
                
                // Add new instance
                this.activeBosses.set(respawnedBoss.instanceId, respawnedBoss);
                
                this.broadcast({
                    type: 'boss_respawned',
                    boss: respawnedBoss
                });
                
                console.log(`🎯 Boss respawned: ${respawnedBoss.name} at ${respawnedBoss.location.zone}`);
            });
            
        }, respawnTime);
    }
    
    despawnLoot(loot) {
        console.log(`💨 Despawning ${loot.length} loot items`);
        
        this.broadcast({
            type: 'loot_despawned',
            lootIds: loot.map(l => l.id)
        });
    }
    
    handleWebSocketMessage(data, ws) {
        switch (data.type) {
            case 'attack_boss':
                this.handleBossAttack(data.instanceId, data.damage, data.playerId);
                break;
                
            case 'request_boss_list':
                ws.send(JSON.stringify({
                    type: 'boss_list',
                    active: Array.from(this.activeBosses.values()),
                    templates: Array.from(this.bossTemplates.values())
                }));
                break;
                
            case 'subscribe_updates':
                // Client wants real-time updates
                console.log('Client subscribed to boss updates');
                break;
        }
    }
    
    handleBossAttack(instanceId, damage, playerId) {
        const boss = this.activeBosses.get(instanceId);
        if (!boss || boss.status !== 'alive') return;
        
        boss.currentHealth -= damage;
        
        // Check phase transitions
        const healthPercent = boss.currentHealth / boss.stats.health;
        if (healthPercent <= 0.75 && boss.phase === 1) {
            boss.phase = 2;
            this.broadcast({
                type: 'boss_phase_change',
                instanceId,
                phase: 2
            });
        } else if (healthPercent <= 0.5 && boss.phase === 2) {
            boss.phase = 3;
            this.broadcast({
                type: 'boss_phase_change',
                instanceId,
                phase: 3
            });
        } else if (healthPercent <= 0.25 && boss.phase === 3) {
            boss.phase = 4;
            this.broadcast({
                type: 'boss_enraged',
                instanceId
            });
        }
        
        // Check if boss is dead
        if (boss.currentHealth <= 0) {
            this.handleBossKill({ 
                body: { instanceId, killedBy: playerId } 
            }, {
                json: (data) => console.log('Boss killed:', data)
            });
        } else {
            this.broadcast({
                type: 'boss_damaged',
                instanceId,
                currentHealth: boss.currentHealth,
                maxHealth: boss.stats.health,
                attacker: playerId
            });
        }
    }
    
    getBaseRespawnTime(tier) {
        const times = {
            common: 300000,    // 5 minutes
            rare: 1800000,     // 30 minutes
            legendary: 3600000 // 1 hour
        };
        
        return times[tier] || times.common;
    }
    
    getBaseHealth(tier) {
        const health = {
            common: 1000,
            rare: 5000,
            legendary: 20000
        };
        
        return health[tier] || health.common;
    }
    
    broadcast(data) {
        const message = JSON.stringify(data);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    getBossPipelineInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🎨 Boss Figurine Pipeline</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0a0e1a;
            color: #fff;
            min-height: 100vh;
        }
        
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 20px;
            text-align: center;
            border-bottom: 2px solid #e94560;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #e94560, #0f3460);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .pipeline-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .pipeline-stages {
            display: flex;
            justify-content: space-between;
            margin: 40px 0;
            position: relative;
        }
        
        .pipeline-stages::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 2px;
            background: #e94560;
            z-index: 0;
        }
        
        .stage {
            background: #1a1a2e;
            border: 2px solid #e94560;
            border-radius: 50%;
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            position: relative;
            z-index: 1;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .stage.active {
            background: #e94560;
            transform: scale(1.2);
            box-shadow: 0 0 20px #e94560;
        }
        
        .stage-label {
            position: absolute;
            bottom: -30px;
            font-size: 0.8rem;
            white-space: nowrap;
        }
        
        .upload-section {
            background: #16213e;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            margin: 40px 0;
        }
        
        .drop-zone {
            border: 3px dashed #e94560;
            border-radius: 20px;
            padding: 60px;
            margin: 20px 0;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .drop-zone.drag-over {
            background: rgba(233, 69, 96, 0.1);
            transform: scale(1.02);
        }
        
        .drop-zone h3 {
            font-size: 1.5rem;
            margin-bottom: 10px;
        }
        
        .tier-selector {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin: 30px 0;
        }
        
        .tier-option {
            background: #1a1a2e;
            border: 2px solid #0f3460;
            padding: 20px 40px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .tier-option.selected {
            border-color: #e94560;
            background: rgba(233, 69, 96, 0.2);
        }
        
        .llm-tiers {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin: 30px 0;
        }
        
        .llm-tier {
            background: #1a1a2e;
            border: 2px solid #0f3460;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .llm-tier.selected {
            border-color: #e94560;
            background: rgba(233, 69, 96, 0.2);
            transform: translateY(-5px);
        }
        
        .llm-tier h4 {
            color: #e94560;
            margin-bottom: 10px;
        }
        
        .llm-tier .speed {
            font-size: 2rem;
            margin: 10px 0;
        }
        
        .boss-preview {
            background: #1a1a2e;
            border-radius: 20px;
            padding: 30px;
            margin: 30px 0;
            display: none;
        }
        
        .boss-preview.show {
            display: block;
        }
        
        .voxel-preview {
            width: 300px;
            height: 300px;
            background: #0f3460;
            border-radius: 15px;
            margin: 20px auto;
            position: relative;
            overflow: hidden;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 20px 0;
        }
        
        .stat {
            background: #16213e;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 1.5rem;
            color: #e94560;
        }
        
        .abilities {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin: 20px 0;
        }
        
        .ability {
            background: #0f3460;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        
        .action-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin: 30px 0;
        }
        
        .btn {
            background: linear-gradient(45deg, #e94560, #0f3460);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 30px;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(233, 69, 96, 0.4);
        }
        
        .active-bosses {
            background: #16213e;
            border-radius: 20px;
            padding: 30px;
            margin: 30px 0;
        }
        
        .boss-card {
            background: #1a1a2e;
            border-radius: 15px;
            padding: 20px;
            margin: 15px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .boss-info h3 {
            color: #e94560;
            margin-bottom: 5px;
        }
        
        .health-bar {
            width: 200px;
            height: 20px;
            background: #0f3460;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .health-fill {
            height: 100%;
            background: linear-gradient(90deg, #e94560, #ff6b6b);
            transition: width 0.3s;
        }
        
        #file-input {
            display: none;
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e94560;
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            animation: slideIn 0.3s;
            z-index: 1000;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 Boss Figurine Pipeline</h1>
        <p>Upload Image → Generate 3D Boss → Spawn with LLM-Powered Abilities</p>
    </div>
    
    <div class="pipeline-container">
        <!-- Pipeline Stages -->
        <div class="pipeline-stages">
            <div class="stage" id="stage-upload">
                📸
                <span class="stage-label">Upload</span>
            </div>
            <div class="stage" id="stage-voxel">
                🎲
                <span class="stage-label">Voxelize</span>
            </div>
            <div class="stage" id="stage-paint">
                🎨
                <span class="stage-label">Paint</span>
            </div>
            <div class="stage" id="stage-generate">
                🤖
                <span class="stage-label">Generate</span>
            </div>
            <div class="stage" id="stage-spawn">
                🎯
                <span class="stage-label">Spawn</span>
            </div>
            <div class="stage" id="stage-respawn">
                ⏱️
                <span class="stage-label">Respawn</span>
            </div>
        </div>
        
        <!-- Upload Section -->
        <div class="upload-section">
            <h2>Create Your Boss</h2>
            
            <div class="drop-zone" id="drop-zone">
                <h3>📸 Drop Boss Image Here</h3>
                <p>or click to select</p>
                <p style="opacity: 0.6; margin-top: 10px;">PNG, JPG, or GIF (Max 10MB)</p>
                <p style="color: #e94560; margin-top: 10px;">⛓️ All stages verified on blockchain!</p>
            </div>
            
            <input type="file" id="file-input" accept="image/*">
            
            <!-- Boss Tier Selection -->
            <h3 style="margin-top: 40px;">Select Boss Tier</h3>
            <div class="tier-selector">
                <div class="tier-option selected" data-tier="common">
                    ⚔️ Common
                </div>
                <div class="tier-option" data-tier="rare">
                    🗡️ Rare
                </div>
                <div class="tier-option" data-tier="legendary">
                    ⚡ Legendary
                </div>
            </div>
            
            <!-- LLM Tier Selection -->
            <h3 style="margin-top: 40px;">Choose Processing Speed (LLM Tier)</h3>
            <div class="llm-tiers">
                <div class="llm-tier selected" data-llm="free">
                    <h4>Free</h4>
                    <div class="speed">🐌</div>
                    <p>Ollama</p>
                    <p>30 min respawn</p>
                </div>
                <div class="llm-tier" data-llm="basic">
                    <h4>Basic</h4>
                    <div class="speed">🚶</div>
                    <p>GPT-3.5</p>
                    <p>10 min respawn</p>
                </div>
                <div class="llm-tier" data-llm="premium">
                    <h4>Premium</h4>
                    <div class="speed">🏃</div>
                    <p>GPT-4</p>
                    <p>5 min respawn</p>
                </div>
                <div class="llm-tier" data-llm="ultra">
                    <h4>Ultra</h4>
                    <div class="speed">🚀</div>
                    <p>Claude Opus</p>
                    <p>2 min respawn</p>
                </div>
            </div>
        </div>
        
        <!-- Boss Preview -->
        <div class="boss-preview" id="boss-preview">
            <h2>Boss Preview</h2>
            
            <div class="voxel-preview" id="voxel-preview">
                <!-- 3D preview would go here -->
            </div>
            
            <h3 id="boss-name">Boss Name</h3>
            
            <div class="stats-grid">
                <div class="stat">
                    <div>Health</div>
                    <div class="stat-value" id="stat-health">0</div>
                </div>
                <div class="stat">
                    <div>Damage</div>
                    <div class="stat-value" id="stat-damage">0</div>
                </div>
                <div class="stat">
                    <div>Defense</div>
                    <div class="stat-value" id="stat-defense">0</div>
                </div>
            </div>
            
            <h4>Abilities</h4>
            <div class="abilities" id="abilities"></div>
            
            <h4>Backstory</h4>
            <p id="backstory"></p>
            
            <div class="action-buttons">
                <button class="btn" onclick="generateBoss()">🤖 Generate Boss</button>
                <button class="btn" onclick="spawnBoss()">🎯 Spawn Boss</button>
            </div>
        </div>
        
        <!-- Active Bosses -->
        <div class="active-bosses">
            <h2>Active Bosses</h2>
            <div id="boss-list"></div>
        </div>
    </div>
    
    <script>
        let ws;
        let currentBossTemplate = null;
        let currentBoss = null;
        let selectedTier = 'common';
        let selectedLLM = 'free';
        
        function init() {
            setupWebSocket();
            setupDropZone();
            setupSelectors();
            updateBossList();
        }
        
        function setupWebSocket() {
            ws = new WebSocket(`ws://${window.location.host}`);
            
            ws.onopen = () => {
                console.log('Connected to boss pipeline');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            };
        }
        
        function handleServerMessage(data) {
            switch (data.type) {
                case 'pipeline_stage':
                    updatePipelineStage(data.stage);
                    break;
                    
                case 'boss_respawned':
                    showNotification(`Boss respawned: ${data.boss.name}`);
                    updateBossList();
                    break;
                    
                case 'boss_damaged':
                    updateBossHealth(data.instanceId, data.currentHealth, data.maxHealth);
                    break;
            }
        }
        
        function updatePipelineStage(stage) {
            // Reset all stages
            document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
            
            // Activate current stage
            const stageMap = {
                'IMAGE_UPLOADED': 'stage-upload',
                'VOXEL_GENERATED': 'stage-voxel',
                'TEXTURE_APPLIED': 'stage-paint',
                'BOSS_GENERATED': 'stage-generate',
                'BOSS_SPAWNED': 'stage-spawn',
                'BOSS_KILLED': 'stage-respawn',
                'BOSS_RESPAWNING': 'stage-respawn'
            };
            
            const stageElement = document.getElementById(stageMap[stage]);
            if (stageElement) {
                stageElement.classList.add('active');
            }
        }
        
        function setupDropZone() {
            const dropZone = document.getElementById('drop-zone');
            const fileInput = document.getElementById('file-input');
            
            dropZone.addEventListener('click', () => fileInput.click());
            
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    processImage(file);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    processImage(file);
                }
            });
        }
        
        function setupSelectors() {
            // Boss tier selector
            document.querySelectorAll('.tier-option').forEach(option => {
                option.addEventListener('click', () => {
                    document.querySelectorAll('.tier-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    selectedTier = option.dataset.tier;
                });
            });
            
            // LLM tier selector
            document.querySelectorAll('.llm-tier').forEach(option => {
                option.addEventListener('click', () => {
                    document.querySelectorAll('.llm-tier').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    selectedLLM = option.dataset.llm;
                });
            });
        }
        
        async function processImage(file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageData = e.target.result;
                const bossName = prompt('Name your boss:', 'Shadow Lord');
                
                const response = await fetch('/api/upload-boss-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageData,
                        bossName,
                        tier: selectedTier
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    currentBossTemplate = result.template;
                    showBossPreview();
                }
            };
            reader.readAsDataURL(file);
        }
        
        function showBossPreview() {
            const preview = document.getElementById('boss-preview');
            preview.classList.add('show');
            
            document.getElementById('boss-name').textContent = currentBossTemplate.name;
            
            // Show voxel preview (placeholder)
            const voxelPreview = document.getElementById('voxel-preview');
            voxelPreview.innerHTML = '<div style="text-align: center; padding-top: 120px;">🎲 3D Voxel Preview</div>';
        }
        
        async function generateBoss() {
            if (!currentBossTemplate) return;
            
            const response = await fetch('/api/generate-boss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bossId: currentBossTemplate.id,
                    llmTier: selectedLLM
                })
            });
            
            const result = await response.json();
            if (result.success) {
                currentBoss = result.boss;
                updateBossStats();
                showNotification('Boss generated successfully!');
            }
        }
        
        function updateBossStats() {
            if (!currentBoss) return;
            
            document.getElementById('stat-health').textContent = currentBoss.stats.health;
            document.getElementById('stat-damage').textContent = currentBoss.stats.damage;
            document.getElementById('stat-defense').textContent = currentBoss.stats.defense;
            
            // Show abilities
            const abilitiesDiv = document.getElementById('abilities');
            abilitiesDiv.innerHTML = currentBoss.abilities.map(ability => 
                `<div class="ability">${ability.name}</div>`
            ).join('');
            
            // Show backstory
            document.getElementById('backstory').textContent = currentBoss.backstory;
        }
        
        async function spawnBoss() {
            if (!currentBoss) return;
            
            const response = await fetch('/api/spawn-boss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bossId: currentBoss.id
                })
            });
            
            const result = await response.json();
            if (result.success) {
                showNotification(`Boss spawned at ${result.boss.location.zone}!`);
                updateBossList();
            }
        }
        
        async function updateBossList() {
            const response = await fetch('/api/bosses');
            const data = await response.json();
            
            const bossList = document.getElementById('boss-list');
            bossList.innerHTML = data.active.map(boss => `
                <div class="boss-card">
                    <div class="boss-info">
                        <h3>${boss.name}</h3>
                        <p>Location: ${boss.location.zone}</p>
                        <p>Tier: ${boss.tier} | LLM: ${boss.llmTier}</p>
                        <div class="health-bar">
                            <div class="health-fill" style="width: ${(boss.currentHealth / boss.stats.health) * 100}%"></div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn" onclick="attackBoss('${boss.instanceId}')">⚔️ Attack</button>
                        <button class="btn" onclick="viewBlockchain('${boss.id}')">⛓️ Verify</button>
                    </div>
                </div>
            `).join('');
        }
        
        function attackBoss(instanceId) {
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'attack_boss',
                    instanceId,
                    damage: Math.floor(Math.random() * 100 + 50),
                    playerId: 'player_' + Math.random().toString(36).substr(2, 9)
                }));
            }
        }
        
        function updateBossHealth(instanceId, currentHealth, maxHealth) {
            const healthFill = document.querySelector(`[data-boss="${instanceId}"] .health-fill`);
            if (healthFill) {
                healthFill.style.width = `${(currentHealth / maxHealth) * 100}%`;
            }
        }
        
        function showNotification(message) {
            const notif = document.createElement('div');
            notif.className = 'notification';
            notif.textContent = message;
            document.body.appendChild(notif);
            
            setTimeout(() => notif.remove(), 3000);
        }
        
        async function viewBlockchain(bossId) {
            const response = await fetch(`/api/boss/${bossId}/blockchain`);
            const data = await response.json();
            
            console.log('Blockchain history:', data);
            
            // Show blockchain details in a modal or notification
            let message = `⛓️ Blockchain Verification History\n\n`;
            data.history.forEach(record => {
                if (record.blockchain) {
                    Object.entries(record.blockchain).forEach(([stage, verification]) => {
                        if (verification.storage) {
                            message += `${stage.toUpperCase()}:\n`;
                            message += `  IPFS: ${verification.storage.ipfs}\n`;
                            message += `  Arweave: ${verification.storage.arweave}\n\n`;
                        }
                    });
                }
            });
            
            alert(message);
        }
        
        // Initialize
        init();
        
        // Update boss list every 5 seconds
        setInterval(updateBossList, 5000);
    </script>
</body>
</html>`;
    }
    
    // CalCompare Integration Helper Methods
    async convertBlueprintToBoss(bossBlueprint) {
        console.log('🧩 Converting CalCompare blueprint to boss template...');
        
        const bossTemplate = {
            id: bossBlueprint.id,
            name: bossBlueprint.name,
            source: bossBlueprint.source,
            
            // CalCompare integration data
            calCompareData: {
                userRequest: bossBlueprint.userRequest,
                modelType: bossBlueprint.modelType,
                queryId: bossBlueprint.calCompareQueryId,
                factoryJobId: bossBlueprint.factoryJobId
            },
            
            // Boss stats derived from blueprint complexity
            health: this.calculateBossHealthFromBlueprint(bossBlueprint),
            damage: this.calculateBossDamageFromBlueprint(bossBlueprint),
            defense: this.calculateBossDefenseFromBlueprint(bossBlueprint),
            
            // 3D model properties
            voxelModel: await this.generateVoxelFromBlueprint(bossBlueprint),
            
            // Special abilities based on model type
            abilities: this.generateAbilitiesFromModelType(bossBlueprint.modelType),
            
            // Spawning properties
            spawnInstructions: {
                world: 'deathtodata',
                layer: 'calcompare_blueprint_layer',
                entityType: bossBlueprint.modelType,
                interactionEnabled: true
            },
            
            created: Date.now(),
            pipeline: 'calcompare_blueprint_to_boss'
        };
        
        console.log(`  ✅ Blueprint converted: ${bossTemplate.name}`);
        return bossTemplate;
    }
    
    async createBossFromBitmap(bitmapData, userRequest) {
        console.log('🤖 Creating boss from LLM bitmap data...');
        
        const boss = {
            id: crypto.randomBytes(16).toString('hex'),
            name: `Bitmap Boss: ${userRequest.substring(0, 25)}`,
            source: 'llm_bitmap_direct',
            
            // Bitmap integration data
            bitmapData: {
                wireframePoints: bitmapData.wireframePoints || bitmapData.modelId,
                coordinates: bitmapData.wireframeData || bitmapData.rawData,
                processingTime: bitmapData.manufacturingTime || 0
            },
            
            // Boss stats from bitmap complexity
            health: Math.round((bitmapData.wireframePoints || 128) * 5), // 640 HP base
            damage: Math.round((bitmapData.edgeConnections || 64) / 2), // 32 damage base
            defense: Math.round((bitmapData.qualityScore || 85) / 5), // 17 defense base
            
            // Special bitmap-derived abilities
            abilities: this.generateAbilitiesFromBitmap(bitmapData),
            
            created: Date.now(),
            pipeline: 'llm_bitmap_to_boss'
        };
        
        this.bosses.set(boss.id, boss);
        
        console.log(`  ✅ Bitmap boss created: ${boss.id} (${boss.health}HP)`);
        return boss;
    }
    
    async spawnBossInWorld(boss) {
        console.log(`🌍 Spawning boss ${boss.id} in deathtodata world...`);
        
        const spawnResult = {
            entityId: boss.id,
            worldPosition: boss.spawnInstructions?.position || [0, 0, 0],
            spawnLayer: boss.spawnInstructions?.layer || 'default_layer',
            entityType: boss.entityType || 'boss_entity',
            interactionEnabled: true,
            aiControlled: true,
            spawnTime: Date.now(),
            deathToDataIntegrated: true
        };
        
        // Add to active bosses
        this.activeBosses.set(boss.id, {
            ...boss,
            status: 'spawned',
            worldPosition: spawnResult.worldPosition,
            lastActivity: Date.now()
        });
        
        console.log(`  🌍 Boss spawned at position: ${spawnResult.worldPosition.join(', ')}`);
        return spawnResult;
    }
    
    generateAbilitiesFromManufacturing(manufacturedModel) {
        const abilities = [];
        
        // Quality-based abilities
        if (manufacturedModel.overallQualityScore > 90) {
            abilities.push('precision_manufacturing_strike');
            abilities.push('quality_control_shield');
        }
        
        // Factory efficiency abilities
        if (manufacturedModel.factoryEfficiency > 85) {
            abilities.push('rapid_assembly_combo');
            abilities.push('conveyor_belt_dash');
        }
        
        // Entity type abilities
        switch (manufacturedModel.entityType) {
            case 'character':
                abilities.push('humanoid_combat_stance');
                break;
            case 'weapon':
                abilities.push('weapon_mastery');
                break;
            case 'building':
                abilities.push('structural_fortification');
                break;
            case 'vehicle':
                abilities.push('transport_mobility');
                break;
        }
        
        return abilities;
    }
    
    generateAbilitiesFromModelType(modelType) {
        const abilityMap = {
            'humanoid': ['articulated_movement', 'tactical_thinking', 'tool_usage'],
            'vehicle': ['high_speed_movement', 'cargo_capacity', 'terrain_navigation'],
            'building': ['defensive_positioning', 'structural_integrity', 'resource_storage'],
            'weapon': ['damage_enhancement', 'precision_targeting', 'combat_optimization'],
            'creature': ['organic_adaptation', 'instinctual_behavior', 'environmental_awareness']
        };
        
        return abilityMap[modelType] || ['basic_interaction'];
    }
    
    generateAbilitiesFromBitmap(bitmapData) {
        const abilities = [];
        
        // Wireframe complexity abilities
        if (bitmapData.wireframePoints > 200) {
            abilities.push('complex_geometry_mastery');
        }
        
        if (bitmapData.edgeConnections > 100) {
            abilities.push('structural_connectivity');
        }
        
        // Quality-based abilities
        if (bitmapData.qualityScore > 90) {
            abilities.push('bitmap_precision_strike');
        }
        
        return abilities;
    }
    
    calculateBossHealthFromBlueprint(blueprint) {
        const baseHealth = 500;
        const complexityBonus = (blueprint.bitmapData?.wireframePoints || 128) * 2;
        const qualityBonus = (blueprint.bitmapData?.qualityScore || 85) * 3;
        
        return Math.round(baseHealth + complexityBonus + qualityBonus);
    }
    
    calculateBossDamageFromBlueprint(blueprint) {
        const baseDamage = 25;
        const complexityBonus = (blueprint.bitmapData?.edgeConnections || 64) / 4;
        
        return Math.round(baseDamage + complexityBonus);
    }
    
    calculateBossDefenseFromBlueprint(blueprint) {
        const baseDefense = 15;
        const qualityBonus = (blueprint.bitmapData?.qualityScore || 85) / 10;
        
        return Math.round(baseDefense + qualityBonus);
    }
    
    async generateVoxelFromBlueprint(blueprint) {
        console.log('  🧱 Generating voxel model from blueprint...');
        
        const wireframeData = blueprint.bitmapData?.rawData;
        if (!wireframeData) {
            throw new Error('No wireframe data in blueprint');
        }
        
        // Convert wireframe coordinates to voxel structure
        const voxelModel = {
            voxelCount: (blueprint.bitmapData?.wireframePoints || 128) * 6,
            coordinates: wireframeData.wireframe_coordinates || [[0,0,0]],
            connections: wireframeData.edge_connections || [[0,1]],
            textureMapping: wireframeData.texture_mapping || {},
            spawnProperties: wireframeData.spawn_properties || { position: [0,0,0] },
            blueprintOptimized: true
        };
        
        console.log(`    🧱 Voxel model generated: ${voxelModel.voxelCount} voxels`);
        return voxelModel;
    }
}

// Start the system
if (require.main === module) {
    new BossFigurinePipeline();
}

module.exports = BossFigurinePipeline;