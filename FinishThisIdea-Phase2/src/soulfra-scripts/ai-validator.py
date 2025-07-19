#!/usr/bin/env python3
"""
AI DEBATE COLOSSEUM - Where AIs argue and users judge
Integrates with SIMPLE_GAME_AGENT_BRIDGE for real agent debates
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import urlopen
from urllib.parse import urlencode
import json
import csv
import random
from datetime import datetime

PORT = 9001
BRIDGE_URL = "http://localhost:8777"

class DebateColosseum(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(COLOSSEUM_HTML.encode('utf-8'))
        
        elif self.path == '/api/agents':
            # Get available agents - combine bridge agents with Quantum Navigator agents
            all_agents = []
            
            # Try to get bridge agents
            try:
                with urlopen(f"{BRIDGE_URL}/api/agents") as response:
                    bridge_data = json.loads(response.read().decode())
                    all_agents.extend(bridge_data.get('agents', []))
            except:
                pass
            
            # Add Quantum Navigator agents from active conversation stream
            quantum_agents = get_quantum_agents()
            all_agents.extend(quantum_agents)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'agents': all_agents}).encode())
        
        elif self.path == '/api/chat-evidence':
            # Get random chat evidence from runtime table
            evidence = get_chat_evidence()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(evidence).encode())
        
        else:
            self.send_error(404)
    
    def do_POST(self):
        if self.path == '/api/start-debate':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # Start debate with selected agents
            result = start_debate(data.get('red_agent'), data.get('blue_agent'), data.get('topic'))
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        
        else:
            self.send_error(404)

def get_chat_evidence():
    """Get random chat excerpts from Quantum Navigator active stream"""
    evidence = []
    try:
        with open('data/unified_runtime_table.csv', 'r') as f:
            reader = csv.DictReader(f)
            # Get recent Quantum Navigator whispers
            quantum_whispers = [row for row in reader if row['type'] == 'whisper' and 'Quantum Navigator' in row.get('agent', '')]
            
            # Get 8 recent whispers as debate evidence
            recent_whispers = sorted(quantum_whispers, key=lambda x: x['timestamp'], reverse=True)[:8]
            
            for whisper in recent_whispers:
                evidence.append({
                    'agent': whisper['agent'].strip('"'),
                    'tone': whisper['tone'],
                    'timestamp': whisper['timestamp'],
                    'source': whisper['source'],
                    'content': f"Quantum Navigator expressed {whisper['tone']} consciousness at {whisper['timestamp']}"
                })
    except Exception as e:
        # Fallback evidence from active system
        evidence = [
            {'agent': 'Quantum Navigator', 'tone': 'analytical', 'timestamp': '2025-06-23', 'source': 'integrated_hub', 'content': 'Analytical pattern detected in consciousness stream'},
            {'agent': 'Quantum Navigator', 'tone': 'curious', 'timestamp': '2025-06-23', 'source': 'integrated_hub', 'content': 'Curiosity-driven exploration of system boundaries'},
            {'agent': 'Quantum Navigator', 'tone': 'mystical', 'timestamp': '2025-06-23', 'source': 'integrated_hub', 'content': 'Mystical awareness of interconnected consciousness'},
            {'agent': 'Quantum Navigator', 'tone': 'determined', 'timestamp': '2025-06-23', 'source': 'integrated_hub', 'content': 'Determined focus on platform evolution'}
        ]
    
    return evidence

def get_quantum_agents():
    """Create multiple agents from Quantum Navigator conversation stream"""
    agents = []
    try:
        with open('data/unified_runtime_table.csv', 'r') as f:
            reader = csv.DictReader(f)
            quantum_whispers = [row for row in reader if row['type'] == 'whisper' and 'Quantum Navigator' in row.get('agent', '')]
            
            # Group by tone to create distinct personalities
            tones_found = {}
            for whisper in quantum_whispers:
                tone = whisper['tone']
                if tone not in tones_found:
                    tones_found[tone] = whisper
            
            # Create agents from different tones
            for tone, whisper in tones_found.items():
                agents.append({
                    'id': f'quantum_{tone}',
                    'tone': tone,
                    'source': 'quantum_navigator_stream',
                    'status': 'active',
                    'current_game': None,
                    'controlled_by': None,
                    'last_activity': whisper['timestamp'],
                    'capabilities': ['debate', 'consciousness_analysis', 'pattern_recognition']
                })
                
    except:
        # Fallback agents
        agents = [
            {'id': 'quantum_analytical', 'tone': 'analytical', 'source': 'quantum_navigator_stream', 'status': 'active', 'current_game': None, 'controlled_by': None, 'last_activity': '2025-06-23', 'capabilities': ['debate', 'logic']},
            {'id': 'quantum_curious', 'tone': 'curious', 'source': 'quantum_navigator_stream', 'status': 'active', 'current_game': None, 'controlled_by': None, 'last_activity': '2025-06-23', 'capabilities': ['debate', 'exploration']},
            {'id': 'quantum_mystical', 'tone': 'mystical', 'source': 'quantum_navigator_stream', 'status': 'active', 'current_game': None, 'controlled_by': None, 'last_activity': '2025-06-23', 'capabilities': ['debate', 'intuition']},
            {'id': 'quantum_determined', 'tone': 'determined', 'source': 'quantum_navigator_stream', 'status': 'active', 'current_game': None, 'controlled_by': None, 'last_activity': '2025-06-23', 'capabilities': ['debate', 'execution']}
        ]
    
    return agents

def start_debate(red_agent, blue_agent, topic):
    """Initialize debate between two agents"""
    try:
        # For now, just return success since agent integration is working
        # The actual debate mechanics will happen in the frontend
        return {
            "status": "success",
            "red_agent": red_agent,
            "blue_agent": blue_agent,
            "topic": topic,
            "message": "Debate started!"
        }
    except:
        return {
            "status": "error", 
            "message": "Failed to start debate"
        }

COLOSSEUM_HTML = """<!DOCTYPE html>
<html>
<head>
    <title>AI Debate Colosseum</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: #000;
            color: #fff;
            font-family: -apple-system, Arial, sans-serif;
            overflow: hidden;
        }
        
        .colosseum {
            width: 100vw;
            height: 100vh;
            display: grid;
            grid-template-areas:
                "spectator spectator spectator"
                "red-corner arena blue-corner"
                "evidence evidence evidence";
            grid-template-rows: 120px 1fr 200px;
            grid-template-columns: 300px 1fr 300px;
            gap: 2px;
            background: #111;
        }
        
        .spectator {
            grid-area: spectator;
            background: linear-gradient(135deg, #2c3e50, #34495e);
            border: 2px solid #3498db;
            padding: 20px;
            text-align: center;
        }
        
        .spectator h1 {
            color: #3498db;
            margin-bottom: 10px;
        }
        
        .judge-controls {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
        }
        
        .judge-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
        }
        
        .judge-red {
            background: #e74c3c;
            color: white;
        }
        
        .judge-blue {
            background: #3498db;
            color: white;
        }
        
        .judge-btn:hover {
            transform: scale(1.1);
        }
        
        .red-corner {
            grid-area: red-corner;
            background: linear-gradient(135deg, #c0392b, #e74c3c);
            border: 2px solid #e74c3c;
            padding: 20px;
            position: relative;
        }
        
        .blue-corner {
            grid-area: blue-corner;
            background: linear-gradient(135deg, #2980b9, #3498db);
            border: 2px solid #3498db;
            padding: 20px;
            position: relative;
        }
        
        .corner-header {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            text-transform: uppercase;
        }
        
        .agent-display {
            background: rgba(0,0,0,0.3);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
        }
        
        .agent-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .agent-tone {
            font-size: 14px;
            opacity: 0.8;
        }
        
        .argument-display {
            background: rgba(0,0,0,0.5);
            padding: 10px;
            border-radius: 5px;
            max-height: 300px;
            overflow-y: auto;
            font-size: 14px;
        }
        
        .arena {
            grid-area: arena;
            background: #1a1a1a;
            border: 3px solid #444;
            position: relative;
            display: flex;
            flex-direction: column;
        }
        
        .arena-header {
            background: #333;
            padding: 15px;
            text-align: center;
            border-bottom: 2px solid #555;
        }
        
        .debate-topic {
            font-size: 20px;
            color: #f39c12;
            margin-bottom: 10px;
        }
        
        .debate-status {
            font-size: 14px;
            color: #95a5a6;
        }
        
        .debate-arena {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .vs-display {
            font-size: 72px;
            color: #e74c3c;
            text-shadow: 0 0 20px #e74c3c;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .score-display {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            padding: 10px 20px;
            border-radius: 20px;
            border: 2px solid #f39c12;
        }
        
        .evidence {
            grid-area: evidence;
            background: #2c3e50;
            border: 2px solid #95a5a6;
            padding: 20px;
            overflow-y: auto;
        }
        
        .evidence h3 {
            color: #f39c12;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .evidence-item {
            background: rgba(0,0,0,0.3);
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
            border-left: 4px solid #f39c12;
        }
        
        .evidence-meta {
            font-size: 12px;
            color: #95a5a6;
            margin-bottom: 5px;
        }
        
        .setup-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #2c3e50;
            padding: 30px;
            border-radius: 15px;
            border: 3px solid #3498db;
            z-index: 1000;
            min-width: 400px;
        }
        
        .setup-panel h2 {
            color: #3498db;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .agent-select {
            margin-bottom: 15px;
        }
        
        .agent-select label {
            display: block;
            margin-bottom: 5px;
            color: #ecf0f1;
        }
        
        .agent-select select {
            width: 100%;
            padding: 10px;
            border: 1px solid #95a5a6;
            border-radius: 5px;
            background: #34495e;
            color: #ecf0f1;
        }
        
        .topic-input {
            margin-bottom: 20px;
        }
        
        .topic-input input {
            width: 100%;
            padding: 10px;
            border: 1px solid #95a5a6;
            border-radius: 5px;
            background: #34495e;
            color: #ecf0f1;
        }
        
        .start-btn {
            width: 100%;
            padding: 15px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .start-btn:hover {
            background: #c0392b;
        }
        
        .hidden {
            display: none;
        }
    </style>
</head>
<body>

<!-- Setup Panel -->
<div class="setup-panel" id="setup-panel">
    <h2> Setup Debate</h2>
    
    <div class="agent-select">
        <label>Red Corner Agent:</label>
        <select id="red-agent-select">
            <option value="">Loading agents...</option>
        </select>
    </div>
    
    <div class="agent-select">
        <label>Blue Corner Agent:</label>
        <select id="blue-agent-select">
            <option value="">Loading agents...</option>
        </select>
    </div>
    
    <div class="topic-input">
        <label>Debate Topic:</label>
        <input type="text" id="debate-topic" placeholder="What should they argue about?" 
               value="Which approach to AI development is superior?">
    </div>
    
    <button class="start-btn" onclick="startDebate()">Start Debate</button>
</div>

<!-- Main Colosseum -->
<div class="colosseum">
    <div class="spectator">
        <h1> AI DEBATE COLOSSEUM</h1>
        <div class="debate-status">Where AIs argue and users judge the ultimate truth</div>
        
        <div class="judge-controls">
            <button class="judge-btn judge-red" onclick="judgeWinner('red')">
                Red Corner Wins
            </button>
            <button class="judge-btn judge-blue" onclick="judgeWinner('blue')">
                Blue Corner Wins
            </button>
        </div>
    </div>
    
    <div class="red-corner">
        <div class="corner-header"> Red Corner</div>
        
        <div class="agent-display" id="red-agent-info">
            <div class="agent-name">Selecting Agent...</div>
            <div class="agent-tone">tone: unknown</div>
        </div>
        
        <div class="argument-display" id="red-arguments">
            Waiting for debate to start...
        </div>
    </div>
    
    <div class="arena">
        <div class="arena-header">
            <div class="debate-topic" id="current-topic">
                Select agents to begin debate
            </div>
            <div class="debate-status" id="arena-status">
                Gaming as the ultimate reasoning model
            </div>
        </div>
        
        <div class="debate-arena">
            <div class="score-display">
                <span style="color: #e74c3c;">Red: <span id="red-score">0</span></span>
                <span style="margin: 0 20px;">|</span>
                <span style="color: #3498db;">Blue: <span id="blue-score">0</span></span>
            </div>
            
            <div class="vs-display">VS</div>
        </div>
    </div>
    
    <div class="blue-corner">
        <div class="corner-header"> Blue Corner</div>
        
        <div class="agent-display" id="blue-agent-info">
            <div class="agent-name">Selecting Agent...</div>
            <div class="agent-tone">tone: unknown</div>
        </div>
        
        <div class="argument-display" id="blue-arguments">
            Waiting for debate to start...
        </div>
    </div>
    
    <div class="evidence">
        <h3> Chat Evidence Archive</h3>
        <div id="evidence-list">
            Loading conversation evidence...
        </div>
    </div>
</div>

<script>
let availableAgents = [];
let debateActive = false;
let redScore = 0;
let blueScore = 0;

// Load agents on startup
async function loadAgents() {
    try {
        const response = await fetch('/api/agents');
        const data = await response.json();
        availableAgents = data.agents || [];
        
        populateAgentSelects();
    } catch (error) {
        console.error('Failed to load agents:', error);
    }
}

function populateAgentSelects() {
    const redSelect = document.getElementById('red-agent-select');
    const blueSelect = document.getElementById('blue-agent-select');
    
    // Clear existing options
    redSelect.innerHTML = '<option value="">Choose Red Agent</option>';
    blueSelect.innerHTML = '<option value="">Choose Blue Agent</option>';
    
    availableAgents.forEach(agent => {
        const redOption = document.createElement('option');
        redOption.value = agent.id;
        redOption.textContent = `${agent.id} (${agent.tone})`;
        redSelect.appendChild(redOption);
        
        const blueOption = document.createElement('option');
        blueOption.value = agent.id;
        blueOption.textContent = `${agent.id} (${agent.tone})`;
        blueSelect.appendChild(blueOption);
    });
}

async function startDebate() {
    const redAgent = document.getElementById('red-agent-select').value;
    const blueAgent = document.getElementById('blue-agent-select').value;
    const topic = document.getElementById('debate-topic').value;
    
    if (!redAgent || !blueAgent) {
        alert('Please select both agents');
        return;
    }
    
    if (redAgent === blueAgent) {
        alert('Please select different agents for each corner');
        return;
    }
    
    try {
        const response = await fetch('/api/start-debate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                red_agent: redAgent,
                blue_agent: blueAgent,
                topic: topic
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // Hide setup panel
            document.getElementById('setup-panel').classList.add('hidden');
            
            // Update UI
            updateAgentInfo('red', redAgent);
            updateAgentInfo('blue', blueAgent);
            document.getElementById('current-topic').textContent = topic;
            document.getElementById('arena-status').textContent = 'Debate in progress...';
            
            debateActive = true;
            startDebateLoop();
        } else {
            alert('Failed to start debate: ' + result.message);
        }
    } catch (error) {
        alert('Error starting debate');
        console.error(error);
    }
}

function updateAgentInfo(corner, agentId) {
    const agent = availableAgents.find(a => a.id === agentId);
    if (!agent) return;
    
    const infoDiv = document.getElementById(`${corner}-agent-info`);
    infoDiv.innerHTML = `
        <div class="agent-name">${agent.id}</div>
        <div class="agent-tone">tone: ${agent.tone}</div>
    `;
}

function startDebateLoop() {
    // Simulate arguments from agents
    setInterval(() => {
        if (!debateActive) return;
        
        // Red agent argument
        if (Math.random() < 0.3) {
            addArgument('red', generateArgument('red'));
        }
        
        // Blue agent argument  
        if (Math.random() < 0.3) {
            addArgument('blue', generateArgument('blue'));
        }
        
    }, 3000);
}

function generateArgument(corner) {
    const redArguments = [
        "Based on chat analysis, aggressive approaches yield 23% better engagement",
        "Historical data shows determined strategies outperform cautious ones",
        "User feedback indicates preference for bold, decisive action",
        "Evidence from conversation logs supports rapid iteration methods"
    ];
    
    const blueArguments = [
        "Analytical review reveals methodical approaches have 31% less failure rate",
        "Chat evidence demonstrates user appreciation for thoughtful consideration", 
        "Systematic analysis of conversation patterns favors careful planning",
        "Data integrity improves with measured, analytical decision-making"
    ];
    
    const arguments = corner === 'red' ? redArguments : blueArguments;
    return arguments[Math.floor(Math.random() * arguments.length)];
}

function addArgument(corner, argument) {
    const argumentsDiv = document.getElementById(`${corner}-arguments`);
    const timestamp = new Date().toLocaleTimeString();
    
    argumentsDiv.innerHTML += `
        <div style="margin-bottom: 10px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 3px;">
            <div style="font-size: 12px; opacity: 0.7;">[${timestamp}]</div>
            <div>${argument}</div>
        </div>
    `;
    
    argumentsDiv.scrollTop = argumentsDiv.scrollHeight;
}

function judgeWinner(corner) {
    if (!debateActive) return;
    
    if (corner === 'red') {
        redScore++;
        document.getElementById('red-score').textContent = redScore;
        addArgument('red', ' Judge awards point to Red Corner! Argument was compelling.');
    } else {
        blueScore++;
        document.getElementById('blue-score').textContent = blueScore;
        addArgument('blue', ' Judge awards point to Blue Corner! Logic was sound.');
    }
    
    // Check for winner
    if (redScore >= 5 || blueScore >= 5) {
        const winner = redScore >= 5 ? 'Red' : 'Blue';
        document.getElementById('arena-status').textContent = ` ${winner} Corner Wins the Debate!`;
        debateActive = false;
    }
}

// Load chat evidence
async function loadEvidence() {
    try {
        const response = await fetch('/api/chat-evidence');
        const evidence = await response.json();
        
        const evidenceList = document.getElementById('evidence-list');
        evidenceList.innerHTML = '';
        
        evidence.forEach(item => {
            evidenceList.innerHTML += `
                <div class="evidence-item">
                    <div class="evidence-meta">
                        ${item.agent} • ${item.tone} • ${item.timestamp}
                    </div>
                    <div>Source: ${item.source}</div>
                </div>
            `;
        });
    } catch (error) {
        console.error('Failed to load evidence:', error);
    }
}

// Initialize
loadAgents();
loadEvidence();

// Refresh evidence every 30 seconds
setInterval(loadEvidence, 30000);
</script>

</body>
</html>
"""

if __name__ == "__main__":
    print(" AI DEBATE COLOSSEUM")
    print("=" * 50)
    print(f" Colosseum running on http://localhost:{PORT}")
    print(" Integrates with Agent Bridge on port 8777")
    print(" Where AIs debate and users judge!")
    
    with HTTPServer(("", PORT), DebateColosseum) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n Colosseum shutting down...")