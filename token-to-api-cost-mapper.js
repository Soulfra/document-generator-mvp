#!/usr/bin/env node

/**
 * TOKEN TO API COST MAPPER
 * Bridges internal token economies with real LLM API costs
 * Connects agent coins, TKES, etc. with actual API billing
 */

const EventEmitter = require('events');

class TokenToAPICostMapper extends EventEmitter {
  constructor() {
    super();
    
    // Token exchange rates to USD
    this.tokenToUSD = {
      // Primary tokens
      'AGENT_COIN': 0.001,      // 1000 AGENT = $1
      'AGT': 0.001,             // Same as AGENT_COIN
      'VIBES_COIN': 0.0005,     // 2000 VIBES = $1
      'VIB': 0.0005,            // Same as VIBES_COIN
      'MEME_TOKEN': 0.002,      // 500 MEME = $1
      'MEME': 0.002,            // Same as MEME_TOKEN
      'DATABASE_TOKEN': 0.0001, // 10000 DBT = $1
      'DBT': 0.0001,            // Same as DATABASE_TOKEN
      'FART': 0.01,             // 100 FART = $1
      'ENERGY': 0.0002,         // 5000 NRG = $1
      'NRG': 0.0002,            // Same as ENERGY
      
      // Game tokens
      'ZOMBIE_COIN': 0.0008,    // 1250 ZOMBIE = $1
      'SHIP_COIN': 0.00067,     // 1500 SHIP = $1 (1.5x AGENT)
      'ARENA_COIN': 0.0015,     // 667 ARENA = $1
      
      // Special tokens
      'TKES': 0.005,            // 200 TKES = $1
      'CHAPTER7': 0.1,          // 10 CHAPTER7 = $1 (premium token)
      'DEEPTOKEN': 0.0001,      // 10000 DEEP = $1 (for DeepSeek calls)
    };
    
    // API cost per million tokens (from real-api-cost-calculator.js)
    this.apiPricing = {
      'deepseek': {
        'deepseek-chat': {
          input: 0.14,   // $0.14/M tokens
          output: 0.28   // $0.28/M tokens
        }
      },
      'anthropic': {
        'claude-3-haiku-20240307': {
          input: 0.25,
          output: 1.25
        },
        'claude-3-sonnet': {
          input: 3.0,
          output: 15.0
        },
        'claude-3-opus': {
          input: 15.0,
          output: 75.0
        }
      },
      'openai': {
        'gpt-3.5-turbo': {
          input: 0.50,
          output: 1.50
        },
        'gpt-4': {
          input: 30.0,
          output: 60.0
        },
        'gpt-4-turbo': {
          input: 10.0,
          output: 30.0
        }
      }
    };
    
    // Token spending preferences by task type
    this.taskTokenPreferences = {
      'document_processing': ['AGENT_COIN', 'DATABASE_TOKEN'],
      'ai_generation': ['AGENT_COIN', 'TKES', 'DEEPTOKEN'],
      'chat_conversation': ['VIBES_COIN', 'AGENT_COIN'],
      'code_generation': ['AGENT_COIN', 'CHAPTER7'],
      'game_ai': ['ARENA_COIN', 'ZOMBIE_COIN', 'SHIP_COIN'],
      'meme_generation': ['MEME_TOKEN', 'VIBES_COIN'],
      'data_analysis': ['DATABASE_TOKEN', 'AGENT_COIN'],
      'premium_ai': ['CHAPTER7', 'TKES']
    };
    
    // Token burn rates (percentage burned on API calls)
    this.tokenBurnRates = {
      'AGENT_COIN': 0,      // No burn
      'VIBES_COIN': 5,      // 5% burn for social proof
      'MEME_TOKEN': 10,     // 10% burn for virality
      'DATABASE_TOKEN': 0,  // No burn
      'FART': 50,          // 50% burn (deflationary joke token)
      'CHAPTER7': 0,       // Premium token, no burn
      'DEEPTOKEN': 2       // 2% burn for sustainability
    };
    
    console.log('💰 Token to API Cost Mapper initialized');
  }
  
