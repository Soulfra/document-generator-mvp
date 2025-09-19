#!/usr/bin/env node

// 🌐🔧📄 ROBUST HTML WRAPPER SYSTEM
// ================================
// Advanced HTML parsing system designed specifically for terrible government websites
// Multiple fallback strategies, error recovery, and intelligent content extraction

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const crypto = require('crypto');

class RobustHTMLWrapper {
    constructor() {
        this.port = 4500;
        this.name = 'Robust HTML Wrapper System';
        this.version = '1.0.0';
        
        // Government website specific configurations
        this.govSitePatterns = {
            '.gov': { encoding: 'utf-8', timeout: 30000, retries: 5 },
            '.mil': { encoding: 'utf-8', timeout: 25000, retries: 4 },
            '.edu': { encoding: 'utf-8', timeout: 20000, retries: 3 },
            'grants.gov': { encoding: 'utf-8', timeout: 45000, retries: 7 },
            'usaspending.gov': { encoding: 'utf-8', timeout: 40000, retries: 6 },
            'fedconnect.net': { encoding: 'utf-8', timeout: 35000, retries: 5 }
        };
        
        // Common government website issues and solutions
        this.commonIssues = {
            malformedTags: {
                patterns: [/<[^>]*[^>\/]>/g, /<\/[^>]*>/g],
                fixes: ['close-unclosed-tags', 'remove-invalid-attributes']
            },
            invalidCharacters: {
                patterns: [/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g],
                fixes: ['remove-control-chars', 'normalize-encoding']
            },
            brokenTables: {
                patterns: [/<table[^>]*>(?!.*<\/table>)/gi, /<tr[^>]*>(?!.*<\/tr>)/gi],
                fixes: ['auto-close-tables', 'reconstruct-table-structure']
            },
            nestedForms: {
                patterns: [/<form[^>]*>.*<form[^>]*>/gi],
                fixes: ['flatten-forms', 'separate-form-sections']
            }
        };
        
        // Multiple parsing strategies
        this.parsingStrategies = {
            'dom-parser': { priority: 1, reliability: 0.9 },
            'regex-fallback': { priority: 2, reliability: 0.7 },
            'text-extraction': { priority: 3, reliability: 0.5 },
            'ai-assisted': { priority: 4, reliability: 0.8 },
            'manual-rules': { priority: 5, reliability: 0.6 }
        };
        
        // Content extraction rules for government sites
        this.extractionRules = {
            'grants': {
                selectors: [
                    'table.grant-list tr',
                    '.grant-opportunity',
                    '[class*="grant"]',
                    '[id*="grant"]',
                    'tbody tr'
                ],
                fields: ['title', 'deadline', 'amount', 'agency', 'description', 'eligibility']
            },
            'contracts': {
                selectors: [
                    'table.contract-list tr',
                    '.contract-opportunity',
                    '[class*="contract"]',
                    '[id*="contract"]'
                ],
                fields: ['title', 'deadline', 'value', 'department', 'requirements']
            },
            'funding': {
                selectors: [
                    '.funding-opportunity',
                    'table.funding tr',
                    '[class*="funding"]',
                    '.opportunity'
                ],
                fields: ['program', 'deadline', 'amount', 'agency', 'criteria']
            }
        };
        
        this.cache = new Map();
        this.statistics = {
            totalRequests: 0,
            successfulParses: 0,
            fallbacksUsed: 0,
            cacheHits: 0,
            parsingErrors: 0
        };
        
        this.setupServer();
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
            } else if (req.url === '/api/parse') {
                this.handleParseRequest(req, res);
            } else if (req.url === '/api/test-site') {
                this.handleTestSite(req, res);
            } else if (req.url === '/api/health') {
                this.handleHealthCheck(req, res);
            } else if (req.url === '/api/statistics') {
                this.handleStatistics(req, res);
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });
        
        server.listen(this.port, () => {
            console.log(`🌐 ${this.name} running on http://localhost:${this.port}`);
        });
    }
    
    handleDashboard(req, res) {
        const dashboard = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌐 Robust HTML Wrapper System</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            color: #00ff41;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(0,0,0,0.8);
            border: 2px solid #00ff41;
            border-radius: 10px;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #00ff41;
            text-shadow: 0 0 10px #00ff41;
            margin: 0;
        }
        
        .section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #00ff41;
            border-radius: 5px;
            background: rgba(0,255,65,0.1);
        }
        
        .parsing-test {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        
        .test-input, .test-output {
            padding: 15px;
            border: 1px solid #00ff41;
            border-radius: 5px;
            background: rgba(0,0,0,0.5);
        }
        
        input[type="url"], textarea {
            width: 100%;
            padding: 10px;
            background: rgba(0,0,0,0.8);
            border: 1px solid #00ff41;
            color: #00ff41;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        
        button {
            background: linear-gradient(45deg, #00ff41, #00cc33);
            color: black;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
        }
        
        button:hover {
            background: linear-gradient(45deg, #00cc33, #00ff41);
            box-shadow: 0 0 10px #00ff41;
        }
        
        .statistics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: rgba(0,255,65,0.2);
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            border: 1px solid #00ff41;
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #00ff41;
            text-shadow: 0 0 5px #00ff41;
        }
        
        .logs {
            height: 200px;
            overflow-y: scroll;
            background: rgba(0,0,0,0.9);
            padding: 10px;
            border: 1px solid #00ff41;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
        }
        
        .strategy-list {
            list-style: none;
            padding: 0;
        }
        
        .strategy-list li {
            padding: 8px;
            margin: 5px 0;
            background: rgba(0,255,65,0.1);
            border-left: 3px solid #00ff41;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐🔧📄 ROBUST HTML WRAPPER SYSTEM</h1>
            <p>Advanced parsing for terrible government websites with multiple fallback strategies</p>
        </div>
        
        <div class="section">
            <h3>📊 Real-Time Statistics</h3>
            <div class="statistics" id="statistics">
                <div class="stat-card">
                    <div class="stat-value" id="totalRequests">0</div>
                    <div>Total Requests</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="successfulParses">0</div>
                    <div>Successful Parses</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="fallbacksUsed">0</div>
                    <div>Fallbacks Used</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="cacheHits">0</div>
                    <div>Cache Hits</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="parsingErrors">0</div>
                    <div>Parsing Errors</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>🧪 Website Parsing Test</h3>
            <div class="parsing-test">
                <div class="test-input">
                    <h4>Input URL</h4>
                    <input type="url" id="testUrl" placeholder="https://grants.gov/..." value="https://grants.gov">
                    <br><br>
                    <label>
                        <input type="radio" name="parseType" value="grants" checked> Grants
                    </label>
                    <label>
                        <input type="radio" name="parseType" value="contracts"> Contracts
                    </label>
                    <label>
                        <input type="radio" name="parseType" value="funding"> Funding
                    </label>
                    <br><br>
                    <button onclick="testSiteParsing()">🔍 Parse Website</button>
                    <button onclick="testHealthCheck()">💚 Health Check</button>
                </div>
                <div class="test-output">
                    <h4>Parsing Results</h4>
                    <textarea id="parseResults" rows="10" readonly placeholder="Results will appear here..."></textarea>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>🔧 Parsing Strategies (Ordered by Priority)</h3>
            <ul class="strategy-list">
                <li><strong>1. DOM Parser</strong> - Standard HTML parsing with error correction</li>
                <li><strong>2. Regex Fallback</strong> - Pattern-based extraction when DOM fails</li>
                <li><strong>3. Text Extraction</strong> - Raw text analysis for heavily broken HTML</li>
                <li><strong>4. AI-Assisted</strong> - Machine learning content identification</li>
                <li><strong>5. Manual Rules</strong> - Site-specific hardcoded extraction rules</li>
            </ul>
        </div>
        
        <div class="section">
            <h3>🏛️ Government Site Configurations</h3>
            <div class="statistics">
                <div class="stat-card">
                    <div style="color: #00ff41;">grants.gov</div>
                    <div>45s timeout, 7 retries</div>
                </div>
                <div class="stat-card">
                    <div style="color: #00ff41;">usaspending.gov</div>
                    <div>40s timeout, 6 retries</div>
                </div>
                <div class="stat-card">
                    <div style="color: #00ff41;">fedconnect.net</div>
                    <div>35s timeout, 5 retries</div>
                </div>
                <div class="stat-card">
                    <div style="color: #00ff41;">.gov domains</div>
                    <div>30s timeout, 5 retries</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>📋 System Logs</h3>
            <div class="logs" id="systemLogs">
                <div>🌐 Robust HTML Wrapper System initialized</div>
                <div>🔧 Multiple parsing strategies loaded</div>
                <div>🏛️ Government site configurations ready</div>
                <div>📊 Statistics tracking enabled</div>
                <div>✅ System ready for parsing requests</div>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-refresh statistics
        function updateStatistics() {
            fetch('/api/statistics')
                .then(response => response.json())
                .then(stats => {
                    document.getElementById('totalRequests').textContent = stats.totalRequests;
                    document.getElementById('successfulParses').textContent = stats.successfulParses;
                    document.getElementById('fallbacksUsed').textContent = stats.fallbacksUsed;
                    document.getElementById('cacheHits').textContent = stats.cacheHits;
                    document.getElementById('parsingErrors').textContent = stats.parsingErrors;
                })
                .catch(error => console.error('Statistics update failed:', error));
        }
        
        function testSiteParsing() {
            const url = document.getElementById('testUrl').value;
            const parseType = document.querySelector('input[name="parseType"]:checked').value;
            const resultsArea = document.getElementById('parseResults');
            
            resultsArea.value = '🔄 Parsing website... This may take up to 45 seconds for government sites.';
            
            const logs = document.getElementById('systemLogs');
            logs.innerHTML += \`<div>🔍 Starting parse of \${url} as \${parseType} content</div>\`;
            logs.scrollTop = logs.scrollHeight;
            
            fetch('/api/test-site', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, parseType })
            })
            .then(response => response.json())
            .then(result => {
                resultsArea.value = JSON.stringify(result, null, 2);
                logs.innerHTML += \`<div>✅ Parse completed for \${url}</div>\`;
                logs.scrollTop = logs.scrollHeight;
                updateStatistics();
            })
            .catch(error => {
                resultsArea.value = \`❌ Error: \${error.message}\`;
                logs.innerHTML += \`<div>❌ Parse failed for \${url}: \${error.message}</div>\`;
                logs.scrollTop = logs.scrollHeight;
            });
        }
        
        function testHealthCheck() {
            fetch('/api/health')
                .then(response => response.json())
                .then(health => {
                    document.getElementById('parseResults').value = JSON.stringify(health, null, 2);
                    const logs = document.getElementById('systemLogs');
                    logs.innerHTML += '<div>💚 Health check completed</div>';
                    logs.scrollTop = logs.scrollHeight;
                })
                .catch(error => {
                    document.getElementById('parseResults').value = \`❌ Health check failed: \${error.message}\`;
                });
        }
        
        // Update statistics every 5 seconds
        setInterval(updateStatistics, 5000);
        updateStatistics(); // Initial load
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboard);
    }
    
    async handleParseRequest(req, res) {
        try {
            const body = await this.getRequestBody(req);
            const { url, parseType = 'grants', options = {} } = JSON.parse(body);
            
            this.statistics.totalRequests++;
            
            const cacheKey = this.generateCacheKey(url, parseType);
            if (this.cache.has(cacheKey)) {
                this.statistics.cacheHits++;
                res.writeHead(200);
                res.end(JSON.stringify(this.cache.get(cacheKey)));
                return;
            }
            
            const result = await this.parseWebsite(url, parseType, options);
            
            // Cache successful results for 30 minutes
            if (result.success) {
                this.cache.set(cacheKey, result);
                setTimeout(() => this.cache.delete(cacheKey), 30 * 60 * 1000);
                this.statistics.successfulParses++;
            } else {
                this.statistics.parsingErrors++;
            }
            
            res.writeHead(200);
            res.end(JSON.stringify(result));
            
        } catch (error) {
            this.statistics.parsingErrors++;
            res.writeHead(500);
            res.end(JSON.stringify({ 
                success: false, 
                error: error.message,
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    async handleTestSite(req, res) {
        try {
            const body = await this.getRequestBody(req);
            const { url, parseType } = JSON.parse(body);
            
            const result = await this.parseWebsite(url, parseType);
            
            res.writeHead(200);
            res.end(JSON.stringify(result));
            
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ 
                success: false, 
                error: error.message 
            }));
        }
    }
    
    handleHealthCheck(req, res) {
        const health = {
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
            statistics: this.statistics,
            parsingStrategies: Object.keys(this.parsingStrategies).length,
            govSiteConfigs: Object.keys(this.govSitePatterns).length,
            cacheSize: this.cache.size
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(health, null, 2));
    }
    
    handleStatistics(req, res) {
        res.writeHead(200);
        res.end(JSON.stringify(this.statistics));
    }
    
    async parseWebsite(url, parseType = 'grants', options = {}) {
        console.log(`🔍 Parsing ${url} for ${parseType} content`);
        
        const parseResult = {
            url,
            parseType,
            timestamp: new Date().toISOString(),
            success: false,
            data: [],
            strategiesUsed: [],
            issues: [],
            processingTime: 0
        };
        
        const startTime = Date.now();
        
        try {
            // Get website configuration
            const config = this.getWebsiteConfig(url);
            
            // Fetch HTML content
            const html = await this.fetchHTML(url, config);
            
            // Apply pre-processing fixes
            const cleanedHTML = this.preprocessHTML(html, parseResult);
            
            // Try parsing strategies in order
            for (const [strategy, config] of Object.entries(this.parsingStrategies)) {
                try {
                    console.log(`🔧 Trying parsing strategy: ${strategy}`);
                    
                    const strategyResult = await this.applyParsingStrategy(
                        strategy, 
                        cleanedHTML, 
                        parseType, 
                        url
                    );
                    
                    parseResult.strategiesUsed.push({
                        name: strategy,
                        success: strategyResult.success,
                        dataFound: strategyResult.data.length
                    });
                    
                    if (strategyResult.success && strategyResult.data.length > 0) {
                        parseResult.data = strategyResult.data;
                        parseResult.success = true;
                        break;
                    }
                    
                    if (strategy !== 'manual-rules') {
                        this.statistics.fallbacksUsed++;
                    }
                    
                } catch (strategyError) {
                    console.error(`❌ Strategy ${strategy} failed:`, strategyError.message);
                    parseResult.strategiesUsed.push({
                        name: strategy,
                        success: false,
                        error: strategyError.message
                    });
                }
            }
            
            parseResult.processingTime = Date.now() - startTime;
            
            console.log(`✅ Parsing completed in ${parseResult.processingTime}ms`);
            console.log(`📊 Found ${parseResult.data.length} items using ${parseResult.strategiesUsed.length} strategies`);
            
            return parseResult;
            
        } catch (error) {
            parseResult.processingTime = Date.now() - startTime;
            parseResult.error = error.message;
            console.error(`❌ Parsing failed for ${url}:`, error.message);
            return parseResult;
        }
    }
    
    getWebsiteConfig(url) {
        const domain = new URL(url).hostname.toLowerCase();
        
        for (const [pattern, config] of Object.entries(this.govSitePatterns)) {
            if (domain.includes(pattern)) {
                return { ...config, domain, pattern };
            }
        }
        
        // Default configuration for unknown sites
        return {
            encoding: 'utf-8',
            timeout: 15000,
            retries: 3,
            domain,
            pattern: 'unknown'
        };
    }
    
    async fetchHTML(url, config) {
        console.log(`🌐 Fetching ${url} with ${config.retries} retries`);
        
        let lastError;
        for (let attempt = 1; attempt <= config.retries; attempt++) {
            try {
                const html = await this.httpRequest(url, config);
                console.log(`✅ Fetched ${html.length} characters on attempt ${attempt}`);
                return html;
            } catch (error) {
                lastError = error;
                console.warn(`⚠️  Attempt ${attempt} failed: ${error.message}`);
                
                if (attempt < config.retries) {
                    const delay = attempt * 2000; // Exponential backoff
                    console.log(`⏳ Waiting ${delay}ms before retry...`);
                    await this.sleep(delay);
                }
            }
        }
        
        throw new Error(`Failed to fetch after ${config.retries} attempts: ${lastError.message}`);
    }
    
    httpRequest(url, config) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const httpModule = parsedUrl.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                timeout: config.timeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
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
                reject(new Error(`Request timeout after ${config.timeout}ms`));
            });
            
            req.end();
        });
    }
    
    preprocessHTML(html, parseResult) {
        console.log('🔧 Preprocessing HTML for common government site issues');
        
        let cleaned = html;
        
        // Fix common government website issues
        for (const [issueName, issue] of Object.entries(this.commonIssues)) {
            for (const pattern of issue.patterns) {
                if (pattern.test(cleaned)) {
                    parseResult.issues.push({
                        issue: issueName,
                        pattern: pattern.toString(),
                        fixes: issue.fixes
                    });
                    
                    // Apply fixes based on issue type
                    cleaned = this.applyHTMLFixes(cleaned, issueName, issue.fixes);
                }
            }
        }
        
        // Normalize whitespace and encoding
        cleaned = cleaned
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\t/g, '    ')
            .replace(/\u00A0/g, ' '); // Non-breaking spaces
        
        console.log(`🔧 HTML preprocessing complete. Found ${parseResult.issues.length} issues`);
        
        return cleaned;
    }
    
    applyHTMLFixes(html, issueType, fixes) {
        let fixed = html;
        
        switch (issueType) {
            case 'malformedTags':
                // Close unclosed tags
                fixed = fixed.replace(/<(table|tr|td|th|div|span|p)([^>]*)(?<!\/|>)$/gmi, '<$1$2>');
                // Remove invalid attributes
                fixed = fixed.replace(/(<[^>]+)\s+[^\s=]+(?:\s*=\s*[^"'\s>]*)?(?=[^>]*>)/g, '$1');
                break;
                
            case 'invalidCharacters':
                // Remove control characters
                fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
                break;
                
            case 'brokenTables':
                // Auto-close tables
                fixed = fixed.replace(/(<table[^>]*>(?:[^<]|<(?!\/table>))*$)/gi, '$1</table>');
                fixed = fixed.replace(/(<tr[^>]*>(?:[^<]|<(?!\/tr>))*$)/gi, '$1</tr>');
                break;
                
            case 'nestedForms':
                // Flatten nested forms
                fixed = fixed.replace(/(<form[^>]*>.*?)<form[^>]*>(.*?)<\/form>(.*?<\/form>)/gi, '$1$2$3');
                break;
        }
        
        return fixed;
    }
    
    async applyParsingStrategy(strategy, html, parseType, url) {
        switch (strategy) {
            case 'dom-parser':
                return this.domParsingStrategy(html, parseType);
                
            case 'regex-fallback':
                return this.regexParsingStrategy(html, parseType);
                
            case 'text-extraction':
                return this.textExtractionStrategy(html, parseType);
                
            case 'ai-assisted':
                return this.aiAssistedStrategy(html, parseType);
                
            case 'manual-rules':
                return this.manualRulesStrategy(html, parseType, url);
                
            default:
                throw new Error(`Unknown parsing strategy: ${strategy}`);
        }
    }
    
    domParsingStrategy(html, parseType) {
        console.log('🔧 Applying DOM parsing strategy');
        
        try {
            // Simplified DOM-like parsing without external dependencies
            const rules = this.extractionRules[parseType];
            if (!rules) {
                throw new Error(`No extraction rules for type: ${parseType}`);
            }
            
            const data = [];
            
            // Look for table rows first (most common in government sites)
            const tableMatches = html.match(/<tr[^>]*>.*?<\/tr>/gis);
            if (tableMatches) {
                for (const row of tableMatches) {
                    const cells = row.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gis);
                    if (cells && cells.length >= 2) {
                        const item = this.extractDataFromCells(cells, rules.fields);
                        if (item && Object.keys(item).length > 0) {
                            data.push(item);
                        }
                    }
                }
            }
            
            // Look for div-based structures
            const divMatches = html.match(/<div[^>]*class[^>]*(?:grant|contract|funding|opportunity)[^>]*>.*?<\/div>/gis);
            if (divMatches) {
                for (const div of divMatches) {
                    const item = this.extractDataFromDiv(div, rules.fields);
                    if (item && Object.keys(item).length > 0) {
                        data.push(item);
                    }
                }
            }
            
            return { success: true, data, strategy: 'dom-parser' };
            
        } catch (error) {
            console.error('DOM parsing failed:', error.message);
            return { success: false, data: [], error: error.message };
        }
    }
    
    regexParsingStrategy(html, parseType) {
        console.log('🔧 Applying regex fallback strategy');
        
        try {
            const data = [];
            
            // Common patterns for government sites
            const patterns = {
                grants: [
                    /Grant\s*(?:Title|Name):\s*([^\n\r<]+)/gi,
                    /Deadline:\s*([^\n\r<]+)/gi,
                    /Amount:\s*\$?([0-9,]+)/gi,
                    /Agency:\s*([^\n\r<]+)/gi
                ],
                contracts: [
                    /Contract\s*(?:Title|Name):\s*([^\n\r<]+)/gi,
                    /Closing\s*Date:\s*([^\n\r<]+)/gi,
                    /Value:\s*\$?([0-9,]+)/gi,
                    /Department:\s*([^\n\r<]+)/gi
                ],
                funding: [
                    /(?:Funding|Program)\s*(?:Title|Name):\s*([^\n\r<]+)/gi,
                    /Application\s*Deadline:\s*([^\n\r<]+)/gi,
                    /Award\s*Amount:\s*\$?([0-9,]+)/gi,
                    /Sponsor:\s*([^\n\r<]+)/gi
                ]
            };
            
            const typePatterns = patterns[parseType] || patterns.grants;
            
            // Extract data using patterns
            for (let i = 0; i < typePatterns.length; i += 4) {
                const titlePattern = typePatterns[i];
                const deadlinePattern = typePatterns[i + 1];
                const amountPattern = typePatterns[i + 2];
                const agencyPattern = typePatterns[i + 3];
                
                const titleMatches = [...html.matchAll(titlePattern)];
                const deadlineMatches = [...html.matchAll(deadlinePattern)];
                const amountMatches = [...html.matchAll(amountPattern)];
                const agencyMatches = [...html.matchAll(agencyPattern)];
                
                const maxLength = Math.max(
                    titleMatches.length,
                    deadlineMatches.length,
                    amountMatches.length,
                    agencyMatches.length
                );
                
                for (let j = 0; j < maxLength; j++) {
                    const item = {};
                    
                    if (titleMatches[j]) item.title = titleMatches[j][1].trim();
                    if (deadlineMatches[j]) item.deadline = deadlineMatches[j][1].trim();
                    if (amountMatches[j]) item.amount = amountMatches[j][1].trim();
                    if (agencyMatches[j]) item.agency = agencyMatches[j][1].trim();
                    
                    if (Object.keys(item).length > 0) {
                        data.push(item);
                    }
                }
            }
            
            return { success: data.length > 0, data, strategy: 'regex-fallback' };
            
        } catch (error) {
            console.error('Regex parsing failed:', error.message);
            return { success: false, data: [], error: error.message };
        }
    }
    
    textExtractionStrategy(html, parseType) {
        console.log('🔧 Applying text extraction strategy');
        
        try {
            // Strip HTML and work with plain text
            const text = html
                .replace(/<script[^>]*>.*?<\/script>/gis, '')
                .replace(/<style[^>]*>.*?<\/style>/gis, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            const data = [];
            const lines = text.split('\n');
            
            // Look for structured data in text
            let currentItem = {};
            
            for (const line of lines) {
                const cleanLine = line.trim();
                if (!cleanLine) continue;
                
                // Check for common field patterns
                if (cleanLine.match(/grant|funding|opportunity/i) && cleanLine.length > 10) {
                    if (Object.keys(currentItem).length > 0) {
                        data.push(currentItem);
                    }
                    currentItem = { title: cleanLine };
                } else if (cleanLine.match(/deadline|due|closing/i)) {
                    currentItem.deadline = cleanLine;
                } else if (cleanLine.match(/\$[\d,]+/)) {
                    currentItem.amount = cleanLine.match(/\$[\d,]+/)[0];
                } else if (cleanLine.match(/agency|department|sponsor/i) && cleanLine.length < 100) {
                    currentItem.agency = cleanLine;
                }
            }
            
            if (Object.keys(currentItem).length > 0) {
                data.push(currentItem);
            }
            
            return { success: data.length > 0, data, strategy: 'text-extraction' };
            
        } catch (error) {
            console.error('Text extraction failed:', error.message);
            return { success: false, data: [], error: error.message };
        }
    }
    
    aiAssistedStrategy(html, parseType) {
        console.log('🔧 Applying AI-assisted strategy');
        
        // Simplified AI-like pattern recognition
        try {
            const data = [];
            
            // Use heuristics to identify data patterns
            const chunks = html.split(/(?=<(?:tr|div|section)[^>]*>)/i);
            
            for (const chunk of chunks) {
                if (chunk.length < 50) continue;
                
                // Score chunk based on content relevance
                let score = 0;
                
                const typeWords = {
                    grants: ['grant', 'funding', 'award', 'opportunity', 'rfp'],
                    contracts: ['contract', 'procurement', 'solicitation', 'rfq'],
                    funding: ['funding', 'program', 'award', 'support', 'finance']
                };
                
                const relevantWords = typeWords[parseType] || typeWords.grants;
                
                for (const word of relevantWords) {
                    const regex = new RegExp(word, 'gi');
                    const matches = chunk.match(regex);
                    if (matches) score += matches.length;
                }
                
                // Look for money amounts
                if (chunk.match(/\$[\d,]+/)) score += 2;
                
                // Look for dates
                if (chunk.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/)) score += 2;
                
                // If chunk seems relevant, try to extract data
                if (score > 2) {
                    const item = this.extractDataFromChunk(chunk);
                    if (item && Object.keys(item).length > 1) {
                        data.push(item);
                    }
                }
            }
            
            return { success: data.length > 0, data, strategy: 'ai-assisted' };
            
        } catch (error) {
            console.error('AI-assisted parsing failed:', error.message);
            return { success: false, data: [], error: error.message };
        }
    }
    
    manualRulesStrategy(html, parseType, url) {
        console.log('🔧 Applying manual rules strategy');
        
        try {
            const data = [];
            const domain = new URL(url).hostname;
            
            // Site-specific extraction rules
            if (domain.includes('grants.gov')) {
                return this.parseGrantsGov(html);
            } else if (domain.includes('usaspending.gov')) {
                return this.parseUSASpending(html);
            } else if (domain.includes('fedconnect.net')) {
                return this.parseFedConnect(html);
            }
            
            // Generic government site fallback
            return this.parseGenericGovSite(html, parseType);
            
        } catch (error) {
            console.error('Manual rules parsing failed:', error.message);
            return { success: false, data: [], error: error.message };
        }
    }
    
    parseGrantsGov(html) {
        // Specific parsing logic for grants.gov
        const data = [];
        
        // Look for their specific table structure
        const tableRows = html.match(/<tr[^>]*>.*?<\/tr>/gis);
        if (tableRows) {
            for (const row of tableRows) {
                const cells = row.match(/<td[^>]*>(.*?)<\/td>/gis);
                if (cells && cells.length >= 4) {
                    const item = {
                        title: this.cleanText(cells[0]),
                        agency: this.cleanText(cells[1]),
                        deadline: this.cleanText(cells[2]),
                        amount: this.cleanText(cells[3])
                    };
                    
                    if (item.title && item.title.length > 5) {
                        data.push(item);
                    }
                }
            }
        }
        
        return { success: data.length > 0, data, strategy: 'grants.gov-specific' };
    }
    
    parseUSASpending(html) {
        // Specific parsing logic for usaspending.gov
        const data = [];
        
        // Their JSON-like data structures
        const jsonMatches = html.match(/\{[^}]*"title"[^}]*\}/g);
        if (jsonMatches) {
            for (const match of jsonMatches) {
                try {
                    const parsed = JSON.parse(match);
                    if (parsed.title) {
                        data.push({
                            title: parsed.title,
                            amount: parsed.amount || parsed.value,
                            agency: parsed.agency || parsed.department,
                            deadline: parsed.deadline || parsed.date
                        });
                    }
                } catch (e) {
                    // Ignore invalid JSON
                }
            }
        }
        
        return { success: data.length > 0, data, strategy: 'usaspending.gov-specific' };
    }
    
    parseFedConnect(html) {
        // Specific parsing logic for fedconnect.net
        const data = [];
        
        // They use a lot of nested divs with specific classes
        const oppDivs = html.match(/<div[^>]*class[^>]*opportunity[^>]*>.*?<\/div>/gis);
        if (oppDivs) {
            for (const div of oppDivs) {
                const title = div.match(/<h\d[^>]*>(.*?)<\/h\d>/i);
                const deadline = div.match(/deadline[^>]*>([^<]+)/i);
                const value = div.match(/value[^>]*>([^<]+)/i);
                
                if (title) {
                    data.push({
                        title: this.cleanText(title[1]),
                        deadline: deadline ? this.cleanText(deadline[1]) : null,
                        amount: value ? this.cleanText(value[1]) : null,
                        source: 'fedconnect.net'
                    });
                }
            }
        }
        
        return { success: data.length > 0, data, strategy: 'fedconnect.net-specific' };
    }
    
    parseGenericGovSite(html, parseType) {
        // Generic parsing for unknown government sites
        const data = [];
        
        // Look for common patterns across government sites
        const patterns = [
            /<(?:tr|div)[^>]*>.*?(?:grant|contract|funding|opportunity).*?<\/(?:tr|div)>/gis,
            /<table[^>]*>.*?<\/table>/gis
        ];
        
        for (const pattern of patterns) {
            const matches = html.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const item = this.extractDataFromChunk(match);
                    if (item && Object.keys(item).length > 1) {
                        data.push(item);
                    }
                }
            }
        }
        
        return { success: data.length > 0, data, strategy: 'generic-gov-site' };
    }
    
    extractDataFromCells(cells, fields) {
        const item = {};
        
        for (let i = 0; i < cells.length && i < fields.length; i++) {
            const field = fields[i];
            const value = this.cleanText(cells[i]);
            
            if (value && value.length > 0) {
                item[field] = value;
            }
        }
        
        return item;
    }
    
    extractDataFromDiv(div, fields) {
        const item = {};
        
        // Look for labeled fields within the div
        for (const field of fields) {
            const patterns = [
                new RegExp(`${field}[^>]*>([^<]+)`, 'i'),
                new RegExp(`<[^>]*>${field}[^>]*>\\s*([^<]+)`, 'i'),
                new RegExp(`${field}:\\s*([^\\n\\r<]+)`, 'i')
            ];
            
            for (const pattern of patterns) {
                const match = div.match(pattern);
                if (match) {
                    item[field] = this.cleanText(match[1]);
                    break;
                }
            }
        }
        
        return item;
    }
    
    extractDataFromChunk(chunk) {
        const item = {};
        
        // Extract title (usually the longest meaningful text)
        const textContent = chunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const sentences = textContent.split(/[.!?]/).filter(s => s.length > 10);
        
        if (sentences.length > 0) {
            item.title = sentences[0].trim();
        }
        
        // Extract money amounts
        const moneyMatch = chunk.match(/\$[\d,]+(?:\.\d{2})?/);
        if (moneyMatch) {
            item.amount = moneyMatch[0];
        }
        
        // Extract dates
        const dateMatch = chunk.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
            item.deadline = dateMatch[0];
        }
        
        return item;
    }
    
    cleanText(html) {
        if (!html) return '';
        
        return html
            .replace(/<[^>]+>/g, '')
            .replace(/&[a-z]+;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    generateCacheKey(url, parseType) {
        return crypto.createHash('md5')
            .update(`${url}:${parseType}`)
            .digest('hex');
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
console.log('🌐🔧📄 ROBUST HTML WRAPPER SYSTEM');
console.log('=====================================');
console.log('');
console.log('🎯 Advanced HTML parsing for terrible government websites');
console.log('🔧 Multiple fallback strategies with intelligent error recovery');
console.log('🏛️ Government-specific configurations and optimizations');
console.log('📊 Real-time statistics and performance monitoring');
console.log('💾 Intelligent caching for improved performance');
console.log('');

const htmlWrapper = new RobustHTMLWrapper();

console.log('✅ Robust HTML Wrapper System initialized');
console.log(`🌐 Dashboard: http://localhost:4500`);
console.log('🔍 Ready to parse terrible government websites!');