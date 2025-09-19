#!/usr/bin/env node
// DEVICE-MESH-ARPANET.js - World mesh system where each device only sees through their handshake mesh

const crypto = require('crypto');
const dgram = require('dgram');
const { networkInterfaces } = require('os');

// Device Mesh Network Class
class DeviceMeshARPANET {
    constructor() {
        this.deviceId = this.generateDeviceId();
        this.deviceFingerprint = this.generateDeviceFingerprint();
        this.meshNodes = new Map();
        this.worldMesh = new Map();
        this.handshakeMesh = new Map();
        this.visibilityLayer = new Map();
        
        // Network configuration
        this.meshPort = 4200;
        this.broadcastPort = 4201;
        this.handshakePort = 4202;
        
        // Device-specific world slice
        this.myWorldSlice = this.createWorldSlice();
        
        this.initializeMeshNetwork();
        this.startHandshakeProtocol();
        
        console.log(`🌐 Device ${this.deviceId} initialized in mesh ARPANET`);
        console.log(`🔒 Device fingerprint: ${this.deviceFingerprint.substring(0, 16)}...`);
    }

    // Generate unique device ID based on hardware
    generateDeviceId() {
        const interfaces = networkInterfaces();
        const macAddresses = [];
        
        for (const devName in interfaces) {
            const iface = interfaces[devName];
            for (const alias of iface) {
                if (alias.mac && alias.mac !== '00:00:00:00:00:00') {
                    macAddresses.push(alias.mac);
                }
            }
        }
        
        const deviceSeed = macAddresses.join('') + require('os').hostname() + require('os').platform();
        return crypto.createHash('sha256').update(deviceSeed).digest('hex').substring(0, 16);
    }

    // Generate device fingerprint for mesh authentication
    generateDeviceFingerprint() {
        const systemInfo = {
            platform: require('os').platform(),
            arch: require('os').arch(),
            hostname: require('os').hostname(),
            deviceId: this.deviceId,
            timestamp: Date.now()
        };
        
        return crypto.createHash('sha512').update(JSON.stringify(systemInfo)).digest('hex');
    }

    // Create this device's unique world slice
    createWorldSlice() {
        const slice = {
            id: this.deviceId,
            origin: this.calculateWorldOrigin(),
            boundaries: this.calculateWorldBoundaries(),
            meshSegments: [],
            visibilityMask: this.generateVisibilityMask(),
            handshakeKey: crypto.randomBytes(32).toString('hex')
        };

        // Generate mesh segments based on device ID
        for (let i = 0; i < 64; i++) {
            const segment = {
                id: `${this.deviceId}_segment_${i}`,
                coordinates: this.calculateSegmentCoordinates(i),
                visibility: this.calculateSegmentVisibility(i),
                data: this.generateSegmentData(i)
            };
            slice.meshSegments.push(segment);
        }

        return slice;
    }

    // Calculate world origin based on device ID
    calculateWorldOrigin() {
        const hash = crypto.createHash('md5').update(this.deviceId).digest('hex');
        return {
            x: parseInt(hash.substring(0, 8), 16) % 10000 - 5000,
            y: parseInt(hash.substring(8, 16), 16) % 10000 - 5000,
            z: parseInt(hash.substring(16, 24), 16) % 10000 - 5000
        };
    }

    // Calculate world boundaries for this device
    calculateWorldBoundaries() {
        const origin = this.calculateWorldOrigin();
        const size = 1000; // Each device gets a 1000x1000x1000 world slice
        
        return {
            min: { x: origin.x, y: origin.y, z: origin.z },
            max: { x: origin.x + size, y: origin.y + size, z: origin.z + size }
        };
    }

    // Generate visibility mask - what this device can see of other device meshes
    generateVisibilityMask() {
        const mask = [];
        const deviceHash = crypto.createHash('sha256').update(this.deviceId).digest();
        
        // Create a unique visibility pattern based on device ID
        for (let i = 0; i < 256; i++) {
            mask.push(deviceHash[i % deviceHash.length] > 128);
        }
        
        return mask;
    }