  /**
   * Convert USD cost to tokens
   */
  usdToTokens(usdAmount, tokenType) {
    const rate = this.tokenToUSD[tokenType];
    if (!rate) {
      throw new Error(`Unknown token type: ${tokenType}`);
    }
    
    return Math.ceil(usdAmount / rate);
  }
  
  /**
   * Convert tokens to USD
   */
  tokensToUSD(tokenAmount, tokenType) {
    const rate = this.tokenToUSD[tokenType];
    if (!rate) {
      throw new Error(`Unknown token type: ${tokenType}`);
    }
    
    return tokenAmount * rate;
  }
  
  /**
   * Calculate API cost in USD
   */
  calculateAPICostUSD(provider, model, inputTokens, outputTokens) {
    const pricing = this.apiPricing[provider]?.[model];
    if (!pricing) {
      throw new Error(`Unknown provider/model: ${provider}/${model}`);
    }
    
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;
    
    return inputCost + outputCost;
  }
  
  /**
   * Calculate API cost in tokens
   */
  calculateAPICostInTokens(provider, model, inputTokens, outputTokens, tokenType) {
    const usdCost = this.calculateAPICostUSD(provider, model, inputTokens, outputTokens);
    return this.usdToTokens(usdCost, tokenType);
  }
  
  /**
   * Get optimal token mix for payment
   */
  getOptimalTokenMix(usdCost, availableBalances, taskType = 'ai_generation') {
    const preferences = this.taskTokenPreferences[taskType] || ['AGENT_COIN'];
    const tokenMix = [];
    let remainingCost = usdCost;
    
    // Try to use preferred tokens first
    for (const token of preferences) {
      if (remainingCost <= 0) break;
      
      const balance = availableBalances[token] || 0;
      if (balance > 0) {
        const tokenValue = this.tokensToUSD(balance, token);
        const usedValue = Math.min(tokenValue, remainingCost);
        const usedTokens = this.usdToTokens(usedValue, token);
        
        tokenMix.push({
          token,
          amount: usedTokens,
          usdValue: usedValue,
          burnAmount: Math.floor(usedTokens * (this.tokenBurnRates[token] || 0) / 100)
        });
        
        remainingCost -= usedValue;
      }
    }
    
    // If still need more, use any available tokens
    if (remainingCost > 0) {
      for (const [token, balance] of Object.entries(availableBalances)) {
        if (remainingCost <= 0) break;
        if (preferences.includes(token)) continue; // Already tried
        
        if (balance > 0) {
          const tokenValue = this.tokensToUSD(balance, token);
          const usedValue = Math.min(tokenValue, remainingCost);
          const usedTokens = this.usdToTokens(usedValue, token);
          
          tokenMix.push({
            token,
            amount: usedTokens,
            usdValue: usedValue,
            burnAmount: Math.floor(usedTokens * (this.tokenBurnRates[token] || 0) / 100)
          });
          
          remainingCost -= usedValue;
        }
      }
    }
    
    return {
      tokenMix,
      totalUSD: usdCost,
      coveredUSD: usdCost - remainingCost,
      remainingUSD: remainingCost,
      sufficient: remainingCost <= 0
    };
  }
  
