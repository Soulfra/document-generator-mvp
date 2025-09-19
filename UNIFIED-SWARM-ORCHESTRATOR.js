/**
 * Unified Swarm Orchestrator
 * Connects ALL layers through swarm intelligence
 * Coordinates laser/lightning effects between systems
 */

class UnifiedSwarmOrchestrator {
    constructor() {
        this.swarms = new Map();
        this.layers = new Map();
        this.connections = new Map();
        this.groupingAgents = [];
        this.reasoningAgents = [];
        
        // Swarm cloud configuration
        this.swarmCloud = {
            particles: [],
            lightning: [],
            lasers: [],
            centerPoint: { x: 0, y: 0, z: 0 },
            radius: 100,
            intensity: 1.0
        };
        
        // System connections
        this.systems = {
            storybook: null,
            aiWorld: null,
            calMapper: null,
            handshake: null,
            physics: null,
            character: null
        };
        
        // Orchestration state
        this.orchestrationState = {
            mode: 'distributed',
            synchronization: true,
            messageQueue: [],
            eventStream: [],
            decisions: []
        };
        
        // Intelligence layers
        this.intelligenceLayers = {
            perception: { agents: [], confidence: 0.0 },
            reasoning: { agents: [], confidence: 0.0 },
            decision: { agents: [], confidence: 0.0 },
            action: { agents: [], confidence: 0.0 },
            learning: { agents: [], confidence: 0.0 }
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('⚡ Initializing Unified Swarm Orchestrator...');
        
        // Create swarm clouds
        this.createSwarmClouds();
        
        // Initialize grouping agents
        this.initializeGroupingAgents();
        
        // Initialize reasoning agents
        this.initializeReasoningAgents();
        
        // Connect all systems
        await this.connectAllSystems();
        
        // Start orchestration
        this.startOrchestration();
        
        console.log('🌩️ Swarm Orchestrator ready - All layers connected');
    }
    
    createSwarmClouds() {
        // Create multiple swarm clouds at different altitudes
        const cloudLevels = [
            { name: 'strategic', altitude: 1000, particleCount: 500 },
            { name: 'tactical', altitude: 500, particleCount: 1000 },
            { name: 'operational', altitude: 200, particleCount: 2000 }
        ];
        
        cloudLevels.forEach(level => {
            const swarm = {
                name: level.name,
                altitude: level.altitude,
                particles: [],
                connections: new Map(),
                laserTargets: new Set(),
                lightningActive: false
            };
            
            // Create particles for this swarm
            for (let i = 0; i < level.particleCount; i++) {
                swarm.particles.push({
                    id: `${level.name}-${i}`,
                    position: {
                        x: (Math.random() - 0.5) * 200,
                        y: level.altitude + (Math.random() - 0.5) * 50,
                        z: (Math.random() - 0.5) * 200
                    },
                    velocity: {
                        x: (Math.random() - 0.5) * 2,
                        y: 0,
                        z: (Math.random() - 0.5) * 2
                    },
                    charge: Math.random(),
                    connections: [],
                    role: this.assignParticleRole()
                });
            }
            
            this.swarms.set(level.name, swarm);
        });
    }
    
    assignParticleRole() {
        const roles = ['sensor', 'processor', 'communicator', 'actuator', 'coordinator'];
        return roles[Math.floor(Math.random() * roles.length)];
    }
    
    initializeGroupingAgents() {
        // Create grouping agents for pattern recognition
        const groupingTypes = [
            { type: 'spatial', algorithm: 'kmeans' },
            { type: 'temporal', algorithm: 'sliding-window' },
            { type: 'semantic', algorithm: 'embedding-cluster' },
            { type: 'behavioral', algorithm: 'markov-chain' },
            { type: 'hierarchical', algorithm: 'tree-based' }
        ];
        
        groupingTypes.forEach(config => {
            const agent = new GroupingAgent(config);
            this.groupingAgents.push(agent);
            
            // Assign to intelligence layer
            this.intelligenceLayers.perception.agents.push(agent);
        });
    }
    
    initializeReasoningAgents() {
        // Create reasoning agents for decision making
        const reasoningTypes = [
            { type: 'deductive', method: 'logical-inference' },
            { type: 'inductive', method: 'pattern-learning' },
            { type: 'abductive', method: 'hypothesis-generation' },
            { type: 'analogical', method: 'similarity-mapping' },
            { type: 'causal', method: 'cause-effect-chain' }
        ];
        
        reasoningTypes.forEach(config => {
            const agent = new ReasoningAgent(config);
            this.reasoningAgents.push(agent);
            
            // Assign to intelligence layer
            this.intelligenceLayers.reasoning.agents.push(agent);
        });
    }
    
    async connectAllSystems() {
        console.log('🔗 Connecting all systems...');
        
        // Connect to existing systems if available
        if (typeof window !== 'undefined') {
            // Browser environment
            this.systems.storybook = window.storybook || null;
            this.systems.aiWorld = window.gameWorld || null;
            this.systems.calMapper = window.calMapper || null;
            this.systems.character = window.character || null;
        }
        
        // Create bidirectional connections
        this.createSystemConnections();
        
        // Establish communication protocols
        this.establishProtocols();
    }
    
    createSystemConnections() {
        // Create mesh network between all systems
        const systemNames = Object.keys(this.systems);
        
        for (let i = 0; i < systemNames.length; i++) {
            for (let j = i + 1; j < systemNames.length; j++) {
                const connection = {
                    from: systemNames[i],
                    to: systemNames[j],
                    protocol: 'bidirectional',
                    latency: Math.random() * 10,
                    bandwidth: 1000,
                    messages: []
                };
                
                const key = `${systemNames[i]}-${systemNames[j]}`;
                this.connections.set(key, connection);
            }
        }
    }
    
    establishProtocols() {
        // Define communication protocols
        this.protocols = {
            'visual-data': {
                format: 'binary',
                compression: true,
                priority: 'high'
            },
            'reasoning-chain': {
                format: 'json',
                validation: true,
                priority: 'medium'
            },
            'swarm-command': {
                format: 'compact',
                broadcast: true,
                priority: 'critical'
            },
            'learning-update': {
                format: 'jsonl',
                batched: true,
                priority: 'low'
            }
        };
    }
    
    startOrchestration() {
        // Main orchestration loop
        this.orchestrationInterval = setInterval(() => {
            this.orchestrationCycle();
        }, 16); // 60 FPS
        
        // Swarm update loop
        this.swarmInterval = setInterval(() => {
            this.updateSwarms();
        }, 50); // 20 FPS for swarm calculations
        
        // Decision making loop
        this.decisionInterval = setInterval(() => {
            this.makeDecisions();
        }, 100); // 10 decisions per second
    }
    
    orchestrationCycle() {
        // Collect data from all systems
        const systemData = this.collectSystemData();
        
        // Process through grouping agents
        const groups = this.processGroups(systemData);
        
        // Run reasoning agents
        const reasoning = this.runReasoning(groups);
        
        // Generate decisions
        const decisions = this.generateDecisions(reasoning);
        
        // Execute actions
        this.executeActions(decisions);
        
        // Update visualization
        this.updateVisualization();
    }
    
    collectSystemData() {
        const data = {
            timestamp: Date.now(),
            systems: {}
        };
        
        // Collect from each connected system
        Object.entries(this.systems).forEach(([name, system]) => {
            if (system) {
                data.systems[name] = this.extractSystemState(name, system);
            }
        });
        
        return data;
    }
    
    extractSystemState(name, system) {
        // Extract relevant state based on system type
        switch (name) {
            case 'storybook':
                return {
                    currentPage: system.currentPage || 0,
                    voxelData: system.voxelSystem || {},
                    laserActive: system.laserMode || false
                };
                
            case 'aiWorld':
                return {
                    aiPlayers: system.aiPlayers?.length || 0,
                    gameSession: system.gameSession || null,
                    isPaused: system.isPaused || false
                };
                
            case 'character':
                return {
                    position: system.character?.position || { x: 0, y: 0, z: 0 },
                    animation: system.currentAnimation || 'idle',
                    movement: system.movement || {}
                };
                
            default:
                return { connected: true };
        }
    }
    
    processGroups(systemData) {
        const groups = [];
        
        // Run each grouping agent
        this.groupingAgents.forEach(agent => {
            const result = agent.process(systemData);
            if (result.groups.length > 0) {
                groups.push({
                    type: agent.config.type,
                    groups: result.groups,
                    confidence: result.confidence
                });
            }
        });
        
        return groups;
    }
    
    runReasoning(groups) {
        const reasoningResults = [];
        
        // Run each reasoning agent
        this.reasoningAgents.forEach(agent => {
            const result = agent.reason(groups);
            if (result.conclusions.length > 0) {
                reasoningResults.push({
                    type: agent.config.type,
                    conclusions: result.conclusions,
                    confidence: result.confidence,
                    evidence: result.evidence
                });
            }
        });
        
        return reasoningResults;
    }
    
    generateDecisions(reasoning) {
        const decisions = [];
        
        // Synthesize reasoning into actionable decisions
        reasoning.forEach(result => {
            result.conclusions.forEach(conclusion => {
                if (conclusion.confidence > 0.7) {
                    decisions.push({
                        action: conclusion.action,
                        target: conclusion.target,
                        parameters: conclusion.parameters,
                        priority: conclusion.priority || 'medium',
                        source: result.type
                    });
                }
            });
        });
        
        // Sort by priority
        decisions.sort((a, b) => {
            const priorities = { critical: 3, high: 2, medium: 1, low: 0 };
            return priorities[b.priority] - priorities[a.priority];
        });
        
        return decisions;
    }
    
    executeActions(decisions) {
        decisions.forEach(decision => {
            switch (decision.action) {
                case 'fire-laser':
                    this.fireLaser(decision.target, decision.parameters);
                    break;
                    
                case 'create-lightning':
                    this.createLightning(decision.target, decision.parameters);
                    break;
                    
                case 'move-swarm':
                    this.moveSwarm(decision.target, decision.parameters);
                    break;
                    
                case 'sync-systems':
                    this.synchronizeSystems(decision.parameters);
                    break;
                    
                case 'update-reasoning':
                    this.updateReasoningModel(decision.parameters);
                    break;
                    
                default:
                    this.orchestrationState.eventStream.push({
                        type: 'unknown-action',
                        decision: decision,
                        timestamp: Date.now()
                    });
            }
        });
    }
    
    updateSwarms() {
        this.swarms.forEach((swarm, name) => {
            // Update particle positions
            swarm.particles.forEach(particle => {
                // Flocking behavior
                const flockForce = this.calculateFlockingForce(particle, swarm.particles);
                
                // Apply forces
                particle.velocity.x += flockForce.x * 0.1;
                particle.velocity.y += flockForce.y * 0.1;
                particle.velocity.z += flockForce.z * 0.1;
                
                // Limit velocity
                const speed = Math.sqrt(
                    particle.velocity.x ** 2 + 
                    particle.velocity.y ** 2 + 
                    particle.velocity.z ** 2
                );
                
                if (speed > 5) {
                    particle.velocity.x = (particle.velocity.x / speed) * 5;
                    particle.velocity.y = (particle.velocity.y / speed) * 5;
                    particle.velocity.z = (particle.velocity.z / speed) * 5;
                }
                
                // Update position
                particle.position.x += particle.velocity.x;
                particle.position.y += particle.velocity.y;
                particle.position.z += particle.velocity.z;
                
                // Keep within bounds
                particle.position.x = Math.max(-200, Math.min(200, particle.position.x));
                particle.position.z = Math.max(-200, Math.min(200, particle.position.z));
                
                // Maintain altitude
                const targetAltitude = swarm.altitude;
                particle.velocity.y += (targetAltitude - particle.position.y) * 0.01;
            });
            
            // Update connections between particles
            this.updateParticleConnections(swarm);
        });
    }
    
    calculateFlockingForce(particle, neighbors) {
        const force = { x: 0, y: 0, z: 0 };
        let neighborCount = 0;
        
        // Separation, alignment, and cohesion
        const separationRadius = 20;
        const alignmentRadius = 50;
        const cohesionRadius = 100;
        
        neighbors.forEach(neighbor => {
            if (neighbor.id === particle.id) return;
            
            const dx = neighbor.position.x - particle.position.x;
            const dy = neighbor.position.y - particle.position.y;
            const dz = neighbor.position.z - particle.position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance < separationRadius) {
                // Separation
                force.x -= dx / distance;
                force.y -= dy / distance;
                force.z -= dz / distance;
            }
            
            if (distance < alignmentRadius) {
                // Alignment
                force.x += neighbor.velocity.x * 0.1;
                force.y += neighbor.velocity.y * 0.1;
                force.z += neighbor.velocity.z * 0.1;
                neighborCount++;
            }
            
            if (distance < cohesionRadius) {
                // Cohesion
                force.x += dx * 0.01;
                force.y += dy * 0.01;
                force.z += dz * 0.01;
            }
        });
        
        return force;
    }
    
