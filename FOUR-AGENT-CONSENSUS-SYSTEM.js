#!/usr/bin/env node
// FOUR-AGENT-CONSENSUS-SYSTEM.js - 4 agents working together with clear roles

const fs = require('fs');
const crypto = require('crypto');
const WebSocket = require('ws');
const http = require('http');
const { spawn } = require('child_process');

class FourAgentConsensusSystem {
    constructor() {
        this.port = 6666;
        this.wsPort = 6667;
        
        // THE 4 AGENTS WITH SPECIFIC ROLES
        this.agents = {
            'FLIPPER_A': {
                id: 'agent_1',
                name: 'FlipperAlpha',
                role: 'INPUT_GENERATOR',
                description: 'Generates random inputs and proposals',
                location: 'SOL_TERRITORY',
                blockchain: 'solana',
                status: 'ACTIVE',
                coinFlips: 0,
                decisions: []
            },
            'FLIPPER_B': {
                id: 'agent_2', 
                name: 'FlipperBeta',
                role: 'INPUT_VALIDATOR',
                description: 'Validates and modifies inputs from FlipperAlpha',
                location: 'XMR_TERRITORY',
                blockchain: 'monero',
                status: 'ACTIVE',
                validations: 0,
                decisions: []
            },
            'DECIDER': {
                id: 'agent_3',
                name: 'DecisionEngine',
                role: 'CONCLUSION_WRITER', 
                description: 'Makes final decisions and writes conclusions',
                location: 'ETH_TERRITORY',
                blockchain: 'ethereum',
                status: 'ACTIVE',
                conclusions: 0,
                decisions: []
            },
            'CHECKER': {
                id: 'agent_4',
                name: 'LedgerChecker',
                role: 'VERIFICATION_AUDITOR',
                description: 'Checks work against the ledger and establishes rules',
                location: 'BTC_TERRITORY', 
                blockchain: 'bitcoin',
                status: 'ACTIVE',
                verifications: 0,
                decisions: []
            }
        };
        
        // CONSENSUS WORKFLOW
        this.consensusWorkflow = {
            currentRound: 0,
            activeProposal: null,
            workflowSteps: [
                'FLIP_GENERATION',    // Agent 1 & 2 generate inputs
                'DECISION_MAKING',    // Agent 3 decides
                'LEDGER_CHECK',       // Agent 4 verifies
                'RULE_ESTABLISHMENT'  // Result becomes rule
            ],
            currentStep: 0,
            proposalHistory: []
        };
        
        // SHARED LEDGER (their database)
        this.sharedLedger = {
            rules: new Map(),
            transactions: [],
            agentActions: [],
            consensusHistory: [],
            buildingProjects: {
                'database_system': { progress: 0, agents_working: [] },
                'phpbb_fork': { progress: 0, agents_working: [] },
                'git_fork': { progress: 0, agents_working: [] },
                'consensus_protocol': { progress: 0, agents_working: [] }
            }
        };
        
        // AGENT COMMUNICATION CHANNELS
        this.agentChannels = new Map();
        this.agentMessages = [];
        
        console.log('🤖 FOUR AGENT CONSENSUS SYSTEM');
        console.log('==============================');
        console.log('👥 4 Agents: FlipperAlpha, FlipperBeta, DecisionEngine, LedgerChecker');
        console.log('🔄 Workflow: Flip → Flip → Decide → Verify → Rule');
    }
    
    start() {
        this.initializeAgents();
        this.setupAgentCommunication();
        this.startConsensusEngine();
        this.beginCollaborativeBuilding();
        this.startConsensusServer();
        this.startConsensusWebSocket();
        this.runFirstConsensusRound();
    }
    
    initializeAgents() {
        console.log('🤖 INITIALIZING 4 AGENTS...');
        
        Object.values(this.agents).forEach(agent => {
            // Initialize agent state
            agent.lastAction = Date.now();
            agent.workQueue = [];
            agent.currentTask = null;
            agent.communicationBuffer = [];
            
            console.log(`   ${agent.name} (${agent.role}) in ${agent.location}`);
        });
        
        console.log('✅ All 4 agents initialized');
    }
    
