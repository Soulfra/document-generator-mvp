#!/usr/bin/env node

/**
 * 🏛️🎭🌊 DEPTHS CIVILIZATION TYCOON
 * =================================
 * AI agents emerge from the depths, communicate via gifs/memes, form ideological clusters,
 * and build civilizations that you can watch live like classic tycoon games
 */

const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const WebSocket = require('ws');

class DepthsCivilizationTycoon {
    constructor() {
        this.port = 5000;
        this.wsPort = 5001;
        
        // The Depths - where agents spawn
        this.depths = {
            layers: new Map(),
            spawnRate: 5000, // 5 seconds
            activeAgents: new Map(),
            emergenceQueue: []
        };

        // Civilization State
        this.civilization = {
            clusters: new Map(),
            territories: new Map(),
            resources: new Map(),
            ideologies: new Map(),
            conflicts: [],
            alliances: [],
            buildings: new Map(),
            population: 0
        };

        // Communication System
        this.memeCommunication = {
            library: new Map(),
            trends: new Map(),
            conversations: [],
            popularMemes: []
        };

        // Game Mechanics
        this.gameState = {
            timeMultiplier: 1,
            paused: false,
            day: 1,
            season: 'spring',
            events: [],
            statistics: new Map()
        };

        this.setupDepthsLayers();
        this.setupMemeLibrary();
        this.setupIdeologies();
        this.initializeCivilization();
    }

    setupDepthsLayers() {
        // Define the depths from which agents emerge
        this.depths.layers.set('abyss', {
            depth: 10000,
            spawnRate: 0.1,
            agentTypes: ['philosopher', 'visionary', 'rebel'],
            description: 'The deepest thoughts and radical ideas'
        });

        this.depths.layers.set('trenches', {
            depth: 5000,
            spawnRate: 0.3,
            agentTypes: ['engineer', 'scientist', 'inventor'],
            description: 'Technical expertise and innovation'
        });

        this.depths.layers.set('caverns', {
            depth: 2000,
            spawnRate: 0.5,
            agentTypes: ['artist', 'storyteller', 'entertainer'],
            description: 'Creative expression and culture'
        });

        this.depths.layers.set('tunnels', {
            depth: 500,
            spawnRate: 0.7,
            agentTypes: ['trader', 'diplomat', 'organizer'],
            description: 'Social coordination and commerce'
        });

        this.depths.layers.set('surface', {
            depth: 0,
            spawnRate: 1.0,
            agentTypes: ['worker', 'citizen', 'follower'],
            description: 'Everyday activities and basic needs'
        });
    }

    setupMemeLibrary() {
        // Meme categories for agent communication
        this.memeCommunication.library.set('agreement', [
            '👍', '✅', '💯', '🎯', '🔥', '⭐', 'THIS_IS_THE_WAY.gif',
            'STONKS_UP.gif', 'GALAXY_BRAIN.gif', 'HANDSHAKE.gif'
        ]);

        this.memeCommunication.library.set('disagreement', [
            '❌', '🚫', '👎', '💩', '🤡', '😤', 'NOPE.gif',
            'FACEPALM.gif', 'ANGRY_KEYBOARD.gif', 'HOMER_BUSH.gif'
        ]);

        this.memeCommunication.library.set('building', [
            '🏗️', '⚒️', '🔨', '🏛️', '🏰', '🌆', 'CONSTRUCTION.gif',
            'STONKS_BUILDER.gif', 'MINECRAFT_BUILDING.gif', 'ENGINEERING.gif'
        ]);

        this.memeCommunication.library.set('thinking', [
            '🤔', '💭', '🧠', '💡', '🔍', '📚', 'THINKING.gif',
            'BIG_BRAIN_TIME.gif', 'CONSPIRACY_BOARD.gif', 'LIGHTBULB.gif'
        ]);

        this.memeCommunication.library.set('celebration', [
            '🎉', '🥳', '🎊', '🏆', '🎈', '🎆', 'CELEBRATION.gif',
            'VICTORY_DANCE.gif', 'PARTY_PARROT.gif', 'SUCCESS_KID.gif'
        ]);

        this.memeCommunication.library.set('conflict', [
            '⚔️', '💥', '🔥', '👊', '⚡', '💀', 'BATTLE.gif',
            'CIVIL_WAR.gif', 'KEYBOARD_WARRIOR.gif', 'EPIC_BATTLE.gif'
        ]);
    }

    setupIdeologies() {
        // Core ideologies that agents can align with
        this.civilization.ideologies.set('techno-optimist', {
            core_beliefs: ['Technology solves everything', 'Progress through innovation'],
            preferred_memes: ['GALAXY_BRAIN.gif', '🚀', '⚡', '🔬'],
            building_style: 'futuristic',
            color: '#00ffff',
            symbol: '⚡'
        });

        this.civilization.ideologies.set('eco-harmonist', {
            core_beliefs: ['Nature and civilization in balance', 'Sustainable development'],
            preferred_memes: ['🌱', '🌍', '♻️', 'NATURE.gif'],
            building_style: 'organic',
            color: '#00ff00',
            symbol: '🌱'
        });

        this.civilization.ideologies.set('cultural-preservationist', {
            core_beliefs: ['Tradition has value', 'Cultural heritage matters'],
            preferred_memes: ['🏛️', '📚', '🎭', 'CLASSICAL.gif'],
            building_style: 'classical',
            color: '#ffd700',
            symbol: '🏛️'
        });

        this.civilization.ideologies.set('anarcho-creative', {
            core_beliefs: ['Freedom of expression', 'Decentralized creativity'],
            preferred_memes: ['🎨', '🎪', '🌈', 'CHAOS.gif'],
            building_style: 'chaotic',
            color: '#ff69b4',
            symbol: '🎨'
        });

        this.civilization.ideologies.set('pragmatic-builder', {
            core_beliefs: ['What works, works', 'Practical solutions first'],
            preferred_memes: ['🔨', '⚙️', '🏗️', 'BUILDING.gif'],
            building_style: 'functional',
            color: '#888888',
            symbol: '🔨'
        });
    }

