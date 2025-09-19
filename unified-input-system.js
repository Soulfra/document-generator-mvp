#!/usr/bin/env node

/**
 * UNIFIED INPUT SYSTEM
 * The missing piece - how everything should flow together
 */

const express = require('express');
const http = require('http');

class UnifiedInputSystem {
    constructor() {
        console.log('🔮 UNIFIED INPUT SYSTEM');
        console.log('🌊 The flow that connects everything together\n');
        
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = 15000;
        
        // This is the unified state that everything flows through
        this.universalState = {
            // Input Sources
            inputs: {
                image: null,          // Drag & drop images
                qr: null,             // QR scan data
                voice: null,          // Voice commands
                text: null,           // Text input
                touch: null,          // Touch gestures
                device: null          // Device sensors
            },
            
            // Processing Engines
            engines: {
                cringeproof: true,    // Filter cringe
                clarity: true,        // Optimize output
                ai: true,             // AI enhancement
                payments: true,       // Payment processing
                blockchain: false     // Blockchain integration
            },
            
            // Output Destinations
            outputs: {
                character: null,      // 3D voxel character
                world: null,          // Hex world position
                payment: null,        // Payment transaction
                nft: null,            // Generated NFT
                game: null            // Game state
            },
            
            // Flow State
            flow: {
                active: false,
                processing: false,
                connections: []
            }
        };
        
        this.init();
    }
    
    init() {
        this.app.use(express.json({ limit: '50mb' }));
        
        // Main unified interface
        this.app.get('/', (req, res) => {
            res.send(this.getUnifiedInterface());
        });
        
        // Universal input endpoint
        this.app.post('/api/input', (req, res) => {
            const result = this.processUniversalInput(req.body);
            res.json(result);
        });
        
        // State endpoint
        this.app.get('/api/state', (req, res) => {
            res.json(this.universalState);
        });
        
        this.server.listen(this.port, () => {
            console.log(`✅ Unified Input System: http://localhost:${this.port}`);
            console.log('🌊 All inputs flow to all outputs through one system');
            console.log('🎯 Drag image → QR scan → Payment → Character → Game\n');
            
            setTimeout(() => {
                require('child_process').exec(`open http://localhost:${this.port}`);
            }, 1000);
        });
    }
    
    processUniversalInput(inputData) {
        const { type, data, options = {} } = inputData;
        
        console.log(`🌊 Processing ${type} input...`);
        
        // Update input state
        this.universalState.inputs[type] = data;
        this.universalState.flow.processing = true;
        
        // Process through all engines
        let processedData = data;
        
        if (this.universalState.engines.cringeproof) {
            processedData = this.applyCringeproofFilter(processedData, type);
        }
        
        if (this.universalState.engines.clarity) {
            processedData = this.applyClarityEngine(processedData, type);
        }
        
        if (this.universalState.engines.ai) {
            processedData = this.applyAIEnhancement(processedData, type);
        }
        
        // Generate outputs based on input type
        const outputs = this.generateOutputs(type, processedData, options);
        
        // Update output state
        Object.keys(outputs).forEach(outputType => {
            this.universalState.outputs[outputType] = outputs[outputType];
        });
        
        // Update flow connections
        this.universalState.flow.connections.push({
            input: type,
            outputs: Object.keys(outputs),
            timestamp: Date.now(),
            data: processedData
        });
        
        this.universalState.flow.processing = false;
        this.universalState.flow.active = true;
        
        return {
            success: true,
            input: { type, data: processedData },
            outputs,
            flow: this.universalState.flow
        };
    }
    
    generateOutputs(inputType, data, options) {
        const outputs = {};
        
        switch (inputType) {
            case 'image':
                // Image → Character → World → Game
                outputs.character = this.createVoxelCharacter(data);
                outputs.world = this.placeInHexWorld(outputs.character);
                outputs.game = this.updateGameState(outputs.character, outputs.world);
                break;
                
            case 'qr':
                // QR → Payment → NFT → Game
                outputs.payment = this.processPayment(data);
                outputs.nft = this.generateNFT(data);
                outputs.game = this.updateGameFromQR(data);
                break;
                
            case 'voice':
                // Voice → AI → Character Action → Game
                outputs.character = this.processVoiceCommand(data);
                outputs.game = this.executeGameAction(data);
                break;
                
            case 'text':
                // Text → AI → All Systems
                outputs.character = this.generateCharacterFromText(data);
                outputs.world = this.createWorldFromText(data);
                outputs.game = this.setupGameFromText(data);
                break;
                
            case 'touch':
                // Touch → Movement → World → Game
                outputs.world = this.handleTouchMovement(data);
                outputs.game = this.updateGameFromTouch(data);
                break;
        }
        
        return outputs;
    }
    