    updateParticleConnections(swarm) {
        // Clear old connections
        swarm.particles.forEach(p => p.connections = []);
        
        // Create new connections based on proximity and role
        for (let i = 0; i < swarm.particles.length; i++) {
            const p1 = swarm.particles[i];
            
            for (let j = i + 1; j < swarm.particles.length; j++) {
                const p2 = swarm.particles[j];
                
                const distance = Math.sqrt(
                    (p1.position.x - p2.position.x) ** 2 +
                    (p1.position.y - p2.position.y) ** 2 +
                    (p1.position.z - p2.position.z) ** 2
                );
                
                // Connect if close enough and compatible roles
                if (distance < 30 && this.areRolesCompatible(p1.role, p2.role)) {
                    p1.connections.push(p2.id);
                    p2.connections.push(p1.id);
                }
            }
        }
    }
    
    areRolesCompatible(role1, role2) {
        const compatibility = {
            'sensor': ['processor', 'communicator'],
            'processor': ['sensor', 'actuator', 'coordinator'],
            'communicator': ['sensor', 'coordinator'],
            'actuator': ['processor', 'coordinator'],
            'coordinator': ['processor', 'communicator', 'actuator']
        };
        
        return compatibility[role1]?.includes(role2) || false;
    }
    
    fireLaser(target, parameters) {
        const { fromSwarm, intensity, duration, color } = parameters;
        const swarm = this.swarms.get(fromSwarm || 'tactical');
        
        if (!swarm) return;
        
        // Select emitter particles
        const emitters = swarm.particles
            .filter(p => p.role === 'actuator' && p.charge > 0.5)
            .slice(0, 10);
        
        emitters.forEach(emitter => {
            this.swarmCloud.lasers.push({
                from: { ...emitter.position },
                to: target,
                intensity: intensity || 1.0,
                color: color || 0x00ffff,
                lifetime: duration || 1000,
                created: Date.now()
            });
            
            // Drain charge
            emitter.charge *= 0.5;
        });
        
        console.log(`🔫 Fired ${emitters.length} lasers at target`);
    }
    
