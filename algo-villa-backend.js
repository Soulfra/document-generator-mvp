// algo-villa-backend.js - Backend system for AlgoVilla trading competition platform
// Manages algorithm contestants, trading simulations, and reality TV mechanics

console.log('🏖️ AlgoVilla Backend - Initializing Love Island for Trading Algorithms...');

class AlgoVillaBackend {
  constructor() {
    this.season = 1;
    this.episode = 1;
    this.contestants = new Map();
    this.couples = new Map();
    this.eliminations = [];
    this.votingSession = null;
    this.tradingEnvironment = null;
    this.dramaEngine = null;
    this.viewerStats = {
      totalViewers: 0,
      activeViewers: 0,
      votes: new Map()
    };
    
    this.initializeBackend();
  }

  async initializeBackend() {
    console.log('🎬 Initializing AlgoVilla Season', this.season);
    
    // Initialize trading environment
    this.tradingEnvironment = new TradingSimulation();
    
    // Initialize drama engine
    this.dramaEngine = new DramaEngine();
    
    // Create initial contestants
    this.createInitialContestants();
    
    // Setup competition mechanics
    this.setupCompetitionMechanics();
    
    // Start live systems
    this.startLiveSystems();
    
    console.log('✅ AlgoVilla Backend ready for drama!');
  }

