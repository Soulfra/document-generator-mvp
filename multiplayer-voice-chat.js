#!/usr/bin/env node

/**
 * 🗣️ MULTIPLAYER VOICE CHAT SYSTEM
 * Enables real-time voice and text collaboration for MVP generation
 * Integrates with Document Generator and gaming systems
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

class MultiplayerVoiceChatSystem {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = 9707;
        this.rooms = new Map();
        this.users = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
        
        console.log('🗣️ Multiplayer Voice Chat System initializing...');
    }
    
    setupMiddleware() {
        this.app.use(express.static('public'));
        this.app.use(express.json());
        
        // CORS middleware
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });
    }
    
    setupRoutes() {
        // Main chat interface
        this.app.get('/', (req, res) => {
            res.send(this.generateChatInterface());
        });
        
        // API endpoints
        this.app.get('/api/rooms', (req, res) => {
            const roomList = Array.from(this.rooms.entries()).map(([id, room]) => ({
                id,
                name: room.name,
                users: room.users.length,
                project: room.project,
                created: room.created
            }));
            
            res.json(roomList);
        });
        
        this.app.post('/api/rooms', (req, res) => {
            const { name, project } = req.body;
            const roomId = this.generateRoomId();
            
            const room = {
                id: roomId,
                name: name || `Room ${roomId}`,
                project: project || 'Document MVP',
                users: [],
                messages: [],
                documents: [],
                created: new Date().toISOString()
            };
            
            this.rooms.set(roomId, room);
            
            console.log(`🏠 Room created: ${room.name} (${roomId})`);
            res.json(room);
        });
        
        this.app.get('/api/rooms/:roomId', (req, res) => {
            const room = this.rooms.get(req.params.roomId);
            if (room) {
                res.json(room);
            } else {
                res.status(404).json({ error: 'Room not found' });
            }
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`👤 User connected: ${socket.id}`);
            
            // User joins room
            socket.on('join-room', (data) => {
                const { roomId, username, team } = data;
                const room = this.rooms.get(roomId);
                
                if (room) {
                    socket.join(roomId);
                    
                    const user = {
                        id: socket.id,
                        username: username || `User_${socket.id.slice(0, 6)}`,
                        team: team || 'neutral',
                        joinedAt: new Date().toISOString(),
                        speaking: false
                    };
                    
                    this.users.set(socket.id, { ...user, roomId });
                    room.users.push(user);
                    
                    // Notify room of new user
                    this.io.to(roomId).emit('user-joined', {
                        user,
                        room: {
                            id: roomId,
                            name: room.name,
                            userCount: room.users.length
                        }
                    });
                    
                    // Send room state to new user
                    socket.emit('room-state', {
                        room,
                        users: room.users,
                        messages: room.messages.slice(-50) // Last 50 messages
                    });
                    
                    console.log(`👤 ${user.username} joined ${room.name} (Team: ${user.team})`);
                }
            });
            
            // Chat message
            socket.on('chat-message', (data) => {
                const user = this.users.get(socket.id);
                if (user) {
                    const room = this.rooms.get(user.roomId);
                    if (room) {
                        const message = {
                            id: Date.now(),
                            userId: socket.id,
                            username: user.username,
                            team: user.team,
                            message: data.message,
                            type: data.type || 'text',
                            timestamp: new Date().toISOString()
                        };
                        
                        room.messages.push(message);
                        
                        // Broadcast to room
                        this.io.to(user.roomId).emit('new-message', message);
                        
                        console.log(`💬 ${user.username}: ${data.message}`);
                    }
                }
            });
            
            // Voice activity
            socket.on('voice-activity', (data) => {
                const user = this.users.get(socket.id);
                if (user) {
                    user.speaking = data.speaking;
                    
                    // Notify room of voice activity
                    socket.to(user.roomId).emit('user-voice-activity', {
                        userId: socket.id,
                        username: user.username,
                        speaking: data.speaking
                    });
                }
            });
            
            // WebRTC signaling for voice chat
            socket.on('webrtc-offer', (data) => {
                socket.to(data.targetUserId).emit('webrtc-offer', {
                    offer: data.offer,
                    fromUserId: socket.id
                });
            });
            
            socket.on('webrtc-answer', (data) => {
                socket.to(data.targetUserId).emit('webrtc-answer', {
                    answer: data.answer,
                    fromUserId: socket.id
                });
            });
            
            socket.on('webrtc-ice-candidate', (data) => {
                socket.to(data.targetUserId).emit('webrtc-ice-candidate', {
                    candidate: data.candidate,
                    fromUserId: socket.id
                });
            });
            
            // Document sharing
            socket.on('share-document', (data) => {
                const user = this.users.get(socket.id);
                if (user) {
                    const room = this.rooms.get(user.roomId);
                    if (room) {
                        const document = {
                            id: Date.now(),
                            name: data.name,
                            content: data.content,
                            type: data.type,
                            sharedBy: user.username,
                            timestamp: new Date().toISOString()
                        };
                        
                        room.documents.push(document);
                        
                        // Notify room
                        this.io.to(user.roomId).emit('document-shared', document);
                        
                        console.log(`📄 ${user.username} shared document: ${document.name}`);
                    }
                }
            });
            
            // MVP generation collaboration
            socket.on('start-mvp-generation', (data) => {
                const user = this.users.get(socket.id);
                if (user) {
                    // Notify room that MVP generation started
                    this.io.to(user.roomId).emit('mvp-generation-started', {
                        initiatedBy: user.username,
                        document: data.document,
                        timestamp: new Date().toISOString()
                    });
                    
                    console.log(`🚀 ${user.username} started MVP generation`);
                }
            });
            
            // Disconnect handling
            socket.on('disconnect', () => {
                const user = this.users.get(socket.id);
                if (user) {
                    const room = this.rooms.get(user.roomId);
                    if (room) {
                        // Remove user from room
                        room.users = room.users.filter(u => u.id !== socket.id);
                        
                        // Notify room
                        this.io.to(user.roomId).emit('user-left', {
                            userId: socket.id,
                            username: user.username
                        });
                        
                        console.log(`👤 ${user.username} left ${room.name}`);
                    }
                    
                    this.users.delete(socket.id);
                }
            });
        });
    }
    
    generateChatInterface() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🗣️ Multiplayer Voice Chat - Document Generator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff88;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: rgba(0, 255, 136, 0.1);
            padding: 15px;
            border-bottom: 2px solid #00ff88;
            text-align: center;
        }
        
        .main-container {
            flex: 1;
            display: grid;
            grid-template-columns: 250px 1fr 250px;
            gap: 10px;
            padding: 10px;
            overflow: hidden;
        }
        
        .sidebar {
            background: rgba(26, 26, 46, 0.8);
            border: 1px solid #00ff88;
            border-radius: 8px;
            padding: 15px;
            overflow-y: auto;
        }
        
        .chat-container {
            background: rgba(26, 26, 46, 0.8);
            border: 1px solid #00ff88;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
        }
        
        .chat-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            border-bottom: 1px solid #333;
        }
        
        .message {
            margin: 10px 0;
            padding: 8px 12px;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.4);
        }
        
        .message.save-or-sink { border-left: 4px solid #00ff88; }
        .message.deal-or-delete { border-left: 4px solid #ff6666; }
        .message.neutral { border-left: 4px solid #888; }
        
        .message-header {
            font-size: 0.9em;
            color: #888;
            margin-bottom: 4px;
        }
        
        .chat-input {
            display: flex;
            padding: 15px;
            gap: 10px;
        }
        
        .chat-input input {
            flex: 1;
            padding: 10px;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid #00ff88;
            border-radius: 4px;
            color: #00ff88;
        }
        
        .chat-input button {
            padding: 10px 15px;
            background: #00ff88;
            color: #001122;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .user-list {
            list-style: none;
            margin: 10px 0;
        }
        
        .user-item {
            padding: 8px;
            margin: 5px 0;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 4px;
            position: relative;
        }
        
        .user-item.speaking {
            border: 2px solid #ffff00;
            animation: pulse 1s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .voice-controls {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 15px 0;
        }
        
        .voice-btn {
            padding: 10px;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid #00ff88;
            border-radius: 4px;
            color: #00ff88;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .voice-btn:hover {
            background: rgba(0, 255, 136, 0.1);
        }
        
        .voice-btn.active {
            background: #00ff88;
            color: #001122;
        }
        
        .document-upload {
            margin: 15px 0;
        }
        
        .upload-area {
            border: 2px dashed #00ff88;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
        }
        
        .upload-area:hover {
            background: rgba(0, 255, 136, 0.1);
        }
    </style>
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>
    <div class="header">
        <h1>🗣️ Multiplayer Voice Chat</h1>
        <p>Real-time collaboration for MVP generation</p>
    </div>
    
    <div class="main-container">
        <!-- Left Sidebar - Users & Voice -->
        <div class="sidebar">
            <h3>👥 Team Members</h3>
            <ul class="user-list" id="userList">
                <!-- Users will be populated here -->
            </ul>
            
            <div class="voice-controls">
                <button class="voice-btn" id="micBtn" onclick="toggleMic()">🎤 Enable Mic</button>
                <button class="voice-btn" id="speakerBtn" onclick="toggleSpeaker()">🔊 Enable Speaker</button>
                <button class="voice-btn" onclick="startVoiceChat()">📞 Join Voice</button>
            </div>
            
            <div class="document-upload">
                <h4>📄 Share Document</h4>
                <div class="upload-area" onclick="document.getElementById('docInput').click()">
                    <p>Click to upload</p>
                    <input type="file" id="docInput" style="display: none;" onchange="shareDocument(this.files[0])">
                </div>
            </div>
        </div>
        
        <!-- Center - Chat -->
        <div class="chat-container">
            <div class="chat-messages" id="chatMessages">
                <div class="message neutral">
                    <div class="message-header">System • Just now</div>
                    <div>Welcome to the multiplayer collaboration space!</div>
                </div>
            </div>
            
            <div class="chat-input">
                <input type="text" id="messageInput" placeholder="Type your message..." onkeypress="handleKeyPress(event)">
                <button onclick="sendMessage()">Send</button>
            </div>
        </div>
        
        <!-- Right Sidebar - Project Info -->
        <div class="sidebar">
            <h3>🚀 Current Project</h3>
            <div id="projectInfo">
                <p><strong>Project:</strong> Document MVP</p>
                <p><strong>Team:</strong> <span id="teamName">SaveOrSink</span></p>
                <p><strong>Status:</strong> <span id="projectStatus">Ready</span></p>
            </div>
            
            <h4>📊 Live Stats</h4>
            <div id="liveStats">
                <p>Messages: <span id="messageCount">0</span></p>
                <p>Voice Active: <span id="voiceActive">0</span></p>
                <p>Documents: <span id="docCount">0</span></p>
            </div>
            
            <h4>🎮 Quick Actions</h4>
            <button class="voice-btn" onclick="generateMVP()">🚀 Generate MVP</button>
            <button class="voice-btn" onclick="openShipRekt()">⚔️ ShipRekt Battle</button>
        </div>
    </div>
    
    <script>
        // Initialize socket connection
        const socket = io();
        
        let micEnabled = false;
        let speakerEnabled = false;
        let localStream = null;
        let peerConnections = new Map();
        
        // Auto-join room on load
        window.addEventListener('load', () => {
            const username = prompt('Enter your username:') || 'Anonymous';
            const team = Math.random() > 0.5 ? 'save-or-sink' : 'deal-or-delete';
            
            socket.emit('join-room', {
                roomId: 'main-collaboration',
                username,
                team
            });
            
            document.getElementById('teamName').textContent = team === 'save-or-sink' ? 'SaveOrSink' : 'DealOrDelete';
        });
        
        // Socket event handlers
        socket.on('user-joined', (data) => {
            addUser(data.user);
            addSystemMessage(\`\${data.user.username} joined the collaboration\`);
        });
        
        socket.on('user-left', (data) => {
            removeUser(data.userId);
            addSystemMessage(\`\${data.username} left the collaboration\`);
        });
        
        socket.on('new-message', (message) => {
            addMessage(message);
            updateMessageCount();
        });
        
        socket.on('user-voice-activity', (data) => {
            updateUserVoiceActivity(data.userId, data.speaking);
        });
        
        socket.on('document-shared', (document) => {
            addSystemMessage(\`📄 \${document.sharedBy} shared: \${document.name}\`);
            updateDocumentCount();
        });
        
        socket.on('mvp-generation-started', (data) => {
            addSystemMessage(\`🚀 \${data.initiatedBy} started MVP generation\`);
            document.getElementById('projectStatus').textContent = 'Generating MVP...';
        });
        
        // Chat functions
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (message) {
                socket.emit('chat-message', { message });
                input.value = '';
            }
        }
        
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
        
        function addMessage(message) {
            const chatMessages = document.getElementById('chatMessages');
            const messageEl = document.createElement('div');
            messageEl.className = \`message \${message.team}\`;
            
            const timeString = new Date(message.timestamp).toLocaleTimeString();
            messageEl.innerHTML = \`
                <div class="message-header">\${message.username} • \${timeString}</div>
                <div>\${message.message}</div>
            \`;
            
            chatMessages.appendChild(messageEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        function addSystemMessage(text) {
            const chatMessages = document.getElementById('chatMessages');
            const messageEl = document.createElement('div');
            messageEl.className = 'message neutral';
            
            messageEl.innerHTML = \`
                <div class="message-header">System • \${new Date().toLocaleTimeString()}</div>
                <div>\${text}</div>
            \`;
            
            chatMessages.appendChild(messageEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        // User management
        function addUser(user) {
            const userList = document.getElementById('userList');
            const userEl = document.createElement('li');
            userEl.className = \`user-item \${user.team}\`;
            userEl.id = \`user-\${user.id}\`;
            userEl.innerHTML = \`
                <div><strong>\${user.username}</strong></div>
                <div style="font-size: 0.8em; color: #888;">\${user.team}</div>
            \`;
            
            userList.appendChild(userEl);
        }
        
        function removeUser(userId) {
            const userEl = document.getElementById(\`user-\${userId}\`);
            if (userEl) {
                userEl.remove();
            }
        }
        
        function updateUserVoiceActivity(userId, speaking) {
            const userEl = document.getElementById(\`user-\${userId}\`);
            if (userEl) {
                if (speaking) {
                    userEl.classList.add('speaking');
                } else {
                    userEl.classList.remove('speaking');
                }
            }
        }
        
        // Voice chat functions
        async function toggleMic() {
            micEnabled = !micEnabled;
            const btn = document.getElementById('micBtn');
            
            if (micEnabled) {
                try {
                    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    btn.textContent = '🎤 Mute Mic';
                    btn.classList.add('active');
                    
                    // Emit voice activity
                    socket.emit('voice-activity', { speaking: true });
                } catch (error) {
                    console.error('Failed to access microphone:', error);
                    micEnabled = false;
                }
            } else {
                if (localStream) {
                    localStream.getTracks().forEach(track => track.stop());
                    localStream = null;
                }
                btn.textContent = '🎤 Enable Mic';
                btn.classList.remove('active');
                
                socket.emit('voice-activity', { speaking: false });
            }
        }
        
        function toggleSpeaker() {
            speakerEnabled = !speakerEnabled;
            const btn = document.getElementById('speakerBtn');
            
            if (speakerEnabled) {
                btn.textContent = '🔇 Mute Speaker';
                btn.classList.add('active');
            } else {
                btn.textContent = '🔊 Enable Speaker';
                btn.classList.remove('active');
            }
        }
        
        function startVoiceChat() {
            addSystemMessage('📞 Voice chat feature coming soon! Use text chat for now.');
        }
        
        // Document sharing
        function shareDocument(file) {
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                socket.emit('share-document', {
                    name: file.name,
                    content: e.target.result,
                    type: file.type
                });
            };
            reader.readAsText(file);
        }
        
        // Project actions
        function generateMVP() {
            socket.emit('start-mvp-generation', {
                document: 'Shared collaboration document'
            });
        }
        
        function openShipRekt() {
            window.open('http://localhost:8889', '_blank');
            addSystemMessage('🏴‍☠️ Opening ShipRekt battle interface');
        }
        
        // Stats updates
        function updateMessageCount() {
            const count = document.querySelectorAll('.message').length;
            document.getElementById('messageCount').textContent = count;
        }
        
        function updateDocumentCount() {
            const current = parseInt(document.getElementById('docCount').textContent);
            document.getElementById('docCount').textContent = current + 1;
        }
        
        // Update voice active count
        setInterval(() => {
            const activeCount = document.querySelectorAll('.user-item.speaking').length;
            document.getElementById('voiceActive').textContent = activeCount;
        }, 1000);
    </script>
</body>
</html>`;
    }
    
    generateRoomId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    start() {
        this.server.listen(this.port, () => {
            console.log('🗣️ MULTIPLAYER VOICE CHAT SYSTEM');
            console.log('=====================================');
            console.log(`⚡ Server running at: http://localhost:${this.port}`);
            console.log(`💬 Chat Interface: http://localhost:${this.port}`);
            console.log(`📡 WebSocket: ws://localhost:${this.port}`);
            console.log(`🎮 Integration: Document Generator + ShipRekt Games`);
            console.log('\n🚀 Ready for multiplayer collaboration!');
        });
    }
}

// Start the service
if (require.main === module) {
    const chatSystem = new MultiplayerVoiceChatSystem();
    chatSystem.start();
}

module.exports = MultiplayerVoiceChatSystem;