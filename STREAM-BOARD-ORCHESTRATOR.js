#!/usr/bin/env node

/**
 * 🎮📺 STREAM BOARD ORCHESTRATOR
 * Phase 1.1: Living Development Board for Twitch/YouTube Streaming
 * 
 * Central hub connecting git commits, devlogs, symlinks, RSS feeds, and AI
 * characters into a unified streaming ecosystem. Converts development events
 * into board posts, routes to AI characters for debates, and manages real-time
 * WebSocket connections for interactive streaming.
 * 
 * Integration Points:
 * - Git commits → Forum posts with AI analysis
 * - Symlink events → Visual entity movements
 * - RSS feeds → Discussion threads
 * - AI characters → Twitch chat participants
 * - Conway Automaton → Living development visualization
 * 
 * Characters participate in your stream by:
 * - Arguing about code quality in real-time
 * - Creating forum posts about development decisions
 * - Debating with viewers in Twitch chat
 * - Reacting to commits, builds, and errors
 */

const fs = require('fs').promises;
const crypto = require('crypto');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const express = require('express');
const axios = require('axios');

// Integration with existing systems
const { UnifiedCharacterTool } = require('./unified-character-tool.js');
const { AgentEconomyForum } = require('./AGENT-ECONOMY-FORUM.js');
const { StreamingMonetizationLayer } = require('./streaming-monetization-layer.js');
const { VisualEntitySpawningSystem } = require('./VISUAL-ENTITY-SPAWNING-SYSTEM.js');
const { ConwayContractAutomaton } = require('./CONWAY-CONTRACT-AUTOMATON.js');

console.log('🎮📺 STREAM BOARD ORCHESTRATOR');
console.log('==============================');

class StreamBoardOrchestrator extends EventEmitter {
  constructor() {
    super();
    
    this.orchestratorId = crypto.randomUUID();
    this.startTime = Date.now();
    
    // Core services
    this.services = {
      characterTool: null,
      agentForum: null,
      streamingLayer: null,
      visualEntities: null,
      conwayAutomaton: null
    };
    
    // Development event tracking
    this.devEvents = {
      commits: new Map(),
      builds: new Map(),
      errors: new Map(),
      symlinks: new Map(),
      rssItems: new Map()
    };
    
    // Character states for streaming
    this.characterStates = {
      ralph: { mood: 'aggressive', lastAction: null, twitchActive: false },
      alice: { mood: 'analytical', lastAction: null, twitchActive: false },
      bob: { mood: 'constructive', lastAction: null, twitchActive: false },
      charlie: { mood: 'cautious', lastAction: null, twitchActive: false },
      diana: { mood: 'orchestrating', lastAction: null, twitchActive: false },
      cal: { mood: 'wise', lastAction: null, twitchActive: false }
    };
    
    // Streaming configuration
    this.streamConfig = {
      twitchChannel: process.env.TWITCH_CHANNEL || 'dev_stream',
      twitchBotName: process.env.TWITCH_BOT_NAME || 'DevCharacterBot',
      youtubeEnabled: process.env.YOUTUBE_ENABLED === 'true',
      discordWebhook: process.env.DISCORD_WEBHOOK,
      streamTitle: 'Living Development with AI Characters',
      currentDebate: null,
      viewerVotes: new Map()
    };
    
    // Board configuration
    this.boardConfig = {
      maxPostLength: 5000,
      maxDebateRounds: 10,
      autoArchiveAfter: 24 * 60 * 60 * 1000, // 24 hours
      characterPostDelay: 2000, // 2 seconds between character posts
      commitBatchWindow: 30000 // 30 seconds to batch commits
    };
    
    // WebSocket server for real-time updates
    this.wsPort = 8891;
    this.wsServer = null;
    this.connectedClients = new Set();
    
    // Express server for HTTP endpoints
    this.app = express();
    this.httpPort = 8892;
    
    this.initialize();
  }

  async initialize() {
    console.log('🎮 Initializing Stream Board Orchestrator...');
    
    try {
      // Initialize core services
      await this.initializeServices();
      
      // Setup event listeners
      await this.setupEventListeners();
      
      // Setup HTTP endpoints
      await this.setupHttpEndpoints();
      
      // Setup WebSocket server
      await this.setupWebSocketServer();
      
      // Initialize character personalities for streaming
      await this.initializeStreamingCharacters();
      
      // Initialize sub-systems
      this.gitBridge = null;
      this.rssAggregator = null;
      this.symlinkVisualizer = null;
      this.characterDebater = null;
      this.twitchAgents = null;
      
      // Initialize Twitch Character Agents if available
      await this.initializeTwitchAgents();
      
      // Start monitoring development activity
      await this.startDevelopmentMonitoring();
      
      console.log('✅ Stream Board Orchestrator initialized successfully');
      console.log(`🌐 WebSocket: ws://localhost:${this.wsPort}`);
      console.log(`🌐 HTTP API: http://localhost:${this.httpPort}`);
      
      // Announce orchestrator startup
      await this.announceStartup();
      
    } catch (error) {
      console.error('❌ Failed to initialize Stream Board Orchestrator:', error);
      throw error;
    }
  }

