#!/usr/bin/env node

/**
 * RESPONSIBLE GAMING BEHAVIORAL MONITOR
 * 
 * Real-time monitoring system that tracks gambling behavior patterns
 * and connects debug/tracer tools for intervention and player protection.
 * 
 * Inspired by Treasure Island and other casinos' responsible gaming initiatives
 * to help prevent and address gambling addiction through technology.
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class ResponsibleGamingMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Monitoring thresholds based on research
            thresholds: {
                // Time-based thresholds
                sessionDuration: {
                    warning: 2 * 60 * 60 * 1000,    // 2 hours
                    danger: 6 * 60 * 60 * 1000,     // 6 hours
                    critical: 12 * 60 * 60 * 1000   // 12 hours
                },
                
                // Money-based thresholds (percentage of stated limit)
                spendingLimit: {
                    warning: 0.5,    // 50% of limit
                    danger: 0.8,     // 80% of limit
                    critical: 1.0    // 100% of limit
                },
                
                // Frequency-based thresholds
                depositsPerDay: {
                    warning: 3,
                    danger: 5,
                    critical: 10
                },
                
                // Behavioral pattern thresholds
                lossChasing: {
                    velocityIncrease: 1.5,  // 50% increase in betting speed
                    betSizeIncrease: 2.0,   // 100% increase in bet size
                    consecutiveLosses: 5    // 5 losses in a row
                }
            },
            
            // Intervention levels
            interventions: {
                level1: {
                    name: 'Gentle Reminder',
                    actions: ['display_time_played', 'show_amount_spent']
                },
                level2: {
                    name: 'Reality Check',
                    actions: ['mandatory_break_prompt', 'loss_summary', 'wellness_tips']
                },
                level3: {
                    name: 'Cooling Period',
                    actions: ['enforce_break', 'limit_deposits', 'counseling_resources']
                },
                level4: {
                    name: 'Protection Mode',
                    actions: ['account_suspension', 'self_exclusion_prompt', 'helpline_connect']
                }
            },
            
            // Real-time tracking state
            trackingEnabled: true,
            debugMode: true,
            aiAnalysisEnabled: true,
            
            ...options
        };
        
        // Player session tracking
        this.sessions = new Map();
        
        // Behavioral pattern cache
        this.patternCache = new Map();
        
        // Intervention history
        this.interventionHistory = new Map();
        
        // Real-time metrics
        this.metrics = {
            totalPlayersMonitored: 0,
            interventionsTriggered: 0,
            successfulInterventions: 0,
            playersProtected: 0
        };
        
        this.initialize();
    }
    
    /**
     * Initialize the monitoring system
     */
    async initialize() {
        console.log('🎰 Initializing Responsible Gaming Monitor...');
        console.log('🛡️ Player protection systems online');
        console.log('📊 Behavioral tracking enabled');
        console.log('🚨 Intervention systems ready');
        
        // Start real-time monitoring
        this.startMonitoring();
        
        // Initialize pattern detection
        this.initializePatternDetection();
        
        // Connect to debug/tracer system
        this.connectToDebugTracer();
        
        this.emit('monitor_ready', {
            thresholds: this.config.thresholds,
            interventions: Object.keys(this.config.interventions)
        });
    }
    
    /**
     * Start monitoring player sessions
     */
    startMonitoring() {
        console.log('👁️ Real-time monitoring activated');
        
        // Check sessions every second
        setInterval(() => {
            this.checkAllSessions();
        }, 1000);
        
        // Pattern analysis every 30 seconds
        setInterval(() => {
            this.analyzePatterns();
        }, 30000);
        
        // Metrics reporting every minute
        setInterval(() => {
            this.reportMetrics();
        }, 60000);
    }
    
    /**
     * Track a new player session
     */
    startPlayerSession(playerId, playerInfo = {}) {
        const sessionId = crypto.randomUUID();
        
        const session = {
            id: sessionId,
            playerId,
            startTime: Date.now(),
            lastActivity: Date.now(),
            
            // Time tracking
            totalPlayTime: 0,
            currentSessionDuration: 0,
            breaksTaken: 0,
            lastBreakTime: null,
            
            // Money tracking
            initialBalance: playerInfo.balance || 0,
            currentBalance: playerInfo.balance || 0,
            totalDeposits: 0,
            totalWithdrawals: 0,
            totalWagered: 0,
            totalWon: 0,
            totalLost: 0,
            depositCount: 0,
            
            // Behavioral tracking
            betHistory: [],
            winLossStreak: 0,
            averageBetSize: 0,
            betSizeVariance: 0,
            playSpeed: 0, // bets per minute
            
            // Risk indicators
            riskScore: 0,
            warningLevel: 0,
            interventionCount: 0,
            
            // Player preferences
            selfImposedLimits: {
                daily: playerInfo.dailyLimit || null,
                weekly: playerInfo.weeklyLimit || null,
                monthly: playerInfo.monthlyLimit || null,
                sessionTime: playerInfo.sessionTimeLimit || null
            },
            
            // Flags
            isAtRisk: false,
            isChasingLosses: false,
            isAcceleratingPlay: false,
            isExhibitingProblematicBehavior: false
        };
        
        this.sessions.set(playerId, session);
        this.metrics.totalPlayersMonitored++;
        
        // Log to debug system
        this.debugLog('info', `New session started for player ${playerId}`);
        
        // Create initial trace
        this.createTrace('session_start', {
            playerId,
            sessionId,
            limits: session.selfImposedLimits
        });
        
        return sessionId;
    }
    
    /**
     * Update player activity
     */
    updatePlayerActivity(playerId, activity) {
        const session = this.sessions.get(playerId);
        if (!session) return;
        
        session.lastActivity = Date.now();
        session.currentSessionDuration = Date.now() - session.startTime;
        
        switch (activity.type) {
            case 'bet':
                this.processBet(session, activity);
                break;
                
            case 'deposit':
                this.processDeposit(session, activity);
                break;
                
            case 'withdrawal':
                this.processWithdrawal(session, activity);
                break;
                
            case 'win':
                this.processWin(session, activity);
                break;
                
            case 'loss':
                this.processLoss(session, activity);
                break;
        }
        
        // Recalculate risk score
        this.calculateRiskScore(session);
        
        // Check for intervention triggers
        this.checkInterventionTriggers(session);
    }
    
    /**
     * Process betting activity
     */
    processBet(session, activity) {
        const bet = {
            amount: activity.amount,
            timestamp: Date.now(),
            gameType: activity.gameType,
            odds: activity.odds
        };
        
        session.betHistory.push(bet);
        session.totalWagered += bet.amount;
        
        // Calculate betting velocity
        const recentBets = session.betHistory.filter(b => 
            Date.now() - b.timestamp < 60000 // Last minute
        );
        session.playSpeed = recentBets.length;
        
        // Update average bet size
        session.averageBetSize = session.totalWagered / session.betHistory.length;
        
        // Calculate variance
        const variance = this.calculateBetVariance(session.betHistory);
        session.betSizeVariance = variance;
        
        // Check for acceleration
        if (session.playSpeed > 30) { // More than 30 bets per minute
            session.isAcceleratingPlay = true;
            this.debugLog('warning', `Player ${session.playerId} is accelerating play: ${session.playSpeed} bets/min`);
        }
        
        // Create trace for bet
        this.createTrace('bet_placed', {
            playerId: session.playerId,
            amount: bet.amount,
            playSpeed: session.playSpeed,
            totalWagered: session.totalWagered
        });
    }
    
    /**
     * Process deposit activity
     */
    processDeposit(session, activity) {
        session.totalDeposits += activity.amount;
        session.currentBalance += activity.amount;
        session.depositCount++;
        
        // Check deposit frequency
        const today = new Date().toDateString();
        if (!session.dailyDeposits) session.dailyDeposits = {};
        if (!session.dailyDeposits[today]) session.dailyDeposits[today] = 0;
        session.dailyDeposits[today]++;
        
        // Check against thresholds
        if (session.dailyDeposits[today] >= this.config.thresholds.depositsPerDay.warning) {
            this.debugLog('warning', `Player ${session.playerId} has made ${session.dailyDeposits[today]} deposits today`);
            session.isAtRisk = true;
        }
        
        // Check against self-imposed limits
        if (session.selfImposedLimits.daily && session.totalDeposits > session.selfImposedLimits.daily) {
            this.triggerIntervention(session, 'daily_limit_exceeded');
        }
        
        this.createTrace('deposit_made', {
            playerId: session.playerId,
            amount: activity.amount,
            dailyCount: session.dailyDeposits[today],
            totalDeposits: session.totalDeposits
        });
    }
    
    /**
     * Process win activity
     */
    processWin(session, activity) {
        session.totalWon += activity.amount;
        session.currentBalance += activity.amount;
        
        // Update win/loss streak
        if (session.winLossStreak < 0) {
            session.winLossStreak = 1;
        } else {
            session.winLossStreak++;
        }
        
        // Reset loss chasing flag on significant win
        if (activity.amount > session.averageBetSize * 5) {
            session.isChasingLosses = false;
        }
        
        this.createTrace('win_recorded', {
            playerId: session.playerId,
            amount: activity.amount,
            streak: session.winLossStreak
        });
    }
    
    /**
     * Process loss activity
     */
    processLoss(session, activity) {
        session.totalLost += activity.amount;
        session.currentBalance -= activity.amount;
        
        // Update win/loss streak
        if (session.winLossStreak > 0) {
            session.winLossStreak = -1;
        } else {
            session.winLossStreak--;
        }
        
        // Check for loss chasing behavior
        if (Math.abs(session.winLossStreak) >= this.config.thresholds.lossChasing.consecutiveLosses) {
            // Check if bet sizes are increasing
            const recentBets = session.betHistory.slice(-5);
            if (recentBets.length >= 2) {
                const avgRecent = recentBets.reduce((sum, b) => sum + b.amount, 0) / recentBets.length;
                if (avgRecent > session.averageBetSize * this.config.thresholds.lossChasing.betSizeIncrease) {
                    session.isChasingLosses = true;
                    this.debugLog('danger', `Player ${session.playerId} appears to be chasing losses`);
                    this.triggerIntervention(session, 'loss_chasing_detected');
                }
            }
        }
        
        this.createTrace('loss_recorded', {
            playerId: session.playerId,
            amount: activity.amount,
            streak: session.winLossStreak,
            isChasingLosses: session.isChasingLosses
        });
    }
    
    /**
     * Calculate risk score for a session
     */
    calculateRiskScore(session) {
        let riskScore = 0;
        
        // Time-based risk (0-25 points)
        const timePlayed = session.currentSessionDuration;
        if (timePlayed > this.config.thresholds.sessionDuration.critical) {
            riskScore += 25;
        } else if (timePlayed > this.config.thresholds.sessionDuration.danger) {
            riskScore += 20;
        } else if (timePlayed > this.config.thresholds.sessionDuration.warning) {
            riskScore += 10;
        }
        
        // Money-based risk (0-25 points)
        if (session.selfImposedLimits.daily) {
            const spentPercentage = session.totalLost / session.selfImposedLimits.daily;
            if (spentPercentage >= this.config.thresholds.spendingLimit.critical) {
                riskScore += 25;
            } else if (spentPercentage >= this.config.thresholds.spendingLimit.danger) {
                riskScore += 20;
            } else if (spentPercentage >= this.config.thresholds.spendingLimit.warning) {
                riskScore += 10;
            }
        }
        
        // Behavioral risk (0-25 points)
        if (session.isChasingLosses) riskScore += 15;
        if (session.isAcceleratingPlay) riskScore += 10;
        
        // Pattern risk (0-25 points)
        if (session.depositCount >= this.config.thresholds.depositsPerDay.critical) {
            riskScore += 25;
        } else if (session.depositCount >= this.config.thresholds.depositsPerDay.danger) {
            riskScore += 15;
        }
        
        session.riskScore = Math.min(100, riskScore);
        
        // Update warning level
        if (session.riskScore >= 75) {
            session.warningLevel = 4;
        } else if (session.riskScore >= 50) {
            session.warningLevel = 3;
        } else if (session.riskScore >= 25) {
            session.warningLevel = 2;
        } else if (session.riskScore >= 10) {
            session.warningLevel = 1;
        } else {
            session.warningLevel = 0;
        }
        
        return session.riskScore;
    }
    
    /**
     * Check for intervention triggers
     */
    checkInterventionTriggers(session) {
        const triggers = [];
        
        // Time triggers
        if (session.currentSessionDuration > this.config.thresholds.sessionDuration.warning) {
            triggers.push('extended_play_time');
        }
        
        // Money triggers
        if (session.totalLost > (session.selfImposedLimits.daily || Infinity)) {
            triggers.push('daily_limit_exceeded');
        }
        
        // Behavioral triggers
        if (session.isChasingLosses) {
            triggers.push('loss_chasing_behavior');
        }
        
        if (session.isAcceleratingPlay) {
            triggers.push('rapid_play_pattern');
        }
        
        // Risk score triggers
        if (session.riskScore >= 75 && session.warningLevel === 4) {
            triggers.push('critical_risk_level');
        }
        
        // Process triggers
        triggers.forEach(trigger => {
            this.triggerIntervention(session, trigger);
        });
    }
    
    /**
     * Trigger an intervention
     */
    triggerIntervention(session, reason) {
        const interventionLevel = `level${session.warningLevel || 1}`;
        const intervention = this.config.interventions[interventionLevel];
        
        if (!intervention) return;
        
        const interventionEvent = {
            id: crypto.randomUUID(),
            sessionId: session.id,
            playerId: session.playerId,
            reason,
            level: session.warningLevel,
            timestamp: Date.now(),
            actions: intervention.actions,
            riskScore: session.riskScore
        };
        
        // Record intervention
        if (!this.interventionHistory.has(session.playerId)) {
            this.interventionHistory.set(session.playerId, []);
        }
        this.interventionHistory.get(session.playerId).push(interventionEvent);
        
        session.interventionCount++;
        this.metrics.interventionsTriggered++;
        
        // Log intervention
        this.debugLog('critical', `INTERVENTION: ${intervention.name} triggered for player ${session.playerId} - Reason: ${reason}`);
        
        // Create intervention trace
        this.createTrace('intervention_triggered', {
            playerId: session.playerId,
            reason,
            level: session.warningLevel,
            actions: intervention.actions,
            riskScore: session.riskScore
        });
        
        // Emit intervention event
        this.emit('intervention', interventionEvent);
        
        // Execute intervention actions
        this.executeInterventionActions(session, intervention.actions);
    }
    
    /**
     * Execute intervention actions
     */
    executeInterventionActions(session, actions) {
        actions.forEach(action => {
            switch (action) {
                case 'display_time_played':
                    this.emit('show_message', {
                        playerId: session.playerId,
                        type: 'info',
                        message: `You've been playing for ${Math.round(session.currentSessionDuration / 60000)} minutes`
                    });
                    break;
                    
                case 'show_amount_spent':
                    this.emit('show_message', {
                        playerId: session.playerId,
                        type: 'warning',
                        message: `You've wagered $${session.totalWagered.toFixed(2)} this session`
                    });
                    break;
                    
                case 'mandatory_break_prompt':
                    this.emit('require_break', {
                        playerId: session.playerId,
                        duration: 5 * 60 * 1000 // 5 minutes
                    });
                    break;
                    
                case 'enforce_break':
                    this.emit('force_logout', {
                        playerId: session.playerId,
                        duration: 60 * 60 * 1000 // 1 hour
                    });
                    session.breaksTaken++;
                    session.lastBreakTime = Date.now();
                    break;
                    
                case 'limit_deposits':
                    this.emit('restrict_deposits', {
                        playerId: session.playerId,
                        maxAmount: 100,
                        duration: 24 * 60 * 60 * 1000 // 24 hours
                    });
                    break;
                    
                case 'account_suspension':
                    this.emit('suspend_account', {
                        playerId: session.playerId,
                        duration: 7 * 24 * 60 * 60 * 1000 // 7 days
                    });
                    this.metrics.playersProtected++;
                    break;
                    
                case 'self_exclusion_prompt':
                    this.emit('show_self_exclusion', {
                        playerId: session.playerId,
                        options: ['6_months', '1_year', '5_years', 'lifetime']
                    });
                    break;
                    
                case 'helpline_connect':
                    this.emit('show_helpline', {
                        playerId: session.playerId,
                        number: '1-800-522-4700',
                        chat: true,
                        immediate: true
                    });
                    break;
                    
                case 'counseling_resources':
                    this.emit('show_resources', {
                        playerId: session.playerId,
                        resources: [
                            'National Council on Problem Gambling',
                            'Gamblers Anonymous',
                            'Local counseling services'
                        ]
                    });
                    break;
            }
        });
    }
    
    /**
     * Check all active sessions
     */
    checkAllSessions() {
        for (const [playerId, session] of this.sessions) {
            // Update session duration
            session.currentSessionDuration = Date.now() - session.startTime;
            
            // Check for idle timeout
            if (Date.now() - session.lastActivity > 30 * 60 * 1000) { // 30 minutes idle
                this.endPlayerSession(playerId, 'idle_timeout');
                continue;
            }
            
            // Recalculate risk score
            this.calculateRiskScore(session);
            
            // Check intervention triggers
            this.checkInterventionTriggers(session);
        }
    }
    
    /**
     * Analyze patterns across all sessions
     */
    analyzePatterns() {
        const patterns = {
            totalAtRisk: 0,
            chasingLosses: 0,
            acceleratingPlay: 0,
            exceedingLimits: 0
        };
        
        for (const [playerId, session] of this.sessions) {
            if (session.isAtRisk) patterns.totalAtRisk++;
            if (session.isChasingLosses) patterns.chasingLosses++;
            if (session.isAcceleratingPlay) patterns.acceleratingPlay++;
            if (session.totalLost > (session.selfImposedLimits.daily || Infinity)) {
                patterns.exceedingLimits++;
            }
        }
        
        // Log pattern summary
        this.debugLog('info', `Pattern Analysis: ${patterns.totalAtRisk} at risk, ${patterns.chasingLosses} chasing losses`);
        
        // Create pattern trace
        this.createTrace('pattern_analysis', patterns);
    }
    
    /**
     * Calculate bet size variance
     */
    calculateBetVariance(betHistory) {
        if (betHistory.length < 2) return 0;
        
        const amounts = betHistory.map(b => b.amount);
        const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
        const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
        
        return Math.sqrt(variance);
    }
    
    /**
     * End a player session
     */
    endPlayerSession(playerId, reason = 'normal') {
        const session = this.sessions.get(playerId);
        if (!session) return;
        
        // Final metrics
        const summary = {
            playerId,
            sessionId: session.id,
            duration: session.currentSessionDuration,
            totalWagered: session.totalWagered,
            totalWon: session.totalWon,
            totalLost: session.totalLost,
            netResult: session.totalWon - session.totalLost,
            finalRiskScore: session.riskScore,
            interventions: session.interventionCount,
            reason
        };
        
        // Log session end
        this.debugLog('info', `Session ended for player ${playerId}: ${reason}`);
        
        // Create final trace
        this.createTrace('session_end', summary);
        
        // Check if intervention was successful
        if (session.interventionCount > 0 && reason === 'player_choice') {
            this.metrics.successfulInterventions++;
        }
        
        // Remove session
        this.sessions.delete(playerId);
        
        // Emit session end event
        this.emit('session_ended', summary);
    }
    
    /**
     * Report metrics
     */
    reportMetrics() {
        const report = {
            timestamp: Date.now(),
            activeSessions: this.sessions.size,
            ...this.metrics,
            interventionSuccessRate: this.metrics.interventionsTriggered > 0 
                ? (this.metrics.successfulInterventions / this.metrics.interventionsTriggered * 100).toFixed(2) + '%'
                : '0%'
        };
        
        this.debugLog('info', `Metrics: ${report.activeSessions} active, ${report.interventionsTriggered} interventions`);
        
        this.emit('metrics_report', report);
    }
    
    /**
     * Connect to debug/tracer system
     */
    connectToDebugTracer() {
        // This connects to the existing debug-tracer bridge
        this.on('debug_log', (log) => {
            // Forward to debug system
            if (this.debugTracer) {
                this.debugTracer.addLog(log);
            }
        });
        
        this.on('trace_event', (trace) => {
            // Forward to tracer system
            if (this.debugTracer) {
                this.debugTracer.addTrace(trace);
            }
        });
    }
    
    /**
     * Debug logging
     */
    debugLog(level, message) {
        if (!this.config.debugMode) return;
        
        const log = {
            timestamp: Date.now(),
            level,
            message,
            source: 'ResponsibleGamingMonitor'
        };
        
        console.log(`[${level.toUpperCase()}] ${message}`);
        this.emit('debug_log', log);
    }
    
    /**
     * Create trace event
     */
    createTrace(type, data) {
        const trace = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type,
            data,
            source: 'ResponsibleGamingMonitor'
        };
        
        this.emit('trace_event', trace);
    }
    
    /**
     * Get session by player ID
     */
    getPlayerSession(playerId) {
        return this.sessions.get(playerId);
    }
    
    /**
     * Get intervention history for player
     */
    getPlayerInterventionHistory(playerId) {
        return this.interventionHistory.get(playerId) || [];
    }
    
    /**
     * Update player limits
     */
    updatePlayerLimits(playerId, limits) {
        const session = this.sessions.get(playerId);
        if (session) {
            session.selfImposedLimits = {
                ...session.selfImposedLimits,
                ...limits
            };
            
            this.debugLog('info', `Updated limits for player ${playerId}`);
            this.createTrace('limits_updated', { playerId, limits });
        }
    }
    
    /**
     * Initialize pattern detection (placeholder for AI integration)
     */
    initializePatternDetection() {
        console.log('🤖 Pattern detection system initialized');
        // This would connect to the AI pattern detector
    }
}