    setupAgentCommunication() {
        console.log('💬 SETTING UP AGENT COMMUNICATION...');
        
        // Create communication channels between agents
        const agentIds = Object.keys(this.agents);
        
        agentIds.forEach(agentId => {
            this.agentChannels.set(agentId, {
                inbox: [],
                outbox: [],
                lastMessage: null,
                messageCount: 0
            });
        });
        
        console.log('✅ Agent communication channels established');
    }
    
    startConsensusEngine() {
        console.log('\\n🔄 STARTING CONSENSUS ENGINE...');
        
        // Run consensus rounds every 30 seconds
        setInterval(() => {
            this.runConsensusRound();
        }, 30000);
        
        // Agents communicate every 10 seconds
        setInterval(() => {
            this.facilitateAgentCommunication();
        }, 10000);
    }
    
    runFirstConsensusRound() {
        console.log('\\n🎯 RUNNING FIRST CONSENSUS ROUND...');
        setTimeout(() => this.runConsensusRound(), 5000);
    }
    
    runConsensusRound() {
        this.consensusWorkflow.currentRound++;
        this.consensusWorkflow.currentStep = 0;
        
        console.log(`\\n🔄 CONSENSUS ROUND ${this.consensusWorkflow.currentRound}`);
        console.log('================================================');
        
        // Start the 4-step workflow
        this.executeWorkflowStep();
    }
    
    executeWorkflowStep() {
        const step = this.consensusWorkflow.workflowSteps[this.consensusWorkflow.currentStep];
        
        console.log(`\\n📍 STEP ${this.consensusWorkflow.currentStep + 1}: ${step}`);
        
        switch (step) {
            case 'FLIP_GENERATION':
                this.stepFlipGeneration();
                break;
            case 'DECISION_MAKING':
                this.stepDecisionMaking();
                break;
            case 'LEDGER_CHECK':
                this.stepLedgerCheck();
                break;
            case 'RULE_ESTABLISHMENT':
                this.stepRuleEstablishment();
                break;
        }
        
        // Move to next step after delay
        setTimeout(() => {
            this.consensusWorkflow.currentStep++;
            
            if (this.consensusWorkflow.currentStep < this.consensusWorkflow.workflowSteps.length) {
                this.executeWorkflowStep();
            } else {
                console.log('✅ Consensus round complete\\n');
            }
        }, 8000); // 8 seconds between steps
    }
    
    stepFlipGeneration() {
        console.log('🎲 FlipperAlpha and FlipperBeta generating inputs...');
        
        // FLIPPER_A generates random input
        const flipperA = this.agents.FLIPPER_A;
        const inputA = {
            type: 'COIN_FLIP',
            value: Math.random() < 0.5 ? 'HEADS' : 'TAILS',
            data: Math.random(),
            timestamp: Date.now(),
            agent: 'FLIPPER_A'
        };
        flipperA.coinFlips++;
        flipperA.decisions.push(inputA);
        
        console.log(`   🎯 FlipperAlpha: ${inputA.value} (${inputA.data.toFixed(4)})`);
        
        // FLIPPER_B validates and potentially modifies
        const flipperB = this.agents.FLIPPER_B;
        const validation = Math.random() < 0.7; // 70% validation rate
        const inputB = {
            type: 'VALIDATION',
            original: inputA,
            validated: validation,
            modification: validation ? inputA.value : (inputA.value === 'HEADS' ? 'TAILS' : 'HEADS'),
            confidence: Math.random(),
            timestamp: Date.now(),
            agent: 'FLIPPER_B'
        };
        flipperB.validations++;
        flipperB.decisions.push(inputB);
        
        console.log(`   ✅ FlipperBeta: ${validation ? 'VALIDATED' : 'MODIFIED'} → ${inputB.modification}`);
        
        // Send to communication channels
        this.sendAgentMessage('FLIPPER_A', 'DECIDER', inputA);
        this.sendAgentMessage('FLIPPER_B', 'DECIDER', inputB);
        
        // Store as active proposal
        this.consensusWorkflow.activeProposal = {
            round: this.consensusWorkflow.currentRound,
            inputA: inputA,
            inputB: inputB,
            created: Date.now()
        };
    }
    
