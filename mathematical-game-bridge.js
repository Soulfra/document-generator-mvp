#!/usr/bin/env node

/**
 * MATHEMATICAL GAME BRIDGE
 * 
 * Transforms Ring 0-5 mathematical proofs into One Piece-style treasure hunting gameplay.
 * Connects mathematical achievements to the billion dollar game economy and crew progression.
 * 
 * Game Flow:
 * Ring 0 → Tutorial Island (basic math proofs = first treasures)
 * Ring 1 → East Blue (user data + simple calculations)
 * Ring 2 → Grand Line (game mechanics + complex proofs)
 * Ring 3 → New World (visual proofs + advanced mathematics)
 * Ring 4 → Laugh Tale (extraction + modular proofs)
 * Ring 5 → Pirate King (broadcasting mastery)
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;

// Import Ring systems
const Ring0MathematicalCore = require('./ring-0-mathematical-core');
const unifiedColorSystem = require('./unified-color-system');

class MathematicalGameBridge extends EventEmitter {
    constructor() {
        super();
        
        this.bridgeId = crypto.randomBytes(8).toString('hex');
        this.bridgeName = 'Mathematical Game Bridge';
        
        // Game progression mapping
        this.gameProgression = {
            // Ring 0: Tutorial Island - Basic mathematical proofs
            0: {
                sea: 'Tutorial Island',
                difficulty: 'ROOKIE',
                description: 'Learn basic mathematical treasure hunting',
                treasureTypes: ['basic_proofs', 'simple_calculations', 'number_patterns'],
                requiredProofs: 3,
                rewards: {
                    experience: 100,
                    treasureTokens: 10,
                    unlocksNext: true
                }
            },
            
            // Ring 1: East Blue - User data and simple game math
            1: {
                sea: 'East Blue',
                difficulty: 'PIRATE',
                description: 'Master user-based mathematical challenges',
                treasureTypes: ['user_calculations', 'profile_mathematics', 'basic_cryptography'],
                requiredProofs: 5,
                rewards: {
                    experience: 250,
                    treasureTokens: 25,
                    unlocksNext: true,
                    specialAbility: 'Enhanced RNG'
                }
            },
            
            // Ring 2: Grand Line - Game mechanics and combat math
            2: {
                sea: 'Grand Line',
                difficulty: 'SUPERNOVA',
                description: 'Advanced game mechanics and combat mathematics',
                treasureTypes: ['game_physics', 'damage_calculations', 'probability_mastery'],
                requiredProofs: 8,
                rewards: {
                    experience: 500,
                    treasureTokens: 50,
                    unlocksNext: true,
                    specialAbility: 'Mathematical Combat Enhancement'
                }
            },
            
            // Ring 3: New World - Visual proofs and advanced rendering
            3: {
                sea: 'New World',
                difficulty: 'EMPEROR_CANDIDATE',
                description: 'Master visual mathematics and rendering proofs',
                treasureTypes: ['visual_proofs', 'rendering_mathematics', 'color_theory'],
                requiredProofs: 12,
                rewards: {
                    experience: 1000,
                    treasureTokens: 100,
                    unlocksNext: true,
                    specialAbility: 'Visual Mathematical Mastery'
                }
            },
            
            // Ring 4: Laugh Tale Approach - Extraction and modular math
            4: {
                sea: 'Laugh Tale Approach',
                difficulty: 'EMPEROR',
                description: 'Master extractable mathematical systems',
                treasureTypes: ['modular_mathematics', 'extraction_proofs', 'system_integration'],
                requiredProofs: 15,
                rewards: {
                    experience: 2000,
                    treasureTokens: 200,
                    unlocksNext: true,
                    specialAbility: 'Mathematical System Extraction'
                }
            },
            
            // Ring 5: Pirate King - Broadcasting and public mathematical mastery
            5: {
                sea: 'Laugh Tale (Pirate King)',
                difficulty: 'PIRATE_KING',
                description: 'Broadcast mathematical discoveries to the world',
                treasureTypes: ['broadcast_mastery', 'public_proofs', 'mathematical_leadership'],
                requiredProofs: 20,
                rewards: {
                    experience: 5000,
                    treasureTokens: 500,
                    unlocksNext: false,
                    specialAbility: 'Mathematical Broadcast Mastery',
                    title: 'Mathematical Pirate King'
                }
            }
        };
        
        // Treasure types and their mathematical requirements
        this.treasureTypes = {
            // Basic mathematical treasures
            basic_proofs: {
                name: 'Ancient Mathematical Scrolls',
                description: 'Basic mathematical proofs that unlock treasure locations',
                difficulty: 'Beginner',
                requirements: ['simple_arithmetic', 'basic_algebra'],
                rewards: { tokens: 5, experience: 25 }
            },
            
            simple_calculations: {
                name: 'Navigation Calculations',
                description: 'Ship navigation requires precise mathematical calculations',
                difficulty: 'Beginner',
                requirements: ['trigonometry', 'basic_geometry'],
                rewards: { tokens: 8, experience: 40 }
            },
            
            // Prime number special treasures
            prime_discovery: {
                name: 'Prime Number Relics',
                description: 'Ancient prime numbers hold special mathematical power',
                difficulty: 'Legendary',
                requirements: ['prime_generation', 'number_theory'],
                rewards: { tokens: 100, experience: 500, special: 'Prime Devil Fruit Shard' }
            },
            
            // Advanced mathematical treasures
            cryptographic_proofs: {
                name: 'Cipher Treasure Maps',
                description: 'Encrypted treasure maps requiring cryptographic proofs',
                difficulty: 'Expert',
                requirements: ['cryptographic_verification', 'hash_functions'],
                rewards: { tokens: 50, experience: 200 }
            },
            
            mathematical_leadership: {
                name: 'Mathematical Crown of the Pirate King',
                description: 'Ultimate mathematical mastery recognized across all seas',
                difficulty: 'Pirate King',
                requirements: ['ring_5_mastery', 'broadcast_proofs', 'public_verification'],
                rewards: { tokens: 1000, experience: 5000, title: 'Mathematical Pirate King' }
            }
        };
        
        // Player progression state
        this.playerState = {
            currentRing: 0,
            currentSea: 'Tutorial Island',
            difficulty: 'ROOKIE',
            totalExperience: 0,
            treasureTokens: 0,
            proofsCompleted: new Map(), // ringId -> count
            treasuresFound: [],
            specialAbilities: [],
            crewMates: [], // AI agents helping with mathematical proofs
            achievements: []
        };
        
        // Game systems integration
        this.gameSystems = {
            ring0: null,           // Mathematical core
            ring5: null,           // Broadcast layer
            agentOrchestrator: null, // AI collaboration
            economySystem: null,   // Token/reward economy
            truthEconomy: null     // Conflict resolution
        };
        
        console.log(unifiedColorSystem.formatStatus('info', 'Mathematical Game Bridge initializing...'));
        this.initialize();
    }
    
    async initialize() {
        try {
            // Phase 1: Initialize Ring systems
            await this.initializeRingSystems();
            
            // Phase 2: Set up game progression tracking
            await this.setupGameProgression();
            
            // Phase 3: Initialize treasure hunting mechanics
            await this.setupTreasureHunting();
            
            // Phase 4: Set up player progression
            await this.setupPlayerProgression();
            
            // Phase 5: Connect to game economy
            await this.connectToGameEconomy();
            
            console.log(unifiedColorSystem.formatStatus('success', 'Mathematical Game Bridge ready!'));
            
            this.emit('gameReady', {
                bridgeId: this.bridgeId,
                currentSea: this.playerState.currentSea,
                availableTreasures: this.getAvailableTreasures(),
                playerLevel: this.getPlayerLevel()
            });
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('error', `Game bridge initialization failed: ${error.message}`));
            throw error;
        }
    }
    
    /**
     * RING SYSTEMS INTEGRATION
     */
    async initializeRingSystems() {
        console.log(unifiedColorSystem.formatStatus('info', 'Connecting to Ring mathematical systems...'));
        
        // Initialize Ring 0 (Mathematical Core)
        this.gameSystems.ring0 = new Ring0MathematicalCore();
        
        // Wait for Ring 0 to be ready
        await new Promise(resolve => {
            this.gameSystems.ring0.on('ring0Ready', resolve);
        });
        
        // Listen for mathematical proof completions
        this.gameSystems.ring0.on('ring5Broadcast', (proofData) => {
            this.handleMathematicalProofCompleted(proofData);
        });
        
        // Listen for verification feedback
        this.gameSystems.ring0.on('verificationFeedback', (feedback) => {
            this.handleVerificationFeedback(feedback);
        });
        
        console.log(unifiedColorSystem.formatStatus('success', 'Ring 0 Mathematical Core connected to game bridge'));
    }
    
    /**
     * GAME PROGRESSION SETUP
     */
    async setupGameProgression() {
        console.log(unifiedColorSystem.formatStatus('info', 'Setting up game progression system...'));
        
        // Initialize player progression tracking
        this.playerState.proofsCompleted.set(0, 0); // Start with Ring 0
        
        console.log(unifiedColorSystem.formatStatus('success', 'Game progression system ready'));
    }
    
    /**
     * PLAYER PROGRESSION SETUP
     */
    async setupPlayerProgression() {
        console.log(unifiedColorSystem.formatStatus('info', 'Setting up player progression tracking...'));
        
        // Load or create player save data
        this.playerSaveData = {
            lastSaved: Date.now(),
            saveVersion: '1.0.0'
        };
        
        console.log(unifiedColorSystem.formatStatus('success', 'Player progression tracking ready'));
    }
    
    /**
     * TREASURE HUNTING GAME MECHANICS
     */
    async setupTreasureHunting() {
        console.log(unifiedColorSystem.formatStatus('info', 'Setting up treasure hunting mechanics...'));
        
        // Create treasure discovery system
        this.treasureDiscovery = {
            activeTreasures: new Map(),
            completedTreasures: new Set(),
            treasureHints: new Map()
        };
        
        // Generate initial treasures for current ring
        await this.generateTreasuresForCurrentRing();
        
        console.log(unifiedColorSystem.formatStatus('success', 'Treasure hunting mechanics ready'));
    }
    
    async generateTreasuresForCurrentRing() {
        const currentRing = this.playerState.currentRing;
        const ringConfig = this.gameProgression[currentRing];
        
        console.log(unifiedColorSystem.formatStatus('info', 
            `Generating treasures for ${ringConfig.sea} (Ring ${currentRing})`));
        
        // Generate treasures based on ring difficulty
        for (const treasureType of ringConfig.treasureTypes) {
            const treasure = this.createTreasure(treasureType, currentRing);
            this.treasureDiscovery.activeTreasures.set(treasure.id, treasure);
            
            console.log(`  🏴‍☠️ ${treasure.name} available for discovery`);
        }
        
        // Special prime number treasures (available at all levels)
        if (Math.random() < 0.3) { // 30% chance
            const primeTreasure = this.createTreasure('prime_discovery', currentRing);
            this.treasureDiscovery.activeTreasures.set(primeTreasure.id, primeTreasure);
            console.log(`  ✨ RARE: ${primeTreasure.name} discovered!`);
        }
    }
    
    createTreasure(treasureType, ringLevel) {
        const treasureConfig = this.treasureTypes[treasureType];
        
        if (!treasureConfig) {
            console.log(unifiedColorSystem.formatStatus('warning', `Unknown treasure type: ${treasureType}, creating default`));
            return this.createDefaultTreasure(treasureType, ringLevel);
        }
        
        const treasureId = crypto.randomBytes(8).toString('hex');
        
        return {
            id: treasureId,
            type: treasureType,
            name: treasureConfig.name,
            description: treasureConfig.description,
            difficulty: treasureConfig.difficulty,
            ringLevel: ringLevel,
            requirements: treasureConfig.requirements,
            rewards: treasureConfig.rewards,
            discovered: false,
            discoveredAt: null,
            mathematicalChallenge: this.generateMathematicalChallenge(treasureType, ringLevel)
        };
    }
    
    createDefaultTreasure(treasureType, ringLevel) {
        const treasureId = crypto.randomBytes(8).toString('hex');
        
        return {
            id: treasureId,
            type: treasureType,
            name: `Ring ${ringLevel} Mathematical Treasure`,
            description: `A mysterious treasure requiring Ring ${ringLevel} mathematical knowledge`,
            difficulty: 'Unknown',
            ringLevel: ringLevel,
            requirements: ['mathematical_proof'],
            rewards: { tokens: 10, experience: 50 },
            discovered: false,
            discoveredAt: null,
            mathematicalChallenge: this.generateMathematicalChallenge(treasureType, ringLevel)
        };
    }
    
    generateMathematicalChallenge(treasureType, ringLevel) {
        // Generate mathematical challenges based on treasure type and ring level
        const challenges = {
            basic_proofs: {
                0: { formula: 'pythagorean', variables: { a: 3, b: 4 }, expectedResult: 5 }
            },
            simple_calculations: {
                0: { formula: 'kinetic_energy', variables: { m: 2, v: 5 }, expectedResult: 25 }
            },
            prime_discovery: {
                any: { type: 'prime_generation', requirement: 'Generate a prime number > 100' }
            },
            game_physics: {
                2: { formula: 'damage_calculation', variables: { base_damage: 100, crit_chance: 0.25, crit_multiplier: 2.0, level_scaling: 1.5 }, expectedResult: 175 }
            }
        };
        
        return challenges[treasureType]?.[ringLevel] || challenges[treasureType]?.any || {
            type: 'custom',
            description: `Solve a Ring ${ringLevel} mathematical challenge`
        };
    }
    
    /**
     * MATHEMATICAL PROOF → TREASURE DISCOVERY
     */
    async handleMathematicalProofCompleted(proofData) {
        console.log(unifiedColorSystem.formatStatus('info', 
            `Mathematical proof completed: ${proofData.data.formula}`));
        
        // Check if this proof corresponds to any active treasures
        for (const [treasureId, treasure] of this.treasureDiscovery.activeTreasures) {
            if (this.doesProofMatchTreasure(proofData, treasure)) {
                await this.discoverTreasure(treasure, proofData);
                break;
            }
        }
        
        // Track proof completion for ring progression
        const currentRing = this.playerState.currentRing;
        const currentCount = this.playerState.proofsCompleted.get(currentRing) || 0;
        this.playerState.proofsCompleted.set(currentRing, currentCount + 1);
        
        // Check for ring progression
        await this.checkRingProgression();
    }
    
    doesProofMatchTreasure(proofData, treasure) {
        const challenge = treasure.mathematicalChallenge;
        
        // Check if the proof formula matches the treasure's requirement
        if (challenge.formula && proofData.data.formula === challenge.formula) {
            // Check if variables match (approximately)
            if (challenge.variables) {
                const proofVars = proofData.data.variables;
                for (const [key, expectedValue] of Object.entries(challenge.variables)) {
                    if (Math.abs(proofVars[key] - expectedValue) > 0.001) {
                        return false;
                    }
                }
            }
            return true;
        }
        
        // Special handling for prime number treasures
        if (treasure.type === 'prime_discovery' && this.isPrimeRelated(proofData)) {
            return true;
        }
        
        return false;
    }
    
    isPrimeRelated(proofData) {
        // Check if the proof involves prime number generation or verification
        const result = proofData.data.result;
        return this.isPrime(Math.floor(result));
    }
    
    isPrime(n) {
        if (n < 2) return false;
        for (let i = 2; i <= Math.sqrt(n); i++) {
            if (n % i === 0) return false;
        }
        return true;
    }
    
    async discoverTreasure(treasure, proofData) {
        treasure.discovered = true;
        treasure.discoveredAt = Date.now();
        treasure.discoveryProof = proofData;
        
        // Remove from active treasures
        this.treasureDiscovery.activeTreasures.delete(treasure.id);
        this.treasureDiscovery.completedTreasures.add(treasure.id);
        
        // Add to player's treasures
        this.playerState.treasuresFound.push(treasure);
        
        // Award rewards
        await this.awardTreasureRewards(treasure);
        
        // Broadcast treasure discovery
        await this.broadcastTreasureDiscovery(treasure);
        
        console.log(unifiedColorSystem.formatStatus('success', 
            `🏴‍☠️ TREASURE DISCOVERED: ${treasure.name}!`));
        
        this.emit('treasureDiscovered', {
            treasure: treasure,
            player: this.getPlayerStatus(),
            proof: proofData
        });
    }
    
    async awardTreasureRewards(treasure) {
        const rewards = treasure.rewards;
        
        // Award experience
        if (rewards.experience) {
            this.playerState.totalExperience += rewards.experience;
            console.log(`  📈 +${rewards.experience} experience earned`);
        }
        
        // Award treasure tokens
        if (rewards.tokens) {
            this.playerState.treasureTokens += rewards.tokens;
            console.log(`  🪙 +${rewards.tokens} treasure tokens earned`);
        }
        
        // Award special abilities
        if (rewards.special) {
            this.playerState.specialAbilities.push(rewards.special);
            console.log(`  ✨ Special ability unlocked: ${rewards.special}`);
        }
        
        // Award titles
        if (rewards.title) {
            this.playerState.achievements.push(rewards.title);
            console.log(`  👑 Title earned: ${rewards.title}`);
        }
    }
    
    async broadcastTreasureDiscovery(treasure) {
        // If Ring 5 is available, broadcast the discovery
        if (this.gameSystems.ring5) {
            const discoveryMessage = {
                type: 'treasure_discovery',
                treasure: {
                    name: treasure.name,
                    type: treasure.type,
                    difficulty: treasure.difficulty,
                    discoveredBy: this.playerState.currentSea
                },
                broadcast: {
                    timestamp: Date.now(),
                    ringLevel: treasure.ringLevel
                }
            };
            
            // Broadcast via Ring 5
            this.gameSystems.ring5.emit('treasureDiscoveryBroadcast', discoveryMessage);
        }
    }
    
    /**
     * RING PROGRESSION SYSTEM
     */
    async checkRingProgression() {
        const currentRing = this.playerState.currentRing;
        const ringConfig = this.gameProgression[currentRing];
        const proofsCompleted = this.playerState.proofsCompleted.get(currentRing) || 0;
        
        console.log(`📊 Ring ${currentRing} progress: ${proofsCompleted}/${ringConfig.requiredProofs} proofs`);
        
        if (proofsCompleted >= ringConfig.requiredProofs && ringConfig.rewards.unlocksNext) {
            await this.advanceToNextRing();
        }
    }
    
    async advanceToNextRing() {
        const currentRing = this.playerState.currentRing;
        const nextRing = currentRing + 1;
        
        if (nextRing <= 5) {
            // Award ring completion rewards
            const ringConfig = this.gameProgression[currentRing];
            await this.awardRingCompletionRewards(ringConfig);
            
            // Advance to next ring
            this.playerState.currentRing = nextRing;
            const nextRingConfig = this.gameProgression[nextRing];
            this.playerState.currentSea = nextRingConfig.sea;
            this.playerState.difficulty = nextRingConfig.difficulty;
            
            // Generate new treasures for the next ring
            await this.generateTreasuresForCurrentRing();
            
            console.log(unifiedColorSystem.formatStatus('success', 
                `🌊 SAILED TO NEW SEA: ${nextRingConfig.sea} (${nextRingConfig.difficulty})`));
            
            this.emit('ringAdvancement', {
                previousRing: currentRing,
                newRing: nextRing,
                newSea: nextRingConfig.sea,
                newDifficulty: nextRingConfig.difficulty
            });
            
        } else {
            // Player has reached Pirate King status
            await this.achievePirateKingStatus();
        }
    }
    
    async awardRingCompletionRewards(ringConfig) {
        const rewards = ringConfig.rewards;
        
        this.playerState.totalExperience += rewards.experience;
        this.playerState.treasureTokens += rewards.treasureTokens;
        
        if (rewards.specialAbility) {
            this.playerState.specialAbilities.push(rewards.specialAbility);
        }
        
        console.log(`🎊 RING COMPLETED! +${rewards.experience} XP, +${rewards.treasureTokens} tokens`);
        if (rewards.specialAbility) {
            console.log(`✨ New ability unlocked: ${rewards.specialAbility}`);
        }
    }
    
    async achievePirateKingStatus() {
        this.playerState.achievements.push('Mathematical Pirate King');
        
        console.log(unifiedColorSystem.formatStatus('success', 
            '👑 CONGRATULATIONS! You have become the Mathematical Pirate King!'));
        
        this.emit('pirateKingAchieved', {
            player: this.getPlayerStatus(),
            totalTreasures: this.playerState.treasuresFound.length,
            finalExperience: this.playerState.totalExperience
        });
    }
    
    /**
     * PLAYER STATUS AND GAME INTERFACE
     */
    getPlayerStatus() {
        return {
            currentRing: this.playerState.currentRing,
            currentSea: this.playerState.currentSea,
            difficulty: this.playerState.difficulty,
            level: this.getPlayerLevel(),
            experience: this.playerState.totalExperience,
            treasureTokens: this.playerState.treasureTokens,
            treasuresFound: this.playerState.treasuresFound.length,
            specialAbilities: this.playerState.specialAbilities,
            achievements: this.playerState.achievements,
            ringProgress: this.getRingProgress()
        };
    }
    
    getPlayerLevel() {
        // Calculate level based on total experience
        return Math.floor(this.playerState.totalExperience / 100) + 1;
    }
    
    getRingProgress() {
        const currentRing = this.playerState.currentRing;
        const ringConfig = this.gameProgression[currentRing];
        const completed = this.playerState.proofsCompleted.get(currentRing) || 0;
        
        return {
            ring: currentRing,
            proofsCompleted: completed,
            proofsRequired: ringConfig.requiredProofs,
            percentage: Math.min((completed / ringConfig.requiredProofs) * 100, 100)
        };
    }
    
    getAvailableTreasures() {
        return Array.from(this.treasureDiscovery.activeTreasures.values()).map(treasure => ({
            id: treasure.id,
            name: treasure.name,
            description: treasure.description,
            difficulty: treasure.difficulty,
            challenge: treasure.mathematicalChallenge
        }));
    }
    
    /**
     * GAME COMMANDS AND ACTIONS
     */
    async startMathematicalQuest(treasureId) {
        const treasure = this.treasureDiscovery.activeTreasures.get(treasureId);
        if (!treasure) {
            throw new Error('Treasure not found');
        }
        
        console.log(unifiedColorSystem.formatStatus('info', 
            `🏴‍☠️ Starting quest for: ${treasure.name}`));
        
        const challenge = treasure.mathematicalChallenge;
        
        if (challenge.formula) {
            console.log(`📐 Mathematical Challenge: Solve ${challenge.formula}`);
            console.log(`📊 Variables: ${JSON.stringify(challenge.variables)}`);
            
            // Automatically attempt the calculation using Ring 0
            try {
                const result = await this.gameSystems.ring0.calculateFormula(challenge.formula, challenge.variables);
                console.log(`🎯 Calculation result: ${result}`);
                
                // This will trigger treasure discovery through the proof completion handler
                return result;
                
            } catch (error) {
                console.log(unifiedColorSystem.formatStatus('error', 
                    `Mathematical challenge failed: ${error.message}`));
                throw error;
            }
        }
        
        return challenge;
    }
    
    /**
     * GAME ECONOMY INTEGRATION
     */
    async connectToGameEconomy() {
        console.log(unifiedColorSystem.formatStatus('info', 
            'Connecting to game economy systems...'));
        
        // This would connect to the actual token economy, agent system, etc.
        // For now, we'll create a mock connection
        
        this.gameSystems.economySystem = {
            connected: true,
            tokenBalance: this.playerState.treasureTokens
        };
        
        console.log(unifiedColorSystem.formatStatus('success', 
            'Game economy integration ready'));
    }
    
    /**
     * DIAGNOSTICS AND STATUS
     */
    async runGameDiagnostics() {
        console.log('\n🎮 Mathematical Game Bridge Diagnostics\n');
        
        const playerStatus = this.getPlayerStatus();
        const availableTreasures = this.getAvailableTreasures();
        
        console.log('🏴‍☠️ Player Status:');
        console.log(`  Current Sea: ${playerStatus.currentSea}`);
        console.log(`  Difficulty: ${playerStatus.difficulty}`);
        console.log(`  Level: ${playerStatus.level}`);
        console.log(`  Experience: ${playerStatus.experience}`);
        console.log(`  Treasure Tokens: ${playerStatus.treasureTokens}`);
        console.log(`  Treasures Found: ${playerStatus.treasuresFound}`);
        console.log(`  Special Abilities: ${playerStatus.specialAbilities.join(', ') || 'None'}`);
        
        console.log('\n🗺️ Ring Progress:');
        const progress = playerStatus.ringProgress;
        console.log(`  Ring ${progress.ring}: ${progress.proofsCompleted}/${progress.proofsRequired} (${progress.percentage.toFixed(1)}%)`);
        
        console.log('\n💎 Available Treasures:');
        availableTreasures.forEach(treasure => {
            console.log(`  ${treasure.name} (${treasure.difficulty})`);
            console.log(`    Challenge: ${JSON.stringify(treasure.challenge)}`);
        });
        
        console.log('\n🔧 System Connections:');
        console.log(`  Ring 0: ${this.gameSystems.ring0 ? '✅' : '❌'}`);
        console.log(`  Ring 5: ${this.gameSystems.ring5 ? '✅' : '❌'}`);
        console.log(`  Economy: ${this.gameSystems.economySystem?.connected ? '✅' : '❌'}`);
        
        console.log('\n=== Game Diagnostics Complete ===\n');
    }
}