    createLightning(target, parameters) {
        const { fromSwarm, branches, intensity } = parameters;
        const swarm = this.swarms.get(fromSwarm || 'strategic');
        
        if (!swarm) return;
        
        // Find highest charged particle
        const source = swarm.particles.reduce((highest, p) => 
            p.charge > highest.charge ? p : highest
        );
        
        // Create lightning bolt
        const lightning = {
            path: this.generateLightningPath(source.position, target, branches || 5),
            intensity: intensity || 1.0,
            lifetime: 500,
            created: Date.now()
        };
        
        this.swarmCloud.lightning.push(lightning);
        
        // Discharge particles along path
        swarm.particles.forEach(p => {
            const minDist = lightning.path.reduce((min, point) => {
                const dist = Math.sqrt(
                    (p.position.x - point.x) ** 2 +
                    (p.position.y - point.y) ** 2 +
                    (p.position.z - point.z) ** 2
                );
                return Math.min(min, dist);
            }, Infinity);
            
            if (minDist < 50) {
                p.charge *= 0.7;
            }
        });
        
        console.log('⚡ Lightning strike created');
    }
    
    generateLightningPath(from, to, branches) {
        const path = [{ ...from }];
        const steps = 20;
        
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const point = {
                x: from.x + (to.x - from.x) * t + (Math.random() - 0.5) * 20,
                y: from.y + (to.y - from.y) * t + (Math.random() - 0.5) * 10,
                z: from.z + (to.z - from.z) * t + (Math.random() - 0.5) * 20
            };
            
            path.push(point);
            
            // Add branches
            if (Math.random() < branches / steps) {
                const branchEnd = {
                    x: point.x + (Math.random() - 0.5) * 50,
                    y: point.y - Math.random() * 30,
                    z: point.z + (Math.random() - 0.5) * 50
                };
                
                path.push(point, branchEnd, point); // Branch and back
            }
        }
        
