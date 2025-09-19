#!/usr/bin/env node

/**
 * Gaming Perspective Adapter
 * 
 * Transforms data into RPG-style quest/bounty format
 * Shows how "1000 credits" becomes epic quests, achievements, and game mechanics
 */

const crypto = require('crypto');

class GamingPerspective {
    constructor(config = {}) {
        this.config = {
            gameTheme: config.gameTheme || 'fantasy', // fantasy, cyberpunk, space, modern
            difficultyScaling: config.difficultyScaling || 'exponential',
            enableAchievements: config.enableAchievements !== false,
            enableRaritySystem: config.enableRaritySystem !== false,
            enableSoundEffects: config.enableSoundEffects !== false
        };
        
        // Game themes and their vocabularies
        this.themes = {
            fantasy: {
                currency: { credits: 'gold coins', tokens: 'gems', coins: 'silver pieces' },
                actors: { Cal: 'Lord Cal the Wise', System: 'The Oracle', Admin: 'Grand Wizard' },
                locations: ['Mystic Tavern', 'Dragon\'s Lair', 'Enchanted Forest', 'Crystal Caves'],
                quests: ['Noble Quest', 'Epic Adventure', 'Legendary Mission', 'Divine Task'],
                enemies: ['Data Dragons', 'Bug Beasts', 'Chaos Goblins', 'Error Demons'],
                weapons: ['Code Sword', 'Logic Shield', 'Debug Hammer', 'Syntax Bow'],
                artifacts: ['Scroll of Knowledge', 'Crystal of Power', 'Amulet of Speed']
            },
            
            cyberpunk: {
                currency: { credits: 'crypto-credits', tokens: 'data-shards', coins: 'neural-coins' },
                actors: { Cal: 'Cal-9000 AI', System: 'The Matrix', Admin: 'SysAdmin Prime' },
                locations: ['Neon Terminal', 'Data Center', 'Virtual Plaza', 'Cyber Mall'],
                quests: ['Data Heist', 'System Breach', 'Neural Link', 'Code Injection'],
                enemies: ['Security Bots', 'Firewall Demons', 'Virus Swarms', 'Corrupt Data'],
                weapons: ['Plasma Rifle', 'EMP Grenade', 'Nano Blade', 'Quantum Disruptor'],
                artifacts: ['Memory Chip', 'Neural Interface', 'Quantum Core', 'Data Key']
            },
            
            space: {
                currency: { credits: 'galactic credits', tokens: 'energy cells', coins: 'stardust' },
                actors: { Cal: 'Commander Cal', System: 'AI Nexus', Admin: 'Fleet Admiral' },
                locations: ['Space Station', 'Asteroid Belt', 'Nebula Sector', 'Trade Hub'],
                quests: ['Stellar Mission', 'Cosmic Journey', 'Void Expedition', 'Galaxy Quest'],
                enemies: ['Space Pirates', 'Alien Drones', 'Void Creatures', 'Dark Matter'],
                weapons: ['Laser Cannon', 'Ion Blaster', 'Gravity Bomb', 'Photon Torpedo'],
                artifacts: ['Star Map', 'Hyperdrive Core', 'Energy Crystal', 'Alien Tech']
            }
        };
        
        // Difficulty scaling based on amounts
        this.difficultyLevels = {
            trivial: { min: 0, max: 50, color: 'gray', icon: '⚪' },
            easy: { min: 51, max: 200, color: 'green', icon: '🟢' },
            medium: { min: 201, max: 500, color: 'yellow', icon: '🟡' },
            hard: { min: 501, max: 1000, color: 'orange', icon: '🟠' },
            epic: { min: 1001, max: 5000, color: 'purple', icon: '🟣' },
            legendary: { min: 5001, max: 99999, color: 'gold', icon: '🟡' },
            mythic: { min: 100000, max: Infinity, color: 'rainbow', icon: '🌈' }
        };
        
        // Rarity system for rewards
        this.raritySystem = {
            common: { chance: 60, multiplier: 1.0, color: 'white', glow: false },
            uncommon: { chance: 25, multiplier: 1.2, color: 'green', glow: false },
            rare: { chance: 10, multiplier: 1.5, color: 'blue', glow: true },
            epic: { chance: 4, multiplier: 2.0, color: 'purple', glow: true },
            legendary: { chance: 1, multiplier: 3.0, color: 'orange', glow: true },
            mythic: { chance: 0.1, multiplier: 5.0, color: 'rainbow', glow: true }
        };
        
        // Sound effects for different actions
        this.soundEffects = {
            quest_posted: ['quest_bell.mp3', 'herald_trumpet.mp3', 'town_crier.wav'],
            quest_completed: ['victory_fanfare.mp3', 'achievement_unlock.wav', 'success_chime.mp3'],
            reward_claimed: ['coin_drop.mp3', 'treasure_found.wav', 'gold_jingle.mp3'],
            level_up: ['level_up.mp3', 'power_surge.wav', 'ascension.mp3'],
            rare_drop: ['legendary_find.mp3', 'epic_glow.wav', 'divine_chime.mp3']
        };
        
        // Achievement system
        this.achievements = {
            bounty_poster: {
                name: 'Bounty Master',
                description: 'Post your first bounty',
                icon: '📋',
                xp: 100,
                triggers: ['post_bounty']
            },
            big_spender: {
                name: 'High Roller',
                description: 'Post a bounty worth 1000+ credits',
                icon: '💰',
                xp: 500,
                triggers: ['post_bounty'],
                conditions: { amount: { min: 1000 } }
            },
            quest_master: {
                name: 'Quest Master',
                description: 'Complete 10 quests',
                icon: '⚔️',
                xp: 1000,
                triggers: ['complete_quest'],
                conditions: { count: 10 }
            },
            legendary_hero: {
                name: 'Legendary Hero',
                description: 'Complete a legendary difficulty quest',
                icon: '🏆',
                xp: 2000,
                triggers: ['complete_quest'],
                conditions: { difficulty: 'legendary' }
            }
        };
        
        console.log('🎮 Gaming Perspective initialized');
        console.log(`🎨 Theme: ${this.config.gameTheme}`);
    }
    
