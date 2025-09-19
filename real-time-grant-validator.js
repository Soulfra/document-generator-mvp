#!/usr/bin/env node

// 🕐✅📋 REAL-TIME GRANT VALIDATION SYSTEM
// =====================================
// Filters expired opportunities and validates grant status in real-time
// Integrates with HTML wrapper and CJIS compliant swarm systems

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const crypto = require('crypto');

class RealTimeGrantValidator {
    constructor() {
        this.port = 4600;
        this.name = 'Real-Time Grant Validator';
        this.version = '1.0.0';
        
        // Validation cache with TTL
        this.validationCache = new Map();
        this.cacheTimeout = 3600000; // 1 hour default
        
        // Different validation intervals based on grant type
        this.validationIntervals = {
            'high-priority': 300000,    // 5 minutes for urgent grants
            'medium-priority': 900000,  // 15 minutes for regular grants
            'low-priority': 3600000,    // 1 hour for long-term grants
            'archived': 86400000        // 24 hours for archived grants
        };
        
        // Grant status classification
        this.grantStatus = {
            ACTIVE: 'active',
            EXPIRED: 'expired',
            CLOSING_SOON: 'closing_soon',
            SUSPENDED: 'suspended',
            CANCELLED: 'cancelled',
            UNKNOWN: 'unknown'
        };
        
        // Real-time validation rules
        this.validationRules = {
            deadline: {
                patterns: [
                    /deadline[:\s]*([^\n\r<]+)/gi,
                    /due\s+(?:date|by)[:\s]*([^\n\r<]+)/gi,
                    /closing[:\s]*([^\n\r<]+)/gi,
                    /submission\s+deadline[:\s]*([^\n\r<]+)/gi,
                    /application\s+due[:\s]*([^\n\r<]+)/gi
                ],
                warningDays: 7, // Warn if deadline is within 7 days
                urgentDays: 2   // Mark urgent if deadline is within 2 days
            },
            status: {
                activeKeywords: ['open', 'active', 'available', 'accepting'],
                expiredKeywords: ['closed', 'expired', 'suspended', 'cancelled', 'deadline passed'],
                suspendedKeywords: ['suspended', 'on hold', 'paused', 'temporarily closed']
            },
            amount: {
                patterns: [
                    /(?:award|grant|funding)[:\s]*\$?([\d,]+(?:\.\d{2})?)/gi,
                    /up\s+to\s+\$?([\d,]+)/gi,
                    /maximum[:\s]*\$?([\d,]+)/gi,
                    /total[:\s]*\$?([\d,]+)/gi
                ],
                minimumAmount: 1000 // Filter out grants below $1,000
            }
        };
        
        // Integration endpoints for other systems
        this.systemIntegrations = {
            htmlWrapper: 'http://localhost:4500',
            cjisSwarm: 'http://localhost:4400',
            grantScraper: 'http://localhost:4300'
        };
        
        // Real-time validation queue
        this.validationQueue = [];
        this.isProcessingQueue = false;
        this.maxConcurrentValidations = 5;
        this.currentValidations = 0;
        
        // Statistics tracking
        this.statistics = {
            totalValidations: 0,
            activeGrants: 0,
            expiredGrants: 0,
            expiringSoon: 0,
            validationErrors: 0,
            cacheHits: 0,
            realTimeChecks: 0
        };
        
        this.setupServer();
        this.startValidationWorker();
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
            } else if (req.url === '/api/validate') {
                this.handleValidationRequest(req, res);
            } else if (req.url === '/api/validate-batch') {
                this.handleBatchValidation(req, res);
            } else if (req.url === '/api/filter-active') {
                this.handleFilterActive(req, res);
            } else if (req.url === '/api/statistics') {
                this.handleStatistics(req, res);
            } else if (req.url === '/api/health') {
                this.handleHealthCheck(req, res);
            } else if (req.url === '/api/queue-status') {
                this.handleQueueStatus(req, res);
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });
        
        server.listen(this.port, () => {
            console.log(`🕐 ${this.name} running on http://localhost:${this.port}`);
        });
    }
    
    handleDashboard(req, res) {
        const dashboard = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🕐 Real-Time Grant Validator</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #2c1810, #3d2817, #4e351e);
            color: #ffaa00;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: rgba(0,0,0,0.8);
            border: 2px solid #ffaa00;
            border-radius: 10px;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #ffaa00;
            text-shadow: 0 0 10px #ffaa00;
            margin: 0;
        }
        
        .section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ffaa00;
            border-radius: 5px;
            background: rgba(255,170,0,0.1);
        }
        
        .validation-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        
        .validation-panel {
            padding: 15px;
            border: 1px solid #ffaa00;
            border-radius: 5px;
            background: rgba(0,0,0,0.5);
        }
        
        .statistics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: rgba(255,170,0,0.2);
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            border: 1px solid #ffaa00;
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #ffaa00;
            text-shadow: 0 0 5px #ffaa00;
        }
        
        .active { color: #00ff00; }
        .expired { color: #ff4444; }
        .warning { color: #ffcc00; }
        .urgent { color: #ff6600; }
        
        input, textarea {
            width: 100%;
            padding: 10px;
            background: rgba(0,0,0,0.8);
            border: 1px solid #ffaa00;
            color: #ffaa00;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            margin: 5px 0;
        }
        
        button {
            background: linear-gradient(45deg, #ffaa00, #ff8800);
            color: black;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
        }
        
        button:hover {
            background: linear-gradient(45deg, #ff8800, #ffaa00);
            box-shadow: 0 0 10px #ffaa00;
        }
        
        .queue-status {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
        }
        
        .queue-bar {
            flex: 1;
            height: 20px;
            background: rgba(0,0,0,0.5);
            border: 1px solid #ffaa00;
            border-radius: 10px;
            overflow: hidden;
        }
        
        .queue-progress {
            height: 100%;
            background: linear-gradient(90deg, #ffaa00, #ff8800);
            transition: width 0.3s ease;
        }
        
        .grant-list {
            max-height: 300px;
            overflow-y: auto;
            background: rgba(0,0,0,0.9);
            padding: 10px;
            border: 1px solid #ffaa00;
            border-radius: 5px;
        }
        
        .grant-item {
            padding: 8px;
            margin: 5px 0;
            border-left: 3px solid;
            border-radius: 3px;
            background: rgba(255,170,0,0.1);
        }
        
        .grant-item.active { border-left-color: #00ff00; }
        .grant-item.expired { border-left-color: #ff4444; }
        .grant-item.warning { border-left-color: #ffcc00; }
        .grant-item.urgent { border-left-color: #ff6600; }
        
        .real-time-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #00ff00;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🕐✅📋 REAL-TIME GRANT VALIDATOR</h1>
            <p>Filters expired opportunities and validates grant status in real-time</p>
            <div class="real-time-indicator"></div> <span>Live Validation Active</span>
        </div>
        
        <div class="section">
            <h3>📊 Validation Statistics</h3>
            <div class="statistics" id="statistics">
                <div class="stat-card">
                    <div class="stat-value" id="totalValidations">0</div>
                    <div>Total Validations</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value active" id="activeGrants">0</div>
                    <div>Active Grants</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value expired" id="expiredGrants">0</div>
                    <div>Expired Grants</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value warning" id="expiringSoon">0</div>
                    <div>Expiring Soon</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="cacheHits">0</div>
                    <div>Cache Hits</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="realTimeChecks">0</div>
                    <div>Real-Time Checks</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>🔄 Validation Queue Status</h3>
            <div class="queue-status">
                <span>Queue Progress:</span>
                <div class="queue-bar">
                    <div class="queue-progress" id="queueProgress" style="width: 0%"></div>
                </div>
                <span id="queueText">0/0</span>
            </div>
            <div>
                <strong>Concurrent Validations:</strong> <span id="currentValidations">0</span>/5
                <br>
                <strong>Queue Length:</strong> <span id="queueLength">0</span>
                <br>
                <strong>Processing Status:</strong> <span id="processingStatus">Idle</span>
            </div>
        </div>
        
        <div class="validation-grid">
            <div class="validation-panel">
                <h4>🧪 Single Grant Validation</h4>
                <input type="url" id="grantUrl" placeholder="Grant URL to validate...">
                <button onclick="validateSingleGrant()">🔍 Validate Grant</button>
                <textarea id="singleResult" rows="8" readonly placeholder="Validation results..."></textarea>
            </div>
            
            <div class="validation-panel">
                <h4>📋 Batch Validation</h4>
                <textarea id="batchUrls" rows="5" placeholder="Enter multiple grant URLs (one per line)"></textarea>
                <button onclick="validateBatch()">🔄 Validate Batch</button>
                <div>
                    <label>
                        <input type="checkbox" id="onlyActive"> Only return active grants
                    </label>
                </div>
            </div>
            
            <div class="validation-panel">
                <h4>⚡ Real-Time Filter</h4>
                <textarea id="filterInput" rows="5" placeholder="Paste grant data (JSON format)"></textarea>
                <button onclick="filterActiveGrants()">✅ Filter Active Only</button>
                <div>
                    <strong>Filter Settings:</strong><br>
                    <label><input type="checkbox" id="strictDeadlines" checked> Strict deadline checking</label><br>
                    <label><input type="checkbox" id="excludeExpired" checked> Exclude expired grants</label><br>
                    <label><input type="checkbox" id="warningThreshold" checked> Mark expiring soon</label>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>📋 Recent Validation Results</h3>
            <div class="grant-list" id="recentValidations">
                <div class="grant-item active">
                    <strong>NSF Research Grant</strong> - Active until 2024-12-15 ✅
                    <div style="font-size: 0.9em; opacity: 0.8;">Validated 2 minutes ago</div>
                </div>
                <div class="grant-item warning">
                    <strong>DOE Innovation Award</strong> - Expires in 3 days ⚠️
                    <div style="font-size: 0.9em; opacity: 0.8;">Validated 5 minutes ago</div>
                </div>
                <div class="grant-item expired">
                    <strong>NIH Health Grant</strong> - Expired 2024-11-30 ❌
                    <div style="font-size: 0.9em; opacity: 0.8;">Validated 1 hour ago</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>🔧 Validation Rules & Settings</h3>
            <div class="statistics">
                <div class="stat-card">
                    <div style="color: #00ff00;">High Priority</div>
                    <div>5 min intervals</div>
                </div>
                <div class="stat-card">
                    <div style="color: #ffcc00;">Medium Priority</div>
                    <div>15 min intervals</div>
                </div>
                <div class="stat-card">
                    <div style="color: #ffaa00;">Low Priority</div>
                    <div>1 hour intervals</div>
                </div>
                <div class="stat-card">
                    <div style="color: #888888;">Archived</div>
                    <div>24 hour intervals</div>
                </div>
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
                    <div>Grant Scraper</div>
                    <div id="grantScraperStatus">🟡 Checking...</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-refresh statistics and queue status
        function updateStatistics() {
            fetch('/api/statistics')
                .then(response => response.json())
                .then(stats => {
                    document.getElementById('totalValidations').textContent = stats.totalValidations;
                    document.getElementById('activeGrants').textContent = stats.activeGrants;
                    document.getElementById('expiredGrants').textContent = stats.expiredGrants;
                    document.getElementById('expiringSoon').textContent = stats.expiringSoon;
                    document.getElementById('cacheHits').textContent = stats.cacheHits;
                    document.getElementById('realTimeChecks').textContent = stats.realTimeChecks;
                })
                .catch(error => console.error('Statistics update failed:', error));
        }
        
        function updateQueueStatus() {
            fetch('/api/queue-status')
                .then(response => response.json())
                .then(status => {
                    const progress = status.totalValidations > 0 ? 
                        ((status.totalValidations - status.queueLength) / status.totalValidations * 100) : 0;
                    
                    document.getElementById('queueProgress').style.width = progress + '%';
                    document.getElementById('queueText').textContent = 
                        \`\${status.totalValidations - status.queueLength}/\${status.totalValidations}\`;
                    document.getElementById('currentValidations').textContent = status.currentValidations;
                    document.getElementById('queueLength').textContent = status.queueLength;
                    document.getElementById('processingStatus').textContent = 
                        status.isProcessing ? 'Processing' : 'Idle';
                })
                .catch(error => console.error('Queue status update failed:', error));
        }
        
        function validateSingleGrant() {
            const url = document.getElementById('grantUrl').value;
            const resultArea = document.getElementById('singleResult');
            
            if (!url) {
                resultArea.value = '❌ Please enter a grant URL';
                return;
            }
            
            resultArea.value = '🔄 Validating grant...';
            
            fetch('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            })
            .then(response => response.json())
            .then(result => {
                resultArea.value = JSON.stringify(result, null, 2);
                updateStatistics();
                updateQueueStatus();
            })
            .catch(error => {
                resultArea.value = \`❌ Validation failed: \${error.message}\`;
            });
        }
        
        function validateBatch() {
            const urls = document.getElementById('batchUrls').value.split('\\n').filter(url => url.trim());
            const onlyActive = document.getElementById('onlyActive').checked;
            
            if (urls.length === 0) {
                alert('Please enter at least one URL');
                return;
            }
            
            document.getElementById('singleResult').value = \`🔄 Validating \${urls.length} grants...\`;
            
            fetch('/api/validate-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls, onlyActive })
            })
            .then(response => response.json())
            .then(result => {
                document.getElementById('singleResult').value = JSON.stringify(result, null, 2);
                updateStatistics();
                updateQueueStatus();
            })
            .catch(error => {
                document.getElementById('singleResult').value = \`❌ Batch validation failed: \${error.message}\`;
            });
        }
        
        function filterActiveGrants() {
            const input = document.getElementById('filterInput').value;
            const strictDeadlines = document.getElementById('strictDeadlines').checked;
            const excludeExpired = document.getElementById('excludeExpired').checked;
            const warningThreshold = document.getElementById('warningThreshold').checked;
            
            if (!input.trim()) {
                alert('Please enter grant data to filter');
                return;
            }
            
            fetch('/api/filter-active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    data: input,
                    options: {
                        strictDeadlines,
                        excludeExpired,
                        warningThreshold
                    }
                })
            })
            .then(response => response.json())
            .then(result => {
                document.getElementById('singleResult').value = JSON.stringify(result, null, 2);
                updateStatistics();
            })
            .catch(error => {
                document.getElementById('singleResult').value = \`❌ Filtering failed: \${error.message}\`;
            });
        }
        
        function checkSystemIntegrations() {
            // Check HTML Wrapper
            fetch('http://localhost:4500/api/health')
                .then(response => response.json())
                .then(() => {
                    document.getElementById('htmlWrapperStatus').innerHTML = '🟢 Online';
                })
                .catch(() => {
                    document.getElementById('htmlWrapperStatus').innerHTML = '🔴 Offline';
                });
            
            // Check CJIS Swarm
            fetch('http://localhost:4400/api/health')
                .then(response => response.json())
                .then(() => {
                    document.getElementById('cjisSwarmStatus').innerHTML = '🟢 Online';
                })
                .catch(() => {
                    document.getElementById('cjisSwarmStatus').innerHTML = '🔴 Offline';
                });
            
            // Check Grant Scraper
            fetch('http://localhost:4300/api/health')
                .then(response => response.json())
                .then(() => {
                    document.getElementById('grantScraperStatus').innerHTML = '🟢 Online';
                })
                .catch(() => {
                    document.getElementById('grantScraperStatus').innerHTML = '🔴 Offline';
                });
        }
        
        // Update everything every 3 seconds
        setInterval(() => {
            updateStatistics();
            updateQueueStatus();
        }, 3000);
        
        // Check integrations every 30 seconds
        setInterval(checkSystemIntegrations, 30000);
        
        // Initial updates
        updateStatistics();
        updateQueueStatus();
        checkSystemIntegrations();
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboard);
    }
    
    async handleValidationRequest(req, res) {
        try {
            const body = await this.getRequestBody(req);
            const { url, priority = 'medium-priority' } = JSON.parse(body);
            
            const result = await this.validateGrant(url, priority);
            
            res.writeHead(200);
            res.end(JSON.stringify(result));
            
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ 
                success: false, 
                error: error.message,
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    async handleBatchValidation(req, res) {
        try {
            const body = await this.getRequestBody(req);
            const { urls, onlyActive = false, priority = 'medium-priority' } = JSON.parse(body);
            
            const results = await this.validateGrantBatch(urls, priority, onlyActive);
            
            res.writeHead(200);
            res.end(JSON.stringify(results));
            
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ 
                success: false, 
                error: error.message 
            }));
        }
    }
    
    async handleFilterActive(req, res) {
        try {
            const body = await this.getRequestBody(req);
            const { data, options = {} } = JSON.parse(body);
            
            const filtered = await this.filterActiveGrants(data, options);
            
            res.writeHead(200);
            res.end(JSON.stringify(filtered));
            
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
    
    handleQueueStatus(req, res) {
        const status = {
            queueLength: this.validationQueue.length,
            currentValidations: this.currentValidations,
            maxConcurrentValidations: this.maxConcurrentValidations,
            isProcessing: this.isProcessingQueue,
            totalValidations: this.statistics.totalValidations,
            cacheSize: this.validationCache.size
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(status));
    }
    
    handleHealthCheck(req, res) {
        const health = {
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
            statistics: this.statistics,
            queueStatus: {
                length: this.validationQueue.length,
                processing: this.isProcessingQueue,
                concurrent: this.currentValidations
            },
            integrations: this.systemIntegrations
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(health, null, 2));
    }
    
    async validateGrant(url, priority = 'medium-priority') {
        console.log(`🔍 Validating grant: ${url}`);
        
        this.statistics.totalValidations++;
        
        const validation = {
            url,
            priority,
            timestamp: new Date().toISOString(),
            status: this.grantStatus.UNKNOWN,
            deadline: null,
            daysUntilDeadline: null,
            amount: null,
            isActive: false,
            issues: [],
            source: 'real-time-validation',
            cacheHit: false
        };
        
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(url);
            if (this.validationCache.has(cacheKey)) {
                const cached = this.validationCache.get(cacheKey);
                if (this.isCacheValid(cached, priority)) {
                    this.statistics.cacheHits++;
                    validation.cacheHit = true;
                    return { ...cached, cacheHit: true };
                }
            }
            
            this.statistics.realTimeChecks++;
            
            // Fetch current grant page
            const html = await this.fetchGrantPage(url);
            
            // Validate deadline
            const deadlineResult = this.validateDeadline(html);
            validation.deadline = deadlineResult.deadline;
            validation.daysUntilDeadline = deadlineResult.daysUntilDeadline;
            
            // Validate status
            const statusResult = this.validateStatus(html);
            validation.status = statusResult.status;
            validation.issues = statusResult.issues;
            
            // Validate amount
            const amountResult = this.validateAmount(html);
            validation.amount = amountResult.amount;
            
            // Determine if grant is active
            validation.isActive = this.determineActiveStatus(validation);
            
            // Update statistics
            this.updateStatistics(validation);
            
            // Cache result
            this.cacheValidation(cacheKey, validation, priority);
            
            console.log(`✅ Grant validation complete: ${validation.status}`);
            
            return validation;
            
        } catch (error) {
            this.statistics.validationErrors++;
            validation.error = error.message;
            console.error(`❌ Grant validation failed for ${url}:`, error.message);
            return validation;
        }
    }
    
    async validateGrantBatch(urls, priority = 'medium-priority', onlyActive = false) {
        console.log(`🔄 Batch validating ${urls.length} grants`);
        
        const results = {
            total: urls.length,
            processed: 0,
            active: 0,
            expired: 0,
            errors: 0,
            grants: []
        };
        
        // Process in chunks to avoid overwhelming servers
        const chunkSize = this.maxConcurrentValidations;
        
        for (let i = 0; i < urls.length; i += chunkSize) {
            const chunk = urls.slice(i, i + chunkSize);
            
            const chunkPromises = chunk.map(async (url) => {
                try {
                    const validation = await this.validateGrant(url, priority);
                    results.processed++;
                    
                    if (validation.isActive) {
                        results.active++;
                    } else {
                        results.expired++;
                    }
                    
                    // Only include if not filtering or if active
                    if (!onlyActive || validation.isActive) {
                        results.grants.push(validation);
                    }
                    
                    return validation;
                } catch (error) {
                    results.errors++;
                    console.error(`Batch validation error for ${url}:`, error.message);
                    return { url, error: error.message };
                }
            });
            
            await Promise.all(chunkPromises);
            
            // Brief pause between chunks
            if (i + chunkSize < urls.length) {
                await this.sleep(1000);
            }
        }
        
        console.log(`✅ Batch validation complete: ${results.active} active, ${results.expired} expired`);
        
        return results;
    }
    
    async filterActiveGrants(data, options = {}) {
        console.log('🔍 Filtering grants for active status');
        
        let grants;
        
        try {
            grants = typeof data === 'string' ? JSON.parse(data) : data;
        } catch (error) {
            throw new Error('Invalid JSON data provided');
        }
        
        if (!Array.isArray(grants)) {
            grants = [grants];
        }
        
        const filtered = {
            total: grants.length,
            active: 0,
            expired: 0,
            expiringSoon: 0,
            grants: []
        };
        
        for (const grant of grants) {
            const analysis = this.analyzeGrantStatus(grant, options);
            
            if (analysis.isActive) {
                filtered.active++;
                if (analysis.isExpiringSoon) {
                    filtered.expiringSoon++;
                }
                filtered.grants.push({
                    ...grant,
                    validation: analysis
                });
            } else {
                filtered.expired++;
                
                // Include expired grants if not excluding them
                if (!options.excludeExpired) {
                    filtered.grants.push({
                        ...grant,
                        validation: analysis
                    });
                }
            }
        }
        
        console.log(`✅ Filtering complete: ${filtered.active} active of ${filtered.total} total`);
        
        return filtered;
    }
    
    analyzeGrantStatus(grant, options = {}) {
        const analysis = {
            isActive: false,
            isExpiringSoon: false,
            daysUntilDeadline: null,
            status: this.grantStatus.UNKNOWN,
            issues: []
        };
        
        // Check deadline
        const deadlineStr = grant.deadline || grant.due_date || grant.closing_date;
        if (deadlineStr) {
            const deadline = this.parseDate(deadlineStr);
            if (deadline) {
                const now = new Date();
                const diffTime = deadline - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                analysis.daysUntilDeadline = diffDays;
                
                if (diffDays > 0) {
                    analysis.isActive = true;
                    analysis.status = this.grantStatus.ACTIVE;
                    
                    if (diffDays <= this.validationRules.deadline.warningDays) {
                        analysis.isExpiringSoon = true;
                        analysis.status = this.grantStatus.CLOSING_SOON;
                    }
                } else {
                    analysis.isActive = false;
                    analysis.status = this.grantStatus.EXPIRED;
                    analysis.issues.push('Deadline has passed');
                }
            }
        }
        
        // Check status keywords
        const statusText = (grant.status || grant.description || grant.title || '').toLowerCase();
        
        for (const keyword of this.validationRules.status.expiredKeywords) {
            if (statusText.includes(keyword)) {
                analysis.isActive = false;
                analysis.status = this.grantStatus.EXPIRED;
                analysis.issues.push(`Contains expired keyword: ${keyword}`);
                break;
            }
        }
        
        for (const keyword of this.validationRules.status.suspendedKeywords) {
            if (statusText.includes(keyword)) {
                analysis.isActive = false;
                analysis.status = this.grantStatus.SUSPENDED;
                analysis.issues.push(`Contains suspended keyword: ${keyword}`);
                break;
            }
        }
        
        // Check minimum amount
        const amount = this.parseAmount(grant.amount || grant.value || grant.award_amount);
        if (amount && amount < this.validationRules.amount.minimumAmount) {
            analysis.issues.push(`Amount ${amount} below minimum threshold`);
        }
        
        return analysis;
    }
    
    validateDeadline(html) {
        const result = {
            deadline: null,
            daysUntilDeadline: null,
            confidence: 0
        };
        
        for (const pattern of this.validationRules.deadline.patterns) {
            const matches = [...html.matchAll(pattern)];
            
            for (const match of matches) {
                const dateStr = match[1].trim();
                const parsed = this.parseDate(dateStr);
                
                if (parsed) {
                    const now = new Date();
                    const diffTime = parsed - now;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    result.deadline = parsed.toISOString();
                    result.daysUntilDeadline = diffDays;
                    result.confidence++;
                    break;
                }
            }
            
            if (result.deadline) break;
        }
        
        return result;
    }
    
    validateStatus(html) {
        const result = {
            status: this.grantStatus.UNKNOWN,
            confidence: 0,
            issues: []
        };
        
        const lowerHtml = html.toLowerCase();
        
        // Check for expired keywords
        for (const keyword of this.validationRules.status.expiredKeywords) {
            if (lowerHtml.includes(keyword)) {
                result.status = this.grantStatus.EXPIRED;
                result.confidence++;
                result.issues.push(`Found expired keyword: ${keyword}`);
            }
        }
        
        // Check for suspended keywords
        for (const keyword of this.validationRules.status.suspendedKeywords) {
            if (lowerHtml.includes(keyword)) {
                result.status = this.grantStatus.SUSPENDED;
                result.confidence++;
                result.issues.push(`Found suspended keyword: ${keyword}`);
            }
        }
        
        // Check for active keywords
        if (result.status === this.grantStatus.UNKNOWN) {
            for (const keyword of this.validationRules.status.activeKeywords) {
                if (lowerHtml.includes(keyword)) {
                    result.status = this.grantStatus.ACTIVE;
                    result.confidence++;
                    break;
                }
            }
        }
        
        return result;
    }
    
    validateAmount(html) {
        const result = {
            amount: null,
            confidence: 0
        };
        
        for (const pattern of this.validationRules.amount.patterns) {
            const matches = [...html.matchAll(pattern)];
            
            for (const match of matches) {
                const amountStr = match[1].replace(/,/g, '');
                const amount = parseFloat(amountStr);
                
                if (!isNaN(amount) && amount > 0) {
                    result.amount = amount;
                    result.confidence++;
                    break;
                }
            }
            
            if (result.amount) break;
        }
        
        return result;
    }
    
    determineActiveStatus(validation) {
        // Check if status indicates expired/suspended
        if (validation.status === this.grantStatus.EXPIRED || 
            validation.status === this.grantStatus.SUSPENDED ||
            validation.status === this.grantStatus.CANCELLED) {
            return false;
        }
        
        // Check deadline
        if (validation.daysUntilDeadline !== null) {
            return validation.daysUntilDeadline > 0;
        }
        
        // If no clear deadline, check status
        return validation.status === this.grantStatus.ACTIVE ||
               validation.status === this.grantStatus.CLOSING_SOON;
    }
    
    updateStatistics(validation) {
        if (validation.isActive) {
            this.statistics.activeGrants++;
            
            if (validation.daysUntilDeadline <= this.validationRules.deadline.warningDays) {
                this.statistics.expiringSoon++;
            }
        } else {
            this.statistics.expiredGrants++;
        }
    }
    
    async fetchGrantPage(url) {
        // Try to use HTML wrapper system if available
        try {
            const response = await this.httpRequest(`${this.systemIntegrations.htmlWrapper}/api/parse`, {
                method: 'POST',
                body: JSON.stringify({ url, parseType: 'grants' })
            });
            
            if (response.success && response.html) {
                return response.html;
            }
        } catch (error) {
            console.warn('HTML wrapper unavailable, using direct fetch');
        }
        
        // Fallback to direct fetch
        return this.directFetch(url);
    }
    
    async directFetch(url) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const httpModule = parsedUrl.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            };
            
            const req = httpModule.request(options, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
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
            
            req.end();
        });
    }
    
    parseDate(dateStr) {
        // Try various date formats common in government sites
        const formats = [
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/,       // MM/DD/YYYY
            /(\d{4})-(\d{2})-(\d{2})/,             // YYYY-MM-DD
            /(\d{1,2})-(\d{1,2})-(\d{4})/,        // MM-DD-YYYY
            /(\w+)\s+(\d{1,2}),?\s+(\d{4})/       // Month DD, YYYY
        ];
        
        for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
                let date;
                
                if (format === formats[0] || format === formats[2]) {
                    // MM/DD/YYYY or MM-DD-YYYY
                    date = new Date(match[3], match[1] - 1, match[2]);
                } else if (format === formats[1]) {
                    // YYYY-MM-DD
                    date = new Date(match[1], match[2] - 1, match[3]);
                } else if (format === formats[3]) {
                    // Month DD, YYYY
                    date = new Date(`${match[1]} ${match[2]}, ${match[3]}`);
                }
                
                if (date && !isNaN(date.getTime())) {
                    return date;
                }
            }
        }
        
        // Try standard Date parsing as fallback
        const fallback = new Date(dateStr);
        return !isNaN(fallback.getTime()) ? fallback : null;
    }
    
    parseAmount(amountStr) {
        if (!amountStr) return null;
        
        const cleaned = amountStr.toString().replace(/[$,\s]/g, '');
        const amount = parseFloat(cleaned);
        
        return !isNaN(amount) ? amount : null;
    }
    
    generateCacheKey(url) {
        return crypto.createHash('md5').update(url).digest('hex');
    }
    
    isCacheValid(cached, priority) {
        const age = Date.now() - new Date(cached.timestamp).getTime();
        const ttl = this.validationIntervals[priority] || this.cacheTimeout;
        
        return age < ttl;
    }
    
    cacheValidation(cacheKey, validation, priority) {
        this.validationCache.set(cacheKey, validation);
        
        // Set cleanup timer based on priority
        const ttl = this.validationIntervals[priority] || this.cacheTimeout;
        setTimeout(() => {
            this.validationCache.delete(cacheKey);
        }, ttl);
    }
    
    startValidationWorker() {
        setInterval(() => {
            this.processValidationQueue();
        }, 1000);
    }
    
    async processValidationQueue() {
        if (this.isProcessingQueue || this.validationQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        
        while (this.validationQueue.length > 0 && 
               this.currentValidations < this.maxConcurrentValidations) {
            
            const task = this.validationQueue.shift();
            this.currentValidations++;
            
            this.processValidationTask(task)
                .finally(() => {
                    this.currentValidations--;
                });
        }
        
        this.isProcessingQueue = false;
    }
    
    async processValidationTask(task) {
        try {
            const result = await this.validateGrant(task.url, task.priority);
            if (task.callback) {
                task.callback(null, result);
            }
        } catch (error) {
            if (task.callback) {
                task.callback(error);
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
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };
            
            const req = httpModule.request(reqOptions, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (error) {
                        resolve({ data });
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
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Start the system
console.log('🕐✅📋 REAL-TIME GRANT VALIDATION SYSTEM');
console.log('==========================================');
console.log('');
console.log('🎯 Real-time validation of grant opportunities');
console.log('⏰ Intelligent deadline checking and expiration alerts');
console.log('🔄 Multi-priority validation queue with caching');
console.log('🌐 Integration with HTML wrapper and CJIS swarm systems');
console.log('📊 Live statistics and performance monitoring');
console.log('');

const validator = new RealTimeGrantValidator();

console.log('✅ Real-Time Grant Validator initialized');
console.log(`🌐 Dashboard: http://localhost:4600`);
console.log('🔍 Ready for real-time grant validation!');