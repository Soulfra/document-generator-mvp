#!/usr/bin/env node

/**
 * 📸 SIMPLE SELFIE-TO-PIXEL CHARACTER SYSTEM
 * Working implementation without complex routing
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const sharp = require('sharp');
const crypto = require('crypto');
const AsciiToVoxelConverter = require('./ascii-to-voxel-converter');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class SimpleSelfieSystem {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 42007;
        
        this.characters = new Map();
        this.voxelConverter = new AsciiToVoxelConverter();
        this.hexWorldUrl = 'http://localhost:8300';
        
        this.pixelStyles = {
            'classic-8bit': { size: 8, colors: 16 },
            'modern-pixel': { size: 4, colors: 256 },
            'cyberpunk': { size: 6, colors: 64 }
        };
        
        console.log('📸 Simple Selfie-to-Pixel System starting...');
        this.init();
    }
    
    init() {
        this.app.use(express.json({ limit: '50mb' }));
        
        // Main interface
        this.app.get('/', (req, res) => {
            res.send(this.getInterface());
        });
        
        // Process selfie
        this.app.post('/process-selfie', async (req, res) => {
            try {
                const { imageData, style, name } = req.body;
                const character = await this.processSelfie(imageData, style, name);
                res.json({ success: true, character });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get characters
        this.app.get('/characters', (req, res) => {
            res.json(Array.from(this.characters.values()));
        });
        
        this.server.listen(this.port, () => {
            console.log(`📸 SELFIE SYSTEM: http://localhost:${this.port}`);
            console.log('🎯 Take a selfie and turn it into a pixel character!');
        });
    }
    
    async processSelfie(imageData, style = 'classic-8bit', name = 'Player') {
        const characterId = 'char_' + crypto.randomBytes(6).toString('hex');
        
        // Convert base64 to buffer
        const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Process with Sharp
        const { width, height } = await sharp(imageBuffer).metadata();
        
        // Create pixelated version
        const pixelSize = this.pixelStyles[style]?.size || 8;
        const pixelatedBuffer = await sharp(imageBuffer)
            .resize(32, 32, { fit: 'cover' })
            .raw()
            .toBuffer();
        
        // Generate pixel art data
        const pixelArt = this.generatePixelArt(pixelatedBuffer, pixelSize);
        
        const character = {
            id: characterId,
            name,
            style,
            pixelArt,
            originalSize: { width, height },
            created: Date.now(),
            stats: {
                level: 1,
                xp: 0,
                coins: 0
            }
        };
        
        this.characters.set(characterId, character);
        console.log(`✅ Created character: ${name} (${style})`);
        
        // Bridge to hex world immediately
        await this.bridgeToHexWorld(character);
        
        return character;
    }
    
    generatePixelArt(buffer, pixelSize) {
        const pixels = [];
        const pixelsPerRow = 32;
        const bytesPerPixel = 3; // RGB
        
        console.log(`🎨 Processing image buffer: ${buffer.length} bytes, ${buffer.length / bytesPerPixel} pixels`);
        
        // Process each pixel (3 bytes per pixel for RGB)
        for (let i = 0; i < buffer.length; i += bytesPerPixel) {
            const r = buffer[i];
            const g = buffer[i + 1];
            const b = buffer[i + 2];
            
            // Enhanced grayscale conversion with gamma correction
            const gray = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
            const char = this.grayToChar(gray);
            
            pixels.push(char);
        }
        
        // Verify we have the right number of pixels
        if (pixels.length !== pixelsPerRow * pixelsPerRow) {
            console.warn(`⚠️ Pixel count mismatch: expected ${pixelsPerRow * pixelsPerRow}, got ${pixels.length}`);
        }
        
        // Format into 32x32 grid
        const grid = [];
        for (let y = 0; y < pixelsPerRow; y++) {
            const row = pixels.slice(y * pixelsPerRow, (y + 1) * pixelsPerRow).join('');
            grid.push(row);
        }
        
        // Log a preview of the ASCII art
        console.log('📸 ASCII Preview (first 5 lines):');
        grid.slice(0, 5).forEach(line => console.log('   ' + line.substring(0, 40) + '...'));
        
        return grid.join('\n');
    }
    
    grayToChar(gray) {
        const chars = [' ', '.', ':', ';', 'o', '8', '#', '@'];
        const index = Math.floor((gray / 255) * (chars.length - 1));
        return chars[index];
    }
    
    async bridgeToHexWorld(character) {
        console.log(`🌉 Bridging ${character.name} to hex world...`);
        
        try {
            // Convert ASCII pixel art to 3D voxel data
            const hexCharacter = await this.voxelConverter.bridgeToHexWorld(
                character.pixelArt,
                {
                    name: character.name,
                    position: { q: Math.floor(Math.random() * 5) - 2, r: Math.floor(Math.random() * 5) - 2, s: 0 },
                    stats: character.stats
                },
                this.hexWorldUrl
            );
            
            if (hexCharacter) {
                console.log(`✅ ${character.name} bridged to hex world successfully!`);
                
                // Update character with hex world ID
                character.hexWorldId = hexCharacter.character?.id;
                character.bridged = true;
                character.bridgedAt = Date.now();
                
                return true;
            } else {
                console.log(`❌ Failed to bridge ${character.name} to hex world`);
                return false;
            }
            
        } catch (error) {
            console.error(`🚨 Bridge error for ${character.name}:`, error.message);
            return false;
        }
    }
    
    getInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>📸 Selfie to Pixel Character</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        
        .title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        
        .upload-area {
            border: 3px dashed #ddd;
            border-radius: 15px;
            padding: 40px 20px;
            margin-bottom: 20px;
            cursor: pointer;
            transition: all 0.3s;
            background: #fafafa;
        }
        
        .upload-area:hover, .upload-area.drag-over {
            border-color: #667eea;
            background: #f0f4ff;
        }
        
        .camera-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        
        .upload-text {
            font-size: 18px;
            color: #333;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .upload-subtext {
            color: #666;
            font-size: 14px;
        }
        
        .style-selector {
            margin: 20px 0;
        }
        
        .style-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .style-btn {
            background: #f0f0f0;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 10px 15px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
        }
        
        .style-btn.active, .style-btn:hover {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }
        
        .name-input {
            width: 100%;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 16px;
            margin-bottom: 20px;
            transition: border-color 0.2s;
        }
        
        .name-input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .process-btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
            width: 100%;
        }
        
        .process-btn:hover {
            transform: translateY(-2px);
        }
        
        .process-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .result {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            display: none;
        }
        
        .pixel-preview {
            font-family: 'Courier New', monospace;
            background: #000;
            color: #0f0;
            padding: 15px;
            border-radius: 8px;
            font-size: 8px;
            line-height: 1;
            overflow-x: auto;
            white-space: pre;
            margin-top: 15px;
        }
        
        .character-info {
            text-align: left;
            margin-bottom: 15px;
        }
        
        .hidden {
            display: none;
        }
        
        .loading {
            display: inline-block;
            margin-left: 10px;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title">📸 Selfie to Pixel Character</div>
        <div class="subtitle">Transform your photo into a retro game character</div>
        
        <div class="upload-area" id="uploadArea">
            <div class="camera-icon">📱</div>
            <div class="upload-text">Take a Selfie or Upload Photo</div>
            <div class="upload-subtext">Drag & drop or click to select</div>
        </div>
        
        <input type="file" id="fileInput" accept="image/*" class="hidden">
        
        <div class="style-selector">
            <div style="margin-bottom: 10px; font-weight: 600;">Choose Your Style:</div>
            <div class="style-buttons">
                <div class="style-btn active" data-style="classic-8bit">🕹️ 8-bit Classic</div>
                <div class="style-btn" data-style="modern-pixel">💎 Modern Pixel</div>
                <div class="style-btn" data-style="cyberpunk">🌆 Cyberpunk</div>
            </div>
        </div>
        
        <input type="text" id="nameInput" class="name-input" placeholder="Enter character name..." value="Hero">
        
        <button id="processBtn" class="process-btn" disabled>
            🎨 Create Character
            <span id="loading" class="loading hidden">⚙️</span>
        </button>
        
        <div id="result" class="result">
            <div class="character-info">
                <strong>Character Created:</strong> <span id="charName"></span><br>
                <strong>Style:</strong> <span id="charStyle"></span><br>
                <strong>ID:</strong> <span id="charId"></span>
            </div>
            <div class="pixel-preview" id="pixelPreview"></div>
        </div>
    </div>
    
    <script>
        let selectedImage = null;
        let selectedStyle = 'classic-8bit';
        
        // Upload handling
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const processBtn = document.getElementById('processBtn');
        const nameInput = document.getElementById('nameInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleImageFile(file);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImageFile(file);
            }
        });
        
        function handleImageFile(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                selectedImage = e.target.result;
                processBtn.disabled = false;
                uploadArea.innerHTML = '<div class="camera-icon">✅</div><div class="upload-text">Photo Ready!</div><div class="upload-subtext">Click "Create Character" to continue</div>';
            };
            reader.readAsDataURL(file);
        }
        
        // Style selection
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedStyle = btn.dataset.style;
            });
        });
        
        // Process character
        processBtn.addEventListener('click', async () => {
            if (!selectedImage) return;
            
            processBtn.disabled = true;
            document.getElementById('loading').classList.remove('hidden');
            processBtn.innerHTML = '🎨 Creating Character... <span class="loading">⚙️</span>';
            
            try {
                const response = await fetch('/process-selfie', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageData: selectedImage,
                        style: selectedStyle,
                        name: nameInput.value || 'Hero'
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showResult(result.character);
                } else {
                    alert('Error creating character: ' + result.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            } finally {
                processBtn.disabled = false;
                document.getElementById('loading').classList.add('hidden');
                processBtn.innerHTML = '🎨 Create Character';
            }
        });
        
        function showResult(character) {
            document.getElementById('charName').textContent = character.name;
            document.getElementById('charStyle').textContent = character.style;
            document.getElementById('charId').textContent = character.id;
            document.getElementById('pixelPreview').textContent = character.pixelArt;
            document.getElementById('result').style.display = 'block';
        }
    </script>
</body>
</html>`;
    }
}

// Start the system
new SimpleSelfieSystem();