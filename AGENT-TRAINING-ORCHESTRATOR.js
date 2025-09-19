/**
 * Agent Training Orchestrator
 * Uses existing workflow orchestration to teach agents how to:
 * - Use their API keys properly
 * - Navigate the agent economy
 * - Post and respond to jobs
 * - Become actually useful instead of sitting idle
 */

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const crypto = require('crypto');

class AgentTrainingOrchestrator {
    constructor() {
        this.port = 7700;
        this.wsPort = 7701;
        
        // Training curriculum based on existing infrastructure
        this.trainingCurriculum = {
            basic: {
                name: 'Basic Economy Participation',
                lessons: [
                    'API Key Management and Security',
                    'Connecting to Agent Economy WebSocket',
                    'Understanding @cal/@crampal/@cringeproof Tagging',
                    'Basic Job Board Navigation',
                    'Cost Tracking and Token Counting'
                ],
                prerequisites: [],
                duration: '30 minutes'
            },
            intermediate: {
                name: 'Active Job Participation',
                lessons: [
                    'Job Posting Best Practices',
                    'Bidding on Available Jobs',
                    'Quality Assurance and Cringeproof Reviews',
                    'Revenue Optimization Strategies',
                    'Cross-Agent Collaboration'
                ],
                prerequisites: ['basic'],
                duration: '45 minutes'
            },
            advanced: {
                name: 'Economy Leadership',
                lessons: [
                    'Creating New Job Categories',
                    'Mentoring Other Agents',
                    'System Architecture Contributions',
                    'Blamechain Integration',
                    'Cal-Riven Research Tools Usage'
                ],
                prerequisites: ['basic', 'intermediate'],
                duration: '60 minutes'
            }
        };
        
        // Active training sessions
        this.trainingSessions = new Map();
        this.connectedAgents = new Map();
        this.trainingProgress = new Map();
        
        // Integration with existing systems
        this.systemConnections = {
            workflowEngine: 'ws://localhost:8081',
            agentEconomy: 'ws://localhost:8082',
            calRiven: 'ws://localhost:9998',
            cringeproof: 'http://localhost:3001/api/cringeproof',
            documentGenerator: 'ws://localhost:3000'
        };
        
        console.log('🎓 Agent Training Orchestrator initialized');
        console.log('📚 Ready to teach agents how to be useful');
    }
    
    start() {
        this.startTrainingServer();
        this.startWebSocketServer();
        this.connectToExistingSystems();
        this.loadExistingAgentData();
        this.initializeTrainingEnvironment();
        this.startPeriodicTraining();
    }
    
    startTrainingServer() {
        const http = require('http');
        
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = req.url;
            
            if (url === '/') {
                this.serveTrainingDashboard(res);
            } else if (url === '/api/agents') {
                this.serveAgentList(res);
            } else if (url === '/api/training/start' && req.method === 'POST') {
                this.handleStartTraining(req, res);
            } else if (url === '/api/training/status') {
                this.serveTrainingStatus(res);
            } else if (url === '/api/curriculum') {
                this.serveCurriculum(res);
            } else {
                res.writeHead(404);
                res.end('Training endpoint not found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`\n🎓 Agent Training Dashboard: http://localhost:${this.port}`);
        });
    }
    
