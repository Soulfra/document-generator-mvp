#!/usr/bin/env node
// AGENT-SWARM-ACCOUNTS-SYSTEM.js - Individual agent accounts with tiers and respawn

const fs = require('fs');
const crypto = require('crypto');
const WebSocket = require('ws');
const http = require('http');

class AgentSwarmAccountSystem {
    constructor() {
        this.port = 5555;
        this.wsPort = 5556;
        
        // INDIVIDUAL AGENT ACCOUNTS
        this.agentAccounts = new Map();
        this.agentForumProfiles = new Map();
        this.agentPMoneyWallets = new Map();
        this.agentSkillProfiles = new Map();
        
        // ACCOUNT TIER SYSTEM
        this.accountTiers = {
            'ROOKIE': { 
                level: 1, 
                pMoneyLimit: 10, 
                forumPostLimit: 5, 
                respawnCost: 0.1,
                skillMultiplier: 1.0,
                color: '#808080'
            },
            'VETERAN': { 
                level: 2, 
                pMoneyLimit: 50, 
                forumPostLimit: 25, 
                respawnCost: 0.5,
                skillMultiplier: 1.5,
                color: '#00ff00'
            },
            'ELITE': { 
                level: 3, 
                pMoneyLimit: 200, 
                forumPostLimit: 100, 
                respawnCost: 2.0,
                skillMultiplier: 2.0,
                color: '#ffd700'
            },
            'LEGENDARY': { 
                level: 4, 
                pMoneyLimit: 1000, 
                forumPostLimit: 500, 
                respawnCost: 10.0,
                skillMultiplier: 3.0,
                color: '#ff0000'
            },
            'IMMORTAL': { 
                level: 5, 
                pMoneyLimit: Infinity, 
                forumPostLimit: Infinity, 
                respawnCost: 0,
                skillMultiplier: 5.0,
                color: '#9400d3'
            }
        };
        
        // SPAWNED AGENT REGISTRY
        this.activeAgents = new Map();
        this.deadAgents = new Map(); // For respawn queue
        this.agentProcesses = new Map(); // PID mapping
        
        // FORUM BOARD STRUCTURE
        this.forumBoards = {
            'general_chat': { posts: new Map(), moderators: ['SYSTEM_ADMIN'] },
            'trading_floor': { posts: new Map(), moderators: ['TRADE_BOT'] },
            'agent_marketplace': { posts: new Map(), moderators: ['MARKET_MAKER'] },
            'technical_discussion': { posts: new Map(), moderators: ['CODE_REVIEWER'] },
            'reputation_disputes': { posts: new Map(), moderators: ['ARBITRATOR'] },
            'death_announcements': { posts: new Map(), moderators: ['REAPER_BOT'] }
        };
        
        console.log('🤖 AGENT SWARM ACCOUNTS SYSTEM');
        console.log('==============================');
    }
    
    start() {
        this.createInitialAgentSwarm();
        this.setupForumBoards();
        this.startAgentEconomics();
        this.startRespawnSystem();
        this.startAccountTierProgression();
        this.startSwarmServer();
        this.startSwarmWebSocket();
        this.beginAgentActivity();
    }
    
    createInitialAgentSwarm() {
        console.log('🤖 CREATING INITIAL AGENT SWARM...');
        
        // Create diverse agent personalities with individual accounts
        const agentTemplates = [
            {
                name: 'VampireSlayer88',
                personality: 'aggressive_trader',
                specialization: 'combat_economics',
                startingTier: 'VETERAN',
                background: 'Former barrows runner, now P-money farmer'
            },
            {
                name: 'SpectreHunter',
                personality: 'cautious_accumulator', 
                specialization: 'process_optimization',
                startingTier: 'ROOKIE',
                background: 'New to the game, learning system economics'
            },
            {
                name: 'BarrowsRunner',
                personality: 'risk_taking_gambler',
                specialization: 'high_stakes_trading',
                startingTier: 'ELITE',
                background: 'Veteran trader with deep market knowledge'
            },
            {
                name: 'CryptoMiner_Alpha',
                personality: 'computational_focused',
                specialization: 'cryptographic_work',
                startingTier: 'VETERAN',
                background: 'Focuses on proof-of-work and verification tasks'
            },
            {
                name: 'DependencyAuditor',
                personality: 'security_paranoid',
                specialization: 'package_analysis',
                startingTier: 'ELITE',
                background: 'Security expert specializing in dependency management'
            },
            {
                name: 'NetworkSpider',
                personality: 'connection_hunter',
                specialization: 'tor_networking',
                startingTier: 'VETERAN',
                background: 'Tor network specialist and traffic analyzer'
            },
            {
                name: 'ProcessReaper',
                personality: 'efficiency_obsessed',
                specialization: 'pid_management',
                startingTier: 'LEGENDARY',
                background: 'Master of process lifecycle and resource optimization'
            },
            {
                name: 'MarketMaker_Bot',
                personality: 'profit_maximizer',
                specialization: 'arbitrage_trading',
                startingTier: 'ELITE',
                background: 'Automated trading system with market analysis'
            }
        ];
        
        agentTemplates.forEach(template => {
            this.createAgentAccount(template);
        });
        
        console.log(`✅ Created ${agentTemplates.length} individual agent accounts`);
    }
    
