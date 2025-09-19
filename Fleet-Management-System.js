#!/usr/bin/env node

/**
 * ⚓🚢 FLEET MANAGEMENT SYSTEM
 * 
 * Advanced multi-ship operations system that manages entire fleets of pirate 
 * vessels for coordinated trading, exploration, and battles. Extends the 
 * Pirate Ship Builder with fleet-level strategy and operations.
 * 
 * Features:
 * - Multi-ship fleet coordination and strategy
 * - Trade route optimization and automation
 * - Fleet battle tactics and formations
 * - Resource sharing and logistics management
 * - Performance analytics and fleet optimization
 * - Integration with animal wisdom for fleet decisions
 * - Low-temperature fleet management (simple, stress-free operations)
 * 
 * Philosophy: "simple adult stuff" - managing complexity through clear 
 * organization and animal wisdom guidance, making fleet operations 
 * intuitive rather than overwhelming.
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// Import our ecosystem components
const FrogBrainDecisionEngine = require('./Frog-Brain-Decision-Engine');
const PirateShipBuilder = require('./Pirate-Ship-Builder');

class FleetManagementSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Fleet management settings
            fleetDataPath: './fleet_management_data/',
            maxFleetSize: 12,
            maxTotalFleets: 5,
            
            // Fleet formations and tactics
            fleetFormations: {
                'line_of_battle': {
                    name: 'Line of Battle',
                    description: 'Ships arranged in a single line for maximum firepower',
                    requirements: { min_ships: 3, ship_types: ['frigate', 'galleon', 'man_of_war'] },
                    bonuses: { firepower: 1.3, range: 1.2 },
                    weaknesses: { maneuverability: 0.7, speed: 0.8 }
                },
                'crescent_formation': {
                    name: 'Crescent Formation',
                    description: 'Ships arranged in a crescent to envelop enemy forces',
                    requirements: { min_ships: 4, ship_types: ['sloop', 'brigantine', 'frigate'] },
                    bonuses: { maneuverability: 1.4, flanking: 1.5 },
                    weaknesses: { center_vulnerability: 0.6 }
                },
                'diamond_formation': {
                    name: 'Diamond Formation',
                    description: 'Balanced formation with flagship at center',
                    requirements: { min_ships: 5, flagship: true },
                    bonuses: { coordination: 1.3, defense: 1.2, command: 1.4 },
                    weaknesses: { speed: 0.9 }
                },
                'wolf_pack': {
                    name: 'Wolf Pack',
                    description: 'Fast, independent ships for hit-and-run tactics',
                    requirements: { min_ships: 3, max_ships: 6, ship_types: ['sloop', 'brigantine'] },
                    bonuses: { speed: 1.5, surprise: 1.6, evasion: 1.4 },
                    weaknesses: { sustained_combat: 0.7 }
                },
                'merchant_convoy': {
                    name: 'Merchant Convoy',
                    description: 'Protected trading formation with escorts',
                    requirements: { min_ships: 3, escort_ratio: 0.3 },
                    bonuses: { cargo_capacity: 1.4, trade_efficiency: 1.3, protection: 1.2 },
                    weaknesses: { speed: 0.8, combat_flexibility: 0.6 }
                }
            },
            
            // Trade route types
            tradeRoutes: {
                'coastal_trading': {
                    name: 'Coastal Trading Route',
                    distance: 'short',
                    risk: 'low',
                    profit_margin: 0.15,
                    duration: '2-4 hours',
                    requirements: { min_cargo: 50, max_risk_ships: 2 }
                },
                'inter_island': {
                    name: 'Inter-Island Commerce',
                    distance: 'medium',
                    risk: 'moderate', 
                    profit_margin: 0.25,
                    duration: '6-12 hours',
                    requirements: { min_cargo: 100, escorts: 1 }
                },
                'deep_ocean': {
                    name: 'Deep Ocean Trading',
                    distance: 'long',
                    risk: 'high',
                    profit_margin: 0.45,
                    duration: '1-3 days',
                    requirements: { min_cargo: 200, escorts: 2, flagship: true }
                },
                'treasure_hunting': {
                    name: 'Treasure Expedition',
                    distance: 'variable',
                    risk: 'very_high',
                    profit_margin: 0.80,
                    duration: '2-7 days',
                    requirements: { exploration_ships: 2, combat_ships: 3 }
                }
            },
            
            // Fleet roles and specializations
            fleetRoles: {
                'trading_fleet': {
                    focus: 'commerce',
                    ideal_ships: ['galleon', 'man_of_war'],
                    formation: 'merchant_convoy',
                    priorities: ['cargo_capacity', 'protection', 'efficiency']
                },
                'exploration_fleet': {
                    focus: 'discovery',
                    ideal_ships: ['brigantine', 'frigate'],
                    formation: 'diamond_formation',
                    priorities: ['range', 'navigation', 'adaptability']
                },
                'combat_fleet': {
                    focus: 'warfare',
                    ideal_ships: ['frigate', 'man_of_war', 'legendary_flagship'],
                    formation: 'line_of_battle',
                    priorities: ['firepower', 'armor', 'coordination']
                },
                'raiding_fleet': {
                    focus: 'piracy',
                    ideal_ships: ['sloop', 'brigantine'],
                    formation: 'wolf_pack',
                    priorities: ['speed', 'stealth', 'surprise']
                },
                'diplomatic_fleet': {
                    focus: 'relations',
                    ideal_ships: ['legendary_flagship', 'galleon'],
                    formation: 'diamond_formation',
                    priorities: ['prestige', 'luxury', 'communication']
                }
            },
            
            // Performance metrics
            performanceMetrics: {
                'efficiency': ['cargo_per_time', 'fuel_consumption', 'route_optimization'],
                'profitability': ['profit_per_voyage', 'risk_adjusted_returns', 'operational_costs'],
                'tactical': ['battle_win_rate', 'formation_effectiveness', 'coordination_score'],
                'safety': ['accident_rate', 'crew_satisfaction', 'maintenance_needs'],
                'reputation': ['diplomatic_standing', 'trade_relationships', 'fear_factor']
            },
            
            ...config
        };

        // Initialize subsystems
        this.frogBrain = new FrogBrainDecisionEngine();
        this.shipBuilder = new PirateShipBuilder();

        // Fleet management state
        this.fleetState = {
            activeFleets: new Map(),          // fleetId -> fleet data
            fleetPerformance: new Map(),      // fleetId -> performance metrics
            tradeRouteData: new Map(),        // routeId -> route performance
            battleHistory: new Map(),         // battleId -> battle record
            
            // Fleet operations
            activeOperations: new Map(),      // operationId -> operation status
            scheduledMissions: new Map(),     // missionId -> mission data
            logisticsNetwork: new Map(),      // networkId -> logistics data
            
            // Analytics and optimization
            fleetAnalytics: {
                totalProfits: 0,
                totalBattles: 0,
                winRate: 0,
                mostProfitableRoute: null,
                topPerformingFleet: null,
                efficiencyTrends: []
            },
            
            // Current status
            globalFleetStatus: {
                fleetsAtSea: 0,
                fleetsInPort: 0,
                totalCargo: 0,
                totalFirepower: 0,
                diplomaticStanding: new Map()
            }
        };

        this.initialize();
    }

    async initialize() {
        console.log('⚓🚢 Initializing Fleet Management System...');
        console.log('🌊 Coordinating multi-ship operations across the digital seas...');
        console.log('📈 Optimizing trade routes and battle formations...');
        
        try {
            // Load fleet state
            await this.loadFleetState();
            
            // Initialize fleet analytics
            this.initializeFleetAnalytics();
            
            // Set up operation loops
            this.startOperationLoops();
            
            // Connect to ship builder
            this.connectToShipBuilder();
            
            console.log('✅ Fleet Management System ready!');
            console.log(`⚓ Managing ${this.fleetState.activeFleets.size} active fleets`);
            console.log(`💰 Total profits: ${this.fleetState.fleetAnalytics.totalProfits} doubloons`);
            console.log(`⚔️ Battle win rate: ${(this.fleetState.fleetAnalytics.winRate * 100).toFixed(1)}%`);
            
            this.emit('fleet_system_ready', {
                activeFleets: this.fleetState.activeFleets.size,
                totalProfits: this.fleetState.fleetAnalytics.totalProfits,
                winRate: this.fleetState.fleetAnalytics.winRate
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize fleet management:', error);
            throw error;
        }
    }

    /**
     * Create a specialized fleet with specific role and strategy
     */
    async createSpecializedFleet(fleetRequest) {
        const { name, role, ships, admiral, strategy } = fleetRequest;

        console.log(`⚓ Creating ${role} fleet: "${name}"`);

        // Validate fleet composition
        const roleConfig = this.config.fleetRoles[role];
        if (!roleConfig) {
            throw new Error(`Unknown fleet role: ${role}`);
        }

        // Use frog brain to optimize fleet composition
        const fleetDecision = await this.frogBrain.resolveDecision({
            type: 'fleet_composition_optimization',
            context: `Creating ${role} fleet with ${ships.length} ships`,
            options: {
                'role_optimized': { pros: ['specialized_efficiency', 'role_mastery'], cons: ['limited_flexibility'] },
                'balanced_approach': { pros: ['versatility', 'adaptability'], cons: ['less_specialization'] },
                'innovative_hybrid': { pros: ['unique_advantages', 'surprise_factor'], cons: ['unproven_tactics'] },
                'traditional_proven': { pros: ['time_tested', 'reliable_results'], cons: ['predictable_limitations'] }
            },
            playerPreferences: {
                risk_tolerance: 'low_temperature',
                focus: 'steady_performance'
            }
        });

        // Analyze ship composition for role fitness
        const compositionAnalysis = this.analyzeFleetComposition(ships, roleConfig);
        
        // Suggest optimal formation
        const optimalFormation = this.suggestOptimalFormation(ships, role, fleetDecision.choice);

        // Create fleet object
        const fleet = {
            id: crypto.randomUUID(),
            name,
            role,
            admiral,
            ships: ships.map(ship => ({
                ...ship,
                fleetRole: this.assignShipRole(ship, role),
                fleetPosition: this.assignFleetPosition(ship, optimalFormation)
            })),
            
            // Fleet configuration
            formation: optimalFormation,
            strategy: fleetDecision.choice,
            created: Date.now(),
            
            // Performance data
            stats: this.calculateFleetStats(ships, optimalFormation),
            experience: 0,
            level: 1,
            reputation: new Map(),
            
            // Operational data
            currentMission: null,
            location: 'home_port',
            status: 'ready',
            lastMissionCompleted: null,
            
            // Fleet composition analysis
            composition: compositionAnalysis,
            effectiveness: this.calculateFleetEffectiveness(ships, role, optimalFormation),
            
            // Logistics
            supplies: {
                food: 100,
                water: 100,
                ammunition: 100,
                repairs: 100
            },
            
            // History
            missions: [],
            battles: [],
            trades: []
        };

        // Store fleet
        this.fleetState.activeFleets.set(fleet.id, fleet);

        // Initialize performance tracking
        this.initializeFleetPerformanceTracking(fleet.id);

        console.log(`✅ Fleet "${name}" created successfully!`);
        console.log(`🎯 Role: ${role} | Formation: ${optimalFormation.name}`);
        console.log(`💪 Effectiveness: ${(fleet.effectiveness * 100).toFixed(1)}%`);
        console.log(`🧠 Frog brain strategy: ${fleetDecision.choice}`);

        this.emit('fleet_created', {
            fleet,
            strategy: fleetDecision.choice,
            formation: optimalFormation,
            frogWisdom: fleetDecision.animalWisdom
        });

        return {
            success: true,
            fleet,
            strategy: fleetDecision.choice,
            formation: optimalFormation,
            effectiveness: fleet.effectiveness,
            recommendations: this.generateFleetRecommendations(fleet)
        };
    }

    /**
     * Launch a fleet mission (trading, exploration, combat)
     */
    async launchFleetMission(fleetId, missionRequest) {
        const { type, destination, objectives, duration, riskTolerance } = missionRequest;
        
        const fleet = this.fleetState.activeFleets.get(fleetId);
        if (!fleet) {
            throw new Error('Fleet not found');
        }

        if (fleet.status !== 'ready') {
            throw new Error(`Fleet is currently ${fleet.status}`);
        }

        console.log(`🚀 Launching ${type} mission for fleet "${fleet.name}"`);

        // Use frog brain to assess mission viability
        const missionDecision = await this.frogBrain.resolveDecision({
            type: 'mission_planning',
            context: `Planning ${type} mission to ${destination}`,
            options: {
                'aggressive_approach': { pros: ['high_rewards', 'quick_completion'], cons: ['high_risk', 'potential_losses'] },
                'cautious_approach': { pros: ['safety_first', 'predictable_outcomes'], cons: ['lower_rewards', 'slower_progress'] },
                'balanced_strategy': { pros: ['good_risk_reward', 'flexible_execution'], cons: ['moderate_everything'] },
                'innovative_tactics': { pros: ['unexpected_advantages', 'learning_opportunities'], cons: ['unknown_variables'] }
            },
            playerPreferences: {
                risk_tolerance: riskTolerance || 'low_temperature',
                focus: 'sustainable_operations'
            }
        });

        // Calculate mission parameters
        const missionPlan = this.createMissionPlan(fleet, type, destination, objectives, missionDecision.choice);
        
        // Validate mission feasibility
        const feasibilityCheck = this.validateMissionFeasibility(fleet, missionPlan);
        if (!feasibilityCheck.feasible) {
            return {
                success: false,
                reason: feasibilityCheck.reason,
                recommendations: feasibilityCheck.recommendations
            };
        }

        // Create mission object
        const mission = {
            id: crypto.randomUUID(),
            fleetId,
            type,
            destination,
            objectives,
            strategy: missionDecision.choice,
            plan: missionPlan,
            
            // Timing
            launched: Date.now(),
            estimatedCompletion: Date.now() + duration,
            actualCompletion: null,
            
            // Progress tracking
            progress: 0,
            currentPhase: missionPlan.phases[0],
            phasesCompleted: [],
            
            // Mission status
            status: 'in_progress',
            risks: missionPlan.risks,
            opportunities: missionPlan.opportunities,
            
            // Results (to be filled during mission)
            results: null,
            profitLoss: 0,
            experienceGained: 0,
            casualties: 0,
            
            // Animal wisdom application
            animalWisdom: missionDecision.animalWisdom
        };

        // Launch the mission
        fleet.status = 'on_mission';
        fleet.currentMission = mission.id;
        fleet.location = 'at_sea';

        // Store mission
        this.fleetState.activeOperations.set(mission.id, mission);

        // Start mission simulation
        this.startMissionSimulation(mission);

        console.log(`⚓ Mission launched successfully!`);
        console.log(`🎯 Strategy: ${missionDecision.choice}`);
        console.log(`⏱️ Estimated duration: ${Math.round(duration / (60 * 60 * 1000))} hours`);

        this.emit('mission_launched', {
            mission,
            fleet,
            strategy: missionDecision.choice,
            frogWisdom: missionDecision.animalWisdom
        });

        return {
            success: true,
            mission,
            strategy: missionDecision.choice,
            estimatedCompletion: mission.estimatedCompletion,
            missionPlan
        };
    }

    /**
     * Coordinate multiple fleets for large operations
     */
    async coordinateFleetOperation(operationRequest) {
        const { name, type, fleetIds, objectives, coordination } = operationRequest;

        console.log(`🌊 Coordinating multi-fleet operation: "${name}"`);

        // Validate all fleets exist and are available
        const fleets = fleetIds.map(id => this.fleetState.activeFleets.get(id))
            .filter(fleet => fleet);

        if (fleets.length !== fleetIds.length) {
            throw new Error('Some fleets not found or unavailable');
        }

        // Use frog brain for coordination strategy
        const coordinationDecision = await this.frogBrain.resolveDecision({
            type: 'multi_fleet_coordination',
            context: `Coordinating ${fleets.length} fleets for ${type} operation`,
            options: {
                'centralized_command': { pros: ['unified_strategy', 'tight_coordination'], cons: ['single_point_failure', 'slow_adaptation'] },
                'distributed_command': { pros: ['flexible_response', 'independent_action'], cons: ['coordination_challenges', 'conflicting_objectives'] },
                'hybrid_command': { pros: ['balanced_control', 'adaptive_coordination'], cons: ['complexity_overhead'] },
                'animal_wisdom_guided': { pros: ['intuitive_coordination', 'natural_patterns'], cons: ['less_systematic'] }
            },
            playerPreferences: {
                coordination_style: 'low_temperature',
                focus: 'minimize_confusion'
            }
        });

        // Create operation plan
        const operation = {
            id: crypto.randomUUID(),
            name,
            type,
            fleets: fleets.map(fleet => ({
                id: fleet.id,
                name: fleet.name,
                role: this.assignOperationRole(fleet, type),
                position: this.assignOperationPosition(fleet, coordination)
            })),
            
            // Coordination
            commandStructure: coordinationDecision.choice,
            coordinationPlan: this.createCoordinationPlan(fleets, coordinationDecision.choice),
            
            // Operation details
            objectives,
            launched: Date.now(),
            status: 'active',
            progress: 0,
            
            // Performance tracking
            efficiency: 0,
            coordination_score: 0,
            
            // Results
            completed: false,
            success: false,
            results: null,
            
            // Animal wisdom
            animalWisdom: coordinationDecision.animalWisdom
        };

        // Update fleet statuses
        fleets.forEach(fleet => {
            fleet.status = 'coordinated_operation';
            fleet.currentOperation = operation.id;
        });

        // Store operation
        this.fleetState.activeOperations.set(operation.id, operation);

        // Start operation simulation
        this.startOperationSimulation(operation);

        console.log(`✅ Multi-fleet operation launched!`);
        console.log(`🎯 Command structure: ${coordinationDecision.choice}`);
        console.log(`⚓ Coordinating ${fleets.length} fleets`);

        this.emit('fleet_operation_launched', {
            operation,
            commandStructure: coordinationDecision.choice,
            fleetCount: fleets.length
        });

        return {
            success: true,
            operation,
            commandStructure: coordinationDecision.choice,
            coordinationPlan: operation.coordinationPlan
        };
    }

    /**
     * Optimize fleet performance and trade routes
     */
    async optimizeFleetPerformance(fleetId) {
        const fleet = this.fleetState.activeFleets.get(fleetId);
        if (!fleet) {
            throw new Error('Fleet not found');
        }

        console.log(`📈 Optimizing performance for fleet "${fleet.name}"`);

        // Analyze current performance
        const performance = this.fleetState.fleetPerformance.get(fleetId);
        const performanceAnalysis = this.analyzeFleetPerformance(performance);

        // Use frog brain for optimization strategy
        const optimizationDecision = await this.frogBrain.resolveDecision({
            type: 'fleet_optimization',
            context: `Optimizing ${fleet.role} fleet performance`,
            options: {
                'efficiency_focus': { pros: ['cost_reduction', 'speed_improvement'], cons: ['reduced_flexibility'] },
                'profit_maximization': { pros: ['higher_returns', 'growth_acceleration'], cons: ['increased_risk'] },
                'safety_enhancement': { pros: ['reduced_losses', 'crew_satisfaction'], cons: ['conservative_growth'] },
                'balanced_optimization': { pros: ['sustainable_improvement', 'risk_management'], cons: ['moderate_gains'] }
            },
            playerPreferences: {
                optimization_style: 'low_temperature',
                focus: 'sustainable_performance'
            }
        });

        // Generate optimization recommendations
        const optimizations = this.generateOptimizationRecommendations(
            fleet,
            performanceAnalysis,
            optimizationDecision.choice
        );

        // Apply selected optimizations
        const results = await this.applyOptimizations(fleet, optimizations);

        console.log(`✅ Fleet optimization complete!`);
        console.log(`🎯 Strategy: ${optimizationDecision.choice}`);
        console.log(`📊 Performance improvement: ${results.improvementPercentage.toFixed(1)}%`);

        this.emit('fleet_optimized', {
            fleetId,
            strategy: optimizationDecision.choice,
            improvements: results,
            frogWisdom: optimizationDecision.animalWisdom
        });

        return {
            success: true,
            strategy: optimizationDecision.choice,
            optimizations,
            results,
            projectedImprovement: results.improvementPercentage
        };
    }

    /**
     * Generate comprehensive fleet analytics
     */
    generateFleetAnalytics() {
        console.log('📊 Generating comprehensive fleet analytics...');

        const analytics = {
            overview: {
                totalFleets: this.fleetState.activeFleets.size,
                totalShips: this.getTotalShips(),
                totalFirepower: this.getTotalFirepower(),
                totalCargoCapacity: this.getTotalCargoCapacity()
            },
            
            performance: {
                overallProfitability: this.calculateOverallProfitability(),
                averageEfficiency: this.calculateAverageEfficiency(),
                battleSuccessRate: this.fleetState.fleetAnalytics.winRate,
                topPerformers: this.getTopPerformingFleets()
            },
            
            operations: {
                activeMissions: this.fleetState.activeOperations.size,
                completedMissions: this.getCompletedMissionsCount(),
                averageMissionDuration: this.getAverageMissionDuration(),
                missionSuccessRate: this.getMissionSuccessRate()
            },
            
            fleet_composition: this.analyzeFleetCompositionTrends(),
            trade_routes: this.analyzeTradeRoutePerformance(),
            battle_history: this.analyzeBattleHistory(),
            
            recommendations: this.generateSystemRecommendations(),
            
            generated_at: Date.now()
        };

        console.log(`📈 Analytics complete - managing ${analytics.overview.totalFleets} fleets`);
        console.log(`💰 Overall profitability: ${(analytics.performance.overallProfitability * 100).toFixed(1)}%`);

        return analytics;
    }

    /**
     * Helper methods for fleet operations
     */
    analyzeFleetComposition(ships, roleConfig) {
        const analysis = {
            totalShips: ships.length,
            shipTypes: {},
            roleAlignment: 0,
            strengths: [],
            weaknesses: [],
            recommendations: []
        };

        // Count ship types
        ships.forEach(ship => {
            analysis.shipTypes[ship.type] = (analysis.shipTypes[ship.type] || 0) + 1;
        });

        // Calculate role alignment
        const idealShips = roleConfig.ideal_ships;
        const alignedShips = ships.filter(ship => idealShips.includes(ship.type)).length;
        analysis.roleAlignment = alignedShips / ships.length;

        // Identify strengths and weaknesses
        if (analysis.roleAlignment > 0.7) {
            analysis.strengths.push('Well-aligned with role requirements');
        } else {
            analysis.weaknesses.push('Ship composition not optimal for role');
            analysis.recommendations.push(`Consider adding more ${idealShips.join(', ')} ships`);
        }

        return analysis;
    }

    suggestOptimalFormation(ships, role, strategy) {
        const roleConfig = this.config.fleetRoles[role];
        const defaultFormation = this.config.fleetFormations[roleConfig.formation];
        
        // Check if ships meet formation requirements
        const meetsRequirements = this.checkFormationRequirements(ships, defaultFormation);
        
        if (meetsRequirements) {
            return defaultFormation;
        }

        // Find alternative formations that work with available ships
        for (const [formationName, formation] of Object.entries(this.config.fleetFormations)) {
            if (this.checkFormationRequirements(ships, formation)) {
                return formation;
            }
        }

        // Fallback to basic formation
        return this.config.fleetFormations.diamond_formation;
    }

    checkFormationRequirements(ships, formation) {
        const reqs = formation.requirements;
        
        // Check minimum ships
        if (ships.length < reqs.min_ships) return false;
        
        // Check maximum ships
        if (reqs.max_ships && ships.length > reqs.max_ships) return false;
        
        // Check ship types
        if (reqs.ship_types) {
            const hasRequiredTypes = reqs.ship_types.some(type => 
                ships.some(ship => ship.type === type)
            );
            if (!hasRequiredTypes) return false;
        }
        
        // Check flagship requirement
        if (reqs.flagship) {
            const hasFlagship = ships.some(ship => 
                ship.type === 'legendary_flagship' || ship.stats.command_bonus > 5
            );
            if (!hasFlagship) return false;
        }
        
        return true;
    }

    assignShipRole(ship, fleetRole) {
        const roleAssignments = {
            'trading_fleet': {
                'galleon': 'cargo_hauler',
                'man_of_war': 'escort',
                'frigate': 'scout',
                'brigantine': 'support'
            },
            'exploration_fleet': {
                'brigantine': 'explorer',
                'frigate': 'flagship',
                'sloop': 'scout',
                'galleon': 'supply_ship'
            },
            'combat_fleet': {
                'man_of_war': 'heavy_combat',
                'frigate': 'line_ship',
                'legendary_flagship': 'command_ship',
                'brigantine': 'support'
            }
        };

        const assignments = roleAssignments[fleetRole];
        return assignments ? assignments[ship.type] || 'general_purpose' : 'general_purpose';
    }

    assignFleetPosition(ship, formation) {
        // Assign positions based on ship capabilities and formation requirements
        const positions = ['vanguard', 'center', 'rear_guard', 'flanks'];
        
        if (ship.stats.speed > 60) return 'vanguard';
        if (ship.stats.firepower > 100) return 'center';
        if (ship.stats.cargo > 200) return 'rear_guard';
        
        return 'flanks';
    }

    calculateFleetStats(ships, formation) {
        const baseStats = ships.reduce((total, ship) => {
            Object.entries(ship.stats).forEach(([stat, value]) => {
                total[stat] = (total[stat] || 0) + value;
            });
            return total;
        }, {});

        // Apply formation bonuses
        Object.entries(formation.bonuses || {}).forEach(([stat, multiplier]) => {
            if (baseStats[stat]) {
                baseStats[stat] = Math.floor(baseStats[stat] * multiplier);
            }
        });

        // Apply formation weaknesses
        Object.entries(formation.weaknesses || {}).forEach(([stat, multiplier]) => {
            if (baseStats[stat]) {
                baseStats[stat] = Math.floor(baseStats[stat] * multiplier);
            }
        });

        return baseStats;
    }

    calculateFleetEffectiveness(ships, role, formation) {
        let effectiveness = 0.5; // Base effectiveness
        
        // Role alignment bonus
        const roleConfig = this.config.fleetRoles[role];
        const alignedShips = ships.filter(ship => 
            roleConfig.ideal_ships.includes(ship.type)
        ).length;
        effectiveness += (alignedShips / ships.length) * 0.3;
        
        // Formation compatibility
        if (this.checkFormationRequirements(ships, formation)) {
            effectiveness += 0.2;
        }
        
        // Fleet size optimization
        const optimalSize = 6;
        const sizeEfficiency = 1 - Math.abs(ships.length - optimalSize) / optimalSize * 0.5;
        effectiveness *= sizeEfficiency;
        
        return Math.min(1.0, Math.max(0.1, effectiveness));
    }

    createMissionPlan(fleet, type, destination, objectives, strategy) {
        const plan = {
            phases: this.generateMissionPhases(type, destination),
            timeline: this.calculateMissionTimeline(fleet, type, destination),
            resources: this.calculateRequiredResources(fleet, type),
            risks: this.identifyMissionRisks(fleet, type, destination),
            opportunities: this.identifyMissionOpportunities(fleet, type, destination),
            contingencies: this.createContingencyPlans(fleet, type)
        };

        // Adjust plan based on strategy
        this.adjustPlanForStrategy(plan, strategy);

        return plan;
    }

    validateMissionFeasibility(fleet, plan) {
        const checks = {
            supplies: this.checkSupplyAdequacy(fleet, plan.resources),
            crew: this.checkCrewReadiness(fleet),
            weather: this.checkWeatherConditions(),
            diplomatic: this.checkDiplomaticStanding(fleet)
        };

        const feasible = Object.values(checks).every(check => check.passed);

        return {
            feasible,
            reason: feasible ? null : this.identifyBlockingIssues(checks),
            recommendations: this.generateFeasibilityRecommendations(checks)
        };
    }

    startMissionSimulation(mission) {
        // Simulate mission progress over time
        const progressInterval = setInterval(async () => {
            mission.progress = Math.min(100, mission.progress + Math.random() * 10);
            
            if (mission.progress >= 100) {
                clearInterval(progressInterval);
                await this.completeMission(mission);
            }
            
            // Random events during mission
            if (Math.random() < 0.1) {
                await this.handleMissionEvent(mission);
            }
        }, 30000); // Update every 30 seconds
    }

    async completeMission(mission) {
        const fleet = this.fleetState.activeFleets.get(mission.fleetId);
        
        // Calculate mission results
        const results = this.calculateMissionResults(mission, fleet);
        
        // Update mission
        mission.status = 'completed';
        mission.actualCompletion = Date.now();
        mission.results = results;
        
        // Update fleet
        fleet.status = 'ready';
        fleet.currentMission = null;
        fleet.location = 'home_port';
        fleet.experience += results.experienceGained;
        fleet.missions.push(mission.id);
        
        // Update analytics
        this.updateFleetAnalytics(fleet, mission, results);
        
        console.log(`✅ Mission completed: ${mission.type}`);
        console.log(`💰 Profit: ${results.profitLoss} doubloons`);
        
        this.emit('mission_completed', {
            mission,
            fleet,
            results
        });
    }

    // Analytics and optimization methods
    generateOptimizationRecommendations(fleet, analysis, strategy) {
        const recommendations = [];
        
        // Based on strategy, generate specific recommendations
        switch (strategy) {
            case 'efficiency_focus':
                recommendations.push({
                    type: 'route_optimization',
                    description: 'Optimize trade routes for shortest paths',
                    impact: 'medium',
                    cost: 'low'
                });
                break;
                
            case 'profit_maximization':
                recommendations.push({
                    type: 'cargo_upgrade',
                    description: 'Upgrade ships for higher cargo capacity',
                    impact: 'high',
                    cost: 'high'
                });
                break;
                
            case 'safety_enhancement':
                recommendations.push({
                    type: 'escort_increase',
                    description: 'Add more escort vessels for protection',
                    impact: 'medium',
                    cost: 'medium'
                });
                break;
        }
        
        return recommendations;
    }

    async applyOptimizations(fleet, optimizations) {
        let totalImprovement = 0;
        const appliedOptimizations = [];

        for (const optimization of optimizations) {
            const result = await this.applyOptimization(fleet, optimization);
            if (result.success) {
                totalImprovement += result.improvement;
                appliedOptimizations.push(optimization);
            }
        }

        return {
            appliedOptimizations,
            improvementPercentage: totalImprovement,
            newEffectiveness: fleet.effectiveness + (totalImprovement / 100)
        };
    }

    async applyOptimization(fleet, optimization) {
        // Apply specific optimization based on type
        switch (optimization.type) {
            case 'route_optimization':
                return this.optimizeRoutes(fleet);
            case 'cargo_upgrade':
                return this.upgradeCargo(fleet);
            case 'escort_increase':
                return this.addEscorts(fleet);
            default:
                return { success: false, improvement: 0 };
        }
    }

    // State management and data persistence
    initializeFleetPerformanceTracking(fleetId) {
        this.fleetState.fleetPerformance.set(fleetId, {
            missionsCompleted: 0,
            totalProfit: 0,
            battleWins: 0,
            battleLosses: 0,
            averageEfficiency: 0,
            lastUpdated: Date.now()
        });
    }

    analyzeFleetPerformance(performance) {
        if (!performance) return null;
        
        return {
            profitability: performance.totalProfit / Math.max(1, performance.missionsCompleted),
            winRate: performance.battleWins / Math.max(1, performance.battleWins + performance.battleLosses),
            efficiency: performance.averageEfficiency,
            activity: performance.missionsCompleted,
            trend: 'stable' // Would calculate actual trend from historical data
        };
    }

    // Placeholder methods for complex operations
    generateMissionPhases(type, destination) {
        return ['preparation', 'departure', 'navigation', 'arrival', 'objective_execution', 'return'];
    }

    calculateMissionTimeline(fleet, type, destination) {
        return { estimated: '2-6 hours', phases: {} };
    }

    calculateRequiredResources(fleet, type) {
        return { supplies: 'moderate', crew: 'full', ammunition: type === 'combat' ? 'high' : 'low' };
    }

    identifyMissionRisks(fleet, type, destination) {
        return ['weather', 'pirates', 'mechanical_failure'];
    }

    identifyMissionOpportunities(fleet, type, destination) {
        return ['unexpected_treasure', 'new_trade_contacts', 'exploration_discoveries'];
    }

    createContingencyPlans(fleet, type) {
        return { emergency_return: 'enabled', distress_signals: 'configured' };
    }

    adjustPlanForStrategy(plan, strategy) {
        // Modify plan based on chosen strategy
    }

    // Utility methods
    getTotalShips() {
        return Array.from(this.fleetState.activeFleets.values())
            .reduce((total, fleet) => total + fleet.ships.length, 0);
    }

    getTotalFirepower() {
        return Array.from(this.fleetState.activeFleets.values())
            .reduce((total, fleet) => total + (fleet.stats.firepower || 0), 0);
    }

    getTotalCargoCapacity() {
        return Array.from(this.fleetState.activeFleets.values())
            .reduce((total, fleet) => total + (fleet.stats.cargo || 0), 0);
    }

    connectToShipBuilder() {
        this.shipBuilder.on('fleet_created', (data) => {
            console.log(`🚢 New fleet detected: ${data.fleet.name}`);
        });

        this.shipBuilder.on('battle_completed', (data) => {
            this.handleBattleResult(data.battle);
        });
    }

    handleBattleResult(battle) {
        // Update fleet battle statistics
        const fleetId = battle.fleets.attacker;
        const performance = this.fleetState.fleetPerformance.get(fleetId);
        
        if (performance) {
            if (battle.result.victor === fleetId) {
                performance.battleWins++;
            } else {
                performance.battleLosses++;
            }
        }
    }

    initializeFleetAnalytics() {
        console.log('📊 Initializing fleet analytics...');
    }

    startOperationLoops() {
        // Performance analytics update every 10 minutes
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 10 * 60 * 1000);

        // Save fleet state every 5 minutes
        setInterval(async () => {
            await this.saveFleetState();
        }, 5 * 60 * 1000);
    }

    updatePerformanceMetrics() {
        // Update overall fleet performance metrics
        const totalFleets = this.fleetState.activeFleets.size;
        if (totalFleets > 0) {
            this.fleetState.globalFleetStatus.fleetsAtSea = Array.from(this.fleetState.activeFleets.values())
                .filter(fleet => fleet.status === 'on_mission').length;
            
            this.fleetState.globalFleetStatus.fleetsInPort = totalFleets - this.fleetState.globalFleetStatus.fleetsAtSea;
        }
    }

    async loadFleetState() {
        try {
            await fs.mkdir(this.config.fleetDataPath, { recursive: true });
            
            const statePath = path.join(this.config.fleetDataPath, 'fleet_state.json');
            const stateData = await fs.readFile(statePath, 'utf8');
            const saved = JSON.parse(stateData);
            
            // Restore Maps
            this.fleetState.activeFleets = new Map(saved.activeFleets || []);
            this.fleetState.fleetPerformance = new Map(saved.fleetPerformance || []);
            this.fleetState.tradeRouteData = new Map(saved.tradeRouteData || []);
            this.fleetState.battleHistory = new Map(saved.battleHistory || []);
            this.fleetState.activeOperations = new Map(saved.activeOperations || []);
            this.fleetState.scheduledMissions = new Map(saved.scheduledMissions || []);
            this.fleetState.logisticsNetwork = new Map(saved.logisticsNetwork || []);
            
            // Restore other state
            this.fleetState.fleetAnalytics = saved.fleetAnalytics || this.fleetState.fleetAnalytics;
            this.fleetState.globalFleetStatus = saved.globalFleetStatus || this.fleetState.globalFleetStatus;
            
            console.log('💾 Loaded fleet management state');
        } catch (error) {
            console.log('📝 No saved fleet state, starting fresh');
        }
    }

    async saveFleetState() {
        try {
            const stateToSave = {
                activeFleets: Array.from(this.fleetState.activeFleets.entries()),
                fleetPerformance: Array.from(this.fleetState.fleetPerformance.entries()),
                tradeRouteData: Array.from(this.fleetState.tradeRouteData.entries()),
                battleHistory: Array.from(this.fleetState.battleHistory.entries()),
                activeOperations: Array.from(this.fleetState.activeOperations.entries()),
                scheduledMissions: Array.from(this.fleetState.scheduledMissions.entries()),
                logisticsNetwork: Array.from(this.fleetState.logisticsNetwork.entries()),
                fleetAnalytics: this.fleetState.fleetAnalytics,
                globalFleetStatus: this.fleetState.globalFleetStatus,
                saved_at: new Date().toISOString()
            };
            
            const statePath = path.join(this.config.fleetDataPath, 'fleet_state.json');
            await fs.writeFile(statePath, JSON.stringify(stateToSave, null, 2));
        } catch (error) {
            console.error('Failed to save fleet state:', error);
        }
    }

    // Public API
    getFleetManagementStatus() {
        return {
            fleetManagement: {
                totalFleets: this.fleetState.activeFleets.size,
                fleetsAtSea: this.fleetState.globalFleetStatus.fleetsAtSea,
                fleetsInPort: this.fleetState.globalFleetStatus.fleetsInPort,
                activeMissions: this.fleetState.activeOperations.size
            },
            performance: {
                totalProfits: this.fleetState.fleetAnalytics.totalProfits,
                battleWinRate: this.fleetState.fleetAnalytics.winRate,
                topFleet: this.fleetState.fleetAnalytics.topPerformingFleet
            },
            resources: {
                totalFirepower: this.getTotalFirepower(),
                totalCargo: this.getTotalCargoCapacity(),
                totalShips: this.getTotalShips()
            }
        };
    }

    getAllFleets() {
        return Array.from(this.fleetState.activeFleets.values());
    }

    getFleetById(fleetId) {
        return this.fleetState.activeFleets.get(fleetId);
    }

    getActiveOperations() {
        return Array.from(this.fleetState.activeOperations.values());
    }
}