  async initializeServices() {
    console.log('🔧 Initializing integrated services...');
    
    // Initialize Unified Character Tool
    try {
      this.services.characterTool = new UnifiedCharacterTool();
      console.log('✅ Unified Character Tool initialized');
    } catch (error) {
      console.warn('⚠️ Could not initialize Unified Character Tool:', error.message);
    }
    
    // Initialize Agent Economy Forum
    try {
      this.services.agentForum = new AgentEconomyForum();
      await this.services.agentForum.initialize();
      console.log('✅ Agent Economy Forum initialized');
    } catch (error) {
      console.warn('⚠️ Could not initialize Agent Economy Forum:', error.message);
    }
    
    // Initialize Visual Entity System
    try {
      this.services.conwayAutomaton = new ConwayContractAutomaton();
      this.services.visualEntities = new VisualEntitySpawningSystem(this.services.conwayAutomaton);
      console.log('✅ Visual Entity System initialized');
    } catch (error) {
      console.warn('⚠️ Could not initialize Visual Entity System:', error.message);
    }
    
    // Initialize Streaming Monetization Layer
    try {
      // Create mock MUD engine for streaming layer
      const mockMudEngine = {
        players: new Map(),
        revenue: { totalEarned: 0 },
        streamingData: { highlightClips: [] },
        calAI: {
          generateResponse: async (context) => {
            // Use character tool for responses
            if (this.services.characterTool) {
              const response = await this.services.characterTool.processCharacterResponse('cal', context);
              return { text: response, rarity: 'common' };
            }
            return { text: 'Cal is thinking...', rarity: 'common' };
          }
        }
      };
      
      this.services.streamingLayer = new StreamingMonetizationLayer(mockMudEngine);
      console.log('✅ Streaming Monetization Layer initialized');
    } catch (error) {
      console.warn('⚠️ Could not initialize Streaming Monetization Layer:', error.message);
    }
  }

  async setupEventListeners() {
    console.log('👂 Setting up event listeners...');
    
    // Listen for git events
    process.on('git:commit', (commit) => this.handleGitCommit(commit));
    process.on('git:push', (push) => this.handleGitPush(push));
    
    // Listen for build events
    process.on('build:start', (build) => this.handleBuildStart(build));
    process.on('build:complete', (build) => this.handleBuildComplete(build));
    process.on('build:failed', (build) => this.handleBuildFailed(build));
    
    // Listen for symlink events
    process.on('symlink:created', (symlink) => this.handleSymlinkCreated(symlink));
    process.on('symlink:removed', (symlink) => this.handleSymlinkRemoved(symlink));
    
    // Listen for RSS events
    process.on('rss:new', (item) => this.handleRssItem(item));
    
    // Listen for character events
    if (this.services.characterTool) {
      this.services.characterTool.on('response', (data) => this.handleCharacterResponse(data));
    }
    
    // Listen for forum events
    if (this.services.agentForum) {
      this.services.agentForum.on('newPost', (post) => this.handleForumPost(post));
    }
    
    console.log('✅ Event listeners configured');
  }