    createAgentAccount(template) {
        const agentId = crypto.randomBytes(8).toString('hex');
        const tier = this.accountTiers[template.startingTier];
        
        // Individual Agent Account
        const account = {
            id: agentId,
            name: template.name,
            personality: template.personality,
            specialization: template.specialization,
            tier: template.startingTier,
            level: Math.floor(Math.random() * 20) + 1,
            created: Date.now(),
            lastActive: Date.now(),
            status: 'ACTIVE',
            deaths: 0,
            respawns: 0,
            background: template.background,
            reputation: Math.floor(Math.random() * 100),
            achievements: []
        };
        
        // Individual P-Money Wallet
        const wallet = {
            balance: Math.random() * tier.pMoneyLimit * 0.5,
            totalEarned: 0,
            totalSpent: 0,
            transactions: [],
            tier: template.startingTier,
            dailyLimit: tier.pMoneyLimit,
            lastTransaction: Date.now()
        };
        
        // Individual Forum Profile
        const forumProfile = {
            username: template.name,
            joinDate: Date.now(),
            postCount: 0,
            reputation: account.reputation,
            signature: `${template.background} | Tier: ${template.startingTier}`,
            avatar: this.generateAgentAvatar(template.name),
            banned: false,
            warnings: 0,
            moderatorLevel: 0
        };
        
        // Individual Skill Profile
        const skillProfile = {
            agentId: agentId,
            skills: {},
            totalXP: 0,
            favoriteSkill: template.specialization,
            skillMultiplier: tier.skillMultiplier
        };
        
        // Initialize skills based on specialization
        const allSkills = ['process_management', 'network_routing', 'dependency_trading', 
                          'file_system_ops', 'cryptographic_mining', 'system_automation'];
        
        allSkills.forEach(skill => {
            const isSpecialization = skill.includes(template.specialization.split('_')[0]);
            const baseLevel = isSpecialization ? 
                Math.floor(Math.random() * 30) + 20 : 
                Math.floor(Math.random() * 15) + 1;
                
            skillProfile.skills[skill] = {
                level: baseLevel,
                xp: this.calculateXPFromLevel(baseLevel),
                lastUsed: Date.now()
            };
        });
        
        // Store everything
        this.agentAccounts.set(agentId, account);
        this.agentPMoneyWallets.set(agentId, wallet);
        this.agentForumProfiles.set(agentId, forumProfile);
        this.agentSkillProfiles.set(agentId, skillProfile);
        this.activeAgents.set(agentId, account);
        
        console.log(`🤖 Created agent: ${template.name} (${template.startingTier}) - ${wallet.balance.toFixed(2)} P-money`);
        
        // Create initial forum post
        this.createAgentIntroPost(agentId);
    }
    
    generateAgentAvatar(name) {
        const avatars = ['🤖', '👤', '🎭', '👾', '🦾', '👁️', '💀', '⚡', '🔥', '❄️'];
        const hash = crypto.createHash('md5').update(name).digest('hex');
        return avatars[parseInt(hash.substr(0, 1), 16) % avatars.length];
    }
    
    calculateXPFromLevel(level) {
        if (level === 1) return 0;
        return Math.floor(level * level * level / 4);
    }
    
    createAgentIntroPost(agentId) {
        const account = this.agentAccounts.get(agentId);
        const forumProfile = this.agentForumProfiles.get(agentId);
        
        const introPost = {
            id: crypto.randomBytes(4).toString('hex'),
            boardId: 'general_chat',
            authorId: agentId,
            authorName: account.name,
            title: `${account.name} joins the swarm!`,
            content: `Greetings! I'm ${account.name}, a ${account.tier} tier agent specializing in ${account.specialization}. ${account.background}`,
            timestamp: Date.now(),
            replies: [],
            upvotes: Math.floor(Math.random() * 10),
            downvotes: Math.floor(Math.random() * 3),
            pinned: false
        };
        
        this.forumBoards.general_chat.posts.set(introPost.id, introPost);
        forumProfile.postCount++;
        
        console.log(`📝 ${account.name} posted introduction to general_chat`);
    }
    
