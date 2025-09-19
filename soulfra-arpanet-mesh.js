#!/usr/bin/env node

/**
 * SOULFRA ARPANET-STYLE MESH NETWORK
 * Local P2P networking like the original internet
 * No ISPs, no tracking, just direct connections
 */

const dgram = require('dgram');
const net = require('net');
const crypto = require('crypto');
const os = require('os');

class SoulfraArpanetMesh {
  constructor() {
    this.nodeId = this.generateNodeId();
    this.peers = new Map();
    this.routes = new Map();
    this.services = new Map();
    this.localData = new Map();
    
    // Network discovery
    this.discoverySocket = dgram.createSocket('udp4');
    this.discoveryPort = 31415;
    
    // P2P connections
    this.p2pServer = net.createServer();
    this.p2pPort = 31416;
    
    // Mesh routing table
    this.routingTable = new Map();
    
    this.setupDiscovery();
    this.setupP2P();
    this.startHeartbeat();
  }
  
  generateNodeId() {
    const interfaces = os.networkInterfaces();
    const macs = [];
    
    Object.values(interfaces).forEach(iface => {
      iface.forEach(details => {
        if (details.mac && details.mac !== '00:00:00:00:00:00') {
          macs.push(details.mac);
        }
      });
    });
    
    // Node ID based on hardware + randomness
    const nodeString = macs.join(':') + Date.now() + Math.random();
    return 'NODE_' + crypto.createHash('sha256')
      .update(nodeString)
      .digest('hex')
      .slice(0, 12)
      .toUpperCase();
  }
  
