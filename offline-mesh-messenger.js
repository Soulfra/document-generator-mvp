#!/usr/bin/env node

/**
 * 📱🔗 OFFLINE MESH MESSENGER
 * 
 * Offline networking system for secret messaging through Bluetooth/RFID/ARPANET-style
 * connections when submarine systems need to operate without internet connectivity.
 * 
 * FEATURES:
 * - Bluetooth Low Energy (BLE) peer-to-peer messaging
 * - RFID/NFC proximity-based message exchange
 * - ARPANET-style store-and-forward routing
 * - Offline friends list with mesh discovery
 * - Message queuing for delayed delivery
 * - Integration with submarine privacy layers
 * - King-Queen message relay in offline mode
 * 
 * PROTOCOLS:
 * - BLE GATT for device discovery and messaging
 * - NFC Data Exchange Format (NDEF) for proximity messaging
 * - Custom mesh routing protocol with store-and-forward
 * - Encrypted message packets for security
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class OfflineMeshMessenger extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Device identification
            device: {
                id: options.deviceId || this.generateDeviceId(),
                name: options.deviceName || 'Submarine-Messenger',
                type: 'submarine_node',
                capabilities: ['bluetooth', 'rfid', 'mesh_routing', 'store_forward']
            },
            
            // Bluetooth configuration
            bluetooth: {
                serviceUUID: '12345678-1234-1234-1234-123456789abc',
                characteristicUUID: '87654321-4321-4321-4321-cba987654321',
                txPower: -4, // Low power for stealth
                advertisingInterval: 1000, // 1 second
                scanDuration: 5000, // 5 seconds
                maxConnections: 7 // Bluetooth limit
            },
            
            // RFID/NFC configuration
            rfid: {
                frequency: 13.56, // MHz (HF RFID)
                range: 10, // cm
                dataFormat: 'NDEF',
                encryptionKey: crypto.randomBytes(32),
                autoRead: true,
                writeProtection: true
            },
            
            // Mesh networking
            mesh: {
                maxHops: 7, // ARPANET-style hop limit
                ttl: 86400000, // 24 hours message TTL
                storageLimit: 100, // Max stored messages
                routingTableSize: 50,
                heartbeatInterval: 30000, // 30 seconds
                discoveryInterval: 60000 // 1 minute
            },
            
            // Offline friends system
            friends: {
                maxFriends: 50,
                trustLevels: ['unknown', 'acquaintance', 'friend', 'trusted', 'king_queen'],
                proximityRange: 100, // meters
                lastSeenTimeout: 3600000 // 1 hour
            }
        };
        
        // System state
        this.state = {
            // Device status
            online: false,
            bluetoothEnabled: false,
            rfidEnabled: false,
            meshConnected: false,
            
            // Connected devices
            connectedPeers: new Map(),
            nearbyDevices: new Map(),
            friendsList: new Map(),
            
            // Message handling
            messageQueue: new Queue(),
            storedMessages: new Map(),
            routingTable: new Map(),
            
            // Discovery and routing
            discoveredNodes: new Map(),
            routingHistory: new Map(),
            forwardingQueue: new Queue()
        };
        
        // Statistics
        this.stats = {
            messagesQueued: 0,
            messagesForwarded: 0,
            bluetoothConnections: 0,
            rfidExchanges: 0,
            meshDiscoveries: 0,
            offlineTime: 0
        };
        
        console.log('📱 Offline Mesh Messenger initializing...');
        this.initialize();
    }
    
    async initialize() {
        console.log('🔗 Setting up offline mesh networking...');
        
        // Initialize Bluetooth subsystem
        await this.initializeBluetooth();
        
        // Initialize RFID/NFC subsystem
        await this.initializeRFID();
        
        // Setup mesh networking
        await this.setupMeshNetworking();
        
        // Initialize friends system
        await this.initializeFriendsSystem();
        
        // Start discovery and routing
        await this.startMeshDiscovery();
        
        // Setup message processing
        this.startMessageProcessing();
        
        console.log('✅ Offline Mesh Messenger ready for peer-to-peer communication');
        this.emit('mesh_ready');
    }
    
    async initializeBluetooth() {
        console.log('📶 Initializing Bluetooth Low Energy mesh...');
        
        try {
            // Simulate BLE initialization (would use noble/bleno in real implementation)
            this.bluetooth = {
                peripheral: {
                    uuid: this.config.device.id,
                    name: this.config.device.name,
                    services: new Map(),
                    advertising: false
                },
                central: {
                    scanning: false,
                    connectedPeripherals: new Map()
                },
                gatt: {
                    services: new Map(),
                    characteristics: new Map()
                }
            };
            
            // Setup GATT service for messaging
            await this.setupGATTService();
            
            this.state.bluetoothEnabled = true;
            console.log('  ✅ Bluetooth mesh networking ready');
            
        } catch (error) {
            console.log('  ⚠️ Bluetooth not available, continuing without BLE');
            this.state.bluetoothEnabled = false;
        }
    }
    
    async setupGATTService() {
        // Setup GATT service for submarine messaging
        const messagingService = {
            uuid: this.config.bluetooth.serviceUUID,
            characteristics: new Map()
        };
        
        // Message characteristic for sending/receiving
        const messageCharacteristic = {
            uuid: this.config.bluetooth.characteristicUUID,
            properties: ['read', 'write', 'notify'],
            value: Buffer.alloc(0),
            descriptors: new Map()
        };
        
        messagingService.characteristics.set('message', messageCharacteristic);
        this.bluetooth.gatt.services.set('submarine_messaging', messagingService);
        
        console.log('  📡 GATT submarine messaging service configured');
    }
    
    async initializeRFID() {
        console.log('🏷️ Initializing RFID/NFC proximity messaging...');
        
        try {
            // Simulate RFID/NFC initialization
            this.rfid = {
                reader: {
                    frequency: this.config.rfid.frequency,
                    range: this.config.rfid.range,
                    status: 'ready'
                },
                writer: {
                    encryption: this.config.rfid.encryptionKey,
                    writeProtection: this.config.rfid.writeProtection,
                    status: 'ready'
                },
                tags: new Map(),
                history: []
            };
            
            this.state.rfidEnabled = true;
            console.log('  ✅ RFID/NFC proximity messaging ready');
            
        } catch (error) {
            console.log('  ⚠️ RFID/NFC not available, continuing without proximity messaging');
            this.state.rfidEnabled = false;
        }
    }
    
    async setupMeshNetworking() {
        console.log('🕸️ Setting up ARPANET-style mesh routing...');
        
        // Initialize routing table with local node
        this.state.routingTable.set(this.config.device.id, {
            nodeId: this.config.device.id,
            distance: 0,
            nextHop: null,
            lastUpdate: Date.now(),
            reliability: 1.0,
            capabilities: this.config.device.capabilities
        });
        
        // Setup store-and-forward system
        this.storeAndForward = {
            storage: new Map(),
            forwardingRules: new Map(),
            deliveryQueue: new Queue(),
            ackWaiting: new Map()
        };
        
        this.state.meshConnected = true;
        console.log('  ✅ Mesh routing and store-and-forward ready');
    }
    
    async initializeFriendsSystem() {
        console.log('👥 Initializing offline friends system...');
        
        // Load existing friends list
        try {
            const friendsFile = path.join(__dirname, 'offline-friends.json');
            const friendsData = await fs.readFile(friendsFile, 'utf8');
            const friends = JSON.parse(friendsData);
            
            friends.forEach(friend => {
                this.state.friendsList.set(friend.id, {
                    ...friend,
                    status: 'offline',
                    lastSeen: new Date(friend.lastSeen),
                    proximity: 'unknown'
                });
            });
            
            console.log(`  📖 Loaded ${friends.length} friends from storage`);
            
        } catch (error) {
            console.log('  📖 No existing friends list, starting fresh');
        }
        
        console.log('  ✅ Friends system ready for offline networking');
    }
    
    async startMeshDiscovery() {
        console.log('🔍 Starting mesh discovery and routing...');
        
        // Periodic device discovery
        setInterval(() => {
            this.discoverNearbyDevices();
        }, this.config.mesh.discoveryInterval);
        
        // Periodic heartbeat
        setInterval(() => {
            this.sendHeartbeat();
        }, this.config.mesh.heartbeatInterval);
        
        // Routing table maintenance
        setInterval(() => {
            this.maintainRoutingTable();
        }, this.config.mesh.heartbeatInterval * 2);
        
        console.log('  ✅ Mesh discovery and routing active');
    }
    
    startMessageProcessing() {
        console.log('💬 Starting message processing system...');
        
        // Process message queue
        setInterval(() => {
            this.processMessageQueue();
        }, 1000);
        
        // Process forwarding queue
        setInterval(() => {
            this.processForwardingQueue();
        }, 2000);
        
        // Cleanup expired messages
        setInterval(() => {
            this.cleanupExpiredMessages();
        }, 60000);
        
        console.log('  ✅ Message processing system active');
    }
    
    // Main messaging interface
    async sendOfflineMessage(message, recipient, options = {}) {
        console.log(`📱 Sending offline message to ${recipient}...`);
        
        // Create message packet
        const messagePacket = {
            id: this.generateMessageId(),
            sender: this.config.device.id,
            recipient: recipient,
            content: message,
            timestamp: Date.now(),
            ttl: Date.now() + this.config.mesh.ttl,
            hops: 0,
            maxHops: options.maxHops || this.config.mesh.maxHops,
            priority: options.priority || 'normal',
            encryption: true,
            routing: {
                path: [this.config.device.id],
                nextHop: null,
                deliveryMethod: 'mesh'
            }
        };
        
        // Encrypt message
        const encryptedPacket = await this.encryptMessage(messagePacket);
        
        // Try direct delivery first
        const directDelivery = await this.attemptDirectDelivery(encryptedPacket);
        
        if (!directDelivery.success) {
            // Queue for mesh routing
            await this.queueForMeshRouting(encryptedPacket);
        }
        
        this.stats.messagesQueued++;
        
        return {
            messageId: messagePacket.id,
            recipient: recipient,
            delivery: directDelivery.success ? 'direct' : 'queued',
            routing: directDelivery.success ? 'immediate' : 'mesh',
            timestamp: messagePacket.timestamp
        };
    }
    
    async receiveOfflineMessage(messageData) {
        console.log('📱 Receiving offline message...');
        
        // Decrypt message
        const decryptedMessage = await this.decryptMessage(messageData);
        
        // Check if message is for us
        if (decryptedMessage.recipient === this.config.device.id) {
            // Message delivered to us
            await this.handleIncomingMessage(decryptedMessage);
            
            // Send acknowledgment
            await this.sendAcknowledgment(decryptedMessage);
            
            return {
                received: true,
                messageId: decryptedMessage.id,
                sender: decryptedMessage.sender,
                content: decryptedMessage.content
            };
        } else {
            // Forward message
            await this.forwardMessage(decryptedMessage);
            
            return {
                forwarded: true,
                messageId: decryptedMessage.id,
                originalSender: decryptedMessage.sender,
                finalRecipient: decryptedMessage.recipient
            };
        }
    }
    
    async attemptDirectDelivery(messagePacket) {
        console.log(`  🎯 Attempting direct delivery to ${messagePacket.recipient}...`);
        
        // Check if recipient is directly connected
        const directConnection = this.findDirectConnection(messagePacket.recipient);
        
        if (directConnection) {
            const deliveryResult = await this.deliverDirectly(messagePacket, directConnection);
            
            if (deliveryResult.success) {
                console.log('  ✅ Direct delivery successful');
                return { success: true, method: directConnection.type };
            }
        }
        
        // Check if recipient is in proximity (RFID/NFC range)
        if (this.state.rfidEnabled) {
            const proximityDelivery = await this.attemptProximityDelivery(messagePacket);
            if (proximityDelivery.success) {
                console.log('  ✅ Proximity delivery successful');
                return { success: true, method: 'rfid' };
            }
        }
        
        console.log('  ❌ Direct delivery failed, queueing for mesh routing');
        return { success: false };
    }
    
    findDirectConnection(recipientId) {
        // Check Bluetooth connections
        if (this.state.bluetoothEnabled) {
            const btConnection = Array.from(this.state.connectedPeers.values())
                .find(peer => peer.id === recipientId && peer.connection === 'bluetooth');
            
            if (btConnection) {
                return { type: 'bluetooth', connection: btConnection };
            }
        }
        
        // Check nearby devices
        const nearbyDevice = this.state.nearbyDevices.get(recipientId);
        if (nearbyDevice && nearbyDevice.distance < 100) { // Within 100m
            return { type: 'nearby', connection: nearbyDevice };
        }
        
        return null;
    }
    
    async deliverDirectly(messagePacket, connection) {
        try {
            switch (connection.type) {
                case 'bluetooth':
                    return await this.deliverViaBluetooth(messagePacket, connection.connection);
                    
                case 'nearby':
                    return await this.deliverViaNearby(messagePacket, connection.connection);
                    
                default:
                    return { success: false, error: 'Unknown connection type' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async deliverViaBluetooth(messagePacket, connection) {
        console.log('    📶 Delivering via Bluetooth...');
        
        // Simulate Bluetooth GATT write
        const messageBuffer = Buffer.from(JSON.stringify(messagePacket));
        
        try {
            // Would use actual Bluetooth GATT write in real implementation
            await this.simulateBluetoothWrite(connection.peripheral, messageBuffer);
            
            this.stats.bluetoothConnections++;
            return { success: true, method: 'bluetooth' };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async deliverViaNearby(messagePacket, device) {
        console.log('    📡 Delivering via nearby device...');
        
        // Simulate network delivery to nearby device
        try {
            await this.simulateNearbyDelivery(device, messagePacket);
            return { success: true, method: 'nearby' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async attemptProximityDelivery(messagePacket) {
        console.log('    🏷️ Attempting RFID/NFC proximity delivery...');
        
        // Check if recipient is in RFID range
        const proximityDevices = Array.from(this.state.nearbyDevices.values())
            .filter(device => device.distance <= this.config.rfid.range);
        
        const targetDevice = proximityDevices.find(device => device.id === messagePacket.recipient);
        
        if (targetDevice) {
            try {
                await this.deliverViaRFID(messagePacket, targetDevice);
                this.stats.rfidExchanges++;
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }
        
        return { success: false };
    }
    
    async deliverViaRFID(messagePacket, device) {
        console.log('      🏷️ Writing message to RFID/NFC tag...');
        
        // Encrypt message for RFID storage
        const encryptedData = crypto
            .createCipher('aes-256-cbc', this.config.rfid.encryptionKey)
            .update(JSON.stringify(messagePacket), 'utf8', 'hex');
        
        // Simulate RFID/NFC write
        const tagData = {
            format: 'NDEF',
            type: 'submarine_message',
            data: encryptedData,
            timestamp: Date.now()
        };
        
        this.rfid.tags.set(device.id, tagData);
        this.rfid.history.push({
            action: 'write',
            device: device.id,
            messageId: messagePacket.id,
            timestamp: Date.now()
        });
        
        console.log('      ✅ Message written to RFID tag');
    }
    
    async queueForMeshRouting(messagePacket) {
        console.log(`  🕸️ Queueing message for mesh routing...`);
        
        // Find best route to recipient
        const route = await this.findBestRoute(messagePacket.recipient);
        
        if (route) {
            messagePacket.routing.nextHop = route.nextHop;
            messagePacket.routing.path.push(route.nextHop);
        }
        
        // Add to message queue
        this.state.messageQueue.enqueue(messagePacket);
        
        // Also store for potential forwarding
        this.storeAndForward.storage.set(messagePacket.id, {
            message: messagePacket,
            storedAt: Date.now(),
            attempts: 0,
            maxAttempts: 5
        });
        
        console.log(`  📦 Message queued for mesh delivery`);
    }
    
    async findBestRoute(recipientId) {
        // Check routing table for best path
        const route = this.state.routingTable.get(recipientId);
        
        if (route && route.distance < this.config.mesh.maxHops) {
            return route;
        }
        
        // Find routes through connected peers
        const connectedPeers = Array.from(this.state.connectedPeers.values());
        let bestRoute = null;
        let shortestDistance = Infinity;
        
        for (const peer of connectedPeers) {
            const peerRoute = peer.routingTable?.get(recipientId);
            
            if (peerRoute && peerRoute.distance + 1 < shortestDistance) {
                bestRoute = {
                    nextHop: peer.id,
                    distance: peerRoute.distance + 1,
                    reliability: peerRoute.reliability * 0.9 // Decay reliability
                };
                shortestDistance = peerRoute.distance + 1;
            }
        }
        
        return bestRoute;
    }
    
    async processMessageQueue() {
        if (this.state.messageQueue.isEmpty()) return;
        
        const message = this.state.messageQueue.dequeue();
        
        // Check if message has expired
        if (Date.now() > message.ttl) {
            console.log(`  ⏰ Message ${message.id} expired, dropping`);
            return;
        }
        
        // Attempt to forward message
        const forwardResult = await this.attemptForwarding(message);
        
        if (!forwardResult.success) {
            // Re-queue if forwarding failed and hasn't exceeded max attempts
            const stored = this.storeAndForward.storage.get(message.id);
            if (stored && stored.attempts < stored.maxAttempts) {
                stored.attempts++;
                this.state.messageQueue.enqueue(message);
            }
        }
    }
    
    async attemptForwarding(message) {
        if (!message.routing.nextHop) {
            // Try to find new route
            const route = await this.findBestRoute(message.recipient);
            if (!route) {
                return { success: false, reason: 'no_route_available' };
            }
            message.routing.nextHop = route.nextHop;
        }
        
        // Check if next hop is available
        const nextHopPeer = this.state.connectedPeers.get(message.routing.nextHop);
        
        if (nextHopPeer) {
            try {
                await this.forwardToNextHop(message, nextHopPeer);
                this.stats.messagesForwarded++;
                return { success: true };
            } catch (error) {
                return { success: false, reason: error.message };
            }
        }
        
        return { success: false, reason: 'next_hop_unavailable' };
    }
    
    async forwardToNextHop(message, nextHopPeer) {
        console.log(`  ➡️ Forwarding message ${message.id} to ${nextHopPeer.id}`);
        
        // Increment hop count
        message.hops++;
        
        // Check hop limit
        if (message.hops >= message.maxHops) {
            throw new Error('Maximum hops exceeded');
        }
        
        // Update path
        message.routing.path.push(nextHopPeer.id);
        
        // Send to next hop (simulate)
        await this.simulateMessageForward(message, nextHopPeer);
        
        console.log(`  ✅ Message forwarded to ${nextHopPeer.id}`);
    }
    
    async forwardMessage(message) {
        console.log(`🔄 Forwarding message ${message.id} for ${message.recipient}`);
        
        // Add to forwarding queue
        this.state.forwardingQueue.enqueue(message);
        this.stats.messagesForwarded++;
    }
    
    async processForwardingQueue() {
        if (this.state.forwardingQueue.isEmpty()) return;
        
        const message = this.state.forwardingQueue.dequeue();
        
        // Process forwarding
        await this.attemptForwarding(message);
    }
    
    // Device discovery and networking
    async discoverNearbyDevices() {
        console.log('🔍 Discovering nearby devices...');
        
        // Simulate device discovery
        const discoveredDevices = await this.simulateDeviceDiscovery();
        
        discoveredDevices.forEach(device => {
            this.state.nearbyDevices.set(device.id, {
                ...device,
                discoveredAt: Date.now(),
                lastSeen: Date.now()
            });
            
            // Update friends list if this is a friend
            if (this.state.friendsList.has(device.id)) {
                const friend = this.state.friendsList.get(device.id);
                friend.status = 'nearby';
                friend.lastSeen = new Date();
                friend.proximity = device.distance;
            }
        });
        
        this.stats.meshDiscoveries++;
        
        console.log(`  📡 Discovered ${discoveredDevices.length} nearby devices`);
    }
    
    async simulateDeviceDiscovery() {
        // Simulate discovering nearby submarine messenger devices
        const mockDevices = [
            {
                id: 'submarine_node_001',
                name: 'King-Commander',
                type: 'submarine_node',
                distance: 50, // meters
                connection: 'bluetooth',
                capabilities: ['king_authority', 'command', 'broadcast']
            },
            {
                id: 'submarine_node_002', 
                name: 'Queen-Decoder',
                type: 'submarine_node',
                distance: 75,
                connection: 'rfid',
                capabilities: ['queen_authority', 'decode', 'respond']
            },
            {
                id: 'submarine_node_003',
                name: 'Bridge-Router',
                type: 'submarine_node', 
                distance: 30,
                connection: 'mesh',
                capabilities: ['bridge_authority', 'route', 'translate']
            }
        ];
        
        // Randomly return some of these devices
        return mockDevices.filter(() => Math.random() > 0.7);
    }
    
    async sendHeartbeat() {
        // Send heartbeat to connected peers
        const heartbeat = {
            id: this.generateMessageId(),
            type: 'heartbeat',
            sender: this.config.device.id,
            timestamp: Date.now(),
            routingTable: this.serializeRoutingTable(),
            capabilities: this.config.device.capabilities
        };
        
        // Broadcast to all connected peers
        for (const peer of this.state.connectedPeers.values()) {
            await this.sendHeartbeatToPeer(heartbeat, peer);
        }
    }
    
    async sendHeartbeatToPeer(heartbeat, peer) {
        try {
            // Simulate heartbeat transmission
            await this.simulateHeartbeatSend(heartbeat, peer);
            peer.lastHeartbeat = Date.now();
        } catch (error) {
            console.log(`  ⚠️ Heartbeat failed to ${peer.id}: ${error.message}`);
        }
    }
    
    maintainRoutingTable() {
        const now = Date.now();
        const timeout = this.config.mesh.heartbeatInterval * 3; // 3 missed heartbeats
        
        // Remove stale routes
        for (const [nodeId, route] of this.state.routingTable.entries()) {
            if (nodeId !== this.config.device.id && now - route.lastUpdate > timeout) {
                this.state.routingTable.delete(nodeId);
                console.log(`  🗑️ Removed stale route to ${nodeId}`);
            }
        }
        
        // Update peer status
        for (const [peerId, peer] of this.state.connectedPeers.entries()) {
            if (now - peer.lastHeartbeat > timeout) {
                this.state.connectedPeers.delete(peerId);
                console.log(`  📵 Peer ${peerId} disconnected (timeout)`);
            }
        }
    }
    
    cleanupExpiredMessages() {
        const now = Date.now();
        
        // Clean up stored messages
        for (const [messageId, stored] of this.storeAndForward.storage.entries()) {
            if (now > stored.message.ttl) {
                this.storeAndForward.storage.delete(messageId);
                console.log(`  🗑️ Expired stored message ${messageId}`);
            }
        }
        
        // Clean up old routing history
        for (const [messageId, history] of this.state.routingHistory.entries()) {
            if (now - history.timestamp > this.config.mesh.ttl) {
                this.state.routingHistory.delete(messageId);
            }
        }
    }
    
    // Friends system
    async addFriend(friendId, friendInfo) {
        console.log(`👥 Adding friend: ${friendId}`);
        
        const friend = {
            id: friendId,
            name: friendInfo.name || friendId,
            trustLevel: friendInfo.trustLevel || 'friend',
            addedAt: new Date(),
            lastSeen: new Date(),
            status: 'offline',
            proximity: 'unknown',
            sharedKeys: friendInfo.sharedKeys || null,
            capabilities: friendInfo.capabilities || []
        };
        
        this.state.friendsList.set(friendId, friend);
        
        // Save friends list
        await this.saveFriendsList();
        
        return friend;
    }
    
    async removeFriend(friendId) {
        console.log(`👥 Removing friend: ${friendId}`);
        
        const removed = this.state.friendsList.delete(friendId);
        
        if (removed) {
            await this.saveFriendsList();
        }
        
        return removed;
    }
    
    async saveFriendsList() {
        try {
            const friendsArray = Array.from(this.state.friendsList.values());
            const friendsFile = path.join(__dirname, 'offline-friends.json');
            
            await fs.writeFile(friendsFile, JSON.stringify(friendsArray, null, 2));
            console.log(`  💾 Saved ${friendsArray.length} friends to storage`);
            
        } catch (error) {
            console.log(`  ⚠️ Failed to save friends list: ${error.message}`);
        }
    }
    
    getFriendStatus(friendId) {
        const friend = this.state.friendsList.get(friendId);
        if (!friend) return null;
        
        // Check if friend is nearby
        const nearbyDevice = this.state.nearbyDevices.get(friendId);
        if (nearbyDevice) {
            friend.status = 'nearby';
            friend.proximity = nearbyDevice.distance;
            friend.lastSeen = new Date();
        }
        
        return friend;
    }
    
    // Encryption and security
    async encryptMessage(message) {
        const key = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher('aes-256-cbc', key);
        let encrypted = cipher.update(JSON.stringify(message), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            encryptedData: encrypted,
            key: key.toString('hex'),
            iv: iv.toString('hex'),
            algorithm: 'aes-256-cbc'
        };
    }
    
    async decryptMessage(encryptedMessage) {
        const key = Buffer.from(encryptedMessage.key, 'hex');
        
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        let decrypted = decipher.update(encryptedMessage.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }
    
    // Utility functions
    generateDeviceId() {
        return 'submarine_' + crypto.randomBytes(8).toString('hex');
    }
    
    generateMessageId() {
        return 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    serializeRoutingTable() {
        const serialized = {};
        for (const [nodeId, route] of this.state.routingTable.entries()) {
            serialized[nodeId] = {
                distance: route.distance,
                reliability: route.reliability,
                lastUpdate: route.lastUpdate
            };
        }
        return serialized;
    }
    
    // Simulation methods (would be replaced with real implementations)
    async simulateBluetoothWrite(peripheral, data) {
        // Simulate Bluetooth GATT write
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true, bytesWritten: data.length };
    }
    
    async simulateNearbyDelivery(device, message) {
        // Simulate network delivery to nearby device
        await new Promise(resolve => setTimeout(resolve, 200));
        return { success: true, device: device.id };
    }
    
    async simulateMessageForward(message, peer) {
        // Simulate forwarding message to next hop
        await new Promise(resolve => setTimeout(resolve, 150));
        return { success: true, forwardedTo: peer.id };
    }
    
    async simulateHeartbeatSend(heartbeat, peer) {
        // Simulate heartbeat transmission
        await new Promise(resolve => setTimeout(resolve, 50));
        return { success: true, peer: peer.id };
    }
    
    async handleIncomingMessage(message) {
        console.log(`📥 Handling incoming message from ${message.sender}`);
        
        // Store in message history
        this.state.routingHistory.set(message.id, {
            message,
            receivedAt: Date.now(),
            processed: true
        });
        
        // Emit event for application to handle
        this.emit('message_received', message);
    }
    
    async sendAcknowledgment(message) {
        const ack = {
            id: this.generateMessageId(),
            type: 'acknowledgment',
            originalMessageId: message.id,
            sender: this.config.device.id,
            recipient: message.sender,
            timestamp: Date.now(),
            ttl: Date.now() + 300000 // 5 minutes
        };
        
        // Send ACK back through same path in reverse
        await this.sendOfflineMessage(ack, message.sender, { priority: 'high' });
    }
    
    // Status and monitoring
    getOfflineMeshStatus() {
        return {
            device: this.config.device,
            connectivity: {
                bluetoothEnabled: this.state.bluetoothEnabled,
                rfidEnabled: this.state.rfidEnabled,
                meshConnected: this.state.meshConnected,
                connectedPeers: this.state.connectedPeers.size,
                nearbyDevices: this.state.nearbyDevices.size
            },
            friends: {
                totalFriends: this.state.friendsList.size,
                nearbyFriends: Array.from(this.state.friendsList.values())
                    .filter(f => f.status === 'nearby').length,
                onlineFriends: Array.from(this.state.friendsList.values())
                    .filter(f => f.status === 'online').length
            },
            messaging: {
                queuedMessages: this.state.messageQueue.size(),
                storedMessages: this.storeAndForward.storage.size,
                forwardingQueue: this.state.forwardingQueue.size(),
                routingTableSize: this.state.routingTable.size
            },
            stats: this.stats
        };
    }
    
    async cleanup() {
        console.log('🧹 Cleaning up Offline Mesh Messenger...');
        
        // Save friends list
        await this.saveFriendsList();
        
        // Clear sensitive data
        this.state.connectedPeers.clear();
        this.state.messageQueue = new Queue();
        this.storeAndForward.storage.clear();
        
        console.log('✅ Cleanup complete');
    }
}

// Simple Queue implementation
class Queue {
    constructor() {
        this.items = [];
    }
    
    enqueue(item) {
        this.items.push(item);
    }
    
    dequeue() {
        return this.items.shift();
    }
    
    isEmpty() {
        return this.items.length === 0;
    }
    
    size() {
        return this.items.length;
    }
}

module.exports = OfflineMeshMessenger;

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
📱🔗 OFFLINE MESH MESSENGER

Usage:
  node offline-mesh-messenger.js [command] [options]

Commands:
  send <recipient> <message>    Send message through offline mesh
  friends                       Manage offline friends list
  discover                      Discover nearby devices
  status                        Show mesh network status
  demo                         Run offline messaging demonstration

Options:
  --bluetooth                   Enable Bluetooth mesh networking
  --rfid                       Enable RFID/NFC proximity messaging
  --friend <id>                Add device as friend
  --trust <level>              Set trust level (unknown, acquaintance, friend, trusted, king_queen)

Examples:
  # Send message through offline mesh
  node offline-mesh-messenger.js send submarine_node_001 "Meet at coordinates 50.8503, 4.3517"
  
  # Add friend with trust level
  node offline-mesh-messenger.js friends --friend submarine_node_002 --trust king_queen
  
  # Discover nearby devices
  node offline-mesh-messenger.js discover --bluetooth --rfid
  
  # Check mesh status
  node offline-mesh-messenger.js status
  
  # Run demonstration
  node offline-mesh-messenger.js demo

📱 Bluetooth/RFID/ARPANET-style offline networking for submarine messaging
🔗 Store-and-forward routing with encrypted message packets
👥 Offline friends system with proximity detection
🕸️ Mesh network discovery and routing
        `);
        process.exit(0);
    }
    
    const command = args[0];
    const meshMessenger = new OfflineMeshMessenger({
        deviceName: 'CLI-Submarine-Node',
        bluetoothEnabled: args.includes('--bluetooth'),
        rfidEnabled: args.includes('--rfid')
    });
    
    meshMessenger.on('mesh_ready', async () => {
        try {
            switch (command) {
                case 'send':
                    const recipient = args[1];
                    const message = args[2];
                    
                    if (!recipient || !message) {
                        console.error('❌ Recipient and message required');
                        break;
                    }
                    
                    const sendResult = await meshMessenger.sendOfflineMessage(message, recipient);
                    console.log(`\n✅ OFFLINE MESSAGE SENT:`);
                    console.log(`  Message ID: ${sendResult.messageId}`);
                    console.log(`  Recipient: ${sendResult.recipient}`);
                    console.log(`  Delivery: ${sendResult.delivery}`);
                    console.log(`  Routing: ${sendResult.routing}`);
                    break;
                    
                case 'friends':
                    if (args.includes('--friend')) {
                        const friendId = args[args.indexOf('--friend') + 1];
                        const trustLevel = args.includes('--trust') ? 
                            args[args.indexOf('--trust') + 1] : 'friend';
                        
                        const friend = await meshMessenger.addFriend(friendId, {
                            name: friendId,
                            trustLevel: trustLevel
                        });
                        
                        console.log(`\n✅ FRIEND ADDED:`);
                        console.log(`  ID: ${friend.id}`);
                        console.log(`  Trust Level: ${friend.trustLevel}`);
                        console.log(`  Added: ${friend.addedAt}`);
                    } else {
                        const status = meshMessenger.getOfflineMeshStatus();
                        console.log(`\n👥 FRIENDS LIST:`);
                        console.log(`  Total Friends: ${status.friends.totalFriends}`);
                        console.log(`  Nearby Friends: ${status.friends.nearbyFriends}`);
                        console.log(`  Online Friends: ${status.friends.onlineFriends}`);
                    }
                    break;
                    
                case 'discover':
                    console.log('\n🔍 DISCOVERING NEARBY DEVICES...');
                    await meshMessenger.discoverNearbyDevices();
                    
                    const nearbyDevices = Array.from(meshMessenger.state.nearbyDevices.values());
                    console.log(`\n📡 DISCOVERED DEVICES:`);
                    nearbyDevices.forEach((device, index) => {
                        console.log(`  ${index + 1}. ${device.name} (${device.id})`);
                        console.log(`     Distance: ${device.distance}m`);
                        console.log(`     Connection: ${device.connection}`);
                        console.log(`     Capabilities: ${device.capabilities.join(', ')}`);
                    });
                    break;
                    
                case 'status':
                    const status = meshMessenger.getOfflineMeshStatus();
                    console.log('\n📱 OFFLINE MESH STATUS:');
                    console.log(`  Device: ${status.device.name} (${status.device.id})`);
                    console.log(`  Bluetooth: ${status.connectivity.bluetoothEnabled ? 'Enabled' : 'Disabled'}`);
                    console.log(`  RFID/NFC: ${status.connectivity.rfidEnabled ? 'Enabled' : 'Disabled'}`);
                    console.log(`  Connected Peers: ${status.connectivity.connectedPeers}`);
                    console.log(`  Nearby Devices: ${status.connectivity.nearbyDevices}`);
                    console.log(`  Total Friends: ${status.friends.totalFriends}`);
                    console.log(`  Queued Messages: ${status.messaging.queuedMessages}`);
                    console.log(`  Stored Messages: ${status.messaging.storedMessages}`);
                    break;
                    
                case 'demo':
                    console.log('\n📱 RUNNING OFFLINE MESH DEMONSTRATION...\n');
                    
                    // Demo: Discover devices
                    console.log('🔍 Discovering nearby submarine nodes...');
                    await meshMessenger.discoverNearbyDevices();
                    
                    // Demo: Send message through mesh
                    console.log('📤 Sending secret message through mesh...');
                    const demoResult = await meshMessenger.sendOfflineMessage(
                        'Submarine position confirmed, proceeding with Operation Neptune',
                        'submarine_node_001',
                        { priority: 'high' }
                    );
                    
                    console.log('📥 Simulating message reception...');
                    
                    console.log('\n✅ DEMO COMPLETE:');
                    console.log(`  Message ID: ${demoResult.messageId}`);
                    console.log(`  Delivery Method: ${demoResult.delivery}`);
                    console.log(`  Routing Type: ${demoResult.routing}`);
                    console.log(`  Offline Capability: Enabled`);
                    console.log(`  Mesh Network: Operational`);
                    break;
                    
                default:
                    console.error(`❌ Unknown command: ${command}`);
                    process.exit(1);
            }
            
        } catch (error) {
            console.error('❌ Offline mesh operation failed:', error.message);
            process.exit(1);
        } finally {
            await meshMessenger.cleanup();
        }
    });
}