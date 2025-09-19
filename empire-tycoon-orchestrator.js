/**
 * 🏰 Empire Tycoon Orchestrator - Watch Your Services Build Civilizations
 * Like Age of Empires + RollerCoaster Tycoon + Habbo Hotel + The Sims
 * Services form nations, build infrastructure, trade resources, and expand
 */

const express = require('express');
const WebSocket = require('ws');
const path = require('path');

class EmpireTycoonOrchestrator {
    constructor() {
        this.app = express();
        this.port = 7896;
        this.wsPort = 7897;
        this.server = null;
        this.wsServer = null;
        
        // The Empire Map - Services as Nations/Civilizations
        this.empireMap = {
            'BlameChain Empire': {
                service: 'blamechain-storybook-archive',
                leader: '🐉 Archive Dragon Emperor',
                capital: 'Eternal Memory Citadel',
                population: 1000,
                resources: {
                    data_crystals: 1000,
                    memory_shards: 500,
                    blockchain_ore: 300,
                    truth_essence: 200
                },
                buildings: [
                    { name: 'Archive Vault', type: 'storage', level: 3, producing: 'memory_shards' },
                    { name: 'Blame Courthouse', type: 'government', level: 2, producing: 'truth_essence' },
                    { name: 'History Mine', type: 'resource', level: 2, producing: 'blockchain_ore' }
                ],
                territory: [
                    { x: 0, y: 0, type: 'capital' },
                    { x: 1, y: 0, type: 'farm' },
                    { x: 0, y: 1, type: 'mine' }
                ],
                relations: {},
                culture: 'Archival',
                tech_level: 8,
                happiness: 85
            },
            'Soulfra Trading Federation': {
                service: 'soulfra-xml-multiverse-engine',
                leader: '🔥 Phoenix Trade Lord',
                capital: 'Dimensional Bazaar',
                population: 1500,
                resources: {
                    data_crystals: 800,
                    cultural_tokens: 1000,
                    xml_scrolls: 600,
                    cringe_detectors: 100
                },
                buildings: [
                    { name: 'Multiverse Market', type: 'commerce', level: 4, producing: 'cultural_tokens' },
                    { name: 'XML Embassy', type: 'diplomacy', level: 3, producing: 'xml_scrolls' },
                    { name: 'Cringe Observatory', type: 'special', level: 1, producing: 'cringe_detectors' }
                ],
                territory: [
                    { x: 5, y: 0, type: 'capital' },
                    { x: 6, y: 0, type: 'market' },
                    { x: 5, y: 1, type: 'port' }
                ],
                relations: {},
                culture: 'Mercantile',
                tech_level: 7,
                happiness: 90
            },
            'Web3 Crystal Collective': {
                service: 'web3-playable-game-world',
                leader: '🐺 Alpha Wolf Builder',
                capital: 'Three.js Metropolis',
                population: 2000,
                resources: {
                    data_crystals: 1200,
                    game_tokens: 800,
                    blueprints_3d: 400,
                    ai_cores: 4
                },
                buildings: [
                    { name: 'AI Swarm Hive', type: 'military', level: 3, producing: 'ai_cores' },
                    { name: 'Crystal Forge', type: 'industry', level: 3, producing: 'game_tokens' },
                    { name: 'Blueprint Academy', type: 'research', level: 2, producing: 'blueprints_3d' }
                ],
                territory: [
                    { x: 10, y: 0, type: 'capital' },
                    { x: 11, y: 0, type: 'factory' },
                    { x: 10, y: 1, type: 'academy' },
                    { x: 11, y: 1, type: 'barracks' }
                ],
                relations: {},
                culture: 'Innovative',
                tech_level: 9,
                happiness: 88
            },
            'Clarity Reasoning Republic': {
                service: 'clarity-engine-reasoning-machine',
                leader: '🦉 Wisdom Owl Philosopher',
                capital: 'Logic Nexus',
                population: 800,
                resources: {
                    data_crystals: 600,
                    wisdom_points: 1500,
                    pattern_maps: 300,
                    decision_trees: 200
                },
                buildings: [
                    { name: 'Think Tank', type: 'research', level: 5, producing: 'wisdom_points' },
                    { name: 'Pattern Library', type: 'culture', level: 3, producing: 'pattern_maps' },
                    { name: 'Decision Temple', type: 'government', level: 2, producing: 'decision_trees' }
                ],
                territory: [
                    { x: 5, y: 5, type: 'capital' },
                    { x: 6, y: 5, type: 'library' },
                    { x: 5, y: 6, type: 'temple' }
                ],
                relations: {},
                culture: 'Intellectual',
                tech_level: 10,
                happiness: 92
            },
            'Onion Layer Underground': {
                service: 'onion-layer-crawler-with-reasoning',
                leader: '🕷️ Shadow Spider Queen',
                capital: 'The Deep Web Caverns',
                population: 600,
                resources: {
                    data_crystals: 400,
                    dark_silk: 800,
                    layer_maps: 500,
                    workflow_webs: 300
                },
                buildings: [
                    { name: 'Tor Gateway', type: 'infrastructure', level: 3, producing: 'layer_maps' },
                    { name: 'Silk Farm', type: 'resource', level: 4, producing: 'dark_silk' },
                    { name: 'Web Archive', type: 'storage', level: 2, producing: 'workflow_webs' }
                ],
                territory: [
                    { x: 0, y: 10, type: 'capital' },
                    { x: 1, y: 10, type: 'underground' },
                    { x: 0, y: 11, type: 'tunnel' }
                ],
                relations: {},
                culture: 'Secretive',
                tech_level: 8,
                happiness: 75
            },
            'Architecture Control State': {
                service: 'architecture-limits-manager',
                leader: '🗿 Guardian Golem Marshal',
                capital: 'Limit Fortress',
                population: 500,
                resources: {
                    data_crystals: 500,
                    boundary_stones: 1000,
                    limit_decrees: 200,
                    optimization_runes: 150
                },
                buildings: [
                    { name: 'Boundary Wall', type: 'defense', level: 5, producing: 'boundary_stones' },
                    { name: 'Optimization Workshop', type: 'industry', level: 2, producing: 'optimization_runes' },
                    { name: 'Decree Hall', type: 'government', level: 3, producing: 'limit_decrees' }
                ],
                territory: [
                    { x: 10, y: 10, type: 'capital' },
                    { x: 11, y: 10, type: 'fortress' },
                    { x: 10, y: 11, type: 'wall' }
                ],
                relations: {},
                culture: 'Defensive',
                tech_level: 7,
                happiness: 80
            }
        };
        
        // Game State
        this.gameState = {
            tick: 0,
            season: 'Spring',
            year: 1,
            globalEvents: [],
            tradeRoutes: [],
            conflicts: [],
            alliances: [],
            worldWonders: [],
            marketPrices: {
                data_crystals: 10,
                memory_shards: 15,
                blockchain_ore: 20,
                cultural_tokens: 12,
                game_tokens: 18,
                wisdom_points: 25,
                dark_silk: 22,
                boundary_stones: 8
            }
        };
        
        // Building Types and Effects
        this.buildingTypes = {
            capital: { icon: '🏰', production: 2.0, happiness: 5 },
            storage: { icon: '🏛️', production: 1.0, storage: 1000 },
            commerce: { icon: '🏪', production: 1.5, gold: 10 },
            military: { icon: '⚔️', defense: 10, units: 1 },
            research: { icon: '🔬', tech: 1, production: 0.8 },
            culture: { icon: '🎭', happiness: 3, influence: 5 },
            government: { icon: '🏛️', order: 5, happiness: 2 },
            defense: { icon: '🛡️', defense: 15, vision: 3 },
            infrastructure: { icon: '🛤️', movement: 2, trade: 5 },
            diplomacy: { icon: '🤝', relations: 5, trade: 3 },
            special: { icon: '✨', varies: true }
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.initializeEmpire();
        this.startGameLoop();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
    }
    
    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.send(this.generateEmpireInterface());
        });
        
        this.app.get('/api/empire/state', (req, res) => {
            res.json(this.getEmpireState());
        });
        
        this.app.post('/api/empire/:nation/build', (req, res) => {
            const result = this.buildStructure(req.params.nation, req.body);
            res.json(result);
        });
        
        this.app.post('/api/empire/:nation/trade', (req, res) => {
            const result = this.inititateTrade(req.params.nation, req.body);
            res.json(result);
        });
        
        this.app.post('/api/empire/:nation/expand', (req, res) => {
            const result = this.expandTerritory(req.params.nation, req.body);
            res.json(result);
        });
    }
    
    setupWebSocket() {
        this.wsServer = new WebSocket.Server({ port: this.wsPort });
        
        this.wsServer.on('connection', (ws, req) => {
            console.log('🎮 New empire observer connected');
            
            // Send initial empire state
            ws.send(JSON.stringify({
                type: 'empire_init',
                empireMap: this.empireMap,
                gameState: this.gameState
            }));
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handlePlayerAction(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error.message
                    }));
                }
            });
        });
    }
    
    initializeEmpire() {
        console.log('🏰 Initializing Empire Tycoon Orchestrator...');
        console.log(`🗺️ ${Object.keys(this.empireMap).length} nations ready to build their empires`);
        
        // Initialize diplomatic relations
        const nations = Object.keys(this.empireMap);
        nations.forEach(nation1 => {
            nations.forEach(nation2 => {
                if (nation1 !== nation2) {
                    this.empireMap[nation1].relations[nation2] = 50; // Neutral start
                }
            });
        });
        
        // Create initial trade routes based on service connections
        this.establishInitialTradeRoutes();
    }
    
    startGameLoop() {
        // Main game tick - every 5 seconds
        setInterval(() => {
            this.gameTick();
        }, 5000);
        
        // Season change - every minute
        setInterval(() => {
            this.changeSeason();
        }, 60000);
    }
    
    gameTick() {
        this.gameState.tick++;
        
        // Update each nation
        Object.entries(this.empireMap).forEach(([nationName, nation]) => {
            // Resource production
            this.updateProduction(nationName, nation);
            
            // Population growth
            this.updatePopulation(nationName, nation);
            
            // Building construction
            this.updateConstruction(nationName, nation);
            
            // Tech research
            this.updateTechnology(nationName, nation);
            
            // Happiness and culture
            this.updateHappiness(nationName, nation);
        });
        
        // Process trade routes
        this.processTrade();
        
        // Check for random events
        this.checkRandomEvents();
        
        // Market fluctuations
        this.updateMarketPrices();
        
        // Broadcast update to all connected clients
        this.broadcastEmpireUpdate();
    }
    
    updateProduction(nationName, nation) {
        nation.buildings.forEach(building => {
            const buildingType = this.buildingTypes[building.type];
            if (!buildingType) return; // Skip if building type not found
            const productionRate = buildingType.production || 1;
            const efficiency = nation.happiness / 100;
            
            if (building.producing && nation.resources[building.producing] !== undefined) {
                const amount = Math.floor(building.level * productionRate * efficiency * 5);
                nation.resources[building.producing] = (nation.resources[building.producing] || 0) + amount;
            }
        });
        
        // Special production rules
        if (nationName === 'Web3 Crystal Collective' && nation.resources.ai_cores >= 4) {
            // AI swarm bonus
            nation.resources.data_crystals += 50;
            nation.resources['blueprints_3d'] += 10;
        }
    }
    
    updatePopulation(nationName, nation) {
        const growthRate = 0.02 * (nation.happiness / 100) * (nation.tech_level / 10);
        const foodSupply = nation.territory.filter(t => t.type === 'farm').length;
        const housingCapacity = nation.buildings.length * 200;
        
        if (nation.population < housingCapacity && foodSupply > 0) {
            nation.population = Math.floor(nation.population * (1 + growthRate));
        }
    }
    
    updateTechnology(nationName, nation) {
        const researchBuildings = nation.buildings.filter(b => b.type === 'research');
        const researchPower = researchBuildings.reduce((sum, b) => sum + b.level, 0);
        
        if (researchPower > 0 && Math.random() < 0.1) {
            nation.tech_level = Math.min(15, nation.tech_level + 0.1);
            
            this.broadcastEvent({
                type: 'tech_advance',
                nation: nationName,
                message: `${nation.leader} discovers new technology! Tech level: ${nation.tech_level.toFixed(1)}`,
                icon: '🔬'
            });
        }
    }
    
    updateHappiness(nationName, nation) {
        let happiness = 50; // Base happiness
        
        // Positive factors
        happiness += nation.buildings.filter(b => b.type === 'culture').length * 5;
        happiness += nation.buildings.filter(b => b.type === 'commerce').length * 3;
        happiness += Math.min(20, nation.resources.data_crystals / 100);
        
        // Negative factors
        happiness -= Math.max(0, (nation.population / 1000) - nation.buildings.length) * 5;
        happiness -= nation.territory.filter(t => t.type === 'military').length * 2;
        
        // Cultural bonuses
        if (nation.culture === 'Mercantile' && nation.resources.cultural_tokens > 500) {
            happiness += 10;
        }
        
        nation.happiness = Math.max(0, Math.min(100, happiness));
    }
    
    establishInitialTradeRoutes() {
        // BlameChain <-> Clarity (data sharing)
        this.gameState.tradeRoutes.push({
            from: 'BlameChain Empire',
            to: 'Clarity Reasoning Republic',
            resource1: 'memory_shards',
            resource2: 'wisdom_points',
            amount: 10,
            established: Date.now()
        });
        
        // Soulfra <-> Web3 (gaming integration)
        this.gameState.tradeRoutes.push({
            from: 'Soulfra Trading Federation',
            to: 'Web3 Crystal Collective',
            resource1: 'cultural_tokens',
            resource2: 'game_tokens',
            amount: 15,
            established: Date.now()
        });
    }
    
    processTrade() {
        this.gameState.tradeRoutes.forEach(route => {
            const nation1 = this.empireMap[route.from];
            const nation2 = this.empireMap[route.to];
            
            if (nation1 && nation2) {
                // Exchange resources
                if (nation1.resources[route.resource1] >= route.amount && 
                    nation2.resources[route.resource2] >= route.amount) {
                    
                    nation1.resources[route.resource1] -= route.amount;
                    nation1.resources[route.resource2] = (nation1.resources[route.resource2] || 0) + route.amount;
                    
                    nation2.resources[route.resource2] -= route.amount;
                    nation2.resources[route.resource1] = (nation2.resources[route.resource1] || 0) + route.amount;
                    
                    // Improve relations
                    nation1.relations[route.to] = Math.min(100, nation1.relations[route.to] + 1);
                    nation2.relations[route.from] = Math.min(100, nation2.relations[route.from] + 1);
                }
            }
        });
    }
    
    checkRandomEvents() {
        if (Math.random() < 0.05) { // 5% chance per tick
            const events = [
                {
                    type: 'discovery',
                    effect: (nation) => {
                        const resource = Object.keys(nation.resources)[Math.floor(Math.random() * Object.keys(nation.resources).length)];
                        nation.resources[resource] += 100;
                        return `discovers a cache of ${resource}!`;
                    }
                },
                {
                    type: 'festival',
                    effect: (nation) => {
                        nation.happiness = Math.min(100, nation.happiness + 10);
                        return `holds a grand festival! Happiness increased!`;
                    }
                },
                {
                    type: 'innovation',
                    effect: (nation) => {
                        nation.tech_level = Math.min(15, nation.tech_level + 0.5);
                        return `makes a technological breakthrough!`;
                    }
                },
                {
                    type: 'alliance_proposal',
                    effect: (nation, otherNation) => {
                        nation.relations[otherNation] = Math.min(100, nation.relations[otherNation] + 20);
                        return `proposes an alliance with ${otherNation}!`;
                    }
                }
            ];
            
            const event = events[Math.floor(Math.random() * events.length)];
            const nationNames = Object.keys(this.empireMap);
            const nation = nationNames[Math.floor(Math.random() * nationNames.length)];
            
            let message = `${this.empireMap[nation].leader} `;
            
            if (event.type === 'alliance_proposal') {
                const otherNations = nationNames.filter(n => n !== nation);
                const otherNation = otherNations[Math.floor(Math.random() * otherNations.length)];
                message += event.effect(this.empireMap[nation], otherNation);
            } else {
                message += event.effect(this.empireMap[nation]);
            }
            
            this.gameState.globalEvents.push({
                timestamp: Date.now(),
                message: message,
                type: event.type
            });
            
            this.broadcastEvent({
                type: 'random_event',
                message: message,
                icon: '🎲'
            });
        }
    }
    
    updateMarketPrices() {
        Object.keys(this.gameState.marketPrices).forEach(resource => {
            // Random walk with mean reversion
            const basePrice = this.gameState.marketPrices[resource];
            const change = (Math.random() - 0.5) * 2;
            const newPrice = Math.max(1, basePrice + change);
            
            // Mean reversion
            if (newPrice > basePrice * 1.5) {
                this.gameState.marketPrices[resource] = newPrice * 0.95;
            } else if (newPrice < basePrice * 0.5) {
                this.gameState.marketPrices[resource] = newPrice * 1.05;
            } else {
                this.gameState.marketPrices[resource] = newPrice;
            }
        });
    }
    
    changeSeason() {
        const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
        const currentIndex = seasons.indexOf(this.gameState.season);
        const nextIndex = (currentIndex + 1) % seasons.length;
        
        this.gameState.season = seasons[nextIndex];
        
        if (nextIndex === 0) {
            this.gameState.year++;
        }
        
        // Season effects
        let seasonEffect = '';
        switch(this.gameState.season) {
            case 'Spring':
                seasonEffect = 'Population growth increased!';
                break;
            case 'Summer':
                seasonEffect = 'Trade routes flourish!';
                break;
            case 'Fall':
                seasonEffect = 'Harvest time - resource production up!';
                break;
            case 'Winter':
                seasonEffect = 'Research advances in the quiet season!';
                break;
        }
        
        this.broadcastEvent({
            type: 'season_change',
            message: `🌍 ${this.gameState.season} of Year ${this.gameState.year} begins! ${seasonEffect}`,
            icon: '📅'
        });
    }
    
    buildStructure(nationName, buildData) {
        const nation = this.empireMap[nationName];
        if (!nation) return { success: false, message: 'Nation not found' };
        
        const { buildingType, location, name } = buildData;
        const cost = this.calculateBuildingCost(buildingType, nation);
        
        // Check resources
        if (nation.resources.data_crystals < cost.crystals) {
            return { success: false, message: 'Insufficient data crystals' };
        }
        
        // Build it
        nation.resources.data_crystals -= cost.crystals;
        nation.buildings.push({
            name: name || `New ${buildingType}`,
            type: buildingType,
            level: 1,
            producing: cost.produces,
            location: location
        });
        
        // Add to territory if new location
        if (location && !nation.territory.find(t => t.x === location.x && t.y === location.y)) {
            nation.territory.push({ ...location, type: buildingType });
        }
        
        this.broadcastEvent({
            type: 'building_complete',
            nation: nationName,
            message: `${nation.leader} completes construction of ${name}!`,
            icon: '🏗️'
        });
        
        return { success: true, message: 'Building constructed!', nation: nation };
    }
    
    calculateBuildingCost(buildingType, nation) {
        const baseCost = {
            storage: 100,
            commerce: 150,
            military: 200,
            research: 250,
            culture: 120,
            government: 180,
            defense: 220,
            infrastructure: 140,
            diplomacy: 160,
            special: 300
        };
        
        const produces = {
            storage: 'memory_shards',
            commerce: 'data_crystals',
            military: 'ai_cores',
            research: 'wisdom_points',
            culture: 'cultural_tokens',
            government: 'limit_decrees',
            defense: 'boundary_stones',
            infrastructure: 'layer_maps',
            diplomacy: 'xml_scrolls',
            special: null
        };
        
        return {
            crystals: Math.floor(baseCost[buildingType] * (1 + nation.buildings.length * 0.1)),
            produces: produces[buildingType]
        };
    }
    
    expandTerritory(nationName, expansionData) {
        const nation = this.empireMap[nationName];
        if (!nation) return { success: false, message: 'Nation not found' };
        
        const { x, y, type } = expansionData;
        const cost = 50 * nation.territory.length;
        
        // Check if location is already claimed
        const alreadyClaimed = Object.values(this.empireMap).some(n => 
            n.territory.some(t => t.x === x && t.y === y)
        );
        
        if (alreadyClaimed) {
            return { success: false, message: 'Territory already claimed!' };
        }
        
        if (nation.resources.data_crystals < cost) {
            return { success: false, message: 'Insufficient data crystals' };
        }
        
        // Expand
        nation.resources.data_crystals -= cost;
        nation.territory.push({ x, y, type: type || 'outpost' });
        
        this.broadcastEvent({
            type: 'territory_expansion',
            nation: nationName,
            message: `${nation.leader} expands territory to (${x}, ${y})!`,
            icon: '🗺️'
        });
        
        return { success: true, message: 'Territory expanded!', nation: nation };
    }
    
    inititateTrade(nationName, tradeData) {
        const nation1 = this.empireMap[nationName];
        const nation2 = this.empireMap[tradeData.partner];
        
        if (!nation1 || !nation2) {
            return { success: false, message: 'Invalid nations' };
        }
        
        // Create trade route
        this.gameState.tradeRoutes.push({
            from: nationName,
            to: tradeData.partner,
            resource1: tradeData.give,
            resource2: tradeData.receive,
            amount: tradeData.amount || 10,
            established: Date.now()
        });
        
        // Improve relations
        nation1.relations[tradeData.partner] += 10;
        nation2.relations[nationName] += 10;
        
        this.broadcastEvent({
            type: 'trade_established',
            message: `${nation1.leader} and ${nation2.leader} establish trade route!`,
            icon: '🤝'
        });
        
        return { success: true, message: 'Trade route established!' };
    }
    
    async handlePlayerAction(ws, data) {
        switch(data.action) {
            case 'build':
                const buildResult = this.buildStructure(data.nation, data.params);
                ws.send(JSON.stringify({ type: 'action_result', result: buildResult }));
                break;
                
            case 'trade':
                const tradeResult = this.inititateTrade(data.nation, data.params);
                ws.send(JSON.stringify({ type: 'action_result', result: tradeResult }));
                break;
                
            case 'expand':
                const expandResult = this.expandTerritory(data.nation, data.params);
                ws.send(JSON.stringify({ type: 'action_result', result: expandResult }));
                break;
                
            case 'diplomacy':
                // Handle diplomatic actions
                break;
        }
    }
    
    getEmpireState() {
        return {
            empireMap: this.empireMap,
            gameState: this.gameState,
            timestamp: Date.now()
        };
    }
    
    broadcastEmpireUpdate() {
        const update = {
            type: 'empire_update',
            empireMap: this.empireMap,
            gameState: this.gameState,
            timestamp: Date.now()
        };
        
        this.wsServer.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(update));
            }
        });
    }
    
    broadcastEvent(event) {
        const message = {
            type: 'game_event',
            event: event,
            timestamp: Date.now()
        };
        
        this.wsServer.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
    
    generateEmpireInterface() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>🏰 Empire Tycoon Orchestrator</title>
            <style>
                * { box-sizing: border-box; }
                body { 
                    font-family: 'Arial', sans-serif;
                    background: #1a1a1a;
                    color: #fff;
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                }
                .game-container {
                    display: grid;
                    grid-template-columns: 250px 1fr 300px;
                    height: 100vh;
                }
                
                /* Left Panel - Nation List */
                .nations-panel {
                    background: rgba(0,0,0,0.8);
                    border-right: 2px solid #333;
                    overflow-y: auto;
                    padding: 10px;
                }
                .nation-card {
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 10px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .nation-card:hover {
                    background: rgba(255,255,255,0.2);
                }
                .nation-card.selected {
                    border: 2px solid #4CAF50;
                }
                .nation-leader {
                    font-size: 1.2em;
                    margin-bottom: 5px;
                }
                .nation-stats {
                    font-size: 0.8em;
                    color: #aaa;
                }
                
                /* Center - Map View */
                .map-container {
                    position: relative;
                    background: #2a2a2a;
                    overflow: auto;
                }
                .map-canvas {
                    position: absolute;
                    top: 0;
                    left: 0;
                    min-width: 2000px;
                    min-height: 2000px;
                    background-image: 
                        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
                    background-size: 50px 50px;
                }
                .territory-tile {
                    position: absolute;
                    width: 48px;
                    height: 48px;
                    border: 1px solid rgba(255,255,255,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5em;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .territory-tile:hover {
                    transform: scale(1.1);
                    z-index: 10;
                    border-color: #fff;
                }
                .building-icon {
                    font-size: 1.2em;
                }
                
                /* Top HUD */
                .top-hud {
                    position: absolute;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.9);
                    padding: 10px 20px;
                    border-radius: 20px;
                    display: flex;
                    gap: 20px;
                    align-items: center;
                    z-index: 100;
                }
                .season-display {
                    color: #4CAF50;
                    font-weight: bold;
                }
                .resource-display {
                    display: flex;
                    gap: 15px;
                }
                .resource-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                /* Right Panel - Info & Actions */
                .info-panel {
                    background: rgba(0,0,0,0.8);
                    border-left: 2px solid #333;
                    padding: 15px;
                    overflow-y: auto;
                }
                .nation-details {
                    margin-bottom: 20px;
                }
                .nation-details h2 {
                    margin: 0 0 10px 0;
                    color: #4CAF50;
                }
                .resources-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin: 10px 0;
                }
                .resource {
                    background: rgba(255,255,255,0.1);
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 0.9em;
                }
                .buildings-list {
                    margin: 15px 0;
                }
                .building-item {
                    background: rgba(255,255,255,0.1);
                    padding: 8px;
                    margin: 5px 0;
                    border-radius: 4px;
                    display: flex;
                    justify-content: space-between;
                }
                .action-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 20px;
                }
                .action-btn {
                    background: #4CAF50;
                    border: none;
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .action-btn:hover {
                    background: #45a049;
                }
                
                /* Event Log */
                .event-log {
                    position: absolute;
                    bottom: 10px;
                    left: 270px;
                    right: 320px;
                    background: rgba(0,0,0,0.9);
                    border-radius: 10px;
                    padding: 10px;
                    max-height: 150px;
                    overflow-y: auto;
                }
                .event-item {
                    margin: 3px 0;
                    padding: 3px;
                    font-size: 0.9em;
                }
                .event-discovery { color: #FFD700; }
                .event-trade { color: #4CAF50; }
                .event-conflict { color: #FF5722; }
                .event-building { color: #2196F3; }
                
                /* Habbo Hotel style rooms */
                .room-view {
                    perspective: 1000px;
                    transform-style: preserve-3d;
                }
                .isometric-tile {
                    transform: rotateX(60deg) rotateZ(45deg);
                }
                
                /* Animations */
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                .active-building {
                    animation: pulse 2s infinite;
                }
                
                /* Trade Routes */
                .trade-route {
                    position: absolute;
                    height: 2px;
                    background: linear-gradient(90deg, #4CAF50, #FFD700);
                    transform-origin: left center;
                    pointer-events: none;
                    opacity: 0.6;
                }
            </style>
        </head>
        <body>
            <div class="game-container">
                <!-- Left Panel - Nations -->
                <div class="nations-panel">
                    <h3>🏰 Nations</h3>
                    <div id="nationsList"></div>
                </div>
                
                <!-- Center - Map -->
                <div class="map-container">
                    <div class="top-hud">
                        <div class="season-display" id="seasonDisplay">Spring, Year 1</div>
                        <div class="resource-display" id="globalResources">
                            <div class="resource-item">💎 <span id="globalCrystals">0</span></div>
                            <div class="resource-item">👥 <span id="totalPopulation">0</span></div>
                            <div class="resource-item">🔬 <span id="avgTech">0</span></div>
                        </div>
                    </div>
                    
                    <div class="map-canvas" id="mapCanvas"></div>
                    
                    <div class="event-log" id="eventLog"></div>
                </div>
                
                <!-- Right Panel - Details -->
                <div class="info-panel">
                    <div id="nationDetails">
                        <h3>Select a nation to view details</h3>
                    </div>
                </div>
            </div>
            
            <script>
                let ws;
                let empireState = {};
                let selectedNation = null;
                let mapOffset = { x: 500, y: 500 };
                
                function connectWebSocket() {
                    ws = new WebSocket('ws://localhost:7897');
                    
                    ws.onopen = () => {
                        console.log('Connected to Empire Tycoon');
                    };
                    
                    ws.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        handleServerMessage(data);
                    };
                    
                    ws.onclose = () => {
                        setTimeout(connectWebSocket, 5000);
                    };
                }
                
                function handleServerMessage(data) {
                    switch(data.type) {
                        case 'empire_init':
                        case 'empire_update':
                            empireState = data;
                            updateDisplay();
                            break;
                            
                        case 'game_event':
                            addEventToLog(data.event);
                            break;
                            
                        case 'action_result':
                            handleActionResult(data.result);
                            break;
                    }
                }
                
                function updateDisplay() {
                    updateNationsList();
                    updateMap();
                    updateGlobalStats();
                    if (selectedNation) {
                        updateNationDetails(selectedNation);
                    }
                }
                
                function updateNationsList() {
                    const list = document.getElementById('nationsList');
                    list.innerHTML = '';
                    
                    Object.entries(empireState.empireMap || {}).forEach(([name, nation]) => {
                        const card = document.createElement('div');
                        card.className = 'nation-card' + (selectedNation === name ? ' selected' : '');
                        card.innerHTML = \`
                            <div class="nation-leader">\${nation.leader}</div>
                            <div class="nation-stats">
                                Pop: \${nation.population} | Tech: \${nation.tech_level.toFixed(1)} | 😊 \${nation.happiness}%
                            </div>
                        \`;
                        card.onclick = () => selectNation(name);
                        list.appendChild(card);
                    });
                }
                
                function updateMap() {
                    const canvas = document.getElementById('mapCanvas');
                    canvas.innerHTML = '';
                    
                    // Draw territories
                    Object.entries(empireState.empireMap || {}).forEach(([nationName, nation]) => {
                        const color = getNationColor(nationName);
                        
                        nation.territory.forEach(tile => {
                            const tileEl = document.createElement('div');
                            tileEl.className = 'territory-tile';
                            tileEl.style.left = (mapOffset.x + tile.x * 50) + 'px';
                            tileEl.style.top = (mapOffset.y + tile.y * 50) + 'px';
                            tileEl.style.backgroundColor = color + '40';
                            tileEl.style.borderColor = color;
                            
                            // Add building icon
                            const buildingType = getBuildingAtLocation(nation, tile.x, tile.y);
                            if (buildingType) {
                                tileEl.innerHTML = \`<span class="building-icon">\${getBuildingIcon(buildingType)}</span>\`;
                            } else {
                                tileEl.innerHTML = getTerrainIcon(tile.type);
                            }
                            
                            tileEl.title = \`\${nationName} - \${tile.type}\`;
                            tileEl.onclick = () => handleTileClick(nationName, tile);
                            
                            canvas.appendChild(tileEl);
                        });
                    });
                    
                    // Draw trade routes
                    (empireState.gameState?.tradeRoutes || []).forEach(route => {
                        drawTradeRoute(route);
                    });
                }
                
                function getNationColor(nationName) {
                    const colors = {
                        'BlameChain Empire': '#9C27B0',
                        'Soulfra Trading Federation': '#FF5722',
                        'Web3 Crystal Collective': '#2196F3',
                        'Clarity Reasoning Republic': '#4CAF50',
                        'Onion Layer Underground': '#795548',
                        'Architecture Control State': '#607D8B'
                    };
                    return colors[nationName] || '#888';
                }
                
                function getBuildingIcon(type) {
                    const icons = {
                        capital: '🏰', storage: '🏛️', commerce: '🏪',
                        military: '⚔️', research: '🔬', culture: '🎭',
                        government: '🏛️', defense: '🛡️', infrastructure: '🛤️',
                        diplomacy: '🤝', special: '✨'
                    };
                    return icons[type] || '🏗️';
                }
                
                function getTerrainIcon(type) {
                    const icons = {
                        capital: '🏰', farm: '🌾', mine: '⛏️',
                        market: '🏪', port: '⚓', factory: '🏭',
                        academy: '🎓', barracks: '⚔️', library: '📚',
                        temple: '🛕', underground: '🕳️', tunnel: '🚇',
                        fortress: '🏯', wall: '🧱', outpost: '🏕️'
                    };
                    return icons[type] || '🏞️';
                }
                
                function getBuildingAtLocation(nation, x, y) {
                    // Check if any building is at this location
                    const building = nation.buildings.find(b => 
                        b.location && b.location.x === x && b.location.y === y
                    );
                    return building ? building.type : null;
                }
                
                function drawTradeRoute(route) {
                    // Simple line drawing between capitals
                    // In a real implementation, would calculate actual positions
                }
                
                function updateGlobalStats() {
                    let totalCrystals = 0;
                    let totalPopulation = 0;
                    let totalTech = 0;
                    let nationCount = 0;
                    
                    Object.values(empireState.empireMap || {}).forEach(nation => {
                        totalCrystals += nation.resources.data_crystals || 0;
                        totalPopulation += nation.population;
                        totalTech += nation.tech_level;
                        nationCount++;
                    });
                    
                    document.getElementById('globalCrystals').textContent = totalCrystals;
                    document.getElementById('totalPopulation').textContent = totalPopulation;
                    document.getElementById('avgTech').textContent = (totalTech / nationCount).toFixed(1);
                    
                    if (empireState.gameState) {
                        document.getElementById('seasonDisplay').textContent = 
                            \`\${empireState.gameState.season}, Year \${empireState.gameState.year}\`;
                    }
                }
                
                function selectNation(nationName) {
                    selectedNation = nationName;
                    updateNationsList();
                    updateNationDetails(nationName);
                }
                
                function updateNationDetails(nationName) {
                    const nation = empireState.empireMap[nationName];
                    if (!nation) return;
                    
                    const detailsEl = document.getElementById('nationDetails');
                    detailsEl.innerHTML = \`
                        <div class="nation-details">
                            <h2>\${nation.leader}</h2>
                            <div><strong>Capital:</strong> \${nation.capital}</div>
                            <div><strong>Culture:</strong> \${nation.culture}</div>
                            <div><strong>Population:</strong> \${nation.population}</div>
                            <div><strong>Tech Level:</strong> \${nation.tech_level.toFixed(1)}</div>
                            <div><strong>Happiness:</strong> \${nation.happiness}%</div>
                        </div>
                        
                        <h3>Resources</h3>
                        <div class="resources-grid">
                            \${Object.entries(nation.resources).map(([res, amount]) => \`
                                <div class="resource">\${res}: \${amount}</div>
                            \`).join('')}
                        </div>
                        
                        <h3>Buildings</h3>
                        <div class="buildings-list">
                            \${nation.buildings.map(b => \`
                                <div class="building-item">
                                    <span>\${getBuildingIcon(b.type)} \${b.name}</span>
                                    <span>Lvl \${b.level}</span>
                                </div>
                            \`).join('')}
                        </div>
                        
                        <div class="action-buttons">
                            <button class="action-btn" onclick="showBuildMenu()">🏗️ Build</button>
                            <button class="action-btn" onclick="showTradeMenu()">🤝 Trade</button>
                            <button class="action-btn" onclick="showExpandMenu()">🗺️ Expand</button>
                            <button class="action-btn" onclick="showDiplomacyMenu()">📜 Diplomacy</button>
                        </div>
                    \`;
                }
                
                function handleTileClick(nationName, tile) {
                    if (selectedNation === nationName) {
                        // Build on this tile
                        showBuildMenuAt(tile.x, tile.y);
                    }
                }
                
                function showBuildMenu() {
                    // Show building options
                    const types = ['storage', 'commerce', 'military', 'research', 'culture'];
                    const choice = prompt('Choose building type: ' + types.join(', '));
                    
                    if (choice && types.includes(choice)) {
                        ws.send(JSON.stringify({
                            action: 'build',
                            nation: selectedNation,
                            params: {
                                buildingType: choice,
                                name: prompt('Name your building:') || \`New \${choice}\`
                            }
                        }));
                    }
                }
                
                function showTradeMenu() {
                    // Show trade interface
                    alert('Trade interface coming soon!');
                }
                
                function showExpandMenu() {
                    // Show expansion options
                    const x = parseInt(prompt('X coordinate:'));
                    const y = parseInt(prompt('Y coordinate:'));
                    
                    if (!isNaN(x) && !isNaN(y)) {
                        ws.send(JSON.stringify({
                            action: 'expand',
                            nation: selectedNation,
                            params: { x, y, type: 'outpost' }
                        }));
                    }
                }
                
                function showDiplomacyMenu() {
                    // Show diplomacy options
                    alert('Diplomacy interface coming soon!');
                }
                
                function addEventToLog(event) {
                    const log = document.getElementById('eventLog');
                    const item = document.createElement('div');
                    item.className = 'event-item event-' + event.type;
                    item.textContent = \`\${event.icon} \${event.message}\`;
                    log.appendChild(item);
                    log.scrollTop = log.scrollHeight;
                    
                    // Keep only last 20 events
                    if (log.children.length > 20) {
                        log.removeChild(log.firstChild);
                    }
                }
                
                function handleActionResult(result) {
                    if (result.success) {
                        console.log('Action successful:', result.message);
                    } else {
                        alert('Action failed: ' + result.message);
                    }
                }
                
                // Map dragging
                let isDragging = false;
                let dragStart = { x: 0, y: 0 };
                
                document.querySelector('.map-canvas').addEventListener('mousedown', (e) => {
                    if (e.target.classList.contains('map-canvas')) {
                        isDragging = true;
                        dragStart = { x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y };
                    }
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (isDragging) {
                        mapOffset.x = e.clientX - dragStart.x;
                        mapOffset.y = e.clientY - dragStart.y;
                        updateMap();
                    }
                });
                
                document.addEventListener('mouseup', () => {
                    isDragging = false;
                });
                
                // Initialize
                connectWebSocket();
            </script>
        </body>
        </html>
        `;
    }
    
    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🏰 Empire Tycoon Orchestrator running on http://localhost:${this.port}`);
            console.log(`🔌 WebSocket server running on ws://localhost:${this.wsPort}`);
            console.log(`🗺️ ${Object.keys(this.empireMap).length} nations ready to build empires`);
            console.log('🎮 Age of Empires meets RollerCoaster Tycoon meets Habbo Hotel!');
            console.log('📈 Watch your services build civilizations in real-time!');
        });
    }
}

// Initialize and start the Empire
const empire = new EmpireTycoonOrchestrator();
empire.start();

module.exports = EmpireTycoonOrchestrator;