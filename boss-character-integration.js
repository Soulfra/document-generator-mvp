#!/usr/bin/env node

/**
 * 🏆⚔️ BOSS CHARACTER INTEGRATION
 * 
 * Extends the existing GameCharacterIntegration system to support boss archetypes
 * Spawns bosses across all game worlds: Voxel, Economic Engine, AI Arena, Idle Games
 * Integrates with existing character, tycoon, and AI systems
 */

const GameCharacterIntegration = require('./GAME-CHARACTER-INTEGRATION.js');

class BossCharacterIntegration extends GameCharacterIntegration {
    constructor(gameType, gamePort) {
        super(gameType, gamePort);
        
        this.bossTypes = {
            combat: {
                name: 'Combat Boss',
                icon: '⚔️',
                color: '#FF4444',
                spawnable: ['voxel', 'arena', 'idle']
            },
            economic: {
                name: 'Economic Boss',
                icon: '💰',
                color: '#44AA44',
                spawnable: ['economic', 'tycoon', 'idle']
            },
            guardian: {
                name: 'Guardian Boss',
                icon: '🛡️',
                color: '#4444AA',
                spawnable: ['all']
            },
            legendary: {
                name: 'Legendary Boss',
                icon: '👑',
                color: '#AA44AA',
                spawnable: ['all'],
                special: true
            }
        };

        this.activeBosses = new Map();
        this.bossAI = new Map();
        
        console.log('🏆⚔️ BOSS CHARACTER INTEGRATION');
        console.log('===============================');
        console.log(`Game Type: ${gameType}`);
        console.log(`Available Boss Types: ${Object.keys(this.bossTypes).length}`);
        
        // Listen for boss-specific messages
        this.setupBossListeners();
        
        // Initialize boss spawning system
        this.initializeBossSpawning();
    }

    setupBossListeners() {
        // Override parent's message handler to include boss events
        const originalHandler = this.handleCharacterMessage.bind(this);
        
        this.handleCharacterMessage = (data) => {
            switch (data.type) {
                case 'boss_spawn_request':
                    this.handleBossSpawnRequest(data);
                    break;
                case 'boss_battle_start':
                    this.handleBossBattleStart(data);
                    break;
                case 'boss_defeat':
                    this.handleBossDefeat(data);
                    break;
                case 'boss_ai_update':
                    this.handleBossAIUpdate(data);
                    break;
                default:
                    // Let parent handle standard character messages
                    originalHandler(data);
            }
        };
    }

