#!/usr/bin/env node

/**
 * LEFTONREADBYGOD CRINGEPROOF ROASTING BUDGET AI
 * The AI that keeps it real while helping you get your shit together
 * Roasts your spending habits, filters cringe, actually useful financial advice
 * Speech layer + randomizing game engine economy = brutal honesty meets real help
 */

const fs = require('fs').promises;
const crypto = require('crypto');
const { EventEmitter } = require('events');

console.log(`
💀🔥 LEFTONREADBYGOD CRINGEPROOF ROASTING AI 🔥💀
No Cap Budget Helper → Cringe Filter → Reality Check → Actually Useful → Keeps It 100
`);

class LeftOnReadCringeproofRoastingBudgetAI extends EventEmitter {
  constructor() {
    super();
    this.roastDatabase = new Map();
    this.cringeFilters = new Map();
    this.brutalhonesty = new Map();
    this.budgetRoaster = new Map();
    this.speechLayers = new Map();
    this.gameEconomy = new Map();
    this.utilityEngine = new Map();
    this.personalityModes = new Map();
    
    this.initializeRoastingAI();
  }

  async initializeRoastingAI() {
    console.log('💀 Initializing brutally honest AI assistant...');
    
    // Set up roasting database
    await this.setupRoastingDatabase();
    
    // Initialize cringe filters
    await this.initializeCringeFilters();
    
    // Create brutal honesty engine
    await this.createBrutalHonestyEngine();
    
    // Build budget roasting system
    await this.buildBudgetRoastingSystem();
    
    // Initialize speech personality layers
    await this.initializeSpeechLayers();
    
    // Create game economy randomizer
    await this.createGameEconomyRandomizer();
    
    // Set up actual utility functions
    await this.setupUtilityFunctions();
    
    // Initialize personality modes
    await this.initializePersonalityModes();
    
    console.log('✅ Roasting AI ready - keeping it real since initialization!');
  }

  async setupRoastingDatabase() {
    console.log('🔥 Loading roast database...');
    
    const roastTemplates = {
      'spending_roasts': {
        subscription_services: [
          "Bro you got 47 subscriptions and use 3 of them. Netflix AND Hulu AND Disney+ AND HBO? Pick a lane fam 💀",
          "Another subscription? What's next, subscribing to air? Oh wait, you probably would 🤡",
          "You paying $200/month for streaming services but eating ramen. Make it make sense 📺🍜",
          "Subscribing to a gym you haven't visited since January? That's not a membership, that's a donation 🏋️‍♂️"
        ],
        
        food_delivery: [
          "DoorDash again? Your delivery driver knows your order better than your mom knows you 🚗",
          "$35 for a $12 burrito because you couldn't walk 5 minutes? CEO behavior but with intern money 🌯",
          "You've spent $847 on delivery fees this month. That's a whole ass rent payment to avoid cooking 👨‍🍳",
          "Uber Eats at 2am for the 4th time this week? Your bank account is begging for mercy 😭"
        ],
        
        impulse_purchases: [
          "Another gaming chair? Bro you can only sit in one at a time, this ain't musical chairs 🪑",
          "You bought HOW many mechanical keyboards? Your typing speed still trash though 💀",
          "RGB everything doesn't make you a better gamer, just a broker one 🌈",
          "That Supreme brick was $300? And you wonder why you're broke. It's literally a brick 🧱"
        ]
      },
      
      'savings_roasts': {
        no_savings: [
          "Savings account balance: $3.47. That's not savings, that's pocket lint 🪙",
          "You saving money like a colander holds water - it don't 💧",
          "Emergency fund? Your emergency plan is hoping nothing bad happens 🚨",
          "Living paycheck to paycheck but got a $1200 phone. Priorities looking real questionable 📱"
        ],
        
        bad_investments: [
          "You bought crypto at the peak? Congratulations, you played yourself 📉",
          "NFT collection worth less than the electricity to view it. Digital L collector 🖼️",
          "Your investment strategy is 'trust me bro' and it shows 📊",
          "Putting money in meme stocks because Reddit said so? Financial advisor = u/DegenGambler420 🤡"
        ]
      },
      
      'lifestyle_roasts': {
        flexing_while_broke: [
          "Designer clothes but taking the bus? Gucci belt, but Google Maps for directions to the food bank 👔",
          "Posting vacation pics from 2019 like we don't know you been home since 📸",
          "Flexing a lifestyle you can't afford is just cosplaying as rich 🎭",
          "Your Instagram says CEO but your bank account says intern 📱💰"
        ]
      }
    };
    
    for (const [category, roasts] of Object.entries(roastTemplates)) {
      this.roastDatabase.set(category, roasts);
    }
  }

