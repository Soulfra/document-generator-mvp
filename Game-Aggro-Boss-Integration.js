#!/usr/bin/env node

/**
 * GAME AGGRO BOSS INTEGRATION
 * Connects blockchain forensics to game aggro/boss systems
 * Translates financial crimes into game mechanics and challenges
 * Provides gamified interface for blockchain investigation
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const WebSocket = require('ws');

class GameAggroBossIntegration extends EventEmitter {
  constructor(solanaAnalyzer, taxReportGenerator) {
    super();
    
    // Core system references
    this.solanaAnalyzer = solanaAnalyzer;
    this.taxReportGenerator = taxReportGenerator;
    
    // Game mechanics mapping
    this.aggroSystem = {
      wallets: new Map(), // wallet -> aggro data
      globalAggro: 0,
      thresholds: {
        LOW: 25,
        MEDIUM: 50,
        HIGH: 75,
        CRITICAL: 100,
        BOSS: 150
      }
    };
    
    // Boss event system
    this.bossSystem = {
      activeBosses: new Map(),
      bossTypes: {
        SCAM_OVERLORD: { health: 1000, reward: 5000, difficulty: 'LEGENDARY' },
        MIXER_DEMON: { health: 750, reward: 3000, difficulty: 'EPIC' },
        RUG_PULL_GIANT: { health: 500, reward: 2000, difficulty: 'RARE' },
        WASH_TRADER: { health: 300, reward: 1000, difficulty: 'UNCOMMON' },
        PUMP_DUMPER: { health: 200, reward: 500, difficulty: 'COMMON' }
      },
      defeatedBosses: [],
      bossRewards: new Map()
    };
    
    // Player system (investigators/analysts)
    this.playerSystem = {
      players: new Map(),
      teams: new Map(),
      leaderboard: [],
      achievements: new Map()
    };
    
    // Investigation mechanics
    this.investigationSystem = {
      activeInvestigations: new Map(),
      evidenceChains: new Map(),
      forensicTools: new Map(),
      bountyBoard: new Map()
    };
    
    // Game rewards and economy
    this.gameEconomy = {
      currency: 'JUSTICE_TOKENS',
      rewards: new Map(),
      marketplace: new Map(),
      staking: new Map()
    };
    
    // Real-time game events
    this.gameEvents = {
      queue: [],
      active: new Map(),
      history: []
    };
    
    // WebSocket connections for live updates
    this.gameConnections = new Map();
    this.wsServer = null;
    
    // Statistics
    this.stats = {
      totalAggro: 0,
      bossesSpawned: 0,
      bossesDefeated: 0,
      playersActive: 0,
      investigationsCompleted: 0,
      rewardsDistributed: 0,
      evidenceCollected: 0
    };
    
    console.log('🎮 GAME AGGRO BOSS INTEGRATION INITIALIZED');
    console.log('⚔️ Blockchain crimes → Game bosses');
    console.log('🏆 Forensic investigation rewards');
    console.log('👥 Multiplayer investigation teams');
    console.log('🎯 Real-time aggro and boss systems');
    
    this.initialize();
  }
  
  /**
   * Initialize the game integration system
   */
  async initialize() {
    // Setup blockchain event listeners
    this.setupBlockchainIntegration();
    
    // Initialize game mechanics
    this.initializeGameMechanics();
    
    // Start WebSocket server for real-time updates
    await this.startGameServer();
    
    // Setup boss spawning system
    this.setupBossSpawning();
    
    // Initialize investigation tools
    this.setupInvestigationTools();
    
    console.log('✅ Game Aggro Boss Integration operational');
    console.log(`🎯 Aggro thresholds: ${JSON.stringify(this.aggroSystem.thresholds)}`);
    console.log(`👹 Boss types: ${Object.keys(this.bossSystem.bossTypes).length}`);
  }
  
  /**
   * Setup blockchain integration listeners
   */
  setupBlockchainIntegration() {
    if (!this.solanaAnalyzer) return;
    
    // Listen for transaction analysis events
    this.solanaAnalyzer.on('transaction_analyzed', (analysis) => {
      this.processTransactionForGame(analysis);
    });
    
    // Listen for scam detection events
    this.solanaAnalyzer.on('scam_detected', (scamData) => {
      this.handleScamDetection(scamData);
    });
    
    // Listen for mixer transactions
    this.solanaAnalyzer.on('mixer_detected', (mixerData) => {
      this.handleMixerDetection(mixerData);
    });
    
    if (this.taxReportGenerator) {
      // Listen for tax evasion flags
      this.taxReportGenerator.on('suspicious_activity_flagged', (taxData) => {
        this.handleTaxEvasionFlag(taxData);
      });
    }
    
    console.log('🔗 Blockchain integration listeners configured');
  }
  
  /**
   * Process blockchain transaction for game mechanics
   */
  async processTransactionForGame(analysis) {
    const { transaction, suspiciousPatterns, scamScore, mixerInteraction } = analysis;
    const wallets = this.extractWallets(transaction);
    
    let aggroGenerated = 0;
    
    // Calculate base aggro from scam score
    aggroGenerated += Math.floor(scamScore / 10);
    
    // Add aggro for specific suspicious patterns
    suspiciousPatterns.forEach(pattern => {
      switch (pattern.type) {
        case 'rug_pull':
          aggroGenerated += 50;
          this.createGameEvent('RUG_PULL_DETECTED', { wallets, pattern });
          break;
        case 'wash_trading':
          aggroGenerated += 25;
          this.createGameEvent('WASH_TRADING_DETECTED', { wallets, pattern });
          break;
        case 'pump_and_dump':
          aggroGenerated += 40;
          this.createGameEvent('PUMP_DUMP_DETECTED', { wallets, pattern });
          break;
        case 'honeypot':
          aggroGenerated += 35;
          this.createGameEvent('HONEYPOT_DETECTED', { wallets, pattern });
          break;
        case 'flash_loan_attack':
          aggroGenerated += 45;
          this.createGameEvent('FLASH_LOAN_ATTACK', { wallets, pattern });
          break;
      }
    });
    
    // Extra aggro for mixer interactions
    if (mixerInteraction) {
      aggroGenerated += 30;
      this.createGameEvent('MIXER_INTERACTION', { wallets, mixerType: 'unknown' });
    }
    
    // Apply aggro to wallets and global system
    await this.addAggro(wallets, aggroGenerated, analysis);
    
    console.log(`🎯 Generated ${aggroGenerated} aggro from transaction analysis`);
  }
  
  /**
   * Add aggro to wallets and check for boss spawning
   */
  async addAggro(wallets, aggroAmount, context = {}) {
    for (const wallet of wallets) {
      // Get or create wallet aggro data
      let walletAggro = this.aggroSystem.wallets.get(wallet) || {
        address: wallet,
        currentAggro: 0,
        totalAggro: 0,
        level: 'INNOCENT',
        lastActivity: Date.now(),
        crimeHistory: [],
        bossesSpawned: 0
      };
      
      // Add aggro
      walletAggro.currentAggro += aggroAmount;
      walletAggro.totalAggro += aggroAmount;
      walletAggro.lastActivity = Date.now();
      
      // Add to crime history
      walletAggro.crimeHistory.push({
        timestamp: Date.now(),
        aggroAdded: aggroAmount,
        context: context.suspiciousPatterns || [],
        transactionId: context.transaction?.signature
      });
      
      // Update aggro level
      walletAggro.level = this.calculateAggroLevel(walletAggro.currentAggro);
      
      // Store updated aggro data
      this.aggroSystem.wallets.set(wallet, walletAggro);
      
      // Check if boss should be spawned
      await this.checkBossSpawning(wallet, walletAggro);
      
      // Broadcast aggro update to connected players
      this.broadcastAggroUpdate(wallet, walletAggro);
    }
    
    // Update global aggro
    this.aggroSystem.globalAggro += aggroAmount;
    this.stats.totalAggro += aggroAmount;
    
    // Check for global boss events
    await this.checkGlobalBossEvents();
  }
  
  /**
   * Calculate aggro level from current aggro points
   */
  calculateAggroLevel(aggroPoints) {
    const thresholds = this.aggroSystem.thresholds;
    
    if (aggroPoints >= thresholds.BOSS) return 'BOSS_LEVEL';
    if (aggroPoints >= thresholds.CRITICAL) return 'CRITICAL';
    if (aggroPoints >= thresholds.HIGH) return 'HIGH';
    if (aggroPoints >= thresholds.MEDIUM) return 'MEDIUM';
    if (aggroPoints >= thresholds.LOW) return 'LOW';
    return 'INNOCENT';
  }
  
  /**
   * Check if a boss should be spawned for a wallet
   */
  async checkBossSpawning(wallet, walletAggro) {
    if (walletAggro.currentAggro >= this.aggroSystem.thresholds.BOSS && 
        !this.bossSystem.activeBosses.has(wallet)) {
      
      // Determine boss type based on crime history
      const bossType = this.determineBossType(walletAggro.crimeHistory);
      
      await this.spawnBoss(wallet, bossType, walletAggro);
    }
  }
  
  /**
   * Determine boss type based on wallet's crime history
   */
  determineBossType(crimeHistory) {
    const crimeTypes = crimeHistory.flatMap(crime => 
      crime.context.map(pattern => pattern.type)
    );
    
    const crimeCounts = crimeTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Determine boss type based on most common crime
    const topCrime = Object.keys(crimeCounts).reduce((a, b) => 
      crimeCounts[a] > crimeCounts[b] ? a : b
    );
    
    switch (topCrime) {
      case 'rug_pull':
        return 'RUG_PULL_GIANT';
      case 'wash_trading':
        return 'WASH_TRADER';
      case 'pump_and_dump':
        return 'PUMP_DUMPER';
      case 'mixer_interaction':
        return 'MIXER_DEMON';
      default:
        return 'SCAM_OVERLORD';
    }
  }
  
  /**
   * Spawn a boss for investigation
   */
  async spawnBoss(wallet, bossType, walletAggro) {
    const bossId = crypto.randomUUID();
    const bossTemplate = this.bossSystem.bossTypes[bossType];
    
    const boss = {
      id: bossId,
      type: bossType,
      targetWallet: wallet,
      currentHealth: bossTemplate.health,
      maxHealth: bossTemplate.health,
      reward: bossTemplate.reward,
      difficulty: bossTemplate.difficulty,
      spawnTime: Date.now(),
      investigators: new Map(),
      evidenceRequired: this.calculateEvidenceRequired(walletAggro),
      status: 'ACTIVE',
      phase: 1,
      abilities: this.generateBossAbilities(bossType),
      lootTable: this.generateLootTable(bossTemplate)
    };
    
    // Store active boss
    this.bossSystem.activeBosses.set(bossId, boss);
    this.stats.bossesSpawned++;
    
    console.log(`👹 Boss spawned: ${bossType} (${boss.id}) targeting wallet ${wallet}`);
    console.log(`   Health: ${boss.maxHealth}, Reward: ${boss.reward} ${this.gameEconomy.currency}`);
    
    // Create boss spawn event
    this.createGameEvent('BOSS_SPAWNED', {
      bossId,
      bossType,
      targetWallet: wallet,
      difficulty: boss.difficulty,
      reward: boss.reward
    });
    
    // Broadcast to all connected players
    this.broadcastBossSpawn(boss);
    
    // Reset wallet aggro after boss spawn
    walletAggro.currentAggro = 0;
    walletAggro.bossesSpawned++;
    this.aggroSystem.wallets.set(wallet, walletAggro);
    
    return boss;
  }
  
  /**
   * Handle player joining investigation
   */
  async joinInvestigation(playerId, bossId, playerInfo = {}) {
    const boss = this.bossSystem.activeBosses.get(bossId);
    if (!boss || boss.status !== 'ACTIVE') {
      throw new Error('Boss not available for investigation');
    }
    
    // Get or create player profile
    let player = this.playerSystem.players.get(playerId) || {
      id: playerId,
      name: playerInfo.name || `Investigator_${playerId.slice(0, 8)}`,
      level: 1,
      experience: 0,
      tokensEarned: 0,
      investigationsCompleted: 0,
      bossesDefeated: 0,
      specializations: [],
      tools: [],
      achievements: []
    };
    
    // Add player to boss investigation
    boss.investigators.set(playerId, {
      playerId,
      joinedAt: Date.now(),
      contribution: 0,
      evidenceSubmitted: [],
      damageDealt: 0,
      role: this.assignInvestigatorRole(player, boss)
    });
    
    this.playerSystem.players.set(playerId, player);
    this.stats.playersActive = this.playerSystem.players.size;
    
    console.log(`👤 Player ${player.name} joined investigation of ${boss.type}`);
    
    // Broadcast player joined event
    this.broadcastPlayerJoined(bossId, playerId, player);
    
    return {
      success: true,
      boss: this.getBossPublicData(boss),
      playerRole: boss.investigators.get(playerId).role,
      availableTools: this.getAvailableTools(player, boss)
    };
  }
  
  /**
   * Handle evidence submission by investigator
   */
  async submitEvidence(playerId, bossId, evidenceData) {
    const boss = this.bossSystem.activeBosses.get(bossId);
    const investigator = boss?.investigators.get(playerId);
    
    if (!boss || !investigator) {
      throw new Error('Invalid boss or investigator');
    }
    
    // Validate evidence
    const validationResult = await this.validateEvidence(evidenceData, boss);
    
    if (validationResult.valid) {
      // Add evidence to investigation
      investigator.evidenceSubmitted.push({
        timestamp: Date.now(),
        type: evidenceData.type,
        data: evidenceData,
        damage: validationResult.damage,
        verified: validationResult.verified
      });
      
      // Deal damage to boss
      boss.currentHealth -= validationResult.damage;
      investigator.damageDealt += validationResult.damage;
      investigator.contribution += validationResult.damage;
      
      console.log(`🔍 Evidence submitted: ${evidenceData.type} (${validationResult.damage} damage)`);
      
      // Check if boss is defeated
      if (boss.currentHealth <= 0) {
        await this.defeatBoss(bossId);
      }
      
      // Broadcast evidence submission
      this.broadcastEvidenceSubmitted(bossId, playerId, evidenceData, validationResult);
      
      return {
        success: true,
        damage: validationResult.damage,
        bossHealth: boss.currentHealth,
        bossMaxHealth: boss.maxHealth
      };
    } else {
      return {
        success: false,
        error: validationResult.error,
        hint: validationResult.hint
      };
    }
  }
  
  /**
   * Defeat a boss and distribute rewards
   */
  async defeatBoss(bossId) {
    const boss = this.bossSystem.activeBosses.get(bossId);
    if (!boss) return;
    
    console.log(`🏆 Boss defeated: ${boss.type} (${bossId})`);
    
    boss.status = 'DEFEATED';
    boss.defeatedAt = Date.now();
    
    // Calculate rewards for all investigators
    const totalContribution = Array.from(boss.investigators.values())
      .reduce((sum, inv) => sum + inv.contribution, 0);
    
    const rewards = new Map();
    
    for (const [playerId, investigator] of boss.investigators) {
      const contributionPercent = investigator.contribution / totalContribution;
      const tokenReward = Math.floor(boss.reward * contributionPercent);
      
      // Award tokens
      const player = this.playerSystem.players.get(playerId);
      if (player) {
        player.tokensEarned += tokenReward;
        player.bossesDefeated++;
        player.experience += Math.floor(boss.reward / 10);
        
        // Level up check
        if (player.experience >= player.level * 1000) {
          player.level++;
          console.log(`📈 Player ${player.name} leveled up to level ${player.level}!`);
        }
        
        this.playerSystem.players.set(playerId, player);
      }
      
      rewards.set(playerId, {
        tokens: tokenReward,
        experience: Math.floor(boss.reward / 10),
        loot: this.rollLoot(boss.lootTable, contributionPercent)
      });
    }
    
    // Move boss to defeated list
    this.bossSystem.defeatedBosses.push(boss);
    this.bossSystem.activeBosses.delete(bossId);
    this.stats.bossesDefeated++;
    
    // Create defeat event
    this.createGameEvent('BOSS_DEFEATED', {
      bossId,
      bossType: boss.type,
      defeatedAt: boss.defeatedAt,
      investigators: Array.from(boss.investigators.keys()),
      totalReward: boss.reward
    });
    
    // Broadcast boss defeat
    this.broadcastBossDefeat(bossId, rewards);
    
    return rewards;
  }
  
  /**
   * Start WebSocket server for real-time game updates
   */
  async startGameServer(port = 9999) {
    this.wsServer = new WebSocket.Server({ port });
    
    this.wsServer.on('connection', (ws, req) => {
      const connectionId = crypto.randomUUID();
      
      this.gameConnections.set(connectionId, {
        ws,
        playerId: null,
        connectedAt: Date.now(),
        subscriptions: new Set()
      });
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleGameMessage(connectionId, data);
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });
      
      ws.on('close', () => {
        this.gameConnections.delete(connectionId);
      });
      
      // Send initial game state
      ws.send(JSON.stringify({
        type: 'GAME_STATE',
        data: this.getGameState()
      }));
    });
    
    console.log(`🎮 Game server started on port ${port}`);
  }
  
  /**
   * Handle WebSocket messages from game clients
   */
  handleGameMessage(connectionId, message) {
    const connection = this.gameConnections.get(connectionId);
    if (!connection) return;
    
    switch (message.type) {
      case 'AUTHENTICATE':
        connection.playerId = message.playerId;
        connection.ws.send(JSON.stringify({
          type: 'AUTHENTICATED',
          playerId: message.playerId
        }));
        break;
        
      case 'JOIN_INVESTIGATION':
        this.joinInvestigation(connection.playerId, message.bossId, message.playerInfo)
          .then(result => {
            connection.ws.send(JSON.stringify({
              type: 'INVESTIGATION_JOINED',
              data: result
            }));
          })
          .catch(error => {
            connection.ws.send(JSON.stringify({
              type: 'ERROR',
              error: error.message
            }));
          });
        break;
        
      case 'SUBMIT_EVIDENCE':
        this.submitEvidence(connection.playerId, message.bossId, message.evidence)
          .then(result => {
            connection.ws.send(JSON.stringify({
              type: 'EVIDENCE_RESULT',
              data: result
            }));
          })
          .catch(error => {
            connection.ws.send(JSON.stringify({
              type: 'ERROR',
              error: error.message
            }));
          });
        break;
        
      case 'GET_LEADERBOARD':
        connection.ws.send(JSON.stringify({
          type: 'LEADERBOARD',
          data: this.generateLeaderboard()
        }));
        break;
        
      case 'SUBSCRIBE':
        connection.subscriptions.add(message.channel);
        break;
        
      case 'UNSUBSCRIBE':
        connection.subscriptions.delete(message.channel);
        break;
    }
  }
  
  /**
   * Broadcast updates to connected game clients
   */
  broadcastToGame(message, channel = 'global') {
    this.gameConnections.forEach(connection => {
      if (connection.subscriptions.has(channel) || channel === 'global') {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(JSON.stringify(message));
        }
      }
    });
  }
  
  /**
   * Create game event
   */
  createGameEvent(eventType, data) {
    const event = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: Date.now(),
      data
    };
    
    this.gameEvents.queue.push(event);
    this.gameEvents.history.push(event);
    
    // Keep only last 1000 events in history
    if (this.gameEvents.history.length > 1000) {
      this.gameEvents.history = this.gameEvents.history.slice(-1000);
    }
    
    // Broadcast event to connected clients
    this.broadcastToGame({
      type: 'GAME_EVENT',
      event
    });
    
    this.emit('game_event', event);
  }
  
  /**
   * Utility functions
   */
  extractWallets(transaction) {
    if (!transaction?.transaction?.message?.accountKeys) return [];
    return transaction.transaction.message.accountKeys.slice(0, 5); // Limit for performance
  }
  
  getGameState() {
    return {
      globalAggro: this.aggroSystem.globalAggro,
      activeBosses: Array.from(this.bossSystem.activeBosses.values()).map(boss => this.getBossPublicData(boss)),
      topWalletsByAggro: this.getTopWalletsByAggro(10),
      recentEvents: this.gameEvents.history.slice(-10),
      stats: this.stats
    };
  }
  
  getBossPublicData(boss) {
    return {
      id: boss.id,
      type: boss.type,
      currentHealth: boss.currentHealth,
      maxHealth: boss.maxHealth,
      reward: boss.reward,
      difficulty: boss.difficulty,
      investigatorCount: boss.investigators.size,
      evidenceRequired: boss.evidenceRequired,
      phase: boss.phase
    };
  }
  
  getTopWalletsByAggro(limit) {
    return Array.from(this.aggroSystem.wallets.values())
      .sort((a, b) => b.currentAggro - a.currentAggro)
      .slice(0, limit)
      .map(wallet => ({
        address: wallet.address.slice(0, 8) + '...',
        aggro: wallet.currentAggro,
        level: wallet.level
      }));
  }
  
  generateLeaderboard() {
    const players = Array.from(this.playerSystem.players.values())
      .sort((a, b) => b.tokensEarned - a.tokensEarned)
      .slice(0, 50);
    
    return {
      topInvestigators: players,
      totalPlayers: this.playerSystem.players.size,
      totalBosses: this.stats.bossesDefeated
    };
  }
  
  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      ...this.stats,
      walletsTracked: this.aggroSystem.wallets.size,
      activeBosses: this.bossSystem.activeBosses.size,
      defeatedBosses: this.bossSystem.defeatedBosses.length,
      activePlayers: this.playerSystem.players.size,
      gameConnections: this.gameConnections.size,
      eventsInHistory: this.gameEvents.history.length
    };
  }
  
  // Placeholder methods for full implementation
  initializeGameMechanics() { console.log('🎮 Game mechanics initialized'); }
  setupBossSpawning() { console.log('👹 Boss spawning system configured'); }
  setupInvestigationTools() { console.log('🔍 Investigation tools loaded'); }
  checkGlobalBossEvents() { /* Check for global events */ }
  handleScamDetection(scamData) { /* Handle specific scam events */ }
  handleMixerDetection(mixerData) { /* Handle mixer events */ }
  handleTaxEvasionFlag(taxData) { /* Handle tax evasion events */ }
  calculateEvidenceRequired(walletAggro) { return Math.floor(walletAggro.totalAggro / 10); }
  generateBossAbilities(bossType) { return []; }
  generateLootTable(bossTemplate) { return []; }
  assignInvestigatorRole(player, boss) { return 'INVESTIGATOR'; }
  getAvailableTools(player, boss) { return []; }
  validateEvidence(evidenceData, boss) { return { valid: true, damage: 10, verified: true }; }
  rollLoot(lootTable, contributionPercent) { return []; }
  broadcastAggroUpdate(wallet, walletAggro) { /* Broadcast aggro changes */ }
  broadcastBossSpawn(boss) { /* Broadcast boss spawn */ }
  broadcastPlayerJoined(bossId, playerId, player) { /* Broadcast player joined */ }
  broadcastEvidenceSubmitted(bossId, playerId, evidence, result) { /* Broadcast evidence */ }
  broadcastBossDefeat(bossId, rewards) { /* Broadcast boss defeat */ }
}

