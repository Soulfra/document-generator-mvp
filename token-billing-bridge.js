#!/usr/bin/env node

/**
 * TOKEN BILLING BRIDGE
 * Integrates token economy with real API billing
 * Handles token deductions when making LLM API calls
 */

const EventEmitter = require('events');
const TokenToAPICostMapper = require('./token-to-api-cost-mapper');
const RealAPICostCalculator = require('./FinishThisIdea/ai-os-clean/real-api-cost-calculator');

class TokenBillingBridge extends EventEmitter {
  constructor() {
    super();
    
    // Core components
    this.tokenMapper = new TokenToAPICostMapper();
    this.apiCostCalculator = new RealAPICostCalculator();
    
    // User token balances (in production, this would be from database)
    this.userBalances = new Map();
    
    // Transaction history
    this.transactions = [];
    
    // Billing configuration
    this.config = {
      requirePrePayment: true,      // Check balance before API call
      allowDebt: false,             // Allow negative balances
      maxDebt: 1000,               // Max debt in tokens
      autoBuyTokens: false,         // Auto-purchase tokens if insufficient
      defaultTokenType: 'AGENT_COIN' // Default token for payments
    };
    
    // API call queue for failed payments
    this.pendingCalls = new Map();
    
    console.log('🌉 Token Billing Bridge initialized');
    this.setupEventListeners();
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for token mapper events
    this.tokenMapper.on('apiCallBilled', (event) => {
      this.emit('tokenDeducted', event);
    });
  }
  
  /**
   * Initialize user with default balances
   */
  initializeUser(userId) {
    if (!this.userBalances.has(userId)) {
      this.userBalances.set(userId, {
        'AGENT_COIN': 1000,      // Welcome bonus
        'VIBES_COIN': 500,
        'MEME_TOKEN': 100,
        'DATABASE_TOKEN': 5000,
        'FART': 100,
        'ENERGY': 1000,
        'DEEPTOKEN': 10000,      // For DeepSeek calls
        'CHAPTER7': 0,           // Premium token, must be earned/bought
        'TKES': 10               // Technical knowledge tokens
      });
      
      console.log(`👤 Initialized user ${userId} with welcome tokens`);
    }
    
    return this.userBalances.get(userId);
  }
  
  /**
   * Get user token balances
   */
  getUserBalances(userId) {
    return this.userBalances.get(userId) || this.initializeUser(userId);
  }
  
  /**
   * Check if user can afford API call
   */
  async canAffordAPICall(userId, apiCallDetails) {
    const { provider, model, estimatedInputTokens, estimatedOutputTokens, taskType } = apiCallDetails;
    
    // Get user balances
    const balances = this.getUserBalances(userId);
    
    // Calculate cost
    const usdCost = this.tokenMapper.calculateAPICostUSD(
      provider,
      model,
      estimatedInputTokens,
      estimatedOutputTokens
    );
    
    // Check if user has sufficient tokens
    const payment = this.tokenMapper.getOptimalTokenMix(usdCost, balances, taskType);
    
    return {
      canAfford: payment.sufficient,
      payment,
      missingUSD: payment.remainingUSD,
      suggestion: this.getSuggestion(payment, balances)
    };
  }
  
  /**
   * Pre-authorize API call
   */
  async preAuthorizeAPICall(userId, apiCallDetails) {
    const affordability = await this.canAffordAPICall(userId, apiCallDetails);
    
    if (!affordability.canAfford && this.config.requirePrePayment && !this.config.allowDebt) {
      throw new Error(`Insufficient tokens. Need $${affordability.missingUSD.toFixed(6)} more. ${affordability.suggestion}`);
    }
    
    // Create pre-authorization
    const preAuthId = this.generatePreAuthId();
    const preAuth = {
      id: preAuthId,
      userId,
      apiCallDetails,
      estimatedPayment: affordability.payment,
      status: 'authorized',
      createdAt: Date.now(),
      expiresAt: Date.now() + 300000 // 5 minutes
    };
    
    this.pendingCalls.set(preAuthId, preAuth);
    
    return {
      preAuthId,
      estimatedCost: affordability.payment,
      authorized: true
    };
  }
  
