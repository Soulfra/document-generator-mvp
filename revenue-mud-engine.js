#!/usr/bin/env node

/**
 * 🎮💰 REVENUE MUD ENGINE
 * Terminal-based MUD with D-pad movement, Cal AI, and monetization
 * Designed for streaming, affiliate marketing, and Google Ads
 * Emacs keybindings with git wrap mechanics for developer appeal
 */

const express = require('express');
const WebSocket = require('ws');
const CalGachaRoaster = require('./cal-gacha-roaster.js');
const AsciiPixelArtEngine = require('./ascii-pixel-art-engine.js');
const RevenueMUDBossIntegration = require('./revenue-mud-boss-integration.js');

class RevenueMUDEngine {
    constructor() {
        this.app = express();
        this.port = 3030;
        this.wsServer = null;
        
        // Core systems
        this.calAI = new CalGachaRoaster();
        this.artEngine = new AsciiPixelArtEngine();
        
        // Player management
        this.players = new Map(); // sessionId -> Player
        this.rooms = new Map(); // roomId -> Room
        this.globalChat = [];
        
        // Revenue tracking
        this.revenue = {
            totalEarned: 0,
            affiliateClicks: 0,
            adViews: 0,
            streamDonations: 0,
            premiumUpgrades: 0
        };
        
        // Streaming integration
        this.streamingData = {
            viewerCount: 0,
            currentStreamer: null,
            chatCommands: new Map(),
            highlightClips: []
        };
        
        this.initializeWorld();
        this.setupServer();
        
        // Initialize boss integration after streaming layer is available
        this.bossIntegration = null;
        
        console.log('🎮 Revenue MUD Engine initializing...');
        console.log('💰 Monetization systems active');
        console.log('🎬 Streaming integration ready');
        console.log('⌨️ D-pad movement enabled');
    }
    
