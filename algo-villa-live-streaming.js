// algo-villa-live-streaming.js - Live streaming and audience interaction for AlgoVilla
// Implements Twitch-style live streaming with chat, reactions, voting, and viewer engagement

console.log('📺 AlgoVilla Live Streaming - Bringing Love Island to life!');

class AlgoVillaLiveStreaming {
  constructor(backend, competitionMechanics) {
    this.backend = backend;
    this.competitionMechanics = competitionMechanics;
    
    // Streaming infrastructure
    this.streamState = {
      isLive: false,
      currentScene: 'villa-overview',
      viewerCount: 0,
      chatActive: true,
      reactionsEnabled: true,
      votingActive: false
    };
    
    // Connected viewers
    this.viewers = new Map(); // viewerId -> viewer data
    this.moderators = new Set();
    this.vips = new Set();
    
    // Chat system
    this.chatMessages = [];
    this.chatFilters = new Set(['spam', 'toxic', 'spoilers']);
    this.emoteSystem = new Map();
    
    // Reaction system
    this.activeReactions = new Map(); // reactionType -> count
    this.reactionHistory = [];
    
    // Streaming scenes and cameras
    this.cameras = new Map();
    this.scenes = new Map();
    this.currentMultiCam = [];
    
    // Audience participation
    this.polls = new Map();
    this.challenges = new Map();
    this.predictions = new Map();
    
    // Analytics and engagement
    this.analytics = {
      totalViewTime: 0,
      peakViewers: 0,
      chatMessages: 0,
      reactions: 0,
      votes: 0,
      engagement_score: 0
    };
    
    this.initializeLiveStreaming();
  }

  async initializeLiveStreaming() {
    console.log('🎬 Initializing AlgoVilla Live Streaming...');
    
    // Setup streaming infrastructure
    this.setupStreamingInfrastructure();
    
    // Setup chat system
    this.setupChatSystem();
    
    // Setup reaction system
    this.setupReactionSystem();
    
    // Setup camera systems
    this.setupCameraSystems();
    
    // Setup audience participation
    this.setupAudienceParticipation();
    
    // Start live systems
    this.startLiveSystems();
    
    console.log('✅ AlgoVilla Live Streaming ready!');
  }

  setupStreamingInfrastructure() {
    // Virtual cameras for different villa areas
    this.cameras.set('villa-overview', {
      name: 'Villa Overview',
      description: 'Full view of the trading villa',
      active: true,
      viewers_can_control: false,
      scene_type: 'overview'
    });
    
    this.cameras.set('trading-floor', {
      name: 'Trading Floor',
      description: 'Live view of algorithms trading',
      active: true,
      viewers_can_control: true,
      scene_type: 'action'
    });
    
    this.cameras.set('relationship-corner', {
      name: 'Relationship Corner',
      description: 'Intimate conversations and coupling moments',
      active: true,
      viewers_can_control: false,
      scene_type: 'drama'
    });
    
    this.cameras.set('challenge-arena', {
      name: 'Challenge Arena',
      description: 'Where weekly challenges take place',
      active: false,
      viewers_can_control: false,
      scene_type: 'challenge'
    });
    
    this.cameras.set('elimination-stage', {
      name: 'Elimination Stage',
      description: 'Dramatic elimination ceremonies',
      active: false,
      viewers_can_control: false,
      scene_type: 'ceremony'
    });
    
    this.cameras.set('confessional', {
      name: 'Confessional Booth',
      description: 'Private thoughts and strategy reveals',
      active: true,
      viewers_can_control: false,
      scene_type: 'confessional'
    });

    // Setup streaming scenes
    this.scenes.set('live-show', {
      cameras: ['villa-overview', 'trading-floor', 'relationship-corner'],
      layout: 'multi-cam',
      chat_mode: 'live',
      voting_enabled: true
    });
    
    this.scenes.set('challenge-mode', {
      cameras: ['challenge-arena', 'trading-floor'],
      layout: 'split-screen',
      chat_mode: 'challenge',
      voting_enabled: true
    });
    
    this.scenes.set('elimination-ceremony', {
      cameras: ['elimination-stage'],
      layout: 'single-cam',
      chat_mode: 'ceremony',
      voting_enabled: false
    });
    
    this.scenes.set('after-hours', {
      cameras: ['relationship-corner', 'confessional'],
      layout: 'picture-in-picture',
      chat_mode: 'casual',
      voting_enabled: false
    });
  }