  async initializeCringeFilters() {
    console.log('🚫 Setting up cringe filters...');
    
    const cringePatterns = {
      'financial_cringe': {
        patterns: [
          /i'm bad with money teehee/i,
          /adulting is hard/i,
          /treat myself/i,
          /yolo/i,
          /money doesn't buy happiness/i,
          /i deserve this/i,
          /retail therapy/i
        ],
        
        replacements: {
          "i'm bad with money teehee": "I lack financial discipline and it's costing me",
          "adulting is hard": "I need to take responsibility for my finances",
          "treat myself": "impulse purchase I'll regret in 3 days",
          "yolo": "I'm justifying poor financial decisions",
          "money doesn't buy happiness": "but being broke definitely buys stress",
          "i deserve this": "I want this but can't afford it",
          "retail therapy": "spending money I don't have to feel temporarily better"
        }
      },
      
      'excuse_detection': {
        common_excuses: [
          "I'll start saving next month",
          "I don't make enough to save",
          "Investing is too complicated",
          "I'll figure it out later",
          "I need to enjoy life"
        ],
        
        reality_checks: {
          "I'll start saving next month": "You said that 6 months ago. Start TODAY with $10",
          "I don't make enough to save": "You spent $127 on coffee last month. That's savings.",
          "Investing is too complicated": "So is being broke at 65. YouTube exists, use it.",
          "I'll figure it out later": "Later is now. You're already late.",
          "I need to enjoy life": "Enjoy ramen at 70 because you 'enjoyed' too much at 25?"
        }
      }
    };
    
    for (const [filter, config] of Object.entries(cringePatterns)) {
      this.cringeFilters.set(filter, config);
    }
  }

  async createBrutalHonestyEngine() {
    console.log('💯 Creating brutal honesty engine...');
    
    const honestyEngine = {
      analyze_spending: async (transactions) => {
        const analysis = {
          total_waste: 0,
          stupid_purchases: [],
          recurring_mistakes: [],
          reality_check: '',
          action_items: []
        };
        
        // Analyze each transaction
        for (const transaction of transactions) {
          if (this.isStupidPurchase(transaction)) {
            analysis.stupid_purchases.push({
              item: transaction.description,
              amount: transaction.amount,
              roast: this.generateRoast(transaction)
            });
            analysis.total_waste += transaction.amount;
          }
        }
        
        // Generate reality check
        analysis.reality_check = `You wasted $${analysis.total_waste} this month. That's ${Math.floor(analysis.total_waste / 15)} hours of work after taxes. Was it worth it?`;
        
        // Action items (actually helpful)
        analysis.action_items = [
          `Cancel ${analysis.stupid_purchases.length} subscriptions you don't use`,
          `Cook meals for a week - save $${Math.floor(analysis.total_waste * 0.3)}`,
          `Set up automatic transfer to savings - even $50/month`,
          `Delete food delivery apps for 30 days`,
          `Track every expense for a week - reality check incoming`
        ];
        
        return analysis;
      },
      
      give_advice: async (situation) => {
        // Mix roasting with actual useful advice
        const advice = {
          roast: this.getContextualRoast(situation),
          real_talk: this.getRealAdvice(situation),
          action_plan: this.createActionPlan(situation),
          resources: this.getHelpfulResources(situation)
        };
        
        return advice;
      }
    };
    
    this.brutalhonesty.set('engine', honestyEngine);
  }

