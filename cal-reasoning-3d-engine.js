#!/usr/bin/env node

/**
 * CAL REASONING 3D ENGINE
 * Unified 3D game engine that converts conversations and reasoning into visual reality
 * 
 * Features:
 * - Voice/text to 3D structure generation
 * - CAL reasoning integration for intelligent building
 * - Ticker tape event to bitmap loot conversion
 * - Real-time multiplayer collaboration
 * - ChronoQuest NPC integration
 * - Document to voxel world conversion
 * - Fantasy world building with reality bridge
 */

const express = require('express');
const { WebSocketServer } = require('ws');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CALReasoning3DEngine {
    constructor(options = {}) {
        this.options = {
            port: options.port || process.env.CAL_3D_PORT || 3456,
            wsPort: options.wsPort || process.env.CAL_3D_WS_PORT || 3457,
            
            // World configuration
            worldSize: options.worldSize || { x: 1000, y: 256, z: 1000 },
            chunkSize: options.chunkSize || 16,
            renderDistance: options.renderDistance || 8,
            
            // CAL reasoning settings
            calReasoningThreshold: options.calReasoningThreshold || 0.8,
            complexityLevels: options.complexityLevels || ['simple', 'moderate', 'complex', 'genius'],
            
            // Loot system configuration
            tickerTapeRewardMultiplier: options.tickerTapeRewardMultiplier || 1.5,
            bitmapGenerationRules: options.bitmapGenerationRules || 'fantasy-theme',
            
            ...options
        };
        
        // Core systems
        this.app = express();
        this.worlds = new Map(); // Active 3D worlds
        this.players = new Map(); // Connected players
        this.npcs = new Map(); // ChronoQuest NPCs
        this.conversations = new Map(); // Active reasoning sessions
        this.lootRegistry = new Map(); // Generated loot items
        
        // 3D Engine components
        this.voxelEngine = new VoxelEngine(this.options);
        this.calReasoningMapper = new CALReasoningMapper();
        this.tickerTapeLootSystem = new TickerTapeLootSystem();
        this.voiceProcessor = new VoiceToActionProcessor();
        this.documentVoxelizer = new DocumentVoxelizer();
        
        // Material definitions for different content types
        this.materials = {
            // Document types
            text: { color: '#ffffff', opacity: 0.8, type: 'document' },
            code: { color: '#00ff00', opacity: 0.9, type: 'code', glowing: true },
            image: { color: '#ff6b6b', opacity: 1.0, type: 'media' },
            audio: { color: '#4ecdc4', opacity: 0.7, type: 'audio', animated: true },
            video: { color: '#45b7d1', opacity: 0.8, type: 'video', animated: true },
            
            // Reasoning quality levels
            basicReasoning: { color: '#8e44ad', rarity: 'common' },
            goodReasoning: { color: '#3498db', rarity: 'uncommon' },
            excellentReasoning: { color: '#f39c12', rarity: 'rare' },
            geniusReasoning: { color: '#e74c3c', rarity: 'legendary', effects: ['particle_glow'] },
            
            // Special materials
            ssl: { color: '#2ecc71', type: 'security', encrypted: true },
            api: { color: '#9b59b6', type: 'integration', connectors: true },
            database: { color: '#34495e', type: 'storage', dense: true }
        };
        
        // ChronoQuest NPCs with 3D world integration
        this.initializeNPCs();
        this.initializeWorlds();
        this.setupRoutes();
        this.initializeWebSocket();
        
        console.log('🎮 CAL Reasoning 3D Engine initialized');
        console.log(`🌍 World size: ${this.options.worldSize.x}x${this.options.worldSize.y}x${this.options.worldSize.z}`);
    }
    
    initializeNPCs() {
        this.npcs.set('the-archivist', {
            id: 'the-archivist',
            name: 'The Archivist',
            service: 'blamechain-storybook-archive',
            personality: 'ancient_keeper',
            position: { x: 100, y: 64, z: 100 },
            currentQuest: 'Why must everything be remembered?',
            abilities: ['document_archival', 'pattern_recognition', 'memory_crystallization'],
            dialogue: {
                greeting: "Ah, another seeker of knowledge approaches my archive...",
                questOffer: "I sense patterns in your reasoning. Let me show you how thoughts become crystal...",
                reward: "Your understanding deepens the archive. Take this crystallized memory."
            },
            model: 'wizard_librarian',
            aura: 'knowledge_particles'
        });
        
        this.npcs.set('the-constructor', {
            id: 'the-constructor',
            name: 'The Constructor',
            service: 'ssl-certificate-automation',
            personality: 'security_guardian',
            position: { x: 200, y: 64, z: 200 },
            currentQuest: 'How do we build trust in a trustless world?',
            abilities: ['ssl_forging', 'certificate_weaving', 'security_enchantment'],
            dialogue: {
                greeting: "Welcome to the Secure Foundry, where trust is forged in digital fire...",
                questOffer: "Your domains need protection. Let me teach you the art of certificate weaving.",
                reward: "A perfectly forged SSL charm. Your domains shall know no fear."
            },
            model: 'cyber_blacksmith',
            aura: 'security_shields'
        });
        
        this.npcs.set('the-voxelmancer', {
            id: 'the-voxelmancer',
            name: 'The Voxelmancer',
            service: 'universal-file-processor',
            personality: 'transformation_sage',
            position: { x: 300, y: 64, z: 300 },
            currentQuest: 'Can any form truly contain infinite possibility?',
            abilities: ['format_transmutation', 'quality_enhancement', 'dimensional_conversion'],
            dialogue: {
                greeting: "Behold! Every file, every format, bends to the will of transformation...",
                questOffer: "Your documents yearn for their true form. Shall we discover it together?",
                reward: "A shapeshifting codec crystal. Transform with perfect fidelity."
            },
            model: 'geometric_wizard',
            aura: 'transformation_sparks'
        });
        
        this.npcs.set('the-reasoner', {
            id: 'the-reasoner',
            name: 'The Reasoner',
            service: 'cal-reasoning-mapper',
            personality: 'logic_philosopher',
            position: { x: 400, y: 64, z: 400 },
            currentQuest: 'What is the difference between knowledge and understanding?',
            abilities: ['pattern_synthesis', 'logical_crystallization', 'insight_amplification'],
            dialogue: {
                greeting: "Every conversation creates ripples in the fabric of understanding...",
                questOffer: "Your thoughts show promise. Let me help you forge them into crystal clarity.",
                reward: "A reasoning amplifier. Your next insights will echo through dimensions."
            },
            model: 'ethereal_sage',
            aura: 'thought_streams'
        });
        
        this.npcs.set('the-curator', {
            id: 'the-curator',
            name: 'The Curator',
            service: 'content-curation-empire',
            personality: 'network_weaver',
            position: { x: 500, y: 64, z: 500 },
            currentQuest: 'How do we curate infinite content while preserving authentic voice?',
            abilities: ['content_distillation', 'audience_synthesis', 'viral_amplification'],
            dialogue: {
                greeting: "Welcome to the Grand Gallery, where every piece of content finds its perfect audience...",
                questOffer: "Your content has potential. Let me show you how to weave it into the greater tapestry.",
                reward: "A curation compass. It will guide your content to those who need it most."
            },
            model: 'digital_curator',
            aura: 'content_streams'
        });
        
        console.log(`🤖 Initialized ${this.npcs.size} ChronoQuest NPCs`);
    }
    
    initializeWorlds() {
        // Create the main CAL Reasoning world
        const mainWorld = {
            id: 'cal-reasoning-realm',
            name: 'CAL Reasoning Realm',
            description: 'Where conversations become reality and thoughts take form',
            size: this.options.worldSize,
            chunks: new Map(),
            players: new Set(),
            activeConversations: new Map(),
            generatedStructures: new Map(),
            lootSpawns: new Map(),
            weatherSystem: new WeatherSystem(),
            dayNightCycle: new DayNightCycle()
        };
        
        // Generate initial terrain and NPC locations
        this.generateInitialTerrain(mainWorld);
        this.spawnNPCs(mainWorld);
        
        this.worlds.set('cal-reasoning-realm', mainWorld);
        
        console.log('🌍 Main world "CAL Reasoning Realm" initialized');
    }
    
    generateInitialTerrain(world) {
        const { x: worldX, y: worldY, z: worldZ } = world.size;
        const chunkSize = this.options.chunkSize;
        
        // Generate chunks with different biomes based on service types
        for (let cx = 0; cx < Math.ceil(worldX / chunkSize); cx++) {
            for (let cz = 0; cz < Math.ceil(worldZ / chunkSize); cz++) {
                const chunkId = `${cx}-${cz}`;
                
                // Determine biome based on position
                const biome = this.getBiomeForChunk(cx, cz);
                
                const chunk = {
                    id: chunkId,
                    x: cx,
                    z: cz,
                    biome: biome,
                    voxels: new Map(),
                    structures: new Map(),
                    generatedFrom: null, // Will be set when generated from documents/conversations
                    lastModified: Date.now()
                };
                
                // Generate base terrain
                this.generateChunkTerrain(chunk, biome);
                
                world.chunks.set(chunkId, chunk);
            }
        }
        
        console.log(`🏔️ Generated ${world.chunks.size} chunks for world ${world.id}`);
    }
    
    getBiomeForChunk(cx, cz) {
        // Create biomes based on distance from center and service types
        const centerX = Math.floor(this.options.worldSize.x / this.options.chunkSize / 2);
        const centerZ = Math.floor(this.options.worldSize.z / this.options.chunkSize / 2);
        
        const distanceFromCenter = Math.sqrt((cx - centerX) ** 2 + (cz - centerZ) ** 2);
        
        if (distanceFromCenter < 3) return 'knowledge_core'; // Central area for main NPCs
        if (distanceFromCenter < 8) return 'reasoning_plains'; // Area for conversation structures
        if (distanceFromCenter < 15) return 'document_forest'; // Document processing area
        if (distanceFromCenter < 25) return 'api_mountains'; // Integration systems
        return 'void_frontier'; // Unexplored areas
    }
    
    generateChunkTerrain(chunk, biome) {
        const biomeConfigs = {
            knowledge_core: {
                baseHeight: 64,
                variation: 4,
                materials: ['crystal_knowledge', 'gold_insight', 'marble_wisdom'],
                structures: ['knowledge_spires', 'wisdom_pools']
            },
            reasoning_plains: {
                baseHeight: 60,
                variation: 8,
                materials: ['grass_logic', 'stone_deduction', 'water_clarity'],
                structures: ['thinking_circles', 'debate_amphitheaters']
            },
            document_forest: {
                baseHeight: 58,
                variation: 12,
                materials: ['wood_text', 'leaf_metadata', 'soil_content'],
                structures: ['paper_trees', 'index_shrines']
            },
            api_mountains: {
                baseHeight: 80,
                variation: 30,
                materials: ['stone_protocol', 'iron_endpoint', 'obsidian_security'],
                structures: ['api_peaks', 'integration_bridges']
            },
            void_frontier: {
                baseHeight: 50,
                variation: 20,
                materials: ['void_stone', 'mystery_crystal'],
                structures: ['exploration_beacons']
            }
        };
        
        const config = biomeConfigs[biome] || biomeConfigs.void_frontier;
        
        // Generate height map for this chunk
        for (let x = 0; x < this.options.chunkSize; x++) {
            for (let z = 0; z < this.options.chunkSize; z++) {
                const height = config.baseHeight + 
                    Math.floor(Math.random() * config.variation) - 
                    Math.floor(config.variation / 2);
                
                // Generate vertical column
                for (let y = 0; y <= height; y++) {
                    const voxelId = `${x}-${y}-${z}`;
                    let material;
                    
                    if (y === height) {
                        material = config.materials[0]; // Surface material
                    } else if (y > height - 3) {
                        material = config.materials[1] || config.materials[0]; // Sub-surface
                    } else {
                        material = config.materials[2] || config.materials[1] || config.materials[0]; // Deep
                    }
                    
                    chunk.voxels.set(voxelId, {
                        material,
                        durability: 100,
                        properties: this.materials[material] || {},
                        generatedFrom: 'terrain'
                    });
                }
            }
        }
    }
    
    spawnNPCs(world) {
        for (const [npcId, npc] of this.npcs) {
            // Find appropriate chunk for NPC
            const chunkX = Math.floor(npc.position.x / this.options.chunkSize);
            const chunkZ = Math.floor(npc.position.z / this.options.chunkSize);
            const chunkId = `${chunkX}-${chunkZ}`;
            
            const chunk = world.chunks.get(chunkId);
            if (chunk) {
                // Create NPC structure
                const npcStructure = {
                    id: `npc-${npcId}`,
                    type: 'npc_dwelling',
                    npcId: npcId,
                    position: npc.position,
                    size: { x: 7, y: 8, z: 7 },
                    materials: this.getNPCMaterials(npc),
                    interactive: true,
                    questAvailable: true
                };
                
                chunk.structures.set(npcStructure.id, npcStructure);
                this.buildNPCStructure(chunk, npcStructure, npc);
                
                console.log(`🏠 Built dwelling for ${npc.name} at ${npc.position.x}, ${npc.position.y}, ${npc.position.z}`);
            }
        }
    }
    
    getNPCMaterials(npc) {
        const materialMappings = {
            'ancient_keeper': ['ancient_stone', 'knowledge_crystal', 'memory_glass'],
            'security_guardian': ['steel_security', 'crystal_ssl', 'force_field'],
            'transformation_sage': ['shifting_stone', 'prism_crystal', 'morph_metal'],
            'logic_philosopher': ['thought_crystal', 'logic_marble', 'wisdom_gold'],
            'network_weaver': ['fiber_optic', 'data_crystal', 'connection_copper']
        };
        
        return materialMappings[npc.personality] || ['default_stone', 'default_wood'];
    }
    
    buildNPCStructure(chunk, structure, npc) {
        const { x: startX, y: startY, z: startZ } = structure.position;
        const { x: sizeX, y: sizeY, z: sizeZ } = structure.size;
        
        // Build a simple tower structure for the NPC
        for (let x = 0; x < sizeX; x++) {
            for (let y = 0; y < sizeY; y++) {
                for (let z = 0; z < sizeZ; z++) {
                    const localX = (startX + x) % this.options.chunkSize;
                    const localZ = (startZ + z) % this.options.chunkSize;
                    const voxelId = `${localX}-${startY + y}-${localZ}`;
                    
                    let material = structure.materials[0];
                    
                    // Create walls and special features
                    if (x === 0 || x === sizeX - 1 || z === 0 || z === sizeZ - 1) {
                        material = structure.materials[0]; // Wall material
                    } else if (y === 0) {
                        material = structure.materials[1]; // Floor material
                    } else if (y === sizeY - 1) {
                        material = structure.materials[2]; // Roof material
                    } else {
                        continue; // Interior space
                    }
                    
                    chunk.voxels.set(voxelId, {
                        material,
                        durability: 200,
                        properties: {
                            ...this.materials[material],
                            npc: npc.id,
                            interactive: true
                        },
                        generatedFrom: `npc-${npc.id}`
                    });
                }
            }
        }
        
        // Add special features based on NPC type
        this.addNPCSpecialFeatures(chunk, structure, npc);
    }
    
    addNPCSpecialFeatures(chunk, structure, npc) {
        const centerX = Math.floor(structure.size.x / 2);
        const centerZ = Math.floor(structure.size.z / 2);
        const centerY = structure.position.y + 1;
        
        // Add NPC-specific special blocks
        const specialFeatures = {
            'the-archivist': {
                'knowledge_pedestal': { x: centerX, y: centerY, z: centerZ },
                'memory_crystals': [
                    { x: centerX - 1, y: centerY, z: centerZ - 1 },
                    { x: centerX + 1, y: centerY, z: centerZ + 1 }
                ]
            },
            'the-constructor': {
                'ssl_forge': { x: centerX, y: centerY, z: centerZ },
                'certificate_anvil': { x: centerX - 1, y: centerY, z: centerZ }
            },
            'the-voxelmancer': {
                'transformation_altar': { x: centerX, y: centerY, z: centerZ },
                'format_crystals': [
                    { x: centerX - 1, y: centerY + 1, z: centerZ },
                    { x: centerX + 1, y: centerY + 1, z: centerZ }
                ]
            }
        };
        
        const features = specialFeatures[npc.id] || {};
        
        for (const [featureType, positions] of Object.entries(features)) {
            if (Array.isArray(positions)) {
                positions.forEach(pos => this.placeSpecialBlock(chunk, structure, pos, featureType, npc));
            } else {
                this.placeSpecialBlock(chunk, structure, positions, featureType, npc);
            }
        }
    }
    
    placeSpecialBlock(chunk, structure, position, featureType, npc) {
        const localX = (structure.position.x + position.x) % this.options.chunkSize;
        const localZ = (structure.position.z + position.z) % this.options.chunkSize;
        const voxelId = `${localX}-${position.y}-${localZ}`;
        
        chunk.voxels.set(voxelId, {
            material: featureType,
            durability: 500,
            properties: {
                special: true,
                npc: npc.id,
                interactive: true,
                feature: featureType,
                glowing: true,
                animated: true
            },
            generatedFrom: `npc-special-${npc.id}`
        });
    }
    
    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Main 3D world interface
        this.app.get('/', (req, res) => {
            res.send(this.generateMainInterface());
        });
        
        // World data API
        this.app.get('/api/worlds', (req, res) => {
            const worldList = Array.from(this.worlds.values()).map(world => ({
                id: world.id,
                name: world.name,
                description: world.description,
                size: world.size,
                playerCount: world.players.size,
                chunkCount: world.chunks.size
            }));
            
            res.json({ worlds: worldList });
        });
        
        // Get world chunks
        this.app.get('/api/worlds/:worldId/chunks', (req, res) => {
            const { worldId } = req.params;
            const { x, z, radius = 2 } = req.query;
            
            const world = this.worlds.get(worldId);
            if (!world) {
                return res.status(404).json({ error: 'World not found' });
            }
            
            const chunks = this.getChunksInRadius(world, parseInt(x), parseInt(z), parseInt(radius));
            res.json({ chunks });
        });
        
        // Voice to action API
        this.app.post('/api/voice-command', (req, res) => {
            const { audio, text, playerId, worldId, position } = req.body;
            
            this.processVoiceCommand(audio, text, playerId, worldId, position)
                .then(result => res.json(result))
                .catch(error => res.status(400).json({ error: error.message }));
        });
        
        // Document to voxel conversion
        this.app.post('/api/document-to-voxel', (req, res) => {
            const { document, worldId, position, playerId } = req.body;
            
            this.convertDocumentToVoxels(document, worldId, position, playerId)
                .then(result => res.json(result))
                .catch(error => res.status(400).json({ error: error.message }));
        });
        
        // NPC interaction
        this.app.post('/api/npc/:npcId/interact', (req, res) => {
            const { npcId } = req.params;
            const { playerId, message, worldId } = req.body;
            
            this.handleNPCInteraction(npcId, playerId, message, worldId)
                .then(result => res.json(result))
                .catch(error => res.status(400).json({ error: error.message }));
        });
        
        // Loot system
        this.app.get('/api/player/:playerId/loot', (req, res) => {
            const { playerId } = req.params;
            const loot = this.getPlayerLoot(playerId);
            res.json({ loot });
        });
        
        // CAL reasoning analysis
        this.app.post('/api/analyze-reasoning', (req, res) => {
            const { conversation, context, playerId } = req.body;
            
            this.analyzeReasoning(conversation, context, playerId)
                .then(result => res.json(result))
                .catch(error => res.status(400).json({ error: error.message }));
        });
    }
    
    initializeWebSocket() {
        this.wss = new WebSocketServer({ port: this.options.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🎮 Player connected to 3D world');
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    ws.send(JSON.stringify({ error: error.message }));
                }
            });
            
            ws.on('close', () => {
                console.log('🎮 Player disconnected from 3D world');
                this.handlePlayerDisconnect(ws);
            });
        });
    }
    
    generateMainInterface() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CAL Reasoning 3D Engine</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <style>
        body { margin: 0; overflow: hidden; background: #000; font-family: 'Courier New', monospace; }
        #gameContainer { position: relative; width: 100vw; height: 100vh; }
        #ui { position: absolute; top: 20px; left: 20px; color: #fff; z-index: 1000; }
        #chat { position: absolute; bottom: 20px; left: 20px; width: 400px; z-index: 1000; }
        #chatInput { width: 100%; padding: 10px; background: rgba(0,0,0,0.8); color: #fff; border: 1px solid #0ff; }
        #voiceButton { margin-top: 10px; padding: 10px 20px; background: #0ff; color: #000; border: none; cursor: pointer; }
        #reasoning { position: absolute; top: 20px; right: 20px; width: 300px; background: rgba(0,0,0,0.8); padding: 15px; color: #fff; }
        #loot { position: absolute; bottom: 20px; right: 20px; width: 200px; background: rgba(0,0,0,0.8); padding: 10px; color: #fff; }
        .npc-dialogue { background: rgba(75, 0, 130, 0.9); padding: 15px; margin: 10px 0; border-left: 4px solid #0ff; }
        .reasoning-quality { padding: 5px 10px; margin: 2px; border-radius: 3px; display: inline-block; }
        .basic { background: #8e44ad; }
        .good { background: #3498db; }
        .excellent { background: #f39c12; }
        .genius { background: #e74c3c; animation: glow 2s infinite; }
        @keyframes glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    </style>
</head>
<body>
    <div id="gameContainer">
        <div id="ui">
            <h2>🎮 CAL Reasoning 3D Engine</h2>
            <p>Speak, think, build. Your words become reality.</p>
            <div>Position: <span id="position">0, 64, 0</span></div>
            <div>Active Conversations: <span id="conversations">0</span></div>
        </div>
        
        <div id="reasoning">
            <h3>🧠 Reasoning Analysis</h3>
            <div id="reasoningContent">Start a conversation to see analysis...</div>
        </div>
        
        <div id="loot">
            <h3>🎁 Loot Collected</h3>
            <div id="lootContent">No loot yet...</div>
        </div>
        
        <div id="chat">
            <input type="text" id="chatInput" placeholder="Type to build... (or use voice)" />
            <button id="voiceButton">🎤 Voice Command</button>
        </div>
    </div>
    
    <script>
        // Initialize Three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('gameContainer').appendChild(renderer.domElement);
        
        // Set up lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:3457');
        
        ws.onopen = () => {
            console.log('🎮 Connected to CAL Reasoning 3D Engine');
            ws.send(JSON.stringify({ type: 'join_world', worldId: 'cal-reasoning-realm' }));
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleServerMessage(data);
        };
        
        // Game state
        let player = { position: { x: 0, y: 64, z: 0 }, loot: [], conversations: [] };
        let world = { chunks: new Map(), npcs: new Map() };
        
        // Input handling
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = e.target.value;
                if (message.trim()) {
                    sendMessage(message);
                    e.target.value = '';
                }
            }
        });
        
        document.getElementById('voiceButton').addEventListener('click', startVoiceCommand);
        
        function sendMessage(message) {
            ws.send(JSON.stringify({
                type: 'chat_message',
                message: message,
                position: player.position,
                timestamp: Date.now()
            }));
        }
        
        function startVoiceCommand() {
            if ('webkitSpeechRecognition' in window) {
                const recognition = new webkitSpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';
                
                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    document.getElementById('chatInput').value = transcript;
                    sendMessage(transcript);
                };
                
                recognition.start();
            } else {
                alert('Voice recognition not supported in this browser');
            }
        }
        
        function handleServerMessage(data) {
            switch (data.type) {
                case 'world_data':
                    loadWorldData(data.world);
                    break;
                case 'structure_generated':
                    addStructureToWorld(data.structure);
                    break;
                case 'reasoning_analysis':
                    updateReasoningDisplay(data.analysis);
                    break;
                case 'loot_received':
                    addLootToPlayer(data.loot);
                    break;
                case 'npc_dialogue':
                    showNPCDialogue(data.npc, data.dialogue);
                    break;
            }
        }
        
        function loadWorldData(worldData) {
            // Clear existing world
            while(scene.children.length > 0) {
                scene.remove(scene.children[0]);
            }
            
            // Re-add lights
            scene.add(ambientLight);
            scene.add(directionalLight);
            
            // Load chunks
            worldData.chunks.forEach(chunk => {
                loadChunk(chunk);
            });
            
            // Load NPCs
            worldData.npcs.forEach(npc => {
                loadNPC(npc);
            });
        }
        
        function loadChunk(chunk) {
            const chunkGroup = new THREE.Group();
            
            chunk.voxels.forEach(voxel => {
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = getMaterialForVoxel(voxel);
                const cube = new THREE.Mesh(geometry, material);
                
                cube.position.set(voxel.x, voxel.y, voxel.z);
                cube.castShadow = true;
                cube.receiveShadow = true;
                
                chunkGroup.add(cube);
            });
            
            scene.add(chunkGroup);
        }
        
        function getMaterialForVoxel(voxel) {
            const materialConfigs = {
                grass_logic: { color: 0x4CAF50 },
                stone_deduction: { color: 0x607D8B },
                crystal_knowledge: { color: 0x9C27B0, transparent: true, opacity: 0.8 },
                ancient_stone: { color: 0x795548 },
                knowledge_crystal: { color: 0x3F51B5, emissive: 0x001155 },
                ssl_forge: { color: 0x4CAF50, emissive: 0x00FF00 },
                transformation_altar: { color: 0xFF9800, emissive: 0xFF4400 }
            };
            
            const config = materialConfigs[voxel.material] || { color: 0x888888 };
            
            return new THREE.MeshLambertMaterial({
                color: config.color,
                transparent: config.transparent || false,
                opacity: config.opacity || 1.0,
                emissive: config.emissive || 0x000000
            });
        }
        
        function loadNPC(npc) {
            const geometry = new THREE.ConeGeometry(0.5, 2, 8);
            const material = new THREE.MeshLambertMaterial({ 
                color: 0xFF6B6B,
                emissive: 0x330000
            });
            const npcMesh = new THREE.Mesh(geometry, material);
            
            npcMesh.position.set(npc.position.x, npc.position.y + 1, npc.position.z);
            npcMesh.userData = { type: 'npc', id: npc.id, name: npc.name };
            
            scene.add(npcMesh);
            
            // Add floating text
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;
            context.fillStyle = '#ffffff';
            context.font = '20px Arial';
            context.fillText(npc.name, 10, 30);
            
            const texture = new THREE.CanvasTexture(canvas);
            const textMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(textMaterial);
            sprite.position.set(npc.position.x, npc.position.y + 3, npc.position.z);
            sprite.scale.set(4, 1, 1);
            
            scene.add(sprite);
        }
        
        function updateReasoningDisplay(analysis) {
            const content = document.getElementById('reasoningContent');
            content.innerHTML = \`
                <div class="reasoning-quality \${analysis.quality}">
                    \${analysis.quality.toUpperCase()} REASONING
                </div>
                <p><strong>Complexity:</strong> \${analysis.complexity}</p>
                <p><strong>Clarity:</strong> \${analysis.clarity}/100</p>
                <p><strong>Insights:</strong> \${analysis.insights}</p>
                <p><strong>Generated Structures:</strong> \${analysis.structuresGenerated}</p>
            \`;
        }
        
        function addLootToPlayer(loot) {
            player.loot.push(loot);
            const content = document.getElementById('lootContent');
            content.innerHTML = player.loot.map(item => \`
                <div style="background: \${item.rarity === 'legendary' ? '#e74c3c' : item.rarity === 'rare' ? '#f39c12' : '#3498db'}; padding: 5px; margin: 2px; border-radius: 3px;">
                    \${item.name}
                </div>
            \`).join('');
        }
        
        function showNPCDialogue(npc, dialogue) {
            const chatContainer = document.getElementById('chat');
            const dialogueDiv = document.createElement('div');
            dialogueDiv.className = 'npc-dialogue';
            dialogueDiv.innerHTML = \`
                <strong>\${npc.name}:</strong><br>
                \${dialogue.message}
            \`;
            
            chatContainer.appendChild(dialogueDiv);
            setTimeout(() => dialogueDiv.remove(), 10000);
        }
        
        // Camera controls
        camera.position.set(10, 70, 10);
        camera.lookAt(0, 64, 0);
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            // Update camera position based on time
            const time = Date.now() * 0.0005;
            camera.position.x = Math.cos(time) * 50;
            camera.position.z = Math.sin(time) * 50;
            camera.lookAt(0, 64, 0);
            
            renderer.render(scene, camera);
        }
        
        animate();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    </script>
</body>
</html>
        `;
    }
    
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.options.port, () => {
                console.log(`🎮 CAL Reasoning 3D Engine running on port ${this.options.port}`);
                console.log(`🌐 WebSocket server running on port ${this.options.wsPort}`);
                console.log(`🎯 Visit http://localhost:${this.options.port} to enter the world`);
                console.log(`🤖 ${this.npcs.size} NPCs ready for interaction`);
                console.log(`🌍 ${this.worlds.size} worlds initialized`);
                
                resolve();
            });
        });
    }
}