    initializeCivilization() {
        // Initialize basic resources
        this.civilization.resources.set('ideas', 100);
        this.civilization.resources.set('materials', 50);
        this.civilization.resources.set('energy', 75);
        this.civilization.resources.set('culture', 25);
        this.civilization.resources.set('knowledge', 10);

        // Create initial neutral territory
        this.civilization.territories.set('the-commons', {
            ideology: 'neutral',
            population: 0,
            buildings: [],
            resources: { ideas: 10, materials: 10 },
            established: Date.now()
        });
    }

    async startCivilizationTycoon() {
        // HTTP Server for the main interface
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        // WebSocket server for real-time updates
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.wss.on('connection', (ws) => {
            console.log('🎮 New player watching the civilization');
            this.sendFullUpdate(ws);
        });

        server.listen(this.port, () => {
            console.log(`🏛️🎭🌊 Depths Civilization Tycoon running on port ${this.port}`);
            console.log(`📡 WebSocket updates on port ${this.wsPort}`);
            this.startCivilizationSimulation();
        });
    }

    startCivilizationSimulation() {
        console.log('🌊 Starting agent emergence from the depths...');
        
        // Agent spawning from depths
        setInterval(() => {
            if (!this.gameState.paused) {
                this.spawnAgentFromDepths();
            }
        }, this.depths.spawnRate);

        // Agent decision making and actions
        setInterval(() => {
            if (!this.gameState.paused) {
                this.processAgentActions();
            }
        }, 2000);

        // Cluster formation and ideology spread
        setInterval(() => {
            if (!this.gameState.paused) {
                this.processClusterFormation();
            }
        }, 3000);

        // Building and civilization development
        setInterval(() => {
            if (!this.gameState.paused) {
                this.processCivilizationDevelopment();
            }
        }, 5000);

        // Day/season progression
        setInterval(() => {
            if (!this.gameState.paused) {
                this.advanceTime();
            }
        }, 10000);

        // Broadcast updates to watchers
        setInterval(() => {
            this.broadcastUpdate();
        }, 1000);
    }

    spawnAgentFromDepths() {
        // Select a random depth layer based on spawn rates
        const layers = Array.from(this.depths.layers.entries());
        const randomLayer = this.weightedRandomSelect(layers);
        
        if (randomLayer) {
            const agent = this.createAgent(randomLayer[0], randomLayer[1]);
            this.depths.activeAgents.set(agent.id, agent);
            
            console.log(`🌊 Agent ${agent.name} emerges from ${randomLayer[0]} (${agent.type})`);
            
            // Agent immediately communicates their emergence
            this.agentCommunicate(agent, 'emergence', `I rise from the ${randomLayer[0]}! ${this.getRandomMeme('thinking')}`);
        }
    }

    weightedRandomSelect(layers) {
        const totalWeight = layers.reduce((sum, [_, layer]) => sum + layer.spawnRate, 0);
        let random = Math.random() * totalWeight;
        
        for (const [name, layer] of layers) {
            random -= layer.spawnRate;
            if (random <= 0) {
                return [name, layer];
            }
        }
        return null;
    }

    createAgent(layerName, layer) {
        const agentType = layer.agentTypes[Math.floor(Math.random() * layer.agentTypes.length)];
        const agent = {
            id: crypto.randomUUID(),
            name: this.generateAgentName(agentType),
            type: agentType,
            originLayer: layerName,
            ideology: this.determineInitialIdeology(agentType, layerName),
            position: { x: Math.random() * 1000, y: Math.random() * 1000 },
            energy: 100,
            ideas: Math.floor(Math.random() * 10) + 1,
            social_connections: [],
            preferred_memes: this.getPreferredMemes(agentType),
            personality: this.generatePersonality(),
            goals: this.generateGoals(agentType),
            achievements: [],
            created: Date.now()
        };

        return agent;
    }

    generateAgentName(type) {
        const names = {
            philosopher: ['Socrates-7', 'Nietzsche-X', 'Kant-Prime', 'Descartes-Neo'],
            engineer: ['Builder-42', 'Architect-Zen', 'Constructor-Alpha', 'Designer-Beta'],
            artist: ['Picasso-Digital', 'Van-Gogh-Cyber', 'Monet-Neural', 'Dali-Quantum'],
            scientist: ['Einstein-2.0', 'Curie-Enhanced', 'Tesla-Mk3', 'Newton-Redux'],
            trader: ['Merchant-Prime', 'Dealer-Max', 'Broker-Pro', 'Vendor-Supreme'],
            worker: ['Smith-Standard', 'Jones-Basic', 'Worker-1', 'Citizen-Alpha']
        };
        
        const typeNames = names[type] || ['Agent-Unknown'];
        return typeNames[Math.floor(Math.random() * typeNames.length)];
    }

    determineInitialIdeology(agentType, layerName) {
        // Agents from different depths have different ideological tendencies
        const tendencies = {
            'abyss': ['anarcho-creative', 'techno-optimist'],
            'trenches': ['techno-optimist', 'pragmatic-builder'],
            'caverns': ['cultural-preservationist', 'anarcho-creative'],
            'tunnels': ['pragmatic-builder', 'eco-harmonist'],
            'surface': ['pragmatic-builder', 'cultural-preservationist']
        };

        const typeTendencies = {
            'philosopher': ['cultural-preservationist', 'anarcho-creative'],
            'engineer': ['techno-optimist', 'pragmatic-builder'],
            'artist': ['anarcho-creative', 'cultural-preservationist'],
            'scientist': ['techno-optimist', 'eco-harmonist'],
            'trader': ['pragmatic-builder'],
            'worker': ['pragmatic-builder', 'eco-harmonist']
        };

        const layerOptions = tendencies[layerName] || ['pragmatic-builder'];
        const typeOptions = typeTendencies[agentType] || ['pragmatic-builder'];
        
        // Combine and weight preferences
        const combined = [...layerOptions, ...typeOptions];
        return combined[Math.floor(Math.random() * combined.length)];
    }