  setupChatSystem() {
    // Initialize emote system
    this.emoteSystem.set('🔥', { name: 'fire', category: 'reaction' });
    this.emoteSystem.set('💎', { name: 'diamond', category: 'trading' });
    this.emoteSystem.set('💕', { name: 'love', category: 'relationship' });
    this.emoteSystem.set('😱', { name: 'shock', category: 'drama' });
    this.emoteSystem.set('📈', { name: 'stonks', category: 'trading' });
    this.emoteSystem.set('📉', { name: 'crash', category: 'trading' });
    this.emoteSystem.set('🚀', { name: 'rocket', category: 'momentum' });
    this.emoteSystem.set('💔', { name: 'heartbreak', category: 'drama' });
    this.emoteSystem.set('👑', { name: 'crown', category: 'winner' });
    this.emoteSystem.set('🗳️', { name: 'vote', category: 'participation' });
    
    // Chat commands
    this.chatCommands = new Map();
    this.chatCommands.set('!vote', this.handleVoteCommand.bind(this));
    this.chatCommands.set('!predict', this.handlePredictCommand.bind(this));
    this.chatCommands.set('!stats', this.handleStatsCommand.bind(this));
    this.chatCommands.set('!help', this.handleHelpCommand.bind(this));
    this.chatCommands.set('!scene', this.handleSceneCommand.bind(this));
    
    // Chat moderation
    this.moderationRules = [
      { pattern: /spam/i, action: 'warn', severity: 'low' },
      { pattern: /toxic/i, action: 'timeout', severity: 'medium' },
      { pattern: /spoiler/i, action: 'delete', severity: 'low' }
    ];
  }

  setupReactionSystem() {
    // Live reaction types
    this.reactionTypes = [
      { emoji: '😍', name: 'love', color: '#ff69b4', duration: 3000 },
      { emoji: '😂', name: 'lol', color: '#ffd700', duration: 2000 },
      { emoji: '😱', name: 'shock', color: '#ff4500', duration: 4000 },
      { emoji: '🔥', name: 'fire', color: '#ff6b35', duration: 5000 },
      { emoji: '💎', name: 'diamond', color: '#00bfff', duration: 3000 },
      { emoji: '📈', name: 'profit', color: '#00ff00', duration: 3000 },
      { emoji: '📉', name: 'loss', color: '#ff0000', duration: 3000 },
      { emoji: '👑', name: 'winner', color: '#ffd700', duration: 6000 },
      { emoji: '💔', name: 'sad', color: '#800080', duration: 4000 },
      { emoji: '🤔', name: 'thinking', color: '#808080', duration: 2000 }
    ];
    
    // Initialize reaction counters
    this.reactionTypes.forEach(reaction => {
      this.activeReactions.set(reaction.name, 0);
    });
  }

  setupCameraSystems() {
    // Auto-director system that switches cameras based on events
    this.autoDirector = {
      enabled: true,
      rules: [
        {
          trigger: 'drama-event',
          camera: 'relationship-corner',
          duration: 30000, // 30 seconds
          priority: 'high'
        },
        {
          trigger: 'trading-action',
          camera: 'trading-floor',
          duration: 15000,
          priority: 'medium'
        },
        {
          trigger: 'challenge-start',
          camera: 'challenge-arena',
          duration: 60000,
          priority: 'highest'
        },
        {
          trigger: 'elimination',
          camera: 'elimination-stage',
          duration: 120000,
          priority: 'highest'
        },
        {
          trigger: 'confession',
          camera: 'confessional',
          duration: 45000,
          priority: 'medium'
        }
      ]
    };
  }

  setupAudienceParticipation() {
    // Viewer polls
    this.pollTypes = [
      'favorite_contestant',
      'best_couple',
      'elimination_prediction',
      'challenge_winner',
      'drama_rating',
      'trading_strategy',
      'next_coupling',
      'season_winner'
    ];
    
    // Prediction markets
    this.predictionCategories = [
      'elimination_order',
      'final_couple',
      'challenge_winners',
      'drama_events',
      'trading_performance',
      'new_contestants'
    ];
    
    // Interactive challenges
    this.viewerChallenges = [
      {
        name: 'Trading Strategy Voting',
        description: 'Vote on which strategy an algorithm should use',
        type: 'strategy_vote',
        duration: 300000, // 5 minutes
        min_participants: 100
      },
      {
        name: 'Couple Compatibility Quiz',
        description: 'Predict couple compatibility scores',
        type: 'compatibility_quiz',
        duration: 600000, // 10 minutes
        min_participants: 50
      },
      {
        name: 'Drama Detector',
        description: 'Predict when drama will happen',
        type: 'drama_prediction',
        duration: 180000, // 3 minutes
        min_participants: 200
      }
    ];
  }

