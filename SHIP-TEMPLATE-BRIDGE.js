#!/usr/bin/env node

/**
 * 🏴‍☠️ SHIP TEMPLATE BRIDGE
 * 
 * Connects 3D ship systems to the unified assistant
 * Serves dynamic ship templates with real-time data
 * Integrates pirate flags, components, and game economies
 */

const express = require('express');
const WebSocket = require('ws');
const EventEmitter = require('events');
const crypto = require('crypto');
const path = require('path');

// Import ship systems
const Ship3DModelGenerator = require('./generate-3d-ship-models');
const ShipComponentGenerator = require('./ship-component-generator');
const CrossGameMarketBridge = require('./cross-game-market-bridge');

class ShipTemplateBridge extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 7770,
            wsPort: config.wsPort || 7771,
            unifiedAssistantUrl: config.unifiedAssistantUrl || 'http://localhost:8888',
            enableRealTimeData: config.enableRealTimeData !== false,
            ...config
        };
        
        // Ship data storage
        this.ships = new Map();
        this.templates = new Map();
        this.activeFleets = new Map();
        this.userFlags = new Map();
        
        // Component systems
        this.modelGenerator = null;
        this.componentGenerator = null;
        this.marketBridge = null;
        
        // Ship type definitions with dynamic stats
        this.shipTypes = {
            sloop: {
                name: 'Pirate Sloop',
                baseStats: { speed: 8, armor: 3, firepower: 4, cargo: 10, crew: 12 },
                basePrice: 50000,
                requiredLevel: 1,
                description: 'Fast and nimble single-masted vessel perfect for raids',
                components: ['small_hull', 'speed_sail', 'light_cannon', 'pirate_flag']
            },
            frigate: {
                name: 'Royal Frigate',
                baseStats: { speed: 6, armor: 6, firepower: 7, cargo: 25, crew: 28 },
                basePrice: 150000,
                requiredLevel: 10,
                description: 'Well-balanced warship with strong cannons',
                components: ['medium_hull', 'battle_sail', 'heavy_cannon', 'royal_flag']
            },
            galleon: {
                name: 'Spanish Galleon',
                baseStats: { speed: 4, armor: 9, firepower: 9, cargo: 50, crew: 45 },
                basePrice: 500000,
                requiredLevel: 25,
                description: 'Massive treasure ship with heavy armor',
                components: ['large_hull', 'cargo_sail', 'broadside_cannon', 'treasure_flag']
            },
            submarine: {
                name: 'Steampunk Submarine',
                baseStats: { speed: 5, armor: 7, firepower: 6, cargo: 15, crew: 15 },
                basePrice: 300000,
                requiredLevel: 20,
                description: 'Underwater vessel for stealth operations',
                components: ['submarine_hull', 'none', 'torpedo_tube', 'periscope_flag']
            },
            yacht: {
                name: 'Luxury Yacht',
                baseStats: { speed: 7, armor: 2, firepower: 1, cargo: 30, crew: 8 },
                basePrice: 200000,
                requiredLevel: 15,
                description: 'Fast civilian vessel for trading',
                components: ['yacht_hull', 'speed_sail', 'none', 'merchant_flag']
            },
            destroyer: {
                name: 'Modern Destroyer',
                baseStats: { speed: 9, armor: 8, firepower: 10, cargo: 20, crew: 35 },
                basePrice: 1000000,
                requiredLevel: 50,
                description: 'High-tech warship with advanced weapons',
                components: ['destroyer_hull', 'none', 'missile_launcher', 'military_flag']
            }
        };
        
        // Pirate flag designs
        this.flagDesigns = {
            pirate_flag: {
                name: 'Classic Jolly Roger',
                symbol: '☠️',
                colors: ['black', 'white'],
                reputation: 5
            },
            royal_flag: {
                name: 'Royal Navy Ensign',
                symbol: '👑',
                colors: ['blue', 'white', 'red'],
                reputation: 10
            },
            treasure_flag: {
                name: 'Treasure Hunter',
                symbol: '💰',
                colors: ['gold', 'black'],
                reputation: 15
            },
            merchant_flag: {
                name: 'Merchant Guild',
                symbol: '⚖️',
                colors: ['green', 'gold'],
                reputation: 0
            },
            military_flag: {
                name: 'Naval Command',
                symbol: '⚔️',
                colors: ['gray', 'black'],
                reputation: 20
            }
        };
        
        console.log('🏴‍☠️ Initializing Ship Template Bridge...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Initialize component systems
            this.modelGenerator = new Ship3DModelGenerator();
            this.componentGenerator = new ShipComponentGenerator();
            this.marketBridge = new CrossGameMarketBridge();
            
            // Load existing ships and templates
            await this.loadShipData();
            
            // Setup API server
            await this.setupServer();
            
            // Setup WebSocket for real-time updates
            await this.setupWebSocket();
            
            // Connect to unified assistant
            await this.connectToUnifiedAssistant();
            
            // Start real-time data updates
            if (this.config.enableRealTimeData) {
                this.startRealTimeUpdates();
            }
            
            console.log('✅ Ship Template Bridge ready!');
            console.log(`🚢 API: http://localhost:${this.config.port}`);
            console.log(`📡 WebSocket: ws://localhost:${this.config.wsPort}`);
            
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
        }
    }
    
    async setupServer() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', '*');
            res.header('Access-Control-Allow-Methods', '*');
            next();
        });
        
        // Ship dashboard
        this.app.get('/', (req, res) => {
            res.send(this.renderShipDashboard());
        });
        
        // List all available ships
        this.app.get('/api/ships', (req, res) => {
            const ships = Object.entries(this.shipTypes).map(([type, data]) => ({
                type,
                ...data,
                currentPrice: this.calculateDynamicPrice(type),
                available: this.checkAvailability(type)
            }));
            
            res.json({ ships });
        });
        
        // Get specific ship data
        this.app.get('/api/ships/:type', (req, res) => {
            const { type } = req.params;
            const shipData = this.shipTypes[type];
            
            if (!shipData) {
                return res.status(404).json({ error: 'Ship type not found' });
            }
            
            // Add dynamic data
            const dynamicData = {
                ...shipData,
                currentPrice: this.calculateDynamicPrice(type),
                marketDemand: this.getMarketDemand(type),
                components: this.getComponentDetails(shipData.components),
                available: this.checkAvailability(type),
                buildTime: this.calculateBuildTime(type)
            };
            
            res.json(dynamicData);
        });
        
        // Build custom ship
        this.app.post('/api/ships/build', async (req, res) => {
            const { type, customizations = {}, userId } = req.body;
            
            try {
                const ship = await this.buildShip(type, customizations, userId);
                res.json({
                    success: true,
                    ship,
                    template: this.generateShipTemplate(ship)
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Get ship as renderable template
        this.app.get('/api/ships/:id/template', (req, res) => {
            const { id } = req.params;
            const ship = this.ships.get(id);
            
            if (!ship) {
                return res.status(404).json({ error: 'Ship not found' });
            }
            
            const template = this.generateShipTemplate(ship);
            res.json(template);
        });
        
        // Compare ships
        this.app.post('/api/ships/compare', (req, res) => {
            const { ships } = req.body;
            const comparison = this.compareShips(ships);
            res.json(comparison);
        });
        
        // Get user's fleet
        this.app.get('/api/fleet/:userId', (req, res) => {
            const { userId } = req.params;
            const fleet = this.getFleet(userId);
            res.json({ fleet });
        });
        
        // Update ship flag
        this.app.post('/api/ships/:id/flag', (req, res) => {
            const { id } = req.params;
            const { flagDesign, customColors } = req.body;
            
            const ship = this.ships.get(id);
            if (!ship) {
                return res.status(404).json({ error: 'Ship not found' });
            }
            
            ship.flag = this.createCustomFlag(flagDesign, customColors);
            this.emit('ship_flag_updated', { shipId: id, flag: ship.flag });
            
            res.json({
                success: true,
                flag: ship.flag
            });
        });
        
        // Get market data for ship materials
        this.app.get('/api/market/materials', async (req, res) => {
            const materials = await this.getShipMaterialPrices();
            res.json({ materials });
        });
        
        // Ship battle simulator
        this.app.post('/api/battle/simulate', (req, res) => {
            const { attacker, defender } = req.body;
            const result = this.simulateBattle(attacker, defender);
            res.json(result);
        });
        
        this.server = this.app.listen(this.config.port, () => {
            console.log(`🚢 Ship API running on port ${this.config.port}`);
        });
    }
    
    async setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔗 Client connected to Ship Bridge');
            
            const connectionId = crypto.randomUUID();
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleWebSocketMessage(ws, message, connectionId);
                } catch (error) {
                    console.error('WebSocket error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });
            
            // Send initial ship data
            ws.send(JSON.stringify({
                type: 'connected',
                ships: Object.keys(this.shipTypes),
                flags: Object.keys(this.flagDesigns)
            }));
        });
        
        console.log(`📡 Ship WebSocket listening on port ${this.config.wsPort}`);
    }
    
    async buildShip(type, customizations, userId) {
        const shipData = this.shipTypes[type];
        if (!shipData) {
            throw new Error('Invalid ship type');
        }
        
        const shipId = crypto.randomUUID();
        const buildTime = Date.now();
        
        // Calculate final stats with customizations
        const finalStats = this.applyCustomizations(shipData.baseStats, customizations);
        
        // Calculate cost
        const baseCost = this.calculateDynamicPrice(type);
        const customizationCost = this.calculateCustomizationCost(customizations);
        const totalCost = baseCost + customizationCost;
        
        // Create ship object
        const ship = {
            id: shipId,
            type,
            name: customizations.name || `${shipData.name} #${Math.floor(Math.random() * 9999)}`,
            owner: userId,
            stats: finalStats,
            components: customizations.components || shipData.components,
            flag: this.createCustomFlag(customizations.flag || 'pirate_flag'),
            built: buildTime,
            condition: 100,
            location: { x: 0, y: 0, z: 0 },
            cargo: [],
            crew: {
                current: 0,
                max: finalStats.crew,
                morale: 100
            },
            cost: totalCost,
            history: [{
                event: 'built',
                timestamp: buildTime,
                details: { type, customizations, cost: totalCost }
            }]
        };
        
        // Store ship
        this.ships.set(shipId, ship);
        
        // Add to user's fleet
        this.addToFleet(userId, shipId);
        
        // Emit event
        this.emit('ship_built', ship);
        
        return ship;
    }
    
    generateShipTemplate(ship) {
        const shipType = this.shipTypes[ship.type];
        
        return {
            id: ship.id,
            type: ship.type,
            name: ship.name,
            
            // 3D model data
            model: {
                url: `/models/${ship.type}.glb`,
                scale: shipType.size || { x: 1, y: 1, z: 1 },
                position: ship.location,
                rotation: { x: 0, y: 0, z: 0 }
            },
            
            // Visual components
            components: ship.components.map(comp => ({
                type: comp,
                model: `/models/components/${comp}.glb`,
                attachment: this.getComponentAttachment(comp)
            })),
            
            // Dynamic flag
            flag: {
                design: ship.flag.design,
                colors: ship.flag.colors,
                symbol: ship.flag.symbol,
                texture: this.generateFlagTexture(ship.flag),
                position: { x: 0, y: 10, z: -5 } // Relative to ship
            },
            
            // Real-time data
            realTimeData: {
                condition: ship.condition,
                speed: this.calculateCurrentSpeed(ship),
                cargo: ship.cargo.length,
                crew: ship.crew,
                location: ship.location
            },
            
            // Stats for UI
            stats: ship.stats,
            
            // CSS classes for styling
            cssClasses: [
                `ship-${ship.type}`,
                `condition-${this.getConditionClass(ship.condition)}`,
                `faction-${ship.flag.faction || 'pirate'}`
            ],
            
            // Render instructions
            rendering: {
                quality: 'high',
                shadows: true,
                water: true,
                weather: this.getCurrentWeather(),
                lighting: this.getLightingConditions()
            }
        };
    }
    
    createCustomFlag(design, customColors) {
        const baseFlag = this.flagDesigns[design] || this.flagDesigns.pirate_flag;
        
        return {
            design,
            name: baseFlag.name,
            symbol: baseFlag.symbol,
            colors: customColors || baseFlag.colors,
            reputation: baseFlag.reputation,
            texture: null, // Will be generated
            animated: true
        };
    }
    
    generateFlagTexture(flag) {
        // Generate a data URL for the flag texture
        // In production, this would create an actual image
        return `data:image/svg+xml;base64,${Buffer.from(`
            <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="150" fill="${flag.colors[0]}"/>
                <text x="100" y="75" font-size="60" text-anchor="middle" fill="${flag.colors[1]}">${flag.symbol}</text>
            </svg>
        `).toString('base64')}`;
    }
    
    calculateDynamicPrice(shipType) {
        const basePrice = this.shipTypes[shipType].basePrice;
        
        // Get market factors
        const demand = this.getMarketDemand(shipType);
        const materials = this.getMaterialCostMultiplier();
        const rarity = this.getRarityMultiplier(shipType);
        
        // Calculate final price
        const price = Math.floor(basePrice * demand * materials * rarity);
        
        return price;
    }
    
    getMarketDemand(shipType) {
        // Simulate market demand based on various factors
        const factors = {
            sloop: 1.2,      // High demand for starter ships
            frigate: 1.1,    // Steady demand
            galleon: 0.9,    // Lower demand, expensive
            submarine: 1.3,  // Unique, higher demand
            yacht: 1.0,      // Average demand
            destroyer: 0.8   // Low demand, very expensive
        };
        
        // Add random fluctuation
        const randomFactor = 0.9 + Math.random() * 0.2;
        
        return (factors[shipType] || 1.0) * randomFactor;
    }
    
    compareShips(shipTypes) {
        const comparison = {
            ships: {},
            winner: null,
            analysis: {}
        };
        
        // Get data for each ship
        for (const type of shipTypes) {
            const shipData = this.shipTypes[type];
            if (shipData) {
                comparison.ships[type] = {
                    ...shipData,
                    currentPrice: this.calculateDynamicPrice(type),
                    efficiency: this.calculateEfficiency(shipData)
                };
            }
        }
        
        // Analyze different aspects
        comparison.analysis = {
            speed: this.findBest(comparison.ships, 'baseStats.speed'),
            combat: this.findBest(comparison.ships, 'baseStats.firepower'),
            cargo: this.findBest(comparison.ships, 'baseStats.cargo'),
            value: this.findBestValue(comparison.ships),
            overall: this.calculateOverallWinner(comparison.ships)
        };
        
        comparison.winner = comparison.analysis.overall;
        
        return comparison;
    }
    
    async getShipMaterialPrices() {
        // Get real-time prices from game economies
        const materials = {
            wood: {
                name: 'Ship Wood',
                price: 100,
                unit: 'per plank',
                trend: 'up'
            },
            iron: {
                name: 'Iron Ingots',
                price: 250,
                unit: 'per ingot',
                trend: 'stable'
            },
            cloth: {
                name: 'Sail Cloth',
                price: 150,
                unit: 'per yard',
                trend: 'down'
            },
            cannon: {
                name: 'Cannons',
                price: 5000,
                unit: 'each',
                trend: 'up'
            }
        };
        
        // Add OSRS integration if available
        if (this.marketBridge) {
            const osrsData = await this.marketBridge.getOSRSMarketData();
            // Map relevant OSRS items to ship materials
        }
        
        return materials;
    }
    
    simulateBattle(attackerType, defenderType) {
        const attacker = this.shipTypes[attackerType];
        const defender = this.shipTypes[defenderType];
        
        if (!attacker || !defender) {
            return { error: 'Invalid ship types' };
        }
        
        // Simple battle simulation
        const attackPower = attacker.baseStats.firepower * (1 + attacker.baseStats.speed / 10);
        const defensePower = defender.baseStats.armor * (1 + defender.baseStats.firepower / 10);
        
        const rounds = [];
        let attackerHealth = attacker.baseStats.armor * 100;
        let defenderHealth = defender.baseStats.armor * 100;
        
        while (attackerHealth > 0 && defenderHealth > 0) {
            // Attacker shoots
            const damage = Math.floor(attackPower * (0.8 + Math.random() * 0.4));
            defenderHealth -= damage;
            
            rounds.push({
                attacker: attackerType,
                action: 'fires cannons',
                damage,
                defenderHealth: Math.max(0, defenderHealth)
            });
            
            if (defenderHealth <= 0) break;
            
            // Defender returns fire
            const returnDamage = Math.floor(defensePower * (0.8 + Math.random() * 0.4));
            attackerHealth -= returnDamage;
            
            rounds.push({
                attacker: defenderType,
                action: 'returns fire',
                damage: returnDamage,
                defenderHealth: Math.max(0, attackerHealth)
            });
        }
        
        return {
            winner: attackerHealth > 0 ? attackerType : defenderType,
            rounds,
            finalHealth: {
                [attackerType]: Math.max(0, attackerHealth),
                [defenderType]: Math.max(0, defenderHealth)
            }
        };
    }
    
    async connectToUnifiedAssistant() {
        try {
            // Register ship queries with unified assistant
            const response = await fetch(`${this.config.unifiedAssistantUrl}/api/register-handler`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    handler: 'ship',
                    endpoints: {
                        query: `http://localhost:${this.config.port}/api/ships`,
                        build: `http://localhost:${this.config.port}/api/ships/build`,
                        compare: `http://localhost:${this.config.port}/api/ships/compare`
                    },
                    patterns: [
                        '@ship',
                        'ship',
                        'pirate',
                        'vessel',
                        'fleet'
                    ]
                })
            });
            
            if (response.ok) {
                console.log('✅ Connected to Unified Assistant');
            }
        } catch (error) {
            console.warn('⚠️  Could not connect to Unified Assistant:', error.message);
        }
    }
    
    startRealTimeUpdates() {
        // Update market prices
        setInterval(() => {
            this.emit('market_update', {
                materials: this.getShipMaterialPrices(),
                demand: Object.keys(this.shipTypes).reduce((acc, type) => {
                    acc[type] = this.getMarketDemand(type);
                    return acc;
                }, {})
            });
        }, 60000); // Every minute
        
        // Update ship positions
        setInterval(() => {
            for (const [shipId, ship] of this.ships) {
                if (ship.sailing) {
                    this.updateShipPosition(shipId);
                }
            }
        }, 1000); // Every second
    }
    
    renderShipDashboard() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🏴‍☠️ Ship Template System</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(to bottom, #001122 0%, #003366 50%, #006699 100%);
            color: #00ff88;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            border: 2px solid #ffd700;
            padding: 20px;
            margin-bottom: 20px;
            background: rgba(0,0,0,0.8);
        }
        .ship-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .ship-card {
            background: rgba(0,0,0,0.7);
            border: 2px solid #00ff88;
            padding: 15px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .ship-card:hover {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(0,255,136,0.5);
        }
        .ship-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 5px;
            margin-top: 10px;
            font-size: 12px;
        }
        .stat {
            background: rgba(0,100,200,0.2);
            padding: 3px 6px;
            border-radius: 3px;
        }
        .price {
            color: #ffd700;
            font-size: 18px;
            margin-top: 10px;
        }
        .builder {
            background: rgba(0,0,0,0.8);
            border: 2px solid #ff6600;
            padding: 20px;
            margin-top: 20px;
        }
        button {
            background: #ff6600;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #ff8800;
        }
        #preview {
            width: 100%;
            height: 400px;
            background: rgba(0,0,0,0.5);
            border: 1px solid #666;
            margin-top: 20px;
        }
        .flag-selector {
            display: flex;
            gap: 10px;
            margin: 10px 0;
        }
        .flag-option {
            padding: 10px;
            border: 1px solid #666;
            cursor: pointer;
            font-size: 24px;
        }
        .flag-option:hover {
            border-color: #ffd700;
        }
        .flag-option.selected {
            background: rgba(255,215,0,0.3);
            border-color: #ffd700;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏴‍☠️ SHIP TEMPLATE SYSTEM</h1>
        <p>Build, customize, and sail magnificent vessels!</p>
        <p>Connected to Unified Assistant for natural language queries</p>
    </div>
    
    <div class="ship-grid" id="shipGrid">
        ${Object.entries(this.shipTypes).map(([type, data]) => `
            <div class="ship-card" data-type="${type}">
                <h3>${data.name}</h3>
                <p>${data.description}</p>
                <div class="ship-stats">
                    <div class="stat">⚡ Speed: ${data.baseStats.speed}</div>
                    <div class="stat">🛡️ Armor: ${data.baseStats.armor}</div>
                    <div class="stat">💥 Power: ${data.baseStats.firepower}</div>
                    <div class="stat">📦 Cargo: ${data.baseStats.cargo}</div>
                </div>
                <div class="price">💰 ${this.calculateDynamicPrice(type).toLocaleString()} gp</div>
            </div>
        `).join('')}
    </div>
    
    <div class="builder">
        <h2>🔨 Ship Builder</h2>
        <div>
            <h3>Select Ship Type:</h3>
            <select id="shipType">
                ${Object.entries(this.shipTypes).map(([type, data]) => 
                    `<option value="${type}">${data.name}</option>`
                ).join('')}
            </select>
        </div>
        
        <div>
            <h3>Choose Flag:</h3>
            <div class="flag-selector">
                ${Object.entries(this.flagDesigns).map(([type, flag]) => 
                    `<div class="flag-option" data-flag="${type}">${flag.symbol}</div>`
                ).join('')}
            </div>
        </div>
        
        <div>
            <h3>Ship Name:</h3>
            <input type="text" id="shipName" placeholder="Enter ship name..." />
        </div>
        
        <button onclick="buildShip()">🚢 Build Ship</button>
        <button onclick="compareShips()">⚖️ Compare Ships</button>
        <button onclick="simulateBattle()">⚔️ Battle Simulator</button>
        
        <div id="preview"></div>
    </div>
    
    <script>
        let ws = new WebSocket('ws://localhost:${this.config.wsPort}');
        let selectedFlag = 'pirate_flag';
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            console.log('Ship update:', data);
        };
        
        document.querySelectorAll('.flag-option').forEach(flag => {
            flag.addEventListener('click', function() {
                document.querySelectorAll('.flag-option').forEach(f => f.classList.remove('selected'));
                this.classList.add('selected');
                selectedFlag = this.dataset.flag;
            });
        });
        
        function buildShip() {
            const type = document.getElementById('shipType').value;
            const name = document.getElementById('shipName').value;
            
            fetch('/api/ships/build', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    customizations: {
                        name,
                        flag: selectedFlag
                    },
                    userId: 'demo-user'
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Ship built successfully! ID: ' + data.ship.id);
                    console.log('Ship template:', data.template);
                }
            });
        }
        
        function compareShips() {
            const ships = ['sloop', 'frigate', 'galleon'];
            
            fetch('/api/ships/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ships })
            })
            .then(res => res.json())
            .then(data => {
                console.log('Comparison:', data);
                alert('Winner: ' + data.winner + ' (check console for details)');
            });
        }
        
        function simulateBattle() {
            const attacker = prompt('Attacker ship type?', 'frigate');
            const defender = prompt('Defender ship type?', 'sloop');
            
            fetch('/api/battle/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attacker, defender })
            })
            .then(res => res.json())
            .then(data => {
                console.log('Battle result:', data);
                alert('Winner: ' + data.winner + '!');
            });
        }
        
        // Auto-refresh market data
        setInterval(() => {
            fetch('/api/market/materials')
                .then(res => res.json())
                .then(data => {
                    console.log('Market update:', data);
                });
        }, 60000);
    </script>