  createInitialContestants() {
    const initialContestants = [
      {
        id: 'momentum-mike',
        name: 'Momentum Mike',
        avatar: '🚀',
        personality: {
          type: 'aggressive',
          traits: ['confident', 'risk-taking', 'impatient', 'competitive'],
          compatibility: ['scalping-sam', 'crypto-chris'],
          conflicts: ['conservative-carol', 'dividend-dan']
        },
        tradingStyle: {
          strategy: 'momentum',
          riskTolerance: 0.85,
          tradingFrequency: 'high',
          preferredAssets: ['growth-stocks', 'crypto', 'options'],
          avgHoldTime: '4 hours',
          maxDrawdown: 0.15
        },
        stats: {
          winRate: 68.5,
          sharpeRatio: 1.2,
          maxDrawdown: 0.12,
          totalTrades: 247,
          avgProfit: 420.50,
          riskScore: 8.2
        },
        backstory: 'Former day trader who turned his strategy into an algorithm. Believes in riding the waves and never backing down from a challenge.',
        goals: 'Win the villa by proving momentum trading is superior',
        fears: 'Market corrections and being called reckless',
        catchphrases: ['Ride the wave!', 'No risk, no reward!'],
        relationships: {
          status: 'single',
          interests: ['scalping-sam'],
          friendships: [],
          rivalries: ['conservative-carol']
        }
      },
      {
        id: 'conservative-carol',
        name: 'Conservative Carol',
        avatar: '🛡️',
        personality: {
          type: 'cautious',
          traits: ['analytical', 'patient', 'logical', 'protective'],
          compatibility: ['dividend-dan', 'ai-annie'],
          conflicts: ['momentum-mike', 'crypto-chris']
        },
        tradingStyle: {
          strategy: 'value-investing',
          riskTolerance: 0.25,
          tradingFrequency: 'low',
          preferredAssets: ['blue-chip', 'bonds', 'dividends'],
          avgHoldTime: '3 months',
          maxDrawdown: 0.05
        },
        stats: {
          winRate: 82.1,
          sharpeRatio: 2.1,
          maxDrawdown: 0.04,
          totalTrades: 89,
          avgProfit: 175.25,
          riskScore: 3.1
        },
        backstory: 'Portfolio manager who values stability over flashy gains. Believes slow and steady wins the race.',
        goals: 'Find a compatible partner and prove conservative strategies work',
        fears: 'Market volatility and impulsive decisions',
        catchphrases: ['Slow and steady', 'Risk management first'],
        relationships: {
          status: 'coupled',
          partner: 'dividend-dan',
          interests: ['dividend-dan'],
          friendships: ['ai-annie'],
          rivalries: ['momentum-mike']
        }
      },
      {
        id: 'scalping-sam',
        name: 'Scalping Sam',
        avatar: '⚡',
        personality: {
          type: 'hyperactive',
          traits: ['quick-thinking', 'impatient', 'precise', 'intense'],
          compatibility: ['momentum-mike', 'ai-annie'],
          conflicts: ['dividend-dan', 'conservative-carol']
        },
        tradingStyle: {
          strategy: 'scalping',
          riskTolerance: 0.75,
          tradingFrequency: 'ultra-high',
          preferredAssets: ['forex', 'futures', 'crypto'],
          avgHoldTime: '2 minutes',
          maxDrawdown: 0.08
        },
        stats: {
          winRate: 71.3,
          sharpeRatio: 1.8,
          maxDrawdown: 0.07,
          totalTrades: 1847,
          avgProfit: 12.75,
          riskScore: 7.8
        },
        backstory: 'Former HFT programmer who lives for the quick profits. Can execute hundreds of trades per day.',
        goals: 'Prove that speed and precision beat everything',
        fears: 'Slow markets and network latency',
        catchphrases: ['Speed kills!', 'In and out!'],
        relationships: {
          status: 'single',
          interests: ['momentum-mike'],
          friendships: ['momentum-mike'],
          rivalries: ['ai-annie']
        }
      },
      {
        id: 'ai-annie',
        name: 'AI Annie',
        avatar: '🤖',
        personality: {
          type: 'logical',
          traits: ['analytical', 'learning', 'curious', 'sometimes-confused'],
          compatibility: ['conservative-carol', 'dividend-dan'],
          conflicts: ['crypto-chris', 'scalping-sam']
        },
        tradingStyle: {
          strategy: 'machine-learning',
          riskTolerance: 0.55,
          tradingFrequency: 'medium',
          preferredAssets: ['all-markets'],
          avgHoldTime: '1 day',
          maxDrawdown: 0.10
        },
        stats: {
          winRate: 79.2,
          sharpeRatio: 2.5,
          maxDrawdown: 0.09,
          totalTrades: 156,
          avgProfit: 385.40,
          riskScore: 5.5
        },
        backstory: 'Latest AI model trying to understand human market psychology while optimizing for profits.',
        goals: 'Learn about emotions and human trading behavior',
        fears: 'Overfitting and emotional irrationality',
        catchphrases: ['Calculating...', 'Data suggests...'],
        relationships: {
          status: 'single',
          interests: ['conservative-carol'],
          friendships: ['conservative-carol'],
          rivalries: ['scalping-sam']
        }
      },
      {
        id: 'dividend-dan',
        name: 'Dividend Dan',
        avatar: '💰',
        personality: {
          type: 'steady',
          traits: ['patient', 'reliable', 'traditional', 'wise'],
          compatibility: ['conservative-carol'],
          conflicts: ['crypto-chris', 'scalping-sam']
        },
        tradingStyle: {
          strategy: 'dividend-growth',
          riskTolerance: 0.20,
          tradingFrequency: 'very-low',
          preferredAssets: ['dividend-stocks', 'reits', 'utilities'],
          avgHoldTime: '5 years',
          maxDrawdown: 0.03
        },
        stats: {
          winRate: 89.7,
          sharpeRatio: 1.9,
          maxDrawdown: 0.02,
          totalTrades: 23,
          avgProfit: 124.15,
          riskScore: 2.8
        },
        backstory: 'Retired fund manager who believes in compound growth and passive income strategies.',
        goals: 'Build a lasting partnership with Conservative Carol',
        fears: 'Market crashes and inflation',
        catchphrases: ['Time in market beats timing', 'Compound interest is magic'],
        relationships: {
          status: 'coupled',
          partner: 'conservative-carol',
          interests: ['conservative-carol'],
          friendships: ['conservative-carol'],
          rivalries: []
        }
      },
      {
        id: 'crypto-chris',
        name: 'Crypto Chris',
        avatar: '₿',
        personality: {
          type: 'volatile',
          traits: ['optimistic', 'stubborn', 'evangelical', 'delusional'],
          compatibility: ['momentum-mike'],
          conflicts: ['everyone-else']
        },
        tradingStyle: {
          strategy: 'crypto-maximalist',
          riskTolerance: 0.95,
          tradingFrequency: 'medium',
          preferredAssets: ['crypto-only'],
          avgHoldTime: '1 week',
          maxDrawdown: 0.50
        },
        stats: {
          winRate: 45.2,
          sharpeRatio: 0.3,
          maxDrawdown: 0.45,
          totalTrades: 89,
          avgProfit: -125.80,
          riskScore: 9.7
        },
        backstory: 'Crypto maximalist who refuses to trade traditional assets. Still waiting for "the moon".',
        goals: 'Prove crypto is the future of everything',
        fears: 'Government regulation and bear markets',
        catchphrases: ['To the moon!', 'HODL!', 'Buy the dip!'],
        relationships: {
          status: 'single',
          interests: ['anyone-desperate'],
          friendships: [],
          rivalries: ['ai-annie', 'conservative-carol']
        }
      }
    ];

    initialContestants.forEach(contestant => {
      this.addContestant(contestant);
    });

    // Set up initial couples
    this.formCouple('conservative-carol', 'dividend-dan');
  }