    initializeBossSpawning() {
        // Auto-spawn bosses based on game activity
        setInterval(() => {
            this.checkBossSpawnConditions();
        }, 30000); // Check every 30 seconds
        
        // Request any existing bosses for this game
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'request_active_bosses',
                game: this.gameType
            }));
        }
    }

    checkBossSpawnConditions() {
        // Spawn bosses based on player activity, time, and randomness
        const playerCount = this.getPlayerCount();
        const shouldSpawnBoss = Math.random() < this.calculateSpawnProbability(playerCount);
        
        if (shouldSpawnBoss && this.activeBosses.size < this.getMaxBossesForGame()) {
            this.spawnRandomBoss();
        }
    }

    calculateSpawnProbability(playerCount) {
        // More players = higher boss spawn chance
        const baseProbability = 0.1; // 10% base chance
        const playerMultiplier = playerCount * 0.05; // +5% per player
        const timeBonus = this.getTimeOfDayBonus(); // Peak hours bonus
        
        return Math.min(0.8, baseProbability + playerMultiplier + timeBonus);
    }

    getTimeOfDayBonus() {
        const hour = new Date().getHours();
        // Peak gaming hours (evening) get spawn bonus
        if (hour >= 18 && hour <= 23) {
            return 0.2;
        }
        return 0;
    }

    getMaxBossesForGame() {
        const maxBossesMap = {
            voxel: 3,
            economic: 2,
            arena: 1,
            tycoon: 4,
            idle: 5
        };
        return maxBossesMap[this.gameType] || 2;
    }

    getPlayerCount() {
        // Estimate player count based on WebSocket connections or game state
        return Math.floor(Math.random() * 10) + 1; // Mock for now
    }

    spawnRandomBoss() {
        const availableTypes = Object.entries(this.bossTypes).filter(([key, type]) => 
            type.spawnable.includes('all') || type.spawnable.includes(this.gameType)
        );
        
        if (availableTypes.length === 0) return;
        
        const [bossTypeKey, bossType] = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        
        const bossData = this.generateBossData(bossTypeKey, bossType);
        this.spawnBoss(bossData);
    }

    generateBossData(bossTypeKey, bossType) {
        const bossNames = {
            combat: ['Iron Destroyer', 'Shadow Warrior', 'Flame Guardian', 'Crystal Golem'],
            economic: ['Market Manipulator', 'Trade Baron', 'Coin Master', 'Resource Hoarder'],
            guardian: ['Ancient Protector', 'Void Sentinel', 'Time Keeper', 'Reality Warden'],
            legendary: ['The Architect', 'Code Breaker', 'System Override', 'Digital Phoenix']
        };
        
        const names = bossNames[bossTypeKey] || ['Unknown Boss'];
        const name = names[Math.floor(Math.random() * names.length)];
        
        return {
            id: `boss_${bossTypeKey}_${Date.now()}`,
            name,
            type: bossTypeKey,
            level: Math.floor(Math.random() * 50) + 10,
            health: this.calculateBossHealth(bossTypeKey),
            damage: this.calculateBossDamage(bossTypeKey),
            speed: this.calculateBossSpeed(bossTypeKey),
            specialAbility: this.generateSpecialAbility(bossTypeKey),
            appearance: {
                colors: {
                    primary: bossType.color,
                    secondary: this.generateSecondaryColor(bossType.color)
                },
                icon: bossType.icon
            },
            position: this.generateSpawnPosition(),
            gameType: this.gameType,
            spawnTime: Date.now(),
            creator: 'SYSTEM_SPAWNED',
            aiPersonality: this.generateBossAI(bossTypeKey)
        };
    }

    calculateBossHealth(bossType) {
        const healthMap = {
            combat: () => Math.floor(Math.random() * 1000) + 800,
            economic: () => Math.floor(Math.random() * 600) + 400,
            guardian: () => Math.floor(Math.random() * 1500) + 1200,
            legendary: () => Math.floor(Math.random() * 2000) + 1500
        };
        return healthMap[bossType]?.() || 1000;
    }

    calculateBossDamage(bossType) {
        const damageMap = {
            combat: () => Math.floor(Math.random() * 100) + 80,
            economic: () => Math.floor(Math.random() * 50) + 30,
            guardian: () => Math.floor(Math.random() * 120) + 100,
            legendary: () => Math.floor(Math.random() * 150) + 120
        };
        return damageMap[bossType]?.() || 60;
    }

    calculateBossSpeed(bossType) {
        const speedMap = {
            combat: () => Math.floor(Math.random() * 5) + 3,
            economic: () => Math.floor(Math.random() * 3) + 2,
            guardian: () => Math.floor(Math.random() * 4) + 2,
            legendary: () => Math.floor(Math.random() * 8) + 5
        };
        return speedMap[bossType]?.() || 3;
    }

    generateSpecialAbility(bossType) {
        const abilities = {
            combat: ['Berserker Rage', 'Shield Slam', 'Whirlwind Attack', 'Battle Cry'],
            economic: ['Market Crash', 'Gold Rush', 'Resource Drain', 'Trade Embargo'],
            guardian: ['Barrier Field', 'Time Slow', 'Healing Aura', 'Reflect Damage'],
            legendary: ['Reality Warp', 'System Hack', 'Code Injection', 'Digital Storm']
        };
        
        const abilityList = abilities[bossType] || ['Basic Attack'];
        return abilityList[Math.floor(Math.random() * abilityList.length)];
    }

    generateSecondaryColor(primaryColor) {
        // Generate complementary color
        const colors = ['#AA0000', '#00AA00', '#0000AA', '#AAAA00', '#AA00AA', '#00AAAA'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    generateSpawnPosition() {
        return {
            x: (Math.random() - 0.5) * 100,
            y: 10,
            z: (Math.random() - 0.5) * 100
        };
    }

    generateBossAI(bossType) {
        const aiPersonalities = {
            combat: {
                aggression: 0.8,
                intelligence: 0.6,
                tactics: ['rush_player', 'use_ability', 'guard_position'],
                decisionSpeed: 'fast'
            },
            economic: {
                aggression: 0.4,
                intelligence: 0.9,
                tactics: ['manipulate_market', 'drain_resources', 'calculate_advantage'],
                decisionSpeed: 'slow'
            },
            guardian: {
                aggression: 0.3,
                intelligence: 0.7,
                tactics: ['protect_area', 'heal_allies', 'barrier_defense'],
                decisionSpeed: 'medium'
            },
            legendary: {
                aggression: 0.9,
                intelligence: 0.95,
                tactics: ['adaptive_strategy', 'exploit_weaknesses', 'reality_manipulation'],
                decisionSpeed: 'variable'
            }
        };
        
        return aiPersonalities[bossType] || aiPersonalities.combat;
    }

    // Boss Spawning Implementation by Game Type
    spawnBoss(bossData) {
        console.log(`🏆 Spawning ${bossData.type} boss: ${bossData.name} in ${this.gameType}`);
        
        this.activeBosses.set(bossData.id, bossData);
        
        switch (this.gameType) {
            case 'voxel':
                this.spawnBossInVoxelWorld(bossData);
                break;
            case 'economic':
                this.spawnBossInEconomicEngine(bossData);
                break;
            case 'arena':
                this.spawnBossInAIArena(bossData);
                break;
            case 'tycoon':
                this.spawnBossInTycoonGame(bossData);
                break;
            case 'idle':
                this.spawnBossInIdleGame(bossData);
                break;
        }
        
        // Initialize boss AI
        this.initializeBossAI(bossData);
        
        // Broadcast boss spawn event
        this.broadcastBossEvent('boss_spawned', bossData);
    }

    // Voxel World Boss Spawning
    spawnBossInVoxelWorld(boss) {
        if (typeof THREE === 'undefined') {
            console.log('⏳ Waiting for THREE.js to load for boss spawn...');
            setTimeout(() => this.spawnBossInVoxelWorld(boss), 1000);
            return;
        }

        const bossGroup = new THREE.Group();
        
        // Create boss based on type
        let bossGeometry, bossMaterial;
        
        switch (boss.type) {
            case 'combat':
                // Large intimidating warrior
                bossGeometry = new THREE.BoxGeometry(4, 6, 3);
                bossMaterial = new THREE.MeshPhongMaterial({
                    color: boss.appearance.colors.primary,
                    emissive: '#330000',
                    emissiveIntensity: 0.3
                });
                break;
                
            case 'economic':
                // Sophisticated merchant-like appearance  
                bossGeometry = new THREE.CylinderGeometry(2, 3, 5, 8);
                bossMaterial = new THREE.MeshPhongMaterial({
                    color: boss.appearance.colors.primary,
                    emissive: '#003300',
                    emissiveIntensity: 0.2,
                    shininess: 100
                });
                break;
                
            case 'guardian':
                // Protective crystalline structure
                bossGeometry = new THREE.OctahedronGeometry(3);
                bossMaterial = new THREE.MeshPhongMaterial({
                    color: boss.appearance.colors.primary,
                    emissive: '#000033',
                    emissiveIntensity: 0.4,
                    transparent: true,
                    opacity: 0.8
                });
                break;
                
            default:
                // Legendary - unique morphing geometry
                bossGeometry = new THREE.IcosahedronGeometry(4);
                bossMaterial = new THREE.MeshPhongMaterial({
                    color: boss.appearance.colors.primary,
                    emissive: '#330033',
                    emissiveIntensity: 0.5
                });
        }
        
        const bossMesh = new THREE.Mesh(bossGeometry, bossMaterial);
        bossMesh.position.copy(boss.position);
        bossMesh.castShadow = true;
        bossMesh.receiveShadow = true;
        bossGroup.add(bossMesh);
        
        // Boss name tag with type icon
        const nameText = `${boss.appearance.icon} ${boss.name}`;
        const nameTexture = this.createTextTexture(nameText);
        const nameGeometry = new THREE.PlaneGeometry(6, 1.5);
        const nameMaterial = new THREE.MeshBasicMaterial({
            map: nameTexture,
            transparent: true
        });
        const nameTag = new THREE.Mesh(nameGeometry, nameMaterial);
        nameTag.position.set(0, 4, 0);
        bossGroup.add(nameTag);
        
        // Boss health bar
        const healthBarBg = new THREE.PlaneGeometry(4, 0.5);
        const healthBarBgMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const healthBarBgMesh = new THREE.Mesh(healthBarBg, healthBarBgMat);
        healthBarBgMesh.position.set(0, 5.5, 0);
        bossGroup.add(healthBarBgMesh);
        
        const healthBar = new THREE.PlaneGeometry(4, 0.5);
        const healthBarMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const healthBarMesh = new THREE.Mesh(healthBar, healthBarMat);
        healthBarMesh.position.set(0, 5.5, 0.01);
        bossGroup.add(healthBarMesh);
        
        // Store references for updates
        boss.mesh = bossGroup;
        boss.healthBar = healthBarMesh;
        boss.maxHealth = boss.health;
        
        // Add to scene
        if (typeof scene !== 'undefined' && scene) {
            scene.add(bossGroup);
            console.log(`✅ ${boss.name} spawned in Voxel World at`, boss.position);
        }
        
        // Boss movement and behavior
        this.startBossMovement(boss);
    }

    // Economic Engine Boss Spawning (Babylon.js)
    spawnBossInEconomicEngine(boss) {
        if (typeof BABYLON === 'undefined') {
            console.log('⏳ Waiting for Babylon.js to load for boss spawn...');
            setTimeout(() => this.spawnBossInEconomicEngine(boss), 1000);
            return;
        }

        let bossMesh;
        
        switch (boss.type) {
            case 'economic':
                // Economic boss as a golden pyramid (wealth symbol)
                bossMesh = BABYLON.MeshBuilder.CreateBox("economicBoss", {
                    width: 6, height: 6, depth: 6
                }, scene);
                
                const goldMaterial = new BABYLON.PBRMaterial("goldMaterial", scene);
                goldMaterial.baseColor = BABYLON.Color3.FromHexString("#FFD700");
                goldMaterial.metallicFactor = 1.0;
                goldMaterial.roughnessFactor = 0.2;
                bossMesh.material = goldMaterial;
                break;
                
            default:
                // Other boss types as large spheres
                bossMesh = BABYLON.MeshBuilder.CreateSphere("boss", {
                    diameter: 8, segments: 32
                }, scene);
                
                const bossMaterial = new BABYLON.PBRMaterial("bossMaterial", scene);
                bossMaterial.baseColor = BABYLON.Color3.FromHexString(boss.appearance.colors.primary);
                bossMaterial.emissiveColor = BABYLON.Color3.FromHexString(boss.appearance.colors.primary).scale(0.3);
                bossMaterial.metallicFactor = 0.8;
                bossMaterial.roughnessFactor = 0.3;
                bossMesh.material = bossMaterial;
        }
        
        bossMesh.position = new BABYLON.Vector3(
            boss.position.x,
            boss.position.y + 4,
            boss.position.z
        );
        
        // Boss particle effects
        const particleSystem = new BABYLON.ParticleSystem("bossParticles", 200, scene);
        particleSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", scene);
        particleSystem.emitter = bossMesh;
        
        particleSystem.color1 = BABYLON.Color4.FromHexString(boss.appearance.colors.primary + "FF");
        particleSystem.color2 = BABYLON.Color4.FromHexString(boss.appearance.colors.secondary + "FF");
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
        
        particleSystem.minSize = 0.2;
        particleSystem.maxSize = 0.8;
        particleSystem.minLifeTime = 1.0;
        particleSystem.maxLifeTime = 3.0;
        particleSystem.emitRate = 50;
        
        particleSystem.start();
        
        boss.mesh = bossMesh;
        boss.particles = particleSystem;
        
        console.log(`✅ ${boss.name} spawned in Economic Engine`);
        
        // Economic boss behavior (market manipulation)
        if (boss.type === 'economic') {
            this.startEconomicBossBehavior(boss);
        }
    }

    // AI Arena Boss Registration
    spawnBossInAIArena(boss) {
        console.log(`🤖 Registering boss "${boss.name}" in AI Arena`);
        
        const arenaBossData = {
            name: boss.name,
            ownerId: 'boss_system',
            type: 'boss',
            fightingStyle: this.mapBossToFightingStyle(boss),
            powerLevel: boss.level * 20 + boss.health / 10,
            specialAbilities: [boss.specialAbility, 'boss_rage', 'area_damage'],
            stats: {
                attack: boss.damage,
                defense: boss.health / 10,
                speed: boss.speed * 10,
                intelligence: boss.aiPersonality.intelligence * 100,
                creativity: Math.floor(Math.random() * 100) + 50
            },
            appearance: boss.appearance,
            bossType: boss.type,
            aiPersonality: boss.aiPersonality
        };
        
        // Register with AI Arena
        if (typeof fetch !== 'undefined') {
            fetch('http://localhost:3001/api/arena/create-boss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(arenaBossData)
            }).then(response => response.json())
              .then(result => {
                  if (result.success) {
                      console.log(`✅ Boss "${boss.name}" registered in AI Arena:`, result.boss.id);
                      boss.arenaId = result.boss.id;
                  }
              }).catch(error => {
                  console.error('❌ Failed to register arena boss:', error);
              });
        }
    }

    // Tycoon Game Integration
    spawnBossInTycoonGame(boss) {
        console.log(`🏪 Spawning tycoon boss: ${boss.name}`);
        
        // Boss appears as a challenging customer or competitor in tycoon rooms
        const tycoonRole = this.determineTycoonRole(boss);
        
        // Send to tycoon game service
        if (typeof fetch !== 'undefined') {
            fetch('http://localhost:8888/api/tycoon/spawn-boss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bossId: boss.id,
                    name: boss.name,
                    role: tycoonRole,
                    difficulty: this.calculateTycoonDifficulty(boss),
                    rewards: this.generateTycoonRewards(boss),
                    appearance: boss.appearance
                })
            }).then(response => response.json())
              .then(result => {
                  if (result.success) {
                      console.log(`✅ Tycoon boss spawned in room:`, result.room);
                  }
              }).catch(error => {
                  console.error('❌ Failed to spawn tycoon boss:', error);
              });
        }
    }

    // Idle Game Integration
    spawnBossInIdleGame(boss) {
        console.log(`⏱️ Adding idle boss: ${boss.name}`);
        
        // Bosses in idle games are ongoing challenges that players can battle automatically
        const idleBossData = {
            id: boss.id,
            name: boss.name,
            type: boss.type,
            health: boss.health,
            damage: boss.damage,
            rewards: {
                xp: boss.level * 10,
                gold: boss.level * 50,
                items: this.generateBossDrops(boss)
            },
            defeatable: true,
            respawnTime: 3600000, // 1 hour
            appearance: boss.appearance
        };
        
        // Add to idle game boss roster
        if (typeof fetch !== 'undefined') {
            fetch('http://localhost:3002/api/idle/add-boss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(idleBossData)
            }).then(response => response.json())
              .then(result => {
                  if (result.success) {
                      console.log(`✅ Idle boss added:`, result.bossId);
                  }
              }).catch(error => {
                  console.error('❌ Failed to add idle boss:', error);
              });
        }
    }

    // Boss AI System
    initializeBossAI(boss) {
        const aiSystem = {
            boss,
            state: 'idle',
            lastAction: Date.now(),
            target: null,
            actionQueue: [],
            cooldowns: new Map()
        };
        
        this.bossAI.set(boss.id, aiSystem);
        
        // Start AI loop
        const aiLoop = setInterval(() => {
            this.updateBossAI(boss.id);
        }, 1000); // Update every second
        
        aiSystem.loopId = aiLoop;
        
        console.log(`🧠 AI initialized for boss: ${boss.name}`);
    }

    updateBossAI(bossId) {
        const aiSystem = this.bossAI.get(bossId);
        if (!aiSystem) return;
        
        const boss = aiSystem.boss;
        const timeSinceLastAction = Date.now() - aiSystem.lastAction;
        
        // AI decision making based on personality
        if (timeSinceLastAction > this.getAIDecisionDelay(boss.aiPersonality)) {
            const action = this.chooseBossAction(aiSystem);
            if (action) {
                this.executeBossAction(aiSystem, action);
                aiSystem.lastAction = Date.now();
            }
        }
    }

    chooseBossAction(aiSystem) {
        const boss = aiSystem.boss;
        const personality = boss.aiPersonality;
        
        // Choose action based on AI personality and current state
        const availableActions = personality.tactics.filter(tactic => 
            !aiSystem.cooldowns.has(tactic) || 
            Date.now() > aiSystem.cooldowns.get(tactic)
        );
        
        if (availableActions.length === 0) return null;
        
        // Weighted random selection based on intelligence
        const weights = availableActions.map(action => this.getActionWeight(action, boss));
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        const random = Math.random() * totalWeight;
        
        let currentWeight = 0;
        for (let i = 0; i < availableActions.length; i++) {
            currentWeight += weights[i];
            if (random <= currentWeight) {
                return availableActions[i];
            }
        }
        
        return availableActions[0]; // Fallback
    }

    getActionWeight(action, boss) {
        const baseWeights = {
            rush_player: boss.aiPersonality.aggression * 100,
            use_ability: boss.aiPersonality.intelligence * 80,
            guard_position: (1 - boss.aiPersonality.aggression) * 60,
            manipulate_market: boss.aiPersonality.intelligence * 90,
            drain_resources: boss.aiPersonality.intelligence * 70,
            calculate_advantage: boss.aiPersonality.intelligence * 100,
            protect_area: (1 - boss.aiPersonality.aggression) * 80,
            heal_allies: (1 - boss.aiPersonality.aggression) * 70,
            barrier_defense: (1 - boss.aiPersonality.aggression) * 90,
            adaptive_strategy: boss.aiPersonality.intelligence * 110,
            exploit_weaknesses: boss.aiPersonality.intelligence * 120,
            reality_manipulation: boss.aiPersonality.intelligence * 130
        };
        
        return baseWeights[action] || 50;
    }

    executeBossAction(aiSystem, action) {
        const boss = aiSystem.boss;
        console.log(`🧠 ${boss.name} executes: ${action}`);
        
        // Set cooldown
        const cooldownTime = this.getActionCooldown(action);
        aiSystem.cooldowns.set(action, Date.now() + cooldownTime);
        
        // Execute action based on game type
        switch (this.gameType) {
            case 'voxel':
                this.executeVoxelBossAction(boss, action);
                break;
            case 'economic':
                this.executeEconomicBossAction(boss, action);
                break;
            default:
                this.executeGenericBossAction(boss, action);
        }
        
        // Broadcast action to other systems
        this.broadcastBossEvent('boss_action', {
            bossId: boss.id,
            action,
            timestamp: Date.now()
        });
    }

    executeVoxelBossAction(boss, action) {
        if (!boss.mesh) return;
        
        switch (action) {
            case 'rush_player':
                // Move towards nearest player (simplified)
                this.moveBossTowardsPlayer(boss);
                break;
            case 'use_ability':
                this.triggerBossAbility(boss);
                break;
            case 'guard_position':
                this.setBossGuardStance(boss);
                break;
        }
    }

    moveBossTowardsPlayer(boss) {
        // Simple movement towards center (where players likely are)
        const targetPos = { x: 0, y: boss.position.y, z: 0 };
        const speed = boss.speed * 0.5;
        
        const dx = targetPos.x - boss.position.x;
        const dz = targetPos.z - boss.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance > 1) {
            boss.position.x += (dx / distance) * speed;
            boss.position.z += (dz / distance) * speed;
            
            if (boss.mesh) {
                boss.mesh.position.set(boss.position.x, boss.position.y, boss.position.z);
            }
        }
    }

    triggerBossAbility(boss) {
        console.log(`✨ ${boss.name} uses ${boss.specialAbility}!`);
        
        // Visual effect for ability
        if (boss.mesh && typeof THREE !== 'undefined') {
            // Temporary scale increase for ability effect
            const originalScale = boss.mesh.scale.clone();
            boss.mesh.scale.multiplyScalar(1.5);
            
            setTimeout(() => {
                boss.mesh.scale.copy(originalScale);
            }, 500);
        }
        
        // Broadcast ability use
        this.broadcastBossEvent('boss_ability_used', {
            bossId: boss.id,
            ability: boss.specialAbility,
            timestamp: Date.now()
        });
    }

    // Event Broadcasting
    broadcastBossEvent(eventType, data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: eventType,
                data,
                gameType: this.gameType,
                timestamp: Date.now()
            }));
        }
    }

    // Event Handlers
    handleBossSpawnRequest(data) {
        if (data.bossData) {
            this.spawnBoss(data.bossData);
        }
    }

    handleBossBattleStart(data) {
        const boss = this.activeBosses.get(data.bossId);
        if (boss) {
            console.log(`⚔️ Boss battle started: ${boss.name}`);
            
            // Switch boss AI to combat mode
            const aiSystem = this.bossAI.get(boss.id);
            if (aiSystem) {
                aiSystem.state = 'combat';
                aiSystem.boss.aiPersonality.aggression *= 1.5; // More aggressive in combat
            }
        }
    }

    handleBossDefeat(data) {
        const boss = this.activeBosses.get(data.bossId);
        if (boss) {
            console.log(`💀 Boss defeated: ${boss.name}`);
            
            // Clean up boss
            this.removeBoss(boss.id);
            
            // Schedule respawn for some boss types
            if (boss.type !== 'legendary') {
                setTimeout(() => {
                    this.spawnRandomBoss();
                }, 300000); // 5 minutes
            }
        }
    }

    removeBoss(bossId) {
        const boss = this.activeBosses.get(bossId);
        if (!boss) return;
        
        // Remove from game world
        if (boss.mesh) {
            if (this.gameType === 'voxel' && typeof scene !== 'undefined') {
                scene.remove(boss.mesh);
            } else if (this.gameType === 'economic' && boss.mesh.dispose) {
                boss.mesh.dispose();
                if (boss.particles) boss.particles.dispose();
            }
        }
        
        // Clean up AI
        const aiSystem = this.bossAI.get(bossId);
        if (aiSystem && aiSystem.loopId) {
            clearInterval(aiSystem.loopId);
        }
        
        this.activeBosses.delete(bossId);
        this.bossAI.delete(bossId);
        
        console.log(`🧹 Boss cleaned up: ${boss.name}`);
    }

    // Utility Methods
    mapBossToFightingStyle(boss) {
        const styleMap = {
            combat: 'berserker_assault',
            economic: 'calculated_strikes',
            guardian: 'defensive_mastery',
            legendary: 'chaos_embodiment'
        };
        return styleMap[boss.type] || 'adaptive_combat';
    }

    determineTycoonRole(boss) {
        const roles = {
            combat: 'aggressive_competitor',
            economic: 'market_manipulator',
            guardian: 'regulatory_authority',
            legendary: 'industry_disruptor'
        };
        return roles[boss.type] || 'special_customer';
    }

    calculateTycoonDifficulty(boss) {
        return Math.min(10, Math.floor(boss.level / 5) + 1);
    }

    generateTycoonRewards(boss) {
        return {
            money: boss.level * 100,
            reputation: boss.level * 5,
            special_items: boss.type === 'legendary' ? ['legendary_blueprint'] : []
        };
    }

    generateBossDrops(boss) {
        const drops = [];
        
        if (boss.type === 'legendary') {
            drops.push('legendary_essence', 'cosmic_crystal');
        } else {
            drops.push(`${boss.type}_essence`, 'boss_token');
        }
        
        return drops;
    }

    getAIDecisionDelay(personality) {
        const speedMap = {
            fast: 1000,
            medium: 2000,
            slow: 3000,
            variable: Math.random() * 3000 + 500
        };
        return speedMap[personality.decisionSpeed] || 2000;
    }

    getActionCooldown(action) {
        const cooldowns = {
            rush_player: 3000,
            use_ability: 10000,
            guard_position: 5000,
            manipulate_market: 15000,
            drain_resources: 8000,
            calculate_advantage: 5000,
            protect_area: 12000,
            heal_allies: 20000,
            barrier_defense: 15000,
            adaptive_strategy: 8000,
            exploit_weaknesses: 6000,
            reality_manipulation: 25000
        };
        return cooldowns[action] || 5000;
    }

    // Boss Movement System
    startBossMovement(boss) {
        if (!boss.mesh) return;
        
        const moveLoop = setInterval(() => {
            if (!this.activeBosses.has(boss.id)) {
                clearInterval(moveLoop);
                return;
            }
            
            // Simple patrol movement
            const time = Date.now() * 0.001;
            const radius = 20;
            
            boss.position.x = Math.cos(time * boss.speed * 0.1) * radius;
            boss.position.z = Math.sin(time * boss.speed * 0.1) * radius;
            
            if (boss.mesh) {
                boss.mesh.position.set(boss.position.x, boss.position.y, boss.position.z);
                
                // Update name tag to face camera
                if (boss.mesh.children[1] && typeof camera !== 'undefined') {
                    boss.mesh.children[1].lookAt(camera.position);
                }
            }
        }, 100);
        
        boss.moveLoopId = moveLoop;
    }

    // Economic Boss Behavior
    startEconomicBossBehavior(boss) {
        if (boss.type !== 'economic') return;
        
        const economicLoop = setInterval(() => {
            if (!this.activeBosses.has(boss.id)) {
                clearInterval(economicLoop);
                return;
            }
            
            // Economic manipulation effects
            this.manipulateMarket(boss);
        }, 10000); // Every 10 seconds
        
        boss.economicLoopId = economicLoop;
    }

    manipulateMarket(boss) {
        console.log(`💰 ${boss.name} manipulates the market!`);
        
        // Send market manipulation event
        this.broadcastBossEvent('market_manipulation', {
            bossId: boss.id,
            effect: 'price_volatility',
            magnitude: boss.level * 0.1,
            duration: 30000 // 30 seconds
        });
    }

    // Public API Methods
    getBossCount() {
        return this.activeBosses.size;
    }

    getBossList() {
        return Array.from(this.activeBosses.values()).map(boss => ({
            id: boss.id,
            name: boss.name,
            type: boss.type,
            level: boss.level,
            health: boss.health,
            gameType: boss.gameType
        }));
    }

    forceBossSpawn(bossType = null) {
        if (bossType && this.bossTypes[bossType]) {
            const bossData = this.generateBossData(bossType, this.bossTypes[bossType]);
            this.spawnBoss(bossData);
            return bossData.id;
        } else {
            this.spawnRandomBoss();
        }
    }

    getBossById(bossId) {
        return this.activeBosses.get(bossId);
    }

    damageBoss(bossId, damage) {
        const boss = this.activeBosses.get(bossId);
        if (!boss) return false;
        
        boss.health = Math.max(0, boss.health - damage);
        
        // Update health bar in voxel world
        if (boss.healthBar && boss.maxHealth) {
            const healthPercent = boss.health / boss.maxHealth;
            boss.healthBar.scale.x = healthPercent;
            
            // Change color based on health
            if (healthPercent > 0.5) {
                boss.healthBar.material.color.setHex(0x00ff00); // Green
            } else if (healthPercent > 0.25) {
                boss.healthBar.material.color.setHex(0xffff00); // Yellow
            } else {
                boss.healthBar.material.color.setHex(0xff0000); // Red
            }
        }
        
        if (boss.health <= 0) {
            this.handleBossDefeat({ bossId });
            return true; // Boss defeated
        }
        
        return false; // Boss still alive
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BossCharacterIntegration;
}

