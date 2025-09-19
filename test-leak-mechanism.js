#!/usr/bin/env node

/**
 * STANDALONE LEAK MECHANISM TEST
 * Tests Step 3 (Controlled Leak) → Step 4 (Anti-Chargeback) integration
 * American Express style: No chargebacks, controlled feature degradation
 */

const crypto = require('crypto');

class LeakMechanismTest {
  constructor() {
    this.creditLimit = 10000;
    this.leakThreshold = 0.1; // 10% remaining triggers leak
    
    // User balances and states
    this.userBalances = new Map();
    this.userSignatures = new Map();
    this.leakStates = new Map();
    this.degradationStates = new Map();
    this.auditLog = [];
    
    console.log('🧪 Leak Mechanism Test System initialized');
    console.log(`💰 Credit Limit: ${this.creditLimit}`);
    console.log(`⚠️  Leak Threshold: ${this.leakThreshold * 100}% remaining`);
  }
  
  // Step 1: Credit Vault Operations
  async addCredits(userId, amount) {
    const currentBalance = this.userBalances.get(userId) || 0;
    const newBalance = currentBalance + amount;
    this.userBalances.set(userId, newBalance);
    
    this.auditLog.push({
      action: 'credits_added',
      userId,
      amount,
      newBalance,
      timestamp: new Date()
    });
    
    return newBalance;
  }
  
  async deductCredits(userId, amount) {
    const currentBalance = this.userBalances.get(userId) || 0;
    
    if (currentBalance < amount) {
      throw new Error('Insufficient credits');
    }
    
    const newBalance = currentBalance - amount;
    this.userBalances.set(userId, newBalance);
    
    // Trigger leak detection
    await this.detectLeak(userId);
    
    this.auditLog.push({
      action: 'credits_deducted',
      userId,
      amount,
      newBalance,
      timestamp: new Date()
    });
    
    return newBalance;
  }
  
  // Step 2: Document Signing (simplified)
  async signTransaction(userId, transactionId) {
    const signature = crypto.createHash('sha256')
      .update(`${userId}:${transactionId}:${Date.now()}`)
      .digest('hex');
    
    this.userSignatures.set(transactionId, {
      userId,
      signature,
      timestamp: new Date()
    });
    
    return signature;
  }
  
  // Step 3: Controlled Leak Detection
  async detectLeak(userId) {
    const balance = this.userBalances.get(userId) || 0;
    const percentRemaining = balance / this.creditLimit;
    
    if (percentRemaining <= this.leakThreshold) {
      const leakLevel = this.calculateLeakLevel(percentRemaining);
      
      const leakState = {
        userId,
        balance,
        percentRemaining,
        leakLevel,
        detectedAt: new Date()
      };
      
      this.leakStates.set(userId, leakState);
      
      // Trigger feature degradation
      await this.degradeFeatures(userId, leakLevel);
      
      console.log(`🚨 LEAK DETECTED for ${userId}:`);
      console.log(`   💰 Balance: ${balance} (${(percentRemaining * 100).toFixed(1)}%)`);
      console.log(`   🔥 Leak Level: ${leakLevel}`);
      
      return leakState;
    }
    
    return null;
  }
  
  calculateLeakLevel(percentRemaining) {
    if (percentRemaining <= 0.01) return 'critical';
    if (percentRemaining <= 0.05) return 'severe';
    if (percentRemaining <= 0.1) return 'moderate';
    return 'low';
  }
  
  async degradeFeatures(userId, leakLevel) {
    const degradations = {
      low: {
        disabled: [],
        limited: ['advanced_features'],
        warnings: ['Consider reloading credits']
      },
      moderate: {
        disabled: ['advanced_features'],
        limited: ['ai_features', 'bulk_operations'],
        warnings: ['Service degradation in effect', 'Reload credits to restore features']
      },
      severe: {
        disabled: ['advanced_features', 'ai_features', 'bulk_operations'],
        limited: ['basic_operations'],
        warnings: ['Severe limitations active', 'Only basic features available']
      },
      critical: {
        disabled: ['all_features'],
        limited: [],
        warnings: ['Account frozen', 'Reload credits immediately']
      }
    };
    
    const state = degradations[leakLevel];
    this.degradationStates.set(userId, {
      ...state,
      leakLevel,
      appliedAt: new Date()
    });
    
    console.log(`   🔧 Feature Degradation Applied:`);
    console.log(`      Disabled: ${state.disabled.join(', ') || 'None'}`);
    console.log(`      Limited: ${state.limited.join(', ') || 'None'}`);
    console.log(`      Warnings: ${state.warnings.join(', ')}`);
    
    return state;
  }
  
