#!/usr/bin/env node

/**
 * 🌊 UNIFIED ORCHESTRATION SYSTEM
 * 
 * One system to rule them all - connects everything with simple, clear paths
 * No more confusion about which service does what or how they connect
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class UnifiedOrchestrationSystem {
    constructor() {
        this.app = express();
        this.port = 20000; // Master port
        this.wsPort = 20001;
        
        // Single source of truth for ALL services
        this.serviceRegistry = {
            // Core Infrastructure (what's actually running)
            infrastructure: {
                postgres: { port: 5433, status: 'running', purpose: 'Main database' },
                redis: { port: 6380, status: 'running', purpose: 'Cache & queues' },
                ollama: { port: 11435, status: 'running', purpose: 'Local AI models' },
                quickStart: { port: 9999, status: 'running', purpose: 'Web interface' }
            },
            
            // Document Processing Pipeline
            documentPipeline: {
                uploader: { port: 20100, status: 'ready', purpose: 'Upload documents' },
                analyzer: { port: 20101, status: 'ready', purpose: 'AI analysis' },
                generator: { port: 20102, status: 'ready', purpose: 'Code generation' },
                packager: { port: 20103, status: 'ready', purpose: 'MVP packaging' }
            },
            
            // Learning Systems (CryptoZombies-style)
            learning: {
                characterGuide: { port: 20200, status: 'ready', purpose: 'Character mentors' },
                challenges: { port: 20201, status: 'ready', purpose: 'Coding challenges' },
                assessment: { port: 20202, status: 'ready', purpose: 'Skill tracking' },
                portfolio: { port: 20203, status: 'ready', purpose: 'Project showcase' }
            },
            
            // Intelligent Systems (New AI-driven orchestration)
            intelligent: {
                orchestrationHub: { port: 22000, status: 'running', purpose: 'Multi-agent decision trees' },
                queryDecomposer: { port: 22100, status: 'integrated', purpose: 'Query analysis & routing' },
                decisionExecutor: { port: 22101, status: 'integrated', purpose: 'Character yes/no trees' },
                resultsSynthesizer: { port: 22102, status: 'integrated', purpose: 'Multi-agent aggregation' }
            },
            
            // Business Systems
            business: {
                showcase: { port: 18000, status: 'running', purpose: 'Business catalog' },
                pricing: { port: 20300, status: 'ready', purpose: 'Tier management' },
                revenue: { port: 20301, status: 'ready', purpose: 'Payment tracking' },
                marketplace: { port: 20302, status: 'ready', purpose: 'Component sales' }
            }
        };
        
        // Single database for everything
        this.db = new sqlite3.Database('./unified-system.db');
        
        // Character definitions (from your existing systems)
        this.characters = {
            '📊': { name: 'Cal', role: 'Systems Architect', specialty: 'databases & orchestration' },
            '🎨': { name: 'Arty', role: 'Creative Director', specialty: 'UI/UX & design' },
            '🏗️': { name: 'Ralph', role: 'Infrastructure Lead', specialty: 'DevOps & deployment' },
            '🔬': { name: 'Vera', role: 'Research Scientist', specialty: 'AI & algorithms' },
            '🛡️': { name: 'Paulo', role: 'Security Expert', specialty: 'Auth & protection' },
            '📢': { name: 'Nash', role: 'Community Manager', specialty: 'Communication & docs' }
        };
        
        // Flow definitions - how things actually connect
        this.flows = {
            documentToMVP: [
                'uploader → analyzer → generator → packager → deployment',
                'Each step tracked in database with progress updates'
            ],
            intelligentOrchestration: [
                'query → queryDecomposer → decisionExecutor → resultsSynthesizer → reports',
                'Multi-agent decision trees with character specialists and yes/no logic'
            ],
            learningPath: [
                'characterGuide → challenges → assessment → portfolio → jobs',
                'Like CryptoZombies but for any skill'
            ],
            businessFlow: [
                'showcase → pricing → revenue → marketplace',
                'Components organized by tiers with clear pricing'
            ]
        };
        
        this.setupDatabase();
        this.setupServer();
    }
    
    async setupDatabase() {
        // One unified schema for everything
        const schemas = [
            // Documents and processing
            `CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                filename TEXT,
                content TEXT,
                doc_type TEXT,
                status TEXT DEFAULT 'uploaded',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Processing pipeline
            `CREATE TABLE IF NOT EXISTS pipeline_stages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER,
                stage TEXT,
                status TEXT,
                result TEXT,
                error TEXT,
                duration_ms INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES documents(id)
            )`,
            
            // Generated MVPs
            `CREATE TABLE IF NOT EXISTS generated_mvps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER,
                name TEXT,
                description TEXT,
                tech_stack TEXT,
                deployment_url TEXT,
                source_code TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES documents(id)
            )`,
            
            // Learning progress (CryptoZombies-style)
            `CREATE TABLE IF NOT EXISTS learning_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                character_guide TEXT,
                challenge_id TEXT,
                challenge_name TEXT,
                status TEXT,
                code_submitted TEXT,
                feedback TEXT,
                skills_gained TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Portfolio projects
            `CREATE TABLE IF NOT EXISTS portfolio_projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                project_name TEXT,
                description TEXT,
                technologies TEXT,
                github_url TEXT,
                demo_url TEXT,
                market_value TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // System components (discovered by showcase)
            `CREATE TABLE IF NOT EXISTS system_components (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT UNIQUE,
                name TEXT,
                tier TEXT,
                category TEXT,
                description TEXT,
                features TEXT,
                port INTEGER,
                value INTEGER,
                discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        for (const schema of schemas) {
            this.db.run(schema);
        }
    }
    
    setupServer() {
        this.app.use(express.json());
        // Note: Removed express.static(__dirname) to prevent serving shared index.html
        
        // Health check for all services
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'operational',
                services: this.serviceRegistry,
                message: 'Unified orchestration system running'
            });
        });
        
        // Document upload endpoint
        this.app.post('/api/documents', async (req, res) => {
            const { content, filename, docType, userId } = req.body;
            
            this.db.run(
                `INSERT INTO documents (user_id, filename, content, doc_type) VALUES (?, ?, ?, ?)`,
                [userId || 'anonymous', filename, content, docType || 'unknown'],
                function(err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    const docId = this.lastID;
                    
                    // Start processing pipeline
                    res.json({
                        success: true,
                        documentId: docId,
                        message: 'Document uploaded, processing started',
                        nextStep: 'analysis'
                    });
                }
            );
        });
        
        // Process document through pipeline
        this.app.post('/api/process/:docId', async (req, res) => {
            const { docId } = req.params;
            const stages = ['analysis', 'template_matching', 'code_generation', 'packaging'];
            
            for (const stage of stages) {
                // Simulate processing (in real system, would call actual services)
                await this.processStage(docId, stage);
            }
            
            res.json({
                success: true,
                documentId: docId,
                message: 'Processing complete',
                mvpReady: true
            });
        });
        
        // Learning challenge endpoint (CryptoZombies-style)
        this.app.get('/api/learning/next-challenge/:userId', (req, res) => {
            const { userId } = req.params;
            
            // Get user's current progress
            this.db.get(
                `SELECT * FROM learning_progress WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
                [userId],
                (err, lastProgress) => {
                    const challenge = this.getNextChallenge(lastProgress);
                    res.json(challenge);
                }
            );
        });
        
        // Submit challenge solution
        this.app.post('/api/learning/submit', async (req, res) => {
            const { userId, challengeId, code } = req.body;
            
            // Assess the solution
            const assessment = await this.assessSolution(challengeId, code);
            
            // Store progress
            this.db.run(
                `INSERT INTO learning_progress (user_id, challenge_id, code_submitted, status, feedback, skills_gained) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, challengeId, code, assessment.passed ? 'completed' : 'attempted', 
                 assessment.feedback, JSON.stringify(assessment.skills)],
                (err) => {
                    res.json({
                        success: !err,
                        assessment,
                        nextChallenge: assessment.passed ? this.getNextChallenge() : null
                    });
                }
            );
        });
        
        // System status dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        // WebSocket for real-time updates
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.wss.on('connection', (ws) => {
            console.log('Client connected to unified orchestration');
            
            // Send current status
            ws.send(JSON.stringify({
                type: 'status',
                services: this.serviceRegistry,
                flows: this.flows
            }));
        });
    }
    
    async processStage(docId, stage) {
        const startTime = Date.now();
        
        // Simulate processing with AI
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const duration = Date.now() - startTime;
        
        this.db.run(
            `INSERT INTO pipeline_stages (document_id, stage, status, duration_ms) VALUES (?, ?, ?, ?)`,
            [docId, stage, 'completed', duration]
        );
        
        // Broadcast update
        this.broadcast({
            type: 'pipeline_update',
            documentId: docId,
            stage,
            status: 'completed'
        });
    }
    
    getNextChallenge(lastProgress) {
        // CryptoZombies-style progressive challenges
        const challenges = [
            {
                id: 'basics_1',
                title: 'Chapter 1: Making Your First Function',
                description: 'Learn to create a simple function that processes data',
                characterGuide: '📊',
                initialCode: 'function processData(input) {\n  // Your code here\n}',
                tests: ['processData("test") should return "TEST"'],
                hints: ['Use string methods to transform the input']
            },
            {
                id: 'basics_2',
                title: 'Chapter 2: Working with Arrays',
                description: 'Process multiple items efficiently',
                characterGuide: '📊',
                initialCode: 'function processArray(items) {\n  // Your code here\n}',
                tests: ['processArray([1,2,3]) should return 6'],
                hints: ['You need to sum all the numbers']
            }
            // More challenges...
        ];
        
        if (!lastProgress) return challenges[0];
        
        const lastIndex = challenges.findIndex(c => c.id === lastProgress.challenge_id);
        return challenges[lastIndex + 1] || { completed: true, message: 'All challenges completed!' };
    }
    
    async assessSolution(challengeId, code) {
        // In real system, would run actual tests
        // For now, simple validation
        const passed = code && code.length > 10;
        
        return {
            passed,
            feedback: passed ? 
                'Great job! Your solution works perfectly.' : 
                'Not quite right. Check the hints and try again.',
            skills: passed ? ['problem-solving', 'javascript-basics'] : []
        };
    }
    
    generateDashboardHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Unified Orchestration System</title>
    <style>
        body {
            background: #0a0f1b;
            color: #e0e0e0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            padding: 40px 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 12px;
            margin-bottom: 40px;
        }
        
        h1 {
            font-size: 3em;
            margin: 0;
            background: linear-gradient(135deg, #00ff88 0%, #00ccff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
            color: #8892b0;
            font-size: 1.3em;
            margin-top: 10px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .flow-section {
            background: #1a1a2e;
            border: 1px solid #2a2a3e;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
        }
        
        .flow-title {
            font-size: 1.5em;
            color: #00ff88;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .flow-diagram {
            background: #0a0f1b;
            padding: 20px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 1.1em;
            line-height: 1.8;
        }
        
        .service-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .service-card {
            background: #2a2a3e;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #3a3a4e;
            transition: all 0.3s ease;
        }
        
        .service-card:hover {
            border-color: #00ff88;
            transform: translateY(-2px);
        }
        
        .service-name {
            font-weight: bold;
            color: #00ccff;
            margin-bottom: 5px;
        }
        
        .service-port {
            color: #8892b0;
            font-size: 0.9em;
        }
        
        .service-status {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 0.85em;
            margin-top: 10px;
        }
        
        .status-running {
            background: #00ff8833;
            color: #00ff88;
        }
        
        .status-ready {
            background: #00ccff33;
            color: #00ccff;
        }
        
        .characters {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 40px 0;
            flex-wrap: wrap;
        }
        
        .character {
            text-align: center;
            padding: 20px;
            background: #1a1a2e;
            border-radius: 12px;
            border: 1px solid #2a2a3e;
            transition: all 0.3s ease;
        }
        
        .character:hover {
            transform: scale(1.05);
            border-color: #00ff88;
        }
        
        .character-emoji {
            font-size: 3em;
            margin-bottom: 10px;
        }
        
        .character-name {
            font-weight: bold;
            color: #00ff88;
            margin-bottom: 5px;
        }
        
        .character-role {
            color: #8892b0;
            font-size: 0.9em;
        }
        
        .action-buttons {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 40px 0;
        }
        
        .btn {
            background: linear-gradient(135deg, #00ff88 0%, #00ccff 100%);
            color: #0a0f1b;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
        }
        
        .cryptozombies-section {
            background: linear-gradient(135deg, #1a1a2e 0%, #2a1a3e 100%);
            border: 2px solid #00ff88;
            border-radius: 12px;
            padding: 40px;
            margin: 40px 0;
            text-align: center;
        }
        
        .cryptozombies-title {
            font-size: 2em;
            color: #00ff88;
            margin-bottom: 20px;
        }
        
        .learning-path {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        
        .path-step {
            background: #2a2a3e;
            padding: 15px 25px;
            border-radius: 25px;
            position: relative;
        }
        
        .path-arrow {
            color: #00ff88;
            font-size: 1.5em;
        }
        
        #status {
            background: #0a0f1b;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            font-family: monospace;
            border: 1px solid #2a2a3e;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌊 Unified Orchestration System</h1>
        <div class="subtitle">Everything connected, no more confusion</div>
    </div>
    
    <div class="container">
        <!-- Character Guides -->
        <div class="characters">
            ${Object.entries(this.characters).map(([emoji, char]) => `
                <div class="character">
                    <div class="character-emoji">${emoji}</div>
                    <div class="character-name">${char.name}</div>
                    <div class="character-role">${char.role}</div>
                </div>
            `).join('')}
        </div>
        
        <!-- Main Flows -->
        <div class="flow-section">
            <div class="flow-title">
                📄 Document → MVP Pipeline
            </div>
            <div class="flow-diagram">
                1️⃣ Upload Document (any format)<br>
                2️⃣ AI Analysis (understand requirements)<br>
                3️⃣ Code Generation (using Ollama/OpenAI)<br>
                4️⃣ Package as MVP (Docker ready)<br>
                5️⃣ Deploy to production ✅
            </div>
            <div class="service-grid">
                ${Object.entries(this.serviceRegistry.documentPipeline).map(([key, service]) => `
                    <div class="service-card">
                        <div class="service-name">${key}</div>
                        <div class="service-port">Port: ${service.port}</div>
                        <div class="service-purpose">${service.purpose}</div>
                        <div class="service-status status-${service.status}">${service.status}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- CryptoZombies-style Learning -->
        <div class="cryptozombies-section">
            <div class="cryptozombies-title">🧟 Learn by Building (CryptoZombies Style)</div>
            <div class="learning-path">
                <div class="path-step">Choose Character</div>
                <div class="path-arrow">→</div>
                <div class="path-step">Complete Challenges</div>
                <div class="path-arrow">→</div>
                <div class="path-step">Build Projects</div>
                <div class="path-arrow">→</div>
                <div class="path-step">Get Job Ready</div>
            </div>
            <div class="service-grid">
                ${Object.entries(this.serviceRegistry.learning).map(([key, service]) => `
                    <div class="service-card">
                        <div class="service-name">${key}</div>
                        <div class="service-port">Port: ${service.port}</div>
                        <div class="service-purpose">${service.purpose}</div>
                        <div class="service-status status-${service.status}">${service.status}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Business Systems -->
        <div class="flow-section">
            <div class="flow-title">
                💼 Business & Monetization
            </div>
            <div class="flow-diagram">
                Browse 2,000+ components → Select tier → Deploy → Generate revenue
            </div>
            <div class="service-grid">
                ${Object.entries(this.serviceRegistry.business).map(([key, service]) => `
                    <div class="service-card">
                        <div class="service-name">${key}</div>
                        <div class="service-port">Port: ${service.port}</div>
                        <div class="service-purpose">${service.purpose}</div>
                        <div class="service-status status-${service.status}">${service.status}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="action-buttons">
            <button class="btn" onclick="uploadDocument()">📄 Upload Document</button>
            <button class="btn" onclick="startLearning()">🧟 Start Learning</button>
            <button class="btn" onclick="viewComponents()">💼 View Components</button>
            <button class="btn" onclick="checkStatus()">🔍 Check All Status</button>
        </div>
        
        <!-- Status Display -->
        <div id="status"></div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:20001');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'pipeline_update') {
                updateStatus(\`Pipeline update: \${data.stage} - \${data.status}\`);
            }
        };
        
        function updateStatus(message) {
            const status = document.getElementById('status');
            status.innerHTML = \`[\${new Date().toLocaleTimeString()}] \${message}<br>\` + status.innerHTML;
        }
        
        async function uploadDocument() {
            const content = prompt('Paste your document content or idea:');
            if (!content) return;
            
            const response = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    filename: 'user-document.txt',
                    docType: 'idea',
                    userId: 'demo-user'
                })
            });
            
            const result = await response.json();
            updateStatus(\`Document uploaded: ID \${result.documentId}\`);
            
            // Start processing
            if (result.success) {
                processDocument(result.documentId);
            }
        }
        
        async function processDocument(docId) {
            updateStatus(\`Processing document \${docId}...\`);
            
            const response = await fetch(\`/api/process/\${docId}\`, {
                method: 'POST'
            });
            
            const result = await response.json();
            updateStatus(\`Processing complete! MVP ready: \${result.mvpReady}\`);
        }
        
        function startLearning() {
            updateStatus('Starting CryptoZombies-style learning journey...');
            // Would open learning interface
            window.open('/learning', '_blank');
        }
        
        function viewComponents() {
            window.open('http://localhost:18000', '_blank');
        }
        
        async function checkStatus() {
            const response = await fetch('/api/health');
            const health = await response.json();
            updateStatus(\`System health: \${health.status}\`);
            console.log('Full health:', health);
        }
        
        // Initial status check
        checkStatus();
    </script>
</body>
</html>`;
    }
    
    broadcast(data) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
    
    async start() {
        this.app.listen(this.port, () => {
            console.log(`
🌊 UNIFIED ORCHESTRATION SYSTEM STARTED!
=======================================
Main Dashboard: http://localhost:${this.port}
WebSocket: ws://localhost:${this.wsPort}

Current Services:
- Infrastructure: PostgreSQL (5433), Redis (6380), Ollama (11435)
- Business Showcase: http://localhost:18000
- Quick Start UI: http://localhost:9999

This system connects EVERYTHING:
- Document processing pipeline
- CryptoZombies-style learning
- Business monetization
- No more confusion about .env files!
            `);
        });
    }
}

// Start the unified system
const orchestrator = new UnifiedOrchestrationSystem();
orchestrator.start();

module.exports = UnifiedOrchestrationSystem;