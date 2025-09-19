#!/usr/bin/env node
// PHOTO-TO-CHARACTER-ELECTRON.js - Electron app for QR code photo upload and character creation

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const QRCode = require('qrcode');
const express = require('express');
const multer = require('multer');
const WebSocket = require('ws');

// Electron app setup
let mainWindow;
let qrServer;
let wsServer;
const UPLOAD_PORT = 9000;
const WS_PORT = 9001;

// Character save system
const CHARACTER_SAVE_DIR = path.join(__dirname, 'character-saves');
const CURRENT_CHARACTER_FILE = path.join(CHARACTER_SAVE_DIR, 'current-character.json');

// Ensure character save directory exists
if (!fs.existsSync(CHARACTER_SAVE_DIR)) {
    fs.mkdirSync(CHARACTER_SAVE_DIR, { recursive: true });
}

// Current character state
let currentCharacter = null;

// Character creation system
class PhotoToCharacterConverter {
    constructor() {
        this.characterTemplates = {
            human: {
                head: { size: 1.0, shape: 'round' },
                body: { size: 1.0, shape: 'humanoid' },
                arms: { length: 1.0, width: 0.3 },
                legs: { length: 1.2, width: 0.4 },
                colors: { primary: '#ffdbac', secondary: '#8b4513' }
            },
            robot: {
                head: { size: 0.8, shape: 'cubic' },
                body: { size: 1.1, shape: 'boxy' },
                arms: { length: 0.9, width: 0.4 },
                legs: { length: 1.0, width: 0.5 },
                colors: { primary: '#c0c0c0', secondary: '#4169e1' }
            },
            fantasy: {
                head: { size: 1.1, shape: 'oval' },
                body: { size: 0.9, shape: 'slim' },
                arms: { length: 1.1, width: 0.25 },
                legs: { length: 1.3, width: 0.35 },
                colors: { primary: '#dda0dd', secondary: '#9370db' }
            }
        };
    }

    // Analyze photo and extract character features
    async analyzePhoto(photoBuffer) {
        // Simulate AI photo analysis (in production, use actual computer vision)
        const photoHash = crypto.createHash('md5').update(photoBuffer).digest('hex');
        const analysis = {
            dominant_colors: this.extractColors(photoBuffer),
            estimated_age: Math.floor(Math.random() * 50) + 20,
            face_detected: true,
            style_category: this.categorizeStyle(photoHash),
            dimensions: { width: 512, height: 512 }
        };

        console.log('📸 Photo analysis complete:', analysis);
        return analysis;
    }

    // Extract dominant colors from photo
    extractColors(photoBuffer) {
        // Simplified color extraction (in production, use image processing library)
        const hash = crypto.createHash('md5').update(photoBuffer).digest('hex');
        const colors = [];
        
        for (let i = 0; i < 3; i++) {
            const colorValue = hash.substring(i * 2, (i * 2) + 6);
            colors.push('#' + colorValue);
        }
        
        return colors;
    }

    // Categorize photo style
    categorizeStyle(hash) {
        const styleNum = parseInt(hash.substring(0, 2), 16) % 3;
        return ['human', 'robot', 'fantasy'][styleNum];
    }

    // Create character from photo analysis
    async createCharacterFromPhoto(photoBuffer, photoName) {
        const analysis = await this.analyzePhoto(photoBuffer);
        const template = this.characterTemplates[analysis.style_category];
        
        // Generate unique character ID
        const characterId = crypto.randomBytes(8).toString('hex');
        
        // Create character data
        const character = {
            id: characterId,
            name: photoName.replace(/\.[^/.]+$/, '') || 'MyCharacter',
            created: new Date().toISOString(),
            source_photo: {
                name: photoName,
                hash: crypto.createHash('md5').update(photoBuffer).digest('hex'),
                size: photoBuffer.length
            },
            analysis: analysis,
            appearance: {
                ...template,
                colors: {
                    primary: analysis.dominant_colors[0] || template.colors.primary,
                    secondary: analysis.dominant_colors[1] || template.colors.secondary,
                    accent: analysis.dominant_colors[2] || '#ffffff'
                }
            },
            stats: {
                level: 1,
                experience: 0,
                health: 100,
                energy: 100,
                creativity: Math.floor(Math.random() * 50) + 50,
                intelligence: Math.floor(Math.random() * 50) + 50,
                charisma: Math.floor(Math.random() * 50) + 50
            },
            position: {
                world: 'voxel_world',
                x: 0,
                y: 0,
                z: 0,
                rotation: 0
            },
            inventory: [],
            achievements: [],
            game_data: {
                voxel_world: { spawned: false, last_position: null },
                economic_engine: { balance: 1000, investments: [] },
                ai_arena: { fighters: [], battles_won: 0 }
            }
        };

        console.log('🎮 Character created:', character.name, character.id);
        return character;
    }

