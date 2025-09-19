#!/usr/bin/env node

/**
 * UNIFIED 6-AGENT SWARM SYSTEM
 * 5 visible agents + 1 invisible "eyes in the sky" shadow agent
 * Action-triggered swarming mechanics with Second Life-style behavior
 * Pure shape/color-based system - NO EMOJIS
 */

const crypto = require('crypto');
const http = require('http');

class UnifiedSwarmSystem {
    constructor() {
        this.agents = new Map();
        this.shadowAgent = null;
        this.swarmState = 'dormant';
        this.actionTriggers = new Map();
        this.streamerInvisibility = true;
        
        // Color-based agent identification (purple on black, green text)
        this.agentColors = {
            primary: { hex: '#9400D3', name: 'purple' },    // Purple
            secondary: { hex: '#000000', name: 'black' },   // Black background
            accent: { hex: '#00FF00', name: 'green' },      // Green text
            warning: { hex: '#FF0000', name: 'red' },       // Red lasers
            shadow: { hex: '#1A1A1A', name: 'shadow' }     // Shadow agent
        };
        
        // Shape-based agent types (no emojis)
        this.agentShapes = {
            scraper: { shape: 'triangle', base: 3 },
            validator: { shape: 'octagon', base: 8 },
            duo: { shape: 'double_diamond', base: 4 },
            tower: { shape: 'cylinder', base: 1 },
            drone: { shape: 'cross', base: 4 },
            shadow: { shape: 'void', base: 0 }
        };
        
        // Bitmap representations for each agent type
        this.bitmapMaps = new Map();
        this.initializeBitmapMaps();
        
        console.log('Unified 6-Agent Swarm System initialized');
        console.log('Agent colors: Purple primary, Black background, Green text');
    }
    
    initializeBitmapMaps() {
        // Convert each agent shape to 8x8 bitmap array
        Object.entries(this.agentShapes).forEach(([type, config]) => {
            this.bitmapMaps.set(type, this.generateShapeBitmap(config.shape, config.base));
        });
    }
    
    generateShapeBitmap(shape, base) {
        const bitmap = Array(8).fill().map(() => Array(8).fill(0));
        
        switch (shape) {
            case 'triangle':
                // Triangle shape for scraper
                bitmap[6][4] = 1;
                bitmap[5][3] = bitmap[5][5] = 1;
                bitmap[4][2] = bitmap[4][6] = 1;
                bitmap[3][1] = bitmap[3][7] = 1;
                break;
                
            case 'octagon':
                // Octagon shape for validator
                bitmap[2][3] = bitmap[2][4] = 1;
                bitmap[3][2] = bitmap[3][5] = 1;
                bitmap[4][1] = bitmap[4][6] = 1;
                bitmap[5][2] = bitmap[5][5] = 1;
                bitmap[6][3] = bitmap[6][4] = 1;
                break;
                
            case 'double_diamond':
                // Double diamond for duo
                bitmap[3][2] = bitmap[3][6] = 1;
                bitmap[4][3] = bitmap[4][5] = 1;
                bitmap[5][2] = bitmap[5][6] = 1;
                break;
                
            case 'cylinder':
                // Cylinder for tower
                for (let i = 2; i < 6; i++) {
                    bitmap[i][3] = bitmap[i][4] = 1;
                }
                break;
                
            case 'cross':
                // Cross shape for drone
                bitmap[3][4] = bitmap[4][3] = bitmap[4][4] = bitmap[4][5] = bitmap[5][4] = 1;
                break;
                
            case 'void':
                // Empty/invisible for shadow agent
                // All zeros - invisible representation
                break;
        }
        
        return {
            shape: shape,
            matrix: bitmap,
            hash: this.generateBitmapHash(bitmap),
            color: this.agentColors.primary.hex
        };
    }
    
    generateBitmapHash(bitmap) {
        const flatBitmap = bitmap.flat().join('');
        return crypto.createHash('sha256').update(flatBitmap).digest('hex').substring(0, 8);
    }
    
    // Initialize the 6-agent system
    async initialize() {
        console.log('Initializing 6-agent swarm system...');
        
        // Create 5 visible agents
        const visibleAgents = [
            { type: 'scraper', id: 'agent_01', position: { x: 0, y: 0, z: 0 } },
            { type: 'validator', id: 'agent_02', position: { x: 10, y: 0, z: 0 } },
            { type: 'duo', id: 'agent_03', position: { x: 0, y: 0, z: 10 } },
            { type: 'tower', id: 'agent_04', position: { x: -10, y: 0, z: 0 } },
            { type: 'drone', id: 'agent_05', position: { x: 0, y: 15, z: -10 } }
        ];
        
        // Create visible agents
        for (const agentConfig of visibleAgents) {
            const agent = this.createAgent(agentConfig);
            this.agents.set(agent.id, agent);
            await this.activateAgent(agent);
        }
        
        // Create invisible shadow agent (eyes in the sky)
        this.shadowAgent = this.createShadowAgent();
        await this.activateShadowAgent();
        
        // Setup action trigger monitoring
        this.setupActionTriggers();
        
        // Start swarm coordination
        this.startSwarmCoordination();
        
        console.log('6-agent swarm system active');
        console.log('5 visible agents + 1 shadow surveillance agent');
    }
    
