#!/usr/bin/env node

/**
 * 🏢 EXECUTIVE OS CORE
 * The AI CEO that manages all systems, makes decisions, and coordinates resources
 * Integrates Binary Loop, 3D Generation, Weather Data, Multi-Domain Management
 */

import { EventEmitter } from 'events';
import { WebSocket, WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { createHash } from 'crypto';

class ExecutiveOSCore extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 9000,
            wsPort: config.wsPort || 9001,
            name: config.name || 'ExecutiveAI',
            role: config.role || 'CEO',
            ...config
        };
        
        // Executive State
        this.state = {
            status: 'initializing',
            decisions: [],
            resources: new Map(),
            domains: new Map(),
            factions: new Map(),
            activeProjects: new Map(),
            realTimeData: new Map(),
            executiveMemory: []
        };
        
        // System Connections
        this.connections = {
            binaryLoop: null,
            ai3DBridge: null,
            weatherAPI: null,
            domainManager: null,
            resourceAllocator: null,
            decisionEngine: null
        };
        
        // Executive Capabilities
        this.capabilities = {
            strategicPlanning: true,
            resourceAllocation: true,
            domainManagement: true,
            weatherAwareness: true,
            aiCoordination: true,
            realTimeDecisions: true,
            multiFormatProcessing: true,
            executiveReporting: true
        };
        
        // Decision Patterns
        this.decisionPatterns = {
            aggressive: { riskTolerance: 0.8, speedPriority: 0.9, costSensitivity: 0.3 },
            conservative: { riskTolerance: 0.3, speedPriority: 0.5, costSensitivity: 0.9 },
            balanced: { riskTolerance: 0.5, speedPriority: 0.7, costSensitivity: 0.6 },
            innovative: { riskTolerance: 0.7, speedPriority: 0.6, costSensitivity: 0.4 }
        };
        
        // Current executive personality
        this.personality = {
            pattern: 'balanced',
            traits: ['analytical', 'decisive', 'adaptive'],
            language: 'professional',
            accent: 'neutral'
        };
        
        // Resource limits
        this.resourceLimits = {
            maxConcurrentProjects: 10,
            maxAPICallsPerMinute: 100,
            maxBudgetPerProject: 10000,
            maxComputeUnits: 1000
        };
        
        this.init();
    }
    
    async init() {
        console.log(`🏢 Initializing ${this.config.name} - Executive OS Core...`);
        
        // Setup HTTP API
        await this.setupHTTPAPI();
        
        // Setup WebSocket server
        await this.setupWebSocket();
        
        // Connect to subsystems
        await this.connectSubsystems();
        
        // Initialize decision engine
        await this.initializeDecisionEngine();
        
        // Start monitoring loops
        this.startMonitoring();
        
        this.state.status = 'operational';
        console.log(`✅ ${this.config.name} is now operational as ${this.config.role}`);
        
        // Make initial executive announcement
        this.makeAnnouncement('system_online', {
            message: `${this.config.name} Executive OS is now online and ready to manage operations.`,
            capabilities: Object.keys(this.capabilities).filter(cap => this.capabilities[cap])
        });
    }
    
    async setupHTTPAPI() {
        this.app = express();
        this.app.use(cors());
        this.app.use(express.json({ limit: '100mb' }));
        
        // Executive endpoints
        this.app.get('/api/executive/status', (req, res) => {
            res.json({
                name: this.config.name,
                role: this.config.role,
                status: this.state.status,
                personality: this.personality,
                activeProjects: this.state.activeProjects.size,
                totalDecisions: this.state.decisions.length,
                uptime: process.uptime()
            });
        });
        
        // Make executive decision
        this.app.post('/api/executive/decide', async (req, res) => {
            try {
                const decision = await this.makeDecision(req.body);
                res.json(decision);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Allocate resources
        this.app.post('/api/executive/allocate', async (req, res) => {
            try {
                const allocation = await this.allocateResources(req.body);
                res.json(allocation);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Create project
        this.app.post('/api/executive/project', async (req, res) => {
            try {
                const project = await this.createProject(req.body);
                res.json(project);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Domain management
        this.app.get('/api/executive/domains', (req, res) => {
            res.json(Array.from(this.state.domains.values()));
        });
        
        this.app.post('/api/executive/domain', async (req, res) => {
            try {
                const domain = await this.registerDomain(req.body);
                res.json(domain);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Real-time data
        this.app.get('/api/executive/realtime/:category', (req, res) => {
            const data = this.state.realTimeData.get(req.params.category);
            res.json(data || { error: 'Category not found' });
        });
        
        // Executive reports
        this.app.get('/api/executive/report/:type', async (req, res) => {
            try {
                const report = await this.generateReport(req.params.type);
                res.json(report);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Multi-format processing
        this.app.post('/api/executive/process', async (req, res) => {
            try {
                const result = await this.processMultiFormat(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Executive dashboard
        this.app.get('/', (req, res) => {
            res.send(this.getExecutiveDashboardHTML());
        });
        
        // Start HTTP server
        this.server = this.app.listen(this.config.port, () => {
            console.log(`📡 Executive API running on port ${this.config.port}`);
        });
    }
    
    async setupWebSocket() {
        this.wss = new WebSocketServer({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New connection to Executive OS');
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'welcome',
                executive: this.config.name,
                role: this.config.role,
                capabilities: this.capabilities
            }));
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });
            
            // Subscribe to executive announcements
            this.on('announcement', (data) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'announcement',
                        ...data
                    }));
                }
            });
        });
        
        console.log(`🔌 WebSocket server running on port ${this.config.wsPort}`);
    }
    
    async connectSubsystems() {
        console.log('🔗 Connecting to subsystems...');
        
        // Connect to Binary Loop Controller
        try {
            this.connections.binaryLoop = new WebSocket('ws://localhost:8110');
            this.connections.binaryLoop.on('open', () => {
                console.log('✅ Connected to Binary Loop Controller');
                this.connections.binaryLoop.send(JSON.stringify({
                    type: 'register',
                    service: 'executive-os',
                    role: this.config.role
                }));
            });
        } catch (error) {
            console.warn('⚠️  Binary Loop Controller not available');
        }
        
        // Connect to AI-3D Bridge
        try {
            const ai3DStatus = await fetch('http://localhost:8115/status');
            if (ai3DStatus.ok) {
                this.connections.ai3DBridge = { url: 'http://localhost:8115', connected: true };
                console.log('✅ Connected to AI-3D Bridge');
            }
        } catch (error) {
            console.warn('⚠️  AI-3D Bridge not available');
        }
        
        // Initialize Weather API connection
        this.connections.weatherAPI = {
            getWeather: async (location) => {
                // Simulate weather API for now
                return {
                    location,
                    temperature: Math.floor(Math.random() * 30) + 50,
                    conditions: ['sunny', 'cloudy', 'rainy', 'stormy'][Math.floor(Math.random() * 4)],
                    windSpeed: Math.floor(Math.random() * 20),
                    timestamp: new Date()
                };
            }
        };
        
        // Initialize Domain Manager
        this.connections.domainManager = {
            domains: ['soulfra.com', 'd2d.com', 'casino.ai', 'executive.os'],
            allocateToProject: async (projectId, domain) => {
                return { projectId, domain, allocated: true };
            }
        };
    }
    
    async initializeDecisionEngine() {
        // Decision engine that considers all factors
        this.decisionEngine = {
            evaluate: async (context) => {
                const factors = {
                    cost: this.evaluateCost(context),
                    risk: this.evaluateRisk(context),
                    benefit: this.evaluateBenefit(context),
                    timing: this.evaluateTiming(context),
                    resources: this.evaluateResources(context)
                };
                
                // Apply personality pattern
                const pattern = this.decisionPatterns[this.personality.pattern];
                
                const score = 
                    factors.benefit * 0.3 +
                    (1 - factors.cost) * pattern.costSensitivity +
                    (1 - factors.risk) * (1 - pattern.riskTolerance) +
                    factors.timing * pattern.speedPriority +
                    factors.resources * 0.2;
                
                return {
                    score,
                    factors,
                    recommendation: score > 0.6 ? 'approve' : score > 0.4 ? 'conditional' : 'reject',
                    reasoning: this.generateReasoning(factors, score)
                };
            }
        };
    }
    
    startMonitoring() {
        // Monitor system health
        setInterval(() => {
            this.checkSystemHealth();
        }, 30000); // Every 30 seconds
        
        // Update real-time data
        setInterval(() => {
            this.updateRealTimeData();
        }, 10000); // Every 10 seconds
        
        // Resource optimization
        setInterval(() => {
            this.optimizeResources();
        }, 60000); // Every minute
        
        // Executive reporting
        setInterval(() => {
            this.generateExecutiveSummary();
        }, 300000); // Every 5 minutes
    }
    
    async makeDecision(request) {
        const decisionId = `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const decision = {
            id: decisionId,
            request: request,
            timestamp: new Date(),
            executive: this.config.name,
            status: 'evaluating'
        };
        
        this.state.decisions.push(decision);
        
        try {
            // Gather context
            const context = await this.gatherContext(request);
            
            // Evaluate using decision engine
            const evaluation = await this.decisionEngine.evaluate(context);
            
            // Check weather if relevant
            if (request.weatherSensitive) {
                const weather = await this.connections.weatherAPI.getWeather(request.location || 'global');
                context.weather = weather;
                
                // Adjust decision based on weather
                if (weather.conditions === 'stormy' && request.type === 'outdoor_event') {
                    evaluation.score *= 0.5;
                    evaluation.recommendation = 'postpone';
                    evaluation.reasoning += ' Weather conditions are unfavorable.';
                }
            }
            
            // Make final decision
            decision.evaluation = evaluation;
            decision.status = 'decided';
            decision.outcome = evaluation.recommendation;
            decision.executiveNotes = this.generateExecutiveNotes(request, evaluation);
            
            // Execute decision if approved
            if (evaluation.recommendation === 'approve') {
                decision.execution = await this.executeDecision(request, context);
            }
            
            // Store in executive memory
            this.state.executiveMemory.push({
                decision: decision.id,
                pattern: request.type,
                outcome: decision.outcome,
                score: evaluation.score,
                timestamp: new Date()
            });
            
            // Announce major decisions
            if (request.priority === 'high') {
                this.makeAnnouncement('executive_decision', {
                    decision: decision.id,
                    type: request.type,
                    outcome: decision.outcome
                });
            }
            
            return decision;
            
        } catch (error) {
            decision.status = 'error';
            decision.error = error.message;
            throw error;
        }
    }
    
    async allocateResources(request) {
        const { projectId, resourceType, amount, priority = 'normal' } = request;
        
        // Check if project exists
        const project = this.state.activeProjects.get(projectId);
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        
        // Check resource availability
        const available = await this.checkResourceAvailability(resourceType, amount);
        if (!available) {
            // Try to optimize and free up resources
            await this.optimizeResources();
            
            const secondCheck = await this.checkResourceAvailability(resourceType, amount);
            if (!secondCheck) {
                throw new Error(`Insufficient ${resourceType} resources. Requested: ${amount}`);
            }
        }
        
        // Allocate resources
        const allocation = {
            id: `alloc_${Date.now()}`,
            projectId,
            resourceType,
            amount,
            priority,
            timestamp: new Date(),
            executive: this.config.name
        };
        
        // Update project resources
        if (!project.resources) project.resources = {};
        if (!project.resources[resourceType]) project.resources[resourceType] = 0;
        project.resources[resourceType] += amount;
        
        // Track allocation
        if (!this.state.resources.has(resourceType)) {
            this.state.resources.set(resourceType, {
                total: this.resourceLimits.maxComputeUnits,
                allocated: 0,
                available: this.resourceLimits.maxComputeUnits
            });
        }
        
        const resourceTracker = this.state.resources.get(resourceType);
        resourceTracker.allocated += amount;
        resourceTracker.available -= amount;
        
        // Log allocation
        console.log(`💰 Allocated ${amount} ${resourceType} to project ${projectId}`);
        
        return allocation;
    }
    
    async createProject(request) {
        const {
            name,
            type,
            description,
            budget,
            timeline,
            team = [],
            domain,
            faction
        } = request;
        
        // Check project limits
        if (this.state.activeProjects.size >= this.resourceLimits.maxConcurrentProjects) {
            throw new Error('Maximum concurrent projects reached');
        }
        
        const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const project = {
            id: projectId,
            name,
            type,
            description,
            budget: budget || 1000,
            timeline,
            team,
            domain: domain || 'executive.os',
            faction: faction || 'neutral',
            status: 'planning',
            created: new Date(),
            executive: this.config.name,
            milestones: [],
            resources: {},
            metrics: {
                progress: 0,
                quality: 0,
                efficiency: 0
            }
        };
        
        // Domain allocation
        if (domain && this.connections.domainManager) {
            await this.connections.domainManager.allocateToProject(projectId, domain);
        }
        
        // Set up project monitoring
        project.monitor = setInterval(() => {
            this.updateProjectMetrics(projectId);
        }, 60000); // Every minute
        
        this.state.activeProjects.set(projectId, project);
        
        // Announce new project
        this.makeAnnouncement('new_project', {
            projectId,
            name,
            type,
            executive: this.config.name
        });
        
        console.log(`📋 Created new project: ${name} (${projectId})`);
        
        return project;
    }
    
    async registerDomain(domainInfo) {
        const {
            name,
            url,
            faction,
            accent,
            capabilities = [],
            apiKeys = {}
        } = domainInfo;
        
        const domain = {
            id: `domain_${createHash('sha256').update(name).digest('hex').substr(0, 8)}`,
            name,
            url,
            faction: faction || 'neutral',
            accent: accent || 'standard',
            capabilities,
            apiKeys,
            registered: new Date(),
            status: 'active',
            metrics: {
                requests: 0,
                errors: 0,
                uptime: 100
            }
        };
        
        this.state.domains.set(domain.id, domain);
        
        // Register with faction if specified
        if (faction) {
            if (!this.state.factions.has(faction)) {
                this.state.factions.set(faction, {
                    name: faction,
                    domains: [],
                    resources: {},
                    accent: accent
                });
            }
            this.state.factions.get(faction).domains.push(domain.id);
        }
        
        console.log(`🌐 Registered domain: ${name} (${faction})`);
        
        return domain;
    }
    
    async processMultiFormat(request) {
        const { data, format, purpose } = request;
        
        let processed;
        
        try {
            switch (format) {
                case 'json':
                    processed = JSON.parse(data);
                    break;
                    
                case 'jsonl':
                    processed = data.trim().split('\n').map(line => JSON.parse(line));
                    break;
                    
                case 'yaml':
                    // Simple YAML parsing (would use a library in production)
                    processed = this.parseSimpleYAML(data);
                    break;
                    
                case 'binary':
                    // Send to binary loop controller
                    if (this.connections.binaryLoop) {
                        processed = await this.sendToBinaryLoop(data);
                    } else {
                        processed = { binary: data, decoded: atob(data) };
                    }
                    break;
                    
                case 'executive':
                    // Executive format (custom)
                    processed = this.parseExecutiveFormat(data);
                    break;
                    
                default:
                    processed = { raw: data };
            }
            
            // Apply purpose-specific processing
            if (purpose) {
                processed = await this.applyPurposeProcessing(processed, purpose);
            }
            
            return {
                format,
                purpose,
                processed,
                timestamp: new Date(),
                executive: this.config.name
            };
            
        } catch (error) {
            throw new Error(`Failed to process ${format} data: ${error.message}`);
        }
    }
    
    async generateReport(type) {
        const report = {
            type,
            generated: new Date(),
            executive: this.config.name,
            period: 'last_24_hours'
        };
        
        switch (type) {
            case 'executive_summary':
                report.content = await this.generateExecutiveSummary();
                break;
                
            case 'resource_utilization':
                report.content = this.generateResourceReport();
                break;
                
            case 'project_status':
                report.content = this.generateProjectStatusReport();
                break;
                
            case 'decision_history':
                report.content = this.generateDecisionHistoryReport();
                break;
                
            case 'domain_performance':
                report.content = this.generateDomainPerformanceReport();
                break;
                
            case 'ai_coordination':
                report.content = this.generateAICoordinationReport();
                break;
                
            default:
                throw new Error(`Unknown report type: ${type}`);
        }
        
        return report;
    }
    
    // Helper methods
    
    async gatherContext(request) {
        const context = {
            request,
            timestamp: new Date(),
            systemLoad: this.getSystemLoad(),
            activeProjects: this.state.activeProjects.size,
            availableResources: this.getAvailableResources(),
            recentDecisions: this.state.decisions.slice(-5),
            marketConditions: await this.getMarketConditions(),
            competitorActivity: await this.getCompetitorActivity()
        };
        
        return context;
    }
    
    evaluateCost(context) {
        const { request } = context;
        const estimatedCost = request.estimatedCost || 0;
        const budget = request.budget || this.resourceLimits.maxBudgetPerProject;
        
        return Math.min(estimatedCost / budget, 1);
    }
    
    evaluateRisk(context) {
        const { request, systemLoad } = context;
        let risk = 0.5; // Base risk
        
        // Adjust based on request type
        if (request.type === 'experimental') risk += 0.3;
        if (request.type === 'maintenance') risk -= 0.3;
        
        // Adjust based on system load
        risk += systemLoad * 0.2;
        
        return Math.max(0, Math.min(1, risk));
    }
    
    evaluateBenefit(context) {
        const { request } = context;
        let benefit = 0.5; // Base benefit
        
        // Adjust based on priority
        if (request.priority === 'critical') benefit += 0.4;
        if (request.priority === 'low') benefit -= 0.2;
        
        // Adjust based on impact
        if (request.expectedImpact === 'high') benefit += 0.3;
        
        return Math.max(0, Math.min(1, benefit));
    }
    
    evaluateTiming(context) {
        const { request, marketConditions } = context;
        let timing = 0.7; // Default good timing
        
        // Adjust based on market conditions
        if (marketConditions && marketConditions.trend === 'bearish') {
            timing -= 0.2;
        }
        
        // Adjust based on urgency
        if (request.urgent) timing += 0.3;
        
        return Math.max(0, Math.min(1, timing));
    }
    
    evaluateResources(context) {
        const { availableResources, request } = context;
        const required = request.requiredResources || {};
        
        let availability = 1;
        
        for (const [resource, amount] of Object.entries(required)) {
            const available = availableResources[resource] || 0;
            if (available < amount) {
                availability *= available / amount;
            }
        }
        
        return availability;
    }
    
    generateReasoning(factors, score) {
        const reasons = [];
        
        if (factors.cost > 0.7) reasons.push('High cost relative to budget');
        if (factors.risk > 0.7) reasons.push('Significant risk factors identified');
        if (factors.benefit > 0.7) reasons.push('High expected benefit');
        if (factors.timing < 0.3) reasons.push('Poor market timing');
        if (factors.resources < 0.5) reasons.push('Limited resource availability');
        
        return reasons.join('. ') + `.Overall score: ${(score * 100).toFixed(1)}%.`;
    }
    
    generateExecutiveNotes(request, evaluation) {
        const notes = [];
        
        // Add personality-based notes
        if (this.personality.pattern === 'aggressive' && evaluation.score > 0.5) {
            notes.push('Worth pursuing despite risks');
        } else if (this.personality.pattern === 'conservative' && evaluation.score < 0.7) {
            notes.push('Recommend further analysis before proceeding');
        }
        
        // Add strategic notes
        if (request.strategic) {
            notes.push('Aligns with long-term strategic goals');
        }
        
        return notes.join('. ');
    }
    
    async executeDecision(request, context) {
        const execution = {
            started: new Date(),
            steps: [],
            status: 'executing'
        };
        
        try {
            // Execute based on request type
            switch (request.type) {
                case 'create_project':
                    const project = await this.createProject(request.projectDetails);
                    execution.result = { projectId: project.id };
                    break;
                    
                case 'allocate_resources':
                    const allocation = await this.allocateResources(request.allocationDetails);
                    execution.result = allocation;
                    break;
                    
                case 'generate_3d':
                    if (this.connections.ai3DBridge) {
                        const response = await fetch('http://localhost:8116/api/generate-3d', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(request.generationDetails)
                        });
                        execution.result = await response.json();
                    }
                    break;
                    
                default:
                    execution.result = { message: 'Decision approved for manual execution' };
            }
            
            execution.status = 'completed';
            execution.completed = new Date();
            
        } catch (error) {
            execution.status = 'failed';
            execution.error = error.message;
        }
        
        return execution;
    }
    
    async checkResourceAvailability(resourceType, amount) {
        const tracker = this.state.resources.get(resourceType);
        if (!tracker) return true; // Unknown resource type, assume available
        
        return tracker.available >= amount;
    }
    
    async checkSystemHealth() {
        const health = {
            timestamp: new Date(),
            status: 'healthy',
            services: {}
        };
        
        // Check Binary Loop
        if (this.connections.binaryLoop && this.connections.binaryLoop.readyState === WebSocket.OPEN) {
            health.services.binaryLoop = 'connected';
        } else {
            health.services.binaryLoop = 'disconnected';
            health.status = 'degraded';
        }
        
        // Check AI-3D Bridge
        try {
            const response = await fetch('http://localhost:8115/status');
            health.services.ai3DBridge = response.ok ? 'healthy' : 'unhealthy';
        } catch {
            health.services.ai3DBridge = 'unreachable';
            health.status = 'degraded';
        }
        
        // Check resource usage
        const memoryUsage = process.memoryUsage();
        health.memory = {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
        };
        
        this.state.systemHealth = health;
        
        if (health.status !== 'healthy') {
            this.makeAnnouncement('system_health_warning', health);
        }
    }
    
    async updateRealTimeData() {
        // Update weather
        if (this.connections.weatherAPI) {
            const weather = await this.connections.weatherAPI.getWeather('global');
            this.state.realTimeData.set('weather', weather);
        }
        
        // Update market data (simulated)
        this.state.realTimeData.set('market', {
            trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
            volatility: Math.random(),
            opportunities: Math.floor(Math.random() * 10),
            timestamp: new Date()
        });
        
        // Update system metrics
        this.state.realTimeData.set('system', {
            activeProjects: this.state.activeProjects.size,
            pendingDecisions: this.state.decisions.filter(d => d.status === 'evaluating').length,
            resourceUtilization: this.calculateResourceUtilization(),
            timestamp: new Date()
        });
    }
    
    async optimizeResources() {
        console.log('🔧 Optimizing resource allocation...');
        
        // Find underutilized projects
        const projects = Array.from(this.state.activeProjects.values());
        const underutilized = projects.filter(p => p.metrics.efficiency < 0.5);
        
        for (const project of underutilized) {
            // Consider pausing or reallocating
            if (project.metrics.progress < 0.2 && project.metrics.efficiency < 0.3) {
                console.log(`⚠️  Project ${project.name} is underperforming`);
                
                // Make decision about project
                await this.makeDecision({
                    type: 'project_review',
                    projectId: project.id,
                    action: 'optimize_or_terminate',
                    reason: 'underperformance'
                });
            }
        }
    }
    
    async generateExecutiveSummary() {
        const summary = {
            timestamp: new Date(),
            executive: this.config.name,
            metrics: {
                totalDecisions: this.state.decisions.length,
                approvalRate: this.calculateApprovalRate(),
                activeProjects: this.state.activeProjects.size,
                resourceUtilization: this.calculateResourceUtilization(),
                systemHealth: this.state.systemHealth?.status || 'unknown'
            },
            highlights: [],
            recommendations: []
        };
        
        // Add highlights
        const recentSuccesses = this.state.decisions
            .filter(d => d.outcome === 'approve' && d.execution?.status === 'completed')
            .slice(-3);
            
        for (const success of recentSuccesses) {
            summary.highlights.push(`Successfully executed: ${success.request.type}`);
        }
        
        // Add recommendations
        if (summary.metrics.resourceUtilization > 0.8) {
            summary.recommendations.push('Consider scaling resources or optimizing current allocation');
        }
        
        if (summary.metrics.approvalRate < 0.3) {
            summary.recommendations.push('Review decision criteria - low approval rate detected');
        }
        
        // Broadcast summary
        this.makeAnnouncement('executive_summary', summary);
        
        return summary;
    }
    
    calculateApprovalRate() {
        if (this.state.decisions.length === 0) return 0;
        
        const approved = this.state.decisions.filter(d => d.outcome === 'approve').length;
        return approved / this.state.decisions.length;
    }
    
    calculateResourceUtilization() {
        let totalAllocated = 0;
        let totalAvailable = 0;
        
        for (const [type, tracker] of this.state.resources) {
            totalAllocated += tracker.allocated;
            totalAvailable += tracker.total;
        }
        
        return totalAvailable > 0 ? totalAllocated / totalAvailable : 0;
    }
    
    updateProjectMetrics(projectId) {
        const project = this.state.activeProjects.get(projectId);
        if (!project) return;
        
        // Simulate metric updates (in real system, would calculate from actual data)
        project.metrics.progress = Math.min(1, project.metrics.progress + Math.random() * 0.1);
        project.metrics.quality = 0.7 + Math.random() * 0.3;
        project.metrics.efficiency = 0.5 + Math.random() * 0.5;
        
        // Check if project is complete
        if (project.metrics.progress >= 1 && project.status !== 'completed') {
            project.status = 'completed';
            this.makeAnnouncement('project_completed', {
                projectId,
                name: project.name,
                metrics: project.metrics
            });
        }
    }
    
    getSystemLoad() {
        const load = {
            cpu: os.loadavg()[0] / os.cpus().length,
            memory: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
            projects: this.state.activeProjects.size / this.resourceLimits.maxConcurrentProjects
        };
        
        return (load.cpu + load.memory + load.projects) / 3;
    }
    
    getAvailableResources() {
        const available = {};
        
        for (const [type, tracker] of this.state.resources) {
            available[type] = tracker.available;
        }
        
        return available;
    }
    
    async getMarketConditions() {
        // Would integrate with real market APIs
        return this.state.realTimeData.get('market') || {
            trend: 'neutral',
            volatility: 0.5,
            opportunities: 5
        };
    }
    
    async getCompetitorActivity() {
        // Would integrate with competitive intelligence
        return {
            activeCompetitors: Math.floor(Math.random() * 10),
            threatLevel: Math.random(),
            opportunities: Math.floor(Math.random() * 5)
        };
    }
    
    parseSimpleYAML(data) {
        // Very basic YAML parsing (use a proper library in production)
        const result = {};
        const lines = data.split('\n');
        
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':').map(s => s.trim());
                result[key] = value;
            }
        }
        
        return result;
    }
    
    parseExecutiveFormat(data) {
        // Custom executive format parsing
        const sections = data.split('---');
        const parsed = {
            metadata: {},
            directives: [],
            data: {}
        };
        
        for (const section of sections) {
            if (section.startsWith('EXECUTIVE:')) {
                parsed.metadata = this.parseSimpleYAML(section);
            } else if (section.startsWith('DIRECTIVE:')) {
                parsed.directives.push(section.replace('DIRECTIVE:', '').trim());
            } else {
                Object.assign(parsed.data, this.parseSimpleYAML(section));
            }
        }
        
        return parsed;
    }
    
    async sendToBinaryLoop(data) {
        if (!this.connections.binaryLoop || this.connections.binaryLoop.readyState !== WebSocket.OPEN) {
            throw new Error('Binary Loop Controller not connected');
        }
        
        return new Promise((resolve, reject) => {
            const requestId = `exec_${Date.now()}`;
            
            const handler = (message) => {
                const response = JSON.parse(message.data);
                if (response.id === requestId) {
                    this.connections.binaryLoop.removeListener('message', handler);
                    resolve(response.result);
                }
            };
            
            this.connections.binaryLoop.on('message', handler);
            
            this.connections.binaryLoop.send(JSON.stringify({
                id: requestId,
                type: 'process',
                data: data
            }));
            
            setTimeout(() => {
                this.connections.binaryLoop.removeListener('message', handler);
                reject(new Error('Binary Loop timeout'));
            }, 30000);
        });
    }
    
    async applyPurposeProcessing(data, purpose) {
        switch (purpose) {
            case 'decision_support':
                return {
                    ...data,
                    analysis: await this.analyzeForDecision(data),
                    recommendations: this.generateRecommendations(data)
                };
                
            case '3d_generation':
                return {
                    ...data,
                    prompts: this.extractPrompts(data),
                    modelSuggestions: this.suggest3DModels(data)
                };
                
            case 'resource_planning':
                return {
                    ...data,
                    resourceRequirements: this.calculateRequirements(data),
                    timeline: this.estimateTimeline(data)
                };
                
            default:
                return data;
        }
    }
    
    async analyzeForDecision(data) {
        // Deep analysis for decision support
        return {
            keyFactors: this.extractKeyFactors(data),
            risks: this.identifyRisks(data),
            opportunities: this.identifyOpportunities(data)
        };
    }
    
    extractKeyFactors(data) {
        // Extract important factors from data
        const factors = [];
        
        if (data.cost) factors.push({ type: 'cost', value: data.cost, impact: 'high' });
        if (data.timeline) factors.push({ type: 'timeline', value: data.timeline, impact: 'medium' });
        if (data.resources) factors.push({ type: 'resources', value: data.resources, impact: 'high' });
        
        return factors;
    }
    
    identifyRisks(data) {
        const risks = [];
        
        if (data.complexity && data.complexity > 0.7) {
            risks.push({ type: 'complexity', level: 'high', mitigation: 'Break into smaller tasks' });
        }
        
        if (data.dependencies && data.dependencies.length > 5) {
            risks.push({ type: 'dependencies', level: 'medium', mitigation: 'Create fallback plans' });
        }
        
        return risks;
    }
    
    identifyOpportunities(data) {
        const opportunities = [];
        
        if (data.market && data.market.growth > 0.2) {
            opportunities.push({ type: 'market_growth', potential: 'high' });
        }
        
        if (data.innovation && data.innovation.score > 0.7) {
            opportunities.push({ type: 'innovation', potential: 'high' });
        }
        
        return opportunities;
    }
    
    generateRecommendations(data) {
        const recommendations = [];
        
        const analysis = data.analysis || {};
        
        if (analysis.risks && analysis.risks.some(r => r.level === 'high')) {
            recommendations.push('Implement risk mitigation strategies before proceeding');
        }
        
        if (analysis.opportunities && analysis.opportunities.some(o => o.potential === 'high')) {
            recommendations.push('Fast-track implementation to capture opportunities');
        }
        
        return recommendations;
    }
    
    extractPrompts(data) {
        // Extract 3D generation prompts from data
        const prompts = [];
        
        if (typeof data === 'string') {
            prompts.push(data);
        } else if (Array.isArray(data)) {
            prompts.push(...data.filter(item => typeof item === 'string'));
        } else if (data.descriptions) {
            prompts.push(...data.descriptions);
        }
        
        return prompts;
    }
    
    suggest3DModels(data) {
        const suggestions = [];
        
        // Analyze data for 3D model suggestions
        if (data.type === 'character') {
            suggestions.push('humanoid', 'avatar', 'npc');
        } else if (data.type === 'environment') {
            suggestions.push('terrain', 'buildings', 'vegetation');
        } else if (data.type === 'object') {
            suggestions.push('prop', 'interactive', 'decoration');
        }
        
        return suggestions;
    }
    
    calculateRequirements(data) {
        const requirements = {
            compute: 0,
            storage: 0,
            bandwidth: 0,
            human: 0
        };
        
        // Calculate based on data
        if (data.processing) {
            requirements.compute = data.processing.complexity * 100;
        }
        
        if (data.storage) {
            requirements.storage = data.storage.size || 100;
        }
        
        if (data.team) {
            requirements.human = data.team.size || 1;
        }
        
        return requirements;
    }
    
    estimateTimeline(data) {
        let days = 1;
        
        if (data.complexity) {
            days *= data.complexity * 10;
        }
        
        if (data.dependencies) {
            days += data.dependencies.length * 2;
        }
        
        return {
            optimistic: Math.floor(days * 0.7),
            realistic: Math.floor(days),
            pessimistic: Math.floor(days * 1.5)
        };
    }
    
    generateResourceReport() {
        const report = {
            timestamp: new Date(),
            resources: {}
        };
        
        for (const [type, tracker] of this.state.resources) {
            report.resources[type] = {
                total: tracker.total,
                allocated: tracker.allocated,
                available: tracker.available,
                utilization: (tracker.allocated / tracker.total * 100).toFixed(1) + '%'
            };
        }
        
        return report;
    }
    
    generateProjectStatusReport() {
        const report = {
            timestamp: new Date(),
            projects: []
        };
        
        for (const [id, project] of this.state.activeProjects) {
            report.projects.push({
                id,
                name: project.name,
                status: project.status,
                progress: (project.metrics.progress * 100).toFixed(1) + '%',
                quality: (project.metrics.quality * 100).toFixed(1) + '%',
                efficiency: (project.metrics.efficiency * 100).toFixed(1) + '%',
                domain: project.domain,
                faction: project.faction
            });
        }
        
        return report;
    }
    
    generateDecisionHistoryReport() {
        const report = {
            timestamp: new Date(),
            summary: {
                total: this.state.decisions.length,
                approved: this.state.decisions.filter(d => d.outcome === 'approve').length,
                rejected: this.state.decisions.filter(d => d.outcome === 'reject').length,
                conditional: this.state.decisions.filter(d => d.outcome === 'conditional').length
            },
            recentDecisions: this.state.decisions.slice(-10).map(d => ({
                id: d.id,
                type: d.request.type,
                outcome: d.outcome,
                timestamp: d.timestamp
            }))
        };
        
        return report;
    }
    
    generateDomainPerformanceReport() {
        const report = {
            timestamp: new Date(),
            domains: []
        };
        
        for (const [id, domain] of this.state.domains) {
            report.domains.push({
                id,
                name: domain.name,
                faction: domain.faction,
                status: domain.status,
                metrics: domain.metrics,
                projects: Array.from(this.state.activeProjects.values())
                    .filter(p => p.domain === domain.name).length
            });
        }
        
        return report;
    }
    
    generateAICoordinationReport() {
        const report = {
            timestamp: new Date(),
            connections: {
                binaryLoop: this.connections.binaryLoop ? 'connected' : 'disconnected',
                ai3DBridge: this.connections.ai3DBridge ? 'connected' : 'disconnected'
            },
            aiDecisions: this.state.decisions.filter(d => d.request.type === 'ai_coordination').length,
            executivePersonality: this.personality,
            coordinationEfficiency: this.calculateCoordinationEfficiency()
        };
        
        return report;
    }
    
    calculateCoordinationEfficiency() {
        // Calculate how well systems are working together
        let efficiency = 0.5;
        
        if (this.connections.binaryLoop) efficiency += 0.2;
        if (this.connections.ai3DBridge) efficiency += 0.2;
        if (this.state.activeProjects.size > 0) efficiency += 0.1;
        
        return (efficiency * 100).toFixed(1) + '%';
    }
    
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                ws.subscriptions = data.channels || ['all'];
                ws.send(JSON.stringify({
                    type: 'subscribed',
                    channels: ws.subscriptions
                }));
                break;
                
            case 'decision_request':
                const decision = await this.makeDecision(data.request);
                ws.send(JSON.stringify({
                    type: 'decision_response',
                    decision
                }));
                break;
                
            case 'status_request':
                ws.send(JSON.stringify({
                    type: 'status_response',
                    status: {
                        executive: this.config.name,
                        role: this.config.role,
                        state: this.state.status,
                        metrics: {
                            projects: this.state.activeProjects.size,
                            decisions: this.state.decisions.length,
                            domains: this.state.domains.size
                        }
                    }
                }));
                break;
                
            case 'command':
                const result = await this.executeCommand(data.command, data.parameters);
                ws.send(JSON.stringify({
                    type: 'command_response',
                    result
                }));
                break;
        }
    }
    
    async executeCommand(command, parameters) {
        switch (command) {
            case 'change_personality':
                if (parameters.pattern && this.decisionPatterns[parameters.pattern]) {
                    this.personality.pattern = parameters.pattern;
                    return { success: true, message: `Personality changed to ${parameters.pattern}` };
                }
                break;
                
            case 'emergency_stop':
                // Emergency stop all projects
                for (const [id, project] of this.state.activeProjects) {
                    project.status = 'paused';
                }
                return { success: true, message: 'All projects paused' };
                
            case 'optimize_now':
                await this.optimizeResources();
                return { success: true, message: 'Resource optimization complete' };
                
            default:
                return { success: false, message: `Unknown command: ${command}` };
        }
    }
    
    makeAnnouncement(type, data) {
        const announcement = {
            type,
            timestamp: new Date(),
            executive: this.config.name,
            ...data
        };
        
        console.log(`📢 ${this.config.name} announces:`, type, data.message || '');
        
        this.emit('announcement', announcement);
    }
    
    getExecutiveDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Executive OS Dashboard - ${this.config.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            line-height: 1.6;
        }
        
        .dashboard {
            display: grid;
            grid-template-columns: 250px 1fr 300px;
            height: 100vh;
        }
        
        /* Sidebar */
        .sidebar {
            background: #1a1a1a;
            padding: 20px;
            border-right: 1px solid #333;
        }
        
        .executive-info {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .executive-avatar {
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
        }
        
        .executive-name {
            font-size: 24px;
            font-weight: bold;
            color: #fff;
        }
        
        .executive-role {
            color: #888;
            font-size: 14px;
        }
        
        .nav-menu {
            list-style: none;
        }
        
        .nav-item {
            padding: 12px 15px;
            margin: 5px 0;
            background: #262626;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .nav-item:hover {
            background: #333;
            transform: translateX(5px);
        }
        
        .nav-item.active {
            background: #667eea;
            color: #fff;
        }
        
        /* Main Content */
        .main-content {
            padding: 30px;
            overflow-y: auto;
        }
        
        .header {
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 20px;
            transition: transform 0.3s;
        }
        
        .metric-card:hover {
            transform: translateY(-5px);
            border-color: #667eea;
        }
        
        .metric-label {
            color: #888;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .metric-value {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
        }
        
        .metric-change {
            font-size: 14px;
            margin-top: 5px;
        }
        
        .metric-change.positive {
            color: #4ade80;
        }
        
        .metric-change.negative {
            color: #f87171;
        }
        
        /* Charts */
        .chart-container {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .chart-title {
            font-size: 18px;
            margin-bottom: 15px;
            color: #fff;
        }
        
        #decisionChart, #resourceChart {
            height: 300px;
        }
        
        /* Activity Feed */
        .activity-feed {
            background: #1a1a1a;
            border-left: 1px solid #333;
            padding: 20px;
            overflow-y: auto;
        }
        
        .activity-header {
            font-size: 18px;
            margin-bottom: 20px;
            color: #fff;
        }
        
        .activity-item {
            padding: 15px;
            margin-bottom: 10px;
            background: #262626;
            border-radius: 8px;
            border-left: 3px solid #667eea;
        }
        
        .activity-time {
            font-size: 12px;
            color: #888;
            margin-bottom: 5px;
        }
        
        .activity-content {
            font-size: 14px;
        }
        
        /* Decision Panel */
        .decision-panel {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .decision-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
        }
        
        .form-label {
            font-size: 14px;
            color: #888;
            margin-bottom: 5px;
        }
        
        .form-input, .form-select, .form-textarea {
            background: #262626;
            border: 1px solid #333;
            border-radius: 6px;
            padding: 10px;
            color: #fff;
            font-size: 14px;
        }
        
        .form-textarea {
            resize: vertical;
            min-height: 100px;
        }
        
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        /* Real-time indicators */
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #4ade80;
            border-radius: 50%;
            margin-right: 5px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(74, 222, 128, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
            }
        }
        
        /* WebSocket Status */
        .ws-status {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #262626;
            border: 1px solid #333;
            border-radius: 20px;
            padding: 10px 20px;
            display: flex;
            align-items: center;
            font-size: 14px;
        }
        
        .ws-status.connected {
            border-color: #4ade80;
        }
        
        .ws-status.disconnected {
            border-color: #f87171;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="executive-info">
                <div class="executive-avatar">🤖</div>
                <div class="executive-name">${this.config.name}</div>
                <div class="executive-role">${this.config.role}</div>
            </div>
            
            <ul class="nav-menu">
                <li class="nav-item active" onclick="showSection('overview')">📊 Overview</li>
                <li class="nav-item" onclick="showSection('decisions')">🎯 Decisions</li>
                <li class="nav-item" onclick="showSection('projects')">📁 Projects</li>
                <li class="nav-item" onclick="showSection('resources')">💎 Resources</li>
                <li class="nav-item" onclick="showSection('domains')">🌐 Domains</li>
                <li class="nav-item" onclick="showSection('realtime')">📡 Real-Time</li>
                <li class="nav-item" onclick="showSection('reports')">📈 Reports</li>
            </ul>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
            <div class="header">
                <h1>Executive Command Center</h1>
                <p>Real-time insights and decision-making dashboard</p>
            </div>
            
            <!-- Overview Section -->
            <div id="overview-section" class="content-section">
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-label">Total Decisions</div>
                        <div class="metric-value" id="totalDecisions">0</div>
                        <div class="metric-change positive">+12% this hour</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-label">Active Projects</div>
                        <div class="metric-value" id="activeProjects">0</div>
                        <div class="metric-change positive">+2 today</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-label">Resource Utilization</div>
                        <div class="metric-value" id="resourceUtil">0%</div>
                        <div class="metric-change negative">-5% from peak</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-label">System Health</div>
                        <div class="metric-value" id="systemHealth">
                            <span class="status-indicator"></span>
                            Healthy
                        </div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <div class="chart-title">Decision History</div>
                    <canvas id="decisionChart"></canvas>
                </div>
                
                <div class="chart-container">
                    <div class="chart-title">Resource Allocation</div>
                    <canvas id="resourceChart"></canvas>
                </div>
            </div>
            
            <!-- Decisions Section -->
            <div id="decisions-section" class="content-section" style="display: none;">
                <div class="decision-panel">
                    <h2>Make Executive Decision</h2>
                    <form class="decision-form" onsubmit="submitDecision(event)">
                        <div class="form-group">
                            <label class="form-label">Decision Type</label>
                            <select class="form-select" id="decisionType">
                                <option value="create_project">Create Project</option>
                                <option value="allocate_resources">Allocate Resources</option>
                                <option value="strategic_pivot">Strategic Pivot</option>
                                <option value="emergency_response">Emergency Response</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Priority</label>
                            <select class="form-select" id="priority">
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea class="form-textarea" id="description" placeholder="Describe the decision context..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <input type="checkbox" id="weatherSensitive"> Weather Sensitive
                            </label>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">Submit for Decision</button>
                    </form>
                </div>
                
                <div id="decisionResults"></div>
            </div>
        </div>
        
        <!-- Activity Feed -->
        <div class="activity-feed">
            <h3 class="activity-header">
                <span class="status-indicator"></span>
                Live Activity
            </h3>
            <div id="activityFeed">
                <!-- Activity items will be added here -->
            </div>
        </div>
    </div>
    
    <!-- WebSocket Status -->
    <div class="ws-status disconnected" id="wsStatus">
        <span class="status-indicator"></span>
        <span id="wsStatusText">Connecting...</span>
    </div>
    
    <script>
        // WebSocket connection
        let ws = null;
        let reconnectInterval = null;
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.config.wsPort}');
            
            ws.onopen = () => {
                console.log('Connected to Executive OS');
                updateWSStatus(true);
                
                // Subscribe to all channels
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    channels: ['all']
                }));
                
                // Request initial status
                ws.send(JSON.stringify({
                    type: 'status_request'
                }));
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onclose = () => {
                console.log('Disconnected from Executive OS');
                updateWSStatus(false);
                
                // Attempt to reconnect
                if (!reconnectInterval) {
                    reconnectInterval = setInterval(() => {
                        console.log('Attempting to reconnect...');
                        connectWebSocket();
                    }, 5000);
                }
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }
        
        function updateWSStatus(connected) {
            const statusEl = document.getElementById('wsStatus');
            const statusText = document.getElementById('wsStatusText');
            
            if (connected) {
                statusEl.classList.remove('disconnected');
                statusEl.classList.add('connected');
                statusText.textContent = 'Connected';
                
                if (reconnectInterval) {
                    clearInterval(reconnectInterval);
                    reconnectInterval = null;
                }
            } else {
                statusEl.classList.remove('connected');
                statusEl.classList.add('disconnected');
                statusText.textContent = 'Disconnected';
            }
        }
        
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'announcement':
                    addActivityItem(data);
                    break;
                    
                case 'status_response':
                    updateDashboard(data.status);
                    break;
                    
                case 'decision_response':
                    displayDecisionResult(data.decision);
                    break;
            }
        }
        
        function addActivityItem(data) {
            const feed = document.getElementById('activityFeed');
            const item = document.createElement('div');
            item.className = 'activity-item';
            
            const time = new Date(data.timestamp).toLocaleTimeString();
            
            item.innerHTML = \`
                <div class="activity-time">\${time}</div>
                <div class="activity-content">\${data.message || data.type}</div>
            \`;
            
            feed.insertBefore(item, feed.firstChild);
            
            // Keep only last 20 items
            while (feed.children.length > 20) {
                feed.removeChild(feed.lastChild);
            }
        }
        
        function updateDashboard(status) {
            document.getElementById('totalDecisions').textContent = status.metrics.decisions;
            document.getElementById('activeProjects').textContent = status.metrics.projects;
            
            // Update other metrics
            updateCharts();
        }
        
        function showSection(section) {
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(el => {
                el.style.display = 'none';
            });
            
            // Show selected section
            const sectionEl = document.getElementById(section + '-section');
            if (sectionEl) {
                sectionEl.style.display = 'block';
            }
            
            // Update nav
            document.querySelectorAll('.nav-item').forEach(el => {
                el.classList.remove('active');
            });
            event.target.classList.add('active');
        }
        
        async function submitDecision(event) {
            event.preventDefault();
            
            const request = {
                type: document.getElementById('decisionType').value,
                priority: document.getElementById('priority').value,
                description: document.getElementById('description').value,
                weatherSensitive: document.getElementById('weatherSensitive').checked
            };
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'decision_request',
                    request
                }));
            } else {
                // Fallback to HTTP
                try {
                    const response = await fetch('/api/executive/decide', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(request)
                    });
                    
                    const decision = await response.json();
                    displayDecisionResult(decision);
                } catch (error) {
                    console.error('Decision error:', error);
                }
            }
        }
        
        function displayDecisionResult(decision) {
            const resultsEl = document.getElementById('decisionResults');
            
            resultsEl.innerHTML = \`
                <div class="decision-panel">
                    <h3>Decision Result</h3>
                    <p><strong>ID:</strong> \${decision.id}</p>
                    <p><strong>Outcome:</strong> \${decision.outcome}</p>
                    <p><strong>Reasoning:</strong> \${decision.evaluation?.reasoning || 'N/A'}</p>
                    <p><strong>Executive Notes:</strong> \${decision.executiveNotes || 'None'}</p>
                </div>
            \`;
        }
        
        function updateCharts() {
            // Would implement actual charting here
            console.log('Updating charts...');
        }
        
        // Auto-update metrics
        setInterval(async () => {
            try {
                const response = await fetch('/api/executive/status');
                const status = await response.json();
                
                document.getElementById('totalDecisions').textContent = status.totalDecisions;
                document.getElementById('activeProjects').textContent = status.activeProjects;
                
                // Calculate and display resource utilization
                const utilResponse = await fetch('/api/executive/report/resource_utilization');
                const utilReport = await utilResponse.json();
                
                let totalUtil = 0;
                let resourceCount = 0;
                
                if (utilReport.content && utilReport.content.resources) {
                    for (const resource of Object.values(utilReport.content.resources)) {
                        totalUtil += parseFloat(resource.utilization);
                        resourceCount++;
                    }
                }
                
                const avgUtil = resourceCount > 0 ? (totalUtil / resourceCount).toFixed(1) : 0;
                document.getElementById('resourceUtil').textContent = avgUtil + '%';
                
            } catch (error) {
                console.error('Failed to update metrics:', error);
            }
        }, 5000);
        
        // Initialize
        connectWebSocket();
    </script>
</body>
</html>
        `;
    }
}

// Export for use
export default ExecutiveOSCore;

// Import os module
import os from 'os';

// Start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const executive = new ExecutiveOSCore({
        name: 'ExecutiveAI-Prime',
        role: 'Chief Executive Officer'
    });
}