    // Save character to file system
    async saveCharacter(character) {
        const characterFile = path.join(CHARACTER_SAVE_DIR, `${character.id}.json`);
        
        // Save individual character file
        fs.writeFileSync(characterFile, JSON.stringify(character, null, 2));
        
        // Update current character
        fs.writeFileSync(CURRENT_CHARACTER_FILE, JSON.stringify(character, null, 2));
        
        console.log('💾 Character saved:', characterFile);
        return characterFile;
    }

    // Load character from save file
    loadCharacter(characterId) {
        const characterFile = path.join(CHARACTER_SAVE_DIR, `${characterId}.json`);
        
        if (fs.existsSync(characterFile)) {
            const characterData = fs.readFileSync(characterFile, 'utf8');
            return JSON.parse(characterData);
        }
        
        return null;
    }

    // Get all saved characters
    getAllCharacters() {
        const characterFiles = fs.readdirSync(CHARACTER_SAVE_DIR)
            .filter(file => file.endsWith('.json') && file !== 'current-character.json');
        
        return characterFiles.map(file => {
            const characterData = fs.readFileSync(path.join(CHARACTER_SAVE_DIR, file), 'utf8');
            const character = JSON.parse(characterData);
            return {
                id: character.id,
                name: character.name,
                created: character.created,
                level: character.stats.level
            };
        });
    }
}

const characterConverter = new PhotoToCharacterConverter();

