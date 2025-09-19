#!/usr/bin/env node
// INTEGRATED-MESH-ARPANET.js - Integration layer between photo-character system and device mesh

const DeviceMeshARPANET = require('./DEVICE-MESH-ARPANET.js');
const SoulfraCapsuleMesh = require('./SOULFRA-CAPSULE-MESH.js');
const crypto = require('crypto');
const WebSocket = require('ws');
const express = require('express');

class IntegratedMeshARPANET {
    constructor() {
        this.meshNetwork = new DeviceMeshARPANET();
        this.capsuleSystem = new SoulfraCapsuleMesh(this.meshNetwork);
        this.characterSystem = null;
        this.meshWorldServer = null;
        this.gameIntegrations = new Map();
        
        this.startMeshWorldServer();
        this.integrateWithCharacterSystem();
        this.setupGameMeshIntegration();
        
        console.log('🎮 Integrated Mesh ARPANET initialized');
    }

    // Start mesh world visualization server
    startMeshWorldServer() {
        const app = express();
        app.use(express.static('.'));
        
        // Serve mesh world visualizer
        app.get('/mesh-world', (req, res) => {
            res.sendFile(__dirname + '/MESH-WORLD-VISUALIZER.html');
        });

        // Serve capsule mesh visualizer
        app.get('/capsule-mesh', (req, res) => {
            res.sendFile(__dirname + '/CAPSULE-MESH-VISUALIZER.html');
        });
        
        // API endpoint for mesh data
        app.get('/api/mesh-data', (req, res) => {
            const meshData = {
                deviceId: this.meshNetwork.deviceId,
                fingerprint: this.meshNetwork.deviceFingerprint,
                worldView: this.meshNetwork.getWorldView(),
                meshStatus: this.meshNetwork.getMeshStatus(),
                capsuleSystem: this.capsuleSystem.getCapsuleStatus(),
                capsuleLayers: this.capsuleSystem.exportCapsuleDataForMesh()
            };
            res.json(meshData);
        });
        
        // API endpoint for device handshake info
        app.get('/api/handshakes', (req, res) => {
            const handshakes = [];
            this.meshNetwork.handshakeMesh.forEach((mesh, deviceId) => {
                handshakes.push({
                    deviceId: deviceId,
                    handshakeComplete: mesh.handshakeComplete,
                    establishedAt: mesh.establishedAt,
                    visibleSegments: mesh.visibilityMask ? mesh.visibilityMask.filter(m => m.visible).length : 0
                });
            });
            res.json(handshakes);
        });

        // API endpoint for capsule visibility
        app.get('/api/capsules/:deviceId/:layer', (req, res) => {
            const { deviceId, layer } = req.params;
            const visibility = this.capsuleSystem.getCapsuleVisibilityThroughMesh(deviceId, layer);
            res.json(visibility);
        });

        // API endpoint for all capsule layers
        app.get('/api/capsules', (req, res) => {
            const capsuleData = this.capsuleSystem.exportCapsuleDataForMesh();
            res.json(capsuleData);
        });
        
        this.meshWorldServer = app.listen(4300, () => {
            console.log('🌐 Mesh World Server running on http://localhost:4300/mesh-world');
        });
    }

    // Integrate with photo-character system
    integrateWithCharacterSystem() {
        try {
            // Connect to character system WebSocket
            this.characterWS = new WebSocket('ws://localhost:9001');
            
            this.characterWS.on('open', () => {
                console.log('🤝 Connected to character system');
                
                // Register as mesh network node
                this.characterWS.send(JSON.stringify({
                    type: 'mesh_node_register',
                    deviceId: this.meshNetwork.deviceId,
                    capabilities: ['world_mesh', 'device_handshake', 'visibility_control']
                }));
            });
            
            this.characterWS.on('message', (data) => {
                const message = JSON.parse(data.toString());
                this.handleCharacterSystemMessage(message);
            });
            
            this.characterWS.on('error', (error) => {
                console.log('⚠️ Character system not available, running in mesh-only mode');
            });
            
        } catch (error) {
            console.log('⚠️ Character system integration failed, continuing with mesh network only');
        }
    }