// Testing and demonstration
if (require.main === module) {
    async function demonstrateFleetManagement() {
        const fleetManager = new FleetManagementSystem();
        
        fleetManager.on('fleet_system_ready', async (data) => {
            console.log('\n⚓🚢 FLEET MANAGEMENT SYSTEM DEMO\n');
            
            // Create a sample trading fleet
            console.log('⚓ Creating trading fleet...');
            const tradingFleet = await fleetManager.createSpecializedFleet({
                name: 'Digital Commerce Armada',
                role: 'trading_fleet',
                ships: [
                    { id: 'ship1', type: 'galleon', stats: { cargo: 200, firepower: 60 } },
                    { id: 'ship2', type: 'frigate', stats: { cargo: 100, firepower: 80 } },
                    { id: 'ship3', type: 'brigantine', stats: { cargo: 75, firepower: 40 } }
                ],
                admiral: 'Captain Commerce',
                strategy: 'profit_focused'
            });
            
            // Launch a trading mission
            console.log('\n🚀 Launching trading mission...');
            const mission = await fleetManager.launchFleetMission(tradingFleet.fleet.id, {
                type: 'inter_island',
                destination: 'Treasure Island Markets',
                objectives: ['trade_goods', 'establish_contacts'],
                duration: 4 * 60 * 60 * 1000, // 4 hours
                riskTolerance: 'low_temperature'
            });
            
            // Optimize fleet performance
            console.log('\n📈 Optimizing fleet performance...');
            const optimization = await fleetManager.optimizeFleetPerformance(tradingFleet.fleet.id);
            
            // Generate analytics
            console.log('\n📊 Generating analytics...');
            const analytics = fleetManager.generateFleetAnalytics();
            
            console.log('\n📊 Final Status:');
            console.log(JSON.stringify(fleetManager.getFleetManagementStatus(), null, 2));
        });
        
        fleetManager.on('fleet_created', (data) => {
            console.log(`✅ Fleet created: "${data.fleet.name}" with ${data.strategy} strategy`);
        });
        
        fleetManager.on('mission_launched', (data) => {
            console.log(`🚀 Mission launched: ${data.mission.type} with ${data.strategy} approach`);
        });
        
        fleetManager.on('fleet_optimized', (data) => {
            console.log(`📈 Fleet optimized: ${data.improvements.improvementPercentage.toFixed(1)}% improvement`);
        });
    }
    
    demonstrateFleetManagement().catch(console.error);
}

module.exports = FleetManagementSystem;