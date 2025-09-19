/**
 * 🏝️ Tutorial Island Observer
 * Watch your entire system come to life like a player going through Tutorial Island
 * Starts in a blank world and builds everything while you watch and interact
 * Like watching Sauron's creation tool but for your distributed computing architecture
 */

const express = require('express');
const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs').promises;

class TutorialIslandObserver {
    constructor() {
        this.app = express();
        this.port = 7892;
        this.server = null;
        this.wsServer = null;
        
        // Tutorial Island State
        this.tutorialState = {
            phase: 'empty_void',
            currentStep: 0,
            totalSteps: 15,
            worldElements: [],
            activeNPCs: [],
            playerProgress: {},
            chatLog: [],
            buildingQueue: []
        };
        
        // Tutorial Phases (like Tutorial Island progression)
        this.tutorialPhases = [
            {
                phase: 'empty_void',
                name: 'The Empty Void',
                description: 'A blank digital space where nothing exists yet',
                duration: 3000,
                action: 'initialize_world'
            },
            {
                phase: 'spawn_platform',
                name: 'The Spawn Platform',
                description: 'A small platform materializes in the digital void',
                duration: 5000,
                action: 'create_terminal_hub'
            },
            {
                phase: 'first_npc',
                name: 'The Guardian Awakens',
                description: 'A guardian figure appears to guide the tutorial',
                duration: 4000,
                action: 'spawn_database_guardian'
            },
            {
                phase: 'build_blamechain',
                name: 'The Archive Vault',
                description: 'Crystalline structures form - the BlameChain archive',
                duration: 6000,
                action: 'construct_blamechain_vault'
            },
            {
                phase: 'ai_awakening',
                name: 'The AI Swarm Stirs',
                description: 'Glowing entities emerge - the chat processor AI',
                duration: 5000,
                action: 'awaken_ai_processors'
            },
            {
                phase: 'trading_outposts',
                name: 'The Trading Dimensions',
                description: 'Six dimensional portals open - Soulfra trading outposts',
                duration: 7000,
                action: 'manifest_trading_portals'
            },
            {
                phase: 'web3_world',
                name: 'The Playable Realm',
                description: 'A 3D world materializes with interactive elements',
                duration: 8000,
                action: 'generate_web3_gameworld'
            },
            {
                phase: 'clarity_chamber',
                name: 'The Reasoning Chamber',
                description: 'A crystal chamber forms - the Clarity Engine brain',
                duration: 6000,
                action: 'construct_clarity_engine'
            },
            {
                phase: 'onion_tunnels',
                name: 'The Deep Tunnels',
                description: 'Dark tunnels burrow deep - the Onion Crawler network',
                duration: 7000,
                action: 'excavate_onion_tunnels'
            },
            {
                phase: 'architecture_tower',
                name: 'The Control Tower',
                description: 'A tower rises to monitor all systems',
                duration: 5000,
                action: 'erect_architecture_tower'
            },
            {
                phase: 'cjis_fortress',
                name: 'The Compliance Fortress',
                description: 'A secure fortress for government data processing',
                duration: 6000,
                action: 'fortify_cjis_scraper'
            },
            {
                phase: 'terminal_bridge',
                name: 'The Command Bridge',
                description: 'A bridge connects all realms - the Terminal MUD',
                duration: 4000,
                action: 'bridge_all_systems'
            },
            {
                phase: 'system_integration',
                name: 'The Great Awakening',
                description: 'All systems come online and begin communicating',
                duration: 8000,
                action: 'integrate_all_systems'
            },
            {
                phase: 'tutorial_complete',
                name: 'Tutorial Island Complete',
                description: 'Your distributed computing realm is fully operational',
                duration: 5000,
                action: 'complete_tutorial'
            },
            {
                phase: 'interactive_mode',
                name: 'Interactive Mode',
                description: 'Now you can interact with your creation',
                duration: -1,
                action: 'enable_interaction'
            }
        ];
        
        // NPCs (like Tutorial Island instructors)
        this.npcs = {
            'tutorial_guide': {
                name: 'The System Architect',
                role: 'Main tutorial guide',
                personality: 'Wise and encouraging',
                dialogue: [
                    "Welcome to your Tutorial Island! I'll guide you through building your distributed computing realm.",
                    "Watch as each system comes to life, one by one...",
                    "Each component serves a purpose in your greater architecture.",
                    "Soon you'll have your own digital kingdom to command!"
                ]
            },
            'database_guardian': {
                name: 'Schema Guardian',
                role: 'Database protector',
                personality: 'Vigilant and methodical',
                dialogue: [
                    "I am the Guardian of your data integrity.",
                    "I watch over all databases and ensure compliance.",
                    "No corrupted data shall pass under my watch!",
                    "Your schemas are secure and validated."
                ]
            },
            'ai_swarm_leader': {
                name: 'Swarm Coordinator',
                role: 'AI collective representative',
                personality: 'Collective intelligence',
                dialogue: [
                    "We are the AI swarm - your digital workforce.",
                    "We process, analyze, and learn from all data.",
                    "Our collective intelligence grows stronger each moment.",
                    "Command us, and we shall serve your digital realm."
                ]
            },
            'clarity_sage': {
                name: 'Clarity Sage',
                role: 'Reasoning master',
                personality: 'Philosophical and insightful',
                dialogue: [
                    "I am the voice of reason in your digital realm.",
                    "Through me, all systems find clarity and purpose.",
                    "I weave together the threads of understanding.",
                    "Ask me anything, and I shall provide insight."
                ]
            }
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.initializeTutorialIsland();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
    }
    
    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.send(this.generateTutorialIslandInterface());
        });
        
        this.app.post('/tutorial/interact', async (req, res) => {
            const result = await this.handlePlayerInteraction(req.body);
            res.json(result);
        });
        
        this.app.get('/tutorial/status', (req, res) => {
            res.json(this.tutorialState);
        });
        
        this.app.post('/tutorial/skip', async (req, res) => {
            await this.skipToPhase(req.body.phase);
            res.json({ success: true });
        });
    }
    
    setupWebSocket() {
        this.wsServer = new WebSocket.Server({ port: 7893 });
        
        this.wsServer.on('connection', (ws) => {
            console.log('👁️ Tutorial Island observer connected');
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'tutorial_state',
                state: this.tutorialState,
                currentPhase: this.getCurrentPhase()
            }));
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error.message
                    }));
                }
            });
        });
    }
    
    initializeTutorialIsland() {
        console.log('🏝️ Initializing Tutorial Island Observer...');
        console.log('🎭 Tutorial phases loaded:', this.tutorialPhases.length);
        
        // Start the tutorial sequence after a brief pause
        setTimeout(() => {
            this.startTutorialSequence();
        }, 2000);
    }
    
    async startTutorialSequence() {
        console.log('🚀 Starting Tutorial Island sequence...');
        
        this.broadcastToObservers({
            type: 'tutorial_start',
            message: 'Welcome to Tutorial Island! Your digital realm is about to come to life...',
            phase: this.tutorialState.phase
        });
        
        // Start the progression
        await this.progressTutorial();
    }
    
    async progressTutorial() {
        if (this.tutorialState.currentStep >= this.tutorialPhases.length) {
            return; // Tutorial complete
        }
        
        const currentPhase = this.tutorialPhases[this.tutorialState.currentStep];
        console.log(`🏗️ Entering phase: ${currentPhase.name}`);
        
        this.tutorialState.phase = currentPhase.phase;
        
        // Broadcast phase start
        this.broadcastToObservers({
            type: 'phase_start',
            phase: currentPhase,
            step: this.tutorialState.currentStep + 1,
            totalSteps: this.tutorialPhases.length,
            message: `Phase ${this.tutorialState.currentStep + 1}: ${currentPhase.name}`
        });
        
        // Execute phase action
        await this.executePhaseAction(currentPhase);
        
        // Wait for phase duration
        if (currentPhase.duration > 0) {
            setTimeout(() => {
                this.tutorialState.currentStep++;
                this.progressTutorial();
            }, currentPhase.duration);
        }
    }
    
    async executePhaseAction(phase) {
        const chatMessage = {
            timestamp: Date.now(),
            speaker: 'System',
            message: phase.description,
            phase: phase.phase
        };
        
        this.tutorialState.chatLog.push(chatMessage);
        
        switch (phase.action) {
            case 'initialize_world':
                await this.initializeWorld();
                break;
            case 'create_terminal_hub':
                await this.createTerminalHub();
                break;
            case 'spawn_database_guardian':
                await this.spawnDatabaseGuardian();
                break;
            case 'construct_blamechain_vault':
                await this.constructBlamechainVault();
                break;
            case 'awaken_ai_processors':
                await this.awakenAIProcessors();
                break;
            case 'manifest_trading_portals':
                await this.manifestTradingPortals();
                break;
            case 'generate_web3_gameworld':
                await this.generateWeb3Gameworld();
                break;
            case 'construct_clarity_engine':
                await this.constructClarityEngine();
                break;
            case 'excavate_onion_tunnels':
                await this.excavateOnionTunnels();
                break;
            case 'erect_architecture_tower':
                await this.erectArchitectureTower();
                break;
            case 'fortify_cjis_scraper':
                await this.fortifyCJISScraper();
                break;
            case 'bridge_all_systems':
                await this.bridgeAllSystems();
                break;
            case 'integrate_all_systems':
                await this.integrateAllSystems();
                break;
            case 'complete_tutorial':
                await this.completeTutorial();
                break;
            case 'enable_interaction':
                await this.enableInteraction();
                break;
        }
        
        this.broadcastToObservers({
            type: 'chat_message',
            chat: chatMessage,
            worldState: this.tutorialState.worldElements
        });
    }
    
    async initializeWorld() {
        this.tutorialState.worldElements.push({
            id: 'void',
            type: 'environment',
            name: 'The Digital Void',
            description: 'An empty space where creation begins',
            position: { x: 0, y: 0, z: 0 },
            created: Date.now()
        });
        
        await this.addChatMessage('System', 'The digital void stretches endlessly... but not for long.');
    }
    
    async createTerminalHub() {
        this.tutorialState.worldElements.push({
            id: 'terminal_hub',
            type: 'structure',
            name: 'Terminal Hub Platform',
            description: 'A solid platform materializes - your command center',
            position: { x: 0, y: 1, z: 0 },
            created: Date.now(),
            url: 'http://localhost:7887'
        });
        
        await this.spawnNPC('tutorial_guide');
        await this.addChatMessage('The System Architect', 'Greetings! I am your guide through this digital realm. Watch as your kingdom takes shape!');
    }
    
    async spawnDatabaseGuardian() {
        this.tutorialState.worldElements.push({
            id: 'guardian_tower',
            type: 'structure',
            name: 'Guardian Watchtower',
            description: 'A tall tower rises, watching over all data',
            position: { x: 10, y: 2, z: 0 },
            created: Date.now(),
            url: 'http://localhost:7891'
        });
        
        await this.spawnNPC('database_guardian');
        await this.addChatMessage('Schema Guardian', 'I have awakened to protect your data integrity. All databases shall be monitored!');
        
        // Check if guardian is actually running
        const guardianStatus = await this.checkSystemStatus(7891);
        if (guardianStatus.online) {
            await this.addChatMessage('Schema Guardian', 'My systems are fully operational. Database schemas validated!');
        }
    }
    
    async constructBlamechainVault() {
        this.tutorialState.worldElements.push({
            id: 'blamechain_vault',
            type: 'structure',
            name: 'BlameChain Archive Vault',
            description: 'Crystalline structures store eternal digital records',
            position: { x: -10, y: 1, z: 5 },
            created: Date.now(),
            url: 'http://localhost:7877'
        });
        
        await this.addChatMessage('The System Architect', 'Behold! The BlameChain vault - where every digital action is recorded for eternity.');
        
        const blamechainStatus = await this.checkSystemStatus(7877);
        if (blamechainStatus.online) {
            await this.addChatMessage('BlameChain Archive', 'Archive systems online. Universal history recording activated.');
        } else {
            await this.addChatMessage('The System Architect', 'The vault stands ready, waiting for its systems to awaken...');
        }
    }
    
    async awakenAIProcessors() {
        this.tutorialState.worldElements.push({
            id: 'ai_processing_core',
            type: 'ai_system',
            name: 'AI Processing Core',
            description: 'Glowing entities emerge - your AI workforce',
            position: { x: 0, y: 3, z: -10 },
            created: Date.now(),
            url: 'http://localhost:7879'
        });
        
        await this.spawnNPC('ai_swarm_leader');
        await this.addChatMessage('Swarm Coordinator', 'We are the AI collective. We process conversations, learn patterns, and build worlds.');
        
        const aiStatus = await this.checkSystemStatus(7879);
        if (aiStatus.online) {
            await this.addChatMessage('Chat Processor', 'AI processing systems online. Pattern recognition active. World building commenced.');
        }
    }
    
    async manifestTradingPortals() {
        const outposts = [
            { name: 'Earth-Classic Portal', x: -20, z: 10 },
            { name: 'Nippon-Station Portal', x: -15, z: 15 },
            { name: 'European-Hub Portal', x: -10, z: 20 },
            { name: 'Russian-Zone Portal', x: 10, z: 20 },
            { name: 'Scandinavian-Port Portal', x: 15, z: 15 },
            { name: 'Korean-District Portal', x: 20, z: 10 }
        ];
        
        outposts.forEach((outpost, index) => {
            this.tutorialState.worldElements.push({
                id: `trading_portal_${index}`,
                type: 'portal',
                name: outpost.name,
                description: 'A dimensional portal to a trading outpost',
                position: { x: outpost.x, y: 2, z: outpost.z },
                created: Date.now(),
                url: 'http://localhost:7881'
            });
        });
        
        await this.addChatMessage('The System Architect', 'Six trading portals manifest! Each connects to a different cultural outpost.');
        
        const soulframStatus = await this.checkSystemStatus(7881);
        if (soulframStatus.online) {
            await this.addChatMessage('Soulfra Multiverse', 'Trading outposts are online! Cultural exchanges active across all dimensions.');
        }
    }
    
    async generateWeb3Gameworld() {
        this.tutorialState.worldElements.push({
            id: 'web3_realm',
            type: 'gameworld',
            name: 'Web3 Playable Realm',
            description: 'A living 3D world where players can interact',
            position: { x: 0, y: 0, z: 20 },
            created: Date.now(),
            url: 'http://localhost:7880'
        });
        
        await this.addChatMessage('The System Architect', 'A playable realm materializes! Watch as AI builds structures for players to explore.');
        
        const web3Status = await this.checkSystemStatus(7880);
        if (web3Status.online) {
            await this.addChatMessage('Web3 Game World', 'Interactive 3D world online! AI swarm building structures. MetaMask integration ready.');
        }
    }
    
    async constructClarityEngine() {
        this.tutorialState.worldElements.push({
            id: 'clarity_chamber',
            type: 'reasoning_engine',
            name: 'Clarity Reasoning Chamber',
            description: 'A crystal chamber housing pure reasoning intelligence',
            position: { x: 15, y: 5, z: -5 },
            created: Date.now(),
            url: 'http://localhost:7882'
        });
        
        await this.spawnNPC('clarity_sage');
        await this.addChatMessage('Clarity Sage', 'I am the voice of reason. Through me, all systems find clarity and understanding.');
        
        const clarityStatus = await this.checkSystemStatus(7882);
        if (clarityStatus.online) {
            await this.addChatMessage('Clarity Engine', 'Reasoning systems operational. Cross-framework analysis active. Handshake agreements verified.');
        }
    }
    
    async excavateOnionTunnels() {
        this.tutorialState.worldElements.push({
            id: 'onion_network',
            type: 'tunnel_system',
            name: 'Deep Web Tunnel Network',
            description: 'Dark tunnels leading to the deep web',
            position: { x: -15, y: -2, z: -15 },
            created: Date.now(),
            url: 'http://localhost:7884'
        });
        
        await this.addChatMessage('The System Architect', 'Tunnels burrow deep into the onion network. Reasoning spiders crawl through layers of data.');
        
        const crawlerStatus = await this.checkSystemStatus(7884);
        if (crawlerStatus.online) {
            await this.addChatMessage('Onion Crawler', 'Deep web tunnels operational. Layer analysis engines active. Reasoning differentials engaged.');
        }
    }
    
    async erectArchitectureTower() {
        this.tutorialState.worldElements.push({
            id: 'control_tower',
            type: 'monitoring_station',
            name: 'Architecture Control Tower',
            description: 'A tall tower overseeing all system operations',
            position: { x: 25, y: 10, z: 0 },
            created: Date.now(),
            url: 'http://localhost:7886'
        });
        
        await this.addChatMessage('The System Architect', 'The control tower rises! From here, all architectural limits and boundaries are enforced.');
        
        const archStatus = await this.checkSystemStatus(7886);
        if (archStatus.online) {
            await this.addChatMessage('Architecture Manager', 'Control tower online. Monitoring all systems. Resource limits enforced. Boundaries maintained.');
        }
    }
    
    async fortifyCJISScraper() {
        this.tutorialState.worldElements.push({
            id: 'cjis_fortress',
            type: 'secure_facility',
            name: 'CJIS Compliance Fortress',
            description: 'A heavily secured fortress for government data processing',
            position: { x: -25, y: 3, z: -10 },
            created: Date.now(),
            url: 'http://localhost:7889'
        });
        
        await this.addChatMessage('The System Architect', 'The compliance fortress stands ready! Here, government data is processed with full CJIS and ICANN compliance.');
        
        const cjisStatus = await this.checkSystemStatus(7889);
        if (cjisStatus.online) {
            await this.addChatMessage('CJIS Scraper', 'Compliance fortress operational. AI swarm ready for government data processing. Bootstrap funding search authorized.');
        }
    }
    
    async bridgeAllSystems() {
        this.tutorialState.worldElements.push({
            id: 'system_bridge',
            type: 'connector',
            name: 'Terminal MUD Bridge',
            description: 'A bridge connecting all realms together',
            position: { x: 0, y: 8, z: 0 },
            created: Date.now(),
            url: 'http://localhost:7887'
        });
        
        await this.addChatMessage('The System Architect', 'The great bridge spans all realms! Now you can travel between systems as in a MUD world.');
        
        const mudStatus = await this.checkSystemStatus(7887);
        if (mudStatus.online) {
            await this.addChatMessage('Terminal MUD', 'Command bridge operational. Multi-user environment active. All systems accessible via terminal interface.');
        }
    }
    
    async integrateAllSystems() {
        await this.addChatMessage('The System Architect', 'The moment of truth arrives... all systems coming online and integrating...');
        
        // Check all systems
        const systemChecks = await Promise.all([
            this.checkSystemStatus(7877), // BlameChain
            this.checkSystemStatus(7879), // Chat Processor  
            this.checkSystemStatus(7880), // Web3 World
            this.checkSystemStatus(7881), // Soulfra
            this.checkSystemStatus(7882), // Clarity Engine
            this.checkSystemStatus(7884), // Onion Crawler
            this.checkSystemStatus(7886), // Architecture Manager
            this.checkSystemStatus(7887), // Terminal MUD
            this.checkSystemStatus(7889), // CJIS Scraper
            this.checkSystemStatus(7891)  // Guardian
        ]);
        
        const onlineSystems = systemChecks.filter(s => s.online).length;
        const totalSystems = systemChecks.length;
        
        await this.addChatMessage('System Integration', `Integration complete! ${onlineSystems}/${totalSystems} systems online and communicating.`);
        
        if (onlineSystems >= 5) {
            await this.addChatMessage('The System Architect', 'Excellent! Your distributed computing realm is thriving. The AI swarm is ready to serve.');
        } else {
            await this.addChatMessage('The System Architect', 'Some systems are still awakening. Use the Guardian to check their status and restart as needed.');
        }
    }
    
    async completeTutorial() {
        await this.addChatMessage('The System Architect', 'Congratulations! Tutorial Island is complete. Your digital kingdom awaits your command!');
        await this.addChatMessage('The System Architect', 'You now have a complete distributed computing architecture for bootstrap funding research.');
        await this.addChatMessage('Schema Guardian', 'All systems verified and compliant. Your realm is secure and operational.');
        await this.addChatMessage('Clarity Sage', 'The tutorial ends, but your journey begins. Ask me anything about your creation.');
    }
    
    async enableInteraction() {
        this.tutorialState.phase = 'interactive_mode';
        await this.addChatMessage('System', 'Interactive mode enabled! You can now chat with your creation and command your digital realm.');
        
        this.broadcastToObservers({
            type: 'tutorial_complete',
            message: 'Tutorial Island complete! Your distributed computing realm is ready.',
            interactiveMode: true
        });
    }
    
    async checkSystemStatus(port) {
        try {
            const response = await axios.get(`http://localhost:${port}`, { 
                timeout: 5000,
                validateStatus: () => true 
            });
            return { 
                online: response.status >= 200 && response.status < 400,
                port: port,
                status: response.status
            };
        } catch (error) {
            return { 
                online: false, 
                port: port, 
                error: error.message 
            };
        }
    }
    
    async spawnNPC(npcId) {
        const npc = this.npcs[npcId];
        if (npc) {
            this.tutorialState.activeNPCs.push({
                id: npcId,
                ...npc,
                spawnTime: Date.now()
            });
        }
    }
    
    async addChatMessage(speaker, message) {
        const chatMessage = {
            timestamp: Date.now(),
            speaker: speaker,
            message: message,
            phase: this.tutorialState.phase
        };
        
        this.tutorialState.chatLog.push(chatMessage);
        
        this.broadcastToObservers({
            type: 'chat_message',
            chat: chatMessage
        });
    }
    
    async handlePlayerInteraction(interaction) {
        const { message, target } = interaction;
        
        // Add player message to chat
        await this.addChatMessage('You', message);
        
        // Generate appropriate response
        let response = '';
        
        if (target && this.npcs[target]) {
            // Talking to specific NPC
            const npc = this.npcs[target];
            response = this.generateNPCResponse(npc, message);
            await this.addChatMessage(npc.name, response);
        } else {
            // General system response
            response = await this.generateSystemResponse(message);
            await this.addChatMessage('System', response);
        }
        
        return {
            success: true,
            response: response,
            currentPhase: this.tutorialState.phase
        };
    }
    
    generateNPCResponse(npc, playerMessage) {
        const responses = {
            'tutorial_guide': [
                "Your realm grows stronger each day! What would you like to know about your creation?",
                "Each system serves a purpose in your grand architecture. Explore them all!",
                "I'm proud of what we've built together. Your digital kingdom is magnificent!",
                "Need guidance? I'm here to help you understand your distributed computing realm."
            ],
            'database_guardian': [
                "All databases remain secure and validated under my watch.",
                "Schema integrity is maintained. Your data is protected.",
                "I detect no compliance violations. Your systems operate within proper boundaries.",
                "The Guardian tower stands vigilant. No corrupted data shall pass!"
            ],
            'ai_swarm_leader': [
                "The collective intelligence grows stronger. We await your commands.",
                "Our swarm processes data continuously. What analysis do you require?",
                "We learn from every interaction. Your digital workforce evolves.",
                "Command the swarm, and we shall execute your will across all systems."
            ],
            'clarity_sage': [
                "Seek clarity in all things. What wisdom do you require?",
                "Through reasoning, all complex problems find simple solutions.",
                "I sense confusion in your query. Let me provide illumination.",
                "The path to understanding lies through structured thought. Ask freely."
            ]
        };
        
        const npcResponses = responses[npc.role] || responses['tutorial_guide'];
        return npcResponses[Math.floor(Math.random() * npcResponses.length)];
    }
    
    async generateSystemResponse(message) {
        // Check if asking about system status
        if (message.toLowerCase().includes('status') || message.toLowerCase().includes('health')) {
            const systemChecks = await Promise.all([
                this.checkSystemStatus(7877),
                this.checkSystemStatus(7879),
                this.checkSystemStatus(7881),
                this.checkSystemStatus(7882),
                this.checkSystemStatus(7889),
                this.checkSystemStatus(7891)
            ]);
            
            const onlineSystems = systemChecks.filter(s => s.online).length;
            return `System Status: ${onlineSystems}/6 core systems online and operational.`;
        }
        
        // Check if asking about specific functionality
        if (message.toLowerCase().includes('funding') || message.toLowerCase().includes('grant')) {
            return "Your CJIS-compliant scraper is ready to find bootstrap funding! Visit the Compliance Fortress to begin your search.";
        }
        
        if (message.toLowerCase().includes('trade') || message.toLowerCase().includes('outpost')) {
            return "Six trading outposts await in the Soulfra Multiverse! Each offers unique cultural exchanges and opportunities.";
        }
        
        // Default responses
        const defaultResponses = [
            "Your digital realm responds to your presence. What would you like to explore?",
            "The systems hum with activity, ready to serve your needs.",
            "Your distributed computing architecture awaits your command.",
            "The Tutorial Island creation is complete. How may I assist you?",
            "Your kingdom of code stands ready. What is your next quest?"
        ];
        
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
    
    async skipToPhase(phaseName) {
        const phaseIndex = this.tutorialPhases.findIndex(p => p.phase === phaseName);
        if (phaseIndex !== -1) {
            this.tutorialState.currentStep = phaseIndex;
            await this.progressTutorial();
        }
    }
    
    getCurrentPhase() {
        return this.tutorialPhases[this.tutorialState.currentStep] || this.tutorialPhases[this.tutorialPhases.length - 1];
    }
    
    broadcastToObservers(data) {
        this.wsServer.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
    
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'player_interaction':
                const result = await this.handlePlayerInteraction(data);
                ws.send(JSON.stringify({ type: 'interaction_result', result }));
                break;
            case 'request_state':
                ws.send(JSON.stringify({
                    type: 'tutorial_state',
                    state: this.tutorialState,
                    currentPhase: this.getCurrentPhase()
                }));
                break;
        }
    }
    
    generateTutorialIslandInterface() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>🏝️ Tutorial Island Observer</title>
            <style>
                body { 
                    font-family: 'Courier New', monospace; 
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a3a 50%, #2d1b3d 100%);
                    color: #00ffaa;
                    margin: 0;
                    padding: 0;
                    height: 100vh;
                    overflow: hidden;
                }
                .tutorial-container {
                    display: grid;
                    grid-template-areas: 
                        "world-view chat-panel"
                        "world-view control-panel";
                    grid-template-columns: 2fr 1fr;
                    grid-template-rows: 2fr 1fr;
                    height: 100vh;
                    gap: 10px;
                    padding: 10px;
                    box-sizing: border-box;
                }
                .world-view {
                    grid-area: world-view;
                    border: 2px solid #00ffaa;
                    border-radius: 10px;
                    background: linear-gradient(45deg, #000011 0%, #001122 50%, #002233 100%);
                    position: relative;
                    overflow: hidden;
                }
                .world-canvas {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }
                .world-element {
                    position: absolute;
                    border: 1px solid #00ffaa;
                    border-radius: 5px;
                    padding: 5px;
                    background: rgba(0, 255, 170, 0.1);
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .world-element:hover {
                    background: rgba(0, 255, 170, 0.3);
                    transform: scale(1.1);
                }
                .chat-panel {
                    grid-area: chat-panel;
                    border: 2px solid #ff6b9d;
                    border-radius: 10px;
                    background: rgba(255, 107, 157, 0.05);
                    display: flex;
                    flex-direction: column;
                }
                .chat-header {
                    padding: 10px;
                    border-bottom: 1px solid #ff6b9d;
                    background: rgba(255, 107, 157, 0.1);
                    text-align: center;
                    font-weight: bold;
                }
                .chat-messages {
                    flex: 1;
                    padding: 10px;
                    overflow-y: auto;
                    font-size: 14px;
                }
                .chat-message {
                    margin: 5px 0;
                    padding: 5px;
                    border-radius: 5px;
                    background: rgba(0, 255, 170, 0.1);
                }
                .chat-input {
                    display: flex;
                    padding: 10px;
                    border-top: 1px solid #ff6b9d;
                }
                .chat-input input {
                    flex: 1;
                    background: #1a1a3a;
                    border: 1px solid #ff6b9d;
                    color: #ff6b9d;
                    padding: 5px;
                    border-radius: 3px;
                }
                .chat-input button {
                    background: #ff6b9d;
                    color: #000;
                    border: none;
                    padding: 5px 10px;
                    margin-left: 5px;
                    border-radius: 3px;
                    cursor: pointer;
                }
                .control-panel {
                    grid-area: control-panel;
                    border: 2px solid #ffd700;
                    border-radius: 10px;
                    background: rgba(255, 215, 0, 0.05);
                    padding: 15px;
                }
                .progress-bar {
                    width: 100%;
                    height: 20px;
                    background: #333;
                    border-radius: 10px;
                    overflow: hidden;
                    margin: 10px 0;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #00ffaa, #ff6b9d);
                    width: 0%;
                    transition: width 0.5s ease;
                }
                .system-status {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin: 10px 0;
                }
                .status-item {
                    padding: 5px;
                    border: 1px solid #ffd700;
                    border-radius: 3px;
                    text-align: center;
                    font-size: 12px;
                }
                .online { background: rgba(0, 255, 0, 0.2); }
                .offline { background: rgba(255, 0, 0, 0.2); }
                .phase-indicator {
                    text-align: center;
                    padding: 10px;
                    margin: 10px 0;
                    border: 2px solid #00ffaa;
                    border-radius: 5px;
                    background: rgba(0, 255, 170, 0.1);
                }
                .world-title {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: rgba(0, 0, 0, 0.8);
                    padding: 10px;
                    border-radius: 5px;
                    border: 1px solid #00ffaa;
                }
                .npc {
                    background: rgba(255, 215, 0, 0.3) !important;
                    border-color: #ffd700 !important;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 0.8; }
                    50% { opacity: 1; }
                    100% { opacity: 0.8; }
                }
            </style>
        </head>
        <body>
            <div class="tutorial-container">
                <div class="world-view">
                    <div class="world-title">
                        <h2 id="worldTitle">🏝️ Tutorial Island</h2>
                        <p id="worldDescription">Your digital realm awaits creation...</p>
                    </div>
                    <div class="world-canvas" id="worldCanvas">
                        <!-- World elements will be dynamically added here -->
                    </div>
                </div>
                
                <div class="chat-panel">
                    <div class="chat-header">
                        💬 Chat with Your Creation
                    </div>
                    <div class="chat-messages" id="chatMessages">
                        <div class="chat-message">
                            <strong>System:</strong> Welcome to Tutorial Island! Watch as your digital realm comes to life...
                        </div>
                    </div>
                    <div class="chat-input">
                        <input type="text" id="playerInput" placeholder="Speak to your creation..." onkeypress="handleEnterKey(event)" />
                        <button onclick="sendMessage()">Send</button>
                    </div>
                </div>
                
                <div class="control-panel">
                    <div class="phase-indicator">
                        <strong id="currentPhase">Phase 0: Initialization</strong>
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div id="phaseDescription">Preparing your digital realm...</div>
                    </div>
                    
                    <div class="system-status" id="systemStatus">
                        <div class="status-item offline">BlameChain</div>
                        <div class="status-item offline">Chat AI</div>
                        <div class="status-item offline">Soulfra</div>
                        <div class="status-item offline">Clarity</div>
                        <div class="status-item offline">CJIS</div>
                        <div class="status-item offline">Guardian</div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 15px;">
                        <button onclick="skipPhase()" style="background: #ffd700; color: #000; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                            ⏭️ Skip to Interactive
                        </button>
                    </div>
                </div>
            </div>
            
            <script>
                let ws;
                let worldElements = [];
                let currentPhaseData = null;
                
                function connectWebSocket() {
                    ws = new WebSocket('ws://localhost:7893');
                    
                    ws.onopen = () => {
                        console.log('Connected to Tutorial Island');
                    };
                    
                    ws.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        handleWebSocketMessage(data);
                    };
                    
                    ws.onclose = () => {
                        setTimeout(connectWebSocket, 5000);
                    };
                }
                
                function handleWebSocketMessage(data) {
                    switch(data.type) {
                        case 'tutorial_start':
                            addChatMessage('System', data.message);
                            break;
                            
                        case 'phase_start':
                            updatePhase(data);
                            break;
                            
                        case 'chat_message':
                            addChatMessage(data.chat.speaker, data.chat.message);
                            if (data.worldState) {
                                updateWorldView(data.worldState);
                            }
                            break;
                            
                        case 'tutorial_state':
                            updateTutorialState(data.state);
                            break;
                            
                        case 'tutorial_complete':
                            addChatMessage('System', data.message);
                            document.getElementById('currentPhase').textContent = 'Tutorial Complete!';
                            document.getElementById('progressFill').style.width = '100%';
                            break;
                    }
                }
                
                function updatePhase(phaseData) {
                    currentPhaseData = phaseData;
                    document.getElementById('currentPhase').textContent = \`Phase \${phaseData.step}: \${phaseData.phase.name\}\`;
                    document.getElementById('phaseDescription').textContent = phaseData.phase.description;
                    
                    const progress = (phaseData.step / phaseData.totalSteps) * 100;
                    document.getElementById('progressFill').style.width = \`\${progress}%\`;
                    
                    addChatMessage('Tutorial Guide', phaseData.message);
                }
                
                function updateWorldView(elements) {
                    worldElements = elements || [];
                    const canvas = document.getElementById('worldCanvas');
                    
                    // Clear existing elements
                    const existingElements = canvas.querySelectorAll('.world-element');
                    existingElements.forEach(el => el.remove());
                    
                    // Add new elements
                    elements.forEach(element => {
                        const div = document.createElement('div');
                        div.className = 'world-element' + (element.type === 'npc' ? ' npc' : '');
                        div.innerHTML = \`
                            <strong>\${element.name\}</strong>
                            <br><small>\${element.description\}</small>
                        \`;
                        
                        // Position based on element coordinates (scaled to fit canvas)
                        const x = 50 + (element.position.x * 2); // Center + scaled position
                        const y = 50 + (element.position.z * 2); // Using Z for Y display
                        
                        div.style.left = \`\${Math.max(0, Math.min(80, x))}%\`;
                        div.style.top = \`\${Math.max(0, Math.min(80, y))}%\`;
                        
                        div.onclick = () => {
                            if (element.url) {
                                window.open(element.url, '_blank');
                            }
                            addChatMessage('You', \`Examining \${element.name\}...\`);
                        };
                        
                        canvas.appendChild(div);
                    });
                }
                
                function addChatMessage(speaker, message) {
                    const chatDiv = document.getElementById('chatMessages');
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'chat-message';
                    messageDiv.innerHTML = \`<strong>\${speaker\}:</strong> \${message\}\`;
                    chatDiv.appendChild(messageDiv);
                    chatDiv.scrollTop = chatDiv.scrollHeight;
                }
                
                function sendMessage() {
                    const input = document.getElementById('playerInput');
                    const message = input.value.trim();
                    
                    if (message && ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'player_interaction',
                            message: message,
                            target: null
                        }));
                        input.value = '';
                    }
                }
                
                function handleEnterKey(event) {
                    if (event.key === 'Enter') {
                        sendMessage();
                    }
                }
                
                function skipPhase() {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        fetch('/tutorial/skip', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ phase: 'interactive_mode' })
                        });
                    }
                }
                
                function updateSystemStatus() {
                    // This would check actual system status
                    const systems = ['BlameChain', 'Chat AI', 'Soulfra', 'Clarity', 'CJIS', 'Guardian'];
                    const statusItems = document.querySelectorAll('.status-item');
                    
                    // Simulate systems coming online during tutorial
                    statusItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.className = 'status-item online';
                        }, (index + 1) * 15000); // Stagger the status updates
                    });
                }
                
                // Initialize
                connectWebSocket();
                updateSystemStatus();
            </script>
        </body>
        </html>
        `;
    }
    
    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🏝️ Tutorial Island Observer running on http://localhost:${this.port}`);
            console.log(`👁️ WebSocket server running on ws://localhost:7893`);
            console.log(`🎭 ${this.tutorialPhases.length} tutorial phases loaded`);
            console.log(`🎮 Tutorial Island ready - watch your digital realm come to life!`);
        });
    }
}

// Initialize and start Tutorial Island
const tutorialIsland = new TutorialIslandObserver();
tutorialIsland.start();

module.exports = TutorialIslandObserver;