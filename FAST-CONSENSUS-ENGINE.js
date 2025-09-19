#!/usr/bin/env node
// FAST-CONSENSUS-ENGINE.js - No spawning, just wake existing characters and run consensus

const PersistentCharacterRoster = require('./PERSISTENT-CHARACTER-ROSTER.js');
const http = require('http');
const WebSocket = require('ws');

class FastConsensusEngine {
    constructor() {
        this.port = 5555;
        this.wsPort = 5556;
        
        // Use persistent characters instead of spawning
        this.roster = new PersistentCharacterRoster();
        this.activeCharacters = {};
        this.consensusRound = 0;
        this.sharedLedger = {
            rules: new Map(),
            decisions: [],
            character_interactions: [],
            projects: {
                'database_system': { progress: 0, workers: [] },
                'forum_system': { progress: 0, workers: [] },
                'consensus_protocol': { progress: 0, workers: [] }
            }
        };
        
        this.websocketClients = new Set();
        
        console.log('⚡ FAST CONSENSUS ENGINE');
        console.log('========================');
        console.log('🚀 No spawning - instant character activation');
        console.log('👥 Fixed personalities and relationships');
        console.log('💨 Sub-second consensus rounds');
    }

    start() {
        // Instantly wake the core team
        this.activateCoreTeam();
        
        // Start services
        this.startWebServer();
        this.startWebSocket();
        
        // Begin fast consensus cycles
        this.beginFastConsensus();
        
        console.log('\n⚡ FAST CONSENSUS ENGINE STARTED');
        console.log('================================');
        console.log(`🌐 Dashboard: http://localhost:${this.port}`);
        console.log(`📡 WebSocket: ws://localhost:${this.wsPort}`);
        console.log('💨 Fast consensus cycles running');
    }

    activateCoreTeam() {
        console.log('\n👥 ACTIVATING CORE TEAM...');
        
        // Wake the core consensus team instantly
        const coreTeam = this.roster.wakeTeam('core_consensus');
        
        // Map to our system
        this.activeCharacters = {
            alice: coreTeam[0],   // alice_validator
            bob: coreTeam[1],     // bob_generator  
            charlie: coreTeam[2], // charlie_decider
            diana: coreTeam[3]    // diana_checker
        };
        
        console.log('✅ Core team activated instantly:');
        Object.entries(this.activeCharacters).forEach(([key, char]) => {
            console.log(`   ${char.name} (${char.role}) - ${char.personality.archetype}`);
        });
    }

    beginFastConsensus() {
        console.log('\n⚡ BEGINNING FAST CONSENSUS CYCLES...');
        
        // Run first round immediately
        setTimeout(() => this.runFastConsensusRound(), 100);
        
        // Then every 10 seconds for fast iteration
        setInterval(() => this.runFastConsensusRound(), 10000);
        
        // Character interactions every 5 seconds
        setInterval(() => this.generateCharacterInteraction(), 5000);
        
        // Project work every 15 seconds
        setInterval(() => this.advanceProjects(), 15000);
    }

    runFastConsensusRound() {
        this.consensusRound++;
        
        console.log(`\n⚡ FAST CONSENSUS ROUND ${this.consensusRound}`);
        console.log('=====================================');
        
        // Step 1: Bob generates input (instant)
        const bobInput = this.characterAction('bob', 'generate_input');
        console.log(`🎲 ${this.activeCharacters.bob.name}: ${bobInput.content}`);
        
        // Step 2: Alice validates (instant)  
        const aliceValidation = this.characterAction('alice', 'validate', bobInput);
        console.log(`✅ ${this.activeCharacters.alice.name}: ${aliceValidation.content}`);
        
        // Step 3: Charlie decides (instant)
        const charlieDecision = this.characterAction('charlie', 'decide', {bobInput, aliceValidation});
        console.log(`🧠 ${this.activeCharacters.charlie.name}: ${charlieDecision.content}`);
        
        // Step 4: Diana verifies (instant)
        const dianaVerification = this.characterAction('diana', 'verify', charlieDecision);
        console.log(`📋 ${this.activeCharacters.diana.name}: ${dianaVerification.content}`);
        
        // Create consensus result
        const consensusResult = {
            round: this.consensusRound,
            input: bobInput,
            validation: aliceValidation,
            decision: charlieDecision,
            verification: dianaVerification,
            status: dianaVerification.verified ? 'APPROVED' : 'REJECTED',
            timestamp: Date.now()
        };
        
        this.sharedLedger.decisions.push(consensusResult);
        
        if (consensusResult.status === 'APPROVED') {
            const ruleId = `rule_${this.consensusRound}`;
            this.sharedLedger.rules.set(ruleId, {
                id: ruleId,
                content: charlieDecision.content,
                established: Date.now(),
                round: this.consensusRound
            });
            console.log(`📜 NEW RULE: ${charlieDecision.content}`);
        }
        
        console.log(`📊 Status: ${consensusResult.status} | Rules: ${this.sharedLedger.rules.size}`);
        
        // Broadcast to WebSocket clients
        this.broadcast({
            type: 'consensus_result',
            result: consensusResult,
            ledger_stats: {
                rules: this.sharedLedger.rules.size,
                decisions: this.sharedLedger.decisions.length
            }
        });
    }

