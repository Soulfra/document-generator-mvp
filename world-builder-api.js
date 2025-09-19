#!/usr/bin/env node

/**
 * 🏗️ WORLD BUILDER API
 * LLMs can call this to actually modify the game world
 * This is the "deep tier" that makes decisions and changes reality
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

class WorldBuilderAPI {
    constructor() {
        this.app = express();
        this.port = 7777;
        this.worldState = new Map();
        this.buildQueue = [];
        this.llmDecisions = new Map();
        
        // Track what each LLM has built
        this.builderHistory = new Map();
        
        // Available building blocks
        this.buildingBlocks = {
            structures: ['tower', 'bridge', 'portal', 'fountain', 'temple', 'maze'],
            entities: ['npc', 'creature', 'plant', 'crystal', 'orb', 'guardian'],
            terrain: ['mountain', 'valley', 'river', 'forest', 'desert', 'void'],
            effects: ['particles', 'light', 'fog', 'rain', 'lightning', 'aurora']
        };
        
        this.init();
    }
    
    init() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // LLM can request to build something
        this.app.post('/api/build', async (req, res) => {
            const { llmId, action, parameters } = req.body;
            
            console.log(`🏗️ LLM ${llmId} wants to ${action}:`, parameters);
            
            // Process the build request
            const result = await this.processBuildRequest(llmId, action, parameters);
            
            res.json(result);
        });
        
        // LLM can query the world state
        this.app.get('/api/world/query', (req, res) => {
            const { x, y, z, radius } = req.query;
            const nearbyObjects = this.queryWorldArea(x, y, z, radius);
            res.json({ objects: nearbyObjects });
        });
        
        // LLM can make decisions about player requests
        this.app.post('/api/decide', async (req, res) => {
            const { llmId, playerRequest, context } = req.body;
            
            // LLM decides what to do with player's request
            const decision = await this.makeDecision(llmId, playerRequest, context);
            
            res.json(decision);
        });
        
        // Get building capabilities
        this.app.get('/api/capabilities', (req, res) => {
            res.json({
                blocks: this.buildingBlocks,
                actions: ['create', 'modify', 'destroy', 'animate', 'combine'],
                permissions: ['build', 'terraform', 'spawn', 'enchant']
            });
        });
        
        // WebSocket for real-time world updates
        const server = this.app.listen(this.port, () => {
            console.log(`🏗️ World Builder API running on port ${this.port}`);
        });
        
        this.wss = new WebSocket.Server({ server });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 Game client connected to World Builder');
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                if (data.type === 'subscribe') {
                    ws.clientId = data.clientId;
                }
            });
        });
        
        // Process build queue
        setInterval(() => {
            this.processBuildQueue();
        }, 100);
    }
    
    async processBuildRequest(llmId, action, parameters) {
        // Validate the request
        if (!this.validateBuildRequest(action, parameters)) {
            return { 
                success: false, 
                error: 'Invalid build request',
                suggestion: 'Try: create tower at 10,0,10 with height 20'
            };
        }
        
        // Add to build queue
        const buildId = Date.now();
        const buildRequest = {
            id: buildId,
            llmId,
            action,
            parameters,
            timestamp: new Date(),
            status: 'queued'
        };
        
        this.buildQueue.push(buildRequest);
        
        // Track what this LLM has built
        if (!this.builderHistory.has(llmId)) {
            this.builderHistory.set(llmId, []);
        }
        this.builderHistory.get(llmId).push(buildRequest);
        
        return {
            success: true,
            buildId,
            message: `Build request queued. ${action} will be executed shortly.`,
            estimatedTime: this.buildQueue.length * 0.1 + 's'
        };
    }
    
    validateBuildRequest(action, parameters) {
        // Basic validation
        switch (action) {
            case 'create':
                return parameters.type && parameters.position;
            case 'modify':
                return parameters.targetId && parameters.changes;
            case 'destroy':
                return parameters.targetId;
            case 'terraform':
                return parameters.area && parameters.terrainType;
            default:
                return false;
        }
    }
    
    processBuildQueue() {
        if (this.buildQueue.length === 0) return;
        
        const request = this.buildQueue.shift();
        
        try {
            // Execute the build
            const result = this.executeBuild(request);
            
            // Broadcast to all connected clients
            this.broadcast({
                type: 'world-update',
                action: request.action,
                result: result,
                builder: request.llmId,
                timestamp: Date.now()
            });
            
            console.log(`✅ Executed build: ${request.action} by ${request.llmId}`);
            
        } catch (error) {
            console.error(`❌ Build failed:`, error);
        }
    }
    
    executeBuild(request) {
        const { action, parameters } = request;
        
        switch (action) {
            case 'create':
                return this.createObject(parameters);
            case 'modify':
                return this.modifyObject(parameters);
            case 'destroy':
                return this.destroyObject(parameters);
            case 'terraform':
                return this.terraformArea(parameters);
            case 'spawn':
                return this.spawnEntity(parameters);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    
    createObject(params) {
        const objectId = `obj_${Date.now()}`;
        const object = {
            id: objectId,
            type: params.type,
            position: params.position,
            rotation: params.rotation || { x: 0, y: 0, z: 0 },
            scale: params.scale || { x: 1, y: 1, z: 1 },
            properties: params.properties || {},
            created: new Date(),
            creator: params.llmId
        };
        
        this.worldState.set(objectId, object);
        
        return {
            objectId,
            object,
            action: 'created'
        };
    }
    
    modifyObject(params) {
        const object = this.worldState.get(params.targetId);
        if (!object) {
            throw new Error('Object not found');
        }
        
        // Apply modifications
        Object.assign(object, params.changes);
        object.modified = new Date();
        object.modifier = params.llmId;
        
        return {
            objectId: params.targetId,
            changes: params.changes,
            action: 'modified'
        };
    }
    
    destroyObject(params) {
        const object = this.worldState.get(params.targetId);
        if (!object) {
            throw new Error('Object not found');
        }
        
        this.worldState.delete(params.targetId);
        
        return {
            objectId: params.targetId,
            action: 'destroyed',
            finalState: object
        };
    }
    
    terraformArea(params) {
        const { area, terrainType } = params;
        
        // Create terrain modification
        const terrainId = `terrain_${Date.now()}`;
        const terrain = {
            id: terrainId,
            type: 'terrain',
            subtype: terrainType,
            bounds: area,
            created: new Date(),
            creator: params.llmId
        };
        
        this.worldState.set(terrainId, terrain);
        
        return {
            terrainId,
            area,
            terrainType,
            action: 'terraformed'
        };
    }
    
    spawnEntity(params) {
        const entityId = `entity_${Date.now()}`;
        const entity = {
            id: entityId,
            type: 'entity',
            subtype: params.entityType,
            position: params.position,
            ai: params.ai || 'passive',
            health: params.health || 100,
            behavior: params.behavior || {},
            created: new Date(),
            spawner: params.llmId
        };
        
        this.worldState.set(entityId, entity);
        
        return {
            entityId,
            entity,
            action: 'spawned'
        };
    }
    
    queryWorldArea(x, y, z, radius = 50) {
        const nearby = [];
        const center = { x: parseFloat(x) || 0, y: parseFloat(y) || 0, z: parseFloat(z) || 0 };
        const r = parseFloat(radius) || 50;
        
        for (const [id, object] of this.worldState) {
            if (object.position) {
                const distance = Math.sqrt(
                    Math.pow(object.position.x - center.x, 2) +
                    Math.pow(object.position.y - center.y, 2) +
                    Math.pow(object.position.z - center.z, 2)
                );
                
                if (distance <= r) {
                    nearby.push({
                        id,
                        type: object.type,
                        distance,
                        position: object.position
                    });
                }
            }
        }
        
        return nearby;
    }
    
    async makeDecision(llmId, playerRequest, context) {
        // This is where LLMs make decisions about player requests
        console.log(`🤔 LLM ${llmId} deciding on: "${playerRequest}"`);
        
        // Analyze the request
        const decision = {
            llmId,
            request: playerRequest,
            context,
            timestamp: new Date(),
            actions: []
        };
        
        // Parse player intent
        const lowerRequest = playerRequest.toLowerCase();
        
        if (lowerRequest.includes('build') || lowerRequest.includes('create')) {
            decision.actions.push({
                type: 'build',
                suggestion: 'I can build that for you!',
                parameters: this.suggestBuildParameters(playerRequest)
            });
        } else if (lowerRequest.includes('destroy') || lowerRequest.includes('remove')) {
            decision.actions.push({
                type: 'destroy',
                suggestion: 'I can remove that.',
                requiresConfirmation: true
            });
        } else if (lowerRequest.includes('change') || lowerRequest.includes('modify')) {
            decision.actions.push({
                type: 'modify',
                suggestion: 'I can modify that for you.'
            });
        }
        
        // Store decision for learning
        this.llmDecisions.set(`decision_${Date.now()}`, decision);
        
        return decision;
    }
    
    suggestBuildParameters(request) {
        // Simple parameter extraction
        const words = request.toLowerCase().split(' ');
        
        // Find building type
        let buildType = 'tower'; // default
        for (const type of this.buildingBlocks.structures) {
            if (words.includes(type)) {
                buildType = type;
                break;
            }
        }
        
        return {
            type: buildType,
            position: { 
                x: Math.random() * 100 - 50,
                y: 0,
                z: Math.random() * 100 - 50
            },
            properties: {
                material: 'stone',
                height: 10 + Math.random() * 20
            }
        };
    }
    
    broadcast(data) {
        const message = JSON.stringify(data);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}

// Start the API
if (require.main === module) {
    new WorldBuilderAPI();
}

module.exports = WorldBuilderAPI;