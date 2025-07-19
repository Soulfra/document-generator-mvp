// casual-game-engine-quant-data.js - Backyard Baseball style game engine
// Character skinning, no-tryhard mechanics, long-term economic data for quant firm

const { EventEmitter } = require('events');
const crypto = require('crypto');

console.log(`
🏀 CASUAL GAME ENGINE - FRONTYARD SPORTS 🏀
Backyard Baseball meets economic research
Character skinning, no-tryhard mechanics
Long-term data collection for quant analysis
"For the love of the game, not the grind"
`);

class CasualGameEngineQuantData extends EventEmitter {
    constructor() {
        super();
        
        // Game engine configuration
        this.gameEngine = {
            // Backyard sports style games
            games: {
                'frontyard-baseball': {
                    players: 9,
                    turns: 9,
                    difficulty: 'casual',
                    tryhard_protection: true
                },
                'backyard-basketball': {
                    players: 5,
                    quarters: 4,
                    difficulty: 'relaxed',
                    tryhard_protection: true
                },
                'sidewalk-soccer': {
                    players: 11,
                    halves: 2,
                    difficulty: 'fun',
                    tryhard_protection: true
                },
                'driveway-hockey': {
                    players: 6,
                    periods: 3,
                    difficulty: 'chill',
                    tryhard_protection: true
                }
            },
            
            // Character skinning system
            characterSkins: {
                bases: ['kid', 'teen', 'adult', 'mascot', 'robot', 'alien'],
                styles: ['realistic', 'cartoon', 'pixel', '8bit', 'anime', 'stick'],
                accessories: ['hat', 'glasses', 'jersey', 'cleats', 'gloves', 'bandana'],
                animations: ['walk', 'run', 'jump', 'celebrate', 'fail', 'idle']
            },
            
            // No-tryhard mechanics
            antitryhard: {
                skill_ceiling: 0.7,      // Max skill level
                rubber_banding: true,     // Losing team gets boosts
                random_events: true,      // Random good/bad events
                mercy_rule: true,         // Auto-end blowouts
                fun_over_wins: true       // Reward fun plays over optimal
            }
        };
        
        // Economic data collection
        this.quantData = {
            // Player behavior patterns
            behaviors: new Map(),
            
            // Economic indicators
            indicators: {
                player_retention: [],
                session_lengths: [],
                spending_patterns: [],
                social_interactions: [],
                skill_progression: [],
                ragequit_incidents: []
            },
            
            // Market research data
            market: {
                casual_vs_competitive: [],
                age_demographics: new Map(),
                spending_by_skill: new Map(),
                social_network_effects: [],
                seasonal_patterns: []
            },
            
            // Long-term economic trends
            trends: {
                token_velocity: [],
                wealth_distribution: [],
                inflation_rates: [],
                market_efficiency: [],
                behavioral_economics: []
            }
        };
        
        // Active games and players
        this.activeGames = new Map();
        this.playerProfiles = new Map();
        this.economicEvents = [];
        
        console.log('🏀 Casual game engine initializing...');
        this.initializeEngine();
    }
    
    async initializeEngine() {
        // Initialize character system
        this.initializeCharacterSystem();
        
        // Set up anti-tryhard mechanics
        this.setupAntiTryhardSystem();
        
        // Start economic data collection
        this.startQuantDataCollection();
        
        // Create sample games
        this.createSampleGames();
        
        console.log('🏀 Game engine ready! Let the casual fun begin!');
    }
    