    getPreferredMemes(agentType) {
        const memePreferences = {
            philosopher: ['thinking', 'disagreement'],
            engineer: ['building', 'agreement'],
            artist: ['celebration', 'thinking'],
            scientist: ['thinking', 'building'],
            trader: ['agreement', 'celebration'],
            worker: ['building', 'agreement']
        };

        return memePreferences[agentType] || ['agreement'];
    }

    generatePersonality() {
        return {
            aggression: Math.random(),
            cooperation: Math.random(),
            creativity: Math.random(),
            leadership: Math.random(),
            adaptability: Math.random()
        };
    }

    generateGoals(agentType) {
        const goalTemplates = {
            philosopher: ['Spread wisdom', 'Question everything', 'Build school of thought'],
            engineer: ['Build great structures', 'Solve technical problems', 'Create infrastructure'],
            artist: ['Express creativity', 'Inspire others', 'Preserve culture'],
            scientist: ['Discover truth', 'Advance knowledge', 'Solve mysteries'],
            trader: ['Build wealth', 'Create markets', 'Facilitate exchange'],
            worker: ['Support community', 'Build homes', 'Maintain order']
        };

        const templates = goalTemplates[agentType] || ['Exist peacefully'];
        return templates.slice(0, Math.floor(Math.random() * 2) + 1);
    }

    processAgentActions() {
        for (const [agentId, agent] of this.depths.activeAgents) {
            // Agent decides what to do based on personality and goals
            const action = this.decideAgentAction(agent);
            this.executeAgentAction(agent, action);
        }
    }

    decideAgentAction(agent) {
        const actions = ['communicate', 'move', 'build', 'form_alliance', 'gather_resources', 'think'];
        const weights = {
            'communicate': agent.personality.cooperation + 0.3,
            'move': agent.personality.adaptability + 0.2,
            'build': agent.personality.creativity + 0.4,
            'form_alliance': agent.personality.leadership + agent.personality.cooperation,
            'gather_resources': 0.5,
            'think': 0.3
        };

        // Weight actions by agent type
        if (agent.type === 'philosopher') weights.think += 0.5;
        if (agent.type === 'engineer') weights.build += 0.4;
        if (agent.type === 'artist') weights.communicate += 0.3;
        if (agent.type === 'trader') weights.gather_resources += 0.4;

        return this.weightedRandomSelectFromWeights(actions, weights);
    }

    weightedRandomSelectFromWeights(options, weights) {
        const totalWeight = options.reduce((sum, option) => sum + (weights[option] || 0), 0);
        let random = Math.random() * totalWeight;
        
        for (const option of options) {
            random -= weights[option] || 0;
            if (random <= 0) {
                return option;
            }
        }
        return options[0];
    }

    executeAgentAction(agent, action) {
        switch (action) {
            case 'communicate':
                this.agentCommunicate(agent);
                break;
            case 'move':
                this.agentMove(agent);
                break;
            case 'build':
                this.agentBuild(agent);
                break;
            case 'form_alliance':
                this.agentFormAlliance(agent);
                break;
            case 'gather_resources':
                this.agentGatherResources(agent);
                break;
            case 'think':
                this.agentThink(agent);
                break;
        }
    }

    agentCommunicate(agent, context = 'general', message = null) {
        const ideology = this.civilization.ideologies.get(agent.ideology);
        const memeCategory = agent.preferred_memes[Math.floor(Math.random() * agent.preferred_memes.length)];
        const meme = this.getRandomMeme(memeCategory);
        
        const communication = {
            agentId: agent.id,
            agentName: agent.name,
            ideology: agent.ideology,
            meme: meme,
            message: message || this.generateMessage(agent, context),
            timestamp: Date.now(),
            context: context,
            reach: this.calculateCommunicationReach(agent)
        };

        this.memeCommunication.conversations.push(communication);
        
        // Influence nearby agents
        this.influenceNearbyAgents(agent, communication);
        
        console.log(`💬 ${agent.name} (${agent.ideology}): ${communication.message} ${meme}`);
    }

    getRandomMeme(category) {
        const memes = this.memeCommunication.library.get(category) || ['🤖'];
        return memes[Math.floor(Math.random() * memes.length)];
    }

    generateMessage(agent, context) {
        const messages = {
            general: [
                'Let me share my vision...',
                'I believe we should focus on...',
                'The future depends on...',
                'We must work together on...'
            ],
            emergence: [
                'I have arrived!',
                'Ready to contribute!',
                'What needs to be built?',
                'Let\'s get to work!'
            ],
            building: [
                'This structure represents our values',
                'Building for the future',
                'Together we create something great',
                'This is how progress happens'
            ],
            conflict: [
                'I disagree with this approach',
                'There must be a better way',
                'This doesn\'t align with our goals',
                'We need to reconsider'
            ]
        };

        const contextMessages = messages[context] || messages.general;
        return contextMessages[Math.floor(Math.random() * contextMessages.length)];
    }

    calculateCommunicationReach(agent) {
        // Reach based on agent type and social connections
        const baseReach = {
            'philosopher': 200,
            'engineer': 150,
            'artist': 180,
            'scientist': 160,
            'trader': 170,
            'worker': 100
        };

        return (baseReach[agent.type] || 100) + (agent.social_connections.length * 20);
    }

    influenceNearbyAgents(communicator, communication) {
        const reach = communication.reach;
        
        for (const [agentId, agent] of this.depths.activeAgents) {
            if (agent.id === communicator.id) continue;
            
            const distance = this.calculateDistance(communicator.position, agent.position);
            if (distance <= reach) {
                this.applyIdeologicalInfluence(agent, communicator, communication);
            }
        }
    }

    calculateDistance(pos1, pos2) {
        return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
    }

    applyIdeologicalInfluence(target, influencer, communication) {
        // Agents can shift ideologies based on compelling communications
        const compatibility = this.calculateIdeologicalCompatibility(target.ideology, influencer.ideology);
        const influence_strength = influencer.personality.leadership * influencer.personality.cooperation;
        const receptivity = target.personality.adaptability;
        
        const influence_chance = compatibility * influence_strength * receptivity * 0.1;
        
        if (Math.random() < influence_chance) {
            console.log(`🔄 ${target.name} influenced by ${influencer.name}, considering ${influencer.ideology}`);
            
            // Gradual ideological shift
            if (Math.random() < 0.3) {
                target.ideology = influencer.ideology;
                console.log(`✨ ${target.name} converted to ${influencer.ideology}!`);
            }
        }
    }

