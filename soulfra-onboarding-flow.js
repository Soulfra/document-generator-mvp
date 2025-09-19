/**
 * SOULFRA ONBOARDING FLOW
 * 
 * Interactive onboarding system that:
 * - Collects user profile information
 * - Links to authentication systems
 * - Builds comprehensive user context
 * - Integrates with login screen
 */

const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const chalk = require('chalk');
const ora = require('ora');
const { EventEmitter } = require('events');

class SoulFraOnboarding extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      profilePath: options.profilePath || path.join(process.env.HOME, '.soulfra', 'profile'),
      maxQuestions: 253, // Your mystical number
      categories: [
        'identity',
        'preferences', 
        'experience',
        'goals',
        'personality',
        'workflow',
        'security'
      ],
      ...options
    };
    
    this.state = {
      currentCategory: null,
      currentQuestion: 0,
      responses: {},
      profile: null,
      startTime: Date.now()
    };
    
    // Question bank organized by category
    this.questions = this.buildQuestionBank();
    
    // Create readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  
  /**
   * Build comprehensive question bank
   */
  buildQuestionBank() {
    return {
      identity: [
        {
          id: 'name',
          text: 'What should we call you?',
          type: 'text',
          required: true
        },
        {
          id: 'email',
          text: 'Your email address?',
          type: 'email',
          required: true,
          validate: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
        },
        {
          id: 'organization',
          text: 'Organization or company (optional)?',
          type: 'text',
          required: false
        },
        {
          id: 'role',
          text: 'Your primary role?',
          type: 'choice',
          choices: ['Developer', 'Designer', 'Manager', 'Researcher', 'Student', 'Other']
        },
        {
          id: 'location',
          text: 'Where are you based (timezone)?',
          type: 'text',
          default: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      ],
      
      preferences: [
        {
          id: 'auth_method',
          text: 'Preferred authentication method?',
          type: 'choice',
          choices: ['GitHub', 'Google', 'Microsoft', 'Discord', 'Anonymous']
        },
        {
          id: 'interface_mode',
          text: 'Preferred interface?',
          type: 'choice',
          choices: ['Web Dashboard', 'Terminal UI', 'Voice Control', 'API Only']
        },
        {
          id: 'theme',
          text: 'Visual theme preference?',
          type: 'choice',
          choices: ['Dark', 'Light', 'Auto', 'High Contrast']
        },
        {
          id: 'language',
          text: 'Preferred language?',
          type: 'choice',
          choices: ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese']
        },
        {
          id: 'notification_level',
          text: 'How much should we notify you?',
          type: 'choice',
          choices: ['Everything', 'Important only', 'Errors only', 'Never']
        }
      ],
      
      experience: [
        {
          id: 'tech_level',
          text: 'Technical experience level?',
          type: 'scale',
          min: 1,
          max: 10,
          labels: ['Beginner', 'Expert']
        },
        {
          id: 'coding_years',
          text: 'Years of coding experience?',
          type: 'number',
          min: 0,
          max: 50
        },
        {
          id: 'primary_languages',
          text: 'Primary programming languages (comma-separated)?',
          type: 'list',
          transform: (val) => val.split(',').map(l => l.trim())
        },
        {
          id: 'domains',
          text: 'Areas of expertise (select all that apply)?',
          type: 'multi-choice',
          choices: ['Web', 'Mobile', 'Backend', 'DevOps', 'AI/ML', 'Security', 'Data', 'Game Dev']
        },
        {
          id: 'tools',
          text: 'Favorite development tools?',
          type: 'text'
        }
      ],
      
      goals: [
        {
          id: 'primary_goal',
          text: 'What brings you to SoulFRA?',
          type: 'text',
          multiline: true
        },
        {
          id: 'use_cases',
          text: 'How will you use the system?',
          type: 'multi-choice',
          choices: ['Build MVPs', 'Document Analysis', 'Code Generation', 'Learning', 'Research', 'Automation']
        },
        {
          id: 'project_types',
          text: 'Types of projects you work on?',
          type: 'text'
        },
        {
          id: 'team_size',
          text: 'Typical team size?',
          type: 'choice',
          choices: ['Solo', '2-5', '6-20', '20-100', '100+']
        },
        {
          id: 'success_metric',
          text: 'How do you measure success?',
          type: 'text'
        }
      ],
      
      personality: [
        {
          id: 'work_style',
          text: 'How do you prefer to work?',
          type: 'choice',
          choices: ['Deep focus', 'Quick bursts', 'Collaborative', 'Structured', 'Flexible']
        },
        {
          id: 'learning_style',
          text: 'How do you learn best?',
          type: 'choice',
          choices: ['Reading docs', 'Video tutorials', 'Examples', 'Experimentation', 'Mentorship']
        },
        {
          id: 'decision_making',
          text: 'Decision-making style?',
          type: 'choice',
          choices: ['Data-driven', 'Intuitive', 'Consensus', 'Fast', 'Deliberate']
        },
        {
          id: 'risk_tolerance',
          text: 'Risk tolerance?',
          type: 'scale',
          min: 1,
          max: 10,
          labels: ['Conservative', 'Adventurous']
        },
        {
          id: 'communication',
          text: 'Communication preference?',
          type: 'choice',
          choices: ['Async text', 'Real-time chat', 'Video calls', 'Voice notes', 'In-person']
        }
      ],
      
      workflow: [
        {
          id: 'daily_coding_hours',
          text: 'Hours coding per day?',
          type: 'number',
          min: 0,
          max: 24
        },
        {
          id: 'peak_hours',
          text: 'Most productive time?',
          type: 'choice',
          choices: ['Early morning', 'Morning', 'Afternoon', 'Evening', 'Night owl']
        },
        {
          id: 'ide',
          text: 'Primary IDE/Editor?',
          type: 'choice',
          choices: ['VS Code', 'IntelliJ', 'Vim/Neovim', 'Emacs', 'Sublime', 'Other']
        },
        {
          id: 'version_control',
          text: 'Version control preference?',
          type: 'choice',
          choices: ['Git', 'SVN', 'Mercurial', 'None', 'Other']
        },
        {
          id: 'ai_usage',
          text: 'How often do you use AI tools?',
          type: 'choice',
          choices: ['Constantly', 'Daily', 'Weekly', 'Rarely', 'Never']
        }
      ],
      
      security: [
        {
          id: 'security_importance',
          text: 'How important is security to you?',
          type: 'scale',
          min: 1,
          max: 10,
          labels: ['Not important', 'Critical']
        },
        {
          id: 'backup_frequency',
          text: 'How often do you backup?',
          type: 'choice',
          choices: ['Real-time', 'Daily', 'Weekly', 'Monthly', 'Never']
        },
        {
          id: 'encryption_preference',
          text: 'Encryption preference?',
          type: 'choice',
          choices: ['Always encrypt', 'Sensitive only', 'When required', 'Not concerned']
        },
        {
          id: 'privacy_level',
          text: 'Privacy consciousness?',
          type: 'scale',
          min: 1,
          max: 10,
          labels: ['Open book', 'Very private']
        },
        {
          id: 'data_sharing',
          text: 'Comfortable sharing anonymized usage data?',
          type: 'boolean',
          default: true
        }
      ]
    };
  }
  
  /**
   * Start the onboarding flow
   */
  async start() {
    console.clear();
    
    // Show welcome screen
    await this.showWelcome();
    
    // Check if profile exists
    const existingProfile = await this.loadExistingProfile();
    
    if (existingProfile) {
      const update = await this.askQuestion({
        text: `Welcome back, ${existingProfile.identity.name}! Update your profile?`,
        type: 'boolean',
        default: false
      });
      
      if (!update) {
        this.state.profile = existingProfile;
        return this.complete();
      }
      
      // Load existing responses for updates
      this.state.responses = this.flattenProfile(existingProfile);
    }
    
    // Run through categories
    for (const category of this.config.categories) {
      await this.processCategory(category);
    }
    
    // Build final profile
    await this.buildProfile();
    
    // Complete onboarding
    return this.complete();
  }
  
  /**
   * Show welcome screen
   */
  async showWelcome() {
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                         SOULFRA ONBOARDING                                ║
║                                                                           ║
║         Your voice is your digital DNA. Let's get to know you.            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
    `));
    
    console.log(chalk.gray(`
This onboarding will help us:
  • Set up your authentication preferences
  • Understand your workflow and goals  
  • Configure the system for your needs
  • Link everything to your personal login

The process takes about 5-10 minutes.
    `));
    
    await this.pause(2000);
  }
  
  /**
   * Process a category of questions
   */
  async processCategory(category) {
    const questions = this.questions[category];
    if (!questions || questions.length === 0) return;
    
    console.log(chalk.yellow(`\n━━━ ${category.toUpperCase()} ━━━`));
    
    for (const question of questions) {
      // Skip if already answered and not required
      if (this.state.responses[question.id] && !question.required) {
        continue;
      }
      
      const response = await this.askQuestion(question);
      if (response !== undefined && response !== null && response !== '') {
        this.state.responses[question.id] = response;
      }
      
      // Progress indicator
      this.state.currentQuestion++;
      this.showProgress();
    }
  }
  
  /**
   * Ask a single question
   */
  async askQuestion(question) {
    const prompt = this.buildPrompt(question);
    
    switch (question.type) {
      case 'text':
      case 'email':
        return this.askText(prompt, question);
        
      case 'number':
        return this.askNumber(prompt, question);
        
      case 'boolean':
        return this.askBoolean(prompt, question);
        
      case 'choice':
        return this.askChoice(prompt, question);
        
      case 'multi-choice':
        return this.askMultiChoice(prompt, question);
        
      case 'scale':
        return this.askScale(prompt, question);
        
      case 'list':
        return this.askList(prompt, question);
        
      default:
        return this.askText(prompt, question);
    }
  }
  
  /**
   * Build prompt string
   */
  buildPrompt(question) {
    let prompt = chalk.cyan(`\n${question.text}`);
    
    if (question.default !== undefined) {
      prompt += chalk.gray(` (default: ${question.default})`);
    }
    
    if (!question.required) {
      prompt += chalk.gray(' (optional)');
    }
    
    return prompt;
  }
  
  /**
   * Ask text question
   */
  async askText(prompt, question) {
    return new Promise((resolve) => {
      this.rl.question(prompt + '\n> ', (answer) => {
        if (!answer && question.default !== undefined) {
          answer = question.default;
        }
        
        if (question.validate && !question.validate(answer)) {
          console.log(chalk.red('Invalid input, please try again.'));
          return resolve(this.askText(prompt, question));
        }
        
        if (question.transform) {
          answer = question.transform(answer);
        }
        
        resolve(answer);
      });
    });
  }
  
  /**
   * Ask choice question
   */
  async askChoice(prompt, question) {
    console.log(prompt);
    
    question.choices.forEach((choice, i) => {
      console.log(chalk.gray(`  ${i + 1}. ${choice}`));
    });
    
    return new Promise((resolve) => {
      this.rl.question('> ', (answer) => {
        const index = parseInt(answer) - 1;
        
        if (index >= 0 && index < question.choices.length) {
          resolve(question.choices[index]);
        } else {
          console.log(chalk.red('Please select a valid option.'));
          resolve(this.askChoice(prompt, question));
        }
      });
    });
  }
  
  /**
   * Ask scale question
   */
  async askScale(prompt, question) {
    const scalePrompt = `${prompt}\n${chalk.gray(`[${question.min}] ${question.labels[0]} ← → ${question.labels[1]} [${question.max}]`)}`;
    
    return new Promise((resolve) => {
      this.rl.question(scalePrompt + '\n> ', (answer) => {
        const value = parseInt(answer);
        
        if (value >= question.min && value <= question.max) {
          resolve(value);
        } else {
          console.log(chalk.red(`Please enter a number between ${question.min} and ${question.max}.`));
          resolve(this.askScale(prompt, question));
        }
      });
    });
  }
  
  /**
   * Ask boolean question
   */
  async askBoolean(prompt, question) {
    const boolPrompt = `${prompt} ${chalk.gray('[y/n]')}`;
    
    return new Promise((resolve) => {
      this.rl.question(boolPrompt + '\n> ', (answer) => {
        const normalized = answer.toLowerCase().trim();
        
        if (normalized === 'y' || normalized === 'yes') {
          resolve(true);
        } else if (normalized === 'n' || normalized === 'no') {
          resolve(false);
        } else if (!answer && question.default !== undefined) {
          resolve(question.default);
        } else {
          console.log(chalk.red('Please answer y or n.'));
          resolve(this.askBoolean(prompt, question));
        }
      });
    });
  }
  
  /**
   * Build profile from responses
   */
  async buildProfile() {
    const profileId = this.state.profile?.profileId || `soulfra-${crypto.randomUUID()}`;
    
    this.state.profile = {
      profileId,
      version: '1.0.0',
      created: this.state.profile?.created || new Date().toISOString(),
      updated: new Date().toISOString(),
      
      // Group responses by category
      identity: this.extractCategory('identity'),
      preferences: this.extractCategory('preferences'),
      experience: this.extractCategory('experience'),
      goals: this.extractCategory('goals'),
      personality: this.extractCategory('personality'),
      workflow: this.extractCategory('workflow'),
      security: this.extractCategory('security'),
      
      // Metadata
      metadata: {
        completionTime: Date.now() - this.state.startTime,
        questionsAnswered: Object.keys(this.state.responses).length,
        lastActivity: new Date().toISOString()
      },
      
      // Integration tokens (to be filled by auth system)
      integrations: {
        auth: null,
        github: null,
        services: []
      }
    };
  }
  
  /**
   * Extract category responses
   */
  extractCategory(category) {
    const result = {};
    const questions = this.questions[category];
    
    for (const question of questions) {
      if (this.state.responses[question.id] !== undefined) {
        result[question.id] = this.state.responses[question.id];
      }
    }
    
    return result;
  }
  
  /**
   * Complete onboarding
   */
  async complete() {
    // Save profile
    await this.saveProfile();
    
    // Show completion
    console.clear();
    console.log(chalk.green(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                    ✨ ONBOARDING COMPLETE! ✨                             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
    `));
    
    console.log(chalk.cyan('\nYour profile has been created:'));
    console.log(chalk.gray(`  Profile ID: ${this.state.profile.profileId}`));
    console.log(chalk.gray(`  Name: ${this.state.profile.identity.name}`));
    console.log(chalk.gray(`  Auth: ${this.state.profile.preferences.auth_method}`));
    
    // Integration instructions
    console.log(chalk.yellow('\n📱 Next Steps:'));
    console.log('  1. Your login screen is now personalized');
    console.log('  2. Authentication is configured for ' + this.state.profile.preferences.auth_method);
    console.log('  3. Voice recognition is calibrated to your preferences');
    
    console.log(chalk.cyan('\n🚀 Ready to launch your personal OS!'));
    
    this.rl.close();
    
    // Emit completion event
    this.emit('complete', this.state.profile);
    
    return this.state.profile;
  }
  
  /**
   * Save profile to disk
   */
  async saveProfile() {
    const profilePath = path.join(this.config.profilePath, 'user.json');
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(profilePath), { recursive: true });
    
    // Save profile
    await fs.writeFile(
      profilePath,
      JSON.stringify(this.state.profile, null, 2)
    );
    
    // Save backup with timestamp
    const backupPath = path.join(
      this.config.profilePath,
      `user-${Date.now()}.json`
    );
    await fs.writeFile(
      backupPath,
      JSON.stringify(this.state.profile, null, 2)
    );
  }
  
  /**
   * Load existing profile
   */
  async loadExistingProfile() {
    try {
      const profilePath = path.join(this.config.profilePath, 'user.json');
      const data = await fs.readFile(profilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Show progress
   */
  showProgress() {
    const totalQuestions = Object.values(this.questions)
      .reduce((sum, cat) => sum + cat.length, 0);
    
    const progress = Math.round((this.state.currentQuestion / totalQuestions) * 100);
    
    // Don't show for every question, just milestones
    if (progress % 20 === 0 && progress > 0) {
      console.log(chalk.gray(`\n[${this.getProgressBar(progress)}] ${progress}% complete\n`));
    }
  }
  
  /**
   * Get progress bar
   */
  getProgressBar(progress) {
    const filled = Math.round(progress / 5);
    const empty = 20 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }
  
  /**
   * Utility functions
   */
  pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  flattenProfile(profile) {
    const flat = {};
    
    for (const category of this.config.categories) {
      if (profile[category]) {
        Object.assign(flat, profile[category]);
      }
    }
    
    return flat;
  }
}

// Export for use in other modules
module.exports = SoulFraOnboarding;

// Run if called directly
if (require.main === module) {
  const onboarding = new SoulFraOnboarding();
  
  onboarding.on('complete', (profile) => {
    console.log(chalk.green('\n✅ Profile saved successfully!'));
    
    // Launch next step based on preferences
    if (profile.preferences.interface_mode === 'Web Dashboard') {
      console.log(chalk.cyan('\nLaunching web dashboard...'));
      require('child_process').exec('open http://localhost:8080/soulfra-control-center.html');
    } else if (profile.preferences.interface_mode === 'Terminal UI') {
      console.log(chalk.cyan('\nLaunching terminal interface...'));
      require('child_process').spawn('node', ['soulfra-auth-tui.js'], {
        stdio: 'inherit'
      });
    }
  });
  
  onboarding.start().catch(console.error);
}