  async buildBudgetRoastingSystem() {
    console.log('💰 Building budget roasting system...');
    
    const budgetRoaster = {
      roast_budget: async (income, expenses) => {
        const roasts = [];
        const advice = [];
        
        // Calculate ratios
        const savingsRate = (income - expenses) / income;
        const housingRatio = expenses.housing / income;
        const funMoneyRatio = expenses.entertainment / income;
        
        // Roast based on ratios
        if (savingsRate < 0) {
          roasts.push("You spending more than you make? That's not a budget, that's a countdown to bankruptcy 💸");
          advice.push("Cut expenses by 20% immediately or get a second job. No other options.");
        }
        
        if (savingsRate < 0.1) {
          roasts.push(`Saving ${(savingsRate * 100).toFixed(1)}%? My guy, that's not savings, that's a rounding error 🤏`);
          advice.push("Minimum 20% savings rate or you're playing yourself. Start with 10% this month.");
        }
        
        if (housingRatio > 0.3) {
          roasts.push("Spending over 30% on housing? You house poor and regular poor 🏠");
          advice.push("Get a roommate, move somewhere cheaper, or make more money. Pick one.");
        }
        
        if (funMoneyRatio > 0.2) {
          roasts.push("20%+ on entertainment? You entertaining yourself into poverty 🎮");
          advice.push("Cut entertainment spending in half. Your future self will thank you.");
        }
        
        return { roasts, advice };
      },
      
      create_real_budget: async (income, goals) => {
        // Actually useful budget creation
        const budget = {
          needs: income * 0.5,  // 50% for needs
          wants: income * 0.3,  // 30% for wants
          savings: income * 0.2, // 20% for savings
          
          breakdown: {
            housing: income * 0.25,
            food: income * 0.12,
            transport: income * 0.13,
            entertainment: income * 0.10,
            savings_invest: income * 0.15,
            emergency_fund: income * 0.05,
            debt_payment: income * 0.10,
            misc: income * 0.10
          },
          
          weekly_allowance: income * 0.30 / 4,
          daily_limit: income * 0.30 / 30
        };
        
        return budget;
      }
    };
    
    this.budgetRoaster.set('system', budgetRoaster);
  }

  async initializeSpeechLayers() {
    console.log('🗣️ Initializing speech personality layers...');
    
    const speechPersonalities = {
      'hood_financial_advisor': {
        greeting: "Yo what's good, I see you still broke 💀",
        advice_style: "straight_facts_no_filter",
        motivation: "We gonna get this bread but first stop wasting it",
        goodbye: "Aight bet, don't come back until you saved something"
      },
      
      'disappointed_parent': {
        greeting: "We need to talk about your spending...",
        advice_style: "guilt_trip_with_love",
        motivation: "I'm not mad, just disappointed in your financial choices",
        goodbye: "Call me when you have a savings account"
      },
      
      'gen_z_bestie': {
        greeting: "Bestie... your bank account is giving broke 😭",
        advice_style: "supportive_but_real",
        motivation: "No cap, we're gonna glow up your finances fr fr",
        goodbye: "Period! Now go make better choices queen/king"
      },
      
      'corporate_savage': {
        greeting: "Per my last email, you're still financially irresponsible",
        advice_style: "professional_destruction",
        motivation: "Let's circle back on why you can't afford retirement",
        goodbye: "I'll follow up next month to see if you're still poor"
      }
    };
    
    for (const [personality, config] of Object.entries(speechPersonalities)) {
      this.speechLayers.set(personality, config);
    }
  }

