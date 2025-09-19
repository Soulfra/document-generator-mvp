#!/usr/bin/env node

/**
 * Unified Credit Tracking Router
 * 
 * Consolidates all API credit tracking into one comprehensive system
 * Monitors usage across all services, provides real-time balance updates,
 * and automatically switches to cheaper providers when needed
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class UnifiedCreditTracker extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            lowBalanceThreshold: 5.00, // $5.00 USD
            criticalBalanceThreshold: 1.00, // $1.00 USD
            autoSwitchProviders: true,
            trackingInterval: 1000, // Check every second
            persistenceFile: './credit-tracking-state.json',
            auditLogFile: './credit-audit-log.jsonl',
            ...config
        };

        // Complete API pricing (USD per 1K tokens unless noted)
        this.apiPricing = {
            // OpenAI
            'openai:gpt-4': 0.03,
            'openai:gpt-4-32k': 0.06,
            'openai:gpt-3.5-turbo': 0.002,
            'openai:gpt-3.5-turbo-16k': 0.003,
            
            // Anthropic
            'anthropic:claude-3-opus': 0.075,
            'anthropic:claude-3-sonnet': 0.015,
            'anthropic:claude-3-haiku': 0.00025,
            'anthropic:claude-2.1': 0.008,
            'anthropic:claude-instant': 0.0008,
            
            // Google
            'google:gemini-pro': 0.0015,
            'google:gemini-pro-vision': 0.002,
            'google:palm-2': 0.001,
            
            // DeepSeek
            'deepseek:coder': 0.002,
            'deepseek:chat': 0.0015,
            
            // Local/Free
            'ollama:*': 0, // All Ollama models are free
            'local:*': 0,  // All local execution is free
            
            // Specialized
            'elevenlabs:voice': 0.22, // per 1K characters
            'stability:image': 0.002, // per image
            'midjourney:image': 0.01, // per image
            
            // Azure (usually slightly higher)
            'azure:gpt-4': 0.035,
            'azure:gpt-3.5-turbo': 0.0025
        };

        // Credit balance tracking
        this.creditState = {
            totalBalance: 100.00, // Starting balance in USD
            balanceByProvider: new Map(),
            usageHistory: [],
            lastUpdated: Date.now()
        };

        // Usage tracking
        this.usageTracking = {
            currentSession: {
                startTime: Date.now(),
                totalCost: 0,
                requestCount: 0,
                tokenCount: 0,
                providerBreakdown: new Map()
            },
            lifetime: {
                totalCost: 0,
                requestCount: 0,
                tokenCount: 0,
                startDate: Date.now()
            }
        };

        // Provider health and availability
        this.providerStatus = new Map();
        
        // Audit trail
        this.auditTrail = [];
        
        this.initialize();
    }

    async initialize() {
        console.log('💰 Initializing Unified Credit Tracker...');
        
        try {
            // Load persisted state
            await this.loadPersistedState();
            
            // Initialize provider statuses
            this.initializeProviderStatus();
            
            // Start monitoring
            this.startCreditMonitoring();
            
            // Setup auto-save
            this.setupAutoSave();
            
            console.log('✅ Credit Tracker initialized');
            console.log(`💳 Current balance: $${this.creditState.totalBalance.toFixed(2)}`);
            
            this.emit('initialized', {
                balance: this.creditState.totalBalance,
                providers: Array.from(this.providerStatus.keys())
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize credit tracker:', error);
            throw error;
        }
    }

    async trackAPICall(provider, model, tokens, metadata = {}) {
        const fullProvider = `${provider}:${model}`;
        const cost = this.calculateCost(fullProvider, tokens);
        
        const tracking = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            provider,
            model,
            fullProvider,
            tokens,
            cost,
            balance_before: this.creditState.totalBalance,
            balance_after: this.creditState.totalBalance - cost,
            metadata,
            session_id: this.usageTracking.currentSession.startTime
        };

        // Update balances
        this.creditState.totalBalance -= cost;
        this.creditState.lastUpdated = Date.now();

        // Update provider-specific balance
        const providerBalance = this.creditState.balanceByProvider.get(provider) || 0;
        this.creditState.balanceByProvider.set(provider, providerBalance + cost);

        // Update usage tracking
        this.usageTracking.currentSession.totalCost += cost;
        this.usageTracking.currentSession.requestCount++;
        this.usageTracking.currentSession.tokenCount += tokens;
        
        const sessionProvider = this.usageTracking.currentSession.providerBreakdown.get(provider) || {
            cost: 0, requests: 0, tokens: 0
        };
        sessionProvider.cost += cost;
        sessionProvider.requests++;
        sessionProvider.tokens += tokens;
        this.usageTracking.currentSession.providerBreakdown.set(provider, sessionProvider);

        // Lifetime tracking
        this.usageTracking.lifetime.totalCost += cost;
        this.usageTracking.lifetime.requestCount++;
        this.usageTracking.lifetime.tokenCount += tokens;

        // Add to usage history
        this.creditState.usageHistory.push(tracking);
        if (this.creditState.usageHistory.length > 1000) {
            this.creditState.usageHistory.shift(); // Keep last 1000 entries
        }

        // Audit trail
        await this.addAuditEntry({
            type: 'api_call',
            ...tracking
        });

        // Check balance thresholds
        this.checkBalanceThresholds();

        // Emit events
        this.emit('api_call_tracked', tracking);
        this.emit('balance_updated', {
            total: this.creditState.totalBalance,
            change: -cost,
            provider
        });

        return tracking;
    }

    calculateCost(fullProvider, tokens) {
        // Check exact match first
        if (this.apiPricing[fullProvider]) {
            return (tokens / 1000) * this.apiPricing[fullProvider];
        }

        // Check wildcard matches
        for (const [pattern, price] of Object.entries(this.apiPricing)) {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace('*', '.*'));
                if (regex.test(fullProvider)) {
                    return (tokens / 1000) * price;
                }
            }
        }

        // Default to a conservative estimate
        console.warn(`⚠️ Unknown provider: ${fullProvider}, using default pricing`);
        return (tokens / 1000) * 0.01; // $0.01 per 1K tokens default
    }

    async selectOptimalProvider(requiredCapability = 'text', preferenceOrder = []) {
        const availableProviders = [];

        // Get all available providers with their costs
        for (const [provider, status] of this.providerStatus) {
            if (status.available && status.capabilities.includes(requiredCapability)) {
                const costPer1K = this.getProviderCost(provider);
                availableProviders.push({
                    provider,
                    cost: costPer1K,
                    latency: status.avgLatency,
                    reliability: status.reliability,
                    score: this.calculateProviderScore(provider, costPer1K, status)
                });
            }
        }

        // Sort by score (higher is better)
        availableProviders.sort((a, b) => b.score - a.score);

        // Apply preference order if provided
        if (preferenceOrder.length > 0) {
            availableProviders.sort((a, b) => {
                const aIndex = preferenceOrder.indexOf(a.provider);
                const bIndex = preferenceOrder.indexOf(b.provider);
                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return 0;
            });
        }

        // Check if we need to switch to cheaper providers
        if (this.config.autoSwitchProviders && this.creditState.totalBalance < this.config.lowBalanceThreshold) {
            // Prioritize free/cheap providers when balance is low
            availableProviders.sort((a, b) => a.cost - b.cost);
        }

        return availableProviders[0] || null;
    }

    calculateProviderScore(provider, cost, status) {
        // Score based on cost, latency, and reliability
        const costScore = cost === 0 ? 100 : 50 / (cost + 1);
        const latencyScore = 100 / (status.avgLatency / 100 + 1);
        const reliabilityScore = status.reliability * 100;

        // Weighted average
        return (costScore * 0.4) + (latencyScore * 0.3) + (reliabilityScore * 0.3);
    }

    getProviderCost(provider) {
        // Get average cost for a provider
        const providerPrices = Object.entries(this.apiPricing)
            .filter(([key]) => key.startsWith(provider + ':'))
            .map(([_, price]) => price);

        if (providerPrices.length === 0) return 0.01; // Default
        return providerPrices.reduce((a, b) => a + b) / providerPrices.length;
    }

    checkBalanceThresholds() {
        if (this.creditState.totalBalance <= this.config.criticalBalanceThreshold) {
            console.error(`🚨 CRITICAL: Balance below $${this.config.criticalBalanceThreshold}`);
            this.emit('balance_critical', {
                balance: this.creditState.totalBalance,
                threshold: this.config.criticalBalanceThreshold
            });
        } else if (this.creditState.totalBalance <= this.config.lowBalanceThreshold) {
            console.warn(`⚠️ WARNING: Balance below $${this.config.lowBalanceThreshold}`);
            this.emit('balance_low', {
                balance: this.creditState.totalBalance,
                threshold: this.config.lowBalanceThreshold
            });
        }
    }

    async addCredits(amount, source = 'manual', reference = null) {
        const oldBalance = this.creditState.totalBalance;
        this.creditState.totalBalance += amount;
        
        const transaction = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'credit',
            amount,
            source,
            reference,
            balance_before: oldBalance,
            balance_after: this.creditState.totalBalance
        };

        await this.addAuditEntry({
            type: 'credit_added',
            ...transaction
        });

        this.emit('credits_added', transaction);
        this.emit('balance_updated', {
            total: this.creditState.totalBalance,
            change: amount,
            source
        });

        console.log(`💵 Added $${amount.toFixed(2)} credits (${source})`);
        console.log(`💳 New balance: $${this.creditState.totalBalance.toFixed(2)}`);

        return transaction;
    }

    getUsageReport(timeframe = 'session') {
        const report = {
            timeframe,
            generated_at: new Date().toISOString()
        };

        switch (timeframe) {
            case 'session':
                report.data = {
                    ...this.usageTracking.currentSession,
                    duration: Date.now() - this.usageTracking.currentSession.startTime,
                    providers: Object.fromEntries(this.usageTracking.currentSession.providerBreakdown)
                };
                break;
                
            case 'lifetime':
                report.data = {
                    ...this.usageTracking.lifetime,
                    duration: Date.now() - this.usageTracking.lifetime.startDate,
                    average_cost_per_request: this.usageTracking.lifetime.totalCost / 
                                             this.usageTracking.lifetime.requestCount
                };
                break;
                
            case 'last_24h':
                const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
                const last24h = this.creditState.usageHistory.filter(u => u.timestamp > dayAgo);
                report.data = {
                    totalCost: last24h.reduce((sum, u) => sum + u.cost, 0),
                    requestCount: last24h.length,
                    tokenCount: last24h.reduce((sum, u) => sum + u.tokens, 0),
                    providers: this.aggregateProviderUsage(last24h)
                };
                break;
        }

        report.current_balance = this.creditState.totalBalance;
        report.burn_rate = this.calculateBurnRate();
        report.estimated_depletion = this.estimateDepletion();

        return report;
    }

    calculateBurnRate() {
        // Calculate burn rate per hour based on last hour of usage
        const hourAgo = Date.now() - 60 * 60 * 1000;
        const lastHour = this.creditState.usageHistory.filter(u => u.timestamp > hourAgo);
        
        if (lastHour.length === 0) return 0;
        
        const totalCost = lastHour.reduce((sum, u) => sum + u.cost, 0);
        return totalCost; // Cost per hour
    }

    estimateDepletion() {
        const burnRate = this.calculateBurnRate();
        if (burnRate === 0) return null;
        
        const hoursRemaining = this.creditState.totalBalance / burnRate;
        const depletionTime = new Date(Date.now() + hoursRemaining * 60 * 60 * 1000);
        
        return {
            hours_remaining: hoursRemaining,
            depletion_time: depletionTime.toISOString(),
            burn_rate_per_hour: burnRate
        };
    }

    aggregateProviderUsage(usageList) {
        const aggregate = {};
        
        for (const usage of usageList) {
            if (!aggregate[usage.provider]) {
                aggregate[usage.provider] = {
                    cost: 0,
                    requests: 0,
                    tokens: 0
                };
            }
            
            aggregate[usage.provider].cost += usage.cost;
            aggregate[usage.provider].requests++;
            aggregate[usage.provider].tokens += usage.tokens;
        }
        
        return aggregate;
    }

    initializeProviderStatus() {
        const providers = ['openai', 'anthropic', 'google', 'deepseek', 'ollama', 'azure'];
        
        for (const provider of providers) {
            this.providerStatus.set(provider, {
                available: true,
                lastCheck: Date.now(),
                avgLatency: 100,
                reliability: 1.0,
                capabilities: this.getProviderCapabilities(provider),
                errors: 0,
                consecutiveErrors: 0
            });
        }
    }

    getProviderCapabilities(provider) {
        const capabilities = {
            'openai': ['text', 'code', 'function', 'vision', 'audio'],
            'anthropic': ['text', 'code', 'analysis', 'vision'],
            'google': ['text', 'code', 'vision', 'multimodal'],
            'deepseek': ['text', 'code'],
            'ollama': ['text', 'code'],
            'azure': ['text', 'code', 'function', 'vision']
        };
        
        return capabilities[provider] || ['text'];
    }

    startCreditMonitoring() {
        this.monitoringInterval = setInterval(() => {
            // Update provider health
            this.updateProviderHealth();
            
            // Check for stale sessions
            const sessionAge = Date.now() - this.usageTracking.currentSession.startTime;
            if (sessionAge > 24 * 60 * 60 * 1000) { // 24 hours
                this.resetSession();
            }
            
            // Emit periodic status
            this.emit('status_update', {
                balance: this.creditState.totalBalance,
                session_cost: this.usageTracking.currentSession.totalCost,
                burn_rate: this.calculateBurnRate(),
                providers_available: Array.from(this.providerStatus.entries())
                    .filter(([_, status]) => status.available)
                    .map(([provider]) => provider)
            });
            
        }, this.config.trackingInterval);
    }

    updateProviderHealth() {
        // This would normally check actual provider endpoints
        // For now, simulate with random health updates
        for (const [provider, status] of this.providerStatus) {
            if (Math.random() < 0.01) { // 1% chance of status change
                status.available = !status.available;
                console.log(`Provider ${provider} is now ${status.available ? 'available' : 'unavailable'}`);
            }
        }
    }

    resetSession() {
        console.log('📊 Resetting session tracking');
        
        this.usageTracking.currentSession = {
            startTime: Date.now(),
            totalCost: 0,
            requestCount: 0,
            tokenCount: 0,
            providerBreakdown: new Map()
        };
        
        this.emit('session_reset');
    }

    async addAuditEntry(entry) {
        const auditEntry = {
            ...entry,
            timestamp: entry.timestamp || Date.now(),
            id: entry.id || crypto.randomUUID()
        };
        
        this.auditTrail.push(auditEntry);
        
        // Write to audit log file
        try {
            await fs.appendFile(
                this.config.auditLogFile,
                JSON.stringify(auditEntry) + '\n'
            );
        } catch (error) {
            console.error('Failed to write audit log:', error);
        }
        
        // Keep audit trail size manageable in memory
        if (this.auditTrail.length > 10000) {
            this.auditTrail = this.auditTrail.slice(-5000);
        }
    }

    async loadPersistedState() {
        try {
            const data = await fs.readFile(this.config.persistenceFile, 'utf8');
            const saved = JSON.parse(data);
            
            this.creditState = {
                ...this.creditState,
                ...saved.creditState,
                balanceByProvider: new Map(saved.creditState.balanceByProvider),
                lastUpdated: Date.now()
            };
            
            this.usageTracking.lifetime = saved.lifetime || this.usageTracking.lifetime;
            
            console.log('📂 Loaded persisted credit state');
        } catch (error) {
            console.log('📝 No persisted state found, starting fresh');
        }
    }

    async saveState() {
        const stateToSave = {
            creditState: {
                ...this.creditState,
                balanceByProvider: Array.from(this.creditState.balanceByProvider.entries())
            },
            lifetime: this.usageTracking.lifetime,
            saved_at: new Date().toISOString()
        };
        
        try {
            await fs.writeFile(
                this.config.persistenceFile,
                JSON.stringify(stateToSave, null, 2)
            );
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    setupAutoSave() {
        // Save state every minute
        setInterval(() => {
            this.saveState();
        }, 60000);
        
        // Save on exit
        process.on('SIGINT', async () => {
            console.log('\n💾 Saving credit state before exit...');
            await this.saveState();
            process.exit(0);
        });
    }

    getStatus() {
        return {
            balance: {
                total: this.creditState.totalBalance,
                by_provider: Object.fromEntries(this.creditState.balanceByProvider),
                last_updated: new Date(this.creditState.lastUpdated).toISOString()
            },
            session: {
                ...this.usageTracking.currentSession,
                duration: Date.now() - this.usageTracking.currentSession.startTime,
                providers: Object.fromEntries(this.usageTracking.currentSession.providerBreakdown)
            },
            lifetime: this.usageTracking.lifetime,
            providers: Object.fromEntries(
                Array.from(this.providerStatus.entries()).map(([name, status]) => [
                    name,
                    {
                        ...status,
                        cost_per_1k: this.getProviderCost(name)
                    }
                ])
            ),
            thresholds: {
                low_balance: this.config.lowBalanceThreshold,
                critical_balance: this.config.criticalBalanceThreshold
            },
            burn_rate: this.calculateBurnRate(),
            estimated_depletion: this.estimateDepletion()
        };
    }
}

// Example usage and testing
if (require.main === module) {
    const tracker = new UnifiedCreditTracker();
    
    tracker.on('initialized', async (data) => {
        console.log('\n📊 Credit Tracker Status:');
        console.log(JSON.stringify(tracker.getStatus(), null, 2));
        
        // Simulate some API calls
        console.log('\n🧪 Simulating API usage...\n');
        
        await tracker.trackAPICall('openai', 'gpt-4', 1500, { purpose: 'code_generation' });
        await tracker.trackAPICall('anthropic', 'claude-3-opus', 2000, { purpose: 'analysis' });
        await tracker.trackAPICall('ollama', 'codellama', 5000, { purpose: 'local_test' });
        
        // Get usage report
        console.log('\n📈 Session Usage Report:');
        console.log(JSON.stringify(tracker.getUsageReport('session'), null, 2));
        
        // Select optimal provider
        const optimal = await tracker.selectOptimalProvider('code');
        console.log('\n🎯 Optimal provider for code:', optimal);
        
        // Add some credits
        await tracker.addCredits(10.00, 'test_deposit', 'TEST-123');
        
        // Final status
        console.log('\n📊 Final Status:');
        console.log(JSON.stringify(tracker.getStatus(), null, 2));
    });
    
    tracker.on('balance_low', (data) => {
        console.warn('\n⚠️ Low balance alert:', data);
    });
    
    tracker.on('balance_critical', (data) => {
        console.error('\n🚨 Critical balance alert:', data);
    });
}

module.exports = UnifiedCreditTracker;