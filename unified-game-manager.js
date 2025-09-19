/**
 * @fileoverview Unified Game Manager
 * @module UnifiedGameManager
 * @description Central controller for managing multiple game modes, state synchronization,
 * and cross-game features. Integrates with all game systems for seamless transitions.
 * 
 * @author Document Generator Team
 * @version 1.0.0
 * @license MIT
 */

import EventEmitter from 'events';

/**
 * @typedef {Object} GameMode
 * @property {string} id - Unique identifier for the game mode
 * @property {string} name - Display name
 * @property {string} description - Mode description
 * @property {string} url - URL or path to the game
 * @property {string} type - Game type (iframe, module, component)
 * @property {Object} config - Mode-specific configuration
 * @property {boolean} requiresAuth - Whether authentication is required
 * @property {number} minPlayers - Minimum players required
 * @property {number} maxPlayers - Maximum players allowed
 */

/**
 * @typedef {Object} PlayerState
 * @property {string} id - Player ID
 * @property {string} name - Player name
 * @property {Object} profile - Player profile data
 * @property {Object} inventory - Cross-game inventory
 * @property {Object} achievements - Achievements earned
 * @property {Object} stats - Player statistics
 * @property {string} currentGame - Current game mode ID
 */

/**
 * @typedef {Object} GameState
 * @property {string} mode - Current game mode ID
 * @property {Object} data - Game-specific state data
 * @property {Array<string>} players - Active player IDs
 * @property {Object} settings - Game settings
 * @property {number} startTime - Game start timestamp
 * @property {string} status - Game status (waiting, active, paused, ended)
 */

/**
 * @class UnifiedGameManager
 * @extends EventEmitter
 * @description Manages all game modes and provides unified control interface
 */
class UnifiedGameManager extends EventEmitter {
    /**
     * @constructor
     * @param {Object} options - Configuration options
     * @param {boolean} [options.enablePersistence=true] - Enable state persistence
     * @param {boolean} [options.enableCrossGame=true] - Enable cross-game features
     * @param {string} [options.storagePrefix='ugm_'] - localStorage prefix
     */
    constructor(options = {}) {
        super();
        
        this.options = {
            enablePersistence: options.enablePersistence !== false,
            enableCrossGame: options.enableCrossGame !== false,
            storagePrefix: options.storagePrefix || 'ugm_'
        };

        // Game modes registry
        this.gameModes = new Map();
        
        // Player management
        this.players = new Map();
        this.currentPlayer = null;
        
        // Game state
        this.currentGameState = null;
        this.gameHistory = [];
        
        // Active game instance
        this.activeGame = null;
        this.gameContainer = null;
        
        // Cross-game features
        this.sharedInventory = new Map();
        this.globalAchievements = new Map();
        this.leaderboards = new Map();
        
        // Communication channels
        this.messageHandlers = new Map();
        this.gameConnections = new Map();
        
        // Initialize default game modes
        this.registerDefaultModes();
        
        // Load persisted state
        if (this.options.enablePersistence) {
            this.loadPersistedState();
        }
        
        // Setup message handling
        this.setupMessageHandling();
    }

    /**
     * Register default game modes
     * @private
     */
    registerDefaultModes() {
        // Fighting Arena
        this.registerGameMode({
            id: 'fighting-arena',
            name: 'Ultimate Fighting Arena',
            description: 'Sprite-based fighting game with AI opponents',
            url: '/ultimate-fighting-arena.html',
            type: 'iframe',
            config: {
                width: 1024,
                height: 576,
                fullscreen: true
            },
            requiresAuth: false,
            minPlayers: 1,
            maxPlayers: 2
        });

        // Pixel Empire
        this.registerGameMode({
            id: 'pixel-empire',
            name: 'One Dollar Pixel Empire',
            description: 'Own and trade pixels in a million-pixel world',
            url: '/one-dollar-pixel-empire.html',
            type: 'iframe',
            config: {
                width: '100%',
                height: '100%',
                sandbox: 'allow-scripts allow-same-origin'
            },
            requiresAuth: true,
            minPlayers: 1,
            maxPlayers: 1000
        });

        // Billion Dollar Game
        this.registerGameMode({
            id: 'billion-dollar',
            name: 'Billion Dollar Economy',
            description: 'VC prediction markets and economic simulation',
            url: '/billion-dollar-game-economy.js',
            type: 'module',
            config: {
                initialCapital: 1000000,
                marketVolatility: 0.3
            },
            requiresAuth: true,
            minPlayers: 1,
            maxPlayers: 100
        });

        // Tutorial Island
        this.registerGameMode({
            id: 'tutorial-island',
            name: 'Tutorial Island',
            description: 'Learn the game systems through interactive adventures',
            url: '/AI-HANDSHAKE-TUTORIAL-ISLAND.html',
            type: 'iframe',
            config: {
                startLevel: 1,
                guidedMode: true
            },
            requiresAuth: false,
            minPlayers: 1,
            maxPlayers: 1
        });
    }

