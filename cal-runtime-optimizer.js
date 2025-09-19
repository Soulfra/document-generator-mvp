#!/usr/bin/env node

/**
 * 📊 CAL RUNTIME OPTIMIZER SERVICE
 * 
 * A live, queryable service where Cal actually helps optimize and fix things
 * instead of just being blamed for them.
 * 
 * Features:
 * - Real-time code analysis for TODO/FIXME/HACK comments
 * - Urgency queue system (critical/high/medium/low)
 * - Shortest path to fixes calculation
 * - Runtime optimization suggestions
 * - Integration with phpBB forums for live communication
 * - Service health monitoring and optimization
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

console.log('\n📊 CAL RUNTIME OPTIMIZER SERVICE INITIALIZING...');
console.log('===========================================');
console.log('🔍 Code analysis and optimization engine');
console.log('🚨 Urgency queue management system');
console.log('🛠️ Shortest path fix finder');
console.log('💬 phpBB forum integration ready');
console.log('☕ Coffee levels: Optimal');

class CalRuntimeOptimizer extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.port = options.port || 10001;
        this.app = express();
        
        // Configuration
        this.config = {
            scanInterval: options.scanInterval || 30000, // 30 seconds
            codebasePath: options.codebasePath || process.cwd(),
            phpbbIntegration: options.phpbbIntegration || 'http://localhost:9300',
            maxConcurrentFixes: options.maxConcurrentFixes || 3,
            coffeeThreshold: options.coffeeThreshold || 5 // Issues before coffee break
        };
        
        // Issue tracking
        this.issueQueue = {
            critical: [],
            high: [],
            medium: [],
            low: []
        };
        
        // Code annotations found
        this.codeAnnotations = new Map(); // file -> annotations
        this.fixHistory = [];
        this.activeFixCount = 0;
        
        // Cal's state
        this.calState = {
            mood: 'productive',
            coffeeLevel: 100,
            issuesFixed: 0,
            currentFocus: null,
            lastBreak: new Date()
        };
        
        // Service health metrics
        this.serviceHealth = new Map();
        
        this.initializeOptimizer();
    }
    
    async initializeOptimizer() {
        console.log('🔧 Setting up Cal Runtime Optimizer...');
        
        // Setup routes
        this.setupRoutes();
        
        // Start code scanning
        await this.startCodeScanning();
        
        // Monitor service health
        this.startHealthMonitoring();
        
        // Setup phpBB integration
        this.setupForumIntegration();
        
        console.log('✅ Cal Runtime Optimizer ready for action');
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboard());
        });
        
        // Query Cal for optimization advice
        this.app.post('/optimize', async (req, res) => {
            try {
                const result = await this.handleOptimizationRequest(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: error.message,
                    cal_says: "Let me check what went wrong... *adjusts glasses*"
                });
            }
        });
        
        // Get current issue queue
        this.app.get('/issues', (req, res) => {
            res.json({
                queue: this.issueQueue,
                total: this.getTotalIssueCount(),
                cal_state: this.calState,
                active_fixes: this.activeFixCount
            });
        });
        
        // Submit urgent issue
        this.app.post('/urgent', async (req, res) => {
            try {
                const result = await this.handleUrgentIssue(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get shortest path to fix
        this.app.post('/shortest-path', async (req, res) => {
            try {
                const path = await this.calculateShortestPath(req.body);
                res.json(path);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Service health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'operational',
                cal_status: this.calState,
                services: Object.fromEntries(this.serviceHealth),
                issues_in_queue: this.getTotalIssueCount(),
                uptime: process.uptime()
            });
        });
        
        // Cal's coffee break endpoint
        this.app.post('/coffee-break', (req, res) => {
            this.takeCoffeeBreak();
            res.json({
                message: "Taking a coffee break. Back in 5 minutes.",
                cal_says: "Even architects need caffeine",
                back_at: new Date(Date.now() + 5 * 60 * 1000)
            });
        });
    }
    
    async startCodeScanning() {
        console.log('🔍 Starting code annotation scanner...');
        
        // Initial scan
        await this.scanCodebase();
        
        // Periodic scanning
        setInterval(async () => {
            if (this.calState.mood !== 'on_break') {
                await this.scanCodebase();
            }
        }, this.config.scanInterval);
    }
    
    async scanCodebase() {
        const annotations = new Map();
        const patterns = {
            TODO: /\/\/\s*TODO\s*:?\s*(.+)/gi,
            FIXME: /\/\/\s*FIXME\s*:?\s*(.+)/gi,
            HACK: /\/\/\s*HACK\s*:?\s*(.+)/gi,
            BUG: /\/\/\s*BUG\s*:?\s*(.+)/gi,
            OPTIMIZE: /\/\/\s*OPTIMIZE\s*:?\s*(.+)/gi,
            XXX: /\/\/\s*XXX\s*:?\s*(.+)/gi
        };
        
        try {
            await this.scanDirectory(this.config.codebasePath, annotations, patterns);
            this.codeAnnotations = annotations;
            this.categorizeIssues();
        } catch (error) {
            console.error('Code scanning error:', error);
        }
    }
    
    async scanDirectory(dir, annotations, patterns) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            // Skip node_modules and hidden directories
            if (entry.name.startsWith('.') || entry.name === 'node_modules') {
                continue;
            }
            
            if (entry.isDirectory()) {
                await this.scanDirectory(fullPath, annotations, patterns);
            } else if (entry.isFile() && this.isCodeFile(entry.name)) {
                await this.scanFile(fullPath, annotations, patterns);
            }
        }
    }
    
    isCodeFile(filename) {
        const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs'];
        return extensions.some(ext => filename.endsWith(ext));
    }
    
    async scanFile(filePath, annotations, patterns) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\n');
            const fileAnnotations = [];
            
            lines.forEach((line, index) => {
                for (const [type, pattern] of Object.entries(patterns)) {
                    const matches = [...line.matchAll(pattern)];
                    matches.forEach(match => {
                        fileAnnotations.push({
                            type: type,
                            message: match[1].trim(),
                            line: index + 1,
                            urgency: this.determineUrgency(type, match[1]),
                            file: filePath
                        });
                    });
                }
            });
            
            if (fileAnnotations.length > 0) {
                annotations.set(filePath, fileAnnotations);
            }
        } catch (error) {
            // Ignore files we can't read
        }
    }
    
    determineUrgency(type, message) {
        const lowerMessage = message.toLowerCase();
        
        // Critical urgency patterns
        if (type === 'BUG' || lowerMessage.includes('critical') || 
            lowerMessage.includes('security') || lowerMessage.includes('urgent')) {
            return 'critical';
        }
        
        // High urgency
        if (type === 'FIXME' || lowerMessage.includes('broken') || 
            lowerMessage.includes('fix') || lowerMessage.includes('important')) {
            return 'high';
        }
        
        // Low urgency
        if (lowerMessage.includes('maybe') || lowerMessage.includes('consider') ||
            lowerMessage.includes('nice to have')) {
            return 'low';
        }
        
        // Default medium
        return 'medium';
    }
    
    categorizeIssues() {
        // Clear existing queues
        this.issueQueue = {
            critical: [],
            high: [],
            medium: [],
            low: []
        };
        
        // Categorize all annotations
        for (const [file, annotations] of this.codeAnnotations) {
            annotations.forEach(annotation => {
                this.issueQueue[annotation.urgency].push({
                    id: crypto.randomUUID(),
                    ...annotation,
                    discovered: new Date().toISOString()
                });
            });
        }
        
        // Update Cal's mood based on issue count
        const totalIssues = this.getTotalIssueCount();
        if (totalIssues > 50) {
            this.calState.mood = 'overwhelmed';
        } else if (totalIssues > 20) {
            this.calState.mood = 'busy';
        } else {
            this.calState.mood = 'productive';
        }
    }
    
    getTotalIssueCount() {
        return Object.values(this.issueQueue).reduce((sum, queue) => sum + queue.length, 0);
    }
    
    async handleOptimizationRequest(request) {
        const { query, context, urgency = 'medium' } = request;
        
        console.log('🔧 Cal analyzing optimization request:', query);
        
        // Decrease coffee level
        this.calState.coffeeLevel = Math.max(0, this.calState.coffeeLevel - 5);
        
        // Find related issues
        const relatedIssues = this.findRelatedIssues(query);
        
        // Calculate optimization strategy
        const strategy = this.calculateOptimizationStrategy(relatedIssues, context);
        
        // Generate Cal's response
        const response = {
            analysis: strategy,
            related_issues: relatedIssues.slice(0, 5),
            cal_says: this.getCalAdvice(strategy),
            estimated_time: this.estimateFixTime(relatedIssues),
            coffee_required: Math.ceil(relatedIssues.length / 5),
            priority: urgency
        };
        
        // Add to queue if urgent
        if (urgency === 'critical' || urgency === 'high') {
            this.issueQueue[urgency].push({
                id: crypto.randomUUID(),
                type: 'OPTIMIZATION',
                message: query,
                file: 'user_request',
                line: 0,
                urgency: urgency,
                discovered: new Date().toISOString()
            });
        }
        
        return response;
    }
    
    findRelatedIssues(query) {
        const keywords = query.toLowerCase().split(/\s+/);
        const related = [];
        
        for (const [file, annotations] of this.codeAnnotations) {
            annotations.forEach(annotation => {
                const score = keywords.reduce((sum, keyword) => {
                    return sum + (annotation.message.toLowerCase().includes(keyword) ? 1 : 0);
                }, 0);
                
                if (score > 0) {
                    related.push({ ...annotation, relevance_score: score });
                }
            });
        }
        
        // Sort by relevance and urgency
        return related.sort((a, b) => {
            if (a.relevance_score !== b.relevance_score) {
                return b.relevance_score - a.relevance_score;
            }
            return this.urgencyValue(b.urgency) - this.urgencyValue(a.urgency);
        });
    }
    
    urgencyValue(urgency) {
        const values = { critical: 4, high: 3, medium: 2, low: 1 };
        return values[urgency] || 0;
    }
    
    calculateOptimizationStrategy(issues, context) {
        const strategy = {
            approach: 'systematic',
            steps: [],
            patterns: new Map(),
            estimated_impact: 'medium'
        };
        
        // Group issues by type and file
        issues.forEach(issue => {
            const pattern = issue.type + ':' + issue.file;
            if (!strategy.patterns.has(pattern)) {
                strategy.patterns.set(pattern, []);
            }
            strategy.patterns.get(pattern).push(issue);
        });
        
        // Determine approach
        if (issues.length > 20) {
            strategy.approach = 'batch_processing';
            strategy.steps.push('Group similar issues together');
            strategy.steps.push('Create reusable fix patterns');
            strategy.steps.push('Apply fixes in batches');
        } else if (issues.some(i => i.urgency === 'critical')) {
            strategy.approach = 'triage';
            strategy.steps.push('Fix critical issues first');
            strategy.steps.push('Implement temporary workarounds');
            strategy.steps.push('Schedule comprehensive fixes');
        } else {
            strategy.steps.push('Review and prioritize issues');
            strategy.steps.push('Fix high-impact issues first');
            strategy.steps.push('Refactor related code sections');
        }
        
        // Estimate impact
        const criticalCount = issues.filter(i => i.urgency === 'critical').length;
        if (criticalCount > 0) {
            strategy.estimated_impact = 'high';
        } else if (issues.length > 10) {
            strategy.estimated_impact = 'significant';
        }
        
        return strategy;
    }
    
    getCalAdvice(strategy) {
        const adviceTemplates = {
            batch_processing: [
                "This needs systematic refactoring. I'll batch these fixes together.",
                "Multiple related issues detected. Time for some architectural improvements.",
                "I see a pattern here. Let me optimize the whole subsystem."
            ],
            triage: [
                "Critical issues detected. Dropping everything to fix these first.",
                "We need immediate action. I'll implement quick fixes now, proper solutions later.",
                "Red alert! Focusing on critical fixes. Someone bring coffee."
            ],
            systematic: [
                "Standard optimization needed. I'll work through these methodically.",
                "Nothing too urgent. Following best practices for these fixes.",
                "Routine maintenance required. Should be straightforward."
            ]
        };
        
        const templates = adviceTemplates[strategy.approach] || adviceTemplates.systematic;
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    estimateFixTime(issues) {
        // Base time per issue type (in minutes)
        const timePerType = {
            BUG: 30,
            FIXME: 20,
            TODO: 15,
            OPTIMIZE: 25,
            HACK: 35,
            XXX: 10
        };
        
        let totalMinutes = 0;
        issues.forEach(issue => {
            totalMinutes += timePerType[issue.type] || 15;
        });
        
        // Add overhead for context switching
        totalMinutes += issues.length * 5;
        
        // Convert to readable format
        if (totalMinutes < 60) {
            return totalMinutes + ' minutes';
        } else if (totalMinutes < 480) {
            return Math.round(totalMinutes / 60) + ' hours';
        } else {
            return Math.round(totalMinutes / 480) + ' days';
        }
    }
    
    async handleUrgentIssue(issue) {
        console.log('🚨 Urgent issue received:', issue.message);
        
        const urgentIssue = {
            id: crypto.randomUUID(),
            type: 'URGENT',
            message: issue.message,
            file: issue.file || 'forum_request',
            line: issue.line || 0,
            urgency: 'critical',
            discovered: new Date().toISOString(),
            requester: issue.requester || 'anonymous'
        };
        
        // Add to critical queue
        this.issueQueue.critical.unshift(urgentIssue);
        
        // Notify Cal
        this.calState.currentFocus = urgentIssue;
        
        // Calculate fix approach
        const approach = await this.calculateShortestPath({ issues: [urgentIssue] });
        
        return {
            issue_id: urgentIssue.id,
            cal_response: "Urgent issue received. Analyzing now...",
            approach: approach,
            eta: "15 minutes for initial assessment",
            queue_position: 1
        };
    }
    
    async calculateShortestPath(request) {
        const { issues = [] } = request;
        
        // Build dependency graph
        const dependencies = await this.analyzeDependencies(issues);
        
        // Calculate fix order
        const fixOrder = this.topologicalSort(dependencies);
        
        // Estimate effort for each step
        const steps = fixOrder.map((issueId, index) => {
            const issue = this.findIssueById(issueId);
            return {
                step: index + 1,
                issue: issue,
                estimated_time: this.estimateSingleFixTime(issue),
                dependencies: dependencies.get(issueId) || [],
                can_parallelize: dependencies.get(issueId)?.length === 0
            };
        });
        
        // Calculate critical path
        const criticalPath = this.calculateCriticalPath(steps);
        
        return {
            total_issues: issues.length,
            fix_order: steps,
            critical_path: criticalPath,
            estimated_total_time: this.sumTime(criticalPath),
            parallel_opportunities: steps.filter(s => s.can_parallelize).length,
            cal_recommendation: this.getPathRecommendation(steps)
        };
    }
    
    async analyzeDependencies(issues) {
        // Simplified dependency analysis
        // In real implementation, would analyze code structure
        const dependencies = new Map();
        
        issues.forEach(issue => {
            const deps = [];
            
            // Critical issues have no dependencies
            if (issue.urgency !== 'critical') {
                // Check if issue mentions other files
                issues.forEach(other => {
                    if (other.id !== issue.id && issue.message.includes(path.basename(other.file))) {
                        deps.push(other.id);
                    }
                });
            }
            
            dependencies.set(issue.id, deps);
        });
        
        return dependencies;
    }
    
    topologicalSort(dependencies) {
        // Simple topological sort for dependency resolution
        const sorted = [];
        const visited = new Set();
        
        const visit = (nodeId) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            
            const deps = dependencies.get(nodeId) || [];
            deps.forEach(dep => visit(dep));
            
            sorted.push(nodeId);
        };
        
        for (const nodeId of dependencies.keys()) {
            visit(nodeId);
        }
        
        return sorted;
    }
    
    calculateCriticalPath(steps) {
        // Find the longest path through dependencies
        return steps.filter(step => 
            step.issue.urgency === 'critical' || 
            step.dependencies.length > 0
        );
    }
    
    sumTime(steps) {
        const totalMinutes = steps.reduce((sum, step) => {
            const time = parseInt(step.estimated_time) || 0;
            return sum + time;
        }, 0);
        
        return totalMinutes + ' minutes';
    }
    
    estimateSingleFixTime(issue) {
        const baseTime = {
            critical: 45,
            high: 30,
            medium: 20,
            low: 10
        };
        
        return baseTime[issue.urgency] || 15;
    }
    
    getPathRecommendation(steps) {
        if (steps.length === 0) {
            return "No issues to fix. Time for coffee!";
        } else if (steps.length === 1) {
            return "Single issue. Direct fix approach.";
        } else if (steps.some(s => s.can_parallelize)) {
            return "Multiple independent issues. Consider parallel fixing.";
        } else {
            return "Dependencies detected. Follow the suggested order.";
        }
    }
    
    findIssueById(id) {
        for (const urgency of Object.keys(this.issueQueue)) {
            const issue = this.issueQueue[urgency].find(i => i.id === id);
            if (issue) return issue;
        }
        return null;
    }
    
    setupForumIntegration() {
        console.log('💬 Setting up phpBB forum integration...');
        
        // Listen for forum events
        this.on('forum_mention', async (data) => {
            const { thread_id, message, urgency, author } = data;
            
            if (urgency === 'urgent' || message.includes('@cal.urgent')) {
                await this.handleUrgentIssue({
                    message: message,
                    requester: author,
                    forum_thread: thread_id
                });
            }
        });
    }
    
    startHealthMonitoring() {
        console.log('📊 Starting service health monitoring...');
        
        // Monitor common services
        const services = [
            { name: 'database', url: 'http://localhost:5432', type: 'tcp' },
            { name: 'redis', url: 'http://localhost:6379', type: 'tcp' },
            { name: 'universal-brain', url: 'http://localhost:9999/api/health' },
            { name: 'orchestration', url: 'http://localhost:20000/health' }
        ];
        
        setInterval(async () => {
            for (const service of services) {
                try {
                    if (service.type === 'http') {
                        const response = await fetch(service.url);
                        this.serviceHealth.set(service.name, {
                            status: response.ok ? 'healthy' : 'unhealthy',
                            latency: 0,
                            last_check: new Date().toISOString()
                        });
                    } else {
                        // Simplified TCP check
                        this.serviceHealth.set(service.name, {
                            status: 'assumed_healthy',
                            last_check: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    this.serviceHealth.set(service.name, {
                        status: 'unreachable',
                        error: error.message,
                        last_check: new Date().toISOString()
                    });
                }
            }
        }, 30000); // Every 30 seconds
    }
    
    takeCoffeeBreak() {
        this.calState.mood = 'on_break';
        this.calState.lastBreak = new Date();
        this.calState.coffeeLevel = 100;
        
        setTimeout(() => {
            this.calState.mood = 'productive';
            console.log('☕ Cal is back from coffee break!');
        }, 5 * 60 * 1000); // 5 minutes
    }
    
    generateDashboard() {
        const criticalCount = this.issueQueue.critical.length;
        const totalIssues = this.getTotalIssueCount();
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>📊 Cal Runtime Optimizer - Live Dashboard</title>
    <style>
        body {
            background: #0f0f0f;
            color: #0f0;
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
        }
        .header {
            border: 2px solid #0f0;
            padding: 20px;
            margin-bottom: 20px;
            text-align: center;
        }
        .title {
            font-size: 2em;
            margin-bottom: 10px;
            text-shadow: 0 0 10px #0f0;
        }
        .cal-state {
            background: #1a1a1a;
            border: 1px solid #0f0;
            padding: 15px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-around;
        }
        .stat {
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            color: #0ff;
        }
        .queue-section {
            margin-bottom: 30px;
        }
        .queue-header {
            background: #1a1a1a;
            padding: 10px;
            border-left: 5px solid #0f0;
        }
        .critical { border-left-color: #f00; }
        .high { border-left-color: #fa0; }
        .medium { border-left-color: #ff0; }
        .low { border-left-color: #0f0; }
        .issue {
            background: #111;
            padding: 10px;
            margin: 5px 0;
            border-left: 3px solid #333;
            font-size: 0.9em;
        }
        .coffee-meter {
            width: 200px;
            height: 20px;
            background: #333;
            border: 1px solid #0f0;
            position: relative;
            margin: 10px auto;
        }
        .coffee-level {
            height: 100%;
            background: #8B4513;
            width: ${this.calState.coffeeLevel}%;
            transition: width 0.3s;
        }
        .services {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .service {
            background: #1a1a1a;
            padding: 15px;
            border: 1px solid #0f0;
            text-align: center;
        }
        .healthy { color: #0f0; }
        .unhealthy { color: #f00; }
        .unreachable { color: #666; }
        pre {
            background: #111;
            padding: 10px;
            overflow-x: auto;
            border: 1px solid #333;
        }
    </style>
    <script>
        // Auto-refresh every 5 seconds
        setTimeout(() => location.reload(), 5000);
    </script>
</head>
<body>
    <div class="header">
        <div class="title">📊 CAL RUNTIME OPTIMIZER</div>
        <div>Real-time System Optimization & Fix Management</div>
    </div>
    
    <div class="cal-state">
        <div class="stat">
            <div>Mood</div>
            <div class="stat-value">${this.calState.mood.toUpperCase()}</div>
        </div>
        <div class="stat">
            <div>Issues Fixed</div>
            <div class="stat-value">${this.calState.issuesFixed}</div>
        </div>
        <div class="stat">
            <div>Active Fixes</div>
            <div class="stat-value">${this.activeFixCount}</div>
        </div>
        <div class="stat">
            <div>Total Issues</div>
            <div class="stat-value">${totalIssues}</div>
        </div>
    </div>
    
    <div style="text-align: center;">
        <div>Coffee Level</div>
        <div class="coffee-meter">
            <div class="coffee-level"></div>
        </div>
        <small>${this.calState.coffeeLevel}% - ${this.calState.coffeeLevel < 30 ? 'NEED COFFEE!' : 'Good to go'}</small>
    </div>
    
    <div class="queue-section">
        <div class="queue-header critical">
            🚨 CRITICAL (${this.issueQueue.critical.length})
        </div>
        ${this.renderIssues(this.issueQueue.critical.slice(0, 3))}
    </div>
    
    <div class="queue-section">
        <div class="queue-header high">
            ⚠️ HIGH (${this.issueQueue.high.length})
        </div>
        ${this.renderIssues(this.issueQueue.high.slice(0, 3))}
    </div>
    
    <div class="queue-section">
        <div class="queue-header medium">
            📌 MEDIUM (${this.issueQueue.medium.length})
        </div>
        ${this.renderIssues(this.issueQueue.medium.slice(0, 2))}
    </div>
    
    <div class="queue-section">
        <div class="queue-header low">
            📝 LOW (${this.issueQueue.low.length})
        </div>
        ${this.renderIssues(this.issueQueue.low.slice(0, 2))}
    </div>
    
    <h3>🏥 Service Health</h3>
    <div class="services">
        ${Array.from(this.serviceHealth).map(([name, health]) => `
            <div class="service">
                <div>${name}</div>
                <div class="${health.status}">${health.status.toUpperCase()}</div>
            </div>
        `).join('')}
    </div>
    
    <h3>📊 Cal's Current Analysis</h3>
    <pre>
${this.calState.currentFocus ? 
    'Currently focusing on: ' + this.calState.currentFocus.message :
    'Scanning for optimization opportunities...'}

Last break: ${this.calState.lastBreak.toLocaleTimeString()}
Uptime: ${Math.floor(process.uptime() / 60)} minutes
    </pre>
    
    <div style="margin-top: 40px; text-align: center; opacity: 0.7;">
        <small>Dashboard auto-refreshes every 5 seconds</small><br>
        <small>Cal says: "${this.getCalQuote()}"</small>
    </div>
</body>
</html>`;
    }
    
    renderIssues(issues) {
        if (issues.length === 0) {
            return '<div class="issue">No issues in this category</div>';
        }
        
        return issues.map(issue => `
            <div class="issue">
                <strong>${issue.type}</strong>: ${issue.message}<br>
                <small>${path.basename(issue.file)}:${issue.line}</small>
            </div>
        `).join('');
    }
    
    getCalQuote() {
        const quotes = [
            "Code is like coffee - it's better when it's properly filtered",
            "I don't always optimize, but when I do, I prefer O(1)",
            "There are only two hard things in CS: cache invalidation and blaming Cal",
            "It's not a bug, it's an undocumented optimization opportunity",
            "I've seen things you people wouldn't believe... Attack ships on fire off the shoulder of Orion...",
            "The database is fine. Your query, however...",
            "Have you tried adding an index? No? There's your problem",
            "In the beginning was the Word, and the Word was 'TODO'",
            "I optimize therefore I am",
            "Coffee is just runtime fuel with better error messages"
        ];
        
        return quotes[Math.floor(Math.random() * quotes.length)];
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log('\n📊 CAL RUNTIME OPTIMIZER STARTED!');
            console.log('================================');
            console.log('🌐 Dashboard: http://localhost:' + this.port);
            console.log('📡 API Endpoints:');
            console.log('   POST /optimize - Get optimization advice');
            console.log('   GET  /issues - View current issue queue');
            console.log('   POST /urgent - Submit urgent issue');
            console.log('   POST /shortest-path - Calculate fix order');
            console.log('   GET  /health - Service health check');
            console.log('');
            console.log('☕ Cal is online and ready to optimize!');
            console.log('📊 Scanning codebase for annotations...');
        });
    }
}

// Start the service
const optimizer = new CalRuntimeOptimizer({
    codebasePath: path.resolve(__dirname)
});

optimizer.start();

module.exports = CalRuntimeOptimizer;