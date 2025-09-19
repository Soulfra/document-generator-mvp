#!/usr/bin/env node

/**
 * 🚨📊 PERSONAL USAGE LIMIT MONITOR
 * 
 * Addresses immediate timing and limit tracking issues:
 * - Tracks YOUR specific Claude usage patterns
 * - Fixes 7am vs 9pm timezone confusion  
 * - Real-time warnings at 80%, 90%, 95% of daily limit
 * - Integrates with existing architecture for unified monitoring
 * - Prevents unexpected cutoffs during critical work
 * 
 * "basically so we know when we're getting close to our limits"
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class PersonalUsageLimitMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // User-specific settings (customize for your usage patterns)
            userId: options.userId || 'matthew_mauer_primary',
            timezone: options.timezone || 'America/Chicago', // Fix timezone confusion
            
            // Limit thresholds and warnings
            dailyTokenLimit: options.dailyTokenLimit || 200000, // Adjust based on your tier
            warningThresholds: {
                moderate: 0.80,  // 80% - "Getting close, pace yourself"
                high: 0.90,      // 90% - "Slow down, critical work only"  
                critical: 0.95   // 95% - "STOP - save remaining for emergencies"
            },
            
            // Timing and reset behavior
            limitResetHour: options.limitResetHour || 21, // 9 PM in your timezone, not 7 AM
            limitResetMinute: options.limitResetMinute || 0,
            checkInterval: options.checkInterval || 60000, // Check every minute
            
            // Integration settings
            dashboardPort: options.dashboardPort || 3333,
            electronIntegration: options.electronIntegration !== false,
            notificationSound: options.notificationSound || true,
            
            // Storage and persistence
            dataDir: options.dataDir || path.join(__dirname, 'usage-monitoring'),
            retainDays: options.retainDays || 30,
            
            // Advanced features
            predictiveModeEnabled: options.predictiveModeEnabled || true,
            learningModeEnabled: options.learningModeEnabled || true,
            
            ...options
        };
        
        // Current session tracking
        this.currentUsage = {
            tokensUsed: 0,
            requestsMade: 0,
            sessionStart: Date.now(),
            lastActivity: Date.now(),
            currentStreak: 0, // Consecutive days of hitting limits
            
            // Detailed breakdown
            breakdown: {
                codeGeneration: 0,
                documentation: 0,
                debugging: 0,
                planning: 0,
                research: 0,
                other: 0
            }
        };
        
        // Historical data and patterns
        this.usageHistory = new Map(); // Daily usage records
        this.patterns = {
            peakHours: [], // Hours when you use most tokens
            averageDailyUsage: 0,
            maxDailyUsage: 0,
            usageByDay: new Map(), // Day of week patterns
            projectPhaseImpact: new Map() // How different project phases affect usage
        };
        
        // Warning and alert state
        this.alertState = {
            currentLevel: 'normal',
            lastWarning: null,
            warningsToday: 0,
            behaviorModified: false,
            emergencyModeActive: false
        };
        
        // Predictive analytics
        this.predictions = {
            projectedDailyUsage: 0,
            timeToLimit: null,
            riskLevel: 'low',
            recommendedActions: []
        };
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🚨 Initializing Personal Usage Limit Monitor...');
            
            // Create data directory
            await fs.mkdir(this.config.dataDir, { recursive: true });
            
            // Load historical data
            await this.loadUsageHistory();
            
            // Load today's usage
            await this.loadTodaysUsage();
            
            // Start monitoring loops
            this.startMonitoringLoop();
            this.startDailyReset();
            
            // Analyze patterns
            await this.analyzeUsagePatterns();
            
            // Initial status check
            this.performLimitCheck();
            
            console.log('✅ Personal Usage Limit Monitor active');
            console.log(`📊 Current usage: ${this.currentUsage.tokensUsed.toLocaleString()} / ${this.config.dailyTokenLimit.toLocaleString()} tokens`);
            console.log(`⏰ Next reset: ${this.getNextResetTime().toLocaleString()}`);
            console.log(`🎯 Current status: ${this.alertState.currentLevel.toUpperCase()}`);
            
            this.emit('monitor_initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize usage monitor:', error.message);
            this.emit('monitor_error', error);
        }
    }
    
    /**
     * Record usage from a Claude interaction
     */
    async recordUsage(interactionData) {
        const {
            tokensUsed = 0,
            requestType = 'other',
            projectPhase = 'development',
            urgency = 'normal',
            description = ''
        } = interactionData;
        
        // Update current usage
        this.currentUsage.tokensUsed += tokensUsed;
        this.currentUsage.requestsMade += 1;
        this.currentUsage.lastActivity = Date.now();
        
        // Categorize usage
        if (this.currentUsage.breakdown[requestType] !== undefined) {
            this.currentUsage.breakdown[requestType] += tokensUsed;
        } else {
            this.currentUsage.breakdown.other += tokensUsed;
        }
        
        // Record detailed interaction
        const interaction = {
            timestamp: Date.now(),
            tokensUsed,
            requestType,
            projectPhase,
            urgency,
            description,
            dailyTotal: this.currentUsage.tokensUsed,
            percentageUsed: (this.currentUsage.tokensUsed / this.config.dailyTokenLimit) * 100
        };
        
        await this.saveInteraction(interaction);
        
        // Check limits and warnings
        this.performLimitCheck();
        
        // Update predictions
        if (this.config.predictiveModeEnabled) {
            this.updatePredictions();
        }
        
        // Learn from usage pattern
        if (this.config.learningModeEnabled) {
            this.learnFromUsage(interaction);
        }
        
        console.log(`📝 Usage recorded: ${tokensUsed.toLocaleString()} tokens (${this.getUsagePercentage().toFixed(1)}% of daily limit)`);
        
        this.emit('usage_recorded', interaction);
        
        return interaction;
    }
    
    /**
     * Perform limit checking and issue warnings
     */
    performLimitCheck() {
        const usagePercentage = this.getUsagePercentage();
        const currentHour = new Date().getHours();
        
        // Determine alert level
        let newAlertLevel = 'normal';
        let warningMessage = '';
        let recommendedActions = [];
        
        if (usagePercentage >= this.config.warningThresholds.critical * 100) {
            newAlertLevel = 'critical';
            warningMessage = `🚨 CRITICAL: ${usagePercentage.toFixed(1)}% of daily limit used! STOP non-essential activities!`;
            recommendedActions = [
                'Save current work immediately',
                'Complete only critical tasks', 
                'Consider switching to local tools',
                'Plan remaining work for tomorrow'
            ];
            
            // Activate emergency mode
            this.alertState.emergencyModeActive = true;
            
        } else if (usagePercentage >= this.config.warningThresholds.high * 100) {
            newAlertLevel = 'high';
            warningMessage = `⚠️ HIGH: ${usagePercentage.toFixed(1)}% of daily limit used. Slow down significantly.`;
            recommendedActions = [
                'Prioritize only essential tasks',
                'Use shorter, more focused prompts',
                'Consider batching similar requests',
                'Prepare for potential limit hit'
            ];
            
        } else if (usagePercentage >= this.config.warningThresholds.moderate * 100) {
            newAlertLevel = 'moderate';
            warningMessage = `⚡ MODERATE: ${usagePercentage.toFixed(1)}% of daily limit used. Pace yourself.`;
            recommendedActions = [
                'Be more mindful of token usage',
                'Focus on high-value tasks',
                'Consider using templates where possible',
                'Monitor usage more frequently'
            ];
        }
        
        // Issue warning if alert level changed
        if (newAlertLevel !== this.alertState.currentLevel && newAlertLevel !== 'normal') {
            this.issueWarning(newAlertLevel, warningMessage, recommendedActions);
        }
        
        this.alertState.currentLevel = newAlertLevel;
        this.predictions.recommendedActions = recommendedActions;
        
        // Check for timezone-related issues
        this.checkTimezoneIssues();
    }
    
    /**
     * Issue a warning with notification
     */
    issueWarning(level, message, actions) {
        const warning = {
            level,
            message,
            actions,
            timestamp: Date.now(),
            usageAtWarning: this.currentUsage.tokensUsed,
            percentageAtWarning: this.getUsagePercentage()
        };
        
        console.log('\n' + '='.repeat(60));
        console.log(`🚨 USAGE LIMIT WARNING - ${level.toUpperCase()}`);
        console.log('='.repeat(60));
        console.log(message);
        console.log(`📊 Tokens used: ${this.currentUsage.tokensUsed.toLocaleString()} / ${this.config.dailyTokenLimit.toLocaleString()}`);
        console.log(`⏰ Time until reset: ${this.getTimeUntilReset()}`);
        
        if (actions.length > 0) {
            console.log(`\n💡 Recommended actions:`);
            actions.forEach((action, i) => {
                console.log(`   ${i + 1}. ${action}`);
            });
        }
        
        console.log('='.repeat(60) + '\n');
        
        // Play notification sound if enabled
        if (this.config.notificationSound) {
            this.playNotificationSound(level);
        }
        
        // Send to dashboard if integration enabled
        if (this.config.electronIntegration) {
            this.sendToDashboard('usage_warning', warning);
        }
        
        this.alertState.lastWarning = warning;
        this.alertState.warningsToday++;
        
        this.emit('usage_warning', warning);
    }
    
    /**
     * Check for timezone-related issues
     */
    checkTimezoneIssues() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Check if we're near the supposed reset time but usage hasn't reset
        if (currentHour === 7 && this.currentUsage.tokensUsed > 0) {
            console.warn('⚠️ TIMEZONE ISSUE DETECTED: Usage not reset at 7 AM - limits likely reset at 9 PM');
            
            const timezoneIssue = {
                detected: true,
                currentTime: now.toISOString(),
                suspectedResetTime: '21:00 (9 PM)',
                message: 'Claude limits appear to reset at 9 PM, not 7 AM'
            };
            
            this.emit('timezone_issue_detected', timezoneIssue);
        }
    }
    
    /**
     * Update predictive analytics
     */
    updatePredictions() {
        const currentTime = Date.now();
        const sessionDuration = currentTime - this.currentUsage.sessionStart;
        const hoursElapsed = sessionDuration / (1000 * 60 * 60);
        
        if (hoursElapsed > 0) {
            // Project daily usage based on current rate
            const tokensPerHour = this.currentUsage.tokensUsed / hoursElapsed;
            const hoursUntilReset = this.getHoursUntilReset();
            
            this.predictions.projectedDailyUsage = this.currentUsage.tokensUsed + (tokensPerHour * hoursUntilReset);
            
            // Calculate time to limit
            const remainingTokens = this.config.dailyTokenLimit - this.currentUsage.tokensUsed;
            if (tokensPerHour > 0) {
                const hoursToLimit = remainingTokens / tokensPerHour;
                this.predictions.timeToLimit = new Date(currentTime + (hoursToLimit * 60 * 60 * 1000));
            }
            
            // Determine risk level
            const projectedPercentage = (this.predictions.projectedDailyUsage / this.config.dailyTokenLimit) * 100;
            
            if (projectedPercentage >= 100) {
                this.predictions.riskLevel = 'high';
            } else if (projectedPercentage >= 90) {
                this.predictions.riskLevel = 'medium';
            } else {
                this.predictions.riskLevel = 'low';
            }
        }
    }
    
    /**
     * Learn from usage patterns
     */
    learnFromUsage(interaction) {
        const hour = new Date(interaction.timestamp).getHours();
        const dayOfWeek = new Date(interaction.timestamp).getDay();
        
        // Update peak hours
        if (!this.patterns.peakHours[hour]) {
            this.patterns.peakHours[hour] = 0;
        }
        this.patterns.peakHours[hour] += interaction.tokensUsed;
        
        // Update day of week patterns
        if (!this.patterns.usageByDay.has(dayOfWeek)) {
            this.patterns.usageByDay.set(dayOfWeek, 0);
        }
        this.patterns.usageByDay.set(dayOfWeek, this.patterns.usageByDay.get(dayOfWeek) + interaction.tokensUsed);
        
        // Update project phase impact
        if (!this.patterns.projectPhaseImpact.has(interaction.projectPhase)) {
            this.patterns.projectPhaseImpact.set(interaction.projectPhase, []);
        }
        this.patterns.projectPhaseImpact.get(interaction.projectPhase).push(interaction.tokensUsed);
    }
    
    /**
     * Get comprehensive usage status
     */
    getUsageStatus() {
        return {
            current: {
                tokensUsed: this.currentUsage.tokensUsed,
                requestsMade: this.currentUsage.requestsMade,
                percentageUsed: this.getUsagePercentage(),
                breakdown: { ...this.currentUsage.breakdown }
            },
            
            timing: {
                sessionStart: this.currentUsage.sessionStart,
                lastActivity: this.currentUsage.lastActivity,
                nextReset: this.getNextResetTime(),
                timeUntilReset: this.getTimeUntilReset(),
                hoursUntilReset: this.getHoursUntilReset()
            },
            
            alerts: {
                currentLevel: this.alertState.currentLevel,
                emergencyMode: this.alertState.emergencyModeActive,
                warningsToday: this.alertState.warningsToday,
                lastWarning: this.alertState.lastWarning
            },
            
            predictions: { ...this.predictions },
            
            limits: {
                dailyLimit: this.config.dailyTokenLimit,
                remaining: this.config.dailyTokenLimit - this.currentUsage.tokensUsed,
                warningThresholds: this.config.warningThresholds
            }
        };
    }
    
    // Utility methods
    getUsagePercentage() {
        return (this.currentUsage.tokensUsed / this.config.dailyTokenLimit) * 100;
    }
    
    getNextResetTime() {
        const now = new Date();
        const resetTime = new Date();
        resetTime.setHours(this.config.limitResetHour, this.config.limitResetMinute, 0, 0);
        
        if (now > resetTime) {
            resetTime.setDate(resetTime.getDate() + 1);
        }
        
        return resetTime;
    }
    
    getTimeUntilReset() {
        const now = new Date();
        const resetTime = this.getNextResetTime();
        const diff = resetTime.getTime() - now.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }
    
    getHoursUntilReset() {
        const now = new Date();
        const resetTime = this.getNextResetTime();
        const diff = resetTime.getTime() - now.getTime();
        return diff / (1000 * 60 * 60);
    }
    
    // File operations
    async loadUsageHistory() {
        try {
            const historyFile = path.join(this.config.dataDir, 'usage-history.json');
            const data = await fs.readFile(historyFile, 'utf8');
            const history = JSON.parse(data);
            
            for (const [date, usage] of Object.entries(history)) {
                this.usageHistory.set(date, usage);
            }
            
            console.log(`📚 Loaded ${this.usageHistory.size} days of usage history`);
        } catch (error) {
            console.log('📚 Starting with empty usage history');
        }
    }
    
    async loadTodaysUsage() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const todayFile = path.join(this.config.dataDir, `usage-${today}.json`);
            const data = await fs.readFile(todayFile, 'utf8');
            const todayUsage = JSON.parse(data);
            
            this.currentUsage = { ...this.currentUsage, ...todayUsage.current };
            
            console.log(`📅 Loaded today's usage: ${this.currentUsage.tokensUsed.toLocaleString()} tokens`);
        } catch (error) {
            console.log('📅 Starting fresh day');
        }
    }
    
    async saveInteraction(interaction) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const todayFile = path.join(this.config.dataDir, `usage-${today}.json`);
            
            let todayData = { interactions: [], current: this.currentUsage };
            
            try {
                const existing = await fs.readFile(todayFile, 'utf8');
                todayData = JSON.parse(existing);
            } catch (error) {
                // File doesn't exist, use default
            }
            
            todayData.interactions.push(interaction);
            todayData.current = this.currentUsage;
            
            await fs.writeFile(todayFile, JSON.stringify(todayData, null, 2));
        } catch (error) {
            console.error('Failed to save interaction:', error.message);
        }
    }
    
    async saveUsageHistory() {
        try {
            const historyFile = path.join(this.config.dataDir, 'usage-history.json');
            const historyObject = Object.fromEntries(this.usageHistory.entries());
            await fs.writeFile(historyFile, JSON.stringify(historyObject, null, 2));
        } catch (error) {
            console.error('Failed to save usage history:', error.message);
        }
    }
    
    // Monitoring loops
    startMonitoringLoop() {
        setInterval(() => {
            this.performLimitCheck();
        }, this.config.checkInterval);
    }
    
    startDailyReset() {
        const checkResetTime = () => {
            const now = new Date();
            const isResetTime = now.getHours() === this.config.limitResetHour && 
                               now.getMinutes() === this.config.limitResetMinute;
            
            if (isResetTime) {
                this.performDailyReset();
            }
        };
        
        // Check every minute
        setInterval(checkResetTime, 60000);
    }
    
    async performDailyReset() {
        console.log('🔄 Performing daily usage reset...');
        
        // Save today's final usage to history
        const today = new Date().toISOString().split('T')[0];
        this.usageHistory.set(today, { ...this.currentUsage });
        
        // Reset current usage
        const previousUsage = this.currentUsage.tokensUsed;
        
        this.currentUsage = {
            tokensUsed: 0,
            requestsMade: 0,
            sessionStart: Date.now(),
            lastActivity: Date.now(),
            currentStreak: previousUsage >= this.config.dailyTokenLimit ? this.currentUsage.currentStreak + 1 : 0,
            breakdown: {
                codeGeneration: 0,
                documentation: 0,
                debugging: 0,
                planning: 0,
                research: 0,
                other: 0
            }
        };
        
        // Reset alert state
        this.alertState = {
            currentLevel: 'normal',
            lastWarning: null,
            warningsToday: 0,
            behaviorModified: false,
            emergencyModeActive: false
        };
        
        // Save history
        await this.saveUsageHistory();
        
        console.log('✅ Daily reset complete');
        console.log(`📊 Previous day usage: ${previousUsage.toLocaleString()} tokens`);
        
        this.emit('daily_reset', { previousUsage, currentStreak: this.currentUsage.currentStreak });
    }
    
    // Integration methods
    playNotificationSound(level) {
        // Platform-specific notification sound logic
        if (process.platform === 'darwin') {
            const { exec } = require('child_process');
            const sounds = {
                moderate: 'Ping',
                high: 'Basso', 
                critical: 'Sosumi'
            };
            exec(`afplay /System/Library/Sounds/${sounds[level] || 'Ping'}.aiff`);
        }
    }
    
    sendToDashboard(eventType, data) {
        // Send notification to electron dashboard
        this.emit('dashboard_notification', {
            type: eventType,
            data,
            timestamp: Date.now()
        });
    }
    
    async analyzeUsagePatterns() {
        if (this.usageHistory.size < 7) return; // Need at least a week of data
        
        const usageValues = Array.from(this.usageHistory.values()).map(day => day.tokensUsed);
        
        this.patterns.averageDailyUsage = usageValues.reduce((a, b) => a + b, 0) / usageValues.length;
        this.patterns.maxDailyUsage = Math.max(...usageValues);
        
        console.log(`📊 Usage patterns analyzed: avg ${this.patterns.averageDailyUsage.toFixed(0)} tokens/day`);
    }
}