    /**
     * Register a new game mode
     * @param {GameMode} mode - Game mode configuration
     */
    registerGameMode(mode) {
        if (!mode.id || !mode.name || !mode.url) {
            throw new Error('Game mode must have id, name, and url');
        }
        
        this.gameModes.set(mode.id, mode);
        this.emit('modeRegistered', mode);
    }

    /**
     * Initialize player session
     * @param {Object} playerData - Player information
     * @returns {PlayerState} Initialized player state
     */
    initializePlayer(playerData) {
        const playerId = playerData.id || this.generatePlayerId();
        
        const playerState = {
            id: playerId,
            name: playerData.name || `Player ${playerId.slice(0, 6)}`,
            profile: playerData.profile || {},
            inventory: this.loadPlayerInventory(playerId),
            achievements: this.loadPlayerAchievements(playerId),
            stats: this.loadPlayerStats(playerId),
            currentGame: null
        };
        
        this.players.set(playerId, playerState);
        this.currentPlayer = playerState;
        
        this.emit('playerInitialized', playerState);
        return playerState;
    }

    /**
     * Launch a game mode
     * @param {string} modeId - Game mode ID to launch
     * @param {HTMLElement} container - Container element for the game
     * @param {Object} options - Launch options
     * @returns {Promise<void>}
     */
    async launchGame(modeId, container, options = {}) {
        const mode = this.gameModes.get(modeId);
        if (!mode) {
            throw new Error(`Unknown game mode: ${modeId}`);
        }
        
        // Check player requirements
        if (mode.requiresAuth && !this.currentPlayer) {
            throw new Error('Authentication required for this game mode');
        }
        
        // Clean up previous game
        if (this.activeGame) {
            await this.endCurrentGame();
        }
        
        // Initialize game state
        this.currentGameState = {
            mode: modeId,
            data: {},
            players: this.currentPlayer ? [this.currentPlayer.id] : [],
            settings: { ...mode.config, ...options },
            startTime: Date.now(),
            status: 'loading'
        };
        
        this.gameContainer = container;
        
        // Launch based on type
        try {
            switch (mode.type) {
                case 'iframe':
                    await this.launchIframeGame(mode, container);
                    break;
                case 'module':
                    await this.launchModuleGame(mode, container);
                    break;
                case 'component':
                    await this.launchComponentGame(mode, container);
                    break;
                default:
                    throw new Error(`Unknown game type: ${mode.type}`);
            }
            
            this.currentGameState.status = 'active';
            this.emit('gameStarted', this.currentGameState);
            
        } catch (error) {
            this.currentGameState.status = 'error';
            this.emit('gameError', error);
            throw error;
        }
    }

