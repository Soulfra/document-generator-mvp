#!/usr/bin/env node

/**
 * GAME MODES
 * 
 * Different ways to play the energy card game:
 * - Standard (Pokemon-style)
 * - Limited (Draft/sealed) 
 * - Solitaire (Puzzle challenges)
 * - Hold'em (Shared card pool)
 * - Battle Royale (Multiple players)
 * - Speed (Fast rounds)
 * - Campaign (Story mode)
 */

const EventEmitter = require('events');
const { CardGameEngine } = require('./card-game-engine');
const { CardBattleSystem } = require('./card-battle-system');

class GameModeManager extends EventEmitter {
    constructor() {
        super();
        
        this.availableModes = new Map();
        this.activeGames = new Map();
        this.battleSystem = new CardBattleSystem();
        
        this.initializeModes();
    }
    
    initializeModes() {
        // Register all game modes
        this.availableModes.set('standard', new StandardMode());
        this.availableModes.set('quick', new QuickMode());
        this.availableModes.set('limited', new LimitedMode());
        this.availableModes.set('solitaire', new SolitaireMode());
        this.availableModes.set('holdem', new HoldemMode());
        this.availableModes.set('battleRoyale', new BattleRoyaleMode());
        this.availableModes.set('speed', new SpeedMode());
        this.availableModes.set('campaign', new CampaignMode());
        this.availableModes.set('puzzle', new PuzzleMode());
        
        console.log(`🎮 Initialized ${this.availableModes.size} game modes`);
    }
    
    /**
     * Start a new game in specified mode
     */
    async startGame(modeType, players, options = {}) {
        const mode = this.availableModes.get(modeType);
        if (!mode) {
            throw new Error(`Unknown game mode: ${modeType}`);
        }
        
        const gameId = `${modeType}_${Date.now()}`;
        const game = await mode.createGame(players, options);
        game.id = gameId;
        game.mode = modeType;
        
        this.activeGames.set(gameId, game);
        
        this.emit('gameStarted', {
            gameId,
            mode: modeType,
            players: players.length,
            options
        });
        
        return game;
    }
    
    /**
     * Get available modes with descriptions
     */
    getAvailableModes() {
        const modes = [];
        
        for (const [type, mode] of this.availableModes) {
            modes.push({
                type,
                name: mode.name,
                description: mode.description,
                minPlayers: mode.minPlayers,
                maxPlayers: mode.maxPlayers,
                avgDuration: mode.avgDuration,
                difficulty: mode.difficulty
            });
        }
        
        return modes;
    }
    
    /**
     * Get active game
     */
    getGame(gameId) {
        return this.activeGames.get(gameId);
    }
}

// Base game mode class
class BaseGameMode {
    constructor(config) {
        this.name = config.name;
        this.description = config.description;
        this.minPlayers = config.minPlayers;
        this.maxPlayers = config.maxPlayers;
        this.avgDuration = config.avgDuration;
        this.difficulty = config.difficulty;
        this.rules = config.rules || {};
    }
    
    async createGame(players, options) {
        throw new Error('createGame must be implemented by subclass');
    }
    
    validatePlayers(players) {
        if (players.length < this.minPlayers) {
            throw new Error(`Need at least ${this.minPlayers} players`);
        }
        if (players.length > this.maxPlayers) {
            throw new Error(`Maximum ${this.maxPlayers} players allowed`);
        }
    }
}

// Standard Pokemon-style gameplay
class StandardMode extends BaseGameMode {
    constructor() {
        super({
            name: 'Standard Battle',
            description: 'Classic Pokemon-style card battle with full decks',
            minPlayers: 2,
            maxPlayers: 2,
            avgDuration: '15-25 minutes',
            difficulty: 'Medium',
            rules: {
                deckSize: 60,
                handSize: 7,
                prizeCount: 6,
                maxField: 5,
                energyPerTurn: 1
            }
        });
    }
    
    async createGame(players, options) {
        this.validatePlayers(players);
        
        const [player1, player2] = players;
        
        const game = {
            players: [
                { 
                    user: player1, 
                    engine: new CardGameEngine(player1),
                    hp: 100,
                    prizes: 6
                },
                { 
                    user: player2, 
                    engine: new CardGameEngine(player2),
                    hp: 100,
                    prizes: 6
                }
            ],
            currentPlayer: 0,
            turn: 1,
            phase: 'setup',
            winConditions: ['prizes', 'deckout', 'hp'],
            battleSystem: new CardBattleSystem()
        };
        
        // Initialize both players' games
        await game.players[0].engine.startGame(null, 'standard');
        await game.players[1].engine.startGame(null, 'standard');
        
        return game;
    }
}