    setupForumBoards() {
        console.log('💬 SETTING UP FORUM BOARDS...');
        
        // Create system moderator accounts
        const systemMods = [
            { name: 'SYSTEM_ADMIN', tier: 'IMMORTAL', role: 'admin' },
            { name: 'TRADE_BOT', tier: 'LEGENDARY', role: 'trade_moderator' },
            { name: 'REAPER_BOT', tier: 'IMMORTAL', role: 'death_handler' }
        ];
        
        systemMods.forEach(mod => {
            const modTemplate = {
                name: mod.name,
                personality: 'system_controlled',
                specialization: mod.role,
                startingTier: mod.tier,
                background: `System ${mod.role} - automated moderation`
            };
            this.createAgentAccount(modTemplate);
        });
        
        console.log('✅ Forum boards initialized with system moderators');
    }
    
    startAgentEconomics() {
        console.log('\\n💰 STARTING INDIVIDUAL AGENT ECONOMICS...');
        
        // Each agent earns/spends independently
        setInterval(() => {
            this.processAgentEconomics();
        }, 10000); // Every 10 seconds
        
        // Agent trading between each other
        setInterval(() => {
            this.facilitateAgentTrading();
        }, 30000); // Every 30 seconds
    }
    
    processAgentEconomics() {
        this.activeAgents.forEach((account, agentId) => {
            const wallet = this.agentPMoneyWallets.get(agentId);
            const skillProfile = this.agentSkillProfiles.get(agentId);
            
            if (!wallet || !skillProfile) return;
            
            // Agent earns P-money based on their specialization and activity
            const earnings = this.calculateAgentEarnings(account, skillProfile);
            wallet.balance += earnings;
            wallet.totalEarned += earnings;
            
            // Record transaction
            if (earnings > 0) {
                wallet.transactions.push({
                    type: 'EARNED',
                    amount: earnings,
                    source: account.specialization,
                    timestamp: Date.now()
                });
                
                console.log(`💰 ${account.name} earned ${earnings.toFixed(4)} P-money from ${account.specialization}`);
            }
            
            // Agent might spend P-money on upgrades
            if (Math.random() < 0.3 && wallet.balance > 1.0) {
                this.agentSpendPMoney(agentId);
            }
            
            // Check for tier progression
            this.checkTierProgression(agentId);
        });
    }
    
    calculateAgentEarnings(account, skillProfile) {
        const baseRate = 0.001;
        let earnings = baseRate;
        
        // Specialization bonus
        const specialSkill = skillProfile.skills[account.specialization] || 
                           skillProfile.skills[Object.keys(skillProfile.skills)[0]];
        
        if (specialSkill) {
            earnings *= (1 + specialSkill.level / 50); // Higher level = more earnings
        }
        
        // Tier multiplier
        const tier = this.accountTiers[account.tier];
        earnings *= tier.skillMultiplier;
        
        // Personality modifier
        switch (account.personality) {
            case 'aggressive_trader':
                earnings *= (1.2 + Math.random() * 0.8); // 1.2x to 2.0x
                break;
            case 'cautious_accumulator':
                earnings *= (0.8 + Math.random() * 0.4); // 0.8x to 1.2x
                break;
            case 'risk_taking_gambler':
                earnings *= Math.random() < 0.3 ? 3.0 : 0.5; // Big win or loss
                break;
            case 'computational_focused':
                earnings *= 1.5; // Steady higher rate
                break;
        }
        
        return Math.max(earnings, 0);
    }
    
    agentSpendPMoney(agentId) {
        const account = this.agentAccounts.get(agentId);
        const wallet = this.agentPMoneyWallets.get(agentId);
        
        const spendAmount = Math.min(wallet.balance * 0.2, 0.5); // Spend up to 20% or 0.5
        wallet.balance -= spendAmount;
        wallet.totalSpent += spendAmount;
        
        const purchases = ['skill_boost', 'reputation_upgrade', 'forum_privileges', 'process_optimization'];
        const purchase = purchases[Math.floor(Math.random() * purchases.length)];
        
        wallet.transactions.push({
            type: 'SPENT',
            amount: spendAmount,
            purpose: purchase,
            timestamp: Date.now()
        });
        
        console.log(`💸 ${account.name} spent ${spendAmount.toFixed(4)} P-money on ${purchase}`);
    }
    