  /**
   * Estimate tokens needed for API call
   */
  estimateTokensNeeded(provider, model, estimatedInputTokens, estimatedOutputTokens, tokenType = 'AGENT_COIN') {
    const usdCost = this.calculateAPICostUSD(provider, model, estimatedInputTokens, estimatedOutputTokens);
    const tokensNeeded = this.usdToTokens(usdCost, tokenType);
    const burnAmount = Math.floor(tokensNeeded * (this.tokenBurnRates[tokenType] || 0) / 100);
    
    return {
      provider,
      model,
      apiTokens: {
        input: estimatedInputTokens,
        output: estimatedOutputTokens,
        total: estimatedInputTokens + estimatedOutputTokens
      },
      cost: {
        usd: usdCost,
        tokens: tokensNeeded,
        tokenType,
        burnAmount,
        totalDeduction: tokensNeeded + burnAmount
      },
      breakdown: {
        inputCostUSD: (estimatedInputTokens / 1000000) * this.apiPricing[provider][model].input,
        outputCostUSD: (estimatedOutputTokens / 1000000) * this.apiPricing[provider][model].output
      }
    };
  }
  
  /**
   * Process API call billing
   */
  async processAPICallBilling(userId, apiCallDetails, userBalances) {
    const { provider, model, inputTokens, outputTokens, taskType } = apiCallDetails;
    
    // Calculate cost
    const usdCost = this.calculateAPICostUSD(provider, model, inputTokens, outputTokens);
    
    // Get optimal token mix
    const payment = this.getOptimalTokenMix(usdCost, userBalances, taskType);
    
    if (!payment.sufficient) {
      throw new Error(`Insufficient token balance. Need $${payment.remainingUSD.toFixed(6)} more`);
    }
    
    // Emit billing event
    this.emit('apiCallBilled', {
      userId,
      apiCall: apiCallDetails,
      payment,
      timestamp: Date.now()
    });
    
    return payment;
  }
  
  /**
   * Get exchange rates display
   */
  getExchangeRates() {
    const rates = [];
    
    for (const [token, usdRate] of Object.entries(this.tokenToUSD)) {
      rates.push({
        token,
        tokensPerDollar: Math.round(1 / usdRate),
        usdPerToken: usdRate,
        burnRate: this.tokenBurnRates[token] || 0
      });
    }
    
    return rates.sort((a, b) => b.usdPerToken - a.usdPerToken);
  }
  
  /**
   * Compare token costs across different models
   */
  compareModelCosts(inputTokens = 1000, outputTokens = 1000, tokenType = 'AGENT_COIN') {
    const comparisons = [];
    
    for (const [provider, models] of Object.entries(this.apiPricing)) {
      for (const [model, pricing] of Object.entries(models)) {
        const usdCost = this.calculateAPICostUSD(provider, model, inputTokens, outputTokens);
        const tokenCost = this.usdToTokens(usdCost, tokenType);
        
        comparisons.push({
          provider,
          model,
          usdCost,
          tokenCost,
          tokenType,
          efficiency: usdCost / (inputTokens + outputTokens) * 1000 // Cost per 1K tokens
        });
      }
    }
    
    return comparisons.sort((a, b) => a.efficiency - b.efficiency);
  }
  
  /**
   * Create billing report
   */
  generateBillingReport(transactions) {
    const report = {
      totalUSD: 0,
      totalTokens: {},
      totalBurned: {},
      byProvider: {},
      byModel: {},
      byTaskType: {},
      transactions: []
    };
    
    for (const tx of transactions) {
      report.totalUSD += tx.payment.totalUSD;
      
      // Aggregate tokens
      for (const item of tx.payment.tokenMix) {
        report.totalTokens[item.token] = (report.totalTokens[item.token] || 0) + item.amount;
        report.totalBurned[item.token] = (report.totalBurned[item.token] || 0) + item.burnAmount;
      }
      
      // By provider
      if (!report.byProvider[tx.apiCall.provider]) {
        report.byProvider[tx.apiCall.provider] = { count: 0, usd: 0 };
      }
      report.byProvider[tx.apiCall.provider].count++;
      report.byProvider[tx.apiCall.provider].usd += tx.payment.totalUSD;
      
      // By model
      const modelKey = `${tx.apiCall.provider}/${tx.apiCall.model}`;
      if (!report.byModel[modelKey]) {
        report.byModel[modelKey] = { count: 0, usd: 0 };
      }
      report.byModel[modelKey].count++;
      report.byModel[modelKey].usd += tx.payment.totalUSD;
      
      // By task type
      if (!report.byTaskType[tx.apiCall.taskType]) {
        report.byTaskType[tx.apiCall.taskType] = { count: 0, usd: 0 };
      }
      report.byTaskType[tx.apiCall.taskType].count++;
      report.byTaskType[tx.apiCall.taskType].usd += tx.payment.totalUSD;
    }
    
    return report;
  }
}

