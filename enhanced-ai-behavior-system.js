#!/usr/bin/env node

/**
 * 🧠 ENHANCED AI BEHAVIOR SYSTEM
 * 
 * Replaces spinning-in-circles behavior with intelligent pathfinding
 * and context-aware dialogue for NPCs and AI agents
 */

const EventEmitter = require('events');

class EnhancedAIBehaviorSystem extends EventEmitter {
    constructor() {
        super();
        
        // AI Configuration
        this.config = {
            pathfinding: {
                gridSize: 16,         // Pathfinding grid resolution
                updateRate: 100,      // ms between path updates
                maxPathLength: 50,    // Maximum path nodes
                avoidanceRadius: 2    // Units to avoid other agents
            },
            behaviors: {
                idle: { weight: 0.1, duration: [2000, 5000] },
                explore: { weight: 0.3, radius: 30 },
                gather: { weight: 0.4, targetTypes: ['tree', 'ore', 'crystal'] },
                build: { weight: 0.2, structures: ['house', 'tower', 'bridge'] },
                socialize: { weight: 0.3, conversationRange: 5 },
                trade: { weight: 0.2, items: ['wood', 'stone', 'gold'] }
            },
            dialogue: {
                contextRadius: 10,    // Units to consider for context
                memorySize: 20,       // Recent interactions to remember
                personalityTypes: ['friendly', 'cautious', 'aggressive', 'merchant', 'scholar']
            }
        };
        
        // Active AI agents
        this.agents = new Map();
        
        // Pathfinding grid
        this.navigationGrid = null;
        
        // Conversation memory
        this.conversationHistory = new Map();
        
        // Goal system
        this.goalManager = new GoalManager();
    }
    
    /**
     * Initialize AI system
     */
    async init(worldData) {
        console.log('🧠 Initializing Enhanced AI Behavior System...');
        
        // Build navigation grid from world data
        this.buildNavigationGrid(worldData);
        
        // Start behavior update loop
        this.startBehaviorLoop();
        
        console.log('✅ AI Behavior System initialized');
    }
    
    /**
     * Create a new AI agent
     */
    createAgent(options = {}) {
        const agent = {
            id: options.id || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: options.name || this.generateAgentName(),
            position: options.position || { x: 0, y: 0, z: 0 },
            rotation: options.rotation || { x: 0, y: 0, z: 0 },
            
            // Behavior state
            currentBehavior: 'idle',
            behaviorTimer: 0,
            currentGoal: null,
            currentPath: [],
            pathIndex: 0,
            
            // Personality
            personality: options.personality || this.randomPersonality(),
            mood: 'neutral',
            energy: 100,
            
            // Inventory and stats
            inventory: options.inventory || [],
            skills: options.skills || {
                mining: 1,
                building: 1,
                combat: 1,
                trading: 1
            },
            
            // Social
            relationships: new Map(),
            lastConversation: null,
            knownInformation: [],
            
            // Movement
            velocity: { x: 0, y: 0, z: 0 },
            speed: options.speed || 5,
            isMoving: false,
            destination: null
        };
        
        this.agents.set(agent.id, agent);
        
        // Start with a random goal
        this.assignNewGoal(agent);
        
        console.log(`🤖 Created AI agent: ${agent.name} (${agent.personality.type})`);
        
        return agent;
    }
    
    /**
     * Build navigation grid for pathfinding
     */
    buildNavigationGrid(worldData) {
        const { width, height, obstacles } = worldData;
        const gridSize = this.config.pathfinding.gridSize;
        
        // Create grid
        const gridWidth = Math.ceil(width / gridSize);
        const gridHeight = Math.ceil(height / gridSize);
        
        this.navigationGrid = {
            width: gridWidth,
            height: gridHeight,
            size: gridSize,
            cells: new Array(gridWidth * gridHeight).fill(0)
        };
        
        // Mark obstacles
        if (obstacles) {
            obstacles.forEach(obstacle => {
                const gridX = Math.floor(obstacle.x / gridSize);
                const gridZ = Math.floor(obstacle.z / gridSize);
                const index = gridZ * gridWidth + gridX;
                
                if (index >= 0 && index < this.navigationGrid.cells.length) {
                    this.navigationGrid.cells[index] = 1; // 1 = blocked
                }
            });
        }
        
        console.log(`📍 Built navigation grid: ${gridWidth}x${gridHeight}`);
    }
    