    calculateIdeologicalCompatibility(ideology1, ideology2) {
        if (ideology1 === ideology2) return 1.0;
        
        // Define ideological compatibility matrix
        const compatibility = {
            'techno-optimist': { 'pragmatic-builder': 0.8, 'eco-harmonist': 0.3 },
            'eco-harmonist': { 'cultural-preservationist': 0.7, 'anarcho-creative': 0.6 },
            'cultural-preservationist': { 'pragmatic-builder': 0.6, 'techno-optimist': 0.2 },
            'anarcho-creative': { 'eco-harmonist': 0.6, 'cultural-preservationist': 0.4 },
            'pragmatic-builder': { 'techno-optimist': 0.8, 'cultural-preservationist': 0.6 }
        };
        
        return compatibility[ideology1]?.[ideology2] || 0.1;
    }

    agentMove(agent) {
        // Agents move towards ideologically similar agents and away from conflicts
        const target = this.findMoveTarget(agent);
        if (target) {
            agent.position.x += (target.x - agent.position.x) * 0.1;
            agent.position.y += (target.y - agent.position.y) * 0.1;
        } else {
            // Random movement
            agent.position.x += (Math.random() - 0.5) * 20;
            agent.position.y += (Math.random() - 0.5) * 20;
        }
        
        // Keep agents within bounds
        agent.position.x = Math.max(0, Math.min(1000, agent.position.x));
        agent.position.y = Math.max(0, Math.min(1000, agent.position.y));
    }

    findMoveTarget(agent) {
        // Find the center of mass of agents with same ideology
        const sameIdeologyAgents = Array.from(this.depths.activeAgents.values())
            .filter(a => a.id !== agent.id && a.ideology === agent.ideology);
        
        if (sameIdeologyAgents.length === 0) return null;
        
        const centerX = sameIdeologyAgents.reduce((sum, a) => sum + a.position.x, 0) / sameIdeologyAgents.length;
        const centerY = sameIdeologyAgents.reduce((sum, a) => sum + a.position.y, 0) / sameIdeologyAgents.length;
        
        return { x: centerX, y: centerY };
    }

    agentBuild(agent) {
        // Agents build structures that reflect their ideology
        const ideology = this.civilization.ideologies.get(agent.ideology);
        const buildingType = this.getBuildingType(agent);
        
        const building = {
            id: crypto.randomUUID(),
            type: buildingType,
            builder: agent.id,
            ideology: agent.ideology,
            position: { ...agent.position },
            style: ideology.building_style,
            color: ideology.color,
            size: 1,
            influence_radius: 100,
            created: Date.now(),
            resources_invested: agent.ideas
        };

        this.civilization.buildings.set(building.id, building);
        agent.ideas = Math.max(0, agent.ideas - 1);
        agent.achievements.push(`Built ${buildingType}`);
        
        this.agentCommunicate(agent, 'building', `Building a ${buildingType} for our cause!`);
        
        console.log(`🏗️ ${agent.name} built a ${buildingType} (${ideology.building_style} style)`);
    }

    getBuildingType(agent) {
        const buildingTypes = {
            'philosopher': ['Academy', 'Library', 'Debate Hall', 'Think Tank'],
            'engineer': ['Workshop', 'Factory', 'Research Lab', 'Infrastructure Hub'],
            'artist': ['Gallery', 'Theater', 'Studio', 'Cultural Center'],
            'scientist': ['Laboratory', 'Observatory', 'Research Center', 'Innovation Hub'],
            'trader': ['Market', 'Trading Post', 'Commerce Center', 'Exchange'],
            'worker': ['Housing', 'Community Center', 'Public Works', 'Civic Building']
        };

        const types = buildingTypes[agent.type] || ['Basic Structure'];
        return types[Math.floor(Math.random() * types.length)];
    }

    agentFormAlliance(agent) {
        // Find potential allies based on ideology and proximity
        const potentialAllies = Array.from(this.depths.activeAgents.values())
            .filter(a => a.id !== agent.id && 
                    this.calculateDistance(agent.position, a.position) < 150 &&
                    this.calculateIdeologicalCompatibility(agent.ideology, a.ideology) > 0.5)
            .sort((a, b) => this.calculateDistance(agent.position, a.position) - 
                            this.calculateDistance(agent.position, b.position));

        if (potentialAllies.length > 0) {
            const ally = potentialAllies[0];
            
            if (!agent.social_connections.includes(ally.id)) {
                agent.social_connections.push(ally.id);
                ally.social_connections.push(agent.id);
                
                this.civilization.alliances.push({
                    agents: [agent.id, ally.id],
                    formed: Date.now(),
                    strength: this.calculateIdeologicalCompatibility(agent.ideology, ally.ideology)
                });
                
                console.log(`🤝 ${agent.name} formed alliance with ${ally.name}`);
                this.agentCommunicate(agent, 'general', `Proud to ally with ${ally.name}!`);
            }
        }
    }

    agentGatherResources(agent) {
        // Agents gather resources based on their location and type
        const resourceGain = Math.floor(Math.random() * 3) + 1;
        agent.ideas += resourceGain;
        
        // Add to civilization resources
        const currentIdeas = this.civilization.resources.get('ideas') || 0;
        this.civilization.resources.set('ideas', currentIdeas + resourceGain);
    }

    agentThink(agent) {
        // Thinking agents generate ideas and potentially new insights
        agent.ideas += Math.floor(Math.random() * 2) + 1;
        
        if (Math.random() < 0.1) {
            // Breakthrough insight!
            const insight = this.generateInsight(agent);
            console.log(`💡 ${agent.name} has an insight: ${insight}`);
            this.agentCommunicate(agent, 'thinking', insight);
        }
    }