    createAgent(config) {
        const bitmap = this.bitmapMaps.get(config.type);
        
        return {
            id: config.id,
            type: config.type,
            visible: true,
            position: config.position,
            velocity: { x: 0, y: 0, z: 0 },
            state: 'dormant',
            bitmap: bitmap,
            colorProfile: {
                primary: this.agentColors.primary.hex,
                background: this.agentColors.secondary.hex,
                text: this.agentColors.accent.hex
            },
            autonomy: {
                active: false,
                currentTask: null,
                decisionQueue: [],
                memory: new Map()
            },
            swarming: {
                triggerRadius: 25,
                swarmSpeed: 8,
                alertLevel: 'normal'
            },
            created: Date.now()
        };
    }
    
    createShadowAgent() {
        const shadowBitmap = this.bitmapMaps.get('shadow');
        
        return {
            id: 'shadow_surveillance',
            type: 'shadow',
            visible: false,
            position: { x: 0, y: 50, z: 0 }, // High altitude
            velocity: { x: 0, y: 0, z: 0 },
            state: 'monitoring',
            bitmap: shadowBitmap,
            colorProfile: {
                primary: this.agentColors.shadow.hex,
                lasers: this.agentColors.warning.hex,
                invisible: true
            },
            surveillance: {
                range: 100,
                trackingTargets: [],
                threatLevel: 'green',
                laserActive: false
            },
            created: Date.now()
        };
    }
    
    async activateAgent(agent) {
        agent.autonomy.active = true;
        agent.state = 'active';
        
        // Start autonomous behavior loop
        this.startAgentLoop(agent);
        
        console.log(`Agent ${agent.id} activated - ${agent.type} at position`, agent.position);
    }
    
    async activateShadowAgent() {
        this.shadowAgent.state = 'surveillance_active';
        
        // Start shadow surveillance loop
        this.startShadowLoop();
        
        console.log('Shadow surveillance agent active - invisible monitoring');
    }
    
    startAgentLoop(agent) {
        const agentLoop = async () => {
            if (!agent.autonomy.active) return;
            
            try {
                // Agent decision making
                await this.processAgentDecision(agent);
                
                // Update position
                this.updateAgentPosition(agent);
                
                // Check for swarm triggers
                await this.checkSwarmTriggers(agent);
                
            } catch (error) {
                console.error(`Agent ${agent.id} error:`, error);
            }
            
            // Continue loop
            setTimeout(agentLoop, 1000 + Math.random() * 2000);
        };
        
        agentLoop();
    }
    
    startShadowLoop() {
        const shadowLoop = async () => {
            if (this.shadowAgent.state !== 'surveillance_active') return;
            
            try {
                // Monitor all visible agents
                await this.performSurveillance();
                
                // Check for threats or actions
                await this.assessThreats();
                
                // Update position for optimal coverage
                this.updateShadowPosition();
                
            } catch (error) {
                console.error('Shadow agent error:', error);
            }
            
            // Continue surveillance
            setTimeout(shadowLoop, 500); // Faster monitoring
        };
        
        shadowLoop();
    }
    
    async processAgentDecision(agent) {
        const decision = {
            timestamp: Date.now(),
            agent: agent.id,
            action: 'patrol',
            reasoning: []
        };
        
        // Agent-specific behavior based on type
        switch (agent.type) {
            case 'scraper':
                decision.action = 'scan_perimeter';
                decision.reasoning.push('Scanning for external threats');
                break;
                
            case 'validator':
                decision.action = 'verify_systems';
                decision.reasoning.push('Validating system integrity');
                break;
                
            case 'duo':
                decision.action = 'coordinate_pairs';
                decision.reasoning.push('Maintaining dual coordination');
                break;
                
            case 'tower':
                decision.action = 'maintain_position';
                decision.reasoning.push('Providing stationary coverage');
                break;
                
            case 'drone':
                decision.action = 'aerial_patrol';
                decision.reasoning.push('Conducting aerial reconnaissance');
                break;
        }
        
        agent.autonomy.decisionQueue.push(decision);
        return decision;
    }
    