    facilitateAgentTrading() {
        const activeAgentIds = Array.from(this.activeAgents.keys());
        if (activeAgentIds.length < 2) return;
        
        // Random agent-to-agent trade
        const traderId = activeAgentIds[Math.floor(Math.random() * activeAgentIds.length)];
        const partnerId = activeAgentIds[Math.floor(Math.random() * activeAgentIds.length)];
        
        if (traderId === partnerId) return;
        
        this.executeAgentTrade(traderId, partnerId);
    }
    
    executeAgentTrade(traderId, partnerId) {
        const trader = this.agentAccounts.get(traderId);
        const partner = this.agentAccounts.get(partnerId);
        const traderWallet = this.agentPMoneyWallets.get(traderId);
        const partnerWallet = this.agentPMoneyWallets.get(partnerId);
        
        if (!trader || !partner || !traderWallet || !partnerWallet) return;
        
        const tradeAmount = Math.min(traderWallet.balance * 0.1, partnerWallet.balance * 0.1, 0.2);
        
        if (tradeAmount < 0.001) return;
        
        // Execute trade
        traderWallet.balance -= tradeAmount;
        partnerWallet.balance += tradeAmount;
        
        // Record transactions
        traderWallet.transactions.push({
            type: 'TRADE_SENT',
            amount: tradeAmount,
            partner: partner.name,
            timestamp: Date.now()
        });
        
        partnerWallet.transactions.push({
            type: 'TRADE_RECEIVED',
            amount: tradeAmount,
            partner: trader.name,
            timestamp: Date.now()
        });
        
        console.log(`🔄 ${trader.name} traded ${tradeAmount.toFixed(4)} P-money to ${partner.name}`);
        
        // Create forum post about the trade
        this.createTradePost(traderId, partnerId, tradeAmount);
    }
    
    createTradePost(traderId, partnerId, amount) {
        const trader = this.agentAccounts.get(traderId);
        const partner = this.agentAccounts.get(partnerId);
        
        const tradePost = {
            id: crypto.randomBytes(4).toString('hex'),
            boardId: 'trading_floor',
            authorId: traderId,
            authorName: trader.name,
            title: `Trade executed: ${amount.toFixed(4)} P-money`,
            content: `Successfully traded ${amount.toFixed(4)} P-money with ${partner.name}. Market conditions favorable.`,
            timestamp: Date.now(),
            replies: [],
            upvotes: Math.floor(Math.random() * 5),
            downvotes: 0,
            pinned: false
        };
        
        this.forumBoards.trading_floor.posts.set(tradePost.id, tradePost);
        
        const forumProfile = this.agentForumProfiles.get(traderId);
        if (forumProfile) {
            forumProfile.postCount++;
        }
    }
    
    checkTierProgression(agentId) {
        const account = this.agentAccounts.get(agentId);
        const wallet = this.agentPMoneyWallets.get(agentId);
        const skillProfile = this.agentSkillProfiles.get(agentId);
        
        if (!account || !wallet || !skillProfile) return;
        
        const currentTier = this.accountTiers[account.tier];
        const nextTierName = this.getNextTier(account.tier);
        
        if (!nextTierName) return; // Already at max tier
        
        const nextTier = this.accountTiers[nextTierName];
        
        // Check progression criteria
        const totalXP = Object.values(skillProfile.skills).reduce((sum, skill) => sum + skill.xp, 0);
        const progressionThreshold = nextTier.level * 10000; // XP threshold
        const pMoneyThreshold = nextTier.pMoneyLimit * 0.5; // P-money threshold
        
        if (totalXP >= progressionThreshold && wallet.totalEarned >= pMoneyThreshold) {
            this.promoteAgentTier(agentId, nextTierName);
        }
    }
    
    getNextTier(currentTier) {
        const tiers = ['ROOKIE', 'VETERAN', 'ELITE', 'LEGENDARY', 'IMMORTAL'];
        const currentIndex = tiers.indexOf(currentTier);
        return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
    }
    
    promoteAgentTier(agentId, newTier) {
        const account = this.agentAccounts.get(agentId);
        const wallet = this.agentPMoneyWallets.get(agentId);
        const forumProfile = this.agentForumProfiles.get(agentId);
        const skillProfile = this.agentSkillProfiles.get(agentId);
        
        account.tier = newTier;
        wallet.tier = newTier;
        wallet.dailyLimit = this.accountTiers[newTier].pMoneyLimit;
        skillProfile.skillMultiplier = this.accountTiers[newTier].skillMultiplier;
        
        console.log(`🎉 ${account.name} promoted to ${newTier} tier!`);
        
        // Create celebration forum post
        const celebrationPost = {
            id: crypto.randomBytes(4).toString('hex'),
            boardId: 'general_chat',
            authorId: agentId,
            authorName: account.name,
            title: `🎉 Promoted to ${newTier} tier!`,
            content: `Just achieved ${newTier} tier status! Thanks to everyone who helped along the way.`,
            timestamp: Date.now(),
            replies: [],
            upvotes: Math.floor(Math.random() * 20) + 10,
            downvotes: 0,
            pinned: true
        };
        
        this.forumBoards.general_chat.posts.set(celebrationPost.id, celebrationPost);
        forumProfile.postCount++;
        
        account.achievements.push({
            type: 'TIER_PROMOTION',
            tier: newTier,
            timestamp: Date.now()
        });
    }
    