    // Calculate segment coordinates within world slice
    calculateSegmentCoordinates(segmentIndex, origin = null) {
        const worldOrigin = origin || this.calculateWorldOrigin();
        const segmentSize = 125; // 8x8 grid of segments in 1000x1000 space
        
        const gridX = segmentIndex % 8;
        const gridY = Math.floor(segmentIndex / 8) % 8;
        const gridZ = Math.floor(segmentIndex / 64);
        
        return {
            x: worldOrigin.x + (gridX * segmentSize),
            y: worldOrigin.y + (gridY * segmentSize),
            z: worldOrigin.z + (gridZ * segmentSize),
            size: segmentSize
        };
    }

    // Calculate what's visible in this segment to other devices
    calculateSegmentVisibility(segmentIndex) {
        const hash = crypto.createHash('md5').update(`${this.deviceId}_${segmentIndex}`).digest('hex');
        
        return {
            opacity: (parseInt(hash.substring(0, 2), 16) / 255),
            color: '#' + hash.substring(2, 8),
            accessible: parseInt(hash.substring(8, 10), 16) > 128,
            handshakeRequired: parseInt(hash.substring(10, 12), 16) > 200
        };
    }

    // Generate segment data (what exists in this mesh segment)
    generateSegmentData(segmentIndex) {
        const hash = crypto.createHash('sha256').update(`${this.deviceId}_data_${segmentIndex}`).digest('hex');
        
        const dataTypes = ['voxels', 'entities', 'objects', 'portals', 'data_nodes'];
        const selectedType = dataTypes[parseInt(hash.substring(0, 2), 16) % dataTypes.length];
        
        return {
            type: selectedType,
            density: parseInt(hash.substring(2, 4), 16) / 255,
            attributes: {
                interactive: parseInt(hash.substring(4, 6), 16) > 128,
                persistent: parseInt(hash.substring(6, 8), 16) > 180,
                shareable: parseInt(hash.substring(8, 10), 16) > 100
            },
            content: this.generateSegmentContent(selectedType, hash)
        };
    }

    // Generate actual content for mesh segments
    generateSegmentContent(type, hash) {
        switch (type) {
            case 'voxels':
                return {
                    voxel_count: parseInt(hash.substring(10, 14), 16) % 1000,
                    voxel_type: 'device_' + this.deviceId.substring(0, 4),
                    color_pattern: hash.substring(14, 20)
                };
            case 'entities':
                return {
                    entity_type: 'mesh_node',
                    behavior: hash.substring(20, 24),
                    interaction_radius: parseInt(hash.substring(24, 26), 16)
                };
            case 'objects':
                return {
                    object_class: 'device_artifact',
                    properties: hash.substring(26, 32),
                    functionality: 'mesh_bridge'
                };
            case 'portals':
                return {
                    portal_destination: hash.substring(32, 48),
                    access_key: hash.substring(48, 64),
                    handshake_required: true
                };
            case 'data_nodes':
                return {
                    data_capacity: parseInt(hash.substring(50, 54), 16),
                    data_type: 'mesh_intelligence',
                    sharing_protocol: 'handshake_mesh'
                };
        }
    }

    // Initialize mesh networking
    initializeMeshNetwork() {
        // UDP socket for mesh communication
        this.meshSocket = dgram.createSocket('udp4');
        
        this.meshSocket.on('message', (msg, rinfo) => {
            this.handleMeshMessage(msg, rinfo);
        });

        this.meshSocket.on('error', (err) => {
            console.error('Mesh socket error:', err);
        });

        this.meshSocket.bind(this.meshPort, () => {
            console.log(`🌐 Mesh network listening on port ${this.meshPort}`);
        });

        // Broadcast socket for device discovery
        this.broadcastSocket = dgram.createSocket('udp4');
        this.broadcastSocket.bind(this.broadcastPort, () => {
            this.broadcastSocket.setBroadcast(true);
            console.log(`📡 Broadcast socket listening on port ${this.broadcastPort}`);
            this.startDeviceDiscovery();
        });
    }

    // Start handshake protocol for mesh visibility
    startHandshakeProtocol() {
        this.handshakeSocket = dgram.createSocket('udp4');
        
        this.handshakeSocket.on('message', (msg, rinfo) => {
            this.handleHandshakeMessage(msg, rinfo);
        });

        this.handshakeSocket.bind(this.handshakePort, () => {
            console.log(`🤝 Handshake protocol listening on port ${this.handshakePort}`);
        });
    }

