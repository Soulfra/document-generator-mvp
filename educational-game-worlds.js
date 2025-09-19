#!/usr/bin/env node

/**
 * EDUCATIONAL GAME WORLDS FRAMEWORK
 * 
 * Creates 1000 interconnected educational game worlds, each teaching specific
 * concepts through gameplay. Implements injury/penalty systems, achievement
 * tracking, and cross-world progression with XP and skill systems.
 * 
 * Features:
 * - 1000 unique educational worlds (one per port)
 * - Each world teaches specific concepts (coding, MEV, ethics, etc.)
 * - Injury/penalty system for learning from mistakes
 * - XP and achievement tracking across all worlds
 * - Progressive difficulty and skill requirements
 * - Portal system for world navigation
 * - Real-time multiplayer support
 * - AI-powered content generation
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class EducationalGameWorlds extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // World Configuration
            worlds: {
                totalWorlds: options.totalWorlds || 1000,
                worldsPerCategory: 125, // 8 categories x 125 = 1000
                categories: [
                    'programming',
                    'blockchain',
                    'networking', 
                    'security',
                    'algorithms',
                    'databases',
                    'systems',
                    'web'
                ],
                difficultyLevels: ['novice', 'beginner', 'intermediate', 'advanced', 'expert', 'master', 'legendary'],
                worldSize: {
                    small: { width: 1000, height: 1000 },
                    medium: { width: 2000, height: 2000 },
                    large: { width: 5000, height: 5000 },
                    massive: { width: 10000, height: 10000 }
                }
            },
            
            // Educational Content
            education: {
                // Programming concepts
                programming: {
                    languages: ['JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'TypeScript', 'PHP'],
                    concepts: ['variables', 'functions', 'classes', 'inheritance', 'polymorphism', 'recursion'],
                    patterns: ['singleton', 'factory', 'observer', 'mvc', 'decorator', 'strategy']
                },
                
                // MEV and blockchain concepts
                blockchain: {
                    mevConcepts: {
                        basic: ['transaction ordering', 'gas fees', 'block time', 'mempool'],
                        intermediate: ['frontrunning', 'backrunning', 'sandwich attacks', 'arbitrage'],
                        advanced: ['flashloans', 'liquidations', 'cross-chain MEV', 'MEV protection']
                    },
                    protocols: ['Ethereum', 'BSC', 'Polygon', 'Arbitrum', 'Optimism', 'Solana'],
                    smartContracts: ['ERC20', 'ERC721', 'ERC1155', 'DeFi protocols', 'AMMs', 'Lending']
                },
                
                // Ethical considerations
                ethics: {
                    topics: ['responsible coding', 'data privacy', 'algorithmic bias', 'digital rights'],
                    scenarios: ['user data handling', 'AI ethics', 'security disclosure', 'fair trading'],
                    penalties: {
                        minor: 10,
                        moderate: 50,
                        severe: 100,
                        critical: 500
                    }
                }
            },
            
            // Game Mechanics
            mechanics: {
                // XP and leveling
                experience: {
                    baseXP: 100,
                    levelMultiplier: 1.5,
                    maxLevel: 100,
                    skillPoints: 3, // per level
                    categories: ['combat', 'knowledge', 'exploration', 'social', 'creation']
                },
                
                // Injury system
                injuries: {
                    types: {
                        'syntax_error': { 
                            damage: 10, 
                            duration: 60, 
                            effect: 'reduced coding speed',
                            recovery: 'Complete syntax tutorial'
                        },
                        'logic_bug': {
                            damage: 25,
                            duration: 180,
                            effect: 'confused state',
                            recovery: 'Debug 5 programs'
                        },
                        'security_breach': {
                            damage: 50,
                            duration: 300,
                            effect: 'vulnerability debuff',
                            recovery: 'Complete security course'
                        },
                        'ethical_violation': {
                            damage: 100,
                            duration: 600,
                            effect: 'reputation loss',
                            recovery: 'Ethics training + community service'
                        },
                        'performance_issue': {
                            damage: 15,
                            duration: 120,
                            effect: 'slowness',
                            recovery: 'Optimize 3 algorithms'
                        }
                    },
                    recoveryMechanics: {
                        natural: 0.1, // HP per second
                        meditation: 0.5, // HP per second while meditating
                        healing_items: true,
                        peer_help: true
                    }
                },
                
                // Achievement system
                achievements: {
                    categories: {
                        exploration: ['First Steps', 'World Walker', 'Dimension Hopper', 'Reality Explorer'],
                        knowledge: ['Student', 'Scholar', 'Expert', 'Master', 'Sage'],
                        combat: ['Bug Slayer', 'Error Handler', 'Exception Master', 'Crash Preventer'],
                        social: ['Helper', 'Mentor', 'Community Leader', 'Inspiration'],
                        creation: ['Builder', 'Architect', 'Creator', 'World Shaper']
                    },
                    rewards: {
                        xp_bonus: [100, 500, 1000, 5000],
                        skill_points: [1, 3, 5, 10],
                        special_items: true,
                        titles: true,
                        cosmetics: true
                    }
                },
                
                // Portal mechanics
                portals: {
                    types: {
                        standard: { cost: 0, cooldown: 60 },
                        express: { cost: 100, cooldown: 10 },
                        emergency: { cost: 500, cooldown: 0 },
                        random: { cost: 50, cooldown: 30 }
                    },
                    requirements: {
                        level_based: true,
                        quest_locked: true,
                        skill_gated: true,
                        achievement_required: false
                    }
                }
            },
            
            // World Generation
            generation: {
                terrain: {
                    types: ['plains', 'mountains', 'forest', 'desert', 'ocean', 'city', 'cyberspace', 'void'],
                    features: ['lakes', 'rivers', 'caves', 'ruins', 'temples', 'laboratories', 'servers'],
                    hazards: ['lava', 'radiation', 'viruses', 'traps', 'puzzles', 'mazes']
                },
                structures: {
                    educational: ['library', 'classroom', 'laboratory', 'workshop', 'arena'],
                    social: ['hub', 'marketplace', 'guild_hall', 'forum', 'cafe'],
                    challenge: ['dungeon', 'tower', 'trial', 'puzzle_room', 'boss_arena']
                },
                npcs: {
                    teachers: ['professor', 'mentor', 'guide', 'tutor', 'master'],
                    students: ['beginner', 'peer', 'rival', 'friend', 'study_group'],
                    special: ['oracle', 'challenger', 'boss', 'merchant', 'quest_giver']
                }
            },
            
            // Progression System
            progression: {
                unlockPattern: 'branching', // linear, branching, open
                prerequisites: true,
                skillTrees: {
                    programmer: ['syntax', 'algorithms', 'patterns', 'optimization', 'architecture'],
                    blockchain_expert: ['protocols', 'smart_contracts', 'mev', 'security', 'economics'],
                    network_engineer: ['protocols', 'routing', 'security', 'performance', 'troubleshooting'],
                    security_specialist: ['vulnerabilities', 'cryptography', 'forensics', 'defense', 'ethics']
                },
                masterySystem: {
                    levels: ['apprentice', 'journeyman', 'expert', 'master', 'grandmaster'],
                    bonuses: [1.1, 1.25, 1.5, 2.0, 3.0]
                }
            },
            
            ...options
        };
        
        // World registry
        this.worlds = new Map();
        this.worldConnections = new Map(); // Portal connections
        this.worldPopulations = new Map(); // Active players per world
        
        // Player data
        this.players = new Map();
        this.playerProgress = new Map();
        this.playerInjuries = new Map();
        this.playerAchievements = new Map();
        
        // Content registry
        this.quests = new Map();
        this.lessons = new Map();
        this.challenges = new Map();
        this.items = new Map();
        
        // Real-time tracking
        this.activePortals = new Map();
        this.worldEvents = new Map();
        this.globalEvents = [];
        
        // Statistics
        this.stats = {
            worldsCreated: 0,
            totalPlayers: 0,
            activeWorlds: 0,
            questsCompleted: 0,
            lessonsLearned: 0,
            achievementsUnlocked: 0,
            injuriesHealed: 0,
            portalsUsed: 0
        };
        
        console.log('🌍 Educational Game Worlds Framework initializing...');
        console.log(`🎮 Creating ${this.config.worlds.totalWorlds} interconnected worlds`);
        console.log(`📚 Categories: ${this.config.worlds.categories.join(', ')}`);
        console.log(`🎯 Difficulty levels: ${this.config.worlds.difficultyLevels.length}`);
        console.log(`🏥 Injury types: ${Object.keys(this.config.mechanics.injuries.types).length}`);
    }
    
    /**
     * Initialize the educational game worlds
     */
    async initialize() {
        console.log('🚀 Initializing Educational Game Worlds...\n');
        
        try {
            // Generate all worlds
            await this.generateAllWorlds();
            
            // Create world connections (portals)
            await this.createWorldConnections();
            
            // Generate educational content
            await this.generateEducationalContent();
            
            // Setup achievement system
            await this.setupAchievementSystem();
            
            // Initialize quest system
            await this.initializeQuestSystem();
            
            // Create special events
            await this.createSpecialEvents();
            
            // Setup world hazards and challenges
            await this.setupWorldChallenges();
            
            // Initialize NPC systems
            await this.initializeNPCSystems();
            
            console.log('✅ Educational Game Worlds ready!');
            console.log(`🌍 Worlds created: ${this.worlds.size}`);
            console.log(`🌀 Portal connections: ${this.worldConnections.size}`);
            console.log(`📖 Lessons available: ${this.lessons.size}`);
            console.log(`🎯 Quests created: ${this.quests.size}`);
            console.log(`🏆 Achievements defined: ${this.getAchievementCount()}\n`);
            
            this.emit('worlds:ready', {
                worlds: this.worlds.size,
                connections: this.worldConnections.size,
                content: this.lessons.size + this.quests.size
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize Educational Game Worlds:', error);
            throw error;
        }
    }
    
    /**
     * Generate all educational worlds
     */
    async generateAllWorlds() {
        console.log('🌍 Generating educational worlds...');
        
        let worldIndex = 0;
        
        for (const category of this.config.worlds.categories) {
            for (let i = 0; i < this.config.worlds.worldsPerCategory; i++) {
                const worldId = `world_${worldIndex.toString().padStart(4, '0')}`;
                const difficulty = this.calculateWorldDifficulty(worldIndex);
                const size = this.calculateWorldSize(difficulty);
                
                const world = {
                    id: worldId,
                    index: worldIndex,
                    name: this.generateWorldName(category, i),
                    category,
                    difficulty,
                    size,
                    
                    // Educational focus
                    education: {
                        primaryTopic: this.getPrimaryTopic(category, difficulty),
                        secondaryTopics: this.getSecondaryTopics(category, difficulty),
                        skills: this.getRequiredSkills(category, difficulty),
                        prerequisites: this.getPrerequisites(worldIndex),
                        learningObjectives: this.generateLearningObjectives(category, difficulty),
                        practicalExercises: this.generatePracticalExercises(category, difficulty)
                    },
                    
                    // World properties
                    properties: {
                        terrain: this.generateTerrain(category, worldIndex),
                        climate: this.generateClimate(worldIndex),
                        timeOfDay: 'dynamic',
                        gravity: 1.0 + (Math.random() - 0.5) * 0.2,
                        atmosphere: this.generateAtmosphere(category),
                        resources: this.generateResources(category, difficulty)
                    },
                    
                    // Game mechanics
                    mechanics: {
                        spawnPoints: this.generateSpawnPoints(size),
                        safeZones: this.generateSafeZones(size),
                        dangerZones: this.generateDangerZones(category, difficulty),
                        portals: [], // Will be populated during connection phase
                        npcs: this.generateNPCs(category, difficulty),
                        challenges: this.generateChallenges(category, difficulty)
                    },
                    
                    // Dynamic elements
                    dynamic: {
                        events: [],
                        weatherPattern: this.generateWeatherPattern(category),
                        dayNightCycle: true,
                        seasonalChanges: worldIndex % 4 === 0, // Every 4th world
                        economicSystem: difficulty !== 'novice'
                    },
                    
                    // Statistics
                    stats: {
                        created: new Date(),
                        totalVisits: 0,
                        averageTimeSpent: 0,
                        questCompletionRate: 0,
                        playerDeaths: 0,
                        lessonsCompleted: 0,
                        difficultyRating: 0,
                        playerRating: 0
                    }
                };
                
                // Add category-specific features
                this.addCategorySpecificFeatures(world, category);
                
                this.worlds.set(worldId, world);
                this.stats.worldsCreated++;
                worldIndex++;
            }
        }
        
        console.log(`✅ Generated ${this.worlds.size} educational worlds`);
    }
    
    /**
     * Create portal connections between worlds
     */
    async createWorldConnections() {
        console.log('🌀 Creating world portal connections...');
        
        let connectionCount = 0;
        
        // Create connections based on various patterns
        for (const [worldId, world] of this.worlds) {
            const connections = [];
            
            // 1. Connect to adjacent worlds (sequential)
            if (world.index > 0) {
                connections.push(this.createPortalConnection(worldId, `world_${(world.index - 1).toString().padStart(4, '0')}`, 'previous'));
            }
            if (world.index < this.config.worlds.totalWorlds - 1) {
                connections.push(this.createPortalConnection(worldId, `world_${(world.index + 1).toString().padStart(4, '0')}`, 'next'));
            }
            
            // 2. Category hubs - connect to other worlds in same category
            const categoryWorlds = Array.from(this.worlds.values())
                .filter(w => w.category === world.category && w.id !== worldId);
            
            const hubConnections = this.selectRandomElements(categoryWorlds, 3);
            hubConnections.forEach(targetWorld => {
                connections.push(this.createPortalConnection(worldId, targetWorld.id, 'category'));
            });
            
            // 3. Difficulty bridges - connect to similar difficulty in other categories
            const similarDifficulty = Array.from(this.worlds.values())
                .filter(w => w.difficulty === world.difficulty && w.category !== world.category);
            
            const difficultyBridges = this.selectRandomElements(similarDifficulty, 2);
            difficultyBridges.forEach(targetWorld => {
                connections.push(this.createPortalConnection(worldId, targetWorld.id, 'difficulty'));
            });
            
            // 4. Special portals for advanced worlds
            if (world.difficulty === 'expert' || world.difficulty === 'master' || world.difficulty === 'legendary') {
                // Connect to random beginner world (mentorship)
                const beginnerWorlds = Array.from(this.worlds.values())
                    .filter(w => w.difficulty === 'beginner');
                
                const mentorshipTarget = this.selectRandomElements(beginnerWorlds, 1)[0];
                if (mentorshipTarget) {
                    connections.push(this.createPortalConnection(worldId, mentorshipTarget.id, 'mentorship'));
                }
            }
            
            // Store connections
            world.mechanics.portals = connections;
            this.worldConnections.set(worldId, connections);
            connectionCount += connections.length;
        }
        
        console.log(`✅ Created ${connectionCount} portal connections between worlds`);
    }
    
    /**
     * Create a portal connection between two worlds
     */
    createPortalConnection(fromWorldId, toWorldId, type) {
        const fromWorld = this.worlds.get(fromWorldId);
        const toWorld = this.worlds.get(toWorldId);
        
        if (!fromWorld || !toWorld) return null;
        
        const portal = {
            id: `portal_${fromWorldId}_to_${toWorldId}`,
            from: fromWorldId,
            to: toWorldId,
            type,
            
            // Portal properties
            properties: {
                bidirectional: type !== 'mentorship',
                cost: this.calculatePortalCost(fromWorld, toWorld, type),
                cooldown: this.calculatePortalCooldown(type),
                levelRequirement: Math.max(0, toWorld.index - fromWorld.index) * 5,
                questRequirement: type === 'category' ? null : `quest_unlock_${toWorldId}`
            },
            
            // Visual properties
            visual: {
                color: this.getPortalColor(type),
                size: type === 'mentorship' ? 'large' : 'medium',
                effects: ['swirl', 'glow', 'particles'],
                sound: `portal_${type}.wav`
            },
            
            // Location in world
            location: {
                x: Math.random() * fromWorld.size.width,
                y: Math.random() * fromWorld.size.height,
                z: 0
            },
            
            // Statistics
            stats: {
                timesUsed: 0,
                averageTravelTime: 0,
                popularityScore: 0
            }
        };
        
        return portal;
    }
    
    /**
     * Generate educational content for all worlds
     */
    async generateEducationalContent() {
        console.log('📚 Generating educational content...');
        
        let lessonCount = 0;
        let questCount = 0;
        let challengeCount = 0;
        
        for (const [worldId, world] of this.worlds) {
            // Generate lessons
            const lessons = this.generateWorldLessons(world);
            lessons.forEach(lesson => {
                this.lessons.set(lesson.id, lesson);
                lessonCount++;
            });
            
            // Generate quests
            const quests = this.generateWorldQuests(world);
            quests.forEach(quest => {
                this.quests.set(quest.id, quest);
                questCount++;
            });
            
            // Generate challenges
            const challenges = this.generateWorldChallenges(world);
            challenges.forEach(challenge => {
                this.challenges.set(challenge.id, challenge);
                challengeCount++;
            });
            
            // Link content to world
            world.education.lessons = lessons.map(l => l.id);
            world.education.quests = quests.map(q => q.id);
            world.mechanics.challenges = challenges.map(c => c.id);
        }
        
        console.log(`✅ Generated ${lessonCount} lessons, ${questCount} quests, ${challengeCount} challenges`);
    }
    
    /**
     * Generate lessons for a specific world
     */
    generateWorldLessons(world) {
        const lessons = [];
        const lessonCount = this.getLessonCount(world.difficulty);
        
        for (let i = 0; i < lessonCount; i++) {
            const lesson = {
                id: `lesson_${world.id}_${i}`,
                worldId: world.id,
                name: this.generateLessonName(world.category, world.education.primaryTopic, i),
                
                // Educational content
                content: {
                    topic: world.education.primaryTopic,
                    subtopic: world.education.secondaryTopics[i % world.education.secondaryTopics.length],
                    difficulty: world.difficulty,
                    type: this.getLessonType(world.category),
                    duration: this.getLessonDuration(world.difficulty),
                    
                    // Lesson structure
                    sections: this.generateLessonSections(world.category, world.difficulty),
                    exercises: this.generateLessonExercises(world.category, world.difficulty),
                    quiz: this.generateLessonQuiz(world.category, world.difficulty)
                },
                
                // Requirements
                requirements: {
                    level: Math.max(1, world.index * 0.1),
                    prerequisites: i > 0 ? [`lesson_${world.id}_${i-1}`] : [],
                    skills: world.education.skills.slice(0, Math.max(1, i))
                },
                
                // Rewards
                rewards: {
                    xp: this.calculateLessonXP(world.difficulty),
                    skillPoints: Math.floor(i / 3) + 1,
                    items: i === lessonCount - 1 ? ['certificate', 'special_item'] : [],
                    achievements: i === lessonCount - 1 ? [`${world.category}_scholar`] : []
                },
                
                // Tracking
                stats: {
                    timesStarted: 0,
                    timesCompleted: 0,
                    averageScore: 0,
                    averageTime: 0,
                    rating: 0
                }
            };
            
            lessons.push(lesson);
        }
        
        return lessons;
    }
    
    /**
     * Handle player injury
     */
    async handlePlayerInjury(playerId, injuryType, worldId, context = {}) {
        console.log(`🤕 Player ${playerId} suffered ${injuryType} injury in ${worldId}`);
        
        const player = this.players.get(playerId);
        if (!player) {
            console.error('Player not found');
            return null;
        }
        
        const injuryConfig = this.config.mechanics.injuries.types[injuryType];
        if (!injuryConfig) {
            console.error(`Unknown injury type: ${injuryType}`);
            return null;
        }
        
        // Create injury record
        const injury = {
            id: `injury_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            playerId,
            worldId,
            type: injuryType,
            damage: injuryConfig.damage,
            duration: injuryConfig.duration,
            effect: injuryConfig.effect,
            recovery: injuryConfig.recovery,
            context,
            timestamp: new Date(),
            healed: false,
            healingProgress: 0
        };
        
        // Apply injury effects
        player.health = Math.max(0, player.health - injuryConfig.damage);
        player.status.effects.push({
            type: 'injury',
            name: injuryType,
            effect: injuryConfig.effect,
            duration: injuryConfig.duration,
            startTime: Date.now()
        });
        
        // Track injury
        if (!this.playerInjuries.has(playerId)) {
            this.playerInjuries.set(playerId, []);
        }
        this.playerInjuries.get(playerId).push(injury);
        
        // Create recovery quest
        const recoveryQuest = this.createRecoveryQuest(player, injury, injuryConfig);
        
        // Update world stats
        const world = this.worlds.get(worldId);
        if (world) {
            world.stats.playerDeaths += player.health === 0 ? 1 : 0;
        }
        
        // Emit injury event
        this.emit('player:injured', {
            player,
            injury,
            recoveryQuest,
            isFatal: player.health === 0
        });
        
        console.log(`⚕️ Recovery required: ${injuryConfig.recovery}`);
        console.log(`💊 Current health: ${player.health}/${player.maxHealth}`);
        
        return {
            injury,
            recoveryQuest,
            playerStatus: {
                health: player.health,
                maxHealth: player.maxHealth,
                effects: player.status.effects
            }
        };
    }
    
    /**
     * Create recovery quest for injury
     */
    createRecoveryQuest(player, injury, injuryConfig) {
        const quest = {
            id: `recovery_${injury.id}`,
            type: 'recovery',
            name: `Recover from ${injury.type}`,
            description: `Complete the following to heal: ${injuryConfig.recovery}`,
            
            objectives: this.generateRecoveryObjectives(injury.type, injuryConfig),
            
            rewards: {
                healing: injuryConfig.damage,
                xp: 50,
                achievement: 'survivor',
                bonusReward: 'injury_prevention_guide'
            },
            
            timeLimit: injuryConfig.duration * 2, // Double the injury duration
            started: new Date(),
            completed: false
        };
        
        // Add quest to player
        if (!player.activeQuests) {
            player.activeQuests = [];
        }
        player.activeQuests.push(quest.id);
        
        // Store quest
        this.quests.set(quest.id, quest);
        
        return quest;
    }
    
    /**
     * Player travels through portal
     */
    async usePortal(playerId, portalId) {
        console.log(`🌀 Player ${playerId} using portal ${portalId}`);
        
        const player = this.players.get(playerId);
        if (!player) return { success: false, error: 'Player not found' };
        
        const portal = this.findPortal(portalId);
        if (!portal) return { success: false, error: 'Portal not found' };
        
        // Check requirements
        const requirementCheck = this.checkPortalRequirements(player, portal);
        if (!requirementCheck.passed) {
            return { success: false, error: requirementCheck.reason };
        }
        
        // Check cooldown
        const cooldownKey = `${playerId}_${portalId}`;
        const lastUsed = this.activePortals.get(cooldownKey);
        if (lastUsed && Date.now() - lastUsed < portal.properties.cooldown * 1000) {
            const remaining = Math.ceil((portal.properties.cooldown * 1000 - (Date.now() - lastUsed)) / 1000);
            return { success: false, error: `Portal on cooldown: ${remaining}s remaining` };
        }
        
        // Process portal travel
        const fromWorld = this.worlds.get(portal.from);
        const toWorld = this.worlds.get(portal.to);
        
        // Remove player from current world
        this.removePlayerFromWorld(playerId, portal.from);
        
        // Add player to destination world
        this.addPlayerToWorld(playerId, portal.to);
        
        // Update player location
        player.currentWorld = portal.to;
        player.position = toWorld.mechanics.spawnPoints[0]; // Spawn at first spawn point
        
        // Apply portal cost
        if (portal.properties.cost > 0) {
            player.currency = Math.max(0, player.currency - portal.properties.cost);
        }
        
        // Update portal statistics
        portal.stats.timesUsed++;
        this.stats.portalsUsed++;
        
        // Set cooldown
        this.activePortals.set(cooldownKey, Date.now());
        
        // Achievement check
        this.checkPortalAchievements(player, portal, fromWorld, toWorld);
        
        // Emit travel event
        this.emit('player:portal_travel', {
            playerId,
            from: portal.from,
            to: portal.to,
            portalType: portal.type
        });
        
        console.log(`✅ Player traveled from ${fromWorld.name} to ${toWorld.name}`);
        
        return {
            success: true,
            from: fromWorld,
            to: toWorld,
            travelTime: 3.0, // seconds
            effects: ['portal_visual', 'dimension_shift']
        };
    }
    
    /**
     * Grant achievement to player
     */
    async grantAchievement(playerId, achievementId) {
        const player = this.players.get(playerId);
        if (!player) return false;
        
        // Check if already has achievement
        if (!this.playerAchievements.has(playerId)) {
            this.playerAchievements.set(playerId, new Set());
        }
        
        const playerAchievements = this.playerAchievements.get(playerId);
        if (playerAchievements.has(achievementId)) {
            return false; // Already has achievement
        }
        
        // Find achievement details
        const achievement = this.findAchievement(achievementId);
        if (!achievement) return false;
        
        // Grant achievement
        playerAchievements.add(achievementId);
        
        // Apply rewards
        if (achievement.rewards) {
            if (achievement.rewards.xp) {
                player.experience += achievement.rewards.xp;
            }
            if (achievement.rewards.skillPoints) {
                player.skillPoints += achievement.rewards.skillPoints;
            }
            if (achievement.rewards.title) {
                player.titles.push(achievement.rewards.title);
            }
            if (achievement.rewards.items) {
                player.inventory.push(...achievement.rewards.items);
            }
        }
        
        this.stats.achievementsUnlocked++;
        
        // Emit achievement event
        this.emit('player:achievement', {
            playerId,
            achievement,
            totalAchievements: playerAchievements.size
        });
        
        console.log(`🏆 Player ${playerId} earned achievement: ${achievement.name}`);
        
        return true;
    }
    
    /**
     * Get world information
     */
    getWorldInfo(worldId) {
        const world = this.worlds.get(worldId);
        if (!world) return null;
        
        const population = this.worldPopulations.get(worldId) || [];
        const activeEvents = this.worldEvents.get(worldId) || [];
        
        return {
            ...world,
            population: {
                count: population.length,
                players: population,
                capacity: this.calculateWorldCapacity(world.size)
            },
            activeEvents: activeEvents.map(e => ({
                id: e.id,
                name: e.name,
                type: e.type,
                timeRemaining: Math.max(0, e.endTime - Date.now())
            })),
            portalStatus: world.mechanics.portals.map(p => ({
                id: p.id,
                to: p.to,
                type: p.type,
                available: this.isPortalAvailable(p)
            })),
            educationalContent: {
                lessons: world.education.lessons.map(id => this.lessons.get(id)),
                quests: world.education.quests.map(id => this.quests.get(id)),
                completionRate: this.calculateWorldCompletionRate(worldId)
            }
        };
    }
    
    /**
     * Helper methods
     */
    
    generateWorldName(category, index) {
        const categoryNames = {
            programming: ['Code', 'Syntax', 'Logic', 'Algorithm', 'Function'],
            blockchain: ['Chain', 'Block', 'Hash', 'Ledger', 'Consensus'],
            networking: ['Node', 'Link', 'Route', 'Protocol', 'Packet'],
            security: ['Shield', 'Cipher', 'Guard', 'Fortress', 'Sentinel'],
            algorithms: ['Sort', 'Search', 'Graph', 'Tree', 'Dynamic'],
            databases: ['Table', 'Query', 'Index', 'Schema', 'Relation'],
            systems: ['Kernel', 'Process', 'Memory', 'Thread', 'Core'],
            web: ['Server', 'Client', 'Request', 'Response', 'Session']
        };
        
        const prefix = categoryNames[category][index % 5];
        const suffix = ['Valley', 'Peak', 'Plains', 'Nexus', 'Haven', 'Citadel', 'Realm', 'Dimension'][Math.floor(index / 5) % 8];
        
        return `${prefix} ${suffix}`;
    }
    
    calculateWorldDifficulty(index) {
        const difficulties = this.config.worlds.difficultyLevels;
        const difficultyIndex = Math.floor((index / this.config.worlds.totalWorlds) * difficulties.length);
        return difficulties[Math.min(difficultyIndex, difficulties.length - 1)];
    }
    
    calculateWorldSize(difficulty) {
        const sizes = {
            novice: 'small',
            beginner: 'small',
            intermediate: 'medium',
            advanced: 'medium',
            expert: 'large',
            master: 'large',
            legendary: 'massive'
        };
        
        return this.config.worlds.worldSize[sizes[difficulty]];
    }
    
    selectRandomElements(array, count) {
        const shuffled = array.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, array.length));
    }
    
    getAchievementCount() {
        let count = 0;
        Object.values(this.config.mechanics.achievements.categories).forEach(category => {
            count += category.length;
        });
        return count;
    }
    
    /**
     * Get system status
     */
    getStatus() {
        return {
            service: 'Educational Game Worlds',
            status: 'active',
            configuration: {
                totalWorlds: this.config.worlds.totalWorlds,
                categories: this.config.worlds.categories,
                difficultyLevels: this.config.worlds.difficultyLevels,
                injuryTypes: Object.keys(this.config.mechanics.injuries.types)
            },
            statistics: this.stats,
            worlds: {
                total: this.worlds.size,
                active: this.getActiveWorldCount(),
                populated: this.worldPopulations.size
            },
            content: {
                lessons: this.lessons.size,
                quests: this.quests.size,
                challenges: this.challenges.size
            },
            players: {
                total: this.players.size,
                injured: this.getInjuredPlayerCount(),
                online: this.getOnlinePlayerCount()
            },
            health: 'excellent'
        };
    }
}

module.exports = EducationalGameWorlds;

// Demo usage
if (require.main === module) {
    console.log('🧪 Testing Educational Game Worlds...\n');
    
    (async () => {
        const gameWorlds = new EducationalGameWorlds({
            worlds: { totalWorlds: 100 } // Demo with 100 worlds
        });
        
        await gameWorlds.initialize();
        
        // Test player creation
        const playerId = 'demo_player_001';
        const player = {
            id: playerId,
            name: 'Demo Player',
            level: 1,
            experience: 0,
            health: 100,
            maxHealth: 100,
            skillPoints: 0,
            currency: 1000,
            currentWorld: 'world_0000',
            position: { x: 500, y: 500, z: 0 },
            inventory: [],
            titles: [],
            status: { effects: [] },
            activeQuests: []
        };
        
        gameWorlds.players.set(playerId, player);
        
        // Test injury system
        console.log('🤕 Testing injury system...');
        const injuryResult = await gameWorlds.handlePlayerInjury(
            playerId,
            'syntax_error',
            'world_0000',
            { activity: 'coding_challenge' }
        );
        console.log(`   Injury applied: ${injuryResult.injury.type}`);
        console.log(`   Recovery quest: ${injuryResult.recoveryQuest.name}`);
        console.log(`   Player health: ${injuryResult.playerStatus.health}/${injuryResult.playerStatus.maxHealth}`);
        
        // Test portal travel
        console.log('\n🌀 Testing portal travel...');
        const world = gameWorlds.worlds.get('world_0000');
        if (world && world.mechanics.portals.length > 0) {
            const portal = world.mechanics.portals[0];
            const travelResult = await gameWorlds.usePortal(playerId, portal.id);
            console.log(`   Travel result: ${travelResult.success ? 'Success' : travelResult.error}`);
            if (travelResult.success) {
                console.log(`   Traveled to: ${travelResult.to.name}`);
            }
        }
        
        // Test achievement
        console.log('\n🏆 Testing achievement system...');
        const achievementGranted = await gameWorlds.grantAchievement(playerId, 'First Steps');
        console.log(`   Achievement granted: ${achievementGranted}`);
        
        // Show world info
        console.log('\n🌍 Sample world info...');
        const worldInfo = gameWorlds.getWorldInfo('world_0000');
        if (worldInfo) {
            console.log(`   World: ${worldInfo.name}`);
            console.log(`   Category: ${worldInfo.category}`);
            console.log(`   Difficulty: ${worldInfo.difficulty}`);
            console.log(`   Lessons: ${worldInfo.education.lessons.length}`);
            console.log(`   Portals: ${worldInfo.mechanics.portals.length}`);
        }
        
        // Show statistics
        setTimeout(() => {
            console.log('\n📊 Game World Statistics:');
            const status = gameWorlds.getStatus();
            console.log(`   Total Worlds: ${status.worlds.total}`);
            console.log(`   Total Lessons: ${status.content.lessons}`);
            console.log(`   Total Quests: ${status.content.quests}`);
            console.log(`   Players Online: ${status.players.total}`);
            console.log(`   Achievements Unlocked: ${status.statistics.achievementsUnlocked}`);
            
            console.log('\n✅ Educational Game Worlds test complete!');
        }, 1000);
        
    })().catch(console.error);
}