// Supporting classes for the 3D engine
class VoxelEngine {
    constructor(options) {
        this.options = options;
        this.materials = new Map();
        this.meshCache = new Map();
    }
    
    generateMesh(voxels) {
        // Implementation for generating optimized meshes from voxel data
        return { vertices: [], indices: [], materials: [] };
    }
}

class CALReasoningMapper {
    constructor() {
        this.patterns = new Map();
        this.reasoningHistory = new Map();
    }
    
    async analyzeConversation(text, context) {
        // Analyze conversation quality and extract patterns
        const analysis = {
            quality: this.determineQuality(text),
            complexity: this.calculateComplexity(text),
            clarity: this.scoreClanity(text),
            insights: this.extractInsights(text),
            structuresGenerated: 0
        };
        
        return analysis;
    }
    
    determineQuality(text) {
        const wordCount = text.split(' ').length;
        const questionCount = (text.match(/\?/g) || []).length;
        const complexWords = (text.match(/\b\w{8,}\b/g) || []).length;
        
        if (wordCount > 100 && questionCount > 2 && complexWords > 10) return 'genius';
        if (wordCount > 50 && questionCount > 1 && complexWords > 5) return 'excellent';
        if (wordCount > 20 && complexWords > 2) return 'good';
        return 'basic';
    }
    
