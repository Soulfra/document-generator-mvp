#!/usr/bin/env node

const WebSocket = require('ws');
const http = require('http');
const { spawn } = require('child_process');
const EventEmitter = require('events');
const readline = require('readline');

class LiveReasoningObserver extends EventEmitter {
    constructor() {
        super();
        
        this.observerState = {
            observer_id: `observer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            session_start: new Date(),
            
            // Connection to dungeon crawler
            dungeon_connection: {
                ws_url: 'ws://localhost:9301',
                connected: false,
                reconnect_attempts: 0
            },
            
            // Local AI connection (Ollama)
            local_ai: {
                model: 'llama2', // or mistral, codellama, etc.
                api_url: 'http://localhost:11434',
                conversation_history: [],
                system_prompt: `You are observing a live Domain Master Dungeon Crawler game. 
                You will see real-time events as players mine domains, discover businesses, and build yellow pages.
                Analyze what's happening, identify patterns, and help the user understand the game dynamics.
                You can suggest strategies, point out interesting discoveries, and explain the reasoning behind game events.`
            },
            
            // Reasoning engine
            reasoning: {
                observations: [],
                patterns: new Map(),
                insights: [],
                questions_for_user: []
            },
            
            // Live feed
            live_feed: {
                events: [],
                max_events: 1000,
                filters: {
                    domain_discoveries: true,
                    business_finds: true,
                    gacha_pulls: true,
                    marketplace_activity: true,
                    player_actions: true,
                    system_events: true
                }
            }
        };
        
        this.ports = {
            http: 9400,
            ws: 9401
        };
    }
    
    async initialize() {
        console.log('🔍 Initializing Live Reasoning Observer...');
        console.log(`👁️ Observer ID: ${this.observerState.observer_id}`);
        
        // Check if Ollama is available
        await this.checkOllama();
        
        // Connect to dungeon crawler
        await this.connectToDungeon();
        
        // Start web interface
        await this.startWebInterface();
        
        // Start CLI interface
        this.startCLIInterface();
        
        // Start reasoning loop
        this.startReasoningLoop();
        
        console.log('\n✅ LIVE REASONING OBSERVER READY!');
        console.log(`🌐 Web Interface: http://localhost:${this.ports.http}`);
        console.log(`📡 WebSocket Feed: ws://localhost:${this.ports.ws}`);
        console.log('🤖 Local AI: Connected to Ollama');
        console.log('💬 Type your questions in the terminal to interact with the AI observer');
    }
    
    async checkOllama() {
        try {
            const response = await fetch(`${this.observerState.local_ai.api_url}/api/tags`);
            const data = await response.json();
            console.log('✅ Ollama detected with models:', data.models.map(m => m.name).join(', '));
            
            // Check if preferred model exists
            const hasModel = data.models.some(m => m.name.includes(this.observerState.local_ai.model));
            if (!hasModel) {
                console.log(`⚠️ Model ${this.observerState.local_ai.model} not found, using first available`);
                if (data.models.length > 0) {
                    this.observerState.local_ai.model = data.models[0].name;
                }
            }
        } catch (error) {
            console.error('❌ Ollama not available:', error.message);
            console.log('📥 Please install Ollama from https://ollama.ai');
            console.log('🔧 Then run: ollama pull llama2');
        }
    }
    
    async connectToDungeon() {
        return new Promise((resolve) => {
            console.log('🔌 Connecting to Domain Dungeon Crawler...');
            
            this.dungeonWs = new WebSocket(this.observerState.dungeon_connection.ws_url);
            
            this.dungeonWs.on('open', () => {
                console.log('✅ Connected to dungeon crawler');
                this.observerState.dungeon_connection.connected = true;
                
                // Subscribe to all events
                this.dungeonWs.send(JSON.stringify({
                    type: 'subscribe',
                    observer_id: this.observerState.observer_id,
                    filters: this.observerState.live_feed.filters
                }));
                
                resolve();
            });
            
            this.dungeonWs.on('message', (data) => {
                try {
                    const event = JSON.parse(data.toString());
                    this.handleDungeonEvent(event);
                } catch (error) {
                    console.error('Error parsing dungeon event:', error);
                }
            });
            
            this.dungeonWs.on('error', (error) => {
                console.error('❌ Dungeon connection error:', error);
                this.attemptReconnect();
            });
            
            this.dungeonWs.on('close', () => {
                console.log('🔌 Dungeon connection closed');
                this.observerState.dungeon_connection.connected = false;
                this.attemptReconnect();
            });
        });
    }
    
    attemptReconnect() {
        if (this.observerState.dungeon_connection.reconnect_attempts < 5) {
            this.observerState.dungeon_connection.reconnect_attempts++;
            console.log(`🔄 Attempting reconnect (${this.observerState.dungeon_connection.reconnect_attempts}/5)...`);
            setTimeout(() => this.connectToDungeon(), 5000);
        }
    }
    
    async handleDungeonEvent(event) {
        // Add to live feed
        this.observerState.live_feed.events.unshift({
            timestamp: new Date(),
            event_type: event.type,
            data: event
        });
        
        // Trim feed if too large
        if (this.observerState.live_feed.events.length > this.observerState.live_feed.max_events) {
            this.observerState.live_feed.events = this.observerState.live_feed.events.slice(0, this.observerState.live_feed.max_events);
        }
        
        // Extract reasoning from event
        const reasoning = await this.extractReasoning(event);
        if (reasoning) {
            this.observerState.reasoning.observations.push(reasoning);
            
            // Analyze for patterns
            this.analyzePatterns(event, reasoning);
            
            // Generate insights if enough data
            if (this.observerState.reasoning.observations.length % 10 === 0) {
                await this.generateInsights();
            }
        }
        
        // Broadcast to web clients
        this.broadcast({
            type: 'dungeon_event',
            event: event,
            reasoning: reasoning,
            timestamp: new Date()
        });
    }
    
    async extractReasoning(event) {
        const reasoning = {
            event_id: event.id || `evt-${Date.now()}`,
            event_type: event.type,
            timestamp: new Date(),
            analysis: {}
        };
        
        switch (event.type) {
            case 'domain_discovered':
                reasoning.analysis = {
                    significance: this.assessDomainSignificance(event.domain),
                    market_value: this.estimateDomainValue(event.domain),
                    strategy_implications: this.analyzeDomainStrategy(event.domain),
                    reasoning: `Player discovered ${event.domain.name} (${event.domain.rarity}) on floor ${event.floor}. This domain's value is estimated at ${event.domain.value} gold.`
                };
                break;
                
            case 'business_discovered':
                reasoning.analysis = {
                    category_growth: this.analyzeBusinessCategory(event.business),
                    market_saturation: this.checkMarketSaturation(event.business.category),
                    yellow_pages_impact: this.assessYellowPagesImpact(event.business),
                    reasoning: `New business "${event.business.name}" discovered in ${event.business.category}. This adds to the yellow pages diversity.`
                };
                break;
                
            case 'gacha_pull':
                reasoning.analysis = {
                    luck_factor: this.calculateLuckFactor(event.result),
                    cost_benefit: this.analyzeCostBenefit(event),
                    pull_strategy: this.suggestPullStrategy(event.player_state),
                    reasoning: `Player pulled ${event.result.rarity} domain "${event.result.domain}" from gacha. ${event.result.rarity === 'legendary' ? 'Incredible luck!' : 'Standard result.'}`
                };
                break;
                
            case 'marketplace_transaction':
                reasoning.analysis = {
                    price_analysis: this.analyzePricing(event.transaction),
                    market_trend: this.identifyMarketTrend(event.transaction),
                    profit_margin: event.transaction.price - event.transaction.original_value,
                    reasoning: `Domain "${event.transaction.domain}" ${event.transaction.type} for ${event.transaction.price} gold. ${event.transaction.type === 'sold' ? 'Profit' : 'Investment'}: ${event.transaction.price - event.transaction.original_value} gold.`
                };
                break;
                
            case 'floor_cleared':
                reasoning.analysis = {
                    clear_time: event.clear_time,
                    efficiency: this.calculateClearEfficiency(event),
                    loot_quality: this.assessLootQuality(event.loot),
                    reasoning: `Floor ${event.floor} cleared in ${event.clear_time}s. Efficiency rating: ${this.calculateClearEfficiency(event)}/10.`
                };
                break;
        }
        
        return reasoning;
    }
    
    assessDomainSignificance(domain) {
        let score = 5; // Base score
        
        // Length bonus
        if (domain.name.length <= 4) score += 3;
        else if (domain.name.length <= 6) score += 2;
        else if (domain.name.length <= 8) score += 1;
        
        // TLD bonus
        const premiumTLDs = ['.com', '.ai', '.io', '.app'];
        if (premiumTLDs.includes(domain.extension)) score += 2;
        
        // Rarity bonus
        const rarityBonus = {
            'legendary': 5,
            'mythic': 4,
            'epic': 3,
            'rare': 2,
            'uncommon': 1,
            'common': 0
        };
        score += rarityBonus[domain.rarity] || 0;
        
        return Math.min(score, 10);
    }
    
    estimateDomainValue(domain) {
        // Simplified domain valuation algorithm
        let baseValue = domain.value || 100;
        
        // Market multipliers
        if (domain.extension === '.com') baseValue *= 2;
        if (domain.extension === '.ai') baseValue *= 1.8;
        if (domain.name.length <= 4) baseValue *= 3;
        
        return Math.floor(baseValue);
    }
    
    analyzeDomainStrategy(domain) {
        const strategies = [];
        
        if (domain.rarity === 'legendary' || domain.rarity === 'mythic') {
            strategies.push('HOLD - Extremely rare, value will appreciate');
        }
        
        if (domain.name.length <= 4) {
            strategies.push('PREMIUM - Short domains are always in demand');
        }
        
        if (domain.extension === '.ai' || domain.extension === '.io') {
            strategies.push('TECH MARKET - High demand in startup ecosystem');
        }
        
        return strategies;
    }
    
    analyzePatterns(event, reasoning) {
        // Track patterns over time
        const patternKey = `${event.type}_pattern`;
        
        if (!this.observerState.reasoning.patterns.has(patternKey)) {
            this.observerState.reasoning.patterns.set(patternKey, {
                count: 0,
                events: [],
                trends: []
            });
        }
        
        const pattern = this.observerState.reasoning.patterns.get(patternKey);
        pattern.count++;
        pattern.events.push({
            timestamp: new Date(),
            event: event,
            reasoning: reasoning
        });
        
        // Keep only recent events
        if (pattern.events.length > 100) {
            pattern.events = pattern.events.slice(-100);
        }
        
        // Identify trends
        if (pattern.count % 10 === 0) {
            this.identifyTrends(patternKey, pattern);
        }
    }
    
    identifyTrends(patternKey, pattern) {
        // Simple trend analysis
        const recentEvents = pattern.events.slice(-20);
        const trends = [];
        
        if (patternKey === 'domain_discovered_pattern') {
            // Check rarity distribution
            const rarityCount = {};
            recentEvents.forEach(e => {
                const rarity = e.event.domain?.rarity || 'unknown';
                rarityCount[rarity] = (rarityCount[rarity] || 0) + 1;
            });
            
            trends.push({
                type: 'rarity_distribution',
                data: rarityCount,
                insight: `Recent domain discoveries: ${JSON.stringify(rarityCount)}`
            });
        }
        
        pattern.trends = trends;
    }
    
    async generateInsights() {
        // Use local AI to generate insights
        const recentObservations = this.observerState.reasoning.observations.slice(-20);
        
        const prompt = `Based on these recent game observations, provide strategic insights:

${recentObservations.map(obs => obs.analysis.reasoning).join('\n')}

Provide 3 key insights for the player:`;
        
        try {
            const insights = await this.queryLocalAI(prompt);
            this.observerState.reasoning.insights.push({
                timestamp: new Date(),
                insights: insights,
                based_on: recentObservations.length + ' observations'
            });
            
            // Broadcast insights
            this.broadcast({
                type: 'ai_insights',
                insights: insights,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error generating insights:', error);
        }
    }
    
    async queryLocalAI(prompt, stream = false) {
        try {
            const response = await fetch(`${this.observerState.local_ai.api_url}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.observerState.local_ai.model,
                    prompt: this.observerState.local_ai.system_prompt + '\n\n' + prompt,
                    stream: stream
                })
            });
            
            if (stream) {
                return response.body;
            } else {
                const data = await response.json();
                return data.response;
            }
        } catch (error) {
            console.error('Local AI error:', error);
            return 'AI temporarily unavailable';
        }
    }
    
    startCLIInterface() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '🤖 Ask AI Observer > '
        });
        
        console.log('\n💬 CLI Interface Ready! Ask questions about the game:');
        rl.prompt();
        
        rl.on('line', async (line) => {
            const question = line.trim();
            if (!question) {
                rl.prompt();
                return;
            }
            
            // Special commands
            if (question === '/stats') {
                this.showStats();
                rl.prompt();
                return;
            }
            
            if (question === '/patterns') {
                this.showPatterns();
                rl.prompt();
                return;
            }
            
            if (question === '/insights') {
                this.showInsights();
                rl.prompt();
                return;
            }
            
            if (question === '/help') {
                console.log('\n📚 Available commands:');
                console.log('  /stats    - Show observation statistics');
                console.log('  /patterns - Show identified patterns');
                console.log('  /insights - Show AI-generated insights');
                console.log('  /help     - Show this help');
                console.log('  Any other text - Ask the AI observer\n');
                rl.prompt();
                return;
            }
            
            // Query AI with context
            console.log('\n🤔 AI is thinking...');
            
            const context = this.buildAIContext();
            const fullPrompt = `${context}\n\nUser question: ${question}`;
            
            try {
                const response = await this.queryLocalAI(fullPrompt);
                console.log(`\n🤖 AI Observer: ${response}\n`);
                
                // Add to conversation history
                this.observerState.local_ai.conversation_history.push({
                    timestamp: new Date(),
                    question: question,
                    response: response
                });
            } catch (error) {
                console.error('\n❌ AI Error:', error.message);
            }
            
            rl.prompt();
        });
    }
    
    buildAIContext() {
        const recentEvents = this.observerState.live_feed.events.slice(0, 10);
        const recentInsights = this.observerState.reasoning.insights.slice(-3);
        
        return `Current game state context:
- Total events observed: ${this.observerState.live_feed.events.length}
- Recent events: ${recentEvents.map(e => `${e.event_type} at ${e.timestamp.toISOString()}`).join(', ')}
- Active patterns: ${Array.from(this.observerState.reasoning.patterns.keys()).join(', ')}
- Latest insights: ${recentInsights.map(i => i.insights).join('\n')}`;
    }
    
    showStats() {
        console.log('\n📊 Observation Statistics:');
        console.log(`Total Events: ${this.observerState.live_feed.events.length}`);
        console.log(`Observations: ${this.observerState.reasoning.observations.length}`);
        console.log(`Patterns Tracked: ${this.observerState.reasoning.patterns.size}`);
        console.log(`Insights Generated: ${this.observerState.reasoning.insights.length}`);
        console.log(`Session Duration: ${Math.floor((Date.now() - this.observerState.session_start) / 1000 / 60)} minutes`);
        
        // Event type breakdown
        const eventTypes = {};
        this.observerState.live_feed.events.forEach(e => {
            eventTypes[e.event_type] = (eventTypes[e.event_type] || 0) + 1;
        });
        console.log('\nEvent Types:');
        Object.entries(eventTypes).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });
    }
    
    showPatterns() {
        console.log('\n🔍 Identified Patterns:');
        this.observerState.reasoning.patterns.forEach((pattern, key) => {
            console.log(`\n${key}:`);
            console.log(`  Count: ${pattern.count}`);
            console.log(`  Recent Trends: ${pattern.trends.map(t => t.insight).join(', ') || 'None yet'}`);
        });
    }
    
    showInsights() {
        console.log('\n💡 AI-Generated Insights:');
        const recent = this.observerState.reasoning.insights.slice(-5);
        recent.forEach((insight, i) => {
            console.log(`\n[${insight.timestamp.toISOString()}]`);
            console.log(insight.insights);
        });
    }
    
    startReasoningLoop() {
        // Periodic reasoning tasks
        setInterval(() => {
            // Clean old data
            this.cleanOldData();
            
            // Generate periodic insights
            if (this.observerState.reasoning.observations.length > 0) {
                this.generateInsights();
            }
        }, 60000); // Every minute
    }
    
    cleanOldData() {
        // Keep only recent data to prevent memory bloat
        const maxAge = 3600000; // 1 hour
        const now = Date.now();
        
        this.observerState.live_feed.events = this.observerState.live_feed.events.filter(e => 
            now - e.timestamp.getTime() < maxAge
        );
        
        this.observerState.reasoning.observations = this.observerState.reasoning.observations.filter(o =>
            now - o.timestamp.getTime() < maxAge
        );
    }
    
    async startWebInterface() {
        // Create HTTP server
        this.httpServer = http.createServer((req, res) => {
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.generateHTML());
            } else if (req.url === '/api/state') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.getPublicState()));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        // Create WebSocket server
        this.wss = new WebSocket.Server({ 
            server: this.httpServer,
            path: '/ws'
        });
        
        this.wss.on('connection', (ws) => {
            console.log('📱 New web client connected');
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'initial_state',
                state: this.getPublicState()
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleWebCommand(data, ws);
                } catch (error) {
                    console.error('Web command error:', error);
                }
            });
        });
        
        // Start server
        await new Promise((resolve) => {
            this.httpServer.listen(this.ports.http, () => {
                console.log(`🌐 Web interface listening on http://localhost:${this.ports.http}`);
                resolve();
            });
        });
    }
    
    broadcast(data) {
        const message = JSON.stringify(data);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    getPublicState() {
        return {
            observer_id: this.observerState.observer_id,
            session_start: this.observerState.session_start,
            connection_status: this.observerState.dungeon_connection.connected,
            
            stats: {
                total_events: this.observerState.live_feed.events.length,
                total_observations: this.observerState.reasoning.observations.length,
                patterns_identified: this.observerState.reasoning.patterns.size,
                insights_generated: this.observerState.reasoning.insights.length
            },
            
            recent_events: this.observerState.live_feed.events.slice(0, 50),
            recent_insights: this.observerState.reasoning.insights.slice(-5),
            
            filters: this.observerState.live_feed.filters
        };
    }
    
    async handleWebCommand(data, ws) {
        switch (data.type) {
            case 'query_ai':
                const response = await this.queryLocalAI(data.question);
                ws.send(JSON.stringify({
                    type: 'ai_response',
                    question: data.question,
                    response: response
                }));
                break;
                
            case 'update_filters':
                Object.assign(this.observerState.live_feed.filters, data.filters);
                this.broadcast({
                    type: 'filters_updated',
                    filters: this.observerState.live_feed.filters
                });
                break;
                
            case 'request_analysis':
                await this.generateInsights();
                break;
        }
    }
    
    generateHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Live Reasoning Observer</title>
    <style>
        body {
            font-family: monospace;
            background: #0a0a0a;
            color: #00ff00;
            margin: 0;
            padding: 20px;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        h1, h2 {
            color: #00ff00;
            text-shadow: 0 0 10px #00ff00;
        }
        
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }
        
        .panel {
            background: #1a1a1a;
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        }
        
        .event-feed {
            height: 400px;
            overflow-y: auto;
            font-size: 12px;
        }
        
        .event {
            margin: 5px 0;
            padding: 5px;
            background: #0d0d0d;
            border-left: 3px solid #00ff00;
        }
        
        .event.domain_discovered { border-color: #ffff00; }
        .event.business_discovered { border-color: #00ffff; }
        .event.gacha_pull { border-color: #ff00ff; }
        .event.marketplace_transaction { border-color: #ff8800; }
        
        .insights {
            background: #001100;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        
        .stat {
            background: #001100;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 24px;
            color: #00ff00;
            text-shadow: 0 0 5px #00ff00;
        }
        
        .ai-chat {
            height: 300px;
            background: #0d0d0d;
            padding: 10px;
            overflow-y: auto;
            margin: 10px 0;
        }
        
        .ai-input {
            width: 100%;
            background: #1a1a1a;
            color: #00ff00;
            border: 1px solid #00ff00;
            padding: 10px;
            font-family: monospace;
        }
        
        .filters {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin: 10px 0;
        }
        
        .filter {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .reasoning {
            background: #001a00;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            font-size: 11px;
        }
        
        .pattern {
            background: #1a0000;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Live Reasoning Observer</h1>
        <p>Watching Domain Master Dungeon Crawler with AI-powered analysis</p>
        
        <div class="grid">
            <div class="panel">
                <h2>📊 Statistics</h2>
                <div class="stats">
                    <div class="stat">
                        <div>Events</div>
                        <div class="stat-value" id="total-events">0</div>
                    </div>
                    <div class="stat">
                        <div>Observations</div>
                        <div class="stat-value" id="total-observations">0</div>
                    </div>
                    <div class="stat">
                        <div>Patterns</div>
                        <div class="stat-value" id="patterns">0</div>
                    </div>
                    <div class="stat">
                        <div>Insights</div>
                        <div class="stat-value" id="insights">0</div>
                    </div>
                </div>
                
                <h3>🎯 Event Filters</h3>
                <div class="filters">
                    <label class="filter">
                        <input type="checkbox" id="filter-domain" checked> Domain Discoveries
                    </label>
                    <label class="filter">
                        <input type="checkbox" id="filter-business" checked> Business Finds
                    </label>
                    <label class="filter">
                        <input type="checkbox" id="filter-gacha" checked> Gacha Pulls
                    </label>
                    <label class="filter">
                        <input type="checkbox" id="filter-marketplace" checked> Marketplace
                    </label>
                    <label class="filter">
                        <input type="checkbox" id="filter-player" checked> Player Actions
                    </label>
                    <label class="filter">
                        <input type="checkbox" id="filter-system" checked> System Events
                    </label>
                </div>
            </div>
            
            <div class="panel">
                <h2>🤖 AI Observer Chat</h2>
                <div class="ai-chat" id="ai-chat"></div>
                <input type="text" class="ai-input" id="ai-input" placeholder="Ask the AI observer about the game...">
            </div>
        </div>
        
        <div class="grid">
            <div class="panel">
                <h2>📡 Live Event Feed</h2>
                <div class="event-feed" id="event-feed"></div>
            </div>
            
            <div class="panel">
                <h2>💡 AI Insights & Reasoning</h2>
                <div id="insights-panel"></div>
            </div>
        </div>
        
        <div class="panel">
            <h2>🔍 Pattern Analysis</h2>
            <div id="patterns-panel"></div>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.ports.http}/ws');
        let state = {};
        
        ws.onopen = () => {
            console.log('Connected to observer');
            updateStatus('Connected', 'green');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateStatus('Error', 'red');
        };
        
        ws.onclose = () => {
            updateStatus('Disconnected', 'red');
        };
        
        function handleMessage(data) {
            switch (data.type) {
                case 'initial_state':
                    state = data.state;
                    updateUI();
                    break;
                    
                case 'dungeon_event':
                    addEvent(data.event, data.reasoning);
                    break;
                    
                case 'ai_insights':
                    addInsight(data.insights);
                    break;
                    
                case 'ai_response':
                    addChatMessage('AI', data.response);
                    break;
            }
        }
        
        function updateUI() {
            document.getElementById('total-events').textContent = state.stats.total_events;
            document.getElementById('total-observations').textContent = state.stats.total_observations;
            document.getElementById('patterns').textContent = state.stats.patterns_identified;
            document.getElementById('insights').textContent = state.stats.insights_generated;
            
            // Update recent events
            const feed = document.getElementById('event-feed');
            feed.innerHTML = '';
            state.recent_events.forEach(e => {
                addEvent(e.data, null, feed);
            });
            
            // Update insights
            const insightsPanel = document.getElementById('insights-panel');
            insightsPanel.innerHTML = '';
            state.recent_insights.forEach(i => {
                addInsight(i.insights, insightsPanel);
            });
        }
        
        function addEvent(event, reasoning, target) {
            const feed = target || document.getElementById('event-feed');
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event ' + event.type;
            
            const time = new Date().toLocaleTimeString();
            eventDiv.innerHTML = \`<strong>\${time}</strong> - \${event.type}: \${JSON.stringify(event).substring(0, 200)}...\`;
            
            if (reasoning) {
                const reasoningDiv = document.createElement('div');
                reasoningDiv.className = 'reasoning';
                reasoningDiv.textContent = reasoning.analysis.reasoning;
                eventDiv.appendChild(reasoningDiv);
            }
            
            feed.insertBefore(eventDiv, feed.firstChild);
            
            // Keep only recent events
            while (feed.children.length > 100) {
                feed.removeChild(feed.lastChild);
            }
        }
        
        function addInsight(insight, target) {
            const panel = target || document.getElementById('insights-panel');
            const insightDiv = document.createElement('div');
            insightDiv.className = 'insights';
            insightDiv.innerHTML = \`<strong>\${new Date().toLocaleTimeString()}</strong><br>\${insight}\`;
            panel.insertBefore(insightDiv, panel.firstChild);
            
            // Keep only recent insights
            while (panel.children.length > 10) {
                panel.removeChild(panel.lastChild);
            }
        }
        
        function updateStatus(status, color) {
            console.log('Status:', status);
        }
        
        // AI Chat
        const aiInput = document.getElementById('ai-input');
        const aiChat = document.getElementById('ai-chat');
        
        aiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && aiInput.value.trim()) {
                const question = aiInput.value.trim();
                addChatMessage('You', question);
                
                ws.send(JSON.stringify({
                    type: 'query_ai',
                    question: question
                }));
                
                aiInput.value = '';
            }
        });
        
        function addChatMessage(sender, message) {
            const msgDiv = document.createElement('div');
            msgDiv.style.margin = '5px 0';
            msgDiv.innerHTML = \`<strong>\${sender}:</strong> \${message}\`;
            aiChat.appendChild(msgDiv);
            aiChat.scrollTop = aiChat.scrollHeight;
        }
        
        // Filters
        const filterElements = document.querySelectorAll('[id^="filter-"]');
        filterElements.forEach(el => {
            el.addEventListener('change', () => {
                const filters = {
                    domain_discoveries: document.getElementById('filter-domain').checked,
                    business_finds: document.getElementById('filter-business').checked,
                    gacha_pulls: document.getElementById('filter-gacha').checked,
                    marketplace_activity: document.getElementById('filter-marketplace').checked,
                    player_actions: document.getElementById('filter-player').checked,
                    system_events: document.getElementById('filter-system').checked
                };
                
                ws.send(JSON.stringify({
                    type: 'update_filters',
                    filters: filters
                }));
            });
        });
        
        // Request initial analysis
        setTimeout(() => {
            ws.send(JSON.stringify({ type: 'request_analysis' }));
        }, 5000);
    </script>
</body>
</html>`;
    }
}

// Main execution
async function main() {
    const observer = new LiveReasoningObserver();
    
    try {
        await observer.initialize();
        
        console.log('\n🎮 READY TO OBSERVE!');
        console.log('The AI is now watching the Domain Master Dungeon Crawler');
        console.log('and providing real-time reasoning about game events.\n');
        
    } catch (error) {
        console.error('❌ Failed to initialize observer:', error);
        process.exit(1);
    }
}

// Start the observer
main();