    stepDecisionMaking() {
        console.log('🧠 DecisionEngine making final decision...');
        
        const decider = this.agents.DECIDER;
        const proposal = this.consensusWorkflow.activeProposal;
        
        if (!proposal) {
            console.log('   ❌ No proposal available for decision');
            return;
        }
        
        // DecisionEngine analyzes inputs and makes conclusion
        const decision = {
            type: 'FINAL_DECISION',
            inputAnalysis: {
                flipperA_input: proposal.inputA.value,
                flipperB_validation: proposal.inputB.validated,
                flipperB_modification: proposal.inputB.modification
            },
            conclusion: null,
            reasoning: '',
            confidence: Math.random(),
            timestamp: Date.now(),
            agent: 'DECIDER'
        };
        
        // Decision logic
        if (proposal.inputB.validated) {
            decision.conclusion = proposal.inputA.value;
            decision.reasoning = 'FlipperBeta validated FlipperAlpha input';
        } else {
            decision.conclusion = proposal.inputB.modification;
            decision.reasoning = 'FlipperBeta modified input, using their decision';
        }
        
        decider.conclusions++;
        decider.decisions.push(decision);
        
        console.log(`   🎯 Decision: ${decision.conclusion}`);
        console.log(`   💭 Reasoning: ${decision.reasoning}`);
        
        // Send to LedgerChecker
        this.sendAgentMessage('DECIDER', 'CHECKER', decision);
        
        // Update active proposal
        this.consensusWorkflow.activeProposal.decision = decision;
    }
    
    stepLedgerCheck() {
        console.log('📋 LedgerChecker verifying against ledger...');
        
        const checker = this.agents.CHECKER;
        const proposal = this.consensusWorkflow.activeProposal;
        
        if (!proposal || !proposal.decision) {
            console.log('   ❌ No decision available for verification');
            return;
        }
        
        // Check against existing rules and history
        const verification = {
            type: 'LEDGER_VERIFICATION',
            decision: proposal.decision.conclusion,
            checks: {
                consistency: this.checkConsistency(proposal.decision),
                history: this.checkHistory(proposal.decision),
                logic: this.checkLogic(proposal.decision)
            },
            verified: false,
            conflicts: [],
            timestamp: Date.now(),
            agent: 'CHECKER'
        };
        
        // Verification logic
        const passedChecks = Object.values(verification.checks).filter(check => check).length;
        verification.verified = passedChecks >= 2; // Need 2/3 checks to pass
        
        checker.verifications++;
        checker.decisions.push(verification);
        
        console.log(`   📊 Consistency: ${verification.checks.consistency ? '✅' : '❌'}`);
        console.log(`   📚 History: ${verification.checks.history ? '✅' : '❌'}`);
        console.log(`   🧮 Logic: ${verification.checks.logic ? '✅' : '❌'}`);
        console.log(`   🎯 Verification: ${verification.verified ? 'PASSED' : 'FAILED'}`);
        
        // Update active proposal
        this.consensusWorkflow.activeProposal.verification = verification;
    }
    