    updateAgentPosition(agent) {
        // Basic movement pattern based on agent type
        const speed = agent.type === 'tower' ? 0 : 1 + Math.random() * 2;
        
        if (agent.type !== 'tower') {
            agent.position.x += (Math.random() - 0.5) * speed;
            agent.position.z += (Math.random() - 0.5) * speed;
            
            if (agent.type === 'drone') {
                agent.position.y = 15 + Math.sin(Date.now() * 0.001) * 5;
            }
        }
        
        // Boundary limits
        agent.position.x = Math.max(-50, Math.min(50, agent.position.x));
        agent.position.z = Math.max(-50, Math.min(50, agent.position.z));
    }
    
    async performSurveillance() {
        // Shadow agent monitors all visible agents
        this.shadowAgent.surveillance.trackingTargets = [];
        
        for (const [id, agent] of this.agents) {
            const distance = this.calculateDistance(this.shadowAgent.position, agent.position);
            
            if (distance <= this.shadowAgent.surveillance.range) {
                this.shadowAgent.surveillance.trackingTargets.push({
                    agentId: id,
                    distance: distance,
                    threat: 'none',
                    status: agent.state
                });
            }
        }
    }
    
    async assessThreats() {
        // Check for actions that should trigger swarm response
        const threats = this.shadowAgent.surveillance.trackingTargets.filter(target => {
            const agent = this.agents.get(target.agentId);
            return agent && agent.swarming.alertLevel !== 'normal';
        });
        
        if (threats.length > 0) {
            this.shadowAgent.surveillance.threatLevel = 'amber';
            this.shadowAgent.surveillance.laserActive = true;
            
            // Trigger swarm if action detected
            await this.triggerSwarmResponse('threat_detected', threats[0]);
        } else {
            this.shadowAgent.surveillance.threatLevel = 'green';
            this.shadowAgent.surveillance.laserActive = false;
        }
    }
    
    updateShadowPosition() {
        // Shadow agent adjusts position for optimal surveillance coverage
        const centerX = Array.from(this.agents.values())
            .reduce((sum, agent) => sum + agent.position.x, 0) / this.agents.size;
        const centerZ = Array.from(this.agents.values())
            .reduce((sum, agent) => sum + agent.position.z, 0) / this.agents.size;
        
        this.shadowAgent.position.x += (centerX - this.shadowAgent.position.x) * 0.1;
        this.shadowAgent.position.z += (centerZ - this.shadowAgent.position.z) * 0.1;
    }
    
    // Action trigger system (like cannonball hitting ship)
    setupActionTriggers() {
        this.actionTriggers.set('cannonball_hit', {
            type: 'impact',
            radius: 30,
            response: 'swarm_converge',
            duration: 5000
        });
        
        this.actionTriggers.set('territory_breach', {
            type: 'intrusion',
            radius: 25,
            response: 'defensive_formation',
            duration: 10000
        });
        
        this.actionTriggers.set('resource_discovered', {
            type: 'opportunity',
            radius: 15,
            response: 'investigation_swarm',
            duration: 8000
        });
    }
    
    async triggerSwarmResponse(triggerType, targetData) {
        if (this.swarmState === 'active') return; // Already swarming
        
        console.log(`Swarm triggered: ${triggerType}`);
        this.swarmState = 'active';
        
        // All visible agents converge on trigger location
        const targetPosition = targetData.position || { x: 0, y: 0, z: 0 };
        
        for (const [id, agent] of this.agents) {
            agent.swarming.alertLevel = 'high';
            agent.state = 'swarming';
            
            // Set convergence target
            agent.autonomy.currentTask = {
                type: 'converge',
                target: targetPosition,
                priority: 'urgent'
            };
        }
        
        // Shadow agent activates red lasers
        this.shadowAgent.surveillance.laserActive = true;
        this.shadowAgent.surveillance.threatLevel = 'red';
        
        // Auto-deactivate after duration
        setTimeout(() => {
            this.deactivateSwarm();
        }, 5000);
    }
    
    deactivateSwarm() {
        this.swarmState = 'dormant';
        
        for (const [id, agent] of this.agents) {
            agent.swarming.alertLevel = 'normal';
            agent.state = 'active';
            agent.autonomy.currentTask = null;
        }
        
        this.shadowAgent.surveillance.laserActive = false;
        this.shadowAgent.surveillance.threatLevel = 'green';
        
        console.log('Swarm deactivated - returning to normal patrol');
    }
    