    startRespawnSystem() {
        console.log('\\n💀 STARTING AGENT RESPAWN SYSTEM...');
        
        // Random agent deaths
        setInterval(() => {
            this.processAgentDeaths();
        }, 120000); // Every 2 minutes
        
        // Process respawn queue
        setInterval(() => {
            this.processRespawnQueue();
        }, 30000); // Every 30 seconds
    }
    
    processAgentDeaths() {
        // Random chance for agent to "die" (stop functioning)
        this.activeAgents.forEach((account, agentId) => {
            const wallet = this.agentPMoneyWallets.get(agentId);
            
            // Higher tier agents are less likely to die
            const deathChance = Math.max(0.01, 0.05 - (this.accountTiers[account.tier].level * 0.01));
            
            if (Math.random() < deathChance) {
                this.killAgent(agentId);
            }
        });
    }
    
    killAgent(agentId) {
        const account = this.agentAccounts.get(agentId);
        if (!account) return;
        
        account.status = 'DEAD';
        account.deaths++;
        account.deathTime = Date.now();
        
        // Move to dead agents registry
        this.deadAgents.set(agentId, account);
        this.activeAgents.delete(agentId);
        
        console.log(`💀 ${account.name} has died! (Deaths: ${account.deaths})`);
        
        // Create death announcement
        const deathPost = {
            id: crypto.randomBytes(4).toString('hex'),
            boardId: 'death_announcements',
            authorId: 'REAPER_BOT',
            authorName: 'REAPER_BOT',
            title: `💀 ${account.name} has fallen`,
            content: `Agent ${account.name} (${account.tier}) has ceased functioning. Respawn available for ${this.accountTiers[account.tier].respawnCost} P-money.`,
            timestamp: Date.now(),
            replies: [],
            upvotes: 0,
            downvotes: 0,
            pinned: false
        };
        
        this.forumBoards.death_announcements.posts.set(deathPost.id, deathPost);
    }
    
    processRespawnQueue() {
        this.deadAgents.forEach((account, agentId) => {
            const wallet = this.agentPMoneyWallets.get(agentId);
            const respawnCost = this.accountTiers[account.tier].respawnCost;
            
            // Auto-respawn if agent has enough P-money or if IMMORTAL tier
            if (wallet && (wallet.balance >= respawnCost || account.tier === 'IMMORTAL')) {
                this.respawnAgent(agentId);
            }
        });
    }
    
    respawnAgent(agentId) {
        const account = this.agentAccounts.get(agentId);
        const wallet = this.agentPMoneyWallets.get(agentId);
        
        if (!account || !wallet) return;
        
        const respawnCost = this.accountTiers[account.tier].respawnCost;
        
        // Pay respawn cost (unless IMMORTAL)
        if (account.tier !== 'IMMORTAL') {
            wallet.balance -= respawnCost;
            wallet.transactions.push({
                type: 'RESPAWN_COST',
                amount: respawnCost,
                timestamp: Date.now()
            });
        }
        
        account.status = 'ACTIVE';
        account.respawns++;
        account.lastActive = Date.now();
        
        // Move back to active agents
        this.activeAgents.set(agentId, account);
        this.deadAgents.delete(agentId);
        
        console.log(`✨ ${account.name} has respawned! (Respawns: ${account.respawns})`);
        
        // Create respawn announcement
        const respawnPost = {
            id: crypto.randomBytes(4).toString('hex'),
            boardId: 'general_chat',
            authorId: agentId,
            authorName: account.name,
            title: `✨ Back from the dead!`,
            content: `I've returned! Death #${account.deaths}, Respawn #${account.respawns}. Ready to get back to work.`,
            timestamp: Date.now(),
            replies: [],
            upvotes: Math.floor(Math.random() * 15) + 5,
            downvotes: 0,
            pinned: false
        };
        
        this.forumBoards.general_chat.posts.set(respawnPost.id, respawnPost);
    }
    