    stepRuleEstablishment() {
        console.log('📜 Establishing new rule from consensus...');
        
        const proposal = this.consensusWorkflow.activeProposal;
        
        if (!proposal || !proposal.verification) {
            console.log('   ❌ No verification available for rule establishment');
            return;
        }
        
        if (proposal.verification.verified) {
            // Create new rule
            const rule = {
                id: `rule_${this.consensusWorkflow.currentRound}`,
                content: `Decision "${proposal.decision.conclusion}" established through consensus`,
                reasoning: proposal.decision.reasoning,
                established: Date.now(),
                round: this.consensusWorkflow.currentRound,
                agentsInvolved: ['FLIPPER_A', 'FLIPPER_B', 'DECIDER', 'CHECKER'],
                strength: proposal.verification.checks
            };
            
            this.sharedLedger.rules.set(rule.id, rule);
            this.sharedLedger.consensusHistory.push(proposal);
            
            console.log(`   ✅ NEW RULE ESTABLISHED: ${rule.content}`);
            console.log(`   📝 Rule ID: ${rule.id}`);
            
            // Broadcast to all agents
            Object.keys(this.agents).forEach(agentId => {
                this.sendAgentMessage('SYSTEM', agentId, {
                    type: 'RULE_ESTABLISHED',
                    rule: rule,
                    timestamp: Date.now()
                });
            });
            
        } else {
            console.log('   ❌ Consensus failed - no rule established');
            
            // Record failed consensus
            this.sharedLedger.consensusHistory.push({
                ...proposal,
                status: 'FAILED',
                reason: 'Verification failed'
            });
        }
        
        console.log(`   📊 Total Rules: ${this.sharedLedger.rules.size}`);
    }
    
    checkConsistency(decision) {
        // Check if decision is consistent with previous decisions
        const recentDecisions = this.sharedLedger.consensusHistory
            .slice(-5)
            .filter(p => p.decision);
        
        if (recentDecisions.length === 0) return true;
        
        // Simple consistency check
        const sameDecisions = recentDecisions.filter(p => 
            p.decision.conclusion === decision.conclusion
        ).length;
        
        return sameDecisions / recentDecisions.length >= 0.3; // 30% consistency threshold
    }
    
    checkHistory(decision) {
        // Check if decision fits with historical patterns
        return Math.random() < 0.8; // 80% chance of passing history check
    }
    
    checkLogic(decision) {
        // Check logical validity of decision process
        return decision.reasoning && decision.reasoning.length > 10; // Has reasoning
    }
    
    sendAgentMessage(fromAgent, toAgent, message) {
        const channel = this.agentChannels.get(toAgent);
        if (channel) {
            channel.inbox.push({
                from: fromAgent,
                message: message,
                timestamp: Date.now()
            });
            channel.messageCount++;
        }
        
        // Store in global message log
        this.agentMessages.push({
            from: fromAgent,
            to: toAgent,
            message: message,
            timestamp: Date.now()
        });
        
        console.log(`   📨 ${fromAgent} → ${toAgent}: ${message.type || 'message'}`);
    }
    
    facilitateAgentCommunication() {
        // Agents discuss and collaborate
        const discussions = [
            { from: 'FLIPPER_A', to: 'FLIPPER_B', topic: 'Comparing flip strategies' },
            { from: 'DECIDER', to: 'CHECKER', topic: 'Reviewing decision criteria' },
            { from: 'CHECKER', to: 'FLIPPER_A', topic: 'Feedback on input quality' },
            { from: 'FLIPPER_B', to: 'DECIDER', topic: 'Validation methodology' }
        ];
        
        const randomDiscussion = discussions[Math.floor(Math.random() * discussions.length)];
        
        this.sendAgentMessage(randomDiscussion.from, randomDiscussion.to, {
            type: 'DISCUSSION',
            topic: randomDiscussion.topic,
            content: `Let's discuss ${randomDiscussion.topic.toLowerCase()}`,
            timestamp: Date.now()
        });
    }
    
    beginCollaborativeBuilding() {
        console.log('\\n🏗️ BEGINNING COLLABORATIVE BUILDING...');
        
        // Agents work together on building projects
        setInterval(() => {
            this.workOnCollaborativeProjects();
        }, 45000); // Every 45 seconds
    }
    
