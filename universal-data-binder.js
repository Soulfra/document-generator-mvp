#!/usr/bin/env node

/**
 * 🔗 UNIVERSAL DATA BINDER
 * 
 * Implements the "mobius strip" pattern - data flows continuously with a half-twist
 * Binds real estate data → PDF reports → market analysis → house search → Google MMM
 * 
 * Like folding a paper plane with a twist - data transforms as it flows
 * Creates bidirectional bindings between all services
 */

const EventEmitter = require('events');
const express = require('express');
const WebSocket = require('ws');
const axios = require('axios');
const cron = require('node-cron');
const { Transform } = require('stream');

class UniversalDataBinder extends EventEmitter {
    constructor() {
        super();
        this.app = express();
        this.port = 3009;
        this.bindings = new Map();
        this.dataFlows = new Map();
        this.transformers = new Map();
        
        // Mobius strip configuration - each twist adds value
        this.mobiusConfig = {
            twists: [
                { name: 'raw-data', transform: 'normalize' },
                { name: 'structured-data', transform: 'enrich' },
                { name: 'analyzed-data', transform: 'aggregate' },
                { name: 'visual-data', transform: 'render' },
                { name: 'actionable-data', transform: 'decide' }
            ],
            halfTwist: true, // The mobius magic
            continuous: true  // Never-ending flow
        };
        
        // Service endpoints we're binding
        this.services = {
            realEstateScraper: 'http://localhost:3008',
            infinityRouter: 'http://localhost:8000',
            orchestrator: 'http://localhost:3006',
            unifiedPipeline: 'http://localhost:8000',
            googleMMM: 'http://localhost:3011', // Future service
            houseSearch: 'http://localhost:3012'  // Future service
        };
        
        // Data transformation registry
        this.registerTransformers();
        
        // Binding patterns
        this.bindingPatterns = {
            'pdf-to-search': {
                source: 'realEstateScraper',
                target: 'houseSearch',
                transform: 'extractPropertyData',
                bidirectional: false
            },
            'market-to-mmm': {
                source: 'realEstateScraper',
                target: 'googleMMM',
                transform: 'marketToAttribution',
                bidirectional: true
            },
            'infinity-to-all': {
                source: 'infinityRouter',
                target: '*',
                transform: 'routeThroughDimensions',
                bidirectional: true
            }
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.initializeBindings();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Binding identification middleware
        this.app.use((req, res, next) => {
            res.setHeader('X-Service', 'universal-data-binder');
            res.setHeader('X-Pattern', 'mobius-strip');
            res.setHeader('X-Bindings-Active', this.bindings.size);
            next();
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'universal-data-binder',
                bindings: this.bindings.size,
                activeFlows: this.dataFlows.size,
                pattern: 'mobius-strip',
                uptime: process.uptime()
            });
        });
        
