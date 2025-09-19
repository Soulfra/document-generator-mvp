#!/usr/bin/env node

/**
 * Intelligent Auth Gateway
 * 
 * Smart authentication and authorization system for the CAL creative workflow.
 * Uses contextual intelligence to minimize friction while maintaining security.
 * 
 * Key Features:
 * - Risk-based authentication
 * - Session context awareness
 * - Learning from user patterns
 * - Minimal interruption for creative work
 * - Smart routing based on content type and user intent
 */

const http = require('http');
const url = require('url');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

class IntelligentAuthGateway {
    constructor() {
        this.config = {
            port: 9998,
            wsPort: 9999,
            
            // CAL service endpoints  
            calMasterUrl: 'http://localhost:3336',
            creativeWorkflowUrl: 'http://localhost:8083',
            
            // Session management
            sessionTimeout: 3600000, // 1 hour
            contextTimeout: 300000,   // 5 minutes
            
            // Risk levels and their auth requirements
            riskLevels: {
                'low': {
                    autoApprove: true,
                    requiresConfirmation: false,
                    description: 'Safe creative work - auto-approved'
                },
                'medium': {
                    autoApprove: false,
                    requiresConfirmation: true,
                    description: 'Needs quick confirmation'
                },
                'high': {
                    autoApprove: false,
                    requiresConfirmation: true,
                    requiresReason: true,
                    description: 'Requires explicit approval with reason'
                },
                'critical': {
                    autoApprove: false,
                    requiresConfirmation: true,
                    requiresReason: true,
                    requiresDoubleConfirm: true,
                    description: 'Critical action - multiple confirmations needed'
                }
            }
        };
        
        this.sessions = new Map();
        this.userContexts = new Map();
        this.approvalQueue = new Map();
        this.userLearning = new Map();
        this.wsClients = [];
        
        this.loadUserLearningData();
        this.setupWebSocketServer();
    }
    
    async start() {
        console.log('🔐 INTELLIGENT AUTH GATEWAY STARTING');
        console.log('=====================================');
        console.log('');
        console.log('🧠 Smart Features:');
        console.log('   • Risk-based authentication');
        console.log('   • Session context awareness');
        console.log('   • Pattern learning from user behavior');
        console.log('   • Minimal friction for creative work');
        console.log('   • Auto-approval for safe operations');
        console.log('');
        
        this.server = http.createServer((req, res) => this.handleRequest(req, res));
        
        this.server.listen(this.config.port, () => {
            console.log(`✅ Auth Gateway listening on port ${this.config.port}`);
            console.log(`🌐 WebSocket server on port ${this.config.wsPort}`);
            console.log('');
            console.log('🎯 Integration Points:');
            console.log(`   • CAL Master: ${this.config.calMasterUrl}`);
            console.log(`   • Creative Bridge: ${this.config.creativeWorkflowUrl}`);
            console.log('');
            console.log('📊 Current Risk Levels:');
            Object.entries(this.config.riskLevels).forEach(([level, config]) => {
                const symbol = config.autoApprove ? '✅' : '⚠️';
                console.log(`   ${symbol} ${level}: ${config.description}`);
            });
            console.log('');
        });
        
        this.startPeriodicCleanup();
        this.startLearningAnalysis();
    }
    
    setupWebSocketServer() {
        const wsServer = http.createServer();
        this.wss = new WebSocket.Server({ server: wsServer });
        
        this.wss.on('connection', (ws, req) => {
            const query = url.parse(req.url, true).query;
            const sessionId = query.sessionId || this.generateSessionId();
            
            console.log(`🔌 WebSocket connection: session ${sessionId}`);
            
            ws.sessionId = sessionId;
            this.wsClients.push(ws);
            
            // Send current session info
            ws.send(JSON.stringify({
                type: 'session-info',
                data: {
                    sessionId,
                    riskProfile: this.getUserRiskProfile(sessionId),
                    activeApprovals: this.getActiveApprovalsForSession(sessionId)
                }
            }));
            
            ws.on('message', (message) => {
                this.handleWebSocketMessage(ws, JSON.parse(message));
            });
            
            ws.on('close', () => {
                this.wsClients = this.wsClients.filter(client => client !== ws);
            });
        });
        
        wsServer.listen(this.config.wsPort);
    }
    