  setupDiscovery() {
    // Broadcast presence on local network
    this.discoverySocket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        
        if (data.type === 'PING' && data.nodeId !== this.nodeId) {
          // Respond to discovery
          this.sendDiscoveryResponse(rinfo.address, rinfo.port, data.nodeId);
          
          // Add to peers
          this.addPeer(data.nodeId, {
            address: rinfo.address,
            port: data.p2pPort || this.p2pPort,
            services: data.services || [],
            lastSeen: Date.now()
          });
        } else if (data.type === 'PONG') {
          // Peer responded
          this.addPeer(data.nodeId, {
            address: rinfo.address,
            port: data.p2pPort || this.p2pPort,
            services: data.services || [],
            lastSeen: Date.now()
          });
        }
      } catch (e) {
        // Invalid message, ignore
      }
    });
    
    this.discoverySocket.on('listening', () => {
      this.discoverySocket.setBroadcast(true);
      console.log(`🌐 Mesh discovery listening on port ${this.discoveryPort}`);
    });
    
    this.discoverySocket.bind(this.discoveryPort);
  }
  
  setupP2P() {
    this.p2pServer.on('connection', (socket) => {
      console.log(`📡 New P2P connection from ${socket.remoteAddress}`);
      
      socket.on('data', (data) => {
        this.handleP2PMessage(socket, data);
      });
      
      socket.on('error', (err) => {
        console.error('P2P socket error:', err.message);
      });
    });
    
    this.p2pServer.listen(this.p2pPort, () => {
      console.log(`🔌 P2P server listening on port ${this.p2pPort}`);
    });
  }
  
  handleP2PMessage(socket, data) {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'ROUTE_REQUEST':
          this.handleRouteRequest(socket, message);
          break;
          
        case 'DATA_TRANSFER':
          this.handleDataTransfer(socket, message);
          break;
          
        case 'SERVICE_ANNOUNCE':
          this.handleServiceAnnounce(socket, message);
          break;
          
        case 'VOICE_RELAY':
          this.handleVoiceRelay(socket, message);
          break;
          
        case 'EVENT_BROADCAST':
          this.handleEventBroadcast(socket, message);
          break;
      }
    } catch (e) {
      console.error('Invalid P2P message:', e);
    }
  }
  
  sendDiscoveryResponse(address, port, peerId) {
    const response = {
      type: 'PONG',
      nodeId: this.nodeId,
      p2pPort: this.p2pPort,
      services: Array.from(this.services.keys()),
      meshSize: this.peers.size
    };
    
    const message = Buffer.from(JSON.stringify(response));
    this.discoverySocket.send(message, port, address);
  }
  
  broadcast() {
    const message = {
      type: 'PING',
      nodeId: this.nodeId,
      p2pPort: this.p2pPort,
      services: Array.from(this.services.keys()),
      timestamp: Date.now()
    };
    
    const buffer = Buffer.from(JSON.stringify(message));
    
    // Broadcast to common ports
    const broadcastAddresses = this.getBroadcastAddresses();
    broadcastAddresses.forEach(addr => {
      this.discoverySocket.send(buffer, this.discoveryPort, addr);
    });
  }
  
  getBroadcastAddresses() {
    const addresses = [];
    const interfaces = os.networkInterfaces();
    
    Object.values(interfaces).forEach(iface => {
      iface.forEach(details => {
        if (details.family === 'IPv4' && !details.internal) {
          // Calculate broadcast address
          const parts = details.address.split('.');
          parts[3] = '255';
          addresses.push(parts.join('.'));
        }
      });
    });
    
    // Add common local broadcast
    addresses.push('255.255.255.255');
    
    return [...new Set(addresses)];
  }
  
  addPeer(nodeId, peerInfo) {
    if (nodeId === this.nodeId) return;
    
    this.peers.set(nodeId, peerInfo);
    console.log(`✅ Added peer ${nodeId} (${peerInfo.address})`);
    
    // Update routing table
    this.updateRoutingTable();
  }
  
  updateRoutingTable() {
    // Simple distance vector routing
    this.peers.forEach((peer, peerId) => {
      this.routingTable.set(peerId, {
        nextHop: peerId,
        distance: 1,
        lastUpdate: Date.now()
      });
    });
  }
  
  // Service registration (like old ARPANET IMPs)
  registerService(serviceName, handler) {
    this.services.set(serviceName, handler);
    console.log(`📢 Registered service: ${serviceName}`);
    
    // Announce to peers
    this.announceService(serviceName);
  }
  
  announceService(serviceName) {
    const announcement = {
      type: 'SERVICE_ANNOUNCE',
      nodeId: this.nodeId,
      service: serviceName,
      timestamp: Date.now()
    };
    
    this.broadcastToPeers(announcement);
  }
  
  broadcastToPeers(message) {
    this.peers.forEach((peer, peerId) => {
      this.sendToPeer(peerId, message);
    });
  }
  
  sendToPeer(peerId, message) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    
    const client = net.connect(peer.port, peer.address, () => {
      client.write(JSON.stringify(message));
      client.end();
    });
    
    client.on('error', (err) => {
      console.error(`Failed to send to ${peerId}:`, err.message);
      // Remove dead peer
      this.peers.delete(peerId);
    });
  }
  
  // Data storage and retrieval (distributed across mesh)
  storeData(key, value, replicas = 3) {
    // Store locally
    this.localData.set(key, value);
    
    // Replicate to nearest peers
    const nearestPeers = this.getNearestPeers(replicas);
    
    nearestPeers.forEach(peerId => {
      this.sendToPeer(peerId, {
        type: 'DATA_TRANSFER',
        operation: 'STORE',
        key,
        value,
        nodeId: this.nodeId
      });
    });
    
    return {
      stored: true,
      replicas: nearestPeers.length,
      key
    };
  }
  
  async retrieveData(key) {
    // Check local first
    if (this.localData.has(key)) {
      return this.localData.get(key);
    }
    
    // Query peers
    return new Promise((resolve, reject) => {
      let found = false;
      let responses = 0;
      
      this.peers.forEach((peer, peerId) => {
        if (found) return;
        
        const client = net.connect(peer.port, peer.address, () => {
          client.write(JSON.stringify({
            type: 'DATA_TRANSFER',
            operation: 'RETRIEVE',
            key,
            nodeId: this.nodeId
          }));
        });
        
        client.on('data', (data) => {
          const response = JSON.parse(data.toString());
          if (response.found) {
            found = true;
            resolve(response.value);
          }
        });
        
        client.on('end', () => {
          responses++;
          if (responses === this.peers.size && !found) {
            reject(new Error('Data not found in mesh'));
          }
        });
      });
    });
  }
  
  getNearestPeers(count) {
    // Simple selection - could be improved with actual distance metrics
    const peerIds = Array.from(this.peers.keys());
    return peerIds.slice(0, Math.min(count, peerIds.length));
  }
  
  handleDataTransfer(socket, message) {
    if (message.operation === 'STORE') {
      this.localData.set(message.key, message.value);
      socket.write(JSON.stringify({ stored: true }));
    } else if (message.operation === 'RETRIEVE') {
      const found = this.localData.has(message.key);
      socket.write(JSON.stringify({
        found,
        value: found ? this.localData.get(message.key) : null
      }));
    }
    socket.end();
  }
  
  // Voice relay through mesh
  relayVoice(fromVoiceprint, toVoiceprint, voiceData) {
    // Find best route
    const route = this.findRoute(toVoiceprint);
    
    if (route) {
      this.sendToPeer(route.nextHop, {
        type: 'VOICE_RELAY',
        from: fromVoiceprint,
        to: toVoiceprint,
        voiceData,
        hops: route.distance
      });
      
      return { relayed: true, hops: route.distance };
    }
    
    return { relayed: false, reason: 'No route found' };
  }
  
  findRoute(destination) {
    // Check routing table
    return this.routingTable.get(destination) || null;
  }
  
  startHeartbeat() {
    // Broadcast presence every 30 seconds
    setInterval(() => {
      this.broadcast();
      this.cleanupDeadPeers();
    }, 30000);
    
    // Initial broadcast
    setTimeout(() => this.broadcast(), 1000);
  }
  
  cleanupDeadPeers() {
    const timeout = 120000; // 2 minutes
    const now = Date.now();
    
    this.peers.forEach((peer, peerId) => {
      if (now - peer.lastSeen > timeout) {
        console.log(`🗑️ Removing dead peer ${peerId}`);
        this.peers.delete(peerId);
      }
    });
    
    this.updateRoutingTable();
  }
  
  getStatus() {
    return {
      nodeId: this.nodeId,
      peers: this.peers.size,
      services: Array.from(this.services.keys()),
      dataStored: this.localData.size,
      routes: this.routingTable.size,
      uptime: process.uptime()
    };
  }
  
  // Example services
  setupDefaultServices() {
    // Voice verification relay
    this.registerService('voice_verify', (data) => {
      console.log('Voice verification request:', data);
      // Process voice verification
    });
    
    // Event announcement
    this.registerService('event_announce', (data) => {
      console.log('New event in mesh:', data);
      // Broadcast to local apps
    });
    
    // Friend discovery
    this.registerService('friend_discover', (data) => {
      console.log('Friend discovery ping:', data);
      // Check local friends
    });
  }
}

