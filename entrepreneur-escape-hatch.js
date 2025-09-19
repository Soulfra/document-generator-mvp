#!/usr/bin/env node

/**
 * Entrepreneur Escape Hatch System
 * Provides safety nets and support mechanisms for entrepreneurs under stress
 * Includes burnout prevention, pivot assistance, and emergency support
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class EntrepreneurEscapeHatch extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            burnoutThreshold: options.burnoutThreshold || 30,
            stressCheckInterval: options.stressCheckInterval || 3600000, // 1 hour
            emergencyResponseTime: options.emergencyResponseTime || 300000, // 5 minutes
            supportNetworkSize: options.supportNetworkSize || 5,
            ...options
        };
        
        // Core tracking systems
        this.entrepreneurs = new Map();
        this.stressIndicators = new Map();
        this.supportNetwork = new Map();
        this.escapeActivations = new Map();
        this.interventions = new Map();
        
        // Escape hatch types
        this.escapeTypes = {
            burnout_prevention: {
                triggers: ['stress_spike', 'isolation', 'overwork'],
                response: 'immediate_support',
                duration: 86400000 // 24 hours
            },
            business_pivot: {
                triggers: ['market_failure', 'model_breakdown', 'competitive_threat'],
                response: 'strategy_session',
                duration: 604800000 // 7 days
            },
            mental_health: {
                triggers: ['depression_signs', 'anxiety_spike', 'fortitude_drop'],
                response: 'professional_help',
                duration: 2592000000 // 30 days
            },
            financial_crisis: {
                triggers: ['cash_flow_negative', 'funding_failure', 'revenue_drop'],
                response: 'emergency_planning',
                duration: 1209600000 // 14 days
            },
            team_breakdown: {
                triggers: ['co_founder_exit', 'key_employee_loss', 'culture_crisis'],
                response: 'team_mediation',
                duration: 432000000 // 5 days
            }
        };
        
        // Support mechanisms
        this.supportMechanisms = {
            mentor_connection: this.connectMentor.bind(this),
            peer_support: this.organizePeerSupport.bind(this),
            professional_help: this.arrangeProfessionalHelp.bind(this),
            emergency_planning: this.createEmergencyPlan.bind(this),
            strategy_session: this.scheduleStrategySession.bind(this),
            team_mediation: this.facilitateTeamMediation.bind(this),
            financial_review: this.conductFinancialReview.bind(this),
            pivot_assistance: this.providePivotAssistance.bind(this)
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚪 Initializing Entrepreneur Escape Hatch System...');
        
        // Start stress monitoring
        this.startStressMonitoring();
        
        // Set up intervention protocols
        this.setupInterventionProtocols();
        
        // Initialize support network
        this.initializeSupportNetwork();
        
        this.emit('initialized');
    }
    
    // ===== ENTREPRENEUR REGISTRATION =====
    
    async registerEntrepreneur(entrepreneurData) {
        const entrepreneurId = this.generateId('entrepreneur');
        
        const entrepreneur = {
            id: entrepreneurId,
            ...entrepreneurData,
            registeredAt: new Date(),
            baselineStress: this.assessInitialStress(entrepreneurData),
            riskFactors: this.identifyRiskFactors(entrepreneurData),
            supportPreferences: entrepreneurData.supportPreferences || {},
            escapeHistory: [],
            currentStressLevel: 0.5,
            lastCheckIn: new Date()
        };
        
        this.entrepreneurs.set(entrepreneurId, entrepreneur);
        
        // Initialize stress tracking
        this.stressIndicators.set(entrepreneurId, {
            patterns: [],
            triggers: new Set(),
            warningSignsActive: false,
            lastAssessment: new Date()
        });
        
        // Assign to support network
        await this.assignToSupportNetwork(entrepreneurId);
        
        this.emit('entrepreneur-registered', entrepreneur);
        return entrepreneur;
    }
    
    assessInitialStress(data) {
        let stressScore = 0.5; // Start at neutral
        
        // Business stage impacts stress
        if (data.businessStage === 'pre-launch') stressScore += 0.1;
        if (data.businessStage === 'early-stage') stressScore += 0.2;
        if (data.businessStage === 'scaling') stressScore += 0.15;
        
        // Previous failures increase baseline stress
        stressScore += (data.previousFailures || 0) * 0.05;
        
        // Support system reduces stress
        stressScore -= (data.supportSystemSize || 0) * 0.02;
        
        // Financial pressure
        if (data.financialRunway < 6) stressScore += 0.1;
        if (data.hasDebt) stressScore += 0.05;
        
        return Math.max(0, Math.min(1, stressScore));
    }
    
    identifyRiskFactors(data) {
        const riskFactors = [];
        
        if (data.isFirstTimeFounder) riskFactors.push('inexperience');
        if (data.workingAlone) riskFactors.push('isolation');
        if (data.financialRunway < 12) riskFactors.push('financial_pressure');
        if (data.hasFamily && !data.familySupport) riskFactors.push('family_stress');
        if (data.previousBurnout) riskFactors.push('burnout_history');
        if (data.competitiveMarket) riskFactors.push('market_pressure');
        
        return riskFactors;
    }
    
    // ===== STRESS MONITORING =====
    
    startStressMonitoring() {
        setInterval(() => {
            this.assessAllEntrepreneurs();
        }, this.options.stressCheckInterval);
        
        console.log('📊 Stress monitoring started');
    }
    
    async assessAllEntrepreneurs() {
        for (const [entrepreneurId, entrepreneur] of this.entrepreneurs) {
            await this.assessEntrepreneurStress(entrepreneurId);
        }
    }
    
    async assessEntrepreneurStress(entrepreneurId) {
        const entrepreneur = this.entrepreneurs.get(entrepreneurId);
        const indicators = this.stressIndicators.get(entrepreneurId);
        
        if (!entrepreneur || !indicators) return;
        
        // Collect stress indicators
        const stressData = await this.collectStressData(entrepreneurId);
        
        // Calculate current stress level
        const stressLevel = this.calculateStressLevel(stressData, entrepreneur);
        
        // Update entrepreneur data
        entrepreneur.currentStressLevel = stressLevel;
        entrepreneur.lastCheckIn = new Date();
        
        // Record in patterns
        indicators.patterns.push({
            timestamp: new Date(),
            stressLevel,
            indicators: stressData,
            triggers: Array.from(indicators.triggers)
        });
        
        // Keep only last 30 patterns
        if (indicators.patterns.length > 30) {
            indicators.patterns.shift();
        }
        
        // Check for triggers
        await this.checkStressTriggers(entrepreneurId, stressLevel, stressData);
        
        this.emit('stress-assessed', { entrepreneurId, stressLevel, data: stressData });
    }
    
    async collectStressData(entrepreneurId) {
        // In production, this would collect from multiple sources:
        // - App usage patterns
        // - Decision frequency/quality
        // - Communication patterns
        // - Sleep/health data
        // - Financial metrics
        // - Team interaction data
        
        // Simulated stress data collection
        return {
            decisionFatigue: Math.random(),
            socialIsolation: Math.random(),
            financialPressure: Math.random(),
            workloadIntensity: Math.random(),
            sleepQuality: Math.random(),
            physicalHealth: Math.random(),
            teamStress: Math.random(),
            marketPressure: Math.random()
        };
    }
    
    calculateStressLevel(stressData, entrepreneur) {
        // Weighted stress calculation
        const weights = {
            decisionFatigue: 0.15,
            socialIsolation: 0.15,
            financialPressure: 0.20,
            workloadIntensity: 0.15,
            sleepQuality: 0.10,
            physicalHealth: 0.10,
            teamStress: 0.10,
            marketPressure: 0.05
        };
        
        let weightedStress = 0;
        for (const [indicator, value] of Object.entries(stressData)) {
            weightedStress += value * (weights[indicator] || 0);
        }
        
        // Apply risk factor multipliers
        for (const riskFactor of entrepreneur.riskFactors) {
            switch (riskFactor) {
                case 'isolation': weightedStress *= 1.2; break;
                case 'financial_pressure': weightedStress *= 1.15; break;
                case 'burnout_history': weightedStress *= 1.3; break;
                case 'inexperience': weightedStress *= 1.1; break;
            }
        }
        
        return Math.max(0, Math.min(1, weightedStress));
    }
    
    async checkStressTriggers(entrepreneurId, stressLevel, stressData) {
        const entrepreneur = this.entrepreneurs.get(entrepreneurId);
        const indicators = this.stressIndicators.get(entrepreneurId);
        
        // Check for various trigger conditions
        const triggers = [];
        
        // Stress spike detection
        if (stressLevel > 0.8) {
            triggers.push('stress_spike');
        }
        
        // Burnout risk
        if (stressLevel > this.options.burnoutThreshold / 100) {
            triggers.push('burnout_risk');
        }
        
        // Isolation detection
        if (stressData.socialIsolation > 0.7) {
            triggers.push('isolation');
        }
        
        // Financial crisis
        if (stressData.financialPressure > 0.9) {
            triggers.push('financial_crisis');
        }
        
        // Trend analysis
        if (indicators.patterns.length >= 3) {
            const recentTrend = indicators.patterns.slice(-3);
            const avgStress = recentTrend.reduce((sum, p) => sum + p.stressLevel, 0) / 3;
            
            if (avgStress > 0.7 && recentTrend.every(p => p.stressLevel > 0.6)) {
                triggers.push('sustained_stress');
            }
        }
        
        // Update triggers
        triggers.forEach(trigger => indicators.triggers.add(trigger));
        
        // Activate escape hatches if needed
        for (const trigger of triggers) {
            await this.evaluateEscapeActivation(entrepreneurId, trigger, stressLevel);
        }
    }
    
    // ===== ESCAPE HATCH ACTIVATION =====
    
    async evaluateEscapeActivation(entrepreneurId, trigger, stressLevel) {
        const entrepreneur = this.entrepreneurs.get(entrepreneurId);
        
        // Find matching escape types
        const applicableEscapes = Object.entries(this.escapeTypes)
            .filter(([type, config]) => config.triggers.includes(trigger));
        
        for (const [escapeType, config] of applicableEscapes) {
            // Check if already active
            const activeEscape = this.escapeActivations.get(`${entrepreneurId}_${escapeType}`);
            
            if (!activeEscape || activeEscape.status === 'resolved') {
                await this.activateEscapeHatch(entrepreneurId, escapeType, trigger, stressLevel);
            }
        }
    }
    
    async activateEscapeHatch(entrepreneurId, escapeType, trigger, stressLevel) {
        const activationId = this.generateId('escape');
        const entrepreneur = this.entrepreneurs.get(entrepreneurId);
        
        const activation = {
            id: activationId,
            entrepreneurId,
            escapeType,
            trigger,
            stressLevel,
            activatedAt: new Date(),
            status: 'active',
            interventions: [],
            resolution: null,
            duration: this.escapeTypes[escapeType].duration
        };
        
        this.escapeActivations.set(`${entrepreneurId}_${escapeType}`, activation);
        
        // Log to entrepreneur's history
        entrepreneur.escapeHistory.push({
            activationId,
            escapeType,
            trigger,
            timestamp: new Date()
        });
        
        console.log(`🚨 Escape hatch activated: ${escapeType} for ${entrepreneur.name} (trigger: ${trigger})`);
        
        // Execute immediate response
        const responseType = this.escapeTypes[escapeType].response;
        await this.executeEscapeResponse(entrepreneurId, activationId, responseType);
        
        // Schedule follow-up
        this.scheduleFollowUp(entrepreneurId, activationId);
        
        this.emit('escape-activated', activation);
        
        return activation;
    }
    
    async executeEscapeResponse(entrepreneurId, activationId, responseType) {
        const entrepreneur = this.entrepreneurs.get(entrepreneurId);
        const activation = this.escapeActivations.get(`${entrepreneurId}_${activation.escapeType}`);
        
        console.log(`🛠️ Executing escape response: ${responseType} for ${entrepreneur.name}`);
        
        const intervention = {
            id: this.generateId('intervention'),
            activationId,
            type: responseType,
            startedAt: new Date(),
            status: 'in_progress',
            actions: [],
            outcome: null
        };
        
        this.interventions.set(intervention.id, intervention);
        activation.interventions.push(intervention.id);
        
        // Execute the specific response
        switch (responseType) {
            case 'immediate_support':
                await this.provideImmediateSupport(entrepreneurId, intervention);
                break;
                
            case 'strategy_session':
                await this.scheduleStrategySession(entrepreneurId, intervention);
                break;
                
            case 'professional_help':
                await this.arrangeProfessionalHelp(entrepreneurId, intervention);
                break;
                
            case 'emergency_planning':
                await this.createEmergencyPlan(entrepreneurId, intervention);
                break;
                
            case 'team_mediation':
                await this.facilitateTeamMediation(entrepreneurId, intervention);
                break;
        }
        
        intervention.status = 'completed';
        intervention.completedAt = new Date();
        
        this.emit('intervention-completed', intervention);
    }
    
    // ===== SUPPORT MECHANISMS =====
    
    async provideImmediateSupport(entrepreneurId, intervention) {
        const entrepreneur = this.entrepreneurs.get(entrepreneurId);
        
        intervention.actions.push({
            type: 'mentor_alert',
            timestamp: new Date(),
            description: 'Notified primary mentor of crisis situation'
        });
        
        // Connect to mentor within 5 minutes
        const mentor = await this.findAvailableMentor(entrepreneurId);
        if (mentor) {
            await this.connectMentor(entrepreneurId, mentor.id, 'emergency');
            intervention.actions.push({
                type: 'mentor_connected',
                timestamp: new Date(),
                description: `Connected to mentor: ${mentor.name}`
            });
        }
        
        // Send supportive resources
        const resources = this.getSupportiveResources(entrepreneur.riskFactors);
        intervention.actions.push({
            type: 'resources_sent',
            timestamp: new Date(),
            description: `Sent ${resources.length} supportive resources`
        });
        
        // Schedule check-in
        setTimeout(() => {
            this.performCheckIn(entrepreneurId, intervention.id);
        }, 86400000); // 24 hours
        
        intervention.outcome = 'immediate_support_provided';
    }
    
    async scheduleStrategySession(entrepreneurId, intervention) {
        const entrepreneur = this.entrepreneurs.get(entrepreneurId);
        
        // Find strategy advisor
        const advisor = await this.findStrategyAdvisor(entrepreneur);
        
        if (advisor) {
            const sessionId = this.generateId('strategy_session');
            
            intervention.actions.push({
                type: 'strategy_session_scheduled',
                timestamp: new Date(),
                description: `Strategy session scheduled with ${advisor.name}`,
                sessionId
            });
            
            // In production, this would integrate with calendar systems
            console.log(`📅 Strategy session scheduled for ${entrepreneur.name} with ${advisor.name}`);
            
            intervention.outcome = 'strategy_session_scheduled';
        } else {
            intervention.outcome = 'no_advisor_available';
        }
    }
    
    async arrangeProfessionalHelp(entrepreneurId, intervention) {
        const entrepreneur = this.entrepreneurs.get(entrepreneurId);
        
        // Find mental health professionals
        const professionals = await this.findMentalHealthProfessionals(entrepreneur.location);
        
        if (professionals.length > 0) {
            intervention.actions.push({
                type: 'professional_referral',
                timestamp: new Date(),
                description: `Referred to ${professionals.length} mental health professionals`
            });
            
            // Send crisis resources
            intervention.actions.push({
                type: 'crisis_resources',
                timestamp: new Date(),
                description: 'Crisis hotline and emergency resources provided'
            });
            
            intervention.outcome = 'professional_help_arranged';
        } else {
            intervention.outcome = 'no_professionals_available';
        }
    }
    
    async createEmergencyPlan(entrepreneurId, intervention) {
        const entrepreneur = this.entrepreneurs.get(entrepreneurId);
        
        const emergencyPlan = {
            id: this.generateId('emergency_plan'),
            entrepreneurId,
            createdAt: new Date(),
            scenarios: [],
            actions: [],
            contacts: [],
            resources: []
        };
        
        // Identify critical scenarios
        emergencyPlan.scenarios = [
            'complete_funding_loss',
            'co_founder_departure',
            'major_customer_loss',
            'legal_issues',
            'health_emergency'
        ];
        
        // Define action steps for each scenario
        for (const scenario of emergencyPlan.scenarios) {
            emergencyPlan.actions.push({
                scenario,
                steps: this.getEmergencySteps(scenario, entrepreneur)
            });
        }
        
        // Emergency contacts
        emergencyPlan.contacts = await this.getEmergencyContacts(entrepreneurId);
        
        intervention.actions.push({
            type: 'emergency_plan_created',
            timestamp: new Date(),
            description: 'Comprehensive emergency plan created',
            planId: emergencyPlan.id
        });
        
        intervention.outcome = 'emergency_plan_ready';
        
        return emergencyPlan;
    }
    
    async facilitateTeamMediation(entrepreneurId, intervention) {
        const entrepreneur = this.entrepreneurs.get(entrepreneurId);
        
        // Find team mediation specialist
        const mediator = await this.findTeamMediator();
        
        if (mediator) {
            intervention.actions.push({
                type: 'mediator_assigned',
                timestamp: new Date(),
                description: `Team mediator assigned: ${mediator.name}`
            });
            
            // Schedule mediation sessions
            const sessionPlan = this.createMediationPlan(entrepreneur.teamSize || 2);
            
            intervention.actions.push({
                type: 'mediation_planned',
                timestamp: new Date(),
                description: `${sessionPlan.sessions} mediation sessions planned over ${sessionPlan.duration} days`
            });
            
            intervention.outcome = 'team_mediation_arranged';
        } else {
            intervention.outcome = 'no_mediator_available';
        }
    }
    
    // ===== SUPPORT NETWORK =====
    
    async initializeSupportNetwork() {
        // Create support categories
        this.supportCategories = {
            mentors: new Map(),
            peers: new Map(),
            professionals: new Map(),
            advisors: new Map(),
            emergency_contacts: new Map()
        };
        
        console.log('🤝 Support network initialized');
    }
    
    async assignToSupportNetwork(entrepreneurId) {
        const entrepreneur = this.entrepreneurs.get(entrepreneurId);
        
        // Find compatible mentors
        const mentor = await this.findCompatibleMentor(entrepreneur);
        if (mentor) {
            await this.createSupportConnection(entrepreneurId, mentor.id, 'mentor');
        }
        
        // Find peer group
        const peers = await this.findPeerGroup(entrepreneur);
        for (const peer of peers.slice(0, 3)) {
            await this.createSupportConnection(entrepreneurId, peer.id, 'peer');
        }
        
        // Assign professional if high risk
        if (entrepreneur.riskFactors.includes('burnout_history')) {
            const professional = await this.assignMentalHealthProfessional(entrepreneur);
            if (professional) {
                await this.createSupportConnection(entrepreneurId, professional.id, 'professional');
            }
        }
    }
    
    async createSupportConnection(entrepreneurId, supporterId, type) {
        const connectionId = `${entrepreneurId}_${supporterId}_${type}`;
        
        const connection = {
            id: connectionId,
            entrepreneurId,
            supporterId,
            type,
            createdAt: new Date(),
            strength: 0.5,
            interactions: 0,
            lastContact: null,
            availability: 'available'
        };
        
        this.supportNetwork.set(connectionId, connection);
        
        this.emit('support-connection-created', connection);
    }
    
    // ===== HELPER FUNCTIONS =====
    
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    async findAvailableMentor(entrepreneurId) {
        // Find mentor with availability and compatibility
        return {
            id: 'mentor_001',
            name: 'Sarah Chen',
            expertise: ['fintech', 'scaling'],
            availability: 'immediate'
        };
    }
    
    async findCompatibleMentor(entrepreneur) {
        // Match based on industry and stage
        return {
            id: 'mentor_002',
            name: 'Alex Rodriguez',
            expertise: entrepreneur.industries,
            stage: 'established'
        };
    }
    
    async findPeerGroup(entrepreneur) {
        // Find peers in similar stage and industry
        return [
            { id: 'peer_001', name: 'Lisa Wang', stage: entrepreneur.businessStage },
            { id: 'peer_002', name: 'Mike Johnson', industry: entrepreneur.industries[0] }
        ];
    }
    
    getSupportiveResources(riskFactors) {
        const resources = [
            { type: 'article', title: 'Managing Entrepreneurial Stress' },
            { type: 'meditation', title: '10-Minute Stress Relief' },
            { type: 'community', title: 'Entrepreneur Support Group' }
        ];
        
        // Add specific resources based on risk factors
        if (riskFactors.includes('isolation')) {
            resources.push({ type: 'networking', title: 'Local Entrepreneur Meetups' });
        }
        
        if (riskFactors.includes('financial_pressure')) {
            resources.push({ type: 'finance', title: 'Emergency Funding Options' });
        }
        
        return resources;
    }
    
    getEmergencySteps(scenario, entrepreneur) {
        const stepMap = {
            complete_funding_loss: [
                'Assess remaining runway',
                'Contact emergency investor network',
                'Reduce costs immediately',
                'Communicate with team',
                'Explore alternative funding'
            ],
            co_founder_departure: [
                'Document knowledge transfer',
                'Secure intellectual property',
                'Redistribute responsibilities',
                'Communicate with stakeholders',
                'Consider replacement strategy'
            ]
        };
        
        return stepMap[scenario] || ['Assess situation', 'Contact support network', 'Execute backup plan'];
    }
    
    scheduleFollowUp(entrepreneurId, activationId) {
        setTimeout(() => {
            this.performFollowUp(entrepreneurId, activationId);
        }, 86400000); // 24 hours
    }
    
    async performFollowUp(entrepreneurId, activationId) {
        console.log(`📞 Performing follow-up for ${entrepreneurId}, activation: ${activationId}`);
        
        // Reassess stress level
        await this.assessEntrepreneurStress(entrepreneurId);
        
        // Check intervention effectiveness
        const entrepreneur = this.entrepreneurs.get(entrepreneurId);
        if (entrepreneur.currentStressLevel < 0.5) {
            // Improvement detected
            this.resolveEscapeActivation(activationId, 'improved');
        } else {
            // May need additional support
            this.escalateSupport(entrepreneurId, activationId);
        }
    }
    
    resolveEscapeActivation(activationId, resolution) {
        for (const [key, activation] of this.escapeActivations) {
            if (activation.id === activationId) {
                activation.status = 'resolved';
                activation.resolution = resolution;
                activation.resolvedAt = new Date();
                
                this.emit('escape-resolved', activation);
                break;
            }
        }
    }
    
    escalateSupport(entrepreneurId, activationId) {
        console.log(`🚨 Escalating support for ${entrepreneurId}`);
        // In production, this would trigger higher-level interventions
    }
    
    // ===== PUBLIC API =====
    
    async triggerManualEscape(entrepreneurId, reason, urgency = 'normal') {
        const entrepreneur = this.entrepreneurs.get(entrepreneurId);
        if (!entrepreneur) throw new Error('Entrepreneur not found');
        
        return await this.activateEscapeHatch(entrepreneurId, 'manual_trigger', reason, urgency);
    }
    
    async getEntrepreneurStatus(entrepreneurId) {
        const entrepreneur = this.entrepreneurs.get(entrepreneurId);
        const indicators = this.stressIndicators.get(entrepreneurId);
        
        if (!entrepreneur || !indicators) return null;
        
        const activeEscapes = Array.from(this.escapeActivations.values())
            .filter(e => e.entrepreneurId === entrepreneurId && e.status === 'active');
        
        return {
            entrepreneur: entrepreneur,
            stressLevel: entrepreneur.currentStressLevel,
            riskFactors: entrepreneur.riskFactors,
            activeEscapes: activeEscapes,
            supportConnections: Array.from(this.supportNetwork.values())
                .filter(c => c.entrepreneurId === entrepreneurId),
            recentPatterns: indicators.patterns.slice(-7)
        };
    }
    
    getSystemStats() {
        const totalEntrepreneurs = this.entrepreneurs.size;
        const highStressCount = Array.from(this.entrepreneurs.values())
            .filter(e => e.currentStressLevel > 0.7).length;
        
        const activeEscapes = Array.from(this.escapeActivations.values())
            .filter(e => e.status === 'active').length;
        
        const totalInterventions = this.interventions.size;
        
        return {
            totalEntrepreneurs,
            highStressCount,
            activeEscapes,
            totalInterventions,
            supportConnections: this.supportNetwork.size
        };
    }
}

module.exports = EntrepreneurEscapeHatch;

// Example usage
if (require.main === module) {
    const escapeHatch = new EntrepreneurEscapeHatch();
    
    escapeHatch.on('initialized', async () => {
        console.log('Escape Hatch System Ready!');
        
        // Register entrepreneur
        const entrepreneur = await escapeHatch.registerEntrepreneur({
            name: 'Jane Startup',
            email: 'jane@startup.com',
            businessStage: 'early-stage',
            industries: ['fintech'],
            isFirstTimeFounder: true,
            financialRunway: 8,
            hasFamily: true,
            familySupport: false,
            previousBurnout: false,
            workingAlone: true
        });
        
        console.log('Entrepreneur registered:', entrepreneur.id);
        
        // Simulate stress assessment
        setTimeout(async () => {
            await escapeHatch.assessEntrepreneurStress(entrepreneur.id);
            
            const status = await escapeHatch.getEntrepreneurStatus(entrepreneur.id);
            console.log('Status:', JSON.stringify(status, null, 2));
        }, 2000);
        
        // System stats
        setTimeout(() => {
            console.log('System Stats:', escapeHatch.getSystemStats());
        }, 3000);
    });
}