// Export the Mathematical Game Bridge
module.exports = MathematicalGameBridge;

// CLI interface for testing
if (require.main === module) {
    (async () => {
        console.log('🎮 Mathematical Game Bridge - Treasure Hunting Demo\n');
        
        const gamebridge = new MathematicalGameBridge();
        
        // Wait for game to be ready
        await new Promise(resolve => {
            gamebridge.on('gameReady', resolve);
        });
        
        // Run diagnostics
        await gamebridge.runGameDiagnostics();
        
        // Demo: Start a mathematical quest
        console.log('🚀 Demo: Starting mathematical treasure quest...\n');
        
        const availableTreasures = gamebridge.getAvailableTreasures();
        if (availableTreasures.length > 0) {
            const firstTreasure = availableTreasures[0];
            console.log(`Starting quest for: ${firstTreasure.name}`);
            
            try {
                await gamebridge.startMathematicalQuest(firstTreasure.id);
            } catch (error) {
                console.log(`Quest failed: ${error.message}`);
            }
        }
        
        // Listen for treasure discoveries
        gamebridge.on('treasureDiscovered', (data) => {
            console.log(`\n🏴‍☠️ TREASURE DISCOVERED: ${data.treasure.name}!`);
            console.log(`Player is now level ${data.player.level} with ${data.player.treasureTokens} tokens`);
        });
        
        // Listen for ring advancement
        gamebridge.on('ringAdvancement', (data) => {
            console.log(`\n🌊 SAILED TO NEW SEA: ${data.newSea} (${data.newDifficulty})!`);
        });
        
        console.log('\n✨ Mathematical treasure hunting game is running!');
        console.log('Mathematical proofs automatically turn into treasure discoveries.');
        console.log('Complete Ring challenges to advance through the seas and become Pirate King!');
        
    })().catch(console.error);
}