    /**
     * A* Pathfinding algorithm
     */
    findPath(start, end) {
        if (!this.navigationGrid) return [];
        
        const grid = this.navigationGrid;
        const startNode = this.worldToGrid(start);
        const endNode = this.worldToGrid(end);
        
        // Check if start and end are valid
        if (!this.isValidGridPos(startNode) || !this.isValidGridPos(endNode)) {
            return [];
        }
        
        // A* implementation
        const openSet = [startNode];
        const closedSet = new Set();
        const gScore = new Map();
        const fScore = new Map();
        const cameFrom = new Map();
        
        const nodeKey = (node) => `${node.x},${node.z}`;
        
        gScore.set(nodeKey(startNode), 0);
        fScore.set(nodeKey(startNode), this.heuristic(startNode, endNode));
        
        while (openSet.length > 0) {
            // Get node with lowest fScore
            let current = openSet.reduce((lowest, node) => {
                const f1 = fScore.get(nodeKey(lowest)) || Infinity;
                const f2 = fScore.get(nodeKey(node)) || Infinity;
                return f2 < f1 ? node : lowest;
            });
            
            // Check if we reached the goal
            if (current.x === endNode.x && current.z === endNode.z) {
                return this.reconstructPath(cameFrom, current);
            }
            
            // Move current from open to closed
            openSet.splice(openSet.indexOf(current), 1);
            closedSet.add(nodeKey(current));
            
            // Check neighbors
            const neighbors = this.getNeighbors(current);
            
            for (const neighbor of neighbors) {
                const neighborKey = nodeKey(neighbor);
                
                if (closedSet.has(neighborKey)) continue;
                
                const tentativeGScore = (gScore.get(nodeKey(current)) || 0) + 1;
                
                if (!openSet.some(n => n.x === neighbor.x && n.z === neighbor.z)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
                    continue;
                }
                
                // This path is the best so far
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, endNode));
            }
            