    initializeWorld() {
        // MUD World Map with monetization opportunities
        this.rooms.set('spawn', {
            id: 'spawn',
            name: '🏛️ The Revenue Hub',
            description: `Welcome to the most profitable MUD in existence! 
            
💰 This central hub connects all monetized areas of our world.
🎬 Streamers broadcast live from here to thousands of viewers.
📚 The Affiliate Bookshelf glows with programming knowledge.
🖥️ Emacs terminals hum with the sound of productive coding.

Cal AI roams these halls, ready to roast your life choices.`,
            exits: {
                north: 'cal_chamber',
                east: 'affiliate_shop', 
                south: 'emacs_dojo',
                west: 'streaming_studio',
                up: 'ad_tower',
                down: 'revenue_vault'
            },
            npcs: ['cal_ai'],
            items: ['welcome_mat', 'donation_jar'],
            monetization: {
                ads: ['google_banner_728x90'],
                affiliates: ['programming_books', 'mechanical_keyboards'],
                premium: ['vip_lounge_access']
            },
            commands: ['help', 'look', 'stats', 'revenue', 'stream']
        });
        
        this.rooms.set('cal_chamber', {
            id: 'cal_chamber',
            name: '🤖 Cal\'s Roasting Chamber',
            description: `ASCII flames dance on the walls of this digital chamber.
            
Cal AI sits on a throne of deprecated code, ready to judge your every move.
The air crackles with sarcasm and philosophical wisdom.
Screenshots of legendary roasts cover the walls like trophies.

Warning: Your feelings may not survive this encounter.`,
            exits: { south: 'spawn' },
            npcs: ['cal_ai_boss'],
            items: ['roast_history', 'legendary_quotes'],
            monetization: {
                ads: ['twitch_integration'],
                affiliates: ['ai_books', 'comedy_courses'],
                premium: ['cal_premium_roasts']
            }
        });
        
        this.rooms.set('affiliate_shop', {
            id: 'affiliate_shop',
            name: '🛒 The Affiliate Emporium',
            description: `Shelves upon shelves of the finest programming gear!
            
Every purchase helps fund this MUD and feeds the developers.
✨ Mechanical keyboards that sound like angels typing
📚 Books that will make you a 10x developer overnight  
🖥️ Monitors so crisp you'll see the Matrix in your code
⌨️ RGB everything because aesthetics = performance

Use 'buy' command to support the realm!`,
            exits: { west: 'spawn' },
            npcs: ['merchant_alex'],
            items: ['keyboard_samples', 'book_previews', 'monitor_demos'],
            monetization: {
                affiliates: ['keyboards', 'books', 'monitors', 'courses', 'software'],
                ads: ['amazon_showcase'],
                premium: ['exclusive_discounts']
            }
        });
        
        this.rooms.set('emacs_dojo', {
            id: 'emacs_dojo',
            name: '⌨️ The Emacs Dojo',
            description: `Ancient terminals line the walls, each running Emacs.
            
The sound of Ctrl-X Ctrl-S echoes through the chamber.
Masters practice the sacred git wrap technique here.
- Lean over with your WRONG ARM to reach distant keys
- Build finger independence through impossible key combinations
- Learn the way of the text editor that doubles as an OS

Warning: Vim users may experience sudden enlightenment.`,
            exits: { north: 'spawn' },
            npcs: ['emacs_master'],
            items: ['ancient_keyboard', 'elisp_scrolls', 'git_manual'],
            monetization: {
                affiliates: ['emacs_books', 'ergonomic_keyboards'],
                ads: ['coding_bootcamps'],
                premium: ['private_lessons']
            }
        });
        
        this.rooms.set('streaming_studio', {
            id: 'streaming_studio',
            name: '🎬 The Streaming Studio',
            description: `Professional streaming setup with multiple camera angles.
            
🔴 LIVE indicators blink ominously in the corners.
Viewers can send commands and donations in real-time.
Chat scrolls by faster than you can read.
OBS overlays show your stats to thousands of watchers.

Type 'stream start' to begin broadcasting!`,
            exits: { east: 'spawn' },
            npcs: ['stream_bot'],
            items: ['obs_setup', 'donation_alerts', 'viewer_chat'],
            monetization: {
                streaming: ['donations', 'subscriptions', 'bits'],
                ads: ['stream_sponsors'],
                affiliates: ['streaming_gear']
            }
        });
        
        // Boss battle rooms
        this.rooms.set('debug_chamber', {
            id: 'debug_chamber',
            name: '🐛 The Debug Chamber',
            description: `A dark room filled with broken code and segmentation faults.
            
Red error messages flash across cracked monitors.
Bug reports flutter through the air like deadly moths.
The ghost of unhandled exceptions haunts this place.

Boss spawn chance: HIGH - Where bugs come to multiply.`,
            exits: { 
                south: 'spawn',
                east: 'repository_core'
            },
            npcs: ['bug_exterminator'],
            items: ['debug_tools', 'error_logs'],
            loot: [],
            monetization: {
                ads: ['debugging_tools'],
                affiliates: ['debugging_books', 'monitoring_services']
            }
        });
        
        this.rooms.set('repository_core', {
            id: 'repository_core',
            name: '⚡ Repository Core',
            description: `The beating heart of version control.
            
Git branches twist and merge in impossible geometries.
Merge conflicts shimmer in the ethereal light.
The Master Branch glows with untested code.

Boss spawn chance: EXTREME - Where merge conflicts are born.`,
            exits: { 
                west: 'debug_chamber',
                north: 'terminal_nexus'
            },
            npcs: ['git_guardian'],
            items: ['merge_tools', 'commit_history'],
            loot: [],
            monetization: {
                ads: ['git_services'],
                affiliates: ['git_books', 'collaboration_tools']
            }
        });
        
        this.rooms.set('terminal_nexus', {
            id: 'terminal_nexus',
            name: '💻 Terminal Nexus',
            description: `An endless grid of terminal windows.
            
Each screen runs a different command, creating a symphony of computing.
Bash shells echo with the wisdom of ages.
The Command Line Chronicles are written here.

Boss spawn chance: MEDIUM - Where commands go to die.`,
            exits: { 
                south: 'repository_core',
                west: 'cal_shrine'
            },
            npcs: ['terminal_sage'],
            items: ['bash_scripts', 'shell_history'],
            loot: [],
            monetization: {
                ads: ['terminal_tools'],
                affiliates: ['linux_books', 'server_hosting']
            }
        });
        
        this.rooms.set('cal_shrine', {
            id: 'cal_shrine', 
            name: '🛡️ Cal\'s Shrine',
            description: `A sacred temple dedicated to the legendary Cal AI.
            
Golden roasts are engraved on marble pillars.
Offerings of deprecated code burn in eternal flames.
The altar glows with the power of infinite sass.

Boss spawn chance: MAXIMUM - Cal's true domain.`,
            exits: {
                east: 'terminal_nexus',
                south: 'cal_chamber'
            },
            npcs: ['cal_priest'],
            items: ['sacred_roasts', 'wisdom_scrolls'],
            loot: [],
            monetization: {
                ads: ['ai_courses'],
                affiliates: ['philosophy_books', 'comedy_courses']
            }
        });
        
        // Update spawn room exits to include debug chamber
        this.rooms.get('spawn').exits.northeast = 'debug_chamber';
        this.rooms.get('cal_chamber').exits.north = 'cal_shrine';
        
        // Initialize NPCs
        this.initializeNPCs();
    }
    
