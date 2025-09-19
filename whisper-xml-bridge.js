#!/usr/bin/env node

const express = require('express');
const WebSocket = require('ws');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class WhisperXMLBridge {
    constructor() {
        this.app = express();
        this.port = 7908;
        this.wsPort = 7909;
        
        // XML mapping connections
        this.connections = {
            languageProcessor: 'ws://localhost:7901',
            emojiTransformer: 'ws://localhost:7903',
            dungeonMaster: 'ws://localhost:7905',
            orchestrator: 'ws://localhost:7907'
        };
        
        // Active transcription sessions
        this.sessions = new Map();
        
        // XML mapping schemas
        this.xmlSchemas = {
            voice_input: {
                timestamp: 'string',
                speaker_id: 'string',
                confidence: 'float',
                raw_text: 'string',
                language: 'string',
                emotion: 'string',
                intent: 'string'
            },
            menu_mapping: {
                action: 'string',
                target: 'string',
                parameters: 'object',
                unicode_original: 'string',
                emoji_converted: 'string'
            },
            doctor_analysis: {
                symptoms: 'array',
                diagnosis: 'string',
                recommendations: 'array',
                confidence: 'float'
            }
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // File upload for audio
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                const dir = './temp_audio';
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                cb(null, dir);
            },
            filename: (req, file, cb) => {
                cb(null, `audio_${Date.now()}.wav`);
            }
        });
        this.upload = multer({ storage });
    }
    
    setupRoutes() {
        // Main interface
        this.app.get('/', (req, res) => {
            res.send(this.generateInterface());
        });
        
        // Voice transcription endpoint
        this.app.post('/transcribe', this.upload.single('audio'), async (req, res) => {
            try {
                const transcription = await this.processAudio(req.file.path);
                const xmlMapped = await this.mapToXML(transcription);
                
                // Send to connected systems
                this.broadcastToSystems(xmlMapped);
                
                res.json({
                    success: true,
                    transcription,
                    xmlMapped,
                    connectedSystems: this.getSystemStatus()
                });
                
                // Cleanup
                fs.unlinkSync(req.file.path);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Real-time voice streaming
        this.app.post('/stream-voice', express.raw({ type: 'audio/*' }), async (req, res) => {
            try {
                const sessionId = req.headers['session-id'] || this.generateSessionId();
                
                // Process audio chunk
                const tempFile = `./temp_audio/stream_${sessionId}_${Date.now()}.wav`;
                fs.writeFileSync(tempFile, req.body);
                
                const transcription = await this.processAudio(tempFile);
                const xmlMapped = await this.mapToXML(transcription);
                
                // Send to systems
                this.broadcastToSystems(xmlMapped);
                
                res.json({ sessionId, transcription, xmlMapped });
                
                // Cleanup
                fs.unlinkSync(tempFile);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // XML schema endpoint
        this.app.get('/schemas', (req, res) => {
            res.json(this.xmlSchemas);
        });
        
        // Menu/Doctor mapping
        this.app.post('/map-unicode', async (req, res) => {
            try {
                const { unicode, context } = req.body;
                const mapped = await this.mapUnicodeToEmoji(unicode, context);
                res.json(mapped);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 Client connected to Whisper-XML Bridge');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    switch (data.type) {
                        case 'voice_command':
                            const result = await this.processVoiceCommand(data.command);
                            ws.send(JSON.stringify({ type: 'command_result', result }));
                            break;
                            
                        case 'menu_action':
                            const mapped = await this.mapMenuAction(data.action);
                            ws.send(JSON.stringify({ type: 'menu_mapped', mapped }));
                            break;
                            
                        case 'doctor_query':
                            const diagnosis = await this.processDoctorQuery(data.symptoms);
                            ws.send(JSON.stringify({ type: 'diagnosis', diagnosis }));
                            break;
                    }
                } catch (error) {
                    ws.send(JSON.stringify({ type: 'error', error: error.message }));
                }
            });
        });
    }
    
    async processAudio(audioPath) {
        return new Promise((resolve, reject) => {
            // Use whisper.cpp or similar lightweight implementation
            const whisper = spawn('whisper', [
                audioPath,
                '--model', 'tiny',  // Lightweight model
                '--output-format', 'json',
                '--language', 'auto'
            ]);
            
            let output = '';
            
            whisper.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            whisper.on('close', (code) => {
                if (code === 0) {
                    try {
                        // Parse whisper output
                        const result = this.parseWhisperOutput(output);
                        resolve(result);
                    } catch (error) {
                        // Fallback to simple text extraction
                        resolve({
                            text: output.trim(),
                            confidence: 0.8,
                            language: 'en',
                            timestamp: Date.now()
                        });
                    }
                } else {
                    // If whisper not available, use mock transcription
                    resolve({
                        text: 'Mock transcription - install whisper.cpp for real transcription',
                        confidence: 0.5,
                        language: 'en',
                        timestamp: Date.now()
                    });
                }
            });
        });
    }
    
    parseWhisperOutput(output) {
        // Parse whisper JSON output
        try {
            const json = JSON.parse(output);
            return {
                text: json.text || '',
                confidence: json.confidence || 0.8,
                language: json.language || 'en',
                segments: json.segments || [],
                timestamp: Date.now()
            };
        } catch {
            // Fallback parsing
            return {
                text: output.replace(/\[.*?\]/g, '').trim(),
                confidence: 0.7,
                language: 'en',
                timestamp: Date.now()
            };
        }
    }
    
    async mapToXML(transcription) {
        // Map transcription to XML schema
        const xmlData = {
            voice_input: {
                timestamp: new Date(transcription.timestamp).toISOString(),
                speaker_id: 'user_001',
                confidence: transcription.confidence,
                raw_text: transcription.text,
                language: transcription.language,
                emotion: this.detectEmotion(transcription.text),
                intent: await this.detectIntent(transcription.text)
            }
        };
        
        // Convert to XML
        return this.objectToXML(xmlData);
    }
    
    detectEmotion(text) {
        // Simple emotion detection
        const emotions = {
            happy: /happy|good|great|awesome|excited/i,
            sad: /sad|bad|terrible|awful|down/i,
            angry: /angry|mad|furious|pissed/i,
            confused: /confused|lost|unclear|what/i,
            focused: /need|want|do|create|build/i
        };
        
        for (const [emotion, pattern] of Object.entries(emotions)) {
            if (pattern.test(text)) return emotion;
        }
        
        return 'neutral';
    }
    
    async detectIntent(text) {
        // Intent detection based on command patterns
        const intents = {
            create: /create|build|make|generate/i,
            navigate: /go to|open|show|navigate/i,
            query: /what|how|when|where|why/i,
            command: /start|stop|restart|run/i,
            doctor: /symptoms|pain|hurt|sick|health/i,
            menu: /menu|options|settings|configure/i
        };
        
        for (const [intent, pattern] of Object.entries(intents)) {
            if (pattern.test(text)) return intent;
        }
        
        return 'unknown';
    }
    
    async mapUnicodeToEmoji(unicode, context = 'general') {
        // Map old unicode to modern emojis
        const unicodeMap = {
            // Old unicode patterns to emoji
            '\\u263A': '😊',  // White smiling face
            '\\u2665': '❤️',  // Heart
            '\\u2663': '♣️',  // Club
            '\\u2666': '♦️',  // Diamond
            '\\u2660': '♠️',  // Spade
            '\\u263C': '☀️',  // Sun
            '\\u2744': '❄️',  // Snowflake
            '\\u2605': '⭐',  // Star
            
            // Menu/interface unicode
            '\\u25B6': '▶️',  // Play button
            '\\u25C0': '◀️',  // Previous
            '\\u2B06': '⬆️',  // Up arrow
            '\\u2B07': '⬇️',  // Down arrow
            '\\u27A1': '➡️',  // Right arrow
            '\\u2B05': '⬅️',  // Left arrow
            
            // Doctor/medical unicode
            '\\u2695': '⚕️',  // Medical symbol
            '\\u1F48A': '💊', // Pill
            '\\u1F321': '🌡️', // Thermometer
        };
        
        let mapped = unicode;
        for (const [old, emoji] of Object.entries(unicodeMap)) {
            mapped = mapped.replace(new RegExp(old, 'g'), emoji);
        }
        
        return {
            original: unicode,
            mapped: mapped,
            context: context,
            xmlSchema: this.xmlSchemas.menu_mapping
        };
    }
    
    async processVoiceCommand(command) {
        // Process voice commands and route to appropriate system
        const intent = await this.detectIntent(command);
        
        switch (intent) {
            case 'create':
                return await this.routeToCreationSystem(command);
            case 'navigate':
                return await this.routeToNavigation(command);
            case 'doctor':
                return await this.routeToDoctorSystem(command);
            case 'menu':
                return await this.routeToMenuSystem(command);
            default:
                return await this.routeToGeneral(command);
        }
    }
    
    async routeToCreationSystem(command) {
        // Send to Dungeon Master for world building
        return {
            system: 'dungeon_master',
            action: 'create',
            command: command,
            routed_to: 'http://localhost:7904'
        };
    }
    
    async routeToDoctorSystem(command) {
        // Extract symptoms and route to doctor analysis
        const symptoms = this.extractSymptoms(command);
        
        return {
            system: 'doctor_analysis',
            symptoms: symptoms,
            xmlMapped: this.objectToXML({
                doctor_analysis: {
                    symptoms: symptoms,
                    raw_input: command,
                    confidence: 0.8,
                    timestamp: new Date().toISOString()
                }
            })
        };
    }
    
    extractSymptoms(text) {
        const symptomPatterns = [
            /headache|head hurt/i,
            /stomach.*ache|belly.*hurt/i,
            /fever|temperature|hot/i,
            /cough|throat/i,
            /tired|fatigue|exhausted/i,
            /pain.*in.*(back|leg|arm|chest)/i
        ];
        
        const symptoms = [];
        symptomPatterns.forEach(pattern => {
            const match = text.match(pattern);
            if (match) symptoms.push(match[0]);
        });
        
        return symptoms;
    }
    
    objectToXML(obj, rootName = 'root') {
        // Convert object to XML format
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
        
        function processObject(obj, indent = '  ') {
            let result = '';
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'object' && value !== null) {
                    result += `${indent}<${key}>\n`;
                    result += processObject(value, indent + '  ');
                    result += `${indent}</${key}>\n`;
                } else {
                    result += `${indent}<${key}>${this.escapeXML(value)}</${key}>\n`;
                }
            }
            return result;
        }
        
        xml += processObject.call(this, obj);
        xml += `</${rootName}>`;
        
        return xml;
    }
    
    escapeXML(text) {
        if (typeof text !== 'string') text = String(text);
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    broadcastToSystems(xmlData) {
        // Send XML data to connected systems
        Object.entries(this.connections).forEach(([system, url]) => {
            try {
                // Send via WebSocket if available
                const ws = new WebSocket(url);
                ws.on('open', () => {
                    ws.send(JSON.stringify({
                        type: 'xml_mapped_voice',
                        data: xmlData,
                        timestamp: Date.now()
                    }));
                    ws.close();
                });
            } catch (error) {
                console.log(`❌ ${system} not available`);
            }
        });
    }
    
    getSystemStatus() {
        // Check which systems are connected
        return Object.keys(this.connections).map(system => ({
            name: system,
            status: 'checking...',
            port: this.connections[system].split(':').pop()
        }));
    }
    
    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🎙️ Whisper-XML Bridge</title>
    <style>
        body { font-family: monospace; background: #000; color: #00ff00; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .section { border: 1px solid #00ff00; margin: 20px 0; padding: 20px; }
        .record-btn { 
            background: #ff4444; color: #fff; padding: 15px 30px; 
            border: none; border-radius: 50px; cursor: pointer;
            font-size: 18px; margin: 10px;
        }
        .record-btn.recording { background: #00ff00; color: #000; }
        .xml-output { 
            background: #001100; padding: 15px; 
            border: 1px solid #00ff00; white-space: pre-wrap;
            max-height: 300px; overflow-y: auto;
        }
        .unicode-input { 
            background: #000; color: #00ff00; border: 1px solid #00ff00;
            padding: 10px; width: 100%; font-family: monospace;
        }
        .mapping-result { 
            background: #002200; padding: 10px; margin: 10px 0;
            border-left: 3px solid #00ff00;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎙️ Whisper-XML Bridge</h1>
        <p>Voice transcription → XML mapping → System distribution</p>
        
        <div class="section">
            <h2>🎤 Voice Transcription</h2>
            <button class="record-btn" onclick="toggleRecording()">🎙️ Start Recording</button>
            <button onclick="uploadAudio()">📁 Upload Audio File</button>
            <input type="file" id="audioFile" accept="audio/*" style="display: none;">
            
            <div id="transcriptionResult" class="xml-output"></div>
        </div>
        
        <div class="section">
            <h2>🔄 Unicode → Emoji Mapping</h2>
            <input type="text" id="unicodeInput" class="unicode-input" 
                   placeholder="Enter old unicode (e.g., \\u263A \\u2665)" />
            <button onclick="mapUnicode()">Map to Emoji</button>
            
            <div id="mappingResult"></div>
        </div>
        
        <div class="section">
            <h2>🏥 Doctor/Menu Commands</h2>
            <button onclick="testDoctorCommand()">Test: "I have a headache"</button>
            <button onclick="testMenuCommand()">Test: "Open menu"</button>
            <button onclick="testCreateCommand()">Test: "Create a forest"</button>
            
            <div id="commandResult" class="xml-output"></div>
        </div>
        
        <div class="section">
            <h2>🌐 Connected Systems</h2>
            <div id="systemStatus"></div>
        </div>
        
        <div class="section">
            <h2>📊 Live XML Output</h2>
            <div id="xmlStream" class="xml-output"></div>
        </div>
    </div>
    
    <script>
        let mediaRecorder;
        let audioChunks = [];
        let isRecording = false;
        let ws;
        
        // Connect WebSocket
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:7909');
            
            ws.onopen = () => {
                console.log('Connected to Whisper-XML Bridge');
                updateSystemStatus();
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                displayXMLStream(data);
            };
        }
        
        async function toggleRecording() {
            if (!isRecording) {
                await startRecording();
            } else {
                stopRecording();
            }
        }
        
        async function startRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };
                
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    await sendAudioForTranscription(audioBlob);
                };
                
                mediaRecorder.start();
                isRecording = true;
                
                document.querySelector('.record-btn').textContent = '⏹️ Stop Recording';
                document.querySelector('.record-btn').classList.add('recording');
                
            } catch (error) {
                alert('Microphone access denied: ' + error.message);
            }
        }
        
        function stopRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                
                document.querySelector('.record-btn').textContent = '🎙️ Start Recording';
                document.querySelector('.record-btn').classList.remove('recording');
            }
        }
        
        async function sendAudioForTranscription(audioBlob) {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');
            
            try {
                const response = await fetch('/transcribe', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                displayTranscriptionResult(result);
                
            } catch (error) {
                console.error('Transcription error:', error);
            }
        }
        
        function displayTranscriptionResult(result) {
            const element = document.getElementById('transcriptionResult');
            element.innerHTML = \`
🎯 TRANSCRIPTION: \${result.transcription.text}
🎭 EMOTION: \${result.transcription.emotion || 'neutral'}
🎪 INTENT: \${result.transcription.intent || 'unknown'}
🔍 CONFIDENCE: \${(result.transcription.confidence * 100).toFixed(1)}%

📄 XML MAPPED:
\${result.xmlMapped}
            \`;
        }
        
        async function mapUnicode() {
            const unicode = document.getElementById('unicodeInput').value;
            
            try {
                const response = await fetch('/map-unicode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ unicode, context: 'general' })
                });
                
                const result = await response.json();
                
                document.getElementById('mappingResult').innerHTML = \`
                    <div class="mapping-result">
                        <strong>Original:</strong> \${result.original}<br>
                        <strong>Mapped:</strong> \${result.mapped}<br>
                        <strong>Context:</strong> \${result.context}
                    </div>
                \`;
                
            } catch (error) {
                console.error('Mapping error:', error);
            }
        }
        
        function testDoctorCommand() {
            sendTestCommand('I have a headache and feel tired');
        }
        
        function testMenuCommand() {
            sendTestCommand('Open the main menu and show options');
        }
        
        function testCreateCommand() {
            sendTestCommand('Create a magical forest with glowing trees');
        }
        
        async function sendTestCommand(command) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'voice_command',
                    command: command
                }));
            }
        }
        
        function displayXMLStream(data) {
            const element = document.getElementById('xmlStream');
            const timestamp = new Date().toLocaleTimeString();
            
            element.innerHTML = \`[\${timestamp}] \${data.type}: 
\${JSON.stringify(data, null, 2)}\` + '\\n\\n' + element.innerHTML;
            
            // Keep only last 10 entries
            const lines = element.innerHTML.split('\\n\\n');
            if (lines.length > 10) {
                element.innerHTML = lines.slice(0, 10).join('\\n\\n');
            }
        }
        
        function updateSystemStatus() {
            // Show connected systems status
            document.getElementById('systemStatus').innerHTML = \`
                <div>🔌 Language Processor: ws://localhost:7901</div>
                <div>🔌 Emoji Transformer: ws://localhost:7903</div>
                <div>🔌 Dungeon Master: ws://localhost:7905</div>
                <div>🔌 Orchestrator: ws://localhost:7907</div>
            \`;
        }
        
        // Initialize
        connectWebSocket();
        
        // File upload handler
        document.getElementById('audioFile').addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                await sendAudioForTranscription(file);
            }
        });
        
        function uploadAudio() {
            document.getElementById('audioFile').click();
        }
    </script>
</body>
</html>
        `;
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log('🎙️ Whisper-XML Bridge running on http://localhost:' + this.port);
            console.log('🔌 WebSocket server running on ws://localhost:' + this.wsPort);
            console.log('🎯 Voice transcription → XML mapping → System distribution');
            console.log('🔄 Unicode → Emoji mapping enabled');
            console.log('🏥 Doctor/Menu command routing active');
        });
    }
}

// Start the bridge
const bridge = new WhisperXMLBridge();
bridge.start();