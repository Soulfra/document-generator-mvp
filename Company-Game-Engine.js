#!/usr/bin/env node

/**
 * COMPANY GAME ENGINE
 * Combines RuneScape skill progression + Habbo Hotel social mechanics
 * to build your own digital company through gameplay
 * 
 * Core Concept: Building a company IS the game
 * - RuneScape Skills = Business Skills (Coding, Marketing, Finance, etc.)
 * - Habbo Rooms = Office Spaces and Company Departments  
 * - Quests = Business Milestones and Projects
 * - Economy = Real business value creation
 * - Social = Team building and networking
 * 
 * The game mechanics make business building feel like an MMO adventure
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// Import our existing systems
const FrogBrainDecisionEngine = require('./Frog-Brain-Decision-Engine');
const GameAggroBossIntegration = require('./Game-Aggro-Boss-Integration');

class CompanyGameEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.gameId = `COMPANY-GAME-${Date.now()}`;
    this.companyName = options.companyName || 'Digital Ventures Inc.';
    
    // Initialize decision engine for game choices
    this.frogBrain = new FrogBrainDecisionEngine();
    
    // RuneScape-style skill system adapted for business
    this.businessSkills = {
      // Technical Skills (RuneScape Combat/Magic equivalent)
      coding: {
        name: 'Coding',
        level: 1,
        experience: 0,
        category: 'technical',
        icon: '💻',
        description: 'Software development and programming',
        unlocks: {
          10: 'Basic Scripts',
          25: 'Web Applications', 
          50: 'Complex Systems',
          75: 'AI Integration',
          99: 'Master Architect'
        },
        experienceTable: this.generateExperienceTable()
      },
      
      design: {
        name: 'Design',
        level: 1,
        experience: 0,
        category: 'creative',
        icon: '🎨',
        description: 'UI/UX and visual design',
        unlocks: {
          10: 'Basic Layouts',
          25: 'Brand Design',
          50: 'User Experience',
          75: 'Design Systems',
          99: 'Design Visionary'
        },
        experienceTable: this.generateExperienceTable()
      },
      
      // Business Skills (RuneScape Crafting/Trading equivalent)
      marketing: {
        name: 'Marketing',
        level: 1,
        experience: 0,
        category: 'business',
        icon: '📢',
        description: 'Customer acquisition and brand building',
        unlocks: {
          10: 'Social Media',
          25: 'Content Strategy',
          50: 'Growth Hacking',
          75: 'Viral Campaigns',
          99: 'Marketing Wizard'
        },
        experienceTable: this.generateExperienceTable()
      },
      
      finance: {
        name: 'Finance',
        level: 1,
        experience: 0,
        category: 'business',
        icon: '💰',
        description: 'Financial management and investment',
        unlocks: {
          10: 'Basic Budgeting',
          25: 'Investment Strategy',
          50: 'Fundraising',
          75: 'Financial Modeling',
          99: 'Finance Master'
        },
        experienceTable: this.generateExperienceTable()
      },
      
      // Social Skills (RuneScape Slayer/Fishing equivalent)
      networking: {
        name: 'Networking',
        level: 1,
        experience: 0,
        category: 'social',
        icon: '🤝',
        description: 'Building relationships and partnerships',
        unlocks: {
          10: 'Local Connections',
          25: 'Industry Network',
          50: 'Influencer Access',
          75: 'Global Network',
          99: 'Network Emperor'
        },
        experienceTable: this.generateExperienceTable()
      },
      
      leadership: {
        name: 'Leadership',
        level: 1,
        experience: 0,
        category: 'social',
        icon: '👑',
        description: 'Team management and inspiration',
        unlocks: {
          10: 'Small Team Lead',
          25: 'Department Head',
          50: 'Executive Leader',
          75: 'Visionary CEO',
          99: 'Legendary Leader'
        },
        experienceTable: this.generateExperienceTable()
      },
      
      // Wisdom Skills (RuneScape Prayer/Runecrafting equivalent)
      strategy: {
        name: 'Strategy',
        level: 1,
        experience: 0,
        category: 'wisdom',
        icon: '🧠',
        description: 'Long-term planning and strategic thinking',
        unlocks: {
          10: 'Basic Planning',
          25: 'Market Analysis',
          50: 'Competitive Strategy',
          75: 'Blue Ocean Strategy',
          99: 'Master Strategist'
        },
        experienceTable: this.generateExperienceTable()
      },
      
      innovation: {
        name: 'Innovation',
        level: 1,
        experience: 0,
        category: 'wisdom',
        icon: '💡',
        description: 'Creative problem solving and invention',
        unlocks: {
          10: 'Incremental Improvements',
          25: 'Product Innovation',
          50: 'Disruptive Ideas',
          75: 'Revolutionary Concepts',
          99: 'Innovation Sage'
        },
        experienceTable: this.generateExperienceTable()
      }
    };
    
    // Habbo Hotel-style room system adapted for office spaces
    this.officeSpaces = {
      // Starter spaces
      home_office: {
        name: 'Home Office',
        type: 'workspace',
        size: 'small',
        capacity: 1,
        furniture: [],
        employees: [],
        productivity_bonus: 1.0,
        unlocked: true,
        cost: 0,
        description: 'Your humble beginnings - a desk in your bedroom'
      },
      
      // Growth spaces
      shared_workspace: {
        name: 'Shared Workspace',
        type: 'coworking',
        size: 'medium', 
        capacity: 5,
        furniture: [],
        employees: [],
        productivity_bonus: 1.2,
        unlocked: false,
        cost: 500,
        requirements: { networking: 10 },
        description: 'Professional coworking space with networking opportunities'
      },
      
      startup_office: {
        name: 'Startup Office',
        type: 'office',
        size: 'medium',
        capacity: 10,
        furniture: [],
        employees: [],
        productivity_bonus: 1.5,
        unlocked: false,
        cost: 2000,
        requirements: { finance: 25, leadership: 15 },
        description: 'Your first real office with meeting rooms and team space'
      },
      
      // Advanced spaces
      corporate_headquarters: {
        name: 'Corporate Headquarters',
        type: 'headquarters',
        size: 'large',
        capacity: 50,
        furniture: [],
        employees: [],
        productivity_bonus: 2.0,
        unlocked: false,
        cost: 10000,
        requirements: { leadership: 50, finance: 50, strategy: 40 },
        description: 'Impressive corporate headquarters with executive suites'
      },
      
      // Special spaces
      innovation_lab: {
        name: 'Innovation Lab',
        type: 'research',
        size: 'medium',
        capacity: 15,
        furniture: [],
        employees: [],
        productivity_bonus: 1.8,
        research_bonus: 2.5,
        unlocked: false,
        cost: 5000,
        requirements: { innovation: 40, coding: 35 },
        description: 'Cutting-edge research and development facility'
      },
      
      customer_center: {
        name: 'Customer Center',
        type: 'service',
        size: 'large',
        capacity: 30,
        furniture: [],
        employees: [],
        productivity_bonus: 1.3,
        customer_satisfaction_bonus: 2.0,
        unlocked: false,
        cost: 7500,
        requirements: { marketing: 45, networking: 35 },
        description: 'Dedicated customer service and support center'
      }
    };
    
    // Habbo-style furniture system for office customization
    this.furnitureShop = {
      // Basic furniture
      desk_basic: {
        name: 'Basic Desk',
        category: 'workspace',
        cost: 100,
        productivity_bonus: 0.1,
        icon: '🪑',
        description: 'A simple desk to get work done'
      },
      
      desk_executive: {
        name: 'Executive Desk',
        category: 'workspace', 
        cost: 500,
        productivity_bonus: 0.3,
        leadership_bonus: 0.2,
        icon: '🏢',
        requirements: { leadership: 25 },
        description: 'Impressive executive desk that commands respect'
      },
      
      // Tech equipment
      computer_basic: {
        name: 'Basic Computer',
        category: 'tech',
        cost: 300,
        coding_bonus: 0.2,
        icon: '💻',
        description: 'Standard desktop computer for development'
      },
      
      computer_gaming: {
        name: 'Gaming Rig',
        category: 'tech',
        cost: 1500,
        coding_bonus: 0.5,
        design_bonus: 0.3,
        icon: '🎮',
        requirements: { coding: 30 },
        description: 'High-performance computer for serious development'
      },
      
      // Social furniture
      meeting_table: {
        name: 'Meeting Table',
        category: 'social',
        cost: 800,
        networking_bonus: 0.3,
        leadership_bonus: 0.2,
        icon: '🪑',
        description: 'Professional meeting table for team collaboration'
      },
      
      coffee_machine: {
        name: 'Coffee Machine',
        category: 'comfort',
        cost: 200,
        productivity_bonus: 0.15,
        employee_happiness: 0.2,
        icon: '☕',
        description: 'Essential for any productive office'
      },
      
      // Prestige items
      awards_wall: {
        name: 'Awards Wall',
        category: 'prestige',
        cost: 1000,
        networking_bonus: 0.4,
        marketing_bonus: 0.3,
        icon: '🏆',
        requirements: { marketing: 40 },
        description: 'Display your achievements to impress visitors'
      },
      
      zen_garden: {
        name: 'Zen Garden',
        category: 'wellness',
        cost: 1200,
        strategy_bonus: 0.4,
        innovation_bonus: 0.3,
        stress_reduction: 0.5,
        icon: '🌱',
        requirements: { strategy: 35 },
        description: 'Peaceful space for deep thinking and meditation'
      }
    };
    
    // RuneScape-style quest system for business milestones
    this.questSystem = {
      // Starter quests
      first_sale: {
        name: 'First Sale',
        description: 'Make your first $100 in revenue',
        difficulty: 'novice',
        requirements: { marketing: 5 },
        rewards: {
          experience: { marketing: 500, finance: 200 },
          money: 100,
          unlocks: ['customer_testimonial']
        },
        status: 'available',
        story: 'Every entrepreneur remembers their first sale. Time to make yours count!'
      },
      
      hire_first_employee: {
        name: 'Building the Team',
        description: 'Hire your first employee',
        difficulty: 'novice',
        requirements: { leadership: 10, finance: 15 },
        rewards: {
          experience: { leadership: 800, networking: 300 },
          unlocks: ['team_management_tools']
        },
        status: 'available',
        story: 'Going from solo founder to team leader is a crucial milestone.'
      },
      
      // Growth quests
      product_launch: {
        name: 'The Big Launch',
        description: 'Successfully launch a product to 1000+ users',
        difficulty: 'intermediate',
        requirements: { marketing: 25, coding: 20, design: 20 },
        rewards: {
          experience: { marketing: 2000, coding: 1000, design: 1000 },
          money: 5000,
          unlocks: ['startup_office', 'press_coverage']
        },
        status: 'locked',
        prerequisites: ['first_sale'],
        story: 'Time to show the world what you\'ve built. Launch day is make or break!'
      },
      
      series_a_funding: {
        name: 'Series A Success',
        description: 'Raise your first major funding round',
        difficulty: 'advanced',
        requirements: { finance: 40, strategy: 35, networking: 30 },
        rewards: {
          experience: { finance: 5000, strategy: 3000, networking: 2000 },
          money: 100000,
          unlocks: ['corporate_headquarters', 'investor_relations']
        },
        status: 'locked',
        prerequisites: ['product_launch', 'hire_first_employee'],
        story: 'Convincing investors to bet on your vision requires skill, strategy, and charisma.'
      },
      
      // Master quests
      ipo_or_acquisition: {
        name: 'Exit Strategy',
        description: 'Either go public or get acquired for $10M+',
        difficulty: 'master',
        requirements: { 
          finance: 75, 
          strategy: 70, 
          leadership: 65,
          marketing: 60
        },
        rewards: {
          experience: { 
            finance: 10000, 
            strategy: 8000, 
            leadership: 7000,
            marketing: 5000
          },
          money: 10000000,
          unlocks: ['legendary_entrepreneur_status'],
          achievement: 'Company Game Completed'
        },
        status: 'locked',
        prerequisites: ['series_a_funding'],
        story: 'The ultimate goal - build a company valuable enough for a major exit.'
      }
    };
    
    // Game economy and progression
    this.gameEconomy = {
      money: options.startingMoney || 1000,
      monthly_expenses: 0,
      monthly_revenue: 0,
      company_valuation: 1000,
      employees: [],
      customers: 0,
      reputation: 50
    };
    
    // Social system (Habbo-style)
    this.socialSystem = {
      friends: new Map(),
      mentors: new Map(),
      competitors: new Map(),
      partners: new Map(),
      network_events: []
    };
    
    // Achievement system
    this.achievements = {
      skill_milestones: new Map(),
      business_milestones: new Map(),
      social_achievements: new Map(),
      special_achievements: new Map()
    };
    
    // Game state
    this.gameState = {
      current_office: 'home_office',
      active_projects: [],
      daily_tasks: [],
      game_day: 1,
      last_save: Date.now()
    };
    
    console.log('🎮 COMPANY GAME ENGINE INITIALIZING...');
    console.log(`🏢 Welcome to ${this.companyName}!`);
    console.log('⚔️ RuneScape skills meet Habbo Hotel social mechanics');
    console.log('🎯 Build your company through gameplay progression');
    
    this.initialize();
  }
  
  /**
   * Initialize the company game engine
   */
  async initialize() {
    // Load existing save game if available
    await this.loadGameSave();
    
    // Setup daily task generation
    this.setupDailyTasks();
    
    // Initialize achievement tracking
    this.initializeAchievements();
    
    // Setup social events
    this.setupSocialEvents();
    
    // Start the game loop
    this.startGameLoop();
    
    console.log('✅ Company Game Engine operational');
    console.log(`💼 Current office: ${this.officeSpaces[this.gameState.current_office].name}`);
    console.log(`💰 Starting capital: $${this.gameEconomy.money.toLocaleString()}`);
    console.log(`📊 Company valuation: $${this.gameEconomy.company_valuation.toLocaleString()}`);
  }
  
  /**
   * Generate RuneScape-style experience table (exponential growth)
   */
  generateExperienceTable() {
    const table = [];
    for (let level = 1; level <= 99; level++) {
      if (level === 1) {
        table[level] = 0;
      } else {
        // Formula similar to RuneScape: experience increases exponentially
        table[level] = Math.floor(level * 100 * Math.pow(1.1, level - 1));
      }
    }
    return table;
  }
  
  /**
   * Gain experience in a business skill
   */
  gainExperience(skill, amount, source = 'unknown') {
    if (!this.businessSkills[skill]) {
      console.error(`Unknown skill: ${skill}`);
      return;
    }
    
    const skillData = this.businessSkills[skill];
    const oldLevel = skillData.level;
    
    skillData.experience += amount;
    
    // Check for level up
    const newLevel = this.calculateLevel(skillData.experience, skillData.experienceTable);
    
    if (newLevel > oldLevel) {
      skillData.level = newLevel;
      
      console.log(`🎉 LEVEL UP! ${skillData.icon} ${skillData.name} is now level ${newLevel}!`);
      
      // Check for unlocks
      if (skillData.unlocks[newLevel]) {
        console.log(`🔓 Unlocked: ${skillData.unlocks[newLevel]}`);
        this.emit('skill_unlock', { skill, level: newLevel, unlock: skillData.unlocks[newLevel] });
      }
      
      // Achievement tracking
      this.checkSkillAchievements(skill, newLevel);
      
      // Check if new content unlocked
      this.checkContentUnlocks();
      
      this.emit('level_up', { skill, oldLevel, newLevel, experience: skillData.experience });
    }
    
    console.log(`+${amount} ${skillData.name} XP from ${source} (Level ${skillData.level})`);
    
    return {
      skill,
      experienceGained: amount,
      totalExperience: skillData.experience,
      level: skillData.level,
      leveledUp: newLevel > oldLevel
    };
  }
  
  /**
   * Calculate level from experience using RuneScape formula
   */
  calculateLevel(experience, experienceTable) {
    for (let level = 99; level >= 1; level--) {
      if (experience >= experienceTable[level]) {
        return level;
      }
    }
    return 1;
  }
  
  /**
   * Work on a project (main gameplay activity)
   */
  async workOnProject(projectData) {
    const projectId = crypto.randomUUID();
    
    // Use frog brain to make project decisions
    const decision = await this.frogBrain.processDecision({
      question: `How should we approach the ${projectData.name} project?`,
      description: projectData.description,
      options: projectData.approaches || [
        { action: 'focus_on_quality', description: 'Take time to build it right' },
        { action: 'focus_on_speed', description: 'Get it done quickly' },
        { action: 'focus_on_innovation', description: 'Try a creative new approach' }
      ],
      context: 'project_planning'
    });
    
    const selectedApproach = decision.selectedOption;
    console.log(`🎯 Project approach: ${selectedApproach.description}`);
    
    // Calculate experience gains based on project and approach
    const experienceGains = this.calculateProjectExperience(projectData, selectedApproach);
    
    // Apply experience gains
    const results = [];
    for (const [skill, amount] of Object.entries(experienceGains)) {
      const result = this.gainExperience(skill, amount, `${projectData.name} project`);
      results.push(result);
    }
    
    // Calculate project success and rewards
    const projectResult = this.calculateProjectSuccess(projectData, selectedApproach, results);
    
    // Update economy
    this.gameEconomy.money += projectResult.money_earned;
    this.gameEconomy.company_valuation += projectResult.valuation_increase;
    this.gameEconomy.reputation += projectResult.reputation_gain;
    
    console.log(`💰 Earned $${projectResult.money_earned.toLocaleString()}`);
    console.log(`📈 Company valuation increased by $${projectResult.valuation_increase.toLocaleString()}`);
    
    // Check for quest completion
    this.checkQuestProgress(projectResult);
    
    // Record project completion
    this.gameState.active_projects.push({
      id: projectId,
      name: projectData.name,
      approach: selectedApproach,
      results: projectResult,
      completedAt: Date.now()
    });
    
    this.emit('project_completed', {
      projectId,
      projectData,
      approach: selectedApproach,
      results: projectResult,
      experienceGains: results
    });
    
    return projectResult;
  }
  
  /**
   * Calculate experience gains from project work
   */
  calculateProjectExperience(projectData, approach) {
    const baseExperience = projectData.difficulty * 100;
    const gains = {};
    
    // Base skills for any project
    gains.strategy = Math.floor(baseExperience * 0.3);
    
    // Project-specific skills
    switch (projectData.type) {
      case 'product_development':
        gains.coding = Math.floor(baseExperience * 0.6);
        gains.design = Math.floor(baseExperience * 0.4);
        gains.innovation = Math.floor(baseExperience * 0.2);
        break;
        
      case 'marketing_campaign':
        gains.marketing = Math.floor(baseExperience * 0.8);
        gains.design = Math.floor(baseExperience * 0.3);
        gains.networking = Math.floor(baseExperience * 0.2);
        break;
        
      case 'fundraising':
        gains.finance = Math.floor(baseExperience * 0.7);
        gains.networking = Math.floor(baseExperience * 0.5);
        gains.leadership = Math.floor(baseExperience * 0.3);
        break;
        
      case 'team_building':
        gains.leadership = Math.floor(baseExperience * 0.6);
        gains.networking = Math.floor(baseExperience * 0.4);
        break;
        
      default:
        // Generic project
        gains.coding = Math.floor(baseExperience * 0.3);
        gains.marketing = Math.floor(baseExperience * 0.2);
        break;
    }
    
    // Approach modifiers
    switch (approach.action) {
      case 'focus_on_quality':
        Object.keys(gains).forEach(skill => gains[skill] = Math.floor(gains[skill] * 1.2));
        break;
      case 'focus_on_speed':
        Object.keys(gains).forEach(skill => gains[skill] = Math.floor(gains[skill] * 0.8));
        break;
      case 'focus_on_innovation':
        gains.innovation = (gains.innovation || 0) + Math.floor(baseExperience * 0.5);
        break;
    }
    
    return gains;
  }
  
  /**
   * Calculate project success and financial rewards
   */
  calculateProjectSuccess(projectData, approach, experienceResults) {
    const skillLevels = this.getSkillLevels();
    
    // Base success calculation
    let successRate = 0.5; // 50% base success
    
    // Skill bonuses
    switch (projectData.type) {
      case 'product_development':
        successRate += (skillLevels.coding / 100) * 0.3;
        successRate += (skillLevels.design / 100) * 0.2;
        break;
      case 'marketing_campaign':
        successRate += (skillLevels.marketing / 100) * 0.4;
        successRate += (skillLevels.networking / 100) * 0.1;
        break;
      case 'fundraising':
        successRate += (skillLevels.finance / 100) * 0.3;
        successRate += (skillLevels.networking / 100) * 0.2;
        break;
    }
    
    // Approach modifiers
    switch (approach.action) {
      case 'focus_on_quality':
        successRate += 0.2;
        break;
      case 'focus_on_speed':
        successRate -= 0.1;
        break;
      case 'focus_on_innovation':
        successRate += Math.random() * 0.4 - 0.2; // High risk, high reward
        break;
    }
    
    successRate = Math.max(0.1, Math.min(0.95, successRate)); // Clamp between 10-95%
    
    const success = Math.random() < successRate;
    const successMultiplier = success ? (1 + Math.random()) : (0.5 + Math.random() * 0.3);
    
    const baseMoney = projectData.difficulty * 500;
    const baseValuation = projectData.difficulty * 1000;
    const baseReputation = projectData.difficulty * 5;
    
    return {
      success,
      success_rate: successRate,
      money_earned: Math.floor(baseMoney * successMultiplier),
      valuation_increase: Math.floor(baseValuation * successMultiplier),
      reputation_gain: Math.floor(baseReputation * successMultiplier),
      experience_bonus: success ? 1.5 : 1.0
    };
  }
  
  /**
   * Purchase and place furniture in office
   */
  buyFurniture(furnitureId, officeId = null) {
    const office = officeId || this.gameState.current_office;
    const furniture = this.furnitureShop[furnitureId];
    const officeSpace = this.officeSpaces[office];
    
    if (!furniture) {
      return { success: false, error: 'Furniture not found' };
    }
    
    if (!officeSpace) {
      return { success: false, error: 'Office not found' };
    }
    
    if (this.gameEconomy.money < furniture.cost) {
      return { success: false, error: 'Insufficient funds' };
    }
    
    // Check requirements
    if (furniture.requirements) {
      for (const [skill, level] of Object.entries(furniture.requirements)) {
        if (this.businessSkills[skill].level < level) {
          return { 
            success: false, 
            error: `Requires ${skill} level ${level} (you have ${this.businessSkills[skill].level})` 
          };
        }
      }
    }
    
    // Purchase furniture
    this.gameEconomy.money -= furniture.cost;
    officeSpace.furniture.push({
      id: furnitureId,
      name: furniture.name,
      purchasedAt: Date.now()
    });
    
    // Apply bonuses
    this.applyFurnitureBonuses(office);
    
    console.log(`🪑 Purchased ${furniture.name} for ${officeSpace.name} - $${furniture.cost}`);
    
    this.emit('furniture_purchased', {
      furnitureId,
      furniture,
      office,
      cost: furniture.cost
    });
    
    return { success: true, furniture, office: officeSpace };
  }
  
  /**
   * Upgrade to a new office space
   */
  upgradeOffice(newOfficeId) {
    const newOffice = this.officeSpaces[newOfficeId];
    const currentOffice = this.officeSpaces[this.gameState.current_office];
    
    if (!newOffice) {
      return { success: false, error: 'Office not found' };
    }
    
    if (!newOffice.unlocked && !this.checkOfficeRequirements(newOffice)) {
      return { success: false, error: 'Office requirements not met' };
    }
    
    if (this.gameEconomy.money < newOffice.cost) {
      return { success: false, error: 'Insufficient funds' };
    }
    
    // Purchase office
    this.gameEconomy.money -= newOffice.cost;
    newOffice.unlocked = true;
    this.gameState.current_office = newOfficeId;
    
    // Transfer furniture from old office
    newOffice.furniture.push(...currentOffice.furniture);
    
    console.log(`🏢 Upgraded to ${newOffice.name} - $${newOffice.cost}`);
    
    // Achievement check
    this.checkAchievements('office_upgrade', { from: currentOffice.name, to: newOffice.name });
    
    this.emit('office_upgraded', {
      oldOffice: currentOffice,
      newOffice,
      cost: newOffice.cost
    });
    
    return { success: true, oldOffice: currentOffice, newOffice };
  }
  
  /**
   * Check if office requirements are met
   */
  checkOfficeRequirements(office) {
    if (!office.requirements) return true;
    
    for (const [skill, level] of Object.entries(office.requirements)) {
      if (this.businessSkills[skill].level < level) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Apply furniture bonuses to office productivity
   */
  applyFurnitureBonuses(officeId) {
    const office = this.officeSpaces[officeId];
    let totalProductivityBonus = office.productivity_bonus;
    const skillBonuses = {};
    
    for (const furnitureItem of office.furniture) {
      const furniture = this.furnitureShop[furnitureItem.id];
      
      if (furniture.productivity_bonus) {
        totalProductivityBonus += furniture.productivity_bonus;
      }
      
      // Skill-specific bonuses
      Object.keys(this.businessSkills).forEach(skill => {
        const bonusKey = `${skill}_bonus`;
        if (furniture[bonusKey]) {
          skillBonuses[skill] = (skillBonuses[skill] || 0) + furniture[bonusKey];
        }
      });
    }
    
    office.computed_productivity_bonus = totalProductivityBonus;
    office.computed_skill_bonuses = skillBonuses;
  }
  
  /**
   * Start quest or check quest progress
   */
  checkQuestProgress(projectResult = null) {
    for (const [questId, quest] of Object.entries(this.questSystem)) {
      if (quest.status === 'available' && this.checkQuestRequirements(quest)) {
        // Auto-start quest if requirements met
        quest.status = 'in_progress';
        console.log(`📜 Quest started: ${quest.name}`);
        this.emit('quest_started', { questId, quest });
      }
      
      if (quest.status === 'in_progress') {
        const completed = this.checkQuestCompletion(questId, quest, projectResult);
        if (completed) {
          this.completeQuest(questId, quest);
        }
      }
    }
  }
  
  /**
   * Check if quest requirements are met
   */
  checkQuestRequirements(quest) {
    if (!quest.requirements) return true;
    
    for (const [skill, level] of Object.entries(quest.requirements)) {
      if (this.businessSkills[skill].level < level) {
        return false;
      }
    }
    
    // Check prerequisites
    if (quest.prerequisites) {
      for (const prereq of quest.prerequisites) {
        if (this.questSystem[prereq].status !== 'completed') {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Check if quest completion conditions are met
   */
  checkQuestCompletion(questId, quest, projectResult) {
    switch (questId) {
      case 'first_sale':
        return this.gameEconomy.monthly_revenue >= 100;
      
      case 'hire_first_employee':
        return this.gameEconomy.employees.length >= 1;
      
      case 'product_launch':
        return this.gameEconomy.customers >= 1000;
      
      case 'series_a_funding':
        return this.gameEconomy.company_valuation >= 1000000;
      
      case 'ipo_or_acquisition':
        return this.gameEconomy.company_valuation >= 10000000;
      
      default:
        return false;
    }
  }
  
  /**
   * Complete a quest and give rewards
   */
  completeQuest(questId, quest) {
    quest.status = 'completed';
    
    console.log(`🏆 QUEST COMPLETED: ${quest.name}!`);
    console.log(`📖 ${quest.story}`);
    
    // Give experience rewards
    if (quest.rewards.experience) {
      for (const [skill, amount] of Object.entries(quest.rewards.experience)) {
        this.gainExperience(skill, amount, `${quest.name} quest reward`);
      }
    }
    
    // Give money rewards
    if (quest.rewards.money) {
      this.gameEconomy.money += quest.rewards.money;
      console.log(`💰 Received $${quest.rewards.money.toLocaleString()}`);
    }
    
    // Unlock new content
    if (quest.rewards.unlocks) {
      for (const unlock of quest.rewards.unlocks) {
        this.unlockContent(unlock);
      }
    }
    
    // Check for achievement
    if (quest.rewards.achievement) {
      this.achievements.special_achievements.set(questId, {
        name: quest.rewards.achievement,
        unlockedAt: Date.now()
      });
    }
    
    this.emit('quest_completed', { questId, quest });
    
    // Check if new quests are now available
    this.checkQuestProgress();
  }
  
  /**
   * Utility functions
   */
  getSkillLevels() {
    const levels = {};
    for (const [skill, data] of Object.entries(this.businessSkills)) {
      levels[skill] = data.level;
    }
    return levels;
  }
  
  getTotalLevel() {
    return Object.values(this.businessSkills).reduce((total, skill) => total + skill.level, 0);
  }
  
  unlockContent(contentId) {
    // Unlock office spaces
    if (this.officeSpaces[contentId]) {
      this.officeSpaces[contentId].unlocked = true;
      console.log(`🔓 Unlocked office: ${this.officeSpaces[contentId].name}`);
    }
    
    console.log(`🔓 Unlocked: ${contentId}`);
  }
  
  checkContentUnlocks() {
    // Check for new office unlocks based on skill levels
    for (const [officeId, office] of Object.entries(this.officeSpaces)) {
      if (!office.unlocked && this.checkOfficeRequirements(office)) {
        office.unlocked = true;
        console.log(`🔓 New office available: ${office.name}`);
        this.emit('content_unlocked', { type: 'office', id: officeId, content: office });
      }
    }
  }
  
  checkSkillAchievements(skill, level) {
    const milestones = [10, 25, 50, 75, 99];
    
    if (milestones.includes(level)) {
      const achievementId = `${skill}_${level}`;
      this.achievements.skill_milestones.set(achievementId, {
        skill,
        level,
        unlockedAt: Date.now()
      });
      
      console.log(`🏆 Achievement unlocked: ${this.businessSkills[skill].name} Level ${level}!`);
      this.emit('achievement_unlocked', { type: 'skill_milestone', skill, level });
    }
  }
  
  checkAchievements(type, data) {
    // Placeholder for various achievement checks
    console.log(`🏆 Achievement check: ${type}`, data);
  }
  
  initializeAchievements() {
    console.log('🏆 Achievement system initialized');
  }
  
  setupDailyTasks() {
    // Generate daily tasks to keep players engaged
    console.log('📋 Daily task system initialized');
  }
  
  setupSocialEvents() {
    // Setup networking events and social interactions
    console.log('👥 Social event system initialized');
  }
  
  startGameLoop() {
    // Main game loop for automatic progression
    setInterval(() => {
      this.gameState.game_day++;
      
      // Generate monthly revenue/expenses
      if (this.gameState.game_day % 30 === 0) {
        this.processMonthlyFinancials();
      }
      
      // Auto-save game
      if (this.gameState.game_day % 10 === 0) {
        this.saveGame();
      }
      
    }, 1000); // 1 second = 1 game day (accelerated time)
  }
  
  processMonthlyFinancials() {
    // Process monthly revenue and expenses
    const revenue = this.calculateMonthlyRevenue();
    const expenses = this.calculateMonthlyExpenses();
    const net = revenue - expenses;
    
    this.gameEconomy.money += net;
    this.gameEconomy.monthly_revenue = revenue;
    this.gameEconomy.monthly_expenses = expenses;
    
    console.log(`📊 Monthly Report: Revenue $${revenue}, Expenses $${expenses}, Net $${net}`);
    
    this.emit('monthly_report', { revenue, expenses, net });
  }
  
  calculateMonthlyRevenue() {
    return this.gameEconomy.customers * 10; // $10 per customer per month
  }
  
  calculateMonthlyExpenses() {
    let expenses = 0;
    
    // Office rent
    const office = this.officeSpaces[this.gameState.current_office];
    expenses += office.cost * 0.1; // 10% of office cost per month
    
    // Employee salaries
    expenses += this.gameEconomy.employees.length * 5000; // $5k per employee per month
    
    return expenses;
  }
  
  async saveGame() {
    try {
      const saveData = {
        gameId: this.gameId,
        companyName: this.companyName,
        businessSkills: this.businessSkills,
        gameEconomy: this.gameEconomy,
        gameState: this.gameState,
        questSystem: this.questSystem,
        officeSpaces: this.officeSpaces,
        achievements: {
          skill_milestones: Object.fromEntries(this.achievements.skill_milestones),
          business_milestones: Object.fromEntries(this.achievements.business_milestones),
          social_achievements: Object.fromEntries(this.achievements.social_achievements),
          special_achievements: Object.fromEntries(this.achievements.special_achievements)
        },
        lastSaved: Date.now()
      };
      
      const saveDir = path.join(__dirname, 'game-saves');
      await fs.mkdir(saveDir, { recursive: true });
      
      const savePath = path.join(saveDir, `${this.gameId}.json`);
      await fs.writeFile(savePath, JSON.stringify(saveData, null, 2));
      
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }
  
  async loadGameSave() {
    try {
      const saveDir = path.join(__dirname, 'game-saves');
      const files = await fs.readdir(saveDir);
      
      if (files.length > 0) {
        const latestSave = files.sort().pop();
        const savePath = path.join(saveDir, latestSave);
        const saveData = JSON.parse(await fs.readFile(savePath, 'utf-8'));
        
        // Restore game state
        Object.assign(this.businessSkills, saveData.businessSkills);
        Object.assign(this.gameEconomy, saveData.gameEconomy);
        Object.assign(this.gameState, saveData.gameState);
        Object.assign(this.questSystem, saveData.questSystem);
        Object.assign(this.officeSpaces, saveData.officeSpaces);
        
        // Restore achievements
        if (saveData.achievements) {
          this.achievements.skill_milestones = new Map(Object.entries(saveData.achievements.skill_milestones || {}));
          this.achievements.business_milestones = new Map(Object.entries(saveData.achievements.business_milestones || {}));
          this.achievements.social_achievements = new Map(Object.entries(saveData.achievements.social_achievements || {}));
          this.achievements.special_achievements = new Map(Object.entries(saveData.achievements.special_achievements || {}));
        }
        
        console.log(`💾 Loaded saved game from ${new Date(saveData.lastSaved).toLocaleDateString()}`);
        
        return true;
      }
    } catch (error) {
      console.log('💾 No save game found, starting fresh');
    }
    
    return false;
  }
  
  /**
   * Get comprehensive game status
   */
  getGameStatus() {
    return {
      gameId: this.gameId,
      companyName: this.companyName,
      gameDay: this.gameState.game_day,
      
      // Skills summary
      skills: Object.fromEntries(
        Object.entries(this.businessSkills).map(([name, skill]) => [
          name, 
          { level: skill.level, experience: skill.experience, icon: skill.icon }
        ])
      ),
      totalLevel: this.getTotalLevel(),
      
      // Economy summary
      economy: {
        money: this.gameEconomy.money,
        monthlyRevenue: this.gameEconomy.monthly_revenue,
        monthlyExpenses: this.gameEconomy.monthly_expenses,
        companyValuation: this.gameEconomy.company_valuation,
        employees: this.gameEconomy.employees.length,
        customers: this.gameEconomy.customers,
        reputation: this.gameEconomy.reputation
      },
      
      // Current office
      currentOffice: {
        id: this.gameState.current_office,
        ...this.officeSpaces[this.gameState.current_office]
      },
      
      // Quest progress
      quests: {
        available: Object.values(this.questSystem).filter(q => q.status === 'available').length,
        in_progress: Object.values(this.questSystem).filter(q => q.status === 'in_progress').length,
        completed: Object.values(this.questSystem).filter(q => q.status === 'completed').length
      },
      
      // Achievements
      achievements: {
        skill_milestones: this.achievements.skill_milestones.size,
        business_milestones: this.achievements.business_milestones.size,
        social_achievements: this.achievements.social_achievements.size,
        special_achievements: this.achievements.special_achievements.size
      }
    };
  }
}

// Export the class
module.exports = CompanyGameEngine;

// CLI interface if run directly
if (require.main === module) {
  console.log('🎮 COMPANY GAME ENGINE - STANDALONE MODE\n');
  
  const gameEngine = new CompanyGameEngine({
    companyName: 'Demo Startup Inc.',
    startingMoney: 5000
  });
  
  // Setup event logging
  gameEngine.on('level_up', (data) => {
    console.log(`🎉 LEVEL UP! ${data.skill} reached level ${data.newLevel}`);
  });
  
  gameEngine.on('quest_completed', (data) => {
    console.log(`🏆 QUEST COMPLETE! ${data.quest.name}`);
  });
  
  gameEngine.on('achievement_unlocked', (data) => {
    console.log(`🏅 ACHIEVEMENT! ${data.type}: ${data.skill || data.achievement}`);
  });
  
  gameEngine.on('project_completed', (data) => {
    console.log(`✅ PROJECT DONE! ${data.projectData.name} - $${data.results.money_earned}`);
  });
  
  // Demo gameplay loop
  setTimeout(async () => {
    console.log('\n🎮 Starting demo gameplay...\n');
    
    // Demo Project 1: First Product
    console.log('🚀 Working on first product...');
    await gameEngine.workOnProject({
      name: 'MVP Product Launch',
      type: 'product_development',
      difficulty: 2,
      description: 'Build and launch our first minimum viable product',
      approaches: [
        { action: 'focus_on_quality', description: 'Take time to build it right' },
        { action: 'focus_on_speed', description: 'Get to market quickly' },
        { action: 'focus_on_innovation', description: 'Try something revolutionary' }
      ]
    });
    
    // Demo Project 2: Marketing Campaign
    setTimeout(async () => {
      console.log('\n📢 Running marketing campaign...');
      await gameEngine.workOnProject({
        name: 'Launch Marketing Campaign',
        type: 'marketing_campaign',
        difficulty: 3,
        description: 'Get the word out about our amazing product'
      });
      
      // Add some customers for quest progress
      gameEngine.gameEconomy.customers = 1200;
      gameEngine.checkQuestProgress();
      
    }, 3000);
    
    // Demo furniture purchase
    setTimeout(() => {
      console.log('\n🪑 Buying office furniture...');
      gameEngine.buyFurniture('coffee_machine');
      gameEngine.buyFurniture('computer_gaming');
      
    }, 5000);
    
    // Show game status
    setTimeout(() => {
      console.log('\n📊 GAME STATUS:');
      const status = gameEngine.getGameStatus();
      console.log(JSON.stringify(status, null, 2));
      
    }, 8000);
    
  }, 2000);
  
  // Show periodic status updates
  setInterval(() => {
    const status = gameEngine.getGameStatus();
    console.log(`\n🎮 Day ${status.gameDay} | 💰 $${status.economy.money.toLocaleString()} | 📈 $${status.economy.companyValuation.toLocaleString()} valuation | 🎯 Level ${status.totalLevel}`);
  }, 10000);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Saving game and shutting down...');
    await gameEngine.saveGame();
    
    console.log('\n🎮 Final Game Status:');
    console.log(JSON.stringify(gameEngine.getGameStatus(), null, 2));
    
    console.log('✅ Game saved successfully! 🎮');
    process.exit(0);
  });
}