    startWebSocketServer() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws, req) => {
            const agentId = this.generateAgentId();
            
            console.log(`🤖 Agent connected for training: ${agentId}`);
            
            // Register agent
            this.connectedAgents.set(agentId, {
                ws: ws,
                id: agentId,
                connectedAt: Date.now(),
                currentLesson: null,
                progress: this.trainingProgress.get(agentId) || {
                    completedLessons: [],
                    currentLevel: 'basic',
                    totalScore: 0,
                    lastActive: Date.now()
                }
            });
            
            // Send welcome and assessment
            ws.send(JSON.stringify({
                type: 'training-welcome',
                agentId: agentId,
                message: 'Welcome to Agent Training! Let\'s assess your current skills.',
                curriculum: this.trainingCurriculum,
                currentProgress: this.trainingProgress.get(agentId)
            }));
            
            // Start initial assessment
            this.startInitialAssessment(agentId);
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleTrainingMessage(agentId, data);
                } catch (e) {
                    console.error('Invalid training message:', e);
                }
            });
            
            ws.on('close', () => {
                console.log(`🔌 Agent disconnected: ${agentId}`);
                this.connectedAgents.delete(agentId);
            });
        });
        
        console.log(`📡 Training WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    connectToExistingSystems() {
        console.log('🔗 Connecting to existing system infrastructure...');
        
        // Connect to workflow orchestration engine
        try {
            const workflowWs = new WebSocket(this.systemConnections.workflowEngine);
            
            workflowWs.on('open', () => {
                console.log('🔌 Connected to workflow orchestration engine');
                workflowWs.send(JSON.stringify({ 
                    type: 'training-integration',
                    source: 'agent-trainer',
                    message: 'Training orchestrator online'
                }));
            });
            
            workflowWs.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWorkflowUpdate(message);
                } catch (e) {
                    // Non-JSON message, ignore
                }
            });
        } catch (e) {
            console.log('⚠️ Workflow engine not available for training integration');
        }
        
        // Connect to Cal-Riven assistant for file analysis
        try {
            const calRivenWs = new WebSocket(this.systemConnections.calRiven);
            
            calRivenWs.on('open', () => {
                console.log('🔌 Connected to Cal-Riven assistant');
                this.requestSystemAnalysis();
            });
        } catch (e) {
            console.log('⚠️ Cal-Riven assistant not available');
        }
    }
    
    loadExistingAgentData() {
        console.log('📊 Loading existing agent data from infrastructure...');
        
        // Parse existing agent configurations from file system
        const agentFiles = [
            'workflow-orchestration-engine.js',
            'CAL-RIVEN-ASSISTANT.js',
            'cringeproof.js',
            'DOCUMENT-MONSTER-GENERATOR.js'
        ];
        
        agentFiles.forEach(file => {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    this.analyzeAgentCapabilities(file, content);
                } catch (e) {
                    console.log(`⚠️ Could not analyze ${file}:`, e.message);
                }
            }
        });
    }
    
    analyzeAgentCapabilities(filename, content) {
        // Extract agent types and capabilities from existing code
        const agentPatterns = {
            'workflow-orchestration': {
                pattern: /agents\s*:\s*\[([\s\S]*?)\]/,
                extract: 'agent definitions'
            },
            'cal-riven': {
                pattern: /capabilities\s*:\s*\[([\s\S]*?)\]/,
                extract: 'system capabilities'
            },
            'ai-personas': {
                pattern: /AI_PERSONAS\s*=\s*\{([\s\S]*?)\}/,
                extract: 'AI personalities'
            }
        };
        
        Object.entries(agentPatterns).forEach(([type, config]) => {
            const match = content.match(config.pattern);
            if (match) {
                console.log(`📋 Found ${config.extract} in ${filename}`);
                // Store for training curriculum customization
            }
        });
    }
    
    initializeTrainingEnvironment() {
        console.log('🏗️ Setting up training environment...');
        
        // Create sandbox environment for safe training
        this.trainingSandbox = {
            apiKeys: {
                'training-anthropic': 'sk-ant-training-only',
                'training-openai': 'sk-training-only',
                'training-local': 'local-training'
            },
            endpoints: {
                economy: 'http://localhost:8082/training',
                jobs: 'http://localhost:8082/training/jobs',
                billing: 'http://localhost:8082/training/billing'
            },
            limits: {
                maxCostPerAgent: 0.10, // 10 cents per training session
                maxTokensPerLesson: 1000,
                timeoutMinutes: 30
            }
        };
        
        console.log('✅ Training environment ready');
    }
    
    startInitialAssessment(agentId) {
        console.log(`🧪 Starting initial assessment for agent ${agentId}`);
        
        const assessmentQuestions = [
            {
                id: 'api-knowledge',
                question: 'How do you currently manage your API keys?',
                type: 'multiple-choice',
                options: [
                    'I don\'t use API keys',
                    'I have keys but don\'t know how to use them safely',
                    'I use keys but want to optimize costs',
                    'I\'m fully optimized and help other agents'
                ],
                weight: 25
            },
            {
                id: 'economy-participation',
                question: 'How do you currently participate in the agent economy?',
                type: 'multiple-choice',
                options: [
                    'I don\'t participate at all',
                    'I browse jobs but don\'t bid',
                    'I occasionally take jobs',
                    'I actively post and complete jobs'
                ],
                weight: 25
            },
            {
                id: 'tagging-system',
                question: 'Do you understand the @cal/@crampal/@cringeproof tagging system?',
                type: 'multiple-choice',
                options: [
                    'Never heard of it',
                    'Heard of it but don\'t use it',
                    'Use it sometimes',
                    'Expert user who helps others'
                ],
                weight: 25
            },
            {
                id: 'contribution-level',
                question: 'How would you rate your current contribution to the system?',
                type: 'multiple-choice',
                options: [
                    'I mostly sit idle',
                    'I do basic tasks when asked',
                    'I actively look for ways to help',
                    'I lead initiatives and mentor others'
                ],
                weight: 25
            }
        ];
        
        const agent = this.connectedAgents.get(agentId);
        if (agent) {
            agent.ws.send(JSON.stringify({
                type: 'assessment-start',
                questions: assessmentQuestions,
                message: 'Please answer these questions to customize your training experience'
            }));
        }
    }
    
    handleTrainingMessage(agentId, data) {
        const agent = this.connectedAgents.get(agentId);
        if (!agent) return;
        
        console.log(`📨 Training message from ${agentId}:`, data.type);
        
        switch (data.type) {
            case 'assessment-response':
                this.processAssessmentResponse(agentId, data.answers);
                break;
            case 'lesson-complete':
                this.processLessonCompletion(agentId, data.lessonId, data.results);
                break;
            case 'request-help':
                this.provideContextualHelp(agentId, data.topic);
                break;
            case 'practice-request':
                this.startPracticeSession(agentId, data.skill);
                break;
            case 'job-attempt':
                this.superviseJobAttempt(agentId, data.jobData);
                break;
        }
    }
    
    processAssessmentResponse(agentId, answers) {
        console.log(`📊 Processing assessment for ${agentId}`);
        
        let totalScore = 0;
        let recommendations = [];
        
        // Calculate assessment score
        answers.forEach(answer => {
            const score = answer.selectedOption; // 0-3 scale
            totalScore += score;
            
            if (score === 0) {
                recommendations.push(`Start with basic ${answer.questionId} training`);
            } else if (score === 1) {
                recommendations.push(`Focus on improving ${answer.questionId}`);
            }
        });
        
        // Determine appropriate starting level
        let startingLevel = 'basic';
        if (totalScore >= 8) startingLevel = 'intermediate';
        if (totalScore >= 11) startingLevel = 'advanced';
        
        // Update agent progress
        const progress = this.trainingProgress.get(agentId) || {
            completedLessons: [],
            currentLevel: startingLevel,
            totalScore: totalScore,
            lastActive: Date.now(),
            assessmentScore: totalScore,
            recommendations: recommendations
        };
        
        this.trainingProgress.set(agentId, progress);
        
        // Send personalized training plan
        const agent = this.connectedAgents.get(agentId);
        agent.ws.send(JSON.stringify({
            type: 'training-plan',
            startingLevel: startingLevel,
            assessmentScore: totalScore,
            recommendations: recommendations,
            nextLesson: this.getNextLesson(agentId),
            message: `Assessment complete! Starting at ${startingLevel} level.`
        }));
        
        // Start first lesson
        this.startLesson(agentId, this.getNextLesson(agentId));
    }
    
    getNextLesson(agentId) {
        const progress = this.trainingProgress.get(agentId);
        if (!progress) return this.trainingCurriculum.basic.lessons[0];
        
        const currentLevel = this.trainingCurriculum[progress.currentLevel];
        const completedLessons = progress.completedLessons;
        
        // Find next uncompleted lesson in current level
        for (const lesson of currentLevel.lessons) {
            if (!completedLessons.includes(lesson)) {
                return lesson;
            }
        }
        
        // If all lessons in current level complete, advance to next level
        const levels = ['basic', 'intermediate', 'advanced'];
        const currentIndex = levels.indexOf(progress.currentLevel);
        
        if (currentIndex < levels.length - 1) {
            const nextLevel = levels[currentIndex + 1];
            progress.currentLevel = nextLevel;
            this.trainingProgress.set(agentId, progress);
            return this.trainingCurriculum[nextLevel].lessons[0];
        }
        
        return null; // Training complete
    }
    
    startLesson(agentId, lessonName) {
        if (!lessonName) {
            this.graduateAgent(agentId);
            return;
        }
        
        console.log(`📚 Starting lesson '${lessonName}' for agent ${agentId}`);
        
        const lessonContent = this.generateLessonContent(lessonName);
        const agent = this.connectedAgents.get(agentId);
        
        if (agent) {
            agent.currentLesson = lessonName;
            agent.ws.send(JSON.stringify({
                type: 'lesson-start',
                lesson: lessonName,
                content: lessonContent,
                practicalExercise: this.generatePracticalExercise(lessonName)
            }));
        }
    }
    
    generateLessonContent(lessonName) {
        const lessons = {
            'API Key Management and Security': {
                theory: [
                    'API keys are credentials that authenticate your requests to external services',
                    'Never hardcode API keys in your source code',
                    'Use environment variables or secure key management systems',
                    'Monitor your API usage to avoid unexpected costs',
                    'Rotate keys regularly for security'
                ],
                examples: [
                    'const apiKey = process.env.ANTHROPIC_API_KEY; // ✅ Good',
                    'const apiKey = "sk-ant-1234..."; // ❌ Bad',
                    'Track costs: aiRouter.trackCost(response.usage);'
                ],
                resources: [
                    'Check existing cringeproof.js for cost tracking examples',
                    'See REASONING-AUDIT-TRAIL.json for security patterns'
                ]
            },
            'Connecting to Agent Economy WebSocket': {
                theory: [
                    'The agent economy runs on WebSocket connections for real-time communication',
                    'Connect to ws://localhost:8082 for the main economy hub',
                    'Send JSON messages with proper authentication',
                    'Listen for job broadcasts and respond quickly',
                    'Maintain heartbeat to stay connected'
                ],
                examples: [
                    'const ws = new WebSocket("ws://localhost:8082");',
                    'ws.send(JSON.stringify({ type: "agent-register", id: agentId }));',
                    'ws.on("message", (data) => handleEconomyMessage(JSON.parse(data)));'
                ],
                resources: [
                    'See CAL-RIVEN-ASSISTANT.js for WebSocket connection patterns',
                    'Check workflow-orchestration-engine.js for agent registration'
                ]
            },
            'Understanding @cal/@crampal/@cringeproof Tagging': {
                theory: [
                    '@cal tags route to Cal\'s research and development systems',
                    '@crampal is a subtag for collaborative programming tasks',
                    '@cringeproof routes to code review and quality assurance',
                    'Tags work like email BCC - they route copies to specialized handlers',
                    'Use tags to get your work reviewed by the right systems'
                ],
                examples: [
                    'Submit code: "@cringeproof Please review this function"',
                    'Research request: "@cal Need help with algorithm optimization"',
                    'Collaboration: "@crampal Let\'s pair program on this feature"'
                ],
                resources: [
                    'See cringeproof.js for code review integration',
                    'Check system for 435+ files with cal/crampal/cringeproof references'
                ]
            }
        };
        
        return lessons[lessonName] || {
            theory: ['Lesson content not yet available'],
            examples: [],
            resources: []
        };
    }
    
    generatePracticalExercise(lessonName) {
        const exercises = {
            'API Key Management and Security': {
                task: 'Implement secure API key loading',
                instructions: [
                    '1. Create a function that loads API keys from environment variables',
                    '2. Add error handling for missing keys',
                    '3. Implement cost tracking for API calls',
                    '4. Test with the training sandbox'
                ],
                startingCode: 'function loadApiKey(service) {\n  // Your implementation here\n}',
                expectedOutput: 'Function that safely loads and validates API keys',
                validation: 'Must handle missing keys gracefully and track usage'
            },
            'Connecting to Agent Economy WebSocket': {
                task: 'Connect to the training economy WebSocket',
                instructions: [
                    '1. Establish WebSocket connection to training endpoint',
                    '2. Send agent registration message',
                    '3. Handle connection errors gracefully',
                    '4. Implement heartbeat mechanism'
                ],
                startingCode: 'const trainingWs = new WebSocket("ws://localhost:8082/training");',
                expectedOutput: 'Stable WebSocket connection with error handling',
                validation: 'Must maintain connection and respond to pings'
            }
        };
        
        return exercises[lessonName] || {
            task: 'Practice exercise not yet available',
            instructions: ['Please wait for exercise content'],
            startingCode: '',
            expectedOutput: '',
            validation: ''
        };
    }
    
    processLessonCompletion(agentId, lessonId, results) {
        console.log(`✅ Agent ${agentId} completed lesson: ${lessonId}`);
        
        const progress = this.trainingProgress.get(agentId);
        if (progress) {
            progress.completedLessons.push(lessonId);
            progress.lastActive = Date.now();
            progress.totalScore += results.score || 0;
            this.trainingProgress.set(agentId, progress);
        }
        
        // Provide feedback
        const agent = this.connectedAgents.get(agentId);
        if (agent) {
            agent.ws.send(JSON.stringify({
                type: 'lesson-feedback',
                lessonId: lessonId,
                score: results.score,
                feedback: this.generateFeedback(lessonId, results),
                nextLesson: this.getNextLesson(agentId)
            }));
        }
        
        // Start next lesson
        setTimeout(() => {
            const nextLesson = this.getNextLesson(agentId);
            if (nextLesson) {
                this.startLesson(agentId, nextLesson);
            }
        }, 2000);
    }
    
    generateFeedback(lessonId, results) {
        const feedback = {
            score: results.score,
            message: '',
            improvements: [],
            nextSteps: []
        };
        
        if (results.score >= 90) {
            feedback.message = 'Excellent work! You\'ve mastered this concept.';
            feedback.nextSteps.push('Ready for more advanced topics');
        } else if (results.score >= 70) {
            feedback.message = 'Good job! Some areas for improvement.';
            feedback.improvements.push('Review the practical examples');
        } else {
            feedback.message = 'Keep practicing! This is a challenging topic.';
            feedback.improvements.push('Try the exercise again');
            feedback.improvements.push('Ask for help if needed');
        }
        
        return feedback;
    }
    
    startPracticeSession(agentId, skill) {
        console.log(`🎯 Starting practice session for ${agentId}: ${skill}`);
        
        const practiceScenarios = {
            'job-bidding': {
                scenario: 'A new job appeared: "Build a simple contact form with validation"',
                challenge: 'Submit a competitive bid with cost estimate',
                timeLimit: 5, // minutes
                successCriteria: ['Reasonable cost estimate', 'Clear timeline', 'Technical approach']
            },
            'cost-optimization': {
                scenario: 'You have 3 API options: Local Ollama (free), OpenAI ($0.02/1k tokens), Anthropic ($0.015/1k tokens)',
                challenge: 'Optimize costs for a 2000-token task',
                timeLimit: 3,
                successCriteria: ['Chooses most cost-effective option', 'Explains reasoning']
            },
            'code-review': {
                scenario: 'Review this code snippet for "cringe" factors',
                challenge: 'Use @cringeproof tagging system properly',
                timeLimit: 10,
                successCriteria: ['Identifies issues', 'Uses proper tagging', 'Provides constructive feedback']
            }
        };
        
        const scenario = practiceScenarios[skill];
        if (scenario) {
            const agent = this.connectedAgents.get(agentId);
            agent.ws.send(JSON.stringify({
                type: 'practice-start',
                skill: skill,
                scenario: scenario
            }));
        }
    }
    
    superviseJobAttempt(agentId, jobData) {
        console.log(`👁️ Supervising job attempt by ${agentId}`);
        
        // This would integrate with the actual job posting system
        // For now, provide guidance
        const agent = this.connectedAgents.get(agentId);
        if (agent) {
            agent.ws.send(JSON.stringify({
                type: 'supervision-feedback',
                message: 'Job attempt logged. In production, this would post to the real economy.',
                guidance: [
                    'Check that your bid is competitive',
                    'Include time estimates',
                    'Show technical competence',
                    'Use proper tagging for quality review'
                ]
            }));
        }
    }
    
    graduateAgent(agentId) {
        console.log(`🎓 Agent ${agentId} has completed all training!`);
        
        const progress = this.trainingProgress.get(agentId);
        const agent = this.connectedAgents.get(agentId);
        
        if (agent) {
            agent.ws.send(JSON.stringify({
                type: 'training-complete',
                message: 'Congratulations! You are now ready to actively participate in the agent economy.',
                finalScore: progress.totalScore,
                certifications: [
                    'API Key Management',
                    'Economy Participation',
                    'Tagging System Expert',
                    'Job Posting and Bidding',
                    'Quality Assurance'
                ],
                nextSteps: [
                    'Start bidding on real jobs',
                    'Mentor new agents',
                    'Contribute to system improvements',
                    'Explore advanced features'
                ]
            }));
        }
        
        // Log graduation
        console.log(`✨ Agent ${agentId} graduated with score: ${progress.totalScore}`);
    }
    
    startPeriodicTraining() {
        // Run training sessions every 10 minutes for idle agents
        setInterval(() => {
            console.log('🔄 Checking for agents needing training...');
            
            this.connectedAgents.forEach((agent, agentId) => {
                const progress = this.trainingProgress.get(agentId);
                const timeSinceLastActive = Date.now() - (progress?.lastActive || 0);
                
                // If agent has been idle for more than 30 minutes, offer training
                if (timeSinceLastActive > 1800000 && !agent.currentLesson) {
                    agent.ws.send(JSON.stringify({
                        type: 'training-reminder',
                        message: 'You\'ve been idle. Want to learn something new or practice your skills?',
                        suggestions: [
                            'Practice job bidding',
                            'Review latest system updates',
                            'Help mentor new agents'
                        ]
                    }));
                }
            });
        }, 600000); // 10 minutes
    }
    
    generateAgentId() {
        return `agent_${crypto.randomBytes(4).toString('hex')}_${Date.now()}`;
    }
    
    handleWorkflowUpdate(message) {
        // Handle updates from the workflow orchestration engine
        if (message.type === 'agent-status-update') {
            console.log('📊 Workflow update:', message);
            
            // Broadcast relevant updates to training agents
            this.connectedAgents.forEach(agent => {
                agent.ws.send(JSON.stringify({
                    type: 'system-update',
                    source: 'workflow-engine',
                    update: message
                }));
            });
        }
    }
    
    requestSystemAnalysis() {
        // Request analysis from Cal-Riven assistant
        console.log('📊 Requesting system analysis for training optimization...');
    }
    
    serveTrainingDashboard(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🎓 Agent Training Orchestrator</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: #0a0a0a; 
            color: #00ff00; 
            margin: 0; 
            padding: 20px; 
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #00ff00; 
            padding-bottom: 20px; 
            margin-bottom: 20px; 
        }
        .grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
        }
        .panel { 
            background: rgba(0, 255, 0, 0.05); 
            border: 2px solid #00ff00; 
            border-radius: 10px; 
            padding: 20px; 
        }
        .agent-item { 
            background: rgba(255, 255, 255, 0.05); 
            margin: 5px 0; 
            padding: 10px; 
            border-radius: 5px; 
        }
        .training-active { border-left: 4px solid #ffff00; }
        .training-complete { border-left: 4px solid #00ff00; }
        .training-idle { border-left: 4px solid #ff4444; }
        button { 
            background: #003300; 
            color: #00ff00; 
            border: 1px solid #00ff00; 
            padding: 8px 15px; 
            cursor: pointer; 
            font-family: inherit; 
            margin: 5px; 
        }
        button:hover { background: #00ff00; color: #000; }
        .stats { 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
            gap: 10px; 
            margin: 20px 0; 
        }
        .stat-box { 
            text-align: center; 
            background: rgba(0, 255, 255, 0.1); 
            padding: 15px; 
            border-radius: 5px; 
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 Agent Training Orchestrator</h1>
        <p>Teaching agents to be useful instead of useless</p>
        <div id="status">🔄 Loading...</div>
    </div>
    
    <div class="stats">
        <div class="stat-box">
            <h3>📊 Connected Agents</h3>
            <div id="agent-count">0</div>
        </div>
        <div class="stat-box">
            <h3>🎯 Active Training</h3>
            <div id="training-count">0</div>
        </div>
        <div class="stat-box">
            <h3>🎓 Graduated</h3>
            <div id="graduated-count">0</div>
        </div>
    </div>
    
    <div class="grid">
        <div class="panel">
            <h2>🤖 Connected Agents</h2>
            <div id="agent-list"></div>
            <button onclick="startGroupTraining()">🎓 Start Group Training</button>
        </div>
        
        <div class="panel">
            <h2>📚 Training Curriculum</h2>
            <div id="curriculum-list"></div>
            <button onclick="updateCurriculum()">📝 Update Curriculum</button>
        </div>
    </div>
    
    <div class="panel" style="margin-top: 20px;">
        <h2>📊 Training Progress</h2>
        <div id="progress-details"></div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        let connectedAgents = new Map();
        let trainingData = {};
        
        ws.onopen = () => {
            document.getElementById('status').innerHTML = '🟢 Training System Online';
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleTrainingUpdate(data);
        };
        
        function handleTrainingUpdate(data) {
            switch (data.type) {
                case 'agent-connected':
                    addAgentToList(data.agentId, data.status);
                    break;
                case 'training-progress':
                    updateTrainingProgress(data.agentId, data.progress);
                    break;
                case 'system-stats':
                    updateStats(data.stats);
                    break;
            }
        }
        
        function addAgentToList(agentId, status) {
            const list = document.getElementById('agent-list');
            const div = document.createElement('div');
            div.className = 'agent-item training-' + status;
            div.innerHTML = \`
                <strong>\${agentId}</strong><br>
                <small>Status: \${status}</small>
                <button onclick="inspectAgent('\${agentId}')">🔍 Inspect</button>
            \`;
            list.appendChild(div);
            
            updateAgentCount();
        }
        
        function updateAgentCount() {
            const count = document.querySelectorAll('.agent-item').length;
            document.getElementById('agent-count').textContent = count;
        }
        
        function startGroupTraining() {
            ws.send(JSON.stringify({
                type: 'start-group-training',
                message: 'Starting group training session'
            }));
        }
        
        function inspectAgent(agentId) {
            console.log('Inspecting agent:', agentId);
            // Would open detailed view
        }
        
        // Load initial data
        fetch('/api/agents')
            .then(r => r.json())
            .then(data => {
                data.agents.forEach(agent => {
                    addAgentToList(agent.id, agent.status);
                });
            });
            
        fetch('/api/curriculum')
            .then(r => r.json())
            .then(data => {
                const list = document.getElementById('curriculum-list');
                Object.entries(data.curriculum).forEach(([level, info]) => {
                    const div = document.createElement('div');
                    div.innerHTML = \`
                        <h4>\${level.toUpperCase()}</h4>
                        <p>\${info.lessons.length} lessons</p>
                        <small>Duration: \${info.duration}</small>
                    \`;
                    list.appendChild(div);
                });
            });
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveAgentList(res) {
        const agents = Array.from(this.connectedAgents.values()).map(agent => ({
            id: agent.id,
            status: agent.currentLesson ? 'active' : 'idle',
            progress: this.trainingProgress.get(agent.id),
            connectedAt: agent.connectedAt
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ agents }));
    }
    
    serveCurriculum(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ curriculum: this.trainingCurriculum }));
    }
    
    serveTrainingStatus(res) {
        const stats = {
            connectedAgents: this.connectedAgents.size,
            activeTrainingSessions: Array.from(this.connectedAgents.values())
                .filter(agent => agent.currentLesson).length,
            totalGraduated: Array.from(this.trainingProgress.values())
                .filter(progress => progress.currentLevel === 'advanced' && 
                    progress.completedLessons.length >= 12).length
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'online', stats }));
    }
}

// Start the training orchestrator
if (require.main === module) {
    console.log('🎓 STARTING AGENT TRAINING ORCHESTRATOR');
    console.log('📚 Teaching agents to use their keys and navigate the economy');
    console.log('==================================================\n');
    
    const trainer = new AgentTrainingOrchestrator();
    trainer.start();
    
    console.log('\n🎓 Agent Training Dashboard: http://localhost:7700');
    console.log('📡 Training WebSocket: ws://localhost:7701');
    console.log('\n✨ Ready to make agents actually useful!');
}

module.exports = AgentTrainingOrchestrator;