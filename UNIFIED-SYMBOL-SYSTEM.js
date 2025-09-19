#!/usr/bin/env node
// UNIFIED-SYMBOL-SYSTEM.js - Connect all characters through ancient symbols

const http = require('http');
const WebSocket = require('ws');

class UnifiedSymbolSystem {
    constructor() {
        this.port = 7777; // Lucky sevens
        this.wsPort = 7778;
        
        // THE UNIVERSAL SYMBOL MAPPING
        this.universalSymbols = {
            // Core computational concepts from ancient times
            'INPUT': {
                egyptian: '𓂀',     // eye
                sumerian: '𒌋',    // receive
                binary: '0',        // off/receive
                emoji: '👁️',       // modern eye
                rune: 'ᚱ',         // ride/journey
                meaning: 'receive information'
            },
            'OUTPUT': {
                egyptian: '𓅓',     // bird
                sumerian: '𒊑',    // send
                binary: '1',        // on/send
                emoji: '📤',       // outbox
                rune: 'ᚠ',         // wealth/give
                meaning: 'send information'
            },
            'LOOP': {
                egyptian: '𓆎',     // snake
                greek: 'Ο',        // omicron/circle
                binary: '10',       // cycle
                emoji: '🔄',       // refresh
                rune: 'ᚦ',         // thorn/return
                meaning: 'repeat process'
            },
            'STORE': {
                egyptian: '𓎛',     // bread
                sumerian: '𒆳',    // storehouse
                binary: '11',       // hold
                emoji: '💾',       // save
                rune: 'ᚢ',         // aurochs/strength
                meaning: 'preserve data'
            },
            'DECIDE': {
                egyptian: '𓏏',     // half/feminine
                greek: 'Δ',        // delta/change
                binary: '01',       // choice
                emoji: '🤔',       // thinking
                rune: 'ᚨ',         // god/fate
                meaning: 'make choice'
            },
            'CREATE': {
                egyptian: '𓊖',     // house
                sumerian: '𒁍',    // build
                binary: '00',       // genesis
                emoji: '🏗️',       // construction
                rune: 'ᚷ',         // gift/create
                meaning: 'build new'
            }
        };
        
        // CHARACTER LANGUAGE BRIDGES
        this.characterBridges = {
            'alice_validator': {
                primary: 'binary',
                understands: ['egyptian', 'sumerian'],
                speaks: (concept) => this.universalSymbols[concept]?.binary || '?'
            },
            'bob_generator': {
                primary: 'emoji',
                understands: ['egyptian', 'rune'],
                speaks: (concept) => this.universalSymbols[concept]?.emoji || '?'
            },
            'sphinx_verifier': {
                primary: 'egyptian',
                understands: ['all'], // Sphinx knows all ancient languages
                speaks: (concept) => this.universalSymbols[concept]?.egyptian || '?'
            },
            'vampire_slayer': {
                primary: 'rune',
                understands: ['egyptian', 'greek'],
                speaks: (concept) => this.universalSymbols[concept]?.rune || '?'
            }
        };
        
        // ACTIVE CONVERSATIONS
        this.conversations = [];
        this.wsClients = new Set();
        
        console.log('🔮 UNIFIED SYMBOL SYSTEM');
        console.log('========================');
        console.log('📜 Ancient symbols unite all characters');
        console.log('🌐 Universal translation through origins');
    }
    