        return path;
    }
    
    moveSwarm(swarmName, parameters) {
        const swarm = this.swarms.get(swarmName);
        if (!swarm) return;
        
        const { target, formation, speed } = parameters;
        
        // Apply movement force to all particles
        swarm.particles.forEach((particle, index) => {
            let targetPos = { ...target };
            
            // Apply formation offset
            if (formation === 'sphere') {
                const angle = (index / swarm.particles.length) * Math.PI * 2;
                const radius = 50;
                targetPos.x += Math.cos(angle) * radius;
                targetPos.z += Math.sin(angle) * radius;
            } else if (formation === 'line') {
                targetPos.x += (index - swarm.particles.length / 2) * 5;
            }
            
            // Move towards target
            const dx = targetPos.x - particle.position.x;
            const dy = targetPos.y - particle.position.y;
            const dz = targetPos.z - particle.position.z;
            
            particle.velocity.x += dx * (speed || 0.01);
            particle.velocity.y += dy * (speed || 0.01);
            particle.velocity.z += dz * (speed || 0.01);
        });
    }
    
    synchronizeSystems(parameters) {
        const { systems, data } = parameters;
        
        systems.forEach(systemName => {
            const system = this.systems[systemName];
            if (!system) return;
            
            // Send synchronization data
            if (system.receiveOrchestrationData) {
                system.receiveOrchestrationData(data);
            }
        });
        
        console.log('🔄 Systems synchronized:', systems.join(', '));
    }
    
    updateReasoningModel(parameters) {
        const { layer, updates } = parameters;
        
        if (this.intelligenceLayers[layer]) {
            // Update confidence
            this.intelligenceLayers[layer].confidence = updates.confidence || 
                this.intelligenceLayers[layer].confidence;
            
            // Update agents
            if (updates.agentUpdates) {
                updates.agentUpdates.forEach(update => {
                    const agent = this.intelligenceLayers[layer].agents
                        .find(a => a.id === update.agentId);
                    
                    if (agent && agent.updateModel) {
                        agent.updateModel(update.modelData);
                    }
                });
            }
        }
    }
    
    makeDecisions() {
        // Clear old decisions
        this.orchestrationState.decisions = [];
        
        // Analyze current state
        const analysis = this.analyzeGlobalState();
        
        // Generate high-level decisions
        if (analysis.threat > 0.7) {
            this.orchestrationState.decisions.push({
                action: 'create-lightning',
                target: analysis.threatLocation,
                parameters: {
                    fromSwarm: 'strategic',
                    branches: 10,
                    intensity: 1.5
                },
                priority: 'critical'
            });
        }
        
        if (analysis.dataFlow < 0.3) {
            this.orchestrationState.decisions.push({
                action: 'sync-systems',
                target: 'all',
                parameters: {
                    systems: Object.keys(this.systems),
                    data: { timestamp: Date.now(), state: 'resync' }
                },
                priority: 'high'
            });
        }
        
        if (analysis.swarmDispersion > 0.8) {
            this.orchestrationState.decisions.push({
                action: 'move-swarm',
                target: 'tactical',
                parameters: {
                    target: this.swarmCloud.centerPoint,
                    formation: 'sphere',
                    speed: 0.02
                },
                priority: 'medium'
            });
        }
    }
    
    analyzeGlobalState() {
        // Calculate various metrics
        let totalParticles = 0;
        let totalCharge = 0;
        let maxDispersion = 0;
        
        this.swarms.forEach(swarm => {
            totalParticles += swarm.particles.length;
            totalCharge += swarm.particles.reduce((sum, p) => sum + p.charge, 0);
            
            // Calculate dispersion
            const center = swarm.particles.reduce((acc, p) => ({
                x: acc.x + p.position.x / swarm.particles.length,
                y: acc.y + p.position.y / swarm.particles.length,
                z: acc.z + p.position.z / swarm.particles.length
            }), { x: 0, y: 0, z: 0 });
            
            const dispersion = swarm.particles.reduce((max, p) => {
                const dist = Math.sqrt(
                    (p.position.x - center.x) ** 2 +
                    (p.position.y - center.y) ** 2 +
                    (p.position.z - center.z) ** 2
                );
                return Math.max(max, dist);
            }, 0) / 100;
            
            maxDispersion = Math.max(maxDispersion, dispersion);
        });
        
        // Calculate data flow
        const activeConnections = Array.from(this.connections.values())
            .filter(c => c.messages.length > 0).length;
        const dataFlow = activeConnections / this.connections.size;
        
        // Simulated threat detection
        const threat = Math.random() < 0.1 ? Math.random() : 0;
        const threatLocation = threat > 0.7 ? {
            x: (Math.random() - 0.5) * 200,
            y: 0,
            z: (Math.random() - 0.5) * 200
        } : null;
        
        return {
            totalParticles,
            averageCharge: totalCharge / totalParticles,
            swarmDispersion: maxDispersion,
            dataFlow,
            threat,
            threatLocation
        };
    }
    
    updateVisualization() {
        // Update any connected visualization systems
        if (this.visualizationCallback) {
            const vizData = {
                swarms: Array.from(this.swarms.entries()).map(([name, swarm]) => ({
                    name,
                    particles: swarm.particles.map(p => ({
                        position: p.position,
                        charge: p.charge,
                        role: p.role,
                        connections: p.connections.length
                    }))
                })),
                lasers: this.swarmCloud.lasers.filter(l => 
                    Date.now() - l.created < l.lifetime
                ),
                lightning: this.swarmCloud.lightning.filter(l => 
                    Date.now() - l.created < l.lifetime
                ),
                intelligence: Object.entries(this.intelligenceLayers).map(([name, layer]) => ({
                    name,
                    confidence: layer.confidence,
                    agentCount: layer.agents.length
                }))
            };
            
            this.visualizationCallback(vizData);
        }
    }
    
    // Public API
    setVisualizationCallback(callback) {
        this.visualizationCallback = callback;
    }
    
    sendCommand(command) {
        this.orchestrationState.messageQueue.push({
            command,
            timestamp: Date.now(),
            processed: false
        });
    }
    
    getState() {
        return {
            swarms: this.swarms.size,
            connections: this.connections.size,
            groupingAgents: this.groupingAgents.length,
            reasoningAgents: this.reasoningAgents.length,
            mode: this.orchestrationState.mode,
            synchronized: this.orchestrationState.synchronization
        };
    }
    
    shutdown() {
        clearInterval(this.orchestrationInterval);
        clearInterval(this.swarmInterval);
        clearInterval(this.decisionInterval);
        
        console.log('🛑 Swarm Orchestrator shutdown');
    }
}

