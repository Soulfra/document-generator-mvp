/**
 * 📊 Progress Tracker System
 * Comprehensive tracking of learning progress, XP, achievements, and skill development
 * Supports multiple players, advanced analytics, and motivational features
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class ProgressTrackerSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            persistentStorage: options.persistentStorage !== false,
            storageLocation: options.storageLocation || './progress_data',
            analyticsEnabled: options.analyticsEnabled !== false,
            achievementSystem: options.achievementSystem !== false,
            motivationalFeatures: options.motivationalFeatures !== false,
            multiPlayerSupport: options.multiPlayerSupport !== false,
            ...options
        };
        
        // Initialize storage
        this.players = new Map();
        this.achievements = new Map();
        this.globalStats = {
            totalPlayers: 0,
            totalXPEarned: 0,
            totalGamesPlayed: 0,
            averageSessionTime: 0,
            completionRates: {}
        };
        
        // Skill system with progression trees
        this.skillSystem = {
            // Technical Skills
            data_analysis: {
                name: 'Data Analysis',
                category: 'technical',
                description: 'Ability to interpret and understand data patterns',
                levels: {
                    1: { name: 'Novice', xp_required: 0, abilities: ['basic_pattern_recognition'] },
                    2: { name: 'Apprentice', xp_required: 200, abilities: ['data_filtering', 'trend_identification'] },
                    3: { name: 'Competent', xp_required: 500, abilities: ['statistical_analysis', 'correlation_detection'] },
                    4: { name: 'Proficient', xp_required: 1000, abilities: ['predictive_modeling', 'anomaly_detection'] },
                    5: { name: 'Expert', xp_required: 2000, abilities: ['machine_learning', 'data_orchestration'] }
                },
                prerequisites: [],
                synergies: ['systems_thinking', 'pattern_recognition']
            },
            
            systems_thinking: {
                name: 'Systems Thinking',
                category: 'conceptual',
                description: 'Understanding complex interconnected systems',
                levels: {
                    1: { name: 'Novice', xp_required: 0, abilities: ['component_identification'] },
                    2: { name: 'Apprentice', xp_required: 150, abilities: ['relationship_mapping', 'feedback_loops'] },
                    3: { name: 'Competent', xp_required: 400, abilities: ['system_modeling', 'emergent_properties'] },
                    4: { name: 'Proficient', xp_required: 800, abilities: ['system_optimization', 'cascade_analysis'] },
                    5: { name: 'Expert', xp_required: 1600, abilities: ['system_design', 'complexity_management'] }
                },
                prerequisites: [],
                synergies: ['technical_architecture', 'integration_thinking']
            },
            
            pattern_recognition: {
                name: 'Pattern Recognition',
                category: 'cognitive',
                description: 'Identifying patterns and relationships in information',
                levels: {
                    1: { name: 'Novice', xp_required: 0, abilities: ['simple_patterns'] },
                    2: { name: 'Apprentice', xp_required: 100, abilities: ['sequence_recognition', 'similarity_detection'] },
                    3: { name: 'Competent', xp_required: 300, abilities: ['complex_patterns', 'pattern_prediction'] },
                    4: { name: 'Proficient', xp_required: 600, abilities: ['meta_patterns', 'pattern_generation'] },
                    5: { name: 'Expert', xp_required: 1200, abilities: ['pattern_mastery', 'intuitive_recognition'] }
                },
                prerequisites: [],
                synergies: ['data_analysis', 'logical_thinking']
            },
            
            technical_architecture: {
                name: 'Technical Architecture',
                category: 'technical',
                description: 'Designing and implementing technical systems',
                levels: {
                    1: { name: 'Novice', xp_required: 0, abilities: ['component_understanding'] },
                    2: { name: 'Apprentice', xp_required: 250, abilities: ['interface_design', 'modular_thinking'] },
                    3: { name: 'Competent', xp_required: 600, abilities: ['system_integration', 'scalability_planning'] },
                    4: { name: 'Proficient', xp_required: 1200, abilities: ['optimization_strategies', 'fault_tolerance'] },
                    5: { name: 'Expert', xp_required: 2400, abilities: ['architecture_mastery', 'innovation_design'] }
                },
                prerequisites: ['systems_thinking'],
                synergies: ['data_analysis', 'optimization_thinking']
            },
            
            integration_thinking: {
                name: 'Integration Thinking',
                category: 'conceptual',
                description: 'Ability to bring together disparate elements into unified wholes',
                levels: {
                    1: { name: 'Novice', xp_required: 0, abilities: ['basic_combination'] },
                    2: { name: 'Apprentice', xp_required: 180, abilities: ['element_synthesis', 'harmony_creation'] },
                    3: { name: 'Competent', xp_required: 450, abilities: ['complex_integration', 'convergence_mastery'] },
                    4: { name: 'Proficient', xp_required: 900, abilities: ['meta_integration', 'unity_orchestration'] },
                    5: { name: 'Expert', xp_required: 1800, abilities: ['transcendent_integration', 'wholeness_creation'] }
                },
                prerequisites: ['pattern_recognition'],
                synergies: ['systems_thinking', 'spatial_reasoning']
            },
            
            historical_understanding: {
                name: 'Historical Understanding',
                category: 'knowledge',
                description: 'Comprehension of historical context and cultural evolution',
                levels: {
                    1: { name: 'Novice', xp_required: 0, abilities: ['timeline_awareness'] },
                    2: { name: 'Apprentice', xp_required: 120, abilities: ['cultural_context', 'cause_effect_chains'] },
                    3: { name: 'Competent', xp_required: 350, abilities: ['pattern_across_time', 'cultural_synthesis'] },
                    4: { name: 'Proficient', xp_required: 700, abilities: ['historical_analysis', 'temporal_modeling'] },
                    5: { name: 'Expert', xp_required: 1400, abilities: ['wisdom_extraction', 'temporal_mastery'] }
                },
                prerequisites: [],
                synergies: ['pattern_recognition', 'cultural_awareness']
            }
        };
        
        // Achievement system with rarities and categories
        this.achievementTemplates = {
            // Learning Milestones
            first_steps: {
                id: 'first_steps',
                name: 'First Steps',
                description: 'Complete your first learning challenge',
                category: 'milestone',
                rarity: 'common',
                icon: '👶',
                xp_reward: 50,
                unlock_condition: { type: 'games_completed', value: 1 }
            },
            
            chapter_master: {
                id: 'chapter_master',
                name: 'Chapter Master',
                description: 'Complete an entire chapter',
                category: 'milestone',
                rarity: 'uncommon',
                icon: '📚',
                xp_reward: 200,
                unlock_condition: { type: 'chapters_completed', value: 1 }
            },
            
            boss_slayer: {
                id: 'boss_slayer',
                name: 'Boss Slayer',
                description: 'Defeat your first boss',
                category: 'combat',
                rarity: 'rare',
                icon: '⚔️',
                xp_reward: 300,
                unlock_condition: { type: 'bosses_defeated', value: 1 }
            },
            
            // Skill Achievements
            pattern_master: {
                id: 'pattern_master',
                name: 'Pattern Master',
                description: 'Reach Expert level in Pattern Recognition',
                category: 'skill',
                rarity: 'epic',
                icon: '🧩',
                xp_reward: 500,
                unlock_condition: { type: 'skill_level', skill: 'pattern_recognition', value: 5 }
            },
            
            systems_architect: {
                id: 'systems_architect',
                name: 'Systems Architect',
                description: 'Reach Expert level in Technical Architecture',
                category: 'skill',
                rarity: 'epic',
                icon: '🏗️',
                xp_reward: 500,
                unlock_condition: { type: 'skill_level', skill: 'technical_architecture', value: 5 }
            },
            
            // Performance Achievements
            speed_demon: {
                id: 'speed_demon',
                name: 'Speed Demon',
                description: 'Complete 10 challenges in record time',
                category: 'performance',
                rarity: 'rare',
                icon: '⚡',
                xp_reward: 250,
                unlock_condition: { type: 'speed_completions', value: 10 }
            },
            
            perfectionist: {
                id: 'perfectionist',
                name: 'Perfectionist',
                description: 'Achieve 100% accuracy on 5 consecutive challenges',
                category: 'performance',
                rarity: 'epic',
                icon: '💎',
                xp_reward: 400,
                unlock_condition: { type: 'perfect_streak', value: 5 }
            },
            
            // Special Achievements
            knowledge_seeker: {
                id: 'knowledge_seeker',
                name: 'Knowledge Seeker',
                description: 'Spend 10 hours in learning activities',
                category: 'dedication',
                rarity: 'uncommon',
                icon: '🔍',
                xp_reward: 300,
                unlock_condition: { type: 'time_spent', value: 36000 } // 10 hours in seconds
            },
            
            legend: {
                id: 'legend',
                name: 'Legend',
                description: 'Reach Expert level in all skills',
                category: 'ultimate',
                rarity: 'legendary',
                icon: '👑',
                xp_reward: 2000,
                unlock_condition: { type: 'all_skills_expert', value: true }
            }
        };
        
        // Initialize storage if persistent
        if (this.options.persistentStorage) {
            this.initializeStorage();
        }
    }
    
    /**
     * Initialize persistent storage
     */
    async initializeStorage() {
        try {
            await fs.mkdir(this.options.storageLocation, { recursive: true });
            await this.loadPersistedData();
        } catch (error) {
            console.warn('⚠️ Storage initialization failed:', error.message);
        }
    }
    
    /**
     * Load persisted progress data
     */
    async loadPersistedData() {
        try {
            const playersFile = path.join(this.options.storageLocation, 'players.json');
            const globalStatsFile = path.join(this.options.storageLocation, 'global_stats.json');
            
            try {
                const playersData = await fs.readFile(playersFile, 'utf8');
                const playersArray = JSON.parse(playersData);
                this.players = new Map(playersArray);
                console.log(`📊 Loaded ${this.players.size} player profiles`);
            } catch (error) {
                console.log('📊 No existing player data found, starting fresh');
            }
            
            try {
                const globalData = await fs.readFile(globalStatsFile, 'utf8');
                this.globalStats = JSON.parse(globalData);
                console.log('📊 Loaded global statistics');
            } catch (error) {
                console.log('📊 No existing global stats found, starting fresh');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load persisted data:', error.message);
        }
    }
    
    /**
     * Save progress data to persistent storage
     */
    async saveProgress() {
        if (!this.options.persistentStorage) return;
        
        try {
            const playersFile = path.join(this.options.storageLocation, 'players.json');
            const globalStatsFile = path.join(this.options.storageLocation, 'global_stats.json');
            
            // Convert Map to Array for JSON serialization
            const playersArray = Array.from(this.players.entries());
            
            await fs.writeFile(playersFile, JSON.stringify(playersArray, null, 2));
            await fs.writeFile(globalStatsFile, JSON.stringify(this.globalStats, null, 2));
            
            this.emit('progress_saved', { players: this.players.size });
        } catch (error) {
            console.error('❌ Failed to save progress:', error);
            this.emit('save_error', { error });
        }
    }
    
    /**
     * Create or get player profile
     */
    getOrCreatePlayer(playerId, playerData = {}) {
        if (!this.players.has(playerId)) {
            const newPlayer = {
                id: playerId,
                name: playerData.name || `Player_${playerId.slice(0, 8)}`,
                created_at: new Date().toISOString(),
                
                // Progress tracking
                total_xp: 0,
                level: 1,
                chapters_completed: 0,
                games_completed: 0,
                bosses_defeated: 0,
                total_play_time: 0,
                
                // Skills with XP and levels
                skills: {},
                
                // Achievement tracking
                achievements: new Set(),
                achievement_progress: {},
                
                // Performance metrics
                average_accuracy: 0,
                best_streak: 0,
                current_streak: 0,
                speed_completions: 0,
                perfect_completions: 0,
                
                // Session data
                current_session: {
                    start_time: null,
                    xp_earned: 0,
                    games_played: 0,
                    activities: []
                },
                
                // Learning analytics
                learning_analytics: {
                    preferred_learning_style: 'unknown',
                    strength_skills: [],
                    improvement_areas: [],
                    engagement_patterns: {},
                    difficulty_preference: 'adaptive'
                },
                
                // Customization
                preferences: {
                    theme: playerData.theme || 'scholastic_bright',
                    character_skin: playerData.character_skin || 'default_learner',
                    notifications: true,
                    sound_effects: true,
                    motivational_messages: true
                }
            };
            
            // Initialize all skills at level 1
            for (const [skillId, skillData] of Object.entries(this.skillSystem)) {
                newPlayer.skills[skillId] = {
                    level: 1,
                    xp: 0,
                    total_xp_earned: 0,
                    unlocked_abilities: skillData.levels[1].abilities.slice()
                };
            }
            
            this.players.set(playerId, newPlayer);
            this.globalStats.totalPlayers++;
            
            console.log(`🎮 Created new player profile: ${newPlayer.name}`);
            this.emit('player_created', { playerId, player: newPlayer });
        }
        
        return this.players.get(playerId);
    }
    
    /**
     * Start a learning session
     */
    startSession(playerId) {
        const player = this.getOrCreatePlayer(playerId);
        
        player.current_session = {
            start_time: new Date().toISOString(),
            xp_earned: 0,
            games_played: 0,
            activities: []
        };
        
        console.log(`🎯 Session started for ${player.name}`);
        this.emit('session_started', { playerId, player });
        
        return player.current_session;
    }
    
    /**
     * End a learning session
     */
    endSession(playerId) {
        const player = this.getOrCreatePlayer(playerId);
        
        if (!player.current_session.start_time) {
            console.warn('⚠️ No active session to end');
            return null;
        }
        
        const sessionDuration = new Date() - new Date(player.current_session.start_time);
        player.total_play_time += Math.floor(sessionDuration / 1000);
        
        const sessionSummary = {
            duration: sessionDuration,
            xp_earned: player.current_session.xp_earned,
            games_played: player.current_session.games_played,
            activities: player.current_session.activities.slice()
        };
        
        // Reset session
        player.current_session = {
            start_time: null,
            xp_earned: 0,
            games_played: 0,
            activities: []
        };
        
        // Update global stats
        this.globalStats.averageSessionTime = this.calculateAverageSessionTime();
        
        console.log(`🏁 Session ended for ${player.name}: ${Math.floor(sessionDuration / 1000)}s, +${sessionSummary.xp_earned} XP`);
        this.emit('session_ended', { playerId, player, summary: sessionSummary });
        
        this.saveProgress();
        return sessionSummary;
    }
    
    /**
     * Award XP and update progress
     */
    awardXP(playerId, xpAmount, source = 'activity', context = {}) {
        const player = this.getOrCreatePlayer(playerId);
        
        // Award base XP
        player.total_xp += xpAmount;
        player.current_session.xp_earned += xpAmount;
        
        // Update global stats
        this.globalStats.totalXPEarned += xpAmount;
        
        // Check for level up
        const oldLevel = player.level;
        player.level = this.calculatePlayerLevel(player.total_xp);
        
        if (player.level > oldLevel) {
            console.log(`🎉 ${player.name} leveled up! Level ${oldLevel} → ${player.level}`);
            this.emit('level_up', { playerId, player, oldLevel, newLevel: player.level });
        }
        
        // Award skill XP if specified
        if (context.skills_used) {
            for (const skillId of context.skills_used) {
                this.awardSkillXP(playerId, skillId, Math.floor(xpAmount * 0.3), context);
            }
        }
        
        // Track activity
        player.current_session.activities.push({
            timestamp: new Date().toISOString(),
            type: source,
            xp_awarded: xpAmount,
            context: context
        });
        
        // Check achievements
        this.checkAchievements(playerId);
        
        console.log(`💰 ${player.name} earned ${xpAmount} XP from ${source} (Total: ${player.total_xp})`);
        this.emit('xp_awarded', { playerId, player, xpAmount, source, context });
        
        return player.total_xp;
    }
    
    /**
     * Award skill-specific XP
     */
    awardSkillXP(playerId, skillId, xpAmount, context = {}) {
        const player = this.getOrCreatePlayer(playerId);
        
        if (!this.skillSystem[skillId]) {
            console.warn(`⚠️ Unknown skill: ${skillId}`);
            return false;
        }
        
        if (!player.skills[skillId]) {
            player.skills[skillId] = {
                level: 1,
                xp: 0,
                total_xp_earned: 0,
                unlocked_abilities: this.skillSystem[skillId].levels[1].abilities.slice()
            };
        }
        
        const skill = player.skills[skillId];
        const oldLevel = skill.level;
        
        skill.xp += xpAmount;
        skill.total_xp_earned += xpAmount;
        
        // Check for skill level up
        const skillData = this.skillSystem[skillId];
        let newLevel = oldLevel;
        
        for (let level = oldLevel + 1; level <= 5; level++) {
            if (skill.xp >= skillData.levels[level].xp_required) {
                newLevel = level;
                // Unlock new abilities
                skill.unlocked_abilities.push(...skillData.levels[level].abilities);
            } else {
                break;
            }
        }
        
        skill.level = newLevel;
        
        if (newLevel > oldLevel) {
            console.log(`🚀 ${player.name} improved ${skillData.name}! Level ${oldLevel} → ${newLevel}`);
            this.emit('skill_level_up', { 
                playerId, 
                player, 
                skillId, 
                skillName: skillData.name,
                oldLevel, 
                newLevel 
            });
        }
        
        console.log(`📈 ${player.name} gained ${xpAmount} XP in ${skillData.name} (Level ${skill.level})`);
        return true;
    }
    
    /**
     * Record game completion
     */
    recordGameCompletion(playerId, gameData = {}) {
        const player = this.getOrCreatePlayer(playerId);
        
        player.games_completed++;
        player.current_session.games_played++;
        
        // Update global stats
        this.globalStats.totalGamesPlayed++;
        
        // Track performance metrics
        if (gameData.accuracy !== undefined) {
            player.average_accuracy = (player.average_accuracy * (player.games_completed - 1) + gameData.accuracy) / player.games_completed;
        }
        
        if (gameData.perfect_score) {
            player.perfect_completions++;
            player.current_streak++;
            player.best_streak = Math.max(player.best_streak, player.current_streak);
        } else {
            player.current_streak = 0;
        }
        
        if (gameData.under_time_limit) {
            player.speed_completions++;
        }
        
        // Award XP for completion
        const baseXP = gameData.xp_reward || 100;
        let bonusXP = 0;
        
        if (gameData.perfect_score) bonusXP += Math.floor(baseXP * 0.5);
        if (gameData.under_time_limit) bonusXP += Math.floor(baseXP * 0.3);
        
        this.awardXP(playerId, baseXP + bonusXP, 'game_completion', gameData);
        
        console.log(`🎮 ${player.name} completed game: ${gameData.name || 'Unknown'} (+${baseXP + bonusXP} XP)`);
        this.emit('game_completed', { playerId, player, gameData, xpAwarded: baseXP + bonusXP });
        
        return {
            xpAwarded: baseXP + bonusXP,
            achievements: this.checkAchievements(playerId)
        };
    }
    
    /**
     * Record chapter completion
     */
    recordChapterCompletion(playerId, chapterData = {}) {
        const player = this.getOrCreatePlayer(playerId);
        
        player.chapters_completed++;
        
        // Award substantial XP for chapter completion
        const chapterXP = chapterData.xp_reward || 500;
        this.awardXP(playerId, chapterXP, 'chapter_completion', chapterData);
        
        console.log(`📚 ${player.name} completed chapter: ${chapterData.name || 'Unknown'} (+${chapterXP} XP)`);
        this.emit('chapter_completed', { playerId, player, chapterData, xpAwarded: chapterXP });
        
        return {
            xpAwarded: chapterXP,
            achievements: this.checkAchievements(playerId)
        };
    }
    
    /**
     * Record boss defeat
     */
    recordBossDefeat(playerId, bossData = {}) {
        const player = this.getOrCreatePlayer(playerId);
        
        player.bosses_defeated++;
        
        // Award major XP for boss defeat
        const bossXP = bossData.xp_reward || 750;
        this.awardXP(playerId, bossXP, 'boss_defeat', bossData);
        
        console.log(`⚔️ ${player.name} defeated boss: ${bossData.name || 'Unknown'} (+${bossXP} XP)`);
        this.emit('boss_defeated', { playerId, player, bossData, xpAwarded: bossXP });
        
        return {
            xpAwarded: bossXP,
            achievements: this.checkAchievements(playerId)
        };
    }
    
    /**
     * Check and award achievements
     */
    checkAchievements(playerId) {
        const player = this.getOrCreatePlayer(playerId);
        const newAchievements = [];
        
        for (const [achievementId, achievement] of Object.entries(this.achievementTemplates)) {
            if (player.achievements.has(achievementId)) continue;
            
            if (this.checkAchievementCondition(player, achievement.unlock_condition)) {
                player.achievements.add(achievementId);
                this.awardXP(playerId, achievement.xp_reward, 'achievement', { achievementId });
                newAchievements.push(achievement);
                
                console.log(`🏆 ${player.name} unlocked achievement: ${achievement.name}!`);
                this.emit('achievement_unlocked', { playerId, player, achievement });
            }
        }
        
        return newAchievements;
    }
    
    /**
     * Check if achievement condition is met
     */
    checkAchievementCondition(player, condition) {
        switch (condition.type) {
            case 'games_completed':
                return player.games_completed >= condition.value;
            case 'chapters_completed':
                return player.chapters_completed >= condition.value;
            case 'bosses_defeated':
                return player.bosses_defeated >= condition.value;
            case 'skill_level':
                return player.skills[condition.skill]?.level >= condition.value;
            case 'speed_completions':
                return player.speed_completions >= condition.value;
            case 'perfect_streak':
                return player.best_streak >= condition.value;
            case 'time_spent':
                return player.total_play_time >= condition.value;
            case 'all_skills_expert':
                return Object.values(player.skills).every(skill => skill.level >= 5);
            default:
                return false;
        }
    }
    
    /**
     * Get player progress dashboard
     */
    getPlayerDashboard(playerId) {
        const player = this.getOrCreatePlayer(playerId);
        
        return {
            player: {
                id: player.id,
                name: player.name,
                level: player.level,
                total_xp: player.total_xp,
                xp_to_next_level: this.getXPToNextLevel(player.total_xp),
                play_time_hours: Math.floor(player.total_play_time / 3600)
            },
            
            progress: {
                chapters_completed: player.chapters_completed,
                games_completed: player.games_completed,
                bosses_defeated: player.bosses_defeated,
                average_accuracy: Math.round(player.average_accuracy * 100),
                best_streak: player.best_streak
            },
            
            skills: Object.entries(player.skills).map(([skillId, skill]) => ({
                id: skillId,
                name: this.skillSystem[skillId].name,
                level: skill.level,
                xp: skill.xp,
                xp_to_next: this.getSkillXPToNext(skillId, skill.level),
                abilities: skill.unlocked_abilities,
                progress_percent: this.getSkillProgressPercent(skillId, skill.level, skill.xp)
            })),
            
            achievements: {
                unlocked: Array.from(player.achievements).map(id => this.achievementTemplates[id]).filter(Boolean),
                total_unlocked: player.achievements.size,
                total_available: Object.keys(this.achievementTemplates).length,
                completion_percent: Math.round((player.achievements.size / Object.keys(this.achievementTemplates).length) * 100)
            },
            
            session: player.current_session.start_time ? {
                active: true,
                start_time: player.current_session.start_time,
                xp_earned: player.current_session.xp_earned,
                games_played: player.current_session.games_played
            } : { active: false }
        };
    }
    
    /**
     * Get global leaderboards and statistics
     */
    getGlobalStats() {
        const playerArray = Array.from(this.players.values());
        
        return {
            global: this.globalStats,
            
            leaderboards: {
                top_xp: playerArray
                    .sort((a, b) => b.total_xp - a.total_xp)
                    .slice(0, 10)
                    .map(p => ({ name: p.name, xp: p.total_xp, level: p.level })),
                    
                most_chapters: playerArray
                    .sort((a, b) => b.chapters_completed - a.chapters_completed)
                    .slice(0, 10)
                    .map(p => ({ name: p.name, chapters: p.chapters_completed })),
                    
                boss_slayers: playerArray
                    .sort((a, b) => b.bosses_defeated - a.bosses_defeated)
                    .slice(0, 10)
                    .map(p => ({ name: p.name, bosses: p.bosses_defeated })),
                    
                longest_streaks: playerArray
                    .sort((a, b) => b.best_streak - a.best_streak)
                    .slice(0, 10)
                    .map(p => ({ name: p.name, streak: p.best_streak }))
            },
            
            skill_distribution: this.getSkillDistribution()
        };
    }
    
    // Helper methods
    calculatePlayerLevel(totalXP) {
        // Progressive XP requirements: 100, 250, 450, 700, 1000, 1350, 1750, 2200, etc.
        let level = 1;
        let xpRequired = 0;
        let increment = 100;
        
        while (totalXP >= xpRequired + increment) {
            xpRequired += increment;
            level++;
            increment += 50; // Increase XP requirement each level
        }
        
        return level;
    }
    
    getXPToNextLevel(totalXP) {
        const currentLevel = this.calculatePlayerLevel(totalXP);
        let xpRequired = 0;
        let increment = 100;
        
        for (let i = 1; i < currentLevel; i++) {
            xpRequired += increment;
            increment += 50;
        }
        
        const nextLevelXP = xpRequired + increment;
        return nextLevelXP - totalXP;
    }
    
    getSkillXPToNext(skillId, currentLevel) {
        const skillData = this.skillSystem[skillId];
        if (currentLevel >= 5) return 0;
        
        return skillData.levels[currentLevel + 1].xp_required;
    }
    
    getSkillProgressPercent(skillId, currentLevel, currentXP) {
        if (currentLevel >= 5) return 100;
        
        const skillData = this.skillSystem[skillId];
        const currentLevelXP = skillData.levels[currentLevel].xp_required;
        const nextLevelXP = skillData.levels[currentLevel + 1].xp_required;
        
        const progress = (currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
        return Math.round(Math.max(0, Math.min(100, progress * 100)));
    }
    
    calculateAverageSessionTime() {
        const playerArray = Array.from(this.players.values());
        if (playerArray.length === 0) return 0;
        
        const totalTime = playerArray.reduce((sum, player) => sum + player.total_play_time, 0);
        return Math.floor(totalTime / playerArray.length);
    }
    
    getSkillDistribution() {
        const playerArray = Array.from(this.players.values());
        const distribution = {};
        
        for (const skillId of Object.keys(this.skillSystem)) {
            distribution[skillId] = {
                name: this.skillSystem[skillId].name,
                levels: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
            
            for (const player of playerArray) {
                const skillLevel = player.skills[skillId]?.level || 1;
                distribution[skillId].levels[skillLevel]++;
            }
        }
        
        return distribution;
    }
}

module.exports = ProgressTrackerSystem;

// Example usage
if (require.main === module) {
    const tracker = new ProgressTrackerSystem({
        persistentStorage: true,
        storageLocation: './test_progress',
        analyticsEnabled: true
    });
    
    // Example gameplay simulation
    const playerId = 'player_123';
    
    // Start session
    tracker.startSession(playerId);
    
    // Complete some games
    tracker.recordGameCompletion(playerId, {
        name: 'Pattern Memory',
        xp_reward: 150,
        accuracy: 0.95,
        perfect_score: true,
        skills_used: ['pattern_recognition', 'memory']
    });
    
    // Complete chapter
    tracker.recordChapterCompletion(playerId, {
        name: 'Chapter 7: Kickapoo Valley',
        xp_reward: 500,
        skills_used: ['data_analysis', 'systems_thinking', 'integration_thinking']
    });
    
    // Defeat boss
    tracker.recordBossDefeat(playerId, {
        name: 'System Architecture Oracle',
        xp_reward: 750,
        skills_used: ['technical_architecture', 'systems_thinking']
    });
    
    // End session
    const summary = tracker.endSession(playerId);
    
    // Get dashboard
    const dashboard = tracker.getPlayerDashboard(playerId);
    console.log('📊 Player Dashboard:', JSON.stringify(dashboard, null, 2));
}