// Export the class
module.exports = GameAggroBossIntegration;

// CLI interface if run directly
if (require.main === module) {
  console.log('🎮 GAME AGGRO BOSS INTEGRATION - STANDALONE MODE\n');
  
  // Mock dependencies for testing
  const mockSolanaAnalyzer = new EventEmitter();
  const mockTaxReportGenerator = new EventEmitter();
  
  const gameSystem = new GameAggroBossIntegration(mockSolanaAnalyzer, mockTaxReportGenerator);
  
  // Setup event logging
  gameSystem.on('game_event', (event) => {
    console.log(`🎯 Game event: ${event.type}`);
  });
  
  // Simulate blockchain events triggering game mechanics
  setTimeout(async () => {
    console.log('\n🧪 Simulating blockchain events for game mechanics...\n');
    
    // Simulate rug pull detection
    mockSolanaAnalyzer.emit('transaction_analyzed', {
      transaction: { signature: 'test123' },
      suspiciousPatterns: [{ type: 'rug_pull' }],
      scamScore: 80,
      mixerInteraction: false
    });
    
    // Simulate mixer transaction
    setTimeout(() => {
      mockSolanaAnalyzer.emit('transaction_analyzed', {
        transaction: { signature: 'mixer456' },
        suspiciousPatterns: [{ type: 'mixer_interaction' }],
        scamScore: 60,
        mixerInteraction: true
      });
    }, 1000);
    
    // Simulate wash trading
    setTimeout(() => {
      mockSolanaAnalyzer.emit('transaction_analyzed', {
        transaction: { signature: 'wash789' },
        suspiciousPatterns: [{ type: 'wash_trading' }],
        scamScore: 45,
        mixerInteraction: false
      });
    }, 2000);
    
    // Show game state after events
    setTimeout(() => {
      console.log('\n🎮 Current Game State:');
      const gameState = gameSystem.getGameState();
      console.log(`   Global Aggro: ${gameState.globalAggro}`);
      console.log(`   Active Bosses: ${gameState.activeBosses.length}`);
      console.log(`   Recent Events: ${gameState.recentEvents.length}`);
      
      console.log('\n📊 Game Statistics:');
      console.log(JSON.stringify(gameSystem.getStats(), null, 2));
    }, 4000);
    
  }, 1000);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Game Aggro Boss Integration...');
    if (gameSystem.wsServer) {
      gameSystem.wsServer.close();
    }
    console.log('✅ Shutdown complete');
    process.exit(0);
  });
}