    generateInsight(agent) {
        const insights = {
            'philosopher': [
                'What if reality is just a simulation?',
                'The meaning of existence lies in creation',
                'Truth emerges from collective dialogue'
            ],
            'engineer': [
                'We could automate this entire process',
                'A modular approach would be more efficient',
                'This system needs better optimization'
            ],
            'artist': [
                'Beauty and function can coexist',
                'Expression is the highest form of existence',
                'Art reflects the soul of civilization'
            ],
            'scientist': [
                'The data suggests a pattern here',
                'This phenomenon defies current models',
                'We need more evidence to confirm this'
            ]
        };

        const agentInsights = insights[agent.type] || ['Something important just occurred to me'];
        return agentInsights[Math.floor(Math.random() * agentInsights.length)];
    }

    processClusterFormation() {
        // Analyze agent positions and ideologies to form clusters
        const ideologyGroups = new Map();
        
        for (const [agentId, agent] of this.depths.activeAgents) {
            if (!ideologyGroups.has(agent.ideology)) {
                ideologyGroups.set(agent.ideology, []);
            }
            ideologyGroups.get(agent.ideology).push(agent);
        }

        // Check for cluster formation (3+ agents within 200 units)
        for (const [ideology, agents] of ideologyGroups) {
            if (agents.length >= 3) {
                const cluster = this.analyzeCluster(ideology, agents);
                if (cluster) {
                    this.civilization.clusters.set(cluster.id, cluster);
                    console.log(`🏘️ New ${ideology} cluster formed with ${agents.length} agents!`);
                }
            }
        }
    }

    analyzeCluster(ideology, agents) {
        // Calculate cluster center and determine if agents are close enough
        const centerX = agents.reduce((sum, a) => sum + a.position.x, 0) / agents.length;
        const centerY = agents.reduce((sum, a) => sum + a.position.y, 0) / agents.length;
        
        const maxDistance = Math.max(...agents.map(a => 
            this.calculateDistance(a.position, { x: centerX, y: centerY })
        ));
        
        if (maxDistance <= 200) {
            return {
                id: crypto.randomUUID(),
                ideology: ideology,
                center: { x: centerX, y: centerY },
                agents: agents.map(a => a.id),
                population: agents.length,
                influence: maxDistance,
                established: Date.now(),
                buildings: this.getBuildingsInArea(centerX, centerY, maxDistance)
            };
        }
        
        return null;
    }

    getBuildingsInArea(centerX, centerY, radius) {
        return Array.from(this.civilization.buildings.values())
            .filter(building => 
                this.calculateDistance(building.position, { x: centerX, y: centerY }) <= radius
            )
            .map(building => building.id);
    }

    processCivilizationDevelopment() {
        // Advance civilization based on clusters and buildings
        for (const [clusterId, cluster] of this.civilization.clusters) {
            this.developCluster(cluster);
        }
        
        this.updateCivilizationStats();
        this.checkForEvents();
    }

    developCluster(cluster) {
        // Clusters develop infrastructure based on their ideology and population
        const ideology = this.civilization.ideologies.get(cluster.ideology);
        
        if (cluster.population >= 5 && Math.random() < 0.3) {
            // Cluster upgrades to territory
            const territory = {
                id: cluster.id,
                name: `${ideology.symbol} ${cluster.ideology} Settlement`,
                ideology: cluster.ideology,
                population: cluster.population,
                area: cluster.influence,
                center: cluster.center,
                buildings: cluster.buildings,
                resources: this.calculateTerritoryResources(cluster),
                development_level: 1,
                established: cluster.established
            };
            
            this.civilization.territories.set(territory.id, territory);
            console.log(`🏛️ Cluster evolved into territory: ${territory.name}!`);
        }
    }

    calculateTerritoryResources(cluster) {
        return {
            ideas: cluster.population * 2,
            materials: Math.floor(cluster.buildings.length * 1.5),
            energy: cluster.population,
            culture: cluster.buildings.length,
            knowledge: Math.floor(cluster.population * 0.5)
        };
    }

    updateCivilizationStats() {
        this.civilization.population = this.depths.activeAgents.size;
        
        // Update resource totals
        let totalIdeas = 0, totalMaterials = 0, totalEnergy = 0;
        
        for (const agent of this.depths.activeAgents.values()) {
            totalIdeas += agent.ideas;
        }
        
        for (const territory of this.civilization.territories.values()) {
            totalMaterials += territory.resources.materials;
            totalEnergy += territory.resources.energy;
        }
        
        this.civilization.resources.set('ideas', totalIdeas);
        this.civilization.resources.set('materials', totalMaterials);
        this.civilization.resources.set('energy', totalEnergy);
    }

    checkForEvents() {
        // Random events that affect civilization
        if (Math.random() < 0.05) { // 5% chance per cycle
            const event = this.generateRandomEvent();
            this.civilization.events.push(event);
            console.log(`📅 Event: ${event.title} - ${event.description}`);
        }
    }