    /**
     * Transform data into gaming format
     */
    transform(data) {
        console.log('🎮 Transforming to gaming perspective...');
        
        const theme = this.themes[this.config.gameTheme];
        const transformation = {
            metadata: {
                transformedAt: new Date(),
                theme: this.config.gameTheme,
                gameVersion: '1.0.0'
            }
        };
        
        // Determine game action type
        const gameAction = this.determineGameAction(data);
        transformation.action = gameAction;
        
        // Generate quest/challenge
        transformation.quest = this.generateQuest(data, theme);
        
        // Calculate difficulty and rewards
        transformation.difficulty = this.calculateDifficulty(data);
        transformation.rewards = this.generateRewards(data, transformation.difficulty);
        
        // Generate narrative elements
        transformation.narrative = this.generateGameNarrative(data, theme);
        
        // Create UI elements
        transformation.ui = this.generateUIElements(data, transformation);
        
        // Generate achievements
        if (this.config.enableAchievements) {
            transformation.achievements = this.checkAchievements(data);
        }
        
        // Add sound effects
        if (this.config.enableSoundEffects) {
            transformation.sounds = this.generateSoundEffects(gameAction);
        }
        
        // Generate game mechanics
        transformation.mechanics = this.generateGameMechanics(data, transformation);
        
        return transformation;
    }
    
    /**
     * Determine what type of game action this data represents
     */
    determineGameAction(data) {
        if (data.action === 'post_bounty') {
            return {
                type: 'quest_posted',
                category: 'economy',
                impact: 'high',
                visibility: 'public'
            };
        }
        
        if (data.action === 'complete_quest' || data.action === 'claim_bounty') {
            return {
                type: 'quest_completed',
                category: 'achievement',
                impact: 'medium',
                visibility: 'public'
            };
        }
        
        if (data.action === 'trade' || data.transaction) {
            return {
                type: 'trade_executed',
                category: 'economy',
                impact: 'low',
                visibility: 'private'
            };
        }
        
        return {
            type: 'event_occurred',
            category: 'system',
            impact: 'low',
            visibility: 'hidden'
        };
    }
    
    /**
     * Generate quest/challenge from data
     */
    generateQuest(data, theme) {
        const quest = {
            id: crypto.randomUUID(),
            title: this.generateQuestTitle(data, theme),
            description: this.generateQuestDescription(data, theme),
            type: this.determineQuestType(data),
            giver: this.transformActor(data.actor, theme),
            location: this.selectLocation(theme),
            objectives: this.generateObjectives(data),
            requirements: this.generateRequirements(data),
            timeLimit: this.calculateTimeLimit(data),
            tags: this.generateQuestTags(data)
        };
        
        return quest;
    }
    