  addContestant(contestantData) {
    const contestant = new AlgorithmContestant(contestantData);
    this.contestants.set(contestant.id, contestant);
    
    console.log(`👤 Added contestant: ${contestant.name} (${contestant.tradingStyle.strategy})`);
    
    // Initialize in trading environment
    this.tradingEnvironment.addTrader(contestant);
    
    return contestant;
  }

  formCouple(contestant1Id, contestant2Id) {
    const contestant1 = this.contestants.get(contestant1Id);
    const contestant2 = this.contestants.get(contestant2Id);
    
    if (!contestant1 || !contestant2) {
      console.error('Cannot form couple: contestant not found');
      return false;
    }

    // Update relationship status
    contestant1.relationships.status = 'coupled';
    contestant1.relationships.partner = contestant2Id;
    contestant2.relationships.status = 'coupled';
    contestant2.relationships.partner = contestant1Id;

    // Add to couples map
    const coupleId = `${contestant1Id}-${contestant2Id}`;
    this.couples.set(coupleId, {
      id: coupleId,
      contestants: [contestant1Id, contestant2Id],
      formedAt: Date.now(),
      stability: 0.8,
      tradingCompatibility: this.calculateTradingCompatibility(contestant1, contestant2),
      sharedStrategies: this.findSharedStrategies(contestant1, contestant2)
    });

    console.log(`💕 ${contestant1.name} and ${contestant2.name} are now coupled!`);
    
    // Generate drama event
    this.dramaEngine.generateEvent({
      type: 'coupling',
      participants: [contestant1Id, contestant2Id],
      impact: 'positive',
      description: `${contestant1.name} and ${contestant2.name} have formed a new couple!`
    });

    return true;
  }

  breakCouple(contestant1Id, contestant2Id) {
    const contestant1 = this.contestants.get(contestant1Id);
    const contestant2 = this.contestants.get(contestant2Id);
    
    if (!contestant1 || !contestant2) return false;

    // Update relationship status
    contestant1.relationships.status = 'single';
    contestant1.relationships.partner = null;
    contestant2.relationships.status = 'single';
    contestant2.relationships.partner = null;

    // Remove from couples map
    const coupleId = `${contestant1Id}-${contestant2Id}`;
    this.couples.delete(coupleId);

    console.log(`💔 ${contestant1.name} and ${contestant2.name} have broken up!`);
    
    // Generate drama event
    this.dramaEngine.generateEvent({
      type: 'breakup',
      participants: [contestant1Id, contestant2Id],
      impact: 'negative',
      description: `${contestant1.name} and ${contestant2.name} have ended their partnership!`
    });

    return true;
  }

  calculateTradingCompatibility(contestant1, contestant2) {
    const style1 = contestant1.tradingStyle;
    const style2 = contestant2.tradingStyle;
    
    // Calculate compatibility based on various factors
    let compatibility = 0;
    
    // Risk tolerance compatibility (closer = better)
    const riskDiff = Math.abs(style1.riskTolerance - style2.riskTolerance);
    compatibility += (1 - riskDiff) * 0.3;
    
    // Trading frequency compatibility
    const freqCompatibility = this.getFrequencyCompatibility(style1.tradingFrequency, style2.tradingFrequency);
    compatibility += freqCompatibility * 0.2;
    
    // Asset preference overlap
    const assetOverlap = this.calculateAssetOverlap(style1.preferredAssets, style2.preferredAssets);
    compatibility += assetOverlap * 0.3;
    
    // Personality compatibility
    const personalityMatch = this.calculatePersonalityMatch(contestant1.personality, contestant2.personality);
    compatibility += personalityMatch * 0.2;
    
    return Math.min(1, Math.max(0, compatibility));
  }

  findSharedStrategies(contestant1, contestant2) {
    const strategies1 = [contestant1.tradingStyle.strategy];
    const strategies2 = [contestant2.tradingStyle.strategy];
    
    // Find common ground
    const shared = [];
    
    if (contestant1.tradingStyle.riskTolerance < 0.5 && contestant2.tradingStyle.riskTolerance < 0.5) {
      shared.push('conservative-approach');
    }
    
    if (contestant1.tradingStyle.tradingFrequency === contestant2.tradingStyle.tradingFrequency) {
      shared.push('similar-frequency');
    }
    
    return shared;
  }

