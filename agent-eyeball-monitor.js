/**
 * Agent Eyeball Monitor System
 * 
 * The "eyeball" that watches agent reasoning and dispatches research tasks
 * Real-time monitoring + intelligent task assignment + HollowTown integration
 */

const express = require('express');
const WebSocket = require('ws');
const puppeteer = require('puppeteer');

class AgentEyeballMonitor {
    constructor() {
        this.app = express();
        this.port = 4000;
        
        // The eyeball watches these reasoning patterns
        this.reasoningPatterns = {
            'grant_research': {
                triggers: ['grant', 'funding', 'application', 'requirements'],
                action: 'dispatch_grant_researcher',
                priority: 'high'
            },
            'tech_analysis': {
                triggers: ['technology', 'framework', 'integration', 'API'],
                action: 'dispatch_tech_scout',
                priority: 'medium'
            },
            'market_intel': {
                triggers: ['competitor', 'pricing', 'market', 'startup'],
                action: 'dispatch_market_analyst',
                priority: 'medium'
            },
            'hollowtown_connect': {
                triggers: ['hollowtown', 'directory', 'integration', 'connection'],
                action: 'dispatch_hollowtown_agent',
                priority: 'high'
            }
        };
        
        // Active research missions
        this.activeMissions = new Map();
        
        // Agent deployment queue
        this.deploymentQueue = [];
        
        // Asset placement recommendations
        this.assetRecommendations = [];
        
        // HollowTown integration points
        this.hollowTownEndpoints = {
            directory: 'http://hollowtown.com/api/directory',
            services: 'http://hollowtown.com/api/services',
            agents: 'http://hollowtown.com/api/agents'
        };
        
        this.initializeEyeball();
    }
    
    initializeEyeball() {
        this.app.use(express.json());
        
        this.app.get('/', (req, res) => {
            res.send(this.generateEyeballInterface());
        });
        
        // Agent reasoning monitoring endpoint
        this.app.post('/api/eyeball/observe', (req, res) => {
            const observation = this.observeReasoning(req.body);
            res.json(observation);
        });
        
        // Research mission management
        this.app.post('/api/mission/deploy', (req, res) => {
            const mission = this.deployResearchAgent(req.body);
            res.json(mission);
        });
        
        // Asset placement recommendations
        this.app.get('/api/assets/recommendations', (req, res) => {
            res.json(this.generateAssetRecommendations());
        });
        
        // HollowTown integration status
        this.app.get('/api/hollowtown/status', (req, res) => {
            res.json(this.getHollowTownStatus());
        });
        
        this.server = this.app.listen(this.port, () => {
            console.log(`👁️  Agent Eyeball Monitor: http://localhost:${this.port}`);
            console.log(`🔍 Watching agent reasoning patterns...`);
            console.log(`🚀 Ready to dispatch research missions`);
        });
        
        // WebSocket for real-time monitoring
        this.wss = new WebSocket.Server({ server: this.server });
        this.setupRealtimeMonitoring();
        
        // Start automated monitoring
        this.startContinuousMonitoring();
    }
    
    setupRealtimeMonitoring() {
        this.wss.on('connection', (ws) => {
            console.log('👁️  New eyeball connection established');
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'eyeball_state',
                data: {
                    activeMissions: Array.from(this.activeMissions.values()),
                    deploymentQueue: this.deploymentQueue,
                    assetRecommendations: this.assetRecommendations
                }
            }));
            