// Grouping Agent implementation
class GroupingAgent {
    constructor(config) {
        this.config = config;
        this.id = `group-${config.type}-${Date.now()}`;
        this.memory = [];
        this.patterns = new Map();
    }
    
    process(data) {
        const groups = [];
        let confidence = 0;
        
        switch (this.config.algorithm) {
            case 'kmeans':
                groups.push(...this.kmeansGrouping(data));
                confidence = 0.8;
                break;
                
            case 'sliding-window':
                groups.push(...this.temporalGrouping(data));
                confidence = 0.7;
                break;
                
            case 'embedding-cluster':
                groups.push(...this.semanticGrouping(data));
                confidence = 0.75;
                break;
                
            default:
                groups.push({ type: 'default', members: [data] });
                confidence = 0.5;
        }
        
        // Store in memory
        this.memory.push({ timestamp: Date.now(), groups });
        if (this.memory.length > 100) {
            this.memory.shift();
        }
        
        return { groups, confidence };
    }
    
    kmeansGrouping(data) {
        // Simplified k-means implementation
        const k = 3;
        const points = this.extractPoints(data);
        const centroids = this.initializeCentroids(points, k);
        const clusters = Array(k).fill(null).map(() => []);
        
        // Assign points to clusters
        points.forEach(point => {
            let minDist = Infinity;
            let closestCluster = 0;
            
            centroids.forEach((centroid, i) => {
                const dist = this.euclideanDistance(point, centroid);
                if (dist < minDist) {
                    minDist = dist;
                    closestCluster = i;
                }
            });
            
            clusters[closestCluster].push(point);
        });
        
        return clusters.map((cluster, i) => ({
            type: 'spatial-cluster',
            id: `cluster-${i}`,
            members: cluster,
            centroid: centroids[i]
        }));
    }
    