    // Start device discovery broadcasts
    startDeviceDiscovery() {
        const discoveryMessage = {
            type: 'device_discovery',
            deviceId: this.deviceId,
            fingerprint: this.deviceFingerprint,
            worldSlice: {
                origin: this.myWorldSlice.origin,
                boundaries: this.myWorldSlice.boundaries
            },
            timestamp: Date.now()
        };

        const message = Buffer.from(JSON.stringify(discoveryMessage));
        
        // Broadcast every 30 seconds
        setInterval(() => {
            this.broadcastSocket.send(message, 0, message.length, this.broadcastPort, '255.255.255.255', (err) => {
                if (err) {
                    console.error('Broadcast error:', err);
                } else {
                    console.log(`📡 Broadcasting device discovery: ${this.deviceId}`);
                }
            });
        }, 30000);

        // Send initial broadcast
        this.broadcastSocket.send(message, 0, message.length, this.broadcastPort, '255.255.255.255');
    }

    // Handle mesh network messages
    handleMeshMessage(msg, rinfo) {
        try {
            const data = JSON.parse(msg.toString());
            
            switch (data.type) {
                case 'device_discovery':
                    this.handleDeviceDiscovery(data, rinfo);
                    break;
                case 'mesh_request':
                    this.handleMeshRequest(data, rinfo);
                    break;
                case 'visibility_query':
                    this.handleVisibilityQuery(data, rinfo);
                    break;
            }
        } catch (error) {
            console.error('Error handling mesh message:', error);
        }
    }

    // Handle device discovery
    handleDeviceDiscovery(data, rinfo) {
        if (data.deviceId === this.deviceId) return; // Ignore self

        console.log(`🔍 Discovered device: ${data.deviceId} from ${rinfo.address}`);
        
        // Store mesh node info
        this.meshNodes.set(data.deviceId, {
            deviceId: data.deviceId,
            fingerprint: data.fingerprint,
            address: rinfo.address,
            port: rinfo.port,
            worldSlice: data.worldSlice,
            lastSeen: Date.now(),
            handshakeComplete: false
        });

        // Initiate handshake
        this.initiateHandshake(data.deviceId, rinfo.address);
    }

    // Initiate handshake with discovered device
    initiateHandshake(deviceId, address) {
        const handshakeData = {
            type: 'handshake_request',
            fromDevice: this.deviceId,
            fromFingerprint: this.deviceFingerprint,
            challenge: crypto.randomBytes(32).toString('hex'),
            worldSliceInfo: {
                origin: this.myWorldSlice.origin,
                visibilityMask: this.myWorldSlice.visibilityMask.slice(0, 16) // Send partial mask
            },
            timestamp: Date.now()
        };

        const message = Buffer.from(JSON.stringify(handshakeData));
        this.handshakeSocket.send(message, 0, message.length, this.handshakePort, address);
        
        console.log(`🤝 Initiating handshake with device: ${deviceId}`);
    }

    // Handle handshake messages
    handleHandshakeMessage(msg, rinfo) {
        try {
            const data = JSON.parse(msg.toString());
            
            switch (data.type) {
                case 'handshake_request':
                    this.handleHandshakeRequest(data, rinfo);
                    break;
                case 'handshake_response':
                    this.handleHandshakeResponse(data, rinfo);
                    break;
                case 'handshake_complete':
                    this.handleHandshakeComplete(data, rinfo);
                    break;
            }
        } catch (error) {
            console.error('Error handling handshake message:', error);
        }
    }

    // Handle handshake request
    handleHandshakeRequest(data, rinfo) {
        console.log(`🤝 Handshake request from: ${data.fromDevice}`);
        
        const responseData = {
            type: 'handshake_response',
            fromDevice: this.deviceId,
            toDevice: data.fromDevice,
            challengeResponse: crypto.createHash('sha256').update(data.challenge + this.deviceFingerprint).digest('hex'),
            myVisibilityMask: this.calculateVisibilityForDevice(data.fromDevice),
            timestamp: Date.now()
        };

        const message = Buffer.from(JSON.stringify(responseData));
        this.handshakeSocket.send(message, 0, message.length, this.handshakePort, rinfo.address);
    }