            // Limit iterations to prevent infinite loops
            if (closedSet.size > this.config.pathfinding.maxPathLength) {
                console.log('Path too long, aborting');
                break;
            }
        }
        
        return []; // No path found
    }
    
    /**
     * Heuristic function for A* (Manhattan distance)
     */
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
    }
    
    /**
     * Get valid neighbors for pathfinding
     */
    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: 0, z: -1 },  // North
            { x: 1, z: 0 },   // East
            { x: 0, z: 1 },   // South
            { x: -1, z: 0 },  // West
            { x: 1, z: -1 },  // NE
            { x: 1, z: 1 },   // SE
            { x: -1, z: 1 },  // SW
            { x: -1, z: -1 }  // NW
        ];
        
        for (const dir of directions) {
            const neighbor = {
                x: node.x + dir.x,
                z: node.z + dir.z
            };
            
            if (this.isValidGridPos(neighbor) && !this.isBlocked(neighbor)) {
                neighbors.push(neighbor);
            }
        }
        
        return neighbors;
    }
    
    /**
     * Check if grid position is valid
     */
    isValidGridPos(pos) {
        return pos.x >= 0 && pos.x < this.navigationGrid.width &&
               pos.z >= 0 && pos.z < this.navigationGrid.height;
    }
    
    /**
     * Check if grid position is blocked
     */
    isBlocked(pos) {
        const index = pos.z * this.navigationGrid.width + pos.x;
        return this.navigationGrid.cells[index] === 1;
    }
    
    /**
     * Convert world coordinates to grid coordinates
     */
    worldToGrid(worldPos) {
        return {
            x: Math.floor(worldPos.x / this.navigationGrid.size),
            z: Math.floor(worldPos.z / this.navigationGrid.size)
        };
    }
    
    /**
     * Convert grid coordinates to world coordinates
     */
    gridToWorld(gridPos) {
        return {
            x: (gridPos.x + 0.5) * this.navigationGrid.size,
            y: 0,
            z: (gridPos.z + 0.5) * this.navigationGrid.size
        };
    }
    
    /**
     * Reconstruct path from A* result
     */
    reconstructPath(cameFrom, current) {
        const path = [current];
        const nodeKey = (node) => `${node.x},${node.z}`;
        
        while (cameFrom.has(nodeKey(current))) {
            current = cameFrom.get(nodeKey(current));
            path.unshift(current);
        }
        
        // Convert grid path to world coordinates
        return path.map(node => this.gridToWorld(node));
    }
    
    /**
     * Start behavior update loop
     */
    startBehaviorLoop() {
        setInterval(() => {
            this.agents.forEach(agent => {
                this.updateAgentBehavior(agent);
                this.updateAgentMovement(agent);
                this.updateAgentDialogue(agent);
            });
        }, this.config.pathfinding.updateRate);
    }
    
    /**
     * Update agent behavior
     */
    updateAgentBehavior(agent) {
        agent.behaviorTimer -= this.config.pathfinding.updateRate;
        
        // Check if current goal is complete
        if (this.isGoalComplete(agent)) {
            this.assignNewGoal(agent);
        }
        
        // Execute current behavior
        switch (agent.currentBehavior) {
            case 'idle':
                this.executeIdleBehavior(agent);
                break;
                
            case 'explore':
                this.executeExploreBehavior(agent);
                break;
                
            case 'gather':
                this.executeGatherBehavior(agent);
                break;
                
            case 'build':
                this.executeBuildBehavior(agent);
                break;
                
            case 'socialize':
                this.executeSocializeBehavior(agent);
                break;
                
            case 'trade':
                this.executeTradeBehavior(agent);
                break;
        }
    }
    
    /**
     * Assign new goal to agent
     */
    assignNewGoal(agent) {
        // Weight-based behavior selection
        const behaviors = Object.entries(this.config.behaviors);
        const totalWeight = behaviors.reduce((sum, [_, config]) => sum + config.weight, 0);
        
        let random = Math.random() * totalWeight;
        let selectedBehavior = 'idle';
        
        for (const [behavior, config] of behaviors) {
            random -= config.weight;
            if (random <= 0) {
                selectedBehavior = behavior;
                break;
            }
        }
        
        agent.currentBehavior = selectedBehavior;
        agent.currentGoal = this.goalManager.createGoal(selectedBehavior, agent);
        
        // Set behavior duration
        const behaviorConfig = this.config.behaviors[selectedBehavior];
        if (behaviorConfig.duration) {
            const [min, max] = behaviorConfig.duration;
            agent.behaviorTimer = min + Math.random() * (max - min);
        }
        
        console.log(`🎯 ${agent.name} new goal: ${selectedBehavior}`);
        
        this.emit('goal-assigned', { agent, goal: agent.currentGoal });
    }
    
    /**
     * Execute idle behavior
     */
    executeIdleBehavior(agent) {
        // Stop moving
        agent.isMoving = false;
        agent.velocity = { x: 0, y: 0, z: 0 };
        
        // Occasionally look around
        if (Math.random() < 0.1) {
            agent.rotation.y = Math.random() * Math.PI * 2;
        }
        
        // Maybe stretch or yawn (animation trigger)
        if (Math.random() < 0.05) {
            this.emit('agent-animation', { agent, animation: 'idle_stretch' });
        }
    }
    
    /**
     * Execute explore behavior
     */
    executeExploreBehavior(agent) {
        if (!agent.destination || agent.behaviorTimer <= 0) {
            // Pick random destination within explore radius
            const radius = this.config.behaviors.explore.radius;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            
            agent.destination = {
                x: agent.position.x + Math.cos(angle) * distance,
                y: agent.position.y,
                z: agent.position.z + Math.sin(angle) * distance
            };
            
            // Find path to destination
            agent.currentPath = this.findPath(agent.position, agent.destination);
            agent.pathIndex = 0;
        }
        
        this.followPath(agent);
    }
    
    /**
     * Execute gather behavior
     */
    executeGatherBehavior(agent) {
        if (!agent.currentGoal.target) {
            // Find nearest gatherable resource
            const target = this.findNearestResource(agent);
            if (target) {
                agent.currentGoal.target = target;
                agent.destination = target.position;
                agent.currentPath = this.findPath(agent.position, agent.destination);
                agent.pathIndex = 0;
            } else {
                // No resources found, switch to explore
                agent.currentBehavior = 'explore';
                return;
            }
        }
        
        // Move to resource
        if (this.distanceTo(agent, agent.currentGoal.target) > 2) {
            this.followPath(agent);
        } else {
            // Gather resource
            this.gatherResource(agent, agent.currentGoal.target);
        }
    }
    
    /**
     * Execute build behavior
     */
    executeBuildBehavior(agent) {
        if (!agent.currentGoal.buildSite) {
            // Find or create build site
            const buildSite = this.findOrCreateBuildSite(agent);
            if (buildSite) {
                agent.currentGoal.buildSite = buildSite;
                agent.destination = buildSite.position;
                agent.currentPath = this.findPath(agent.position, agent.destination);
                agent.pathIndex = 0;
            } else {
                // Can't build, switch to gather
                agent.currentBehavior = 'gather';
                return;
            }
        }
        
        // Move to build site
        if (this.distanceTo(agent, agent.currentGoal.buildSite) > 3) {
            this.followPath(agent);
        } else {
            // Build
            this.buildStructure(agent, agent.currentGoal.buildSite);
        }
    }
    
    /**
     * Execute socialize behavior
     */
    executeSocializeBehavior(agent) {
        if (!agent.currentGoal.socialTarget) {
            // Find nearby agent to talk to
            const nearbyAgent = this.findNearbyAgent(agent);
            if (nearbyAgent) {
                agent.currentGoal.socialTarget = nearbyAgent;
                agent.destination = {
                    x: nearbyAgent.position.x + (Math.random() - 0.5) * 4,
                    y: nearbyAgent.position.y,
                    z: nearbyAgent.position.z + (Math.random() - 0.5) * 4
                };
                agent.currentPath = this.findPath(agent.position, agent.destination);
                agent.pathIndex = 0;
            } else {
                // No one nearby, explore
                agent.currentBehavior = 'explore';
                return;
            }
        }
        
        const target = agent.currentGoal.socialTarget;
        const distance = this.distanceTo(agent, target);
        
        if (distance > this.config.dialogue.conversationRange) {
            this.followPath(agent);
        } else {
            // Stop and face target
            agent.isMoving = false;
            const dx = target.position.x - agent.position.x;
            const dz = target.position.z - agent.position.z;
            agent.rotation.y = Math.atan2(dx, dz);
            
            // Have conversation
            this.startConversation(agent, target);
        }
    }
    
    /**
     * Execute trade behavior
     */
    executeTradeBehavior(agent) {
        if (!agent.currentGoal.tradePartner) {
            // Find trading partner
            const trader = this.findTradingPartner(agent);
            if (trader) {
                agent.currentGoal.tradePartner = trader;
                agent.destination = trader.position;
                agent.currentPath = this.findPath(agent.position, agent.destination);
                agent.pathIndex = 0;
            } else {
                // No traders, gather more resources
                agent.currentBehavior = 'gather';
                return;
            }
        }
        
        const partner = agent.currentGoal.tradePartner;
        const distance = this.distanceTo(agent, partner);
        
        if (distance > 3) {
            this.followPath(agent);
        } else {
            // Execute trade
            this.executeTrade(agent, partner);
        }
    }
    
    /**
     * Follow path for agent
     */
    followPath(agent) {
        if (!agent.currentPath || agent.currentPath.length === 0) {
            agent.isMoving = false;
            return;
        }
        
        if (agent.pathIndex >= agent.currentPath.length) {
            // Reached destination
            agent.isMoving = false;
            agent.currentPath = [];
            return;
        }
        
        const target = agent.currentPath[agent.pathIndex];
        const distance = Math.sqrt(
            Math.pow(target.x - agent.position.x, 2) +
            Math.pow(target.z - agent.position.z, 2)
        );
        
        if (distance < 1) {
            // Reached waypoint, move to next
            agent.pathIndex++;
        } else {
            // Move towards current waypoint
            const dx = target.x - agent.position.x;
            const dz = target.z - agent.position.z;
            const length = Math.sqrt(dx * dx + dz * dz);
            
            agent.velocity.x = (dx / length) * agent.speed;
            agent.velocity.z = (dz / length) * agent.speed;
            agent.isMoving = true;
            
            // Update rotation to face movement direction
            agent.rotation.y = Math.atan2(dx, dz);
        }
    }
    
    /**
     * Update agent movement
     */
    updateAgentMovement(agent) {
        if (!agent.isMoving) return;
        
        // Apply velocity
        const deltaTime = this.config.pathfinding.updateRate / 1000;
        agent.position.x += agent.velocity.x * deltaTime;
        agent.position.z += agent.velocity.z * deltaTime;
        
        // Collision avoidance with other agents
        this.agents.forEach(other => {
            if (other.id === agent.id) return;
            
            const distance = this.distanceTo(agent, other);
            if (distance < this.config.pathfinding.avoidanceRadius) {
                // Push agents apart
                const dx = agent.position.x - other.position.x;
                const dz = agent.position.z - other.position.z;
                const length = Math.sqrt(dx * dx + dz * dz);
                
                if (length > 0) {
                    const force = (this.config.pathfinding.avoidanceRadius - distance) / 2;
                    agent.position.x += (dx / length) * force;
                    agent.position.z += (dz / length) * force;
                }
            }
        });
        
        // Emit movement update
        this.emit('agent-moved', { agent });
    }
    
    /**
     * Update agent dialogue
     */
    updateAgentDialogue(agent) {
        // Clean up old conversations
        if (agent.lastConversation && 
            Date.now() - agent.lastConversation.timestamp > 10000) {
            agent.lastConversation = null;
        }
    }
    
    /**
     * Start conversation between agents
     */
    startConversation(agent1, agent2) {
        // Don't start new conversation if recently talked
        const key = `${agent1.id}_${agent2.id}`;
        const reverseKey = `${agent2.id}_${agent1.id}`;
        
        const recentConv = this.conversationHistory.get(key) || 
                          this.conversationHistory.get(reverseKey);
        
        if (recentConv && Date.now() - recentConv.timestamp < 30000) {
            return; // Too soon for another conversation
        }
        
        // Generate context-aware dialogue
        const dialogue = this.generateDialogue(agent1, agent2);
        
        // Store conversation
        const conversation = {
            participants: [agent1.id, agent2.id],
            dialogue: dialogue,
            timestamp: Date.now(),
            location: agent1.position,
            context: this.getConversationContext(agent1, agent2)
        };
        
        this.conversationHistory.set(key, conversation);
        agent1.lastConversation = conversation;
        agent2.lastConversation = conversation;
        
        // Update relationships
        this.updateRelationship(agent1, agent2, 0.1);
        
        // Emit dialogue event
        this.emit('conversation', {
            agent1: agent1,
            agent2: agent2,
            dialogue: dialogue
        });
        
        console.log(`💬 ${agent1.name} → ${agent2.name}: ${dialogue.message}`);
    }
    
    /**
     * Generate context-aware dialogue
     */
    generateDialogue(speaker, listener) {
        const context = this.getConversationContext(speaker, listener);
        const personality = speaker.personality;
        
        let message = '';
        let emotion = 'neutral';
        
        // Based on current behavior
        switch (speaker.currentBehavior) {
            case 'gather':
                if (personality.type === 'friendly') {
                    message = `Hey ${listener.name}! Found some great ${context.nearbyResources[0] || 'resources'} over here!`;
                    emotion = 'happy';
                } else if (personality.type === 'cautious') {
                    message = `Oh, hello. Just gathering some materials...`;
                    emotion = 'nervous';
                } else {
                    message = `These resources are mine, find your own spot.`;
                    emotion = 'defensive';
                }
                break;
                
            case 'build':
                if (context.hasSharedProject) {
                    message = `Want to help me finish this ${speaker.currentGoal.buildSite.type}?`;
                    emotion = 'hopeful';
                } else {
                    message = `Working on a new ${speaker.currentGoal.buildSite.type}. It's going to be great!`;
                    emotion = 'proud';
                }
                break;
                
            case 'explore':
                if (personality.type === 'scholar') {
                    message = `Have you seen anything interesting in the ${context.direction} area?`;
                    emotion = 'curious';
                } else {
                    message = `Just out for a walk. Nice weather, isn't it?`;
                    emotion = 'content';
                }
                break;
                
            case 'trade':
                if (speaker.inventory.length > 5) {
                    message = `I've got plenty of ${speaker.inventory[0].type} if you need any. Good prices!`;
                    emotion = 'merchant';
                } else {
                    message = `Looking to buy some materials. Got anything to sell?`;
                    emotion = 'interested';
                }
                break;
                
            default:
                // Idle chat based on relationship
                const relationship = speaker.relationships.get(listener.id) || 0;
                if (relationship > 0.5) {
                    message = `Good to see you again, ${listener.name}!`;
                    emotion = 'friendly';
                } else if (relationship < -0.5) {
                    message = `Oh. It's you.`;
                    emotion = 'cold';
                } else {
                    message = `Hello there!`;
                    emotion = 'neutral';
                }
        }
        
        // Add contextual observations
        if (context.timeOfDay === 'night' && Math.random() < 0.3) {
            message += ` Getting dark, isn't it?`;
        }
        
        if (context.nearbyDanger && personality.type === 'cautious') {
            message += ` Be careful, I heard strange noises earlier...`;
            emotion = 'worried';
        }
        
        return {
            message: message,
            emotion: emotion,
            intent: speaker.currentBehavior,
            timestamp: Date.now()
        };
    }
    
    /**
     * Get conversation context
     */
    getConversationContext(agent1, agent2) {
        const context = {
            location: agent1.position,
            timeOfDay: this.getTimeOfDay(),
            weather: this.getWeather(),
            nearbyResources: this.scanNearbyResources(agent1.position, 20),
            nearbyDanger: this.checkNearbyDanger(agent1.position, 30),
            hasSharedProject: this.checkSharedProject(agent1, agent2),
            direction: this.getCardinalDirection(agent1.position, agent2.position),
            crowded: this.countNearbyAgents(agent1.position, 15) > 3
        };
        
        return context;
    }
    
    /**
     * Helper functions
     */
    
    distanceTo(agent1, target) {
        const pos1 = agent1.position;
        const pos2 = target.position || target;
        
        return Math.sqrt(
            Math.pow(pos2.x - pos1.x, 2) +
            Math.pow(pos2.y - pos1.y, 2) +
            Math.pow(pos2.z - pos1.z, 2)
        );
    }
    
    findNearbyAgent(agent, maxDistance = 20) {
        let nearest = null;
        let nearestDist = maxDistance;
        
        this.agents.forEach(other => {
            if (other.id === agent.id) return;
            
            const dist = this.distanceTo(agent, other);
            if (dist < nearestDist) {
                nearest = other;
                nearestDist = dist;
            }
        });
        
        return nearest;
    }
    
    countNearbyAgents(position, radius) {
        let count = 0;
        this.agents.forEach(agent => {
            const dist = Math.sqrt(
                Math.pow(agent.position.x - position.x, 2) +
                Math.pow(agent.position.z - position.z, 2)
            );
            if (dist < radius) count++;
        });
        return count;
    }
    
    updateRelationship(agent1, agent2, change) {
        const current = agent1.relationships.get(agent2.id) || 0;
        const newValue = Math.max(-1, Math.min(1, current + change));
        agent1.relationships.set(agent2.id, newValue);
        
        // Reciprocal relationship
        const current2 = agent2.relationships.get(agent1.id) || 0;
        agent2.relationships.set(agent1.id, Math.max(-1, Math.min(1, current2 + change * 0.8)));
    }
    
    isGoalComplete(agent) {
        if (!agent.currentGoal) return true;
        
        switch (agent.currentBehavior) {
            case 'idle':
                return agent.behaviorTimer <= 0;
                
            case 'explore':
                return agent.behaviorTimer <= 0 || 
                       (agent.destination && this.distanceTo(agent, { position: agent.destination }) < 2);
                
            case 'gather':
                return agent.currentGoal.gathered >= agent.currentGoal.target.amount;
                
            case 'build':
                return agent.currentGoal.buildSite && agent.currentGoal.buildSite.complete;
                
            case 'socialize':
                return agent.lastConversation && 
                       Date.now() - agent.lastConversation.timestamp > 5000;
                
            case 'trade':
                return agent.currentGoal.tradeComplete;
                
            default:
                return true;
        }
    }
    
    generateAgentName() {
        const firstNames = ['Alex', 'Blake', 'Casey', 'Drew', 'Ellis', 'Finn', 'Gray', 'Harper'];
        const lastNames = ['Walker', 'Builder', 'Miner', 'Trader', 'Scout', 'Keeper', 'Smith'];
        
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    }
    
    randomPersonality() {
        const types = this.config.dialogue.personalityTypes;
        const type = types[Math.floor(Math.random() * types.length)];
        
        return {
            type: type,
            traits: this.generatePersonalityTraits(type),
            preferences: this.generatePreferences(type)
        };
    }
    
    generatePersonalityTraits(type) {
        const traitSets = {
            friendly: { social: 0.8, helpful: 0.9, aggressive: 0.1 },
            cautious: { social: 0.3, helpful: 0.5, aggressive: 0.2 },
            aggressive: { social: 0.2, helpful: 0.1, aggressive: 0.9 },
            merchant: { social: 0.7, helpful: 0.6, aggressive: 0.3 },
            scholar: { social: 0.5, helpful: 0.7, aggressive: 0.1 }
        };
        
        return traitSets[type] || traitSets.friendly;
    }
    
    generatePreferences(type) {
        const prefSets = {
            friendly: { behaviors: ['socialize', 'build'], avoidCombat: true },
            cautious: { behaviors: ['gather', 'explore'], avoidCrowds: true },
            aggressive: { behaviors: ['explore', 'gather'], seekCombat: true },
            merchant: { behaviors: ['trade', 'gather'], seekProfit: true },
            scholar: { behaviors: ['explore', 'socialize'], seekKnowledge: true }
        };
        
        return prefSets[type] || prefSets.friendly;
    }
    
    // Stub methods - implement based on your world system
    findNearestResource(agent) {
        // Return nearest gatherable resource
        return null;
    }
    
    findOrCreateBuildSite(agent) {
        // Return available build site
        return null;
    }
    
    findTradingPartner(agent) {
        // Return agent willing to trade
        return null;
    }
    
    gatherResource(agent, resource) {
        // Handle resource gathering
        if (!agent.currentGoal.gathered) {
            agent.currentGoal.gathered = 0;
        }
        agent.currentGoal.gathered++;
        
        this.emit('resource-gathered', { agent, resource });
    }
    
    buildStructure(agent, buildSite) {
        // Handle building
        if (!buildSite.progress) buildSite.progress = 0;
        buildSite.progress += agent.skills.building * 0.1;
        
        if (buildSite.progress >= 100) {
            buildSite.complete = true;
            this.emit('structure-complete', { agent, structure: buildSite });
        }
    }
    
    executeTrade(agent, partner) {
        // Handle trading
        agent.currentGoal.tradeComplete = true;
        this.emit('trade-complete', { agent1: agent, agent2: partner });
    }
    
    scanNearbyResources(position, radius) {
        // Return types of resources nearby
        return ['wood', 'stone', 'ore'];
    }
    
    checkNearbyDanger(position, radius) {
        // Check for dangers
        return false;
    }
    
    checkSharedProject(agent1, agent2) {
        // Check if agents share a project
        return false;
    }
    
    getCardinalDirection(from, to) {
        const dx = to.x - from.x;
        const dz = to.z - from.z;
        const angle = Math.atan2(dx, dz);
        const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
        const index = Math.round(angle / (Math.PI / 4)) + 4;
        return directions[index % 8];
    }
    
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 6) return 'night';
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        return 'evening';
    }
    
    getWeather() {
        return 'clear'; // Placeholder
    }
}