    initializeNPCs() {
        this.npcs = {
            cal_ai: {
                name: '🤖 Cal AI',
                description: 'The legendary roasting AI that spawns randomly like a RuneScape pet',
                personality: 'sarcastic',
                responses: this.calAI,
                spawnRate: 0.3, // 30% chance per interaction
                canRoast: true,
                affiliateProducts: ['ai_courses', 'machine_learning_books']
            },
            
            merchant_alex: {
                name: '🛒 Merchant Alex',
                description: 'Purveyor of the finest programming gear and affiliate products',
                personality: 'sales_focused',
                inventory: [
                    { name: 'Das Keyboard Ultimate', price: 169, affiliate_link: 'amzn.to/daskeyboard', commission: 15 },
                    { name: 'Clean Code by Uncle Bob', price: 32, affiliate_link: 'amzn.to/cleancode', commission: 8 },
                    { name: 'LG 4K Monitor', price: 299, affiliate_link: 'amzn.to/lg4k', commission: 45 }
                ]
            },
            
            emacs_master: {
                name: '⌨️ Master GNU',
                description: 'Ancient keeper of Emacs wisdom and git wrap techniques',
                personality: 'philosophical_teacher',
                teaches: ['emacs_basics', 'git_wrap', 'finger_independence', 'elisp_intro'],
                premiumLessons: ['advanced_macros', 'org_mode_mastery']
            }
        };
    }
    
    setupServer() {
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        // Serve the MUD interface
        this.app.get('/', (req, res) => {
            res.sendFile(__dirname + '/mud-terminal-interface.html');
        });
        
        // Revenue API endpoints
        this.app.get('/api/revenue', (req, res) => {
            res.json({
                ...this.revenue,
                playersOnline: this.players.size,
                streamingActive: !!this.streamingData.currentStreamer,
                viewerCount: this.streamingData.viewerCount
            });
        });
        
        // Affiliate tracking
        this.app.post('/api/affiliate/click', (req, res) => {
            const { product, player, affiliate_id } = req.body;
            this.revenue.affiliateClicks++;
            
            // Track for commission calculation
            console.log(`💰 Affiliate click: ${product} by ${player} (${affiliate_id})`);
            
            res.json({ success: true, message: 'Click tracked, commission pending!' });
        });
        
        // Ad view tracking  
        this.app.post('/api/ads/view', (req, res) => {
            const { ad_type, player } = req.body;
            this.revenue.adViews++;
            this.revenue.totalEarned += 0.001; // Rough estimate
            
            res.json({ success: true, earned: 0.001 });
        });
        
        // Start WebSocket server
        const server = this.app.listen(this.port, () => {
            console.log(`🎮 Revenue MUD Engine running on port ${this.port}`);
        });
        
        this.wsServer = new WebSocket.Server({ server });
        this.setupWebSocket();
    }
    
