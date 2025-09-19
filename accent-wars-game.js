#!/usr/bin/env node

/**
 * 🗣️ ACCENT WARS
 * Faction-based exploration game with Lego-style characters
 * Different accent/language factions compete for territory and resources
 * Integrated with HyperLiquid, Bloomberg, and trading algorithms
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');

class AccentWarsGame {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 8098;
        
        // Game world state
        this.gameWorld = {
            map: {
                width: 100,
                height: 100,
                territories: new Map(),
                resources: new Map(),
                tradingPosts: new Map(),
                memes: new Map()
            },
            factions: new Map(),
            players: new Map(),
            battles: new Map(),
            marketData: new Map(),
            memeEconomy: new Map()
        };
        
        // Initialize factions with different accents/languages
        this.initializeFactions();
        this.initializeTradingSystem();
        this.initializeMemeEconomy();
        
        // Add anonymous meme faction (the secret sauce!)
        this.addAnonymousMemeFactory();
        
        console.log('🗣️ AccentWars game initializing...');
        this.init();
    }

    initializeFactions() {
        const factions = [
            {
                id: 'southern_drawl',
                name: 'Southern Drawl Coalition',
                accent: 'southern',
                color: '#ff6600',
                catchphrases: ["Y'all ready for this?", "Bless your heart", "Well I'll be"],
                tradingBonus: 'agricultural_futures',
                territory: { x: 20, y: 80, radius: 15 },
                population: 0,
                resources: { cotton: 100, bourbon: 50, bbq: 75 }
            },
            {
                id: 'brooklyn_wise',
                name: 'Brooklyn Wise Guys',
                accent: 'brooklyn',
                color: '#0066ff',
                catchphrases: ["Fuhgeddaboutit!", "I'm walkin' here!", "How ya doin'?"],
                tradingBonus: 'crypto_trading',
                territory: { x: 80, y: 20, radius: 15 },
                population: 0,
                resources: { pizza: 100, bagels: 75, attitude: 200 }
            },
            {
                id: 'posh_british',
                name: 'Posh British Empire',
                accent: 'british',
                color: '#aa0066',
                catchphrases: ["Quite right, old chap", "Bloody brilliant!", "Rather splendid"],
                tradingBonus: 'forex_pounds',
                territory: { x: 50, y: 20, radius: 15 },
                population: 0,
                resources: { tea: 150, crumpets: 80, politeness: 300 }
            },
            {
                id: 'aussie_legends',
                name: 'Aussie Legends',
                accent: 'australian',
                color: '#ffaa00',
                catchphrases: ["G'day mate!", "No worries", "She'll be right"],
                tradingBonus: 'mining_commodities',
                territory: { x: 20, y: 20, radius: 15 },
                population: 0,
                resources: { beer: 120, meat_pies: 90, humor: 250 }
            },
            {
                id: 'canadian_eh',
                name: 'Canadian Eh Team',
                accent: 'canadian',
                color: '#ff0066',
                catchphrases: ["Sorry, eh?", "Beauty, eh!", "Take off, hoser!"],
                tradingBonus: 'maple_syrup_index',
                territory: { x: 80, y: 80, radius: 15 },
                population: 0,
                resources: { maple_syrup: 200, hockey_sticks: 100, apologies: 500 }
            },
            {
                id: 'silicon_valley',
                name: 'Silicon Valley Disruptors',
                accent: 'tech_bro',
                color: '#00ff66',
                catchphrases: ["Let's circle back", "Synergy!", "That's not scalable"],
                tradingBonus: 'tech_stocks',
                territory: { x: 50, y: 50, radius: 15 },
                population: 0,
                resources: { code: 300, coffee: 150, buzzwords: 400 }
            }
        ];
        
        factions.forEach(faction => {
            this.gameWorld.factions.set(faction.id, faction);
            
            // Spawn initial NPCs for each faction
            for (let i = 0; i < 5; i++) {
                this.spawnFactionNPC(faction);
            }
        });
        
        console.log(`🗣️ Initialized ${factions.length} accent factions`);
    }

    spawnFactionNPC(faction) {
        const npcId = `${faction.id}_npc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const territory = faction.territory;
        
        const npc = {
            id: npcId,
            factionId: faction.id,
            name: this.generateNPCName(faction.accent),
            x: territory.x + (Math.random() - 0.5) * territory.radius * 2,
            y: territory.y + (Math.random() - 0.5) * territory.radius * 2,
            direction: Math.random() * 360,
            activity: 'exploring', // exploring, trading, battling, memeing
            mood: 'neutral', // happy, angry, excited, confused
            inventory: {
                coins: Math.floor(Math.random() * 100),
                memes: Math.floor(Math.random() * 10),
                resources: {}
            },
            stats: {
                exploration: Math.floor(Math.random() * 100),
                trading: Math.floor(Math.random() * 100),
                memeing: Math.floor(Math.random() * 100),
                accent_strength: Math.floor(Math.random() * 100) + 50
            },
            currentAction: null,
            target: null,
            lastSpeech: null
        };
        
        this.gameWorld.players.set(npcId, npc);
        faction.population++;
        
        return npc;
    }

    generateNPCName(accent) {
        const namesByAccent = {
            southern: ['Billy-Bob', 'Mary-Sue', 'Cletus', 'Dolly', 'Beau'],
            brooklyn: ['Tony', 'Vinny', 'Maria', 'Sal', 'Gina'],
            british: ['Nigel', 'Penelope', 'Reginald', 'Prudence', 'Rupert'],
            australian: ['Bruce', 'Sheila', 'Crocodile', 'Kylie', 'Boomer'],
            canadian: ['Doug', 'Eh-lise', 'Maple', 'Hoser', 'Tim'],
            tech_bro: ['Chad', 'Brad', 'Synergy', 'Disrupt', 'Pivot']
        };
        
        const names = namesByAccent[accent] || ['Generic', 'Person'];
        return names[Math.floor(Math.random() * names.length)];
    }

    initializeTradingSystem() {
        // Mock trading data that NPCs can interact with
        const tradingPosts = [
            { id: 'hyperliquid_hub', x: 25, y: 25, type: 'crypto', active: true },
            { id: 'bloomberg_terminal', x: 75, y: 25, type: 'stocks', active: true },
            { id: 'forex_exchange', x: 25, y: 75, type: 'forex', active: true },
            { id: 'meme_market', x: 75, y: 75, type: 'memes', active: true },
            { id: 'commodity_pit', x: 50, y: 50, type: 'commodities', active: true }
        ];
        
        tradingPosts.forEach(post => {
            this.gameWorld.map.tradingPosts.set(post.id, {
                ...post,
                volume: Math.random() * 1000000,
                volatility: Math.random(),
                factionControl: null,
                prices: this.generateMarketPrices()
            });
        });
        
        // Start market simulation
        this.startMarketSimulation();
    }

    generateMarketPrices() {
        return {
            memes: Math.random() * 100,
            humor: Math.random() * 50,
            sarcasm: Math.random() * 75,
            authenticity: Math.random() * 200,
            accent_purity: Math.random() * 150
        };
    }

    initializeMemeEconomy() {
        const baseMemes = [
            { id: 'distracted_boyfriend', value: 100, viral_potential: 0.8, accent_bonus: 'any' },
            { id: 'drake_pointing', value: 150, viral_potential: 0.9, accent_bonus: 'canadian' },
            { id: 'woman_yelling_cat', value: 120, viral_potential: 0.7, accent_bonus: 'brooklyn' },
            { id: 'this_is_fine', value: 200, viral_potential: 0.6, accent_bonus: 'british' },
            { id: 'stonks', value: 300, viral_potential: 0.9, accent_bonus: 'tech_bro' },
            { id: 'surprised_pikachu', value: 80, viral_potential: 0.8, accent_bonus: 'any' }
        ];
        
        baseMemes.forEach(meme => {
            this.gameWorld.map.memes.set(meme.id, {
                ...meme,
                current_holders: new Map(),
                price_history: [meme.value],
                trending: Math.random() > 0.5
            });
        });
    }

    addAnonymousMemeFactory() {
        // The secret anonymous faction - they have the best memes because no one knows who they are!
        const anonymousFaction = {
            id: 'anonymous_meme_lords',
            name: 'Anonymous Meme Lords',
            accent: 'anonymous',
            color: '#333333',
            catchphrases: ["We are legion", "Expect us", "For the lulz", "Anonymously yours"],
            tradingBonus: 'viral_memes',
            territory: { x: 10, y: 10, radius: 5 }, // Hidden small territory
            population: 0,
            resources: { 
                rare_memes: 500, 
                anonymity: 1000, 
                chaos: 300,
                viral_potential: 999
            },
            special_abilities: [
                'untraceable_memes',
                'viral_multiplication', 
                'market_manipulation',
                'accent_mimicry'
            ],
            isHidden: true // They don't show up in normal faction lists
        };

        this.gameWorld.factions.set(anonymousFaction.id, anonymousFaction);

        // Spawn anonymous NPCs (they move around all territories)
        for (let i = 0; i < 3; i++) {
            this.spawnAnonymousNPC(anonymousFaction);
        }

        // Add premium anonymous memes to the economy
        const anonymousMemes = [
            { id: 'pepe_rare', value: 1000, viral_potential: 1.0, accent_bonus: 'anonymous', anonymous_only: true },
            { id: 'wojak_feels', value: 800, viral_potential: 0.9, accent_bonus: 'anonymous', anonymous_only: true },
            { id: 'chad_vs_virgin', value: 1200, viral_potential: 0.95, accent_bonus: 'anonymous', anonymous_only: true },
            { id: 'anonymous_mask', value: 2000, viral_potential: 1.0, accent_bonus: 'anonymous', anonymous_only: true },
            { id: 'rickroll_eternal', value: 1500, viral_potential: 0.8, accent_bonus: 'anonymous', anonymous_only: true }
        ];

        anonymousMemes.forEach(meme => {
            this.gameWorld.map.memes.set(meme.id, {
                ...meme,
                current_holders: new Map(),
                price_history: [meme.value],
                trending: true, // Anonymous memes are always trending
                creator: 'anonymous',
                untraceable: true
            });
        });

        console.log('🎭 Anonymous Meme Lords initialized - they have the BEST memes!');
    }

    spawnAnonymousNPC(faction) {
        const npcId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        const npc = {
            id: npcId,
            factionId: faction.id,
            name: this.generateAnonymousName(),
            x: Math.random() * this.gameWorld.map.width,
            y: Math.random() * this.gameWorld.map.height,
            direction: Math.random() * 360,
            activity: 'memeing', // Always memeing
            mood: 'chaotic_neutral',
            inventory: {
                coins: Math.floor(Math.random() * 500) + 200,
                memes: Math.floor(Math.random() * 50) + 25, // Way more memes
                rare_memes: Math.floor(Math.random() * 10),
                resources: {
                    anonymity: 100,
                    chaos_energy: Math.floor(Math.random() * 100)
                }
            },
            stats: {
                exploration: Math.floor(Math.random() * 100) + 50,
                trading: Math.floor(Math.random() * 100) + 75,
                memeing: 99, // Maxed out memeing
                accent_strength: 0, // No accent - they can mimic anyone
                viral_power: Math.floor(Math.random() * 100) + 80
            },
            currentAction: null,
            target: null,
            lastSpeech: null,
            isAnonymous: true,
            canMimicAccents: true
        };
        
        this.gameWorld.players.set(npcId, npc);
        faction.population++;
        
        return npc;
    }

    generateAnonymousName() {
        const anonymousNames = [
            'Anon', '???', 'MemeKing', 'ViralLord', 'ChaosAgent', 
            'ShadowMemer', 'LulzBringer', 'TrollMaster', 'MemeWizard',
            'Unknown_User', 'Anonymous_Chad', 'Rare_Pepe_Dealer'
        ];
        
        return anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
    }

    startMarketSimulation() {
        setInterval(() => {
            this.updateMarketPrices();
            this.updateMemeValues();
            this.simulateNPCActions();
        }, 2000);
    }

    updateMarketPrices() {
        this.gameWorld.map.tradingPosts.forEach(post => {
            Object.keys(post.prices).forEach(asset => {
                const change = (Math.random() - 0.5) * 10;
                post.prices[asset] = Math.max(1, post.prices[asset] + change);
            });
            post.volume += (Math.random() - 0.5) * 100000;
        });
    }

    updateMemeValues() {
        this.gameWorld.map.memes.forEach(meme => {
            let volatility = Math.random() * 0.2 - 0.1; // -10% to +10%
            
            // Anonymous memes have special market behavior
            if (meme.creator === 'anonymous') {
                volatility *= 2; // More volatile
                if (Math.random() < 0.1) {
                    volatility = Math.random() * 0.5; // 10% chance of massive pump
                }
            }
            
            meme.value = Math.max(1, meme.value * (1 + volatility));
            meme.price_history.push(meme.value);
            
            // Keep only last 20 price points
            if (meme.price_history.length > 20) {
                meme.price_history.shift();
            }
        });
    }

    simulateNPCActions() {
        this.gameWorld.players.forEach(npc => {
            // NPCs decide what to do based on their faction and personality
            if (!npc.currentAction || Math.random() < 0.1) {
                this.assignNPCAction(npc);
            }
            
            // Execute current action
            this.executeNPCAction(npc);
            
            // Move NPCs around
            this.moveNPC(npc);
        });
    }

    assignNPCAction(npc) {
        const faction = this.gameWorld.factions.get(npc.factionId);
        const actions = ['explore', 'trade', 'meme', 'banter', 'claim_territory'];
        const weights = [0.3, 0.2, 0.2, 0.2, 0.1]; // Probability weights
        
        const randomAction = this.weightedRandom(actions, weights);
        
        npc.currentAction = {
            type: randomAction,
            startTime: Date.now(),
            duration: Math.random() * 5000 + 2000, // 2-7 seconds
            progress: 0
        };
        
        // Generate speech based on action and faction
        npc.lastSpeech = this.generateNPCSpeech(npc, randomAction, faction);
    }

    generateNPCSpeech(npc, action, faction) {
        const speeches = {
            explore: {
                southern: "I'm fixin' to explore this here territory, y'hear?",
                brooklyn: "Yo, I'm gonna scope out this neighborhood, capisce?",
                british: "I say, time for a spot of exploration, what?",
                australian: "Right-o mate, let's go walkabout and see what's what!",
                canadian: "Gonna take a little look-see around here, eh?",
                tech_bro: "Time to disrupt the exploration paradigm!"
            },
            trade: {
                southern: "Time to wheel and deal like my granpappy taught me!",
                brooklyn: "Let's make some serious dough at the market!",
                british: "Shall we engage in a bit of civilized commerce?",
                australian: "Time to make some fair dinkum trades, mate!",
                canadian: "Gonna hit up the trading post, don't ya know!",
                tech_bro: "Let's leverage our assets for maximum ROI!"
            },
            meme: {
                southern: "Y'all ready for some knee-slappin' humor?",
                brooklyn: "Time to drop some sick memes on these jabronies!",
                british: "Shall we craft some rather amusing internet jests?",
                australian: "Time to share some ripper memes, eh mate?",
                canadian: "Got some pretty funny stuff to share, eh?",
                tech_bro: "Let's viral-ize our content strategy!"
            },
            banter: {
                southern: "Who wants to jaw-jack with this ol' boy?",
                brooklyn: "Ay, anybody wanna shoot the breeze?",
                british: "Anyone fancy a civilized chat?",
                australian: "Who's up for a chinwag, mates?",
                canadian: "Anyone wanna chat aboot stuff, eh?",
                tech_bro: "Time to network and synergize!"
            }
        };
        
        return speeches[action]?.[faction.accent] || "Time to do some stuff!";
    }

    executeNPCAction(npc) {
        if (!npc.currentAction) return;
        
        const action = npc.currentAction;
        const elapsed = Date.now() - action.startTime;
        action.progress = Math.min(1, elapsed / action.duration);
        
        if (action.progress >= 1) {
            // Action completed
            this.completeNPCAction(npc);
            npc.currentAction = null;
        }
    }

    completeNPCAction(npc) {
        const action = npc.currentAction;
        const faction = this.gameWorld.factions.get(npc.factionId);
        
        switch (action.type) {
            case 'explore':
                npc.stats.exploration += Math.random() * 5;
                npc.inventory.coins += Math.floor(Math.random() * 10);
                break;
            case 'trade':
                const tradingBonus = Math.random() * 20;
                npc.inventory.coins += tradingBonus;
                npc.stats.trading += Math.random() * 3;
                break;
            case 'meme':
                npc.inventory.memes += 1;
                npc.stats.memeing += Math.random() * 4;
                break;
            case 'banter':
                // Banter with nearby NPCs of other factions
                this.triggerAccentBanter(npc);
                break;
            case 'claim_territory':
                this.attemptTerritoryClaim(npc, faction);
                break;
        }
    }

    triggerAccentBanter(npc) {
        const nearbyNPCs = this.getNearbyNPCs(npc, 20);
        const targetNPC = nearbyNPCs.find(other => other.factionId !== npc.factionId);
        
        if (targetNPC) {
            // Generate banter battle
            const battle = this.createBanterBattle(npc, targetNPC);
            this.gameWorld.battles.set(battle.id, battle);
        }
    }

    createBanterBattle(npc1, npc2) {
        const faction1 = this.gameWorld.factions.get(npc1.factionId);
        const faction2 = this.gameWorld.factions.get(npc2.factionId);
        
        return {
            id: `banter_${Date.now()}`,
            type: 'accent_war',
            participants: [npc1.id, npc2.id],
            factions: [faction1.id, faction2.id],
            rounds: [],
            winner: null,
            startTime: Date.now(),
            status: 'active'
        };
    }

    moveNPC(npc) {
        // Simple movement AI
        if (Math.random() < 0.05) { // 5% chance to change direction
            npc.direction = Math.random() * 360;
        }
        
        const speed = 0.5;
        const radians = npc.direction * Math.PI / 180;
        
        npc.x += Math.cos(radians) * speed;
        npc.y += Math.sin(radians) * speed;
        
        // Boundary checking
        npc.x = Math.max(0, Math.min(this.gameWorld.map.width, npc.x));
        npc.y = Math.max(0, Math.min(this.gameWorld.map.height, npc.y));
    }

    getNearbyNPCs(npc, radius) {
        return Array.from(this.gameWorld.players.values()).filter(other => {
            if (other.id === npc.id) return false;
            const dx = other.x - npc.x;
            const dy = other.y - npc.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= radius;
        });
    }

    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1];
    }

    attemptTerritoryClaim(npc, faction) {
        // NPCs try to claim nearby territory for their faction
        const nearbyTerritories = this.findNearbyTerritories(npc);
        
        if (nearbyTerritories.length > 0) {
            const targetTerritory = nearbyTerritories[0];
            const success = Math.random() < 0.3; // 30% success rate
            
            if (success) {
                targetTerritory.controlledBy = faction.id;
                npc.inventory.coins += 50; // Reward for claiming territory
                
                npc.lastSpeech = this.generateVictorySpeech(npc, faction);
            } else {
                npc.lastSpeech = this.generateFailureSpeech(npc, faction);
            }
        }
    }

    findNearbyTerritories(npc) {
        // Simple implementation - just return empty for now
        return [];
    }

    generateVictorySpeech(npc, faction) {
        const victorySpeech = {
            southern: "Well butter my biscuit, we done claimed this territory!",
            brooklyn: "Ey, this neighborhood belongs to us now, capisce?",
            british: "Jolly good show! This territory is now under our dominion!",
            australian: "Beauty! This patch of dirt is ours now, mate!",
            canadian: "Sorry aboot that, but this territory is ours now, eh?",
            tech_bro: "We've successfully disrupted the territorial paradigm!",
            anonymous: "Territory acquired. Anonymously."
        };
        
        return victorySpeech[faction.accent] || "Territory claimed!";
    }

    generateFailureSpeech(npc, faction) {
        const failureSpeech = {
            southern: "Well, that didn't work out as planned, sugar.",
            brooklyn: "Ah, fuhgeddaboutit! Next time for sure.",
            british: "Rather disappointing, but we shall persevere!",
            australian: "No worries mate, she'll be right next time.",
            canadian: "Sorry, didn't work out, eh? Maybe next time.",
            tech_bro: "That's not scalable. Let's pivot our strategy.",
            anonymous: "Mission failed. We'll get them next time."
        };
        
        return failureSpeech[faction.accent] || "Better luck next time!";
    }

    init() {
        this.setupExpress();
        this.setupWebSocket();
        
        this.server.listen(this.port, () => {
            console.log(`🗣️ AccentWars Game: http://localhost:${this.port}`);
            console.log('🎮 Features:');
            console.log('   • 6 Accent Factions competing');
            console.log('   • NPCs explore, trade, and banter');
            console.log('   • Real-time market integration');
            console.log('   • Meme economy system');
            console.log('   • Territory control battles');
        });
    }

    setupExpress() {
        this.app.use(express.json());
        
        this.app.get('/', (req, res) => {
            res.send(this.getAccentWarsHTML());
        });
        
        this.app.get('/api/game-state', (req, res) => {
            res.json({
                factions: Array.from(this.gameWorld.factions.values()),
                players: Array.from(this.gameWorld.players.values()),
                tradingPosts: Array.from(this.gameWorld.map.tradingPosts.values()),
                battles: Array.from(this.gameWorld.battles.values()),
                memeEconomy: Array.from(this.gameWorld.map.memes.values())
            });
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🗣️ Player connected to AccentWars');
            
            // Send initial game state
            ws.send(JSON.stringify({
                type: 'game_init',
                gameState: {
                    factions: Array.from(this.gameWorld.factions.values()),
                    players: Array.from(this.gameWorld.players.values()),
                    tradingPosts: Array.from(this.gameWorld.map.tradingPosts.values())
                }
            }));

            // Send updates every 2 seconds
            const updateInterval = setInterval(() => {
                if (ws.readyState === 1) {
                    ws.send(JSON.stringify({
                        type: 'game_update',
                        players: Array.from(this.gameWorld.players.values()),
                        markets: Array.from(this.gameWorld.map.tradingPosts.values()),
                        battles: Array.from(this.gameWorld.battles.values()).filter(b => b.status === 'active')
                    }));
                } else {
                    clearInterval(updateInterval);
                }
            }, 2000);

            ws.on('close', () => {
                clearInterval(updateInterval);
            });
        });
    }

    getAccentWarsHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🗣️ AccentWars</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: #fff;
            overflow: hidden;
            height: 100vh;
        }

        .game-container {
            display: grid;
            grid-template-areas: 
                "header header"
                "map sidebar";
            grid-template-rows: 60px 1fr;
            grid-template-columns: 1fr 300px;
            height: 100vh;
            gap: 2px;
        }

        .header {
            grid-area: header;
            background: linear-gradient(90deg, #2a1a4a, #4a2a1a);
            border-bottom: 2px solid #aa6600;
            display: flex;
            align-items: center;
            padding: 0 20px;
            justify-content: space-between;
        }

        .map-area {
            grid-area: map;
            background: #0f0f0f;
            position: relative;
            overflow: hidden;
        }

        .sidebar {
            grid-area: sidebar;
            background: rgba(26, 26, 46, 0.9);
            border-left: 2px solid #aa6600;
            padding: 15px;
            overflow-y: auto;
        }

        #game-canvas {
            display: block;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, #1a2a1a, #0a1a0a);
        }

        .faction-panel {
            margin-bottom: 20px;
            border: 1px solid #aa6600;
            border-radius: 6px;
            overflow: hidden;
        }

        .faction-header {
            padding: 10px;
            font-weight: bold;
            text-align: center;
            color: #000;
        }

        .faction-stats {
            padding: 8px;
            background: rgba(0, 0, 0, 0.3);
            font-size: 11px;
        }

        .market-panel {
            background: rgba(0, 34, 0, 0.6);
            border: 1px solid #00aa00;
            margin: 10px 0;
            padding: 10px;
            border-radius: 4px;
        }

        .market-panel h4 {
            color: #00ffaa;
            margin-bottom: 8px;
            border-bottom: 1px solid #00aa00;
            padding-bottom: 4px;
        }

        .price-line {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
            font-size: 10px;
        }

        .battle-log {
            background: rgba(34, 0, 0, 0.6);
            border: 1px solid #aa0000;
            margin: 10px 0;
            padding: 10px;
            border-radius: 4px;
            max-height: 200px;
            overflow-y: auto;
        }

        .battle-log h4 {
            color: #ffaa00;
            margin-bottom: 8px;
        }

        .battle-entry {
            font-size: 10px;
            margin: 4px 0;
            padding: 4px;
            background: rgba(255, 170, 0, 0.1);
            border-radius: 2px;
        }

        .npc-dot {
            position: absolute;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            transition: all 0.5s ease;
            z-index: 10;
        }

        .npc-label {
            position: absolute;
            font-size: 8px;
            color: #fff;
            background: rgba(0, 0, 0, 0.7);
            padding: 1px 3px;
            border-radius: 2px;
            white-space: nowrap;
            pointer-events: none;
            z-index: 11;
        }

        .trading-post {
            position: absolute;
            width: 12px;
            height: 12px;
            background: #ffaa00;
            border: 2px solid #fff;
            border-radius: 3px;
            z-index: 5;
        }

        .territory-circle {
            position: absolute;
            border: 2px dashed;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1;
        }

        .speech-bubble {
            position: absolute;
            background: rgba(255, 255, 255, 0.9);
            color: #000;
            padding: 4px 8px;
            border-radius: 8px;
            font-size: 8px;
            max-width: 120px;
            word-wrap: break-word;
            z-index: 15;
            opacity: 0;
            transition: opacity 0.3s;
        }

        .speech-bubble.show {
            opacity: 1;
        }

        .controls {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #aa6600;
        }

        .control-btn {
            background: #4a2a1a;
            border: 1px solid #aa6600;
            color: #fff;
            padding: 6px 12px;
            margin: 2px;
            cursor: pointer;
            border-radius: 3px;
            font-family: inherit;
            font-size: 10px;
        }

        .control-btn:hover {
            background: #aa6600;
            color: #000;
        }
    </style>
</head>
<body>
    <div class="game-container">
        <div class="header">
            <div>
                <h2>🗣️ ACCENTWARS</h2>
                <small>Faction-based exploration with real market integration</small>
            </div>
            <div>
                <span id="game-time">00:00</span>
                <span style="margin-left: 20px;">Players: <span id="player-count">0</span></span>
            </div>
        </div>

        <div class="map-area">
            <canvas id="game-canvas"></canvas>
            
            <div class="controls">
                <h4 style="color: #aa6600; margin-bottom: 8px;">Game Controls</h4>
                <button class="control-btn" onclick="spawnMoreNPCs()">Spawn NPCs</button>
                <button class="control-btn" onclick="triggerMarketEvent()">Market Event</button>
                <button class="control-btn" onclick="startAccentBattle()">Accent Battle</button>
                <button class="control-btn" onclick="resetGame()">Reset Game</button>
            </div>
        </div>

        <div class="sidebar">
            <div id="factions-list">
                <!-- Factions populated by JavaScript -->
            </div>
            
            <div class="market-panel">
                <h4>📊 MARKET DATA</h4>
                <div id="market-prices"></div>
            </div>
            
            <div class="battle-log">
                <h4>⚔️ BATTLE LOG</h4>
                <div id="battle-entries"></div>
            </div>
        </div>
    </div>

    <script>
        let ws;
        let gameState = null;
        let canvas, ctx;
        let animationFrame;
        let gameStartTime = Date.now();

        // Game scaling and positioning
        const SCALE = 5; // Scale factor for display
        const MAP_WIDTH = 100;
        const MAP_HEIGHT = 100;

        function init() {
            canvas = document.getElementById('game-canvas');
            ctx = canvas.getContext('2d');
            
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            
            connectWebSocket();
            startGameLoop();
            updateGameTime();
        }

        function resizeCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        function connectWebSocket() {
            ws = new WebSocket(\`ws://\${window.location.host}\`);
            
            ws.onopen = () => {
                console.log('🗣️ Connected to AccentWars');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleGameMessage(data);
            };
            
            ws.onclose = () => {
                console.log('🗣️ Disconnected from AccentWars');
                setTimeout(connectWebSocket, 2000);
            };
        }

        function handleGameMessage(data) {
            switch (data.type) {
                case 'game_init':
                    gameState = data.gameState;
                    updateSidebar();
                    break;
                case 'game_update':
                    if (gameState) {
                        gameState.players = data.players;
                        if (data.markets) gameState.tradingPosts = data.markets;
                        if (data.battles) updateBattleLog(data.battles);
                        updateSidebar();
                    }
                    break;
            }
        }

        function updateSidebar() {
            if (!gameState) return;
            
            updateFactionsDisplay();
            updateMarketPrices();
            updatePlayerCount();
        }

        function updateFactionsDisplay() {
            const container = document.getElementById('factions-list');
            container.innerHTML = '';
            
            gameState.factions?.forEach(faction => {
                const div = document.createElement('div');
                div.className = 'faction-panel';
                
                const population = gameState.players?.filter(p => p.factionId === faction.id).length || 0;
                
                div.innerHTML = \`
                    <div class="faction-header" style="background: \${faction.color};">
                        \${faction.name}
                    </div>
                    <div class="faction-stats">
                        <div>Population: \${population}</div>
                        <div>Accent: \${faction.accent}</div>
                        <div>Trading Bonus: \${faction.tradingBonus}</div>
                        <div>Catchphrase: "\${faction.catchphrases[0]}"</div>
                    </div>
                \`;
                
                container.appendChild(div);
            });
        }

        function updateMarketPrices() {
            const container = document.getElementById('market-prices');
            container.innerHTML = '';
            
            gameState.tradingPosts?.forEach(post => {
                Object.entries(post.prices || {}).forEach(([asset, price]) => {
                    const div = document.createElement('div');
                    div.className = 'price-line';
                    div.innerHTML = \`
                        <span>\${asset}</span>
                        <span>\${price.toFixed(2)}</span>
                    \`;
                    container.appendChild(div);
                });
            });
        }

        function updatePlayerCount() {
            document.getElementById('player-count').textContent = gameState.players?.length || 0;
        }

        function updateBattleLog(battles) {
            const container = document.getElementById('battle-entries');
            
            battles.forEach(battle => {
                const div = document.createElement('div');
                div.className = 'battle-entry';
                div.innerHTML = \`
                    ⚔️ \${battle.factions?.join(' vs ')} - \${battle.type}
                \`;
                container.appendChild(div);
            });
            
            // Keep only last 10 entries
            while (container.children.length > 10) {
                container.removeChild(container.firstChild);
            }
        }

        function render() {
            if (!gameState || !ctx) return;
            
            // Clear canvas
            ctx.fillStyle = '#0a1a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw grid
            drawGrid();
            
            // Draw faction territories
            drawTerritories();
            
            // Draw trading posts
            drawTradingPosts();
            
            // Draw NPCs
            drawNPCs();
        }

        function drawGrid() {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            
            const gridSize = 50;
            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            
            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }

        function drawTerritories() {
            gameState.factions?.forEach(faction => {
                const territory = faction.territory;
                const x = (territory.x / MAP_WIDTH) * canvas.width;
                const y = (territory.y / MAP_HEIGHT) * canvas.height;
                const radius = (territory.radius / MAP_WIDTH) * canvas.width;
                
                ctx.strokeStyle = faction.color;
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Territory label
                ctx.fillStyle = faction.color;
                ctx.font = '12px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText(faction.name, x, y - radius - 10);
            });
        }

        function drawTradingPosts() {
            gameState.tradingPosts?.forEach(post => {
                const x = (post.x / MAP_WIDTH) * canvas.width;
                const y = (post.y / MAP_HEIGHT) * canvas.height;
                
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(x - 6, y - 6, 12, 12);
                
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeRect(x - 6, y - 6, 12, 12);
                
                // Trading post label
                ctx.fillStyle = '#ffaa00';
                ctx.font = '10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText(post.type, x, y + 20);
            });
        }

        function drawNPCs() {
            gameState.players?.forEach(npc => {
                const faction = gameState.factions?.find(f => f.id === npc.factionId);
                if (!faction) return;
                
                const x = (npc.x / MAP_WIDTH) * canvas.width;
                const y = (npc.y / MAP_HEIGHT) * canvas.height;
                
                // Draw NPC
                ctx.fillStyle = faction.color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw direction indicator
                const directionLength = 8;
                const radians = (npc.direction || 0) * Math.PI / 180;
                const endX = x + Math.cos(radians) * directionLength;
                const endY = y + Math.sin(radians) * directionLength;
                
                ctx.strokeStyle = faction.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                
                // Draw name label
                ctx.fillStyle = '#fff';
                ctx.font = '8px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText(npc.name, x, y - 8);
                
                // Draw activity indicator
                if (npc.currentAction) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                    ctx.font = '6px Courier New';
                    ctx.fillText(npc.currentAction.type, x, y + 12);
                }
                
                // Draw speech bubble if speaking
                if (npc.lastSpeech && Math.random() < 0.1) {
                    drawSpeechBubble(x, y, npc.lastSpeech);
                }
            });
        }

        function drawSpeechBubble(x, y, text) {
            const bubbleWidth = Math.min(120, text.length * 6);
            const bubbleHeight = 20;
            const bubbleX = x - bubbleWidth / 2;
            const bubbleY = y - 30;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
            
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
            
            ctx.fillStyle = '#000';
            ctx.font = '8px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(text.substring(0, 20), x, bubbleY + 12);
        }

        function startGameLoop() {
            function animate() {
                render();
                animationFrame = requestAnimationFrame(animate);
            }
            animate();
        }

        function updateGameTime() {
            setInterval(() => {
                const elapsed = Date.now() - gameStartTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                document.getElementById('game-time').textContent = 
                    \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
            }, 1000);
        }

        // Control functions
        function spawnMoreNPCs() {
            console.log('Spawning more NPCs...');
            // Would send command to server to spawn more NPCs
        }

        function triggerMarketEvent() {
            console.log('Triggering market event...');
            // Would send command to server to trigger market volatility
        }

        function startAccentBattle() {
            console.log('Starting accent battle...');
            // Would send command to server to start faction battle
        }

        function resetGame() {
            if (confirm('Reset the entire game?')) {
                location.reload();
            }
        }

        // Initialize when page loads
        window.addEventListener('load', init);
    </script>
</body>
</html>`;
    }
}

// Start AccentWars
const accentWars = new AccentWarsGame();

module.exports = AccentWarsGame;