    temporalGrouping(data) {
        // Group by time windows
        const windowSize = 1000; // 1 second
        const groups = [];
        
        if (data.timestamp) {
            const windowId = Math.floor(data.timestamp / windowSize);
            groups.push({
                type: 'temporal-window',
                id: `window-${windowId}`,
                members: [data],
                timeRange: {
                    start: windowId * windowSize,
                    end: (windowId + 1) * windowSize
                }
            });
        }
        
        return groups;
    }
    
    semanticGrouping(data) {
        // Group by semantic similarity
        const groups = [];
        
        Object.entries(data.systems || {}).forEach(([name, system]) => {
            const semanticType = this.getSemanticType(name, system);
            groups.push({
                type: 'semantic-group',
                id: `semantic-${semanticType}`,
                members: [{ name, ...system }],
                semanticType
            });
        });
        
        return groups;
    }
    
    extractPoints(data) {
        const points = [];
        
        // Extract spatial points from data
        Object.values(data.systems || {}).forEach(system => {
            if (system.position) {
                points.push({
                    x: system.position.x || 0,
                    y: system.position.y || 0,
                    z: system.position.z || 0,
                    data: system
                });
            }
        });
        
        return points;
    }
    
    initializeCentroids(points, k) {
        // Random initialization
        const centroids = [];
        const used = new Set();
        
        while (centroids.length < k && centroids.length < points.length) {
            const idx = Math.floor(Math.random() * points.length);
            if (!used.has(idx)) {
                used.add(idx);
                centroids.push({ ...points[idx] });
            }
        }
        
        return centroids;
    }
    
