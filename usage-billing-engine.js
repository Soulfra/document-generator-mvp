#!/usr/bin/env node

/**
 * 💰 USAGE BILLING ENGINE
 * Charges users based on platform popularity, API usage, and success metrics
 * Integrates with API Obfuscation Relay and Stripe for automated billing
 */

require('dotenv').config();

const EventEmitter = require('events');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const http = require('http');
const { WebSocketServer } = require('ws');

class UsageBillingEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 5000,
            wsPort: config.wsPort || 5001,
            billingCycle: config.billingCycle || 'monthly', // daily, weekly, monthly
            minimumBill: config.minimumBill || 1.00, // $1 minimum
            gracePeriodDays: config.gracePeriodDays || 3,
            maxUnpaidBills: config.maxUnpaidBills || 2,
            ...config
        };
        
        // Pricing tiers based on platform success
        this.pricingTiers = {
            'starter': {
                name: 'Starter Platform',
                description: 'New platforms getting started',
                thresholds: {
                    maxApiCalls: 1000,
                    maxUsers: 100,
                    maxRevenue: 100
                },
                pricing: {
                    baseRate: 1.00,
                    apiCallRate: 0.001,  // $0.001 per API call
                    userRate: 0.01,      // $0.01 per active user
                    revenueRate: 0.02    // 2% of platform revenue
                }
            },
            
            'growth': {
                name: 'Growth Platform',
                description: 'Platforms gaining traction',
                thresholds: {
                    maxApiCalls: 10000,
                    maxUsers: 1000,
                    maxRevenue: 1000
                },
                pricing: {
                    baseRate: 5.00,
                    apiCallRate: 0.0008,
                    userRate: 0.008,
                    revenueRate: 0.03
                }
            },
            
            'scale': {
                name: 'Scale Platform', 
                description: 'Successful scaling platforms',
                thresholds: {
                    maxApiCalls: 100000,
                    maxUsers: 10000,
                    maxRevenue: 10000
                },
                pricing: {
                    baseRate: 25.00,
                    apiCallRate: 0.0005,
                    userRate: 0.005,
                    revenueRate: 0.05
                }
            },
            
            'enterprise': {
                name: 'Enterprise Platform',
                description: 'High-volume enterprise platforms',
                thresholds: {
                    maxApiCalls: Infinity,
                    maxUsers: Infinity,
                    maxRevenue: Infinity
                },
                pricing: {
                    baseRate: 100.00,
                    apiCallRate: 0.0003,
                    userRate: 0.003,
                    revenueRate: 0.07
                }
            }
        };
        
        // Success multipliers - higher success = higher bills
        this.successMultipliers = {
            'viral': 3.0,       // Platform went viral
            'trending': 2.0,    // Platform is trending  
            'popular': 1.5,     // Platform is popular
            'stable': 1.0,      // Platform is stable
            'declining': 0.8,   // Platform usage declining
            'inactive': 0.5     // Platform barely used
        };
        
        this.db = null;
        this.server = null;
        this.wss = null;
        this.billingJobs = new Map();
        
        console.log('💰 Usage Billing Engine initializing...');
        console.log(`📊 ${Object.keys(this.pricingTiers).length} pricing tiers configured`);
        console.log(`💳 Billing cycle: ${this.config.billingCycle}`);
    }
    
    async init() {
        // Connect to database
        this.db = new sqlite3.Database('./economic-engine.db');
        await this.createBillingTables();
        
        // Start HTTP server for billing dashboard
        this.server = http.createServer((req, res) => this.handleRequest(req, res));
        
        // Start WebSocket for real-time billing updates
        this.wss = new WebSocketServer({ port: this.config.wsPort });
        this.wss.on('connection', (ws) => this.handleWebSocket(ws));
        
        // Start billing processes
        this.startBillingCycles();
        this.startUsageAnalysis();
        this.startCollectionProcess();
        
        return new Promise((resolve) => {
            this.server.listen(this.config.port, () => {
                console.log(`💰 Usage Billing Engine: http://localhost:${this.config.port}`);
                console.log(`📊 Billing WebSocket: ws://localhost:${this.config.wsPort}`);
                console.log('✅ Ready to bill based on platform success!');
                resolve();
            });
        });
    }
    
    async createBillingTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS billing_accounts (
                account_id TEXT PRIMARY KEY,
                user_id TEXT UNIQUE,
                platform_id TEXT,
                stripe_customer_id TEXT,
                current_tier TEXT DEFAULT 'starter',
                status TEXT DEFAULT 'active',
                payment_method_id TEXT,
                billing_email TEXT,
                next_billing_date DATE,
                grace_period_ends DATE,
                total_billed REAL DEFAULT 0,
                total_paid REAL DEFAULT 0,
                unpaid_bills INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS billing_invoices (
                invoice_id TEXT PRIMARY KEY,
                account_id TEXT,
                platform_id TEXT,
                billing_period_start DATE,
                billing_period_end DATE,
                tier_used TEXT,
                success_status TEXT,
                success_multiplier REAL DEFAULT 1.0,
                base_amount REAL,
                api_calls_charge REAL DEFAULT 0,
                users_charge REAL DEFAULT 0,
                revenue_share REAL DEFAULT 0,
                multiplier_bonus REAL DEFAULT 0,
                total_amount REAL,
                stripe_invoice_id TEXT,
                payment_status TEXT DEFAULT 'pending',
                paid_at TIMESTAMP,
                due_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES billing_accounts(account_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS platform_metrics (
                metric_id TEXT PRIMARY KEY,
                platform_id TEXT,
                account_id TEXT,
                date DATE,
                api_calls INTEGER DEFAULT 0,
                unique_users INTEGER DEFAULT 0,
                platform_revenue REAL DEFAULT 0,
                response_time_avg REAL DEFAULT 0,
                error_rate REAL DEFAULT 0,
                user_retention_rate REAL DEFAULT 0,
                engagement_score REAL DEFAULT 0,
                popularity_score REAL DEFAULT 0,
                success_status TEXT DEFAULT 'stable',
                tier_qualification TEXT DEFAULT 'starter',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(platform_id, date)
            )`,
            
            `CREATE TABLE IF NOT EXISTS billing_events (
                event_id TEXT PRIMARY KEY,
                account_id TEXT,
                event_type TEXT,
                event_data TEXT,
                amount REAL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS payment_failures (
                failure_id TEXT PRIMARY KEY,
                account_id TEXT,
                invoice_id TEXT,
                failure_reason TEXT,
                amount REAL,
                retry_count INTEGER DEFAULT 0,
                next_retry_date DATE,
                resolved INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        for (const sql of tables) {
            await this.runQuery(sql);
        }
        
        console.log('✅ Billing database tables created');
    }
    
    // Main billing functions
    async createBillingAccount(userId, platformId, stripeCustomerId, options = {}) {
        const accountId = this.generateId('billing');
        
        const sql = `
            INSERT INTO billing_accounts 
            (account_id, user_id, platform_id, stripe_customer_id, billing_email, next_billing_date)
            VALUES (?, ?, ?, ?, ?, date('now', '+1 month'))
        `;
        
        await this.runQuery(sql, [
            accountId,
            userId,
            platformId,
            stripeCustomerId,
            options.billingEmail
        ]);
        
        console.log(`💰 Created billing account: ${accountId} for platform: ${platformId}`);
        
        return {
            accountId,
            userId,
            platformId,
            tier: 'starter',
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };
    }
    
    async calculatePlatformBill(platformId, billingPeriodStart, billingPeriodEnd) {
        console.log(`💰 Calculating bill for platform: ${platformId}`);
        
        // Get platform metrics for billing period
        const metrics = await this.getPlatformMetrics(platformId, billingPeriodStart, billingPeriodEnd);
        
        if (!metrics || metrics.length === 0) {
            console.log(`⚠️ No metrics found for platform: ${platformId}`);
            return this.createMinimumBill(platformId, billingPeriodStart, billingPeriodEnd);
        }
        
        // Calculate aggregate metrics
        const aggregateMetrics = this.aggregateMetrics(metrics);
        
        // Determine tier based on usage
        const tier = this.determineTier(aggregateMetrics);
        
        // Determine success status
        const successStatus = this.determineSuccessStatus(aggregateMetrics);
        
        // Get pricing config
        const pricingConfig = this.pricingTiers[tier];
        const successMultiplier = this.successMultipliers[successStatus];
        
        // Calculate charges
        const baseAmount = pricingConfig.pricing.baseRate;
        const apiCallsCharge = aggregateMetrics.totalApiCalls * pricingConfig.pricing.apiCallRate;
        const usersCharge = aggregateMetrics.totalUsers * pricingConfig.pricing.userRate;
        const revenueShare = aggregateMetrics.totalRevenue * pricingConfig.pricing.revenueRate;
        
        // Calculate subtotal
        const subtotal = baseAmount + apiCallsCharge + usersCharge + revenueShare;
        
        // Apply success multiplier
        const multiplierBonus = subtotal * (successMultiplier - 1);
        const totalAmount = Math.max(this.config.minimumBill, subtotal + multiplierBonus);
        
        console.log(`📊 Platform ${platformId} bill calculated:`);
        console.log(`   Tier: ${tier} | Success: ${successStatus} (${successMultiplier}x)`);
        console.log(`   Base: $${baseAmount} | API: $${apiCallsCharge.toFixed(2)} | Users: $${usersCharge.toFixed(2)}`);
        console.log(`   Revenue Share: $${revenueShare.toFixed(2)} | Bonus: $${multiplierBonus.toFixed(2)}`);
        console.log(`   Total: $${totalAmount.toFixed(2)}`);
        
        return {
            platformId,
            billingPeriodStart,
            billingPeriodEnd,
            tier,
            successStatus,
            successMultiplier,
            baseAmount,
            apiCallsCharge,
            usersCharge,
            revenueShare,
            multiplierBonus,
            totalAmount,
            metrics: aggregateMetrics
        };
    }
    
    async generateInvoice(accountId, billCalculation) {
        const invoiceId = this.generateId('invoice');
        
        const sql = `
            INSERT INTO billing_invoices 
            (invoice_id, account_id, platform_id, billing_period_start, billing_period_end,
             tier_used, success_status, success_multiplier, base_amount, api_calls_charge,
             users_charge, revenue_share, multiplier_bonus, total_amount, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now', '+30 days'))
        `;
        
        await this.runQuery(sql, [
            invoiceId,
            accountId,
            billCalculation.platformId,
            billCalculation.billingPeriodStart,
            billCalculation.billingPeriodEnd,
            billCalculation.tier,
            billCalculation.successStatus,
            billCalculation.successMultiplier,
            billCalculation.baseAmount,
            billCalculation.apiCallsCharge,
            billCalculation.usersCharge,
            billCalculation.revenueShare,
            billCalculation.multiplierBonus,
            billCalculation.totalAmount
        ]);
        
        // Create Stripe invoice
        const account = await this.getBillingAccount(accountId);
        const stripeInvoice = await this.createStripeInvoice(account, billCalculation, invoiceId);
        
        // Update invoice with Stripe ID
        await this.runQuery(`
            UPDATE billing_invoices 
            SET stripe_invoice_id = ?
            WHERE invoice_id = ?
        `, [stripeInvoice.id, invoiceId]);
        
        // Log billing event
        await this.logBillingEvent(accountId, 'invoice_created', {
            invoiceId,
            amount: billCalculation.totalAmount,
            tier: billCalculation.tier,
            successStatus: billCalculation.successStatus
        });
        
        console.log(`📄 Invoice generated: ${invoiceId} for $${billCalculation.totalAmount.toFixed(2)}`);
        
        return {
            invoiceId,
            stripeInvoiceId: stripeInvoice.id,
            amount: billCalculation.totalAmount,
            dueDate: stripeInvoice.due_date,
            hostedUrl: stripeInvoice.hosted_invoice_url
        };
    }
    
    async createStripeInvoice(account, billCalculation, invoiceId) {
        try {
            // Create invoice items
            const invoiceItems = [];
            
            // Base rate
            if (billCalculation.baseAmount > 0) {
                invoiceItems.push({
                    customer: account.stripe_customer_id,
                    amount: Math.round(billCalculation.baseAmount * 100),
                    currency: 'usd',
                    description: `${this.pricingTiers[billCalculation.tier].name} - Base Rate`
                });
            }
            
            // API calls
            if (billCalculation.apiCallsCharge > 0) {
                invoiceItems.push({
                    customer: account.stripe_customer_id,
                    amount: Math.round(billCalculation.apiCallsCharge * 100),
                    currency: 'usd',
                    description: `API Calls Usage (${billCalculation.metrics.totalApiCalls.toLocaleString()} calls)`
                });
            }
            
            // Users
            if (billCalculation.usersCharge > 0) {
                invoiceItems.push({
                    customer: account.stripe_customer_id,
                    amount: Math.round(billCalculation.usersCharge * 100),
                    currency: 'usd',
                    description: `Active Users (${billCalculation.metrics.totalUsers.toLocaleString()} users)`
                });
            }
            
            // Revenue share
            if (billCalculation.revenueShare > 0) {
                invoiceItems.push({
                    customer: account.stripe_customer_id,
                    amount: Math.round(billCalculation.revenueShare * 100),
                    currency: 'usd',
                    description: `Revenue Share (${this.pricingTiers[billCalculation.tier].pricing.revenueRate * 100}% of $${billCalculation.metrics.totalRevenue.toFixed(2)})`
                });
            }
            
            // Success multiplier bonus
            if (billCalculation.multiplierBonus > 0) {
                invoiceItems.push({
                    customer: account.stripe_customer_id,
                    amount: Math.round(billCalculation.multiplierBonus * 100),
                    currency: 'usd',
                    description: `Success Bonus (${billCalculation.successStatus} - ${billCalculation.successMultiplier}x multiplier)`
                });
            }
            
            // Create all invoice items
            for (const item of invoiceItems) {
                await stripe.invoiceItems.create(item);
            }
            
            // Create invoice
            const invoice = await stripe.invoices.create({
                customer: account.stripe_customer_id,
                description: `Platform Usage - ${billCalculation.platformId}`,
                metadata: {
                    platform_id: billCalculation.platformId,
                    internal_invoice_id: invoiceId,
                    tier: billCalculation.tier,
                    success_status: billCalculation.successStatus
                },
                auto_advance: true,
                collection_method: 'charge_automatically',
                days_until_due: 30
            });
            
            // Finalize invoice
            await stripe.invoices.finalizeInvoice(invoice.id);
            
            return invoice;
            
        } catch (error) {
            console.error('❌ Stripe invoice creation failed:', error);
            throw error;
        }
    }
    
    // Usage analysis and tier determination
    aggregateMetrics(metrics) {
        const totals = {
            totalApiCalls: 0,
            totalUsers: 0,
            totalRevenue: 0,
            avgResponseTime: 0,
            avgErrorRate: 0,
            avgEngagement: 0,
            avgPopularity: 0,
            days: metrics.length
        };
        
        for (const metric of metrics) {
            totals.totalApiCalls += metric.api_calls || 0;
            totals.totalUsers += metric.unique_users || 0;
            totals.totalRevenue += metric.platform_revenue || 0;
            totals.avgResponseTime += metric.response_time_avg || 0;
            totals.avgErrorRate += metric.error_rate || 0;
            totals.avgEngagement += metric.engagement_score || 0;
            totals.avgPopularity += metric.popularity_score || 0;
        }
        
        // Calculate averages
        if (totals.days > 0) {
            totals.avgResponseTime /= totals.days;
            totals.avgErrorRate /= totals.days;
            totals.avgEngagement /= totals.days;
            totals.avgPopularity /= totals.days;
        }
        
        return totals;
    }
    
    determineTier(metrics) {
        const tiers = ['starter', 'growth', 'scale', 'enterprise'];
        
        for (const tier of tiers) {
            const thresholds = this.pricingTiers[tier].thresholds;
            
            if (metrics.totalApiCalls <= thresholds.maxApiCalls &&
                metrics.totalUsers <= thresholds.maxUsers &&
                metrics.totalRevenue <= thresholds.maxRevenue) {
                return tier;
            }
        }
        
        return 'enterprise';
    }
    
    determineSuccessStatus(metrics) {
        const popularity = metrics.avgPopularity;
        const engagement = metrics.avgEngagement;
        const errorRate = metrics.avgErrorRate;
        
        // Calculate success score
        const successScore = 
            (popularity * 0.4) + 
            (engagement * 0.4) + 
            ((1 - errorRate) * 0.2);
        
        if (successScore >= 0.9) return 'viral';
        if (successScore >= 0.8) return 'trending';
        if (successScore >= 0.6) return 'popular';
        if (successScore >= 0.4) return 'stable';
        if (successScore >= 0.2) return 'declining';
        return 'inactive';
    }
    
    createMinimumBill(platformId, billingPeriodStart, billingPeriodEnd) {
        return {
            platformId,
            billingPeriodStart,
            billingPeriodEnd,
            tier: 'starter',
            successStatus: 'inactive',
            successMultiplier: 1.0,
            baseAmount: this.config.minimumBill,
            apiCallsCharge: 0,
            usersCharge: 0,
            revenueShare: 0,
            multiplierBonus: 0,
            totalAmount: this.config.minimumBill,
            metrics: {
                totalApiCalls: 0,
                totalUsers: 0,
                totalRevenue: 0
            }
        };
    }
    
    // Billing cycles and automation
    startBillingCycles() {
        console.log('💰 Starting automated billing cycles...');
        
        // Run billing cycle based on configuration
        const intervals = {
            'daily': 24 * 60 * 60 * 1000,
            'weekly': 7 * 24 * 60 * 60 * 1000,
            'monthly': 30 * 24 * 60 * 60 * 1000
        };
        
        const interval = intervals[this.config.billingCycle];
        
        if (interval) {
            setInterval(async () => {
                await this.processBillingCycle();
            }, interval);
            
            // Run initial billing check in 1 minute
            setTimeout(async () => {
                await this.processBillingCycle();
            }, 60000);
        }
        
        console.log(`⏰ Billing cycle scheduled: ${this.config.billingCycle}`);
    }
    
    async processBillingCycle() {
        console.log('💰 Processing billing cycle...');
        
        try {
            // Get accounts due for billing
            const dueAccounts = await this.runQuery(`
                SELECT * FROM billing_accounts 
                WHERE status = 'active' 
                AND next_billing_date <= date('now')
            `);
            
            console.log(`📊 Processing ${dueAccounts.length} accounts due for billing`);
            
            for (const account of dueAccounts) {
                try {
                    await this.processAccountBilling(account);
                } catch (error) {
                    console.error(`❌ Failed to bill account ${account.account_id}:`, error);
                    await this.handleBillingError(account, error);
                }
            }
            
        } catch (error) {
            console.error('❌ Billing cycle error:', error);
        }
    }
    
    async processAccountBilling(account) {
        const billingPeriodEnd = new Date();
        const billingPeriodStart = new Date(billingPeriodEnd);
        
        // Set billing period based on cycle
        if (this.config.billingCycle === 'daily') {
            billingPeriodStart.setDate(billingPeriodStart.getDate() - 1);
        } else if (this.config.billingCycle === 'weekly') {
            billingPeriodStart.setDate(billingPeriodStart.getDate() - 7);
        } else {
            billingPeriodStart.setMonth(billingPeriodStart.getMonth() - 1);
        }
        
        // Calculate bill
        const billCalculation = await this.calculatePlatformBill(
            account.platform_id,
            billingPeriodStart.toISOString().split('T')[0],
            billingPeriodEnd.toISOString().split('T')[0]
        );
        
        // Generate invoice
        const invoice = await this.generateInvoice(account.account_id, billCalculation);
        
        // Update account
        const nextBillingDate = new Date(billingPeriodEnd);
        if (this.config.billingCycle === 'daily') {
            nextBillingDate.setDate(nextBillingDate.getDate() + 1);
        } else if (this.config.billingCycle === 'weekly') {
            nextBillingDate.setDate(nextBillingDate.getDate() + 7);
        } else {
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }
        
        await this.runQuery(`
            UPDATE billing_accounts 
            SET next_billing_date = ?, 
                current_tier = ?,
                total_billed = total_billed + ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE account_id = ?
        `, [
            nextBillingDate.toISOString().split('T')[0],
            billCalculation.tier,
            billCalculation.totalAmount,
            account.account_id
        ]);
        
        // Broadcast billing update
        this.broadcastBillingUpdate({
            type: 'account_billed',
            accountId: account.account_id,
            platformId: account.platform_id,
            amount: billCalculation.totalAmount,
            tier: billCalculation.tier,
            successStatus: billCalculation.successStatus,
            invoiceId: invoice.invoiceId
        });
        
        console.log(`✅ Billed account ${account.account_id}: $${billCalculation.totalAmount.toFixed(2)}`);
    }
    
    startUsageAnalysis() {
        // Analyze platform metrics every hour
        setInterval(async () => {
            await this.analyzeAllPlatforms();
        }, 60 * 60 * 1000);
        
        console.log('📊 Usage analysis scheduled');
    }
    
    async analyzeAllPlatforms() {
        try {
            // Get active billing accounts
            const accounts = await this.runQuery(`
                SELECT DISTINCT platform_id FROM billing_accounts 
                WHERE status = 'active'
            `);
            
            for (const account of accounts) {
                await this.analyzePlatformMetrics(account.platform_id);
            }
            
        } catch (error) {
            console.error('❌ Usage analysis error:', error);
        }
    }
    
    async analyzePlatformMetrics(platformId) {
        // This would integrate with the API Obfuscation Relay to get real metrics
        // For demo, we'll generate some realistic data
        
        const today = new Date().toISOString().split('T')[0];
        
        // Simulate metrics based on platform activity
        const metrics = {
            platformId,
            date: today,
            apiCalls: Math.floor(Math.random() * 1000) + 50,
            uniqueUsers: Math.floor(Math.random() * 100) + 10,
            platformRevenue: Math.random() * 500,
            responseTimeAvg: 100 + Math.random() * 200,
            errorRate: Math.random() * 0.05,
            userRetentionRate: 0.7 + Math.random() * 0.3,
            engagementScore: Math.random(),
            popularityScore: Math.random()
        };
        
        // Determine success status and tier
        const aggregateMetrics = {
            totalApiCalls: metrics.apiCalls,
            totalUsers: metrics.uniqueUsers,
            totalRevenue: metrics.platformRevenue,
            avgEngagement: metrics.engagementScore,
            avgPopularity: metrics.popularityScore,
            avgErrorRate: metrics.errorRate
        };
        
        const successStatus = this.determineSuccessStatus(aggregateMetrics);
        const tierQualification = this.determineTier(aggregateMetrics);
        
        // Store metrics
        await this.runQuery(`
            INSERT OR REPLACE INTO platform_metrics 
            (metric_id, platform_id, date, api_calls, unique_users, platform_revenue,
             response_time_avg, error_rate, user_retention_rate, engagement_score,
             popularity_score, success_status, tier_qualification)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            this.generateId('metric'),
            platformId,
            today,
            metrics.apiCalls,
            metrics.uniqueUsers,
            metrics.platformRevenue,
            metrics.responseTimeAvg,
            metrics.errorRate,
            metrics.userRetentionRate,
            metrics.engagementScore,
            metrics.popularityScore,
            successStatus,
            tierQualification
        ]);
    }
    
    startCollectionProcess() {
        // Handle payment failures and collections
        setInterval(async () => {
            await this.processCollections();
        }, 4 * 60 * 60 * 1000); // Every 4 hours
        
        console.log('💳 Collection process scheduled');
    }
    
    async processCollections() {
        try {
            // Get overdue invoices
            const overdueInvoices = await this.runQuery(`
                SELECT bi.*, ba.user_id 
                FROM billing_invoices bi
                JOIN billing_accounts ba ON bi.account_id = ba.account_id
                WHERE bi.payment_status = 'pending'
                AND bi.due_date < date('now')
            `);
            
            for (const invoice of overdueInvoices) {
                await this.handleOverdueInvoice(invoice);
            }
            
        } catch (error) {
            console.error('❌ Collection process error:', error);
        }
    }
    
    async handleOverdueInvoice(invoice) {
        // Update unpaid bill count
        await this.runQuery(`
            UPDATE billing_accounts 
            SET unpaid_bills = unpaid_bills + 1
            WHERE account_id = ?
        `, [invoice.account_id]);
        
        // Check if account should be suspended
        const account = await this.getBillingAccount(invoice.account_id);
        
        if (account.unpaid_bills >= this.config.maxUnpaidBills) {
            await this.suspendAccount(account);
        } else {
            // Set grace period
            const gracePeriodEnd = new Date();
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.config.gracePeriodDays);
            
            await this.runQuery(`
                UPDATE billing_accounts 
                SET grace_period_ends = ?
                WHERE account_id = ?
            `, [gracePeriodEnd.toISOString().split('T')[0], account.account_id]);
        }
        
        console.log(`⚠️ Overdue invoice processed: ${invoice.invoice_id} ($${invoice.total_amount})`);
    }
    
    async suspendAccount(account) {
        await this.runQuery(`
            UPDATE billing_accounts 
            SET status = 'suspended'
            WHERE account_id = ?
        `, [account.account_id]);
        
        await this.logBillingEvent(account.account_id, 'account_suspended', {
            reason: 'unpaid_bills',
            unpaidBills: account.unpaid_bills
        });
        
        console.log(`🚫 Account suspended: ${account.account_id} (${account.unpaid_bills} unpaid bills)`);
    }
    
    // WebSocket and API handling
    handleWebSocket(ws) {
        console.log('💰 Billing client connected');
        
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());
                await this.handleWebSocketMessage(ws, data);
            } catch (error) {
                console.error('Billing WebSocket error:', error);
            }
        });
        
        ws.on('close', () => {
            console.log('💰 Billing client disconnected');
        });
        
        // Send welcome message
        ws.send(JSON.stringify({
            type: 'billing_connected',
            pricingTiers: Object.keys(this.pricingTiers),
            billingCycle: this.config.billingCycle,
            timestamp: new Date()
        }));
    }
    
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'get_account_status':
                if (data.accountId) {
                    const status = await this.getAccountStatus(data.accountId);
                    ws.send(JSON.stringify({
                        type: 'account_status',
                        accountId: data.accountId,
                        status
                    }));
                }
                break;
                
            case 'get_billing_analytics':
                const analytics = await this.getBillingAnalytics();
                ws.send(JSON.stringify({
                    type: 'billing_analytics',
                    analytics
                }));
                break;
        }
    }
    
    broadcastBillingUpdate(update) {
        const message = JSON.stringify({
            type: 'billing_update',
            ...update,
            timestamp: new Date()
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(message);
            }
        });
    }
    
    async handleRequest(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        const url = new URL(req.url, `http://localhost:${this.config.port}`);
        
        try {
            switch (url.pathname) {
                case '/':
                    await this.serveBillingDashboard(res);
                    break;
                case '/api/pricing':
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(this.pricingTiers));
                    break;
                case '/health':
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'billing', engine: '💰' }));
                    break;
                default:
                    res.writeHead(404);
                    res.end('Billing resource not found');
            }
        } catch (error) {
            console.error('Billing API error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Billing engine error' }));
        }
    }
    
    async serveBillingDashboard(res) {
        const dashboard = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💰 Usage Billing Engine</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .title { font-size: 36px; color: #333; margin-bottom: 10px; }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .card h3 { margin-top: 0; color: #555; }
        .tier { padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #007bff; }
        .tier.starter { border-left-color: #28a745; }
        .tier.growth { border-left-color: #ffc107; }
        .tier.scale { border-left-color: #fd7e14; }
        .tier.enterprise { border-left-color: #dc3545; }
        .pricing { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px; }
        .success-status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin: 2px; }
        .success-status.viral { background: #ff69b4; color: white; }
        .success-status.trending { background: #ff6347; color: white; }
        .success-status.popular { background: #ffa500; color: white; }
        .success-status.stable { background: #32cd32; color: white; }
        .success-status.declining { background: #ffd700; color: black; }
        .success-status.inactive { background: #gray; color: white; }
        .metric { text-align: center; padding: 10px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1 class="title">💰 Usage Billing Engine</h1>
            <p>Success-based pricing • Automatic billing • Stripe integration</p>
        </div>
        
        <div class="cards">
            <div class="card">
                <h3>🎯 Pricing Tiers</h3>
                <div class="tier starter">
                    <h4>Starter Platform</h4>
                    <div class="pricing">
                        <div>Base: $1.00</div>
                        <div>API: $0.001/call</div>
                        <div>Users: $0.01/user</div>
                        <div>Revenue: 2%</div>
                    </div>
                </div>
                <div class="tier growth">
                    <h4>Growth Platform</h4>
                    <div class="pricing">
                        <div>Base: $5.00</div>
                        <div>API: $0.0008/call</div>
                        <div>Users: $0.008/user</div>
                        <div>Revenue: 3%</div>
                    </div>
                </div>
                <div class="tier scale">
                    <h4>Scale Platform</h4>
                    <div class="pricing">
                        <div>Base: $25.00</div>
                        <div>API: $0.0005/call</div>
                        <div>Users: $0.005/user</div>
                        <div>Revenue: 5%</div>
                    </div>
                </div>
                <div class="tier enterprise">
                    <h4>Enterprise Platform</h4>
                    <div class="pricing">
                        <div>Base: $100.00</div>
                        <div>API: $0.0003/call</div>
                        <div>Users: $0.003/user</div>
                        <div>Revenue: 7%</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>🚀 Success Multipliers</h3>
                <p>Higher success = higher bills!</p>
                <div class="success-status viral">Viral (3.0x)</div>
                <div class="success-status trending">Trending (2.0x)</div>
                <div class="success-status popular">Popular (1.5x)</div>
                <div class="success-status stable">Stable (1.0x)</div>
                <div class="success-status declining">Declining (0.8x)</div>
                <div class="success-status inactive">Inactive (0.5x)</div>
            </div>
            
            <div class="card">
                <h3>📊 Billing Metrics</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                    <div class="metric">
                        <div class="metric-value" id="total-revenue">$0</div>
                        <div class="metric-label">Total Revenue</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value" id="active-accounts">0</div>
                        <div class="metric-label">Active Accounts</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value" id="avg-bill">$0</div>
                        <div class="metric-label">Avg Bill</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>⚡ Real-time Activity</h3>
                <div id="activity-log" style="max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px;">
                    <div>[${new Date().toLocaleTimeString()}] Billing engine initialized</div>
                    <div>[${new Date().toLocaleTimeString()}] Pricing tiers configured</div>
                    <div>[${new Date().toLocaleTimeString()}] Ready for success-based billing</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let ws = null;
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.config.wsPort}');
            
            ws.onopen = () => {
                console.log('Connected to billing engine');
                addActivity('Connected to billing WebSocket');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleBillingMessage(data);
            };
            
            ws.onclose = () => {
                console.log('Billing connection lost, reconnecting...');
                addActivity('Connection lost, reconnecting...');
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function handleBillingMessage(data) {
            switch (data.type) {
                case 'billing_connected':
                    addActivity('Billing engine connected');
                    break;
                case 'billing_update':
                    addActivity(\`Account billed: \${data.platformId} - $\${data.amount.toFixed(2)} (\${data.tier}, \${data.successStatus})\`);
                    updateMetrics();
                    break;
                case 'account_status':
                    console.log('Account status:', data.status);
                    break;
            }
        }
        
        function addActivity(message) {
            const log = document.getElementById('activity-log');
            const entry = document.createElement('div');
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            log.appendChild(entry);
            
            // Keep only last 20 entries
            while (log.children.length > 20) {
                log.removeChild(log.firstChild);
            }
            
            log.scrollTop = log.scrollHeight;
        }
        
        function updateMetrics() {
            // Simulate increasing metrics
            const revenue = document.getElementById('total-revenue');
            const accounts = document.getElementById('active-accounts');
            const avgBill = document.getElementById('avg-bill');
            
            const currentRevenue = parseFloat(revenue.textContent.replace('$', ''));
            const newRevenue = currentRevenue + Math.random() * 100 + 10;
            revenue.textContent = '$' + newRevenue.toFixed(0);
            
            const currentAccounts = parseInt(accounts.textContent);
            if (Math.random() > 0.8) {
                accounts.textContent = currentAccounts + 1;
            }
            
            const newAvgBill = newRevenue / Math.max(1, parseInt(accounts.textContent));
            avgBill.textContent = '$' + newAvgBill.toFixed(2);
        }
        
        // Initialize
        connectWebSocket();
        
        // Simulate some activity
        setInterval(() => {
            const activities = [
                'Platform metrics analyzed',
                'Billing cycle processed',
                'Success multiplier calculated',
                'Stripe invoice created',
                'Usage analytics updated',
                'Tier qualification checked'
            ];
            
            const activity = activities[Math.floor(Math.random() * activities.length)];
            addActivity(activity);
            
            if (Math.random() > 0.7) {
                updateMetrics();
            }
        }, 5000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboard);
    }
    
    // Utility methods
    async getBillingAccount(accountId) {
        const sql = 'SELECT * FROM billing_accounts WHERE account_id = ?';
        const result = await this.runQuery(sql, [accountId]);
        return result[0];
    }
    
    async getPlatformMetrics(platformId, startDate, endDate) {
        const sql = `
            SELECT * FROM platform_metrics 
            WHERE platform_id = ? 
            AND date BETWEEN ? AND ?
            ORDER BY date
        `;
        return await this.runQuery(sql, [platformId, startDate, endDate]);
    }
    
    async logBillingEvent(accountId, eventType, eventData, amount = null) {
        const sql = `
            INSERT INTO billing_events 
            (event_id, account_id, event_type, event_data, amount, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await this.runQuery(sql, [
            this.generateId('event'),
            accountId,
            eventType,
            JSON.stringify(eventData),
            amount,
            `${eventType}: ${JSON.stringify(eventData)}`
        ]);
    }
    
    async getAccountStatus(accountId) {
        const account = await this.getBillingAccount(accountId);
        if (!account) return null;
        
        const recentInvoices = await this.runQuery(`
            SELECT * FROM billing_invoices 
            WHERE account_id = ? 
            ORDER BY created_at DESC 
            LIMIT 5
        `, [accountId]);
        
        return {
            account,
            recentInvoices,
            status: account.status,
            tier: account.current_tier,
            totalBilled: account.total_billed,
            totalPaid: account.total_paid,
            unpaidBills: account.unpaid_bills
        };
    }
    
    async getBillingAnalytics() {
        const sql = `
            SELECT 
                COUNT(DISTINCT account_id) as total_accounts,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_accounts,
                SUM(total_billed) as total_revenue,
                AVG(total_billed) as avg_account_value,
                COUNT(CASE WHEN unpaid_bills > 0 THEN 1 END) as accounts_with_debt
            FROM billing_accounts
        `;
        
        return await this.runQuery(sql);
    }
    
    async handleBillingError(account, error) {
        await this.logBillingEvent(account.account_id, 'billing_error', {
            error: error.message,
            platformId: account.platform_id
        });
        
        console.error(`❌ Billing error for account ${account.account_id}:`, error);
    }
    
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (sql.toUpperCase().trim().startsWith('SELECT')) {
                this.db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            } else {
                this.db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve({ lastID: this.lastID, changes: this.changes });
                });
            }
        });
    }
}

module.exports = UsageBillingEngine;

// Demo if run directly
if (require.main === module) {
    const demo = async () => {
        console.log('💰 USAGE BILLING ENGINE DEMO');
        console.log('==============================\n');
        
        const billingEngine = new UsageBillingEngine({
            port: 5000,
            wsPort: 5001,
            billingCycle: 'monthly'
        });
        
        await billingEngine.init();
        
        // Demo: Create billing account
        const account = await billingEngine.createBillingAccount(
            'demo_user_789',
            'demo_platform_456',
            'cus_demo123',
            { billingEmail: 'demo@example.com' }
        );
        
        console.log('💰 Demo billing account created:');
        console.log(JSON.stringify(account, null, 2));
        
        // Demo: Calculate platform bill
        const billCalculation = await billingEngine.calculatePlatformBill(
            'demo_platform_456',
            '2024-01-01',
            '2024-01-31'
        );
        
        console.log('\n📊 Demo bill calculation:');
        console.log(JSON.stringify(billCalculation, null, 2));
        
        console.log('\n✅ Usage Billing Engine demo complete!');
        console.log('💰 Visit http://localhost:5000 to see the billing dashboard');
        console.log('📊 Real-time billing: ws://localhost:5001');
    };
    
    demo().catch(console.error);
}