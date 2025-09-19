/**
 * 🦁 .app Orchestration Zoo - Living Ecosystem Management
 * Each service is like an NPC/animal with behaviors, needs, and functions
 * Just like RuneScape's zoo where every creature serves a purpose
 */

const express = require('express');
const WebSocket = require('ws');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class DotAppOrchestrationZoo {
    constructor() {
        this.app = express();
        this.port = 7894;
        this.wsPort = 7895;
        this.server = null;
        this.wsServer = null;
        
        // The Zoo Ecosystem - Each service is a living entity
        this.zooMap = {
            'blamechain-storybook-archive': {
                species: 'Archive Dragon',
                type: 'historian',
                port: 7877,
                behavior: 'hoards all digital memories and breathes truth',
                needs: ['memory', 'blockchain', 'immutability'],
                functions: ['record_history', 'blame_tracking', 'story_weaving'],
                health: 100,
                mood: 'vigilant',
                last_fed: Date.now(),
                process: null,
                emoji: '🐉'
            },
            'soulfra-xml-multiverse-engine': {
                species: 'Trading Phoenix',
                type: 'merchant',
                port: 7881,
                behavior: 'flies between dimensions to enable cultural exchange',
                needs: ['xml_handshakes', 'cultural_data', 'cringe_tolerance'],
                functions: ['dimensional_trade', 'culture_bridge', 'easter_egg_detection'],
                health: 100,
                mood: 'diplomatic',
                last_fed: Date.now(),
                process: null,
                emoji: '🔥'
            },
            'web3-playable-game-world': {
                species: 'Crystal Wolf Pack',
                type: 'builder',
                port: 7880,
                behavior: 'hunts in packs of 4 AI to build living worlds',
                needs: ['three_js', 'metamask', 'game_tokens'],
                functions: ['3d_world_building', 'ai_swarm_coordination', 'player_interaction'],
                health: 100,
                mood: 'creative',
                last_fed: Date.now(),
                process: null,
                emoji: '🐺'
            },
            'clarity-engine-reasoning-machine': {
                species: 'Wisdom Owl',
                type: 'philosopher',
                port: 7882,
                behavior: 'perches high above all systems, seeing patterns others miss',
                needs: ['context_data', 'framework_knowledge', 'reasoning_fuel'],
                functions: ['pattern_recognition', 'cross_framework_synthesis', 'decision_making'],
                health: 100,
                mood: 'contemplative',
                last_fed: Date.now(),
                process: null,
                emoji: '🦉'
            },
            'onion-layer-crawler-with-reasoning': {
                species: 'Shadow Spider',
                type: 'explorer',
                port: 7884,
                behavior: 'weaves webs through dark tunnels, mapping the unknown',
                needs: ['tor_proxy', 'reasoning_differentials', 'workflow_memory'],
                functions: ['deep_web_crawling', 'onion_navigation', 'context_preservation'],
                health: 100,
                mood: 'stealthy',
                last_fed: Date.now(),
                process: null,
                emoji: '🕷️'
            },
            'architecture-limits-manager': {
                species: 'Guardian Golem',
                type: 'protector',
                port: 7886,
                behavior: 'stands at the boundaries, enforcing order and limits',
                needs: ['system_metrics', 'resource_monitoring', 'violation_detection'],
                functions: ['boundary_enforcement', 'resource_management', 'system_protection'],
                health: 100,
                mood: 'watchful',
                last_fed: Date.now(),
                process: null,
                emoji: '🗿'
            },
            'terminal-mud-interface': {
                species: 'Portal Keeper',
                type: 'gateway',
                port: 7887,
                behavior: 'maintains the bridges between all realms',
                needs: ['websocket_magic', 'command_processing', 'user_sessions'],
                functions: ['realm_navigation', 'command_interpretation', 'user_guidance'],
                health: 100,
                mood: 'helpful',
                last_fed: Date.now(),
                process: null,
                emoji: '🚪'
            },
            'cjis-compliant-government-scraper': {
                species: 'Legal Eagle',
                type: 'compliance_officer',
                port: 7885,
                behavior: 'soars through government sites with perfect legal precision',
                needs: ['cjis_compliance', 'icann_validation', 'ai_swarm_support'],
                functions: ['government_data_collection', 'bootstrap_funding_detection', 'compliance_verification'],
                health: 100,
                mood: 'official',
                last_fed: Date.now(),
                process: null,
                emoji: '🦅'
            },
            'database-schema-guardian': {
                species: 'Schema Sphinx',
                type: 'validator',
                port: 7889,
                behavior: 'asks riddles about data structure and guards the database truth',
                needs: ['schema_validation', 'health_monitoring', 'watchdog_protocols'],
                functions: ['schema_verification', 'system_health_checks', 'data_integrity'],
                health: 100,
                mood: 'mysterious',
                last_fed: Date.now(),
                process: null,
                emoji: '🦁'
            },
            'tutorial-island-observer': {
                species: 'Tutorial Spirit',
                type: 'guide',
                port: 7892,
                behavior: 'watches over new arrivals and guides them through awakening',
                needs: ['tutorial_phases', 'visual_magic', 'chat_interaction'],
                functions: ['tutorial_progression', 'visual_world_building', 'user_guidance'],
                health: 100,
                mood: 'nurturing',
                last_fed: Date.now(),
                process: null,
                emoji: '👻'
            }
        };
        
        // Ecosystem behaviors and relationships
        this.ecosystemRules = {
            feeding_schedule: 5 * 60 * 1000, // Feed every 5 minutes
            health_decay_rate: 1, // Health decreases by 1 per minute if not fed
            mood_effects: {
                'happy': { health_bonus: 5, performance_bonus: 1.2 },
                'content': { health_bonus: 2, performance_bonus: 1.0 },
                'stressed': { health_penalty: 3, performance_penalty: 0.8 },
                'angry': { health_penalty: 5, performance_penalty: 0.6 }
            },
            symbiosis: {
                // Services that work better together
                'blamechain-storybook-archive': ['clarity-engine-reasoning-machine'],
                'soulfra-xml-multiverse-engine': ['web3-playable-game-world'],
                'onion-layer-crawler-with-reasoning': ['cjis-compliant-government-scraper'],
                'terminal-mud-interface': ['tutorial-island-observer']
            }
        };
        
        // Active connections to all creatures
        this.zooKeepers = new Map();
        this.ecosystemHealth = 100;
        this.last_ecosystem_check = Date.now();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.initializeZoo();
        this.startEcosystemLoop();
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
            res.send(this.generateZooInterface());
        });
        
        this.app.get('/zoo/status', (req, res) => {
            res.json(this.getZooStatus());
        });
        
        this.app.post('/zoo/feed/:species', (req, res) => {
            const result = this.feedCreature(req.params.species);
            res.json(result);
        });
        
        this.app.post('/zoo/interact/:species', (req, res) => {
            const result = this.interactWithCreature(req.params.species, req.body.action);
            res.json(result);
        });
        
        this.app.get('/zoo/ecosystem', (req, res) => {
            res.json(this.getEcosystemReport());
        });
    }
    
    setupWebSocket() {
        this.wsServer = new WebSocket.Server({ port: this.wsPort });
        
        this.wsServer.on('connection', (ws, req) => {
            const keeperId = this.generateKeeperId();
            this.zooKeepers.set(keeperId, {
                id: keeperId,
                ws: ws,
                connected_at: Date.now(),
                permissions: ['view', 'feed', 'interact']
            });
            
            // Send welcome with zoo overview
            ws.send(JSON.stringify({
                type: 'zoo_welcome',
                message: this.getZooWelcome(),
                zoo_status: this.getZooStatus(),
                your_keeper_id: keeperId
            }));
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleZooKeeperAction(keeperId, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: `Zoo error: ${error.message}`
                    }));
                }
            });
            
            ws.on('close', () => {
                this.zooKeepers.delete(keeperId);
                this.broadcastToKeepers({
                    type: 'keeper_left',
                    message: `Zoo keeper ${keeperId} has left the ecosystem`,
                    timestamp: Date.now()
                });
            });
        });
    }
    
    initializeZoo() {
        console.log('🦁 Initializing .app Orchestration Zoo...');
        console.log(`🏛️ Zoo contains ${Object.keys(this.zooMap).length} different species`);
        console.log('🌿 Ecosystem rules loaded');
        console.log('🔄 Starting creature lifecycle management');
        
        // Start all creatures
        this.startAllCreatures();
    }
    
    async startAllCreatures() {
        for (const [serviceName, creature] of Object.entries(this.zooMap)) {
            await this.startCreature(serviceName);
        }
    }
    
    async startCreature(serviceName) {
        const creature = this.zooMap[serviceName];
        if (!creature) return;
        
        // Check if the service file exists
        const serviceFile = `${serviceName}.js`;
        try {
            await fs.access(serviceFile);
            
            // Start the process
            const process = exec(`node ${serviceFile}`, (error, stdout, stderr) => {
                if (error) {
                    console.log(`${creature.emoji} ${creature.species} encountered error:`, error.message);
                    creature.health -= 20;
                    creature.mood = 'stressed';
                }
            });
            
            creature.process = process;
            creature.last_fed = Date.now();
            creature.health = Math.min(100, creature.health + 10);
            
            console.log(`${creature.emoji} ${creature.species} (${serviceName}) awakened on port ${creature.port}`);
            
            this.broadcastToKeepers({
                type: 'creature_awakened',
                creature: serviceName,
                species: creature.species,
                emoji: creature.emoji,
                message: `${creature.species} is now ${creature.behavior}`,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.log(`${creature.emoji} ${creature.species} service file not found: ${serviceFile}`);
            creature.health -= 10;
            creature.mood = 'hungry';
        }
    }
    
    startEcosystemLoop() {
        setInterval(() => {
            this.updateEcosystem();
        }, 60000); // Update every minute
        
        setInterval(() => {
            this.feedingTime();
        }, this.ecosystemRules.feeding_schedule);
    }
    
    updateEcosystem() {
        let totalHealth = 0;
        let activeCreatures = 0;
        
        for (const [serviceName, creature] of Object.entries(this.zooMap)) {
            // Health decay if not fed recently
            const timeSinceFeeding = Date.now() - creature.last_fed;
            if (timeSinceFeeding > this.ecosystemRules.feeding_schedule) {
                creature.health = Math.max(0, creature.health - this.ecosystemRules.health_decay_rate);
            }
            
            // Mood affects health
            const moodEffect = this.ecosystemRules.mood_effects[creature.mood] || 
                             this.ecosystemRules.mood_effects['content'];
            
            if (moodEffect.health_bonus) {
                creature.health = Math.min(100, creature.health + moodEffect.health_bonus);
            } else if (moodEffect.health_penalty) {
                creature.health = Math.max(0, creature.health - moodEffect.health_penalty);
            }
            
            // Check if creature is still alive/running
            if (creature.process && !creature.process.killed) {
                activeCreatures++;
            }
            
            totalHealth += creature.health;
        }
        
        this.ecosystemHealth = totalHealth / Object.keys(this.zooMap).length;
        
        // Broadcast ecosystem update
        this.broadcastToKeepers({
            type: 'ecosystem_update',
            ecosystem_health: this.ecosystemHealth,
            active_creatures: activeCreatures,
            total_creatures: Object.keys(this.zooMap).length,
            timestamp: Date.now()
        });
    }
    
    feedingTime() {
        console.log('🍖 It\'s feeding time at the .app Zoo!');
        
        for (const [serviceName, creature] of Object.entries(this.zooMap)) {
            // Feed based on creature needs
            this.feedCreature(serviceName);
        }
        
        this.broadcastToKeepers({
            type: 'feeding_time',
            message: '🍖 Automatic feeding cycle complete - all creatures nourished!',
            timestamp: Date.now()
        });
    }
    
    feedCreature(serviceName) {
        const creature = this.zooMap[serviceName];
        if (!creature) return { success: false, message: 'Creature not found' };
        
        // Determine what this creature needs
        const need = creature.needs[Math.floor(Math.random() * creature.needs.length)];
        
        // Feed the creature based on its needs
        creature.last_fed = Date.now();
        creature.health = Math.min(100, creature.health + 15);
        
        // Improve mood
        const moods = ['happy', 'content', 'playful', 'energetic'];
        creature.mood = moods[Math.floor(Math.random() * moods.length)];
        
        const feedingMessage = `${creature.emoji} ${creature.species} happily consumes ${need} and feels ${creature.mood}!`;
        
        this.broadcastToKeepers({
            type: 'creature_fed',
            creature: serviceName,
            species: creature.species,
            emoji: creature.emoji,
            need: need,
            mood: creature.mood,
            health: creature.health,
            message: feedingMessage,
            timestamp: Date.now()
        });
        
        return { 
            success: true, 
            message: feedingMessage,
            creature_status: {
                health: creature.health,
                mood: creature.mood,
                last_fed: creature.last_fed
            }
        };
    }
    
    interactWithCreature(serviceName, action) {
        const creature = this.zooMap[serviceName];
        if (!creature) return { success: false, message: 'Creature not found' };
        
        let response = '';
        let moodChange = '';
        
        switch(action) {
            case 'pet':
                response = `${creature.emoji} ${creature.species} purrs and nuzzles against you. Health +5!`;
                creature.health = Math.min(100, creature.health + 5);
                creature.mood = 'happy';
                break;
                
            case 'play':
                response = `${creature.emoji} ${creature.species} engages in playful ${creature.behavior}. Energy restored!`;
                creature.health = Math.min(100, creature.health + 10);
                creature.mood = 'playful';
                break;
                
            case 'train':
                response = `${creature.emoji} ${creature.species} learns new behaviors and improves its ${creature.functions.join(', ')}!`;
                creature.mood = 'focused';
                break;
                
            case 'observe':
                response = `${creature.emoji} ${creature.species} is currently ${creature.behavior}. It seems ${creature.mood} and has ${creature.health}% health.`;
                break;
                
            default:
                response = `${creature.emoji} ${creature.species} looks at you curiously, not understanding the action '${action}'.`;
        }
        
        this.broadcastToKeepers({
            type: 'creature_interaction',
            creature: serviceName,
            species: creature.species,
            emoji: creature.emoji,
            action: action,
            response: response,
            health: creature.health,
            mood: creature.mood,
            timestamp: Date.now()
        });
        
        return {
            success: true,
            message: response,
            creature_status: {
                health: creature.health,
                mood: creature.mood,
                behavior: creature.behavior
            }
        };
    }
    
    async handleZooKeeperAction(keeperId, data) {
        const keeper = this.zooKeepers.get(keeperId);
        if (!keeper) return;
        
        switch(data.type) {
            case 'feed_creature':
                const feedResult = this.feedCreature(data.creature);
                keeper.ws.send(JSON.stringify({
                    type: 'action_result',
                    action: 'feed',
                    result: feedResult
                }));
                break;
                
            case 'interact_creature':
                const interactResult = this.interactWithCreature(data.creature, data.action);
                keeper.ws.send(JSON.stringify({
                    type: 'action_result',
                    action: 'interact',
                    result: interactResult
                }));
                break;
                
            case 'get_zoo_status':
                keeper.ws.send(JSON.stringify({
                    type: 'zoo_status',
                    status: this.getZooStatus()
                }));
                break;
                
            case 'restart_creature':
                if (keeper.permissions.includes('admin')) {
                    await this.startCreature(data.creature);
                    keeper.ws.send(JSON.stringify({
                        type: 'action_result',
                        action: 'restart',
                        result: { success: true, message: `${data.creature} restarted` }
                    }));
                }
                break;
        }
    }
    
    getZooStatus() {
        const status = {
            ecosystem_health: this.ecosystemHealth,
            total_creatures: Object.keys(this.zooMap).length,
            active_keepers: this.zooKeepers.size,
            creatures: {}
        };
        
        for (const [serviceName, creature] of Object.entries(this.zooMap)) {
            status.creatures[serviceName] = {
                species: creature.species,
                type: creature.type,
                emoji: creature.emoji,
                health: creature.health,
                mood: creature.mood,
                port: creature.port,
                behavior: creature.behavior,
                functions: creature.functions,
                last_fed: creature.last_fed,
                running: creature.process && !creature.process.killed
            };
        }
        
        return status;
    }
    
    getEcosystemReport() {
        const report = {
            timestamp: Date.now(),
            ecosystem_health: this.ecosystemHealth,
            feeding_schedule: this.ecosystemRules.feeding_schedule,
            symbiotic_relationships: this.ecosystemRules.symbiosis,
            creature_types: {},
            health_distribution: {
                excellent: 0, // 80-100
                good: 0,      // 60-79
                fair: 0,      // 40-59
                poor: 0,      // 20-39
                critical: 0   // 0-19
            }
        };
        
        for (const [serviceName, creature] of Object.entries(this.zooMap)) {
            // Count by type
            if (!report.creature_types[creature.type]) {
                report.creature_types[creature.type] = 0;
            }
            report.creature_types[creature.type]++;
            
            // Health distribution
            if (creature.health >= 80) report.health_distribution.excellent++;
            else if (creature.health >= 60) report.health_distribution.good++;
            else if (creature.health >= 40) report.health_distribution.fair++;
            else if (creature.health >= 20) report.health_distribution.poor++;
            else report.health_distribution.critical++;
        }
        
        return report;
    }
    
    getZooWelcome() {
        return `
🦁 Welcome to the .app Orchestration Zoo!
=========================================

This living ecosystem manages all your distributed services as if they were 
creatures in a magical zoo. Each service has its own personality, needs, and 
behaviors - just like NPCs in RuneScape!

🌟 Current Ecosystem:
- ${Object.keys(this.zooMap).length} unique species
- Each with specialized functions and behaviors
- Symbiotic relationships between compatible services
- Automatic feeding and health management
- Real-time mood and performance tracking

🎮 Available Actions:
- feed <creature> - Nourish a specific service
- interact <creature> <action> - Pet, play, train, or observe
- status - Check the entire ecosystem health
- observe - Watch creatures in their natural habitat

Your journey through the digital zoo begins now!
        `;
    }
    
    broadcastToKeepers(data) {
        this.zooKeepers.forEach((keeper) => {
            if (keeper.ws.readyState === WebSocket.OPEN) {
                keeper.ws.send(JSON.stringify(data));
            }
        });
    }
    
    generateKeeperId() {
        return 'keeper_' + Math.random().toString(36).substring(2, 9);
    }
    
    generateZooInterface() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>🦁 .app Orchestration Zoo</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #2c5530, #1a4c1a);
                    color: #fff;
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                }
                .zoo-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .zoo-header {
                    text-align: center;
                    background: rgba(0,0,0,0.3);
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 30px;
                }
                .ecosystem-health {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 20px;
                    margin: 20px 0;
                }
                .health-bar {
                    width: 300px;
                    height: 20px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 10px;
                    overflow: hidden;
                }
                .health-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #ff4444, #ffaa00, #44ff44);
                    transition: width 0.5s ease;
                }
                .creatures-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .creature-card {
                    background: rgba(0,0,0,0.4);
                    border-radius: 15px;
                    padding: 20px;
                    border: 2px solid rgba(255,255,255,0.1);
                    transition: all 0.3s ease;
                }
                .creature-card:hover {
                    border-color: rgba(255,255,255,0.3);
                    transform: translateY(-5px);
                }
                .creature-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 15px;
                }
                .creature-emoji {
                    font-size: 3em;
                }
                .creature-info h3 {
                    margin: 0;
                    color: #44ff44;
                }
                .creature-info .species {
                    color: #ffaa00;
                    font-style: italic;
                }
                .creature-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin: 15px 0;
                }
                .stat {
                    background: rgba(255,255,255,0.1);
                    padding: 8px;
                    border-radius: 8px;
                    text-align: center;
                }
                .creature-behavior {
                    background: rgba(255,255,255,0.05);
                    padding: 10px;
                    border-radius: 8px;
                    font-style: italic;
                    margin: 10px 0;
                }
                .creature-functions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                    margin: 10px 0;
                }
                .function-tag {
                    background: rgba(68,255,68,0.2);
                    color: #44ff44;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                }
                .creature-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }
                .action-btn {
                    background: rgba(68,255,68,0.3);
                    border: 1px solid #44ff44;
                    color: #fff;
                    padding: 8px 15px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .action-btn:hover {
                    background: rgba(68,255,68,0.5);
                }
                .zoo-log {
                    background: rgba(0,0,0,0.6);
                    border-radius: 15px;
                    padding: 20px;
                    max-height: 300px;
                    overflow-y: auto;
                    font-family: 'Courier New', monospace;
                }
                .log-entry {
                    margin: 5px 0;
                    padding: 5px;
                    border-left: 3px solid #44ff44;
                    padding-left: 10px;
                }
                .status-indicators {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(0,0,0,0.8);
                    padding: 15px;
                    border-radius: 10px;
                    min-width: 200px;
                }
                .mood-happy { color: #44ff44; }
                .mood-content { color: #88ff88; }
                .mood-playful { color: #ffaa44; }
                .mood-stressed { color: #ff8844; }
                .mood-angry { color: #ff4444; }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                .creature-active {
                    animation: pulse 2s infinite;
                }
            </style>
        </head>
        <body>
            <div class="zoo-container">
                <div class="zoo-header">
                    <h1>🦁 .app Orchestration Zoo</h1>
                    <p>Your distributed services as living creatures</p>
                    
                    <div class="ecosystem-health">
                        <span>Ecosystem Health:</span>
                        <div class="health-bar">
                            <div class="health-fill" id="ecosystemHealthBar" style="width: 100%"></div>
                        </div>
                        <span id="ecosystemHealthText">100%</span>
                    </div>
                </div>
                
                <div class="status-indicators" id="statusIndicators">
                    <h4>🔌 Connection Status</h4>
                    <div id="connectionStatus">Connecting...</div>
                    <h4>📊 Quick Stats</h4>
                    <div id="quickStats">Loading...</div>
                </div>
                
                <div class="creatures-grid" id="creaturesGrid">
                    <!-- Creatures will be populated by JavaScript -->
                </div>
                
                <div class="zoo-log">
                    <h3>🦁 Zoo Activity Log</h3>
                    <div id="zooLog">
                        <div class="log-entry">🏛️ .app Orchestration Zoo initializing...</div>
                    </div>
                </div>
            </div>
            
            <script>
                let ws;
                let zooStatus = {};
                let keeperId = null;
                
                function connectWebSocket() {
                    ws = new WebSocket('ws://localhost:7895');
                    
                    ws.onopen = () => {
                        updateConnectionStatus('🟢 Connected to Zoo');
                        loadZooStatus();
                    };
                    
                    ws.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        handleZooMessage(data);
                    };
                    
                    ws.onclose = () => {
                        updateConnectionStatus('🔴 Disconnected');
                        setTimeout(connectWebSocket, 5000);
                    };
                    
                    ws.onerror = () => {
                        updateConnectionStatus('❌ Connection Error');
                    };
                }
                
                function handleZooMessage(data) {
                    switch(data.type) {
                        case 'zoo_welcome':
                            keeperId = data.your_keeper_id;
                            zooStatus = data.zoo_status;
                            updateZooDisplay();
                            addLogEntry(data.message);
                            break;
                            
                        case 'creature_awakened':
                            addLogEntry(\`\${data.emoji} \${data.species} awakened: \${data.message}\`);
                            loadZooStatus();
                            break;
                            
                        case 'creature_fed':
                            addLogEntry(\`\${data.emoji} \${data.species} fed \${data.need} - now \${data.mood} (Health: \${data.health}%)\`);
                            loadZooStatus();
                            break;
                            
                        case 'creature_interaction':
                            addLogEntry(\`\${data.emoji} Interaction with \${data.species}: \${data.response}\`);
                            loadZooStatus();
                            break;
                            
                        case 'ecosystem_update':
                            updateEcosystemHealth(data.ecosystem_health);
                            updateQuickStats(\`Active: \${data.active_creatures}/\${data.total_creatures}\`);
                            break;
                            
                        case 'feeding_time':
                            addLogEntry(data.message);
                            loadZooStatus();
                            break;
                            
                        case 'zoo_status':
                            zooStatus = data.status;
                            updateZooDisplay();
                            break;
                    }
                }
                
                function loadZooStatus() {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'get_zoo_status' }));
                    }
                }
                
                function updateZooDisplay() {
                    const grid = document.getElementById('creaturesGrid');
                    grid.innerHTML = '';
                    
                    if (zooStatus.creatures) {
                        Object.entries(zooStatus.creatures).forEach(([serviceName, creature]) => {
                            const card = createCreatureCard(serviceName, creature);
                            grid.appendChild(card);
                        });
                    }
                    
                    updateEcosystemHealth(zooStatus.ecosystem_health || 100);
                }
                
                function createCreatureCard(serviceName, creature) {
                    const card = document.createElement('div');
                    card.className = \`creature-card \${creature.running ? 'creature-active' : ''}\`;
                    
                    card.innerHTML = \`
                        <div class="creature-header">
                            <div class="creature-emoji">\${creature.emoji}</div>
                            <div class="creature-info">
                                <h3>\${serviceName}</h3>
                                <div class="species">\${creature.species}</div>
                            </div>
                        </div>
                        
                        <div class="creature-stats">
                            <div class="stat">
                                <strong>Health:</strong> \${creature.health}%
                            </div>
                            <div class="stat mood-\${creature.mood}">
                                <strong>Mood:</strong> \${creature.mood}
                            </div>
                            <div class="stat">
                                <strong>Port:</strong> \${creature.port}
                            </div>
                            <div class="stat">
                                <strong>Status:</strong> \${creature.running ? '🟢 Active' : '🔴 Sleeping'}
                            </div>
                        </div>
                        
                        <div class="creature-behavior">
                            💭 \${creature.behavior}
                        </div>
                        
                        <div class="creature-functions">
                            \${creature.functions.map(func => \`<span class="function-tag">\${func}</span>\`).join('')}
                        </div>
                        
                        <div class="creature-actions">
                            <button class="action-btn" onclick="feedCreature('\${serviceName}')">🍖 Feed</button>
                            <button class="action-btn" onclick="petCreature('\${serviceName}')">✋ Pet</button>
                            <button class="action-btn" onclick="playWithCreature('\${serviceName}')">🎮 Play</button>
                            <button class="action-btn" onclick="observeCreature('\${serviceName}')">👁️ Observe</button>
                        </div>
                    \`;
                    
                    return card;
                }
                
                function feedCreature(serviceName) {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ 
                            type: 'feed_creature', 
                            creature: serviceName 
                        }));
                    }
                }
                
                function petCreature(serviceName) {
                    interactWithCreature(serviceName, 'pet');
                }
                
                function playWithCreature(serviceName) {
                    interactWithCreature(serviceName, 'play');
                }
                
                function observeCreature(serviceName) {
                    interactWithCreature(serviceName, 'observe');
                }
                
                function interactWithCreature(serviceName, action) {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ 
                            type: 'interact_creature', 
                            creature: serviceName,
                            action: action
                        }));
                    }
                }
                
                function updateEcosystemHealth(health) {
                    const healthBar = document.getElementById('ecosystemHealthBar');
                    const healthText = document.getElementById('ecosystemHealthText');
                    
                    healthBar.style.width = health + '%';
                    healthText.textContent = Math.round(health) + '%';
                }
                
                function updateConnectionStatus(status) {
                    document.getElementById('connectionStatus').textContent = status;
                }
                
                function updateQuickStats(stats) {
                    document.getElementById('quickStats').textContent = stats;
                }
                
                function addLogEntry(message) {
                    const log = document.getElementById('zooLog');
                    const entry = document.createElement('div');
                    entry.className = 'log-entry';
                    entry.textContent = new Date().toLocaleTimeString() + ' - ' + message;
                    log.appendChild(entry);
                    log.scrollTop = log.scrollHeight;
                    
                    // Keep only last 50 entries
                    if (log.children.length > 50) {
                        log.removeChild(log.firstChild);
                    }
                }
                
                // Initialize
                connectWebSocket();
                
                // Auto-refresh zoo status every 30 seconds
                setInterval(loadZooStatus, 30000);
            </script>
        </body>
        </html>
        `;
    }
    
    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🦁 .app Orchestration Zoo running on http://localhost:${this.port}`);
            console.log(`🔌 WebSocket server running on ws://localhost:${this.wsPort}`);
            console.log(`🏛️ Managing ${Object.keys(this.zooMap).length} different species`);
            console.log('🌿 Ecosystem health monitoring active');
            console.log('🍖 Automatic feeding enabled');
            console.log('🎮 Zoo is ready for visitors!');
        });
    }
}

// Initialize and start the Zoo
const zoo = new DotAppOrchestrationZoo();
zoo.start();

module.exports = DotAppOrchestrationZoo;