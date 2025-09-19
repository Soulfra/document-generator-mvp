/**
 * Tip Jar Ark Game Master System
 * Noah's Ark vessel with 50 Unix users + 3 non-Unix + 1 game master
 * Game master makes everyone go in circles between colors, theories, and reasoning
 * Integrates with existing Unix color system and guardian-teacher moderators
 */

const WebSocket = require('ws');
const EventEmitter = require('events');

class TipJarArkGameMaster extends EventEmitter {
  constructor() {
    super();
    
    // The Ark vessel configuration
    this.arkConfig = {
      capacity: {
        unixUsers: 50,
        nonUnixUsers: 3,
        gameMaster: 1,
        total: 54
      },
      ports: {
        gamemaster: 9090,
        unixColors: 8084, // existing Unix color system
        guardianTeacher: 8085,
        tipJar: 9091
      }
    };
    
    // User registry
    this.users = {
      unix: new Map(), // 50 Unix users
      nonUnix: new Map(), // 3 special non-Unix users
      gameMaster: null // The one who controls the circles
    };
    
    // The circular flow mechanics
    this.circularFlow = {
      colors: ['yellow', 'white', 'black', 'green', 'red', 'blue', 'purple'],
      theories: ['constellation', 'blamechain', 'soulfra', 'deathtodata', 'calgenesis'],
      reasoning: ['inductive', 'deductive', 'abductive', 'dialectical', 'intuitive'],
      currentPhase: 'colors',
      direction: 'clockwise',
      speed: 1000 // ms between transitions
    };
    
    // Tip jar collection system
    this.tipJar = {
      contributions: new Map(),
      totalValue: 0,
      types: ['unix_keys', 'theories', 'insights', 'api_credits', 'doubloons']
    };
    
    // Guardian-teacher moderator system
    this.moderators = {
      guardian: null,
      teacher: null,
      active: false
    };
    
    // WebSocket servers
    this.servers = new Map();
    
    // Game master control state
    this.gameState = {
      active: false,
      currentCircle: 0,
      participants: new Set(),
      hackAttempts: new Map(),
      circleDirection: 'clockwise',
      phase: 'initialization'
    };
  }
  
  async initialize() {
    console.log('🏺 Initializing Tip Jar Ark Game Master System...');
    
    // Start WebSocket servers
    await this.startGameMasterServer();
    await this.connectToUnixColorSystem();
    await this.startGuardianTeacherModeration();
    await this.initializeTipJarCollection();
    
    // Set up the ark
    await this.setupArkVessel();
    
    console.log('⚡ Tip Jar Ark Game Master ready!');
    console.log(`🎮 Game Master: ws://localhost:${this.arkConfig.ports.gamemaster}`);
    console.log(`🎨 Unix Colors: ws://localhost:${this.arkConfig.ports.unixColors}`);
    console.log(`👨‍🏫 Guardian/Teacher: ws://localhost:${this.arkConfig.ports.guardianTeacher}`);
    console.log(`🏺 Tip Jar: ws://localhost:${this.arkConfig.ports.tipJar}`);
  }
  
  async startGameMasterServer() {
    const server = new WebSocket.Server({ 
      port: this.arkConfig.ports.gamemaster 
    });
    
    server.on('connection', (ws, req) => {
      const userType = this.determineUserType(req);
      console.log(`🎯 ${userType} connected to Game Master`);
      
      ws.userType = userType;
      ws.circlePosition = 0;
      ws.isHacking = false;
      
      // Game master has special privileges
      if (userType === 'game_master') {
        this.users.gameMaster = ws;
        this.setupGameMasterControls(ws);
      } else if (userType === 'unix_user') {
        if (this.users.unix.size < 50) {
          this.users.unix.set(ws.id || `unix_${Date.now()}`, ws);
          this.addToCircularFlow(ws);
        }
      } else if (userType === 'non_unix_user') {
        if (this.users.nonUnix.size < 3) {
          this.users.nonUnix.set(ws.id || `nonunix_${Date.now()}`, ws);
          this.grantSpecialPrivileges(ws);
        }
      }
      
      ws.on('message', (data) => {
        this.handleUserMessage(ws, data);
      });
      
      ws.on('close', () => {
        this.removeUserFromArk(ws);
      });
    });
    
    this.servers.set('gamemaster', server);
  }
  
