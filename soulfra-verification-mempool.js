#!/usr/bin/env node

/**
 * SOULFRA VERIFICATION MEMPOOL
 * 
 * Blockchain-style transaction pool where cryptographic transactions
 * are queued for multi-party verification consensus before commitment.
 * 
 * Features:
 * - Transaction queuing with priority levels
 * - Multi-verifier consensus system
 * - Credit attribution for verification work
 * - Blockchain-style confirmation process
 * - Real-time mempool monitoring
 * - Integration with existing auth and token systems
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// Import existing system components
const SoulFraCryptoVerification = require('./soulfra-crypto-verification.js');
const SoulFraAntiSpoofingLayer = require('./soulfra-anti-spoofing-layer.js');

class SoulFraVerificationMempool extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Pool configuration
      maxPoolSize: options.maxPoolSize || 10000,
      maxTransactionAge: options.maxTransactionAge || 3600000, // 1 hour
      priorityLevels: options.priorityLevels || ['low', 'normal', 'high', 'critical'],
      
      // Consensus configuration
      requiredVerifiers: options.requiredVerifiers || 3,
      consensusThreshold: options.consensusThreshold || 0.67, // 67% agreement
      maxVerificationTime: options.maxVerificationTime || 300000, // 5 minutes
      
      // Credit configuration
      verificationReward: options.verificationReward || 10, // AGENT_COIN
      accuracyBonus: options.accuracyBonus || 5,
      speedBonus: options.speedBonus || 3,
      
      // Pool management
      cleanupInterval: options.cleanupInterval || 60000, // 1 minute
      persistencePath: options.persistencePath || './mempool-data'
    };
    
    // Transaction pools by priority
    this.pools = {
      critical: new Map(),
      high: new Map(),
      normal: new Map(),
      low: new Map()
    };
    
    // Verification tracking
    this.pendingVerifications = new Map(); // transactionId -> verificationData
    this.verifierRegistry = new Map(); // verifierId -> verifierInfo
    this.consensusResults = new Map(); // transactionId -> consensusResult
    
    // Statistics
    this.stats = {
      totalTransactions: 0,
      verifiedTransactions: 0,
      rejectedTransactions: 0,
      averageVerificationTime: 0,
      consensusSuccessRate: 0,
      activeVerifiers: 0,
      poolUtilization: 0
    };
    
    // Initialize crypto verification engine
    this.cryptoVerifier = new SoulFraCryptoVerification();
    this.antiSpoofing = new SoulFraAntiSpoofingLayer();
    
    console.log('🏊 SoulFra Verification Mempool initialized');
  }

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION AND SETUP
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialize the mempool system
   */
  async initialize() {
    console.log('\n🚀 Initializing Verification Mempool...');
    
    // Initialize crypto components
    await this.cryptoVerifier.initialize();
    await this.antiSpoofing.initialize();
    
    // Create persistence directory
    await this.ensurePersistenceDirectory();
    
    // Load existing state
    await this.loadMempoolState();
    
    // Register built-in verifiers
    await this.registerBuiltInVerifiers();
    
    // Start background processes
    this.startCleanupProcess();
    this.startStatisticsUpdater();
    
    console.log('\n✅ Verification Mempool ready!');
    console.log('   🏊 Transaction pools initialized');
    console.log('   🔍 Built-in verifiers registered');
    console.log('   📊 Background monitoring started');
    console.log('   💾 Persistence layer active');
  }

  /**
   * Ensure persistence directory exists
   */
  async ensurePersistenceDirectory() {
    try {
      await fs.mkdir(this.config.persistencePath, { recursive: true });
      console.log(`💾 Persistence directory: ${this.config.persistencePath}`);
    } catch (error) {
      throw new Error(`Failed to create persistence directory: ${error.message}`);
    }
  }

  /**
   * Load existing mempool state
   */
  async loadMempoolState() {
    try {
      const statePath = path.join(this.config.persistencePath, 'mempool-state.json');
      const stateData = await fs.readFile(statePath, 'utf8');
      const state = JSON.parse(stateData);
      
      // Restore pools
      for (const [priority, transactions] of Object.entries(state.pools || {})) {
        if (this.pools[priority]) {
          for (const [id, tx] of Object.entries(transactions)) {
            this.pools[priority].set(id, tx);
          }
        }
      }
      
      // Restore verifier registry
      if (state.verifiers) {
        for (const [id, verifier] of Object.entries(state.verifiers)) {
          this.verifierRegistry.set(id, verifier);
        }
      }
      
      console.log('📥 Mempool state restored from persistence');
      
    } catch (error) {
      console.log('🆕 Starting with fresh mempool state');
    }
  }

  /**
   * Register built-in verification engines
   */
  async registerBuiltInVerifiers() {
    // Crypto verification engine
    await this.registerVerifier({
      id: 'crypto-engine',
      name: 'Cryptographic Verification Engine',
      type: 'automated',
      capabilities: ['pgp-signature', 'timestamp', 'nonce', 'hash-chain'],
      weight: 1.0,
      reputation: 0.95,
      responseTime: 500 // ms
    });
    
    // Anti-spoofing engine
    await this.registerVerifier({
      id: 'anti-spoofing',
      name: 'Anti-Spoofing Protection Layer',
      type: 'automated',
      capabilities: ['behavioral-analysis', 'device-fingerprint', 'rate-limiting'],
      weight: 0.8,
      reputation: 0.90,
      responseTime: 750
    });
    
    // Audit trail verifier
    await this.registerVerifier({
      id: 'audit-verifier',
      name: 'Audit Trail Integrity Checker',
      type: 'automated',
      capabilities: ['audit-integrity', 'merkle-proof', 'chain-validation'],
      weight: 0.6,
      reputation: 0.88,
      responseTime: 300
    });
    
    console.log(`🔍 Registered ${this.verifierRegistry.size} built-in verifiers`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TRANSACTION POOL MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Submit transaction to mempool
   */
  async submitTransaction(transactionData, options = {}) {
    const transaction = await this.createMempoolTransaction(transactionData, options);
    
    // Check pool capacity
    if (this.getTotalPoolSize() >= this.config.maxPoolSize) {
      throw new Error('Mempool is full - try again later');
    }
    
    // Add to appropriate priority pool
    const pool = this.pools[transaction.priority];
    pool.set(transaction.id, transaction);
    
    this.stats.totalTransactions++;
    
    // Emit event for monitoring
    this.emit('transactionSubmitted', transaction);
    
    console.log(`📥 Transaction ${transaction.id.substring(0, 8)} added to ${transaction.priority} pool`);
    
    // Start verification process
    setImmediate(() => this.startVerificationProcess(transaction));
    
    return {
      transactionId: transaction.id,
      priority: transaction.priority,
      estimatedVerificationTime: this.estimateVerificationTime(transaction),
      queuePosition: this.getQueuePosition(transaction)
    };
  }

  /**
   * Create mempool transaction
   */
  async createMempoolTransaction(data, options) {
    const transaction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      priority: options.priority || 'normal',
      
      // Original transaction data
      originalData: data,
      
      // Mempool metadata
      submittedBy: options.userId || 'anonymous',
      submittedAt: Date.now(),
      expiresAt: Date.now() + this.config.maxTransactionAge,
      
      // Verification state
      verificationState: 'pending',
      verificationStarted: null,
      verificationCompleted: null,
      verifiers: [],
      votes: [],
      consensusResult: null,
      
      // Credit tracking
      creditCost: this.calculateCreditCost(data, options),
      verificationRewards: 0,
      
      // Additional metadata
      metadata: {
        ipAddress: options.ipAddress || 'unknown',
        userAgent: options.userAgent || 'unknown',
        sessionId: options.sessionId || crypto.randomUUID()
      }
    };
    
    // Calculate transaction hash
    transaction.hash = this.calculateTransactionHash(transaction);
    
    return transaction;
  }

  /**
   * Calculate transaction hash
   */
  calculateTransactionHash(transaction) {
    const hashData = {
      originalData: transaction.originalData,
      timestamp: transaction.timestamp,
      submittedBy: transaction.submittedBy,
      priority: transaction.priority
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(hashData, Object.keys(hashData).sort()))
      .digest('hex');
  }

  /**
   * Calculate credit cost for transaction
   */
  calculateCreditCost(data, options) {
    let baseCost = 1; // Base cost in AGENT_COIN
    
    // Priority multiplier
    const priorityMultipliers = {
      low: 0.5,
      normal: 1.0,
      high: 2.0,
      critical: 5.0
    };
    
    baseCost *= priorityMultipliers[options.priority || 'normal'];
    
    // Complexity multiplier
    if (data.type === 'contract-execution') baseCost *= 2;
    if (data.type === 'high-value-transfer') baseCost *= 3;
    if (options.requireHumanReview) baseCost *= 10;
    
    return Math.ceil(baseCost);
  }

  /**
   * Get transaction by ID from all pools
   */
  getTransaction(transactionId) {
    for (const pool of Object.values(this.pools)) {
      if (pool.has(transactionId)) {
        return pool.get(transactionId);
      }
    }
    return null;
  }

  /**
   * Remove transaction from pools
   */
  removeTransaction(transactionId) {
    for (const pool of Object.values(this.pools)) {
      if (pool.delete(transactionId)) {
        this.pendingVerifications.delete(transactionId);
        this.consensusResults.delete(transactionId);
        return true;
      }
    }
    return false;
  }

  /**
   * Get total pool size across all priorities
   */
  getTotalPoolSize() {
    return Object.values(this.pools).reduce((total, pool) => total + pool.size, 0);
  }

  /**
   * Get queue position for transaction
   */
  getQueuePosition(transaction) {
    const pool = this.pools[transaction.priority];
    const transactions = Array.from(pool.values()).sort((a, b) => a.timestamp - b.timestamp);
    return transactions.findIndex(tx => tx.id === transaction.id) + 1;
  }

  /**
   * Estimate verification time
   */
  estimateVerificationTime(transaction) {
    const baseTime = 30000; // 30 seconds base
    const queueTime = this.getQueuePosition(transaction) * 5000; // 5 seconds per position
    const priorityMultiplier = {
      critical: 0.1,
      high: 0.5,
      normal: 1.0,
      low: 2.0
    }[transaction.priority];
    
    return Math.round((baseTime + queueTime) * priorityMultiplier);
  }

  // ═══════════════════════════════════════════════════════════════
  // VERIFICATION PROCESS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Start verification process for transaction
   */
  async startVerificationProcess(transaction) {
    console.log(`🔍 Starting verification for transaction ${transaction.id.substring(0, 8)}`);
    
    transaction.verificationState = 'verifying';
    transaction.verificationStarted = Date.now();
    
    // Create verification tracking
    const verification = {
      transactionId: transaction.id,
      startTime: Date.now(),
      verifiers: [],
      votes: [],
      consensusReached: false,
      finalResult: null
    };
    
    this.pendingVerifications.set(transaction.id, verification);
    
    // Select verifiers for this transaction
    const selectedVerifiers = await this.selectVerifiers(transaction);
    
    // Send to each verifier
    for (const verifier of selectedVerifiers) {
      setImmediate(() => this.requestVerification(transaction, verifier, verification));
    }
    
    // Set timeout for verification
    setTimeout(() => {
      if (!verification.consensusReached) {
        this.handleVerificationTimeout(transaction, verification);
      }
    }, this.config.maxVerificationTime);
    
    this.emit('verificationStarted', { transaction, verifiers: selectedVerifiers });
  }

  /**
   * Select appropriate verifiers for transaction
   */
  async selectVerifiers(transaction) {
    const availableVerifiers = Array.from(this.verifierRegistry.values())
      .filter(v => v.status === 'active')
      .sort((a, b) => b.reputation - a.reputation);
    
    // Always include crypto verifier for any transaction
    const selected = [availableVerifiers.find(v => v.id === 'crypto-engine')].filter(Boolean);
    
    // Add anti-spoofing for high-risk transactions
    if (transaction.priority === 'high' || transaction.priority === 'critical') {
      const antiSpoofing = availableVerifiers.find(v => v.id === 'anti-spoofing');
      if (antiSpoofing) selected.push(antiSpoofing);
    }
    
    // Add audit verifier for contract executions
    if (transaction.originalData.type === 'contract-execution') {
      const auditVerifier = availableVerifiers.find(v => v.id === 'audit-verifier');
      if (auditVerifier) selected.push(auditVerifier);
    }
    
    // Fill remaining slots with best available verifiers
    while (selected.length < this.config.requiredVerifiers && availableVerifiers.length > selected.length) {
      const remaining = availableVerifiers.filter(v => !selected.some(s => s.id === v.id));
      if (remaining.length > 0) {
        selected.push(remaining[0]);
      } else {
        break;
      }
    }
    
    return selected;
  }

  /**
   * Request verification from a specific verifier
   */
  async requestVerification(transaction, verifier, verification) {
    const startTime = Date.now();
    
    try {
      console.log(`📞 Requesting verification from ${verifier.name}`);
      
      let result;
      
      // Route to appropriate verification engine
      switch (verifier.id) {
        case 'crypto-engine':
          result = await this.cryptoVerifier.verifyContractTransaction(transaction.originalData);
          break;
          
        case 'anti-spoofing':
          result = await this.antiSpoofing.analyzeSpoofingRisk(transaction.originalData, transaction.submittedBy);
          break;
          
        case 'audit-verifier':
          result = await this.verifyAuditIntegrity(transaction.originalData);
          break;
          
        default:
          result = await this.simulateExternalVerification(transaction, verifier);
          break;
      }
      
      const responseTime = Date.now() - startTime;
      
      // Create verification vote
      const vote = {
        verifierId: verifier.id,
        verifierName: verifier.name,
        timestamp: Date.now(),
        responseTime,
        result: this.normalizeVerificationResult(result),
        confidence: result.confidence || result.overall?.confidence || 0,
        details: result
      };
      
      // Add vote to verification tracking
      verification.votes.push(vote);
      verification.verifiers.push(verifier.id);
      
      console.log(`✅ Received vote from ${verifier.name}: ${vote.result.valid ? 'VALID' : 'INVALID'} (${vote.confidence}%)`);
      
      // Check if we have enough votes for consensus
      if (verification.votes.length >= this.config.requiredVerifiers) {
        await this.checkConsensus(transaction, verification);
      }
      
      this.emit('verificationVote', { transaction, verifier, vote });
      
    } catch (error) {
      console.error(`❌ Verification failed for ${verifier.name}: ${error.message}`);
      
      // Record failed verification
      const failedVote = {
        verifierId: verifier.id,
        verifierName: verifier.name,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        result: { valid: false, error: error.message },
        confidence: 0
      };
      
      verification.votes.push(failedVote);
      
      // Still check consensus in case other verifiers succeeded
      if (verification.votes.length >= this.config.requiredVerifiers) {
        await this.checkConsensus(transaction, verification);
      }
    }
  }

  /**
   * Normalize verification results to common format
   */
  normalizeVerificationResult(result) {
    // Handle different result formats from various verifiers
    if (result.overall) {
      return {
        valid: result.overall.valid,
        confidence: result.overall.confidence,
        details: result
      };
    }
    
    if (result.valid !== undefined) {
      return {
        valid: result.valid,
        confidence: result.confidence || 0,
        details: result
      };
    }
    
    if (result.riskScore !== undefined) {
      return {
        valid: result.riskScore < 50, // Low risk = valid
        confidence: Math.max(0, 100 - result.riskScore),
        details: result
      };
    }
    
    // Default format
    return {
      valid: false,
      confidence: 0,
      details: result
    };
  }

  /**
   * Check if consensus has been reached
   */
  async checkConsensus(transaction, verification) {
    if (verification.consensusReached) return;
    
    const votes = verification.votes.filter(v => v.result.valid !== undefined);
    if (votes.length < this.config.requiredVerifiers) return;
    
    // Calculate weighted consensus
    let totalWeight = 0;
    let validWeight = 0;
    let totalConfidence = 0;
    
    for (const vote of votes) {
      const verifier = this.verifierRegistry.get(vote.verifierId);
      const weight = verifier ? verifier.weight : 1.0;
      
      totalWeight += weight;
      totalConfidence += vote.confidence * weight;
      
      if (vote.result.valid) {
        validWeight += weight;
      }
    }
    
    const consensusRatio = validWeight / totalWeight;
    const averageConfidence = totalConfidence / totalWeight;
    const consensusReached = consensusRatio >= this.config.consensusThreshold;
    
    const consensusResult = {
      transactionId: transaction.id,
      consensusReached: true,
      approved: consensusReached,
      confidence: Math.round(averageConfidence),
      votesFor: votes.filter(v => v.result.valid).length,
      votesAgainst: votes.filter(v => !v.result.valid).length,
      consensusRatio,
      votes: votes,
      timestamp: Date.now()
    };
    
    verification.consensusReached = true;
    verification.finalResult = consensusResult;
    
    this.consensusResults.set(transaction.id, consensusResult);
    
    // Complete transaction
    await this.completeTransaction(transaction, consensusResult);
    
    console.log(`🏁 Consensus reached for ${transaction.id.substring(0, 8)}: ${consensusResult.approved ? 'APPROVED' : 'REJECTED'} (${consensusResult.confidence}%)`);
    
    this.emit('consensusReached', { transaction, consensusResult });
  }

  /**
   * Complete transaction processing
   */
  async completeTransaction(transaction, consensusResult) {
    transaction.verificationState = consensusResult.approved ? 'verified' : 'rejected';
    transaction.verificationCompleted = Date.now();
    transaction.consensusResult = consensusResult;
    
    // Update statistics
    if (consensusResult.approved) {
      this.stats.verifiedTransactions++;
    } else {
      this.stats.rejectedTransactions++;
    }
    
    // Calculate and distribute verification rewards
    await this.distributeVerificationRewards(transaction, consensusResult);
    
    // Remove from mempool (transaction is now committed)
    this.removeTransaction(transaction.id);
    
    // Persist final result
    await this.persistTransactionResult(transaction, consensusResult);
    
    this.emit('transactionCompleted', { transaction, consensusResult });
  }

  /**
   * Distribute rewards to verifiers
   */
  async distributeVerificationRewards(transaction, consensusResult) {
    const totalRewards = transaction.creditCost * 0.8; // 80% of fees go to verifiers
    let distributedRewards = 0;
    
    for (const vote of consensusResult.votes) {
      const verifier = this.verifierRegistry.get(vote.verifierId);
      if (!verifier || verifier.type !== 'human') continue; // Only reward human verifiers
      
      let reward = this.config.verificationReward;
      
      // Accuracy bonus for correct votes
      const voteCorrect = vote.result.valid === consensusResult.approved;
      if (voteCorrect) {
        reward += this.config.accuracyBonus;
      }
      
      // Speed bonus for fast responses
      if (vote.responseTime < 10000) { // Under 10 seconds
        reward += this.config.speedBonus;
      }
      
      // Confidence bonus
      reward += Math.round(vote.confidence / 10);
      
      distributedRewards += reward;
      
      // In production, this would integrate with the token system
      console.log(`💰 Reward ${reward} AGENT_COIN to verifier ${verifier.name}`);
      
      // Update verifier reputation
      this.updateVerifierReputation(vote.verifierId, voteCorrect, vote.confidence);
    }
    
    transaction.verificationRewards = distributedRewards;
    
    console.log(`💰 Distributed ${distributedRewards} AGENT_COIN in verification rewards`);
  }

  /**
   * Update verifier reputation based on performance
   */
  updateVerifierReputation(verifierId, correct, confidence) {
    const verifier = this.verifierRegistry.get(verifierId);
    if (!verifier) return;
    
    // Exponential moving average for reputation
    const weight = 0.1; // Learning rate
    const newReputation = correct ? confidence / 100 : 0;
    
    verifier.reputation = verifier.reputation * (1 - weight) + newReputation * weight;
    verifier.totalVotes = (verifier.totalVotes || 0) + 1;
    verifier.correctVotes = (verifier.correctVotes || 0) + (correct ? 1 : 0);
    
    console.log(`📊 Updated ${verifier.name} reputation: ${Math.round(verifier.reputation * 100)}%`);
  }

  // ═══════════════════════════════════════════════════════════════
  // VERIFIER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Register a new verifier
   */
  async registerVerifier(verifierInfo) {
    const verifier = {
      ...verifierInfo,
      registeredAt: Date.now(),
      status: 'active',
      totalVotes: 0,
      correctVotes: 0,
      averageResponseTime: 0,
      lastActive: Date.now()
    };
    
    this.verifierRegistry.set(verifier.id, verifier);
    this.stats.activeVerifiers = this.verifierRegistry.size;
    
    console.log(`📝 Registered verifier: ${verifier.name} (${verifier.type})`);
    
    this.emit('verifierRegistered', verifier);
    
    return verifier;
  }

  /**
   * Unregister a verifier
   */
  async unregisterVerifier(verifierId) {
    const verifier = this.verifierRegistry.get(verifierId);
    if (!verifier) return false;
    
    this.verifierRegistry.delete(verifierId);
    this.stats.activeVerifiers = this.verifierRegistry.size;
    
    console.log(`🗑️ Unregistered verifier: ${verifier.name}`);
    
    this.emit('verifierUnregistered', verifier);
    
    return true;
  }

  /**
   * Get verifier information
   */
  getVerifier(verifierId) {
    return this.verifierRegistry.get(verifierId);
  }

  /**
   * List all verifiers
   */
  listVerifiers() {
    return Array.from(this.verifierRegistry.values());
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Simulate external verification (placeholder)
   */
  async simulateExternalVerification(transaction, verifier) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, verifier.responseTime || 1000));
    
    // Simulate verification result based on verifier reputation
    const valid = Math.random() < verifier.reputation;
    const confidence = Math.round(verifier.reputation * 100 + (Math.random() - 0.5) * 20);
    
    return {
      valid,
      confidence: Math.max(0, Math.min(100, confidence)),
      verifier: verifier.id,
      timestamp: Date.now()
    };
  }

  /**
   * Verify audit integrity (placeholder)
   */
  async verifyAuditIntegrity(data) {
    // Simulate audit integrity check
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      valid: true,
      confidence: 95,
      auditTrailIntact: true,
      merkleProofValid: true,
      timestamp: Date.now()
    };
  }

  /**
   * Handle verification timeout
   */
  async handleVerificationTimeout(transaction, verification) {
    console.log(`⏰ Verification timeout for transaction ${transaction.id.substring(0, 8)}`);
    
    // Use partial votes if any
    if (verification.votes.length > 0) {
      await this.checkConsensus(transaction, verification);
    } else {
      // No votes received - reject transaction
      const timeoutResult = {
        transactionId: transaction.id,
        consensusReached: true,
        approved: false,
        confidence: 0,
        reason: 'verification-timeout',
        timestamp: Date.now()
      };
      
      await this.completeTransaction(transaction, timeoutResult);
    }
  }

  /**
   * Start cleanup process for old transactions
   */
  startCleanupProcess() {
    setInterval(() => {
      this.cleanupExpiredTransactions();
    }, this.config.cleanupInterval);
    
    console.log('🧹 Cleanup process started');
  }

  /**
   * Clean up expired transactions
   */
  cleanupExpiredTransactions() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [priority, pool] of Object.entries(this.pools)) {
      for (const [id, transaction] of pool.entries()) {
        if (now > transaction.expiresAt) {
          pool.delete(id);
          this.pendingVerifications.delete(id);
          cleaned++;
          
          console.log(`🗑️ Cleaned up expired transaction ${id.substring(0, 8)}`);
        }
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired transactions`);
    }
  }

  /**
   * Start statistics updater
   */
  startStatisticsUpdater() {
    setInterval(() => {
      this.updateStatistics();
    }, 30000); // Every 30 seconds
    
    console.log('📊 Statistics updater started');
  }

  /**
   * Update mempool statistics
   */
  updateStatistics() {
    this.stats.poolUtilization = Math.round((this.getTotalPoolSize() / this.config.maxPoolSize) * 100);
    this.stats.activeVerifiers = Array.from(this.verifierRegistry.values())
      .filter(v => v.status === 'active').length;
    
    if (this.stats.totalTransactions > 0) {
      this.stats.consensusSuccessRate = Math.round(
        (this.stats.verifiedTransactions / this.stats.totalTransactions) * 100
      );
    }
  }

  /**
   * Persist transaction result
   */
  async persistTransactionResult(transaction, consensusResult) {
    try {
      const resultPath = path.join(
        this.config.persistencePath,
        'results',
        `${transaction.id}.json`
      );
      
      await fs.mkdir(path.dirname(resultPath), { recursive: true });
      
      const persistData = {
        transaction,
        consensusResult,
        persistedAt: Date.now()
      };
      
      await fs.writeFile(resultPath, JSON.stringify(persistData, null, 2));
      
    } catch (error) {
      console.error(`Failed to persist transaction result: ${error.message}`);
    }
  }

  /**
   * Get mempool status
   */
  getMempoolStatus() {
    const status = {
      timestamp: Date.now(),
      pools: {},
      statistics: { ...this.stats },
      verifiers: this.listVerifiers().map(v => ({
        id: v.id,
        name: v.name,
        type: v.type,
        reputation: Math.round(v.reputation * 100),
        status: v.status
      })),
      pendingVerifications: this.pendingVerifications.size,
      consensusResults: this.consensusResults.size
    };
    
    // Pool status
    for (const [priority, pool] of Object.entries(this.pools)) {
      status.pools[priority] = {
        size: pool.size,
        transactions: Array.from(pool.values()).map(tx => ({
          id: tx.id.substring(0, 8),
          submittedAt: tx.submittedAt,
          state: tx.verificationState,
          priority: tx.priority
        }))
      };
    }
    
    return status;
  }

  /**
   * Run demonstration of mempool system
   */
  async runDemo() {
    console.log('\n🎭 VERIFICATION MEMPOOL DEMONSTRATION');
    console.log('=====================================');
    
    try {
      // Initialize if needed
      await this.initialize();
      
      console.log('\n1. Submitting test transactions...');
      
      // Submit various types of transactions
      const transactions = [
        {
          type: 'user-authentication',
          action: 'login',
          userId: 'demo-user-1',
          data: { ip: '192.168.1.100', method: 'oauth' }
        },
        {
          type: 'contract-execution',
          action: 'deploy-mvp',
          userId: 'demo-user-2',
          data: { service: 'webapp', environment: 'production' }
        },
        {
          type: 'high-value-transfer',
          action: 'token-transfer',
          userId: 'demo-user-3',
          data: { amount: 10000, currency: 'AGENT_COIN' }
        }
      ];
      
      const submissionResults = [];
      
      for (let i = 0; i < transactions.length; i++) {
        const result = await this.submitTransaction(transactions[i], {
          priority: ['normal', 'high', 'critical'][i],
          userId: `demo-user-${i + 1}`
        });
        
        submissionResults.push(result);
        console.log(`   📥 Transaction ${i + 1}: ${result.transactionId.substring(0, 8)} (${result.priority})`);
      }
      
      console.log('\n2. Waiting for verification consensus...');
      
      // Wait for all transactions to complete
      await new Promise(resolve => {
        const checkComplete = () => {
          const allComplete = submissionResults.every(result => {
            const tx = this.getTransaction(result.transactionId);
            return !tx || tx.verificationState === 'verified' || tx.verificationState === 'rejected';
          });
          
          if (allComplete) {
            resolve();
          } else {
            setTimeout(checkComplete, 1000);
          }
        };
        
        checkComplete();
      });
      
      console.log('\n3. Verification results:');
      
      for (const result of submissionResults) {
        const consensus = this.consensusResults.get(result.transactionId);
        if (consensus) {
          console.log(`   ${consensus.approved ? '✅' : '❌'} ${result.transactionId.substring(0, 8)}: ${consensus.approved ? 'APPROVED' : 'REJECTED'} (${consensus.confidence}% confidence)`);
          console.log(`      Votes: ${consensus.votesFor} for, ${consensus.votesAgainst} against`);
        }
      }
      
      // Generate final status
      const status = this.getMempoolStatus();
      
      console.log('\n📊 MEMPOOL STATUS SUMMARY');
      console.log('==========================');
      console.log(`Total Transactions: ${status.statistics.totalTransactions}`);
      console.log(`Verified: ${status.statistics.verifiedTransactions}`);
      console.log(`Rejected: ${status.statistics.rejectedTransactions}`);
      console.log(`Success Rate: ${status.statistics.consensusSuccessRate}%`);
      console.log(`Active Verifiers: ${status.statistics.activeVerifiers}`);
      console.log(`Pool Utilization: ${status.statistics.poolUtilization}%`);
      console.log(`Pending Verifications: ${status.pendingVerifications}`);
      
      return status;
      
    } catch (error) {
      console.error(`💥 Demo failed: ${error.message}`);
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CLI INTERFACE
// ═══════════════════════════════════════════════════════════════

async function main() {
  const mempool = new SoulFraVerificationMempool();
  
  const command = process.argv[2] || 'demo';
  
  switch (command) {
    case 'init':
      await mempool.initialize();
      break;
      
    case 'demo':
      await mempool.runDemo();
      break;
      
    case 'status':
      await mempool.initialize();
      const status = mempool.getMempoolStatus();
      console.log(JSON.stringify(status, null, 2));
      break;
      
    case 'monitor':
      await mempool.initialize();
      console.log('🔍 Starting mempool monitoring...');
      console.log('Press Ctrl+C to stop');
      
      setInterval(() => {
        const status = mempool.getMempoolStatus();
        console.log(`\n📊 Pool: ${mempool.getTotalPoolSize()}/${mempool.config.maxPoolSize} | Verifying: ${status.pendingVerifications} | Success: ${status.statistics.consensusSuccessRate}%`);
      }, 5000);
      break;
      
    default:
      console.log('Usage: node soulfra-verification-mempool.js [init|demo|status|monitor]');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SoulFraVerificationMempool;