    characterAction(characterKey, actionType, context = null) {
        const character = this.activeCharacters[characterKey];
        const actions = {
            bob: {
                generate_input: () => ({
                    type: 'INPUT_GENERATION',
                    content: this.generateBobInput(),
                    confidence: Math.random() * 0.3 + 0.7, // 70-100%
                    character: character.name
                })
            },
            alice: {
                validate: (input) => ({
                    type: 'VALIDATION',
                    content: this.generateAliceValidation(input),
                    verified: Math.random() > 0.2, // 80% validation rate
                    confidence: Math.random() * 0.2 + 0.8, // 80-100%
                    character: character.name
                })
            },
            charlie: {
                decide: (inputs) => ({
                    type: 'DECISION',
                    content: this.generateCharlieDecision(inputs),
                    reasoning: this.generateReasoning(inputs),
                    confidence: Math.random() * 0.3 + 0.7,
                    character: character.name
                })
            },
            diana: {
                verify: (decision) => ({
                    type: 'VERIFICATION',
                    content: this.generateDianaVerification(decision),
                    verified: Math.random() > 0.15, // 85% verification rate
                    checks_passed: Math.floor(Math.random() * 3) + 1, // 1-3 checks
                    character: character.name
                })
            }
        };
        
        return actions[characterKey][actionType](context);
    }

    generateBobInput() {
        const inputs = [
            'Propose new consensus algorithm optimization',
            'Suggest database indexing improvement', 
            'Generate forum moderation enhancement',
            'Create user authentication upgrade',
            'Design API rate limiting system',
            'Implement caching mechanism',
            'Develop monitoring dashboard',
            'Build notification system'
        ];
        return inputs[Math.floor(Math.random() * inputs.length)];
    }

    generateAliceValidation(input) {
        const validations = [
            `Input validated: ${input.content} meets security standards`,
            `Verification complete: ${input.content} passes all checks`,
            `Analysis confirmed: ${input.content} is technically sound`,
            `Review passed: ${input.content} aligns with protocols`
        ];
        return validations[Math.floor(Math.random() * validations.length)];
    }

    generateCharlieDecision(inputs) {
        const decisions = [
            `Approved: Implementing ${inputs.bobInput.content} with high priority`,
            `Conditional approval: ${inputs.bobInput.content} needs minor adjustments`,
            `Approved: ${inputs.bobInput.content} for next development cycle`,
            `Fast-track: ${inputs.bobInput.content} for immediate implementation`
        ];
        return decisions[Math.floor(Math.random() * decisions.length)];
    }

    generateDianaVerification(decision) {
        const verifications = [
            `Ledger verification: Decision aligns with established rules`,
            `Audit complete: Decision passes all verification checks`,
            `Cross-reference confirmed: Decision is consistent with history`,
            `Final verification: Decision approved for rule establishment`
        ];
        return verifications[Math.floor(Math.random() * verifications.length)];
    }

    generateReasoning(inputs) {
        return `Based on ${inputs.bobInput.character}'s input and ${inputs.aliceValidation.character}'s validation, this decision optimizes system performance while maintaining security.`;
    }

    generateCharacterInteraction() {
        const characterKeys = Object.keys(this.activeCharacters);
        const char1Key = characterKeys[Math.floor(Math.random() * characterKeys.length)];
        let char2Key = characterKeys[Math.floor(Math.random() * characterKeys.length)];
        
        // Ensure different characters
        while (char2Key === char1Key) {
            char2Key = characterKeys[Math.floor(Math.random() * characterKeys.length)];
        }
        
        const char1 = this.activeCharacters[char1Key];
        const char2 = this.activeCharacters[char2Key];
        
        const interaction = this.roster.generateInteraction(char1.id, char2.id, 'work');
        
        if (interaction) {
            console.log(`💬 ${interaction.from.name} → ${interaction.to.name}: "${interaction.content}"`);
            
            this.sharedLedger.character_interactions.push(interaction);
            
            // Broadcast interaction
            this.broadcast({
                type: 'character_interaction',
                interaction: {
                    from: interaction.from.name,
                    to: interaction.to.name,
                    content: interaction.content,
                    timestamp: interaction.timestamp
                }
            });
        }
    }