    calculateComplexity(text) {
        return Math.min(10, Math.floor(text.length / 50));
    }
    
    scoreClanity(text) {
        // Simple clarity scoring based on sentence structure
        const sentences = text.split(/[.!?]/).filter(s => s.trim());
        const avgWordsPerSentence = text.split(' ').length / sentences.length;
        
        if (avgWordsPerSentence < 15) return Math.min(100, 80 + Math.random() * 20);
        if (avgWordsPerSentence < 25) return Math.min(100, 60 + Math.random() * 20);
        return Math.min(100, 40 + Math.random() * 20);
    }
    
    extractInsights(text) {
        // Count potential insights based on key phrases
        const insightPatterns = [
            /because/gi, /therefore/gi, /however/gi, /moreover/gi,
            /in conclusion/gi, /for example/gi, /on the other hand/gi
        ];
        
        return insightPatterns.reduce((count, pattern) => {
            return count + (text.match(pattern) || []).length;
        }, 0);
    }
}

class TickerTapeLootSystem {
    constructor() {
        this.lootDatabase = new Map();
        this.rarityWeights = {
            common: 0.6,
            uncommon: 0.25,
            rare: 0.12,
            legendary: 0.03
        };
    }
    
    generateLootFromEvent(event, reasoningQuality) {
        const rarity = this.determineRarity(reasoningQuality);
        const lootType = this.determineLootType(event);
        
        const loot = {
            id: crypto.randomBytes(8).toString('hex'),
            name: this.generateLootName(lootType, rarity),
            type: lootType,
            rarity: rarity,
            properties: this.generateLootProperties(lootType, rarity),
            generatedFrom: event,
            timestamp: Date.now()
        };
        
        this.lootDatabase.set(loot.id, loot);
        return loot;
    }
    