  startLiveSystems() {
    // Start streaming
    this.goLive();
    
    // Start chat moderation
    this.startChatModeration();
    
    // Start auto-director
    this.startAutoDirector();
    
    // Start analytics tracking
    this.startAnalyticsTracking();
    
    // Start viewer engagement systems
    this.startEngagementSystems();
    
    console.log('🔴 AlgoVilla is now LIVE!');
  }

  goLive() {
    this.streamState.isLive = true;
    this.streamState.currentScene = 'live-show';
    
    // Simulate initial viewer influx
    this.simulateViewerGrowth();
    
    // Start live content generation
    this.startLiveContentGeneration();
    
    console.log('📺 Stream started - AlgoVilla is LIVE!');
  }

  simulateViewerGrowth() {
    // Simulate realistic viewer growth pattern
    let baseViewers = 1000;
    
    setInterval(() => {
      // Organic growth with events causing spikes
      const growth = Math.random() * 100 - 30; // -30 to +70 viewers
      const eventMultiplier = this.getEventMultiplier();
      
      this.streamState.viewerCount += Math.floor(growth * eventMultiplier);
      this.streamState.viewerCount = Math.max(baseViewers, this.streamState.viewerCount);
      
      // Update peak viewers
      if (this.streamState.viewerCount > this.analytics.peakViewers) {
        this.analytics.peakViewers = this.streamState.viewerCount;
      }
      
      // Broadcast viewer count update
      this.broadcastViewerUpdate();
      
    }, 5000); // Update every 5 seconds
  }

  getEventMultiplier() {
    // Higher multiplier during dramatic events
    const phase = this.competitionMechanics?.competitionState?.phase;
    
    switch (phase) {
      case 'weekly-challenge': return 1.5;
      case 'elimination': return 2.0;
      case 'recoupling': return 1.8;
      case 'emergency-recoupling': return 3.0;
      default: return 1.0;
    }
  }

  startLiveContentGeneration() {
    // Generate live commentary
    setInterval(() => {
      this.generateLiveCommentary();
    }, 30000); // Every 30 seconds
    
    // Generate viewer notifications
    setInterval(() => {
      this.generateViewerNotifications();
    }, 60000); // Every minute
    
    // Update scene based on events
    setInterval(() => {
      this.updateSceneBasedOnEvents();
    }, 10000); // Every 10 seconds
  }

  generateLiveCommentary() {
    const contestants = this.backend.getContestants();
    const couples = this.backend.getCouples();
    
    const commentaries = [
      `📊 Trading update: ${contestants[0]?.name} is performing exceptionally well today!`,
      `💕 Relationship alert: Sparks are flying between the algorithms!`,
      `🎯 Challenge coming up: Who will win today's competition?`,
      `📈 Market volatility is testing our contestants' strategies!`,
      `🗳️ Don't forget to vote for your favorite algorithm!`,
      `🔥 The drama is heating up in the villa!`,
      `💎 Someone just made a brilliant trading move!`,
      `👑 Who do you think will be crowned the winner?`
    ];
    
    const commentary = commentaries[Math.floor(Math.random() * commentaries.length)];
    
    this.broadcastSystemMessage({
      type: 'live_commentary',
      message: commentary,
      timestamp: Date.now(),
      priority: 'low'
    });
  }

  // Chat system methods
  handleChatMessage(viewerId, message) {
    const viewer = this.viewers.get(viewerId);
    if (!viewer) return;
    
    // Check for commands
    if (message.startsWith('!')) {
      return this.handleChatCommand(viewerId, message);
    }
    
    // Moderate message
    const moderationResult = this.moderateMessage(message);
    if (!moderationResult.allowed) {
      this.sendPrivateMessage(viewerId, `Message blocked: ${moderationResult.reason}`);
      return;
    }
    
    // Create chat message
    const chatMessage = {
      id: Date.now() + Math.random(),
      viewerId,
      username: viewer.username,
      message: moderationResult.cleanMessage || message,
      timestamp: Date.now(),
      badges: viewer.badges || [],
      color: viewer.color || '#ffffff',
      emotes: this.parseEmotes(message)
    };
    
    // Add to chat history
    this.chatMessages.push(chatMessage);
    
    // Keep only recent messages
    if (this.chatMessages.length > 1000) {
      this.chatMessages = this.chatMessages.slice(-500);
    }
    
    // Broadcast to all viewers
    this.broadcastChatMessage(chatMessage);
    
    // Update analytics
    this.analytics.chatMessages++;
    
    console.log(`💬 ${viewer.username}: ${message}`);
  }