    // Processing engines
    applyCringeproofFilter(data, type) {
        if (type === 'text' && typeof data === 'string') {
            return data.replace(/xXx|420|69|noob|pwn/gi, '***');
        }
        return data;
    }
    
    applyClarityEngine(data, type) {
        // Optimize for mobile/clarity
        if (type === 'image') {
            return { ...data, optimized: true, mobile: true };
        }
        return data;
    }
    
    applyAIEnhancement(data, type) {
        return { ...data, aiEnhanced: true, confidence: 0.95 };
    }
    
    // Output generators
    createVoxelCharacter(imageData) {
        return {
            id: 'char_' + Date.now(),
            voxels: this.imageToVoxels(imageData),
            stats: { level: 1, health: 100, coins: 0 },
            abilities: ['scan_qr', 'move', 'trade']
        };
    }
    
    placeInHexWorld(character) {
        return {
            characterId: character.id,
            position: { q: 0, r: 0, s: 0 },
            worldId: 'main_world',
            environment: 'starting_area'
        };
    }
    
    processPayment(qrData) {
        return {
            amount: Math.floor(Math.random() * 25) + 5,
            currency: 'USD',
            method: 'qr_scan',
            verified: true,
            transactionId: 'txn_' + Date.now()
        };
    }
    
    generateNFT(data) {
        return {
            tokenId: 'nft_' + Date.now(),
            metadata: { source: 'qr_scan', rarity: 'common' },
            imageUrl: '/generated/' + Date.now() + '.png'
        };
    }
    
    updateGameState(character, world) {
        return {
            playerId: character.id,
            gameMode: 'exploration',
            score: 0,
            achievements: [],
            activeQuests: ['first_scan']
        };
    }
    
    imageToVoxels(imageData) {
        // Simplified voxel generation
        const voxels = [];
        for (let i = 0; i < 100; i++) {
            voxels.push({
                x: Math.floor(i % 10),
                y: Math.floor(i / 10),
                z: 0,
                color: '#' + Math.floor(Math.random()*16777215).toString(16)
            });
        }
        return voxels;
    }
    
    updateGameFromQR(qrData) {
        return {
            event: 'treasure_found',
            reward: 'coins',
            amount: 10,
            message: 'Found hidden treasure!'
        };
    }
    
    processVoiceCommand(voiceData) {
        return {
            command: 'move_forward',
            confidence: 0.9,
            response: 'Moving character forward'
        };
    }
    
    executeGameAction(action) {
        return {
            actionType: action,
            success: true,
            effects: ['character_moved', 'coins_gained']
        };
    }
    
    generateCharacterFromText(text) {
        return {
            name: text.substring(0, 15),
            appearance: 'generated_from_text',
            personality: 'friendly'
        };
    }
    
    createWorldFromText(text) {
        return {
            worldName: text + '_world',
            theme: 'adventure',
            size: 'medium'
        };
    }
    
    setupGameFromText(text) {
        return {
            gameType: 'adventure',
            objective: 'explore_and_collect',
            difficulty: 'normal'
        };
    }
    
    handleTouchMovement(touchData) {
        return {
            direction: touchData.direction,
            distance: touchData.distance,
            newPosition: touchData.target
        };
    }
    
    updateGameFromTouch(touchData) {
        return {
            interaction: 'touch_move',
            response: 'character_moved',
            success: true
        };
    }
    
    getUnifiedInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🌊 Unified Input System</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, system-ui, sans-serif;
            background: #000;
            color: #fff;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .title {
            font-size: 48px;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #00ff88, #00aaff, #ff6b6b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
            font-size: 18px;
            color: #888;
            margin-bottom: 20px;
        }
        
        .flow-diagram {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 40px;
            text-align: center;
        }
        
        .flow-chain {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 15px;
            margin: 20px 0;
        }
        
        .flow-item {
            background: rgba(0, 255, 136, 0.1);
            border: 2px solid #00ff88;
            border-radius: 15px;
            padding: 15px 20px;
            font-weight: bold;
            transition: all 0.3s;
        }
        
        .flow-item:hover {
            background: rgba(0, 255, 136, 0.2);
            transform: scale(1.05);
        }
        
        .flow-arrow {
            font-size: 24px;
            color: #00ff88;
        }
        
        .input-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .input-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #333;
            border-radius: 15px;
            padding: 25px;
            transition: all 0.3s;
        }
        
        .input-card:hover {
            background: rgba(0, 255, 136, 0.1);
            border-color: #00ff88;
        }
        
        .input-icon {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
        }
        
        .input-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .input-description {
            font-size: 14px;
            color: #888;
            margin-bottom: 20px;
            line-height: 1.4;
        }
        
        .input-area {
            width: 100%;
            min-height: 60px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px dashed #333;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
        }
        
        .input-area:hover {
            border-color: #00ff88;
            background: rgba(0, 255, 136, 0.1);
        }
        
        .input-area.active {
            border-color: #00ff88;
            background: rgba(0, 255, 136, 0.2);
        }
        
        .input-text {
            width: 100%;
            background: transparent;
            border: none;
            color: #fff;
            font-size: 16px;
            padding: 15px;
            text-align: center;
        }
        
        .input-text::placeholder {
            color: #666;
        }
        
        .output-section {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 40px;
        }
        
        .output-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
            color: #00ff88;
        }
        
        .output-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .output-item {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            transition: all 0.3s;
        }
        
        .output-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 255, 136, 0.3);
        }
        
        .output-icon {
            font-size: 24px;
            margin-bottom: 8px;
            display: block;
        }
        
        .output-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .output-status {
            font-size: 12px;
            opacity: 0.7;
        }
        
        .flow-visualization {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        }
        
        .flow-line {
            position: absolute;
            height: 2px;
            background: linear-gradient(90deg, transparent, #00ff88, transparent);
            animation: flowPulse 3s infinite;
            opacity: 0;
        }
        
        @keyframes flowPulse {
            0%, 100% { opacity: 0; }
            50% { opacity: 0.8; }
        }
        
        .processing-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            padding: 15px 20px;
            border-radius: 10px;
            border: 1px solid #00ff88;
            display: none;
        }
        
        .processing-indicator.active {
            display: block;
        }
        
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(0, 255, 136, 0.3);
            border-top: 2px solid #00ff88;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="flow-visualization" id="flowViz"></div>
    
    <div class="processing-indicator" id="processingIndicator">
        <div class="spinner"></div>
        Processing input through unified system...
    </div>
    
    <div class="container">
        <div class="header">
            <div class="title">🌊 Unified Input System</div>
            <div class="subtitle">Every input flows through every engine to every output</div>
        </div>
        
        <div class="flow-diagram">
            <h3>Universal Flow</h3>
            <div class="flow-chain">
                <div class="flow-item">📸 Any Input</div>
                <div class="flow-arrow">→</div>
                <div class="flow-item">🛠️ All Engines</div>
                <div class="flow-arrow">→</div>
                <div class="flow-item">🎯 All Outputs</div>
            </div>
            <div style="font-size: 14px; color: #888; margin-top: 15px;">
                Drop an image → Get character + world + game + payment + NFT
            </div>
        </div>
        
        <div class="input-section">
            <div class="input-card">
                <span class="input-icon">📸</span>
                <div class="input-title">Image Input</div>
                <div class="input-description">Drag & drop any image to create voxel character, place in world, and start game</div>
                <div class="input-area" ondrop="handleDrop(event, 'image')" ondragover="event.preventDefault()">
                    <div>Drop image here or click to select</div>
                    <input type="file" accept="image/*" style="display: none;" onchange="handleFileSelect(event, 'image')">
                </div>
            </div>
            
            <div class="input-card">
                <span class="input-icon">📱</span>
                <div class="input-title">QR Scan</div>
                <div class="input-description">Scan QR codes to trigger payments, generate NFTs, and update game state</div>
                <div class="input-area" onclick="simulateQRScan()">
                    <div>Tap to simulate QR scan</div>
                </div>
            </div>
            
            <div class="input-card">
                <span class="input-icon">💬</span>
                <div class="input-title">Text Input</div>
                <div class="input-description">Type anything to generate character, world, and game content</div>
                <div class="input-area">
                    <input type="text" class="input-text" placeholder="Type to create everything..." 
                           onkeyup="handleTextInput(event)" maxlength="50">
                </div>
            </div>
            
            <div class="input-card">
                <span class="input-icon">🎤</span>
                <div class="input-title">Voice Input</div>
                <div class="input-description">Speak commands to control character and game actions</div>
                <div class="input-area" onclick="simulateVoiceInput()">
                    <div>Tap to simulate voice command</div>
                </div>
            </div>
            
            <div class="input-card">
                <span class="input-icon">👆</span>
                <div class="input-title">Touch Input</div>
                <div class="input-description">Touch gestures to move character and interact with world</div>
                <div class="input-area" onclick="simulateTouchInput()">
                    <div>Tap to simulate touch gesture</div>
                </div>
            </div>
            
            <div class="input-card">
                <span class="input-icon">📟</span>
                <div class="input-title">Device Sensors</div>
                <div class="input-description">Use device motion and sensors for immersive gameplay</div>
                <div class="input-area" onclick="simulateDeviceInput()">
                    <div>Tap to simulate device sensor</div>
                </div>
            </div>
        </div>
        
        <div class="output-section">
            <div class="output-title">🎯 Universal Outputs</div>
            <div class="output-grid">
                <div class="output-item" id="output-character">
                    <span class="output-icon">🎨</span>
                    <div class="output-name">Voxel Character</div>
                    <div class="output-status">Ready</div>
                </div>
                
                <div class="output-item" id="output-world">
                    <span class="output-icon">🌍</span>
                    <div class="output-name">Hex World</div>
                    <div class="output-status">Ready</div>
                </div>
                
                <div class="output-item" id="output-payment">
                    <span class="output-icon">💳</span>
                    <div class="output-name">Payment</div>
                    <div class="output-status">Ready</div>
                </div>
                
                <div class="output-item" id="output-nft">
                    <span class="output-icon">🖼️</span>
                    <div class="output-name">NFT</div>
                    <div class="output-status">Ready</div>
                </div>
                
                <div class="output-item" id="output-game">
                    <span class="output-icon">🎮</span>
                    <div class="output-name">Game State</div>
                    <div class="output-status">Ready</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let universalState = null;
        
        async function processInput(type, data, options = {}) {
            document.getElementById('processingIndicator').classList.add('active');
            showFlowVisualization(type);
            
            try {
                const response = await fetch('/api/input', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, data, options })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    updateOutputs(result.outputs);
                    showFlowConnections(result.flow.connections);
                    console.log('🌊 Universal flow complete:', result);
                }
                
            } catch (error) {
                console.error('Flow error:', error);
            } finally {
                document.getElementById('processingIndicator').classList.remove('active');
            }
        }
        
        function updateOutputs(outputs) {
            Object.keys(outputs).forEach(outputType => {
                const element = document.getElementById('output-' + outputType);
                if (element) {
                    element.style.background = 'rgba(0, 255, 136, 0.3)';
                    element.querySelector('.output-status').textContent = 'Updated!';
                    
                    setTimeout(() => {
                        element.style.background = 'rgba(0, 255, 136, 0.1)';
                        element.querySelector('.output-status').textContent = 'Ready';
                    }, 2000);
                }
            });
        }
        
        function showFlowVisualization(inputType) {
            const flowViz = document.getElementById('flowViz');
            const line = document.createElement('div');
            line.className = 'flow-line';
            line.style.left = '10%';
            line.style.top = '50%';
            line.style.width = '80%';
            flowViz.appendChild(line);
            
            setTimeout(() => line.remove(), 3000);
        }
        
        function showFlowConnections(connections) {
            console.log('🔗 Flow connections:', connections);
        }
        
        // Input handlers
        function handleDrop(event, type) {
            event.preventDefault();
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    processInput(type, e.target.result);
                };
                reader.readAsDataURL(file);
            }
        }
        
        function handleFileSelect(event, type) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    processInput(type, e.target.result);
                };
                reader.readAsDataURL(file);
            }
        }
        
        function handleTextInput(event) {
            if (event.key === 'Enter' && event.target.value.trim()) {
                processInput('text', event.target.value.trim());
                event.target.value = '';
            }
        }
        
        function simulateQRScan() {
            const mockQR = 'QR_' + Math.random().toString(36).substr(2, 9);
            processInput('qr', mockQR);
        }
        
        function simulateVoiceInput() {
            const commands = ['move forward', 'scan area', 'collect treasure', 'attack enemy'];
            const command = commands[Math.floor(Math.random() * commands.length)];
            processInput('voice', command);
        }
        
        function simulateTouchInput() {
            const touches = [
                { direction: 'up', distance: 50 },
                { direction: 'down', distance: 30 },
                { direction: 'left', distance: 40 },
                { direction: 'right', distance: 60 }
            ];
            const touch = touches[Math.floor(Math.random() * touches.length)];
            processInput('touch', touch);
        }
        
        function simulateDeviceInput() {
            const deviceData = {
                orientation: Math.random() * 360,
                acceleration: Math.random() * 10,
                location: { lat: 37.7749, lng: -122.4194 }
            };
            processInput('device', deviceData);
        }
        
        // Make drop areas clickable
        document.querySelectorAll('.input-area').forEach(area => {
            const fileInput = area.querySelector('input[type="file"]');
            if (fileInput) {
                area.onclick = () => fileInput.click();
            }
        });
        
        console.log('🌊 Unified Input System Ready');
        console.log('🎯 Any input → All engines → All outputs');
    </script>
</body>
</html>`;
    }
}

// Start the unified input system
new UnifiedInputSystem();