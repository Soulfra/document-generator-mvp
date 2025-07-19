#!/usr/bin/env node

/**
 * Document Generator Economy Layer (2nd Economy)
 * Manages AI costs, token usage, sovereign agent economics
 */

class DocumentGeneratorEconomy {
  constructor() {
    this.accounts = new Map();
    this.transactions = [];
    this.costs = {
      ollama: 0,
      claude: 0.015, // per 1k tokens
      openai: 0.03,  // per 1k tokens
      processing: 0.001 // per operation
    };
    this.budgets = new Map();
    this.usage = new Map();
  }

  async initialize() {
    console.log('💰 DOCUMENT GENERATOR ECONOMY LAYER (2ND ECONOMY)');
    console.log('=================================================');
    
    await this.setupAccounting();
    await this.initializeBudgets();
    await this.setupTokenTracking();
    
    console.log('✅ Economy layer operational');
    return this;
  }

  async setupAccounting() {
    console.log('📊 Setting up economic accounting...');
    
    // Create default accounts
    this.accounts.set('user', {
      balance: 100.0, // $100 starting credit
      spent: 0,
      operations: 0,
      tokens: 0
    });
    
    this.accounts.set('system', {
      balance: 0,
      revenue: 0,
      costs: 0,
      profit: 0
    });
    
    console.log('✅ Accounts initialized');
  }

  async initializeBudgets() {
    console.log('💳 Initializing budgets...');
    
    // Budget per document processing
    this.budgets.set('document_processing', {
      max: 10.0, // $10 max per document
      ai_analysis: 3.0,
      code_generation: 5.0,
      packaging: 1.0,
      overhead: 1.0
    });
    
    // Budget per user session
    this.budgets.set('user_session', {
      max: 50.0, // $50 max per session
      concurrent_docs: 5,
      ai_requests: 100,
      storage: 1.0
    });
    
    console.log('✅ Budgets configured');
  }

  async setupTokenTracking() {
    console.log('🎯 Setting up token tracking...');
    
    // Track AI provider usage
    this.usage.set('ai_providers', {
      ollama: { requests: 0, tokens: 0, cost: 0 },
      claude: { requests: 0, tokens: 0, cost: 0 },
      openai: { requests: 0, tokens: 0, cost: 0 }
    });
    
    // Track operation costs
    this.usage.set('operations', {
      document_parse: { count: 0, cost: 0 },
      requirements_extract: { count: 0, cost: 0 },
      architecture_design: { count: 0, cost: 0 },
      code_generation: { count: 0, cost: 0 },
      mvp_packaging: { count: 0, cost: 0 }
    });
    
    console.log('✅ Token tracking active');
  }

  // Cost calculation and charging
  async chargeForAI(provider, tokens, operation) {
    console.log(`💸 Charging for AI: ${provider} (${tokens} tokens)`);
    
    const costPerToken = this.costs[provider] / 1000; // Convert to per-token
    const cost = tokens * costPerToken;
    
    // Check budget
    const budget = this.budgets.get('document_processing');
    const currentSpent = this.getCurrentSpent('user');
    
    if (currentSpent + cost > budget.max) {
      throw new Error(`Budget exceeded: $${cost.toFixed(4)} would exceed $${budget.max} limit`);
    }
    
    // Process charge
    await this.processCharge('user', cost, `AI ${provider}: ${operation}`);
    
    // Update usage tracking
    const aiUsage = this.usage.get('ai_providers');
    aiUsage[provider].requests++;
    aiUsage[provider].tokens += tokens;
    aiUsage[provider].cost += cost;
    
    console.log(`✅ Charged $${cost.toFixed(4)} for ${provider} (${tokens} tokens)`);
    
    return cost;
  }

  async chargeForOperation(operation, complexity = 'medium') {
    console.log(`💸 Charging for operation: ${operation} (${complexity})`);
    
    const multipliers = {
      simple: 0.5,
      medium: 1.0,
      complex: 2.0
    };
    
    const baseCost = this.costs.processing;
    const cost = baseCost * multipliers[complexity];
    
    // Process charge
    await this.processCharge('user', cost, `Operation: ${operation}`);
    
    // Update operation tracking
    const opUsage = this.usage.get('operations');
    if (opUsage[operation]) {
      opUsage[operation].count++;
      opUsage[operation].cost += cost;
    }
    
    console.log(`✅ Charged $${cost.toFixed(4)} for ${operation}`);
    
    return cost;
  }

  async processCharge(accountId, amount, description) {
    const account = this.accounts.get(accountId);
    
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }
    
    if (account.balance < amount) {
      throw new Error(`Insufficient funds: $${account.balance.toFixed(2)} available, $${amount.toFixed(4)} required`);
    }
    
