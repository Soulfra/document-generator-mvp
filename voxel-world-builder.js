#!/usr/bin/env node

/**
 * 🧱🏗️ VOXEL WORLD BUILDER
 * 
 * Minecraft/Roblox style voxel building system that integrates with:
 * - Polygon companion characters
 * - Lua scripting system
 * - Existing image-to-voxel character system
 * - All Obsidian plugins via HTTP bridges
 * 
 * Users can build structures that trigger companion behaviors and system integrations
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

console.log(`
🧱🏗️🧱🏗️🧱🏗️🧱🏗️🧱🏗️🧱🏗️🧱🏗️🧱🏗️🧱🏗️🧱🏗️
🏗️ VOXEL WORLD BUILDER 🏗️
🧱 Minecraft/Roblox Style Building 🧱
🏗️ Integrated with Polygon Companions 🏗️
🧱🏗️🧱🏗️🧱🏗️🧱🏗️🧱🏗️🧱🏗️🧱🏗️🧱🏗️🧱🏗️🧱🏗️
`);

class VoxelWorldBuilder {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 9997;
        
        // World data structures
        this.world = {
            size: { x: 200, y: 100, z: 200 }, // 200x100x200 voxel world
            voxels: new Map(), // Key: "x,y,z", Value: voxel data
            chunks: new Map(), // Chunked world for performance
            structures: new Map(), // Recognized structures
            players: new Map(), // Connected players
            buildHistory: [] // Track building history
        };
        
        // Voxel types and their properties
        this.voxelTypes = {
            'air': { 
                id: 0, 
                solid: false, 
                color: 0x000000, 
                transparent: true 
            },
            'stone': { 
                id: 1, 
                solid: true, 
                color: 0x888888, 
                hardness: 5,
                drops: ['stone']
            },
            'grass': { 
                id: 2, 
                solid: true, 
                color: 0x228B22, 
                hardness: 1,
                drops: ['dirt']
            },
            'dirt': { 
                id: 3, 
                solid: true, 
                color: 0x8B4513, 
                hardness: 1,
                drops: ['dirt']
            },
            'wood': { 
                id: 4, 
                solid: true, 
                color: 0x8B4513, 
                hardness: 2,
                drops: ['wood']
            },
            'water': { 
                id: 5, 
                solid: false, 
                color: 0x0077BE, 
                transparent: true,
                liquid: true
            },
            'gold': { 
                id: 6, 
                solid: true, 
                color: 0xFFD700, 
                hardness: 3,
                drops: ['gold_ore'],
                special: true
            },
            'diamond': { 
                id: 7, 
                solid: true, 
                color: 0x87CEEB, 
                hardness: 10,
                drops: ['diamond'],
                special: true
            },
            'redstone': { 
                id: 8, 
                solid: true, 
                color: 0xFF0000, 
                hardness: 2,
                drops: ['redstone'],
                conductive: true
            }
        };
        
        // Structure patterns for recognition
        this.structurePatterns = {
            'house': {
                name: 'House',
                description: 'Basic shelter structure',
                pattern: this.createHousePattern(),
                companionReaction: 'builder',
                systemBridge: 'universalCompactor'
            },
            'tower': {
                name: 'Tower',
                description: 'Tall vertical structure',
                pattern: this.createTowerPattern(),
                companionReaction: 'scout',
                systemBridge: 'documentToMVP'
            },
            'platform': {
                name: 'Platform',
                description: 'Flat building area',
                pattern: this.createPlatformPattern(),
                companionReaction: 'mirror',
                systemBridge: 'characterMirror'
            }
        };
        
        // Companion integration
        this.companionSystem = null;
        this.luaEngine = null;
        
        // Building tools
        this.buildingTools = {
            'place': { name: 'Place Block', cost: 0 },
            'remove': { name: 'Remove Block', cost: 0 },
            'fill': { name: 'Fill Area', cost: 1 },
            'copy': { name: 'Copy Structure', cost: 2 },
            'paste': { name: 'Paste Structure', cost: 2 },
            'generate': { name: 'AI Generate', cost: 5 }
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🏗️ Initializing Voxel World Builder...');
        
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.static('public'));
        
        this.setupRoutes();
        this.setupWebSocket();
        await this.generateInitialWorld();
        await this.connectToCompanionSystem();
        
        this.server.listen(this.port, () => {
            console.log(`🧱 Voxel World Builder running on http://localhost:${this.port}`);
            console.log(`🏗️ WebSocket server active for real-time building`);
        });
    }
    
    setupRoutes() {
        // Main building interface
        this.app.get('/', (req, res) => {
            res.send(this.getBuildingInterface());
        });
        
        // World management
        this.app.get('/api/world/info', (req, res) => {
            res.json({
                size: this.world.size,
                voxelCount: this.world.voxels.size,
                chunkCount: this.world.chunks.size,
                playerCount: this.world.players.size,
                structureCount: this.world.structures.size
            });
        });
        
        this.app.get('/api/world/chunk/:x/:y/:z', (req, res) => {
            const { x, y, z } = req.params;
            const chunk = this.getChunk(parseInt(x), parseInt(y), parseInt(z));
            res.json(chunk);
        });
        
        // Voxel operations
        this.app.post('/api/voxel/place', (req, res) => {
            const result = this.placeVoxel(req.body);
            res.json(result);
        });
        
        this.app.post('/api/voxel/remove', (req, res) => {
            const result = this.removeVoxel(req.body);
            res.json(result);
        });
        
        this.app.post('/api/voxel/fill', (req, res) => {
            const result = this.fillArea(req.body);
            res.json(result);
        });
        
        // Structure operations
        this.app.get('/api/structures', (req, res) => {
            res.json(Array.from(this.world.structures.values()));
        });
        
        this.app.post('/api/structure/save', (req, res) => {
            const result = this.saveStructure(req.body);
            res.json(result);
        });
        
        this.app.post('/api/structure/load', (req, res) => {
            const result = this.loadStructure(req.body);
            res.json(result);
        });
        
        // AI-powered generation
        this.app.post('/api/generate/structure', (req, res) => {
            const result = this.generateAIStructure(req.body);
            res.json(result);
        });
        
        // Integration endpoints
        this.app.post('/api/bridge/document-mvp', async (req, res) => {
            const result = await this.bridgeToDocumentMVP(req.body);
            res.json(result);
        });
        
        this.app.post('/api/bridge/character-mirror', async (req, res) => {
            const result = await this.bridgeToCharacterMirror(req.body);
            res.json(result);
        });
        
        this.app.post('/api/bridge/universal-compactor', async (req, res) => {
            const result = await this.bridgeToUniversalCompactor(req.body);
            res.json(result);
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔌 Builder connection established');
            
            const playerId = this.generatePlayerId();
            this.world.players.set(ws, {
                id: playerId,
                joinedAt: Date.now(),
                buildCount: 0,
                position: { x: 0, y: 10, z: 0 }
            });
            
            // Send initial world state
            ws.send(JSON.stringify({
                type: 'world_init',
                data: {
                    playerId,
                    worldInfo: this.getWorldInfo(),
                    voxelTypes: this.voxelTypes,
                    buildingTools: this.buildingTools
                }
            }));
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('WebSocket error:', error);
                }
            });
            
            ws.on('close', () => {
                this.world.players.delete(ws);
                console.log('🔌 Builder connection closed');
            });
        });
    }
    
    async generateInitialWorld() {
        console.log('🌍 Generating initial voxel world...');
        
        // Generate a simple terrain
        const size = this.world.size;
        const terrainHeight = 20;
        
        for (let x = -size.x/2; x < size.x/2; x += 2) {
            for (let z = -size.z/2; z < size.z/2; z += 2) {
                // Generate height using simple noise
                const height = terrainHeight + Math.sin(x * 0.1) * 3 + Math.cos(z * 0.1) * 3;
                
                for (let y = 0; y <= height; y++) {
                    let voxelType = 'stone';
                    
                    if (y === Math.floor(height)) {
                        voxelType = 'grass';
                    } else if (y > height - 3) {
                        voxelType = 'dirt';
                    }
                    
                    this.setVoxel(x, y, z, voxelType);
                }
            }
        }
        
        // Add some special blocks
        this.addSpecialBlocks();
        
        console.log(`🧱 Generated ${this.world.voxels.size} voxels`);
    }
    
    addSpecialBlocks() {
        // Add gold veins
        for (let i = 0; i < 20; i++) {
            const x = Math.floor(Math.random() * 100) - 50;
            const y = Math.floor(Math.random() * 10) + 5;
            const z = Math.floor(Math.random() * 100) - 50;
            this.setVoxel(x, y, z, 'gold');
        }
        
        // Add diamond deposits
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * 100) - 50;
            const y = Math.floor(Math.random() * 5) + 2;
            const z = Math.floor(Math.random() * 100) - 50;
            this.setVoxel(x, y, z, 'diamond');
        }
        
        // Add water lakes
        for (let i = 0; i < 10; i++) {
            const x = Math.floor(Math.random() * 100) - 50;
            const z = Math.floor(Math.random() * 100) - 50;
            
            // Create small water pools
            for (let dx = -2; dx <= 2; dx++) {
                for (let dz = -2; dz <= 2; dz++) {
                    if (dx*dx + dz*dz <= 4) {
                        this.setVoxel(x + dx, 21, z + dz, 'water');
                    }
                }
            }
        }
    }
    
    async connectToCompanionSystem() {
        console.log('🤖 Connecting to Companion System...');
        
        try {
            // Check if companion system is running
            const companionResponse = await fetch('http://localhost:9999/api/companions');
            if (companionResponse.ok) {
                this.companionSystem = 'http://localhost:9999';
                console.log('  ✅ Connected to Polygon Companion System');
            }
        } catch (error) {
            console.log('  ⚠️ Companion System not available');
        }
        
        try {
            // Check if Lua engine is running
            const luaResponse = await fetch('http://localhost:9998/api/scripts');
            if (luaResponse.ok) {
                this.luaEngine = 'http://localhost:9998';
                console.log('  ✅ Connected to Lua Engine');
            }
        } catch (error) {
            console.log('  ⚠️ Lua Engine not available');
        }
    }
    
    setVoxel(x, y, z, type) {
        const key = `${x},${y},${z}`;
        const voxelData = {
            x, y, z,
            type,
            placedAt: Date.now(),
            chunkKey: this.getChunkKey(x, y, z)
        };
        
        this.world.voxels.set(key, voxelData);
        
        // Update chunk
        this.addVoxelToChunk(voxelData);
        
        return voxelData;
    }
    
    placeVoxel(params) {
        const { x, y, z, type, playerId } = params;
        
        // Validate position
        if (!this.isValidPosition(x, y, z)) {
            return { success: false, error: 'Invalid position' };
        }
        
        // Check if position is occupied
        const existing = this.getVoxel(x, y, z);
        if (existing && existing.type !== 'air') {
            return { success: false, error: 'Position occupied' };
        }
        
        // Place the voxel
        const voxel = this.setVoxel(x, y, z, type);
        voxel.placedBy = playerId;
        
        // Add to build history
        this.world.buildHistory.push({
            type: 'place',
            voxel,
            playerId,
            timestamp: Date.now()
        });
        
        // Broadcast to all connected clients
        this.broadcast({
            type: 'voxel_placed',
            voxel
        });
        
        // Check for structure patterns
        this.checkForStructures(x, y, z);
        
        // Notify companion system
        this.notifyCompanionSystem('voxel_placed', { voxel });
        
        return { success: true, voxel };
    }
    
    removeVoxel(params) {
        const { x, y, z, playerId } = params;
        
        const voxelKey = `${x},${y},${z}`;
        const voxel = this.world.voxels.get(voxelKey);
        
        if (!voxel || voxel.type === 'air') {
            return { success: false, error: 'No voxel to remove' };
        }
        
        // Remove the voxel (set to air)
        const removedVoxel = { ...voxel };
        this.setVoxel(x, y, z, 'air');
        
        // Add to build history
        this.world.buildHistory.push({
            type: 'remove',
            voxel: removedVoxel,
            playerId,
            timestamp: Date.now()
        });
        
        // Broadcast removal
        this.broadcast({
            type: 'voxel_removed',
            position: { x, y, z },
            removedVoxel
        });
        
        // Notify companion system
        this.notifyCompanionSystem('voxel_removed', { 
            position: { x, y, z }, 
            removedVoxel 
        });
        
        return { 
            success: true, 
            removedVoxel,
            drops: this.calculateDrops(removedVoxel)
        };
    }
    
    fillArea(params) {
        const { start, end, type, playerId } = params;
        const placedVoxels = [];
        
        // Validate area size (prevent abuse)
        const volume = Math.abs(end.x - start.x) * Math.abs(end.y - start.y) * Math.abs(end.z - start.z);
        if (volume > 1000) {
            return { success: false, error: 'Area too large (max 1000 voxels)' };
        }
        
        // Fill the area
        for (let x = Math.min(start.x, end.x); x <= Math.max(start.x, end.x); x++) {
            for (let y = Math.min(start.y, end.y); y <= Math.max(start.y, end.y); y++) {
                for (let z = Math.min(start.z, end.z); z <= Math.max(start.z, end.z); z++) {
                    if (this.isValidPosition(x, y, z)) {
                        const voxel = this.setVoxel(x, y, z, type);
                        voxel.placedBy = playerId;
                        placedVoxels.push(voxel);
                    }
                }
            }
        }
        
        // Broadcast bulk placement
        this.broadcast({
            type: 'voxels_placed',
            voxels: placedVoxels
        });
        
        // Notify companion system
        this.notifyCompanionSystem('bulk_build', { 
            voxels: placedVoxels,
            area: { start, end }
        });
        
        return { success: true, placedVoxels: placedVoxels.length };
    }
    
    checkForStructures(x, y, z) {
        // Check if the new voxel completes any structure patterns
        Object.entries(this.structurePatterns).forEach(([structureType, pattern]) => {
            if (this.matchesPattern(x, y, z, pattern)) {
                this.createStructure(structureType, x, y, z, pattern);
            }
        });
    }
    
    matchesPattern(x, y, z, pattern) {
        // Simple pattern matching - check if surrounding voxels match pattern
        // This is a simplified version; real implementation would be more sophisticated
        const requiredVoxels = pattern.pattern || [];
        
        return requiredVoxels.every(requirement => {
            const checkX = x + (requirement.offset?.x || 0);
            const checkY = y + (requirement.offset?.y || 0);
            const checkZ = z + (requirement.offset?.z || 0);
            
            const voxel = this.getVoxel(checkX, checkY, checkZ);
            return voxel && voxel.type === requirement.type;
        });
    }
    
    createStructure(structureType, x, y, z, pattern) {
        const structureId = `${structureType}_${Date.now()}`;
        
        const structure = {
            id: structureId,
            type: structureType,
            position: { x, y, z },
            pattern,
            createdAt: Date.now(),
            createdBy: 'system'
        };
        
        this.world.structures.set(structureId, structure);
        
        console.log(`🏛️ Created structure: ${structureType} at (${x}, ${y}, ${z})`);
        
        // Broadcast structure creation
        this.broadcast({
            type: 'structure_created',
            structure
        });
        
        // Trigger companion reaction
        if (pattern.companionReaction && this.companionSystem) {
            this.triggerCompanionReaction(pattern.companionReaction, structure);
        }
        
        // Bridge to appropriate system
        if (pattern.systemBridge) {
            this.bridgeStructureToSystem(structure, pattern.systemBridge);
        }
    }
    
    async triggerCompanionReaction(companionType, structure) {
        if (!this.companionSystem) return;
        
        try {
            await fetch(`${this.companionSystem}/api/companion/trigger-reaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companionType,
                    event: 'structure_completed',
                    data: structure
                })
            });
        } catch (error) {
            console.error('Failed to trigger companion reaction:', error);
        }
    }
    
    async bridgeStructureToSystem(structure, systemName) {
        const systemUrls = {
            'documentToMVP': 'http://localhost:3001',
            'characterMirror': 'http://localhost:7777',
            'universalCompactor': 'http://localhost:8080'
        };
        
        const url = systemUrls[systemName];
        if (!url) return;
        
        try {
            await fetch(`${url}/api/structure-bridge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'structure_analysis',
                    structure,
                    worldContext: this.getWorldInfo()
                })
            });
        } catch (error) {
            console.error(`Failed to bridge to ${systemName}:`, error);
        }
    }
    
    async generateAIStructure(params) {
        const { description, position, playerId } = params;
        
        try {
            // Bridge to Document-to-MVP for AI generation
            const response = await fetch('http://localhost:3001/api/generate-structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description,
                    position,
                    worldContext: this.getWorldInfo()
                })
            });
            
            if (response.ok) {
                const generatedStructure = await response.json();
                return this.buildGeneratedStructure(generatedStructure, playerId);
            }
        } catch (error) {
            console.error('AI generation failed:', error);
        }
        
        // Fallback: simple procedural generation
        return this.generateSimpleStructure(description, position, playerId);
    }
    
    generateSimpleStructure(description, position, playerId) {
        const structures = {
            'house': this.generateHouse(position),
            'tower': this.generateTower(position),
            'bridge': this.generateBridge(position),
            'castle': this.generateCastle(position)
        };
        
        const structureType = Object.keys(structures).find(type => 
            description.toLowerCase().includes(type)
        ) || 'house';
        
        const voxels = structures[structureType] || structures.house;
        
        // Place all voxels
        voxels.forEach(voxel => {
            this.setVoxel(voxel.x, voxel.y, voxel.z, voxel.type);
        });
        
        // Broadcast generation
        this.broadcast({
            type: 'structure_generated',
            structure: {
                type: structureType,
                position,
                voxels: voxels.length,
                description
            }
        });
        
        return { success: true, voxels: voxels.length };
    }
    
    generateHouse(position) {
        const voxels = [];
        const { x, y, z } = position;
        
        // Foundation
        for (let dx = 0; dx < 5; dx++) {
            for (let dz = 0; dz < 5; dz++) {
                voxels.push({ x: x + dx, y, z: z + dz, type: 'stone' });
            }
        }
        
        // Walls
        for (let dy = 1; dy <= 3; dy++) {
            // Front and back walls
            for (let dx = 0; dx < 5; dx++) {
                voxels.push({ x: x + dx, y: y + dy, z, type: 'wood' });
                voxels.push({ x: x + dx, y: y + dy, z: z + 4, type: 'wood' });
            }
            // Side walls
            for (let dz = 1; dz < 4; dz++) {
                voxels.push({ x, y: y + dy, z: z + dz, type: 'wood' });
                voxels.push({ x: x + 4, y: y + dy, z: z + dz, type: 'wood' });
            }
        }
        
        // Roof
        for (let dx = 0; dx < 5; dx++) {
            for (let dz = 0; dz < 5; dz++) {
                voxels.push({ x: x + dx, y: y + 4, z: z + dz, type: 'wood' });
            }
        }
        
        return voxels;
    }
    
    generateTower(position) {
        const voxels = [];
        const { x, y, z } = position;
        
        // Build tower upward
        for (let dy = 0; dy < 15; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    // Hollow center except for base
                    if (dy === 0 || Math.abs(dx) === 1 || Math.abs(dz) === 1) {
                        voxels.push({ 
                            x: x + dx, 
                            y: y + dy, 
                            z: z + dz, 
                            type: dy < 5 ? 'stone' : 'wood' 
                        });
                    }
                }
            }
        }
        
        return voxels;
    }
    
    generateBridge(position) {
        const voxels = [];
        const { x, y, z } = position;
        
        // Horizontal bridge
        for (let dx = 0; dx < 15; dx++) {
            voxels.push({ x: x + dx, y, z, type: 'wood' });
            voxels.push({ x: x + dx, y, z: z + 1, type: 'wood' });
            
            // Support pillars every 5 blocks
            if (dx % 5 === 0) {
                for (let dy = 1; dy < 4; dy++) {
                    voxels.push({ x: x + dx, y: y + dy, z, type: 'wood' });
                    voxels.push({ x: x + dx, y: y + dy, z: z + 1, type: 'wood' });
                }
            }
        }
        
        return voxels;
    }
    
    generateCastle(position) {
        const voxels = [];
        const { x, y, z } = position;
        
        // Large castle structure
        for (let dx = 0; dx < 10; dx++) {
            for (let dz = 0; dz < 10; dz++) {
                // Foundation
                voxels.push({ x: x + dx, y, z: z + dz, type: 'stone' });
                
                // Outer walls
                if (dx === 0 || dx === 9 || dz === 0 || dz === 9) {
                    for (let dy = 1; dy <= 5; dy++) {
                        voxels.push({ x: x + dx, y: y + dy, z: z + dz, type: 'stone' });
                    }
                }
            }
        }
        
        // Corner towers
        const corners = [[0, 0], [0, 9], [9, 0], [9, 9]];
        corners.forEach(([dx, dz]) => {
            for (let dy = 6; dy <= 10; dy++) {
                voxels.push({ x: x + dx, y: y + dy, z: z + dz, type: 'stone' });
            }
        });
        
        return voxels;
    }
    
    // Helper methods
    getVoxel(x, y, z) {
        const key = `${x},${y},${z}`;
        return this.world.voxels.get(key);
    }
    
    isValidPosition(x, y, z) {
        const size = this.world.size;
        return x >= -size.x/2 && x < size.x/2 &&
               y >= 0 && y < size.y &&
               z >= -size.z/2 && z < size.z/2;
    }
    
    getChunkKey(x, y, z) {
        const chunkSize = 16;
        return `${Math.floor(x/chunkSize)},${Math.floor(y/chunkSize)},${Math.floor(z/chunkSize)}`;
    }
    
    addVoxelToChunk(voxel) {
        const chunkKey = voxel.chunkKey;
        if (!this.world.chunks.has(chunkKey)) {
            this.world.chunks.set(chunkKey, {
                key: chunkKey,
                voxels: [],
                lastModified: Date.now()
            });
        }
        
        const chunk = this.world.chunks.get(chunkKey);
        chunk.voxels.push(voxel);
        chunk.lastModified = Date.now();
    }
    
    getChunk(x, y, z) {
        const chunkKey = this.getChunkKey(x * 16, y * 16, z * 16);
        return this.world.chunks.get(chunkKey);
    }
    
    calculateDrops(voxel) {
        const voxelType = this.voxelTypes[voxel.type];
        return voxelType?.drops || [];
    }
    
    getWorldInfo() {
        return {
            size: this.world.size,
            voxelCount: this.world.voxels.size,
            chunkCount: this.world.chunks.size,
            structureCount: this.world.structures.size,
            playerCount: this.world.players.size
        };
    }
    
    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async notifyCompanionSystem(eventType, data) {
        if (!this.companionSystem) return;
        
        try {
            await fetch(`${this.companionSystem}/api/world-event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: eventType,
                    data,
                    timestamp: Date.now()
                })
            });
        } catch (error) {
            // Silently fail if companion system is not available
        }
    }
    
    handleWebSocketMessage(ws, message) {
        const player = this.world.players.get(ws);
        
        switch (message.type) {
            case 'place_voxel':
                const placeResult = this.placeVoxel({
                    ...message.data,
                    playerId: player?.id
                });
                ws.send(JSON.stringify({
                    type: 'place_result',
                    result: placeResult
                }));
                break;
                
            case 'remove_voxel':
                const removeResult = this.removeVoxel({
                    ...message.data,
                    playerId: player?.id
                });
                ws.send(JSON.stringify({
                    type: 'remove_result',
                    result: removeResult
                }));
                break;
                
            case 'generate_structure':
                this.generateAIStructure({
                    ...message.data,
                    playerId: player?.id
                });
                break;
        }
    }
    
    broadcast(message) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
    
    // Structure patterns
    createHousePattern() {
        return [
            { offset: { x: 0, y: 0, z: 0 }, type: 'wood' },
            { offset: { x: 1, y: 0, z: 0 }, type: 'wood' },
            { offset: { x: 0, y: 1, z: 0 }, type: 'wood' },
        ];
    }
    
    createTowerPattern() {
        return [
            { offset: { x: 0, y: 0, z: 0 }, type: 'stone' },
            { offset: { x: 0, y: 1, z: 0 }, type: 'stone' },
            { offset: { x: 0, y: 2, z: 0 }, type: 'stone' },
        ];
    }
    
    createPlatformPattern() {
        return [
            { offset: { x: 0, y: 0, z: 0 }, type: 'wood' },
            { offset: { x: 1, y: 0, z: 0 }, type: 'wood' },
            { offset: { x: 0, y: 0, z: 1 }, type: 'wood' },
        ];
    }
    
    // System bridge methods
    async bridgeToDocumentMVP(request) {
        try {
            const response = await fetch('http://localhost:3001/api/voxel-bridge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            return await response.json();
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async bridgeToCharacterMirror(request) {
        try {
            const response = await fetch('http://localhost:7777/api/voxel-mirror', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            return await response.json();
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async bridgeToUniversalCompactor(request) {
        try {
            const response = await fetch('http://localhost:8080/api/voxel-compact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            return await response.json();
        } catch (error) {
            return { error: error.message };
        }
    }
    
    getBuildingInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🧱🏗️ Voxel World Builder</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #4a5568, #2d3748);
            font-family: 'Courier New', monospace;
            color: #fff;
            overflow: hidden;
        }
        
        #gameContainer {
            position: relative;
            width: 100vw;
            height: 100vh;
        }
        
        #buildCanvas {
            display: block;
        }
        
        #ui {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 100;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 8px;
            max-width: 300px;
        }
        
        #toolbar {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 8px;
            display: flex;
            gap: 10px;
        }
        
        .tool-btn {
            padding: 10px 15px;
            background: #4a90e2;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .tool-btn:hover {
            background: #357abd;
        }
        
        .tool-btn.active {
            background: #00ff88;
            color: #000;
        }
        
        #voxelPalette {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 100;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 8px;
        }
        
        .voxel-type {
            display: inline-block;
            width: 40px;
            height: 40px;
            margin: 5px;
            cursor: pointer;
            border: 2px solid #333;
            border-radius: 4px;
        }
        
        .voxel-type.selected {
            border-color: #00ff88;
        }
        
        #structureGenerator {
            position: absolute;
            bottom: 10px;
            right: 10px;
            z-index: 100;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 8px;
        }
        
        input, select {
            margin: 5px 0;
            padding: 5px;
            background: #333;
            color: #fff;
            border: 1px solid #555;
            border-radius: 4px;
        }
        
        button {
            padding: 8px 12px;
            background: #00ff88;
            color: #000;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        
        button:hover {
            background: #00cc66;
        }
        
        .status {
            font-size: 12px;
            color: #ccc;
            margin: 5px 0;
        }
        
        h3 {
            color: #00ff88;
            margin: 10px 0;
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
    <div id="gameContainer">
        <canvas id="buildCanvas"></canvas>
        
        <div id="ui">
            <h3>🧱 Voxel World Builder</h3>
            <div class="status">Connected: <span id="connectionStatus">❌</span></div>
            <div class="status">Voxels: <span id="voxelCount">0</span></div>
            <div class="status">Structures: <span id="structureCount">0</span></div>
            <div class="status">Players: <span id="playerCount">0</span></div>
            
            <h3>🤖 System Bridges</h3>
            <div class="status">📄 Document-to-MVP</div>
            <div class="status">🪞 Character Mirror</div>
            <div class="status">📦 Universal Compactor</div>
        </div>
        
        <div id="toolbar">
            <button class="tool-btn active" data-tool="place">🧱 Place</button>
            <button class="tool-btn" data-tool="remove">🗑️ Remove</button>
            <button class="tool-btn" data-tool="fill">🌊 Fill</button>
            <button class="tool-btn" data-tool="copy">📋 Copy</button>
            <button class="tool-btn" data-tool="paste">📌 Paste</button>
        </div>
        
        <div id="voxelPalette">
            <h3>🎨 Materials</h3>
            <div class="voxel-type selected" data-type="stone" style="background: #888;"></div>
            <div class="voxel-type" data-type="wood" style="background: #8B4513;"></div>
            <div class="voxel-type" data-type="grass" style="background: #228B22;"></div>
            <div class="voxel-type" data-type="dirt" style="background: #8B4513;"></div>
            <div class="voxel-type" data-type="water" style="background: #0077BE;"></div>
            <div class="voxel-type" data-type="gold" style="background: #FFD700;"></div>
            <div class="voxel-type" data-type="diamond" style="background: #87CEEB;"></div>
        </div>
        
        <div id="structureGenerator">
            <h3>🏗️ AI Generator</h3>
            <input type="text" id="structureDesc" placeholder="Describe structure...">
            <button onclick="generateStructure()">🚀 Generate</button>
            <br>
            <select id="presetStructures">
                <option value="">Presets...</option>
                <option value="house">🏠 House</option>
                <option value="tower">🗼 Tower</option>
                <option value="bridge">🌉 Bridge</option>
                <option value="castle">🏰 Castle</option>
            </select>
            <button onclick="buildPreset()">🏗️ Build</button>
        </div>
    </div>
    
    <script>
        // Three.js scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('buildCanvas'), antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x87CEEB, 1);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(50, 50, 25);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        
        // Game state
        let voxels = new Map();
        let currentTool = 'place';
        let selectedVoxelType = 'stone';
        let playerId = null;
        
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:9997');
        
        ws.onopen = () => {
            document.getElementById('connectionStatus').textContent = '✅';
            console.log('🔌 Connected to Voxel World Builder');
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
        };
        
        function handleServerMessage(message) {
            switch (message.type) {
                case 'world_init':
                    playerId = message.data.playerId;
                    updateUI(message.data.worldInfo);
                    break;
                    
                case 'voxel_placed':
                    addVoxel(message.voxel);
                    break;
                    
                case 'voxel_removed':
                    removeVoxel(message.position);
                    break;
                    
                case 'voxels_placed':
                    message.voxels.forEach(voxel => addVoxel(voxel));
                    break;
                    
                case 'structure_created':
                    console.log('Structure created:', message.structure);
                    break;
                    
                case 'structure_generated':
                    console.log('Structure generated:', message.structure);
                    break;
            }
        }
        
        function updateUI(worldInfo) {
            document.getElementById('voxelCount').textContent = worldInfo.voxelCount || 0;
            document.getElementById('structureCount').textContent = worldInfo.structureCount || 0;
            document.getElementById('playerCount').textContent = worldInfo.playerCount || 0;
        }
        
        function addVoxel(voxel) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const color = getVoxelColor(voxel.type);
            const material = new THREE.MeshLambertMaterial({ color });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(voxel.x, voxel.y, voxel.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = voxel;
            
            scene.add(mesh);
            voxels.set(\`\${voxel.x},\${voxel.y},\${voxel.z}\`, mesh);
        }
        
        function removeVoxel(position) {
            const key = \`\${position.x},\${position.y},\${position.z}\`;
            const mesh = voxels.get(key);
            if (mesh) {
                scene.remove(mesh);
                voxels.delete(key);
            }
        }
        
        function getVoxelColor(type) {
            const colors = {
                stone: 0x888888,
                wood: 0x8B4513,
                grass: 0x228B22,
                dirt: 0x654321,
                water: 0x0077BE,
                gold: 0xFFD700,
                diamond: 0x87CEEB
            };
            return colors[type] || 0x888888;
        }
        
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentTool = btn.dataset.tool;
            });
        });
        
        // Voxel type selection
        document.querySelectorAll('.voxel-type').forEach(type => {
            type.addEventListener('click', () => {
                document.querySelectorAll('.voxel-type').forEach(t => t.classList.remove('selected'));
                type.classList.add('selected');
                selectedVoxelType = type.dataset.type;
            });
        });
        
        // Mouse interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        function onMouseClick(event) {
            if (event.target.tagName === 'BUTTON' || event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
                return;
            }
            
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, camera);
            
            if (currentTool === 'place') {
                // Place voxel at clicked position (simplified)
                const position = {
                    x: Math.floor(Math.random() * 20) - 10,
                    y: Math.floor(Math.random() * 5) + 20,
                    z: Math.floor(Math.random() * 20) - 10
                };
                
                ws.send(JSON.stringify({
                    type: 'place_voxel',
                    data: {
                        ...position,
                        type: selectedVoxelType
                    }
                }));
            } else if (currentTool === 'remove') {
                // Remove voxel at clicked position
                const intersects = raycaster.intersectObjects(Array.from(voxels.values()));
                
                if (intersects.length > 0) {
                    const intersectedObject = intersects[0].object;
                    const voxel = intersectedObject.userData;
                    
                    ws.send(JSON.stringify({
                        type: 'remove_voxel',
                        data: {
                            x: voxel.x,
                            y: voxel.y,
                            z: voxel.z
                        }
                    }));
                }
            }
        }
        
        document.addEventListener('click', onMouseClick);
        
        // Camera controls
        camera.position.set(30, 30, 30);
        camera.lookAt(0, 20, 0);
        
        let mouseDown = false;
        let mouseX = 0, mouseY = 0;
        
        document.addEventListener('mousedown', (e) => {
            mouseDown = true;
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        document.addEventListener('mouseup', () => {
            mouseDown = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!mouseDown) return;
            
            const deltaX = e.clientX - mouseX;
            const deltaY = e.clientY - mouseY;
            
            // Rotate camera around center
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(camera.position);
            spherical.theta -= deltaX * 0.01;
            spherical.phi += deltaY * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
            
            camera.position.setFromSpherical(spherical);
            camera.lookAt(0, 20, 0);
            
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        // Zoom with mouse wheel
        document.addEventListener('wheel', (e) => {
            const zoom = e.deltaY > 0 ? 1.1 : 0.9;
            camera.position.multiplyScalar(zoom);
        });
        
        // Structure generation
        async function generateStructure() {
            const description = document.getElementById('structureDesc').value;
            if (!description) return;
            
            ws.send(JSON.stringify({
                type: 'generate_structure',
                data: {
                    description,
                    position: { x: 0, y: 21, z: 0 }
                }
            }));
        }
        
        async function buildPreset() {
            const preset = document.getElementById('presetStructures').value;
            if (!preset) return;
            
            ws.send(JSON.stringify({
                type: 'generate_structure',
                data: {
                    description: preset,
                    position: { x: 0, y: 21, z: 0 }
                }
            }));
        }
        
        // Render loop
        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }
        animate();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        console.log('🧱 Voxel World Builder initialized');
        console.log('🏗️ Start building your world!');
    </script>
</body>
</html>`;
    }
}

// Start the voxel world builder
if (require.main === module) {
    new VoxelWorldBuilder();
}

module.exports = VoxelWorldBuilder;