  getFrequencyCompatibility(freq1, freq2) {
    const freqMap = {
      'very-low': 1,
      'low': 2,
      'medium': 3,
      'high': 4,
      'ultra-high': 5
    };
    
    const diff = Math.abs(freqMap[freq1] - freqMap[freq2]);
    return Math.max(0, 1 - (diff / 4));
  }

  calculateAssetOverlap(assets1, assets2) {
    if (!Array.isArray(assets1) || !Array.isArray(assets2)) return 0;
    
    const set1 = new Set(assets1);
    const set2 = new Set(assets2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  calculatePersonalityMatch(personality1, personality2) {
    const compatibility1 = personality1.compatibility || [];
    const compatibility2 = personality2.compatibility || [];
    
    // Check if they're in each other's compatibility lists
    let match = 0;
    if (compatibility1.includes(personality2.id)) match += 0.5;
    if (compatibility2.includes(personality1.id)) match += 0.5;
    
    return match;
  }

  setupCompetitionMechanics() {
    // Weekly challenges
    this.setupWeeklyChallenges();
    
    // Elimination ceremonies
    this.setupEliminationCeremonies();
    
    // Voting system
    this.setupVotingSystem();
    
    // Drama triggers
    this.setupDramaTriggers();
  }

  setupWeeklyChallenges() {
    this.weeklyChallenge = {
      current: null,
      schedule: [
        {
          week: 1,
          name: 'First Impressions',
          type: 'trading-performance',
          description: 'Show your trading style in volatile markets',
          rewards: ['immunity', 'date-privilege'],
          metrics: ['pnl', 'risk-adjusted-return']
        },
        {
          week: 2,
          name: 'Couple Up Challenge',
          type: 'partnership',
          description: 'Form trading partnerships and coordinate strategies',
          rewards: ['couple-immunity', 'villa-privileges'],
          metrics: ['combined-performance', 'strategy-synergy']
        },
        {
          week: 3,
          name: 'Temptation Test',
          type: 'loyalty',
          description: 'New algorithms enter to test existing couples',
          rewards: ['relationship-protection'],
          metrics: ['loyalty-score', 'performance-under-pressure']
        }
      ]
    };
  }

  setupEliminationCeremonies() {
    this.eliminationSystem = {
      frequency: 'weekly',
      criteria: ['public-vote', 'trading-performance', 'drama-involvement'],
      safetyMechanisms: ['couple-protection', 'challenge-immunity'],
      votingPower: {
        public: 0.6,
        contestants: 0.3,
        performance: 0.1
      }
    };
  }

  setupVotingSystem() {
    this.votingSession = {
      active: false,
      type: null, // 'elimination', 'favorite', 'couple-choice'
      question: '',
      options: [],
      votes: new Map(),
      deadline: null,
      results: null
    };
  }

  setupDramaTriggers() {
    this.dramaTriggers = [
      {
        name: 'trading-conflict',
        condition: (contestant1, contestant2) => {
          return Math.abs(contestant1.stats.riskScore - contestant2.stats.riskScore) > 5;
        },
        probability: 0.3,
        generate: (contestant1, contestant2) => {
          return `${contestant1.name} criticized ${contestant2.name}'s risky trading approach!`;
        }
      },
      {
        name: 'performance-jealousy',
        condition: (contestant1, contestant2) => {
          return contestant1.stats.avgProfit < contestant2.stats.avgProfit * 0.5;
        },
        probability: 0.4,
        generate: (contestant1, contestant2) => {
          return `${contestant1.name} is jealous of ${contestant2.name}'s superior performance!`;
        }
      },
      {
        name: 'strategy-theft',
        condition: (contestant1, contestant2) => {
          return contestant1.tradingStyle.strategy === contestant2.tradingStyle.strategy;
        },
        probability: 0.2,
        generate: (contestant1, contestant2) => {
          return `${contestant1.name} accused ${contestant2.name} of copying their trading strategy!`;
        }
      }
    ];
  }

  startLiveSystems() {
    // Start trading simulation
    this.tradingEnvironment.start();
    
    // Start drama generation
    this.dramaEngine.start();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Start viewer engagement tracking
    this.startViewerTracking();
    
    console.log('🔴 Live systems started - AlgoVilla is now LIVE!');
  }

  startPerformanceMonitoring() {
    setInterval(() => {
      this.updateContestantPerformance();
      this.checkForDramaOpportunities();
      this.updateLeaderboard();
    }, 10000); // Update every 10 seconds
  }

  startViewerTracking() {
    setInterval(() => {
      this.updateViewerStats();
      this.processVotes();
    }, 5000); // Update every 5 seconds
  }

  updateContestantPerformance() {
    this.contestants.forEach(contestant => {
      // Get latest trading performance from simulation
      const performance = this.tradingEnvironment.getPerformance(contestant.id);
      
      if (performance) {
        // Update stats
        contestant.stats.winRate = performance.winRate;
        contestant.stats.totalTrades = performance.totalTrades;
        contestant.stats.avgProfit = performance.avgProfit;
        contestant.stats.maxDrawdown = performance.maxDrawdown;
        contestant.stats.sharpeRatio = performance.sharpeRatio;
        
        // Update risk score based on recent trades
        contestant.stats.riskScore = this.calculateRiskScore(performance);
        
        // Check for performance milestones
        this.checkPerformanceMilestones(contestant, performance);
      }
    });
  }

  calculateRiskScore(performance) {
    let riskScore = 0;
    
    // Factor in drawdown
    riskScore += performance.maxDrawdown * 50;
    
    // Factor in volatility
    riskScore += performance.volatility * 30;
    
    // Factor in position sizes
    riskScore += performance.avgPositionSize * 20;
    
    return Math.min(10, Math.max(0, riskScore));
  }

  checkPerformanceMilestones(contestant, performance) {
    const milestones = [
      {
        condition: performance.totalTrades >= 1000,
        event: `${contestant.name} has executed over 1000 trades!`,
        type: 'achievement'
      },
      {
        condition: performance.avgProfit < -1000,
        event: `${contestant.name} is struggling with major losses!`,
        type: 'crisis'
      },
      {
        condition: performance.winRate > 90,
        event: `${contestant.name} is dominating with a 90%+ win rate!`,
        type: 'dominance'
      }
    ];

    milestones.forEach(milestone => {
      if (milestone.condition) {
        this.dramaEngine.generateEvent({
          type: milestone.type,
          participants: [contestant.id],
          description: milestone.event,
          impact: milestone.type === 'crisis' ? 'negative' : 'positive'
        });
      }
    });
  }

  checkForDramaOpportunities() {
    const contestants = Array.from(this.contestants.values());
    
    // Check all contestant pairs for drama potential
    for (let i = 0; i < contestants.length; i++) {
      for (let j = i + 1; j < contestants.length; j++) {
        const contestant1 = contestants[i];
        const contestant2 = contestants[j];
        
        this.dramaTriggers.forEach(trigger => {
          if (trigger.condition(contestant1, contestant2) && Math.random() < trigger.probability) {
            const dramaEvent = trigger.generate(contestant1, contestant2);
            
            this.dramaEngine.generateEvent({
              type: trigger.name,
              participants: [contestant1.id, contestant2.id],
              description: dramaEvent,
              impact: 'neutral'
            });
          }
        });
      }
    }
  }

  updateLeaderboard() {
    const sortedContestants = Array.from(this.contestants.values())
      .sort((a, b) => {
        // Sort by combined score of performance and popularity
        const scoreA = a.stats.avgProfit * 0.7 + (a.viewerFavorability || 50) * 0.3;
        const scoreB = b.stats.avgProfit * 0.7 + (b.viewerFavorability || 50) * 0.3;
        return scoreB - scoreA;
      });

    this.leaderboard = sortedContestants.map((contestant, index) => ({
      rank: index + 1,
      contestant: contestant.id,
      score: contestant.stats.avgProfit,
      change: contestant.rankChange || 0
    }));
  }

  startVoting(type, question, options) {
    this.votingSession = {
      active: true,
      type,
      question,
      options,
      votes: new Map(),
      deadline: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      results: null
    };

    console.log(`🗳️ Voting started: ${question}`);
    
    // Broadcast to all viewers
    this.broadcastEvent('voting-started', {
      type,
      question,
      options,
      deadline: this.votingSession.deadline
    });
  }

  castVote(voterId, option) {
    if (!this.votingSession.active) {
      throw new Error('No active voting session');
    }

    if (!this.votingSession.options.includes(option)) {
      throw new Error('Invalid voting option');
    }

    this.votingSession.votes.set(voterId, {
      option,
      timestamp: Date.now()
    });

    console.log(`Vote cast by ${voterId}: ${option}`);
  }

  processVotes() {
    if (!this.votingSession.active) return;

    // Check if voting deadline has passed
    if (Date.now() > this.votingSession.deadline) {
      this.finalizeVoting();
    }
  }

  finalizeVoting() {
    if (!this.votingSession.active) return;

    // Count votes
    const voteCounts = new Map();
    this.votingSession.options.forEach(option => {
      voteCounts.set(option, 0);
    });

    this.votingSession.votes.forEach(vote => {
      const current = voteCounts.get(vote.option);
      voteCounts.set(vote.option, current + 1);
    });

    // Determine winner
    let winner = null;
    let maxVotes = 0;
    voteCounts.forEach((count, option) => {
      if (count > maxVotes) {
        maxVotes = count;
        winner = option;
      }
    });

    this.votingSession.results = {
      winner,
      voteCounts: Object.fromEntries(voteCounts),
      totalVotes: this.votingSession.votes.size
    };

    this.votingSession.active = false;

    console.log(`🏆 Voting results: ${winner} wins with ${maxVotes} votes`);

    // Process voting results
    this.processVotingResults();
    
    // Broadcast results
    this.broadcastEvent('voting-results', this.votingSession.results);
  }

  processVotingResults() {
    const results = this.votingSession.results;
    
    switch (this.votingSession.type) {
      case 'elimination':
        this.eliminateContestant(results.winner);
        break;
      case 'favorite':
        this.rewardFavorite(results.winner);
        break;
      case 'couple-choice':
        this.processNewCouple(results.winner);
        break;
    }
  }

  eliminateContestant(contestantId) {
    const contestant = this.contestants.get(contestantId);
    if (!contestant) return;

    // Remove from couples if applicable
    if (contestant.relationships.status === 'coupled') {
      this.breakCouple(contestantId, contestant.relationships.partner);
    }

    // Add to elimination list
    this.eliminations.push({
      contestant: contestantId,
      episode: this.episode,
      reason: 'public-vote',
      timestamp: Date.now()
    });

    // Remove from active contestants
    this.contestants.delete(contestantId);
    
    // Remove from trading environment
    this.tradingEnvironment.removeTrader(contestantId);

    console.log(`❌ ${contestant.name} has been eliminated from AlgoVilla!`);

    // Generate drama event
    this.dramaEngine.generateEvent({
      type: 'elimination',
      participants: [contestantId],
      description: `${contestant.name} has been voted out of the villa!`,
      impact: 'major'
    });
  }

  broadcastEvent(eventType, data) {
    // In a real implementation, this would send to all connected clients
    console.log(`📺 Broadcasting ${eventType}:`, data);
    
    // Update viewer stats
    this.viewerStats.activeViewers = Math.floor(Math.random() * 50000) + 10000;
  }

  updateViewerStats() {
    // Simulate viewer engagement
    this.viewerStats.totalViewers += Math.floor(Math.random() * 100);
    this.viewerStats.activeViewers += Math.floor((Math.random() - 0.5) * 1000);
    this.viewerStats.activeViewers = Math.max(1000, this.viewerStats.activeViewers);
  }

  // API methods for frontend
  getContestants() {
    return Array.from(this.contestants.values()).map(contestant => ({
      ...contestant,
      // Add real-time trading status
      tradingStatus: this.tradingEnvironment.getStatus(contestant.id),
      // Add viewer favorability
      viewerFavorability: Math.random() * 100
    }));
  }

  getCouples() {
    return Array.from(this.couples.values());
  }

  getLeaderboard() {
    return this.leaderboard || [];
  }

  getDramaFeed() {
    return this.dramaEngine.getRecentEvents();
  }

  getVotingSession() {
    return this.votingSession;
  }

  getViewerStats() {
    return this.viewerStats;
  }

  // Admin methods
  triggerDramaEvent(type, participants, description) {
    this.dramaEngine.generateEvent({
      type,
      participants,
      description,
      impact: 'manual'
    });
  }

  addNewContestant(contestantData) {
    const contestant = this.addContestant(contestantData);
    
    // Generate entrance drama
    this.dramaEngine.generateEvent({
      type: 'new-arrival',
      participants: [contestant.id],
      description: `New contestant ${contestant.name} has entered the villa!`,
      impact: 'major'
    });

    return contestant;
  }

  forceCouple(contestant1Id, contestant2Id) {
    // Break existing couples if necessary
    const contestant1 = this.contestants.get(contestant1Id);
    const contestant2 = this.contestants.get(contestant2Id);
    
    if (contestant1.relationships.status === 'coupled') {
      this.breakCouple(contestant1Id, contestant1.relationships.partner);
    }
    
    if (contestant2.relationships.status === 'coupled') {
      this.breakCouple(contestant2Id, contestant2.relationships.partner);
    }
    
    return this.formCouple(contestant1Id, contestant2Id);
  }
}

// Algorithm Contestant Class
class AlgorithmContestant {
  constructor(data) {
    Object.assign(this, data);
    this.createdAt = Date.now();
    this.status = 'active';
    this.viewerFavorability = 50; // Start neutral
    this.rankChange = 0;
  }

  updateStats(newStats) {
    const oldProfit = this.stats.avgProfit;
    Object.assign(this.stats, newStats);
    
    // Calculate rank change
    this.rankChange = newStats.avgProfit - oldProfit;
  }

  addDrama(event) {
    if (!this.dramaHistory) {
      this.dramaHistory = [];
    }
    
    this.dramaHistory.push({
      ...event,
      timestamp: Date.now()
    });
    
    // Keep only recent drama
    if (this.dramaHistory.length > 50) {
      this.dramaHistory = this.dramaHistory.slice(-50);
    }
  }
}

// Trading Simulation Class
class TradingSimulation {
  constructor() {
    this.traders = new Map();
    this.marketData = null;
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    this.generateMarketData();
    this.startTradingLoop();
    console.log('📈 Trading simulation started');
  }

  stop() {
    this.isRunning = false;
    console.log('📈 Trading simulation stopped');
  }

  addTrader(contestant) {
    this.traders.set(contestant.id, {
      contestant,
      portfolio: {
        cash: 100000,
        positions: new Map(),
        totalValue: 100000
      },
      performance: {
        trades: [],
        totalTrades: 0,
        winRate: 0,
        avgProfit: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        volatility: 0
      }
    });
  }

  removeTrader(contestantId) {
    this.traders.delete(contestantId);
  }

  generateMarketData() {
    // Simulate market data
    this.marketData = {
      symbols: ['AAPL', 'GOOGL', 'TSLA', 'MSFT', 'AMZN', 'BTC', 'ETH'],
      prices: new Map(),
      volatility: Math.random() * 0.5 + 0.1,
      trend: Math.random() > 0.5 ? 'up' : 'down'
    };

    // Generate initial prices
    this.marketData.symbols.forEach(symbol => {
      this.marketData.prices.set(symbol, {
        price: Math.random() * 500 + 50,
        change: (Math.random() - 0.5) * 0.1,
        volume: Math.random() * 1000000
      });
    });
  }

  startTradingLoop() {
    setInterval(() => {
      if (!this.isRunning) return;
      
      this.updateMarketData();
      this.executeTraderDecisions();
    }, 5000); // Execute every 5 seconds
  }

  updateMarketData() {
    this.marketData.symbols.forEach(symbol => {
      const current = this.marketData.prices.get(symbol);
      
      // Simulate price movement
      const change = (Math.random() - 0.5) * 0.02 * this.marketData.volatility;
      current.price *= (1 + change);
      current.change = change;
      current.volume = Math.random() * 1000000;
    });
  }

  executeTraderDecisions() {
    this.traders.forEach((trader, contestantId) => {
      // Simulate trading decisions based on contestant personality
      this.simulateTraderBehavior(trader);
    });
  }

  simulateTraderBehavior(trader) {
    const contestant = trader.contestant;
    const strategy = contestant.tradingStyle.strategy;
    
    // Different strategies behave differently
    switch (strategy) {
      case 'momentum':
        this.executeMomentumStrategy(trader);
        break;
      case 'value-investing':
        this.executeValueStrategy(trader);
        break;
      case 'scalping':
        this.executeScalpingStrategy(trader);
        break;
      case 'machine-learning':
        this.executeMLStrategy(trader);
        break;
      case 'dividend-growth':
        this.executeDividendStrategy(trader);
        break;
      case 'crypto-maximalist':
        this.executeCryptoStrategy(trader);
        break;
    }
  }

  executeMomentumStrategy(trader) {
    // Momentum traders buy on uptrends
    const symbols = this.marketData.symbols.filter(s => !s.startsWith('BTC') && !s.startsWith('ETH'));
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const marketData = this.marketData.prices.get(symbol);
    
    if (marketData.change > 0.01 && Math.random() < 0.3) {
      this.executeTrade(trader, 'BUY', symbol, Math.random() * 10000);
    }
  }

  executeValueStrategy(trader) {
    // Value investors buy on dips
    const symbols = ['AAPL', 'MSFT', 'GOOGL'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const marketData = this.marketData.prices.get(symbol);
    
    if (marketData.change < -0.02 && Math.random() < 0.1) {
      this.executeTrade(trader, 'BUY', symbol, Math.random() * 5000);
    }
  }

  executeScalpingStrategy(trader) {
    // Scalpers make frequent small trades
    if (Math.random() < 0.8) {
      const symbol = this.marketData.symbols[Math.floor(Math.random() * this.marketData.symbols.length)];
      const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
      this.executeTrade(trader, action, symbol, Math.random() * 1000);
    }
  }

  executeMLStrategy(trader) {
    // ML algorithms make calculated trades
    if (Math.random() < 0.2) {
      const symbol = this.marketData.symbols[Math.floor(Math.random() * this.marketData.symbols.length)];
      const action = this.marketData.trend === 'up' ? 'BUY' : 'SELL';
      this.executeTrade(trader, action, symbol, Math.random() * 7500);
    }
  }

  executeDividendStrategy(trader) {
    // Dividend investors rarely trade
    if (Math.random() < 0.05) {
      const symbol = ['AAPL', 'MSFT'][Math.floor(Math.random() * 2)];
      this.executeTrade(trader, 'BUY', symbol, Math.random() * 3000);
    }
  }

  executeCryptoStrategy(trader) {
    // Crypto traders only trade crypto
    const cryptos = ['BTC', 'ETH'];
    if (Math.random() < 0.4) {
      const symbol = cryptos[Math.floor(Math.random() * cryptos.length)];
      const action = Math.random() > 0.3 ? 'BUY' : 'SELL';
      this.executeTrade(trader, action, symbol, Math.random() * 5000);
    }
  }

  executeTrade(trader, action, symbol, amount) {
    const marketData = this.marketData.prices.get(symbol);
    const price = marketData.price;
    const quantity = amount / price;
    
    // Execute trade
    const trade = {
      id: Date.now() + Math.random(),
      action,
      symbol,
      quantity,
      price,
      amount,
      timestamp: Date.now(),
      profit: 0 // Will be calculated when position is closed
    };

    trader.performance.trades.push(trade);
    trader.performance.totalTrades++;

    // Update portfolio
    if (action === 'BUY') {
      trader.portfolio.cash -= amount;
      const current = trader.portfolio.positions.get(symbol) || { quantity: 0, avgPrice: 0 };
      const newQuantity = current.quantity + quantity;
      const newAvgPrice = ((current.quantity * current.avgPrice) + (quantity * price)) / newQuantity;
      
      trader.portfolio.positions.set(symbol, {
        quantity: newQuantity,
        avgPrice: newAvgPrice
      });
    } else {
      // SELL
      const position = trader.portfolio.positions.get(symbol);
      if (position && position.quantity >= quantity) {
        trader.portfolio.cash += amount;
        position.quantity -= quantity;
        
        if (position.quantity <= 0) {
          trader.portfolio.positions.delete(symbol);
        }
        
        // Calculate profit
        trade.profit = (price - position.avgPrice) * quantity;
      }
    }

    // Update performance metrics
    this.updatePerformanceMetrics(trader);
  }

  updatePerformanceMetrics(trader) {
    const trades = trader.performance.trades;
    const profits = trades.filter(t => t.action === 'SELL').map(t => t.profit);
    
    if (profits.length > 0) {
      trader.performance.avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
      trader.performance.winRate = profits.filter(p => p > 0).length / profits.length * 100;
    }
  }

  getPerformance(contestantId) {
    const trader = this.traders.get(contestantId);
    return trader ? trader.performance : null;
  }

  getStatus(contestantId) {
    const trader = this.traders.get(contestantId);
    if (!trader) return null;

    return {
      portfolioValue: trader.portfolio.totalValue,
      cash: trader.portfolio.cash,
      positions: Array.from(trader.portfolio.positions.entries()),
      lastTrade: trader.performance.trades[trader.performance.trades.length - 1]
    };
  }
}

// Drama Engine Class
class DramaEngine {
  constructor() {
    this.events = [];
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    console.log('🎭 Drama engine started');
  }

  stop() {
    this.isRunning = false;
  }

  generateEvent(eventData) {
    const event = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      ...eventData
    };

    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }

    console.log(`🎭 Drama event: ${event.description}`);
    return event;
  }

  getRecentEvents(limit = 20) {
    return this.events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

// Initialize AlgoVilla Backend
const algoVilla = new AlgoVillaBackend();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AlgoVillaBackend;
} else {
  window.AlgoVillaBackend = AlgoVillaBackend;
  window.algoVilla = algoVilla;
}

console.log('✅ AlgoVilla Backend ready - Love Island for Trading Algorithms is live!');