    advanceProjects() {
        const projects = Object.keys(this.sharedLedger.projects);
        const project = projects[Math.floor(Math.random() * projects.length)];
        const projectData = this.sharedLedger.projects[project];
        
        // Random character works on project
        const characterKeys = Object.keys(this.activeCharacters);
        const workerKey = characterKeys[Math.floor(Math.random() * characterKeys.length)];
        const worker = this.activeCharacters[workerKey];
        
        const progress = Math.random() * 15 + 5; // 5-20 progress
        projectData.progress += progress;
        
        if (!projectData.workers.includes(worker.name)) {
            projectData.workers.push(worker.name);
        }
        
        console.log(`🔨 ${worker.name} advanced ${project}: +${progress.toFixed(1)} (${projectData.progress.toFixed(1)}%)`);
        
        // Check completion
        if (projectData.progress >= 100 && !projectData.completed) {
            projectData.completed = true;
            console.log(`🎉 PROJECT COMPLETED: ${project}`);
            
            this.broadcast({
                type: 'project_completed',
                project: project,
                workers: projectData.workers
            });
        }
        
        this.broadcast({
            type: 'project_progress',
            project: project,
            progress: projectData.progress,
            worker: worker.name
        });
    }

    startWebServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            if (req.url === '/') {
                this.serveDashboard(res);
            } else if (req.url === '/status') {
                this.serveStatus(res);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`\n🌐 Fast Consensus Dashboard: http://localhost:${this.port}`);
        });
    }

    startWebSocket() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            console.log('📡 Client connected to fast consensus');
            this.websocketClients.add(ws);
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'initial_state',
                characters: Object.values(this.activeCharacters).map(char => ({
                    name: char.name,
                    role: char.role,
                    archetype: char.personality.archetype,
                    status: char.current_status
                })),
                ledger_stats: {
                    rules: this.sharedLedger.rules.size,
                    decisions: this.sharedLedger.decisions.length,
                    interactions: this.sharedLedger.character_interactions.length
                },
                projects: this.sharedLedger.projects
            }));
            
            ws.on('close', () => {
                this.websocketClients.delete(ws);
                console.log('📡 Client disconnected from fast consensus');
            });
        });
        
        console.log(`📡 Fast Consensus WebSocket: ws://localhost:${this.wsPort}`);
    }

    broadcast(data) {
        const message = JSON.stringify(data);
        this.websocketClients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }

    serveDashboard(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>⚡ Fast Consensus Engine</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #00ff88; 
            margin: 0; 
            padding: 20px;
            min-height: 100vh;
        }
        .header { 
            text-align: center; 
            font-size: 2.5em; 
            text-shadow: 0 0 20px #00ff88;
            margin-bottom: 30px;
            animation: glow 2s infinite;
        }
        @keyframes glow {
            0%, 100% { text-shadow: 0 0 20px #00ff88; }
            50% { text-shadow: 0 0 30px #00ff88, 0 0 40px #00ff00; }
        }
        .grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
            gap: 20px; 
            max-width: 1800px; 
            margin: 0 auto;
        }
        .panel { 
            border: 2px solid #00ff88;
            border-radius: 15px; 
            padding: 20px;
            background: rgba(0, 255, 136, 0.05);
            backdrop-filter: blur(10px);
        }
        .character-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #00ff88;
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
            text-align: center;
        }
        .consensus-step {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            border-radius: 8px;
            padding: 10px;
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .project-bar {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            height: 20px;
            margin: 5px 0;
            overflow: hidden;
        }
        .progress-fill {
            background: linear-gradient(90deg, #00ff88, #00cc70);
            height: 100%;
            transition: width 0.5s ease;
        }
        .live-feed {
            max-height: 400px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            padding: 15px;
        }
        .feed-item {
            background: rgba(0, 255, 136, 0.1);
            border-left: 3px solid #00ff88;
            padding: 8px;
            margin: 5px 0;
            border-radius: 0 5px 5px 0;
            animation: slideIn 0.5s ease-out;
        }
        @keyframes slideIn {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .speed-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 255, 136, 0.2);
            border: 2px solid #00ff88;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="speed-indicator" title="Fast Processing">⚡</div>
    
    <div class="header">
        ⚡ FAST CONSENSUS ENGINE
    </div>
    
    <div class="grid">
        <div class="panel">
            <h2>👥 Active Characters</h2>
            <div id="characters">Loading characters...</div>
            
            <h3>📊 Performance Stats</h3>
            <div>Rules Established: <span id="rules-count">0</span></div>
            <div>Decisions Made: <span id="decisions-count">0</span></div>
            <div>Interactions: <span id="interactions-count">0</span></div>
        </div>
        
        <div class="panel">
            <h2>⚡ Live Consensus</h2>
            <div>Round: <span id="consensus-round">0</span></div>
            <div id="consensus-steps">
                <div class="consensus-step">1. Bob Generates Input</div>
                <div class="consensus-step">2. Alice Validates</div>
                <div class="consensus-step">3. Charlie Decides</div>
                <div class="consensus-step">4. Diana Verifies</div>
            </div>
            
            <h3>📜 Recent Decision</h3>
            <div id="recent-decision">Waiting for consensus...</div>
        </div>
        
        <div class="panel">
            <h2>🏗️ Project Progress</h2>
            <div id="projects">Loading projects...</div>
        </div>
        
        <div class="panel" style="grid-column: span 3;">
            <h2>💬 Live Activity Feed</h2>
            <div class="live-feed" id="live-feed">
                <div class="feed-item">⚡ Fast Consensus Engine starting...</div>
            </div>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:5556');
        let state = {};
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleUpdate(data);
        };
        
        function handleUpdate(data) {
            switch (data.type) {
                case 'initial_state':
                    state = data;
                    updateInterface();
                    break;
                case 'consensus_result':
                    updateConsensus(data);
                    addToFeed(\`📜 Round \${data.result.round}: \${data.result.status}\`);
                    break;
                case 'character_interaction':
                    addToFeed(\`💬 \${data.interaction.from} → \${data.interaction.to}: \${data.interaction.content}\`);
                    break;
                case 'project_progress':
                    updateProjectProgress(data);
                    addToFeed(\`🔨 \${data.worker} advanced \${data.project}: \${data.progress.toFixed(1)}%\`);
                    break;
                case 'project_completed':
                    addToFeed(\`🎉 \${data.project} COMPLETED by \${data.workers.join(', ')}\`);
                    break;
            }
        }
        
        function updateInterface() {
            updateCharacters();
            updateStats();
            updateProjects();
        }
        
        function updateCharacters() {
            const charactersDiv = document.getElementById('characters');
            const charactersHtml = state.characters.map(char => \`
                <div class="character-card">
                    <strong>\${char.name}</strong><br>
                    <small>\${char.role}</small><br>
                    <em>\${char.archetype}</em>
                </div>
            \`).join('');
            charactersDiv.innerHTML = charactersHtml;
        }
        
        function updateStats() {
            document.getElementById('rules-count').textContent = state.ledger_stats.rules;
            document.getElementById('decisions-count').textContent = state.ledger_stats.decisions;
            document.getElementById('interactions-count').textContent = state.ledger_stats.interactions;
        }
        
        function updateProjects() {
            const projectsDiv = document.getElementById('projects');
            const projectsHtml = Object.entries(state.projects).map(([name, data]) => \`
                <div style="margin: 15px 0;">
                    <strong>\${name.replace(/_/g, ' ').toUpperCase()}</strong>
                    \${data.completed ? '✅' : ''}
                    <div class="project-bar">
                        <div class="progress-fill" style="width: \${Math.min(data.progress, 100)}%"></div>
                    </div>
                    <small>\${data.progress.toFixed(1)}% | Workers: \${data.workers.join(', ') || 'None'}</small>
                </div>
            \`).join('');
            projectsDiv.innerHTML = projectsHtml;
        }
        
        function updateConsensus(data) {
            document.getElementById('consensus-round').textContent = data.result.round;
            document.getElementById('recent-decision').textContent = data.result.decision.content;
            state.ledger_stats = data.ledger_stats;
            updateStats();
        }
        
        function updateProjectProgress(data) {
            if (state.projects[data.project]) {
                state.projects[data.project].progress = data.progress;
                updateProjects();
            }
        }
        
        function addToFeed(message) {
            const feedDiv = document.getElementById('live-feed');
            const feedItem = document.createElement('div');
            feedItem.className = 'feed-item';
            feedItem.innerHTML = \`
                \${message}
                <div style="font-size: 0.8em; opacity: 0.7; float: right;">
                    \${new Date().toLocaleTimeString()}
                </div>
            \`;
            feedDiv.appendChild(feedItem);
            
            // Keep only last 30 items
            while (feedDiv.children.length > 30) {
                feedDiv.removeChild(feedDiv.firstChild);
            }
            
            // Auto-scroll to bottom
            feedDiv.scrollTop = feedDiv.scrollHeight;
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }

    serveStatus(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'active',
            characters: Object.keys(this.activeCharacters).length,
            consensus_round: this.consensusRound,
            rules: this.sharedLedger.rules.size,
            decisions: this.sharedLedger.decisions.length,
            projects: this.sharedLedger.projects,
            uptime: process.uptime()
        }));
    }
}

// INSTANT START - No delays
if (require.main === module) {
    console.log('⚡ STARTING FAST CONSENSUS ENGINE');
    console.log('=================================');
    console.log('🚀 Instant character activation');
    console.log('💨 Sub-second consensus rounds');
    console.log('👥 Persistent character relationships');
    console.log('');
    
    const engine = new FastConsensusEngine();
    engine.start();
}

module.exports = FastConsensusEngine;