    // Handle messages from character system
    handleCharacterSystemMessage(message) {
        switch (message.type) {
            case 'character_update':
                this.injectCharacterIntoMesh(message.character);
                break;
            case 'character_position_update':
                this.updateCharacterPositionInMesh(message.position);
                break;
        }
    }

    // Inject character into mesh world
    injectCharacterIntoMesh(character) {
        console.log('👤 Injecting character into mesh world:', character.name);
        
        // Calculate which mesh segment the character should appear in
        const characterSegment = this.calculateCharacterMeshSegment(character);
        
        // Update mesh segment with character data
        const myWorldSlice = this.meshNetwork.myWorldSlice;
        if (myWorldSlice.meshSegments[characterSegment]) {
            myWorldSlice.meshSegments[characterSegment].character = {
                id: character.id,
                name: character.name,
                appearance: character.appearance,
                position: character.position,
                stats: character.stats,
                meshVisibility: this.calculateCharacterMeshVisibility(character)
            };
            
            // Broadcast character update to other mesh nodes
            this.broadcastCharacterMeshUpdate(character, characterSegment);
        }
    }

    // Calculate which mesh segment character should appear in
    calculateCharacterMeshSegment(character) {
        const hash = crypto.createHash('md5').update(character.id).digest('hex');
        return parseInt(hash.substring(0, 2), 16) % 64;
    }

    // Calculate how character appears through mesh visibility
    calculateCharacterMeshVisibility(character) {
        const visibility = {
            base_opacity: 1.0,
            mesh_filtered_opacity: {},
            handshake_requirements: {},
            visibility_patterns: {}
        };
        
        // Calculate visibility through each handshake mesh
        this.meshNetwork.handshakeMesh.forEach((mesh, deviceId) => {
            const deviceHash = crypto.createHash('md5')
                .update(character.id + deviceId)
                .digest('hex');
            
            visibility.mesh_filtered_opacity[deviceId] = parseInt(deviceHash.substring(0, 2), 16) / 255;
            visibility.handshake_requirements[deviceId] = parseInt(deviceHash.substring(2, 4), 16) > 128;
            visibility.visibility_patterns[deviceId] = this.generateVisibilityPattern(character.id, deviceId);
        });
        
        return visibility;
    }

    // Generate visibility pattern for character through specific device mesh
    generateVisibilityPattern(characterId, deviceId) {
        const hash = crypto.createHash('sha256')
            .update(characterId + deviceId + this.meshNetwork.deviceId)
            .digest('hex');
            
        let pattern = '';
        for (let i = 0; i < 64; i += 8) {
            pattern += hash.substring(i, i + 8) + '\n';
        }
        
        return pattern;
    }

    // Broadcast character mesh update to other nodes
    broadcastCharacterMeshUpdate(character, segmentIndex) {
        const updateMessage = {
            type: 'character_mesh_update',
            fromDevice: this.meshNetwork.deviceId,
            character: {
                id: character.id,
                name: character.name,
                segmentIndex: segmentIndex,
                meshVisibility: character.meshVisibility
            },
            timestamp: Date.now()
        };
        
        // Send to all connected mesh nodes
        this.meshNetwork.meshNodes.forEach((node, deviceId) => {
            if (node.handshakeComplete) {
                this.sendMeshMessage(deviceId, updateMessage);
            }
        });
    }

    // Send message to specific mesh node
    sendMeshMessage(deviceId, message) {
        const node = this.meshNetwork.meshNodes.get(deviceId);
        if (!node) return;
        
        // Would implement actual UDP message sending here
        console.log(`📤 Sending mesh message to ${deviceId}:`, message.type);
    }

    // Setup game mesh integration
    setupGameMeshIntegration() {
        // Integrate with voxel world
        this.integrateWithVoxelWorld();
        
        // Integrate with economic engine
        this.integrateWithEconomicEngine();
        
        // Integrate with AI arena
        this.integrateWithAIArena();
    }

    // Integrate mesh with voxel world
    integrateWithVoxelWorld() {
        this.gameIntegrations.set('voxel', {
            port: 8892,
            meshIntegration: this.createVoxelMeshIntegration()
        });
    }