    generateQuestTitle(data, theme) {
        const actor = this.transformActor(data.actor, theme);
        const amount = data.amount || 100;
        const currency = this.transformCurrency(data.currency, theme);
        
        const titleTemplates = {
            fantasy: [
                `${actor}'s ${amount} ${currency} Challenge`,
                `The Great ${currency} Quest of ${actor}`,
                `${actor}'s Legendary Bounty Hunt`,
                `Quest for the ${amount} ${currency} Treasure`
            ],
            cyberpunk: [
                `${actor}'s ${amount} ${currency} Contract`,
                `Data Heist: ${amount} ${currency} Payout`,
                `${actor}'s Neural Net Assignment`,
                `Crypto-Quest: ${amount} ${currency} Reward`
            ],
            space: [
                `${actor}'s Galactic Mission: ${amount} ${currency}`,
                `Stellar Contract: ${amount} ${currency} Bounty`,
                `${actor}'s Cosmic Challenge`,
                `Space Expedition: ${amount} ${currency} Prize`
            ]
        };
        
        const templates = titleTemplates[this.config.gameTheme] || titleTemplates.fantasy;
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    generateQuestDescription(data, theme) {
        const actor = this.transformActor(data.actor, theme);
        const amount = data.amount || 100;
        const currency = this.transformCurrency(data.currency, theme);
        const location = this.selectLocation(theme);
        
        const baseDescription = data.description || 'A mysterious challenge awaits brave adventurers';
        
        const themeDescriptions = {
            fantasy: `In the mystical realm of ${location}, the renowned ${actor} has issued a grand proclamation! ` +
                    `A reward of ${amount} ${currency} awaits the worthy hero who can ${baseDescription.toLowerCase()}. ` +
                    `Tales of this quest are already spreading throughout the land, attracting adventurers from far and wide.`,
            
            cyberpunk: `Breaking news from the digital underground: ${actor} has uploaded a high-priority contract to the neural network. ` +
                      `The payout? A substantial ${amount} ${currency} transferred directly to your crypto-wallet. ` +
                      `Mission briefing: ${baseDescription}. Warning: Corporate security may interfere.`,
            
            space: `Galactic bulletin from ${location}: Commander ${actor} is offering ${amount} ${currency} ` +
                  `to any qualified operative willing to undertake this critical mission. ` +
                  `Objective parameters: ${baseDescription}. Hyperspace coordinates will be provided upon acceptance.`
        };
        
        return themeDescriptions[this.config.gameTheme] || themeDescriptions.fantasy;
    }
    
    /**
     * Calculate quest difficulty based on amount and other factors
     */
    calculateDifficulty(data) {
        const amount = data.amount || 0;
        
        // Find difficulty level based on amount
        let difficultyLevel = 'easy';
        for (const [level, range] of Object.entries(this.difficultyLevels)) {
            if (amount >= range.min && amount <= range.max) {
                difficultyLevel = level;
                break;
            }
        }
        
        const difficulty = this.difficultyLevels[difficultyLevel];
        
        return {
            level: difficultyLevel,
            rating: amount,
            color: difficulty.color,
            icon: difficulty.icon,
            estimatedTime: this.estimateCompletionTime(difficultyLevel),
            recommendedLevel: this.recommendPlayerLevel(difficultyLevel),
            riskFactor: this.calculateRiskFactor(difficultyLevel)
        };
    }
    
    /**
     * Generate rewards based on data and difficulty
     */
    generateRewards(data, difficulty) {
        const baseAmount = data.amount || 100;
        const rarity = this.determineRewardRarity(difficulty.level);
        const rarityData = this.raritySystem[rarity];
        
        const rewards = {
            primary: {
                type: 'currency',
                amount: Math.floor(baseAmount * rarityData.multiplier),
                currency: data.currency || 'credits',
                rarity: rarity,
                display: this.formatCurrencyDisplay(baseAmount, data.currency, rarity)
            },
            
            experience: {
                type: 'xp',
                amount: Math.floor(baseAmount / 10),
                category: 'quest_completion'
            },
            
            reputation: {
                type: 'reputation',
                amount: Math.floor(baseAmount / 50),
                faction: 'quest_givers'
            },
            
            items: this.generateItemRewards(difficulty.level, rarity),
            
            achievements: this.generateAchievementRewards(data, difficulty),
            
            special: this.generateSpecialRewards(data, difficulty, rarity)
        };
        
        return rewards;
    }
    
    /**
     * Generate game narrative elements
     */
    generateGameNarrative(data, theme) {
        return {
            announcement: this.generateAnnouncement(data, theme),
            flavorText: this.generateFlavorText(data, theme),
            dialogue: this.generateDialogue(data, theme),
            lore: this.generateLore(data, theme),
            atmosphere: this.generateAtmosphere(data, theme)
        };
    }
    
    generateAnnouncement(data, theme) {
        const actor = this.transformActor(data.actor, theme);
        const amount = data.amount || 100;
        const currency = this.transformCurrency(data.currency, theme);
        
        const announcements = {
            fantasy: `🏰 **ROYAL PROCLAMATION** 🏰\n\nHear ye, hear ye! ${actor} has decreed that ${amount} ${currency} shall be bestowed upon the champion who proves worthy of this noble quest!`,
            
            cyberpunk: `🌃 **NEURAL NETWORK ALERT** 🌃\n\n>>> PRIORITY MESSAGE FROM ${actor.toUpperCase()} <<<\nContract uploaded: ${amount} ${currency} bounty active\nSecurity clearance: CLASSIFIED`,
            
            space: `🚀 **GALACTIC COMM TRANSMISSION** 🚀\n\nAttention all operatives: ${actor} broadcasting on secure channel.\nMission reward confirmed: ${amount} ${currency}\nStarfleet Command authorization pending.`
        };
        
        return announcements[this.config.gameTheme] || announcements.fantasy;
    }
    
    generateFlavorText(data, theme) {
        const difficultyLevel = this.calculateDifficulty(data).level;
        
        const flavorTexts = {
            trivial: "A simple task that any novice could complete.",
            easy: "A straightforward challenge for aspiring adventurers.",
            medium: "This quest will test your skills and determination.",
            hard: "Only experienced heroes should attempt this dangerous mission.",
            epic: "A formidable challenge that will forge legends.",
            legendary: "The stuff of myths and legends - few dare to try.",
            mythic: "A quest so perilous that gods themselves would hesitate."
        };
        
        return flavorTexts[difficultyLevel] || flavorTexts.medium;
    }
    
    generateDialogue(data, theme) {
        const actor = this.transformActor(data.actor, theme);
        
        const dialogues = {
            fantasy: [
                `${actor}: "Brave adventurer, I have need of your services!"`,
                `${actor}: "The realm depends on heroes like you."`,
                `${actor}: "Success will bring great rewards and eternal glory!"`
            ],
            
            cyberpunk: [
                `${actor}: "I've got a job that pays well, but it's not without risks."`,
                `${actor}: "The corp doesn't know about this yet. Keep it quiet."`,
                `${actor}: "Your neural implants should handle the data stream."`
            ],
            
            space: [
                `${actor}: "The fate of the galaxy may depend on this mission."`,
                `${actor}: "Your ship and crew are the best hope we have."`,
                `${actor}: "May the stars guide you to victory, commander."`
            ]
        };
        
        return dialogues[this.config.gameTheme] || dialogues.fantasy;
    }
    
    /**
     * Generate UI elements for the game interface
     */
    generateUIElements(data, transformation) {
        const difficulty = transformation.difficulty;
        const rewards = transformation.rewards;
        
        return {
            questCard: this.generateQuestCard(transformation.quest, difficulty, rewards),
            notification: this.generateNotification(transformation.action, data),
            popup: this.generatePopup(transformation.quest, rewards),
            progressBar: this.generateProgressBar(data),
            minimap: this.generateMinimapMarker(transformation.quest),
            hud: this.generateHUDElements(data, transformation)
        };
    }
    
    generateQuestCard(quest, difficulty, rewards) {
        return {
            template: 'quest_card_template',
            data: {
                title: quest.title,
                description: quest.description.substring(0, 150) + '...',
                giver: quest.giver,
                location: quest.location,
                difficulty: {
                    level: difficulty.level,
                    icon: difficulty.icon,
                    color: difficulty.color
                },
                rewards: {
                    primary: rewards.primary.display,
                    xp: rewards.experience.amount,
                    items: rewards.items.length
                },
                timeLimit: quest.timeLimit,
                tags: quest.tags
            },
            style: {
                borderColor: difficulty.color,
                glowEffect: difficulty.level === 'legendary' || difficulty.level === 'mythic',
                animation: 'fadeInUp',
                priority: this.getDisplayPriority(difficulty.level)
            }
        };
    }
    
    generateNotification(action, data) {
        const notificationTypes = {
            quest_posted: {
                title: '🎯 New Quest Available!',
                message: `${data.actor} offers ${data.amount} ${data.currency}!`,
                type: 'info',
                duration: 5000,
                sound: 'quest_bell.mp3'
            },
            
            quest_completed: {
                title: '✅ Quest Completed!',
                message: `You've earned ${data.amount} ${data.currency}!`,
                type: 'success',
                duration: 3000,
                sound: 'victory_fanfare.mp3'
            },
            
            trade_executed: {
                title: '💰 Trade Successful!',
                message: `${data.amount} ${data.currency} exchanged`,
                type: 'success',
                duration: 2000,
                sound: 'coin_drop.mp3'
            }
        };
        
        return notificationTypes[action.type] || notificationTypes.quest_posted;
    }
    
    /**
     * Generate game mechanics and systems
     */
    generateGameMechanics(data, transformation) {
        return {
            economics: this.generateEconomicMechanics(data),
            progression: this.generateProgressionMechanics(data, transformation),
            social: this.generateSocialMechanics(data),
            competitive: this.generateCompetitiveMechanics(data),
            strategic: this.generateStrategicMechanics(data)
        };
    }
    
    generateEconomicMechanics(data) {
        const amount = data.amount || 100;
        
        return {
            escrow: {
                enabled: true,
                holdDuration: '24 hours',
                escrowFee: Math.floor(amount * 0.02), // 2% escrow fee
                releaseConditions: ['quest_completion', 'time_limit_reached']
            },
            
            inflation: {
                currentRate: 1.02, // 2% inflation
                impactOnReward: amount * 1.02,
                recommendation: amount > 1000 ? 'High value quest - consider premium escrow' : 'Standard escrow sufficient'
            },
            
            marketImpact: {
                liquidityChange: amount > 5000 ? 'significant' : 'minimal',
                priceEffect: this.calculatePriceEffect(amount),
                competitorResponse: this.predictCompetitorResponse(amount)
            }
        };
    }
    
    generateProgressionMechanics(data, transformation) {
        const difficulty = transformation.difficulty;
        
        return {
            levelRequirement: difficulty.recommendedLevel,
            skillRequirements: this.generateSkillRequirements(difficulty.level),
            xpReward: transformation.rewards.experience.amount,
            masteryPoints: this.calculateMasteryPoints(data),
            unlocks: this.generateUnlocks(difficulty.level)
        };
    }
    
    // Helper methods
    transformActor(actor, theme) {
        return theme.actors[actor] || actor || 'Unknown Hero';
    }
    
    transformCurrency(currency, theme) {
        return theme.currency[currency] || currency || 'coins';
    }
    
    selectLocation(theme) {
        const locations = theme.locations;
        return locations[Math.floor(Math.random() * locations.length)];
    }
    
    determineQuestType(data) {
        if (data.amount > 5000) return 'epic_bounty';
        if (data.amount > 1000) return 'major_quest';
        if (data.amount > 500) return 'standard_quest';
        return 'minor_task';
    }
    
    generateObjectives(data) {
        const objectives = [];
        
        if (data.action === 'post_bounty') {
            objectives.push({
                id: 1,
                description: data.description || 'Complete the specified task',
                type: 'primary',
                progress: 0,
                maxProgress: 100
            });
        }
        
        objectives.push({
            id: 2,
            description: 'Report back to quest giver',
            type: 'secondary',
            progress: 0,
            maxProgress: 1
        });
        
        return objectives;
    }
    
    generateRequirements(data) {
        const amount = data.amount || 100;
        const requirements = [];
        
        if (amount > 1000) {
            requirements.push('Verified account');
            requirements.push('Previous quest completion');
        }
        
        if (amount > 5000) {
            requirements.push('Guild membership');
            requirements.push('Elite status');
        }
        
        return requirements;
    }
    
    calculateTimeLimit(data) {
        const amount = data.amount || 100;
        
        // More valuable quests get longer time limits
        if (amount > 5000) return '7 days';
        if (amount > 1000) return '3 days';
        if (amount > 500) return '24 hours';
        return '12 hours';
    }
    
    generateQuestTags(data) {
        const tags = ['bounty'];
        
        if (data.amount > 1000) tags.push('high-value');
        if (data.actor === 'Cal') tags.push('legendary-giver');
        if (data.description?.includes('urgent')) tags.push('urgent');
        
        return tags;
    }
    
    determineRewardRarity(difficultyLevel) {
        const rarityMap = {
            trivial: 'common',
            easy: 'common',
            medium: 'uncommon',
            hard: 'rare',
            epic: 'epic',
            legendary: 'legendary',
            mythic: 'mythic'
        };
        
        return rarityMap[difficultyLevel] || 'common';
    }
    
    formatCurrencyDisplay(amount, currency, rarity) {
        const rarityEmojis = {
            common: '⚪',
            uncommon: '🟢',
            rare: '🔵',
            epic: '🟣',
            legendary: '🟡',
            mythic: '🌈'
        };
        
        return `${rarityEmojis[rarity]} ${amount} ${currency}`;
    }
    
    generateItemRewards(difficultyLevel, rarity) {
        const theme = this.themes[this.config.gameTheme];
        const items = [];
        
        if (difficultyLevel === 'legendary' || difficultyLevel === 'mythic') {
            items.push({
                name: theme.artifacts[Math.floor(Math.random() * theme.artifacts.length)],
                rarity: rarity,
                type: 'artifact'
            });
        }
        
        if (difficultyLevel === 'epic' || difficultyLevel === 'legendary') {
            items.push({
                name: theme.weapons[Math.floor(Math.random() * theme.weapons.length)],
                rarity: rarity,
                type: 'weapon'
            });
        }
        
        return items;
    }
    
    estimateCompletionTime(difficultyLevel) {
        const timeMap = {
            trivial: '5 minutes',
            easy: '15 minutes',
            medium: '1 hour',
            hard: '4 hours',
            epic: '1 day',
            legendary: '3 days',
            mythic: '1 week'
        };
        
        return timeMap[difficultyLevel] || '1 hour';
    }
    
    recommendPlayerLevel(difficultyLevel) {
        const levelMap = {
            trivial: 1,
            easy: 5,
            medium: 15,
            hard: 25,
            epic: 40,
            legendary: 60,
            mythic: 80
        };
        
        return levelMap[difficultyLevel] || 10;
    }
    
    calculateRiskFactor(difficultyLevel) {
        const riskMap = {
            trivial: 0.1,
            easy: 0.2,
            medium: 0.4,
            hard: 0.6,
            epic: 0.8,
            legendary: 0.9,
            mythic: 0.95
        };
        
        return riskMap[difficultyLevel] || 0.5;
    }
    
    checkAchievements(data) {
        const triggered = [];
        
        Object.entries(this.achievements).forEach(([id, achievement]) => {
            if (achievement.triggers.includes(data.action)) {
                let qualifies = true;
                
                // Check conditions
                if (achievement.conditions) {
                    if (achievement.conditions.amount && data.amount < achievement.conditions.amount.min) {
                        qualifies = false;
                    }
                }
                
                if (qualifies) {
                    triggered.push({
                        id,
                        ...achievement,
                        triggeredAt: new Date(),
                        triggerData: data
                    });
                }
            }
        });
        
        return triggered;
    }
    
    generateSoundEffects(action) {
        const actionSounds = this.soundEffects[action.type] || this.soundEffects.quest_posted;
        
        return {
            primary: actionSounds[0],
            alternatives: actionSounds.slice(1),
            volume: 0.7,
            fadeIn: true,
            loop: false
        };
    }
    
    getDisplayPriority(difficultyLevel) {
        const priorities = {
            mythic: 10,
            legendary: 9,
            epic: 8,
            hard: 6,
            medium: 4,
            easy: 2,
            trivial: 1
        };
        
        return priorities[difficultyLevel] || 1;
    }
    
    calculatePriceEffect(amount) {
        if (amount > 10000) return 'major_increase';
        if (amount > 5000) return 'moderate_increase';
        if (amount > 1000) return 'minor_increase';
        return 'negligible';
    }
    
    predictCompetitorResponse(amount) {
        if (amount > 5000) return 'likely_to_compete';
        if (amount > 1000) return 'may_compete';
        return 'unlikely_to_compete';
    }
    
    generateSkillRequirements(difficultyLevel) {
        const skillsByDifficulty = {
            easy: ['Basic Problem Solving'],
            medium: ['Intermediate Coding', 'Project Management'],
            hard: ['Advanced Programming', 'System Design', 'Leadership'],
            epic: ['Expert Development', 'Architecture Design', 'Team Leadership'],
            legendary: ['Mastery Level', 'Innovation', 'Strategic Thinking'],
            mythic: ['Legendary Skills', 'Revolutionary Thinking', 'Divine Inspiration']
        };
        
        return skillsByDifficulty[difficultyLevel] || ['Basic Skills'];
    }
    
    calculateMasteryPoints(data) {
        const basePoints = Math.floor((data.amount || 100) / 100);
        return Math.min(basePoints, 100); // Cap at 100 mastery points
    }
    
    generateUnlocks(difficultyLevel) {
        const unlocksByDifficulty = {
            hard: ['Advanced Quest Board'],
            epic: ['Elite Guild Access', 'Legendary Equipment'],
            legendary: ['Master Craftsman', 'Realm Recognition'],
            mythic: ['Divine Status', 'Reality Shaping']
        };
        
        return unlocksByDifficulty[difficultyLevel] || [];
    }
}

module.exports = { GamingPerspective };

// Example usage
if (require.main === module) {
    function demonstrateGamingPerspective() {
        console.log('\n🎮 GAMING PERSPECTIVE DEMONSTRATION\n');
        
        const gamingPerspective = new GamingPerspective({
            gameTheme: 'fantasy',
            enableAchievements: true,
            enableSoundEffects: true
        });
        
        // Test data: Cal posting a bounty
        const bountyData = {
            actor: 'Cal',
            action: 'post_bounty',
            amount: 1000,
            currency: 'credits',
            description: 'Epic quest for brave developers to build the ultimate AI system',
            timestamp: Date.now()
        };
        
        const transformation = gamingPerspective.transform(bountyData);
        
        console.log('🎯 === GAMING TRANSFORMATION RESULTS ===\n');
        
        console.log('⚔️ QUEST INFORMATION:');
        console.log(`   Title: ${transformation.quest.title}`);
        console.log(`   Giver: ${transformation.quest.giver}`);
        console.log(`   Location: ${transformation.quest.location}`);
        console.log(`   Type: ${transformation.quest.type}\n`);
        
        console.log('📊 DIFFICULTY & REWARDS:');
        console.log(`   Difficulty: ${transformation.difficulty.icon} ${transformation.difficulty.level.toUpperCase()}`);
        console.log(`   Reward: ${transformation.rewards.primary.display}`);
        console.log(`   XP: ${transformation.rewards.experience.amount}`);
        console.log(`   Reputation: ${transformation.rewards.reputation.amount}\n`);
        
        console.log('📜 NARRATIVE:');
        console.log(`   ${transformation.narrative.announcement}\n`);
        console.log(`   Flavor: "${transformation.narrative.flavorText}"\n`);
        
        console.log('🏆 ACHIEVEMENTS:');
        transformation.achievements.forEach(achievement => {
            console.log(`   ${achievement.icon} ${achievement.name}: ${achievement.description}`);
        });
        
        console.log('\n🎮 UI ELEMENTS:');
        console.log(`   Notification: ${transformation.ui.notification.title}`);
        console.log(`   Sound: ${transformation.sounds.primary}`);
        
        console.log('\n🎯 The same "1000 credits" becomes:');
        console.log('   • Epic fantasy quest with legendary difficulty');
        console.log('   • Rich narrative with characters and locations');
        console.log('   • Achievement system with XP and reputation');
        console.log('   • Complete UI with notifications and sound effects');
        console.log('   • Game mechanics including economy and progression');
    }
    
    demonstrateGamingPerspective();
}

console.log('🎮 GAMING PERSPECTIVE ADAPTER LOADED');
console.log('⚔️ Transforms data into epic quests, achievements, and game mechanics');