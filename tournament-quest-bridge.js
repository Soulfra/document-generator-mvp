#!/usr/bin/env node

/**
 * TOURNAMENT-QUEST BRIDGE
 * Connects Tournament AI results to Quest Journal system
 * Tournament victories create quests, unlock achievements, and trigger card rituals
 */

const EventEmitter = require('events');
const mysql = require('mysql2/promise');

class TournamentQuestBridge extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            dbConfig: config.dbConfig || {
                host: 'localhost',
                user: 'root',
                password: '',
                database: 'economic_engine'
            },
            ...config
        };
        
        this.dbPool = null;
        this.activeBridges = new Map();
        
        console.log('🌉 Tournament-Quest Bridge initialized');
    }
    
    async initialize() {
        try {
            // Connect to database
            this.dbPool = await mysql.createPool({
                ...this.config.dbConfig,
                waitForConnections: true,
                connectionLimit: 10
            });
            
            console.log('📊 Database connected for quest integration');
            
            // Initialize card ritual bridge if available
            try {
                const CardRitualBridge = require('./token-economy-feed/src/services/card-ritual-bridge');
                this.cardRitualBridge = new CardRitualBridge();
                console.log('🃏 Card Ritual Bridge connected');
            } catch (error) {
                console.log('🃏 Card Ritual Bridge not available');
            }
            
        } catch (error) {
            console.error('❌ Bridge initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Process tournament victory and create quest
     */
    async processTournamentVictory(tournamentResult, characterId) {
        console.log(`\n🏆 Processing Tournament Victory for Character ${characterId}`);
        
        try {
            // Create quest from tournament
            const quest = await this.createTournamentQuest(tournamentResult, characterId);
            
            // Create quest objectives based on defeated units
            const objectives = await this.createQuestObjectives(quest.id, tournamentResult);
            
            // Trigger overlay for quest
            await this.triggerQuestOverlay(characterId, quest);
            
            // Check for achievements
            const achievements = await this.checkTournamentAchievements(characterId, tournamentResult);
            
            // If card ritual bridge available, trigger ritual
            if (this.cardRitualBridge) {
                await this.triggerVictoryRitual(tournamentResult, characterId);
            }
            
            // Emit bridge event
            this.emit('tournament:quest-created', {
                characterId,
                questId: quest.id,
                tournamentId: tournamentResult.tournamentId,
                achievements
            });
            
            return {
                quest,
                objectives,
                achievements,
                overlayTriggered: true
            };
            
        } catch (error) {
            console.error('❌ Failed to process tournament victory:', error);
            throw error;
        }
    }
    
    /**
     * Create quest from tournament results
     */
    async createTournamentQuest(tournamentResult, characterId) {
        const { winner, duration, rounds, participants } = tournamentResult;
        
        // Determine quest type based on winner approach
        const questType = this.determineQuestType(winner.approach);
        
        const questData = {
            character_id: characterId,
            quest_name: `Tournament Victory: ${winner.name}`,
            quest_description: `Won AI tournament using ${winner.approach} approach. Defeated ${participants - 1} opponents across ${rounds} rounds.`,
            quest_type: questType,
            quest_category: 'achievement',
            status: 'completed',
            progress: 100,
            max_progress: 100,
            overlay_data: JSON.stringify({
                icon: 'trophy_gold',
                color: '#FFD700',
                position: 'above_head',
                animation: 'pulse',
                priority: 10,
                duration: 5000
            }),
            requirements: JSON.stringify({
                tournamentId: tournamentResult.tournamentId,
                approach: winner.approach,
                minOpponents: participants - 1
            }),
            rewards: JSON.stringify({
                experience: rounds * 50,
                knowledge: winner.inventory.length,
                title: `${winner.approach} Champion`
            }),
            started_at: new Date(Date.now() - duration),
            completed_at: new Date()
        };
        
        const [result] = await this.dbPool.execute(
            `INSERT INTO character_quests SET ?`,
            questData
        );
        
        return {
            id: result.insertId,
            ...questData
        };
    }
    
    /**
     * Create quest objectives from defeated units
     */
    async createQuestObjectives(questId, tournamentResult) {
        const objectives = [];
        const defeatedUnits = [];
        
        // Extract defeated units from winner's inventory
        for (const [key, value] of tournamentResult.winner.inventory) {
            if (key.startsWith('eliminated-')) {
                defeatedUnits.push(value);
            }
        }
        
        // Create objective for each defeated unit
        for (let i = 0; i < defeatedUnits.length; i++) {
            const unit = defeatedUnits[i];
            
            const [result] = await this.dbPool.execute(
                `INSERT INTO quest_objectives SET ?`,
                {
                    quest_id: questId,
                    objective_text: `Defeated ${unit.name} (${unit.approach})`,
                    objective_type: 'defeat',
                    current_count: 1,
                    required_count: 1,
                    is_completed: true,
                    is_optional: false,
                    display_order: i + 1,
                    completed_at: new Date()
                }
            );
            
            objectives.push({
                id: result.insertId,
                unit: unit.name,
                approach: unit.approach
            });
        }
        
        return objectives;
    }
    
    /**
     * Trigger quest overlay display
     */
    async triggerQuestOverlay(characterId, quest) {
        // Create character event for overlay
        await this.dbPool.execute(
            `INSERT INTO character_events SET ?`,
            {
                character_id: characterId,
                event_type: 'quest_complete',
                event_data: JSON.stringify({
                    questId: quest.id,
                    questName: quest.quest_name,
                    rewards: JSON.parse(quest.rewards)
                }),
                trigger_overlay: true,
                overlay_config_id: 2 // quest_complete config
            }
        );
        
        console.log(`✨ Quest overlay triggered for character ${characterId}`);
    }
    
    /**
     * Check for tournament-related achievements
     */
    async checkTournamentAchievements(characterId, tournamentResult) {
        const achievements = [];
        const { winner, rounds, participants } = tournamentResult;
        
        // Check win count
        const [winStats] = await this.dbPool.execute(
            `SELECT COUNT(*) as win_count 
             FROM character_quests 
             WHERE character_id = ? 
             AND quest_name LIKE 'Tournament Victory:%'
             AND status = 'completed'`,
            [characterId]
        );
        
        const winCount = winStats[0].win_count;
        
        // Achievement conditions
        const achievementChecks = [
            {
                condition: winCount === 1,
                achievement: {
                    name: 'First Victory',
                    description: 'Won your first AI tournament',
                    icon: 'trophy_bronze'
                }
            },
            {
                condition: winCount === 5,
                achievement: {
                    name: 'Tournament Regular',
                    description: 'Won 5 AI tournaments',
                    icon: 'trophy_silver'
                }
            },
            {
                condition: winCount === 10,
                achievement: {
                    name: 'Tournament Master',
                    description: 'Won 10 AI tournaments',
                    icon: 'trophy_gold'
                }
            },
            {
                condition: rounds >= 5,
                achievement: {
                    name: 'Endurance Fighter',
                    description: 'Won a tournament with 5+ rounds',
                    icon: 'hourglass'
                }
            },
            {
                condition: winner.inventory.length >= 20,
                achievement: {
                    name: 'Knowledge Hoarder',
                    description: 'Accumulated 20+ knowledge items in victory',
                    icon: 'scroll_pile'
                }
            },
            {
                condition: winner.approach === 'synthesis',
                achievement: {
                    name: 'Synthesis Master',
                    description: 'Won using synthesis approach',
                    icon: 'merge'
                }
            }
        ];
        
        // Check each achievement
        for (const check of achievementChecks) {
            if (check.condition) {
                // Check if already unlocked
                const [existing] = await this.dbPool.execute(
                    `SELECT 1 FROM character_events 
                     WHERE character_id = ? 
                     AND event_type = 'achievement'
                     AND JSON_EXTRACT(event_data, '$.name') = ?`,
                    [characterId, check.achievement.name]
                );
                
                if (existing.length === 0) {
                    // Unlock achievement
                    await this.dbPool.execute(
                        `INSERT INTO character_events SET ?`,
                        {
                            character_id: characterId,
                            event_type: 'achievement',
                            event_data: JSON.stringify(check.achievement),
                            trigger_overlay: true,
                            overlay_config_id: 2
                        }
                    );
                    
                    achievements.push(check.achievement);
                    console.log(`🏅 Achievement unlocked: ${check.achievement.name}`);
                }
            }
        }
        
        return achievements;
    }
    
    /**
     * Trigger card ritual for tournament victory
     */
    async triggerVictoryRitual(tournamentResult, characterId) {
        if (!this.cardRitualBridge) return;
        
        console.log('🃏 Triggering Victory Card Ritual...');
        
        const { winner } = tournamentResult;
        
        // Create ritual cards based on tournament
        const ritualCards = [
            {
                id: `champion-${winner.id}`,
                type: 'identity',
                anchor: winner.approach,
                name: winner.name
            },
            {
                id: 'tier-victory',
                type: 'tier',
                tier: Math.min(winner.rounds + 5, 15),
                name: `Victory Tier ${winner.rounds + 5}`
            },
            {
                id: 'synthesis-power',
                type: 'math',
                operation: 'power',
                name: 'Tournament Power'
            },
            {
                id: 'knowledge-cascade',
                type: 'action',
                category: 'knowledge',
                name: 'Knowledge Cascade'
            },
            {
                id: 'victory-showcase',
                type: 'showcase',
                category: 'achievement',
                name: 'Tournament Victory'
            }
        ];
        
        // Execute ritual
        const ritualResult = await this.cardRitualBridge.executeCardRitual({
            cards: ritualCards,
            ritualId: `tournament-${tournamentResult.tournamentId}`,
            timestamp: Date.now()
        });
        
        // Store ritual result in character dialogue
        if (ritualResult.success) {
            await this.dbPool.execute(
                `INSERT INTO character_dialogues SET ?`,
                {
                    character_id: characterId,
                    dialogue_type: 'action',
                    content: `!ritual Tournament Victory: ${winner.name} achieved ${ritualResult.mathematicalDNA}`,
                    symbols: '!',
                    actions: JSON.stringify([{
                        action: 'ritual',
                        type: 'tournament-victory',
                        dna: ritualResult.mathematicalDNA,
                        cascade: ritualResult.cascadeId
                    }]),
                    context: JSON.stringify({
                        tournamentId: tournamentResult.tournamentId,
                        ritualId: ritualResult.ritualId,
                        effects: ritualResult.effects
                    })
                }
            );
            
            console.log(`✨ Victory ritual complete: ${ritualResult.mathematicalDNA}`);
        }
    }
    
    /**
     * Create remix card from tournament
     */
    async createTournamentRemixCard(tournamentResult, characterId) {
        const { winner } = tournamentResult;
        
        const remixCard = {
            characterId,
            cardType: 'tournament-champion',
            cardName: `${winner.name} Champion Card`,
            cardData: {
                approach: winner.approach,
                rounds: winner.rounds,
                knowledge: winner.inventory.length,
                tournamentId: tournamentResult.tournamentId,
                dna: await this.generateCardDNA(winner)
            },
            rarity: this.calculateCardRarity(winner),
            power: winner.rounds * 10 + winner.inventory.length
        };
        
        // Store in character inventory
        await this.dbPool.execute(
            `INSERT INTO character_dialogues SET ?`,
            {
                character_id: characterId,
                dialogue_type: 'action',
                content: `!card-create ${remixCard.cardName}`,
                symbols: '!',
                actions: JSON.stringify([{
                    action: 'card-create',
                    card: remixCard
                }]),
                context: JSON.stringify({
                    source: 'tournament-victory',
                    tournamentId: tournamentResult.tournamentId
                })
            }
        );
        
        return remixCard;
    }
    
    /**
     * Connect to BAS (Battle Arena System) cards
     */
    async connectToBASCards(tournamentResult, characterId) {
        // BAS card integration for tower defense style gameplay
        const basCard = {
            type: 'tower',
            name: `${tournamentResult.winner.name} Tower`,
            stats: {
                attack: tournamentResult.rounds * 5,
                defense: tournamentResult.winner.inventory.length,
                range: tournamentResult.participants,
                special: tournamentResult.winner.approach
            },
            cost: Math.ceil(tournamentResult.duration / 1000)
        };
        
        // Register BAS card
        await this.dbPool.execute(
            `INSERT INTO character_events SET ?`,
            {
                character_id: characterId,
                event_type: 'bas_card_unlock',
                event_data: JSON.stringify(basCard),
                trigger_overlay: false
            }
        );
        
        return basCard;
    }
    
    /**
     * Determine quest type from approach
     */
    determineQuestType(approach) {
        const typeMap = {
            'analytical': '!',      // Action/command
            'creative': '?',        // Question/exploration
            'critical': '!!',       // Double action
            'synthesis': '??',      // Double question
            'pattern-matching': '#', // Tagged content
            'contextual': '@',      // Mention-based
            'code-generation': '!', // Action
            'logical-reasoning': '?' // Question
        };
        
        return typeMap[approach] || 'mixed';
    }
    
    /**
     * Generate unique card DNA
     */
    async generateCardDNA(winner) {
        const components = [
            winner.id,
            winner.approach,
            winner.rounds,
            winner.inventory.size,
            Date.now()
        ].join('-');
        
        const crypto = require('crypto');
        return crypto.createHash('sha256')
            .update(components)
            .digest('hex')
            .substring(0, 16)
            .toUpperCase();
    }
    
    /**
     * Calculate card rarity based on performance
     */
    calculateCardRarity(winner) {
        const score = winner.rounds + (winner.inventory.size / 5);
        
        if (score >= 20) return 'legendary';
        if (score >= 15) return 'epic';
        if (score >= 10) return 'rare';
        if (score >= 5) return 'uncommon';
        return 'common';
    }
    
    /**
     * Get bridge status
     */
    getStatus() {
        return {
            active: this.activeBridges.size,
            cardRitualAvailable: !!this.cardRitualBridge,
            databaseConnected: !!this.dbPool
        };
    }
}

module.exports = TournamentQuestBridge;

// Example usage
if (require.main === module) {
    (async () => {
        const bridge = new TournamentQuestBridge();
        await bridge.initialize();
        
        // Example tournament result
        const tournamentResult = {
            tournamentId: 'tournament-123',
            winner: {
                id: 'synthesis-champion',
                name: 'Synthesis Master',
                approach: 'synthesis',
                response: 'Final synthesized response...',
                confidence: 0.95,
                inventory: [
                    ['base-query', 'test query'],
                    ['eliminated-unit1', { name: 'Unit 1', approach: 'analytical' }],
                    ['eliminated-unit2', { name: 'Unit 2', approach: 'creative' }],
                    ['knowledge-item1', 'insight 1'],
                    ['knowledge-item2', 'insight 2']
                ]
            },
            duration: 45000,
            rounds: 3,
            participants: 8
        };
        
        const characterId = 1;
        
        try {
            const result = await bridge.processTournamentVictory(tournamentResult, characterId);
            console.log('\n🎉 Bridge processing complete:', result);
        } catch (error) {
            console.error('Bridge processing failed:', error);
        }
    })();
}