  async createGameEconomyRandomizer() {
    console.log('🎮 Creating game economy randomizer...');
    
    const gameifiedBudgeting = {
      'financial_rpg': {
        generate_quest: () => {
          const quests = [
            {
              name: "The No-Spend Dungeon",
              objective: "Survive 7 days without unnecessary purchases",
              reward: "$50 to savings account",
              difficulty: "⭐⭐⭐"
            },
            {
              name: "Subscription Slayer",
              objective: "Cancel 3 unused subscriptions",
              reward: "Monthly savings +$45",
              difficulty: "⭐⭐"
            },
            {
              name: "Meal Prep Warrior",
              objective: "Cook all meals for a week",
              reward: "$120 saved from not ordering out",
              difficulty: "⭐⭐⭐⭐"
            },
            {
              name: "Side Hustle Hero",
              objective: "Earn $200 extra this month",
              reward: "Unlock investment account",
              difficulty: "⭐⭐⭐⭐⭐"
            }
          ];
          
          return quests[Math.floor(Math.random() * quests.length)];
        },
        
        calculate_score: (savings, spending, goals) => {
          const score = {
            level: Math.floor(savings / 1000) + 1,
            xp: savings % 1000,
            achievements: [],
            rank: this.getFinancialRank(savings)
          };
          
          if (spending < goals.spending_limit) {
            score.achievements.push("🏆 Under Budget Champion");
          }
          if (savings > goals.savings_target) {
            score.achievements.push("💎 Savings Superstar");
          }
          
          return score;
        }
      },
      
      'budget_battle_royale': {
        opponents: [
          { name: "Impulse Purchase Ivan", weakness: "planning", strength: "temptation" },
          { name: "Subscription Sarah", weakness: "auditing", strength: "recurring damage" },
          { name: "FOMO Fred", weakness: "patience", strength: "social pressure" },
          { name: "Debt Dragon", weakness: "consistent payments", strength: "compound interest" }
        ],
        
        battle_strategy: (opponent, userStrength) => {
          const strategies = {
            planning: "Create a 24-hour wait rule before any purchase",
            auditing: "Review all monthly charges, cancel the dead weight",
            patience: "Remember: Missing out > Being broke",
            payments: "Automate minimum payments + extra when possible"
          };
          
          return strategies[opponent.weakness];
        }
      }
    };
    
    this.gameEconomy.set('systems', gameifiedBudgeting);
  }

  async interact(userInput, financialData = null) {
    console.log('\n💀 LEFTONREADBYGOD AI ACTIVATED 💀\n');
    
    // Filter cringe from input
    const filteredInput = await this.filterCringe(userInput);
    console.log(`You said: "${userInput}"`);
    if (filteredInput !== userInput) {
      console.log(`What you really meant: "${filteredInput}"`);
    }
    
    // Choose random personality
    const personalities = Array.from(this.speechLayers.keys());
    const personality = personalities[Math.floor(Math.random() * personalities.length)];
    const persona = this.speechLayers.get(personality);
    
    console.log(`\n[${personality.toUpperCase()} MODE ACTIVATED]`);
    console.log(`\n${persona.greeting}\n`);
    
    // Analyze request
    if (userInput.toLowerCase().includes('budget')) {
      await this.handleBudgetRequest(financialData, persona);
    } else if (userInput.toLowerCase().includes('save')) {
      await this.handleSavingsRequest(financialData, persona);
    } else if (userInput.toLowerCase().includes('spend')) {
      await this.handleSpendingAnalysis(financialData, persona);
    } else if (userInput.toLowerCase().includes('help')) {
      await this.provideActualHelp(persona);
    } else {
      console.log("Idk what you want but your financial situation probably still trash 🤷‍♂️");
    }
    
    // Add gamification
    const quest = this.gameEconomy.get('systems').financial_rpg.generate_quest();
    console.log('\n🎮 DAILY QUEST UNLOCKED:');
    console.log(`📜 ${quest.name} ${quest.difficulty}`);
    console.log(`🎯 ${quest.objective}`);
    console.log(`💰 Reward: ${quest.reward}`);
    
    console.log(`\n${persona.goodbye}\n`);
  }

  async filterCringe(input) {
    const filters = this.cringeFilters.get('financial_cringe');
    let filtered = input;
    
    for (const [cringe, replacement] of Object.entries(filters.replacements)) {
      const regex = new RegExp(cringe, 'gi');
      filtered = filtered.replace(regex, replacement);
    }
    
    return filtered;
  }

  isStupidPurchase(transaction) {
    const stupidCategories = ['games', 'entertainment', 'fastfood', 'subscription'];
    const stupidMerchants = ['uber eats', 'doordash', 'onlyfans', 'twitch'];
    
    return stupidCategories.some(cat => transaction.category?.includes(cat)) ||
           stupidMerchants.some(merch => transaction.description?.toLowerCase().includes(merch));
  }

  generateRoast(transaction) {
    const roastsByCategory = {
      games: "Another game you'll play for 2 hours? Your Steam library looking like a graveyard 🎮💀",
      entertainment: "Entertainment budget looking like a celebrity's while your savings looking like mine 📺",
      fastfood: "Fast food again? Your arteries crying and your wallet empty 🍔",
      subscription: "Another subscription? You collecting them like Pokemon cards 📱"
    };
    
    return roastsByCategory[transaction.category] || "This purchase was dumb and you know it 🤡";
  }