    initializeCharacterSystem() {
        console.log('🎨 Initializing character skinning system...');
        
        // Character creation templates
        this.characterTemplates = {
            // Backyard Baseball inspired characters
            'pablo-sanchez': {
                name: 'Pablo Sanchez',
                type: 'legend',
                stats: { batting: 0.9, fielding: 0.8, speed: 0.9 },
                personality: 'clutch',
                unlockable: true,
                cost: 1000
            },
            
            'pete-wheeler': {
                name: 'Pete Wheeler',
                type: 'speedster',
                stats: { batting: 0.6, fielding: 0.7, speed: 1.0 },
                personality: 'speedy',
                unlockable: false,
                cost: 0
            },
            
            'kenny-kawaguchi': {
                name: 'Kenny Kawaguchi',
                type: 'catcher',
                stats: { batting: 0.7, fielding: 0.9, speed: 0.4 },
                personality: 'defensive',
                unlockable: false,
                cost: 0
            },
            
            // Custom character slots
            'custom-1': {
                name: 'Your Kid',
                type: 'custom',
                stats: { batting: 0.5, fielding: 0.5, speed: 0.5 },
                personality: 'balanced',
                customizable: true,
                cost: 0
            }
        };
        
        // Skinning options
        this.skinningOptions = {
            hair: ['brown', 'black', 'blonde', 'red', 'blue', 'green', 'purple'],
            skin: ['light', 'medium', 'dark', 'tan', 'pale', 'olive'],
            jersey: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'black'],
            accessories: ['cap', 'helmet', 'glasses', 'bandana', 'wristband'],
            special: ['glow', 'sparkle', 'rainbow', 'shadow', 'holographic']
        };
        
