#!/usr/bin/env node

/**
 * USER ACCOUNT & BILLING BRIDGE
 * 
 * Fixes the fundamental disconnect between API key generation and user billing.
 * Links generated API keys to user accounts, tracks token usage, and handles billing.
 * 
 * Architecture:
 * User Account ↔ API Keys ↔ Token Usage ↔ Stripe Billing ↔ Analytics Dashboard
 */

const DomainSpecificAPIKeyManager = require('./DomainSpecificAPIKeyManager');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

console.log(`
💳🔑 USER ACCOUNT & BILLING BRIDGE 💳🔑
Connecting API keys → User accounts → Billing → Analytics
`);

class UserAccountBillingBridge extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      port: options.port || 8889,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      usageTrackingInterval: 1000, // 1 second
      billingCycle: 'monthly',
      freeUsageLimit: 1000, // Free tokens per month
      pricingTiers: {
        free: { limit: 1000, price: 0 },
        starter: { limit: 10000, price: 999 }, // $9.99/month
        pro: { limit: 100000, price: 2999 }, // $29.99/month  
        enterprise: { limit: 1000000, price: 9999 } // $99.99/month
      }
    };

    // Internal state
    this.users = new Map(); // userId -> user data
    this.userApiKeys = new Map(); // userId -> [apiKeys]
    this.apiKeyToUser = new Map(); // apiKey -> userId  
    this.usageData = new Map(); // userId -> usage stats
    this.billingQueue = []; // Pending billing events
    
    // Initialize components
    this.apiKeyManager = null;
    this.app = express();
    
    this.initialize();
  }

  async initialize() {
    console.log('💳 Initializing User Account & Billing Bridge...');
    
    // Initialize API Key Manager
    this.apiKeyManager = new DomainSpecificAPIKeyManager({
      enableUsageTracking: true,
      enableBYOK: true
    });
    
    // Setup Express middleware
    this.app.use(express.json());
    this.app.use('/webhook', express.raw({ type: 'application/json' }));
    
    // Load existing data
    await this.loadUserData();
    
    // Setup API routes
    this.setupAPIRoutes();
    
    // Start usage tracking
    this.startUsageTracking();
    
    // Start billing processor
    this.startBillingProcessor();
    
    console.log('✅ User Account & Billing Bridge ready!');
  }

  // ==================== USER MANAGEMENT ====================
  
  async createUser(userData) {
    const userId = userData.id || crypto.randomUUID();
    
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: userData.email,
      name: userData.name,
      metadata: { userId: userId }
    });

    const user = {
      id: userId,
      email: userData.email,
      name: userData.name,
      stripeCustomerId: customer.id,
      tier: 'free',
      createdAt: new Date().toISOString(),
      apiKeys: [],
      usage: {
        currentMonth: 0,
        totalTokens: 0,
        lastBilling: null,
        limit: this.config.pricingTiers.free.limit
      },
      billing: {
        subscriptionId: null,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: this.getNextBillingDate().toISOString()
      }
    };

    this.users.set(userId, user);
    this.userApiKeys.set(userId, []);
    this.usageData.set(userId, { tokens: 0, requests: 0, lastUpdated: new Date() });
    
    await this.saveUserData();
    
    console.log(`👤 Created user: ${userData.email} (${userId})`);
    return user;
  }

  async updateUserTier(userId, newTier) {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found`);
    
    const tierConfig = this.config.pricingTiers[newTier];
    if (!tierConfig) throw new Error(`Invalid tier: ${newTier}`);

    // Cancel existing subscription if downgrading to free
    if (newTier === 'free' && user.billing.subscriptionId) {
      await stripe.subscriptions.cancel(user.billing.subscriptionId);
      user.billing.subscriptionId = null;
    }
    
    // Create subscription for paid tiers
    if (newTier !== 'free' && !user.billing.subscriptionId) {
      const subscription = await stripe.subscriptions.create({
        customer: user.stripeCustomerId,
        items: [{ price: `price_${newTier}` }], // You'd create these in Stripe dashboard
        billing_cycle_anchor: Math.floor(Date.now() / 1000),
      });
      
      user.billing.subscriptionId = subscription.id;
    }
    
    user.tier = newTier;
    user.usage.limit = tierConfig.limit;
    
    await this.saveUserData();
    
    console.log(`📈 Updated ${user.email} to ${newTier} tier`);
    return user;
  }

  // ==================== API KEY MANAGEMENT ====================
  
  async createUserAPIKey(userId, provider, options = {}) {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found`);
    
    // Register domain in API key manager if needed
    if (!this.apiKeyManager.domains.has(provider)) {
      await this.apiKeyManager.registerDomain(provider, {
        enableAutoRotation: true,
        allowBYOK: true
      });
    }
    
    // Generate API key
    const keyResult = await this.apiKeyManager.generateApiKey(provider, {
      ...options,
      createdBy: userId,
      metadata: {
        userId: userId,
        userEmail: user.email,
        userTier: user.tier
      }
    });
    
    // Link key to user
    const userKeys = this.userApiKeys.get(userId);
    userKeys.push({
      keyId: keyResult.keyId,
      apiKey: keyResult.apiKey, // Store temporarily for return
      provider: provider,
      createdAt: new Date().toISOString(),
      usage: { tokens: 0, requests: 0, cost: 0 }
    });
    
    user.apiKeys.push(keyResult.keyId);
    this.apiKeyToUser.set(keyResult.apiKey, userId);
    
    await this.saveUserData();
    
    console.log(`🔑 Generated API key for ${user.email}: ${provider}`);
    
    // Return key (remove from memory after return)
    const result = { ...keyResult, userId, userTier: user.tier };
    setTimeout(() => {
      // Clear API key from memory for security
      userKeys.forEach(key => {
        if (key.keyId === keyResult.keyId) {
          delete key.apiKey;
        }
      });
    }, 1000);
    
    return result;
  }

  async trackAPIKeyUsage(apiKey, usage) {
    const userId = this.apiKeyToUser.get(apiKey);
    if (!userId) {
      console.warn(`⚠️ No user found for API key: ${apiKey.slice(0, 10)}...`);
      return;
    }
    
    const user = this.users.get(userId);
    const userKeys = this.userApiKeys.get(userId);
    const userUsage = this.usageData.get(userId);
    
    if (!user || !userKeys || !userUsage) return;
    
    // Update user usage stats
    userUsage.tokens += usage.tokens || 0;
    userUsage.requests += 1;
    userUsage.lastUpdated = new Date();
    
    user.usage.currentMonth += usage.tokens || 0;
    user.usage.totalTokens += usage.tokens || 0;
    
    // Update specific API key usage
    const keyData = userKeys.find(k => k.keyId === usage.keyId);
    if (keyData) {
      keyData.usage.tokens += usage.tokens || 0;
      keyData.usage.requests += 1;
      keyData.usage.cost += this.calculateCost(usage.tokens || 0, user.tier);
    }
    
    // Check usage limits
    await this.checkUsageLimits(userId);
    
    // Queue billing event if needed
    if (user.tier !== 'free') {
      this.queueBillingEvent(userId, usage);
    }
    
    this.emit('usage-tracked', { userId, usage, user });
  }

  async checkUsageLimits(userId) {
    const user = this.users.get(userId);
    if (!user) return;
    
    const usagePercentage = (user.usage.currentMonth / user.usage.limit) * 100;
    
    // Warn at 80% usage
    if (usagePercentage >= 80 && usagePercentage < 100) {
      this.emit('usage-warning', { userId, percentage: usagePercentage });
      console.log(`⚠️ ${user.email} at ${usagePercentage.toFixed(1)}% usage limit`);
    }
    
    // Block at 100% usage for free tier
    if (usagePercentage >= 100 && user.tier === 'free') {
      this.emit('usage-limit-exceeded', { userId, user });
      console.log(`🚫 ${user.email} exceeded free tier limit`);
      return false;
    }
    
    return true;
  }

  // ==================== BILLING & PAYMENTS ====================
  
  queueBillingEvent(userId, usage) {
    this.billingQueue.push({
      userId,
      usage,
      timestamp: new Date().toISOString(),
      cost: this.calculateCost(usage.tokens || 0, this.users.get(userId)?.tier)
    });
  }

  calculateCost(tokens, tier) {
    // Example pricing: $0.001 per 1000 tokens for paid tiers
    const costPer1000Tokens = {
      free: 0,
      starter: 0.001,
      pro: 0.0008, // Volume discount
      enterprise: 0.0005 // Better volume discount
    };
    
    return (tokens / 1000) * (costPer1000Tokens[tier] || 0);
  }

  async processBillingQueue() {
    if (this.billingQueue.length === 0) return;
    
    console.log(`💰 Processing ${this.billingQueue.length} billing events...`);
    
    // Group by user for batch processing
    const userBilling = new Map();
    
    this.billingQueue.forEach(event => {
      if (!userBilling.has(event.userId)) {
        userBilling.set(event.userId, { cost: 0, usage: 0, events: [] });
      }
      
      const billing = userBilling.get(event.userId);
      billing.cost += event.cost;
      billing.usage += event.usage.tokens || 0;
      billing.events.push(event);
    });
    
    // Process billing for each user
    for (const [userId, billing] of userBilling) {
      await this.createUsageInvoiceItem(userId, billing);
    }
    
    // Clear processed events
    this.billingQueue = [];
  }

  async createUsageInvoiceItem(userId, billing) {
    const user = this.users.get(userId);
    if (!user || user.tier === 'free' || billing.cost <= 0) return;
    
    try {
      // Create invoice item for usage-based billing
      await stripe.invoiceItems.create({
        customer: user.stripeCustomerId,
        amount: Math.round(billing.cost * 100), // Convert to cents
        currency: 'usd',
        description: `API usage: ${billing.usage} tokens`,
        metadata: {
          userId: userId,
          tokens: billing.usage,
          period: new Date().toISOString().slice(0, 7) // YYYY-MM
        }
      });
      
      console.log(`💳 Created invoice item for ${user.email}: $${billing.cost.toFixed(4)}`);
      
    } catch (error) {
      console.error(`Failed to create invoice item for ${userId}:`, error);
    }
  }

  // ==================== ANALYTICS & REPORTING ====================
  
  getUserAnalytics(userId) {
    const user = this.users.get(userId);
    const userKeys = this.userApiKeys.get(userId);
    const userUsage = this.usageData.get(userId);
    
    if (!user || !userKeys || !userUsage) {
      return null;
    }
    
    return {
      user: {
        id: userId,
        email: user.email,
        tier: user.tier,
        createdAt: user.createdAt
      },
      usage: {
        currentMonth: user.usage.currentMonth,
        totalTokens: user.usage.totalTokens,
        limit: user.usage.limit,
        percentage: (user.usage.currentMonth / user.usage.limit) * 100,
        requests: userUsage.requests
      },
      billing: {
        subscriptionId: user.billing.subscriptionId,
        currentPeriodStart: user.billing.currentPeriodStart,
        currentPeriodEnd: user.billing.currentPeriodEnd,
        estimatedCost: this.calculateCost(user.usage.currentMonth, user.tier)
      },
      apiKeys: userKeys.map(key => ({
        keyId: key.keyId,
        provider: key.provider,
        createdAt: key.createdAt,
        usage: key.usage
      }))
    };
  }

  getAllUsageAnalytics() {
    const analytics = {
      totalUsers: this.users.size,
      totalApiKeys: this.apiKeyToUser.size,
      usageByTier: {},
      totalUsage: 0,
      totalRevenue: 0
    };
    
    for (const [userId, user] of this.users) {
      const tier = user.tier;
      
      if (!analytics.usageByTier[tier]) {
        analytics.usageByTier[tier] = {
          users: 0,
          tokens: 0,
          revenue: 0
        };
      }
      
      analytics.usageByTier[tier].users++;
      analytics.usageByTier[tier].tokens += user.usage.currentMonth;
      analytics.usageByTier[tier].revenue += this.calculateCost(user.usage.currentMonth, tier);
      
      analytics.totalUsage += user.usage.currentMonth;
      analytics.totalRevenue += this.calculateCost(user.usage.currentMonth, tier);
    }
    
    return analytics;
  }

  // ==================== API ROUTES ====================
  
  setupAPIRoutes() {
    // User management
    this.app.post('/users', async (req, res) => {
      try {
        const user = await this.createUser(req.body);
        res.json({ success: true, user });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });
    
    this.app.put('/users/:userId/tier', async (req, res) => {
      try {
        const user = await this.updateUserTier(req.params.userId, req.body.tier);
        res.json({ success: true, user });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });
    
    // API key management
    this.app.post('/users/:userId/api-keys', async (req, res) => {
      try {
        const keyResult = await this.createUserAPIKey(
          req.params.userId,
          req.body.provider,
          req.body.options
        );
        res.json({ success: true, apiKey: keyResult });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });
    
    // Usage tracking (called by API key manager)
    this.app.post('/usage', async (req, res) => {
      try {
        await this.trackAPIKeyUsage(req.body.apiKey, req.body.usage);
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });
    
    // Analytics
    this.app.get('/users/:userId/analytics', (req, res) => {
      const analytics = this.getUserAnalytics(req.params.userId);
      if (analytics) {
        res.json({ success: true, analytics });
      } else {
        res.status(404).json({ success: false, error: 'User not found' });
      }
    });
    
    this.app.get('/analytics', (req, res) => {
      const analytics = this.getAllUsageAnalytics();
      res.json({ success: true, analytics });
    });
    
    // Stripe webhook
    this.app.post('/webhook/stripe', async (req, res) => {
      try {
        const sig = req.headers['stripe-signature'];
        const event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          this.config.stripeWebhookSecret
        );
        
        await this.handleStripeWebhook(event);
        res.json({ received: true });
      } catch (error) {
        console.error('Stripe webhook error:', error);
        res.status(400).send('Webhook error');
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'User Account & Billing Bridge',
        users: this.users.size,
        apiKeys: this.apiKeyToUser.size,
        billingQueue: this.billingQueue.length
      });
    });
  }

  async handleStripeWebhook(event) {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancellation(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;
    }
  }

  async handleSubscriptionUpdate(subscription) {
    // Find user by Stripe customer ID
    const user = Array.from(this.users.values())
      .find(u => u.stripeCustomerId === subscription.customer);
      
    if (user) {
      user.billing.subscriptionId = subscription.id;
      user.billing.currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
      user.billing.currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      await this.saveUserData();
      console.log(`📅 Updated subscription for ${user.email}`);
    }
  }

  // ==================== BACKGROUND PROCESSES ====================
  
  startUsageTracking() {
    setInterval(async () => {
      // Hook into API key manager usage events
      if (this.apiKeyManager) {
        // This would ideally be an event listener on the API key manager
        // For now, we can poll or enhance the API key manager to emit events
      }
    }, this.config.usageTrackingInterval);
  }

  startBillingProcessor() {
    // Process billing queue every minute
    setInterval(async () => {
      await this.processBillingQueue();
    }, 60 * 1000);
    
    // Monthly billing cycle reset
    setInterval(async () => {
      await this.resetMonthlyUsage();
    }, 24 * 60 * 60 * 1000); // Check daily
  }

  async resetMonthlyUsage() {
    const now = new Date();
    
    for (const [userId, user] of this.users) {
      const periodEnd = new Date(user.billing.currentPeriodEnd);
      
      if (now >= periodEnd) {
        // Reset monthly usage
        user.usage.currentMonth = 0;
        user.billing.currentPeriodStart = now.toISOString();
        user.billing.currentPeriodEnd = this.getNextBillingDate(now).toISOString();
        
        console.log(`🔄 Reset monthly usage for ${user.email}`);
      }
    }
    
    await this.saveUserData();
  }

  // ==================== DATA PERSISTENCE ====================
  
  async loadUserData() {
    try {
      const dataPath = path.join(__dirname, '.user-billing-data');
      const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
      
      // Restore Maps from JSON
      this.users = new Map(data.users || []);
      this.userApiKeys = new Map(data.userApiKeys || []);
      this.apiKeyToUser = new Map(data.apiKeyToUser || []);
      this.usageData = new Map(data.usageData || []);
      
      console.log(`📂 Loaded ${this.users.size} users from storage`);
    } catch (error) {
      console.log('📂 No existing user data found, starting fresh');
    }
  }

  async saveUserData() {
    try {
      const dataPath = path.join(__dirname, '.user-billing-data');
      const data = {
        users: Array.from(this.users.entries()),
        userApiKeys: Array.from(this.userApiKeys.entries()),
        apiKeyToUser: Array.from(this.apiKeyToUser.entries()),
        usageData: Array.from(this.usageData.entries())
      };
      
      await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }

  // ==================== UTILITY METHODS ====================
  
  getNextBillingDate(fromDate = new Date()) {
    const nextMonth = new Date(fromDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1); // First of next month
    return nextMonth;
  }

  // ==================== CLI & SERVER ====================
  
  async start() {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        console.log(`💳 User Account & Billing Bridge running on port ${this.config.port}`);
        console.log(`   API endpoints: http://localhost:${this.config.port}`);
        console.log(`   Health check: http://localhost:${this.config.port}/health`);
        resolve();
      });
    });
  }

  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'start':
        await this.start();
        break;

      case 'create-user':
        if (args.length < 3) {
          console.error('Usage: create-user <email> <name>');
          process.exit(1);
        }
        const user = await this.createUser({
          email: args[1],
          name: args[2]
        });
        console.log('User created:', user);
        break;

      case 'analytics':
        const analytics = this.getAllUsageAnalytics();
        console.log(JSON.stringify(analytics, null, 2));
        break;

      case 'user-analytics':
        if (!args[1]) {
          console.error('Usage: user-analytics <userId>');
          process.exit(1);
        }
        const userAnalytics = this.getUserAnalytics(args[1]);
        console.log(JSON.stringify(userAnalytics, null, 2));
        break;

      default:
        console.log(`
💳 User Account & Billing Bridge CLI

Commands:
  start                           - Start the billing bridge server
  create-user <email> <name>      - Create a new user account
  analytics                       - Show system-wide analytics
  user-analytics <userId>         - Show analytics for specific user

🔗 Integration:
  • Links API keys to user accounts
  • Tracks token usage per user
  • Handles Stripe billing automatically
  • Provides usage analytics dashboard

🎯 Endpoints:
  POST /users                     - Create user account
  POST /users/:id/api-keys        - Generate API key for user
  POST /usage                     - Track API key usage
  GET /users/:id/analytics        - Get user analytics
  GET /analytics                  - Get system analytics
  POST /webhook/stripe            - Stripe webhook handler

Ready to connect your users to their API usage and billing! 💳
        `);
    }
  }
}

// Export for use as module
module.exports = UserAccountBillingBridge;

// Run CLI if called directly
if (require.main === module) {
  const bridge = new UserAccountBillingBridge();
  bridge.cli().catch(console.error);
}