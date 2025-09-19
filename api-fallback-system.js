#!/usr/bin/env node

// 🔄🌐📡 API FALLBACK SYSTEM
// ===========================
// Provides alternative data sources when direct scraping fails
// Multiple API endpoints with intelligent fallback and caching

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const crypto = require('crypto');

class APIFallbackSystem {
    constructor() {
        this.port = 4700;
        this.name = 'API Fallback System';
        this.version = '1.0.0';
        
        // Government API endpoints and configurations
        this.apiEndpoints = {
            'grants-gov': {
                name: 'Grants.gov API',
                baseUrl: 'https://www.grants.gov/grantsws/rest/opportunities',
                keyRequired: false,
                rateLimit: 100, // requests per hour
                methods: ['search', 'detail', 'filter'],
                params: {
                    search: { keyword: 'string', oppId: 'string', cfda: 'string' },
                    detail: { oppId: 'required' },
                    filter: { fundingInstrument: 'string', eligibility: 'string' }
                },
                priority: 1,
                reliability: 0.9
            },
            'usaspending': {
                name: 'USASpending.gov API',
                baseUrl: 'https://api.usaspending.gov/api/v2',
                keyRequired: false,
                rateLimit: 1000, // requests per hour
                methods: ['awards', 'search', 'autocomplete'],
                params: {
                    awards: { award_id: 'string', recipient_name: 'string' },
                    search: { filters: 'object', page: 'number', limit: 'number' },
                    autocomplete: { target: 'string', value: 'string' }
                },
                priority: 2,
                reliability: 0.85
            },
            'sam-gov': {
                name: 'SAM.gov API',
                baseUrl: 'https://api.sam.gov/opportunities/v2',
                keyRequired: true,
                keyVar: 'SAM_GOV_API_KEY',
                rateLimit: 1000, // requests per day
                methods: ['search', 'get'],
                params: {
                    search: { keyword: 'string', postedFrom: 'date', postedTo: 'date' },
                    get: { opportunityId: 'required' }
                },
                priority: 1,
                reliability: 0.95
            },
            'contracts-gov': {
                name: 'FedBizOpps/Contracts API',
                baseUrl: 'https://api.fbo.gov/api',
                keyRequired: true,
                keyVar: 'FBO_API_KEY',
                rateLimit: 500, // requests per hour
                methods: ['search', 'detail'],
                params: {
                    search: { q: 'string', posted_date: 'date', agency: 'string' },
                    detail: { notice_id: 'required' }
                },
                priority: 2,
                reliability: 0.8
            },
            'nsf-awards': {
                name: 'NSF Awards API',
                baseUrl: 'https://www.research.gov/common/webapi/awardapisearch-v1',
                keyRequired: false,
                rateLimit: 2000, // requests per day
                methods: ['search'],
                params: {
                    search: { keyword: 'string', agency: 'string', startDate: 'date', endDate: 'date' }
                },
                priority: 3,
                reliability: 0.9
            },
            'nih-reporter': {
                name: 'NIH RePORTER API',
                baseUrl: 'https://api.reporter.nih.gov/v2',
                keyRequired: false,
                rateLimit: 5000, // requests per hour
                methods: ['projects', 'publications'],
                params: {
                    projects: { criteria: 'object', offset: 'number', limit: 'number' },
                    publications: { pmids: 'array', offset: 'number', limit: 'number' }
                },
                priority: 3,
                reliability: 0.85
            }
        };
        
        // Fallback strategies when APIs fail
        this.fallbackStrategies = [
            {
                name: 'primary-apis',
                description: 'Try primary government APIs first',
                endpoints: ['grants-gov', 'sam-gov', 'usaspending'],
                timeout: 10000,
                retries: 2
            },
            {
                name: 'secondary-apis',
                description: 'Fall back to secondary APIs',
                endpoints: ['contracts-gov', 'nsf-awards', 'nih-reporter'],
                timeout: 15000,
                retries: 3
            },
            {
                name: 'cached-data',
                description: 'Use cached data from recent successful calls',
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                confidence: 0.7
            },
            {
                name: 'scraper-fallback',
                description: 'Fall back to direct scraping as last resort',
                endpoints: ['html-wrapper', 'cjis-swarm'],
                timeout: 30000,
                retries: 1
            }
        ];
        
        // Rate limiting tracking
        this.rateLimits = new Map();
        this.apiHealth = new Map();
        
        // Response cache with TTL
        this.responseCache = new Map();
        this.cacheConfig = {
            defaultTTL: 3600000, // 1 hour
            maxSize: 10000,
            priorities: {
                'grants': 1800000,    // 30 minutes for grants
                'contracts': 3600000, // 1 hour for contracts
                'awards': 7200000     // 2 hours for awards
            }
        };
        
        // Data normalization mappings
        this.dataMappings = {
            grants: {
                title: ['title', 'opportunityTitle', 'fundingOpportunityTitle', 'name'],
                description: ['description', 'synopsis', 'fundingOpportunityDescription'],
                deadline: ['closeDate', 'applicationDeadline', 'dueDate', 'submissionDeadline'],
                amount: ['awardFloor', 'awardCeiling', 'totalFunding', 'estimatedTotalProgramFunding'],
                agency: ['agencyName', 'department', 'sponsor', 'fundingAgency'],
                eligibility: ['eligibleApplicants', 'eligibility', 'whoCanApply'],
                category: ['categoryOfFundingActivity', 'cfda', 'fundingInstrumentType'],
                opportunityId: ['opportunityId', 'oppId', 'fundingOpportunityNumber', 'id']
            },
            contracts: {
                title: ['title', 'subject', 'solicitationnumber', 'name'],
                description: ['description', 'synopsis', 'descriptionOfWork'],
                deadline: ['responseDate', 'dueDate', 'submissionDeadline'],
                value: ['contractValue', 'estimatedValue', 'dollarAmount'],
                agency: ['agency', 'department', 'contractingAgency'],
                setAside: ['setAside', 'typeOfSetAside'],
                naicsCode: ['naicsCode', 'primaryNaics'],
                solicitationId: ['solicitationnumber', 'opportunityId', 'noticeId']
            }
        };
        
        // Integration with other systems
        this.systemIntegrations = {
            htmlWrapper: 'http://localhost:4500',
            cjisSwarm: 'http://localhost:4400',
            grantValidator: 'http://localhost:4600',
            grantScraper: 'http://localhost:4300'
        };
        
        // Statistics tracking
        this.statistics = {
            totalRequests: 0,
            apiCalls: 0,
            cacheHits: 0,
            fallbacksUsed: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            apiHealthScores: new Map()
        };
        
        this.setupServer();
        this.initializeRateLimits();
        this.startHealthMonitoring();
    }
    
    setupServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Content-Type', 'application/json');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            if (req.url === '/') {
                this.handleDashboard(req, res);
            } else if (req.url === '/api/search') {
                this.handleSearchRequest(req, res);
            } else if (req.url === '/api/fallback') {
                this.handleFallbackRequest(req, res);
            } else if (req.url === '/api/health') {
                this.handleHealthCheck(req, res);
            } else if (req.url === '/api/statistics') {
                this.handleStatistics(req, res);
            } else if (req.url === '/api/test-api') {
                this.handleTestAPI(req, res);
            } else if (req.url === '/api/cache-status') {
                this.handleCacheStatus(req, res);
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });
        
        server.listen(this.port, () => {
            console.log(`🔄 ${this.name} running on http://localhost:${this.port}`);
        });
    }
    
    handleDashboard(req, res) {
        const dashboard = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔄 API Fallback System</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #1a0a2e, #16213e, #0f3460);
            color: #64b5f6;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1600px;
            margin: 0 auto;
            background: rgba(0,0,0,0.8);
            border: 2px solid #64b5f6;
            border-radius: 10px;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #64b5f6;
            text-shadow: 0 0 10px #64b5f6;
            margin: 0;
        }
        
        .section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #64b5f6;
            border-radius: 5px;
            background: rgba(100,181,246,0.1);
        }
        
        .api-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .api-card {
            background: rgba(0,0,0,0.5);
            border: 1px solid #64b5f6;
            border-radius: 8px;
            padding: 15px;
        }
        
        .api-card.healthy { border-color: #4caf50; }
        .api-card.degraded { border-color: #ff9800; }
        .api-card.down { border-color: #f44336; }
        
        .statistics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: rgba(100,181,246,0.2);
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            border: 1px solid #64b5f6;
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #64b5f6;
            text-shadow: 0 0 5px #64b5f6;
        }
        
        .test-panel {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        
        .test-input, .test-output {
            padding: 15px;
            border: 1px solid #64b5f6;
            border-radius: 5px;
            background: rgba(0,0,0,0.5);
        }
        
        input, textarea, select {
            width: 100%;
            padding: 10px;
            background: rgba(0,0,0,0.8);
            border: 1px solid #64b5f6;
            color: #64b5f6;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            margin: 5px 0;
        }
        
        button {
            background: linear-gradient(45deg, #64b5f6, #2196f3);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
        }
        
        button:hover {
            background: linear-gradient(45deg, #2196f3, #64b5f6);
            box-shadow: 0 0 10px #64b5f6;
        }
        
        .health-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .health-indicator.healthy { background: #4caf50; }
        .health-indicator.degraded { background: #ff9800; }
        .health-indicator.down { background: #f44336; }
        
        .rate-limit-bar {
            height: 4px;
            background: rgba(100,181,246,0.3);
            border-radius: 2px;
            overflow: hidden;
            margin: 5px 0;
        }
        
        .rate-limit-progress {
            height: 100%;
            background: linear-gradient(90deg, #4caf50, #ff9800, #f44336);
            transition: width 0.3s ease;
        }
        
        .fallback-chain {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
            padding: 10px;
            background: rgba(100,181,246,0.1);
            border-radius: 5px;
        }
        
        .fallback-step {
            padding: 5px 10px;
            background: rgba(0,0,0,0.5);
            border: 1px solid #64b5f6;
            border-radius: 3px;
            font-size: 12px;
        }
        
        .fallback-arrow {
            color: #64b5f6;
            font-weight: bold;
        }
        
        .cache-visualization {
            height: 200px;
            overflow-y: auto;
            background: rgba(0,0,0,0.9);
            padding: 10px;
            border: 1px solid #64b5f6;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄🌐📡 API FALLBACK SYSTEM</h1>
            <p>Provides alternative data sources when direct scraping fails</p>
        </div>
        
        <div class="section">
            <h3>📊 System Statistics</h3>
            <div class="statistics" id="statistics">
                <div class="stat-card">
                    <div class="stat-value" id="totalRequests">0</div>
                    <div>Total Requests</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="apiCalls">0</div>
                    <div>API Calls</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="cacheHits">0</div>
                    <div>Cache Hits</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="fallbacksUsed">0</div>
                    <div>Fallbacks Used</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="failedRequests">0</div>
                    <div>Failed Requests</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="averageResponseTime">0</div>
                    <div>Avg Response (ms)</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>🔗 Government API Endpoints</h3>
            <div class="api-grid" id="apiGrid">
                <!-- API cards will be populated by JavaScript -->
            </div>
        </div>
        
        <div class="section">
            <h3>🔄 Fallback Strategies</h3>
            <div class="fallback-chain">
                <span>1. Primary APIs</span>
                <span class="fallback-arrow">→</span>
                <span>2. Secondary APIs</span>
                <span class="fallback-arrow">→</span>
                <span>3. Cached Data</span>
                <span class="fallback-arrow">→</span>
                <span>4. Direct Scraping</span>
            </div>
            <div class="statistics">
                <div class="stat-card">
                    <div>grants.gov + sam.gov</div>
                    <div style="color: #4caf50;">Primary Strategy</div>
                </div>
                <div class="stat-card">
                    <div>nsf + nih + contracts</div>
                    <div style="color: #ff9800;">Secondary Strategy</div>
                </div>
                <div class="stat-card">
                    <div>Recent Cache (24h)</div>
                    <div style="color: #2196f3;">Cached Strategy</div>
                </div>
                <div class="stat-card">
                    <div>HTML + CJIS Scraper</div>
                    <div style="color: #f44336;">Last Resort</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>🧪 API Testing & Search</h3>
            <div class="test-panel">
                <div class="test-input">
                    <h4>Search Parameters</h4>
                    <input type="text" id="searchKeyword" placeholder="Search keyword (e.g., 'artificial intelligence')">
                    <select id="searchType">
                        <option value="grants">Grants</option>
                        <option value="contracts">Contracts</option>
                        <option value="awards">Awards</option>
                    </select>
                    <input type="date" id="dateFrom" placeholder="From date">
                    <input type="date" id="dateTo" placeholder="To date">
                    <br><br>
                    <button onclick="testAPISearch()">🔍 Search APIs</button>
                    <button onclick="testFallbackChain()">🔄 Test Fallback Chain</button>
                    <button onclick="testSpecificAPI()">🎯 Test Specific API</button>
                </div>
                <div class="test-output">
                    <h4>API Response</h4>
                    <textarea id="apiResults" rows="12" readonly placeholder="API results will appear here..."></textarea>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>💾 Cache Status & Management</h3>
            <div class="statistics">
                <div class="stat-card">
                    <div class="stat-value" id="cacheSize">0</div>
                    <div>Cached Items</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="cacheHitRate">0%</div>
                    <div>Hit Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="cacheMemory">0 MB</div>
                    <div>Memory Usage</div>
                </div>
            </div>
            <div class="cache-visualization" id="cacheVisualization">
                <div>📄 Cache entries will appear here...</div>
            </div>
        </div>
        
        <div class="section">
            <h3>🔗 System Integrations</h3>
            <div class="statistics">
                <div class="stat-card">
                    <div>HTML Wrapper</div>
                    <div id="htmlWrapperStatus">🟡 Checking...</div>
                </div>
                <div class="stat-card">
                    <div>CJIS Swarm</div>
                    <div id="cjisSwarmStatus">🟡 Checking...</div>
                </div>
                <div class="stat-card">
                    <div>Grant Validator</div>
                    <div id="grantValidatorStatus">🟡 Checking...</div>
                </div>
                <div class="stat-card">
                    <div>Grant Scraper</div>
                    <div id="grantScraperStatus">🟡 Checking...</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let apiEndpoints = {};
        
        // Update statistics
        function updateStatistics() {
            fetch('/api/statistics')
                .then(response => response.json())
                .then(stats => {
                    document.getElementById('totalRequests').textContent = stats.totalRequests;
                    document.getElementById('apiCalls').textContent = stats.apiCalls;
                    document.getElementById('cacheHits').textContent = stats.cacheHits;
                    document.getElementById('fallbacksUsed').textContent = stats.fallbacksUsed;
                    document.getElementById('failedRequests').textContent = stats.failedRequests;
                    document.getElementById('averageResponseTime').textContent = 
                        Math.round(stats.averageResponseTime);
                })
                .catch(error => console.error('Statistics update failed:', error));
        }
        
        function updateAPIHealth() {
            fetch('/api/health')
                .then(response => response.json())
                .then(health => {
                    apiEndpoints = health.apiEndpoints || {};
                    renderAPIGrid();
                })
                .catch(error => console.error('API health update failed:', error));
        }
        
        function renderAPIGrid() {
            const grid = document.getElementById('apiGrid');
            grid.innerHTML = '';
            
            Object.entries(apiEndpoints).forEach(([key, api]) => {
                const card = document.createElement('div');
                card.className = \`api-card \${api.health || 'unknown'}\`;
                
                const rateLimitPercent = api.rateLimitUsed ? 
                    (api.rateLimitUsed / api.rateLimit * 100) : 0;
                
                card.innerHTML = \`
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <span class="health-indicator \${api.health || 'down'}"></span>
                        <strong>\${api.name}</strong>
                    </div>
                    <div style="font-size: 0.9em; margin-bottom: 8px;">
                        Base URL: \${api.baseUrl}
                    </div>
                    <div style="font-size: 0.8em; margin-bottom: 8px;">
                        Priority: \${api.priority} | Reliability: \${(api.reliability * 100).toFixed(1)}%
                    </div>
                    <div style="font-size: 0.8em; margin-bottom: 5px;">
                        Rate Limit: \${api.rateLimitUsed || 0}/\${api.rateLimit}
                    </div>
                    <div class="rate-limit-bar">
                        <div class="rate-limit-progress" style="width: \${rateLimitPercent}%"></div>
                    </div>
                    <div style="font-size: 0.7em; margin-top: 8px; color: #888;">
                        Methods: \${api.methods ? api.methods.join(', ') : 'N/A'}
                    </div>
                \`;
                
                grid.appendChild(card);
            });
        }
        
        function updateCacheStatus() {
            fetch('/api/cache-status')
                .then(response => response.json())
                .then(cache => {
                    document.getElementById('cacheSize').textContent = cache.size;
                    document.getElementById('cacheHitRate').textContent = 
                        cache.totalRequests > 0 ? 
                        Math.round(cache.hits / cache.totalRequests * 100) + '%' : '0%';
                    document.getElementById('cacheMemory').textContent = 
                        (cache.memoryUsage / 1024 / 1024).toFixed(2) + ' MB';
                    
                    // Update cache visualization
                    const viz = document.getElementById('cacheVisualization');
                    viz.innerHTML = cache.entries.slice(0, 20).map(entry => 
                        \`<div>🔑 \${entry.key.substring(0, 40)}... | ⏰ \${entry.age}ms ago | 📊 \${entry.hits} hits</div>\`
                    ).join('');
                })
                .catch(error => console.error('Cache status update failed:', error));
        }
        
        function testAPISearch() {
            const keyword = document.getElementById('searchKeyword').value;
            const searchType = document.getElementById('searchType').value;
            const dateFrom = document.getElementById('dateFrom').value;
            const dateTo = document.getElementById('dateTo').value;
            const resultsArea = document.getElementById('apiResults');
            
            if (!keyword.trim()) {
                resultsArea.value = '❌ Please enter a search keyword';
                return;
            }
            
            resultsArea.value = '🔄 Searching APIs...';
            
            fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyword,
                    type: searchType,
                    dateFrom,
                    dateTo
                })
            })
            .then(response => response.json())
            .then(result => {
                resultsArea.value = JSON.stringify(result, null, 2);
                updateStatistics();
                updateCacheStatus();
            })
            .catch(error => {
                resultsArea.value = \`❌ Search failed: \${error.message}\`;
            });
        }
        
        function testFallbackChain() {
            const resultsArea = document.getElementById('apiResults');
            resultsArea.value = '🔄 Testing fallback chain...';
            
            fetch('/api/fallback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: 'test fallback chain',
                    forceFailure: true // Force primary APIs to fail for testing
                })
            })
            .then(response => response.json())
            .then(result => {
                resultsArea.value = JSON.stringify(result, null, 2);
                updateStatistics();
            })
            .catch(error => {
                resultsArea.value = \`❌ Fallback test failed: \${error.message}\`;
            });
        }
        
        function testSpecificAPI() {
            const keyword = document.getElementById('searchKeyword').value;
            const resultsArea = document.getElementById('apiResults');
            
            if (!keyword.trim()) {
                keyword = 'test query';
            }
            
            resultsArea.value = '🎯 Testing specific API endpoint...';
            
            fetch('/api/test-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: 'grants-gov',
                    query: keyword
                })
            })
            .then(response => response.json())
            .then(result => {
                resultsArea.value = JSON.stringify(result, null, 2);
                updateStatistics();
                updateAPIHealth();
            })
            .catch(error => {
                resultsArea.value = \`❌ API test failed: \${error.message}\`;
            });
        }
        
        function checkSystemIntegrations() {
            const integrations = [
                { id: 'htmlWrapperStatus', url: 'http://localhost:4500/api/health' },
                { id: 'cjisSwarmStatus', url: 'http://localhost:4400/api/health' },
                { id: 'grantValidatorStatus', url: 'http://localhost:4600/api/health' },
                { id: 'grantScraperStatus', url: 'http://localhost:4300/api/health' }
            ];
            
            integrations.forEach(integration => {
                fetch(integration.url)
                    .then(response => response.json())
                    .then(() => {
                        document.getElementById(integration.id).innerHTML = '🟢 Online';
                    })
                    .catch(() => {
                        document.getElementById(integration.id).innerHTML = '🔴 Offline';
                    });
            });
        }
        
        // Update everything periodically
        setInterval(() => {
            updateStatistics();
            updateAPIHealth();
            updateCacheStatus();
        }, 5000);
        
        setInterval(checkSystemIntegrations, 30000);
        
        // Initial updates
        updateStatistics();
        updateAPIHealth();
        updateCacheStatus();
        checkSystemIntegrations();
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboard);
    }
    
    async handleSearchRequest(req, res) {
        try {
            const startTime = Date.now();
            const body = await this.getRequestBody(req);
            const { keyword, type = 'grants', dateFrom, dateTo, priority = 'medium' } = JSON.parse(body);
            
            this.statistics.totalRequests++;
            
            const searchResult = await this.performSmartSearch(keyword, type, {
                dateFrom,
                dateTo,
                priority
            });
            
            this.statistics.averageResponseTime = 
                (this.statistics.averageResponseTime + (Date.now() - startTime)) / 2;
            
            res.writeHead(200);
            res.end(JSON.stringify(searchResult));
            
        } catch (error) {
            this.statistics.failedRequests++;
            res.writeHead(500);
            res.end(JSON.stringify({ 
                success: false, 
                error: error.message,
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    async handleFallbackRequest(req, res) {
        try {
            const body = await this.getRequestBody(req);
            const { query, forceFailure = false } = JSON.parse(body);
            
            const fallbackResult = await this.executeFallbackChain(query, { forceFailure });
            
            res.writeHead(200);
            res.end(JSON.stringify(fallbackResult));
            
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ 
                success: false, 
                error: error.message 
            }));
        }
    }
    
    async handleTestAPI(req, res) {
        try {
            const body = await this.getRequestBody(req);
            const { endpoint, query } = JSON.parse(body);
            
            const testResult = await this.testAPIEndpoint(endpoint, query);
            
            res.writeHead(200);
            res.end(JSON.stringify(testResult));
            
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ 
                success: false, 
                error: error.message 
            }));
        }
    }
    
    handleStatistics(req, res) {
        res.writeHead(200);
        res.end(JSON.stringify(this.statistics));
    }
    
    handleCacheStatus(req, res) {
        const cacheEntries = Array.from(this.responseCache.entries()).map(([key, value]) => ({
            key,
            age: Date.now() - value.timestamp,
            hits: value.hits || 0,
            size: JSON.stringify(value.data).length
        }));
        
        const totalSize = cacheEntries.reduce((sum, entry) => sum + entry.size, 0);
        
        const cacheStatus = {
            size: this.responseCache.size,
            hits: this.statistics.cacheHits,
            totalRequests: this.statistics.totalRequests,
            memoryUsage: totalSize,
            maxSize: this.cacheConfig.maxSize,
            entries: cacheEntries.sort((a, b) => b.hits - a.hits)
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(cacheStatus));
    }
    
    handleHealthCheck(req, res) {
        const health = {
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
            statistics: this.statistics,
            apiEndpoints: this.getAPIHealthSummary(),
            cacheStatus: {
                size: this.responseCache.size,
                hitRate: this.statistics.totalRequests > 0 ? 
                    this.statistics.cacheHits / this.statistics.totalRequests : 0
            },
            integrations: this.systemIntegrations
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(health, null, 2));
    }
    
    async performSmartSearch(keyword, type, options = {}) {
        console.log(`🔍 Smart search: "${keyword}" (${type})`);
        
        const searchResult = {
            query: keyword,
            type,
            timestamp: new Date().toISOString(),
            success: false,
            data: [],
            sources: [],
            fallbacksUsed: [],
            cacheHit: false,
            processingTime: 0
        };
        
        const startTime = Date.now();
        
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(keyword, type, options);
            const cached = this.responseCache.get(cacheKey);
            
            if (cached && this.isCacheValid(cached, type)) {
                this.statistics.cacheHits++;
                searchResult.success = true;
                searchResult.data = cached.data;
                searchResult.sources = cached.sources;
                searchResult.cacheHit = true;
                searchResult.processingTime = Date.now() - startTime;
                return searchResult;
            }
            
            // Try primary APIs first
            const primaryResults = await this.tryPrimaryAPIs(keyword, type, options);
            
            if (primaryResults.success && primaryResults.data.length > 0) {
                searchResult.success = true;
                searchResult.data = primaryResults.data;
                searchResult.sources = primaryResults.sources;
                
                // Cache successful result
                this.cacheResponse(cacheKey, searchResult, type);
                
                this.statistics.apiCalls++;
                searchResult.processingTime = Date.now() - startTime;
                return searchResult;
            } else {
                this.statistics.fallbacksUsed++;
                searchResult.fallbacksUsed.push('primary-apis-failed');
            }
            
            // Try secondary APIs
            const secondaryResults = await this.trySecondaryAPIs(keyword, type, options);
            
            if (secondaryResults.success && secondaryResults.data.length > 0) {
                searchResult.success = true;
                searchResult.data = secondaryResults.data;
                searchResult.sources = secondaryResults.sources;
                searchResult.fallbacksUsed.push('secondary-apis-used');
                
                this.cacheResponse(cacheKey, searchResult, type);
                
                this.statistics.apiCalls++;
                searchResult.processingTime = Date.now() - startTime;
                return searchResult;
            } else {
                searchResult.fallbacksUsed.push('secondary-apis-failed');
            }
            
            // Try cached data from similar queries
            const similarCached = this.findSimilarCachedResults(keyword, type);
            if (similarCached.length > 0) {
                searchResult.success = true;
                searchResult.data = similarCached;
                searchResult.sources = ['cached-similar'];
                searchResult.fallbacksUsed.push('similar-cache-used');
                searchResult.processingTime = Date.now() - startTime;
                return searchResult;
            }
            
            // Final fallback: direct scraping
            const scrapingResults = await this.tryDirectScraping(keyword, type, options);
            
            if (scrapingResults.success) {
                searchResult.success = true;
                searchResult.data = scrapingResults.data;
                searchResult.sources = scrapingResults.sources;
                searchResult.fallbacksUsed.push('direct-scraping-used');
                
                this.cacheResponse(cacheKey, searchResult, type);
            }
            
            searchResult.processingTime = Date.now() - startTime;
            console.log(`✅ Smart search completed in ${searchResult.processingTime}ms`);
            
            return searchResult;
            
        } catch (error) {
            searchResult.processingTime = Date.now() - startTime;
            searchResult.error = error.message;
            console.error(`❌ Smart search failed:`, error.message);
            return searchResult;
        }
    }
    
    async tryPrimaryAPIs(keyword, type, options) {
        console.log('🎯 Trying primary APIs');
        
        const result = { success: false, data: [], sources: [] };
        const primaryAPIs = ['grants-gov', 'sam-gov', 'usaspending'];
        
        for (const apiKey of primaryAPIs) {
            if (!this.isAPIHealthy(apiKey)) continue;
            
            try {
                const apiResult = await this.callAPI(apiKey, keyword, type, options);
                
                if (apiResult.success && apiResult.data.length > 0) {
                    result.success = true;
                    result.data = result.data.concat(apiResult.data);
                    result.sources.push(apiKey);
                }
            } catch (error) {
                console.warn(`Primary API ${apiKey} failed:`, error.message);
                this.recordAPIError(apiKey, error);
            }
        }
        
        // Normalize and deduplicate data
        result.data = this.normalizeData(result.data, type);
        
        return result;
    }
    
    async trySecondaryAPIs(keyword, type, options) {
        console.log('🔄 Trying secondary APIs');
        
        const result = { success: false, data: [], sources: [] };
        const secondaryAPIs = ['contracts-gov', 'nsf-awards', 'nih-reporter'];
        
        for (const apiKey of secondaryAPIs) {
            if (!this.isAPIHealthy(apiKey)) continue;
            
            try {
                const apiResult = await this.callAPI(apiKey, keyword, type, options);
                
                if (apiResult.success && apiResult.data.length > 0) {
                    result.success = true;
                    result.data = result.data.concat(apiResult.data);
                    result.sources.push(apiKey);
                }
            } catch (error) {
                console.warn(`Secondary API ${apiKey} failed:`, error.message);
                this.recordAPIError(apiKey, error);
            }
        }
        
        result.data = this.normalizeData(result.data, type);
        
        return result;
    }
    
    async tryDirectScraping(keyword, type, options) {
        console.log('🌐 Trying direct scraping fallback');
        
        const result = { success: false, data: [], sources: [] };
        
        try {
            // Try HTML wrapper system
            const htmlWrapperResult = await this.callExternalSystem(
                this.systemIntegrations.htmlWrapper,
                '/api/parse',
                { keyword, type }
            );
            
            if (htmlWrapperResult.success) {
                result.success = true;
                result.data = htmlWrapperResult.data;
                result.sources.push('html-wrapper');
                return result;
            }
        } catch (error) {
            console.warn('HTML wrapper failed:', error.message);
        }
        
        try {
            // Try CJIS swarm system
            const cjisResult = await this.callExternalSystem(
                this.systemIntegrations.cjisSwarm,
                '/api/search',
                { keyword, type }
            );
            
            if (cjisResult.success) {
                result.success = true;
                result.data = cjisResult.data;
                result.sources.push('cjis-swarm');
                return result;
            }
        } catch (error) {
            console.warn('CJIS swarm failed:', error.message);
        }
        
        return result;
    }
    
    async callAPI(apiKey, keyword, type, options) {
        const api = this.apiEndpoints[apiKey];
        if (!api) {
            throw new Error(`Unknown API: ${apiKey}`);
        }
        
        // Check rate limits
        if (!this.checkRateLimit(apiKey)) {
            throw new Error(`Rate limit exceeded for ${apiKey}`);
        }
        
        // Build API URL and parameters
        const { url, params } = this.buildAPIRequest(api, keyword, type, options);
        
        console.log(`📡 Calling ${api.name}: ${url}`);
        
        const response = await this.httpRequest(url, {
            method: 'GET',
            timeout: 15000,
            headers: this.getAPIHeaders(api)
        });
        
        // Update rate limit
        this.updateRateLimit(apiKey);
        
        // Parse and normalize response
        const parsedData = this.parseAPIResponse(response, api, type);
        
        return {
            success: parsedData.length > 0,
            data: parsedData,
            source: apiKey
        };
    }
    
    buildAPIRequest(api, keyword, type, options) {
        let url = api.baseUrl;
        const params = new URLSearchParams();
        
        // API-specific parameter mapping
        switch (api.baseUrl) {
            case this.apiEndpoints['grants-gov'].baseUrl:
                params.append('keyword', keyword);
                if (options.dateFrom) params.append('posted_date', options.dateFrom);
                break;
                
            case this.apiEndpoints['usaspending'].baseUrl:
                url += '/search/spending_by_award';
                params.append('filters', JSON.stringify({
                    keyword: keyword,
                    award_type_codes: type === 'grants' ? ['04', '05'] : ['A', 'B', 'C']
                }));
                break;
                
            case this.apiEndpoints['sam-gov'].baseUrl:
                url += '/search';
                params.append('keyword', keyword);
                if (options.dateFrom) params.append('postedFrom', options.dateFrom);
                if (options.dateTo) params.append('postedTo', options.dateTo);
                break;
                
            default:
                params.append('q', keyword);
                break;
        }
        
        return {
            url: params.toString() ? `${url}?${params.toString()}` : url,
            params: Object.fromEntries(params)
        };
    }
    
    getAPIHeaders(api) {
        const headers = {
            'User-Agent': 'Soulfra-Grant-Scraper/1.0',
            'Accept': 'application/json'
        };
        
        // Add API key if required
        if (api.keyRequired && api.keyVar) {
            const apiKey = process.env[api.keyVar];
            if (apiKey) {
                headers['X-API-Key'] = apiKey;
            }
        }
        
        return headers;
    }
    
    parseAPIResponse(response, api, type) {
        let data;
        
        try {
            data = typeof response === 'string' ? JSON.parse(response) : response;
        } catch (error) {
            console.warn('Failed to parse API response as JSON');
            return [];
        }
        
        // Extract data based on API structure
        let items = [];
        
        if (data.opportunitySynopsisDetail_1_0) {
            // Grants.gov format
            items = data.opportunitySynopsisDetail_1_0;
        } else if (data.results) {
            // USASpending format
            items = data.results;
        } else if (data.opportunities) {
            // SAM.gov format
            items = data.opportunities;
        } else if (Array.isArray(data)) {
            items = data;
        } else {
            items = [data];
        }
        
        return items.slice(0, 50); // Limit results
    }
    
    normalizeData(rawData, type) {
        const mapping = this.dataMappings[type] || this.dataMappings.grants;
        const normalized = [];
        
        for (const item of rawData) {
            const normalizedItem = {};
            
            // Map fields based on type
            for (const [targetField, sourceFields] of Object.entries(mapping)) {
                for (const sourceField of sourceFields) {
                    if (item[sourceField]) {
                        normalizedItem[targetField] = item[sourceField];
                        break;
                    }
                }
            }
            
            // Add metadata
            normalizedItem.source = item.source || 'api';
            normalizedItem.normalized = true;
            normalizedItem.timestamp = new Date().toISOString();
            
            if (Object.keys(normalizedItem).length > 3) {
                normalized.push(normalizedItem);
            }
        }
        
        // Remove duplicates based on title or ID
        const deduped = normalized.filter((item, index, array) => {
            return array.findIndex(other => 
                other.title === item.title || 
                other.opportunityId === item.opportunityId
            ) === index;
        });
        
        return deduped;
    }
    
    async executeFallbackChain(query, options = {}) {
        console.log(`🔄 Executing fallback chain for: "${query}"`);
        
        const result = {
            query,
            timestamp: new Date().toISOString(),
            strategies: [],
            finalResult: null,
            success: false
        };
        
        for (const strategy of this.fallbackStrategies) {
            console.log(`🔧 Trying strategy: ${strategy.name}`);
            
            const strategyResult = {
                name: strategy.name,
                description: strategy.description,
                attempted: new Date().toISOString(),
                success: false,
                error: null,
                data: []
            };
            
            try {
                if (strategy.name === 'primary-apis') {
                    const apiResult = await this.tryPrimaryAPIs(query, 'grants', options);
                    strategyResult.success = apiResult.success;
                    strategyResult.data = apiResult.data;
                    
                } else if (strategy.name === 'secondary-apis') {
                    const apiResult = await this.trySecondaryAPIs(query, 'grants', options);
                    strategyResult.success = apiResult.success;
                    strategyResult.data = apiResult.data;
                    
                } else if (strategy.name === 'cached-data') {
                    const cached = this.findSimilarCachedResults(query, 'grants');
                    strategyResult.success = cached.length > 0;
                    strategyResult.data = cached;
                    
                } else if (strategy.name === 'scraper-fallback') {
                    const scrapingResult = await this.tryDirectScraping(query, 'grants', options);
                    strategyResult.success = scrapingResult.success;
                    strategyResult.data = scrapingResult.data;
                }
                
                if (strategyResult.success && !options.forceFailure) {
                    result.success = true;
                    result.finalResult = strategyResult;
                    strategyResult.data = strategyResult.data.slice(0, 10);
                    break;
                }
                
            } catch (error) {
                strategyResult.error = error.message;
                console.error(`Strategy ${strategy.name} failed:`, error.message);
            }
            
            result.strategies.push(strategyResult);
        }
        
        console.log(`${result.success ? '✅' : '❌'} Fallback chain completed`);
        
        return result;
    }
    
    async testAPIEndpoint(endpoint, query) {
        console.log(`🎯 Testing API endpoint: ${endpoint}`);
        
        const api = this.apiEndpoints[endpoint];
        if (!api) {
            throw new Error(`Unknown API endpoint: ${endpoint}`);
        }
        
        const test = {
            endpoint,
            query,
            timestamp: new Date().toISOString(),
            success: false,
            responseTime: 0,
            error: null,
            data: []
        };
        
        const startTime = Date.now();
        
        try {
            const result = await this.callAPI(endpoint, query, 'grants', {});
            
            test.success = result.success;
            test.data = result.data.slice(0, 5); // Limit for testing
            test.responseTime = Date.now() - startTime;
            
            // Update API health
            this.recordAPISuccess(endpoint, test.responseTime);
            
        } catch (error) {
            test.error = error.message;
            test.responseTime = Date.now() - startTime;
            
            this.recordAPIError(endpoint, error);
        }
        
        return test;
    }
    
    findSimilarCachedResults(keyword, type) {
        const similar = [];
        const keywordLower = keyword.toLowerCase();
        
        for (const [cacheKey, cachedItem] of this.responseCache.entries()) {
            if (cachedItem.type === type && cacheKey.includes(keywordLower)) {
                similar.push(...cachedItem.data.slice(0, 5));
            }
        }
        
        return similar;
    }
    
    isAPIHealthy(apiKey) {
        const health = this.apiHealth.get(apiKey);
        return !health || health.status !== 'down';
    }
    
    checkRateLimit(apiKey) {
        const rateLimit = this.rateLimits.get(apiKey);
        if (!rateLimit) return true;
        
        const now = Date.now();
        const hourlyLimit = this.apiEndpoints[apiKey].rateLimit;
        
        // Reset if hour has passed
        if (now - rateLimit.resetTime > 3600000) {
            rateLimit.count = 0;
            rateLimit.resetTime = now;
        }
        
        return rateLimit.count < hourlyLimit;
    }
    
    updateRateLimit(apiKey) {
        let rateLimit = this.rateLimits.get(apiKey);
        if (!rateLimit) {
            rateLimit = { count: 0, resetTime: Date.now() };
            this.rateLimits.set(apiKey, rateLimit);
        }
        
        rateLimit.count++;
    }
    
    recordAPISuccess(apiKey, responseTime) {
        let health = this.apiHealth.get(apiKey);
        if (!health) {
            health = { successCount: 0, errorCount: 0, avgResponseTime: 0, status: 'healthy' };
            this.apiHealth.set(apiKey, health);
        }
        
        health.successCount++;
        health.avgResponseTime = (health.avgResponseTime + responseTime) / 2;
        
        // Update status based on success rate
        const successRate = health.successCount / (health.successCount + health.errorCount);
        if (successRate > 0.9) {
            health.status = 'healthy';
        } else if (successRate > 0.7) {
            health.status = 'degraded';
        } else {
            health.status = 'down';
        }
    }
    
    recordAPIError(apiKey, error) {
        let health = this.apiHealth.get(apiKey);
        if (!health) {
            health = { successCount: 0, errorCount: 0, avgResponseTime: 0, status: 'down' };
            this.apiHealth.set(apiKey, health);
        }
        
        health.errorCount++;
        health.lastError = error.message;
        health.lastErrorTime = new Date().toISOString();
        
        const successRate = health.successCount / (health.successCount + health.errorCount);
        if (successRate < 0.5) {
            health.status = 'down';
        } else if (successRate < 0.8) {
            health.status = 'degraded';
        }
    }
    
    getAPIHealthSummary() {
        const summary = {};
        
        for (const [apiKey, api] of Object.entries(this.apiEndpoints)) {
            const health = this.apiHealth.get(apiKey) || { status: 'unknown' };
            const rateLimit = this.rateLimits.get(apiKey) || { count: 0 };
            
            summary[apiKey] = {
                ...api,
                health: health.status,
                rateLimitUsed: rateLimit.count,
                successCount: health.successCount || 0,
                errorCount: health.errorCount || 0,
                avgResponseTime: Math.round(health.avgResponseTime || 0)
            };
        }
        
        return summary;
    }
    
    generateCacheKey(keyword, type, options) {
        const keyData = { keyword, type, ...options };
        return crypto.createHash('md5')
            .update(JSON.stringify(keyData))
            .digest('hex');
    }
    
    isCacheValid(cached, type) {
        const age = Date.now() - cached.timestamp;
        const ttl = this.cacheConfig.priorities[type] || this.cacheConfig.defaultTTL;
        
        return age < ttl;
    }
    
    cacheResponse(cacheKey, data, type) {
        // Check cache size limit
        if (this.responseCache.size >= this.cacheConfig.maxSize) {
            // Remove oldest entries
            const entries = Array.from(this.responseCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            for (let i = 0; i < Math.floor(this.cacheConfig.maxSize * 0.1); i++) {
                this.responseCache.delete(entries[i][0]);
            }
        }
        
        this.responseCache.set(cacheKey, {
            ...data,
            timestamp: Date.now(),
            type,
            hits: 0
        });
        
        // Set cleanup timer
        const ttl = this.cacheConfig.priorities[type] || this.cacheConfig.defaultTTL;
        setTimeout(() => {
            this.responseCache.delete(cacheKey);
        }, ttl);
    }
    
    async callExternalSystem(baseUrl, endpoint, data) {
        const url = `${baseUrl}${endpoint}`;
        
        return this.httpRequest(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            timeout: 10000
        });
    }
    
    initializeRateLimits() {
        for (const apiKey of Object.keys(this.apiEndpoints)) {
            this.rateLimits.set(apiKey, {
                count: 0,
                resetTime: Date.now()
            });
        }
    }
    
    startHealthMonitoring() {
        // Monitor API health every 5 minutes
        setInterval(() => {
            this.performHealthChecks();
        }, 5 * 60 * 1000);
        
        // Initial health check
        setTimeout(() => this.performHealthChecks(), 5000);
    }
    
    async performHealthChecks() {
        console.log('🩺 Performing API health checks');
        
        for (const apiKey of Object.keys(this.apiEndpoints)) {
            try {
                const testResult = await this.testAPIEndpoint(apiKey, 'health-check');
                console.log(`✅ ${apiKey}: ${testResult.success ? 'healthy' : 'issues detected'}`);
            } catch (error) {
                console.warn(`❌ ${apiKey}: health check failed -`, error.message);
            }
        }
    }
    
    httpRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const httpModule = parsedUrl.protocol === 'https:' ? https : http;
            
            const reqOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: options.method || 'GET',
                timeout: options.timeout || 10000,
                headers: options.headers || {}
            };
            
            const req = httpModule.request(reqOptions, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const result = JSON.parse(data);
                            resolve(result);
                        } catch {
                            resolve({ data });
                        }
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }
    
    getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                resolve(body);
            });
            req.on('error', reject);
        });
    }
}

// Start the system
console.log('🔄🌐📡 API FALLBACK SYSTEM');
console.log('============================');
console.log('');
console.log('🎯 Multiple government API endpoints with intelligent fallback');
console.log('🔄 Smart search with automatic strategy escalation');
console.log('💾 Intelligent caching with TTL and priority management');
console.log('📊 Real-time API health monitoring and rate limit tracking');
console.log('🔗 Integration with existing scraper ecosystem');
console.log('');

const apiFallback = new APIFallbackSystem();

console.log('✅ API Fallback System initialized');
console.log(`🌐 Dashboard: http://localhost:4700`);
console.log('🔄 Ready for intelligent API fallback operations!');