#!/usr/bin/env node

/**
 * REVERSE FUNNEL ONE PIECE SYSTEM
 * First 10 MILLION people get PAID to join and help build our database!
 * We pay them credits/tokens to contribute data → They help us reach $1B treasure
 * 
 * "Join for FREE and get PAID to help us find the One Piece!"
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

console.log(`
💰🔄 REVERSE FUNNEL ONE PIECE SYSTEM 🔄💰
We PAY YOU → You Help Build Database → Together We Find $1 Billion One Piece!
`);

class ReverseFunnelOnePiece extends EventEmitter {
  constructor() {
    super();
    
    // REVERSE FUNNEL GOALS
    this.goals = {
      targetPeople: 10_000_000,    // 10 million people
      targetTreasury: 1_000_000_000, // $1 billion
      currentPeople: 0,
      currentTreasury: 0
    };
    
    // SCOREBOARD SYSTEM
    this.scoreboards = {
      peopleProgress: 0,           // % of 10M people joined
      treasuryProgress: 0,         // % of $1B reached
      dailyJoins: 0,
      dailyContributions: 0
    };
    
    // REVERSE PAYMENT SYSTEM (we pay them!)
    this.paymentTiers = {
      EARLY_BIRD: { 
        slots: 100_000,      // First 100K people
        signupBonus: 100,    // $100 signup bonus
        perTaskBonus: 5,     // $5 per task
        description: 'First 100K get premium rewards'
      },
      PIONEER: { 
        slots: 900_000,      // Next 900K (total 1M)
        signupBonus: 50,     // $50 signup bonus  
        perTaskBonus: 3,     // $3 per task
        description: 'First million pioneers'
      },
      EXPLORER: { 
        slots: 4_000_000,    // Next 4M (total 5M)
        signupBonus: 25,     // $25 signup bonus
        perTaskBonus: 2,     // $2 per task
        description: 'Early explorers'
      },
      CREW_MEMBER: { 
        slots: 5_000_000,    // Last 5M (total 10M)
        signupBonus: 10,     // $10 signup bonus
        perTaskBonus: 1,     // $1 per task
        description: 'Essential crew members'
      }
    };
    
    // DATABASE BUILDING TASKS (how they earn money)
    this.databaseTasks = {
      DATA_ENTRY: {
        name: 'Data Entry Pirate',
        description: 'Enter business data, contacts, leads',
        payRate: '$2-5 per entry',
        difficulty: 'Easy',
        timeEstimate: '2-5 minutes',
        examples: ['Company info', 'Contact details', 'Market research']
      },
      CONTENT_CREATION: {
        name: 'Content Creator',
        description: 'Write articles, social posts, documentation',
        payRate: '$10-50 per piece',
        difficulty: 'Medium',
        timeEstimate: '30-60 minutes',
        examples: ['Blog posts', 'Social media', 'Product descriptions']
      },
      CODE_CONTRIBUTION: {
        name: 'Code Contributor',
        description: 'Write code, fix bugs, improve systems',
        payRate: '$25-200 per contribution',
        difficulty: 'Hard',
        timeEstimate: '1-4 hours',
        examples: ['Bug fixes', 'New features', 'Documentation']
      },
      RESEARCH_SCOUT: {
        name: 'Research Scout',
        description: 'Find leads, research markets, gather intelligence',
        payRate: '$5-25 per research task',
        difficulty: 'Medium',
        timeEstimate: '15-45 minutes',
        examples: ['Market research', 'Competitor analysis', 'Lead generation']
      },
      QUALITY_CHECKER: {
        name: 'Quality Checker',
        description: 'Review and verify data quality',
        payRate: '$1-3 per review',
        difficulty: 'Easy',
        timeEstimate: '1-3 minutes',
        examples: ['Data verification', 'Content review', 'Accuracy checks']
      },
      COMMUNITY_BUILDER: {
        name: 'Community Builder',
        description: 'Recruit new members, moderate discussions',
        payRate: '$5-20 per referral/task',
        difficulty: 'Easy-Medium',
        timeEstimate: '10-30 minutes',
        examples: ['Recruit friends', 'Answer questions', 'Community events']
      }
    };
    
    // MEMBER DATABASE
    this.members = new Map();
    this.dailyStats = new Map();
    this.leaderboards = new Map();
    
    // GAMIFICATION SYSTEMS
    this.achievements = this.initializeAchievements();
    this.referralBonuses = this.initializeReferralSystem();
    
    this.initialize();
  }

  async initialize() {
    console.log('🔄 Initializing Reverse Funnel One Piece System...');
    
    // Setup daily tracking
    this.setupDailyTracking();
    
    // Initialize scoreboards
    this.updateScoreboards();
    
    // Start gamification systems
    this.startGamificationSystems();
    
    console.log('💰 REVERSE FUNNEL ACTIVE! We pay YOU to help build the treasure!');
  }

  // SUPER EASY SIGNUP - WE PAY THEM!
  async easySignup(userData) {
    console.log(`💰 NEW MEMBER SIGNUP: ${userData.name || 'Anonymous Pirate'}`);
    
    // Determine their tier based on current member count
    const currentTier = this.determineSignupTier();
    
    if (!currentTier) {
      throw new Error('Sorry! All 10 million spots are filled. You missed the boat! 🚢');
    }
    
    // Create member profile
    const member = {
      id: crypto.randomBytes(16).toString('hex'),
      name: userData.name || `Pirate_${Date.now()}`,
      email: userData.email,
      referredBy: userData.referredBy || null,
      
      // SIGNUP BONUS (we pay them!)
      tier: currentTier.name,
      signupBonus: currentTier.signupBonus,
      perTaskRate: currentTier.perTaskBonus,
      
      // STARTING STATS
      stats: {
        totalEarned: currentTier.signupBonus, // Start with signup bonus!
        tasksCompleted: 0,
        dataContributed: 0,
        referralsMade: 0,
        level: 1,
        reputation: 100, // Start with good reputation
        streak: 0
      },
      
      // GAMIFICATION
      achievements: ['WELCOME_ABOARD'],
      badges: [currentTier.name],
      inventory: {
        credits: currentTier.signupBonus,
        tokens: 10, // Starting tokens
        items: ['Welcome Package', 'Starter Tools']
      },
      
      // PREFERENCES
      preferences: {
        taskTypes: userData.preferredTasks || ['DATA_ENTRY'],
        availability: userData.availability || 'part_time',
        skillLevel: userData.skillLevel || 'beginner'
      },
      
      joinedAt: Date.now(),
      lastActive: Date.now()
    };
    
    // Store member
    this.members.set(member.id, member);
    this.goals.currentPeople++;
    this.goals.currentTreasury += currentTier.signupBonus; // We paid them!
    
    // Process referral bonus
    if (userData.referredBy) {
      await this.processReferralBonus(userData.referredBy, member);
    }
    
    // Update scoreboards
    this.updateScoreboards();
    
    this.emit('member-joined', {
      member,
      tier: currentTier,
      signupBonus: currentTier.signupBonus,
      progressUpdate: this.getProgressUpdate()
    });
    
    console.log(`  💰 PAID ${member.name} $${currentTier.signupBonus} signup bonus!`);
    console.log(`  🎯 Progress: ${this.goals.currentPeople.toLocaleString()} / 10M people`);
    
    return member;
  }

  determineSignupTier() {
    const currentCount = this.goals.currentPeople;
    
    // Check each tier in order
    if (currentCount < this.paymentTiers.EARLY_BIRD.slots) {
      return { name: 'EARLY_BIRD', ...this.paymentTiers.EARLY_BIRD };
    } else if (currentCount < this.paymentTiers.EARLY_BIRD.slots + this.paymentTiers.PIONEER.slots) {
      return { name: 'PIONEER', ...this.paymentTiers.PIONEER };
    } else if (currentCount < this.paymentTiers.EARLY_BIRD.slots + this.paymentTiers.PIONEER.slots + this.paymentTiers.EXPLORER.slots) {
      return { name: 'EXPLORER', ...this.paymentTiers.EXPLORER };
    } else if (currentCount < 10_000_000) {
      return { name: 'CREW_MEMBER', ...this.paymentTiers.CREW_MEMBER };
    }
    
    return null; // All spots filled
  }

  // TASK SYSTEM - HOW THEY EARN MONEY
  async completeTask(memberId, taskType, taskData) {
    const member = this.members.get(memberId);
    if (!member) throw new Error('Member not found');
    
    const task = this.databaseTasks[taskType];
    if (!task) throw new Error('Invalid task type');
    
    // Calculate payment based on task and member tier
    const basePayment = member.perTaskRate;
    const taskMultiplier = this.getTaskMultiplier(taskType, taskData);
    const payment = basePayment * taskMultiplier;
    
    // Quality check
    const qualityScore = this.checkTaskQuality(taskType, taskData);
    const finalPayment = payment * (qualityScore / 100);
    
    // Update member stats
    member.stats.totalEarned += finalPayment;
    member.stats.tasksCompleted++;
    member.stats.dataContributed++;
    member.inventory.credits += finalPayment;
    member.lastActive = Date.now();
    
    // Update global stats
    this.goals.currentTreasury += finalPayment; // We paid them more!
    
    // Check for achievements
    await this.checkAchievements(member);
    
    // Update streak
    this.updateStreak(member);
    
    const taskResult = {
      taskType,
      payment: finalPayment,
      qualityScore,
      member: member.name,
      newTotal: member.stats.totalEarned,
      progressUpdate: this.getProgressUpdate()
    };
    
    this.emit('task-completed', taskResult);
    
    console.log(`💰 PAID ${member.name} $${finalPayment.toFixed(2)} for ${task.name}`);
    console.log(`  Quality Score: ${qualityScore}% | Total Earned: $${member.stats.totalEarned.toFixed(2)}`);
    
    return taskResult;
  }

  getTaskMultiplier(taskType, taskData) {
    // Different tasks have different base multipliers
    const multipliers = {
      DATA_ENTRY: 1.0,
      CONTENT_CREATION: 5.0,
      CODE_CONTRIBUTION: 20.0,
      RESEARCH_SCOUT: 3.0,
      QUALITY_CHECKER: 0.5,
      COMMUNITY_BUILDER: 2.0
    };
    
    const baseMultiplier = multipliers[taskType] || 1.0;
    
    // Bonus multipliers based on task complexity/size
    let complexityMultiplier = 1.0;
    if (taskData.complexity === 'high') complexityMultiplier = 2.0;
    if (taskData.complexity === 'expert') complexityMultiplier = 3.0;
    
    return baseMultiplier * complexityMultiplier;
  }

  checkTaskQuality(taskType, taskData) {
    // Simulate quality checking (in real system, this would be more sophisticated)
    let baseQuality = 70 + Math.random() * 30; // 70-100% base quality
    
    // Quality bonuses based on task type
    if (taskType === 'CODE_CONTRIBUTION' && taskData.hasTests) {
      baseQuality += 10;
    }
    if (taskType === 'CONTENT_CREATION' && taskData.wordCount > 500) {
      baseQuality += 5;
    }
    if (taskType === 'DATA_ENTRY' && taskData.verified) {
      baseQuality += 15;
    }
    
    return Math.min(100, baseQuality);
  }

  // REFERRAL SYSTEM - GET PAID FOR BRINGING FRIENDS
  async processReferralBonus(referrerId, newMember) {
    const referrer = Array.from(this.members.values())
      .find(m => m.id === referrerId || m.email === referrerId);
    
    if (!referrer) return;
    
    // Referral bonuses based on referrer's tier
    const referralBonuses = {
      EARLY_BIRD: 50,
      PIONEER: 30,
      EXPLORER: 20,
      CREW_MEMBER: 10
    };
    
    const bonus = referralBonuses[referrer.tier] || 10;
    
    // Pay the referrer
    referrer.stats.totalEarned += bonus;
    referrer.stats.referralsMade++;
    referrer.inventory.credits += bonus;
    
    // Pay the new member a bonus too
    newMember.stats.totalEarned += bonus * 0.5;
    newMember.inventory.credits += bonus * 0.5;
    
    // Update treasury
    this.goals.currentTreasury += bonus * 1.5; // Total cost of both bonuses
    
    this.emit('referral-bonus', {
      referrer: referrer.name,
      newMember: newMember.name,
      referrerBonus: bonus,
      newMemberBonus: bonus * 0.5
    });
    
    console.log(`🎁 REFERRAL BONUS: ${referrer.name} gets $${bonus}, ${newMember.name} gets $${bonus * 0.5}`);
  }

  initializeAchievements() {
    return {
      WELCOME_ABOARD: { 
        name: 'Welcome Aboard!', 
        description: 'Joined the crew', 
        reward: 10,
        icon: '⚓' 
      },
      FIRST_TASK: { 
        name: 'First Contribution', 
        description: 'Completed first task', 
        reward: 25,
        icon: '🎯' 
      },
      TASK_STREAK_5: { 
        name: 'Dedicated Pirate', 
        description: 'Completed 5 tasks in a row', 
        reward: 50,
        icon: '🔥' 
      },
      RECRUITER: { 
        name: 'Recruiter', 
        description: 'Referred 5 new members', 
        reward: 100,
        icon: '📢' 
      },
      DATA_MASTER: { 
        name: 'Data Master', 
        description: 'Contributed 100 data entries', 
        reward: 200,
        icon: '📊' 
      },
      QUALITY_CHAMPION: { 
        name: 'Quality Champion', 
        description: 'Maintained 95%+ quality for 20 tasks', 
        reward: 300,
        icon: '👑' 
      }
    };
  }

  async checkAchievements(member) {
    const newAchievements = [];
    
    // Check various achievement conditions
    if (member.stats.tasksCompleted === 1 && !member.achievements.includes('FIRST_TASK')) {
      newAchievements.push('FIRST_TASK');
    }
    
    if (member.stats.streak >= 5 && !member.achievements.includes('TASK_STREAK_5')) {
      newAchievements.push('TASK_STREAK_5');
    }
    
    if (member.stats.referralsMade >= 5 && !member.achievements.includes('RECRUITER')) {
      newAchievements.push('RECRUITER');
    }
    
    if (member.stats.dataContributed >= 100 && !member.achievements.includes('DATA_MASTER')) {
      newAchievements.push('DATA_MASTER');
    }
    
    // Award achievements
    for (const achievement of newAchievements) {
      member.achievements.push(achievement);
      const achievementData = this.achievements[achievement];
      
      // Pay achievement bonus
      member.stats.totalEarned += achievementData.reward;
      member.inventory.credits += achievementData.reward;
      this.goals.currentTreasury += achievementData.reward;
      
      this.emit('achievement-unlocked', {
        member: member.name,
        achievement: achievementData.name,
        reward: achievementData.reward,
        icon: achievementData.icon
      });
      
      console.log(`🏆 ${member.name} unlocked: ${achievementData.icon} ${achievementData.name} (+$${achievementData.reward})`);
    }
  }

  updateStreak(member) {
    const now = Date.now();
    const lastActive = member.lastActive;
    const hoursSinceLastActivity = (now - lastActive) / (1000 * 60 * 60);
    
    if (hoursSinceLastActivity <= 24) {
      member.stats.streak++;
    } else {
      member.stats.streak = 1; // Reset streak
    }
  }

  // LEADERBOARDS AND SCOREBOARDS
  updateScoreboards() {
    this.scoreboards.peopleProgress = (this.goals.currentPeople / this.goals.targetPeople) * 100;
    this.scoreboards.treasuryProgress = (this.goals.currentTreasury / this.goals.targetTreasury) * 100;
    
    // Update daily stats
    const today = new Date().toDateString();
    if (!this.dailyStats.has(today)) {
      this.dailyStats.set(today, { joins: 0, contributions: 0, payments: 0 });
    }
  }

  getLeaderboards() {
    const members = Array.from(this.members.values());
    
    return {
      topEarners: members
        .sort((a, b) => b.stats.totalEarned - a.stats.totalEarned)
        .slice(0, 10)
        .map(m => ({
          name: m.name,
          tier: m.tier,
          totalEarned: m.stats.totalEarned,
          tasksCompleted: m.stats.tasksCompleted
        })),
      
      topContributors: members
        .sort((a, b) => b.stats.dataContributed - a.stats.dataContributed)
        .slice(0, 10)
        .map(m => ({
          name: m.name,
          tier: m.tier,
          dataContributed: m.stats.dataContributed,
          totalEarned: m.stats.totalEarned
        })),
      
      topRecruiters: members
        .sort((a, b) => b.stats.referralsMade - a.stats.referralsMade)
        .slice(0, 10)
        .map(m => ({
          name: m.name,
          tier: m.tier,
          referralsMade: m.stats.referralsMade,
          totalEarned: m.stats.totalEarned
        }))
    };
  }

  // PROGRESS TRACKING
  getProgressUpdate() {
    return {
      people: {
        current: this.goals.currentPeople,
        target: this.goals.targetPeople,
        percentage: this.scoreboards.peopleProgress.toFixed(2)
      },
      treasury: {
        current: this.goals.currentTreasury,
        target: this.goals.targetTreasury,
        percentage: this.scoreboards.treasuryProgress.toFixed(2)
      },
      remaining: {
        peopleNeeded: this.goals.targetPeople - this.goals.currentPeople,
        treasuryNeeded: this.goals.targetTreasury - this.goals.currentTreasury
      }
    };
  }

  setupDailyTracking() {
    // Reset daily stats at midnight
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.scoreboards.dailyJoins = 0;
        this.scoreboards.dailyContributions = 0;
      }
    }, 60000); // Check every minute
  }

  startGamificationSystems() {
    // Daily bonuses, special events, etc.
    setInterval(() => {
      this.triggerDailyEvent();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  triggerDailyEvent() {
    const events = [
      'double_payment_day',
      'bonus_achievement_day',
      'referral_boost',
      'quality_bonus'
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    
    console.log(`🎉 DAILY EVENT: ${event.replace('_', ' ').toUpperCase()}`);
    this.emit('daily-event', { type: event });
  }

  // EASY CLI INTERFACE
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'status':
        const progress = this.getProgressUpdate();
        const leaderboards = this.getLeaderboards();
        
        console.log('🔄 REVERSE FUNNEL ONE PIECE STATUS:');
        console.log(`\n👥 PEOPLE PROGRESS:`);
        console.log(`   Current: ${progress.people.current.toLocaleString()} / ${progress.people.target.toLocaleString()}`);
        console.log(`   Progress: ${progress.people.percentage}%`);
        console.log(`   Remaining: ${progress.remaining.peopleNeeded.toLocaleString()} people needed`);
        
        console.log(`\n💰 TREASURY PROGRESS (We've PAID Out):`);
        console.log(`   Current: $${progress.treasury.current.toLocaleString()}`);
        console.log(`   Target: $${progress.treasury.target.toLocaleString()}`);
        console.log(`   Progress: ${progress.treasury.percentage}%`);
        console.log(`   Remaining: $${progress.remaining.treasuryNeeded.toLocaleString()} to pay out`);
        
        console.log(`\n🏆 TOP EARNERS:`);
        leaderboards.topEarners.slice(0, 5).forEach((member, i) => {
          console.log(`   ${i + 1}. ${member.name} (${member.tier}): $${member.totalEarned.toFixed(2)}`);
        });
        
        console.log(`\n📊 TOP CONTRIBUTORS:`);
        leaderboards.topContributors.slice(0, 5).forEach((member, i) => {
          console.log(`   ${i + 1}. ${member.name}: ${member.dataContributed} contributions`);
        });
        break;
        
      case 'join':
        const name = args[1] || 'Test Pirate';
        const email = args[2] || 'test@example.com';
        const referredBy = args[3] || null;
        
        try {
          const member = await this.easySignup({ name, email, referredBy });
          console.log('🎉 WELCOME TO THE CREW!');
          console.log(`   Name: ${member.name}`);
          console.log(`   Tier: ${member.tier}`);
          console.log(`   Signup Bonus: $${member.signupBonus}`);
          console.log(`   Per-Task Rate: $${member.perTaskRate}`);
          console.log(`   Member ID: ${member.id}`);
          console.log(`\n💰 You've been PAID $${member.signupBonus} just for joining!`);
        } catch (error) {
          console.log(`❌ ${error.message}`);
        }
        break;
        
      case 'task':
        const memberId = args[1];
        const taskType = args[2] || 'DATA_ENTRY';
        
        if (!memberId) {
          console.log('❌ Please provide member ID');
          return;
        }
        
        try {
          const result = await this.completeTask(memberId, taskType, {
            complexity: 'medium',
            verified: true,
            wordCount: 300
          });
          
          console.log('💰 TASK COMPLETED!');
          console.log(`   Payment: $${result.payment.toFixed(2)}`);
          console.log(`   Quality Score: ${result.qualityScore}%`);
          console.log(`   New Total: $${result.newTotal.toFixed(2)}`);
        } catch (error) {
          console.log(`❌ ${error.message}`);
        }
        break;
        
      case 'member':
        const memberIdOrEmail = args[1];
        const member = this.members.get(memberIdOrEmail) || 
                      Array.from(this.members.values()).find(m => m.email === memberIdOrEmail);
        
        if (!member) {
          console.log('❌ Member not found');
          return;
        }
        
        console.log(`👤 MEMBER PROFILE: ${member.name}`);
        console.log(`   Tier: ${member.tier}`);
        console.log(`   Total Earned: $${member.stats.totalEarned.toFixed(2)}`);
        console.log(`   Tasks Completed: ${member.stats.tasksCompleted}`);
        console.log(`   Data Contributed: ${member.stats.dataContributed}`);
        console.log(`   Referrals Made: ${member.stats.referralsMade}`);
        console.log(`   Current Streak: ${member.stats.streak}`);
        console.log(`   Achievements: ${member.achievements.join(', ')}`);
        console.log(`   Credits: ${member.inventory.credits}`);
        break;
        
      case 'tiers':
        console.log('🎯 PAYMENT TIERS (We Pay YOU!):\n');
        Object.entries(this.paymentTiers).forEach(([tier, data]) => {
          const remaining = data.slots - (this.goals.currentPeople >= data.slots ? data.slots : Math.max(0, this.goals.currentPeople));
          console.log(`${tier}:`);
          console.log(`   Signup Bonus: $${data.signupBonus}`);
          console.log(`   Per Task: $${data.perTaskBonus}`);
          console.log(`   Remaining Slots: ${remaining.toLocaleString()}`);
          console.log(`   Description: ${data.description}\n`);
        });
        break;
        
      case 'tasks':
        console.log('💼 AVAILABLE TASKS (Get PAID!):\n');
        Object.entries(this.databaseTasks).forEach(([taskType, task]) => {
          console.log(`${task.name}:`);
          console.log(`   Pay Rate: ${task.payRate}`);
          console.log(`   Difficulty: ${task.difficulty}`);
          console.log(`   Time: ${task.timeEstimate}`);
          console.log(`   Examples: ${task.examples.join(', ')}\n`);
        });
        break;
        
      case 'demo':
        console.log('🎬 REVERSE FUNNEL ONE PIECE DEMO\n');
        
        console.log('💰 THE REVERSE FUNNEL CONCEPT:');
        console.log('   🔄 Instead of people paying US, WE PAY THEM!');
        console.log('   👥 First 10 million people get paid to join');
        console.log('   💼 They help build our database by doing tasks');
        console.log('   🏆 Together we reach $1 billion treasure goal');
        console.log('   📈 Everyone wins - they get paid, we get data\n');
        
        console.log('🎯 THE SCOREBOARDS:');
        console.log('   📊 People Progress: X / 10,000,000 joined');
        console.log('   💰 Treasury Progress: $X / $1,000,000,000 paid out');
        console.log('   🏁 Goal: When both hit 100%, we found the One Piece!\n');
        
        console.log('💸 PAYMENT TIERS:');
        console.log('   🥇 First 100K: $100 signup + $5/task');
        console.log('   🥈 Next 900K: $50 signup + $3/task');
        console.log('   🥉 Next 4M: $25 signup + $2/task');
        console.log('   👥 Last 5M: $10 signup + $1/task\n');
        
        console.log('💼 HOW THEY EARN:');
        console.log('   📝 Data Entry: $2-5 per entry');
        console.log('   ✍️ Content Creation: $10-50 per piece');
        console.log('   💻 Code Contribution: $25-200 per contribution');
        console.log('   🔍 Research: $5-25 per task');
        console.log('   ✅ Quality Checking: $1-3 per review');
        console.log('   👥 Community Building: $5-20 per referral\n');
        
        console.log('🎮 GAMIFICATION:');
        console.log('   🏆 Achievements with cash rewards');
        console.log('   🔥 Streaks and bonuses');
        console.log('   📢 Referral bonuses');
        console.log('   🏅 Leaderboards and competitions');
        console.log('   🎁 Daily events and special bonuses\n');
        
        console.log('🚀 THE GENIUS:');
        console.log('   💡 People WANT to join because they get PAID');
        console.log('   📊 We get valuable data and contributions');
        console.log('   🏴‍☠️ Together we build toward $1B treasure');
        console.log('   🎯 Win-win: They earn money, we get database');
        console.log('   📈 Viral growth because people refer for bonuses');
        
        // Demo signup
        console.log('\n🎬 Demo Signup:');
        const demoMember = await this.easySignup({ 
          name: 'Demo Pirate', 
          email: 'demo@example.com' 
        });
        console.log(`✅ Demo member created and PAID $${demoMember.signupBonus}!`);
        break;
        
      case 'viral':
        console.log('🚀 VIRAL GROWTH STRATEGIES:\n');
        
        console.log('💰 REVERSE FUNNEL PSYCHOLOGY:');
        console.log('   • "Get PAID to join" is irresistible');
        console.log('   • People share because referral bonuses');
        console.log('   • FOMO on limited tier slots');
        console.log('   • Social proof from leaderboards\n');
        
        console.log('📢 MARKETING MESSAGES:');
        console.log('   • "First 100K get $100 just for signing up!"');
        console.log('   • "Help us find $1 billion treasure and get paid!"');
        console.log('   • "Limited spots - only 10 million pirates wanted"');
        console.log('   • "Your friends will thank you for the referral bonus"\n');
        
        console.log('🎯 CONVERSION TACTICS:');
        console.log('   • Real-time counter showing spots filling up');
        console.log('   • Tier urgency: "Only X slots left in EARLY_BIRD"');
        console.log('   • Social proof: "X people joined today"');
        console.log('   • Immediate gratification: Pay signup bonus instantly');
        break;

      default:
        console.log(`
🔄 REVERSE FUNNEL ONE PIECE SYSTEM

Usage:
  node reverse-funnel-one-piece.js status                    # System status
  node reverse-funnel-one-piece.js join [name] [email] [referrer]  # Join and get PAID!
  node reverse-funnel-one-piece.js task [memberID] [taskType]      # Complete task for money
  node reverse-funnel-one-piece.js member [memberID]              # Member profile
  node reverse-funnel-one-piece.js tiers                          # Payment tiers
  node reverse-funnel-one-piece.js tasks                          # Available tasks
  node reverse-funnel-one-piece.js demo                           # Demo explanation
  node reverse-funnel-one-piece.js viral                          # Viral growth strategies

🎯 THE REVERSE FUNNEL:
  Instead of charging people, WE PAY THEM to join and contribute!
  
📊 DUAL SCOREBOARDS:
  👥 People: X / 10,000,000 joined
  💰 Treasury: $X / $1,000,000,000 paid out
  
🏆 GOAL: When both hit 100%, we found the One Piece!

💸 WE PAY YOU:
  • $10-100 signup bonus (tier dependent)
  • $1-5 per task completed
  • Referral bonuses
  • Achievement rewards
  • Quality bonuses

💼 EARN MONEY BY:
  • Data entry and research
  • Content creation
  • Code contributions  
  • Quality checking
  • Community building
  • Recruiting friends

🚀 WHY IT WORKS:
  • People LOVE getting paid to join
  • Viral referral bonuses
  • FOMO on limited spots
  • Win-win: They earn, we get data
        `);
    }
  }
}

// Export the system
module.exports = { ReverseFunnelOnePiece };

// Launch if run directly
if (require.main === module) {
  const reverseFunnel = new ReverseFunnelOnePiece();
  reverseFunnel.cli().catch(console.error);
}