    determineRarity(reasoningQuality) {
        const qualityMultipliers = {
            basic: 0.5,
            good: 1.0,
            excellent: 2.0,
            genius: 4.0
        };
        
        const multiplier = qualityMultipliers[reasoningQuality] || 1.0;
        const random = Math.random() * multiplier;
        
        if (random > 3.5) return 'legendary';
        if (random > 2.5) return 'rare';
        if (random > 1.5) return 'uncommon';
        return 'common';
    }
    
    determineLootType(event) {
        const types = ['knowledge_crystal', 'reasoning_gem', 'insight_shard', 'wisdom_core', 'understanding_matrix'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    generateLootName(type, rarity) {
        const prefixes = {
            common: ['Simple', 'Basic', 'Plain'],
            uncommon: ['Enhanced', 'Refined', 'Improved'],
            rare: ['Superior', 'Pristine', 'Exceptional'],
            legendary: ['Mythical', 'Transcendent', 'Cosmic']
        };
        
        const prefix = prefixes[rarity][Math.floor(Math.random() * prefixes[rarity].length)];
        return `${prefix} ${type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
    }
    
    generateLootProperties(type, rarity) {
        const baseProperties = {
            knowledge_crystal: { intelligence: 5, clarity: 3 },
            reasoning_gem: { logic: 4, deduction: 4 },
            insight_shard: { intuition: 6, wisdom: 2 },
            wisdom_core: { experience: 8, understanding: 5 },
            understanding_matrix: { comprehension: 7, synthesis: 6 }
        };
        
        const rarityMultipliers = {
            common: 1.0,
            uncommon: 1.5,
            rare: 2.5,
            legendary: 5.0
        };
        
        const base = baseProperties[type] || { power: 1 };
        const multiplier = rarityMultipliers[rarity];
        
        const properties = {};
        for (const [key, value] of Object.entries(base)) {
            properties[key] = Math.floor(value * multiplier);
        }
        
        return properties;
    }
}

class VoiceToActionProcessor {
    constructor() {
        this.actionPatterns = new Map();
        this.initializePatterns();
    }
    
    initializePatterns() {
        this.actionPatterns.set(/build|create|make/i, 'build');
        this.actionPatterns.set(/destroy|remove|delete/i, 'destroy');
        this.actionPatterns.set(/move|go|walk|fly/i, 'move');
        this.actionPatterns.set(/talk|speak|say|tell/i, 'communicate');
        this.actionPatterns.set(/analyze|think|reason|consider/i, 'analyze');
        this.actionPatterns.set(/help|assist|guide/i, 'help');
    }
    
    async processVoiceCommand(text, context) {
        const action = this.extractAction(text);
        const parameters = this.extractParameters(text);
        
        return {
            action,
            parameters,
            confidence: this.calculateConfidence(text, action),
            suggestions: this.generateSuggestions(text, action)
        };
    }
    
    extractAction(text) {
        for (const [pattern, action] of this.actionPatterns) {
            if (pattern.test(text)) {
                return action;
            }
        }
        return 'unknown';
    }
    
    extractParameters(text) {
        // Extract colors, materials, sizes, positions, etc.
        const parameters = {};
        
        // Extract colors
        const colorMatch = text.match(/\b(red|blue|green|yellow|purple|orange|pink|black|white|gray|brown)\b/i);
        if (colorMatch) parameters.color = colorMatch[1].toLowerCase();
        
        // Extract materials
        const materialMatch = text.match(/\b(stone|wood|metal|crystal|glass|diamond|gold|silver)\b/i);
        if (materialMatch) parameters.material = materialMatch[1].toLowerCase();
        
        // Extract sizes
        const sizeMatch = text.match(/\b(tiny|small|medium|large|huge|massive)\b/i);
        if (sizeMatch) parameters.size = sizeMatch[1].toLowerCase();
        
        // Extract numbers for dimensions
        const numbers = text.match(/\b\d+\b/g);
        if (numbers) parameters.numbers = numbers.map(n => parseInt(n));
        
        return parameters;
    }
    
    calculateConfidence(text, action) {
        if (action === 'unknown') return 0.1;
        
        const wordCount = text.split(' ').length;
        const specificWords = (text.match(/\b(exactly|specifically|precisely|carefully|detailed)\b/gi) || []).length;
        
        let confidence = 0.5;
        if (wordCount > 10) confidence += 0.2;
        if (specificWords > 0) confidence += 0.3;
        
        return Math.min(1.0, confidence);
    }
    
    generateSuggestions(text, action) {
        const suggestions = [];
        
        if (action === 'build') {
            suggestions.push('Try specifying a material: "build a stone tower"');
            suggestions.push('Add dimensions: "build a 5x5 house"');
        } else if (action === 'unknown') {
            suggestions.push('Try starting with "build", "create", "move", or "analyze"');
            suggestions.push('Be specific about what you want to do');
        }
        
        return suggestions;
    }
}

class DocumentVoxelizer {
    constructor() {
        this.conversionRules = new Map();
        this.initializeConversionRules();
    }
    
    initializeConversionRules() {
        this.conversionRules.set('text', {
            material: 'text_stone',
            height: (content) => Math.min(50, Math.floor(content.length / 100)),
            width: (content) => Math.min(20, Math.floor(content.split('\n').length)),
            structure: 'library_tower'
        });
        
        this.conversionRules.set('code', {
            material: 'code_crystal',
            height: (content) => Math.min(100, content.split('\n').length),
            width: (content) => Math.min(30, Math.max(...content.split('\n').map(line => line.length)) / 4),
            structure: 'code_spire'
        });
        
        this.conversionRules.set('image', {
            material: 'pixel_blocks',
            height: 10,
            width: 'variable',
            structure: 'image_gallery'
        });
    }
    
    async convertDocument(document, position) {
        const documentType = this.detectDocumentType(document);
        const rules = this.conversionRules.get(documentType) || this.conversionRules.get('text');
        
        const structure = {
            type: documentType,
            position: position,
            voxels: [],
            metadata: {
                originalDocument: document,
                createdAt: Date.now(),
                complexity: this.calculateComplexity(document)
            }
        };
        
        // Generate voxel structure based on document content
        const voxels = this.generateVoxelsFromContent(document, rules, position);
        structure.voxels = voxels;
        
        return structure;
    }
    
    detectDocumentType(document) {
        if (document.content.includes('function') || document.content.includes('class')) return 'code';
        if (document.format && document.format.startsWith('image/')) return 'image';
        return 'text';
    }
    
    generateVoxelsFromContent(document, rules, position) {
        const voxels = [];
        const content = document.content || document;
        
        if (rules.structure === 'library_tower') {
            // Generate a tower structure for text documents
            const height = rules.height(content);
            const width = rules.width(content);
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    for (let z = 0; z < width; z++) {
                        if (x === 0 || x === width - 1 || z === 0 || z === width - 1) {
                            voxels.push({
                                position: { x: position.x + x, y: position.y + y, z: position.z + z },
                                material: rules.material,
                                content: content.charAt((y * width * width + x * width + z) % content.length)
                            });
                        }
                    }
                }
            }
        } else if (rules.structure === 'code_spire') {
            // Generate a spire structure for code documents
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
                const lineLength = Math.min(20, line.length);
                
                for (let x = 0; x < lineLength; x++) {
                    voxels.push({
                        position: { x: position.x + x, y: position.y + index, z: position.z },
                        material: rules.material,
                        content: line.charAt(x),
                        codeType: this.detectCodeType(line)
                    });
                }
            });
        }
        
        return voxels;
    }
    
    detectCodeType(line) {
        if (line.includes('function')) return 'function';
        if (line.includes('class')) return 'class';
        if (line.includes('const') || line.includes('let') || line.includes('var')) return 'variable';
        if (line.includes('//') || line.includes('/*')) return 'comment';
        return 'code';
    }
    
    calculateComplexity(document) {
        const content = document.content || document;
        const wordCount = content.split(' ').length;
        const lineCount = content.split('\n').length;
        
        if (wordCount > 1000 || lineCount > 100) return 'high';
        if (wordCount > 300 || lineCount > 30) return 'medium';
        return 'low';
    }
}

class WeatherSystem {
    constructor() {
        this.currentWeather = 'clear';
        this.weatherCycle();
    }
    
    weatherCycle() {
        setInterval(() => {
            const weathers = ['clear', 'cloudy', 'rainy', 'stormy', 'mystical'];
            this.currentWeather = weathers[Math.floor(Math.random() * weathers.length)];
        }, 300000); // Change weather every 5 minutes
    }
}

class DayNightCycle {
    constructor() {
        this.timeOfDay = 'day';
        this.dayNightCycle();
    }
    
    dayNightCycle() {
        setInterval(() => {
            this.timeOfDay = this.timeOfDay === 'day' ? 'night' : 'day';
        }, 600000); // 10 minute day/night cycle
    }
}

// Export for use
module.exports = CALReasoning3DEngine;

// Demo if run directly
if (require.main === module) {
    (async () => {
        console.log('\n=== CAL Reasoning 3D Engine Demo ===\n');
        
        const engine = new CALReasoning3DEngine({
            port: 3456,
            wsPort: 3457
        });
        
        await engine.start();
        
        console.log('\n🎮 Game Features:');
        console.log('  • Voice commands create 3D structures');
        console.log('  • CAL reasoning generates intelligent buildings');
        console.log('  • Ticker tape events become collectible loot');
        console.log('  • NPCs guide you through the world');
        console.log('  • Documents transform into explorable structures');
        
        console.log('\n🎯 Try These Commands:');
        console.log('  • "Build a crystal tower with blue lights"');
        console.log('  • "Create a reasoning laboratory for experiments"');
        console.log('  • "Analyze this conversation and show me the patterns"');
        console.log('  • "Talk to The Archivist about memory crystallization"');
        
        console.log('\n🌍 NPCs Available:');
        engine.npcs.forEach((npc, id) => {
            console.log(`  • ${npc.name} (${npc.personality}) - "${npc.currentQuest}"`);
        });
        
    })().catch(console.error);
}

console.log('🎮 CAL Reasoning 3D Engine loaded');
console.log('🗣️ Voice commands → 3D structures');
console.log('🧠 Reasoning quality → Loot rarity');
console.log('🌟 Fantasy world meets reality');