// Quick 10-15 minute matches
class QuickMode extends BaseGameMode {
    constructor() {
        super({
            name: 'Quick Battle',
            description: 'Fast 10-15 minute matches with smaller decks',
            minPlayers: 2,
            maxPlayers: 2,
            avgDuration: '10-15 minutes',
            difficulty: 'Easy',
            rules: {
                deckSize: 30,
                handSize: 5,
                prizeCount: 3,
                maxField: 3,
                energyPerTurn: 2
            }
        });
    }
    
    async createGame(players, options) {
        this.validatePlayers(players);
        
        const [player1, player2] = players;
        
        const game = {
            players: [
                { 
                    user: player1, 
                    engine: new CardGameEngine(player1),
                    hp: 60
                },
                { 
                    user: player2, 
                    engine: new CardGameEngine(player2),
                    hp: 60
                }
            ],
            currentPlayer: 0,
            turn: 1,
            phase: 'setup',
            timeLimit: 15 * 60 * 1000, // 15 minutes
            winConditions: ['hp', 'timeout'],
            battleSystem: new CardBattleSystem()
        };
        
        await game.players[0].engine.startGame(null, 'quick');
        await game.players[1].engine.startGame(null, 'quick');
        
        return game;
    }
}

// Draft/Sealed limited format
class LimitedMode extends BaseGameMode {
    constructor() {
        super({
            name: 'Limited Draft',
            description: 'Build deck from random card packs during play',
            minPlayers: 2,
            maxPlayers: 8,
            avgDuration: '30-45 minutes',
            difficulty: 'Hard',
            rules: {
                packCount: 6,
                packSize: 15,
                deckSize: 40,
                handSize: 7
            }
        });
    }
    
    async createGame(players, options) {
        this.validatePlayers(players);
        
        const game = {
            players: players.map(player => ({
                user: player,
                cardPool: [],
                deck: [],
                engine: null
            })),
            phase: 'draft',
            draftRound: 0,
            packs: []
        };
        
        // Generate draft packs
        await this.generateDraftPacks(game);
        
        return game;
    }
    
    async generateDraftPacks(game) {
        // Create packs for drafting
        for (let i = 0; i < this.rules.packCount; i++) {
            const pack = await this.generatePack();
            game.packs.push(pack);
        }
    }
    
    async generatePack() {
        // Generate a random pack of cards
        const pack = [];
        
        // 1 rare, 3 uncommons, 11 commons (Magic-style)
        pack.push(this.generateRandomCard('rare'));
        
        for (let i = 0; i < 3; i++) {
            pack.push(this.generateRandomCard('uncommon'));
        }
        
        for (let i = 0; i < 11; i++) {
            pack.push(this.generateRandomCard('common'));
        }
        
        return pack;
    }
    