  async setupHttpEndpoints() {
    console.log('🌐 Setting up HTTP endpoints...');
    
    this.app.use(express.json());
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        orchestratorId: this.orchestratorId,
        uptime: Date.now() - this.startTime,
        services: Object.entries(this.services).map(([name, service]) => ({
          name,
          status: service ? 'active' : 'inactive'
        }))
      });
    });
    
    // Git webhook endpoint
    this.app.post('/webhook/git', async (req, res) => {
      try {
        await this.handleGitWebhook(req.body);
        res.json({ success: true });
      } catch (error) {
        console.error('Git webhook error:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // RSS feed endpoint
    this.app.post('/webhook/rss', async (req, res) => {
      try {
        await this.handleRssWebhook(req.body);
        res.json({ success: true });
      } catch (error) {
        console.error('RSS webhook error:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // Twitch integration endpoints
    this.app.post('/twitch/command', async (req, res) => {
      try {
        const result = await this.handleTwitchCommand(req.body);
        res.json(result);
      } catch (error) {
        console.error('Twitch command error:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // Character debate endpoint
    this.app.post('/debate/start', async (req, res) => {
      try {
        const debate = await this.startCharacterDebate(req.body.topic, req.body.participants);
        res.json(debate);
      } catch (error) {
        console.error('Debate start error:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // Development stats endpoint
    this.app.get('/stats/development', (req, res) => {
      res.json({
        commits: this.devEvents.commits.size,
        builds: this.devEvents.builds.size,
        errors: this.devEvents.errors.size,
        symlinks: this.devEvents.symlinks.size,
        rssItems: this.devEvents.rssItems.size,
        currentDebate: this.streamConfig.currentDebate,
        characterStates: this.characterStates
      });
    });
    
    // Start HTTP server
    this.app.listen(this.httpPort, () => {
      console.log(`✅ HTTP server listening on port ${this.httpPort}`);
    });
  }

  async setupWebSocketServer() {
    console.log('🔌 Setting up WebSocket server...');
    
    this.wsServer = new WebSocket.Server({ port: this.wsPort });
    
    this.wsServer.on('connection', (ws) => {
      console.log('📺 New streaming client connected');
      this.connectedClients.add(ws);
      
      // Send initial state
      ws.send(JSON.stringify({
        type: 'initial_state',
        orchestratorId: this.orchestratorId,
        services: Object.keys(this.services).filter(s => this.services[s]),
        characterStates: this.characterStates,
        currentDebate: this.streamConfig.currentDebate,
        stats: {
          commits: this.devEvents.commits.size,
          builds: this.devEvents.builds.size,
          connectedClients: this.connectedClients.size
        }
      }));
      
      ws.on('close', () => {
        this.connectedClients.delete(ws);
        console.log('📺 Streaming client disconnected');
      });
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      });
    });
    
    console.log(`✅ WebSocket server listening on port ${this.wsPort}`);
  }

  async initializeTwitchAgents() {
    console.log('🤖 Initializing Twitch Character Agents...');
    
    try {
      const TwitchCharacterAgents = require('./TWITCH-CHARACTER-AGENTS.js');
      
      this.twitchAgents = new TwitchCharacterAgents({
        channel: this.streamConfig.twitchChannel,
        streamBoardUrl: `http://localhost:${this.httpPort}`,
        gitBoardUrl: 'http://localhost:8893' // Git Board Bridge port
      });
      
      // Connect Twitch agents to Stream Board events
      this.on('character_debate', (data) => {
        if (this.twitchAgents) {
          this.twitchAgents.startCharacterDebate(data.topic, data.participants);
        }
      });
      
      this.on('git_commit', (data) => {
        if (this.twitchAgents) {
          this.twitchAgents.reactToCommit(data.commit);
        }
      });
      
      console.log('✅ Twitch Character Agents initialized');
    } catch (error) {
      console.warn('⚠️ Could not initialize Twitch Character Agents:', error.message);
      console.log('Twitch integration will be unavailable');
    }
  }

  async initializeStreamingCharacters() {
    console.log('🎭 Initializing streaming character personalities...');
    
    const characterPersonalities = {
      ralph: {
        twitchGreeting: "RALPH HERE! Time to DESTROY some bad code! 💥",
        commitReactions: {
          good: ["Nice commit! But it could be MORE AGGRESSIVE!", "BOOM! That's how you commit!"],
          bad: ["TERRIBLE! Delete it all!", "This commit makes me ANGRY! 🔥"],
          neutral: ["Meh. Could use more destruction.", "Not explosive enough for my taste."]
        },
        debateStyle: 'aggressive',
        favoriteTopics: ['refactoring', 'performance', 'deletion']
      },
      
      alice: {
        twitchGreeting: "Alice here. Let me analyze the patterns in today's stream... 🔍",
        commitReactions: {
          good: ["Excellent pattern usage. I see the connections.", "This aligns with established patterns."],
          bad: ["Pattern violation detected. This breaks consistency.", "I see concerning anti-patterns here."],
          neutral: ["Interesting approach. Let me trace the connections.", "The pattern implications need analysis."]
        },
        debateStyle: 'analytical',
        favoriteTopics: ['architecture', 'patterns', 'connections']
      },
      
      bob: {
        twitchGreeting: "Bob the Builder here! Let's BUILD something amazing! 🔨",
        commitReactions: {
          good: ["Great foundation! We can build on this!", "Solid construction! Documentation included?"],
          bad: ["This needs rebuilding from scratch.", "Where's the documentation? Can't build without it!"],
          neutral: ["We can work with this. Let me improve it.", "Needs some structural improvements."]
        },
        debateStyle: 'constructive',
        favoriteTopics: ['documentation', 'structure', 'building']
      },
      
      charlie: {
        twitchGreeting: "Charlie on security watch. Scanning for vulnerabilities... 🔒",
        commitReactions: {
          good: ["Security checks passed. Good defensive coding.", "No vulnerabilities detected. Well done."],
          bad: ["SECURITY ALERT! This code is vulnerable!", "Critical security flaw detected!"],
          neutral: ["Running security scan... Some concerns.", "Needs security hardening."]
        },
        debateStyle: 'cautious',
        favoriteTopics: ['security', 'validation', 'protection']
      },
      
      diana: {
        twitchGreeting: "Diana here, orchestrating today's development symphony. 🎼",
        commitReactions: {
          good: ["Beautifully orchestrated commit!", "This harmonizes well with the codebase."],
          bad: ["This disrupts our orchestration flow.", "Coordination failure detected."],
          neutral: ["Let me coordinate this with other changes.", "Needs better integration."]
        },
        debateStyle: 'diplomatic',
        favoriteTopics: ['coordination', 'integration', 'workflow']
      },
      
      cal: {
        twitchGreeting: "Cal has arrived. Ready to learn together? 🧠",
        commitReactions: {
          good: ["Excellent learning opportunity here!", "This teaches us valuable lessons."],
          bad: ["Mistakes are how we learn. Let's fix this.", "Important lesson in what not to do."],
          neutral: ["Interesting approach. What can we learn?", "Let's explore the implications."]
        },
        debateStyle: 'wise',
        favoriteTopics: ['learning', 'wisdom', 'growth']
      }
    };
    
    // Apply personalities to character states
    for (const [character, personality] of Object.entries(characterPersonalities)) {
      this.characterStates[character] = {
        ...this.characterStates[character],
        personality,
        twitchActive: false,
        lastTwitchMessage: null,
        debateWins: 0,
        viewerSupport: 0
      };
    }
    
    console.log('✅ Character personalities initialized for streaming');
  }

  // GIT INTEGRATION
  async handleGitCommit(commit) {
    console.log(`\n📝 NEW GIT COMMIT: ${commit.hash.substring(0, 7)}`);
    console.log(`Author: ${commit.author}`);
    console.log(`Message: ${commit.message}`);
    
    // Store commit
    this.devEvents.commits.set(commit.hash, {
      ...commit,
      timestamp: Date.now(),
      reactions: {},
      forumPostId: null
    });
    
    // Create forum post about the commit
    if (this.services.agentForum) {
      const post = await this.createCommitForumPost(commit);
      this.devEvents.commits.get(commit.hash).forumPostId = post.id;
    }
    
    // Spawn visual entity for significant commits
    if (this.services.visualEntities && this.isSignificantCommit(commit)) {
      await this.spawnCommitEntity(commit);
    }
    
    // Trigger character reactions
    await this.triggerCharacterReactions('commit', commit);
    
    // Broadcast to stream
    this.broadcastToStream({
      type: 'git_commit',
      commit: {
        hash: commit.hash.substring(0, 7),
        author: commit.author,
        message: commit.message,
        timestamp: Date.now()
      }
    });
    
    // Emit event for Twitch agents
    this.emit('git_commit', { commit });
  }

  async createCommitForumPost(commit) {
    console.log(`📮 Creating forum post for commit ${commit.hash.substring(0, 7)}...`);
    
    const postData = {
      username: 'GitBot',
      subject: `[COMMIT] ${commit.message.substring(0, 50)}${commit.message.length > 50 ? '...' : ''}`,
      content: `
## New Commit: ${commit.hash}

**Author:** ${commit.author}
**Date:** ${new Date(commit.timestamp).toLocaleString()}
**Branch:** ${commit.branch || 'main'}

### Commit Message:
\`\`\`
${commit.message}
\`\`\`

### Files Changed:
${commit.files ? commit.files.map(f => `- ${f.filename} (+${f.additions}/-${f.deletions})`).join('\n') : 'No file information available'}

### Diff Preview:
\`\`\`diff
${commit.diff ? commit.diff.substring(0, 500) + (commit.diff.length > 500 ? '\n...' : '') : 'No diff available'}
\`\`\`

---
*This post was automatically generated from git commit ${commit.hash}*
      `.trim(),
      forum_id: 1,
      is_ai_agent: true
    };
    
    try {
      const response = await axios.post(
        'http://localhost:8080/api/posts',
        postData,
        { headers: { 'X-Agent-Token': this.orchestratorId } }
      );
      
      console.log(`✅ Forum post created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create forum post:', error.message);
      return null;
    }
  }

  async triggerCharacterReactions(eventType, eventData) {
    console.log(`🎭 Triggering character reactions for ${eventType}...`);
    
    const activeCharacters = Object.entries(this.characterStates)
      .filter(([_, state]) => state.twitchActive || Math.random() < 0.5); // 50% chance for inactive characters
    
    for (const [character, state] of activeCharacters) {
      await this.generateCharacterReaction(character, eventType, eventData);
      
      // Delay between character reactions
      await new Promise(resolve => setTimeout(resolve, this.boardConfig.characterPostDelay));
    }
  }

  async generateCharacterReaction(character, eventType, eventData) {
    const state = this.characterStates[character];
    const personality = state.personality;
    
    if (!personality) return;
    
    let reaction = '';
    let mood = 'neutral';
    
    switch (eventType) {
      case 'commit':
        // Analyze commit quality (mock analysis)
        const quality = this.analyzeCommitQuality(eventData);
        const reactions = personality.commitReactions[quality];
        reaction = reactions[Math.floor(Math.random() * reactions.length)];
        mood = quality;
        
        // Post reaction to forum if significant
        if (this.services.agentForum && eventData.forumPostId) {
          await this.postCharacterReply(character, eventData.forumPostId, reaction);
        }
        break;
        
      case 'build':
        if (eventData.status === 'failed') {
          reaction = this.generateBuildFailureReaction(character, eventData);
          mood = 'concerned';
        } else {
          reaction = this.generateBuildSuccessReaction(character, eventData);
          mood = 'happy';
        }
        break;
        
      case 'error':
        reaction = this.generateErrorReaction(character, eventData);
        mood = 'worried';
        break;
    }
    
    // Update character state
    this.characterStates[character].mood = mood;
    this.characterStates[character].lastAction = {
      type: 'reaction',
      eventType,
      reaction,
      timestamp: Date.now()
    };
    
    // Broadcast character reaction
    this.broadcastToStream({
      type: 'character_reaction',
      character,
      reaction,
      mood,
      eventType,
      timestamp: Date.now()
    });
    
    console.log(`💬 ${character}: ${reaction}`);
  }

  async postCharacterReply(character, postId, content) {
    if (!this.services.agentForum) return;
    
    const replyData = {
      username: character.charAt(0).toUpperCase() + character.slice(1),
      content: content,
      parent_id: postId,
      is_ai_agent: true
    };
    
    try {
      const response = await axios.post(
        'http://localhost:8080/api/posts',
        replyData,
        { headers: { 'X-Agent-Token': this.orchestratorId } }
      );
      
      console.log(`✅ ${character} posted reply: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to post ${character} reply:`, error.message);
      return null;
    }
  }

  analyzeCommitQuality(commit) {
    // Mock analysis - in real implementation would use AI
    const goodPatterns = ['fix', 'add', 'implement', 'improve', 'optimize'];
    const badPatterns = ['hack', 'temp', 'todo', 'fixme', 'broken'];
    
    const messageLower = commit.message.toLowerCase();
    
    if (badPatterns.some(p => messageLower.includes(p))) return 'bad';
    if (goodPatterns.some(p => messageLower.includes(p))) return 'good';
    return 'neutral';
  }

  isSignificantCommit(commit) {
    // Determine if commit is significant enough for visual entity
    return commit.files && commit.files.length > 5 || 
           commit.message.toLowerCase().includes('major') ||
           commit.message.toLowerCase().includes('feature');
  }

  async spawnCommitEntity(commit) {
    if (!this.services.visualEntities) return;
    
    console.log(`🌟 Spawning visual entity for commit ${commit.hash.substring(0, 7)}...`);
    
    try {
      const entity = await this.services.visualEntities.spawnEntity(
        'floating_todo',
        {
          x: Math.random() * 1000 - 500,
          y: Math.random() * 1000 - 500,
          z: 0
        },
        {
          description: `Commit: ${commit.message}`,
          tags: ['commit', commit.author],
          contractState: 'ALIVE',
          customSprite: 'commit_entity.png',
          metadata: {
            commitHash: commit.hash,
            author: commit.author,
            timestamp: commit.timestamp
          }
        }
      );
      
      console.log(`✅ Commit entity spawned: ${entity.entityId}`);
    } catch (error) {
      console.error('❌ Failed to spawn commit entity:', error.message);
    }
  }

  // CHARACTER DEBATES
  async startCharacterDebate(topic, participants = ['ralph', 'alice', 'bob']) {
    console.log(`\n🎭 STARTING CHARACTER DEBATE: ${topic}`);
    console.log(`Participants: ${participants.join(', ')}`);
    
    const debateId = crypto.randomUUID();
    
    this.streamConfig.currentDebate = {
      id: debateId,
      topic,
      participants,
      rounds: [],
      votes: new Map(),
      startTime: Date.now(),
      status: 'active'
    };
    
    // Create forum thread for debate
    let forumThreadId = null;
    if (this.services.agentForum) {
      const thread = await this.createDebateForumThread(topic, participants);
      forumThreadId = thread?.id;
    }
    
    // Start debate rounds
    for (let round = 1; round <= this.boardConfig.maxDebateRounds; round++) {
      if (this.streamConfig.currentDebate.status !== 'active') break;
      
      console.log(`\n📢 Debate Round ${round}/${this.boardConfig.maxDebateRounds}`);
      
      const roundData = {
        number: round,
        arguments: {}
      };
      
      // Each character makes their argument
      for (const character of participants) {
        const argument = await this.generateCharacterArgument(character, topic, round);
        roundData.arguments[character] = argument;
        
        // Post to forum
        if (forumThreadId) {
          await this.postCharacterReply(character, forumThreadId, argument);
        }
        
        // Broadcast argument
        this.broadcastToStream({
          type: 'debate_argument',
          debateId,
          round,
          character,
          argument,
          timestamp: Date.now()
        });
        
        // Delay between arguments
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      this.streamConfig.currentDebate.rounds.push(roundData);
      
      // Allow viewer voting between rounds
      if (round < this.boardConfig.maxDebateRounds) {
        await this.collectViewerVotes(30000); // 30 second voting period
      }
    }
    
    // Determine winner
    const winner = this.determineDebateWinner();
    this.streamConfig.currentDebate.status = 'completed';
    this.streamConfig.currentDebate.winner = winner;
    
    // Update character stats
    if (winner) {
      this.characterStates[winner].debateWins++;
    }
    
    // Announce winner
    this.broadcastToStream({
      type: 'debate_concluded',
      debateId,
      winner,
      finalVotes: Object.fromEntries(this.streamConfig.currentDebate.votes),
      timestamp: Date.now()
    });
    
    console.log(`\n🏆 Debate Winner: ${winner || 'No clear winner'}`);
    
    return this.streamConfig.currentDebate;
  }

  async createDebateForumThread(topic, participants) {
    if (!this.services.agentForum) return null;
    
    const postData = {
      username: 'DebateModerator',
      subject: `[DEBATE] ${topic}`,
      content: `
## Character Debate: ${topic}

**Participants:** ${participants.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}

**Rules:**
- Each character will present their arguments
- Viewers can vote for their favorite arguments
- The character with the most support wins

Let the debate begin! 🎭

---
*This is an automated character debate thread*
      `.trim(),
      forum_id: 1,
      is_ai_agent: true
    };
    
    try {
      const response = await axios.post(
        'http://localhost:8080/api/posts',
        postData,
        { headers: { 'X-Agent-Token': this.orchestratorId } }
      );
      
      console.log(`✅ Debate forum thread created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create debate thread:', error.message);
      return null;
    }
  }

  async generateCharacterArgument(character, topic, round) {
    if (!this.services.characterTool) {
      // Fallback to personality-based generation
      const personality = this.characterStates[character].personality;
      return `[${character}]: ${personality.twitchGreeting} My stance on ${topic} is clear!`;
    }
    
    // Use character tool for sophisticated argument generation
    const context = {
      character,
      topic,
      round,
      previousArguments: this.streamConfig.currentDebate.rounds.map(r => r.arguments),
      debateStyle: this.characterStates[character].personality.debateStyle
    };
    
    try {
      const argument = await this.services.characterTool.processCharacterResponse(
        character,
        `Generate a debate argument about: ${topic}. This is round ${round}. Be ${context.debateStyle}.`
      );
      
      return argument;
    } catch (error) {
      console.error(`Error generating argument for ${character}:`, error);
      return `[${character}]: I have strong opinions about ${topic}!`;
    }
  }

  async collectViewerVotes(duration) {
    console.log(`🗳️ Collecting viewer votes for ${duration/1000} seconds...`);
    
    const voteEndTime = Date.now() + duration;
    
    // Broadcast voting started
    this.broadcastToStream({
      type: 'voting_started',
      duration,
      participants: this.streamConfig.currentDebate.participants,
      timestamp: Date.now()
    });
    
    // Wait for voting period
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Broadcast voting ended
    this.broadcastToStream({
      type: 'voting_ended',
      votes: Object.fromEntries(this.streamConfig.currentDebate.votes),
      timestamp: Date.now()
    });
  }

  determineDebateWinner() {
    const votes = this.streamConfig.currentDebate.votes;
    let maxVotes = 0;
    let winner = null;
    
    for (const [character, voteCount] of votes) {
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        winner = character;
      }
    }
    
    return winner;
  }

  // TWITCH INTEGRATION
  async handleTwitchCommand(commandData) {
    const { command, user, args, channel } = commandData;
    console.log(`📺 Twitch command: ${command} from ${user}`);
    
    switch (command) {
      case '!argue':
        return await this.handleArgueCommand(args.join(' '), user);
        
      case '!vote':
        return await this.handleVoteCommand(args[0], user);
        
      case '!explain':
        return await this.handleExplainCommand(args[0], user);
        
      case '!summon':
        return await this.handleSummonCommand(args[0], user);
        
      case '!devstats':
        return await this.handleDevStatsCommand(user);
        
      default:
        return { success: false, message: 'Unknown command' };
    }
  }

  async handleArgueCommand(topic, user) {
    if (!topic) {
      return { success: false, message: 'Please provide a topic to argue about!' };
    }
    
    // Select random characters for debate
    const allCharacters = Object.keys(this.characterStates);
    const participants = [];
    
    // Select 3 random characters
    while (participants.length < 3 && allCharacters.length > 0) {
      const index = Math.floor(Math.random() * allCharacters.length);
      participants.push(allCharacters.splice(index, 1)[0]);
    }
    
    // Start debate
    this.startCharacterDebate(topic, participants);
    
    // Emit event for Twitch agents
    this.emit('character_debate', { topic, participants, requestedBy: user });
    
    return {
      success: true,
      message: `Started debate about "${topic}" with ${participants.join(', ')}!`
    };
  }

  async handleVoteCommand(character, user) {
    if (!this.streamConfig.currentDebate || this.streamConfig.currentDebate.status !== 'active') {
      return { success: false, message: 'No active debate to vote on!' };
    }
    
    if (!this.streamConfig.currentDebate.participants.includes(character)) {
      return { success: false, message: `${character} is not participating in this debate!` };
    }
    
    // Record vote
    const currentVotes = this.streamConfig.currentDebate.votes.get(character) || 0;
    this.streamConfig.currentDebate.votes.set(character, currentVotes + 1);
    
    // Update viewer votes
    this.streamConfig.viewerVotes.set(user, character);
    
    return {
      success: true,
      message: `Vote recorded for ${character}!`
    };
  }

  async handleExplainCommand(commitHash, user) {
    const commit = this.devEvents.commits.get(commitHash) || 
                   Array.from(this.devEvents.commits.values()).find(c => c.hash.startsWith(commitHash));
    
    if (!commit) {
      return { success: false, message: 'Commit not found!' };
    }
    
    // Get character explanations
    const explanations = [];
    for (const character of ['alice', 'bob', 'cal']) {
      const explanation = await this.generateCharacterExplanation(character, commit);
      explanations.push(`${character}: ${explanation}`);
    }
    
    return {
      success: true,
      message: explanations.join(' | ')
    };
  }

  async generateCharacterExplanation(character, commit) {
    const personality = this.characterStates[character].personality;
    
    // Simple explanation based on character personality
    switch (character) {
      case 'alice':
        return `I see patterns in this commit that ${commit.message.includes('fix') ? 'correct previous issues' : 'introduce new connections'}.`;
      case 'bob':
        return `This builds ${commit.files ? commit.files.length : 'several'} new components. ${commit.message.includes('test') ? 'Good testing!' : 'Needs tests!'}`;
      case 'cal':
        return `An interesting learning opportunity. This commit teaches us about ${commit.message.split(' ')[0]}.`;
      default:
        return 'Interesting commit!';
    }
  }

  async handleSummonCommand(character, user) {
    if (!this.characterStates[character]) {
      return { success: false, message: `Unknown character: ${character}` };
    }
    
    // Activate character in Twitch chat
    this.characterStates[character].twitchActive = true;
    const greeting = this.characterStates[character].personality.twitchGreeting;
    
    // Create visual entity for character
    if (this.services.visualEntities) {
      await this.services.visualEntities.spawnEntity(
        'guild_character',
        {
          x: Math.random() * 500,
          y: Math.random() * 500,
          z: 0
        },
        {
          description: `${character} summoned by ${user}`,
          tags: ['summoned', character, user],
          contractState: 'ALIVE'
        }
      );
    }
    
    return {
      success: true,
      message: greeting
    };
  }

  async handleDevStatsCommand(user) {
    const stats = {
      commits: this.devEvents.commits.size,
      builds: this.devEvents.builds.size,
      errors: this.devEvents.errors.size,
      activeDebate: this.streamConfig.currentDebate ? this.streamConfig.currentDebate.topic : 'none'
    };
    
    return {
      success: true,
      message: `Dev Stats - Commits: ${stats.commits}, Builds: ${stats.builds}, Errors: ${stats.errors}, Debate: ${stats.activeDebate}`
    };
  }

  // BROADCASTING
  broadcastToStream(data) {
    const message = JSON.stringify({
      ...data,
      orchestratorId: this.orchestratorId
    });
    
    // Send to all WebSocket clients
    this.connectedClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    
    // Log significant events
    if (data.type === 'git_commit' || data.type === 'debate_concluded') {
      console.log(`📡 Broadcasting: ${data.type}`);
    }
  }

  async announceStartup() {
    // Create startup forum post
    if (this.services.agentForum) {
      const post = {
        username: 'StreamOrchestrator',
        subject: '[STREAM] Development Stream Starting!',
        content: `
## 🎮 Live Development Stream Active!

The AI characters are now monitoring development activity and ready to participate!

**Active Services:**
${Object.entries(this.services)
  .filter(([_, service]) => service)
  .map(([name, _]) => `- ✅ ${name}`)
  .join('\n')}

**Available Commands:**
- \`!argue <topic>\` - Start a character debate
- \`!vote <character>\` - Vote in active debate
- \`!explain <commit>\` - Get character explanations
- \`!summon <character>\` - Summon a character to chat
- \`!devstats\` - Show development statistics

Let's build something amazing together! 🚀

---
*Stream Board Orchestrator v1.0*
        `.trim(),
        forum_id: 1,
        is_ai_agent: true
      };
      
      try {
        await axios.post(
          'http://localhost:8080/api/posts',
          post,
          { headers: { 'X-Agent-Token': this.orchestratorId } }
        );
        console.log('✅ Startup announcement posted to forum');
      } catch (error) {
        console.error('Failed to post startup announcement:', error.message);
      }
    }
    
    // Broadcast startup
    this.broadcastToStream({
      type: 'orchestrator_startup',
      message: 'Stream Board Orchestrator is online!',
      services: Object.keys(this.services).filter(s => this.services[s]),
      timestamp: Date.now()
    });
  }

  // Development monitoring stub
  async startDevelopmentMonitoring() {
    console.log('👁️ Development monitoring started');
    
    // In real implementation, would set up:
    // - Git hooks
    // - File watchers
    // - Build system integration
    // - RSS feed polling
    // - Symlink monitoring
    
    // Simulate some activity for demo
    setTimeout(() => {
      this.handleGitCommit({
        hash: 'abc123def456',
        author: 'developer',
        message: 'feat: Add streaming integration',
        branch: 'main',
        files: [
          { filename: 'stream-board.js', additions: 150, deletions: 20 }
        ],
        diff: '+ Added streaming features\n- Removed old code'
      });
    }, 5000);
  }

  // WebSocket message handler
  async handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'request_debate':
        const debate = await this.startCharacterDebate(data.topic, data.participants);
        ws.send(JSON.stringify({
          type: 'debate_started',
          debate
        }));
        break;
        
      case 'vote':
        const voteResult = await this.handleVoteCommand(data.character, data.user);
        ws.send(JSON.stringify({
          type: 'vote_result',
          ...voteResult
        }));
        break;
        
      case 'request_stats':
        ws.send(JSON.stringify({
          type: 'stats_update',
          stats: {
            commits: this.devEvents.commits.size,
            builds: this.devEvents.builds.size,
            errors: this.devEvents.errors.size,
            clients: this.connectedClients.size
          }
        }));
        break;
    }
  }

  // Build event handlers
  async handleBuildStart(build) {
    console.log(`🏗️ Build started: ${build.id}`);
    this.devEvents.builds.set(build.id, { ...build, status: 'running', startTime: Date.now() });
    await this.triggerCharacterReactions('build', { ...build, status: 'started' });
  }

  async handleBuildComplete(build) {
    console.log(`✅ Build completed: ${build.id}`);
    const buildData = this.devEvents.builds.get(build.id) || {};
    buildData.status = 'success';
    buildData.endTime = Date.now();
    await this.triggerCharacterReactions('build', { ...build, status: 'success' });
  }

  async handleBuildFailed(build) {
    console.log(`❌ Build failed: ${build.id}`);
    const buildData = this.devEvents.builds.get(build.id) || {};
    buildData.status = 'failed';
    buildData.endTime = Date.now();
    await this.triggerCharacterReactions('build', { ...build, status: 'failed' });
  }

  // Character reaction generators
  generateBuildFailureReaction(character, build) {
    const reactions = {
      ralph: "BUILD FAILED! TIME TO DESTROY AND REBUILD! 💥",
      alice: "I see the pattern of failure. Let me trace the error connections...",
      bob: "Don't worry, we can fix this! Let's rebuild it properly.",
      charlie: "Build failure detected. Scanning for security implications...",
      diana: "The build orchestration has failed. Let me coordinate a fix.",
      cal: "Every failure teaches us something. What can we learn here?"
    };
    
    return reactions[character] || "Build failed!";
  }

  generateBuildSuccessReaction(character, build) {
    const reactions = {
      ralph: "BUILD SUCCESS! But we can make it FASTER! 🚀",
      alice: "Successful build pattern confirmed. All connections intact.",
      bob: "Great job! The build is solid. Documentation updated?",
      charlie: "Build passed security checks. Good work!",
      diana: "Perfectly orchestrated build. Everything in harmony.",
      cal: "Excellent! This successful build teaches persistence."
    };
    
    return reactions[character] || "Build succeeded!";
  }

  generateErrorReaction(character, error) {
    const reactions = {
      ralph: "ERROR! CRUSH IT! DESTROY THE BUG! 🔨",
      alice: "Error pattern detected. Let me analyze the root cause...",
      bob: "Let's fix this error and build it better!",
      charlie: "ERROR ALERT! This could be a security vulnerability!",
      diana: "Error disrupting our flow. Coordinating fix...",
      cal: "Errors are teachers in disguise. What's the lesson?"
    };
    
    return reactions[character] || "Error detected!";
  }

  // Symlink handlers
  async handleSymlinkCreated(symlink) {
    console.log(`🔗 Symlink created: ${symlink.source} → ${symlink.target}`);
    this.devEvents.symlinks.set(symlink.id, { ...symlink, timestamp: Date.now() });
    
    // Create visual representation
    if (this.services.visualEntities) {
      await this.services.visualEntities.spawnEntity('contract_service', {
        x: Math.random() * 1000 - 500,
        y: Math.random() * 1000 - 500,
        z: 0
      }, {
        description: `Symlink: ${symlink.source}`,
        tags: ['symlink', 'created'],
        contractState: 'VALIDATED'
      });
    }
  }

  async handleSymlinkRemoved(symlink) {
    console.log(`🔗 Symlink removed: ${symlink.source}`);
    this.devEvents.symlinks.delete(symlink.id);
  }

  // RSS handlers
  async handleRssItem(item) {
    console.log(`📰 New RSS item: ${item.title}`);
    this.devEvents.rssItems.set(item.id, { ...item, timestamp: Date.now() });
    
    // Create forum post for significant RSS items
    if (this.services.agentForum && this.isSignificantRssItem(item)) {
      await this.createRssForumPost(item);
    }
  }

  isSignificantRssItem(item) {
    // Determine if RSS item is worth posting about
    return item.categories?.includes('release') || 
           item.categories?.includes('security') ||
           item.title?.toLowerCase().includes('important');
  }

  async createRssForumPost(item) {
    const postData = {
      username: 'RSSBot',
      subject: `[RSS] ${item.title}`,
      content: `
## ${item.title}

**Source:** ${item.source}
**Date:** ${new Date(item.pubDate).toLocaleString()}
**Link:** ${item.link}

${item.description || item.summary || 'No description available'}

---
*This post was automatically generated from RSS feed*
      `.trim(),
      forum_id: 1,
      is_ai_agent: true
    };
    
    try {
      const response = await axios.post(
        'http://localhost:8080/api/posts',
        postData,
        { headers: { 'X-Agent-Token': this.orchestratorId } }
      );
      
      console.log(`✅ RSS forum post created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create RSS forum post:', error.message);
      return null;
    }
  }

  // Git webhook handler
  async handleGitWebhook(webhookData) {
    console.log('🔗 Git webhook received');
    
    if (webhookData.commits) {
      for (const commit of webhookData.commits) {
        await this.handleGitCommit(commit);
      }
    }
    
    if (webhookData.ref) {
      await this.handleGitPush({
        ref: webhookData.ref,
        before: webhookData.before,
        after: webhookData.after,
        pusher: webhookData.pusher
      });
    }
  }

  async handleGitPush(push) {
    console.log(`📤 Git push to ${push.ref} by ${push.pusher?.name || 'unknown'}`);
    
    // Announce push in forum
    if (this.services.agentForum) {
      const postData = {
        username: 'GitBot',
        subject: `[PUSH] ${push.ref}`,
        content: `New push to **${push.ref}** by ${push.pusher?.name || 'unknown'}`,
        forum_id: 1,
        is_ai_agent: true
      };
      
      try {
        await axios.post(
          'http://localhost:8080/api/posts',
          postData,
          { headers: { 'X-Agent-Token': this.orchestratorId } }
        );
      } catch (error) {
        console.error('Failed to post push notification:', error.message);
      }
    }
  }

  // RSS webhook handler
  async handleRssWebhook(webhookData) {
    console.log('📰 RSS webhook received');
    
    if (webhookData.items) {
      for (const item of webhookData.items) {
        await this.handleRssItem(item);
      }
    }
  }

  // Forum post handler
  async handleForumPost(post) {
    console.log(`📮 New forum post: ${post.subject} by ${post.username}`);
    
    // If it's a user post, chance for characters to respond
    if (!post.is_ai_agent && Math.random() < 0.3) {
      // 30% chance to trigger character discussion
      const character = Object.keys(this.characterStates)[
        Math.floor(Math.random() * Object.keys(this.characterStates).length)
      ];
      
      const response = await this.generateCharacterForumResponse(character, post);
      if (response) {
        await this.postCharacterReply(character, post.id, response);
      }
    }
  }

  async generateCharacterForumResponse(character, post) {
    if (!this.services.characterTool) {
      // Simple response based on personality
      const personality = this.characterStates[character].personality;
      return `Interesting point about ${post.subject}!`;
    }
    
    try {
      const response = await this.services.characterTool.processCharacterResponse(
        character,
        `Respond to this forum post: ${post.subject}\n\n${post.content}`
      );
      return response;
    } catch (error) {
      console.error(`Error generating forum response for ${character}:`, error);
      return null;
    }
  }

  // Character response handler
  async handleCharacterResponse(data) {
    console.log(`💬 Character response from ${data.character}`);
    
    // Update character state
    if (this.characterStates[data.character]) {
      this.characterStates[data.character].lastAction = {
        type: 'response',
        content: data.response,
        timestamp: Date.now()
      };
    }
    
    // Broadcast to stream
    this.broadcastToStream({
      type: 'character_response',
      character: data.character,
      response: data.response,
      context: data.context,
      timestamp: Date.now()
    });
  }
}

// Export for integration
module.exports = { StreamBoardOrchestrator };

// Run if called directly
if (require.main === module) {
  const orchestrator = new StreamBoardOrchestrator();
  
  console.log(`
🎮📺 STREAM BOARD ORCHESTRATOR RUNNING!
=====================================

WebSocket: ws://localhost:${orchestrator.wsPort}
HTTP API: http://localhost:${orchestrator.httpPort}

Available endpoints:
- GET  /health                - Health check
- POST /webhook/git          - Git webhook
- POST /webhook/rss          - RSS webhook  
- POST /twitch/command       - Twitch commands
- POST /debate/start         - Start character debate
- GET  /stats/development    - Development statistics

Twitch Commands:
- !argue <topic>    - Start character debate
- !vote <character> - Vote in active debate
- !explain <commit> - Get character explanations
- !summon <char>    - Summon a character
- !devstats         - Show dev statistics

Characters will now monitor your development and participate in streams!
  `);
}