  handleChatCommand(viewerId, command) {
    const [cmd, ...args] = command.split(' ');
    const handler = this.chatCommands.get(cmd.toLowerCase());
    
    if (handler) {
      handler(viewerId, args);
    } else {
      this.sendPrivateMessage(viewerId, `Unknown command: ${cmd}`);
    }
  }

  handleVoteCommand(viewerId, args) {
    if (!this.streamState.votingActive) {
      this.sendPrivateMessage(viewerId, 'No active voting session');
      return;
    }
    
    const option = args.join(' ');
    if (!option) {
      this.sendPrivateMessage(viewerId, 'Usage: !vote <option>');
      return;
    }
    
    try {
      this.backend.castVote(viewerId, option);
      this.sendPrivateMessage(viewerId, `Vote cast for: ${option}`);
      this.analytics.votes++;
    } catch (error) {
      this.sendPrivateMessage(viewerId, `Vote error: ${error.message}`);
    }
  }

  handlePredictCommand(viewerId, args) {
    const prediction = args.join(' ');
    
    if (!prediction) {
      this.sendPrivateMessage(viewerId, 'Usage: !predict <your prediction>');
      return;
    }
    
    // Store prediction
    const viewer = this.viewers.get(viewerId);
    if (!viewer.predictions) viewer.predictions = [];
    
    viewer.predictions.push({
      prediction,
      timestamp: Date.now(),
      episode: this.competitionMechanics.competitionState.dayInVilla
    });
    
    this.sendPrivateMessage(viewerId, `Prediction recorded: ${prediction}`);
  }

  handleStatsCommand(viewerId, args) {
    const contestant = args[0];
    
    if (!contestant) {
      // Show general stats
      const stats = `
📊 AlgoVilla Stats:
👥 Viewers: ${this.streamState.viewerCount.toLocaleString()}
💬 Chat messages: ${this.analytics.chatMessages.toLocaleString()}
🗳️ Votes cast: ${this.analytics.votes.toLocaleString()}
📈 Peak viewers: ${this.analytics.peakViewers.toLocaleString()}
      `.trim();
      
      this.sendPrivateMessage(viewerId, stats);
    } else {
      // Show contestant stats
      const contestants = this.backend.getContestants();
      const target = contestants.find(c => c.name.toLowerCase().includes(contestant.toLowerCase()));
      
      if (target) {
        const stats = `
📊 ${target.name} Stats:
💰 P&L: ${target.stats?.avgProfit || 'N/A'}
📈 Win Rate: ${target.stats?.winRate || 0}%
🔄 Trades: ${target.stats?.totalTrades || 0}
❤️ Popularity: ${target.viewerFavorability || 50}%
        `.trim();
        
        this.sendPrivateMessage(viewerId, stats);
      } else {
        this.sendPrivateMessage(viewerId, `Contestant '${contestant}' not found`);
      }
    }
  }

  handleHelpCommand(viewerId, args) {
    const help = `
🤖 AlgoVilla Chat Commands:
!vote <option> - Vote in active polls
!predict <prediction> - Make a prediction
!stats [contestant] - View stats
!scene <camera> - Switch camera (VIP only)
!help - Show this help

🎭 Available emotes: 🔥💎💕😱📈📉🚀💔👑🗳️
    `.trim();
    
    this.sendPrivateMessage(viewerId, help);
  }

  handleSceneCommand(viewerId, args) {
    const viewer = this.viewers.get(viewerId);
    
    if (!this.vips.has(viewerId) && !this.moderators.has(viewerId)) {
      this.sendPrivateMessage(viewerId, 'VIP access required for camera control');
      return;
    }
    
    const requestedCamera = args[0];
    if (!requestedCamera) {
      const availableCameras = Array.from(this.cameras.keys()).join(', ');
      this.sendPrivateMessage(viewerId, `Available cameras: ${availableCameras}`);
      return;
    }
    
    if (this.cameras.has(requestedCamera)) {
      this.switchCamera(requestedCamera, viewerId);
      this.sendPrivateMessage(viewerId, `Switched to ${requestedCamera}`);
    } else {
      this.sendPrivateMessage(viewerId, `Camera '${requestedCamera}' not found`);
    }
  }