    workOnCollaborativeProjects() {
        const projects = Object.keys(this.sharedLedger.buildingProjects);
        const project = projects[Math.floor(Math.random() * projects.length)];
        const projectData = this.sharedLedger.buildingProjects[project];
        
        // Assign random agent to work on project
        const agentIds = Object.keys(this.agents);
        const workingAgent = agentIds[Math.floor(Math.random() * agentIds.length)];
        const agent = this.agents[workingAgent];
        
        // Agent contributes to project
        const contribution = Math.random() * 10; // Random progress
        projectData.progress += contribution;
        
        if (!projectData.agents_working.includes(workingAgent)) {
            projectData.agents_working.push(workingAgent);
        }
        
        console.log(`🔨 ${agent.name} working on ${project}: +${contribution.toFixed(1)} progress (${projectData.progress.toFixed(1)} total)`);
        
        // Create ledger transaction
        this.sharedLedger.transactions.push({
            type: 'PROJECT_CONTRIBUTION',
            agent: workingAgent,
            project: project,
            contribution: contribution,
            timestamp: Date.now()
        });
        
        // Check if project is complete
        if (projectData.progress >= 100 && !projectData.completed) {
            projectData.completed = true;
            console.log(`🎉 PROJECT COMPLETED: ${project} by agents: ${projectData.agents_working.join(', ')}`);
            
            // Broadcast completion
            Object.keys(this.agents).forEach(agentId => {
                this.sendAgentMessage('SYSTEM', agentId, {
                    type: 'PROJECT_COMPLETED',
                    project: project,
                    agents: projectData.agents_working,
                    timestamp: Date.now()
                });
            });
        }
    }
    
    startConsensusServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = req.url;
            