  setupGameMasterControls(gameMasterWs) {
    console.log('👑 Setting up Game Master controls...');
    
    gameMasterWs.on('message', (data) => {
      try {
        const command = JSON.parse(data);
        
        switch (command.type) {
          case 'start_circles':
            this.startCircularFlow();
            break;
          case 'change_direction':
            this.changeCircleDirection(command.direction);
            break;
          case 'adjust_speed':
            this.adjustCircleSpeed(command.speed);
            break;
          case 'force_hack_attempt':
            this.simulateHackAttempt(command.target);
            break;
          case 'reset_circles':
            this.resetAllCircles();
            break;
          case 'collect_tips':
            this.collectTipJarContributions();
            break;
        }
      } catch (error) {
        console.error('Game Master command error:', error);
      }
    });
    
    // Send initial game master interface
    gameMasterWs.send(JSON.stringify({
      type: 'game_master_interface',
      arkStatus: this.getArkStatus(),
      controls: {
        circularFlow: this.circularFlow,
        tipJar: this.tipJar,
        userCounts: {
          unix: this.users.unix.size,
          nonUnix: this.users.nonUnix.size,
          total: this.users.unix.size + this.users.nonUnix.size
        }
      }
    }));
  }
  
  async connectToUnixColorSystem() {
    console.log('🎨 Connecting to existing Unix Color System...');
    
    // Connect to existing Unix color WebSocket server
    try {
      const unixColorWs = new WebSocket(`ws://localhost:${this.arkConfig.ports.unixColors}`);
      
      unixColorWs.on('open', () => {
        console.log('✅ Connected to Unix Color System');
        this.unixColorConnection = unixColorWs;
      });
      
      unixColorWs.on('message', (data) => {
        try {
          const colorUpdate = JSON.parse(data);
          this.handleUnixColorUpdate(colorUpdate);
        } catch (error) {
          console.log('Unix color update:', data.toString());
        }
      });
      
    } catch (error) {
      console.warn('⚠️ Unix Color System not available, using standalone mode');
    }
  }
  
  async startGuardianTeacherModeration() {
    const moderatorServer = new WebSocket.Server({ 
      port: this.arkConfig.ports.guardianTeacher 
    });
    
    moderatorServer.on('connection', (ws) => {
      console.log('👨‍🏫 Guardian/Teacher moderator connected');
      
      ws.on('message', (data) => {
        try {
          const moderation = JSON.parse(data);
          this.handleModerationAction(moderation);
        } catch (error) {
          console.error('Moderation error:', error);
        }
      });
    });
    
    this.servers.set('moderation', moderatorServer);
    this.moderators.active = true;
  }
  
  async initializeTipJarCollection() {
    const tipJarServer = new WebSocket.Server({ 
      port: this.arkConfig.ports.tipJar 
    });
    
    tipJarServer.on('connection', (ws) => {
      console.log('🏺 Tip Jar collector connected');
      
      ws.on('message', (data) => {
        try {
          const contribution = JSON.parse(data);
          this.addToTipJar(contribution);
        } catch (error) {
          console.error('Tip jar error:', error);
        }
      });
      
      // Send current tip jar status
      ws.send(JSON.stringify({
        type: 'tip_jar_status',
        totalValue: this.tipJar.totalValue,
        contributionCount: this.tipJar.contributions.size,
        types: this.tipJar.types
      }));
    });
    
    this.servers.set('tipjar', tipJarServer);
  }
  
  async setupArkVessel() {
    console.log('🚢 Setting up Noah\'s Ark vessel...');
    
    // Initialize the ark with capacity limits
    this.ark = {
      name: 'Tip Jar Ark',
      capacity: this.arkConfig.capacity,
      manifest: {
        unix_users: [],
        non_unix_users: [],
        game_master: null,
        cargo: []
      },
      status: 'boarding',
      journey: {
        started: false,
        currentPhase: 'colors',
        circles_completed: 0,
        destination: 'understanding'
      }
    };
    
    console.log('⚓ Ark vessel ready for boarding');
  }
  
  startCircularFlow() {
    if (this.gameState.active) return;
    
    console.log('🌀 Starting circular flow - making everyone go in circles!');
    this.gameState.active = true;
    this.gameState.phase = 'active_circles';
    
    // Start the circular motion
    this.circleInterval = setInterval(() => {
      this.advanceCircularFlow();
    }, this.circularFlow.speed);
    
    this.broadcastToAllUsers({
      type: 'circle_started',
      message: 'The Game Master has initiated circular flow!',
      currentPhase: this.circularFlow.currentPhase,
      direction: this.circularFlow.direction
    });
  }
  
