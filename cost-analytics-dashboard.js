#!/usr/bin/env node

/**
 * COST ANALYTICS DASHBOARD
 * Real-time cost tracking for all AI models, API usage, and energy consumption
 * Maps computational costs to "ship energy/fuel" metaphor
 */

const express = require('express');
const WebSocket = require('ws');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

class CostAnalyticsDashboard {
    constructor() {
        this.app = express();
        this.port = 42012;
        this.wsPort = 42013;
        
        // Cost tracking
        this.costs = {
            total: 0,
            today: 0,
            thisHour: 0,
            byModel: {},
            byUser: {},
            byService: {}
        };
        
        // Energy metaphor tracking
        this.energy = {
            totalConsumed: 0,
            currentConsumption: 0,
            efficiency: 1.0,
            lightspeedFactor: 1.0,
            fuelRemaining: 1000.0
        };
        
        // Model pricing (per 1K tokens)
        this.modelPricing = {
            'ollama/codellama': { input: 0.0, output: 0.0 }, // Free local
            'ollama/mistral': { input: 0.0, output: 0.0 },
            'ollama/llama2': { input: 0.0, output: 0.0 },
            'anthropic/claude-3-opus': { input: 0.015, output: 0.075 },
            'anthropic/claude-3-sonnet': { input: 0.003, output: 0.015 },
            'openai/gpt-4': { input: 0.03, output: 0.06 },
            'openai/gpt-3.5-turbo': { input: 0.001, output: 0.002 }
        };
        
        // Database pool
        this.dbPool = null;
        
        // WebSocket connections
        this.connections = new Map();
        
        // Update intervals
        this.updateInterval = null;
        this.costHistory = [];
        
        console.log('💰 Cost Analytics Dashboard initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Connect to database
            await this.connectDatabase();
            
            // Setup middleware
            this.setupMiddleware();
            
            // Setup routes
            this.setupRoutes();
            
            // Setup WebSocket
            this.setupWebSocket();
            
            // Load historical data
            await this.loadHistoricalData();
            
            // Start monitoring
            this.startMonitoring();
            
            // Start server
            this.app.listen(this.port, () => {
                console.log(`💰 Cost Analytics Dashboard running on http://localhost:${this.port}`);
                console.log(`📊 Dashboard: http://localhost:${this.port}/cost-dashboard`);
            });
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            process.exit(1);
        }
    }
    
