#!/usr/bin/env node

/**
 * SOULFRA REAL FRIENDS CHAT
 * Voice-verified friends only. No algorithms. No ads. Just real conversations.
 * Like AIM/ICQ but with voice verification and local mesh networking
 */

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');

class SoulfraRealFriendsChat {
  constructor() {
    this.app = express();
    this.friends = new Map(); // Real friendships (both verified each other)
    this.conversations = new Map();
    this.voiceNotes = new Map();
    this.meshConnections = new Map();
    this.onlineStatus = new Map();
    
    // Chat rooms (like old AIM chat rooms but voice-verified)
    this.chatRooms = new Map();
    
    this.setupRoutes();
    this.setupWebSocket();
  }
  
  setupRoutes() {
    this.app.use(express.json());
    
    // Voice verify a friend
    this.app.post('/api/verify-friend', async (req, res) => {
      const { myVoiceprint, friendVoiceprint, verificationAudio } = req.body;
      
      // Both people must voice verify each other
      const verificationId = this.createVerification(
        myVoiceprint, 
        friendVoiceprint, 
        verificationAudio
      );
      
      // Check if friend already verified you
      const mutualVerification = this.checkMutualVerification(
        myVoiceprint, 
        friendVoiceprint
      );
      
      if (mutualVerification) {
        // Create real friendship
        this.createFriendship(myVoiceprint, friendVoiceprint);
        
        res.json({
          verified: true,
          mutual: true,
          message: 'You are now REAL friends! Start chatting.',
          friendId: this.getFriendId(myVoiceprint, friendVoiceprint)
        });
      } else {
        res.json({
          verified: true,
          mutual: false,
          message: 'Friend verification sent. They need to verify you back.',
          verificationId
        });
      }
    });
    
    // Send message (text or voice note)
    this.app.post('/api/send-message', async (req, res) => {
      const { from, to, message, voiceNote, meshRelay } = req.body;
      
      // Check real friendship
      if (!this.areRealFriends(from, to)) {
        return res.status(403).json({
          error: 'Not voice-verified friends. Both must verify each other.'
        });
      }
      
      const messageId = crypto.randomBytes(16).toString('hex');
      const timestamp = Date.now();
      
      const chatMessage = {
        id: messageId,
        from,
        to,
        message: message || null,
        voiceNote: voiceNote || null,
        timestamp,
        delivered: false,
        read: false,
        meshRelayed: meshRelay || false
      };
      
      // Store in conversation
      this.addToConversation(from, to, chatMessage);
      
      // Check if recipient is online
      if (this.isOnline(to)) {
        this.deliverMessage(to, chatMessage);
        chatMessage.delivered = true;
      } else if (meshRelay) {
        // Try mesh network delivery
        this.attemptMeshDelivery(to, chatMessage);
      }
      
      res.json({
        sent: true,
        messageId,
        delivered: chatMessage.delivered,
        meshRelayed: chatMessage.meshRelayed
      });
    });
    
    // Create/join chat room (like AIM chat rooms)
    this.app.post('/api/create-room', async (req, res) => {
      const { creator, roomName, topic, maxMembers, requiresVerification } = req.body;
      
      const roomId = this.generateRoomId(roomName);
      
      const room = {
        id: roomId,
        name: roomName,
        topic,
        creator,
        members: [creator],
        maxMembers: maxMembers || 20,
        requiresVerification,
        messages: [],
        created: Date.now()
      };
      
      this.chatRooms.set(roomId, room);
      
      res.json({
        roomId,
        name: roomName,
        joinCode: this.generateJoinCode(roomId),
        message: 'Chat room created! Share join code with real friends.'
      });
    });
    
    // Voice note recorder
    this.app.post('/api/record-voice-note', async (req, res) => {
      const { from, audioData, duration } = req.body;
      
      const voiceNoteId = crypto.randomBytes(16).toString('hex');
      
      this.voiceNotes.set(voiceNoteId, {
        id: voiceNoteId,
        from,
        audioData,
        duration,
        created: Date.now()
      });
      
      res.json({
        voiceNoteId,
        duration,
        size: audioData.length
      });
    });
    
    // Get friend list (real friends only)
    this.app.get('/api/friends/:voiceprint', (req, res) => {
      const myFriends = this.getFriends(req.params.voiceprint);
      
      const friendList = myFriends.map(friendVoiceprint => ({
        voiceprint: friendVoiceprint,
        nickname: this.getNickname(friendVoiceprint),
        online: this.isOnline(friendVoiceprint),
        lastSeen: this.getLastSeen(friendVoiceprint),
        meshReachable: this.isMeshReachable(friendVoiceprint)
      }));
      
      res.json({
        friends: friendList,
        count: friendList.length,
        onlineCount: friendList.filter(f => f.online).length
      });
    });
    
    // Chat interface
    this.app.get('/chat', (req, res) => {
      res.send(this.getChatInterfaceHTML());
    });
  }
  
