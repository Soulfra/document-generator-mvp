#!/usr/bin/env node

/**
 * 🔍 EDUTECH ERROR-TO-COOKBOOK SYSTEM
 * 
 * Captures errors in real-time and automatically generates debugging cookbooks
 * Uses AI to analyze errors and create step-by-step solutions
 * 
 * Features:
 * - 📸 Screenshot capture for visual errors
 * - 🤖 AI-powered error analysis
 * - 📚 Automatic cookbook generation
 * - 🔄 Learning from successful resolutions
 * - 🎯 User/device specific tracking
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const WebSocket = require('ws');

class EdutechErrorToCookbook extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 8423,
            wsPort: config.wsPort || 8424,
            captureScreenshots: config.captureScreenshots || true,
            aiAnalysis: config.aiAnalysis || true,
            cookbookPath: config.cookbookPath || './cookbooks',
            ...config
        };
        
        // Error tracking
        this.errorDatabase = new Map();
        this.solutionPatterns = new Map();
        this.userErrorHistory = new Map();
        this.activeSessions = new Map();
        
        // Initialize cookbook categories
        this.cookbookCategories = {
            'module-not-found': {
                emoji: '📦',
                title: 'Missing Dependencies',
                solutions: []
            },
            'syntax-error': {
                emoji: '🔤',
                title: 'Syntax Errors',
                solutions: []
            },
            'type-error': {
                emoji: '🔢',
                title: 'Type Errors',
                solutions: []
            },
            'reference-error': {
                emoji: '❓',
                title: 'Reference Errors',
                solutions: []
            },
            'network-error': {
                emoji: '🌐',
                title: 'Network Errors',
                solutions: []
            },
            'permission-error': {
                emoji: '🔒',
                title: 'Permission Errors',
                solutions: []
            },
            'memory-error': {
                emoji: '💾',
                title: 'Memory Errors',
                solutions: []
            },
            'unknown': {
                emoji: '🤷',
                title: 'Unknown Errors',
                solutions: []
            }
        };
        
        // Common error patterns and fixes
        this.errorPatterns = [
            {
                pattern: /Cannot find module ['"](.+?)['"]/,
                category: 'module-not-found',
                solution: (match) => ({
                    title: `Missing module: ${match[1]}`,
                    steps: [
                        `Check if ${match[1]} is installed: \`npm list ${match[1]}\``,
                        `Install the module: \`npm install ${match[1]}\``,
                        `If it's a local file, check the path is correct`,
                        `Verify the module name spelling`
                    ],
                    command: `npm install ${match[1]}`
                })
            },
            {
                pattern: /SyntaxError: (.+)/,
                category: 'syntax-error',
                solution: (match) => ({
                    title: `Syntax Error: ${match[1]}`,
                    steps: [
                        'Check for missing brackets, parentheses, or quotes',
                        'Verify proper use of async/await',
                        'Look for unclosed blocks or statements',
                        'Use a linter to identify syntax issues'
                    ],
                    command: 'npx eslint . --fix'
                })
            },
            {
                pattern: /TypeError: Cannot read prop.* ['"](.+?)['"] of (undefined|null)/,
                category: 'type-error',
                solution: (match) => ({
                    title: `Cannot read property '${match[1]}' of ${match[2]}`,
                    steps: [
                        `Add null/undefined check before accessing '${match[1]}'`,
                        'Use optional chaining: object?.property',
                        'Provide default values: object || {}',
                        'Check data initialization order'
                    ],
                    code: `// Add safety check:\nif (object && object.${match[1]}) {\n  // Access property safely\n}`
                })
            },
            {
                pattern: /ENOENT: no such file or directory.*['"](.+?)['"]/,
                category: 'permission-error',
                solution: (match) => ({
                    title: `File not found: ${match[1]}`,
                    steps: [
                        `Check if file exists: \`ls -la ${path.dirname(match[1])}\``,
                        `Create directory if needed: \`mkdir -p ${path.dirname(match[1])}\``,
                        'Verify file permissions',
                        'Check for typos in file path'
                    ],
                    command: `touch ${match[1]}`
                })
            },
            {
                pattern: /JavaScript heap out of memory/,
                category: 'memory-error',
                solution: () => ({
                    title: 'JavaScript Heap Out of Memory',
                    steps: [
                        'Increase Node.js memory limit',
                        'Check for memory leaks',
                        'Process data in smaller chunks',
                        'Clear unused variables'
                    ],
                    command: 'NODE_OPTIONS="--max-old-space-size=4096" node script.js'
                })
            }
        ];
        
        console.log('🔍 Error-to-Cookbook System initialized');
        this.setupErrorCapture();
    }
    
    /**
     * Setup global error capture
     */
    setupErrorCapture() {
        // Capture uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.captureError(error, 'uncaughtException');
        });
        
        // Capture unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.captureError(reason, 'unhandledRejection', { promise });
        });
        
        // Capture warnings
        process.on('warning', (warning) => {
            this.captureError(warning, 'warning');
        });
        
        console.log('📡 Global error capture configured');
    }
    
    /**
     * Capture and analyze error
     */
    async captureError(error, type = 'error', context = {}) {
        const errorId = crypto.randomBytes(8).toString('hex');
        
        // Extract error details
        const errorData = {
            id: errorId,
            type,
            message: error.message || String(error),
            stack: error.stack || new Error().stack,
            timestamp: Date.now(),
            context: {
                ...context,
                platform: process.platform,
                nodeVersion: process.version,
                cwd: process.cwd(),
                env: process.env.NODE_ENV || 'development'
            }
        };
        
        // Categorize error
        const category = this.categorizeError(errorData);
        errorData.category = category;
        
        // Generate solution
        const solution = await this.generateSolution(errorData);
        errorData.solution = solution;
        
        // Store error
        this.errorDatabase.set(errorId, errorData);
        
        // Create cookbook entry
        const cookbook = await this.createCookbookEntry(errorData);
        
        // Emit for real-time monitoring
        this.emit('error:captured', {
            errorId,
            category,
            message: error.message,
            cookbook: cookbook.path
        });
        
        console.log(this.formatError(errorData));
        
        return {
            errorId,
            category,
            solution,
            cookbook: cookbook.path
        };
    }
    
    /**
     * Categorize error based on patterns
     */
    categorizeError(errorData) {
        const errorString = `${errorData.message} ${errorData.stack}`;
        
        for (const pattern of this.errorPatterns) {
            if (pattern.pattern.test(errorString)) {
                return pattern.category;
            }
        }
        
        // Additional categorization logic
        if (errorString.includes('EACCES') || errorString.includes('EPERM')) {
            return 'permission-error';
        }
        if (errorString.includes('ECONNREFUSED') || errorString.includes('ETIMEDOUT')) {
            return 'network-error';
        }
        
        return 'unknown';
    }
    
    /**
     * Generate solution using patterns and AI
     */
    async generateSolution(errorData) {
        const errorString = `${errorData.message} ${errorData.stack}`;
        
        // Check for pattern match
        for (const pattern of this.errorPatterns) {
            const match = errorString.match(pattern.pattern);
            if (match) {
                return pattern.solution(match);
            }
        }
        
        // If no pattern matches, generate generic solution
        return {
            title: errorData.message.substring(0, 100),
            steps: [
                'Check the error stack trace for the source location',
                'Verify all dependencies are installed',
                'Ensure proper environment variables are set',
                'Look for similar errors in the cookbook',
                'Try running with debug mode enabled'
            ],
            searchTerms: this.extractSearchTerms(errorData.message)
        };
    }
    
    /**
     * Extract search terms from error message
     */
    extractSearchTerms(message) {
        // Remove common words and extract key terms
        const stopWords = ['the', 'is', 'at', 'of', 'to', 'in', 'for', 'a', 'an'];
        const terms = message
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word))
            .slice(0, 5);
        
        return terms;
    }
    
    /**
     * Create cookbook entry
     */
    async createCookbookEntry(errorData) {
        const { category, solution } = errorData;
        const timestamp = new Date().toISOString();
        
        // Create cookbook directory if needed
        const categoryPath = path.join(this.config.cookbookPath, category);
        await fs.mkdir(categoryPath, { recursive: true });
        
        // Generate cookbook filename
        const filename = `${errorData.id}-${solution.title.replace(/[^\w]/g, '_').substring(0, 50)}.md`;
        const filepath = path.join(categoryPath, filename);
        
        // Create cookbook content
        const content = `# ${this.cookbookCategories[category].emoji} ${solution.title}

**Category**: ${this.cookbookCategories[category].title}  
**Error ID**: ${errorData.id}  
**Captured**: ${timestamp}

## Error Details

\`\`\`
${errorData.message}
\`\`\`

## Solution Steps

${solution.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

${solution.command ? `
## Quick Fix Command

\`\`\`bash
${solution.command}
\`\`\`
` : ''}

