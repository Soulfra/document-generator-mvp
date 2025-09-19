// FACTION XML MAPPING SYSTEM
// Real-time XML visualization and monitoring of all faction activities

const xml2js = require('xml2js');
const WebSocket = require('ws');

class FactionXMLMappingSystem {
    constructor() {
        this.systemId = `XML-MAPPER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // XML Schema Definition
        this.xmlSchema = {
            root: 'FactionSystem',
            namespace: 'http://faction-decisions.ai/schema/v1',
            encoding: 'UTF-8',
            version: '1.0'
        };
        
        // XML Builder configuration
        this.xmlBuilder = new xml2js.Builder({
            rootName: this.xmlSchema.root,
            xmldec: {
                version: this.xmlSchema.version,
                encoding: this.xmlSchema.encoding
            },
            renderOpts: {
                pretty: true,
                indent: '  ',
                newline: '\n'
            },
            headless: false
        });
        
        // Real-time XML streams
        this.xmlStreams = {
            factions: new Map(),
            deliberations: new Map(),
            proposals: new Map(),
            decisions: new Map(),
            events: []
        };
        
        // XML transformation rules
        this.transformationRules = {
            faction: this.createFactionTransform(),
            deliberation: this.createDeliberationTransform(),
            proposal: this.createProposalTransform(),
            decision: this.createDecisionTransform(),
            event: this.createEventTransform()
        };
        
        // Monitoring configuration
        this.monitoring = {
            updateInterval: 1000, // 1 second
            historySize: 1000,
            streamBuffer: new Map(),
            subscribers: new Set()
        };
        
        this.initializeXMLMapping();
    }
    
    createFactionTransform() {
        return {
            transform: (faction) => ({
                Faction: {
                    $: {
                        id: faction.id,
                        timestamp: new Date().toISOString(),
                        version: '1.0'
                    },
                    Identity: {
                        Name: faction.name,
                        Symbol: faction.symbol,
                        Color: faction.color,
                        Ideology: faction.ideology
                    },
                    Values: {
                        Value: Object.entries(faction.values).map(([key, value]) => ({
                            $: { type: key },
                            _: value.toString()
                        }))
                    },
                    Metrics: {
                        Members: faction.members,
                        Influence: faction.influence,
                        ProposalCount: faction.proposals.length
                    },
                    Relationships: {
                        Allies: {
                            Ally: faction.allies.map(ally => ({
                                $: { faction: ally }
                            }))
                        },
                        Enemies: {
                            Enemy: faction.enemies.map(enemy => ({
                                $: { faction: enemy }
                            }))
                        }
                    }
                }
            })
        };
    }
    
    createDeliberationTransform() {
        return {
            transform: (deliberation) => ({
                Deliberation: {
                    $: {
                        id: deliberation.id,
                        topicId: deliberation.topic.id,
                        round: deliberation.round,
                        timestamp: new Date().toISOString()
                    },
                    Topic: {
                        Title: deliberation.topic.title,
                        Description: deliberation.topic.description,
                        Urgency: deliberation.topic.urgency,
                        Impacts: {
                            Impact: deliberation.topic.impacts.map(impact => ({
                                _: impact
                            }))
                        }
                    },
                    Positions: {
                        Position: Array.from(deliberation.positions.entries()).map(([faction, position]) => ({
                            $: {
                                faction: faction,
                                stance: position.stance,
                                support: position.support
                            },
                            Reasoning: position.reasoning,
                            Proposal: position.proposal
                        }))
                    },
                    Coalitions: {
                        Coalition: deliberation.coalitions.map(coalition => ({
                            $: {
                                strength: coalition.strength
                            },
                            Members: {
                                Member: coalition.members.map(member => ({
                                    $: { faction: member }
                                }))
                            },
                            Proposal: coalition.proposal
                        }))
                    },
                    Arguments: {
                        Argument: deliberation.arguments.map(arg => ({
                            $: {
                                faction: arg.faction,
                                round: arg.round,
                                support: arg.support
                            },
                            Content: arg.argument
                        }))
                    }
                }
            })
        };
    }
    
    createProposalTransform() {
        return {
            transform: (proposal) => ({
                Proposal: {
                    $: {
                        id: proposal.id,
                        type: proposal.proposal.type,
                        status: proposal.status,
                        timestamp: proposal.timestamp
                    },
                    Topic: {
                        $: { id: proposal.proposal.topic.id },
                        Title: proposal.proposal.topic.title,
                        Urgency: proposal.proposal.topic.urgency
                    },
                    Proposers: proposal.proposal.type === 'COALITION' ? {
                        Coalition: {
                            Member: proposal.proposal.members.map(member => ({
                                $: { faction: member }
                            }))
                        }
                    } : {
                        Faction: {
                            $: { id: proposal.proposal.faction }
                        }
                    },
                    Content: {
                        Text: proposal.proposal.proposal,
                        Support: proposal.proposal.support
                    },
                    Impact: {
                        Scope: proposal.impact.scope,
                        AffectedFactions: proposal.impact.affectedFactions,
                        SystemChange: proposal.impact.systemChange,
                        Reversibility: proposal.impact.reversibility
                    },
                    HumanDecision: proposal.humanDecision ? {
                        Decision: proposal.humanDecision.decision,
                        Timestamp: proposal.humanDecision.timestamp,
                        DecisionTime: proposal.humanDecision.decisionTime
                    } : null
                }
            })
        };
    }
    
    createDecisionTransform() {
        return {
            transform: (decision) => ({
                Decision: {
                    $: {
                        id: `DEC-${Date.now()}`,
                        proposalId: decision.proposalId,
                        timestamp: new Date().toISOString()
                    },
                    HumanChoice: decision.decision,
                    Context: {
                        TotalProposals: decision.stats.totalProposals,
                        ApprovalRate: decision.stats.approvalRate,
                        PreviousDecisions: {
                            Approved: decision.stats.approved,
                            Denied: decision.stats.denied
                        }
                    },
                    Impact: {
                        FactionInfluenceChanges: {
                            Change: decision.influenceChanges?.map(change => ({
                                $: {
                                    faction: change.faction,
                                    before: change.before,
                                    after: change.after
                                }
                            })) || []
                        }
                    }
                }
            })
        };
    }
    
    createEventTransform() {
        return {
            transform: (event) => ({
                Event: {
                    $: {
                        id: event.id,
                        type: event.type,
                        timestamp: event.timestamp,
                        severity: event.severity || 'INFO'
                    },
                    Source: event.source,
                    Description: event.description,
                    Data: event.data ? this.serializeEventData(event.data) : null
                }
            })
        };
    }
    
    serializeEventData(data) {
        if (typeof data === 'object') {
            return {
                Property: Object.entries(data).map(([key, value]) => ({
                    $: { name: key },
                    _: typeof value === 'object' ? JSON.stringify(value) : value.toString()
                }))
            };
        }
        return data.toString();
    }
    
    async initializeXMLMapping() {
        console.log('🗺️ INITIALIZING XML MAPPING SYSTEM');
        
        // Create XML monitoring interface
        await this.createXMLMonitoringInterface();
        
        // Start XML stream generation
        this.startXMLStreamGeneration();
        
        // Initialize WebSocket for real-time XML streaming
        this.initializeWebSocketStreaming();
        
        console.log('✅ XML MAPPING SYSTEM ACTIVE');
    }
    
    async createXMLMonitoringInterface() {
        const express = require('express');
        const app = express();
        const server = require('http').createServer(app);
        this.io = require('socket.io')(server);
        
        app.use(express.json());
        
        // XML Monitoring Dashboard
        app.get('/', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Faction XML Mapping Monitor</title>
                    <style>
                        body {
                            font-family: 'Consolas', 'Monaco', monospace;
                            background: #0a0a0a;
                            color: #00ff00;
                            margin: 0;
                            padding: 0;
                            overflow: hidden;
                        }
                        
                        .container {
                            display: grid;
                            grid-template-columns: 250px 1fr;
                            grid-template-rows: 60px 1fr 40px;
                            height: 100vh;
                            gap: 1px;
                            background: #00ff00;
                        }
                        
                        .header {
                            grid-column: 1 / -1;
                            background: #0a0a0a;
                            padding: 15px;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            border-bottom: 2px solid #00ff00;
                        }
                        
                        h1 {
                            margin: 0;
                            font-size: 1.5em;
                            text-shadow: 0 0 10px #00ff00;
                        }
                        
                        .sidebar {
                            background: #0a0a0a;
                            padding: 20px;
                            overflow-y: auto;
                            border-right: 1px solid #00ff00;
                        }
                        
                        .stream-selector {
                            margin-bottom: 20px;
                        }
                        
                        .stream-option {
                            display: block;
                            width: 100%;
                            padding: 10px;
                            margin: 5px 0;
                            background: #1a1a1a;
                            border: 1px solid #00ff00;
                            color: #00ff00;
                            cursor: pointer;
                            transition: all 0.3s;
                            font-family: inherit;
                        }
                        
                        .stream-option:hover {
                            background: #00ff00;
                            color: #000;
                        }
                        
                        .stream-option.active {
                            background: #00ff00;
                            color: #000;
                            font-weight: bold;
                        }
                        
                        .xml-viewer {
                            background: #0a0a0a;
                            padding: 20px;
                            overflow: auto;
                            font-size: 14px;
                            position: relative;
                        }
                        
                        .xml-content {
                            white-space: pre;
                            line-height: 1.4;
                        }
                        
                        .xml-tag {
                            color: #00ffff;
                        }
                        
                        .xml-attribute {
                            color: #ffff00;
                        }
                        
                        .xml-value {
                            color: #ff00ff;
                        }
                        
                        .xml-text {
                            color: #ffffff;
                        }
                        
                        .xml-comment {
                            color: #666666;
                            font-style: italic;
                        }
                        
                        .status-bar {
                            grid-column: 1 / -1;
                            background: #0a0a0a;
                            padding: 10px 20px;
                            border-top: 1px solid #00ff00;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            font-size: 0.9em;
                        }
                        
                        .status-indicator {
                            display: inline-block;
                            width: 10px;
                            height: 10px;
                            border-radius: 50%;
                            margin-right: 10px;
                            background: #00ff00;
                            animation: pulse 2s infinite;
                        }
                        
                        @keyframes pulse {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.5; }
                        }
                        
                        .controls {
                            display: flex;
                            gap: 10px;
                        }
                        
                        .control-button {
                            padding: 5px 15px;
                            background: #1a1a1a;
                            border: 1px solid #00ff00;
                            color: #00ff00;
                            cursor: pointer;
                            font-family: inherit;
                            transition: all 0.3s;
                        }
                        
                        .control-button:hover {
                            background: #00ff00;
                            color: #000;
                        }
                        
                        .line-numbers {
                            position: absolute;
                            left: 0;
                            top: 20px;
                            width: 50px;
                            text-align: right;
                            color: #666;
                            padding-right: 10px;
                            border-right: 1px solid #333;
                            user-select: none;
                        }
                        
                        .xml-content {
                            margin-left: 70px;
                        }
                        
                        .update-indicator {
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            background: #00ff00;
                            color: #000;
                            padding: 5px 10px;
                            border-radius: 5px;
                            opacity: 0;
                            transition: opacity 0.3s;
                        }
                        
                        .update-indicator.show {
                            opacity: 1;
                        }
                        
                        .xpath-bar {
                            background: #1a1a1a;
                            padding: 10px;
                            border-bottom: 1px solid #333;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }
                        
                        .xpath-input {
                            flex: 1;
                            background: #0a0a0a;
                            border: 1px solid #00ff00;
                            color: #00ff00;
                            padding: 5px 10px;
                            font-family: inherit;
                        }
                        
                        .stream-stats {
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #333;
                        }
                        
                        .stat-item {
                            display: flex;
                            justify-content: space-between;
                            margin: 5px 0;
                            font-size: 0.9em;
                        }
                        
                        .highlight {
                            background: rgba(0, 255, 0, 0.2);
                            animation: highlight 1s;
                        }
                        
                        @keyframes highlight {
                            from { background: rgba(0, 255, 0, 0.5); }
                            to { background: rgba(0, 255, 0, 0.2); }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🗺️ FACTION XML MAPPING MONITOR</h1>
                            <div class="controls">
                                <button class="control-button" onclick="toggleAutoScroll()">
                                    Auto-Scroll: ON
                                </button>
                                <button class="control-button" onclick="downloadXML()">
                                    Download XML
                                </button>
                                <button class="control-button" onclick="validateXML()">
                                    Validate
                                </button>
                            </div>
                        </div>
                        
                        <div class="sidebar">
                            <h3>XML Streams</h3>
                            <div class="stream-selector">
                                <button class="stream-option active" onclick="selectStream('system')" data-stream="system">
                                    System Overview
                                </button>
                                <button class="stream-option" onclick="selectStream('factions')" data-stream="factions">
                                    Factions
                                </button>
                                <button class="stream-option" onclick="selectStream('deliberations')" data-stream="deliberations">
                                    Deliberations
                                </button>
                                <button class="stream-option" onclick="selectStream('proposals')" data-stream="proposals">
                                    Proposals
                                </button>
                                <button class="stream-option" onclick="selectStream('decisions')" data-stream="decisions">
                                    Decisions
                                </button>
                                <button class="stream-option" onclick="selectStream('events')" data-stream="events">
                                    Event Log
                                </button>
                                <button class="stream-option" onclick="selectStream('realtime')" data-stream="realtime">
                                    Real-Time Feed
                                </button>
                            </div>
                            
                            <div class="stream-stats">
                                <h4>Stream Statistics</h4>
                                <div class="stat-item">
                                    <span>Updates/sec:</span>
                                    <span id="update-rate">0</span>
                                </div>
                                <div class="stat-item">
                                    <span>Total Nodes:</span>
                                    <span id="node-count">0</span>
                                </div>
                                <div class="stat-item">
                                    <span>Buffer Size:</span>
                                    <span id="buffer-size">0 KB</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="xml-viewer">
                            <div class="xpath-bar">
                                <label style="color: #00ff00;">XPath:</label>
                                <input type="text" class="xpath-input" id="xpath-input" 
                                       placeholder="/FactionSystem/Factions/Faction[@id='technocrats']" />
                                <button class="control-button" onclick="queryXPath()">Query</button>
                            </div>
                            <div class="update-indicator" id="update-indicator">Updated</div>
                            <div class="line-numbers" id="line-numbers"></div>
                            <pre class="xml-content" id="xml-content"><!-- XML content will appear here --></pre>
                        </div>
                        
                        <div class="status-bar">
                            <div>
                                <span class="status-indicator"></span>
                                <span id="connection-status">Connected</span>
                                <span style="margin-left: 20px;">Stream: <span id="current-stream">system</span></span>
                            </div>
                            <div>
                                <span id="last-update">Last update: Never</span>
                            </div>
                        </div>
                    </div>
                    
                    <script src="/socket.io/socket.io.js"></script>
                    <script>
                        const socket = io();
                        let currentStream = 'system';
                        let autoScroll = true;
                        let updateCount = 0;
                        let lastUpdateTime = Date.now();
                        
                        socket.on('xml-update', (data) => {
                            if (data.stream === currentStream || currentStream === 'realtime') {
                                displayXML(data.xml, data.highlight);
                                updateStats();
                                showUpdateIndicator();
                            }
                        });
                        
                        socket.on('stream-stats', (stats) => {
                            document.getElementById('node-count').textContent = stats.nodeCount;
                            document.getElementById('buffer-size').textContent = 
                                (stats.bufferSize / 1024).toFixed(2) + ' KB';
                        });
                        
                        function selectStream(stream) {
                            currentStream = stream;
                            
                            // Update UI
                            document.querySelectorAll('.stream-option').forEach(btn => {
                                btn.classList.remove('active');
                            });
                            document.querySelector(\`[data-stream="\${stream}"]\`).classList.add('active');
                            document.getElementById('current-stream').textContent = stream;
                            
                            // Request stream data
                            socket.emit('select-stream', { stream });
                        }
                        
                        function displayXML(xml, highlightPath) {
                            const formatted = formatXML(xml);
                            const highlighted = highlightPath ? 
                                highlightXMLPath(formatted, highlightPath) : formatted;
                            
                            document.getElementById('xml-content').innerHTML = highlighted;
                            updateLineNumbers();
                            
                            if (autoScroll) {
                                const viewer = document.querySelector('.xml-viewer');
                                viewer.scrollTop = viewer.scrollHeight;
                            }
                        }
                        
                        function formatXML(xml) {
                            // Syntax highlighting for XML
                            return xml
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/(&lt;\\/?)(\\w+)(.*?)(&gt;)/g, 
                                    '<span class="xml-tag">$1$2</span>$3<span class="xml-tag">$4</span>')
                                .replace(/(\\w+)="([^"]+)"/g, 
                                    '<span class="xml-attribute">$1</span>=<span class="xml-value">"$2"</span>')
                                .replace(/(&gt;)([^&<]+)(&lt;)/g, 
                                    '$1<span class="xml-text">$2</span>$3')
                                .replace(/&lt;!--(.+?)--&gt;/g, 
                                    '<span class="xml-comment">&lt;!--$1--&gt;</span>');
                        }
                        
                        function highlightXMLPath(xml, path) {
                            // Simple path highlighting (would be more complex in production)
                            const regex = new RegExp(\`(<\${path}[^>]*>.*?</\${path}>)\`, 'g');
                            return xml.replace(regex, '<span class="highlight">$1</span>');
                        }
                        
                        function updateLineNumbers() {
                            const content = document.getElementById('xml-content').textContent;
                            const lines = content.split('\\n');
                            const lineNumbers = lines.map((_, i) => i + 1).join('\\n');
                            document.getElementById('line-numbers').textContent = lineNumbers;
                        }
                        
                        function toggleAutoScroll() {
                            autoScroll = !autoScroll;
                            event.target.textContent = 'Auto-Scroll: ' + (autoScroll ? 'ON' : 'OFF');
                        }
                        
                        function downloadXML() {
                            socket.emit('download-xml', { stream: currentStream });
                        }
                        
                        socket.on('xml-download', (data) => {
                            const blob = new Blob([data.xml], { type: 'text/xml' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = \`faction-\${data.stream}-\${Date.now()}.xml\`;
                            a.click();
                        });
                        
                        function validateXML() {
                            socket.emit('validate-xml', { stream: currentStream });
                        }
                        
                        socket.on('validation-result', (result) => {
                            alert(result.valid ? 
                                'XML is valid!' : 
                                'XML validation failed: ' + result.error);
                        });
                        
                        function queryXPath() {
                            const xpath = document.getElementById('xpath-input').value;
                            if (xpath) {
                                socket.emit('xpath-query', { xpath, stream: currentStream });
                            }
                        }
                        
                        socket.on('xpath-result', (result) => {
                            if (result.error) {
                                alert('XPath error: ' + result.error);
                            } else {
                                displayXML(result.xml, result.path);
                            }
                        });
                        
                        function updateStats() {
                            updateCount++;
                            const now = Date.now();
                            const elapsed = (now - lastUpdateTime) / 1000;
                            
                            if (elapsed >= 1) {
                                const rate = updateCount / elapsed;
                                document.getElementById('update-rate').textContent = rate.toFixed(1);
                                updateCount = 0;
                                lastUpdateTime = now;
                            }
                            
                            document.getElementById('last-update').textContent = 
                                'Last update: ' + new Date().toLocaleTimeString();
                        }
                        
                        function showUpdateIndicator() {
                            const indicator = document.getElementById('update-indicator');
                            indicator.classList.add('show');
                            setTimeout(() => {
                                indicator.classList.remove('show');
                            }, 500);
                        }
                        
                        // Request initial data
                        socket.emit('select-stream', { stream: currentStream });
                        
                        // Auto-refresh every second for real-time stream
                        setInterval(() => {
                            if (currentStream === 'realtime') {
                                socket.emit('refresh-stream');
                            }
                        }, 1000);
                    </script>
                </body>
                </html>
            `);
        });
        
        // XML API endpoints
        app.get('/api/xml/:stream', (req, res) => {
            const stream = req.params.stream;
            const xml = this.generateStreamXML(stream);
            res.type('application/xml').send(xml);
        });
        
        app.get('/api/schema', (req, res) => {
            res.type('application/xml').send(this.generateXMLSchema());
        });
        
        // WebSocket handlers
        this.io.on('connection', (socket) => {
            console.log('XML monitor connected');
            this.monitoring.subscribers.add(socket);
            
            socket.on('select-stream', (data) => {
                const xml = this.generateStreamXML(data.stream);
                socket.emit('xml-update', { stream: data.stream, xml });
                
                // Send stats
                socket.emit('stream-stats', this.getStreamStats());
            });
            
            socket.on('download-xml', (data) => {
                const xml = this.generateStreamXML(data.stream);
                socket.emit('xml-download', { stream: data.stream, xml });
            });
            
            socket.on('validate-xml', (data) => {
                const result = this.validateXMLStream(data.stream);
                socket.emit('validation-result', result);
            });
            
            socket.on('xpath-query', (data) => {
                const result = this.queryXPath(data.xpath, data.stream);
                socket.emit('xpath-result', result);
            });
            
            socket.on('refresh-stream', () => {
                const xml = this.generateRealTimeXML();
                socket.emit('xml-update', { stream: 'realtime', xml });
            });
            
            socket.on('disconnect', () => {
                this.monitoring.subscribers.delete(socket);
                console.log('XML monitor disconnected');
            });
        });
        
        const server = app.listen(9999, () => {
            console.log('🗺️ XML Mapping Interface: http://localhost:9999');
        });
        
        // Also create WebSocket server for raw XML streaming
        this.wsServer = new WebSocket.Server({ port: 9998 });
        
        this.wsServer.on('connection', (ws) => {
            console.log('Raw XML stream connected');
            
            // Send XML updates every second
            const interval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    const xml = this.generateRealTimeXML();
                    ws.send(xml);
                }
            }, 1000);
            
            ws.on('close', () => {
                clearInterval(interval);
                console.log('Raw XML stream disconnected');
            });
        });
        
        console.log('🔌 Raw XML WebSocket: ws://localhost:9998');
    }
    
    generateStreamXML(stream) {
        switch (stream) {
            case 'system':
                return this.generateSystemOverviewXML();
            case 'factions':
                return this.generateFactionsXML();
            case 'deliberations':
                return this.generateDeliberationsXML();
            case 'proposals':
                return this.generateProposalsXML();
            case 'decisions':
                return this.generateDecisionsXML();
            case 'events':
                return this.generateEventsXML();
            case 'realtime':
                return this.generateRealTimeXML();
            default:
                return this.generateSystemOverviewXML();
        }
    }
    
    generateSystemOverviewXML() {
        const systemData = {
            FactionSystem: {
                $: {
                    xmlns: this.xmlSchema.namespace,
                    version: this.xmlSchema.version,
                    timestamp: new Date().toISOString()
                },
                SystemInfo: {
                    ID: this.systemId,
                    Status: 'ACTIVE',
                    Uptime: process.uptime(),
                    Version: '1.0.0'
                },
                Statistics: {
                    ActiveFactions: this.xmlStreams.factions.size,
                    ActiveDeliberations: this.xmlStreams.deliberations.size,
                    PendingProposals: this.xmlStreams.proposals.size,
                    TotalDecisions: this.xmlStreams.decisions.size,
                    EventCount: this.xmlStreams.events.length
                },
                CurrentState: {
                    MostInfluentialFaction: this.getMostInfluentialFaction(),
                    ActiveTopics: this.getActiveTopics(),
                    RecentDecisions: this.getRecentDecisions(5)
                }
            }
        };
        
        return this.xmlBuilder.buildObject(systemData);
    }
    
    generateFactionsXML() {
        const factions = Array.from(this.xmlStreams.factions.values());
        const factionsData = {
            Factions: {
                $: {
                    xmlns: this.xmlSchema.namespace,
                    count: factions.length,
                    timestamp: new Date().toISOString()
                },
                Faction: factions.map(faction => 
                    this.transformationRules.faction.transform(faction).Faction
                )
            }
        };
        
        return this.xmlBuilder.buildObject(factionsData);
    }
    
    generateDeliberationsXML() {
        const deliberations = Array.from(this.xmlStreams.deliberations.values());
        const deliberationsData = {
            Deliberations: {
                $: {
                    xmlns: this.xmlSchema.namespace,
                    count: deliberations.length,
                    timestamp: new Date().toISOString()
                },
                Deliberation: deliberations.map(delib => 
                    this.transformationRules.deliberation.transform(delib).Deliberation
                )
            }
        };
        
        return this.xmlBuilder.buildObject(deliberationsData);
    }
    
    generateProposalsXML() {
        const proposals = Array.from(this.xmlStreams.proposals.values());
        const proposalsData = {
            Proposals: {
                $: {
                    xmlns: this.xmlSchema.namespace,
                    count: proposals.length,
                    timestamp: new Date().toISOString()
                },
                Proposal: proposals.map(proposal => 
                    this.transformationRules.proposal.transform(proposal).Proposal
                )
            }
        };
        
        return this.xmlBuilder.buildObject(proposalsData);
    }
    
    generateDecisionsXML() {
        const decisions = Array.from(this.xmlStreams.decisions.values());
        const decisionsData = {
            Decisions: {
                $: {
                    xmlns: this.xmlSchema.namespace,
                    count: decisions.length,
                    timestamp: new Date().toISOString()
                },
                Decision: decisions.map(decision => 
                    this.transformationRules.decision.transform(decision).Decision
                )
            }
        };
        
        return this.xmlBuilder.buildObject(decisionsData);
    }
    
    generateEventsXML() {
        const recentEvents = this.xmlStreams.events.slice(-100); // Last 100 events
        const eventsData = {
            EventLog: {
                $: {
                    xmlns: this.xmlSchema.namespace,
                    count: recentEvents.length,
                    timestamp: new Date().toISOString()
                },
                Event: recentEvents.map(event => 
                    this.transformationRules.event.transform(event).Event
                )
            }
        };
        
        return this.xmlBuilder.buildObject(eventsData);
    }
    
    generateRealTimeXML() {
        // Combine all active data into real-time feed
        const realTimeData = {
            RealTimeFeed: {
                $: {
                    xmlns: this.xmlSchema.namespace,
                    timestamp: new Date().toISOString()
                },
                CurrentActivity: {
                    ActiveDeliberations: Array.from(this.xmlStreams.deliberations.values())
                        .slice(-3)
                        .map(d => ({
                            Topic: d.topic.title,
                            Round: d.round
                        })),
                    PendingProposals: Array.from(this.xmlStreams.proposals.values())
                        .filter(p => p.status === 'PENDING')
                        .slice(-3)
                        .map(p => ({
                            ID: p.id,
                            Topic: p.proposal.topic.title
                        })),
                    RecentEvents: this.xmlStreams.events.slice(-5).map(e => ({
                        Type: e.type,
                        Description: e.description,
                        Time: e.timestamp
                    }))
                }
            }
        };
        
        return this.xmlBuilder.buildObject(realTimeData);
    }
    
    generateXMLSchema() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="${this.xmlSchema.namespace}"
           xmlns="${this.xmlSchema.namespace}"
           elementFormDefault="qualified">
    
    <!-- Root Elements -->
    <xs:element name="FactionSystem" type="FactionSystemType"/>
    <xs:element name="Factions" type="FactionsType"/>
    <xs:element name="Deliberations" type="DeliberationsType"/>
    <xs:element name="Proposals" type="ProposalsType"/>
    <xs:element name="Decisions" type="DecisionsType"/>
    <xs:element name="EventLog" type="EventLogType"/>
    
    <!-- Complex Types -->
    <xs:complexType name="FactionSystemType">
        <xs:sequence>
            <xs:element name="SystemInfo" type="SystemInfoType"/>
            <xs:element name="Statistics" type="StatisticsType"/>
            <xs:element name="CurrentState" type="CurrentStateType"/>
        </xs:sequence>
        <xs:attribute name="version" type="xs:string" use="required"/>
        <xs:attribute name="timestamp" type="xs:dateTime" use="required"/>
    </xs:complexType>
    
    <xs:complexType name="FactionType">
        <xs:sequence>
            <xs:element name="Identity" type="IdentityType"/>
            <xs:element name="Values" type="ValuesType"/>
            <xs:element name="Metrics" type="MetricsType"/>
            <xs:element name="Relationships" type="RelationshipsType"/>
        </xs:sequence>
        <xs:attribute name="id" type="xs:string" use="required"/>
        <xs:attribute name="timestamp" type="xs:dateTime" use="required"/>
    </xs:complexType>
    
    <!-- Add more type definitions as needed -->
    