    async handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const path = parsedUrl.pathname;
        const query = parsedUrl.query;
        
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-ID');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        console.log(`🔍 ${req.method} ${path}`);
        
        try {
            // Route requests
            if (path === '/api/auth/evaluate') {
                await this.handleEvaluateRequest(req, res);
            } else if (path === '/api/auth/approve') {
                await this.handleApprovalRequest(req, res);
            } else if (path === '/api/auth/context') {
                await this.handleContextRequest(req, res);
            } else if (path === '/api/auth/session') {
                await this.handleSessionRequest(req, res);
            } else if (path === '/health') {
                this.sendResponse(res, 200, { status: 'healthy', service: 'intelligent-auth-gateway' });
            } else if (path === '/dashboard') {
                await this.serveDashboard(res);
            } else {
                this.sendResponse(res, 404, { error: 'Endpoint not found' });
            }
            
        } catch (error) {
            console.error('❌ Request error:', error);
            this.sendResponse(res, 500, { error: 'Internal server error', details: error.message });
        }
    }
    
    async handleEvaluateRequest(req, res) {
        const requestBody = await this.readRequestBody(req);
        const sessionId = req.headers['x-session-id'] || this.generateSessionId();
        
        console.log(`🧠 Evaluating request for session ${sessionId}`);
        
        const evaluation = await this.evaluateRequest(requestBody, sessionId);
        
        // Update user context
        this.updateUserContext(sessionId, {
            lastEvaluation: evaluation,
            timestamp: new Date(),
            request: requestBody
        });
        
        // Log the decision
        console.log(`📊 Risk Level: ${evaluation.riskLevel}`);
        console.log(`⚡ Auto-Approve: ${evaluation.autoApprove ? 'Yes' : 'No'}`);
        if (evaluation.reasoning) {
            console.log(`💭 Reasoning: ${evaluation.reasoning}`);
        }
        
        this.sendResponse(res, 200, evaluation);
        
        // Broadcast to WebSocket clients
        this.broadcastToSession(sessionId, {
            type: 'evaluation-result',
            data: evaluation
        });
    }
    
    async evaluateRequest(requestData, sessionId) {
        const context = this.getUserContext(sessionId);
        const learningData = this.getUserLearning(sessionId);
        
        // Base evaluation
        let riskLevel = 'low';
        let reasoning = [];
        let factors = {};
        
        // Content type analysis
        if (requestData.contentType) {
            const contentRisk = this.assessContentRisk(requestData.contentType, requestData);
            riskLevel = this.combineRiskLevels(riskLevel, contentRisk.level);
            reasoning.push(`Content type '${requestData.contentType}': ${contentRisk.reason}`);
            factors.contentType = contentRisk;
        }
        
        // File operation analysis
        if (requestData.operation) {
            const operationRisk = this.assessOperationRisk(requestData.operation, requestData);
            riskLevel = this.combineRiskLevels(riskLevel, operationRisk.level);
            reasoning.push(`Operation '${requestData.operation}': ${operationRisk.reason}`);
            factors.operation = operationRisk;
        }
        
        // Context analysis (user patterns)
        if (context.recentActivity) {
            const contextRisk = this.assessContextRisk(context, requestData);
            riskLevel = this.combineRiskLevels(riskLevel, contextRisk.level);
            reasoning.push(`Context analysis: ${contextRisk.reason}`);
            factors.context = contextRisk;
        }
        
        // Learning-based adjustments
        if (learningData.trustScore > 80) {
            riskLevel = this.reduceriskLevel(riskLevel);
            reasoning.push('High trust score - risk reduced');
            factors.trustAdjustment = { applied: true, previousScore: learningData.trustScore };
        }
        
        // Time-based factors
        const timeRisk = this.assessTimeRisk(requestData);
        if (timeRisk.level !== 'low') {
            riskLevel = this.combineRiskLevels(riskLevel, timeRisk.level);
            reasoning.push(`Time-based risk: ${timeRisk.reason}`);
            factors.timing = timeRisk;
        }
        
        // Create final evaluation
        const riskConfig = this.config.riskLevels[riskLevel];
        const evaluation = {
            sessionId,
            riskLevel,
            autoApprove: riskConfig.autoApprove,
            requiresConfirmation: riskConfig.requiresConfirmation,
            requiresReason: riskConfig.requiresReason || false,
            requiresDoubleConfirm: riskConfig.requiresDoubleConfirm || false,
            reasoning: reasoning.join('; '),
            factors,
            evaluatedAt: new Date(),
            expiresAt: new Date(Date.now() + 300000) // 5 minutes
        };
        
        // If approval is needed, add to queue
        if (!evaluation.autoApprove) {
            const approvalId = this.generateApprovalId();
            evaluation.approvalId = approvalId;
            this.approvalQueue.set(approvalId, {
                ...evaluation,
                requestData,
                status: 'pending'
            });
        }
        
        return evaluation;
    }
    
    assessContentRisk(contentType, requestData) {
        const riskMap = {
            'image': { level: 'low', reason: 'Image content - minimal risk' },
            'document': { level: 'low', reason: 'Document content - safe for processing' },
            'business-plan': { level: 'medium', reason: 'Business plan - contains sensitive info' },
            'api-spec': { level: 'medium', reason: 'API specification - technical implementation' },
            'code': { level: 'medium', reason: 'Code content - needs review' },
            'config': { level: 'high', reason: 'Configuration file - system-level changes' },
            'unknown': { level: 'medium', reason: 'Unknown content type - cautious approach' }
        };
        
        return riskMap[contentType] || riskMap['unknown'];
    }
    
    assessOperationRisk(operation, requestData) {
        const riskMap = {
            'analyze': { level: 'low', reason: 'Analysis operation - read-only' },
            'generate': { level: 'low', reason: 'Content generation - creative work' },
            'process': { level: 'low', reason: 'Processing request - transformation' },
            'build': { level: 'medium', reason: 'Build operation - creates deployable code' },
            'deploy': { level: 'high', reason: 'Deployment - affects live systems' },
            'delete': { level: 'high', reason: 'Delete operation - permanent changes' },
            'modify-system': { level: 'critical', reason: 'System modification - high impact' }
        };
        
        return riskMap[operation] || { level: 'medium', reason: 'Unknown operation type' };
    }
    
    assessContextRisk(context, requestData) {
        let risk = 'low';
        let reasons = [];
        
        // Check recent failure rate
        if (context.recentFailures > 3) {
            risk = 'medium';
            reasons.push('Recent failures detected');
        }
        
        // Check for unusual patterns
        if (context.requestsInLastHour > 50) {
            risk = 'medium';
            reasons.push('High request frequency');
        }
        
        // Check time since last approval
        if (context.lastApproval && (Date.now() - context.lastApproval.getTime()) < 60000) {
            risk = 'low'; // Recent approval reduces risk
            reasons.push('Recent approval - trust extended');
        }
        
        return {
            level: risk,
            reason: reasons.join(', ') || 'Normal usage patterns'
        };
    }
    
    assessTimeRisk(requestData) {
        const hour = new Date().getHours();
        
        // Higher risk for unusual hours (might be automated/malicious)
        if (hour < 6 || hour > 23) {
            return { level: 'medium', reason: 'Unusual time - late night/early morning' };
        }
        
        // Normal business hours are lower risk
        if (hour >= 9 && hour <= 17) {
            return { level: 'low', reason: 'Business hours - normal usage time' };
        }
        
        return { level: 'low', reason: 'Normal usage hours' };
    }
    
    combineRiskLevels(level1, level2) {
        const levels = ['low', 'medium', 'high', 'critical'];
        const index1 = levels.indexOf(level1);
        const index2 = levels.indexOf(level2);
        return levels[Math.max(index1, index2)];
    }
    
    reduceriskLevel(currentLevel) {
        const reduction = {
            'critical': 'high',
            'high': 'medium', 
            'medium': 'low',
            'low': 'low'
        };
        return reduction[currentLevel] || currentLevel;
    }
    
    async handleApprovalRequest(req, res) {
        const requestBody = await this.readRequestBody(req);
        const { approvalId, decision, reason } = requestBody;
        
        if (!this.approvalQueue.has(approvalId)) {
            this.sendResponse(res, 404, { error: 'Approval request not found' });
            return;
        }
        
        const approval = this.approvalQueue.get(approvalId);
        approval.status = decision;
        approval.decisionReason = reason;
        approval.decidedAt = new Date();
        
        console.log(`📋 Approval ${approvalId}: ${decision.toUpperCase()}`);
        if (reason) console.log(`💬 Reason: ${reason}`);
        
        // Update user learning
        this.updateUserLearning(approval.sessionId, {
            decision,
            riskLevel: approval.riskLevel,
            contentType: approval.requestData?.contentType,
            timestamp: new Date()
        });
        
        this.sendResponse(res, 200, {
            approvalId,
            decision,
            processedAt: new Date()
        });
        
        // Broadcast decision
        this.broadcastToSession(approval.sessionId, {
            type: 'approval-decision',
            data: { approvalId, decision, reason }
        });
        
        // If approved, forward to CAL
        if (decision === 'approved') {
            this.forwardToCAL(approval);
        }
        
        this.approvalQueue.delete(approvalId);
    }
    
    async forwardToCAL(approval) {
        console.log(`🚀 Forwarding approved request to CAL...`);
        
        try {
            const calPayload = {
                ...approval.requestData,
                approvalId: approval.approvalId,
                approvedAt: approval.decidedAt,
                riskLevel: approval.riskLevel,
                source: 'intelligent-auth-gateway'
            };
            
            const response = await this.makeHTTPRequest({
                method: 'POST',
                hostname: 'localhost',
                port: 3336,
                path: '/api/process-approved-work',
                headers: { 'Content-Type': 'application/json' }
            }, JSON.stringify(calPayload));
            
            console.log(`📨 CAL response: ${response.statusCode}`);
            
        } catch (error) {
            console.error(`❌ Failed to forward to CAL: ${error.message}`);
        }
    }
    
    getUserContext(sessionId) {
        if (!this.userContexts.has(sessionId)) {
            this.userContexts.set(sessionId, {
                createdAt: new Date(),
                recentActivity: [],
                recentFailures: 0,
                requestsInLastHour: 0,
                lastApproval: null
            });
        }
        return this.userContexts.get(sessionId);
    }
    
    updateUserContext(sessionId, data) {
        const context = this.getUserContext(sessionId);
        
        // Add to recent activity
        context.recentActivity.push({
            ...data,
            timestamp: new Date()
        });
        
        // Keep only last 50 activities
        if (context.recentActivity.length > 50) {
            context.recentActivity = context.recentActivity.slice(-50);
        }
        
        // Update request count
        const oneHourAgo = Date.now() - 3600000;
        context.requestsInLastHour = context.recentActivity.filter(
            activity => activity.timestamp.getTime() > oneHourAgo
        ).length;
        
        this.userContexts.set(sessionId, context);
    }
    
    getUserLearning(sessionId) {
        if (!this.userLearning.has(sessionId)) {
            this.userLearning.set(sessionId, {
                trustScore: 50, // Start neutral
                approvalHistory: [],
                contentPreferences: {},
                riskTolerance: 'medium'
            });
        }
        return this.userLearning.get(sessionId);
    }
    
    updateUserLearning(sessionId, decision) {
        const learning = this.getUserLearning(sessionId);
        
        learning.approvalHistory.push(decision);
        
        // Adjust trust score based on decisions
        if (decision.decision === 'approved') {
            learning.trustScore = Math.min(100, learning.trustScore + 2);
        } else {
            learning.trustScore = Math.max(0, learning.trustScore - 5);
        }
        
        // Track content preferences
        if (decision.contentType) {
            if (!learning.contentPreferences[decision.contentType]) {
                learning.contentPreferences[decision.contentType] = { approved: 0, rejected: 0 };
            }
            learning.contentPreferences[decision.contentType][decision.decision === 'approved' ? 'approved' : 'rejected']++;
        }
        
        // Keep only last 100 decisions
        if (learning.approvalHistory.length > 100) {
            learning.approvalHistory = learning.approvalHistory.slice(-100);
        }
        
        this.userLearning.set(sessionId, learning);
        this.saveUserLearningData();
    }
    
    generateSessionId() {
        return 'sess-' + crypto.randomBytes(16).toString('hex');
    }
    
    generateApprovalId() {
        return 'appr-' + crypto.randomBytes(8).toString('hex');
    }
    
    getActiveApprovalsForSession(sessionId) {
        return Array.from(this.approvalQueue.values())
            .filter(approval => approval.sessionId === sessionId)
            .map(approval => ({
                approvalId: approval.approvalId,
                riskLevel: approval.riskLevel,
                contentType: approval.requestData?.contentType,
                createdAt: approval.evaluatedAt
            }));
    }
    
    getUserRiskProfile(sessionId) {
        const learning = this.getUserLearning(sessionId);
        const context = this.getUserContext(sessionId);
        
        return {
            trustScore: learning.trustScore,
            riskTolerance: learning.riskTolerance,
            recentActivity: context.recentActivity.length,
            approvalRate: this.calculateApprovalRate(learning.approvalHistory)
        };
    }
    
    calculateApprovalRate(history) {
        if (history.length === 0) return 0;
        const approved = history.filter(h => h.decision === 'approved').length;
        return Math.round((approved / history.length) * 100);
    }
    
    async serveDashboard(res) {
        const dashboard = `<!DOCTYPE html>
<html>
<head>
    <title>CAL Intelligent Auth Gateway</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
        .header { background: #2d3748; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #4299e1; }
        .pending-approvals { background: #fffbf7; border: 1px solid #f6ad55; border-radius: 8px; padding: 15px; }
        .approval-item { background: white; margin: 10px 0; padding: 10px; border-radius: 4px; border-left: 3px solid #ed8936; }
        .status { margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 CAL Intelligent Auth Gateway</h1>
        <p>Smart authentication and authorization for creative workflows</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <h3>Active Sessions</h3>
            <p>${this.sessions.size}</p>
        </div>
        <div class="stat-card">
            <h3>Pending Approvals</h3>
            <p>${this.approvalQueue.size}</p>
        </div>
        <div class="stat-card">
            <h3>WebSocket Clients</h3>
            <p>${this.wsClients.length}</p>
        </div>
        <div class="stat-card">
            <h3>Risk Evaluations Today</h3>
            <p id="evaluationsToday">Loading...</p>
        </div>
    </div>
    
    <div class="pending-approvals">
        <h3>⏳ Pending Approvals</h3>
        <div id="pendingApprovals">
            ${Array.from(this.approvalQueue.values()).map(approval => `
                <div class="approval-item">
                    <strong>Risk Level:</strong> ${approval.riskLevel}<br>
                    <strong>Content:</strong> ${approval.requestData?.contentType || 'Unknown'}<br>
                    <strong>Reasoning:</strong> ${approval.reasoning}<br>
                    <strong>Created:</strong> ${approval.evaluatedAt.toLocaleString()}
                </div>
            `).join('') || '<p>No pending approvals</p>'}
        </div>
    </div>
    
    <div class="status">
        <h3>🎯 System Status</h3>
        <p><strong>Port:</strong> ${this.config.port}</p>
        <p><strong>WebSocket Port:</strong> ${this.config.wsPort}</p>
        <p><strong>CAL Master:</strong> ${this.config.calMasterUrl}</p>
        <p><strong>Started:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboard);
    }
    
    broadcastToSession(sessionId, message) {
        this.wsClients
            .filter(client => client.sessionId === sessionId)
            .forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
    }
    
    startPeriodicCleanup() {
        setInterval(() => {
            const now = Date.now();
            
            // Clean expired sessions
            for (const [sessionId, session] of this.sessions.entries()) {
                if (now - session.lastActivity > this.config.sessionTimeout) {
                    this.sessions.delete(sessionId);
                    console.log(`🧹 Cleaned expired session: ${sessionId}`);
                }
            }
            
            // Clean expired contexts
            for (const [sessionId, context] of this.userContexts.entries()) {
                if (now - context.createdAt.getTime() > this.config.contextTimeout) {
                    this.userContexts.delete(sessionId);
                    console.log(`🧹 Cleaned expired context: ${sessionId}`);
                }
            }
            
            // Clean expired approvals
            for (const [approvalId, approval] of this.approvalQueue.entries()) {
                if (now > approval.expiresAt.getTime()) {
                    this.approvalQueue.delete(approvalId);
                    console.log(`🧹 Cleaned expired approval: ${approvalId}`);
                }
            }
            
        }, 60000); // Run every minute
    }
    
    startLearningAnalysis() {
        setInterval(() => {
            // Analyze user patterns and adjust risk assessment
            console.log('🧠 Running learning analysis...');
            
            for (const [sessionId, learning] of this.userLearning.entries()) {
                const approvalRate = this.calculateApprovalRate(learning.approvalHistory);
                
                // Adjust risk tolerance based on approval patterns
                if (approvalRate > 90 && learning.trustScore > 80) {
                    learning.riskTolerance = 'low'; // More permissive
                } else if (approvalRate < 50) {
                    learning.riskTolerance = 'high'; // More restrictive
                }
                
                this.userLearning.set(sessionId, learning);
            }
            
            this.saveUserLearningData();
            
        }, 300000); // Run every 5 minutes
    }
    
    loadUserLearningData() {
        const learningFile = './auth-gateway-learning.json';
        if (fs.existsSync(learningFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(learningFile, 'utf-8'));
                this.userLearning = new Map(data);
                console.log(`📚 Loaded learning data for ${this.userLearning.size} users`);
            } catch (error) {
                console.log('⚠️ Could not load learning data:', error.message);
            }
        }
    }
    
    saveUserLearningData() {
        try {
            const learningFile = './auth-gateway-learning.json';
            const data = Array.from(this.userLearning.entries());
            fs.writeFileSync(learningFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.log('⚠️ Could not save learning data:', error.message);
        }
    }
    
    async readRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    resolve(body ? JSON.parse(body) : {});
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
    
    sendResponse(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data, null, 2));
    }
    
    makeHTTPRequest(options, data) {
        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, body }));
            });
            
            req.on('error', reject);
            req.setTimeout(10000, () => reject(new Error('Request timeout')));
            
            if (data) req.write(data);
            req.end();
        });
    }
    
    handleWebSocketMessage(ws, message) {
        const { type, data } = message;
        
        if (type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', data: { timestamp: new Date() } }));
        } else if (type === 'get-status') {
            ws.send(JSON.stringify({
                type: 'status',
                data: {
                    sessions: this.sessions.size,
                    pendingApprovals: this.approvalQueue.size,
                    wsClients: this.wsClients.length
                }
            }));
        }
    }
    
    // CLI interface
    showStatus() {
        console.log('');
        console.log('🔐 INTELLIGENT AUTH GATEWAY STATUS');
        console.log('=================================');
        console.log(`Running: ✅ Yes`);
        console.log(`Port: ${this.config.port}`);
        console.log(`WebSocket Port: ${this.config.wsPort}`);
        console.log(`Active Sessions: ${this.sessions.size}`);
        console.log(`Pending Approvals: ${this.approvalQueue.size}`);
        console.log(`WebSocket Clients: ${this.wsClients.length}`);
        console.log(`Learning Data: ${this.userLearning.size} users`);
        console.log('');
    }
}

// CLI interface
if (require.main === module) {
    const gateway = new IntelligentAuthGateway();
    
    const command = process.argv[2];
    
    if (command === 'status') {
        gateway.showStatus();
        process.exit(0);
    }
    
    // Start the gateway
    gateway.start().catch(error => {
        console.error('❌ Failed to start Intelligent Auth Gateway:', error);
        process.exit(1);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Intelligent Auth Gateway shutting down...');
        process.exit(0);
    });
}

module.exports = IntelligentAuthGateway;