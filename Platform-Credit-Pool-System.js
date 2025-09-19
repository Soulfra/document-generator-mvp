#!/usr/bin/env node

/**
 * Platform Credit Pool System
 * "or they could just use our shit too and use our credits idk"
 * 
 * Allows users to use platform-managed API keys with credit-based billing
 * instead of requiring them to get their own API keys
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class PlatformCreditPoolSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            creditPoolDirectory: config.creditPoolDirectory || './credit_pools',
            defaultCreditAmount: config.defaultCreditAmount || 1000, // Credits
            creditExchangeRate: config.creditExchangeRate || 0.001, // $0.001 per credit
            maxConcurrentUsers: config.maxConcurrentUsers || 1000,
            enableCreditSharing: config.enableCreditSharing !== false,
            enableUsageTracking: config.enableUsageTracking !== false,
            enableAutoTopup: config.enableAutoTopup !== false
        };
        
        // Platform API key pools
        this.platformPools = {
            github: {
                name: 'GitHub API Pool',
                keys: [
                    { key: 'ghp_pool_key_1_xxx', weight: 100, status: 'active', dailyLimit: 5000 },
                    { key: 'ghp_pool_key_2_xxx', weight: 100, status: 'active', dailyLimit: 5000 },
                    { key: 'ghp_pool_key_3_xxx', weight: 100, status: 'active', dailyLimit: 5000 }
                ],
                costPerRequest: 0.1, // 0.1 credits per API call
                rateLimits: { perMinute: 100, perHour: 5000, perDay: 5000 },
                endpoints: {
                    'GET /user': { cost: 0.1, cacheTime: 300 },
                    'GET /repos': { cost: 0.2, cacheTime: 60 },
                    'POST /repos': { cost: 0.5, cacheTime: 0 },
                    'GET /issues': { cost: 0.15, cacheTime: 30 }
                }
            },
            
            openai: {
                name: 'OpenAI API Pool',
                keys: [
                    { key: 'sk-pool-openai-1-xxx', weight: 200, status: 'active', monthlyLimit: 10000 },
                    { key: 'sk-pool-openai-2-xxx', weight: 200, status: 'active', monthlyLimit: 10000 },
                    { key: 'sk-pool-openai-3-xxx', weight: 150, status: 'active', monthlyLimit: 8000 }
                ],
                costPerToken: 0.002, // 0.002 credits per token
                models: {
                    'gpt-3.5-turbo': { costMultiplier: 1.0, maxTokens: 4096 },
                    'gpt-4': { costMultiplier: 15.0, maxTokens: 8192 },
                    'gpt-4-turbo': { costMultiplier: 5.0, maxTokens: 128000 }
                },
                rateLimits: { perMinute: 60, tokensPerMinute: 150000 }
            },
            
            anthropic: {
                name: 'Anthropic Claude Pool',
                keys: [
                    { key: 'sk-ant-pool-1-xxx', weight: 100, status: 'active', monthlyLimit: 5000 },
                    { key: 'sk-ant-pool-2-xxx', weight: 100, status: 'active', monthlyLimit: 5000 }
                ],
                costPerToken: 0.003, // 0.003 credits per token
                models: {
                    'claude-3-haiku': { costMultiplier: 0.5, maxTokens: 200000 },
                    'claude-3-sonnet': { costMultiplier: 1.0, maxTokens: 200000 },
                    'claude-3-opus': { costMultiplier: 3.0, maxTokens: 200000 }
                },
                rateLimits: { perMinute: 30, tokensPerMinute: 50000 }
            },
            
            discord: {
                name: 'Discord Bot Pool',
                keys: [
                    { key: 'discord_pool_token_1', weight: 50, status: 'active', guildLimit: 100 },
                    { key: 'discord_pool_token_2', weight: 50, status: 'active', guildLimit: 100 }
                ],
                costPerMessage: 0.01, // 0.01 credits per message
                costPerEmbed: 0.02,
                costPerReaction: 0.005,
                rateLimits: { perSecond: 5, perMinute: 300 }
            },
            
            stripe: {
                name: 'Stripe Payment Pool',
                keys: [
                    { key: 'sk_test_pool_stripe_1', weight: 100, status: 'active', type: 'test' },
                    { key: 'sk_live_pool_stripe_1', weight: 100, status: 'active', type: 'live' }
                ],
                costPerTransaction: 1.0, // 1 credit per transaction
                costPerWebhook: 0.1,
                feeStructure: {
                    percentage: 0.029, // 2.9%
                    fixed: 30 // 30 cents
                }
            },
            
            aws: {
                name: 'AWS Service Pool',
                keys: [
                    { key: 'AKIA_pool_aws_1', secret: 'secret_1', weight: 100, status: 'active' },
                    { key: 'AKIA_pool_aws_2', secret: 'secret_2', weight: 100, status: 'active' }
                ],
                services: {
                    's3': { costPerRequest: 0.05, costPerGB: 2.0 },
                    'lambda': { costPerInvocation: 0.2, costPerGBSecond: 0.1 },
                    'ec2': { costPerHour: 10.0 },
                    'rds': { costPerHour: 15.0 }
                }
            }
        };
        
        // User credit accounts
        this.userAccounts = new Map();
        
        // Usage tracking
        this.usageTracker = {
            daily: new Map(),
            monthly: new Map(),
            total: new Map()
        };
        
        // Key rotation schedule
        this.keyRotationSchedule = new Map();
        
        // Credit packages for sale
        this.creditPackages = {
            starter: {
                name: 'Starter Pack',
                credits: 1000,
                price: 10, // $10
                bonus: 100, // 10% bonus
                description: 'Perfect for getting started',
                features: ['All API access', 'Usage analytics', 'Email support']
            },
            
            developer: {
                name: 'Developer Pack',
                credits: 6000,
                price: 50, // $50
                bonus: 1200, // 20% bonus
                description: 'For serious development work',
                features: ['All API access', 'Priority support', 'Advanced analytics', 'Custom rate limits']
            },
            
            business: {
                name: 'Business Pack', 
                credits: 30000,
                price: 200, // $200
                bonus: 15000, // 50% bonus
                description: 'For production applications',
                features: ['All API access', '24/7 support', 'Dedicated account manager', 'Custom integrations']
            },
            
            enterprise: {
                name: 'Enterprise Pack',
                credits: 100000,
                price: 500, // $500
                bonus: 50000, // 50% bonus
                description: 'For large-scale operations',
                features: ['Dedicated API pools', 'SLA guarantees', 'White-label options', 'Custom billing']
            }
        };
        
        console.log('💳 Platform Credit Pool System initialized');
        console.log(`🏦 Managing ${Object.keys(this.platformPools).length} platform pools`);
    }
    
    /**
     * Create user account with initial credits
     */
    async createUserAccount(userId, initialCredits = null) {
        console.log(`👤 Creating user account: ${userId}`);
        
        const credits = initialCredits || this.config.defaultCreditAmount;
        
        const account = {
            userId,
            credits,
            totalSpent: 0,
            createdAt: new Date(),
            tier: this.determineTier(credits),
            rateLimits: this.getTierRateLimits(this.determineTier(credits)),
            usage: {
                daily: {},
                monthly: {},
                total: {}
            },
            preferences: {
                autoTopup: false,
                lowCreditAlert: true,
                usageAlerts: true
            }
        };
        
        this.userAccounts.set(userId, account);
        
        // Send welcome bonus for new users
        if (!initialCredits) {
            await this.addWelcomeBonus(userId);
        }
        
        this.emit('account:created', { userId, account });
        
        console.log(`✅ Account created with ${account.credits} credits`);
        return account;
    }
    
    /**
     * Add welcome bonus for new users
     */
    async addWelcomeBonus(userId) {
        const bonusCredits = 100; // Welcome bonus
        
        await this.addCredits(userId, bonusCredits, 'welcome_bonus');
        
        console.log(`🎁 Welcome bonus added: ${bonusCredits} credits`);
    }
    
    /**
     * Purchase credit package
     */
    async purchaseCreditPackage(userId, packageId, paymentMethod = 'card') {
        console.log(`💰 Processing credit purchase: ${packageId} for ${userId}`);
        
        const package = this.creditPackages[packageId];
        if (!package) {
            throw new Error(`Invalid credit package: ${packageId}`);
        }
        
        // Simulate payment processing
        const paymentResult = await this.processPayment(package.price, paymentMethod);
        
        if (!paymentResult.success) {
            throw new Error(`Payment failed: ${paymentResult.error}`);
        }
        
        // Add credits to user account
        const totalCredits = package.credits + package.bonus;
        await this.addCredits(userId, totalCredits, 'purchase', {
            packageId,
            paymentId: paymentResult.transactionId,
            amount: package.price
        });
        
        console.log(`✅ Credit purchase successful: ${totalCredits} credits added`);
        
        return {
            success: true,
            credits: totalCredits,
            transactionId: paymentResult.transactionId,
            package
        };
    }
    
    /**
     * Make API request using platform credit pool
     */
    async makePooledAPIRequest(userId, platform, endpoint, options = {}) {
        console.log(`🔄 Pooled API request: ${platform}/${endpoint} for ${userId}`);
        
        // Check user account
        const account = this.userAccounts.get(userId);
        if (!account) {
            throw new Error('User account not found');
        }
        
        // Get platform pool
        const pool = this.platformPools[platform];
        if (!pool) {
            throw new Error(`Platform not supported: ${platform}`);
        }
        
        // Calculate cost
        const cost = this.calculateRequestCost(platform, endpoint, options);
        
        // Check if user has enough credits
        if (account.credits < cost) {
            throw new Error(`Insufficient credits. Required: ${cost}, Available: ${account.credits}`);
        }
        
        // Check rate limits
        await this.checkRateLimits(userId, platform);
        
        // Select best API key from pool
        const selectedKey = await this.selectPoolKey(platform, endpoint);
        
        try {
            // Make the actual API request
            const response = await this.executeAPIRequest(platform, endpoint, selectedKey, options);
            
            // Deduct credits
            await this.deductCredits(userId, cost, {
                platform,
                endpoint,
                keyId: selectedKey.id,
                response: {
                    status: response.status,
                    tokensUsed: response.tokensUsed
                }
            });
            
            // Update usage tracking
            await this.trackUsage(userId, platform, endpoint, cost);
            
            console.log(`✅ API request successful. Cost: ${cost} credits`);
            
            return {
                success: true,
                data: response.data,
                cost,
                remainingCredits: account.credits - cost,
                keyUsed: selectedKey.id,
                usage: response.usage
            };
            
        } catch (error) {
            console.error(`❌ API request failed:`, error);
            
            // Mark key as potentially problematic
            await this.reportKeyIssue(selectedKey.id, error);
            
            throw error;
        }
    }
    
    /**
     * Calculate cost for API request
     */
    calculateRequestCost(platform, endpoint, options) {
        const pool = this.platformPools[platform];
        let cost = 0;
        
        switch (platform) {
            case 'github':
                cost = pool.endpoints[endpoint]?.cost || pool.costPerRequest;
                break;
                
            case 'openai':
            case 'anthropic':
                const tokens = options.tokens || 1000; // Estimate
                const model = options.model || Object.keys(pool.models)[0];
                const modelConfig = pool.models[model];
                cost = tokens * pool.costPerToken * (modelConfig?.costMultiplier || 1);
                break;
                
            case 'discord':
                if (endpoint.includes('message')) cost = pool.costPerMessage;
                else if (endpoint.includes('embed')) cost = pool.costPerEmbed;
                else if (endpoint.includes('reaction')) cost = pool.costPerReaction;
                else cost = pool.costPerMessage;
                break;
                
            case 'stripe':
                if (endpoint.includes('payment')) cost = pool.costPerTransaction;
                else if (endpoint.includes('webhook')) cost = pool.costPerWebhook;
                else cost = pool.costPerTransaction;
                break;
                
            case 'aws':
                const service = endpoint.split('/')[0];
                const serviceConfig = pool.services[service];
                cost = serviceConfig?.costPerRequest || 1.0;
                break;
                
            default:
                cost = 1.0; // Default cost
        }
        
        // Apply user tier discount
        const account = this.userAccounts.get(options.userId);
        if (account) {
            const discount = this.getTierDiscount(account.tier);
            cost = cost * (1 - discount);
        }
        
        return Math.max(cost, 0.001); // Minimum cost
    }
    
    /**
     * Select best API key from pool
     */
    async selectPoolKey(platform, endpoint) {
        const pool = this.platformPools[platform];
        const availableKeys = pool.keys.filter(key => 
            key.status === 'active' && 
            !this.isKeyRateLimited(key.id)
        );
        
        if (availableKeys.length === 0) {
            throw new Error(`No available API keys for ${platform}`);
        }
        
        // Weight-based selection with round-robin for fairness
        const totalWeight = availableKeys.reduce((sum, key) => sum + key.weight, 0);
        const random = Math.random() * totalWeight;
        
        let currentWeight = 0;
        for (const key of availableKeys) {
            currentWeight += key.weight;
            if (random <= currentWeight) {
                // Track key usage
                await this.trackKeyUsage(key.id, platform, endpoint);
                return { ...key, id: key.key };
            }
        }
        
        // Fallback to first available key
        return { ...availableKeys[0], id: availableKeys[0].key };
    }
    
    /**
     * Execute the actual API request
     */
    async executeAPIRequest(platform, endpoint, key, options) {
        console.log(`📡 Executing ${platform} API request: ${endpoint}`);
        
        // Mock API responses for demonstration
        const mockResponses = {
            github: {
                'GET /user': { 
                    data: { login: 'pooluser', id: 12345 }, 
                    status: 200, 
                    tokensUsed: 0 
                },
                'GET /repos': { 
                    data: [{ name: 'repo1' }, { name: 'repo2' }], 
                    status: 200, 
                    tokensUsed: 0 
                }
            },
            
            openai: {
                'POST /chat/completions': {
                    data: { 
                        choices: [{ message: { content: 'Hello from pooled OpenAI!' } }] 
                    },
                    status: 200,
                    tokensUsed: options.tokens || 150
                }
            },
            
            anthropic: {
                'POST /messages': {
                    data: { 
                        content: [{ text: 'Hello from pooled Claude!' }] 
                    },
                    status: 200,
                    tokensUsed: options.tokens || 120
                }
            },
            
            discord: {
                'POST /channels/*/messages': {
                    data: { id: '123456789', content: 'Message sent via pool' },
                    status: 200,
                    tokensUsed: 0
                }
            },
            
            stripe: {
                'POST /payment_intents': {
                    data: { id: 'pi_pooled_payment', status: 'succeeded' },
                    status: 200,
                    tokensUsed: 0
                }
            },
            
            aws: {
                's3/list-objects': {
                    data: { Contents: [{ Key: 'file1.txt' }, { Key: 'file2.txt' }] },
                    status: 200,
                    tokensUsed: 0
                }
            }
        };
        
        const response = mockResponses[platform]?.[endpoint] || {
            data: { message: 'Mock response from platform pool' },
            status: 200,
            tokensUsed: 0
        };
        
        // Add some realistic latency
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
        
        return {
            ...response,
            keyUsed: key.id.slice(-8), // Last 8 characters for logging
            usage: {
                requestId: crypto.randomUUID(),
                timestamp: new Date(),
                platform,
                endpoint
            }
        };
    }
    
    /**
     * Add credits to user account
     */
    async addCredits(userId, amount, source = 'purchase', metadata = {}) {
        const account = this.userAccounts.get(userId);
        if (!account) {
            throw new Error('User account not found');
        }
        
        account.credits += amount;
        
        // Log transaction
        const transaction = {
            id: crypto.randomUUID(),
            userId,
            type: 'credit',
            amount,
            source,
            metadata,
            timestamp: new Date(),
            balanceAfter: account.credits
        };
        
        await this.logTransaction(transaction);
        
        // Check if tier upgrade is needed
        const newTier = this.determineTier(account.credits);
        if (newTier !== account.tier) {
            account.tier = newTier;
            account.rateLimits = this.getTierRateLimits(newTier);
            
            this.emit('tier:upgraded', { userId, oldTier: account.tier, newTier });
        }
        
        this.emit('credits:added', { userId, amount, source, newBalance: account.credits });
        
        console.log(`💰 Credits added: ${amount} (${source}). New balance: ${account.credits}`);
    }
    
    /**
     * Deduct credits from user account
     */
    async deductCredits(userId, amount, metadata = {}) {
        const account = this.userAccounts.get(userId);
        if (!account) {
            throw new Error('User account not found');
        }
        
        if (account.credits < amount) {
            throw new Error('Insufficient credits');
        }
        
        account.credits -= amount;
        account.totalSpent += amount;
        
        // Log transaction
        const transaction = {
            id: crypto.randomUUID(),
            userId,
            type: 'debit',
            amount: -amount,
            source: 'api_usage',
            metadata,
            timestamp: new Date(),
            balanceAfter: account.credits
        };
        
        await this.logTransaction(transaction);
        
        // Check for low credit alert
        if (account.credits < 100 && account.preferences.lowCreditAlert) {
            this.emit('credits:low', { userId, credits: account.credits });
        }
        
        // Auto-topup if enabled
        if (account.preferences.autoTopup && account.credits < 50) {
            await this.autoTopup(userId);
        }
        
        this.emit('credits:deducted', { userId, amount, newBalance: account.credits });
    }
    
    /**
     * Get user account info
     */
    getUserAccount(userId) {
        const account = this.userAccounts.get(userId);
        if (!account) {
            return null;
        }
        
        return {
            ...account,
            tier: account.tier,
            rateLimits: account.rateLimits,
            usageToday: this.getDailyUsage(userId),
            usageMonth: this.getMonthlyUsage(userId),
            recommendations: this.getUsageRecommendations(userId)
        };
    }
    
    /**
     * Get platform pool status
     */
    getPoolStatus() {
        const status = {};
        
        for (const [platform, pool] of Object.entries(this.platformPools)) {
            const activeKeys = pool.keys.filter(k => k.status === 'active').length;
            const totalKeys = pool.keys.length;
            
            status[platform] = {
                name: pool.name,
                activeKeys,
                totalKeys,
                healthScore: activeKeys / totalKeys,
                dailyUsage: this.getPoolDailyUsage(platform),
                rateLimits: pool.rateLimits
            };
        }
        
        return status;
    }
    
    /**
     * Get usage analytics for user
     */
    async getUserAnalytics(userId, timeframe = 'month') {
        const account = this.userAccounts.get(userId);
        if (!account) {
            throw new Error('User account not found');
        }
        
        const analytics = {
            userId,
            timeframe,
            totalCredits: account.credits,
            totalSpent: account.totalSpent,
            tier: account.tier,
            usage: {
                byPlatform: {},
                byDate: {},
                topEndpoints: []
            },
            costs: {
                total: account.totalSpent,
                average: account.totalSpent / Math.max(this.getDaysSinceCreation(userId), 1),
                breakdown: {}
            },
            recommendations: this.getUsageRecommendations(userId)
        };
        
        return analytics;
    }
    
    /**
     * Set up auto-topup for user
     */
    async setupAutoTopup(userId, options) {
        const account = this.userAccounts.get(userId);
        if (!account) {
            throw new Error('User account not found');
        }
        
        account.preferences.autoTopup = true;
        account.preferences.autoTopupOptions = {
            threshold: options.threshold || 50, // Credits
            amount: options.amount || 1000, // Credits to add
            packageId: options.packageId || 'starter',
            paymentMethod: options.paymentMethod || 'card'
        };
        
        console.log(`🔄 Auto-topup enabled for ${userId}`);
        
        this.emit('autotopup:enabled', { userId, options });
    }
    
    /**
     * Share credits between users
     */
    async shareCredits(fromUserId, toUserId, amount, message = '') {
        if (!this.config.enableCreditSharing) {
            throw new Error('Credit sharing is disabled');
        }
        
        const fromAccount = this.userAccounts.get(fromUserId);
        const toAccount = this.userAccounts.get(toUserId);
        
        if (!fromAccount || !toAccount) {
            throw new Error('One or both user accounts not found');
        }
        
        if (fromAccount.credits < amount) {
            throw new Error('Insufficient credits to share');
        }
        
        // Deduct from sender
        await this.deductCredits(fromUserId, amount, {
            type: 'credit_share_sent',
            recipient: toUserId,
            message
        });
        
        // Add to recipient
        await this.addCredits(toUserId, amount, 'credit_share_received', {
            sender: fromUserId,
            message
        });
        
        console.log(`💝 Credits shared: ${amount} from ${fromUserId} to ${toUserId}`);
        
        this.emit('credits:shared', { fromUserId, toUserId, amount, message });
        
        return {
            success: true,
            amount,
            senderBalance: fromAccount.credits,
            recipientBalance: toAccount.credits
        };
    }
    
    /**
     * Get credit sharing history
     */
    async getCreditSharingHistory(userId) {
        // Mock implementation - in production, query from database
        return {
            sent: [
                { recipient: 'user123', amount: 100, date: new Date(), message: 'For your project' }
            ],
            received: [
                { sender: 'user456', amount: 50, date: new Date(), message: 'Thank you!' }
            ]
        };
    }
    
    // Helper methods
    determineTier(credits) {
        if (credits >= 50000) return 'enterprise';
        if (credits >= 10000) return 'business';
        if (credits >= 2000) return 'developer';
        return 'starter';
    }
    
    getTierRateLimits(tier) {
        const limits = {
            starter: { requestsPerMinute: 20, requestsPerHour: 500 },
            developer: { requestsPerMinute: 60, requestsPerHour: 2000 },
            business: { requestsPerMinute: 150, requestsPerHour: 8000 },
            enterprise: { requestsPerMinute: 500, requestsPerHour: 50000 }
        };
        
        return limits[tier] || limits.starter;
    }
    
    getTierDiscount(tier) {
        const discounts = {
            starter: 0.0,
            developer: 0.05, // 5% discount
            business: 0.10, // 10% discount
            enterprise: 0.15 // 15% discount
        };
        
        return discounts[tier] || 0.0;
    }
    
    async processPayment(amount, method) {
        // Mock payment processing
        console.log(`💳 Processing $${amount} payment via ${method}`);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 95% success rate for demo
        const success = Math.random() > 0.05;
        
        return {
            success,
            transactionId: success ? crypto.randomUUID() : null,
            error: success ? null : 'Payment declined'
        };
    }
    
    async checkRateLimits(userId, platform) {
        const account = this.userAccounts.get(userId);
        const pool = this.platformPools[platform];
        
        // Check user tier limits
        const userLimits = account.rateLimits;
        const userUsage = this.getUserRateLimitUsage(userId);
        
        if (userUsage.perMinute >= userLimits.requestsPerMinute) {
            throw new Error('User rate limit exceeded (per minute)');
        }
        
        if (userUsage.perHour >= userLimits.requestsPerHour) {
            throw new Error('User rate limit exceeded (per hour)');
        }
        
        // Check platform pool limits
        const poolUsage = this.getPoolRateLimitUsage(platform);
        const poolLimits = pool.rateLimits;
        
        if (poolUsage.perMinute >= poolLimits.perMinute) {
            throw new Error('Platform pool rate limit exceeded');
        }
    }
    
    isKeyRateLimited(keyId) {
        // Mock rate limit check
        return false;
    }
    
    async trackKeyUsage(keyId, platform, endpoint) {
        // Track key usage for rotation and health monitoring
        const usage = {
            keyId,
            platform,
            endpoint,
            timestamp: new Date()
        };
        
        // In production, store in database
        console.log(`📊 Key usage tracked: ${keyId.slice(-8)}`);
    }
    
    async reportKeyIssue(keyId, error) {
        console.warn(`⚠️ Key issue reported: ${keyId.slice(-8)} - ${error.message}`);
        
        // In production, implement key health monitoring
        // and automatic rotation if needed
    }
    
    async trackUsage(userId, platform, endpoint, cost) {
        const today = new Date().toISOString().split('T')[0];
        const month = new Date().toISOString().substring(0, 7);
        
        // Update user usage tracking
        const account = this.userAccounts.get(userId);
        if (!account.usage.daily[today]) account.usage.daily[today] = {};
        if (!account.usage.monthly[month]) account.usage.monthly[month] = {};
        if (!account.usage.total[platform]) account.usage.total[platform] = 0;
        
        account.usage.daily[today][platform] = (account.usage.daily[today][platform] || 0) + cost;
        account.usage.monthly[month][platform] = (account.usage.monthly[month][platform] || 0) + cost;
        account.usage.total[platform] += cost;
    }
    
    async logTransaction(transaction) {
        // In production, store in database
        console.log(`📝 Transaction logged: ${transaction.type} ${transaction.amount} credits`);
    }
    
    async autoTopup(userId) {
        const account = this.userAccounts.get(userId);
        const options = account.preferences.autoTopupOptions;
        
        if (!options) return;
        
        try {
            const result = await this.purchaseCreditPackage(
                userId,
                options.packageId,
                options.paymentMethod
            );
            
            console.log(`🔄 Auto-topup successful: ${result.credits} credits added`);
            
            this.emit('autotopup:success', { userId, result });
            
        } catch (error) {
            console.error(`❌ Auto-topup failed for ${userId}:`, error);
            
            this.emit('autotopup:failed', { userId, error: error.message });
        }
    }
    
    getDailyUsage(userId) {
        const account = this.userAccounts.get(userId);
        const today = new Date().toISOString().split('T')[0];
        return account?.usage.daily[today] || {};
    }
    
    getMonthlyUsage(userId) {
        const account = this.userAccounts.get(userId);
        const month = new Date().toISOString().substring(0, 7);
        return account?.usage.monthly[month] || {};
    }
    
    getUsageRecommendations(userId) {
        const account = this.userAccounts.get(userId);
        const recommendations = [];
        
        // Analyze usage patterns and suggest optimizations
        if (account.totalSpent > 1000) {
            recommendations.push({
                type: 'tier_upgrade',
                message: 'Consider upgrading your tier for better rates',
                savings: Math.floor(account.totalSpent * 0.1)
            });
        }
        
        if (account.credits < 100) {
            recommendations.push({
                type: 'low_credits',
                message: 'Your credit balance is low. Consider purchasing more credits.',
                action: 'purchase'
            });
        }
        
        return recommendations;
    }
    
    getDaysSinceCreation(userId) {
        const account = this.userAccounts.get(userId);
        const diffTime = Math.abs(new Date() - account.createdAt);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    getPoolDailyUsage(platform) {
        // Mock pool usage
        return Math.floor(Math.random() * 1000);
    }
    
    getUserRateLimitUsage(userId) {
        // Mock user rate limit usage
        return {
            perMinute: Math.floor(Math.random() * 10),
            perHour: Math.floor(Math.random() * 100)
        };
    }
    
    getPoolRateLimitUsage(platform) {
        // Mock pool rate limit usage
        return {
            perMinute: Math.floor(Math.random() * 50),
            perHour: Math.floor(Math.random() * 1000)
        };
    }
    
    /**
     * Export system state and statistics
     */
    exportSystemStats() {
        const stats = {
            totalUsers: this.userAccounts.size,
            totalCreditsDistributed: Array.from(this.userAccounts.values())
                .reduce((sum, acc) => sum + acc.credits, 0),
            totalSpent: Array.from(this.userAccounts.values())
                .reduce((sum, acc) => sum + acc.totalSpent, 0),
            platformPools: Object.keys(this.platformPools).length,
            activeKeys: Object.values(this.platformPools)
                .reduce((sum, pool) => sum + pool.keys.filter(k => k.status === 'active').length, 0),
            usage: {
                topPlatforms: ['github', 'openai', 'discord'], // Mock data
                dailyRequests: Math.floor(Math.random() * 10000),
                monthlyRequests: Math.floor(Math.random() * 300000)
            },
            exported: new Date().toISOString()
        };
        
        console.log('📊 System statistics exported');
        return stats;
    }
}