  /**
   * Process API call and deduct tokens
   */
  async processAPICall(userId, preAuthId, actualUsage) {
    const preAuth = this.pendingCalls.get(preAuthId);
    
    if (!preAuth) {
      throw new Error('Invalid or expired pre-authorization');
    }
    
    if (preAuth.expiresAt < Date.now()) {
      this.pendingCalls.delete(preAuthId);
      throw new Error('Pre-authorization expired');
    }
    
    // Calculate actual cost based on real usage
    const actualCost = this.tokenMapper.calculateAPICostUSD(
      actualUsage.provider,
      actualUsage.model,
      actualUsage.inputTokens,
      actualUsage.outputTokens
    );
    
    // Get user balances
    const balances = this.getUserBalances(userId);
    
    // Calculate payment with actual cost
    const payment = this.tokenMapper.getOptimalTokenMix(
      actualCost,
      balances,
      preAuth.apiCallDetails.taskType
    );
    
    if (!payment.sufficient && !this.config.allowDebt) {
      throw new Error(`Insufficient tokens for actual usage. Need $${payment.remainingUSD.toFixed(6)} more`);
    }
    
    // Deduct tokens
    for (const item of payment.tokenMix) {
      const totalDeduction = item.amount + item.burnAmount;
      balances[item.token] = Math.max(0, balances[item.token] - totalDeduction);
      
      // Track burned tokens
      if (item.burnAmount > 0) {
        this.emit('tokensBurned', {
          userId,
          token: item.token,
          amount: item.burnAmount,
          reason: 'api_call'
        });
      }
    }
    
    // Record transaction
    const transaction = {
      id: this.generateTransactionId(),
      userId,
      preAuthId,
      timestamp: Date.now(),
      apiCall: {
        ...preAuth.apiCallDetails,
        ...actualUsage
      },
      payment,
      status: 'completed'
    };
    
    this.transactions.push(transaction);
    this.pendingCalls.delete(preAuthId);
    
    // Emit events
    this.emit('apiCallProcessed', transaction);
    
    return {
      transactionId: transaction.id,
      payment,
      remainingBalances: { ...balances }
    };
  }
  
  /**
   * Direct billing without pre-authorization (for trusted services)
   */
  async directBilling(userId, apiUsage) {
    const { provider, model, inputTokens, outputTokens, taskType = 'ai_generation' } = apiUsage;
    
    // Get balances
    const balances = this.getUserBalances(userId);
    
    // Process billing
    const payment = await this.tokenMapper.processAPICallBilling(
      userId,
      apiUsage,
      balances
    );
    
    // Deduct tokens
    for (const item of payment.tokenMix) {
      const totalDeduction = item.amount + item.burnAmount;
      balances[item.token] -= totalDeduction;
    }
    
    // Record transaction
    const transaction = {
      id: this.generateTransactionId(),
      userId,
      timestamp: Date.now(),
      apiCall: apiUsage,
      payment,
      status: 'completed',
      type: 'direct'
    };
    
    this.transactions.push(transaction);
    
    return transaction;
  }
  
  /**
   * Get billing history for user
   */
  getBillingHistory(userId, options = {}) {
    const userTransactions = this.transactions.filter(tx => tx.userId === userId);
    
    if (options.startDate || options.endDate) {
      return userTransactions.filter(tx => {
        if (options.startDate && tx.timestamp < options.startDate) return false;
        if (options.endDate && tx.timestamp > options.endDate) return false;
        return true;
      });
    }
    
    return userTransactions;
  }
  
  /**
   * Generate billing report
   */
  generateUserReport(userId, period = 'all') {
    const transactions = this.getBillingHistory(userId);
    const report = this.tokenMapper.generateBillingReport(transactions);
    
    // Add user-specific data
    report.userId = userId;
    report.currentBalances = this.getUserBalances(userId);
    report.period = period;
    
    return report;
  }
  
  /**
   * Credit tokens to user (for purchases, rewards, etc.)
   */
  creditTokens(userId, tokenType, amount, reason = 'credit') {
    const balances = this.getUserBalances(userId);
    
    if (!balances[tokenType]) {
      balances[tokenType] = 0;
    }
    
    balances[tokenType] += amount;
    
    // Record credit transaction
    const transaction = {
      id: this.generateTransactionId(),
      userId,
      timestamp: Date.now(),
      type: 'credit',
      token: tokenType,
      amount,
      reason,
      newBalance: balances[tokenType]
    };
    
    this.emit('tokensCreditted', transaction);
    
    return transaction;
  }
  