</body>
</html>`;
    }
    
    // Helper methods
    applyCustomizations(baseStats, customizations) {
        const stats = { ...baseStats };
        
        if (customizations.upgrades) {
            for (const [stat, value] of Object.entries(customizations.upgrades)) {
                if (stats[stat] !== undefined) {
                    stats[stat] += value;
                }
            }
        }
        
        return stats;
    }
    
    calculateCustomizationCost(customizations) {
        let cost = 0;
        
        if (customizations.upgrades) {
            for (const [stat, value] of Object.entries(customizations.upgrades)) {
                cost += value * 10000; // 10k per stat point
            }
        }
        
        if (customizations.flag && customizations.flag !== 'pirate_flag') {
            cost += 5000; // Premium flags cost extra
        }
        
        return cost;
    }
    
    calculateBuildTime(type) {
        const baseTimes = {
            sloop: 60,        // 1 minute
            frigate: 300,     // 5 minutes
            galleon: 900,     // 15 minutes
            submarine: 600,   // 10 minutes
            yacht: 180,       // 3 minutes
            destroyer: 1200   // 20 minutes
        };
        
        return baseTimes[type] || 60;
    }
    
    getFleet(userId) {
        const fleet = this.activeFleets.get(userId) || [];
        return fleet.map(shipId => this.ships.get(shipId)).filter(Boolean);
    }
    
    addToFleet(userId, shipId) {
        if (!this.activeFleets.has(userId)) {
            this.activeFleets.set(userId, []);
        }
        this.activeFleets.get(userId).push(shipId);
    }
    
    checkAvailability(type) {
        // Could check inventory, build queue, etc.
        return true;
    }
    
    calculateEfficiency(shipData) {
        const { speed, cargo, firepower } = shipData.baseStats;
        return (speed * 2 + cargo + firepower) / 4;
    }
    
    findBest(ships, path) {
        let best = null;
        let bestValue = -1;
        
        for (const [type, data] of Object.entries(ships)) {
            const value = path.split('.').reduce((obj, key) => obj[key], data);
            if (value > bestValue) {
                bestValue = value;
                best = type;
            }
        }
        
        return best;
    }
    
    findBestValue(ships) {
        let best = null;
        let bestRatio = -1;
        
        for (const [type, data] of Object.entries(ships)) {
            const ratio = data.efficiency / (data.currentPrice / 10000);
            if (ratio > bestRatio) {
                bestRatio = ratio;
                best = type;
            }
        }
        
        return best;
    }
    
    calculateOverallWinner(ships) {
        const scores = {};
        
        for (const [type, data] of Object.entries(ships)) {
            scores[type] = 
                data.baseStats.speed * 2 +
                data.baseStats.armor * 1.5 +
                data.baseStats.firepower * 2 +
                data.baseStats.cargo * 1 +
                (50000 / data.currentPrice) * 10;
        }
        
        return Object.entries(scores)
            .sort((a, b) => b[1] - a[1])[0][0];
    }
    
    getComponentAttachment(component) {
        const attachments = {
            'small_hull': { position: { x: 0, y: 0, z: 0 } },
            'speed_sail': { position: { x: 0, y: 5, z: 0 } },
            'light_cannon': { position: { x: 2, y: 1, z: 0 } },
            'pirate_flag': { position: { x: 0, y: 10, z: -5 } }
        };
        
        return attachments[component] || { position: { x: 0, y: 0, z: 0 } };
    }
    
    calculateCurrentSpeed(ship) {
        const baseSpeed = ship.stats.speed;
        const conditionMultiplier = ship.condition / 100;
        const cargoMultiplier = 1 - (ship.cargo.length / ship.stats.cargo) * 0.3;
        
        return Math.floor(baseSpeed * conditionMultiplier * cargoMultiplier);
    }
    
    getConditionClass(condition) {
        if (condition >= 80) return 'excellent';
        if (condition >= 60) return 'good';
        if (condition >= 40) return 'fair';
        if (condition >= 20) return 'poor';
        return 'critical';
    }
    
    getCurrentWeather() {
        const weather = ['clear', 'cloudy', 'rainy', 'stormy', 'foggy'];
        return weather[Math.floor(Math.random() * weather.length)];
    }
    
    getLightingConditions() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 20) return 'evening';
        return 'night';
    }
    
    getMaterialCostMultiplier() {
        // Simulate market fluctuation
        return 0.8 + Math.random() * 0.4;
    }
    
    getRarityMultiplier(type) {
        const rarity = {
            sloop: 1.0,
            frigate: 1.1,
            galleon: 1.3,
            submarine: 1.5,
            yacht: 1.2,
            destroyer: 2.0
        };
        
        return rarity[type] || 1.0;
    }
    
    updateShipPosition(shipId) {
        const ship = this.ships.get(shipId);
        if (!ship) return;
        
        // Simple movement simulation
        const speed = this.calculateCurrentSpeed(ship);
        const direction = ship.heading || 0;
        
        ship.location.x += Math.cos(direction) * speed * 0.1;
        ship.location.z += Math.sin(direction) * speed * 0.1;
        
        this.emit('ship_position_update', {
            shipId,
            location: ship.location
        });
    }
    
    async loadShipData() {
        // In production, load from database
        console.log('📚 Loading ship data...');
    }
    
    async handleWebSocketMessage(ws, message, connectionId) {
        switch (message.type) {
            case 'get_ship':
                const ship = this.ships.get(message.shipId);
                ws.send(JSON.stringify({
                    type: 'ship_data',
                    ship: ship ? this.generateShipTemplate(ship) : null
                }));
                break;
                
            case 'subscribe_fleet':
                // Subscribe to fleet updates
                this.on('ship_position_update', (data) => {
                    if (this.getFleet(message.userId).some(s => s.id === data.shipId)) {
                        ws.send(JSON.stringify({
                            type: 'fleet_update',
                            data
                        }));
                    }
                });
                break;
                
            case 'update_flag':
                const updatedShip = this.ships.get(message.shipId);
                if (updatedShip) {
                    updatedShip.flag = this.createCustomFlag(message.flag, message.colors);
                    ws.send(JSON.stringify({
                        type: 'flag_updated',
                        shipId: message.shipId,
                        flag: updatedShip.flag
                    }));
                }
                break;
        }
    }
}

module.exports = ShipTemplateBridge;

// Start if run directly
if (require.main === module) {
    const bridge = new ShipTemplateBridge();
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Ship Template Bridge...');
        process.exit(0);
    });
}