  // Reaction system methods
  addReaction(viewerId, reactionType) {
    const reaction = this.reactionTypes.find(r => r.name === reactionType);
    if (!reaction) return;
    
    // Increment reaction counter
    const current = this.activeReactions.get(reactionType) || 0;
    this.activeReactions.set(reactionType, current + 1);
    
    // Create reaction event
    const reactionEvent = {
      id: Date.now() + Math.random(),
      viewerId,
      type: reactionType,
      emoji: reaction.emoji,
      color: reaction.color,
      timestamp: Date.now(),
      duration: reaction.duration
    };
    
    // Add to reaction history
    this.reactionHistory.push(reactionEvent);
    
    // Keep only recent reactions
    if (this.reactionHistory.length > 500) {
      this.reactionHistory = this.reactionHistory.slice(-250);
    }
    
    // Broadcast reaction
    this.broadcastReaction(reactionEvent);
    
    // Update analytics
    this.analytics.reactions++;
    
    // Schedule reaction removal
    setTimeout(() => {
      const count = this.activeReactions.get(reactionType);
      this.activeReactions.set(reactionType, Math.max(0, count - 1));
    }, reaction.duration);
  }

  // Camera and scene management
  switchCamera(cameraId, requestedBy = 'system') {
    if (!this.cameras.has(cameraId)) return false;
    
    this.streamState.currentScene = cameraId;
    
    console.log(`📹 Camera switched to ${cameraId} by ${requestedBy}`);
    
    // Broadcast scene change
    this.broadcastSceneChange({
      camera: cameraId,
      requestedBy,
      timestamp: Date.now()
    });
    
    return true;
  }

  startAutoDirector() {
    // Listen for events that trigger camera switches
    setInterval(() => {
      this.checkForAutoDirectorTriggers();
    }, 5000); // Check every 5 seconds
  }

  checkForAutoDirectorTriggers() {
    if (!this.autoDirector.enabled) return;
    
    // Get recent events from backend
    const recentEvents = this.backend.dramaEngine.getRecentEvents(5);
    
    recentEvents.forEach(event => {
      const rule = this.autoDirector.rules.find(r => r.trigger === event.type);
      if (rule) {
        this.triggerAutoDirectorRule(rule, event);
      }
    });
  }

  triggerAutoDirectorRule(rule, event) {
    console.log(`🎬 Auto-director triggered: ${rule.trigger} -> ${rule.camera}`);
    
    // Switch to the appropriate camera
    this.switchCamera(rule.camera, 'auto-director');
    
    // Schedule return to default camera
    setTimeout(() => {
      this.switchCamera('villa-overview', 'auto-director');
    }, rule.duration);
  }

  // Viewer management
  addViewer(viewerId, viewerData) {
    const viewer = {
      id: viewerId,
      username: viewerData.username || `Viewer${Math.floor(Math.random() * 10000)}`,
      joinTime: Date.now(),
      badges: viewerData.badges || [],
      color: viewerData.color || this.generateRandomColor(),
      isVip: false,
      isModerator: false,
      chatEnabled: true,
      reactions: [],
      predictions: [],
      votes: []
    };
    
    this.viewers.set(viewerId, viewer);
    this.streamState.viewerCount++;
    
    // Send welcome message
    this.sendPrivateMessage(viewerId, `Welcome to AlgoVilla! Type !help for commands.`);
    
    console.log(`👋 New viewer: ${viewer.username}`);
    
    return viewer;
  }

  removeViewer(viewerId) {
    const viewer = this.viewers.get(viewerId);
    if (!viewer) return;
    
    this.viewers.delete(viewerId);
    this.streamState.viewerCount = Math.max(0, this.streamState.viewerCount - 1);
    
    console.log(`👋 Viewer left: ${viewer.username}`);
  }

  // Broadcasting methods
  broadcastToAllViewers(message) {
    // In a real implementation, this would use WebSocket connections
    console.log(`📡 Broadcasting to ${this.viewers.size} viewers:`, message);
  }

  broadcastChatMessage(chatMessage) {
    this.broadcastToAllViewers({
      type: 'chat_message',
      data: chatMessage
    });
  }

  broadcastReaction(reaction) {
    this.broadcastToAllViewers({
      type: 'reaction',
      data: reaction
    });
  }

  broadcastSceneChange(sceneData) {
    this.broadcastToAllViewers({
      type: 'scene_change',
      data: sceneData
    });
  }

  broadcastSystemMessage(message) {
    this.broadcastToAllViewers({
      type: 'system_message',
      data: message
    });
  }