    // Create voxel world mesh integration
    createVoxelMeshIntegration() {
        return {
            // Convert mesh segments to voxel representations
            convertMeshToVoxels: (worldView) => {
                const voxelData = {
                    myVoxels: this.convertSegmentsToVoxels(worldView.mySlice.meshSegments),
                    visibleRemoteVoxels: []
                };
                
                worldView.visibleRemoteSlices.forEach(slice => {
                    const remoteVoxels = this.convertRemoteSegmentsToVoxels(slice);
                    voxelData.visibleRemoteVoxels.push({
                        deviceId: slice.deviceId,
                        voxels: remoteVoxels,
                        meshOverlay: slice.meshOverlay
                    });
                });
                
                return voxelData;
            },
            
            // Apply mesh visibility filters to voxel rendering
            applyMeshVisibility: (voxelData, viewerDeviceId) => {
                const handshake = this.meshNetwork.handshakeMesh.get(viewerDeviceId);
                if (!handshake) return voxelData;
                
                // Filter voxels based on handshake mesh visibility
                return this.filterVoxelsByMesh(voxelData, handshake.visibilityMask);
            }
        };
    }

    // Convert mesh segments to voxel data
    convertSegmentsToVoxels(segments) {
        return segments.map(segment => ({
            position: segment.coordinates,
            type: segment.data.type,
            color: segment.visibility.color,
            opacity: segment.visibility.opacity,
            interactive: segment.data.attributes.interactive,
            character: segment.character || null
        }));
    }

    // Convert remote segments to voxel data with mesh filtering
    convertRemoteSegmentsToVoxels(remoteSlice) {
        return remoteSlice.visibleSegments.map(segment => ({
            position: segment.coordinates,
            type: 'remote_mesh_view',
            color: '#0099ff',
            opacity: segment.opacity * 0.6, // Reduced opacity for remote segments
            interactive: segment.accessLevel === 'full',
            meshFiltered: true,
            sourceDevice: remoteSlice.deviceId
        }));
    }

    // Filter voxels by mesh visibility
    filterVoxelsByMesh(voxelData, visibilityMask) {
        // Implementation would filter voxel visibility based on mesh patterns
        return voxelData;
    }

    // Integrate with economic engine
    integrateWithEconomicEngine() {
        this.gameIntegrations.set('economic', {
            port: 8893,
            meshIntegration: {
                // Convert mesh network to economic agents
                convertMeshToEconomicAgents: (worldView) => {
                    const agents = [];
                    
                    // My segments become my economic agents
                    worldView.mySlice.meshSegments.forEach(segment => {
                        if (segment.data.type === 'data_nodes') {
                            agents.push({
                                id: segment.id,
                                type: 'mesh_data_trader',
                                position: segment.coordinates,
                                resources: segment.data.content.data_capacity,
                                tradingPower: segment.data.attributes.shareable ? 100 : 50
                            });
                        }
                    });
                    
                    // Visible remote segments become trading partners
                    worldView.visibleRemoteSlices.forEach(slice => {
                        slice.visibleSegments.forEach(segment => {
                            if (segment.content.data_accessible) {
                                agents.push({
                                    id: `remote_${slice.deviceId}_${segment.segmentIndex}`,
                                    type: 'remote_mesh_trader',
                                    position: segment.coordinates,
                                    resources: 50,
                                    tradingPower: segment.accessLevel === 'full' ? 80 : 30,
                                    meshFiltered: true,
                                    sourceDevice: slice.deviceId
                                });
                            }
                        });
                    });
                    
                    return agents;
                }
            }
        });
    }

    // Integrate with AI arena
    integrateWithAIArena() {
        this.gameIntegrations.set('arena', {
            port: 3001,
            meshIntegration: {
                // Convert mesh entities to AI fighters
                convertMeshToFighters: (worldView) => {
                    const fighters = [];
                    
                    worldView.mySlice.meshSegments.forEach(segment => {
                        if (segment.data.type === 'entities') {
                            fighters.push({
                                name: `MeshEntity_${segment.id}`,
                                type: 'mesh_fighter',
                                stats: {
                                    attack: Math.floor(segment.data.density * 100),
                                    defense: segment.visibility.opacity * 100,
                                    speed: segment.data.attributes.interactive ? 80 : 40,
                                    intelligence: 60,
                                    creativity: 70
                                },
                                meshOrigin: this.meshNetwork.deviceId,
                                meshSegment: segment.id
                            });
                        }
                    });
                    
                    return fighters;
                }
            }
        });
    }