    setupWebSocket() {
        this.wsServer.on('connection', (ws) => {
            const playerId = this.generatePlayerId();
            const player = this.createPlayer(playerId, ws);
            this.players.set(playerId, player);
            
            console.log(`🎮 Player ${playerId} connected`);
            
            // Send welcome message
            this.sendToPlayer(player, {
                type: 'welcome',
                message: this.generateWelcomeMessage(),
                room: this.rooms.get('spawn'),
                revenue: this.revenue
            });
            
            // Handle player commands
            ws.on('message', (data) => {
                try {
                    const command = JSON.parse(data);
                    this.handleCommand(player, command);
                } catch (error) {
                    console.error('Command error:', error);
                }
            });
            
            ws.on('close', () => {
                this.players.delete(playerId);
                console.log(`👋 Player ${playerId} disconnected`);
            });
        });
    }
    
    createPlayer(id, ws) {
        return {
            id,
            ws,
            name: `Player_${id.slice(-4)}`,
            currentRoom: 'spawn',
            stats: {
                level: 1,
                experience: 0,
                roastsReceived: 0,
                affiliatePurchases: 0,
                streamTime: 0
            },
            inventory: ['starting_guide', 'empty_wallet'],
            achievements: [],
            preferences: {
                emacsMode: false,
                streamOverlays: true,
                calRoastLevel: 'medium'
            }
        };
    }
    
    handleCommand(player, command) {
        const { action, params } = command;
        const room = this.rooms.get(player.currentRoom);
        
        // Emit player action for boss integration
        this.emit('player_action', {
            playerId: player.id,
            action: action,
            roomId: player.currentRoom,
            params: params
        });
        
        switch (action) {
            case 'move':
                this.handleMovement(player, params.direction);
                break;
                
            case 'look':
                this.sendRoomDescription(player);
                break;
                
            case 'talk':
                this.handleNPCInteraction(player, params.npc);
                break;
                
            case 'buy':
                this.handlePurchase(player, params.item);
                break;
                
            case 'emacs':
                this.handleEmacsCommand(player, params.command);
                break;
                
            case 'stream':
                this.handleStreamingCommand(player, params.subcommand);
                break;
                
            case 'revenue':
                this.sendRevenueStats(player);
                break;
                
            case 'help':
                this.sendHelpText(player);
                break;
                
            case 'say':
                this.handleChat(player, params.message);
                break;
                
            default:
                // Check for boss integration commands
                if (this.commands && this.commands.has(action)) {
                    const handler = this.commands.get(action);
                    handler(player.id, params);
                } else {
                    this.sendToPlayer(player, {
                        type: 'error',
                        message: `Unknown command: ${action}. Type 'help' for available commands.`
                    });
                }
        }
    }
    
    handleMovement(player, direction) {
        const currentRoom = this.rooms.get(player.currentRoom);
        const nextRoomId = currentRoom.exits[direction];
        
        if (!nextRoomId) {
            this.sendToPlayer(player, {
                type: 'movement_error',
                message: `You can't go ${direction} from here. Available exits: ${Object.keys(currentRoom.exits).join(', ')}`
            });
            return;
        }
        
        const nextRoom = this.rooms.get(nextRoomId);
        player.currentRoom = nextRoomId;
        
        // Emit room entry event for boss integration
        this.emit('room_entered', player.id, nextRoomId);
        
        // Track ad views during room transitions
        if (Math.random() < 0.3) { // 30% chance of ad
            this.showTransitionAd(player);
        }
        
        this.sendToPlayer(player, {
            type: 'movement',
            message: `You move ${direction} to ${nextRoom.name}`,
            room: nextRoom
        });
        
        this.sendRoomDescription(player);
        
        // Chance for Cal AI to spawn and comment
        if (Math.random() < this.npcs.cal_ai.spawnRate) {
            setTimeout(() => {
                this.handleCalSpawn(player, nextRoom);
            }, 1000);
        }
    }
    
    async handleCalSpawn(player, room) {
        console.log('🤖 Cal AI spawning for player interaction');
        
        const spawnMessage = [
            `*Cal AI materializes from the digital ether*`,
            `🎰 RNG ACTIVATED: Cal has spawned!`,
            `*The air crackles with sarcasm as Cal appears*`
        ];
        
        this.sendToPlayer(player, {
            type: 'cal_spawn',
            message: spawnMessage[Math.floor(Math.random() * spawnMessage.length)],
            ascii: this.artEngine.generateArt('cal_response')
        });
        
        // Generate context-aware roast
        const roastContext = {
            username: player.name,
            subject: `entering ${room.name}`,
            message: `Just walked into ${room.name} like they own the place`
        };
        
        const response = await this.calAI.generateResponse(roastContext);
        
        if (response) {
            this.sendToPlayer(player, {
                type: 'cal_response',
                npc: 'Cal AI',
                message: response.text,
                ascii: response.asciiArt,
                rarity: response.rarity,
                personality: response.personality
            });
            
            player.stats.roastsReceived++;
            
            // Track for streaming highlights
            if (response.isLegendary || response.isCritical) {
                this.streamingData.highlightClips.push({
                    timestamp: Date.now(),
                    player: player.name,
                    response: response.text,
                    rarity: response.rarity
                });
            }
        }
    }
    