            if (url === '/') {
                this.serveConsensusInterface(res);
            } else if (url === '/agents') {
                this.serveAgentData(res);
            } else if (url === '/ledger') {
                this.serveLedgerData(res);
            } else if (url === '/workflow') {
                this.serveWorkflowData(res);
            } else {
                res.writeHead(404);
                res.end('Consensus endpoint not found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`\\n🤖 Consensus Dashboard: http://localhost:${this.port}`);
        });
    }
    
    startConsensusWebSocket() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            console.log('🔗 Consensus observer connected');
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'consensus-state',
                agents: this.agents,
                workflow: this.consensusWorkflow,
                ledger: {
                    rulesCount: this.sharedLedger.rules.size,
                    transactions: this.sharedLedger.transactions.length,
                    projects: this.sharedLedger.buildingProjects
                },
                messages: this.agentMessages.slice(-20),
                timestamp: Date.now()
            }));
            
            ws.on('close', () => {
                console.log('🔗 Consensus observer disconnected');
            });
        });
        
        console.log(`🌐 Consensus WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    serveConsensusInterface(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🤖 Four Agent Consensus System</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2a 50%, #2a2a3a 100%);
            color: #00ff88; 
            margin: 0; 
            padding: 15px;
            min-height: 100vh;
        }
        .header { 
            text-align: center; 
            font-size: 2.5em; 
            text-shadow: 0 0 20px #00ff88;
            margin-bottom: 25px;
        }
        .consensus-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            max-width: 1600px; 
            margin: 0 auto;
        }
        .panel { 
            border: 2px solid #00ff88;
            border-radius: 15px; 
            padding: 20px;
            backdrop-filter: blur(10px);
            background: rgba(0, 255, 136, 0.05);
        }
        .agent-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .agent-card {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
        }
        .flipper-a { border-color: #ff6b35; color: #ff6b35; } /* SOL orange */
        .flipper-b { border-color: #ff6600; color: #ff6600; } /* XMR orange */
        .decider { border-color: #627eea; color: #627eea; } /* ETH blue */
        .checker { border-color: #f7931a; color: #f7931a; } /* BTC orange */
        .workflow-step {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid #00ff88;
            border-radius: 8px;
            padding: 10px;
            margin: 5px 0;
        }
        .step-active {
            background: rgba(0, 255, 136, 0.2);
            border-color: #00ff88;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        .message-item {
            background: rgba(255, 255, 255, 0.03);
            border-left: 3px solid #00ff88;
            padding: 8px;
            margin: 5px 0;
            border-radius: 0 5px 5px 0;
            font-size: 0.9em;
        }
        .ledger-stats {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin: 15px 0;
        }
        .stat-box {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        }
        .project-progress {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            height: 15px;
            margin: 5px 0;
            overflow: hidden;
        }
        .progress-fill {
            background: linear-gradient(90deg, #00ff88, #00cc70);
            height: 100%;
            transition: width 0.5s ease;
        }
    </style>
</head>
<body>
    <div class="header">
        🤖 FOUR AGENT CONSENSUS
    </div>
    
    <div class="consensus-grid">
        <div class="panel">
            <h2>👥 The Four Agents</h2>
            <div class="agent-grid">
                <div class="agent-card flipper-a">
                    <h3>🎲 FlipperAlpha</h3>
                    <div>SOL Territory</div>
                    <div>INPUT GENERATOR</div>
                    <div id="flipper-a-stats">Flips: 0</div>
                </div>
                <div class="agent-card flipper-b">
                    <h3>🎲 FlipperBeta</h3>
                    <div>XMR Territory</div>
                    <div>INPUT VALIDATOR</div>
                    <div id="flipper-b-stats">Validations: 0</div>
                </div>
                <div class="agent-card decider">
                    <h3>🧠 DecisionEngine</h3>
                    <div>ETH Territory</div>
                    <div>CONCLUSION WRITER</div>
                    <div id="decider-stats">Conclusions: 0</div>
                </div>
                <div class="agent-card checker">
                    <h3>📋 LedgerChecker</h3>
                    <div>BTC Territory</div>
                    <div>VERIFICATION AUDITOR</div>
                    <div id="checker-stats">Verifications: 0</div>
                </div>
            </div>
        </div>
        
        <div class="panel">
            <h2>🔄 Consensus Workflow</h2>
            <div>Round: <span id="current-round">0</span></div>
            <div id="workflow-steps">
                <div class="workflow-step">1. FLIP GENERATION</div>
                <div class="workflow-step">2. DECISION MAKING</div>
                <div class="workflow-step">3. LEDGER CHECK</div>
                <div class="workflow-step">4. RULE ESTABLISHMENT</div>
            </div>
            
            <h3>📊 Ledger Statistics</h3>
            <div class="ledger-stats">
                <div class="stat-box">
                    <div id="rules-count">0</div>
                    <div>Rules</div>
                </div>
                <div class="stat-box">
                    <div id="transactions-count">0</div>
                    <div>Transactions</div>
                </div>
                <div class="stat-box">
                    <div id="messages-count">0</div>
                    <div>Messages</div>
                </div>
            </div>
        </div>
        
        <div class="panel">
            <h2>🏗️ Collaborative Projects</h2>
            <div id="projects-list">Loading projects...</div>
        </div>
        
        <div class="panel">
            <h2>💬 Agent Communications</h2>
            <div id="agent-messages" style="max-height: 300px; overflow-y: auto;">
                Loading messages...
            </div>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        let consensusState = {};
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleConsensusUpdate(data);
        };
        
        function handleConsensusUpdate(data) {
            if (data.type === 'consensus-state') {
                consensusState = data;
                updateInterface();
            }
        }
        
        function updateInterface() {
            updateAgentStats();
            updateWorkflow();
            updateLedgerStats();
            updateProjects();
            updateMessages();
        }
        
        function updateAgentStats() {
            const agents = consensusState.agents;
            if (!agents) return;
            
            document.getElementById('flipper-a-stats').textContent = 
                \`Flips: \${agents.FLIPPER_A?.coinFlips || 0}\`;
            document.getElementById('flipper-b-stats').textContent = 
                \`Validations: \${agents.FLIPPER_B?.validations || 0}\`;
            document.getElementById('decider-stats').textContent = 
                \`Conclusions: \${agents.DECIDER?.conclusions || 0}\`;
            document.getElementById('checker-stats').textContent = 
                \`Verifications: \${agents.CHECKER?.verifications || 0}\`;
        }
        
        function updateWorkflow() {
            const workflow = consensusState.workflow;
            if (!workflow) return;
            
            document.getElementById('current-round').textContent = workflow.currentRound;
            
            // Update workflow steps
            const steps = document.querySelectorAll('.workflow-step');
            steps.forEach((step, index) => {
                step.classList.toggle('step-active', index === workflow.currentStep);
            });
        }
        
        function updateLedgerStats() {
            const ledger = consensusState.ledger;
            if (!ledger) return;
            
            document.getElementById('rules-count').textContent = ledger.rulesCount;
            document.getElementById('transactions-count').textContent = ledger.transactions;
            document.getElementById('messages-count').textContent = consensusState.messages?.length || 0;
        }
        
        function updateProjects() {
            const projects = consensusState.ledger?.projects;
            if (!projects) return;
            
            const projectsHtml = Object.entries(projects).map(([name, data]) => {
                const progress = Math.min(data.progress, 100);
                const isComplete = data.completed;
                
                return \`
                    <div style="margin: 10px 0;">
                        <strong>\${name.replace(/_/g, ' ').toUpperCase()}</strong>
                        \${isComplete ? '✅' : ''}
                        <div class="project-progress">
                            <div class="progress-fill" style="width: \${progress}%"></div>
                        </div>
                        <small>Progress: \${progress.toFixed(1)}% | Agents: \${data.agents_working?.join(', ') || 'None'}</small>
                    </div>
                \`;
            }).join('');
            
            document.getElementById('projects-list').innerHTML = projectsHtml;
        }
        
        function updateMessages() {
            const messages = consensusState.messages;
            if (!messages) return;
            
            const messagesHtml = messages.slice(-10).map(msg => \`
                <div class="message-item">
                    <strong>\${msg.from} → \${msg.to}:</strong> \${msg.message.type || 'message'}
                    <div style="font-size: 0.8em; opacity: 0.7;">
                        \${new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                </div>
            \`).join('');
            
            document.getElementById('agent-messages').innerHTML = messagesHtml;
            
            // Auto-scroll to bottom
            const messagesDiv = document.getElementById('agent-messages');
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        // Auto-refresh every 5 seconds
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                // Updates come via WebSocket
            }
        }, 5000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveAgentData(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            agents: this.agents,
            timestamp: Date.now()
        }));
    }
    
    serveLedgerData(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            rules: Array.from(this.sharedLedger.rules.entries()),
            transactions: this.sharedLedger.transactions,
            agentActions: this.sharedLedger.agentActions,
            consensusHistory: this.sharedLedger.consensusHistory,
            buildingProjects: this.sharedLedger.buildingProjects,
            timestamp: Date.now()
        }));
    }
    
    serveWorkflowData(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            workflow: this.consensusWorkflow,
            timestamp: Date.now()
        }));
    }
}

// Start the Four Agent Consensus System
if (require.main === module) {
    console.log('🤖 STARTING FOUR AGENT CONSENSUS SYSTEM');
    console.log('=======================================');
    console.log('👥 4 Agents: FlipperAlpha, FlipperBeta, DecisionEngine, LedgerChecker');
    console.log('🔄 Workflow: Flip → Flip → Decide → Verify → Rule');
    console.log('🌍 Territories: SOL, XMR, ETH, BTC');
    console.log('🏗️ Building: Database, phpBB fork, Git fork, Consensus protocol');
    console.log('');
    
    const consensusSystem = new FourAgentConsensusSystem();
    consensusSystem.start();
    
    console.log('\\n🤖 Consensus Dashboard: http://localhost:6666');
    console.log('🌐 Real-time WebSocket: ws://localhost:6667');
    console.log('');
    console.log('🎯 Watch the 4 agents work through consensus workflow!');
}

module.exports = FourAgentConsensusSystem;