/**
 * Goal Manager for AI agents
 */
class GoalManager {
    createGoal(type, agent) {
        const goals = {
            idle: {
                type: 'idle',
                duration: 3000
            },
            explore: {
                type: 'explore',
                destination: null,
                discovered: []
            },
            gather: {
                type: 'gather',
                target: null,
                gathered: 0,
                quota: 10
            },
            build: {
                type: 'build',
                buildSite: null,
                materialsNeeded: ['wood', 'stone'],
                progress: 0
            },
            socialize: {
                type: 'socialize',
                socialTarget: null,
                topicsDiscussed: []
            },
            trade: {
                type: 'trade',
                tradePartner: null,
                offering: null,
                seeking: null,
                tradeComplete: false
            }
        };
        
        return goals[type] || goals.idle;
    }
}

// Export for use in games
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedAIBehaviorSystem;
} else if (typeof window !== 'undefined') {
    window.EnhancedAIBehaviorSystem = EnhancedAIBehaviorSystem;
}

// Example usage
if (require.main === module) {
    console.log('🧠 Enhanced AI Behavior System');
    console.log('============================');
    console.log('Features:');
    console.log('• A* Pathfinding for intelligent movement');
    console.log('• Goal-oriented behavior system');
    console.log('• Context-aware dialogue generation');
    console.log('• Personality-driven interactions');
    console.log('• Social relationships and memory');
    console.log('• Dynamic behavior switching');
    console.log('');
    console.log('Behaviors: idle, explore, gather, build, socialize, trade');
    console.log('');
    console.log('This fixes the "spinning in circles" problem!');
}