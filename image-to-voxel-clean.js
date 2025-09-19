/**
 * IMAGE TO VOXEL CHARACTER SYSTEM
 * Drag & drop images to create 3D voxel characters in game world
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');

class ImageToVoxelCharacter {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 8300;
        
        // Character storage
        this.voxelCharacters = new Map();
        this.activeCharacter = null;
        
        console.log('🎮 IMAGE TO VOXEL CHARACTER SYSTEM');
        console.log('✨ Drag & drop images to create game characters!');
        this.init();
    }
    
    init() {
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.static('public'));
        
        this.app.get('/', (req, res) => {
            res.send(this.getVoxelInterface());
        });
        
        // Image processing endpoint
        this.app.post('/api/image-to-voxel', (req, res) => {
            const { imageData, name } = req.body;
            const character = this.processImageToVoxel(imageData, name);
            res.json({ success: true, character });
        });
        
        // Character management
        this.app.get('/api/characters', (req, res) => {
            res.json(Array.from(this.voxelCharacters.values()));
        });
        
        this.setupWebSocket();
        
        this.server.listen(this.port, () => {
            console.log(`\n✅ VOXEL CHARACTER CREATOR: http://localhost:${this.port}\n`);
            console.log('🎯 FEATURES:');
            console.log('   📸 Drag & drop any image');
            console.log('   🎮 Auto-converts to 3D voxel character');
            console.log('   🌐 Places character in hex game world');
            console.log('   💳 Links to payment/verification system');
            console.log('   🎨 Real-time character customization');
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🎮 Player connected to voxel world');
            
            // Send existing characters
            ws.send(JSON.stringify({
                type: 'world_state',
                characters: Array.from(this.voxelCharacters.values())
            }));
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handleGameCommand(data, ws);
            });
        });
    }
    
    handleGameCommand(data, ws) {
        switch (data.type) {
            case 'move_character':
                this.moveCharacter(data.characterId, data.position);
                this.broadcast({
                    type: 'character_moved',
                    characterId: data.characterId,
                    position: data.position
                });
                break;
                
            case 'character_action':
                this.performAction(data.characterId, data.action);
                break;
                
            case 'scan_qr':
                // Integrate with QR system
                this.scanQRForCharacter(data.characterId, data.qrData);
                break;
        }
    }
    
    processImageToVoxel(imageData, name) {
        console.log(`🎨 Converting image to voxel character: ${name}`);
        
        // Generate unique character ID
        const characterId = 'char_' + crypto.randomBytes(6).toString('hex');
        
        // Convert image to voxel data (simplified)
        const voxelData = this.imageToVoxelData(imageData);
        
        // Create character object
        const character = {
            id: characterId,
            name: name || 'Unnamed Hero',
            voxelData,
            position: { q: 0, r: 0, s: 0 }, // Start at center
            stats: {
                level: 1,
                health: 100,
                energy: 100,
                coins: 0
            },
            abilities: ['scan_qr', 'trade', 'explore'],
            created: Date.now(),
            imageData: imageData.substring(0, 100) + '...', // Store preview
            isActive: true
        };
        
        // Store character
        this.voxelCharacters.set(characterId, character);
        this.activeCharacter = characterId;
        
        // Broadcast new character to all players
        this.broadcast({
            type: 'new_character',
            character
        });
        
        return character;
    }
    
    imageToVoxelData(imageData) {
        // Simplified voxel generation
        // In real implementation, would analyze image pixels
        const size = 16; // 16x16x16 voxel character
        const voxels = [];
        
        // Create basic humanoid shape
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                for (let z = 0; z < size; z++) {
                    // Head (top section)
                    if (y >= 12 && y <= 15) {
                        if (x >= 5 && x <= 10 && z >= 5 && z <= 10) {
                            voxels.push({
                                x, y, z,
                                color: this.getColorFromImage(imageData, x, y, z)
                            });
                        }
                    }
                    // Body
                    else if (y >= 6 && y <= 11) {
                        if (x >= 4 && x <= 11 && z >= 6 && z <= 9) {
                            voxels.push({
                                x, y, z,
                                color: this.getColorFromImage(imageData, x, y, z)
                            });
                        }
                    }
                    // Legs
                    else if (y >= 0 && y <= 5) {
                        if ((x >= 5 && x <= 7 && z >= 6 && z <= 9) ||
                            (x >= 8 && x <= 10 && z >= 6 && z <= 9)) {
                            voxels.push({
                                x, y, z,
                                color: this.getColorFromImage(imageData, x, y, z)
                            });
                        }
                    }
                }
            }
        }
        
        return voxels;
    }
    
    getColorFromImage(imageData, x, y, z) {
        // Extract color from image data
        // Simplified - in real implementation would sample actual pixels
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#dfe6e9'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    moveCharacter(characterId, position) {
        const character = this.voxelCharacters.get(characterId);
        if (character) {
            character.position = position;
            this.voxelCharacters.set(characterId, character);
        }
    }
    
    performAction(characterId, action) {
        const character = this.voxelCharacters.get(characterId);
        if (!character) return;
        
        switch (action) {
            case 'scan':
                console.log(`🔍 ${character.name} is scanning for QR codes...`);
                break;
            case 'trade':
                console.log(`💰 ${character.name} initiated trade`);
                break;
            case 'dance':
                console.log(`🕺 ${character.name} is dancing!`);
                this.broadcast({
                    type: 'character_animation',
                    characterId,
                    animation: 'dance'
                });
                break;
        }
    }
    
    async scanQRForCharacter(characterId, qrData) {
        const character = this.voxelCharacters.get(characterId);
        if (!character) return;
        
        // Integrate with payment system
        try {
            const response = await fetch('http://localhost:8200/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qrData,
                    deviceId: characterId
                })
            });
            
            const result = await response.json();
            if (result.success) {
                character.stats.coins += 10;
                this.broadcast({
                    type: 'character_earned',
                    characterId,
                    coins: 10,
                    reason: 'QR scan'
                });
            }
        } catch (error) {
            console.error('QR scan failed:', error);
        }
    }
    
    broadcast(data) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
    
    getVoxelInterface() {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🎮 Voxel Character Creator</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, system-ui, sans-serif;
            background: #0a0a0a;
            color: #fff;
            overflow: hidden;
        }
        
        #game-container {
            width: 100vw;
            height: 100vh;
            position: relative;
        }
        
        #game-canvas {
            width: 100%;
            height: 100%;
            display: block;
        }
        
        #drop-zone {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 300px;
            border: 3px dashed #00ff88;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            background: rgba(0, 0, 0, 0.8);
            transition: all 0.3s;
            cursor: pointer;
        }
        
        #drop-zone.drag-over {
            background: rgba(0, 255, 136, 0.2);
            transform: translate(-50%, -50%) scale(1.05);
        }
        
        #drop-zone.hidden {
            display: none;
        }
        
        .drop-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        
        .drop-text {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .drop-subtext {
            font-size: 14px;
            color: #888;
        }
        
        #character-info {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #00ff88;
            min-width: 200px;
        }
        
        .character-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #00ff88;
        }
        
        .character-stats {
            font-size: 14px;
            line-height: 1.6;
        }
        
        .stat-bar {
            background: rgba(255, 255, 255, 0.1);
            height: 6px;
            border-radius: 3px;
            margin: 5px 0;
            overflow: hidden;
        }
        
        .stat-fill {
            height: 100%;
            background: #00ff88;
            transition: width 0.3s;
        }
        
        #actions {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
        }
        
        .action-btn {
            background: rgba(0, 255, 136, 0.2);
            border: 1px solid #00ff88;
            color: #00ff88;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s;
        }
        
        .action-btn:hover {
            background: #00ff88;
            color: #000;
        }
        
        #world-info {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 8px;
            font-size: 14px;
        }
        
        .hex-grid {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        
        #file-input {
            display: none;
        }
        
        .voxel-preview {
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 150px;
            height: 150px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #00ff88;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <canvas id="game-canvas"></canvas>
        
        <div id="drop-zone">
            <div class="drop-icon">📸</div>
            <div class="drop-text">Drop Image Here</div>
            <div class="drop-subtext">or click to select</div>
        </div>
        
        <input type="file" id="file-input" accept="image/*">
        
        <div id="character-info" style="display: none;">
            <div class="character-name">Your Character</div>
            <div class="character-stats">
                <div>Level: <span id="level">1</span></div>
                <div>Health: <span id="health">100</span>/100</div>
                <div class="stat-bar"><div class="stat-fill" style="width: 100%"></div></div>
                <div>Coins: <span id="coins">0</span> 🪙</div>
            </div>
        </div>
        
        <div id="world-info">
            <div>🌐 Hex World</div>
            <div>Players: <span id="player-count">1</span></div>
            <div>Location: <span id="location">0, 0</span></div>
        </div>
        
        <div id="actions" style="display: none;">
            <button class="action-btn" onclick="scanQR()">📷 Scan QR</button>
            <button class="action-btn" onclick="performAction('trade')">💰 Trade</button>
            <button class="action-btn" onclick="performAction('dance')">🕺 Dance</button>
            <button class="action-btn" onclick="openPayments()">💳 Pay</button>
        </div>
        
        <div class="voxel-preview" id="voxel-preview"></div>
    </div>
    
    <script>
        let ws;
        let currentCharacter = null;
        let hexGrid = [];
        let characters = new Map();
        
        // Three.js would go here for real 3D rendering
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        
        function init() {
            setupCanvas();
            setupDropZone();
            connectWebSocket();
            drawHexGrid();
            animate();
        }
        
        function setupCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            });
        }
        
        function setupDropZone() {
            const dropZone = document.getElementById('drop-zone');
            const fileInput = document.getElementById('file-input');
            
            dropZone.addEventListener('click', () => fileInput.click());
            
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    processImage(file);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    processImage(file);
                }
            });
        }
        
        function processImage(file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageData = e.target.result;
                const name = prompt('Name your character:', 'Hero');
                
                // Send to server
                const response = await fetch('/api/image-to-voxel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageData, name })
                });
                
                const result = await response.json();
                if (result.success) {
                    currentCharacter = result.character;
                    showCharacter();
                    document.getElementById('drop-zone').classList.add('hidden');
                }
            };
            reader.readAsDataURL(file);
        }
        
        function showCharacter() {
            document.getElementById('character-info').style.display = 'block';
            document.getElementById('actions').style.display = 'flex';
            document.querySelector('.character-name').textContent = currentCharacter.name;
            updateStats();
        }
        
        function updateStats() {
            if (!currentCharacter) return;
            document.getElementById('level').textContent = currentCharacter.stats.level;
            document.getElementById('health').textContent = currentCharacter.stats.health;
            document.getElementById('coins').textContent = currentCharacter.stats.coins;
        }
        
        function connectWebSocket() {
            ws = new WebSocket('ws://' + window.location.host);
            
            ws.onopen = () => {
                console.log('Connected to voxel world');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            };
        }
        
        function handleServerMessage(data) {
            switch (data.type) {
                case 'world_state':
                    data.characters.forEach(char => {
                        characters.set(char.id, char);
                    });
                    break;
                    
                case 'new_character':
                    characters.set(data.character.id, data.character);
                    break;
                    
                case 'character_moved':
                    const char = characters.get(data.characterId);
                    if (char) {
                        char.position = data.position;
                    }
                    break;
                    
                case 'character_earned':
                    if (data.characterId === currentCharacter?.id) {
                        currentCharacter.stats.coins += data.coins;
                        updateStats();
                        showNotification('+' + data.coins + ' coins!');
                    }
                    break;
            }
        }
        
        function drawHexGrid() {
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
            ctx.lineWidth = 1;
            
            const hexSize = 40;
            const hexHeight = hexSize * 2;
            const hexWidth = Math.sqrt(3) * hexSize;
            
            for (let q = -10; q <= 10; q++) {
                for (let r = -10; r <= 10; r++) {
                    const x = hexSize * 3/2 * q + canvas.width / 2;
                    const y = hexSize * Math.sqrt(3) * (r + q/2) + canvas.height / 2;
                    
                    drawHex(x, y, hexSize);
                }
            }
        }
        
        function drawHex(x, y, size) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const xPos = x + size * Math.cos(angle);
                const yPos = y + size * Math.sin(angle);
                
                if (i === 0) {
                    ctx.moveTo(xPos, yPos);
                } else {
                    ctx.lineTo(xPos, yPos);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }
        
        function drawCharacters() {
            characters.forEach(char => {
                if (char.isActive) {
                    const hexSize = 40;
                    const x = hexSize * 3/2 * char.position.q + canvas.width / 2;
                    const y = hexSize * Math.sqrt(3) * (char.position.r + char.position.q/2) + canvas.height / 2;
                    
                    // Draw voxel character (simplified as circle)
                    ctx.fillStyle = '#00ff88';
                    ctx.beginPath();
                    ctx.arc(x, y, 20, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Draw name
                    ctx.fillStyle = '#fff';
                    ctx.font = '12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(char.name, x, y - 30);
                }
            });
        }
        
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawHexGrid();
            drawCharacters();
            requestAnimationFrame(animate);
        }
        
        function scanQR() {
            if (ws && currentCharacter) {
                ws.send(JSON.stringify({
                    type: 'scan_qr',
                    characterId: currentCharacter.id,
                    qrData: 'SCAN_' + Date.now()
                }));
                showNotification('Scanning for QR codes...');
            }
        }
        
        function performAction(action) {
            if (ws && currentCharacter) {
                ws.send(JSON.stringify({
                    type: 'character_action',
                    characterId: currentCharacter.id,
                    action: action
                }));
            }
        }
        
        function openPayments() {
            window.open('http://localhost:8200', '_blank');
        }
        
        function showNotification(text) {
            const notif = document.createElement('div');
            notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #00ff88; color: #000; padding: 20px 40px; border-radius: 8px; font-weight: bold; z-index: 1000; animation: fadeInOut 2s;';
            notif.textContent = text;
            document.body.appendChild(notif);
            
            setTimeout(() => notif.remove(), 2000);
        }
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!currentCharacter || !ws) return;
            
            const moves = {
                'w': { q: 0, r: -1, s: 1 },
                'e': { q: 1, r: -1, s: 0 },
                'd': { q: 1, r: 0, s: -1 },
                's': { q: 0, r: 1, s: -1 },
                'a': { q: -1, r: 1, s: 0 },
                'q': { q: -1, r: 0, s: 1 }
            };
            
            if (moves[e.key]) {
                const newPos = {
                    q: currentCharacter.position.q + moves[e.key].q,
                    r: currentCharacter.position.r + moves[e.key].r,
                    s: currentCharacter.position.s + moves[e.key].s
                };
                
                ws.send(JSON.stringify({
                    type: 'move_character',
                    characterId: currentCharacter.id,
                    position: newPos
                }));
                
                currentCharacter.position = newPos;
                document.getElementById('location').textContent = newPos.q + ', ' + newPos.r;
            }
        });
        
        // Initialize
        init();
    </script>
</body>
</html>`;
        
        return html;
    }
}

// Start the system
new ImageToVoxelCharacter();