        // Create new binding
        this.app.post('/bind', async (req, res) => {
            try {
                const { source, target, transform, bidirectional = false } = req.body;
                const bindingId = await this.createBinding(source, target, transform, bidirectional);
                
                res.json({
                    success: true,
                    bindingId,
                    message: `Binding created: ${source} → ${target}`
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Flow data through bindings
        this.app.post('/flow', async (req, res) => {
            try {
                const { bindingId, data } = req.body;
                const result = await this.flowData(bindingId, data);
                
                res.json({
                    success: true,
                    result,
                    transformations: result.transformationHistory
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Get all bindings
        this.app.get('/bindings', (req, res) => {
            const bindingsList = Array.from(this.bindings.entries()).map(([id, binding]) => ({
                id,
                ...binding,
                status: binding.active ? 'active' : 'inactive'
            }));
            
            res.json({
                bindings: bindingsList,
                total: bindingsList.length
            });
        });
        
        // Mobius twist endpoint - transforms data through the pattern
        this.app.post('/mobius/twist', async (req, res) => {
            try {
                const { data, twists = 1 } = req.body;
                const twistedData = await this.mobiusTwist(data, twists);
                
                res.json({
                    success: true,
                    original: data,
                    twisted: twistedData,
                    twists: twists
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Dashboard
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });
    }
    
    registerTransformers() {
        // Raw data normalization
        this.transformers.set('normalize', (data) => {
            if (typeof data === 'string') {
                try {
                    return JSON.parse(data);
                } catch {
                    return { raw: data };
                }
            }
            return data;
        });
        
        // Enrich with metadata
        this.transformers.set('enrich', (data) => {
            return {
                ...data,
                enriched: true,
                timestamp: new Date().toISOString(),
                source: 'universal-binder'
            };
        });
        
        // Aggregate multiple data points
        this.transformers.set('aggregate', (data) => {
            if (Array.isArray(data)) {
                return {
                    items: data,
                    count: data.length,
                    aggregated: true
                };
            }
            return { items: [data], count: 1, aggregated: true };
        });
        
        // Extract property data from PDFs
        this.transformers.set('extractPropertyData', (pdfData) => {
            const { structuredData } = pdfData;
            return {
                properties: [{
                    price: structuredData.medianPrice,
                    daysOnMarket: structuredData.daysOnMarket,
                    inventory: structuredData.inventory,
                    county: structuredData.county,
                    reportDate: structuredData.reportDate
                }],
                extractedFrom: 'pdf-report'
            };
        });
        
        // Convert market data to MMM attribution format
        this.transformers.set('marketToAttribution', (marketData) => {
            return {
                channel: 'real-estate-market',
                metrics: {
                    impressions: marketData.newListings,
                    conversions: marketData.closedSales,
                    revenue: marketData.medianPrice * marketData.closedSales
                },
                attribution: 'last-touch',
                timestamp: marketData.reportDate
            };
        });
        
        // Route through infinity dimensions
        this.transformers.set('routeThroughDimensions', async (data) => {
            try {
                const response = await axios.post(`${this.services.infinityRouter}/api/infinity-action`, {
                    action: 'route-data',
                    payload: data
                });
                return response.data;
            } catch (error) {
                console.error('Infinity routing failed:', error.message);
                return data; // Fallback to original
            }
        });
    }
    
    async createBinding(source, target, transform, bidirectional = false) {
        const bindingId = `bind_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const binding = {
            source,
            target,
            transform,
            bidirectional,
            active: true,
            created: new Date().toISOString(),
            flowCount: 0
        };
        
        this.bindings.set(bindingId, binding);
        
        // Create reverse binding if bidirectional
        if (bidirectional) {
            const reverseId = `${bindingId}_reverse`;
            this.bindings.set(reverseId, {
                ...binding,
                source: target,
                target: source,
                transform: `reverse_${transform}`
            });
        }
        
        this.emit('binding-created', { bindingId, binding });
        console.log(`🔗 Binding created: ${source} → ${target} (${transform})`);
        
        return bindingId;
    }
    
    async flowData(bindingId, data) {
        const binding = this.bindings.get(bindingId);
        if (!binding) {
            throw new Error(`Binding ${bindingId} not found`);
        }
        
        const flowId = `flow_${Date.now()}`;
        const flow = {
            bindingId,
            data,
            transformationHistory: [],
            startTime: Date.now()
        };
        
        this.dataFlows.set(flowId, flow);
        
        try {
            // Apply transformation
            let transformedData = data;
            if (binding.transform && this.transformers.has(binding.transform)) {
                const transformer = this.transformers.get(binding.transform);
                transformedData = await transformer(data);
                flow.transformationHistory.push({
                    transform: binding.transform,
                    timestamp: Date.now()
                });
            }
            
            // Send to target service
            if (binding.target !== '*') {
                const targetUrl = this.services[binding.target];
                if (targetUrl) {
                    try {
                        const response = await axios.post(`${targetUrl}/api/receive-data`, {
                            source: binding.source,
                            data: transformedData,
                            flowId
                        });
                        flow.targetResponse = response.data;
                    } catch (error) {
                        console.error(`Failed to send to ${binding.target}:`, error.message);
                    }
                }
            }
            
            // Update binding stats
            binding.flowCount++;
            binding.lastFlow = new Date().toISOString();
            
            flow.endTime = Date.now();
            flow.duration = flow.endTime - flow.startTime;
            flow.result = transformedData;
            
            this.emit('data-flowed', { flowId, flow });
            
            return flow;
        } catch (error) {
            flow.error = error.message;
            throw error;
        }
    }
    
    async mobiusTwist(data, twists = 1) {
        let twistedData = data;
        const transformationHistory = [];
        
        for (let i = 0; i < twists; i++) {
            for (const twist of this.mobiusConfig.twists) {
                if (this.transformers.has(twist.transform)) {
                    const transformer = this.transformers.get(twist.transform);
                    twistedData = await transformer(twistedData);
                    transformationHistory.push({
                        twist: twist.name,
                        transform: twist.transform,
                        iteration: i + 1
                    });
                }
            }
            
            // Apply half-twist on odd iterations (mobius property)
            if (this.mobiusConfig.halfTwist && i % 2 === 1) {
                twistedData = this.applyHalfTwist(twistedData);
            }
        }
        
        return {
            data: twistedData,
            transformations: transformationHistory,
            totalTwists: twists
        };
    }
    
    applyHalfTwist(data) {
        // Invert or reverse certain properties (the "twist")
        if (Array.isArray(data)) {
            return data.reverse();
        } else if (typeof data === 'object') {
            // Flip keys and values where possible
            const twisted = {};
            Object.entries(data).forEach(([key, value]) => {
                if (typeof value === 'string' || typeof value === 'number') {
                    twisted[value] = key;
                } else {
                    twisted[key] = value;
                }
            });
            return twisted;
        }
        return data;
    }
    
    async initializeBindings() {
        // Create default bindings based on patterns
        for (const [name, pattern] of Object.entries(this.bindingPatterns)) {
            await this.createBinding(
                pattern.source,
                pattern.target,
                pattern.transform,
                pattern.bidirectional
            );
        }
        
        console.log(`✅ Initialized ${this.bindings.size} default bindings`);
    }
    
    getDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Universal Data Binder - Mobius Strip Pattern</title>
    <style>
        body {
            font-family: -apple-system, monospace;
            background: #0a0a0a;
            color: #0f0;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px;
            border: 2px solid #0f0;
            margin-bottom: 30px;
            position: relative;
        }
        .mobius {
            width: 100px;
            height: 50px;
            margin: 20px auto;
            position: relative;
            animation: twist 10s infinite linear;
        }
        @keyframes twist {
            0% { transform: rotateY(0deg) rotateZ(0deg); }
            100% { transform: rotateY(360deg) rotateZ(180deg); }
        }
        .mobius::before,
        .mobius::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border: 2px solid #0f0;
            border-radius: 50%;
        }
        .mobius::after {
            transform: rotateX(90deg);
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .panel {
            background: #111;
            border: 1px solid #0f0;
            padding: 20px;
            border-radius: 10px;
        }
        .binding {
            background: #1a1a1a;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .flow {
            color: #0ff;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
        button {
            background: #0f0;
            color: #000;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-weight: bold;
            border-radius: 5px;
            margin: 5px;
        }
        button:hover {
            background: #0a0;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 20px 0;
        }
        .stat {
            background: #1a1a1a;
            padding: 15px;
            text-align: center;
            border-radius: 5px;
        }
        .stat-value {
            font-size: 24px;
            color: #0ff;
        }
        #flows {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #333;
            padding: 10px;
            margin-top: 10px;
        }
        .transform-viz {
            display: flex;
            align-items: center;
            margin: 10px 0;
        }
        .transform-step {
            background: #1a1a1a;
            padding: 5px 10px;
            margin: 0 5px;
            border-radius: 3px;
        }
        .arrow {
            color: #0f0;
            margin: 0 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔗 UNIVERSAL DATA BINDER</h1>
        <div class="mobius"></div>
        <p>Mobius Strip Pattern - Data flows continuously with a half-twist</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div>Active Bindings</div>
            <div class="stat-value" id="bindingCount">0</div>
        </div>
        <div class="stat">
            <div>Data Flows</div>
            <div class="stat-value" id="flowCount">0</div>
        </div>
        <div class="stat">
            <div>Transformations</div>
            <div class="stat-value" id="transformCount">0</div>
        </div>
        <div class="stat">
            <div>Services Connected</div>
            <div class="stat-value" id="serviceCount">0</div>
        </div>
    </div>
    
    <div class="grid">
        <div class="panel">
            <h3>🔗 Create Binding</h3>
            <div>
                <select id="sourceService">
                    <option value="realEstateScraper">Real Estate Scraper</option>
                    <option value="infinityRouter">Infinity Router</option>
                    <option value="orchestrator">Orchestrator</option>
                    <option value="unifiedPipeline">Unified Pipeline</option>
                </select>
                <span class="arrow">→</span>
                <select id="targetService">
                    <option value="houseSearch">House Search</option>
                    <option value="googleMMM">Google MMM</option>
                    <option value="*">All Services</option>
                </select>
            </div>
            <div style="margin-top: 10px;">
                <select id="transform">
                    <option value="normalize">Normalize</option>
                    <option value="enrich">Enrich</option>
                    <option value="aggregate">Aggregate</option>
                    <option value="extractPropertyData">Extract Property Data</option>
                    <option value="marketToAttribution">Market to Attribution</option>
                </select>
                <label>
                    <input type="checkbox" id="bidirectional">
                    Bidirectional
                </label>
            </div>
            <button onclick="createBinding()">Create Binding</button>
        </div>
        
        <div class="panel">
            <h3>🌀 Mobius Twist Test</h3>
            <textarea id="testData" rows="4" style="width: 100%; background: #1a1a1a; color: #0f0; border: 1px solid #333;">
{
  "property": "123 Main St",
  "price": 500000,
  "sqft": 2000
}</textarea>
            <div style="margin-top: 10px;">
                <label>Twists: <input type="number" id="twists" value="1" min="1" max="5" style="width: 50px;"></label>
                <button onclick="testMobius()">Apply Mobius Twist</button>
            </div>
            <div id="twistResult" style="margin-top: 10px;"></div>
        </div>
    </div>
    
    <div class="panel">
        <h3>📊 Active Bindings</h3>
        <div id="bindings"></div>
    </div>
    
    <div class="panel">
        <h3>💫 Data Flows</h3>
        <div id="flows"></div>
    </div>
    
    <script>
        let ws;
        
        async function loadBindings() {
            const response = await fetch('/bindings');
            const data = await response.json();
            
            const bindingsDiv = document.getElementById('bindings');
            bindingsDiv.innerHTML = data.bindings.map(binding => \`
                <div class="binding">
                    <span>\${binding.source} → \${binding.target}</span>
                    <span style="color: #888;">Transform: \${binding.transform}</span>
                    <span class="flow">Flows: \${binding.flowCount || 0}</span>
                </div>
            \`).join('');
            
            document.getElementById('bindingCount').textContent = data.total;
        }
        
        async function createBinding() {
            const source = document.getElementById('sourceService').value;
            const target = document.getElementById('targetService').value;
            const transform = document.getElementById('transform').value;
            const bidirectional = document.getElementById('bidirectional').checked;
            
            const response = await fetch('/bind', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source, target, transform, bidirectional })
            });
            
            const result = await response.json();
            if (result.success) {
                loadBindings();
                alert('Binding created: ' + result.bindingId);
            }
        }
        
        async function testMobius() {
            const data = JSON.parse(document.getElementById('testData').value);
            const twists = parseInt(document.getElementById('twists').value);
            
            const response = await fetch('/mobius/twist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data, twists })
            });
            
            const result = await response.json();
            document.getElementById('twistResult').innerHTML = \`
                <div class="transform-viz">
                    <div class="transform-step">Original</div>
                    \${result.twisted.transformations.map(t => \`
                        <span class="arrow">→</span>
                        <div class="transform-step">\${t.transform}</div>
                    \`).join('')}
                </div>
                <pre style="color: #0ff;">\${JSON.stringify(result.twisted.data, null, 2)}</pre>
            \`;
        }
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:3009/ws');
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'flow-update') {
                    updateFlowDisplay(data);
                }
            };
        }
        
        function updateFlowDisplay(flowData) {
            const flowsDiv = document.getElementById('flows');
            const flowHtml = \`
                <div class="flow" style="margin: 5px 0;">
                    <strong>\${new Date().toLocaleTimeString()}</strong>: 
                    \${flowData.source} → \${flowData.target} 
                    <span style="color: #888;">(\${flowData.duration}ms)</span>
                </div>
            \`;
            flowsDiv.insertAdjacentHTML('afterbegin', flowHtml);
            
            // Keep only last 20 flows
            while (flowsDiv.children.length > 20) {
                flowsDiv.removeChild(flowsDiv.lastChild);
            }
            
            // Update flow count
            const currentCount = parseInt(document.getElementById('flowCount').textContent);
            document.getElementById('flowCount').textContent = currentCount + 1;
        }
        
        // Initialize
        loadBindings();
        connectWebSocket();
        
        // Auto-refresh
        setInterval(loadBindings, 5000);
    </script>
</body>
</html>
        `;
    }
    
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.port, () => {
                console.log(`🔗 Universal Data Binder running on port ${this.port}`);
                console.log(`🌀 Mobius Strip pattern active`);
                console.log(`📊 Dashboard: http://localhost:${this.port}`);
                console.log(`🔄 Default bindings: ${this.bindings.size}`);
                resolve();
            });
        });
    }
    
    async shutdown() {
        console.log('🛑 Shutting down Universal Data Binder...');
        
        // Clear all bindings
        this.bindings.clear();
        this.dataFlows.clear();
        
        process.exit(0);
    }
}

// Auto-start if run directly
if (require.main === module) {
    const binder = new UniversalDataBinder();
    
    binder.start().catch(error => {
        console.error('Failed to start Universal Data Binder:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => binder.shutdown());
    process.on('SIGTERM', () => binder.shutdown());
}

module.exports = UniversalDataBinder;