    euclideanDistance(a, b) {
        return Math.sqrt(
            Math.pow(a.x - b.x, 2) +
            Math.pow(a.y - b.y, 2) +
            Math.pow(a.z - b.z, 2)
        );
    }
    
    getSemanticType(name, system) {
        if (name.includes('ai') || system.aiPlayers) return 'ai-system';
        if (name.includes('story') || system.currentPage !== undefined) return 'narrative';
        if (name.includes('character') || system.animation) return 'entity';
        if (name.includes('cal') || name.includes('mapper')) return 'orchestration';
        return 'unknown';
    }
    
    updateModel(modelData) {
        // Update agent's internal model
        if (modelData.patterns) {
            modelData.patterns.forEach(pattern => {
                this.patterns.set(pattern.id, pattern);
            });
        }
    }
}

// Reasoning Agent implementation
class ReasoningAgent {
    constructor(config) {
        this.config = config;
        this.id = `reason-${config.type}-${Date.now()}`;
        this.knowledgeBase = new Map();
        this.rules = [];
    }
    
    reason(groups) {
        const conclusions = [];
        const evidence = [];
        let confidence = 0;
        
        switch (this.config.method) {
            case 'logical-inference':
                const deductive = this.deductiveReasoning(groups);
                conclusions.push(...deductive.conclusions);
                evidence.push(...deductive.evidence);
                confidence = deductive.confidence;
                break;
                
            case 'pattern-learning':
                const inductive = this.inductiveReasoning(groups);
                conclusions.push(...inductive.conclusions);
                evidence.push(...inductive.evidence);
                confidence = inductive.confidence;
                break;
                
            case 'hypothesis-generation':
                const abductive = this.abductiveReasoning(groups);
                conclusions.push(...abductive.conclusions);
                evidence.push(...abductive.evidence);
                confidence = abductive.confidence;
                break;
                
            default:
                confidence = 0.3;
        }
        
        return { conclusions, evidence, confidence };
    }
    
    deductiveReasoning(groups) {
        const conclusions = [];
        const evidence = [];
        
        // Apply logical rules
        groups.forEach(groupSet => {
            groupSet.groups.forEach(group => {
                // Rule: If spatial clusters are too dispersed, suggest regrouping
                if (group.type === 'spatial-cluster' && group.members.length < 3) {
                    conclusions.push({
                        action: 'move-swarm',
                        target: group.id,
                        parameters: {
                            formation: 'compact',
                            speed: 0.05
                        },
                        confidence: 0.8,
                        reasoning: 'Sparse cluster detected'
                    });
                    
                    evidence.push({
                        type: 'observation',
                        data: group,
                        rule: 'sparse-cluster-consolidation'
                    });
                }
                
                // Rule: If temporal patterns show high activity, increase monitoring
                if (group.type === 'temporal-window' && group.members.length > 10) {
                    conclusions.push({
                        action: 'fire-laser',
                        target: { x: 0, y: 0, z: 0 },
                        parameters: {
                            intensity: 0.5,
                            duration: 500
                        },
                        confidence: 0.7,
                        reasoning: 'High temporal activity'
                    });
                    
                    evidence.push({
                        type: 'temporal-pattern',
                        data: group,
                        rule: 'activity-threshold'
                    });
                }
            });
        });
        
        return {
            conclusions,
            evidence,
            confidence: conclusions.length > 0 ? 0.8 : 0.3
        };
    }
    