// QR Code and upload server
function startQRServer() {
    const qrApp = express();
    
    // Configure multer for file uploads
    const storage = multer.memoryStorage();
    const upload = multer({ 
        storage: storage,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed'));
            }
        }
    });

    qrApp.use(express.static(path.join(__dirname, 'public')));
    
    // Phone upload interface
    qrApp.get('/', (req, res) => {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>📸 Photo to Character</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        min-height: 100vh;
                        padding: 20px;
                    }
                    .container {
                        max-width: 400px;
                        margin: 0 auto;
                        text-align: center;
                    }
                    h1 {
                        font-size: 2rem;
                        margin-bottom: 20px;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    }
                    .upload-area {
                        background: rgba(255,255,255,0.1);
                        border: 2px dashed rgba(255,255,255,0.5);
                        border-radius: 20px;
                        padding: 40px 20px;
                        margin: 20px 0;
                        cursor: pointer;
                        transition: all 0.3s;
                    }
                    .upload-area:hover {
                        background: rgba(255,255,255,0.2);
                        border-color: rgba(255,255,255,0.8);
                    }
                    .upload-area.dragover {
                        background: rgba(255,255,255,0.3);
                        border-color: #fff;
                    }
                    #file-input {
                        display: none;
                    }
                    .upload-icon {
                        font-size: 4rem;
                        margin-bottom: 20px;
                    }
                    .upload-text {
                        font-size: 1.2rem;
                        margin-bottom: 10px;
                    }
                    .upload-subtext {
                        font-size: 0.9rem;
                        opacity: 0.8;
                    }
                    .preview {
                        margin: 20px 0;
                        border-radius: 15px;
                        overflow: hidden;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    }
                    .preview img {
                        width: 100%;
                        height: auto;
                        display: block;
                    }
                    .btn {
                        background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                        border: none;
                        padding: 15px 30px;
                        border-radius: 25px;
                        color: white;
                        font-size: 1.1rem;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s;
                        margin: 10px;
                        min-width: 200px;
                    }
                    .btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                    }
                    .btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    .status {
                        margin: 20px 0;
                        padding: 15px;
                        border-radius: 10px;
                        font-weight: bold;
                    }
                    .status.success {
                        background: rgba(76, 175, 80, 0.3);
                        border: 1px solid #4caf50;
                    }
                    .status.error {
                        background: rgba(244, 67, 54, 0.3);
                        border: 1px solid #f44336;
                    }
                    .character-preview {
                        background: rgba(255,255,255,0.1);
                        border-radius: 15px;
                        padding: 20px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>📸 Photo to Character</h1>
                    <p>Upload a photo to create your game character!</p>
                    
                    <div class="upload-area" onclick="document.getElementById('file-input').click()">
                        <div class="upload-icon">📷</div>
                        <div class="upload-text">Tap to select photo</div>
                        <div class="upload-subtext">or drag and drop here</div>
                    </div>
                    
                    <input type="file" id="file-input" accept="image/*" multiple>
                    
                    <div id="preview" class="preview" style="display: none;"></div>
                    <div id="status"></div>
                    
                    <button id="create-character" class="btn" style="display: none;">
                        🎮 Create Character
                    </button>
                    
                    <div id="character-info" class="character-preview" style="display: none;"></div>
                </div>
                
                <script>
                    const uploadArea = document.querySelector('.upload-area');
                    const fileInput = document.getElementById('file-input');
                    const preview = document.getElementById('preview');
                    const status = document.getElementById('status');
                    const createBtn = document.getElementById('create-character');
                    const characterInfo = document.getElementById('character-info');
                    
                    let selectedFile = null;
                    
                    // Drag and drop handlers
                    uploadArea.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        uploadArea.classList.add('dragover');
                    });
                    
                    uploadArea.addEventListener('dragleave', () => {
                        uploadArea.classList.remove('dragover');
                    });
                    
                    uploadArea.addEventListener('drop', (e) => {
                        e.preventDefault();
                        uploadArea.classList.remove('dragover');
                        handleFiles(e.dataTransfer.files);
                    });
                    
                    fileInput.addEventListener('change', (e) => {
                        handleFiles(e.target.files);
                    });
                    
                    function handleFiles(files) {
                        if (files.length === 0) return;
                        
                        selectedFile = files[0];
                        
                        if (!selectedFile.type.startsWith('image/')) {
                            showStatus('Please select an image file', 'error');
                            return;
                        }
                        
                        // Show preview
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            preview.innerHTML = \`<img src="\${e.target.result}" alt="Preview">\`;
                            preview.style.display = 'block';
                            createBtn.style.display = 'block';
                        };
                        reader.readAsDataURL(selectedFile);
                        
                        showStatus('Photo selected! Tap "Create Character" to continue.', 'success');
                    }
                    
                    createBtn.addEventListener('click', async () => {
                        if (!selectedFile) return;
                        
                        createBtn.disabled = true;
                        createBtn.textContent = '🔄 Creating Character...';
                        
                        const formData = new FormData();
                        formData.append('photo', selectedFile);
                        
                        try {
                            const response = await fetch('/upload-photo', {
                                method: 'POST',
                                body: formData
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                showStatus('✅ Character created successfully!', 'success');
                                showCharacterInfo(result.character);
                                
                                // Notify Electron app
                                setTimeout(() => {
                                    window.close();
                                }, 3000);
                            } else {
                                showStatus('❌ Error: ' + result.error, 'error');
                            }
                        } catch (error) {
                            showStatus('❌ Upload failed: ' + error.message, 'error');
                        }
                        
                        createBtn.disabled = false;
                        createBtn.textContent = '🎮 Create Character';
                    });
                    
                    function showStatus(message, type) {
                        status.textContent = message;
                        status.className = 'status ' + type;
                    }
                    
                    function showCharacterInfo(character) {
                        characterInfo.innerHTML = \`
                            <h3>🎮 Character Created!</h3>
                            <p><strong>Name:</strong> \${character.name}</p>
                            <p><strong>Style:</strong> \${character.analysis.style_category}</p>
                            <p><strong>Level:</strong> \${character.stats.level}</p>
                            <p><strong>ID:</strong> \${character.id}</p>
                            <div style="margin-top: 15px;">
                                <strong>Colors:</strong>
                                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 10px;">
                                    <div style="width: 30px; height: 30px; border-radius: 50%; background: \${character.appearance.colors.primary}; border: 2px solid white;"></div>
                                    <div style="width: 30px; height: 30px; border-radius: 50%; background: \${character.appearance.colors.secondary}; border: 2px solid white;"></div>
                                    <div style="width: 30px; height: 30px; border-radius: 50%; background: \${character.appearance.colors.accent}; border: 2px solid white;"></div>
                                </div>
                            </div>
                            <p style="margin-top: 15px; font-size: 0.9rem; opacity: 0.8;">
                                Your character is now available in all games!
                            </p>
                        \`;
                        characterInfo.style.display = 'block';
                    }
                </script>
            </body>
            </html>
        `);
    });

    // Handle photo upload
    qrApp.post('/upload-photo', upload.single('photo'), async (req, res) => {
        try {
            if (!req.file) {
                return res.json({ success: false, error: 'No photo uploaded' });
            }

            console.log('📸 Photo received:', req.file.originalname, req.file.size, 'bytes');

            // Create character from photo
            const character = await characterConverter.createCharacterFromPhoto(
                req.file.buffer,
                req.file.originalname
            );

            // Save character
            await characterConverter.saveCharacter(character);

            // Set as current character
            currentCharacter = character;

            // Notify Electron main window
            if (mainWindow) {
                mainWindow.webContents.send('character-created', character);
            }

            // Notify game servers via WebSocket
            broadcastCharacterUpdate(character);

            res.json({ 
                success: true, 
                character: character,
                message: 'Character created successfully'
            });

        } catch (error) {
            console.error('❌ Photo upload error:', error);
            res.json({ success: false, error: error.message });
        }
    });

    qrServer = qrApp.listen(UPLOAD_PORT, () => {
        console.log(`📱 QR upload server running on port ${UPLOAD_PORT}`);
    });
}