    /**
     * Launch iframe-based game
     * @private
     */
    async launchIframeGame(mode, container) {
        const iframe = document.createElement('iframe');
        iframe.src = mode.url;
        iframe.style.width = mode.config.width || '100%';
        iframe.style.height = mode.config.height || '100%';
        iframe.style.border = 'none';
        
        if (mode.config.sandbox) {
            iframe.sandbox = mode.config.sandbox;
        }
        
        if (mode.config.fullscreen) {
            iframe.allowFullscreen = true;
        }
        
        // Setup communication
        const connection = {
            iframe,
            ready: false,
            messageQueue: []
        };
        
        this.gameConnections.set(mode.id, connection);
        
        // Wait for game ready
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Game load timeout'));
            }, 30000);
            
            const handleMessage = (event) => {
                if (event.source === iframe.contentWindow && event.data.type === 'gameReady') {
                    clearTimeout(timeout);
                    window.removeEventListener('message', handleMessage);
                    connection.ready = true;
                    resolve();
                }
            };
            
            window.addEventListener('message', handleMessage);
            container.appendChild(iframe);
        });
        
        // Send initial state
        this.sendToGame(mode.id, {
            type: 'initGame',
            player: this.currentPlayer,
            settings: this.currentGameState.settings
        });
        
        this.activeGame = iframe;
    }

    /**
     * Launch module-based game
     * @private
     */
    async launchModuleGame(mode, container) {
        const module = await import(mode.url);
        const GameClass = module.default || module[mode.name];
        
        if (!GameClass) {
            throw new Error(`Game module not found: ${mode.name}`);
        }
        
        const gameInstance = new GameClass(container, {
            ...mode.config,
            player: this.currentPlayer,
            manager: this
        });
        
        if (gameInstance.init) {
            await gameInstance.init();
        }
        
        this.activeGame = gameInstance;
    }

    /**
     * Launch component-based game
     * @private
     */
    async launchComponentGame(mode, container) {
        // For React/Vue/Angular components
        // Implementation depends on framework
        throw new Error('Component games not yet implemented');
    }

    /**
     * Send message to active game
     * @param {string} gameId - Game mode ID
     * @param {Object} message - Message to send
     */
    sendToGame(gameId, message) {
        const connection = this.gameConnections.get(gameId);
        if (!connection) return;
        
        if (connection.iframe) {
            if (connection.ready) {
                connection.iframe.contentWindow.postMessage(message, '*');
            } else {
                connection.messageQueue.push(message);
            }
        } else if (this.activeGame && this.activeGame.handleMessage) {
            this.activeGame.handleMessage(message);
        }
    }

    /**
     * Setup message handling from games
     * @private
     */
    setupMessageHandling() {
        window.addEventListener('message', (event) => {
            // Verify source
            let gameId = null;
            for (const [id, connection] of this.gameConnections) {
                if (connection.iframe && event.source === connection.iframe.contentWindow) {
                    gameId = id;
                    break;
                }
            }
            
            if (!gameId) return;
            
            // Handle message
            this.handleGameMessage(gameId, event.data);
        });
    }

    /**
     * Handle message from game
     * @param {string} gameId - Game mode ID
     * @param {Object} message - Message from game
     */
    handleGameMessage(gameId, message) {
        switch (message.type) {
            case 'updateState':
                this.updateGameState(message.state);
                break;
                
            case 'achievement':
                this.unlockAchievement(message.achievementId, message.data);
                break;
                
            case 'updateInventory':
                this.updatePlayerInventory(message.items);
                break;
                
            case 'saveProgress':
                this.saveGameProgress(message.saveData);
                break;
                
            case 'requestLeaderboard':
                this.sendLeaderboard(gameId, message.leaderboardId);
                break;
                
            case 'submitScore':
                this.submitScore(message.leaderboardId, message.score);
                break;
                
            default:
                // Custom handlers
                const handler = this.messageHandlers.get(message.type);
                if (handler) {
                    handler(gameId, message);
                }
        }
        
        this.emit('gameMessage', { gameId, message });
    }

    /**
     * Update game state
     * @param {Object} state - Partial state update
     */
    updateGameState(state) {
        if (this.currentGameState) {
            this.currentGameState.data = {
                ...this.currentGameState.data,
                ...state
            };
            
            if (this.options.enablePersistence) {
                this.saveState();
            }
            
            this.emit('stateUpdated', this.currentGameState);
        }
    }

    /**
     * End current game
     * @returns {Promise<void>}
     */
    async endCurrentGame() {
        if (!this.activeGame) return;
        
        this.currentGameState.status = 'ending';
        
        // Notify game
        if (this.currentGameState) {
            this.sendToGame(this.currentGameState.mode, {
                type: 'endGame'
            });
        }
        
        // Clean up based on type
        if (this.activeGame instanceof HTMLIFrameElement) {
            this.activeGame.remove();
        } else if (this.activeGame.destroy) {
            await this.activeGame.destroy();
        }
        
        // Archive game state
        if (this.currentGameState) {
            this.currentGameState.status = 'ended';
            this.currentGameState.endTime = Date.now();
            this.gameHistory.push(this.currentGameState);
            
            // Keep only last 10 games in history
            if (this.gameHistory.length > 10) {
                this.gameHistory.shift();
            }
        }
        
        // Clean up
        this.activeGame = null;
        this.currentGameState = null;
        this.gameConnections.clear();
        
        this.emit('gameEnded');
    }

    /**
     * Pause current game
     */
    pauseGame() {
        if (this.currentGameState && this.currentGameState.status === 'active') {
            this.currentGameState.status = 'paused';
            this.sendToGame(this.currentGameState.mode, {
                type: 'pauseGame'
            });
            this.emit('gamePaused');
        }
    }

    /**
     * Resume current game
     */
    resumeGame() {
        if (this.currentGameState && this.currentGameState.status === 'paused') {
            this.currentGameState.status = 'active';
            this.sendToGame(this.currentGameState.mode, {
                type: 'resumeGame'
            });
            this.emit('gameResumed');
        }
    }

    /**
     * Switch between game modes
     * @param {string} newModeId - New game mode to switch to
     * @returns {Promise<void>}
     */
    async switchGame(newModeId) {
        if (this.currentGameState) {
            // Save current state
            await this.saveGameProgress();
        }
        
        // Launch new game
        await this.launchGame(newModeId, this.gameContainer);
    }

    /**
     * Save game progress
     * @param {Object} saveData - Additional save data
     */
    async saveGameProgress(saveData = {}) {
        if (!this.currentGameState || !this.currentPlayer) return;
        
        const save = {
            gameMode: this.currentGameState.mode,
            playerId: this.currentPlayer.id,
            timestamp: Date.now(),
            gameState: this.currentGameState.data,
            customData: saveData
        };
        
        if (this.options.enablePersistence) {
            const key = `${this.options.storagePrefix}save_${this.currentGameState.mode}_${this.currentPlayer.id}`;
            localStorage.setItem(key, JSON.stringify(save));
        }
        
        this.emit('progressSaved', save);
    }

    /**
     * Load game progress
     * @param {string} gameMode - Game mode ID
     * @param {string} playerId - Player ID
     * @returns {Object|null} Saved game data
     */
    loadGameProgress(gameMode, playerId) {
        if (!this.options.enablePersistence) return null;
        
        const key = `${this.options.storagePrefix}save_${gameMode}_${playerId}`;
        const saved = localStorage.getItem(key);
        
        return saved ? JSON.parse(saved) : null;
    }

    /**
     * Update player inventory (cross-game)
     * @param {Object} items - Items to add/update
     */
    updatePlayerInventory(items) {
        if (!this.currentPlayer || !this.options.enableCrossGame) return;
        
        const inventory = this.sharedInventory.get(this.currentPlayer.id) || {};
        
        Object.entries(items).forEach(([itemId, quantity]) => {
            inventory[itemId] = (inventory[itemId] || 0) + quantity;
        });
        
        this.sharedInventory.set(this.currentPlayer.id, inventory);
        this.currentPlayer.inventory = inventory;
        
        if (this.options.enablePersistence) {
            this.savePlayerData(this.currentPlayer.id);
        }
        
        this.emit('inventoryUpdated', inventory);
    }

    /**
     * Unlock achievement
     * @param {string} achievementId - Achievement ID
     * @param {Object} data - Achievement data
     */
    unlockAchievement(achievementId, data = {}) {
        if (!this.currentPlayer || !this.options.enableCrossGame) return;
        
        const achievements = this.globalAchievements.get(this.currentPlayer.id) || new Set();
        
        if (!achievements.has(achievementId)) {
            achievements.add(achievementId);
            this.globalAchievements.set(this.currentPlayer.id, achievements);
            
            this.currentPlayer.achievements[achievementId] = {
                unlockedAt: Date.now(),
                gameMode: this.currentGameState?.mode,
                ...data
            };
            
            if (this.options.enablePersistence) {
                this.savePlayerData(this.currentPlayer.id);
            }
            
            this.emit('achievementUnlocked', {
                playerId: this.currentPlayer.id,
                achievementId,
                data
            });
        }
    }

    /**
     * Submit score to leaderboard
     * @param {string} leaderboardId - Leaderboard ID
     * @param {number} score - Score to submit
     */
    submitScore(leaderboardId, score) {
        if (!this.currentPlayer) return;
        
        let leaderboard = this.leaderboards.get(leaderboardId);
        if (!leaderboard) {
            leaderboard = [];
            this.leaderboards.set(leaderboardId, leaderboard);
        }
        
        // Add or update score
        const entry = leaderboard.find(e => e.playerId === this.currentPlayer.id);
        if (entry) {
            if (score > entry.score) {
                entry.score = score;
                entry.timestamp = Date.now();
            }
        } else {
            leaderboard.push({
                playerId: this.currentPlayer.id,
                playerName: this.currentPlayer.name,
                score,
                timestamp: Date.now()
            });
        }
        
        // Sort by score
        leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep top 100
        if (leaderboard.length > 100) {
            leaderboard.length = 100;
        }
        
        this.emit('scoreSubmitted', {
            leaderboardId,
            playerId: this.currentPlayer.id,
            score
        });
    }

    /**
     * Get leaderboard
     * @param {string} leaderboardId - Leaderboard ID
     * @returns {Array} Leaderboard entries
     */
    getLeaderboard(leaderboardId) {
        return this.leaderboards.get(leaderboardId) || [];
    }

    /**
     * Send leaderboard to game
     * @private
     */
    sendLeaderboard(gameId, leaderboardId) {
        const leaderboard = this.getLeaderboard(leaderboardId);
        this.sendToGame(gameId, {
            type: 'leaderboardData',
            leaderboardId,
            entries: leaderboard
        });
    }

    /**
     * Register custom message handler
     * @param {string} messageType - Message type to handle
     * @param {Function} handler - Handler function
     */
    registerMessageHandler(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
    }

    /**
     * Load player inventory
     * @private
     */
    loadPlayerInventory(playerId) {
        if (!this.options.enablePersistence) return {};
        
        const saved = localStorage.getItem(`${this.options.storagePrefix}inventory_${playerId}`);
        return saved ? JSON.parse(saved) : {};
    }

    /**
     * Load player achievements
     * @private
     */
    loadPlayerAchievements(playerId) {
        if (!this.options.enablePersistence) return {};
        
        const saved = localStorage.getItem(`${this.options.storagePrefix}achievements_${playerId}`);
        return saved ? JSON.parse(saved) : {};
    }

    /**
     * Load player stats
     * @private
     */
    loadPlayerStats(playerId) {
        if (!this.options.enablePersistence) return {};
        
        const saved = localStorage.getItem(`${this.options.storagePrefix}stats_${playerId}`);
        return saved ? JSON.parse(saved) : {};
    }

    /**
     * Save player data
     * @private
     */
    savePlayerData(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        localStorage.setItem(`${this.options.storagePrefix}inventory_${playerId}`, 
            JSON.stringify(player.inventory));
        localStorage.setItem(`${this.options.storagePrefix}achievements_${playerId}`, 
            JSON.stringify(player.achievements));
        localStorage.setItem(`${this.options.storagePrefix}stats_${playerId}`, 
            JSON.stringify(player.stats));
    }

    /**
     * Load persisted state
     * @private
     */
    loadPersistedState() {
        // Load leaderboards
        const savedLeaderboards = localStorage.getItem(`${this.options.storagePrefix}leaderboards`);
        if (savedLeaderboards) {
            const data = JSON.parse(savedLeaderboards);
            Object.entries(data).forEach(([id, entries]) => {
                this.leaderboards.set(id, entries);
            });
        }
    }

    /**
     * Save state
     * @private
     */
    saveState() {
        // Save leaderboards
        const leaderboardData = {};
        this.leaderboards.forEach((entries, id) => {
            leaderboardData[id] = entries;
        });
        localStorage.setItem(`${this.options.storagePrefix}leaderboards`, 
            JSON.stringify(leaderboardData));
    }

    /**
     * Generate player ID
     * @private
     */
    generatePlayerId() {
        return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get available game modes
     * @returns {Array<GameMode>} Available game modes
     */
    getGameModes() {
        return Array.from(this.gameModes.values());
    }

    /**
     * Get current game state
     * @returns {GameState|null} Current game state
     */
    getCurrentGameState() {
        return this.currentGameState;
    }

    /**
     * Get game history
     * @returns {Array<GameState>} Game history
     */
    getGameHistory() {
        return [...this.gameHistory];
    }

    /**
     * Dispose of resources
     */
    async dispose() {
        await this.endCurrentGame();
        this.removeAllListeners();
        this.gameModes.clear();
        this.players.clear();
        this.sharedInventory.clear();
        this.globalAchievements.clear();
        this.leaderboards.clear();
        this.messageHandlers.clear();
    }
}

