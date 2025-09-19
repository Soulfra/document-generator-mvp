/**
 * Financial Literacy Tracker
 * 
 * Correlates OSRS GP management and Grand Exchange activities with real-world financial skills.
 * Transforms gaming economics into verifiable financial education and certification.
 * 
 * Core Features:
 * - GP management pattern analysis
 * - Real-world financial skill correlation
 * - Expense tracking with time-skill exchange
 * - Portfolio diversification via game items
 * - Risk assessment through trading activities
 * - Investment strategy development
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

class FinancialLiteracyTracker extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Financial tracking configuration
            tracking: {
                minTrackingPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
                maxPortfolioItems: 50,
                riskAssessmentInterval: 24 * 60 * 60 * 1000, // Daily risk assessment
                updateInterval: 300000 // 5 minutes
            },
            
            // GP to Real-World correlations
            financialMappings: {
                'budgeting': {
                    gameActivities: [
                        'Daily expense planning',
                        'Resource allocation for skills',
                        'Long-term goal saving',
                        'Emergency fund maintenance'
                    ],
                    realWorldSkills: [
                        'Personal budgeting',
                        'Expense categorization', 
                        'Financial planning',
                        'Emergency fund management'
                    ],
                    assessmentCriteria: [
                        'Consistent daily expense tracking',
                        'Maintaining reserve funds',
                        'Goal-oriented saving behavior',
                        'Efficient resource allocation'
                    ]
                },
                'investment': {
                    gameActivities: [
                        'Grand Exchange item flipping',
                        'Long-term item appreciation',
                        'Portfolio diversification',
                        'Market trend analysis'
                    ],
                    realWorldSkills: [
                        'Investment strategy',
                        'Portfolio management',
                        'Market analysis',
                        'Risk-return assessment'
                    ],
                    assessmentCriteria: [
                        'Diversified trading portfolio',
                        'Positive long-term returns',
                        'Risk-adjusted decision making',
                        'Market timing skills'
                    ]
                },
                'risk-management': {
                    gameActivities: [
                        'PvP risk assessment',
                        'Staking probability analysis',
                        'High-value item protection',
                        'Trading volume management'
                    ],
                    realWorldSkills: [
                        'Risk assessment',
                        'Insurance planning',
                        'Asset protection',
                        'Financial risk mitigation'
                    ],
                    assessmentCriteria: [
                        'Calculated risk taking',
                        'Loss minimization strategies',
                        'Protective measures implementation',
                        'Risk-reward balance'
                    ]
                },
                'market-analysis': {
                    gameActivities: [
                        'Price trend monitoring',
                        'Supply and demand analysis',
                        'Economic event correlation',
                        'Arbitrage opportunity detection'
                    ],
                    realWorldSkills: [
                        'Market research',
                        'Economic analysis',
                        'Data interpretation',
                        'Trend forecasting'
                    ],
                    assessmentCriteria: [
                        'Accurate price predictions',
                        'Economic event correlation',
                        'Data-driven decisions',
                        'Market timing accuracy'
                    ]
                }
            },
            
            // Time-skill exchange system (as mentioned by user)
            timeSkillExchange: {
                enabled: true,
                trackingEnabled: true,
                skillValueCalculation: {
                    beginner: 5, // GP per minute of learning
                    intermediate: 10,
                    advanced: 20,
                    expert: 35
                },
                electricityJustification: {
                    enabled: true,
                    minEducationalValue: 0.7, // Minimum to justify electricity usage
                    socialImpactTracking: true
                }
            },
            
            // Certification system
            certification: {
                levels: [
                    { name: 'Financial Awareness', threshold: 0.3, hours: 10 },
                    { name: 'Basic Financial Literacy', threshold: 0.5, hours: 25 },
                    { name: 'Intermediate Financial Skills', threshold: 0.7, hours: 50 },
                    { name: 'Advanced Financial Management', threshold: 0.85, hours: 100 },
                    { name: 'Financial Expertise', threshold: 0.95, hours: 200 }
                ],
                verificationMethods: [
                    'Portfolio performance tracking',
                    'Risk assessment accuracy',
                    'Budgeting consistency',
                    'Community peer validation'
                ]
            },
            
            // Integration settings
            integration: {
                educationalKnowledgeNetwork: {
                    enabled: true,
                    port: process.env.KNOWLEDGE_NETWORK_WS_PORT || 9908
                },
                runelitePlugin: {
                    enabled: true,
                    dataEndpoint: 'http://localhost:8888/financial-data'
                },
                wsPort: process.env.FINANCIAL_TRACKER_WS_PORT || 9909
            },
            
            // Database configuration
            database: {
                path: path.join(__dirname, 'financial_literacy.db')
            },
            
            ...config
        };
        
        // Financial tracking data
        this.financialProfiles = new Map();
        this.transactionHistory = new Map();
        this.portfolioSnapshots = new Map();
        this.budgetingPlans = new Map();
        this.riskAssessments = new Map();
        this.skillProgressions = new Map();
        this.certificationTracking = new Map();
        
        // Time-skill exchange tracking
        this.timeSkillLog = new Map();
        this.electricityJustification = new Map();
        this.socialImpactMetrics = new Map();
        
        // Real-time data
        this.currentPrices = new Map();
        this.marketTrends = new Map();
        this.economicIndicators = new Map();
        
        // Connections
        this.wsServer = null;
        this.knowledgeNetworkWs = null;
        this.connectedClients = new Set();
        
        console.log('💰 Financial Literacy Tracker initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Initialize database
            await this.initializeDatabase();
            
            // Start WebSocket server
            await this.startWebSocketServer();
            
            // Connect to Knowledge Network
            await this.connectToKnowledgeNetwork();
            
            // Start financial data collection
            this.startFinancialDataCollection();
            
            // Start time-skill tracking
            this.startTimeSkillTracking();
            
            // Start periodic assessments
            this.startPeriodicAssessments();
            
            console.log('✅ Financial Literacy Tracker ready');
            console.log(`💰 WebSocket server: ws://localhost:${this.config.integration.wsPort}`);
            console.log(`⏰ Time-skill exchange: ${this.config.timeSkillExchange.enabled ? 'enabled' : 'disabled'}`);
            console.log(`🌍 Social impact tracking: ${this.config.timeSkillExchange.electricityJustification.enabled ? 'enabled' : 'disabled'}`);
            
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Financial Literacy Tracker:', error.message);
            throw error;
        }
    }
    
    // ==================== DATABASE INITIALIZATION ====================
    
    async initializeDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.config.database.path, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                this.db.serialize(() => {
                    // Financial profiles table
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS financial_profiles (
                            user_id TEXT PRIMARY KEY,
                            total_gp INTEGER DEFAULT 0,
                            portfolio_value INTEGER DEFAULT 0,
                            risk_tolerance REAL DEFAULT 0.5,
                            investment_style TEXT DEFAULT 'conservative',
                            financial_goals TEXT,
                            created_at INTEGER,
                            last_updated INTEGER
                        )
                    `);
                    
                    // Transaction history table
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS transactions (
                            id TEXT PRIMARY KEY,
                            user_id TEXT,
                            transaction_type TEXT,
                            item_id INTEGER,
                            item_name TEXT,
                            quantity INTEGER,
                            price_per_unit INTEGER,
                            total_value INTEGER,
                            profit_loss INTEGER,
                            timestamp INTEGER,
                            real_world_skill TEXT,
                            learning_value REAL
                        )
                    `);
                    
                    // Portfolio snapshots table
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS portfolio_snapshots (
                            id TEXT PRIMARY KEY,
                            user_id TEXT,
                            snapshot_date INTEGER,
                            total_value INTEGER,
                            liquid_gp INTEGER,
                            invested_value INTEGER,
                            portfolio_items TEXT,
                            diversification_score REAL,
                            risk_score REAL,
                            performance_change REAL
                        )
                    `);
                    
                    // Budgeting plans table
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS budgeting_plans (
                            id TEXT PRIMARY KEY,
                            user_id TEXT,
                            plan_name TEXT,
                            total_budget INTEGER,
                            categories TEXT,
                            actual_spending TEXT,
                            variance_analysis TEXT,
                            created_at INTEGER,
                            period_start INTEGER,
                            period_end INTEGER
                        )
                    `);
                    
                    // Risk assessments table
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS risk_assessments (
                            id TEXT PRIMARY KEY,
                            user_id TEXT,
                            assessment_date INTEGER,
                            risk_score REAL,
                            risk_factors TEXT,
                            mitigation_strategies TEXT,
                            portfolio_volatility REAL,
                            maximum_loss_potential REAL,
                            confidence_level REAL
                        )
                    `);
                    
                    // Skill progressions table
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS skill_progressions (
                            id TEXT PRIMARY KEY,
                            user_id TEXT,
                            skill_category TEXT,
                            current_level REAL,
                            experience_points INTEGER,
                            time_invested INTEGER,
                            practical_applications TEXT,
                            assessment_scores TEXT,
                            certification_progress REAL,
                            last_updated INTEGER
                        )
                    `);
                    
                    // Time-skill exchange table
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS time_skill_exchange (
                            id TEXT PRIMARY KEY,
                            user_id TEXT,
                            activity_type TEXT,
                            time_spent INTEGER,
                            skill_developed TEXT,
                            educational_value REAL,
                            gp_equivalent INTEGER,
                            electricity_justified BOOLEAN,
                            social_impact_score REAL,
                            timestamp INTEGER
                        )
                    `);
                    
                    // Certifications table
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS certifications (
                            id TEXT PRIMARY KEY,
                            user_id TEXT,
                            certification_name TEXT,
                            level TEXT,
                            achieved_date INTEGER,
                            verification_method TEXT,
                            skills_demonstrated TEXT,
                            portfolio_evidence TEXT,
                            peer_validations INTEGER,
                            expert_validated BOOLEAN
                        )
                    `);
                    
                    console.log('💾 Financial database tables initialized');
                    resolve();
                });
            });
        });
    }
    
    // ==================== WEBSOCKET SERVER ====================
    
    async startWebSocketServer() {
        return new Promise((resolve) => {
            this.wsServer = new WebSocket.Server({ port: this.config.integration.wsPort });
            
            this.wsServer.on('connection', (ws, req) => {
                const clientId = crypto.randomBytes(8).toString('hex');
                console.log(`💰 Financial tracker client connected: ${clientId}`);
                
                const client = { id: clientId, ws, joinedAt: new Date() };
                this.connectedClients.add(client);
                
                // Send welcome message
                ws.send(JSON.stringify({
                    type: 'welcome',
                    data: {
                        trackingCategories: Object.keys(this.config.financialMappings),
                        certificationLevels: this.config.certification.levels,
                        timeSkillExchangeEnabled: this.config.timeSkillExchange.enabled
                    }
                }));
                
                ws.on('message', async (message) => {
                    try {
                        const data = JSON.parse(message);
                        await this.handleWebSocketMessage(ws, data, clientId);
                    } catch (error) {
                        console.error('❌ WebSocket message error:', error.message);
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: error.message
                        }));
                    }
                });
                
                ws.on('close', () => {
                    console.log(`💰 Financial tracker client disconnected: ${clientId}`);
                    this.connectedClients = new Set([...this.connectedClients].filter(c => c.id !== clientId));
                });
            });
            
            console.log(`💰 Financial Literacy Tracker WebSocket server listening on port ${this.config.integration.wsPort}`);
            resolve();
        });
    }
    
    async handleWebSocketMessage(ws, data, clientId) {
        switch (data.type) {
            case 'track-transaction':
                await this.recordTransaction(data.userId, data.transaction);
                ws.send(JSON.stringify({
                    type: 'transaction-recorded',
                    transactionId: data.transaction.id
                }));
                break;
                
            case 'get-financial-profile':
                const profile = await this.getFinancialProfile(data.userId);
                ws.send(JSON.stringify({
                    type: 'financial-profile',
                    profile
                }));
                break;
                
            case 'create-budget':
                const budgetId = await this.createBudgetPlan(data.userId, data.budget);
                ws.send(JSON.stringify({
                    type: 'budget-created',
                    budgetId
                }));
                break;
                
            case 'assess-risk':
                const riskAssessment = await this.performRiskAssessment(data.userId);
                ws.send(JSON.stringify({
                    type: 'risk-assessment',
                    assessment: riskAssessment
                }));
                break;
                
            case 'track-time-skill':
                await this.recordTimeSkillActivity(data.userId, data.activity);
                ws.send(JSON.stringify({
                    type: 'time-skill-recorded',
                    activityId: data.activity.id
                }));
                break;
                
            case 'get-certification-progress':
                const progress = await this.getCertificationProgress(data.userId);
                ws.send(JSON.stringify({
                    type: 'certification-progress',
                    progress
                }));
                break;
                
            case 'request-certification':
                const certification = await this.requestCertification(data.userId, data.level);
                ws.send(JSON.stringify({
                    type: 'certification-requested',
                    certification
                }));
                break;
                
            default:
                console.warn('❓ Unknown message type:', data.type);
        }
    }
    
    // ==================== TRANSACTION TRACKING ====================
    
    async recordTransaction(userId, transaction) {
        const transactionId = transaction.id || crypto.randomBytes(8).toString('hex');
        
        // Calculate learning value and real-world skill mapping
        const learningValue = this.calculateLearningValue(transaction);
        const realWorldSkill = this.mapToRealWorldSkill(transaction);
        
        // Store in database
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO transactions 
                (id, user_id, transaction_type, item_id, item_name, quantity, price_per_unit, 
                 total_value, profit_loss, timestamp, real_world_skill, learning_value)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                transactionId,
                userId,
                transaction.type,
                transaction.itemId || null,
                transaction.itemName || 'GP',
                transaction.quantity || 1,
                transaction.pricePerUnit || transaction.amount,
                transaction.totalValue || transaction.amount,
                transaction.profitLoss || 0,
                transaction.timestamp || Date.now(),
                realWorldSkill,
                learningValue
            ], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Update financial profile
                this.updateFinancialProfile(userId, transaction);
                
                // Log time-skill activity if educational
                if (learningValue > 0.5) {
                    this.recordTimeSkillActivity(userId, {
                        type: 'financial-transaction',
                        timeSpent: 5, // Assume 5 minutes per transaction
                        skillDeveloped: realWorldSkill,
                        educationalValue: learningValue
                    });
                }
                
                console.log(`💸 Transaction recorded: ${userId} - ${transaction.type} - ${realWorldSkill}`);
                
                this.emit('transaction-recorded', {
                    userId,
                    transactionId,
                    transaction,
                    learningValue,
                    realWorldSkill
                });
                
                resolve(transactionId);
            });
        });
    }
    
    calculateLearningValue(transaction) {
        let value = 0.3; // Base learning value
        
        // Transaction type learning value
        const typeValues = {
            'buy': 0.5,
            'sell': 0.6,
            'flip': 0.8,
            'invest': 0.9,
            'budget': 0.7,
            'save': 0.4
        };
        
        value = typeValues[transaction.type] || 0.3;
        
        // Complexity bonuses
        if (transaction.researchConducted) value += 0.2;
        if (transaction.riskAssessed) value += 0.1;
        if (transaction.longTermStrategy) value += 0.15;
        if (transaction.diversificationMove) value += 0.1;
        
        return Math.min(1.0, value);
    }
    
    mapToRealWorldSkill(transaction) {
        const skillMappings = {
            'buy': 'Purchase decision making',
            'sell': 'Asset liquidation strategy',
            'flip': 'Short-term investment',
            'invest': 'Long-term investment planning',
            'budget': 'Budget allocation',
            'save': 'Savings discipline',
            'risk_assessment': 'Risk management',
            'market_analysis': 'Market research'
        };
        
        return skillMappings[transaction.type] || 'Financial awareness';
    }
    
    async updateFinancialProfile(userId, transaction) {
        return new Promise((resolve) => {
            // Get current profile
            this.db.get(`
                SELECT * FROM financial_profiles WHERE user_id = ?
            `, [userId], (err, profile) => {
                
                if (!profile) {
                    // Create new profile
                    this.db.run(`
                        INSERT INTO financial_profiles 
                        (user_id, total_gp, portfolio_value, created_at, last_updated)
                        VALUES (?, ?, ?, ?, ?)
                    `, [userId, transaction.totalValue || 0, 0, Date.now(), Date.now()]);
                } else {
                    // Update existing profile
                    const newTotalGp = profile.total_gp + (transaction.totalValue || 0);
                    
                    this.db.run(`
                        UPDATE financial_profiles 
                        SET total_gp = ?, last_updated = ?
                        WHERE user_id = ?
                    `, [newTotalGp, Date.now(), userId]);
                }
                
                resolve();
            });
        });
    }
    
    // ==================== BUDGETING SYSTEM ====================
    
    async createBudgetPlan(userId, budgetData) {
        const budgetId = crypto.randomBytes(8).toString('hex');
        
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO budgeting_plans 
                (id, user_id, plan_name, total_budget, categories, actual_spending, 
                 variance_analysis, created_at, period_start, period_end)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                budgetId,
                userId,
                budgetData.name,
                budgetData.totalBudget,
                JSON.stringify(budgetData.categories),
                JSON.stringify({}), // Will be updated as spending occurs
                JSON.stringify({}),
                Date.now(),
                budgetData.periodStart,
                budgetData.periodEnd
            ], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log(`📊 Budget plan created: ${budgetData.name} for ${userId}`);
                
                // Track as educational activity
                this.recordTimeSkillActivity(userId, {
                    type: 'budget-planning',
                    timeSpent: 15, // 15 minutes for budget creation
                    skillDeveloped: 'Budget planning',
                    educationalValue: 0.8
                });
                
                resolve(budgetId);
            });
        });
    }
    
    async trackBudgetExpense(userId, expense) {
        // Find active budget plans
        return new Promise((resolve) => {
            this.db.all(`
                SELECT * FROM budgeting_plans 
                WHERE user_id = ? AND period_end > ? AND period_start <= ?
            `, [userId, Date.now(), Date.now()], (err, budgets) => {
                
                if (err || !budgets.length) {
                    resolve();
                    return;
                }
                
                // Update each active budget
                budgets.forEach(budget => {
                    const actualSpending = JSON.parse(budget.actual_spending);
                    const category = expense.category || 'miscellaneous';
                    
                    actualSpending[category] = (actualSpending[category] || 0) + expense.amount;
                    
                    // Calculate variance
                    const budgetCategories = JSON.parse(budget.categories);
                    const budgetAmount = budgetCategories[category] || 0;
                    const variance = budgetAmount - actualSpending[category];
                    
                    const varianceAnalysis = JSON.parse(budget.variance_analysis);
                    varianceAnalysis[category] = {
                        budgeted: budgetAmount,
                        actual: actualSpending[category],
                        variance: variance,
                        percentageUsed: (actualSpending[category] / budgetAmount) * 100
                    };
                    
                    // Update database
                    this.db.run(`
                        UPDATE budgeting_plans 
                        SET actual_spending = ?, variance_analysis = ?
                        WHERE id = ?
                    `, [
                        JSON.stringify(actualSpending),
                        JSON.stringify(varianceAnalysis),
                        budget.id
                    ]);
                });
                
                resolve();
            });
        });
    }
    
    // ==================== RISK ASSESSMENT ====================
    
    async performRiskAssessment(userId) {
        return new Promise((resolve, reject) => {
            // Get recent transaction history
            this.db.all(`
                SELECT * FROM transactions 
                WHERE user_id = ? AND timestamp > ?
                ORDER BY timestamp DESC
                LIMIT 50
            `, [userId, Date.now() - (30 * 24 * 60 * 60 * 1000)], (err, transactions) => {
                
                if (err) {
                    reject(err);
                    return;
                }
                
                const assessment = this.calculateRiskProfile(transactions);
                const assessmentId = crypto.randomBytes(8).toString('hex');
                
                // Store assessment
                this.db.run(`
                    INSERT INTO risk_assessments 
                    (id, user_id, assessment_date, risk_score, risk_factors, 
                     mitigation_strategies, portfolio_volatility, maximum_loss_potential, confidence_level)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    assessmentId,
                    userId,
                    Date.now(),
                    assessment.riskScore,
                    JSON.stringify(assessment.riskFactors),
                    JSON.stringify(assessment.mitigationStrategies),
                    assessment.portfolioVolatility,
                    assessment.maximumLossPotential,
                    assessment.confidenceLevel
                ], (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    console.log(`📊 Risk assessment completed: ${userId} - Risk Score: ${assessment.riskScore.toFixed(2)}`);
                    
                    // Track as educational activity
                    this.recordTimeSkillActivity(userId, {
                        type: 'risk-assessment',
                        timeSpent: 10,
                        skillDeveloped: 'Risk management',
                        educationalValue: 0.9
                    });
                    
                    resolve(assessment);
                });
            });
        });
    }
    
    calculateRiskProfile(transactions) {
        if (transactions.length === 0) {
            return {
                riskScore: 0.5,
                riskFactors: ['Insufficient data'],
                mitigationStrategies: ['Begin tracking financial activities'],
                portfolioVolatility: 0,
                maximumLossPotential: 0,
                confidenceLevel: 0.1
            };
        }
        
        // Calculate volatility
        const profitLosses = transactions.map(t => t.profit_loss || 0);
        const avgProfitLoss = profitLosses.reduce((sum, pl) => sum + pl, 0) / profitLosses.length;
        const variance = profitLosses.reduce((sum, pl) => sum + Math.pow(pl - avgProfitLoss, 2), 0) / profitLosses.length;
        const volatility = Math.sqrt(variance);
        
        // Calculate risk factors
        const riskFactors = [];
        const totalValue = transactions.reduce((sum, t) => sum + (t.total_value || 0), 0);
        const maxSingleTransaction = Math.max(...transactions.map(t => t.total_value || 0));
        
        if (maxSingleTransaction > totalValue * 0.2) {
            riskFactors.push('High concentration in single transactions');
        }
        
        if (volatility > totalValue * 0.1) {
            riskFactors.push('High portfolio volatility');
        }
        
        const lossTransactions = transactions.filter(t => (t.profit_loss || 0) < 0);
        if (lossTransactions.length > transactions.length * 0.4) {
            riskFactors.push('High frequency of losses');
        }
        
        // Calculate risk score (0-1, where 1 is highest risk)
        let riskScore = 0.3; // Base risk
        
        if (volatility > totalValue * 0.1) riskScore += 0.2;
        if (maxSingleTransaction > totalValue * 0.3) riskScore += 0.2;
        if (lossTransactions.length > transactions.length * 0.5) riskScore += 0.3;
        
        riskScore = Math.min(1.0, riskScore);
        
        // Generate mitigation strategies
        const mitigationStrategies = [];
        
        if (riskFactors.includes('High concentration in single transactions')) {
            mitigationStrategies.push('Diversify investments across multiple items');
        }
        
        if (riskFactors.includes('High portfolio volatility')) {
            mitigationStrategies.push('Focus on stable, less volatile investments');
        }
        
        if (riskFactors.includes('High frequency of losses')) {
            mitigationStrategies.push('Improve market analysis and timing');
        }
        
        if (mitigationStrategies.length === 0) {
            mitigationStrategies.push('Continue current risk management practices');
        }
        
        return {
            riskScore,
            riskFactors,
            mitigationStrategies,
            portfolioVolatility: volatility,
            maximumLossPotential: Math.max(...profitLosses.map(pl => Math.abs(pl))),
            confidenceLevel: Math.min(0.9, transactions.length / 20) // More transactions = higher confidence
        };
    }
    
    // ==================== TIME-SKILL EXCHANGE SYSTEM ====================
    
    async recordTimeSkillActivity(userId, activity) {
        const activityId = activity.id || crypto.randomBytes(8).toString('hex');
        
        // Calculate GP equivalent based on skill level
        const skillLevel = await this.getSkillLevel(userId, activity.skillDeveloped);
        const gpEquivalent = this.calculateGPEquivalent(activity.timeSpent, skillLevel, activity.educationalValue);
        
        // Determine if electricity usage is justified
        const electricityJustified = activity.educationalValue >= this.config.timeSkillExchange.electricityJustification.minEducationalValue;
        
        // Calculate social impact score
        const socialImpactScore = this.calculateSocialImpactScore(activity);
        
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO time_skill_exchange 
                (id, user_id, activity_type, time_spent, skill_developed, educational_value,
                 gp_equivalent, electricity_justified, social_impact_score, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                activityId,
                userId,
                activity.type,
                activity.timeSpent,
                activity.skillDeveloped,
                activity.educationalValue,
                gpEquivalent,
                electricityJustified ? 1 : 0,
                socialImpactScore,
                Date.now()
            ], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Update skill progression
                this.updateSkillProgression(userId, activity.skillDeveloped, activity.timeSpent, activity.educationalValue);
                
                console.log(`⏰ Time-skill activity recorded: ${userId} - ${activity.skillDeveloped} - ${activity.timeSpent}min = ${gpEquivalent}GP`);
                
                this.emit('time-skill-recorded', {
                    userId,
                    activityId,
                    activity,
                    gpEquivalent,
                    electricityJustified,
                    socialImpactScore
                });
                
                resolve(activityId);
            });
        });
    }
    
    async getSkillLevel(userId, skillName) {
        return new Promise((resolve) => {
            this.db.get(`
                SELECT current_level FROM skill_progressions 
                WHERE user_id = ? AND skill_category = ?
            `, [userId, skillName], (err, row) => {
                resolve(row ? row.current_level : 0.3); // Default to beginner level
            });
        });
    }
    
    calculateGPEquivalent(timeSpent, skillLevel, educationalValue) {
        // Base GP per minute based on skill level
        let baseRate = this.config.timeSkillExchange.skillValueCalculation.beginner;
        
        if (skillLevel >= 0.8) baseRate = this.config.timeSkillExchange.skillValueCalculation.expert;
        else if (skillLevel >= 0.6) baseRate = this.config.timeSkillExchange.skillValueCalculation.advanced;
        else if (skillLevel >= 0.4) baseRate = this.config.timeSkillExchange.skillValueCalculation.intermediate;
        
        // Apply educational value multiplier
        const educationalMultiplier = 0.5 + (educationalValue * 1.5);
        
        return Math.floor(timeSpent * baseRate * educationalMultiplier);
    }
    
    calculateSocialImpactScore(activity) {
        let score = activity.educationalValue * 0.5; // Base score from educational value
        
        // Activity type bonuses
        const impactBonuses = {
            'budget-planning': 0.3,
            'risk-assessment': 0.4,
            'financial-transaction': 0.2,
            'investment-research': 0.5,
            'teaching-others': 0.8,
            'community-contribution': 0.7
        };
        
        score += impactBonuses[activity.type] || 0.1;
        
        return Math.min(1.0, score);
    }
    
    async updateSkillProgression(userId, skillName, timeSpent, educationalValue) {
        return new Promise((resolve) => {
            this.db.get(`
                SELECT * FROM skill_progressions 
                WHERE user_id = ? AND skill_category = ?
            `, [userId, skillName], (err, progression) => {
                
                const experienceGained = Math.floor(timeSpent * educationalValue * 10);
                const currentTime = Date.now();
                
                if (!progression) {
                    // Create new progression
                    this.db.run(`
                        INSERT INTO skill_progressions 
                        (id, user_id, skill_category, current_level, experience_points, 
                         time_invested, practical_applications, assessment_scores, 
                         certification_progress, last_updated)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        crypto.randomBytes(8).toString('hex'),
                        userId,
                        skillName,
                        0.3 + (experienceGained / 1000), // Initial level
                        experienceGained,
                        timeSpent,
                        JSON.stringify([]),
                        JSON.stringify([]),
                        0.0,
                        currentTime
                    ]);
                } else {
                    // Update existing progression
                    const newExperience = progression.experience_points + experienceGained;
                    const newLevel = Math.min(1.0, 0.3 + (newExperience / 1000));
                    const newTimeInvested = progression.time_invested + timeSpent;
                    
                    this.db.run(`
                        UPDATE skill_progressions 
                        SET current_level = ?, experience_points = ?, time_invested = ?, last_updated = ?
                        WHERE user_id = ? AND skill_category = ?
                    `, [newLevel, newExperience, newTimeInvested, currentTime, userId, skillName]);
                }
                
                resolve();
            });
        });
    }
    
    // ==================== CERTIFICATION SYSTEM ====================
    
    async getCertificationProgress(userId) {
        return new Promise((resolve) => {
            this.db.all(`
                SELECT * FROM skill_progressions WHERE user_id = ?
            `, [userId], (err, progressions) => {
                
                if (err || !progressions.length) {
                    resolve({ overallProgress: 0, skillBreakdown: {}, availableCertifications: [] });
                    return;
                }
                
                const skillBreakdown = {};
                let totalLevel = 0;
                let totalTime = 0;
                
                progressions.forEach(progression => {
                    skillBreakdown[progression.skill_category] = {
                        level: progression.current_level,
                        experience: progression.experience_points,
                        timeInvested: progression.time_invested,
                        certificationProgress: progression.certification_progress
                    };
                    
                    totalLevel += progression.current_level;
                    totalTime += progression.time_invested;
                });
                
                const overallLevel = totalLevel / progressions.length;
                
                // Check available certifications
                const availableCertifications = this.config.certification.levels.filter(level => 
                    overallLevel >= level.threshold && totalTime >= level.hours * 60 // Convert hours to minutes
                );
                
                resolve({
                    overallProgress: overallLevel,
                    skillBreakdown,
                    availableCertifications,
                    totalTimeInvested: totalTime
                });
            });
        });
    }
    
    async requestCertification(userId, levelName) {
        const progress = await this.getCertificationProgress(userId);
        const requestedLevel = this.config.certification.levels.find(l => l.name === levelName);
        
        if (!requestedLevel) {
            throw new Error('Certification level not found');
        }
        
        if (!progress.availableCertifications.find(c => c.name === levelName)) {
            throw new Error('Certification requirements not met');
        }
        
        const certificationId = crypto.randomBytes(8).toString('hex');
        
        return new Promise((resolve, reject) => {
            // Get portfolio evidence
            this.getPortfolioEvidence(userId).then(evidence => {
                this.db.run(`
                    INSERT INTO certifications 
                    (id, user_id, certification_name, level, achieved_date, verification_method,
                     skills_demonstrated, portfolio_evidence, peer_validations, expert_validated)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    certificationId,
                    userId,
                    requestedLevel.name,
                    levelName,
                    Date.now(),
                    'automated-assessment',
                    JSON.stringify(Object.keys(progress.skillBreakdown)),
                    JSON.stringify(evidence),
                    0,
                    false
                ], (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    console.log(`🏆 Certification requested: ${userId} - ${levelName}`);
                    
                    resolve({
                        certificationId,
                        name: requestedLevel.name,
                        level: levelName,
                        achievedDate: new Date(),
                        status: 'pending-validation'
                    });
                });
            });
        });
    }
    
    async getPortfolioEvidence(userId) {
        return new Promise((resolve) => {
            // Get recent transactions and risk assessments as evidence
            this.db.all(`
                SELECT 'transaction' as type, transaction_type, total_value, profit_loss, timestamp
                FROM transactions 
                WHERE user_id = ? 
                ORDER BY timestamp DESC 
                LIMIT 10
            `, [userId], (err, transactions) => {
                
                this.db.all(`
                    SELECT 'risk_assessment' as type, risk_score, portfolio_volatility, assessment_date as timestamp
                    FROM risk_assessments 
                    WHERE user_id = ? 
                    ORDER BY assessment_date DESC 
                    LIMIT 5
                `, [userId], (err, assessments) => {
                    
                    const evidence = {
                        transactions: transactions || [],
                        riskAssessments: assessments || [],
                        compiledAt: Date.now()
                    };
                    
                    resolve(evidence);
                });
            });
        });
    }
    
    // ==================== KNOWLEDGE NETWORK INTEGRATION ====================
    
    async connectToKnowledgeNetwork() {
        if (!this.config.integration.educationalKnowledgeNetwork.enabled) return;
        
        try {
            this.knowledgeNetworkWs = new WebSocket(`ws://localhost:${this.config.integration.educationalKnowledgeNetwork.port}`);
            
            this.knowledgeNetworkWs.on('open', () => {
                console.log('✅ Connected to Educational Knowledge Network');
                
                // Register as financial literacy provider
                this.knowledgeNetworkWs.send(JSON.stringify({
                    type: 'register-provider',
                    provider: 'financial-literacy-tracker',
                    capabilities: [
                        'financial-education',
                        'skill-assessment',
                        'certification',
                        'time-skill-exchange'
                    ]
                }));
            });
            
            this.knowledgeNetworkWs.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleKnowledgeNetworkMessage(data);
                } catch (error) {
                    console.error('❌ Knowledge network message error:', error.message);
                }
            });
            
        } catch (error) {
            console.warn('⚠️ Could not connect to Educational Knowledge Network:', error.message);
        }
    }
    
    handleKnowledgeNetworkMessage(message) {
        switch (message.type) {
            case 'skill-mapping-request':
                this.shareFinancialSkillMappings(message.requestId);
                break;
                
            case 'assessment-request':
                this.performKnowledgeAssessment(message.userId, message.category);
                break;
                
            case 'learning-pathway-request':
                this.generateFinancialLearningPathway(message.userId, message.skillLevel);
                break;
        }
    }
    
    shareFinancialSkillMappings(requestId) {
        if (this.knowledgeNetworkWs) {
            this.knowledgeNetworkWs.send(JSON.stringify({
                type: 'skill-mapping-response',
                requestId,
                mappings: this.config.financialMappings
            }));
        }
    }
    
    // ==================== DATA COLLECTION ====================
    
    startFinancialDataCollection() {
        console.log('📊 Starting financial data collection...');
        
        // Periodic portfolio snapshots
        setInterval(() => {
            this.capturePortfolioSnapshots();
        }, this.config.tracking.updateInterval);
        
        // Daily risk assessments for active users
        setInterval(() => {
            this.performBatchRiskAssessments();
        }, this.config.tracking.riskAssessmentInterval);
    }
    
    async capturePortfolioSnapshots() {
        // Get all financial profiles
        this.db.all(`SELECT user_id FROM financial_profiles`, [], (err, profiles) => {
            if (err || !profiles.length) return;
            
            profiles.forEach(profile => {
                this.captureUserPortfolioSnapshot(profile.user_id);
            });
        });
    }
    
    async captureUserPortfolioSnapshot(userId) {
        // This would integrate with RuneLite plugin to get current portfolio
        // For now, simulate data
        const snapshotId = crypto.randomBytes(8).toString('hex');
        
        this.db.run(`
            INSERT INTO portfolio_snapshots 
            (id, user_id, snapshot_date, total_value, liquid_gp, invested_value,
             portfolio_items, diversification_score, risk_score, performance_change)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            snapshotId,
            userId,
            Date.now(),
            100000, // Would be calculated from actual data
            50000,
            50000,
            JSON.stringify({}), // Would contain actual item data
            0.7, // Calculated diversification
            0.4, // Calculated risk
            0.05 // 5% change
        ]);
    }
    
    startTimeSkillTracking() {
        if (!this.config.timeSkillExchange.enabled) return;
        
        console.log('⏰ Starting time-skill exchange tracking...');
        
        // Monitor for educational activities
        setInterval(() => {
            this.analyzeEducationalActivities();
        }, 60000); // Every minute
    }
    
    analyzeEducationalActivities() {
        // Analyze recent activities for educational value
        // This would integrate with actual gameplay monitoring
    }
    
    startPeriodicAssessments() {
        console.log('📈 Starting periodic assessments...');
        
        // Daily certification progress checks
        setInterval(() => {
            this.checkCertificationProgress();
        }, 24 * 60 * 60 * 1000); // Daily
    }
    
    async checkCertificationProgress() {
        // Check all users for certification eligibility
        this.db.all(`SELECT DISTINCT user_id FROM skill_progressions`, [], (err, users) => {
            if (err || !users.length) return;
            
            users.forEach(user => {
                this.getCertificationProgress(user.user_id).then(progress => {
                    if (progress.availableCertifications.length > 0) {
                        this.emit('certification-available', {
                            userId: user.user_id,
                            availableCertifications: progress.availableCertifications
                        });
                    }
                });
            });
        });
    }
    
    // ==================== FINANCIAL PROFILE ====================
    
    async getFinancialProfile(userId) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM financial_profiles WHERE user_id = ?
            `, [userId], (err, profile) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (!profile) {
                    resolve(null);
                    return;
                }
                
                // Get additional data
                this.getRecentTransactions(userId, 10).then(transactions => {
                    this.getCertificationProgress(userId).then(certifications => {
                        resolve({
                            ...profile,
                            recentTransactions: transactions,
                            certificationProgress: certifications,
                            lastUpdated: new Date(profile.last_updated)
                        });
                    });
                });
            });
        });
    }
    
    async getRecentTransactions(userId, limit = 10) {
        return new Promise((resolve) => {
            this.db.all(`
                SELECT * FROM transactions 
                WHERE user_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            `, [userId, limit], (err, transactions) => {
                resolve(transactions || []);
            });
        });
    }
    
    // ==================== UTILITY METHODS ====================
    
    getTrackerStats() {
        return new Promise((resolve) => {
            const stats = {};
            
            this.db.get(`SELECT COUNT(*) as count FROM financial_profiles`, [], (err, profiles) => {
                stats.totalProfiles = profiles ? profiles.count : 0;
                
                this.db.get(`SELECT COUNT(*) as count FROM transactions`, [], (err, transactions) => {
                    stats.totalTransactions = transactions ? transactions.count : 0;
                    
                    this.db.get(`SELECT COUNT(*) as count FROM certifications`, [], (err, certs) => {
                        stats.totalCertifications = certs ? certs.count : 0;
                        
                        this.db.get(`
                            SELECT 
                                SUM(time_spent) as totalTime,
                                SUM(gp_equivalent) as totalGPValue,
                                AVG(educational_value) as avgEducationalValue
                            FROM time_skill_exchange
                        `, [], (err, timeSkill) => {
                            stats.timeSkillExchange = {
                                totalTimeSpent: timeSkill ? timeSkill.totalTime : 0,
                                totalGPValue: timeSkill ? timeSkill.totalGPValue : 0,
                                avgEducationalValue: timeSkill ? timeSkill.avgEducationalValue : 0
                            };
                            
                            stats.connectedClients = this.connectedClients.size;
                            stats.electricityJustificationEnabled = this.config.timeSkillExchange.electricityJustification.enabled;
                            
                            resolve(stats);
                        });
                    });
                });
            });
        });
    }
    
    // ==================== CLEANUP ====================
    
    async shutdown() {
        console.log('🛑 Shutting down Financial Literacy Tracker...');
        
        // Close database
        if (this.db) {
            this.db.close();
        }
        
        // Close connections
        if (this.knowledgeNetworkWs) {
            this.knowledgeNetworkWs.close();
        }
        
        // Close WebSocket server
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        console.log('✅ Financial Literacy Tracker shutdown complete');
    }
}

// Auto-start if running directly
if (require.main === module) {
    const tracker = new FinancialLiteracyTracker();
    
    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        await tracker.shutdown();
        process.exit(0);
    });
    
    tracker.on('ready', () => {
        console.log('🌟 Financial Literacy Tracker is ready!');
        
        tracker.getTrackerStats().then(stats => {
            console.log(`👥 Tracked profiles: ${stats.totalProfiles}`);
            console.log(`💸 Total transactions: ${stats.totalTransactions}`);
            console.log(`🏆 Certifications issued: ${stats.totalCertifications}`);
            console.log(`⏰ Time-skill exchange value: ${stats.timeSkillExchange.totalGPValue} GP`);
        });
    });
    
    tracker.on('transaction-recorded', (event) => {
        console.log(`💰 Transaction: ${event.userId} - ${event.transaction.type} - ${event.realWorldSkill}`);
    });
    
    tracker.on('certification-available', (event) => {
        console.log(`🏆 Certification available for ${event.userId}: ${event.availableCertifications.map(c => c.name).join(', ')}`);
    });
    
    tracker.on('time-skill-recorded', (event) => {
        console.log(`⏰ Time-skill: ${event.userId} - ${event.activity.skillDeveloped} - ${event.gpEquivalent}GP - Justified: ${event.electricityJustified}`);
    });
}

module.exports = FinancialLiteracyTracker;