    generateRandomCard(rarity) {
        // Generate a random card of specified rarity
        const elements = ['fire', 'water', 'earth', 'air', 'neutral'];
        const element = elements[Math.floor(Math.random() * elements.length)];
        
        const powerRanges = {
            common: [10, 30],
            uncommon: [25, 45],
            rare: [40, 60]
        };
        
        const [minPower, maxPower] = powerRanges[rarity];
        const power = Math.floor(Math.random() * (maxPower - minPower + 1)) + minPower;
        
        return {
            id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${element} Card`,
            element,
            power,
            defense: power + 10,
            cost: Math.ceil(power / 15),
            rarity,
            type: 'creature'
        };
    }
}

// Single-player puzzle challenges
class SolitaireMode extends BaseGameMode {
    constructor() {
        super({
            name: 'Solitaire Puzzles',
            description: 'Single-player challenges and brain teasers',
            minPlayers: 1,
            maxPlayers: 1,
            avgDuration: '5-20 minutes',
            difficulty: 'Variable'
        });
    }
    
    async createGame(players, options) {
        this.validatePlayers(players);
        
        const puzzleType = options.puzzleType || 'basic';
        const puzzle = this.generatePuzzle(puzzleType);
        
        const game = {
            player: players[0],
            engine: new CardGameEngine(players[0]),
            puzzle,
            moves: 0,
            maxMoves: puzzle.maxMoves,
            completed: false,
            timeLimit: puzzle.timeLimit
        };
        
        return game;
    }
    
    generatePuzzle(type) {
        const puzzles = {
            basic: {
                name: 'Card Matching',
                description: 'Match 5 pairs in under 10 moves',
                objective: 'match_pairs',
                target: 5,
                maxMoves: 10,
                timeLimit: null
            },
            
            energy: {
                name: 'Energy Balance',
                description: 'Balance all 4 elements with equal energy',
                objective: 'balance_elements',
                target: 4,
                maxMoves: 15,
                timeLimit: null
            },
            
            survival: {
                name: 'Survival Challenge',
                description: 'Survive 10 rounds with limited resources',
                objective: 'survive_rounds',
                target: 10,
                maxMoves: null,
                timeLimit: 5 * 60 * 1000 // 5 minutes
            },
            
            combo: {
                name: 'Combo Master',
                description: 'Execute a 7-card combo',
                objective: 'execute_combo',
                target: 7,
                maxMoves: 20,
                timeLimit: null
            }
        };
        
        return puzzles[type] || puzzles.basic;
    }
}

// Texas Hold'em style with shared cards
class HoldemMode extends BaseGameMode {
    constructor() {
        super({
            name: "Hold'em Battle",
            description: 'Texas Hold\'em style with shared energy pool',
            minPlayers: 2,
            maxPlayers: 6,
            avgDuration: '20-30 minutes',
            difficulty: 'Medium'
        });
    }
    
    async createGame(players, options) {
        this.validatePlayers(players);
        
        const game = {
            players: players.map(player => ({
                user: player,
                hand: [],
                chips: 100,
                bet: 0,
                folded: false,
                allIn: false
            })),
            communityCards: [],
            pot: 0,
            currentPlayer: 0,
            round: 'preflop', // preflop, flop, turn, river, showdown
            dealerButton: 0
        };
        
        await this.dealInitialCards(game);
        
        return game;
    }
    
    async dealInitialCards(game) {
        // Deal 2 cards to each player
        for (const player of game.players) {
            player.hand = [
                this.dealCard(),
                this.dealCard()
            ];
        }
    }
    
    dealCard() {
        // Deal a random energy card
        const types = ['fire', 'water', 'earth', 'air', 'neutral'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        return {
            id: `holdem_${Date.now()}_${Math.random()}`,
            type,
            element: type,
            power: Math.floor(Math.random() * 50) + 10
        };
    }
}

// Multiple players, last one standing
class BattleRoyaleMode extends BaseGameMode {
    constructor() {
        super({
            name: 'Battle Royale',
            description: 'Free-for-all with up to 8 players',
            minPlayers: 3,
            maxPlayers: 8,
            avgDuration: '25-40 minutes',
            difficulty: 'Hard'
        });
    }
    
    async createGame(players, options) {
        this.validatePlayers(players);
        
        const game = {
            players: players.map(player => ({
                user: player,
                engine: new CardGameEngine(player),
                hp: 80,
                alive: true,
                position: Math.floor(Math.random() * 360) // Starting position
            })),
            zone: {
                radius: 100,
                center: { x: 0, y: 0 },
                shrinking: false
            },
            turn: 1,
            playersAlive: players.length
        };
        
        // Initialize all players
        for (const player of game.players) {
            await player.engine.startGame(null, 'quick');
        }
        
        return game;
    }
}

// Fast-paced speed rounds
class SpeedMode extends BaseGameMode {
    constructor() {
        super({
            name: 'Speed Battle',
            description: 'Real-time battles with time pressure',
            minPlayers: 2,
            maxPlayers: 2,
            avgDuration: '5-8 minutes',
            difficulty: 'Medium'
        });
    }
    
    async createGame(players, options) {
        this.validatePlayers(players);
        
        const game = {
            players: players.map(player => ({
                user: player,
                engine: new CardGameEngine(player),
                hp: 50,
                timeBank: 60000 // 60 seconds per player
            })),
            globalTimeLimit: 8 * 60 * 1000, // 8 minutes total
            turnTimeLimit: 30 * 1000, // 30 seconds per turn
            currentPlayer: 0,
            started: Date.now()
        };
        
        await game.players[0].engine.startGame(null, 'quick');
        await game.players[1].engine.startGame(null, 'quick');
        
        return game;
    }
}

// Story-driven campaign
class CampaignMode extends BaseGameMode {
    constructor() {
        super({
            name: 'Campaign',
            description: 'Story-driven battles against AI opponents',
            minPlayers: 1,
            maxPlayers: 1,
            avgDuration: '30-60 minutes',
            difficulty: 'Variable'
        });
    }
    
    async createGame(players, options) {
        this.validatePlayers(players);
        
        const campaign = options.campaign || 'starter';
        const chapter = options.chapter || 1;
        
        const game = {
            player: players[0],
            engine: new CardGameEngine(players[0]),
            campaign,
            chapter,
            enemy: this.generateEnemy(campaign, chapter),
            story: this.getStoryContent(campaign, chapter),
            rewards: this.getChapterRewards(campaign, chapter)
        };
        
        return game;
    }
    
    generateEnemy(campaign, chapter) {
        return {
            name: `Chapter ${chapter} Boss`,
            deck: this.generateEnemyDeck(chapter),
            hp: 50 + (chapter * 10),
            difficulty: Math.min(chapter, 10)
        };
    }
    
    generateEnemyDeck(chapter) {
        // Generate AI deck based on chapter
        const deck = [];
        const cardCount = 30 + (chapter * 2);
        
        for (let i = 0; i < cardCount; i++) {
            deck.push(this.generateEnemyCard(chapter));
        }
        
        return deck;
    }
    
    generateEnemyCard(chapter) {
        const basePower = 15 + (chapter * 3);
        
        return {
            id: `enemy_${chapter}_${Math.random()}`,
            name: `Enemy Card Lv.${chapter}`,
            power: basePower + Math.floor(Math.random() * 10),
            defense: basePower + 5,
            element: ['fire', 'water', 'earth', 'air'][Math.floor(Math.random() * 4)]
        };
    }
    
    getStoryContent(campaign, chapter) {
        return {
            title: `Chapter ${chapter}: The ${campaign} Campaign`,
            intro: `You face a new challenge in chapter ${chapter}...`,
            victory: `You have overcome chapter ${chapter}!`,
            defeat: `The enemies of chapter ${chapter} proved too strong...`
        };
    }
    
    getChapterRewards(campaign, chapter) {
        return {
            experience: chapter * 50,
            cards: Math.floor(chapter / 2) + 1,
            coins: chapter * 25
        };
    }
}

// Specific puzzle challenges
class PuzzleMode extends BaseGameMode {
    constructor() {
        super({
            name: 'Puzzle Challenges',
            description: 'Brain teaser scenarios with specific solutions',
            minPlayers: 1,
            maxPlayers: 1,
            avgDuration: '3-15 minutes',
            difficulty: 'Variable'
        });
    }
    
    async createGame(players, options) {
        this.validatePlayers(players);
        
        const puzzleId = options.puzzleId || 'puzzle_001';
        const puzzle = this.loadPuzzle(puzzleId);
        
        return {
            player: players[0],
            puzzle,
            moves: [],
            timeStarted: Date.now(),
            completed: false,
            rating: null
        };
    }
    
    loadPuzzle(puzzleId) {
        // Load pre-designed puzzle scenarios
        const puzzles = {
            puzzle_001: {
                name: 'First Steps',
                description: 'Win in 3 moves',
                board: this.generatePuzzleBoard('beginner'),
                solution: ['play_energy', 'summon_creature', 'attack'],
                maxMoves: 3,
                difficulty: 1
            },
            
            puzzle_002: {
                name: 'Energy Crisis',
                description: 'Win with exactly 0 energy remaining',
                board: this.generatePuzzleBoard('energy'),
                solution: null, // Multiple solutions
                maxMoves: 5,
                difficulty: 3
            },
            
            puzzle_003: {
                name: 'The Combo',
                description: 'Execute a 5-card combo to win',
                board: this.generatePuzzleBoard('combo'),
                solution: ['card1', 'card2', 'card3', 'card4', 'card5'],
                maxMoves: 5,
                difficulty: 5
            }
        };
        
        return puzzles[puzzleId] || puzzles.puzzle_001;
    }
    
    generatePuzzleBoard(type) {
        // Generate specific puzzle setups
        return {
            hand: [],
            field: [],
            energy: 10,
            enemy: { hp: 20, cards: [] }
        };
    }
}

module.exports = { 
    GameModeManager,
    StandardMode,
    QuickMode,
    LimitedMode,
    SolitaireMode,
    HoldemMode,
    BattleRoyaleMode,
    SpeedMode,
    CampaignMode,
    PuzzleMode
};

// Testing
if (require.main === module) {
    const { UserCore } = require('./user-core');
    
    console.log('🎮 Testing Game Modes\n');
    
    const manager = new GameModeManager();
    
    // Show available modes
    console.log('Available Game Modes:');
    const modes = manager.getAvailableModes();
    modes.forEach(mode => {
        console.log(`\n${mode.name}:`);
        console.log(`  ${mode.description}`);
        console.log(`  Players: ${mode.minPlayers}-${mode.maxPlayers}`);
        console.log(`  Duration: ${mode.avgDuration}`);
        console.log(`  Difficulty: ${mode.difficulty}`);
    });
    
    // Test creating a quick game
    (async () => {
        try {
            const player1 = new UserCore();
            player1.profile.username = 'Player1';
            
            const player2 = new UserCore();
            player2.profile.username = 'Player2';
            
            console.log('\n🚀 Starting quick game...');
            const game = await manager.startGame('quick', [player1, player2]);
            
            console.log(`✅ Game created: ${game.id}`);
            console.log(`Players: ${game.players.length}`);
            
        } catch (error) {
            console.error('Game creation error:', error.message);
        }
    })();
}