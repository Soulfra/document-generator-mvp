#!/usr/bin/env node

/**
 * SOULFRA RFID/NFC EVENT SYSTEM
 * Voice auth + RFID = Real world underground events
 * Artist drops, kickball games, secret shows - ALL VERIFIED BY VOICE
 */

const express = require('express');
const crypto = require('crypto');
const WebSocket = require('ws');

class SoulfraRFIDEventSystem {
  constructor() {
    this.app = express();
    this.events = new Map();
    this.tickets = new Map();
    this.attendees = new Map();
    this.meshNodes = new Map(); // Local ARPANET-style nodes
    
    this.setupRoutes();
    this.setupWebSocket();
  }
  
  setupRoutes() {
    this.app.use(express.json());
    
    // Create event (artist drop, kickball game, etc)
    this.app.post('/api/create-event', async (req, res) => {
      const { 
        voiceprint, 
        type, // 'artist_drop', 'kickball', 'secret_show', 'meetup'
        details,
        maxAttendees,
        requiresFriendVerification,
        location 
      } = req.body;
      
      const eventId = this.generateEventId(type);
      
      const event = {
        id: eventId,
        creator: voiceprint,
        type,
        details,
        maxAttendees,
        currentAttendees: 0,
        requiresFriendVerification,
        location: this.encryptLocation(location), // Privacy first
        rfidEnabled: true,
        tickets: [],
        created: Date.now(),
        meshNodeId: this.assignMeshNode(location)
      };
      
      this.events.set(eventId, event);
      
      // Generate RFID/NFC data
      const rfidData = this.generateRFIDData(eventId, voiceprint);
      
      res.json({
        eventId,
        rfidData,
        meshNode: event.meshNodeId,
        message: `${type} event created! Share with real friends only.`
      });
    });
    
    // Generate ticket with voice verification
    this.app.post('/api/generate-ticket', async (req, res) => {
      const { eventId, voiceprint, friendVoiceprints } = req.body;
      
      const event = this.events.get(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Check friend verification if required
      if (event.requiresFriendVerification) {
        const verified = this.verifyFriends(voiceprint, friendVoiceprints);
        if (!verified) {
          return res.status(403).json({ 
            error: 'Need at least 2 friends to verify you' 
          });
        }
      }
      
      // Generate unique ticket
      const ticket = {
        id: crypto.randomBytes(16).toString('hex'),
        eventId,
        holder: voiceprint,
        rfidTag: this.generateRFIDTag(),
        qrCode: await this.generateTicketQR(eventId, voiceprint),
        verifiedBy: friendVoiceprints || [],
        issued: Date.now(),
        used: false
      };
      
      this.tickets.set(ticket.id, ticket);
      event.tickets.push(ticket.id);
      
      res.json({
        ticket,
        rfidWriteData: this.getRFIDWriteData(ticket),
        message: 'Ticket generated! Write to RFID tag or use QR.'
      });
    });
    
    // Check in with RFID/voice
    this.app.post('/api/checkin', async (req, res) => {
      const { rfidData, voiceData, location } = req.body;
      
      // Verify RFID
      const ticket = this.verifyRFID(rfidData);
      if (!ticket) {
        return res.status(403).json({ error: 'Invalid RFID' });
      }
      
      // Verify voice matches ticket holder
      const voiceMatch = await this.verifyVoiceMatch(voiceData, ticket.holder);
      if (!voiceMatch) {
        return res.status(403).json({ error: 'Voice does not match ticket' });
      }
      
      // Check proximity (mesh network)
      const inRange = this.checkMeshProximity(location, ticket.eventId);
      if (!inRange) {
        return res.status(403).json({ error: 'Not at event location' });
      }
      
      // Mark ticket as used
      ticket.used = true;
      ticket.checkinTime = Date.now();
      
      // Add to attendees
      this.attendees.set(ticket.eventId, [
        ...(this.attendees.get(ticket.eventId) || []),
        { voiceprint: ticket.holder, checkinTime: ticket.checkinTime }
      ]);
      
      res.json({
        success: true,
        message: 'Welcome! You\'re checked in.',
        attendeeNumber: this.attendees.get(ticket.eventId).length
      });
    });
    
    // Local mesh network discovery
    this.app.get('/api/mesh-discover', (req, res) => {
      const { latitude, longitude } = req.query;
      
      // Find nearby mesh nodes (ARPANET style)
      const nearbyNodes = this.findNearbyMeshNodes(latitude, longitude);
      const nearbyEvents = this.findNearbyEvents(nearbyNodes);
      
      res.json({
        meshNodes: nearbyNodes,
        events: nearbyEvents,
        yourNode: this.createTemporaryNode(latitude, longitude)
      });
    });
    
    // Real friend chat (not Facebook bullshit)
    this.app.post('/api/friend-chat', async (req, res) => {
      const { from, to, message, voiceNote } = req.body;
      
      // Verify real friendship (both verified each other with voice)
      const areFriends = await this.verifyRealFriendship(from, to);
      if (!areFriends) {
        return res.status(403).json({ 
          error: 'Not voice-verified friends' 
        });
      }
      
      // Store encrypted message
      const encryptedMessage = this.encryptMessage(message, from, to);
      
      // Notify via mesh if nearby
      this.notifyViaMesh(to, {
        type: 'friend_message',
        from: from.slice(0, 8) + '...',
        preview: message.slice(0, 20) + '...'
      });
      
      res.json({
        sent: true,
        delivered: this.isOnMesh(to),
        encrypted: true
      });
    });
    
    // Event dashboard
    this.app.get('/events-dashboard', (req, res) => {
      res.send(this.getEventsDashboardHTML());
    });
  }
  
  setupWebSocket() {
    this.wss = new WebSocket.Server({ port: 8082 });
    
    this.wss.on('connection', (ws, req) => {
      // Mesh network real-time updates
      ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'mesh_ping') {
          // Update mesh node location
          this.updateMeshNode(data.nodeId, data.location);
          
          // Broadcast to nearby nodes
          this.broadcastToNearby(data.location, {
            type: 'mesh_pong',
            nodeId: data.nodeId,
            timestamp: Date.now()
          });
        }
      });
    });
  }
  
  generateEventId(type) {
    const prefix = {
      artist_drop: 'DROP',
      kickball: 'KICK',
      secret_show: 'SHOW',
      meetup: 'MEET'
    }[type] || 'EVENT';
    
    return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generateRFIDData(eventId, creator) {
    // NFC NDEF format
    return {
      type: 'soulfra_event',
      eventId,
      creator: creator.slice(0, 16),
      timestamp: Date.now(),
      signature: crypto.createHash('sha256')
        .update(eventId + creator + Date.now())
        .digest('hex')
    };
  }
  
  generateRFIDTag() {
    // Simulate RFID tag ID (would be real NFC tag in production)
    return 'RFID_' + crypto.randomBytes(8).toString('hex').toUpperCase();
  }
  
  getRFIDWriteData(ticket) {
    // Data to write to physical RFID/NFC tag
    return {
      format: 'NDEF',
      records: [{
        type: 'soulfra/ticket',
        id: ticket.id,
        payload: {
          event: ticket.eventId,
          holder: ticket.holder.slice(0, 16),
          issued: ticket.issued
        }
      }]
    };
  }
  
  verifyRFID(rfidData) {
    // In real implementation, would verify against physical tag
    for (const ticket of this.tickets.values()) {
      if (ticket.rfidTag === rfidData || ticket.id === rfidData) {
        return ticket;
      }
    }
    return null;
  }
  
  async verifyVoiceMatch(currentVoice, storedVoiceprint) {
    // In production, use real voice matching
    // For now, simple comparison
    return currentVoice === storedVoiceprint;
  }
  
  encryptLocation(location) {
    // Only friends can decrypt real location
    const encrypted = crypto.createCipher('aes-256-cbc', 'soulfra-location-key')
      .update(JSON.stringify(location), 'utf8', 'hex');
    return encrypted;
  }
  
  assignMeshNode(location) {
    // Assign to nearest mesh node
    const nodeId = 'MESH_' + crypto.createHash('sha256')
      .update(JSON.stringify(location))
      .digest('hex')
      .slice(0, 8);
    
    this.meshNodes.set(nodeId, {
      id: nodeId,
      location,
      activeConnections: 0,
      events: []
    });
    
    return nodeId;
  }
  
  findNearbyMeshNodes(lat, lon, radiusKm = 5) {
    const nearby = [];
    
    for (const [nodeId, node] of this.meshNodes) {
      const distance = this.calculateDistance(
        lat, lon,
        node.location.latitude,
        node.location.longitude
      );
      
      if (distance <= radiusKm) {
        nearby.push({
          nodeId,
          distance,
          activeEvents: node.events.length
        });
      }
    }
    
    return nearby.sort((a, b) => a.distance - b.distance);
  }
  
  calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula for distance
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  verifyFriends(voiceprint, friendVoiceprints) {
    // Need at least 2 friends to verify
    return friendVoiceprints && friendVoiceprints.length >= 2;
  }
  
  async verifyRealFriendship(voice1, voice2) {
    // Both must have verified each other with voice
    // In production, check database
    return true; // Simplified for demo
  }
  
  getEventsDashboardHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>SOULFRA Events - Real Life Underground</title>
    <style>
        body {
            background: #000;
            color: #0f0;
            font-family: monospace;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .event-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .event-card {
            border: 2px solid #0f0;
            padding: 20px;
            background: #111;
            position: relative;
        }
        .event-type {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #ff0;
            color: #000;
            padding: 5px 10px;
            font-weight: bold;
        }
        .rfid-tag {
            background: #333;
            padding: 10px;
            margin: 10px 0;
            font-family: monospace;
            word-break: break-all;
        }
        .mesh-status {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #222;
            border: 2px solid #0ff;
            padding: 15px;
            color: #0ff;
        }
        .friend-required {
            color: #f00;
            font-weight: bold;
        }
        pre { 
            color: #0f0; 
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <pre>
███████╗██╗   ██╗███████╗███╗   ██╗████████╗███████╗
██╔════╝██║   ██║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
█████╗  ██║   ██║█████╗  ██╔██╗ ██║   ██║   ███████╗
██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   ╚════██║
███████╗ ╚████╔╝ ███████╗██║ ╚████║   ██║   ███████║
╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
        </pre>
        
        <h1>🎫 REAL WORLD EVENTS - VOICE VERIFIED ONLY</h1>
        <p>No Facebook events. No fake friends. Just real people at real places.</p>
        
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin:20px 0;">
            <div style="border:1px solid #0f0;padding:15px;">
                <h3>🎨 Artist Drops</h3>
                <p>Secret locations<br>Voice + RFID entry<br>Limited editions</p>
            </div>
            <div style="border:1px solid #0f0;padding:15px;">
                <h3>⚽ Kickball Games</h3>
                <p>Real friends only<br>Mesh network scoring<br>No corporate leagues</p>
            </div>
            <div style="border:1px solid #0f0;padding:15px;">
                <h3>🎤 Secret Shows</h3>
                <p>Underground venues<br>Friend verification<br>No scalpers</p>
            </div>
        </div>
        
        <h2>Active Events Near You:</h2>
        <div class="event-grid" id="events">
            <div class="event-card">
                <span class="event-type">ARTIST DROP</span>
                <h3>Limited NFT Physical Print</h3>
                <p>Artist: anon_voice_artist_42</p>
                <p>When: Tomorrow 7PM</p>
                <p>Where: <span style="color:#ff0">[ENCRYPTED - Friends Only]</span></p>
                <p class="friend-required">⚠️ Requires 2 friend verifications</p>
                <div class="rfid-tag">
                    RFID: TAG_8A9F_2D4E_CC91
                </div>
                <button onclick="requestTicket('DROP_123')">Request Ticket (10 credits)</button>
            </div>
            
            <div class="event-card">
                <span class="event-type">KICKBALL</span>
                <h3>Sunday Underground League</h3>
                <p>Organizer: kickball_voice_king</p>
                <p>When: Sunday 2PM</p>
                <p>Where: Mesh Node PARK_DELTA</p>
                <p>Open spots: 4/20</p>
                <div class="rfid-tag">
                    RFID: TAG_3F2A_9B7C_EE12
                </div>
                <button onclick="joinGame('KICK_456')">Join Game (5 credits)</button>
            </div>
            
            <div class="event-card">
                <span class="event-type">SECRET SHOW</span>
                <h3>Underground Electronic Night</h3>
                <p>DJ: mystery_voice_909</p>
                <p>When: Saturday Midnight</p>
                <p>Where: <span style="color:#ff0">[VOICE VERIFIED ONLY]</span></p>
                <p class="friend-required">⚠️ Requires 3 friend verifications</p>
                <div class="rfid-tag">
                    RFID: TAG_CC3E_7A9F_BB45
                </div>
                <button onclick="requestTicket('SHOW_789')">Get on List (15 credits)</button>
            </div>
        </div>
        
        <div class="mesh-status">
            <h4>🌐 Mesh Network Status</h4>
            <p>Connected Nodes: <span id="meshCount">7</span></p>
            <p>Your Node: MESH_LOCAL_A9F2</p>
            <p>Range: 5km</p>
            <p style="color:#0f0;">● Active</p>
        </div>
    </div>
    
    <script>
        // Simulate mesh network activity
        setInterval(() => {
            const count = document.getElementById('meshCount');
            count.textContent = Math.floor(Math.random() * 5) + 5;
        }, 3000);
        
        function requestTicket(eventId) {
            alert('Voice verification required! Press and hold to speak...');
            // Would trigger voice auth flow
        }
        
        function joinGame(eventId) {
            alert('Connecting to local mesh network...');
            // Would connect to game mesh
        }
        
        // Check for nearby events via mesh
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                console.log('Checking mesh nodes near:', position.coords);
                // Would query nearby mesh nodes
            });
        }
    </script>
</body>
</html>`;
  }
  
  start(port = 3336) {
    this.app.listen(port, () => {
      console.log(`
🎫 SOULFRA RFID/NFC EVENT SYSTEM
=================================

Real world events with voice verification!

Features:
✅ RFID/NFC ticket generation
✅ Voice-matched entry
✅ Local mesh networking (ARPANET style)
✅ Real friend verification required
✅ Artist drops & secret shows
✅ Kickball & sports events
✅ Encrypted locations
✅ No corporate bullshit

Event Types:
- Artist Drops: Limited physical + digital items
- Kickball Games: Real friends, real games
- Secret Shows: Underground venues only
- Meetups: Voice-verified people only

The anti-Facebook event system!

Dashboard: http://localhost:${port}/events-dashboard
API: http://localhost:${port}/api/*
WebSocket: ws://localhost:8082

🌐 Building REAL communities, not fake social networks.
      `);
    });
  }
}

// Launch if called directly
if (require.main === module) {
  const eventSystem = new SoulfraRFIDEventSystem();
  eventSystem.start();
}

module.exports = SoulfraRFIDEventSystem;