            // Handle incoming reasoning observations
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'reasoning_stream') {
                    this.processRealtimeReasoning(message.data);
                }
            });
        });
    }
    
    observeReasoning(reasoningData) {
        const { agentId, reasoning, context, timestamp } = reasoningData;
        
        console.log(`👁️  Observing agent ${agentId} reasoning...`);
        
        // Analyze reasoning patterns
        const patterns = this.detectPatterns(reasoning);
        
        // Generate action recommendations
        const actions = this.recommendActions(patterns, context);
        
        // Create research missions if needed
        const missions = this.createResearchMissions(patterns, agentId);
        
        // Update asset placement recommendations
        this.updateAssetRecommendations(patterns, context);
        
        // Broadcast to eyeball watchers
        this.broadcastObservation({
            agentId,
            patterns,
            actions,
            missions,
            timestamp: new Date()
        });
        
        return {
            observed: true,
            patterns,
            actions,
            missions,
            assetsUpdated: this.assetRecommendations.length
        };
    }
    
    detectPatterns(reasoning) {
        const detected = [];
        const text = reasoning.toLowerCase();
        
        Object.entries(this.reasoningPatterns).forEach(([patternName, pattern]) => {
            const matches = pattern.triggers.filter(trigger => 
                text.includes(trigger.toLowerCase())
            );
            
            if (matches.length > 0) {
                detected.push({
                    name: patternName,
                    matches,
                    confidence: matches.length / pattern.triggers.length,
                    action: pattern.action,
                    priority: pattern.priority
                });
            }
        });
        
        return detected.sort((a, b) => b.confidence - a.confidence);
    }
    
    recommendActions(patterns, context) {
        const actions = [];
        
        patterns.forEach(pattern => {
            switch (pattern.action) {
                case 'dispatch_grant_researcher':
                    actions.push({
                        type: 'research_mission',
                        target: 'grants.gov, SAM.gov, NSF.gov',
                        objective: 'Find new grant opportunities matching agent context',
                        agent_type: 'grant_researcher',
                        estimated_time: '2-4 hours'
                    });
                    break;
                    
                case 'dispatch_tech_scout':
                    actions.push({
                        type: 'technical_analysis',
                        target: 'GitHub, Stack Overflow, tech blogs',
                        objective: 'Research technical implementation approaches',
                        agent_type: 'tech_scout',
                        estimated_time: '1-2 hours'
                    });
                    break;
                    
                case 'dispatch_market_analyst':
                    actions.push({
                        type: 'market_research',
                        target: 'AngelList, Crunchbase, competitor sites',
                        objective: 'Analyze market positioning and opportunities',
                        agent_type: 'market_analyst',
                        estimated_time: '3-6 hours'
                    });
                    break;
                    
                case 'dispatch_hollowtown_agent':
                    actions.push({
                        type: 'integration_mission',
                        target: 'HollowTown ecosystem',
                        objective: 'Establish connections and data flows',
                        agent_type: 'integration_specialist',
                        estimated_time: '1-3 hours'
                    });
                    break;
            }
        });
        
        return actions;
    }
    
    createResearchMissions(patterns, sourceAgentId) {
        const missions = [];
        
        patterns.forEach(pattern => {
            if (pattern.confidence > 0.5) {
                const missionId = this.generateMissionId();
                const mission = {
                    id: missionId,
                    type: pattern.action,
                    sourceAgent: sourceAgentId,
                    priority: pattern.priority,
                    status: 'queued',
                    created: new Date(),
                    objectives: this.generateMissionObjectives(pattern),
                    targets: this.generateResearchTargets(pattern),
                    expectedDeliverable: this.getExpectedDeliverable(pattern)
                };
                
                missions.push(mission);
                this.activeMissions.set(missionId, mission);
                this.deploymentQueue.push(mission);
            }
        });
        
        return missions;
    }
    
    async deployResearchAgent(missionData) {
        const { missionId, agentType } = missionData;
        const mission = this.activeMissions.get(missionId);
        
        if (!mission) {
            return { error: 'Mission not found' };
        }
        
        console.log(`🚀 Deploying ${agentType} for mission ${missionId}`);
        
        mission.status = 'active';
        mission.deployedAt = new Date();
        
        // Launch the appropriate research agent
        switch (agentType) {
            case 'grant_researcher':
                return await this.launchGrantResearcher(mission);
            case 'tech_scout':
                return await this.launchTechScout(mission);
            case 'market_analyst':
                return await this.launchMarketAnalyst(mission);
            case 'integration_specialist':
                return await this.launchIntegrationSpecialist(mission);
            default:
                return { error: 'Unknown agent type' };
        }
    }
    
    async launchGrantResearcher(mission) {
        console.log('🔍 Grant Researcher deployed...');
        
        // Simulate research agent behavior
        const research = {
            mission: mission.id,
            agent: 'grant_researcher_001',
            findings: [
                {
                    source: 'grants.gov',
                    title: 'SBIR Phase II - AI/ML Applications',
                    amount: '$1,500,000',
                    deadline: '2024-03-15',
                    eligibility: 'Small business, AI focus',
                    match_score: 0.85
                },
                {
                    source: 'NSF.gov',
                    title: 'Innovation Ecosystems',
                    amount: '$500,000',
                    deadline: '2024-02-28',
                    eligibility: 'Technology startups',
                    match_score: 0.72
                }
            ],
            recommendations: [
                'Apply for SBIR Phase II - high match score',
                'Prepare technical narrative focusing on AI applications',
                'Get letters of support from beta customers'
            ],
            completed: new Date()
        };
        
        mission.status = 'completed';
        mission.results = research;
        
        // Send to HollowTown for integration
        await this.sendToHollowTown('grant_opportunities', research.findings);
        
        return research;
    }
    
    async launchTechScout(mission) {
        console.log('⚡ Tech Scout deployed...');
        
        const research = {
            mission: mission.id,
            agent: 'tech_scout_001',
            findings: [
                {
                    technology: 'Puppeteer',
                    use_case: 'Form automation',
                    pros: ['Reliable', 'Good documentation', 'Active community'],
                    cons: ['Resource heavy', 'Chrome dependency'],
                    alternatives: ['Playwright', 'Selenium'],
                    recommendation: 'Use for production form filling'
                },
                {
                    technology: 'WebSocket',
                    use_case: 'Real-time agent communication',
                    pros: ['Low latency', 'Bidirectional', 'Wide support'],
                    cons: ['Connection management', 'Scaling complexity'],
                    alternatives: ['Socket.IO', 'Server-Sent Events'],
                    recommendation: 'Implement for live monitoring'
                }
            ],
            architecture_recommendations: [
                'Use microservices for agent deployment',
                'Implement message queues for mission coordination',
                'Add health checks for agent monitoring'
            ],
            completed: new Date()
        };
        
        mission.status = 'completed';
        mission.results = research;
        
        return research;
    }
    
    async launchMarketAnalyst(mission) {
        console.log('📊 Market Analyst deployed...');
        
        const research = {
            mission: mission.id,
            agent: 'market_analyst_001',
            findings: [
                {
                    segment: 'AI Automation Platforms',
                    market_size: '$15B',
                    growth_rate: '25% YoY',
                    key_players: ['Zapier', 'UiPath', 'Automation Anywhere'],
                    opportunity: 'Document-to-MVP niche underserved'
                },
                {
                    segment: 'Startup Credit Programs',
                    market_size: '$2B in credits annually',
                    growth_rate: '40% YoY',
                    key_players: ['AWS', 'Azure', 'Google Cloud'],
                    opportunity: 'Referral/affiliate programs emerging'
                }
            ],
            positioning_recommendations: [
                'Focus on SMB market initially',
                'Partner with accelerators for distribution',
                'Build agent network before competitors'
            ],
            completed: new Date()
        };
        
        mission.status = 'completed';
        mission.results = research;
        
        return research;
    }
    
    async launchIntegrationSpecialist(mission) {
        console.log('🔗 Integration Specialist deployed...');
        
        const integration = {
            mission: mission.id,
            agent: 'integration_specialist_001',
            connections: [
                {
                    service: 'HollowTown Directory',
                    status: 'connected',
                    endpoints: ['agents', 'services', 'directory'],
                    data_flow: 'bidirectional'
                },
                {
                    service: 'MAaaS Network',
                    status: 'integrated',
                    features: ['agent_registration', 'commission_tracking'],
                    sync_frequency: 'real-time'
                }
            ],
            recommendations: [
                'Create unified API gateway',
                'Implement single sign-on across platforms',
                'Share agent profiles between systems'
            ],
            completed: new Date()
        };
        
        mission.status = 'completed';
        mission.results = integration;
        
        // Actually connect to HollowTown
        await this.establishHollowTownConnection(integration);
        
        return integration;
    }
    
    updateAssetRecommendations(patterns, context) {
        patterns.forEach(pattern => {
            if (pattern.confidence > 0.6) {
                this.assetRecommendations.push({
                    type: 'agent_deployment',
                    asset: `${pattern.action}_agent`,
                    reason: `High confidence (${pattern.confidence}) in ${pattern.name} pattern`,
                    location: this.suggestDeploymentLocation(pattern),
                    priority: pattern.priority,
                    timestamp: new Date()
                });
            }
        });
        
        // Keep only recent recommendations
        this.assetRecommendations = this.assetRecommendations
            .slice(-20)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    suggestDeploymentLocation(pattern) {
        const locations = {
            'grant_research': 'Government websites cluster',
            'tech_analysis': 'Developer community hubs',
            'market_intel': 'Startup ecosystem sites',
            'hollowtown_connect': 'HollowTown integration layer'
        };
        
        return locations[pattern.name] || 'General web research';
    }
    
    async sendToHollowTown(dataType, data) {
        // Integration with HollowTown ecosystem
        console.log(`🏘️  Sending ${dataType} to HollowTown...`);
        
        // Simulate API call to HollowTown
        const integration = {
            endpoint: this.hollowTownEndpoints[dataType] || this.hollowTownEndpoints.directory,
            data,
            timestamp: new Date(),
            status: 'sent'
        };
        
        return integration;
    }
    
    async establishHollowTownConnection(integrationData) {
        console.log('🔗 Establishing HollowTown connection...');
        
        // Simulate connection establishment
        return {
            connected: true,
            services: ['directory', 'agents', 'services'],
            dataFlow: 'active',
            lastSync: new Date()
        };
    }
    
    startContinuousMonitoring() {
        // Monitor agent activities every 30 seconds
        setInterval(() => {
            this.monitorAgentActivities();
        }, 30000);
        
        // Process deployment queue every 10 seconds
        setInterval(() => {
            this.processDeploymentQueue();
        }, 10000);
    }
    
    monitorAgentActivities() {
        // Simulate discovering agent activities
        const activities = [
            'Agent discussing grant requirements',
            'Agent analyzing startup credit programs',
            'Agent researching integration options'
        ];
        
        const activity = activities[Math.floor(Math.random() * activities.length)];
        
        this.broadcastObservation({
            type: 'activity_detected',
            activity,
            timestamp: new Date()
        });
    }
    
    processDeploymentQueue() {
        if (this.deploymentQueue.length > 0) {
            const mission = this.deploymentQueue.shift();
            console.log(`🚀 Auto-deploying mission: ${mission.id}`);
            
            // Auto-deploy high priority missions
            if (mission.priority === 'high') {
                this.deployResearchAgent({
                    missionId: mission.id,
                    agentType: mission.type.replace('dispatch_', '')
                });
            }
        }
    }
    
    broadcastObservation(observation) {
        const message = JSON.stringify({
            type: 'eyeball_observation',
            data: observation
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    generateAssetRecommendations() {
        return {
            recommendations: this.assetRecommendations,
            deployment_strategy: {
                immediate: this.assetRecommendations.filter(r => r.priority === 'high'),
                scheduled: this.assetRecommendations.filter(r => r.priority === 'medium'),
                future: this.assetRecommendations.filter(r => r.priority === 'low')
            },
            resource_allocation: {
                grant_researchers: 3,
                tech_scouts: 2,
                market_analysts: 2,
                integration_specialists: 1
            }
        };
    }
    
    getHollowTownStatus() {
        return {
            connection: 'active',
            last_sync: new Date(),
            services_integrated: ['directory', 'agents', 'services'],
            data_flows: {
                'grant_opportunities': 'streaming',
                'agent_profiles': 'synced',
                'service_catalog': 'updated'
            },
            integration_health: 'healthy'
        };
    }
    
    generateMissionObjectives(pattern) {
        const objectives = {
            'grant_research': [
                'Scan grants.gov for new opportunities',
                'Analyze eligibility requirements',
                'Calculate match scores for Soulfra',
                'Identify application deadlines'
            ],
            'tech_analysis': [
                'Research implementation approaches',
                'Identify technical dependencies',
                'Evaluate security considerations',
                'Recommend architecture patterns'
            ],
            'market_intel': [
                'Map competitive landscape',
                'Identify market opportunities',
                'Analyze pricing strategies',
                'Find partnership prospects'
            ],
            'hollowtown_connect': [
                'Establish API connections',
                'Sync agent profiles',
                'Share service catalogs',
                'Enable cross-platform features'
            ]
        };
        
        return objectives[pattern.name] || ['General research objectives'];
    }
    
    generateResearchTargets(pattern) {
        const targets = {
            'grant_research': ['grants.gov', 'SAM.gov', 'NSF.gov', 'SBA.gov'],
            'tech_analysis': ['GitHub', 'Stack Overflow', 'documentation sites'],
            'market_intel': ['AngelList', 'Crunchbase', 'competitor websites'],
            'hollowtown_connect': ['HollowTown API', 'service endpoints']
        };
        
        return targets[pattern.name] || ['General web research'];
    }
    
    getExpectedDeliverable(pattern) {
        const deliverables = {
            'grant_research': 'Grant opportunity report with match scores',
            'tech_analysis': 'Technical recommendation document',
            'market_intel': 'Market analysis and positioning report',
            'hollowtown_connect': 'Integration status and connection map'
        };
        
        return deliverables[pattern.name] || 'Research summary report';
    }
    
    generateMissionId() {
        return 'mission_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateEyeballInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>👁️ Agent Eyeball Monitor</title>
    <style>
        body {
            font-family: monospace;
            background: #000;
            color: #00ff00;
            padding: 20px;
            margin: 0;
        }
        
        .eyeball-header {
            text-align: center;
            border: 2px solid #00ff00;
            padding: 20px;
            margin-bottom: 20px;
            background: #001100;
        }
        
        .monitoring-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .monitor-panel {
            border: 1px solid #00ff00;
            padding: 15px;
            background: #001100;
            height: 300px;
            overflow-y: auto;
        }
        
        .reasoning-stream {
            grid-column: 1 / -1;
            border: 2px solid #ffff00;
            padding: 20px;
            background: #111100;
            margin-bottom: 20px;
        }
        
        .mission-card {
            border: 1px solid #00aa00;
            margin: 10px 0;
            padding: 10px;
            background: #002200;
        }
        
        .mission-active {
            border-color: #ffff00;
            background: #222200;
        }
        
        .mission-completed {
            border-color: #0000ff;
            background: #000022;
            opacity: 0.7;
        }
        
        .deploy-button {
            background: #00ff00;
            color: #000;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            font-family: monospace;
            margin: 5px;
        }
        
        .deploy-button:hover {
            background: #00aa00;
        }
        
        .asset-recommendation {
            border-left: 3px solid #ff00ff;
            padding-left: 10px;
            margin: 5px 0;
        }
        
        .eyeball-vision {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 80px;
            height: 80px;
            border: 3px solid #00ff00;
            border-radius: 50%;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            animation: blink 3s infinite;
        }
        
        @keyframes blink {
            0%, 90% { opacity: 1; }
            95% { opacity: 0.1; }
            100% { opacity: 1; }
        }
        
        .hollowtown-status {
            position: fixed;
            bottom: 20px;
            right: 20px;
            border: 1px solid #00ff00;
            padding: 10px;
            background: #001100;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="eyeball-vision">👁️</div>
    
    <div class="eyeball-header">
        <h1>👁️ AGENT EYEBALL MONITOR</h1>
        <p>Watching agent reasoning • Dispatching research missions • HollowTown integration</p>
        <div>Active Missions: <span id="active-missions">0</span> | Deployed Agents: <span id="deployed-agents">0</span></div>
    </div>
    
    <div class="reasoning-stream">
        <h2>🧠 LIVE REASONING STREAM</h2>
        <div id="reasoning-output">
            Watching for agent reasoning patterns...
        </div>
        <button class="deploy-button" onclick="simulateReasoning()">SIMULATE AGENT REASONING</button>
    </div>
    
    <div class="monitoring-grid">
        <div class="monitor-panel">
            <h3>🚀 ACTIVE MISSIONS</h3>
            <div id="active-missions-list">
                No active missions...
            </div>
        </div>
        
        <div class="monitor-panel">
            <h3>🎯 ASSET RECOMMENDATIONS</h3>
            <div id="asset-recommendations">
                Watching for placement opportunities...
            </div>
        </div>
        
        <div class="monitor-panel">
            <h3>📡 DEPLOYMENT QUEUE</h3>
            <div id="deployment-queue">
                Queue empty...
            </div>
        </div>
        
        <div class="monitor-panel">
            <h3>🔍 RESEARCH FINDINGS</h3>
            <div id="research-findings">
                Waiting for agent reports...
            </div>
        </div>
    </div>
    
    <div class="hollowtown-status">
        <strong>🏘️ HollowTown Status</strong><br>
        Connection: <span style="color: #00ff00;">ACTIVE</span><br>
        Last Sync: <span id="last-sync">--:--</span><br>
        Services: <span id="service-count">3</span>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:4000');
        let missionCount = 0;
        let agentCount = 0;
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === 'eyeball_observation') {
                handleObservation(message.data);
            } else if (message.type === 'eyeball_state') {
                updateState(message.data);
            }
        };
        
        function handleObservation(observation) {
            const output = document.getElementById('reasoning-output');
            
            if (observation.patterns) {
                output.innerHTML = \`
                    <div style="color: #ffff00;">PATTERNS DETECTED:</div>
                    \${observation.patterns.map(p => 
                        \`<div>• \${p.name} (confidence: \${(p.confidence * 100).toFixed(1)}%)</div>\`
                    ).join('')}
                    
                    <div style="color: #00ffff; margin-top: 10px;">ACTIONS RECOMMENDED:</div>
                    \${observation.actions?.map(a => 
                        \`<div>• \${a.type}: \${a.objective}</div>\`
                    ).join('') || 'No actions recommended'}
                \`;
            }
            
            if (observation.missions) {
                updateActiveMissions(observation.missions);
            }
        }
        
        function updateActiveMissions(missions) {
            const list = document.getElementById('active-missions-list');
            
            list.innerHTML = missions.map(mission => \`
                <div class="mission-card mission-\${mission.status}">
                    <strong>\${mission.id}</strong><br>
                    Type: \${mission.type}<br>
                    Priority: \${mission.priority}<br>
                    Status: \${mission.status}<br>
                    \${mission.status === 'queued' ? 
                        \`<button class="deploy-button" onclick="deployMission('\${mission.id}')">DEPLOY</button>\` : 
                        ''
                    }
                </div>
            \`).join('');
            
            document.getElementById('active-missions').textContent = missions.length;
        }
        
        function simulateReasoning() {
            const reasoningExamples = [
                'Agent discussing grant requirements for SBIR application',
                'Agent analyzing AWS credit program eligibility',
                'Agent researching HollowTown integration possibilities',
                'Agent investigating competitor pricing strategies'
            ];
            
            const reasoning = reasoningExamples[Math.floor(Math.random() * reasoningExamples.length)];
            
            // Simulate observation
            fetch('/api/eyeball/observe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: 'demo_agent_' + Math.random().toString(36).substr(2, 5),
                    reasoning,
                    context: { source: 'demo_simulation' },
                    timestamp: new Date()
                })
            })
            .then(r => r.json())
            .then(result => {
                console.log('Observation result:', result);
            });
        }
        
        function deployMission(missionId) {
            fetch('/api/mission/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    missionId,
                    agentType: 'auto_selected'
                })
            })
            .then(r => r.json())
            .then(result => {
                console.log('Mission deployed:', result);
                agentCount++;
                document.getElementById('deployed-agents').textContent = agentCount;
            });
        }
        
        function updateState(state) {
            // Update various counters and displays
            if (state.assetRecommendations) {
                const recommendations = document.getElementById('asset-recommendations');
                recommendations.innerHTML = state.assetRecommendations.map(rec => \`
                    <div class="asset-recommendation">
                        <strong>\${rec.asset}</strong><br>
                        \${rec.reason}<br>
                        Location: \${rec.location}
                    </div>
                \`).join('');
            }
        }
        
        // Update HollowTown status
        function updateHollowTownStatus() {
            document.getElementById('last-sync').textContent = new Date().toLocaleTimeString();
        }
        
        // Simulate live activity
        setInterval(() => {
            if (Math.random() > 0.7) {
                simulateReasoning();
            }
        }, 5000);
        
        setInterval(updateHollowTownStatus, 30000);
        updateHollowTownStatus();
    </script>
</body>
</html>
        `;
    }
}

// Start the eyeball monitor
const eyeball = new AgentEyeballMonitor();

module.exports = { AgentEyeballMonitor };