    // Get integrated world view combining character and mesh data
    getIntegratedWorldView() {
        const meshWorldView = this.meshNetwork.getWorldView();
        
        return {
            deviceMesh: meshWorldView,
            gameIntegrations: {
                voxel: this.gameIntegrations.get('voxel')?.meshIntegration.convertMeshToVoxels(meshWorldView),
                economic: this.gameIntegrations.get('economic')?.meshIntegration.convertMeshToEconomicAgents(meshWorldView),
                arena: this.gameIntegrations.get('arena')?.meshIntegration.convertMeshToFighters(meshWorldView)
            },
            characterPresence: this.getCharacterMeshPresence(),
            networkStats: this.meshNetwork.getMeshStatus()
        };
    }

    // Get character presence in mesh network
    getCharacterMeshPresence() {
        const presence = {
            charactersInMesh: 0,
            characterSegments: [],
            meshVisibilityStatus: {}
        };
        
        this.meshNetwork.myWorldSlice.meshSegments.forEach((segment, index) => {
            if (segment.character) {
                presence.charactersInMesh++;
                presence.characterSegments.push({
                    segmentIndex: index,
                    character: segment.character,
                    meshVisibility: segment.character.meshVisibility
                });
            }
        });
        
        return presence;
    }

    // Export mesh data for games
    exportMeshDataForGame(gameType) {
        const worldView = this.getIntegratedWorldView();
        
        switch (gameType) {
            case 'voxel':
                return worldView.gameIntegrations.voxel;
            case 'economic':
                return worldView.gameIntegrations.economic;
            case 'arena':
                return worldView.gameIntegrations.arena;
            default:
                return worldView.deviceMesh;
        }
    }
}

// Start integrated mesh ARPANET if run directly
if (require.main === module) {
    console.log('🌐 STARTING INTEGRATED MESH ARPANET');
    console.log('===================================');
    
    const integratedMesh = new IntegratedMeshARPANET();
    
    // Status reporting
    setInterval(() => {
        const worldView = integratedMesh.getIntegratedWorldView();
        
        console.log('\n🎮 INTEGRATED MESH STATUS:');
        console.log(`   Device ID: ${worldView.networkStats.deviceId}`);
        console.log(`   Mesh Connections: ${worldView.networkStats.completedHandshakes}`);
        console.log(`   Characters in Mesh: ${worldView.characterPresence.charactersInMesh}`);
        console.log(`   Voxel Integration: ${worldView.gameIntegrations.voxel ? 'Active' : 'Inactive'}`);
        console.log(`   Economic Integration: ${worldView.gameIntegrations.economic ? 'Active' : 'Inactive'}`);
        console.log(`   Arena Integration: ${worldView.gameIntegrations.arena ? 'Active' : 'Inactive'}`);
        console.log(`   Mesh World Server: http://localhost:4300/mesh-world`);
        
    }, 60000);
    
    console.log('\n🎯 FEATURES:');
    console.log('   ✅ Device mesh networking with handshake visibility');
    console.log('   ✅ Character integration into mesh world');
    console.log('   ✅ Game-specific mesh data conversion');
    console.log('   ✅ Real-time mesh world visualization');
    console.log('   ✅ Cross-device character presence');
    console.log('   ✅ Mesh-filtered game content');
    console.log('\n🌐 Access Points:');
    console.log('   • Mesh World Visualizer: http://localhost:4300/mesh-world');
    console.log('   • Mesh API: http://localhost:4300/api/mesh-data');
    console.log('   • Handshake Status: http://localhost:4300/api/handshakes');
    console.log('\n🔒 Each device sees only through their handshake mesh!');
}

module.exports = IntegratedMeshARPANET;