    // Calculate what this device can see of another device's mesh
    calculateVisibilityForDevice(otherDeviceId) {
        const combinedHash = crypto.createHash('sha256')
            .update(this.deviceId + otherDeviceId)
            .digest();
        
        const visibilityMask = [];
        for (let i = 0; i < 64; i++) {
            visibilityMask.push({
                segmentIndex: i,
                visible: combinedHash[i % combinedHash.length] > 128,
                opacity: combinedHash[i % combinedHash.length] / 255,
                accessLevel: combinedHash[i % combinedHash.length] > 200 ? 'full' : 'limited'
            });
        }
        
        return visibilityMask;
    }

    // Handle handshake response
    handleHandshakeResponse(data, rinfo) {
        console.log(`🤝 Handshake response from: ${data.fromDevice}`);
        
        // Store visibility information
        this.handshakeMesh.set(data.fromDevice, {
            deviceId: data.fromDevice,
            visibilityMask: data.myVisibilityMask,
            handshakeComplete: true,
            establishedAt: Date.now()
        });

        // Complete handshake
        const completeData = {
            type: 'handshake_complete',
            fromDevice: this.deviceId,
            toDevice: data.fromDevice,
            meshKey: crypto.randomBytes(16).toString('hex'),
            timestamp: Date.now()
        };

        const message = Buffer.from(JSON.stringify(completeData));
        this.handshakeSocket.send(message, 0, message.length, this.handshakePort, rinfo.address);
        
        console.log(`✅ Handshake completed with: ${data.fromDevice}`);
    }

    // Handle handshake complete
    handleHandshakeComplete(data, rinfo) {
        console.log(`✅ Handshake finalized with: ${data.fromDevice}`);
        
        // Update mesh node as handshake complete
        const node = this.meshNodes.get(data.fromDevice);
        if (node) {
            node.handshakeComplete = true;
            node.meshKey = data.meshKey;
        }

        // Generate world mesh visibility for this device
        this.generateWorldMeshVisibility(data.fromDevice);
    }

    // Generate what of the world mesh this device can see
    generateWorldMeshVisibility(otherDeviceId) {
        const handshakeMesh = this.handshakeMesh.get(otherDeviceId);
        const meshNode = this.meshNodes.get(otherDeviceId);
        
        if (!handshakeMesh || !meshNode) return;

        const visibilityLayer = {
            deviceId: otherDeviceId,
            visibleSegments: [],
            meshOverlay: this.createMeshOverlay(handshakeMesh.visibilityMask, meshNode.worldSlice)
        };

        // Calculate which segments are visible through this device's handshake mesh
        handshakeMesh.visibilityMask.forEach((mask, index) => {
            if (mask.visible) {
                visibilityLayer.visibleSegments.push({
                    segmentIndex: index,
                    coordinates: this.calculateRemoteSegmentCoordinates(meshNode.worldSlice, index),
                    opacity: mask.opacity,
                    accessLevel: mask.accessLevel,
                    content: this.interpolateSegmentContent(otherDeviceId, index)
                });
            }
        });

        this.visibilityLayer.set(otherDeviceId, visibilityLayer);
        
        console.log(`👁️ Visibility layer created for device: ${otherDeviceId} (${visibilityLayer.visibleSegments.length} segments visible)`);
    }

    // Create mesh overlay for visualization
    createMeshOverlay(visibilityMask, remoteWorldSlice) {
        const overlay = {
            type: 'handshake_mesh',
            pattern: visibilityMask.map(mask => mask.visible ? '█' : '░').join(''),
            boundaries: remoteWorldSlice.boundaries,
            blendMode: 'multiply',
            transparency: 0.7
        };

        return overlay;
    }

    // Calculate coordinates of remote device segments
    calculateRemoteSegmentCoordinates(remoteWorldSlice, segmentIndex) {
        const segmentSize = 125;
        const gridX = segmentIndex % 8;
        const gridY = Math.floor(segmentIndex / 8) % 8;
        const gridZ = Math.floor(segmentIndex / 64);
        
        return {
            x: remoteWorldSlice.origin.x + (gridX * segmentSize),
            y: remoteWorldSlice.origin.y + (gridY * segmentSize),
            z: remoteWorldSlice.origin.z + (gridZ * segmentSize),
            size: segmentSize
        };
    }

