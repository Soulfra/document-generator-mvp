#!/usr/bin/env node

/**
 * 🌐 UNIFIED GATEWAY
 * 
 * Single entry point that solves the "different content on different ports" problem
 * Routes users to appropriate services while maintaining consistent experience
 * 
 * THE SOLUTION:
 * - One interface (port 8888) that connects everything
 * - Smart routing based on user intent
 * - Consistent visual design across all services
 * - Real-time status of all connected systems
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const WebSocket = require('ws');

class UnifiedGateway {
    constructor() {
        this.app = express();
        this.port = 9000; // Master gateway port (changed to avoid Docker conflict)
        
        // Service registry - all discovered services
        this.services = {
            orchestration: {
                name: 'Unified Orchestration System',
                url: 'http://localhost:20000',
                port: 20000,
                status: 'unknown',
                purpose: 'Document processing, learning challenges',
                icon: '🧠'
            },
            bridge: {
                name: 'Forum-Orchestration Bridge',
                url: 'http://localhost:22200', 
                port: 22200,
                status: 'unknown',
                purpose: 'Natural tag queries, forum integration',
                icon: '🌉'
            },
            business: {
                name: 'Business Showcase Platform',
                url: 'http://localhost:18000',
                port: 18000,
                status: 'unknown', 
                purpose: 'Business catalog, showcases',
                icon: '🏢'
            },
            mystery: {
                name: 'Service on 7777',
                url: 'http://localhost:7777',
                port: 7777,
                status: 'unknown',
                purpose: 'Unknown service',
                icon: '❓'
            }
        };
        
        this.setupServer();
        this.startHealthMonitoring();
        
        console.log('🌐 Unified Gateway initializing...');
    }
    
    setupServer() {
        this.app.use(express.json());
        this.app.use(express.static(__dirname + '/gateway-assets'));
        
        // CORS for all services
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            if (req.method === 'OPTIONS') return res.sendStatus(200);
            next();
        });
        
        // ===========================================
        // UNIFIED INTERFACE - The main entry point
        // ===========================================
        this.app.get('/', (req, res) => {
            res.send(this.generateUnifiedInterface());
        });
        
        // ===========================================  
        // SMART ROUTING - Route based on intent
        // ===========================================
        
        // Natural tag queries -> Bridge
        this.app.post('/api/query', async (req, res) => {
            const { query } = req.body;
            
            // Detect if it's a natural tag query
            if (query && query.match(/^@\w+\.\w+\.\w+\s+/)) {
                return this.routeToService('bridge', '/api/tag-query', req, res);
            }
            
            // Regular queries -> Orchestration System
            return this.routeToService('orchestration', '/api/documents', req, res);
        });
        
        // Search across all systems
        this.app.get('/api/search', async (req, res) => {
            // Try bridge search first (most comprehensive)
            return this.routeToService('bridge', '/api/search', req, res);
        });
        
        // ===========================================
        // PROXY ROUTES - Direct access to services
        // ===========================================
        
        // Orchestration System
        this.app.use('/orchestration', createProxyMiddleware({
            target: this.services.orchestration.url,
            changeOrigin: true,
            pathRewrite: { '^/orchestration': '' }
        }));
        
        // Forum-Orchestration Bridge  
        this.app.use('/bridge', createProxyMiddleware({
            target: this.services.bridge.url,
            changeOrigin: true,
            pathRewrite: { '^/bridge': '' }
        }));
        
        // Business Platform
        this.app.use('/business', createProxyMiddleware({
            target: this.services.business.url,
            changeOrigin: true,
            pathRewrite: { '^/business': '' }
        }));
        
        // ===========================================
        // GATEWAY STATUS & HEALTH
        // ===========================================
        
        this.app.get('/api/gateway/status', (req, res) => {
            res.json({
                gateway: 'operational',
                port: this.port,
                services: this.services,
                routes: [
                    'POST /api/query - Smart query routing',
                    'GET /api/search - Unified search',
                    '/orchestration/* - Direct access to orchestration system',
                    '/bridge/* - Direct access to forum bridge',
                    '/business/* - Direct access to business platform'
                ]
            });
        });
        
        console.log('🌐 Gateway routes configured');
    }
    
    async routeToService(serviceName, endpoint, req, res) {
        try {
            const service = this.services[serviceName];
            if (!service) {
                return res.status(404).json({ error: `Service ${serviceName} not found` });
            }
            
            const url = `${service.url}${endpoint}`;
            const options = {
                method: req.method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (req.method !== 'GET' && req.body) {
                options.body = JSON.stringify(req.body);
            }
            
            // Add query parameters for GET requests
            const queryString = new URLSearchParams(req.query).toString();
            const finalUrl = queryString ? `${url}?${queryString}` : url;
            
            const response = await fetch(finalUrl, options);
            const data = await response.json();
            
            // Add gateway metadata
            data._gateway = {
                routedTo: serviceName,
                service: service.name,
                port: service.port
            };
            
            res.json(data);
            
        } catch (error) {
            res.status(500).json({
                error: error.message,
                gateway: 'routing_failed',
                service: serviceName
            });
        }
    }
    
    async startHealthMonitoring() {
        // Check all services every 30 seconds
        const checkHealth = async () => {
            for (const [key, service] of Object.entries(this.services)) {
                try {
                    const response = await fetch(`${service.url}/api/health`, { 
                        timeout: 5000 
                    });
                    service.status = response.ok ? 'online' : 'error';
                } catch (error) {
                    service.status = 'offline';
                }
            }
        };
        
        // Initial check
        await checkHealth();
        
        // Periodic checks
        setInterval(checkHealth, 30000);
        
        console.log('📊 Health monitoring started');
    }
    
    generateUnifiedInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🌐 Document Generator - Unified Gateway</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 50px;
        }
        
        .header h1 {
            font-size: 3.5em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .subtitle {
            font-size: 1.3em;
            opacity: 0.9;
            margin-bottom: 30px;
        }
        
        .unified-query {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .query-input {
            width: 100%;
            min-height: 120px;
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 15px;
            padding: 20px;
            color: white;
            font-size: 16px;
            font-family: inherit;
            resize: vertical;
            outline: none;
            transition: all 0.3s ease;
            margin-bottom: 20px;
        }
        
        .query-input:focus {
            border-color: rgba(255,255,255,0.5);
            box-shadow: 0 0 30px rgba(255,255,255,0.2);
        }
        
        .query-input::placeholder {
            color: rgba(255,255,255,0.7);
        }
        
        .query-buttons {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .query-button {
            background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1));
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 15px 30px;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1em;
            font-weight: 500;
        }
        
        .query-button:hover {
            background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.2));
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .service-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .service-card:hover {
            background: rgba(255,255,255,0.2);
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        
        .service-icon {
            font-size: 4em;
            margin-bottom: 20px;
        }
        
        .service-name {
            font-size: 1.4em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .service-purpose {
            opacity: 0.8;
            margin-bottom: 15px;
        }
        
        .service-status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
        }
        
        .status-online { background: #4CAF50; }
        .status-offline { background: #f44336; }
        .status-unknown { background: #ff9800; }
        
        .examples {
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 30px;
            margin-top: 40px;
        }
        
        .example-query {
            background: rgba(0,0,0,0.2);
            padding: 15px;
            border-radius: 10px;
            margin: 10px 0;
            font-family: 'Monaco', monospace;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .example-query:hover {
            background: rgba(0,0,0,0.3);
        }
        
        .results {
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 30px;
            margin-top: 20px;
            display: none;
        }
        
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
        }
        
        @media (max-width: 768px) {
            .query-buttons {
                flex-direction: column;
            }
            .services-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Document Generator</h1>
            <div class="subtitle">
                Unified Gateway - One interface for everything<br>
                <em>No more confusion about which port does what!</em>
            </div>
        </div>
        
        <div class="unified-query">
            <h3 style="margin-bottom: 20px;">🚀 Smart Query Interface</h3>
            <textarea 
                class="query-input" 
                id="queryInput"
                placeholder="Enter any query - I'll route it to the right service!

Examples:
• @cal.fintech.expert analyze this trading algorithm
• Build a social media app with real-time messaging  
• How do I create a secure authentication system?
• Design a mobile-first e-commerce platform

Try natural language or technical specifications - the gateway will figure out where to send it!"
            ></textarea>
            
            <div class="query-buttons">
                <button class="query-button" onclick="executeQuery()">🔍 Smart Route Query</button>
                <button class="query-button" onclick="searchAll()">🔎 Search Everything</button>
                <button class="query-button" onclick="showExamples()">💡 Show Examples</button>
                <button class="query-button" onclick="checkStatus()">📊 System Status</button>
            </div>
        </div>
        
        <div class="services-grid">
            ${Object.entries(this.services).map(([key, service]) => `
                <div class="service-card" onclick="openService('${key}')">
                    <div class="service-icon">${service.icon}</div>
                    <div class="service-name">${service.name}</div>
                    <div class="service-purpose">${service.purpose}</div>
                    <div class="service-status status-${service.status}">
                        <span class="status-indicator status-${service.status}"></span>
                        ${service.status}
                    </div>
                    <div style="margin-top: 10px; font-size: 0.9em; opacity: 0.7;">
                        Port ${service.port}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="examples">
            <h3>📝 Example Queries</h3>
            <div class="example-query" onclick="useExample(this)">
                @cal.fintech.expert analyze cryptocurrency trading patterns
            </div>
            <div class="example-query" onclick="useExample(this)">
                @arty.gaming.designer create character selection interface
            </div>
            <div class="example-query" onclick="useExample(this)">
                Build a React app with user authentication and database
            </div>
            <div class="example-query" onclick="useExample(this)">
                How to implement real-time chat with WebSockets?
            </div>
            <div class="example-query" onclick="useExample(this)">
                Design a REST API for a task management system
            </div>
        </div>
        
        <div id="results" class="results">
            <h3>📊 Results</h3>
            <div id="resultsContent"></div>
        </div>
    </div>
    
    <script>
        function useExample(element) {
            document.getElementById('queryInput').value = element.textContent.trim();
        }
        
        async function executeQuery() {
            const query = document.getElementById('queryInput').value.trim();
            if (!query) {
                alert('Please enter a query');
                return;
            }
            
            showResults('Processing query...', 'info');
            
            try {
                const response = await fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                
                const result = await response.json();
                displayQueryResult(result);
                
            } catch (error) {
                showResults('Error: ' + error.message, 'error');
            }
        }
        
        async function searchAll() {
            const query = document.getElementById('queryInput').value.trim();
            if (!query) {
                alert('Please enter a search query');
                return;
            }
            
            showResults('Searching across all services...', 'info');
            
            try {
                const response = await fetch('/api/search?q=' + encodeURIComponent(query));
                const result = await response.json();
                displaySearchResult(result);
                
            } catch (error) {
                showResults('Search error: ' + error.message, 'error');
            }
        }
        
        async function checkStatus() {
            showResults('Checking system status...', 'info');
            
            try {
                const response = await fetch('/api/gateway/status');
                const result = await response.json();
                displayStatusResult(result);
                
            } catch (error) {
                showResults('Status error: ' + error.message, 'error');
            }
        }
        
        function showExamples() {
            document.querySelector('.examples').scrollIntoView({ 
                behavior: 'smooth' 
            });
        }
        
        function openService(serviceKey) {
            const routes = {
                orchestration: '/orchestration',
                bridge: '/bridge', 
                business: '/business',
                mystery: '/mystery'
            };
            
            if (routes[serviceKey]) {
                window.open(routes[serviceKey], '_blank');
            } else {
                alert('Direct access to ' + serviceKey + ' not available yet');
            }
        }
        
        function showResults(content, type = 'info') {
            const resultsDiv = document.getElementById('results');
            const contentDiv = document.getElementById('resultsContent');
            
            contentDiv.innerHTML = '<div class="result-' + type + '">' + content + '</div>';
            resultsDiv.style.display = 'block';
            resultsDiv.scrollIntoView({ behavior: 'smooth' });
        }
        
        function displayQueryResult(result) {
            let html = '<div style="background: rgba(0,255,0,0.1); padding: 20px; border-radius: 10px;">' +
                '<h4>✅ Query Routed Successfully</h4>' +
                '<div style="margin: 15px 0;">' +
                '<strong>Service:</strong> ' + (result._gateway?.service || 'Unknown') + ' (Port ' + (result._gateway?.port || 'Unknown') + ')' +
                '</div>';
            
            if (result.routing) {
                html += '<div style="margin: 15px 0;">' +
                    '<strong>Type:</strong> ' + result.routing.type + '<br>';
                if (result.routing.character) {
                    html += '<strong>Character:</strong> ' + result.routing.character + ' (' + result.routing.domain + '.' + result.routing.role + ')';
                }
                html += '</div>';
            }
            
            if (result.orchestration) {
                html += '<div style="margin: 15px 0;">' +
                    '<strong>Document ID:</strong> ' + result.orchestration.documentId + '<br>' +
                    '<strong>Status:</strong> ' + result.orchestration.status +
                    '</div>';
            }
            
            html += '<div style="margin-top: 20px; font-size: 0.9em; opacity: 0.8;">' +
                'Message: ' + result.message +
                '</div>' +
                '</div>';
            
            showResults(html);
        }
        
        function displaySearchResult(result) {
            let html = '<div>' +
                '<h4>🔍 Search Results (' + result.total + ' found)</h4>' +
                '<div style="margin: 10px 0; opacity: 0.8;">' +
                'Query: "' + result.query + '" | Search time: ' + result.searchTime + 'ms';
            
            if (result._gateway) {
                html += ' | Via: ' + result._gateway.service;
            }
            html += '</div>';
            
            if (result.total === 0) {
                html += '<div style="background: rgba(255,255,0,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">' +
                    'No results found. Try processing some documents first to build the search index!' +
                    '</div>';
            } else {
                html += '<div style="margin-top: 20px;">';
                if (result.results) {
                    result.results.forEach(function(item) {
                        html += '<div style="background: rgba(255,255,255,0.1); padding: 15px; margin: 10px 0; border-radius: 8px;">' +
                            '<div style="font-weight: bold;">' + item.title + '</div>' +
                            '<div style="margin: 5px 0; opacity: 0.8;">' + item.snippet + '</div>' +
                            '<div style="font-size: 0.8em; opacity: 0.6;">Type: ' + item.type + ' | Character: ' + (item.character || 'N/A') + '</div>' +
                            '</div>';
                    });
                }
                html += '</div>';
            }
            
            html += '</div>';
            
            showResults(html);
        }
        
        function displayStatusResult(result) {
            let html = '<div>' +
                '<h4>📊 System Status</h4>' +
                '<div style="margin: 20px 0;">' +
                '<strong>Gateway:</strong> ' + result.gateway + ' (Port ' + result.port + ')' +
                '</div>' +
                '<div style="margin: 20px 0;">' +
                '<strong>Connected Services:</strong>';
            
            if (result.services) {
                Object.entries(result.services).forEach(function([key, service]) {
                    let statusColor = '#ff9800'; // default
                    if (service.status === 'online') statusColor = '#4CAF50';
                    else if (service.status === 'offline') statusColor = '#f44336';
                    
                    html += '<div style="background: rgba(255,255,255,0.1); padding: 10px; margin: 5px 0; border-radius: 5px;">' +
                        '<span style="color: ' + statusColor + '">●</span> ' +
                        service.name + ' (' + service.status + ')' +
                        '</div>';
                });
            }
            
            html += '</div>' +
                '<div style="margin: 20px 0;">' +
                '<strong>Available Routes:</strong>';
            
            if (result.routes) {
                result.routes.forEach(function(route) {
                    html += '<div style="font-family: Monaco, monospace; margin: 5px 0;">' + route + '</div>';
                });
            }
            
            html += '</div>' +
                '</div>';
            
            showResults(html);
        }
        
        // Auto-refresh service status
        setInterval(async () => {
            try {
                const response = await fetch('/api/gateway/status');
                const result = await response.json();
                
                // Update service status indicators
                Object.entries(result.services).forEach(([key, service]) => {
                    const cards = document.querySelectorAll('.service-card');
                    cards.forEach(card => {
                        if (card.textContent.includes(service.name)) {
                            const statusEl = card.querySelector('.service-status');
                            const indicatorEl = card.querySelector('.status-indicator');
                            
                            statusEl.className = 'service-status status-' + service.status;
                            statusEl.innerHTML = '<span class="status-indicator status-' + service.status + '"></span>' + service.status;
                        }
                    });
                });
                
            } catch (error) {
                console.error('Status update failed:', error);
            }
        }, 30000);
    </script>
</body>
</html>`;
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log('\n🌐 UNIFIED GATEWAY STARTED!');
            console.log('===============================================');
            console.log('📍 Master Interface: http://localhost:' + this.port);
            console.log('');
            console.log('🎯 PROBLEM SOLVED:');
            console.log('   ❌ Before: Different content on different ports');
            console.log('   ✅ After: One gateway that routes everything');
            console.log('');
            console.log('🔗 CONNECTED SERVICES:');
            Object.entries(this.services).forEach(([key, service]) => {
                console.log('   ' + service.icon + ' ' + service.name + ' (' + service.port + ')');
            });
            console.log('');
            console.log('🚀 Access everything through ONE interface!');
        });
    }
}

// Start the unified gateway
const gateway = new UnifiedGateway();
gateway.start();

module.exports = UnifiedGateway;