    // Deduct from user account
    account.balance -= amount;
    account.spent += amount;
    account.operations++;
    
    // Add to system revenue
    const systemAccount = this.accounts.get('system');
    systemAccount.revenue += amount;
    
    // Record transaction
    this.transactions.push({
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      account: accountId,
      amount: -amount,
      description,
      timestamp: new Date(),
      balance: account.balance
    });
    
    console.log(`💳 Transaction: -$${amount.toFixed(4)} (${description})`);
    console.log(`💰 Balance: $${account.balance.toFixed(2)}`);
  }

  getCurrentSpent(accountId) {
    const account = this.accounts.get(accountId);
    return account ? account.spent : 0;
  }

  // Budget checking
  async checkBudget(operation, estimatedCost) {
    console.log(`🔍 Checking budget for ${operation}: $${estimatedCost.toFixed(4)}`);
    
    const budget = this.budgets.get('document_processing');
    const currentSpent = this.getCurrentSpent('user');
    const remaining = budget.max - currentSpent;
    
    if (estimatedCost > remaining) {
      console.log(`❌ Budget check failed: $${estimatedCost.toFixed(4)} > $${remaining.toFixed(2)} remaining`);
      return false;
    }
    
    console.log(`✅ Budget check passed: $${remaining.toFixed(2)} remaining`);
    return true;
  }

  // Cost estimation
  estimateDocumentCost(documentSize, complexity = 'medium') {
    const baseEstimate = {
      parse: 0.01,
      analyze: documentSize > 1024*1024 ? 2.0 : 0.5, // Large file analysis
      requirements: 1.0,
      architecture: 1.5,
      code: 3.0,
      package: 0.5
    };
    
    const multipliers = {
      simple: 0.7,
      medium: 1.0,
      complex: 1.5
    };
    
    const total = Object.values(baseEstimate).reduce((sum, cost) => sum + cost, 0);
    return total * multipliers[complexity];
  }

  // Sovereign agent economics
  async payAgent(agentId, task, performance) {
    console.log(`🎭 Paying sovereign agent: ${agentId} for ${task}`);
    
    const basePayment = {
      document_analysis: 0.10,
      requirement_extraction: 0.15,
      code_review: 0.20,
      quality_check: 0.05
    };
    
    const performanceMultiplier = {
      excellent: 1.5,
      good: 1.2,
      average: 1.0,
      poor: 0.7
    };
    
    const payment = (basePayment[task] || 0.10) * (performanceMultiplier[performance] || 1.0);
    
    // Create agent account if doesn't exist
    if (!this.accounts.has(agentId)) {
      this.accounts.set(agentId, {
        balance: 0,
        earned: 0,
        tasks: 0,
        rating: 'average'
      });
    }
    
    // Pay agent
    const agentAccount = this.accounts.get(agentId);
    agentAccount.balance += payment;
    agentAccount.earned += payment;
    agentAccount.tasks++;
    
    // Deduct from system
    const systemAccount = this.accounts.get('system');
    systemAccount.costs += payment;
    
    console.log(`✅ Paid agent ${agentId}: $${payment.toFixed(4)}`);
    
    return payment;
  }

  // Economic dashboard
  getEconomicSummary() {
    const userAccount = this.accounts.get('user');
    const systemAccount = this.accounts.get('system');
    const aiUsage = this.usage.get('ai_providers');
    
    return {
      user: {
        balance: userAccount.balance,
        spent: userAccount.spent,
        operations: userAccount.operations
      },
      system: {
        revenue: systemAccount.revenue,
        costs: systemAccount.costs,
        profit: systemAccount.revenue - systemAccount.costs
      },
      ai_costs: {
        ollama: aiUsage.ollama.cost,
        claude: aiUsage.claude.cost,
        openai: aiUsage.openai.cost,
        total: aiUsage.ollama.cost + aiUsage.claude.cost + aiUsage.openai.cost
      },
      efficiency: {
        cost_per_operation: userAccount.operations > 0 ? userAccount.spent / userAccount.operations : 0,
        ai_vs_local: aiUsage.ollama.requests / (aiUsage.claude.requests + aiUsage.openai.requests + 1)
      }
    };
  }

  showEconomicDashboard() {
    console.log('\n💰 ECONOMIC DASHBOARD');
    console.log('=====================');
    
    const summary = this.getEconomicSummary();
    
    console.log(`👤 User Account:`);
    console.log(`   Balance: $${summary.user.balance.toFixed(2)}`);
    console.log(`   Spent: $${summary.user.spent.toFixed(2)}`);
    console.log(`   Operations: ${summary.user.operations}`);
    
    console.log(`\n🏦 System Economics:`);
    console.log(`   Revenue: $${summary.system.revenue.toFixed(2)}`);
    console.log(`   Costs: $${summary.system.costs.toFixed(2)}`);
    console.log(`   Profit: $${summary.system.profit.toFixed(2)}`);
    
    console.log(`\n🤖 AI Costs:`);
    console.log(`   Ollama (Local): $${summary.ai_costs.ollama.toFixed(4)}`);
    console.log(`   Claude: $${summary.ai_costs.claude.toFixed(4)}`);
    console.log(`   OpenAI: $${summary.ai_costs.openai.toFixed(4)}`);
    console.log(`   Total AI: $${summary.ai_costs.total.toFixed(4)}`);
    
    console.log(`\n📊 Efficiency:`);
    console.log(`   Cost/Operation: $${summary.efficiency.cost_per_operation.toFixed(4)}`);
    console.log(`   Local vs Cloud Ratio: ${summary.efficiency.ai_vs_local.toFixed(2)}:1`);
    
    // Show recent transactions
    console.log(`\n💳 Recent Transactions:`);
    this.transactions.slice(-5).forEach(txn => {
      console.log(`   ${txn.timestamp.toISOString().substr(11, 8)} | $${Math.abs(txn.amount).toFixed(4)} | ${txn.description}`);
    });
  }

  // Budget optimization
  optimizeBudget() {
    console.log('\n💡 BUDGET OPTIMIZATION');
    console.log('======================');
    
    const aiUsage = this.usage.get('ai_providers');
    const totalRequests = aiUsage.ollama.requests + aiUsage.claude.requests + aiUsage.openai.requests;
    
    if (totalRequests === 0) {
      console.log('No AI usage data for optimization');
      return;
    }
    
    const ollamaRatio = aiUsage.ollama.requests / totalRequests;
    const costSavings = (aiUsage.claude.cost + aiUsage.openai.cost) - 
                       (aiUsage.claude.requests + aiUsage.openai.requests) * 0; // Ollama is free
    
    console.log(`🦙 Ollama Usage: ${(ollamaRatio * 100).toFixed(1)}%`);
    console.log(`💰 Cost Savings from Local AI: $${costSavings.toFixed(4)}`);
    
    if (ollamaRatio < 0.7) {
      console.log('💡 Recommendation: Increase Ollama usage to reduce costs');
    } else {
      console.log('✅ Good local AI utilization');
    }
  }

  // Cost wrapper for AI processing
  async processWithCostTracking(aiProvider, prompt, operation) {
    const estimatedTokens = Math.ceil(prompt.length / 4); // Rough token estimate
    const estimatedCost = (this.costs[aiProvider] / 1000) * estimatedTokens;
    
    // Check budget first
    const canProceed = await this.checkBudget(operation, estimatedCost);
    if (!canProceed) {
      throw new Error(`Budget exceeded for ${operation}`);
    }
    
    // Charge for the operation
    await this.chargeForAI(aiProvider, estimatedTokens, operation);
    await this.chargeForOperation(operation);
    
    return {
      cost: estimatedCost,
      tokens: estimatedTokens,
      provider: aiProvider
    };
  }

  // Economy integration with other layers
  async integrateWithSystem(masterOrchestrator) {
    console.log('🔗 Integrating economy with system...');
    
    // Hook into document processing
    masterOrchestrator.on('document:processing_start', async (data) => {
      const estimatedCost = this.estimateDocumentCost(data.size);
      console.log(`💰 Estimated document processing cost: $${estimatedCost.toFixed(2)}`);
      
      const canProceed = await this.checkBudget('document_processing', estimatedCost);
      if (!canProceed) {
        throw new Error('Insufficient budget for document processing');
      }
    });
    
    // Hook into AI usage
    masterOrchestrator.on('ai:request', async (data) => {
      await this.processWithCostTracking(data.provider, data.prompt, data.operation);
    });
    
    console.log('✅ Economy integrated with system');
  }
}

// Start economy layer if run directly
if (require.main === module) {
  const economy = new DocumentGeneratorEconomy();
  
  economy.initialize().then(() => {
    economy.showEconomicDashboard();
    economy.optimizeBudget();
    
    console.log('\n💰 ECONOMY LAYER OPERATIONAL!');
    console.log('Ready to track costs and manage AI economics');
    
    // Demo some transactions
    console.log('\n🧪 Demo Transactions:');
    economy.chargeForAI('ollama', 1000, 'requirements_extraction');
    economy.chargeForOperation('code_generation', 'complex');
    economy.payAgent('aria', 'document_analysis', 'excellent');
    
    setTimeout(() => {
      economy.showEconomicDashboard();
    }, 1000);
    
  });
}

module.exports = DocumentGeneratorEconomy;