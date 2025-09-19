#!/usr/bin/env node

/**
 * TEST TOKEN API INTEGRATION
 * Demonstrates how tokens and API costs work together
 */

const TokenToAPICostMapper = require('./token-to-api-cost-mapper');
const TokenBillingBridge = require('./token-billing-bridge');

async function demonstrateIntegration() {
    console.log('🚀 TOKEN ECONOMY & API INTEGRATION DEMO\n');
    console.log('This shows how your tokens (AGENT_COIN, TKES, etc.) pay for real API calls\n');
    
    // Initialize components
    const mapper = new TokenToAPICostMapper();
    const bridge = new TokenBillingBridge();
    const userId = 'demo_user_123';
    
    // Show initial balances
    console.log('💰 Your Initial Token Balances:');
    console.log('==============================');
    const balances = bridge.initializeUser(userId);
    for (const [token, balance] of Object.entries(balances)) {
        const usdValue = mapper.tokensToUSD(balance, token);
        console.log(`${token}: ${balance.toLocaleString()} tokens ($${usdValue.toFixed(4)})`);
    }
    const totalValue = Object.entries(balances)
        .reduce((sum, [token, balance]) => sum + mapper.tokensToUSD(balance, token), 0);
    console.log(`\nTotal Portfolio Value: $${totalValue.toFixed(2)}\n`);
    
    // Example 1: DeepSeek API Call
    console.log('📞 Example 1: DeepSeek Chat API Call');
    console.log('=====================================');
    const deepseekCall = {
        provider: 'deepseek',
        model: 'deepseek-chat',
        estimatedInputTokens: 3000,
        estimatedOutputTokens: 1500,
        taskType: 'chat_conversation'
    };
    
    const deepseekEstimate = mapper.estimateTokensNeeded(
        deepseekCall.provider,
        deepseekCall.model,
        deepseekCall.estimatedInputTokens,
        deepseekCall.estimatedOutputTokens,
        'DEEPTOKEN'
    );
    
    console.log(`API Usage: ${deepseekCall.estimatedInputTokens} input + ${deepseekCall.estimatedOutputTokens} output`);
    console.log(`USD Cost: $${deepseekEstimate.cost.usd.toFixed(6)}`);
    console.log(`DEEPTOKEN Cost: ${deepseekEstimate.cost.tokens.toLocaleString()} tokens`);
    console.log(`Burn Amount: ${deepseekEstimate.cost.burnAmount} tokens (2% burn rate)`);
    console.log(`Total Deduction: ${deepseekEstimate.cost.totalDeduction} tokens\n`);
    
    // Process the call
    try {
        const preAuth1 = await bridge.preAuthorizeAPICall(userId, deepseekCall);
        console.log(`✅ Pre-authorized! ID: ${preAuth1.preAuthId}`);
        
        // Simulate actual usage
        const actualUsage1 = {
            provider: 'deepseek',
            model: 'deepseek-chat',
            inputTokens: 2800,
            outputTokens: 1600
        };
        
        const result1 = await bridge.processAPICall(userId, preAuth1.preAuthId, actualUsage1);
        console.log('✅ API call completed!');
        console.log('Tokens deducted:', result1.payment.tokenMix.map(t => 
            `${t.amount} ${t.token} (burned: ${t.burnAmount})`
        ).join(', '));
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    // Example 2: Claude API Call
    console.log('\n📞 Example 2: Claude 3 Haiku API Call');
    console.log('======================================');
    const claudeCall = {
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        estimatedInputTokens: 5000,
        estimatedOutputTokens: 2000,
        taskType: 'ai_generation'
    };
    
    const claudeEstimate = mapper.estimateTokensNeeded(
        claudeCall.provider,
        claudeCall.model,
        claudeCall.estimatedInputTokens,
        claudeCall.estimatedOutputTokens,
        'AGENT_COIN'
    );
    
    console.log(`API Usage: ${claudeCall.estimatedInputTokens} input + ${claudeCall.estimatedOutputTokens} output`);
    console.log(`USD Cost: $${claudeEstimate.cost.usd.toFixed(6)}`);
    console.log(`AGENT_COIN Cost: ${claudeEstimate.cost.tokens.toLocaleString()} tokens`);
    console.log(`No burn for AGENT_COIN\n`);
    
    // Example 3: Premium GPT-4 Call
    console.log('📞 Example 3: GPT-4 Premium Call');
    console.log('=================================');
    const gpt4Call = {
        provider: 'openai',
        model: 'gpt-4',
        estimatedInputTokens: 2000,
        estimatedOutputTokens: 1000,
        taskType: 'premium_ai'
    };
    
    const gpt4Estimate = mapper.estimateTokensNeeded(
        gpt4Call.provider,
        gpt4Call.model,
        gpt4Call.estimatedInputTokens,
        gpt4Call.estimatedOutputTokens,
        'CHAPTER7'
    );
    
    console.log(`API Usage: ${gpt4Call.estimatedInputTokens} input + ${gpt4Call.estimatedOutputTokens} output`);
    console.log(`USD Cost: $${gpt4Estimate.cost.usd.toFixed(2)} (expensive!)`);
    console.log(`CHAPTER7 Cost: ${gpt4Estimate.cost.tokens} premium tokens`);
    console.log('Note: You only have 0 CHAPTER7 tokens, would need to use AGENT_COIN instead');
    console.log(`Alternative: ${mapper.usdToTokens(gpt4Estimate.cost.usd, 'AGENT_COIN').toLocaleString()} AGENT_COIN\n`);
    
    // Show model comparison
    console.log('📊 Model Cost Comparison (2K tokens total)');
    console.log('==========================================');
    const comparisons = mapper.compareModelCosts(1000, 1000, 'AGENT_COIN');
    console.log('Model                          | AGENT_COIN | USD Cost');
    console.log('-------------------------------|------------|----------');
    for (const comp of comparisons.slice(0, 5)) {
        const model = `${comp.provider}/${comp.model}`.padEnd(30);
        const tokens = comp.tokenCost.toString().padEnd(10);
        const usd = `$${comp.usdCost.toFixed(6)}`;
        console.log(`${model} | ${tokens} | ${usd}`);
    }
    
    // Show optimal token mix
    console.log('\n🎯 Optimal Token Mix Example');
    console.log('=============================');
    const mixExample = {
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        inputTokens: 10000,
        outputTokens: 5000
    };
    
    const mixCost = mapper.calculateAPICostUSD(
        mixExample.provider,
        mixExample.model,
        mixExample.inputTokens,
        mixExample.outputTokens
    );
    
    console.log(`Large API call: ${mixExample.inputTokens + mixExample.outputTokens} total tokens`);
    console.log(`USD Cost: $${mixCost.toFixed(2)}`);
    
    const currentBalances = bridge.getUserBalances(userId);
    const optimalMix = mapper.getOptimalTokenMix(mixCost, currentBalances, 'ai_generation');
    
    console.log('\nOptimal payment mix:');
    for (const item of optimalMix.tokenMix) {
        console.log(`- ${item.amount.toLocaleString()} ${item.token} ($${item.usdValue.toFixed(4)})`);
        if (item.burnAmount > 0) {
            console.log(`  └─ Burns: ${item.burnAmount} tokens`);
        }
    }
    
    if (!optimalMix.sufficient) {
        console.log(`\n⚠️  Insufficient balance! Need $${optimalMix.remainingUSD.toFixed(2)} more`);
    }
    
    // Show updated balances
    console.log('\n💰 Updated Token Balances:');
    console.log('==========================');
    const updatedBalances = bridge.getUserBalances(userId);
    for (const [token, balance] of Object.entries(updatedBalances)) {
        const original = balances[token];
        const change = balance - original;
        if (change !== 0) {
            const usdValue = mapper.tokensToUSD(balance, token);
            console.log(`${token}: ${balance.toLocaleString()} (${change > 0 ? '+' : ''}${change}) - $${usdValue.toFixed(4)}`);
        }
    }
    
    // Generate report
    console.log('\n📋 Session Summary Report');
    console.log('=========================');
    const report = bridge.generateUserReport(userId);
    console.log(`Total API Calls: ${bridge.transactions.length}`);
    console.log(`Total USD Spent: $${report.totalUSD.toFixed(6)}`);
    console.log('Tokens Used:', Object.entries(report.totalTokens)
        .map(([token, amount]) => `${amount} ${token}`)
        .join(', ') || 'None');
    console.log('Tokens Burned:', Object.entries(report.totalBurned)
        .map(([token, amount]) => `${amount} ${token}`)
        .join(', ') || 'None');
    
    console.log('\n✅ Demo complete! This is how your token economy connects to real API costs.');
    console.log('\n💡 Key Insights:');
    console.log('- Different models have vastly different costs');
    console.log('- Token selection matters (burn rates, exchange rates)');
    console.log('- Premium tasks prefer premium tokens (CHAPTER7, TKES)');
    console.log('- The system automatically finds optimal payment combinations');
    console.log('- All costs are transparent and trackable');
}

// Run the demo
demonstrateIntegration().catch(console.error);