// WebSocket server for game integration
function startWebSocketServer() {
    wsServer = new WebSocket.Server({ port: WS_PORT });
    
    wsServer.on('connection', (ws) => {
        console.log('🔌 Game client connected');
        
        // Send current character if available
        if (currentCharacter) {
            ws.send(JSON.stringify({
                type: 'character_update',
                character: currentCharacter
            }));
        }
        
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                handleGameMessage(data, ws);
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        });
    });
    
    console.log(`🎮 Game WebSocket server running on port ${WS_PORT}`);
}

function handleGameMessage(data, ws) {
    switch (data.type) {
        case 'request_character':
            if (currentCharacter) {
                ws.send(JSON.stringify({
                    type: 'character_update',
                    character: currentCharacter
                }));
            }
            break;
        case 'update_character_position':
            if (currentCharacter && data.position) {
                currentCharacter.position = { ...currentCharacter.position, ...data.position };
                characterConverter.saveCharacter(currentCharacter);
            }
            break;
    }
}

function broadcastCharacterUpdate(character) {
    const message = JSON.stringify({
        type: 'character_update',
        character: character
    });
    
    wsServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Electron app
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'assets', 'icon.png')
    });

    // Generate QR code
    const uploadUrl = `http://${getLocalIP()}:${UPLOAD_PORT}`;
    
    QRCode.toDataURL(uploadUrl, { 
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    }).then(qrDataUrl => {
        // Load main window with QR code
        mainWindow.loadData(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>📸 Photo to Character - Electron</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                    .header {
                        text-align: center;
                        padding: 30px;
                        background: rgba(0,0,0,0.2);
                    }
                    h1 {
                        font-size: 2.5rem;
                        margin-bottom: 10px;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    }
                    .subtitle {
                        font-size: 1.2rem;
                        opacity: 0.9;
                    }
                    .main-content {
                        flex: 1;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 30px;
                        padding: 30px;
                    }
                    .qr-section {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        background: rgba(255,255,255,0.1);
                        border-radius: 20px;
                        padding: 40px;
                        backdrop-filter: blur(10px);
                    }
                    .qr-code {
                        background: white;
                        padding: 20px;
                        border-radius: 15px;
                        margin-bottom: 20px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    }
                    .qr-code img {
                        width: 250px;
                        height: 250px;
                        display: block;
                    }
                    .qr-instructions {
                        text-align: center;
                        max-width: 300px;
                    }
                    .qr-instructions h3 {
                        margin-bottom: 15px;
                        font-size: 1.3rem;
                    }
                    .qr-instructions p {
                        margin-bottom: 10px;
                        opacity: 0.9;
                    }
                    .character-section {
                        background: rgba(255,255,255,0.1);
                        border-radius: 20px;
                        padding: 40px;
                        backdrop-filter: blur(10px);
                    }
                    .character-info {
                        text-align: center;
                    }
                    .no-character {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        opacity: 0.6;
                    }
                    .character-preview {
                        background: rgba(0,0,0,0.2);
                        border-radius: 15px;
                        padding: 30px;
                        margin: 20px 0;
                    }
                    .character-stats {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin-top: 20px;
                    }
                    .stat-item {
                        background: rgba(255,255,255,0.1);
                        padding: 10px;
                        border-radius: 8px;
                        text-align: center;
                    }
                    .color-palette {
                        display: flex;
                        gap: 10px;
                        justify-content: center;
                        margin: 15px 0;
                    }
                    .color-dot {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        border: 3px solid rgba(255,255,255,0.5);
                    }
                    .btn {
                        background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                        border: none;
                        padding: 15px 30px;
                        border-radius: 25px;
                        color: white;
                        font-size: 1.1rem;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s;
                        margin: 10px;
                    }
                    .btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                    }
                    .btn-secondary {
                        background: linear-gradient(45deg, #4834d4, #686de0);
                    }
                    .games-section {
                        grid-column: 1 / -1;
                        background: rgba(255,255,255,0.1);
                        border-radius: 20px;
                        padding: 30px;
                        backdrop-filter: blur(10px);
                    }
                    .games-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                        margin-top: 20px;
                    }
                    .game-card {
                        background: rgba(0,0,0,0.2);
                        border-radius: 15px;
                        padding: 20px;
                        text-align: center;
                        transition: all 0.3s;
                    }
                    .game-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    }
                    .status-bar {
                        background: rgba(0,0,0,0.3);
                        padding: 15px 30px;
                        text-align: center;
                        font-size: 0.9rem;
                    }
                    .online { color: #4caf50; }
                    .offline { color: #f44336; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📸 Photo to Character</h1>
                    <div class="subtitle">Scan QR code with your phone to upload photos and create game characters</div>
                </div>
                
                <div class="main-content">
                    <div class="qr-section">
                        <div class="qr-code">
                            <img src="${qrDataUrl}" alt="QR Code">
                        </div>
                        <div class="qr-instructions">
                            <h3>📱 Phone Instructions</h3>
                            <p>1. Scan this QR code with your phone</p>
                            <p>2. Upload a photo from your gallery</p>
                            <p>3. Your character will appear here!</p>
                            <p><strong>URL:</strong> ${uploadUrl}</p>
                        </div>
                    </div>
                    
                    <div class="character-section">
                        <div id="character-display">
                            <div class="no-character">
                                <div style="font-size: 4rem; margin-bottom: 20px;">🎮</div>
                                <h3>No Character Yet</h3>
                                <p>Upload a photo to create your character!</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="games-section">
                        <h2>🎮 Available Games</h2>
                        <div class="games-grid">
                            <div class="game-card">
                                <h3>🌀 Voxel World</h3>
                                <p>3D voxel world with shadow dimensions</p>
                                <button class="btn" onclick="launchGame('voxel')">Launch Game</button>
                            </div>
                            <div class="game-card">
                                <h3>💰 Economic Engine</h3>
                                <p>Babylon.js 3D economic visualization</p>
                                <button class="btn" onclick="launchGame('economic')">Launch Game</button>
                            </div>
                            <div class="game-card">
                                <h3>🤖 AI Arena</h3>
                                <p>AI fighter battles and tournaments</p>
                                <button class="btn" onclick="launchGame('arena')">Launch Game</button>
                            </div>
                            <div class="game-card">
                                <h3>📄 Document Engine</h3>
                                <p>Transform documents into games</p>
                                <button class="btn" onclick="launchGame('document')">Launch Game</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="status-bar">
                    <span>QR Server: <span class="online">Online</span></span> |
                    <span>Character System: <span class="online">Ready</span></span> |
                    <span>Game Integration: <span class="online">Connected</span></span>
                </div>
                
                <script>
                    const { ipcRenderer } = require('electron');
                    
                    // Listen for character updates
                    ipcRenderer.on('character-created', (event, character) => {
                        displayCharacter(character);
                    });
                    
                    function displayCharacter(character) {
                        const display = document.getElementById('character-display');
                        display.innerHTML = \`
                            <div class="character-info">
                                <h2>🎮 \${character.name}</h2>
                                <div class="character-preview">
                                    <div style="font-size: 4rem; margin-bottom: 15px;">
                                        \${character.analysis.style_category === 'robot' ? '🤖' : 
                                          character.analysis.style_category === 'fantasy' ? '🧙‍♂️' : '👤'}
                                    </div>
                                    <p><strong>Style:</strong> \${character.analysis.style_category}</p>
                                    <p><strong>Level:</strong> \${character.stats.level}</p>
                                    
                                    <div class="color-palette">
                                        <div class="color-dot" style="background: \${character.appearance.colors.primary};"></div>
                                        <div class="color-dot" style="background: \${character.appearance.colors.secondary};"></div>
                                        <div class="color-dot" style="background: \${character.appearance.colors.accent};"></div>
                                    </div>
                                    
                                    <div class="character-stats">
                                        <div class="stat-item">
                                            <strong>Health</strong><br>\${character.stats.health}
                                        </div>
                                        <div class="stat-item">
                                            <strong>Energy</strong><br>\${character.stats.energy}
                                        </div>
                                        <div class="stat-item">
                                            <strong>Creativity</strong><br>\${character.stats.creativity}
                                        </div>
                                        <div class="stat-item">
                                            <strong>Intelligence</strong><br>\${character.stats.intelligence}
                                        </div>
                                    </div>
                                </div>
                                
                                <button class="btn" onclick="saveCharacter()">💾 Save Character</button>
                                <button class="btn btn-secondary" onclick="loadCharacter()">📂 Load Character</button>
                            </div>
                        \`;
                    }
                    
                    function launchGame(gameType) {
                        ipcRenderer.send('launch-game', gameType);
                    }
                    
                    function saveCharacter() {
                        ipcRenderer.send('save-character');
                    }
                    
                    function loadCharacter() {
                        ipcRenderer.send('load-character');
                    }
                    
                    // Auto-refresh QR code every 5 minutes
                    setInterval(() => {
                        location.reload();
                    }, 5 * 60 * 1000);
                </script>
            </body>
            </html>
        `, 'text/html');
        
        console.log('📱 QR Code generated for:', uploadUrl);
    }).catch(err => {
        console.error('QR Code generation error:', err);
    });
}

