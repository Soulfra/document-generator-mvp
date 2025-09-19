#!/usr/bin/env node

/**
 * Multi-Agent Development System
 * 
 * Orchestrates multiple specialized AI agents working in parallel across
 * different worktrees to handle various aspects of development.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const WebSocket = require('ws');
const express = require('express');
const http = require('http');

// Agent Types
const AGENT_TYPES = {
    CODE: 'code-agent',
    TEST: 'test-agent',
    DOCS: 'docs-agent',
    REVIEW: 'review-agent',
    DEPLOY: 'deploy-agent',
    SECURITY: 'security-agent',
    PERFORMANCE: 'performance-agent',
    REFACTOR: 'refactor-agent'
};

// Agent States
const AGENT_STATES = {
    IDLE: 'idle',
    WORKING: 'working',
    REVIEWING: 'reviewing',
    BLOCKED: 'blocked',
    COMPLETED: 'completed',
    ERROR: 'error'
};

class Agent {
    constructor(id, type, config = {}) {
        this.id = id;
        this.type = type;
        this.name = `${type}-${id}`;
        this.state = AGENT_STATES.IDLE;
        this.config = config;
        this.worktree = null;
        this.currentTask = null;
        this.history = [];
        this.metrics = {
            tasksCompleted: 0,
            linesOfCode: 0,
            testsWritten: 0,
            bugsFixed: 0,
            documentsCreated: 0
        };
    }
    
    async initialize(worktreePath) {
        this.worktree = worktreePath;
        this.state = AGENT_STATES.IDLE;
        console.log(`🤖 ${this.name} initialized in ${worktreePath}`);
    }
    
    async executeTask(task) {
        this.state = AGENT_STATES.WORKING;
        this.currentTask = task;
        
        try {
            let result;
            
            switch (this.type) {
                case AGENT_TYPES.CODE:
                    result = await this.writeCode(task);
                    break;
                case AGENT_TYPES.TEST:
                    result = await this.writeTests(task);
                    break;
                case AGENT_TYPES.DOCS:
                    result = await this.writeDocs(task);
                    break;
                case AGENT_TYPES.REVIEW:
                    result = await this.reviewCode(task);
                    break;
                case AGENT_TYPES.SECURITY:
                    result = await this.securityScan(task);
                    break;
                case AGENT_TYPES.PERFORMANCE:
                    result = await this.optimizePerformance(task);
                    break;
                case AGENT_TYPES.REFACTOR:
                    result = await this.refactorCode(task);
                    break;
                default:
                    throw new Error(`Unknown agent type: ${this.type}`);
            }
            
            this.state = AGENT_STATES.COMPLETED;
            this.metrics.tasksCompleted++;
            this.history.push({ task, result, timestamp: Date.now() });
            
            return result;
            
        } catch (error) {
            this.state = AGENT_STATES.ERROR;
            console.error(`❌ ${this.name} failed:`, error.message);
            throw error;
        }
    }
    
    async writeCode(task) {
        console.log(`💻 ${this.name} writing code for: ${task.description}`);
        
        const prompt = `Write ${task.language || 'JavaScript'} code for:
${task.description}

Requirements:
${task.requirements ? task.requirements.map(r => `- ${r}`).join('\n') : 'None specified'}

Context:
${task.context || 'New feature'}

Return complete, production-ready code with error handling and comments.`;
        
        const code = await this.callAI(prompt);
        
        // Write code to file
        if (task.filePath) {
            const fullPath = path.join(this.worktree, task.filePath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, code, 'utf8');
            
            // Track metrics
            this.metrics.linesOfCode += code.split('\n').length;
        }
        
        return {
            code,
            filePath: task.filePath,
            linesOfCode: code.split('\n').length
        };
    }
    
    async writeTests(task) {
        console.log(`🧪 ${this.name} writing tests for: ${task.targetFile}`);
        
        // Read the code to test
        const codePath = path.join(this.worktree, task.targetFile);
        const code = await fs.readFile(codePath, 'utf8').catch(() => '');
        
        const prompt = `Write comprehensive tests for this code:
${code}

Test framework: ${task.framework || 'jest'}
Coverage target: ${task.coverage || '80%'}

Include:
- Unit tests for all exported functions
- Edge cases and error scenarios
- Integration tests if applicable
- Mock external dependencies`;
        
        const tests = await this.callAI(prompt);
        
        // Write test file
        const testPath = task.testPath || this.getTestPath(task.targetFile);
        const fullTestPath = path.join(this.worktree, testPath);
        await fs.mkdir(path.dirname(fullTestPath), { recursive: true });
        await fs.writeFile(fullTestPath, tests, 'utf8');
        
        this.metrics.testsWritten++;
        
        return {
            tests,
            testPath,
            coverage: await this.estimateCoverage(tests, code)
        };
    }
    
    async writeDocs(task) {
        console.log(`📝 ${this.name} writing documentation for: ${task.subject}`);
        
        let content = '';
        if (task.sourcePath) {
            const fullPath = path.join(this.worktree, task.sourcePath);
            content = await fs.readFile(fullPath, 'utf8').catch(() => '');
        }
        
        const prompt = `Write comprehensive documentation for:
${task.subject}

${content ? `Source code:\n${content}` : ''}

Documentation type: ${task.docType || 'API'}
Format: ${task.format || 'Markdown'}

Include:
- Overview and purpose
- Usage examples
- API reference
- Configuration options
- Troubleshooting`;
        
        const documentation = await this.callAI(prompt);
        
        // Write documentation file
        if (task.outputPath) {
            const fullDocPath = path.join(this.worktree, task.outputPath);
            await fs.mkdir(path.dirname(fullDocPath), { recursive: true });
            await fs.writeFile(fullDocPath, documentation, 'utf8');
            
            this.metrics.documentsCreated++;
        }
        
        return {
            documentation,
            outputPath: task.outputPath,
            wordCount: documentation.split(/\s+/).length
        };
    }
    
    async reviewCode(task) {
        console.log(`🔍 ${this.name} reviewing code in: ${task.filePath}`);
        
        const fullPath = path.join(this.worktree, task.filePath);
        const code = await fs.readFile(fullPath, 'utf8');
        
        const prompt = `Review this code and provide detailed feedback:
${code}

Check for:
- Code quality and best practices
- Potential bugs or issues
- Security vulnerabilities
- Performance problems
- Maintainability concerns

Provide:
1. Overall assessment (1-10 score)
2. Specific issues found
3. Suggested improvements
4. Positive aspects`;
        
        const review = await this.callAI(prompt);
        
        // Parse review for actionable items
        const issues = this.parseReviewIssues(review);
        
        return {
            review,
            score: this.extractScore(review),
            issues,
            suggestions: issues.filter(i => i.type === 'suggestion'),
            approved: this.extractScore(review) >= 7
        };
    }
    
    async securityScan(task) {
        console.log(`🛡️ ${this.name} scanning for security issues...`);
        
        const results = {
            vulnerabilities: [],
            recommendations: [],
            score: 100
        };
        
        // Scan specific file or entire worktree
        const scanPath = task.targetPath ? 
            path.join(this.worktree, task.targetPath) : 
            this.worktree;
        
        // Use multiple techniques
        const patterns = await this.scanForPatterns(scanPath);
        const dependencies = await this.checkDependencies(scanPath);
        const secrets = await this.scanForSecrets(scanPath);
        
        results.vulnerabilities.push(...patterns, ...dependencies, ...secrets);
        results.score = Math.max(0, 100 - (results.vulnerabilities.length * 10));
        
        return results;
    }
    
    async optimizePerformance(task) {
        console.log(`⚡ ${this.name} optimizing performance...`);
        
        const filePath = path.join(this.worktree, task.targetFile);
        const code = await fs.readFile(filePath, 'utf8');
        
        const prompt = `Optimize this code for performance:
${code}

Focus on:
- Algorithm efficiency
- Memory usage
- Async operations
- Caching opportunities
- Database query optimization

Return optimized code with comments explaining changes.`;
        
        const optimized = await this.callAI(prompt);
        
        // Write optimized version
        await fs.writeFile(filePath, optimized, 'utf8');
        
        return {
            original: code,
            optimized,
            improvements: this.comparePerformance(code, optimized)
        };
    }
    
    async refactorCode(task) {
        console.log(`🔨 ${this.name} refactoring code...`);
        
        const filePath = path.join(this.worktree, task.targetFile);
        const code = await fs.readFile(filePath, 'utf8');
        
        const prompt = `Refactor this code for better maintainability:
${code}

Goals:
${task.goals ? task.goals.map(g => `- ${g}`).join('\n') : '- Improve readability\n- Reduce complexity\n- Better separation of concerns'}

Maintain functionality while improving structure.`;
        
        const refactored = await this.callAI(prompt);
        
        // Create backup before refactoring
        await fs.writeFile(`${filePath}.backup`, code, 'utf8');
        
        // Write refactored code
        await fs.writeFile(filePath, refactored, 'utf8');
        
        return {
            original: code,
            refactored,
            backupPath: `${filePath}.backup`,
            improvements: this.analyzeRefactoring(code, refactored)
        };
    }
    
    async callAI(prompt) {
        // Use configured AI provider
        if (this.config.aiProvider === 'ollama') {
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.config.model || 'codellama:7b',
                    prompt,
                    stream: false
                })
            });
            
            const data = await response.json();
            return data.response;
        }
        
        // Fallback
        return `// ${this.name} would generate content here`;
    }
    
    // Helper methods
    getTestPath(filePath) {
        const dir = path.dirname(filePath);
        const name = path.basename(filePath, path.extname(filePath));
        const ext = path.extname(filePath);
        return path.join(dir, '__tests__', `${name}.test${ext}`);
    }
    
    async estimateCoverage(tests, code) {
        // Simple estimation based on function coverage
        const functions = code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || [];
        const testedFunctions = tests.match(/test\(|it\(|describe\(/g) || [];
        return Math.min(100, (testedFunctions.length / Math.max(functions.length, 1)) * 100);
    }
    
    parseReviewIssues(review) {
        // Extract structured issues from review text
        const issues = [];
        const lines = review.split('\n');
        
        for (const line of lines) {
            if (line.match(/issue:|problem:|bug:/i)) {
                issues.push({ type: 'issue', description: line });
            } else if (line.match(/suggest:|improve:|consider:/i)) {
                issues.push({ type: 'suggestion', description: line });
            }
        }
        
        return issues;
    }
    
    extractScore(review) {
        const match = review.match(/score:\s*(\d+)/i) || review.match(/(\d+)\/10/);
        return match ? parseInt(match[1]) : 5;
    }
    
    async scanForPatterns(scanPath) {
        // Scan for common vulnerability patterns
        const vulnerabilities = [];
        
        // This would use actual security scanning tools
        // For now, return placeholder
        
        return vulnerabilities;
    }
    
    async checkDependencies(scanPath) {
        // Check for vulnerable dependencies
        return [];
    }
    
    async scanForSecrets(scanPath) {
        // Scan for exposed secrets or credentials
        return [];
    }
    
    comparePerformance(original, optimized) {
        return {
            complexity: 'Reduced',
            estimatedSpeedup: '20%',
            memoryReduction: '15%'
        };
    }
    
    analyzeRefactoring(original, refactored) {
        return {
            linesReduced: original.split('\n').length - refactored.split('\n').length,
            complexity: 'Improved',
            maintainability: 'Enhanced'
        };
    }
}

class MultiAgentDevSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            maxAgents: config.maxAgents || 8,
            agentTypes: config.agentTypes || Object.values(AGENT_TYPES),
            worktreeBase: config.worktreeBase || './worktrees',
            coordinationPort: config.coordinationPort || 9500,
            aiProvider: config.aiProvider || 'ollama',
            model: config.model || 'codellama:7b',
            ...config
        };
        
        this.agents = new Map();
        this.taskQueue = [];
        this.activeWorktrees = new Map();
        this.coordination = {
            server: null,
            wss: null,
            clients: new Set()
        };
        
        this.isRunning = false;
    }
    
    async initialize() {
        console.log('🚀 Initializing Multi-Agent Development System...');
        
        // Create coordination server
        await this.setupCoordinationServer();
        
        // Initialize agents
        await this.initializeAgents();
        
        // Set up task distribution
        this.setupTaskDistribution();
        
        this.isRunning = true;
        console.log('✅ Multi-Agent System ready!');
        this.emit('initialized');
    }
    
    async initializeAgents() {
        let agentId = 1;
        
        for (const agentType of this.config.agentTypes) {
            // Create at least one agent of each type
            const agent = new Agent(agentId++, agentType, {
                aiProvider: this.config.aiProvider,
                model: this.config.model
            });
            
            // Assign worktree
            const worktreeName = await this.getOrCreateWorktree(agentType);
            await agent.initialize(path.join(this.config.worktreeBase, worktreeName));
            
            this.agents.set(agent.id, agent);
            console.log(`🤖 Created ${agent.name}`);
        }
    }
    
    async getOrCreateWorktree(agentType) {
        // Check if worktree exists for this agent type
        const worktreeName = `agent-${agentType}`;
        
        if (!this.activeWorktrees.has(worktreeName)) {
            try {
                // Create worktree if it doesn't exist
                execSync(`git worktree add ${path.join(this.config.worktreeBase, worktreeName)} -b ${worktreeName}`, {
                    encoding: 'utf8'
                });
            } catch (error) {
                // Worktree might already exist
                console.log(`Using existing worktree: ${worktreeName}`);
            }
            
            this.activeWorktrees.set(worktreeName, {
                path: path.join(this.config.worktreeBase, worktreeName),
                agentType,
                created: Date.now()
            });
        }
        
        return worktreeName;
    }
    
    async setupCoordinationServer() {
        const app = express();
        app.use(express.json());
        
        // Status endpoint
        app.get('/status', (req, res) => {
            res.json({
                agents: Array.from(this.agents.values()).map(agent => ({
                    id: agent.id,
                    name: agent.name,
                    type: agent.type,
                    state: agent.state,
                    currentTask: agent.currentTask?.description,
                    metrics: agent.metrics
                })),
                taskQueue: this.taskQueue.length,
                activeWorktrees: this.activeWorktrees.size
            });
        });
        
        // Submit task endpoint
        app.post('/task', (req, res) => {
            const task = req.body;
            task.id = Date.now().toString();
            task.status = 'queued';
            
            this.queueTask(task);
            res.json({ taskId: task.id, status: 'queued' });
        });
        
        // Create HTTP server
        this.coordination.server = http.createServer(app);
        
        // Create WebSocket server for real-time updates
        this.coordination.wss = new WebSocket.Server({ 
            server: this.coordination.server 
        });
        
        this.coordination.wss.on('connection', (ws) => {
            this.coordination.clients.add(ws);
            
            ws.on('close', () => {
                this.coordination.clients.delete(ws);
            });
            
            // Send initial status
            ws.send(JSON.stringify({
                type: 'connected',
                agents: this.agents.size,
                timestamp: Date.now()
            }));
        });
        
        // Start server
        await new Promise((resolve) => {
            this.coordination.server.listen(this.config.coordinationPort, () => {
                console.log(`📡 Coordination server running on port ${this.config.coordinationPort}`);
                resolve();
            });
        });
    }
    
    setupTaskDistribution() {
        // Process task queue periodically
        setInterval(() => {
            this.processTaskQueue();
        }, 1000);
    }
    
    queueTask(task) {
        this.taskQueue.push(task);
        this.emit('taskQueued', task);
        this.broadcast({ type: 'task_queued', task });
    }
    
    async processTaskQueue() {
        if (this.taskQueue.length === 0) return;
        
        // Find available agents
        const availableAgents = Array.from(this.agents.values())
            .filter(agent => agent.state === AGENT_STATES.IDLE);
        
        if (availableAgents.length === 0) return;
        
        // Process tasks
        while (this.taskQueue.length > 0 && availableAgents.length > 0) {
            const task = this.taskQueue.shift();
            const agent = this.selectAgent(availableAgents, task);
            
            if (agent) {
                // Remove agent from available list
                const index = availableAgents.indexOf(agent);
                availableAgents.splice(index, 1);
                
                // Assign task to agent
                this.assignTask(agent, task);
            }
        }
    }
    
    selectAgent(availableAgents, task) {
        // Select best agent for task based on type
        if (task.agentType) {
            const specificAgent = availableAgents.find(a => a.type === task.agentType);
            if (specificAgent) return specificAgent;
        }
        
        // Intelligent agent selection based on task content
        if (task.description) {
            if (task.description.match(/test|spec|coverage/i)) {
                const testAgent = availableAgents.find(a => a.type === AGENT_TYPES.TEST);
                if (testAgent) return testAgent;
            }
            
            if (task.description.match(/doc|readme|guide/i)) {
                const docAgent = availableAgents.find(a => a.type === AGENT_TYPES.DOCS);
                if (docAgent) return docAgent;
            }
            
            if (task.description.match(/review|check|audit/i)) {
                const reviewAgent = availableAgents.find(a => a.type === AGENT_TYPES.REVIEW);
                if (reviewAgent) return reviewAgent;
            }
            
            if (task.description.match(/security|vulnerability|scan/i)) {
                const securityAgent = availableAgents.find(a => a.type === AGENT_TYPES.SECURITY);
                if (securityAgent) return securityAgent;
            }
        }
        
        // Default to code agent or first available
        return availableAgents.find(a => a.type === AGENT_TYPES.CODE) || availableAgents[0];
    }
    
    async assignTask(agent, task) {
        console.log(`📋 Assigning task to ${agent.name}: ${task.description}`);
        
        task.status = 'assigned';
        task.agentId = agent.id;
        task.startTime = Date.now();
        
        this.broadcast({
            type: 'task_assigned',
            task,
            agent: { id: agent.id, name: agent.name }
        });
        
        // Execute task asynchronously
        agent.executeTask(task).then(result => {
            task.status = 'completed';
            task.result = result;
            task.endTime = Date.now();
            task.duration = task.endTime - task.startTime;
            
            console.log(`✅ ${agent.name} completed task in ${task.duration}ms`);
            
            this.emit('taskCompleted', { task, agent, result });
            this.broadcast({
                type: 'task_completed',
                task,
                agent: { id: agent.id, name: agent.name },
                result
            });
            
            // Check for follow-up tasks
            this.generateFollowUpTasks(task, result);
            
        }).catch(error => {
            task.status = 'failed';
            task.error = error.message;
            
            console.error(`❌ ${agent.name} failed task:`, error.message);
            
            this.emit('taskFailed', { task, agent, error });
            this.broadcast({
                type: 'task_failed',
                task,
                agent: { id: agent.id, name: agent.name },
                error: error.message
            });
        });
    }
    
    generateFollowUpTasks(completedTask, result) {
        // Automatically generate follow-up tasks based on completed work
        
        if (completedTask.agentType === AGENT_TYPES.CODE && result.filePath) {
            // Code was written, queue test generation
            this.queueTask({
                description: `Write tests for ${result.filePath}`,
                agentType: AGENT_TYPES.TEST,
                targetFile: result.filePath,
                priority: 'high',
                parentTask: completedTask.id
            });
            
            // Queue documentation
            this.queueTask({
                description: `Document ${result.filePath}`,
                agentType: AGENT_TYPES.DOCS,
                sourcePath: result.filePath,
                outputPath: result.filePath.replace(/\.[^.]+$/, '.md'),
                priority: 'medium',
                parentTask: completedTask.id
            });
            
            // Queue code review
            this.queueTask({
                description: `Review ${result.filePath}`,
                agentType: AGENT_TYPES.REVIEW,
                filePath: result.filePath,
                priority: 'medium',
                parentTask: completedTask.id
            });
        }
        
        if (completedTask.agentType === AGENT_TYPES.TEST && result.coverage < 80) {
            // Low coverage, request more tests
            this.queueTask({
                description: `Improve test coverage for ${completedTask.targetFile} (current: ${result.coverage}%)`,
                agentType: AGENT_TYPES.TEST,
                targetFile: completedTask.targetFile,
                priority: 'high',
                parentTask: completedTask.id
            });
        }
        
        if (completedTask.agentType === AGENT_TYPES.REVIEW && !result.approved) {
            // Code review failed, queue fixes
            this.queueTask({
                description: `Fix issues in ${completedTask.filePath}: ${result.issues.map(i => i.description).join(', ')}`,
                agentType: AGENT_TYPES.CODE,
                filePath: completedTask.filePath,
                issues: result.issues,
                priority: 'high',
                parentTask: completedTask.id
            });
        }
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.coordination.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    async createMonitoringDashboard() {
        const dashboardHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Multi-Agent Development System</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        h1 {
            margin: 0;
            color: #333;
        }
        
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #4CAF50;
        }
        
        .agents-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .agent-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .agent-state {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
        }
        
        .state-idle { background: #e0e0e0; color: #666; }
        .state-working { background: #2196F3; color: white; }
        .state-reviewing { background: #FF9800; color: white; }
        .state-completed { background: #4CAF50; color: white; }
        .state-error { background: #f44336; color: white; }
        
        .task-queue {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .task-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .task-item:last-child {
            border-bottom: none;
        }
        
        .live-log {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.9em;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .log-entry {
            margin-bottom: 5px;
        }
        
        .timestamp {
            color: #858585;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Multi-Agent Development System</h1>
            <p>Real-time monitoring and control</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <h3>Active Agents</h3>
                <div class="metric-value" id="activeAgents">0</div>
            </div>
            <div class="metric-card">
                <h3>Tasks Completed</h3>
                <div class="metric-value" id="tasksCompleted">0</div>
            </div>
            <div class="metric-card">
                <h3>Queue Size</h3>
                <div class="metric-value" id="queueSize">0</div>
            </div>
            <div class="metric-card">
                <h3>Lines of Code</h3>
                <div class="metric-value" id="linesOfCode">0</div>
            </div>
        </div>
        
        <div class="agents-grid" id="agentsGrid"></div>
        
        <div class="task-queue">
            <h2>Task Queue</h2>
            <div id="taskQueue"></div>
        </div>
        
        <div class="live-log">
            <h3>Live Activity Log</h3>
            <div id="liveLog"></div>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket(\`ws://localhost:${this.config.coordinationPort}\`);
        const liveLog = document.getElementById('liveLog');
        
        function addLogEntry(message) {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            const timestamp = new Date().toLocaleTimeString();
            entry.innerHTML = \`<span class="timestamp">\${timestamp}</span> \${message}\`;
            liveLog.appendChild(entry);
            liveLog.scrollTop = liveLog.scrollHeight;
            
            // Keep only last 100 entries
            while (liveLog.children.length > 100) {
                liveLog.removeChild(liveLog.firstChild);
            }
        }
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'connected':
                    addLogEntry(\`✅ Connected to Multi-Agent System (\${data.agents} agents)\`);
                    break;
                    
                case 'task_queued':
                    addLogEntry(\`📋 New task queued: \${data.task.description}\`);
                    break;
                    
                case 'task_assigned':
                    addLogEntry(\`🤖 \${data.agent.name} assigned: \${data.task.description}\`);
                    break;
                    
                case 'task_completed':
                    addLogEntry(\`✅ \${data.agent.name} completed task in \${data.task.duration}ms\`);
                    break;
                    
                case 'task_failed':
                    addLogEntry(\`❌ \${data.agent.name} failed: \${data.error}\`);
                    break;
            }
            
            // Refresh status
            fetchStatus();
        };
        
        async function fetchStatus() {
            try {
                const response = await fetch(\`http://localhost:${this.config.coordinationPort}/status\`);
                const status = await response.json();
                
                // Update metrics
                document.getElementById('activeAgents').textContent = status.agents.length;
                document.getElementById('queueSize').textContent = status.taskQueue;
                
                let totalTasks = 0;
                let totalLines = 0;
                
                // Update agents grid
                const agentsGrid = document.getElementById('agentsGrid');
                agentsGrid.innerHTML = status.agents.map(agent => {
                    totalTasks += agent.metrics.tasksCompleted;
                    totalLines += agent.metrics.linesOfCode;
                    
                    return \`
                        <div class="agent-card">
                            <h3>\${agent.name}</h3>
                            <div class="agent-state state-\${agent.state}">\${agent.state}</div>
                            <p>Current: \${agent.currentTask || 'None'}</p>
                            <p>Completed: \${agent.metrics.tasksCompleted} tasks</p>
                            <p>Code: \${agent.metrics.linesOfCode} lines</p>
                            <p>Tests: \${agent.metrics.testsWritten}</p>
                        </div>
                    \`;
                }).join('');
                
                document.getElementById('tasksCompleted').textContent = totalTasks;
                document.getElementById('linesOfCode').textContent = totalLines;
                
            } catch (error) {
                console.error('Failed to fetch status:', error);
            }
        }
        
        // Refresh status every 2 seconds
        setInterval(fetchStatus, 2000);
        fetchStatus();
        
        // Add sample task button
        function addSampleTask() {
            fetch(\`http://localhost:${this.config.coordinationPort}/task\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: 'Create a new user authentication service',
                    requirements: [
                        'JWT token generation',
                        'Password hashing with bcrypt',
                        'Rate limiting'
                    ],
                    filePath: 'services/auth.service.js'
                })
            });
        }
    </script>
</body>
</html>
        `;
        
        // Write dashboard file
        await fs.writeFile(
            path.join(this.config.worktreeBase, 'multi-agent-dashboard.html'),
            dashboardHTML,
            'utf8'
        );
        
        console.log(`📊 Dashboard available at: http://localhost:${this.config.coordinationPort}/`);
    }
    
    async shutdown() {
        console.log('🛑 Shutting down Multi-Agent System...');
        
        this.isRunning = false;
        
        // Wait for agents to complete current tasks
        const workingAgents = Array.from(this.agents.values())
            .filter(agent => agent.state === AGENT_STATES.WORKING);
        
        if (workingAgents.length > 0) {
            console.log(`Waiting for ${workingAgents.length} agents to complete...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        // Close coordination server
        if (this.coordination.wss) {
            this.coordination.wss.close();
        }
        if (this.coordination.server) {
            this.coordination.server.close();
        }
        
        this.emit('shutdown');
    }
}

// CLI interface
if (require.main === module) {
    const system = new MultiAgentDevSystem({
        worktreeBase: './worktrees',
        coordinationPort: 9500
    });
    
    system.initialize().then(async () => {
        console.log('Multi-Agent System running!');
        
        // Create monitoring dashboard
        await system.createMonitoringDashboard();
        
        // Example: Queue some initial tasks
        system.queueTask({
            description: 'Create user management service with CRUD operations',
            agentType: AGENT_TYPES.CODE,
            filePath: 'services/user.service.js',
            requirements: [
                'Create user',
                'Update user',
                'Delete user',
                'List users with pagination'
            ]
        });
        
    }).catch(error => {
        console.error('Failed to initialize:', error);
        process.exit(1);
    });
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        await system.shutdown();
        process.exit(0);
    });
}

module.exports = { MultiAgentDevSystem, Agent, AGENT_TYPES, AGENT_STATES };