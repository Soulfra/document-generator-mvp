#!/usr/bin/env node

/**
 * 🏴‍☠️⚓ PIRATE SHIP BUILDER ENGINE
 * 
 * RuneScape-style ship progression system combined with Habbo Hotel-style
 * customization mechanics. Build everything from dinghies to legendary flagships
 * using the existing pirate economy and 3D navigation systems.
 * 
 * Features:
 * - Progressive ship unlocking (Dinghy → Galleon → Legendary Ship)
 * - Habbo-style customization with furniture and decorations
 * - RuneScape-style skill requirements and material gathering
 * - Integration with pirate economy credit system
 * - 3D visualization of ships in navigation viewer
 * - Fleet management for multiple ships
 * - Ship battles and trading mechanics
 * 
 * The core philosophy: "if there are no positives then eliminate the stress, 
 * simple adult stuff" - making ship building fun and low-temperature.
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// Import our ecosystem components
const FrogBrainDecisionEngine = require('./Frog-Brain-Decision-Engine');
const CompanyGameEngine = require('./Company-Game-Engine');

class PirateShipBuilder extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Pirate ship building settings
            shipyardName: 'Digital Caribbean Shipyard',
            shipDataPath: './pirate_ships/',
            
            // Progressive ship unlocking (RuneScape style)
            shipTiers: {
                'dinghy': { level: 1, skills: { coding: 1 }, cost: 10 },
                'sloop': { level: 10, skills: { coding: 10, design: 5 }, cost: 100 },
                'brigantine': { level: 25, skills: { coding: 25, design: 15, networking: 10 }, cost: 500 },
                'frigate': { level: 40, skills: { coding: 40, design: 25, networking: 20, leadership: 15 }, cost: 1500 },
                'galleon': { level: 60, skills: { coding: 60, design: 40, networking: 30, leadership: 25, strategy: 20 }, cost: 5000 },
                'man_of_war': { level: 80, skills: { coding: 80, design: 60, networking: 50, leadership: 40, strategy: 35, innovation: 25 }, cost: 15000 },
                'legendary_flagship': { level: 99, skills: { coding: 99, design: 85, networking: 70, leadership: 60, strategy: 50, innovation: 40 }, cost: 50000 }
            },
            
            // Ship customization categories (Habbo style)
            customizationCategories: {
                'hull': {
                    name: 'Hull Design',
                    options: ['oak_hull', 'mahogany_hull', 'ironwood_hull', 'enchanted_hull', 'legendary_hull'],
                    effects: { durability: [100, 150, 200, 300, 500], speed: [1.0, 1.1, 1.2, 1.4, 2.0] }
                },
                'sails': {
                    name: 'Sail Configuration',
                    options: ['basic_sails', 'square_rigged', 'lateen_rigged', 'full_rigged', 'magical_sails'],
                    effects: { speed: [1.0, 1.2, 1.1, 1.5, 2.5], maneuverability: [1.0, 1.1, 1.3, 1.2, 2.0] }
                },
                'figurehead': {
                    name: 'Figurehead',
                    options: ['dragon', 'kraken', 'phoenix', 'whale', 'algorithm_spirit'],
                    effects: { intimidation: [1, 2, 3, 2, 5], luck: [1, 1, 3, 2, 4] }
                },
                'cannons': {
                    name: 'Armament',
                    options: ['swivel_guns', 'light_cannons', 'heavy_cannons', 'carronades', 'quantum_cannons'],
                    effects: { firepower: [1, 3, 6, 8, 15], range: [100, 200, 300, 250, 500] }
                },
                'cabin': {
                    name: 'Captain\'s Cabin',
                    options: ['hammock', 'basic_quarters', 'luxury_cabin', 'navigation_suite', 'ai_command_center'],
                    effects: { comfort: [1, 3, 6, 8, 12], command_bonus: [0, 1, 2, 4, 8] }
                }
            },
            
            // Ship room system (Habbo-style interior design)
            shipRooms: {
                'main_deck': { name: 'Main Deck', capacity: 20, furniture_slots: 15 },
                'captains_quarters': { name: 'Captain\'s Quarters', capacity: 4, furniture_slots: 10 },
                'crew_quarters': { name: 'Crew Quarters', capacity: 12, furniture_slots: 8 },
                'cargo_hold': { name: 'Cargo Hold', capacity: 50, furniture_slots: 5 },
                'galley': { name: 'Ship\'s Galley', capacity: 6, furniture_slots: 6 },
                'gun_deck': { name: 'Gun Deck', capacity: 8, furniture_slots: 4 }
            },
            
            // Ship furniture (Habbo-style decorations)
            shipFurniture: {
                'navigation': [
                    { name: 'Ship\'s Wheel', cost: 50, effect: { navigation: 2 }, room: 'main_deck' },
                    { name: 'Navigation Charts', cost: 25, effect: { exploration: 1 }, room: 'captains_quarters' },
                    { name: 'Compass Rose', cost: 75, effect: { accuracy: 3 }, room: 'main_deck' },
                    { name: 'Astrolabe', cost: 100, effect: { positioning: 4 }, room: 'captains_quarters' }
                ],
                'comfort': [
                    { name: 'Captain\'s Bed', cost: 200, effect: { rest: 5 }, room: 'captains_quarters' },
                    { name: 'Crew Hammocks', cost: 150, effect: { crew_morale: 3 }, room: 'crew_quarters' },
                    { name: 'Dining Table', cost: 100, effect: { crew_morale: 2 }, room: 'galley' },
                    { name: 'Treasure Chest', cost: 300, effect: { storage: 10 }, room: 'captains_quarters' }
                ],
                'functionality': [
                    { name: 'Cannon', cost: 500, effect: { firepower: 5 }, room: 'gun_deck' },
                    { name: 'Repair Kit', cost: 150, effect: { maintenance: 3 }, room: 'cargo_hold' },
                    { name: 'Cooking Stove', cost: 75, effect: { crew_health: 2 }, room: 'galley' },
                    { name: 'Lookout Post', cost: 125, effect: { detection: 4 }, room: 'main_deck' }
                ],
                'decoration': [
                    { name: 'Jolly Roger Flag', cost: 30, effect: { intimidation: 1 }, room: 'main_deck' },
                    { name: 'Ship\'s Bell', cost: 40, effect: { communication: 1 }, room: 'main_deck' },
                    { name: 'Parrot Perch', cost: 60, effect: { luck: 2 }, room: 'captains_quarters' },
                    { name: 'Map Collection', cost: 80, effect: { knowledge: 3 }, room: 'captains_quarters' }
                ]
            },
            
            // Ship building materials (RuneScape style)
            materials: {
                'oak_planks': { cost: 5, source: 'trading', description: 'Basic ship building material' },
                'mahogany_planks': { cost: 15, source: 'rare_trading', description: 'Superior wood for better ships' },
                'iron_nails': { cost: 2, source: 'crafting', description: 'Essential for ship construction' },
                'canvas': { cost: 10, source: 'trading', description: 'For making sails' },
                'rope': { cost: 8, source: 'crafting', description: 'Rigging and ship operations' },
                'pitch': { cost: 12, source: 'trading', description: 'Waterproofing material' },
                'enchanted_wood': { cost: 100, source: 'quests', description: 'Magical ship enhancement' },
                'sea_crystal': { cost: 500, source: 'rare_drops', description: 'Legendary ship components' }
            },
            
            ...config
        };

        // Initialize subsystems
        this.frogBrain = new FrogBrainDecisionEngine();
        this.gameEngine = new CompanyGameEngine();

        // Ship building state
        this.shipyardState = {
            playerShips: new Map(),        // playerId -> ships[]
            buildQueue: new Map(),         // buildId -> build progress
            shipTemplates: new Map(),      // shipId -> template
            materialInventory: new Map(),  // playerId -> materials
            activeProjects: new Map(),     // projectId -> project data
            
            // Fleet management
            fleets: new Map(),            // fleetId -> fleet data
            tradeRoutes: new Map(),       // routeId -> route data
            battleResults: new Map(),     // battleId -> battle data
            
            // Shipyard statistics
            totalShipsBuilt: 0,
            totalDoubloonsSpent: 0,
            mostPopularShipType: 'sloop',
            averageBuildTime: 0
        };

        this.initialize();
    }

    async initialize() {
        console.log('🏴‍☠️⚓ Initializing Pirate Ship Builder...');
        console.log(`🛠️ Welcome to ${this.config.shipyardName}!`);
        console.log('⚓ Where dreams become seaworthy vessels!');
        
        try {
            // Load shipyard state
            await this.loadShipyardState();
            
            // Initialize ship templates
            this.initializeShipTemplates();
            
            // Start shipyard loops
            this.startShipyardLoops();
            
            console.log('✅ Pirate Ship Builder ready!');
            console.log(`🛠️ ${this.shipyardState.totalShipsBuilt} ships built so far`);
            console.log(`💰 ${this.shipyardState.totalDoubloonsSpent} doubloons invested`);
            
            this.emit('shipyard_opened', {
                shipyard: this.config.shipyardName,
                totalShips: this.shipyardState.totalShipsBuilt,
                activeProjects: this.shipyardState.activeProjects.size
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize ship builder:', error);
            throw error;
        }
    }

    /**
     * Start building a new ship (RuneScape-style progression)
     */
    async startShipBuild(playerId, buildRequest) {
        const {
            shipType,
            customizations = {},
            furniture = [],
            expediteWithDoubloons = false
        } = buildRequest;

        console.log(`🛠️ ${playerId} wants to build a ${shipType}!`);

        // Check if ship type exists
        const shipTier = this.config.shipTiers[shipType];
        if (!shipTier) {
            throw new Error(`Unknown ship type: ${shipType}`);
        }

        // Get player's current skills from game engine
        const playerData = await this.gameEngine.getPlayerData(playerId);
        if (!playerData) {
            throw new Error('Player not found in game engine');
        }

        // Use frog brain to resolve any building confusions
        const buildDecision = await this.frogBrain.resolveDecision({
            type: 'ship_building_decision',
            context: `Building ${shipType} ship`,
            options: {
                'start_build': { pros: ['ship_progress', 'skill_advancement'], cons: ['resource_cost', 'time_investment'] },
                'upgrade_existing': { pros: ['cost_efficiency', 'familiarity'], cons: ['limited_improvement'] },
                'save_resources': { pros: ['financial_safety', 'future_opportunities'], cons: ['missed_advancement'] }
            },
            playerPreferences: {
                risk_tolerance: 'low_temperature',
                focus: 'steady_progression',
                style: 'eliminate_stress'
            }
        });

        if (buildDecision.choice !== 'start_build' && !expediteWithDoubloons) {
            return {
                success: false,
                reason: buildDecision.reasoning,
                alternative: buildDecision.choice,
                frogWisdom: buildDecision.animalWisdom
            };
        }

        // Check skill requirements
        const skillCheck = this.checkSkillRequirements(playerData.businessSkills, shipTier.skills);
        if (!skillCheck.meets_requirements && !expediteWithDoubloons) {
            return {
                success: false,
                reason: 'Insufficient skills',
                missing_skills: skillCheck.missing_skills,
                suggestion: 'Train more skills or pay extra doubloons to hire expert shipwrights'
            };
        }

        // Calculate material requirements
        const materialRequirements = this.calculateMaterialRequirements(shipType, customizations);
        
        // Check if player has materials or can buy them
        const materialCheck = await this.checkAndAcquireMaterials(playerId, materialRequirements);
        if (!materialCheck.success) {
            return {
                success: false,
                reason: 'Insufficient materials',
                missing_materials: materialCheck.missing,
                total_cost: materialCheck.cost
            };
        }

        // Calculate build time (reduced by skills, expedited by doubloons)
        const baseBuildTime = this.calculateBaseBuildTime(shipType);
        const skillModifier = this.calculateSkillModifier(playerData.businessSkills, shipTier.skills);
        const doubloonsModifier = expediteWithDoubloons ? 0.5 : 1.0;
        const finalBuildTime = Math.floor(baseBuildTime * skillModifier * doubloonsModifier);

        // Create build project
        const buildProject = {
            id: crypto.randomUUID(),
            playerId,
            shipType,
            customizations,
            furniture,
            startTime: Date.now(),
            estimatedCompleteTime: Date.now() + finalBuildTime,
            progress: 0,
            materials: materialRequirements,
            expedited: expediteWithDoubloons,
            skillRequirements: shipTier.skills,
            currentSkills: playerData.businessSkills,
            status: 'in_progress'
        };

        // Add to build queue
        this.shipyardState.buildQueue.set(buildProject.id, buildProject);
        this.shipyardState.activeProjects.set(buildProject.id, buildProject);

        // Update player materials
        await this.consumeMaterials(playerId, materialRequirements);

        // Award experience to relevant skills
        await this.awardBuildingExperience(playerId, shipType, skillCheck.experience_gain);

        console.log(`⚓ Started building ${shipType} for ${playerId}`);
        console.log(`⏱️ Estimated completion: ${Math.round(finalBuildTime/1000/60)} minutes`);

        this.emit('ship_build_started', {
            playerId,
            shipType,
            buildId: buildProject.id,
            estimatedTime: finalBuildTime
        });

        return {
            success: true,
            buildProject,
            estimatedCompletionTime: finalBuildTime,
            skillExperienceGained: skillCheck.experience_gain
        };
    }

    /**
     * Complete ship build and add to player's fleet
     */
    async completeShipBuild(buildId) {
        const buildProject = this.shipyardState.buildQueue.get(buildId);
        if (!buildProject) {
            throw new Error('Build project not found');
        }

        if (buildProject.progress < 100) {
            throw new Error('Ship not ready - still under construction');
        }

        console.log(`🚢 Completing ${buildProject.shipType} for ${buildProject.playerId}!`);

        // Create the final ship
        const ship = {
            id: crypto.randomUUID(),
            type: buildProject.shipType,
            name: this.generateShipName(buildProject.shipType),
            owner: buildProject.playerId,
            built: Date.now(),
            buildId: buildProject.id,
            
            // Ship stats based on type and customizations
            stats: this.calculateShipStats(buildProject.shipType, buildProject.customizations),
            
            // Customizations applied
            customizations: buildProject.customizations,
            
            // Rooms and furniture (Habbo-style)
            rooms: this.initializeShipRooms(buildProject.shipType),
            furniture: this.placeFurniture(buildProject.furniture),
            
            // Operational stats
            condition: 100,
            crew: [],
            cargo: [],
            currentLocation: 'shipyard',
            
            // Fleet management
            fleetId: null,
            
            // Experience and history
            experience: 0,
            level: 1,
            voyages: [],
            battles: []
        };

        // Add ship to player's fleet
        let playerShips = this.shipyardState.playerShips.get(buildProject.playerId) || [];
        playerShips.push(ship);
        this.shipyardState.playerShips.set(buildProject.playerId, playerShips);

        // Remove from build queue
        this.shipyardState.buildQueue.delete(buildId);
        this.shipyardState.activeProjects.delete(buildId);

        // Update statistics
        this.shipyardState.totalShipsBuilt++;
        this.updateShipyardStatistics(buildProject);

        // Award completion experience
        await this.awardCompletionExperience(buildProject.playerId, buildProject.shipType);

        console.log(`⚓ ${ship.name} completed and added to fleet!`);

        this.emit('ship_build_completed', {
            playerId: buildProject.playerId,
            ship,
            buildProject
        });

        return {
            success: true,
            ship,
            message: `Congratulations! Your ${buildProject.shipType} "${ship.name}" is ready to sail the digital seas!`
        };
    }

    /**
     * Customize ship interior (Habbo-style room design)
     */
    async customizeShipInterior(shipId, customizationRequest) {
        const { room, furniture, layout } = customizationRequest;

        // Find the ship
        const ship = this.findShipById(shipId);
        if (!ship) {
            throw new Error('Ship not found');
        }

        console.log(`🎨 Customizing ${ship.name}'s ${room}...`);

        // Check if room exists
        const roomData = ship.rooms[room];
        if (!roomData) {
            throw new Error(`Room ${room} not found on ship`);
        }

        // Validate furniture placement
        const furnitureValidation = this.validateFurniturePlacement(roomData, furniture);
        if (!furnitureValidation.valid) {
            return {
                success: false,
                reason: furnitureValidation.reason,
                suggestions: furnitureValidation.suggestions
            };
        }

        // Calculate cost
        const cost = furniture.reduce((total, item) => {
            const furnitureData = this.findFurnitureByName(item.name);
            return total + (furnitureData ? furnitureData.cost : 0);
        }, 0);

        // Apply customizations
        ship.rooms[room].furniture = furniture;
        ship.rooms[room].layout = layout;
        ship.rooms[room].lastModified = Date.now();

        // Recalculate ship stats based on new furniture
        ship.stats = this.recalculateShipStats(ship);

        // Update ship history
        ship.customizationHistory = ship.customizationHistory || [];
        ship.customizationHistory.push({
            timestamp: Date.now(),
            room,
            furniture: furniture.map(f => f.name),
            cost
        });

        console.log(`✅ ${ship.name}'s ${room} customized! Cost: ${cost} doubloons`);

        this.emit('ship_customized', {
            shipId,
            room,
            furniture,
            cost,
            newStats: ship.stats
        });

        return {
            success: true,
            ship,
            cost,
            newStats: ship.stats,
            message: `${ship.name}'s ${room} has been beautifully customized!`
        };
    }

    /**
     * Create or join a fleet (multiple ships working together)
     */
    async createFleet(playerId, fleetData) {
        const { name, ships, purpose, strategy } = fleetData;

        console.log(`⚓ ${playerId} creating fleet: ${name}`);

        // Validate ships belong to player
        const playerShips = this.shipyardState.playerShips.get(playerId) || [];
        const validShips = ships.filter(shipId => 
            playerShips.some(ship => ship.id === shipId)
        );

        if (validShips.length === 0) {
            throw new Error('No valid ships provided for fleet');
        }

        // Use frog brain to optimize fleet composition
        const fleetDecision = await this.frogBrain.resolveDecision({
            type: 'fleet_composition',
            context: `Creating fleet for ${purpose}`,
            options: {
                'balanced_fleet': { pros: ['versatility', 'survivability'], cons: ['specialized_efficiency'] },
                'speed_fleet': { pros: ['fast_travel', 'escape_ability'], cons: ['limited_cargo', 'weak_combat'] },
                'combat_fleet': { pros: ['strong_fighting', 'intimidation'], cons: ['slow_speed', 'high_maintenance'] },
                'trading_fleet': { pros: ['large_cargo', 'profit_focus'], cons: ['vulnerable_to_attacks'] }
            },
            playerPreferences: {
                risk_tolerance: 'low_temperature',
                focus: 'steady_progress'
            }
        });

        const fleet = {
            id: crypto.randomUUID(),
            name,
            admiral: playerId,
            ships: validShips.map(shipId => {
                const ship = playerShips.find(s => s.id === shipId);
                ship.fleetId = fleet.id;
                return ship.id;
            }),
            created: Date.now(),
            purpose,
            strategy: fleetDecision.choice,
            
            // Fleet stats (combined from all ships)
            stats: this.calculateFleetStats(validShips, playerShips),
            
            // Fleet operations
            currentMission: null,
            location: 'port',
            experience: 0,
            level: 1,
            
            // Fleet history
            missions: [],
            battles: [],
            voyages: []
        };

        this.shipyardState.fleets.set(fleet.id, fleet);

        console.log(`⚓ Fleet "${name}" created with ${validShips.length} ships`);
        console.log(`🧠 Frog brain recommends: ${fleetDecision.choice} strategy`);

        this.emit('fleet_created', {
            playerId,
            fleet,
            strategy: fleetDecision.choice,
            frogWisdom: fleetDecision.animalWisdom
        });

        return {
            success: true,
            fleet,
            recommendedStrategy: fleetDecision.choice,
            reasoning: fleetDecision.reasoning
        };
    }

    /**
     * Battle system for ship combat
     */
    async engageInBattle(attackingFleetId, defendingFleetId, battleType = 'naval_combat') {
        const attackingFleet = this.shipyardState.fleets.get(attackingFleetId);
        const defendingFleet = this.shipyardState.fleets.get(defendingFleetId);

        if (!attackingFleet || !defendingFleet) {
            throw new Error('Fleet not found for battle');
        }

        console.log(`⚔️ Battle commencing: ${attackingFleet.name} vs ${defendingFleet.name}`);

        // Use frog brain for battle strategy
        const battleDecision = await this.frogBrain.resolveDecision({
            type: 'battle_strategy',
            context: `${battleType} between fleets`,
            options: {
                'aggressive_assault': { pros: ['quick_victory', 'intimidation'], cons: ['high_damage_risk'] },
                'defensive_positioning': { pros: ['minimize_losses', 'wear_down_enemy'], cons: ['longer_battle'] },
                'tactical_maneuvering': { pros: ['strategic_advantage', 'crew_safety'], cons: ['complex_execution'] },
                'negotiate_peace': { pros: ['no_losses', 'mutual_benefit'], cons: ['no_victory_rewards'] }
            },
            playerPreferences: {
                risk_tolerance: 'low_temperature',
                focus: 'minimize_stress'
            }
        });

        // Calculate battle outcome based on fleet stats and strategy
        const battleResult = this.calculateBattleOutcome(
            attackingFleet, 
            defendingFleet, 
            battleDecision.choice
        );

        // Create battle record
        const battle = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: battleType,
            fleets: {
                attacker: attackingFleetId,
                defender: defendingFleetId
            },
            strategy: battleDecision.choice,
            result: battleResult,
            duration: Math.floor(Math.random() * 30 + 10), // 10-40 minutes
            casualties: battleResult.casualties,
            loot: battleResult.loot
        };

        // Apply battle consequences
        await this.applyBattleConsequences(battle);

        // Store battle record
        this.shipyardState.battleResults.set(battle.id, battle);

        console.log(`⚔️ Battle concluded: ${battleResult.victor}`);
        console.log(`🧠 Frog brain chose: ${battleDecision.choice} strategy`);

        this.emit('battle_completed', {
            battle,
            victor: battleResult.victor,
            strategy: battleDecision.choice
        });

        return {
            success: true,
            battle,
            victor: battleResult.victor,
            strategy: battleDecision.choice,
            frogWisdom: battleDecision.animalWisdom
        };
    }

    /**
     * Ship progression and leveling system
     */
    async upgradeShip(shipId, upgradeType, materials = {}) {
        const ship = this.findShipById(shipId);
        if (!ship) {
            throw new Error('Ship not found');
        }

        console.log(`⬆️ Upgrading ${ship.name}: ${upgradeType}`);

        // Define upgrade paths
        const upgradeOptions = {
            'hull_reinforcement': {
                materials: { 'iron_nails': 20, 'oak_planks': 15, 'pitch': 10 },
                effects: { durability: +20, speed: -2 },
                cost: 200
            },
            'sail_optimization': {
                materials: { 'canvas': 25, 'rope': 30 },
                effects: { speed: +15, maneuverability: +10 },
                cost: 300
            },
            'weapon_upgrade': {
                materials: { 'iron_nails': 50, 'oak_planks': 10 },
                effects: { firepower: +25 },
                cost: 500
            },
            'luxury_interior': {
                materials: { 'mahogany_planks': 20, 'canvas': 15 },
                effects: { comfort: +30, crew_morale: +20 },
                cost: 750
            },
            'navigation_enhancement': {
                materials: { 'sea_crystal': 1, 'rope': 10 },
                effects: { navigation: +50, exploration: +25 },
                cost: 1000
            }
        };

        const upgrade = upgradeOptions[upgradeType];
        if (!upgrade) {
            throw new Error(`Unknown upgrade type: ${upgradeType}`);
        }

        // Check materials
        const hasRequired = Object.entries(upgrade.materials).every(([material, needed]) => {
            const available = materials[material] || 0;
            return available >= needed;
        });

        if (!hasRequired) {
            return {
                success: false,
                reason: 'Insufficient materials',
                required: upgrade.materials,
                provided: materials
            };
        }

        // Apply upgrade effects
        Object.entries(upgrade.effects).forEach(([stat, change]) => {
            ship.stats[stat] = (ship.stats[stat] || 0) + change;
        });

        // Record upgrade
        ship.upgrades = ship.upgrades || [];
        ship.upgrades.push({
            type: upgradeType,
            timestamp: Date.now(),
            materials: upgrade.materials,
            effects: upgrade.effects,
            cost: upgrade.cost
        });

        // Award experience
        ship.experience += 100;
        if (ship.experience >= ship.level * 1000) {
            ship.level++;
            console.log(`🎉 ${ship.name} leveled up to level ${ship.level}!`);
        }

        console.log(`✅ ${ship.name} upgraded: ${upgradeType}`);

        this.emit('ship_upgraded', {
            shipId,
            upgradeType,
            newStats: ship.stats,
            newLevel: ship.level
        });

        return {
            success: true,
            ship,
            upgradeType,
            newStats: ship.stats,
            message: `${ship.name} has been successfully upgraded!`
        };
    }

    /**
     * Helper methods for ship building logic
     */
    checkSkillRequirements(playerSkills, requiredSkills) {
        const missing = [];
        let experienceGain = 0;

        Object.entries(requiredSkills).forEach(([skill, required]) => {
            const current = playerSkills[skill]?.level || 1;
            if (current < required) {
                missing.push({ skill, required, current });
            } else {
                experienceGain += Math.floor(required / 2); // Experience based on skill level used
            }
        });

        return {
            meets_requirements: missing.length === 0,
            missing_skills: missing,
            experience_gain: experienceGain
        };
    }

    calculateMaterialRequirements(shipType, customizations) {
        const baseMaterials = {
            'dinghy': { 'oak_planks': 10, 'iron_nails': 20, 'canvas': 5, 'rope': 8 },
            'sloop': { 'oak_planks': 25, 'iron_nails': 50, 'canvas': 15, 'rope': 20, 'pitch': 10 },
            'brigantine': { 'oak_planks': 50, 'mahogany_planks': 10, 'iron_nails': 100, 'canvas': 30, 'rope': 40, 'pitch': 25 },
            'frigate': { 'oak_planks': 100, 'mahogany_planks': 25, 'iron_nails': 200, 'canvas': 50, 'rope': 75, 'pitch': 50 },
            'galleon': { 'mahogany_planks': 75, 'iron_nails': 400, 'canvas': 100, 'rope': 150, 'pitch': 100, 'enchanted_wood': 10 },
            'man_of_war': { 'mahogany_planks': 150, 'iron_nails': 800, 'canvas': 200, 'rope': 300, 'pitch': 200, 'enchanted_wood': 25 },
            'legendary_flagship': { 'mahogany_planks': 300, 'iron_nails': 1500, 'canvas': 400, 'rope': 600, 'pitch': 400, 'enchanted_wood': 50, 'sea_crystal': 5 }
        };

        let materials = { ...baseMaterials[shipType] };

        // Add customization material costs
        Object.entries(customizations).forEach(([category, option]) => {
            const customData = this.config.customizationCategories[category];
            if (customData && customData.options.includes(option)) {
                const optionIndex = customData.options.indexOf(option);
                // Higher tier options require more materials
                if (optionIndex > 0) {
                    materials['enchanted_wood'] = (materials['enchanted_wood'] || 0) + optionIndex * 2;
                }
            }
        });

        return materials;
    }

    calculateBaseBuildTime(shipType) {
        const baseTimes = {
            'dinghy': 5 * 60 * 1000,           // 5 minutes
            'sloop': 15 * 60 * 1000,           // 15 minutes
            'brigantine': 30 * 60 * 1000,      // 30 minutes
            'frigate': 60 * 60 * 1000,         // 1 hour
            'galleon': 120 * 60 * 1000,        // 2 hours
            'man_of_war': 240 * 60 * 1000,     // 4 hours
            'legendary_flagship': 480 * 60 * 1000 // 8 hours
        };

        return baseTimes[shipType] || baseTimes.sloop;
    }

    calculateSkillModifier(playerSkills, requiredSkills) {
        let totalSkillBonus = 0;
        let skillCount = 0;

        Object.entries(requiredSkills).forEach(([skill, required]) => {
            const current = playerSkills[skill]?.level || 1;
            const bonus = Math.max(0, (current - required) / required);
            totalSkillBonus += bonus;
            skillCount++;
        });

        const averageBonus = skillCount > 0 ? totalSkillBonus / skillCount : 0;
        return Math.max(0.5, 1 - (averageBonus * 0.3)); // Max 30% time reduction
    }

    calculateShipStats(shipType, customizations) {
        const baseStats = {
            'dinghy': { speed: 30, durability: 50, firepower: 5, maneuverability: 90, cargo: 10 },
            'sloop': { speed: 50, durability: 80, firepower: 15, maneuverability: 80, cargo: 25 },
            'brigantine': { speed: 60, durability: 120, firepower: 30, maneuverability: 70, cargo: 50 },
            'frigate': { speed: 55, durability: 150, firepower: 50, maneuverability: 60, cargo: 75 },
            'galleon': { speed: 45, durability: 200, firepower: 80, maneuverability: 50, cargo: 150 },
            'man_of_war': { speed: 40, durability: 300, firepower: 120, maneuverability: 40, cargo: 200 },
            'legendary_flagship': { speed: 70, durability: 500, firepower: 200, maneuverability: 70, cargo: 300 }
        };

        let stats = { ...baseStats[shipType] };

        // Apply customization effects
        Object.entries(customizations).forEach(([category, option]) => {
            const customData = this.config.customizationCategories[category];
            if (customData && customData.options.includes(option)) {
                const optionIndex = customData.options.indexOf(option);
                
                // Apply effects based on customization tier
                Object.entries(customData.effects).forEach(([stat, values]) => {
                    if (values[optionIndex] !== undefined) {
                        if (typeof values[optionIndex] === 'number' && values[optionIndex] < 10) {
                            // Multiplier
                            stats[stat] = Math.floor(stats[stat] * values[optionIndex]);
                        } else {
                            // Direct value
                            stats[stat] = values[optionIndex];
                        }
                    }
                });
            }
        });

        return stats;
    }

    initializeShipRooms(shipType) {
        const roomSizes = {
            'dinghy': ['main_deck'],
            'sloop': ['main_deck', 'captains_quarters'],
            'brigantine': ['main_deck', 'captains_quarters', 'crew_quarters'],
            'frigate': ['main_deck', 'captains_quarters', 'crew_quarters', 'cargo_hold'],
            'galleon': ['main_deck', 'captains_quarters', 'crew_quarters', 'cargo_hold', 'galley'],
            'man_of_war': ['main_deck', 'captains_quarters', 'crew_quarters', 'cargo_hold', 'galley', 'gun_deck'],
            'legendary_flagship': ['main_deck', 'captains_quarters', 'crew_quarters', 'cargo_hold', 'galley', 'gun_deck']
        };

        const shipRooms = roomSizes[shipType] || roomSizes.sloop;
        const rooms = {};

        shipRooms.forEach(roomId => {
            rooms[roomId] = {
                ...this.config.shipRooms[roomId],
                furniture: [],
                layout: 'default'
            };
        });

        return rooms;
    }

    generateShipName(shipType) {
        const prefixes = ['HMS', 'SS', 'The', 'Captain\'s'];
        const adjectives = ['Swift', 'Mighty', 'Golden', 'Storm', 'Thunder', 'Sea', 'Black', 'Royal'];
        const nouns = ['Dragon', 'Kraken', 'Phoenix', 'Wave', 'Wind', 'Star', 'Pearl', 'Revenge', 'Fortune', 'Pride'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        
        return `${prefix} ${adjective} ${noun}`;
    }

    findShipById(shipId) {
        for (const [playerId, ships] of this.shipyardState.playerShips.entries()) {
            const ship = ships.find(s => s.id === shipId);
            if (ship) return ship;
        }
        return null;
    }

    async awardBuildingExperience(playerId, shipType, baseExperience) {
        const skills = ['coding', 'design', 'networking'];
        for (const skill of skills) {
            await this.gameEngine.awardExperience(playerId, skill, baseExperience);
        }
    }

    async awardCompletionExperience(playerId, shipType) {
        const completionBonus = 50;
        await this.gameEngine.awardExperience(playerId, 'leadership', completionBonus);
        await this.gameEngine.awardExperience(playerId, 'strategy', completionBonus);
    }

    // Placeholder methods for systems integration
    async checkAndAcquireMaterials(playerId, materials) {
        return { success: true, cost: 0, missing: [] };
    }

    async consumeMaterials(playerId, materials) {
        // Integrate with inventory system
    }

    validateFurniturePlacement(room, furniture) {
        return { valid: true };
    }

    findFurnitureByName(name) {
        for (const category of Object.values(this.config.shipFurniture)) {
            const item = category.find(f => f.name === name);
            if (item) return item;
        }
        return null;
    }

    placeFurniture(furnitureList) {
        return furnitureList.map(item => ({
            ...item,
            placed: Date.now(),
            position: { x: Math.random() * 100, y: Math.random() * 100 }
        }));
    }

    recalculateShipStats(ship) {
        // Recalculate based on current furniture and customizations
        let stats = { ...ship.stats };
        
        Object.values(ship.rooms).forEach(room => {
            room.furniture.forEach(furnitureItem => {
                const furniture = this.findFurnitureByName(furnitureItem.name);
                if (furniture && furniture.effect) {
                    Object.entries(furniture.effect).forEach(([stat, bonus]) => {
                        stats[stat] = (stats[stat] || 0) + bonus;
                    });
                }
            });
        });

        return stats;
    }

    calculateFleetStats(shipIds, allShips) {
        const fleetShips = shipIds.map(id => allShips.find(ship => ship.id === id)).filter(Boolean);
        
        return fleetShips.reduce((total, ship) => {
            Object.entries(ship.stats).forEach(([stat, value]) => {
                total[stat] = (total[stat] || 0) + value;
            });
            return total;
        }, {});
    }

    calculateBattleOutcome(attackingFleet, defendingFleet, strategy) {
        const attackPower = attackingFleet.stats.firepower + (attackingFleet.stats.maneuverability / 2);
        const defensePower = defendingFleet.stats.firepower + (defendingFleet.stats.durability / 2);
        
        const strategyModifier = {
            'aggressive_assault': 1.2,
            'defensive_positioning': 0.8,
            'tactical_maneuvering': 1.0,
            'negotiate_peace': 0.5
        };

        const finalAttackPower = attackPower * strategyModifier[strategy];
        const victor = finalAttackPower > defensePower ? attackingFleet.id : defendingFleet.id;
        
        return {
            victor,
            attackPower: finalAttackPower,
            defensePower,
            casualties: Math.floor(Math.random() * 20),
            loot: Math.floor(Math.random() * 1000)
        };
    }

    async applyBattleConsequences(battle) {
        // Apply damage, award experience, distribute loot
    }

    updateShipyardStatistics(buildProject) {
        this.shipyardState.totalDoubloonsSpent += this.config.shipTiers[buildProject.shipType].cost;
        
        // Update most popular ship type
        const shipCounts = {};
        for (const ships of this.shipyardState.playerShips.values()) {
            ships.forEach(ship => {
                shipCounts[ship.type] = (shipCounts[ship.type] || 0) + 1;
            });
        }
        
        const mostPopular = Object.entries(shipCounts)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (mostPopular) {
            this.shipyardState.mostPopularShipType = mostPopular[0];
        }
    }

    initializeShipTemplates() {
        // Create template ships for each type
        Object.keys(this.config.shipTiers).forEach(shipType => {
            const template = {
                type: shipType,
                tier: this.config.shipTiers[shipType],
                defaultCustomizations: this.getDefaultCustomizations(shipType),
                suggestedFurniture: this.getSuggestedFurniture(shipType)
            };
            
            this.shipyardState.shipTemplates.set(shipType, template);
        });
    }

    getDefaultCustomizations(shipType) {
        // Return appropriate default customizations for ship type
        return {
            hull: 'oak_hull',
            sails: 'basic_sails',
            figurehead: 'dragon',
            cannons: 'swivel_guns',
            cabin: 'hammock'
        };
    }

    getSuggestedFurniture(shipType) {
        // Return suggested furniture for ship type
        return [
            { name: 'Ship\'s Wheel', category: 'navigation' },
            { name: 'Captain\'s Bed', category: 'comfort' },
            { name: 'Jolly Roger Flag', category: 'decoration' }
        ];
    }

    startShipyardLoops() {
        // Build progress updates every 30 seconds
        setInterval(() => {
            this.updateBuildProgress();
        }, 30000);

        // Auto-save every 5 minutes
        setInterval(async () => {
            await this.saveShipyardState();
        }, 300000);
    }

    updateBuildProgress() {
        const now = Date.now();
        
        for (const [buildId, project] of this.shipyardState.buildQueue.entries()) {
            const elapsed = now - project.startTime;
            const totalTime = project.estimatedCompleteTime - project.startTime;
            const progress = Math.min(100, (elapsed / totalTime) * 100);
            
            project.progress = progress;
            
            if (progress >= 100 && project.status === 'in_progress') {
                project.status = 'ready';
                console.log(`🚢 ${project.shipType} build completed! (Build ID: ${buildId})`);
                
                this.emit('build_ready', {
                    buildId,
                    shipType: project.shipType,
                    playerId: project.playerId
                });
            }
        }
    }

    async loadShipyardState() {
        try {
            const statePath = path.join(this.config.shipDataPath, 'shipyard_state.json');
            const stateData = await fs.readFile(statePath, 'utf8');
            const saved = JSON.parse(stateData);
            
            // Restore Maps from arrays
            this.shipyardState.playerShips = new Map(saved.playerShips || []);
            this.shipyardState.buildQueue = new Map(saved.buildQueue || []);
            this.shipyardState.fleets = new Map(saved.fleets || []);
            this.shipyardState.tradeRoutes = new Map(saved.tradeRoutes || []);
            this.shipyardState.battleResults = new Map(saved.battleResults || []);
            
            // Restore other state
            this.shipyardState.totalShipsBuilt = saved.totalShipsBuilt || 0;
            this.shipyardState.totalDoubloonsSpent = saved.totalDoubloonsSpent || 0;
            this.shipyardState.mostPopularShipType = saved.mostPopularShipType || 'sloop';
            
            console.log('💾 Loaded shipyard state');
        } catch (error) {
            console.log('📝 No saved shipyard state, starting fresh');
        }
    }

    async saveShipyardState() {
        try {
            await fs.mkdir(this.config.shipDataPath, { recursive: true });
            
            const stateToSave = {
                playerShips: Array.from(this.shipyardState.playerShips.entries()),
                buildQueue: Array.from(this.shipyardState.buildQueue.entries()),
                fleets: Array.from(this.shipyardState.fleets.entries()),
                tradeRoutes: Array.from(this.shipyardState.tradeRoutes.entries()),
                battleResults: Array.from(this.shipyardState.battleResults.entries()),
                totalShipsBuilt: this.shipyardState.totalShipsBuilt,
                totalDoubloonsSpent: this.shipyardState.totalDoubloonsSpent,
                mostPopularShipType: this.shipyardState.mostPopularShipType,
                saved_at: new Date().toISOString()
            };
            
            const statePath = path.join(this.config.shipDataPath, 'shipyard_state.json');
            await fs.writeFile(statePath, JSON.stringify(stateToSave, null, 2));
        } catch (error) {
            console.error('Failed to save shipyard state:', error);
        }
    }

    // Public API methods
    getShipyardStatus() {
        return {
            shipyard: {
                name: this.config.shipyardName,
                totalShipsBuilt: this.shipyardState.totalShipsBuilt,
                activeBuilds: this.shipyardState.buildQueue.size,
                totalFleets: this.shipyardState.fleets.size
            },
            statistics: {
                totalDoubloonsSpent: this.shipyardState.totalDoubloonsSpent,
                mostPopularShip: this.shipyardState.mostPopularShipType,
                averageBuildTime: this.shipyardState.averageBuildTime
            },
            availableShips: Object.keys(this.config.shipTiers),
            currentProjects: Array.from(this.shipyardState.activeProjects.values())
        };
    }

    getPlayerFleet(playerId) {
        const ships = this.shipyardState.playerShips.get(playerId) || [];
        const fleets = Array.from(this.shipyardState.fleets.values())
            .filter(fleet => fleet.admiral === playerId);
        
        return {
            ships,
            fleets,
            totalShips: ships.length,
            totalFleets: fleets.length
        };
    }
}