/**
 * @exports UnifiedGameManager
 */
export default UnifiedGameManager;

/**
 * @example
 * // Initialize the game manager
 * const gameManager = new UnifiedGameManager({
 *     enablePersistence: true,
 *     enableCrossGame: true
 * });
 * 
 * // Initialize player
 * gameManager.initializePlayer({
 *     id: 'player123',
 *     name: 'John Doe',
 *     profile: { avatar: 'warrior' }
 * });
 * 
 * // Register custom game mode
 * gameManager.registerGameMode({
 *     id: 'custom-game',
 *     name: 'My Custom Game',
 *     description: 'A custom game mode',
 *     url: '/games/custom.html',
 *     type: 'iframe',
 *     config: { width: 800, height: 600 },
 *     requiresAuth: true,
 *     minPlayers: 1,
 *     maxPlayers: 4
 * });
 * 
 * // Launch a game
 * const container = document.getElementById('game-container');
 * await gameManager.launchGame('fighting-arena', container, {
 *     difficulty: 'medium'
 * });
 * 
 * // Listen for events
 * gameManager.on('achievementUnlocked', (data) => {
 *     console.log('Achievement unlocked:', data);
 * });
 * 
 * gameManager.on('gameEnded', () => {
 *     console.log('Game ended');
 * });
 * 
 * // Switch games
 * await gameManager.switchGame('pixel-empire');
 * 
 * // Clean up
 * gameManager.dispose();
 */