    handleNPCInteraction(player, npcName) {
        const room = this.rooms.get(player.currentRoom);
        const npc = this.npcs[npcName];
        
        if (!room.npcs.includes(npcName) || !npc) {
            this.sendToPlayer(player, {
                type: 'error',
                message: `There's no ${npcName} here to talk to.`
            });
            return;
        }
        
        let response = '';
        
        switch (npcName) {
            case 'merchant_alex':
                response = this.generateMerchantDialogue(player);
                break;
            case 'emacs_master':
                response = this.generateEmacsTeacherDialogue(player);
                break;
            default:
                response = `${npc.name} nods at you but seems busy.`;
        }
        
        this.sendToPlayer(player, {
            type: 'npc_interaction',
            npc: npc.name,
            message: response,
            monetization: room.monetization
        });
    }
    
    generateMerchantDialogue(player) {
        const products = this.npcs.merchant_alex.inventory;
        let dialogue = `🛒 *Merchant Alex grins widely*\n\n"Welcome to the finest programming gear emporium! Every purchase helps keep this MUD running!\n\n`;
        
        products.forEach((product, index) => {
            dialogue += `${index + 1}. ${product.name} - $${product.price} (${product.commission}% commission)\n`;
        });
        
        dialogue += `\nType 'buy <number>' to purchase, or 'buy info <number>' for details!\n`;
        dialogue += `💰 Total affiliate clicks today: ${this.revenue.affiliateClicks}`;
        
        return dialogue;
    }
    
    handlePurchase(player, itemId) {
        const merchant = this.npcs.merchant_alex;
        const item = merchant.inventory[parseInt(itemId) - 1];
        
        if (!item) {
            this.sendToPlayer(player, {
                type: 'purchase_error',
                message: 'That item doesn\'t exist! Use "talk merchant_alex" to see the catalog.'
            });
            return;
        }
        
        // Track affiliate click
        this.revenue.affiliateClicks++;
        const commission = (item.price * item.commission / 100);
        this.revenue.totalEarned += commission;
        
        this.sendToPlayer(player, {
            type: 'purchase',
            message: `🛒 Opening ${item.name} purchase page...\n💰 Commission earned: $${commission.toFixed(2)}\n🔗 Redirecting to: ${item.affiliate_link}`,
            item: item,
            commission: commission
        });
        
        player.stats.affiliatePurchases++;
        
        console.log(`💰 Purchase: ${item.name} by ${player.name} - Commission: $${commission.toFixed(2)}`);
    }
    
    handleEmacsCommand(player, command) {
        if (!player.preferences.emacsMode) {
            this.sendToPlayer(player, {
                type: 'emacs_prompt',
                message: `🔥 EMACS MODE ACTIVATION\n\nThis will enable advanced keybindings and git wrap mechanics.\nYou'll need to use your WRONG ARM to reach some keys!\n\nType 'emacs enable' to activate hardcore mode.`
            });
            return;
        }
        
        const emacsCommands = {
            'C-x C-s': () => this.savePlayerProgress(player),
            'C-x C-f': () => this.openFileBuffer(player),
            'M-x git-wrap': () => this.teachGitWrap(player),
            'C-g': () => this.cancelCommand(player)
        };
        
        if (emacsCommands[command]) {
            emacsCommands[command]();
        } else {
            this.sendToPlayer(player, {
                type: 'emacs_error',
                message: `Unknown Emacs command: ${command}\nAvailable: ${Object.keys(emacsCommands).join(', ')}`
            });
        }
    }
    