  // Step 4: Anti-Chargeback Protection
  async attemptDispute(userId, transactionId, reason) {
    // Check if transaction has signature
    const signatureRecord = this.userSignatures.get(transactionId);
    
    if (!signatureRecord) {
      return {
        status: 'rejected',
        reason: 'No valid signature found',
        resolution: 'Transaction stands - no signature, no dispute'
      };
    }
    
    // AMEX-style: All transactions are final
    const dispute = {
      id: crypto.randomUUID(),
      userId,
      transactionId,
      reason,
      status: 'rejected',
      resolution: 'All transactions are final per signed terms',
      timestamp: new Date()
    };
    
    this.auditLog.push({
      action: 'dispute_rejected',
      disputeId: dispute.id,
      userId,
      transactionId,
      reason
    });
    
    console.log(`❌ DISPUTE REJECTED:`);
    console.log(`   User: ${userId}`);
    console.log(`   Reason: ${reason}`);
    console.log(`   Resolution: ${dispute.resolution}`);
    
    return dispute;
  }
  
  // Step 5: Monitoring Dashboard
  async getSystemStatus(userId) {
    const balance = this.userBalances.get(userId) || 0;
    const percentRemaining = balance / this.creditLimit;
    const leakState = this.leakStates.get(userId);
    const degradationState = this.degradationStates.get(userId);
    
    return {
      userId,
      balance,
      percentRemaining: (percentRemaining * 100).toFixed(1) + '%',
      isLeaking: !!leakState,
      leakLevel: leakState?.leakLevel || 'none',
      featuresDisabled: degradationState?.disabled || [],
      totalTransactions: this.auditLog.filter(log => 
        log.userId === userId && (log.action === 'credits_added' || log.action === 'credits_deducted')
      ).length
    };
  }
}

// Run test
async function runTest() {
  console.log('\n🧪 LEAK MECHANISM & ANTI-CHARGEBACK TEST');
  console.log('==========================================\n');
  
  const system = new LeakMechanismTest();
  const userId = 'test-user-001';
  
  try {
    // 1. Initialize user with credits
    console.log('1️⃣ CREDIT INITIALIZATION TEST');
    await system.addCredits(userId, 1000);
    console.log(`✅ Added 1000 credits to ${userId}\n`);
    
    // 2. Spending pattern to trigger leak
    console.log('2️⃣ CONTROLLED SPENDING TO TRIGGER LEAK');
    
    for (let i = 1; i <= 10; i++) {
      const amount = 100;
      const status = await system.getSystemStatus(userId);
      
      console.log(`Transaction ${i}: Balance before: ${status.balance}`);
      
      if (status.balance >= amount) {
        await system.deductCredits(userId, amount);
        
        // Check if leak was triggered
        const newStatus = await system.getSystemStatus(userId);
        if (newStatus.isLeaking) {
          console.log(`🔥 Leak triggered at transaction ${i}!`);
          break;
        }
      } else {
        console.log(`❌ Transaction ${i} would exceed balance`);
        break;
      }
    }
    
    console.log('\n3️⃣ ANTI-CHARGEBACK PROTECTION TEST');
    
    // Create a signed transaction
    const transactionId = crypto.randomUUID();
    await system.signTransaction(userId, transactionId);
    console.log(`✅ Created signed transaction: ${transactionId.substring(0, 8)}...`);
    
    // Attempt dispute
    const dispute = await system.attemptDispute(
      userId, 
      transactionId, 
      'This leak system is unfair! I want my money back!'
    );
    
    console.log('\n4️⃣ FINAL SYSTEM STATUS');
    const finalStatus = await system.getSystemStatus(userId);
    console.log('📊 Final Status:', finalStatus);
    
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY!');
    console.log('🔒 System demonstrated:');
    console.log('   - Controlled leak mechanism (water in ship analogy)');
    console.log('   - Feature degradation as credits approach zero');
    console.log('   - Complete anti-chargeback protection (AMEX-style)');
    console.log('   - Audit trail for all actions');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  runTest();
}

module.exports = LeakMechanismTest;