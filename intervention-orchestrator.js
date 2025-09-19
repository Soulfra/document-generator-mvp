#!/usr/bin/env node

/**
 * INTERVENTION ORCHESTRATOR
 * 
 * Executes real-time interventions to protect players based on
 * behavioral monitoring and pattern detection results.
 * 
 * This system actually helps people by:
 * - Enforcing breaks when needed
 * - Providing reality checks
 * - Offering support resources
 * - Implementing self-exclusion
 * - Connecting to helplines
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const crypto = require('crypto');

// Import monitoring systems
const ResponsibleGamingMonitor = require('./responsible-gaming-monitor');
const GamblingPatternDetector = require('./gambling-pattern-detector');

class InterventionOrchestrator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // WebSocket server for dashboard communication
            wsPort: 8889,
            
            // Intervention configuration
            interventions: {
                // Gentle interventions
                realityCheck: {
                    cooldown: 300000, // 5 minutes between checks
                    templates: [
                        'You\'ve been playing for {time}. Consider taking a break.',
                        'You\'ve wagered ${amount} so far. Stay within your limits.',
                        'Remember to play responsibly. Take regular breaks.'
                    ]
                },
                
                // Break enforcement
                breakEnforcement: {
                    durations: {
                        short: 5 * 60 * 1000,      // 5 minutes
                        medium: 30 * 60 * 1000,    // 30 minutes
                        long: 60 * 60 * 1000,      // 1 hour
                        extended: 24 * 60 * 60 * 1000 // 24 hours
                    },
                    messages: {
                        start: 'Time for a break! Your session will resume in {duration}.',
                        countdown: 'Break time remaining: {remaining}',
                        complete: 'Your break is complete. Remember to play responsibly.'
                    }
                },
                
                // Limit enforcement
                limitEnforcement: {
                    types: ['deposit', 'loss', 'wager', 'time'],
                    actions: {
                        warn: 'You\'re approaching your {type} limit: {percentage}% used',
                        reached: 'You\'ve reached your {type} limit. No further {action} allowed today.',
                        suggest: 'Consider setting a {type} limit to help manage your play.'
                    }
                },
                
                // Support resources
                supportResources: {
                    helpline: {
                        number: '1-800-522-4700',
                        text: 'Text "HELP" to 1-800-522-4700',
                        chat: 'ncpgambling.org/chat',
                        available: '24/7'
                    },
                    websites: [
                        'ncpgambling.org',
                        'gamblersanonymous.org',
                        'smartrecovery.org'
                    ],
                    localResources: {
                        enabled: true,
                        geolocate: true
                    }
                },
                
                // Self-exclusion
                selfExclusion: {
                    durations: {
                        '6_months': 180 * 24 * 60 * 60 * 1000,
                        '1_year': 365 * 24 * 60 * 60 * 1000,
                        '5_years': 5 * 365 * 24 * 60 * 60 * 1000,
                        'lifetime': Infinity
                    },
                    requiresConfirmation: true,
                    coolingOffPeriod: 24 * 60 * 60 * 1000, // 24 hours to reconsider
                    crossProperty: true // Exclude from all affiliated properties
                }
            },
            
            // Effectiveness tracking
            tracking: {
                measureOutcomes: true,
                followUpPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
                anonymizedReporting: true
            },
            
            ...options
        };
        
        // System state
        this.state = {
            activeInterventions: new Map(),
            breakTimers: new Map(),
            cooldowns: new Map(),
            exclusions: new Map(),
            outcomes: new Map()
        };
        
        // Connected systems
        this.monitor = null;
        this.detector = null;
        this.wsServer = null;
        this.clients = new Set();
        
        // Statistics
        this.statistics = {
            interventionsExecuted: 0,
            breaksEnforced: 0,
            limitsEnforced: 0,
            resourcesProvided: 0,
            exclusionsProcessed: 0,
            playersHelped: 0
        };
        
        this.initialize();
    }
    
    /**
     * Initialize the orchestrator
     */
    async initialize() {
        console.log('🎭 Initializing Intervention Orchestrator...');
        console.log('🛡️ Player protection systems activating...');
        
        try {
            // Initialize monitoring systems
            await this.initializeMonitoringSystems();
            
            // Start WebSocket server
            await this.startWebSocketServer();
            
            // Set up intervention handlers
            this.setupInterventionHandlers();
            
            // Start outcome tracking
            this.startOutcomeTracking();
            
            console.log('✅ Intervention Orchestrator ready to protect players');
            
            this.emit('orchestrator_ready', {
                interventions: Object.keys(this.config.interventions),
                wsPort: this.config.wsPort
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize orchestrator:', error);
            throw error;
        }
    }
    
    /**
     * Initialize monitoring systems
     */
    async initializeMonitoringSystems() {
        // Initialize responsible gaming monitor
        this.monitor = new ResponsibleGamingMonitor({
            debugMode: true
        });
        
        // Initialize pattern detector
        this.detector = new GamblingPatternDetector({
            realTimeAnalysis: true
        });
        
        // Connect monitor events
        this.monitor.on('intervention', (event) => {
            this.handleInterventionRequest(event);
        });
        
        this.monitor.on('high_risk_alert', (alert) => {
            this.handleHighRiskAlert(alert);
        });
        
        // Connect pattern detector events
        this.detector.on('patterns_detected', (analysis) => {
            this.handlePatternDetection(analysis);
        });
        
        this.detector.on('high_risk_alert', (alert) => {
            this.handlePatternAlert(alert);
        });
        
        console.log('✅ Monitoring systems connected');
    }
    
    /**
     * Start WebSocket server for dashboard
     */
    async startWebSocketServer() {
        return new Promise((resolve, reject) => {
            try {
                this.wsServer = new WebSocket.Server({
                    port: this.config.wsPort,
                    perMessageDeflate: false
                });
                
                this.wsServer.on('connection', (ws) => {
                    console.log('🔌 Dashboard connected');
                    this.clients.add(ws);
                    
                    // Send initial state
                    this.sendToDashboard(ws, {
                        type: 'connection',
                        status: 'connected',
                        statistics: this.statistics
                    });
                    
                    ws.on('message', (message) => {
                        try {
                            const data = JSON.parse(message);
                            this.handleDashboardMessage(ws, data);
                        } catch (error) {
                            console.error('Invalid dashboard message:', error);
                        }
                    });
                    
                    ws.on('close', () => {
                        console.log('Dashboard disconnected');
                        this.clients.delete(ws);
                    });
                });
                
                this.wsServer.on('listening', () => {
                    console.log(`📡 WebSocket server listening on port ${this.config.wsPort}`);
                    resolve();
                });
                
                this.wsServer.on('error', reject);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Handle intervention request from monitor
     */
    handleInterventionRequest(event) {
        console.log(`🚨 Intervention requested: ${event.reason} for player ${event.playerId}`);
        
        // Execute appropriate interventions based on level
        switch (event.level) {
            case 1:
                this.executeRealityCheck(event.playerId, event);
                break;
                
            case 2:
                this.executeMandatoryBreak(event.playerId, 'short', event);
                break;
                
            case 3:
                this.executeLimitEnforcement(event.playerId, event);
                this.provideSupport(event.playerId);
                break;
                
            case 4:
                this.executeAccountProtection(event.playerId, event);
                break;
        }
        
        // Track intervention
        this.trackIntervention(event);
        
        // Broadcast to dashboard
        this.broadcastToDashboard({
            type: 'intervention_triggered',
            intervention: event
        });
    }
    
    /**
     * Execute reality check intervention
     */
    executeRealityCheck(playerId, context) {
        // Check cooldown
        const lastCheck = this.state.cooldowns.get(`reality_${playerId}`);
        if (lastCheck && Date.now() - lastCheck < this.config.interventions.realityCheck.cooldown) {
            return;
        }
        
        // Get player session
        const session = this.monitor.getPlayerSession(playerId);
        if (!session) return;
        
        // Select appropriate message
        const templates = this.config.interventions.realityCheck.templates;
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        // Format message
        const message = template
            .replace('{time}', this.formatDuration(session.currentSessionDuration))
            .replace('{amount}', session.totalWagered.toFixed(2));
        
        // Send reality check
        this.sendPlayerMessage(playerId, {
            type: 'reality_check',
            message,
            severity: 'info',
            actions: [
                { label: 'Continue Playing', action: 'dismiss' },
                { label: 'Take a Break', action: 'request_break' },
                { label: 'View Activity', action: 'show_statistics' }
            ]
        });
        
        // Update cooldown
        this.state.cooldowns.set(`reality_${playerId}`, Date.now());
        
        // Log intervention
        console.log(`💭 Reality check sent to player ${playerId}`);
        this.statistics.interventionsExecuted++;
    }
    
    /**
     * Execute mandatory break
     */
    executeMandatoryBreak(playerId, duration = 'short', context) {
        const breakDuration = this.config.interventions.breakEnforcement.durations[duration];
        const endTime = Date.now() + breakDuration;
        
        // Set break timer
        this.state.breakTimers.set(playerId, {
            startTime: Date.now(),
            endTime,
            duration: breakDuration,
            reason: context.reason
        });
        
        // Send break notification
        const message = this.config.interventions.breakEnforcement.messages.start
            .replace('{duration}', this.formatDuration(breakDuration));
        
        this.sendPlayerMessage(playerId, {
            type: 'mandatory_break',
            message,
            severity: 'warning',
            breakEndTime: endTime
        });
        
        // Force logout
        this.forcePlayerAction(playerId, 'logout', {
            reason: 'mandatory_break',
            duration: breakDuration
        });
        
        // Set timer to notify when break is complete
        setTimeout(() => {
            this.completeBreak(playerId);
        }, breakDuration);
        
        console.log(`⏸️ Mandatory ${duration} break enforced for player ${playerId}`);
        this.statistics.breaksEnforced++;
    }
    
    /**
     * Complete break period
     */
    completeBreak(playerId) {
        const breakInfo = this.state.breakTimers.get(playerId);
        if (!breakInfo) return;
        
        // Send completion message
        this.sendPlayerMessage(playerId, {
            type: 'break_complete',
            message: this.config.interventions.breakEnforcement.messages.complete,
            severity: 'success'
        });
        
        // Remove break timer
        this.state.breakTimers.delete(playerId);
        
        // Track outcome
        this.trackOutcome(playerId, 'break_completed', {
            duration: breakInfo.duration,
            reason: breakInfo.reason
        });
        
        console.log(`✅ Break completed for player ${playerId}`);
    }
    
    /**
     * Execute limit enforcement
     */
    executeLimitEnforcement(playerId, context) {
        const session = this.monitor.getPlayerSession(playerId);
        if (!session) return;
        
        // Check which limits are exceeded
        const exceededLimits = [];
        
        if (session.selfImposedLimits.daily && session.totalLost >= session.selfImposedLimits.daily) {
            exceededLimits.push({ type: 'loss', limit: session.selfImposedLimits.daily });
        }
        
        if (session.selfImposedLimits.sessionTime && session.currentSessionDuration >= session.selfImposedLimits.sessionTime) {
            exceededLimits.push({ type: 'time', limit: session.selfImposedLimits.sessionTime });
        }
        
        // Enforce limits
        exceededLimits.forEach(limit => {
            const message = this.config.interventions.limitEnforcement.actions.reached
                .replace('{type}', limit.type)
                .replace('{action}', limit.type === 'loss' ? 'wagering' : 'play');
            
            this.sendPlayerMessage(playerId, {
                type: 'limit_reached',
                message,
                severity: 'danger',
                limitType: limit.type
            });
            
            // Restrict actions based on limit type
            if (limit.type === 'loss' || limit.type === 'deposit') {
                this.restrictPlayerAction(playerId, 'wagering', {
                    until: this.getNextResetTime()
                });
            } else if (limit.type === 'time') {
                this.executeMandatoryBreak(playerId, 'medium', context);
            }
        });
        
        console.log(`🚫 Limits enforced for player ${playerId}: ${exceededLimits.map(l => l.type).join(', ')}`);
        this.statistics.limitsEnforced++;
    }
    
    /**
     * Provide support resources
     */
    provideSupport(playerId) {
        const resources = this.config.interventions.supportResources;
        
        // Send support message
        this.sendPlayerMessage(playerId, {
            type: 'support_resources',
            message: 'Help is available if you need it.',
            severity: 'info',
            resources: {
                helpline: resources.helpline,
                websites: resources.websites,
                immediate: true
            },
            actions: [
                { label: 'Call Helpline', action: 'call_helpline' },
                { label: 'Start Chat', action: 'start_chat' },
                { label: 'Self-Exclude', action: 'self_exclude' },
                { label: 'Not Now', action: 'dismiss' }
            ]
        });
        
        // If location services enabled, find local resources
        if (resources.localResources.enabled) {
            this.findLocalResources(playerId);
        }
        
        console.log(`🆘 Support resources provided to player ${playerId}`);
        this.statistics.resourcesProvided++;
    }
    
    /**
     * Execute account protection (highest level)
     */
    executeAccountProtection(playerId, context) {
        console.log(`🛡️ Executing account protection for player ${playerId}`);
        
        // Immediate account suspension
        this.forcePlayerAction(playerId, 'suspend_account', {
            reason: context.reason,
            duration: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Provide crisis support
        this.sendPlayerMessage(playerId, {
            type: 'account_protection',
            message: 'Your account has been temporarily suspended for your protection.',
            severity: 'critical',
            resources: {
                helpline: this.config.interventions.supportResources.helpline,
                immediate: true,
                crisis: true
            },
            actions: [
                { label: 'Get Help Now', action: 'crisis_support' },
                { label: 'Request Self-Exclusion', action: 'self_exclude' }
            ]
        });
        
        // Notify support team
        this.notifySupportTeam(playerId, context);
        
        // Track protected player
        this.statistics.playersHelped++;
        this.trackOutcome(playerId, 'account_protected', context);
    }
    
    /**
     * Process self-exclusion request
     */
    processSelfExclusion(playerId, duration) {
        const exclusionDuration = this.config.interventions.selfExclusion.durations[duration];
        
        if (this.config.interventions.selfExclusion.requiresConfirmation) {
            // Send confirmation request
            this.sendPlayerMessage(playerId, {
                type: 'self_exclusion_confirmation',
                message: `Are you sure you want to self-exclude for ${duration.replace('_', ' ')}?`,
                severity: 'warning',
                details: 'This action cannot be reversed until the exclusion period ends.',
                actions: [
                    { label: 'Confirm Self-Exclusion', action: 'confirm_exclusion', data: { duration } },
                    { label: 'Cancel', action: 'cancel' }
                ]
            });
            
            return;
        }
        
        this.confirmSelfExclusion(playerId, duration, exclusionDuration);
    }
    
    /**
     * Confirm self-exclusion
     */
    confirmSelfExclusion(playerId, duration, exclusionDuration) {
        const exclusion = {
            playerId,
            startTime: Date.now(),
            endTime: exclusionDuration === Infinity ? null : Date.now() + exclusionDuration,
            duration,
            crossProperty: this.config.interventions.selfExclusion.crossProperty
        };
        
        // Record exclusion
        this.state.exclusions.set(playerId, exclusion);
        
        // Execute exclusion
        this.forcePlayerAction(playerId, 'permanent_exclusion', exclusion);
        
        // Send confirmation
        this.sendPlayerMessage(playerId, {
            type: 'self_exclusion_confirmed',
            message: 'Your self-exclusion has been processed.',
            severity: 'success',
            details: `You are excluded for ${duration.replace('_', ' ')}. Help is available if you need it.`,
            resources: this.config.interventions.supportResources
        });
        
        // If cross-property, notify other systems
        if (exclusion.crossProperty) {
            this.notifyCrossPropertyExclusion(exclusion);
        }
        
        console.log(`🚫 Self-exclusion processed for player ${playerId}: ${duration}`);
        this.statistics.exclusionsProcessed++;
        this.statistics.playersHelped++;
        
        // Track outcome
        this.trackOutcome(playerId, 'self_excluded', { duration });
    }
    
    /**
     * Handle pattern detection
     */
    handlePatternDetection(analysis) {
        // Forward to dashboard
        this.broadcastToDashboard({
            type: 'pattern_detected',
            patterns: analysis.patterns,
            playerId: analysis.playerId,
            riskScore: analysis.riskScore
        });
        
        // Generate recommendations
        analysis.recommendations.forEach(rec => {
            this.broadcastToDashboard({
                type: 'recommendation',
                recommendation: rec,
                playerId: analysis.playerId
            });
        });
    }
    
    /**
     * Handle high risk alerts
     */
    handleHighRiskAlert(alert) {
        console.log(`🚨 HIGH RISK ALERT: Player ${alert.playerId}`);
        
        // Immediate intervention
        this.executeAccountProtection(alert.playerId, {
            reason: 'high_risk_detected',
            riskScore: alert.riskScore,
            patterns: alert.patterns
        });
    }
    
    /**
     * Handle pattern-based alerts
     */
    handlePatternAlert(alert) {
        // Execute recommended interventions
        alert.recommendations.forEach(rec => {
            if (rec.type === 'immediate' || rec.type === 'critical') {
                this.executeRecommendedAction(alert.playerId, rec);
            }
        });
    }
    
    /**
     * Execute recommended action
     */
    executeRecommendedAction(playerId, recommendation) {
        switch (recommendation.action) {
            case 'reality_check':
                this.executeRealityCheck(playerId, { reason: 'pattern_detected' });
                break;
                
            case 'betting_limits':
                this.executeLimitEnforcement(playerId, { reason: 'pattern_detected' });
                break;
                
            case 'account_freeze':
                this.executeMandatoryBreak(playerId, 'extended', { reason: 'pattern_detected' });
                break;
                
            case 'counseling_referral':
                this.provideSupport(playerId);
                break;
                
            case 'payment_limits':
                this.restrictPlayerAction(playerId, 'deposits', { dailyLimit: 100 });
                break;
        }
    }
    
    /**
     * Handle dashboard messages
     */
    handleDashboardMessage(ws, data) {
        switch (data.type) {
            case 'intervention':
                if (data.action === 'send_message') {
                    this.executeRealityCheck(data.playerId, { reason: 'manual_intervention' });
                } else if (data.action === 'enforce_break') {
                    this.executeMandatoryBreak(data.playerId, 'short', { reason: 'manual_intervention' });
                } else if (data.action === 'offer_help') {
                    this.provideSupport(data.playerId);
                }
                break;
                
            case 'emergency':
                if (data.action === 'pause_all') {
                    this.executEmergencyPause();
                }
                break;
        }
    }
    
    /**
     * Execute emergency pause
     */
    executEmergencyPause() {
        console.log('🚨 EMERGENCY: Pausing all gaming');
        
        // Get all active sessions
        const activePlayers = Array.from(this.monitor.sessions.keys());
        
        // Pause each player
        activePlayers.forEach(playerId => {
            this.executeMandatoryBreak(playerId, 'medium', { reason: 'emergency_pause' });
        });
        
        // Broadcast emergency status
        this.broadcastToDashboard({
            type: 'emergency_executed',
            action: 'all_gaming_paused',
            affectedPlayers: activePlayers.length
        });
    }
    
    /**
     * Helper methods
     */
    sendPlayerMessage(playerId, message) {
        // This would send actual message to player's client
        console.log(`📨 Message to player ${playerId}:`, message.message);
        
        // Emit for other systems to handle
        this.emit('player_message', { playerId, ...message });
    }
    
    forcePlayerAction(playerId, action, data) {
        // This would execute actual platform actions
        console.log(`⚡ Forcing action for player ${playerId}: ${action}`);
        
        // Emit for platform integration
        this.emit('force_action', { playerId, action, ...data });
    }
    
    restrictPlayerAction(playerId, action, restrictions) {
        // This would implement actual restrictions
        console.log(`🚫 Restricting ${action} for player ${playerId}`);
        
        // Emit for platform integration
        this.emit('restrict_action', { playerId, action, restrictions });
    }
    
    notifySupportTeam(playerId, context) {
        // This would notify human support team
        console.log(`📞 Notifying support team about player ${playerId}`);
        
        this.emit('support_alert', { playerId, context, priority: 'high' });
    }
    
    notifyCrossPropertyExclusion(exclusion) {
        // This would notify affiliated properties
        console.log(`📢 Broadcasting cross-property exclusion for player ${exclusion.playerId}`);
        
        this.emit('cross_property_exclusion', exclusion);
    }
    
    findLocalResources(playerId) {
        // This would use geolocation to find local help
        console.log(`📍 Finding local resources for player ${playerId}`);
        
        // Mock local resources
        const localResources = [
            'Local Gamblers Anonymous meetings',
            'State problem gambling council',
            'Nearby counseling services'
        ];
        
        this.sendPlayerMessage(playerId, {
            type: 'local_resources',
            message: 'Local help resources are available',
            resources: localResources
        });
    }
    
    /**
     * Tracking methods
     */
    trackIntervention(intervention) {
        if (!this.state.activeInterventions.has(intervention.playerId)) {
            this.state.activeInterventions.set(intervention.playerId, []);
        }
        
        this.state.activeInterventions.get(intervention.playerId).push({
            ...intervention,
            timestamp: Date.now()
        });
    }
    
    trackOutcome(playerId, outcome, data) {
        if (!this.state.outcomes.has(playerId)) {
            this.state.outcomes.set(playerId, []);
        }
        
        this.state.outcomes.get(playerId).push({
            outcome,
            data,
            timestamp: Date.now()
        });
        
        // Check if intervention was successful
        if (outcome === 'break_completed' || outcome === 'self_excluded') {
            this.statistics.playersHelped++;
        }
    }
    
    startOutcomeTracking() {
        // Periodic outcome analysis
        setInterval(() => {
            this.analyzeOutcomes();
        }, 3600000); // Every hour
    }
    
    analyzeOutcomes() {
        // Analyze intervention effectiveness
        const totalInterventions = this.statistics.interventionsExecuted;
        const successfulOutcomes = this.statistics.playersHelped;
        
        const effectiveness = totalInterventions > 0 
            ? (successfulOutcomes / totalInterventions * 100).toFixed(1)
            : 0;
        
        console.log(`📊 Intervention effectiveness: ${effectiveness}%`);
        
        // Broadcast statistics update
        this.broadcastToDashboard({
            type: 'statistics',
            stats: {
                ...this.statistics,
                effectiveness: effectiveness + '%'
            }
        });
    }
    
    /**
     * Setup intervention handlers
     */
    setupInterventionHandlers() {
        // Handle player responses to interventions
        this.on('player_response', (response) => {
            this.handlePlayerResponse(response);
        });
    }
    
    handlePlayerResponse(response) {
        switch (response.action) {
            case 'request_break':
                this.executeMandatoryBreak(response.playerId, 'short', { reason: 'player_requested' });
                break;
                
            case 'show_statistics':
                this.showPlayerStatistics(response.playerId);
                break;
                
            case 'call_helpline':
                this.initiateHelplineCall(response.playerId);
                break;
                
            case 'start_chat':
                this.startSupportChat(response.playerId);
                break;
                
            case 'self_exclude':
                this.showSelfExclusionOptions(response.playerId);
                break;
                
            case 'confirm_exclusion':
                this.confirmSelfExclusion(response.playerId, response.data.duration);
                break;
        }
    }
    
    /**
     * Utility methods
     */
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
            return `${seconds} second${seconds > 1 ? 's' : ''}`;
        }
    }
    
    getNextResetTime() {
        // Get next midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
    }
    
    sendToDashboard(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }
    
    broadcastToDashboard(data) {
        this.clients.forEach(client => {
            this.sendToDashboard(client, data);
        });
    }
    
    /**
     * Shutdown orchestrator
     */
    async shutdown() {
        console.log('🛑 Shutting down Intervention Orchestrator...');
        
        // Close WebSocket server
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        // Save outcomes data
        await this.saveOutcomes();
        
        console.log('✅ Intervention Orchestrator shutdown complete');
    }
    
    async saveOutcomes() {
        // In production, this would save to database
        const outcomes = {
            timestamp: Date.now(),
            statistics: this.statistics,
            effectiveness: this.calculateEffectiveness(),
            interventions: Array.from(this.state.activeInterventions.entries()),
            outcomes: Array.from(this.state.outcomes.entries())
        };
        
        console.log('📊 Intervention outcomes saved');
        return outcomes;
    }
    
    calculateEffectiveness() {
        const total = this.statistics.interventionsExecuted;
        const successful = this.statistics.playersHelped;
        
        return {
            total,
            successful,
            rate: total > 0 ? (successful / total * 100).toFixed(1) + '%' : '0%'
        };
    }
}

module.exports = InterventionOrchestrator;

// If run directly, start the orchestrator
if (require.main === module) {
    const orchestrator = new InterventionOrchestrator();
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutdown signal received...');
        await orchestrator.shutdown();
        process.exit(0);
    });
    
    console.log('🎭 Intervention Orchestrator running...');
    console.log('📞 Help is always available: 1-800-522-4700');
}