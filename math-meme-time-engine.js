#!/usr/bin/env node
/**
 * Math Meme Time Engine
 * 
 * Implements 24:1 time compression where 20 minutes real time = 8 hours simulated time
 * Provides !math_meme command interface and time synchronization
 * Creates message bottles every 20 minutes with Unix timestamp data
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const crypto = require('crypto');

class MathMemeTimeEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            compressionRatio: options.compressionRatio || 24, // 24:1 time compression
            realIntervalMinutes: options.realIntervalMinutes || 20, // 20 real minutes
            simulatedHours: options.simulatedHours || 8, // = 8 simulated hours
            bottleStorageDir: options.bottleStorageDir || path.join(__dirname, 'message-bottles'),
            maxBottles: options.maxBottles || 1000,
            autoSync: options.autoSync !== false,
            webSocketPort: options.webSocketPort || 3016,
            httpPort: options.httpPort || 3017
        };
        
        // Time tracking
        this.startTime = Date.now();
        this.realTime = Date.now();
        this.simulatedTime = Date.now() * this.config.compressionRatio;
        this.messageBottles = [];
        this.syncInterval = null;
        this.bottleInterval = null;
        
        // Command registry
        this.commands = {
            '!math_meme': this.handleMathMeme.bind(this),
            '!math_meme bottle': this.createMessageBottle.bind(this),
            '!math_meme export csv': this.exportToCSV.bind(this),
            '!math_meme sync': this.forceSync.bind(this),
            '!math_meme history': this.showHistory.bind(this),
            '!math_meme status': this.showStatus.bind(this),
            '!math_meme help': this.showHelp.bind(this)
        };
        
        this.initializeStorage();
        this.loadExistingBottles();
        this.startTimeTracking();
        this.setupWebInterface();
        
        console.log('🎮 Math Meme Time Engine initialized');
        console.log(`⏱️  Time Compression: ${this.config.compressionRatio}:1`);
        console.log(`📦 Message Bottle every ${this.config.realIntervalMinutes} minutes`);
        console.log(`🌐 Dashboard: http://localhost:${this.config.httpPort}`);
    }
    
    initializeStorage() {
        if (!fs.existsSync(this.config.bottleStorageDir)) {
            fs.mkdirSync(this.config.bottleStorageDir, { recursive: true });
        }
    }
    
    loadExistingBottles() {
        try {
            const bottleFiles = fs.readdirSync(this.config.bottleStorageDir)
                .filter(f => f.endsWith('.json'))
                .sort()
                .slice(-this.config.maxBottles);
            
            this.messageBottles = bottleFiles.map(file => {
                const content = fs.readFileSync(
                    path.join(this.config.bottleStorageDir, file), 
                    'utf8'
                );
                return JSON.parse(content);
            });
            
            console.log(`📦 Loaded ${this.messageBottles.length} existing message bottles`);
        } catch (error) {
            console.warn('⚠️ Could not load existing bottles:', error.message);
            this.messageBottles = [];
        }
    }
    
    startTimeTracking() {
        // Update time every second
        this.syncInterval = setInterval(() => {
            this.updateTime();
        }, 1000);
        
        // Create message bottle every configured interval
        const intervalMs = this.config.realIntervalMinutes * 60 * 1000;
        this.bottleInterval = setInterval(() => {
            this.createMessageBottle();
        }, intervalMs);
        
        // Create initial bottle
        this.createMessageBottle();
        
        console.log(`⏰ Time tracking started (sync every ${this.config.realIntervalMinutes} minutes)`);
    }
    
    updateTime() {
        const now = Date.now();
        const elapsed = now - this.startTime;
        
        this.realTime = now;
        this.simulatedTime = this.startTime + (elapsed * this.config.compressionRatio);
        
        // Calculate time differences
        const realMinutes = Math.floor(elapsed / 60000);
        const simulatedMinutes = Math.floor((elapsed * this.config.compressionRatio) / 60000);
        const simulatedHours = Math.floor(simulatedMinutes / 60);
        const simulatedDays = Math.floor(simulatedHours / 24);
        
        // Emit time update
        this.emit('timeUpdate', {
            real: {
                unix: this.realTime,
                elapsed: elapsed,
                minutes: realMinutes,
                formatted: new Date(this.realTime).toISOString()
            },
            simulated: {
                unix: this.simulatedTime,
                elapsed: elapsed * this.config.compressionRatio,
                minutes: simulatedMinutes,
                hours: simulatedHours,
                days: simulatedDays,
                formatted: new Date(this.simulatedTime).toISOString()
            },
            compression: this.config.compressionRatio
        });
    }
    
    createMessageBottle(data = {}) {
        const bottle = {
            bottle_id: `meme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString(),
            real_time: {
                unix: this.realTime,
                human: new Date(this.realTime).toISOString(),
                epoch: Math.floor(this.realTime / 1000)
            },
            simulated_time: {
                unix: this.simulatedTime,
                human: new Date(this.simulatedTime).toISOString(),
                epoch: Math.floor(this.simulatedTime / 1000),
                elapsed_minutes: Math.floor((this.simulatedTime - this.startTime) / 60000),
                elapsed_hours: Math.floor((this.simulatedTime - this.startTime) / 3600000),
                elapsed_days: Math.floor((this.simulatedTime - this.startTime) / 86400000)
            },
            compression: {
                ratio: this.config.compressionRatio,
                real_interval_minutes: this.config.realIntervalMinutes,
                simulated_hours: this.config.simulatedHours
            },
            meme_data: {
                command: '!math_meme bottle',
                payload: data,
                checksum: this.generateChecksum(data),
                sequence: this.messageBottles.length + 1
            },
            math: {
                formula: `real_time * ${this.config.compressionRatio} = simulated_time`,
                example: `${this.config.realIntervalMinutes} minutes * ${this.config.compressionRatio} = ${this.config.simulatedHours} hours`
            }
        };
        
        // Save bottle
        this.saveBottle(bottle);
        
        // Add to memory
        this.messageBottles.push(bottle);
        
        // Limit bottle history
        if (this.messageBottles.length > this.config.maxBottles) {
            this.messageBottles.shift();
        }
        
        // Emit event
        this.emit('bottleCreated', bottle);
        
        console.log(`📦 Message bottle created: ${bottle.bottle_id}`);
        console.log(`   Real: ${bottle.real_time.human}`);
        console.log(`   Simulated: ${bottle.simulated_time.human} (${bottle.simulated_time.elapsed_hours} hours elapsed)`);
        
        return bottle;
    }
    
    saveBottle(bottle) {
        const filename = `bottle_${bottle.real_time.epoch}_${bottle.bottle_id}.json`;
        const filepath = path.join(this.config.bottleStorageDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(bottle, null, 2));
        
        // Also save as CSV-friendly format
        this.appendToCSV(bottle);
    }
    
    appendToCSV(bottle) {
        const csvFile = path.join(this.config.bottleStorageDir, 'message_bottles.csv');
        
        // Create header if file doesn't exist
        if (!fs.existsSync(csvFile)) {
            const header = 'bottle_id,real_unix,real_time,sim_unix,sim_time,sim_hours,sim_days,ratio,command,data_hash,sequence\n';
            fs.writeFileSync(csvFile, header);
        }
        
        // Append bottle data
        const row = [
            bottle.bottle_id,
            bottle.real_time.unix,
            bottle.real_time.human,
            bottle.simulated_time.unix,
            bottle.simulated_time.human,
            bottle.simulated_time.elapsed_hours,
            bottle.simulated_time.elapsed_days,
            bottle.compression.ratio,
            bottle.meme_data.command,
            bottle.meme_data.checksum,
            bottle.meme_data.sequence
        ].join(',') + '\n';
        
        fs.appendFileSync(csvFile, row);
    }
    
    generateChecksum(data) {
        const content = JSON.stringify(data);
        return crypto.createHash('sha256').update(content).digest('hex').substr(0, 16);
    }
    
    // Command Handlers
    handleMathMeme(args = []) {
        const status = this.getTimeStatus();
        
        console.log('\n🎮 MATH MEME TIME STATUS');
        console.log('========================');
        console.log(`Real Time: ${status.real.formatted}`);
        console.log(`Simulated Time: ${status.simulated.formatted}`);
        console.log(`Compression Ratio: ${status.compression}:1`);
        console.log(`Time Running: ${status.real.minutesElapsed} real minutes = ${status.simulated.hoursElapsed} simulated hours`);
        console.log(`Next Bottle: in ${status.nextBottle.minutes} minutes`);
        console.log(`Total Bottles: ${this.messageBottles.length}`);
        console.log('\n💡 Use !math_meme help for more commands');
        
        return status;
    }
    
    forceSync() {
        console.log('🔄 Forcing time synchronization...');
        
        const bottle = this.createMessageBottle({ 
            type: 'forced_sync',
            timestamp: Date.now() 
        });
        
        console.log('✅ Synchronization complete');
        return bottle;
    }
    
    exportToCSV() {
        const csvFile = path.join(this.config.bottleStorageDir, 'message_bottles.csv');
        const exportFile = path.join(this.config.bottleStorageDir, `export_${Date.now()}.csv`);
        
        if (fs.existsSync(csvFile)) {
            fs.copyFileSync(csvFile, exportFile);
            console.log(`📊 CSV exported to: ${exportFile}`);
            
            // Also create Excel-compatible version with additional formatting
            this.createExcelCompatibleCSV(exportFile);
            
            return { 
                success: true, 
                file: exportFile,
                rows: this.messageBottles.length 
            };
        } else {
            console.log('❌ No CSV data to export');
            return { success: false, error: 'No data available' };
        }
    }
    
    createExcelCompatibleCSV(csvFile) {
        const excelFile = csvFile.replace('.csv', '_excel.csv');
        
        // Add Excel-specific formatting hints
        const content = fs.readFileSync(csvFile, 'utf8');
        const lines = content.split('\n');
        
        // Add BOM for Excel UTF-8 recognition
        const BOM = '\ufeff';
        
        // Enhance header with Excel formatting
        lines[0] = 'sep=,' + '\n' + lines[0];
        
        fs.writeFileSync(excelFile, BOM + lines.join('\n'));
        console.log(`📊 Excel-compatible CSV created: ${excelFile}`);
    }
    
    showHistory(limit = 10) {
        console.log(`\n📦 Last ${limit} Message Bottles:`);
        console.log('================================');
        
        const recent = this.messageBottles.slice(-limit).reverse();
        
        recent.forEach((bottle, index) => {
            console.log(`\n${index + 1}. ${bottle.bottle_id}`);
            console.log(`   Real: ${new Date(bottle.real_time.unix).toLocaleString()}`);
            console.log(`   Simulated: ${new Date(bottle.simulated_time.unix).toLocaleString()}`);
            console.log(`   Elapsed: ${bottle.simulated_time.elapsed_hours} hours (${bottle.simulated_time.elapsed_days} days)`);
        });
        
        return recent;
    }
    
    showStatus() {
        return this.getTimeStatus();
    }
    
    showHelp() {
        const help = `
🎮 MATH MEME TIME ENGINE COMMANDS
=================================

!math_meme              - Show current time status
!math_meme bottle       - Create new message bottle
!math_meme export csv   - Export data to CSV/Excel
!math_meme sync         - Force time synchronization  
!math_meme history [n]  - Show last n bottles (default 10)
!math_meme status       - Detailed time status
!math_meme help         - Show this help

TIME COMPRESSION: ${this.config.compressionRatio}:1
- 1 real minute = ${this.config.compressionRatio} simulated minutes
- ${this.config.realIntervalMinutes} real minutes = ${this.config.simulatedHours} simulated hours
- 1 real hour = ${this.config.compressionRatio} simulated hours

DASHBOARD: http://localhost:${this.config.httpPort}
`;
        console.log(help);
        return help;
    }
    
    getTimeStatus() {
        const now = Date.now();
        const elapsed = now - this.startTime;
        const nextBottleIn = (this.config.realIntervalMinutes * 60000) - (elapsed % (this.config.realIntervalMinutes * 60000));
        
        return {
            real: {
                unix: this.realTime,
                formatted: new Date(this.realTime).toISOString(),
                minutesElapsed: Math.floor(elapsed / 60000),
                hoursElapsed: Math.floor(elapsed / 3600000)
            },
            simulated: {
                unix: this.simulatedTime,
                formatted: new Date(this.simulatedTime).toISOString(),
                minutesElapsed: Math.floor((elapsed * this.config.compressionRatio) / 60000),
                hoursElapsed: Math.floor((elapsed * this.config.compressionRatio) / 3600000),
                daysElapsed: Math.floor((elapsed * this.config.compressionRatio) / 86400000)
            },
            compression: this.config.compressionRatio,
            bottles: this.messageBottles.length,
            nextBottle: {
                milliseconds: nextBottleIn,
                seconds: Math.floor(nextBottleIn / 1000),
                minutes: Math.floor(nextBottleIn / 60000)
            },
            uptime: {
                real: elapsed,
                simulated: elapsed * this.config.compressionRatio
            }
        };
    }
    
    setupWebInterface() {
        const http = require('http');
        const WebSocket = require('ws');
        
        // HTTP Server
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            
            if (url.pathname === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.generateDashboardHTML());
            } else if (url.pathname === '/api/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.getTimeStatus()));
            } else if (url.pathname === '/api/bottles') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.messageBottles.slice(-20)));
            } else if (url.pathname === '/api/bottle' && req.method === 'POST') {
                const bottle = this.createMessageBottle({ source: 'web_api' });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(bottle));
            } else if (url.pathname === '/api/export/csv') {
                const result = this.exportToCSV();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } else if (url.pathname === '/api/command' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    const { command } = JSON.parse(body);
                    const result = this.processCommand(command);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ result }));
                });
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.config.httpPort, () => {
            console.log(`🌐 Math Meme Dashboard: http://localhost:${this.config.httpPort}`);
        });
        
        // WebSocket Server
        const wss = new WebSocket.Server({ port: this.config.webSocketPort });
        
        wss.on('connection', (ws) => {
            console.log('📡 WebSocket client connected');
            
            // Send initial status
            ws.send(JSON.stringify({
                type: 'status',
                data: this.getTimeStatus()
            }));
            
            // Send time updates
            const timeListener = (data) => {
                ws.send(JSON.stringify({
                    type: 'timeUpdate',
                    data
                }));
            };
            
            // Send bottle creations
            const bottleListener = (bottle) => {
                ws.send(JSON.stringify({
                    type: 'bottleCreated',
                    data: bottle
                }));
            };
            
            this.on('timeUpdate', timeListener);
            this.on('bottleCreated', bottleListener);
            
            ws.on('close', () => {
                this.off('timeUpdate', timeListener);
                this.off('bottleCreated', bottleListener);
            });
        });
        
        console.log(`📡 WebSocket server: ws://localhost:${this.config.webSocketPort}`);
    }
    
    processCommand(command) {
        const handler = this.commands[command] || this.commands[command.split(' ')[0]];
        
        if (handler) {
            const args = command.split(' ').slice(1);
            return handler(args);
        } else {
            return { error: 'Unknown command. Try !math_meme help' };
        }
    }
    
    generateDashboardHTML() {
        const status = this.getTimeStatus();
        const recentBottles = this.messageBottles.slice(-5).reverse();
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Math Meme Time Engine - 24:1 Compression</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            background: #0a0a0a; 
            color: #0f0; 
            overflow-x: hidden;
        }
        .matrix-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(0deg, transparent 0%, rgba(0,255,0,0.1) 50%, transparent 100%);
            animation: matrix-flow 20s linear infinite;
            z-index: -1;
        }
        @keyframes matrix-flow {
            0% { transform: translateY(0); }
            100% { transform: translateY(-100%); }
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px; 
            position: relative;
            z-index: 1;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border: 2px solid #0f0;
            padding: 20px;
            background: rgba(0,0,0,0.8);
            box-shadow: 0 0 20px #0f0;
        }
        .header h1 {
            margin: 0;
            font-size: 36px;
            text-shadow: 0 0 10px #0f0;
        }
        .time-display {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .time-box {
            background: rgba(0,0,0,0.9);
            border: 1px solid #0f0;
            padding: 20px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .time-box::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #0f0, #00ff00, #0f0);
            z-index: -1;
            animation: glow 3s linear infinite;
        }
        @keyframes glow {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
        .time-label {
            font-size: 14px;
            opacity: 0.7;
            margin-bottom: 10px;
        }
        .time-value {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
        }
        .time-details {
            font-size: 12px;
            opacity: 0.8;
        }
        .compression-info {
            text-align: center;
            font-size: 20px;
            margin: 20px 0;
            padding: 15px;
            background: rgba(0,255,0,0.1);
            border: 1px solid #0f0;
        }
        .bottles-section {
            background: rgba(0,0,0,0.9);
            border: 1px solid #0f0;
            padding: 20px;
            margin-bottom: 20px;
        }
        .bottle {
            background: rgba(0,255,0,0.05);
            border: 1px solid rgba(0,255,0,0.3);
            padding: 10px;
            margin: 10px 0;
            font-size: 12px;
        }
        .controls {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin: 20px 0;
        }
        .btn {
            background: rgba(0,255,0,0.2);
            border: 1px solid #0f0;
            color: #0f0;
            padding: 10px 20px;
            cursor: pointer;
            font-family: inherit;
            font-size: 14px;
            transition: all 0.3s;
        }
        .btn:hover {
            background: rgba(0,255,0,0.4);
            box-shadow: 0 0 10px #0f0;
            transform: scale(1.05);
        }
        .command-input {
            background: #000;
            border: 1px solid #0f0;
            color: #0f0;
            padding: 10px;
            font-family: inherit;
            width: 100%;
            margin: 10px 0;
        }
        .next-bottle {
            text-align: center;
            font-size: 18px;
            margin: 20px 0;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
        }
        .math-formula {
            background: rgba(0,0,0,0.9);
            border: 1px solid #0f0;
            padding: 15px;
            text-align: center;
            font-size: 16px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
        }
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            background: #0f0;
            border-radius: 50%;
            margin-right: 5px;
            animation: blink 1s infinite;
        }
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
    </style>
</head>
<body>
    <div class="matrix-bg"></div>
    <div class="container">
        <div class="header">
            <h1>🎮 MATH MEME TIME ENGINE</h1>
            <p>24:1 Time Compression Active</p>
            <p><span class="status-indicator"></span>System Online</p>
        </div>
        
        <div class="math-formula">
            📐 ${this.config.realIntervalMinutes} real minutes × ${this.config.compressionRatio} = ${this.config.simulatedHours} simulated hours
        </div>
        
        <div class="time-display">
            <div class="time-box">
                <div class="time-label">REAL TIME</div>
                <div class="time-value" id="realTime">${new Date(status.real.unix).toLocaleTimeString()}</div>
                <div class="time-details">
                    Unix: ${status.real.unix}<br>
                    Elapsed: ${status.real.minutesElapsed} minutes
                </div>
            </div>
            
            <div class="time-box">
                <div class="time-label">SIMULATED TIME</div>
                <div class="time-value" id="simTime">${new Date(status.simulated.unix).toLocaleTimeString()}</div>
                <div class="time-details">
                    Unix: ${status.simulated.unix}<br>
                    Elapsed: ${status.simulated.hoursElapsed} hours (${status.simulated.daysElapsed} days)
                </div>
            </div>
        </div>
        
        <div class="compression-info">
            ⏱️ Time Compression Ratio: ${status.compression}:1
        </div>
        
        <div class="next-bottle" id="nextBottle">
            📦 Next Message Bottle in: ${status.nextBottle.minutes} minutes ${status.nextBottle.seconds % 60} seconds
        </div>
        
        <div class="controls">
            <button class="btn" onclick="createBottle()">📦 Create Bottle Now</button>
            <button class="btn" onclick="exportCSV()">📊 Export to CSV/Excel</button>
            <button class="btn" onclick="forceSync()">🔄 Force Sync</button>
            <button class="btn" onclick="showHelp()">❓ Show Help</button>
        </div>
        
        <input type="text" class="command-input" id="commandInput" placeholder="Enter command (e.g., !math_meme)" onkeypress="handleCommand(event)">
        
        <div class="bottles-section">
            <h3>📦 Recent Message Bottles (${this.messageBottles.length} total)</h3>
            <div id="bottleList">
                ${recentBottles.map(bottle => `
                    <div class="bottle">
                        <strong>${bottle.bottle_id}</strong><br>
                        Real: ${new Date(bottle.real_time.unix).toLocaleString()}<br>
                        Simulated: ${new Date(bottle.simulated_time.unix).toLocaleString()}<br>
                        Elapsed: ${bottle.simulated_time.elapsed_hours} hours
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    
    <script>
        let ws;
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.config.webSocketPort}');
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                
                if (message.type === 'timeUpdate') {
                    updateTimeDisplay(message.data);
                } else if (message.type === 'bottleCreated') {
                    addBottleToList(message.data);
                }
            };
            
            ws.onclose = function() {
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function updateTimeDisplay(data) {
            document.getElementById('realTime').textContent = new Date(data.real.unix).toLocaleTimeString();
            document.getElementById('simTime').textContent = new Date(data.simulated.unix).toLocaleTimeString();
            
            // Update next bottle countdown
            const nextBottleMs = ${this.config.realIntervalMinutes * 60000} - (data.real.elapsed % ${this.config.realIntervalMinutes * 60000});
            const minutes = Math.floor(nextBottleMs / 60000);
            const seconds = Math.floor((nextBottleMs % 60000) / 1000);
            document.getElementById('nextBottle').innerHTML = \`📦 Next Message Bottle in: \${minutes} minutes \${seconds} seconds\`;
        }
        
        function addBottleToList(bottle) {
            const bottleList = document.getElementById('bottleList');
            const bottleDiv = document.createElement('div');
            bottleDiv.className = 'bottle';
            bottleDiv.innerHTML = \`
                <strong>\${bottle.bottle_id}</strong><br>
                Real: \${new Date(bottle.real_time.unix).toLocaleString()}<br>
                Simulated: \${new Date(bottle.simulated_time.unix).toLocaleString()}<br>
                Elapsed: \${bottle.simulated_time.elapsed_hours} hours
            \`;
            bottleList.insertBefore(bottleDiv, bottleList.firstChild);
            
            // Keep only 5 most recent
            while (bottleList.children.length > 5) {
                bottleList.removeChild(bottleList.lastChild);
            }
        }
        
        async function createBottle() {
            const response = await fetch('/api/bottle', { method: 'POST' });
            const bottle = await response.json();
            alert('📦 Message bottle created!\\nID: ' + bottle.bottle_id);
        }
        
        async function exportCSV() {
            const response = await fetch('/api/export/csv');
            const result = await response.json();
            if (result.success) {
                alert('📊 CSV exported successfully!\\nFile: ' + result.file);
            } else {
                alert('❌ Export failed: ' + result.error);
            }
        }
        
        async function forceSync() {
            const response = await fetch('/api/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: '!math_meme sync' })
            });
            const result = await response.json();
            alert('🔄 Sync forced!');
        }
        
        async function showHelp() {
            const response = await fetch('/api/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: '!math_meme help' })
            });
            const result = await response.json();
            alert(result.result || 'Help text loaded - check console');
        }
        
        async function handleCommand(event) {
            if (event.key === 'Enter') {
                const input = event.target;
                const command = input.value;
                
                const response = await fetch('/api/command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command })
                });
                const result = await response.json();
                console.log('Command result:', result);
                
                input.value = '';
            }
        }
        
        // Connect WebSocket
        connectWebSocket();
    </script>
</body>
</html>`;
    }
    
    stop() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        if (this.bottleInterval) clearInterval(this.bottleInterval);
        
        console.log('🛑 Math Meme Time Engine stopped');
    }
}

// Auto-start if run directly
if (require.main === module) {
    const engine = new MathMemeTimeEngine();
    
    // CLI interface
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'math_meme> '
    });
    
    console.log('💡 Type !math_meme help for commands');
    rl.prompt();
    
    rl.on('line', (line) => {
        const command = line.trim();
        
        if (command) {
            const result = engine.processCommand(command);
            if (result && result.error) {
                console.log(`❌ ${result.error}`);
            }
        }
        
        rl.prompt();
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Math Meme Time Engine...');
        engine.stop();
        rl.close();
        process.exit(0);
    });
}

module.exports = MathMemeTimeEngine;