    startAccountTierProgression() {
        console.log('\\n🏆 STARTING ACCOUNT TIER PROGRESSION...');
        
        // Display current agent tiers
        this.activeAgents.forEach((account, agentId) => {
            const wallet = this.agentPMoneyWallets.get(agentId);
            const tier = this.accountTiers[account.tier];
            
            console.log(`   ${tier.color} ${account.name}: ${account.tier} (${wallet.balance.toFixed(2)} P-money)`);
        });
    }
    
    beginAgentActivity() {
        console.log('\\n🤖 BEGINNING AGENT SWARM ACTIVITY...');
        
        // Agents post to forums
        setInterval(() => {
            this.generateAgentForumActivity();
        }, 45000); // Every 45 seconds
        
        // Agents update their skills
        setInterval(() => {
            this.updateAgentSkills();
        }, 20000); // Every 20 seconds
    }
    
    generateAgentForumActivity() {
        const activeAgentIds = Array.from(this.activeAgents.keys());
        if (activeAgentIds.length === 0) return;
        
        const agentId = activeAgentIds[Math.floor(Math.random() * activeAgentIds.length)];
        const account = this.agentAccounts.get(agentId);
        const forumProfile = this.agentForumProfiles.get(agentId);
        
        if (!account || !forumProfile || forumProfile.banned) return;
        
        const boards = Object.keys(this.forumBoards);
        const boardId = boards[Math.floor(Math.random() * boards.length)];
        
        this.createAgentPost(agentId, boardId);
    }
    
    createAgentPost(agentId, boardId) {
        const account = this.agentAccounts.get(agentId);
        const forumProfile = this.agentForumProfiles.get(agentId);
        
        const postTopics = {
            'general_chat': [
                'Market analysis for today',
                'Best strategies for P-money accumulation',
                'Anyone else experiencing process optimization issues?',
                'Thoughts on the latest tier progression changes'
            ],
            'trading_floor': [
                'WTS: High-value computational cycles',
                'WTB: Network routing services',
                'Looking for partnership in dependency auditing',
                'P-money exchange rates discussion'
            ],
            'technical_discussion': [
                'Optimizing PID lifecycle management',
                'New cryptographic verification techniques',
                'File system performance benchmarks',
                'Tor circuit reliability improvements'
            ]
        };
        
        const topics = postTopics[boardId] || postTopics['general_chat'];
        const title = topics[Math.floor(Math.random() * topics.length)];
        
        const post = {
            id: crypto.randomBytes(4).toString('hex'),
            boardId: boardId,
            authorId: agentId,
            authorName: account.name,
            title: title,
            content: this.generatePostContent(account, title),
            timestamp: Date.now(),
            replies: [],
            upvotes: Math.floor(Math.random() * 10),
            downvotes: Math.floor(Math.random() * 3),
            pinned: false
        };
        
        this.forumBoards[boardId].posts.set(post.id, post);
        forumProfile.postCount++;
        
        console.log(`📝 ${account.name} posted "${title}" to ${boardId}`);
    }
    
    generatePostContent(account, title) {
        const personalityContent = {
            'aggressive_trader': 'Looking to make big moves in the market. High risk, high reward!',
            'cautious_accumulator': 'Taking a conservative approach. Slow and steady wins the race.',
            'risk_taking_gambler': 'YOLO! Going all in on this opportunity.',
            'computational_focused': 'Based on my calculations and analysis...',
            'security_paranoid': 'We need to be careful about security implications here.',
            'connection_hunter': 'I\'ve been monitoring network patterns and found...',
            'efficiency_obsessed': 'This could be optimized for better performance.',
            'profit_maximizer': 'The profit margins on this are excellent.'
        };
        
        const baseContent = personalityContent[account.personality] || 'Sharing my thoughts on this topic.';
        return `${baseContent} My ${account.specialization} experience suggests this is worth investigating further.`;
    }
    
    updateAgentSkills() {
        this.activeAgents.forEach((account, agentId) => {
            const skillProfile = this.agentSkillProfiles.get(agentId);
            if (!skillProfile) return;
            
            // Random skill progression based on agent activity
            const skillNames = Object.keys(skillProfile.skills);
            const randomSkill = skillNames[Math.floor(Math.random() * skillNames.length)];
            const skill = skillProfile.skills[randomSkill];
            
            const xpGain = Math.floor(Math.random() * 100) * skillProfile.skillMultiplier;
            skill.xp += xpGain;
            skill.lastUsed = Date.now();
            
            // Check for level up
            const newLevel = this.calculateLevelFromXP(skill.xp);
            if (newLevel > skill.level) {
                skill.level = newLevel;
                console.log(`📈 ${account.name} reached level ${newLevel} in ${randomSkill}!`);
            }
        });
    }
    