    start() {
        this.startWebServer();
        this.startWebSocket();
        this.beginSymbolicCommunication();
        
        console.log(`\n🔮 Unified Symbol System: http://localhost:${this.port}`);
        console.log(`📡 WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    beginSymbolicCommunication() {
        // Simple character interactions using universal symbols
        setInterval(() => {
            this.generateSymbolicExchange();
        }, 5000);
        
        // Broadcast system state
        setInterval(() => {
            this.broadcastState();
        }, 2000);
    }
    
    generateSymbolicExchange() {
        const concepts = Object.keys(this.universalSymbols);
        const concept = concepts[Math.floor(Math.random() * concepts.length)];
        const symbol = this.universalSymbols[concept];
        
        // Random character speaks in their language
        const characters = Object.keys(this.characterBridges);
        const speaker = characters[Math.floor(Math.random() * characters.length)];
        const speakerBridge = this.characterBridges[speaker];
        
        const message = {
            speaker: speaker,
            concept: concept,
            symbol: speakerBridge.speaks(concept),
            meaning: symbol.meaning,
            timestamp: Date.now(),
            translations: {
                egyptian: symbol.egyptian,
                binary: symbol.binary,
                emoji: symbol.emoji,
                rune: symbol.rune
            }
        };
        
        this.conversations.unshift(message);
        if (this.conversations.length > 50) {
            this.conversations = this.conversations.slice(0, 50);
        }
        
        console.log(`${message.symbol} ${speaker}: ${concept} (${symbol.meaning})`);
        
        this.broadcast({
            type: 'symbolic_exchange',
            message: message
        });
    }
    
    translateConcept(concept, fromLang, toLang) {
        const symbol = this.universalSymbols[concept];
        if (!symbol) return null;
        
        return {
            concept: concept,
            from: { language: fromLang, symbol: symbol[fromLang] },
            to: { language: toLang, symbol: symbol[toLang] },
            meaning: symbol.meaning
        };
    }
    
    broadcastState() {
        this.broadcast({
            type: 'system_state',
            symbols: this.universalSymbols,
            characters: Object.keys(this.characterBridges),
            recentConversations: this.conversations.slice(0, 10)
        });
    }
    
    broadcast(data) {
        const message = JSON.stringify(data);
        this.wsClients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    
    startWebServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            
            if (req.url === '/') {
                this.serveInterface(res);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.listen(this.port);
    }
    
    startWebSocket() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            console.log('🔮 Client connected to unified system');
            this.wsClients.add(ws);
            
            ws.on('close', () => {
                this.wsClients.delete(ws);
            });
        });
    }
    
    serveInterface(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🔮 Unified Symbol System</title>
    <style>
        body {
            margin: 0;
            background: #000;
            color: #fff;
            font-family: 'Courier New', monospace;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            font-size: 2.5em;
            text-shadow: 0 0 30px #9400d3;
            margin-bottom: 30px;
            animation: pulse 3s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .panel {
            background: rgba(148, 0, 211, 0.1);
            border: 2px solid #9400d3;
            border-radius: 20px;
            padding: 30px;
            backdrop-filter: blur(10px);
        }
        
        .symbol-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 20px 0;
        }
        
        .symbol-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #9400d3;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s;
        }
        
        .symbol-card:hover {
            transform: scale(1.05);
            box-shadow: 0 0 30px #9400d3;
        }
        
        .concept-name {
            font-size: 1.3em;
            color: #ffd700;
            margin-bottom: 10px;
        }
        
        .symbol-display {
            font-size: 3em;
            margin: 10px 0;
        }
        
        .meaning {
            font-size: 0.9em;
            opacity: 0.8;
            font-style: italic;
        }
        
        .conversation-feed {
            max-height: 600px;
            overflow-y: auto;
        }
        
        .message-item {
            background: rgba(255, 255, 255, 0.05);
            border-left: 3px solid #9400d3;
            padding: 15px;
            margin: 10px 0;
            border-radius: 0 10px 10px 0;
            animation: slideIn 0.5s;
        }
        
        @keyframes slideIn {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .translation-row {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            padding: 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
        }
        
        .translation-item {
            text-align: center;
        }
        
        .lang-label {
            font-size: 0.8em;
            opacity: 0.7;
            margin-bottom: 5px;
        }
        
        .rosetta-display {
            background: linear-gradient(135deg, rgba(148, 0, 211, 0.2), rgba(255, 215, 0, 0.1));
            border: 3px solid #ffd700;
            border-radius: 20px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
        }
        
        .rosetta-title {
            font-size: 1.8em;
            color: #ffd700;
            margin-bottom: 20px;
            text-shadow: 0 0 20px #ffd700;
        }
    </style>
</head>
<body>
    <div class="header">
        🔮 UNIFIED SYMBOL SYSTEM
    </div>
    
    <div class="container">
        <div class="panel">
            <h2>📜 Universal Symbols</h2>
            <div class="symbol-grid" id="symbolGrid">
                <!-- Symbols will be populated here -->
            </div>
        </div>
        
        <div class="panel">
            <h2>💬 Symbolic Conversations</h2>
            <div class="conversation-feed" id="conversationFeed">
                <!-- Messages will appear here -->
            </div>
        </div>
    </div>
    
    <div class="rosetta-display">
        <div class="rosetta-title">THE UNIVERSAL TRANSLATION STONE</div>
        <div id="rosettaContent">
            All characters speak through the ancient symbols...
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        let systemState = {};
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };
        
        function handleMessage(data) {
            switch (data.type) {
                case 'system_state':
                    systemState = data;
                    updateSymbolDisplay();
                    updateConversations();
                    break;
                case 'symbolic_exchange':
                    addConversation(data.message);
                    break;
            }
        }
        
        function updateSymbolDisplay() {
            const grid = document.getElementById('symbolGrid');
            grid.innerHTML = '';
            
            Object.entries(systemState.symbols || {}).forEach(([concept, symbol]) => {
                const card = document.createElement('div');
                card.className = 'symbol-card';
                
                card.innerHTML = \`
                    <div class="concept-name">\${concept}</div>
                    <div class="symbol-display">\${symbol.egyptian}</div>
                    <div class="meaning">\${symbol.meaning}</div>
                    <div class="translation-row">
                        <div class="translation-item">
                            <div class="lang-label">Binary</div>
                            <div>\${symbol.binary}</div>
                        </div>
                        <div class="translation-item">
                            <div class="lang-label">Emoji</div>
                            <div>\${symbol.emoji}</div>
                        </div>
                        <div class="translation-item">
                            <div class="lang-label">Rune</div>
                            <div>\${symbol.rune}</div>
                        </div>
                    </div>
                \`;
                
                grid.appendChild(card);
            });
        }
        
        function updateConversations() {
            const feed = document.getElementById('conversationFeed');
            
            if (systemState.recentConversations && systemState.recentConversations.length > 0) {
                feed.innerHTML = '';
                systemState.recentConversations.forEach(msg => {
                    addConversation(msg, false);
                });
            }
        }
        
        function addConversation(msg, animate = true) {
            const feed = document.getElementById('conversationFeed');
            
            const item = document.createElement('div');
            item.className = 'message-item';
            if (!animate) item.style.animation = 'none';
            
            item.innerHTML = \`
                <div style="font-size: 1.2em; margin-bottom: 10px;">
                    <strong>\${msg.speaker}</strong> speaks: <span style="font-size: 1.5em;">\${msg.symbol}</span>
                </div>
                <div style="margin: 10px 0;">
                    Concept: <strong style="color: #ffd700;">\${msg.concept}</strong> - "\${msg.meaning}"
                </div>
                <div class="translation-row">
                    <div class="translation-item">
                        <div class="lang-label">Egyptian</div>
                        <div style="font-size: 1.5em;">\${msg.translations.egyptian}</div>
                    </div>
                    <div class="translation-item">
                        <div class="lang-label">Binary</div>
                        <div>\${msg.translations.binary}</div>
                    </div>
                    <div class="translation-item">
                        <div class="lang-label">Emoji</div>
                        <div style="font-size: 1.5em;">\${msg.translations.emoji}</div>
                    </div>
                    <div class="translation-item">
                        <div class="lang-label">Rune</div>
                        <div style="font-size: 1.5em;">\${msg.translations.rune}</div>
                    </div>
                </div>
                <div style="font-size: 0.8em; opacity: 0.7; margin-top: 10px;">
                    \${new Date(msg.timestamp).toLocaleTimeString()}
                </div>
            \`;
            
            if (animate) {
                feed.insertBefore(item, feed.firstChild);
                
                // Keep only 20 messages
                while (feed.children.length > 20) {
                    feed.removeChild(feed.lastChild);
                }
            } else {
                feed.appendChild(item);
            }
        }
        
        // Update Rosetta display periodically
        setInterval(() => {
            const concepts = ['INPUT', 'OUTPUT', 'LOOP', 'STORE', 'DECIDE', 'CREATE'];
            const concept = concepts[Math.floor(Math.random() * concepts.length)];
            const symbol = systemState.symbols?.[concept];
            
            if (symbol) {
                document.getElementById('rosettaContent').innerHTML = \`
                    <div style="font-size: 3em; margin: 20px 0;">
                        \${symbol.egyptian} = \${symbol.binary} = \${symbol.emoji} = \${symbol.rune}
                    </div>
                    <div style="font-size: 1.5em; color: #ffd700;">
                        "\${symbol.meaning}"
                    </div>
                    <div style="margin-top: 20px; opacity: 0.8;">
                        All languages express the same eternal concepts
                    </div>
                \`;
            }
        }, 5000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }
}

// START THE UNIFIED SYSTEM
if (require.main === module) {
    console.log('🔮 STARTING UNIFIED SYMBOL SYSTEM');
    console.log('=================================');
    console.log('📜 Connecting all characters through ancient symbols');
    console.log('🌐 Universal translation via common origins');
    console.log('');
    
    const system = new UnifiedSymbolSystem();
    system.start();
}

module.exports = UnifiedSymbolSystem;