    teachGitWrap(player) {
        this.sendToPlayer(player, {
            type: 'emacs_lesson',
            message: `⌨️ GIT WRAP TECHNIQUE ACTIVATED\n\n` +
                `🎯 CHALLENGE: Use your LEFT hand to press RIGHT-side keys!\n` +
                `- Reach across your keyboard with the "wrong" arm\n` +
                `- This builds finger independence and coordination\n` +
                `- Real developers do this without thinking\n\n` +
                `Try pressing these keys with your LEFT hand:\n` +
                `P, O, I, L, ;, ', [, ]\n\n` +
                `💪 Achievement unlocked: Git Wrap Initiate!`,
            ascii: this.artEngine.generateArt('ascii_logo', { text: 'GIT WRAP' })
        });
        
        player.achievements.push('git_wrap_initiate');
    }
    
    showTransitionAd(player) {
        const ads = [
            {
                type: 'google_banner',
                message: '📺 [AD] Learn React in 30 Days! Click here for 50% off bootcamp!',
                revenue: 0.001
            },
            {
                type: 'affiliate',
                message: '🛒 [AD] Das Keyboard Ultimate - The keyboard that will change your life!',
                revenue: 0.005
            },
            {
                type: 'sponsor',
                message: '🎬 [SPONSOR] This room transition brought to you by NordVPN!',
                revenue: 0.01
            }
        ];
        
        const ad = ads[Math.floor(Math.random() * ads.length)];
        this.revenue.adViews++;
        this.revenue.totalEarned += ad.revenue;
        
        this.sendToPlayer(player, {
            type: 'advertisement',
            message: ad.message,
            revenue: ad.revenue,
            skipTime: 3000 // 3 second skip timer
        });
    }
    
    sendRoomDescription(player) {
        const room = this.rooms.get(player.currentRoom);
        const playersInRoom = Array.from(this.players.values())
            .filter(p => p.currentRoom === player.currentRoom && p.id !== player.id);
        
        let description = `\n${room.name}\n${'═'.repeat(50)}\n`;
        description += `${room.description}\n\n`;
        
        if (room.exits && Object.keys(room.exits).length > 0) {
            description += `🚪 Exits: ${Object.keys(room.exits).join(', ')}\n`;
        }
        
        if (room.npcs && room.npcs.length > 0) {
            description += `👥 NPCs: ${room.npcs.join(', ')}\n`;
        }
        
        if (playersInRoom.length > 0) {
            description += `🎮 Players: ${playersInRoom.map(p => p.name).join(', ')}\n`;
        }
        
        if (room.monetization) {
            description += `\n💰 Revenue opportunities in this room!\n`;
            if (room.monetization.affiliates) {
                description += `🛒 Shop: ${room.monetization.affiliates.join(', ')}\n`;
            }
        }
        
        this.sendToPlayer(player, {
            type: 'room_description',
            room: room,
            message: description,
            players: playersInRoom.map(p => p.name)
        });
    }
    
    sendRevenueStats(player) {
        const stats = `\n💰 REVENUE DASHBOARD\n${'═'.repeat(50)}\n` +
            `Total Earned: $${this.revenue.totalEarned.toFixed(2)}\n` +
            `Affiliate Clicks: ${this.revenue.affiliateClicks}\n` +
            `Ad Views: ${this.revenue.adViews}\n` +
            `Stream Donations: $${this.revenue.streamDonations}\n` +
            `Players Online: ${this.players.size}\n` +
            `Your Contributions: ${player.stats.affiliatePurchases} purchases, ${player.stats.roastsReceived} roasts\n\n` +
            `🎯 This MUD is funded by player interactions!\n` +
            `Every click, purchase, and ad view helps keep the servers running!`;
        
        this.sendToPlayer(player, {
            type: 'revenue_stats',
            message: stats,
            data: this.revenue
        });
    }
    