    async checkSwarmTriggers(agent) {
        // Check if agent has encountered a trigger condition
        for (const [triggerName, trigger] of this.actionTriggers) {
            // Simulate random trigger events (in real system, these would be actual events)
            if (Math.random() < 0.001) { // 0.1% chance per check
                await this.triggerSwarmResponse(triggerName, {
                    agent: agent.id,
                    position: agent.position,
                    type: trigger.type
                });
                break;
            }
        }
    }
    
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    // Streamer invisibility system
    enableStreamerInvisibility(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.streamerInvisible = true;
            console.log(`Agent ${agentId} is now invisible to streamers`);
        }
    }
    
    disableStreamerInvisibility(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.streamerInvisible = false;
            console.log(`Agent ${agentId} is now visible to streamers`);
        }
    }
    
    // Status reporting without emojis
    getSystemStatus() {
        return {
            swarmState: this.swarmState,
            visibleAgents: this.agents.size,
            shadowAgent: {
                active: this.shadowAgent.state === 'surveillance_active',
                monitoring: this.shadowAgent.surveillance.trackingTargets.length,
                threatLevel: this.shadowAgent.surveillance.threatLevel,
                lasersActive: this.shadowAgent.surveillance.laserActive
            },
            agentStates: Array.from(this.agents.values()).map(agent => ({
                id: agent.id,
                type: agent.type,
                state: agent.state,
                position: agent.position,
                bitmap: agent.bitmap.hash
            }))
        };
    }
    
    // Start coordination between all systems
    startSwarmCoordination() {
        setInterval(() => {
            // Periodic coordination checks
            this.coordinateAgentMovement();
            this.updateSwarmFormation();
        }, 2000);
        
        console.log('Swarm coordination active');
    }
    
    coordinateAgentMovement() {
        // Ensure agents maintain formation when not swarming
        if (this.swarmState === 'dormant') {
            // Basic formation maintenance
            const centerPos = this.calculateSwarmCenter();
            
            for (const [id, agent] of this.agents) {
                const distance = this.calculateDistance(agent.position, centerPos);
                
                if (distance > 30) {
                    // Agent is too far from formation
                    agent.autonomy.currentTask = {
                        type: 'return_to_formation',
                        target: centerPos,
                        priority: 'normal'
                    };
                }
            }
        }
    }
    
    calculateSwarmCenter() {
        const agents = Array.from(this.agents.values());
        const center = {
            x: agents.reduce((sum, agent) => sum + agent.position.x, 0) / agents.length,
            y: agents.reduce((sum, agent) => sum + agent.position.y, 0) / agents.length,
            z: agents.reduce((sum, agent) => sum + agent.position.z, 0) / agents.length
        };
        return center;
    }
    
    updateSwarmFormation() {
        // Update formation based on current state
        const formation = this.swarmState === 'active' ? 'convergence' : 'patrol';
        
        // Apply formation-specific positioning
        if (formation === 'patrol') {
            this.maintainPatrolFormation();
        }
    }
    
    maintainPatrolFormation() {
        // Spread agents in efficient patrol pattern
        const agents = Array.from(this.agents.values());
        const angleStep = (2 * Math.PI) / agents.length;
        
        agents.forEach((agent, index) => {
            if (agent.type !== 'tower' && !agent.autonomy.currentTask) {
                const angle = angleStep * index;
                const radius = 20;
                
                const targetX = Math.cos(angle) * radius;
                const targetZ = Math.sin(angle) * radius;
                
                // Gradual movement toward formation position
                agent.position.x += (targetX - agent.position.x) * 0.1;
                agent.position.z += (targetZ - agent.position.z) * 0.1;
            }
        });
    }
}

// Export for integration with other systems
module.exports = UnifiedSwarmSystem;

// CLI interface
if (require.main === module) {
    const swarmSystem = new UnifiedSwarmSystem();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'start':
            console.log('Starting 6-agent swarm system...');
            swarmSystem.initialize();
            
            // Create monitoring server
            const server = http.createServer((req, res) => {
                if (req.url === '/status') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(swarmSystem.getSystemStatus(), null, 2));
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('6-Agent Swarm System Active\nCheck /status for details');
                }
            });
            
            server.listen(8888, () => {
                console.log('Swarm monitoring: http://localhost:8888/status');
            });
            
            break;
            
        case 'test-swarm':
            console.log('Testing swarm trigger...');
            swarmSystem.initialize().then(() => {
                setTimeout(() => {
                    swarmSystem.triggerSwarmResponse('cannonball_hit', {
                        position: { x: 10, y: 0, z: 10 },
                        type: 'impact'
                    });
                }, 3000);
            });
            break;
            
        default:
            console.log('Unified 6-Agent Swarm System');
            console.log('Pure shape/color-based agents - NO EMOJIS');
            console.log('');
            console.log('Commands:');
            console.log('  start         - Start 6-agent swarm system');
            console.log('  test-swarm    - Test swarm trigger mechanics');
            console.log('');
            console.log('Features:');
            console.log('  5 visible agents + 1 invisible shadow surveillance agent');
            console.log('  Action-triggered swarming (cannonball hits ship)');
            console.log('  Red laser overlay from shadow agent');
            console.log('  Streamer invisibility system');
            console.log('  Pure bitmap/shape representation');
            console.log('  Purple on black with green text color scheme');
    }
}