// Demo and testing
if (require.main === module) {
  console.log('🚀 TOKEN TO API COST MAPPER DEMO\n');
  
  const mapper = new TokenToAPICostMapper();
  
  // Show exchange rates
  console.log('💱 TOKEN EXCHANGE RATES:');
  console.log('========================');
  const rates = mapper.getExchangeRates();
  for (const rate of rates) {
    console.log(`${rate.token}: ${rate.tokensPerDollar} tokens = $1 (burn: ${rate.burnRate}%)`);
  }
  
  // Example API call cost
  console.log('\n📊 EXAMPLE API CALL COSTS:');
  console.log('==========================');
  
  const examples = [
    { provider: 'deepseek', model: 'deepseek-chat', input: 2000, output: 1000 },
    { provider: 'anthropic', model: 'claude-3-haiku-20240307', input: 3000, output: 1500 },
    { provider: 'openai', model: 'gpt-3.5-turbo', input: 4000, output: 2000 }
  ];
  
  for (const example of examples) {
    const estimate = mapper.estimateTokensNeeded(
      example.provider,
      example.model,
      example.input,
      example.output,
      'AGENT_COIN'
    );
    
    console.log(`\n${example.provider}/${example.model}:`);
    console.log(`  API Tokens: ${example.input} in + ${example.output} out = ${example.input + example.output} total`);
    console.log(`  USD Cost: $${estimate.cost.usd.toFixed(6)}`);
    console.log(`  AGENT_COIN Cost: ${estimate.cost.tokens} tokens`);
    console.log(`  Burn Amount: ${estimate.cost.burnAmount} tokens`);
    console.log(`  Total Deduction: ${estimate.cost.totalDeduction} tokens`);
  }
  
  // Test optimal token mix
  console.log('\n🎯 OPTIMAL TOKEN MIX EXAMPLE:');
  console.log('=============================');
  
  const userBalances = {
    'AGENT_COIN': 5000,
    'VIBES_COIN': 2000,
    'MEME_TOKEN': 100,
    'DATABASE_TOKEN': 10000,
    'CHAPTER7': 2
  };
  
  const apiCost = 0.005; // $0.005
  const payment = mapper.getOptimalTokenMix(apiCost, userBalances, 'ai_generation');
  
  console.log(`\nAPI Cost: $${apiCost}`);
  console.log('User Balances:', userBalances);
  console.log('\nOptimal Payment Mix:');
  for (const item of payment.tokenMix) {
    console.log(`  ${item.token}: ${item.amount} tokens ($${item.usdValue.toFixed(6)}) - burn ${item.burnAmount}`);
  }
  console.log(`\nTotal Covered: $${payment.coveredUSD.toFixed(6)}`);
  console.log(`Sufficient: ${payment.sufficient ? 'YES' : 'NO'}`);
  
  // Model comparison
  console.log('\n🏆 MODEL COST COMPARISON (per 1K tokens):');
  console.log('==========================================');
  
  const comparisons = mapper.compareModelCosts(1000, 1000, 'AGENT_COIN');
  for (const comp of comparisons) {
    console.log(`${comp.provider}/${comp.model}: ${comp.tokenCost} AGENT_COIN ($${comp.usdCost.toFixed(6)})`);
  }
  
  console.log('\n✅ Token to API Cost Mapper ready for integration!');
}

module.exports = TokenToAPICostMapper;