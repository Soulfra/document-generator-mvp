#!/usr/bin/env node

/**
 * DOMAIN EMPIRE GAME BUILDER
 * Turn all your domains and ideas into playable games
 * People work on building your ideas → Earn credits → Get real rewards
 * Hyperliquid graphing, Grand Exchange layers, all your concepts become games
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

console.log('🌐 DOMAIN EMPIRE GAME BUILDER STARTING...\n');

class DomainEmpireGameBuilder {
  constructor() {
    this.app = express();
    this.domains = new Map();
    this.ideas = new Map();
    this.gameProjects = new Map();
    this.playerCredits = new Map();
    this.workContributions = new Map();
    
    // Your actual domain portfolio and ideas
    this.domainPortfolio = {
      // Trading & Finance Domains
      'hyperliquid-analytics.com': {
        idea: 'Advanced trading analytics and graphing platform',
        gameType: 'trading-simulation',
        buildTasks: ['charting-engine', 'price-feed-integration', 'portfolio-analytics'],
        creditReward: 1000,
        realWorldValue: 'Trading platform equity'
      },
      
      'grand-exchange-layer.com': {
        idea: 'Universal trading layer connecting all exchanges',
        gameType: 'exchange-empire',
        buildTasks: ['api-connectors', 'arbitrage-engine', 'liquidity-aggregation'],
        creditReward: 1500,
        realWorldValue: 'Revenue share from trades'
      },
      
      // AI & Automation Domains  
      'soulfra-agency.com': {
        idea: 'AI agent marketplace and thought licensing',
        gameType: 'ai-agent-builder',
        buildTasks: ['agent-templates', 'licensing-system', 'marketplace-ui'],
        creditReward: 800,
        realWorldValue: 'AI agent royalties'
      },
      
      'document-generator.ai': {
        idea: 'AI-powered document to MVP generator',
        gameType: 'document-alchemy',
        buildTasks: ['parsing-engine', 'template-system', 'ai-integration'],
        creditReward: 1200,
        realWorldValue: 'SaaS subscription revenue'
      },
      
      // Gaming & Entertainment
      'shiprekt-empire.game': {
        idea: 'Multi-world gaming platform with real economy',
        gameType: 'meta-game-builder',
        buildTasks: ['world-generators', 'economy-systems', 'multiplayer-engine'],
        creditReward: 900,
        realWorldValue: 'Game revenue and NFT sales'
      },
      
      'chronoquest-universe.com': {
        idea: 'Time-based adventure gaming with historical elements',
        gameType: 'timeline-builder',
        buildTasks: ['historical-data', 'quest-system', 'time-mechanics'],
        creditReward: 700,
        realWorldValue: 'Educational game licensing'
      },
      
      // Blockchain & Web3
      'blamechain-protocol.org': {
        idea: 'Accountability blockchain for transparent governance',
        gameType: 'governance-simulator',
        buildTasks: ['consensus-mechanism', 'voting-system', 'reputation-engine'],
        creditReward: 1300,
        realWorldValue: 'Protocol token allocation'
      },
      
      'sovereign-economy.net': {
        idea: 'Decentralized autonomous economic system',
        gameType: 'economy-architect',
        buildTasks: ['tokenomics-design', 'governance-dao', 'economic-models'],
        creditReward: 1100,
        realWorldValue: 'Founding member status'
      },
      
      // Business & Professional
      'audit-gaming.pro': {
        idea: 'Gamified security auditing and bug bounty platform', 
        gameType: 'security-hunter',
        buildTasks: ['vulnerability-scanner', 'bounty-system', 'report-generator'],
        creditReward: 1000,
        realWorldValue: 'Audit business equity'
      },
      
      'xml-architecture.dev': {
        idea: 'Universal system architecture mapping and visualization',
        gameType: 'system-architect',
        buildTasks: ['xml-parser', 'visualization-engine', 'architecture-templates'],
        creditReward: 600,
        realWorldValue: 'Enterprise licensing deals'
      }
    };
    
    this.init();
  }
  
  async init() {
    console.log('🎮 Initializing Domain Empire Game Builder...');
    
    // Convert all domains to game projects
    await this.convertDomainsToGames();
    
    // Setup credit system
    await this.setupCreditSystem();
    
    // Create game project management
    await this.setupProjectManagement();
    
    // Setup domain deployment system
    await this.setupDomainDeployment();
    
    console.log('✅ Domain Empire Game Builder Ready!');
  }
  
  async convertDomainsToGames() {
    console.log('🌐 Converting domains to game projects...');
    
    Object.entries(this.domainPortfolio).forEach(([domain, config]) => {
      const gameProject = {
        domain,
        ...config,
        status: 'accepting-players',
        currentPlayers: 0,
        maxPlayers: this.calculateMaxPlayers(config.gameType),
        completionPercentage: 0,
        tasksCompleted: 0,
        totalTasks: config.buildTasks.length,
        creditsEarned: 0,
        creditsDistributed: 0,
        launchTarget: this.calculateLaunchDate(config),
        gameWorld: this.createGameWorld(config.gameType),
        playerRoles: this.definePlayerRoles(config.gameType),
        progressMilestones: this.createMilestones(config.buildTasks)
      };
      
      this.gameProjects.set(domain, gameProject);
      console.log(`  🎯 ${domain} → ${config.gameType} (${config.buildTasks.length} tasks)`);
    });
    
    console.log(`✅ ${Object.keys(this.domainPortfolio).length} domains converted to games`);
  }
  
  calculateMaxPlayers(gameType) {
    const playerLimits = {
      'trading-simulation': 25,
      'exchange-empire': 50,
      'ai-agent-builder': 30,
      'document-alchemy': 20,
      'meta-game-builder': 100,
      'timeline-builder': 40,
      'governance-simulator': 60,
      'economy-architect': 35,
      'security-hunter': 45,
      'system-architect': 15
    };
    
    return playerLimits[gameType] || 25;
  }
  
  calculateLaunchDate(config) {
    const baseDays = config.buildTasks.length * 7; // 1 week per task
    const complexityMultiplier = config.creditReward / 1000;
    
    const totalDays = Math.ceil(baseDays * complexityMultiplier);
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + totalDays);
    
    return launchDate;
  }
  
  createGameWorld(gameType) {
    const gameWorlds = {
      'trading-simulation': {
        environment: 'Wall Street Trading Floor',
        theme: 'Financial Markets',
        mechanics: 'Build trading algorithms while learning real market data',
        rewards: 'Trading credits that unlock real market access'
      },
      
      'exchange-empire': {
        environment: 'Global Trading Network',
        theme: 'Exchange Conquest',
        mechanics: 'Connect exchanges, arbitrage opportunities, liquidity wars',
        rewards: 'Revenue share from actual trades executed'
      },
      
      'ai-agent-builder': {
        environment: 'AI Development Lab',
        theme: 'Agent Creation',
        mechanics: 'Design AI agents, train models, marketplace competition',
        rewards: 'Royalties from deployed AI agents'
      },
      
      'document-alchemy': {
        environment: 'Digital Transformation Workshop',
        theme: 'Document Magic',
        mechanics: 'Transform documents into apps, template wizardry',
        rewards: 'Revenue from generated applications'
      },
      
      'meta-game-builder': {
        environment: 'Multiverse Game Studio',
        theme: 'World Creation',
        mechanics: 'Build interconnected game worlds, economy design',
        rewards: 'Game world ownership and revenue'
      },
      
      'governance-simulator': {
        environment: 'Digital Democracy',
        theme: 'Transparent Governance',
        mechanics: 'Design voting systems, accountability mechanisms',
        rewards: 'Governance tokens and protocol influence'
      }
    };
    
    return gameWorlds[gameType] || gameWorlds['trading-simulation'];
  }
  
  definePlayerRoles(gameType) {
    const roleDefinitions = {
      'trading-simulation': ['Quant Developer', 'Market Analyst', 'Algorithm Designer', 'Data Scientist'],
      'exchange-empire': ['API Integrator', 'Arbitrage Strategist', 'Liquidity Manager', 'Market Maker'],
      'ai-agent-builder': ['ML Engineer', 'Prompt Designer', 'Agent Trainer', 'Marketplace Curator'],
      'document-alchemy': ['Parser Developer', 'Template Designer', 'AI Integrator', 'UI/UX Builder'],
      'meta-game-builder': ['Game Designer', 'Economy Architect', 'World Builder', 'Engine Developer'],
      'governance-simulator': ['Mechanism Designer', 'Voting Theorist', 'Blockchain Developer', 'Governance Analyst']
    };
    
    return roleDefinitions[gameType] || ['Developer', 'Designer', 'Tester', 'Strategist'];
  }
  
  createMilestones(buildTasks) {
    return buildTasks.map((task, index) => ({
      id: index + 1,
      name: task,
      description: `Complete ${task} implementation`,
      creditReward: 100 + (index * 50),
      estimatedHours: 20 + (index * 10),
      requiredSkills: this.inferSkillsFromTask(task),
      unlocks: index === buildTasks.length - 1 ? 'Domain Launch' : `Milestone ${index + 2}`
    }));
  }
  
  inferSkillsFromTask(task) {
    const skillMap = {
      'charting-engine': ['frontend', 'data-visualization', 'javascript'],
      'price-feed-integration': ['api-integration', 'real-time-data', 'backend'],
      'portfolio-analytics': ['data-analysis', 'algorithms', 'finance'],
      'api-connectors': ['backend', 'api-development', 'integration'],
      'arbitrage-engine': ['algorithms', 'trading', 'optimization'],
      'liquidity-aggregation': ['financial-engineering', 'market-microstructure'],
      'agent-templates': ['ai', 'template-design', 'automation'],
      'licensing-system': ['legal-tech', 'smart-contracts', 'business-logic'],
      'marketplace-ui': ['frontend', 'ux-design', 'e-commerce'],
      'parsing-engine': ['nlp', 'text-processing', 'ai'],
      'template-system': ['code-generation', 'templating', 'automation'],
      'ai-integration': ['machine-learning', 'api-integration', 'ai'],
      'world-generators': ['procedural-generation', 'game-development', 'algorithms'],
      'economy-systems': ['game-economics', 'tokenomics', 'systems-design'],
      'multiplayer-engine': ['networking', 'real-time-systems', 'game-development']
    };
    
    return skillMap[task] || ['programming', 'problem-solving'];
  }
  
  async setupCreditSystem() {
    console.log('💰 Setting up credit system...');
    
    // Credit types and their real-world value
    this.creditTypes = {
      'build-credits': {
        description: 'Earned by completing development tasks',
        conversionRate: 0.1, // $0.10 per credit
        redeemableFor: ['cash', 'equity', 'domain-ownership', 'revenue-share']
      },
      
      'design-credits': {
        description: 'Earned by creating UI/UX and visual assets',
        conversionRate: 0.15,
        redeemableFor: ['design-tools', 'portfolio-features', 'client-referrals']
      },
      
      'strategy-credits': {
        description: 'Earned by contributing business strategy and planning',
        conversionRate: 0.2,
        redeemableFor: ['equity-stakes', 'advisor-roles', 'profit-sharing']
      },
      
      'launch-credits': {
        description: 'Earned by successfully launching domain projects',
        conversionRate: 0.5,
        redeemableFor: ['domain-ownership', 'founding-team-status', 'long-term-royalties']
      }
    };
    
    // Redemption options
    this.redemptionOptions = {
      'cash-payout': {
        minimumCredits: 1000,
        conversionRate: 0.1,
        description: 'Direct cash payment for credits earned'
      },
      
      'equity-stake': {
        minimumCredits: 5000,
        description: 'Ownership percentage in launched domain projects',
        calculator: (credits, domain) => Math.min(credits / 10000 * 100, 25) // Max 25% equity
      },
      
      'domain-ownership': {
        minimumCredits: 10000,
        description: 'Co-ownership or full ownership of domain projects',
        eligibility: 'Must have contributed to majority of project milestones'
      },
      
      'revenue-share': {
        minimumCredits: 2500,
        description: 'Percentage of ongoing revenue from domain projects',
        calculator: (credits) => Math.min(credits / 5000 * 10, 20) // Max 20% revenue share
      },
      
      'priority-access': {
        minimumCredits: 500,
        description: 'Early access to new domain game projects',
        benefits: ['First pick of roles', 'Higher credit multipliers', 'Exclusive projects']
      }
    };
    
    console.log(`✅ Credit system with ${Object.keys(this.creditTypes).length} credit types`);
  }
  
  async setupProjectManagement() {
    this.app.use(express.json());
    this.app.use(express.static('.'));
    
    // Main domain empire dashboard
    this.app.get('/', (req, res) => {
      res.send(this.generateDomainEmpireDashboard());
    });
    
    // Join a domain game project
    this.app.post('/api/join-project', (req, res) => {
      const { playerId, domain, preferredRole, skills, experience } = req.body;
      
      const project = this.gameProjects.get(domain);
      
      if (!project) {
        return res.status(404).json({ error: 'Domain project not found' });
      }
      
      if (project.currentPlayers >= project.maxPlayers) {
        return res.status(400).json({ error: 'Project is full' });
      }
      
      // Assign player to project
      const playerAssignment = {
        playerId,
        domain,
        role: this.assignOptimalRole(preferredRole, skills, project.playerRoles),
        joinedAt: new Date(),
        creditsEarned: 0,
        tasksCompleted: 0,
        skillMatch: this.calculateSkillMatch(skills, project),
        commitmentLevel: this.calculateCommitment(experience),
        expectedContribution: this.estimateContribution(skills, project)
      };
      
      this.workContributions.set(`${domain}-${playerId}`, playerAssignment);
      project.currentPlayers++;
      
      // Initialize player credits if new
      if (!this.playerCredits.has(playerId)) {
        this.playerCredits.set(playerId, {
          totalCredits: 0,
          creditsByType: {
            'build-credits': 0,
            'design-credits': 0,
            'strategy-credits': 0,
            'launch-credits': 0
          },
          redeemedCredits: 0,
          currentProjects: [],
          completedProjects: [],
          skillLevel: experience
        });
      }
      
      const playerProfile = this.playerCredits.get(playerId);
      playerProfile.currentProjects.push(domain);
      
      res.json({
        success: true,
        message: `Welcome to ${domain} project!`,
        assignment: playerAssignment,
        project: {
          domain,
          gameWorld: project.gameWorld,
          yourRole: playerAssignment.role,
          potentialCredits: project.creditReward,
          milestones: project.progressMilestones,
          teammates: project.currentPlayers - 1,
          launchTarget: project.launchTarget
        },
        creditInfo: {
          currentCredits: playerProfile.totalCredits,
          projectPotential: this.calculatePlayerPotential(playerAssignment, project)
        }
      });
      
      console.log(`🎮 ${playerId} joined ${domain} as ${playerAssignment.role}`);
    });
    
    // Submit work/complete task
    this.app.post('/api/submit-work', (req, res) => {
      const { playerId, domain, taskId, workDescription, files, timeSpent } = req.body;
      
      const project = this.gameProjects.get(domain);
      const playerAssignment = this.workContributions.get(`${domain}-${playerId}`);
      
      if (!project || !playerAssignment) {
        return res.status(404).json({ error: 'Project or player assignment not found' });
      }
      
      // Validate and score the work
      const workValidation = this.validateWork(workDescription, files, taskId, project);
      
      if (workValidation.isValid) {
        // Award credits
        const creditsEarned = this.calculateCreditsForWork(workValidation, playerAssignment.role, project);
        
        // Update player stats
        playerAssignment.creditsEarned += creditsEarned.total;
        playerAssignment.tasksCompleted++;
        
        const playerProfile = this.playerCredits.get(playerId);
        playerProfile.totalCredits += creditsEarned.total;
        
        // Update credits by type
        Object.entries(creditsEarned.breakdown).forEach(([type, amount]) => {
          playerProfile.creditsByType[type] += amount;
        });
        
        // Update project progress
        project.tasksCompleted++;
        project.completionPercentage = (project.tasksCompleted / project.totalTasks) * 100;
        project.creditsDistributed += creditsEarned.total;
        
        // Check if project is complete
        if (project.completionPercentage >= 100) {
          this.handleProjectCompletion(domain, project);
        }
        
        res.json({
          success: true,
          message: 'Work submitted and validated!',
          creditsEarned: creditsEarned,
          newTotalCredits: playerProfile.totalCredits,
          projectProgress: project.completionPercentage,
          nextMilestone: this.getNextMilestone(project),
          redemptionOptions: this.getAvailableRedemptions(playerProfile.totalCredits)
        });
        
        console.log(`✅ ${playerId} completed task in ${domain} → ${creditsEarned.total} credits`);
        
      } else {
        res.json({
          success: false,
          message: 'Work needs improvement',
          feedback: workValidation.feedback,
          suggestions: workValidation.suggestions,
          resubmit: true
        });
      }
    });
    
    // Redeem credits
    this.app.post('/api/redeem-credits', (req, res) => {
      const { playerId, redemptionType, creditAmount, targetDomain } = req.body;
      
      const playerProfile = this.playerCredits.get(playerId);
      
      if (!playerProfile) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      const redemption = this.processRedemption(playerId, redemptionType, creditAmount, targetDomain);
      
      if (redemption.success) {
        playerProfile.totalCredits -= creditAmount;
        playerProfile.redeemedCredits += creditAmount;
        
        res.json({
          success: true,
          redemption,
          remainingCredits: playerProfile.totalCredits,
          message: `Successfully redeemed ${creditAmount} credits for ${redemptionType}`
        });
        
        console.log(`💰 ${playerId} redeemed ${creditAmount} credits for ${redemptionType}`);
      } else {
        res.status(400).json({ error: redemption.error });
      }
    });
    
    // Get player dashboard
    this.app.get('/api/player/:playerId', (req, res) => {
      const { playerId } = req.params;
      
      const playerProfile = this.playerCredits.get(playerId);
      const playerProjects = Array.from(this.workContributions.values())
        .filter(assignment => assignment.playerId === playerId);
      
      if (!playerProfile) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      const dashboard = {
        playerId,
        profile: playerProfile,
        activeProjects: playerProjects.filter(p => {
          const project = this.gameProjects.get(p.domain);
          return project && project.completionPercentage < 100;
        }),
        completedProjects: playerProjects.filter(p => {
          const project = this.gameProjects.get(p.domain);
          return project && project.completionPercentage >= 100;
        }),
        availableProjects: this.getAvailableProjectsForPlayer(playerId),
        redemptionOptions: this.getAvailableRedemptions(playerProfile.totalCredits),
        achievements: this.calculateAchievements(playerProfile, playerProjects),
        nextGoals: this.suggestNextGoals(playerProfile, playerProjects)
      };
      
      res.json(dashboard);
    });
    
    // Domain project status
    this.app.get('/api/project/:domain', (req, res) => {
      const { domain } = req.params;
      
      const project = this.gameProjects.get(domain);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      const projectStatus = {
        ...project,
        activeTeam: Array.from(this.workContributions.values())
          .filter(assignment => assignment.domain === domain)
          .map(assignment => ({
            playerId: assignment.playerId,
            role: assignment.role,
            creditsEarned: assignment.creditsEarned,
            tasksCompleted: assignment.tasksCompleted,
            skillMatch: assignment.skillMatch
          })),
        recentActivity: this.getRecentProjectActivity(domain),
        launchReadiness: this.calculateLaunchReadiness(project)
      };
      
      res.json(projectStatus);
    });
  }
  
  generateDomainEmpireDashboard() {
    const projectsHtml = Array.from(this.gameProjects.entries()).map(([domain, project]) => `
      <div class="project-card" style="border: 2px solid #00ff00; margin: 20px; padding: 20px; border-radius: 10px; background: rgba(0,255,0,0.1);">
        <h3>🌐 ${domain}</h3>
        <p><strong>Game Type:</strong> ${project.gameType}</p>
        <p><strong>Idea:</strong> ${project.idea}</p>
        <p><strong>Progress:</strong> ${project.completionPercentage.toFixed(1)}%</p>
        <p><strong>Players:</strong> ${project.currentPlayers}/${project.maxPlayers}</p>
        <p><strong>Credits Available:</strong> ${project.creditReward}</p>
        <p><strong>Launch Target:</strong> ${project.launchTarget.toDateString()}</p>
        <div style="margin-top: 15px;">
          <strong>Build Tasks:</strong>
          <ul>
            ${project.buildTasks.map(task => `<li>${task}</li>`).join('')}
          </ul>
        </div>
        <div style="margin-top: 15px;">
          <strong>Game World:</strong> ${project.gameWorld.environment}<br>
          <em>${project.gameWorld.mechanics}</em>
        </div>
        <button onclick="joinProject('${domain}')" style="background: #00ff00; color: #000; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 10px;">
          Join Project
        </button>
      </div>
    `).join('');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>🌐 Domain Empire Game Builder</title>
    <style>
        body { background: #000; color: #00ff00; font-family: monospace; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: rgba(0,255,0,0.1); border: 1px solid #00ff00; padding: 15px; border-radius: 5px; text-align: center; }
        .projects { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        button { cursor: pointer; }
        button:hover { background: #00cc00 !important; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌐 DOMAIN EMPIRE GAME BUILDER</h1>
        <p>Turn your domains and ideas into games. People build them out while earning credits for real rewards.</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <h3>Total Domains</h3>
            <div style="font-size: 24px; color: #ffd700;">${this.gameProjects.size}</div>
        </div>
        <div class="stat-card">
            <h3>Active Players</h3>
            <div style="font-size: 24px; color: #ffd700;">${Array.from(this.gameProjects.values()).reduce((sum, p) => sum + p.currentPlayers, 0)}</div>
        </div>
        <div class="stat-card">
            <h3>Total Credits Available</h3>
            <div style="font-size: 24px; color: #ffd700;">${Array.from(this.gameProjects.values()).reduce((sum, p) => sum + p.creditReward, 0).toLocaleString()}</div>
        </div>
        <div class="stat-card">
            <h3>Projects Launched</h3>
            <div style="font-size: 24px; color: #ffd700;">${Array.from(this.gameProjects.values()).filter(p => p.completionPercentage >= 100).length}</div>
        </div>
    </div>
    
    <h2>🎮 Available Game Projects</h2>
    <div class="projects">
        ${projectsHtml}
    </div>
    
    <script>
        function joinProject(domain) {
            const playerId = prompt('Enter your Player ID:') || 'player-' + Date.now();
            const preferredRole = prompt('Preferred role (or leave empty):') || '';
            const skills = prompt('Your skills (comma-separated):')?.split(',') || [];
            
            fetch('/api/join-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId,
                    domain,
                    preferredRole,
                    skills,
                    experience: 'intermediate'
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Successfully joined ' + domain + ' project!\\n\\nYour role: ' + data.assignment.role + '\\nPotential credits: ' + data.project.potentialCredits);
                    location.reload();
                } else {
                    alert('Error: ' + data.error);
                }
            });
        }
        
        console.log('🌐 Domain Empire Dashboard Ready');
        console.log('Your domains are now playable games where people build your ideas for credits!');
    </script>
</body>
</html>
    `;
  }
  
  assignOptimalRole(preferredRole, skills, availableRoles) {
    // Simple role assignment logic
    if (preferredRole && availableRoles.includes(preferredRole)) {
      return preferredRole;
    }
    
    // Match skills to roles
    const skillRoleMap = {
      'javascript': 'Developer',
      'frontend': 'Frontend Developer', 
      'backend': 'Backend Developer',
      'design': 'Designer',
      'ux': 'UX Designer',
      'trading': 'Trading Strategist',
      'finance': 'Financial Analyst',
      'ai': 'AI Engineer',
      'blockchain': 'Blockchain Developer'
    };
    
    for (const skill of skills) {
      const matchedRole = skillRoleMap[skill.toLowerCase()];
      if (matchedRole && availableRoles.includes(matchedRole)) {
        return matchedRole;
      }
    }
    
    return availableRoles[0]; // Default to first available role
  }
  
  calculateSkillMatch(skills, project) {
    const requiredSkills = project.progressMilestones
      .flatMap(milestone => milestone.requiredSkills);
    
    const matchCount = skills.filter(skill => 
      requiredSkills.includes(skill.toLowerCase())
    ).length;
    
    return requiredSkills.length > 0 ? (matchCount / requiredSkills.length) * 100 : 50;
  }
  
  calculateCommitment(experience) {
    const commitmentLevels = {
      'beginner': 0.6,
      'intermediate': 0.8,
      'advanced': 0.9,
      'expert': 1.0
    };
    
    return commitmentLevels[experience] || 0.7;
  }
  
  estimateContribution(skills, project) {
    const baseContribution = 100; // base points
    const skillBonus = skills.length * 10;
    const complexityBonus = project.creditReward / 100;
    
    return Math.floor(baseContribution + skillBonus + complexityBonus);
  }
  
  validateWork(workDescription, files, taskId, project) {
    // Simplified work validation
    const hasDescription = workDescription && workDescription.length > 100;
    const hasFiles = files && files.length > 0;
    const descriptionQuality = workDescription ? workDescription.length / 500 : 0;
    
    const validationScore = [hasDescription, hasFiles].filter(Boolean).length + descriptionQuality;
    
    return {
      isValid: validationScore >= 1.5,
      score: validationScore,
      feedback: validationScore < 1.5 ? 'Need more detailed work description and supporting files' : 'Good work submission!',
      suggestions: validationScore < 1.5 ? ['Add more implementation details', 'Include code/design files', 'Explain your approach'] : []
    };
  }
  
  calculateCreditsForWork(validation, role, project) {
    const baseCredits = 100;
    const qualityMultiplier = validation.score;
    const roleMultipliers = {
      'Developer': 1.2,
      'Designer': 1.1,
      'Strategist': 1.3,
      'Analyst': 1.0
    };
    
    const roleMultiplier = roleMultipliers[role] || 1.0;
    const projectMultiplier = project.creditReward / 1000;
    
    const totalCredits = Math.floor(baseCredits * qualityMultiplier * roleMultiplier * projectMultiplier);
    
    // Breakdown by credit type
    const breakdown = {
      'build-credits': Math.floor(totalCredits * 0.6),
      'design-credits': Math.floor(totalCredits * 0.2),
      'strategy-credits': Math.floor(totalCredits * 0.1),
      'launch-credits': Math.floor(totalCredits * 0.1)
    };
    
    return {
      total: totalCredits,
      breakdown
    };
  }
  
  handleProjectCompletion(domain, project) {
    console.log(`🚀 Project ${domain} completed!`);
    
    // Award launch bonuses to all contributors
    const contributors = Array.from(this.workContributions.values())
      .filter(assignment => assignment.domain === domain);
    
    contributors.forEach(contributor => {
      const launchBonus = Math.floor(project.creditReward * 0.2); // 20% launch bonus
      const playerProfile = this.playerCredits.get(contributor.playerId);
      
      if (playerProfile) {
        playerProfile.totalCredits += launchBonus;
        playerProfile.creditsByType['launch-credits'] += launchBonus;
        playerProfile.completedProjects.push(domain);
        
        // Remove from current projects
        const currentIndex = playerProfile.currentProjects.indexOf(domain);
        if (currentIndex > -1) {
          playerProfile.currentProjects.splice(currentIndex, 1);
        }
      }
      
      console.log(`  💰 ${contributor.playerId} received ${launchBonus} launch bonus`);
    });
    
    // Deploy domain (placeholder)
    this.deployDomain(domain, project);
  }
  
  deployDomain(domain, project) {
    console.log(`🌐 Deploying ${domain}...`);
    
    // This would integrate with your actual deployment system
    const deploymentConfig = {
      domain,
      project: project.idea,
      gameType: project.gameType,
      contributors: Array.from(this.workContributions.values())
        .filter(assignment => assignment.domain === domain)
        .map(assignment => assignment.playerId),
      launchDate: new Date(),
      builtWith: project.buildTasks
    };
    
    // Save deployment record
    fs.writeFileSync(
      path.join(process.cwd(), `${domain.replace(/\./g, '-')}-deployment.json`),
      JSON.stringify(deploymentConfig, null, 2)
    );
    
    console.log(`✅ ${domain} deployed successfully!`);
  }
  
  processRedemption(playerId, redemptionType, creditAmount, targetDomain) {
    const option = this.redemptionOptions[redemptionType];
    
    if (!option) {
      return { success: false, error: 'Invalid redemption type' };
    }
    
    if (creditAmount < option.minimumCredits) {
      return { success: false, error: `Minimum ${option.minimumCredits} credits required` };
    }
    
    // Process different redemption types
    switch (redemptionType) {
      case 'cash-payout':
        const cashAmount = creditAmount * option.conversionRate;
        return {
          success: true,
          type: 'cash-payout',
          amount: `$${cashAmount.toFixed(2)}`,
          description: 'Cash payment will be processed within 5 business days'
        };
      
      case 'equity-stake':
        if (!targetDomain) {
          return { success: false, error: 'Target domain required for equity stake' };
        }
        
        const equityPercentage = option.calculator(creditAmount, targetDomain);
        return {
          success: true,
          type: 'equity-stake',
          domain: targetDomain,
          percentage: `${equityPercentage.toFixed(2)}%`,
          description: `${equityPercentage.toFixed(2)}% ownership stake in ${targetDomain}`
        };
      
      case 'revenue-share':
        const revenuePercentage = option.calculator(creditAmount);
        return {
          success: true,
          type: 'revenue-share',
          percentage: `${revenuePercentage.toFixed(2)}%`,
          description: `${revenuePercentage.toFixed(2)}% share of ongoing revenue from all completed projects`
        };
      
      default:
        return {
          success: true,
          type: redemptionType,
          description: option.description
        };
    }
  }
  
  getAvailableRedemptions(totalCredits) {
    return Object.entries(this.redemptionOptions)
      .filter(([type, option]) => totalCredits >= option.minimumCredits)
      .map(([type, option]) => ({
        type,
        ...option,
        canAfford: true
      }));
  }
  
  start(port = 5555) {
    this.app.listen(port, () => {
      console.log(`\n🌐 Domain Empire Game Builder: http://localhost:${port}`);
      console.log(`🎮 Game Projects: ${this.gameProjects.size}`);
      console.log(`💰 Credit Types: ${Object.keys(this.creditTypes).length}`);
      console.log(`🎯 Redemption Options: ${Object.keys(this.redemptionOptions).length}`);
      console.log(`\n💡 Your Domain Portfolio as Games:`);
      
      Array.from(this.gameProjects.entries()).forEach(([domain, project]) => {
        console.log(`  🌐 ${domain}`);
        console.log(`     → ${project.gameType} (${project.creditReward} credits)`);
        console.log(`     → ${project.idea}`);
      });
      
      console.log(`\n🚀 People can now build your ideas as games and earn credits!`);
      console.log(`💰 Credits redeem for cash, equity, domain ownership, and revenue share!`);
      console.log(`🕳️ Your entire ecosystem serves your domain empire!\n`);
    });
  }
}

// Launch the domain empire game builder
const domainEmpire = new DomainEmpireGameBuilder();
domainEmpire.start(5555);

module.exports = DomainEmpireGameBuilder;