  /**
   * Exchange tokens (using exchange rates)
   */
  async exchangeTokens(userId, fromToken, toToken, fromAmount) {
    const balances = this.getUserBalances(userId);
    
    // Check balance
    if (balances[fromToken] < fromAmount) {
      throw new Error(`Insufficient ${fromToken} balance`);
    }
    
    // Calculate exchange
    const fromUSD = this.tokenMapper.tokensToUSD(fromAmount, fromToken);
    const toAmount = this.tokenMapper.usdToTokens(fromUSD * 0.98, toToken); // 2% exchange fee
    
    // Execute exchange
    balances[fromToken] -= fromAmount;
    balances[toToken] = (balances[toToken] || 0) + toAmount;
    
    // Record exchange
    const transaction = {
      id: this.generateTransactionId(),
      userId,
      timestamp: Date.now(),
      type: 'exchange',
      from: { token: fromToken, amount: fromAmount },
      to: { token: toToken, amount: toAmount },
      fee: fromUSD * 0.02,
      rate: toAmount / fromAmount
    };
    
    this.emit('tokensExchanged', transaction);
    
    return transaction;
  }
  
  /**
   * Get suggestion for insufficient balance
   */
  getSuggestion(payment, balances) {
    const suggestions = [];
    
    // Check which tokens user has but didn't use
    for (const [token, balance] of Object.entries(balances)) {
      if (balance > 100 && !payment.tokenMix.find(item => item.token === token)) {
        suggestions.push(`You have ${balance} ${token} available`);
      }
    }
    
    // Suggest earning methods
    if (payment.remainingUSD > 0.01) {
      suggestions.push('Complete tasks to earn more tokens');
      suggestions.push('Exchange other tokens for AGENT_COIN');
    }
    
    return suggestions.join('. ');
  }
  
  // Helper methods
  generatePreAuthId() {
    return `PRE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateTransactionId() {
    return `TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Demo usage
if (require.main === module) {
  async function demo() {
    console.log('🚀 TOKEN BILLING BRIDGE DEMO\n');
    
    const bridge = new TokenBillingBridge();
    const userId = 'demo_user_123';
    
    // Initialize user
    console.log('👤 User Balances:');
    const balances = bridge.initializeUser(userId);
    console.log(balances);
    
    // Test API call affordability
    console.log('\n💳 Testing API Call Affordability:');
    
    const apiCall = {
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307',
      estimatedInputTokens: 5000,
      estimatedOutputTokens: 2000,
      taskType: 'ai_generation'
    };
    
    const affordability = await bridge.canAffordAPICall(userId, apiCall);
    console.log(`Can afford: ${affordability.canAfford}`);
    console.log('Payment plan:', affordability.payment.tokenMix);
    
    // Pre-authorize call
    console.log('\n🔐 Pre-authorizing API call...');
    const preAuth = await bridge.preAuthorizeAPICall(userId, apiCall);
    console.log(`Pre-auth ID: ${preAuth.preAuthId}`);
    
    // Simulate actual API usage
    console.log('\n📞 Processing actual API call...');
    const actualUsage = {
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307',
      inputTokens: 4500,  // Slightly less than estimated
      outputTokens: 2500  // Slightly more than estimated
    };
    
    const result = await bridge.processAPICall(userId, preAuth.preAuthId, actualUsage);
    console.log('Transaction ID:', result.transactionId);
    console.log('Tokens deducted:', result.payment.tokenMix);
    console.log('\n💰 Remaining balances:');
    console.log(result.remainingBalances);
    
    // Test token exchange
    console.log('\n💱 Testing token exchange...');
    const exchange = await bridge.exchangeTokens(userId, 'DATABASE_TOKEN', 'AGENT_COIN', 1000);
    console.log(`Exchanged ${exchange.from.amount} ${exchange.from.token} for ${exchange.to.amount} ${exchange.to.token}`);
    
    // Generate report
    console.log('\n📊 User Billing Report:');
    const report = bridge.generateUserReport(userId);
    console.log('Total USD spent:', report.totalUSD.toFixed(6));
    console.log('Tokens used:', report.totalTokens);
    console.log('Tokens burned:', report.totalBurned);
    
    // Test direct billing
    console.log('\n⚡ Testing direct billing...');
    const directCall = {
      provider: 'deepseek',
      model: 'deepseek-chat',
      inputTokens: 1000,
      outputTokens: 500,
      taskType: 'chat_conversation'
    };
    
    const directTx = await bridge.directBilling(userId, directCall);
    console.log('Direct billing completed:', directTx.id);
    
    console.log('\n✅ Token Billing Bridge demo complete!');
  }
  
  demo().catch(console.error);
}

module.exports = TokenBillingBridge;