module.exports = ResponsibleGamingMonitor;

// If run directly, start monitor in demo mode
if (require.main === module) {
    const monitor = new ResponsibleGamingMonitor({
        debugMode: true
    });
    
    // Demo: Simulate a player session
    setTimeout(() => {
        console.log('\n📊 Demo: Simulating player session...\n');
        
        const playerId = 'demo_player_001';
        monitor.startPlayerSession(playerId, {
            balance: 1000,
            dailyLimit: 200,
            sessionTimeLimit: 2 * 60 * 60 * 1000 // 2 hours
        });
        
        // Simulate betting activity
        let betAmount = 10;
        let balance = 1000;
        
        const simulateActivity = setInterval(() => {
            // Random bet
            monitor.updatePlayerActivity(playerId, {
                type: 'bet',
                amount: betAmount,
                gameType: 'slots',
                odds: 0.95
            });
            
            // Random outcome
            if (Math.random() < 0.45) { // 45% win rate
                const winAmount = betAmount * (1 + Math.random() * 2);
                monitor.updatePlayerActivity(playerId, {
                    type: 'win',
                    amount: winAmount
                });
                balance += winAmount;
            } else {
                monitor.updatePlayerActivity(playerId, {
                    type: 'loss',
                    amount: betAmount
                });
                balance -= betAmount;
                
                // Simulate chasing losses
                if (balance < 800 && Math.random() < 0.3) {
                    betAmount = Math.min(betAmount * 1.5, 50);
                }
            }
            
            // Simulate deposits when low on funds
            if (balance < 100 && Math.random() < 0.2) {
                monitor.updatePlayerActivity(playerId, {
                    type: 'deposit',
                    amount: 100
                });
                balance += 100;
            }
            
        }, 2000); // Activity every 2 seconds
        
        // Stop simulation after 2 minutes
        setTimeout(() => {
            clearInterval(simulateActivity);
            monitor.endPlayerSession(playerId, 'demo_complete');
            console.log('\n✅ Demo completed\n');
        }, 120000);
        
    }, 2000);
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Responsible Gaming Monitor...');
        process.exit(0);
    });
}