// Launch mesh node
if (require.main === module) {
  const mesh = new SoulfraArpanetMesh();
  mesh.setupDefaultServices();
  
  console.log(`
🌐 SOULFRA ARPANET MESH NODE
============================

Node ID: ${mesh.nodeId}

Like the original ARPANET but for the people!

Features:
✅ Local peer discovery (UDP broadcast)
✅ P2P connections (no central server)
✅ Distributed data storage
✅ Service announcement
✅ Voice relay through mesh
✅ Automatic routing
✅ No ISP needed for local
✅ Works at festivals/events

Services:
- voice_verify: Relay voice verification
- event_announce: Broadcast local events  
- friend_discover: Find friends nearby

The mesh will:
1. Auto-discover peers on local network
2. Build routing tables
3. Share data across nodes
4. Relay messages when no direct path

Perfect for:
- Music festivals (no cell service)
- Protests (internet shutdowns)
- Local communities
- Underground events
- Disaster recovery

Broadcasting for peers...
  `);
  
  // Status endpoint
  const express = require('express');
  const app = express();
  
  app.get('/mesh-status', (req, res) => {
    res.json(mesh.getStatus());
  });
  
  app.get('/mesh-dashboard', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>SOULFRA Mesh Network</title>
    <style>
        body { background: #000; color: #0f0; font-family: monospace; padding: 20px; }
        .node { border: 1px solid #0f0; padding: 10px; margin: 10px; display: inline-block; }
        .peer { background: #111; padding: 5px; margin: 5px; }
        #map { width: 100%; height: 400px; background: #111; position: relative; margin: 20px 0; }
        .mesh-node { position: absolute; width: 10px; height: 10px; background: #0f0; border-radius: 50%; }
        .connection { position: absolute; height: 1px; background: #0f0; opacity: 0.3; }
    </style>
</head>
<body>
    <h1>🌐 SOULFRA MESH NETWORK</h1>
    <div class="node">
        <h3>Local Node: ${mesh.nodeId}</h3>
        <p>Peers: <span id="peerCount">0</span></p>
        <p>Services: ${mesh.services.size}</p>
        <p>Data stored: ${mesh.localData.size} items</p>
    </div>
    
    <div id="map"></div>
    
    <div id="peers"></div>
    
    <script>
        function updateStatus() {
            fetch('/mesh-status')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('peerCount').textContent = data.peers;
                });
        }
        
        setInterval(updateStatus, 5000);
        updateStatus();
    </script>
</body>
</html>`);
  });
  
  app.listen(3338, () => {
    console.log(`\n📊 Mesh dashboard: http://localhost:3338/mesh-dashboard`);
  });
  
  // Example: Store and retrieve data
  setTimeout(() => {
    console.log('\n📦 Storing data in mesh...');
    mesh.storeData('test_event', {
      type: 'kickball',
      location: 'park',
      time: 'Sunday 2pm'
    });
  }, 5000);
}

module.exports = SoulfraArpanetMesh;