// Testing and demonstration
if (require.main === module) {
    async function demonstrateShipBuilder() {
        const shipBuilder = new PirateShipBuilder();
        
        shipBuilder.on('shipyard_opened', async (data) => {
            console.log('\n🏴‍☠️⚓ PIRATE SHIP BUILDER DEMO\n');
            
            // Create a test player
            const playerId = 'test_captain';
            
            // Simulate building a ship
            console.log('🛠️ Starting ship build...');
            const buildResult = await shipBuilder.startShipBuild(playerId, {
                shipType: 'sloop',
                customizations: {
                    hull: 'mahogany_hull',
                    sails: 'square_rigged',
                    figurehead: 'dragon'
                },
                furniture: [
                    { name: 'Ship\'s Wheel' },
                    { name: 'Captain\'s Bed' },
                    { name: 'Jolly Roger Flag' }
                ],
                expediteWithDoubloons: true
            });
            
            if (buildResult.success) {
                console.log('✅ Build started successfully!');
                console.log(`Build ID: ${buildResult.buildProject.id}`);
                
                // Wait a moment then complete the build
                setTimeout(async () => {
                    console.log('\n🚢 Completing ship build...');
                    const ship = await shipBuilder.completeShipBuild(buildResult.buildProject.id);
                    console.log(`✅ Ship completed: ${ship.ship.name}`);
                    
                    // Create a fleet
                    console.log('\n⚓ Creating fleet...');
                    const fleet = await shipBuilder.createFleet(playerId, {
                        name: 'Digital Buccaneers',
                        ships: [ship.ship.id],
                        purpose: 'exploration',
                        strategy: 'balanced'
                    });
                    
                    console.log(`✅ Fleet created: ${fleet.fleet.name}`);
                    console.log('\n📊 Final Status:');
                    console.log(JSON.stringify(shipBuilder.getShipyardStatus(), null, 2));
                }, 2000);
            } else {
                console.log('❌ Build failed:', buildResult.reason);
            }
        });
        
        shipBuilder.on('ship_build_completed', (data) => {
            console.log(`🎉 Ship "${data.ship.name}" completed for ${data.playerId}!`);
        });
        
        shipBuilder.on('fleet_created', (data) => {
            console.log(`⚓ Fleet "${data.fleet.name}" created with strategy: ${data.strategy}`);
        });
    }
    
    demonstrateShipBuilder().catch(console.error);
}

module.exports = PirateShipBuilder;