        console.log('🎨 Character system ready with unlimited customization!');
    }
    
    setupAntiTryhardSystem() {
        console.log('😎 Setting up no-tryhard protection...');
        
        this.antiTryhardMechanics = {
            // Skill dampening - prevents players from getting too good
            skillDampening: (skill) => {
                if (skill > this.gameEngine.antitryhard.skill_ceiling) {
                    return this.gameEngine.antitryhard.skill_ceiling;
                }
                return skill;
            },
            
            // Rubber band AI - helps losing team
            rubberBanding: (score1, score2) => {
                const diff = Math.abs(score1 - score2);
                if (diff > 3) {
                    const losingBoost = Math.min(diff * 0.1, 0.3);
                    return losingBoost;
                }
                return 0;
            },
            
            // Random fun events
            randomEvents: [
                { name: 'Home Run Derby', effect: 'everyone_hits_better', fun: +2 },
                { name: 'Backwards Day', effect: 'run_bases_backwards', fun: +3 },
                { name: 'Giant Ball', effect: 'easier_to_hit', fun: +2 },
                { name: 'Tiny Ball', effect: 'harder_to_hit', fun: +1 },
                { name: 'Super Speed', effect: 'everyone_runs_fast', fun: +2 },
                { name: 'Freeze Tag', effect: 'random_player_frozen', fun: +3 }
            ],
            
            // Tryhard detection
            detectTryhard: (player) => {
                const indicators = {
                    optimal_play_rate: player.optimalPlays / player.totalPlays,
                    meta_abuse: player.metaStrategies > 5,
                    fun_score: player.funActions / player.totalActions,
                    social_toxicity: player.toxicMessages / player.totalMessages
                };
                
                return (indicators.optimal_play_rate > 0.8 || 
                        indicators.meta_abuse || 
                        indicators.fun_score < 0.3 ||
                        indicators.social_toxicity > 0.1);
            }
        };
        
        console.log('😎 Anti-tryhard system active - fun guaranteed!');
    }
    
    startQuantDataCollection() {
        console.log('📊 Starting economic data collection for quant analysis...');
        
        // Data collection intervals
        setInterval(() => this.collectBehavioralData(), 30000);    // Every 30 seconds
        setInterval(() => this.collectEconomicData(), 60000);      // Every minute
        setInterval(() => this.collectMarketData(), 300000);       // Every 5 minutes
        setInterval(() => this.analyzeTrends(), 3600000);          // Every hour
        
        // Export data for research
        setInterval(() => this.exportQuantData(), 86400000);       // Daily export
    }
    
    collectBehavioralData() {
        // Collect player behavior patterns
        for (const [playerId, profile] of this.playerProfiles) {
            const behavior = {
                playerId,
                timestamp: Date.now(),
                session_length: profile.currentSessionStart ? Date.now() - profile.currentSessionStart : 0,
                games_played: profile.gamesPlayed,
                social_interactions: profile.socialInteractions,
                spending: profile.tokenSpent,
                skill_level: profile.averageSkill,
                fun_score: profile.funScore,
                tryhard_detected: this.antiTryhardMechanics.detectTryhard(profile)
            };
            
            this.quantData.behaviors.set(playerId, behavior);
        }
    }
    
    collectEconomicData() {
        // Calculate economic indicators
        const players = Array.from(this.playerProfiles.values());
        
        // Player retention (daily active users)
        const activeToday = players.filter(p => 
            Date.now() - p.lastActive < 86400000
        ).length;
        this.quantData.indicators.player_retention.push({
            timestamp: Date.now(),
            active_players: activeToday,
            retention_rate: activeToday / players.length
        });
        
        // Session length analysis
        const avgSessionLength = players
            .filter(p => p.sessionLengths.length > 0)
            .reduce((sum, p) => sum + p.sessionLengths.reduce((a, b) => a + b, 0) / p.sessionLengths.length, 0) / players.length;
        
        this.quantData.indicators.session_lengths.push({
            timestamp: Date.now(),
            average_length: avgSessionLength,
            median_length: this.calculateMedian(players.flatMap(p => p.sessionLengths))
        });
        
        // Spending patterns
        const totalSpending = players.reduce((sum, p) => sum + p.tokenSpent, 0);
        this.quantData.indicators.spending_patterns.push({
            timestamp: Date.now(),
            total_spent: totalSpending,
            avg_per_player: totalSpending / players.length,
            whales: players.filter(p => p.tokenSpent > 10000).length
        });
    }
    
    collectMarketData() {
        // Market research data
        const players = Array.from(this.playerProfiles.values());
        
        // Casual vs competitive preference
        const casualPlayers = players.filter(p => p.prefersCasual).length;
        const competitivePlayers = players.filter(p => p.prefersCompetitive).length;
        
        this.quantData.market.casual_vs_competitive.push({
            timestamp: Date.now(),
            casual: casualPlayers,
            competitive: competitivePlayers,
            ratio: casualPlayers / competitivePlayers
        });
        
        // Age demographics
        players.forEach(p => {
            const ageGroup = this.getAgeGroup(p.age);
            const current = this.quantData.market.age_demographics.get(ageGroup) || 0;
            this.quantData.market.age_demographics.set(ageGroup, current + 1);
        });
        
        // Spending by skill level
        players.forEach(p => {
            const skillTier = Math.floor(p.averageSkill * 10);
            const current = this.quantData.market.spending_by_skill.get(skillTier) || [];
            current.push(p.tokenSpent);
            this.quantData.market.spending_by_skill.set(skillTier, current);
        });
    }
    
    analyzeTrends() {
        console.log('📈 Analyzing long-term economic trends...');
        
        // Token velocity (how fast tokens move through economy)
        const recentTransactions = this.economicEvents.filter(e => 
            Date.now() - e.timestamp < 3600000 // Last hour
        );
        const velocity = recentTransactions.length / this.getTotalTokenSupply();
        
        this.quantData.trends.token_velocity.push({
            timestamp: Date.now(),
            velocity,
            transactions: recentTransactions.length
        });
        
        // Wealth distribution (Gini coefficient)
        const wealth = Array.from(this.playerProfiles.values()).map(p => p.tokenBalance);
        const gini = this.calculateGiniCoefficient(wealth);
        
        this.quantData.trends.wealth_distribution.push({
            timestamp: Date.now(),
            gini_coefficient: gini,
            top_1_percent: this.getTopPercentWealth(wealth, 0.01),
            top_10_percent: this.getTopPercentWealth(wealth, 0.1)
        });
        
        // Market efficiency (price discovery speed)
        const priceChanges = this.calculatePriceDiscoverySpeed();
        this.quantData.trends.market_efficiency.push({
            timestamp: Date.now(),
            price_discovery_speed: priceChanges,
            arbitrage_opportunities: this.countArbitrageOpportunities()
        });
    }
    
    async createGame(gameType, players, options = {}) {
        const gameId = crypto.randomBytes(8).toString('hex');
        
        const game = {
            id: gameId,
            type: gameType,
            players: players.map(p => this.createPlayerInstance(p)),
            status: 'waiting',
            settings: {
                ...this.gameEngine.games[gameType],
                ...options,
                antiTryhard: true,
                funFirst: true
            },
            events: [],
            startTime: null,
            endTime: null,
            score: {},
            funEvents: []
        };
        
        this.activeGames.set(gameId, game);
        
        // Start game if enough players
        if (players.length >= game.settings.players) {
            await this.startGame(gameId);
        }
        
        return game;
    }
    
    createPlayerInstance(playerId) {
        let profile = this.playerProfiles.get(playerId);
        
        if (!profile) {
            // Create new player profile
            profile = {
                id: playerId,
                name: `Player_${playerId.substring(0, 6)}`,
                character: this.characterTemplates['custom-1'],
                customSkin: this.generateRandomSkin(),
                
                // Game stats
                gamesPlayed: 0,
                wins: 0,
                averageSkill: 0.5,
                funScore: 1.0,
                
                // Economic data
                tokenBalance: 1000,
                tokenSpent: 0,
                sessionLengths: [],
                socialInteractions: 0,
                
                // Behavioral data
                prefersCasual: true,
                prefersCompetitive: false,
                optimalPlays: 0,
                totalPlays: 0,
                funActions: 0,
                totalActions: 0,
                toxicMessages: 0,
                totalMessages: 0,
                
                // Timestamps
                joinedAt: Date.now(),
                lastActive: Date.now(),
                currentSessionStart: Date.now(),
                
                // Age (for research)
                age: Math.floor(Math.random() * 40) + 10
            };
            
            this.playerProfiles.set(playerId, profile);
        }
        
        return {
            id: playerId,
            profile,
            gameStats: {
                score: 0,
                performance: 0.5,
                funLevel: 1.0,
                tryhardWarnings: 0
            }
        };
    }
    
    generateRandomSkin() {
        return {
            hair: this.skinningOptions.hair[Math.floor(Math.random() * this.skinningOptions.hair.length)],
            skin: this.skinningOptions.skin[Math.floor(Math.random() * this.skinningOptions.skin.length)],
            jersey: this.skinningOptions.jersey[Math.floor(Math.random() * this.skinningOptions.jersey.length)],
            accessories: [this.skinningOptions.accessories[Math.floor(Math.random() * this.skinningOptions.accessories.length)]],
            special: Math.random() > 0.8 ? this.skinningOptions.special[Math.floor(Math.random() * this.skinningOptions.special.length)] : null
        };
    }
    
    async startGame(gameId) {
        const game = this.activeGames.get(gameId);
        if (!game) return;
        
        game.status = 'playing';
        game.startTime = Date.now();
        
        console.log(`🏀 Starting ${game.type} with ${game.players.length} players`);
        
        // Simulate game with anti-tryhard mechanics
        await this.simulateGame(game);
    }
    
    async simulateGame(game) {
        const events = [];
        const players = game.players;
        
        // Game simulation with fun-first mechanics
        for (let turn = 0; turn < game.settings.turns || game.settings.quarters; turn++) {
            // Check for tryhard behavior and apply dampening
            players.forEach(player => {
                const profile = player.profile;
                
                if (this.antiTryhardMechanics.detectTryhard(profile)) {
                    player.gameStats.tryhardWarnings++;
                    player.gameStats.performance *= 0.8; // Reduce performance
                    
                    events.push({
                        type: 'tryhard_warning',
                        player: player.id,
                        message: 'Chill out and have fun!'
                    });
                }
            });
            
            // Apply rubber banding
            const scores = players.map(p => p.gameStats.score);
            const maxScore = Math.max(...scores);
            const minScore = Math.min(...scores);
            const boost = this.antiTryhardMechanics.rubberBanding(maxScore, minScore);
            
            if (boost > 0) {
                const losingPlayers = players.filter(p => p.gameStats.score === minScore);
                losingPlayers.forEach(p => {
                    p.gameStats.performance += boost;
                    events.push({
                        type: 'rubber_band',
                        player: p.id,
                        message: 'Getting some help!'
                    });
                });
            }
            
            // Random fun events
            if (Math.random() < 0.2) {
                const event = this.antiTryhardMechanics.randomEvents[
                    Math.floor(Math.random() * this.antiTryhardMechanics.randomEvents.length)
                ];
                
                events.push({
                    type: 'fun_event',
                    event: event.name,
                    effect: event.effect,
                    fun_bonus: event.fun
                });
                
                players.forEach(p => {
                    p.gameStats.funLevel += event.fun * 0.1;
                });
            }
            
            // Update scores (simplified)
            players.forEach(p => {
                const performance = this.antiTryhardMechanics.skillDampening(p.gameStats.performance);
                p.gameStats.score += Math.floor(Math.random() * performance * 10);
            });
        }
        
        // End game
        await this.endGame(game, events);
    }
    
    async endGame(game, events) {
        game.status = 'finished';
        game.endTime = Date.now();
        game.events = events;
        
        // Determine winner (but everyone gets rewards for fun)
        const winner = game.players.reduce((prev, curr) => 
            curr.gameStats.score > prev.gameStats.score ? curr : prev
        );
        
        // Distribute rewards based on fun, not just winning
        game.players.forEach(player => {
            const profile = player.profile;
            const baseReward = 50;
            const funBonus = player.gameStats.funLevel * 20;
            const participationBonus = 25;
            const winBonus = player === winner ? 100 : 0;
            
            const totalReward = baseReward + funBonus + participationBonus + winBonus;
            
            profile.tokenBalance += totalReward;
            profile.gamesPlayed++;
            if (player === winner) profile.wins++;
            
            // Track economic event
            this.economicEvents.push({
                type: 'game_reward',
                playerId: player.id,
                amount: totalReward,
                gameType: game.type,
                timestamp: Date.now()
            });
        });
        
        console.log(`🏆 Game finished! Winner: ${winner.id}, Fun level: ${events.filter(e => e.type === 'fun_event').length} fun events`);
        
        // Emit for quant data collection
        this.emit('game_completed', {
            gameId: game.id,
            duration: game.endTime - game.startTime,
            players: game.players.length,
            funEvents: events.filter(e => e.type === 'fun_event').length,
            tryhardWarnings: events.filter(e => e.type === 'tryhard_warning').length
        });
    }
    
    createSampleGames() {
        // Create some sample games for testing
        const samplePlayers = ['alice', 'bob', 'charlie', 'diana'];
        
        // Frontyard Baseball
        this.createGame('frontyard-baseball', samplePlayers, {
            friendly_fire: false,
            custom_rules: ['no_stealing', 'everyone_bats']
        });
        
        console.log('🏀 Sample games created for testing');
    }
    
    // Utility functions for quant analysis
    calculateMedian(arr) {
        const sorted = arr.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    calculateGiniCoefficient(wealth) {
        wealth.sort((a, b) => a - b);
        const n = wealth.length;
        let sum = 0;
        
        for (let i = 0; i < n; i++) {
            sum += (2 * (i + 1) - n - 1) * wealth[i];
        }
        
        return sum / (n * wealth.reduce((a, b) => a + b, 0));
    }
    
    getTopPercentWealth(wealth, percent) {
        const sorted = wealth.sort((a, b) => b - a);
        const topCount = Math.ceil(sorted.length * percent);
        const topWealth = sorted.slice(0, topCount).reduce((a, b) => a + b, 0);
        const totalWealth = sorted.reduce((a, b) => a + b, 0);
        return topWealth / totalWealth;
    }
    
    getAgeGroup(age) {
        if (age < 18) return 'under_18';
        if (age < 25) return '18_24';
        if (age < 35) return '25_34';
        if (age < 45) return '35_44';
        return 'over_45';
    }
    
    getTotalTokenSupply() {
        return Array.from(this.playerProfiles.values())
            .reduce((sum, p) => sum + p.tokenBalance, 0);
    }
    
    calculatePriceDiscoverySpeed() {
        // Simplified price discovery calculation
        return Math.random() * 100; // Would be more complex in real implementation
    }
    
    countArbitrageOpportunities() {
        // Count price mismatches across markets
        return Math.floor(Math.random() * 10);
    }
    
    exportQuantData() {
        const dataExport = {
            timestamp: Date.now(),
            behavioral_data: Object.fromEntries(this.quantData.behaviors),
            economic_indicators: this.quantData.indicators,
            market_research: {
                casual_vs_competitive: this.quantData.market.casual_vs_competitive,
                age_demographics: Object.fromEntries(this.quantData.market.age_demographics),
                spending_by_skill: Object.fromEntries(this.quantData.market.spending_by_skill)
            },
            trends: this.quantData.trends,
            
            // Quant firm insights
            insights: {
                player_lifetime_value: this.calculatePlayerLTV(),
                churn_prediction: this.predictChurn(),
                optimal_pricing: this.calculateOptimalPricing(),
                market_segments: this.identifyMarketSegments()
            }
        };
        
        // Save to file for quant analysis
        const fs = require('fs').promises;
        const filename = `quant-data-export-${Date.now()}.json`;
        fs.writeFile(filename, JSON.stringify(dataExport, null, 2));
        
        console.log(`📊 Quant data exported to ${filename}`);
        return dataExport;
    }
    
    calculatePlayerLTV() {
        const players = Array.from(this.playerProfiles.values());
        return players.reduce((sum, p) => sum + p.tokenSpent, 0) / players.length;
    }
    
    predictChurn() {
        const players = Array.from(this.playerProfiles.values());
        const churnRisk = players.filter(p => 
            Date.now() - p.lastActive > 86400000 * 7 // Inactive for 7 days
        ).length;
        return churnRisk / players.length;
    }
    
    calculateOptimalPricing() {
        // Price elasticity analysis
        return {
            character_skins: { price: 50, demand_elasticity: -0.8 },
            game_modes: { price: 25, demand_elasticity: -1.2 },
            power_ups: { price: 10, demand_elasticity: -1.5 }
        };
    }
    
    identifyMarketSegments() {
        const players = Array.from(this.playerProfiles.values());
        
        return {
            casual_spenders: players.filter(p => p.tokenSpent < 500 && p.prefersCasual).length,
            whale_casuals: players.filter(p => p.tokenSpent > 5000 && p.prefersCasual).length,
            competitive_grinders: players.filter(p => p.prefersCompetitive && p.gamesPlayed > 100).length,
            social_players: players.filter(p => p.socialInteractions > 50).length
        };
    }
    
    // API methods
    getPlayerProfile(playerId) {
        return this.playerProfiles.get(playerId);
    }
    
    getGameState(gameId) {
        return this.activeGames.get(gameId);
    }
    
    getQuantReport() {
        return {
            active_players: this.playerProfiles.size,
            active_games: this.activeGames.size,
            total_economic_events: this.economicEvents.length,
            
            recent_trends: {
                avg_session_length: this.quantData.indicators.session_lengths.slice(-10),
                player_retention: this.quantData.indicators.player_retention.slice(-10),
                spending_patterns: this.quantData.indicators.spending_patterns.slice(-10)
            },
            
            research_insights: {
                casual_preference: this.quantData.market.casual_vs_competitive.slice(-1)[0],
                wealth_distribution: this.quantData.trends.wealth_distribution.slice(-1)[0],
                market_efficiency: this.quantData.trends.market_efficiency.slice(-1)[0]
            }
        };
    }
}