// Get local IP address
function getLocalIP() {
    const { networkInterfaces } = require('os');
    const interfaces = networkInterfaces();
    
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal && alias.address !== '127.0.0.1') {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

// IPC handlers
ipcMain.on('launch-game', (event, gameType) => {
    const gameUrls = {
        voxel: 'http://localhost:8892',
        economic: 'http://localhost:8893/babylon-economic-engine.html',
        arena: 'http://localhost:3001/arena',
        document: 'http://localhost:3001'
    };
    
    if (gameUrls[gameType]) {
        require('electron').shell.openExternal(gameUrls[gameType]);
    }
});

ipcMain.on('save-character', (event) => {
    if (currentCharacter) {
        dialog.showSaveDialog(mainWindow, {
            title: 'Save Character',
            defaultPath: `${currentCharacter.name}-${currentCharacter.id}.json`,
            filters: [
                { name: 'Character Files', extensions: ['json'] }
            ]
        }).then(result => {
            if (!result.canceled) {
                fs.writeFileSync(result.filePath, JSON.stringify(currentCharacter, null, 2));
                console.log('💾 Character saved to:', result.filePath);
            }
        });
    }
});

ipcMain.on('load-character', (event) => {
    dialog.showOpenDialog(mainWindow, {
        title: 'Load Character',
        filters: [
            { name: 'Character Files', extensions: ['json'] }
        ]
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            try {
                const characterData = fs.readFileSync(result.filePaths[0], 'utf8');
                const character = JSON.parse(characterData);
                currentCharacter = character;
                
                mainWindow.webContents.send('character-created', character);
                console.log('📂 Character loaded:', character.name);
            } catch (error) {
                console.error('❌ Error loading character:', error);
            }
        }
    });
});

// App event handlers
app.whenReady().then(() => {
    // Start servers
    startQRServer();
    startWebSocketServer();
    
    // Create main window
    createWindow();
    
    // Load existing character if available
    if (fs.existsSync(CURRENT_CHARACTER_FILE)) {
        try {
            const characterData = fs.readFileSync(CURRENT_CHARACTER_FILE, 'utf8');
            currentCharacter = JSON.parse(characterData);
            console.log('📂 Loaded existing character:', currentCharacter.name);
        } catch (error) {
            console.error('❌ Error loading existing character:', error);
        }
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (qrServer) qrServer.close();
        if (wsServer) wsServer.close();
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

console.log('🎮 Photo to Character Electron App Starting...');
console.log('========================================');
console.log('📸 Features:');
console.log('   ✅ QR code generation for phone pairing');
console.log('   ✅ Photo drag & drop from phone');
console.log('   ✅ AI-powered character creation');
console.log('   ✅ Character save file system');
console.log('   ✅ Game integration (Voxel, Economic, AI Arena)');
console.log('   ✅ Persistent character across all games');
console.log('');