// Auto-initialization for browser environments
(function() {
    if (typeof window !== 'undefined') {
        // Wait for page load
        window.addEventListener('load', () => {
            // Detect game type from URL or page context
            let gameType = 'unknown';
            
            if (window.location.port === '8892' || document.title.includes('Voxel')) {
                gameType = 'voxel';
            } else if (window.location.port === '8893' || document.title.includes('Economic')) {
                gameType = 'economic';
            } else if (window.location.port === '3001' || document.title.includes('Arena')) {
                gameType = 'arena';
            } else if (window.location.port === '8888' || document.title.includes('Tycoon')) {
                gameType = 'tycoon';
            } else if (window.location.port === '3002' || document.title.includes('Idle')) {
                gameType = 'idle';
            }
            
            if (gameType !== 'unknown') {
                console.log(`🏆 Initializing Boss Character Integration for ${gameType} game`);
                
                setTimeout(() => {
                    try {
                        window.bossCharacterIntegration = new BossCharacterIntegration(gameType, window.location.port);
                        
                        // Expose boss management functions globally
                        window.spawnBoss = (type) => window.bossCharacterIntegration.forceBossSpawn(type);
                        window.getBosses = () => window.bossCharacterIntegration.getBossList();
                        window.damageBoss = (id, dmg) => window.bossCharacterIntegration.damageBoss(id, dmg);
                        
                    } catch (error) {
                        console.error('❌ Failed to initialize Boss Character Integration:', error);
                    }
                }, 3000); // Wait for other systems to load
            }
        });
    }
})();

console.log('🏆⚔️ BOSS CHARACTER INTEGRATION LOADED');
console.log('=====================================');
console.log('✅ Cross-game boss spawning system');
console.log('✅ AI-driven boss behavior');
console.log('✅ Real-time boss synchronization');
console.log('✅ Multiple boss archetypes');
console.log('✅ Economic boss market manipulation');
console.log('✅ Tycoon and idle game integration');
console.log('✅ Combat boss AI with personality');
console.log('✅ Legendary boss special mechanics');
console.log('');
console.log('Boss Types Available:');
console.log('  ⚔️ Combat Boss - Aggressive warrior');
console.log('  💰 Economic Boss - Market manipulator');
console.log('  🛡️ Guardian Boss - Protective entity');
console.log('  👑 Legendary Boss - Unique challenge');