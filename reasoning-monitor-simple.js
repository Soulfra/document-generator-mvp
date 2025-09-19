#!/usr/bin/env node

/**
 * 🔍 SIMPLE REASONING MONITOR
 * Watches the reasoning differential flow in real-time
 */

const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Track differentials
const differentials = [];
let connections = {
    orchestrator: false,
    sequentialTagging: false,
    voiceOfGod: false
};

// Connect to services
function connectToOrchestrator() {
    try {
        const ws = new WebSocket('ws://localhost:8000');
        ws.on('open', () => {
            connections.orchestrator = true;
            console.log('✅ Connected to Orchestrator');
        });
        ws.on('message', (data) => {
            handleOrchestratorMessage(data.toString());
        });
        ws.on('close', () => {
            connections.orchestrator = false;
            setTimeout(connectToOrchestrator, 5000);
        });
    } catch (err) {
        setTimeout(connectToOrchestrator, 5000);
    }
}

function connectToSequentialTagging() {
    try {
        const ws = new WebSocket('ws://localhost:42001');
        ws.on('open', () => {
            connections.sequentialTagging = true;
            console.log('✅ Connected to Sequential Tagging');
        });
        ws.on('message', (data) => {
            handleSequentialMessage(data.toString());
        });
        ws.on('close', () => {
            connections.sequentialTagging = false;
            setTimeout(connectToSequentialTagging, 5000);
        });
    } catch (err) {
        setTimeout(connectToSequentialTagging, 5000);
    }
}

function handleOrchestratorMessage(data) {
    try {
        const parsed = JSON.parse(data);
        addDifferential('orchestrator', parsed);
    } catch (err) {
        // Ignore parse errors
    }
}

function handleSequentialMessage(data) {
    try {
        const parsed = JSON.parse(data);
        if (parsed.collarState) {
            addDifferential('sequential', {
                sequence: parsed.collarState.currentSequence,
                layer: parsed.collarState.currentOnionLayer,
                differential: parsed.collarState.currentSequence / parsed.collarState.totalSequences
            });
        }
    } catch (err) {
        // Ignore parse errors
    }
}

function addDifferential(source, data) {
    const entry = {
        timestamp: new Date().toISOString(),
        source: source,
        data: data,
        differential: calculateDifferential(source, data)
    };
    
    differentials.push(entry);
    if (differentials.length > 100) {
        differentials.shift();
    }
    
    // Broadcast to clients
    broadcast({
        type: 'differential',
        entry: entry
    });
    
    console.log('📊 ' + source + ' differential: ' + entry.differential.toFixed(3));
}

function calculateDifferential(source, data) {
    if (source === 'sequential' && data.differential) {
        return data.differential;
    }
    if (source === 'orchestrator' && data.tokens) {
        return data.tokens / 1000;
    }
    return Math.random(); // Fallback
}

function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// API endpoints
app.get('/api/status', (req, res) => {
    res.json({
        connections: connections,
        differentials: differentials.slice(-20),
        count: differentials.length
    });
});

// Serve dashboard
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Reasoning Monitor</title>
    <style>
        body { 
            background: #000; 
            color: #0f0; 
            font-family: monospace; 
            padding: 20px;
        }
        .header { 
            font-size: 24px; 
            text-align: center; 
            margin-bottom: 20px;
        }
        .connections {
            border: 1px solid #0f0;
            padding: 10px;
            margin-bottom: 20px;
        }
        .connection {
            display: inline-block;
            margin: 5px;
            padding: 5px 10px;
            border: 1px solid #0f0;
        }
        .connection.active {
            background: #0f0;
            color: #000;
        }
        .chart {
            border: 1px solid #0f0;
            height: 300px;
            position: relative;
            margin-bottom: 20px;
        }
        .log {
            border: 1px solid #0f0;
            height: 200px;
            overflow-y: auto;
            padding: 10px;
        }
        .log-entry {
            margin: 2px 0;
        }
    </style>
</head>
<body>
    <div class="header">🔍 REASONING DIFFERENTIAL MONITOR</div>
    
    <div class="connections">
        <div class="connection" id="conn-orch">Orchestrator</div>
        <div class="connection" id="conn-seq">Sequential Tagging</div>
        <div class="connection" id="conn-vog">Voice of God</div>
    </div>
    
    <div class="chart" id="chart">
        <canvas id="canvas" width="800" height="300"></canvas>
    </div>
    
    <div class="log" id="log"></div>
    
    <script>
        const ws = new WebSocket('ws://localhost:9005');
        const log = document.getElementById('log');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        let differentials = [];
        
        // Update status
        async function updateStatus() {
            try {
                const res = await fetch('/api/status');
                const data = await res.json();
                
                // Update connections
                document.getElementById('conn-orch').className = 
                    'connection' + (data.connections.orchestrator ? ' active' : '');
                document.getElementById('conn-seq').className = 
                    'connection' + (data.connections.sequentialTagging ? ' active' : '');
                document.getElementById('conn-vog').className = 
                    'connection' + (data.connections.voiceOfGod ? ' active' : '');
                    
                // Update differentials
                differentials = data.differentials || [];
                drawChart();
            } catch (err) {
                console.error(err);
            }
        }
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'differential') {
                addLogEntry(data.entry);
                differentials.push(data.entry);
                if (differentials.length > 50) {
                    differentials.shift();
                }
                drawChart();
            }
        };
        
        function addLogEntry(entry) {
            const div = document.createElement('div');
            div.className = 'log-entry';
            div.textContent = entry.timestamp.split('T')[1].split('.')[0] + ' ' +
                entry.source + ': ' + entry.differential.toFixed(3);
            log.insertBefore(div, log.firstChild);
            
            if (log.children.length > 50) {
                log.removeChild(log.lastChild);
            }
        }
        
        function drawChart() {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, 800, 300);
            
            if (differentials.length < 2) return;
            
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            differentials.forEach((d, i) => {
                const x = (i / (differentials.length - 1)) * 780 + 10;
                const y = 290 - (d.differential * 280);
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        }
        
        // Update every second
        setInterval(updateStatus, 1000);
        updateStatus();
    </script>
</body>
</html>`);
});

// Start server
const port = 9005;
server.listen(port, () => {
    console.log(`
🔍 REASONING MONITOR
====================
Dashboard: http://localhost:${port}
API: http://localhost:${port}/api/status

Connecting to services...
    `);
    
    // Connect to services
    connectToOrchestrator();
    connectToSequentialTagging();
});

// Test differential generation
setInterval(() => {
    if (differentials.length === 0) {
        addDifferential('test', { value: Math.random() });
    }
}, 5000);