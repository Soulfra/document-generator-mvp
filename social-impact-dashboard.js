/**
 * Social Impact Dashboard
 * 
 * Tracks electricity usage justification and educational metrics to ensure
 * gaming activities contribute to social good and educational outcomes.
 * 
 * Core Philosophy: "No electricity waste unless serving nonprofit/greater human good"
 * 
 * Features:
 * - Electricity usage tracking and justification
 * - Educational outcome measurement
 * - Social impact quantification
 * - Real-world skill development metrics
 * - Community contribution tracking
 * - Carbon footprint offset through education
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

class SocialImpactDashboard extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Social impact measurement
            impactMeasurement: {
                electricityJustificationThreshold: 0.7, // Minimum educational value to justify power usage
                socialGoodMultiplier: 2.0, // Amplifies impact when helping others
                communityContributionWeight: 1.5,
                realWorldSkillTransferWeight: 2.0,
                nonprofitAlignmentBonus: 1.8
            },
            
            // Electricity tracking
            electricityTracking: {
                enabled: true,
                estimatedWattsPerHour: 150, // Gaming PC + monitor
                carbonFootprintPerKwh: 0.385, // kg CO2 per kWh (US average)
                electricityCostPerKwh: 0.12, // USD per kWh
                trackingInterval: 300000, // 5 minutes
                reportingInterval: 3600000 // 1 hour
            },
            
            // Educational impact categories
            educationalImpact: {
                'direct-skill-development': {
                    weight: 1.0,
                    description: 'Individual skill development through gameplay',
                    justificationLevel: 'moderate'
                },
                'peer-education': {
                    weight: 1.8,
                    description: 'Teaching and mentoring other players',
                    justificationLevel: 'high'
                },
                'community-contribution': {
                    weight: 2.2,
                    description: 'Creating educational content for the community',
                    justificationLevel: 'very-high'
                },
                'research-and-analysis': {
                    weight: 1.5,
                    description: 'Conducting research that benefits the community',
                    justificationLevel: 'high'
                },
                'accessibility-support': {
                    weight: 2.5,
                    description: 'Helping players with disabilities or barriers',
                    justificationLevel: 'maximum'
                },
                'educational-content-creation': {
                    weight: 2.0,
                    description: 'Creating guides, tutorials, and educational materials',
                    justificationLevel: 'very-high'
                }
            },
            
            // Social good categories
            socialGoodCategories: {
                'financial-literacy-education': {
                    socialValue: 2.5,
                    realWorldImpact: 'high',
                    beneficiaryCount: 'many',
                    description: 'Teaching financial management through game mechanics'
                },
                'customer-service-training': {
                    socialValue: 2.0,
                    realWorldImpact: 'high',
                    beneficiaryCount: 'moderate',
                    description: 'Developing customer service skills for employment'
                },
                'digital-literacy': {
                    socialValue: 1.8,
                    realWorldImpact: 'moderate',
                    beneficiaryCount: 'many',
                    description: 'Improving digital skills and computer literacy'
                },
                'social-inclusion': {
                    socialValue: 2.2,
                    realWorldImpact: 'high',
                    beneficiaryCount: 'targeted',
                    description: 'Providing social connection for isolated individuals'
                },
                'mental-health-support': {
                    socialValue: 2.8,
                    realWorldImpact: 'very-high',
                    beneficiaryCount: 'targeted',
                    description: 'Providing therapeutic gaming experiences and social support'
                },
                'workforce-development': {
                    socialValue: 2.6,
                    realWorldImpact: 'very-high',
                    beneficiaryCount: 'moderate',
                    description: 'Developing employment-ready skills through gameplay'
                }
            },
            
            // Integration with educational components
            integration: {
                educationalKnowledgeNetwork: {
                    enabled: true,
                    port: process.env.KNOWLEDGE_NETWORK_WS_PORT || 9908
                },
                financialLiteracyTracker: {
                    enabled: true,
                    port: process.env.FINANCIAL_TRACKER_WS_PORT || 9909
                },
                customerServiceSimulator: {
                    enabled: true,
                    port: process.env.CUSTOMER_SERVICE_WS_PORT || 9907
                },
                educationalContentEngine: {
                    enabled: true,
                    port: process.env.EDUCATIONAL_WS_PORT || 9906
                },
                wsPort: process.env.SOCIAL_IMPACT_WS_PORT || 9910
            },
            
            // Reporting and analytics
            reporting: {
                dailyReports: true,
                weeklyReports: true,
                monthlyReports: true,
                carbonOffsetCalculation: true,
                socialReturnOnInvestment: true,
                communityImpactMetrics: true
            },
            
            // Electricity justification rules
            justificationRules: {
                minimumEducationalValue: 0.5,
                minimumSocialImpact: 0.4,
                communityBenefitRequired: false,
                nonprofitAlignmentPreferred: true,
                skillTransferEvidence: 'recommended',
                continuousLearningRequired: true
            },
            
            ...config
        };
        
        // Impact tracking data
        this.electricityUsage = new Map();
        this.educationalOutcomes = new Map();
        this.socialImpactMetrics = new Map();
        this.carbonFootprint = new Map();
        this.justificationScores = new Map();
        this.communityContributions = new Map();
        
        // Real-time monitoring
        this.currentSession = null;
        this.liveMetrics = {
            electricityUsed: 0,
            educationalValue: 0,
            socialImpact: 0,
            carbonFootprint: 0,
            justificationScore: 0
        };
        
        // Dashboard state
        this.dashboardClients = new Set();
        this.wsServer = null;
        this.connectedSystems = new Map();
        
        // Periodic tracking
        this.trackingIntervals = new Map();
        this.reportingIntervals = new Map();
        
        console.log('🌍 Social Impact Dashboard initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Start WebSocket server
            await this.startWebSocketServer();
            
            // Connect to educational systems
            await this.connectToEducationalSystems();
            
            // Start electricity tracking
            this.startElectricityTracking();
            
            // Start impact measurement
            this.startImpactMeasurement();
            
            // Start periodic reporting
            this.startPeriodicReporting();
            
            // Load historical data
            await this.loadHistoricalData();
            
            console.log('✅ Social Impact Dashboard ready');
            console.log(`🌍 Dashboard server: ws://localhost:${this.config.integration.wsPort}`);
            console.log(`⚡ Electricity tracking: ${this.config.electricityTracking.enabled ? 'enabled' : 'disabled'}`);
            console.log(`📊 Impact measurement threshold: ${this.config.impactMeasurement.electricityJustificationThreshold}`);
            console.log(`🌱 Carbon footprint tracking: ${this.config.reporting.carbonOffsetCalculation ? 'enabled' : 'disabled'}`);
            
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Social Impact Dashboard:', error.message);
            throw error;
        }
    }
    
    // ==================== WEBSOCKET SERVER ====================
    
    async startWebSocketServer() {
        return new Promise((resolve) => {
            this.wsServer = new WebSocket.Server({ port: this.config.integration.wsPort });
            
            this.wsServer.on('connection', (ws, req) => {
                const clientId = crypto.randomBytes(8).toString('hex');
                console.log(`🌍 Social impact dashboard client connected: ${clientId}`);
                
                const client = { id: clientId, ws, joinedAt: new Date() };
                this.dashboardClients.add(client);
                
                // Send initial dashboard data
                ws.send(JSON.stringify({
                    type: 'dashboard-init',
                    data: {
                        currentMetrics: this.liveMetrics,
                        impactCategories: this.config.educationalImpact,
                        socialGoodCategories: this.config.socialGoodCategories,
                        justificationThreshold: this.config.impactMeasurement.electricityJustificationThreshold,
                        electricityTracking: this.config.electricityTracking.enabled
                    }
                }));
                
                ws.on('message', async (message) => {
                    try {
                        const data = JSON.parse(message);
                        await this.handleDashboardMessage(ws, data, clientId);
                    } catch (error) {
                        console.error('❌ Dashboard message error:', error.message);
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: error.message
                        }));
                    }
                });
                
                ws.on('close', () => {
                    console.log(`🌍 Social impact dashboard client disconnected: ${clientId}`);
                    this.dashboardClients = new Set([...this.dashboardClients].filter(c => c.id !== clientId));
                });
            });
            
            console.log(`🌍 Social Impact Dashboard WebSocket server listening on port ${this.config.integration.wsPort}`);
            resolve();
        });
    }
    
    async handleDashboardMessage(ws, data, clientId) {
        switch (data.type) {
            case 'start-session':
                this.startTrackingSession(data.userId, data.sessionType);
                ws.send(JSON.stringify({
                    type: 'session-started',
                    sessionId: this.currentSession?.id
                }));
                break;
                
            case 'end-session':
                const sessionSummary = await this.endTrackingSession(data.userId);
                ws.send(JSON.stringify({
                    type: 'session-ended',
                    summary: sessionSummary
                }));
                break;
                
            case 'get-impact-report':
                const report = await this.generateImpactReport(data.userId, data.timeframe);
                ws.send(JSON.stringify({
                    type: 'impact-report',
                    report
                }));
                break;
                
            case 'get-justification-status':
                const justification = this.getCurrentJustification(data.userId);
                ws.send(JSON.stringify({
                    type: 'justification-status',
                    justification
                }));
                break;
                
            case 'calculate-carbon-offset':
                const offset = await this.calculateCarbonOffset(data.userId, data.timeframe);
                ws.send(JSON.stringify({
                    type: 'carbon-offset',
                    offset
                }));
                break;
                
            case 'get-social-return':
                const socialReturn = await this.calculateSocialReturnOnInvestment(data.userId, data.timeframe);
                ws.send(JSON.stringify({
                    type: 'social-return',
                    socialReturn
                }));
                break;
                
            default:
                console.warn('❓ Unknown dashboard message type:', data.type);
        }
    }
    
    // ==================== SESSION TRACKING ====================
    
    startTrackingSession(userId, sessionType = 'general') {
        this.currentSession = {
            id: crypto.randomBytes(8).toString('hex'),
            userId,
            sessionType,
            startTime: Date.now(),
            electricityUsedAtStart: this.liveMetrics.electricityUsed,
            educationalActivities: [],
            socialContributions: [],
            justificationEvents: []
        };
        
        console.log(`🎮 Tracking session started: ${userId} - ${sessionType}`);
        
        this.emit('session-started', {
            sessionId: this.currentSession.id,
            userId,
            sessionType
        });
        
        return this.currentSession.id;
    }
    
    async endTrackingSession(userId) {
        if (!this.currentSession || this.currentSession.userId !== userId) {
            throw new Error('No active session found for user');
        }
        
        const session = this.currentSession;
        const endTime = Date.now();
        const sessionDuration = endTime - session.startTime;
        const electricityUsed = this.liveMetrics.electricityUsed - session.electricityUsedAtStart;
        
        // Calculate session impact
        const sessionImpact = await this.calculateSessionImpact(session, sessionDuration, electricityUsed);
        
        // Store session data
        const sessionSummary = {
            sessionId: session.id,
            userId: session.userId,
            sessionType: session.sessionType,
            duration: sessionDuration,
            electricityUsed,
            electricityCost: electricityUsed * this.config.electricityTracking.electricityCostPerKwh,
            carbonFootprint: electricityUsed * this.config.electricityTracking.carbonFootprintPerKwh,
            educationalValue: sessionImpact.educationalValue,
            socialImpact: sessionImpact.socialImpact,
            justificationScore: sessionImpact.justificationScore,
            justificationStatus: sessionImpact.justificationScore >= this.config.impactMeasurement.electricityJustificationThreshold ? 'justified' : 'needs-improvement',
            activities: session.educationalActivities,
            contributions: session.socialContributions,
            endTime
        };
        
        // Save to historical data
        this.saveSessionData(sessionSummary);
        
        console.log(`📊 Session ended: ${sessionSummary.justificationStatus} - Impact: ${sessionImpact.justificationScore.toFixed(2)}`);
        
        this.currentSession = null;
        
        this.emit('session-ended', { summary: sessionSummary });
        
        // Broadcast to dashboard clients
        this.broadcastToDashboardClients({
            type: 'session-completed',
            summary: sessionSummary
        });
        
        return sessionSummary;
    }
    
    async calculateSessionImpact(session, duration, electricityUsed) {
        let educationalValue = 0;
        let socialImpact = 0;
        
        // Calculate educational value from activities
        for (const activity of session.educationalActivities) {
            const categoryConfig = this.config.educationalImpact[activity.category];
            if (categoryConfig) {
                educationalValue += activity.value * categoryConfig.weight;
            }
        }
        
        // Calculate social impact from contributions
        for (const contribution of session.socialContributions) {
            const categoryConfig = this.config.socialGoodCategories[contribution.category];
            if (categoryConfig) {
                socialImpact += contribution.value * categoryConfig.socialValue;
            }
        }
        
        // Normalize values
        const timeHours = duration / (1000 * 60 * 60);
        educationalValue = timeHours > 0 ? educationalValue / timeHours : 0;
        socialImpact = timeHours > 0 ? socialImpact / timeHours : 0;
        
        // Calculate overall justification score
        const baseScore = (educationalValue + socialImpact) / 2;
        
        // Apply multipliers
        let justificationScore = baseScore;
        
        if (socialImpact > 0.7) {
            justificationScore *= this.config.impactMeasurement.socialGoodMultiplier;
        }
        
        if (session.socialContributions.length > 0) {
            justificationScore *= this.config.impactMeasurement.communityContributionWeight;
        }
        
        // Cap at 1.0
        justificationScore = Math.min(1.0, justificationScore);
        
        return {
            educationalValue,
            socialImpact,
            justificationScore
        };
    }
    
    // ==================== ELECTRICITY TRACKING ====================
    
    startElectricityTracking() {
        if (!this.config.electricityTracking.enabled) return;
        
        console.log('⚡ Starting electricity usage tracking...');
        
        // Track electricity usage at regular intervals
        const trackingInterval = setInterval(() => {
            this.trackElectricityUsage();
        }, this.config.electricityTracking.trackingInterval);
        
        this.trackingIntervals.set('electricity', trackingInterval);
        
        // Periodic reporting
        const reportingInterval = setInterval(() => {
            this.generateElectricityReport();
        }, this.config.electricityTracking.reportingInterval);
        
        this.trackingIntervals.set('electricityReporting', reportingInterval);
    }
    
    trackElectricityUsage() {
        const currentTime = Date.now();
        const intervalHours = this.config.electricityTracking.trackingInterval / (1000 * 60 * 60);
        const electricityUsed = this.config.electricityTracking.estimatedWattsPerHour * intervalHours / 1000; // kWh
        
        this.liveMetrics.electricityUsed += electricityUsed;
        this.liveMetrics.carbonFootprint += electricityUsed * this.config.electricityTracking.carbonFootprintPerKwh;
        
        // Store data point
        const dataPoint = {
            timestamp: currentTime,
            electricityUsed,
            carbonFootprint: electricityUsed * this.config.electricityTracking.carbonFootprintPerKwh,
            cost: electricityUsed * this.config.electricityTracking.electricityCostPerKwh,
            educationalValue: this.liveMetrics.educationalValue,
            socialImpact: this.liveMetrics.socialImpact,
            justificationScore: this.liveMetrics.justificationScore
        };
        
        if (!this.electricityUsage.has(this.getTodayKey())) {
            this.electricityUsage.set(this.getTodayKey(), []);
        }
        
        this.electricityUsage.get(this.getTodayKey()).push(dataPoint);
        
        // Update justification score
        this.updateJustificationScore();
        
        // Broadcast update to dashboard clients
        this.broadcastToDashboardClients({
            type: 'electricity-update',
            data: dataPoint
        });
    }
    
    updateJustificationScore() {
        // Calculate current justification based on recent activity
        const recentEducationalValue = this.liveMetrics.educationalValue;
        const recentSocialImpact = this.liveMetrics.socialImpact;
        
        const baseScore = (recentEducationalValue + recentSocialImpact) / 2;
        let justificationScore = baseScore;
        
        // Apply social good multiplier
        if (recentSocialImpact > 0.5) {
            justificationScore *= this.config.impactMeasurement.socialGoodMultiplier;
        }
        
        this.liveMetrics.justificationScore = Math.min(1.0, justificationScore);
        
        // Check if usage is justified
        const isJustified = this.liveMetrics.justificationScore >= this.config.impactMeasurement.electricityJustificationThreshold;
        
        if (!isJustified && this.currentSession) {
            this.emit('electricity-not-justified', {
                sessionId: this.currentSession.id,
                userId: this.currentSession.userId,
                currentScore: this.liveMetrics.justificationScore,
                requiredScore: this.config.impactMeasurement.electricityJustificationThreshold
            });
        }
    }
    
    generateElectricityReport() {
        const todayData = this.electricityUsage.get(this.getTodayKey()) || [];
        
        if (todayData.length === 0) return;
        
        const totalElectricity = todayData.reduce((sum, d) => sum + d.electricityUsed, 0);
        const totalCarbonFootprint = todayData.reduce((sum, d) => sum + d.carbonFootprint, 0);
        const totalCost = todayData.reduce((sum, d) => sum + d.cost, 0);
        const avgJustificationScore = todayData.reduce((sum, d) => sum + d.justificationScore, 0) / todayData.length;
        
        const report = {
            date: this.getTodayKey(),
            totalElectricityUsed: totalElectricity,
            totalCarbonFootprint,
            totalCost,
            averageJustificationScore: avgJustificationScore,
            justificationStatus: avgJustificationScore >= this.config.impactMeasurement.electricityJustificationThreshold ? 'justified' : 'needs-improvement',
            dataPoints: todayData.length
        };
        
        console.log(`⚡ Daily electricity report: ${totalElectricity.toFixed(3)} kWh - ${report.justificationStatus}`);
        
        this.emit('electricity-report', report);
    }
    
    // ==================== IMPACT MEASUREMENT ====================
    
    startImpactMeasurement() {
        console.log('📊 Starting impact measurement...');
        
        // Listen for educational activities from connected systems
        this.on('educational-activity', (activity) => {
            this.recordEducationalActivity(activity);
        });
        
        this.on('social-contribution', (contribution) => {
            this.recordSocialContribution(contribution);
        });
        
        // Periodic impact calculation
        const impactInterval = setInterval(() => {
            this.calculateCurrentImpact();
        }, 60000); // Every minute
        
        this.trackingIntervals.set('impact', impactInterval);
    }
    
    recordEducationalActivity(activity) {
        if (!this.currentSession) return;
        
        const activityRecord = {
            id: crypto.randomBytes(8).toString('hex'),
            category: activity.category,
            description: activity.description,
            value: activity.educationalValue || 0.5,
            duration: activity.duration || 5,
            timestamp: Date.now(),
            userId: activity.userId,
            realWorldSkill: activity.realWorldSkill
        };
        
        this.currentSession.educationalActivities.push(activityRecord);
        
        // Update live metrics
        const categoryConfig = this.config.educationalImpact[activity.category];
        if (categoryConfig) {
            this.liveMetrics.educationalValue = Math.min(1.0, 
                this.liveMetrics.educationalValue + (activityRecord.value * categoryConfig.weight * 0.1)
            );
        }
        
        console.log(`📚 Educational activity recorded: ${activity.category} - Value: ${activityRecord.value}`);
        
        this.emit('educational-activity-recorded', activityRecord);
    }
    
    recordSocialContribution(contribution) {
        if (!this.currentSession) return;
        
        const contributionRecord = {
            id: crypto.randomBytes(8).toString('hex'),
            category: contribution.category,
            description: contribution.description,
            value: contribution.socialValue || 0.5,
            beneficiaryCount: contribution.beneficiaryCount || 1,
            timestamp: Date.now(),
            userId: contribution.userId,
            communityImpact: contribution.communityImpact
        };
        
        this.currentSession.socialContributions.push(contributionRecord);
        
        // Update live metrics
        const categoryConfig = this.config.socialGoodCategories[contribution.category];
        if (categoryConfig) {
            this.liveMetrics.socialImpact = Math.min(1.0,
                this.liveMetrics.socialImpact + (contributionRecord.value * categoryConfig.socialValue * 0.1)
            );
        }
        
        console.log(`🤝 Social contribution recorded: ${contribution.category} - Value: ${contributionRecord.value}`);
        
        this.emit('social-contribution-recorded', contributionRecord);
    }
    
    calculateCurrentImpact() {
        // Decay impact values over time to require continuous contribution
        const decayRate = 0.95; // 5% decay per minute
        
        this.liveMetrics.educationalValue *= decayRate;
        this.liveMetrics.socialImpact *= decayRate;
        
        this.updateJustificationScore();
    }
    
    // ==================== EDUCATIONAL SYSTEM INTEGRATION ====================
    
    async connectToEducationalSystems() {
        console.log('🔗 Connecting to educational systems...');
        
        // Connect to Educational Knowledge Network
        if (this.config.integration.educationalKnowledgeNetwork.enabled) {
            await this.connectToSystem('knowledge-network', this.config.integration.educationalKnowledgeNetwork.port);
        }
        
        // Connect to Financial Literacy Tracker
        if (this.config.integration.financialLiteracyTracker.enabled) {
            await this.connectToSystem('financial-tracker', this.config.integration.financialLiteracyTracker.port);
        }
        
        // Connect to Customer Service Simulator
        if (this.config.integration.customerServiceSimulator.enabled) {
            await this.connectToSystem('customer-service', this.config.integration.customerServiceSimulator.port);
        }
        
        // Connect to Educational Content Engine
        if (this.config.integration.educationalContentEngine.enabled) {
            await this.connectToSystem('content-engine', this.config.integration.educationalContentEngine.port);
        }
    }
    
    async connectToSystem(systemName, port) {
        try {
            const ws = new WebSocket(`ws://localhost:${port}`);
            
            ws.on('open', () => {
                console.log(`✅ Connected to ${systemName}`);
                
                // Register for impact tracking
                ws.send(JSON.stringify({
                    type: 'register-impact-tracker',
                    tracker: 'social-impact-dashboard'
                }));
            });
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleSystemMessage(systemName, data);
                } catch (error) {
                    console.error(`❌ ${systemName} message error:`, error.message);
                }
            });
            
            ws.on('error', (error) => {
                console.warn(`⚠️ ${systemName} connection error:`, error.message);
            });
            
            this.connectedSystems.set(systemName, ws);
            
        } catch (error) {
            console.warn(`⚠️ Could not connect to ${systemName}:`, error.message);
        }
    }
    
    handleSystemMessage(systemName, message) {
        switch (message.type) {
            case 'educational-activity':
                this.emit('educational-activity', {
                    ...message.data,
                    source: systemName
                });
                break;
                
            case 'social-contribution':
                this.emit('social-contribution', {
                    ...message.data,
                    source: systemName
                });
                break;
                
            case 'time-skill-recorded':
                this.emit('educational-activity', {
                    category: 'direct-skill-development',
                    description: `Time-skill exchange: ${message.data.skillDeveloped}`,
                    educationalValue: message.data.educationalValue,
                    duration: message.data.timeSpent,
                    userId: message.data.userId,
                    realWorldSkill: message.data.skillDeveloped,
                    source: systemName
                });
                break;
                
            case 'certification-achieved':
                this.emit('social-contribution', {
                    category: 'workforce-development',
                    description: `Certification achieved: ${message.data.certificationName}`,
                    socialValue: 0.9,
                    beneficiaryCount: 1,
                    userId: message.data.userId,
                    communityImpact: 'skill-certification',
                    source: systemName
                });
                break;
                
            case 'community-help':
                this.emit('social-contribution', {
                    category: 'social-inclusion',
                    description: message.data.description || 'Community assistance',
                    socialValue: 0.8,
                    beneficiaryCount: message.data.beneficiaryCount || 1,
                    userId: message.data.userId,
                    communityImpact: 'peer-support',
                    source: systemName
                });
                break;
        }
    }
    
    // ==================== REPORTING ====================
    
    startPeriodicReporting() {
        console.log('📈 Starting periodic reporting...');
        
        // Daily reports
        if (this.config.reporting.dailyReports) {
            const dailyInterval = setInterval(() => {
                this.generateDailyReport();
            }, 24 * 60 * 60 * 1000); // Daily
            
            this.reportingIntervals.set('daily', dailyInterval);
        }
        
        // Weekly reports
        if (this.config.reporting.weeklyReports) {
            const weeklyInterval = setInterval(() => {
                this.generateWeeklyReport();
            }, 7 * 24 * 60 * 60 * 1000); // Weekly
            
            this.reportingIntervals.set('weekly', weeklyInterval);
        }
    }
    
    async generateImpactReport(userId, timeframe = 'week') {
        const endDate = Date.now();
        let startDate;
        
        switch (timeframe) {
            case 'day':
                startDate = endDate - (24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = endDate - (7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = endDate - (30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = endDate - (7 * 24 * 60 * 60 * 1000);
        }
        
        // Get historical data for the timeframe
        const historicalData = await this.getHistoricalData(userId, startDate, endDate);
        
        const report = {
            userId,
            timeframe,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            
            // Electricity metrics
            totalElectricityUsed: historicalData.reduce((sum, d) => sum + (d.electricityUsed || 0), 0),
            totalCarbonFootprint: historicalData.reduce((sum, d) => sum + (d.carbonFootprint || 0), 0),
            totalElectricityCost: historicalData.reduce((sum, d) => sum + (d.electricityCost || 0), 0),
            
            // Impact metrics
            averageEducationalValue: this.calculateAverage(historicalData, 'educationalValue'),
            averageSocialImpact: this.calculateAverage(historicalData, 'socialImpact'),
            averageJustificationScore: this.calculateAverage(historicalData, 'justificationScore'),
            
            // Justification status
            justificationPercentage: this.calculateJustificationPercentage(historicalData),
            unjustifiedSessions: historicalData.filter(d => d.justificationScore < this.config.impactMeasurement.electricityJustificationThreshold).length,
            
            // Social good breakdown
            socialGoodBreakdown: this.analyzeSocialGoodBreakdown(historicalData),
            
            // Educational outcome summary
            educationalOutcomes: this.summarizeEducationalOutcomes(historicalData),
            
            // Recommendations
            recommendations: this.generateRecommendations(historicalData)
        };
        
        return report;
    }
    
    async calculateCarbonOffset(userId, timeframe = 'month') {
        const report = await this.generateImpactReport(userId, timeframe);
        
        // Calculate carbon offset based on educational and social impact
        const educationalImpactOffset = report.averageEducationalValue * report.totalCarbonFootprint * 2.0;
        const socialImpactOffset = report.averageSocialImpact * report.totalCarbonFootprint * 3.0;
        
        const totalOffset = educationalImpactOffset + socialImpactOffset;
        const netCarbonFootprint = Math.max(0, report.totalCarbonFootprint - totalOffset);
        
        return {
            totalCarbonFootprint: report.totalCarbonFootprint,
            educationalOffset: educationalImpactOffset,
            socialOffset: socialImpactOffset,
            totalOffset,
            netCarbonFootprint,
            offsetPercentage: (totalOffset / report.totalCarbonFootprint) * 100,
            carbonNeutral: netCarbonFootprint === 0,
            additionalOffsetNeeded: netCarbonFootprint
        };
    }
    
    async calculateSocialReturnOnInvestment(userId, timeframe = 'month') {
        const report = await this.generateImpactReport(userId, timeframe);
        
        // Calculate social value created
        const skillDevelopmentValue = report.averageEducationalValue * 100; // $100 per educational unit
        const communityImpactValue = report.averageSocialImpact * 150; // $150 per social impact unit
        const certificationValue = report.educationalOutcomes.certifications * 500; // $500 per certification
        
        const totalSocialValue = skillDevelopmentValue + communityImpactValue + certificationValue;
        const totalInvestment = report.totalElectricityCost; // Cost of electricity
        
        const socialROI = totalInvestment > 0 ? (totalSocialValue / totalInvestment) : 0;
        
        return {
            totalSocialValue,
            totalInvestment,
            socialROI,
            socialROIPercentage: socialROI * 100,
            
            breakdown: {
                skillDevelopmentValue,
                communityImpactValue,
                certificationValue
            },
            
            interpretation: socialROI > 5 ? 'excellent' : 
                          socialROI > 3 ? 'good' : 
                          socialROI > 1 ? 'positive' : 'needs-improvement'
        };
    }
    
    generateDailyReport() {
        const todayData = this.electricityUsage.get(this.getTodayKey()) || [];
        
        if (todayData.length === 0) return;
        
        const report = {
            date: this.getTodayKey(),
            type: 'daily-summary',
            electricityMetrics: this.summarizeElectricityMetrics(todayData),
            impactMetrics: this.summarizeImpactMetrics(todayData),
            justificationStatus: this.assessJustificationStatus(todayData),
            recommendations: this.generateDailyRecommendations(todayData)
        };
        
        console.log(`📊 Daily report generated: ${report.justificationStatus.overall}`);
        
        this.emit('daily-report', report);
        
        // Broadcast to dashboard clients
        this.broadcastToDashboardClients({
            type: 'daily-report',
            report
        });
    }
    
    // ==================== UTILITY METHODS ====================
    
    getCurrentJustification(userId) {
        return {
            userId,
            currentScore: this.liveMetrics.justificationScore,
            requiredScore: this.config.impactMeasurement.electricityJustificationThreshold,
            isJustified: this.liveMetrics.justificationScore >= this.config.impactMeasurement.electricityJustificationThreshold,
            educationalValue: this.liveMetrics.educationalValue,
            socialImpact: this.liveMetrics.socialImpact,
            recommendations: this.getJustificationRecommendations()
        };
    }
    
    getJustificationRecommendations() {
        const recommendations = [];
        
        if (this.liveMetrics.educationalValue < 0.5) {
            recommendations.push('Increase educational activities (tutorials, skill development)');
        }
        
        if (this.liveMetrics.socialImpact < 0.4) {
            recommendations.push('Contribute to community (help other players, create content)');
        }
        
        if (this.liveMetrics.justificationScore < this.config.impactMeasurement.electricityJustificationThreshold) {
            recommendations.push('Focus on high-impact activities to justify electricity usage');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Continue current activities - electricity usage is well justified');
        }
        
        return recommendations;
    }
    
    calculateAverage(data, field) {
        if (data.length === 0) return 0;
        return data.reduce((sum, item) => sum + (item[field] || 0), 0) / data.length;
    }
    
    calculateJustificationPercentage(data) {
        if (data.length === 0) return 0;
        const justifiedSessions = data.filter(d => d.justificationScore >= this.config.impactMeasurement.electricityJustificationThreshold).length;
        return (justifiedSessions / data.length) * 100;
    }
    
    getTodayKey() {
        return new Date().toISOString().split('T')[0];
    }
    
    broadcastToDashboardClients(message) {
        this.dashboardClients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(message));
            }
        });
    }
    
    saveSessionData(sessionSummary) {
        // In a real implementation, this would save to a database
        // For now, we'll store in memory with date-based keys
        const dateKey = new Date(sessionSummary.endTime).toISOString().split('T')[0];
        
        if (!this.educationalOutcomes.has(dateKey)) {
            this.educationalOutcomes.set(dateKey, []);
        }
        
        this.educationalOutcomes.get(dateKey).push(sessionSummary);
    }
    
    async getHistoricalData(userId, startDate, endDate) {
        // In a real implementation, this would query a database
        // For now, return data from memory
        const historicalData = [];
        
        for (const [dateKey, sessions] of this.educationalOutcomes.entries()) {
            const date = new Date(dateKey).getTime();
            if (date >= startDate && date <= endDate) {
                const userSessions = sessions.filter(s => s.userId === userId);
                historicalData.push(...userSessions);
            }
        }
        
        return historicalData;
    }
    
    async loadHistoricalData() {
        // Load any existing historical data
        console.log('📚 Loading historical social impact data...');
        // Implementation would load from persistent storage
    }
    
    getDashboardStats() {
        return {
            connectedClients: this.dashboardClients.size,
            connectedSystems: this.connectedSystems.size,
            currentSession: this.currentSession ? {
                userId: this.currentSession.userId,
                duration: Date.now() - this.currentSession.startTime,
                activities: this.currentSession.educationalActivities.length,
                contributions: this.currentSession.socialContributions.length
            } : null,
            liveMetrics: this.liveMetrics,
            electricityTracking: this.config.electricityTracking.enabled,
            justificationThreshold: this.config.impactMeasurement.electricityJustificationThreshold
        };
    }
    
    // ==================== CLEANUP ====================
    
    async shutdown() {
        console.log('🛑 Shutting down Social Impact Dashboard...');
        
        // End current session if active
        if (this.currentSession) {
            await this.endTrackingSession(this.currentSession.userId);
        }
        
        // Clear intervals
        this.trackingIntervals.forEach(interval => clearInterval(interval));
        this.reportingIntervals.forEach(interval => clearInterval(interval));
        
        // Close system connections
        this.connectedSystems.forEach(ws => ws.close());
        
        // Close WebSocket server
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        console.log('✅ Social Impact Dashboard shutdown complete');
    }
}

// Auto-start if running directly
if (require.main === module) {
    const dashboard = new SocialImpactDashboard();
    
    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        await dashboard.shutdown();
        process.exit(0);
    });
    
    dashboard.on('ready', () => {
        console.log('🌟 Social Impact Dashboard is ready!');
        
        const stats = dashboard.getDashboardStats();
        console.log(`🌍 Connected systems: ${stats.connectedSystems}`);
        console.log(`⚡ Electricity tracking: ${stats.electricityTracking ? 'enabled' : 'disabled'}`);
        console.log(`📊 Justification threshold: ${stats.justificationThreshold}`);
        console.log(`🎮 Current session: ${stats.currentSession ? 'active' : 'none'}`);
    });
    
    dashboard.on('session-started', (event) => {
        console.log(`🎮 Session started: ${event.userId} - ${event.sessionType}`);
    });
    
    dashboard.on('session-ended', (event) => {
        console.log(`📊 Session ended: ${event.summary.justificationStatus} - Score: ${event.summary.justificationScore.toFixed(2)}`);
    });
    
    dashboard.on('electricity-not-justified', (event) => {
        console.log(`⚠️ Electricity usage not justified: ${event.userId} - Score: ${event.currentScore.toFixed(2)} < ${event.requiredScore}`);
    });
    
    dashboard.on('educational-activity-recorded', (activity) => {
        console.log(`📚 Educational activity: ${activity.category} - ${activity.description}`);
    });
    
    dashboard.on('social-contribution-recorded', (contribution) => {
        console.log(`🤝 Social contribution: ${contribution.category} - ${contribution.description}`);
    });
}

module.exports = SocialImpactDashboard;