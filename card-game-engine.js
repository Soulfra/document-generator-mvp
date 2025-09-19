#!/usr/bin/env node

/**
 * CARD GAME ENGINE
 * 
 * Transforms energy cards from a simple inventory into a full
 * Trading Card Game with zones, turns, and gameplay mechanics.
 * 
 * Inspired by Pokemon TCG, Magic: The Gathering, and Yu-Gi-Oh
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class CardGameEngine extends EventEmitter {
    constructor(player) {
        super();
        
        this.player = player; // UserCore instance
        this.gameId = this.generateGameId();
        
        // Card game zones (like Pokemon/MTG)
        this.zones = {
            deck: [],        // Face-down cards to draw from
            hand: [],        // Cards in hand (private)
            field: [],       // Cards in play (public)
            energyZone: [],  // Energy cards attached/in play
            discard: [],     // Discard pile (public)
            banished: [],    // Removed from game
            prizes: []       // Prize cards (Pokemon-style)
        };
        
        // Game state
        this.gameState = {
            turn: 0,
            phase: 'setup',  // setup, draw, energy, main, battle, end
            activePlayer: true,
            
            // Resources
            energyPerTurn: 1,
            energyPlayed: 0,
            cardsPlayedThisTurn: 0,
            
            // Limits
            maxHandSize: 7,
            maxFieldSize: 5,
            maxEnergyZone: 10,
            startingHandSize: 7,
            
            // Game mode settings
            gameMode: 'standard',
            deckSize: 60,
            prizeCount: 6,
            
            // Win conditions
            winCondition: null,
            gameOver: false
        };
        
        // Turn history
        this.turnHistory = [];
        this.actionLog = [];
        
        // Card effects stack (like MTG)
        this.effectStack = [];
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        console.log(`🎮 Card Game Engine initialized for ${this.player.id}`);
        console.log(`🎯 Game ID: ${this.gameId}`);
    }
    
    /**
     * Start a new game
     */
    async startGame(deckList = null, gameMode = 'standard') {
        console.log(`🎯 Starting new ${gameMode} game...`);
        
        this.gameState.gameMode = gameMode;
        
        // Set game mode parameters
        this.applyGameModeRules(gameMode);
        
        // Build deck from player's collection or use provided deck
        const deck = deckList || await this.buildDeckFromCollection();
        
        // Validate deck
        if (!this.validateDeck(deck)) {
            throw new Error('Invalid deck configuration');
        }
        
        // Setup game
        this.setupDeck(deck);
        this.shuffleDeck();
        this.drawStartingHand();
        this.setupPrizes();
        
        // Start first turn
        this.startTurn();
        
        this.emit('gameStarted', {
            gameId: this.gameId,
            player: this.player.id,
            gameMode,
            deckSize: this.zones.deck.length
        });
        
        return {
            gameId: this.gameId,
            hand: this.zones.hand.length,
            deck: this.zones.deck.length
        };
    }
    
    /**
     * Apply game mode specific rules
     */
    applyGameModeRules(gameMode) {
        const modes = {
            standard: {
                deckSize: 60,
                maxHandSize: 7,
                startingHandSize: 7,
                prizeCount: 6,
                maxFieldSize: 5,
                energyPerTurn: 1
            },
            quick: {
                deckSize: 30,
                maxHandSize: 5,
                startingHandSize: 5,
                prizeCount: 3,
                maxFieldSize: 3,
                energyPerTurn: 2
            },
            unlimited: {
                deckSize: 60,
                maxHandSize: 10,
                startingHandSize: 7,
                prizeCount: 6,
                maxFieldSize: 7,
                energyPerTurn: 1
            },
            puzzle: {
                deckSize: 20,
                maxHandSize: 10,
                startingHandSize: 10,
                prizeCount: 0,
                maxFieldSize: 5,
                energyPerTurn: 3
            }
        };
        
        const rules = modes[gameMode] || modes.standard;
        Object.assign(this.gameState, rules);
    }
    
    /**
     * Build deck from player's card collection
     */
    async buildDeckFromCollection() {
        const deck = [];
        const inventory = Array.from(this.player.energyCards.inventory.values());
        
        // For now, just take cards from inventory
        // In a real game, player would build custom decks
        for (const card of inventory) {
            deck.push(this.convertToGameCard(card));
            if (deck.length >= this.gameState.deckSize) break;
        }
        
        // Fill remaining slots with basic energy
        while (deck.length < this.gameState.deckSize) {
            deck.push(this.createBasicEnergyCard());
        }
        
        return deck;
    }
    
    /**
     * Convert energy card to game card
     */
    convertToGameCard(energyCard) {
        return {
            id: energyCard.id,
            gameCardId: this.generateCardId(),
            name: energyCard.name,
            type: energyCard.type,
            
            // Game properties
            cost: Math.ceil(energyCard.baseEnergy / 10),
            power: energyCard.baseEnergy,
            defense: energyCard.maxCharge,
            speed: energyCard.regenRate * 10,
            
            // Card info
            element: energyCard.element,
            rarity: this.calculateRarity(energyCard),
            
            // State
            tapped: false,
            damage: 0,
            attachedEnergy: [],
            effects: [],
            
            // Original reference
            originalCard: energyCard
        };
    }
    
    /**
     * Create basic energy card
     */
    createBasicEnergyCard() {
        const types = ['fire', 'water', 'earth', 'air', 'neutral'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        return {
            id: this.generateCardId(),
            gameCardId: this.generateCardId(),
            name: `Basic ${type} Energy`,
            type: 'energy',
            
            cost: 0,
            power: 0,
            defense: 0,
            speed: 0,
            
            element: type,
            rarity: 'common',
            
            tapped: false,
            isBasicEnergy: true
        };
    }
    
    /**
     * Validate deck according to game rules
     */
    validateDeck(deck) {
        if (deck.length !== this.gameState.deckSize) {
            console.error(`Deck size ${deck.length} doesn't match required ${this.gameState.deckSize}`);
            return false;
        }
        
        // Check for card limits (e.g., max 4 of same non-basic card)
        const cardCounts = {};
        for (const card of deck) {
            if (!card.isBasicEnergy) {
                cardCounts[card.name] = (cardCounts[card.name] || 0) + 1;
                if (cardCounts[card.name] > 4) {
                    console.error(`Too many copies of ${card.name}`);
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Setup deck for game
     */
    setupDeck(deck) {
        this.zones.deck = [...deck];
        console.log(`📚 Deck loaded with ${this.zones.deck.length} cards`);
    }
    
    /**
     * Shuffle deck
     */
    shuffleDeck() {
        for (let i = this.zones.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.zones.deck[i], this.zones.deck[j]] = [this.zones.deck[j], this.zones.deck[i]];
        }
        
        this.logAction('shuffle', { zone: 'deck' });
    }
    
    /**
     * Draw starting hand
     */
    drawStartingHand() {
        for (let i = 0; i < this.gameState.startingHandSize; i++) {
            this.drawCard(false); // Don't trigger draw effects
        }
        
        console.log(`✋ Drew starting hand of ${this.zones.hand.length} cards`);
    }
    
    /**
     * Setup prize cards (Pokemon-style)
     */
    setupPrizes() {
        if (this.gameState.prizeCount > 0) {
            for (let i = 0; i < this.gameState.prizeCount; i++) {
                if (this.zones.deck.length > 0) {
                    const card = this.zones.deck.shift();
                    this.zones.prizes.push(card);
                }
            }
            console.log(`🏆 Set aside ${this.zones.prizes.length} prize cards`);
        }
    }
    
    /**
     * Start a new turn
     */
    startTurn() {
        this.gameState.turn++;
        this.gameState.phase = 'draw';
        this.gameState.energyPlayed = 0;
        this.gameState.cardsPlayedThisTurn = 0;
        
        // Untap all cards
        this.untapAll();
        
        console.log(`\n🔄 Turn ${this.gameState.turn} begins`);
        
        // Draw phase
        if (this.gameState.turn > 1) {
            this.drawCard();
        }
        
        // Move to main phase
        this.gameState.phase = 'main';
        
        this.emit('turnStarted', {
            turn: this.gameState.turn,
            player: this.player.id
        });
    }
    
    /**
     * Draw a card
     */
    drawCard(triggerEffects = true) {
        if (this.zones.deck.length === 0) {
            // Deck out - lose condition
            this.endGame('deckout');
            return null;
        }
        
        const card = this.zones.deck.shift();
        this.zones.hand.push(card);
        
        this.logAction('draw', { card: card.name });
        
        if (triggerEffects) {
            this.emit('cardDrawn', { card, player: this.player.id });
        }
        
        // Check hand size limit
        this.checkHandSize();
        
        return card;
    }
    
    /**
     * Play a card from hand
     */
    playCard(cardIndex, targetZone = 'field', targets = []) {
        if (cardIndex < 0 || cardIndex >= this.zones.hand.length) {
            throw new Error('Invalid card index');
        }
        
        const card = this.zones.hand[cardIndex];
        
        // Check if can play
        if (!this.canPlayCard(card)) {
            throw new Error('Cannot play this card');
        }
        
        // Pay costs
        this.payCosts(card);
        
        // Remove from hand
        this.zones.hand.splice(cardIndex, 1);
        
        // Place in appropriate zone
        if (card.type === 'energy' || card.isBasicEnergy) {
            this.zones.energyZone.push(card);
            this.gameState.energyPlayed++;
        } else {
            if (this.zones.field.length >= this.gameState.maxFieldSize) {
                throw new Error('Field is full');
            }
            this.zones.field.push(card);
        }
        
        this.gameState.cardsPlayedThisTurn++;
        
        // Apply enter-play effects
        this.applyEnterPlayEffects(card, targets);
        
        this.logAction('play', { 
            card: card.name, 
            zone: targetZone,
            cost: card.cost 
        });
        
        this.emit('cardPlayed', {
            card,
            player: this.player.id,
            zone: targetZone
        });
        
        return card;
    }
    
    /**
     * Check if card can be played
     */
    canPlayCard(card) {
        // Check phase
        if (this.gameState.phase !== 'main') {
            return false;
        }
        
        // Check energy cost
        if (!this.canPayCost(card)) {
            return false;
        }
        
        // Check special restrictions
        if (card.type === 'energy' && this.gameState.energyPlayed >= this.gameState.energyPerTurn) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if can pay card cost
     */
    canPayCost(card) {
        if (card.cost === 0) return true;
        
        const availableEnergy = this.zones.energyZone.filter(e => !e.tapped).length;
        return availableEnergy >= card.cost;
    }
    
    /**
     * Pay costs for card
     */
    payCosts(card) {
        if (card.cost === 0) return;
        
        // Tap energy cards
        let paid = 0;
        for (const energy of this.zones.energyZone) {
            if (paid >= card.cost) break;
            if (!energy.tapped) {
                energy.tapped = true;
                paid++;
            }
        }
    }
    
    /**
     * Battle phase - attack with a card
     */
    async attackWithCard(attackerIndex, targetIndex = null) {
        if (this.gameState.phase !== 'battle' && this.gameState.phase !== 'main') {
            throw new Error('Cannot attack in this phase');
        }
        
        const attacker = this.zones.field[attackerIndex];
        if (!attacker) throw new Error('Invalid attacker');
        
        if (attacker.tapped) throw new Error('Card is already tapped');
        
        // Tap attacker
        attacker.tapped = true;
        
        // Direct attack or target
        if (targetIndex !== null) {
            const target = this.zones.field[targetIndex];
            if (!target) throw new Error('Invalid target');
            
            await this.resolveCombat(attacker, target);
        } else {
            // Direct damage (if no defenders)
            await this.dealDirectDamage(attacker.power);
        }
        
        this.logAction('attack', {
            attacker: attacker.name,
            target: targetIndex !== null ? this.zones.field[targetIndex].name : 'direct',
            damage: attacker.power
        });
    }
    
    /**
     * Resolve combat between two cards
     */
    async resolveCombat(attacker, defender) {
        // Apply damage
        defender.damage += attacker.power;
        
        // Counter damage (if defender survives)
        if (defender.defense > defender.damage) {
            attacker.damage += defender.power;
        }
        
        // Check for destruction
        if (defender.damage >= defender.defense) {
            await this.destroyCard(defender, 'combat');
        }
        
        if (attacker.damage >= attacker.defense) {
            await this.destroyCard(attacker, 'combat');
        }
        
        this.emit('combatResolved', {
            attacker,
            defender,
            player: this.player.id
        });
    }
    
    /**
     * Destroy a card
     */
    async destroyCard(card, reason = 'effect') {
        // Remove from field
        const fieldIndex = this.zones.field.indexOf(card);
        if (fieldIndex > -1) {
            this.zones.field.splice(fieldIndex, 1);
            this.zones.discard.push(card);
        }
        
        this.logAction('destroy', {
            card: card.name,
            reason
        });
        
        this.emit('cardDestroyed', {
            card,
            reason,
            player: this.player.id
        });
        
        // Check for prize (Pokemon-style)
        if (reason === 'combat' && this.zones.prizes.length > 0) {
            this.claimPrize();
        }
    }
    
    /**
     * Claim a prize card
     */
    claimPrize() {
        if (this.zones.prizes.length > 0) {
            const prize = this.zones.prizes.shift();
            this.zones.hand.push(prize);
            
            console.log(`🏆 Claimed prize card: ${prize.name}`);
            
            // Check win condition
            if (this.zones.prizes.length === 0) {
                this.endGame('prizes');
            }
        }
    }
    
    /**
     * End current turn
     */
    endTurn() {
        this.gameState.phase = 'end';
        
        // End of turn effects
        this.processEndOfTurn();
        
        // Check hand size
        this.enforceHandLimit();
        
        // Record turn
        this.turnHistory.push({
            turn: this.gameState.turn,
            actions: [...this.actionLog]
        });
        
        this.actionLog = [];
        
        this.emit('turnEnded', {
            turn: this.gameState.turn,
            player: this.player.id
        });
        
        // Start next turn
        if (!this.gameState.gameOver) {
            this.startTurn();
        }
    }
    
    /**
     * End the game
     */
    endGame(winCondition) {
        this.gameState.gameOver = true;
        this.gameState.winCondition = winCondition;
        
        console.log(`🎮 Game Over - ${winCondition}`);
        
        this.emit('gameEnded', {
            gameId: this.gameId,
            player: this.player.id,
            winCondition,
            turns: this.gameState.turn,
            winner: this.determineWinner(winCondition)
        });
    }
    
    /**
     * Helper methods
     */
    
    untapAll() {
        [...this.zones.field, ...this.zones.energyZone].forEach(card => {
            card.tapped = false;
        });
    }
    
    checkHandSize() {
        if (this.zones.hand.length > this.gameState.maxHandSize * 2) {
            console.warn('⚠️ Hand size critical!');
        }
    }
    
    enforceHandLimit() {
        while (this.zones.hand.length > this.gameState.maxHandSize) {
            // Discard random card (in real game, player chooses)
            const index = Math.floor(Math.random() * this.zones.hand.length);
            const discarded = this.zones.hand.splice(index, 1)[0];
            this.zones.discard.push(discarded);
            
            console.log(`🗑️ Discarded ${discarded.name} due to hand limit`);
        }
    }
    
    processEndOfTurn() {
        // Process any end-of-turn effects
        for (const card of this.zones.field) {
            if (card.effects) {
                // Process effects
            }
        }
    }
    
    calculateRarity(card) {
        if (card.baseEnergy >= 50) return 'legendary';
        if (card.baseEnergy >= 40) return 'epic';
        if (card.baseEnergy >= 30) return 'rare';
        if (card.baseEnergy >= 20) return 'uncommon';
        return 'common';
    }
    
    logAction(action, details) {
        this.actionLog.push({
            action,
            details,
            timestamp: new Date(),
            turn: this.gameState.turn,
            phase: this.gameState.phase
        });
    }
    
    generateGameId() {
        return `game_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    generateCardId() {
        return `gcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get current game state
     */
    getGameState() {
        return {
            gameId: this.gameId,
            turn: this.gameState.turn,
            phase: this.gameState.phase,
            zones: {
                deck: this.zones.deck.length,
                hand: this.zones.hand.map(c => ({ name: c.name, cost: c.cost })),
                field: this.zones.field.map(c => ({
                    name: c.name,
                    power: c.power,
                    defense: c.defense,
                    damage: c.damage,
                    tapped: c.tapped
                })),
                energy: this.zones.energyZone.length,
                discard: this.zones.discard.length,
                prizes: this.zones.prizes.length
            },
            canPlayCard: this.zones.hand.some(c => this.canPlayCard(c)),
            gameOver: this.gameState.gameOver
        };
    }
}

module.exports = { CardGameEngine };

// Test the card game
if (require.main === module) {
    const { UserCore } = require('./user-core');
    
    console.log('🎮 Testing Card Game Engine\n');
    
    // Create test user
    const user = new UserCore();
    user.profile.username = 'TestPlayer';
    
    // Create game engine
    const game = new CardGameEngine(user);
    
    // Start a game
    (async () => {
        try {
            // Start standard game
            const result = await game.startGame(null, 'quick');
            console.log('\n📊 Game started:', result);
            
            // Show initial state
            console.log('\n🎯 Initial game state:');
            console.log(JSON.stringify(game.getGameState(), null, 2));
            
            // Try to play a card
            if (game.zones.hand.length > 0) {
                console.log('\n🃏 Attempting to play first card...');
                try {
                    const played = game.playCard(0);
                    console.log(`✅ Played ${played.name}`);
                } catch (error) {
                    console.log(`❌ Couldn't play card: ${error.message}`);
                }
            }
            
            // End turn
            console.log('\n⏩ Ending turn...');
            game.endTurn();
            
            // Show new state
            console.log('\n📊 Turn 2 state:');
            console.log(JSON.stringify(game.getGameState(), null, 2));
            
        } catch (error) {
            console.error('Game error:', error);
        }
    })();
}