    async connectDatabase() {
        this.dbPool = await mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'economic_engine',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        console.log('📊 Database connected');
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                totalCost: this.costs.total,
                energyRemaining: this.energy.fuelRemaining,
                efficiency: this.energy.efficiency
            });
        });
        
        // Get cost summary
        this.app.get('/api/costs/summary', this.getCostSummary.bind(this));
        
        // Get cost breakdown by model
        this.app.get('/api/costs/by-model', this.getCostsByModel.bind(this));
        
        // Get cost history
        this.app.get('/api/costs/history', this.getCostHistory.bind(this));
        
        // Get energy metrics
        this.app.get('/api/energy/metrics', this.getEnergyMetrics.bind(this));
        
        // Record new cost
        this.app.post('/api/costs/record', this.recordCost.bind(this));
        
        // Get cost projections
        this.app.get('/api/costs/projections', this.getCostProjections.bind(this));
        
        // Export cost data
        this.app.get('/api/costs/export', this.exportCostData.bind(this));
        
        // Cost dashboard
        this.app.get('/cost-dashboard', this.serveCostDashboard.bind(this));
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            const connectionId = Date.now() + Math.random();
            console.log(`💰 Cost client connected: ${connectionId}`);\n            \n            this.connections.set(connectionId, ws);\n            \n            // Send current state\n            ws.send(JSON.stringify({\n                type: 'initial_state',\n                costs: this.costs,\n                energy: this.energy,\n                pricing: this.modelPricing\n            }));\n            \n            ws.on('close', () => {\n                console.log(`💰 Cost client disconnected: ${connectionId}`);\n                this.connections.delete(connectionId);\n            });\n            \n            ws.on('message', (message) => {\n                try {\n                    const data = JSON.parse(message);\n                    this.handleWebSocketMessage(ws, data);\n                } catch (error) {\n                    ws.send(JSON.stringify({ type: 'error', error: error.message }));\n                }\n            });\n        });\n    }\n    \n    async loadHistoricalData() {\n        try {\n            // Load Claude query costs\n            const [claudeQueries] = await this.dbPool.execute(`\n                SELECT \n                    query_type,\n                    response_time_ms,\n                    created_at,\n                    query_text\n                FROM claude_queries\n                WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)\n                ORDER BY created_at DESC\n            `);\n            \n            // Calculate costs from historical data\n            claudeQueries.forEach(query => {\n                const estimatedTokens = Math.max(100, query.query_text.length * 1.5);\n                const cost = this.calculateCostForModel('anthropic/claude-3-sonnet', estimatedTokens, estimatedTokens * 0.5);\n                this.addToCosts('claude', 'anthropic/claude-3-sonnet', cost, estimatedTokens);\n            });\n            \n            // Load character activity for local AI usage\n            const [activities] = await this.dbPool.execute(`\n                SELECT activity_type, created_at\n                FROM character_activity\n                WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)\n            `);\n            \n            // Estimate local AI usage (Ollama)\n            activities.forEach(activity => {\n                const estimatedTokens = 50; // Conservative estimate for local processing\n                const cost = 0; // Ollama is free\n                this.addToCosts('character', 'ollama/mistral', cost, estimatedTokens);\n            });\n            \n            console.log(`📊 Loaded ${claudeQueries.length} Claude queries and ${activities.length} activities`);\n            \n        } catch (error) {\n            console.error('Error loading historical data:', error);\n        }\n    }\n    \n    startMonitoring() {\n        // Update costs every 5 seconds\n        this.updateInterval = setInterval(() => {\n            this.updateRealTimeMetrics();\n            this.broadcastUpdate();\n        }, 5000);\n        \n        // Save cost snapshot every minute\n        setInterval(() => {\n            this.saveCostSnapshot();\n        }, 60000);\n        \n        // Monitor API endpoints for new queries\n        this.monitorAPIEndpoints();\n        \n        console.log('📊 Cost monitoring started');\n    }\n    \n    updateRealTimeMetrics() {\n        // Update energy metrics based on current usage\n        const recentActivity = this.costHistory.slice(-10);\n        const avgCost = recentActivity.reduce((sum, h) => sum + h.cost, 0) / Math.max(1, recentActivity.length);\n        \n        // Energy consumption (metaphorical mapping)\n        this.energy.currentConsumption = avgCost * 100; // $0.01 = 1kW\n        this.energy.totalConsumed += this.energy.currentConsumption / 720; // Per 5-second interval\n        \n        // Efficiency based on cost vs. output\n        this.energy.efficiency = Math.max(0.1, Math.min(2.0, 1.0 / (avgCost + 0.001)));\n        \n        // Light speed factor (response time efficiency)\n        const avgResponseTime = recentActivity.reduce((sum, h) => sum + (h.responseTime || 500), 0) / Math.max(1, recentActivity.length);\n        this.energy.lightspeedFactor = Math.max(0.1, Math.min(3.0, 1000 / avgResponseTime));\n        \n        // Fuel remaining (budget metaphor)\n        this.energy.fuelRemaining = Math.max(0, 1000 - this.costs.total * 100);\n    }\n    \n    async monitorAPIEndpoints() {\n        // Monitor Claude API endpoint for new queries\n        setInterval(async () => {\n            try {\n                const response = await fetch('http://localhost:42006/health');\n                if (response.ok) {\n                    // Check for new queries in database\n                    await this.checkForNewQueries();\n                }\n            } catch (error) {\n                // Claude API not available\n            }\n        }, 10000);\n    }\n    \n    async checkForNewQueries() {\n        try {\n            const [newQueries] = await this.dbPool.execute(`\n                SELECT *\n                FROM claude_queries\n                WHERE created_at > DATE_SUB(NOW(), INTERVAL 10 SECOND)\n            `);\n            \n            newQueries.forEach(query => {\n                const estimatedInputTokens = Math.max(50, query.query_text.length * 1.2);\n                const estimatedOutputTokens = query.result_count * 20;\n                const model = 'anthropic/claude-3-sonnet'; // Default model\n                \n                const cost = this.calculateCostForModel(model, estimatedInputTokens, estimatedOutputTokens);\n                \n                this.recordCostEvent({\n                    service: 'claude-api',\n                    model,\n                    inputTokens: estimatedInputTokens,\n                    outputTokens: estimatedOutputTokens,\n                    cost,\n                    responseTime: query.response_time_ms,\n                    queryType: query.query_type\n                });\n            });\n            \n        } catch (error) {\n            console.error('Error checking for new queries:', error);\n        }\n    }\n    \n    calculateCostForModel(model, inputTokens, outputTokens) {\n        const pricing = this.modelPricing[model];\n        if (!pricing) return 0;\n        \n        const inputCost = (inputTokens / 1000) * pricing.input;\n        const outputCost = (outputTokens / 1000) * pricing.output;\n        \n        return inputCost + outputCost;\n    }\n    \n    recordCostEvent(event) {\n        const cost = event.cost || 0;\n        const tokens = (event.inputTokens || 0) + (event.outputTokens || 0);\n        \n        // Add to totals\n        this.costs.total += cost;\n        this.costs.today += cost;\n        this.costs.thisHour += cost;\n        \n        // Add to breakdowns\n        if (!this.costs.byModel[event.model]) {\n            this.costs.byModel[event.model] = { cost: 0, tokens: 0, requests: 0 };\n        }\n        this.costs.byModel[event.model].cost += cost;\n        this.costs.byModel[event.model].tokens += tokens;\n        this.costs.byModel[event.model].requests += 1;\n        \n        if (!this.costs.byService[event.service]) {\n            this.costs.byService[event.service] = { cost: 0, tokens: 0, requests: 0 };\n        }\n        this.costs.byService[event.service].cost += cost;\n        this.costs.byService[event.service].tokens += tokens;\n        this.costs.byService[event.service].requests += 1;\n        \n        // Add to history\n        this.costHistory.push({\n            timestamp: Date.now(),\n            cost,\n            tokens,\n            model: event.model,\n            service: event.service,\n            responseTime: event.responseTime\n        });\n        \n        // Keep only last 1000 entries\n        if (this.costHistory.length > 1000) {\n            this.costHistory = this.costHistory.slice(-1000);\n        }\n        \n        console.log(`💰 Cost recorded: $${cost.toFixed(4)} for ${event.model} (${tokens} tokens)`);\n    }\n    \n    addToCosts(service, model, cost, tokens) {\n        this.recordCostEvent({\n            service,\n            model,\n            cost,\n            inputTokens: tokens * 0.7,\n            outputTokens: tokens * 0.3\n        });\n    }\n    \n    saveCostSnapshot() {\n        const snapshot = {\n            timestamp: new Date().toISOString(),\n            costs: { ...this.costs },\n            energy: { ...this.energy },\n            recentHistory: this.costHistory.slice(-60) // Last hour\n        };\n        \n        const filename = `cost-snapshot-${Date.now()}.json`;\n        const filepath = path.join('./verification-output', filename);\n        \n        try {\n            fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));\n        } catch (error) {\n            console.error('Error saving cost snapshot:', error);\n        }\n    }\n    \n    broadcastUpdate() {\n        const update = {\n            type: 'cost_update',\n            costs: this.costs,\n            energy: this.energy,\n            recentHistory: this.costHistory.slice(-20),\n            timestamp: Date.now()\n        };\n        \n        this.connections.forEach(ws => {\n            if (ws.readyState === WebSocket.OPEN) {\n                ws.send(JSON.stringify(update));\n            }\n        });\n    }\n    \n    // API Endpoints\n    \n    getCostSummary(req, res) {\n        res.json({\n            total: this.costs.total,\n            today: this.costs.today,\n            thisHour: this.costs.thisHour,\n            avgCostPerQuery: this.costHistory.length > 0 \n                ? this.costs.total / this.costHistory.length \n                : 0,\n            totalQueries: this.costHistory.length,\n            efficiency: this.energy.efficiency,\n            fuelRemaining: this.energy.fuelRemaining\n        });\n    }\n    \n    getCostsByModel(req, res) {\n        const modelStats = Object.entries(this.costs.byModel).map(([model, stats]) => ({\n            model,\n            ...stats,\n            avgCostPerRequest: stats.requests > 0 ? stats.cost / stats.requests : 0,\n            avgTokensPerRequest: stats.requests > 0 ? stats.tokens / stats.requests : 0,\n            costPerToken: stats.tokens > 0 ? stats.cost / stats.tokens : 0\n        }));\n        \n        res.json({\n            models: modelStats.sort((a, b) => b.cost - a.cost),\n            totalModels: modelStats.length\n        });\n    }\n    \n    getCostHistory(req, res) {\n        const hours = parseInt(req.query.hours) || 24;\n        const cutoff = Date.now() - (hours * 60 * 60 * 1000);\n        \n        const filteredHistory = this.costHistory.filter(h => h.timestamp > cutoff);\n        \n        // Group by hour for visualization\n        const hourlyData = {};\n        filteredHistory.forEach(entry => {\n            const hour = new Date(entry.timestamp).toISOString().substring(0, 13);\n            if (!hourlyData[hour]) {\n                hourlyData[hour] = { cost: 0, tokens: 0, requests: 0 };\n            }\n            hourlyData[hour].cost += entry.cost;\n            hourlyData[hour].tokens += entry.tokens;\n            hourlyData[hour].requests += 1;\n        });\n        \n        res.json({\n            raw: filteredHistory,\n            hourly: Object.entries(hourlyData).map(([hour, data]) => ({\n                hour,\n                ...data\n            })).sort((a, b) => a.hour.localeCompare(b.hour))\n        });\n    }\n    \n    getEnergyMetrics(req, res) {\n        res.json({\n            energy: this.energy,\n            shipStatus: {\n                fuelLevel: (this.energy.fuelRemaining / 1000) * 100,\n                engineEfficiency: this.energy.efficiency * 100,\n                warpFactor: this.energy.lightspeedFactor,\n                powerConsumption: this.energy.currentConsumption,\n                totalDistance: this.energy.totalConsumed // \"light years traveled\"\n            },\n            recommendations: this.getEnergyRecommendations()\n        });\n    }\n    \n    getEnergyRecommendations() {\n        const recommendations = [];\n        \n        if (this.energy.efficiency < 0.5) {\n            recommendations.push('Consider using Ollama models for simple queries to improve efficiency');\n        }\n        \n        if (this.energy.fuelRemaining < 100) {\n            recommendations.push('Fuel running low - consider optimizing query frequency');\n        }\n        \n        if (this.energy.lightspeedFactor < 0.5) {\n            recommendations.push('Response times high - check system performance');\n        }\n        \n        const recentCost = this.costHistory.slice(-10).reduce((sum, h) => sum + h.cost, 0);\n        if (recentCost > 1.0) {\n            recommendations.push('High recent spending - consider cost optimization');\n        }\n        \n        return recommendations;\n    }\n    \n    async recordCost(req, res) {\n        try {\n            const { service, model, inputTokens, outputTokens, responseTime, metadata } = req.body;\n            \n            const cost = this.calculateCostForModel(model, inputTokens, outputTokens);\n            \n            this.recordCostEvent({\n                service,\n                model,\n                inputTokens,\n                outputTokens,\n                cost,\n                responseTime,\n                metadata\n            });\n            \n            res.json({\n                success: true,\n                cost,\n                totalCost: this.costs.total,\n                message: 'Cost recorded successfully'\n            });\n            \n        } catch (error) {\n            res.status(500).json({ error: error.message });\n        }\n    }\n    \n    getCostProjections(req, res) {\n        const days = parseInt(req.query.days) || 30;\n        \n        // Calculate daily average from recent history\n        const recentDays = Math.min(7, this.costHistory.length / 24); // Assume 24 entries per day\n        const dailyAverage = this.costs.today / Math.max(1, recentDays);\n        \n        const projections = {\n            daily: dailyAverage,\n            weekly: dailyAverage * 7,\n            monthly: dailyAverage * 30,\n            projected: dailyAverage * days,\n            budgetStatus: {\n                dailyBudget: 10.0, // Example budget\n                weeklyBudget: 50.0,\n                monthlyBudget: 200.0,\n                isOverBudget: dailyAverage > 10.0\n            }\n        };\n        \n        res.json(projections);\n    }\n    \n    exportCostData(req, res) {\n        const format = req.query.format || 'json';\n        const data = {\n            exportTime: new Date().toISOString(),\n            summary: {\n                totalCost: this.costs.total,\n                totalTokens: Object.values(this.costs.byModel).reduce((sum, m) => sum + m.tokens, 0),\n                totalRequests: Object.values(this.costs.byModel).reduce((sum, m) => sum + m.requests, 0)\n            },\n            breakdown: {\n                byModel: this.costs.byModel,\n                byService: this.costs.byService\n            },\n            history: this.costHistory,\n            energy: this.energy,\n            pricing: this.modelPricing\n        };\n        \n        if (format === 'csv') {\n            const csv = this.convertToCSV(data.history);\n            res.setHeader('Content-Type', 'text/csv');\n            res.setHeader('Content-Disposition', `attachment; filename=cost-data-${Date.now()}.csv`);\n            res.send(csv);\n        } else {\n            res.setHeader('Content-Type', 'application/json');\n            res.setHeader('Content-Disposition', `attachment; filename=cost-data-${Date.now()}.json`);\n            res.send(JSON.stringify(data, null, 2));\n        }\n    }\n    \n    convertToCSV(history) {\n        const headers = ['timestamp', 'cost', 'tokens', 'model', 'service', 'responseTime'];\n        const rows = history.map(entry => [\n            new Date(entry.timestamp).toISOString(),\n            entry.cost,\n            entry.tokens,\n            entry.model,\n            entry.service,\n            entry.responseTime || 0\n        ]);\n        \n        return [headers, ...rows].map(row => row.join(',')).join('\\n');\n    }\n    \n    serveCostDashboard(req, res) {\n        const html = `<!DOCTYPE html>\n<html>\n<head>\n    <title>Cost Analytics Dashboard</title>\n    <style>\n        body { font-family: monospace; background: #0a0a0f; color: #00ff88; margin: 0; padding: 20px; }\n        .header { text-align: center; margin-bottom: 30px; }\n        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }\n        .panel { background: rgba(0,255,136,0.1); border: 1px solid #00ff88; border-radius: 8px; padding: 20px; }\n        .metric { font-size: 24px; font-weight: bold; margin: 10px 0; }\n        .chart { height: 200px; background: rgba(0,0,0,0.3); margin: 15px 0; padding: 10px; }\n        .ws-status { position: fixed; top: 10px; right: 10px; padding: 10px; background: rgba(0,255,136,0.2); border-radius: 5px; }\n    </style>\n</head>\n<body>\n    <div class=\"ws-status\" id=\"wsStatus\">Connecting...</div>\n    \n    <div class=\"header\">\n        <h1>💰 Cost Analytics Dashboard</h1>\n        <p>Real-time AI usage and energy consumption tracking</p>\n    </div>\n    \n    <div class=\"grid\">\n        <div class=\"panel\">\n            <h3>💸 Cost Summary</h3>\n            <div class=\"metric\" id=\"totalCost\">$0.00</div>\n            <div>Today: $<span id=\"todayCost\">0.00</span></div>\n            <div>This Hour: $<span id=\"hourCost\">0.00</span></div>\n        </div>\n        \n        <div class=\"panel\">\n            <h3>⚡ Ship Energy</h3>\n            <div class=\"metric\" id=\"fuelLevel\">100%</div>\n            <div>Efficiency: <span id=\"efficiency\">100%</span></div>\n            <div>Warp Factor: <span id=\"warpFactor\">1.0x</span></div>\n        </div>\n        \n        <div class=\"panel\">\n            <h3>🤖 Model Usage</h3>\n            <div id=\"modelBreakdown\">Loading...</div>\n        </div>\n        \n        <div class=\"panel\">\n            <h3>📊 Live Metrics</h3>\n            <div class=\"chart\" id=\"costChart\">Cost chart will appear here</div>\n        </div>\n    </div>\n    \n    <script>\n        let ws = null;\n        let costs = { total: 0, today: 0, thisHour: 0, byModel: {} };\n        let energy = { fuelRemaining: 1000, efficiency: 1.0, lightspeedFactor: 1.0 };\n        \n        function connectWebSocket() {\n            ws = new WebSocket('ws://localhost:42013');\n            \n            ws.onopen = () => {\n                document.getElementById('wsStatus').textContent = 'Connected';\n                document.getElementById('wsStatus').style.background = 'rgba(0,255,136,0.3)';\n            };\n            \n            ws.onmessage = (event) => {\n                const data = JSON.parse(event.data);\n                handleWebSocketMessage(data);\n            };\n            \n            ws.onclose = () => {\n                document.getElementById('wsStatus').textContent = 'Disconnected';\n                document.getElementById('wsStatus').style.background = 'rgba(255,68,68,0.3)';\n                setTimeout(connectWebSocket, 3000);\n            };\n        }\n        \n        function handleWebSocketMessage(data) {\n            switch (data.type) {\n                case 'initial_state':\n                case 'cost_update':\n                    costs = data.costs;\n                    energy = data.energy;\n                    updateDashboard();\n                    break;\n            }\n        }\n        \n        function updateDashboard() {\n            // Update cost summary\n            document.getElementById('totalCost').textContent = '$' + costs.total.toFixed(4);\n            document.getElementById('todayCost').textContent = costs.today.toFixed(4);\n            document.getElementById('hourCost').textContent = costs.thisHour.toFixed(4);\n            \n            // Update energy metrics\n            const fuelPercent = (energy.fuelRemaining / 1000) * 100;\n            document.getElementById('fuelLevel').textContent = fuelPercent.toFixed(1) + '%';\n            document.getElementById('efficiency').textContent = (energy.efficiency * 100).toFixed(1) + '%';\n            document.getElementById('warpFactor').textContent = energy.lightspeedFactor.toFixed(1) + 'x';\n            \n            // Update model breakdown\n            const modelBreakdown = document.getElementById('modelBreakdown');\n            const modelEntries = Object.entries(costs.byModel || {});\n            if (modelEntries.length > 0) {\n                modelBreakdown.innerHTML = modelEntries\n                    .sort(([,a], [,b]) => b.cost - a.cost)\n                    .slice(0, 5)\n                    .map(([model, stats]) => \n                        \\`<div>\\${model.split('/')[1] || model}: $\\${stats.cost.toFixed(4)} (\\${stats.requests} req)</div>\\`\n                    ).join('');\n            } else {\n                modelBreakdown.innerHTML = 'No usage data yet';\n            }\n        }\n        \n        // Initialize\n        connectWebSocket();\n    </script>\n</body>\n</html>`;\n        \n        res.send(html);\n    }\n    \n    handleWebSocketMessage(ws, data) {\n        switch (data.type) {\n            case 'get_summary':\n                ws.send(JSON.stringify({\n                    type: 'summary',\n                    costs: this.costs,\n                    energy: this.energy\n                }));\n                break;\n                \n            case 'record_cost':\n                this.recordCostEvent(data.event);\n                break;\n        }\n    }\n    \n    async shutdown() {\n        console.log('💰 Cost Analytics Dashboard shutting down...');\n        \n        if (this.updateInterval) {\n            clearInterval(this.updateInterval);\n        }\n        \n        if (this.wss) {\n            this.wss.close();\n        }\n        \n        if (this.dbPool) {\n            await this.dbPool.end();\n        }\n    }\n}\n\n// Start the service\nconst costAnalytics = new CostAnalyticsDashboard();\n\n// Handle shutdown\nprocess.on('SIGINT', async () => {\n    await costAnalytics.shutdown();\n    process.exit(0);\n});\n\nmodule.exports = CostAnalyticsDashboard;