// CLI interface and testing
if (require.main === module) {
    const monitor = new PersonalUsageLimitMonitor({
        userId: 'matthew_mauer_primary',
        timezone: 'America/Chicago',
        limitResetHour: 21, // 9 PM
        dailyTokenLimit: 200000
    });
    
    // Event listeners for testing
    monitor.on('usage_warning', (warning) => {
        console.log(`⚠️ WARNING ISSUED: ${warning.level}`);
    });
    
    monitor.on('daily_reset', (data) => {
        console.log(`🔄 DAILY RESET: Previous usage ${data.previousUsage} tokens`);
    });
    
    monitor.on('timezone_issue_detected', (issue) => {
        console.log(`⏰ TIMEZONE ISSUE: ${issue.message}`);
    });
    
    // Test usage recording
    setTimeout(async () => {
        console.log('\n🧪 Testing usage recording...');
        
        await monitor.recordUsage({
            tokensUsed: 5000,
            requestType: 'codeGeneration',
            projectPhase: 'development',
            description: 'Testing usage monitor'
        });
        
        const status = monitor.getUsageStatus();
        console.log('\n📊 Current Status:');
        console.log(`Tokens used: ${status.current.tokensUsed.toLocaleString()}`);
        console.log(`Percentage: ${status.current.percentageUsed.toFixed(2)}%`);
        console.log(`Time until reset: ${status.timing.timeUntilReset}`);
        console.log(`Alert level: ${status.alerts.currentLevel}`);
        
    }, 2000);
}

module.exports = PersonalUsageLimitMonitor;