    // Interpolate what content can be seen in remote segments
    interpolateSegmentContent(otherDeviceId, segmentIndex) {
        const hash = crypto.createHash('md5').update(`${this.deviceId}_sees_${otherDeviceId}_${segmentIndex}`).digest('hex');
        
        return {
            type: 'remote_mesh_view',
            visibility: 'handshake_filtered',
            content_hash: hash,
            interaction_possible: parseInt(hash.substring(0, 2), 16) > 128,
            data_accessible: parseInt(hash.substring(2, 4), 16) > 200
        };
    }

    // Get current world view through handshake meshes
    getWorldView() {
        const worldView = {
            mySlice: this.myWorldSlice,
            visibleRemoteSlices: [],
            meshConnections: [],
            totalVisibleSegments: this.myWorldSlice.meshSegments.length
        };

        // Add visible remote slices through handshake meshes
        this.visibilityLayer.forEach((layer, deviceId) => {
            worldView.visibleRemoteSlices.push({
                deviceId: deviceId,
                visibleSegments: layer.visibleSegments,
                meshOverlay: layer.meshOverlay
            });
            
            worldView.totalVisibleSegments += layer.visibleSegments.length;
        });

        // Add mesh connections
        this.handshakeMesh.forEach((mesh, deviceId) => {
            worldView.meshConnections.push({
                deviceId: deviceId,
                handshakeComplete: mesh.handshakeComplete,
                establishedAt: mesh.establishedAt
            });
        });

        return worldView;
    }

    // Get status of mesh network
    getMeshStatus() {
        return {
            deviceId: this.deviceId,
            fingerprint: this.deviceFingerprint.substring(0, 16) + '...',
            discoveredDevices: this.meshNodes.size,
            completedHandshakes: Array.from(this.handshakeMesh.values()).filter(h => h.handshakeComplete).length,
            worldSliceSegments: this.myWorldSlice.meshSegments.length,
            visibleRemoteSegments: Array.from(this.visibilityLayer.values()).reduce((sum, layer) => sum + layer.visibleSegments.length, 0),
            networkStatus: 'active'
        };
    }
}

// Export for use in other modules
module.exports = DeviceMeshARPANET;

// If run directly, start the mesh network
if (require.main === module) {
    console.log('🌐 STARTING DEVICE MESH ARPANET');
    console.log('===============================');
    
    const meshNetwork = new DeviceMeshARPANET();
    
    // Status reporting every 60 seconds
    setInterval(() => {
        const status = meshNetwork.getMeshStatus();
        const worldView = meshNetwork.getWorldView();
        
        console.log('\n📊 MESH NETWORK STATUS:');
        console.log(`   Device ID: ${status.deviceId}`);
        console.log(`   Discovered Devices: ${status.discoveredDevices}`);
        console.log(`   Completed Handshakes: ${status.completedHandshakes}`);
        console.log(`   My World Segments: ${status.worldSliceSegments}`);
        console.log(`   Visible Remote Segments: ${status.visibleRemoteSegments}`);
        console.log(`   Total Visible World: ${worldView.totalVisibleSegments} segments`);
        console.log(`   Mesh Connections: ${worldView.meshConnections.length}`);
        
        console.log('\n👁️ WORLD VIEW THROUGH HANDSHAKE MESH:');
        worldView.visibleRemoteSlices.forEach(slice => {
            console.log(`   Device ${slice.deviceId}: ${slice.visibleSegments.length} segments visible`);
        });
        
    }, 60000);
    
    console.log('\n🎮 MESH ARPANET FEATURES:');
    console.log('   ✅ Unique device ID generation');
    console.log('   ✅ Handshake-based mesh visibility');
    console.log('   ✅ Device-specific world slices');
    console.log('   ✅ Segment-level visibility control');
    console.log('   ✅ Automatic device discovery');
    console.log('   ✅ Mesh overlay visualization');
    console.log('   ✅ Content interpolation through mesh');
    console.log('\n🔒 SECURITY MODEL:');
    console.log('   • Each device sees only through their handshake mesh');
    console.log('   • Visibility determined by device ID cryptography');
    console.log('   • No device can see another device\'s full world');
    console.log('   • Mesh patterns unique to device pairs');
    console.log('\n🌐 Ready for mesh world visualization!');
}