  getFinancialRank(savings) {
    if (savings < 100) return "Broke Boi";
    if (savings < 1000) return "Penny Pincher";
    if (savings < 5000) return "Budget Boss";
    if (savings < 10000) return "Savings Samurai";
    if (savings < 50000) return "Wealth Warrior";
    return "Money Master";
  }

  async handleBudgetRequest(financialData, persona) {
    console.log("Aight lemme look at your budget real quick...\n");
    
    const mockData = financialData || {
      income: 4000,
      expenses: {
        housing: 1400,
        food: 800,
        transport: 400,
        entertainment: 600,
        misc: 700
      }
    };
    
    const totalExpenses = Object.values(mockData.expenses).reduce((a, b) => a + b, 0);
    const result = await this.budgetRoaster.get('system').roast_budget(mockData.income, mockData.expenses);
    
    console.log("📊 YOUR BUDGET BREAKDOWN:");
    console.log(`Income: $${mockData.income}`);
    console.log(`Expenses: $${totalExpenses}`);
    console.log(`Left over: $${mockData.income - totalExpenses} (that's it? 😬)`);
    
    console.log("\n🔥 ROASTS:");
    result.roasts.forEach(roast => console.log(`- ${roast}`));
    
    console.log("\n💡 REAL ADVICE THO:");
    result.advice.forEach(advice => console.log(`- ${advice}`));
    
    const betterBudget = await this.budgetRoaster.get('system').create_real_budget(mockData.income);
    console.log("\n✅ HERE'S WHAT YOUR BUDGET SHOULD LOOK LIKE:");
    console.log(`Housing: $${betterBudget.breakdown.housing} (25%)`);
    console.log(`Food: $${betterBudget.breakdown.food} (12%)`);
    console.log(`Savings: $${betterBudget.breakdown.savings_invest} (15%)`);
    console.log(`Fun Money: $${betterBudget.weekly_allowance}/week MAX`);
  }

  async handleSavingsRequest(financialData, persona) {
    console.log("Savings? What savings? 💀 Let's see...\n");
    
    const savingsRoasts = this.roastDatabase.get('savings_roasts').no_savings;
    const randomRoast = savingsRoasts[Math.floor(Math.random() * savingsRoasts.length)];
    
    console.log(`🔥 ${randomRoast}\n`);
    
    console.log("💯 REAL TALK - Here's how to actually save:");
    console.log("1. Set up automatic transfer the DAY you get paid");
    console.log("2. Start with $50 if that's all you got");
    console.log("3. Hide the savings account from your banking app");
    console.log("4. Pretend that money doesn't exist");
    console.log("5. Thank me when you got 3 months expenses saved");
    
    console.log("\n🎯 SAVINGS CHALLENGE:");
    console.log("Week 1: Save $25");
    console.log("Week 2: Save $50");
    console.log("Week 3: Save $75");
    console.log("Week 4: Save $100");
    console.log("Total: $250 in one month. If you can't do this, you not trying.");
  }

  async handleSpendingAnalysis(financialData, persona) {
    console.log("Oh you wanna know about your spending? Buckle up buttercup 🎢\n");
    
    const mockTransactions = [
      { description: "Netflix", amount: 15.99, category: "subscription" },
      { description: "Uber Eats", amount: 47.83, category: "fastfood" },
      { description: "Steam Game", amount: 59.99, category: "games" },
      { description: "DoorDash", amount: 38.45, category: "fastfood" },
      { description: "Twitch Sub", amount: 4.99, category: "entertainment" }
    ];
    
    const analysis = await this.brutalhonesty.get('engine').analyze_spending(mockTransactions);
    
    console.log("🗑️ YOUR WASTEFUL SPENDING:");
    analysis.stupid_purchases.forEach(purchase => {
      console.log(`- ${purchase.item}: $${purchase.amount}`);
      console.log(`  ${purchase.roast}`);
    });
    
    console.log(`\n💸 ${analysis.reality_check}`);
    
    console.log("\n✅ DO THIS INSTEAD:");
    analysis.action_items.forEach(item => console.log(`- ${item}`));
  }