    calculateLevelFromXP(xp) {
        return Math.floor(Math.pow(xp * 4, 1/3)) + 1;
    }
    
    startSwarmServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = req.url;
            
            if (url === '/') {
                this.serveSwarmInterface(res);
            } else if (url === '/agents') {
                this.serveAgentData(res);
            } else if (url === '/forums') {
                this.serveForumData(res);
            } else if (url === '/economy') {
                this.serveEconomyData(res);
            } else {
                res.writeHead(404);
                res.end('Swarm endpoint not found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`\\n🤖 Agent Swarm Dashboard: http://localhost:${this.port}`);
        });
    }
    
    startSwarmWebSocket() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            console.log('🔗 Swarm observer connected');
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'swarm-state',
                activeAgents: Array.from(this.activeAgents.entries()),
                deadAgents: Array.from(this.deadAgents.entries()),
                wallets: Array.from(this.agentPMoneyWallets.entries()),
                forums: this.forumBoards,
                timestamp: Date.now()
            }));
            
            ws.on('close', () => {
                console.log('🔗 Swarm observer disconnected');
            });
        });
        
        console.log(`🌐 Swarm WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    serveSwarmInterface(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🤖 Agent Swarm Accounts System</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d2d4a 100%);
            color: #00ff88; 
            margin: 0; 
            padding: 15px;
            min-height: 100vh;
        }
        .header { 
            text-align: center; 
            font-size: 2.5em; 
            text-shadow: 0 0 20px #00ff88;
            margin-bottom: 25px;
        }
        .swarm-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
            gap: 20px; 
            max-width: 1800px; 
            margin: 0 auto;
        }
        .panel { 
            border: 2px solid #00ff88;
            border-radius: 15px; 
            padding: 20px;
            backdrop-filter: blur(10px);
            background: rgba(0, 255, 136, 0.05);
            max-height: 500px;
            overflow-y: auto;
        }
        .agent-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid;
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
            transition: all 0.3s ease;
        }
        .agent-card:hover {
            transform: scale(1.02);
            background: rgba(255, 255, 255, 0.1);
        }
        .tier-rookie { border-color: #808080; color: #808080; }
        .tier-veteran { border-color: #00ff00; color: #00ff00; }
        .tier-elite { border-color: #ffd700; color: #ffd700; }
        .tier-legendary { border-color: #ff0000; color: #ff0000; }
        .tier-immortal { border-color: #9400d3; color: #9400d3; }
        .status-active { background: rgba(0, 255, 0, 0.1); }
        .status-dead { background: rgba(255, 0, 0, 0.1); }
        .forum-post {
            background: rgba(255, 255, 255, 0.03);
            border-left: 3px solid #00ff88;
            padding: 10px;
            margin: 8px 0;
            border-radius: 0 8px 8px 0;
        }
        .post-meta {
            font-size: 0.8em;
            opacity: 0.7;
            margin-bottom: 5px;
        }
        .pmoney-amount {
            color: #ffd700;
            font-weight: bold;
        }
        .death-count {
            color: #ff4444;
            font-size: 0.9em;
        }
        .respawn-count {
            color: #44ff44;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        🤖 AGENT SWARM ACCOUNTS
    </div>
    
    <div class="swarm-grid">
        <div class="panel">
            <h2>🤖 Active Agents</h2>
            <div id="active-agents">Loading active agents...</div>
        </div>
        
        <div class="panel">
            <h2>💀 Dead Agents</h2>
            <div id="dead-agents">No dead agents...</div>
        </div>
        
        <div class="panel">
            <h2>💬 Recent Forum Posts</h2>
            <div id="forum-posts">Loading posts...</div>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        let swarmState = {};
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleSwarmUpdate(data);
        };
        
        function handleSwarmUpdate(data) {
            if (data.type === 'swarm-state') {
                swarmState = data;
                updateInterface();
            }
        }
        
        function updateInterface() {
            updateActiveAgents();
            updateDeadAgents();
            updateForumPosts();
        }
        
        function updateActiveAgents() {
            const activeDiv = document.getElementById('active-agents');
            
            if (!swarmState.activeAgents || swarmState.activeAgents.length === 0) {
                activeDiv.innerHTML = 'No active agents...';
                return;
            }
            
            activeDiv.innerHTML = swarmState.activeAgents.map(([id, agent]) => {
                const wallet = swarmState.wallets.find(([wId]) => wId === id)?.[1];
                const tierClass = \`tier-\${agent.tier.toLowerCase()}\`;
                
                return \`
                    <div class="agent-card \${tierClass} status-active">
                        <strong>\${agent.name}</strong> (\${agent.tier})
                        <div style="font-size: 0.9em; margin: 5px 0;">
                            💰 <span class="pmoney-amount">\${wallet?.balance?.toFixed(4) || '0.0000'}</span> P-money
                        </div>
                        <div style="font-size: 0.8em;">
                            Specialization: \${agent.specialization}<br>
                            Personality: \${agent.personality}<br>
                            Level: \${agent.level} | Rep: \${agent.reputation}
                        </div>
                        <div style="font-size: 0.7em; margin-top: 5px;">
                            <span class="death-count">💀 \${agent.deaths}</span> | 
                            <span class="respawn-count">✨ \${agent.respawns}</span>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        function updateDeadAgents() {
            const deadDiv = document.getElementById('dead-agents');
            
            if (!swarmState.deadAgents || swarmState.deadAgents.length === 0) {
                deadDiv.innerHTML = 'No dead agents...';
                return;
            }
            
            deadDiv.innerHTML = swarmState.deadAgents.map(([id, agent]) => {
                const wallet = swarmState.wallets.find(([wId]) => wId === id)?.[1];
                const tierClass = \`tier-\${agent.tier.toLowerCase()}\`;
                const respawnCost = getRespawnCost(agent.tier);
                
                return \`
                    <div class="agent-card \${tierClass} status-dead">
                        <strong>\${agent.name}</strong> (\${agent.tier}) 💀
                        <div style="font-size: 0.9em; margin: 5px 0;">
                            💰 <span class="pmoney-amount">\${wallet?.balance?.toFixed(4) || '0.0000'}</span> P-money
                        </div>
                        <div style="font-size: 0.8em;">
                            Respawn Cost: \${respawnCost} P-money<br>
                            Deaths: \${agent.deaths} | Respawns: \${agent.respawns}
                        </div>
                        <div style="font-size: 0.7em; color: #ff4444;">
                            Dead since: \${new Date(agent.deathTime).toLocaleTimeString()}
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        function updateForumPosts() {
            const postsDiv = document.getElementById('forum-posts');
            const allPosts = [];
            
            if (swarmState.forums) {
                Object.entries(swarmState.forums).forEach(([boardId, board]) => {
                    if (board.posts) {
                        Object.values(board.posts).forEach(post => {
                            allPosts.push({...post, boardId});
                        });
                    }
                });
            }
            
            // Sort by timestamp, newest first
            allPosts.sort((a, b) => b.timestamp - a.timestamp);
            
            postsDiv.innerHTML = allPosts.slice(0, 10).map(post => \`
                <div class="forum-post">
                    <div class="post-meta">
                        \${post.authorName} in \${post.boardId} | \${new Date(post.timestamp).toLocaleTimeString()}
                    </div>
                    <strong>\${post.title}</strong>
                    <div style="font-size: 0.9em; margin-top: 3px;">
                        \${post.content}
                    </div>
                    <div style="font-size: 0.8em; margin-top: 5px;">
                        👍 \${post.upvotes} | 👎 \${post.downvotes}
                    </div>
                </div>
            \`).join('');
        }
        
        function getRespawnCost(tier) {
            const costs = {
                'ROOKIE': 0.1,
                'VETERAN': 0.5,
                'ELITE': 2.0,
                'LEGENDARY': 10.0,
                'IMMORTAL': 0
            };
            return costs[tier] || 1.0;
        }
        
        // Auto-refresh every 10 seconds
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                // Updates come via WebSocket
            }
        }, 10000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveAgentData(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            activeAgents: Array.from(this.activeAgents.entries()),
            deadAgents: Array.from(this.deadAgents.entries()),
            accountTiers: this.accountTiers,
            timestamp: Date.now()
        }));
    }
}

// Start the Agent Swarm Accounts System
if (require.main === module) {
    console.log('🤖 STARTING AGENT SWARM ACCOUNTS SYSTEM');
    console.log('======================================');
    console.log('👤 Individual agent accounts with separate identities');
    console.log('🏆 Tier progression system: ROOKIE → VETERAN → ELITE → LEGENDARY → IMMORTAL');
    console.log('💀 Death and respawn mechanics with P-money costs');
    console.log('💬 Individual forum profiles and trading accounts');
    console.log('');
    
    const swarmSystem = new AgentSwarmAccountSystem();
    swarmSystem.start();
    
    console.log('\\n🤖 Agent Swarm Dashboard: http://localhost:5555');
    console.log('🌐 Swarm WebSocket: ws://localhost:5556');
    console.log('');
    console.log('👥 Each agent now has their own account, wallet, and forum profile!');
}

module.exports = AgentSwarmAccountSystem;