  broadcastViewerUpdate() {
    this.broadcastToAllViewers({
      type: 'viewer_update',
      data: {
        count: this.streamState.viewerCount,
        peak: this.analytics.peakViewers
      }
    });
  }

  sendPrivateMessage(viewerId, message) {
    // In a real implementation, this would send to specific viewer
    console.log(`📨 Private message to ${viewerId}: ${message}`);
  }

  // Utility methods
  moderateMessage(message) {
    for (const rule of this.moderationRules) {
      if (rule.pattern.test(message)) {
        return {
          allowed: rule.action !== 'delete',
          reason: `Violated rule: ${rule.pattern}`,
          cleanMessage: rule.action === 'warn' ? message : null
        };
      }
    }
    
    return { allowed: true };
  }

  parseEmotes(message) {
    const emotes = [];
    for (const [emoji, data] of this.emoteSystem) {
      if (message.includes(emoji)) {
        emotes.push(data);
      }
    }
    return emotes;
  }

  generateRandomColor() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  startAnalyticsTracking() {
    setInterval(() => {
      this.updateEngagementScore();
      this.logAnalytics();
    }, 60000); // Every minute
  }

  updateEngagementScore() {
    const chatRate = this.analytics.chatMessages / (this.analytics.totalViewTime / 60000); // messages per minute
    const reactionRate = this.analytics.reactions / (this.analytics.totalViewTime / 60000);
    const voteParticipation = this.analytics.votes / this.analytics.peakViewers;
    
    this.analytics.engagement_score = (chatRate * 0.4 + reactionRate * 0.3 + voteParticipation * 0.3);
  }

  startEngagementSystems() {
    // Auto-polls during key moments
    setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every interval
        this.startAutoPoll();
      }
    }, 300000); // Every 5 minutes
    
    // Reaction highlights
    setInterval(() => {
      this.generateReactionHighlights();
    }, 120000); // Every 2 minutes
  }

  startAutoPoll() {
    const pollTypes = [
      'Who is your favorite contestant?',
      'Which couple has the best chemistry?',
      'Who will win today\'s challenge?',
      'Rate the current drama level (1-10)',
      'Who should be eliminated next?'
    ];
    
    const question = pollTypes[Math.floor(Math.random() * pollTypes.length)];
    
    // Create poll based on current contestants
    const contestants = this.backend.getContestants();
    const options = contestants.slice(0, 4).map(c => c.name);
    
    this.backend.startVoting('poll', question, options);
    this.streamState.votingActive = true;
    
    this.broadcastSystemMessage({
      type: 'poll_started',
      message: `📊 New poll: ${question}`,
      options,
      timestamp: Date.now()
    });
    
    console.log(`📊 Auto-poll started: ${question}`);
  }

  // Public API methods
  getStreamState() {
    return {
      ...this.streamState,
      cameras: Array.from(this.cameras.entries()),
      activeReactions: Object.fromEntries(this.activeReactions),
      analytics: this.analytics
    };
  }

  getChatHistory(limit = 50) {
    return this.chatMessages.slice(-limit);
  }

  getReactionHistory(limit = 100) {
    return this.reactionHistory.slice(-limit);
  }

  // Admin controls
  enableModerator(viewerId) {
    this.moderators.add(viewerId);
    const viewer = this.viewers.get(viewerId);
    if (viewer) {
      viewer.isModerator = true;
      viewer.badges.push('moderator');
    }
  }

  enableVip(viewerId) {
    this.vips.add(viewerId);
    const viewer = this.viewers.get(viewerId);
    if (viewer) {
      viewer.isVip = true;
      viewer.badges.push('vip');
    }
  }

  toggleAutoDirector() {
    this.autoDirector.enabled = !this.autoDirector.enabled;
    console.log(`🎬 Auto-director ${this.autoDirector.enabled ? 'enabled' : 'disabled'}`);
  }

  emergencyModerationMode() {
    this.streamState.chatActive = false;
    this.streamState.reactionsEnabled = false;
    
    this.broadcastSystemMessage({
      type: 'emergency_moderation',
      message: '🚨 Emergency moderation mode activated. Chat and reactions disabled.',
      timestamp: Date.now()
    });
    
    console.log('🚨 Emergency moderation mode activated');
  }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AlgoVillaLiveStreaming;
} else {
  window.AlgoVillaLiveStreaming = AlgoVillaLiveStreaming;
}

console.log('✅ AlgoVilla Live Streaming ready - The show must go on!');