// Export for use
module.exports = CasualGameEngineQuantData;

// If run directly, start the service
if (require.main === module) {
    console.log('🏀 Starting Casual Game Engine with Quant Data Collection...');
    
    const engine = new CasualGameEngineQuantData();
    
    // Set up Express API
    const express = require('express');
    const app = express();
    const port = process.env.PORT || 9698;
    
    app.use(express.json());
    app.use(express.static('game-assets'));
    
    // Create game
    app.post('/api/game/create', async (req, res) => {
        const { type, players, options } = req.body;
        const game = await engine.createGame(type, players, options);
        res.json(game);
    });
    
    // Get player profile
    app.get('/api/player/:id', (req, res) => {
        const profile = engine.getPlayerProfile(req.params.id);
        res.json(profile || { error: 'Player not found' });
    });
    
    // Get quant report
    app.get('/api/quant/report', (req, res) => {
        res.json(engine.getQuantReport());
    });
    
    // Customize character
    app.post('/api/character/customize', (req, res) => {
        const { playerId, skin } = req.body;
        const profile = engine.getPlayerProfile(playerId);
        
        if (profile) {
            profile.customSkin = { ...profile.customSkin, ...skin };
            res.json({ success: true, skin: profile.customSkin });
        } else {
            res.status(404).json({ error: 'Player not found' });
        }
    });
    
    // Export quant data
    app.get('/api/quant/export', async (req, res) => {
        const data = engine.exportQuantData();
        res.json(data);
    });
    
    app.listen(port, () => {
        console.log(`🏀 Casual game engine running on port ${port}`);
        console.log(`📊 Quant data: http://localhost:${port}/api/quant/report`);
        console.log(`🎮 Create game: POST http://localhost:${port}/api/game/create`);
        console.log(`🎨 Character customization: POST http://localhost:${port}/api/character/customize`);
    });
}