  advanceCircularFlow() {
    const phases = ['colors', 'theories', 'reasoning'];
    const currentPhaseIndex = phases.indexOf(this.circularFlow.currentPhase);
    
    // Move to next phase in circle
    const nextPhaseIndex = (currentPhaseIndex + 1) % phases.length;
    this.circularFlow.currentPhase = phases[nextPhaseIndex];
    
    // Get current elements for this phase
    const elements = this.circularFlow[this.circularFlow.currentPhase];
    const currentElement = elements[this.gameState.currentCircle % elements.length];
    
    // Advance the circle position
    if (this.circularFlow.direction === 'clockwise') {
      this.gameState.currentCircle++;
    } else {
      this.gameState.currentCircle--;
    }
    
    console.log(`🔄 Circle advance: ${this.circularFlow.currentPhase} -> ${currentElement}`);
    
    // Make everyone go in circles!
    this.makeEveryoneGoInCircles(currentElement);
    
    // Random hack attempts (everyone tries to hack the game master)
    if (Math.random() < 0.3) {
      this.triggerRandomHackAttempt();
    }
  }
  
  makeEveryoneGoInCircles(currentElement) {
    const circleData = {
      type: 'forced_circle',
      phase: this.circularFlow.currentPhase,
      element: currentElement,
      direction: this.circularFlow.direction,
      position: this.gameState.currentCircle,
      message: `You are now circling around: ${currentElement}`,
      gamemaster_control: true
    };
    
    // Force all Unix users into the circle
    this.users.unix.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(circleData));
      }
    });
    
    // Non-Unix users get special circle treatment
    this.users.nonUnix.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          ...circleData,
          type: 'special_circle',
          privilege: 'non_unix_insight',
          canBreakCircle: Math.random() < 0.1 // 10% chance to break free
        }));
      }
    });
    
    // Notify moderators
    this.notifyModerators({
      type: 'circle_status',
      phase: this.circularFlow.currentPhase,
      element: currentElement,
      participantCount: this.users.unix.size + this.users.nonUnix.size
    });
  }
  
  triggerRandomHackAttempt() {
    if (this.users.unix.size === 0) return;
    
    // Pick a random Unix user to attempt hacking the game master
    const unixUsers = Array.from(this.users.unix.values());
    const hacker = unixUsers[Math.floor(Math.random() * unixUsers.length)];
    
    const hackAttemptId = `hack_${Date.now()}`;
    
    console.log('🎯 Random hack attempt triggered!');
    
    // Record the hack attempt
    this.gameState.hackAttempts.set(hackAttemptId, {
      attacker: hacker.id || 'unknown',
      timestamp: new Date(),
      success: false, // Game master always wins
      method: this.getRandomHackMethod()
    });
    
    // Notify the hacker they're attempting to hack
    if (hacker.readyState === WebSocket.OPEN) {
      hacker.send(JSON.stringify({
        type: 'hack_attempt',
        target: 'game_master',
        attemptId: hackAttemptId,
        message: 'You are attempting to hack the Game Master!',
        warning: 'The Game Master sees all hack attempts...'
      }));
    }
    
    // Game master responds by making the hacker go in even more circles
    setTimeout(() => {
      this.gameMasterCounterHack(hacker, hackAttemptId);
    }, 2000);
  }
  
  gameMasterCounterHack(hacker, hackAttemptId) {
    console.log('👑 Game Master counter-hacking...');
    
    // Make the hacker go in extra circles as punishment
    const punishment = {
      type: 'punishment_circles',
      reason: 'hack_attempt',
      attemptId: hackAttemptId,
      extraCircles: Math.floor(Math.random() * 5) + 3,
      message: 'The Game Master caught your hack attempt! More circles for you!',
      gamemaster_response: 'I see everything. You cannot hack me.'
    };
    
    if (hacker.readyState === WebSocket.OPEN) {
      hacker.send(JSON.stringify(punishment));
    }
    
    // Notify all users that someone tried to hack and failed
    this.broadcastToAllUsers({
      type: 'hack_failed',
      message: 'Someone tried to hack the Game Master and failed!',
      lesson: 'The Game Master cannot be hacked - only reasoned with',
      newCircleSpeed: this.circularFlow.speed * 0.9 // Slightly faster circles
    });
    
    // Speed up circles slightly as consequence
    this.circularFlow.speed = Math.max(500, this.circularFlow.speed * 0.9);
  }
  
  addToTipJar(contribution) {
    const tipId = `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.tipJar.contributions.set(tipId, {
      ...contribution,
      timestamp: new Date(),
      id: tipId,
      verified: true
    });
    
    this.tipJar.totalValue += contribution.value || 1;
    
    console.log(`🏺 New tip added: ${contribution.type} (Total: ${this.tipJar.totalValue})`);
    
    // Broadcast tip jar update
    this.broadcastToAllUsers({
      type: 'tip_jar_update',
      newContribution: contribution.type,
      totalValue: this.tipJar.totalValue,
      message: 'Someone contributed to the Tip Jar Ark!'
    });
  }
  
  handleModerationAction(moderation) {
    console.log(`👨‍🏫 Moderation action: ${moderation.type}`);
    
    switch (moderation.type) {
      case 'slow_circles':
        this.circularFlow.speed = Math.min(3000, this.circularFlow.speed * 1.2);
        break;
      case 'fast_circles':
        this.circularFlow.speed = Math.max(500, this.circularFlow.speed * 0.8);
        break;
      case 'pause_circles':
        if (this.circleInterval) {
          clearInterval(this.circleInterval);
          this.gameState.active = false;
        }
        break;
      case 'resume_circles':
        if (!this.gameState.active) {
          this.startCircularFlow();
        }
        break;
      case 'reset_hack_attempts':
        this.gameState.hackAttempts.clear();
        break;
    }
    
    this.broadcastToAllUsers({
      type: 'moderation_action',
      action: moderation.type,
      moderator: moderation.moderator || 'guardian_teacher',
      message: `Moderator action: ${moderation.type}`
    });
  }
  
  determineUserType(req) {
    const userAgent = req.headers['user-agent'] || '';
    const timestamp = Date.now();
    
    // Check if it's the game master (special token or first connection)
    if (req.url?.includes('gamemaster=true') || !this.users.gameMaster) {
      return 'game_master';
    }
    
    // Check for Unix-like characteristics
    if (userAgent.includes('Unix') || 
        userAgent.includes('Linux') || 
        userAgent.includes('curl') ||
        timestamp % 1970 === 0) {
      return 'unix_user';
    }
    
    // Everyone else is non-Unix (limited to 3)
    return 'non_unix_user';
  }
  
  grantSpecialPrivileges(nonUnixWs) {
    nonUnixWs.privileges = {
      canSeeGameMaster: true,
      canInfluenceCircles: true,
      canBreakFreeFromCircles: Math.random() < 0.2,
      tipJarBonus: 2.0
    };
    
    nonUnixWs.send(JSON.stringify({
      type: 'special_privileges',
      privileges: nonUnixWs.privileges,
      message: 'You have been granted special non-Unix privileges!'
    }));
  }
  
  addToCircularFlow(unixWs) {
    unixWs.circleData = {
      joinedAt: Date.now(),
      circlePosition: this.gameState.currentCircle,
      hackAttempts: 0,
      currentPhase: this.circularFlow.currentPhase
    };
    
    this.gameState.participants.add(unixWs);
  }
  
  getRandomHackMethod() {
    const methods = [
      'buffer_overflow',
      'sql_injection',
      'social_engineering',
      'brute_force',
      'privilege_escalation',
      'zero_day_exploit',
      'man_in_the_middle',
      'ddos_attempt'
    ];
    
    return methods[Math.floor(Math.random() * methods.length)];
  }
  
  broadcastToAllUsers(message) {
    const data = JSON.stringify(message);
    
    // Broadcast to Unix users
    this.users.unix.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
    
    // Broadcast to non-Unix users
    this.users.nonUnix.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
    
    // Notify game master
    if (this.users.gameMaster && this.users.gameMaster.readyState === WebSocket.OPEN) {
      this.users.gameMaster.send(JSON.stringify({
        ...message,
        type: 'broadcast_notification',
        original_type: message.type
      }));
    }
  }
  
  notifyModerators(message) {
    if (this.moderators.active) {
      const moderatorData = JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
        arkStatus: this.getArkStatus()
      });
      
      // Would send to connected moderators via WebSocket
      console.log(`👨‍🏫 Moderator notification: ${message.type}`);
    }
  }
  
  getArkStatus() {
    return {
      capacity: this.arkConfig.capacity,
      currentLoad: {
        unix: this.users.unix.size,
        nonUnix: this.users.nonUnix.size,
        gameMaster: this.users.gameMaster ? 1 : 0
      },
      gameState: this.gameState,
      tipJar: {
        totalValue: this.tipJar.totalValue,
        contributions: this.tipJar.contributions.size
      },
      circularFlow: this.circularFlow
    };
  }
  
  handleUserMessage(ws, data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'contribute_tip':
          this.addToTipJar(message.contribution);
          break;
        case 'attempt_hack':
          this.handleHackAttempt(ws, message);
          break;
        case 'break_circle':
          this.handleCircleBreakAttempt(ws, message);
          break;
        case 'reason_with_gamemaster':
          this.handleReasoningAttempt(ws, message);
          break;
      }
    } catch (error) {
      console.error('User message error:', error);
    }
  }
  
  handleHackAttempt(ws, message) {
    // All hack attempts fail, but are recorded
    const hackId = `hack_${Date.now()}`;
    
    this.gameState.hackAttempts.set(hackId, {
      attacker: ws.id || 'unknown',
      method: message.method,
      timestamp: new Date(),
      success: false
    });
    
    // Punishment: more circles!
    this.gameMasterCounterHack(ws, hackId);
  }
  
  handleReasoningAttempt(ws, message) {
    // Reasoning has a chance to influence the game master
    const reasoningQuality = this.evaluateReasoning(message.reasoning);
    
    if (reasoningQuality > 0.7) {
      // Good reasoning might slow down circles or change direction
      ws.send(JSON.stringify({
        type: 'reasoning_accepted',
        message: 'The Game Master considers your reasoning...',
        effect: 'circles_slowed',
        reasoning_score: reasoningQuality
      }));
      
      this.circularFlow.speed = Math.min(3000, this.circularFlow.speed * 1.1);
    } else {
      // Poor reasoning = faster circles
      ws.send(JSON.stringify({
        type: 'reasoning_rejected',
        message: 'The Game Master finds your reasoning lacking...',
        effect: 'circles_accelerated',
        reasoning_score: reasoningQuality
      }));
      
      this.circularFlow.speed = Math.max(500, this.circularFlow.speed * 0.95);
    }
  }
  
  evaluateReasoning(reasoning) {
    // Simple reasoning quality evaluation
    const keywords = ['because', 'therefore', 'however', 'evidence', 'logic', 'understanding'];
    const keywordCount = keywords.filter(k => reasoning.toLowerCase().includes(k)).length;
    const lengthScore = Math.min(1, reasoning.length / 100);
    
    return (keywordCount / keywords.length) * 0.7 + lengthScore * 0.3;
  }
  
  removeUserFromArk(ws) {
    // Remove user from appropriate collection
    if (ws.userType === 'game_master') {
      this.users.gameMaster = null;
      console.log('👑 Game Master disconnected');
    } else if (ws.userType === 'unix_user') {
      this.users.unix.delete(ws.id);
      console.log(`🐧 Unix user disconnected (${this.users.unix.size}/50 remaining)`);
    } else if (ws.userType === 'non_unix_user') {
      this.users.nonUnix.delete(ws.id);
      console.log(`🖥️ Non-Unix user disconnected (${this.users.nonUnix.size}/3 remaining)`);
    }
    
    this.gameState.participants.delete(ws);
  }
  
  shutdown() {
    console.log('🛑 Shutting down Tip Jar Ark Game Master...');
    
    if (this.circleInterval) {
      clearInterval(this.circleInterval);
    }
    
    this.servers.forEach((server, name) => {
      console.log(`Closing ${name} server...`);
      server.close();
    });
    
    if (this.unixColorConnection) {
      this.unixColorConnection.close();
    }
    
    console.log('⚓ Tip Jar Ark has reached port');
  }
}

// Export for use
module.exports = TipJarArkGameMaster;

// Start if run directly
if (require.main === module) {
  const gameMaster = new TipJarArkGameMaster();
  
  gameMaster.initialize().catch(console.error);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🏺 Tip Jar Ark Game Master shutting down...');
    gameMaster.shutdown();
    process.exit(0);
  });
}