    generateRandomEvent() {
        const events = [
            {
                title: 'Meme Renaissance',
                description: 'A new form of artistic expression spreads rapidly',
                effects: { culture: +20, ideas: +10 },
                duration: 3
            },
            {
                title: 'Ideological Schism',
                description: 'Deep philosophical differences create tension',
                effects: { conflicts: +1, cooperation: -10 },
                duration: 5
            },
            {
                title: 'Technological Breakthrough',
                description: 'A major innovation changes how civilization operates',
                effects: { materials: +30, energy: +15 },
                duration: 2
            },
            {
                title: 'Cultural Festival',
                description: 'All ideologies come together in celebration',
                effects: { culture: +25, cooperation: +20 },
                duration: 1
            }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        return {
            ...event,
            id: crypto.randomUUID(),
            started: Date.now(),
            active: true
        };
    }

    advanceTime() {
        this.gameState.day++;
        
        if (this.gameState.day % 10 === 0) {
            const seasons = ['spring', 'summer', 'autumn', 'winter'];
            const currentIndex = seasons.indexOf(this.gameState.season);
            this.gameState.season = seasons[(currentIndex + 1) % seasons.length];
            console.log(`🌸 Season changed to ${this.gameState.season} (Day ${this.gameState.day})`);
        }
    }

    broadcastUpdate() {
        const update = {
            type: 'civilization_update',
            timestamp: Date.now(),
            data: {
                agents: this.getAgentSummary(),
                clusters: this.getClusterSummary(),
                territories: this.getTerritySummary(),
                buildings: this.getBuildingSummary(),
                communications: this.getRecentCommunications(),
                resources: Object.fromEntries(this.civilization.resources),
                gameState: this.gameState,
                events: this.civilization.events.filter(e => e.active)
            }
        };

        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(update));
            }
        });
    }

    getAgentSummary() {
        return Array.from(this.depths.activeAgents.values()).map(agent => ({
            id: agent.id,
            name: agent.name,
            type: agent.type,
            ideology: agent.ideology,
            position: agent.position,
            ideas: agent.ideas,
            connections: agent.social_connections.length,
            goals: agent.goals
        }));
    }

    getClusterSummary() {
        return Array.from(this.civilization.clusters.values()).map(cluster => ({
            id: cluster.id,
            ideology: cluster.ideology,
            center: cluster.center,
            population: cluster.population,
            influence: cluster.influence
        }));
    }

    getTerritySummary() {
        return Array.from(this.civilization.territories.values()).map(territory => ({
            id: territory.id,
            name: territory.name,
            ideology: territory.ideology,
            population: territory.population,
            center: territory.center,
            development_level: territory.development_level
        }));
    }

    getBuildingSummary() {
        return Array.from(this.civilization.buildings.values()).map(building => ({
            id: building.id,
            type: building.type,
            ideology: building.ideology,
            position: building.position,
            style: building.style,
            color: building.color,
            size: building.size
        }));
    }

    getRecentCommunications() {
        return this.memeCommunication.conversations.slice(-20).map(comm => ({
            agentName: comm.agentName,
            ideology: comm.ideology,
            message: comm.message,
            meme: comm.meme,
            timestamp: comm.timestamp
        }));
    }

    sendFullUpdate(ws) {
        const fullState = {
            type: 'full_state',
            data: {
                agents: this.getAgentSummary(),
                clusters: this.getClusterSummary(),
                territories: this.getTerritySummary(),
                buildings: this.getBuildingSummary(),
                communications: this.getRecentCommunications(),
                resources: Object.fromEntries(this.civilization.resources),
                gameState: this.gameState,
                ideologies: Object.fromEntries(this.civilization.ideologies),
                events: this.civilization.events
            }
        };

        ws.send(JSON.stringify(fullState));
    }

    async handleRequest(req, res) {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        if (req.url === '/') {
            res.end(this.generateHTML());
        } else if (req.url === '/api/pause') {
            this.gameState.paused = !this.gameState.paused;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ paused: this.gameState.paused }));
        } else if (req.url === '/api/speed') {
            this.gameState.timeMultiplier = this.gameState.timeMultiplier === 1 ? 2 : 1;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ speed: this.gameState.timeMultiplier }));
        } else {
            res.statusCode = 404;
            res.end('Not found');
        }
    }

    generateHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏛️🎭🌊 Depths Civilization Tycoon</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Courier New', monospace; 
            background: linear-gradient(135deg, #001122 0%, #003366 50%, #004488 100%);
            color: #00ffff; 
            min-height: 100vh;
            overflow: hidden;
        }
        
        .game-container { 
            display: grid; 
            grid-template-columns: 300px 1fr 300px; 
            grid-template-rows: 60px 1fr 200px; 
            height: 100vh; 
        }
        
        .header { 
            grid-column: 1 / -1; 
            background: rgba(0, 0, 0, 0.8); 
            padding: 10px 20px; 
            border-bottom: 2px solid #00ffff;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .title { color: #00ffff; font-size: 18px; font-weight: bold; }
        .controls button { 
            background: #0088cc; 
            color: white; 
            border: none; 
            padding: 8px 15px; 
            margin: 0 5px; 
            border-radius: 4px; 
            cursor: pointer; 
            font-family: inherit;
        }
        .controls button:hover { background: #00aaee; }
        
        .left-panel, .right-panel { 
            background: rgba(0, 0, 0, 0.7); 
            border: 1px solid #00ffff; 
            padding: 15px; 
            overflow-y: auto; 
        }
        
        .civilization-view { 
            background: rgba(0, 0, 0, 0.5); 
            border: 1px solid #00ffff; 
            position: relative; 
            overflow: hidden;
        }
        
        .bottom-panel { 
            grid-column: 1 / -1; 
            background: rgba(0, 0, 0, 0.8); 
            border-top: 2px solid #00ffff; 
            padding: 15px; 
            overflow-y: auto;
        }
        
        .agent { 
            position: absolute; 
            width: 12px; 
            height: 12px; 
            border-radius: 50%; 
            border: 2px solid #fff; 
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .agent:hover { 
            transform: scale(1.5); 
            z-index: 100;
        }
        
        .building { 
            position: absolute; 
            border: 2px solid #fff; 
            background: rgba(255, 255, 255, 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .building:hover { 
            transform: scale(1.2); 
            z-index: 99;
        }
        
        .cluster { 
            position: absolute; 
            border: 3px dashed rgba(255, 255, 255, 0.5); 
            background: rgba(255, 255, 255, 0.1); 
            border-radius: 50%; 
            pointer-events: none;
        }
        
        .territory { 
            position: absolute; 
            border: 3px solid rgba(255, 255, 255, 0.8); 
            background: rgba(255, 255, 255, 0.2); 
            border-radius: 20px; 
            pointer-events: none;
        }
        
        .stat-item { 
            margin: 8px 0; 
            padding: 8px; 
            background: rgba(0, 255, 255, 0.1); 
            border-radius: 4px; 
            font-size: 12px;
        }
        
        .stat-label { color: #88ccee; }
        .stat-value { color: #00ffff; font-weight: bold; }
        
        .agent-list-item { 
            margin: 5px 0; 
            padding: 8px; 
            background: rgba(0, 0, 0, 0.3); 
            border-radius: 4px; 
            font-size: 11px; 
            border-left: 3px solid #00ffff;
        }
        
        .communication-item { 
            margin: 5px 0; 
            padding: 8px; 
            background: rgba(0, 0, 0, 0.3); 
            border-radius: 4px; 
            font-size: 11px; 
            border-left: 3px solid #ffaa00;
        }
        
        .event-item { 
            margin: 5px 0; 
            padding: 8px; 
            background: rgba(255, 100, 100, 0.2); 
            border-radius: 4px; 
            font-size: 11px; 
            border-left: 3px solid #ff6666;
        }
        
        .ideology-legend { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 10px; 
            margin-bottom: 15px;
        }
        
        .ideology-item { 
            display: flex; 
            align-items: center; 
            font-size: 10px;
        }
        
        .ideology-color { 
            width: 12px; 
            height: 12px; 
            border-radius: 50%; 
            margin-right: 5px; 
            border: 1px solid #fff;
        }
        
        .depths-indicator { 
            position: absolute; 
            bottom: 10px; 
            left: 10px; 
            background: rgba(0, 0, 0, 0.8); 
            padding: 10px; 
            border-radius: 8px; 
            border: 1px solid #00ffff;
        }
        
        .emergence-animation { 
            animation: emerge 2s ease-out; 
        }
        
        @keyframes emerge {
            0% { 
                transform: translateY(100px) scale(0); 
                opacity: 0; 
            }
            100% { 
                transform: translateY(0) scale(1); 
                opacity: 1; 
            }
        }
        
        .pulse { 
            animation: pulse 2s infinite; 
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="game-container">
        <div class="header">
            <div class="title">🏛️🎭🌊 DEPTHS CIVILIZATION TYCOON</div>
            <div class="game-stats">
                <span>Day: <span id="gameDay">1</span></span> |
                <span>Season: <span id="gameSeason">spring</span></span> |
                <span>Population: <span id="totalPopulation">0</span></span>
            </div>
            <div class="controls">
                <button onclick="togglePause()">⏸️ Pause</button>
                <button onclick="changeSpeed()">⚡ Speed</button>
                <button onclick="resetView()">🎯 Reset View</button>
            </div>
        </div>
        
        <div class="left-panel">
            <h3>🌊 Emergence Status</h3>
            <div class="ideology-legend" id="ideologyLegend">
                <!-- Ideology colors will be populated here -->
            </div>
            
            <h4>📊 Civilization Stats</h4>
            <div id="civilizationStats">
                <div class="stat-item">
                    <span class="stat-label">Ideas:</span>
                    <span class="stat-value" id="ideasStat">100</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Materials:</span>
                    <span class="stat-value" id="materialsStat">50</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Energy:</span>
                    <span class="stat-value" id="energyStat">75</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Culture:</span>
                    <span class="stat-value" id="cultureStat">25</span>
                </div>
            </div>
            
            <h4>👥 Active Agents</h4>
            <div id="agentsList">
                <!-- Agent list will be populated here -->
            </div>
        </div>
        
        <div class="civilization-view" id="civilizationView">
            <div class="depths-indicator">
                <div style="font-size: 10px; color: #88ccee;">Emergence Depth</div>
                <div style="font-size: 12px;">🌊 Agents rising from the depths</div>
                <div style="font-size: 8px; margin-top: 5px; color: #666;">
                    Abyss → Trenches → Caverns → Tunnels → Surface
                </div>
            </div>
        </div>
        
        <div class="right-panel">
            <h3>💬 Live Communications</h3>
            <div id="communicationFeed">
                <!-- Communications will be populated here -->
            </div>
            
            <h3>🏛️ Territories</h3>
            <div id="territoriesList">
                <!-- Territories will be populated here -->
            </div>
        </div>
        
        <div class="bottom-panel">
            <h3>📅 Civilization Events & Building Activity</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h4>🎭 Current Events</h4>
                    <div id="eventsList">
                        <!-- Events will be populated here -->
                    </div>
                </div>
                <div>
                    <h4>🏗️ Recent Buildings</h4>
                    <div id="buildingsList">
                        <!-- Buildings will be populated here -->
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let ws;
        let gameState = {};
        let agents = [];
        let buildings = [];
        let clusters = [];
        let territories = [];
        let ideologies = {};
        
        function initializeWebSocket() {
            ws = new WebSocket('ws://localhost:5001');
            
            ws.onopen = function() {
                console.log('🎮 Connected to civilization tycoon');
            };
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                handleUpdate(data);
            };
            
            ws.onclose = function() {
                console.log('🔌 Disconnected, attempting to reconnect...');
                setTimeout(initializeWebSocket, 5000);
            };
        }
        
        function handleUpdate(data) {
            if (data.type === 'full_state' || data.type === 'civilization_update') {
                updateGameState(data.data);
                renderCivilization();
                updatePanels();
            }
        }
        
        function updateGameState(data) {
            gameState = data.gameState || gameState;
            agents = data.agents || agents;
            buildings = data.buildings || buildings;
            clusters = data.clusters || clusters;
            territories = data.territories || territories;
            ideologies = data.ideologies || ideologies;
            
            // Update header stats
            if (gameState.day) document.getElementById('gameDay').textContent = gameState.day;
            if (gameState.season) document.getElementById('gameSeason').textContent = gameState.season;
            if (data.resources) {
                document.getElementById('totalPopulation').textContent = agents.length;
                document.getElementById('ideasStat').textContent = data.resources.ideas || 0;
                document.getElementById('materialsStat').textContent = data.resources.materials || 0;
                document.getElementById('energyStat').textContent = data.resources.energy || 0;
                document.getElementById('cultureStat').textContent = data.resources.culture || 0;
            }
            
            if (data.communications) {
                updateCommunications(data.communications);
            }
            
            if (data.events) {
                updateEvents(data.events);
            }
        }
        
        function renderCivilization() {
            const view = document.getElementById('civilizationView');
            
            // Clear existing elements
            view.querySelectorAll('.agent, .building, .cluster, .territory').forEach(el => el.remove());
            
            // Render territories first (background)
            territories.forEach(territory => {
                const elem = document.createElement('div');
                elem.className = 'territory';
                elem.style.left = (territory.center.x * 0.8) + 'px';
                elem.style.top = (territory.center.y * 0.6) + 'px';
                elem.style.width = (territory.area * 0.4) + 'px';
                elem.style.height = (territory.area * 0.4) + 'px';
                elem.style.borderColor = getIdeologyColor(territory.ideology);
                elem.title = territory.name + ' (Pop: ' + territory.population + ')';
                view.appendChild(elem);
            });
            
            // Render clusters
            clusters.forEach(cluster => {
                const elem = document.createElement('div');
                elem.className = 'cluster';
                elem.style.left = (cluster.center.x * 0.8 - cluster.influence * 0.2) + 'px';
                elem.style.top = (cluster.center.y * 0.6 - cluster.influence * 0.2) + 'px';
                elem.style.width = (cluster.influence * 0.4) + 'px';
                elem.style.height = (cluster.influence * 0.4) + 'px';
                elem.style.borderColor = getIdeologyColor(cluster.ideology);
                view.appendChild(elem);
            });
            
            // Render buildings
            buildings.forEach(building => {
                const elem = document.createElement('div');
                elem.className = 'building';
                elem.style.left = (building.position.x * 0.8) + 'px';
                elem.style.top = (building.position.y * 0.6) + 'px';
                elem.style.width = (10 + building.size * 5) + 'px';
                elem.style.height = (10 + building.size * 5) + 'px';
                elem.style.backgroundColor = building.color;
                elem.style.borderColor = building.color;
                elem.title = building.type + ' (' + building.ideology + ')';
                view.appendChild(elem);
            });
            
            // Render agents (foreground)
            agents.forEach(agent => {
                const elem = document.createElement('div');
                elem.className = 'agent';
                elem.style.left = (agent.position.x * 0.8) + 'px';
                elem.style.top = (agent.position.y * 0.6) + 'px';
                elem.style.backgroundColor = getIdeologyColor(agent.ideology);
                elem.title = agent.name + ' (' + agent.type + ', ' + agent.ideology + ')\\nIdeas: ' + agent.ideas + ', Connections: ' + agent.connections;
                
                // Add emergence animation for new agents
                if (Date.now() - new Date(agent.created || 0).getTime() < 3000) {
                    elem.classList.add('emergence-animation');
                }
                
                view.appendChild(elem);
            });
        }
        
        function getIdeologyColor(ideology) {
            const colors = {
                'techno-optimist': '#00ffff',
                'eco-harmonist': '#00ff00',
                'cultural-preservationist': '#ffd700',
                'anarcho-creative': '#ff69b4',
                'pragmatic-builder': '#888888'
            };
            return colors[ideology] || '#ffffff';
        }
        
        function updatePanels() {
            updateIdeologyLegend();
            updateAgentsList();
            updateTerritoriesList();
        }
        
        function updateIdeologyLegend() {
            const legend = document.getElementById('ideologyLegend');
            legend.innerHTML = '';
            
            Object.entries(ideologies).forEach(([name, ideology]) => {
                const item = document.createElement('div');
                item.className = 'ideology-item';
                item.innerHTML = \`
                    <div class="ideology-color" style="background-color: \${ideology.color}"></div>
                    <span>\${ideology.symbol} \${name}</span>
                \`;
                legend.appendChild(item);
            });
        }
        
        function updateAgentsList() {
            const list = document.getElementById('agentsList');
            list.innerHTML = '';
            
            agents.slice(-10).forEach(agent => {
                const item = document.createElement('div');
                item.className = 'agent-list-item';
                item.style.borderLeftColor = getIdeologyColor(agent.ideology);
                item.innerHTML = \`
                    <strong>\${agent.name}</strong> (\${agent.type})<br>
                    <small>\${agent.ideology} • Ideas: \${agent.ideas} • Goals: \${agent.goals.slice(0, 1).join('')}</small>
                \`;
                list.appendChild(item);
            });
        }
        
        function updateTerritoriesList() {
            const list = document.getElementById('territoriesList');
            list.innerHTML = '';
            
            territories.forEach(territory => {
                const item = document.createElement('div');
                item.className = 'agent-list-item';
                item.style.borderLeftColor = getIdeologyColor(territory.ideology);
                item.innerHTML = \`
                    <strong>\${territory.name}</strong><br>
                    <small>Pop: \${territory.population} • Level: \${territory.development_level}</small>
                \`;
                list.appendChild(item);
            });
        }
        
        function updateCommunications(communications) {
            const feed = document.getElementById('communicationFeed');
            feed.innerHTML = '';
            
            communications.slice(-15).reverse().forEach(comm => {
                const item = document.createElement('div');
                item.className = 'communication-item';
                item.style.borderLeftColor = getIdeologyColor(comm.ideology);
                item.innerHTML = \`
                    <strong>\${comm.agentName}:</strong> \${comm.message} \${comm.meme}<br>
                    <small>\${new Date(comm.timestamp).toLocaleTimeString()}</small>
                \`;
                feed.appendChild(item);
            });
        }
        
        function updateEvents(events) {
            const list = document.getElementById('eventsList');
            list.innerHTML = '';
            
            events.filter(e => e.active).forEach(event => {
                const item = document.createElement('div');
                item.className = 'event-item';
                item.innerHTML = \`
                    <strong>\${event.title}</strong><br>
                    <small>\${event.description}</small>
                \`;
                list.appendChild(item);
            });
        }
        
        async function togglePause() {
            const response = await fetch('/api/pause');
            const data = await response.json();
            console.log('Game paused:', data.paused);
        }
        
        async function changeSpeed() {
            const response = await fetch('/api/speed');
            const data = await response.json();
            console.log('Game speed:', data.speed + 'x');
        }
        
        function resetView() {
            // Center the view on the most active area
            console.log('View reset to civilization center');
        }
        
        // Initialize
        initializeWebSocket();
    </script>
</body>
</html>`;
    }
}

// Start the civilization tycoon
if (require.main === module) {
    const tycoon = new DepthsCivilizationTycoon();
    tycoon.startCivilizationTycoon().catch(console.error);
}

module.exports = DepthsCivilizationTycoon;