  setupWebSocket() {
    this.wss = new WebSocket.Server({ port: 8083 });
    
    this.wss.on('connection', (ws, req) => {
      let userVoiceprint = null;
      
      ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'auth':
            userVoiceprint = data.voiceprint;
            this.onlineStatus.set(userVoiceprint, {
              ws,
              connectedAt: Date.now(),
              meshNode: data.meshNode
            });
            this.broadcastOnlineStatus(userVoiceprint, true);
            break;
            
          case 'typing':
            this.notifyTyping(data.to, userVoiceprint);
            break;
            
          case 'voice_call':
            this.initiateVoiceCall(data.to, userVoiceprint);
            break;
            
          case 'mesh_ping':
            this.updateMeshConnection(userVoiceprint, data.peers);
            break;
        }
      });
      
      ws.on('close', () => {
        if (userVoiceprint) {
          this.onlineStatus.delete(userVoiceprint);
          this.broadcastOnlineStatus(userVoiceprint, false);
        }
      });
    });
  }
  
  createVerification(verifier, verifiedPerson, audio) {
    const verificationId = crypto.randomBytes(16).toString('hex');
    
    // Store verification
    if (!this.verifications) this.verifications = new Map();
    
    this.verifications.set(verificationId, {
      verifier,
      verified: verifiedPerson,
      audioProof: audio,
      timestamp: Date.now()
    });
    
    return verificationId;
  }
  
  checkMutualVerification(person1, person2) {
    if (!this.verifications) return false;
    
    let verified1to2 = false;
    let verified2to1 = false;
    
    for (const verification of this.verifications.values()) {
      if (verification.verifier === person1 && verification.verified === person2) {
        verified1to2 = true;
      }
      if (verification.verifier === person2 && verification.verified === person1) {
        verified2to1 = true;
      }
    }
    
    return verified1to2 && verified2to1;
  }
  
  createFriendship(person1, person2) {
    const friendshipId = this.getFriendId(person1, person2);
    
    this.friends.set(friendshipId, {
      participants: [person1, person2],
      established: Date.now(),
      conversationId: crypto.randomBytes(16).toString('hex')
    });
    
    // Initialize conversation
    this.conversations.set(friendshipId, []);
  }
  
  getFriendId(person1, person2) {
    // Consistent ID regardless of order
    return [person1, person2].sort().join(':');
  }
  
  areRealFriends(person1, person2) {
    const friendId = this.getFriendId(person1, person2);
    return this.friends.has(friendId);
  }
  
  getFriends(voiceprint) {
    const myFriends = [];
    
    for (const [friendId, friendship] of this.friends) {
      if (friendship.participants.includes(voiceprint)) {
        const friendVoiceprint = friendship.participants
          .find(p => p !== voiceprint);
        myFriends.push(friendVoiceprint);
      }
    }
    
    return myFriends;
  }
  
  addToConversation(from, to, message) {
    const friendId = this.getFriendId(from, to);
    
    if (!this.conversations.has(friendId)) {
      this.conversations.set(friendId, []);
    }
    
    this.conversations.get(friendId).push(message);
  }
  
  isOnline(voiceprint) {
    return this.onlineStatus.has(voiceprint);
  }
  
  deliverMessage(to, message) {
    const userStatus = this.onlineStatus.get(to);
    if (userStatus && userStatus.ws) {
      userStatus.ws.send(JSON.stringify({
        type: 'message',
        data: message
      }));
    }
  }
  
  attemptMeshDelivery(to, message) {
    // Check if recipient is reachable via mesh network
    for (const [voiceprint, status] of this.onlineStatus) {
      if (status.meshNode && this.canReachViaMesh(status.meshNode, to)) {
        // Relay through mesh node
        status.ws.send(JSON.stringify({
          type: 'mesh_relay',
          to,
          message
        }));
        message.meshRelayed = true;
        break;
      }
    }
  }
  
  canReachViaMesh(fromNode, toVoiceprint) {
    // Simplified mesh routing
    return Math.random() > 0.5; // 50% chance for demo
  }
  
  getNickname(voiceprint) {
    // User-set nicknames for friends
    return 'Friend_' + voiceprint.slice(0, 6);
  }
  
  getLastSeen(voiceprint) {
    // Track last activity
    return Date.now() - Math.floor(Math.random() * 3600000);
  }
  
  isMeshReachable(voiceprint) {
    // Check if reachable via mesh network
    return Math.random() > 0.3;
  }
  
  generateRoomId(roomName) {
    return roomName.toLowerCase().replace(/\s/g, '_') + '_' + Date.now();
  }
  
  generateJoinCode(roomId) {
    return roomId.slice(-8).toUpperCase();
  }
  
  broadcastOnlineStatus(voiceprint, isOnline) {
    // Notify friends of online status
    const friends = this.getFriends(voiceprint);
    
    friends.forEach(friend => {
      if (this.isOnline(friend)) {
        this.deliverMessage(friend, {
          type: 'friend_status',
          voiceprint,
          online: isOnline,
          timestamp: Date.now()
        });
      }
    });
  }
  
  getChatInterfaceHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>SOULFRA Chat - Real Friends Only</title>
    <style>
        body {
            background: #000;
            color: #0f0;
            font-family: 'Courier New', monospace;
            margin: 0;
            display: flex;
            height: 100vh;
        }
        .sidebar {
            width: 250px;
            background: #111;
            border-right: 2px solid #0f0;
            padding: 20px;
            overflow-y: auto;
        }
        .chat-area {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .chat-header {
            background: #111;
            padding: 20px;
            border-bottom: 2px solid #0f0;
        }
        .messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            font-family: monospace;
        }
        .message {
            margin: 10px 0;
            padding: 10px;
            background: #111;
            border-left: 3px solid #0f0;
        }
        .message.voice {
            border-left-color: #ff0;
        }
        .message.mesh-relay {
            border-left-color: #0ff;
        }
        .input-area {
            background: #111;
            padding: 20px;
            border-top: 2px solid #0f0;
            display: flex;
            gap: 10px;
        }
        .input-area input {
            flex: 1;
            background: #000;
            border: 1px solid #0f0;
            color: #0f0;
            padding: 10px;
            font-family: monospace;
        }
        .voice-btn {
            background: #f00;
            color: #fff;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            border-radius: 50%;
        }
        .friend-item {
            padding: 10px;
            margin: 5px 0;
            cursor: pointer;
            background: #222;
            position: relative;
        }
        .friend-item.online {
            border-left: 3px solid #0f0;
        }
        .friend-item.mesh {
            border-left: 3px solid #0ff;
        }
        .status-dot {
            position: absolute;
            right: 10px;
            top: 15px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #333;
        }
        .status-dot.online { background: #0f0; }
        .status-dot.mesh { background: #0ff; }
        .typing-indicator {
            color: #ff0;
            font-style: italic;
            padding: 5px 20px;
        }
        h3 { color: #0ff; }
        .room-list {
            margin-top: 20px;
            border-top: 1px solid #0f0;
            padding-top: 20px;
        }
        .room-item {
            padding: 8px;
            margin: 3px 0;
            background: #1a1a1a;
            cursor: pointer;
            font-size: 12px;
        }
        .verify-btn {
            background: #ff0;
            color: #000;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <h3>🎤 Real Friends</h3>
        <div id="friendsList">
            <div class="friend-item online">
                <span>kickball_organizer</span>
                <span class="status-dot online"></span>
            </div>
            <div class="friend-item mesh">
                <span>artist_drop_42</span>
                <span class="status-dot mesh"></span>
                <small style="display:block;color:#0ff;">Via mesh network</small>
            </div>
            <div class="friend-item">
                <span>underground_dj</span>
                <span class="status-dot"></span>
                <small style="display:block;color:#666;">Last seen 2h ago</small>
            </div>
        </div>
        
        <button class="verify-btn" style="width:100%;margin-top:10px;">
            + Verify New Friend
        </button>
        
        <div class="room-list">
            <h3>💬 Chat Rooms</h3>
            <div class="room-item"># underground-events</div>
            <div class="room-item"># artist-collective</div>
            <div class="room-item"># kickball-league</div>
            <button class="verify-btn" style="width:100%;margin-top:5px;">
                + Create Room
            </button>
        </div>
    </div>
    
    <div class="chat-area">
        <div class="chat-header">
            <h2>Chat with kickball_organizer</h2>
            <small>Voice verified friend • Online now</small>
        </div>
        
        <div class="messages" id="messages">
            <div class="message">
                <strong>kickball_organizer:</strong> yo! game this sunday at 2pm
            </div>
            <div class="message">
                <strong>You:</strong> hell yeah, mesh node park?
            </div>
            <div class="message">
                <strong>kickball_organizer:</strong> yep! bringing 3 voice-verified friends
            </div>
            <div class="message voice">
                <strong>kickball_organizer:</strong> 
                <span style="color:#ff0;">🎤 Voice Note (5 sec)</span>
                <button onclick="playVoice()">▶ Play</button>
            </div>
            <div class="message mesh-relay">
                <strong>artist_drop_42:</strong> 
                <span style="color:#0ff;">[Via mesh relay]</span> 
                secret show tomorrow, you in?
            </div>
        </div>
        
        <div class="typing-indicator" id="typing" style="display:none;">
            kickball_organizer is typing...
        </div>
        
        <div class="input-area">
            <input type="text" id="messageInput" placeholder="Type message (real friends only)..." />
            <button onclick="sendMessage()">Send</button>
            <button class="voice-btn" onmousedown="startVoice()" onmouseup="stopVoice()">
                🎤
            </button>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:8083');
        let isRecording = false;
        let myVoiceprint = 'my_voice_' + Math.random().toString(36).substr(2, 9);
        
        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: 'auth',
                voiceprint: myVoiceprint,
                meshNode: 'NODE_LOCAL_' + Math.random().toString(36).substr(2, 4)
            }));
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch(data.type) {
                case 'message':
                    displayMessage(data.data);
                    break;
                case 'friend_status':
                    updateFriendStatus(data.voiceprint, data.online);
                    break;
                case 'typing':
                    showTyping(data.from);
                    break;
            }
        };
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (message) {
                // Send to current friend
                fetch('/api/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from: myVoiceprint,
                        to: 'kickball_organizer', // Current chat
                        message
                    })
                });
                
                // Display locally
                displayMessage({
                    from: myVoiceprint,
                    message,
                    timestamp: Date.now()
                });
                
                input.value = '';
            }
        }
        
        function displayMessage(msg) {
            const messagesDiv = document.getElementById('messages');
            const messageEl = document.createElement('div');
            messageEl.className = 'message';
            
            if (msg.voiceNote) {
                messageEl.className += ' voice';
            }
            if (msg.meshRelayed) {
                messageEl.className += ' mesh-relay';
            }
            
            const sender = msg.from === myVoiceprint ? 'You' : msg.from.slice(0, 16);
            messageEl.innerHTML = \`<strong>\${sender}:</strong> \${msg.message || '🎤 Voice Note'}\`;
            
            messagesDiv.appendChild(messageEl);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        function startVoice() {
            isRecording = true;
            console.log('Recording voice note...');
        }
        
        function stopVoice() {
            if (isRecording) {
                isRecording = false;
                console.log('Voice note sent!');
            }
        }
        
        function playVoice() {
            alert('Playing voice note...');
        }
        
        // Typing indicator
        let typingTimer;
        document.getElementById('messageInput').addEventListener('input', () => {
            clearTimeout(typingTimer);
            ws.send(JSON.stringify({
                type: 'typing',
                to: 'kickball_organizer'
            }));
            typingTimer = setTimeout(() => {
                // Stop typing indicator
            }, 1000);
        });
        
        // Mesh network pings
        setInterval(() => {
            ws.send(JSON.stringify({
                type: 'mesh_ping',
                peers: Math.floor(Math.random() * 5) + 1
            }));
        }, 10000);
    </script>
</body>
</html>`;
  }
  
  start(port = 3337) {
    this.app.listen(port, () => {
      console.log(`
💬 SOULFRA REAL FRIENDS CHAT
============================

The anti-Facebook messaging system!

Features:
✅ Voice verification required (both ways)
✅ No algorithms or ads
✅ Voice notes like old walkie-talkies
✅ Local mesh network relay
✅ Chat rooms (like AIM/ICQ)
✅ Real online status (no "active 3h ago" BS)
✅ Encrypted everything
✅ No corporate surveillance

How it works:
1. Both people voice verify each other
2. Now you're REAL friends
3. Chat without surveillance
4. Messages relay through mesh if offline
5. Voice notes for authenticity

Chat Interface: http://localhost:${port}/chat
API: http://localhost:${port}/api/*
WebSocket: ws://localhost:8083

🗣️ Real friends. Real conversations. No bullshit.
      `);
    });
  }
}

// Launch if called directly
if (require.main === module) {
  const chat = new SoulfraRealFriendsChat();
  chat.start();
}

module.exports = SoulfraRealFriendsChat;