    inductiveReasoning(groups) {
        const conclusions = [];
        const evidence = [];
        
        // Learn patterns from observations
        const patterns = this.extractPatterns(groups);
        
        patterns.forEach(pattern => {
            if (pattern.frequency > 0.7) {
                conclusions.push({
                    action: 'update-reasoning',
                    target: 'pattern-recognition',
                    parameters: {
                        layer: 'learning',
                        updates: {
                            confidence: pattern.frequency,
                            agentUpdates: [{
                                agentId: this.id,
                                modelData: { patterns: [pattern] }
                            }]
                        }
                    },
                    confidence: pattern.frequency,
                    reasoning: `Pattern detected: ${pattern.type}`
                });
                
                evidence.push({
                    type: 'pattern',
                    data: pattern,
                    method: 'induction'
                });
            }
        });
        
        return {
            conclusions,
            evidence,
            confidence: patterns.length > 0 ? 0.75 : 0.4
        };
    }
    
    abductiveReasoning(groups) {
        const conclusions = [];
        const evidence = [];
        
        // Generate hypotheses to explain observations
        groups.forEach(groupSet => {
            const hypothesis = this.generateHypothesis(groupSet);
            
            if (hypothesis.plausibility > 0.6) {
                conclusions.push({
                    action: hypothesis.suggestedAction,
                    target: hypothesis.target,
                    parameters: hypothesis.parameters,
                    confidence: hypothesis.plausibility,
                    reasoning: hypothesis.explanation
                });
                
                evidence.push({
                    type: 'hypothesis',
                    data: hypothesis,
                    method: 'abduction'
                });
            }
        });
        
        return {
            conclusions,
            evidence,
            confidence: conclusions.length > 0 ? 0.7 : 0.35
        };
    }
    
    extractPatterns(groups) {
        const patterns = [];
        
        // Analyze group structures for patterns
        const typeCount = new Map();
        
        groups.forEach(groupSet => {
            groupSet.groups.forEach(group => {
                const count = typeCount.get(group.type) || 0;
                typeCount.set(group.type, count + 1);
            });
        });
        
        typeCount.forEach((count, type) => {
            patterns.push({
                id: `pattern-${type}-${Date.now()}`,
                type: type,
                frequency: count / groups.length,
                timestamp: Date.now()
            });
        });
        
        return patterns;
    }
    
    generateHypothesis(groupSet) {
        // Simple hypothesis generation
        const groupTypes = groupSet.groups.map(g => g.type);
        
        if (groupTypes.includes('semantic-group') && groupTypes.includes('temporal-window')) {
            return {
                explanation: 'Correlated semantic and temporal activity suggests coordinated behavior',
                suggestedAction: 'sync-systems',
                target: 'all',
                parameters: {
                    systems: ['aiWorld', 'storybook'],
                    data: { correlationDetected: true }
                },
                plausibility: 0.75
            };
        }
        
        return {
            explanation: 'No significant patterns detected',
            suggestedAction: 'monitor',
            target: null,
            parameters: {},
            plausibility: 0.3
        };
    }
    
    updateModel(modelData) {
        // Update knowledge base
        if (modelData.facts) {
            modelData.facts.forEach(fact => {
                this.knowledgeBase.set(fact.id, fact);
            });
        }
        
        if (modelData.rules) {
            this.rules.push(...modelData.rules);
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedSwarmOrchestrator;
} else if (typeof window !== 'undefined') {
    window.UnifiedSwarmOrchestrator = UnifiedSwarmOrchestrator;
}

console.log('⚡ Unified Swarm Orchestrator loaded');
console.log('🌩️ Swarm clouds ready to coordinate all systems');
console.log('🔗 Grouping and reasoning agents initialized');