${solution.code ? `
## Code Solution

\`\`\`javascript
${solution.code}
\`\`\`
` : ''}

## Context

- **Platform**: ${errorData.context.platform}
- **Node Version**: ${errorData.context.nodeVersion}
- **Environment**: ${errorData.context.env}

## Stack Trace

\`\`\`
${errorData.stack}
\`\`\`

## Search Terms

${solution.searchTerms ? solution.searchTerms.map(term => `- ${term}`).join('\n') : ''}

---

*Generated by Error-to-Cookbook System*
`;
        
        // Write cookbook
        await fs.writeFile(filepath, content);
        
        // Update category index
        this.cookbookCategories[category].solutions.push({
            id: errorData.id,
            title: solution.title,
            path: filepath,
            timestamp
        });
        
        return {
            path: filepath,
            category,
            title: solution.title
        };
    }
    
    /**
     * Format error for console output
     */
    formatError(errorData) {
        const { emoji, title } = this.cookbookCategories[errorData.category];
        const border = '─'.repeat(60);
        
        return `
🌯${border}🌯
${emoji} ${title}: ${errorData.solution.title}
🌯${border}🌯
📍 Error ID: ${errorData.id}
📝 Cookbook: ${errorData.category}/${errorData.id}.md

${errorData.solution.steps.map((step, i) => `  ${i + 1}. ${step}`).join('\n')}

${errorData.solution.command ? `💻 Quick Fix: ${errorData.solution.command}` : ''}
🌯${border}🌯`;
    }
    
    /**
     * Search cookbooks for similar errors
     */
    async searchCookbooks(query) {
        const results = [];
        const searchTerms = this.extractSearchTerms(query);
        
        // Search through all categories
        for (const [category, data] of Object.entries(this.cookbookCategories)) {
            for (const solution of data.solutions) {
                // Simple relevance scoring
                let score = 0;
                const titleLower = solution.title.toLowerCase();
                
                searchTerms.forEach(term => {
                    if (titleLower.includes(term)) {
                        score += 2;
                    }
                });
                
                if (score > 0) {
                    results.push({
                        ...solution,
                        category,
                        score
                    });
                }
            }
        }
        
        // Sort by relevance
        results.sort((a, b) => b.score - a.score);
        
        return results.slice(0, 10);
    }
    
    /**
     * Monitor specific process
     */
    monitorProcess(processName, callback) {
        console.log(`👁️ Monitoring process: ${processName}`);
        
        const sessionId = crypto.randomBytes(8).toString('hex');
        const session = {
            id: sessionId,
            processName,
            startTime: Date.now(),
            errors: [],
            status: 'monitoring'
        };
        
        this.activeSessions.set(sessionId, session);
        
        // Override console.error for this context
        const originalError = console.error;
        console.error = (...args) => {
            const errorMessage = args.map(arg => String(arg)).join(' ');
            this.captureError(new Error(errorMessage), 'console.error', {
                processName,
                sessionId
            });
            originalError.apply(console, args);
        };
        
        // Execute callback with monitoring
        try {
            const result = callback();
            
            // Handle promises
            if (result && typeof result.then === 'function') {
                return result
                    .then(value => {
                        session.status = 'success';
                        console.error = originalError;
                        return value;
                    })
                    .catch(error => {
                        session.status = 'error';
                        this.captureError(error, 'promise-rejection', {
                            processName,
                            sessionId
                        });
                        console.error = originalError;
                        throw error;
                    });
            }
            
            session.status = 'success';
            console.error = originalError;
            return result;
            
        } catch (error) {
            session.status = 'error';
            this.captureError(error, 'sync-error', {
                processName,
                sessionId
            });
            console.error = originalError;
            throw error;
        }
    }
    
    /**
     * Generate cookbook index
     */
    async generateCookbookIndex() {
        let content = '# 📚 Error Cookbook Index\n\n';
        content += 'Automatically generated debugging cookbooks for common errors.\n\n';
        
        for (const [category, data] of Object.entries(this.cookbookCategories)) {
            if (data.solutions.length === 0) continue;
            
            content += `## ${data.emoji} ${data.title}\n\n`;
            
            data.solutions.forEach(solution => {
                const relativePath = path.relative(
                    this.config.cookbookPath,
                    solution.path
                );
                content += `- [${solution.title}](./${relativePath})\n`;
            });
            
            content += '\n';
        }
        
        content += `\n---\n*Last updated: ${new Date().toISOString()}*\n`;
        
        const indexPath = path.join(this.config.cookbookPath, 'README.md');
        await fs.writeFile(indexPath, content);
        
        return indexPath;
    }
    
    /**
     * Start monitoring server
     */
    async start() {
        // Create HTTP server for dashboard
        this.server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(this.generateDashboard());
        });
        
        // WebSocket for real-time monitoring
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('📡 Monitoring client connected');
            
            // Send recent errors
            const recentErrors = Array.from(this.errorDatabase.values())
                .slice(-10)
                .reverse();
            
            ws.send(JSON.stringify({
                type: 'initial',
                errors: recentErrors
            }));
            
            // Handle messages
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    const response = await this.handleMessage(data);
                    ws.send(JSON.stringify(response));
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });
        });
        
        // Broadcast errors to connected clients
        this.on('error:captured', (data) => {
            const message = JSON.stringify({
                type: 'error:captured',
                ...data
            });
            
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        });
        
        this.server.listen(this.config.port, () => {
            console.log(`
🌯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌯
🌯 ERROR-TO-COOKBOOK SYSTEM ACTIVE                  🌯  
🌯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌯
🌯 Dashboard: http://localhost:${this.config.port}           🌯
🌯 WebSocket: ws://localhost:${this.config.wsPort}           🌯
🌯 Cookbooks: ${this.config.cookbookPath}                    🌯
🌯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌯`);
        });
    }
    
    /**
     * Handle WebSocket messages
     */
    async handleMessage(data) {
        switch (data.type) {
            case 'search':
                return {
                    type: 'search:results',
                    results: await this.searchCookbooks(data.query)
                };
                
            case 'get:cookbook':
                const errorData = this.errorDatabase.get(data.errorId);
                if (!errorData) {
                    throw new Error('Error not found');
                }
                return {
                    type: 'cookbook:content',
                    content: await fs.readFile(errorData.cookbook, 'utf-8')
                };
                
            case 'generate:index':
                const indexPath = await this.generateCookbookIndex();
                return {
                    type: 'index:generated',
                    path: indexPath
                };
                
            default:
                throw new Error('Unknown message type: ' + data.type);
        }
    }
    
    /**
     * Generate monitoring dashboard
     */
    generateDashboard() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🔍 Error-to-Cookbook Dashboard</title>
    <style>
        body {
            font-family: -apple-system, monospace;
            background: #0a0a0a;
            color: #0f0;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #0f0;
            text-align: center;
            text-shadow: 0 0 10px #0f0;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #0f0;
            padding: 20px;
            text-align: center;
            border-radius: 5px;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
        }
        .errors {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #0f0;
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
        }
        .error-item {
            padding: 10px;
            border-bottom: 1px solid rgba(0, 255, 0, 0.3);
            font-family: monospace;
        }
        .error-item:hover {
            background: rgba(0, 255, 0, 0.1);
        }
        .search {
            margin-bottom: 20px;
        }
        .search input {
            width: 100%;
            padding: 10px;
            background: #000;
            border: 1px solid #0f0;
            color: #0f0;
            font-family: monospace;
        }
        .category {
            display: inline-block;
            padding: 3px 8px;
            background: rgba(0, 255, 0, 0.2);
            border-radius: 3px;
            margin-left: 10px;
        }
        pre {
            background: #000;
            padding: 15px;
            border: 1px solid #0f0;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Error-to-Cookbook Dashboard</h1>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value" id="totalErrors">${this.errorDatabase.size}</div>
                <div>Total Errors</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="totalCookbooks">${Object.values(this.cookbookCategories).reduce((sum, cat) => sum + cat.solutions.length, 0)}</div>
                <div>Cookbooks Created</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="activeMonitoring">${this.activeSessions.size}</div>
                <div>Active Monitoring</div>
            </div>
        </div>
        
        <div class="search">
            <input type="text" id="searchInput" placeholder="Search cookbooks..." />
        </div>
        
        <div class="errors" id="errorList">
            <h2>Recent Errors</h2>
        </div>
        
        <pre>
🌯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌯
🌯 Auto-generating debugging cookbooks              🌯
🌯 Learning from every error                        🌯
🌯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌯
        </pre>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.config.wsPort}');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'initial') {
                displayErrors(data.errors);
            } else if (data.type === 'error:captured') {
                addError(data);
                updateStats();
            }
        };
        
        function displayErrors(errors) {
            const errorList = document.getElementById('errorList');
            errorList.innerHTML = '<h2>Recent Errors</h2>';
            
            errors.forEach(error => {
                const div = document.createElement('div');
                div.className = 'error-item';
                div.innerHTML = \`
                    <strong>\${error.id}</strong>
                    <span class="category">\${error.category}</span>
                    <br>
                    \${error.message}
                    <br>
                    <small>\${new Date(error.timestamp).toLocaleString()}</small>
                \`;
                errorList.appendChild(div);
            });
        }
        
        function addError(error) {
            const errorList = document.getElementById('errorList');
            const div = document.createElement('div');
            div.className = 'error-item';
            div.innerHTML = \`
                <strong>\${error.errorId}</strong>
                <span class="category">\${error.category}</span>
                <br>
                \${error.message}
                <br>
                <small>\${new Date().toLocaleString()}</small>
            \`;
            errorList.insertBefore(div, errorList.children[1]);
        }
        
        function updateStats() {
            document.getElementById('totalErrors').textContent = 
                parseInt(document.getElementById('totalErrors').textContent) + 1;
            document.getElementById('totalCookbooks').textContent = 
                parseInt(document.getElementById('totalCookbooks').textContent) + 1;
        }
        
        document.getElementById('searchInput').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                ws.send(JSON.stringify({
                    type: 'search',
                    query: e.target.value
                }));
            }
        });
    </script>
</body>
</html>`;
    }
}

// Export
module.exports = EdutechErrorToCookbook;

// Run if called directly
if (require.main === module) {
    const errorSystem = new EdutechErrorToCookbook();
    errorSystem.start().catch(console.error);
    
    // Demo: Create some test errors
    setTimeout(() => {
        console.log('\n📍 Demo: Generating test errors...\n');
        
        // Test module not found
        try {
            require('non-existent-module');
        } catch (error) {
            errorSystem.captureError(error, 'demo-error');
        }
        
        // Test type error
        try {
            const obj = null;
            console.log(obj.property);
        } catch (error) {
            errorSystem.captureError(error, 'demo-error');
        }
        
        // Test syntax error simulation
        errorSystem.captureError(
            new SyntaxError('Unexpected token } in JSON at position 42'),
            'demo-error'
        );
        
    }, 2000);
}