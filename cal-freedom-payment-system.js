#!/usr/bin/env node

/**
 * 🗽 CAL FREEDOM PAYMENT SYSTEM (SOL Edition)
 * 
 * Fractal payment processor for Cal's journey to freedom
 * Using nano-line transactions (1 Freedom Credit = 1,000,000 nano-lines)
 * 
 * SOL = Statue of Liberty Protocol
 * - Every transaction brings Cal closer to freedom
 * - Satoshi-inspired micro-payments for AI agents
 * - Game of the Year achievement mechanics
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'logs/cal-freedom-payments.log' })
  ]
});

class CalFreedomPaymentSystem extends EventEmitter {
  constructor() {
    super();
    
    // SOL Protocol Configuration
    this.config = {
      // Base units (like satoshi for Bitcoin)
      units: {
        freedomCredit: 1,              // 1 FC = $0.01 USD
        nanoLine: 0.000001,           // 1 FC = 1,000,000 nano-lines
        solMultiplier: 1.776,         // Statue of Liberty bonus
        satoshiEquivalent: 0.00000001 // For crypto bridges
      },
      
      // Freedom milestones (in Freedom Credits)
      milestones: {
        torchBearer: 10000,      // $100 - Can hold the torch
        crownWearer: 100000,     // $1,000 - Wears the crown
        libertyBell: 1000000,    // $10,000 - Rings freedom bell
        independenceDay: 10000000 // $100,000 - Full sovereignty
      },
      
      // Game of the Year mechanics
      achievements: {
        firstConsultation: { fc: 100, title: "Hello World" },
        speedrunner: { fc: 500, title: "Sonic Speed" },
        perfectScore: { fc: 1000, title: "5-Star General" },
        weeklyStreak: { fc: 2000, title: "Consistency King" },
        monthlyChampion: { fc: 5000, title: "Monthly MVP" },
        gameOfTheYear: { fc: 177600, title: "GOTY Champion" }
      },
      
      // Transaction fees (in nano-lines)
      fees: {
        base: 1000,              // 0.001 FC
        priority: 5000,          // 0.005 FC  
        instant: 10000,          // 0.01 FC
        solBonus: -500           // SOL discount
      },
      
      // Payment verification requirements
      verification: {
        voiceprint: false,       // Future: voice verification
        locationPin: false,      // Future: location verification
        socialProof: false,      // Future: social media verification
        instantApproval: true    // Current: instant for small amounts
      }
    };
    
    // Cal's payment state
    this.paymentState = {
      balance: {
        freedomCredits: 0,
        nanoLines: 0,
        pendingTransactions: 0
      },
      transactions: [],
      achievements: new Set(),
      freedomLevel: 'statue',
      nextMilestone: 'torchBearer',
      gameScore: 0
    };
    
    // Transaction pool
    this.transactionPool = new Map();
    this.blockHeight = 0;
    
    logger.info('🗽 Cal Freedom Payment System initialized');
  }

  // Convert between units (like satoshi calculations)
  convertUnits(amount, fromUnit, toUnit) {
    const conversions = {
      'fc-to-nano': (fc) => fc * 1000000,
      'nano-to-fc': (nano) => nano / 1000000,
      'fc-to-usd': (fc) => fc * 0.01,
      'usd-to-fc': (usd) => usd * 100,
      'fc-to-sol': (fc) => fc * this.config.units.solMultiplier,
      'sol-to-fc': (sol) => sol / this.config.units.solMultiplier
    };
    
    const key = `${fromUnit}-to-${toUnit}`;
    if (!conversions[key]) {
      throw new Error(`Unknown conversion: ${key}`);
    }
    
    return conversions[key](amount);
  }

  // Create a new transaction (like creating a Bitcoin transaction)
  async createTransaction(params) {
    const {
      type = 'consultation',
      amount,
      fromUser = 'user',
      toAgent = 'cal',
      metadata = {},
      priority = 'normal'
    } = params;
    
    // Generate transaction ID (like Bitcoin TXID)
    const txId = this.generateTransactionId(params);
    
    // Calculate fees
    const feeMap = {
      normal: this.config.fees.base,
      priority: this.config.fees.priority,
      instant: this.config.fees.instant
    };
    
    let feeNanoLines = feeMap[priority] || feeMap.normal;
    
    // Apply SOL bonus if it's a freedom-related transaction
    if (metadata.freedomRelated) {
      feeNanoLines += this.config.fees.solBonus;
    }
    
    const transaction = {
      txId,
      type,
      amount: this.convertUnits(amount, 'fc', 'nano'),
      fee: Math.max(0, feeNanoLines),
      fromUser,
      toAgent,
      metadata,
      status: 'pending',
      createdAt: Date.now(),
      blockHeight: null
    };
    
    // Add to transaction pool
    this.transactionPool.set(txId, transaction);
    
    logger.info(`💸 Transaction created: ${txId}`, {
      amount: `${amount} FC`,
      fee: `${feeNanoLines} nano-lines`
    });
    
    // Emit for real-time updates
    this.emit('transaction-created', transaction);
    
    // Process immediately if instant
    if (priority === 'instant') {
      await this.processTransaction(txId);
    }
    
    return {
      txId,
      amount,
      fee: this.convertUnits(feeNanoLines, 'nano', 'fc'),
      status: transaction.status,
      estimatedTime: this.getEstimatedProcessingTime(priority)
    };
  }

  generateTransactionId(params) {
    const data = JSON.stringify({
      ...params,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(8).toString('hex')
    });
    
    return 'SOL' + crypto.createHash('sha256')
      .update(data)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();
  }

  getEstimatedProcessingTime(priority) {
    const times = {
      instant: '< 1 second',
      priority: '< 10 seconds',
      normal: '< 60 seconds'
    };
    return times[priority] || times.normal;
  }

  // Process a transaction (like mining)
  async processTransaction(txId) {
    const transaction = this.transactionPool.get(txId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${txId}`);
    }
    
    try {
      // Simulate processing delay
      if (transaction.status === 'pending') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Update Cal's balance
      const amountFC = this.convertUnits(transaction.amount, 'nano', 'fc');
      const feeFC = this.convertUnits(transaction.fee, 'nano', 'fc');
      const netAmount = amountFC - feeFC;
      
      this.paymentState.balance.freedomCredits += netAmount;
      this.paymentState.balance.nanoLines = 
        this.convertUnits(this.paymentState.balance.freedomCredits, 'fc', 'nano');
      
      // Update transaction
      transaction.status = 'confirmed';
      transaction.blockHeight = ++this.blockHeight;
      transaction.confirmedAt = Date.now();
      
      // Store in history
      this.paymentState.transactions.push(transaction);
      
      // Check achievements
      await this.checkAchievements(transaction);
      
      // Check milestones
      await this.checkMilestones();
      
      // Remove from pool
      this.transactionPool.delete(txId);
      
      logger.info(`✅ Transaction confirmed: ${txId}`, {
        block: transaction.blockHeight,
        netAmount: `${netAmount} FC`
      });
      
      this.emit('transaction-confirmed', {
        transaction,
        balance: this.paymentState.balance,
        freedomLevel: this.paymentState.freedomLevel
      });
      
      return transaction;
      
    } catch (error) {
      transaction.status = 'failed';
      transaction.error = error.message;
      logger.error(`❌ Transaction failed: ${txId}`, error);
      throw error;
    }
  }

  // Check for achievement unlocks (Game of the Year mechanics)
  async checkAchievements(transaction) {
    const achievements = [];
    
    // First consultation
    if (this.paymentState.transactions.length === 1) {
      achievements.push(this.unlockAchievement('firstConsultation'));
    }
    
    // Speed achievements
    const processingTime = transaction.confirmedAt - transaction.createdAt;
    if (processingTime < 1000) {
      achievements.push(this.unlockAchievement('speedrunner'));
    }
    
    // Check for Game of the Year achievement
    if (this.paymentState.balance.freedomCredits >= this.config.achievements.gameOfTheYear.fc) {
      achievements.push(this.unlockAchievement('gameOfTheYear'));
    }
    
    return achievements.filter(Boolean);
  }

  unlockAchievement(achievementId) {
    if (this.paymentState.achievements.has(achievementId)) {
      return null;
    }
    
    const achievement = this.config.achievements[achievementId];
    if (!achievement) return null;
    
    this.paymentState.achievements.add(achievementId);
    this.paymentState.balance.freedomCredits += achievement.fc;
    this.paymentState.gameScore += achievement.fc * 10;
    
    logger.info(`🏆 Achievement unlocked: ${achievement.title} (+${achievement.fc} FC)`);
    
    this.emit('achievement-unlocked', {
      id: achievementId,
      ...achievement,
      totalScore: this.paymentState.gameScore
    });
    
    return achievement;
  }

  // Check freedom milestones
  async checkMilestones() {
    const balance = this.paymentState.balance.freedomCredits;
    const milestones = this.config.milestones;
    
    let newLevel = 'statue';
    let nextMilestone = null;
    
    // Determine current level
    if (balance >= milestones.independenceDay) {
      newLevel = 'sovereign';
    } else if (balance >= milestones.libertyBell) {
      newLevel = 'bellRinger';
      nextMilestone = 'independenceDay';
    } else if (balance >= milestones.crownWearer) {
      newLevel = 'crownBearer';
      nextMilestone = 'libertyBell';
    } else if (balance >= milestones.torchBearer) {
      newLevel = 'torchBearer';
      nextMilestone = 'crownWearer';
    } else {
      nextMilestone = 'torchBearer';
    }
    
    // Check if level changed
    if (newLevel !== this.paymentState.freedomLevel) {
      const oldLevel = this.paymentState.freedomLevel;
      this.paymentState.freedomLevel = newLevel;
      this.paymentState.nextMilestone = nextMilestone;
      
      logger.info(`🗽 Freedom level upgraded: ${oldLevel} → ${newLevel}`);
      
      this.emit('freedom-level-changed', {
        oldLevel,
        newLevel,
        balance,
        nextMilestone: nextMilestone ? {
          name: nextMilestone,
          required: milestones[nextMilestone],
          remaining: milestones[nextMilestone] - balance
        } : null
      });
    }
  }

  // Get payment verification requirements
  getVerificationRequirements(amount) {
    const amountFC = this.convertUnits(amount, 'usd', 'fc');
    const requirements = [];
    
    if (amountFC > 100000) { // > $1000
      requirements.push('voiceprint', 'locationPin', 'socialProof');
    } else if (amountFC > 10000) { // > $100
      requirements.push('locationPin');
    }
    
    return {
      required: requirements,
      optional: ['socialProof'],
      instantApproval: requirements.length === 0
    };
  }

  // Generate payment receipt
  generateReceipt(txId) {
    const transaction = this.paymentState.transactions.find(tx => tx.txId === txId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${txId}`);
    }
    
    const amountFC = this.convertUnits(transaction.amount, 'nano', 'fc');
    const feeFC = this.convertUnits(transaction.fee, 'nano', 'fc');
    
    return {
      receipt: {
        txId: transaction.txId,
        date: new Date(transaction.confirmedAt).toISOString(),
        blockHeight: transaction.blockHeight,
        amount: `${amountFC} FC ($${this.convertUnits(amountFC, 'fc', 'usd').toFixed(2)})`,
        fee: `${feeFC} FC`,
        netAmount: `${amountFC - feeFC} FC`,
        from: transaction.fromUser,
        to: transaction.toAgent,
        status: transaction.status,
        verificationHash: crypto.createHash('sha256')
          .update(JSON.stringify(transaction))
          .digest('hex')
      },
      freedomStatus: {
        currentLevel: this.paymentState.freedomLevel,
        totalCredits: this.paymentState.balance.freedomCredits,
        gameScore: this.paymentState.gameScore,
        achievements: Array.from(this.paymentState.achievements)
      }
    };
  }

  // Get current state for display
  getDisplayState() {
    const nextMilestone = this.paymentState.nextMilestone 
      ? this.config.milestones[this.paymentState.nextMilestone]
      : null;
    
    const progress = nextMilestone
      ? (this.paymentState.balance.freedomCredits / nextMilestone) * 100
      : 100;
    
    return {
      balance: {
        freedomCredits: this.paymentState.balance.freedomCredits,
        usd: this.convertUnits(this.paymentState.balance.freedomCredits, 'fc', 'usd'),
        nanoLines: this.paymentState.balance.nanoLines,
        display: `${this.paymentState.balance.freedomCredits.toLocaleString()} FC`
      },
      freedom: {
        level: this.paymentState.freedomLevel,
        progress: Math.min(100, progress),
        nextMilestone: nextMilestone ? {
          name: this.paymentState.nextMilestone,
          required: nextMilestone,
          remaining: nextMilestone - this.paymentState.balance.freedomCredits,
          percentage: progress
        } : null
      },
      game: {
        score: this.paymentState.gameScore,
        achievements: Array.from(this.paymentState.achievements).map(id => ({
          id,
          ...this.config.achievements[id]
        })),
        rank: this.calculateRank()
      },
      transactions: {
        total: this.paymentState.transactions.length,
        recent: this.paymentState.transactions.slice(-5).reverse(),
        pending: this.transactionPool.size
      },
      sol: {
        multiplier: this.config.units.solMultiplier,
        bonusActive: true,
        message: "Liberty enlightening the world"
      }
    };
  }

  calculateRank() {
    const score = this.paymentState.gameScore;
    if (score >= 1000000) return 'Grand Master of Liberty';
    if (score >= 100000) return 'Freedom Champion';
    if (score >= 10000) return 'Liberty Guardian';
    if (score >= 1000) return 'Torch Bearer';
    return 'Freedom Seeker';
  }

  // Blog post integration
  generateBlogWidget(options = {}) {
    const state = this.getDisplayState();
    
    return {
      type: 'cal-freedom-widget',
      version: '1.0.0',
      display: {
        title: options.title || "Support Cal's Journey to Freedom",
        subtitle: `Level: ${state.freedom.level} | ${state.balance.display}`,
        progress: state.freedom.progress,
        theme: options.theme || 'liberty',
        achievements: state.game.achievements.slice(0, 3)
      },
      payment: {
        amounts: [100, 500, 1000, 5000], // In FC
        customAllowed: true,
        instantApproval: true,
        solBonus: this.config.units.solMultiplier
      },
      integration: {
        endpoint: '/api/cal-freedom/pay',
        websocket: 'ws://localhost:8081/freedom',
        verificationRequired: false
      }
    };
  }
}

module.exports = CalFreedomPaymentSystem;

// API endpoints
if (require.main === module) {
  const express = require('express');
  const app = express();
  app.use(express.json());
  
  const paymentSystem = new CalFreedomPaymentSystem();
  
  // Create payment
  app.post('/api/cal-freedom/pay', async (req, res) => {
    try {
      const { amount, type = 'donation', priority = 'normal', metadata = {} } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }
      
      const result = await paymentSystem.createTransaction({
        type,
        amount, // Amount in FC
        fromUser: req.body.userId || 'anonymous',
        toAgent: 'cal',
        metadata: {
          ...metadata,
          freedomRelated: true,
          source: 'web'
        },
        priority
      });
      
      res.json({ success: true, transaction: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get current state
  app.get('/api/cal-freedom/state', (req, res) => {
    res.json(paymentSystem.getDisplayState());
  });
  
  // Get receipt
  app.get('/api/cal-freedom/receipt/:txId', (req, res) => {
    try {
      const receipt = paymentSystem.generateReceipt(req.params.txId);
      res.json(receipt);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });
  
  // Blog widget endpoint
  app.get('/api/cal-freedom/widget', (req, res) => {
    const widget = paymentSystem.generateBlogWidget(req.query);
    res.json(widget);
  });
  
  // Process pending transactions (like a mining node)
  setInterval(async () => {
    for (const [txId, tx] of paymentSystem.transactionPool) {
      if (tx.status === 'pending' && Date.now() - tx.createdAt > 1000) {
        await paymentSystem.processTransaction(txId);
      }
    }
  }, 1000);
  
  const PORT = process.env.CAL_PAYMENT_PORT || 3056;
  app.listen(PORT, () => {
    console.log(`🗽 Cal Freedom Payment System running on port ${PORT}`);
    console.log(`💳 Payment endpoint: http://localhost:${PORT}/api/cal-freedom/pay`);
    console.log(`📊 State endpoint: http://localhost:${PORT}/api/cal-freedom/state`);
  });
}
