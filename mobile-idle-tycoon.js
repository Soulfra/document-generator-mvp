#!/usr/bin/env node

/**
 * MOBILE IDLE TYCOON - Pirate Islands Clash
 * Combines One Piece economy, ShipRekt mechanics, and Clash-style base building
 * Mobile-first idle game with AI-generated graphics
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Import existing systems
const BillionDollarGameEconomy = require('./billion-dollar-game-economy.js');
const ShipRektChartingGameEngine = require('./shiprekt-charting-game-engine.js');

console.log(`
🏴‍☠️ MOBILE IDLE TYCOON - PIRATE ISLANDS CLASH 🏴‍☠️
Idle pirate empire building with AI-generated graphics
Clash-style base building meets One Piece adventure
`);

class MobileIdleTycoon extends EventEmitter {
    constructor() {
        super();
        
        // Core game state
        this.gameState = {
            player: null,
            islands: new Map(),
            ships: new Map(),
            resources: {
                gold: 0,
                wood: 0,
                cannons: 0,
                rum: 0,
                berries: 0  // One Piece currency
            },
            buildings: new Map(),
            crews: new Map(),
            battles: new Map(),
            lastSave: Date.now(),
            offlineTime: 0
        };
        
        // Integrate existing systems
        this.onePieceEconomy = new BillionDollarGameEconomy();
        this.shipRektEngine = new ShipRektChartingGameEngine();
        
        // Island grid system (Clash-style)
        this.islandGrid = {
            width: 40,
            height: 40,
            cellSize: 32,  // pixels for mobile
            terrain: []
        };
        
        // Building types (Clash-style)
        this.buildingTypes = {
            // Resource buildings
            goldMine: {
                name: 'Gold Mine',
                cost: { wood: 100 },
                production: { gold: 10 },
                maxLevel: 15,
                sprite: '⛏️',
                ai_prompt: 'pirate gold mine on tropical island'
            },
            lumberMill: {
                name: 'Lumber Mill',
                cost: { gold: 150 },
                production: { wood: 8 },
                maxLevel: 15,
                sprite: '🪵',
                ai_prompt: 'tropical lumber mill with palm trees'
            },
            cannonFactory: {
                name: 'Cannon Factory',
                cost: { gold: 500, wood: 300 },
                production: { cannons: 2 },
                maxLevel: 10,
                sprite: '💣',
                ai_prompt: 'pirate cannon foundry with smoke'
            },
            rumDistillery: {
                name: 'Rum Distillery',
                cost: { gold: 200, wood: 100 },
                production: { rum: 5 },
                maxLevel: 12,
                sprite: '🍺',
                ai_prompt: 'caribbean rum distillery barrels'
            },
            
            // Defensive buildings
            cannonTower: {
                name: 'Cannon Tower',
                cost: { gold: 1000, wood: 500, cannons: 10 },
                defense: 50,
                range: 8,
                damage: 25,
                maxLevel: 10,
                sprite: '🗼',
                ai_prompt: 'pirate defense tower with cannons'
            },
            wall: {
                name: 'Wooden Wall',
                cost: { wood: 50 },
                defense: 100,
                maxLevel: 10,
                sprite: '🚧',
                ai_prompt: 'wooden pirate fort wall'
            },
            
            // Special buildings
            townHall: {
                name: 'Pirate Hall',
                cost: { gold: 0 },  // Starting building
                storage: { gold: 1000, wood: 1000, cannons: 100, rum: 500 },
                maxLevel: 10,
                sprite: '🏛️',
                ai_prompt: 'grand pirate town hall with jolly roger flag'
            },
            shipyard: {
                name: 'Shipyard',
                cost: { gold: 2000, wood: 1500 },
                function: 'build_ships',
                maxLevel: 5,
                sprite: '⚓',
                ai_prompt: 'busy pirate shipyard with ships under construction'
            },
            tavern: {
                name: 'Pirate Tavern',
                cost: { gold: 500, rum: 100 },
                function: 'recruit_crew',
                maxLevel: 5,
                sprite: '🏚️',
                ai_prompt: 'rowdy pirate tavern with music and fights'
            },
            
            // One Piece special buildings
            devilFruitTree: {
                name: 'Devil Fruit Tree',
                cost: { gold: 10000, berries: 1000 },
                function: 'grant_powers',
                maxLevel: 1,
                sprite: '🍎',
                ai_prompt: 'mysterious tree with spiral devil fruits glowing'
            }
        };
        
        // Ship types (from pirate components)
        this.shipTypes = {
            sloop: {
                name: 'Sloop',
                cost: { gold: 500, wood: 300 },
                speed: 8,
                capacity: 100,
                attack: 10,
                buildTime: 300000  // 5 minutes
            },
            brigantine: {
                name: 'Brigantine',
                cost: { gold: 1500, wood: 800, cannons: 20 },
                speed: 6,
                capacity: 300,
                attack: 30,
                buildTime: 900000  // 15 minutes
            },
            galleon: {
                name: 'Galleon',
                cost: { gold: 5000, wood: 2000, cannons: 50 },
                speed: 4,
                capacity: 1000,
                attack: 80,
                buildTime: 3600000  // 1 hour
            },
            // Special One Piece ships
            thousandSunny: {
                name: 'Thousand Sunny',
                cost: { gold: 20000, wood: 10000, berries: 5000 },
                speed: 10,
                capacity: 2000,
                attack: 150,
                special: 'coup_de_burst',
                buildTime: 86400000  // 24 hours
            }
        };
        
        // Idle mechanics
        this.idleMechanics = {
            productionRate: 1,  // Base multiplier
            offlineRate: 0.5,  // Reduced rate when offline
            prestigeLevel: 0,
            prestigeBonus: 1,
            autoSaveInterval: 30000,  // 30 seconds
            resourceCap: 10000  // Starting cap
        };
        
        // AI Graphics generation config
        this.graphicsConfig = {
            apiEndpoints: {
                dalle: process.env.OPENAI_API_KEY ? 'https://api.openai.com/v1/images/generations' : null,
                stableDiffusion: process.env.STABLE_DIFFUSION_API_KEY ? 'https://api.stability.ai/v1/generation' : null,
                midjourney: process.env.MIDJOURNEY_API_KEY ? 'https://api.midjourney.com/v1/imagine' : null
            },
            style: 'anime pirate adventure, vibrant colors, mobile game art style',
            cache: new Map()  // Cache generated images
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🏴‍☠️ Initializing Mobile Idle Tycoon...');
        
        // Load saved game or create new
        await this.loadOrCreateGame();
        
        // Start idle production
        this.startIdleProduction();
        
        // Setup auto-save
        this.setupAutoSave();
        
        // Initialize mobile-specific features
        this.initializeMobileFeatures();
        
        console.log('⚓ Mobile Idle Tycoon ready!');
        
        this.emit('game_initialized', {
            player: this.gameState.player,
            resources: this.gameState.resources,
            islands: this.gameState.islands.size
        });
    }
    
    async loadOrCreateGame() {
        try {
            // Try to load saved game
            const saveData = await this.loadGame();
            if (saveData) {
                this.gameState = saveData;
                this.calculateOfflineProgress();
                console.log('💾 Game loaded successfully');
            } else {
                // Create new game
                await this.createNewGame();
                console.log('🆕 New game created');
            }
        } catch (error) {
            console.error('Error loading game:', error);
            await this.createNewGame();
        }
    }
    
    async createNewGame() {
        // Create player with ShipRekt onboarding
        const playerData = {
            name: `Pirate_${Date.now()}`,
            wallet: `wallet_${crypto.randomBytes(8).toString('hex')}`
        };
        
        const { character, contract } = await this.onePieceEconomy.shipRektOnboarding(playerData);
        
        this.gameState.player = {
            id: character.id,
            name: character.name,
            level: 1,
            experience: 0,
            devilFruit: null,
            contract: contract.address,
            avatar: null  // Will be generated
        };
        
        // Create starting island
        const startingIsland = this.createIsland('starter', 0, 0);
        this.gameState.islands.set(startingIsland.id, startingIsland);
        
        // Place town hall
        const townHall = this.createBuilding('townHall', 20, 20, startingIsland.id);
        this.gameState.buildings.set(townHall.id, townHall);
        
        // Starting resources
        this.gameState.resources = {
            gold: 500,
            wood: 500,
            cannons: 10,
            rum: 50,
            berries: 100
        };
        
        await this.saveGame();
    }
    
    createIsland(type = 'tropical', x = 0, y = 0) {
        const island = {
            id: crypto.randomBytes(8).toString('hex'),
            name: this.generateIslandName(),
            type,
            position: { x, y },
            grid: this.generateIslandGrid(),
            buildings: [],
            defenses: [],
            level: 1,
            createdAt: Date.now()
        };
        
        return island;
    }
    
    generateIslandGrid() {
        const grid = [];
        for (let y = 0; y < this.islandGrid.height; y++) {
            const row = [];
            for (let x = 0; x < this.islandGrid.width; x++) {
                // Create island shape (circle with some randomness)
                const centerX = this.islandGrid.width / 2;
                const centerY = this.islandGrid.height / 2;
                const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                const maxDistance = Math.min(centerX, centerY) - 5;
                
                if (distance < maxDistance + (Math.random() * 3 - 1.5)) {
                    row.push({
                        terrain: 'land',
                        occupied: false,
                        building: null
                    });
                } else {
                    row.push({
                        terrain: 'water',
                        occupied: true,
                        building: null
                    });
                }
            }
            grid.push(row);
        }
        return grid;
    }
    
    generateIslandName() {
        const prefixes = ['Skull', 'Gold', 'Rum', 'Shark', 'Storm', 'Black', 'Red', 'Ghost'];
        const suffixes = ['Island', 'Cove', 'Bay', 'Haven', 'Port', 'Reef', 'Atoll', 'Key'];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    }
    
    createBuilding(type, x, y, islandId) {
        const buildingDef = this.buildingTypes[type];
        if (!buildingDef) throw new Error(`Unknown building type: ${type}`);
        
        const building = {
            id: crypto.randomBytes(8).toString('hex'),
            type,
            level: 1,
            position: { x, y },
            islandId,
            constructionStart: Date.now(),
            constructionTime: 0,  // Instant for now
            lastCollection: Date.now(),
            sprite: buildingDef.sprite,
            aiImage: null  // Will be generated
        };
        
        // Deduct resources
        if (buildingDef.cost) {
            Object.entries(buildingDef.cost).forEach(([resource, amount]) => {
                this.gameState.resources[resource] -= amount;
            });
        }
        
        // Mark grid cells as occupied
        const island = this.gameState.islands.get(islandId);
        if (island) {
            island.grid[y][x].occupied = true;
            island.grid[y][x].building = building.id;
            island.buildings.push(building.id);
        }
        
        this.emit('building_created', { building, island: islandId });
        
        return building;
    }
    
    startIdleProduction() {
        // Production tick every second
        this.productionInterval = setInterval(() => {
            this.processProduction();
        }, 1000);
        
        // Collection reminder every minute
        this.collectionInterval = setInterval(() => {
            this.checkCollections();
        }, 60000);
    }
    
    processProduction() {
        const now = Date.now();
        const productionBuildings = Array.from(this.gameState.buildings.values())
            .filter(b => this.buildingTypes[b.type].production);
        
        productionBuildings.forEach(building => {
            const buildingDef = this.buildingTypes[building.type];
            const timeSinceCollection = (now - building.lastCollection) / 1000; // seconds
            
            if (buildingDef.production) {
                Object.entries(buildingDef.production).forEach(([resource, rate]) => {
                    const production = rate * building.level * this.idleMechanics.productionRate * 
                                     this.idleMechanics.prestigeBonus * (timeSinceCollection / 60); // per minute
                    
                    // Add to resources (capped)
                    this.gameState.resources[resource] = Math.min(
                        this.gameState.resources[resource] + production,
                        this.idleMechanics.resourceCap
                    );
                });
            }
        });
        
        this.emit('resources_updated', this.gameState.resources);
    }
    
    calculateOfflineProgress() {
        const now = Date.now();
        const offlineTime = now - this.gameState.lastSave;
        const offlineHours = offlineTime / (1000 * 60 * 60);
        
        console.log(`📊 Calculating ${offlineHours.toFixed(2)} hours of offline progress...`);
        
        // Calculate offline production
        const productionBuildings = Array.from(this.gameState.buildings.values())
            .filter(b => this.buildingTypes[b.type].production);
        
        productionBuildings.forEach(building => {
            const buildingDef = this.buildingTypes[building.type];
            
            if (buildingDef.production) {
                Object.entries(buildingDef.production).forEach(([resource, rate]) => {
                    const offlineProduction = rate * building.level * this.idleMechanics.offlineRate * 
                                            this.idleMechanics.prestigeBonus * offlineHours * 60;
                    
                    this.gameState.resources[resource] = Math.min(
                        this.gameState.resources[resource] + offlineProduction,
                        this.idleMechanics.resourceCap
                    );
                });
            }
        });
        
        this.gameState.offlineTime = offlineTime;
        
        this.emit('offline_progress_calculated', {
            time: offlineHours,
            resources: this.gameState.resources
        });
    }
    
    async generateAIGraphics(prompt, type = 'building') {
        // Check cache first
        const cacheKey = `${type}_${prompt}`;
        if (this.graphicsConfig.cache.has(cacheKey)) {
            return this.graphicsConfig.cache.get(cacheKey);
        }
        
        // Try to generate with available API
        let imageUrl = null;
        
        if (this.graphicsConfig.apiEndpoints.dalle) {
            try {
                imageUrl = await this.generateWithDalle(prompt);
            } catch (error) {
                console.error('DALL-E generation failed:', error);
            }
        }
        
        if (!imageUrl && this.graphicsConfig.apiEndpoints.stableDiffusion) {
            try {
                imageUrl = await this.generateWithStableDiffusion(prompt);
            } catch (error) {
                console.error('Stable Diffusion generation failed:', error);
            }
        }
        
        // Fallback to emoji/ASCII art
        if (!imageUrl) {
            imageUrl = this.generateFallbackGraphic(type);
        }
        
        // Cache the result
        this.graphicsConfig.cache.set(cacheKey, imageUrl);
        
        return imageUrl;
    }
    
    async generateWithDalle(prompt) {
        const response = await fetch(this.graphicsConfig.apiEndpoints.dalle, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: `${prompt}, ${this.graphicsConfig.style}`,
                n: 1,
                size: '256x256'
            })
        });
        
        const data = await response.json();
        return data.data[0].url;
    }
    
    generateFallbackGraphic(type) {
        // Return data URL for emoji as fallback
        const canvas = `<canvas id="${type}" width="64" height="64"></canvas>`;
        return `data:text/html,${encodeURIComponent(canvas)}`;
    }
    
    initializeMobileFeatures() {
        // Touch controls
        this.touchControls = {
            pinchZoom: true,
            swipeNavigation: true,
            tapToCollect: true,
            dragToBuild: true
        };
        
        // Mobile optimizations
        this.mobileOptimizations = {
            reducedParticles: true,
            lowPowerMode: false,
            autoQuality: true,
            offlineMode: true
        };
        
        // PWA features
        this.pwaFeatures = {
            serviceWorker: true,
            pushNotifications: true,
            appIcon: '/icons/pirate-icon-192.png',
            splashScreen: true
        };
    }
    
    setupAutoSave() {
        setInterval(() => {
            this.saveGame();
        }, this.idleMechanics.autoSaveInterval);
    }
    
    async saveGame() {
        try {
            const saveData = {
                ...this.gameState,
                version: '1.0.0',
                lastSave: Date.now()
            };
            
            // Convert Maps to arrays for JSON
            saveData.islands = Array.from(this.gameState.islands.entries());
            saveData.buildings = Array.from(this.gameState.buildings.entries());
            saveData.ships = Array.from(this.gameState.ships.entries());
            saveData.crews = Array.from(this.gameState.crews.entries());
            
            await fs.writeFile(
                path.join(__dirname, 'save-game.json'),
                JSON.stringify(saveData, null, 2)
            );
            
            this.emit('game_saved', { timestamp: saveData.lastSave });
        } catch (error) {
            console.error('Failed to save game:', error);
        }
    }
    
    async loadGame() {
        try {
            const saveData = await fs.readFile(
                path.join(__dirname, 'save-game.json'),
                'utf8'
            );
            
            const parsed = JSON.parse(saveData);
            
            // Convert arrays back to Maps
            parsed.islands = new Map(parsed.islands);
            parsed.buildings = new Map(parsed.buildings);
            parsed.ships = new Map(parsed.ships);
            parsed.crews = new Map(parsed.crews);
            
            return parsed;
        } catch (error) {
            return null; // No save file
        }
    }
    
    // Battle system (Clash-style)
    async startBattle(attackerId, targetIslandId) {
        const attacker = this.gameState.player;
        const targetIsland = this.gameState.islands.get(targetIslandId);
        
        if (!targetIsland) {
            throw new Error('Target island not found');
        }
        
        const battle = {
            id: crypto.randomBytes(8).toString('hex'),
            attacker: attackerId,
            defender: targetIslandId,
            ships: [],
            startTime: Date.now(),
            status: 'preparing',
            loot: {
                gold: 0,
                wood: 0,
                rum: 0
            }
        };
        
        this.gameState.battles.set(battle.id, battle);
        
        this.emit('battle_started', battle);
        
        // Simulate battle after prep time
        setTimeout(() => {
            this.processBattle(battle.id);
        }, 30000); // 30 second prep time
        
        return battle;
    }
    
    processBattle(battleId) {
        const battle = this.gameState.battles.get(battleId);
        if (!battle) return;
        
        battle.status = 'active';
        
        // Simple battle calculation
        const attackPower = this.calculateAttackPower(battle.attacker);
        const defensePower = this.calculateDefensePower(battle.defender);
        
        const success = attackPower > defensePower * 1.2; // Need 20% advantage
        
        if (success) {
            // Calculate loot
            battle.loot = {
                gold: Math.floor(Math.random() * 1000),
                wood: Math.floor(Math.random() * 500),
                rum: Math.floor(Math.random() * 200)
            };
            
            // Add loot to attacker
            Object.entries(battle.loot).forEach(([resource, amount]) => {
                this.gameState.resources[resource] += amount;
            });
            
            battle.status = 'victory';
        } else {
            battle.status = 'defeat';
        }
        
        this.emit('battle_ended', battle);
    }
    
    calculateAttackPower(attackerId) {
        // Sum up ship attack values
        let power = 0;
        this.gameState.ships.forEach(ship => {
            if (ship.owner === attackerId) {
                power += this.shipTypes[ship.type].attack * ship.level;
            }
        });
        return power;
    }
    
    calculateDefensePower(islandId) {
        // Sum up defensive building values
        let power = 0;
        const island = this.gameState.islands.get(islandId);
        
        island.buildings.forEach(buildingId => {
            const building = this.gameState.buildings.get(buildingId);
            const buildingDef = this.buildingTypes[building.type];
            if (buildingDef.defense) {
                power += buildingDef.defense * building.level;
            }
        });
        
        return power;
    }
    
    // Prestige system
    async prestige() {
        if (this.gameState.resources.gold < 1000000) {
            throw new Error('Need 1M gold to prestige');
        }
        
        // Reset resources but gain prestige bonus
        this.idleMechanics.prestigeLevel++;
        this.idleMechanics.prestigeBonus = 1 + (this.idleMechanics.prestigeLevel * 0.5);
        
        // Reset to starting state but keep some progress
        this.gameState.resources = {
            gold: 1000 * this.idleMechanics.prestigeLevel,
            wood: 1000 * this.idleMechanics.prestigeLevel,
            cannons: 50 * this.idleMechanics.prestigeLevel,
            rum: 100 * this.idleMechanics.prestigeLevel,
            berries: 500 * this.idleMechanics.prestigeLevel
        };
        
        // Keep first island and town hall
        const islands = Array.from(this.gameState.islands.values());
        const firstIsland = islands[0];
        this.gameState.islands.clear();
        this.gameState.islands.set(firstIsland.id, firstIsland);
        
        // Increase caps
        this.idleMechanics.resourceCap *= 2;
        
        this.emit('prestige_completed', {
            level: this.idleMechanics.prestigeLevel,
            bonus: this.idleMechanics.prestigeBonus
        });
        
        await this.saveGame();
    }
    
    // API methods
    getGameState() {
        return {
            player: this.gameState.player,
            resources: this.gameState.resources,
            islands: Array.from(this.gameState.islands.values()),
            buildings: Array.from(this.gameState.buildings.values()),
            ships: Array.from(this.gameState.ships.values()),
            battles: Array.from(this.gameState.battles.values()),
            idleMechanics: this.idleMechanics,
            offlineTime: this.gameState.offlineTime
        };
    }
    
    getIsland(islandId) {
        const island = this.gameState.islands.get(islandId);
        if (!island) return null;
        
        return {
            ...island,
            buildings: island.buildings.map(id => this.gameState.buildings.get(id))
        };
    }
    
    collectResources(buildingId) {
        const building = this.gameState.buildings.get(buildingId);
        if (!building) throw new Error('Building not found');
        
        const buildingDef = this.buildingTypes[building.type];
        if (!buildingDef.production) throw new Error('Building does not produce resources');
        
        const now = Date.now();
        const timeSinceCollection = (now - building.lastCollection) / 1000 / 60; // minutes
        
        const collected = {};
        Object.entries(buildingDef.production).forEach(([resource, rate]) => {
            const amount = rate * building.level * timeSinceCollection * 
                          this.idleMechanics.productionRate * this.idleMechanics.prestigeBonus;
            collected[resource] = Math.floor(amount);
            this.gameState.resources[resource] = Math.min(
                this.gameState.resources[resource] + collected[resource],
                this.idleMechanics.resourceCap
            );
        });
        
        building.lastCollection = now;
        
        this.emit('resources_collected', { buildingId, collected });
        
        return collected;
    }
    
    upgradeBuilding(buildingId) {
        const building = this.gameState.buildings.get(buildingId);
        if (!building) throw new Error('Building not found');
        
        const buildingDef = this.buildingTypes[building.type];
        if (building.level >= buildingDef.maxLevel) {
            throw new Error('Building at max level');
        }
        
        // Calculate upgrade cost
        const upgradeCost = {};
        Object.entries(buildingDef.cost).forEach(([resource, baseCost]) => {
            upgradeCost[resource] = Math.floor(baseCost * Math.pow(1.5, building.level));
        });
        
        // Check if player has resources
        for (const [resource, cost] of Object.entries(upgradeCost)) {
            if (this.gameState.resources[resource] < cost) {
                throw new Error(`Not enough ${resource}`);
            }
        }
        
        // Deduct resources
        Object.entries(upgradeCost).forEach(([resource, cost]) => {
            this.gameState.resources[resource] -= cost;
        });
        
        // Upgrade building
        building.level++;
        
        this.emit('building_upgraded', { building, cost: upgradeCost });
        
        return building;
    }
    
    buildShip(shipType) {
        const shipDef = this.shipTypes[shipType];
        if (!shipDef) throw new Error('Unknown ship type');
        
        // Check resources
        for (const [resource, cost] of Object.entries(shipDef.cost)) {
            if (this.gameState.resources[resource] < cost) {
                throw new Error(`Not enough ${resource}`);
            }
        }
        
        // Deduct resources
        Object.entries(shipDef.cost).forEach(([resource, cost]) => {
            this.gameState.resources[resource] -= cost;
        });
        
        // Create ship
        const ship = {
            id: crypto.randomBytes(8).toString('hex'),
            type: shipType,
            name: this.generateShipName(shipType),
            level: 1,
            owner: this.gameState.player.id,
            status: 'building',
            completionTime: Date.now() + shipDef.buildTime,
            stats: {
                speed: shipDef.speed,
                capacity: shipDef.capacity,
                attack: shipDef.attack
            }
        };
        
        this.gameState.ships.set(ship.id, ship);
        
        // Set completion timer
        setTimeout(() => {
            ship.status = 'ready';
            this.emit('ship_completed', ship);
        }, shipDef.buildTime);
        
        this.emit('ship_building_started', ship);
        
        return ship;
    }
    
    generateShipName(type) {
        const prefixes = ['SS', 'HMS', 'USS', 'Flying', 'Golden', 'Black', 'Red', 'Swift'];
        const names = ['Revenge', 'Fortune', 'Pearl', 'Dragon', 'Serpent', 'Storm', 'Thunder', 'Wave'];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
    }
}

// Export the game engine
module.exports = MobileIdleTycoon;

// CLI/Server runner
if (require.main === module) {
    const game = new MobileIdleTycoon();
    
    // Check if server mode
    if (process.argv.includes('--server')) {
        const express = require('express');
        const app = express();
        const port = process.env.PORT || 7778;
        
        app.use(express.json());
        app.use(express.static('public'));
        
        // API Routes
        app.get('/api/game/state', (req, res) => {
            res.json(game.getGameState());
        });
        
        app.get('/api/island/:id', (req, res) => {
            const island = game.getIsland(req.params.id);
            if (!island) {
                return res.status(404).json({ error: 'Island not found' });
            }
            res.json(island);
        });
        
        app.post('/api/building/create', (req, res) => {
            try {
                const { type, x, y, islandId } = req.body;
                const building = game.createBuilding(type, x, y, islandId);
                res.json(building);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        app.post('/api/building/:id/upgrade', (req, res) => {
            try {
                const building = game.upgradeBuilding(req.params.id);
                res.json(building);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        app.post('/api/building/:id/collect', (req, res) => {
            try {
                const collected = game.collectResources(req.params.id);
                res.json({ collected });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        app.post('/api/ship/build', (req, res) => {
            try {
                const { type } = req.body;
                const ship = game.buildShip(type);
                res.json(ship);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        app.post('/api/battle/start', (req, res) => {
            try {
                const { targetIslandId } = req.body;
                const battle = game.startBattle(game.gameState.player.id, targetIslandId);
                res.json(battle);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        app.post('/api/game/prestige', async (req, res) => {
            try {
                await game.prestige();
                res.json({ success: true, level: game.idleMechanics.prestigeLevel });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // WebSocket for real-time updates
        const WebSocket = require('ws');
        const server = app.listen(port, () => {
            console.log(`🏴‍☠️ Mobile Idle Tycoon server running on port ${port}`);
            console.log(`📱 Open http://localhost:${port} to play!`);
        });
        
        const wss = new WebSocket.Server({ server });
        
        wss.on('connection', (ws) => {
            console.log('New player connected');
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'game_state',
                data: game.getGameState()
            }));
            
            // Forward game events to client
            const events = [
                'resources_updated',
                'building_created',
                'building_upgraded',
                'resources_collected',
                'ship_completed',
                'battle_started',
                'battle_ended',
                'offline_progress_calculated'
            ];
            
            events.forEach(event => {
                game.on(event, (data) => {
                    ws.send(JSON.stringify({ type: event, data }));
                });
            });
        });
        
    } else {
        // CLI mode
        console.log('🏴‍☠️ Mobile Idle Tycoon - CLI Mode');
        console.log('Run with --server to start the web server');
        
        // Show game status
        game.on('game_initialized', (data) => {
            console.log('\n📊 Game Status:');
            console.log(`Player: ${data.player.name}`);
            console.log(`Resources:`, data.resources);
            console.log(`Islands: ${data.islands}`);
        });
    }
}