    sendHelpText(player) {
        const help = `\n🎮 REVENUE MUD COMMAND REFERENCE\n${'═'.repeat(50)}\n` +
            `MOVEMENT: move <direction> (north, south, east, west, up, down)\n` +
            `🎹 SHORTCUTS: Use arrow keys or WASD for movement!\n\n` +
            `INTERACTION:\n` +
            `- look: Examine current room\n` +
            `- talk <npc>: Speak with NPCs\n` +
            `- buy <item>: Purchase from merchants\n` +
            `- say <message>: Chat with other players\n\n` +
            `SYSTEMS:\n` +
            `- revenue: View earnings dashboard\n` +
            `- emacs <command>: Enter Emacs mode\n` +
            `- stream <action>: Streaming commands\n\n` +
            `💰 MONETIZATION:\n` +
            `- Every action generates revenue for the MUD\n` +
            `- Affiliate purchases help fund development\n` +
            `- Stream donations support the community\n\n` +
            `🎯 Special: Cal AI randomly spawns to roast players!`;
        
        this.sendToPlayer(player, {
            type: 'help',
            message: help
        });
    }
    
    sendToPlayer(player, data) {
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(data));
        }
    }
    
    generateWelcomeMessage() {
        return `\n🎮 WELCOME TO THE REVENUE MUD! 🎮\n${'═'.repeat(50)}\n` +
            `The only MUD that pays for itself through smart monetization!\n\n` +
            `🎯 Features:\n` +
            `- Cal AI roasts players randomly (like a RuneScape pet!)\n` +
            `- Affiliate marketing integrated into gameplay\n` +
            `- Streaming-optimized for content creators\n` +
            `- Emacs keybindings with git wrap mechanics\n` +
            `- Real revenue tracking and transparency\n\n` +
            `💰 Current Revenue: $${this.revenue.totalEarned.toFixed(2)}\n` +
            `🎮 Players Online: ${this.players.size}\n\n` +
            `Type 'help' to get started, or 'move north' to explore!\n` +
            `Use arrow keys or WASD for quick movement!`;
    }
    
    generatePlayerId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    
    // Helper methods for boss integration
    addCommand(commandName, handler) {
        // Add command to the MUD's command system
        if (!this.commands) this.commands = new Map();
        this.commands.set(commandName, handler);
    }
    
    broadcastToRoom(roomId, message) {
        // Send message to all players in a room
        this.players.forEach((player, playerId) => {
            if (player.currentRoom === roomId) {
                this.sendToPlayer(playerId, message);
            }
        });
    }
    
    sendToPlayer(playerId, message) {
        // Send message to specific player
        const player = this.players.get(playerId);
        if (player && player.ws && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(message));
        }
    }
    
    emit(eventName, data) {
        // Simple event emitter for integration hooks
        if (!this._events) this._events = new Map();
        const listeners = this._events.get(eventName) || [];
        listeners.forEach(listener => listener(data));
    }
    
    on(eventName, listener) {
        // Register event listener
        if (!this._events) this._events = new Map();
        if (!this._events.has(eventName)) {
            this._events.set(eventName, []);
        }
        this._events.get(eventName).push(listener);
    }
    
    async start() {
        // Initialize boss integration after server starts
        const streamLayer = this.streamingData.streamingLayer || null;
        this.bossIntegration = new RevenueMUDBossIntegration(this, streamLayer);
        
        console.log(`
🎮💰 REVENUE MUD ENGINE STARTED! 💰🎮
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Play at: http://localhost:${this.port}
📊 Revenue API: http://localhost:${this.port}/api/revenue
🎬 Streaming ready with OBS integration
⌨️ D-pad movement: Arrow keys or WASD
🤖 Cal AI roasting system active
⚔️ Boss battles with viewer participation
💰 Multi-currency economy (bits/tokens/coins/shards)

💰 MONETIZATION ACTIVE:
  • Affiliate marketing embedded in gameplay
  • Google Ads during room transitions  
  • Streaming donations and subscriptions
  • Premium features and upgrades
  • Boss battles with loot drops

🎯 UNIQUE FEATURES:
  • MUD designed specifically for streamers
  • Educational Emacs/git integration
  • Real-time revenue tracking
  • Cal AI personality system
  • Epic boss battles with multi-currency rewards
  • Developer-focused content

🎬 Perfect for streaming to developer audiences!
💰 Every player interaction generates revenue!
        `);
    }
}

module.exports = RevenueMUDEngine;

// Run if called directly
if (require.main === module) {
    const mudEngine = new RevenueMUDEngine();
    mudEngine.start().catch(console.error);
}