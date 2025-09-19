#!/usr/bin/env node

/**
 * 🔍 SEMANTIC ORCHESTRATOR BRIDGE
 * 
 * Enables semantic querying between orchestrators like LangGraph
 * Allows orchestrators to understand context, debug issues, and self-heal
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const express = require('express');
const natural = require('natural'); // NLP for semantic analysis

class SemanticOrchestratorBridge extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 9999,
            wsPort: options.wsPort || 9998,
            orchestrators: options.orchestrators || [
                { id: 'domingo', port: 7777, wsPort: 7778, role: 'backend-management' },
                { id: 'cal', port: 3336, wsPort: 8082, role: 'education' },
                { id: 'ralph', port: 4444, wsPort: 4445, role: 'service-bridge' }
            ],
            ...options
        };
        
        // Express app for API
        this.app = express();
        this.server = null;
        this.wsServer = null;
        
        // Orchestrator connections
        this.connections = new Map();
        this.orchestratorStates = new Map();
        
        // Semantic understanding
        this.tokenizer = new natural.WordTokenizer();
        this.tfidf = new natural.TfIdf();
        this.classifier = new natural.BayesClassifier();
        
        // Knowledge graph
        this.knowledgeGraph = {
            nodes: new Map(),
            edges: new Map(),
            patterns: new Map()
        };
        
        // Query patterns
        this.queryPatterns = {
            status: /status|health|state|running/i,
            error: /error|fail|broken|issue|problem/i,
            websocket: /websocket|ws|socket|connection/i,
            task: /task|job|work|assignment/i,
            fix: /fix|repair|heal|solve|resolve/i,
            dependency: /depend|require|need|import|use/i,
            why: /why|reason|cause|because/i,
            how: /how|way|method|process/i
        };
        
        // Self-healing patterns
        this.healingPatterns = new Map([
            ['websocket_error', this.healWebSocketError.bind(this)],
            ['connection_failed', this.healConnectionFailure.bind(this)],
            ['task_stuck', this.healStuckTask.bind(this)],
            ['dependency_missing', this.healMissingDependency.bind(this)]
        ]);
        
        console.log('🔍 Semantic Orchestrator Bridge initializing...');
    }
    
    async initialize() {
        // Train semantic classifier
        await this.trainClassifier();
        
        // Set up Express
        this.setupExpress();
        
        // Set up WebSocket server
        this.setupWebSocketServer();
        
        // Connect to orchestrators
        await this.connectToOrchestrators();
        
        // Start server
        this.server = this.app.listen(this.config.port, () => {
            console.log(`🔍 Semantic Bridge API running on port ${this.config.port}`);
        });
        
        // Start monitoring
        this.startSemanticMonitoring();
        
        console.log('✅ Semantic Orchestrator Bridge initialized');
    }
    
    setupExpress() {
        this.app.use(express.json());
        
        // Semantic query endpoint
        this.app.post('/api/query', async (req, res) => {
            const { query, context = {} } = req.body;
            
            try {
                const result = await this.processSemanticQuery(query, context);
                res.json({ success: true, result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Knowledge graph endpoint
        this.app.get('/api/knowledge-graph', (req, res) => {
            res.json({
                nodes: Array.from(this.knowledgeGraph.nodes.values()),
                edges: Array.from(this.knowledgeGraph.edges.values())
            });
        });
        
        // Dependency map endpoint
        this.app.get('/api/dependencies', (req, res) => {
            res.json(this.generateDependencyMap());
        });
        
        // Self-healing status
        this.app.get('/api/healing-status', (req, res) => {
            res.json({
                patterns: Array.from(this.healingPatterns.keys()),
                activeHealing: Array.from(this.activeHealing || [])
            });
        });
    }
    
    setupWebSocketServer() {
        this.wsServer = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wsServer.on('connection', (ws) => {
            console.log('🔌 Client connected to Semantic Bridge');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error.message
                    }));
                }
            });
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'bridge_state',
                orchestrators: Array.from(this.orchestratorStates.entries()),
                knowledge: {
                    nodes: this.knowledgeGraph.nodes.size,
                    edges: this.knowledgeGraph.edges.size
                }
            }));
        });
        
        console.log(`🔌 Semantic Bridge WebSocket on port ${this.config.wsPort}`);
    }
    
    async connectToOrchestrators() {
        for (const orchestrator of this.config.orchestrators) {
            await this.connectToOrchestrator(orchestrator);
        }
    }
    
    async connectToOrchestrator(config) {
        const wsUrl = `ws://localhost:${config.wsPort}/ws`;
        
        console.log(`🔗 Connecting to ${config.id} at ${wsUrl}`);
        
        try {
            const ws = new WebSocket(wsUrl);
            
            ws.on('open', () => {
                console.log(`✅ Connected to ${config.id}`);
                
                this.connections.set(config.id, { ws, config, status: 'online' });
                
                // Add to knowledge graph
                this.addToKnowledgeGraph({
                    type: 'orchestrator',
                    id: config.id,
                    role: config.role,
                    port: config.port,
                    wsPort: config.wsPort
                });
                
                // Request initial state
                ws.send(JSON.stringify({
                    type: 'semantic_bridge_hello',
                    from: 'semantic-bridge'
                }));
            });
            
            ws.on('message', (data) => {
                this.handleOrchestratorMessage(config.id, JSON.parse(data));
            });
            
            ws.on('error', (error) => {
                console.error(`❌ Error with ${config.id}:`, error);
                this.updateOrchestratorState(config.id, { status: 'error', error: error.message });
            });
            
            ws.on('close', () => {
                console.log(`❌ Disconnected from ${config.id}`);
                this.connections.delete(config.id);
                this.updateOrchestratorState(config.id, { status: 'offline' });
                
                // Attempt reconnection
                setTimeout(() => this.connectToOrchestrator(config), 5000);
            });
            
        } catch (error) {
            console.error(`❌ Failed to connect to ${config.id}:`, error);
            this.updateOrchestratorState(config.id, { status: 'offline', error: error.message });
            
            // Retry
            setTimeout(() => this.connectToOrchestrator(config), 5000);
        }
    }
    
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'semantic_query':
                const result = await this.processSemanticQuery(data.query, data.context);
                ws.send(JSON.stringify({
                    type: 'query_response',
                    query: data.query,
                    result
                }));
                break;
                
            case 'knowledge_update':
                this.updateKnowledgeGraph(data.knowledge);
                break;
                
            case 'healing_request':
                await this.processSelfHealing(data.issue);
                break;
        }
    }
    
    handleOrchestratorMessage(orchestratorId, data) {
        // Update state
        this.updateOrchestratorState(orchestratorId, data);
        
        // Extract semantic information
        this.extractSemanticInfo(orchestratorId, data);
        
        // Check for issues that need healing
        this.checkForHealingNeeds(orchestratorId, data);
        
        // Broadcast to semantic clients
        this.broadcastUpdate({
            type: 'orchestrator_update',
            orchestratorId,
            data
        });
    }
    
    async processSemanticQuery(query, context = {}) {
        console.log(`🔍 Processing semantic query: "${query}"`);
        
        // Tokenize and analyze query
        const tokens = this.tokenizer.tokenize(query.toLowerCase());
        const classification = this.classifier.classify(query);
        
        // Detect query intent
        const intent = this.detectQueryIntent(query, tokens);
        
        // Route query based on intent
        let result;
        switch (intent.type) {
            case 'status':
                result = await this.queryStatus(intent.target);
                break;
                
            case 'error':
                result = await this.queryErrors(intent.target);
                break;
                
            case 'websocket':
                result = await this.queryWebSocketStatus();
                break;
                
            case 'task':
                result = await this.queryTasks(intent.target);
                break;
                
            case 'fix':
                result = await this.attemptFix(intent.issue);
                break;
                
            case 'dependency':
                result = await this.queryDependencies(intent.target);
                break;
                
            case 'why':
                result = await this.explainWhy(intent.question, context);
                break;
                
            case 'how':
                result = await this.explainHow(intent.question, context);
                break;
                
            default:
                // Broadcast to all orchestrators for semantic search
                result = await this.broadcastSemanticQuery(query);
        }
        
        // Add to knowledge graph
        this.addQueryToKnowledge(query, result);
        
        return result;
    }
    
    detectQueryIntent(query, tokens) {
        const intent = { type: 'unknown', confidence: 0 };
        
        // Check each pattern
        for (const [type, pattern] of Object.entries(this.queryPatterns)) {
            if (pattern.test(query)) {
                intent.type = type;
                intent.confidence = 0.8;
                break;
            }
        }
        
        // Extract target
        if (tokens.includes('domingo')) intent.target = 'domingo';
        else if (tokens.includes('cal')) intent.target = 'cal';
        else if (tokens.includes('ralph')) intent.target = 'ralph';
        else if (tokens.includes('all')) intent.target = 'all';
        
        // Extract specific issues
        if (intent.type === 'fix') {
            if (query.includes('websocket')) intent.issue = 'websocket_error';
            else if (query.includes('connection')) intent.issue = 'connection_failed';
            else if (query.includes('task')) intent.issue = 'task_stuck';
        }
        
        return intent;
    }
    
    async queryStatus(target = 'all') {
        const results = {};
        
        if (target === 'all') {
            this.orchestratorStates.forEach((state, id) => {
                results[id] = {
                    status: state.status || 'unknown',
                    tasks: state.tasks || 0,
                    health: state.health || 'unknown',
                    lastUpdate: state.lastUpdate
                };
            });
        } else {
            const state = this.orchestratorStates.get(target);
            if (state) {
                results[target] = state;
            }
        }
        
        return {
            type: 'status_response',
            target,
            results,
            summary: this.generateStatusSummary(results)
        };
    }
    
    async queryErrors(target = 'all') {
        const errors = [];
        
        this.orchestratorStates.forEach((state, id) => {
            if (target === 'all' || target === id) {
                if (state.errors && state.errors.length > 0) {
                    errors.push({
                        orchestrator: id,
                        errors: state.errors,
                        timestamp: state.lastUpdate
                    });
                }
            }
        });
        
        // Check connection errors
        this.connections.forEach((conn, id) => {
            if (conn.status === 'error' || conn.status === 'offline') {
                errors.push({
                    orchestrator: id,
                    errors: [{
                        type: 'connection_error',
                        message: `${id} is ${conn.status}`,
                        severity: 'high'
                    }]
                });
            }
        });
        
        return {
            type: 'error_response',
            errors,
            summary: `Found ${errors.length} error(s) across orchestrators`,
            recommendations: this.generateErrorRecommendations(errors)
        };
    }
    
    async queryWebSocketStatus() {
        const wsStatus = {};
        
        this.connections.forEach((conn, id) => {
            wsStatus[id] = {
                connected: conn.ws && conn.ws.readyState === WebSocket.OPEN,
                url: `ws://localhost:${conn.config.wsPort}/ws`,
                status: conn.status,
                readyState: conn.ws ? conn.ws.readyState : 'NOT_CREATED'
            };
        });
        
        return {
            type: 'websocket_status',
            connections: wsStatus,
            summary: this.generateWebSocketSummary(wsStatus)
        };
    }
    
    async attemptFix(issue) {
        console.log(`🔧 Attempting to fix: ${issue}`);
        
        const healingFn = this.healingPatterns.get(issue);
        if (healingFn) {
            return await healingFn();
        }
        
        // Generic fix attempt
        return await this.genericHealingAttempt(issue);
    }
    
    async healWebSocketError() {
        console.log('🔧 Healing WebSocket errors...');
        
        const results = [];
        
        // Check each connection
        for (const [id, conn] of this.connections) {
            if (conn.status !== 'online') {
                console.log(`🔧 Attempting to reconnect ${id}...`);
                
                // Close existing connection
                if (conn.ws) {
                    conn.ws.close();
                }
                
                // Attempt reconnection
                await this.connectToOrchestrator(conn.config);
                
                results.push({
                    orchestrator: id,
                    action: 'reconnect',
                    success: this.connections.get(id)?.status === 'online'
                });
            }
        }
        
        return {
            type: 'healing_response',
            issue: 'websocket_error',
            actions: results,
            summary: `Attempted to heal ${results.length} WebSocket connection(s)`
        };
    }
    
    async healConnectionFailure() {
        console.log('🔧 Healing connection failures...');
        
        // Check if services are running
        const serviceChecks = await Promise.all(
            this.config.orchestrators.map(async (orch) => {
                try {
                    const response = await fetch(`http://localhost:${orch.port}/api/health`);
                    return {
                        id: orch.id,
                        running: response.ok,
                        status: response.status
                    };
                } catch (error) {
                    return {
                        id: orch.id,
                        running: false,
                        error: error.message
                    };
                }
            })
        );
        
        return {
            type: 'healing_response',
            issue: 'connection_failed',
            serviceChecks,
            recommendations: this.generateConnectionRecommendations(serviceChecks)
        };
    }
    
    generateConnectionRecommendations(checks) {
        const recommendations = [];
        
        checks.forEach(check => {
            if (!check.running) {
                recommendations.push({
                    orchestrator: check.id,
                    action: 'start_service',
                    command: this.getStartCommand(check.id),
                    reason: 'Service is not running'
                });
            }
        });
        
        return recommendations;
    }
    
    getStartCommand(orchestratorId) {
        const commands = {
            domingo: './start-domingo-orchestrator-fixed.sh',
            cal: 'node CAL-ORCHESTRATOR-QUERY-SYSTEM.js',
            ralph: 'node ralph-service-bridge.js'
        };
        
        return commands[orchestratorId] || 'Check service documentation';
    }
    
    async explainWhy(question, context) {
        console.log(`🤔 Explaining why: ${question}`);
        
        // Search knowledge graph for causal relationships
        const relevantNodes = this.searchKnowledgeGraph(question);
        const causalChains = this.findCausalChains(relevantNodes);
        
        return {
            type: 'explanation_why',
            question,
            explanations: causalChains,
            evidence: this.gatherEvidence(relevantNodes),
            confidence: this.calculateConfidence(causalChains)
        };
    }
    
    async explainHow(question, context) {
        console.log(`🛠️ Explaining how: ${question}`);
        
        // Search for process/method information
        const processes = this.findProcesses(question);
        const dependencies = this.traceDependencies(processes);
        
        return {
            type: 'explanation_how',
            question,
            steps: this.generateSteps(processes),
            dependencies,
            examples: this.findExamples(question)
        };
    }
    
    async queryDependencies(target) {
        const deps = this.generateDependencyMap();
        
        if (target && target !== 'all') {
            return {
                type: 'dependency_response',
                target,
                dependencies: deps[target] || {},
                graph: this.generateDependencyGraph(target)
            };
        }
        
        return {
            type: 'dependency_response',
            target: 'all',
            dependencies: deps,
            summary: this.generateDependencySummary(deps)
        };
    }
    
    generateDependencyMap() {
        const deps = {};
        
        // Static dependencies
        deps.domingo = {
            requires: ['express', 'ws', 'pg'],
            provides: ['task-management', 'character-delegation', 'backend-orchestration'],
            connections: ['phpbb-forums', 'hardhat-testing']
        };
        
        deps.cal = {
            requires: ['sqlite3', 'ws', 'layer6-frameworks'],
            provides: ['educational-content', 'query-system', 'cost-tracking'],
            connections: ['fluid-state', 'other-orchestrators']
        };
        
        deps.ralph = {
            requires: ['express', 'service-discovery'],
            provides: ['service-bridging', 'api-integration', 'connection-management'],
            connections: ['external-apis', 'internal-services']
        };
        
        // Dynamic dependencies from knowledge graph
        this.knowledgeGraph.edges.forEach((edge, key) => {
            if (edge.type === 'depends_on') {
                if (!deps[edge.from]) deps[edge.from] = { requires: [], provides: [], connections: [] };
                deps[edge.from].requires.push(edge.to);
            }
        });
        
        return deps;
    }
    
    addToKnowledgeGraph(node) {
        const nodeId = `${node.type}_${node.id}`;
        this.knowledgeGraph.nodes.set(nodeId, {
            ...node,
            discovered: new Date().toISOString()
        });
        
        // Create relationships
        if (node.connections) {
            node.connections.forEach(conn => {
                const edgeId = `${nodeId}_to_${conn}`;
                this.knowledgeGraph.edges.set(edgeId, {
                    from: nodeId,
                    to: conn,
                    type: 'connects_to'
                });
            });
        }
    }
    
    updateOrchestratorState(id, state) {
        const current = this.orchestratorStates.get(id) || {};
        this.orchestratorStates.set(id, {
            ...current,
            ...state,
            lastUpdate: new Date().toISOString()
        });
    }
    
    broadcastUpdate(data) {
        if (this.wsServer) {
            this.wsServer.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        }
    }
    
    async trainClassifier() {
        // Train on query patterns
        this.classifier.addDocument('show status', 'status');
        this.classifier.addDocument('check health', 'status');
        this.classifier.addDocument('are systems running', 'status');
        
        this.classifier.addDocument('find errors', 'error');
        this.classifier.addDocument('what is broken', 'error');
        this.classifier.addDocument('show issues', 'error');
        
        this.classifier.addDocument('websocket status', 'websocket');
        this.classifier.addDocument('connection problems', 'websocket');
        
        this.classifier.addDocument('fix the problem', 'fix');
        this.classifier.addDocument('repair connection', 'fix');
        
        this.classifier.addDocument('why is it failing', 'why');
        this.classifier.addDocument('what caused this', 'why');
        
        this.classifier.addDocument('how does it work', 'how');
        this.classifier.addDocument('explain the process', 'how');
        
        this.classifier.train();
    }
    
    startSemanticMonitoring() {
        // Monitor orchestrator health
        setInterval(() => {
            this.checkOrchestratorHealth();
        }, 10000);
        
        // Update knowledge graph
        setInterval(() => {
            this.updateKnowledgeGraphPatterns();
        }, 30000);
    }
    
    async checkOrchestratorHealth() {
        for (const [id, conn] of this.connections) {
            if (conn.ws && conn.ws.readyState === WebSocket.OPEN) {
                conn.ws.send(JSON.stringify({
                    type: 'health_check',
                    from: 'semantic-bridge'
                }));
            }
        }
    }
    
    updateKnowledgeGraphPatterns() {
        // Analyze patterns in the knowledge graph
        const patterns = new Map();
        
        // Find common failure patterns
        this.knowledgeGraph.edges.forEach(edge => {
            if (edge.type === 'error_caused_by') {
                const key = `${edge.cause}_causes_${edge.effect}`;
                patterns.set(key, (patterns.get(key) || 0) + 1);
            }
        });
        
        this.knowledgeGraph.patterns = patterns;
    }
    
    // Utility methods
    generateStatusSummary(results) {
        const total = Object.keys(results).length;
        const online = Object.values(results).filter(r => r.status === 'online').length;
        const issues = Object.values(results).filter(r => r.health !== 'healthy').length;
        
        return `${online}/${total} orchestrators online, ${issues} health issues detected`;
    }
    
    generateWebSocketSummary(wsStatus) {
        const connected = Object.values(wsStatus).filter(s => s.connected).length;
        const total = Object.keys(wsStatus).length;
        
        return `${connected}/${total} WebSocket connections active`;
    }
    
    generateErrorRecommendations(errors) {
        const recommendations = [];
        
        errors.forEach(errorSet => {
            errorSet.errors.forEach(error => {
                if (error.type === 'connection_error') {
                    recommendations.push({
                        issue: error.message,
                        action: 'restart_service',
                        command: this.getStartCommand(errorSet.orchestrator)
                    });
                }
            });
        });
        
        return recommendations;
    }
}

module.exports = SemanticOrchestratorBridge;

// Run if executed directly
if (require.main === module) {
    const bridge = new SemanticOrchestratorBridge();
    
    bridge.initialize().catch(error => {
        console.error('❌ Failed to start Semantic Bridge:', error);
        process.exit(1);
    });
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down Semantic Bridge...');
        process.exit(0);
    });
}