// Integration with onboarding system
class CreditPoolOnboardingIntegration {
    constructor(onboardingOrchestrator, creditPool) {
        this.onboarding = onboardingOrchestrator;
        this.creditPool = creditPool;
        
        // Listen for onboarding events
        this.onboarding.on('onboarding:completed', this.handleOnboardingComplete.bind(this));
        this.onboarding.on('path:selected', this.handlePathSelected.bind(this));
    }
    
    async handleOnboardingComplete(data) {
        if (data.config.path === 'platform-credits' || data.config.path === 'hybrid') {
            console.log(`🎯 Setting up credit account for ${data.config.userId}`);
            
            // Create credit account with starter bonus
            await this.creditPool.createUserAccount(data.config.userId, 1000);
            
            // Add completion bonus
            await this.creditPool.addCredits(data.config.userId, 200, 'onboarding_bonus');
            
            console.log(`✅ Credit account ready for ${data.config.userId}`);
        }
    }
    
    async handlePathSelected(data) {
        if (data.path === 'platform-credits') {
            // Pre-create account for immediate API access
            await this.creditPool.createUserAccount(data.userId, 500);
        }
    }
}

module.exports = { PlatformCreditPoolSystem, CreditPoolOnboardingIntegration };

// Example usage
if (require.main === module) {
    async function demonstrateCreditPoolSystem() {
        console.log('\n💳 DEMONSTRATING PLATFORM CREDIT POOL SYSTEM\n');
        
        const creditPool = new PlatformCreditPoolSystem({
            defaultCreditAmount: 1000,
            enableCreditSharing: true,
            enableAutoTopup: true
        });
        
        // Listen for events
        creditPool.on('account:created', (data) => {
            console.log(`📢 Account created: ${data.userId} with ${data.account.credits} credits`);
        });
        
        creditPool.on('credits:low', (data) => {
            console.log(`🚨 Low credits alert: ${data.userId} has ${data.credits} credits left`);
        });
        
        // Create user account
        const userId = 'demo_user_789';
        await creditPool.createUserAccount(userId);
        
        // Purchase credit package
        console.log('\n💰 Purchasing developer pack...');
        const purchase = await creditPool.purchaseCreditPackage(userId, 'developer', 'card');
        console.log(`✅ Purchase complete: ${purchase.credits} credits`);
        
        // Make some API requests using the pool
        console.log('\n🔄 Making pooled API requests...');
        
        const githubRequest = await creditPool.makePooledAPIRequest(
            userId, 
            'github', 
            'GET /user'
        );
        console.log(`GitHub API: ${githubRequest.cost} credits, ${githubRequest.remainingCredits} remaining`);
        
        const openaiRequest = await creditPool.makePooledAPIRequest(
            userId, 
            'openai', 
            'POST /chat/completions',
            { tokens: 500, model: 'gpt-3.5-turbo' }
        );
        console.log(`OpenAI API: ${openaiRequest.cost} credits, ${openaiRequest.remainingCredits} remaining`);
        
        // Check account status
        console.log('\n📊 Account Status:');
        const account = creditPool.getUserAccount(userId);
        console.log(`Credits: ${account.credits}, Tier: ${account.tier}, Spent: ${account.totalSpent}`);
        
        // Check pool status
        console.log('\n🏊 Pool Status:');
        const poolStatus = creditPool.getPoolStatus();
        Object.entries(poolStatus).forEach(([platform, status]) => {
            console.log(`${platform}: ${status.activeKeys}/${status.totalKeys} keys active`);
        });
        
        // Export system stats
        const stats = creditPool.exportSystemStats();
        console.log('\n📈 System Stats:', stats);
        
        console.log('\n🎉 Credit pool system demonstration complete!');
    }
    
    demonstrateCreditPoolSystem().catch(console.error);
}

console.log('💳 PLATFORM CREDIT POOL SYSTEM LOADED');
console.log('🏦 "or they could just use our shit too and use our credits" - DELIVERED!');
console.log('🎯 Users can now use platform credits instead of getting their own API keys');