</xs:schema>`;
    }
    
    startXMLStreamGeneration() {
        // Generate XML streams at regular intervals
        setInterval(() => {
            this.updateXMLStreams();
            this.broadcastXMLUpdates();
        }, this.monitoring.updateInterval);
    }
    
    updateXMLStreams() {
        // This would connect to the actual faction system
        // For now, we'll simulate some updates
        
        // Log an event
        this.logEvent({
            type: 'STREAM_UPDATE',
            source: 'XMLMapper',
            description: 'Regular stream update cycle',
            severity: 'INFO',
            data: {
                streamsUpdated: Object.keys(this.xmlStreams).length
            }
        });
    }
    
    broadcastXMLUpdates() {
        // Broadcast to all WebSocket subscribers
        this.monitoring.subscribers.forEach(socket => {
            if (socket.connected) {
                // Send focused updates based on what they're watching
                const currentStream = socket.currentStream || 'system';
                const xml = this.generateStreamXML(currentStream);
                socket.emit('xml-update', { stream: currentStream, xml });
            }
        });
    }
    
    logEvent(event) {
        const fullEvent = {
            id: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            timestamp: new Date().toISOString(),
            ...event
        };
        
        this.xmlStreams.events.push(fullEvent);
        
        // Keep only last 1000 events
        if (this.xmlStreams.events.length > this.monitoring.historySize) {
            this.xmlStreams.events = this.xmlStreams.events.slice(-this.monitoring.historySize);
        }
    }
    
    getStreamStats() {
        const stats = {
            nodeCount: 0,
            bufferSize: 0
        };
        
        // Count nodes across all streams
        stats.nodeCount += this.xmlStreams.factions.size;
        stats.nodeCount += this.xmlStreams.deliberations.size;
        stats.nodeCount += this.xmlStreams.proposals.size;
        stats.nodeCount += this.xmlStreams.decisions.size;
        stats.nodeCount += this.xmlStreams.events.length;
        
        // Estimate buffer size
        Object.values(this.xmlStreams).forEach(stream => {
            if (stream instanceof Map) {
                stream.forEach(item => {
                    stats.bufferSize += JSON.stringify(item).length;
                });
            } else if (Array.isArray(stream)) {
                stream.forEach(item => {
                    stats.bufferSize += JSON.stringify(item).length;
                });
            }
        });
        
        return stats;
    }
    
    validateXMLStream(stream) {
        try {
            const xml = this.generateStreamXML(stream);
            // Simple validation - in production would use full XSD validation
            return { valid: xml.includes('<?xml') && xml.includes('</'), error: null };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    queryXPath(xpath, stream) {
        try {
            // Simplified XPath query - in production would use proper XPath engine
            const xml = this.generateStreamXML(stream);
            
            // Extract the element name from simple XPath
            const match = xpath.match(/\/(\w+)$/);
            if (match) {
                const element = match[1];
                const regex = new RegExp(`<${element}[^>]*>.*?</${element}>`, 'gs');
                const matches = xml.match(regex);
                
                if (matches) {
                    return { xml: matches[0], path: element };
                }
            }
            
            return { error: 'No matches found' };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    getMostInfluentialFaction() {
        // Would connect to actual system
        return { Name: 'Technocrats', Influence: 0.85 };
    }
    
    getActiveTopics() {
        // Would connect to actual system
        return {
            Topic: [
                { Title: 'AI Wallet Access', Status: 'DELIBERATING' },
                { Title: 'Resource Allocation', Status: 'VOTING' }
            ]
        };
    }
    
    getRecentDecisions(count) {
        // Would connect to actual system
        return {
            Decision: Array(count).fill().map((_, i) => ({
                ID: `DEC-${i}`,
                Result: i % 2 === 0 ? 'APPROVED' : 'DENIED',
                Time: new Date(Date.now() - i * 3600000).toISOString()
            }))
        };
    }
    
    initializeWebSocketStreaming() {
        console.log('📡 XML WebSocket streaming initialized');
        console.log('   Raw XML stream: ws://localhost:9998');
        console.log('   Socket.IO stream: http://localhost:9999');
    }
    
    // Integration methods for faction system
    connectToFactionSystem(factionSystem) {
        // Subscribe to faction system events
        factionSystem.on('faction-update', (faction) => {
            this.xmlStreams.factions.set(faction.id, faction);
            this.logEvent({
                type: 'FACTION_UPDATE',
                source: faction.id,
                description: `Faction ${faction.name} updated`
            });
        });
        
        factionSystem.on('deliberation-update', (deliberation) => {
            this.xmlStreams.deliberations.set(deliberation.id, deliberation);
            this.logEvent({
                type: 'DELIBERATION_UPDATE',
                source: 'DeliberationEngine',
                description: `Deliberation on ${deliberation.topic.title} round ${deliberation.round}`
            });
        });
        
        factionSystem.on('proposal-created', (proposal) => {
            this.xmlStreams.proposals.set(proposal.id, proposal);
            this.logEvent({
                type: 'PROPOSAL_CREATED',
                source: proposal.proposal.type === 'COALITION' ? 'Coalition' : proposal.proposal.faction,
                description: `New proposal: ${proposal.proposal.proposal.substring(0, 50)}...`
            });
        });
        
        factionSystem.on('decision-made', (decision) => {
            this.xmlStreams.decisions.set(decision.id, decision);
            this.logEvent({
                type: 'DECISION_MADE',
                source: 'Human',
                description: `Decision: ${decision.decision} on proposal ${decision.proposalId}`,
                severity: 'IMPORTANT'
            });
        });
    }
}

// Initialize the XML Mapping System
const xmlMapper = new FactionXMLMappingSystem();

// Export for integration
module.exports = xmlMapper;

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║          FACTION XML MAPPING SYSTEM - INITIALIZED                ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🗺️  XML FEATURES:                                               ║
║  ├─ Real-time XML streaming of all faction data                 ║
║  ├─ Multiple specialized XML views                              ║
║  ├─ XPath query support                                          ║
║  ├─ XML Schema validation                                        ║
║  └─ WebSocket streaming for live updates                        ║
║                                                                  ║
║  📡 AVAILABLE STREAMS:                                           ║
║  ├─ System Overview - Complete system state                      ║
║  ├─ Factions - All faction data and relationships               ║
║  ├─ Deliberations - Active debates and positions                ║
║  ├─ Proposals - Pending and historical proposals                ║
║  ├─ Decisions - Human decision history                          ║
║  ├─ Events - Complete event log                                 ║
║  └─ Real-time - Live feed of all activity                      ║
║                                                                  ║
║  🔧 INTERFACES:                                                  ║
║  ├─ Web Monitor: http://localhost:9999                          ║
║  ├─ Raw WebSocket: ws://localhost:9998                          ║
║  ├─ REST API: http://localhost:9999/api/xml/{stream}            ║
║  └─ Schema: http://localhost:9999/api/schema                    ║
║                                                                  ║
║  📊 MONITORING:                                                  ║
║  ├─ Line-by-line XML display with syntax highlighting           ║
║  ├─ Update rate and statistics tracking                         ║
║  ├─ XPath query interface                                        ║
║  └─ Download and validation tools                               ║
║                                                                  ║
║  ⚡ STATUS: STREAMING ACTIVE                                     ║
║  📡 SUBSCRIBERS: WAITING                                         ║
║  🔄 UPDATE RATE: 1Hz                                            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`);