  async provideActualHelp(persona) {
    console.log("You actually want help? Bet. Here's the REAL financial advice:\n");
    
    console.log("🎯 THE NO-BS FINANCIAL PLAN:");
    console.log("\n1️⃣ EMERGENCY FUND");
    console.log("   - $1000 minimum ASAP");
    console.log("   - Then 3-6 months expenses");
    console.log("   - This ain't investment money, it's 'oh shit' money");
    
    console.log("\n2️⃣ KILL HIGH-INTEREST DEBT");
    console.log("   - Credit cards first (that 24% APR eating you alive)");
    console.log("   - Personal loans next");
    console.log("   - Student loans can wait if rate is low");
    
    console.log("\n3️⃣ AUTOMATE EVERYTHING");
    console.log("   - Bills on autopay");
    console.log("   - Savings on auto-transfer");
    console.log("   - Investments on auto-deposit");
    console.log("   - Remove the option to be stupid");
    
    console.log("\n4️⃣ INVEST FOR REAL");
    console.log("   - 401k to employer match (free money, don't be dumb)");
    console.log("   - Roth IRA ($6k/year, tax-free growth)");
    console.log("   - Index funds (VTSAX and chill)");
    console.log("   - No crypto until the above is done");
    
    console.log("\n5️⃣ INCOME GROWTH");
    console.log("   - Your job should pay more every year or bounce");
    console.log("   - Side hustle that actually makes money");
    console.log("   - Skills that pay bills (coding, sales, trades)");
    
    console.log("\n📱 APPS THAT ACTUALLY HELP:");
    console.log("   - Mint/YNAB for budgeting");
    console.log("   - Fidelity/Vanguard for investing");
    console.log("   - Credit Karma for credit monitoring");
    console.log("   - Delete: All food delivery apps");
    
    console.log("\n🎮 MAKE IT A GAME:");
    console.log("   - Net worth = Your score");
    console.log("   - Monthly savings = XP gained");
    console.log("   - Debt paid = Bosses defeated");
    console.log("   - Financial independence = Final boss");
  }

  getContextualRoast(situation) {
    const roasts = {
      broke: "Broke at your big age? That's tough 💀",
      overspending: "You spend money like you print it in your basement 🖨️",
      no_savings: "Savings account looking like my patience - non-existent 🤏",
      bad_investment: "Your investment strategy is just gambling with extra steps 🎰"
    };
    
    return roasts[situation] || "Your financial situation is a whole meme 🤡";
  }

  getRealAdvice(situation) {
    const advice = {
      broke: "Get a job, a second job, or a sugar daddy. Pick your struggle.",
      overspending: "Track every penny for 30 days. You'll be shook.",
      no_savings: "Start with $10/week. That's 2 coffees. You'll survive.",
      bad_investment: "Buy index funds and stop trying to be Wolf of Wall Street."
    };
    
    return advice[situation] || "Stop doing dumb shit with your money.";
  }

  createActionPlan(situation) {
    return [
      "Week 1: Track all spending",
      "Week 2: Cut 3 unnecessary expenses",
      "Week 3: Set up automatic savings",
      "Week 4: Increase income (ask for raise, start side hustle)"
    ];
  }

  getHelpfulResources(situation) {
    return {
      books: ["I Will Teach You To Be Rich - Ramit Sethi", "The Simple Path to Wealth - JL Collins"],
      youtube: ["Two Cents", "The Financial Diet", "Graham Stephan"],
      reddit: ["r/personalfinance", "r/YNAB", "r/financialindependence"],
      podcasts: ["The Ramsey Show", "ChooseFI", "Afford Anything"]
    };
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args.join(' ') || 'help me';

async function main() {
  const roastingAI = new LeftOnReadCringeproofRoastingBudgetAI();
  
  // Simulate financial data (in real app, would pull from Plaid/bank APIs)
  const mockFinancialData = {
    income: 5000,
    expenses: {
      housing: 1500,
      food: 1200,
      transport: 500,
      entertainment: 800,
      misc: 900
    },
    transactions: [
      { description: "Starbucks", amount: 7.45, category: "food" },
      { description: "Amazon", amount: 127.99, category: "shopping" },
      { description: "Netflix", amount: 15.99, category: "subscription" }
    ]
  };
  
  await roastingAI.interact(command, mockFinancialData);
}

// Run the roasting AI
main().catch(error => {
  console.error('❌ AI malfunction (probably your fault):', error);
  process.exit(1);
});